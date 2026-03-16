#!/bin/bash
# Rebuild sitemap.xml from all tool pages
# Run after adding/removing any tool: ./build-sitemap.sh

BASE="$(cd "$(dirname "$0")" && pwd)"

# Helper: get lastmod date from git history for a file
get_lastmod() {
  local file="$1"
  local date
  date=$(git -C "$BASE" log -1 --format="%as" -- "$file" 2>/dev/null)
  if [ -z "$date" ]; then
    date=$(date +%Y-%m-%d)
  fi
  echo "$date"
}

{
echo '<?xml version="1.0" encoding="UTF-8"?>'
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

# Static pages with lastmod
home_mod=$(get_lastmod "index.html")
echo "  <url>"
echo "    <loc>https://tool.teamzlab.com/</loc>"
echo "    <lastmod>$home_mod</lastmod>"
echo "    <changefreq>weekly</changefreq>"
echo "    <priority>1.0</priority>"
echo "  </url>"

for static_page in about contact privacy terms; do
  case "$static_page" in
    about|contact) prio="0.5" ;;
    *) prio="0.3" ;;
  esac
  mod=$(get_lastmod "$static_page/index.html")
  echo "  <url>"
  echo "    <loc>https://tool.teamzlab.com/$static_page/</loc>"
  echo "    <lastmod>$mod</lastmod>"
  echo "    <changefreq>monthly</changefreq>"
  echo "    <priority>$prio</priority>"
  echo "  </url>"
done

# Tool pages — exclude static pages, root index.html, docs, node_modules
find "$BASE" -path "*/*/index.html" \
  -not -path "*/about/*" -not -path "*/contact/*" \
  -not -path "*/privacy/*" -not -path "*/terms/*" \
  -not -path "*/docs/*" -not -path "*/node_modules/*" \
  | sed "s|$BASE/||" | sed 's|/index.html||' | sort | while read slug; do
  # Skip the root index.html (already added as homepage above)
  if [ "$slug" = "index.html" ] || [ -z "$slug" ]; then
    continue
  fi
  mod=$(get_lastmod "$slug/index.html")
  echo "  <url>"
  echo "    <loc>https://tool.teamzlab.com/$slug/</loc>"
  echo "    <lastmod>$mod</lastmod>"
  echo "    <changefreq>monthly</changefreq>"
  echo "    <priority>0.7</priority>"
  echo "  </url>"
done

echo '</urlset>'
} > "$BASE/sitemap.xml"

count=$(grep -c '<url>' "$BASE/sitemap.xml")
echo "Sitemap rebuilt: $count URLs in sitemap.xml"
