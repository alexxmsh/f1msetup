const CACHE_PREFIX = `f1msetup-cache:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}2026-11-10`;

const APP_FILES = [
    './',
    './index.html',
    './style.css',
    './presets.js',
    './script.js',
    './manifest.json',
    './favicon.ico',
    './assets/apple-touch-icon.png',
    './assets/ico16.png',
    './assets/ico32.png',
    './assets/ico48.png',
    './assets/ico96.png',
    './assets/ico180.png',
    './assets/ico192_maskable.png',
    './assets/ico512.png',
    './assets/ico512_maskable.png',
    './assets/screenshot_land.png',
    './assets/screenshot_port.png',
    './fonts/kanit/Kanit-Regular.ttf'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(names => Promise.all(
        names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map(name => caches.delete(name))
    )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) {
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        let response;
        try {
            response = await fetch(request);
        } catch {
            const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
            return cached || new Response('Risorsa non disponibile offline', { status: 503 });
        }

        if (response.ok && response.type === 'basic' && response.status !== 206) {
            try {
                await cache.put(request, response.clone());
            } catch (error) {
                console.warn('Risorsa non salvata nella cache:', error);
            }
        }
        return response;
    })());
});
