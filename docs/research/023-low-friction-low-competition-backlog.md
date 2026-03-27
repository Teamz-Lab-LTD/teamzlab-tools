# Low-Friction, Lower-Competition Backlog

*Date: 2026-03-27*

## Goal

Prioritize tools that match all three:

- Easy for users to finish in under 30 seconds
- Strong exact-intent SEO with lower competition than broad calculators
- Good fit for existing Teamz Lab scripts and country-hub structure

This backlog is intentionally narrower than the general tool backlog. It favors local checkers, threshold tools, and regulation-driven planners over broad evergreen battles.

## How This Was Ranked

The shortlist combines:

- Repo review of hubs, shared engines, and automation scripts
- `seo-keyword-engine.py validate-new`
- `build-keyword-volume.py`
- Existing cannibalization checks from your SEO engine
- Implementation leverage from existing country hubs and similar live tools

## Main Pattern

Best-fit ideas for this repo are:

- Local rule and eligibility checkers
- Country-specific threshold calculators
- Regulation-driven planners
- Narrow employer or housing finance tools

Lower-priority ideas for now are:

- Broad generic calculators already crowded in search
- Tools overlapping too heavily with existing evergreen pages
- Ideas with weak autocomplete and no local differentiation

## Ranked Shortlist

### 1. TDSR Calculator Singapore

- **Hub:** `/sg/`
- **Why it fits:** Very short workflow, clear outcome, exact local intent, and only light cannibalization from existing SG coverage.
- **User flow:** Income + debt + loan amount + tenure -> immediate pass/fail + ratio
- **Validation:**
  - `validate-new`: `55/100`, recommendation `CAUTION`
  - `volume`: `75/100 HIGH`
- **Notes:** Best candidate in this batch. Build with strong SG-specific copy, not as a generic mortgage calculator.
- **Suggested angle:** Include TDSR, rough affordability, and what counts as debt in Singapore.

### 2. Medicare Levy Surcharge Calculator Australia

- **Hub:** `/au/`
- **Why it fits:** Exact policy-driven intent, simple inputs, strong differentiation, and zero cannibalization in script output.
- **User flow:** Income + filing status + private hospital cover status -> surcharge estimate
- **Validation:**
  - `validate-new`: `65/100`, recommendation `CAUTION`
  - `volume`: `29/100 LOW`
- **Notes:** Volume is not huge, but this is the kind of high-intent, underbuilt local finance page that can still work well.
- **Suggested angle:** Lead with thresholds and “Do I need hospital cover to avoid MLS?” style language.

### 3. KiwiSaver Employer Contribution Calculator

- **Hub:** `/nz/`
- **Why it fits:** Easy extension of your existing `/nz/kiwisaver-calculator/`, narrow intent, low implementation cost, and a clear NZ cluster play.
- **User flow:** Salary + employee contribution rate + employer rate -> employer contribution, ESCT effect, take-home impact
- **Validation:**
  - `validate-new`: `55/100`, recommendation `CAUTION`
  - `volume`: `48/100 MEDIUM`
- **Notes:** Strong follow-up tool because it compounds topical authority for the tiny `/nz/` hub.
- **Suggested angle:** Emphasize employer match, ESCT, and annual total contribution.

### 4. HDB Affordability Calculator Singapore

- **Hub:** `/sg/`
- **Why it fits:** Clear user demand signal from autocomplete and strong alignment with underdeveloped SG housing coverage.
- **User flow:** Income + down payment + interest + tenure -> estimated HDB affordability
- **Validation:**
  - `validate-new`: `40/100`, recommendation `STOP`
  - `volume`: `55/100 MEDIUM`
- **Why still listed:** Search demand is materially better than the viability score suggests. The main problem is overlap with broad affordability tools, so this only works if it is explicitly HDB-first.
- **Suggested angle:** Position it as HDB affordability plus loan estimate, not another generic home affordability page.

### 5. Rent Pressure Zone Checker Ireland

