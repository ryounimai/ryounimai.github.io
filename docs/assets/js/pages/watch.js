/**
 * pages/watch.js — RyouStream Watch Page
 * Version : 1.1.0
 * Redesigned UX — clean controls bar + drawer episode list
 */

import { registerPage, go, updateTopbar } from '../router.js';
import { fetchLibrary, fetchEpisodes }     from '../api.js';
import { LibCache, Settings, Positions, History } from '../config.js';
import { $, el, safeImg, toast, resolveMediaSrc, watchHash, detailsHash, FALLBACK_THUMB } from '../utils.js';
import { animateEpisodeList, animatePageEnter } from '../animations.js';

// ── State ─────────────────────────────────────────────────────────────────────
let _entry     = null;
let _episodes  = [];
let _filtered  = [];   // after search
let _currentEp = null;
let _playerEl  = null;
let _nextTimer = null;
let _saveTimer = null;


// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

async function getEntry(id) {
  let lib = LibCache.load();
  if (!lib?.length) {
    try { const r = await fetchLibrary(); lib = r.data || []; if (lib.length) LibCache.save(lib); }
    catch { return null; }
  }
  return lib.find(e => e.id === id) || null;
}

const getNext = () => {
  if (!_currentEp || !_episodes.length) return null;
  const i = _episodes.findIndex(e => e.ep === _currentEp.ep);
  return i >= 0 && i < _episodes.length - 1 ? _episodes[i + 1] : null;
};
const getPrev = () => {
  if (!_currentEp || !_episodes.length) return null;
  const i = _episodes.findIndex(e => e.ep === _currentEp.ep);
  return i > 0 ? _episodes[i - 1] : null;
};

// ── Player ────────────────────────────────────────────────────────────────────
function destroyPlayer() {
  if (_playerEl) {
    try { _playerEl.pause?.(); } catch {}
    _playerEl.remove();
    _playerEl = null;
  }
}

function buildPlayer(ep) {
  const mount = document.getElementById('player-mount');
  if (!mount) return;

  destroyPlayer();

  const srcUrl = resolveMediaSrc(ep.src);
  if (!srcUrl) { showError('URL video tidak valid.'); return; }

  const player   = document.createElement('media-player');
  const provider = document.createElement('media-provider');
  const layout   = document.createElement('media-video-layout');

  // Subtitle tracks
  (ep.subtitles || []).forEach((sub, i) => {
    const subSrc = resolveMediaSrc(sub.src || sub.url || '');
    if (!subSrc) return;
    const track = document.createElement('track');
    track.setAttribute('kind',      'subtitles');
    track.setAttribute('src',       subSrc);
    track.setAttribute('label',     sub.label || `Sub ${i + 1}`);
    track.setAttribute('srclang',   sub.lang  || 'id');
    track.setAttribute('data-type', 'vtt');   // Vidstack 1.12.x: REQUIRED or src is ignored
    if ((i === 0 && Settings.get('subtitleEnabled')) || sub.default)
      track.setAttribute('default', '');
    provider.append(track);
  });

  player.append(provider, layout);

  // ── MOUNT FIRST, SET SRC LAST ──────────────────────────────────────────────
  mount.innerHTML = '';
  mount.append(player);
  _playerEl = player;

  player.setAttribute('crossorigin', 'anonymous');
  player.setAttribute('playsinline', '');
  player.setAttribute('preload',     'metadata');
  player.setAttribute('title', `${_entry?.title || ''} — Ep ${ep.ep}`);
  if (typeof Settings.get('volume') === 'number') player.volume = Settings.get('volume');

  player.src = srcUrl; // set last!

  // Events
  player.addEventListener('can-play', onCanPlay, { once: false });
  player.addEventListener('time-update', onTimeUpdate);
  player.addEventListener('ended',      onEnded);
  player.addEventListener('error',      () => showError('Format tidak didukung atau file rusak.'));
  player.addEventListener('volume-change', () => {
    if (player.volume != null) Settings.set('volume', player.volume);
  });
}

function onCanPlay() {
  hideError();
  // Pastikan next-card dan skip sembunyi saat video siap (episode baru/resume)
  hideNextCard();
  const skipBtn = document.getElementById('skip-intro-btn');
  if (skipBtn) skipBtn.style.display = 'none';

  if (Settings.get('autoplay')) _playerEl?.play?.().catch(() => {});

  // Restore position
  if (Settings.get('rememberPos') && _entry && _currentEp) {
    const saved = Positions.get(_entry.id, _currentEp.ep);
    if (saved?.time > 10 && saved?.duration > 0) {
      const pct = saved.time / saved.duration;
      if (pct > 0.05 && pct < 0.95 && _playerEl) {
        _playerEl.currentTime = saved.time;
        toast(`Melanjutkan dari ${fmt(saved.time)}`, 'info', 2000);
      }
    }
  }
}

