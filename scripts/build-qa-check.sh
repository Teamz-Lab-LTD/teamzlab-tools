#!/bin/bash
# ============================================
# Teamz Lab Tools — Unified QA + UX Checker
# Covers: SEO structure, runtime safety, UX usability, design system
# Run: ./build-qa-check.sh [--hub ai] [--verbose]
# ============================================

SCRIPTS="$(cd "$(dirname "$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")")" && pwd)"
BASE="$(dirname "$SCRIPTS")"
cd "$BASE"

RED='\033[0;31m'
YEL='\033[1;33m'
GRN='\033[0;32m'
CYN='\033[0;36m'
NC='\033[0m'

HUB_FILTER=""
VERBOSE=false
for arg in "$@"; do
  case "$arg" in
    --verbose) VERBOSE=true ;;
    --hub) HUB_FILTER="next" ;;
    *)
      if [ "$HUB_FILTER" = "next" ]; then HUB_FILTER="$arg"; fi
      ;;
  esac
done

echo "============================================"
echo "  Teamz Lab Tools — QA + UX Checker"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "============================================"
echo ""

# Build tool list (only actual tool pages, not hubs or redirects)
TMPFILE=$(mktemp)
if [ -n "$HUB_FILTER" ] && [ "$HUB_FILTER" != "next" ]; then
  find "$HUB_FILTER" -name "index.html" -not -path "*/index.html" 2>/dev/null | sort > "$TMPFILE"
else
  find . -name "index.html" -not -path "./index.html" \
    -not -path "./shared/*" -not -path "./branding/*" -not -path "./docs/*" \
    -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./scripts/*" \
    -not -path "./about/*" -not -path "./contact/*" -not -path "./privacy/*" -not -path "./terms/*" \
    -not -path "./.claude*" -not -path "./teamzlab-website/*" \
    -not -path "./flutter_*/*" -not -path "./ai_*/*" -not -path "./hazira*/*" \
    -not -path "./chopstick*/*" -not -path "./notetube*/*" -not -path "./jiwer*/*" \
    -not -path "./no-trace*/*" -not -path "./room_*/*" -not -path "./toss_*/*" \
    -not -path "./top_3*/*" -not -path "./youtube_*/*" -not -path "./zoyiai/*" \
    -not -path "./apps*/*" \
    | grep -v -E "^./[^/]+/index.html$" \
    | sort > "$TMPFILE"
fi

TOOL_COUNT=$(wc -l < "$TMPFILE" | tr -d ' ')
echo "  Scanning $TOOL_COUNT tool pages..."
echo ""

# --- Counters ---
TOTAL=0
# SEO
NO_JS=0; LOW_CONTENT=0; NO_FAQS=0; NO_RELATED=0; NO_SCHEMA=0; NO_COPY_HANDLER=0
# Runtime
ALERT_COUNT=0; AI_NO_ENGINE=0; NULL_BG=0
# UX
NO_HERO=0; NO_DESC=0; NO_LABELS=0; NO_IDS=0; NO_MOBILE=0; NO_SCROLL=0
WHITE_ACCENT=0; NO_LOADING=0

# Issue lists for verbose
ISSUES_SEO=""
ISSUES_RUNTIME=""
ISSUES_UX=""

