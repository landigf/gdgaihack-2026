#!/usr/bin/env bash
# Fetches the public-domain corpora listed in
#   benchmarks/datasets/incident-copilot/manifest.json
#   benchmarks/datasets/investigation-corpus/manifest.json
# into the gitignored sources/ subtree on this machine. Idempotent:
# re-running re-fetches only what's missing.
#
# Run BEFORE going to airplane mode.
#   - incident-copilot corpus: ~50 MB (always fetched)
#   - investigation-corpus (Enron CMU subset): ~423 MB compressed,
#     opt-in via FETCH_INVESTIGATION=1 env var (large, slow on weak networks)
#
# Usage:
#   bash scripts/download-datasets.sh                    # incident only (default)
#   FETCH_INVESTIGATION=1 bash scripts/download-datasets.sh   # both corpora
#
# Honest license posture:
#   - Incident-copilot sources are US/EU government public domain EXCEPT
#     redcross_first_aid which is copyrighted; we fetch under
#     hackathon fair-use only and gitignore the bytes.
#   - Investigation-corpus Enron data is in the public domain (FERC release,
#     cleaned and republished by William Cohen at CMU).
#   - manifest.json + this fetcher are committed; fetched bytes are not.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORPUS="$REPO_ROOT/benchmarks/datasets/incident-copilot/sources"
INV_CORPUS="$REPO_ROOT/benchmarks/datasets/investigation-corpus/sources"
UA="PoliSa-AirgapIncidentCopilot/0.1 (GDG-AI-HACK-2026; +https://github.com/landigf/gdgaihack-2026)"

mkdir -p "$CORPUS"

echo "== fetching corpus into $CORPUS =="

# Helper: fetch a single URL into target path; skip if size > 0 already.
fetch() {
  local url="$1"
  local dest="$2"
  local label="$3"
  mkdir -p "$(dirname "$dest")"
  if [[ -s "$dest" ]]; then
    echo "  -- skip $label (already fetched: $(du -h "$dest" | cut -f1))"
    return 0
  fi
  echo "  -> $label"
  if curl -fsSL -A "$UA" --retry 3 --retry-delay 2 --max-time 120 \
       -o "$dest" "$url"; then
    echo "     ok ($(du -h "$dest" | cut -f1))"
  else
    echo "     !! failed; see manifest.json for alt URLs"
    return 1
  fi
}

# 1. NIOSH Pocket Guide — primary HTML index + bulk PDF
fetch "https://www.cdc.gov/niosh/npg/default.html" \
      "$CORPUS/niosh_pocket_guide/index.html" \
      "NIOSH NPG index" || true

# Bulk PDF (DHHS Pub. 2005-149) — ~5 MB single-file pocket-guide
fetch "https://www.cdc.gov/niosh/docs/2005-149/pdfs/2005-149.pdf" \
      "$CORPUS/niosh_pocket_guide/2005-149.pdf" \
      "NIOSH NPG bulk PDF (2005-149)" || true

# Specific chemical entries that power our scenarios
fetch "https://www.cdc.gov/niosh/npg/npgd0115.html" \
      "$CORPUS/niosh_pocket_guide/chlorine.html" \
      "NIOSH NPG: chlorine (UN 1017)" || true
fetch "https://www.cdc.gov/niosh/npg/npgd0028.html" \
      "$CORPUS/niosh_pocket_guide/anhydrous_ammonia.html" \
      "NIOSH NPG: anhydrous ammonia (UN 1005)" || true

# 2. OSHA Lockout/Tagout 29 CFR 1910.147
fetch "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147" \
      "$CORPUS/osha_loto/1910.147.html" \
      "OSHA LOTO 29 CFR 1910.147" || true

# 3. OSHA Emergency Action Plan eTool — landing page + key topics
fetch "https://www.osha.gov/etools/evacuation-plans-procedures/eap" \
      "$CORPUS/osha_eap/landing.html" \
      "OSHA EAP eTool landing" || true
fetch "https://www.osha.gov/etools/evacuation-plans-procedures/eap/elements" \
      "$CORPUS/osha_eap/elements.html" \
      "OSHA EAP elements" || true
fetch "https://www.osha.gov/etools/evacuation-plans-procedures/eap/fight-or-flee" \
      "$CORPUS/osha_eap/fight-or-flee.html" \
      "OSHA EAP fight-or-flee" || true

