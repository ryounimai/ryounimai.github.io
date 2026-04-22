/**
 * pages/settings.js — RyouStream Settings Page
 * Version : 1.0.2
 * Author  : Ryounime
 */

import { registerPage } from '../router.js';
import {
  fetchServerSettings, triggerScan, clearCache, pollScanStatus
} from '../api.js';
import { Settings, LibCache, applyAccentColor } from '../config.js';
import { $, toast } from '../utils.js';
import { animateSettingsOpen, animatePageEnter, pulseButton } from '../animations.js';

// ── State ─────────────────────────────────────────────────────────────────────
let _pwaPrompt = null;
let _scanning  = false;

// ── Accordion toggle ──────────────────────────────────────────────────────────
function initAccordions() {
  document.querySelectorAll('[data-toggle]').forEach(head => {
    if (head.dataset.accordionBound) return; // prevent double-bind
    head.dataset.accordionBound = '1';

    const bodyId = head.dataset.toggle;
    const body   = document.getElementById(bodyId);
    if (!body) return;

    head.addEventListener('click', () => {
      const isOpen = !body.classList.contains('collapsed');
      if (isOpen) {
        body.classList.add('collapsed');
      } else {
        body.classList.remove('collapsed');
        animateSettingsOpen(body);
      }
    });
  });
}

// ── Sync settings controls to state ──────────────────────────────────────────
function syncControls() {
  const autoplay      = document.getElementById('setting-autoplay');
  const autonext      = document.getElementById('setting-autonext');
  const rememberPos   = document.getElementById('setting-remember-pos');
  const subtitle      = document.getElementById('setting-subtitle');
  const volume        = document.getElementById('setting-volume');
  const volumeDisplay = document.getElementById('volume-display');
  const descLang      = document.getElementById('setting-desc-lang');
  const animations    = document.getElementById('setting-animations');

  if (autoplay)    autoplay.checked    = Settings.get('autoplay');
  if (autonext)    autonext.checked    = Settings.get('autoNext');
  if (rememberPos) rememberPos.checked = Settings.get('rememberPos');
  if (subtitle)    subtitle.checked    = Settings.get('subtitleEnabled');
  if (volume) {
    volume.value = Math.round(Settings.get('volume') * 100);
    if (volumeDisplay) volumeDisplay.textContent = `${volume.value}%`;
  }
  if (descLang)   descLang.value   = Settings.get('descLang') || 'id';
  if (animations) animations.checked = Settings.get('animations');

  // Accent color swatches
  const currentColor = Settings.get('accentColor');
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.style.border = sw.dataset.color === currentColor
      ? '2px solid rgba(255,255,255,0.85)'
      : '2px solid transparent';
    sw.classList.toggle('active', sw.dataset.color === currentColor);
  });
}

// ── Bind settings controls ────────────────────────────────────────────────────
function bindControls() {
  // Toggles
  const bindings = [
    ['setting-autoplay',     'autoplay'],
    ['setting-autonext',     'autoNext'],
    ['setting-remember-pos', 'rememberPos'],
    ['setting-subtitle',     'subtitleEnabled'],
    ['setting-animations',   'animations'],
  ];

  bindings.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      Settings.set(key, el.checked);
    });
  });

  // Volume
  const volume = document.getElementById('setting-volume');
  const volumeDisplay = document.getElementById('volume-display');
  if (volume) {
    volume.addEventListener('input', () => {
      const val = parseInt(volume.value) / 100;
      Settings.set('volume', val);
      if (volumeDisplay) volumeDisplay.textContent = `${volume.value}%`;
    });
  }

  // Desc lang
  const descLang = document.getElementById('setting-desc-lang');
  if (descLang) {
    descLang.addEventListener('change', () => {
      Settings.set('descLang', descLang.value);
    });
  }

  // Accent color
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      const color = sw.dataset.color;
      Settings.set('accentColor', color);
      applyAccentColor(color);
      // Update swatches border
      document.querySelectorAll('.color-swatch').forEach(s => {
        s.style.border = s.dataset.color === color
          ? '2px solid rgba(255,255,255,0.85)'
          : '2px solid transparent';
      });
    });
  });
}

// ── Library controls ──────────────────────────────────────────────────────────
function bindLibraryControls() {
  // Scan
  const scanBtn = document.getElementById('settings-scan-btn');
  if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
      if (_scanning) return;
      pulseButton(scanBtn);
      await doScan(false);
    });
  }

  // Force scan
  const forceScanBtn = document.getElementById('settings-force-scan-btn');
  if (forceScanBtn) {
    forceScanBtn.addEventListener('click', async () => {
      if (_scanning) return;
      if (!confirm('Force scan akan menghapus semua cache metadata. Lanjutkan?')) return;
      pulseButton(forceScanBtn);
      LibCache.clear();
      await doScan(true);
    });
  }

  // Clear all cache
  const clearBtn = document.getElementById('settings-clear-cache-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('Hapus semua cache? Library akan di-reload ulang.')) return;
      try {
        await clearCache('all');
        LibCache.clear();
        toast('Cache dihapus', 'success');
      } catch {
        toast('Gagal menghapus cache', 'error');
      }
    });
  }

  // Clear library cache only
  const clearLibBtn = document.getElementById('settings-clear-lib-btn');
  if (clearLibBtn) {
    clearLibBtn.addEventListener('click', async () => {
      try {
        await clearCache('library');
        LibCache.clear();
        toast('Cache library dihapus', 'success');
      } catch {
        toast('Gagal menghapus cache library', 'error');
      }
    });
  }
}

