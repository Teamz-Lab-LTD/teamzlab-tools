---
name: Mobile responsiveness for all new tools
description: CRITICAL — every new tool MUST be mobile-responsive. Headings, forms, previews, buttons must scale properly on small screens.
type: feedback
---

Every new tool page MUST be tested for mobile responsiveness. Common mistakes to avoid:

1. **Headings too large on mobile** — use `clamp()` or `@media (max-width: 600px)` to reduce h2/h3 sizes. Never use `var(--text-xl)` for section headings without a mobile override.
2. **Forms not stacking** — always add `grid-template-columns: 1fr` at 600px breakpoint.
3. **Fixed-width elements** — cheques, cards, previews with `width: 700px` must have `width: 100%; max-width: 700px` or `min-width` with overflow scroll.
4. **Buttons not full-width** — action buttons should stack vertically and be `width: 100%` on mobile.
5. **Canvas/preview overflow** — wrap in container with `max-width: 100%; overflow-x: auto`.
6. **Font sizes** — use `clamp(minSize, preferred, maxSize)` for dynamic sizing or explicit mobile overrides.

**Why:** User found headings like "Create a Cheque" and "Choose Cheque Style" were enormous on mobile, making the page unusable. This is a recurring issue across new tools.

**How to apply:** Before finishing ANY new tool, always include a `@media (max-width: 600px)` block that reduces heading sizes, stacks grid layouts to single column, and makes buttons full-width. Test mentally for 375px viewport.
