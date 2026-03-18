# CLAUDE.md — Rules for AI Assistants Working on Teamz Lab Tools

## Project Overview
- Static site: 900+ browser-based tools at tool.teamzlab.com
- Hosted on GitHub Pages, no backend
- Design system uses CSS custom properties (tokens) — NEVER hardcode colors
- Privacy-first: everything runs client-side

## FIRST THING TO DO — HEALTH CHECK (run at start of EVERY conversation)

**At the START of every new conversation, BEFORE doing any work, run this:**

```bash
cd "/Users/mdgolamkibriaemon/Projects/Teamz Lab Projects/teamz-projects/teamzlab-tools"
./build-validate-freshness.sh
./build.sh
```

**Then tell the user what's broken/stale and what they should do.**

Example output to user:
> "I ran a health check on your project. Here's what I found:
> - 3 UK tax tools have 2025 rates — new 2026 rates should be updated (April update)
> - 2 tools are not linked from any hub page
> - UCL player stats last updated 6 months ago
> - All APIs are working fine
> - Search index and sitemap are up to date
>
> Want me to fix any of these?"

**This is MANDATORY.** The user wants to be informed about what's broken or stale every time they start a conversation. Do not skip this.

## AUTOMATED SAFEGUARDS (already in place)

1. **Pre-commit hook** (`.git/hooks/pre-commit`) — runs automatically before every commit:
   - Rebuilds `search-index.js` with ALL tool titles + descriptions
   - Rebuilds `sitemap.xml` with ALL tool URLs
   - Updates homepage card counts to match actual tool counts
   - Updates search placeholder ("Search N+ tools...")
   - Updates cache-buster version on search-index.js
   - Warns about hardcoded colors on accent backgrounds
   - **Warns if title >60 chars** (will show in pre-commit output)
   - **Warns if meta description >155 chars** (decoded length)
   - **Warns if og:image is missing**
   - **Warns if FAQs are missing** (renderFAQs + injectFAQSchema)
   - **Warns if WebApp schema is missing** (injectWebAppSchema)
   - **Warns if related tools are missing** (renderRelatedTools)
   - **Warns if content <150 words** (need 300+ for AdSense RPM)
   - **Warns if <2 H2 tags in content** (need 2+ for mid-content ads)
   - **Warns if no JS logic** (addEventListener/functions)
   - **Warns if central CSS classes redefined** (share-btn, tool-result, etc.)
   - Rebuilds static JSON-LD schema in all pages (`build-static-schema.py`)

2. **Build scripts** — run manually or via hook:
   - `./build-search-index.sh` — rebuilds search + counts + sitemap
   - `./build-sitemap.sh` — rebuilds sitemap only
   - `./build.sh` — full validation (search + sitemap + counts + lint + unlinked check)
   - `./build-validate-freshness.sh` — checks for stale/outdated data (run annually or when rates change)

3. **You do NOT need to manually update**: search index, sitemap, homepage card counts, search placeholder, llms.txt, or twitter tags. The pre-commit hook does it all automatically.

4. **You DO need to manually update**: hub index pages when adding new tools to a category (e.g., add new tool link to `/ai/index.html` or `/tools/index.html`).

5. **BEFORE building ANY new tool**, follow the **Research-First Workflow**:

   **a) Trend research (MANDATORY):**
   - Search **Google Trends** for rising/breakout keywords in the tool's category
   - Check **Reddit** trending topics (r/InternetIsBeautiful, r/personalfinance, r/webdev, r/technology, niche subs)
   - Check **news cycle** for new laws, regulations, viral events, product launches
   - Check **seasonal calendar** in `/docs/research/022-growth-playbook.md`
   - Present findings to user BEFORE writing any code

   **b) Validate the keyword:**
   - Does it have search volume? (Google Trends rising = good)
   - Can we build it client-side? (Must be yes)
   - Is there a monetizable audience? (Finance > jokes)

   **c) Check for duplicates:**
   ```bash
   find . -path "*/<proposed-slug>/index.html" 2>/dev/null
   grep -ri "<proposed tool name>" --include="*.html" -l | head -5
   ```
   If a similar tool exists, ENHANCE it instead of creating a duplicate.
   Known duplicates to be aware of:
   - sleep-calculator exists in `/health/` AND `/evergreen/`
   - YouTube thumbnail tools exist in `/tools/`, `/video/`, `/design/`
   - Resume/ATS tools exist in `/career/resume-ats-scorer/` AND `/career/ats-resume-checker/`

   **Full playbook:** See `/docs/research/022-growth-playbook.md` for monetization strategy, seasonal calendar, virality checklist, and revenue targets.

