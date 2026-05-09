# GDG AI Hack 2026 — Submission Portal Values

Single source of truth for every field on the submission portal. Copy-paste these
values at 11:55 CEST and click Submit. Deadline: **Sunday May 10 · 12:00 CEST**.

---

## Project name

```
Rover Houston
```

## Elevator pitch (≤ 600 chars)

```
Rover Houston is a 100% on-device AI Habitat Controller for a Mars base, running on a single MacBook M3 Pro 18 GB. We didn't choose offline — Mars chose for us: 78 million km from the closest data center, 14-day comms blackouts every 26 months. Multi-agent A2A sharing one Ollama process via byte-identical prefix (KV-cache reuse, measured). RAG over 30 NASA manuals. Streaming MLX, first token under 2 seconds. Voice loop: whisper.cpp + macOS say. Click greenhouse → Houston cites Veggie §3.4 → NASA PDF opens. Zero packets out, airplane-mode verified.
```

(Updated 2026-05-10 ~02:30 CEST: parallel session shipped streaming MLX,
cold TTFT 1 786 ms with RAG context. Pitch now quotes streaming +
"first token under 2 seconds" instead of the static 8.1 s warm number.)

## Slide deck URL

```
TODO — paste Figma deck share link here once team finishes assembly
       (outline: doc/SLIDES_OUTLINE.md, content + speaker notes + plot refs)
```

## Code repository URL

```
https://github.com/landigf/gdgaihack-2026/tree/feat/houston-rag
```

(Public repo. Default branch `main` shows the Rover Finder MVP from Stream A;
the Houston Mars work lives on `feat/houston-rag` — judges click the branch
selector or use the URL above.)

## Demo video URL

```
TODO — paste unlisted YouTube link once user records + uploads
       (script: pipelines/video-prompt-gemini.md, 2 min, 8 shots)
```

## Technical writeup URL

```
TODO — paste Google Doc share link once user copies doc/TECHNICAL_WRITEUP.md
       into a fresh Google Doc and sets "anyone with the link can view"
       (PDF copy also committed in repo at doc/TECHNICAL_WRITEUP.pdf)
```

---

## Mapping every deliverable to the rubric (30/25/25/20)

| Criterion | Where the judges find evidence |
|---|---|
| **Tech Optimization 30%** | Slide 5 (latency plots, A2A KV-cache plot, perf timeline). Tech writeup §5 (measured numbers table). Demo video shot 7 (live perf footer + tcpdump). Repo `benchmarks/houston/out/*.png`. |
| **Practical Utility 25%** | Slides 6–7 (3 drill-ins solving real astronaut problems). Tech writeup §1–2. Demo video shots 4–5 (greenhouse + inventory). |
| **Creative On-Device 25%** | Slide 8 (six brief-praised techniques in one product). Tech writeup §3 (multi-agent + RAG ladder). Demo video shot 4 (procedure A2A card) + shot 6 (voice loop). |
| **Competitive Advantage 20%** | Slides 2 + 9 (physics enforces offline). Tech writeup §1 + §8. Demo video shot 1 + shot 7 (Mars latency chip + tcpdump). |

## Mandatory-rule compliance (binary disqualification check)

- ✅ **Zero cloud AI**: `bash scripts/airplane-check.sh` exits 0 (greps source for any external URL); `tcpdump -i any -nn` during demo: 0 outbound packets in 90 s.
- ✅ **100% local inference**: gemma3:4b + nomic-embed-text via Ollama (`localhost:11434`) + whisper.cpp on CPU/Metal + macOS native `say` for TTS. All models on disk after one-time setup.
- ✅ **OS / software integration**: Tauri 2 native folder picker, citation chips open NASA PDFs in macOS Preview at the cited chunk, mic permission via Tauri capability, audio playback via HTML `<audio>`.
- ✅ **Single machine**: every agent, ASR, TTS, FAISS index, and inference runs on the same MacBook M3 Pro.
- ✅ **Airplane-mode test**: documented in tech writeup §8; reproduced live in demo video shot 7.

---

## Submission day timeline

| Time | Action |
|---|---|
| **T-3:00** (09:00 CEST) | Final benchmarks rerun; refresh plots; commit + push |
| **T-2:00** (10:00 CEST) | Final demo dry-run with airplane mode ON; stopwatch ≤ 90 s |
| **T-1:00** (11:00 CEST) | Slide deck export; tech writeup Google Doc finalized; demo video uploaded |
| **T-0:15** (11:45 CEST) | Open submission portal, paste fields from this doc |
| **T-0:05** (11:55 CEST) | Final review — every field has a real URL |
| **T-0:00** (12:00 CEST) | Click Submit |

## Team

```
Team: PoliSa
Lead:    Gennaro Francesco Landi
Members: Francesco Gorga · Francesco Peluso · Nicola Ianniello
```
