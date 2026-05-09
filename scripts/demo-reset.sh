#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
rm -rf "$ROOT/backend/data"
echo "Index wiped. Re-index a folder via the UI."
