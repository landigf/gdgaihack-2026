# RUNBOOK — exact commands

> If you're about to run something and it's not here, **add it here first**, then run.

## Machines we target

### Dev machines (team)
- **M1 — MacBook Pro M3 Pro** (H1, owner `landigf`). Primary dev + fallback demo machine. Ollama + MLX backend installed. Canonical bench baseline.
- **M2, M3, M4** — teammate laptops. At minimum: a Node ≥ 20, Python ≥ 3.11, Git, and Ollama install. Run `./scripts/doctor.sh` (to be created) on each to confirm.

### Demo machines
- **MSI / sponsor machine TBD at kickoff.** Current public prize page lists an MSI PRO Productivity Bundle for Cut the Cord, while MSI AI laptop specs remain useful as a possible sponsor-hardware reference only. Confirm exact CPU/GPU/NPU/RAM before doing NPU-specific work.
- Fallback: M1 on stage.

Rule: **both machines must run the demo end-to-end** by Sunday morning.

## Pre-kickoff checklist (Friday evening 2026-05-08)

```bash
# Verify env
cp .env.example .env.local    # if not already
# fill: GEMINI_API_KEY (required), OPENAI_API_KEY (optional), ANTHROPIC_API_KEY (optional)
# set OLLAMA_BASE_URL=http://127.0.0.1:11434/v1 if not default

# Install Ollama if needed (macOS)
brew install ollama
ollama serve &

# Pre-pull every model we might use so we don't burn hotel wifi at 09:00 Saturday
ollama pull qwen2.5-coder:3b
ollama pull qwen2.5-coder:7b
ollama pull gemma3:4b
ollama pull gemma3n:e4b            # mobile-first 3GB
ollama pull phi4-mini:3.8b         # check exact tag at ollama.com
ollama pull qwen2.5-coder:14b      # optional heavier pass

# ClaudeFlow install (v0.1.0 from GitHub — needs manual build step)
npm install                        # installs claudeflow as a dep (from github:landigf/claudeflow)
(cd node_modules/claudeflow && npm install --silent && npm run build)
ln -sf ../claudeflow/dist/cli.js node_modules/.bin/claudeflow
npx claudeflow --help              # should print usage

# Dry-run a text-only pipeline via the API wrapper (~$0.01 on Sonnet, no Max burn)
node scripts/cflow.mjs run pipelines/cut-the-cord/pitch-rehearsal.yaml \
  --runtime anthropic \
  --input '{"pitch": "PoliSa builds the first airplane-mode workplace-safety auditor.", "context": "dry run"}' \
  --verbose
# inspect pipelines/traces/*.json — verify it produces judge critiques + rewritten pitch

# Then (budget permitting) dry-run the real kickoff pipeline end-to-end via Claude CLI
echo "MOCK: Build a local-only assistant for a field scenario." > /tmp/mock-brief.txt
npx claudeflow run pipelines/cut-the-cord/pivot-on-brief.yaml \
  --input '{"brief_path": "/tmp/mock-brief.txt"}' \
  --verbose
# inspect pipelines/traces/*.json — verify it produces 5 ideas + crew verdict + demo plan
```

## Kickoff-day runbook (Saturday 2026-05-09)

```bash
# 1. Capture the brief verbatim
pbpaste > doc/specs/cut-the-cord/02-specification.md.brief    # or type it in by hand

# 2. Run the pivot pipeline (≤15 min budget; burns a small slice of Max because tools: [Read, Glob, Grep])
npx claudeflow run pipelines/cut-the-cord/pivot-on-brief.yaml \
  --input '{"brief_path": "doc/specs/cut-the-cord/02-specification.md.brief"}' \
  --verbose
# trace lands in pipelines/traces/<timestamp>.json

# 3. Summarize the trace into the spec
# (Claude Code does this interactively — one short prompt, output into 02-specification.md)

# 4. Critique the chosen idea with a final-pass gate (API wrapper, no Max burn)
node scripts/cflow.mjs run pipelines/cut-the-cord/crew-review-tech.yaml \
  --runtime anthropic \
  --input "$(jq -nc --arg idea "$(cat doc/specs/cut-the-cord/02-specification.md)" '{idea: $idea}')"

# 5. Kick off parallel tech probe (1-hour feasibility spike) while pitch-pair drafts the 30-second story.
```

## Common ClaudeFlow invocations

> **Important:** ClaudeFlow v0.1.0 CLI does NOT yet accept `--runtime` / `--model`. Every `npx claudeflow run` spawns the Claude CLI and will consume Claude Max. For text-only pipelines, use the repo's `scripts/cflow.mjs` wrapper which goes through the Anthropic API instead. See [SETUP_STATUS.md](SETUP_STATUS.md) for the full story.

**Input format is JSON:** `--input '{"key": "value"}'`.

### Path A — via Claude CLI (burns Max sub; required for `tools:` steps)

```bash
# Validate / analyze — free, no LLM calls
npx claudeflow validate pipelines/cut-the-cord/pivot-on-brief.yaml
npx claudeflow analyze  pipelines/cut-the-cord/pivot-on-brief.yaml

# Run (spawns `claude -p` per step — consumes Claude Max)
npx claudeflow run pipelines/cut-the-cord/pivot-on-brief.yaml \
  --input '{"brief_path": "/tmp/mock-brief.txt"}' \
  --verbose
```

