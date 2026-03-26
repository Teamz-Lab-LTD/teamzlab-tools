---
name: Multi-Language Tool Building Strategy
description: MANDATORY — When building high-RPM tools, also build Spanish (/es/) and Portuguese (/pt/) versions. Language = region, not country. Spanish serves 500M+, Portuguese serves 180M+.
type: feedback
---

## Rule: Every High-RPM Tool Gets Spanish + Portuguese Versions

When building ANY new tool in these categories, ALSO build ES + PT versions:
- Finance (calculators, planners, estimators)
- Tax (any country-specific tax tool)
- Career (salary, resume, job tools)
- Legal (document generators, contract tools)
- Business (invoice, pricing, ROI tools)

**Skip ES/PT for:** pure dev tools, code formatters, English-only text tools, country-specific tools that don't apply to LatAm/Brazil.

## How to Build

1. Build the English base tool first
2. Generate Spanish version in `/es/[tool-slug]/` — write natively in Spanish, NOT machine-translated
3. Generate Portuguese version in `/pt/[tool-slug]/` — write natively in Portuguese (Brazilian PT)
4. Add hreflang tags to all 3 versions pointing to each other
5. Add to `/es/index.html` and `/pt/index.html` hub pages

## Language Priority Order (by revenue potential)

1. **Spanish** — 500M+ speakers, 20+ countries, $100 ad spend/capita (Spain) + volume from LatAm
2. **Portuguese** — 180M+ speakers, Portugal ($80/capita) + Brazil (170M users)
3. **German** — already have /de/ hub with 43 tools
4. **French** — already have /fr/ hub with 9 tools
5. **Japanese** — already have /jp/ hub with 8 tools
6. **Turkish** — 80M speakers, 0 tools built
7. **Polish** — 40M speakers, 0 tools built

## Script

Run `python3 scripts/build-multilang.py` to see which existing tools should be translated and generate them.

**Why:** One Spanish finance tool serves Spain + Mexico + Argentina + Colombia + Chile + 15 more countries. One Portuguese tool serves Portugal + Brazil (170M). This is 10x more efficient than building country-specific tools.

**How to apply:** Every time user asks to build a tool, check if it qualifies for ES/PT versions. If yes, suggest it proactively after building the English version.
