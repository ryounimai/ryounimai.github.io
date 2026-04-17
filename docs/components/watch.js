/**
 * components/watch.js — ŘΨØŬ v3.0.0
 * Vidstack v1.12.13 player — Web Components API
 */

const WatchComp = (() => {
  let _player  = null, _anime = null, _eps = [], _ep = null;
  let _vidstackLoaded = false;
  let _evtCtrl = null;   /* AbortController — cleanup listeners between episodes */

  const _MIME = {
    m3u8: 'application/x-mpegurl',
    mpd : 'application/dash+xml',
    mp4 : 'video/mp4',
    m4v : 'video/mp4',
    webm: 'video/webm',
    ts  : 'video/mp2t',
  };

  function _ext(src) { return (src || '').split('?')[0].split('.').pop().toLowerCase(); }
  function _mimeFor(src) { return _MIME[_ext(src)] || 'video/mp4'; }

  /* ── Load Vidstack dynamically (ES module) ── */
  async function _loadVidstack() {
    if (_vidstackLoaded) return;
    await import('/assets/vidstack/vidstack.js');
    _vidstackLoaded = true;
  }

  /* ── Render page layout ── */
  function _render(anime, eps, ep) {
    const page = document.getElementById('watch-page');
    if (!page) return;
    const title = I18n.titleOf(anime);
    const isManyEps = eps.length > 24;
    page.innerHTML = `
<div class="watch-layout">
  <div class="watch-col-main">
    <div class="watch-player-box" id="watch-player-box">
      <media-player
        id="ryou-player"
        title="${title.replace(/"/g, '&quot;')}"
        crossorigin
        playsinline
        class="ryou-player dark">
        <media-provider></media-provider>
        <media-video-layout></media-video-layout>
      </media-player>
    </div>
    <div class="watch-info">
      <div class="watch-info-title" id="watch-title">${title}</div>
      <div class="watch-info-ep" id="watch-ep-label">${I18n.t('episode')} ${ep.ep}${ep.title && ep.title !== 'Play Now' ? ` — ${ep.title}` : ''}</div>
      <div class="watch-nav-row" id="watch-nav-row"></div>
    </div>
  </div>
  <aside class="watch-sidebar">
    <div class="ws-header">
      <div class="ws-title">${title}</div>
      <div class="ws-count">${eps.length} ${I18n.t('episodes')}</div>
    </div>
    <div class="ws-list" id="ws-list">
      ${isManyEps ? _epGrid(anime, eps, ep) : _epCards(anime, eps, ep)}
    </div>
  </aside>
</div>`;
    _renderNavBtns(anime, eps, ep);
    _bindEpList();
    _highlightEp(ep.ep);
  }

  function _epCards(anime, eps, curEp) {
    return eps.map(ep => {
      const pct = Store.Continue.getPct(anime.id, ep.ep);
      const watched = Store.History.has(anime.id, ep.ep);
      return `<div class="ws-ep-item${ep.ep === curEp.ep ? ' active' : ''}${watched ? ' watched' : ''}" data-ep="${ep.ep}">
  <div class="ws-ep-thumb">
    <img src="${ep.thumbnail || anime.poster || ''}" alt="EP${ep.ep}" loading="lazy" onerror="this.style.display='none'">
    ${pct > 0 ? `<div class="ws-ep-thumb-progress" style="width:${pct}%"></div>` : ''}
  </div>
  <div class="ws-ep-info">
    <span class="ws-ep-num">${I18n.t('ep_short')} ${ep.ep}</span>
    <span class="ws-ep-title">${ep.title || ''}</span>
  </div>
</div>`;
    }).join('');
  }

  function _epGrid(anime, eps, curEp) {
    return `<div class="ws-ep-grid">
${eps.map(ep => {
  const watched = Store.History.has(anime.id, ep.ep);
  return `<div class="ws-ep-num-btn${ep.ep === curEp.ep ? ' active' : ''}${watched ? ' watched' : ''}" data-ep="${ep.ep}">${ep.ep}</div>`;
}).join('')}</div>`;
  }

  function _renderNavBtns(anime, eps, ep) {
    const row = document.getElementById('watch-nav-row');
    if (!row) return;
    const idx  = eps.findIndex(e => e.ep === ep.ep);
    const prev = eps[idx - 1], next = eps[idx + 1];
    row.innerHTML = `
${prev ? `<button class="btn btn-ghost btn-sm" id="btn-prev-ep">‹ EP ${prev.ep}</button>` : `<button class="btn btn-ghost btn-sm" disabled>‹ ${I18n.t('prev_ep').replace('‹ ', '')}</button>`}
<button class="btn btn-outline btn-sm" id="btn-detail-link">📋 ${I18n.t('info')}</button>
${next ? `<button class="btn btn-ghost btn-sm" id="btn-next-ep">EP ${next.ep} ›</button>` : `<button class="btn btn-ghost btn-sm" disabled>${I18n.t('next_ep').replace(' ›', '')}</button>`}`;
    document.getElementById('btn-prev-ep')?.addEventListener('click', () => loadEp(prev.ep));
    document.getElementById('btn-next-ep')?.addEventListener('click', () => loadEp(next.ep));
    document.getElementById('btn-detail-link')?.addEventListener('click', () => App.goDetail(anime.id));
  }

  function _bindEpList() {
    const list = document.getElementById('ws-list');
    if (!list) return;
    const newList = list.cloneNode(true);
    list.parentNode.replaceChild(newList, list);
    newList.addEventListener('click', e => {
      const target = e.target.closest('[data-ep]');
      if (target) loadEp(+target.dataset.ep);
    });
  }

  function _highlightEp(epNum) {
    const list = document.getElementById('ws-list');
    if (!list) return;
    list.querySelectorAll('[data-ep]').forEach(el => {
      el.classList.toggle('active', +el.dataset.ep === epNum);
    });
    const active = list.querySelector(`[data-ep="${epNum}"]`);
    if (active) {
      const delta = active.getBoundingClientRect().top - list.getBoundingClientRect().top
                  - list.clientHeight / 2 + active.clientHeight / 2;
      /* Phase 6: smooth scroll via Anime.js */
      Anim.scrollTo(list, list.scrollTop + delta, { duration: 320 });
    }
  }

  /* ── Init Vidstack player ── */
  async function _initPlayer(ep, anime) {
    await customElements.whenDefined('media-player');

    const playerEl = document.getElementById('ryou-player');
    if (!playerEl) return;

    /* ── Cleanup previous episode listeners ── */
    if (_evtCtrl) { _evtCtrl.abort(); _evtCtrl = null; }
    _evtCtrl = new AbortController();
    const sig = { signal: _evtCtrl.signal };

    _player = playerEl;

    /* load="eager" — mulai load segera saat src diset,
       bukan tunggu IntersectionObserver (default: visible) */
    _player.setAttribute('load', 'eager');

    const src  = ep.src;
    const mime = _mimeFor(src);

    /* Set source — Vidstack deteksi provider dari src + type */
    _player.src = [{ src, type: mime }];

    /* Subtitles */
    const settings = Store.Settings.get();
    if (settings.subtitles !== false && ep.subtitles?.length) {
      _player.textTracks.clear?.();
      ep.subtitles.forEach(sub => {
        _player.textTracks.add({
          kind    : 'subtitles',
          label   : sub.label || sub.lang || 'Sub',
          language: sub.lang || 'id',
          src     : sub.src,
          default : sub.default || false,
        });
      });
    }

    /* ── can-play: seek resume + autoplay ──
       Jangan andalkan internal Vidstack autoplay karena setelah episode
       pertama selesai, state `started=true` tidak di-reset → autoplay
       condition `!started() && autoPlay()` selalu false.
       Fix: panggil play() eksplisit di sini. */
    const savedTime = Store.Continue.getProgress(anime.id, ep.ep);
    _player.addEventListener('can-play', () => {
      if (savedTime > 5) _player.currentTime = savedTime;
      _player.play().catch(() => {});
    }, { once: true, ...sig });

    /* Fullscreen → landscape lock */
    _player.addEventListener('fullscreen-change', e => {
      if (e.detail && screen.orientation?.lock)
        screen.orientation.lock('landscape').catch(() => {});
      else if (!e.detail && screen.orientation?.unlock)
        screen.orientation.unlock();
    }, sig);

    /* History on first play */
    _player.addEventListener('play', () => {
      Store.History.add(anime.id, ep.ep, anime.title, ep.title, anime.poster);
    }, { once: true, ...sig });

    /* Progress save — debounced 5s */
    let _lastSave = 0;
    _player.addEventListener('time-update', () => {
      const now = Date.now();
      if (now - _lastSave < 5000) return;
      _lastSave = now;
      const ct = _player.currentTime, dur = _player.duration;
      if (ct && dur && isFinite(dur))
        Store.Continue.save(anime.id, ep.ep, anime.title, ep.title, anime.poster, ct, dur);
    }, sig);

    /* Ended — show next episode overlay */
    _player.addEventListener('ended', () => {
      const ct = _player.currentTime, dur = _player.duration;
      if (ct && dur && isFinite(dur))
        Store.Continue.save(anime.id, ep.ep, anime.title, ep.title, anime.poster, ct, dur);
      const idx  = _eps.findIndex(e => e.ep === ep.ep);
      const next = _eps[idx + 1];
      if (next) _showNextOverlay(next);
    }, sig);

    /* Error */
    _player.addEventListener('error', () => {
      Utils.Toast.error(I18n.t('error_video'));
    }, sig);

    /* Brand color */
    _player.style.setProperty('--video-brand', '#22d3ee');
  }

  /* ── Next episode overlay countdown ── */
  function _showNextOverlay(nextEp) {
    /* Append ke media-player (bukan watch-player-box) agar
       tetap terlihat saat fullscreen — media-player adalah
       fullscreen root element di Vidstack */
    const container = _player || document.getElementById('watch-player-box');
    if (!container) { loadEp(nextEp.ep); return; }

    /* Remove any existing overlay */
    document.getElementById('next-ep-overlay')?.remove();

    let secs = 3;
    const overlay = document.createElement('div');
    overlay.id = 'next-ep-overlay';
    overlay.innerHTML = `
<div class="nxt-inner">
  <div class="nxt-label">${I18n.t('next_ep')}</div>
  <div class="nxt-title">${I18n.t('ep_short')} ${nextEp.ep}${nextEp.title && nextEp.title !== 'Play Now' ? ` — ${nextEp.title}` : ''}</div>
  <div class="nxt-ring"><svg viewBox="0 0 44 44"><circle class="nxt-track" cx="22" cy="22" r="18"/><circle class="nxt-progress" id="nxt-arc" cx="22" cy="22" r="18"/></svg><span id="nxt-count">${secs}</span></div>
  <div class="nxt-actions">
    <button class="btn btn-outline btn-sm" id="nxt-cancel">Batal</button>
    <button class="btn btn-primary btn-sm" id="nxt-now">Putar Sekarang</button>
  </div>
</div>`;
    container.appendChild(overlay);

    /* Arc progress: circumference = 2π×18 ≈ 113.1 */
    const arc = document.getElementById('nxt-arc');
    const C = 2 * Math.PI * 18;
    if (arc) { arc.style.strokeDasharray = C; arc.style.strokeDashoffset = '0'; }

    /* Phase 6: ring drain via Anime.js — presisi lebih baik dari CSS transition */
    let ringAnim = null;
    if (arc && !Anim.reduced) {
      ringAnim = Anim.raw().animate(arc, {
        strokeDashoffset: [0, C],
        duration        : 3000,
        ease            : 'linear',
      });
    }

    const tick = setInterval(() => {
      secs--;
      const countEl = document.getElementById('nxt-count');
      if (countEl) countEl.textContent = secs;
      if (secs <= 0) {
        clearInterval(tick);
        ringAnim?.cancel();
        overlay.remove();
        loadEp(nextEp.ep);
      }
    }, 1000);

    document.getElementById('nxt-now')?.addEventListener('click', () => {
      clearInterval(tick); overlay.remove(); loadEp(nextEp.ep);
    });
    document.getElementById('nxt-cancel')?.addEventListener('click', () => {
      clearInterval(tick); overlay.remove();
    });
  }

  /* ── Public: load episode ── */
  async function loadEp(epNum) {
    const ep = _eps.find(e => e.ep === epNum);
    if (!ep || !_anime) return;
    _ep = ep;
    await _initPlayer(ep, _anime);
    _highlightEp(epNum);
    const title = I18n.titleOf(_anime);
    const label = document.getElementById('watch-ep-label');
    if (label) label.textContent = `${I18n.t('episode')} ${ep.ep}${ep.title && ep.title !== 'Play Now' ? ` — ${ep.title}` : ''}`;
    _renderNavBtns(_anime, _eps, ep);
    document.title = `${title} — EP ${ep.ep} · ŘΨØŬ`;
    history.replaceState(null, '', `?id=${_anime.id}&ep=${ep.ep}`);
  }

  /* ── Public: init page ── */
  async function init(animeId, epNum) {
    const page = document.getElementById('watch-page');
    if (!page) return;
    page.classList.add('active');
    page.innerHTML = `<div class="main-wrap" style="padding-top:40px;text-align:center">${I18n.t('loading')}</div>`;

    try {
      /* Load Vidstack before rendering */
      await _loadVidstack();

      const [resp, libResp] = await Promise.all([
        API.episodes(animeId),
        API.library(),
      ]);
      const anime = (libResp.data || []).find(a => a.id === animeId);
      if (!anime || !resp.episodes?.length) throw new Error('Not found');

      _anime = anime;
      _eps   = resp.episodes;
      _ep    = _eps.find(e => e.ep === +epNum) || _eps[0];

      _render(anime, _eps, _ep);
      await _initPlayer(_ep, anime);
      document.title = `${I18n.titleOf(anime)} — EP ${_ep.ep} · ŘΨØŬ`;

    } catch (e) {
      page.innerHTML = `<div class="main-wrap" style="padding-top:40px;text-align:center">
        <p style="color:var(--txt-secondary)">${I18n.t('error_load')}</p>
        <button class="btn btn-outline" onclick="history.back()" style="margin-top:16px">&larr; Kembali</button>
      </div>`;
    }
  }

  function destroy() {
    if (_evtCtrl) { _evtCtrl.abort(); _evtCtrl = null; }
    if (_player)  { _player.src = []; _player = null; }
    _anime = null; _eps = []; _ep = null;
  }

  return { init, destroy, loadEp };
})();

window.WatchComp = WatchComp;
