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
7. In hackathon mode, use Gemini as the main hosted path, OpenAI only for important research or strong second opinions, and Claude for interactive coding plus final verification.

Runtime profiles:
- `cheap`: gemini / gemini-2.5-flash-lite
- `deep`: claude-cli / claude-sonnet-4-20250514
- `local`: ollama / auto

- Hackathon mode: keep outputs concrete, demoable, and understandable by teammates who are not computer scientists.
<!-- claudeflow-teamkit:end -->
