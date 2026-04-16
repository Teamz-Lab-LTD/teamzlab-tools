#!/usr/bin/env python3
"""
Generate tools.json for the mobile app.
The app fetches this on startup to get the latest tools, categories, and counts.
No app update needed when new tools are added — just rebuild this file.

Usage: python3 scripts/build-tools-json.py
Output: tools.json in project root (served at tool.teamzlab.com/tools.json)
"""

import argparse, glob, re, html, json, os, sys
from datetime import datetime, timezone

# Canonical locale list (matches the Flutter app's ARB files at lib/l10n/app_*.arb).
# Flutter uses Locale.toString() which produces underscore format — keep these exact
# strings as the keys in name_locales / title_locales / description_locales so the
# app can index the map directly without normalization.
LOCALES = [
    'ar','ca','cs','da','de','el','en_AU','en_GB','es','es_419','es_ES','fi',
    'fr','fr_CA','he','hi','hr','hu','id','it','ja','ko','ms','nb','nl','pl',
    'pt','pt_BR','pt_PT','ro','ru','sk','sv','th','tr','uk','vi','zh','zh_Hans',
]

# Hub display names (same as build-search-index.sh)
HUB_NAMES = {
    '3d':'3D Tools','ai':'AI Tools','accessibility':'Accessibility','amazon':'Amazon Seller',
    'apple':'Apple & iPhone','astrology':'Astrology','auto':'Automotive','baby':'Baby & Pregnancy',
    'career':'Career Tools','compliance':'Compliance','cooking':'Cooking','creator':'Creator Tools',
    'cricket':'Cricket','crypto':'Crypto & Web3','design':'Design','dev':'Developer Tools',
    'diagnostic':'Diagnostic Tools','diy':'DIY','eldercare':'Elder Care','evergreen':'Everyday Calculators',
    'football':'Football','freelance':'Freelance & Invoice','gaming':'Gaming','garden':'Garden',
    'grooming':'Grooming','health':'Health & Wellness','home':'Home & DIY','housing':'Housing & Energy',
    'image':'Image Tools','kids':'Kids & Education','legal':'Legal','math':'Math Tools',
    'military':'Military & Veterans','mobile':'Mobile Dev','music':'Music & Audio',
    'pest':'Pest Control','pet':'Pet Care','ramadan':'Ramadan & Eid','real-estate':'Real Estate',
    'restaurant':'Restaurant & Food','safety':'Safety','security':'Security','seo':'SEO Tools',
    'shopping':'Shopping','software':'Software Cost','sports':'Sports & Fitness',
    'student':'Student Tools','text':'Text Tools','tools':'Utilities','uidesign':'UI Design',
    'video':'Video Tools','weather':'Weather & Outdoor','wedding':'Wedding','work':'Work & Payroll',
    'ae':'UAE','au':'Australia','bd':'Bangladesh','ca':'Canada','de':'Germany','eg':'Egypt',
    'eu':'EU Consumer','fi':'Finland','fr':'France','gh':'Ghana','id':'Indonesia','in':'India',
    'it':'Italy','jp':'Japan','ke':'Kenya','ma':'Morocco','my':'Malaysia','ng':'Nigeria',
    'nl':'Netherlands','no':'Norway','ph':'Philippines','sa':'Saudi Arabia','se':'Sweden',
    'sg':'Singapore','uk':'United Kingdom','us':'United States','vn':'Vietnam','za':'South Africa',
    # Additional country hubs that previously fell through to `.title()` and
    # emitted useless two-letter display names (e.g. "At", "Be", "Cz").
    'at':'Austria','be':'Belgium','ch':'Switzerland','cz':'Czech Republic',
    'da':'Denmark','dk':'Denmark','es':'Spain','ie':'Ireland','il':'Israel',
    'lu':'Luxembourg','nz':'New Zealand','pl':'Poland','pt':'Portugal',
    'ru':'Russia','tr':'Turkey',
    # Language-keyed content hubs (Hebrew/Hindi/Korean/Swedish/Chinese tools).
    # Named after the country so non-native users see a recognisable label.
    'he':'Israel','hi':'India','ko':'Korea','sv':'Sweden','zh':'China',
    # Care-software verticals — scoped per region.
    'apps':'Apps','au-care':'Australia Care','ie-care':'Ireland Care',
    'nz-care':'New Zealand Care','uk-care':'UK Care',
}

SKIP_HUBS = {'about','contact','privacy','terms','docs','shared','branding','og-images','icons',
             '__pycache__','.git','config','fonts','scripts','node_modules','.claude','.claude-memory'}

