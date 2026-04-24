/**
 * config.js — RyouStream App Configuration
 * Version : 1.1.0
 * Author  : Ryounime
 *
 * Single source of truth untuk semua konstanta dan state global.
 * Di-export sebagai named exports agar bisa di-import oleh modul lain.
 */

// ── API Base URL ────────────────────────────────────────────────────────────
// Cara set: localStorage.setItem('rs_api_base', 'https://tunnel.url.kamu')
//           lalu reload halaman.
// Atau isi field setup yang muncul otomatis jika belum dikonfigurasi.

const GIST_ID = '1a42e63011f4496adb0a4c7821e15bb6';

async function _resolveApiBase() {
  // 1. localStorage override — paling prioritas
  const stored = localStorage.getItem('rs_api_base');
  if (stored && stored.startsWith('http')) return stored.replace(/\/$/, '');

  // 2. GitHub Gist raw (tidak butuh auth, tidak rate limit seperti API)
  // Raw Gist URL — public gist, tidak butuh auth dari browser
  // Format: gist.githubusercontent.com/USER/ID/raw
  const GIST_URLS = [
    `https://gist.githubusercontent.com/ryounimai/${GIST_ID}/raw?t=${Date.now()}`,
  ];
  for (const gurl of GIST_URLS) {
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 5000);
      const r    = await fetch(gurl, { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(tid);
      if (r.ok) {
        const text = (await r.text()).trim();
        // Support plain URL atau JSON {"url":"...","updated":"..."}
        if (text.startsWith('http')) return text.replace(/\/$/, '');
        try {
          const json = JSON.parse(text);
          const url  = json.url || json.backend || json.host;
          if (url && url.startsWith('http')) return url.replace(/\/$/, '');
        } catch {}
      }
    } catch { /* coba URL berikutnya */ }
  }

  // 3. Tidak ada konfigurasi valid — return null → setup screen
  return null;
}

const _storedBase = localStorage.getItem('rs_api_base');

// Nilai sementara — null kalau belum ada, akan diisi setelah resolve
export let API_BASE = (_storedBase && _storedBase.startsWith('http'))
  ? _storedBase.replace(/\/$/, '')
  : null;

// Promise yang resolve dengan URL final (atau null jika perlu setup)
export const apiBaseReady = _resolveApiBase().then(url => {
  if (url) {
    API_BASE = url;
    // Update semua endpoint string di objek API
    Object.keys(API).forEach(k => {
      if (typeof API[k] === 'string' && API[k].includes('null/')) {
        API[k] = API[k].replace('null/', url + '/');
      } else if (typeof API[k] === 'string') {
        API[k] = API[k].replace(/^https?:\/\/[^/]+/, url);
      }
    });
  }
  document.dispatchEvent(new CustomEvent('rs:api-ready', { detail: { base: url } }));
  return url;
});

