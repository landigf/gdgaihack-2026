#!/usr/bin/env bash
# Loads the demo model into RAM by running one cheap inference.
# Run at T-30min before the pitch slot so cold-start doesn't bite on stage.
set -euo pipefail

MODEL="${1:-gemma3:4b}"

echo "Warming $MODEL ..."
ollama run "$MODEL" "OK" >/dev/null
echo "OK"
