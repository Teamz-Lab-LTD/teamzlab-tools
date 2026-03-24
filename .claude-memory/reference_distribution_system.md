---
name: 7-platform content distribution system
description: Automated backlink posting to Dev.to, Hashnode, WordPress, Blogger, Tumblr, Bluesky, Mastodon via scripts/distribute/distribute.py
type: reference
---

Content distribution system for SEO backlinks, set up 2026-03-20.

**Script:** `python3 scripts/distribute/distribute.py`
**Location:** `scripts/distribute/`
**Config:** `scripts/distribute/config.json` (gitignored)
**History:** `scripts/distribute/history.json` (tracks duplicates)

**Active platforms (7):**
1. Dev.to (DA 85+) — API key auth
2. Hashnode (DA 75+) — PAT auth
3. WordPress.com (DA 90+) — OAuth2 (token in config)
4. Blogger/Blogspot (Google-owned) — OAuth2 (token in ~/.config/teamzlab/blogger-credentials.json)
5. Tumblr (DA 90+) — OAuth1 (tokens in config)
6. Bluesky — App password auth
7. Mastodon — Access token auth

**Disabled:** Medium (API dead)

**Commands:**
- `post "Title" article.md` — post to all platforms
- `edit "slug" article.md` — edit existing posts
- `delete "slug"` — delete from platforms
- `list` — list all posts with live Dev.to stats
- `status` — quick overview
- `test` — test API connections

**Auth scripts:** `wordpress-auth.py`, `tumblr-auth.py`, `blogger-auth.py`
