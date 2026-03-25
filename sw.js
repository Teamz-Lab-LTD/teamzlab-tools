/**
 * Teamz Lab Tools — Service Worker
 * Aggressive offline-first caching for 900+ tools.
 *
 * Strategy:
 * - Core assets (CSS/JS/icons): precached on install, cache-first
 * - HTML pages: stale-while-revalidate (serve cache instantly, update in background)
 * - Google Fonts: cache-first, forever
 * - External CDN: cache-first for offline AI/PDF tools
 * - AdSense/Analytics: always skip (never cache)
 */

var CACHE_NAME = 'teamztools-202603251359';
var PRECACHE_URLS = [
  '/',
  '/branding/css/teamz-branding.css',
  '/shared/css/tools.css',
  '/branding/js/theme.js',
  '/shared/js/common.js',
  '/shared/js/tool-engine.js',
  '/shared/js/utility-engine.js',
  '/shared/js/search-index.js',
  '/shared/js/adsense.js',
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

// Activate: clean old caches, claim all clients
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
  if (url.pathname.match(/\.(xml|txt)$/)) return;

  // Skip Firebase RTDB requests (ratings) — must be live
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com/identitytoolkit')) return;

  // Skip analytics & ads — don't cache tracking/ad requests
  if (url.hostname.includes('google-analytics.com') ||
      url.hostname.includes('googletagmanager.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('gstatic.com/firebasejs') ||
      url.hostname.includes('pagead2.googlesyndication.com') ||
      url.hostname.includes('doubleclick.net') ||
      url.hostname.includes('adservice.google.com')) return;

  // Google Fonts: cache-first (never changes)
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

  // External CDN (jsdelivr, unpkg, cdnjs): cache-first for offline AI/PDF tools
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

  // HTML pages: STALE-WHILE-REVALIDATE — serve cache instantly, update in background
  if (event.request.headers.get('accept') && event.request.headers.get('accept').indexOf('text/html') !== -1) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        // Fetch fresh version in background regardless
        var fetchPromise = fetch(event.request).then(function (response) {
          if (response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(function () {
          // Network failed — if we have cache, we already returned it
          // If not, return homepage as fallback
          return cached || caches.match('/');
        });

        // Return cached version immediately if available, otherwise wait for network
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Static assets (CSS, JS, images): cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response.status === 200 && (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff2?|json|ico|webp)$/))) {
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

// Background sync: when user comes back online, refresh cached pages
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'CACHE_PAGE') {
    caches.open(CACHE_NAME).then(function (cache) {
      cache.add(event.data.url).catch(function () {});
    });
  }
});
