---
name: Programmatic SEO for New Tools
description: ALWAYS consider generating location/state/region variants when building tools where data differs by location — multiplies ranking opportunities 10-50x
type: feedback
---

When building ANY new tool, always ask: "Does the data change by location?"

If YES → suggest programmatic SEO variants using `scripts/build-programmatic-seo.py`.

## When to Apply

- **Tax calculators** → state/country variants (rates differ)
- **Cost of living tools** → city variants (costs differ)
- **Stamp duty / property tax** → state/region variants (rates differ)
- **Salary calculators** → city/state variants (averages differ)
- **Rent calculators** → city variants (rents differ)
- **Legal document generators** → state variants (laws differ)
- **Benefits/welfare tools** → country variants (rules differ)

## When NOT to Apply

- BMI calculator (same formula everywhere)
- Unit converters (universal)
- Text/code tools (no location relevance)
- Image tools (no location relevance)

## How It Works

1. Build ONE base tool with the core logic
2. Run `python3 scripts/build-programmatic-seo.py [template]` to generate variants
3. Each variant targets a long-tail keyword (e.g., "income tax calculator California")
4. Long-tail = lower competition = faster ranking

## First Implementation

US income tax calculator → 51 state pages generated (50 states + DC). Each has:
- State-specific tax brackets/rates
- Combined federal + state calculation
- State-specific SEO content, FAQs, and related tools
- Proper schemas and breadcrumbs

## Available Templates

- `us-income-tax` — US state income tax calculators (51 pages)
- Add more templates as needed in the script

**Why:** One template × 50 states = 50 ranking opportunities. "income tax calculator California" is way easier to rank than "income tax calculator". Same principle applies to AU (8 states), DE (16 Bundesländer), UK (cities).

**How to apply:** Every time user asks to build a finance/tax/cost tool, check if it qualifies for programmatic SEO. If yes, suggest it proactively. Build the base tool first, then offer to generate variants.