while IFS= read -r f; do
  [ -z "$f" ] && continue
  TOTAL=$((TOTAL + 1))
  CONTENT=$(cat "$f" 2>/dev/null)
  SLUG=$(echo "$f" | sed "s|^\./||" | sed "s|/index\.html$||")

  # Skip redirect pages
  is_redirect=$(echo "$CONTENT" | grep -c 'meta.*refresh\|window\.location\.\|location\.href\s*=' 2>/dev/null || true)
  [ "$is_redirect" -gt 0 ] && continue

  # ===== SEO STRUCTURE =====

  # No JS logic
  has_js=$(echo "$CONTENT" | grep -c 'addEventListener\|function ' 2>/dev/null || true)
  if [ "$has_js" -eq 0 ]; then
    NO_JS=$((NO_JS + 1))
    ISSUES_SEO="$ISSUES_SEO
  ${RED}NO JS:${NC} $SLUG"
  fi

  # Low content
  words=$(sed -n '/<section class="tool-content">/,/<\/section>/p' "$f" 2>/dev/null | sed 's/<[^>]*>//g' | wc -w | tr -d ' ')
  if [ "$words" -lt 150 ] 2>/dev/null; then
    LOW_CONTENT=$((LOW_CONTENT + 1))
    ISSUES_SEO="$ISSUES_SEO
  ${YEL}LOW CONTENT (${words}w):${NC} $SLUG"
  fi

  # Missing FAQs
  has_faq=$(echo "$CONTENT" | grep -c 'renderFAQs\|injectFAQSchema\|FAQPage' 2>/dev/null || true)
  if [ "$has_faq" -eq 0 ]; then NO_FAQS=$((NO_FAQS + 1)); fi

  # Missing related tools
  has_related=$(echo "$CONTENT" | grep -c 'renderRelatedTools\|related-tools' 2>/dev/null || true)
  if [ "$has_related" -eq 0 ]; then NO_RELATED=$((NO_RELATED + 1)); fi

  # Missing WebApp schema
  has_webapp=$(echo "$CONTENT" | grep -c 'injectWebAppSchema\|WebApplication' 2>/dev/null || true)
  if [ "$has_webapp" -eq 0 ]; then NO_SCHEMA=$((NO_SCHEMA + 1)); fi

  # Broken Copy Image
  has_copy_img=$(echo "$CONTENT" | grep -ci 'Copy Image' 2>/dev/null || true)
  has_clipboard_item=$(echo "$CONTENT" | grep -c 'ClipboardItem' 2>/dev/null || true)
  if [ "$has_copy_img" -gt 0 ] && [ "$has_clipboard_item" -eq 0 ]; then
    NO_COPY_HANDLER=$((NO_COPY_HANDLER + 1))
    ISSUES_SEO="$ISSUES_SEO
  ${RED}BROKEN COPY IMAGE:${NC} $SLUG"
  fi

  # ===== RUNTIME SAFETY =====

  # alert() calls (overridden centrally, but still warn for cleanup)
  has_alert=$(echo "$CONTENT" | grep -c 'alert(' 2>/dev/null || true)
  if [ "$has_alert" -gt 0 ]; then ALERT_COUNT=$((ALERT_COUNT + 1)); fi

  # AI tool without ai-engine.js
  has_chrome_ai=$(echo "$CONTENT" | grep -c 'self\.ai\|chromeAI\|Rewriter' 2>/dev/null || true)
  has_ai_engine=$(echo "$CONTENT" | grep -c 'ai-engine\.js' 2>/dev/null || true)
  if [ "$has_chrome_ai" -gt 0 ] && [ "$has_ai_engine" -eq 0 ]; then
    AI_NO_ENGINE=$((AI_NO_ENGINE + 1))
    ISSUES_RUNTIME="$ISSUES_RUNTIME
  ${RED}AI NO ENGINE:${NC} $SLUG"
  fi

  # html2canvas null bg
  has_null_bg=$(echo "$CONTENT" | grep -c 'backgroundColor: null' 2>/dev/null || true)
  is_fake=$(echo "$SLUG" | grep -c 'fake-\|tweet' 2>/dev/null || true)
  if [ "$has_null_bg" -gt 0 ] && [ "$is_fake" -eq 0 ]; then
    NULL_BG=$((NULL_BG + 1))
    ISSUES_RUNTIME="$ISSUES_RUNTIME
  ${YEL}NULL BG:${NC} $SLUG"
  fi

  # ===== UX USABILITY =====

  # Missing tool-hero section
  has_hero=$(echo "$CONTENT" | grep -c 'tool-hero' 2>/dev/null || true)
  if [ "$has_hero" -eq 0 ]; then
    NO_HERO=$((NO_HERO + 1))
    ISSUES_UX="$ISSUES_UX
  ${YEL}NO HERO:${NC} $SLUG"
  fi

  # Missing tool-description
  has_desc=$(echo "$CONTENT" | grep -c 'tool-description' 2>/dev/null || true)
  if [ "$has_desc" -eq 0 ]; then NO_DESC=$((NO_DESC + 1)); fi

  # Inputs without labels
  input_count=$(echo "$CONTENT" | grep -c '<input\|<textarea\|<select' 2>/dev/null || true)
  label_count=$(echo "$CONTENT" | grep -c '<label\|tool-label\|aria-label' 2>/dev/null || true)
  if [ "$input_count" -gt 0 ] && [ "$label_count" -eq 0 ]; then
    NO_LABELS=$((NO_LABELS + 1))
    ISSUES_UX="$ISSUES_UX
  ${YEL}NO LABELS:${NC} $SLUG ($input_count inputs, 0 labels)"
  fi

  # No mobile CSS (skip tool-engine tools — handled centrally)
  has_mobile=$(echo "$CONTENT" | grep -c 'max-width.*600\|max-width.*480\|max-width.*768' 2>/dev/null || true)
  uses_engine=$(echo "$CONTENT" | grep -c 'tool-engine\.js\|utility-engine\.js\|TOOL_CONFIG' 2>/dev/null || true)
  if [ "$has_mobile" -eq 0 ] && [ "$uses_engine" -eq 0 ]; then
    NO_MOBILE=$((NO_MOBILE + 1))
  fi

  # White text on accent
  has_white_accent=$(echo "$CONTENT" | grep -c 'color:\s*#fff.*accent\|color:\s*white.*accent\|accent.*color:\s*#fff\|accent.*color:\s*white' 2>/dev/null || true)
  if [ "$has_white_accent" -gt 0 ]; then
    WHITE_ACCENT=$((WHITE_ACCENT + 1))
    ISSUES_UX="$ISSUES_UX
  ${RED}WHITE ON ACCENT:${NC} $SLUG"
  fi

  # Async operations without loading indicator
  has_async=$(echo "$CONTENT" | grep -c 'async function\|await ' 2>/dev/null || true)
  has_loading=$(echo "$CONTENT" | grep -c 'Loading\|loading\|Generating\|Processing\|Analyzing\|\.disabled' 2>/dev/null || true)
  if [ "$has_async" -gt 0 ] && [ "$has_loading" -eq 0 ]; then
    NO_LOADING=$((NO_LOADING + 1))
  fi

