#!/bin/bash
# ============================================
# Teamz Lab Tools — Automated QA Checker
# ============================================

cd "$(dirname "$0")"

RED='\033[0;31m'
YEL='\033[1;33m'
GRN='\033[0;32m'
NC='\033[0m'

echo "============================================"
echo "  Teamz Lab Tools — QA Checker"
echo "============================================"
echo ""

TOTAL=0
ERRORS=0
WARNINGS=0
NO_FAQS=0
NO_RELATED=0
NO_SCHEMA=0
LOW_CONTENT=0
NO_JS=0

# Build tool list
TMPFILE=$(mktemp)
find . -name "index.html" -not -path "./index.html" \
  -not -path "./shared/*" -not -path "./branding/*" -not -path "./docs/*" \
  -not -path "./.git/*" -not -path "./node_modules/*" \
  -not -path "./about/*" -not -path "./contact/*" -not -path "./privacy/*" -not -path "./terms/*" \
  | grep -E "^./[^/]+/[^/]+/index.html$" \
  | sort > "$TMPFILE"

TOOL_COUNT=$(wc -l < "$TMPFILE" | tr -d ' ')
echo "Found $TOOL_COUNT tool pages to check"
echo ""

echo "[1/7] Checking for tools with no JavaScript logic..."
while IFS= read -r f; do
  TOTAL=$((TOTAL + 1))
  if ! grep -q 'addEventListener' "$f" 2>/dev/null; then
    if ! grep -q 'function ' "$f" 2>/dev/null; then
      echo -e "  ${RED}NO JS LOGIC:${NC} $f"
      NO_JS=$((NO_JS + 1))
      ERRORS=$((ERRORS + 1))
    fi
  fi
done < "$TMPFILE"
echo "  $NO_JS tools with no JS logic found"
echo ""

echo "[2/7] Checking for tools with low content (<150 words)..."
while IFS= read -r f; do
  WORDS=$(sed -n '/<section class="tool-content">/,/<\/section>/p' "$f" 2>/dev/null | sed 's/<[^>]*>//g' | wc -w | tr -d ' ')
  if [ "$WORDS" -lt 150 ] 2>/dev/null; then
    echo -e "  ${YEL}LOW CONTENT (${WORDS}w):${NC} $f"
    LOW_CONTENT=$((LOW_CONTENT + 1))
    WARNINGS=$((WARNINGS + 1))
  fi
done < "$TMPFILE"
echo "  $LOW_CONTENT tools with <150 words"
echo ""

echo "[3/7] Checking for missing FAQs..."
while IFS= read -r f; do
  if ! grep -q 'renderFAQs\|injectFAQSchema\|FAQPage' "$f" 2>/dev/null; then
    NO_FAQS=$((NO_FAQS + 1))
  fi
done < "$TMPFILE"
echo "  $NO_FAQS tools missing FAQ sections"
echo ""

echo "[4/7] Checking for missing related tools..."
while IFS= read -r f; do
  if ! grep -q 'renderRelatedTools\|related-tools' "$f" 2>/dev/null; then
    NO_RELATED=$((NO_RELATED + 1))
  fi
done < "$TMPFILE"
echo "  $NO_RELATED tools missing related tools"
echo ""

echo "[5/7] Checking for missing WebApp schema..."
while IFS= read -r f; do
  if ! grep -q 'injectWebAppSchema\|WebApplication' "$f" 2>/dev/null; then
    NO_SCHEMA=$((NO_SCHEMA + 1))
  fi
done < "$TMPFILE"
echo "  $NO_SCHEMA tools missing WebApplication schema"
echo ""

echo "[6/7] Finding smallest tools (likely stubs or low quality)..."
echo "  Bottom 30 smallest tools:"
while IFS= read -r f; do
  SIZE=$(wc -c < "$f" | tr -d ' ')
  echo "$SIZE $f"
done < "$TMPFILE" | sort -n | head -30 | while read -r size path; do
  KB=$((size / 1024))
  printf "    %4dKB  %s\n" "$KB" "$path"
done
echo ""

echo "[7/7] Finding largest tools (most complete)..."
echo "  Top 10 largest tools:"
while IFS= read -r f; do
  SIZE=$(wc -c < "$f" | tr -d ' ')
  echo "$SIZE $f"
done < "$TMPFILE" | sort -rn | head -10 | while read -r size path; do
  KB=$((size / 1024))
  printf "    %4dKB  %s\n" "$KB" "$path"
done
echo ""

echo "============================================"
echo "  QA Summary"
echo "  Total tools checked: $TOTAL"
printf "  No JS logic: %s%d%s\n" "$RED" "$NO_JS" "$NC"
printf "  Low content (<150w): %s%d%s\n" "$YEL" "$LOW_CONTENT" "$NC"
printf "  Missing FAQs: %s%d%s\n" "$YEL" "$NO_FAQS" "$NC"
printf "  Missing related tools: %s%d%s\n" "$YEL" "$NO_RELATED" "$NC"
printf "  Missing WebApp schema: %s%d%s\n" "$YEL" "$NO_SCHEMA" "$NC"
echo "============================================"

rm -f "$TMPFILE"
