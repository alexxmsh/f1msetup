// Nome della cache
const CACHE_NAME = 'f1msetup-cache-v2-prerel04';

// Elenco delle risorse da memorizzare nella cache
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './presets.json',
    './presets.js',
    './script.js',
    './manifest.json',
    './assets/ico512.png',
    './assets/ico192_maskable.png',
    './assets/ico512_maskable.png',
    './assets/ico180.png',
    './assets/ico32.png',
    './assets/ico16.png',
    './fonts/kanit/Kanit-Regular.ttf'
];

// Installazione del Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
          .then(function(cache) {
                console.log('Cache aperta:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
    );
});

// Attivazione del Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Cache obsoleta rimossa:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Gestione delle richieste di recupero
self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request)
          .then(function(networkResponse) {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME)
                      .then(function(cache) {
                            cache.put(event.request, responseClone);
                        });
                }
                return networkResponse;
            })
          .catch(function() {
                return caches.match(event.request)
                  .then(function(cachedResponse) {
                        if (cachedResponse) {
                            return cachedResponse;
                        } else {
                            return new Response('Risorsa non disponibile offline', { status: 503 });
                        }
                    });
            })
    );
});
