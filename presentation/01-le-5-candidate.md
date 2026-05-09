# 🗳️ Le 5 candidate Cut the Cord — leggi e vota

> **Il team ha preparato 5 alternative complete** prima del kickoff. Ognuna è un branch separato, ognuna ha già: idea semplice, slide pitch pronte, spec tecnica.
> Devi capirle, votare, e poi ci concentriamo SOLO sulla vincitrice.
> **Deadline voto: stasera ~23:00.** Il voto del leader del team (landigf) è **ALPHA**.

---

## 📊 Matrice di confronto rapido

| Code | Nome | Pitch score¹ | Rischio build² | Pre-work riusato | Mood |
|:-:|---|:-:|:-:|:-:|---|
| 🏆 **ALPHA** | Sovereign Investigation Workbench | **2.70** | 🟡 MED | 95% | "narrativa morale fortissima, GIÀ FUNZIONA" |
| 🟢 **BETA** | Control-Room Copilot | 2.40 | 🟢 LOW | 100% | "safest fallback, demo solido" |
| 🟠 **GAMMA** | Live Translator Booth | 2.30 | 🟠 M-H | 0% | "demo theater spettacolare ma stack tutto nuovo" |
| 🔴 **DELTA** | Plant SOC Multi-Agent | **2.75** | 🔴 HIGH | 60% | "score più alto ma scope rischioso" |
| 🟡 **EPSILON** | Audit Field Box | 2.55 | 🟡 MED | 60% | "pitch commerciale più chiaro ($200B TAM)" |

¹ Score 0-3 dei 4 criteri di giudizio (Tech Optimization 30% · Practical Utility 25% · Creative On-Device 25% · Competitive Advantage 20%). Stress-test del pitch coach AI.
² Rischio di non finire in 24h. 🟢 LOW = ship-ready, 🔴 HIGH = scope-stretching.

---

## 🌳 Decision flowchart (dal SOLUTIONS_INDEX)

```
Q1: Il team ha ≥14h di build appetite (tech-pair carica)?
├── NO  → BETA (ship safe)
└── SÌ  → continua
        Q2: Vuoi pitch score più alto su tutto?
        ├── SÌ → DELTA (2.75) SE tech-pair ha esperienza LangGraph/multi-agent
        │        ALTRIMENTI → ALPHA (2.70)
        └── NO → continua
                Q3: Quale priorità?
                ├── NARRATIVA  → ALPHA (Snowden→Panama→sovereign AI)
                ├── DEMO LIVE  → GAMMA (mic on stage, latency badge)
                └── COMMERCIALE → EPSILON ($200B TAM, named buyer)
```

---

## 🏆 ALPHA — Sovereign Investigation Workbench

**Branch**: `pivot/sovereign-investigation-workbench` · **Pitch score 2.70** · **Rischio MED** · **95% pronto**

### In una frase
**Un AI offline che legge i documenti riservati dell'utente (leak, fascicoli, audit, prove) e risponde citando ogni claim alla riga di origine.** Tutto sul laptop, niente cloud.

### Per chi
Giornalisti investigativi (ICIJ, OCCRP), audit interno Big4, uffici whistleblower EU, difensori d'ufficio, compliance/DPO.

### Pitch one-liner
> *"Nel 2016, 11 milioni di documenti dello studio Mossack Fonseca hanno fatto cadere un primo ministro. La prossima leak — russa, vaticana, vostra — non può fidarsi del server di qualcun altro. Stesso pattern, modello da 4 miliardi di parametri, gira sul vostro laptop, airplane mode è ON."*

### Cosa è già pronto (vantaggio enorme)
- ✅ 1839 chunk indicizzati (Enron emails reali + memo Panama-style)
- ✅ Test end-to-end passato: gemma3:4b → 5 cited findings + 1 contradizione in 29s
- ✅ MCP server custom + Streamlit fallback
- ✅ DEMO_SCRIPT.md (60s storyboard) + BREAK_EVEN.md (3 customer scenarios USD)
- ✅ PR #2 aperto su GitHub

