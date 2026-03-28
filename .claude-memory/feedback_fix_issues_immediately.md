---
name: Fix issues immediately — never just report
description: When health check or build scripts reveal broken links, orphans, or unlinked tools, FIX them in the same session. Don't just report numbers.
type: feedback
---

NEVER just report script numbers — always ACT on them immediately.

**Why:** In March 2026, internal link health score was 15/100 for weeks because I kept running `build-internal-links.sh`, reporting "15/100 CRITICAL", and moving on to build new tools instead. User rightfully called this out. The 20 broken slugs, 61 unlinked hub tools, and 15 orphans could have been fixed in 10 minutes each session.

**How to apply:**
- When `build-internal-links.sh` shows broken slugs → fix them NOW
- When it shows hub-unlinked tools → add them to hub pages NOW
- When it shows orphans → run `build-fix-orphans.py fix` NOW
- When `build-seo-audit.sh` shows content issues → at minimum fix the ones on pages that already get Google impressions
- Don't trust aggregate numbers from scripts blindly — verify the script logic if numbers seem inflated (the 383 "cannibalization" issues were 95% false positives from naive bigram matching)
- Pre-commit hook now checks hub-link for new tools
- build.sh now auto-fixes orphans and warns about hub-unlinked tools
