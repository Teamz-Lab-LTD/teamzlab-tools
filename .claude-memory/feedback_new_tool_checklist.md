---
name: New tool mandatory checklist
description: EVERY new tool (whether built by me or user) must pass this checklist before committing. Always audit user-added tools too.
type: feedback
---

EVERY new tool page MUST have ALL of these before committing. No exceptions:

1. **3 JSON-LD schemas**: BreadcrumbList, FAQPage, WebApplication (via TeamzTools calls)
2. **5+ FAQs**: rendered via TeamzTools.renderFAQs() + injectFAQSchema()
3. **6 related tools**: rendered via TeamzTools.renderRelatedTools()
4. **3+ H2 sections** in tool-content (for mid-content ad slot)
5. **300-600 words** of SEO content
6. **Zero hardcoded hex colors** — only CSS vars
7. **Ad slot div** between calculator and content
8. **Meta description** 120-155 chars, starts with action verb
9. **Title** max 60 chars with keyword + "Teamz Lab Tools"
10. **Mobile responsive** @media (max-width: 600px)

**Why:** User noticed tools they added were missing FAQs/schemas. I should have audited them before committing. ALWAYS run the SEO checklist on ANY tool — whether I built it or the user did.

**How to apply:** When user says "I added some tools" or when committing any new tool files, run the full audit on each file before pushing. Fix issues proactively.
