#!/usr/bin/env python3
"""
Inject an EN-translate toggle button into every /de/**/index.html page.

The button uses Google's subdomain-proxy translate URL
(https://DOMAIN.translate.goog/PATH?_x_tr_sl=de&_x_tr_tl=en) so any page
gets instant English on click — no per-page English mirror required.

Idempotent: re-run any time without duplicating the button.
"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))
DE_DIR = os.path.join(BASE, 'de')

BUTTON_MARKER = 'id="lang-toggle-en"'

BUTTON_HTML = (
    '<a id="lang-toggle-en" href="#" role="button" aria-label="Switch to English" '
    'title="Translate to English via Google" '
    'style="position:fixed;top:14px;right:14px;z-index:9999;display:inline-flex;'
    'align-items:center;gap:6px;padding:8px 14px;border-radius:999px;'
    'background:var(--accent,#D9FE06);color:var(--accent-text,#12151A);'
    'font:600 13px/1 Poppins,system-ui,sans-serif;text-decoration:none;'
    'box-shadow:0 4px 12px rgba(0,0,0,.18);border:1px solid rgba(0,0,0,.12);" '
    'onclick="var h=location.hostname;'
    'if(h===\'localhost\'||/^127\\.|^192\\.168\\.|^10\\.|^172\\.(1[6-9]|2[0-9]|3[01])\\./.test(h)||h===\'\'){'
    'alert(\'Auto-Übersetzung funktioniert nur auf der Live-Website tool.teamzlab.com.\\n\\n'
    'Auto-translate works only on the live site, not on localhost.\');return false;}'
    'window.location=\'https://\'+h.replace(/\\./g,\'-\')+\'.translate.goog\'+location.pathname+'
    '\'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en\';return false;">'
    '<span style="font-size:14px;line-height:1;">EN</span>'
    '<span>Translate</span></a>'
)

def inject(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Skip if ANY language toggle already present (main /de/ page has id="lang-toggle" → /de-en/)
    if BUTTON_MARKER in html or 'id="lang-toggle"' in html:
        return False

    # Inject immediately after opening <body> tag
    new_html, count = re.subn(r'(<body>\s*)', r'\1\n    ' + BUTTON_HTML + '\n', html, count=1)
    if count == 0:
        print(f'  SKIP (no <body> tag): {path}')
        return False

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return True


def main():
    if not os.path.isdir(DE_DIR):
        print(f'ERROR: {DE_DIR} not found'); return
    patched = 0
    skipped = 0
    visited = 0
    for root, _, files in os.walk(DE_DIR):
        for name in files:
            if name != 'index.html':
                continue
            path = os.path.join(root, name)
            visited += 1
            if inject(path):
                patched += 1
                rel = os.path.relpath(path, BASE)
                print(f'  PATCHED: {rel}')
            else:
                skipped += 1
    print(f'\nDone. Visited {visited} · Patched {patched} · Skipped {skipped} (already had button)')


if __name__ == '__main__':
    main()