### Path B — via Anthropic API (pay-per-token, does NOT touch Max)

Use for any text-only pipeline (no `tools:` dependencies). Budget: ~$0.01–0.05 per run at Sonnet pricing.

```bash
# Pitch rehearsal — 4 steps, no tools
node scripts/cflow.mjs run pipelines/cut-the-cord/pitch-rehearsal.yaml \
  --runtime anthropic \
  --input '{"pitch": "We run the whole assistant on-device. Zero cloud.", "context": "PoliSa · Cut the Cord"}' \
  --verbose

# Technical crew critique
node scripts/cflow.mjs run pipelines/cut-the-cord/crew-review-tech.yaml \
  --runtime anthropic \
  --input '{"idea": "<paste the idea text>"}'

# Benchmark improver (reads a local JSON — needs Read tool, use Path A)
# demo-dryrun-critique (pure text — Path B works)
# competitive-scan / research-state-of-art (need web tool — use Path A, or pre-compute sources)
```

### Path C — via local Ollama (free, only for non-claudeflow bulk tasks)

ClaudeFlow v0.1.0 doesn't have an `OllamaRuntime`. For bulk Ollama work, call `ollama` directly from shell / Node.


## Benchmark runbook (production-ready as of 2026-05-06)

```bash
# 0. one-time: install brew Python deps if not present.
#    macOS python.org python3 lacks enable_load_extension; use brew Python.
/opt/homebrew/bin/python3.12 -m pip install --user --break-system-packages \
    pyyaml sqlite-vec PyMuPDF beautifulsoup4

# 1. ensure ollama is running and models are pulled
ollama serve &                               # if not running
bash scripts/download-models.sh              # idempotent — pulls only what's missing

# 2. fetch the public-domain corpus (~50 MB across NIOSH, OSHA, CDC, DHS)
bash scripts/download-datasets.sh

# 3. index the corpus into SQLite + FTS5 + sqlite-vec (98 chunks at last run)
/opt/homebrew/bin/python3.12 -m src.airgap.index \
    --db benchmarks/datasets/incident-copilot/app.db

# 4. run the harness (real LLM mode)
/opt/homebrew/bin/python3.12 -m benchmarks.harness.run \
    --scenario benchmarks/scenarios/incident-copilot.yaml \
    --systems baseline_v0,ours_v4 \
    --runs 3 \
    --llm-model gemma3:4b \
    --embed-model embeddinggemma

# 5. read the report
cat benchmarks/results/latest.md
```

What the harness does:
- 6 core scenarios × N systems × M runs from `benchmarks/scenarios/incident-copilot.yaml`
- For each: hybrid retrieval (FTS5 + sqlite-vec → RRF fusion) → citation-bound prompt → Ollama chat → strict-JSON output → score against weighted critical_steps + forbidden_claims
- Writes per-run JSON to `benchmarks/results/raw/<date>/` + aggregated `benchmarks/results/latest.md` + appends to `benchmarks/results/history.jsonl`
- Falls back to mock LLM mode automatically if Ollama isn't reachable

Tuning checklist (see [POST_BRIEF_PLAYBOOK.md](POST_BRIEF_PLAYBOOK.md) §"Tuning ladder"):
1. Inspect per-step breakdown in `benchmarks/results/raw/<date>/*.json` → which `critical_steps` are missing? Add paraphrases.
2. Try `--llm-model qwen3:4b` (Apache-2.0, ranked #1 small reasoner per DR-06) or `gemma3n:e4b`.
3. Add hazard tags in `src/airgap/index.py` for new vertical and re-index.

See [BENCHMARKS.md](BENCHMARKS.md) for the harness design philosophy. Production code in `src/airgap/` and `benchmarks/harness/`.

## Demo dry-run protocol

1. **Airplane mode.** Hit the toggle on the demo machine. Wi-Fi off. Bluetooth off (unless demo needs it).
2. Close every non-demo app. One clean browser window if any.
3. Verify `ollama ps` — preloaded model is in RAM.
4. Run the demo script exactly as written in [DEMO_SCRIPT.md](DEMO_SCRIPT.md). Time it.
5. If any cell fails, **log the failure in `05-feedback.md` with the exact output**. Don't "try again" until root cause known.
6. Record the dry-run as a 1080p screen capture. Use the last successful recording as a **backup video** on a USB stick, in case stage wifi or stage laptop fails.

## Git hygiene

```bash
# New feature work — branch per lane
git checkout -b tech/<short-slug>      # e.g. tech/bench-harness-skeleton
git checkout -b pitch/<short-slug>     # e.g. pitch/v1-narrative

# Before PR
git status && git diff                  # self-review first
# PR targets main; at least one human ack from the *other* pair before merge.
```

Never push to `main` directly during the hackathon — even small changes. One bad merge at hour 22 is unrecoverable.

## Emergency / rollback

- `git reflog` is your friend. Nothing is lost unless you also ran `git gc --aggressive --prune=now`.
- If Ollama hangs: `pkill ollama && ollama serve &`.
- If the MSI laptop's NPU stack misbehaves: fall back to M1 for the demo. The narrative is the same; the hardware message is flexible.
- If ClaudeFlow errors with `no runtime provider`: export a key. See [../../claudeflow/API_KEYS.md](../../claudeflow/API_KEYS.md).
