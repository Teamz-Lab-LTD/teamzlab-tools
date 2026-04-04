---
name: DeviceGPT Article Series — 8 Drafts Pending Distribution
description: 8 focused SEO+ASO articles drafted for DeviceGPT app, none posted yet. Remind user at start of every session until all are posted.
type: project
---

8 focused distribution articles have been drafted for the DeviceGPT Android app and are waiting to be posted. The user must be reminded at the start of every conversation until all articles are posted.

**Why:** Each article targets a specific low-competition keyword cluster. Together they cover 30-50 keywords vs the master article's 3. Critical for app downloads and Google ranking.

**Tracker file:** `scripts/distribute/articles/devicegpt-article-tracker.json`

**How to apply:** At the start of every conversation, check the tracker file and tell the user how many articles are still unposted, which ones, and suggest posting the next one.

## The 8 Articles (all status: draft, posted_to: [])

| # | File | Priority | Target Keyword | Competition |
|---|------|----------|---------------|-------------|
| 1 | devicegpt-01-spyware-keylogger-detection.md | HIGH | "how to detect keylogger android" | LOW |
| 2 | devicegpt-02-battery-health-samsung-pixel.md | HIGH | "battery health android samsung/pixel" | MEDIUM |
| 3 | devicegpt-03-isp-privacy-check.md | HIGH | "is my ISP spying on me" | ZERO |
| 4 | devicegpt-04-phone-monitoring-detection.md | HIGH | "how to know if someone is monitoring your phone" | LOW |
| 5 | devicegpt-05-phone-resale-value-certificate.md | MEDIUM | "how much is my phone worth android" | ZERO |
| 6 | devicegpt-06-vs-accubattery-comparison.md | MEDIUM | "accubattery alternative android" | MEDIUM |
| 7 | devicegpt-07-blocked-apps-network-reachability.md | MEDIUM | "is whatsapp blocked" | ZERO |
| 8 | devicegpt-08-motion-detector-anti-snoop.md | MEDIUM | "phone motion detector android" | ZERO |

## Posting Rules
- Max 1-2 articles per day across ALL platforms
- Safe daily platforms: telegraph, blogger, github_discussions
- Careful: tumblr (max 1/day, new account), bluesky/mastodon (max 2/day)
- Weekly-limited: devto, hashnode, wordpress, substack (check safety dashboard first)
- Always run: `python3 scripts/distribute/distribute.py safety` before posting
- Update tracker JSON after each post: change status to "posted" and add platform URLs

## How to Post One Article
```bash
python3 scripts/distribute/distribute.py safety
python3 scripts/distribute/distribute.py post "TITLE" scripts/distribute/articles/FILENAME --platforms telegraph,blogger,github_discussions
```
