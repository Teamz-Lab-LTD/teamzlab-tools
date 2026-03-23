# SEO Blue Ocean Idea Generator — Revenue-First Research Engine

The user has provided input (keyword, URL, screenshot, or topic). Your job: find **high-traffic, low-competition, high-revenue tool ideas** for tool.teamzlab.com.

**CORE PRINCIPLE**: Start from "how does this make money?" and work backwards to keywords. Revenue per visitor matters more than raw traffic.

## User Input
$ARGUMENTS

---

## Phase 1: Understand the Input

- If it's a **keyword**: use it directly as the seed
- If it's a **URL**: use WebFetch to read the page → extract niche, audience, content gaps, and 3-5 seed keywords
- If it's a **screenshot**: analyze what's shown → extract the core topic and 3-5 seed keywords
- If it's a **topic/niche**: break it into 5-10 seed keywords covering different user intents
- If it's a **competitor site**: extract their top tools and find what they're MISSING

---

## Phase 2: Read the Growth Playbook (context for all decisions)

```bash
cd "/Users/mdgolamkibriaemon/Projects/Teamz Lab Projects/teamz-projects/teamzlab-tools"
# Read the seasonal calendar and monetization strategy — informs timing decisions
head -200 docs/research/022-growth-playbook.md
```

Check: Is there a seasonal angle for this niche RIGHT NOW? (e.g., tax season = finance tools, new year = fitness tools, summer = travel tools)

---

## Phase 3: Pull EXISTING Site Data (what's already making money?)

```bash
# 1. What keywords ALREADY bring us traffic? → Build ADJACENT tools to winners
./build-search-console.sh 2>/dev/null | head -80
# LOOK FOR: keywords with high impressions but no dedicated tool → INSTANT opportunity
# LOOK FOR: keywords where we rank #5-20 → build a better/dedicated tool to push to #1

# 1b. Search Console OPPORTUNITIES — keywords we rank for but don't have dedicated tools
./build-search-console.sh --opportunities 2>/dev/null | head -40

# 2. FULL analytics — users, top pages, traffic sources, device split, ad performance
./build-analytics.sh --all 2>/dev/null | head -80
# LOOK FOR: which pages make the most money, where traffic comes from, mobile vs desktop split

# 3. What's our current AdSense revenue by page? → Double down on high-RPM pages
./build-adsense.sh 2>/dev/null | head -30

# 4. What hubs have the most tools? What hubs are thin? → Fill thin hubs for topical authority
find . -maxdepth 2 -name "index.html" -path "*/*/index.html" | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -20

# 5. What tools are stale/outdated? → Quick wins by UPDATING existing tools (no new build needed)
./build-seo-audit.sh --freshness 2>/dev/null | head -30

# 6. Internal link health — find orphan pages and cross-linking gaps
scripts/build-internal-links.sh --quick 2>/dev/null | tail -20
```

**KEY INSIGHT**: The best ideas are ADJACENT to what's already working. If `/finance/mortgage-calculator/` gets 5K visits/mo, then `/finance/mortgage-overpayment-calculator/`, `/finance/stamp-duty-calculator/`, `/finance/home-affordability-calculator/` will rank faster because the hub already has authority.

---

## Phase 4: Run SEO Research Scripts (MANDATORY — run ALL)

