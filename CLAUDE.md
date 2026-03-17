# CLAUDE.md — Rules for AI Assistants Working on Teamz Lab Tools

## Project Overview
- Static site: 677+ browser-based tools at tool.teamzlab.com
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
   - Rebuilds static JSON-LD schema in all pages (`build-static-schema.py`)

2. **Build scripts** — run manually or via hook:
   - `./build-search-index.sh` — rebuilds search + counts + sitemap
   - `./build-sitemap.sh` — rebuilds sitemap only
   - `./build.sh` — full validation (search + sitemap + counts + lint + unlinked check)
   - `./build-validate-freshness.sh` — checks for stale/outdated data (run annually or when rates change)

3. **You do NOT need to manually update**: search index, sitemap, homepage card counts, or search placeholder. The pre-commit hook does it automatically.

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
- `<title>` with exact-match keyword + "| Teamz Lab Tools"
- `<meta name="description">` with action verb + benefit + "free" + "private"
- `<link rel="canonical">` with full URL
- OG tags (og:title, og:description, og:url, og:type, og:site_name)
- Breadcrumbs with schema
- H1 with exact keyword
- Tool UI above the fold
- Ad slot: `<div class="ad-slot">Ad Space</div>`
- Tool content section (300-600 words)
- 3-7 FAQs with schema
- 6+ related tools with internal links
- WebApplication schema
- Scripts: `theme.js`, `common.js`, then tool-specific JS

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
/shared/js/search-index.js     — search data (auto-generated)
/branding/css/teamz-branding.css — design tokens, brand styles
/branding/js/theme.js          — dark/light theme toggle
/sitemap.xml                   — auto-generated
/manifest.json                 — PWA manifest
/sw.js                         — service worker
```

## Build Scripts
```bash
./build-search-index.sh   # Rebuild search after adding/changing tools
./build-sitemap.sh        # Rebuild sitemap after adding tools
```

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

## Common Mistakes to AVOID
1. Building tools without linking them from hub pages
2. Using white text on neon accent background
3. Nesting cards inside cards inside cards
4. Forgetting to update homepage card counts
5. Forgetting to rebuild search index and sitemap
6. Using hardcoded hex colors instead of CSS variables
7. Making Chrome-AI-only tools without fallbacks
8. Adding max-height to result containers
