# SETUP_STATUS — pre-kickoff health check

> Auto-populated by Claude Code on 2026-04-23. Update as things change.
> Run `./scripts/doctor.sh` anytime for a fresh snapshot on any machine.

## Machine H1 (landigf · MacBook M3 Pro) · 2026-04-23 19:24 CEST

| Component | Status | Notes |
|---|---|---|
| Node | ✅ v23.11.0 | ≥20 required. |
| Python | ✅ 3.12.7 | ≥3.11 required. |
| Git | ✅ 2.48.0 | |
| Ollama daemon | ✅ 0.21.0 | Running via macOS app; `curl http://127.0.0.1:11434/api/version` → `{"version":"0.21.0"}`. |
| Ollama models | ✅ all 5 pulled | `qwen2.5-coder:3b`, `qwen2.5-coder:7b`, `gemma3:4b`, `gemma3n:e4b`, `phi4-mini` — `./scripts/doctor.sh` clean. |
| `.env.local` | ✅ present | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` all set. |
| ClaudeFlow | ⚠️ installed from GitHub v0.1.0 | See **Known gap** below. |
| `package.json` | ✅ initialised | Deps: `claudeflow` from `github:landigf/claudeflow`. |
| `node_modules/.bin/claudeflow` | ✅ symlinked | `dist/` built manually after install (github tarball ships source only). |

Re-running on a teammate machine:

```bash
./scripts/doctor.sh         # health check
./scripts/download-models.sh  # pull all models (idempotent)
npm install                 # installs claudeflow + deps
(cd node_modules/claudeflow && npm install --silent && npm run build)
ln -sf ../claudeflow/dist/cli.js node_modules/.bin/claudeflow
npx claudeflow --help       # verify CLI
```

## Pipelines scaffolded

```
$ for p in pipelines/cut-the-cord/*.yaml; do npx claudeflow validate "$p"; done
```

| Pipeline | Validation | Analysis (Sonnet cost/run) |
|---|---|---|
| `pivot-on-brief.yaml` | ✅ valid | $0.0099, ~110s, 6 LLM steps |
| `crew-review-tech.yaml` | ✅ valid | ~5 LLM steps |
| `pitch-rehearsal.yaml` | ✅ valid | 4 LLM steps |
| `bench-improver.yaml` | ✅ valid | 2 LLM steps |
| `demo-dryrun-critique.yaml` | ✅ valid | 3 LLM steps |
| `competitive-scan.yaml` | ⚠ 1 warning | Uses `tool: web` — analyzer can't resolve outputs statically; actual run still works. |
| `research-state-of-art.yaml` | ⚠ 1 warning | Same `tool: web` false positive. |

## ⚠️ Known gap — ClaudeFlow v0.1.0 vs CLAUDE.md promise

**The installed `claudeflow@0.1.0` CLI only wires `ClaudeCliRuntime`** — every step spawns a `claude -p` subprocess. That consumes the **Claude Max subscription**, not the API keys.

This contradicts the repo's `CLAUDE.md` / `AGENTS.md` which say "ClaudeFlow is API-only, never consumes Claude Max". The `ClaudeApiRuntime` class exists in the source (`node_modules/claudeflow/src/runtime/api.ts`) but the CLI entrypoint doesn't expose a `--runtime` flag to switch to it.

**Additional limitation:** `ClaudeApiRuntime` is text-only. It does NOT execute tools (`Read`, `Glob`, `Grep`, `WebFetch`) — those only work when routed through `claude` CLI (which itself uses Max).

### Implication for the hackathon

- Pipelines with `tools: [...]` (today: `pivot-on-brief.yaml`, `research-state-of-art.yaml`) must either (a) run via `npx claudeflow run` (burns Max) or (b) be refactored to receive tool outputs as `--input` fields pre-computed in shell.
- Pure text pipelines (`pitch-rehearsal`, `crew-review-tech`, `bench-improver`, `demo-dryrun-critique`, `competitive-scan` if the web search happens elsewhere) CAN run against the Anthropic API via a small wrapper.

### Workaround in repo

`scripts/cflow.mjs` is a thin Node wrapper that loads any pipeline YAML and runs it via `ClaudeApiRuntime` (Anthropic API, not Max). Runtime auto-detect: `OPENAI_API_KEY > GEMINI_API_KEY > ANTHROPIC_API_KEY`. Note: OpenAI-compatible providers (Gemini / OpenAI / DeepSeek) require an `OpenAICompatibleRuntime` which is not in v0.1.0 — the wrapper falls back to Anthropic when asked for those.

```bash
# Run a text-only pipeline via Anthropic API (does NOT use Claude Max)
node scripts/cflow.mjs run pipelines/cut-the-cord/pitch-rehearsal.yaml \
  --runtime anthropic \
  --input '{"pitch": "We run the whole thing offline. Privacy by construction.", "context": "team PoliSa · Cut the Cord"}' \
  --verbose
```

### Upstream fix worth making post-hackathon

Add `--runtime` and `--model` flags to `claudeflow/src/cli.ts`, with OpenAI-compatible runtime support. See `github.com/landigf/claudeflow`.

## Recommended routing today (given the gap)

| Job | Runtime | Rationale |
|---|---|---|
| Any pipeline with `tool: web` / `tools: [Read, Glob, ...]` | `npx claudeflow run` (Claude CLI → Max sub) | tools only work there; budget ≤10 runs this weekend. |
| Text-only pipelines (rewrites, reviews, rehearsals) | `node scripts/cflow.mjs run --runtime anthropic` | pay-per-token API, ~$0.01/run; does NOT touch Max sub. |
| Bulk drafts we don't need high quality on | use Ollama directly via teammate script (no claudeflow needed) | truly free once models pulled. |

## Live dry-run results (2026-04-23)

| Pipeline | Path | Outcome | Duration | Cost | Trace |
|---|---|---|---|---|---|
| `pitch-rehearsal.yaml` | API wrapper (`cflow.mjs`) | ✅ 4/4 steps | 21.8s | $0.0117 | [evidence/dry-runs/pitch-rehearsal-api.json](evidence/dry-runs/pitch-rehearsal-api.json) |
| `crew-review-tech.yaml` | API wrapper | ✅ 5/5 steps | 47.7s | $0.0297 | [evidence/dry-runs/crew-review-tech-api.json](evidence/dry-runs/crew-review-tech-api.json) |
| `pivot-on-brief.yaml` | `npx claudeflow run` (Max) | ✅ 6/6 steps | 284.9s | **$1.30 Max usage** | [evidence/dry-runs/pivot-on-brief-max.json](evidence/dry-runs/pivot-on-brief-max.json) |

Totals today: **$0.04 real money** (Anthropic API) + **~$1.30 notional Max burn** (one-time kickoff-pipeline validation).

**Learning:** the static analyzer predicts $0.01/run for `pivot-on-brief` but the real Claude CLI path burns ~100× that because Read/Glob/Grep tool use triggers multi-turn agentic behavior per step. At kickoff this is a one-time cost, not a loop — acceptable. If we iterate on the brief (brief v1 → v2), rewrite the pipeline to take `brief_text` as JSON input instead of `brief_path`, then route through the API wrapper.

## Todo before kickoff (2026-05-08 evening)

- [ ] H1 — replace the shell-level `ps aux` check in `doctor.sh` with a `wait-for-ollama-pull` helper.
- [ ] H1 — run a live dry-run of `pitch-rehearsal.yaml` through `scripts/cflow.mjs --runtime anthropic` and append the trace cost to `05-feedback.md`.
- [ ] H1 — decide if we invest ~2h upstream on `claudeflow` to add the CLI runtime flag, or live with the wrapper for the weekend.
- [x] H1 — 2026-04-23 19:40 · `gemma3n:e4b` + `phi4-mini` pulls both completed; `./scripts/doctor.sh` all green.
- [x] H1 — 2026-04-23 20:15 · Three pipelines dry-run end-to-end (2 via API, 1 via Max). Traces in [evidence/dry-runs/](evidence/dry-runs/). Schema-string-forces-JSON bug discovered and fixed.
- [x] H1 — 2026-05-06 08:55 · Smoke-test `pitch-rehearsal.yaml` against Seed A via `cflow.mjs --runtime anthropic` (Sonnet-4-20250514) — 31.5s, $0.0226. Three judges raked Seed A; rewrite over-fabricated timing breakdown so the seed stays honest. Trace at [pipelines/traces/cut-the-cord-pitch-rehearsal-2026-05-06T08-55-05.json](../../../pipelines/traces/cut-the-cord-pitch-rehearsal-2026-05-06T08-55-05.json).
- [x] H1 — 2026-05-06 10:30 · Pulled the 3 missing models (`qwen3:4b`, `embeddinggemma`, `nomic-embed-text`). Embedder was the keystone — RAG was impossible without it.
- [x] H1 — 2026-05-06 11:15 · Fetched 10 public-domain corpus files (~1.6 MB): NIOSH chlorine + ammonia + index, OSHA LOTO + EAP (3 pages) + Confined Spaces, CDC heat topic, DHS Stop the Bleed. Red Cross + ERG 2024 PDF blocked by anti-bot; covered by 2 synthetic SOPs (substation B + pump room B).
- [x] H1 — 2026-05-06 11:25 · Indexed corpus to `benchmarks/datasets/incident-copilot/app.db` — **98 chunks across 7 docs, all embedded with EmbeddingGemma**. Schema = `docs` + `chunks` + `chunks_fts` (FTS5) + `chunks_vec` (sqlite-vec, 768-dim).
- [x] H1 — 2026-05-06 11:35 · First harness run end-to-end on 6 core scenarios × 2 systems × 1 run = 12 LLM calls. Real numbers in [benchmarks/results/latest.md](../../../benchmarks/results/latest.md): `ours_v4` mean Cited Checklist Completeness = 0.117, p50 e2e = 13.5s, halluc = 0.000, citations 100% valid. Chlorine scenario shows 2× lift (baseline 0.20 → ours 0.40). FTS5 query patched to handle conversational utterances.
- [ ] H2/H3/H4 once assigned — each run `./scripts/doctor.sh` + `./scripts/download-models.sh` + `bash scripts/download-datasets.sh` + `/opt/homebrew/bin/python3.12 -m src.airgap.index`. Then run the harness via `/opt/homebrew/bin/python3.12 -m benchmarks.harness.run --scenario benchmarks/scenarios/incident-copilot.yaml --systems baseline_v0,ours_v4 --runs 3 --llm-model gemma3:4b`.

## ⚠️ macOS-Python gotcha (added 2026-05-06)

**Stdlib `python3` from python.org does NOT support `enable_load_extension`** which `sqlite-vec` needs to install its `vec0` virtual table. Symptom: `AttributeError: 'sqlite3.Connection' object has no attribute 'enable_load_extension'`.

**Fix:** use Homebrew Python which has it enabled:

```bash
# install brew Python if missing
brew install python@3.12

# install deps on the brew Python (PEP 668 needs --break-system-packages)
/opt/homebrew/bin/python3.12 -m pip install --user --break-system-packages \
    pyyaml sqlite-vec PyMuPDF beautifulsoup4

# everywhere we use Python in this repo, prefer brew Python
/opt/homebrew/bin/python3.12 -m src.airgap.index ...
/opt/homebrew/bin/python3.12 -m benchmarks.harness.run ...
```

Linux teammates and Windows-WSL teammates: stdlib Python typically supports extension loading; `python3` should just work.
