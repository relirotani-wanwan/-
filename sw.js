
const CACHE_NAME = "cosplay-craft-manager-v1.2.1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

// インストール時に最新ファイルを取得
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_FILES)
    ).then(() => self.skipWaiting())
  );
});

// 古いキャッシュだけ削除する
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name =>
            name.startsWith("cosplay-craft-manager-") &&
            name !== CACHE_NAME
          )
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// HTMLはオンラインなら最新を優先
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  const isHTML =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html");

  if (isHTML) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, copy)
          );
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match("./index.html")
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request)
    )
  );
});
