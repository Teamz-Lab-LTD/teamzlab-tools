---
name: AdSense content structure for max revenue
description: Every tool page MUST have 3+ H2 sections in tool-content to qualify for mid-content ad slot (highest RPM position)
type: feedback
---

Every tool page MUST have at least 3 H2 sections inside `.tool-content` to qualify for the mid-content ad unit (placed between 2nd and 3rd H2 by adsense.js).

**Why:** The mid-content ad (between H2s where users are actively reading) has the highest RPM of all ad positions. Tools with <3 H2s only get 3 ads instead of 4, losing ~15-25% potential revenue. The 3-H2 minimum also ensures enough content between ads for Google AdSense policy compliance.

**How to apply:**
- When building ANY new tool, always write 3-4 H2 sections in `tool-content` (not 1-2)
- Aim for 300-600 words total across the H2 sections
- Good pattern: "How X Works" → "Why X Matters" / "X for [Use Case]" → "X vs Y" / "[Category] Explained" → "Tips for X"
- The ad layout per page is: Tool → Ad1 → Content H2s → Ad2 (mid-content) → More H2s → Ad3 (pre-FAQ) → FAQs → Related → Ad4 (bottom)
- Existing tools with only 1-2 H2s should be enhanced when touched
