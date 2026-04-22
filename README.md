# 🎌 RyouStream v1.0.0 Epsilon

**Ryounime Stream Platform** — Streaming anime lokal dari koleksi pribadi di SD Card / penyimpanan internal.

---

## 📁 Struktur Folder

```
ryoustream/
├── backend/                 ← Server Python
│   ├── server.py            ← Entry point server
│   ├── config.py            ← ⚠️ EDIT INI DULU sebelum jalan
│   ├── requirements.txt     ← Dependencies Python
│   ├── generate_cert.py     ← SSL untuk akses LAN
│   ├── lib/
│   │   ├── cache.py
│   │   ├── metadata.py      ← Ambil data MAL / TMDB / MDL
│   │   ├── scanner.py       ← Scan file video di SD Card
│   │   └── translator.py    ← Terjemah deskripsi → Indonesia
│   └── cache/               ← Cache metadata (auto-dibuat)
│
├── www/                     ← Frontend (otomatis di-serve)
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   └── assets/...
│
├── start.sh                 ← ▶ Jalankan (Linux/Mac/Termux)
├── start.bat                ← ▶ Jalankan (Windows)
└── README.md
```

---

## ⚙️ LANGKAH 1 — Edit Config

Buka **`backend/config.py`** dan sesuaikan path storage kamu:

```python
# Path SD Card / penyimpanan internal
SDCARD_ROOT = "/storage/1A0A-2561"   # ← Ganti dengan path SD Card kamu

MOVIES_PATH = os.path.join(SDCARD_ROOT, "Movies")  # Folder film
VIDEOS_PATH = os.path.join(SDCARD_ROOT, "Videos")  # Folder serial anime
FONTS_PATH  = os.path.join(SDCARD_ROOT, "Fonts")   # Font untuk subtitle ASS
```

**Cara cari path SD Card di Android (Termux):**
```bash
ls /storage/
# Pilih yang bukan emulated, misal: /storage/1A0A-2561
```

**Windows:**
```python
SDCARD_ROOT = "D:\\"           # Drive D
MOVIES_PATH = "D:\\Movies"
VIDEOS_PATH = "D:\\Videos"
```

**Linux / Mac:**
```python
SDCARD_ROOT = "/home/user/Anime"
```

---

## 🚀 LANGKAH 2 — Jalankan Server

### Android (Termux)
```bash
# Install Python dulu jika belum
pkg update && pkg install python

# Jalankan
bash start.sh
```

### Linux / Mac
```bash
chmod +x start.sh
./start.sh
```

### Windows
Double-click **`start.bat`**

---

## 🌐 LANGKAH 3 — Buka Browser

Setelah server jalan, buka di browser:

| Dari mana | URL |
|-----------|-----|
| Perangkat yang sama | `http://localhost:8080` |
| Perangkat lain (LAN) | `https://192.168.x.x:8080` |
| Android + Termux | `http://localhost:8080` |

> **Catatan:** Untuk akses dari perangkat lain (HP ke laptop), gunakan HTTPS. Script `start.sh` akan auto-generate SSL certificate.

---

## 📂 Struktur Folder Video

Backend akan scan otomatis folder `Movies/` dan `Videos/` berdasarkan nama folder:

```
Movies/
├── Mieruko-Chan (2025) Sub Indo.mp4
└── Kimi no Na wa.mkv

Videos/
├── Shingeki no Kyojin [55071]/     ← folder = satu anime
│   ├── Shingeki S1E01.mkv
│   ├── Shingeki S1E02.mkv
│   └── Shingeki S1E01.ass          ← subtitle (.vtt/.srt/.ass/.ssa)
│
└── Spy x Family [58049]/
    ├── SpyFamily-01.mp4
    └── SpyFamily-01.srt
```

> Nomor dalam kurung siku `[55071]` = MAL ID (opsional, tapi meningkatkan akurasi metadata).

---

## 🔄 Scan Library

Setelah menambah file video baru:

1. Buka **RyouStream** di browser
2. Klik ikon **🔄** di pojok kanan atas (topbar), atau
3. Buka **Pengaturan → Library → Scan**

---

## 📱 Install sebagai Aplikasi (PWA)

1. Buka `http://localhost:8080` di Chrome / Edge
2. Klik **"Instal"** di banner yang muncul, atau
3. Menu browser → **"Tambahkan ke layar utama"**

---

## 🔧 Konfigurasi Lanjutan (`backend/config.py`)

| Setting | Default | Keterangan |
|---------|---------|-----------|
| `PORT` | `8080` | Port server |
| `CACHE_TTL_HOURS` | `168` | Cache metadata (7 hari) |
| `TMDB_API_KEY` | (isi) | API key TMDB gratis dari [themoviedb.org](https://www.themoviedb.org/settings/api) |
| `CORS_ORIGINS` | `*` | Izinkan semua origin |

---

## 🐛 Troubleshooting

**❌ "Library kosong / Gagal memuat"**
→ Pastikan `server.py` sudah berjalan dan URL benar.

**❌ "Format video tidak didukung"**
→ Browser tidak support `.mkv`. Gunakan Chrome terbaru, atau konversi ke `.mp4`.

**❌ Subtitle tidak muncul**
→ Backend auto-convert `.srt`/`.ass` ke `.vtt`. Cek log server untuk error.

**❌ Port 8080 sudah dipakai**
→ Ganti `PORT = 8080` di `config.py` ke port lain, misal `8181`.

**❌ Error saat scan metadata**
→ Cek koneksi internet. Backend butuh internet untuk ambil data MAL/TMDB.

---

## 📝 Info Proyek

| | |
|-|-|
| **Nama** | RyouStream |
| **Versi** | 1.0.0 Epsilon |
| **Author** | Ryounime |
| **Backend** | Python 3 (no framework) |
| **Frontend** | Vanilla JS ES Modules + SPA |
| **Player** | Vidstack Web Components |
| **Metadata** | MyAnimeList · TMDB · MyDramaList |

---

*© 2025 Ryounime — MIT License*
