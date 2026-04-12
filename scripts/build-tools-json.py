#!/usr/bin/env python3
"""
Generate tools.json for the mobile app.
The app fetches this on startup to get the latest tools, categories, and counts.
No app update needed when new tools are added — just rebuild this file.

Usage: python3 scripts/build-tools-json.py
Output: tools.json in project root (served at tool.teamzlab.com/tools.json)
"""

import glob, re, html, json, os
from datetime import datetime, timezone

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

def main():
    # Find project root (where this script is run from, or go up from scripts/)
    base = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    os.chdir(base)

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


if __name__ == '__main__':
    main()