- **Hub:** `/ie/`
- **Why it fits:** Extremely easy user experience and exact local intent. Strong “checker” format, which suits your site.
- **User flow:** Address / county / area selection -> RPZ yes/no + next step guidance
- **Validation:**
  - `validate-new`: `55/100`, recommendation `CAUTION`
  - `volume`: `6/100 VERY LOW`
- **Notes:** This is a strategic SEO wedge more than a traffic bet. Good if paired with an RPZ explainer and rent increase content.
- **Suggested angle:** Add map/list-style content because autocomplete leans that way.

### 6. Employee Cost Calculator UK

- **Hub:** `/uk/`
- **Why it fits:** Strong autocomplete signal and strong commercial intent.
- **User flow:** Salary + pension % + benefits + employer assumptions -> full employer cost
- **Validation:**
  - `validate-new`: `40/100`, recommendation `STOP`
  - `volume`: `55/100 MEDIUM`
- **Why not higher:** Very heavy cannibalization because the repo already has several “cost” and employee-related tools.
- **Suggested angle:** Only build if you make it explicitly UK-employer specific with NI, pension, apprenticeship levy, and overhead assumptions.

### 7. Rent Tax Credit Calculator Ireland

- **Hub:** `/ie/`
- **Why it fits:** Local tax intent, easy UX, and policy-led search behavior.
- **User flow:** Filing status + annual rent + eligibility flags -> estimated credit
- **Validation:**
  - `validate-new`: `40/100`, recommendation `STOP`
  - `volume`: `37/100 LOW`
- **Why not higher:** The script sees this as too close to existing IE tax pages.
- **Suggested angle:** If built, keep it narrowly about the credit, not a general renter tax page.

## Build Next

If building only three tools next, use this order:

1. `TDSR Calculator Singapore`
2. `Medicare Levy Surcharge Calculator Australia`
3. `KiwiSaver Employer Contribution Calculator`

This mix is better than chasing another broad evergreen calculator because it gives:

- one strong SG foothold
- one strong AU policy page
- one low-cost NZ cluster expansion

## Skip For Now

These validated poorly and should not be next:

- `Class 4 National Insurance Calculator UK`
- `CPF Salary Ceiling Calculator Singapore`
- `Bright Line Tax Calculator New Zealand`
- `Employment Pass Salary Checker Singapore`
- `RPZ Rent Increase Calculator Ireland`
- `Rent Increase Calculator Singapore`

## Recommended Tool Shapes

Use these page shapes for the next batch:

- **Checker:** yes/no answer + what to do next
- **Threshold calculator:** ratio/limit + explanation of the threshold
- **Planner:** dates, reminders, and contribution schedule
- **Impact calculator:** before/after cost under local rules

Avoid long multi-step flows unless the keyword absolutely demands it.

## Script Workflow Per Idea

For every shortlisted tool:

1. Validate
   - `bash scripts/build-seo-audit.sh --validate-new "<keyword>"`
   - `python3 scripts/build-keyword-volume.py "<keyword>"`
2. Check overlap
   - `bash scripts/build-seo-audit.sh --cannibalize`
3. Build page in the country hub
4. Rebuild artifacts
   - `bash scripts/build.sh`
5. Fix linking
   - `bash scripts/build-internal-links.sh --quick`
   - `python3 scripts/build-fix-orphans.py`
6. Push indexing
   - `python3 scripts/build-request-indexing.py --url "https://tool.teamzlab.com/<hub>/<slug>/"`
7. Review performance
   - `bash scripts/build-search-console.sh --opportunities`

## Product Rules For This Backlog

- Prefer tools with 1-4 inputs
- Prefer country hubs with low page count and strong policy specificity
- Prefer pages that can win on exact phrasing instead of broad authority
- Prefer ideas that can become a mini-cluster of 2-4 related pages
- Add shareable output only after the core answer is instant and clear

## Immediate Follow-Up

After the top three ship, the next best move is not another random tool. It is to build cluster depth:

- **Singapore cluster:** `tdsr`, `hdb affordability`, then a related loan/grant checker
- **Australia cluster:** `medicare levy surcharge`, then related threshold/buffer tools
- **New Zealand cluster:** `kiwisaver employer contribution`, then another KiwiSaver split or tax-adjacent contribution page
