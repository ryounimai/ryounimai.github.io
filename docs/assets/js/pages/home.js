/**
 * pages/home.js — RyouStream HomePage
 * Version : 1.0.2
 * Author  : Ryounime
 */

import { registerPage, go } from '../router.js';
import { fetchLibrary, pingServer } from '../api.js';
import { LibCache, Settings, apiBaseReady, showSetupScreen } from '../config.js';
import {
  $, buildAnimeCard, buildSkeletonRow,
  bannerSrc, posterSrc, fmtRating, fmtEps, getDesc,
  typeBadgeClass, statusBadgeClass, watchHash, detailsHash,
  toast, FALLBACK_BANNER
} from '../utils.js';
import {
  animateHeroContent, animateHeroBg,
  animateCards, animatePageEnter
} from '../animations.js';

// ── State ─────────────────────────────────────────────────────────────────────
let _library     = [];
let _heroItems   = [];
let _heroIdx     = 0;
let _heroTimer   = null;
let _mounted     = false;

// ── Hero Carousel ─────────────────────────────────────────────────────────────
function pickHeroItems(lib) {
  // Priority: high-rated TV & Movie with banner
  const scored = lib
    .filter(e => e.poster)
    .map(e => ({ ...e, _score: (parseFloat(e.rating) || 0) + (e.banner !== e.poster ? 2 : 0) }))
    .sort((a, b) => b._score - a._score);
  return scored.slice(0, 6);
}

