---
name: Search Console API access
description: How to pull Google Search Console data for tool.teamzlab.com — run build-search-console.sh for indexing status, queries, pages, countries
type: reference
---

Google Search Console API is set up for tool.teamzlab.com:
- Auth: OAuth token at ~/.config/teamzlab/search-console-token.json
- Account: teamz.lab.contact@gmail.com
- Script: ./build-search-console.sh (--all, --status, --queries, --pages)
- Setup docs: docs/search-console-setup.md
- If token expires: run python3 build-search-console-auth.py

When user asks "what's my status" or "how's the site doing" or "search data":
1. Run ./build-search-console.sh to pull latest data
2. Analyze: which tools get traffic, which keywords rank, what's not indexed
3. Make recommendations: which tools to improve, what keywords to target next
