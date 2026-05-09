#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v rustc >/dev/null 2>&1; then
    echo "==> Installing Rust toolchain"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    . "$HOME/.cargo/env"
fi

echo "==> Pulling Ollama models (one-time, ~3 GB)"
ollama pull qwen3:4b
ollama pull nomic-embed-text

echo "==> Python venv + deps"
cd "$ROOT/backend"
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Node deps"
cd "$ROOT"
npm install

echo
echo "==> Done. Run: npm run tauri:dev"
