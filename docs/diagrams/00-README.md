# Houston — Architecture Diagrams

Mermaid source for every architectural slice of Houston, the offline AI
file assistant we built for the **GDG AI Hack Milano 2026 — "Cut the
Cord"** track.

Every `.md` here is one diagram with a brief caption. Read in order if
you want the bottom-up tour; jump anywhere if you want a specific
subsystem.

| # | File | What it shows |
|---|------|---------------|
| 01 | [`01-system-overview.md`](./01-system-overview.md) | Tauri shell ↔ webview ↔ Python sidecar ↔ Ollama / MLX-LM / FAISS / filesystem |
| 02 | [`02-rag-pipeline.md`](./02-rag-pipeline.md) | RAG index + search flows (parse → chunk → embed → FAISS → retrieve) |
| 03 | [`03-multi-agent-personas.md`](./03-multi-agent-personas.md) | Shared `HOUSTON_PREFIX` across 5 personas → KV-cache reuse |
| 04 | [`04-llm-backend-routing.md`](./04-llm-backend-routing.md) | `LLM_BACKEND=auto/mlx/ollama` selection + vision-only routing |
| 05 | [`05-streaming-sse.md`](./05-streaming-sse.md) | Sequence diagram for `/summarize/stream` (SSE, token-by-token) |
| 06 | [`06-file-type-routing.md`](./06-file-type-routing.md) | Extension → reader → persona dispatch table |
| 07 | [`07-state-persistence.md`](./07-state-persistence.md) | `state.json` history, FAISS sidecar, localStorage favorites |
| 08 | [`08-frontend-components.md`](./08-frontend-components.md) | React component tree + data ownership |
| 09 | [`09-vision-pipeline.md`](./09-vision-pipeline.md) | Image describe path: base64 → multimodal Ollama → bullets |

All diagrams render natively on GitHub. To preview locally:

```bash
npx -y @mermaid-js/mermaid-cli@latest -i 01-system-overview.md -o /tmp/01.svg
```
