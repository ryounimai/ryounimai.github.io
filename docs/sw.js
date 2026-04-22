/**
 * sw.js — RyouStream Service Worker
 * Version: 1.1.0
 * Author : Ryounime
 *
 * Strategy:
 *  - App Shell (HTML/CSS/JS)   → Cache First (stale-while-revalidate)
 *  - API /api/*                → Network First (with fallback)
 *  - Images / posters          → Cache First (long TTL)
 *  - Media /media/*            → Network Only (streaming, no cache)
 */

const APP_VERSION   = '1.1.0';
const CACHE_SHELL   = `rs-shell-${APP_VERSION}`;
const CACHE_ASSETS  = `rs-assets-${APP_VERSION}`;
const CACHE_IMAGES  = `rs-images-${APP_VERSION}`;
const CACHE_API     = `rs-api-${APP_VERSION}`;

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/css/main.css',
  '/assets/css/player.css',
  '/assets/js/config.js',
  '/assets/js/api.js',
  '/assets/js/router.js',
  '/assets/js/utils.js',
  '/assets/js/animations.js',
  '/assets/js/app.js',
  '/assets/js/pages/home.js',
  '/assets/js/pages/archive.js',
  '/assets/js/pages/category.js',
  '/assets/js/pages/search.js',
  '/assets/js/pages/details.js',
  '/assets/js/pages/watch.js',
  '/assets/js/pages/settings.js',
  '/assets/js/pages/about.js',
  '/assets/icons/logo.svg',
  '/assets/icons/favicon.svg',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
  '/assets/data/categories.json',
  '/assets/data/config.xml',
  /* ── Offline API libs ── */
  '/assets/api/animejs/anime.min.js',
  '/assets/api/bootstrap/bootstrap-grid.min.css',
  '/assets/api/bootstrap/bootstrap.bundle.min.js',
  '/assets/api/fonts/fonts.css',
  '/assets/api/vidstack/css/vidstack.css',
  '/assets/api/vidstack/vidstack.js',
];

const API_CACHE_DURATION = 5 * 60 * 1000; // 5 menit untuk API responses

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      console.log('[SW] Pre-caching app shell...');
      return cache.addAll(SHELL_URLS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => console.warn('[SW] Shell cache partial fail:', err));
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_SHELL, CACHE_ASSETS, CACHE_IMAGES, CACHE_API];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => !validCaches.includes(k)).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;
  // Skip cross-origin kecuali aset lokal
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // ── Media files: Network Only (streaming, never cache)
  if (path.startsWith('/media/') || path.startsWith('/fonts/')) {
    return;
  }

  // ── Vidstack chunks & icon JS: Cache First (immutable hashed filenames)
  if (path.includes('/assets/api/vidstack/chunks/') ||
      path.includes('/assets/api/vidstack/icons/') ||
      path.includes('/assets/api/vidstack/providers/')) {
    event.respondWith(cacheFirstImage(request)); // reuse cache-first strategy
    return;
  }

  // ── Font woff2: Cache First (long TTL)
  if (path.includes('/assets/api/fonts/') && path.endsWith('.woff2')) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // ── API calls: Network First with fallback
  if (path.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // ── Remote images (posters from MAL/TMDB/MDL): Cache First
  if (
    url.hostname.includes('myanimelist.net') ||
    url.hostname.includes('image.tmdb.org') ||
    url.hostname.includes('mydramalist.com') ||
    url.hostname.includes('cdn.myanimelist.net') ||
    path.match(/\.(jpg|jpeg|png|webp|gif|avif)$/)
  ) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // ── App Shell + Static assets: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_SHELL));
});

// ── STRATEGIES ───────────────────────────────────────────────────────────────

async function networkFirstAPI(request) {
  const cache = await caches.open(CACHE_API);
  try {
    const response = await fetch(request.clone(), { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const responseClone = response.clone();
      // Add timestamp header for TTL check
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const modifiedResp = new Response(await responseClone.blob(), {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers
      });
      cache.put(request, modifiedResp);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
      if (Date.now() - cachedAt < API_CACHE_DURATION) {
        console.log('[SW] Serving API from cache (offline):', request.url);
        return cached;
      }
    }
    return new Response(JSON.stringify({
      status: 'offline',
      error: 'Tidak ada koneksi ke server.',
      data: [],
      total: 0
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirstImage(request) {
  const cache = await caches.open(CACHE_IMAGES);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Return a transparent 1x1 pixel as fallback
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || new Response('Offline', { status: 503 });
}

// ── PUSH NOTIFICATIONS (placeholder) ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'RyouStream', {
      body: data.body || 'Ada konten baru!',
      icon: '/assets/icons/icon-192.svg',
      badge: '/assets/icons/icon-72.svg',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
