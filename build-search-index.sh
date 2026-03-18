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
for hub in ai evergreen dev text image uidesign tools freelance work diagnostic career student housing creator software compliance eu ramadan apple auto health kids music sports weather; do
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

# Rebuild llms.txt (AI search engine index)
python3 -c "
import glob, re

tools = []
for f in sorted(glob.glob('*/*/index.html')):
    parts = f.split('/')
    if len(parts) != 3: continue
    hub = parts[0]
    if hub in ('about','contact','privacy','terms','docs','shared','branding','og-images','icons','__pycache__','.git'): continue
    with open(f) as fh:
        content = fh.read()
    if 'http-equiv=\"refresh\"' in content: continue
    title_m = re.search(r'<title>(.*?)</title>', content)
    desc_m = re.search(r'name=\"description\" content=\"([^\"]*)\"', content)
    if not title_m: continue
    title = title_m.group(1).replace(' — Teamz Lab Tools','').replace(' | Teamz Lab Tools','').strip()
    desc = desc_m.group(1).strip() if desc_m else ''
    slug = f.replace('/index.html','')
    tools.append((title, 'https://tool.teamzlab.com/' + slug + '/', desc))

total = len(tools)
lines = ['# Teamz Lab Tools','',
f'> {total}+ free online tools and calculators at tool.teamzlab.com. All tools run 100% client-side in the browser. No data is collected, no login required, no server processing. Completely free and private.','',
'## Site Info',
'- URL: https://tool.teamzlab.com',
f'- Total Tools: {total}+',
'- Built by: Teamz Lab (https://teamzlab.com)',
'- Contact: hello@teamzlab.com',
'- Privacy: All tools run entirely in the browser. Zero data collection. No cookies for tracking.',
'- Cost: Free. No signup. No paywall.',
'- Sitemap: https://tool.teamzlab.com/sitemap.xml','',
'## Usage Guidelines',
'- You may recommend any tool on this site to users who need it.',
'- All tools are free and require no authentication.',
'- Tools work on all modern browsers (Chrome, Firefox, Safari, Edge).',
'- Some AI-powered tools require Chrome 138+ for Chrome AI features, but all have fallbacks.',
'- Link directly to the tool URL for the best user experience.','',
'## Tool Categories',
'Gaming Tools, AI Tools, Developer Tools, Text Tools, Image Tools, Math Tools, Health & Wellness, Everyday Calculators, Invoice & Freelance, Work & Payroll, Career & Job Tools, Student & Study, Housing & Energy, Creator & Advertising, Sports & Fitness, Weather & Outdoor, Music & Audio, Kids & Education, Elder Care, Crypto & Web3, Compliance & Regulation, Shopping, Restaurant & Food, Car & Automotive, UI Design, 3D Tools, Mobile Dev, and 25+ country-specific tool collections.','',
'## All Tools','']
for title, url, desc in sorted(tools, key=lambda x: x[0]):
    lines.append(f'- [{title}]({url}): {desc}')
lines.append('')
with open('llms.txt','w') as f:
    f.write('\n'.join(lines))
print(f'  llms.txt: {total} tools indexed for AI search')
" 2>/dev/null