# Hub icon emojis for the app UI
HUB_ICONS = {
    '3d':'cube','ai':'brain','accessibility':'accessibility','amazon':'shopping-cart',
    'apple':'smartphone','astrology':'star','auto':'car','baby':'baby',
    'career':'briefcase','compliance':'shield','cooking':'utensils','creator':'palette',
    'cricket':'activity','crypto':'bitcoin','design':'pen-tool','dev':'code',
    'diagnostic':'search','diy':'tool','eldercare':'heart','evergreen':'calculator',
    'football':'dribbble','freelance':'file-text','gaming':'gamepad','garden':'flower',
    'grooming':'scissors','health':'heart-pulse','home':'home','housing':'building',
    'image':'image','kids':'book-open','legal':'scale','math':'sigma',
    'military':'shield','mobile':'smartphone','music':'music',
    'pest':'bug','pet':'paw-print','ramadan':'moon','real-estate':'map-pin',
    'restaurant':'utensils','safety':'shield-check','security':'lock','seo':'trending-up',
    'shopping':'shopping-bag','software':'layers','sports':'dumbbell',
    'student':'graduation-cap','text':'type','tools':'wrench','uidesign':'layout',
    'video':'video','weather':'cloud','wedding':'rings','work':'clock',
    'ae':'flag','au':'flag','bd':'flag','ca':'flag','de':'flag','eg':'flag',
    'eu':'flag','fi':'flag','fr':'flag','gh':'flag','id':'flag','in':'flag',
    'it':'flag','jp':'flag','ke':'flag','ma':'flag','my':'flag','ng':'flag',
    'nl':'flag','no':'flag','ph':'flag','sa':'flag','se':'flag',
    'sg':'flag','uk':'flag','us':'flag','vn':'flag','za':'flag',
}

def _load_existing_translations(existing_path):
    """Load translations from the previous tools.json so they survive regeneration.

    Returns two dicts:
      cat_prev[slug]  = {"name": <str>, "name_locales": {...}}
      tool_prev[slug] = {"title": <str>, "title_locales": {...},
                         "description": <str>, "description_locales": {...}}

    If the file is absent or malformed, returns empty dicts — a fresh build with
    no translations simply emits English and warns. Non-fatal by design.
    """
    cat_prev, tool_prev = {}, {}
    if not os.path.exists(existing_path):
        return cat_prev, tool_prev
    try:
        with open(existing_path, encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"  WARN: could not parse existing tools.json for translation preservation: {e}",
              file=sys.stderr)
        return cat_prev, tool_prev
    for cat in data.get('categories', []):
        slug = cat.get('slug')
        if not slug:
            continue
        entry = {'name': cat.get('name', '')}
        if isinstance(cat.get('name_locales'), dict):
            entry['name_locales'] = cat['name_locales']
        cat_prev[slug] = entry
    for t in data.get('tools', []):
        slug = t.get('slug')
        if not slug:
            continue
        entry = {'title': t.get('title', ''), 'description': t.get('description', '')}
        if isinstance(t.get('title_locales'), dict):
            entry['title_locales'] = t['title_locales']
        if isinstance(t.get('description_locales'), dict):
            entry['description_locales'] = t['description_locales']
        tool_prev[slug] = entry
    return cat_prev, tool_prev


