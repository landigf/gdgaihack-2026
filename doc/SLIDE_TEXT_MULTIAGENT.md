# Slide — "Yes we have multi-agent — here's the architecture" (Figma paste)

If a judge asks *"il brief chiede agent-to-agent — l'avete davvero?"* this
slide answers in 25 seconds with a labelled diagram + measured receipts.
The architecture is already shipped on `feat/rover-final` / `main`; we
just don't *brand* it as "multi-agent" in the UI today. This slide makes
it visible.

---

## TITLE
**Multi-agent architecture · 4 specialised personas behind one Houston voice**

Subtitle: *not a chatbot — four specialists sharing a byte-identical system prefix so gemma3 reuses its KV cache between them. Measured 2× speedup vs separate prompts.*

---

## DIAGRAM (paste as a block — render in Figma with arrows + small icons)

```
                ┌──────────────────────────────────────────────────┐
                │              SHARED HOUSTON_PREFIX                │
                │  (≈ 400 tokens — bytes-identical across personas) │
                │  encodes role, NASA-corpus rules, citation format,│
                │  imperative voice, severity vocabulary            │
                └────────────────────────┬─────────────────────────┘
                                         │
                ┌────────────────────────┼─────────────────────────┐
                │              GREENHOUSE_TAIL                     │
                │   plant decisions · NDVI/EC/pH/PPFD/moisture     │
                │   verdict priority rules · cite Veggie + APH     │
                │   → POST /ares/houston/greenhouse(/stream)        │
                └────────────────────────┴─────────────────────────┘
                ┌────────────────────────┬─────────────────────────┐
                │               SURVIVAL_TAIL                       │
                │   habitat / ECLSS envelope · severity ladder      │
                │   ok / watch / critical · cite NASA-STD-3001      │
                │   → POST /ares/houston/survival                    │
                └────────────────────────┴─────────────────────────┘
                ┌────────────────────────┬─────────────────────────┐
                │              PROCEDURE_TAIL                       │
                │   chains AFTER greenhouse — converts a verdict    │
                │   into 3-5 imperative steps (prep→exec→verify     │
                │   →log→reset).  Demonstrates A2A: same process,   │
                │   same loaded weights, same prefix → KV-cache hit │
                │   → invoked from POST /ares/houston/greenhouse     │
                └────────────────────────┴─────────────────────────┘
                ┌────────────────────────┴─────────────────────────┐
                │                REPAIR_TAIL                        │
                │   diagnose + parts_needed cross-checked against   │
                │   on-base inventory + parts_missing (REORDER) +   │
                │   3-5 step procedure citing the same RAG          │
                │   substrate Rover Core uses                       │
                │   → POST /ares/houston/repair                      │
                └──────────────────────────────────────────────────┘
                ┌──────────────────────────────────────────────────┐
                │   VOICE LOOP (whisper.cpp → text → any persona →  │
                │   macOS `say` → audible reply)                    │
                │   → POST /ares/voice/houston(/text)                │
                └──────────────────────────────────────────────────┘
```

> *The dashed arrow* GREENHOUSE → PROCEDURE *is the live A2A. Same
> Ollama process, same loaded weights. Bytes-identical prefix means
> gemma3 reuses its KV cache — measured **8 124 ms naive → 4 050 ms
> shared = 2.0× speedup**. Plot in `a2a_kv_cache.png`.*

---

## RECEIPTS — measured wall time per persona

```
4 personas, serial calls, warm gemma3:4b on M3 Pro 18 GB, same fault payload:

  greenhouse · stream      4 499 ms     (FAISS retrieve + SSE LLM + parse)
  survival                 3 976 ms     (FAISS + LLM — KV reuse on same prefix)
  procedure  (chained)     ~1 700 ms    (KV warm — < 50 % of cold)
  repair                   6 386 ms     (RAG + inventory cross-check)
  voice/text (speak=False) 2 654 ms     (LLM only, no ASR)
                          ─────────
  cumulative               ~17 500 ms (17.5 s for the full council)
```

Plot: `benchmarks/houston/out/light/multiagent_serial.png`
(committed; ready to drop into the slide directly.)

---

## "WHO ANSWERS WHAT" CHEAT-SHEET (for jury Q&A)

