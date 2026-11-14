
const CACHE = 'toep-v4';

const FILES = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './monetization.js',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './Nayade-1961-jpeg.jpg'
];

// App installeren en bestanden opslaan
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => {
            return cache.addAll(FILES);
        })
    );

    self.skipWaiting();
});

// Oude cacheversies verwijderen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key.startsWith('toep-') && key !== CACHE)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Eerst internet proberen, anders offline cache
self.addEventListener('fetch', event => {
    const request = event.request;

    if (
        request.method !== 'GET' ||
        new URL(request.url).origin !== self.location.origin
    ) {
        return;
    }

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE);

            try {
                const response = await fetch(request, {
                    cache: 'no-cache'
                });

                if (response.ok) {
                    await cache.put(request, response.clone());
                }

                return response;
            } catch (error) {
                const cached = await cache.match(request);

                if (cached) {
                    return cached;
                }

                throw error;
            }
        })()
    );
});