```bash
# 1. Google Autocomplete — find what people ACTUALLY type
./build-seo-audit.sh --suggest "[main keyword]"
./build-seo-audit.sh --suggest "[keyword] calculator"
./build-seo-audit.sh --suggest "[keyword] tool"
./build-seo-audit.sh --suggest "[keyword] generator"
./build-seo-audit.sh --suggest "[keyword] checker"
./build-seo-audit.sh --suggest "[keyword] converter"
./build-seo-audit.sh --suggest "[keyword] online free"
./build-seo-audit.sh --suggest "best [keyword]"
./build-seo-audit.sh --suggest "[keyword] for"
./build-seo-audit.sh --suggest "free [keyword]"
./build-seo-audit.sh --suggest "[keyword] vs"
./build-seo-audit.sh --suggest "free alternative to [keyword]"

# 2. Google Trends — find rising/breakout keywords (compare to pick winners)
./build-seo-audit.sh --trends "[keyword 1]" "[keyword 2]"
./build-seo-audit.sh --trends "[keyword 3]" "[keyword 4]"

# 3. Validate ALL promising candidates — GO/CAUTION/STOP signal
./build-seo-audit.sh --validate-new "[candidate 1]"
./build-seo-audit.sh --validate-new "[candidate 2]"
./build-seo-audit.sh --validate-new "[candidate 3]"
./build-seo-audit.sh --validate-new "[candidate 4]"
./build-seo-audit.sh --validate-new "[candidate 5]"
# Validate MORE if autocomplete revealed good candidates
./build-seo-audit.sh --validate-new "[candidate 6]"
./build-seo-audit.sh --validate-new "[candidate 7]"

# 4. Check for EXISTING duplicates in our site (search BROADLY by concept, not slug)
find . -path "*keyword1*" -name "index.html" 2>/dev/null
find . -path "*keyword2*" -name "index.html" 2>/dev/null
find . -path "*related-concept*" -name "index.html" 2>/dev/null
grep -rl "related concept phrase" --include="*.html" -l | head -10

# 5. Check keyword cannibalization against existing tools
./build-seo-audit.sh --cannibalize

# 6. SEO keyword engine for deeper analysis (uses positional args, NOT flags)
python3 scripts/seo-keyword-engine.py suggest "[main keyword]" 2>/dev/null || true
python3 scripts/seo-keyword-engine.py validate-new "[main keyword]" 2>/dev/null || true

# 7. Keyword VOLUME estimation — score how much search traffic each candidate gets
# Use --volume-bulk to score ALL candidates in one shot (faster than individual calls)
./build-seo-audit.sh --volume-bulk "[candidate 1]" "[candidate 2]" "[candidate 3]" "[candidate 4]" "[candidate 5]" 2>/dev/null
# Or individual for specific deep-dives:
python3 scripts/build-keyword-volume.py "[most promising candidate]" 2>/dev/null

# 8. Virality & share readiness score — how shareable are existing tools in this niche?
./build-seo-audit.sh --viral 2>/dev/null | head -20

# 9. Product Hunt competitor research — what's been launched in this space?
./build-seo-audit.sh --ph-search "[keyword]" 2>/dev/null
./build-seo-audit.sh --ph-trending 2>/dev/null | head -20
# LOOK FOR: popular PH launches with feature gaps we can fill for FREE

# 10. Product Hunt via keyword engine (more detail)
python3 scripts/seo-keyword-engine.py ph-search "[keyword]" 2>/dev/null || true
python3 scripts/seo-keyword-engine.py ph-trending 2>/dev/null | head -20 || true

# 11. Full SEO report — hub scores, keyword placement issues, overall health
./build-seo-audit.sh --report 2>/dev/null | head -40
# LOOK FOR: which hubs score lowest → opportunities to improve + add tools

# 12. Internal link audit — find orphans and cross-link gaps
./build-seo-audit.sh --internal-links 2>/dev/null | head -20

# 13. Batch trends — compare ALL hubs at once to find trending categories
./build-seo-audit.sh --batch-trends 2>/dev/null | head -30
# LOOK FOR: hubs with rising trends → build more tools there ASAP
```

### Phase 4b: ASO Research (ONLY if user's input is about a mobile app or app keyword)
If the user's keyword relates to mobile apps, ALSO run:
```bash
./build-seo-audit.sh --aso-suggest "[keyword]"
./build-seo-audit.sh --aso-validate "[app idea]"
./build-seo-audit.sh --aso-compare "[name 1]" "[name 2]"
python3 scripts/seo-keyword-engine.py aso-suggest "[keyword]" 2>/dev/null || true
```

---

## Phase 5: Web Research — ACTUALLY Search (don't hallucinate)

**USE the WebSearch tool for ALL of these — do NOT guess or make up trends.**

### 5a. Reddit Research
Search for EACH of these queries using WebSearch:
- `site:reddit.com "[keyword] tool" OR "[keyword] calculator"`
- `site:reddit.com "I wish there was" "[keyword]"`
- `site:reddit.com "is there a free" "[keyword]"`
- `site:reddit.com "alternative to" "[keyword]"`
- `site:reddit.com r/InternetIsBeautiful [keyword]`
- Check niche subreddits: r/personalfinance, r/webdev, r/technology, r/productivity, r/smallbusiness, etc.

**GOLD signals**: "I wish there was a tool that...", "Is there a free version of...", "I can't believe there's no..."

