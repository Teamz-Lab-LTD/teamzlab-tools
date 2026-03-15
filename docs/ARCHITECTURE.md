# Architecture Guide — Teamz Lab Tools

## Central Management Points

### 1. Design System (branding/)
All UI comes from the branding submodule. To update the design globally:
- Edit `branding/css/tokens.css` for colors, fonts, spacing
- Edit `branding/css/components.css` for shared components (cards, buttons, badges)
- Edit `branding/js/theme.js` for dark/light mode behavior
- Run `git submodule update --remote` to pull latest from the branding repo

### 2. Tool-Specific Styles (shared/css/tools.css)
All calculator-specific styling lives here. One file controls:
- Input/select/checkbox appearance
- Calculator card layout
- Result display
- FAQ accordion
- Related tools grid
- Ad slot spacing
- Print styles
- Responsive breakpoints
- Focus states and accessibility

### 3. Shared JavaScript (shared/js/)
Two files power all tools:
- `common.js` — header, footer, breadcrumbs, schema injection, related tools, FAQs
- `tool-engine.js` — calculator rendering, validation, localStorage, clipboard, date utilities

### 4. Tool Registry (shared/tools-registry.json)
Central JSON listing all 60+ tools with slug, title, description, and category.
Use this for:
- Generating sitemap.xml
- Building homepage tool listings
- Populating footer links
- Adding new tools (just add an entry + the HTML page)

### 5. SEO Files (root level)
- `sitemap.xml` — regenerate when adding tools
- `robots.txt` — rarely changes
- `CNAME` — your custom domain

## How to Add a New Tool

1. Create folder: `my-new-calculator/index.html`
2. Copy any existing tool page as template
3. Change: title, meta description, OG tags, canonical URL, H1, description, calculator config, content, FAQs, related tools
4. Add entry to `shared/tools-registry.json`
5. Add tool card to `index.html` homepage
6. Regenerate `sitemap.xml` (run the Python script or add manually)

## How to Change Global Branding

- **Colors**: Edit `branding/css/tokens.css` — all pages inherit via CSS variables
- **Font**: Change `--font` in tokens.css
- **Accent color**: Change `--accent` in tokens.css — buttons, links, focus rings all update
- **Dark/light mode**: Controlled by `branding/js/theme.js`

## How to Change All Tool Layouts

- **Header/footer**: Edit `shared/js/common.js` — every page auto-renders from here
- **Calculator UI**: Edit `shared/js/tool-engine.js` — all inputs, buttons, results render from here
- **Tool styling**: Edit `shared/css/tools.css` — one file, all pages

## How to Change CTA/Lead Gen

- **Footer CTA**: Edit the `renderFooter()` function in `shared/js/common.js`
- **Result CTA**: Edit the `_renderResult()` function in `shared/js/tool-engine.js`
- **Both update globally** — change once, every tool page reflects it

## File Structure

```
teamzlab-tools/
├── branding/                    ← Design system (git submodule)
│   ├── css/
│   │   ├── tokens.css          ← Colors, fonts, spacing
│   │   ├── base.css            ← Reset, body, accessibility
│   │   ├── components.css      ← Cards, buttons, badges
│   │   ├── animations.css      ← Keyframes
│   │   ├── responsive.css      ← Breakpoints
│   │   ├── rtl.css             ← RTL support
│   │   └── teamz-branding.css  ← Main import
│   └── js/
│       └── theme.js            ← Dark/light toggle
├── shared/
│   ├── css/
│   │   └── tools.css           ← Tool-specific styles
│   ├── js/
│   │   ├── common.js           ← Header/footer/schemas
│   │   └── tool-engine.js      ← Calculator engine
│   └── tools-registry.json     ← Central tool listing
├── docs/
│   ├── research/               ← Strategy research docs
│   ├── ARCHITECTURE.md         ← This file
│   ├── CHANGELOG.md            ← What was built/fixed
│   └── ROADMAP.md              ← What to build next
├── [tool-slug]/index.html      ← Each calculator tool
├── about/index.html
├── contact/index.html
├── privacy/index.html
├── terms/index.html
├── index.html                  ← Homepage
├── 404.html
├── sitemap.xml
├── robots.txt
├── CNAME
└── .gitignore
```

## Key Principle
**Change in one place, reflects everywhere.** The branding submodule controls design. The shared JS controls layout. Individual tool pages only contain their unique calculator config and SEO content.
