#!/usr/bin/env python3
"""
Inject a resource-links strip on UK/AU/NZ/IE landing pages pointing to their
new checklist / framework / regions hubs.

Idempotent via marker check.
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
MARKER = 'id="arc-country-resources"'

COUNTRIES = {
    'uk': {
        'path': os.path.join(BASE, 'index.html'),
        'links': [
            ('inspection-checklist/', '→ CQC Inspection Checklist'),
            ('framework/', '→ 5 Key Questions Guide'),
            ('regions/', '→ UK Regions Directory'),
            ('privacy/', '→ Privacy'),
            ('cookies/', '→ Cookies'),
        ],
    },
    'au': {
        'path': os.path.join(BASE, 'au', 'index.html'),
        'links': [
            ('inspection-checklist/', '→ ACQS Quality Assessment Checklist'),
            ('standards/', '→ 7 Strengthened Standards Guide'),
            ('regions/', '→ AU States & Territories'),
            ('privacy/', '→ Privacy'),
            ('cookies/', '→ Cookies'),
        ],
    },
    'nz': {
        'path': os.path.join(BASE, 'nz', 'index.html'),
        'links': [
            ('inspection-checklist/', '→ NZS 8134 Audit Checklist'),
            ('standards/', '→ Ngā Paerewa Guide'),
            ('regions/', '→ NZ Districts'),
            ('privacy/', '→ Privacy'),
            ('cookies/', '→ Cookies'),
        ],
    },
    'ie': {
        'path': os.path.join(BASE, 'ie', 'index.html'),
        'links': [
            ('inspection-checklist/', '→ HIQA Inspection Checklist'),
            ('standards/', '→ 8 National Standards Guide'),
            ('regions/', '→ Ireland CHOs'),
            ('privacy/', '→ Privacy'),
            ('cookies/', '→ Cookies'),
        ],
    },
}

LINK_STYLE = 'color:var(--accent);text-decoration:underline;font-weight:600;'

def build_strip(links):
    items = ' &middot; '.join(
        f'<a href="{href}" style="{LINK_STYLE}">{label}</a>'
        for href, label in links
    )
    return f'<span id="arc-country-resources">Free tools: {items} &middot; </span>'

def patch(path, links):
    if not os.path.exists(path):
        print(f'  SKIP (missing): {path}')
        return False
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    if MARKER in html:
        return False
    strip = build_strip(links)
    # Try known target "Also available for:" text (UK body footer)
    candidates = ['Also available for:', 'Auch verfügbar für:']
    hit = False
    for target in candidates:
        if target in html:
            html = html.replace(target, strip + target, 1)
            hit = True
            break
    if not hit:
        print(f'  SKIP (no anchor in): {path}')
        return False
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    return True

def main():
    for code, cfg in COUNTRIES.items():
        if patch(cfg['path'], cfg['links']):
            print(f'  PATCHED: {code}')
        else:
            print(f'  (no change): {code}')

if __name__ == '__main__':
    main()
