---
name: Every tool MUST pass completeness checklist before commit
description: CRITICAL — Pre-commit hook now validates FAQs, WebApp schema, related tools, content length, H2 count, JS logic, and CSS collisions. Every tool must have ALL of these.
type: feedback
---

## Mandatory Completeness Checklist (enforced by pre-commit hook)

Every tool page MUST have ALL of these before committing:

1. **FAQs** — `TeamzTools.renderFAQs(faqs)` + `TeamzTools.injectFAQSchema(faqs)` with 5+ questions
2. **WebApp Schema** — `TeamzTools.injectWebAppSchema({slug, title, description})`
3. **Related Tools** — `TeamzTools.renderRelatedTools([...])` with 3-6 related tools
4. **Content** — `<section class="tool-content">` with 300+ words (min 150 to pass hook)
5. **H2 Tags** — At least 2 H2s inside tool-content (for mid-content ad slots)
6. **JS Logic** — Must have `addEventListener` or `function` (real tool logic, not just HTML)
7. **No CSS Collisions** — Never redefine `.share-btn`, `.tool-result`, `.ad-slot` etc in inline styles
8. **Breadcrumbs** — `TeamzTools.renderBreadcrumbs()` + `injectBreadcrumbSchema()`

**Why:** User found 21 tools missing FAQs/schemas/content after 900+ tools were built. These issues hurt SEO rankings and AdSense revenue. The pre-commit hook now catches all of them automatically.

**How to apply:** The pre-commit hook validates all 8 checks on every staged tool file. Fix all warnings before telling the user the tool is ready. Never skip warnings.

**Root cause:** Tools were built without a completeness checklist. Each tool was "done" when the UI worked, but missing the SEO/monetization infrastructure. Now the hook catches this at commit time.
