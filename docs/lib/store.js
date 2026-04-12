/**
 * lib/store.js — ŘΨØŬ v2.0.0
 * localStorage: history, continue watching, user settings
 */
const Store = (() => {
  const K = {
    CONTINUE : 'r3_continue',
    HISTORY  : 'r3_history',
    SETTINGS : 'r3_settings',
  };

  function _r(k) {
    try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; }
  }
  function _rObj(k, def) {
    try { return JSON.parse(localStorage.getItem(k)) || def; } catch { return def; }
  }
  function _w(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  }

  /* ── Continue Watching ── */
  const Continue = {
    save(animeId, ep, animeTitle, epTitle, poster, currentTime, duration) {
      const list = _r(K.CONTINUE).filter(e => e.animeId !== animeId);
      list.unshift({
        animeId, ep: +ep, animeTitle, epTitle, poster,
        currentTime, duration,
        pct: duration > 0 ? Math.round(currentTime / duration * 100) : 0,
        ts: Date.now(),
      });
      _w(K.CONTINUE, list.slice(0, 24));
    },
    getAll()         { return _r(K.CONTINUE); },
    getProgress(animeId, ep) {
      const item = _r(K.CONTINUE).find(e => e.animeId === animeId && e.ep === +ep);
      return item ? item.currentTime : 0;
    },
    getPct(animeId, ep) {
      const item = _r(K.CONTINUE).find(e => e.animeId === animeId && e.ep === +ep);
      return item ? item.pct : 0;
    },
    remove(animeId) { _w(K.CONTINUE, _r(K.CONTINUE).filter(e => e.animeId !== animeId)); },
    clear()         { _w(K.CONTINUE, []); },
  };

  /* ── History ── */
  const History = {
    add(animeId, ep, animeTitle, epTitle, poster) {
      const list = _r(K.HISTORY).filter(e => !(e.animeId === animeId && e.ep === +ep));
      list.unshift({ animeId, ep: +ep, animeTitle, epTitle, poster, ts: Date.now() });
      _w(K.HISTORY, list.slice(0, 80));
    },
    getAll()  { return _r(K.HISTORY); },
    clear()   { _w(K.HISTORY, []); },
    has(animeId, ep) { return _r(K.HISTORY).some(e => e.animeId === animeId && e.ep === +ep); },
  };

  /* ── Settings ── */
  const _defaults = {
    lang      : 'id',
    theme     : 'dark',
    autoplay  : true,
    subtitles : true,
    playbackRate: 1,
  };
  const Settings = {
    get()          { return _rObj(K.SETTINGS, { ..._defaults }); },
    set(key, val)  { const s = Settings.get(); s[key] = val; _w(K.SETTINGS, s); },
    reset()        { _w(K.SETTINGS, { ..._defaults }); },
  };

  return { Continue, History, Settings };
})();

window.Store = Store;
