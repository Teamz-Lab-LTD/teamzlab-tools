#!/bin/bash
# Rebuild sitemap.xml from all tool pages
# Run after adding/removing any tool: ./build-sitemap.sh

BASE="$(cd "$(dirname "$0")" && pwd)"

{
echo '<?xml version="1.0" encoding="UTF-8"?>'
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
echo '  <url><loc>https://tool.teamzlab.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>'
echo '  <url><loc>https://tool.teamzlab.com/about/</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>'
echo '  <url><loc>https://tool.teamzlab.com/contact/</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>'
echo '  <url><loc>https://tool.teamzlab.com/privacy/</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>'
echo '  <url><loc>https://tool.teamzlab.com/terms/</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>'
find "$BASE" -path "*/*/index.html" \
  -not -path "*/about/*" -not -path "*/contact/*" \
  -not -path "*/privacy/*" -not -path "*/terms/*" \
  -not -path "*/docs/*" -not -path "*/node_modules/*" \
  | sed "s|$BASE/||" | sed 's|/index.html||' | sort | while read slug; do
  echo "  <url><loc>https://tool.teamzlab.com/$slug/</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>"
done
echo '</urlset>'
} > "$BASE/sitemap.xml"

count=$(grep -c '<url>' "$BASE/sitemap.xml")
echo "Sitemap rebuilt: $count URLs in sitemap.xml"
