// キャッシュ名。オフライン用の保険であり、オンライン時は常にネットワークを優先するため
// 通常の更新ではこの値を上げる必要はない（古いキャッシュは activate 時に破棄される）
const CACHE_NAME = "health-records-cache-v3";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/db.js",
  "./js/fields.js",
  "./js/backup.js",
  "./js/utils/date.js",
  "./js/utils/canvas-chart.js",
  "./js/views/dashboard.js",
  "./js/views/history.js",
  "./js/views/form.js",
  "./js/views/charts.js",
  "./icons/icon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 常にネットワークを優先し、取得できたら都度キャッシュを更新する。
  // オフラインの時だけキャッシュ（最後に取得できた内容）にフォールバックする。
  // これにより、HTML/JS/CSSのどれかだけが古いまま残る不整合が起きない。
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "default")) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
