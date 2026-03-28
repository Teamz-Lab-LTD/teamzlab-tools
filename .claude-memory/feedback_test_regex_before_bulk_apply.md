---
name: Always test regex/template output on 3-5 samples before bulk apply
description: CRITICAL — Verify auto-generated content reads correctly on sample pages before applying to hundreds of files.
type: feedback
---

Before running any bulk auto-fix script with --apply, ALWAYS test on 3-5 sample pages first.

**Why:** The first meta description auto-fixer produced "Simulate upload an image..." — grammatically broken. It was applied to 186 pages before I noticed. Had to revert everything (which also destroyed manual work — see feedback_never_git_checkout_dot.md).

**How to apply:**
1. Run `--dry-run` first to see counts
2. Pick 3-5 diverse sample pages (different tool types, languages, hubs)
3. Run the fix function on those samples and PRINT the output
4. Read the generated text — does it make grammatical sense?
5. Only then run `--apply`
6. After applying, spot-check 2-3 random files with `git diff`
