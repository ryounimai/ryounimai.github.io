"""
backend/config.py — Konfigurasi ŘΨØŬ v1.0.1
Edit sesuai kebutuhan sebelum menjalankan server.
"""

import os

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR    = os.path.dirname(_BACKEND_DIR)

# ─── PATH SD CARD ─────────────────────────────────────────────────────────────
SDCARD_ROOT = "/storage/1A0A-2561"
MOVIES_PATH = os.path.join(SDCARD_ROOT, "Movies")
VIDEOS_PATH = os.path.join(SDCARD_ROOT, "Videos")
FONTS_PATH  = os.path.join(SDCARD_ROOT, "Fonts")

# ─── SERVER ───────────────────────────────────────────────────────────────────
HOST  = "0.0.0.0"
PORT  = 8080
DEBUG = False

# ─── FRONTEND ─────────────────────────────────────────────────────────────────
WWW_PATH = os.path.join(_ROOT_DIR, "www")

# ─── CACHE ────────────────────────────────────────────────────────────────────
CACHE_DIR       = os.path.join(_BACKEND_DIR, "cache")
CACHE_TTL_HOURS = 168  # 7 hari

# ─── METADATA API ─────────────────────────────────────────────────────────────

# [1] Jikan v4 — MyAnimeList (tanpa API key)
JIKAN_BASE  = "https://api.jikan.moe/v4"
JIKAN_DELAY = 0.4  # detik

# [2] MDL Unofficial Scraper
MDL_BASE = "https://my-drama-list-api-ten.vercel.app"

# [3] TMDB — daftar key gratis di themoviedb.org/settings/api
TMDB_API_KEY  = "37417939a4b0213ea809e390ab206b62"
TMDB_BASE     = "https://api.themoviedb.org/3"
TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500"

# ─── EKSTENSI FILE ────────────────────────────────────────────────────────────
VIDEO_EXTS = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v", ".ts", ".m3u8"}
SUB_EXTS   = {".vtt", ".srt", ".ass", ".ssa"}

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGINS = "*"
