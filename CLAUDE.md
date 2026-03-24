# CLAUDE.md — Rules for AI Assistants Working on Teamz Lab Tools

## Project Overview
- Static site: 1135+ browser-based tools at tool.teamzlab.com
- Hosted on GitHub Pages, no backend
- Design system uses CSS custom properties (tokens) — NEVER hardcode colors
- Privacy-first: everything runs client-side
- AI discoverability via `llms.txt` (6KB curated index) + `llms-full.txt` (complete index)

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
   - **Warns about broken internal links** (href="/path/" pointing to non-existent pages)
   - Rebuilds static JSON-LD schema in all pages (`build-static-schema.py`)
   - Rebuilds `llms.txt` + `llms-full.txt` (AI search engine index for ChatGPT/Perplexity/Claude)

2. **Build scripts** — run manually or via hook:
   - `./build-search-index.sh` — rebuilds search + counts + sitemap + llms.txt + llms-full.txt
   - `./build-sitemap.sh` — rebuilds sitemap only
   - `./build.sh` — full validation (search + sitemap + counts + lint + unlinked check)
   - `./build-validate-freshness.sh` — checks for stale/outdated data (run annually or when rates change)
   - `python3 scripts/build-fix-orphans.py fix` — fixes orphan pages (adds cross-links in related tools)
   - `scripts/build-internal-links.sh --quick` — checks internal link health score

3. **You do NOT need to manually update**: search index, sitemap, homepage card counts, search placeholder, llms.txt, llms-full.txt, or twitter tags. The pre-commit hook does it all automatically.

