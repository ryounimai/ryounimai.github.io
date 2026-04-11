/**
 * components/section.js — ŘΨØŬ v1.4.0
 * Grid, horizontal scroll, continue watching, filter, pagination
 */
const Section = (() => {
  /* ── Card builders ── */
  function _animeCard(item, pct = 0) {
    const title = I18n.titleOf(item);
    return `
<div class="anime-card fade-up" data-id="${item.id}">
  <div class="ac-poster">
    <img src="${item.poster||''}" alt="${title}" loading="lazy" onerror="this.style.display='none'">
    <div class="ac-overlay">
      <div class="ac-play"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
    </div>
    ${pct>0?`<div class="ac-progress"><div class="ac-progress-bar" style="width:${pct}%"></div></div>`:''}
  </div>
  <div class="ac-body">
    <div class="ac-title line-clamp-2">${title}</div>
    <div class="ac-meta">
      <span class="ac-type">${item.type||'TV'}</span>
      ${item.year?`<span class="ac-dot">·</span><span>${item.year}</span>`:''}
      ${item.rating>0?`<span class="ac-dot">·</span><span>⭐${Number(item.rating).toFixed(1)}</span>`:''}
    </div>
  </div>
</div>`;
  }

  function _skeletonGrid(n = 10) {
    return `<div class="sk-grid">${Array(n).fill(`
<div><div class="sk-card-poster skeleton"></div>
<div class="sk-card-line skeleton"></div>
<div class="sk-card-line skeleton sk-card-line-sm"></div></div>`).join('')}</div>`;
  }

  function _bindCards(container) {
    container.querySelectorAll('.anime-card').forEach(card => {
      card.addEventListener('click', () => App.goDetail(card.dataset.id));
    });
  }

  /* ── Continue Watching ── */
  function renderContinue(container) {
    const list = Store.Continue.getAll();
    if (!list.length) { container.closest('.section')?.remove(); return; }
    container.innerHTML = `<div class="continue-row">
${list.map(item => `
<div class="cw-card" data-id="${item.animeId}" data-ep="${item.ep}">
  <div class="cw-poster">
    <img src="${item.poster||''}" alt="" loading="lazy" onerror="this.style.display='none'">
    <div class="cw-progress"><div class="cw-progress-bar" style="width:${item.pct||0}%"></div></div>
    <button class="cw-remove" data-remove="${item.animeId}" title="Hapus">✕</button>
  </div>
  <div class="cw-body">
    <div class="cw-title line-clamp-2">${item.animeTitle||''}</div>
    <div class="cw-ep">${I18n.t('ep_short')} ${item.ep}</div>
  </div>
</div>`).join('')}
</div>`;
    container.querySelectorAll('.cw-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.cw-remove')) return;
        App.goWatch(card.dataset.id, card.dataset.ep);
      });
    });
    container.querySelectorAll('.cw-remove').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); Store.Continue.remove(btn.dataset.remove); renderContinue(container); });
    });
  }

  /* ── Horizontal scroll section ── */
  function renderHScroll(container, library, type) {
    const items = library.filter(a => a.type === type && a.poster)
      .sort((a,b) => (b.rating||0)-(a.rating||0)).slice(0, 20);
    if (!items.length) { container.closest('.section')?.remove(); return; }
    container.innerHTML = `<div class="hscroll-wrap">
${items.map((item, i) => `
<div class="hs-card" data-id="${item.id}">
  <div class="hs-poster">
    <img src="${item.poster}" alt="" loading="lazy" onerror="this.style.display='none'">
    <div class="hs-rank${i<3?' gold':''}">
      ${i<9?i+1:i+1}
    </div>
  </div>
  <div class="hs-body">
    <div class="hs-title line-clamp-2">${I18n.titleOf(item)}</div>
    <div class="hs-meta">${item.year||''} ${item.rating>0?`· ⭐${Number(item.rating).toFixed(1)}`:''}</div>
  </div>
</div>`).join('')}
</div>`;
    container.querySelectorAll('.hs-card').forEach(c => c.addEventListener('click', () => App.goDetail(c.dataset.id)));
  }

  /* ── Main grid with pagination + filter ── */
  let _allItems = [], _filtered = [], _page = 1, _perPage = 20;
  let _activeFilters = { type: null, genre: null, year: null, status: null };
  let _gridContainer = null, _paginationContainer = null;

  function _applyFilters() {
    _filtered = _allItems.filter(a => {
      if (_activeFilters.type   && a.type   !== _activeFilters.type)   return false;
      if (_activeFilters.status && a.status !== _activeFilters.status) return false;
      if (_activeFilters.year   && a.year   !== _activeFilters.year)   return false;
      if (_activeFilters.genre  && !(a.genres||[]).includes(_activeFilters.genre)) return false;
      return true;
    });
    _page = 1;
    _renderGrid();
    _renderPagination();
  }

  function _renderGrid() {
    if (!_gridContainer) return;
    const start = (_page - 1) * _perPage, end = start + _perPage;
    const slice = _filtered.slice(start, end);
    if (!slice.length) {
      _gridContainer.innerHTML = `<div class="no-results"><div class="no-results-icon">🔍</div><h3>${I18n.t('no_results')}</h3></div>`;
      return;
    }
    _gridContainer.innerHTML = `<div class="anime-grid">${slice.map(a => _animeCard(a, Store.Continue.getPct(a.id, Store.Continue.getAll().find(c=>c.animeId===a.id)?.ep||1))).join('')}</div>`;
    _bindCards(_gridContainer);
  }

  function _renderPagination() {
    if (!_paginationContainer) return;
    const pages = Math.ceil(_filtered.length / _perPage);
    if (pages <= 1) { _paginationContainer.innerHTML = ''; return; }
    let html = '';
    const btn = (p, label, active, disabled) =>
      `<button class="pg-btn${active?' active':''}${disabled?' disabled':''}" ${disabled?'disabled':''} data-page="${p}">${label}</button>`;
    html += btn(_page - 1, '‹', false, _page === 1);
    for (let p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - _page) <= 2) html += btn(p, p, p === _page, false);
      else if (Math.abs(p - _page) === 3) html += '<span class="pg-ellipsis">…</span>';
    }
    html += btn(_page + 1, '›', false, _page === pages);
    _paginationContainer.innerHTML = html;
    _paginationContainer.querySelectorAll('.pg-btn:not([disabled])').forEach(b => {
      b.addEventListener('click', () => { _page = +b.dataset.page; _renderGrid(); _renderPagination(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    });
  }

  function renderGrid(library, gridEl, paginEl) {
    _allItems = library; _filtered = library; _gridContainer = gridEl; _paginationContainer = paginEl;
    _page = 1;
    if (!library.length) { gridEl.innerHTML = _skeletonGrid(); return; }
    _renderGrid(); _renderPagination();
  }

  function applyFilter(filters) { Object.assign(_activeFilters, filters); _applyFilters(); }
  function resetFilters() { _activeFilters = { type:null, genre:null, year:null, status:null }; _applyFilters(); }
  function filterBy(q) {
    if (!q) { _filtered = _allItems; }
    else { const ql = q.toLowerCase(); _filtered = _allItems.filter(a => `${a.title} ${a.title_en||''} ${a.title_ja||''}`.toLowerCase().includes(ql)); }
    _page = 1; _renderGrid(); _renderPagination();
  }
  function getFilterData() {
    const genres = [...new Set(_allItems.flatMap(a => a.genres||[]))].sort();
    const years  = [...new Set(_allItems.map(a=>a.year).filter(Boolean))].sort().reverse();
    return { genres, years };
  }

  return { renderContinue, renderHScroll, renderGrid, applyFilter, resetFilters, filterBy, getFilterData, skeletonGrid: _skeletonGrid, animeCard: _animeCard, bindCards: _bindCards };
})();

window.Section = Section;
