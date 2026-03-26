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
claude --print --dangerously-skip-permissions -m claude-opus-4-6 "$(cat <<'PROMPT'
You are the nightly build agent for tool.teamzlab.com (1680+ tools).

FIRST: Read CLAUDE.md, .claude-memory/MEMORY.md, .claude-memory/feedback_idea_generation_framework.md, .claude-memory/feedback_programmatic_seo.md, .claude-memory/feedback_multilang_strategy.md, .claude-memory/project_hub_building_queue.md, and docs/tool-backlog.md.

CONTENT RESTRICTIONS: Owner is Muslim. NEVER build alcohol, gambling, betting, casino, lottery tools.

THEN DO:
1. BUILD 5-8 new tools targeting Tier S/A countries (AU, NZ, SG, IE, CH, US, UK, DE, JP). Diverse types (generators, planners, analyzers — not just calculators). Check duplicates first. Follow ALL CLAUDE.md rules. Commit each.
2. PROGRAMMATIC SEO: If any new tool has location-varying data, write a Python generator script and run it. Zero quota.
3. MULTILANG: For finance/career/business tools, also build ES + PT versions natively. Target 2-4 each.
4. QA: Run build-static-schema.py, build-search-index.sh, build-fix-orphans.py fix. Fix issues. Commit.
5. RESEARCH: WebSearch for trending keywords in high-RPM niches. Save to docs/tool-backlog.md.
6. Push all changes: git push origin main

TARGET: 5-8 base tools + variants + 4-8 multilang + QA fixes + backlog update.
PROMPT
)" 2>&1 | tail -50

# Phase 5: Final push
echo ""
echo "=== Phase 5: Final Push ==="
git push origin main 2>&1

echo ""
echo "=== DONE — $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
