#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORPUS_DIR="${ROOT_DIR}/mars-corpus"
MANIFEST="${CORPUS_DIR}/manifest.json"
PYTHON_BIN="${PYTHON_BIN:-python3}"
REGISTRY="$(mktemp)"

trap 'rm -f "${REGISTRY}"' EXIT

mkdir -p \
  "${CORPUS_DIR}/manuals" \
  "${CORPUS_DIR}/plant" \
  "${CORPUS_DIR}/emergency"

add_doc() {
  local category="$1"
  local filename="$2"
  local url="$3"
  local title="$4"
  local citation="$5"
  local license_note="$6"
  local required="$7"

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "${category}" "${filename}" "${url}" "${title}" "${citation}" "${license_note}" "${required}" >> "${REGISTRY}"
}

NASA_PUBLIC="NASA public website or NTRS public record; fetched from official NASA source at setup time. Do not commit the PDF."
NASA_PUBLIC_DOMAIN="NASA/NTRS public record marked public or public-use; US Government work where applicable. Do not commit the PDF."
NASA_STANDARD="NASA public technical standard; public accessibility via NASA. Do not commit the PDF."

# Required priority documents.
add_doc "manuals" "nasa-std-3001-vol-1-rev-c.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf" \
  "NASA-STD-3001 Volume 1, Revision C: Crew Health" \
  "NASA Office of the Chief Health and Medical Officer, NASA-STD-3001 Volume 1 Rev C, 2023." \
  "${NASA_STANDARD}" "required"

add_doc "manuals" "nasa-std-3001-vol-2-rev-d.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-2-rev-d-with-signature.pdf" \
  "NASA-STD-3001 Volume 2, Revision D: Human Factors, Habitability, and Environmental Health" \
  "NASA Office of the Chief Health and Medical Officer, NASA-STD-3001 Volume 2 Rev D, 2025." \
  "${NASA_STANDARD}" "required"

add_doc "manuals" "hrp-evidence-book.pdf" \
  "https://humanresearchroadmap.nasa.gov/evidence/reports/EvidenceBook.pdf" \
  "Human Health and Performance Risks of Space Exploration Missions: Evidence Reviewed by the NASA Human Research Program" \
  "McPhee, J. C. and Charles, J. B., eds., NASA Human Research Program Evidence Book, 2009." \
  "${NASA_PUBLIC}" "required"

add_doc "manuals" "mars-design-reference-architecture-5-sp-2009-566.pdf" \
  "https://www.nasa.gov/pdf/373665main_NASA-SP-2009-566.pdf" \
  "Human Exploration of Mars Design Reference Architecture 5.0" \
  "Drake, B. G., ed., NASA/SP-2009-566, Human Exploration of Mars Design Reference Architecture 5.0, 2009." \
  "${NASA_PUBLIC}" "required"

add_doc "plant" "veggie-fact-sheet-508.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/03/veggie-fact-sheet-508.pdf" \
  "Veggie Fact Sheet" \
  "NASA Kennedy Space Center, Veggie Fact Sheet, FS-2018-05-006-KSC." \
  "${NASA_PUBLIC}" "required"

add_doc "plant" "advanced-plant-habitat-fact-sheet.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2021/07/advanced-plant-habitat.pdf" \
  "Advanced Plant Habitat Fact Sheet" \
  "NASA Kennedy Space Center, Advanced Plant Habitat Fact Sheet, FS-2017-02-132-KSC." \
  "${NASA_PUBLIC}" "required"

add_doc "emergency" "medical-operations-technical-brief.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2025/08/ochmo-tb-044-medical-operations.pdf" \
  "NASA-STD-3001 Technical Brief: Medical Operations" \
  "NASA OCHMO Technical Brief OCHMO-TB-044, Medical Operations, 2025." \
  "${NASA_PUBLIC}; used as the public Medical Operations Requirements Document excerpt." "required"

# Mission operations, habitability, and life support references.
add_doc "manuals" "human-integration-design-handbook-rev-1.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/03/human-integration-design-handbook-revision-1.pdf" \
  "Human Integration Design Handbook, Revision 1" \
  "NASA/SP-2010-3407/REV1, Human Integration Design Handbook, 2014." \
  "${NASA_PUBLIC}" "optional"

