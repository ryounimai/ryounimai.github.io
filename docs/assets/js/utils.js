/**
 * utils.js — RyouStream Utility Helpers
 * Version : 1.0.2
 * Author  : Ryounime
 */

// ── DOM Helpers ───────────────────────────────────────────────────────────────
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function setHTML(selector, html, ctx = document) {
  const node = typeof selector === 'string' ? $(selector, ctx) : selector;
  if (node) node.innerHTML = html;
}

export function setText(selector, text, ctx = document) {
  const node = typeof selector === 'string' ? $(selector, ctx) : selector;
  if (node) node.textContent = text;
}

export function show(el) {
  if (!el) return;
  const e = typeof el === 'string' ? $(el) : el;
  if (e) e.style.display = '';
}

export function hide(el) {
  if (!el) return;
  const e = typeof el === 'string' ? $(el) : el;
  if (e) e.style.display = 'none';
}

export function toggle(el, condition) {
  const e = typeof el === 'string' ? $(el) : el;
  if (!e) return;
  e.style.display = condition ? '' : 'none';
}

// ── String Helpers ────────────────────────────────────────────────────────────
export function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function truncate(str, maxLen = 120) {
  const s = stripHtml(str || '');
  return s.length > maxLen ? s.slice(0, maxLen).replace(/\s+\S*$/, '') + '…' : s;
}

export function slugify(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalize(str) {
  return (str || '').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Number / Rating Helpers ───────────────────────────────────────────────────
export function fmtRating(r) {
  if (!r || r === 0) return '—';
  return parseFloat(r).toFixed(1);
}

export function fmtEps(n, type) {
  if (!n) return '';
  if (type === 'Movie') return '1 Film';
  return `${n} Ep`;
}

export function fmtYear(y) {
  if (!y || y === '—') return '';
  return String(y);
}

// ── Image helpers ─────────────────────────────────────────────────────────────
const FALLBACK_POSTER  = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1e1e31"/><text x="100" y="155" font-size="40" fill="#64748b" text-anchor="middle" font-family="system-ui">🎬</text></svg>')}`;
const FALLBACK_BANNER  = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#1e1e31"/><text x="400" y="235" font-size="60" fill="#64748b" text-anchor="middle" font-family="system-ui">🎌</text></svg>')}`;
const FALLBACK_THUMB   = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#13131f"/><text x="160" y="98" font-size="36" fill="#64748b" text-anchor="middle" font-family="system-ui">▶</text></svg>')}`;

export function safeImg(imgEl, src, fallback = FALLBACK_POSTER) {
  if (!imgEl) return;
  imgEl.onerror = () => { imgEl.src = fallback; imgEl.onerror = null; };
  imgEl.src = src || fallback;
}

export function posterSrc(entry)  { return entry?.poster || FALLBACK_POSTER; }
export function bannerSrc(entry)  { return entry?.banner || entry?.poster || FALLBACK_BANNER; }
export function thumbSrc(ep)      { return ep?.thumbnail || FALLBACK_THUMB; }
export { FALLBACK_POSTER, FALLBACK_BANNER, FALLBACK_THUMB };

// ── Type Badge Color ──────────────────────────────────────────────────────────
export function typeBadgeClass(type) {
  const map = { TV: 'badge-tv', Movie: 'badge-movie', OVA: 'badge-ova', Special: 'badge-special' };
  return map[type] || 'badge-tv';
}

export function statusBadgeClass(status) {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s.includes('ongoing') || s.includes('airing')) return 'badge-ongoing';
  if (s.includes('completed') || s.includes('finished')) return 'badge-special';
  return '';
}

// ── Genre → Category ID ───────────────────────────────────────────────────────
export function genreToCategory(genre) {
  const g = (genre || '').toLowerCase();
  if (g.includes('action') || g.includes('laga') || g.includes('aksi')) return 'action';
  if (g.includes('adventure') || g.includes('petualangan')) return 'adventure';
  if (g.includes('comedy') || g.includes('komedi')) return 'comedy';
  if (g.includes('drama')) return 'drama';
  if (g.includes('fantasy') || g.includes('fantasi') || g.includes('magic') || g.includes('mahou')) return 'fantasy';
  if (g.includes('horror') || g.includes('horor') || g.includes('supernatural')) return 'horror';
  if (g.includes('romance') || g.includes('romantis')) return 'romance';
  if (g.includes('sci') || g.includes('mecha')) return 'sci-fi';
  if (g.includes('slice') || g.includes('isekai') || g.includes('school')) return 'slice-of-life';
  if (g.includes('sport')) return 'sports';
  if (g.includes('thriller') || g.includes('mystery') || g.includes('psychological')) return 'thriller';
  if (g.includes('histor') || g.includes('samurai') || g.includes('period')) return 'historical';
  if (g.includes('music') || g.includes('idol')) return 'music';
  if (g.includes('youth') || g.includes('shounen') || g.includes('seinen')) return 'youth';
  return 'other';
}

// ── Debounce / Throttle ───────────────────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit = 200) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) { lastCall = now; fn(...args); }
  };
}

// ── Anime Card Builder ────────────────────────────────────────────────────────
/**
 * Build a standard .anime-card DOM element from an AnimeEntry.
 * @param {Object} entry  - library entry
 * @param {Object} options
 * @param {boolean} options.showOverlay - show hover overlay (default true)
 * @param {boolean} options.lazy        - lazy load image (default true)
 */
