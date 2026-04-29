#!/data/data/com.termux/files/usr/bin/bash
# ══════════════════════════════════════════════════════════════════
#  RyouStream v1.1.0 Epsilon — One-Shot Launcher
#  Jalankan: bash start.sh
#
#  Yang dilakukan:
#    1. Install dependencies (sekali saja)
#    2. Generate SSL cert (jika belum ada)
#    3. Jalankan Cloudflare Tunnel (background)
#    4. Update URL tunnel ke GitHub Gist (otomatis)
#    5. Jalankan backend Python (foreground)
#
#  Semua dalam SATU sesi Termux — tidak perlu tmux/screen.
# ══════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
TUNNEL_LOG="$BACKEND_DIR/tunnel.log"
GIST_ID="1a42e63011f4496adb0a4c7821e15bb6"

# ── Auto update repo ───────────────────────────────────────────────
if [ -d "$SCRIPT_DIR/.git" ]; then
  git -C "$SCRIPT_DIR" pull --ff-only --quiet 2>/dev/null || true
fi
GITHUB_TOKEN=""  # ← isi token GitHub kamu di sini (Settings → Developer → PAT)

# ── Warna ──────────────────────────────────────────────────────────
R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m'
B='\033[0;34m' C='\033[0;36m' W='\033[1;37m' NC='\033[0m'

banner() {
  echo ""
  echo -e "${C}  ╔═══════════════════════════════════════════╗${NC}"
  echo -e "${C}  ║  ${W}🎌 RyouStream v1.1.0 Epsilon${C}            ║${NC}"
  echo -e "${C}  ║     Ryounime Stream Platform               ║${NC}"
  echo -e "${C}  ╚═══════════════════════════════════════════╝${NC}"
  echo ""
}

# ── Cari Python 3 ─────────────────────────────────────────────────
find_python() {
  for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then
      VER=$("$cmd" -c "import sys; print(sys.version_info.major)" 2>/dev/null)
      [ "$VER" = "3" ] && { echo "$cmd"; return; }
    fi
  done
  echo ""
}

PYTHON=$(find_python)
if [ -z "$PYTHON" ]; then
  echo -e "${R}  ❌ Python 3 tidak ditemukan!${NC}"
  echo -e "     Install: ${Y}pkg install python${NC}"
  exit 1
fi

# ── Cari / install cloudflared ─────────────────────────────────────
find_cloudflared() {
  # Cek di PATH biasa
  if command -v cloudflared &>/dev/null; then
    echo "cloudflared"; return
  fi
  # Cek hasil download sebelumnya
  local bins=("$HOME/.local/bin/cloudflared" "$SCRIPT_DIR/cloudflared")
  for b in "${bins[@]}"; do
    [ -x "$b" ] && { echo "$b"; return; }
  done
  echo ""
}

install_cloudflared() {
  echo -e "${Y}  📦 Mengunduh cloudflared untuk Termux (ARM64)...${NC}"
  mkdir -p "$HOME/.local/bin"
  local URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
  if command -v curl &>/dev/null; then
    curl -fsSL "$URL" -o "$HOME/.local/bin/cloudflared"
  elif command -v wget &>/dev/null; then
    wget -qO "$HOME/.local/bin/cloudflared" "$URL"
  else
    echo -e "${R}  ❌ curl / wget tidak ada. Install: pkg install curl${NC}"
    return 1
  fi
  chmod +x "$HOME/.local/bin/cloudflared"
  echo -e "${G}  ✅ cloudflared terinstall${NC}"
}

CLOUDFLARED=$(find_cloudflared)
if [ -z "$CLOUDFLARED" ]; then
  install_cloudflared || { echo -e "${R}  ❌ Gagal install cloudflared. Tunnel tidak aktif.${NC}"; CLOUDFLARED=""; }
  CLOUDFLARED=$(find_cloudflared)
fi

# ── Install deps ──────────────────────────────────────────────────
echo -e "${Y}  📦 Install dependencies...${NC}"

# openssl (untuk SSL cert)
if ! command -v openssl &>/dev/null; then
  pkg install -y openssl-tool 2>/dev/null     && echo -e "${G}  ✅ openssl${NC}"     || echo -e "${Y}  ⚠️  openssl tidak tersedia (HTTP saja)${NC}"
fi

# requests: coba pkg dulu, pip dengan --no-deps sebagai fallback
# --no-deps PENTING: mencegah pip menarik cryptography/pyOpenSSL
if ! "$PYTHON" -c "import requests" &>/dev/null 2>&1; then
  _GOT=0
  for _P in python-requests python3-requests; do
    pkg install -y "$_P" 2>/dev/null && _GOT=1 && break
  done
  if [ "$_GOT" = "0" ]; then
    "$PYTHON" -m pip install requests       --no-deps --only-binary=:all: --quiet 2>/dev/null && _GOT=1
  fi
  [ "$_GOT" = "1" ]     && echo -e "${G}  ✅ requests${NC}"     || echo -e "${R}  ❌ requests gagal — coba: pkg install python-requests${NC}"
fi

# charset-normalizer + certifi + idna (deps requests, no-deps tidak tarik crypto)
for _DEP in charset-normalizer certifi idna; do
  _MOD="${_DEP//-/_}"
  if ! "$PYTHON" -c "import $_MOD" &>/dev/null 2>&1; then
    "$PYTHON" -m pip install "$_DEP"       --no-deps --only-binary=:all: --quiet 2>/dev/null || true
  fi
done

