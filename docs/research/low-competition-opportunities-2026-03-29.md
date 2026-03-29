# Low-Competition SEO Opportunities

Date: 2026-03-29
Source scripts run:
- `python3 scripts/build-content-ideas.py --trending`
- `python3 scripts/build-content-ideas.py --gaps`
- `python3 scripts/build-content-ideas.py --seasonal`
- `python3 scripts/build-keyword-intel.py --opportunities`
- `python3 scripts/build-rank-tracker.py report`
- `python3 scripts/build-backlinks.py status`

## Summary

The current best low-competition opportunities are mostly existing URLs that already rank beyond page 5 with moderate keyword difficulty. The scripts do not justify broad new content creation right now. They do justify:

1. tightening on-page match for existing low-volume terms
2. reinforcing those pages from relevant hub pages
3. moving immediately into a backlink-first execution batch

## Implemented In This Sprint

These pages were updated to better match the exact query patterns surfaced by the scripts:

- `/3d/model-viewer/` for `3d model viewer`
- `/evergreen/529-plan-calculator/` for `529 calculator`
- `/evergreen/cups-to-ml/` for `1 1 4 cups to ml`, `1 1 4 cup to ml`, and `1 1 4 cup milk in ml`
- `/math/ratio-calculator/` for `4 to 3 ratio calculator`, `2 3 ratio calculator`, and `3 2 ratio calculator`
- `/military/military-time-converter/` for `5 pm military` and `17 in military time`
- `/us/income-tax-calculator/` for `2026 tax refund estimator`

Supporting hub-card copy was also tightened on:

- `/3d/`
- `/evergreen/`
- `/math/`
- `/military/`
- `/us/`

## Script Findings

### Trending

Highest-signal seasonal idea:

- `free online tax calculator 2026` (P1)

### Seasonal

Current seasonal priorities:

- March: `tax filing tools` (P1)
- April: `tax deadline calculator` (P1)

### Gaps

The gap script only found weak/P3 gaps, so new page creation is currently lower priority than improving existing assets.

### Quick-Win Existing URLs

From `build-keyword-intel.py --opportunities`:

- `/design/logo-text-maker/` for `text logo maker`
- `/grooming/attractiveness-quiz/` for `attractiveness test`
- `/health/36-questions-to-fall-in-love/` for `36 questions to fall in love`
- `/tools/signature-background-remover/` for `remove background from signature`
- `/3d/model-viewer/` for `3d model viewer`
- `/evergreen/529-plan-calculator/` for `529 calculator`
- `/evergreen/cups-to-ml/` for `1 1 4 cups to ml`
- `/tools/number-typing-practice/` for `typing test numbers`
- `/student/gpa-to-percentage/` for `2.0 gpa in percentage`
- `/military/military-time-converter/` for `5 pm military`
- `/us/income-tax-calculator/` for `2026 tax refund estimator`
- `/math/ratio-calculator/` for `4 to 3 ratio calculator`

## Next Backlink-First Queue

`python3 scripts/build-backlinks.py status` still shows:

- Submitted: `0/39`
- Priority 1 pending: `14`

Highest-value next actions:

- SourceForge
- Product Hunt
- AlternativeTo
- SaaSHub
- StackShare
- Futurepedia
- Hacker News
- Trustpilot

## Decision

For the next sprint, do not build broad new tools. Keep working this stack:

1. strengthen existing low-competition pages with exact-match copy and better internal links
2. execute Priority 1 backlink submissions
3. re-check the same scripts after 7 days of rank history before another on-page rewrite
