# 02 — RAG Pipeline

Two flows on the same FAISS index. **Index** runs once per folder
(or on re-index). **Search** runs on every query. Both pipelines
share the embedder so latency is dominated by Ollama's
`nomic-embed-text` throughput.

## Index flow

```mermaid
flowchart LR
    USER[/User picks folder<br/>POST /index/]
    WALK[indexer.walk_folder<br/>recursive,<br/>SUPPORTED_EXT filter]
    PARSE[parsing.parse_file<br/>pdf · docx · xlsx ·<br/>txt · code ext]
    CHUNK[chunker<br/>~800 tokens,<br/>120-token overlap]
    EMBED[OllamaClient.embed<br/>nomic-embed-text<br/>768-dim vector]
    NORM[L2-normalize<br/>so IndexFlatIP = cosine]
    FAISS[(FaissIndex<br/>IndexFlatIP)]
    META[(chunks.json<br/>path · offset · text)]
    HIST[state.json history<br/>prepend, dedup, cap 20]

    USER --> WALK --> PARSE --> CHUNK --> EMBED --> NORM --> FAISS
    CHUNK --> META
    USER --> HIST
```

## Search flow

```mermaid
flowchart LR
    Q[/User types query<br/>POST /search/]
    QEMB[OllamaClient.embed<br/>query → 768-dim]
    QNORM[L2-normalize]
    SRCH["FaissIndex.search&lpar;k=10&rpar;"]
    META[(chunks.json<br/>look up by row id)]
    DEDUP[dedupe by file path<br/>keep best chunk per file]
    RANK[score = inner product<br/>= cosine similarity]
    OUT[/JSON: hits<br/>path · score · snippet/]

    Q --> QEMB --> QNORM --> SRCH --> META --> DEDUP --> RANK --> OUT
```

**Why `IndexFlatIP` and not HNSW / IVF?** Houston's target corpus is
a single user's `~/Documents` — typically 10k chunks at most. Flat
beats approximate indexes on recall, the search is `O(n*d)` =
`O(10000*768)` ≈ 7.7M flops per query, and that's <2 ms on M-series
silicon. No tuning, no warmup, no recall regression. We can
revisit if anyone shows up with a 1M-chunk corpus.

**Why L2-normalize before insert?** `IndexFlatIP` computes inner
products. After L2-normalization, the inner product equals cosine
similarity — which is what the embedding model is trained to
optimize. Skipping normalization gives nonsensical "magnitude
matters" rankings.

**Chunk overlap of 120 tokens?** Empirically: zero overlap loses
sentences split across chunk boundaries; 200+ wastes index space
without measurable recall gain on Houston's eval set.
