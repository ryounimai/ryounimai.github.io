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
        print("[Config] /storage tidak ditemukan")
        return None
    try:
        entries = os.listdir(storage)
        print(f"[Config] /storage berisi: {entries}")
    except PermissionError:
        print("[Config] PermissionError saat baca /storage")
        print("[Config] Jalankan: termux-setup-storage")
        return None
    except Exception as e:
        print(f"[Config] Error baca /storage: {e}")
        return None

    # Cek apakah ada symlink emulated yang mengarah ke SD
    # Beberapa device: /storage/emulated/XXXX-XXXX (bukan langsung di /storage)
    candidates = []
    for name in entries:
        full = os.path.join(storage, name)

        # Pola XXXX-XXXX (external SD card standar)
        if _SD_PATTERN.match(name) and os.path.isdir(full):
            candidates.append(full)
            continue

        # Beberapa device taruh SD di /storage/emulated/XXXX-XXXX
        if name == "emulated" and os.path.isdir(full):
            try:
                for sub in os.listdir(full):
                    if _SD_PATTERN.match(sub):
                        subpath = os.path.join(full, sub)
                        if os.path.isdir(subpath):
                            candidates.append(subpath)
            except Exception:
                pass

    print(f"[Config] Kandidat SD: {candidates}")

    if candidates:
        # Prioritas: yang sudah punya folder Movies atau Videos
        for c in candidates:
            if os.path.isdir(os.path.join(c, "Movies")) or                os.path.isdir(os.path.join(c, "Videos")):
                return c
        return candidates[0]

    return None

# SDCARD_ROOT: auto-detect, fallback ke nilai manual jika tidak ditemukan
_AUTO_SD     = _detect_sdcard()
SDCARD_ROOT  = _AUTO_SD or "/storage/1A0A-2561"   # ← fallback manual

if _AUTO_SD:
    print(f"[Config] SD Card terdeteksi  : {SDCARD_ROOT}")
else:
    print(f"[Config] SD Card tidak terdeteksi!")
    print(f"[Config] Menggunakan fallback : {SDCARD_ROOT}")
    print(f"[Config] Jika salah, edit SDCARD_ROOT di backend/config.py")
    print(f"[Config] Atau jalankan: termux-setup-storage")

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