### 5b. Competitor Tool Mining
Search using WebSearch:
- `[keyword] calculator online free`
- `[keyword] tool online`
- `best free [keyword] tool 2026`
- Check what calculator.net, omnicalculator.com, and niche competitors have
- **FIND THE GAP**: What tool do users WANT but nobody has built well?
- For competitor speed, use WebSearch to check their PageSpeed: search `pagespeed insights [competitor URL]`
- Also check OUR similar pages are fast:
  ```bash
  ./build-pagespeed.sh --url "/[hub]/[similar-tool]/" 2>/dev/null
  ```
- Our static site is inherently fast (no server, no database) — this is a competitive edge vs slow dynamic sites

### 5c. "Free Alternative" Research
Search using WebSearch:
- `free alternative to [popular paid tool in this niche]`
- `[paid tool] free version`
- These keywords convert EXTREMELY well — users are actively looking for exactly what we offer

### 5d. SERP Analysis (for top 5 keyword candidates)
Search using WebSearch for each candidate keyword:
- `[exact keyword]` — check what ranks #1-3
- **Blog post ranks #1?** → EASY WIN — a real tool beats a blog post every time
- **Ugly/old tool ranks #1?** → GOOD WIN — we win on design + mobile + speed
- **Tool with signup/paywall?** → GREAT WIN — "no signup" is our killer edge
- **Big brand (NerdWallet, Calculator.net)?** → HARD — need long-tail or unique angle
- **No good results?** → BLUE OCEAN — build immediately

### 5e. Social Trend Signals
Search using WebSearch:
- `site:twitter.com "[keyword] calculator" OR "[keyword] tool"` — viral tool screenshots
- `site:tiktok.com [keyword]` — what creators are calculating/comparing
- `site:producthunt.com [keyword]` — what's been launched recently, read comments for feature gaps
- Check current news cycle for laws, regulations, viral events → trend-jack opportunities

### 5f. "People Also Ask" Mining
Search using WebSearch:
- `[keyword]` and look at Google's "People Also Ask" boxes
- Each PAA question = potential tool idea OR FAQ content for SEO
- Questions starting with "How much", "How to calculate", "What is the best" = tool opportunities

---

## Phase 6: International & Geographic Opportunities

Check if this niche has **country-specific** angles — these often have ZERO competition:
- **UK/EU**: Different tax rates, regulations, measurements (stone/kg, miles/km)
- **Non-English markets**: We have hubs for de/fr/jp/ae/eg/sa/id/vn/no/fi/se/nl/ma — non-English tools have 10x less competition
- **Region-specific tools**: Country tax calculators, city cost-of-living comparisons, local regulation checkers
- **Localized variations**: Same tool, different defaults/units/currencies per country

If the niche has geographic angles, include country-specific tool variations in the ideas list (e.g., "UK Stamp Duty Calculator", "Germany Einkommensteuer Rechner").

---

## Phase 7: Generate Ideas

Present **10-15+ tool ideas** in this summary table:

| # | Tool Name | Target Keyword | Niche RPM | Score | Tier | Est. $/mo |
|---|-----------|---------------|-----------|-------|------|-----------|
| 1 | ... | ... | Finance ($15-30) | 9.2 | Build NOW | $200-400 |

**For EACH idea, provide ALL of these details:**

**Search & Competition:**
- **Primary keyword**: exact match (what people type into Google)
- **Long-tail keywords**: 3-5 variations this tool can ALSO rank for (each = bonus traffic)
- **Search signal**: Rising/Breakout on Trends? Autocomplete volume? PAA presence?
- **SERP difficulty**: What actually ranks #1 right now? (from Phase 5d research)
- **Competition**: How many good free tools exist? Quality score of top 3 competitors
- **"Free alternative" angle**: Does this replace a paid tool? Which one?

**Revenue & Monetization:**
- **AdSense RPM estimate**: Finance ($15-30) > Insurance ($20-40) > Legal ($15-25) > Health ($8-15) > B2B/SaaS ($10-20) > Education ($5-10) > Tech ($5-10) > Lifestyle ($3-8) > Entertainment ($1-3)
- **Affiliate pairing**: Specific program/network (e.g., "Commission Junction mortgage leads at $20-50/lead", "Amazon Associates for recommended products", "Bluehost at $65/signup")
- **Email lead gen**: Can this tool naturally offer "email me my results"? (builds mailing list)
- **Premium upsell potential**: Could a "pro" version exist? (PDF export, bulk processing, API)
- **Estimated monthly revenue**: (est. pageviews) × (RPM / 1000) — be realistic, not optimistic

