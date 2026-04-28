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

# ── Install Python deps ────────────────────────────────────────────
# Install pkg deps (openssl untuk cert, curl sudah ada biasanya)
if ! command -v openssl &>/dev/null; then
  echo -e "${Y}  📦 Install openssl...${NC}"
  pkg install -y openssl-tool 2>/dev/null     && echo -e "${G}  ✅ openssl siap${NC}"     || echo -e "${Y}  ⚠️  openssl gagal, HTTP saja${NC}"
fi

# Install Python deps — satu per satu agar satu gagal tidak block semua
echo -e "${Y}  📦 Install dependencies Python...${NC}"
for pkg_name in requests mutagen; do
  if ! "$PYTHON" -c "import ${pkg_name//-/_}" &>/dev/null 2>&1; then
    "$PYTHON" -m pip install "$pkg_name" --quiet 2>/dev/null       && echo -e "${G}  ✅ $pkg_name${NC}"       || echo -e "${Y}  ⚠️  $pkg_name gagal (opsional)${NC}"
  fi
done

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

  # Jalankan tunnel di background, log ke file
  "$CLOUDFLARED" tunnel --url "http://localhost:8080" \
    --logfile "$TUNNEL_LOG" \
    --no-autoupdate \
    2>>"$TUNNEL_LOG" &
  TUNNEL_PID=$!

  # Tunggu URL tunnel muncul di log (max 20 detik)
  echo -ne "${Y}  ⏳ Menunggu URL tunnel"
  for i in $(seq 1 40); do
    sleep 0.5
    echo -ne "."
    if [ -f "$TUNNEL_LOG" ]; then
      URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
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
    echo -e "${Y}  ⚠️  Tunnel URL tidak terdeteksi. Cek $TUNNEL_LOG${NC}"
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
