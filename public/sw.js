const CACHE_NAME = 'd10g3n-next-v1';
const CORE = ['/', '/web.json', '/manifest.json', '/assets/placeholder.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Native media requests must keep byte-range behavior for seeking.
  if (request.headers.has('range') || url.pathname.startsWith('/assets/audio/')) return;

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())));
        }
        return response;
      })),
    );
    return;
  }

  if (request.mode === 'navigate' || /\.(?:html|json|css|js)$/.test(url.pathname)) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())));
        }
        return response;
      }).catch(async () => (await caches.match(request)) || Response.error()),
    );
  }
});
