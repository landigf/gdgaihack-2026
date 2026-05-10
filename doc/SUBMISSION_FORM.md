# Submission form — paste-ready content

> **Team:** PoliSa — Cut the Cord · On-Device AI · Building for MSI
> **Members:** Gennaro Francesco Landi (lead) · Francesco Gorga · Francesco Peluso · Nicola Ianniello
> **Last updated:** 2026-05-10

Copy each block into the matching field on the GDG AI Hack 2026 portal.
Drafts autosave every 8 s; only click the final submit button when every
URL below resolves and the demo video is uploaded.

---

## 1 · Project name (≤ 100 chars)

```
Houston · On-Device Mars Habitat AI
```

(34 chars. Optional — defaults to "PoliSa" if blank, but "Houston" is
the brand the .dmg ships under and what the README + .dmg installer
display, so use it.)

---

## 2 · Elevator pitch (≤ 600 chars · current draft = 580 chars)

```
Houston is a 100% on-device Mars Habitat AI controller running on a single MacBook M3 Pro 18 GB. We didn't choose offline — Mars chose for us: 78M km from the closest data center, 14-day comms blackouts every 26 months, 4–24 min light-time. 4 LLM personas share a byte-identical KV-cache prefix (2.0× speedup measured). RAG over 30 NASA public-domain manuals; click any citation [S1] → embedded PDF.js viewer highlights the cited paragraph. Voice loop offline (whisper.cpp + macOS say, 2.6s warm). Tile-lattice sensor cache (29× speedup). Zero packets out, airplane-mode verified.
```

### Backup pitch — shorter (≤ 350 chars · in case the form has stricter limits)

```
Houston: 100% on-device Mars habitat AI on one 18 GB MacBook. 4 LLM personas with shared KV-cache (2× speedup). RAG over 30 NASA PDFs — click [S1] and the cited paragraph is highlighted in an embedded PDF viewer. Offline voice loop. 29× sensor-cache speedup. Tcpdump-verified zero outbound packets. Same architecture ports to subs, Antarctic stations, field hospitals.
```

### Backup pitch — Italian variant (in case the form is locale-aware)

```
Houston è un AI Habitat Controller 100% on-device per una base su Marte, su un singolo MacBook M3 Pro 18 GB. Non abbiamo scelto offline — Marte ha scelto per noi (78M km, 4-24 min light-time, 14 giorni di blackout). 4 LLM personas condividono un prefisso byte-identico per riusare la KV cache (2× speedup misurato). RAG su 30 manuali NASA; click [S1] apre il PDF reale con il paragrafo evidenziato. Voice loop offline. Cache sensori 29× più veloce. Zero pacchetti in uscita verificati con tcpdump.
```

---

## 3 · Slide deck URL

> **Status:** Figma deck owned by the team. Set permission to *anyone with
> the link can view*. Paste the public Figma share URL when the deck is
> finalised. Outline + speaker content paste-ready in:
> - [doc/SLIDE_TEXT_HACKATHON_PHASES.md](SLIDE_TEXT_HACKATHON_PHASES.md) — 5-phase compliance
> - [doc/SLIDE_TEXT_MULTIAGENT.md](SLIDE_TEXT_MULTIAGENT.md) — multi-agent A2A
> - [doc/SLIDE_TEXT_EDGEXPERT_PROJECTION.md](SLIDE_TEXT_EDGEXPERT_PROJECTION.md) — MSI EdgeXpert scale-up
> - [doc/SLIDES_OUTLINE.md](SLIDES_OUTLINE.md) — original 11-slide deck outline
> - [doc/SLIDES_KEYWORDS_WHATSAPP.txt](SLIDES_KEYWORDS_WHATSAPP.txt) — WhatsApp-paste keywords

```
https://www.figma.com/deck/<TEAM_DECK_ID>?node-id=...&t=<token>
```

(Replace with the actual Figma share URL once the deck is locked.)

---

## 4 · Code repository URL ✅ DONE

```
https://github.com/landigf/gdgaihack-2026
```

Public, on `main`. Latest tag: `v0.1.0-demo` with downloadable
`.dmg` + `.app.zip`:
**https://github.com/landigf/gdgaihack-2026/releases/tag/v0.1.0-demo**

---

## 5 · Demo video URL

> **Status:** to be recorded by the team. ~2 minutes. Upload to YouTube
> as **Unlisted** (anyone with the link can view, doesn't appear in
> search), then paste the link here.

Pre-baked storyboard + voice-over script:
[pipelines/video-prompt-gemini.md](../pipelines/video-prompt-gemini.md)

