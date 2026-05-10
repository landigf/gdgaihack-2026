# Handoff per Francesco Peluso — file map + come migliorare il technical writeup

> **Branch:** `main` (head `af46825` + i commit di Codex sul writeup).
> **Setup:** clone della repo + `bash scripts/setup.sh` una volta sola.
> Tutti i comandi qua sotto si runnano dalla repo root.
>
> **Tu hai 2 ore.** Concentra l'attenzione sul writeup (§ 2). Tutto
> il resto è già pronto e committed. Se devi cambiare un numero,
> ASSICURATI che esista in `benchmarks/houston/out/light/*.csv` o
> `summary.json` — la `JURY_QA_TRUTHFUL.md` esiste apposta per
> evitare bugie sul palco.

---

## 1 · Mappa dei file (dove sta cosa)

### Documenti per la submission (tutti su `main`)
| File | Cosa fa | Quando aprirlo |
|---|---|---|
| [doc/SUBMISSION_FORM.md](SUBMISSION_FORM.md) | testo paste-ready per OGNI campo del portale (project name, elevator pitch ≤600 char, repo URL, deck URL, video URL, writeup URL) + checklist pre-submit + cheat-sheet numeri | T-30 minuti dal submit |
| [doc/JURY_QA_TRUTHFUL.md](JURY_QA_TRUTHFUL.md) | risposte VERE alle 14 domande della Q&A drill (Q1–Q29). Contiene anche la lista "**🚨 DO NOT SAY**" delle 6 claim inventate dell'altra drill | **stampa e portala sul palco** |
| [doc/PRESENTATION_SCRIPT.md](PRESENTATION_SCRIPT.md) | choreographia palco (cord-cut beat, cue chi-dice-cosa) — più vecchia, da cross-checkare con la Figma deck attuale | rehearsal |
| [doc/SLIDE_TEXT_HACKATHON_PHASES.md](SLIDE_TEXT_HACKATHON_PHASES.md) | slide "5-phase compliance" pronta da incollare | nella deck dopo la slide problem |
| [doc/SLIDE_TEXT_FILE_MANAGER_PROBLEM.md](SLIDE_TEXT_FILE_MANAGER_PROBLEM.md) | sostituisce la slide lorem "Problems with file managers" con il framing **"File systems are made for storage, not survival"** | rimpiazza slide 3 della Figma |
| [doc/SLIDE_TEXT_MULTIAGENT.md](SLIDE_TEXT_MULTIAGENT.md) | slide "yes we have multi-agent" con i 4 personas + grafo A2A | da inserire dopo le slide benchmark |
| [doc/SLIDE_TEXT_EDGEXPERT_PROJECTION.md](SLIDE_TEXT_EDGEXPERT_PROJECTION.md) | proiezione su MSI EdgeXpert (1000 TOPS NVIDIA Blackwell, 128 GB unified) | post-team slide, "scale-up story" |
| [doc/SLIDE_TEXT_BENCHMARKS_BONUS.md](SLIDE_TEXT_BENCHMARKS_BONUS.md) | descrizioni paste-ready per OGNI plot delle 2 slide bonus + matrix "what's missing" se la giuria preme | bonus slide deck-end |
| [doc/VIDEO_SCRIPT_90s.md](VIDEO_SCRIPT_90s.md) | script 1:30 per il demo video con timestamps + cosa dire ad alta voce + fallback se qualcosa rompe live | quando registriamo il video |
| [doc/SLIDES_KEYWORDS_WHATSAPP.txt](SLIDES_KEYWORDS_WHATSAPP.txt) | keyword-only paste in WhatsApp per coordinare il team | rehearsal |

### Technical writeup (la parte su cui DEVI lavorare)
| File | Cosa fa |
|---|---|
| **[doc/TECHNICAL_WRITEUP.tex](TECHNICAL_WRITEUP.tex)** | **sorgente LaTeX** ufficiale. Codex ha rifatto questo passando da pandoc/markdown a `latexmk + xelatex` direct. **Tutte le modifiche al testo vanno qui.** |
| [doc/TECHNICAL_WRITEUP.pdf](TECHNICAL_WRITEUP.pdf) | output rigenerato da `bash scripts/build-writeup-pdf.sh`. **2 pagine, ~308 KB.** Non editare manualmente — viene riscritto a ogni build. |
| [doc/TECHNICAL_WRITEUP.md](TECHNICAL_WRITEUP.md) | ora è solo uno stub che punta al .tex. Ignora. |
| [scripts/build-writeup-pdf.sh](../scripts/build-writeup-pdf.sh) | comando per rigenerare il PDF da .tex |

