/**
 * router.js — RyouStream Hash Router (SPA)
 * Version : 1.0.2
 * Author  : Ryounime
 *
 * Routes:
 *  #home           → HomePage
 *  #search         → SearchPage
 *  #archive        → ArchivePage  (+ query: ?type=TV&sort=year_desc)
 *  #category       → CategoryPage
 *  #details/{id}   → DetailsPage
 *  #watch/{id}/{ep}→ WatchPage
 *  #settings       → SettingsPage
 *  #about          → AboutPage
 *  (default)       → HomePage
 */

import { $ } from './utils.js';

// ── Page IDs ──────────────────────────────────────────────────────────────────
export const PAGES = {
  HOME:     'home',
  SEARCH:   'search',
  ARCHIVE:  'archive',
  CATEGORY: 'category',
  DETAILS:  'details',
  WATCH:    'watch',
  SETTINGS: 'settings',
  ABOUT:    'about',
};

// ── Route definitions ─────────────────────────────────────────────────────────
const ROUTES = [
  { pattern: /^#?$|^#home$/i,                   page: PAGES.HOME                          },
  { pattern: /^#search/i,                        page: PAGES.SEARCH                        },
  { pattern: /^#archive/i,                       page: PAGES.ARCHIVE                       },
  { pattern: /^#category/i,                      page: PAGES.CATEGORY                      },
  { pattern: /^#details\/(.+)$/i,                page: PAGES.DETAILS,  param: 'id'        },
  { pattern: /^#watch\/([^/]+)(?:\/(\d+))?$/i,  page: PAGES.WATCH,    params: ['id','ep'] },
  { pattern: /^#settings/i,                      page: PAGES.SETTINGS                      },
  { pattern: /^#about/i,                         page: PAGES.ABOUT                         },
];

// ── Page Handler Registry ────────────────────────────────────────────────────
const _handlers = {};  // { pageName: { mount(), unmount() } }

// ── State ─────────────────────────────────────────────────────────────────────
let _current = null;   // { page, params, hash }
let _prev    = null;

// ── Route Parser ──────────────────────────────────────────────────────────────
function parseRoute(hash) {
  const h = (hash || location.hash || '#home').trim();

  for (const route of ROUTES) {
    const m = h.match(route.pattern);
    if (!m) continue;

    const params = {};

    // Single param (e.g. details/ID)
    if (route.param && m[1]) params[route.param] = decodeURIComponent(m[1]);

    // Multiple params (e.g. watch/ID/EP)
    if (route.params) {
      route.params.forEach((key, i) => {
        if (m[i + 1]) params[key] = decodeURIComponent(m[i + 1]);
      });
    }

    // Parse query string from hash (e.g. #archive?type=TV&sort=year_desc)
    const qIdx = h.indexOf('?');
    if (qIdx !== -1) {
      const qs = new URLSearchParams(h.slice(qIdx + 1));
      qs.forEach((v, k) => { params[k] = v; });
    }

    return { page: route.page, params, hash: h };
  }

  // Fallback → home
  return { page: PAGES.HOME, params: {}, hash: '#home' };
}

// ── Transition / show page ────────────────────────────────────────────────────
function showPage(pageName) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));

  const target = document.getElementById(`page-${pageName}`);
  if (target) {
    target.classList.add('active');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Update nav active states
  updateNavActive(pageName);
}

function updateNavActive(pageName) {
  // Sidebar nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    const lp = link.getAttribute('href')?.replace('#', '').split('/')[0] ||
               link.getAttribute('data-page');
    link.classList.toggle('active', lp === pageName);
  });

  // Bottom nav items
  document.querySelectorAll('.bnav-item').forEach(item => {
    const ip = item.getAttribute('data-page');
    item.classList.toggle('active', ip === pageName);
    item.setAttribute('aria-current', ip === pageName ? 'page' : 'false');
  });

  // Topbar title
  updateTopbar(pageName);
}

const PAGE_TITLES = {
  home:     null,   // shows logo
  search:   'Pencarian',
  archive:  'Arsip',
  category: 'Kategori',
  details:  null,   // set dynamically
  watch:    null,   // set dynamically
  settings: 'Pengaturan',
  about:    'Tentang',
};

export function updateTopbar(pageName, customTitle = null) {
  const logo    = document.getElementById('topbar-logo');
  const titleEl = document.getElementById('topbar-title');
  const title   = customTitle ?? PAGE_TITLES[pageName];

  if (title && titleEl) {
    titleEl.textContent = title;
    titleEl.style.display = 'block';
    titleEl.classList.add('visible');
  } else if (titleEl) {
    titleEl.style.display = 'none';
    titleEl.classList.remove('visible');
  }
}

// ── Route to page ─────────────────────────────────────────────────────────────
async function navigate(hash, replace = false) {
  const route = parseRoute(hash);

  // Unmount previous
  if (_current && _current.page !== route.page) {
    const prev = _handlers[_current.page];
    if (prev?.unmount) {
      try { await prev.unmount(_current); } catch (e) { console.warn('[Router] unmount error:', e); }
    }
  }

  _prev    = _current;
  _current = route;

  showPage(route.page);

  // Mount new
  const handler = _handlers[route.page];
  if (handler?.mount) {
    try { await handler.mount(route.params, route.hash); }
    catch (e) { console.error('[Router] mount error:', e); }
  }

  // Update document title
  const titleMap = {
    home:     'RyouStream',
    search:   'Pencarian — RyouStream',
    archive:  'Arsip — RyouStream',
    category: 'Kategori — RyouStream',
    settings: 'Pengaturan — RyouStream',
    about:    'Tentang — RyouStream',
    details:  'Detail — RyouStream',
    watch:    'Tonton — RyouStream',
  };
  document.title = titleMap[route.page] || 'RyouStream';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register a page handler.
 * @param {string} pageName
 * @param {{ mount(params, hash): Promise<void>, unmount?(route): Promise<void> }} handler
 */
export function registerPage(pageName, handler) {
  _handlers[pageName] = handler;
}

/**
 * Navigate to a hash.
 * @param {string} hash - e.g. '#home', '#details/0001', '#watch/0001/2'
 */
export function go(hash) {
  history.pushState(null, '', hash);
  navigate(hash);
}

/**
 * Replace current history entry and navigate.
 */
export function replace(hash) {
  history.replaceState(null, '', hash);
  navigate(hash, true);
}

/**
 * Get current route state.
 */
export function current() { return _current; }
export function previous() { return _prev; }

/**
 * Initialize the router. Call once from app.js.
 */
export function initRouter() {
  // Handle hash changes
  window.addEventListener('hashchange', (e) => {
    navigate(location.hash);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    navigate(location.hash);
  });

  // Handle [data-navto] clicks anywhere in document
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[href^="#"], [data-navto]');
    if (!link) return;

    let hash = link.getAttribute('href') || ('#' + link.getAttribute('data-navto'));
    if (!hash || hash === '#') return;

    // data-filter support for pre-filtered archive links
    const filterRaw = link.getAttribute('data-filter');
    if (filterRaw) {
      try {
        const params = new URLSearchParams(JSON.parse(filterRaw));
        hash = hash.split('?')[0] + '?' + params.toString();
      } catch {}
    }

    e.preventDefault();
    go(hash);
  });

  // Initial route
  navigate(location.hash || '#home');
}
