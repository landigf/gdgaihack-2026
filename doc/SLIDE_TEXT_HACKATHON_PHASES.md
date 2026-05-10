# Slide — "How we followed the brief" (paste into Figma)

Drop this content into a single Figma slide. Keep keyword-density:
short lines, one number per phase, no full sentences. Print font:
JetBrains Mono / IBM Plex Mono. Use the same accent palette as the
deck (cyan #22d3ee for headers, amber #fbbf24 for receipts).

---

## TITLE
**How we followed the brief — five phases, five receipts**

---

## BODY (5 columns or 5 stacked rows)

```
┌──────────────────────────────────────────────────────────────────────┐
│ PHASE 1 · DOMAIN                                                       │
│   Mars · physics-enforced offline                                      │
│   4–24 min light-time · 14-day blackouts · cloud unreachable          │
├──────────────────────────────────────────────────────────────────────┤
│ PHASE 2 · HARDWARE AUDIT                                               │
│   M3 Pro · 18 GB unified · 14-core GPU · 16-core ANE                   │
│   3B beats 7B · 57.6 vs 28.7 tok/s (measured)                         │
├──────────────────────────────────────────────────────────────────────┤
│ PHASE 3 · OLLAMA + LM SETUP                                            │
│   Ollama gemma3:4b baseline · MLX Qwen2.5-3B-4bit op-point             │
│   one-line swap: LLM_BACKEND={ollama,mlx,auto}                         │
├──────────────────────────────────────────────────────────────────────┤
│ PHASE 4 · SOFTWARE INTEGRATION  (not a chatbot)                        │
│   Tauri folder picker · Reveal in Finder · macOS say · mic capability  │
│   citation [S_n] chips → NASA PDF in Preview                           │
│   Mars dashboard hash-routes inside the same .app                      │
├──────────────────────────────────────────────────────────────────────┤
│ PHASE 5 · DEMO DESIGN                                                  │
│   airplane-check.sh exit 0 · tcpdump 0 packets / 90 s                  │
│   browser-mode graceful overlay (no `invoke` crash)                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ALTERNATIVE — single-line check-list version (if column layout is tight)

```
✓ Phase 1 — Domain        Mars · 78M km · cloud physically unreachable
✓ Phase 2 — Hardware      M3 Pro · 18 GB · 3B beats 7B 57.6 vs 28.7 tok/s
✓ Phase 3 — Ollama setup  gemma3:4b + MLX-3B-4bit · one-line swap
✓ Phase 4 — Integration   Tauri OS · NASA PDFs in Preview · in-app Mars view
✓ Phase 5 — Demo          airplane-check 0 · tcpdump 0 packets · graceful fallback
```

---

## VOICE-OVER (15 s)

> "We checked all five boxes the brief asks for. Domain — Mars, where
> cloud is *physically unreachable*. Hardware — 18 GB M3 Pro, we tested
> 3B against 7B and the smaller model wins on this GPU. Ollama plus MLX
> with a one-line backend swap. Integration — not a chatbot in a terminal:
> Tauri opens NASA PDFs in Preview, the Mars dashboard lives inside the
> same .app. Demo — airplane-mode tested, zero outbound packets, graceful
> fallback when opened in a browser. Five phases, five receipts."
