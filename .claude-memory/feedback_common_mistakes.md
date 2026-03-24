---
name: Common mistakes to avoid on Teamz Lab Tools
description: Recurring build mistakes that frustrated the user — must be prevented in every future session
type: feedback
---

After adding new tools, I repeatedly forgot to:
1. Update homepage card counts (showed old numbers)
2. Link new tools from hub pages (tools were invisible/unreachable)
3. Rebuild search index (search returned "not found" for new tools)
4. Rebuild sitemap

**Why:** User found tools missing from navigation and search, wrong counts displayed. 55% of commits were fixing my own mistakes.

**How to apply:** After EVERY batch of tool additions:
- Run `./build.sh` (rebuilds search + sitemap + validates counts)
- Update the relevant hub index.html to include new tool links
- Update homepage card count for affected categories
- NEVER use `color: #fff` on `background: var(--accent)` — accent is neon, use `color: #000`
- NEVER hardcode hex colors — always use CSS variables
- NEVER nest cards inside cards — results display flat inside `.tool-calculator`
- ALWAYS check `CLAUDE.md` at project root before making changes
