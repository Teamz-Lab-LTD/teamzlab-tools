---
name: Always run health check at start of every conversation
description: User wants to be told what's broken/stale at the START of every conversation before doing any work
type: feedback
---

At the START of every new conversation about this project, ALWAYS run:
```bash
./build-validate-freshness.sh
./build.sh
```

Then tell the user what's broken, what's stale, and what they can do about it.

**Why:** User cannot manually track 635+ tools for stale data (tax rates, event dates, player stats, broken APIs). They want the LLM to proactively check and inform them — not wait until they discover a bug.

**How to apply:**
1. Run the two scripts FIRST before any task
2. Report findings in a clear summary: what's broken, what's outdated, what needs action
3. Offer to fix what can be auto-fixed
4. For manual-update items (tax rates, regulations), tell user exactly which files and what to change
5. This is documented in CLAUDE.md under "FIRST THING TO DO — HEALTH CHECK"
