#!/usr/bin/env python3
"""
Patch the onclick handler of the EN-translate toggle to:
1) Guard against localhost (Google proxy won't translate non-public hosts).
2) On localhost, show a friendly notice instead of a broken redirect.

Applies to:
- every /de/**/index.html file containing id="lang-toggle-en"
- build-expertenstandards.py and build-bundeslaender.py (so regens use the new handler)
- apply-en-toggle.py (for future injections into new pages)

Re-runnable: string-level replace of the old handler for the new one.
"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

OLD_ONCLICK = (
    "onclick=\"var h=location.hostname.replace(/\\./g,'-');"
    "window.location='https://'+h+'.translate.goog'+location.pathname+"
    "'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';return false;\""
)

# Compact single-line onclick — detects localhost/private IPs and falls back gracefully.
NEW_ONCLICK = (
    "onclick=\"var h=location.hostname;"
    "if(h==='localhost'||/^127\\.|^192\\.168\\.|^10\\.|^172\\.(1[6-9]|2[0-9]|3[01])\\./.test(h)||h===''){"
    "alert('Auto-Übersetzung funktioniert nur auf der Live-Website tool.teamzlab.com.\\n\\n"
    "Auto-translate works only on the live site, not on localhost.');return false;}"
    "window.location='https://'+h.replace(/\\./g,'-')+'.translate.goog'+location.pathname+"
    "'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';return false;\""
)

# Same strings but escaped differently in the Python source (.py files)
OLD_ONCLICK_PY = (
    "onclick=\"var h=location.hostname.replace(/\\\\./g,'-');"
    "window.location='https://'+h+'.translate.goog'+location.pathname+"
    "'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';return false;\""
)
NEW_ONCLICK_PY = (
    "onclick=\"var h=location.hostname;"
    "if(h==='localhost'||/^127\\\\.|^192\\\\.168\\\\.|^10\\\\.|^172\\\\.(1[6-9]|2[0-9]|3[01])\\\\./.test(h)||h===''){"
    "alert('Auto-Übersetzung funktioniert nur auf der Live-Website tool.teamzlab.com.\\\\n\\\\n"
    "Auto-translate works only on the live site, not on localhost.');return false;}"
    "window.location='https://'+h.replace(/\\\\./g,'-')+'.translate.goog'+location.pathname+"
    "'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';return false;\""
)


def patch_file(path, old, new):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old not in content:
        return False
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return True


def main():
    patched_html = 0
    for root, _, files in os.walk(os.path.join(BASE, 'de')):
        for name in files:
            if name != 'index.html':
                continue
            path = os.path.join(root, name)
            if patch_file(path, OLD_ONCLICK, NEW_ONCLICK):
                patched_html += 1
                print(f'  PATCHED: {os.path.relpath(path, BASE)}')
    print(f'\nHTML pages patched: {patched_html}')

    for py_name in ('build-expertenstandards.py', 'build-bundeslaender.py', 'apply-en-toggle.py'):
        py_path = os.path.join(BASE, py_name)
        if not os.path.exists(py_path):
            continue
        if patch_file(py_path, OLD_ONCLICK_PY, NEW_ONCLICK_PY):
            print(f'  PATCHED generator: {py_name}')
        else:
            print(f'  (no change needed): {py_name}')


if __name__ == '__main__':
    main()