add_doc "manuals" "human-integration-design-processes.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/03/human-integration-design-processes.pdf" \
  "Human Integration Design Processes" \
  "NASA/TP-2014-218556, Human Integration Design Processes, 2014." \
  "${NASA_PUBLIC}" "optional"

add_doc "manuals" "life-support-baseline-values-assumptions-rev-1.pdf" \
  "https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf" \
  "Life Support Baseline Values and Assumptions Document, Revision 1" \
  "Anderson, M. S. et al., NASA/TP-2015-218570/REV1, 2018." \
  "${NASA_PUBLIC_DOMAIN}" "optional"

add_doc "manuals" "eclss-human-centered-technical-brief.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/07/eclss-technical-brief-ochmo.pdf" \
  "Environmental Control and Life Support System: Human-Centered Approach" \
  "NASA OCHMO Technical Brief OCHMO-TB-002, Environmental Control and Life Support System, 2023." \
  "${NASA_PUBLIC}" "optional"

add_doc "manuals" "overview-nasa-eclss.pdf" \
  "https://ntrs.nasa.gov/api/citations/20100003025/downloads/20100003025.pdf" \
  "Overview of NASA's Environmental Control and Life Support Systems" \
  "Roman, M., NASA NTRS 20100003025, Overview of NASA's Environmental Control and Life Support Systems, 2009." \
  "${NASA_PUBLIC_DOMAIN}" "optional"

add_doc "manuals" "eclss-system-engineering-workshop.pdf" \
  "https://ntrs.nasa.gov/api/citations/20090029327/downloads/20090029327.pdf" \
  "Environmental Control and Life Support System System Engineering Workshop" \
  "Peterson, L. J., NASA NTRS 20090029327, ECLSS System Engineering Workshop, 2009." \
  "${NASA_PUBLIC_DOMAIN}" "optional"

add_doc "manuals" "human-health-performance-mars.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2024/01/human-health-and-performance.pdf" \
  "Human Health and Performance: Keeping Astronauts Safe and Productive on a Mission to Mars" \
  "NASA Johnson Space Center, Human Health and Performance: Keeping Astronauts Safe and Productive on a Mission to Mars." \
  "${NASA_PUBLIC}" "optional"

# Targeted HRP risk chapters for cleaner RAG retrieval than the compiled book alone.
add_doc "manuals" "hrp-sleep-risk.pdf" \
  "https://humanresearchroadmap.nasa.gov/Evidence/reports/Sleep.pdf" \
  "HRP Evidence Report: Sleep Loss, Circadian Desynchronization, and Work Overload" \
  "NASA Human Research Program Evidence Report, Sleep Risk." \
  "${NASA_PUBLIC}" "optional"

add_doc "manuals" "hrp-team-risk.pdf" \
  "https://humanresearchroadmap.nasa.gov/Evidence/reports/Team.pdf" \
  "HRP Evidence Report: Team Risk" \
  "NASA Human Research Program Evidence Report, Team Risk." \
  "${NASA_PUBLIC}" "optional"

add_doc "manuals" "hrp-food-nutrition-risk.pdf" \
  "https://humanresearchroadmap.nasa.gov/Evidence/reports/Food.pdf" \
  "HRP Evidence Report: Food and Nutrition Risk" \
  "NASA Human Research Program Evidence Report, Food and Nutrition Risk." \
  "${NASA_PUBLIC}" "optional"

add_doc "manuals" "hrp-sans-risk.pdf" \
  "https://humanresearchroadmap.nasa.gov/Evidence/reports/SANS.pdf" \
  "HRP Evidence Report: Spaceflight Associated Neuro-ocular Syndrome" \
  "NASA Human Research Program Evidence Report, SANS Risk." \
  "${NASA_PUBLIC}" "optional"

# Plant growth and food production.
add_doc "plant" "nasa-plant-research-mini-book.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2023/07/np-2023-jsc-plant-research-mini-book508c.pdf" \
  "NASA Plant Research Mini Book" \
  "NASA Johnson Space Center, NASA Plant Research Mini Book, NP-2023-JSC." \
  "${NASA_PUBLIC}" "optional"

