#!/usr/bin/env python3
"""Merge category translations into tools.json.

Reads the English->locale map at scripts/category-i18n.json, then for every
category in tools.json whose English `name` has translations, writes a
`name_locales` dict with all 39 non-English locales.

Run after adding or changing translations:
    python3 scripts/apply-category-i18n.py

Keeps tools.json in its existing single-line JSON format. The generator
(build-tools-json.py) preserves name_locales across rebuilds, so this
script only needs to run when translations actually change.
"""
from __future__ import annotations
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / 'tools.json'
I18N = ROOT / 'scripts' / 'category-i18n.json'

LOCALES = [
    'ar','ca','cs','da','de','el','en_AU','en_GB','es','es_419','es_ES','fi',
    'fr','fr_CA','he','hi','hr','hu','id','it','ja','ko','ms','nb','nl','pl',
    'pt','pt_BR','pt_PT','ro','ru','sk','sv','th','tr','uk','vi','zh','zh_Hans',
]


def main() -> int:
    if not TOOLS.exists():
        print(f"error: {TOOLS} not found", file=sys.stderr)
        return 1
    if not I18N.exists():
        print(f"error: {I18N} not found — create it with your translation map",
              file=sys.stderr)
        return 1

    data = json.loads(TOOLS.read_text(encoding='utf-8'))
    i18n = json.loads(I18N.read_text(encoding='utf-8'))

    translated, missing, incomplete = 0, [], []
    for cat in data.get('categories', []):
        en = cat.get('name', '')
        locales = i18n.get(en)
        if not locales:
            missing.append(f"{cat['slug']}: {en!r}")
            continue
        # Sanity check — every locale must be present.
        absent = [L for L in LOCALES if L not in locales or not locales[L].strip()]
        if absent:
            incomplete.append(f"{cat['slug']} ({en!r}): missing {absent[:5]}…")
            continue
        cat['name_locales'] = {L: locales[L] for L in LOCALES}
        translated += 1

    # Preserve the existing compact format (single-line, UTF-8).
    tmp = TOOLS.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False),
                   encoding='utf-8')
    os.replace(tmp, TOOLS)

    # Pretty debug mirror.
    (ROOT / 'tools-debug.json').write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')

    print(f"apply-category-i18n: translated {translated} categories")
    if missing:
        print(f"  missing from category-i18n.json ({len(missing)}):")
        for m in missing[:10]:
            print(f"    {m}")
    if incomplete:
        print(f"  incomplete (need all 39 locales) ({len(incomplete)}):")
        for i in incomplete[:10]:
            print(f"    {i}")
    return 0 if not (missing or incomplete) else 2


if __name__ == '__main__':
    sys.exit(main())
