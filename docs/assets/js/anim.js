/**
 * assets/js/anim.js — ŘΨØŬ v3.0.0
 * Anime.js v4.3.6 helper wrapper
 * Semua animasi proyek melewati helper ini.
 * prefers-reduced-motion: semua animasi di-skip otomatis.
 */

const Anim = (() => {
  /* Respek prefers-reduced-motion */
  const _reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Shorthand ke anime global (dari UMD) */
  const _a  = window.anime;

  /* Durasi standar proyek (ms) */
  const DUR = { fast: 150, base: 220, slow: 380, enter: 320, leave: 240 };

  /* Easing standar */
  const EASE = {
    out  : 'out(2)',
    outQ : 'outQuad',
    outE : 'outExpo',
    inQ  : 'inQuad',
    spring: (mass = 1, stiffness = 80, damping = 12) =>
              _a.spring({ mass, stiffness, damping }),
  };

  /* ── Fade + slide ke atas — item kartu, konten masuk ── */
  function fadeUp(targets, opts = {}) {
    if (_reduced || !targets) return;
    const els = typeof targets === 'string'
      ? document.querySelectorAll(targets)
      : targets;
    if (!els || (els.length !== undefined && els.length === 0)) return;

    return _a.animate(els, {
      opacity   : [0, 1],
      translateY: [opts.from ?? 16, 0],
      duration  : opts.duration ?? DUR.enter,
      delay     : opts.delay ?? 0,
      ease      : opts.ease ?? EASE.outQ,
      ...opts.extra,
    });
  }

  /* ── Stagger fadeUp — grid kartu, list item ── */
  function staggerIn(targets, opts = {}) {
    if (_reduced || !targets) return;
    const els = typeof targets === 'string'
      ? document.querySelectorAll(targets)
      : targets;
    if (!els || els.length === 0) return;

    return _a.animate(els, {
      opacity   : [0, 1],
      translateY: [opts.from ?? 14, 0],
      duration  : opts.duration ?? DUR.enter,
      delay     : _a.stagger(opts.stagger ?? 45, { start: opts.start ?? 0 }),
      ease      : opts.ease ?? EASE.outQ,
    });
  }

  /* ── Slide masuk dari kiri (drawer mobile) ── */
  function slideInLeft(target, opts = {}) {
    if (_reduced || !target) return;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    return _a.animate(el, {
      translateX: ['-100%', '0%'],
      duration  : opts.duration ?? DUR.enter,
      ease      : opts.ease ?? EASE.outE,
    });
  }

  /* ── Slide keluar ke kiri ── */
  function slideOutLeft(target, opts = {}) {
    if (_reduced || !target) return;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    return _a.animate(el, {
      translateX: ['0%', '-100%'],
      duration  : opts.duration ?? DUR.leave,
      ease      : opts.ease ?? EASE.inQ,
    });
  }

  /* ── Slide masuk dari kanan (settings panel) ── */
  function slideInRight(target, opts = {}) {
    if (_reduced || !target) return;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    return _a.animate(el, {
      translateX: ['100%', '0%'],
      duration  : opts.duration ?? DUR.enter,
      ease      : opts.ease ?? EASE.outE,
    });
  }

  /* ── Slide keluar ke kanan ── */
  function slideOutRight(target, opts = {}) {
    if (_reduced || !target) return;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    return _a.animate(el, {
      translateX: ['0%', '100%'],
      duration  : opts.duration ?? DUR.leave,
      ease      : opts.ease ?? EASE.inQ,
    });
  }

  /* ── Slide masuk dari bawah (settings panel mobile) ── */
  function slideInUp(target, opts = {}) {
    if (_reduced || !target) return;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    return _a.animate(el, {
      translateY: ['100%', '0%'],
      duration  : opts.duration ?? DUR.enter,
      ease      : opts.ease ?? EASE.outE,
    });
  }

  /* ── Slide keluar ke bawah ── */
  function slideOutDown(target, opts = {}) {
    if (_reduced || !target) return;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    return _a.animate(el, {
      translateY: ['0%', '100%'],
      duration  : opts.duration ?? DUR.leave,
      ease      : opts.ease ?? EASE.inQ,
    });
  }

  /* ── Smooth scroll (scrollTop/scrollLeft properti) ── */
  function scrollTo(target, dest, opts = {}) {
    if (!target) return;
    /* Kalau reduced motion, langsung snap */
    if (_reduced) { target.scrollTop = dest; return; }
    return _a.animate(target, {
      scrollTop: dest,
      duration : opts.duration ?? DUR.slow,
      ease     : opts.ease ?? EASE.outQ,
    });
  }

  /* ── Scale + fade (modal, overlay masuk) ── */
  function popIn(target, opts = {}) {
    if (_reduced || !target) return;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    return _a.animate(el, {
      opacity  : [0, 1],
      scale    : [opts.fromScale ?? 0.92, 1],
      duration : opts.duration ?? DUR.base,
      ease     : opts.ease ?? EASE.out,
    });
  }

  /* ── Fade out saja ── */
  function fadeOut(target, opts = {}) {
    if (!target) return Promise.resolve();
    if (_reduced) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.style.opacity = '0';
      return Promise.resolve();
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return Promise.resolve();
    return _a.animate(el, {
      opacity : [1, 0],
      duration: opts.duration ?? DUR.base,
      ease    : opts.ease ?? EASE.outQ,
    });
  }

  /* ── Timeline factory — buat createTimeline dari anime ── */
  function timeline(opts = {}) {
    return _a.createTimeline(opts);
  }

  /* ── IntersectionObserver + animasi saat masuk viewport ── */
  function onEnter(targets, animFn, opts = {}) {
    if (_reduced) return;
    const els = typeof targets === 'string'
      ? document.querySelectorAll(targets)
      : Array.from(targets);
    if (!els || els.length === 0) return;

    const threshold = opts.threshold ?? 0.12;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animFn(e.target);
          observer.unobserve(e.target);
        }
      });
    }, { threshold });

    els.forEach(el => observer.observe(el));
    return observer;
  }

  return {
    reduced    : _reduced,
    DUR, EASE,
    fadeUp,
    staggerIn,
    slideInLeft, slideOutLeft,
    slideInRight, slideOutRight,
    slideInUp, slideOutDown,
    scrollTo,
    popIn,
    fadeOut,
    timeline,
    onEnter,
    /* Expose raw anime untuk kebutuhan custom */
    raw: () => _a,
  };
})();

window.Anim = Anim;
