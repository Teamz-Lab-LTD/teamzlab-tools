---
name: feedback_correct_element_ids
description: Always use correct element IDs expected by common.js — tool-faqs not faqs-section, related-tools for related tools
type: feedback
---

NEVER guess element IDs. Always check common.js for the exact IDs that renderFAQs(), renderRelatedTools(), renderBreadcrumbs() etc. expect.

**Correct IDs:**
- `id="tool-faqs"` — for renderFAQs()
- `id="related-tools"` — for renderRelatedTools()
- `id="breadcrumbs"` — for renderBreadcrumbs()

**Why:** Used `id="faqs-section"` instead of `id="tool-faqs"`, causing FAQs to silently not render. The function does `getElementById('tool-faqs')` and returns early if not found — no error, just invisible failure.

**How to apply:** Before writing ANY new tool HTML, grep common.js for the getElementById calls in the render functions. Don't guess IDs from memory. Copy exact IDs from a working tool or from common.js directly.
