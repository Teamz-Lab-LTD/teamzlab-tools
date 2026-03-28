---
name: MANDATORY SEO research pipeline before ANY content writing
description: CRITICAL — Must run full 4-step research pipeline before writing/expanding ANY page content. Never write first then validate.
type: feedback
---

NEVER write or expand page content without completing this 4-step research pipeline FIRST:

**Step 1: Google Autocomplete** — `./build-seo-audit.sh --suggest "keyword"`
**Step 2: Google Trends** — `./build-seo-audit.sh --trends "keyword1" "keyword2"`
**Step 3: Search Console per-page queries** — `./build-search-console.sh --pages` then check which queries drive impressions for that specific page
**Step 4: SEO fix dry-run** — `./build-seo-audit.sh --fix --dry-run` to see what the scripts already know is wrong

Only AFTER all 4 steps, use the data to inform content: target exact query phrases from Search Console, use autocomplete long-tails as H2 headings, pick the winning keyword from Trends.

**Why:** User caught me launching 6 content writing agents WITHOUT running any of these steps. Content was written blind, then research was done as "validation" — which is backwards. The scripts exist precisely to prevent this. Skipping them produces content that doesn't target real search queries. This happened TWICE in one conversation — first the content agents, then failing to use Search Console per-page query data even after being reminded.

**How to apply:**
- This applies to ALL content work: new tools, content expansion, meta description rewrites, FAQ additions
- NEVER launch content-writing agents before research is complete
- Present research findings to user BEFORE writing if the task is significant (8+ pages)
- Search Console query data is the MOST valuable input — it shows what Google is actually testing your page for
- If Search Console API quota is exceeded, say so and wait — don't proceed without the data
