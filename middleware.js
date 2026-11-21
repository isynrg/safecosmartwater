/* Vercel Routing Middleware: the whole rep tool requires a signed-in team member.
 * Public (no sign-in): the sign-in page, the homeowner proposal view (/view), and the
 * shared static files those two pages need. Everything else — the rep app, pricing,
 * and the APIs — needs a valid session cookie signed by api/_lib/auth.js.
 */
import { next } from "@vercel/functions";

const PUBLIC = [
  /^\/login(\.html)?$/,
  /^\/view(\.html)?$/,
  /^\/demo(\.html)?$/,
  /^\/api\/auth\/(login|setup|status|logout)$/,
  /^\/assets\//,
  /^\/css\//,
  /^\/js\/(data|ewg-parse|app|login|landing|demo-link)\.js$/,
  /^\/(manifest\.webmanifest|sw\.js|favicon\.ico|robots\.txt)$/,
];

const enc = new TextEncoder();
const b64uToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function key() {
  const base = process.env.AUTH_SECRET || "safeco-session|" + (process.env.BLOB_READ_WRITE_TOKEN || "");
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(base));
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
}

async function validSession(request) {
  const m = (request.headers.get("cookie") || "").match(/(?:^|;\s*)sc_session=([^;]+)/);
  if (!m) return false;
  const [body, sig] = decodeURIComponent(m[1]).split(".");
  if (!body || !sig) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), b64uToBytes(sig), enc.encode(body));
    if (!ok) return false;
    const s = JSON.parse(new TextDecoder().decode(b64uToBytes(body)));
    return s.exp > Date.now() / 1000;
  } catch (e) {
    return false;
  }
}

export default async function middleware(request) {
  const url = new URL(request.url);
  if (PUBLIC.some((re) => re.test(url.pathname))) return next();
  if (await validSession(request)) return next();

  const wantsPage = request.method === "GET" && (request.headers.get("accept") || "").includes("text/html");
  if (wantsPage) {
    const login = new URL("/login", url);
    if (url.pathname !== "/" && url.pathname !== "/index.html") login.searchParams.set("next", url.pathname + url.search);
    return Response.redirect(login, 302);
  }
  return new Response(JSON.stringify({ error: "Please sign in." }), { status: 401, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

export const config = { matcher: "/:path*" };
