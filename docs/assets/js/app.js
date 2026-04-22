/**
 * app.js — RyouStream Main Entry Point
 * Version : 1.0.0 Epsilon
 * Author  : Ryounime
 *
 * Bootstrap order:
 *  1. Register PWA & Service Worker
 *  2. Build sidebar & bottom nav from categories.json
 *  3. Initialize router
 *  4. Server status polling
 *  5. Topbar search bridge
 *  6. PWA install prompt
 *  7. Dismiss page loader
 */

import { initRouter, go } from './router.js';
import { pingServer, triggerScan, fetchScanStatus } from './api.js';
import { Settings, LibCache, applyAccentColor } from './config.js';
import { $, getCategoryData, toast, debounce } from './utils.js';
import { dismissLoader, initTopbarScroll } from './animations.js';

// ── Page modules (side-effects: register their routes) ────────────────────────
import './pages/home.js';
import './pages/search.js';
import './pages/archive.js';
import './pages/category.js';
import './pages/details.js';
import './pages/watch.js';
import './pages/settings.js';
import './pages/about.js';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SERVICE WORKER
// ═══════════════════════════════════════════════════════════════════════════════
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[App] SW registered:', reg.scope);
  } catch (err) {
    console.warn('[App] SW registration failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. NAVIGATION BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

// Icon SVGs map
const NAV_ICONS = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  archive: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  grid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

function buildSidebar(catData) {
  const primaryList   = document.getElementById('sidebar-nav-primary');
  const secondaryList = document.getElementById('sidebar-nav-secondary');
  if (!primaryList || !catData) return;

  const sections = catData.sidebarItems || [];

  sections.forEach((section, si) => {
    const listEl = si === 0 ? primaryList : secondaryList;
    if (!listEl) return;
    listEl.innerHTML = '';

    section.items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.innerHTML = `
        <a class="nav-link" href="#${item.id}" data-page="${item.id}" role="menuitem">
          <span class="nav-icon">${NAV_ICONS[item.icon] || NAV_ICONS.info}</span>
          <span class="nav-label">${item.label}</span>
        </a>`;
      listEl.append(li);
    });
  });
}

function buildBottomNav(catData) {
  const nav = document.getElementById('bottom-nav');
  if (!nav || !catData) return;
  nav.innerHTML = '';

  const items = catData.navItems || [];
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'bnav-item';
    btn.setAttribute('data-page', item.id);
    btn.setAttribute('aria-label', item.label);
    btn.setAttribute('role', 'link');
    btn.innerHTML = `
      <span class="bnav-icon">${NAV_ICONS[item.icon] || NAV_ICONS.info}</span>
      <span>${item.label}</span>`;
    btn.addEventListener('click', () => go(`#${item.id}`));
    nav.append(btn);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SERVER STATUS POLLING
// ═══════════════════════════════════════════════════════════════════════════════
let _statusInterval = null;

async function updateServerStatus() {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  try {
    const status = await pingServer();
    const classMap = { online: 'online', scanning: 'scanning', offline: 'offline' };
    const labelMap = {
      online:   'Server Online',
      scanning: 'Scanning...',
      offline:  'Server Offline',
    };

    if (dot)  { dot.className = `status-dot ${classMap[status]}`; }
    if (text) { text.textContent = labelMap[status] || status; }

    // If scanning, poll scan status
    if (status === 'scanning') {
      try {
        const scanStatus = await fetchScanStatus();
        if (text && scanStatus.progress) text.textContent = scanStatus.progress;
      } catch {}
    }
  } catch {
    if (dot)  dot.className = 'status-dot offline';
    if (text) text.textContent = 'Tidak terhubung';
  }
}

function startStatusPolling() {
  updateServerStatus();
  const poll = () => {
    _statusInterval = setTimeout(() => {
      updateServerStatus().finally(poll);
    }, 15000);
  };
  poll();
}

// Update status dot when scan event fires
document.addEventListener('rs:scan-status', (e) => {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const { running, progress } = e.detail;
  if (dot)  dot.className    = `status-dot ${running ? 'scanning' : 'online'}`;
  if (text) text.textContent = progress || (running ? 'Scanning...' : 'Server Online');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TOPBAR CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════
function initTopbar() {
  const searchBtn   = document.getElementById('topbar-search-btn');
  const searchWrap  = document.getElementById('topbar-search');
  const searchInput = document.getElementById('topbar-search-input');
  const scanBtn     = document.getElementById('topbar-scan-btn');

  // Search btn → navigate to #search page directly
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      go('#search');
      // Focus input di search page setelah navigasi
      setTimeout(() => {
        const inp = document.getElementById('main-search-input');
        if (inp) inp.focus();
      }, 120);
    });
  }

  // Topbar scan button
  if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
      if (scanBtn.classList.contains('scanning')) return;
      scanBtn.classList.add('scanning');
      scanBtn.disabled = true;
      try {
        LibCache.clear();
        await triggerScan(false);
        toast('Scan library dimulai...', 'info', 3000);
        updateServerStatus();
      } catch {
        toast('Gagal memulai scan', 'error');
      } finally {
        setTimeout(() => {
          scanBtn.classList.remove('scanning');
          scanBtn.disabled = false;
        }, 4000);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PWA INSTALL PROMPT
// ═══════════════════════════════════════════════════════════════════════════════
let _deferredPrompt = null;

function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;

    // Notify settings page
    document.dispatchEvent(new CustomEvent('rs:pwa-prompt', { detail: { prompt: e } }));

    // Show install banner (if not dismissed)
    const dismissed = localStorage.getItem('rs_pwa_dismissed');
    const installed = window.matchMedia('(display-mode: standalone)').matches;
    if (!dismissed && !installed) {
      setTimeout(() => showPWABanner(), 3000);
    }
  });

  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    hidePWABanner();
    toast('RyouStream berhasil diinstal! 🎉', 'success', 4000);
  });
}

function showPWABanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (!banner) return;
  banner.style.display = 'flex';

  const installBtn = document.getElementById('pwa-banner-install');
  const dismissBtn = document.getElementById('pwa-banner-dismiss');

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!_deferredPrompt) return;
      _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      if (outcome === 'accepted') toast('Menginstal RyouStream...', 'success');
      _deferredPrompt = null;
      hidePWABanner();
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      localStorage.setItem('rs_pwa_dismissed', '1');
      hidePWABanner();
    });
  }
}

function hidePWABanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. SETTINGS CHANGE LISTENER
// ═══════════════════════════════════════════════════════════════════════════════
document.addEventListener('rs:setting-changed', ({ detail: { key, value } }) => {
  if (key === 'accentColor') applyAccentColor(value);
  if (key === 'animations') {
    document.documentElement.style.setProperty(
      '--t-base', value ? '220ms cubic-bezier(0.4,0,0.2,1)' : '0ms'
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════════════════
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K → open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      go('#search');
      setTimeout(() => document.getElementById('main-search-input')?.focus(), 100);
    }

    // Alt + H → home
    if (e.altKey && e.key === 'h') { e.preventDefault(); go('#home'); }
    if (e.altKey && e.key === 'a') { e.preventDefault(); go('#archive'); }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. PAGE VISIBILITY (pause video when tab hidden)
// ═══════════════════════════════════════════════════════════════════════════════
function initVisibilityHandler() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const player = document.querySelector('media-player');
      if (player && !player.paused) {
        // Remember it was playing
        player.dataset.wasPlaying = '1';
        // DON'T auto-pause (user may want audio to continue)
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════════════════════════
async function bootstrap() {
  // Apply saved accent color
  applyAccentColor(Settings.get('accentColor'));

  // Disable animations if setting says so
  if (!Settings.get('animations')) {
    document.documentElement.style.setProperty('--t-base', '0ms');
    document.documentElement.style.setProperty('--t-slow', '0ms');
    document.documentElement.style.setProperty('--t-fast', '0ms');
  }

  // Load nav data
  const catData = await getCategoryData();
  buildSidebar(catData);
  buildBottomNav(catData);

  // Init topbar
  initTopbar();
  initTopbarScroll();

  // Init router (this triggers first page mount)
  initRouter();

  // Server status
  startStatusPolling();

  // PWA
  initPWA();

  // Keyboard shortcuts
  initKeyboardShortcuts();

  // Page visibility
  initVisibilityHandler();

  // Register SW
  registerSW();

  // Show app
  const app = document.getElementById('app');
  if (app) app.style.visibility = 'visible';

  // Dismiss loader with slight delay for smoothness
  setTimeout(() => {
    const loader = document.getElementById('page-loader');
    dismissLoader(loader);
  }, 600);
}

// ── Run after DOM ready ───────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
