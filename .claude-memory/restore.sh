#!/bin/bash
# ============================================================
# Restore Claude Code memory on a new machine
# Run: bash .claude-memory/restore.sh
# ============================================================

# Detect the project path-based memory directory Claude Code uses
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENCODED=$(echo "$PROJECT_DIR" | sed 's|/|-|g; s|^-||')
MEMORY_DIR="$HOME/.claude/projects/$ENCODED/memory"

echo "Restoring Claude Code memory..."
echo "  From: $PROJECT_DIR/.claude-memory/"
echo "  To:   $MEMORY_DIR/"

mkdir -p "$MEMORY_DIR"
cp "$PROJECT_DIR/.claude-memory/"*.md "$MEMORY_DIR/"

COUNT=$(ls "$MEMORY_DIR/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo "  Done: $COUNT memory files restored"
echo ""
echo "  Claude Code will now have full context in this project."
