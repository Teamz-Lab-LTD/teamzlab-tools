---
name: Never use class names that collide with central CSS
description: CRITICAL — Tools must NOT use class names that exist in shared/css/tools.css (e.g. share-btn, tool-result, ad-slot). Use tool-specific prefixes.
type: feedback
---

## Reserved CSS class names (defined in shared/css/tools.css)

These class names are used globally by the central stylesheets. NEVER use them in tool-specific inline styles:

- `.share-btn` — used by central share bar (36x36 circular icon buttons)
- `.tool-result` — used by tool engine result display
- `.tool-output` — used by utility engine output
- `.ad-slot` — used by AdSense integration
- `.btn-primary` / `.btn-secondary` — used by some shared components
- `.offline-banner` — used by offline indicator
- `.inapp-browser-banner` — used by in-app browser detection

**Why:** User found 5 tools where "Copy Prediction" / "Share My Result" buttons were invisible because their `.share-btn` class collided with the central share bar's `.share-btn` which sets `width: 36px; height: 36px; border-radius: 50%; padding: 0`.

**How to apply:** When building tools with custom buttons, use a tool-specific prefix:
- `bracket-share-btn` (UCL predictor)
- `quiz-share-btn` (health quizzes)
- `generator-copy-btn` (generators)

Never use generic class names that might exist in the shared CSS.
