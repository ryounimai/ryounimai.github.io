# ŘΨØŬ v1.0.1

Media server lokal yang jalan di **Android Termux**, frontend di **GitHub Pages**.

---

## Arsitektur

```
[Termux] python server.py          → API server, port 37485
[Termux] ./start_tunnel.sh         → Cloudflare Quick Tunnel
                                     https://random.trycloudflare.com
                                     ↓ update otomatis
[GitHub Gist]  ryou-backend.json   → {"url":"https://random.trycloudflare.com"}
                                     ↑ fetch sekali
[GitHub Pages] ryou-webs.github.io → Frontend, fetch API dari tunnel URL
```

---

## Setup Pertama Kali

### 1. Buat GitHub Gist

1. Buka https://gist.github.com
2. Nama file: `ryou-backend.json`
3. Isi awal:
   ```json
   {"url":"placeholder","updated":""}
   ```
4. Klik **Create secret gist**
5. Salin **Gist ID** dari URL (`gist.github.com/{username}/{GIST_ID}`)

### 2. Buat GitHub Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token** → centang scope **`gist`** saja
3. Salin token (`ghp_xxx...`)

### 3. Konfigurasi Backend (Termux)

Edit `backend/start_tunnel.sh`:
```bash
GIST_ID="isi_gist_id_kamu"
GITHUB_TOKEN="ghp_xxx..."
```

### 4. Konfigurasi Frontend (GitHub Pages)

Edit `www/lib/api.js`:
```js
const GIST_ID = 'isi_gist_id_kamu';   // sama persis dengan di start_tunnel.sh
```

### 5. Push Frontend ke GitHub Pages

```bash
# Buat repo bernama: ryou-webs.github.io
# Push isi folder www/ ke branch main repo tersebut
git init
git remote add origin https://github.com/USERNAME/ryou-webs.github.io
git add .
git commit -m "init"
git push -u origin main
```

GitHub otomatis deploy → https://ryou-webs.github.io

---

## Penggunaan Sehari-hari

```bash
# ── Termux Sesi 1 ──────────────────────────────
cd ~/ryou/backend
python server.py
# Server jalan di port 37485

# ── Termux Sesi 2 (baru) ───────────────────────
cd ~/ryou/backend
./start_tunnel.sh
# → cloudflared jalan
# → URL baru terdeteksi otomatis
# → GitHub Gist terupdate
# → GitHub Pages langsung pakai URL baru
```

---

## Ketika Tunnel Restart / Terputus

Cukup jalankan lagi `./start_tunnel.sh` di sesi baru.  
GitHub Pages akan otomatis pakai URL baru saat halaman di-refresh.

Atau dari browser console:
```js
API.refresh().then(url => console.log('URL baru:', url))
```

---

## Struktur Folder

```
ryou_fixed/
├── backend/
│   ├── server.py           ← API server (port 37485)
│   ├── config.py           ← Konfigurasi path, port, API keys
│   ├── start_tunnel.sh     ← Script tunnel + update Gist
│   ├── generate_cert.py    ← (opsional, tidak dipakai lagi)
│   ├── requirements.txt
│   └── lib/
│       ├── scanner.py
│       ├── metadata.py
│       ├── cache.py
│       └── translator.py
└── www/                    ← Push folder ini ke ryou-webs.github.io
    ├── index.html
    ├── details.html
    ├── watch.html
    ├── about.html
    ├── manifest.json
    ├── sw.js
    ├── 404.html
    ├── _config.yml
    ├── lib/
    │   ├── api.js          ← ⚠ Isi GIST_ID di sini
    │   ├── store.js
    │   └── i18n.js
    ├── components/
    ├── assets/
    └── res/
```

---

## Changelogs

Lihat [changelogs.md](changelogs.md)
