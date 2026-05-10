# Jury Q&A — truthful answers (cheat-sheet for the operator)

> **Print this. Bring it on stage.**
> Six of the proposed answers in `domande-possibile.md` were *invented* —
> a sharp ML judge would catch them and burn our credibility. This sheet
> swaps them for receipts that *actually exist in the repo*.
>
> **Rule:** if a number isn't in `benchmarks/houston/out/light/*.csv` or
> `summary.json`, do not say it.

---

## 🚨 DO NOT SAY (these were invented in the original drill)

| ❌ Lie | Why it's wrong |
|---|---|
| "40-55 tok/s warm" | We measured **median 29.7 tok/s, peak 36.5** on Ollama gemma3:4b. The 57.6 tok/s number is for *MLX* on a different bench day. |
| "two deterministic verifier modules" | We have **prompt-level rules**, not code-level veto. Saying "verifier modules" is overselling. |
| "68 grounded queries with 100 % citation resolution" | No automated 68-query audit exists. We spot-check during dev. |
| "Top-3 cosine similarity 0.78 on radiation chunk" | Number invented — never measured. |
| "manual precision@3 = 0.86" | No precision@k harness in the repo. |
| "tested 7 OWASP LLM injections, sanitization layer" | No injection tests, no sanitization code. Chunks go in raw. |
| "200-page PDF indexed in 16 s, tested 40 times" | No indexing benchmark exists. |

---

## ✅ TRUTHFUL ANSWERS (memorize these)

### Story / framing block (Q1, Q4, Q5, Q9, Q10, Q11)

#### Q1 — "It's too sci-fi, this isn't a real problem."

> "Mars is our **stress test**, not our only market. We picked it
> because it makes the Cut the Cord constraint *binary*: high latency,
> limited bandwidth, no cloud reachable at all. The same architecture
> drops onto submarines, Antarctic stations, offshore platforms,
> field hospitals, mining sites, and any military airgapped SOC.
> Mars is the lighthouse — those are the buyers."

#### Q4 — "Cut the Cord with NASA PDFs preloaded?"

> "Cut the Cord doesn't mean zero preparation — it means **zero
> runtime dependency**. The mission corpus is preloaded, indexed
> locally with FAISS, and fully usable when the connection is gone.
> `airplane-check.sh` greps every source file for outbound URLs and
> exits 0; `tcpdump` on the demo machine shows 0 packets in 90 s.
> The only thing the .dmg needs at install is Ollama, which is also
> 100% local."

#### Q5 — "It's just RAG offline. What's actually new?"

> "It's not just RAG. It's the **combination** of:
> 4-persona multi-agent A2A with measured **2.0× KV-cache reuse**
> across the shared HOUSTON_PREFIX (`a2a_kv_cache.png`); a 3D
> habitat UI that feeds **telemetry context** (sensors, inventory,
> crew roster) into every query; a tile-lattice sensor cache with
> **29× speedup** on time-window queries (`cache_lattice.png`);
> a voice loop that's offline end-to-end (whisper.cpp + macOS say
> + LLM, ~2.6 s warm); a citation chip that opens the **actual NASA
> PDF in an embedded PDF.js viewer with the cited paragraph
> highlighted**; and a tcpdump-verified zero-egress proof.
> Each piece is local-only on commodity hardware. None of the
> incumbents combine all six."

#### Q9 — "If the network is down, how do you have live sensor data?"

> "The network *to Earth* is down — not the local sensor bus.
> Houston assumes habitat telemetry stays available through onboard
> systems. In the demo we simulate it deterministically (greenhouse
> NDVI/EC/pH/PPFD, ECLSS CO₂/pressure/radiation), but the same
> endpoint shape (`/ares/sensor/query`) accepts a real bus feed
> with no architectural change."

#### Q10 — "Why not just Spotlight / Finder / Copilot?"

> "Spotlight finds files by name. Copilot needs the cloud. Houston
> connects **mission context**: semantic retrieval + procedure
> citations + telemetry state + mission-specific persona reasoning,
> all locally. Copilot Recall is passive screenshot indexing — a
> different problem. We're decision support for an operator who
> can't reach the cloud, not a personal assistant on a laptop."

#### Q11 — "Who's the real user?"

> "Crew members and mission operators in disconnected environments.
> In the demo, the astronaut is the user — that's why we anchored
> on Mars. Outside the lighthouse, the user is any field team with
> limited connectivity and high operational stakes: nuclear
> submarine crews, Antarctic research staff, offshore rig
> technicians, naval ships, field hospitals, disaster-response
> medical teams, remote mining sites, and (eventually) lunar bases."

