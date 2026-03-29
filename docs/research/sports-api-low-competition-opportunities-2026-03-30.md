# Sports API + SEO Research

Date: 2026-03-30

## Bottom line

Do not chase generic `live scores` pages if the goal is organic traffic.

Those SERPs are usually dominated by:

- Google score widgets
- Flashscore / Sofascore / ESPN / BBC / FotMob
- league and publisher sites with much stronger authority

The stronger organic bet is:

- API-backed schedule tools
- qualification / simulator tools
- prize-money / fantasy / points calculators
- timezone converters
- matchup comparison pages

These are more usable than raw score clones and the repo's own keyword scripts already show easier competition there.

## Best current free/open sports APIs

### 1. OpenLigaDB

Official site: https://www.openligadb.de/

Why it is interesting:

- OpenLigaDB describes itself as an open database for entering and retrieving sports data.
- The official site says the web service requires no authentication.
- The site explicitly positions the API for current football and other sports results, prediction games, stats apps, Bundesliga widgets, and similar projects.

Best use:

- football fixtures
- match results
- matchday pages
- Bundesliga / Champions League style tools
- low-cost schedule widgets and match lookup tools

SEO fit:

- stronger for football schedule, kickoff-time, qualification, and simulator tools
- not a good reason to build generic live-score clones

### 2. football-data.org

Official site: https://www.football-data.org/

Important free-tier facts:

- the official pricing page says the free plan is free forever
- free plan includes 12 competitions
- free plan has delayed scores and delayed schedules
- free plan includes fixtures and league tables
- official docs say registered clients get 10 requests per minute on the free plan

Best use:

- football fixtures
- standings
- schedule pages
- countdowns
- bracket / qualification logic
- timezone conversion pages

SEO fit:

- good for evergreen football utility pages
- weaker for true real-time score pages because free live scores are not included

### 3. TheSportsDB

Official site: https://www.thesportsdb.com/api.php

Important free-tier facts:

- the official API page says TheSportsDB offers a free JSON sports API
- the pricing page lists a free plan at `$0/mo`
- free plan includes 30 requests per minute
- premium is where 2-minute live scores are offered for Soccer, NFL, NBA, MLB, and NHL

Best use:

- broad multi-sport coverage
- sports calendars
- event lookup
- team / player search
- fixture and recent-result based utility tools

SEO fit:

- useful if you want one API across football, cricket-adjacent event data, NBA, NFL, and more
- not ideal if the whole idea depends on free near-real-time scores

### 4. BALLDONTLIE

Official docs: https://docs.balldontlie.io/

Important free-tier facts:

- official docs say you can create a free account and get an API key
- NBA free tier includes Teams, Players, and Games
- the free tier is limited to 5 requests per minute
- Live Box Scores, standings, injuries, and deeper data are not in the free tier

Best use:

- NBA game pages
- NBA schedule tools
- player/team lookup
- fantasy support pages

SEO fit:

- better for NBA utility pages than for full live-score experiences
- useful if you want lightweight game and schedule data without building a huge pipeline

### 5. CollegeFootballData

Official blog/docs:

- https://blog.collegefootballdata.com/api-v2-is-now-in-general-availability/
- https://graphqldocs.collegefootballdata.com/

Important free-tier facts:

- official blog says the free tier is set at 1000 monthly calls
- official blog also says free and open data remains central to the project
- official GraphQL docs describe realtime subscriptions, but access requires the higher Patreon tier

Best use:

- college football schedules
- rankings / model pages
- matchup comparison tools
- draft / stat / trend content

SEO fit:

- a good niche if you want US sports pages outside the most saturated NBA / NFL score SERPs
- stronger for analysis and comparison tools than for raw live-score pages

## What your scripts say right now

### Cricket cluster

Command used:

`python3 scripts/build-keyword-intel.py --page "/cricket" --top 120`

Most interesting terms already showing in Search Console:

- `net run rate calculator` — volume 70, difficulty 33
- `cricket nrr` — volume 40, difficulty 35
- `how to calculate net run rate` — volume 30, difficulty 33
- `net run rate calculator t20 world cup` — position 26, difficulty 13
- `bowler economy calculator` — position 27, difficulty 13
- `strike rate calculator` — position 29, difficulty 14
- `overs to balls calculator` — position 8, difficulty 5
- `balls to overs converter` — position 10, difficulty 5

