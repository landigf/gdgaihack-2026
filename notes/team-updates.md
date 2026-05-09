# 👥 Team updates — log progressi del team

> **Aggiornato all'inizio di ogni sessione** da Claude dopo `git fetch --all --prune`.
> Le entry più recenti vanno in cima.

---

## 2026-05-09 ~16:45 — Setup iniziale (Nicola + Claude)

### Stato della repo al setup
- Cartella locale precedente (`~/Desktop/gdgaihack-2026-main/`) era uno **ZIP scaricato**, non una vera repo Git → riconosciuta e sostituita con clone vero in `~/Desktop/gdgaihack-2026/`.
- Branch personale `nicola/work` creato e pushato su origin.

### Cosa ha fatto il team prima del nostro arrivo (≈ ultime 2 ore prima del setup)

Il team `landigf` ha lavorato in modo intenso. Sintesi:

#### Branch creati e loro scopo

| Branch | Cosa contiene | Ultimo commit |
|---|---|---|
| `main` | Solo scaffold ClaudeFlow base (vuoto di codice progetto) | — |
| `setup/cut-the-cord-scaffold` | Scaffold del progetto "Cut the Cord" (on-device AI). Base condivisa da tutte le 5 candidate. | — |
| `proposal/soc-edge-modular` | Proposta iniziale (poi superata). | `e087c5f` (~2 ore fa) |
| `pivot/sovereign-investigation-workbench` | **Candidata ALPHA** — già end-to-end testata, PR #2 aperto. | `b953004` (~2 ore fa) |
| `alt/control-room-polish` | **Candidata BETA** — Control-Room Copilot, safest fallback. | `7b1b945` (~2 ore fa) |
| `alt/translator-booth` | **Candidata GAMMA** — Translator Booth UN-style. | `7847125` (~2 ore fa) |
| `alt/plant-soc-copilot` | **Candidata DELTA** — Plant SOC Multi-Agent. | `00a73b7` (~2 ore fa) |
| `alt/audit-field-box` | **Candidata EPSILON** — Audit Field Box per Big4. | `551cbd0` (73 min fa, ultimo del team) |
| `docs/solutions-index` | **Indice e WhatsApp message** per condividere le 5 candidate. | `31f61cf` (~65 min fa) |

#### Pull request aperti

- **#2**: ALPHA — Sovereign Investigation Workbench (su `pivot/sovereign-investigation-workbench`)
- Le altre 4 candidate non hanno ancora PR aperti, ma il SOLUTIONS_INDEX dice "open one" come prossimo passo.

#### Azione richiesta dal team

**Decision deadline: stasera ~23:00.** Il team deve scegliere UNA candidata. Il leader (`landigf`) ha già espresso preferenza: 🏆 **ALPHA**.

#### Documenti chiave del team (su branch `docs/solutions-index`)

- `00-TEAM_PLAYBOOK.md` — regole di ingaggio AI + umani
- `SOLUTIONS_INDEX.md` — la matrice di confronto delle 5 candidate
- `WHATSAPP_MESSAGE.md` — testi pronti da copia-incollare nel gruppo (3 versioni: short/medium/long)
- `PITCH_PLAN.md`, `PITCH_REHEARSAL_CARD.md`, `DEMO_SCRIPT.md` (ALPHA), `BENCHMARKS.md`, `RUNBOOK.md`, `COMPETITIVE_SCAN.md`, `TRACK_INTEL.md`
- 11 deep-research reports + 5 syntheses in `research/`

#### Squadra (4 persone)

- **pitch-pair**: **Nicola** + **Gorga** ← tu sei qui
- **tech-pair**: gli altri 2 (incluso `landigf`)

---

> **Sezione successiva** verrà aggiunta da Claude nella prossima sessione, dopo `git fetch`.