async function doScan(force = false) {
  _scanning = true;
  const statusText = document.getElementById('scan-status-text');
  if (statusText) statusText.textContent = 'Scan dimulai...';

  try {
    await triggerScan(force);
    toast('Scan library dimulai...', 'info', 3000);

    await pollScanStatus((status) => {
      if (statusText) {
        statusText.textContent = status.progress || (status.running ? 'Scanning...' : 'Selesai');
      }
      // Update server status dot
      document.dispatchEvent(new CustomEvent('rs:scan-status', { detail: status }));
    }, 2000, 300000);

    toast('Scan selesai! Reload halaman untuk melihat hasil.', 'success', 5000);
    LibCache.clear();

  } catch {
    toast('Gagal memulai scan', 'error');
  } finally {
    _scanning = false;
    if (statusText) statusText.textContent = 'Scan ulang koleksi dari SD card';
  }
}

// ── Server info ───────────────────────────────────────────────────────────────
async function loadServerInfo() {
  try {
    const info = await fetchServerSettings();

    const urlEl    = document.getElementById('server-info-url');
    const statusEl = document.getElementById('server-info-status');
    const libStats = document.getElementById('lib-stats');

    if (urlEl)    urlEl.textContent    = `${location.protocol}//${location.hostname}:${info.port || 8080}`;
    if (statusEl) {
      statusEl.textContent  = 'Online';
      statusEl.className    = 'badge badge-ongoing';
    }

    if (libStats && info.cache_dir) {
      const lib = LibCache.load();
      if (lib) {
        const tvCount    = lib.filter(e => e.type === 'TV').length;
        const movieCount = lib.filter(e => e.type === 'Movie').length;
        const ovaCount   = lib.filter(e => e.type === 'OVA' || e.type === 'Special').length;
        libStats.textContent = `${lib.length} judul total · ${tvCount} TV · ${movieCount} Film · ${ovaCount} OVA/Special`;
      }
    }
  } catch {
    const statusEl = document.getElementById('server-info-status');
    if (statusEl) {
      statusEl.textContent = 'Offline';
      statusEl.className   = 'badge badge-movie';
    }
  }
}

// ── PWA ───────────────────────────────────────────────────────────────────────
function bindPWA() {
  const installBtn  = document.getElementById('pwa-install-btn');
  const installedBadge = document.getElementById('pwa-installed-badge');
  const swStatusText = document.getElementById('sw-status-text');
  const swStatusBadge = document.getElementById('sw-status-badge');
  const clearSwBtn  = document.getElementById('clear-sw-cache-btn');

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installedBadge) installedBadge.style.display = '';
    if (installBtn)     installBtn.style.display     = 'none';
  } else if (_pwaPrompt && installBtn) {
    installBtn.style.display = '';
  }

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!_pwaPrompt) { toast('Instal tidak tersedia di browser ini', 'warning'); return; }
      _pwaPrompt.prompt();
      const { outcome } = await _pwaPrompt.userChoice;
      if (outcome === 'accepted') {
        toast('RyouStream berhasil diinstal!', 'success');
        installBtn.style.display = 'none';
        if (installedBadge) installedBadge.style.display = '';
      }
      _pwaPrompt = null;
    });
  }

  // SW status
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        if (swStatusText)  swStatusText.textContent  = 'Service Worker aktif, mode offline tersedia';
        if (swStatusBadge) {
          swStatusBadge.textContent = 'Aktif';
          swStatusBadge.className   = 'badge badge-ongoing';
        }
      } else {
        if (swStatusText)  swStatusText.textContent  = 'Service Worker tidak aktif';
        if (swStatusBadge) {
          swStatusBadge.textContent = 'Tidak Aktif';
          swStatusBadge.className   = 'badge';
        }
      }
    });
  }

  // Clear SW cache
  if (clearSwBtn) {
    clearSwBtn.addEventListener('click', async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith('rs-')).map(k => caches.delete(k)));
        toast('Cache Service Worker dihapus', 'success');
      } catch {
        toast('Gagal menghapus cache SW', 'error');
      }
    });
  }
}

// ── Listen for PWA prompt (set by app.js) ─────────────────────────────────────
document.addEventListener('rs:pwa-prompt', (e) => {
  _pwaPrompt = e.detail.prompt;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn && !window.matchMedia('(display-mode: standalone)').matches) {
    installBtn.style.display = '';
  }
});

// ── Register page ─────────────────────────────────────────────────────────────
registerPage('settings', {
  async mount() {
    const page = document.getElementById('page-settings');
    animatePageEnter(page);

    initAccordions();
    syncControls();
    bindControls();
    bindLibraryControls();
    bindPWA();
    await loadServerInfo();
  },

  async unmount() {}
});