**Growth & Virality:**
- **Virality score** (1-10): Would people screenshot and share results? Is there a "wow" or "shock" factor?
- **Backlink potential** (1-10): Would bloggers, journalists, or educators naturally link to this?
- **Repeat usage** (1-10): Would users bookmark and return weekly/monthly?
- **Social proof angle**: Does this generate shareable results? (e.g., "My carbon footprint is X" → share)

**Build & Launch:**
- **Build complexity**: Easy (2-4h) / Medium (4-8h) / Hard (8-16h) — client-side only
- **Seasonal timing**: Peak months? Is NOW the right time to launch?
- **Programmatic potential**: Can 1 template → 10-50 pages? (e.g., "[X] to [Y] converter" × 20 currency pairs)
- **AI enhancement**: Can Chrome AI or Transformers.js add a unique feature competitors don't have?

**AI Search Optimization:**
- **Question this tool answers**: Frame as a question (ChatGPT/Perplexity feature tools that answer questions)
- **Featured snippet potential**: Can the result format match Google's featured snippet box?

---

## Phase 8: Hub Cluster Strategy

Group related ideas into **hub clusters** — this is how you beat bigger sites:

- **Existing hub fit**: Which of our 40+ hubs do these tools belong in?
- **Thin hub opportunities**: Which hubs have <5 tools? Adding 5+ tools = instant topical authority boost
- **New hub proposal**: If 5+ ideas share a theme with no existing hub → propose a NEW hub with name, slug, and 10 tool ideas
- **Cross-link map**: Which existing tools should link TO the new ones? (run `python3 scripts/build-fix-orphans.py fix` after building)
- **Hub authority bonus**: A hub with 10+ interlinked tools ranks 2-3x faster than isolated tools scattered across hubs

**Cluster > scattered.** 5 finance tools in `/finance/` beats 5 random tools across 5 hubs.

---

## Phase 9: Rank & Score

Sort ALL ideas by this formula:
**Score = (Traffic Potential × 3) + (Low Competition × 3) + (Revenue/RPM × 2) + (Virality × 2) + (Backlink Potential × 1) + (Repeat Usage × 1) - (Build Difficulty × 1)**

Normalize to 1-10 scale. Group into tiers:
- **Build NOW** (score 8-10): High traffic + low competition + high revenue. Build TODAY.
- **Build Soon** (score 6-7.9): Good opportunity but lower urgency. Build this week.
- **Backlog** (score 4-5.9): Decent idea but lower priority. Queue for later.
- **Skip** (score <4): Not worth building. Explain why.

For EVERY idea scoring 6+, provide:
1. Exact slug and hub: e.g., `/finance/mortgage-overpayment-calculator/`
2. Meta title (max 60 chars, keyword + "Teamz Lab Tools")
3. Meta description (120-155 chars, starts with action verb + "free" + "private")
4. 5 H2 section titles for SEO content
5. Related existing tools to cross-link (from our 1135+ tools)
6. Affiliate/monetization hook with specific program name
7. Best launch platform: which subreddit, social platform, or community to post FIRST

---

## Phase 10: Revenue Projection

**Per-tool revenue estimate:**
- Formula: (estimated monthly pageviews) × (niche RPM / 1000)
- Be conservative: new tools get 500-2K visits/mo in month 1, growing to 2K-10K by month 6
- Factor in: organic search + Reddit launch spike + distribution articles + internal cross-links

**Tier revenue totals:**
- Total if ALL "Build NOW" tools are built: $X-Y/mo (month 1) → $X-Y/mo (month 6)
- Total if ALL "Build Soon" tools are built: $X-Y/mo
- Affiliate bonus: Flag tools where affiliates could 5-10x the AdSense revenue

**Hub cluster revenue:**
- If building a full hub cluster (10+ tools): estimate the HUB total, not just individual tools
- Hub authority compounds — tool #10 in a hub ranks faster than tool #1 did

---

## Phase 11: Launch Plan

For the "Build NOW" tier:

**Day 1 — Build:**
- Launch all Build NOW tools in parallel using build agents
- Each tool: HTML + JS + SEO content + FAQs + schemas + related tools

