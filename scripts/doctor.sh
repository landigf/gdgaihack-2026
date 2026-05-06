#!/usr/bin/env bash
# Verifies that this machine is ready for GDG AI HACK 2026 / Cut the Cord.
# Exits non-zero on any failure. Prints a status line per check.
set -uo pipefail

fail=0
ok()   { printf "  \033[32mOK\033[0m   %s\n" "$1"; }
warn() { printf "  \033[33mWARN\033[0m %s\n" "$1"; }
err()  { printf "  \033[31mFAIL\033[0m %s\n" "$1"; fail=1; }

echo "== PoliSa doctor =="

# Node
if command -v node >/dev/null 2>&1; then
  v=$(node --version)
  if [[ "$v" =~ ^v(2[0-9]|[3-9][0-9]) ]]; then ok "node $v"; else err "node $v (need >=20)"; fi
else err "node not installed"; fi

# Python
if command -v python3 >/dev/null 2>&1; then
  v=$(python3 --version)
  ok "$v"
else err "python3 not installed"; fi

# Git
command -v git >/dev/null 2>&1 && ok "git $(git --version | awk '{print $3}')" || err "git not installed"

# Ollama
if command -v ollama >/dev/null 2>&1; then
  ok "ollama $(ollama --version 2>/dev/null | head -1)"
  if curl -s http://127.0.0.1:11434/api/version >/dev/null; then
    ok "ollama server reachable"
  else warn "ollama installed but server not running (run: ollama serve &)"; fi
else warn "ollama not installed (required for local runtime)"; fi

# ClaudeFlow (CLI doesn't support --version; detect by binary presence + parse help)
if [[ -x node_modules/.bin/claudeflow ]] || [[ -e node_modules/claudeflow/dist/cli.js ]]; then
  v=$(node -e "console.log(require('./node_modules/claudeflow/package.json').version)" 2>/dev/null || echo "?")
  ok "claudeflow v$v installed"
else warn "claudeflow not installed in this repo — run: npm install && (cd node_modules/claudeflow && npm install --silent && npm run build) && ln -sf ../claudeflow/dist/cli.js node_modules/.bin/claudeflow"; fi

# .env.local
if [[ -f .env.local ]]; then
  ok ".env.local present"
  grep -qE '^(GEMINI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY)=.+' .env.local \
    && ok "at least one API key set" \
    || warn ".env.local has no API key set"
else warn ".env.local missing (cp .env.example .env.local)"; fi

# Models we care about (mandatory: chat models + at least one embedder)
if command -v ollama >/dev/null 2>&1; then
  want=(qwen2.5-coder:3b qwen2.5-coder:7b gemma3:4b gemma3n:e4b phi4-mini qwen3:4b embeddinggemma nomic-embed-text)
  have=$(ollama list 2>/dev/null | awk 'NR>1 {print $1}')
  match() {
    local m="$1"
    echo "$have" | grep -Eq "^(${m}|${m}:latest)$"
  }
  for m in "${want[@]}"; do
    if match "$m"; then ok "model $m pulled";
    else warn "model $m NOT pulled (./scripts/download-models.sh)"; fi
  done
fi

# Brew Python with sqlite extension loading (macOS only — needed for sqlite-vec)
if [[ "$(uname)" == "Darwin" ]]; then
  BREW_PY=/opt/homebrew/bin/python3.12
  if [[ -x "$BREW_PY" ]]; then
    has_ext=$("$BREW_PY" -c "import sqlite3; conn=sqlite3.connect(':memory:'); print(hasattr(conn,'enable_load_extension'))" 2>/dev/null)
    if [[ "$has_ext" == "True" ]]; then
      ok "brew python3.12 supports sqlite extension loading"
      missing=$("$BREW_PY" -c "import importlib; missing=[m for m in ('yaml','sqlite_vec','fitz','bs4') if importlib.util.find_spec(m) is None]; print(','.join(missing))" 2>/dev/null)
      if [[ -z "$missing" ]]; then
        ok "brew python3.12 has yaml + sqlite_vec + fitz + bs4"
      else
        warn "brew python3.12 missing: $missing — run: $BREW_PY -m pip install --user --break-system-packages pyyaml sqlite-vec PyMuPDF beautifulsoup4"
      fi
    else
      warn "brew python3.12 found but lacks sqlite extension loading"
    fi
  else
    warn "brew python3.12 missing (brew install python@3.12) — sqlite-vec needs it on macOS"
  fi
fi

# Corpus + indexed DB
CORPUS_DIR="benchmarks/datasets/incident-copilot/sources"
DB_PATH="benchmarks/datasets/incident-copilot/app.db"
if [[ -d "$CORPUS_DIR" ]] && [[ -n "$(find "$CORPUS_DIR" -type f 2>/dev/null | head -1)" ]]; then
  count=$(find "$CORPUS_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
  ok "corpus fetched ($count files)"
else
  warn "corpus not fetched — run: bash scripts/download-datasets.sh"
fi
if [[ -s "$DB_PATH" ]]; then
  size=$(du -h "$DB_PATH" | cut -f1)
  ok "app.db exists ($size)"
else
  warn "app.db missing — run: /opt/homebrew/bin/python3.12 -m src.airgap.index"
fi

echo "==================="
if (( fail == 0 )); then
  printf "\033[32mOK\033[0m — doctor says this machine is ready.\n"
  exit 0
else
  printf "\033[31mFAIL\033[0m — fix the FAIL items above before hackathon day.\n"
  exit 1
fi
