# Rover

> A 100% offline, AI-powered Finder alternative for macOS. Semantic file search
> + on-device LLM actions. Cross-platform desktop app built on Tauri 2 + Rust.
> Demos in airplane mode.
>
> Built for the **GDG AI Hack Milano 2026 — MSI "Cut the Cord"** track.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Rover                                          local · offline · private │
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

| Pillar (rubric weight) | Rover's pitch |
|---|---|
| Ottimizzazione tecnica (30%) | Native Tauri 2 + Rust shell (~20 MB binary), single-machine, zero cloud |
| Utilità pratica (25%) | Find any file by *meaning*, not filename. Summarize. Generate notes. Open in Finder. |
| Integrazione creativa (25%) | Native folder picker, reveal-in-Finder, system file mutations gated by native confirm dialogs |
| Vantaggio competitivo locale (20%) | Airplane mode: zero external requests at runtime. €0 inference cost. Privacy by construction. |

## Architecture

```
┌─────────────────────────────────────────────┐
│  Rover.app  (Tauri 2 / Rust shell)          │
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

## Install

One-shot setup (Rust toolchain + Ollama models + Python venv + npm):

```bash
./scripts/setup.sh
```

Prerequisites you bring: macOS 12+ · Python 3.12 · Node 22+ · Ollama running.

`setup.sh` is idempotent and pulls these models if they're not present:
- `gemma3:4b` — generation (~3.3 GB) — default `GEN_MODEL`
- `qwen3:4b` — heavier alternative; export `GEN_MODEL=qwen3:4b` on M4 Pro / 24 GB+
- `nomic-embed-text` — embeddings, 768 dim (~274 MB)

## Run (dev)

```bash
. "$HOME/.cargo/env"
npm run tauri:dev
```

The Rust main spawns the Python sidecar at boot and emits a `sidecar-status`
event when it's healthy. The footer dot turns green when ready.

## Build (.app + .dmg)

```bash
. "$HOME/.cargo/env"
npx tauri build
```

Outputs:
- `src-tauri/target/release/bundle/macos/Rover.app`
- `src-tauri/target/release/bundle/dmg/Rover_0.1.0_aarch64.dmg`

The Python `backend/` directory ships as a Tauri resource. The bundled `.app`
expects `backend/.venv` to be present (run `setup.sh` once on the demo machine
before launching from the .dmg).

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

1. **Open Rover.** Footer dot turns green when sidecar is ready (~2 s warm).
2. **Pick `~/demo-rover/`** via the native folder picker.
3. **Click "Index folder"** — 8 files / 11 chunks / under 1 s.
4. **Type "presentazione budget progetto alpha"** — hit `Enter`.
   - Top hit: `alpha-budget-Q3.md` at score 0.69. Italian query, English doc — semantic match across languages.
5. **Click the result → Summarize.** 6 s on warm gemma3:4b. Markdown bullets in the AI Panel.
6. **Click "Create Note"** — a `summary-of-alpha-budget-Q3.md-…md` lands next to the source. Confirm via the macOS Finder.
7. **Click "Reveal in Finder"** — Finder window opens, file selected.
8. **Toggle Wi-Fi off and re-do steps 4–7.** Identical behavior. Show `./scripts/airplane-check.sh` returning 0.

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

These are all *plausible* features that would dilute the demo. Rover does
one thing — semantic file search with local AI actions — and does it
properly.