### Plot e benchmark (tutti già misurati e committed)
| Path | Cosa contiene |
|---|---|
| `benchmarks/houston/out/light/*.png` | **9 plot light-theme** già committati. I 5 dentro al PDF: throughput, cache_lattice, a2a_kv_cache, perf_timeline, voice_breakdown. I bonus (NON nel PDF, possono andare nelle slide): tokens_per_sec_distribution, hardware_load_60s, multiagent_serial, houston_latency |
| `benchmarks/houston/out/light/*.csv` | dati grezzi dietro ogni plot. Se Francesco modifica un numero nel writeup, il CSV è la source of truth |
| `benchmarks/houston/out/summary.json` | dump JSON compatto con TUTTI i numeri principali |
| `benchmarks/houston/jury_qa_bench.py` | runner che produce i 4 plot bonus (re-runnable se vuoi rifare le misure) |
| `benchmarks/houston/make_light_figures.py` | runner che produce i plot light-theme dal CSV |

### Codice
| Concern | File |
|---|---|
| Mars demo principale | [src/ares/AresApp.tsx](../src/ares/AresApp.tsx) |
| Greenhouse drill-in | [src/ares/views/GreenhouseDetail.tsx](../src/ares/views/GreenhouseDetail.tsx) |
| Houston Repair Assist | [src/ares/components/RepairAssist.tsx](../src/ares/components/RepairAssist.tsx) |
| PDF viewer (PDF.js + highlight) | [src/ares/components/PdfViewer.tsx](../src/ares/components/PdfViewer.tsx) |
| Voice loop | [src/ares/components/VoicePTT.tsx](../src/ares/components/VoicePTT.tsx) |
| Backend Houston router | [backend/ares/router.py](../backend/ares/router.py) |
| 4 personas (HOUSTON_PREFIX) | [backend/ares/prompts.py](../backend/ares/prompts.py) |
| Crew roster | [src/ares/state/inventoryState.ts](../src/ares/state/inventoryState.ts) (Peluso · Gorga · Landi · Ianniello) |

### Dev stack
- `bash scripts/dev.sh` — kill zombies + relaunch Tauri dev sotto caffeinate. Quando "127.0.0.1 refused to connect" appare, runna questo.
- `LLM_BACKEND=ollama GEN_MODEL=gemma3:4b` — env vars di default per stabilità (MLX 7B causava GPU hang)
- Sidecar: `127.0.0.1:8765` · Vite: `127.0.0.1:1420` · Mars demo: `http://127.0.0.1:1420/#ares`
- `tail -f /tmp/rover-final.log` — log live

---

## 2 · Come migliorare il TECHNICAL_WRITEUP

### Stato attuale (committato da Codex stamattina)

- Sorgente: [doc/TECHNICAL_WRITEUP.tex](TECHNICAL_WRITEUP.tex) (~8 KB)
- LaTeX class: `extarticle 9pt`, margine 0.46 in, font Helvetica Neue + Menlo per code
- Pagina 1: tagline + diagramma architettura LaTeX-style (boxes/arrows) + diagramma multi-agent personas + tabelle compatte
- Pagina 2: 5 plot embedded (`throughput.png`, `cache_lattice.png`, `a2a_kv_cache.png`, `perf_timeline.png`, `voice_breakdown.png`)
- Tono: più compatto del precedente, leggibile, **2 pagine esatte** verificate

### Comando per rigenerare il PDF

```bash
bash scripts/build-writeup-pdf.sh
pdfinfo doc/TECHNICAL_WRITEUP.pdf | grep Pages
# expected: Pages: 2
```

Richiede `latexmk` + `xelatex` (MacTeX o BasicTeX). Già installato sul demo machine. Se manca: `brew install --cask mactex-no-gui`.

### Cose da migliorare (priorità)

**🔴 Alto valore (fai questi prima):**