# 4. OSHA Confined Spaces 29 CFR 1910.146
fetch "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146" \
      "$CORPUS/osha_confined_spaces/1910.146.html" \
      "OSHA Confined Spaces 29 CFR 1910.146" || true

# 5. PHMSA Emergency Response Guidebook 2024 — 8 MB PDF
ERG_URLS=(
  "https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/2024-04/ERG2024-Eng-Web-a.pdf"
  "https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/2024-05/ERG2024-Eng-Web.pdf"
  "https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/2024-04/ERG2024-Eng-Web.pdf"
)
ERG_DEST="$CORPUS/erg2024/erg2024_en.pdf"
mkdir -p "$(dirname "$ERG_DEST")"
if [[ -s "$ERG_DEST" ]]; then
  echo "  -- skip ERG 2024 (already fetched: $(du -h "$ERG_DEST" | cut -f1))"
else
  for url in "${ERG_URLS[@]}"; do
    echo "  -> trying ERG 2024 from $url"
    if curl -fsSL -A "$UA" --retry 2 --max-time 180 -o "$ERG_DEST" "$url" 2>/dev/null; then
      echo "     ok ($(du -h "$ERG_DEST" | cut -f1))"
      break
    fi
  done
  if [[ ! -s "$ERG_DEST" ]]; then
    echo "  !! ERG 2024 PDF not fetched — try Transport Canada alt URL manually."
    echo "     Listed in manifest.json: url_pdf_alt"
    rm -f "$ERG_DEST"
  fi
fi

# 6. American Red Cross First Aid step pages — fair-use snippets
fetch "https://www.redcross.org/take-a-class/first-aid/performing-first-aid/" \
      "$CORPUS/redcross_first_aid/index.html" \
      "Red Cross First Aid index (fair-use)" || true
fetch "https://www.redcross.org/take-a-class/first-aid/performing-first-aid/severe-bleeding" \
      "$CORPUS/redcross_first_aid/severe-bleeding.html" \
      "Red Cross: severe bleeding" || true
fetch "https://www.redcross.org/take-a-class/first-aid/performing-first-aid/heat-stroke" \
      "$CORPUS/redcross_first_aid/heat-stroke.html" \
      "Red Cross: heat stroke" || true

# 7. CDC Heat Stress / Heat-Related Illness
fetch "https://www.cdc.gov/niosh/topics/heatstress/" \
      "$CORPUS/cdc_heat/niosh_heat_topic.html" \
      "CDC NIOSH heat-stress topic" || true
fetch "https://www.cdc.gov/niosh/topics/heatstress/heatrelillness.html" \
      "$CORPUS/cdc_heat/heat_related_illness.html" \
      "CDC NIOSH heat-related illness" || true
fetch "https://www.cdc.gov/disasters/extremeheat/heat_guide.html" \
      "$CORPUS/cdc_heat/extreme_heat_guide.html" \
      "CDC extreme-heat guide" || true

# 8. CDC / DHS Stop the Bleed
fetch "https://www.dhs.gov/stopthebleed" \
      "$CORPUS/cdc_stop_the_bleed/dhs_stop_the_bleed.html" \
      "DHS Stop the Bleed" || true
fetch "https://www.cdc.gov/niosh/topics/firstaid/" \
      "$CORPUS/cdc_stop_the_bleed/cdc_first_aid.html" \
      "CDC NIOSH first-aid topic" || true

echo
echo "== incident-copilot summary =="
find "$CORPUS" -type f | sort | while read -r f; do
  printf "  %s  %s\n" "$(du -h "$f" | cut -f1)" "${f#$REPO_ROOT/}"
done
TOTAL=$(du -sh "$CORPUS" 2>/dev/null | cut -f1 || echo "0")
echo "== incident-copilot total: $TOTAL =="