### Numeri killer
| Cosa | Numero |
|---|---:|
| Costo cloud RAG per Panama Papers | $57.500 |
| Costo EdgeXpert una tantum | $8.000 |
| Break-even | primo caso |

### Punti di forza
- 🎯 Named customer mondiale (ICIJ — i giornalisti dei Panama Papers)
- 🎯 Cloud è **legalmente vietato** per questi clienti (GDPR Art. 9, attorney-client privilege)
- 🎯 Pitch arc che il giudice ricorda a cena ("Snowden → Panama → next leak")

### Rischi
- ⚠️ AnythingLLM Gatekeeper su macOS richiede approval manuale
- ⚠️ 29s di latency end-to-end (lungo se non si pre-warming)

### 🔗 Link diretti
- 📄 [IDEA_SEMPLICE.md](https://github.com/landigf/gdgaihack-2026/blob/pivot/sovereign-investigation-workbench/doc/specs/cut-the-cord/IDEA_SEMPLICE.md)
- 🎬 [PITCH_DECK.md](https://github.com/landigf/gdgaihack-2026/blob/pivot/sovereign-investigation-workbench/doc/specs/cut-the-cord/PITCH_DECK.md)
- 🎯 [DEMO_SCRIPT.md](https://github.com/landigf/gdgaihack-2026/blob/pivot/sovereign-investigation-workbench/doc/specs/cut-the-cord/DEMO_SCRIPT.md)
- 💰 [BREAK_EVEN.md](https://github.com/landigf/gdgaihack-2026/blob/pivot/sovereign-investigation-workbench/doc/specs/cut-the-cord/BREAK_EVEN.md)
- 🔀 [PR #2 su GitHub](https://github.com/landigf/gdgaihack-2026/pull/2)

---

## 🟢 BETA — Control-Room Copilot

**Branch**: `alt/control-room-polish` · **Pitch score 2.40** · **Rischio LOW** · **100% pronto**

### In una frase
**Un AI vocale offline per la sala controllo di impianti pericolosi (chimico, minerario, oil & gas).** Operatore parla l'incidente, AI risponde con checklist NIOSH/OSHA citata.

### Per chi
Operatori control-room chimici (ATEX Zone 1), squadre minerarie (MSHA Part 75), oil & gas, HSE director.

### Pitch one-liner
> *"In sala controllo di un impianto chimico, l'operatore non può copia-incollare un log SCADA in ChatGPT. Il cloud è illegale sotto MSHA Part 75 underground; ATEX Zone 1 vieta i telefoni; HIPAA bara cloud per ePHI. Voce in entrata, checklist NIOSH/OSHA in uscita, ogni claim citato."*

### Cosa è già pronto (95% — il più maturo)
- ✅ 98 chunks indicizzati (NIOSH Pocket Guide, OSHA, PHMSA ERG, CDC, Red Cross)
- ✅ Stack hybrid retrieval + LLM + JSON contract
- ✅ 6 scenari core + 3 stretch
- ✅ Benchmark harness con CCC metric (chlorine: 0.40)
- ✅ 11 deep-research reports + 4 syntheses
- ✅ Pitch già rehearsato

### Numeri killer
| Cosa | Numero |
|---|---:|
| Tokens/sec gemma3:4b su M3 Pro | 22 tok/s |
| Latency cold-warm | 12.1 s |
| Cited Checklist Completeness | 0.40 (vs baseline 0.30) |

### Punti di forza
- 🎯 Stack già funzionante — zero rischio di "non si compila al T-2h"
- 🎯 Triple regulatory moat (ATEX + MSHA + HIPAA)

### Rischi
- ⚠️ Pitch coach gli ha dato il punteggio più basso tra i top 3 (2.40)
- ⚠️ Vibe "yet another safety RAG chatbot" senza ingredient creativi

### 🔗 Link diretti
- 📄 [IDEA_SEMPLICE.md](https://github.com/landigf/gdgaihack-2026/blob/alt/control-room-polish/doc/specs/cut-the-cord/IDEA_SEMPLICE.md)
- 🎬 [PITCH_DECK.md](https://github.com/landigf/gdgaihack-2026/blob/alt/control-room-polish/doc/specs/cut-the-cord/PITCH_DECK.md)

---

## 🟠 GAMMA — Live Translator Booth

**Branch**: `alt/translator-booth` · **Pitch score 2.30** · **Rischio M-H** · **0% pronto (stack tutto nuovo)**

### In una frase
**Cabina di traduzione simultanea AI offline:** speaker parla italiano, secondo schermo mostra inglese in 250ms. Whisper + NLLB + Kokoro tutti locali.

### Per chi
Cabine interpreti UN / EU Parliament / OSCE, M&A war rooms, conference top-tier, sale tribunale ICC.

### Pitch one-liner
> *"Le cabine interpreti UN prenotano mesi prima. Il discorso diplomatico leak se tocca un server cloud. Speaker dice 'onorevoli colleghi'; il secondo schermo mostra 'honorable colleagues' in 240 millisecondi. Cloud version costa $300/giorno e leak il discorso. Il nostro costa zero al minuto, leak zero."*

### Cosa è già pronto
- ✅ Spec architettura (Whisper-Streaming + faster-whisper + NLLB-200 + Kokoro)
- ✅ Pitch one-liner
- ❌ Zero codice — 14-18h di nuovo build

### Numeri killer
| Cosa | Numero |
|---|---:|
| Latency mic→schermo | ≤500 ms |
| Word Error Rate | ≤8% |
| Cloud cost evitato | $0.02/min/lingua-pair |

### Punti di forza
- 🎯 **Demo theater unbeatable** — speaker live, secondo schermo, latency badge che scorre
- 🎯 **MSI explicitly markets EdgeXpert per translation** sul loro blog
- 🎯 Brief endorsa esplicitamente lo stack (whisper.cpp + Kokoro + Piper)
- 🎯 Stacca ElevenLabs side-challenge naturalmente

### Rischi
- ⚠️ Pitch coach: 2.30 (il più basso)
- ⚠️ **Zero pre-work reuse** — 4 model families nuove in 24h
- ⚠️ Audio hardware: serve un decent USB mic e tempo di debugging acoustic
- ⚠️ TTS quality on-device è weak

### 🔗 Link diretti
- 📄 [IDEA_SEMPLICE.md](https://github.com/landigf/gdgaihack-2026/blob/alt/translator-booth/doc/specs/cut-the-cord/IDEA_SEMPLICE.md)
- 🎬 [PITCH_DECK.md](https://github.com/landigf/gdgaihack-2026/blob/alt/translator-booth/doc/specs/cut-the-cord/PITCH_DECK.md)

---

## 🔴 DELTA — Plant SOC Multi-Agent

**Branch**: `alt/plant-soc-copilot` · **Pitch score 2.75 (il più alto)** · **Rischio HIGH** · **60% pronto**

### In una frase
**Tre agent AI offline che proteggono la sala controllo di un impianto industriale da attacchi cyber:** Log Sentinel, Threat Hunter, Incident Responder. Multi-agent via MCP.

### Per chi
Operatori OT cybersecurity (chimico, miniere, utility), NERC-CIP compliance officers, critical infrastructure NIS2.

### Pitch one-liner
> *"Il 9 maggio 2026 il brief MSI ha pubblicato 4 case study aspirational. Case Study Numero Uno descriveva un local multi-agent SOC. Non ci siamo chiesti se costruire un'idea diversa. Abbiamo spedito il case study."*

### Cosa è già pronto
- ✅ Architecture diagram + skeleton orchestrator
- ✅ Stack baseline reusable
- ❌ 3 agent module ancora da scrivere (12-16h di build)

### Numeri killer
| Cosa | Numero |
|---|---:|
| Cited Findings Completeness per-agent | ≥0.55 |
| Latency end-to-end 3-agent | ≤30s |
| Agent handoff success rate | ≥0.80 |

### Punti di forza
- 🎯 **Pitch score 2.75 — il più alto delle 5**
- 🎯 **Brief CS-01 verbatim match** ("shipping the case study they published")
- 🎯 Maximum Creative On-Device 25% (multi-agent + agent-to-agent + MCP + computer-use)
- 🎯 Triple regulatory moat OT cyber

### Rischi
- ⚠️ **Highest 24h scope risk** — multi-agent stability è un nightmare conosciuto
- ⚠️ Demo theater per SOC più difficile (agents convergono vs operator + checklist)
- ⚠️ Single physical machine: 3 agent condividono Ollama HTTP

### 🔗 Link diretti
- 📄 [IDEA_SEMPLICE.md](https://github.com/landigf/gdgaihack-2026/blob/alt/plant-soc-copilot/doc/specs/cut-the-cord/IDEA_SEMPLICE.md)
- 🎬 [PITCH_DECK.md](https://github.com/landigf/gdgaihack-2026/blob/alt/plant-soc-copilot/doc/specs/cut-the-cord/PITCH_DECK.md)

---

## 🟡 EPSILON — Audit Field Box

**Branch**: `alt/audit-field-box` · **Pitch score 2.55** · **Rischio MED** · **60% pronto**

### In una frase
**Una scatola portatile per auditor Big4 in trasferta dal cliente:** drag-and-drop il bilancio, Benford trova le anomalie, gemma3:4b drafta memo SOX-compatible con citazioni alle righe.

### Per chi
Auditor PwC/Deloitte/KPMG/EY, audit interno Fortune 500, forensic accountants, compliance officers SOX/PCAOB.

### Pitch one-liner
> *"Il TAM dell'audit è $200 miliardi globali. Ogni Big4 BANNA ChatGPT su dati cliente — è policy aziendale 2026 + regolamento SOX/PCAOB. La prima AI workstation che i Big4 partner possono APPROVARE su client engagement."*

### Cosa è già pronto
- ✅ `scripts/audit-benford.py` — analyzer deterministico (commit su branch)
- ✅ Sample GL CSV (35 righe sintetiche con anomalie Raptor SPE)
- ✅ Smoke test passato: ha trovato 7 anomalie incluso "$39,200,000 re-class"
- ❌ ~6-8h di build per LLM persona, scenari, UI

### Numeri killer
| Cosa | Numero |
|---|---:|
| TAM audit globale | $200B |
| % cloud-banned | ~100% |
| ROI per engagement | 26× |

### Punti di forza
- 🎯 **TAM più grande** delle 5 alternative
- 🎯 Cloud è **letteralmente vietato** (Big4 policy + SOX/PCAOB)
- 🎯 Hybrid (deterministic + LLM) = Tech Opt 30% argomento naturale
- 🎯 Pitch math più concreto: $200B + 26× ROI

### Rischi
- ⚠️ Demo theater meno spettacolare (CSV non è sexy come live audio o entity graph)
- ⚠️ Audit jargon richiede attenzione su forbidden-language ("no fraud detected" rule)

### 🔗 Link diretti
- 📄 [IDEA_SEMPLICE.md](https://github.com/landigf/gdgaihack-2026/blob/alt/audit-field-box/doc/specs/cut-the-cord/IDEA_SEMPLICE.md)
- 🎬 [PITCH_DECK.md](https://github.com/landigf/gdgaihack-2026/blob/alt/audit-field-box/doc/specs/cut-the-cord/PITCH_DECK.md)

---

## 🎯 Quale guardare per quale criterio

| Se cerchi questo… | …vai su |
|---|---|
| Narrativa più memorabile | **ALPHA** (Snowden → Panama → next leak) |
| Demo theater più spettacolare | **GAMMA** (mic live + latency badge) |
| Pitch math più concreto | **EPSILON** ($200B TAM, 26× ROI) |
| Pitch score più alto | **DELTA** (2.75) |
| Sicurezza ship-ready | **BETA** (100% pre-work) |
| Già end-to-end testata | **ALPHA** (1839 chunks già indicizzati) |
| MSI sponsor-fit verticale | **GAMMA** (translation è nel loro marketing) |

---

## ✏️ Adesso vai a [02-mio-voto.md](02-mio-voto.md) e scrivi il tuo voto