**Day 1-2 — Immediate Distribution:**
- Post the MOST viral/shareable tool to r/InternetIsBeautiful (check sub rules first)
- Submit to Product Hunt (if it's novel enough)
- Post to Hacker News "Show HN" (if it's dev/tech focused)
- Distribute articles via 7-platform system: `python3 scripts/distribute/distribute.py`

**Week 1 — Targeted Distribution:**
- Post individual tools to relevant subreddits with genuine, helpful framing
- Share on Twitter/X with screenshot of results (visual = engagement)
- Submit to niche directories, newsletters, and communities
- Request Google indexing: `python3 scripts/build-request-indexing.py`

**Week 2 — Build Next Tier:**
- Build "Build Soon" tools
- Monitor Search Console for early impression signals
- Double down on whatever gets impressions fastest

**Month 1 — Optimize:**
- Check which tools get traffic → build more tools in those hubs
- Check which tools get zero traffic → improve titles/descriptions or add more content
- Run `./build-search-console.sh` weekly to track progress

---

## Phase 12: Present to User

Present the full ranked list grouped by priority tier with revenue estimates.

Format the final output as:

### Build NOW (Score 8-10) — Est. $X-Y/mo total
[Table of tools with all details]

### Build Soon (Score 6-7.9) — Est. $X-Y/mo total
[Table of tools with all details]

### Backlog (Score 4-5.9)
[Brief list with reasons to defer]

### Skipped
[Brief list with reasons to skip]

### Recommended Build Order
[Numbered list: which tool to build first and why]

Then ask:
> "Here are your ideas ranked by revenue potential. Estimated monthly revenue if all Build NOW tools are built: $X-Y/mo (month 1) → $X-Y/mo (month 6). I can build multiple in parallel using build agents. Want me to launch all Build NOW ideas at once? Or pick specific ones?"

---

## Rules — NON-NEGOTIABLE

### What to Build
- NEVER suggest tools that need a backend — everything MUST be client-side JavaScript
- NEVER suggest tools we already have — check duplicates FIRST using broad search
- NEVER suggest low-RPM niches (jokes, memes, fun quizzes) UNLESS virality score is 9+
- ALWAYS prefer high-RPM niches: Finance > Insurance > Legal > Health > B2B > Education > Tech
- ALWAYS prefer tools with natural affiliate pairings (5-10x revenue multiplier)
- ALWAYS prefer tools with share/viral mechanics (results people screenshot)
- ALWAYS prefer tools with repeat usage (users bookmark and return)
- ALWAYS check if a "free alternative to [paid tool]" angle exists — highest conversion intent

### Research Quality
- ALWAYS use WebSearch tool for Reddit/competitor/SERP research — NEVER hallucinate trends
- ALWAYS use WebFetch to read competitor pages and URLs the user provides
- ALWAYS run ALL SEO scripts listed in Phase 4 — no shortcuts
- ALWAYS pull Search Console + Analytics data first — build adjacent to what works
- ALWAYS read the growth playbook seasonal calendar — timing matters

### Idea Diversity (minimum mix per session)
- At least 2-3 **"trend-jack"** ideas (riding current news/viral moment)
- At least 3-5 **"evergreen"** ideas (steady traffic year-round)
- At least 1 **"programmatic"** idea (1 template → 10-50 pages)
- At least 1 **"hub cluster"** idea (5+ related tools = topical authority)
- At least 1 **"free alternative"** idea (replaces a paid tool)
- At least 1 **"international"** idea (non-English or country-specific)

### Revenue & Monetization
- ALWAYS show estimated monthly revenue per tool — user decides based on money, not feelings
- ALWAYS name specific affiliate programs (not just "affiliate potential")
- ALWAYS estimate both month-1 and month-6 revenue (SEO compounds)
- ALWAYS flag tools where affiliate revenue could exceed AdSense (these are priorities)
- Revenue formula: (est. monthly pageviews) × (niche RPM / 1000) — do NOT multiply by ad slots, RPM already accounts for this

### Output Quality
- Generate **10-15 ideas minimum** per session — building is cheap, missing traffic is expensive
- Group by priority tier so user can launch Build NOW ideas immediately
- Include specific slug, meta title, meta description for EVERY Build NOW idea
- EVERY idea must have a clear "why THIS will work" that references actual research data, not vibes