# ----------------------------------------------------------------------
# Investigation corpus (Sovereign Investigation Workbench pivot)
# Opt-in via FETCH_INVESTIGATION=1. Large download (~423 MB compressed).
# ----------------------------------------------------------------------
if [[ "${FETCH_INVESTIGATION:-0}" = "1" ]]; then
  echo
  echo "== fetching investigation corpus into $INV_CORPUS =="
  mkdir -p "$INV_CORPUS/enron"

  ENRON_TARBALL="$INV_CORPUS/enron_mail_20150507.tar.gz"
  ENRON_URL="https://www.cs.cmu.edu/~./enron/enron_mail_20150507.tar.gz"

  if [[ -s "$ENRON_TARBALL" ]]; then
    echo "  -- skip Enron tarball (already fetched: $(du -h "$ENRON_TARBALL" | cut -f1))"
  else
    echo "  -> downloading Enron Email Dataset from CMU (~423 MB, may take a while)"
    if curl -fSL -A "$UA" --retry 3 --retry-delay 5 --max-time 1800 \
         -o "$ENRON_TARBALL" "$ENRON_URL"; then
      echo "     ok ($(du -h "$ENRON_TARBALL" | cut -f1))"
    else
      echo "  !! Enron tarball fetch failed; investigation corpus unavailable."
      echo "     Try manually: curl -O '$ENRON_URL'"
      rm -f "$ENRON_TARBALL"
    fi
  fi

  # Selective extract: only the 3 mailboxes used by investigation-copilot.yaml.
  # Note: Sherron Watkins is NOT in the CMU 150-employee subset; we use
  # James Derrick (General Counsel) as the closest in-dataset analog for
  # whistleblower-style legal correspondence.
  # --strip-components=1 removes the leading "maildir/" component so files
  # land cleanly at $INV_CORPUS/enron/<who>/...
  if [[ -s "$ENRON_TARBALL" ]]; then
    for who in lay-k skilling-j derrick-j; do
      target="$INV_CORPUS/enron/$who"
      if [[ -d "$target" && -n "$(ls -A "$target" 2>/dev/null)" ]]; then
        echo "  -- skip extract $who (already present: $(du -sh "$target" 2>/dev/null | cut -f1))"
        continue
      fi
      echo "  -> extracting maildir/$who/ ..."
      if tar -xzf "$ENRON_TARBALL" -C "$INV_CORPUS/enron" \
          --strip-components=1 \
          "maildir/$who" 2>/dev/null; then
        if [[ -d "$target" ]]; then
          echo "     ok ($(du -sh "$target" 2>/dev/null | cut -f1))"
        else
          echo "     !! extract finished but $target missing — check tarball structure"
        fi
      else
        echo "     !! tar extract failed for $who"
      fi
    done
  fi

  # Generate synthetic leak-style markdown memos + CSV audit anomalies.
  # Uses pure-Python stdlib so no extra deps. PDFs/XLSX are stretch goals.
  GEN_SCRIPT="$REPO_ROOT/scripts/generate-synthetic-leak-docs.py"
  if [[ -x "$GEN_SCRIPT" || -f "$GEN_SCRIPT" ]]; then
    echo "  -> generating synthetic leak memos + audit anomalies"
    /opt/homebrew/bin/python3.12 "$GEN_SCRIPT" \
        --out-dir "$REPO_ROOT/benchmarks/datasets/investigation-corpus" \
        || echo "  !! synthetic doc generator failed; the demo will still run on Enron alone"
  else
    echo "  -- synthetic doc generator not yet present at $GEN_SCRIPT (T+120 task)"
  fi

  echo
  echo "== investigation-corpus summary =="
  if [[ -d "$INV_CORPUS" ]]; then
    find "$INV_CORPUS" -type d -maxdepth 4 | sort | while read -r d; do
      n=$(find "$d" -maxdepth 1 -type f | wc -l | tr -d ' ')
      sz=$(du -sh "$d" 2>/dev/null | cut -f1)
      printf "  %s  %s files  %s\n" "$sz" "$n" "${d#$REPO_ROOT/}"
    done
    INV_TOTAL=$(du -sh "$INV_CORPUS" 2>/dev/null | cut -f1 || echo "0")
    echo "== investigation-corpus total: $INV_TOTAL =="
  fi
fi

echo
echo "Next steps:"
echo "  /opt/homebrew/bin/python3.12 -m src.airgap.index --db benchmarks/datasets/incident-copilot/app.db"
if [[ "${FETCH_INVESTIGATION:-0}" = "1" ]]; then
  echo "  /opt/homebrew/bin/python3.12 -m src.airgap.index \\"
  echo "      --manifest benchmarks/datasets/investigation-corpus/manifest.json \\"
  echo "      --db benchmarks/datasets/investigation-corpus/app.db"
fi
