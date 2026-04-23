# 03 — Tasks (Cut the Cord) · SOURCE OF TRUTH

> Every work session starts and ends here. One task `in-progress` per agent/human at a time.

## Status rules

- `todo` — not started
- `in-progress` — owner + timestamp set; agents: prefix with `[claude-code]` / `[codex]` / `[copilot]` / `[chatgpt]`
- `blocked` — explain what's blocking in a nested bullet
- `done` — link the commit / file / trace in a nested bullet

## Open questions (resolve ASAP)

- [ ] Is "Cut the Cord" officially the MSI track label? → confirm at kickoff.
- [ ] Which humans are in slots H2 / H3 / H4? → resolve Friday evening.
- [ ] Does the MSI laptop ship with a specific NPU SDK pre-installed? → ask at kickoff.
- [ ] Can we stack with the ElevenLabs side-challenge if our flow uses only local voices? → ask at kickoff.
- [ ] Do we upstream a `--runtime` flag PR to `claudeflow` pre-kickoff, or ship the `cflow.mjs` wrapper as-is? → H1 to decide by 2026-05-01.

## Pre-kickoff work (do now, before 2026-05-08)

### Infrastructure / setup
- [x] `done` — [claude-code] 2026-04-23 — Pre-pulled `qwen2.5-coder:3b`, `qwen2.5-coder:7b`, `gemma3:4b`, `phi4-mini` on M1; `gemma3n:e4b` pulling in background. (Script: `scripts/download-models.sh`.)
- [ ] `todo` — H1 — Test `ollama` + MLX backend on M1, record tokens/sec for Gemma 3 4B and Qwen 2.5 Coder 7B. (Bench harness not yet implemented — this blocks on `benchmarks/harness/run.py`.)
- [ ] `todo` — H2 (when assigned) — On M2/M3/M4 laptops: run `./scripts/doctor.sh`, `./scripts/download-models.sh`, then `npm install && (cd node_modules/claudeflow && npm install --silent && npm run build) && ln -sf ../claudeflow/dist/cli.js node_modules/.bin/claudeflow`. See [SETUP_STATUS.md](SETUP_STATUS.md) for the exact recipe.
- [x] `done` — [claude-code] 2026-04-23 — Installed `claudeflow@0.1.0` from GitHub; built `dist/`; linked `node_modules/.bin/claudeflow`. All 7 pipelines validate clean (5 fully, 2 with harmless `tool: web` warnings). Analyze on `pivot-on-brief.yaml`: ~$0.01 / 110s / 6 LLM steps at Sonnet pricing.
- [x] `done` — [claude-code] 2026-04-23 20:15 — Dry-ran `pitch-rehearsal.yaml` + `crew-review-tech.yaml` via `node scripts/cflow.mjs run --runtime anthropic` ($0.04 total real money). Dry-ran `pivot-on-brief.yaml` via `npx claudeflow run` (~$1.30 Max burn, acceptable for one-time kickoff validation). All 6/6 pivot steps produced useful output — see [evidence/dry-runs/](evidence/dry-runs/). Discovered and fixed a pipeline schema bug (string outputs were forcing strict JSON parse on prose replies).
- [x] `done` — [claude-code] 2026-04-23 — Created `scripts/doctor.sh`, `download-models.sh`, `download-datasets.sh` (stub until brief is locked), `warmstart.sh`, `netproof.sh`, `cflow.mjs`.
- [x] `done` — [claude-code] 2026-04-23 — Created `benchmarks/` skeleton: `README.md`, `scenarios/_template.yaml`, design doc in [BENCHMARKS.md](BENCHMARKS.md). `harness/run.py` implementation blocks on chosen idea at kickoff.
- [ ] `todo` — H1 — decide whether to upstream a `--runtime` flag PR to `github:landigf/claudeflow` pre-kickoff (~2h) or live with the `cflow.mjs` wrapper. See [SETUP_STATUS.md](SETUP_STATUS.md) § Known gap.

### Research / context
- [ ] `todo` — AI agent — Run `pipelines/cut-the-cord/research-state-of-art.yaml` on each brainstormed direction (6 runs). Summarize into [TRACK_INTEL.md](TRACK_INTEL.md) references section.
- [ ] `todo` — AI agent — Run `pipelines/cut-the-cord/competitive-scan.yaml` for the 3 most likely directions. Merge into [COMPETITIVE_SCAN.md](COMPETITIVE_SCAN.md).
- [ ] `todo` — pitch-pair — Write three 60-second narratives (one per top-3 idea from brainstorm). Rehearse each out loud once.

### Pitch / demo prep
- [ ] `todo` — pitch-pair — Rough slide template (6 slides).
- [ ] `todo` — pitch-pair — Pick the **demo format shell** (Tauri? SwiftUI? FastAPI + Next? CLI + big terminal?) so tech-pair doesn't block on this decision.

## Kickoff-day critical path (2026-05-09, Saturday)

All tasks below reference `T = brief-reveal-time`.

- [ ] `todo` — H1 — T+0 · Capture brief verbatim into `02-specification.md`.
- [ ] `todo` — H1 — T+5 · Run `pivot-on-brief.yaml`.
- [ ] `todo` — all 4 — T+15 to T+60 · Read pivot output + vote on chosen idea.
- [ ] `todo` — all 4 — T+60 · Freeze `02-specification.md`.
- [ ] `todo` — tech-pair — T+60 to T+240 · Build skeleton that compiles + produces any output end-to-end.
- [ ] `todo` — tech-pair — T+240 · First benchmark number landed in `benchmarks/results/`.
- [ ] `todo` — pitch-pair — T+60 to T+480 · Draft pitch v1 + run `pitch-rehearsal.yaml`.

## Sunday critical path (2026-05-10)

- [ ] `todo` — tech-pair — Demo runs on both M1 and MSI Stealth in airplane mode.
- [ ] `todo` — tech-pair — Zero-egress proof (`tcpdump` / Little Snitch screenshot) checked into repo under `doc/specs/cut-the-cord/evidence/`.
- [ ] `todo` — pitch-pair — Rehearsal #3 recorded.
- [ ] `todo` — pitch-pair — Backup video exported to USB stick.
- [ ] `todo` — all 4 — T-60min · Dry-run in the venue room.
- [ ] `todo` — all 4 — Submit.

## Discovered during the weekend

_(agents: add new tasks here as they're discovered, with a one-line rationale)_

## Cost budget notes

- **Cheap runtime tasks** (default, Gemini): ideation, crew critiques, bulk text ops.
- **Deep runtime tasks** (Anthropic API, not Max sub): final verdict on chosen idea (1 run), final critique of pitch v-final (1 run), final tech review before submit (1 run). Target: ≤5 Anthropic API runs total.
- **Local runtime tasks** (Ollama): every review loop with >3 iterations, every N-file scan, every overnight critique.
- **Claude Max chat usage**: interactive pair-coding, not bulk automation. The €200 team sub is for driving; ClaudeFlow does the heavy work.
