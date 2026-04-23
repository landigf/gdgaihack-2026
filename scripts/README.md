# scripts/

Small, well-named shell scripts. One purpose each. No ceremony.

| Script | Purpose |
|---|---|
| `doctor.sh` | Verify node/python/ollama/models/env, print a one-screen status. Run on every teammate's machine. |
| `download-models.sh` | Pull every Ollama model we might use during the hackathon. Idempotent. |
| `download-datasets.sh` | Pull / generate the evaluation datasets referenced by `benchmarks/scenarios/*.yaml`. |
| `bench.sh` | Wrapper around `python -m benchmarks.harness.run` with sane defaults. |
| `warmstart.sh` | Load the demo model into RAM and run one dummy inference — call T-30min before pitch. |
| `netproof.sh` | Capture a tcpdump + Little Snitch snapshot before and during a demo dry-run; save under `doc/specs/cut-the-cord/evidence/`. |

All scripts must:
- exit non-zero on failure
- print a final `OK` line on success (for doctor-style scripts)
- be safe to re-run (idempotent)
- never require `sudo` unless explicitly named `netproof.sh`
