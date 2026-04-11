/**
 * lib/api.js — ŘΨØŬ v1.4.0
 * Kompatibel Android WebView lama (tanpa ?. dan ??)
 */

const API = (function () {

  // ── KONFIGURASI ────────────────────────────────────────────────────────────
  var GIST_ID       = '1a42e63011f4496adb0a4c7821e15bb6';
  var GIST_FILENAME = 'ryou-backend.json';
  var GIST_URL      = 'https://api.github.com/gists/' + GIST_ID;
  // ──────────────────────────────────────────────────────────────────────────

  var _base        = null;
  var _initPromise = null;

  function _resolveBase() {
    if (_base) return Promise.resolve(_base);
    if (_initPromise) return _initPromise;

    _initPromise = fetch(GIST_URL, {
      headers: { 'Accept': 'application/vnd.github+json' }
    })
    .then(function (r) {
      if (!r.ok) throw new Error('GitHub API ' + r.status);
      return r.json();
    })
    .then(function (gist) {
      var file = gist.files && gist.files[GIST_FILENAME];
      if (!file) throw new Error('File ' + GIST_FILENAME + ' tidak ada di Gist.');

      var payload = JSON.parse(file.content);
      if (!payload.url) throw new Error('Field url tidak ada di Gist content.');

      _base = payload.url.replace(/\/$/, '');
      console.info('[API] Backend URL: ' + _base + ' (updated: ' + (payload.updated || '?') + ')');
      return _base;
    })
    .catch(function (err) {
      _initPromise = null;
      throw new Error('[API] Gagal resolve backend URL: ' + err.message);
    });

    return _initPromise;
  }

  function _get(path) {
    return _resolveBase().then(function (base) {
      return fetch(base + path);
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + path);
      return r.json();
    });
  }

  return {
    resolveBase: function () { return _resolveBase(); },

    library:    function () { return _get('/api/library'); },
    episodes:   function (id) { return _get('/api/episodes/' + id); },
    scan:       function (force) { return _get('/api/scan?force=' + (force ? 1 : 0)); },
    scanStatus: function () { return _get('/api/scan/status'); },
    settings:   function () { return _get('/api/settings'); },
    clearCache: function (type) { return _get('/api/clear_cache?type=' + (type || 'all')); },
    dirlist:    function (path) { return _get('/api/dirlist?path=' + encodeURIComponent(path || '')); },
    chapters:   function (mediaPath) { return _get('/api/chapters?path=' + encodeURIComponent(mediaPath)); },

    mediaUrl: function (path) {
      return _resolveBase().then(function (base) {
        return base + path;
      });
    },

    refresh: function () {
      _base        = null;
      _initPromise = null;
      return _resolveBase();
    },
  };
})();

window.API = API;
