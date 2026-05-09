#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v rustc >/dev/null 2>&1; then
    echo "==> Installing Rust toolchain"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    . "$HOME/.cargo/env"
fi

echo "==> Pulling Ollama models (one-time, ~6 GB total)"
ollama pull qwen3:4b           # default GEN_MODEL — thinking model, best quality
ollama pull gemma3:4b          # faster fallback for M3 Pro 18 GB demo machines
ollama pull nomic-embed-text   # EMBED_MODEL (768-dim)

# Demo-machine override: on M3 Pro 18 GB the qwen3:4b thinking budget pushes
# /summarize past the 10 s gate from PLAN.md. Set GEN_MODEL=gemma3:4b on
# that hardware (warm summarize ~6 s, no reasoning preamble in the output):
#   export GEN_MODEL=gemma3:4b
# On M4 Pro / 24 GB or larger, leave the default.

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
