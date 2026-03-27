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
./build-clarity.sh 1 2>&1 | tail -20

# Phase 4: Run Claude to build tools (uses quota)
echo ""
echo "=== Phase 4: Claude Build Agent ==="
echo "  Starting Sonnet... (live output below)"
echo "  ─────────────────────────────────────"
PROMPT_FILE="$PROJECT_DIR/scripts/nightly-build-prompt.md"
BUILD_MODEL="${MODEL:-sonnet}"
echo "  Model: $BUILD_MODEL"
claude --print --verbose --dangerously-skip-permissions --model "$BUILD_MODEL" -p "$(cat "$PROMPT_FILE")" 2>&1
BUILD_EXIT=$?

if [ "$BUILD_EXIT" -ne 0 ]; then
    echo "  ✗ Claude build failed (exit code $BUILD_EXIT)"
    osascript -e "display notification \"Claude build FAILED (exit $BUILD_EXIT). Check logs.\" with title \"Teamz Build ERROR\" sound name \"Basso\"" 2>/dev/null
fi

# Phase 5: Final push
echo ""
echo "=== Phase 5: Auto-Fix + Push ==="
echo "  Running auto-fix on all changed files..."

# Get list of changed HTML files
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null | grep '\.html$')
if [ -z "$CHANGED_FILES" ]; then
    CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null | grep '\.html$')
fi

FIXES=0
for f in $CHANGED_FILES; do
    [ ! -f "$f" ] && continue

    # 1. Fix duplicate theme.js loads
    count=$(grep -c 'src="/branding/js/theme.js"' "$f" 2>/dev/null)
    if [ "$count" -gt 1 ]; then
        python3 -c "
import re
with open('$f','r') as fh: c=fh.read()
c=re.sub(r'<body>\s*<script src=\"/branding/js/theme\.js\"></script>', '<body>', c, count=1)
with open('$f','w') as fh: fh.write(c)
"
        echo "    Fixed: duplicate theme.js in $f"
        FIXES=$((FIXES + 1))
    fi

    # 2. Fix hardcoded header (should be empty for common.js to render)
    if grep -q '<header id="site-header" class="site-header"></header>', '<header id=\"site-header\" class=\"site-header\"></header>', c, flags=re.DOTALL)
with open('$f','w') as fh: fh.write(c)
"
        echo "    Fixed: hardcoded header in $f"
        FIXES=$((FIXES + 1))
    fi

    # 3. Fix hardcoded footer (should be empty for common.js to render)
    if grep -q '<footer id="site-footer" class="site-footer"><div' "$f" 2>/dev/null; then
        python3 -c "
import re
with open('$f','r') as fh: c=fh.read()
c=re.sub(r'<footer id=\"site-footer\" class=\"site-footer\">.*?</footer>', '<footer id=\"site-footer\" class=\"site-footer\"></footer>', c, flags=re.DOTALL)
with open('$f','w') as fh: fh.write(c)
"
        echo "    Fixed: hardcoded footer in $f"
        FIXES=$((FIXES + 1))
    fi

    # 4. Fix alert() → showToast()
    if grep -q 'alert(' "$f" 2>/dev/null; then
        sed -i '' "s/alert(/window.showToast(/g" "$f"
        echo "    Fixed: alert() → showToast() in $f"
        FIXES=$((FIXES + 1))
    fi

    # 5. Fix style.display = '' → showEl()
    if grep -q "style\.display = ''" "$f" 2>/dev/null; then
        echo "    Warning: style.display='' found in $f (needs manual fix)"
    fi

    # 6. Fix hardcoded hex colors (common ones Sonnet uses)
    if grep -qE '#[0-9a-fA-F]{3,6}' "$f" 2>/dev/null; then
        python3 -c "
import re
with open('$f','r') as fh: c=fh.read()
# Only fix colors in style blocks, not in meta/schema
replacements = {
    '#ffffff': 'var(--bg)', '#fff': 'var(--bg)',
    '#000000': 'var(--text)', '#000': 'var(--text)',
    '#333': 'var(--text)', '#333333': 'var(--text)',
    '#666': 'var(--text-muted)', '#666666': 'var(--text-muted)',
    '#999': 'var(--text-muted)', '#999999': 'var(--text-muted)',
    '#f5f5f5': 'var(--surface)', '#f0f0f0': 'var(--surface)',
    '#e0e0e0': 'var(--border)', '#ddd': 'var(--border)', '#ccc': 'var(--border)',
    '#27ae60': 'var(--heading)', '#2ecc71': 'var(--heading)',
    '#e74c3c': 'var(--heading)', '#e63946': 'var(--heading)',
    '#3498db': 'var(--heading)', '#2196f3': 'var(--heading)',
}
changed = False
for old, new in replacements.items():
    if old.lower() in c.lower():
        c = re.sub(re.escape(old), new, c, flags=re.IGNORECASE)
        changed = True
if changed:
    with open('$f','w') as fh: fh.write(c)
    print('    Fixed: hardcoded colors in $f')
" 2>/dev/null
        FIXES=$((FIXES + 1))
    fi

    # 7. Fix missing responsive CSS (add basic if @media not found)
    if ! grep -q '@media' "$f" 2>/dev/null; then
        if grep -q 'tool-calculator' "$f" 2>/dev/null; then
            echo "    Warning: no @media responsive CSS in $f"
        fi
    fi

    # 8. Fix missing ad-slot
    if ! grep -q 'ad-slot' "$f" 2>/dev/null; then
        if grep -q 'tool-content' "$f" 2>/dev/null; then
            python3 -c "
with open('$f','r') as fh: c=fh.read()
if '<div class=\"ad-slot\">' not in c and '<section class=\"tool-content\">' in c:
    c=c.replace('<section class=\"tool-content\">', '<div class=\"ad-slot\">Ad Space</div>\n    <section class=\"tool-content\">')
    with open('$f','w') as fh: fh.write(c)
    print('    Fixed: added missing ad-slot in $f')
" 2>/dev/null
            FIXES=$((FIXES + 1))
        fi
    fi

done

echo "  Auto-fixed $FIXES issues."

# Run SEO auto-fixes
echo "  Running SEO auto-fixes..."
./build-seo-audit.sh --fix 2>/dev/null | tail -3

# Rebuild schemas and search index after fixes
python3 build-static-schema.py 2>/dev/null | tail -2
./build-search-index.sh 2>/dev/null | tail -3
python3 scripts/build-fix-orphans.py fix 2>/dev/null | tail -2

# Stage and commit all fixes
git add -A 2>/dev/null
if ! git diff --cached --quiet 2>/dev/null; then
    git commit -m "Auto-fix: Sonnet cleanup ($FIXES issues fixed)" --no-verify 2>/dev/null
    echo "  Committed auto-fixes."
fi

# Push with --no-verify
PUSH_OUTPUT=$(git push origin main --no-verify 2>&1)
PUSH_EXIT=$?
echo "$PUSH_OUTPUT"

if [ "$PUSH_EXIT" -ne 0 ]; then
    echo "  ✗ Push failed! Trying pull rebase + push..."
    git pull --rebase origin main 2>/dev/null
    git push origin main --no-verify 2>&1
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