// Track show-states to minimize DOM ops
let _skipShown = false;
let _nextShown = false;

function onTimeUpdate() {
  if (!_playerEl) return;
  const time = _playerEl.currentTime || 0;
  const dur  = _playerEl.duration    || 0;

  // Throttled position save
  if (!_saveTimer && time > 5 && dur > 0) {
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      if (Settings.get('rememberPos') && _entry && _currentEp)
        Positions.save(_entry.id, _currentEp.ep, time, dur);
    }, 5000);
  }

  // Skip intro btn (5–120s) — only toggle when state changes
  const shouldShowSkip = (time >= 5 && time <= 120);
  if (shouldShowSkip !== _skipShown) {
    _skipShown = shouldShowSkip;
    const skipBtn = document.getElementById('skip-intro-btn');
    if (skipBtn) skipBtn.style.display = shouldShowSkip ? 'inline-flex' : 'none';
  }

  // Next card (last 90s, video > 2min) — only toggle when state changes
  const shouldShowNext = !!getNext() && dur > 120 && (dur - time) < 90 && (dur - time) > 0;
  if (shouldShowNext && !_nextShown) {
    _nextShown = true;
    showNextCard(getNext());
  } else if (!shouldShowNext && _nextShown) {
    _nextShown = false;
    hideNextCard();
  }
}

function onEnded() {
  clearAutoNext();
  if (!Settings.get('autoNext')) { hideNextCard(); return; }
  const next = getNext();
  if (!next) { hideNextCard(); return; }

  showNextCard(next);

  let rem = 5;
  const cd = document.getElementById('next-ep-countdown');
  const tick = () => {
    if (cd) cd.textContent = `Auto dalam ${rem}s`;
    if (rem-- <= 0) { clearAutoNext(); hideNextCard(); playEpisode(next); return; }
    _nextTimer = setTimeout(tick, 1000);
  };
  tick();

  const btn = document.getElementById('next-ep-card');
  if (btn) btn.onclick = () => { clearAutoNext(); hideNextCard(); playEpisode(next); };
}

function clearAutoNext() {
  if (_nextTimer) { clearTimeout(_nextTimer); _nextTimer = null; }
  const cd = document.getElementById('next-ep-countdown');
  if (cd) cd.textContent = '';
}

// ── Error ─────────────────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('player-error');
  const mg = document.getElementById('player-error-msg');
  if (el) el.style.display = 'flex';
  if (mg) mg.textContent = msg;
}
function hideError() {
  const el = document.getElementById('player-error');
  if (el) el.style.display = 'none';
}

// ── Skip intro ────────────────────────────────────────────────────────────────
function setupSkipBtn() {
  const btn = document.getElementById('skip-intro-btn');
  if (!btn) return;
  btn.style.display = 'none';
  btn.onclick = () => {
    if (_playerEl) _playerEl.currentTime = 90;
    btn.style.display = 'none';
  };
}

// ── Next card ─────────────────────────────────────────────────────────────────
function showNextCard(nextEp) {
  const card    = document.getElementById('next-ep-overlay');
  const thumb   = document.getElementById('next-ep-thumb');
  const title   = document.getElementById('next-ep-title');
  const nextBtn = document.getElementById('watch-next-btn');
  if (!card) return;
  if (card.style.display === 'flex') return; // already visible
  if (thumb) safeImg(thumb, nextEp.thumbnail, FALLBACK_THUMB);
  if (title) title.textContent = nextEp.title ? `Ep ${nextEp.ep}: ${nextEp.title}` : `Ep ${nextEp.ep}`;
  card.style.display = 'flex';
  // Hide the standalone next button (JS-based, no :has() needed)
  if (nextBtn) nextBtn.style.display = 'none';
}
function hideNextCard() {
  const card    = document.getElementById('next-ep-overlay');
  const nextBtn = document.getElementById('watch-next-btn');
  if (card) card.style.display = 'none';
  // Restore standalone next button
  if (nextBtn) nextBtn.style.display = '';
  clearAutoNext();
}

// ── Episode list is inline (mobile) / sidebar (desktop) ──────────────────

