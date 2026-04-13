#!/usr/bin/env python3
"""
build-perf-hints.py — Inject performance hints into <head> of every HTML page.

What it adds (between <!-- TEAMZ-PERF --> markers, just BEFORE the first <link rel="stylesheet">):
  - <link rel="preload"> for poppins-400 + poppins-600 (woff2)
  - <link rel="preconnect"> for AdSense + Google Analytics + Google Tag Manager

Why: cuts mobile LCP/FCP by 1-3 seconds on cold loads. Browser starts
fetching fonts and warming TLS connections in parallel with CSS, instead
of after CSS parse.

Idempotent: detects existing TEAMZ-PERF block and replaces it. Safe to
re-run after every change. Touches ONLY the head; never modifies tool
markup, body, scripts, or CSS files.

Usage:
  python3 scripts/build-perf-hints.py            # inject into all pages
  python3 scripts/build-perf-hints.py --check    # report missing hints, no writes
  python3 scripts/build-perf-hints.py --dry-run  # show what would change
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

START = '<!-- TEAMZ-PERF -->'
END = '<!-- /TEAMZ-PERF -->'

PERF_BLOCK = (
    f'{START}\n'
    '  <link rel="preload" href="/branding/fonts/poppins-400.woff2" as="font" type="font/woff2" crossorigin>\n'
    '  <link rel="preload" href="/branding/fonts/poppins-600.woff2" as="font" type="font/woff2" crossorigin>\n'
    '  <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>\n'
    '  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>\n'
    '  <link rel="dns-prefetch" href="https://www.google-analytics.com">\n'
    '  <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net">\n'
    f'  {END}'
)

# Find existing block (multiline)
EXISTING_RE = re.compile(
    re.escape(START) + r'.*?' + re.escape(END),
    re.DOTALL,
)

# Where to inject if no existing block: right before the first stylesheet link
ANCHOR_RE = re.compile(
    r'(\s*<link rel="stylesheet" href="/branding/css/teamz-branding\.css">)',
)

EXCLUDE_DIRS = {
    '.git', 'node_modules', 'branding', 'teamz-company-automation',
    '.claude', 'logs', 'docs',
}


def should_skip(path: Path) -> bool:
    parts = set(path.relative_to(ROOT).parts)
    return bool(parts & EXCLUDE_DIRS)


def process(path: Path, mode: str) -> str:
    """Returns: 'updated', 'inserted', 'skipped-no-anchor', 'unchanged'"""
    try:
        html = path.read_text(encoding='utf-8')
    except (UnicodeDecodeError, IOError):
        return 'skipped-no-anchor'

    if EXISTING_RE.search(html):
        new_html = EXISTING_RE.sub(PERF_BLOCK, html, count=1)
        if new_html == html:
            return 'unchanged'
        if mode != 'dry-run' and mode != 'check':
            path.write_text(new_html, encoding='utf-8')
        return 'updated'

    # No existing block — inject before stylesheet link
    if not ANCHOR_RE.search(html):
        return 'skipped-no-anchor'

    new_html = ANCHOR_RE.sub(f'\n  {PERF_BLOCK}\\1', html, count=1)
    if mode != 'dry-run' and mode != 'check':
        path.write_text(new_html, encoding='utf-8')
    return 'inserted'


def main():
    mode = 'apply'
    if '--check' in sys.argv:
        mode = 'check'
    elif '--dry-run' in sys.argv:
        mode = 'dry-run'

    counts = {'updated': 0, 'inserted': 0, 'skipped-no-anchor': 0, 'unchanged': 0}
    skipped_files = []

    for path in ROOT.rglob('*.html'):
        if should_skip(path):
            continue
        result = process(path, mode)
        counts[result] += 1
        if result == 'skipped-no-anchor':
            skipped_files.append(str(path.relative_to(ROOT)))

    print('=' * 60)
    print(f'  build-perf-hints.py — mode: {mode}')
    print('=' * 60)
    print(f'  Updated existing block:  {counts["updated"]}')
    print(f'  Inserted new block:      {counts["inserted"]}')
    print(f'  Unchanged:               {counts["unchanged"]}')
    print(f'  Skipped (no anchor):     {counts["skipped-no-anchor"]}')
    if counts['skipped-no-anchor'] and counts['skipped-no-anchor'] <= 20:
        print()
        print('  Skipped files (no /branding/css/teamz-branding.css link):')
        for f in skipped_files[:20]:
            print(f'    {f}')


if __name__ == '__main__':
    main()
