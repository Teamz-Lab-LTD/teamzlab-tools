#!/bin/bash
# MASTER BUILD SCRIPT — Run after ANY changes
# Usage: ./build.sh
# This prevents all common mistakes by auto-fixing everything

BASE="$(cd "$(dirname "$0")" && pwd)"
ERRORS=0

echo "============================================="
echo "  Teamz Lab Tools — Build & Validate"
echo "============================================="
echo ""

# 1. Rebuild search index
echo "[1/7] Rebuilding search index..."
bash "$BASE/build-search-index.sh"

# 2. Rebuild sitemap
echo ""
echo "[2/7] Rebuilding sitemap..."
bash "$BASE/build-sitemap.sh"

# 3. Update homepage card counts
echo ""
echo "[3/7] Checking homepage card counts..."
for hub in work diagnostic freelance creator student housing career software dev text image compliance eu ramadan tools ai apple auto evergreen health kids music sports weather; do
  actual=$(find "$BASE/$hub" -name "index.html" -not -path "$BASE/$hub/index.html" 2>/dev/null | wc -l | tr -d ' ')
  shown=$(grep "href=\"/$hub/\"" "$BASE/index.html" | grep -o '<p>[0-9]* ' | grep -o '[0-9]*')
  if [ -n "$shown" ] && [ "$shown" != "$actual" ]; then
    echo "  MISMATCH: /$hub/ shows $shown but has $actual tools"
    ERRORS=$((ERRORS + 1))
  fi
done
if [ $ERRORS -eq 0 ]; then
  echo "  All card counts correct!"
fi

# 4. Check for hardcoded colors in new/modified files
echo ""
echo "[4/7] Checking for hardcoded colors..."
changed_files=$(git diff --name-only HEAD~1 2>/dev/null | grep '\.html$')
if [ -n "$changed_files" ]; then
  color_violations=0
  for f in $changed_files; do
    if [ -f "$BASE/$f" ]; then
      # Check for color: #fff with accent background (the neon text issue)
      if grep -q 'background.*var(--accent).*color.*#fff\|color.*#fff.*background.*var(--accent)' "$BASE/$f" 2>/dev/null; then
        echo "  WARNING: $f has white text on accent background"
        color_violations=$((color_violations + 1))
      fi
    fi
  done
  if [ $color_violations -eq 0 ]; then
    echo "  No color violations found!"
  fi
else
  echo "  No changed HTML files to check"
fi

# 5. Check for unlinked tools (tools with no hub reference)
echo ""
echo "[5/7] Checking for unlinked tools..."
unlinked=0
for tooldir in "$BASE"/tools/*/; do
  toolname=$(basename "$tooldir")
  if [ -f "$tooldir/index.html" ]; then
    # Check if any hub page links to this tool
    if ! grep -rq "$toolname" "$BASE/tools/index.html" "$BASE/ai/index.html" "$BASE/index.html" 2>/dev/null; then
      echo "  UNLINKED: /tools/$toolname/ — not referenced in any hub"
      unlinked=$((unlinked + 1))
    fi
  fi
done
if [ $unlinked -eq 0 ]; then
  echo "  All tools are linked!"
fi

# 6. Check for duplicate tools (same slug name in different hubs)
echo ""
echo "[6/7] Checking for duplicate tools..."
dupes=$(find "$BASE" -name "index.html" -path "*/*/index.html" \
  -not -path "*/about/*" -not -path "*/contact/*" -not -path "*/privacy/*" \
  -not -path "*/terms/*" -not -path "*/docs/*" -not -path "*/node_modules/*" \
  -not -path "*/.git/*" | sed "s|$BASE/||;s|/index.html||" | awk -F/ '{print $NF}' | sort | uniq -d)
if [ -n "$dupes" ]; then
  echo "  DUPLICATES FOUND (same tool name in multiple hubs):"
  for d in $dupes; do
    echo "    '$d' exists in:"
    find "$BASE" -path "*/$d/index.html" | sed "s|$BASE/|      /|;s|/index.html||"
    ERRORS=$((ERRORS + 1))
  done
else
  echo "  No duplicate tool names found!"
fi

# Also check for very similar tool names (potential overlaps)
similar=$(find "$BASE" -name "index.html" -path "*/*/index.html" \
  -not -path "*/about/*" -not -path "*/contact/*" -not -path "*/privacy/*" \
  -not -path "*/terms/*" -not -path "*/docs/*" -not -path "*/node_modules/*" \
  -not -path "*/.git/*" | sed "s|$BASE/||;s|/index.html||" | awk -F/ '{print $NF}' | sort | \
  awk 'prev && index($0, prev)==1 || index(prev, $0)==1 {print prev " <-> " $0} {prev=$0}')
if [ -n "$similar" ]; then
  echo "  SIMILAR names (possible overlaps):"
  echo "$similar" | sed 's/^/    /'
fi

# 7. SEO Keyword Audit (automated keyword placement check)
echo ""
echo "[7/7] Running SEO keyword audit..."
if [ -f "$BASE/seo-keyword-engine.py" ] && command -v python3 &>/dev/null; then
  SEO_OUTPUT=$(python3 "$BASE/seo-keyword-engine.py" audit 2>&1)
  # Extract just the summary lines
  AVG_SCORE=$(echo "$SEO_OUTPUT" | grep "Average score" | awk '{print $3}')
  CRITICAL_COUNT=$(echo "$SEO_OUTPUT" | grep "CRITICAL" | head -1 | grep -o '[0-9]* tools' | awk '{print $1}')
  echo "  SEO average score: $AVG_SCORE"
  if [ -n "$CRITICAL_COUNT" ] && [ "$CRITICAL_COUNT" -gt 0 ] 2>/dev/null; then
    echo "  WARNING: $CRITICAL_COUNT tools scoring below 50 — run './build-seo-audit.sh --verbose' for details"
  else
    echo "  All tools passing SEO keyword checks!"
  fi
  echo "  Full report: ./build-seo-audit.sh --report"
else
  echo "  SKIPPED: seo-keyword-engine.py or python3 not found"
fi

echo ""
echo "============================================="
total=$(grep -c '<url>' "$BASE/sitemap.xml")
search_count=$(grep -c "^  {" "$BASE/shared/js/search-index.js" 2>/dev/null)
echo "  Total tools in sitemap: $total"
echo "  Total tools in search: $search_count"
echo "  Errors found: $ERRORS"
if [ $ERRORS -gt 0 ] || [ $unlinked -gt 0 ]; then
  echo "  STATUS: NEEDS ATTENTION"
else
  echo "  STATUS: ALL GOOD"
fi
echo "============================================="
