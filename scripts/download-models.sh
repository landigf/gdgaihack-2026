#!/usr/bin/env bash
# Pulls every Ollama model we might realistically use at GDG AI HACK 2026.
# Idempotent: safe to re-run.
set -euo pipefail

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not installed. Install from https://ollama.com then re-run." >&2
  exit 1
fi

models=(
  qwen2.5-coder:3b
  qwen2.5-coder:7b
  gemma3:4b
  gemma3n:e4b         # mobile-first 3GB, purpose-built for phones / laptops
  phi4-mini           # 3.8B, fastest token rate at small size
  qwen3:4b            # Apache-2.0 reasoning brain (DR-06: best small-reasoner combo)
  embeddinggemma      # on-device-RAG embeddings (DR-06: makes RAG actually possible)
  nomic-embed-text    # backup embedder, Apache-2.0 (DR-05 LlamaIndex audit pattern)
  # Brief-named specialized models — verified against ollama.com/library 2026-05-09:
  #   gpt-oss:20b      VERIFIED — exists. Brief example for Min tier (16 GB).
  #   medgemma:27b     VERIFIED — only the 27B size is on Ollama. **MedGemma 4B**
  #                    (which the brief names) is NOT on Ollama; if Candidate 3
  #                    (Clinic Copilot) wins, we must pull from Hugging Face
  #                    google/medgemma-4b-it and convert to GGUF, OR use the
  #                    27B variant which needs Comfortable+ tier (32+ GB).
  #   devstral:24b     VERIFIED — Mistral's coding specialist.
  #   mistral-small:22b VERIFIED — actual size is 22B (brief said "Mistral Small"
  #                    without a size; this is the closest match).
  #   phi4:14b         VERIFIED — but brief says "Phi-4 mini" (3.8B). Use the
  #                    existing phi4-mini tag we already pull (above).
  # Each pull is large; the script tolerates ":not-found" gracefully.
  gpt-oss:20b         # brief Min-tier example (~12 GB); VERIFIED 2026-05-09
  medgemma:27b        # brief Med example (~16 GB); requires Comfortable tier
  devstral:24b        # brief coding example (~14 GB); for Candidate 4 (Coding Navigator)
  mistral-small:22b   # brief generalist example (~13 GB)
  # Uncomment below if your machine has headroom:
  # qwen2.5-coder:14b
  # gemma3:12b
  # qwen2.5vl:7b      # vision LLM — only if committing to safety-auditor stretch
  # llama3.1:70b      # Ideal-tier 64+ GB host only
)

# Idempotent: skip re-pull if already present
for m in "${models[@]}"; do
  if ollama list 2>/dev/null | awk 'NR>1 {print $1}' | grep -Fxq "$m"; then
    echo "== skip $m (already pulled) =="
  else
    echo "== pulling $m =="
    ollama pull "$m" || echo "!! failed to pull $m — may be wrong tag; check ollama.com"
  fi
done

echo
echo "Pulled $(ollama list | awk 'NR>1' | wc -l) models total."
echo "OK"
