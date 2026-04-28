"""
backend/config.py — RyouStream v1.1.0 Epsilon
Edit bagian SERVER, METADATA, dan EKSTENSI sesuai kebutuhan.
SD Card path di-detect otomatis — tidak perlu diedit manual.
"""

import os, re

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR    = os.path.dirname(_BACKEND_DIR)

# ─── AUTO-DETECT SD CARD ───────────────────────────────────────────────────────
# Mencari /storage/XXXX-XXXX (external SD card, format hex-hex)
# Skip: /storage/emulated (internal), /storage/self (symlink internal)
#
# Contoh yang cocok   : /storage/1A0A-2561, /storage/A1B2-C3D4
# Contoh yang di-skip : /storage/emulated/0, /storage/self

_SD_PATTERN = re.compile(r'^[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$')

def _detect_sdcard() -> str | None:
    storage = "/storage"
    if not os.path.isdir(storage):
        return None
    try:
        candidates = []
        for name in os.listdir(storage):
            # Hanya ambil yang cocok format XXXX-XXXX (external SD)
            if not _SD_PATTERN.match(name):
                continue
            full = os.path.join(storage, name)
            if os.path.isdir(full):
                candidates.append(full)
        if candidates:
            # Kalau lebih dari satu, ambil yang punya Movies atau Videos
            for c in candidates:
                if os.path.isdir(os.path.join(c, "Movies")) or \
                   os.path.isdir(os.path.join(c, "Videos")):
                    return c
            # Tidak ada yang punya folder media — pakai kandidat pertama
            return candidates[0]
    except PermissionError:
        pass
    return None

# SDCARD_ROOT: auto-detect, fallback ke nilai manual jika tidak ditemukan
_AUTO_SD     = _detect_sdcard()
SDCARD_ROOT  = _AUTO_SD or "/storage/1A0A-2561"   # ← fallback manual

if _AUTO_SD:
    print(f"[Config] SD Card terdeteksi: {SDCARD_ROOT}")
else:
    print(f"[Config] SD Card tidak terdeteksi, pakai fallback: {SDCARD_ROOT}")

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