# mutagen (opsional, pure Python)
if ! "$PYTHON" -c "import mutagen" &>/dev/null 2>&1; then
  "$PYTHON" -m pip install mutagen     --no-deps --only-binary=:all: --quiet 2>/dev/null     && echo -e "${G}  ✅ mutagen${NC}"     || echo -e "${Y}  ⚠️  mutagen skip (opsional)${NC}"
fi

# ── SSL cert ───────────────────────────────────────────────────────
CERT="$BACKEND_DIR/cert.pem"
KEY="$BACKEND_DIR/key.pem"
if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
  echo -e "${Y}  🔐 Generate SSL certificate...${NC}"
  "$PYTHON" "$BACKEND_DIR/generate_cert.py" 2>/dev/null     && echo -e "${G}  ✅ SSL cert dibuat${NC}"     || echo -e "${Y}  ⚠️  SSL cert gagal (HTTP saja, tunnel tetap HTTPS)${NC}"
fi

# ── Mulai Cloudflare Tunnel (background) ──────────────────────────
TUNNEL_URL=""
start_tunnel() {
  [ -z "$CLOUDFLARED" ] && return
  echo -e "${B}  🌐 Memulai Cloudflare Tunnel...${NC}"
  rm -f "$TUNNEL_LOG"

  # Jalankan tunnel — gabung stdout+stderr ke log
  # cloudflared versi baru: URL muncul di stderr, bukan stdout
  "$CLOUDFLARED" tunnel --url "http://localhost:8080" \
    --no-autoupdate \
    > "$TUNNEL_LOG" 2>&1 &
  TUNNEL_PID=$!

  # Tunggu URL tunnel muncul di log (max 30 detik)
  echo -ne "${Y}  ⏳ Menunggu URL tunnel"
  for i in $(seq 1 60); do
    sleep 0.5
    echo -ne "."
    if [ -f "$TUNNEL_LOG" ]; then
      # Coba berbagai pola URL yang mungkin muncul
      # URL tunnel asli: https://kata-kata-kata.trycloudflare.com
      # Harus ada minimal SATU tanda hubung di subdomain
      # Skip: api.trycloudflare.com, cdn.trycloudflare.com (tanpa hubung)
      URL=$(grep -oE 'https://[a-z0-9]+-[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
      if [ -n "$URL" ]; then
        TUNNEL_URL="$URL"
        echo -e "${NC}"
        echo -e "${G}  ✅ Tunnel aktif: ${W}$TUNNEL_URL${NC}"
        break
      fi
    fi
  done

  if [ -z "$TUNNEL_URL" ]; then
    echo -e "${NC}"
    echo -e "${Y}  ⚠️  URL tidak terdeteksi otomatis.${NC}"
    echo -e "${Y}  Cek log: cat $TUNNEL_LOG${NC}"
    # Coba parse URL apapun yang ada di log sebagai fallback
    if [ -f "$TUNNEL_LOG" ]; then
      # Tampilkan semua URL yang ada di log untuk diagnosis
      echo -e "${Y}  URL di log:${NC}"
      grep -oE 'https://[a-zA-Z0-9._-]+' "$TUNNEL_LOG" 2>/dev/null | sort -u | while read -r u; do
        echo -e "${Y}    $u${NC}"
      done
      echo -e "${Y}  Cek log lengkap: cat $TUNNEL_LOG${NC}"
    fi
  fi
}

# ── Update Gist dengan URL tunnel baru ────────────────────────────
update_gist() {
  [ -z "$TUNNEL_URL" ] && return
  [ -z "$GITHUB_TOKEN" ] && return
  echo -e "${B}  📝 Update Gist dengan URL baru...${NC}"
  local NOW
  NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")
  local PAYLOAD
  PAYLOAD=$(printf '{"files":{"tunnel.json":{"content":"{\"url\":\"%s\",\"updated\":\"%s\"}"}}}' \
    "$TUNNEL_URL" "$NOW")
  local HTTP_CODE
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PATCH \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "https://api.github.com/gists/$GIST_ID" 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${G}  ✅ Gist diperbarui${NC}"
  else
    echo -e "${Y}  ⚠️  Gist update gagal (HTTP $HTTP_CODE) — set manual di browser${NC}"
  fi
}

# ── Cleanup saat keluar ────────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${Y}  🛑 Menghentikan semua proses...${NC}"
  [ -n "${TUNNEL_PID:-}" ] && kill "$TUNNEL_PID" 2>/dev/null
  echo -e "${G}  ✅ Server dan tunnel dihentikan. Sampai jumpa!${NC}"
  echo ""
}
trap cleanup EXIT INT TERM

# ══════════════════════════════════════════════════════════════════
banner
echo -e "  Python     : ${W}$($PYTHON --version)${NC}"
echo -e "  Backend    : ${W}$BACKEND_DIR${NC}"
echo -e "  Cloudflared: ${W}${CLOUDFLARED:-tidak tersedia}${NC}"
echo ""

start_tunnel
update_gist

echo ""
echo -e "  ${C}──────────────────────────────────────────────${NC}"
if [ -n "$TUNNEL_URL" ]; then
  echo -e "  ${W}🌍 Akses publik : ${G}$TUNNEL_URL${NC}"
fi
echo -e "  ${W}📱 Lokal        : http://localhost:8080${NC}"
echo -e "  ${C}──────────────────────────────────────────────${NC}"
echo ""
echo -e "  ${Y}Tekan Ctrl+C untuk menghentikan semua.${NC}"
echo ""

# Jalankan backend (foreground — jadi proses utama Termux)
cd "$BACKEND_DIR" && exec "$PYTHON" server.py
