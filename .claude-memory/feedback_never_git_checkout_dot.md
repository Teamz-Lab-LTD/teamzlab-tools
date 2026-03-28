---
name: NEVER run git checkout -- . with uncommitted work
description: CRITICAL — git checkout -- . destroyed 8 pages of manual work. Always commit first or use git stash.
type: feedback
---

NEVER run `git checkout -- .` when there is uncommitted work in the working directory.

**Why:** During this session, I ran `git checkout -- .` to revert bad auto-fix changes, but it also destroyed 8 manually-written page improvements that hadn't been committed yet. The user had to wait while I redid all 8 pages from scratch.

**How to apply:**
1. Before ANY destructive git operation, run `git stash` first
2. Or commit the good changes first, THEN revert the bad ones with targeted `git checkout -- [specific files]`
3. NEVER use `git checkout -- .` (blanket revert) — always target specific files
4. If you need to revert auto-fix output, revert only the auto-fixed files: `git checkout -- $(git diff --name-only | grep -v "manually-changed-files")`
