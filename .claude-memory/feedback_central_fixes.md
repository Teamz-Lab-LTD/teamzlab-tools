---
name: Always fix issues centrally via build scripts, not individually
description: CRITICAL — when fixing recurring issues, add validation to build.sh/pre-commit/build-static-schema.py instead of patching files one by one.
type: feedback
---

When fixing ANY recurring issue across multiple files, ALWAYS add the fix/check to the build system centrally instead of patching individual files.

**Why:** User explicitly said "if u fix anything try to do it fix centrally as in future we can do maintain easily". Patching files one by one is unsustainable at 945+ tools and the same mistake will recur in future tools.

**How to apply:**
- **Detection** → Add warning to `.git/hooks/pre-commit` (catches issues before commit)
- **Auto-fix** → Add to `build-static-schema.py` or `build.sh` (fixes automatically on every build)
- **Validation** → Add to `build.sh` (reports in build output)

**Examples already implemented:**
- Missing twitter tags → auto-injected by `build-static-schema.py`
- Missing card wrapper in hub pages → validated by `build.sh` step 3b + pre-commit hook
- Missing schemas → extracted and injected by `build-static-schema.py`

**Mindset:** Fix the SYSTEM, not the SYMPTOM. If an issue can happen once, it can happen again. Automate the fix.
