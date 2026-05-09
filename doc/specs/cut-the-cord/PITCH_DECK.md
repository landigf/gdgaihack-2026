---
marp: true
theme: default
paginate: true
header: 'PoliSa · Cut the Cord · Live Translator Booth'
footer: '© 2026 PoliSa · GDG AI HACK 2026 · MSI Track'
---

# Live Translator Booth

## On-device AI per interpreti dove il cloud è bandito

**PoliSa** · GDG AI HACK 2026 · MSI "Cut the Cord" Track
M3 Pro 18 GB · Whisper + NLLB + Kokoro · zero cloud · 240ms

---

## Il problema

Cabine interpreti UN / EU Parliament / M&A war rooms hanno tre vincoli oggi:

1. **Confidenzialità diplomatica** — discorso non può passare da cloud server
2. **Latency** — interpretazione simultanea richiede sub-secondo umano
3. **Costo** — STT cloud è ~\$0.02/min/lingua. Cabina UN = 10h/giorno × 6 lingue = **$72/giorno per cabina solo per STT**.

Risultato: oggi interpreti umani + cartelle terminologiche cartacee. Niente AI.

---

## La soluzione

EdgeXpert dietro la cabina interpreti.

```
🎤 Lavalier mic
   ↓
🎯 Whisper-Streaming (self-adaptive latency)
   ↓
🌍 NLLB-200 distilled (200 lingue, Meta)
   ↓
📺 Secondo schermo: subtitles live
   ↓
🔊 Optional: Kokoro-82M TTS per accessibility
```

Tutto sul laptop. Airplane mode. Zero cloud. **240 millisecondi end-to-end.**

---

## Demo (60 secondi)

```
T+0s   Speaker italiano sul podio. EdgeXpert dietro la cabina.
       Airplane mode visibile. Latency badge: --
T+5s   Speaker: "Onorevoli colleghi, vorrei sottolineare l'importanza
                  della cooperazione transatlantica..."
T+5.24s [secondo schermo]
       EN: "Honorable colleagues, I would like to emphasize the importance
            of transatlantic cooperation..."
       Latency badge: 240ms ✓
T+30s  Speaker dice "GDPR Article 9" — sistema mantiene consistency
       terminologica (anchor da agenda meeting pre-caricata)
T+50s  Operatore punta airplane mode icon — chiusura
```

Tcpdump in finestra adiacente: **zero pacchetti**.

---

## Numeri target

| Metrica | Target |
|---|---:|
| Word Error Rate (Whisper-Streaming) | **≤8%** |
| Translation BLEU (NLLB-200, IT↔EN) | **≥30** |
| End-to-end latency (mic → schermo) | **≤500 ms** |
| Glossary consistency (named entities) | **≥95%** |
| RAM peak (3 modelli concorrenti) | **~5-6 GB** (su 18 GB) |
| Cloud cost evitato per cabina/giorno | **$72** |

> *"Whisper di OpenAI + NLLB di Meta + Kokoro: tre laboratori top, tutti open, tutti offline."*

---

## OSS che usiamo (tutti brief-endorsed)

- **whisper-large-v3-turbo** + **faster-whisper** (CTranslate2, 4× speedup)
- **Whisper-Streaming** (UFAL Charles University, self-adaptive latency)
- **NLLB-200 distilled 600M** (Meta, Apache-2.0, 200 lingue)
- **Kokoro-82M** TTS (alternativa: Piper)
- **gemma3:4b** per glossary correction layer (terminologia tecnica)

> *"Il brief MSI dice esplicitamente: 'whisper.cpp · Kokoro-82M · Piper' come stack Voice & Audio raccomandato. Noi l'abbiamo preso alla lettera."*

---

## Why MSI

MSI sul loro blog (maggio 2026) cita **esplicitamente**:

> *"By processing AI workloads entirely on premise, MSI EdgeXpert helps organizations translate conversations securely without relying on public cloud services, supporting complete voice AI workflows including Speech to Text (STT), Translation (TTT), and Text to Speech (TTS)."*

**Il loro marketing letteralmente descrive il nostro demo.**

EdgeXpert MS-C931 (128 GB DGX Spark) =
- 6 lingue concorrenti per cabina
- Sub-200ms latency con NPU NVIDIA
- Una scatola per cabina UN, costo fisso per anno

---

## Buyer narrative

**3 mercati immediati:**

1. **UN / EU institutions** — \~700 cabine interpreti, ognuna potenzialmente un EdgeXpert
2. **M&A war rooms** — Big4 advisory + investment banks, sede chiusa, NDA, leak fatale
3. **Top-tier conferences** — Davos, Mobile World Congress, COP, etc.

**Cloud STT cloud bill per UN booth:** ~\$26,000/anno
**EdgeXpert per UN booth (5y amortization):** ~\$1,720/anno
**ROI 15× sostenibile per anni.**

---

## Bonus: ElevenLabs side stack

Solo **questo branch** permette di stackare la side challenge ElevenLabs naturalmente:

- **On-stage:** Kokoro-82M TTS (offline, qualifica primary track)
- **Side slide:** *"Per uso commerciale possiamo upgradare il TTS layer a ElevenLabs (cached voices con phoneme generation locale)"*

Qualifica side prize ElevenLabs senza disqualificare primary track MSI.

**Doppio premio possibile.**

---

## Closing

```
Le interpreti UN traducono le crisi del mondo
sussurrando in microfoni in cabine isolate.

Quei microfoni non possono andare in cloud.
Quel discorso non può finire in un log AWS.

Noi facciamo l'unica cosa intelligente:
tre modelli open-source, una scatola sotto la scrivania,
zero connessioni in uscita.

Speaker italiano. Schermo inglese. 240 millisecondi.
Airplane mode ON. Tcpdump silent.

Cut the cord. Per davvero.

Grazie.
```
