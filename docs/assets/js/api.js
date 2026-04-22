/**
 * api.js — RyouStream API Layer
 * Synced 100% dengan backend/server.py endpoint
 * Version : 1.0.2
 * Author  : Ryounime
 */

import { API } from './config.js';

// ── Internal fetch wrapper ────────────────────────────────────────────────────
async function _fetch(url, options = {}) {
  const controller = new AbortController();
  const timeout    = options.timeout ?? 12000;
  const timer      = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', ...(options.headers || {}) },
      ...options,
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error || msg; } catch {}
      throw new ApiError(msg, res.status);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new ApiError('Request timeout', 408);
    if (err instanceof ApiError)  throw err;
    throw new ApiError(err.message || 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

// ── Custom Error ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
  }
}

// ── GET /api/library ──────────────────────────────────────────────────────────
/**
 * Returns { status, data: AnimeEntry[], total }
 * status: 'ok' | 'scanning'
 * AnimeEntry: { id, title, title_en, title_ja, type, year, episodes,
 *               rating, poster, banner, genres, description,
 *               description_id, description_ja, status, studio,
 *               aired, mal_id, tmdb_id, ... }
 */
export async function fetchLibrary() {
  const res = await _fetch(API.LIBRARY, { timeout: 15000 });
  // Normalize: ensure data is always array
  return {
    status: res.status || 'ok',
    data:   Array.isArray(res.data) ? res.data : [],
    total:  res.total ?? 0,
    message: res.message || '',
  };
}

// ── GET /api/episodes/:id ─────────────────────────────────────────────────────
/**
 * Returns { id, title, episodes: Episode[] }
 * Episode: { ep, title, duration, thumbnail, src, subtitles, chapter_file }
 * subtitles: [{ label, url, lang }] (dari scanner)
 */
export async function fetchEpisodes(animeId) {
  if (!animeId) throw new ApiError('ID required', 400);
  const res = await _fetch(API.EPISODES(animeId), { timeout: 10000 });
  return {
    id:       res.id,
    title:    res.title || '',
    episodes: Array.isArray(res.episodes) ? res.episodes : [],
  };
}

// ── GET /api/scan?force=0|1 ───────────────────────────────────────────────────
/**
 * Returns { status: 'started'|'already_running', force, progress? }
 */
export async function triggerScan(force = false) {
  const url = `${API.SCAN}?force=${force ? 1 : 0}`;
  return _fetch(url, { timeout: 8000 });
}

// ── GET /api/scan/status ──────────────────────────────────────────────────────
/**
 * Returns { running: bool, progress: string, last_scan: int }
 */
export async function fetchScanStatus() {
  return _fetch(API.SCAN_STATUS, { timeout: 5000 });
}

// ── GET /api/settings ────────────────────────────────────────────────────────
/**
 * Returns { version, sdcard_root, movies_path, videos_path, port,
 *           cache_ttl_hours, video_exts, sub_exts, has_tmdb_key,
 *           mdl_base, cache_dir }
 */
export async function fetchServerSettings() {
  return _fetch(API.SETTINGS, { timeout: 5000 });
}

// ── GET /api/clear_cache?type=all|library|meta ────────────────────────────────
export async function clearCache(type = 'all') {
  return _fetch(API.CLEAR_CACHE(type), { timeout: 10000 });
}

// ── GET /api/chapters?path=... ────────────────────────────────────────────────
/**
 * Returns { chapters: [{ time: float, title: string }], count: int }
 */
export async function fetchChapters(mediaPath) {
  if (!mediaPath) return { chapters: [], count: 0 };
  return _fetch(API.CHAPTERS(mediaPath), { timeout: 5000 });
}

// ── GET /api/fonts ────────────────────────────────────────────────────────────
/**
 * Returns { fonts: [{ name, url }], count }
 */
export async function fetchFonts() {
  return _fetch(API.FONTS, { timeout: 5000 });
}

// ── GET /api/dirlist?path=... ─────────────────────────────────────────────────
export async function fetchDirList(dirPath) {
  return _fetch(API.DIRLIST(dirPath), { timeout: 8000 });
}

// ── Health check (ping) ───────────────────────────────────────────────────────
/**
 * Returns: 'online' | 'scanning' | 'offline'
 */
export async function pingServer() {
  try {
    const res = await _fetch(API.LIBRARY, { timeout: 5000 });
    if (res.status === 'scanning') return 'scanning';
    return 'online';
  } catch {
    return 'offline';
  }
}

// ── Media URL builders ────────────────────────────────────────────────────────
/**
 * Build streaming URL dari episode.src
 * src dari backend: "/media/Videos/..." atau "/media/Movies/..."
 */
export function mediaUrl(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  // Prefix dengan API_BASE (sudah include host:port)
  const base = API_BASE.replace(/\/$/, '');
  return src.startsWith('/') ? `${base}${src}` : `${base}/${src}`;
}

/**
 * Build subtitle URL dari subtitle entry.
 * Backend episode.subtitles[].src menggunakan key "src" (bukan "url").
 * Backend auto-convert SRT/ASS→VTT on-the-fly via /media/... endpoint.
 */
export function subtitleUrl(subtitleEntry) {
  // Backend menggunakan key "src", fallback ke "url" untuk kompatibilitas
  const path = subtitleEntry?.src || subtitleEntry?.url || '';
  if (!path) return '';
  return mediaUrl(path);
}

// ── Polling helper (untuk scan status) ───────────────────────────────────────
/**
 * Poll scan status setiap `intervalMs` hingga scanning selesai atau timeout.
 * @param {Function} onProgress - callback({ running, progress, last_scan })
 * @param {number}   intervalMs - polling interval (default 2000ms)
 * @param {number}   maxWaitMs  - max wait (default 5 menit)
 * @returns {Promise<void>}
 */
export async function pollScanStatus(onProgress, intervalMs = 2000, maxWaitMs = 300000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const run = async () => {
      try {
        const status = await fetchScanStatus();
        onProgress(status);
        if (!status.running || Date.now() - start > maxWaitMs) {
          resolve(status);
        } else {
          setTimeout(run, intervalMs);
        }
      } catch {
        resolve({ running: false });
      }
    };
    run();
  });
}
