# 🟠 GAMMA — Live Translator Booth

## In una frase
**Cabina di traduzione simultanea AI offline:** speaker parla italiano, secondo schermo mostra inglese in 250ms. Tutto sull'EdgeXpert dietro la cabina, niente cloud.

## Per chi
- Cabine interpreti UN / EU Parliament / OSCE
- M&A war rooms (negoziazioni segrete, leak fatale)
- Conference top-tier dove il cloud STT è bandito
- Sale tribunale ICC (regole evidenziali bloccano third-party processing)

## Perché funziona
**MSI cita esplicitamente translation come use case EdgeXpert** sul loro blog (maggio 2026). Il brief MSI **endorsa whisper.cpp + Kokoro + Piper** come stack "Voice & Audio (100% Local)" raccomandato.

**E i clienti?** Diplomatic speech leak se finisce in cloud. ICC interpreters lavorano sotto regole evidenziali che bloccano processing terzo. UN booths costano migliaia di € al giorno per cabine cloud-STT che leak.

## Cosa abbiamo già fatto
- ✅ SOLUTION_OVERVIEW.md con stack OSS completo identificato
- ✅ Pitch one-liner clocked
- ✅ Architettura (Whisper-Streaming + faster-whisper + NLLB-200 + Kokoro)
- ✅ MSI marketing material catturato (verbatim)

## Cosa manca per il pitch (~14-18h)
- [ ] Pull modelli (Whisper-Streaming + NLLB-200 + Kokoro)
- [ ] `pip install faster-whisper sounddevice numpy`
- [ ] Audio capture pipeline (lavalier mic → ring buffer)
- [ ] Streaming transcription + translation
- [ ] Second-screen UI con latency badge live
- [ ] Demo agenda corpus per glossary correction
- [ ] Test acoustic / mic feedback nel locale demo

## Pitch one-liner (per il giudice)
> *"Le cabine interpreti UN prenotano mesi prima. Ogni cabina ha bisogno di prep glossario, consistency terminologica, e confidenzialità assoluta — il discorso diplomatico leak se tocca un server cloud. Oggi hanno interpreti umani e cartelle. Noi spediamo il primo AI interpreter assistant che possono usare. Whisper di OpenAI, NLLB di Meta, Kokoro per la voce, tutto offline, tutto su EdgeXpert nella cabina. Speaker dice 'onorevoli colleghi'; il secondo schermo mostra 'honorable colleagues' in 240 millisecondi. Cloud version costa al conferenza $300/giorno per cabina e leak il discorso. Il nostro costa zero al minuto, leak zero."*

## I 3 numeri killer
| Cosa | Numero | Fonte |
|---|---:|---|
| Latency mic → schermo | **≤500 ms** | Whisper-Streaming self-adaptive |
| Word Error Rate | **≤8%** | UFAL paper (Whisper-Streaming) |
| Cloud cost evitato | **$0.02/min/lingua-pair** | OpenAI Whisper API pricing |

## Punti di forza vs altri progetti hackathon
- 🎯 **Demo theater unbeatable** — speaker live, secondo schermo, latency badge ticka
- 🎯 **MSI ti dà la slide** — translation è nel loro marketing
- 🎯 **Brief endorsa lo stack** — whisper.cpp + Kokoro + Piper sono nel "recommended"
- 🎯 Tech Optimization 30% maxes out (latency badge è la più legible Tech Opt beat)

## Punti di rischio
- ⚠️ **Pitch coach: 2.30 / 3.00** — il più basso (translator booth è categoria saturata)
- ⚠️ **Zero pre-work reuse** — totalmente nuovo stack
- ⚠️ **4 model families da installare** in 24h
- ⚠️ **TTS quality on-device** è weak (potresti dover skipare Kokoro, fare solo subtitles)
- ⚠️ **Audio hardware** — serve un decent USB mic e tempo di debugging acoustic

## Bonus stacking
**Solo questa branch** stacca naturale ElevenLabs side-challenge:
- Kokoro on-stage (offline, qualifica primary track)
- ElevenLabs come "future commercial polish layer" su side slide (qualifica side prize)

## Verdetto rapido
**Prendi questa se:** vuoi un demo da fare cadere la mascella + MSI sponsor reps in sala (il loro marketing dice esattamente "translation use case") + tech-pair con esperienza Whisper.

**Skip se:** la squadra ha <14h di build appetite + audio hardware non disponibile + Kokoro/Piper non installa pulito nei primi 30 min.
