# 📣 Presentation Workspace — Nicola

> **Tu sei nella pitch-pair (Nicola + Gorga).** Insieme guidate la **narrativa e il pitch**.
> L'altra coppia (tech-pair) costruisce il codice.

## 🎯 Cosa fare oggi (in ordine)

| # | Task | File | Priorità |
|---|---|---|:-:|
| 1 | Capire le **5 candidate solutions** preparate dal team | [01-le-5-candidate.md](01-le-5-candidate.md) | 🔴 ORA |
| 2 | Compilare il tuo **voto** sulle 5 (deadline ~23:00 stasera) | [02-mio-voto.md](02-mio-voto.md) | 🔴 ORA |
| 3 | Una volta scelta la candidata vincitrice → **lavoro sul pitch** | [03-pitch-notes.md](03-pitch-notes.md) | 🟡 dopo voto |

## 🗂️ Dove trovi cosa nel repo

| Cosa | Dove | Note |
|---|---|---|
| **Team Playbook** (regole d'ingaggio) | [doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md](../doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md) | ⚠️ NON visibile su `main`, è sul branch `docs/solutions-index`. Vedi sotto. |
| **SOLUTIONS_INDEX** (matrice 5 candidate) | branch `docs/solutions-index` → `doc/specs/cut-the-cord/SOLUTIONS_INDEX.md` | [link GitHub](https://github.com/landigf/gdgaihack-2026/blob/docs/solutions-index/doc/specs/cut-the-cord/SOLUTIONS_INDEX.md) |
| **Le 5 IDEA_SEMPLICE** (1 pagina ITA ognuna) | branch `pivot/sovereign-investigation-workbench`, `alt/control-room-polish`, `alt/translator-booth`, `alt/plant-soc-copilot`, `alt/audit-field-box` | vedi link in [01-le-5-candidate.md](01-le-5-candidate.md) |
| **Pitch decks** (slide Marp, 1 per candidata) | stessi branch sopra → `doc/specs/cut-the-cord/PITCH_DECK.md` | renderizzabili con `npx @marp-team/marp-cli@latest <file> --pdf` |
| **DEMO_SCRIPT.md** (storyboard 60s) | branch `pivot/sovereign-investigation-workbench` (ALPHA) | solo ALPHA ce l'ha pronto |
| **WHATSAPP_MESSAGE** (testo per il gruppo) | branch `docs/solutions-index` → `doc/specs/cut-the-cord/WHATSAPP_MESSAGE.md` | versioni short / medium / long pronte da copiare |

## ⚠️ Note importanti

- **`main` è ancora vuoto** (solo lo scaffold ClaudeFlow). Tutto il lavoro vero è sui branch `alt/*`, `pivot/*`, `docs/*`.
- **Tu lavori SOLO su `nicola/work`**. Mai su `main`. Le merge in main le fa la tech-pair tramite Pull Request.
- **Decision deadline**: T+12h da kickoff (oggi 9 maggio) ≈ **stasera 23:00**. Il leader del team ha già espresso voto **ALPHA** (Sovereign Investigation Workbench).
- **Tutto Cut the Cord = on-device AI**. Il prodotto deve girare in airplane mode sul laptop del demo (M3 Pro o MSI Stealth), niente cloud.

## 📝 Per le note del team (cosa stanno facendo gli altri)

Vedi [../notes/team-updates.md](../notes/team-updates.md) — Claude aggiorna quel file ad ogni sessione (dopo `git fetch`).
