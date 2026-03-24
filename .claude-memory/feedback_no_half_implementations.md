---
name: Never do half implementations — wire up everything end-to-end
description: CRITICAL — When adding buttons/features, ALWAYS wire up event listeners, pass ALL data fields to ALL functions (render, download, copy, share), and use window.showToast() not alert().
type: feedback
---

## Rules to prevent recurring mistakes:

### 1. NEVER add HTML buttons without event listeners
When adding a button to HTML (e.g. "Copy Image"), ALWAYS add the corresponding `addEventListener` in JS. The user found a Copy Image button with zero JS wiring.

### 2. ALWAYS pass ALL data fields through the entire chain
When adding a new field (like `bank`), it must be added to ALL of these:
- Form data collection (renderPreview, getPreviewData)
- Cheque book storage (chequeData object)
- HTML rendering (buildChequeHTML)
- Canvas rendering (renderChequeCanvas)
- Share link encoding (copyShareLink params)
- Share link decoding (shareDecode handler)
- Download function data

**Checklist when adding a new field:** Form → Preview → Book → HTML → Canvas → Share → Decode → Download

### 3. ALWAYS use window.showToast() — NEVER alert()
`window.showToast()` is the global toast function from common.js. Use it for ALL feedback:
- Copy success/failure
- Share link copied
- Image copied
- Any user feedback message

### 4. Share link URL param pollution
Messaging apps (WhatsApp, Messenger) append share text to the last URL param. The central fix in `shareDecode` strips trailing text from enum keys (style, bank, currency, etc.). When adding new enum-type params, add them to the `enumKeys` array in `shareDecode`.

### 5. Canvas render functions should accept callbacks
Any function that renders to canvas (e.g. `renderChequeCanvas`) should accept an optional `onCanvas` callback. If provided, pass the canvas to it (for Copy Image). If not, do the default action (download). This avoids duplicating canvas rendering code.

**Why:** User caught multiple half-implementations in the same session — button without listener, data field not passed to canvas, alert instead of toast, share link corrupting bank param. These are all symptoms of not thinking end-to-end.

**How to apply:** Before marking any feature as done, mentally trace the data flow from input → render → export → share → decode. Every step must have the new field/feature wired up.
