---
name: Google Ads API Basic Access — Pending Approval
description: Applied for Google Ads API Basic Access on 2026-03-20. Once approved, enable Keyword Planner volume lookups via build-keyword-volume.py.
type: project
---

Applied for Google Ads API Basic Access on 2026-03-20.

**Why:** Need Keyword Planner (GenerateKeywordIdeas) for search volume data. Test Account level does NOT support Keyword Planner — Basic Access required.

**How to apply:**
- MCC Account: 573-862-2794
- Developer Token: stored in ~/.config/teamzlab/google-ads-config.json
- OAuth credentials: ~/.config/teamzlab/google-ads-credentials.json
- Auth script: scripts/build-keyword-planner-auth.py
- Volume script: scripts/build-keyword-volume.py (ready to use once approved)
- Design doc submitted: ~/Downloads/Google-Ads-API-Tool-Design-Document.rtf

**Status:** Pending (typically 3 business days review)

**When approved:**
1. Re-run `python3 scripts/build-keyword-planner-auth.py` to complete OAuth
2. Test with `./build-seo-audit.sh --volume "bac calculator"`
3. If auth fails, publish OAuth app to production in Google Cloud Console
