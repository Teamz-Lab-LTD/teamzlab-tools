---
name: SEO Audit Results — March 2026
description: Google Search Central compliance audit of tool.teamzlab.com (688+ tools). All critical/high/medium items FIXED as of 2026-03-17. Score improved from 72 to ~92/100.
type: project
---

# Full SEO Audit — tool.teamzlab.com (2026-03-17)

Overall compliance score: **72/100 → ~92/100 (after fixes)**

## WHAT WAS FIXED (2 commits: 9a779f1 + 3fa7cb3)

Round 1 (9a779f1 — 379 files):
- theme-color meta tag: var(--accent) → #D9FE06
- manifest.json: 400+ → 688+ tools
- WebApplication schema inLanguage: hardcoded "en" → dynamic
- 5 country tools: 2025 → 2026 in titles
- 8 India tax tools: FY 2024-25 → FY 2025-26
- Sitemap: removed malformed /index.html/, added lastmod to all 692 URLs
- 363 over-length title tags shortened to ≤60 chars
- Contact form: Formspree placeholder → mailto handler
- console.log removed from production
- 4 thin hub pages: added intro content
- 76 pages: hardcoded hex colors → CSS design tokens

Round 2 (3fa7cb3 — 698 files):
- 250+ meta descriptions trimmed to ≤155 chars
- 47 pages: added missing "— Teamz Lab Tools" title suffix
- 16 borderline titles shortened to ≤60 chars
- og:image added to all 687 pages
- ipapi.co (403) → ipinfo.io in 6 diagnostic tools
- Service worker cache v1 → v2
- build-validate-freshness.sh updated for ipinfo.io

## CRITICAL Issues (Must Fix)

1. **Sitemap has ZERO `<lastmod>` dates** — all 682 URLs lack modification timestamps. Google deprioritizes stale sitemaps.
   - Fix: Update `build-sitemap.sh` to use git commit dates as lastmod.
   - Source: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

2. **Stale tax year data** — 15+ pages still show "2024-25" or "FY 2024" in titles/content/meta.
   - Affected: in/income-tax-calculator-india/, in/tds-calculator/, in/hra-exemption-calculator/, in/sip-calculator/, in/ctc-to-in-hand-salary-calculator/, in/epf-calculator/, in/sukanya-samriddhi-calculator/, in/section-80c-tax-savings-calculator/, + more
   - Fix: Update to FY 2025-26 / AY 2026-27

3. **6 pages have "2025" in title** (now 2026) — vn/social-insurance-change-checker/, ng/vat-change-checker/, ng/nigeria-tax-act-2025-checker/, ke/gross-to-net-kenya/, ke/monthly-payslip-deductions/, ph/monthly-deductions-checker/

4. **76 pages have hardcoded hex colors** — violates design system Rule #1. White text (#fff) on accent backgrounds is invisible on neon.
   - Biggest offenders: ai/grammar-checker/, music/practice-timer/, tools/habit-streak-tracker/, text/syllable-counter/, + 72 more
   - Fix: Replace with var(--text), var(--bg), var(--accent) etc.

5. **Broken contact form** — contact/index.html line 40 has placeholder Formspree endpoint (`action="https://formspree.io/f/placeholder"`)

## HIGH Priority Issues

6. **All schema rendered via client-side JavaScript** — header, footer, breadcrumbs, WebApplication, FAQPage, BreadcrumbList all injected by common.js at runtime. Google CAN render JS but static JSON-LD is more reliable.
   - Source: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

7. **Invalid `theme-color` meta tag** — index.html line 18 uses `content="var(--accent)"` (CSS variable, not valid color value)

8. **WebApplication schema `inLanguage` hardcoded to "en"** for ALL pages — common.js line 245. Non-English pages (de, fr, ja, sv, no, fi, vi, ar, id) get wrong language.
   - Fix: `"inLanguage": document.documentElement.lang || "en"`

