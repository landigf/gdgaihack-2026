#!/usr/bin/env bash
# Render doc/TECHNICAL_WRITEUP.tex -> doc/TECHNICAL_WRITEUP.pdf.
#
# Usage:
#   bash scripts/build-writeup-pdf.sh
#
# Requires: latexmk + xelatex (MacTeX / BasicTeX).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/doc/TECHNICAL_WRITEUP.tex"
DST="$ROOT/doc/TECHNICAL_WRITEUP.pdf"
OUTDIR="$(mktemp -d "${TMPDIR:-/tmp}/houston-writeup.XXXXXX")"
trap 'rm -rf "$OUTDIR"' EXIT

if [ ! -f "$SRC" ]; then
    echo "ERR: $SRC not found" >&2
    exit 1
fi

if ! command -v latexmk >/dev/null 2>&1; then
    echo "ERR: latexmk not on PATH. Install MacTeX or BasicTeX." >&2
    exit 1
fi

if ! command -v xelatex >/dev/null 2>&1; then
    echo "ERR: xelatex not on PATH. Install MacTeX or BasicTeX." >&2
    exit 1
fi

cd "$ROOT"
echo "Rendering LaTeX with latexmk/xelatex..."
latexmk \
    -xelatex \
    -interaction=nonstopmode \
    -halt-on-error \
    -file-line-error \
    -outdir="$OUTDIR" \
    "$SRC"

cp "$OUTDIR/TECHNICAL_WRITEUP.pdf" "$DST"

echo "OK → $DST ($(du -h "$DST" | cut -f1))"
