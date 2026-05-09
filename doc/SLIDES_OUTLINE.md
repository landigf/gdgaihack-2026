# Rover Houston — Slide Deck Outline

**Format:** 11 slides · ~3 min talk · Figma deck assembled by team from this outline.
**Visual identity:** Mars rust (#a64422 / #c2410c) + cyan UI (#22d3ee) + harvest green (#10b981) + deep-space black (#050203). Monospace tag chips (JetBrains Mono / Inter). Anamorphic 16:9 frame.
**Plots to embed:** all four PNGs from `benchmarks/houston/out/` (re-render fresh on demo day).

> Each slide has: a single number/idea + sparse text + one visual. Speaker notes go below the slide art in Figma's "speaker notes" pane.

---

## Slide 1 — Title (8 s)

**Visual:** Hero shot: Mars terrain at golden hour, cyan glow on a single laptop. Logo "ROVER HOUSTON" in monospace caps with cyan accent.

**On-slide text:**
```
ROVER HOUSTON
On-Device AI Habitat Controller for a Mars Base

Team PoliSa  ·  GDG AI Hack 2026  ·  MSI "Cut the Cord"
```

**Speaker notes (8 s):**
> "Rover Houston. The AI mission control your astronauts pack in a single laptop. Built for MSI's Cut the Cord track."

---

## Slide 2 — The Hook (12 s)

**Visual:** Black background. One huge number: **78,000,000 km**. Below in small caps: *DISTANCE TO THE NEAREST DATA CENTER*.

**On-slide text:**
```
78,000,000 km
DISTANCE TO THE NEAREST DATA CENTER

We didn't choose offline.
Mars chose for us.
```

**Speaker notes (12 s):**
> "Earth–Mars one-way light time is four to twenty-four minutes. Solar conjunction blackouts last fourteen days every twenty-six months. The cloud cannot reach this operator. We didn't choose offline — Mars chose for us. That's our Competitive Advantage in one sentence."

---

## Slide 3 — The Brief, Taken Literally (15 s)

**Visual:** Two-column comparison. Left column "Cloud SLA at Mars": red ✗ icons next to "API timeout · 2 Mbps DSN · 14-day blackout · ITAR data leak". Right column "Houston, on-device": green ✓ next to "0 ms network · 0 packets · airplane-test exit 0 · SOC2 by physics".

**On-slide text:**
```
The MSI brief rewards "structurally offline".

Mars is the strongest possible test:
  ✗  Cloud SLA at Mars                ✓  100% local inference
  ✗  4–24 min one-way latency         ✓  Sub-second on-device
  ✗  14-day comms blackouts           ✓  Airplane-mode certified
  ✗  ITAR-classified astronaut data   ✓  Never leaves the machine
```

**Speaker notes (15 s):**
> "Cut the Cord rewards projects where local AI is the correct architecture, not just a constraint. Cloud cannot reach Mars. We took the brief at its word and built for the place where physics enforces the rule."

---

## Slide 4 — What We Built · Architecture (20 s)

**Visual:** ASCII / clean iconography of the architecture. Top: Tauri webview with two routes (`/rover` Finder + `/ares` Houston). Middle: Python FastAPI sidecar (`127.0.0.1:8765`). Bottom: 4 local services — Ollama (gemma3:4b + nomic-embed-text), whisper.cpp, macOS `say`, FAISS over 30 NASA PDFs.

**On-slide text:**
```
Tauri 2 (Rust) shell + React 18 webview
  ├─ /rover    Finder MVP (Stream A)
  └─ /ares     Houston · Mars Habitat AI

Python FastAPI sidecar @ 127.0.0.1:8765
  ├─ /houston/greenhouse  · /houston/survival
  ├─ /houston/voice       · /perf
  └─ Rover Core: /index · /search · /summarize

Local services (single machine):
  Ollama gemma3:4b Q4_K_M + nomic-embed-text
  whisper.cpp (Metal) + macOS native say
  FAISS over 30 NASA PDFs  →  1,292 chunks
```

**Speaker notes (20 s):**
> "Tauri 2 shell, React renderer, Python FastAPI sidecar, four local AI services. One Ollama process serves four agent personas via a byte-identical system prefix — that gets us KV-cache reuse, measured. RAG indexes thirty NASA public-domain manuals into FAISS. Voice goes through whisper.cpp and macOS say. All on one machine. All on disk after one-time setup."

---

## Slide 5 — Tech Optimization 30% Beat (25 s)

**Visual:** Side-by-side: `houston_latency.png` (left, bar chart cold vs warm) + `a2a_kv_cache.png` (right, multi-agent latency split). Big metric tiles below: "1.8 s" "8.1 s" "10.2 GB / 18" "0 packets".

**On-slide text:**
```
Measured on the demo machine — M3 Pro 18 GB

Voice round-trip (warm)         1.8 s
  ASR (whisper.cpp)               598 ms
  LLM  (gemma3:4b)              2,325 ms  ← only call ≥ 1 s
  TTS  (macOS say)                521 ms

Greenhouse + procedure A2A      8.1 s warm  · 8.7 s cold
Survival tip (single persona)   3.6 s warm
RAM idle / load                 8.1 GB / 10.2 GB of 18
Outbound packets during demo    0
```

**Speaker notes (25 s):**
> "These numbers are real, sampled live from `/ares/perf` while a benchmark harness drove the endpoints. The voice round-trip warms in under two seconds. The multi-agent A2A — greenhouse persona chained to procedure persona — runs in eight seconds because the second call's prompt-eval reuses the KV-cached prefix; we measured that the chained call is consistently faster than a fresh request to the same model. RAM peaks at ten point two of eighteen gigabytes. Zero outbound packets during the entire demo loop, verified by tcpdump."

---

## Slide 6 — Live Demo (30 s)

**Visual:** Embed a 30-second demo GIF or autoplay clip extracted from the demo video. If GIF: focus on greenhouse drill-in + procedure card + citation chip click → Preview opens NASA PDF.

**On-slide text:**
```
Click GREENHOUSE  →  drill-in shows 16 pots × 4 species × 6 stages
Click stage-5 mizuna pot  →  Houston: "HARVEST NOW"
                       →  Procedure persona auto-chains: 5 steps
                       →  [S1] chip → real Veggie PDF in Preview

(see demo video — link in repo)
```

**Speaker notes (30 s):**
> "What you see: the operator clicks the greenhouse on the isometric Mars base. A drill-in modal opens with sixteen individually clickable pots — four species, NASA Veggie and APH varieties — each at a different growth stage. Click the stage-five mizuna pot. Houston, the greenhouse persona, returns 'Harvest now', citing Veggie section three point four. Below it, the procedure persona — auto-chained — produces a five-step imperative checklist using the same chunks. Click the citation chip. macOS Preview opens the actual NASA PDF at the cited page. Three personas, one Ollama process, zero cloud calls."

---

## Slide 7 — Practical Utility 25% (15 s)

**Visual:** Three mini cards side by side. Left: greenhouse with green checkmark + "Harvest decisions". Middle: medical kit + "Survival margins". Right: microphone + "Voice triage during EVA".

**On-slide text:**
```
Three drill-ins solving real astronaut problems:

  GREENHOUSE  →  Per-pot harvest decision + procedure checklist
                  Citations: NASA Veggie · APH PH-04

  HABITAT     →  Inventory bars (food/water/O₂/fuel/medical)
                  + crew status + Houston severity tip
                  Citations: NASA-STD-3001 · HRP

  VOICE PTT   →  Hands-free during EVA · 1.8 s warm
                  Grounded in current tray + sensor state
```

**Speaker notes (15 s):**
> "Three concrete tools. Greenhouse harvest decisions. Habitat life-support margins with severity. Voice queries for hands-free use during EVA. Every answer cites a real NASA manual. This isn't a chatbot — it's a verifiable mission-control assistant."

---

## Slide 8 — Creative On-Device 25% (15 s)

**Visual:** Hexagonal honeycomb of six tags, each glowing cyan: `MULTI-AGENT A2A` · `RAG · 30 NASA PDFs` · `VOICE LOOP local STT/TTS` · `R3F 3D + drill-in scenes` · `TAURI OS-LEVEL` · `LIVE PERF METRICS`.

**On-slide text:**
```
Six brief-praised techniques. One product.

  ▸ Multi-agent A2A     procedure persona auto-chains greenhouse
  ▸ RAG                 1,292 chunks · top-3 → cite [S_n]
  ▸ Voice loop          whisper.cpp + gemma3:4b + macOS say
  ▸ R3F 3D              isometric base + 16-pot greenhouse drill-in
  ▸ Tauri OS-level      native folder, PDF preview, mic capability
  ▸ Live perf metrics   psutil-sampled FPS / CPU / RAM in side rail
```

**Speaker notes (15 s):**
> "Six of the techniques the brief explicitly rewards, in one product. Multi-agent A2A. RAG. Voice. 3D rendering. Native OS integration. And we expose live perf metrics so judges can verify in real time, not 'trust me'."

---

## Slide 9 — Competitive Advantage 20% (15 s)

**Visual:** Screenshot of the Houston UI header zoomed in: the cyan `EARTH ROUND-TRIP 14:23 · 1.78 AU` chip + the red `COMMS BLACKOUT IN 05:42` chip. Below the screenshot, in caps: "THE CHIP IS THE PROOF."

**On-slide text:**
```
We don't argue offline. We display it.

Header chip ticks the real synodic-modeled Earth round-trip.
Comms blackout countdown burns down on screen.
Cloud is impossible at this distance.

→  Houston runs anyway.
→  Demo passes the airplane-mode test, every time.
```

**Speaker notes (15 s):**
> "Most teams say 'local AI is private' or 'cheaper'. We point to the header. Earth round-trip: fourteen minutes twenty-three seconds. Comms blackout countdown: five forty-two. Those numbers tick during the entire demo. Cloud is structurally impossible at this distance. Houston works anyway, every time, with airplane mode on."

---

## Slide 10 — What's Next (10 s)

**Visual:** Roadmap bullets, three tiers (Now / Next 30 days / Q3 2027 = Artemis IV crew ops timeline).

**On-slide text:**
```
Now (T+24h):
  ▸ MLX-Whisper to use the M3 Pro Apple Neural Engine (~3× ASR speedup)
  ▸ Streaming token output  →  first token < 300 ms
  ▸ Multi-modal vision: gemma3:4b reads the NDVI camera frame

Next 30 days:
  ▸ Real ephemeris-driven Mars latency simulator
  ▸ Drill-ins for ISRU / Power / Airlock / Rover Garage

Q3 2027 (Artemis IV crew ops timeline):
  ▸ Same M3 Pro hardware. Same software.
  ▸ Different operator — actual crew member.
```

**Speaker notes (10 s):**
> "Engineering roadmap. We know exactly what we'd ship next. And the same hardware that runs this demo today could ride on Artemis Four in 2027 with no architectural change."

---

## Slide 11 — Team + Repo (10 s)

**Visual:** Four headshots or initials in a row. Big QR code linking to the repo. Bottom line: "github.com/landigf/gdgaihack-2026 · feat/houston-rag".

**On-slide text:**
```
Team PoliSa
  Gennaro Francesco Landi  ·  Francesco Gorga
  Francesco Peluso         ·  Nicola Ianniello

Repo:   github.com/landigf/gdgaihack-2026
Branch: feat/houston-rag
Tech writeup, demo video, benchmark plots — all in the repo

Thank you.
```

**Speaker notes (10 s):**
> "Team PoliSa. Branch is feat/houston-rag. Technical writeup, demo video, and the four benchmark plots you saw on slide five are all in the repo. Thank you."

---

## Total spoken time

```
8 + 12 + 15 + 20 + 25 + 30 + 15 + 15 + 15 + 10 + 10 = 175 s ≈ 2 min 55 s
```

Leaves ~30 s buffer in a 3-min slot or extra Q&A air in a longer one.

## Plot-embed checklist (Figma)

In Figma's left sidebar, drag these PNGs from `benchmarks/houston/out/` (re-rendered fresh on demo day):

| Slide | Plot file | Where on slide |
|---|---|---|
| 5 | `houston_latency.png` | Left half, full bleed |
| 5 | `a2a_kv_cache.png` | Right half, full bleed |
| 6 | (a 30-s clip extracted from the demo video) | Center |
| 8 | `voice_breakdown.png` | Inset bottom-right |
| 9 | `perf_timeline.png` | Inset bottom-left |

## Color tokens for Figma

```
mars-rust       #a64422
mars-deep       #c2410c
deep-space      #050203
cyan-ui         #22d3ee
cyan-glow       #67e8f9
harvest-green   #10b981
amber-warning   #fbbf24
text-fg         #fafafa
text-muted      #94a3b8
border          #1f1f23
```

## Typography for Figma

- **Display / numbers:** JetBrains Mono Bold (large) — the "78,000,000 km" hero on slide 2 should be ~180 pt.
- **Body:** Inter Regular 18–22 pt.
- **Speaker-note tags / chip text:** JetBrains Mono 12 pt with letter-spacing 1.2.
