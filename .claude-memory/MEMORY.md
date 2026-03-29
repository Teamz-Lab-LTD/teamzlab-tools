# Memory Index — Teamz Lab Tools

## User
- [user_business_mindset.md](user_business_mindset.md) — Follows Marc Lou + Adam Lyttle playbook: portfolio model, trend-jacking, SEO niche targeting, monetization-first thinking.
- [user_work_schedule.md](user_work_schedule.md) — Office 11AM-9PM BD, break 9-12, light 12-2AM, sleep 2-11AM. Weekend Sat/Sun. Reserve Claude quota for office hours.
- [user_muslim_content_restrictions.md](user_muslim_content_restrictions.md) — Muslim — NEVER build alcohol, gambling, or haram-related tools. Skip cocktail/drink/wine/beer/betting categories.

## Feedback
- [feedback_health_check.md](feedback_health_check.md) — MANDATORY: Run health check at START of every conversation. Tell user what's broken/stale before doing any work.
- [feedback_fix_issues_immediately.md](feedback_fix_issues_immediately.md) — CRITICAL: When scripts show broken links/orphans/unlinked tools, FIX them immediately — never just report numbers.
- [feedback_common_mistakes.md](feedback_common_mistakes.md) — Recurring build mistakes to avoid: forgotten counts, missing links, hardcoded colors, nested padding. Run `./build.sh` after every change.
- [feedback_local_server.md](feedback_local_server.md) — ALWAYS test UI changes on localhost:9090 before committing. Tell user to verify.
- [feedback_trend_research_before_building.md](feedback_trend_research_before_building.md) — MANDATORY: Before building ANY new tool, research Google Trends + Reddit for trending topics, check duplicates, present findings to user first.
- [feedback_light_mode_neon.md](feedback_light_mode_neon.md) — CRITICAL: Neon accent (#D9FE06) blends with white in light mode. NEVER use white text/icons on neon.
- [feedback_button_design_system.md](feedback_button_design_system.md) — CRITICAL: Buttons use ONLY two patterns: Primary (heading bg + bg text) or Secondary (surface bg + heading text + border).
- [feedback_no_neon_text.md](feedback_no_neon_text.md) — CRITICAL: NEVER use var(--accent) as text color. Use var(--heading) for scores/values/highlights.
- [feedback_mobile_responsive.md](feedback_mobile_responsive.md) — CRITICAL: Every new tool MUST be mobile-responsive.
- [feedback_copy_image_button.md](feedback_copy_image_button.md) — MANDATORY: Every image tool MUST have Copy Image button with window.showToast() — NEVER alert().
- [feedback_heading_line_height.md](feedback_heading_line_height.md) — CRITICAL: Always set explicit line-height (1.3) on headings.
- [feedback_shared_ai_engine.md](feedback_shared_ai_engine.md) — MANDATORY: Any AI tool MUST use /shared/js/ai-engine.js (TeamzAI).
- [feedback_always_run_seo_scripts.md](feedback_always_run_seo_scripts.md) — MANDATORY: After building ANY tool, run build.sh + build-seo-audit.sh + build-static-schema.py.
- [feedback_central_fixes.md](feedback_central_fixes.md) — CRITICAL: Always fix recurring issues centrally (build scripts/pre-commit) instead of patching individual files.
- [feedback_no_half_implementations.md](feedback_no_half_implementations.md) — CRITICAL: Never do half implementations. Wire up ALL event listeners, pass ALL data fields through entire chain (form→preview→book→canvas→share→decode), use showToast not alert.
- [feedback_adsense_content_structure.md](feedback_adsense_content_structure.md) — MANDATORY: Every tool MUST have 3+ H2 sections in tool-content for mid-content ad slot (highest RPM). Aim for 300-600 words across 3-4 H2s.
- [feedback_no_class_collision.md](feedback_no_class_collision.md) — CRITICAL: Never use class names that exist in shared/css/tools.css (share-btn, tool-result, ad-slot, etc.). Use tool-specific prefixes to avoid CSS collisions.
- [feedback_complete_tool_checklist.md](feedback_complete_tool_checklist.md) — CRITICAL: Every tool MUST have FAQs, WebApp schema, related tools, 300+ words content, 2+ H2s, JS logic. Pre-commit hook now validates all 8 checks.
- [feedback_new_tool_checklist.md](feedback_new_tool_checklist.md) — MANDATORY: EVERY new tool (mine OR user's) must have 3 schemas, 5+ FAQs, 6 related tools, 3+ H2s, 300+ words, 0 hex colors. ALWAYS audit user-added tools before pushing.
- [feedback_auto_save_central.md](feedback_auto_save_central.md) — Auto-save is CENTRAL in common.js. NEVER add per-tool localStorage for basic inputs. Every input MUST have an id attribute. Works on all 1000+ tools automatically.
- [feedback_always_check_duplicates.md](feedback_always_check_duplicates.md) — MANDATORY: Search broadly (*meme* not *meme-generator*) BEFORE building. Check concepts not just slugs. Never launch agents without duplicate check.
- [feedback_tool_building_mistakes.md](feedback_tool_building_mistakes.md) — CRITICAL: Full checklist of 7 mistakes to never repeat: duplicate checking, feature merging, hub link cleanup, git tracking, URL verification, concept overlap.
- [feedback_always_git_add.md](feedback_always_git_add.md) — CRITICAL: New tool files must be git add-ed. Untracked files are 404 on live site. Pre-commit warns about untracked tool files.
- [feedback_duplicate_strategy.md](feedback_duplicate_strategy.md) — When duplicate found: improve if it has traffic, skip if no traffic and build new keyword instead. Revenue-first approach.
- [feedback_quota_management.md](feedback_quota_management.md) — Track agent usage during session. Warn user before quota runs out. Max 2-3 parallel agents. Save quota for manual work.
- [feedback_always_rebuild_llms.md](feedback_always_rebuild_llms.md) — MANDATORY: After adding/changing/removing ANY tool, verify llms.txt + llms-full.txt are updated. Spec: llms.txt <10KB (categories only), llms-full.txt has all tools.
- [feedback_usability_qa.md](feedback_usability_qa.md) — MANDATORY: Run full usability QA on every new tool. Clipboard .catch(), button re-enable in finally{}, Array.from() for Unicode, html2canvas white bg, all tones implemented, clear resets selects.
- [feedback_request_indexing_after_changes.md](feedback_request_indexing_after_changes.md) — MANDATORY: After creating/updating ANY tool, run build-request-indexing.py to check Google indexing + submit to Bing/Yandex via IndexNow.
- [feedback_ai_in_all_tools.md](feedback_ai_in_all_tools.md) — Always integrate TeamzAI in every tool where AI adds value (generators, analyzers, recommenders). Skip for pure calculators/formatters. Always keep rule-based fallback.
- [feedback_result_card_padding.md](feedback_result_card_padding.md) — CRITICAL: Design tokens --text-xl (48px) are too big for result cards. Fixed centrally by overriding tokens inside .tool-calculator to use clamp(). NEVER use --text-xl/--text-2xl for card values.
- [feedback_targeted_qa_only.md](feedback_targeted_qa_only.md) — Only run QA for changed tools, not full 1395-tool scan. Use --no-verify on push when commit QA passed. Full scan only when user asks.
- [feedback_programmatic_seo.md](feedback_programmatic_seo.md) — ALWAYS consider programmatic SEO (state/city/region variants) when building tools where data differs by location. Script: build-programmatic-seo.py.
- [feedback_never_regex_minify.md](feedback_never_regex_minify.md) — NEVER use regex CSS minifiers. NEVER switch HTML refs to files that don't exist on production. Pre-push hook now catches broken refs.
- [feedback_validate_redirect_pages.md](feedback_validate_redirect_pages.md) — NEVER skip redirect pages during validation. Bing flags missing meta descriptions even on noindex stubs. build-qa-check.sh now checks them.
- [feedback_multilang_strategy.md](feedback_multilang_strategy.md) — MANDATORY: High-RPM tools (finance/tax/career) get Spanish + Portuguese versions. Script: build-multilang.py.
- [feedback_act_on_script_output.md](feedback_act_on_script_output.md) — CRITICAL: Don't just run scripts — ACT on what they reveal. If existing non-English hub found, prioritize local-language tools FIRST over English volume chasing.
- [feedback_correct_element_ids.md](feedback_correct_element_ids.md) — CRITICAL: Use exact IDs from common.js: tool-faqs, related-tools, breadcrumbs. NEVER guess.
- [feedback_distribute_in_tool_language.md](feedback_distribute_in_tool_language.md) — MANDATORY: Distribution articles MUST match tool language (French tools → French article). Set `language: XX` in frontmatter.
- [feedback_research_before_content.md](feedback_research_before_content.md) — MANDATORY: Run --suggest, --trends, and Search Console per-page queries BEFORE writing content. Research first, write second.
- [feedback_run_fix_scripts_not_just_report.md](feedback_run_fix_scripts_not_just_report.md) — CRITICAL: When scripts report fixable issues, FIX them immediately with --apply. Never just report counts as "planned."
- [feedback_never_git_checkout_dot.md](feedback_never_git_checkout_dot.md) — CRITICAL: NEVER run git checkout -- . with uncommitted work. Use git stash or target specific files.
- [feedback_test_regex_before_bulk_apply.md](feedback_test_regex_before_bulk_apply.md) — CRITICAL: Test auto-generated content on 3-5 samples before bulk applying to hundreds of files.

## Core Web Vitals (2026-03-26)
- [project_cwv_fixes_2026_03.md](project_cwv_fixes_2026_03.md) — CWV deployed: CSS bundle, self-hosted fonts, static header, deferred analytics. Minification reverted (regex broke CSS). Pre-push now checks broken refs.

## SEO Audit (2026-03-17)
- [project_seo_audit_2026_03.md](project_seo_audit_2026_03.md) — Full Google Search Central compliance audit. Score 72/100.
- [project_hardcoded_colors_list.md](project_hardcoded_colors_list.md) — 76 pages with hardcoded hex colors.
- [reference_google_seo_docs.md](reference_google_seo_docs.md) — Google Search Central documentation URLs cited in audit.

## Revenue Strategy
- [feedback_idea_generation_framework.md](feedback_idea_generation_framework.md) — 10-factor framework for idea generation: country RPM tiers, language multipliers, tool types, programmatic SEO, Pinterest, seasonal timing
- [project_200k_revenue_plan.md](project_200k_revenue_plan.md) — $200K/year target: needs 2M monthly high-RPM views, 10 blockers identified, multi-region strategy
- [project_missing_country_hubs.md](project_missing_country_hubs.md) — 10 high-RPM countries with 0 tools (NZ, IL, BE, HK, ES, PT, CZ, PL, TR, QA) + missing languages (Spanish, Portuguese)

## Hub Building Queue
- [project_hub_building_queue.md](project_hub_building_queue.md) — Planned hubs to build: Cocktails → Skincare → Candle Making → Knitting. Distribute 1 article per 2-3 days. Completed: Coffee, Tea, Baking (2026-03-24).

## Automation
- [project_auto_build_plan.md](project_auto_build_plan.md) — Auto Build Plan: 25 tools/night, revenue-first priority, Opus model, local-only execution. Target 750 tools/month.

## Pending
- [project_google_ads_api_pending.md](project_google_ads_api_pending.md) — Applied 2026-03-20 for Google Ads API Basic Access. Once approved: run auth, test --volume flag. Scripts ready in scripts/build-keyword-volume.py.

## Reference
- [reference_search_console.md](reference_search_console.md) — Search Console API setup: run ./build-search-console.sh for indexing status, queries, pages.
- [feedback_pull_data_before_answering.md](feedback_pull_data_before_answering.md) — MANDATORY: When user asks about trends/status/performance, pull Search Console + Analytics + SEO data FIRST before answering.
- [reference_distribution_system.md](reference_distribution_system.md) — 7-platform content distribution: Dev.to, Hashnode, WordPress, Blogger, Tumblr, Bluesky, Mastodon. Script at scripts/distribute/distribute.py.
- [reference_clarity_api.md](reference_clarity_api.md) — Microsoft Clarity bot detection API. Token at ~/.config/teamzlab/clarity-token.txt. Script: ./build-clarity.sh.
- [reference_seo_automation.md](reference_seo_automation.md) — Full Ubersuggest replacement: 8 scripts, auto catch-up, cron, macOS notifications.

## Data Scripts Available
- `./build-seo-dashboard.sh --quick` — FREE SEO Dashboard (replaces Ubersuggest) — traffic + rankings + keywords + indexing
- `./build-search-console.sh` — Google Search Console (queries, clicks, indexing)
- `./build-analytics.sh --all` — GA4 Analytics (users, pages, sources, devices, ads)
- `./build-clarity.sh` — Microsoft Clarity (bot vs human traffic, engagement, UX issues)
- `./build-seo-audit.sh --report` — SEO keyword audit
- `./build-pagespeed.sh` — PageSpeed Insights (Core Web Vitals, speed scores)
- `python3 scripts/distribute/distribute.py list` — Distribution history + Dev.to stats
- `python3 scripts/build-keyword-intel.py` — FREE keyword intelligence (volume, intent, CPC, difficulty, opportunities)
- `python3 scripts/build-rank-tracker.py` — Daily rank tracking with trends, movers, watchlist
- `python3 scripts/build-backlinks.py` — Directory submission tracker (39 directories, DA 30-93)
- `python3 scripts/build-backlinks-overview.py` — Backlinks overview (who links, DoFollow/NoFollow, 346 found)
- `python3 scripts/build-content-ideas.py` — Content ideas engine (trending, seasonal, gaps, competitors)
