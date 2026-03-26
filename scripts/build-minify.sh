#!/bin/bash
# ============================================================
# Teamz Lab Tools — Minify Shared CSS & JS
# Creates .min versions alongside source files
# Run after editing any shared CSS/JS
#
# Usage:
#   ./build-minify.sh           # Minify all
#   ./build-minify.sh --js      # JS only
#   ./build-minify.sh --css     # CSS only
# ============================================================

cd "$(dirname "$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")")/.."

JS_ONLY=false
CSS_ONLY=false
if [ "$1" = "--js" ]; then JS_ONLY=true; fi
if [ "$1" = "--css" ]; then CSS_ONLY=true; fi

echo ""
echo "============================================================"
echo "  MINIFY — Shared CSS & JS"
echo "============================================================"

# --- CSS Minification (simple but effective: strip comments + whitespace) ---
minify_css() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$src" ]; then echo "  SKIP $src (not found)"; return; fi
  local before=$(wc -c < "$src" | tr -d ' ')
  # Remove comments, collapse whitespace, strip trailing semicolons before }
  python3 -c "
import re, sys
with open('$src') as f: css = f.read()
# Remove multi-line comments
css = re.sub(r'/\*[\s\S]*?\*/', '', css)
# Collapse whitespace
css = re.sub(r'\s+', ' ', css)
# Remove space around selectors/braces
css = re.sub(r'\s*{\s*', '{', css)
css = re.sub(r'\s*}\s*', '}', css)
css = re.sub(r'\s*;\s*', ';', css)
css = re.sub(r'\s*:\s*', ':', css)
css = re.sub(r'\s*,\s*', ',', css)
# Remove trailing semicolons
css = css.replace(';}', '}')
# Remove leading/trailing whitespace
css = css.strip()
with open('$dest', 'w') as f: f.write(css)
"
  local after=$(wc -c < "$dest" | tr -d ' ')
  local saved=$((before - after))
  local pct=$((saved * 100 / before))
  echo "  OK  $src → $dest  ($before → $after bytes, -${pct}%)"
}

# --- JS Minification (via terser) ---
minify_js() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$src" ]; then echo "  SKIP $src (not found)"; return; fi
  local before=$(wc -c < "$src" | tr -d ' ')
  npx terser "$src" --compress --mangle --output "$dest" 2>/dev/null
  if [ $? -ne 0 ]; then
    echo "  ERR  $src — terser failed, using simple minify"
    # Fallback: just strip comments and whitespace
    python3 -c "
import re
with open('$src') as f: js = f.read()
js = re.sub(r'//[^\n]*', '', js)
js = re.sub(r'/\*[\s\S]*?\*/', '', js)
js = re.sub(r'\n\s*\n', '\n', js)
with open('$dest', 'w') as f: f.write(js)
"
  fi
  local after=$(wc -c < "$dest" | tr -d ' ')
  local saved=$((before - after))
  local pct=$((saved * 100 / before))
  echo "  OK  $src → $dest  ($before → $after bytes, -${pct}%)"
}

if [ "$JS_ONLY" = false ]; then
  echo ""
  echo "  CSS files:"
  minify_css "branding/css/teamz-branding.css" "branding/css/teamz-branding.min.css"
  minify_css "shared/css/tools.css" "shared/css/tools.min.css"
fi

if [ "$CSS_ONLY" = false ]; then
  echo ""
  echo "  JS files:"
  minify_js "shared/js/common.js" "shared/js/common.min.js"
  minify_js "shared/js/tool-engine.js" "shared/js/tool-engine.min.js"
  minify_js "shared/js/utility-engine.js" "shared/js/utility-engine.min.js"
  minify_js "shared/js/smart-search.js" "shared/js/smart-search.min.js"
  minify_js "shared/js/adsense.js" "shared/js/adsense.min.js"
fi

echo ""
echo "  Done! Update HTML references to use .min versions for production."
echo "============================================================"
