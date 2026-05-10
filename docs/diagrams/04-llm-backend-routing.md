# 04 — LLM Backend Routing

Houston picks its LLM runtime at startup based on `LLM_BACKEND` env
var. **One** path is text-only with a fast Apple-Silicon route;
**vision** always falls through to Ollama because MLX-LM doesn't
take images in our current setup.

```mermaid
flowchart TB
    START([Sidecar startup<br/>main.py lifespan])
    READENV{{LLM_BACKEND env<br/>auto / mlx / ollama}}

    TRYMLX{Try import mlx_lm<br/>+ load Qwen2.5-3B<br/>4bit weights}
    MLXOK[MLXClient ready<br/>state.generator = MLXClient]
    MLXFAIL[ImportError or<br/>load failure]

    OLLOK[OllamaClient ready<br/>state.generator = OllamaClient]
    EMB[OllamaClient always<br/>state.embedder = OllamaClient<br/>nomic-embed-text]

    START --> READENV
    READENV -->|backend = mlx| TRYMLX
    READENV -->|backend = auto<br/>and arm64 darwin| TRYMLX
    READENV -->|backend = ollama| OLLOK
    READENV -->|backend = auto<br/>and not arm64| OLLOK

    TRYMLX -->|success| MLXOK
    TRYMLX -->|fail| MLXFAIL
    MLXFAIL --> OLLOK

    START --> EMB

    classDef good fill:#064e3b,stroke:#34d399,color:#d1fae5
    classDef bad fill:#7f1d1d,stroke:#f87171,color:#fee2e2
    class MLXOK,OLLOK,EMB good
    class MLXFAIL bad
```

## Per-request dispatch

Once the sidecar is up, `state.generator` holds whichever client
won the boot race. Every text endpoint routes through it. **Vision
is the exception** — image describe always uses
`state.embedder` (the OllamaClient instance) regardless of
`LLM_BACKEND`.

```mermaid
flowchart LR
    REQ[/POST /summarize<br/>or /summarize/stream/]

    CHK{is_image_path?}
    TEXT[state.generator.generate<br/>text-only LLM]
    IMG["state.embedder.generate<br/>(OllamaClient)<br/>+ model=VISION_MODEL<br/>+ images=[base64]"]

    REQ --> CHK
    CHK -->|.png .jpg .webp …| IMG
    CHK -->|all other ext| TEXT

    classDef vision fill:#312e81,stroke:#a78bfa,color:#ede9fe
    classDef txt fill:#1e3a8a,stroke:#60a5fa,color:#dbeafe
    class IMG vision
    class TEXT txt
```

## Why MLX as primary on Apple Silicon?

| Metric | Ollama gemma4 | MLX-LM Qwen2.5-3B-4bit |
|---|---|---|
| Process model | Separate daemon, HTTP/JSON | In-process, Python objects |
| Cold start | ~3 s (already loaded) | ~800 ms |
| Tokens/sec | ~25 t/s | ~60 t/s |
| Quantization | Q4_K_M (gemma4 default) | 4-bit native MLX |
| Vision | ✅ multimodal | ❌ text-only |

MLX is faster on text. Ollama is the fallback **and** the only path
for vision. The `state.generator` / `state.embedder` split lets us
mix-and-match without leaking runtime details into endpoint
handlers.

## Why `auto` is the default?

Hackathon judges may run the demo on Intel Macs, on Linux, on
machines without `mlx_lm` pip-installed. `auto` tries MLX, swallows
any `ImportError` or weight-load error, falls back to Ollama, logs
which backend won. **No hand-holding, no manual config.**
