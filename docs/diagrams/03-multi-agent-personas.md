# 03 — Multi-Agent Personas + KV-Cache Reuse

Houston runs **five personas** on top of a single LLM. Each persona
is a system message: `HOUSTON_PREFIX + _ROLE_TAIL`. The prefix is
**byte-identical** across personas — that's not cosmetic, it's the
whole point.

## Why byte-identical?

Both Ollama and MLX-LM keep a KV-cache keyed by the tokenized
prefix. When the next call's system message starts with the same
N tokens, the runtime skips prompt-eval on those tokens entirely.
On Houston's measurement set (Mars Habitat AI), chained calls
went **8 124 ms → 4 050 ms (2.0× speedup)** purely from this trick.
Even a trailing space invalidates the cache — keep the prefix
boring and frozen.

```mermaid
flowchart TB
    subgraph PROMPTS["backend/prompts.py"]
        PREFIX["<b>HOUSTON_PREFIX</b><br/>(identity, tone, no-cloud, no-invent,<br/>be concise, be honest)<br/><i>byte-identical across all 5 personas</i>"]

        T1[_SUMMARIZER_TAIL<br/>5-8 bullets, source language]
        T2[_NOTE_WRITER_TAIL<br/>standalone markdown note,<br/>2-4 paragraphs]
        T3[_FILENAME_PROPOSER_TAIL<br/>ONE kebab-case filename,<br/>≤60 chars]
        T4[_CODE_SUMMARIZER_TAIL<br/>what does this file do,<br/>5-8 bullets]
        T5[_IMAGE_DESCRIBER_TAIL<br/>5-7 bullets, transcribe text<br/>verbatim, no speculation]

        PREFIX --> T1 & T2 & T3 & T4 & T5
    end

    subgraph CALLS["FastAPI endpoints"]
        E1[/POST /summarize/]
        E2[/POST /note/]
        E3[/POST /filename/]
        E4[/POST /summarize<br/>code branch/]
        E5[/POST /summarize<br/>image branch/]
    end

    T1 --> E1
    T2 --> E2
    T3 --> E3
    T4 --> E4
    T5 --> E5

    subgraph RUNTIME["LLM runtime"]
        KV[(KV-cache keyed by<br/>tokenized prefix)]
        E1 -.->|prefix HIT| KV
        E2 -.->|prefix HIT| KV
        E3 -.->|prefix HIT| KV
        E4 -.->|prefix HIT| KV
        E5 -.->|prefix HIT| KV
    end

    classDef prefix fill:#7c2d12,stroke:#fb923c,color:#fff7ed
    classDef tail fill:#1e3a8a,stroke:#60a5fa,color:#dbeafe
    classDef cache fill:#064e3b,stroke:#34d399,color:#d1fae5
    class PREFIX prefix
    class T1,T2,T3,T4,T5 tail
    class KV cache
```

## Chained-call example

The user clicks **Summarize**, then **Save as Note**, then
**Suggest Filename** on the same document. That's three persona
switches with zero re-eval of the shared identity prompt:

```mermaid
sequenceDiagram
    participant UI
    participant API as FastAPI
    participant LLM as Ollama / MLX
    participant KV as KV-cache

    UI->>API: POST /summarize
    API->>LLM: HOUSTON_PREFIX + SUMMARIZER_TAIL + doc
    LLM->>KV: cache prefix tokens
    LLM-->>API: 5-8 bullets
    API-->>UI: summary

    UI->>API: POST /note (with summary)
    API->>LLM: HOUSTON_PREFIX + NOTE_WRITER_TAIL + doc + summary
    LLM->>KV: prefix HIT (skip prompt-eval)
    LLM-->>API: markdown note
    API-->>UI: note

    UI->>API: POST /filename
    API->>LLM: HOUSTON_PREFIX + FILENAME_PROPOSER_TAIL + summary
    LLM->>KV: prefix HIT
    LLM-->>API: kebab-case-name
    API-->>UI: filename
```

**Important constraint**: never edit `HOUSTON_PREFIX` casually. A
trailing newline change, a punctuation tweak, even a typo fix that
reorders a sentence — all of these invalidate the cache for every
persona. If you must edit it, edit it once, deliberately, and
benchmark a chained-call latency before and after.
