#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Allow-list: localhost, schema/docs URLs in config files, rustup installer in setup
HITS=$(grep -RInE 'https?://(?!localhost|127\.0\.0\.1|sh\.rustup\.rs|schema\.tauri\.app|tauri\.localhost)' \
    --include='*.py' --include='*.ts' --include='*.tsx' --include='*.rs' \
    "$ROOT/backend" "$ROOT/src" "$ROOT/src-tauri/src" 2>/dev/null \
    | grep -vE '(test_|//|#|\.example|README)' || true)

if [ -n "$HITS" ]; then
    echo "FAIL — external URLs found:"
    echo "$HITS"
    exit 1
fi
echo "OK — no external network references in source."
