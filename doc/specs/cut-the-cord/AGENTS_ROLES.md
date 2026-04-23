# AGENTS_ROLES — who does what (humans + AI agents)

## Human roster (4 people, team PoliSa)

| Slot | Lane | Primary responsibility | Tool-chain | Backup for |
|---|---|---|---|---|
| H1 (owner / user `landigf`) | **tech-lead** | Architecture, runtime choice, demo-machine setup, Claude Code driver. | Claude Code (Max), ClaudeFlow pipelines, Ollama. | H2 |
| H2 | **tech-builder** | Feature code, benchmark harness, local runtime glue. | Codex / Copilot / Cursor. | H1 |
| H3 | **pitch-lead** | Story, slides, stage presence, Q&A prep. | ChatGPT Pro (user's second sub), Gemini. | H4 |
| H4 | **pitch-designer** | Visual demo, UI polish, recording backup-video, timing. | Figma / Canva, ChatGPT, local LLM for copy. | H3 |

Pairs cross-review each other's artifacts at every milestone (see [PITCH_PLAN.md](PITCH_PLAN.md) milestones).

**Assignment is not fixed.** At kickoff we may swap H2↔H4 if the winning idea is more UX-heavy than code-heavy, or more code-heavy than narrative-heavy. Source of truth: first cell of `03-tasks.md`.

## Cadence

| Moment | Action | Who drives | Duration |
|---|---|---|---|
| Pre-kickoff (Friday evening 2026-05-08) | Harness smoke-test, models pre-pulled, pivot pipeline dry-run. | H1 | 2h |
| Brief reveal + 15min | `pivot-on-brief.yaml` run. | H1 | 15min |
| Brief + 60min | Idea locked. `02-specification.md` frozen. | all 4 | decision |
| Brief + 4h | Skeleton compiles + first bench number. | tech-pair | — |
| Brief + 8h | First pitch read-through. | pitch-pair | 20min |
| Brief + 12h (Saturday evening) | Demo end-to-end runnable on one machine. | tech-pair | gate |
| Brief + 18h (Sunday morning) | Demo runnable on both machines, airplane mode. | tech-pair | gate |
| Brief + 22h | Pitch rehearsal #3 (timed, recorded). | pitch-pair | 30min |
| Brief + 24h | Final sync, submit. | all 4 | — |

## AI-agent roster

Agents are tools, not teammates — but they run in parallel and need roles so they don't trip over each other.

| Agent | Where it lives | What it's best at | Budget rule |
|---|---|---|---|
| **Claude Code (Max)** | H1's terminal | Navigating repo, driving ClaudeFlow, reading results, pair-coding. | No bulk loops. Delegate N-step loops to ClaudeFlow. |
| **Claude Code sub-agents** (Explore, Plan, general-purpose) | Spawned from Claude Code | Parallelizing *reads* and *research* that must not pollute main context. | Use for expensive research sweeps, multi-file audits. |
| **ClaudeFlow Gemini** (`--runtime gemini`) | Pipelines (default) | Structured drafts, idea generation, summaries, pitch polish drafts. | Default. Free-ish via Gemini free tier. |
| **ClaudeFlow Ollama** (`--runtime ollama`) | Pipelines, M3 Pro local | Bulk drafts, rewrites, intermediate code passes, low-stakes crews. | Default for anything running ≥5 steps. |
| **ClaudeFlow OpenAI** (`--runtime openai`) | Pipelines, opt-in | Serious-second-opinion research. | Reserved; use for named research asks. |
| **ClaudeFlow Anthropic API** (`--runtime anthropic`) | Pipelines, final-pass | Final critique, final verify, last-mile judgment. | Only final gates. Pay-per-token; NOT the Claude Max sub. |
| **ChatGPT Pro** (H3's sub) | Browser | Narrative polish, analogies, audience-facing copy. | Pitch-pair only. Do not use for code. |
| **Codex / Copilot** (H2's editor) | VS Code | IDE-line autocomplete, boilerplate, test stubs. | Tech-pair only. |

### Rule of thumb — "which agent for this task"

```
is this a one-off conversation / pair-code moment?
  → Claude Code (H1) or ChatGPT (H3)

is it a loop over N files / N ideas / N critiques?
  → ClaudeFlow pipeline under pipelines/cut-the-cord/
  → runtime = ollama (bulk) or gemini (default) or anthropic (final)

is it research with source links mattering?
  → ClaudeFlow with `tool: web` step, or Claude Code sub-agent with WebFetch

is it a final quality gate?
  → ClaudeFlow --runtime anthropic --model claude-sonnet-4-20250514
```

## Collaboration hygiene

1. **One agent, one task.** If Claude Code is editing `src/a.ts`, Codex doesn't also edit it. Coordinate through `03-tasks.md`.
2. **Pipelines are idempotent and traceable.** Every pipeline run writes to `pipelines/traces/`. Reference the trace path in the task entry.
3. **Humans make the final call on the chosen idea.** Agents propose, judges dispose, but only humans promote from brainstorm → spec.
4. **Pitch-pair and tech-pair cross-review** at every milestone in the cadence table. Each side's work must survive the other's critique.
5. **Do not paste long model output into chat.** Save it to the right doc. Link the doc. Then discuss.

## Notion integration (when it becomes available)

The user expects Notion Plus + Notion MCP during the hackathon. When it arrives:

- **Index page**: "PoliSa / GDG AI HACK 2026 / Cut the Cord".
- **Mirror rule**: repo `doc/specs/cut-the-cord/` is source of truth; Notion page is a read-view for non-dev teammates / mentors. Mirror on major milestones, not continuously.
- **MCP tools**: use only for `search_pages`, `append_block`, `create_page` — never for writing canonical spec text. That stays in the repo.
- Update the corresponding entry in [RUNBOOK.md](RUNBOOK.md) once MCP is wired.

## Secrets & accounts

- Claude Max seats (team): H1, H2, H3, H4 share one subscription (€200/mo). User's personal Pro covers overflow.
- API keys in `.env.local` only. Never in the repo. Share through a password manager or private DM.
- Gemini free tier is the default bulk runtime.
- MSI and other sponsors may give per-event credits — document them here on Day-0 once announced.
