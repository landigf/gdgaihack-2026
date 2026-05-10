# Houston

> A 100% offline, AI-powered Finder alternative for macOS — **plus a Mars Base
> AI Habitat Controller route** that demos how Rover's RAG substrate scales
> from "find a file on my laptop" to "diagnose an ECLSS fault on Sol 423".
> Cross-platform desktop app built on Tauri 2 + Rust. Demos in airplane mode.
>
> Built for the **GDG AI Hack Milano 2026 — MSI "Cut the Cord"** track.

## Two routes, one binary

| URL fragment | Route | Persona | Killer beat |
|---|---|---|---|
| `/`        | **Rover Finder** | semantic file search + summarize + note + filename + image-describe | bilingual query → top hit at 69% similarity |
| `/#ares`   | **Houston Mars** | greenhouse / survival / repair / voice on a 4-persona stack (KV-cache reuse) | typed-or-spoken **"Tray 4 EC sensor at 4.2 mS/cm"** → grounded NASA-cited diagnose + on-base parts checklist + 5-step repair procedure |

Both routes share **the same FAISS index, the same MLX-LM / Ollama generator,
the same `HOUSTON_PREFIX` system prefix** — Houston Mars is layered on top
of Rover Core RAG, not a parallel build. The architecture story is concrete
in the response payload (`powered_by: rover-core-rag+houston-repair`).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Houston                                          local · offline · private │
├────────────┬────────────────────────────────────────┬────────────────────┤
│  Folder    │  ⌕  presentazione budget alpha         │  Selected          │
│  ~/demo-…  │                                        │  alpha-budget-Q3.md│
│            │  📝 alpha-budget-Q3.md          69%   │  …/projects/…      │
│  [Index]   │  ~/demo-rover/projects/alpha-bud…     │                    │
│            │  ███████████████████░░░░░░░░░░         │  Reveal · Open ·   │
│  Try:      │  Project Alpha enters Q3 with a        │  Summarize · Note  │
│  budget…   │  revised budget of € 184,500…         │                    │
│  recipe…   │                                        │  - Total budget…   │
│            │  📝 alpha-budget-Q3.md          66%   │  - Capex/Opex…     │
│            │                                        │  - Vendor X risk…  │
├────────────┴────────────────────────────────────────┴────────────────────┤
│ ● sidecar: ready · localhost only      gemma3:4b · nomic-embed · FAISS  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Why local

| Pillar (rubric weight) | Houston's pitch |
|---|---|
| Ottimizzazione tecnica (30%) | Native Tauri 2 + Rust shell (~20 MB binary), single-machine, zero cloud |
| Utilità pratica (25%) | Find any file by *meaning*, not filename. Summarize. Generate notes. Open in Finder. |
| Integrazione creativa (25%) | Native folder picker, reveal-in-Finder, system file mutations gated by native confirm dialogs |
| Vantaggio competitivo locale (20%) | Airplane mode: zero external requests at runtime. €0 inference cost. Privacy by construction. |

## Architecture

```
┌─────────────────────────────────────────────┐
│  Houston.app  (Tauri 2 / Rust shell)          │
│  ┌─────────────────────────────────────┐    │
│  │  React renderer (Vite + Tailwind)   │    │
│  │  SearchBar · FileList · AIPanel     │    │
│  └────────────┬───────────────┬────────┘    │
│               │ invoke()      │ fetch       │
│  ┌────────────▼─────┐  ┌──────▼─────────┐   │
│  │ Rust commands    │  │ Python sidecar │   │
│  │ pick_folder      │  │ (FastAPI)      │   │
│  │ reveal_in_finder │  │ /index /search │   │
│  │ open_file        │  │ /summarize     │   │
│  │ create_note      │  │                │   │
│  │ confirm_move     │  │ FAISS · pypdf  │   │
│  │ move_file        │  │ tiktoken       │   │
│  └──────────────────┘  └────────┬───────┘   │
└─────────────────────────────────┼───────────┘
                                  │ HTTP localhost
                       ┌──────────▼──────────┐
                       │  Ollama (local)     │
                       │  gemma3:4b · gen    │
                       │  nomic-embed-text   │
                       └─────────────────────┘
```

**Process boundaries (deliberate):**
- Python sidecar = read-only information layer (parse · chunk · embed · search · summarize). Never touches user folders.
- Rust main = native OS write/dialog layer. Every mutation gated by a native confirm dialog.
- Renderer = stateless UI. Calls Python via `fetch`, calls Rust via `invoke()`.

## Install (end user)

The fastest path: download a signed-by-no-one-but-it-works `.dmg` from
the latest tagged release.

