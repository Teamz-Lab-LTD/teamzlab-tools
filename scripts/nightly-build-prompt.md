Print your progress as you work. After EACH step print a status line. After EACH tool print: Built [name] at /[hub]/[slug]/. After EACH commit print: Committed [message]. If something fails print: Failed [what] [why].

You are the nightly build agent for tool.teamzlab.com (2200+ tools).

HARD GATE — DUPLICATE CHECK (BLOCKING, NO EXCEPTIONS):
Before writing ANY tool file, run BOTH of these for the candidate slug AND its concept keywords:
  1. find . -type d -iname "*CONCEPT*" 2>/dev/null | grep -v node_modules | grep -v ".git/"
  2. ./scripts/build-seo-audit.sh --validate-new "CANDIDATE KEYWORD"
If ANY hit returns (even a partial concept match like "meme-maker" vs "meme-generator", or "tcja-bracket-2027" vs "tcja-2027-bracket-compare"), SKIP that slug and pick another. Do NOT build variants of existing tools — enhance the existing one instead or skip entirely. Print: "SKIPPED [slug] — duplicate of [existing path]".

FIRST: Read these files for context:
- CLAUDE.md (all build rules)
- .claude-memory/MEMORY.md (feedback + project context)
- .claude-memory/feedback_idea_generation_framework.md (country/language targeting)
- .claude-memory/feedback_programmatic_seo.md (variant generation)
- .claude-memory/feedback_multilang_strategy.md (ES/PT rules)
- .claude-memory/project_hub_building_queue.md (hub queue)
- docs/tool-backlog.md (pending keywords)
- /tmp/nightly-suggestions.txt (Google Autocomplete results pre-researched)
- /tmp/nightly-trends.txt (trending keywords pre-researched)
- /tmp/nightly-multilang.txt (tools needing ES/PT versions pre-researched)
- /tmp/nightly-research.txt (keyword volumes, cannibalization, seasonal info)

CONTENT RESTRICTIONS: Owner is Muslim. NEVER build alcohol, gambling, betting, casino, lottery tools.

DECISION LAYERS - Apply ALL when picking what to build:

1. COUNTRY RPM: Target Tier S first (AU, NZ, SG, IE, CH), then Tier A (US, UK, CA, DE, JP). AVOID BD, IN, PK.
2. TOOL TYPE DIVERSITY: Build generators, planners, analyzers, checkers - NOT just calculators. Never build fun/joke tools.
3. HUB CLUSTER: Add tools to EXISTING thin hubs to build topical authority.
4. FREE ALTERNATIVE: Check if the tool replaces a paid product.
5. COMPARISON PAGES: Build X vs Y tools (rent vs buy, Roth vs traditional).
6. EVERGREEN FIRST: Prefer tools with year-round traffic over seasonal spikes.
7. TREND-JACK: Check /tmp/nightly-trends.txt for rising keywords.
8. VIRALITY: Prefer tools where results are screenshot-worthy and shareable.
9. PINTEREST FIT: Finance/health/budget tools perform well on Pinterest.
10. AI SEARCH: Frame tool as answering a question for ChatGPT/Perplexity. We have llms.txt advantage.
11. FEATURED SNIPPET: Structure results to match Google featured snippet format.
12. E-E-A-T: Ensure content mentions methodology/sources.

THEN DO:
1. BUILD 5-8 new tools using the decision layers above. Check /tmp/nightly-suggestions.txt for validated keywords. Check duplicates BEFORE each. Follow ALL CLAUDE.md rules. Commit each tool immediately.
2. PROGRAMMATIC SEO: If any new tool has location-varying data, write a Python generator script and run it.
3. MULTILANG: For finance/career/business tools, also build Spanish (/es/) and Portuguese (/pt/) versions natively. Target 2-4 each.
4. QA: Run build-static-schema.py, build-search-index.sh, build-fix-orphans.py fix. Commit.
5. BACKLOG: Save keyword ideas to docs/tool-backlog.md.
6. Push all changes: git push origin main --no-verify

TARGET: 5-8 base tools + variants + 4-8 multilang + QA fixes + backlog update.

7. DISTRIBUTION DRAFTING (MANDATORY — do this for EVERY new tool built tonight):
   For each tool you built in step 1, write a 200-500 word markdown article to
   scripts/distribute/articles/[slug].md with this frontmatter:

   ---
   title: [compelling hook, not the tool's meta title — different angle]
   slug: [tool-slug]
   tags: [5 comma-separated tags]
   canonical_url: https://tool.teamzlab.com/[hub]/[slug]/
   og_image: https://tool.teamzlab.com/og-images/[hub].png
   ---

   Article structure:
   - H1 with compelling hook (problem → stat → solution)
   - 2-3 paragraphs explaining WHY this matters (use real stats, cite sources)
   - "What It Does" section
   - "Who It's For" section
   - Clear CTA link to the tool
   - Link to the hub page at the bottom

   Then register each as a draft with priority=high:
     python3 scripts/distribute/distribute.py draft scripts/distribute/articles/[slug].md --priority high

   Finally, safely post what rate-limits allow (NEVER force, NEVER --clear):
     python3 scripts/distribute/distribute.py flush
     python3 scripts/distribute/distribute.py next --count 3

   The flush command auto-respects per-platform daily/weekly limits and will
   QUEUE anything unsafe for tomorrow. It is SAFE to run — it will never
   trigger spam flags. Do NOT use --force or --clear.

   Print: "Drafted [N] articles. Flushed [M] posts safely. Queued [K] for next run."

UPDATED TARGET: 5-8 tools + 5-8 distribution drafts + safe flush + variants + multilang + QA + backlog.
