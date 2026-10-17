#!/bin/bash
# Bundle all Mapstar source — excludes only regenerable/sandbox paths.
set -e
OUT=/home/z/my-project/download/mapstar-source.zip
cd /home/z/my-project
rm -f "$OUT"

zip -r "$OUT" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "db/*" \
  -x ".zscripts/*" \
  -x "agent-ctx/*" \
  -x "download/*" \
  -x "skills/*" \
  -x "upload/*" \
  -x ".env" \
  -x ".env.local" \
  -x "dev.log" \
  -x "server.log" \
  -x "*.log" \
  -x ".git/*" \
  -x "*.tar" \
  -x "*.zip" \
  -x "__pycache__/*" \
  -x "*.pyc" \
  >/dev/null

echo "Bundle: $OUT"
ls -lh "$OUT" | awk '{print "Size:", $5}'
echo "File count:"
unzip -l "$OUT" | tail -1
