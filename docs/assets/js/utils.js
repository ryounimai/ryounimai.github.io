/**
 * utils.js — ŘΨØŬ v2.0.1
 * Shared utility functions used across all components
 */

/* ── Format time ── */
function fmtTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

/* ── Format relative time (e.g., "2 jam lalu") ── */
function fmtRelTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Baru saja';
  if (m < 60)  return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d} hari lalu`;
  return `${Math.floor(d/30)} bulan lalu`;
}

/* ── Clamp number ── */
function clamp(n, min, max) { return Math.min(Math.max(n, min), max); }

/* ── Debounce ── */
function debounce(fn, ms) {
  let t; return function(...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}

/* ── Throttle ── */
function throttle(fn, ms) {
  let last = 0;
  return function(...a) { const now = Date.now(); if (now - last >= ms) { last = now; fn.apply(this, a); } };
}

/* ── Create element ── */
function el(tag, cls = '', attrs = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v));
  return e;
}

/* ── Safe querySelector ── */
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

/* ── Set image with fallback ── */
function setImg(imgEl, src, fallback = '') {
  if (!imgEl) return;
  if (!src) { if (fallback) imgEl.src = fallback; return; }
  imgEl.src = src;
  imgEl.onerror = () => { if (fallback) imgEl.src = fallback; };
}

/* ── Rating star ── */
function ratingHtml(r) {
  if (!r || r <= 0) return '—';
  return `⭐ ${Number(r).toFixed(1)}`;
}

/* ── Toast notification ── */
const Toast = (() => {
  let area = null;
  function _getArea() {
    if (!area) { area = document.getElementById('toast-area') || document.body; }
    return area;
  }
  function show(msg, type = 'info', dur = 3200) {
    const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    const item = el('div', `toast-item ${type}`);
    item.innerHTML = `<span class="toast-icon">${icons[type]||''}</span><span>${msg}</span>`;
    _getArea().appendChild(item);
    setTimeout(() => {
      item.classList.add('out');
      item.addEventListener('animationend', () => item.remove(), { once: true });
    }, dur);
  }
  return { show, success: m => show(m,'success'), error: m => show(m,'error'), warn: m => show(m,'warning') };
})();

/* ── Expose globally ── */
window.Utils = { fmtTime, fmtRelTime, clamp, debounce, throttle, el, qs, qsa, setImg, ratingHtml, Toast };
