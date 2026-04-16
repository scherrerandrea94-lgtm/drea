const CACHE_VERSION = 'drea-v1';
const APP_ASSETS = ['/', '/index.html', '/manifest.json'];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: purge old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-only for Firebase/APIs, stale-while-revalidate for app assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-only for Firebase Realtime Database, Auth, and Anthropic API
  const networkOnly = [
    'firebaseio.com',
    'googleapis.com',
    'identitytoolkit.googleapis.com',
    'api.anthropic.com',
  ];
  if (networkOnly.some(host => url.hostname.includes(host))) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Stale-while-revalidate for everything else (CDN scripts, app shell)
  event.respondWith(
    caches.open(CACHE_VERSION).then(cache =>
      cache.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response && response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => null);

        return cached || networkFetch;
      })
    )
  );
});
