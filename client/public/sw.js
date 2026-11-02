// PawPal PWA: offline navigation fallback only.
// Never cache API requests, audio, session data, battle state, or build assets here.
const OFFLINE_CACHE = "pawpal-offline-v1";
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(OFFLINE_CACHE)
            .then((cache) => cache.add(OFFLINE_PAGE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(async (keys) => {
            await Promise.all(keys.filter((key) => key.startsWith("pawpal-offline-") && key !== OFFLINE_CACHE).map((key) => caches.delete(key)));
            await self.clients.claim();
        })
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.mode !== "navigate" || request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(request).catch(async () => {
            const cache = await caches.open(OFFLINE_CACHE);
            return (await cache.match(OFFLINE_PAGE)) || Response.error();
        })
    );
});
