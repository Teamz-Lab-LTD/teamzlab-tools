---
name: ALWAYS check for existing similar tools before building new ones
description: CRITICAL — Before building ANY new tool, search for existing tools with similar features. Propose improvements to existing tools first. Only build new if truly unique.
type: feedback
---

## Rule: Check duplicates BEFORE building, not after

When the user asks for a new tool:

1. **FIRST** search the codebase for similar tools:
   ```bash
   find . -path "*/*keyword*" -name "index.html"
   grep -rl "keyword1\|keyword2" */*/index.html
   ```

2. **PRESENT** findings to user:
   - "You already have [X] which does [Y]. I can enhance it by adding [Z]."
   - "This would be a duplicate of [existing tool]. Instead, I can improve it."
   - "This is fully new — nothing similar exists. Building it."

3. **ONLY build** if the tool is genuinely unique

**What happened:** Built eid-greeting-message-generator which was a duplicate of eid-mubarak-wishes-generator. Built eid-preparation-checklist which overlapped with eid-countdown + eid-shopping-list. Wasted time building 2 tools that had to be deleted.

**How to apply:** Every time user says "build X", run the duplicate check FIRST and present options before writing any code. This is part of the Research-First Workflow in CLAUDE.md.