// ── Setup screen (muncul jika backend URL belum dikonfigurasi) ──────────────
export function showSetupScreen() {
  if (document.getElementById('rs-setup-screen')) return;
  const el = document.createElement('div');
  el.id = 'rs-setup-screen';
  el.innerHTML = `
    <div class="rs-setup-box">
      <div class="rs-setup-logo">⚙️</div>
      <h2 class="rs-setup-title">Konfigurasi Backend</h2>
      <p class="rs-setup-desc">
        Masukkan URL backend RyouStream kamu.<br>
        Biasanya dari Cloudflare Tunnel atau IP lokal.
      </p>
      <input id="rs-setup-input" class="rs-setup-input" type="url"
        placeholder="https://your-tunnel.trycloudflare.com"
        autocomplete="off" spellcheck="false">
      <div id="rs-setup-error" class="rs-setup-error" style="display:none"></div>
      <button id="rs-setup-btn" class="rs-setup-btn">Simpan & Hubungkan</button>
      <p class="rs-setup-hint">URL akan disimpan di browser. Hanya perlu diisi sekali.</p>
    </div>`;
  el.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:var(--surface,#0f0f13);
    display:flex;align-items:center;justify-content:center;
    font-family:var(--font-body,system-ui,sans-serif);padding:20px`;
  document.body.appendChild(el);

  const input = document.getElementById('rs-setup-input');
  const btn   = document.getElementById('rs-setup-btn');
  const err   = document.getElementById('rs-setup-error');

  // Style komponen
  Object.assign(el.querySelector('.rs-setup-box').style, {
    background:'var(--surface-2,#1a1a24)',border:'1px solid var(--border,#2a2a3a)',
    borderRadius:'16px',padding:'36px 28px',maxWidth:'440px',width:'100%',
    textAlign:'center',display:'flex',flexDirection:'column',gap:'14px'
  });
  el.querySelector('.rs-setup-logo').style.cssText = 'font-size:40px;line-height:1';
  el.querySelector('.rs-setup-title').style.cssText = 'font-size:20px;font-weight:700;color:var(--text-1,#fff);margin:0';
  el.querySelector('.rs-setup-desc').style.cssText  = 'font-size:14px;color:var(--text-3,#888);margin:0;line-height:1.6';
  Object.assign(input.style, {
    width:'100%',padding:'12px 14px',borderRadius:'10px',border:'1.5px solid var(--border,#2a2a3a)',
    background:'var(--surface,#0f0f13)',color:'var(--text-1,#fff)',fontSize:'14px',
    outline:'none',boxSizing:'border-box'
  });
  Object.assign(btn.style, {
    padding:'12px 20px',borderRadius:'10px',border:'none',cursor:'pointer',
    background:'var(--accent,#7c3aed)',color:'#fff',fontSize:'15px',fontWeight:'600',
    transition:'opacity .2s'
  });
  el.querySelector('.rs-setup-hint').style.cssText = 'font-size:12px;color:var(--text-3,#666);margin:0';

  // Stored value pre-fill
  const prev = localStorage.getItem('rs_api_base');
  if (prev) input.value = prev;

  async function trySave() {
    const url = input.value.trim().replace(/\/$/, '');
    if (!url.startsWith('http')) {
      err.textContent = 'URL harus dimulai dengan http:// atau https://';
      err.style.display = 'block';
      err.style.cssText = 'color:#ef4444;font-size:13px;display:block';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Mencoba...';
    err.style.display = 'none';

    // Tes koneksi ke backend
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 6000);
      const r    = await fetch(url + '/api/library', { signal: ctrl.signal });
      clearTimeout(tid);
      if (!r.ok && r.status !== 200) throw new Error('HTTP ' + r.status);
    } catch (e) {
      err.textContent = 'Tidak bisa terhubung ke backend. Pastikan tunnel aktif dan URL benar.';
      err.style.cssText = 'color:#ef4444;font-size:13px;display:block';
      btn.disabled = false;
      btn.textContent = 'Simpan & Hubungkan';
      return;
    }

    // Simpan dan reload
    localStorage.setItem('rs_api_base', url);
    btn.textContent = 'Tersambung! Memuat...';
    setTimeout(() => location.reload(), 600);
  }

  btn.addEventListener('click', trySave);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') trySave(); });
  input.focus();
}

// ── API Endpoints ────────────────────────────────────────────────────────────
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

// ── App Meta ─────────────────────────────────────────────────────────────────
export const APP = {
  NAME:    'RyouStream',
  TAGLINE: 'Ryounime Stream Platform',
  VERSION: '1.1.0',
  CODENAME:'Epsilon',
  AUTHOR:  'Ryounime',
};

// ── Storage Keys ─────────────────────────────────────────────────────────────
export const STORE = {
  SETTINGS:      'rs_settings',
  WATCH_HISTORY: 'rs_watch_history',
  POSITIONS:     'rs_positions',
  API_BASE:      'rs_api_base',
  PWA_DISMISSED: 'rs_pwa_dismissed',
  LIBRARY_CACHE: 'rs_lib_cache',
  LIBRARY_TS:    'rs_lib_ts',
};

// ── Default Settings ─────────────────────────────────────────────────────────
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

// ── Watch Position Store ─────────────────────────────────────────────────────
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

// ── Watch History ────────────────────────────────────────────────────────────
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

// ── Library Cache ────────────────────────────────────────────────────────────
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

// ── Accent Color Applier ─────────────────────────────────────────────────────
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
