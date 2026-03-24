---
name: Always check duplicates BEFORE building — AND ACT ON THE RESULTS
description: MANDATORY duplicate check before launching any build agents — search broadly, READ the results, and EXCLUDE duplicates from the build list
type: feedback
---

ALWAYS check for duplicates BEFORE building ANY new tool. Run this command first:
```bash
find . -path "*keyword*" -name "index.html" 2>/dev/null
```

**Why:** On 2026-03-21, I ran the duplicate check, SAW `/bd/hsc-gpa-calculator/` and `/bd/ssc-gpa-calculator/` in the output, and STILL told an agent to build `/student/hsc-ssc-gpa-calculator/`. The data was right in front of me and I ignored it. User had to catch it after commit+push. This is the WORST failure mode — having the data and not acting on it.

**How to apply:** Before EVERY batch of new tools:
1. Run `find` for each tool slug AND concept keywords (gpa, grade, score, etc.)
2. Run `grep` for similar tool names in hub pages
3. Check `/tools/`, `/evergreen/`, `/bd/`, and ALL category-specific hubs
4. **ACTUALLY READ the find output and cross-reference each planned tool against matches**
5. **Write out the exclusion list explicitly** — "Tool X already exists at /path/, skipping"
6. Only launch agents for truly new tools
7. For existing tools that need improvement, enhance them instead of creating duplicates
8. **NEVER assume different hubs = different tools** — `/bd/hsc-gpa-calculator/` IS the same as `/student/hsc-ssc-gpa-calculator/`
