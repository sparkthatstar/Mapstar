#!/bin/bash
# Bundle Mapstar for GitHub upload.
# Excludes node_modules, .next, db, .env, logs, sandbox internals.
set -e

OUT=/home/z/my-project/download/mapstar-github.zip
cd /home/z/my-project

# Remove old bundle
rm -f "$OUT"

# Create zip excluding heavy / sensitive paths
zip -r "$OUT" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "db/*" \
  -x ".zscripts/*" \
  -x "agent-ctx/*" \
  -x "download/*" \
  -x ".env" \
  -x ".env.local" \
  -x "dev.log" \
  -x "server.log" \
  -x "*.log" \
  -x ".git/*" \
  -x "tests/*" \
  -x ".DS_Store" \
  -x "*.tar" \
  -x "*.zip" \
  >/dev/null

echo "Bundle created: $OUT"
ls -lh "$OUT" | awk '{print "Size:", $5}'
echo ""
echo "Contents (top-level):"
unzip -l "$OUT" | tail -1
