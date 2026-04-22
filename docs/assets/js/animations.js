/**
 * animations.js — RyouStream UI Animations
 * Version : 1.0.2
 * Author  : Ryounime
 *
 * Anime.js v4 API:
 *  v3 → v4 changes:
 *   anime({ targets, ...props })  →  anime.animate(targets, props)
 *   anime.timeline()              →  anime.createTimeline()
 *   anime.stagger()               →  anime.stagger()   (unchanged)
 */

import { Settings } from './config.js';

// ── Guard ─────────────────────────────────────────────────────────────────────
function canAnimate() {
  if (!window.anime) return false;
  if (!Settings.get('animations')) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

// ── Shorthand helpers (v4 API) ────────────────────────────────────────────────
function anim(targets, props) {
  if (!canAnimate() || !targets) return;
  const els = typeof targets === 'string'
    ? document.querySelectorAll(targets)
    : targets;
  if (!els || (els.length !== undefined && !els.length)) return;
  try { anime.animate(els, props); } catch(e) { console.warn('[Anim]', e); }
}

// ── Page enter animation ──────────────────────────────────────────────────────
export function animatePageEnter(pageEl) {
  if (!pageEl) return;
  if (!canAnimate()) { pageEl.style.opacity = '1'; return; }
  anim(pageEl, {
    opacity:    [0, 1],
    translateY: [16, 0],
    duration:   280,
    ease:       'outCubic',
  });
}

// ── Stagger cards ─────────────────────────────────────────────────────────────
export function animateCards(container, selector = '.anime-card') {
  if (!canAnimate() || !container) return;
  const cards = container.querySelectorAll(selector);
  if (!cards.length) return;
  anim(cards, {
    opacity:    [0, 1],
    translateY: [24, 0],
    scale:      [0.94, 1],
    delay:      anime.stagger(50),
    duration:   340,
    ease:       'outBack(1.2)',
  });
}

// ── Hero content entrance ─────────────────────────────────────────────────────
export function animateHeroContent(heroContentEl) {
  if (!canAnimate() || !heroContentEl) return;
  anim([...heroContentEl.children], {
    opacity:    [0, 1],
    translateY: [20, 0],
    delay:      anime.stagger(80),
    duration:   400,
    ease:       'outCubic',
  });
}

// ── Hero background cross-fade ────────────────────────────────────────────────
export function animateHeroBg(heroBgEl, newSrc) {
  if (!heroBgEl || !newSrc) return;

  // Preload image sebelum swap (hindari layout shift / forced reflow)
  const img = new Image();
  img.onload = () => {
    if (!canAnimate()) {
      heroBgEl.style.backgroundImage = `url('${newSrc}')`;
      return;
    }
    anim(heroBgEl, {
      opacity:  [1, 0],
      duration: 300,
      ease:     'outSine',
      onComplete() {
        heroBgEl.style.backgroundImage = `url('${newSrc}')`;
        anim(heroBgEl, { opacity: [0, 1], duration: 450, ease: 'inSine' });
      },
    });
  };
  img.onerror = () => {
    // Tetap ganti meskipun gagal load
    heroBgEl.style.backgroundImage = `url('${newSrc}')`;
  };
  img.src = newSrc;
}

// ── Number counter ────────────────────────────────────────────────────────────
export function animateCount(el, from, to, duration = 600) {
  if (!el) return;
  if (!canAnimate()) { el.textContent = to; return; }
  const obj = { val: from };
  anim(obj, {
    val:      to,
    round:    1,
    duration,
    ease:     'outExpo',
    onUpdate() { el.textContent = Math.round(obj.val); },
  });
}

// ── Details page entrance ─────────────────────────────────────────────────────
export function animateDetailsEntrance(posterEl, infoEl) {
  if (!canAnimate()) return;
  if (posterEl) anim(posterEl, {
    translateX: [-30, 0], opacity: [0, 1],
    duration: 420, ease: 'outCubic',
  });
  if (infoEl) anim([...infoEl.children], {
    translateY: [12, 0], opacity: [0, 1],
    delay: anime.stagger(60), duration: 360, ease: 'outCubic',
  });
}

// ── Episode list stagger ──────────────────────────────────────────────────────
export function animateEpisodeList(listEl) {
  if (!canAnimate() || !listEl) return;
  const items = listEl.querySelectorAll('.ep-item, .watch-ep-item');
  if (!items.length) return;
  anim(items, {
    translateX: [-12, 0], opacity: [0, 1],
    delay: anime.stagger(30), duration: 280, ease: 'outCubic',
  });
}

// ── Search results ────────────────────────────────────────────────────────────
export function animateSearchResults(gridEl) {
  if (!canAnimate() || !gridEl) return;
  const cards = gridEl.querySelectorAll('.anime-card');
  if (!cards.length) return;
  anim(cards, {
    scale:    [0.9, 1],
    opacity:  [0, 1],
    delay:    anime.stagger(35),
    duration: 300,
    ease:     'outBack(1.1)',
  });
}

// ── Category grid ─────────────────────────────────────────────────────────────
export function animateCategoryGrid(gridEl) {
  if (!canAnimate() || !gridEl) return;
  const cards = gridEl.querySelectorAll('.category-card');
  if (!cards.length) return;
  anim(cards, {
    translateY: [20, 0], opacity: [0, 1],
    delay: anime.stagger(40), duration: 320, ease: 'outBack(1.1)',
  });
}

// ── Loader dismiss ────────────────────────────────────────────────────────────
export function dismissLoader(loaderEl) {
  if (!loaderEl) return;
  if (!canAnimate()) { loaderEl.style.display = 'none'; return; }
  anim(loaderEl, {
    opacity:  [1, 0],
    duration: 400,
    ease:     'inSine',
    onComplete() { loaderEl.style.display = 'none'; },
  });
}

// ── Settings section open ─────────────────────────────────────────────────────
export function animateSettingsOpen(bodyEl) {
  if (!canAnimate() || !bodyEl) return;
  const items = bodyEl.querySelectorAll('.settings-item');
  if (!items.length) return;
  anim(items, {
    translateX: [-8, 0], opacity: [0, 1],
    delay: anime.stagger(30), duration: 240, ease: 'outCubic',
  });
}

// ── Pulse button ──────────────────────────────────────────────────────────────
export function pulseButton(btnEl) {
  if (!canAnimate() || !btnEl) return;
  anim(btnEl, { scale: [1, 1.1, 1], duration: 300, ease: 'outBack(2)' });
}

// ── About grid ────────────────────────────────────────────────────────────────
export function animateAboutGrid(gridEl) {
  if (!canAnimate() || !gridEl) return;
  const cards = gridEl.querySelectorAll('.about-card');
  if (!cards.length) return;
  anim(cards, {
    translateY: [30, 0], opacity: [0, 1],
    delay: anime.stagger(80), duration: 380, ease: 'outBack(1.1)',
  });
}

// ── Topbar scroll shrink ──────────────────────────────────────────────────────
export function initTopbarScroll() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        topbar.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ── Ripple effect ─────────────────────────────────────────────────────────────
export function addRipple(el) {
  if (!el) return;
  el.addEventListener('pointerdown', (e) => {
    const rect = el.getBoundingClientRect();
    const r = Object.assign(document.createElement('span'), {});
    r.style.cssText = `
      position:absolute;border-radius:50%;
      width:40px;height:40px;pointer-events:none;
      background:rgba(255,255,255,0.15);
      top:${e.clientY - rect.top - 20}px;
      left:${e.clientX - rect.left - 20}px;
    `;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.append(r);
    if (canAnimate()) {
      anim(r, {
        scale: [0, 4], opacity: [1, 0],
        duration: 500, ease: 'outExpo',
        onComplete() { r.remove(); },
      });
    } else {
      setTimeout(() => r.remove(), 500);
    }
  });
}
