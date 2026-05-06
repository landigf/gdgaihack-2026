# AGENTS.md — GDG AI HACK 2026 repo · team PoliSa

## ⚡ First thing every agent reads

Team PoliSa is running track **"Cut the Cord"** (on-device AI, MSI). Brief reveal: **2026-05-09 11:00**.

→ **[doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md](doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md)** — entry point for ALL agents.
→ **[doc/specs/cut-the-cord/POST_BRIEF_PLAYBOOK.md](doc/specs/cut-the-cord/POST_BRIEF_PLAYBOOK.md)** — minute-by-minute 24h plan after kickoff brief reveals.
→ **[doc/specs/cut-the-cord/03-tasks.md](doc/specs/cut-the-cord/03-tasks.md)** — task source of truth.
→ **[doc/specs/cut-the-cord/AGENTS_ROLES.md](doc/specs/cut-the-cord/AGENTS_ROLES.md)** — which tool for which job.
→ **[doc/specs/cut-the-cord/PITCH_REHEARSAL_CARD.md](doc/specs/cut-the-cord/PITCH_REHEARSAL_CARD.md)** — Seed A timing card.

## State of the repo (2026-05-06 pre-kickoff)

Pre-kickoff prep is **done**: 11 ChatGPT Deep Research streams synthesized into 4 briefs in [doc/specs/cut-the-cord/research/](doc/specs/cut-the-cord/research/); 8 Ollama models pulled (incl. embeddinggemma — RAG was impossible without it); public-domain corpus (NIOSH + OSHA + CDC + 2 synthetic SOPs) indexed into 98 chunks at `benchmarks/datasets/incident-copilot/app.db`; working harness in `benchmarks/harness/run.py` produces real numbers in `benchmarks/results/latest.md`; three pitch seeds drafted (EMS / Wildland-SAR / Mining-O&G).

**macOS-Python gotcha:** stdlib `python3` (python.org build) lacks `enable_load_extension`. Use **`/opt/homebrew/bin/python3.12`** for the indexer + harness. Codex/Cursor sessions: prefer brew Python.

What's still open: idea-lock decision (Saturday brief reveal); MSI demo hardware specifics. Don't write NPU-specific code until kickoff confirms hardware.

## How to use ClaudeFlow here (read this first)

ClaudeFlow is **API-only** — it never consumes a Claude Max / Claude Code / ChatGPT subscription. Every pipeline run is paid by an API key in `.env.local` (Gemini / OpenAI / Anthropic / DeepSeek) or runs locally on Ollama.

For any bulk / parallel task (audit, review, research, critique, N-file processing):

1. Write a ClaudeFlow YAML pipeline under `pipelines/<slug>.yaml` (or reuse one in `pipelines/hackathon/`).
2. Run it with `npx claudeflow run pipelines/<slug>.yaml`. Use `--runtime ollama` for bulk local work, leave runtime off to auto-detect from env, or pin `--runtime anthropic --model claude-sonnet-4-20250514` for final-judge steps only.
3. Summarize the resulting `traces/*.json` into the shape the user asked for. Default to a priority-ranked markdown table with columns `[priority, area, finding, fix, effort]` and a 1–2 sentence executive summary on top.

Do **not** do bulk work inline in chat — that drains chat-side subscription usage for work that should be running on API keys. Post-processing pipeline output into a table is cheap and belongs in chat.

Full playbook: [doc/claudeflow/INSIDE_CLAUDE_CODE.md](doc/claudeflow/INSIDE_CLAUDE_CODE.md). Provider selection: [doc/claudeflow/API_KEYS.md](doc/claudeflow/API_KEYS.md).

<!-- claudeflow-teamkit:start -->
## ClaudeFlow Team Kit

Default preset: `hackathon`
Enabled presets: `hackathon`
Assistant surfaces: `claude, codex, copilot`

Team workflow rules:
1. For any new idea, create `doc/specs/<slug>/01-brainstorm.md` before writing implementation tasks.
2. Read earlier lifecycle docs before writing later ones. Do not write `03-tasks.md` without reading `02-specification.md`.
3. Treat `03-tasks.md` as the source of truth for execution status.
4. Keep `05-feedback.md` append-only until the team explicitly resolves an item.
5. Start with the `cheap` runtime profile for ideation and drafting. Escalate to `deep` only when the task truly needs stronger reasoning.
6. If Ollama is available, use the `local` profile aggressively for bulk drafting, review loops, summaries, rewrites, and intermediate code passes.
7. In hackathon mode, use Gemini as the main hosted path, OpenAI only for important research or strong second opinions, and the Anthropic API (not Claude Max) for final verification.
8. ClaudeFlow is API-only. Do not ask a Claude Code / Claude Max subscription to do ClaudeFlow's heavy work; export an API key for each provider you want to use and let ClaudeFlow spend that instead.

Runtime profiles:
- `cheap`: gemini / gemini-2.5-flash-lite
- `deep`: anthropic / claude-sonnet-4-20250514
- `local`: ollama / auto

- Hackathon mode: keep outputs concrete, demoable, and understandable by teammates who are not computer scientists.
<!-- claudeflow-teamkit:end -->
