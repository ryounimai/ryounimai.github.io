/**
 * pages/archive.js — RyouStream Archive Page
 * Version : 1.0.0 Epsilon
 * Author  : Ryounime
 */

import { registerPage, go } from '../router.js';
import { fetchLibrary } from '../api.js';
import { LibCache, apiBaseReady } from '../config.js';
import {
  $, $$, buildAnimeCard, getCategoryData,
  detailsHash, genreToCategory, toast,
  debounce, buildSkeletonRow
} from '../utils.js';
import { animateCards, animatePageEnter } from '../animations.js';

// ── State ─────────────────────────────────────────────────────────────────────
let _library    = [];
let _filtered   = [];
let _catData    = null;
let _page       = 1;
const PAGE_SIZE = 40;

let _activeType   = 'all';
let _activeGenre  = 'all';
let _activeSort   = 'title_asc';

// ── Helpers ───────────────────────────────────────────────────────────────────
function sortLibrary(lib, sortKey) {
  const [field, dir] = sortKey.split('_');
  const asc = dir === 'asc';

  return [...lib].sort((a, b) => {
    let av, bv;
    if (field === 'title') {
      av = (a.title || '').toLowerCase();
      bv = (b.title || '').toLowerCase();
    } else if (field === 'year') {
      av = parseInt(a.year) || 0;
      bv = parseInt(b.year) || 0;
    } else if (field === 'rating') {
      av = parseFloat(a.rating) || 0;
      bv = parseFloat(b.rating) || 0;
    } else if (field === 'eps') {
      av = parseInt(a.episodes) || 0;
      bv = parseInt(b.episodes) || 0;
    } else {
      av = a[field] || '';
      bv = b[field] || '';
    }
    if (av < bv) return asc ? -1 : 1;
    if (av > bv) return asc ? 1 : -1;
    return 0;
  });
}

function applyFilters(lib) {
  let result = [...lib];

  if (_activeType !== 'all') {
    result = result.filter(e => e.type === _activeType);
  }

  if (_activeGenre !== 'all') {
    result = result.filter(e => {
      const genres = [...(e.genres || []), ...(e.genres_disp || [])];
      return genres.some(g => genreToCategory(g) === _activeGenre);
    });
  }

  result = sortLibrary(result, _activeSort);
  return result;
}