1. **Eyeball check del PDF a stampa.** Apri `doc/TECHNICAL_WRITEUP.pdf` in Preview, zoom 100%, verifica che:
   - Niente testo tagliato a fine pagina
   - I 5 plot non si sovrappongono e hanno padding sufficiente
   - Il diagramma architettura (pagina 1) è leggibile (non microscopico)
   - I link sono cliccabili e cyan (`hyperref` package è già wired)
   - Le tabelle non hanno cifre tronche o overflow

2. **Sostituisci ogni numero che NON è nei CSV.** Apri `benchmarks/houston/out/summary.json` + `tokens_per_sec.csv` + `hardware_load_60s.csv`. Per OGNI numero nel .tex (`Quanti?`, `tok/s`, `ms`, `MB`, `GB`, `×`), cerca nel CSV/JSON. Se non c'è, sostituisci con qualcosa che c'è. La `JURY_QA_TRUTHFUL.md` ha la tabella receipts.

3. **Verifica le 5 phase del brief sono nominate esplicitamente.** Il writeup dovrebbe dire chiaramente:
   - Phase 1 (domain): Mars · physics-enforced offline
   - Phase 2 (hardware audit): M3 Pro 18 GB · 14-core GPU · 16-core ANE · 3B beats 7B
   - Phase 3 (Ollama setup): gemma3:4b + nomic-embed-text + MLX swap one-line
   - Phase 4 (software integration): Tauri 2 + R3F + voice + PDF.js + sidebar Mars route
   - Phase 5 (demo design): airplane-check exit 0 · tcpdump 0 packets · graceful browser fallback

   Se Codex ha tagliato qualcuna per stare in 2 pagine, riaggiungila come bullet sintetico.

**🟡 Medio valore:**

4. **EdgeXpert forward path.** Una riga sul fatto che `_build_generator()` è un one-line swap → MSI EdgeXpert (1000 TOPS · 128 GB unified) è già nel `SLIDE_TEXT_EDGEXPERT_PROJECTION.md`. Aggiungere una frase nel writeup ("ports to MSI NPU once mlx-lm exposes Core ML target") consolida la storia per i giudici MSI.

5. **License attribution row.** I plant GLB sono CC-BY (Sketchfab). Una riga in fondo tipo "*3D plant assets © Sketchfab CC-BY 4.0 — see [doc/screenshots/README.md](screenshots/README.md) for attribution.*" copre la licenza.

6. **Reproduce one-liner.** Il writeup originale aveva un paragrafo finale `bash scripts/setup.sh && ... && LLM_BACKEND=mlx npm run tauri:dev`. Verifica che sia ancora lì, perché un giudice serio prova a clonare.

**🟢 Polish (solo se hai tempo):**

7. **Add a footnote to each measured number.** Per i numeri critici (57.6 tok/s, 2.0×, 29.2×, 9.09 GB) aggiungi una footnote LaTeX `\footnote{measured 5-run median, see \texttt{benchmarks/houston/out/light/throughput.csv}}`. Aiuta la jury a verificare al volo.

8. **Date stamp.** Aggiungi in piccolo nella prima riga la data di compilazione (`\today`) — alcuni giudici controllano se il PDF è "fresco".

### Anti-pattern (NON fare)

- ❌ Non aggiungere numeri inventati. Se vuoi un numero per impressionare e non c'è nel CSV, runna il bench e MISURALO. `python benchmarks/houston/jury_qa_bench.py --plot all` re-genera tutti i plot bonus in ~3 minuti.
- ❌ Non sforare le 2 pagine. Il brief MSI dice esplicitamente "max 2 page technical report". Se aggiungi cose, taglia altrove.
- ❌ Non aggiungere acronimi senza espandere alla prima occorrenza (RAG, FAISS, KV-cache, TTFT, ASR, TTS). I giudici non-ML li conoscono solo se espansi.
- ❌ Non dire "we plan to" / "we will". Tutto al passato o presente — il jury legge per quello che hai FATTO, non quello che farai.

### Build cycle (1-2 minuti per iterare)

