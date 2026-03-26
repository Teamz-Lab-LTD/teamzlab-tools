---
name: Core Web Vitals fixes shipped 2026-03-26
description: CWV optimization deployed — CSS bundle, self-hosted fonts, static header, deferred analytics. Minification reverted due to broken regex minifier.
type: project
---

## CWV Fixes Deployed (2026-03-26)

**Commit:** 785c07ba — pushed to production

### What shipped (working):
1. **CSS @import bundle** — branding/css/teamz-branding.css now inlines all 6 files (no waterfall)
2. **Self-hosted Poppins fonts** — branding/fonts/*.woff2 (5 weights, 39KB total). Google Fonts `<link>` removed from all pages
3. **Poppins Fallback font** — `@font-face` with `size-adjust:112.5%` to prevent CLS on font swap
4. **Static header pre-rendered** — all 1670 pages have header HTML inline (common.js skips innerHTML if present)
5. **Analytics deferred** — Firebase+GA4+Clarity moved to `requestIdleCallback` (3s fallback)
6. **Search scripts deferred** — `defer` on search-index.js + smart-search.js on homepage
7. **content-visibility:auto** — on .tool-content and .site-footer (skip rendering below fold)
8. **min-height CLS prevention** — .site-header:56px, .tool-calculator:200px
9. **Font preload** — common.js injects `<link rel="preload">` for poppins-400 and poppins-700

### What was reverted (broken):
- **CSS/JS minification** — Python regex minifier destroyed CSS selectors (.tools-grid went from 4→1 occurrence). All HTML references reverted to non-minified files. `.min` files exist but are NOT referenced.

### New build scripts:
- `scripts/build-static-header.sh` — edit header HTML in ONE place, re-run to update all 1686 pages
- `scripts/build-minify.sh` — DO NOT USE for CSS (regex is broken). JS minification via terser is safe.

### New safeguard:
- Pre-push hook step 2b checks all CSS/JS refs in HTML point to existing files. Blocks push if any are 404.

**Why:** Improving CWV to help ranking for indexed pages (positions 60-80). FCP improved from 2.5-11.8s → 2.3s. LCP improved from 2.5-14.9s → 2.3-2.5s. CLS still ~0.85 (font swap — only fixable with proper CSS minification tool like cssnano).

**How to apply:** When doing future minification, use cssnano/clean-css (NOT regex). Always verify .min files render correctly in browser before switching references.