function renderHeroItem(entry) {
  const heroBg     = $('#hero-bg');
  const heroTitle  = $('#hero-title');
  const heroBadge  = $('#hero-badge');
  const heroRating = $('#hero-rating span');
  const heroYear   = $('#hero-year');
  const heroEps    = $('#hero-eps');
  const heroGenres = $('#hero-genres');
  const heroDesc   = $('#hero-desc');
  const heroPlay   = $('#hero-play-btn');
  const heroDetail = $('#hero-details-btn');

  if (!heroTitle) return;

  const lang = Settings.get('descLang') || 'id';
  const src  = bannerSrc(entry);

  // Animate background change
  animateHeroBg(heroBg, src);

  heroTitle.textContent  = entry.title || '—';
  if (heroRating) heroRating.textContent = fmtRating(entry.rating);
  if (heroYear)   heroYear.textContent   = entry.year || '';
  if (heroEps)    heroEps.textContent    = fmtEps(entry.episodes, entry.type);

  if (heroBadge) {
    heroBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>${entry.type || 'Anime'}`;
  }

  if (heroGenres) {
    heroGenres.innerHTML = (entry.genres_disp || entry.genres || [])
      .slice(0, 4)
      .map(g => `<button class="genre-chip" data-navto="category" data-genre="${g}">${g}</button>`)
      .join('');
  }

  if (heroDesc) {
    heroDesc.textContent = getDesc(entry, lang).slice(0, 200) +
      (getDesc(entry, lang).length > 200 ? '…' : '');
  }

  // Button actions
  if (heroPlay) {
    heroPlay.onclick = () => go(watchHash(entry.id, 1));
  }
  if (heroDetail) {
    heroDetail.onclick = () => go(detailsHash(entry.id));
  }

  // Update dots
  renderHeroDots();
}

function renderHeroDots() {
  const container = $('#hero-dots');
  if (!container) return;
  container.innerHTML = _heroItems
    .map((_, i) => `<button class="hero-dot${i === _heroIdx ? ' active' : ''}" aria-label="Slide ${i+1}" data-idx="${i}"></button>`)
    .join('');

  container.querySelectorAll('.hero-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      _heroIdx = parseInt(dot.dataset.idx);
      renderHeroItem(_heroItems[_heroIdx]);
      resetHeroTimer();
    });
  });
}

function startHeroTimer() {
  clearHeroTimer();
  // Gunakan setTimeout rekursif agar tidak drift
  const tick = () => {
    if (!_heroItems.length) return;
    _heroIdx = (_heroIdx + 1) % _heroItems.length;
    // Schedule render dengan requestAnimationFrame (hindari forced reflow)
    requestAnimationFrame(() => renderHeroItem(_heroItems[_heroIdx]));
    _heroTimer = setTimeout(tick, 6000);
  };
  _heroTimer = setTimeout(tick, 6000);
}

function clearHeroTimer() {
  if (_heroTimer) { clearTimeout(_heroTimer); _heroTimer = null; }
}



function resetHeroTimer() { clearHeroTimer(); startHeroTimer(); }

// ── Section Row Builders ──────────────────────────────────────────────────────
function fillRow(rowId, items) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.innerHTML = '';

  if (!items.length) {
    row.innerHTML = `<p style="color:var(--text-3);font-size:13px;padding:8px 4px">Tidak ada data.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();
  items.slice(0, 20).forEach(entry => {
    const card = buildAnimeCard(entry);
    card.addEventListener('click', () => go(detailsHash(entry.id)));
    frag.append(card);
  });
  row.append(frag);
  animateCards(row);
}

function buildSkeletonRows() {
  ['row-latest', 'row-tv', 'row-movies', 'row-toprated'].forEach(id => {
    const row = document.getElementById(id);
    if (!row) return;
    row.innerHTML = '';
    buildSkeletonRow(8).forEach(s => row.append(s));
  });
}

// ── Render All Sections ───────────────────────────────────────────────────────
function renderSections(lib) {
  const now = new Date().getFullYear();

  // Latest: sorted by year desc (most recent)
  const latest = [...lib].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  fillRow('row-latest', latest);
  const latestCount = document.getElementById('latest-count');
  if (latestCount) latestCount.textContent = lib.length;

  // TV Series
  const tvItems = lib.filter(e => e.type === 'TV');
  fillRow('row-tv', tvItems);
  const tvCount = document.getElementById('tv-count');
  if (tvCount) tvCount.textContent = tvItems.length;

  // Movies
  const movies = lib.filter(e => e.type === 'Movie');
  fillRow('row-movies', movies);
  const movieCount = document.getElementById('movie-count');
  if (movieCount) movieCount.textContent = movies.length;

  // Top rated
  const topRated = [...lib]
    .filter(e => e.rating && parseFloat(e.rating) > 0)
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  fillRow('row-toprated', topRated);

  // OVA / Special
  const ovaItems = lib.filter(e => e.type === 'OVA' || e.type === 'Special');
  const ovaSection = document.getElementById('section-ova');
  if (ovaSection) ovaSection.style.display = ovaItems.length ? '' : 'none';
  if (ovaItems.length) fillRow('row-ova', ovaItems);
}

// ── Load Library ──────────────────────────────────────────────────────────────
// Poll scan progress dari backend, update UI, lalu load library saat selesai
let _scanPollTimer = null;
async function _pollScanProgress() {
  if (_scanPollTimer) return; // sudah polling

  const statusEl = document.getElementById('scan-status-msg');

  async function poll() {
    try {
      const { pingServer } = await import('../api.js');
      const status = await pingServer();

      if (status === 'scanning') {
        // Ambil progress text dari /api/scan/status
        try {
          const { API_BASE } = await import('../config.js');
          const r = await fetch(API_BASE + '/api/scan/status');
          const d = await r.json();
          const msg = d.progress || 'Scanning...';
          toast(msg, 'info', 2500);
          if (statusEl) statusEl.textContent = msg;
        } catch {}
        _scanPollTimer = setTimeout(poll, 3000);
      } else {
        // Scan selesai — load library
        _scanPollTimer = null;
        if (statusEl) statusEl.textContent = '';
        await loadLibrary();
      }
    } catch {
      _scanPollTimer = setTimeout(poll, 5000);
    }
  }

  toast('Library kosong — scan otomatis dimulai...', 'warning', 4000);
  _scanPollTimer = setTimeout(poll, 3000);
}

async function loadLibrary() {
  // Pakai cache HANYA jika ada data (length > 0)
  // Cache kosong [] tidak dihitung — tetap fetch ke backend
  const cached = LibCache.load();
  if (cached?.length) {
    _library   = cached;
    _heroItems = pickHeroItems(cached);
    _heroIdx   = 0;
    renderSections(cached);
    if (_heroItems.length) {
      renderHeroItem(_heroItems[0]);
      startHeroTimer();
    }
    return;
  }

  // Show skeletons while fetching
  buildSkeletonRows();

  try {
    const res = await fetchLibrary();
    if (res.status === 'scanning') {
      // Backend sedang scan — poll progress dan tampilkan ke user
      _pollScanProgress();
      return;
    }

    _library = res.data;
    LibCache.save(_library);

    _heroItems = pickHeroItems(_library);
    _heroIdx   = 0;

    renderSections(_library);

    if (_heroItems.length) {
      renderHeroItem(_heroItems[0]);
      animateHeroContent(document.getElementById('hero-content'));
      startHeroTimer();
    }

    document.dispatchEvent(new CustomEvent('rs:library-loaded', { detail: { library: _library } }));

  } catch (err) {
    console.error('[Home] fetchLibrary error:', err);
    ['row-latest', 'row-tv', 'row-movies', 'row-toprated'].forEach(id => {
      const row = document.getElementById(id);
      if (row) row.innerHTML = `<p style="color:var(--text-3);font-size:13px;padding:8px">Gagal memuat data. Pastikan server backend berjalan.</p>`;
    });
    toast('Gagal memuat library. Cek koneksi ke server.', 'error');
  }
}

// ── Mount / Unmount ───────────────────────────────────────────────────────────
registerPage('home', {
  async mount() {
    const page = document.getElementById('page-home');
    animatePageEnter(page);

    if (!_mounted) {
      _mounted = true;
      // Pastikan API_BASE sudah di-resolve sebelum fetch
      const base = await apiBaseReady.catch(() => null);
      if (!base) { showSetupScreen(); return; }
      await loadLibrary();
    } else if (_library.length) {
      // Already loaded, just restart hero timer
      if (_heroItems.length) startHeroTimer();
    } else {
      const base2 = await apiBaseReady.catch(() => null);
      if (!base2) { showSetupScreen(); return; }
      await loadLibrary();
    }
  },

  async unmount() {
    clearHeroTimer();
  }
});

// ── Exported helpers (used by app.js) ─────────────────────────────────────────
export function getHomeLibrary() { return _library; }

// Pause hero saat tab tidak aktif
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearHeroTimer();
  } else {
    // Hanya restart jika page home aktif
    const homePage = document.getElementById('page-home');
    if (homePage && homePage.classList.contains('active') && _heroItems.length) {
      startHeroTimer();
    }
  }
});
export function reloadHomeLibrary() {
  _mounted = false;
  LibCache.clear();
  loadLibrary();
}
