---
name: Auto-save is central — never build per-tool save logic
description: localStorage auto-save runs centrally from common.js for ALL tools. Never add per-tool localStorage code unless the tool has special data (arrays, objects, canvas) that needs custom serialization.
type: feedback
---

Auto-save for form inputs is handled CENTRALLY in `/shared/js/common.js` (bottom of file). It automatically saves ALL inputs (text, number, date, select, checkbox, textarea) inside `.tool-calculator` or `.site-main` to localStorage.

**Why:** User was frustrated that tools lost data on page close. We added central auto-save covering 100% of tools.

**How to apply:**
- NEVER add per-tool localStorage save/restore for basic form inputs — it's already handled
- New tools automatically get auto-save if they use standard HTML inputs with `id` attributes
- Every input MUST have an `id` attribute — auto-save uses `id` as the storage key
- If a tool has complex data (arrays, objects, canvas drawings, dynamic lists), it MAY need custom localStorage code in addition to the central system
- The "Clear" / "Reset" button (`.tool-clear-btn` or `id*="clear"` or `id*="reset"`) automatically clears saved data
- Auto-save is SKIPPED when page has query params (shared link view)
- Storage key format: `tz_autosave_` + pathname
