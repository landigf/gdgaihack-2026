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

# Models we care about
if command -v ollama >/dev/null 2>&1; then
  want=(qwen2.5-coder:3b qwen2.5-coder:7b gemma3:4b gemma3n:e4b phi4-mini)
  have=$(ollama list 2>/dev/null | awk 'NR>1 {print $1}')
  # Model names in `ollama list` may be suffixed with ":latest" when no tag was given.
  match() {
    local m="$1"
    echo "$have" | grep -Eq "^(${m}|${m}:latest)$"
  }
  for m in "${want[@]}"; do
    if match "$m"; then ok "model $m pulled";
    else warn "model $m NOT pulled (./scripts/download-models.sh)"; fi
  done
fi

echo "==================="
if (( fail == 0 )); then
  printf "\033[32mOK\033[0m — doctor says this machine is ready.\n"
  exit 0
else
  printf "\033[31mFAIL\033[0m — fix the FAIL items above before hackathon day.\n"
  exit 1
fi