add_doc "plant" "plant-water-management-microgravity.pdf" \
  "https://ntrs.nasa.gov/api/citations/20220003535/downloads/Plant%20Water%20Management%20in%20Microgravity%20Final%2002.pdf" \
  "Plant Water Management in Microgravity" \
  "Dreschel, T. et al., NASA NTRS 20220003535, Plant Water Management in Microgravity, 2022." \
  "${NASA_PUBLIC_DOMAIN}" "optional"

add_doc "plant" "plant-growth-optimization-hi-seas.pdf" \
  "https://ntrs.nasa.gov/api/citations/20170007809/downloads/20170007809.pdf" \
  "Plant Growth Optimization by Vegetable Production System in HI-SEAS Analog Habitat" \
  "Ehrlich, J. W. et al., NASA NTRS 20170007809, 2017." \
  "${NASA_PUBLIC_DOMAIN}" "optional"

add_doc "plant" "veggie-space-vegetables-iss-beyond.pdf" \
  "https://ntrs.nasa.gov/api/citations/20160004060/downloads/20160004060.pdf" \
  "Veggie: Space Vegetables for the International Space Station and Beyond" \
  "Massa, G. D. et al., NASA NTRS 20160004060, 2016." \
  "${NASA_PUBLIC_DOMAIN}" "optional"

add_doc "plant" "advanced-plant-habitat-ntrs.pdf" \
  "https://ntrs.nasa.gov/api/citations/20160005065/downloads/20160005065.pdf" \
  "Advanced Plant Habitat (APH)" \
  "Richards, S. E., Levine, H. G., and Reed, D. W., NASA NTRS 20160005065, 2016." \
  "${NASA_PUBLIC_DOMAIN}" "optional"

add_doc "plant" "spinoff-2017-controlled-release-fertilizer.pdf" \
  "https://spinoff.nasa.gov/Spinoff2017/pdf/Spinoff2017.pdf" \
  "NASA Spinoff 2017: Controlled-Release Fertilizer Takes Root in Fields, Groves Worldwide" \
  "NASA Spinoff 2017, Energy and Environment section, controlled-release fertilizer and Veggie." \
  "${NASA_PUBLIC}; NASA public publication fetched only at setup time." "optional"

# Emergency, EVA, fire safety, and medical contingency references.
add_doc "emergency" "nasa-std-6001b-change-3-flammability.pdf" \
  "https://standards.nasa.gov/sites/default/files/standards/NASA/B-w/CHANGE-3/3/2025_06_25_NASA-STD-6001B_w_Change_3_FINAL_Admin-Change-FINAL.pdf" \
  "NASA-STD-6001B w/Change 3: Flammability, Offgassing, and Compatibility Requirements and Test Procedures" \
  "NASA-STD-6001B w/Change 3, Flammability, Offgassing, and Compatibility Requirements and Test Procedures, 2025." \
  "${NASA_STANDARD}" "optional"

add_doc "emergency" "exploration-eva-system-conops-rev-b.pdf" \
  "https://www.nasa.gov/sites/default/files/atoms/files/eva-exp-0042_xeva_system_con_ops_rev_b_final_dtd_10192020_ref_doc.pdf" \
  "Exploration EVA System Concept of Operations, Revision B" \
  "NASA EVA-EXP-0042, Exploration EVA System Concept of Operations Rev B, 2020." \
  "${NASA_PUBLIC}" "optional"

add_doc "emergency" "ehp-integrated-conops-rev-b.pdf" \
  "https://ntrs.nasa.gov/api/citations/20240011450/downloads/EHP-10033_EHP%20Integrated%20Con%20Ops%20RevB_Final.pdf" \
  "Extravehicular Activity and Human Surface Mobility Program Integrated Concept of Operations" \
  "NASA/TM-20240011450, EHP Integrated Concept of Operations Rev B, 2024." \
  "${NASA_PUBLIC_DOMAIN}" "optional"

