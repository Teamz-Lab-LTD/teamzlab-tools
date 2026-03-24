---
name: ALWAYS run SEO validation scripts after building any tool
description: MANDATORY — run build.sh + build-seo-audit.sh + build-static-schema.py after every new tool. Never skip or do manual checks instead.
type: feedback
---

ALWAYS run the project's built-in SEO validation scripts after building ANY new tool. NEVER skip them or substitute with manual grep checks.

**Why:** User caught that I built the AI Quote Generator and declared it "SEO complete" without running the automated scripts. The scripts would have caught missing FAQPage schema, WebApplication schema, twitter tags, and other issues instantly. Manual checking missed these. The project has comprehensive validation for a reason — USE IT.

**How to apply — run this CHECKLIST after every new tool before declaring done:**

1. `./build.sh` — full 8-step validation (search index, sitemap, counts, colors, unlinked, duplicates, SEO audit, technical checks)
2. `python3 build-static-schema.py` — rebuild all JSON-LD schemas
3. `./build-seo-audit.sh --report` — full SEO keyword audit with scores
4. `./build-seo-audit.sh --fix --dry-run` — check what auto-fixes are available
5. Review pre-commit hook output CAREFULLY — fix ALL warnings, not just errors
6. Verify: FAQPage schema, WebApplication schema, BreadcrumbList schema, twitter tags, og tags — ALL must be present
7. Only THEN tell user the tool is ready

**Scripts that exist (NEVER forget these):**
- `./build.sh` — master validation
- `./build-search-index.sh` — search + counts + sitemap
- `./build-sitemap.sh` — sitemap only
- `./build-seo-audit.sh` — full SEO engine (--report, --suggest, --trends, --validate-new, --fix, --viral, etc.)
- `./build-validate-freshness.sh` — stale content check
- `python3 build-static-schema.py` — JSON-LD schema builder
- Pre-commit hook — validates 15+ checks automatically
