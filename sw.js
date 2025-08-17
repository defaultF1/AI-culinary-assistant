
// A unique name for the cache, updated to trigger a new install
const CACHE_NAME = 'ai-culinary-companion-v2';

// The list of core files for the app shell
const CORE_URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/logo.svg',
  '/manifest.json'
];

// Install event: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets');
        return cache.addAll(CORE_URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Force activation of the new service worker
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of open pages
  );
});

// Fetch event: Apply caching strategies
self.addEventListener('fetch', event => {
  // We only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Strategy 1: Stale-While-Revalidate for external CDN assets
  // This serves from cache for speed, but updates in the background.
  if (url.origin === 'https://cdn.tailwindcss.com' || url.origin === 'https://unpkg.com' || url.origin === 'https://accounts.google.com' || url.origin === 'https://esm.sh') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            // If we get a valid response, update the cache
            if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });

          // Return the cached response immediately if available, otherwise wait for the network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy 2: Cache First for our own app shell assets
  // Ideal for files that only change when the app version updates.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the request is in the cache, return it
        if (response) {
          return response;
        }
        // Otherwise, fetch from the network.
        return fetch(event.request);
      }
    )
  );
});
