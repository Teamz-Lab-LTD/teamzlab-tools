---
name: Search concept synonyms for duplicates
description: When checking for duplicates, search ALL synonyms of the concept, not just the exact keyword slug
type: feedback
---

When running duplicate checks before building, search ALL concept synonyms, not just the exact Ubersuggest keyword.

**Why:** Built "css-shadow-generator" when "box-shadow-generator" already existed in both /dev/ and /uidesign/. The slug search for "*css*shadow*" missed it because the existing tools used "box-shadow" not "css-shadow." The concept is the same tool.

**How to apply:** For every keyword, brainstorm 3-5 synonym slugs before searching:
- "css shadow generator" → also search: *box-shadow*, *shadow-gen*, *shadow-maker*, *shadow-tool*
- "gross up payroll" → also search: *gross-up*, *payroll-calc*, *salary-gross*
- "photo booth" → also search: *photo-booth*, *camera-booth*, *selfie-booth*

The build agents should also run `find . -path "*[core-concept]*" -name "index.html"` with multiple synonym patterns before writing any files.