add_doc "emergency" "surface-eva-architectural-drivers.pdf" \
  "https://www.nasa.gov/wp-content/uploads/2024/01/surface-eva-architectural-drivers.pdf" \
  "Surface EVA Architectural Drivers" \
  "NASA OCHMO Technical Brief, Surface EVA Architectural Drivers, 2024." \
  "${NASA_PUBLIC}" "optional"

add_doc "emergency" "hrp-medical-risk.pdf" \
  "https://humanresearchroadmap.nasa.gov/Evidence/reports/Medical.pdf" \
  "HRP Evidence Report: In-Flight Medical Conditions" \
  "NASA Human Research Program Evidence Report, Medical Risk." \
  "${NASA_PUBLIC}" "optional"

add_doc "emergency" "hrp-eva-risk.pdf" \
  "https://humanresearchroadmap.nasa.gov/Evidence/reports/EVA.pdf" \
  "HRP Evidence Report: EVA Risk" \
  "NASA Human Research Program Evidence Report, EVA Risk." \
  "${NASA_PUBLIC}" "optional"

failed_required=0

while IFS=$'\t' read -r category filename url title citation license_note required; do
  out="${CORPUS_DIR}/${category}/${filename}"
  tmp="${out}.tmp"

  if test -f "${out}"; then
    printf 'OK existing %s\n' "${out#${ROOT_DIR}/}"
    continue
  fi

  printf 'FETCH %s\n' "${out#${ROOT_DIR}/}"
  if curl -fL -o "${tmp}" --retry 2 --retry-delay 1 --connect-timeout 20 --max-time 180 "${url}"; then
    if LC_ALL=C head -c 5 "${tmp}" | grep -q '%PDF-'; then
      mv "${tmp}" "${out}"
      printf 'OK downloaded %s\n' "${out#${ROOT_DIR}/}"
    else
      rm -f "${tmp}"
      if [[ "${required}" == "required" ]]; then
        printf 'FAILED REQUIRED non-PDF response: %s (%s)\n' "${title}" "${url}" >&2
        failed_required=$((failed_required + 1))
      else
        printf 'SKIPPED non-PDF response: %s (%s)\n' "${title}" "${url}" >&2
      fi
    fi
  else
    rm -f "${tmp}"
    if [[ "${required}" == "required" ]]; then
      printf 'FAILED REQUIRED download: %s (%s)\n' "${title}" "${url}" >&2
      failed_required=$((failed_required + 1))
    else
      printf 'SKIPPED download failed: %s (%s)\n' "${title}" "${url}" >&2
    fi
  fi
done < "${REGISTRY}"

"${PYTHON_BIN}" - "${REGISTRY}" "${CORPUS_DIR}" "${MANIFEST}" <<'PY'
import hashlib
import json
import pathlib
import sys
from datetime import datetime, timezone

registry = pathlib.Path(sys.argv[1])
corpus_dir = pathlib.Path(sys.argv[2])
manifest = pathlib.Path(sys.argv[3])

docs = []
for line in registry.read_text(encoding="utf-8").splitlines():
    category, filename, url, title, citation, license_note, required = line.split("\t")
    path = corpus_dir / category / filename
    if not path.exists():
        continue
    data = path.read_bytes()
    docs.append(
        {
            "category": category,
            "path": str(path.relative_to(corpus_dir.parent)),
            "title": title,
            "citation": citation,
            "url": url,
            "sha256": hashlib.sha256(data).hexdigest(),
            "size_bytes": len(data),
            "license_note": license_note,
            "required": required == "required",
        }
    )

payload = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "document_count": len(docs),
    "total_size_bytes": sum(doc["size_bytes"] for doc in docs),
    "documents": docs,
}
manifest.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(
    "MANIFEST {path} ({count} docs, {mib:.1f} MiB)".format(
        path=manifest,
        count=payload["document_count"],
        mib=payload["total_size_bytes"] / 1024 / 1024,
    )
)
PY

if (( failed_required > 0 )); then
  printf 'ERROR: %d required corpus downloads failed.\n' "${failed_required}" >&2
  exit 1
fi

printf 'DONE mars corpus download complete.\n'
