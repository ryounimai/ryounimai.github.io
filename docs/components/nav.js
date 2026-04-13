/**
 * components/nav.js — ŘΨØŬ v2.0.3
 * Navbar + Mobile Drawer + Search + Language switcher
 */
const Nav = (() => {
  let _library = [];
  let _searchDebounced;

  function _renderNav() {
    const nav = document.getElementById('app-nav');
    if (!nav) return;
    nav.innerHTML = `
<div class="nav-inner">
  <a href="/" class="nav-logo" id="nav-home-link">
    <img src="/res/logo.svg" alt="RYOU">
  </a>
  <div class="nav-spacer"></div>
  <div class="nav-search" id="nav-search-wrap">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input type="search" id="nav-search-input" data-i18n-placeholder="search_placeholder" placeholder="${I18n.t('search_placeholder')}" autocomplete="off">
    <button class="nav-search-clear" id="nav-search-clear" aria-label="Clear">✕</button>
    <div class="nav-search-results" id="nav-search-results"></div>
  </div>
  <nav class="nav-btn-desktop" style="display:flex;align-items:center;gap:2px">
    <button class="nav-btn" id="nav-btn-history" aria-label="${I18n.t('nav_history')}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
      <span>${I18n.t('nav_history')}</span>
    </button>
    <button class="nav-btn" id="nav-btn-settings" aria-label="${I18n.t('nav_settings')}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
    <a href="/about.html" class="nav-btn" id="nav-btn-about">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    </a>
  </nav>
  <div class="nav-lang" id="nav-lang">
    ${['id','en','ja'].map(l=>`<button class="nav-lang-btn${I18n.lang()===l?' active':''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}
  </div>
  <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</div>`;
    _bindNav();
  }

  function _renderDrawer() {
    const d = document.getElementById('app-drawer');
    if (!d) return;
    d.innerHTML = `
<div class="drawer-top">
  <div class="drawer-logo">
    <img src="/res/logo.svg" alt="RYOU">
  </div>
  <button class="drawer-close" id="drawer-close">✕</button>
</div>
<div class="drawer-search-wrap">
  <div class="nav-search" style="width:100%">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input type="search" id="drawer-search-input" placeholder="${I18n.t('search_placeholder')}" autocomplete="off">
    <div class="nav-search-results" id="drawer-search-results"></div>
  </div>
</div>
<div class="drawer-body">
  <a href="/" class="drawer-nav-item" data-page="home">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    ${I18n.t('nav_home')}
  </a>
  <button class="drawer-nav-item" id="drawer-btn-history">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
    ${I18n.t('nav_history')}
  </button>
  <button class="drawer-nav-item" id="drawer-btn-settings">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    ${I18n.t('nav_settings')}
  </button>
  <div class="drawer-divider"></div>
  <a href="/about.html" class="drawer-nav-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    ${I18n.t('nav_about')}
  </a>
</div>
<div class="drawer-footer">
  <div class="drawer-lang-row">
    <span class="drawer-lang-label">${I18n.t('settings_lang')}</span>
    <div class="drawer-lang-btns">
      ${['id','en','ja'].map(l=>`<button class="drawer-lang-btn${I18n.lang()===l?' active':''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}
    </div>
  </div>
  <button id="btn-pwa-install" class="btn-pwa-install" style="display:none">
    ⬇ Install App
  </button>
</div>`;
    _bindDrawer();

    // Tampilkan tombol install kalau prompt tersedia
    var installBtn = document.getElementById('btn-pwa-install');
    if (installBtn) {
      if (window._pwaPrompt) installBtn.style.display = 'block';
      window.addEventListener('pwaPromptReady', function () {
        installBtn.style.display = 'block';
      });
    }
  }

  function _bindNav() {
    const hamburger = document.getElementById('nav-hamburger');
    const input     = document.getElementById('nav-search-input');
    const clear     = document.getElementById('nav-search-clear');
    const results   = document.getElementById('nav-search-results');

    hamburger?.addEventListener('click', () => {
      hamburger.classList.contains('open') ? closeDrawer() : openDrawer();
    });

    input?.addEventListener('input', e => {
      const q = e.target.value.trim();
      clear.classList.toggle('show', q.length > 0);
      _searchDebounced(q, results);
    });
    input?.addEventListener('focus', () => { if (input.value.trim()) results.classList.add('open'); });
    document.addEventListener('click', e => {
      if (!e.target.closest('#nav-search-wrap')) results.classList.remove('open');
    });
    clear?.addEventListener('click', () => {
      input.value = ''; clear.classList.remove('show');
      results.classList.remove('open'); input.focus();
    });

    document.getElementById('nav-btn-history')?.addEventListener('click', () => History.open());
    document.getElementById('nav-btn-settings')?.addEventListener('click', () => Settings.open());

    document.querySelectorAll('#nav-lang .nav-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (I18n.lang() === btn.dataset.lang) return;
        I18n.setLang(btn.dataset.lang);
        location.reload();
      });
    });
  }

  function _bindDrawer() {
    document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);
    document.getElementById('drawer-btn-history')?.addEventListener('click', () => { closeDrawer(); History.open(); });
    document.getElementById('drawer-btn-settings')?.addEventListener('click', () => { closeDrawer(); Settings.open(); });
    document.getElementById('drawer-backdrop')?.addEventListener('click', closeDrawer);

    const input   = document.getElementById('drawer-search-input');
    const results = document.getElementById('drawer-search-results');
    input?.addEventListener('input', e => _searchDebounced(e.target.value.trim(), results));
    document.querySelectorAll('.drawer-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (I18n.lang() === btn.dataset.lang) return;
        I18n.setLang(btn.dataset.lang);
        location.reload();
      });
    });
  }

  function openDrawer() {
    document.getElementById('app-drawer')?.classList.add('open');
    document.getElementById('drawer-backdrop')?.classList.add('show');
    document.getElementById('nav-hamburger')?.classList.add('open');
  }
  function closeDrawer() {
    document.getElementById('app-drawer')?.classList.remove('open');
    document.getElementById('drawer-backdrop')?.classList.remove('show');
    document.getElementById('nav-hamburger')?.classList.remove('open');
  }

  function _doSearch(q, resultsEl) {
    if (!resultsEl) return;
    if (!q) { resultsEl.classList.remove('open'); return; }
    const hits = _library.filter(a => {
      const s = `${a.title} ${a.title_en||''} ${a.title_ja||''} ${a.title_romaji||''}`.toLowerCase();
      return s.includes(q.toLowerCase());
    }).slice(0, 8);
    if (!hits.length) {
      resultsEl.innerHTML = `<div class="search-no-result">${I18n.t('no_results')}</div>`;
    } else {
      resultsEl.innerHTML = hits.map(a => `
<div class="search-result-item" data-id="${a.id}">
  <img class="search-ri-thumb" src="${a.poster||''}" alt="" loading="lazy" onerror="this.style.display='none'">
  <div class="search-ri-info">
    <div class="search-ri-title">${I18n.titleOf(a)}</div>
    <div class="search-ri-meta">${a.type||''} · ${a.year||''}</div>
  </div>
</div>`).join('');
      resultsEl.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          resultsEl.classList.remove('open');
          document.getElementById('nav-search-input').value = '';
          document.getElementById('nav-search-clear')?.classList.remove('show');
          closeDrawer();
          App.goDetail(item.dataset.id);
        });
      });
    }
    resultsEl.classList.add('open');
  }

  function setLibrary(lib) { _library = lib; }

  function init() {
    _searchDebounced = Utils.debounce(_doSearch, 240);
    _renderNav();
    _renderDrawer();
  }

  return { init, setLibrary, openDrawer, closeDrawer };
})();

window.Nav = Nav;
