# Copilot instructions — GDG AI HACK 2026 repo · team **PoliSa** · track **Cut the Cord**

## ⚡ Read first

Team PoliSa is running track **"Cut the Cord"** (on-device AI, MSI sponsor).
→ Entry point: [doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md](../doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md)
→ Tasks source of truth: [doc/specs/cut-the-cord/03-tasks.md](../doc/specs/cut-the-cord/03-tasks.md)
→ Runbook: [doc/specs/cut-the-cord/RUNBOOK.md](../doc/specs/cut-the-cord/RUNBOOK.md)

For any bulk / parallel task (audit, review, research, N-file processing): author a ClaudeFlow YAML pipeline under `pipelines/<slug>.yaml`, run it with `npx claudeflow run pipelines/<slug>.yaml`, then summarize the `traces/*.json` into the shape the user asked for (default: priority-ranked markdown table `[priority, area, finding, fix, effort]` with a 1–2 sentence exec summary on top). Do not do bulk work inline in chat.

ClaudeFlow is API-only; every run is paid by `.env.local` keys (Gemini / OpenAI / Anthropic / DeepSeek) or Ollama. It never consumes a Claude Max / ChatGPT / Copilot Chat subscription. Full playbook: [doc/claudeflow/INSIDE_CLAUDE_CODE.md](../doc/claudeflow/INSIDE_CLAUDE_CODE.md).

<!-- claudeflow-teamkit:start -->
# ClaudeFlow Team Kit

When working in this repository:

- Read `AGENTS.md` and `doc/specs/README.md` before proposing feature work.
- Use the feature lifecycle under `doc/specs/<slug>/`.
- For new feature ideas, start with `01-brainstorm.md`, then move to `02-specification.md`, then `03-tasks.md`.
- Keep proposals grounded in the current repository, not generic suggestions.
- Default to the `cheap` runtime profile for drafts and ideation.
- If Ollama is available, use the `local` profile aggressively for bulk drafting, review loops, summaries, and intermediate code passes.
- In hackathon mode, treat Gemini as the main hosted path, OpenAI as a deliberate research or second-opinion path, and the Anthropic API (`ANTHROPIC_API_KEY`, not Claude Max) as the final verification path.
- ClaudeFlow is API-only. Keep Claude Code / Copilot Chat in the driver seat for conversation and delegate pipeline work to ClaudeFlow runs so the chat subscription does not carry automation load.

Default preset: `hackathon`
Enabled presets: `hackathon`
Recommended cheap model: `gemini-2.5-flash-lite`
<!-- claudeflow-teamkit:end -->
