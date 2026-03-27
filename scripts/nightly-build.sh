#!/bin/bash
# =============================================================================
# Nightly Build Agent — Runs locally via launchd at 3 AM BD (9 PM UTC)
# Full access to ALL local scripts, API tokens, and tools
#
# To install: bash scripts/nightly-build.sh --install
# To uninstall: bash scripts/nightly-build.sh --uninstall
# To run now: bash scripts/nightly-build.sh
# To check status: bash scripts/nightly-build.sh --status
# =============================================================================

PROJECT_DIR="/Users/mdgolamkibriaemon/Projects/Teamz Lab Projects/teamz-projects/teamzlab-tools"
LOG_DIR="$PROJECT_DIR/logs"
PLIST_NAME="com.teamzlab.nightly-build"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

# Handle flags
if [ "$1" = "--install" ]; then
    echo "Installing nightly build agent..."
    mkdir -p "$LOG_DIR"
    mkdir -p "$HOME/Library/LaunchAgents"

    cat > "$PLIST_PATH" << 'PLIST_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.teamzlab.nightly-build</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/mdgolamkibriaemon/Projects/Teamz Lab Projects/teamz-projects/teamzlab-tools/scripts/nightly-build.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <array>
        <dict>
            <key>Hour</key>
            <integer>15</integer>
            <key>Minute</key>
            <integer>0</integer>
        </dict>
        <dict>
            <key>Hour</key>
            <integer>21</integer>
            <key>Minute</key>
            <integer>0</integer>
        </dict>
    </array>
    <key>StandardOutPath</key>
    <string>/Users/mdgolamkibriaemon/Projects/Teamz Lab Projects/teamz-projects/teamzlab-tools/logs/nightly-build.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/mdgolamkibriaemon/Projects/Teamz Lab Projects/teamz-projects/teamzlab-tools/logs/nightly-build-error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
        <key>HOME</key>
        <string>/Users/mdgolamkibriaemon</string>
    </dict>
</dict>
</plist>
PLIST_EOF

    launchctl unload "$PLIST_PATH" 2>/dev/null
    launchctl load "$PLIST_PATH"
    echo "  Installed! Runs twice daily:"
    echo "    - 9:00 PM BD (3:00 PM UTC) — during your break"
    echo "    - 3:00 AM BD (9:00 PM UTC) — while you sleep"
    echo "  Logs: $LOG_DIR/nightly-build.log"
    echo "  To run now: bash scripts/nightly-build.sh"
    echo "  To uninstall: bash scripts/nightly-build.sh --uninstall"
    exit 0
fi

if [ "$1" = "--uninstall" ]; then
    echo "Uninstalling nightly build agent..."
    launchctl unload "$PLIST_PATH" 2>/dev/null
    rm -f "$PLIST_PATH"
    echo "  Removed."
    exit 0
fi

if [ "$1" = "--status" ]; then
    if launchctl list | grep -q "$PLIST_NAME"; then
        echo "  Status: ACTIVE"
        echo "  Schedule: Daily at 3:00 AM BD (9:00 PM UTC)"
        if [ -f "$LOG_DIR/nightly-build.log" ]; then
            echo "  Last run:"
            tail -5 "$LOG_DIR/nightly-build.log"
        fi
    else
        echo "  Status: NOT INSTALLED"
        echo "  Install with: bash scripts/nightly-build.sh --install"
    fi
    exit 0
fi

# =============================================================================
# MAIN: Run the nightly build
# =============================================================================
echo "============================================================"
echo "  NIGHTLY BUILD — $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "============================================================"

cd "$PROJECT_DIR" || exit 1

# Pull latest changes first
git pull origin main 2>/dev/null

# Phase 0: Research — find high-value keywords (zero quota, bash scripts only)
echo ""
echo "=== Phase 0: Keyword Research (zero quota) ==="

# Clean previous research
rm -f /tmp/nightly-suggestions.txt /tmp/nightly-trends.txt /tmp/nightly-multilang.txt /tmp/nightly-research.txt

# Google Autocomplete suggestions for high-RPM niches
echo "  Researching keywords..."
for keyword in "stamp duty calculator" "retirement calculator" "tax calculator" "salary calculator" "mortgage calculator" "budget planner" "loan calculator" "investment calculator" "insurance calculator" "cost of living" "rent vs buy" "salary comparison" "profit margin calculator" "invoice generator" "contract template"; do
    ./build-seo-audit.sh --suggest "$keyword" 2>/dev/null | grep -v "^$" >> /tmp/nightly-suggestions.txt
done

# Pinterest-friendly keywords (finance/health/budget perform best on Pinterest)
echo "  Researching Pinterest-friendly keywords..."
for keyword in "budget template" "savings plan" "debt payoff" "meal planner" "wedding budget" "baby cost" "home buying checklist" "retirement plan"; do
    ./build-seo-audit.sh --suggest "$keyword" 2>/dev/null | grep -v "^$" >> /tmp/nightly-suggestions.txt
