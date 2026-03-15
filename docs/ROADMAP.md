# Roadmap — Teamz Lab Tools

## Current State
- 24 calculator tools live
- Full SEO infrastructure (schemas, sitemap, OG tags, canonicals)
- Branding design system integrated
- GitHub Pages compatible
- Lead generation CTAs in results + footer

---

## Phase 1 — Launch Readiness (Next)

### Deploy
- [ ] Push to GitHub and enable GitHub Pages
- [ ] Configure DNS: tool.teamzlab.com → GitHub Pages
- [ ] Verify HTTPS works with custom domain
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools

### Monetization Setup
- [ ] Apply for Google AdSense
- [ ] Replace ad-slot placeholders with actual AdSense units
- [ ] Set up Google Analytics 4

### Contact Form
- [ ] Create Formspree account and get real form ID
- [ ] Replace placeholder action URL in contact/index.html

---

## Phase 2 — SEO Optimization (Week 2-4)

### Content Expansion
- [ ] Add "How It Works" support pages for top 6 tools
- [ ] Add "Examples" pages for tools with high search volume
- [ ] Write a blog-style "Guide to Notice Periods" linking to relevant tools
- [ ] Create country-specific variants (India notice period, UK holiday pay, etc.)

### Technical SEO
- [ ] Add favicon and apple-touch-icon
- [ ] Add og:image for social sharing (generate tool-specific preview cards)
- [ ] Set up Google Search Console and monitor indexing
- [ ] Monitor Core Web Vitals and fix any issues
- [ ] Add hreflang tags if country variants are created

---

## Phase 3 — Tool Expansion (Month 2-3)

### Tier A Tools (Next 12)
Priority order based on search volume and SEO fit:

1. Exam Countdown Planner
2. Revision Timetable Planner
3. Quote Estimator
4. Revision Cost Calculator
5. Sponsorship Rate Calculator
6. Creator Income Goal Calculator
7. Daily Salary Calculator (salary breakdown variant)
8. Full and Final Settlement Calculator
9. Pro-Rated Annual Leave Calculator
10. Joining Date Gap Calculator
11. Payment Reminder Schedule Generator
12. Milestone Payout Calculator

### Tier B Tools (Month 3-4)
13. ATS Resume Keyword Checker
14. Job Description Keyword Extractor
15. Resume-Job Match Checker
16. Interview Question Generator from JD
17. Recipe Cost Calculator
18. Unit Price Calculator
19. Meal Prep Cost Calculator
20. App Development Cost Calculator
21. MVP Cost Estimator
22. AI Chatbot Cost Calculator
23. Token Cost Calculator
24. Meeting Cost Calculator

---

## Phase 4 — Architecture Scaling (When 40+ tools)

### Consider Migration to Astro
- Content collections for tool definitions
- Shared Astro layout component
- Data-driven page generation from JSON/YAML configs
- Automatic sitemap generation
- Build-time SEO validation

### If Staying Static
- Create a JSON tool registry (tools.json)
- Build a simple static site generator script
- Auto-generate sitemap.xml from registry
- Auto-generate homepage tool listings from registry
- Auto-generate footer links from registry

---

## Phase 5 — Lead Generation (Ongoing)

### Teamz Lab Service Bridge
- [ ] Create dedicated "Custom Tools" landing page
- [ ] Add case studies of custom tool/app builds
- [ ] A/B test CTA copy in result sections
- [ ] Track CTA click-through rates
- [ ] Add optional email capture for "save results" feature

### Content Marketing
- [ ] Publish "How we built X calculator" posts on Teamz Lab blog
- [ ] Cross-link from Teamz Lab main site to tools
- [ ] Share tools in relevant communities (Reddit, Indie Hackers, etc.)

---

## Key Metrics to Track
- Google Search Console: impressions, clicks, CTR, position by tool
- Analytics: pageviews, session depth, bounce rate per tool
- AdSense: RPM by page, best-performing tools
- Lead gen: CTA clicks, contact form submissions
- Sitemap: indexing coverage, crawl errors
