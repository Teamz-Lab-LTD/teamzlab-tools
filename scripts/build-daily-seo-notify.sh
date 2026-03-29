#!/bin/bash
# ============================================================
#  SEO Auto-Runner WITH Notifications
#  Runs SEO tasks + sends macOS notification + writes summary
#  for Claude health check to read.
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")")" && pwd)"
cd "$SCRIPT_DIR/.."

MODE="${1:---daily}"
DATE=$(date '+%Y-%m-%d %H:%M')
LOG_DIR="$SCRIPT_DIR/seo-logs"
REPORT_FILE="$SCRIPT_DIR/seo-latest-report.txt"
mkdir -p "$LOG_DIR"

# ── DAILY ──
if [[ "$MODE" == "--daily" ]]; then
    # Record rankings
    OUTPUT=$(python3 scripts/build-rank-tracker.py record 2>&1)
    KEYWORDS=$(echo "$OUTPUT" | grep -o '[0-9]* keywords' | head -1)

    # Check movers
    MOVERS=$(python3 scripts/build-rank-tracker.py movers 2>&1)
    WINNERS=$(echo "$MOVERS" | grep "improved" | grep -o '[0-9]*' | head -1)
    LOSERS=$(echo "$MOVERS" | grep "declined" | grep -o '[0-9]*' | head -1)
    WINNERS=${WINNERS:-0}
    LOSERS=${LOSERS:-0}

    # Write summary for Claude health check
    cat > "$REPORT_FILE" << EOF
DAILY SEO REPORT — $DATE
Mode: daily
Keywords tracked: $KEYWORDS
Rank changes: $WINNERS improved, $LOSERS declined
---
Run 'python3 scripts/build-rank-tracker.py report' for details
Run 'python3 scripts/build-rank-tracker.py movers' for biggest changes
EOF

    # macOS notification
    osascript -e "display notification \"$KEYWORDS tracked. $WINNERS up, $LOSERS down.\" with title \"SEO Daily\" subtitle \"Rank Tracker Updated\"" 2>/dev/null

    # Log
    echo "[$DATE] Daily: $KEYWORDS, $WINNERS up, $LOSERS down" >> "$LOG_DIR/daily.log"
fi

# ── WEEKLY ──
if [[ "$MODE" == "--weekly" ]]; then
    # Opportunities
    OPPS=$(python3 scripts/build-keyword-intel.py --opportunities 2>&1)
    OPP_COUNT=$(echo "$OPPS" | grep -o 'Total opportunities: [0-9]*' | grep -o '[0-9]*')

    # Backlinks scan
    BL=$(python3 scripts/build-backlinks-overview.py scan 2>&1)
    BL_COUNT=$(echo "$BL" | grep -o 'Total links found: [0-9]*' | grep -o '[0-9]*')

    # Pending directories
    DIR=$(python3 scripts/build-backlinks.py status 2>&1)
    DIR_PENDING=$(echo "$DIR" | grep -o 'Pending:.*[0-9]*' | grep -o '[0-9]*')

    # Content ideas
    python3 scripts/build-content-ideas.py --seasonal 2>&1 > /dev/null

    # Write summary
    cat > "$REPORT_FILE" << EOF
WEEKLY SEO REPORT — $DATE
Mode: weekly
Keyword opportunities: $OPP_COUNT
Backlinks found: $BL_COUNT
Directories pending: $DIR_PENDING
---
ACTION NEEDED:
  1. Run: python3 scripts/build-backlinks.py submit  (submit to 5 directories)
  2. Run: python3 scripts/build-keyword-intel.py --opportunities  (see quick wins)
  3. Run: python3 scripts/build-content-ideas.py --trending  (see what to build)
EOF

    # macOS notification
    osascript -e "display notification \"$OPP_COUNT opportunities. $DIR_PENDING directories pending. $BL_COUNT backlinks.\" with title \"SEO Weekly\" subtitle \"Action needed: submit to directories\"" 2>/dev/null

    echo "[$DATE] Weekly: $OPP_COUNT opps, $BL_COUNT backlinks, $DIR_PENDING dirs pending" >> "$LOG_DIR/weekly.log"
fi

# ── MONTHLY ──
if [[ "$MODE" == "--monthly" ]]; then
    # Full dashboard
    DASH=$(./build-seo-dashboard.sh --quick 2>&1)

    # Content gaps
    GAPS=$(python3 scripts/build-content-ideas.py --gaps 2>&1)
    GAP_COUNT=$(echo "$GAPS" | grep -o '[0-9]* content gaps' | grep -o '[0-9]*')

    # Full keyword report
    KW=$(python3 scripts/build-keyword-intel.py --top 30 2>&1)

    # Indexing check
    python3 scripts/build-request-indexing.py --check 2>&1 > /dev/null

    cat > "$REPORT_FILE" << EOF
MONTHLY SEO REPORT — $DATE
Mode: monthly
Content gaps found: $GAP_COUNT
---
ACTION NEEDED:
  1. Review: python3 scripts/build-keyword-intel.py --top 30  (keyword rankings)
  2. Review: python3 scripts/build-content-ideas.py --gaps  (what to build next)
  3. Review: ./build-seo-dashboard.sh  (full dashboard)
  4. Review: python3 scripts/build-backlinks-overview.py report  (backlink health)
EOF

    osascript -e "display notification \"Monthly audit complete. $GAP_COUNT content gaps found.\" with title \"SEO Monthly\" subtitle \"Review your dashboard\"" 2>/dev/null

    echo "[$DATE] Monthly: $GAP_COUNT gaps" >> "$LOG_DIR/monthly.log"
fi
