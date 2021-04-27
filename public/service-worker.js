const FILES_TO_CACHE = [
    "/", 
    "/index.html",
    "/index.js", 
    "/db.js", 
    "/styles.css",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png"
];

const PRECACHE = "precache-v1";
const RUNTIME = "runtime";

// install
self.addEventListener(`install`, (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => {
      console.log(`Your files were pre-cached successfully!`);
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// activate
self.addEventListener("activate", (event) => {
  const currentCaches = [PRECACHE, RUNTIME];  
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// fetch
self.addEventListener(`fetch`, (evt) => {
  if (evt.request.url.includes(`/api/`)) {
    evt.respondWith(
      caches
        .open(RUNTIME)
        .then((cache) =>
          fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }

              return response;
            })
            // Network request failed, try to get it from the cache.
            .catch(() => cache.match(evt.request))
        )
        .catch((err) => console.log(err))
    );
  } else {
    evt.respondWith(
      caches
        .match(evt.request)
        .then((response) => response || fetch(evt.request))
    );
  }
});