const CACHE_NAME = "south-diamond-app-v40";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/login9493",
  "/admin9493",
  "/messages9493",
  "/styles.css",
  "/script.js",
  "/slots-arcade.html",
  "/slots-arcade.css",
  "/slots-arcade.js",
  "/slots-config.js",
  "/slots-admin.js",
  "/manifest.webmanifest",
  "/admin.webmanifest",
  "/assets/app-icon.svg",
  "/assets/hero-gaming.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== location.origin || requestUrl.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});
