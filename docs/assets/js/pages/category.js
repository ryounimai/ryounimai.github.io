/**
 * pages/category.js — RyouStream Category Page
 * Version : 1.0.0 Epsilon
 * Author  : Ryounime
 */

import { registerPage, go } from '../router.js';
import { fetchLibrary } from '../api.js';
import { LibCache, apiBaseReady } from '../config.js';
import {
  $, buildAnimeCard, getCategoryData,
  genreToCategory, detailsHash, toast
} from '../utils.js';
import {
  animateCategoryGrid, animateCards, animatePageEnter
} from '../animations.js';

// ── State ─────────────────────────────────────────────────────────────────────
let _library  = [];
let _catData  = null;
let _activeCat = null;

// ── Build genre map ────────────────────────────────────────────────────────────
function buildGenreMap(lib) {
  const map = {}; // { genreId: [entries] }

  lib.forEach(entry => {
    const genres = [...(entry.genres_disp || []), ...(entry.genres || [])];
    const seen   = new Set();
    genres.forEach(g => {
      const catId = genreToCategory(g);
      if (!seen.has(catId)) {
        seen.add(catId);
        if (!map[catId]) map[catId] = [];
        map[catId].push(entry);
      }
    });
  });

  return map;
}

// ── Render category grid ──────────────────────────────────────────────────────
function renderCategoryGrid(genreMap) {
  const grid = document.getElementById('category-grid');
  const detail = document.getElementById('category-detail');
  if (!grid || !_catData) return;

  grid.innerHTML = '';
  if (detail) detail.style.display = 'none';

  const frag = document.createDocumentFragment();

  _catData.genres.forEach(cat => {
    const items = genreMap[cat.id];
    if (!items?.length) return;

    // Pick a cover image from highest-rated item in this genre
    const cover = items.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))[0];
    const coverUrl = cover?.banner || cover?.poster || '';

    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      ${coverUrl ? `<div class="category-card-bg" style="background-image:url('${coverUrl}')"></div>` : ''}
      <div class="category-card-overlay"></div>
      <div class="category-card-label">
        <span>${cat.icon} ${cat.label}</span>
        <span class="category-card-count">${items.length} judul</span>
      </div>`;

    card.addEventListener('click', () => {
      showCategoryDetail(cat, items);
    });

    frag.append(card);
  });

  grid.append(frag);
  animateCategoryGrid(grid);
}

// ── Show category detail ──────────────────────────────────────────────────────
function showCategoryDetail(cat, items) {
  const grid   = document.getElementById('category-grid');
  const detail = document.getElementById('category-detail');
  const titleEl = document.getElementById('category-detail-title');
  const countEl = document.getElementById('category-detail-count');
  const detailGrid = document.getElementById('category-detail-grid');

  if (!detail || !detailGrid) return;

  _activeCat = cat.id;

  // Update title
  if (titleEl) titleEl.textContent = `${cat.icon} ${cat.label}`;
  if (countEl) countEl.textContent = items.length;

  // Sort by rating
  const sorted = [...items].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));

  // Render grid
  detailGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  sorted.forEach(entry => {
    const card = buildAnimeCard(entry);
    card.addEventListener('click', () => go(detailsHash(entry.id)));
    frag.append(card);
  });
  detailGrid.append(frag);

  // Show detail, hide main grid
  if (grid) grid.style.display = 'none';
  detail.style.display = '';

  animateCards(detailGrid);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Back button
  const backBtn = document.getElementById('category-back-btn');
  if (backBtn) {
    backBtn.onclick = () => {
      detail.style.display = 'none';
      if (grid) grid.style.display = '';
      _activeCat = null;
    };
  }
}

// ── Load library ──────────────────────────────────────────────────────────────
async function loadCategories() {
  await apiBaseReady.catch(() => {});
  let lib = LibCache.load();

  if (!lib?.length) {
    const grid = document.getElementById('category-grid');
    if (grid) grid.innerHTML = `<div class="spinner" style="margin:48px auto"></div>`;

    try {
      const res = await fetchLibrary();
      if (res.status === 'scanning') {
        toast('Library sedang di-scan...', 'warning', 4000);
        setTimeout(loadCategories, 3000);
        return;
      }
      lib = res.data;
      LibCache.save(lib);
    } catch {
      toast('Gagal memuat library', 'error');
      return;
    }
  }

  _library = lib;
  _catData = await getCategoryData();

  const genreMap = buildGenreMap(_library);
  renderCategoryGrid(genreMap);
}

// ── Register page ─────────────────────────────────────────────────────────────
registerPage('category', {
  async mount(params) {
    const page = document.getElementById('page-category');
    animatePageEnter(page);

    // Reset detail view
    const detail = document.getElementById('category-detail');
    const grid   = document.getElementById('category-grid');
    if (detail) detail.style.display = 'none';
    if (grid)   grid.style.display   = '';

    await loadCategories();

    // If URL has genre param, auto-open that category
    if (params.genre && _catData) {
      const cat = _catData.genres.find(c => c.id === params.genre);
      if (cat && _library.length) {
        const genreMap = buildGenreMap(_library);
        const items = genreMap[params.genre] || [];
        if (items.length) showCategoryDetail(cat, items);
      }
    }
  },

  async unmount() {
    _activeCat = null;
  }
});
