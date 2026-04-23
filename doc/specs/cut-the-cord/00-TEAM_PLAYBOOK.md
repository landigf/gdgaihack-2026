# 00 — Team PoliSa Playbook (AI-agent entry point)

**Read this top-to-bottom before taking any action in this folder.** It is written for AI agents (Claude Code, Codex, Copilot, ChatGPT, Cursor) and for the four humans on the team.

## TL;DR

1. We are team **PoliSa**, 4 people, building for GDG AI HACK 2026 (Milan, 8–10 May 2026) on the **Cut the Cord** track.
2. "Cut the Cord" = **on-device AI**, no cloud round-trips. The detailed brief is revealed at kickoff (2026-05-09). We prepare on the *theme*, pivot on the *brief* in hours.
3. Humans split 2+2: **two people drive pitch & narrative**, **two people drive technical build**. AI agents parallelize research, drafts, and reviews so each human operates at 2–3× leverage.
4. Bulk work (research, critiques, N-file audits, pitch rewrites) runs through **ClaudeFlow pipelines** — never inline in a chat subscription. See [../../../CLAUDE.md](../../../CLAUDE.md) and [../../../doc/claudeflow/INSIDE_CLAUDE_CODE.md](../../claudeflow/INSIDE_CLAUDE_CODE.md).
5. Every claim of improvement is backed by a **benchmark number** from [BENCHMARKS.md](BENCHMARKS.md). No unmeasured "it's faster now".

## Golden rules for AI agents in this repo

1. **Ground yourself first.** Read, in order: this file → [TRACK_INTEL.md](TRACK_INTEL.md) → [AGENTS_ROLES.md](AGENTS_ROLES.md) → [03-tasks.md](03-tasks.md). Never propose code or ideas without this context.
2. **`03-tasks.md` is the source of truth.** If you pick up work, set your task to `in-progress` with your agent name + timestamp. If you finish, mark `done` + link the artifact (commit / file / trace).
3. **One task in_progress per agent at a time.** Collisions destroy team flow.
4. **Delegate bulk work to ClaudeFlow.** If you find yourself about to read 20 files, run 10 critiques, or write 8 drafts — stop, author a pipeline under `pipelines/cut-the-cord/`, run `npx claudeflow run ...`, then summarize the trace. See [RUNBOOK.md](RUNBOOK.md).
5. **Fit output shape to the reader.** Default for humans: priority-ranked markdown table + one-line exec summary. Default for other agents: structured JSON in `traces/` + a pointer in `03-tasks.md`.
6. **Cite sources.** Any market/tech claim → link. Store the link, not a paraphrase.
7. **No secrets in committed files.** Keys live in `.env.local` only.
8. **Pivot-ready.** Nothing you write is precious. When the kickoff brief drops, we reshape in hours. Write modular, kill-your-darlings code.

## Collaboration mechanics

### Where conversations live

- **Strategic decisions + deadlines**: `03-tasks.md` (task-level) and `05-feedback.md` (post-decision retros).
- **Open questions for the team**: top of `03-tasks.md` under `## Open questions`.
- **Ephemeral chat**: Notion (if/when the user enables Notion MCP — see [AGENTS_ROLES.md](AGENTS_ROLES.md#notion-integration)).
- **Code review**: PRs against `main`. Never push to `main` without at least one human ack.

### How to introduce a new idea

1. Append it to [01-brainstorm.md](01-brainstorm.md) under `## Candidate Ideas`.
2. Run `pipelines/cut-the-cord/crew-review-tech.yaml` with `--input idea="<your summary>"`.
3. Post the synthesis back into the brainstorm doc.
4. Only if the crew says "go" → promote to [02-specification.md](02-specification.md).

### How to propose a change to the chosen direction

1. Open an entry in `05-feedback.md` with timestamp + rationale + concrete diff you're proposing.
2. Tag the humans: `@pitch-pair` or `@tech-pair`.
3. Do **not** self-merge. The pair owning that lane decides.

## What "winning" looks like for PoliSa

Judges evaluate on four axes (from [TRACK_INTEL.md](TRACK_INTEL.md)):

| Axis | Our bar | Owner lane |
|---|---|---|
| **Innovation** | Build something that doesn't exist as a 2-minute LM Studio demo. "Think outside the box." | pitch-pair |
| **Technical execution** | On-device end-to-end, measured latency + accuracy, reproducible. | tech-pair |
| **Real-world impact** | Name a user, a context where cloud fails (privacy / bandwidth / latency / cost), quantify the pain. | pitch-pair |
| **Presentation** | 3-min pitch rehearsed 5+ times by Day 2 evening. Demo that runs in airplane mode on stage. | pitch-pair |

## Hard constraints

- **All core intelligence must run on-device on the demo laptop.** Cloud is optional fallback for non-critical steps only. If the demo laptop is unplugged from Wi-Fi, the product keeps working on its main flow.
- **Demo machine = MacBook M3 Pro (user's) and/or the MSI Stealth laptop supplied by the sponsor.** Test on both. See [RUNBOOK.md](RUNBOOK.md#demo-machines).
- **Baseline-vs-ours benchmark delta must be >= 20%** on at least one primary metric. Anything less, we redesign.
- **No dependency on a service we can't air-gap in 30 minutes.** HF Hub cache → pre-downloaded. Ollama models → pulled in advance.
- **€0 burn on team Claude Max** for bulk research/review. Those go through ClaudeFlow on API keys or Ollama.

## Escalation path

- Unclear brief / unclear scope → `03-tasks.md` → `## Open questions` → humans resolve within 2 hours.
- Technical blocker → tech-pair tries 30 min, then opens a crew-review pipeline for external-perspective ideas.
- Pitch narrative blocker → pitch-pair runs `pipelines/cut-the-cord/pitch-rehearsal.yaml` with a critical judge persona.
- Broken tooling / repo state → page the primary human operator (user landigf).

## Pointers

- Repo conventions: [../../../CLAUDE.md](../../../CLAUDE.md), [../../../AGENTS.md](../../../AGENTS.md)
- ClaudeFlow inside Claude Code: [../../claudeflow/INSIDE_CLAUDE_CODE.md](../../claudeflow/INSIDE_CLAUDE_CODE.md)
- API keys / runtime selection: [../../claudeflow/API_KEYS.md](../../claudeflow/API_KEYS.md)
- Hackathon primer: [../../../explainit/hackathon.md](../../../explainit/hackathon.md)
- Challenge pack: [../../../explainit/gdg-ai-hack-2026/README.md](../../../explainit/gdg-ai-hack-2026/README.md)
