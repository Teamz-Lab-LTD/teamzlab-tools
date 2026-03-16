# Growth Playbook — Trend Research & Monetization Strategy

**Date:** 2026-03-17
**Influences:** Marc Lou (ship fast, monetize day 1), Adam Lyttle (portfolio model, trend-jacking, ASO/SEO niche targeting)

---

## Core Philosophy

Every tool is a micro-product targeting a keyword niche. We don't build tools nobody searches for. We research first, build fast, monetize immediately.

> "A portfolio of small winners beats chasing one big hit." — Adam Lyttle ($800K+ from 50 simple apps)

> "Ship fast, monetize from day 1." — Marc Lou

---

## MANDATORY: Pre-Build Research Workflow

**Before building ANY new tool, complete these steps:**

### Step 1: Trend Research
1. **Google Trends** — Search relevant categories for rising/breakout keywords
2. **Reddit** — Check these subreddits for trending needs:
   - r/InternetIsBeautiful, r/webdev, r/SideProject (tool discovery)
   - r/personalfinance, r/UKPersonalFinance, r/AusFinance (finance tools)
   - r/technology, r/programming (dev tools)
   - r/Cricket, r/soccer, r/football (sports tools)
   - r/india, r/australia, r/unitedkingdom (geo-targeted tools)
   - Niche subreddits relevant to the tool category
3. **News cycle** — New laws, tax changes, regulations, viral events, product launches
4. **Seasonal calendar** — See "Seasonal Playbook" section below
5. **Competitor gaps** — Search for existing free tools in the niche. If competitors are ugly, slow, or require sign-up, we win.

### Step 2: Validate the Keyword
- Does it have search volume? (Google Trends rising = yes)
- Is there a free tool for this already? (If yes, can we do it better/simpler/more private?)
- Will this attract a monetizable audience? (Finance > jokes)
- Can we build it client-side with no backend? (Must be yes)

### Step 3: Check for Duplicates
```bash
find . -path "*/<proposed-slug>/index.html" 2>/dev/null
grep -ri "<proposed tool name>" --include="*.html" -l | head -5
```
If similar tool exists, ENHANCE it instead of creating a duplicate.

### Step 4: Build & Ship
- Build in hours, not days (Adam Lyttle speed)
- Follow existing page template (Rule 7 in CLAUDE.md)
- Target exact-match keyword in title, H1, meta description
- Add to hub page, rebuild search + sitemap

---

## Monetization Strategy (implement these)

### Tier 1: Passive Revenue (set up once, earns forever)
| Channel | Status | Action |
|---------|--------|--------|
| Google AdSense | NOT SET UP | Add to all 692+ pages |
| Affiliate links (finance tools) | NOT SET UP | TurboTax, H&R Block, QuickBooks on tax/finance tools |
| Affiliate links (VPN tools) | NOT SET UP | NordVPN, Surfshark on VPN/privacy tools |
| Affiliate links (image/design) | NOT SET UP | Canva Pro, Adobe on image/design tools |
| Affiliate links (dev tools) | NOT SET UP | Relevant SaaS on dev tools |

### Tier 2: Lead Generation (already started)
| Channel | Status | Action |
|---------|--------|--------|
| Footer CTA → teamzlab.com/contact | DONE (2026-03-17) | "Share Feedback" + "Get in Touch" cards |
| High-ticket lead magnet tools | PLANNED | See docs/research/011-high-ticket-lead-strategy.md |

### Tier 3: Audience Building (not started)
| Channel | Status | Action |
|---------|--------|--------|
| Newsletter (Beehiiv/Kit) | NOT SET UP | Embedded form on all pages |
| Twitter/X build-in-public | NOT SET UP | Share tool launches, traffic screenshots |
| YouTube | NOT SET UP | "I built 700 free tools" content |
| Product Hunt launches | NOT SET UP | Launch tool collections |
| Reddit sharing | NOT SET UP | Share on r/InternetIsBeautiful etc. |

### Tier 4: Premium (future)
| Channel | Status | Action |
|---------|--------|--------|
| "Pro" tier (no ads, PDF export, history) | NOT SET UP | Future |
| Embeddable widgets for other sites | NOT SET UP | Future |
| API access for developers | NOT SET UP | Future |

---

## Seasonal Playbook (trend-jack these every year)

| Month | Trending Topics | Tool Ideas |
|-------|----------------|------------|
| January | New Year resolutions, US tax season starts, fitness | Goal planners, tax estimators, fitness calculators |
| February | Valentine's Day, budget resets | Gift budget calculators, date planners |
| March-April | Ramadan (varies), UK/AU tax year end, spring cleaning | Ramadan tools, tax deadline tools, declutter calculators |
| April | US tax deadline (Apr 15), Earth Day | Tax filing tools, carbon footprint calculators |
| May | Mother's Day, graduation season | Gift budgets, student loan calculators |
| June | Summer planning, mid-year reviews | Travel cost planners, half-year budget reviews |
| July | Back-to-school prep (early), Prime Day | School supply budgets, deal comparison tools |
| August | UCL season starts, back-to-school | Football tools, student tools, school supply lists |
| September | New iPhone launch, back-to-school | Apple tools, iPhone comparison, student tools |
| October | Halloween, open enrollment (US health insurance) | Costume budget, health plan comparison |
| November | Black Friday, Cyber Monday, NaNoWriMo | Deal calculators, discount trackers, word count tools |
| December | Christmas, year-end tax planning, Eid (varies) | Gift budgets, tax-loss harvesting, charity calculators |

### Sports Events (annual)
- **UCL** — August to June (already have 15+ UCL tools)
- **IPL** — March to May (already have IPL auction calculator)
- **FIFA events** — World Cup years, continental championships
- **Cricket World Cup** — varies (already have 12+ cricket tools)
- **Olympics** — every 4 years

### Regulation Changes (watch for these)
- UK budget/rates — April each year
- US tax brackets — January each year
- India tax slabs — April each year
- EU AI Act milestones — rolling deadlines
- GDPR/privacy regulation updates — ongoing

---

## Virality Checklist (add to every new tool)

- [ ] Share buttons on tool results (Twitter, WhatsApp, Copy Link)
- [ ] OG image that shows the tool result (social card)
- [ ] "Made with Teamz Lab Tools" on shareable outputs
- [ ] Embed code option for bloggers/webmasters

---

## Data-Driven Decisions

### What to track (Firebase Analytics — already set up)
- Top 20 tools by page views → build MORE in those niches
- Top referral sources → double down on what works
- Tool usage events → which tools have high engagement?
- Geographic breakdown → which country hubs drive traffic?

### Monthly Review Cadence
1. Check top 20 tools → plan 5 more tools in winning niches
2. Check bottom 20 tools → diagnose why (bad keyword? no traffic? broken?)
3. Check seasonal calendar → prep tools for next month's trends
4. Check Google Trends → any breakout searches we can serve?

---

## Revenue Targets (aspirational)

| Milestone | Formula | Monthly |
|-----------|---------|---------|
| Phase 1 | AdSense on 692 pages × $0.10/day avg | ~$2,100/mo |
| Phase 2 | + Affiliate commissions (5% of finance/VPN traffic converts) | ~$3,500/mo |
| Phase 3 | + Newsletter sponsorships (1000+ subscribers) | ~$4,500/mo |
| Phase 4 | + Premium tier (100 subscribers × $5/mo) | ~$5,000/mo |
| Phase 5 | + High-ticket leads from tool funnels | ~$10,000+/mo |

---

*Last updated: 2026-03-17*
