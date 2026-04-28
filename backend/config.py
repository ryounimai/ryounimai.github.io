"""
backend/config.py — RyouStream v1.1.0 Epsilon
SD Card di-detect otomatis via Termux ~/storage/external-* symlink.
"""

import os, re

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR    = os.path.dirname(_BACKEND_DIR)

# ─── AUTO-DETECT SD CARD ──────────────────────────────────────────────────────
# Di Termux, setelah termux-setup-storage, symlink dibuat di ~/storage/:
#   ~/storage/shared      → /storage/emulated/0  (internal, SKIP)
#   ~/storage/external-1  → /storage/XXXX-XXXX   (SD card ke-1)
#   ~/storage/external-2  → /storage/XXXX-XXXX   (SD card ke-2, jika ada)
#
# Python di Termux tidak bisa baca /storage/ langsung (PermissionError)
# tapi bisa lewat symlink ~/storage/ yang dibuat Termux.

_SD_PATTERN = re.compile(r'^[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$')

def _detect_sdcard():
    HOME          = os.path.expanduser("~")
    termux_store  = os.path.join(HOME, "storage")
    candidates    = []

    # ── Jalur 1: ~/storage/external-* (Termux symlink) ──
    if os.path.isdir(termux_store):
        try:
            entries = sorted(os.listdir(termux_store))
            print(f"[Config] ~/storage: {entries}")
            for name in entries:
                if not name.startswith("external"):
                    continue
                full = os.path.join(termux_store, name)
                if os.path.isdir(full):
                    real = os.path.realpath(full)
                    print(f"[Config]   {name} → {real}")
                    candidates.append(real)
        except Exception as e:
            print(f"[Config] ~/storage error: {e}")

    # ── Jalur 2: scan /storage/XXXX-XXXX langsung (fallback) ──
    if not candidates:
        try:
            for name in os.listdir("/storage"):
                if _SD_PATTERN.match(name):
                    full = os.path.join("/storage", name)
                    if os.path.isdir(full):
                        candidates.append(full)
        except Exception:
            pass

    print(f"[Config] Kandidat SD: {candidates}")

    if not candidates:
        return None

    # Prioritas: yang punya folder Movies atau Videos
    for c in candidates:
        if os.path.isdir(os.path.join(c, "Movies")) or \
           os.path.isdir(os.path.join(c, "Videos")):
            return c

    return candidates[0]


_AUTO_SD    = _detect_sdcard()
SDCARD_ROOT = _AUTO_SD or "/storage/1A0A-2561"   # ← ganti jika fallback salah

if _AUTO_SD:
    print(f"[Config] ✅ SD Card: {SDCARD_ROOT}")
else:
    print(f"[Config] ⚠️  SD Card tidak terdeteksi, pakai fallback: {SDCARD_ROOT}")
    print(f"[Config]    Jika salah → edit SDCARD_ROOT di backend/config.py")

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
JIKAN_BASE    = "https://api.jikan.moe/v4"
JIKAN_DELAY   = 0.4
MDL_BASE      = "https://my-drama-list-api-ten.vercel.app"
TMDB_API_KEY  = "37417939a4b0213ea809e390ab206b62"
TMDB_BASE     = "https://api.themoviedb.org/3"
TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500"

# ─── EKSTENSI FILE ────────────────────────────────────────────────────────────
VIDEO_EXTS = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v", ".ts", ".m3u8"}
SUB_EXTS   = {".vtt", ".srt", ".ass", ".ssa"}

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGINS = "*"