```bash
# 1. Edita doc/TECHNICAL_WRITEUP.tex
nano doc/TECHNICAL_WRITEUP.tex   # o VS Code

# 2. Rigenera il PDF
bash scripts/build-writeup-pdf.sh

# 3. Verifica 2 pagine + apri Preview
pdfinfo doc/TECHNICAL_WRITEUP.pdf | grep -E "Pages|File size"
open doc/TECHNICAL_WRITEUP.pdf

# 4. Quando ti piace, commit + push
git add doc/TECHNICAL_WRITEUP.tex doc/TECHNICAL_WRITEUP.pdf
git commit -m "docs(writeup): <quello che hai cambiato>"
git push origin main
```

Il PDF nella Release v0.1.0-demo punta a `https://github.com/landigf/gdgaihack-2026/blob/main/doc/TECHNICAL_WRITEUP.pdf` quindi cambia ogni volta che pushi.

### Quando consideri "done"

- [ ] PDF è esattamente 2 pagine (`pdfinfo` lo conferma)
- [ ] Tutti i numeri esistono in `benchmarks/houston/out/light/` o `summary.json`
- [ ] Le 5 phase del brief sono identificabili al volo
- [ ] Plot embedded sono leggibili a stampa B/N (test: stampala una volta in B/N e leggila a 30 cm)
- [ ] Link cliccabili al repo + alle Release
- [ ] Reproduce paragraph in fondo

---

## 3 · Submission portal — checklist finale

Quando il writeup è pronto, da `doc/SUBMISSION_FORM.md` copia:

| Campo portal | Dove copiare |
|---|---|
| Project name | sezione 1 (`Houston · On-Device Mars Habitat AI`) |
| Elevator pitch | sezione 2 (versione 580-char) |
| Slide deck URL | metti il Figma share URL (ricorda: "anyone with the link") |
| Code repo | `https://github.com/landigf/gdgaihack-2026` ✅ già pubblico |
| Demo video URL | YouTube unlisted (registrato seguendo `VIDEO_SCRIPT_90s.md`) |
| Tech writeup URL | usa il link diretto: `https://github.com/landigf/gdgaihack-2026/blob/main/doc/TECHNICAL_WRITEUP.pdf` |

**T-30 min dal submit:** runna `bash scripts/airplane-check.sh` (deve uscire 0). Apri il `.dmg` da [https://github.com/landigf/gdgaihack-2026/releases/tag/v0.1.0-demo](https://github.com/landigf/gdgaihack-2026/releases/tag/v0.1.0-demo) — verifica che mostri l'icona astronauta e si apra senza errori.

**T-5 min dal submit:** Wi-Fi off → ripeti il flow del demo video → se funziona identico, click Submit.

---

## 4 · Q&A on stage — il sopravvivere

Stampa **doc/JURY_QA_TRUTHFUL.md**. Contiene risposta TRUTHFUL a ogni domanda probabile. Le 6 claim **DO NOT SAY** sono in cima — non parlare mai di:
- "40-55 tok/s" (il vero numero è 29.7 median / 57.6 MLX)
- "two deterministic verifier modules" (sono solo prompt rules)
- "68 grounded queries 100% citation resolution" (mai misurato)
- "0.78 cosine, 0.86 precision@3" (mai misurato)
- "7 OWASP injections tested" (mai testato)
- "200-page PDF in 16s" (no benchmark)

Se ti chiedono uno di questi, dì la verità + offri di MISURARE LIVE: `python benchmarks/houston/jury_qa_bench.py --plot all`.

---

## 5 · Status corrente (af46825)

✅ Mars demo funziona offline al 100%  
✅ Voice path testato (refusal Earth-clock + crew names reali)  
✅ Repair Assist con citation excerpt + PDF.js highlight  
✅ Lettuce + Pepper + Tomato GLB sui ripiani (Mizuna procedurale)  
✅ Crew roster: Peluso · Gorga · Landi · Ianniello  
✅ Icona astronauta sul `.app` bundle  
✅ Background custom .dmg rimosso (default Apple)  
✅ Multi-agent slide + EdgeXpert slide + Hackathon-phases slide + Q&A truthful — tutti committati  
✅ Release `v0.1.0-demo` pubblica + scaricabile senza login  

⚠️ **Da finalizzare:** technical writeup polish (questa pagina), demo video registrazione, slide Figma assembly dai SLIDE_TEXT_*.md.

Buon lavoro!
— Houston / Gennaro
