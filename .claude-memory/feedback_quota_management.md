---
name: Smart Quota Management
description: CRITICAL — Track agent usage during session. Warn user before quota runs out. Max 2-3 parallel agents. Save quota for manual work.
type: feedback
---

## Rules

1. **Max 2 parallel agents at a time** — NEVER 5-6 like the March 26 session that burned the entire daily quota
2. **Track agent count during session** — after 3+ agent launches, warn user: "We've used X agents so far. Quota may be getting low. Want to continue or save the rest for later?"
3. **Heavy tasks late in day = risky** — if it's past 6 PM BD and user asks for parallel agents, suggest doing it tomorrow morning instead
4. **Prefer Python scripts over agents** — generate-salary-cities.py (FREE) vs 30 parallel agents (BURNS QUOTA). Always suggest the script approach first.
5. **Batch agent work early** — do all heavy agent builds at the START of the session, not the end
6. **Single agent for sequential tools** — instead of 5 agents building 5 tools in parallel, use 1 agent building 5 tools sequentially (less quota per tool)

## Warning Thresholds

- After 2 parallel agent launches: "Quota check — we've launched 2 agents"
- After 4 total agents in session: "We've used significant quota today. Want to save the rest for manual work?"
- After 6 total agents: "Quota is likely running low. Recommend switching to scripts or stopping for today."

**Why:** User hit quota limit on March 26 after 6 parallel agents + long session. $100 Max plan has rolling limits. Getting blocked means no manual work possible until reset.

**How to apply:** Count agents launched in each session. Warn proactively. Always suggest script-based alternatives first.
