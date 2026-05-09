# CLAUDE.md — GDG AI HACK 2026 repo · team **PoliSa** · track **Cut the Cord**

## ⚡ First thing any Claude instance reads

Team PoliSa is running track **"Cut the Cord"** (on-device AI, MSI sponsor). Brief reveal: **2026-05-09 11:00**.

→ **Playbook (read first): [doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md](doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md)**
→ **Post-brief 24h plan: [doc/specs/cut-the-cord/POST_BRIEF_PLAYBOOK.md](doc/specs/cut-the-cord/POST_BRIEF_PLAYBOOK.md)** — what to run minute-by-minute after kickoff
→ **Task source of truth: [doc/specs/cut-the-cord/03-tasks.md](doc/specs/cut-the-cord/03-tasks.md)**
→ **Runbook (commands): [doc/specs/cut-the-cord/RUNBOOK.md](doc/specs/cut-the-cord/RUNBOOK.md)**
→ **Pitch rehearsal card: [doc/specs/cut-the-cord/PITCH_REHEARSAL_CARD.md](doc/specs/cut-the-cord/PITCH_REHEARSAL_CARD.md)**
→ **Kickoff pivot pipeline: [pipelines/cut-the-cord/pivot-on-brief.yaml](pipelines/cut-the-cord/pivot-on-brief.yaml)**

## State of the repo (2026-05-09 post-brief)

**Brief revealed at kickoff Saturday 11:00.** Verbatim brief locked into [02-specification.md](doc/specs/cut-the-cord/02-specification.md). Plan that drives the next 24h: `~/.claude/plans/at-the-end-we-ll-lucky-zebra.md`.

### Big deltas vs pre-kickoff assumptions

1. **Judging weights are NOT equal axes.** Actual: Tech Optimization 30% · Practical Utility 25% · Creative On-Device 25% · Competitive Advantage 20%. Pitch beats re-allocated in [PITCH_PLAN.md](doc/specs/cut-the-cord/PITCH_PLAN.md).
2. **OS / desktop / files integration is MANDATORY.** Brief: *"the AI cannot be an isolated terminal chatbot"*. A pure Streamlit web UI risks disqualifier. **MCP server + filesystem tools** are the keystone for Creative On-Device 25%.
3. **Brief explicitly names models we hadn't pulled:** Gemma 3, gpt-oss-20b, MedGemma, Devstral Small 2, Llama 3.1, Phi-4, Mistral Small. `scripts/download-models.sh` extended; pulls happen on-demand per-vertical.
4. **Form factor pivots from wearable to control-room desktop.** Same dangerous-jobs anchor; EdgeXpert sits on the operator's desk, not in their pocket. Pitch Seed B (Wildland-SAR) is OUT (no laptop in a wildland fire). Seeds A (EMS dispatch) and C (Mining/O&G control room) survive.

### Vertical decision: STILL OPEN

Locked at T+90min team huddle. Four candidates re-scored on actual weights in [01-brainstorm.md](doc/specs/cut-the-cord/01-brainstorm.md) §"Brief-conditional re-scoring (2026-05-09)":

| # | Candidate | Weighted /3.00 | Recommended? |
|---|---|---:|---|
| 1 | Control-Room Copilot | 3.00 | **Yes (default)** — max pre-work reuse |
| 2 | Enterprise Doc Copilot | 2.50 | If team disconnects from dangerous-jobs anchor |
| 3 | MedGemma Clinic Copilot | 2.75 | Brief NAMES MedGemma; strong fallback |
| 4 | Devstral Coding Navigator | 2.55 | Highest 24h build risk, full corpus rebuild |

### What still works from pre-kickoff prep

- 98-chunk corpus indexed at `benchmarks/datasets/incident-copilot/app.db`
- Hybrid retrieval stack at [src/airgap/](src/airgap/)
- Benchmark harness at [benchmarks/harness/](benchmarks/harness/) — Tech Opt 30% means this matters MORE, not less
- 11 DR reports + 4 syntheses in [doc/specs/cut-the-cord/research/](doc/specs/cut-the-cord/research/)
- Regulatory-moat sentences in [TRACK_INTEL.md](doc/specs/cut-the-cord/TRACK_INTEL.md) — still useful but only worth 20% now
- 3 pitch seeds (Seed B retired; A and C survive with desk-form-factor edits)

### Still to do (from post-brief plan)

- 4 fresh DRs (12-15) targeting MCP / gpt-oss-20b / MedGemma+Devstral / industrial-safety VLM
- Codex tasks: brief-sync synthesis, MCP server (`src/airgap/mcp_server.py`), models-tier-fit memo
- Phase B feasibility probes + team huddle at T+90
- Phase C build (depends on lock): scenarios, desktop UI shell, multimodal pipeline

**Important macOS-Python gotcha (still in effect):** stdlib `python3` (python.org build) does NOT support `enable_load_extension`, which sqlite-vec needs. Use `/opt/homebrew/bin/python3.12` (or any brew Python) for the indexer + harness.

**Standing rule from user (2026-05-09):** ALWAYS `git fetch && git pull` at the start of every session in this repo. Multi-teammate collaboration through GitHub during the hackathon. Saved as feedback memory.

## How to use ClaudeFlow here (read this first)

This repo runs **ClaudeFlow** as its automation layer. ClaudeFlow is **API-only** — it never consumes Claude Max / Claude Code subscription usage. Every pipeline run is billed to one of the API keys in `.env.local` (Gemini / OpenAI / Anthropic / DeepSeek) or runs locally on Ollama.

