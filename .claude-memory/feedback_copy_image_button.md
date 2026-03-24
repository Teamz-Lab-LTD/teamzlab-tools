---
name: Copy Image button + toast on all image-generating tools
description: MANDATORY — every tool that generates/downloads an image MUST include a Copy Image button with window.showToast() feedback. NEVER use alert().
type: feedback
---

Every tool that generates a downloadable image (canvas-based, PNG export, etc.) MUST include a "Copy Image" button alongside the Download button.

**CRITICAL RULES:**
1. ALWAYS add the event listener — don't just add the HTML button without wiring it up
2. ALWAYS use `window.showToast()` for feedback — NEVER use `alert()`
3. ALWAYS use `window.showToast()` for share link copy feedback too
4. If using `renderChequeCanvas` or similar render function, accept a callback param so the same function can be used for both download AND copy

**Implementation pattern:**
```js
btnCopy.addEventListener('click', function() {
  canvas.toBlob(function(blob) {
    if (navigator.clipboard && navigator.clipboard.write) {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).then(function() {
        window.showToast('Image copied to clipboard!');
      }).catch(function() {
        window.showToast('Copy failed — try downloading instead.');
      });
    } else {
      window.showToast('Copy not supported — please download instead.');
    }
  }, 'image/png');
});
```

**Why:** User found Copy Image button not working because event listener was missing. Also found alert() used instead of toast. These are recurring mistakes.

**How to apply:** When building ANY tool with image generation/download:
1. Add "Copy Image" button (`btn-secondary` style)
2. Wire up the event listener with the pattern above
3. Use `window.showToast()` everywhere — never `alert()` for success/copy messages
4. For share links, pass `function(msg) { if (window.showToast) window.showToast(msg); }` as the callback
