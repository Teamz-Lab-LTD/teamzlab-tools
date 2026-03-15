# Changelog — Teamz Lab Tools

## Build 1 — Foundation + 24 Calculator Tools

### Architecture
- Set up branding design system as git submodule (teamz-lab-branding-web-component)
- Created config-driven ToolEngine (shared/js/tool-engine.js) — any tool can be added via a config object
- Created shared layout system (shared/js/common.js) — header, footer, breadcrumbs, schema injection
- Created tool-specific CSS layer (shared/css/tools.css) on top of branding design tokens
- GitHub Pages compatible — pure static HTML/CSS/JS, no build step required
- CNAME configured for tool.teamzlab.com

### Calculator Tools Built (24 total)

**Tier S — Work & Payroll (9 tools):**
1. Notice Period Calculator
2. Notice Period Buyout Calculator
3. Last Working Day Calculator
4. Leave Encashment Calculator
5. Probation Period Calculator
6. Salary Per Day Calculator
7. Salary Per Hour Calculator
8. Gratuity Calculator
9. Overtime Pay Calculator

**Tier S — Invoice & Freelance (9 tools):**
10. Invoice Due Date Calculator
11. Net 30 Calculator
12. Late Fee Calculator
13. Freelance Rate Calculator
14. Project Pricing Calculator
15. Retainer Calculator
16. Day Rate Calculator
17. Profit Margin Calculator
18. Utilization Rate Calculator

**Tier A — Expansion (6 tools):**
19. Business Day Calculator
20. Early Payment Discount Calculator
21. Attendance Percentage Calculator
22. Holiday Pay Calculator
23. UGC Rate Calculator
24. CPM Calculator

### Static Pages
- Homepage with 4 tool sections and SEO intro content
- About page
- Contact page (with form)
- Privacy Policy
- Terms of Service
- Custom 404 page

### SEO
- sitemap.xml with all 29 URLs
- robots.txt pointing to sitemap
- Canonical URLs on every page
- Open Graph + Twitter Card meta tags on every page
- BreadcrumbList schema on every tool page
- FAQPage schema on every tool page (5 FAQs each)
- WebApplication schema on every tool page
- Organization + WebSite schema on homepage
- Meta descriptions 120-160 chars, action-oriented

### Research
- Saved ChatGPT deep research document in docs/research/001-tool-hub-strategy.md
- Includes priority clusters, keyword analysis, growth-hack rules, tool specs

---

## Build 2 — Audit + Critical Fixes

### Security Fixes (P0)
- Added HTML escaping via _escapeHtml() in tool-engine.js and common.js
- All innerHTML rendering now escapes user-facing text (labels, values, FAQs, related tools)
- Result CTA text is static (no injection risk)

### Accessibility Fixes (P0)
- Added focus-visible box-shadow on inputs, selects, checkboxes
- Added aria-describedby linking inputs to error messages
- Added aria-label on checkboxes and selects
- Added role="alert" on error messages
- Added @media (prefers-reduced-motion: reduce) to disable animations
- Added focus-visible outline on calculate button

### CSS Quality Fixes (P1)
- Removed all !important hacks from .tool-calculate-btn — used higher specificity instead
- Fixed .tool-input--error to not need !important
- Improved print styles (page break handling, URL printing)
- Added .tool-result-cta styling for lead generation

### JavaScript Quality Fixes (P1)
- Converted tool-engine.js and common.js to var/function() for max browser compat
- Added ToolEngine.parseInputDate() for timezone-safe date parsing
- Added min/max validation in _validate() (not just required/empty)
- Added clipboard API fallback for HTTP and older browsers
- Added try-catch around calculate() to prevent crashes
- Added config validation in init()
- Fixed BreadcrumbList schema to omit undefined values instead of including them
- Added inLanguage, browserRequirements to WebApplication schema
- Added availableLanguage to Organization schema
- Fixed formatDate() to use browser locale instead of hardcoded en-US
- Added NaN/invalid-date safety to formatCurrency() and formatDate()

### Schema.org Compliance Fixes (P1)
- Organization contactPoint email now uses mailto: format
- WebApplication operatingSystem changed from "Any" to "All"
- Added inLanguage to WebSite and WebApplication schemas
- BreadcrumbList items no longer contain undefined "item" property
- Added error handling around schema JSON injection

### Lead Generation (P1)
- Added Teamz Lab CTA in every calculator result section
- Footer reorganized into 4 columns: Work & Payroll, Invoice & Freelance, More Tools, Company
- All 24 tools linked in footer

### SEO Improvements (P1)
- Homepage meta description expanded to 160 chars
- Homepage now has 2-paragraph intro section for SEO depth (no longer thin)
- Tool pages with short meta descriptions flagged and expanded
- Breadcrumbs simplified to Home > Tool Name (removed bogus middle "Tools" link)

### Content
- Homepage expanded with intro paragraphs explaining tool categories
- Added "Creator & Advertising Tools" section to homepage
- All tool pages link to 3 related tools for internal linking depth
