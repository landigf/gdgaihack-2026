# 🟢 BETA — Control-Room Copilot

## In una frase
**Un AI vocale offline per la sala controllo di impianti pericolosi (chimico, minerario, oil & gas).** Operatore parla l'incidente, AI risponde con checklist NIOSH/OSHA citata. Tutto sul laptop, niente cloud.

## Per chi
- Operatori control-room di impianti chimici (ATEX Zone 1)
- Squadre di manutenzione minerarie (MSHA Part 75 vieta cloud comms)
- Crew oil & gas in piattaforma o pipeline remota
- HSE director con responsabilità incident reporting OSHA / NIOSH

## Perché funziona
**Il cloud è già illegale qui:**
- ATEX Zone 1 vieta consumer phones in zona chimica
- MSHA Part 75 vieta cloud comms underground
- HIPAA bara cloud per ePHI in EMS
**Quindi oggi gli operatori usano niente** — manuali cartacei + radio. Il nostro AI è la prima cosa che gli è permesso.

## Cosa abbiamo già fatto (95% pronto)
- ✅ 98 chunks indicizzati (NIOSH Pocket Guide, OSHA 1910.146/.147, PHMSA ERG, CDC, Red Cross)
- ✅ Stack hybrid retrieval + LLM + JSON contract
- ✅ 6 scenari core in incident-copilot.yaml + 3 stretch
- ✅ Benchmark harness con CCC metric (chlorine: 0.40)
- ✅ 11 deep-research reports + 4 syntheses sul vertical
- ✅ Pitch Seed A (EMS paramedic) e Seed C (mining/O&G) clocked a 170s

## Cosa manca per il pitch (~6h)
- [ ] MCP filesystem server hookup
- [ ] AnythingLLM o Open WebUI come UI shell (no Streamlit custom)
- [ ] Final benchmark sweep (5 runs) per i 4 numeri della pitch slide
- [ ] Demo theater per scenario chemical control room

## Pitch one-liner (per il giudice)
> *"In sala controllo di un impianto chimico, l'operatore non può copia-incollare un log SCADA in ChatGPT. Il cloud è illegale sotto MSHA Part 75 underground; ATEX Zone 1 vieta i telefoni; HIPAA bara cloud per ePHI di paramedici. PoliSa è il primo cited procedural assistant per questi posti di lavoro: voce in entrata, checklist NIOSH/OSHA in uscita, ogni claim alla pagina del manuale che cita, tutto sull'EdgeXpert sulla scrivania dell'operatore."*

## I 3 numeri killer
| Cosa | Numero | Fonte |
|---|---:|---|
| Tokens/sec gemma3:4b su M3 Pro 18GB | **22 tok/s** | Misurato chlorine scenario |
| End-to-end latency cold-warm | **12.1 s** | Stesso scenario |
| Cited Checklist Completeness | **0.40** (vs baseline 0.30) | Reale, target 0.65 con tuning |

## Punti di forza vs altri progetti hackathon
- 🎯 **Stack già funzionante** — zero rischio di "non si compila al T-2h"
- 🎯 Pitch **già rehearsato** dalla squadra per settimane (Seed A EMS)
- 🎯 11 deep-research bundle = appendix slide ricca di evidence
- 🎯 Triple regulatory moat (ATEX + MSHA + HIPAA) chiaramente spiegabile

## Punti di rischio
- ⚠️ Pitch coach gli ha dato **2.40 / 3.00** — sotto media delle alternative
- ⚠️ Vibe "yet another safety RAG chatbot" se non aggiungi MCP per la creatività
- ⚠️ No named customer single — categoria di buyer ma non un nome riconoscibile

## Verdetto rapido
**Prendi questa se:** la squadra è stanca, scope-limited, o vuole massima sicurezza di shipping. Niente sorprese al T-2h. Pitch debole ma demo solido.

**Skip se:** vuoi una narrativa che impressiona (vai su ALPHA), demo theater spettacolare (GAMMA), o il pitch score più alto (DELTA).
