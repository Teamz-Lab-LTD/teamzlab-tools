/**
 * Teamz Lab Tools — Service Worker
 * Enables PWA install, offline caching, and fast repeat visits.
 *
 * Strategy:
 * - Core assets (CSS/JS/icons): precached on install, cache-first
 * - HTML pages: network-first, cached on visit, served from cache when offline
 * - Google Fonts: cached on first load, served from cache when offline
 * - External CDN (jsdelivr, unpkg): cached on first load for offline AI tools
 * - User sees offline indicator when network is unavailable
 */

var CACHE_NAME = 'teamztools-202603170855';
var PRECACHE_URLS = [
  '/',
  '/branding/css/teamz-branding.css',
  '/shared/css/tools.css',
  '/branding/js/theme.js',
  '/shared/js/common.js',
  '/shared/js/tool-engine.js',
  '/shared/js/utility-engine.js',
  '/shared/js/search-index.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/og-default.png',
  '/manifest.json'
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

// Fetch handler
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip sitemap, robots, ads.txt — must always serve fresh
  if (url.pathname.match(/\.(xml|txt)$/) || url.pathname === '/robots.txt' || url.pathname === '/ads.txt' || url.pathname === '/sitemap.xml') return;

  // Skip Firebase RTDB requests (ratings) — must be live
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com/identitytoolkit')) return;

  // Skip analytics — don't cache tracking requests
  if (url.hostname.includes('google-analytics.com') || url.hostname.includes('googletagmanager.com') || url.hostname.includes('firebase') || url.hostname.includes('gstatic.com/firebasejs')) return;

  // Google Fonts: cache-first (cache the CSS and font files for offline)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(function () {
          return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
        });
      })
    );
    return;
  }

  // External CDN (jsdelivr, unpkg, cdnjs): cache on first use for offline AI/PDF tools
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'unpkg.com' || url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Skip other external requests
  if (url.origin !== self.location.origin) return;

  // HTML pages: network-first, fallback to cache, then offline page
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

  // Static assets: cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response.status === 200 && (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|woff2?|json)$/))) {
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