done < "$TMPFILE"

# --- Print Results ---
echo "============================================"
echo "  QA + UX RESULTS"
echo "============================================"
echo ""

echo "  SEO STRUCTURE:"
printf "    No JS logic:          %s%d%s\n" "$RED" "$NO_JS" "$NC"
printf "    Low content (<150w):  %s%d%s\n" "$YEL" "$LOW_CONTENT" "$NC"
printf "    Missing FAQs:         %s%d%s\n" "$YEL" "$NO_FAQS" "$NC"
printf "    Missing related:      %s%d%s\n" "$YEL" "$NO_RELATED" "$NC"
printf "    Missing WebApp:       %s%d%s\n" "$YEL" "$NO_SCHEMA" "$NC"
printf "    Broken Copy Image:    %s%d%s\n" "$RED" "$NO_COPY_HANDLER" "$NC"
echo ""

echo "  RUNTIME SAFETY:"
printf "    alert() calls:        %s%d%s (overridden centrally)\n" "$YEL" "$ALERT_COUNT" "$NC"
printf "    AI no ai-engine.js:   %s%d%s\n" "$RED" "$AI_NO_ENGINE" "$NC"
printf "    html2canvas null bg:  %s%d%s\n" "$YEL" "$NULL_BG" "$NC"
echo ""

echo "  UX USABILITY:"
printf "    No tool-hero:         %s%d%s\n" "$YEL" "$NO_HERO" "$NC"
printf "    No tool-description:  %s%d%s\n" "$YEL" "$NO_DESC" "$NC"
printf "    Inputs no labels:     %s%d%s\n" "$YEL" "$NO_LABELS" "$NC"
printf "    No mobile CSS:        %s%d%s (excl. engine tools + central CSS)\n" "$YEL" "$NO_MOBILE" "$NC"
printf "    White on accent:      %s%d%s\n" "$RED" "$WHITE_ACCENT" "$NC"
printf "    No loading state:     %s%d%s\n" "$YEL" "$NO_LOADING" "$NC"
echo ""

TOTAL_ISSUES=$((NO_JS + LOW_CONTENT + NO_FAQS + NO_RELATED + NO_SCHEMA + NO_COPY_HANDLER + AI_NO_ENGINE + NULL_BG + NO_HERO + NO_LABELS + WHITE_ACCENT))
printf "  Total tools:  %d\n" "$TOTAL"
printf "  Key issues:   %s%d%s\n" "$RED" "$TOTAL_ISSUES" "$NC"
echo ""

# Show details for verbose or small hub
if [ "$VERBOSE" = true ]; then
  if [ -n "$ISSUES_SEO" ]; then echo "  --- SEO Issues ---"; echo "$ISSUES_SEO"; echo ""; fi
  if [ -n "$ISSUES_RUNTIME" ]; then echo "  --- Runtime Issues ---"; echo "$ISSUES_RUNTIME"; echo ""; fi
  if [ -n "$ISSUES_UX" ]; then echo "  --- UX Issues ---"; echo "$ISSUES_UX"; echo ""; fi
fi

echo "============================================"
echo "  CENTRAL PROTECTIONS IN PLACE:"
echo "    common.js: alert()→showToast, safeClipboard, safeHtml2Canvas, autoScroll, autoIds"
echo "    tools.css: mobile responsive base rules for all tools"
echo "    pre-commit: 25+ automated checks on every commit"
echo "============================================"
echo ""
echo "  Run: ./build-qa-check.sh               (all tools)"
echo "  Run: ./build-qa-check.sh --hub ai       (one hub)"
echo "  Run: ./build-qa-check.sh --verbose      (show all issues)"
echo "============================================"

rm -f "$TMPFILE"
