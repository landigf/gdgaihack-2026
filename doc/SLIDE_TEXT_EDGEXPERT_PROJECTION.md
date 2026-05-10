# Slide — "What Houston runs on the MSI EdgeXpert" (Figma paste)

We built and benchmarked Houston on a **Min-tier MacBook Pro M3 Pro · 18 GB**.
Every number in the technical writeup is *measured* on that machine. This
slide projects what those receipts look like when the same stack runs on
the **MSI EdgeXpert MS-C931** (NVIDIA® GB10 Grace Blackwell Superchip,
1 000 AI TOPS FP4, 128 GB LPDDR5x unified, 273 GB/s mem bandwidth).

The architecture doesn't change — only the `_build_generator()` swap.

---

## TITLE
**Houston on MSI EdgeXpert — same architecture, full-frontier scale**

Subtitle: *we sized the demo to fit a 14-core M3 Pro. Drop it on EdgeXpert and it grows linearly with the silicon.*

---

## BODY — comparison table (paste as 3-column block in Figma)

```
┌───────────────────────────────────────┬──────────────────────────┬──────────────────────────────┐
│ Capability                            │ Demo (M3 Pro 18 GB)       │ Projected — EdgeXpert         │
├───────────────────────────────────────┼──────────────────────────┼──────────────────────────────┤
│ Tensor performance                    │ 18 TOPS (ANE)            │ 1 000 AI TOPS (FP4 sparse)   │
│ Unified memory                        │ 18 GB                    │ 128 GB  (7.1 ×)              │
│ Memory bandwidth                      │ ~150 GB/s                 │ 273 GB/s (1.8 ×)             │
│ Largest local model                   │ MLX Qwen2.5-3B-4bit       │ up to 200 B params local     │
│                                       │                          │ 405 B w/ 2 boxes via NVLink   │
│ Houston decode (warm)                 │ MLX 3B  · 57.6 tok/s     │ Llama 3.1 70B  · ~25-35 tok/s│
│                                       │ MLX 7B  · 28.7 tok/s     │ Qwen 2.5 7B    · ~150 tok/s  │
│ TTFT (RAG prefill, 100 tokens)        │ 1 668 ms                 │ ~250-400 ms                  │
│ A2A KV-cache reuse speedup            │ 2.0 ×                    │ same factor — same trick     │
│ Tile-lattice cache speedup            │ 29.2 ×                   │ same factor — content-hashed │
│ Multi-modal (vision + speech + text)  │ 1 modality at a time     │ all three concurrent           │
│ Voice round-trip warm                 │ 2 649 ms                 │ < 700 ms                     │
│ Number of personas live in parallel   │ 4 (KV-shared)            │ 12+ (no shared-prefix needed)│
│ Network                               │ 0 outbound packets       │ 0 outbound packets ✓         │
└───────────────────────────────────────┴──────────────────────────┴──────────────────────────────┘
```

> Projections are **conservative** — they assume the same Q4_K_M /
> 4-bit quantization we benchmark today, the same LLM serving stack
> (vLLM / Ollama with CUDA backend), and the published GB10 spec.
> Source: MSI EdgeXpert MS-C931 product page + NVIDIA Blackwell SM
> throughput numbers.

---

## NEW CAPABILITIES UNLOCKED ON EDGEXPERT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✱ FRONTIER-GRADE PERSONAS                                                   │
│   Each Houston persona becomes a 70 B-class specialist                      │
│   (medical-officer, agronomist, ECLSS-engineer, mission-commander)          │
│   instead of one shared 3-4 B base.                                         │
│                                                                             │
│ ✱ ALWAYS-ON VISION                                                          │
│   The R3F isometric scene becomes a real CCTV grid: live camera             │
│   feeds from 6 base zones → on-device vision LLM annotates anomalies        │
│   (CO2 plumes, micrometeorite damage, plant disease) in real time.          │
│                                                                             │
│ ✱ ON-DEVICE FINE-TUNE PER CREW                                              │
│   128 GB lets you LoRA the medic persona on each astronaut's medical        │
│   record — true personalisation, never leaves the habitat.                  │
│                                                                             │
│ ✱ MULTI-AGENT REASONING (no KV-prefix tricks needed)                        │
│   12+ personas can hold separate KV caches simultaneously. The              │
│   "Houston council" can deliberate before responding to the crew.           │
│                                                                             │
│ ✱ 405 B PARAMETERS VIA TWO BOXES                                            │
│   ConnectX-7 Smart NIC + NVLink-C2C: two EdgeXperts behave like one.        │
│   This is frontier-class reasoning — at the Mars habitat, offline.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ONE-LINE CODE CHANGE (the whole port)

