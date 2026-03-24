---
name: Always request indexing after tool changes
description: After creating new tools or updating existing ones, run build-request-indexing.py to check and submit for indexing
type: feedback
---

After creating ANY new tool or updating ANY existing tool, ALWAYS run:
```bash
python3 scripts/build-request-indexing.py --url https://tool.teamzlab.com/[hub]/[tool]/
```

If building multiple tools, run `--all` or pass each URL.

**Why:** Google has 1,361 pages but Search Console dashboard showed "0 indexed" (reporting bug). The URL Inspection API is the only reliable way to verify indexing status and trigger crawl awareness. Bing/Yandex are also submitted via IndexNow.

**How to apply:**
- Add this step AFTER `build.sh` + `build-static-schema.py` + `build-seo-audit.sh` in the post-build checklist
- For new tools: run `--url` with the specific URL
- For batch updates: run `--all`
- Check output for `---` (not indexed) pages and note the reason
