const CACHE_NAME = 'pss-registro-v1';
const assets = [
    './',
    './index.html',
    './style.css',
    './app.js',
    'https://cdn.jsdelivr.net/npm/lucide@0.344.0/dist/umd/lucide.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(assets))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
