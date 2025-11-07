// @ts-nocheck
const CACHE_NAME = 'finance-app-v25-github-deploy'; // Versão final para forçar a atualização.

// Todos os assets necessários para o app funcionar offline.
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/index.css',
    '/icon.svg',
    '/index.tsx',
    '/firebase-config.js',
    '/manifest.json'
];

self.addEventListener('install', evt => {
    console.log('[Service Worker] Instalando...');
    evt.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cacheando assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', evt => {
    console.log('[Service Worker] Ativando...');
    evt.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', evt => {
    if (evt.request.method !== 'GET' || evt.request.url.includes('firestore.googleapis.com')) {
        return;
    }

    evt.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return fetch(evt.request)
                .then(networkResponse => {
                    cache.put(evt.request, networkResponse.clone());
                    return networkResponse;
                })
                .catch(() => {
                    return cache.match(evt.request).then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Fallback para a página principal se for uma navegação e estiver offline
                        if (evt.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response(null, { status: 404, statusText: "Not Found" });
                    });
                });
        })
    );
});
