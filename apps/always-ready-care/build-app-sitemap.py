#!/usr/bin/env python3
"""
Generate the app sitemap by walking all index.html files under /apps/always-ready-care/.
Skips noindex pages (privacy, cookies, impressum, datenschutz).
"""
import os, re
from datetime import date

BASE = os.path.dirname(os.path.abspath(__file__))
SITE_URL = 'https://tool.teamzlab.com'
PREFIX = '/apps/always-ready-care/'
TODAY = date.today().isoformat()
NOINDEX_SEGMENTS = {'privacy', 'cookies', 'impressum', 'datenschutz'}

HREFLANG = {
    '': 'en-GB',
    'au': 'en-AU',
    'nz': 'en-NZ',
    'ie': 'en-IE',
    'de': 'de-DE',
    'de-en': 'en-DE',
}

def is_noindex_path(rel_path):
    parts = rel_path.split('/')
    return any(p in NOINDEX_SEGMENTS for p in parts)

def priority_for(rel_path):
    if rel_path == '':
        return '1.0'
    parts = rel_path.split('/')
    if len(parts) == 1:
        return '0.9'  # regional landing
    if len(parts) == 2:
        return '0.8'  # direct tool or hub
    return '0.7'      # deep subpage

def region_alternates_block():
    """Return xhtml:link lines only for the 6 top-level landing variants."""
    lines = []
    for code, lang in HREFLANG.items():
        path = PREFIX if code == '' else PREFIX + code + '/'
        lines.append(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{SITE_URL}{path}"/>')
    lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE_URL}{PREFIX}"/>')
    return '\n'.join(lines)

def collect_urls():
    urls = []
    for root, dirs, files in os.walk(BASE):
        # skip hidden + assets
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('css','js','icons','au','nz','ie','de','de-en','distribution','docs')]
        # we'll re-traverse with direct walks for specific subtrees below — let's just walk fully

    # Simpler: walk everything and filter
    urls = []
    for root, dirs, files in os.walk(BASE):
        if 'index.html' in files:
            rel = os.path.relpath(root, BASE).replace(os.sep, '/')
            if rel == '.':
                rel = ''
            # skip hidden / docs / distribution dirs
            if rel.startswith('.') or rel.startswith('docs') or rel.startswith('distribution') or '/docs/' in '/'+rel+'/' or '/distribution/' in '/'+rel+'/':
                continue
            if is_noindex_path(rel):
                continue
            urls.append(rel)
    # deduplicate & sort with landing pages first
    urls = sorted(set(urls), key=lambda p: (len(p.split('/')), p))
    return urls

def build_sitemap():
    urls = collect_urls()
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    ]
    top_level_landings = set(HREFLANG.keys())
    alternates_block = region_alternates_block()
    for rel in urls:
        loc = f'{SITE_URL}{PREFIX}{rel}/' if rel else f'{SITE_URL}{PREFIX}'
        parts = rel.split('/') if rel else []
        pri = priority_for(rel)
        chfreq = 'weekly' if rel == '' else 'monthly'
        lines.append('  <url>')
        lines.append(f'    <loc>{loc}</loc>')
        # add regional alternates only on top-level landings (root, au, nz, ie, de, de-en)
        if rel in top_level_landings:
            lines.append(alternates_block)
        lines.append(f'    <lastmod>{TODAY}</lastmod>')
        lines.append(f'    <changefreq>{chfreq}</changefreq>')
        lines.append(f'    <priority>{pri}</priority>')
        lines.append('  </url>')
    lines.append('</urlset>')
    return '\n'.join(lines) + '\n'

def main():
    sitemap = build_sitemap()
    out = os.path.join(BASE, 'sitemap.xml')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(sitemap)
    count = sitemap.count('<loc>')
    print(f'BUILT: sitemap.xml ({count} URLs)')

if __name__ == '__main__':
    main()
