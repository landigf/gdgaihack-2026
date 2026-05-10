#!/usr/bin/env bash
# Convert a Sketchfab OBJ-bundle .zip into a self-contained .glb.
#
# Usage:
#   bash src/ares/3d/assets/plants/_source/convert.sh <species> <path-to-zip>
#
# Example:
#   bash src/ares/3d/assets/plants/_source/convert.sh tomato ~/Downloads/tomato-plant.zip
#
# Output:
#   src/ares/3d/assets/plants/<species>.glb  (textures embedded as base64)
#
# Requires: npx (Node.js), unzip. obj2gltf is fetched on-demand by npx.

set -euo pipefail

SPECIES="${1:?usage: convert.sh <species> <zip>}"
ZIP="${2:?usage: convert.sh <species> <zip>}"
REPO_ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
DEST="${REPO_ROOT}/src/ares/3d/assets/plants/${SPECIES}.glb"

WORK="$(mktemp -d -t plant-${SPECIES}-XXXXXX)"
trap 'rm -rf "${WORK}"' EXIT
echo "→ workspace: ${WORK}"

echo "→ unzip outer: ${ZIP}"
unzip -q -o "${ZIP}" -d "${WORK}"

# Sketchfab packs the OBJ + MTL inside a nested zip in source/
INNER_ZIP="$(find "${WORK}" -maxdepth 3 -type f -name '*.zip' | head -1 || true)"
if [[ -n "${INNER_ZIP}" ]]; then
  echo "→ unzip nested: ${INNER_ZIP}"
  unzip -q -o "${INNER_ZIP}" -d "${WORK}/obj/"
fi

# Find the OBJ to convert
OBJ="$(find "${WORK}" -type f -iname '*.obj' | head -1)"
if [[ -z "${OBJ}" ]]; then
  echo "✗ no .obj found in ${ZIP}" >&2
  exit 1
fi
echo "→ obj: ${OBJ}"

# Some Sketchfab MTLs reference textures that aren't shipped. We can't
# auto-fix that — if the conversion warns about missing textures, edit
# the .mtl by hand to point at a shipped one (see tomato example).

echo "→ obj2gltf → ${DEST}"
mkdir -p "$(dirname "${DEST}")"
npx --yes obj2gltf -i "${OBJ}" -o "${DEST}"

echo "✓ ${DEST}"
ls -lh "${DEST}"
