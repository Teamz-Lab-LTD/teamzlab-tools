---
name: Run auto-fix scripts on ALL pages, not just report numbers
description: CRITICAL — When scripts report issues (missing H2, low FAQs, low content), FIX them immediately using build-seo-fix-all.py. Never just report counts.
type: feedback
---

When build.sh or build-seo-fix-all.py reports issues like "1,203 pages missing How Works H2" — the NEXT step is to FIX them, not tell the user "these need future work."

**Why:** User expected all 1,829 pages to be fixed when I said I was fixing SEO issues. I only fixed 8 manually and reported the rest as "planned." The script existed to fix them all but I didn't run it with --apply.

**How to apply:**
1. After ANY build.sh run, check step 9b output
2. If build-seo-fix-all.py shows fixable issues > 0, run `python3 scripts/build-seo-fix-all.py --apply`
3. ALL 7 auto-fixers should run: display bug, How Works H2, FAQs, content expansion
4. Only report "remaining" for things the script genuinely CAN'T fix
5. NEVER say "planned for future" when a script can fix it NOW
