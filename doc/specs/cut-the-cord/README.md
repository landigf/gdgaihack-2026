# Cut the Cord — PoliSa workspace

Team **PoliSa** · GDG AI HACK 2026 (Milan, 8–10 May) · Track: **Cut the Cord** (on-device AI, MSI-sponsored — to be confirmed at kickoff).

> **AI agents joining this folder: read [00-TEAM_PLAYBOOK.md](00-TEAM_PLAYBOOK.md) first. Don't do anything else until you've read it.**

## Map of this folder

| File | Purpose | When to read | When to update |
|---|---|---|---|
| [00-TEAM_PLAYBOOK.md](00-TEAM_PLAYBOOK.md) | Master entry point. How agents + humans collaborate. | **Always first.** | When team process changes. |
| [SETUP_STATUS.md](SETUP_STATUS.md) | Last known health check of machines + tooling; known gaps. | Second read, especially when the toolchain acts up. | After `./scripts/doctor.sh` reveals drift. |
| [TRACK_INTEL.md](TRACK_INTEL.md) | What we know / assume about the "Cut the Cord" brief, with pivot rules. | Before proposing ideas. | When new hackathon info drops. |
| [AGENTS_ROLES.md](AGENTS_ROLES.md) | Human 2+2 split and AI-agent orchestration map. | Before picking up a task. | When roles shift. |
| [RUNBOOK.md](RUNBOOK.md) | Exact shell commands: ClaudeFlow pipelines, bench, demo. | Before running any pipeline or bench. | When a new command is added. |
| [01-brainstorm.md](01-brainstorm.md) | Six grounded idea directions. | Before writing the spec. | Once, then frozen. |
| [02-specification.md](02-specification.md) | Chosen idea → implementation-ready spec. | Before writing tasks/code. | After kickoff brief reveal. |
| [03-tasks.md](03-tasks.md) | **Source of truth** for execution status. | Every work session. | Every time a task state changes. |
| [04-implementation.md](04-implementation.md) | Implementation notes / handoff for the coding pair. | Before touching code. | As code lands. |
| [05-feedback.md](05-feedback.md) | Append-only lessons + critiques. | During retros. | Append only. |
| [BENCHMARKS.md](BENCHMARKS.md) | Metrics, datasets, harness, baseline-vs-ours protocol. | Before claiming an improvement. | When a new metric ships. |
| [PITCH_PLAN.md](PITCH_PLAN.md) | 3-minute pitch structure + rehearsal cadence. | Day 2 onwards. | After every rehearsal. |
| [DEMO_SCRIPT.md](DEMO_SCRIPT.md) | Step-by-step demo walkthrough for judges. | Before live demo. | After every dry run. |
| [COMPETITIVE_SCAN.md](COMPETITIVE_SCAN.md) | What already exists (OSS + sponsored SDKs). | Before claiming novelty. | When scan pipeline produces new output. |

## Lifecycle (strict)

`01-brainstorm.md` → `02-specification.md` → `03-tasks.md` → `04-implementation.md` → `05-feedback.md`.

Never write a later doc without having read the previous one. See [/AGENTS.md](../../../AGENTS.md) for repo-wide rules.
