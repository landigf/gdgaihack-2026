# GDG AI HACK 2026 · team **PoliSa** · track **Cut the Cord**

Milan · 8–10 May 2026 · on-device AI (MSI sponsor).

👉 **Team playbook (start here): [doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md](doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md)**

- Tasks source of truth: [doc/specs/cut-the-cord/03-tasks.md](doc/specs/cut-the-cord/03-tasks.md)
- Runbook (commands): [doc/specs/cut-the-cord/RUNBOOK.md](doc/specs/cut-the-cord/RUNBOOK.md)
- Benchmarks: [doc/specs/cut-the-cord/BENCHMARKS.md](doc/specs/cut-the-cord/BENCHMARKS.md) · [benchmarks/](benchmarks/)
- Pitch & demo: [doc/specs/cut-the-cord/PITCH_PLAN.md](doc/specs/cut-the-cord/PITCH_PLAN.md) · [DEMO_SCRIPT.md](doc/specs/cut-the-cord/DEMO_SCRIPT.md)
- Kickoff pivot pipeline: [pipelines/cut-the-cord/pivot-on-brief.yaml](pipelines/cut-the-cord/pivot-on-brief.yaml)

Every AI agent joining: read [CLAUDE.md](CLAUDE.md) + [AGENTS.md](AGENTS.md) + the playbook above before acting.

---

<!-- claudeflow-teamkit-readme:start -->
## ClaudeFlow Team Kit

This repository is prepared to work with ClaudeFlow as a structured collaboration layer for humans plus assistants.

Start here:
1. Read `AGENTS.md`.
2. Read `explainit/README.md` and the relevant use-case file.
3. Use `doc/specs/<slug>/` for idea -> spec -> tasks -> implementation -> feedback.

Recommended runtime path:
- `cheap`: gemini / gemini-2.5-flash-lite
- `deep`: anthropic / claude-sonnet-4-20250514
- `local`: ollama / auto

Teammates should start with `cheap` unless the task clearly needs deeper reasoning or a private local run.
ClaudeFlow is API-only. It never uses a Claude Max / Claude Code subscription — every run is billed to one of your API keys or runs locally on Ollama.

Hackathon operating mode:
- Use local Ollama aggressively for bulk drafting, review loops, summaries, rewrites, and intermediate code passes.
- Use Gemini as the main hosted path for most structured requests.
- Use OpenAI only when you want important research or a serious second opinion.
- Use the Anthropic API (`ANTHROPIC_API_KEY`) for final review and final verification runs. Keep Claude Code / Claude Max for conversational pair work, not for bulk pipeline runs.
<!-- claudeflow-teamkit-readme:end -->
