/**
 * config.js — RyouStream App Configuration
 * Version : 1.1.0
 * Author  : Ryounime
 *
 * Single source of truth untuk semua konstanta dan state global.
 * Di-export sebagai named exports agar bisa di-import oleh modul lain.
 */

// ── API Base URL (auto-detect dari origin, bisa di-override) ──────────────────
export const API_BASE = (() => {
  const stored = localStorage.getItem('rs_api_base');
  if (stored) return stored.replace(/\/$/, '');
  // Sama-origin dengan backend (default: port 8080 jika bukan 80/443)
  const { protocol, hostname } = location;
  if (location.port && location.port !== '80' && location.port !== '443') {
    return `${protocol}//${hostname}:${location.port}`;
  }
  return `${protocol}//${hostname}:8080`;
})();

// ── API Endpoints ─────────────────────────────────────────────────────────────
export const API = {
  LIBRARY:     `${API_BASE}/api/library`,
  EPISODES:    (id)  => `${API_BASE}/api/episodes/${id}`,
  SCAN:        `${API_BASE}/api/scan`,
  SCAN_STATUS: `${API_BASE}/api/scan/status`,
  SETTINGS:    `${API_BASE}/api/settings`,
  CLEAR_CACHE: (type = 'all') => `${API_BASE}/api/clear_cache?type=${type}`,
  DIRLIST:     (path) => `${API_BASE}/api/dirlist?path=${encodeURIComponent(path)}`,
  CHAPTERS:    (path) => `${API_BASE}/api/chapters?path=${encodeURIComponent(path)}`,
  FONTS:       `${API_BASE}/api/fonts`,
  MEDIA:       (rel)  => `${API_BASE}/media/${rel}`,
};

// ── App Meta ──────────────────────────────────────────────────────────────────
export const APP = {
  NAME:    'RyouStream',
  TAGLINE: 'Ryounime Stream Platform',
  VERSION: '1.1.0',
  CODENAME:'Epsilon',
  AUTHOR:  'Ryounime',
};

// ── Storage Keys ──────────────────────────────────────────────────────────────
export const STORE = {
  SETTINGS:      'rs_settings',
  WATCH_HISTORY: 'rs_watch_history',
  POSITIONS:     'rs_positions',
  API_BASE:      'rs_api_base',
  PWA_DISMISSED: 'rs_pwa_dismissed',
  LIBRARY_CACHE: 'rs_lib_cache',
  LIBRARY_TS:    'rs_lib_ts',
};

// ── Default Settings ──────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  autoplay:       false,
  autoNext:       true,
  rememberPos:    true,
  subtitleEnabled:true,
  volume:         1.0,
  accentColor:    '#7c3aed',
  descLang:       'id',
  animations:     true,
  cardLayout:     'poster',
};

// ── Settings Store (reactive) ─────────────────────────────────────────────────
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORE.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let _settings = loadSettings();

export const Settings = {
  get(key) { return _settings[key] ?? DEFAULT_SETTINGS[key]; },
  set(key, value) {
    _settings[key] = value;
    try { localStorage.setItem(STORE.SETTINGS, JSON.stringify(_settings)); } catch {}
    document.dispatchEvent(new CustomEvent('rs:setting-changed', { detail: { key, value } }));
  },
  getAll() { return { ..._settings }; },
  reset() {
    _settings = { ...DEFAULT_SETTINGS };
    try { localStorage.setItem(STORE.SETTINGS, JSON.stringify(_settings)); } catch {}
  },
};

// ── Watch Position Store ───────────────────────────────────────────────────────
export const Positions = {
  _data: (() => {
    try { return JSON.parse(localStorage.getItem(STORE.POSITIONS) || '{}'); } catch { return {}; }
  })(),
  key(animeId, ep) { return `${animeId}_${ep}`; },
  save(animeId, ep, time, duration) {
    const k = this.key(animeId, ep);
    this._data[k] = { time, duration, ts: Date.now() };
    try { localStorage.setItem(STORE.POSITIONS, JSON.stringify(this._data)); } catch {}
  },
  get(animeId, ep) {
    return this._data[this.key(animeId, ep)] || null;
  },
  clear(animeId, ep) {
    delete this._data[this.key(animeId, ep)];
    try { localStorage.setItem(STORE.POSITIONS, JSON.stringify(this._data)); } catch {}
  },
};

// ── Watch History ─────────────────────────────────────────────────────────────
export const History = {
  _data: (() => {
    try { return JSON.parse(localStorage.getItem(STORE.WATCH_HISTORY) || '[]'); } catch { return []; }
  })(),
  add(entry) {
    // entry: { id, title, poster, ep, epTitle, ts }
    this._data = this._data.filter(e => !(e.id === entry.id && e.ep === entry.ep));
    this._data.unshift({ ...entry, ts: Date.now() });
    if (this._data.length > 100) this._data = this._data.slice(0, 100);
    try { localStorage.setItem(STORE.WATCH_HISTORY, JSON.stringify(this._data)); } catch {}
  },
  get() { return [...this._data]; },
  clear() {
    this._data = [];
    try { localStorage.setItem(STORE.WATCH_HISTORY, '[]'); } catch {}
  },
};

// ── Library Cache ─────────────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

export const LibCache = {
  _data: null,
  _ts:   0,
  load() {
    if (this._data) return this._data;
    try {
      const ts  = parseInt(localStorage.getItem(STORE.LIBRARY_TS) || '0');
      const raw = localStorage.getItem(STORE.LIBRARY_CACHE);
      if (raw && Date.now() - ts < CACHE_TTL) {
        this._data = JSON.parse(raw);
        this._ts   = ts;
        return this._data;
      }
    } catch {}
    return null;
  },
  save(data) {
    this._data = data;
    this._ts   = Date.now();
    try {
      localStorage.setItem(STORE.LIBRARY_CACHE, JSON.stringify(data));
      localStorage.setItem(STORE.LIBRARY_TS, String(this._ts));
    } catch {}
  },
  clear() {
    this._data = null;
    this._ts   = 0;
    try {
      localStorage.removeItem(STORE.LIBRARY_CACHE);
      localStorage.removeItem(STORE.LIBRARY_TS);
    } catch {}
  },
  isStale() { return !this._data || (Date.now() - this._ts > CACHE_TTL); },
};

// ── Accent Color Applier ──────────────────────────────────────────────────────
export function applyAccentColor(hex) {
  document.documentElement.style.setProperty('--accent', hex);
  // Derive light/dark variants
  document.documentElement.style.setProperty('--accent-light', hex + 'dd');
  document.documentElement.style.setProperty('--accent-dark',  hex + 'aa');
  document.documentElement.style.setProperty('--grad-brand',
    `linear-gradient(135deg, ${hex} 0%, #3b82f6 50%, #06b6d4 100%)`);
}

// Apply on init
applyAccentColor(Settings.get('accentColor'));
