/* Offline support: once a team member has signed in on a device, the app keeps working with
 * no signal (basements, well houses). Sign-in pages, API calls and media are never cached,
 * and nothing is cached from a response that was redirected to the sign-in page. */
const CACHE = "safeco-v5";
const SHELL = [
  "css/styles.css", "js/data.js", "js/ewg-parse.js", "js/app.js",
  "assets/logo.png", "assets/system.jpg", "assets/product-sheet.jpg", "assets/icon-192.png", "assets/icon-512.png",
  "manifest.webmanifest",
];
const APP_PAGES = ["/", "/index.html", "/view", "/view.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const cacheable = (r) => r && r.ok && !r.redirected && r.type === "basic";
function store(req, res) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { if (res.ok) store(req, res); return res; })));
    return;
  }
  if (url.origin !== location.origin) return;
  const p = url.pathname;
  if (p.startsWith("/api/") || p.startsWith("/login") || p.startsWith("/assets/media/") || p === "/js/login.js") return;

  if (req.mode === "navigate") {
    const key = p.startsWith("/view") ? "/view" : "/";
    e.respondWith(
      fetch(req).then((res) => { if (cacheable(res) && APP_PAGES.includes(p)) store(key, res); return res; })
        .catch(() => caches.match(key).then((r) => r || Response.error()))
    );
    return;
  }
  e.respondWith(
    fetch(req).then((res) => { if (cacheable(res)) store(req, res); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || Response.error()))
  );
});