3b. **Google Search Console API** is connected:
   - Run `./build-search-console.sh` to pull live data (queries, pages, indexing, devices, countries)
   - Run `./build-search-console.sh --status` for indexing status only
   - Account: `teamz.lab.contact@gmail.com` | Site: `https://tool.teamzlab.com/`
   - Token: `~/.config/teamzlab/search-console-token.json` (auto-refreshes)
   - If token expired: `python3 build-search-console-auth.py` (opens browser to re-auth)
   - Setup guide: `docs/search-console-setup.md`
   - **When user asks "what's my status" or "how's the site doing"**: run this script first, then analyze and make recommendations

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

   **c) Check for duplicates (MANDATORY — search BROADLY, not just exact slug):**
   ```bash
   # Search for CONCEPT, not just exact slug name
   # Example: for "meme generator", search *meme* — catches "meme-maker" too
   find . -path "*keyword1*" -name "index.html" 2>/dev/null
   find . -path "*keyword2*" -name "index.html" 2>/dev/null
   grep -rl "related concept keyword" --include="*.html" -l | head -10
   ```
   **NEVER launch build agents before running these checks.**
   If a similar tool exists, ENHANCE it instead of creating a duplicate.

   Known duplicates to be aware of:
   - sleep-calculator exists in `/health/` AND `/evergreen/`
   - YouTube thumbnail tools exist in `/tools/`, `/video/`, `/design/`
   - Resume/ATS tools exist in `/career/resume-ats-scorer/` AND `/career/ats-resume-checker/`
   - Meme tools: `/image/meme-maker/` (don't create meme-generator)
   - WiFi QR: `/diagnostic/wifi-qr-code-generator/` (don't create in /tools/)
   - Tip calculator: `/restaurant/tip-calculator/` (don't create in /evergreen/ or /tools/)
   - Face shape: `/grooming/face-shape-detector/` AND `/tools/face-shape-detector/`

   **Also check concept overlap:**
   - "eid-greeting-message-generator" = same as "eid-mubarak-wishes-generator"
   - "eid-preparation-checklist" = overlaps "eid-countdown" + "eid-shopping-list"
   - Before building, ask: "Does an existing tool already solve this problem?"

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
/                              — root (HTML pages, configs, symlinks to scripts/)
├── index.html                 — homepage
├── CLAUDE.md                  — this file (AI assistant rules)
├── sitemap.xml                — auto-generated
├── robots.txt                 — allows all crawlers
├── manifest.json              — PWA manifest
├── sw.js                      — service worker
├── llms.txt                   — AI search index, curated <10KB (auto-generated, per llmstxt.org)
├── llms-full.txt              — AI search index, all tools with full descriptions (auto-generated)
│
├── shared/                    — central CSS/JS (DO NOT duplicate per-tool)
│   ├── css/tools.css          — main tool page styles
│   ├── css/utility-tools.css  — utility engine output styles
│   ├── js/common.js           — header, footer, schema, breadcrumbs, feedback
│   ├── js/tool-engine.js      — calculator-type tools
│   ├── js/utility-engine.js   — text/dev/generator tools
│   ├── js/ai-engine.js        — central AI manager (Chrome AI + Transformers.js)
│   ├── js/search-index.js     — search data (auto-generated)
│   └── js/adsense.js          — AdSense integration
│
├── branding/                  — git submodule (teamz-lab-branding-web-component)
│   ├── css/teamz-branding.css — design tokens, brand styles
│   └── js/theme.js            — dark/light theme toggle
│
├── scripts/                   — all build/QA/SEO scripts
│   ├── build.sh               — full build + 8-step validation
│   ├── build-search-index.sh  — rebuild search + counts + sitemap + llms.txt + llms-full.txt
│   ├── build-sitemap.sh       — rebuild sitemap only
│   ├── build-static-schema.py — rebuild JSON-LD schemas
│   ├── build-seo-audit.sh     — SEO keyword audit
│   ├── build-qa-check.sh      — automated QA checker
│   ├── build-validate-freshness.sh — stale content checker
│   ├── build-og-images.py     — regenerate hub OG images
│   ├── build-search-console.sh — Google Search Console API
│   ├── build-analytics.sh     — Google Analytics GA4 data
│   ├── build-adsense.sh       — Google AdSense revenue data
│   ├── build-pagespeed.sh     — PageSpeed Insights (Core Web Vitals)
│   ├── build-internal-links.sh — internal link health checker
│   ├── build-fix-orphans.py   — auto-fix orphan pages (cross-link siblings)
│   ├── build-request-indexing.py — request Google indexing for pages
│   ├── build-keyword-volume.py — keyword search volume estimator
│   ├── seo-keyword-engine.py  — SEO keyword analysis engine
│   ├── qa-test.sh / qa-test.py — QA test runner
│   └── distribute/            — 7-platform content distribution system
│
├── icons/                     — favicons (16-512px)
├── og-images/                 — hub-level OG images for social sharing
├── .claude-memory/            — AI assistant memory backup (synced to repo)
│   ├── MEMORY.md              — memory index
│   ├── *.md                   — individual memory files (feedback, project, user, reference)
│   └── restore.sh             — restore memories on new machine
│
├── docs/                      — SEO audit docs, setup guides
│
├── [hub]/                     — tool category hubs (40+ hubs)
│   ├── index.html             — hub page listing all tools in category
│   └── [tool-slug]/           — individual tool
│       └── index.html         — tool page
│
└── *.sh / *.py                — symlinks to scripts/ (backward compatible)
```

## Build Scripts (in scripts/, symlinked at root)
```bash
./build-search-index.sh                      # Rebuild search + llms.txt + llms-full.txt + sitemap + counts
./build-sitemap.sh                           # Rebuild sitemap (also pings Google/Bing)
./build.sh                                   # Full build + 8-step validation
./build-og-images.py                         # Regenerate hub OG images (run after adding new hub)
python3 scripts/build-fix-orphans.py fix     # Fix orphan pages (auto cross-link)
scripts/build-internal-links.sh --quick      # Check internal link health score
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

### Rule 14: EVERY new tool MUST pass this checklist (no exceptions)
Before committing ANY new tool (whether built by AI or by user), verify ALL:
1. **3 JSON-LD schemas**: BreadcrumbList, FAQPage, WebApplication
2. **5+ FAQs**: via `TeamzTools.renderFAQs()` + `injectFAQSchema()`
3. **6 related tools**: via `TeamzTools.renderRelatedTools()` — use `{ slug, name, description }` format
4. **Breadcrumbs**: via `TeamzTools.renderBreadcrumbs()` + `injectBreadcrumbSchema()`
5. **3+ H2 sections** in `.tool-content` (required for mid-content ad slot)
6. **300-600 words** of SEO content
7. **Zero hardcoded hex colors** in CSS — only CSS variables
8. **Ad slot div** between calculator and content
9. **Meta description** 120-155 chars, starts with action verb
10. **Title** max 60 chars with keyword + "Teamz Lab Tools"
11. **Mobile responsive** `@media (max-width: 600px)`
12. **Every input MUST have an `id` attribute** — auto-save uses `id` as storage key
- **ALWAYS audit user-added tools too** — don't assume they follow the template
- Run `./build.sh` + `python3 build-static-schema.py` after adding any tool

### Rule 16: Auto-save is CENTRAL — never duplicate it
- `common.js` auto-saves ALL form inputs to localStorage for every tool page
- It saves inputs in `.tool-calculator` and `.site-main` (100% coverage)
- **NEVER add per-tool localStorage save/restore for basic form inputs** — it's already handled
- Every `<input>`, `<select>`, `<textarea>` MUST have an `id` attribute for auto-save to work
- Clear/Reset buttons (`.tool-clear-btn`, `id*="clear"`, `id*="reset"`) auto-clear saved data
- Auto-save is SKIPPED when page has query params (shared link views)
- For complex data (arrays, dynamic lists, canvas), custom save logic may be needed IN ADDITION to central auto-save

### Rule 15: AdSense content structure for maximum revenue
- Every tool page MUST have **3+ H2 sections** in `.tool-content` for the mid-content ad slot
- The `adsense.js` script places an ad between the 2nd and 3rd H2 — this is the highest-RPM position
- Tools with <3 H2s only get 3 ads instead of 4, losing ~15-25% potential revenue
- Pattern: "How X Works" → "X for [Use Case]" → "Tips for X" → "X vs Y"

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

### Rule 13: ALWAYS run validation scripts — ESPECIALLY before committing
- **NEVER skip the built-in scripts.** They exist to catch SEO + runtime + UX issues automatically.
- **NEVER substitute with manual grep checks** — the scripts are more thorough.
- **MANDATORY: When user says "commit" or "push", run this BEFORE committing:**

```bash
# 1. Full QA + UX scan (SEO structure + runtime safety + UX usability)
./build-qa-check.sh

# 2. Full build + validation (search, sitemap, counts, colors, unlinked, dupes)
./build.sh

# 3. Rebuild all JSON-LD schemas (BreadcrumbList, FAQPage, WebApplication)
python3 build-static-schema.py

# 4. Fix orphan pages (cross-link new tools)
python3 scripts/build-fix-orphans.py fix

# 5. Review ALL warnings — fix CRITICAL and HIGH issues before committing
# 6. THEN commit (pre-commit hook runs 25+ additional checks on staged files)
```

- Fix ALL critical/high warnings before telling user the tool is ready
- The pre-commit hook runs automatically but only checks STAGED files
- `build-qa-check.sh` checks ALL tools — run it before every commit to catch regressions
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

### Rule 21: NEVER repeat these tool-building mistakes
These mistakes were made and must NEVER happen again:

**Before building:**
1. **Search broadly for duplicates** — `find . -path "*meme*"` not `"*meme-generator*"`. A tool called "meme-maker" IS a duplicate of "meme-generator"
2. **Check concept overlap** — "eid-preparation-checklist" overlaps with "eid-countdown" + "eid-shopping-list". Ask: "Does an existing tool already do this?"
3. **NEVER launch build agents without running duplicate check first** — the 30 seconds of checking saves hours of cleanup

**After building:**
4. **Run `git status`** — check for untracked files that will be 404 on live site
5. **Clean up hub links** — if you delete a tool, ALSO remove its link from hub pages

**When consolidating duplicates:**
6. **Compare features BEFORE deleting** — `grep -o 'function [a-zA-Z]*' file.html | sort` on both versions. If deleted version has unique features, MERGE them first
7. **Never make up external URLs** — no fake YouTube IDs, no guessed image URLs. Use search links instead

**Pre-commit hook catches:**
- Same-slug tools in different hubs (duplicate detection)
- Untracked tool files (404 prevention)
- Broken internal links (link validation)

### Rule 22: llms.txt MUST follow the llmstxt.org spec
- `llms.txt` is the AI search index — how ChatGPT, Perplexity, Claude discover and recommend our tools
- **Spec (llmstxt.org):** llms.txt MUST be under 10KB (currently ~6KB)
- `llms.txt` = curated navigation index: H1 + blockquote + 15 popular tools + category links with counts + `## Optional` section
- `llms-full.txt` = complete tool index: ALL tools with full descriptions (can be large)
- **NEVER dump all 1135 tools into llms.txt** — that violates the spec (max 10KB)
- **NEVER add "Instructions for AI Assistants"** or "When to Recommend" — considered prompt injection / spammy
- Keep content factual and descriptive, not self-promotional or directive
- HTML entities MUST be decoded (use `html.unescape()`) — no `&#7875;` in output
- The pre-commit hook rebuilds both files automatically via `build-search-index.sh`
- After adding/removing tools, verify the new tool appears in `llms-full.txt` and its category count is updated in `llms.txt`
- **Reference implementations:** Stripe, Vercel, Supabase, Cursor

### Rule 23: ALWAYS fix orphan pages when adding tools
- An orphan page = a tool that no other tool links to via `renderRelatedTools`
- After adding new tools, run `scripts/build-internal-links.sh --quick` to check orphan count
- If orphans exist, run `python3 scripts/build-fix-orphans.py fix` to auto-link them
- The fixer adds orphans to same-hub siblings' related tools (3 passes: <6, <8, cross-hub)
- Target: internal link health score 90+/100
- **Why:** Orphan pages can't be discovered by Google through internal links, hurting SEO

### Rule 24: MANDATORY usability QA before declaring ANY tool done
Every tool MUST pass this usability checklist before being declared "done". Trace through the code as a real user would:

**A) Event Wiring (does every button work?):**
- Every `<button>` in HTML has a matching `addEventListener` in JS — no orphan buttons
- Every `getElementById()` call matches an actual `id` in the HTML
- Clear/Reset buttons clear ALL inputs INCLUDING `<select>` dropdowns (use `.selectedIndex = 0`)

**B) Error Handling (no silent failures):**
- `navigator.clipboard.writeText()` MUST have `.catch()` with `showToast()` — Firefox and permission denied cases
- `navigator.clipboard.write()` for images MUST have `try/catch` + `.catch()` — ClipboardItem not supported in Firefox
- Buttons MUST re-enable after errors — use `finally {}` block, NEVER put `btn.disabled = false` only in try block
- CDN script loads MUST have `onerror` handler with user feedback

**C) Unicode / String Safety:**
- `.split('')` does NOT work for characters above U+FFFF (emoji, squared letters) — use `Array.from()` instead
- `escapeAttr()` MUST handle Unicode characters that produce surrogate pairs
- Italic Mathematical Unicode has exceptions: `h` → U+210E (not the offset formula)

