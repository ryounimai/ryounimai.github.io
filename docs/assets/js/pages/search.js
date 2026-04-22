/**
 * pages/search.js — RyouStream Search Page
 * Version : 1.0.0 Epsilon
 * Author  : Ryounime
 */

import { registerPage, go } from '../router.js';
import { fetchLibrary } from '../api.js';
import { LibCache } from '../config.js';
import {
  $, buildAnimeCard, getCategoryData,
  detailsHash, debounce, toast
} from '../utils.js';
import { animateSearchResults, animatePageEnter } from '../animations.js';

// ── State ─────────────────────────────────────────────────────────────────────
let _library    = [];
let _catData    = null;
let _query      = '';
let _typeFilter = 'all';

// ── Search Engine ─────────────────────────────────────────────────────────────
function search(query, typeFilter = 'all') {
  if (!query.trim() && typeFilter === 'all') return [];

  const q = query.toLowerCase().trim();

  return _library.filter(entry => {
    // Type filter
    if (typeFilter !== 'all' && entry.type !== typeFilter) return false;

    // Query match (empty query = show all of type)
    if (!q) return true;

    const searchFields = [
      entry.title        || '',
      entry.title_en     || '',
      entry.title_ja     || '',
      entry.title_romaji || '',
      entry.title_local  || '',
      ...(entry.title_synonyms || []),
      ...(entry.genres_disp || entry.genres || []),
      entry.studio       || '',
      String(entry.year  || ''),
      entry.type         || '',
      entry.status       || '',
    ].map(s => s.toLowerCase());

    return searchFields.some(f => f.includes(q));
  });
}

function renderResults(results) {
  const grid  = document.getElementById('search-results');
  const empty = document.getElementById('search-empty');
  const count = document.getElementById('search-count');
  if (!grid) return;

  // Clear old results (except empty state)
  [...grid.children].forEach(c => {
    if (c.id !== 'search-empty') c.remove();
  });

  if (!_query.trim() && _typeFilter === 'all') {
    // No query: show initial state
    if (empty) empty.style.display = '';
    if (count) count.style.display = 'none';
    return;
  }

  if (empty) empty.style.display = 'none';

  if (results.length === 0) {
    grid.insertAdjacentHTML('beforeend', `
      <div class="empty-state" style="grid-column:1/-1">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <h3 class="empty-title">Tidak ditemukan</h3>
        <p class="empty-desc">Tidak ada anime yang cocok dengan "<strong>${_query}</strong>". Coba kata kunci lain.</p>
      </div>`);
    if (count) count.style.display = 'none';
    return;
  }

  if (count) {
    count.style.display = '';
    count.innerHTML = `Ditemukan <strong>${results.length}</strong> hasil untuk "<strong>${_query || 'semua'}</strong>"`;
  }

  const frag = document.createDocumentFragment();
  results.slice(0, 80).forEach(entry => {
    const card = buildAnimeCard(entry);
    card.addEventListener('click', () => go(detailsHash(entry.id)));
    frag.append(card);
  });
  grid.append(frag);

  animateSearchResults(grid);
}

// ── Debounced search ──────────────────────────────────────────────────────────
const doSearch = debounce(() => {
  const results = search(_query, _typeFilter);
  renderResults(results);
}, 200);

// ── Filter chips ──────────────────────────────────────────────────────────────
function buildTypeFilters() {
  const bar = document.getElementById('search-filter-bar');
  if (!bar || !_catData) return;
  bar.innerHTML = '';

  _catData.types.forEach(t => {
    const chip = document.createElement('button');
    chip.className = `filter-chip${t.id === _typeFilter ? ' active' : ''}`;
    chip.textContent = t.label;
    chip.dataset.type = t.id;
    chip.addEventListener('click', () => {
      _typeFilter = t.id;
      bar.querySelectorAll('.filter-chip').forEach(c =>
        c.classList.toggle('active', c.dataset.type === t.id));
      doSearch();
    });
    bar.append(chip);
  });
}

// ── Input bindings ────────────────────────────────────────────────────────────
function bindSearch() {
  const input   = document.getElementById('main-search-input');
  const clearBtn = document.getElementById('main-search-clear');
  if (!input) return;

  input.addEventListener('input', () => {
    _query = input.value;
    if (clearBtn) clearBtn.style.display = _query ? 'flex' : 'none';
    doSearch();
  });

  if (clearBtn) {
    clearBtn.style.display = 'none';
    clearBtn.addEventListener('click', () => {
      _query       = '';
      input.value  = '';
      clearBtn.style.display = 'none';
      renderResults([]);
      input.focus();
    });
  }
}

// ── Topbar search sync (mobile) ───────────────────────────────────────────────
function bindTopbarSearch() {
  const topInput   = document.getElementById('topbar-search-input');
  const topSearch  = document.getElementById('topbar-search');
  const topBtn     = document.getElementById('topbar-search-btn');
  const topClear   = document.getElementById('topbar-search-clear');
  const mainInput  = document.getElementById('main-search-input');

  if (!topInput) return;

  topInput.addEventListener('input', () => {
    _query = topInput.value;
    if (mainInput) mainInput.value = topInput.value;
    const clearBtn = document.getElementById('main-search-clear');
    if (clearBtn) clearBtn.style.display = _query ? 'flex' : 'none';
    doSearch();
  });
}

// ── Load library ──────────────────────────────────────────────────────────────
async function ensureLibrary() {
  const cached = LibCache.load();
  if (cached?.length) { _library = cached; return; }

  try {
    const res = await fetchLibrary();
    if (res.data?.length) {
      _library = res.data;
      LibCache.save(_library);
    }
  } catch (err) {
    toast('Gagal memuat data library', 'error');
  }
}

// ── Register page ─────────────────────────────────────────────────────────────
registerPage('search', {
  async mount(params) {
    const page = document.getElementById('page-search');
    animatePageEnter(page);

    await ensureLibrary();
    _catData = await getCategoryData();

    buildTypeFilters();
    bindSearch();
    bindTopbarSearch();

    // Focus search input
    const input = document.getElementById('main-search-input');
    if (input) {
      // Pre-fill from URL param
      if (params.q) {
        input.value = params.q;
        _query = params.q;
      }
      setTimeout(() => input.focus(), 100);
    }

    // Trigger search if query pre-filled
    if (_query) doSearch();
  },

  async unmount() {
    _query = '';
    const input = document.getElementById('main-search-input');
    if (input) input.value = '';
  }
});
