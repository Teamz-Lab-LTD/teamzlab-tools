#!/bin/bash
# ─── SEO & ASO Keyword Engine — Teamz Lab Tools ───────────────────
# Wrapper script for the SEO + ASO keyword engine.
# Works for websites AND mobile apps (App Store + Play Store).
#
# SEO (Web):
#   ./build-seo-audit.sh                          # Quick audit
#   ./build-seo-audit.sh --verbose                # Verbose audit
#   ./build-seo-audit.sh --report                 # Full report
#   ./build-seo-audit.sh --suggest "keyword"      # Web keyword suggestions
#   ./build-seo-audit.sh --trends "keyword"       # Google Trends
#   ./build-seo-audit.sh --trends "kw1" "kw2"    # Compare keywords
#   ./build-seo-audit.sh --validate-new "keyword" # Validate new tool
#   ./build-seo-audit.sh --internal-links         # Internal linking check
#   ./build-seo-audit.sh --batch-trends           # Trends all hubs
#   ./build-seo-audit.sh --freshness              # Content freshness
#   ./build-seo-audit.sh --viral                  # Virality check
#   ./build-seo-audit.sh --cannibalize            # Keyword conflicts
#   ./build-seo-audit.sh --fix-dry-run            # Preview fixes
#
# ASO (Mobile Apps):
#   ./build-seo-audit.sh --aso-suggest "keyword"                     # App Store + Play suggestions
#   ./build-seo-audit.sh --aso-suggest "keyword" --store apple       # Apple only
#   ./build-seo-audit.sh --aso-suggest "keyword" --country bd        # Bangladesh market
#   ./build-seo-audit.sh --aso-audit --title "App" --subtitle "Tag"  # Audit app metadata
#   ./build-seo-audit.sh --aso-validate "habit tracker"              # Validate app idea
#   ./build-seo-audit.sh --aso-compare "Name A" "Name B"            # Compare app names
# ────────────────────────────────────────────────────────────────────

SCRIPTS="$(cd "$(dirname "$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")")" && pwd)"
BASE="$(dirname "$SCRIPTS")"
SCRIPT="$SCRIPTS/seo-keyword-engine.py"

if [ ! -f "$SCRIPT" ]; then
    echo "ERROR: seo-keyword-engine.py not found at $SCRIPT"
    exit 1
fi

if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 is required"
    exit 1
fi

case "${1:-audit}" in
    --report)
        python3 "$SCRIPT" report
        ;;
    --suggest)
        shift
        python3 "$SCRIPT" suggest "$@"
        ;;
    --trends)
        shift
        python3 "$SCRIPT" trends "$@"
        ;;
    --validate-new)
        shift
        python3 "$SCRIPT" validate-new "$@"
        ;;
    --internal-links)
        python3 "$SCRIPT" internal-links
        ;;
    --batch-trends)
        python3 "$SCRIPT" batch-trends
        ;;
    --freshness)
        python3 "$SCRIPT" freshness
        ;;
    --viral)
        python3 "$SCRIPT" viral
        ;;
    --cannibalize)
        python3 "$SCRIPT" cannibalize
        ;;
    --fix-dry-run)
        python3 "$SCRIPT" fix --dry-run
        ;;
    --fix)
        python3 "$SCRIPT" fix
        ;;
    --ph-search)
        shift
        python3 "$SCRIPT" ph-search "$@"
        ;;
    --ph-trending)
        python3 "$SCRIPT" ph-trending
        ;;
    --aso-suggest)
        shift
        python3 "$SCRIPT" aso-suggest "$@"
        ;;
    --aso-audit)
        shift
        python3 "$SCRIPT" aso-audit "$@"
        ;;
    --aso-validate)
        shift
        python3 "$SCRIPT" aso-validate "$@"
        ;;
    --aso-compare)
        shift
        python3 "$SCRIPT" aso-compare "$@"
        ;;
    --volume)
        shift
        python3 "$SCRIPTS/build-keyword-volume.py" "$@"
        ;;
    --volume-bulk)
        python3 "$SCRIPTS/build-keyword-volume.py" --bulk
        ;;
    --verbose|-v)
        python3 "$SCRIPT" audit --verbose
        ;;
    audit|*)
        python3 "$SCRIPT" audit
        ;;
esac
