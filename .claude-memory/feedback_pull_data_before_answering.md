---
name: Pull live data before answering status/trend questions
description: When user asks about trends, status, performance, or "how's the site doing" — pull Search Console + Analytics + SEO data first
type: feedback
---

When user asks about site performance, trends, status, rankings, traffic, or anything data-related, ALWAYS pull live data first before answering:

1. `./build-search-console.sh` — Google Search Console (queries, clicks, impressions, indexing)
2. `./build-analytics.sh --all` — GA4 Analytics (users, pages, sources, devices, ad events)
3. `./build-seo-audit.sh --report` — SEO audit scores (if relevant)

**Why:** User wants data-driven answers, not guesses. The scripts are fast and give real-time data.

**How to apply:** Run these in parallel at the start, then analyze and present findings with actionable recommendations. Never answer "how's the site" or "what's trending" without pulling fresh data first.