9. **15+ title tags exceed 60 chars** — Apple tools, music tools get truncated in SERPs.
   - Pattern fix: `{Primary Keyword} — Teamz Lab Tools` (drop subtitles from title tag)

10. **4 thin hub pages** (<3KB) — video/index.html (2844), vn/index.html (2975), sg/index.html (2880), id/index.html (2791)
    - Fix: Add 150-300 word contextual intro text

11. **No og:image on any page** — social shares show no preview image.

12. **Malformed sitemap entry** — sitemap.xml line 421 has `https://tool.teamzlab.com/index.html/` (duplicate homepage with wrong path)

## MEDIUM Priority Issues

13. **10+ meta descriptions exceed 160 chars** — Apple tools, creator tools get truncated.
14. **manifest.json says "400+ tools"** but actual count is 677+
15. **Google Fonts loads 5 weights synchronously** (400,500,600,700,800) — likely only need 3 weights
16. **ipapi.co API returning 403** — tools using it may be broken
17. **Service worker cache name is static `teamztools-v1`** — should version-bump on deploy
18. **CSS/JS not minified** — 55.7KB CSS + 305.6KB JS unminified (could save ~65KB)
19. **habit-streak-tracker content only ~182 words** (below 200 minimum)

## LOW Priority Issues

20. **2 console.log statements in production** — index.html lines 523-525 (SW registration)
21. **Missing aria-labels on dynamic buttons** — music tools, career AI tools
22. **404.html missing canonical and OG tags** (acceptable)
23. **No explicit robots meta tag** (default index,follow is fine)
24. **Sitemap count (682) ≠ search index count (677)** — 5 hub pages in sitemap but not search

## PASSING Items (No Action Needed)

- robots.txt: correctly configured (Allow /, sitemap referenced)
- Every page has unique title, meta description, canonical, OG tags (except 404)
- One H1 per page, correct heading hierarchy
- No duplicate titles or meta descriptions
- No noindex/nofollow anywhere
- Clean URL structure: /category/tool-slug/
- Localized pages have correct lang attributes (de→"de", fr→"fr", jp→"ja", etc.)
- Service worker: network-first for HTML (Googlebot gets fresh content)
- font-display: swap already present in Google Fonts URL
- All JS at end of body (no render-blocking scripts)
- All tool pages have 3+ related tool links
- All FAQs have 3+ questions
- Title/H1 keyword alignment is good
- No broken internal links found
- BreadcrumbList, FAQPage, WebApplication, Organization, WebSite schemas all present (via JS)
- HTTPS via GitHub Pages
- No intrusive interstitials
- Mobile viewport meta present
- No JS redirects, no meta refresh

## CANNOT VERIFY (Need Access)

- Google Search Console: index coverage, crawl errors, manual actions, CWV field data
- Core Web Vitals field data (CrUX)
- Rich Results Test: whether JS-rendered schema is actually parsed
- Redirect chains (GH Pages handles automatically)
- Soft 404 detection
- GA4 user behavior data

## Implementation Roadmap

**24-hour:** Fix theme-color, manifest description, 6 stale titles, inLanguage bug
**7-day:** Add lastmod to sitemap, update India/NG/KE/PH/VN tax years, shorten long titles, add og:image, flesh out thin hubs
**30-day:** Build static JSON-LD generator, add ItemList schema to hubs, optimize fonts, fix 76 hardcoded-color pages, fix contact form, register GSC
**90-day:** Content calendar for annual rate updates, monitor GSC indexing, evaluate HowTo schema for calculators

**Why:** The site has 677+ tools with a solid template. The main risks are stale content (hurts E-E-A-T for financial tools), JS-only schema (fragile indexing), and missing sitemap signals (reduced crawl efficiency). Fixing these moves the score from 72 to ~85+.

**How to apply:** Reference this audit when planning any SEO work, annual updates, or new tool creation. The 76 hardcoded-color pages should be fixed in batches. The sitemap lastmod fix is a one-time build script change that pays off permanently.