export function buildAnimeCard(entry, options = {}) {
  const { showOverlay = true, lazy = true } = options;

  const card = el('div', { class: 'anime-card', 'data-id': entry.id });

  // ── Poster wrap
  const wrap = el('div', { class: 'card-poster-wrap' });

  // Poster image
  const img = el('img', {
    class: 'card-poster',
    src: posterSrc(entry),
    alt: entry.title || '',
    loading: lazy ? 'lazy' : 'eager',
    decoding: 'async',
  });
  img.onerror = () => { img.src = FALLBACK_POSTER; img.onerror = null; };
  wrap.append(img);

  // Watch progress bar (if history data available)
  const progressBar = el('div', { class: 'watch-progress', style: 'width:0%' });
  wrap.append(progressBar);

  // Badges
  const badges = el('div', { class: 'card-badges' });
  if (entry.type) {
    badges.append(el('span', { class: `badge ${typeBadgeClass(entry.type)}`, text: entry.type }));
  }
  if (entry.status && (entry.status.toLowerCase().includes('airing') || entry.status.toLowerCase().includes('ongoing'))) {
    badges.append(el('span', { class: 'badge badge-ongoing', text: 'Ongoing' }));
  }
  wrap.append(badges);

  // Overlay
  if (showOverlay) {
    const overlay = el('div', { class: 'card-overlay' });
    const playBtn = el('div', { class: 'card-play-btn' });
    playBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    overlay.append(playBtn);
    wrap.append(overlay);
  }

  card.append(wrap);

  // Info below poster
  const info = el('div', { class: 'card-info' });
  const title = el('p', { class: 'card-title', text: entry.title || '—' });
  const meta = el('div', { class: 'card-meta' });

  if (entry.year) meta.append(el('span', { class: 'card-year', text: entry.year }));
  if (entry.episodes && entry.type !== 'Movie') {
    meta.append(el('span', { class: 'card-eps', text: `${entry.episodes} Ep` }));
  }
  if (entry.rating) {
    const rating = el('span', { class: 'card-rating' });
    rating.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>${fmtRating(entry.rating)}`;
    meta.append(rating);
  }

  info.append(title, meta);
  card.append(info);

  return card;
}

// ── Toast Notifications ───────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m10.29 3.86-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.71-3.14l-7-12a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

export function toast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const t = el('div', { class: `toast ${type}` });
  t.innerHTML = `<span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span><span class="flex-1">${message}</span>`;

  container.append(t);

  setTimeout(() => {
    t.classList.add('removing');
    t.addEventListener('animationend', () => t.remove(), { once: true });
    setTimeout(() => t.remove(), 400);
  }, duration);
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
export function buildSkeletonRow(count = 6) {
  return Array.from({ length: count }, () => {
    const s = el('div', { class: 'skeleton-card', style: 'width:150px;flex-shrink:0' });
    const poster = el('div', {
      class: 'skeleton',
      style: 'aspect-ratio:2/3;border-radius:14px;width:100%'
    });
    const line1 = el('div', { class: 'skeleton', style: 'height:12px;margin-top:8px;border-radius:99px;width:100%' });
    const line2 = el('div', { class: 'skeleton', style: 'height:10px;margin-top:6px;border-radius:99px;width:60%' });
    s.append(poster, line1, line2);
    return s;
  });
}

// ── Scroll Row scroll helper ──────────────────────────────────────────────────
export function scrollRowBy(rowEl, direction = 1) {
  if (!rowEl) return;
  const step = Math.min(rowEl.clientWidth * 0.7, 400);
  rowEl.scrollBy({ left: direction * step, behavior: 'smooth' });
}

// ── Format description by lang ────────────────────────────────────────────────
export function getDesc(entry, lang = 'id') {
  if (!entry) return '';
  if (lang === 'id') return stripHtml(entry.description_id || entry.description || '');
  if (lang === 'ja') return stripHtml(entry.description_ja || entry.description || '');
  return stripHtml(entry.description || '');
}

// ── Normalize episode src for player (gunakan API_BASE) ──────────────────────
// Import lazy agar tidak circular — ambil dari localStorage atau location
function _apiBase() {
  try {
    const stored = localStorage.getItem('rs_api_base');
    if (stored) return stored.replace(/\/$/, '');
  } catch {}
  const { protocol, hostname } = location;
  const port = location.port;
  if (port && port !== '80' && port !== '443') return `${protocol}//${hostname}:${port}`;
  return `${protocol}//${hostname}:8080`;
}

export function resolveMediaSrc(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const base = _apiBase();
  return src.startsWith('/') ? `${base}${src}` : `${base}/${src}`;
}

// ── Build episode URL for router navigation ───────────────────────────────────
export function watchHash(animeId, ep = 1) {
  return `#watch/${animeId}/${ep}`;
}

export function detailsHash(animeId) {
  return `#details/${animeId}`;
}

// ── Click outside ─────────────────────────────────────────────────────────────
export function onClickOutside(el, handler) {
  const listener = (e) => { if (!el.contains(e.target)) handler(e); };
  document.addEventListener('pointerdown', listener);
  return () => document.removeEventListener('pointerdown', listener);
}

// ── Format duration seconds → mm:ss ──────────────────────────────────────────
export function fmtTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Generate genre color from categories.json ─────────────────────────────────
let _catData = null;
export async function getCategoryData() {
  if (_catData) return _catData;
  try {
    const res = await fetch('assets/data/categories.json');
    _catData = await res.json();
  } catch {
    _catData = { genres: [], types: [], sortOptions: [], navItems: [], sidebarItems: [] };
  }
  return _catData;
}

export function genreColor(genre, catData) {
  if (!catData?.genres) return '#64748b';
  const g = catData.genres.find(c => c.id === genreToCategory(genre));
  return g?.color || '#64748b';
}
