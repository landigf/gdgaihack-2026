#!/usr/bin/env bash
# Render doc/TECHNICAL_WRITEUP.md → doc/TECHNICAL_WRITEUP.pdf via pandoc.
# Plots from benchmarks/houston/out/ are embedded inline because the markdown
# already references them as relative links.
#
# Usage:
#   bash scripts/build-writeup-pdf.sh
#
# Requires: pandoc + a LaTeX engine (we try xelatex; falls back to wkhtmltopdf
# via the `--pdf-engine=wkhtmltopdf` flag if you don't have a LaTeX install).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/doc/TECHNICAL_WRITEUP.md"
DST="$ROOT/doc/TECHNICAL_WRITEUP.pdf"

if [ ! -f "$SRC" ]; then
    echo "ERR: $SRC not found" >&2
    exit 1
fi

if ! command -v pandoc >/dev/null 2>&1; then
    echo "ERR: pandoc not on PATH. brew install pandoc" >&2
    exit 1
fi

# Try xelatex first (quality), then wkhtmltopdf, then HTML→PDF via Chrome
ENGINE=""
for cand in xelatex pdflatex wkhtmltopdf; do
    if command -v "$cand" >/dev/null 2>&1; then
        ENGINE="$cand"
        break
    fi
done

cd "$ROOT"  # keep relative image paths working

if [ -n "$ENGINE" ]; then
    echo "Rendering with pandoc ($ENGINE)…"
    pandoc "$SRC" \
        -o "$DST" \
        --pdf-engine="$ENGINE" \
        -V geometry:margin=2cm \
        -V fontsize=10pt \
        -V mainfont="Helvetica" \
        -V monofont="Menlo" \
        --highlight-style=tango \
        --metadata title="Rover Houston — Technical Writeup" \
        --metadata author="Team PoliSa" \
        --metadata date="$(date -u +%Y-%m-%d)"
else
    echo "No LaTeX engine found; falling back to HTML render via pandoc."
    HTML="$ROOT/doc/TECHNICAL_WRITEUP.html"
    pandoc "$SRC" -o "$HTML" --standalone --highlight-style=tango \
        --metadata title="Rover Houston — Technical Writeup"
    echo "HTML written to $HTML — open in Chrome and File → Print → Save as PDF."
    echo "Or install MacTeX: brew install --cask mactex-no-gui"
    exit 0
fi

echo "OK → $DST ($(du -h "$DST" | cut -f1))"
