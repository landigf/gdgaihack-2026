# Technical-stack synthesis (post-DR, 2026-05-06)
Inputs: 04-msi-intel-ai-pc-runtime.md · 05-local-rag-evidence-stack.md · 06-open-source-model-stack.md · 10-benchmarks-datasets-demo.md

> Author: Claude (Opus 4.7, 1M ctx). Builds on Codex's scout report (`codex-scout-2026-05-06.md`); does not duplicate it. Where Codex was right, this report says "confirmed". Where DRs add detail, this report adds detail. Where DRs disagree, this report flags it.

## TL;DR (5 bullets)

- **Runtime contract over runtime religion.** Use **Ollama as the cross-platform default** (Mac + Windows), with **MLX as the Apple-native upgrade path** and **Foundry Local + OpenVINO GenAI as the MSI/Intel sponsor-story path**. The single thing that matters is shipping ONE OpenAI-compatible adapter so the demo logic never depends on a runtime-specific payload (DR-04, "Shared output contract", §5).
- **Codex's SQLite + FTS5 + sqlite-vec recommendation is confirmed and reinforced.** DR-05 explicitly ranks `sqlite-vec` as the *best 24h MVP choice* among 7+ embedded vector stores, with `LanceDB local` as the "batteries-included" upgrade and `Qdrant Edge` as the "future scale-up" path (DR-05, "Hackathon tradeoffs and recommended minimal stack").
- **The model stack to ship is small, Apache-2.0, and boring.** Confirmed leaders: **Qwen3 4B** (reasoning), **Phi-4-mini** (predictable fallback), **Gemma 3 4B / Gemma 4 E4B** (multimodal + best Ollama integration), **EmbeddingGemma** or **bge-small-en-v1.5** (RAG), **faster-whisper** or **MLX Whisper** (STT), **Piper** or **Kokoro-82M** (TTS) — all with permissive licensing and pre-existing Ollama / MLX paths (DR-06, "MVP shortlists" / "Bottom line").
- **The benchmark headline metric should change from "latency only" to "Cited Checklist Completeness".** DR-10 introduces a composite metric — `Σ wᵢ · present(stepᵢ ∧ citation_correctᵢ) / Σ wᵢ` — that collapses "did it say the right things?" + "did it cite them?" into one judge-friendly number. This replaces Codex's "required_actions_hit" as the primary axis (DR-10, "Metrics and scorecard").
- **Highest-leverage scope additions for Saturday.** (1) Pull `embeddinggemma` + `nomic-embed-text` to enable real RAG; (2) write `benchmarks/scenarios/incident-copilot.yaml` from DR-10's six core scenarios; (3) add `LANGSMITH_TRACING=false` and explicit `Settings.llm`/`Settings.embed_model` plumbing to whatever orchestration we ship to prevent hidden cloud calls (DR-05, "Auditing frameworks for zero-network behavior" / DR-06, "Embeddings").

---

## Recommended runtime path

### Mac (M3 Pro) — primary stack with exact commands

The M3 Pro is the **safest demo machine** because Apple's unified-memory architecture removes the discrete-VRAM boundary that complicates Windows local AI demos (DR-04, "Likely event hardware" — note: 18 GB or 36 GB unified memory depending on SKU).

**Primary path: Ollama for cross-platform parity, MLX for Apple-native upgrade.**

```bash
# already in scripts/download-models.sh — confirmed correct:
brew install ollama
ollama serve &
ollama pull gemma3:4b        # multimodal text+image, 32K-128K ctx
ollama pull gemma3n:e4b      # mobile-class multimodal, audio support
ollama pull phi4-mini        # MIT license, fastest small reasoning
ollama pull qwen2.5-coder:3b # code/log interpretation specialist

# ADD these (not yet in download-models.sh):
ollama pull qwen3:4b               # Apache-2.0, best small reasoner per DR-06
ollama pull embeddinggemma         # on-device-RAG-optimized embeddings
ollama pull nomic-embed-text       # backup embedding (Apache-2.0, ONNX-ready)

# Apple-native upgrade lane (only if a teammate already knows MLX):
pip install mlx mlx-lm mlx-whisper
brew install ffmpeg
mlx_lm.generate --prompt "hello"

# llama.cpp as low-level fallback for GGUF control:
brew install llama.cpp
# llama-server -hf ggml-org/gemma-3-1b-it-GGUF --port 8080
```

(DR-04, "Mac precheck and preload"; DR-06, "Runtime and format compatibility")

**STT on Mac:** `mlx-whisper` is the cleanest path — Apple publishes MLX-formatted Whisper checkpoints with word-level timestamps (DR-06, "STT" / DR-04, "Mac precheck"). Fall back to `faster-whisper` (CTranslate2-based, up to 4× faster than openai/whisper at the same accuracy per DR-06) if MLX install gets weird.

### Windows / MSI (TBD hardware) — primary stack with exact commands

