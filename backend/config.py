"""
backend/config.py — RyouStream v1.1.0 Epsilon
SD Card di-detect otomatis via `df` command.
"""

import os, re, subprocess

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR    = os.path.dirname(_BACKEND_DIR)

# ─── AUTO-DETECT SD CARD via df ───────────────────────────────────────────────
# Jalankan: df -h | grep /storage
# Cari baris yang mount point-nya /storage/XXXX-XXXX (bukan emulated)
# Contoh output:
#   /dev/fuse  233G  12G  221G  5%  /storage/E9EF-CAB9   ← ini SD card
#   /dev/fuse  228G 105G  122G 47%  /storage/emulated    ← skip

_SD_PATTERN = re.compile(r'^[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}$')

def _detect_sdcard():
    try:
        result = subprocess.run(
            ["df", "-h"],
            capture_output=True, text=True, timeout=5
        )
        candidates = []
        for line in result.stdout.splitlines():
            # Ambil kolom terakhir (mount point)
            parts = line.split()
            if not parts:
                continue
            mount = parts[-1]
            # Cocokkan /storage/XXXX-XXXX
            if not mount.startswith("/storage/"):
                continue
            name = mount.split("/storage/")[-1].strip("/")
            if _SD_PATTERN.match(name):
                candidates.append(mount)
                print(f"[Config] df detect: {mount}")

        if candidates:
            # Prioritas: yang punya Movies atau Videos
            for c in candidates:
                if os.path.isdir(os.path.join(c, "Movies")) or \
                   os.path.isdir(os.path.join(c, "Videos")):
                    return c
            return candidates[0]

    except Exception as e:
        print(f"[Config] df error: {e}")

    return None


_AUTO_SD    = _detect_sdcard()
SDCARD_ROOT = _AUTO_SD or "/storage/E9EF-CAB9"   # ← fallback, ganti jika beda

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
