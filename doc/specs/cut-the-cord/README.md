# Cut the Cord — PoliSa workspace

Team **PoliSa** · GDG AI HACK 2026 (Milan, 8–10 May) · Track: **Cut the Cord** (on-device AI, MSI-sponsored — to be confirmed at kickoff).

> **AI agents joining this folder: read [00-TEAM_PLAYBOOK.md](00-TEAM_PLAYBOOK.md) first. Don't do anything else until you've read it.**

## Map of this folder

| File | Purpose | When to read | When to update |
|---|---|---|---|
| [00-TEAM_PLAYBOOK.md](00-TEAM_PLAYBOOK.md) | Master entry point. How agents + humans collaborate. | **Always first.** | When team process changes. |
| **[POST_BRIEF_PLAYBOOK.md](POST_BRIEF_PLAYBOOK.md)** | **Minute-by-minute 24h plan after Saturday brief reveal.** | At kickoff (Sat 11:00). | After kickoff retro. |
| [SETUP_STATUS.md](SETUP_STATUS.md) | Last known health check of machines + tooling; known gaps. | Second read, especially when the toolchain acts up. | After `./scripts/doctor.sh` reveals drift. |
| [TRACK_INTEL.md](TRACK_INTEL.md) | Event facts + regulatory tailwinds + 2026 stack readiness. | Before proposing ideas. | When new hackathon info drops. |
| [AGENTS_ROLES.md](AGENTS_ROLES.md) | Human 2+2 split and AI-agent orchestration map. | Before picking up a task. | When roles shift. |
| [RUNBOOK.md](RUNBOOK.md) | Exact shell commands: ClaudeFlow pipelines, bench, demo. | Before running any pipeline or bench. | When a new command is added. |
| [01-brainstorm.md](01-brainstorm.md) | Six grounded idea directions + research-surfaced amendments + displacement scorecard. | Before writing the spec. | Frozen at kickoff. |
| [02-specification.md](02-specification.md) | Chosen idea → implementation-ready spec. | Before writing tasks/code. | At kickoff brief reveal. |
| [03-tasks.md](03-tasks.md) | **Source of truth** for execution status. | Every work session. | Every time a task state changes. |
| [04-implementation.md](04-implementation.md) | Implementation notes / handoff for the coding pair. | Before touching code. | As code lands. |
| [05-feedback.md](05-feedback.md) | Append-only lessons + critiques. | During retros. | Append only. |
| [BENCHMARKS.md](BENCHMARKS.md) | Metrics, datasets, harness, baseline-vs-ours protocol. | Before claiming an improvement. | When a new metric ships. |
| [PITCH_PLAN.md](PITCH_PLAN.md) | 3-minute pitch structure + 3 pitch seeds + Q&A defense + side-challenge stacking. | Day 2 onwards. | After every rehearsal. |
| **[PITCH_REHEARSAL_CARD.md](PITCH_REHEARSAL_CARD.md)** | **Seed A timing card with mute-beat callouts; tape it to your laptop.** | Day 0 evening. | Replace `<fill>` numbers at T-2h before pitch. |
| [DEMO_SCRIPT.md](DEMO_SCRIPT.md) | Step-by-step demo walkthrough for judges. | Before live demo. | After every dry run. |
| [COMPETITIVE_SCAN.md](COMPETITIVE_SCAN.md) | Horizontal landscape + dangerous-jobs vertical (38 named players). | Before claiming novelty. | When scan pipeline produces new output. |
| [DEEP_RESEARCH_PROMPTS.md](DEEP_RESEARCH_PROMPTS.md) | 11 ChatGPT Deep Research prompts (run by Codex 2026-05-06). | If you need to refresh research post-kickoff. | When the brief reveals an unexpected vertical. |
| [CODEX_VSCODE_PROMPT.md](CODEX_VSCODE_PROMPT.md) | Single-shot Codex scout prompt (already run; produced [research/syntheses/codex-scout-2026-05-06.md](research/syntheses/codex-scout-2026-05-06.md)). | If a fresh scout is needed. | n/a |
| [CODEX_POST_DR_PROMPTS.md](CODEX_POST_DR_PROMPTS.md) | Three Codex prompts to run after DR reports land in `research/inbox/`. Most are now redundant (Claude syntheses cover them) — see [POST_BRIEF_PLAYBOOK.md](POST_BRIEF_PLAYBOOK.md) §"Codex prompts queued for after-brief" for what's still useful. | Selectively, post-kickoff. | n/a |
| [RESEARCH_INTAKE.md](RESEARCH_INTAKE.md) | Research-intake format + confirmed event facts (Codex-verified). | If you join the team mid-stream. | When a new research drop comes in. |
| [research/](research/) | The full pre-kickoff evidence bundle: 11 raw DR reports in `inbox/` + 4 synthesis briefs in `syntheses/`. | When you need a citation. | When new research lands. |

## Lifecycle (strict)

`01-brainstorm.md` → `02-specification.md` → `03-tasks.md` → `04-implementation.md` → `05-feedback.md`.

Never write a later doc without having read the previous one. See [/AGENTS.md](../../../AGENTS.md) for repo-wide rules.
