/* Build-time values are filled by scripts/tend-precache.mjs. */
const CACHE_PREFIX = "tend-app-";
const CACHE_NAME = CACHE_PREFIX + "__PRECACHE_VERSION__";
const PRECACHE = "__PRECACHE_MANIFEST__";
const offlinePage = "/index.html";

self.addEventListener("install", (event) => {
  // A failed asset fails the installation: never replace a complete offline book
  // with a partially downloaded update. Updates wait until the old tabs close.
  event.waitUntil(
    (async () => {
      if (!Array.isArray(PRECACHE))
        throw new Error("Offline asset list was not built");
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(
        PRECACHE.map((url) => new Request(url, { cache: "reload" })),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  )
    return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        // Use the fresh document online. Every deep query is the same book offline;
        // its state remains in localStorage, outside these asset caches.
        try {
          const response = await fetch(request);
          if (response.ok) return response;
        } catch {
          /* the saved book below is available without the network */
        }
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(offlinePage, { ignoreVary: true })) ||
          Response.error()
        );
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // These are public same-origin files. Preview hosts can send Vary: Origin,
      // while a module/font request has an Origin header that precache fetches do
      // not. Match the saved file independently of that transport-only variance.
      const cached = await cache.match(request, {
        ignoreSearch: true,
        ignoreVary: true,
      });
      if (cached) return cached;
      // Runtime caching is only for successful same-origin static responses. Never
      // cache errors or opaque third-party responses.
      const response = await fetch(request);
      if (response.ok && response.type === "basic")
        await cache.put(request, response.clone());
      return response;
    })(),
  );
});
