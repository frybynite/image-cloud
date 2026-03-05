#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."

cd "$ROOT"

echo "=== Building JS/CSS ==="
npm run build

echo "=== Building MkDocs ==="
python3 -m mkdocs build

echo "=== Copying assets ==="
cp -r configurator site/
cp -r examples site/
cp -r dist site/

echo "=== Done: site/ is ready ==="
