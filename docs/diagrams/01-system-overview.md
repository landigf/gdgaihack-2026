# 01 — System Overview

Houston is a **three-process** desktop app — everything stays on the
user's Mac. No daemon ever opens an outbound socket.

- **Tauri shell** (Rust) — owns the native window, the macOS
  traffic-light chrome, and the WebKit webview. Spawns the sidecar.
- **Python sidecar** (FastAPI on `127.0.0.1:8765`) — does parsing,
  embedding, FAISS retrieval, and LLM orchestration.
- **Ollama** (`127.0.0.1:11434`) — runs `gemma4` (multimodal, vision)
  and `nomic-embed-text` (768-dim embeddings).
- **MLX-LM** (in-process, optional) — Apple Silicon inference path
  using `Qwen2.5-3B-Instruct-4bit`. Auto-falls-back to Ollama if
  unavailable.

```mermaid
flowchart TB
    subgraph Mac["macOS — single user, fully offline"]
        subgraph TauriProc["Tauri shell process (Rust)"]
            Win[NSWindow + traffic lights<br/>titleBarStyle: Overlay]
            WV[WebKit webview<br/>React 18 + Vite + Tailwind]
            Win --- WV
        end

        subgraph SidecarProc["Python sidecar — uvicorn :8765"]
            API[FastAPI app<br/>main.py]
            STATE[(in-memory state<br/>OllamaClient,<br/>MLXClient?,<br/>FaissIndex)]
            PARSE[parsing.py<br/>pdf/docx/xlsx/code/img]
            INDEX[indexer.py]
            API --- STATE
            API --- PARSE
            API --- INDEX
        end

        subgraph Models["Local model runtimes"]
            OLL[Ollama :11434<br/>gemma4 + nomic-embed-text]
            MLX["MLX-LM in-process<br/>Qwen2.5-3B-Instruct-4bit<br/>(Apple Silicon only)"]
        end

        FS[(User filesystem<br/>~/Documents, ~/Downloads, …)]
        DISK[(~/.houston/<br/>state.json,<br/>faiss.index,<br/>chunks.json)]
    end

    WV -->|HTTP fetch + SSE<br/>localhost only| API
    TauriProc -.->|spawns + supervises| SidecarProc

    API -->|REST: /api/embeddings<br/>/api/generate| OLL
    API -.->|in-process<br/>stream_generate| MLX
    PARSE -->|read bytes| FS
    INDEX -->|persist| DISK
    STATE -.->|hydrate on start| DISK

    classDef proc fill:#1e293b,stroke:#3b82f6,color:#f1f5f9
    classDef store fill:#0f172a,stroke:#64748b,color:#f1f5f9,stroke-dasharray:3
    classDef model fill:#312e81,stroke:#818cf8,color:#f1f5f9
    class TauriProc,SidecarProc proc
    class FS,DISK,STATE store
    class OLL,MLX model
```

**Why three processes?** The Rust shell gives us a real native
window and tight macOS chrome control. The Python sidecar isolates
heavyweight Python deps (faiss, openpyxl, pypdf, mlx) so the Rust
side stays small. Ollama is its own daemon because the user already
runs it for other tools — sharing the same model cache is free.

**Why localhost only?** Hackathon track is "Cut the Cord". The
sidecar binds to `127.0.0.1` and never resolves an external host.
You can pull the Ethernet cable and Houston still works.
