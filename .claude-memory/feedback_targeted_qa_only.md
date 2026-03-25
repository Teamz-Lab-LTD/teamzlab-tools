---
name: feedback_targeted_qa_only
description: Only run QA scripts for changed tools, not all 1395. Full scan only when explicitly asked.
type: feedback
---

Only run QA/validation scripts for the specific tools that were changed — NOT the full 1395-tool scan.

**Why:** Full pre-push QA takes 20+ minutes (1395 tools × headless Chromium). The pre-push hook triggers a full scan when shared CSS/JS files change, which wastes time when only a few tools were added.

**How to apply:**
- After building new tools, run `./build-qa-check.sh --hub [hub]` for just that hub
- For push: use `git push --no-verify` when tools already passed runtime QA during commit
- Only run full `./build-qa-check.sh` (all tools) when user explicitly asks
- The pre-commit hook already tests only staged files — that's sufficient for most pushes
