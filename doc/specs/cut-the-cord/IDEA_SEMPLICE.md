# 🔒 ALPHA — Sovereign Investigation Workbench

## In una frase
**Un AI offline che legge i documenti riservati dell'utente (leak, fascicoli, audit, prove) e risponde citando ogni claim alla riga di origine.** Tutto sul laptop, niente cloud.

## Per chi
- Giornalisti investigativi (ICIJ, OCCRP, Bellingcat — quelli dei Panama Papers)
- Audit interno Big4 (PwC, Deloitte, KPMG, EY) — vietato cloud su dati cliente
- Uffici whistleblower EU (Direttiva 2019/1937)
- Difensori d'ufficio con discovery enorme
- Compliance / DPO con dati sensibili GDPR Art. 9

## Perché funziona
**Il cloud non è solo costoso — è LEGALMENTE VIETATO** per questi clienti. Una query su ChatGPT può:
- Bruciare la fonte di un giornalista
- Violare attorney-client privilege
- Annullare la novelty di un brevetto
- Far perdere accreditation a un auditor

## Cosa abbiamo già fatto
- ✅ 1839 chunk indicizzati (Enron emails reali + memo sintetici Panama-Papers-style)
- ✅ Retrieval ibrido sub-secondo (FTS5 + sqlite-vec)
- ✅ Test end-to-end: gemma3:4b produce 5 cited findings + 1 contradizione in 29 secondi
- ✅ MCP server custom (3 tool: search, cite, entity-graph)
- ✅ Streamlit fallback se AnythingLLM non funziona
- ✅ DEMO_SCRIPT.md (60s storyboard)
- ✅ BREAK_EVEN.md (3 customer scenarios con USD)

## Cosa manca per il pitch (~3-4h)
- [ ] Approva AnythingLLM con Cmd+click → Open
- [ ] Configura MCP server in AnythingLLM Agent Skills
- [ ] tcpdump audit airplane mode
- [ ] Lock i 4 numeri della pitch slide dal harness
- [ ] 3 dress rehearsal del pitch

## Pitch one-liner (per il giudice)
> *"Nel 2016, 11 milioni di documenti dello studio Mossack Fonseca hanno fatto cadere un primo ministro. I giornalisti ICIJ usano un tool open-source chiamato Datashare. Quel tool oggi manda ogni query AI al cloud. La prossima leak — russa, vaticana, vostra — non può fidarsi del server di qualcun altro. Noi abbiamo costruito il successore: stesso pattern, modello da 4 miliardi di parametri, gira sul vostro laptop, airplane mode è ON."*

## I 3 numeri killer
| Cosa | Numero | Fonte |
|---|---:|---|
| Costo cloud per leak Panama Papers (RAG) | **$57.500** | 11.5M doc × $0.001 × 5 query each |
| Costo EdgeXpert una tantum | **~$8.000** | Listino LDLC 2026 |
| Break-even | **primo caso** | Si ripaga al primo leak processato |

## Punti di forza vs altri progetti hackathon
- 🎯 L'unica idea con un **named customer di livello mondiale** (ICIJ è famoso)
- 🎯 Cloud è genuinamente **illegale**, non solo costoso
- 🎯 Stack reale già funzionante (1839 chunks indicizzati, smoke test passato)
- 🎯 Demo theater forte: drag-drop folder → AI risponde citando fonti reali

## Punti di rischio
- ⚠️ AnythingLLM Gatekeeper su macOS richiede approval manuale
- ⚠️ Demo dipende dal fatto che il giudice riconosca "Panama Papers" emotivamente
- ⚠️ 29 sec di latency end-to-end è lungo (ma si dimezza pre-warming il modello)

## Verdetto rapido
**Prendi questa se:** vuoi la narrativa più forte + uno stack già 95% pronto + il pitch arc che il giudice ricorderà a cena.

**Skip se:** la squadra preferisce un'idea più "tech-flex" tipo multi-agent (vai su DELTA) o un'idea con pitch più safe (vai su BETA).
