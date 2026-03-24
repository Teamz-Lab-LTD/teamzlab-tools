---
name: Always test on local server before committing
description: User wants all UI changes tested locally at localhost:8080 before git commit
type: feedback
---

After any UI/HTML/CSS/JS change, ALWAYS start/verify local server and tell user to check.

**Why:** User was frustrated that broken UI (wrong colors, padding, errors) was pushed to production without being caught. Testing locally first would have caught these issues.

**How to apply:**
- Run `python3 -m http.server 8080` from project root (if not already running)
- After making changes, tell user: "Check localhost:8080/[tool-path]/ to verify"
- Only commit after user confirms it looks right, or after verifying yourself
- This is documented in CLAUDE.md under "LOCAL DEV SERVER" section
