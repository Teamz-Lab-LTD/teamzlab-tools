---
name: Tool building mistakes to NEVER repeat
description: Critical checklist before building ANY new tool — covers duplicate checking, feature merging, hub links, git tracking, and content verification
type: feedback
---

## BEFORE Building ANY New Tool

### 1. DUPLICATE CHECK (broad search, not exact slug)
```bash
# Search for CONCEPT, not just exact slug
find . -path "*keyword1*" -name "index.html" 2>/dev/null
find . -path "*keyword2*" -name "index.html" 2>/dev/null
grep -rl "related keyword" --include="*.html" -l | head -10
```
Example: For "meme generator", search `*meme*` NOT `*meme-generator*` — catches "meme-maker" too.

**Why:** Multiple times launched 5 agents only to find 3-4 tools already existed under different names.

### 2. CHECK CONCEPT OVERLAP (not just name)
Before building "eid-preparation-checklist", check if "eid-countdown" + "eid-shopping-list" already cover the same features.

**Why:** Created eid-greeting-message-generator which was identical to eid-mubarak-wishes-generator.

### 3. NEVER make up external URLs
- Never fabricate YouTube video IDs
- Never guess Unsplash photo IDs
- Use search links (`youtube.com/results?search_query=...`) instead of direct embeds if you can't verify

**Why:** Embedded a non-existent YouTube video in car cover guide.

## AFTER Building a Tool

### 4. VERIFY git status
```bash
git ls-files --others --exclude-standard | grep "index.html"
```
Check for untracked files that will be 404 on live site.

**Why:** Zakat calculator existed locally for weeks but was never committed.

### 5. CLEAN UP hub links when deleting tools
When removing a tool, ALSO remove its link from hub pages:
```bash
grep -rl "deleted-tool-slug" --include="*.html" | head -5
```

**Why:** Deleted WiFi QR and meme tools but left broken links in tools/index.html.

## WHEN Consolidating Duplicates

### 6. ALWAYS compare features before deleting
```bash
# Compare function counts
grep -c 'function ' version-a.html
grep -c 'function ' version-b.html
# Compare unique function names
grep -o 'function [a-zA-Z]*' version-a.html | sort > /tmp/a.txt
grep -o 'function [a-zA-Z]*' version-b.html | sort > /tmp/b.txt
diff /tmp/a.txt /tmp/b.txt
```
If deleted version has unique features, MERGE them into kept version first.

**Why:** Deleted white-noise-generator that had 5 noise types + waveform visualization. Had to recover and merge after the fact.

### 7. Save deleted version before replacing
```bash
git show HEAD:path/to/file > /tmp/backup.html
```
Always recoverable, but merge BEFORE deleting, not after.

## How to Apply
Run these checks EVERY TIME before launching build agents. No exceptions. The 30 seconds of checking saves hours of cleanup.