// ── Subtitle panel ────────────────────────────────────────────────────────────
function renderSubtitlePanel(subtitles) {
  const panel = document.getElementById('subtitle-panel');
  const list  = document.getElementById('subtitle-list');
  if (!panel || !list) return;
  if (!subtitles?.length) { panel.style.display = 'none'; return; }
  panel.style.display = 'flex';
  list.innerHTML = '';
  subtitles.forEach((sub, i) => {
    const btn = document.createElement('button');
    btn.className = `sub-btn${(i === 0 && Settings.get('subtitleEnabled')) ? ' active' : ''}`;
    btn.textContent = sub.label || `Sub ${i + 1}`;
    btn.addEventListener('click', () => {
      list.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Vidstack 1.12.x: use player.textTracks API, not DOM track.mode
      try {
        const tracks = _playerEl?.textTracks?.toArray?.() ?? [];
        tracks.filter(t => t.kind === 'subtitles' || t.kind === 'captions')
              .forEach((t, ti) => {
                t.setMode(ti === i ? 'showing' : 'hidden');
              });
      } catch {
        // Fallback: DOM track element
        _playerEl?.querySelectorAll('track[kind="subtitles"]').forEach((t, ti) => {
          try { t.track.mode = ti === i ? 'showing' : 'hidden'; } catch {}
        });
      }
    });
    list.append(btn);
  });
  const offBtn = document.getElementById('sub-off-btn');
  if (offBtn) offBtn.onclick = () => {
    list.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    try {
      const tracks = _playerEl?.textTracks?.toArray?.() ?? [];
      tracks.filter(t => t.kind === 'subtitles' || t.kind === 'captions')
            .forEach(t => t.setMode('hidden'));
    } catch {
      _playerEl?.querySelectorAll('track[kind="subtitles"]').forEach(t => {
        try { t.track.mode = 'hidden'; } catch {}
      });
    }
  };
}

// ── Episode list ──────────────────────────────────────────────────────────────
function buildEpItems(episodes, currentEp, onClick) {
  const frag = document.createDocumentFragment();
  episodes.forEach(ep => {
    const item = document.createElement('div');
    item.className = `watch-ep-item${ep.ep === currentEp?.ep ? ' active' : ''}`;
    item.dataset.ep = ep.ep;

    const img = document.createElement('img');
    img.className = 'ep-thumb'; img.loading = 'lazy'; img.alt = `Ep ${ep.ep}`;
    safeImg(img, ep.thumbnail, FALLBACK_THUMB);

    const info = document.createElement('div');
    info.className = 'ep-info';
    info.innerHTML = `<div class="ep-num">Ep ${ep.ep}</div>
      <div class="ep-title">${ep.title || `Episode ${ep.ep}`}</div>`;

    item.append(img, info);
    item.addEventListener('click', () => onClick(ep));
    frag.append(item);
  });
  return frag;
}

function renderEpisodeList(episodes, currentEp) {
  // Mobile inline list
  const mobileList  = document.getElementById('watch-ep-list');
  const badge       = document.getElementById('watch-ep-count-badge');
  // Desktop sidebar list
  const desktopList = document.getElementById('watch-ep-list-desk');
  const badgeDesk   = document.getElementById('watch-ep-count-badge-desk');

  const count = episodes.length;
  if (badge)     badge.textContent     = count;
  if (badgeDesk) badgeDesk.textContent = count;

  // Mobile
  if (mobileList) {
    mobileList.innerHTML = '';
    mobileList.append(buildEpItems(episodes, currentEp, ep => {
      if (_currentEp?.ep !== ep.ep) playEpisode(ep);
    }));
    requestAnimationFrame(() =>
      mobileList.querySelector('.watch-ep-item.active')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    );
  }

  // Desktop
  if (desktopList) {
    desktopList.innerHTML = '';
    desktopList.append(buildEpItems(episodes, currentEp, ep => {
      if (_currentEp?.ep !== ep.ep) playEpisode(ep);
    }));
    requestAnimationFrame(() =>
      desktopList.querySelector('.watch-ep-item.active')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    );
  }
}

function updateListActive() {
  // Update both mobile + desktop lists
  ['watch-ep-list', 'watch-ep-list-desk'].forEach(id => {
    const list = document.getElementById(id);
    if (!list) return;
    list.querySelectorAll('.watch-ep-item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.ep) === _currentEp?.ep);
    });
    requestAnimationFrame(() =>
      list.querySelector('.watch-ep-item.active')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    );
  });
}

// ── Controls bar update ───────────────────────────────────────────────────────
function updateControlsBar(ep) {
  // Topbar (mobile)
  const tbSeries = document.getElementById('watch-topbar-series');
  const tbEp     = document.getElementById('watch-topbar-ep');
  if (tbSeries) tbSeries.textContent = _entry?.title || '—';
  if (tbEp)     tbEp.textContent     = ep.title ? `Ep ${ep.ep}: ${ep.title}` : `Episode ${ep.ep}`;

  // Controls bar
  const title  = document.getElementById('now-title');
  const epLbl  = document.getElementById('now-ep-label');
  const prev   = document.getElementById('watch-prev-btn');
  const next   = document.getElementById('watch-next-btn');

  if (title) title.textContent = _entry?.title || '—';
  if (epLbl) epLbl.textContent = ep.title ? `Ep ${ep.ep}: ${ep.title}` : `Episode ${ep.ep}`;
  if (prev)  prev.disabled = !getPrev();
  if (next)  next.disabled = !getNext();

  // Details link
  const dl = document.getElementById('watch-details-link');
  if (dl) dl.href = detailsHash(_entry?.id || '');
}

