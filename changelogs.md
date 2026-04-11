# Changelogs — ŘΨØŬ

---

## v1.4.0 — 2026-04-12 `latest`

### Bug Fixes
- Fix: watch page kosong — `videojs.extend()` dihapus di VJS 8, ganti ke ES6 class
- Fix: `overflow:hidden` pada `.vjs-control-bar` & `.watch-player-box` menghalangi menu speed & CC
- Fix: GearButton membuka subtitle settings bukan quality — dihapus sementara (TODO: quality selector)
- Fix: CC/subtitle button tampil sebagai garis biru (indikator aktif VJS 8 disembunyikan)
- Fix: jarak waktu & speed tabrakan saat durasi lebih dari 1 jam
- Fix: volume slider meluap ke atas — overflow:visible + inline panel fix
- Fix: hamburger X tidak bisa diklik untuk tutup drawer (hanya bind `openDrawer`, tidak toggle)
- Fix: `#drawer-backdrop` z-index terlalu mepet navbar, bisa nutupin hamburger di beberapa device
- Fix: preload bar terlalu mencolok — opacity dikurangi

### Improvements
- `remaining-time` lebar mengikuti konten, gap ke speed button fixed 8px
- Letter-spacing digit waktu diperapat, hemat ruang di mobile
- Hapus dead CSS `.vjs-gear-button` (3 selector) — tidak lagi dipakai
- Fix: `about.html` version span hardcode `v1.0.1` → `v1.4.0`
- Hapus teks ŘΨØŬ di splash & about — logo.svg sudah mewakili
- Bersihkan komentar redundan di `watch.js`, `index.js`, `player.css`

---

## v1.0.1 — 2026-04-11 `stable`

### Bug Fixes
- Fix: bug pagination vertikal — `#main-pagination` tidak dapat flex row karena tidak ada class `.pagination`
- Fix: hero carousel blank di mode portrait — Swiper `effect:'fade'` membuat wrapper height = 0
- Fix: gap besar antara hero section dan konten — `.hero-section.page-body` mendapat `min-height:100vh`
- Fix: watch page terlalu banyak scroll area di mobile — `ws-list` scroll dinonaktifkan di mobile
- Fix: footer tidak kelihatan di watch.html — ditambah `position:sticky;bottom:0`

### Improvements
- Hapus teks nama di sebelah logo navbar — SVG logo sudah cukup
- Admin lock: tombol Scan Library, Scan Ulang, Hapus Cache sekarang dikunci PIN (default: `1234`)
- Halaman About: ditambah kolom Changelog
- CSS player.css direkonstruksi — pakai Video.js default CSS, tidak ada `!important` override massal
- CSS Swiper: pakai native CSS variables (`--swiper-theme-color`) bukan override manual
- CSS Bootstrap dark theme: integrasi variabel diperbaiki (`--bs-border-color`, `--bs-link-color`, dll)
- Semua versi diubah ke `v1.0.0 new`

---

## v1.0.0 — 2026-04-10 `initial`

### Rilis Pertama

- **Frontend**: HTML5 + Vanilla JS + Bootstrap 5.3 + Swiper 12 + Video.js 8
- **Backend**: Python stdlib only — tidak perlu install library eksternal
- **Metadata**: Integrasi otomatis Jikan v4 (MyAnimeList), TMDB, MDL
- **PWA**: Web App Manifest + Service Worker + Offline cache
- **Multi bahasa**: Indonesia (ID), English (EN), Japanese (JA)
- **Fitur utama**:
  - Lanjut Nonton (progress tersimpan di localStorage)
  - Riwayat tontonan
  - Autoplay episode berikutnya
  - Filter & pencarian library
  - Pagination grid
- **Player**: HLS (m3u8), DASH (mpd), MP4, MKV, WebM, TS
- **Subtitle**: VTT, SRT, ASS/SSA (inline track injection)
- **Responsive**: Mobile-first, PWA installable

---

## v1.0.2 — GitHub Pages + Cloudflare Tunnel

### Breaking Changes
- Backend sekarang **API-only** (tidak lagi serve HTML/CSS/JS)
- Port berubah dari `8080` → `37485`
- Frontend dipindah ke **GitHub Pages** (`ryou-webs.github.io`)

### Perubahan Backend
- `config.py` — port 37485, hapus `WWW_PATH`
- `server.py` — hapus `_serve_static()`, tambah `_base_url()` helper
- `server.py` — `_api_episodes()` sekarang return URL media absolut
  (berdasarkan `Host` + `X-Forwarded-Proto` header dari Cloudflare)
- Tambah `start_tunnel.sh` — otomatis jalankan cloudflared, capture URL,
  update GitHub Gist

### Perubahan Frontend
- `lib/api.js` — fetch backend URL dari GitHub Gist sebelum request API
  - URL di-cache di memory, tidak fetch Gist berulang
  - `API.refresh()` untuk paksa re-fetch jika tunnel ganti URL
- `sw.js` — skip intercept request ke domain eksternal (tunnel, Gist, CDN)
- Tambah `404.html` — SPA fallback routing untuk GitHub Pages
- Tambah `_config.yml` — bypass Jekyll processing
