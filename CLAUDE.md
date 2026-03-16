# CLAUDE.md — Rules for AI Assistants Working on Teamz Lab Tools

## Project Overview
- Static site: 600+ browser-based tools at tool.teamzlab.com
- Hosted on GitHub Pages, no backend
- Design system uses CSS custom properties (tokens) — NEVER hardcode colors
- Privacy-first: everything runs client-side

## AUTOMATED SAFEGUARDS (already in place)

1. **Pre-commit hook** (`.git/hooks/pre-commit`) — runs automatically before every commit:
   - Rebuilds `search-index.js` with ALL tool titles + descriptions
   - Rebuilds `sitemap.xml` with ALL tool URLs
   - Updates homepage card counts to match actual tool counts
   - Updates search placeholder ("Search N+ tools...")
   - Updates cache-buster version on search-index.js
   - Warns about hardcoded colors on accent backgrounds

2. **Build scripts** — run manually or via hook:
   - `./build-search-index.sh` — rebuilds search + counts + sitemap
   - `./build-sitemap.sh` — rebuilds sitemap only
   - `./build.sh` — full validation (search + sitemap + counts + lint + unlinked check)
   - `./build-validate-freshness.sh` — checks for stale/outdated data (run annually or when rates change)

3. **You do NOT need to manually update**: search index, sitemap, homepage card counts, or search placeholder. The pre-commit hook does it automatically.

4. **You DO need to manually update**: hub index pages when adding new tools to a category (e.g., add new tool link to `/ai/index.html` or `/tools/index.html`).

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
- The accent color is NEON/BRIGHT — text on accent backgrounds MUST be `color: var(--bg)` or `color: #000` (dark text on bright background)
- NEVER use `color: #fff` with `background: var(--accent)` — this makes text invisible on neon
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

## Common Mistakes to AVOID
1. Building tools without linking them from hub pages
2. Using white text on neon accent background
3. Nesting cards inside cards inside cards
4. Forgetting to update homepage card counts
5. Forgetting to rebuild search index and sitemap
6. Using hardcoded hex colors instead of CSS variables
7. Making Chrome-AI-only tools without fallbacks
8. Adding max-height to result containers