Decision:

- cricket calculators and qualification-style tools are much more realistic than live-score pages
- this is already one of the cleanest sports wedges in the repo

### Football cluster

Command used:

`python3 scripts/build-keyword-intel.py --page "/football" --top 120`

Most interesting terms already showing:

- `champions league prize money calculator` — position 8, difficulty 5
- `football player comparison all time` — position 10, difficulty 5
- `fc 25 wage calculator` — position 18, difficulty 9
- `uefa champions league group stage simulator` — position 26, difficulty 13
- `football comparison stats` — position 27, difficulty 13
- multiple formation / lineup / team-sheet queries in easy-to-medium range

Decision:

- football simulators, prize-money tools, lineup builders, and player-comparison pages are better organic bets than scores

### US fantasy football cluster

Command used:

`python3 scripts/build-keyword-intel.py --page "/us/fantasy-football" --top 120`

Most interesting terms:

- `fantasy football calculator ppr` — position 29, difficulty 14
- `fantasy football score calculator` — position 35, difficulty 17
- `nfl fantasy points calculator` — position 37, difficulty 18

Decision:

- fantasy-point and scoring-rule tools are viable
- pure NFL live-score pages are not the best bet

## Best organic opportunities from this research

### Tier 1: Build around cricket qualification + rate math

Why:

- clear script evidence already exists
- many terms are informational and tool-friendly
- competition is materially softer than live-score SERPs

Best ideas:

- T20 World Cup net run rate qualification calculator
- IPL playoff qualification calculator
- required run rate + qualification scenario calculator
- Duckworth-Lewis / DLS target explainer + calculator improvements

Best API fit:

- TheSportsDB for fixtures / event context
- your own formulas for the actual math

### Tier 2: Build around UEFA / football scenario tools

Why:

- the repo already has traction in UCL pages
- schedule, simulator, and payout queries are softer than generic score pages

Best ideas:

- UCL kickoff time converter by city/timezone
- UCL qualification scenario calculator
- league-table target calculator
- football player comparison pages with stat snapshots

Best API fit:

- OpenLigaDB for open current match / league data
- football-data.org for fixtures, schedules, league tables, competition coverage

### Tier 3: Build around fantasy and scoring-rule utilities

Why:

- fantasy users search with strong tool intent
- these SERPs are usually less dominated by giant publishers than raw score pages

Best ideas:

- PPR fantasy points calculator
- custom fantasy scoring rules calculator
- weekly matchup projection helper
- NBA / NFL fantasy points pace estimator

Best API fit:

- BALLDONTLIE for NBA games and schedule data
- football-data / OpenLigaDB are less relevant here

### Tier 4: College sports analytics wedge

Why:

- college sports data has real enthusiast demand
- fewer polished utility sites than mainstream pro live-score space

Best ideas:

- college football strength-of-schedule lookup
- playoff path / ranking scenario pages
- matchup trend compare pages

Best API fit:

- CollegeFootballData

## What not to build first

Avoid these if the goal is organic growth fast:

- generic `live score` pages
- generic team schedule pages with no unique utility
- plain standings pages
- plain player stat database pages
- score widgets with no calculator / simulator / comparison angle

## Best next build order for this repo

1. Double down on cricket

- improve the existing NRR / DLS / run-rate pages
- add one qualification-scenario tool tied to tournaments people actually search for

2. Add one API-backed football utility page

- best candidate: UCL kickoff time converter or qualification calculator

3. Expand fantasy-football scoring utilities

- this matches your existing `us/fantasy-football-calculator` page and script data

4. Only then consider limited live-data integrations

- use them as support data, not as the whole page concept

## My recommendation

If you want the highest-probability organic sports traffic path from here:

- do **not** build a generic live-scores section
- do **build** API-assisted calculators and scenario tools in:
  - cricket
  - UEFA / football competitions
  - fantasy football

If I had to pick one first:

- `cricket qualification + net run rate` wins

Reason:

- strongest overlap between your current site traction, lower competition, and tool-style search intent
