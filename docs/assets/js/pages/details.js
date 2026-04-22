/**
 * pages/details.js — RyouStream Details Page
 * Version : 1.0.2
 * Author  : Ryounime
 */

import { registerPage, go, updateTopbar } from '../router.js';
import { fetchLibrary, fetchEpisodes } from '../api.js';
import { LibCache, Settings } from '../config.js';
import {
  $, $$, el, safeImg, getDesc, fmtRating,
  typeBadgeClass, statusBadgeClass,
  watchHash, detailsHash, toast, debounce,
  FALLBACK_POSTER, FALLBACK_BANNER
} from '../utils.js';
import { animateDetailsEntrance, animateEpisodeList, animatePageEnter } from '../animations.js';

// ── State ─────────────────────────────────────────────────────────────────────
let _entry    = null;
let _episodes = [];
let _epQuery  = '';

// ── Load entry from library ────────────────────────────────────────────────────
async function getEntry(id) {
  let lib = LibCache.load();
  if (!lib?.length) {
    const res = await fetchLibrary();
    lib = res.data || [];
    if (lib.length) LibCache.save(lib);
  }
  return lib.find(e => e.id === id) || null;
}

// ── Render Details ────────────────────────────────────────────────────────────
function renderDetails(entry) {
  _entry = entry;
  const lang = Settings.get('descLang') || 'id';

  // Topbar title (mobile)
  updateTopbar('details', entry.title);

  // Banner
  const bannerEl = document.getElementById('details-banner');
  if (bannerEl) {
    const bannerSrc = entry.banner && entry.banner !== entry.poster ? entry.banner : (entry.poster || FALLBACK_BANNER);
    safeImg(bannerEl, bannerSrc, FALLBACK_BANNER);
  }

  // Poster
  const posterEl = document.getElementById('details-poster');
  if (posterEl) safeImg(posterEl, entry.poster, FALLBACK_POSTER);

  // Type badge
  const typeBadge = document.getElementById('details-type-badge');
  if (typeBadge) {
    typeBadge.className = `badge ${typeBadgeClass(entry.type)}`;
    typeBadge.textContent = entry.type || '—';
  }

  // Status badge
  const statusBadge = document.getElementById('details-status-badge');
  if (statusBadge && entry.status) {
    statusBadge.className = `badge ${statusBadgeClass(entry.status)}`;
    statusBadge.textContent = entry.status;
    statusBadge.style.display = '';
  } else if (statusBadge) {
    statusBadge.style.display = 'none';
  }

  // Title
  const titleEl = document.getElementById('details-title');
  if (titleEl) titleEl.textContent = entry.title || '—';

  const titleJaEl = document.getElementById('details-title-ja');
  if (titleJaEl) {
    titleJaEl.textContent = entry.title_ja || entry.title_romaji || '';
    titleJaEl.style.display = (entry.title_ja || entry.title_romaji) ? '' : 'none';
  }

  // Stats
  const ratingEl = document.getElementById('details-rating');
  if (ratingEl) {
    ratingEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>${fmtRating(entry.rating)}`;
    ratingEl.style.display = entry.rating ? '' : 'none';
  }

  const yearEl = document.getElementById('details-year');
  if (yearEl) {
    yearEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${entry.year || '—'}`;
  }

  const epsEl = document.getElementById('details-eps');
  if (epsEl) {
    const epsText = entry.type === 'Movie' ? '1 Film' : `${entry.episodes || '?'} Episode`;
    epsEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>${epsText}`;
  }

  const studioEl = document.getElementById('details-studio');
  if (studioEl) {
    studioEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>${entry.studio || '—'}`;
    studioEl.style.display = entry.studio ? '' : 'none';
  }

  // Genres
  const genresEl = document.getElementById('details-genres');
  if (genresEl) {
    const genres = entry.genres_disp || entry.genres || [];
    genresEl.innerHTML = genres
      .map(g => `<span class="genre-tag" data-genre="${g}">${g}</span>`)
      .join('');

    genresEl.querySelectorAll('.genre-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        go(`#category?genre=${tag.dataset.genre}`);
      });
    });
  }

  // Descriptions (3 tabs)
  const descId = document.getElementById('desc-id');
  const descEn = document.getElementById('desc-en');
  const descJa = document.getElementById('desc-ja');

  if (descId) descId.textContent = getDesc(entry, 'id') || 'Tidak tersedia.';
  if (descEn) descEn.textContent = getDesc(entry, 'en') || 'Not available.';
  if (descJa) descJa.textContent = getDesc(entry, 'ja') || '利用できません。';

  // Set active desc tab based on settings
  const activeLang = lang;
  document.querySelectorAll('.desc-tab').forEach(tab => {
    const active = tab.dataset.lang === activeLang;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active);
    const panel = document.getElementById(`desc-${tab.dataset.lang}`);
    if (panel) panel.classList.toggle('active', active);
  });

  // MAL link
  const malLink = document.getElementById('details-mal-link');
  if (malLink) {
    if (entry.mal_id) {
      malLink.href = `https://myanimelist.net/anime/${entry.mal_id}`;
      malLink.style.display = '';
    } else {
      malLink.style.display = 'none';
    }
  }

  // Play button
  const playBtn = document.getElementById('details-play-btn');
  if (playBtn) {
    playBtn.onclick = () => go(watchHash(entry.id, 1));
  }

  // Back button
  const backBtn = document.getElementById('details-back');
  if (backBtn) {
    backBtn.onclick = () => history.back();
  }

  // Extra info (aired, source, themes, demographics)
  renderExtraInfo(entry);

  // Animate
  animateDetailsEntrance(
    document.querySelector('.details-poster'),
    document.querySelector('.details-info')
  );
}

