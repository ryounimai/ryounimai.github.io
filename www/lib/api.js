/**
 * lib/api.js — ŘΨØŬ v1.0.1
 * Wrapper semua API endpoint backend.
 *
 * Backend berjalan di Termux via Cloudflare Quick Tunnel.
 * URL tunnel disimpan di GitHub Gist dan di-fetch sekali saat init.
 *
 * Konfigurasi:
 *   Edit GIST_ID di bawah sesuai Gist kamu.
 */

const API = (() => {

  // ── KONFIGURASI ────────────────────────────────────────────────────────────
  const GIST_ID       = 'GANTI_DENGAN_GIST_ID_KAMU';   // sama dengan di start_tunnel.sh
  const GIST_FILENAME = 'ryou-backend.json';
  const GIST_URL      = `https://api.github.com/gists/${GIST_ID}`;
  // ──────────────────────────────────────────────────────────────────────────

  let _base        = null;
  let _initPromise = null;

  async function _resolveBase() {
    if (_base) return _base;
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
      try {
        const r = await fetch(GIST_URL, {
          headers: { 'Accept': 'application/vnd.github+json' }
        });
        if (!r.ok) throw new Error(`GitHub API ${r.status}`);

        const gist = await r.json();
        const file = gist.files?.[GIST_FILENAME];
        if (!file) throw new Error(`File "${GIST_FILENAME}" tidak ada di Gist.`);

        const payload = JSON.parse(file.content);
        if (!payload.url) throw new Error('Field "url" tidak ada di Gist content.');

        _base = payload.url.replace(/\/$/, '');
        console.info(`[API] Backend URL: ${_base} (updated: ${payload.updated ?? '?'})`);
        return _base;

      } catch (err) {
        _initPromise = null;
        throw new Error(`[API] Gagal resolve backend URL: ${err.message}`);
      }
    })();

    return _initPromise;
  }

  async function _get(path) {
    const base = await _resolveBase();
    const r    = await fetch(base + path);
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${path}`);
    return r.json();
  }

  return {
    /* Resolve URL backend (untuk debugging) */
    resolveBase: () => _resolveBase(),

    /* Library */
    library: () => _get('/api/library'),

    /* Episodes */
    episodes: (id) => _get(`/api/episodes/${id}`),

    /* Scan */
    scan:       (force = false) => _get(`/api/scan?force=${force ? 1 : 0}`),
    scanStatus: ()              => _get('/api/scan/status'),

    /* Settings */
    settings: () => _get('/api/settings'),

    /* Clear cache */
    clearCache: (type = 'all') => _get(`/api/clear_cache?type=${type}`),

    /* Dir listing */
    dirlist: (path = '') => _get(`/api/dirlist?path=${encodeURIComponent(path)}`),

    /* Chapters */
    chapters: (mediaPath) => _get(`/api/chapters?path=${encodeURIComponent(mediaPath)}`),

    /**
     * URL absolut untuk media/stream.
     * Video player butuh URL absolut, bukan relative.
     * Pakai: const src = await API.mediaUrl('/media/Movies/...')
     */
    mediaUrl: async (path) => {
      const base = await _resolveBase();
      return base + path;
    },

    /**
     * Paksa refresh URL dari Gist.
     * Panggil ini jika tunnel sudah di-restart dan URL berubah.
     */
    refresh: () => {
      _base        = null;
      _initPromise = null;
      return _resolveBase();
    },
  };
})();

window.API = API;
