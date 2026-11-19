/* Shared helpers for SafeCo SmartWater System sign-in.
 * Team accounts and the sign-in sheet live in the project's private Vercel Blob store.
 *   auth/users.json          team accounts (passwords stored as salted scrypt hashes)
 *   auth/log/YYYY-MM.json    sign-in sheet, one file per month
 * Sessions are a signed cookie (HMAC-SHA256); middleware.js checks the same signature.
 */
const crypto = require("crypto");
const { put, get } = require("@vercel/blob");

const USERS = "auth/users.json";
const COOKIE = "sc_session";
const SHORT_SESSION = 12 * 60 * 60;        // 12 hours
const LONG_SESSION = 30 * 24 * 60 * 60;    // 30 days ("keep me signed in")
const LOCK_WINDOW = 15 * 60 * 1000;        // 15 minutes
const LOCK_AFTER = 5;                      // failed attempts before a lockout

/* ---------- storage ---------- */
async function readJSON(path, fallback) {
  try {
    const r = await get(path, { access: "private", useCache: false });
    if (!r || !r.stream) return fallback;
    return JSON.parse(await new Response(r.stream).text());
  } catch (e) {
    if (e && /not.?found/i.test(String(e.name || e.message))) return fallback;
    throw e;
  }
}
async function writeJSON(path, data) {
  await put(path, JSON.stringify(data), { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json", cacheControlMaxAge: 60 });
}
async function getUsers() { return (await readJSON(USERS, { users: [] })).users || []; }
async function saveUsers(users) { await writeJSON(USERS, { users }); }

/* ---------- passwords ---------- */
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}
function checkPassword(user, password) {
  if (!user || !user.salt || !user.hash) return false;
  const { hash } = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.hash, "hex"));
}
function passwordProblem(pw) {
  if (!pw || String(pw).length < 8) return "Use at least 8 characters for the password.";
  return null;
}

/* ---------- sessions ---------- */
function secretKey() {
  const base = process.env.AUTH_SECRET || ("safeco-session|" + (process.env.BLOB_READ_WRITE_TOKEN || ""));
  return crypto.createHash("sha256").update(base).digest();
}
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function signSession(user, long) {
  const maxAge = long ? LONG_SESSION : SHORT_SESSION;
  const body = b64u(JSON.stringify({ sub: user.id, n: user.name, r: user.role, exp: Math.floor(Date.now() / 1000) + maxAge }));
  const sig = b64u(crypto.createHmac("sha256", secretKey()).update(body).digest());
  return { token: body + "." + sig, maxAge };
}
function readSession(req) {
  const raw = parseCookies(req)[COOKIE];
  if (!raw || raw.indexOf(".") < 0) return null;
  const [body, sig] = raw.split(".");
  const expect = b64u(crypto.createHmac("sha256", secretKey()).update(body).digest());
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const s = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    return s.exp > Date.now() / 1000 ? s : null;
  } catch (e) { return null; }
}
function sessionCookie(token, maxAge) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach((p) => { const i = p.indexOf("="); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}

/* the signed-in user, re-checked against the team list (so removed reps lose access) */
async function currentUser(req) {
  const s = readSession(req);
  if (!s) return null;
  const u = (await getUsers()).find((x) => x.id === s.sub);
  return u && u.active !== false ? u : null;
}
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active !== false, created: u.created, lastLogin: u.lastLogin || null });

/* ---------- sign-in sheet ---------- */
function device(ua) {
  ua = String(ua || "");
  const os = /iPad/.test(ua) ? "iPad" : /iPhone/.test(ua) ? "iPhone" : /Android/.test(ua) ? (/Mobile/.test(ua) ? "Android phone" : "Android tablet") : /Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows PC" : /CrOS/.test(ua) ? "Chromebook" : /Linux/.test(ua) ? "Linux" : "Device";
  const br = /Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${os} · ${br}`;
}
function place(req) {
  const h = (k) => { try { return decodeURIComponent(req.headers[k] || ""); } catch (e) { return req.headers[k] || ""; } };
  return [h("x-vercel-ip-city"), h("x-vercel-ip-country-region")].filter(Boolean).join(", ");
}
const monthKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 7);
async function logEvent(req, ev) {
  const entry = Object.assign({ t: Date.now(), device: device(req.headers["user-agent"]), place: place(req), ip: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() }, ev);
  const path = `auth/log/${monthKey(entry.t)}.json`;
  try {
    const list = await readJSON(path, []);
    list.push(entry);
    await writeJSON(path, list.slice(-5000));
  } catch (e) { console.error("sign-in sheet write failed", e); }
}
async function readLog(months = 2) {
  const keys = [];
  const d = new Date();
  for (let i = 0; i < months; i++) { keys.push(monthKey(new Date(d.getFullYear(), d.getMonth() - i, 15).getTime())); }
  const parts = await Promise.all(keys.map((k) => readJSON(`auth/log/${k}.json`, [])));
  return parts.flat().sort((a, b) => b.t - a.t);
}
async function isLocked(email) {
  const since = Date.now() - LOCK_WINDOW;
  const log = await readJSON(`auth/log/${monthKey()}.json`, []);
  const fails = log.filter((e) => e.email === email && e.t > since && e.type === "failed");
  const lastOk = log.filter((e) => e.email === email && (e.type === "login" || e.type === "password-reset")).reduce((m, e) => Math.max(m, e.t), 0);
  return fails.filter((e) => e.t > lastOk).length >= LOCK_AFTER;
}

/* ---------- request helpers ---------- */
async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}
const normEmail = (e) => String(e || "").trim().toLowerCase();
function noStore(res) { res.setHeader("Cache-Control", "no-store"); }

module.exports = {
  getUsers, saveUsers, hashPassword, checkPassword, passwordProblem, signSession, readSession, sessionCookie, clearCookie,
  currentUser, publicUser, logEvent, readLog, isLocked, body, normEmail, noStore, crypto,
};
