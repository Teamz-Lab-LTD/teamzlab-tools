---
name: Heading line-height must be explicit
description: ALWAYS set explicit line-height on headings (h1-h3) to prevent overlapping text when headings wrap to multiple lines
type: feedback
---

ALWAYS add explicit `line-height: 1.3` (or similar unitless value) to heading rules (h1, h2, h3) in CSS.

**Why:** Percentage-based `line-height` (like `var(--lh)` = 140%) on parent containers gets computed as a fixed pixel value (e.g., 18px × 1.4 = 25.2px) and children inherit that COMPUTED value, not the percentage. So a child `h2` with `font-size: 28px` inherits `line-height: 25.2px` — causing lines to overlap when headings wrap to multiple lines. This is a well-known CSS gotcha.

**How to apply:** When creating or modifying any heading CSS rule inside a container that uses `line-height: var(--lh)` or any percentage/em line-height, ALWAYS add an explicit unitless `line-height` value (e.g., `line-height: 1.3`). Never rely on inherited line-height for headings.