**Default operating pattern:**

> Read [doc/claudeflow/INSIDE_CLAUDE_CODE.md](doc/claudeflow/INSIDE_CLAUDE_CODE.md) and follow that pattern for everything in this repo.

For any bulk or parallel task the user asks for (audit, review, research, critique, reformatting N files, etc.):

1. **Write** a ClaudeFlow YAML pipeline under `pipelines/<slug>.yaml`. If a suitable one already exists under `pipelines/hackathon/` or `pipelines/hackathon/tracks/`, use it.
2. **Run** it with `npx claudeflow run pipelines/<slug>.yaml` (add `--runtime ollama` for bulk local work; leave it empty to auto-detect from env vars; use `--runtime anthropic --model claude-sonnet-4-20250514` only for final-judge steps).
3. **Summarize** the resulting `traces/*.json` (or the stdout) into the exact shape the user asked for. Default shape when they don't specify:
   - a priority-ranked markdown table with columns `[priority, area, finding, fix, effort]`
   - a 1–2 sentence executive summary on top
   - no raw dump of the pipeline output

**Do not** do the bulk work inline in chat — that burns Claude Max / Claude Code usage for work that should be running on API keys. Post-processing the pipeline's output into a table is cheap and belongs in chat.

## Which runtime to pick

- **Bulk drafting / summaries / rewrites / intermediate code passes** → `--runtime ollama` (free once installed)
- **Structured JSON, medium-quality, most teammate requests** → leave `--runtime` off, auto-detects Gemini from `GEMINI_API_KEY`
- **Important research or strong second opinion** → `--runtime openai --model gpt-5-mini`
- **Final review, last-mile verdict, critical code audit** → `--runtime anthropic --model claude-sonnet-4-20250514` (pay-per-token, NOT the Claude Max subscription)

## Lifecycle rules

- New feature → `doc/specs/<slug>/01-brainstorm.md` → `02-specification.md` → `03-tasks.md` → `04-implementation.md` → `05-feedback.md`
- `03-tasks.md` is the source of truth for execution status
- Never paste API keys into committed files; they live only in `.env.local`

## Where to learn more

- **[doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md](doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md) — PoliSa team playbook (AI-agent entry point)**
- **[doc/specs/cut-the-cord/POST_BRIEF_PLAYBOOK.md](doc/specs/cut-the-cord/POST_BRIEF_PLAYBOOK.md) — minute-by-minute 24h plan after kickoff brief reveals**
- [doc/specs/cut-the-cord/](doc/specs/cut-the-cord/) — brainstorm, spec, tasks, benchmarks, pitch, demo, runbook
- [doc/specs/cut-the-cord/research/](doc/specs/cut-the-cord/research/) — 11 DR reports (`inbox/`) + 4 syntheses (`syntheses/`); the dangerous-jobs evidence bundle
- [pipelines/cut-the-cord/](pipelines/cut-the-cord/) — track-specific ClaudeFlow pipelines
- [benchmarks/](benchmarks/) — on-device measurement harness ([BENCHMARKS.md](doc/specs/cut-the-cord/BENCHMARKS.md) for design; `scenarios/incident-copilot.yaml` for the 6 core scenarios; `results/latest.md` for the headline numbers)
- [src/airgap/](src/airgap/) — Python retrieval+LLM stack: `index.py` (SQLite+FTS5+sqlite-vec), `retrieve.py` (hybrid+RRF), `llm.py` (Ollama HTTP w/ zero-cloud guards), `prompt.py` (citation-bound JSON contract)
- [scripts/](scripts/) — `doctor.sh`, `download-models.sh`, `download-datasets.sh`, `warmstart.sh`, `netproof.sh`, `cflow.mjs`
- [doc/claudeflow/INSIDE_CLAUDE_CODE.md](doc/claudeflow/INSIDE_CLAUDE_CODE.md) — full ClaudeFlow playbook with recipes
- [doc/claudeflow/API_KEYS.md](doc/claudeflow/API_KEYS.md) — provider selection, env vars, auto-detection order
- [explainit/hackathon.md](explainit/hackathon.md) — human-facing team onboarding
- [explainit/gdg-ai-hack-2026/README.md](explainit/gdg-ai-hack-2026/README.md) — challenge pack (Braynr / Luxonis / MSI)
- [AGENTS.md](AGENTS.md) — shared Team Kit rules for all assistants (Claude, Codex, Copilot)

## How to run the harness (any teammate, any machine)

```bash
# 0. one-time: install brew Python deps (needed because stdlib Python on macOS
#              python.org builds doesn't support sqlite extension loading)
/opt/homebrew/bin/python3.12 -m pip install --user --break-system-packages \
    pyyaml sqlite-vec PyMuPDF beautifulsoup4

# 1. ensure ollama is running and models are pulled
ollama serve &                 # if not already running
bash scripts/download-models.sh

# 2. fetch the public-domain corpus (idempotent; ~50 MB)
bash scripts/download-datasets.sh

# 3. index it
/opt/homebrew/bin/python3.12 -m src.airgap.index \
    --db benchmarks/datasets/incident-copilot/app.db

# 4. run the harness (real LLM mode)
/opt/homebrew/bin/python3.12 -m benchmarks.harness.run \
    --scenario benchmarks/scenarios/incident-copilot.yaml \
    --systems baseline_v0,ours_v4 --runs 3 --llm-model gemma3:4b
```

If Ollama isn't reachable, the harness falls back to mock mode automatically and tags the results so you know which numbers to re-run later.