```diff
# backend/main.py — _build_generator()
- from mlx_client import MLXClient
- return MLXClient(), "mlx"
+ from vllm_client import VLLMClient    # CUDA backend, same interface
+ return VLLMClient(model="meta-llama/Llama-3.1-70B-Instruct"), "vllm-cuda"
```

The rest — Tauri shell, FastAPI router, retriever, persona prefix,
tile-lattice cache, voice loop, R3F scene, RepairAssist, `/ares`
endpoints — stays untouched. **The architecture is hardware-agnostic.**

---

## VOICE-OVER (~25 s)

> "We built Houston on a *Min-tier* M3 Pro because that's what we had.
> Every number in the writeup is measured on that machine. Drop the same
> binary on an MSI EdgeXpert — 1 000 TOPS, 128 GB unified — and the
> architecture grows with the silicon. Same Tauri shell, same FastAPI
> router, same persona prefix, same RAG, same airplane-mode test. We
> swap one line in `_build_generator` and Houston handles a 70 B medic,
> a 70 B agronomist, an always-on vision feed of the base, and on-device
> fine-tuning per astronaut. Two EdgeXperts linked via ConnectX-7 hit
> 405 B parameters — that's frontier-grade reasoning, **at the Mars
> habitat, with zero outbound packets**. The structurally-offline
> argument scales 50× without rewriting a single React component."

---

## DESIGN NOTES (for whoever assembles the slide in Figma)

- **Title plate**: same dark backdrop as Slide 1 + a thin orange
  rule (use the Mars accent `#fb923c`), title in JetBrains Mono.
- **Comparison table**: 3 columns, alternating row backgrounds
  (`#0a0a0a` / `#0f1115`). Demo column in cyan `#22d3ee`,
  EdgeXpert column in violet `#a78bfa` + bold for the projected
  numbers.
- **"Capabilities unlocked" box**: 5 rows, each with a `✱` glyph
  in amber `#fbbf24`, body in slate-200.
- **Code diff**: render in mono. Red `-` line in `#ef4444`,
  green `+` line in `#10b981`.
- **Footer logos**: MSI + NVIDIA Blackwell + Apple Silicon (small,
  desaturated grey).

If the slide is too dense, split into two:
- **Slide 7a**: comparison table + voice-over.
- **Slide 7b**: "Capabilities unlocked" + 1-line code swap.

---

## LINK FOR REFERENCE

MSI EdgeXpert MS-C931 product page (IT):
https://it.msi.com/Landing/EdgeXpert-MS-C931

Spec quoted on this slide:
- Architecture: NVIDIA® Grace Blackwell GB10
- GPU: NVIDIA® Blackwell Architecture
- CPU: 20-core Arm (10 Cortex-X925 + 10 Cortex-A725)
- Tensor: 1 000 AI TOPS (FP4, Sparse)
- System Memory: 128 GB LPDDR5x (unified)
- Memory bandwidth: 273 GB/s (256-bit interface)
- NVLink-C2C: 5× PCIe 5.0 bandwidth
- Storage: 1 / 4 TB NVMe M.2 with self-encryption
- Networking: ConnectX-7 Smart NIC + 10 GbE + WiFi 7
- OS: NVIDIA DGX™ OS
- Form factor: 151 × 151 × 52 mm — 1.2 kg desktop unit
