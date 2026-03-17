#!/bin/bash
# ─── SEO Keyword Audit — Teamz Lab Tools ───────────────────────────
# Wrapper script for the SEO keyword engine.
# Runs as part of build.sh or standalone.
#
# Usage:
#   ./build-seo-audit.sh                          # Quick audit (issues only)
#   ./build-seo-audit.sh --verbose                # Verbose audit (all tools)
#   ./build-seo-audit.sh --report                 # Full detailed report
#   ./build-seo-audit.sh --suggest "keyword"      # Get keyword suggestions
#   ./build-seo-audit.sh --trends "keyword"       # Google Trends analysis
#   ./build-seo-audit.sh --trends "kw1" "kw2"    # Compare two keywords
#   ./build-seo-audit.sh --trends "kw" --geo GB  # Regional trends
#   ./build-seo-audit.sh --validate-new "keyword" # Validate before building new tool
#   ./build-seo-audit.sh --internal-links         # Check internal linking
#   ./build-seo-audit.sh --batch-trends           # Trends for all hubs
#   ./build-seo-audit.sh --freshness              # Content freshness check
#   ./build-seo-audit.sh --viral                  # Virality & share readiness
#   ./build-seo-audit.sh --cannibalize            # Find keyword cannibalization
#   ./build-seo-audit.sh --fix-dry-run            # Preview auto-fixes
# ────────────────────────────────────────────────────────────────────

BASE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$BASE/seo-keyword-engine.py"

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
    --verbose|-v)
        python3 "$SCRIPT" audit --verbose
        ;;
    audit|*)
        python3 "$SCRIPT" audit
        ;;
esac
