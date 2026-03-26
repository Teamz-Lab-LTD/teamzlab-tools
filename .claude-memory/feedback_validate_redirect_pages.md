---
name: Validate redirect pages too
description: Redirect/stub pages still get crawled by Bing — always validate them for meta description, title, canonical, noindex, and working redirect target
type: feedback
---

NEVER skip redirect pages during SEO validation. Bing Site Scan flags missing meta descriptions on redirect stubs even if they have noindex.

**Why:** March 2026 — Bing flagged 13 redirect pages for missing meta descriptions. build-qa-check.sh was skipping them entirely. User caught it from Bing Webmaster Tools.

**How to apply:**
- build-qa-check.sh now validates redirect pages for: meta description, title, canonical, noindex, viewport, and working redirect target
- When moving tools between hubs, ALWAYS create a redirect stub with ALL SEO tags (not just meta refresh + location.replace)
- When running health checks, scan redirect pages too — don't assume noindex = safe to ignore
- Bing, Google, and other crawlers still visit and evaluate redirect pages
