#!/usr/bin/env bash
# Self-contained launcher for the Rover dev stack.
# Kills any zombies, then relaunches `npm run tauri:dev` under
# caffeinate so macOS won't sleep / suspend the process tree on
# Wi-Fi switches or lid-close events. Logs to /tmp/rover-final.log.
#
# Default backend: Ollama (gemma3:4b) — out-of-process so a model
# error can't crash the FastAPI sidecar (this is what bit us during
# rehearsal: MLX 7B hit a Metal GPU hang and took down the whole
# stack). Override with `LLM_BACKEND=mlx bash scripts/dev.sh` to use
# in-process MLX-LM if you're confident about the GPU budget.
#
# Usage:
#   bash scripts/dev.sh
#   tail -f /tmp/rover-final.log    # in another terminal
#
# When something looks wrong (`127.0.0.1 refused to connect`,
# `voice: Failed to fetch`, frozen UI), just rerun this script —
# it kills + restarts cleanly.

set -u
cd "$(dirname "$0")/.."

echo "→ killing zombies…"
pkill -9 -f "target/debug/rover" 2>/dev/null || true
pkill -9 -f "npm run tauri" 2>/dev/null || true
pkill -9 -f "node.*tauri dev" 2>/dev/null || true
pkill -9 -f "node.*vite" 2>/dev/null || true
pkill -9 -f "uvicorn main:app" 2>/dev/null || true
sleep 1

# Verify ports are free; if a process refuses to die, surface it
# instead of silently looping.
for port in 8765 1420; do
  if lsof -nP -iTCP:${port} -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✗ port ${port} still in use — abort. Identify with: lsof -nP -iTCP:${port} -sTCP:LISTEN" >&2
    exit 1
  fi
done

LLM_BACKEND="${LLM_BACKEND:-ollama}"
GEN_MODEL="${GEN_MODEL:-gemma3:4b}"

echo "→ launching: LLM_BACKEND=${LLM_BACKEND} GEN_MODEL=${GEN_MODEL}"
caffeinate -dimsu nohup env \
  "LLM_BACKEND=${LLM_BACKEND}" \
  "GEN_MODEL=${GEN_MODEL}" \
  npm run tauri:dev > /tmp/rover-final.log 2>&1 &

LAUNCHER_PID=$!
disown

echo "→ stack starting (PID ${LAUNCHER_PID}). Waiting for ports to bind…"
DEADLINE=$(($(date +%s) + 180))
while :; do
  if lsof -nP -iTCP:8765 -sTCP:LISTEN >/dev/null 2>&1 \
     && lsof -nP -iTCP:1420 -sTCP:LISTEN >/dev/null 2>&1; then
    break
  fi
  if [ $(date +%s) -gt $DEADLINE ]; then
    echo "✗ timed out after 180 s. Check /tmp/rover-final.log" >&2
    tail -30 /tmp/rover-final.log
    exit 1
  fi
  sleep 2
done

echo "✓ stack alive"
echo "  • Vite      http://127.0.0.1:1420"
echo "  • Mars demo http://127.0.0.1:1420/#ares"
echo "  • Sidecar   http://127.0.0.1:8765/health"
echo "  • Logs      tail -f /tmp/rover-final.log"
