---
name: Result card padding and font-size fix
description: CRITICAL — All result cards must have proper padding and clamped font sizes. Fixed centrally by overriding design tokens inside .tool-calculator.
type: feedback
---

Result cards across ALL tools had overflowing text because design tokens --text-xl (48px) and --text-2xl (56px) are too big for card values.

**Why:** Tools use `font-size: var(--text-xl)` on card values like "$28,111,166" — at 48px this overflows narrow cards.

**How to apply:** Fixed centrally in tools.css by scoping responsive token overrides inside `.tool-calculator`, `.tool-result`, `.results-section`:
- `--text-xl` → `clamp(1.25rem, 4vw, 1.75rem)` (was 48px)
- `--text-2xl` → `clamp(1.5rem, 5vw, 2rem)` (was 56px)
- All children get `overflow-wrap: break-word; max-width: 100%`

**Rule for future tools:** NEVER use `--text-xl` or `--text-2xl` for result card values. Use `--text-h3` to `--text-h5` or `clamp()` directly. The central override handles existing tools but new tools should use proper sizes from the start.