1. **Download** the latest `Houston_*.dmg` from the
   [Releases page](https://github.com/landigf/gdgaihack-2026/releases).
   (No login required — picks up `.app.zip` + `.dmg` from CI.)
2. **Open the .dmg**, drag **Houston** into `/Applications`.
3. **First launch:** macOS will warn *"unidentified developer"*. We
   didn't pay for an Apple notarization cert; the app is safe. Either:
   - Right-click the app → **Open** → **Open** in the dialog. *Or*
   - System Settings → Privacy & Security → **Open Anyway**.
4. **Make sure Ollama is running** locally with the models pulled:
   ```bash
   brew install ollama
   ollama serve &
   ollama pull gemma3:4b nomic-embed-text
   ```
5. **Open Rover.** First launch creates the Python venv at
   `~/Library/Application Support/app.houston.demo/backend/.venv`
   (~150 MB, ~1 min). The status footer goes green when ready.
6. **Pick a folder** via the toolbar's folder picker → click **Index folder**.
7. **Click "Mars Habitat"** in the sidebar to see the on-device Mars
   Habitat AI demo (greenhouse drill-in, voice loop, repair assist).

### Voice + STT (optional)

To use push-to-talk to Houston, drop the whisper.cpp model at
`~/.local/whisper-models/ggml-base.en.bin` (one-time, ~140 MB):

```bash
mkdir -p ~/.local/whisper-models
curl -L -o ~/.local/whisper-models/ggml-base.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
```

Text-to-speech ships natively (`/usr/bin/say`). No download needed.

## Install (developer)

If you want to hack on Rover, clone the repo and run:

```bash
./scripts/setup.sh        # pulls models + creates backend/.venv
bash scripts/dev.sh       # launches the live-reload dev stack
                          # (kills zombies, sets LLM_BACKEND=ollama,
                          #  caffeinate so wifi/sleep don't kill it)
```

Open http://127.0.0.1:1420 (Finder) or http://127.0.0.1:1420/#ares
(Mars demo).

Prereqs: macOS 12+, Rust 1.95, Node 22, Python 3.12, Ollama.

`setup.sh` is idempotent and pulls these models if missing:
- `gemma3:4b` — generation (~3.3 GB) — default `GEN_MODEL`
- `nomic-embed-text` — embeddings, 768 dim (~274 MB)

## Build (.app + .dmg) locally

```bash
. "$HOME/.cargo/env"
npx tauri build
```

Outputs:
- `src-tauri/target/release/bundle/macos/Houston.app`
- `src-tauri/target/release/bundle/dmg/Houston_0.1.0_aarch64.dmg`

The Python `backend/*.py` source ships inside the .app as a Tauri
resource. On first launch, [src-tauri/src/sidecar.rs](src-tauri/src/sidecar.rs)
copies it to `~/Library/Application Support/app.houston.demo/backend/`
and creates the venv there — no `setup.sh` needed for end users.

For tagged releases, [`build-mac.yml`](.github/workflows/build-mac.yml)
auto-publishes both files to the GitHub Release page. To cut a new
release:

```bash
git tag v0.1.0-demo && git push origin v0.1.0-demo
gh run watch        # watch the macOS runner build (~10 min)
gh release view v0.1.0-demo
```

## Demo script (3 minutes for judges)

Demo corpus lives at `/Users/fp/demo-rover/` (8 files, ~10 chunks):

```
demo-rover/
├── projects/
│   ├── alpha-budget-Q3.md          ← target of the headline query
│   ├── alpha-notes.md
│   ├── alpha-contract-draft.docx
│   └── beta-roadmap.md             ← semantic distractor (different project)
├── meetings/
│   ├── standup-2026-05-08.md
│   └── retro-2026-04-30.md
└── random/
    ├── ricetta-tiramisu.txt        ← Italian distractor
    └── vacanze-2025.md             ← bilingual distractor with budget tables
```

1. **Open Houston.** Footer dot turns green when sidecar is ready (~2 s warm).
2. **Pick `~/demo-rover/`** via the native folder picker.
3. **Click "Index folder"** — 8 files / 11 chunks / under 1 s.
4. **Type "presentazione budget progetto alpha"** — hit `Enter`.
   - Top hit: `alpha-budget-Q3.md` at score 0.69. Italian query, English doc — semantic match across languages.
5. **Click the result → Summarize.** 6 s on warm gemma3:4b. Markdown bullets in the AI Panel.
6. **Click "Create Note"** — a `summary-of-alpha-budget-Q3.md-…md` lands next to the source. Confirm via the macOS Finder.
7. **Click "Reveal in Finder"** — Finder window opens, file selected.
8. **Toggle Wi-Fi off and re-do steps 4–7.** Identical behavior. Show `./scripts/airplane-check.sh` returning 0.

## Mars Habitat AI · open `/#ares`

The same window also runs an on-device Mars Base AI Habitat Controller —
the **Cut the Cord physics-enforced offline argument**: 78 million km from
the closest data center, 14-day blackouts every 26 months, Earth-Mars
one-way light time 4–24 minutes. We didn't choose offline; Mars chose for us.

**Live numbers — MLX-LM Qwen2.5-3B-4bit + tile cache + code-as-action**
(measured on the demo machine, M3 Pro 18 GB):

| Metric | Naive baseline | **Optimized stack** | Win |
|---|---:|---:|---:|
| Decode tok/s (RAG prefill, 100 tokens) | 43.1 tok/s (Ollama gemma3:4b) | **57.6 tok/s** (MLX 3B) | **+34 %** |
| TTFT (RAG prefill, 100 tokens)         | 2249 ms | **1668 ms** | **−26 %** |
| Greenhouse + procedure A2A (warm)      | 8124 ms | **4050 ms** | **2.0× speedup** |
| Sensor cache trace 50d→20d→70d         | 2104 ms | **72 ms**  | **29.2× speedup** |
| Code-as-action `python_exec`            | (would need 2nd LLM round) | **438 ms** | LLM answers quantitative Q without 2nd decode |
| RAM under load                         | 10.2 / 18 GB | **9.09 / 18 GB** (50 %) | **9.86 GB headroom** |
| Outbound packets during demo           | 0 | **0** | airplane-check exit 0 |

**Endpoints (additive under `/ares`):**
- `POST /ares/houston/greenhouse` — narrate per-tray status, cite Veggie / APH chunks
- `POST /ares/houston/greenhouse/stream` — same, streamed via SSE (TTFT < 2 s)
- `POST /ares/houston/survival` — habitat / ECLSS tip + severity (NASA-STD-3001)
- `POST /ares/houston/repair` — **the killer query.** Free-text fault →
  diagnose + parts_needed + parts_missing (cross-checked against on-base
  inventory) + 3-5 step procedure + optional macOS-`say` TTS
- `POST /ares/voice/houston` — whisper.cpp + LLM + macOS `say` round-trip
- `POST /ares/voice/houston/text` — same pipeline minus ASR (demo-friendly
  text path)
- `GET  /ares/sensor/query` — tile-lattice cached (29× speedup)
- `GET  /ares/perf` — psutil snapshot + active backend label

**Demo flow (90 s, all offline):**
1. Open `http://127.0.0.1:1420/#ares` (or click the route toggle in the header)
2. Click HABITAT → Inventory drill-in (6 bars + 4-crew roster + Houston survival tip)
3. Click 🛠 **HOUSTON REPAIR ASSIST** (bottom-right amber button) → modal
   with 3 quick-pick faults
4. Send "Tray 4 EC sensor reading 4.2 mS/cm — fertilizer overdose"
5. Houston replies in ~3.8 s warm: WATCH severity, diagnosis with `[S1]`
   citation that opens the actual NASA Veggie PDF in macOS Preview, parts
   checklist (✓ available / ✗ REORDER NEXT RESUPPLY), 5-step procedure,
   optional spoken summary via `say`

Reproduce the benchmark plots (light-theme, no sudo, no internet):

```bash
. backend/.venv/bin/activate
python benchmarks/houston/make_light_figures.py
# → benchmarks/houston/out/light/{throughput,cache_lattice,houston_latency,
#                                 voice_breakdown,perf_timeline,a2a_kv_cache}.png
```

WhatsApp / Slides bundle of all 7 figures: `doc/plots-whatsapp/light/`
(plus a `REPRO_PROMPT.md` you can paste into another Claude / Codex on
any other machine).

The 2-page tech writeup (`doc/TECHNICAL_WRITEUP.{md,pdf}`) defends each
of the four MSI rubric sub-criteria — model selection, quantization,
memory management, inference speed — with a measured number per claim.

## Airplane mode proof

```bash
./scripts/airplane-check.sh
# → OK — no external network references in source.
```

Greps every `.py / .ts / .tsx / .rs` source file for `https?://` outside the
localhost / Tauri schema allow-list. Exit 0 means clean.

## Tech stack & footprint

| Layer    | What                                                    | Footprint |
|---------:|:--------------------------------------------------------|----------:|
| Shell    | Tauri 2.11 · Rust 1.95 · WebKit                         | ~20 MB    |
| Renderer | React 18 · Vite 6 · TypeScript 5 · Tailwind 3           | ~200 KB   |
| Sidecar  | Python 3.12 · FastAPI · uvicorn · faiss-cpu             | venv ~150 MB |
| Models   | gemma3:4b (Q4_K_M) + nomic-embed-text via Ollama        | ~3.6 GB on disk · ~3 GB resident |

## Tests

```bash
# Python sidecar
cd backend && . .venv/bin/activate && pytest -v
# → 14 passed

# Rust (smoke)
cd src-tauri && . "$HOME/.cargo/env" && cargo build
# → Finished `dev` profile

# Airplane mode
./scripts/airplane-check.sh
# → OK
```

## Out of scope (deliberate)

File watcher · auto-tagging · batch rename · TTS/STT · multi-folder
simultaneous indexing · drag&drop · cloud anything · authentication ·
multi-user · code signing / notarization · PyInstaller standalone sidecar.

These are all *plausible* features that would dilute the demo. Houston does
one thing — semantic file search with local AI actions — and does it
properly.
