---
name: Never use regex CSS minifiers or switch refs without verifying files exist
description: Regex CSS minification destroyed selectors. Switching HTML refs to .min files that didn't exist on production broke the live site.
type: feedback
---

NEVER use regex-based CSS minification — it destroys selectors and breaks styling. Use proper tools only (cssnano, clean-css, or terser for JS).

NEVER switch HTML file references (CSS/JS paths) to files that don't exist on production. Always verify the target files serve HTTP 200 before changing references.

NEVER change more than one system at a time. Do one fix → test → verify → next fix.

ALWAYS visually check the rendered page in a browser, not just grep output.

**Why:** On 2026-03-26, regex CSS minifier ate `.tools-grid` and `.tool-card` rules. Then switching 1674 HTML pages to `.min.css` references while those files were 404 on production broke the entire live site (no card grid, no styling).

**How to apply:** Pre-push hook now checks all CSS/JS references point to existing files. If a file is referenced in HTML but doesn't exist locally, push is blocked.