---

### Q12 — "How many tokens/sec?"

> "On Ollama gemma3:4b Q4_K_M, our 30-call warm benchmark gives
> **median 29.7 tok/s, mean 29.9, p90 31.2, peak 36.5**, σ < 1.5
> tok/s. The MLX path benched separately at **57.6 tok/s** with
> Qwen2.5-3B-4bit — that's documented in §2 of the writeup. Cold
> first call adds ~2.6 s for the LLM warm-up.  
> Both numbers are in `benchmarks/houston/out/light/tokens_per_sec.csv`
> and `summary.json` — reproducible via `jury_qa_bench.py --plot 1`."

### Q13 — "Where's the multi-agent / A2A?"

> "Four LLM personas in `backend/ares/prompts.py`:
> **GREENHOUSE_TAIL · SURVIVAL_TAIL · PROCEDURE_TAIL · REPAIR_TAIL**.
> They share a byte-identical `HOUSTON_PREFIX` so gemma3 reuses its
> KV cache between them — measured **2.0 × speedup** (8 124 → 4 050 ms)
> in `a2a_kv_cache.png`. The greenhouse → procedure call is the live
> A2A in `/ares/houston/greenhouse`.  
> The verifier framing is the *next iteration*: a regex-level [S_n]
> check that vetoes uncited claims is one PR away."

### Q14 — "Why Mars and not the Medical Scribe case?"

> "Same architectural pattern — local RAG, citation-grounded, zero
> egress — applied to a domain where Cut the Cord is **physics, not
> regulation**. A medical scribe demos the constraint as a compliance
> choice; a Mars habitat demos it as a survival requirement. Same
> code, sharper stake."

### Q15 — "How do you guarantee citation resolution?"

> "We do not run a 68-query automated audit yet. Citations are
> enforced by **prompt design + the [S_n] schema in HOUSTON_PREFIX**:
> the LLM is told to cite ONLY tags that appear in the CONTEXT block.
> During dev we spot-checked manually. Hardening to a code-level
> regex veto + automated 50-query audit is on the post-submission
> roadmap."

### Q16 — "How fast does a fresh 200-page PDF index?"

> "We chunk at 512 tokens with 64 overlap (`backend/config.py`).
> The full demo corpus — **30 PDFs, 1 292 chunks** — re-indexed in
> under a minute on this machine. We don't have a published per-PDF
> throughput plot, so I won't quote a 200-page number. **Drop a
> file and we'll measure it live**: indexing is async on a
> background thread, the UI stays responsive, and the new chunks
> become queryable as each batch completes."

### Q17 — "Peak RAM with everything running?"

> "**9.09 / 18 GB peak**, 9.86 GB headroom. Sidecar RSS ~2 GB,
> Ollama RSS ~30 MB once MLX takes over generation. CPU peak 48 % /
> avg 15 % on a 30-call burst. Plot: `hardware_load_60s.png`. Zero
> swap during the demo path, verified via `vm_stat`."

### Q18, Q19, Q20 — "Retrieval quality?"

> "We did NOT run a precision@k harness. The retriever returns
> top-3 dense FAISS hits via nomic-embed-text 768d (no reranker, no
> BM25 hybrid). Quality control is the LLM's instruction-following
> + the [S_n] schema. For OOD queries the system prompt's
> truthfulness rules tell Houston to refuse — we just demoed that
> live with 'what time in Rome' returning *'I have no Earth-clock;
> I only know Sol 423'* instead of fabricating."

### Q21 — "Loopback API has no auth?"

> "Correct — the sidecar listens on 127.0.0.1:8765 unauthenticated
> by design for a single-user offline demo. Production hardening
> is a Tauri-issued shared-secret header + a Unix domain socket
> instead of TCP. We documented this as item #1 in the README's
> 'before multi-user' checklist."

### Q22 — "Prompt injection sanitization?"

> "We do NOT have injection sanitization yet. Chunks are inserted
> as plain text. The system prompt instructs Houston to treat
> context as data, but we haven't run an OWASP red-team. Adding
> directive-stripping + a delimiter wrapper is on the post-submission
> hardening list."

### Q23 — "Why not Claude Desktop / LM Studio / Copilot Recall?"

> "Three differences. **One:** domain-specific verdict schema with
> mandatory grounded citations — Claude Desktop and AnythingLLM are
> general chat with optional citation. **Two:** the operational UI —
> habitat-as-interface with telemetry context fed into every query,
> not a chat box on top of files. **Three:** a license-clean
> public-domain corpus pre-bundled for the vertical, so the operator
> doesn't curate. Recall is passive screenshot indexing, a different
> problem entirely."