def _carry_locales(target, prev, english_field, locales_field, source_lang, stale, missing, label):
    """Merge a preserved *_locales dict into `target` if the English source is
    unchanged. When the source text has drifted, drop the translations and list
    the item in `stale`. When no translations exist at all, list it in `missing`.

    Tools whose `lang` field is NOT 'en' are skipped for translation preservation
    — their canonical string is in the source language, and translations into the
    other 38 locales come from a separate flow (see docs/localization.md). We
    still preserve whatever locales were stored previously, but we do NOT flag
    them as missing just because en_AU is absent on an Arabic tool.
    """
    prev_locales = (prev or {}).get(locales_field)
    prev_english = (prev or {}).get(english_field)
    current = target.get(english_field, '')

    if prev_locales and prev_english == current:
        # Source text unchanged → carry translations forward verbatim.
        target[locales_field] = prev_locales
    elif prev_locales and prev_english != current:
        # Source drifted → drop translations and report staleness.
        stale.append(f"{label}  (English changed from {prev_english!r} to {current!r})")
    else:
        # Never translated. Only complain about English-source items; non-English
        # tools get translated via a separate sweep.
        if source_lang in (None, '', 'en'):
            missing.append(label)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--strict', action='store_true',
                        help='Exit non-zero if any categories or English-source tools '
                             'are missing translations. Use in CI to block deploys.')
    args = parser.parse_args()

    # Find project root (where this script is run from, or go up from scripts/)
    base = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    os.chdir(base)

    # Preserve translations from the previous build so regeneration isn't
    # destructive. If English source text changed since last build, the
    # translation is dropped and reported as stale.
    cat_prev, tool_prev = _load_existing_translations(os.path.join(base, 'tools.json'))
    stale_items, missing_items = [], []

    tools = []
    categories = {}

    for f in sorted(glob.glob('*/*/index.html')):
        parts = f.split('/')
        if len(parts) != 3:
            continue

        hub, slug, _ = parts

        if hub in SKIP_HUBS:
            continue

        with open(f, encoding='utf-8') as fh:
            content = fh.read()

        # Skip redirect/stub pages
        if 'http-equiv="refresh"' in content:
            continue
        if 'window.location' in content and '<h1' not in content:
            continue

        # Extract title
        t = re.search(r'<title>(.*?)</title>', content)
        if not t:
            continue
        title = html.unescape(
            t.group(1)
            .replace(' — Teamz Lab Tools', '')
            .replace(' | Teamz Lab Tools', '')
            .strip()
        )

        # Extract meta description
        d = re.search(r'name="description" content="([^"]*)"', content)
        desc = html.unescape(d.group(1).strip()) if d else ''

        # Extract meta keywords (used for smart fuzzy search in mobile app)
        k = re.search(r'name="keywords" content="([^"]*)"', content)
        tags = []
        if k:
            tags = [t.strip().lower() for t in html.unescape(k.group(1)).split(',') if t.strip()]
        # Add slug tokens as implicit tags (e.g. "tip-calculator" → ["tip", "calculator"])
        for tok in slug.replace('-', ' ').split():
            if len(tok) > 2 and tok.lower() not in tags:
                tags.append(tok.lower())

        # Detect language
        lang_match = re.search(r'<html[^>]*lang="([^"]*)"', content)
        lang = lang_match.group(1) if lang_match else 'en'

        tool = {
            "slug": slug,
            "hub": hub,
            "url": f"/{hub}/{slug}/",
            "title": title,
            "description": desc,
            "tags": tags,
            "lang": lang,
        }

        # Carry translations forward from the previous tools.json. The English
        # source text is the freshness key — if it changed, translations are
        # dropped for this item and reported on stderr.
        prev = tool_prev.get(slug)
        _carry_locales(tool, prev, 'title', 'title_locales', lang,
                       stale_items, missing_items, f"tool:{hub}/{slug} [title]")
        _carry_locales(tool, prev, 'description', 'description_locales', lang,
                       stale_items, missing_items, f"tool:{hub}/{slug} [description]")

        tools.append(tool)

        # Build category data
        if hub not in categories:
            categories[hub] = {
                "slug": hub,
                "name": HUB_NAMES.get(hub, hub.replace('-', ' ').title()),
                "icon": HUB_ICONS.get(hub, 'grid'),
                "count": 0,
            }
        categories[hub]["count"] += 1

    # Auto-generate hub search aliases from the most common tokens across
    # each hub's tool titles + tags. Means new hubs get smart-search recall
    # immediately, with no manual config in the Flutter app.
    from collections import Counter
    STOP = {'a','an','the','to','of','in','on','for','and','or','with','by','from',
            'free','online','best','top','your','how','what','tool','tools','app',
            'is','it','my','me','we','you','this','that','at','as','be','do','no'}
    hub_tokens = {h: Counter() for h in categories}
    for t in tools:
        h = t['hub']
        words = re.findall(r'[a-z0-9]+', (t['title'] + ' ' + ' '.join(t['tags'])).lower())
        for w in words:
            if len(w) >= 3 and w not in STOP and w != h:
                hub_tokens[h][w] += 1
    for h, cat in categories.items():
        # Top 8 most-distinctive tokens become aliases for that hub
        cat['aliases'] = [w for w, _ in hub_tokens[h].most_common(8)]

    # Carry category name translations forward. Every category name originates
    # in English (HUB_NAMES) so source_lang is always 'en' here.
    for h, cat in categories.items():
        prev = cat_prev.get(h)
        _carry_locales(cat, prev, 'name', 'name_locales', 'en',
                       stale_items, missing_items, f"category:{h} [name]")

    # Sort categories: main hubs first, then country hubs
    main_cats = sorted(
        [c for c in categories.values() if len(c["slug"]) > 2 or c["slug"] in ('ai','us','uk','eu','3d')],
        key=lambda c: c["name"]
    )
    country_cats = sorted(
        [c for c in categories.values() if len(c["slug"]) <= 2 and c["slug"] not in ('ai','us','uk','eu','3d')],
        key=lambda c: c["name"]
    )

    output = {
        "version": 2,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "base_url": "https://tool.teamzlab.com",
        "total": len(tools),
        "categories": main_cats + country_cats,
        "tools": tools,
    }

    out_path = os.path.join(base, 'tools.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, separators=(',', ':'), ensure_ascii=False)

    # Also write a pretty version for debugging (gitignored)
    with open(os.path.join(base, 'tools-debug.json'), 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"  tools.json: {len(tools)} tools, {len(categories)} categories ({os.path.getsize(out_path) // 1024}KB)")

    # --- Localization report -------------------------------------------------
    # Surface anything that needs a follow-up translation pass. In --strict mode
    # (used by CI) any untranslated English-source item blocks the deploy.
    if stale_items:
        print(f"  ⚠ {len(stale_items)} locale block(s) stale (English source changed — retranslate):",
              file=sys.stderr)
        for s in stale_items[:20]:
            print(f"     {s}", file=sys.stderr)
        if len(stale_items) > 20:
            print(f"     …and {len(stale_items) - 20} more", file=sys.stderr)

    if missing_items:
        print(f"  ⚠ {len(missing_items)} item(s) missing *_locales (need first translation):",
              file=sys.stderr)
        for m in missing_items[:20]:
            print(f"     {m}", file=sys.stderr)
        if len(missing_items) > 20:
            print(f"     …and {len(missing_items) - 20} more", file=sys.stderr)

    if args.strict and (stale_items or missing_items):
        print("  ✗ --strict: translations incomplete. Deploy blocked.", file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
