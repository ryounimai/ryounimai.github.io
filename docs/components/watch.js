/**
 * components/watch.js — ŘΨØŬ v1.4.0
 * Responsive control bar: Mobile / Tablet / PC+TV
 */

/* ══════════════════════════════════════════════════════════════════════
   FORMAT WAKTU — selalu 2 digit (00:30, tidak 0:30)
   ══════════════════════════════════════════════════════════════════════ */
videojs.setFormatTime(function (seconds, guide) {
  var s   = Math.floor(Math.abs(seconds));
  var neg = seconds < 0 ? '-' : '';
  var h   = Math.floor(s / 3600);
  var m   = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  var mm  = m   < 10 ? '0' + m   : '' + m;
  var ss  = sec < 10 ? '0' + sec : '' + sec;
  if (h > 0 || (guide && guide >= 3600)) {
    var hh = h < 10 ? '0' + h : '' + h;
    return neg + hh + ':' + mm + ':' + ss;
  }
  return neg + mm + ':' + ss;
});

/* ══════════════════════════════════════════════════════════════════════
   GEAR BUTTON — placeholder untuk Quality Selector
   TODO: implementasikan saat backend mendukung multi-resolusi
   ══════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════
   WATCH COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
const WatchComp = (() => {
  let _player = null, _anime = null, _eps = [], _ep = null;

  const _NATIVE_EXTS = new Set(['mkv','avi']);
  function _ext(src) { return (src||'').split('?')[0].split('.').pop().toLowerCase(); }
  function _isNative(src) { return _NATIVE_EXTS.has(_ext(src)); }
  function _mimeFor(src) {
    return { m3u8:'application/x-mpegurl', mpd:'application/dash+xml', mp4:'video/mp4',
             m4v:'video/mp4', webm:'video/webm', ts:'video/mp2t' }[_ext(src)] || '';
  }

  /* ── Render layout ── */
  function _render(anime, eps, ep) {
    const page = document.getElementById('watch-page');
    if (!page) return;
    const title = I18n.titleOf(anime);
    const isManyEps = eps.length > 24;
    page.innerHTML = `
<div class="watch-layout">
  <div class="watch-col-main">
    <div class="watch-player-box" id="watch-player-box">
      <video id="ryou-player" class="video-js vjs-ryou vjs-big-play-centered"
        playsinline webkit-playsinline crossorigin="anonymous"
        controlsList="nodownload noremoteplayback"
        oncontextmenu="return false" poster=""></video>
    </div>
    <div class="watch-info">
      <div class="watch-info-title" id="watch-title">${title}</div>
      <div class="watch-info-ep" id="watch-ep-label">${I18n.t('episode')} ${ep.ep}${ep.title&&ep.title!=='Play Now'?` — ${ep.title}`:''}</div>
      <div class="watch-nav-row" id="watch-nav-row"></div>
    </div>
  </div>
  <aside class="watch-sidebar">
    <div class="ws-header">
      <div class="ws-title" id="ws-title">${title}</div>
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
      return `<div class="ws-ep-item${ep.ep===curEp.ep?' active':''}${watched?' watched':''}" data-ep="${ep.ep}">
  <div class="ws-ep-thumb">
    <img src="${ep.thumbnail||anime.poster||''}" alt="EP${ep.ep}" loading="lazy" onerror="this.style.display='none'">
    ${pct>0?`<div class="ws-ep-thumb-progress" style="width:${pct}%"></div>`:''}
  </div>
  <div class="ws-ep-info">
    <span class="ws-ep-num">${I18n.t('ep_short')} ${ep.ep}</span>
    <span class="ws-ep-title">${ep.title||''}</span>
  </div>
</div>`;
    }).join('');
  }

  function _epGrid(anime, eps, curEp) {
    return `<div class="ws-ep-grid">
${eps.map(ep => {
  const watched = Store.History.has(anime.id, ep.ep);
  return `<div class="ws-ep-num-btn${ep.ep===curEp.ep?' active':''}${watched?' watched':''}" data-ep="${ep.ep}">${ep.ep}</div>`;
}).join('')}</div>`;
  }

  function _renderNavBtns(anime, eps, ep) {
    const row = document.getElementById('watch-nav-row');
    if (!row) return;
    const idx  = eps.findIndex(e => e.ep === ep.ep);
    const prev = eps[idx - 1], next = eps[idx + 1];
    row.innerHTML = `
${prev ? `<button class="btn btn-ghost btn-sm" id="btn-prev-ep">‹ EP ${prev.ep}</button>` : `<button class="btn btn-ghost btn-sm" disabled>‹ ${I18n.t('prev_ep').replace('‹ ','')}</button>`}
<button class="btn btn-outline btn-sm" id="btn-detail-link">📋 ${I18n.t('info')}</button>
${next ? `<button class="btn btn-ghost btn-sm" id="btn-next-ep">EP ${next.ep} ›</button>` : `<button class="btn btn-ghost btn-sm" disabled>${I18n.t('next_ep').replace(' ›','')}</button>`}`;
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
      list.scrollTop += delta;
    }
  }

  /* ── Video.js player ── */
  function _recreateVideoEl() {
    const box = document.getElementById('watch-player-box');
    if (!box) return;
    const old = document.getElementById('ryou-player');
    if (old) old.remove();
    const v = document.createElement('video');
    v.id        = 'ryou-player';
    v.className = 'video-js vjs-ryou vjs-big-play-centered';
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('crossorigin', 'anonymous');
    v.setAttribute('controlsList', 'nodownload noremoteplayback');
    v.setAttribute('oncontextmenu', 'return false');
    v.setAttribute('poster', '');
    box.appendChild(v);
  }

  function _initPlayer(ep, anime) {
    const savedTime = Store.Continue.getProgress(anime.id, ep.ep);
    const src       = ep.src;
    const isNative  = _isNative(src);

    /* ── Default subtitle prefs (hanya jika belum pernah diset user) ── */
    const TTS_KEY = 'vjs-text-track-settings';
    if (!localStorage.getItem(TTS_KEY)) {
      localStorage.setItem(TTS_KEY, JSON.stringify({
        backgroundColor  : '#000000',
        backgroundOpacity: '0',
        color            : '#ffffff',
        edgeStyle        : 'uniform',
        fontFamily       : 'proportionalSansSerif',
        fontPercent      : 1,
        textOpacity      : '1',
        windowColor      : '#000000',
        windowOpacity    : '0'
      }));
    }

    if (_player) { _player.dispose(); _player = null; }
    _recreateVideoEl();

    const settings = Store.Settings.get();
    const lang     = I18n.lang();

    _player = videojs('ryou-player', {
      controls           : true,
      autoplay           : 'any',
      preload            : 'auto',
      playbackRates      : [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      language           : lang,
      fluid              : false,
      fill               : true,
      enableSmoothSeeking: true,
      userActions        : { hotkeys: true },

      /* ── Control bar: urutan sesuai desain, CSS atur visibilitas ── */
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',   // (+) — tampil tablet+ & PC
          'timeDivider',          //  /  — tampil PC saja
          'durationDisplay',      // total dur — tampil tablet+
          'progressControl',      // selalu
          'remainingTimeDisplay', // (-) — selalu
          'playbackRateMenuButton',
          'subsCapsButton',
          'pictureInPictureToggle',  // tampil tablet+ via CSS
          'fullscreenToggle',
        ],
        volumePanel: { inline: true },
      },

      html5: {
        nativeTextTracks: false,
        vhs: { overrideNative: !isNative, allowSeeksWithinUnsafeLiveWindow: true },
      },
    });

    _player.ready(() => {
      const el = _player.el();
      el.addEventListener('contextmenu', e => e.preventDefault(), true);
      el.addEventListener('touchstart', e => {
        if (e.touches.length > 1) e.preventDefault();
      }, { passive: false });
    });

    const mime = isNative ? '' : _mimeFor(src);
    _player.src(mime ? { src, type: mime } : { src });

    if (settings.subtitles !== false) {
      (ep.subtitles || []).forEach(sub => {
        _player.addRemoteTextTrack({
          kind   : 'subtitles',
          label  : sub.label || sub.lang,
          srclang: sub.lang || 'id',
          src    : sub.src,
          default: sub.default || false
        }, false);
      });
    }

    if (savedTime > 5) {
      _player.one('loadedmetadata', () => { _player.currentTime(savedTime); });
    }

    _player.on('fullscreenchange', () => {
      if (_player.isFullscreen() && screen.orientation?.lock)
        screen.orientation.lock('landscape').catch(() => {});
      else if (!_player.isFullscreen() && screen.orientation?.unlock)
        screen.orientation.unlock();
    });

    _player.one('play', () => {
      Store.History.add(anime.id, ep.ep, anime.title, ep.title, anime.poster);
    });

    let _lastSave = 0;
    _player.on('timeupdate', () => {
      const now = Date.now();
      if (now - _lastSave < 5000) return;
      _lastSave = now;
      const ct = _player.currentTime(), dur = _player.duration();
      if (ct && dur && isFinite(dur))
        Store.Continue.save(anime.id, ep.ep, anime.title, ep.title, anime.poster, ct, dur);
    });

    _player.on('ended', () => {
      if (_player.loop()) return;
      const ct = _player.currentTime(), dur = _player.duration();
      if (ct && dur && isFinite(dur))
        Store.Continue.save(anime.id, ep.ep, anime.title, ep.title, anime.poster, ct, dur);
      const s = Store.Settings.get();
      if (s.autoplay !== false) {
        const idx  = _eps.findIndex(e => e.ep === ep.ep);
        const next = _eps[idx + 1];
        if (next) { setTimeout(() => loadEp(next.ep), 1200); }
      }
    });

    _player.on('error', () => { Utils.Toast.error(I18n.t('error_video')); });
  }

  /* ── Public API ── */
  function loadEp(epNum) {
    const ep = _eps.find(e => e.ep === epNum);
    if (!ep || !_anime) return;
    _ep = ep;
    _initPlayer(ep, _anime);
    _highlightEp(epNum);
    const title = I18n.titleOf(_anime);
    const label = document.getElementById('watch-ep-label');
    if (label) label.textContent = `${I18n.t('episode')} ${ep.ep}${ep.title&&ep.title!=='Play Now'?` — ${ep.title}`:''}`;
    _renderNavBtns(_anime, _eps, ep);
    document.title = `${title} — EP ${ep.ep} · ŘΨØŬ`;
    history.replaceState(null, '', `?id=${_anime.id}&ep=${ep.ep}`);
  }

  async function init(animeId, epNum) {
    const page = document.getElementById('watch-page');
    if (!page) return;
    page.classList.add('active');
    page.innerHTML = `<div class="main-wrap" style="padding-top:40px;text-align:center">${I18n.t('loading')}</div>`;
    try {
      const resp    = await API.episodes(animeId);
      const libResp = await API.library();
      const anime   = (libResp.data || []).find(a => a.id === animeId);
      if (!anime || !resp.episodes?.length) throw new Error('Not found');
      _anime = anime; _eps = resp.episodes;
      _ep = _eps.find(e => e.ep === +epNum) || _eps[0];
      _render(anime, _eps, _ep);
      _initPlayer(_ep, anime);
      document.title = `${I18n.titleOf(anime)} — EP ${_ep.ep} · ŘΨØŬ`;
    } catch (e) {
      page.innerHTML = `<div class="main-wrap" style="padding-top:40px;text-align:center">
        <p style="color:var(--txt-secondary)">${I18n.t('error_load')}</p>
        <button class="btn btn-outline" onclick="history.back()" style="margin-top:16px">&larr; Kembali</button>
      </div>`;
    }
  }

  function destroy() {
    if (_player) { _player.dispose(); _player = null; }
    _anime = null; _eps = []; _ep = null;
  }

  return { init, destroy, loadEp };
})();

window.WatchComp = WatchComp;
