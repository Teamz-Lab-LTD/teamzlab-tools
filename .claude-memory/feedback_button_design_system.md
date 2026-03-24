---
name: Buttons must ONLY use design system patterns — no custom colors
description: NEVER create custom button colors (green save, red delete, neon text). All buttons must use only two patterns from the design system. User flagged this multiple times.
type: feedback
---

Buttons must use ONLY these two patterns:

**Primary button:** `background: var(--heading); color: var(--bg);`
**Secondary/outline button:** `background: var(--surface); color: var(--heading); border: 1px solid var(--border);`

**Why:** The user explicitly flagged that custom button colors (green for save, red for delete, neon for primary) break the design system and look wrong in light mode. The neon accent (#D9FE06) should NEVER be used as button background for action buttons — it's for accents only (rating stars, hover highlights, accent bars).

**How to apply:**
- "Save", "New", "Submit", "Calculate" → Primary pattern (heading bg)
- "Load", "Delete", "Cancel", "Copy", "Download" → Secondary pattern (surface bg, border)
- NEVER use: `background: var(--accent)` for action buttons
- NEVER use: custom colors like green (#22c55e), red (#ef4444), yellow for buttons
- NEVER use: `color: var(--accent)` for button text
- The `btn-add-row` ("+Add") is the only exception — small inline accent button is ok
- Hover state: `opacity: 0.85` — nothing else needed
