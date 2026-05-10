#!/usr/bin/env bash
# Install the local voice stack: whisper.cpp (STT) + base.en model.
# macOS `say` (TTS) and `afconvert` ship with the OS — nothing to do.
# Idempotent: re-runs are no-ops once the binary + model exist.
set -euo pipefail

WHISPER_BIN="${WHISPER_BIN:-/opt/homebrew/bin/whisper-cli}"
WHISPER_MODEL_DIR="${WHISPER_MODEL_DIR:-$HOME/.local/whisper-models}"
WHISPER_MODEL="${WHISPER_MODEL:-$WHISPER_MODEL_DIR/ggml-base.en.bin}"
WHISPER_MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"

if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "voice setup: macOS only (uses /usr/bin/say + afconvert)." >&2
    exit 1
fi

if [[ ! -x "$WHISPER_BIN" ]] && ! command -v whisper-cli >/dev/null 2>&1; then
    if ! command -v brew >/dev/null 2>&1; then
        echo "voice setup: Homebrew not found. Install brew first: https://brew.sh" >&2
        exit 1
    fi
    echo "==> Installing whisper.cpp via Homebrew"
    brew install whisper-cpp
else
    echo "==> whisper-cli already installed at $(command -v whisper-cli || echo "$WHISPER_BIN")"
fi

mkdir -p "$WHISPER_MODEL_DIR"
if [[ -f "$WHISPER_MODEL" && $(stat -f%z "$WHISPER_MODEL") -gt 100000000 ]]; then
    echo "==> ggml-base.en.bin already present ($(du -h "$WHISPER_MODEL" | cut -f1))"
else
    echo "==> Downloading ggml-base.en.bin (~141 MB) → $WHISPER_MODEL"
    curl -fL --progress-bar -o "$WHISPER_MODEL.tmp" "$WHISPER_MODEL_URL"
    mv "$WHISPER_MODEL.tmp" "$WHISPER_MODEL"
    echo "    done: $(du -h "$WHISPER_MODEL" | cut -f1)"
fi

# Smoke check: round-trip 'say' → wav → whisper-cli → text. ~3 s on M-series.
echo "==> Smoke test"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
say -v Daniel -o "$TMP/s.aiff" "voice setup ok"
afconvert "$TMP/s.aiff" "$TMP/s.wav" -d LEI16@16000 -c 1 -f WAVE
TRANSCRIPT=$(whisper-cli -m "$WHISPER_MODEL" -f "$TMP/s.wav" --no-timestamps --no-prints -l en 2>/dev/null \
    | awk 'NF && $0 !~ /^[[:space:]]*\[/ { sub(/^[[:space:]]+/,""); sub(/[[:space:]]+$/,""); print; exit }')
if [[ -z "$TRANSCRIPT" ]]; then
    echo "voice setup: smoke test produced no transcript." >&2
    exit 1
fi
echo "    transcribed: \"$TRANSCRIPT\""
echo
echo "==> Voice stack ready."
echo "    Endpoint: POST /ares/voice/houston (multipart audio)"
echo "    Override binary/model paths via env: WHISPER_BIN, WHISPER_MODEL"