done

# Comparison page keywords (X vs Y = high intent)
echo "  Researching comparison keywords..."
for keyword in "roth vs traditional" "rent vs buy" "lease vs buy" "term vs whole life" "hsa vs fsa" "fixed vs variable rate" "sole trader vs company" "etf vs mutual fund"; do
    ./build-seo-audit.sh --suggest "$keyword" 2>/dev/null | grep -v "^$" >> /tmp/nightly-suggestions.txt
done

# Get trending/breakout keywords
echo "  Checking trends..."
./build-seo-audit.sh --batch-trends 2>/dev/null | head -30 >> /tmp/nightly-trends.txt

# Keyword volume estimation
echo "  Checking keyword volumes..."
./build-seo-audit.sh --bing-volume "stamp duty calculator" "retirement planner" "salary comparison" "budget calculator" "tax estimator" 2>/dev/null >> /tmp/nightly-research.txt

# Check keyword cannibalization
echo "  Checking cannibalization..."
./build-seo-audit.sh --cannibalize 2>/dev/null | head -20 >> /tmp/nightly-research.txt

# Check seasonal relevance
echo "  Checking seasonal calendar..."
MONTH=$(date '+%m')
case $MONTH in
    01|02|03|04) echo "SEASONAL: Tax season (US/UK/AU). Build tax tools." >> /tmp/nightly-research.txt ;;
    04|05|06) echo "SEASONAL: DE Steuererklärung, Nordic tax, wedding season." >> /tmp/nightly-research.txt ;;
    07|08|09) echo "SEASONAL: Back to school, SG National Day, summer travel." >> /tmp/nightly-research.txt ;;
    10|11|12) echo "SEASONAL: Black Friday, year-end finance, holiday budgets." >> /tmp/nightly-research.txt ;;
esac

# Ensure backlog file exists
BACKLOG="$PROJECT_DIR/docs/tool-backlog.md"
if [ ! -f "$BACKLOG" ]; then
    echo "# Tool Backlog" > "$BACKLOG"
    echo "## Pending" >> "$BACKLOG"
    echo "" >> "$BACKLOG"
fi

# Check which existing tools need ES/PT versions
echo "  Checking multilang gaps..."
python3 scripts/build-multilang.py suggest 2>/dev/null | grep "→" > /tmp/nightly-multilang.txt

echo "  Research done. All results saved for Claude to use."

# Phase 1: Run all maintenance scripts (no Claude needed, zero quota)
echo ""
echo "=== Phase 1: Maintenance Scripts (zero quota) ==="
python3 build-static-schema.py 2>&1 | tail -3
./build-search-index.sh 2>&1 | tail -5
python3 scripts/build-fix-orphans.py fix 2>&1 | tail -3
./build-seo-audit.sh --fix 2>&1 | tail -5

# Phase 2: Request indexing for any new pages
echo ""
echo "=== Phase 2: Request Indexing ==="
python3 scripts/build-request-indexing.py 2>&1 | tail -10

# Phase 3: Pull data (uses local API tokens — only works locally!)
echo ""
echo "=== Phase 3: Pull Data (local tokens) ==="
./build-search-console.sh --status 2>&1 | tail -10
./build-analytics.sh --all 2>&1 | tail -20
./build-adsense.sh 2>&1 | tail -10

# Phase 4: Run Claude to build tools (uses quota)
echo ""
echo "=== Phase 4: Claude Build Agent ==="
echo "  Starting Sonnet... (live output below)"
echo "  ─────────────────────────────────────"
claude --print --verbose --dangerously-skip-permissions --model sonnet "$(cat <<'PROMPT'
Print your progress as you work. After EACH step print a status line. After EACH tool print: Built [name] at /[hub]/[slug]/. After EACH commit print: Committed [message]. If something fails print: Failed [what] [why].

Now begin:
You are the nightly build agent for tool.teamzlab.com (1680+ tools).

FIRST: Read these files for context:
- CLAUDE.md (all build rules)
- .claude-memory/MEMORY.md (feedback + project context)
- .claude-memory/feedback_idea_generation_framework.md (country/language targeting)
- .claude-memory/feedback_programmatic_seo.md (variant generation)
- .claude-memory/feedback_multilang_strategy.md (ES/PT rules)
- .claude-memory/project_hub_building_queue.md (hub queue)
- docs/tool-backlog.md (pending keywords)
- /tmp/nightly-suggestions.txt (Google Autocomplete results — pre-researched)
- /tmp/nightly-trends.txt (trending keywords — pre-researched)
- /tmp/nightly-multilang.txt (tools needing ES/PT versions — pre-researched)
- /tmp/nightly-research.txt (keyword volumes, cannibalization, seasonal info)

