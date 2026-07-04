const CACHE_NAME = "local-loop-golf-v133-account-sign-in";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/enter-score.png",
  "./assets/gps-grey.png",
  "./assets/gps-pink.png",
  "./assets/home.png",
  "./assets/icon.svg",
  "./assets/pinscope-app-icon.png",
  "./assets/pinscope-icon-192.png",
  "./assets/pinscope-icon-512.png",
  "./assets/pinscope-complete-logo.png",
  "./assets/pinscope-name-logo.png",
  "./src/app.js",
  "./src/account-sync.js",
  "./src/arcgisImageryLayer.js",
  "./src/arcgisSession.js",
  "./src/course-data.js",
  "./src/cranham-map-data.js",
  "./src/local-area.js",
  "./src/osm.js",
  "./src/storage.js",
  "./src/supabase-config.js",
  "./src/styles.css",
  "./src/verified-courses.js",
  "./src/verified-green-defaults.js",
  "./src/shared-course-defaults.js",
  "./src/shot-marker-drag-patch.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
