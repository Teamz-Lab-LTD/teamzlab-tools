---
name: feedback_ai_in_all_tools
description: Always integrate TeamzAI (Chrome AI + fallback) in every tool where AI adds value — text generation, analysis, suggestions. Skip for pure data/formatting tools.
type: feedback
---

Always integrate /shared/js/ai-engine.js (TeamzAI) in every new tool where AI can add value to the user experience — text generation, analysis, creative suggestions, recommendations.

**Why:** User explicitly wants AI integration wherever it makes sense. AI gives users extra value. The 3-tier fallback (Chrome AI → Transformers.js → rule-based) ensures all browsers work.

**How to apply:**
- Tools that SHOULD use AI: generators (titles, abstracts, outlines, descriptions, summaries, suggestions), analyzers, recommenders
- Tools that should NOT use AI: pure calculators, formatters, converters, data lookup tools, image tools
- Always add ai-notice + ai-fallback divs for transparency
- Always keep rule-based logic as fallback — never make a tool AI-only
- Apply to both new tools AND existing tools when revisiting them