CONTENT RESTRICTIONS: Owner is Muslim. NEVER build alcohol, gambling, betting, casino, lottery tools.

## DECISION LAYERS — Apply ALL of these when picking what to build:

1. COUNTRY RPM: Target Tier S first (AU, NZ, SG, IE, CH $190-350/capita), then Tier A (US, UK, CA, DE, JP). AVOID BD, IN, PK (RPM $0.05-0.20).
2. TOOL TYPE DIVERSITY: Build generators ($15+ RPM), planners ($10+), analyzers ($8+), checkers ($6+) — NOT just calculators ($5+). Never build fun/joke tools ($1-2).
3. HUB CLUSTER: Add tools to EXISTING thin hubs (<10 tools) to build topical authority. 10 tools in one hub ranks faster than 10 scattered tools.
4. FREE ALTERNATIVE: Check if the tool replaces a paid product. "Free alternative to X" = highest conversion intent keywords.
5. COMPARISON PAGES: Build "X vs Y" tools (rent vs buy, Roth vs traditional). These are high-intent search queries.
6. EVERGREEN FIRST: Prefer tools with year-round traffic over seasonal spikes.
7. TREND-JACK: Check /tmp/nightly-trends.txt for rising keywords. Build if breakout + high RPM.
8. VIRALITY: Prefer tools where results are screenshot-worthy and shareable.
9. PINTEREST FIT: Finance/health/budget tools perform well on Pinterest. Build pin-worthy tools.
11. AI SEARCH: Frame tool as answering a question (ChatGPT/Perplexity recommend tools that answer questions). We have llms.txt advantage.
12. FEATURED SNIPPET: Structure results to match Google's featured snippet format (tables, bullet lists).
13. E-E-A-T: All tools already have author byline + About page link. Ensure content mentions methodology/sources.

## THEN DO:
1. BUILD 5-8 new tools using the decision layers above. Check /tmp/nightly-suggestions.txt for validated keywords. Check duplicates BEFORE each (find . -path '*keyword*'). Follow ALL CLAUDE.md rules. Commit each tool immediately.
2. PROGRAMMATIC SEO: If any new tool has location-varying data, write a Python generator script and run it (zero cost). Examples: tax by state, cost by city.
3. MULTILANG: For finance/career/business tools, also build Spanish (/es/) + Portuguese (/pt/) versions natively. Not machine translation. Target 2-4 each.
4. QA: Run build-static-schema.py, build-search-index.sh, build-fix-orphans.py fix. Fix issues. Commit.
5. BACKLOG: Save any good keyword ideas you found to docs/tool-backlog.md with columns: keyword | hub | region | RPM tier | programmatic? | multilang? | source.
6. Push all changes: git push origin main

TARGET: 5-8 base tools + variants + 4-8 multilang + QA fixes + backlog update.
PROMPT
)" 2>&1
BUILD_EXIT=$?

if [ "$BUILD_EXIT" -ne 0 ]; then
    echo "  ✗ Claude build failed (exit code $BUILD_EXIT)"
    osascript -e "display notification \"Claude build FAILED (exit $BUILD_EXIT). Check logs.\" with title \"Teamz Build ERROR\" sound name \"Basso\"" 2>/dev/null
fi

# Phase 5: Final push
echo ""
echo "=== Phase 5: Final Push ==="
PUSH_OUTPUT=$(git push origin main --no-verify 2>&1)
PUSH_EXIT=$?
echo "$PUSH_OUTPUT"

if [ "$PUSH_EXIT" -ne 0 ]; then
    echo "  ✗ Push failed!"
    osascript -e "display notification \"Git push FAILED. Check logs.\" with title \"Teamz Build ERROR\" sound name \"Basso\"" 2>/dev/null
fi

# Count what was built
NEW_TOOLS=$(git log --oneline --since="2 hours ago" --grep="Add " | wc -l | tr -d ' ')
TOTAL_COMMITS=$(git log --oneline --since="2 hours ago" | wc -l | tr -d ' ')

echo ""
echo "=== DONE — $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
echo "  New tools built: $NEW_TOOLS"
echo "  Total commits: $TOTAL_COMMITS"

# Mac notification
if [ "$NEW_TOOLS" -gt 0 ]; then
    osascript -e "display notification \"Built $NEW_TOOLS new tools. $TOTAL_COMMITS commits pushed.\" with title \"Teamz Build SUCCESS\" sound name \"Glass\"" 2>/dev/null
else
    osascript -e "display notification \"No new tools built. $TOTAL_COMMITS maintenance commits.\" with title \"Teamz Build Done\" sound name \"Purr\"" 2>/dev/null
fi
