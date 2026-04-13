#!/usr/bin/env python3
"""
Inject a lightweight email-capture block into 3 high-intent German tool pages.

Strategy: mailto-based capture (no backend). Users who enter their email get
a pre-composed mail draft asking to be added to the MD-Prüfung tips list.
Simple, privacy-respecting, works without Firebase/email infra.

Re-run safe (idempotent via marker check).
"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))
MARKER = 'id="arc-lead-capture"'

TARGETS = [
    'de/md-pruefung-checkliste/index.html',
    'de/md-pruefung-vorbereitung/index.html',
    'de/pflegegrad-rechner/index.html',
    'de/qualitaetsindikatoren-check/index.html',
]

BLOCK = '''
        <aside id="arc-lead-capture" style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 24px;margin:24px 0;">
            <h2 style="font:600 19px Poppins,sans-serif;color:var(--heading);margin:0 0 6px;">MD-Prüfungs-Tipps per E-Mail</h2>
            <p style="color:var(--text-muted);font-size:14px;line-height:1.5;margin:0 0 14px;">Erhalten Sie 1-mal pro Monat praxisnahe Tipps zur MD-Prüfung, QPR-Updates und neue Tools. Jederzeit abbestellbar, DSGVO-konform.</p>
            <form id="arc-lead-form" style="display:flex;gap:8px;flex-wrap:wrap;" onsubmit="var e=document.getElementById(&quot;arc-lead-email&quot;).value.trim();if(!e||e.indexOf(&quot;@&quot;)<0){alert(&quot;Bitte geben Sie eine gültige E-Mail-Adresse ein.&quot;);return false;}var subject=encodeURIComponent(&quot;MD-Tipps abonnieren&quot;);var body=encodeURIComponent(&quot;Hallo,\\n\\nbitte fügen Sie meine E-Mail-Adresse der MD-Prüfungs-Tipps-Liste hinzu:\\n&quot;+e+&quot;\\n\\nDanke!&quot;);window.location=&quot;mailto:support@alwaysreadycare.co.uk?subject=&quot;+subject+&quot;&body=&quot;+body;return false;">
                <input type="email" id="arc-lead-email" required placeholder="Ihre berufliche E-Mail-Adresse" style="flex:1;min-width:200px;padding:11px 14px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text);font:400 14px Poppins,sans-serif;">
                <button type="submit" style="padding:11px 20px;border-radius:10px;background:var(--accent);color:var(--accent-text);border:1px solid var(--accent);font:600 14px Poppins,sans-serif;cursor:pointer;">Tipps abonnieren</button>
            </form>
            <p style="font-size:12px;color:var(--text-muted);margin:10px 0 0;line-height:1.4;">Mit Klick auf „Tipps abonnieren" öffnet sich Ihr E-Mail-Programm. Wir senden Ihnen monatlich einen Hinweis — keine Werbung, jederzeit abbestellbar. <a href="../datenschutz/" style="color:var(--accent);">Datenschutz</a>.</p>
        </aside>
'''

# Insert just before the closing </main> tag
INSERT_PATTERN = re.compile(r'(\s*</main>)')

def inject(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    if MARKER in html:
        return False
    new_html, n = INSERT_PATTERN.subn(BLOCK + r'\1', html, count=1)
    if n == 0:
        print(f'  SKIP (no </main>): {path}')
        return False
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return True

def main():
    for rel in TARGETS:
        path = os.path.join(BASE, rel)
        if not os.path.exists(path):
            print(f'  SKIP (missing): {rel}')
            continue
        if inject(path):
            print(f'  PATCHED: {rel}')
        else:
            print(f'  (already has capture): {rel}')

if __name__ == '__main__':
    main()
