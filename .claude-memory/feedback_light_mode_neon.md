---
name: Neon accent is invisible in light mode — always use dark text
description: The neon accent (#D9FE06) blends with white backgrounds in light mode. NEVER use white text/icons on neon. ALWAYS use dark text (var(--bg) or #000) on accent backgrounds. Icons on accent must also be dark.
type: feedback
---

Neon accent (#D9FE06) is nearly invisible on white/light backgrounds.

**Why:** In light mode, the bright neon-on-white has almost zero contrast. White text or white icons on neon are completely invisible in light mode. The user explicitly flagged this as a recurring problem.

**How to apply:**
- On `background: var(--accent)` → text MUST be `color: var(--bg)` or `color: #000` — NEVER `#fff` or `white`
- Icons/SVGs on accent backgrounds → use `stroke: var(--bg)` or `fill: var(--bg)` — NEVER white
- Buttons with accent background → text and icons must be dark
- This applies to ALL elements: buttons, badges, CTAs, rating stars, footer bars, floating bars
- Test in BOTH dark and light mode before committing
- The accent color is the SAME in both themes — only the background changes
