---
name: Mandatory Usability QA Before Ship
description: CRITICAL: Every tool must pass runtime usability testing before declaring done — display toggle bugs, clipboard .catch(), button re-enable in finally{}, Array.from() for Unicode, html2canvas white bg, all dropdown tones implemented, clear resets selects.
type: feedback
---

MANDATORY: Run full usability QA on every new tool before declaring it done. Trace every user click path.

**Why:** Multiple runtime bugs shipped in March 2026 batch — CSS display:none toggle bug (birthday-countdown), clipboard silent failures, stuck disabled buttons, broken Unicode Squared fonts (.split vs Array.from), transparent PNG downloads, missing tone implementations, incomplete clear buttons.

**How to apply:**
1. After building any tool, mentally trace EVERY button click → what happens → error paths
2. **CSS display toggle: NEVER use `style.display = ''` to show elements whose CSS class has `display:none`.** Use explicit values: `'block'`, `'flex'`, `'grid'`, etc. Setting `display = ''` only removes the inline style — it does NOT override the CSS class rule. This is the #1 pattern bug to watch for.
3. Every `navigator.clipboard` call needs `.catch()` with `showToast()`
4. Every `btn.disabled = true` needs re-enable in `finally{}` block, not after try/catch
5. Unicode above U+FFFF: use `Array.from()` not `.split('')`
6. `html2canvas`: use `backgroundColor: '#ffffff'` not `null`
7. Every dropdown option in HTML must have matching logic in JS (no no-op options)
8. Clear buttons must reset `<select>` elements too (`.selectedIndex = 0`)
9. Date inputs must be formatted for human display
10. AI tools: all 3 tiers (Chrome AI → Transformers.js → rules) must produce real output
11. See CLAUDE.md Rule 24 for full checklist
