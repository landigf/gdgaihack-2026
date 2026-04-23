# ClaudeFlow Team Kit — team PoliSa · Cut the Cord

**Agent entry point:** [../doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md](../doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md).
**Task source of truth:** [../doc/specs/cut-the-cord/03-tasks.md](../doc/specs/cut-the-cord/03-tasks.md).

This repo is initialized with default preset `hackathon`.
Enabled presets: `hackathon`.

Available assistant-native commands live under `.claude/commands/`.
These commands are wrappers around the shared Team Kit lifecycle:
- brainstorm
- specification drafting
- critique
- handoff

Shared rules:
- read prior lifecycle docs before generating later ones
- keep `03-tasks.md` as the source of truth
- start with the `cheap` runtime profile unless stronger reasoning is required
- ClaudeFlow is API-only. Delegate heavy pipeline work to ClaudeFlow runs paid for by API keys instead of running them inside the chat subscription
- if Ollama is available, use the `local` profile aggressively for bulk drafting, review loops, summaries, rewrites, and intermediate code passes
- in hackathon mode, use Gemini as the main hosted path, reserve OpenAI for important research or serious second opinions, and reserve the Anthropic API (`ANTHROPIC_API_KEY`) for final reviews and final verification
