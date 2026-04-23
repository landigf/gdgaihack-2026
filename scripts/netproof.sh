#!/usr/bin/env bash
# Captures proof-of-no-egress during a demo dry-run.
# Writes under doc/specs/cut-the-cord/evidence/.
# Requires sudo for tcpdump.
set -euo pipefail

EVIDENCE_DIR="doc/specs/cut-the-cord/evidence"
mkdir -p "$EVIDENCE_DIR"
TS=$(date +%Y%m%d-%H%M%S)
OUT="$EVIDENCE_DIR/tcpdump-$TS.pcap"
SUMMARY="$EVIDENCE_DIR/tcpdump-$TS.txt"

echo "Recording network traffic for 90 seconds to: $OUT"
echo "Run your demo now. sudo will prompt for your password."
echo

sudo tcpdump -i any -w "$OUT" -G 90 -W 1 -s 96 2>"$SUMMARY" || true

echo "Summary:"
echo "--------"
sudo tcpdump -r "$OUT" 2>/dev/null | head -50 | tee -a "$SUMMARY"
echo "--------"
echo "Packets captured: $(sudo tcpdump -r "$OUT" 2>/dev/null | wc -l | tr -d ' ')"
echo
echo "If this number is >0 during 'airplane mode' demo, investigate before pitch."
echo "Artifacts in: $EVIDENCE_DIR"
echo "OK"
