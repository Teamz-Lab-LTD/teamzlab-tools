/**
 * Teamz Lab Tools — Service Worker
 * Enables PWA install, offline caching, and fast repeat visits.
 */

var CACHE_NAME = 'teamztools-v3';
var PRECACHE_URLS = [
  '/',
  '/branding/css/teamz-branding.css',
  '/shared/css/tools.css',
  '/branding/js/theme.js',
  '/shared/js/common.js',
  '/shared/js/tool-engine.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install: precache core assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (name) {
          return name !== CACHE_NAME;
        }).map(function (name) {
          return caches.delete(name);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // Skip sitemap, robots, ads.txt — these must always serve fresh
  if (url.pathname.match(/\.(xml|txt)$/) || url.pathname === '/robots.txt' || url.pathname === '/ads.txt' || url.pathname === '/sitemap.xml') return;

  // HTML pages: network first, fallback to cache
  if (event.request.headers.get('accept') && event.request.headers.get('accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(event.request).then(function (response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('/');
        });
      })
    );
    return;
  }

  // Static assets: cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        // Cache successful responses for static assets
        if (response.status === 200 && (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|woff2?)$/))) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