function renderGrid(items, append = false) {
  const grid = document.getElementById('archive-grid');
  if (!grid) return;

  if (!append) grid.innerHTML = '';

  if (!items.length && !append) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <h3 class="empty-title">Tidak ada anime ditemukan</h3>
        <p class="empty-desc">Coba ubah filter atau scan ulang library.</p>
      </div>`;
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(entry => {
    const card = buildAnimeCard(entry);
    card.addEventListener('click', () => go(detailsHash(entry.id)));
    frag.append(card);
  });
  grid.append(frag);

  if (!append) animateCards(grid);
}

function updateTotal() {
  const totalEl = document.getElementById('archive-total');
  if (totalEl) totalEl.textContent = _filtered.length;
}

function updateLoadMore() {
  const btn = document.getElementById('archive-loadmore');
  if (!btn) return;
  const shown = _page * PAGE_SIZE;
  btn.style.display = shown < _filtered.length ? '' : 'none';
}

function renderPage(pageNum) {
  const start = 0;
  const end   = pageNum * PAGE_SIZE;
  const items = _filtered.slice(start, end);

  if (pageNum === 1) {
    renderGrid(items, false);
  } else {
    const newItems = _filtered.slice((pageNum - 1) * PAGE_SIZE, end);
    renderGrid(newItems, true);
  }
  updateLoadMore();
}

// ── Filter chips ──────────────────────────────────────────────────────────────
function buildTypeFilters() {
  const bar = document.getElementById('archive-type-filter');
  if (!bar || !_catData) return;

  bar.innerHTML = '';
  _catData.types.forEach(t => {
    const chip = document.createElement('button');
    chip.className = `filter-chip${t.id === _activeType ? ' active' : ''}`;
    chip.textContent = t.label;
    chip.dataset.type = t.id;
    chip.addEventListener('click', () => {
      _activeType = t.id;
      $$('.filter-chip', bar).forEach(c => c.classList.toggle('active', c.dataset.type === t.id));
      _page = 1;
      _filtered = applyFilters(_library);
      updateTotal();
      renderPage(1);
    });
    bar.append(chip);
  });
}

function buildGenreFilters() {
  const bar = document.getElementById('archive-genre-filter');
  if (!bar || !_catData) return;

  bar.innerHTML = '';

  // Add "All genres" chip
  const allChip = document.createElement('button');
  allChip.className = `filter-chip${_activeGenre === 'all' ? ' active' : ''}`;
  allChip.textContent = 'Semua Genre';
  allChip.dataset.genre = 'all';
  bar.append(allChip);

  // Only genres that exist in library
  const libGenres = new Set();
  _library.forEach(e => (e.genres_disp || e.genres || []).forEach(g => libGenres.add(genreToCategory(g))));

  _catData.genres
    .filter(g => libGenres.has(g.id))
    .forEach(g => {
      const chip = document.createElement('button');
      chip.className = `filter-chip${_activeGenre === g.id ? ' active' : ''}`;
      chip.textContent = `${g.icon} ${g.label}`;
      chip.dataset.genre = g.id;
      bar.append(chip);
    });

  bar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    _activeGenre = chip.dataset.genre;
    $$('.filter-chip', bar).forEach(c => c.classList.toggle('active', c.dataset.genre === _activeGenre));
    _page = 1;
    _filtered = applyFilters(_library);
    updateTotal();
    renderPage(1);
  });
}

// ── Sort select ───────────────────────────────────────────────────────────────
function initSortSelect() {
  const select = document.getElementById('archive-sort');
  if (!select) return;
  select.value = _activeSort;
  select.addEventListener('change', () => {
    _activeSort = select.value;
    _page = 1;
    _filtered = applyFilters(_library);
    renderPage(1);
  });
}

// ── Load more button ──────────────────────────────────────────────────────────
function initLoadMore() {
  const btn = document.getElementById('archive-loadmore');
  if (!btn) return;
  btn.addEventListener('click', () => {
    _page++;
    renderPage(_page);
  });
}

// ── Load library ──────────────────────────────────────────────────────────────
async function loadArchive(params = {}) {
  await apiBaseReady.catch(() => {});
  // Apply URL params
  if (params.type && params.type !== 'all') _activeType = params.type;
  if (params.sort)  _activeSort = params.sort;
  if (params.genre) _activeGenre = params.genre;

  // Try cache first
  let lib = LibCache.load();

  if (!lib?.length) {
    // Show skeletons
    const grid = document.getElementById('archive-grid');
    if (grid) {
      grid.innerHTML = '';
      buildSkeletonRow(12).forEach(s => {
        s.style.width = '100%';
        grid.append(s);
      });
    }

    try {
      const res = await fetchLibrary();
      if (res.status === 'scanning') {
        toast('Library sedang di-scan...', 'warning', 4000);
        setTimeout(() => loadArchive(params), 3000);
        return;
      }
      lib = res.data;
      LibCache.save(lib);
    } catch (err) {
      toast('Gagal memuat library', 'error');
      return;
    }
  }

  _library  = lib;
  _catData  = await getCategoryData();
  _filtered = applyFilters(_library);
  _page     = 1;

  buildTypeFilters();
  buildGenreFilters();
  initSortSelect();
  initLoadMore();
  updateTotal();
  renderPage(1);

  document.dispatchEvent(new CustomEvent('rs:library-loaded', { detail: { library: _library } }));
}

// ── Register page ─────────────────────────────────────────────────────────────
registerPage('archive', {
  async mount(params) {
    const page = document.getElementById('page-archive');
    animatePageEnter(page);

    // Reset filters
    _activeType  = params.type  || 'all';
    _activeSort  = params.sort  || 'title_asc';
    _activeGenre = params.genre || 'all';
    _page        = 1;

    await loadArchive(params);
  },

  async unmount() {}
});

export function getArchiveLibrary() { return _library; }