## LOCAL DEV SERVER

**ALWAYS test locally before committing.** After any UI/HTML/CSS/JS change:

```bash
# Start local server (if not already running):
cd "/Users/mdgolamkibriaemon/Projects/Teamz Lab Projects/teamz-projects/teamzlab-tools"
python3 -m http.server 9090

# Then open in browser:
# http://localhost:9090
```

- **ALWAYS use port 9090** — other ports (8080, 8081, 4000) have cached PWAs from other projects
- The server serves from the project root — all paths work like production
- Test the specific tool page you changed at `http://localhost:9090/[hub]/[tool]/`
- Check: does it render correctly? Are colors using design tokens? Is the result visible without buried padding?
- NEVER use port 8080 (Hazira Khata PWA cached there)

**RULE: After making UI changes, ALWAYS tell the user to check `localhost:8080/[path]` before committing.**

## CRITICAL RULES — READ BEFORE EVERY TASK

### Rule 1: NEVER use hardcoded colors
- ALWAYS use `var(--accent)`, `var(--text)`, `var(--surface)`, `var(--border)`, `var(--bg)`, `var(--heading)`, `var(--text-muted)`
- NEVER use `#fff`, `#000`, `#fef3cd`, `#27ae60`, `#e74c3c`, `#6c63ff`, `#a855f7`, or ANY hex color
- The accent color is NEON/BRIGHT (#D9FE06) — it's the SAME in both dark and light mode
- Text on accent backgrounds MUST be `color: var(--accent-text)` (always #12151A dark) — NEVER `var(--bg)`, `#fff`, or `white`
- Icons/SVGs on accent backgrounds MUST use dark stroke/fill (`var(--accent-text)` or `#000`)
- `var(--bg)` is NOT safe on accent — in light mode `--bg` is light gray, invisible on neon
- NEVER use `color: #fff` with `background: var(--accent)` — invisible in BOTH modes
- Always test in BOTH dark AND light mode before committing
- Check: `grep -r '#[0-9a-fA-F]\{3,6\}' --include="*.html" [new-file]` — should return ZERO matches

### Rule 2: ALWAYS update hub pages and homepage after adding tools
After adding ANY new tool:
1. Add it to the correct hub page (e.g., `/ai/index.html`, `/tools/index.html`, `/dev/index.html`)
2. Update the tool count on the homepage card for that category
3. Run `./build-search-index.sh` to rebuild search
4. Run `./build-sitemap.sh` to rebuild sitemap
5. VERIFY the tool is findable via homepage search

### Rule 3: NEVER nest card-in-card layouts
- `.tool-result` has NO background, NO border, NO padding — just `border-top` separator
- `.tool-output` has NO background, NO border — transparent wrapper
- `.tool-result-card` inside `.tool-output--preview` is stripped to `padding: 0`
- Result content should flow directly inside `.tool-calculator` — ONE container only
- NEVER add `background: var(--surface); border: 1px solid var(--border); border-radius; padding` to result divs inside the calculator section

### Rule 4: ALWAYS make new tools searchable
- After adding tools, run `./build-search-index.sh`
- Verify by searching for the new tool name on the homepage
- The search index file is `/shared/js/search-index.js`

### Rule 5: ALWAYS update sitemap
- After adding tools, run `./build-sitemap.sh`
- Verify the new URL appears in `sitemap.xml`

### Rule 6: NEVER use max-height on result sections
- Results should display fully — no `max-height: 500px` or `overflow: hidden`
- Users need to see ALL their results without scrolling inside a tiny box

### Rule 7: Follow the existing page template
Every tool page MUST have:
- `<html lang="XX">` — use correct language code (en, de, fr, ja, ar, etc.)
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- `<title>` with exact-match keyword + "— Teamz Lab Tools" (max 60 chars)
- `<meta name="description">` starts with action verb + benefit + "free" + "private" (120-155 chars)
- `<link rel="canonical">` with full URL
- OG tags: og:title, og:description, og:url, og:type, og:site_name, og:image (hub-level from /og-images/)
- `<meta property="og:image" content="https://tool.teamzlab.com/og-images/HUB.png">`
- For non-English hubs (de/fr/jp/ae/eg/sa/id/vn/no/fi/se/nl/ma): add hreflang tags:
  - `<link rel="alternate" hreflang="LANG" href="CANONICAL_URL">`
  - `<link rel="alternate" hreflang="x-default" href="CANONICAL_URL">`
- Breadcrumbs with schema
- H1 with exact keyword (keyword must also appear in title, intro, and at least one H2)
- Tool UI above the fold
- Ad slot: `<div class="ad-slot">Ad Space</div>`
- Tool content section (300-600 words, keyword density 1-2%)
- 3-7 FAQs with schema
- 6+ related tools with internal links
- WebApplication schema
- Scripts: `theme.js`, `common.js`, then tool-specific JS
- **The pre-commit hook validates ALL of the above — fix warnings before committing**

### Rule 8: Chrome AI tools MUST have fallbacks
- Chrome AI (Summarizer, Writer, Rewriter, Prompt, Proofreader) only works in Chrome 138+
- EVERY Chrome AI tool MUST have a rule-based fallback for other browsers
- Show "AI-Powered" badge but also show "Smart Analysis Mode" for non-Chrome
- ai-notice (Chrome AI available) and ai-fallback (all other browsers) divs required
- NEVER make a tool that only works in one browser

### Rule 9: Transformers.js tools pattern
- Import: `import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3'`
- Set: `env.allowLocalModels = false`
- Show model download progress
- Show "AI Ready — Works offline now" when model loaded
- These work in ALL browsers — that's the USP

## File Structure
```
/shared/css/tools.css          — main tool page styles
/shared/css/utility-tools.css  — utility engine output styles
/shared/js/common.js           — header, footer, schema, breadcrumbs
/shared/js/tool-engine.js      — calculator-type tools
/shared/js/utility-engine.js   — text/dev/generator tools
/shared/js/ai-engine.js        — central AI manager (Chrome AI + Transformers.js + caching)
/shared/js/search-index.js     — search data (auto-generated)
/branding/css/teamz-branding.css — design tokens, brand styles
/branding/js/theme.js          — dark/light theme toggle
/sitemap.xml                   — auto-generated
/llms.txt                      — AI search index, concise (auto-generated, per llmstxt.org spec)
/llms-full.txt                 — AI search index, full descriptions (auto-generated)
/robots.txt                    — allows all crawlers, references sitemap + llms.txt + llms-full.txt
/manifest.json                 — PWA manifest
/sw.js                         — service worker
```

## Build Scripts
```bash
./build-search-index.sh   # Rebuild search after adding/changing tools
./build-sitemap.sh        # Rebuild sitemap (also pings Google/Bing)
./build.sh                # Full build + 8-step validation
./build-og-images.py      # Regenerate hub OG images (run after adding new hub)
```

## SEO & ASO Keyword Engine
```bash
# SEO (Web tools)
./build-seo-audit.sh                          # Quick keyword audit (826 tools)
./build-seo-audit.sh --report                 # Full report with hub scores
./build-seo-audit.sh --suggest "keyword"      # Google Autocomplete suggestions
./build-seo-audit.sh --trends "keyword"       # Google Trends analysis
./build-seo-audit.sh --trends "kw1" "kw2"    # Compare keywords (pick winner)
./build-seo-audit.sh --validate-new "keyword" # GO/CAUTION/STOP before building
./build-seo-audit.sh --internal-links         # Check cross-linking opportunities
./build-seo-audit.sh --freshness              # Find stale/outdated content
./build-seo-audit.sh --viral                  # Virality & share readiness score
./build-seo-audit.sh --cannibalize            # Find keyword conflicts
./build-seo-audit.sh --fix --dry-run          # Preview auto-fixes
./build-seo-audit.sh --fix                    # Apply auto-fixes

# ASO (Mobile apps — works for ANY app, not tied to this project)
./build-seo-audit.sh --aso-suggest "keyword"                     # App Store + Play Store suggestions
./build-seo-audit.sh --aso-audit --title "App" --subtitle "Tag"  # Audit app metadata
./build-seo-audit.sh --aso-validate "app idea"                   # Validate before building
./build-seo-audit.sh --aso-compare "Name A" "Name B"            # Compare app names
```

## Automated Safeguards (prevents ALL common mistakes)
The pre-commit hook now validates **22 checks** on every staged tool page:
1. H1 tag exists
2. Meta description exists
3. Title has brand ("Teamz Lab Tools")
4. Canonical tag exists
5. Viewport meta exists (mobile-friendly)
6. OG image tag exists
7. OG title + OG description exist
8. common.js and theme.js loaded
9. Correct `lang="XX"` on non-English pages
10. hreflang tags on non-English pages
11. No hardcoded hex colors
12. Title length <= 60 chars
13. Meta description <= 155 chars
14. H1 keyword appears in title
15. No white text on accent background
16. FAQs exist (renderFAQs + injectFAQSchema)
17. WebApplication schema exists (injectWebAppSchema)
18. Related tools exist (renderRelatedTools)
19. Content >= 150 words
20. At least 2 H2 tags in content
21. JS logic exists (addEventListener or functions)
22. No central CSS class redefinitions (share-btn, tool-result, etc.)

## SEO Audit Docs (committed to repo — portable across devices)

All SEO findings are stored in `/docs/seo-audit/` so they travel with the repo:

```
/docs/seo-audit/seo-audit-2026-03.md       — Full audit: score 72/100, all issues, roadmap
/docs/seo-audit/hardcoded-colors-list.md    — 76 pages with hardcoded hex colors (batch fix list)
/docs/seo-audit/google-seo-doc-references.md — Google Search Central URLs cited in audit
```

**When doing SEO work, read these files first.** They contain:
- Every critical/high/medium/low issue with exact file paths
- What's already passing (don't re-audit)
- What needs Google Search Console access to verify
- Implementation roadmap (24h / 7d / 30d / 90d)
- The 76-page hardcoded color fix list organized by category

**After fixing issues, update the audit doc** to reflect current state.

## Growth Playbook (committed to repo)

The full growth strategy lives in `/docs/research/022-growth-playbook.md`. It contains:
- **Research-first workflow** — Google Trends + Reddit + news cycle before building
- **Monetization strategy** — AdSense, affiliates, lead gen, newsletter, premium tier
- **Seasonal playbook** — what to build each month for trend-jacking
- **Virality checklist** — share buttons, OG images, embed codes
- **Revenue targets** — phased approach from $0 to $10K+/mo
- **Data-driven decisions** — monthly review cadence using Firebase Analytics

**Influences:** Marc Lou (ship fast, monetize day 1) + Adam Lyttle (portfolio model, trend-jacking, ASO/SEO niche targeting, $800K from 50 simple apps)

**Read this doc before suggesting new tools or strategy changes.**

### Rule 11: NEVER set percentage/em line-height on headings
- `base.css` has a global reset: `h1,h2,h3,h4,h5,h6 { line-height:1.3; }` — DO NOT remove this
- NEVER use `line-height: var(--lh)` (140%) or any percentage/em value on headings
- **Why:** Percentage `line-height` on a parent (e.g. `line-height: 140%` on body at 18px = 25.2px) gets inherited as a COMPUTED pixel value. A child `h2` at 28px font-size would get only 25.2px line-height, causing multi-line headings to overlap
- If you need a custom heading line-height, ALWAYS use a unitless value (e.g. `line-height: 1.2`)
- The base reset ensures ALL headings get proper line-height automatically — no need to add it per-rule

### Rule 10: EVERY tool MUST be mobile-responsive
- ALWAYS include `@media (max-width: 600px)` with these overrides:
  - All `h2` inside tool sections: `font-size: var(--text-lg)` (NOT default xl/2xl)
  - Form grids: `grid-template-columns: 1fr` (single column)
  - Form padding: reduce to `18px`
  - Action buttons: `flex-direction: column; width: 100%`
  - Canvas/preview wrappers: `max-width: 100%; overflow-x: auto`
  - Canvas elements: `max-width: 100%; height: auto`
  - Fixed-width elements (cheques, cards): `width: 100%; max-width: [original]px`
  - Style pickers: max 2-3 columns on mobile
- Test mentally for 375px viewport before committing
- Use `clamp()` for font sizes where possible: `clamp(18px, 4vw, 28px)`
- NEVER use fixed `width: 700px` without a `max-width: 100%` fallback

### Rule 12: ALWAYS use shared AI engine for AI-powered tools
- ANY tool that uses AI (Chrome AI, Transformers.js, or both) MUST use `/shared/js/ai-engine.js`
- Add `<script src="/shared/js/ai-engine.js"></script>` BEFORE the tool's inline script
- Use `TeamzAI.generate()` for the 3-tier fallback (Chrome AI → Transformers.js → curated fallback)
- Use `TeamzAI.chromeAI.prompt` / `.summarizer` / `.writer` / `.rewriter` to check availability
- Use `TeamzAI.getPipeline(task, model, options)` to get cached Transformers.js pipelines
- **Why:** Models are cached in IndexedDB + memory. If user already downloaded a model in Tool A, Tool B reuses it instantly — no re-download
- NEVER import Transformers.js directly in a tool — always go through `TeamzAI`
- NEVER do inline Chrome AI detection — always use `TeamzAI.chromeAI`

**Quick usage pattern for new AI tools:**
```html
<script src="/shared/js/ai-engine.js"></script>
<script>
  // Wait for AI engine to initialize
  document.addEventListener('DOMContentLoaded', async function() {
    await TeamzAI.init();

    // Check what's available
    if (TeamzAI.chromeAI.prompt) { /* Chrome AI ready */ }

    // Generate with 3-tier fallback
    var result = await TeamzAI.generate({
      chromePrompt: 'Write a motivational quote about success',
      chromeSystemPrompt: 'You are a quote writer.',
      transformersTask: 'text2text-generation',
      transformersModel: 'Xenova/flan-t5-base',
      transformersPrompt: 'Write a motivational quote about success.',
      transformersOptions: { max_new_tokens: 150, num_beams: 4 },
      fallback: function() { return 'Fallback text here'; },
      onProgress: function(pct) { /* update progress bar */ },
      onStatus: function(msg) { /* show status message */ },
      qualityCheck: function(text) { return text.length > 20; }
    });
    // result = { text: '...', source: 'chrome-ai' | 'transformers' | 'fallback' }
  });
</script>
```

**Available Transformers.js models already used in this project:**
- `Xenova/flan-t5-base` — text2text-generation (quote generator)
- `Xenova/distilbart-cnn-6-6` — summarization (article summarizer)

### Rule 13: ALWAYS run SEO validation scripts after building ANY tool
- **NEVER skip the built-in scripts.** They exist to catch SEO issues automatically.
- **NEVER substitute with manual grep checks** — the scripts are more thorough.
- After building any new tool, run this checklist IN ORDER before declaring done:

```bash
# 1. Full build + validation (8 checks: search, sitemap, counts, colors, unlinked, dupes, SEO, technical)
./build.sh

# 2. Rebuild all JSON-LD schemas (BreadcrumbList, FAQPage, WebApplication)
python3 build-static-schema.py

# 3. Full SEO keyword audit
./build-seo-audit.sh --report

# 4. Check auto-fixable issues
./build-seo-audit.sh --fix --dry-run

# 5. Review ALL pre-commit warnings — fix them, don't ignore them
```

- Fix ALL warnings before telling user the tool is ready
- Verify these schemas exist: FAQPage, WebApplication, BreadcrumbList
- Verify these tags exist: twitter:title, twitter:description, og:image
- Verify these JS calls exist: injectFAQSchema, injectWebAppSchema, renderFAQs, renderRelatedTools

### Rule 14: NEVER use alert() — ALWAYS use window.showToast()
- `window.showToast(msg)` is defined globally in `common.js`
- Use it for ALL user feedback: copy success, share link, image copied, errors
- NEVER use `alert()` or `confirm()` for success/info messages
- For share link callbacks: `function(msg) { if (window.showToast) window.showToast(msg); }`

### Rule 15: Every image tool MUST have a Copy Image button
- Any tool that generates/downloads an image MUST include "Copy Image" button
- Wire up the event listener (don't just add the HTML button!)
- Use `canvas.toBlob()` → `navigator.clipboard.write([new ClipboardItem(...)])` → `window.showToast()`
- If using a canvas render function, accept an optional callback for copy vs download

### Rule 16: NEVER redefine central CSS classes in inline styles
- These classes are defined in `/shared/css/tools.css` and used globally:
  - `.share-btn` — social share bar (36x36 circular buttons)
  - `.btn-primary` / `.btn-secondary` — button design system (fully defined centrally)
  - `.tool-result` — result display formatting
  - `.tool-output` — utility output wrapper
  - `.ad-slot` — advertisement container
  - `.offline-banner`, `.floating-cta` — notification bars
- If you need custom button/element styling, use a tool-specific prefix:
  - `bracket-share-btn`, `quiz-share-btn`, `game-btn`, `generator-copy-btn`
- **Why:** CSS collision causes buttons to render as tiny circles, results to lose styling

### Rule 17: ALWAYS wire up the FULL data chain end-to-end
When adding a new feature/field to any tool, it MUST be added to ALL of these:
1. **Form** — input element in HTML
2. **Preview** — renderPreview() data object
3. **Storage** — chequeBook/saved data object
4. **HTML render** — buildHTML() function
5. **Canvas render** — renderCanvas() function
6. **Share link** — copyShareLink() params
7. **Share decode** — shareDecode() handler + form population
8. **Download** — getPreviewData() / downloadAsPNG() data

Missing any step = broken feature. Trace the data flow before marking done.

### Rule 18: Fix issues centrally, not per-file
- If a bug appears in multiple tools, fix it in `shared/css/tools.css` or `shared/js/common.js`
- If a pattern keeps being missed, add it to the pre-commit hook
- NEVER patch the same issue in 50 individual files — fix the system
- Examples: ad-slot spacing, share bar CSS, button design, in-app browser detection

### Rule 19: Tool completeness checklist (enforced by pre-commit)
Every tool MUST have ALL of these before committing:
1. `TeamzTools.renderFAQs(faqs)` + `TeamzTools.injectFAQSchema(faqs)` — 5+ FAQs
2. `TeamzTools.injectWebAppSchema({slug, title, description})` — WebApplication schema
3. `TeamzTools.renderRelatedTools([...])` — 3-6 related tools with internal links
4. `<section class="tool-content">` — 300-600 words, keyword density 1-2%
5. At least 3 H2 headings inside tool-content (for mid-content ad slots)
6. `addEventListener` or JS functions (real tool logic, not just HTML)
7. `TeamzTools.renderBreadcrumbs()` + `injectBreadcrumbSchema()`
8. `@media (max-width: 600px)` responsive rules

### Rule 20: Share link URL params — handle messaging app pollution
- When platforms (WhatsApp, Messenger) share URLs, they append text to the last URL param
- `shareDecode()` in common.js strips trailing text from enum keys (style, bank, currency, etc.)
- When adding new enum-type URL params, add them to the `enumKeys` array in `shareDecode()`
- Always validate decoded enum values against known options before using them

## QA & Monitoring
```bash
./build-qa-check.sh               # Automated QA: checks all tools for missing FAQs, schemas, content, JS logic
./build.sh                         # Full build + 8-step validation
./build-seo-audit.sh --report      # SEO keyword audit with hub scores
python3 build-static-schema.py     # Rebuild all JSON-LD schemas
```

## Common Mistakes to AVOID
1. Building tools without linking them from hub pages
2. Using white text on neon accent background
3. Nesting cards inside cards inside cards
4. Forgetting to update homepage card counts
5. Forgetting to rebuild search index and sitemap
6. Using hardcoded hex colors instead of CSS variables
7. Making Chrome-AI-only tools without fallbacks
8. Adding max-height to result containers
9. NOT making tools mobile-responsive (see Rule 10)
10. Using percentage/em `line-height` on headings (see Rule 11)
11. Building AI tools WITHOUT shared `/shared/js/ai-engine.js` (see Rule 12)
12. Skipping SEO validation scripts (see Rule 13)
13. Using alert() instead of window.showToast() (see Rule 14)
14. Adding image download without Copy Image button (see Rule 15)
15. Redefining central CSS classes in inline styles (see Rule 16)
16. Half-implementing features — missing data in share/canvas/download chain (see Rule 17)
17. Patching same bug in 50 files instead of fixing centrally (see Rule 18)
18. Committing tools without FAQs, schemas, content, or related tools (see Rule 19)
