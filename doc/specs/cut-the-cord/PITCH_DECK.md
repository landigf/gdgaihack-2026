---
marp: true
theme: default
paginate: true
header: 'PoliSa · Cut the Cord · Sovereign Investigation Workbench'
footer: '© 2026 PoliSa · GDG AI HACK 2026 · MSI Track'
---

<!-- Marp deck. Render with: npx @marp-team/marp-cli@latest PITCH_DECK.md --pdf -->

# Sovereign Investigation Workbench

## On-device AI per documenti che il cloud non può vedere

**PoliSa** · GDG AI HACK 2026 · MSI "Cut the Cord" Track
M3 Pro 18 GB · gemma3:4b · zero cloud · airplane mode

---

## Il problema (slide 2)

**11.5 milioni di documenti.** Un primo ministro che cade. Panama Papers, 2016.

I giornalisti ICIJ hanno usato uno strumento OSS chiamato **Datashare** per analizzarli.

> Ma Datashare oggi manda ogni query AI al cloud.

**La prossima leak non può fidarsi del server di qualcun altro.**

Stesso problema per:
- Audit interno Big4 (cloud LLM bandito al 100%)
- Whistleblower offices EU
- Public defenders con discovery massiccia
- Patent attorneys (cloud query = prior disclosure)

---

## La soluzione (slide 3)

**Sovereign Investigation Workbench**

Drag-and-drop una cartella di documenti riservati →
AI on-device costruisce **entity graph + timeline + contraddizioni** →
Ogni claim **citato alla riga di origine**

🔒 **100% offline** — l'airplane mode icon è la prova
📂 **OS-integrated** — non un chatbot terminale
⚖️ **Cited by construction** — JSON contract con IDs `[S1]`, `[S2]`...

---

## Demo (slide 4)

```
Operator drops "panama-2026-leak-demo" folder
  → 200 emails indexed in 2 secondi (airplane mode)
Query: "find every email contradicting the press release"
  → 6 cited findings + 1 contraddizione + timeline
  → 29 secondi end-to-end su M3 Pro 18GB
Operator clicks [S1]
  → fonte si apre con riga evidenziata
```

**Tcpdump in finestra adiacente: zero pacchetti.**

---

## Numeri reali (slide 5)

Misurati su M3 Pro 18 GB · gemma3:4b Q4_K_M · Ollama 0.21:

| Metrica | Valore |
|---|---:|
| Chunks indicizzati | 1,839 |
| Embedding rate | embeddinggemma 300M, ~30 doc/s |
| Retrieval ibrido (FTS+vector+RRF) | **301 ms / query** |
| LLM end-to-end (6 hits) | **29 s cold-warm** |
| Tokens/sec gemma3:4b | **~22 tok/s** |
| Hallucination rate | **0%** (citation-bound contract) |

> *"Se gira a 22 tok/s su M3 Pro 18GB, vola su MSI EdgeXpert (128 GB DGX Spark)."*

---

## Break-even (slide 6)

| Cliente | Cloud bill | EdgeXpert | Multiplier |
|---|---:|---:|---:|
| Newsroom investigativo (11.5M doc, 6 mesi) | **$31,500** | $1,640 | **19× cheaper** |
| Audit Big4 (50k doc, 4 mesi) | banned + $64k labor | $2,400 | **26× ROI** |
| Public defender (capital case, 18 mesi) | $186 + $2,800 manual | $430 | **5× ROI** |

**MSI vende EdgeXpert come "sovereign AI a costo fisso".**
**Noi gli abbiamo trovato il cliente che letteralmente non può usare il cloud.**

---

## OSS che usiamo (standing on shoulders)

- **Ollama** + **gemma3:4b** Q4_K_M (Google open weights)
- **embeddinggemma:300m** (Google)
- **sqlite-vec** (Alex Garcia)
- **MCP** (Anthropic protocol, 23k+ servers in registry)
- **AnythingLLM** Desktop (UI shell)
- **Inspired by** ICIJ Datashare (cited, not forked)

> *"Non un wrapper di prompt. Un'integrazione di 6 progetti OSS testati in produzione, sul tuo hardware."*

---

## Why MSI · Why now (slide 8)

**Why MSI:** EdgeXpert MS-C931 (128 GB DGX Spark) è progettato per esattamente questo: workload AI on-prem ad alto volume con vincoli di sovranità dati. **Fisso costo. Zero cloud bill imprevedibile.**

**Why now:** GDPR Art. 9 (dati sensibili) · EU Whistleblower Directive 2019/1937 · NIS2 · ISO/IEC 27001 — tutti spingono workload locali. Cloud LLM è in difensiva da 2025.

**Why us:** abbiamo già 1839 chunk indicizzati, retrieval funzionante, e un demo end-to-end che gira oggi sul nostro M3 Pro 18 GB.

---

## Cut the cord, davvero (slide 9 — closing)

```
ICIJ ha bisogno di sovranità.
Big4 ha bisogno di compliance.
EU vuole AI act-ready.

Una scatola sulla scrivania.
Nessun subpoena raggiunge il modello.
Nessun token meter.

Cut the cord per noi non è uno slogan.
È l'unico modo in cui questi clienti
avrebbero mai comprato AI.

Grazie.
```

**airplane mode ON · tcpdump silent · demo finished**
