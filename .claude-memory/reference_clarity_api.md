---
name: Clarity API setup
description: Microsoft Clarity bot detection API — token, project ID, build script for traffic quality analysis
type: reference
---

Microsoft Clarity is integrated for bot detection and session recordings.

- **Project ID:** w1hpj87iy0 (project name: "Teamz Lab Tools")
- **Token:** ~/.config/teamzlab/clarity-token.txt
- **Script:** `./build-clarity.sh` — pulls bot vs human traffic, by country, source, device
- **Dashboard:** https://clarity.microsoft.com/projects/view/w1hpj87iy0/dashboard
- **API limit:** 10 requests/day, max 3 days of data, max 3 dimensions per request
- **Key finding (2026-03-27):** 68% of traffic is bots, almost all from "United States" IPs. Real traffic ~455 sessions/3 days (~1,060/week). Bangladesh and Facebook traffic is 100% real.
