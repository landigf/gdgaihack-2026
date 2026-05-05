# API keys and runtime selection

ClaudeFlow is **API-only**. It never consumes a Claude Max or Claude Code subscription. Every step in every pipeline is billed to an API key you export, or runs locally on Ollama.

This page explains which key to set, how auto-detection works, and what to buy first.

## The short version

1. Export at least one API key (or point `OLLAMA_BASE_URL` at a local server).
2. Run `npx claudeflow run pipeline.yaml` — a provider is picked automatically.
3. Override with `--runtime <name>` or `CLAUDEFLOW_RUNTIME=<name>` when you want to pin one.

## Supported providers

| Provider | Runtime class | Key env var | Default base URL | Typical model |
|---|---|---|---|---|
| OpenAI | `OpenAICompatibleRuntime` | `OPENAI_API_KEY` | `https://api.openai.com/v1` | `gpt-5-mini` |
| Google Gemini | `OpenAICompatibleRuntime` | `GEMINI_API_KEY` | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash-lite` |
| Anthropic | `ClaudeApiRuntime` | `ANTHROPIC_API_KEY` | `https://api.anthropic.com` | `claude-sonnet-4-20250514` |
| DeepSeek | `OpenAICompatibleRuntime` | `DEEPSEEK_API_KEY` | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Generic OpenAI-compatible | `OpenAICompatibleRuntime` | `OPENAI_COMPATIBLE_API_KEY` | `OPENAI_COMPATIBLE_BASE_URL` | your model |
| Local Ollama | `OllamaRuntime` | _none_ | `http://127.0.0.1:11434/v1` | `auto` |

## How auto-detection works

`createRuntime()` resolves the provider in this order:

1. `options.provider` passed to `createRuntime({ provider: ... })`
2. `CLAUDEFLOW_RUNTIME` env var
3. First API key present, in this order:
   - `OPENAI_API_KEY` → `openai`
   - `GEMINI_API_KEY` → `gemini`
   - `ANTHROPIC_API_KEY` → `anthropic`
   - `DEEPSEEK_API_KEY` → `deepseek`
   - `OPENAI_COMPATIBLE_API_KEY` → `openai-compatible`
   - `OLLAMA_BASE_URL` → `ollama`
4. If nothing matches, throws a clear "set an API key" error.

So the simplest setup is: export one key, never touch the `--runtime` flag.

You can inspect the auto-detection result programmatically:

```typescript
import { detectProviderFromEnv } from "claudeflow";
console.log(detectProviderFromEnv()); // "openai" | "gemini" | "anthropic" | ...
```

## Per-step model override

The auto-detected provider applies to the whole pipeline, but any step can pin its own model:

```yaml
- id: cheap-draft
  prompt: "Draft..."
  model: gpt-5-nano          # forces a cheaper model for this step
- id: final-verdict
  prompt: "Review this: {cheap-draft.text}"
  model: claude-sonnet-4-20250514   # stronger model for the final pass
```

The step-level `model` is sent to whichever runtime is active — it does not switch providers. If you need cross-provider routing, run two pipelines or instantiate two runtimes in TypeScript.

## What to buy first

- **Hackathons and sponsor-backed events.** Use local Ollama for bulk work. Use Gemini (`GEMINI_API_KEY`) as the main hosted path. Add `ANTHROPIC_API_KEY` only for final verification runs.
- **Individual daily automation.** `OPENAI_API_KEY` with `gpt-5-mini` is the best single spend for most nightly/weekly workflows.
- **Privacy-heavy workflows.** Ollama first, then `deepseek-chat` as a cheap hosted option, then `gpt-5-mini` as fallback.
- **Final-judge-only spend.** `ANTHROPIC_API_KEY` with `claude-sonnet-4` or `claude-haiku-4-5` is a strong last-step reviewer that does not require a Claude subscription.

## Using ClaudeFlow from inside a chat assistant

The whole point of the "API-only" policy is that you can still be chatting with Claude Code, ChatGPT, Copilot Chat, or Cursor, ask the assistant to run a ClaudeFlow pipeline, and have that pipeline execute against **its own** API keys — not the chat subscription you are currently using.

Example conversation with Claude Code:

> You: "Write and run a ClaudeFlow pipeline that surveys the repo, finds the three most important refactor opportunities, and returns a priority-ranked table."

The assistant writes `pipelines/refactor-survey.yaml`, runs it with `npx claudeflow run`, and the run is billed to `GEMINI_API_KEY` / `OPENAI_API_KEY` / etc. — you do not spend Claude Max usage on the bulk worker passes.

See [INSIDE_CLAUDE_CODE.md](INSIDE_CLAUDE_CODE.md) for the full playbook, including how to ask the assistant to post-process the pipeline output into the table/report shape you actually want.

## Troubleshooting

- **`ClaudeFlow: no runtime provider could be selected`** — no API key was found. Export one (see the table above) or set `OLLAMA_BASE_URL`.
- **`Missing API key. Set OPENAI_API_KEY ...`** — you pinned a provider that has no key configured. Either unset `CLAUDEFLOW_RUNTIME` or export the requested key.
- **Anthropic 401** — check `ANTHROPIC_API_KEY` is a **console API key**, not a Claude Max subscription token. The Max subscription can't be used by ClaudeFlow.
