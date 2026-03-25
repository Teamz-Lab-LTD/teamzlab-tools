---
name: Auto Build Plan — 750 Tools/Month
description: Nightly automated tool building strategy. 25 tools/night, revenue-first priority, Opus model, local-only execution.
type: project
---

## Strategy: 25 high-RPM tools per night, local execution only

**Schedule:** Every night, 3 parallel agents + cron every 3hrs
**Model:** Opus (1M context)
**Target:** 750 tools/month → $8K-15K/month revenue by month 3

## Revenue Priority Order:
1. Finance/Tax ($15-40 RPM) — Week 1-2
2. Real Estate/Mortgage ($15-35 RPM) — Week 1-2
3. Health/Medical ($8-20 RPM) — Week 2-3
4. Business/Legal ($10-25 RPM) — Week 2-3
5. Career/Salary ($5-15 RPM) — Week 3
6. Education ($5-15 RPM) — Week 3-4
7. Trending + Islamic + Lifestyle ($5-10 RPM) — Week 4+

## Content Restrictions:
- NEVER alcohol, gambling, or haram content
- Owner is Muslim — filter all keywords through this lens

## Execution:
- 3 parallel agents build tools (different batches to avoid git conflicts)
- Cron every 3hrs runs local scripts (Search Console, indexing, SEO audit)
- Each tool committed + pushed individually
- Hub pages updated after each batch

**Why local-only:** Remote agents can't run Search Console, Analytics, indexing scripts (need API tokens on local machine).

**How to apply:** Each night, check what's already built (duplicate check), pick next batch from priority list, launch 3 agents.
