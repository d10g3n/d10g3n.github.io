const CACHE_VERSION = '1.0.202602151336';
const CACHE_NAME = `d10g3n-music-v${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  // JS files removed - always load fresh from server
  '/web.json',
  '/manifest.json',
  '/assets/placeholder.svg'
];

// Install service worker
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch with Network First strategy for HTML/JS/CSS, Cache First for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache JS files - always fetch from network
  if (url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
    );
    return;
  }

  // If file has version parameter (?v=), always fetch from network (bypass cache)
  if (url.searchParams.has('v')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => {
          // Only fallback to cache if network completely fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Network first for HTML, CSS, JSON
  if (
    event.request.method === 'GET' &&
    (url.pathname.endsWith('.html') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.json') ||
     url.pathname === '/')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'reload' })
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  } else {
    // Cache first for images and audio
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
    );
  }
});

// Update service worker and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});
