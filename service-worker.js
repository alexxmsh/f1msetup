// Nome della cache
const CACHE_NAME = 'f1msetup-cache-v1';

// Elenco delle risorse da memorizzare nella cache
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'presets.json',
    'script.js',
    'app.js',
    'manifest.json',
    'assets/ico512.png',
    'assets/ico192_maskable.png',
    'assets/ico512_maskable.png',
    'assets/ico180.png',
    'assets/ico32.png',
    'assets/ico16.png',
    'fonts/kanit/Kanit-Regular.ttf'
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
                    if (cacheName!== CACHE_NAME) {
                        console.log('Cache rimossa:', cacheName);
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
        // Strategia Network First: prova a recuperare dalla rete prima
        fetch(event.request)
          .then(function(networkResponse) {
                // Se la richiesta di rete ha successo, memorizza la risposta nella cache
                // e restituiscila
                console.log('Risorsa recuperata dalla rete:', event.request.url);
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                return networkResponse;
            })
          .catch(function() {
                // Se la richiesta di rete fallisce, recupera la risorsa dalla cache
                console.log('Risorsa recuperata dalla cache:', event.request.url);
                return caches.match(event.request)
                  .then(function(cachedResponse) {
                        if (cachedResponse) {
                            return cachedResponse;
                        } else {
                            // Se la risorsa non è nella cache, restituisci un errore
                            console.error('Risorsa non trovata nella cache:', event.request.url);
                            return new Response('Risorsa non disponibile offline', { status: 503 });
                        }
                    });
            })
    );
});
