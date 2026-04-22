#!/bin/bash
# ══════════════════════════════════════════════════════════
#  RyouStream v1.0.0 Epsilon — Start Script
#  Linux / macOS / Android (Termux)
# ══════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
PYTHON=""

# Cari Python 3
for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then
        VER=$("$cmd" -c "import sys; print(sys.version_info.major)" 2>/dev/null)
        if [ "$VER" = "3" ]; then
            PYTHON="$cmd"
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    echo ""
    echo "  ❌ Python 3 tidak ditemukan!"
    echo "  Install: sudo apt install python3  (atau pkg install python di Termux)"
    echo ""
    exit 1
fi

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   🎌 RyouStream v1.0.0 Epsilon       ║"
echo "  ║   Ryounime Stream Platform            ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""
echo "  Python : $($PYTHON --version)"
echo "  Dir    : $BACKEND_DIR"
echo ""

# Install dependencies jika belum ada
if ! "$PYTHON" -c "import requests" &>/dev/null 2>&1; then
    echo "  📦 Install dependencies..."
    "$PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt" --quiet
    echo "  ✅ Dependencies siap"
    echo ""
fi

# Generate SSL cert untuk PWA LAN (opsional)
CERT="$BACKEND_DIR/cert.pem"
KEY="$BACKEND_DIR/key.pem"
if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
    echo "  🔐 Generate SSL certificate untuk PWA dari perangkat lain..."
    "$PYTHON" "$BACKEND_DIR/generate_cert.py" 2>/dev/null && \
        echo "  ✅ SSL cert dibuat" || \
        echo "  ⚠️  SSL cert gagal (HTTP saja, PWA hanya bisa dari localhost)"
    echo ""
fi

# Jalankan server
echo "  🚀 Memulai server..."
echo "  ──────────────────────────────────────"
echo ""
cd "$BACKEND_DIR" && exec "$PYTHON" server.py
