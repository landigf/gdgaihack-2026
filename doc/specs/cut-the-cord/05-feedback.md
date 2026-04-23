# 05 — Feedback (Cut the Cord)

> Append-only. Lessons, corrections, surprising wins, surprising misses.
> Newest at the top. Never edit prior entries — add a follow-up entry that references them.

## Template

```
### YYYY-MM-DD HH:MM — <short title>
- **Context:**
- **What happened:**
- **What we're changing:**
- **Owner:** H1 / H2 / H3 / H4 / agent
- **Links:** [commit](...), [trace](...), [task](03-tasks.md#...)
```

## Entries

### 2026-04-23 20:15 · Three dry-runs landed, cost + schema fixes applied
- **Context:** First end-to-end test of the Cut-the-Cord pipeline set.
- **What happened:**
  - `pitch-rehearsal.yaml` (API path, Anthropic Sonnet): 4/4 steps, 21.8s, **$0.0117**. Output: 3 adversarial judge critiques (privacy, GTM, technical) + rewritten pitch that addressed all three without exceeding word count by more than 10%.
  - `crew-review-tech.yaml` (API path): 5/5 steps, 47.7s, **$0.0297**. Output: 4-persona technical critique + synthesis verdict.
  - `pivot-on-brief.yaml` (Max CLI path, needs Read/Glob/Grep): 6/6 steps, 284.9s, **$1.30 against Max sub** — 10–100× the analyzer's static estimate because Claude CLI runs multi-turn agentic tool use per step. Output: read-brief + verbatim ambiguities → detailed repo scan inventorying what's functional vs template → 5 ranked ideas (FieldOracle Offline for industrial/PLC engineers vs 4 alternatives) → 3-reviewer crew critique → 24h demo plan with Siemens/ABB/Rockwell scope → 30-sec pitch hook.
  - Initial schema failures: pipelines declared `output: field: string` which forced strict JSON parsing on Claude's prose reply (zero tokens, zero cost, step failed). Fix: removed `output:` declarations from text-only pipelines, switched interpolation from `{step.field}` to `{step}`. Pipelines still validate clean (warnings about "no output schema" are intentional).
- **What we're changing:** (1) `pitch-rehearsal.yaml`, `crew-review-tech.yaml`, `demo-dryrun-critique.yaml` now use plain-text output. (2) `pivot-on-brief.yaml` left untouched — it returns structured JSON via the CLI runtime which handles tool-bearing steps natively. (3) At kickoff the pivot pipeline's ~$1.30 single-run Max cost is acceptable (one call, not a loop). (4) Traces archived to [evidence/dry-runs/](evidence/dry-runs/) as reproducibility proof.
- **Owner:** H1
- **Links:** [evidence/dry-runs/pivot-on-brief-max.json](evidence/dry-runs/pivot-on-brief-max.json), [evidence/dry-runs/crew-review-tech-api.json](evidence/dry-runs/crew-review-tech-api.json), [evidence/dry-runs/pitch-rehearsal-api.json](evidence/dry-runs/pitch-rehearsal-api.json).

### 2026-04-23 19:30 · ClaudeFlow v0.1.0 gap vs CLAUDE.md claim
- **Context:** H1 installed `claudeflow` from `github:landigf/claudeflow` and ran `validate` + `analyze` on all 7 Cut-the-Cord pipelines.
- **What happened:** All pipelines validate (5 clean, 2 with harmless `tool: web` analyzer warnings). But the installed CLI only wires `ClaudeCliRuntime` — every pipeline run would spawn `claude -p` and consume the Claude Max subscription, contrary to the "ClaudeFlow is API-only" promise in CLAUDE.md / AGENTS.md. `ClaudeApiRuntime` exists in source but is not exposed via `--runtime`. It is also text-only (no Claude-CLI-native tools).
- **What we're changing:** (1) Added [SETUP_STATUS.md](SETUP_STATUS.md) documenting the gap and current health. (2) Added [scripts/cflow.mjs](../../../scripts/cflow.mjs) — a thin wrapper that runs pipelines through `ClaudeApiRuntime` (pay-per-token Anthropic API, NOT Max sub). (3) RUNBOOK.md updated with both paths (CLI path burns Max; cflow.mjs path uses API).
- **Owner:** H1
- **Links:** [SETUP_STATUS.md](SETUP_STATUS.md), [RUNBOOK.md](RUNBOOK.md), `scripts/cflow.mjs`.

### 2026-04-23 · Repo-prep kickoff (pre-hackathon)
- **Context:** Team PoliSa accepted to GDG AI HACK 2026, picked "Cut the Cord" (on-device / MSI) as first choice.
- **What happened:** Claude Code set up the `doc/specs/cut-the-cord/` playbook, AI-agent roles, benchmark plan, pitch plan, demo script template, and the ClaudeFlow pipeline slots to support both pre-kickoff research and kickoff-day pivot.
- **What we're changing:** Treat this folder as the single entry point for every AI agent joining during the hackathon.
- **Owner:** H1 (landigf)
- **Links:** initial commit on branch `main`.
