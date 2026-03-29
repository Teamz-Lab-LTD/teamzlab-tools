# Backlink Priority Batch — 2026-03-29

This batch translates the current script outputs into a manual submission queue that matches the fast-win sprint.

## Why this batch exists

- `python3 scripts/build-keyword-intel.py --opportunities` flagged six existing URLs that need external support.
- `python3 scripts/build-backlinks.py status` still shows `0/39` submitted for directory outreach.
- `scripts/distribute/history.json` already has plenty of broad directory-style posts, so the next pushes should be narrower and page-led.

## Priority 1 directories from the script

Work these first before any lower-priority directory or generic community push:

1. `sourceforge`
2. `producthunt`
3. `alternativeto`
4. `saashub`
5. `futurepedia`

`stackshare` is Priority 2 in the script, but it is still worth early attention for the developer-leaning tools in this batch.

## Recommended page angles by directory

### SourceForge

Lead with the strongest utility-first pages:
- `/design/logo-text-maker/`
- `/tools/signature-background-remover/`
- `/tools/number-typing-practice/`

Positioning:
- browser-based
- no signup
- no watermark or upload requirement where relevant

### Product Hunt

Do not launch "1900+ tools" again.

Use a focused collection angle instead:
- `Amazon Seller Calculator Pack`
  - `/amazon/acos-calculator/`
  - `/amazon/bsr-sales-calculator/`
  - `/amazon/fba-fee-calculator/`
  - `/amazon/profit-calculator/`
- Backup angle: `Bangladesh Everyday Finance Tools`
  - `/bd/loan-emi-calculator/`
  - `/bd/customs-duty-calculator/`
  - `/bd/cgpa-calculator/`

### AlternativeTo

Submit tool-by-tool, not as a generic directory.

Best matches:
- `/design/logo-text-maker/`
  Alternatives: free logo maker, Canva text-logo workflows
- `/tools/signature-background-remover/`
  Alternatives: signature cleanup / transparent PNG editors
- `/tools/number-typing-practice/`
  Alternatives: 10-key trainers, typing practice tools

### SaaSHub

Best pages:
- `/design/logo-text-maker/`
- `/tools/signature-background-remover/`
- `/amazon/acos-calculator/`

Use value framing:
- no account
- fast browser-based workflow
- specific narrow job instead of bloated suite

### Futurepedia

Only pitch pages with a credible AI or automation angle:
- `/design/logo-text-maker/` only if positioned as quick design automation
- skip if the listing would feel forced

This directory is lower fit than the others for the current batch. Do not force every page into AI-tool messaging.

### StackShare

Focus on tools with developer, operator, or workflow utility:
- `/tools/signature-background-remover/`
- `/tools/number-typing-practice/`
- `/design/logo-text-maker/`

## Page-level pitch notes

### `/design/logo-text-maker/`

Best pitch:
- free text logo maker
- transparent PNG export
- no watermark
- fast for founders, side projects, and internal tools

### `/grooming/attractiveness-quiz/`

Best pitch:
- private attractiveness test
- no photo upload
- self-improvement angle, not "rate me" bait

Use community posts more than directories here.

### `/health/36-questions-to-fall-in-love/`

Best pitch:
- Arthur Aron question list
- date-night / closeness tool
- structured conversation format with timer

Better fit for niche article distribution and social/community posts than software directories.

### `/tools/signature-background-remover/`

Best pitch:
- remove background from signature
- transparent PNG
- no upload
- useful for forms, PDFs, and document workflows

### `/student/gpa-to-percentage/`

Best pitch:
- convert GPA to percentage
- useful for job applications, admissions, and scholarship forms

Better fit for education/career articles and community answers than generic startup directories.

### `/tools/number-typing-practice/`

Best pitch:
- 10-key practice
- data-entry and cashier training
- browser-based drills using numbers, dates, and currency

## Content assets aligned to this batch

Use these article files for the first off-page push:
- `scripts/distribute/articles/bangladesh-tools.md`
- `scripts/distribute/articles/amazon-seller-tools-2026.md`
- `scripts/distribute/articles/career-resume-tools.md`
- `scripts/distribute/articles/free-logo-design-tools.md`
- `scripts/distribute/articles/signature-tools-collection.md`

Support articles are also in place for:
- `scripts/distribute/articles/health-wellness-tools.md`
- `scripts/distribute/articles/mens-health-fitness-tools.md`

## What not to do in this batch

- Do not submit the homepage as the primary destination everywhere.
- Do not use another broad "all tools" angle.
- Do not mark any directory as submitted in `scripts/backlinks-history.json` until the real external submission is done.
