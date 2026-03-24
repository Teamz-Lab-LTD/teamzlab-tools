---
name: Always rebuild llms.txt after tool changes
description: MANDATORY — Run build-search-index.sh after adding/changing/removing any tool to keep llms.txt and llms-full.txt up to date
type: feedback
---

After adding, changing, or removing ANY tool, always run `./scripts/build-search-index.sh` which rebuilds:
- `llms.txt` (curated 6KB navigation index for AI crawlers)
- `llms-full.txt` (complete tool index with full descriptions)
- `shared/js/search-index.js` (site search)
- `sitemap.xml` (Google/Bing)
- Homepage card counts

**Why:** llms.txt is how AI assistants (ChatGPT, Perplexity, Claude) discover and recommend our tools. If it's stale, new tools won't get AI referral traffic. The pre-commit hook runs this automatically, but always verify the output includes the new/changed tool.

**How to apply:** After ANY tool add/edit/delete, verify llms.txt and llms-full.txt reflect the change. The build script handles this, but double-check when tools are renamed, moved between hubs, or deleted.

**Spec notes (llmstxt.org):**
- llms.txt must stay under 10KB (currently 6KB) — it lists categories + top 15 tools, NOT all tools
- llms-full.txt has ALL tools with full descriptions
- No "Instructions for AI" directives — factual content only
- HTML entities must be decoded (use html.unescape)