function renderExtraInfo(entry) {
  const wrap = document.getElementById('details-extra-info');
  if (!wrap) return;

  const items = [];

  if (entry.aired && entry.aired !== '—') {
    items.push({ label: 'Tayang', value: entry.aired + (entry.aired_end ? ` – ${entry.aired_end}` : '') });
  }
  if (entry.source) items.push({ label: 'Sumber', value: entry.source.toUpperCase() });
  if (entry.themes?.length) items.push({ label: 'Tema', value: entry.themes.join(', ') });
  if (entry.demographics?.length) items.push({ label: 'Demografik', value: entry.demographics.join(', ') });
  if (entry.mal_id) items.push({ label: 'MAL ID', value: entry.mal_id });

  wrap.innerHTML = items.map(item => `
    <div style="background:var(--surface);border:1px solid var(--border-2);border-radius:var(--r-lg);padding:var(--sp-3)">
      <div style="font-size:11px;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${item.label}</div>
      <div style="font-size:13px;color:var(--text-1);font-weight:500">${item.value}</div>
    </div>`).join('');

  wrap.style.display = items.length ? 'grid' : 'none';
}

// ── Render Episodes ───────────────────────────────────────────────────────────
function filterEpisodes(eps, query) {
  if (!query.trim()) return eps;
  const q = query.toLowerCase();
  return eps.filter(ep =>
    String(ep.ep).includes(q) ||
    (ep.title || '').toLowerCase().includes(q)
  );
}

function renderEpisodes(episodes) {
  const wrap    = document.getElementById('episode-list-wrap');
  const listEl  = document.getElementById('episode-list');
  const countEl = document.getElementById('ep-count-badge');
  const loading = document.getElementById('ep-loading');

  if (!listEl) return;

  if (loading) loading.style.display = 'none';

  const filtered = filterEpisodes(episodes, _epQuery);

  if (countEl) countEl.textContent = episodes.length;
  if (wrap) wrap.style.display = episodes.length ? '' : 'none';

  listEl.innerHTML = '';

  if (!filtered.length) {
    listEl.innerHTML = `<p style="color:var(--text-3);font-size:13px;padding:var(--sp-4)">Tidak ada episode yang cocok.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();
  filtered.forEach((ep, i) => {
    const item = el('div', { class: 'ep-item', 'data-ep': ep.ep });

    const thumbUrl = ep.thumbnail || FALLBACK_POSTER;
    const thumb = el('img', {
      class: 'ep-thumb',
      src: thumbUrl,
      alt: `Episode ${ep.ep}`,
      loading: 'lazy',
    });
    thumb.onerror = () => { thumb.src = FALLBACK_POSTER; thumb.onerror = null; };

    const info = el('div', { class: 'ep-info' });
    info.innerHTML = `
      <div class="ep-num">Episode ${ep.ep}</div>
      <div class="ep-title">${ep.title || `Episode ${ep.ep}`}</div>
      <div class="ep-duration">${ep.duration && ep.duration !== '—' ? ep.duration : ''}</div>`;

    const playIcon = el('div', { style: 'flex-shrink:0;color:var(--text-3)' });
    playIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

    item.append(thumb, info, playIcon);
    item.addEventListener('click', () => go(watchHash(_entry.id, ep.ep)));

    frag.append(item);
  });

  listEl.append(frag);
  animateEpisodeList(listEl);
}

// ── Desc Tab switching ────────────────────────────────────────────────────────
function initDescTabs() {
  const tabs = document.querySelectorAll('.desc-tab');
  tabs.forEach(tab => {
    if (tab.dataset.tabBound) return;
    tab.dataset.tabBound = '1';
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      document.querySelectorAll('.desc-content').forEach(panel => {
        panel.classList.toggle('active', panel.id === `desc-${tab.dataset.lang}`);
      });
    });
  });
}

// ── Episode search binding ────────────────────────────────────────────────────
function initEpSearch() {
  const input = document.getElementById('ep-search');
  if (!input) return;
  input.value = '';
  _epQuery = '';
  input.addEventListener('input', debounce(() => {
    _epQuery = input.value;
    renderEpisodes(_episodes);
  }, 200));
}

// ── Register page ─────────────────────────────────────────────────────────────
registerPage('details', {
  async mount(params) {
    const page = document.getElementById('page-details');
    animatePageEnter(page);

    const { id } = params;
    if (!id) { go('#home'); return; }

    // Reset
    _episodes = [];
    _epQuery  = '';
    const listEl = document.getElementById('episode-list');
    if (listEl) listEl.innerHTML = '';
    const epLoading = document.getElementById('ep-loading');
    if (epLoading) epLoading.style.display = 'none';
    const wrap = document.getElementById('episode-list-wrap');
    if (wrap) wrap.style.display = 'none';

    initDescTabs();
    initEpSearch();

    try {
      const entry = await getEntry(id);
      if (!entry) {
        toast('Anime tidak ditemukan', 'error');
        go('#archive');
        return;
      }

      renderDetails(entry);

      // Load episodes async
      if (epLoading) epLoading.style.display = 'block';
      try {
        const epData = await fetchEpisodes(id);
        _episodes = epData.episodes || [];
        renderEpisodes(_episodes);
      } catch {
        if (epLoading) epLoading.style.display = 'none';
        toast('Gagal memuat episode', 'warning');
      }

    } catch (err) {
      console.error('[Details] mount error:', err);
      toast('Gagal memuat detail anime', 'error');
    }
  },

  async unmount() {
    _entry    = null;
    _episodes = [];
  }
});
