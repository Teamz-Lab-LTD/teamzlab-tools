---
name: Always use shared AI engine for AI tools
description: MANDATORY — any tool using Chrome AI or Transformers.js MUST use /shared/js/ai-engine.js. Never inline AI code.
type: feedback
---

ALWAYS use `/shared/js/ai-engine.js` (TeamzAI) when building ANY AI-powered tool. Never write inline Chrome AI detection or Transformers.js imports.

**Why:** User explicitly requested centralized AI management so models are cached in IndexedDB and shared across tools. If a user downloads flan-t5-base for the quote generator, the sensitivity converter (or any future AI tool) reuses it instantly — no re-download. Also ensures consistent UX across all AI tools.

**How to apply:**
- Add `<script src="/shared/js/ai-engine.js"></script>` before inline JS
- Use `TeamzAI.generate()` for 3-tier fallback (Chrome AI → Transformers.js → curated)
- Use `TeamzAI.getPipeline()` for direct pipeline access
- Use `TeamzAI.chromeAI.*` for detection
- See CLAUDE.md Rule 12 for full usage pattern and examples
- Models in use: Xenova/flan-t5-base (text2text), Xenova/distilbart-cnn-6-6 (summarization)
