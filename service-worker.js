// Durante l'installazione, precarica le risorse essenziali
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('static-v1').then((cache) => {
            return cache.addAll([
                '/',
                'index.html',
                'style.css',
                'presets.json',
                'script.js',
                'app.js',
                'assets/ico192_maskable.png',
                'assets/ico512_maskable.png'
            ]);
        })
    );
    self.skipWaiting(); // Forza l'attivazione immediata
});

// Durante l'attivazione, pulisci le vecchie cache
self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['static-v1', 'dynamic-v1']; // Cache attuali
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Controlla immediatamente i client
});

// Gestione delle richieste con strategia Network First
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Se la rete risponde, salva una copia nella cache dinamica
                const responseClone = response.clone();
                caches.open('dynamic-v1').then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response; // Restituisci la risposta dalla rete
            })
            .catch(() => {
                // Se la rete non è disponibile, cerca nella cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Fallback per richieste specifiche (esempio: JSON o HTML)
                    if (event.request.url.endsWith('.json')) {
                        return caches.match('presets.json');
                    } else if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('index.html');
                    }
                });
            })
    );
});