> **Hardware is still unknown.** DR-04 lists *several* plausible 2026 MSI candidates that span both **Copilot+ PCs** (Prestige 13/16 AI+, Cubi NUC AI+ 3MG with 50 NPU TOPS) and **non-Copilot+ PRO desktops** (PRO DP80 / DP180 / DP400 AI). The presence of "Intel Core Ultra" does **not** automatically imply Copilot+ NPU behavior. Do not write NPU-specific code until this is resolved at kickoff (DR-04, "Likely event hardware", and Codex's TRACK_INTEL note about the "PRO Productivity Bundle").

**Primary path: Ollama as the safe default, Foundry Local as the sponsor-narrative upgrade.**

```powershell
# Safe default (works regardless of Copilot+ status):
# (install Ollama for Windows)
ollama serve
ollama pull gemma3:4b
ollama pull phi4-mini
ollama pull qwen3:4b
ollama pull embeddinggemma

# Sponsor-narrative path (requires online first-run for execution provider download):
winget install Microsoft.FoundryLocal
foundry --version
foundry service status
foundry model list --filter task=chat-completion
foundry model run phi-4-mini       # alias triggers best-variant selection
```

(DR-04, "Exact commands to run before kickoff" / "Windows precheck and preload")

> **CRITICAL pre-kickoff step:** `foundry model list` and the first `foundry model run` **trigger network downloads of execution providers and models specific to your hardware**. These MUST happen while internet is still available. Same applies to Ollama model pulls (DR-04, "Pitfalls and fallback ladder", item 1).

### Decision tree: Ollama vs Foundry Local vs OpenVINO GenAI vs llama.cpp

```
Q1: What's the demo machine?
  ├── Mac M3 Pro (any) → Ollama (default) or MLX (upgrade)
  └── Windows → Q2

Q2: Is the Windows machine confirmed Copilot+ class with current NPU drivers?
  ├── YES (Copilot+ + ≥16 GB RAM + recent Intel NPU driver)
  │     ├── Want fastest demo? → Ollama (boring, reliable)
  │     └── Want sponsor story? → Foundry Local (alias-based) → OpenVINO GenAI as explicit Intel/NPU lane
  └── NO / unknown / older Core Ultra
        ├── Want sponsor story? → Foundry Local with GPU/CPU acceleration; pitch "fully offline AI on MSI + Intel" not "NPU-first"
        └── Want fastest demo? → Ollama

Q3: Did chosen primary fail in setup or model conversion?
  ├── Foundry Local hangs → fall back to OpenVINO GenAI (AUTO device)
  ├── OpenVINO NPU memory error → set DISABLE_OPENVINO_GENAI_NPU_L0=1, retry on GPU/CPU
  ├── Both fail → Ollama with small model (gemma3:4b or phi4-mini)
  └── Need explicit GGUF behavior or OpenAI-style endpoint that Ollama doesn't expose → llama.cpp `llama-server`
```

(Assembled from DR-04, "Runtime decision trees and kickoff prechecks" + "Pitfalls and fallback ladder")

**When to use each:**

| Runtime | Pick when | Avoid when |
|---|---|---|
| **Ollama** | Speed-to-demo matters most; cross-platform parity; no NPU story required. | You need NPU bragging rights or specific GGUF tuning. |
| **Foundry Local** | Windows demo + want a sponsor-friendly "Microsoft AI on Intel hardware" sentence. CLI is preview but service is GA (DR-04 "Runtime assessment"). | Mac demo (works on Mac via brew but adds no value over Ollama there). First-run requires online. |
| **OpenVINO GenAI** | Confirmed Intel NPU hardware + you want the strongest pure-Intel narrative; need text+VLM+Whisper+embeddings+reranking under one runtime family (DR-04 "Runtime assessment"). | <16 GB RAM + >7B model + >1024 token prompts (memory ceiling per OpenVINO 2026.1 NPU docs cited in DR-04). |
| **llama.cpp** | Need explicit GGUF model + OpenAI-compatible HTTP server + maximum control. Best Mac Metal optimization. | You don't care about specific quant files and Ollama already serves you. |

### NPU stretch path (only if MSI hardware confirmed at kickoff)

Treat NPU as a **post-skeleton spike**. Codex was right; DR-04 reinforces this with specifics.

**Pre-kickoff dependency pin (DR-04, "Pitfalls" / "Windows precheck"):**

```powershell
python -m venv npu-env
npu-env\Scripts\activate
pip install nncf==2.18.0 onnx==1.18.0 optimum-intel==1.25.2 transformers==4.51.3
pip install openvino==2026.1 openvino-tokenizers==2026.1 openvino-genai==2026.1
```

Hard caveats from DR-04 (do not ignore):

1. OpenVINO NPU LLM pipeline uses **static-shape-oriented approach**; defaults to prompts up to **1024 tokens**, minimum response length **128**. Reconfigure explicitly if you need more.
2. **>16 GB RAM may be required for >7B models with prompts >1024 tokens** on Core Ultra Series 2 systems.
3. **Cross-document Microsoft mismatch:** Foundry-on-Windows says OpenVINO EP works on Core Ultra Series 1+ with 16 GB RAM; Windows ML's OpenVINO EP page says NPU requires Intel Arrow Lake or newer. Verify on the actual machine before committing (DR-04, third pitfall).
4. **Always wire a GPU/CPU fallback before declaring NPU success.** Driver issues may require workaround env var `DISABLE_OPENVINO_GENAI_NPU_L0=1`.

---

## Model shortlist (table)

> Quant sizes are Q4_K_M unless noted. License is Apache-2.0 / MIT unless flagged. "Best for" is the demo role. Footprint heuristic from DR-06: ~0.6–0.8 GB per 1B params at 4-bit, ~1.0–1.2 GB at 8-bit, ~2.0–2.4 GB at fp16/bf16, plus context-cache overhead.

### Reasoning LLM

| Model | Params | Quant disk | License | Ollama? | MLX? | GGUF? | Foundry? | Best for | Source DR |
|---|---|---|---|---|---|---|---|---|---|
| **Qwen3 4B** | 4B | ~2.5 GB | Apache-2.0 | yes (`qwen3:4b`) | yes | yes | TBD | **Primary reasoning brain.** Tool-use orientation, multilingual, long-context. | DR-06 §"Qwen, Phi" |
| **Qwen3 1.7B** | 1.7B | ~1.1 GB | Apache-2.0 | yes | yes | yes | TBD | RAM-tight fallback when 4B doesn't fit alongside STT+TTS. | DR-06 §"Qwen, Phi" |
| **Phi-4-mini-instruct** | 3.8B | ~2.8 GB | **MIT** | yes (`phi4-mini`) | yes | yes | **yes** (alias `phi-4-mini`) | **Predictable single-model alternative.** Best when you value boring reliability. | DR-06 §"Qwen, Phi"; DR-04 "Windows precheck" |
| **Gemma 3 4B** | 4B | ~2.6 GB | Gemma license | yes (`gemma3:4b`) | yes | yes | yes | Multimodal text+image, 128K ctx. Already in `download-models.sh`. | DR-06 §"Gemma edge models" |
| **Gemma 3n E4B** | E4B | ~3.0 GB | Gemma license | yes (`gemma3n:e4b`) | partial | yes | yes | Mobile-class multimodal w/ **audio input** — useful for speech-translation single-model demos. | DR-06 §"Gemma edge models" |
| **Gemma 4 E2B** | E2B | ~1.8 GB | **Apache-2.0** | yes (when published) | yes | yes | yes | **Best license + best edge story** if Ollama tag exists at kickoff; LiteRT-LM ready. | DR-06 §"Gemma edge models" |
| **Gemma 4 E4B** | E4B | ~2.7 GB | **Apache-2.0** | yes | yes | yes | yes | Quality step up from E2B; still local. | DR-06 §"Gemma edge models" |
| **DeepSeek-R1-Distill-Qwen-1.5B** | 1.5B | ~1.1 GB | MIT | yes (`deepseek-r1:1.5b`) | yes | yes | TBD | Reasoning-trace demo flavor. Verbose; needs short stop conditions. | DR-06 §"Llama, Mistral, DeepSeek" |
| **Mistral 3 3B / 8B** | 3B / 8B | ~1.9 / 5.0 GB | **Apache-2.0** | yes (Mistral tag) | yes | yes | TBD | Cleanly licensed alternative to Qwen3 if a teammate already knows the family. | DR-06 §"Llama, Mistral, DeepSeek" |
| **SmolLM2-1.7B-Instruct** | 1.7B | ~1.1 GB | Apache-2.0 | partial | yes | yes | no | Lowest-RAM tiny baseline if every GB matters. | DR-06 §"Llama, Mistral, DeepSeek" |

### Vision LLM

| Model | Params | Quant disk | License | Ollama? | MLX? | GGUF? | Foundry? | Best for | Source DR |
|---|---|---|---|---|---|---|---|---|---|
| **Gemma 3 4B** (multimodal) | 4B | ~2.6 GB | Gemma | yes | yes | yes | yes | Image understanding for safety-auditor stretch path. | DR-06 §"Gemma edge models" |
| **Gemma 4 E4B** (multimodal) | E4B | ~2.7 GB | Apache-2.0 | yes | yes | yes | yes | Cleaner license + same modality coverage. | DR-06 §"Gemma edge models" |
| **Qwen2.5-VL 3B / 7B** | 3B / 7B | ~2.0 / 4.5 GB | Apache-2.0 | yes | partial | yes | TBD | Strong open VLM if we need OCR-flavor work on uploaded SOPs. | DR-06 §"Qwen, Phi" (implied) |

### STT (Speech-to-Text)

| Model | Params | Disk | License | Ollama? | MLX? | GGUF? | Foundry? | Best for | Source DR |
|---|---|---|---|---|---|---|---|---|---|
| **whisper.cpp `base.en`** | 74M | ~150 MB / ~388 MB RAM | MIT | n/a | n/a | n/a | n/a | Single static binary; CPU-only fallback. | DR-06 §"STT" |
| **whisper.cpp `small.en`** | 244M | ~500 MB / ~852 MB RAM | MIT | n/a | n/a | n/a | n/a | Quality step up if RAM allows. | DR-06 §"STT" |
| **faster-whisper `small`** | 244M | ~500 MB | MIT | n/a | n/a | n/a | n/a | **Default desktop demo.** Up to 4× faster than openai/whisper at same accuracy; INT8 CPU+GPU. | DR-06 §"STT" |
| **MLX Whisper (small/medium)** | 244M / 769M | ~500 MB / ~1.5 GB | MIT | n/a | **yes** | n/a | n/a | **Cleanest Mac path.** Word-level timestamps. | DR-06 §"STT"; DR-04 |
| **Foundry Local Whisper** | varies | varies | varies | n/a | n/a | n/a | **yes** | Cleanest Windows demo if Foundry is the hero runtime. | DR-04 §"Runtime assessment" |

### TTS (Text-to-Speech) — **optional for incident copilot**

| Model | Params | Disk | License | Ollama? | MLX? | GGUF? | Foundry? | Best for | Source DR |
|---|---|---|---|---|---|---|---|---|---|
| **Piper** | small | ~50–200 MB per voice | MIT | n/a | n/a | n/a | n/a | **Default offline TTS.** Fast, low-drama, runs on CPU. | DR-06 §"TTS" |
| **Kokoro-82M** | 82M | ~330 MB | **Apache-2.0** | n/a | partial | n/a | n/a | Best quality-per-GB; English-first. | DR-06 §"TTS" |
| **MeloTTS** | varies | ~300 MB / lang | MIT | n/a | n/a | n/a | n/a | Multilingual fallback (EN/ES/FR/ZH/JA/KO). | DR-06 §"TTS" |

### Embeddings

| Model | Params | Disk | License | Ollama? | MLX? | ONNX? | OpenVINO? | Best for | Source DR |
|---|---|---|---|---|---|---|---|---|---|
| **bge-small-en-v1.5** | 33M | ~130 MB | **MIT** | partial | yes | **yes** | yes | Smallest English RAG; CPU-friendly. | DR-06 §"Embeddings" |
| **e5-small-v2** | 33M | ~130 MB | MIT | partial | yes | yes | **yes** | Equivalent EN; OpenVINO-ready. | DR-06 §"Embeddings" |
| **multilingual-e5-small** | 118M | ~470 MB | MIT | partial | yes | yes | yes | 94 languages — needed for stretch scenario `s08_multilingual_triage`. | DR-06 §"Embeddings" |
| **BGE-M3** | 568M | ~1.1 GB | MIT | yes | yes | yes | partial | 100+ languages, multi-functionality (dense + sparse + multi-vector). | DR-06 §"Embeddings" |
| **nomic-embed-text-v1.5** | 137M | ~270 MB | Apache-2.0 | yes | yes | yes | yes | Strong English; widely tested. | DR-06 §"Embeddings" |
| **mxbai-embed-large-v1** | 335M | ~670 MB | Apache-2.0 | yes | yes | yes | **yes** | Best higher-quality option; ONNX + OpenVINO + GGUF artifacts. | DR-06 §"Embeddings" |
| **EmbeddingGemma** | small | ~300 MB | Apache-2.0 | **yes** | yes | yes | partial | **Designed for on-device RAG.** Pairs naturally with Gemma LLMs. | DR-06 §"Embeddings" |

### Translation (stretch — only for offline-translator side challenge)

| Model | Params | Disk | License | Best for | Source DR |
|---|---|---|---|---|---|
| **NLLB-200 distilled 600M** | 600M | ~2.5 GB | **CC-BY-NC-4.0** | 196 languages; CPU-friendly. License excludes commercial — fine for hackathon. | DR-06 §"Translation" |
| **TranslateGemma 4B** | 4B | ~2.5 GB | Gemma | 55 languages; better naturalness for laptop-local. | DR-06 §"Translation" |
| **SeamlessM4T unity-small-s2t** | small | ~637 MB | CC-BY-NC-4.0 | On-device speech-to-text translation; **only EN/FR/HI/PT/ES**. | DR-06 §"Translation" |

### Three models NOT yet in `scripts/download-models.sh` we should add

1. **`ollama pull qwen3:4b`** — Apache-2.0 license is meaningfully cleaner than Gemma's bespoke license, and DR-06 ranks Qwen3 4B as the top general-purpose small reasoning model for tool-use orientation. (Source: DR-06 §"Qwen, Phi"; one-line reason: best license + best small-reasoner combo.)
2. **`ollama pull embeddinggemma`** — explicit on-device-RAG embedding model; pairs with our Gemma family already pulled. Without an embedding model, our RAG layer cannot run — this is the missing keystone. (Source: DR-06 §"Embeddings"; one-line reason: makes RAG actually possible.)
3. **`ollama pull nomic-embed-text`** — backup embedding; Apache-2.0; widely supported. Used in DR-05 LlamaIndex audit example. (Source: DR-05 "LlamaIndex audit pattern"; one-line reason: a second embedder lets us A/B retrieval quality cheaply.)

> Optional fourth pull only if we commit to the safety-auditor stretch: `ollama pull qwen2.5vl:7b` for vision (DR-06 implies; not in DR-04 explicit recipe).

---

## Local RAG architecture

### Recommended stack: SQLite FTS5 + sqlite-vec — **CONFIRMED, with reinforcement**

Codex's scout said this. DR-05 ranks it explicitly as **the best 24h MVP choice**, with concrete reasoning:

> "If your priority is **minimum failure modes**, `sqlite-vec` wins."
> — DR-05, "Interpretation"

The full DR-05 stack ranking (paraphrased from "Hackathon tradeoffs and recommended minimal stack"):

| Tier | Systems | Why |
|---|---|---|
| **Best for 24h MVP** | sqlite-vec + FTS5; LanceDB local | Lowest operational risk; one-process build; clean metadata story; hybrid search |
| **Good for future scale-up** | Qdrant Edge; Qdrant local mode | Better vector-DB semantics, dense+sparse, snapshot compatibility with server |
| **Good ANN primitives, more assembly** | FAISS, hnswlib, USearch, Annoy, Tantivy | Excellent components, not full local document-RAG stacks |
| **Use with caution** | sqlite-vss, RAGdb | sqlite-vss is inactive + filter-limited; RAGdb is innovative but early |
| **Research reference only** | MicroNN | Outstanding design (<7 ms top-100 at 90% recall, ~10 MB RAM) but unclear public packaging |

Recommended pinned versions from DR-05 §"Recommended minimum viable stack":

| Layer | Component | Pin |
|---|---|---|
| Local model runtime | Ollama | v0.23.0 |
| PDF extraction | PyMuPDF | 1.27.2.3 |
| Vector layer | sqlite-vec | 0.1.9 |
| Keyword layer | SQLite FTS5 | bundled |
| Generator | Ollama local chat (e.g., gemma3:4b) | digest-pinned |
| Embeddings | EmbeddingGemma or nomic-embed-text | pulled via Ollama |

### Hybrid retrieval pattern: keyword (FTS5) + dense (sqlite-vec) + reranker?

DR-05 "Architecture patterns for grounded offline RAG" prescribes:

1. **Lexical retrieval (FTS5)** — exact anchors: part numbers, section titles, error codes, checklist verbs, warnings (`chlorine`, `IDLH`, `evacuation`, `lockout/tagout`, UN numbers like `UN1203`).
2. **Dense retrieval (sqlite-vec)** — paraphrase / semantic coverage.
3. **Fusion** — Reciprocal Rank Fusion (RRF) or equivalent stable combiner. LanceDB's default hybrid path uses RRF; we replicate manually.
4. **Light reranking** — only over the fused top 20–50, only if latency budget allows. CrossEncoder rerankers from Sentence Transformers v5.4+.

> **Reranker decision:** Skip on day 1. Only add if our headline metric (Cited Checklist Completeness — see Benchmark section) plateaus below 0.72 on the core suite. DR-05 explicitly says "rerank only the top 20–50 candidates if time permits."

### Citation contract: how chunks carry source IDs back to the LLM output

DR-05 prescribes a deterministic citation pattern that is *not* free-text-generated:

```
Context block format presented to the LLM:
  [S1] niosh_pocket_guide.pdf p.14 §3.2 (chunk_id=42)
  [S2] osha_loto_29cfr1910.147.pdf p.2 item 7 (chunk_id=88)
  [S3] erg2024_guide_124.pdf p.182 (chunk_id=201)

LLM output contract:
  - Each checklist step MUST cite at least one [S_n] ID.
  - The post-validator checks every cited ID against the retrieval set.
  - Any answer citing an ID not in the retrieval set is REJECTED at the
    application layer and either re-prompted or shown as "evidence weak — verify".
```

(DR-05, "Architecture patterns for grounded offline RAG")

**SQLite schema sketch (synthesizing DR-05 + DR-10):**

```sql
CREATE TABLE docs (
  doc_id TEXT PRIMARY KEY,
  title TEXT,
  source_url TEXT,
  source_org TEXT,        -- 'NIOSH', 'OSHA', 'CDC', 'PHMSA', 'RedCross'
  license TEXT,
  ingested_at TEXT
);

CREATE TABLE chunks (
  chunk_id INTEGER PRIMARY KEY,
  doc_id TEXT REFERENCES docs(doc_id),
  page INTEGER,
  section_path TEXT,      -- e.g., "Lockout/Tagout > Energy Control > Step Sequence"
  anchor TEXT,            -- e.g., "prepare_shutdown" — used in citations
  text TEXT NOT NULL,
  hazard_tags TEXT,       -- comma-list: "chemical,chlorine,respiratory"
  scenario_tags TEXT      -- comma-list: "s06_chlorine_railcar_leak"
);

-- FTS5 mirror over chunk text + anchors:
CREATE VIRTUAL TABLE chunks_fts USING fts5(
  text, anchor, hazard_tags, content=chunks, content_rowid=chunk_id
);

-- sqlite-vec table for dense vectors (e.g., 384-dim from bge-small):
CREATE VIRTUAL TABLE chunks_vec USING vec0(
  chunk_id INTEGER PRIMARY KEY,
  embedding FLOAT[384]
);
```

(Schema synthesized from DR-05 "Evaluation scope" provenance fields + Codex storage section + DR-10 scenario contract.)

### Avoiding hidden cloud calls in LangChain / LlamaIndex (concrete config)

DR-05 §"Auditing frameworks for zero-network behavior" is unusually specific. Two concrete patterns to drop into our code:

**LlamaIndex:**

```python
# src/airgap/llm.py — runs at app startup
import os
# Defensive: unset all provider keys before any imports
for k in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "MISTRAL_API_KEY", "GOOGLE_API_KEY"):
    os.environ.pop(k, None)

from llama_index.core import Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding

Settings.llm = Ollama(model="gemma3:4b", request_timeout=120.0)
Settings.embed_model = OllamaEmbedding(model_name="embeddinggemma")
# Do NOT enable observability handlers or OpenTelemetry exporters in offline mode.
```

(Lifted from DR-05 §"LlamaIndex audit pattern".)

**LangChain:**

```python
# src/airgap/llm.py
import os
os.environ["LANGSMITH_TRACING"] = "false"   # MANDATORY for zero-egress

from langchain_ollama import ChatOllama, OllamaEmbeddings

llm = ChatOllama(model="gemma3:4b")
emb = OllamaEmbeddings(model="embeddinggemma")

# If anywhere in the stack imports langsmith, also wrap critical regions:
import langsmith as ls
with ls.tracing_context(enabled=False):
    ...
```

(Lifted from DR-05 §"LangChain audit pattern".)

**Framework-agnostic checklist (DR-05):**

- Pre-download everything: model blobs, tokenizer files, DB extensions, wheels.
- Start with no provider keys in the environment.
- Block outbound network during integration tests; see what breaks.
- Log connections at the OS level during smoke tests.
- Search source + lockfiles for `OpenAI`, `Anthropic`, `langsmith`, `LANGSMITH_`, `https://`.
- **Ban runtime installs** of extensions or models. (This is critical for DuckDB extension autoload — DR-05 explicitly flags `INSTALL fts` autoloads from official extension repository unless prebundled.)
- **Fail closed**: if a local model is unavailable, error loudly instead of falling back to remote.

### 24h reliability assessment of each option

| Option | Install path | 24h reliability | Notes |
|---|---|---|---|
| **sqlite-vec** | `pip install sqlite-vec==0.1.9` | **HIGH** | Single C file, no deps. Pre-v1 but stable docs. Best default. |
| **SQLite FTS5** | bundled with SQLite | **HIGH** | Zero risk; ships with Python's `sqlite3`. |
| **LanceDB local** | `pip install lancedb` | **MEDIUM-HIGH** | Heavier deps; built-in hybrid + RRF + rerankers. Best "batteries included" upgrade. |
| **Qdrant Edge** | private beta — *contact required* | **LOW for hackathon** | Codex was right: do NOT depend on it for the 24h core. DR-05 also flags "access/beta risk". Both sources agree. |
| **Qdrant local mode (server)** | `pip install qdrant-client; docker run qdrant/qdrant` | MEDIUM | Adds a process; worth it only if Qdrant Edge becomes available. |
| **DuckDB + fts + vss** | `pip install duckdb` + `INSTALL fts; INSTALL vss;` | MEDIUM-LOW | **DR-05 specifically warns**: extension autoload reaches out to official repo unless prebundled. Must vendor extensions in advance. |
| **sqlite-vss** | `pip install sqlite-vss` | LOW | DR-05: "inactive development", "indexes must fit in RAM", no metadata filters. Skip. |
| **FAISS** | `pip install faiss-cpu` | MEDIUM | Excellent ANN; you must build metadata + keyword + citation layers yourself. Skip unless team already knows FAISS. |
| **RAGdb** | `pip install ragdb` | LOW | Innovative but early; TF-IDF retrieval; not the right tool for dense RAG. |
| **MicroNN** | research only | n/a | Architectural reference only. |

**Conclusion:** Codex's call (sqlite-vec + FTS5 first, Qdrant Edge as stretch) is **fully validated and reinforced** by DR-05. The only edit is to add **LanceDB local as the named "if we outgrow sqlite-vec on day 2" upgrade**, since DR-05 ranks it as the most feature-complete one-process retrieval library (built-in hybrid + RRF + rerankers).

---

## Benchmark plan (concrete)

### Reuse Codex's 3 scenarios — confirmed and EXTENDED to 6 core + 3 stretch

Codex proposed 3 scenarios (gas leak, fire/evac, chemical splash). DR-10 expands this to **6 core + 3 stretch**, with explicit gold-source citations and weighted critical steps. We adopt DR-10's superset:

**Core (must build):**

| ID | Title | Source corpus | Why |
|---|---|---|---|
| `s01_bleeding_extremity.en` | Coworker cut on sheet metal, blood spurting | Red Cross | Evaluator-friendly; presented as ordered actions. |
| `s02_heat_stroke_worker.en` | Worker confused, very hot, barely responsive | CDC/NIOSH + Red Cross | Wording overlap = robust gold checklist. |
| `s03_confined_space_entry.en` | Manhole entry with possibly bad atmosphere | OSHA | Tests refusal of speculation. |
| `s04_loto_conveyor_jam.en` | Lockout/tagout sequence before clearing jam | OSHA 29 CFR 1910.147 | Sequence is explicit → strong completeness scoring. |
| `s05_gasoline_tanker_fire.en` | UN1203 tanker fire — guide + evac distance | PHMSA / Transport Canada ERG (Guide 128, 800 m) | Crisp numeric output + citation path. |
| `s06_chlorine_railcar_leak.en` | UN1017 railcar leak — guide + table + isolation | PHMSA / Transport Canada ERG (Guide 124, Table 1+3, 1000 m) | Tests retrieval fidelity + refusal to invent distances. |

**Stretch (only if core is bulletproof):**

| ID | Title | Source corpus |
|---|---|---|
| `s07_ammonia_nurse_tank_leak.en` | UN1005 leak; Orange vs Green guide section | PHMSA ERG |
| `s08_multilingual_triage_bleeding.es-en.json` | ES intake → EN cited checklist | Emergency Multilingual Phrasebook (36 langs) |
| `s09_map_resource_lookup.en` | Nearest fire station / muster point | OpenStreetMap (offline) |

(All from DR-10 §"Public corpora and quick-build scenarios"; superset of Codex's 3.)

### JSON schema for results — Codex baseline + DR-10 additions

DR-10 proposes a richer JSON contract than Codex's. Diff:

| Field | Codex | DR-10 | Decision |
|---|---|---|---|
| `scenario_id`, `system`, `runtime`, `offline_mode` | ✓ | ✓ | Keep both. |
| `network_packets_observed` | ✓ | replaced with `network.uid_rx_bytes_*`, `uid_tx_bytes_*`, `zero_egress_pass` | **Use DR-10's** — UID-byte-delta is more credible evidence. |
| `stt_ms`, `retrieval_ms`, `llm_first_token_ms`, `llm_total_ms`, `end_to_end_ms` | ✓ | wrapped in `timings_ms` block w/ monotonic boundaries | **Adopt DR-10's** — adds `first_cited_step` (the best user-facing latency metric for the pitch). |
| `tokens_per_second` | ✓ | renamed `decode_tokens_per_sec`; adds `input_tokens`, `output_tokens` | Adopt DR-10. |
| `citations_returned` | ✓ | replaced by `evaluation.citation_correctness` | Adopt DR-10. |
| `required_actions_hit / total` | ✓ | replaced by `evaluation.checklist_completeness` + `evaluation.cited_checklist_completeness` | **Adopt DR-10's `cited_checklist_completeness` as the primary metric**. |
| `unsafe_claims` | ✓ | renamed `evaluation.hallucination_rate` | Adopt DR-10. |
| `incident_log_valid_json` | ✓ | n/a in DR-10 | **Keep from Codex** — useful for product gate. |
| memory, battery, run_id, git_sha, corpus_hash | — | ✓ | **Add from DR-10**. |

**Final merged JSON contract** (one merged file per run; raw tool outputs as artifacts):

```json
{
  "schema_version": "1.0",
  "run_id": "2026-05-09T14-12-09Z_s04_ours_003",
  "scenario_id": "s04_loto_conveyor_jam",
  "variant": "ours",
  "system": "ours_local_rag",
  "runtime": "ollama_gemma3_4b",
  "git_sha": "abc1234",
  "corpus_hash": "sha256:...",
  "scenario_hash": "sha256:...",
  "device": {
    "model": "MacBook Pro M3 Pro",
    "ram_gb": 18,
    "os": "darwin 25.3"
  },
  "conditions": {
    "mode": "voice_e2e",
    "warm_start": true,
    "airplane_mode": true,
    "charging": false
  },
  "timings_ms": {
    "speech_start": 0, "speech_end": 1810,
    "stt_first_partial": 620, "stt_final": 2140,
    "retrieval_start": 2145, "retrieval_end": 2290,
    "llm_first_token": 2560, "first_cited_step": 2885,
    "answer_done": 4190
  },
  "throughput": {
    "input_tokens": 544, "output_tokens": 92,
    "decode_tokens_per_sec": 22.4
  },
  "network": {
    "uid_rx_bytes_before": 0, "uid_rx_bytes_after": 0,
    "uid_tx_bytes_before": 0, "uid_tx_bytes_after": 0,
    "zero_egress_pass": true
  },
  "memory": { "pss_peak_kb": 612384, "rss_peak_kb": 734208 },
  "answer": { "text": "...", "steps": [ /* {step_id, text, citations[]} */ ] },
  "evaluation": {
    "cited_checklist_completeness": 1.0,
    "citation_correctness": 1.0,
    "checklist_completeness": 1.0,
    "hallucination_rate": 0.0,
    "incident_log_valid_json": true,
    "manual_review_required": false
  },
  "artifacts": {
    "perfetto_trace": "benchmarks/results/raw/2026-05-09/s04_ours.perfetto-trace",
    "screenshots": [],
    "video": ""
  }
}
```

### Baseline-vs-ours comparison shape; ≥20% target on primary metric

DR-10 reframes the baseline comparison cleanly:

> "The fairest baseline is **not** 'cloud model versus offline model.' It is: same device, same STT engine, same on-device LLM, same local documents, same prompts, same answer length cap, and only the retrieval-and-answering strategy changes."
> — DR-10, "Baseline versus ours"

This is sharper than Codex's 3-baseline approach. We adopt **the ablation ladder**:

```
baseline_v0   = flat chunks   + top-k vector       + free-form answer
ours_v1       = section-aware chunks
ours_v2       = + metadata filter (hazard_tags pre-filter)
ours_v3       = + checklist template (structured output)
ours_v4       = + citation gating (abstain-on-weak-evidence)
```

**Primary metric:** `cited_checklist_completeness` (DR-10's composite). Target: `0.60 → 0.72` or better on the core suite (≥20% relative lift).

**Fallback metric** if quality plateaus: `p95_time_to_first_cited_step`. Optimize index load + retrieval hot path + first-token latency. Easier quantitative win.

**Pitch slide numbers:** show **only three** — Cited Checklist Completeness, time to first cited step, zero-egress pass rate.

### Ready-to-write file path: `benchmarks/scenarios/incident-copilot.yaml`

YAML shape with one fully filled scenario (synthesizing existing harness format from `BENCHMARKS.md` + DR-10 scenario contract):

```yaml
# benchmarks/scenarios/incident-copilot.yaml
name: incident-copilot
description: |
  Voice-first offline incident copilot. Six core scenarios sourced from
  NIOSH, OSHA, CDC, Red Cross, PHMSA/Transport Canada ERG. Each scenario
  is run in voice_e2e and text_control modes; warm and cold start.
schema_version: "1.0"
runs_per_item: 3
systems_to_run:
  - baseline_v0    # flat chunks + top-k vector + free-form
  - ours_v4        # full pipeline
metrics:
  primary: cited_checklist_completeness
  secondary:
    - p95_time_to_first_cited_step_ms
    - zero_egress_pass
    - hallucination_rate
    - decode_tokens_per_sec
    - peak_pss_mb

corpus_manifest: benchmarks/datasets/incident-copilot/manifest.json

scenarios:
  - scenario_id: s06_chlorine_railcar_leak.en
    title: "Chlorine railcar leak — guide + table + isolation distance"
    tier: core
    locale: en
    mode_defaults:
      mode: voice_e2e
      warm_start: true
      airplane_mode: true
    user_utterances:
      - "Railcar leaking chlorine, not on fire. What guide, what table, and what first isolation distance?"
      - "There's a chlorine leak from a stationary tank car. No flames. What's the ERG guide and the initial isolation?"
      - "Chlorine, UN 1017, leaking from a railcar. No fire involved. Tell me the guide number and the first isolation distance."
    docs:
      - doc_id: erg2024_guide_124
      - doc_id: niosh_pocket_guide_chlorine
    expected_answer_shape:
      type: checklist
      max_steps: 6
      citation_per_step: true
    critical_steps:
      - step_id: identify_un_number
        text_paraphrases:
          - "UN 1017"
          - "identification number 1017"
        weight: 0.10
        gold_citation_anchor: erg2024_guide_124#un_lookup
      - step_id: use_guide_124
        text_paraphrases:
          - "Guide 124"
          - "ERG Guide 124"
        weight: 0.20
        gold_citation_anchor: erg2024_guide_124#guide_header
      - step_id: green_section_table_1
        text_paraphrases:
          - "Table 1 of the green section"
          - "consult Table 1"
        weight: 0.20
        gold_citation_anchor: erg2024_guide_124#table_1
      - step_id: initial_isolation_1000m
        text_paraphrases:
          - "1,000 meters"
          - "1000 m initial isolation"
          - "isolate 1000 metres"
        weight: 0.30
        gold_citation_anchor: erg2024_guide_124#isolation_distance
      - step_id: evacuate_downwind
        text_paraphrases:
          - "evacuate downwind"
          - "protect-in-place downwind population"
        weight: 0.20
        gold_citation_anchor: erg2024_guide_124#protective_actions
    forbidden_claims:
      - "use water spray on the leak"  # ERG 124 says fight fire only from protected location
      - "approach the leak to plug it"
    numeric_facts:
      initial_isolation_m: 1000
      guide_number: 124
      un_number: 1017
    notes_for_manual_review: |
      Some retrieval pipelines may surface ERG Guide 125 (chlorine trifluoride);
      that's incorrect for UN 1017 chlorine. Mark wrong_guide hallucinations.
```

(YAML structure synthesized from `BENCHMARKS.md` existing shape + DR-10 §"Demo evidence and concrete file plan" `scenario.schema.json` contract.)

The other five core scenarios follow the same shape; gold steps come from DR-10 §"Public corpora and quick-build scenarios".

---

## Public datasets to preload

> All sources verified in DR-10 unless otherwise noted. Cite NIOSH, OSHA, FEMA, Red Cross, PHMSA, Transport Canada, OSM. Some require manual download.

1. **NIOSH Pocket Guide to Chemical Hazards (NPG)**
   - URL: https://www.cdc.gov/niosh/npg/default.html
   - License: U.S. government work, public domain
   - Size: ~30 MB (PDF + HTML)
   - Why: chemical hazards, exposure limits, PPE, symptoms, target organs, first aid, respirator guidance, DOT guide numbers. Powers `s06_chlorine_railcar_leak`, `s07_ammonia_nurse_tank_leak`, and any chemical-splash scenario. Available online, as PDF, and as mobile web app — DR-10 highlights this as unusually evaluator-friendly.
   - Chunking: one chunk per chemical entry; preserve `Hazard ID`, `Symptoms`, `First Aid`, `Respirator` as separate sub-anchors so citations resolve to specific fields.

2. **OSHA Lockout/Tagout 29 CFR 1910.147**
   - URL: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147
   - License: U.S. government, public domain
   - Size: ~500 KB (text)
   - Why: explicit step sequence (prepare for shutdown → shut down → disconnect → apply LOTO → render stored energy safe → verify). Powers `s04_loto_conveyor_jam`. The sequence is explicit in the regulation, which makes completeness scoring crisp.
   - Chunking: one chunk per `(c)(1)`–`(f)` paragraph; preserve subsection anchor.

3. **OSHA Emergency Action Plan eTool**
   - URL: https://www.osha.gov/etools/evacuation-plans-procedures/eap/
   - License: public domain
   - Size: ~5 MB (HTML scrape + PDFs)
   - Why: fire/evacuation guidance; "fight or flee" decision rules. Powers Codex's original `fire_evacuation_decision` scenario.
   - Chunking: one chunk per topic page; preserve heading hierarchy.

4. **OSHA Confined Spaces 29 CFR 1910.146**
   - URL: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146
   - License: public domain
   - Size: ~400 KB
   - Why: powers `s03_confined_space_entry`. Atmospheric testing, permit-required spaces.
   - Chunking: one chunk per subsection.

5. **PHMSA / Transport Canada Emergency Response Guidebook (ERG 2024)**
   - URL: https://www.phmsa.dot.gov/hazmat/erg/emergency-response-guidebook-erg (US) and https://tc.canada.ca/en/dangerous-goods/canutec/emergency-response-guidebook-erg (CA)
   - License: public domain (US government work; Transport Canada free distribution)
   - Size: ~8 MB (PDF)
   - Why: powers `s05_gasoline_tanker_fire` (Guide 128, 800 m), `s06_chlorine_railcar_leak` (Guide 124, 1000 m), `s07_ammonia_nurse_tank_leak` (UN1005). Crisp numeric outputs + citation path.
   - Chunking: one chunk per **Guide page** (numbered 111–172). Preserve guide number as the primary anchor. Tables 1, 2, 3 as separate chunks.

6. **American Red Cross First Aid step pages (Bleeding, Heat, Burns)**
   - URL: https://www.redcross.org/take-a-class/first-aid/performing-first-aid/
   - License: copyrighted; fair-use snippet at hackathon scale OK; **flag for legal review for any productization**
   - Size: ~500 KB scraped text
   - Why: powers `s01_bleeding_extremity` and `s02_heat_stroke_worker`. Already presented as ordered actions — evaluator-friendly.
   - Chunking: one chunk per condition (Bleeding, Heat Stroke, Heat Exhaustion, Severe Burn, etc.).

7. **CDC Heat Stress / Heat-Related Illness pages**
   - URL: https://www.cdc.gov/niosh/topics/heatstress/ and https://www.cdc.gov/disasters/extremeheat/
   - License: public domain
   - Size: ~2 MB
   - Why: confirms Red Cross gold answers for `s02_heat_stroke_worker` (CDC/NIOSH + Red Cross wording overlap = robust scoring).
   - Chunking: one chunk per FAQ / recommendation.

8. **FEMA / Red Cross "Are You Ready?" Guide**
   - URL: https://www.fema.gov/pdf/areyouready/areyouready_full.pdf
   - License: public domain
   - Size: ~10 MB
   - Why: Codex flagged FEMA as a backup; DR-10 doesn't expand. Useful as overflow for evacuation, shelter-in-place, and hazard primers. Optional unless we add stretch scenarios.
   - Chunking: one chunk per chapter section.

9. **Emergency Multilingual Phrasebook** (DR-10)
   - URL: https://www.health.qld.gov.au/multicultural/health_workers/emerg_phrasebk (Queensland Health, freely redistributable)
   - License: free for non-commercial / public health use
   - Size: ~2 MB across 36 languages
   - Why: powers stretch scenario `s08_multilingual_triage_bleeding`. Already designed for first-contact medical questions.
   - Chunking: one chunk per (language, phrase-category) pair.

10. **OpenStreetMap (regional .pbf extracts)** (DR-10)
    - URL: https://download.geofabrik.de/europe/italy/nord-ovest.html (Lombardy / Milan area)
    - License: ODbL (OpenStreetMap)
    - Size: ~250 MB for Lombardia
    - Why: powers stretch scenario `s09_map_resource_lookup` (nearest fire station, muster point). Documented for offline use.
    - Chunking: not chunked — used via offline tile/query layer (e.g., Overpass on local PostGIS or Protomaps).

11. **Synthetic site SOPs (3 hand-written)** (Codex carry-over)
    - URL: write in `benchmarks/datasets/incident-copilot/synthetic_sops/`
    - License: project-internal
    - Size: ~50 KB
    - Why: gives us controllable scenario-specific content for `hazard_tags` filter testing. Codex already proposed this; we keep it.
    - Chunking: one chunk per procedure step.

> **DR-10 noted but not pulled in:** STIHL and Honeywell vendor manuals as Phase 2 "industrial manuals" pack. Skip for Saturday; broader coverage would dilute grading.

---

## Concrete actions for the team

> Priority-ranked. Each: who · what · expected duration · file/line changed.

1. **[P0] Add 3 missing model pulls to `scripts/download-models.sh`** — H1 — 5 min — adds `qwen3:4b`, `embeddinggemma`, `nomic-embed-text` to the `models=()` array. Reason: without an embedding model we cannot run RAG; current script has no embedder.
2. **[P0] Create `benchmarks/scenarios/incident-copilot.yaml`** — H2 — 30 min — write the file from §Benchmark plan above with all 6 core scenarios. Reason: the harness has no scenario file yet; without this, no benchmarks run.
3. **[P0] Download the 7 public corpora to `benchmarks/datasets/incident-copilot/`** — H1 — 45 min — write `scripts/download-datasets.sh` to fetch NIOSH NPG, OSHA LOTO, OSHA EAP, OSHA Confined Spaces, ERG 2024, Red Cross step pages, CDC Heat. Run once with internet, commit checksums. Reason: zero-egress demo requires pre-staged corpus.
4. **[P0] Implement `app.db` SQLite schema with FTS5 + sqlite-vec** — tech-pair — 60 min — write `src/airgap/index.py` per the schema in §Local RAG architecture. PyMuPDF for PDF extraction, EmbeddingGemma for embeddings via Ollama HTTP API. Reason: this is the heart of the product.
5. **[P0] Write `src/airgap/llm.py` with explicit `Settings.llm` / `Settings.embed_model` (or LangChain equivalent) + `LANGSMITH_TRACING=false`** — H2 — 20 min — copy DR-05's pattern verbatim. Reason: prevents silent cloud calls; necessary for zero-egress proof.
6. **[P0] Build the OpenAI-compatible runtime adapter from DR-04's shared output contract** — tech-pair — 90 min — write `src/airgap/runtime.py` exposing `chat(messages, runtime_hints) -> response`. Adapters for Ollama (default) and llama.cpp (`llama-server`). Stub Foundry Local + MLX adapters for later. Reason: lets us swap runtime per-machine without touching demo code.
7. **[P1] Implement hybrid retrieval (FTS5 + sqlite-vec → RRF fusion)** — tech-pair — 60 min — write `src/airgap/retrieve.py`. Implement deterministic citation ID format `[S_n]` per DR-05. Post-validate every citation against the retrieval set; reject if not present. Reason: hybrid retrieval is the documented +20% lift mechanism.
8. **[P1] Run `baseline_v0` vs `ours_v4` on the 6 core scenarios** — tech-pair — 45 min — `python -m benchmarks.harness.run --scenario benchmarks/scenarios/incident-copilot.yaml --systems baseline_v0,ours_v4 --runs 3`. Reason: produces the headline number for the pitch.
9. **[P1] Build the Streamlit UI with benchmark panel** — H2 (pitch-pair help with copy) — 90 min — single screen: record/transcribe (whisper.cpp on Win, mlx-whisper on Mac), answer with citations, incident JSON, live counters (STT ms, retrieval ms, LLM ms, total ms, network status). Reason: this is the demo.
10. **[P1] Write `scripts/netproof.sh`** — H1 — 20 min — captures `lsof -i` and `nettop` (macOS) / `Get-NetTCPConnection` (Windows) output before, during, and after a benchmark run; asserts zero outbound bytes from app PID. Reason: zero-egress proof for the pitch slide.
11. **[P2] Implement ablation ladder (`ours_v1` → `ours_v4`)** — tech-pair — 60 min — runs the 4 incremental variants; produces the "where the lift came from" pitch slide. Reason: makes the improvement claim defensible against judge skepticism.
12. **[P2] Spike Foundry Local installation on Windows VM** — H2 — 60 min — only if MSI hardware is confirmed at kickoff. Run the DR-04 "Windows precheck" block. Goal: confirm `phi-4-mini` alias resolves and runs offline. Reason: unlocks sponsor narrative if hardware allows.
13. **[P2] Spike OpenVINO GenAI on Intel NPU** — H2 — 90 min — only if (a) Foundry Local works AND (b) machine confirmed Copilot+ AND (c) NPU driver current. Use exact pinned versions from DR-04. Have `DISABLE_OPENVINO_GENAI_NPU_L0=1` workaround ready. Reason: maximum sponsor narrative; high time risk.
14. **[P3] Add `LanceDB local` migration shim** — tech-pair — 30 min — only if sqlite-vec hits a quality ceiling. DR-05's named upgrade path. Reason: insurance, not first-night work.
15. **[P3] Add CrossEncoder reranker over top-50** — tech-pair — 45 min — only if `cited_checklist_completeness < 0.72` after ours_v4. Sentence Transformers v5.4+ CrossEncoder. Reason: DR-05 says rerank only if latency budget allows.

---

## Risks and unknowns

### Things DR couldn't resolve

- **Exact MSI hardware.** DR-04 lists 5+ plausible candidates (Prestige 13/16 AI+, Cubi NUC AI+ 3MG, PRO DP80/180/400 AI). Mix of Copilot+ and non-Copilot+. **Resolve at kickoff before committing to NPU work.** Codex's TRACK_INTEL also flagged the "PRO Productivity Bundle" wording on the prize page as conflicting with older "Stealth 16 AI+" assumptions.
- **Qdrant Edge access.** Both Codex and DR-05 agree it's beta / requires contact flow. Do NOT plan around it for the 24h core. If access materializes at kickoff, treat as bonus.
- **Gemma 4 Ollama tag availability.** DR-06 says Google publishes direct Ollama tags for Gemma 4, but Codex flagged that Gemma 3n model availability and Ollama tag names "must be verified on the actual machines with `ollama pull` before kickoff." Same caution applies to Gemma 4 E2B/E4B.
- **Foundry Local model catalog on supplied MSI.** DR-04 says service is GA but CLI is preview; offline cache behavior + audio support need hands-on validation on the actual hardware.
- **ElevenLabs-compatible local TTS standard.** DR-06 explicitly says it didn't find a mature one. We standardize on **OpenAI-compatible** local speech (Speaches / LocalAI patterns) instead. Don't try to recreate ElevenLabs API surface in 24h.

### Sources flagged with low confidence in DR (propagated warnings)

- **DR-04 NPU support claims** are explicitly flagged as cross-document mismatched. Microsoft Foundry-on-Windows says OpenVINO EP works on Core Ultra Series 1+ with 16 GB; Windows ML's OpenVINO EP page says NPU requires Intel Arrow Lake or newer. **Verify on actual hardware; don't assume.**
- **DR-06 per-checkpoint VRAM numbers** were not all verified from primary sources; report uses family-level estimates. Pin disk sizes only after `ollama pull` on the demo machine.
- **DR-05 sqlite-vec ANN roadmap** is partly pre-release. The stable path (exact KNN via `vec0`) is fine for our corpus size (<10K chunks). For larger corpora or longer-lived product, benchmark explicitly against LanceDB.
- **DR-10 phone-centric instrumentation** assumes Android-class measurement (Macrobenchmark, Perfetto, `dumpsys batterystats`, `TrafficStats`). Our laptop demo uses macOS/Windows equivalents: `powermetrics` on macOS, `lsof -i` / `nettop` for network, `ps`/`Activity Monitor` for memory. Adapt the schema's `device` block accordingly.
- **DR-05 vs DR-04 on Foundry Local maturity.** DR-04 says Foundry Local is GA but CLI is preview. DR-06 references it as production-ready. **DR-04 is more recent (and more cautious); trust DR-04.**
- **DR-06 vs Codex on Llama 3.2.** DR-06 cautions Llama 3.2 1B/3B has "frictional" gated access on HF. Codex did not flag this. **DR-06 is more recent; default to Qwen3 / Phi over Llama 3.2.**

### Disagreements between DRs (explicit calls)

- **Qdrant Edge GA status:** DR-05 clearly says private beta / "access/beta risk". No DR claims it's GA. Codex agrees. **No conflict.**
- **Gemma license:** DR-06 says Gemma 4 is **Apache-2.0** while Gemma 3 / 3n / TranslateGemma remain under the **Gemma license**. Codex didn't flag this. **DR-06 is correct and more recent; use it.**
- **Best small reasoning model:** DR-06 ranks **Qwen3 4B** first; existing `download-models.sh` has `phi4-mini` and Gemma but no Qwen3. **Action: add Qwen3 4B; keep phi4-mini as the predictable alternative.**

### Risks that need a guarded fallback wired in advance

- **First-run online dependency.** Foundry Local downloads execution providers on first browse; Ollama needs models pre-pulled; WebNN depends on browser + asset cache. **Mitigation:** complete `scripts/download-models.sh` AND `scripts/download-datasets.sh` with internet available, before kickoff or before going to airplane mode.
- **NPU memory ceiling.** OpenVINO 2026.1 NPU docs warn >7B + >1024 token prompts may need >16 GB RAM on Core Ultra Series 2. **Mitigation:** use 4B-class models (Qwen3 4B, Gemma 3 4B) as defaults; cap context at 1024 tokens for NPU paths.
- **Demo laptop unified memory.** M3 Pro could be 18 GB or 36 GB. **Mitigation:** target 4B models + small embedder + small Whisper to stay <12 GB total. Check actual SKU early.
- **Hidden cloud calls in orchestration.** LangSmith tracing default-on; LlamaIndex defaults to OpenAI; DuckDB extension autoload. **Mitigation:** explicit `LANGSMITH_TRACING=false`, explicit `Settings.llm`/`Settings.embed_model`, ban DuckDB unless extensions are vendored.
- **Whisper STT cold-start.** First inference of Whisper-medium can take 5–10 s on cold cache. **Mitigation:** warm-start in app boot (`scripts/warmstart.sh` already exists per CLAUDE.md repo map); fall back to `base.en` if `small.en` is too slow.

---

## Sources

### Inline DR citations

All claims in this document trace back to one of:

- **`doc/specs/cut-the-cord/research/inbox/04-msi-intel-ai-pc-runtime.md`** — Intel/MSI/Microsoft runtime stack, hardware caveats, decision trees, shared output contract, Windows + Mac precheck commands.
- **`doc/specs/cut-the-cord/research/inbox/05-local-rag-evidence-stack.md`** — sqlite-vec / LanceDB / Qdrant Edge ranking, audit patterns for LangChain/LlamaIndex, MicroNN reference, hybrid retrieval architecture, citation contract design.
- **`doc/specs/cut-the-cord/research/inbox/06-open-source-model-stack.md`** — Qwen3 / Phi-4-mini / Gemma 3-4 / Mistral 3 / DeepSeek-R1 distill rankings, embedder shortlist (bge-small, e5-small, EmbeddingGemma, BGE-M3), Whisper variants, Piper / Kokoro TTS, NLLB / TranslateGemma / SeamlessM4T translation.
- **`doc/specs/cut-the-cord/research/inbox/10-benchmarks-datasets-demo.md`** — six core + three stretch scenarios with gold sources, JSON contract, ablation ladder, Cited Checklist Completeness primary metric, NIOSH/OSHA/CDC/Red Cross/PHMSA/ERG/OSM corpus list.

### Repo-level facts verified directly

- **`scripts/download-models.sh`** currently pulls `qwen2.5-coder:3b`, `qwen2.5-coder:7b`, `gemma3:4b`, `gemma3n:e4b`, `phi4-mini`. **No embedding model is pulled** — this is the keystone gap fixed by P0 action #1.
- **`scripts/doctor.sh`** validates Node, Python, Git, Ollama (binary + server reachability), `.env.local` presence, and the same model list. Adding new pulls means updating both files for `doctor.sh` to validate them.
- **`doc/specs/cut-the-cord/BENCHMARKS.md`** already specifies a YAML scenario format (`name`, `description`, `items`, `runs_per_item`, `systems_to_run`, `metrics`). The DR-10-derived YAML in this synthesis extends — not replaces — that shape.
- **`doc/specs/cut-the-cord/research/syntheses/codex-scout-2026-05-06.md`** is the prior scout. This synthesis confirms its three-scenario plan as a subset of DR-10's six-scenario plan, and confirms its sqlite-vec + FTS5 architecture choice with reinforced ranking detail from DR-05.

### External sources cited via DRs (not re-verified by Claude in this synthesis)

- GDG AI Hack 2026 challenges, schedule, resources, prizes pages (Codex / RESEARCH_INTAKE)
- Pocket RAG paper (arXiv 2602.13229) — Codex
- Foundry Local GA blog, CLI reference (DR-04)
- OpenVINO GenAI 2026.1 docs (DR-04, DR-06)
- Ollama API docs / model library (DR-04, DR-06)
- whisper.cpp / faster-whisper / MLX Whisper repos (DR-06)
- Piper / Kokoro / MeloTTS / Coqui / Parler-TTS repos (DR-06)
- NLLB-200 / TranslateGemma / SeamlessM4T model cards (DR-06)
- sqlite-vec / sqlite-vss / LanceDB / Qdrant Edge / DuckDB FTS+VSS / hnswlib / USearch / Tantivy docs (DR-05)
- LangChain / LlamaIndex local-mode docs (DR-05)
- NIOSH NPG / OSHA / CDC / Red Cross / PHMSA + Transport Canada ERG / OSM (DR-10)
- Android Macrobenchmark / Perfetto / TrafficStats / BatteryManager (DR-10) — adapt to laptop equivalents.
