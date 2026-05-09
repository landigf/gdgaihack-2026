---
marp: true
theme: default
paginate: true
header: 'PoliSa · Cut the Cord · Control-Room Copilot'
footer: '© 2026 PoliSa · GDG AI HACK 2026 · MSI Track'
---

# Control-Room Copilot

## On-device AI per impianti dove il cloud è vietato

**PoliSa** · GDG AI HACK 2026 · MSI "Cut the Cord" Track
M3 Pro 18 GB · gemma3:4b · zero cloud · airplane mode

---

## Il problema

Un operatore in sala controllo di un impianto chimico vede un alert: **"sospetta fuga di cloro nella pump room B, tre operai esposti, evacuazione in corso"**.

Ha 30 secondi per:
1. Citare la procedura NIOSH per cloro (UN 1017)
2. Calcolare la distanza di isolamento dalla ERG Guide
3. Decidere se chiamare il 911 ora o 24h dopo (40 CFR 302)
4. Loggare l'incidente in formato compatibile OSHA

**E non può aprire ChatGPT.** ATEX Zone 1 vieta phones; MSHA Part 75 vieta cloud comms.

---

## La soluzione

**Control-Room Copilot** sull'EdgeXpert sulla sua scrivania.

🎤 **Voce in:** whisper.cpp locale trascrive in tempo reale
🧠 **Brain:** gemma3:4b ragiona su 98-chunk corpus NIOSH+OSHA+ERG
📋 **JSON contract:** ogni step della checklist cita la pagina del manuale
🔒 **100% offline:** airplane mode visibile, tcpdump silenzioso

---

## Demo (60 secondi)

```
T+0s   Operatore alla workstation, airplane mode ON
T+5s   Parla: "Sospetta fuga cloro pump room B"
T+8s   Whisper trascrive
T+15s  AI risponde con checklist citata:
       [S1] Distanza isolamento 100m (ERG p.124)
       [S2] SCBA obbligatoria (NIOSH NPG cloro)
       [S3] Decontaminazione esposti
       [S4] Notifica National Response Center 24h (40 CFR 302)
T+35s  Operatore clicca [S1] → ERG p.124 si apre evidenziata
T+50s  Punta airplane mode icon — chiusura
```

Tcpdump in finestra adiacente: **zero pacchetti**.

---

## Numeri reali

Misurati su M3 Pro 18 GB · gemma3:4b Q4_K_M · scenario chlorine:

| Metrica | Valore |
|---|---:|
| Tokens/sec decode | **22 tok/s** |
| Hybrid retrieval (FTS+vector+RRF) | **65 ms** |
| End-to-end (cold-warm) | **12.1 s** |
| Hallucination rate | **0%** |
| Citation correctness | **100%** |
| Cited Checklist Completeness | **0.40** (baseline 0.30) |

> *"7B model running beautifully on a 16 GB laptop can outscore a team barely running a 70B with a broken interface."* — citazione del brief MSI

---

## Triple regulatory moat

Cloud LLM è **letteralmente vietato** per i nostri clienti:

| Settore | Norma | Vieta |
|---|---|---|
| Chemical plants | **ATEX Zone 1** (EU 2014/34) | Consumer phones in zona |
| Underground mines | **MSHA Part 75** | Cloud comms in galleria |
| EMS / paramedics | **HIPAA** + HHS OCR settled Comstar 2025 | Cloud STT su ePHI |
| EU emergency response | **EU AI Act Annex III** | High-risk → architettura locale |

**EdgeXpert è la prima soluzione AI compliant by construction.**

---

## Buyer narrative

- **Lighthouse pic (slide aperture):** firefighter in turnout gear (emozionale)
- **Wedge buyer (commercial slide):** electric utility storm-restoration crews
  + DOE \$2.5B grid resilience program
  + NERC 2026 cloud-risk roadmap
- **Demo pitch (technical slide):** chemical hazmat (best 60s demo theater)

> *"Three audiences, same product, same EdgeXpert."*

---

## OSS che usiamo

- **Ollama** + **gemma3:4b** Q4_K_M (Google)
- **embeddinggemma:300m** (Google)
- **whisper.cpp** (local STT, brief-endorsed)
- **sqlite-vec** (local vector DB)
- **MCP filesystem server** (Anthropic protocol)
- **AnythingLLM Desktop** (UI shell, kills "isolated chatbot" disqualifier)

> *"Sei progetti OSS testati in produzione. Sul tuo hardware. Zero cloud."*

---

## Why MSI

EdgeXpert MS-C931 è progettato per esattamente questo: workload AI on-prem ad alto volume con vincoli regolatori. **Costo fisso. Zero cloud bill imprevedibile.**

Una scatola sulla scrivania dell'operatore =
- Compliance ATEX/MSHA/HIPAA by construction
- AI assist disponibile 24/7 anche senza network
- Manutenzione = aggiornamento periodico signed packages

**Vendi una EdgeXpert per impianto. 200+ impianti per cliente Fortune 500.**

---

## Closing

```
Sai dove ChatGPT non può andare?
Dove le persone si fanno male.

Sala controllo di un impianto chimico.
Galleria di una miniera 800m sotto.
Ambulanza in autostrada con cellulare scarico.

Lì serve un AI che funziona quando
il cellulare non ha campo, ATEX vieta i phones,
HIPAA vieta il cloud.

Quel AI è PoliSa.
Gira sul vostro EdgeXpert.

Grazie.
```