```
┌────────────────────────────────────┬──────────────────┬────────────────────┐
│ Question style                      │ Persona          │ Endpoint            │
├────────────────────────────────────┼──────────────────┼────────────────────┤
│ "Is this tray ready?"               │ GREENHOUSE       │ /houston/greenhouse │
│ "What does CO₂ at 1100 say?"        │ SURVIVAL         │ /houston/survival   │
│ "How do I harvest mizuna?"          │ PROCEDURE (chain)│ /houston/greenhouse │
│ "EC sensor dead, what do I do?"     │ REPAIR           │ /houston/repair     │
│ "[mic] Hey Houston, status?"        │ VOICE → routes    │ /voice/houston      │
│ "[chip] open NASA Veggie page 14"   │ ROVER CORE RAG    │ /search             │
└────────────────────────────────────┴──────────────────┴────────────────────┘
```

The Repair persona explicitly delegates retrieval to **Rover Core's
search index** (same FAISS store the Finder uses) — its response
includes `powered_by: "rover-core-rag+houston-repair"` so the
architecture story is in the JSON payload, not just the README.

---

## FUTURE — adding more specialists is *additive*

The pattern is locked:
1. write a new `<NAME>_TAIL` in `backend/ares/prompts.py`
2. add `<name>_system()` accessor
3. add a `POST /ares/houston/<name>` route
4. share the same `HOUSTON_PREFIX` for free KV-cache hit

Specialists worth adding next iteration:
- **AGRO_FINDER** (search the Veggie corpus by symptom, not by
  filename — augments Rover Core)
- **TECH_EXPLAINER** (jury-mode persona that explains a chosen
  metric in plain English; you ask it on stage, not in a textarea)
- **EVA_DECISION** (suit-airlock-pressure routine cross-checked
  against NASA-STD-3001 §6 + crew sleep-debt)
- **HARVEST_LOGGER** (writes a structured journal entry every time a
  pot transitions to stage 5)

Each is 1 backend file + 1 prompt tail. The four levers we already
measured (KV cache reuse, tile cache, MLX swap, streaming SSE) keep
working without modification.

---

## VOICE-OVER (~25 s)

> "Yes — Houston is multi-agent under the hood. Four specialised
> personas: greenhouse decisions, life-support survival tips, harvest
> procedure chained as A2A, and repair with inventory cross-check.
> They all share a byte-identical system prefix, so gemma3 reuses its
> KV cache between calls — we measured a 2× speedup vs separate
> prompts. From the operator's seat it speaks with one voice. Behind
> the scenes it's four files in `backend/ares/prompts.py`. Adding a
> fifth specialist is one new tail string and one new route — the
> caching, the streaming, the tile cache all keep working. We just
> didn't surface the agent boundary in the UI; this slide makes it
> visible."

---

## DESIGN NOTES (for whoever assembles the slide in Figma)

- **Diagram**: 5-row stack (PREFIX top, 4 personas below). Use a
  faint dashed border to show "shared prefix". Each persona row
  uses a 2-column layout: role description (left) + endpoint pill
  (right monospace).
- **GREENHOUSE → PROCEDURE arrow**: dashed, with small "KV-cache
  reuse · 2.0×" tag.
- **Receipts table**: same monospace as Slide 6 (5-phase grid). Use
  cyan `#0891b2` for measured times.
- **Cheat-sheet**: 3 columns, alternating row tints (`#0a0a0a` /
  `#0f1115`).
- **Plot insert**: drop `multiagent_serial.png` (1400 × 600) full
  bleed beneath the diagram — bars already match the slide palette.
- Footer chip: `architecture: backend/ares/prompts.py · receipts: benchmarks/houston/out/light/`.

---

## REFERENCES (for the slide footer)

- `backend/ares/prompts.py:20-101` — HOUSTON_PREFIX + 4 persona tails
- `backend/ares/router.py:444,572,1119,1242,886,1016` — 4 + 2 endpoints
- `benchmarks/houston/out/light/multiagent_serial.png` — measured wall time
- `benchmarks/houston/out/light/a2a_kv_cache.png` — 2.0× cache reuse speedup
- `benchmarks/houston/out/light/tokens_per_sec_distribution.png` — 30-call median 29.7 tok/s, σ < 1.5