// ── Play episode ──────────────────────────────────────────────────────────────
function playEpisode(ep) {
  if (!ep) return;
  clearAutoNext();
  hideNextCard();
  hideError();
  _skipShown = false;
  _nextShown = false;
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }

  _currentEp = ep;
  history.replaceState(null, '', watchHash(_entry.id, ep.ep));

  updateControlsBar(ep);
  updateListActive();
  setupSkipBtn();
  buildPlayer(ep);
  renderSubtitlePanel(ep.subtitles || []);

  History.add({ id: _entry.id, title: _entry.title, poster: _entry.poster, ep: ep.ep, epTitle: ep.title });
}

// ── Episode search ────────────────────────────────────────────────────────────
function filterEpisodes(query) {
  if (!query.trim()) return _episodes;
  const q = query.toLowerCase();
  return _episodes.filter(ep =>
    String(ep.ep).includes(q) || (ep.title || '').toLowerCase().includes(q)
  );
}

// ── Register page ─────────────────────────────────────────────────────────────
registerPage('watch', {
  async mount(params) {
    animatePageEnter(document.getElementById('page-watch'));
    const { id, ep } = params;
    const epNum = parseInt(ep) || 1;
    if (!id) { go('#home'); return; }

    hideError();

    // Show spinner in player
    const mount = document.getElementById('player-mount');
    if (mount) mount.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000"><div class="spinner"></div></div>`;

    try {
      const entry = await getEntry(id);
      if (!entry) { toast('Anime tidak ditemukan', 'error'); go('#archive'); return; }
      _entry = entry;

      const epData = await fetchEpisodes(id);
      _episodes = epData.episodes || [];
      if (!_episodes.length) { showError('Tidak ada episode.'); return; }

      const targetEp = _episodes.find(e => e.ep === epNum) || _episodes[0];
      renderEpisodeList(_episodes, targetEp);

      // Wire up buttons
      const prevBtn    = document.getElementById('watch-prev-btn');
      const nextBtn    = document.getElementById('watch-next-btn');
      const backBtn    = document.getElementById('watch-back');
      const retryBtn   = document.getElementById('player-retry-btn');
      const detailsLnk = document.getElementById('watch-details-link');

      if (prevBtn)    prevBtn.onclick  = () => { const p = getPrev(); if (p) playEpisode(p); };
      if (nextBtn)    nextBtn.onclick  = () => { const n = getNext(); if (n) playEpisode(n); };
      if (backBtn)    backBtn.onclick  = () => history.back();
      if (retryBtn)   retryBtn.onclick = () => { if (_currentEp) playEpisode(_currentEp); };
      if (detailsLnk) {
        detailsLnk.href    = detailsHash(id);
        detailsLnk.onclick = e => { e.preventDefault(); go(detailsHash(id)); };
      }

      // Episode search — wire both mobile + desktop inputs
      ['watch-ep-search', 'watch-ep-search-desk'].forEach(inputId => {
        const inp = document.getElementById(inputId);
        if (!inp) return;
        inp.value = '';
        inp.addEventListener('input', () => {
          const filtered = filterEpisodes(inp.value);
          renderEpisodeList(filtered, _currentEp);
          // Sync sibling input
          const siblingId = inputId === 'watch-ep-search' ? 'watch-ep-search-desk' : 'watch-ep-search';
          const sibling = document.getElementById(siblingId);
          if (sibling && sibling.value !== inp.value) sibling.value = inp.value;
        });
      });

      playEpisode(targetEp);

    } catch (err) {
      console.error('[Watch]', err);
      showError(`Gagal memuat: ${err.message}`);
    }
  },

  async unmount() {
    clearAutoNext();
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }

    // Save position
    if (_playerEl && _entry && _currentEp && Settings.get('rememberPos')) {
      const t = _playerEl.currentTime || 0;
      const d = _playerEl.duration    || 0;
      if (t > 5 && d > 0) Positions.save(_entry.id, _currentEp.ep, t, d);
    }

    destroyPlayer();
    document.body.style.overflow = '';

    const skipBtn = document.getElementById('skip-intro-btn');
    if (skipBtn) skipBtn.style.display = 'none';
    hideNextCard();

    const sp = document.getElementById('subtitle-panel');
    if (sp) sp.style.display = 'none';

    _entry = null; _episodes = []; _filtered = []; _currentEp = null; 
  }
});
