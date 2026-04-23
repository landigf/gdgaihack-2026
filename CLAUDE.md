# CLAUDE.md — GDG AI HACK 2026 repo · team **PoliSa** · track **Cut the Cord**

## ⚡ First thing any Claude instance reads

Team PoliSa is running track **"Cut the Cord"** (on-device AI, MSI sponsor).

→ **Playbook (read first): [doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md](doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md)**
→ **Task source of truth: [doc/specs/cut-the-cord/03-tasks.md](doc/specs/cut-the-cord/03-tasks.md)**
→ **Runbook (commands): [doc/specs/cut-the-cord/RUNBOOK.md](doc/specs/cut-the-cord/RUNBOOK.md)**
→ **Kickoff pivot pipeline: [pipelines/cut-the-cord/pivot-on-brief.yaml](pipelines/cut-the-cord/pivot-on-brief.yaml)**

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
- [doc/specs/cut-the-cord/](doc/specs/cut-the-cord/) — brainstorm, spec, tasks, benchmarks, pitch, demo, runbook
- [pipelines/cut-the-cord/](pipelines/cut-the-cord/) — track-specific ClaudeFlow pipelines
- [benchmarks/](benchmarks/) — on-device measurement harness (design in [BENCHMARKS.md](doc/specs/cut-the-cord/BENCHMARKS.md))
- [scripts/](scripts/) — `doctor.sh`, `download-models.sh`, `warmstart.sh`, `netproof.sh`
- [doc/claudeflow/INSIDE_CLAUDE_CODE.md](doc/claudeflow/INSIDE_CLAUDE_CODE.md) — full ClaudeFlow playbook with recipes
- [doc/claudeflow/API_KEYS.md](doc/claudeflow/API_KEYS.md) — provider selection, env vars, auto-detection order
- [explainit/hackathon.md](explainit/hackathon.md) — human-facing team onboarding
- [explainit/gdg-ai-hack-2026/README.md](explainit/gdg-ai-hack-2026/README.md) — challenge pack (Braynr / Luxonis / MSI)
- [AGENTS.md](AGENTS.md) — shared Team Kit rules for all assistants (Claude, Codex, Copilot)
