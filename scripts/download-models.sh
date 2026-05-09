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
  # Brief-named specialized models added 2026-05-09 after kickoff brief:
  # the brief explicitly cites these as "examples" of the model stack judges expect.
  # Each pull is large; the script tolerates ":not-found" so a missing tag won't
  # break setup on machines that can't fit the bigger models. Verify exact tags
  # against ollama.com/library before kickoff (CODEX-Models task).
  medgemma:4b         # specialized medical model (brief example) — for Candidate 3 (Clinic Copilot)
  devstral:24b        # specialized coding model (brief example) — for Candidate 4 (Coding Navigator)
  mistral-small:24b   # generalist alt to gemma3 in the 8-14B Comfortable tier (brief example)
  # gpt-oss-20b      # brief example for Minimum tier; not yet on Ollama (verify tag at kickoff)
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