### Q24 — "TAM is <200 astronauts. Who actually pays?"

> "Mars is the **lighthouse**, not the buyer. The 24-month addressable
> markets are the same constraint applied to terrestrial use cases:
> nuclear submarine fleets, Antarctic research stations, offshore
> oil/gas platforms, naval and merchant ships, military field
> hospitals, defense contractors with airgapped SOCs, remote mining
> ops. We haven't run a formal TAM study — what we have is the
> *architectural fit*: the same code, with a different corpus,
> serves any operator who can't reach the cloud. **MSI is the
> hardware partner. We're the application layer that justifies the
> EdgeXpert premium** (see the EdgeXpert projection slide for the
> 50× scale-up math)."

### Q26 — "Drag a new PDF — how fast does it index?"

> "Our chunker uses **512 tokens with 64 overlap** (`backend/config.py`).
> The full demo corpus — 30 PDFs, 1 292 chunks — re-indexed in
> under a minute on this machine. We don't have a published per-PDF
> throughput plot — *but feel free to drop a file, we'll measure it
> live*."

### Q27 — "Ollama crashes mid-demo?"

> "Houston endpoint catches the failure, returns a deterministic
> rule-based verdict marked with a yellow **FALLBACK** badge instead
> of the green LIVE LLM badge. The user sees no broken state —
> narration is shorter, citations are fixed tags. We pre-tested
> this by killing the Ollama process during a query."

### Q28 — "Spegnete il Wi-Fi e ripetete la demo."

> "Si, andiamo." → toggle Wi-Fi off → run `bash scripts/airplane-check.sh`
> (returns 0) + open Activity Monitor with `tcpdump -i any -nn` (zero
> packets in 90 s) → repeat the harvest demo. **Pre-flight check
> obbligatoria — fai questo flow due volte prima del pitch.**

### Q29 — "Why Mars 3 hours before the demo? Mentor was excited; jury isn't."

> "Because the constraint we're demonstrating — **physically can't
> reach the cloud** — is binary on Mars and gradient everywhere
> else. Mars makes the architectural case unambiguous in 30 seconds.
> The slide that follows reframes the *same* architecture for the
> markets that actually buy: subs, Antarctic, offshore, defense.
> The cinematic anchor sells the concept; the EdgeXpert projection
> slide sells the deal."

---

## Receipts cheat-sheet (these are real)

| File | What it proves |
|---|---|
| `benchmarks/houston/out/light/tokens_per_sec_distribution.png` | 30-call median 29.7 / peak 36.5 tok/s on Ollama gemma3:4b |
| `benchmarks/houston/out/light/throughput.png` | MLX 3B 57.6 tok/s vs MLX 7B 28.7 vs Ollama 43.1 |
| `benchmarks/houston/out/light/a2a_kv_cache.png` | 8 124 → 4 050 ms = 2.0× A2A KV-cache reuse |
| `benchmarks/houston/out/light/multiagent_serial.png` | 4 personas back-to-back: 4499/3976/6386/2654 ms |
| `benchmarks/houston/out/light/hardware_load_60s.png` | CPU peak 48 % / RAM 9.09 GB peak / zero swap |
| `benchmarks/houston/out/light/cache_lattice.png` | 2 104 → 72 ms = 29.2× tile cache speedup |
| `benchmarks/houston/out/light/voice_breakdown.png` | Voice round-trip ASR + LLM + TTS |
| `benchmarks/houston/out/summary.json` | All raw numbers in one JSON |
| `scripts/airplane-check.sh` | grep verifies zero outbound URLs in source |
| `backend/ares/prompts.py:20-101` | the 4 personas + HOUSTON_PREFIX |

---

## Live-demo "things that just work" (no fabrication risk)

- ✅ Click HABITAT → 4 real team members listed on screen.
- ✅ Voice "what time in Rome?" → graceful refusal, not fabrication.
- ✅ Voice "who's the crew?" → real names listed.
- ✅ Click [S1] in Repair → see chunk excerpt + click "Open PDF
  · highlight cited" → PDF.js viewer opens in-app with the cited
  paragraph highlighted in yellow. Fallback: macOS Preview button
  for system viewer.
- ✅ Greenhouse drill-in: 4 plant species visible, no overlapping label.
- ✅ Airplane mode: identical demo behavior with Wi-Fi off.
