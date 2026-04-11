/**
 * components/index.js — ŘΨØŬ v1.4.0
 * Homepage: library loading, hero carousel, sections, filter, history panel, settings panel
 */
const IndexComp = (() => {
  let _library = [];

  /* ── History Panel ── */
  const HistoryPanel = {
    _el: null,
    open() {
      if (!this._el) this._build();
      this._refresh();
      this._el.classList.add('open');
      document.getElementById('history-backdrop')?.classList.add('show');
    },
    close() {
      this._el?.classList.remove('open');
      document.getElementById('history-backdrop')?.classList.remove('show');
    },
    _build() {
      this._el = document.getElementById('history-panel');
      if (!this._el) return;
      document.getElementById('history-backdrop')?.addEventListener('click', () => this.close());
      document.getElementById('history-close')?.addEventListener('click', () => this.close());
      document.getElementById('history-clear-btn')?.addEventListener('click', () => {
        if (confirm(I18n.t('confirm_clear'))) { Store.History.clear(); this._refresh(); }
      });
    },
    _refresh() {
      const list = Store.History.getAll();
      const el = document.getElementById('history-list');
      if (!el) return;
      if (!list.length) { el.innerHTML = `<div class="history-empty">${I18n.t('history_empty')}</div>`; return; }
      el.innerHTML = list.map(item => `
<div class="history-item" data-id="${item.animeId}" data-ep="${item.ep}">
  <img src="${item.poster||''}" alt="" loading="lazy" onerror="this.style.display='none'">
  <div style="flex:1;min-width:0">
    <div style="font-size:13px;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${item.animeTitle||''}</div>
    <div style="font-size:11px;color:var(--txt-secondary);margin-top:2px">${I18n.t('ep_short')} ${item.ep}</div>
    <div style="font-size:10px;color:var(--txt-tertiary);margin-top:2px">${Utils.fmtRelTime(item.ts)}</div>
  </div>
  <span style="color:var(--txt-tertiary);font-size:13px">›</span>
</div>`).join('');
      el.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          this.close();
          App.goWatch(item.dataset.id, item.dataset.ep);
        });
      });
    },
  };

  /* ── Settings Panel ── */
  const SettingsPanel = {
    _el: null, _serverInfo: null,
    async open() {
      if (!this._el) this._build();
      this._el.classList.add('open');
      document.getElementById('settings-backdrop')?.classList.add('show');
      if (!this._serverInfo) {
        try { this._serverInfo = await API.settings(); this._fillServer(this._serverInfo); } catch {}
      }
    },
    close() {
      this._el?.classList.remove('open');
      document.getElementById('settings-backdrop')?.classList.remove('show');
    },
    _build() {
      this._el = document.getElementById('settings-panel');
      if (!this._el) return;
      document.getElementById('settings-backdrop')?.addEventListener('click', () => this.close());
      document.getElementById('settings-close')?.addEventListener('click', () => this.close());

      // Lang
      this._el.querySelectorAll('[data-setlang]').forEach(btn => {
        btn.addEventListener('click', () => {
          I18n.setLang(btn.dataset.setlang);
          this._el.querySelectorAll('[data-setlang]').forEach(b => b.classList.toggle('active', b.dataset.setlang === btn.dataset.setlang));
          document.querySelectorAll('.nav-lang-btn,.drawer-lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === btn.dataset.setlang));
        });
      });

      // Autoplay toggle
      document.getElementById('setting-autoplay')?.addEventListener('change', e => Store.Settings.set('autoplay', e.target.checked));
      document.getElementById('setting-subtitle')?.addEventListener('change', e => Store.Settings.set('subtitles', e.target.checked));

      // Scan
      document.getElementById('btn-scan')?.addEventListener('click', async () => {
        document.getElementById('btn-scan').disabled = true;
        document.getElementById('btn-scan').textContent = I18n.t('settings_scanning');
        try {
          await API.scan(false);
          Utils.Toast.success(I18n.t('toast_scan_started'));
          setTimeout(() => { location.reload(); }, 4000);
        } catch { Utils.Toast.error(I18n.t('toast_error')); }
        document.getElementById('btn-scan').disabled = false;
      });
      document.getElementById('btn-force-scan')?.addEventListener('click', async () => {
        if (!confirm(I18n.t('settings_force_scan') + '?')) return;
        try { await API.scan(true); Utils.Toast.success(I18n.t('toast_scan_started')); setTimeout(()=>location.reload(), 4000); }
        catch { Utils.Toast.error(I18n.t('toast_error')); }
      });
      document.getElementById('btn-clear-lib')?.addEventListener('click', async () => {
        try { await API.clearCache('library'); Utils.Toast.success(I18n.t('toast_cache_done')); } catch { Utils.Toast.error(I18n.t('toast_error')); }
      });
      document.getElementById('btn-clear-all')?.addEventListener('click', async () => {
        if (!confirm(I18n.t('settings_clear_all') + '?')) return;
        try { await API.clearCache('all'); Utils.Toast.success(I18n.t('toast_cache_done')); } catch { Utils.Toast.error(I18n.t('toast_error')); }
      });

      // Fill saved settings
      const s = Store.Settings.get();
      const ap = document.getElementById('setting-autoplay');
      const sb = document.getElementById('setting-subtitle');
      if (ap) ap.checked = s.autoplay !== false;
      if (sb) sb.checked = s.subtitles !== false;
      this._el.querySelectorAll('[data-setlang]').forEach(b => b.classList.toggle('active', b.dataset.setlang === I18n.lang()));
    },
    _fillServer(info) {
      const map = { 'info-version': info.version, 'info-path': info.sdcard_root, 'info-exts': (info.video_exts||[]).join(' ') };
      Object.entries(map).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; });
    },
  };

  /* ── Filter Panel ── */
  const FilterPanel = {
    _open: false,
    toggle() { this._open ? this.close() : this.open(); },
    open() {
      document.getElementById('filter-panel')?.classList.add('open');
      document.getElementById('filter-backdrop')?.classList.add('show');
      this._open = true;
    },
    close() {
      document.getElementById('filter-panel')?.classList.remove('open');
      document.getElementById('filter-backdrop')?.classList.remove('show');
      this._open = false;
    },
    build() {
      const { genres, years } = Section.getFilterData();
      const typeChips = ['TV','Movie','OVA','ONA','Special'].map(t => `<div class="filter-chip" data-filter="type" data-val="${t}">${t}</div>`).join('');
      const genreChips = genres.slice(0, 24).map(g => `<div class="filter-chip" data-filter="genre" data-val="${g}">${g}</div>`).join('');
      const yearChips = years.slice(0, 20).map(y => `<div class="filter-chip" data-filter="year" data-val="${y}">${y}</div>`).join('');
      const statusChips = ['Ongoing','Completed'].map(s => `<div class="filter-chip" data-filter="status" data-val="${s}">${s==='Ongoing'?I18n.t('ongoing'):I18n.t('completed')}</div>`).join('');

      const body = document.getElementById('filter-body');
      if (body) body.innerHTML = `
<div class="filter-section"><div class="filter-label">${I18n.t('filter_type')}</div><div class="filter-chips">${typeChips}</div></div>
<div class="filter-section"><div class="filter-label">${I18n.t('filter_status')}</div><div class="filter-chips">${statusChips}</div></div>
<div class="filter-section"><div class="filter-label">${I18n.t('filter_year')}</div><div class="filter-chips">${yearChips}</div></div>
<div class="filter-section"><div class="filter-label">${I18n.t('filter_genre')}</div><div class="filter-chips">${genreChips}</div></div>`;

      document.getElementById('filter-backdrop')?.addEventListener('click', () => this.close());
      document.getElementById('filter-close')?.addEventListener('click', () => this.close());
      document.getElementById('filter-reset')?.addEventListener('click', () => {
        body?.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        Section.resetFilters(); this.close();
      });
      document.getElementById('filter-apply')?.addEventListener('click', () => {
        const f = { type:null, genre:null, year:null, status:null };
        body?.querySelectorAll('.filter-chip.active').forEach(c => { f[c.dataset.filter] = c.dataset.val; });
        Section.applyFilter(f); this.close();
      });
      body?.querySelectorAll('.filter-chip').forEach(c => {
        c.addEventListener('click', () => c.classList.toggle('active'));
      });
    },
  };

  async function init() {
    // Expose history/settings to Nav via global
    window.History  = HistoryPanel;
    window.Settings = SettingsPanel;

    // Render skeleton immediately
    const gridEl = document.getElementById('main-grid');
    if (gridEl) gridEl.innerHTML = Section.skeletonGrid(10);

    try {
      const resp = await API.library();
      _library = resp.data || [];

      if (!_library.length && resp.status === 'scanning') {
        Utils.Toast.show(I18n.t('scanning'), 'info', 5000);
        setTimeout(() => location.reload(), 6000);
        return;
      }
      if (!_library.length) {
        if (gridEl) gridEl.innerHTML = `<div class="no-results"><div class="no-results-icon">📂</div><h3>${I18n.t('scan_empty')}</h3><button class="btn btn-primary" style="margin-top:16px" id="btn-init-scan">${I18n.t('settings_scan')}</button></div>`;
        document.getElementById('btn-init-scan')?.addEventListener('click', async () => { await API.scan(false); Utils.Toast.success(I18n.t('toast_scan_started')); setTimeout(()=>location.reload(),5000); });
        return;
      }

      Nav.setLibrary(_library);
      Carousel.render(_library);

      // Continue watching
      const cwEl = document.getElementById('continue-wrap');
      if (cwEl) {
        Section.renderContinue(cwEl);
        if (!Store.Continue.getAll().length) cwEl.closest('.section')?.remove();
      }

      // Horizontal scroll sections
      const hsSeriesEl = document.getElementById('hs-series');
      const hsMovieEl  = document.getElementById('hs-movies');
      if (hsSeriesEl) Section.renderHScroll(hsSeriesEl, _library, 'TV');
      if (hsMovieEl)  Section.renderHScroll(hsMovieEl, _library, 'Movie');

      // Main grid
      const paginEl = document.getElementById('main-pagination');
      Section.renderGrid(_library, gridEl, paginEl);
      FilterPanel.build();

      document.getElementById('btn-filter')?.addEventListener('click', () => FilterPanel.toggle());
      Splash.hide(400);

    } catch(e) {
      console.error('[Index]', e);
      if (gridEl) gridEl.innerHTML = `<div class="no-results"><div class="no-results-icon">⚠️</div><h3>${I18n.t('error_load')}</h3><button class="btn btn-outline" onclick="location.reload()" style="margin-top:16px">${I18n.t('retry')}</button></div>`;
      Splash.hide(400);
    }
  }

  return { init };
})();

window.IndexComp = IndexComp;
