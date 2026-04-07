/* AlwaysReady Care — Service Worker for Offline Support */
var CACHE_NAME = 'arc-v2';
var ASSETS = [
  '/apps/always-ready-care/',
  '/apps/always-ready-care/index.html',
  '/apps/always-ready-care/css/app.css',
  '/apps/always-ready-care/js/app.js',
  '/apps/always-ready-care/guide.html',
  '/apps/always-ready-care/manifest.json',
  '/apps/always-ready-care/icons/icon-192.png',
  '/apps/always-ready-care/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install — cache app shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip Firebase/Google API calls — always network
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit') ||
      url.hostname.includes('securetoken')) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Cache successful responses
      if (response.ok && event.request.method === 'GET') {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Offline — serve from cache
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('Offline — please reconnect to continue.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

// Listen for sync events (for queued evidence)
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-evidence') {
    event.waitUntil(syncQueuedEvidence());
  }
});

// Sync queued evidence from IndexedDB to Firestore
function syncQueuedEvidence() {
  // This is handled by the main app JS via postMessage
  return self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({ type: 'sync-evidence' });
    });
  });
}
