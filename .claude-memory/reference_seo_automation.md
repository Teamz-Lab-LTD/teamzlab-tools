---
name: SEO Automation Suite
description: Full Ubersuggest replacement — 8 scripts with auto catch-up, cron jobs, and macOS notifications
type: reference
---

## Complete SEO Script Suite (replaces Ubersuggest)

All scripts are in `scripts/` and symlinked at project root.

### Daily Scripts
- `build-rank-tracker.py` — Records keyword positions daily, tracks trends, movers, watchlist
- `build-catchup.sh` — Smart catch-up that auto-detects what's stale and runs only what's needed

### Weekly Scripts
- `build-keyword-intel.py` — Keyword research: volume, intent, CPC, difficulty, opportunities
- `build-backlinks.py` — 39 directory submissions tracker (G2, Capterra, Product Hunt, etc.)
- `build-backlinks-overview.py` — Backlinks overview: who links to you, DoFollow/NoFollow
- `build-content-ideas.py` — Content ideas: trending, seasonal, gaps, competitor analysis

### Monthly Scripts
- `build-seo-dashboard.sh` — Full SEO dashboard combining Search Console + GA4 + PageSpeed

### Automation
- `build-daily-seo-notify.sh` — Runs scripts + sends macOS notification + writes summary
- `build-catchup.sh` — Called by health check, auto-catches up after any absence
- System crontab installed: daily 11:15 AM, weekly Mon 11:30 AM, monthly 1st noon
- Latest report saved to `scripts/seo-latest-report.txt` — shown in health check

### Health Check Flow (every conversation)
1. `build-validate-freshness.sh` — checks stale content
2. `build-catchup.sh` — catches up missed SEO tasks
3. `build.sh` — validates search/sitemap/counts

**How to apply:** At conversation start, run all 3 scripts. The catch-up script handles everything automatically — even if user was away for months.
