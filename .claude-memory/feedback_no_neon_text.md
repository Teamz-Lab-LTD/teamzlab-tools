---
name: Never use neon accent as text color
description: NEVER use var(--accent) as text color — neon on white/light background is unreadable. Use var(--heading) instead.
type: feedback
---

NEVER use `color: var(--accent)` for text content (scores, values, labels, headings). Neon/bright accent on white/light background has terrible contrast and is unreadable.

**Why:** The accent color is neon green/yellow — it's designed for backgrounds (buttons, badges, progress bars) NOT for text. The user has flagged this multiple times as a recurring mistake.

**How to apply:**
- For score values, totals, highlights: use `color: var(--heading)` NOT `color: var(--accent)`
- `var(--accent)` is OK for: `background`, `border-color`, `accent-color`, `box-shadow`
- `var(--accent)` is NOT OK for: `color` on any text element
- The only exception: text ON an accent background should use `color: var(--bg)` or `color: #000`
- When building new tools, grep for `color: var(--accent)` and replace with `color: var(--heading)`
