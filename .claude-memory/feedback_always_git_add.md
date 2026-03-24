---
name: ALWAYS git add new tool files before committing
description: CRITICAL — New tools must be git add-ed. Untracked files exist locally but are 404 on live site. Pre-commit now warns about untracked tool files.
type: feedback
---

## Rule: ALWAYS git add new tool files

When building a new tool, the file exists locally but is NOT tracked by git until you `git add` it. If you commit without adding, the file will be 404 on the live site even though it works on localhost.

**What happened:** 3 ramadan tools (zakat-calculator, eid-invitation-card-maker, eid-shopping-list) existed locally for days but were never committed. Hub pages linked to them, but they were 404 on the live site.

**Why it was missed:** The broken link checker only verified that the file EXISTS locally (`[ -f index.html ]`), not that it's TRACKED by git. Pre-commit now also checks for untracked tool files.

**How to apply:** After building ANY new tool:
1. `git add [hub]/[tool-slug]/index.html` — stage the new file
2. `git add [hub]/index.html` — stage the updated hub page
3. Commit both together
4. Pre-commit hook will now warn if any tool files are untracked

**Pre-commit now checks:** `git ls-files --others` for any untracked index.html files and warns before commit.