**D) AI Tool Specific:**
- ALL AI tools MUST use 3-tier fallback: Chrome AI → Transformers.js → Rule-based
- MUST load `/shared/js/ai-engine.js` and use `TeamzAI.generate()` — NEVER call Chrome AI APIs directly
- Fallback functions MUST produce real usable output — NOT empty strings or "AI not available"
- `applyTone()` or similar functions MUST handle ALL tone options in the dropdown — no no-op tones
- Progress callback MUST update button text during model download

**E) Download/Export:**
- `html2canvas` MUST use `backgroundColor: '#ffffff'` — NOT `null` (produces transparent/dark PNGs)
- Downloaded filenames MUST be sanitized: `.replace(/\s+/g, '-').toLowerCase()`
- Copy Image MUST have fallback message: "Copy not supported — use Download instead"

**F) Data Integrity:**
- Calculations MUST be verified with sample data (e.g., $5000 basic + $1000 HRA = $6000 gross)
- Date inputs MUST be formatted for display (use `toLocaleDateString()`, not raw `YYYY-MM-DD`)
- Upside Down text MUST reverse character order (not just map characters)

## AI Assistant Memory (portable across machines)
- Memory files live in `~/.claude/projects/.../memory/` (Claude Code's local storage)
- A **backup copy** is kept in `.claude-memory/` in the repo (committed to git)
- **SYNC RULE:** Whenever you save/update a memory file locally, ALSO copy it to `.claude-memory/`
- **On a new machine:** Run `bash .claude-memory/restore.sh` to restore all memories
- Memory contains: user preferences, feedback rules, project context, SEO audit state, references
- See `.claude-memory/MEMORY.md` for the full index

## Indexing & Search Engine Submission
```bash
python3 scripts/build-request-indexing.py                  # Check top 30 pages + submit to Bing/Yandex
python3 scripts/build-request-indexing.py --all            # Check ALL pages from sitemap
python3 scripts/build-request-indexing.py --check          # Check indexing status only (no IndexNow)
python3 scripts/build-request-indexing.py --url URL        # Check/submit a specific URL
```
- Uses Google URL Inspection API (via Search Console token) to check real indexing status
- Submits to Bing/Yandex via IndexNow protocol (requires `teamzlab-indexnow-key.txt` on live site)
- **MANDATORY:** Run after creating or updating ANY tool to ensure it gets indexed

## QA & Monitoring
```bash
./build-qa-check.sh                         # Automated QA: checks all tools for missing FAQs, schemas, content, JS logic
./build.sh                                   # Full build + 8-step validation
./build-seo-audit.sh --report                # SEO keyword audit with hub scores
python3 build-static-schema.py               # Rebuild all JSON-LD schemas
scripts/build-internal-links.sh --quick      # Internal link health score (target: 90+)
python3 scripts/build-fix-orphans.py fix     # Fix orphan pages (auto-link to siblings)
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
19. Creating duplicate tools without broad search first — "meme-maker" IS "meme-generator" (see Rule 21)
20. Deleting duplicate tools without comparing/merging unique features first (see Rule 21)
21. Making up YouTube video IDs or image URLs — use search links instead (see Rule 21)
22. Leaving untracked files that will be 404 on live site — always run git status (see Rule 21)
23. Deleting tools but leaving broken links in hub pages (see Rule 21)
24. Dumping all 1135 tools into llms.txt — spec says under 10KB, use categories + top 15 only (see Rule 22)
25. Adding "Instructions for AI" or "When to Recommend" to llms.txt — considered prompt injection (see Rule 22)
26. Leaving orphan pages (0 incoming related links) — run build-fix-orphans.py after adding tools (see Rule 23)
