#!/bin/bash
# Bundle EVERYTHING in /home/z/my-project into one zip — no exclusions.
set -e
OUT=/home/z/my-project/download/mapstar-full.zip
cd /home/z/my-project
rm -f "$OUT"
zip -r "$OUT" . -x "download/*" "*.zip" >/dev/null
echo "Bundle: $OUT"
ls -lh "$OUT" | awk '{print "Size:", $5}'
echo "File count:"
unzip -l "$OUT" | tail -1
