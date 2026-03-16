#!/bin/bash
# Rebuild search-index.js + auto-fix homepage counts + sitemap
# Run after ANY change: ./build-search-index.sh
# Also runs automatically via pre-commit hook

BASE="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$BASE/shared/js/search-index.js"

echo "=== Rebuilding search index ==="
echo "var TOOL_SEARCH_INDEX = [" > "$OUTPUT"

find "$BASE" -path "*/*/index.html" \
  -not -path "*/about/*" -not -path "*/contact/*" \
  -not -path "*/privacy/*" -not -path "*/terms/*" \
  -not -path "*/docs/*" -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  | sort | while read f; do

  slug=$(echo "$f" | sed "s|$BASE/||" | sed 's|/index.html||')

  title=$(grep -o '<h1>[^<]*</h1>' "$f" | head -1 | sed 's/<[^>]*>//g' | sed "s/'/\\\\'/g" | head -c 100)
  if [ -z "$title" ]; then
    title=$(grep -o '<title>[^<]*</title>' "$f" | head -1 | sed 's/<[^>]*>//g' | sed 's/ — .*//' | sed 's/ | .*//' | sed "s/'/\\\\'/g" | head -c 100)
  fi

  desc=$(grep -o 'name="description" content="[^"]*"' "$f" | head -1 | sed 's/name="description" content="//;s/"$//' | sed "s/'/\\\\'/g" | head -c 150)

  if [ -n "$title" ] && [ "$title" != "Teamz Lab Tools" ]; then
    echo "  {t:'$title',d:'$desc',h:'/$slug/'}," >> "$OUTPUT"
  fi
done

echo "];" >> "$OUTPUT"

search_count=$(grep -c "^  {" "$OUTPUT")
echo "  Search: $search_count tools indexed"

# === Auto-update cache buster ===
DATEVER=$(date +%Y%m%d%H%M)
sed -i '' "s|search-index.js?v=[0-9]*|search-index.js?v=$DATEVER|" "$BASE/index.html" 2>/dev/null

# === Auto-update homepage card counts ===
echo ""
echo "=== Updating homepage card counts ==="
for hub in ai evergreen dev text image tools freelance work diagnostic career student housing creator software compliance eu ramadan apple auto health kids music sports weather; do
  actual=$(find "$BASE/$hub" -name "index.html" -not -path "$BASE/$hub/index.html" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$actual" -gt 0 ]; then
    # Update the count in the homepage card for this hub
    # Match: href="/hub/" ... <p>NUMBER free ... and replace NUMBER with actual
    sed -i '' "s|href=\"/$hub/\" class=\"tool-card\"><div class=\"card\"><h3>\([^<]*\)</h3><p>[0-9]* free|href=\"/$hub/\" class=\"tool-card\"><div class=\"card\"><h3>\1</h3><p>$actual free|" "$BASE/index.html" 2>/dev/null
  fi
done

# Update search placeholder count
total_tools=$(find "$BASE" -path "*/*/index.html" -not -path "*/about/*" -not -path "*/contact/*" -not -path "*/privacy/*" -not -path "*/terms/*" -not -path "*/docs/*" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l | tr -d ' ')
sed -i '' "s|Search [0-9]*+ tools|Search ${total_tools}+ tools|" "$BASE/index.html" 2>/dev/null
echo "  Homepage: updated all card counts + search shows ${total_tools}+ tools"

echo ""
echo "=== Done ==="
