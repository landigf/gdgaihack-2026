#!/usr/bin/env bash
# Fetches the public-domain safety corpora listed in
# benchmarks/datasets/incident-copilot/manifest.json into the gitignored
# sources/ subtree on this machine. Idempotent: re-running re-fetches
# only what's missing.
#
# Run BEFORE going to airplane mode. Total download ~50 MB.
#
# Usage:
#   bash scripts/download-datasets.sh
#
# Honest license posture:
#   - All sources are US/EU government public domain EXCEPT
#     redcross_first_aid which is copyrighted; we fetch under
#     hackathon fair-use only and gitignore the bytes.
#   - manifest.json + this fetcher are committed; fetched bytes are not.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORPUS="$REPO_ROOT/benchmarks/datasets/incident-copilot/sources"
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
echo "== summary =="
find "$CORPUS" -type f | sort | while read -r f; do
  printf "  %s  %s\n" "$(du -h "$f" | cut -f1)" "${f#$REPO_ROOT/}"
done
TOTAL=$(du -sh "$CORPUS" 2>/dev/null | cut -f1 || echo "0")
echo "== total: $TOTAL =="
echo
echo "Next step: python3 -m src.airgap.index --db benchmarks/datasets/incident-copilot/app.db"