```
https://youtu.be/<VIDEO_ID>
```

---

## 6 · Technical writeup URL

Two options — use either or both:

### Option A — direct repo link (always works, no Drive)

```
https://github.com/landigf/gdgaihack-2026/blob/main/doc/TECHNICAL_WRITEUP.pdf
```

### Option B — Google Doc copy (set "anyone with the link can view")

Source markdown: [doc/TECHNICAL_WRITEUP.md](TECHNICAL_WRITEUP.md)

```
https://docs.google.com/document/d/<DOC_ID>/edit?usp=sharing
```

(Paste the .md content into a fresh Google Doc, share publicly, paste
that URL here.)

---

## 7 · Pre-submission checklist

- [ ] **Demo dry-run on the demo machine** — `bash scripts/dev.sh`,
      open `http://127.0.0.1:1420/#ares`, walk through:
      - Click GREENHOUSE → drill-in → 4 species visible
      - Click HABITAT → 4 team members listed (Peluso/Gorga/Landi/Ianniello)
      - Click 🛠 REPAIR ASSIST → "Tray 4 EC..." → click `[S1]` →
        click "Open PDF · highlight cited" → PDF.js modal opens with
        the cited paragraph highlighted in yellow
      - Voice "What time in Rome?" → refusal, not fabrication
      - Voice "What's the crew?" → real names
- [ ] **Airplane test** — toggle Wi-Fi off → repeat the demo → identical behavior
- [ ] **`tcpdump`** — `sudo tcpdump -i any -nn 'not (host 127.0.0.1 or host ::1)'`
      during the 90-s demo → 0 outbound packets
- [ ] **Print** [doc/JURY_QA_TRUTHFUL.md](JURY_QA_TRUTHFUL.md) — bring it on stage
- [ ] **Re-watch** the demo video before clicking final submit
- [ ] **Verify** every form URL above resolves without auth

---

## 8 · Critical numbers cheat-sheet (memorise BEFORE submit)

| Metric | Number | Source file |
|---|---:|---|
| Decode tok/s (Ollama gemma3:4b, warm median) | **29.7** | `tokens_per_sec.csv` |
| Decode tok/s (MLX Qwen2.5-3B-4bit, warm median) | **57.6** | `throughput.csv` |
| TTFT (RAG prefill, 100 tokens, MLX) | **1 668 ms** | `throughput.csv` |
| A2A KV-cache reuse speedup | **2.0×** | `a2a_kv_cache.png` |
| Tile-lattice cache speedup | **29.2×** | `cache_lattice.csv` |
| RAM peak under load | **9.09 / 18 GB** (50 %) | `hardware_load_60s.csv` |
| Outbound packets / 90 s demo | **0** | `tcpdump` |
| NASA PDFs indexed | **30** | `mars-corpus/` |
| FAISS chunks | **1 292** | `summary.json` |
| Number of LLM personas | **4** | `prompts.py` |
| Voice round-trip warm | **~2.6 s** | `voice_runs.csv` |

**Do NOT say** any number that is not in this table or `summary.json`.

---

## 9 · One-liner contingency answers (if cornered)

| Awkward question | One-liner that's still truthful |
|---|---|
| "What's missing for production?" | "Sidecar HTTP auth, OWASP injection sanitization, and reranker on the retriever. All on the post-submission roadmap." |
| "How does this beat Claude Desktop?" | "Domain verdict schema with mandatory citations, telemetry-aware UI, license-clean preloaded corpus. None of the incumbents combine all three." |
| "Why Italian team names in the crew?" | "PoliSa is the Italian engineering team — Politecnico-Salerno. The crew names match the four people building the demo on stage." |
| "Why is MSI relevant?" | "MSI EdgeXpert is the production hardware target — 1 000 TOPS NVIDIA Blackwell, 128 GB unified. Same `_build_generator()` swap, 50× scale-up. Slide 7." |
| "What does the .dmg include?" | "Tauri shell + bundled Python sidecar + 30 NASA PDFs + FAISS index. Single-machine, zero-cloud at runtime. Ollama is the only host requirement (free, local, brew install)." |

---

## 10 · Final submit gate

Only click **Submit** when:
- ✅ All 4 mandatory URLs (slide deck, repo, demo video, plus tech writeup) resolve in an incognito browser tab without auth.
- ✅ The Tauri `.dmg` from the GitHub Release downloads + installs + opens cleanly on a fresh user account.
- ✅ The demo dry-run + airplane test passed both runs in a row.
- ✅ JURY_QA_TRUTHFUL.md is printed and on the podium.

Time of writing: **2:03:21** until submissions close.
