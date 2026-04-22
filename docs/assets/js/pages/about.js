/**
 * pages/about.js — RyouStream About Page
 * Version : 1.0.0 Epsilon
 * Author  : Ryounime
 */

import { registerPage } from '../router.js';
import { APP } from '../config.js';
import { animateAboutGrid, animatePageEnter } from '../animations.js';

// ── Tech stack list ───────────────────────────────────────────────────────────
const TECH_STACK = [
  { name: 'Python 3',        color: '#3b82f6',  icon: '🐍' },
  { name: 'Vidstack',        color: '#7c3aed',  icon: '▶️' },
  { name: 'Anime.js',        color: '#f97316',  icon: '✨' },
  { name: 'Bootstrap',       color: '#6d28d9',  icon: '📦' },
  { name: 'Service Worker',  color: '#10b981',  icon: '⚙️' },
  { name: 'MyAnimeList',     color: '#2563eb',  icon: '📺' },
  { name: 'TMDB',            color: '#06b6d4',  icon: '🎬' },
  { name: 'MyDramaList',     color: '#ec4899',  icon: '🎭' },
  { name: 'Web Manifest',    color: '#f59e0b',  icon: '📱' },
  { name: 'CSS :has()',      color: '#a855f7',  icon: '💅' },
  { name: 'ES Modules',      color: '#64748b',  icon: '🔧' },
  { name: 'WebVTT',          color: '#0891b2',  icon: '💬' },
];

// ── Render ────────────────────────────────────────────────────────────────────
function renderTechStack() {
  const container = document.getElementById('tech-stack-list');
  if (!container) return;

  container.innerHTML = TECH_STACK.map(t => `
    <span style="
      display:inline-flex;align-items:center;gap:6px;
      padding:6px 14px;border-radius:999px;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.08);
      font-size:12px;font-weight:600;color:var(--text-2);
      transition:background 0.2s,border-color 0.2s,color 0.2s;
      cursor:default;
    "
    onmouseover="this.style.background='${t.color}22';this.style.borderColor='${t.color}55';this.style.color='#f1f5f9'"
    onmouseout="this.style.background='rgba(255,255,255,0.04)';this.style.borderColor='rgba(255,255,255,0.08)';this.style.color='var(--text-2)'">
      ${t.icon} ${t.name}
    </span>`).join('');
}

// ── Register page ─────────────────────────────────────────────────────────────
registerPage('about', {
  async mount() {
    const page = document.getElementById('page-about');
    animatePageEnter(page);
    renderTechStack();
    animateAboutGrid(document.querySelector('.about-grid'));
  },

  async unmount() {}
});
