/**
 * sw.js — ŘΨØŬ v1.0.0 new
 * Cache-first untuk static assets, network-first untuk API & media
 */
const CACHE = 'ryou-v1.0.3';
const PRECACHE = [
  '/', '/index.html', '/details.html', '/watch.html', '/about.html',
  '/manifest.json',
  /* Fonts */
  '/assets/fonts/fonts.css',
  '/assets/fonts/inter/inter-latin-400-normal.woff2',
  '/assets/fonts/inter/inter-latin-500-normal.woff2',
  '/assets/fonts/inter/inter-latin-600-normal.woff2',
  '/assets/fonts/inter/inter-latin-700-normal.woff2',
  /* CSS */
  '/assets/bootstrap/bootstrap.min.css',
  '/assets/swiper/swiper-bundle.min.css',
  '/assets/videojs/video-js.min.css',
  '/assets/css/vars.css',
  '/assets/css/base.css',
  '/assets/css/nav.css',
  '/assets/css/player.css',
  '/assets/css/pages.css',
  /* JS */
  '/assets/bootstrap/bootstrap.bundle.min.js',
  '/assets/swiper/swiper-bundle.min.js',
  '/assets/videojs/video.min.js',
  '/assets/videojs/lang/id.js',
  '/assets/videojs/lang/en.js',
  '/assets/videojs/lang/ja.js',
  '/assets/js/utils.js',
  /* Lib */
  '/lib/store.js',
  '/lib/i18n.js',
  '/lib/api.js',
  /* Components */
  '/components/footer.js',
  '/components/splash.js',
  '/components/nav.js',
  '/components/carousel.js',
  '/components/section.js',
  '/components/watch.js',
  '/components/details.js',
  '/components/index.js',
  '/components/about.js',
  /* Res */
  '/res/favicon.ico',
  '/res/icon-192.png',
  '/res/logo.svg',
  '/res/pwa.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Skip: request ke domain lain (tunnel, GitHub Gist, CDN, dll)
  if (url.origin !== self.location.origin) return;
  // Skip: path API/media/font (sekarang ke tunnel, tapi just in case)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/') || url.pathname.startsWith('/fonts/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
