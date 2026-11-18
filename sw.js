/* Offline support: the app keeps working in basements and well houses. */
const CACHE = "safeco-proposals-v2";
const SHELL = [
  "./", "index.html", "css/styles.css", "js/data.js", "js/ewg-parse.js", "js/app.js",
  "assets/logo.png", "assets/system.jpg", "assets/product-sheet.jpg", "assets/icon-192.png", "assets/icon-512.png",
  "manifest.webmanifest",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.includes("/api/") || url.pathname.includes("/assets/media/")) return; // stream video/audio from the network
  // network first for our own files (so updates land), cache fallback when offline
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
    );
  } else if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })));
  }
});
