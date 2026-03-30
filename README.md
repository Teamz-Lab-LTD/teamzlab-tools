# Teamz Lab Tools

**1,800+ free browser-based tools. No signups. No data collection. Everything runs client-side.**

[tool.teamzlab.com](https://tool.teamzlab.com)

## What is this?

A collection of 1,800+ tools organized across 90+ categories — calculators, generators, converters, AI tools, and more. Every tool runs entirely in the browser. Your data never leaves your device.

## Stats

- **1,800+** tools live
- **90+** category hubs
- **15** languages (English, German, Spanish, Portuguese, French, Japanese, Finnish, Swedish, Norwegian, Danish, Dutch, Indonesian, Vietnamese, Italian, Arabic)
- **30+** country-specific hubs (US, UK, AU, BD, DE, JP, FI, SE, NO, NZ, IE, IN, and more)
- **$0/month** hosting (GitHub Pages)

## Tech Stack

- **Frontend:** Pure HTML, CSS, JavaScript — no frameworks, no build step
- **Hosting:** GitHub Pages
- **Design System:** CSS custom properties (dark/light mode)
- **AI:** Chrome Built-in AI (Chrome 138+) + Transformers.js (all browsers) via shared AI engine
- **Search:** Client-side full-text search across all tools
- **SEO:** Auto-generated sitemap, JSON-LD schemas, llms.txt (AI search index)
- **PWA:** Service worker with offline-first caching

## Automation

Shared SEO, distribution, and API scripts live in the **`teamz-company-automation`** git submodule (`scripts/` uses symlinks so commands like `python3 scripts/distribute/distribute.py` stay the same). After clone run:

`git submodule update --init --recursive`

Submodule URL: `https://github.com/Teamz-Lab-LTD/teamz-company-automation.git` (shell scripts in `sh/`, Python in `py/` inside that repo).

Every commit triggers:

- Search index rebuild (all tools searchable from homepage)
- Sitemap regeneration (pinged to Google + Bing)
- JSON-LD schema injection (BreadcrumbList, FAQPage, WebApplication)
- SEO validation (22+ automated checks)
- IndexNow submission (instant Bing/Yandex indexing)
- Runtime QA in headless Chromium
- llms.txt + llms-full.txt rebuild (AI search engine discoverability)

## Categories

| Category | Examples |
|---|---|
| **Finance** | Tax calculators, salary converters, loan planners |
| **AI Tools** | Background remover, sentiment analyzer, resume generator |
| **Developer** | JSON formatter, regex tester, JWT decoder, cron generator |
| **Design** | Logo maker, color palette generator, font preview |
| **Health** | BMI, sleep calculator, calorie tracker |
| **Career** | ATS resume checker, salary negotiation, interview prep |
| **Image/Video** | Photo to sketch, video speed changer, meme maker |
| **Text** | Passive voice checker, word counter, Lorem ipsum generator |
| **Education** | GPA calculator, study planner, flashcard maker |
| **Country-Specific** | US tax, UK pension, DE Grundsteuer, JP tax, BD salary |

## Multi-Language Support

Tools are available in native languages for:

- **German (de):** Grundsteuer, Einkommensteuer, KFZ-Steuer, Nebenkosten
- **Japanese (ja):** Tedori Keisan, Furusato Nozei, Nenkin Keisan
- **Finnish (fi):** Perintoverolaskuri, Asumistuki, Veroprosentti
- **Spanish (es):** Calculadora de IVA, Contrato Freelance
- **Portuguese (pt):** Calculadora IMI, Gerador de Fatura
- **Swedish (sv):** Skattekalkylator, ROT-avdrag
- **Norwegian (nb):** Skatteberegner, Pensjonskalkulator
- And more: Danish, Dutch, Indonesian, Vietnamese, Italian, Arabic

## AI-Powered Tools

AI tools use a 3-tier fallback system:

1. **Chrome Built-in AI** (Chrome 138+) — fastest, runs natively
2. **Transformers.js** — open-source models, works in all browsers, offline after first load
3. **Rule-based fallback** — always works, no AI dependency

All managed through a shared AI engine (`/shared/js/ai-engine.js`) with model caching across tools.

## Privacy

- No accounts or signups
- No server-side processing
- No cookies (except theme preference)
- No analytics data leaves the browser unprocessed
- All AI inference runs locally
- Form inputs auto-save to localStorage (stays on your device)

## Content Distribution

Articles are distributed across 10+ platforms via an automated system:

Dev.to | Hashnode | Blogger | WordPress | Tumblr | Bluesky | Mastodon | GitHub Discussions | Substack | Telegraph

## License

All tools are free to use. The source code is publicly available on GitHub.

---

Built by [Teamz Lab](https://teamzlab.com)
