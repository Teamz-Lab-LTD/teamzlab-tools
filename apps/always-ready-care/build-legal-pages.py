#!/usr/bin/env python3
"""
Generate Privacy Policy + Cookie Policy pages for UK, AU, NZ, IE.
Each reflects local data-protection law (UK-GDPR/DPA2018, AU Privacy Act 1988,
NZ Privacy Act 2020, EU GDPR for IE).

Output: /apps/always-ready-care/<region>/privacy/ + /cookies/
UK is root (/privacy, /cookies), others are subfolder based.
"""
import os, html

BASE = os.path.dirname(os.path.abspath(__file__))

COUNTRIES = {
    'uk': {
        'folder': '',
        'lang': 'en-GB',
        'law': 'UK GDPR, Data Protection Act 2018',
        'authority': 'Information Commissioner\'s Office (ICO)',
        'authority_url': 'https://ico.org.uk',
        'regulator': 'CQC',
        'transfer_basis': 'UK-EU adequacy decision + Standard Contractual Clauses',
    },
    'au': {
        'folder': 'au',
        'lang': 'en-AU',
        'law': 'Privacy Act 1988 (Cth), Australian Privacy Principles (APPs)',
        'authority': 'Office of the Australian Information Commissioner (OAIC)',
        'authority_url': 'https://www.oaic.gov.au',
        'regulator': 'ACQSC',
        'transfer_basis': 'APP 8 cross-border disclosure + enforceable contractual safeguards',
    },
    'nz': {
        'folder': 'nz',
        'lang': 'en-NZ',
        'law': 'Privacy Act 2020, Health Information Privacy Code 2020',
        'authority': 'Office of the Privacy Commissioner (OPC)',
        'authority_url': 'https://www.privacy.org.nz',
        'regulator': 'HealthCERT / DAA',
        'transfer_basis': 'IPP 12 overseas disclosure + contractual comparable protections',
    },
    'ie': {
        'folder': 'ie',
        'lang': 'en-IE',
        'law': 'GDPR, Data Protection Acts 1988-2018',
        'authority': 'Data Protection Commission (DPC)',
        'authority_url': 'https://www.dataprotection.ie',
        'regulator': 'HIQA',
        'transfer_basis': 'EU-US Data Privacy Framework + EU Standard Contractual Clauses',
    },
}

PRIVACY_TMPL = '''<!DOCTYPE html>
<html lang="{lang}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy — AlwaysReady Care {reg_label}</title>
    <meta name="description" content="Privacy policy for AlwaysReady Care. How we collect, use and protect personal information under {law}.">
    <link rel="canonical" href="{canonical}">
    <meta name="robots" content="noindex, follow">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="{manifest_path}">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{css_path}">
    <style>
      .lg-wrap{{max-width:820px;margin:0 auto;padding:24px 20px 64px;}}
      .lg-wrap h1{{font:700 clamp(24px,4vw,32px) Poppins,sans-serif;color:var(--heading);margin:0 0 10px;}}
      .lg-wrap h2{{font:600 20px Poppins,sans-serif;color:var(--heading);margin:28px 0 10px;}}
      .lg-wrap p,.lg-wrap li{{color:var(--text);line-height:1.7;}}
      .lg-wrap p{{margin:0 0 12px;}}
      .lg-wrap ul{{padding-left:22px;margin:0 0 12px;}}
      .lg-wrap li{{margin-bottom:4px;}}
      .lg-wrap a{{color:var(--accent);}}
      .lg-wrap strong{{color:var(--heading);}}
      .lg-block{{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:16px;}}
      .lg-note{{font-size:13px;color:var(--text-muted);}}
    </style>
</head>
<body>
    <a href="{back_href}" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>

    <main class="lg-wrap">
        <h1>Privacy Policy</h1>
        <p class="lg-note">This policy describes how AlwaysReady Care ({reg_label}) processes personal information under {law}. Last updated: April 2026.</p>

        <h2>1. Data Controller</h2>
        <div class="lg-block">
            <p><strong>Teamz Lab Ltd</strong> (registered in England &amp; Wales)</p>
            <p>Company number: <span data-fill="company-number">[to be filled]</span></p>
            <p>Registered office: <span data-fill="uk-address">[to be filled]</span></p>
            <p>Contact: <a href="mailto:hello@teamzlab.com">hello@teamzlab.com</a></p>
        </div>

        <h2>2. What we collect and why</h2>
        <p><strong>Local-only tools (checklists, calculators, checklist generators):</strong> your inputs stay in your browser (localStorage). <strong>We do not receive or store them.</strong></p>
        <p><strong>AlwaysReady Care app (login required):</strong> if you sign up, we process:</p>
        <ul>
            <li>Email address (authentication)</li>
            <li>Name (sometimes; if you add it)</li>
            <li>Organisation / facility name</li>
            <li>Evidence records you create (to provide the compliance service)</li>
            <li>IP address for security / abuse prevention (short retention)</li>
        </ul>
        <p>Processing is via Google Firebase (Firebase Auth, Firestore, Firebase Hosting). A Data Processing Agreement is in place with Google.</p>

        <h2>3. Legal basis</h2>
        <p>We rely on:</p>
        <ul>
            <li><strong>Contract</strong> — to provide the service when you have an account</li>
            <li><strong>Legitimate interest</strong> — for security, fraud prevention and to improve our service</li>
            <li><strong>Consent</strong> — for any optional marketing updates (you can withdraw at any time)</li>
            <li><strong>Legal obligation</strong> — when required to retain records by law</li>
        </ul>

        <h2>4. Third-party services</h2>
        <ul>
            <li><strong>Google Fonts</strong> (Poppins) — your IP is briefly transmitted to Google when loading fonts</li>
            <li><strong>Cloudflare CDN / cdnjs</strong> — serves Font Awesome icons</li>
            <li><strong>Firebase (Google)</strong> — authentication + database (only if you register)</li>
            <li><strong>GitHub Pages</strong> — static site hosting</li>
        </ul>

        <h2>5. International transfers</h2>
        <p>Some service providers are located outside {jurisdiction}. Transfers rely on: {transfer_basis}.</p>

        <h2>6. Retention</h2>
        <ul>
            <li>Browser localStorage: as long as you keep it (you can clear any time)</li>
            <li>Account data: until you delete your account</li>
            <li>Evidence records (care-related): retained per {reg} requirements — typically 7-10 years</li>
            <li>Server/log data: 30 days</li>
            <li>Contact enquiries: 6 months unless business relationship continues</li>
        </ul>

        <h2>7. Your rights</h2>
        <p>Under {law} you have rights to:</p>
        <ul>
            <li>Access the personal information we hold</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion (subject to legal retention requirements)</li>
            <li>Restrict or object to processing</li>
            <li>Portability (receive a copy in a common format)</li>
            <li>Complain to {authority} — <a href="{authority_url}" target="_blank" rel="noopener">{authority_url}</a></li>
        </ul>
        <p>To exercise any of these rights, contact <a href="mailto:hello@teamzlab.com">hello@teamzlab.com</a>. We respond within statutory timeframes.</p>

        <h2>8. Cookies</h2>
        <p>We do not use tracking cookies, Google Analytics, or advertising pixels on this site. See our <a href="{cookies_href}">Cookie Policy</a> for full details.</p>

        <h2>9. Security</h2>
        <p>Data in transit uses TLS. Account data is stored in Firebase with Google-managed encryption at rest. We follow secure-by-default practices — no public access to user data.</p>

        <h2>10. Changes</h2>
        <p>We may update this policy from time to time. The "Last updated" date at the top reflects the most recent change.</p>

        <p class="lg-note">This policy is provided for transparency and does not constitute legal advice. For specific compliance questions contact a data protection professional.</p>
    </main>
</body>
</html>
'''

COOKIES_TMPL = '''<!DOCTYPE html>
<html lang="{lang}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cookie Policy — AlwaysReady Care {reg_label}</title>
    <meta name="description" content="Cookie Policy for AlwaysReady Care. Why we don't use tracking cookies and what functional storage we do use.">
    <link rel="canonical" href="{canonical}">
    <meta name="robots" content="noindex, follow">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="{manifest_path}">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{css_path}">
    <style>
      .lg-wrap{{max-width:820px;margin:0 auto;padding:24px 20px 64px;}}
      .lg-wrap h1{{font:700 clamp(24px,4vw,32px) Poppins,sans-serif;color:var(--heading);margin:0 0 10px;}}
      .lg-wrap h2{{font:600 20px Poppins,sans-serif;color:var(--heading);margin:28px 0 10px;}}
      .lg-wrap p{{color:var(--text);line-height:1.7;margin:0 0 12px;}}
      .lg-wrap a{{color:var(--accent);}}
      .lg-wrap strong{{color:var(--heading);}}
      .lg-wrap table{{width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;}}
      .lg-wrap th,.lg-wrap td{{padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;}}
      .lg-wrap th{{color:var(--heading);background:var(--surface);}}
      .lg-note{{font-size:13px;color:var(--text-muted);}}
    </style>
</head>
<body>
    <a href="{back_href}" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>

    <main class="lg-wrap">
        <h1>Cookie Policy</h1>
        <p class="lg-note">Last updated: April 2026. This policy explains cookie-like technologies AlwaysReady Care uses under {law}.</p>

        <h2>TL;DR — we don't track you</h2>
        <p>AlwaysReady Care does <strong>not</strong> set tracking cookies, Google Analytics, advertising pixels, Facebook Pixel, TikTok Pixel, or any behavioural tracking. We don't sell or share your data.</p>

        <h2>What we do use</h2>
        <p>Like most modern web apps, we use browser <strong>localStorage</strong> for functionality. This is not technically a cookie, but regulators treat it similarly for transparency purposes.</p>

        <table>
            <thead><tr><th>Name</th><th>Purpose</th><th>Duration</th></tr></thead>
            <tbody>
                <tr><td>arc-region</td><td>Remembers your regional variant (UK/AU/NZ/IE/DE)</td><td>Until you clear it</td></tr>
                <tr><td>arc-chk-* / arc-sis-* / arc-qi-* etc.</td><td>Saves your in-tool progress (checklists, formularies, calculators)</td><td>Until you clear it</td></tr>
                <tr><td>firebaseLocalStorage (only when logged in)</td><td>Authentication token to keep your AlwaysReady Care session active</td><td>Until logout or token expiry</td></tr>
                <tr><td>theme</td><td>Remembers your dark/light preference</td><td>Until you clear it</td></tr>
            </tbody>
        </table>

        <p>All localStorage entries live on your device only. They never leave your browser unless you explicitly log in — in which case only the Firebase auth token is transmitted to Google (per our <a href="{privacy_href}">Privacy Policy</a>).</p>

        <h2>Third-party requests (not cookies)</h2>
        <p>Loading our pages makes these HTTPS requests, which may transmit your IP address to the provider:</p>
        <ul>
            <li>Google Fonts (Poppins)</li>
            <li>Cloudflare cdnjs (Font Awesome icons)</li>
            <li>GitHub Pages (our host)</li>
        </ul>
        <p>These are necessary to display the page. They do not set tracking cookies.</p>

        <h2>How to clear storage</h2>
        <p>Any modern browser can clear localStorage. See <a href="https://support.google.com/chrome/answer/2392709" target="_blank" rel="noopener">Chrome</a>, <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener">Firefox</a>, <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener">Safari</a>.</p>

        <h2>Contact</h2>
        <p>Questions? Contact <a href="mailto:hello@teamzlab.com">hello@teamzlab.com</a>.</p>
    </main>
</body>
</html>
'''


def render_privacy(code, cfg):
    folder = cfg['folder']
    if folder:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/privacy/'
        css_path = '../../css/app.css'
        manifest_path = '../manifest.json'
        back_href = '../'
        cookies_href = '../cookies/'
    else:
        canonical = 'https://tool.teamzlab.com/apps/always-ready-care/privacy/'
        css_path = '../css/app.css'
        manifest_path = '../manifest.json'
        back_href = '../'
        cookies_href = '../cookies/'

    jurisdiction = {'uk':'the United Kingdom','au':'Australia','nz':'New Zealand','ie':'the European Economic Area'}[code]
    reg_label = {'uk':'(UK)','au':'(Australia)','nz':'(New Zealand)','ie':'(Ireland)'}[code]

    return PRIVACY_TMPL.format(
        lang=cfg['lang'], reg_label=reg_label, canonical=canonical,
        manifest_path=manifest_path, css_path=css_path, back_href=back_href,
        cookies_href=cookies_href, law=cfg['law'], jurisdiction=jurisdiction,
        transfer_basis=cfg['transfer_basis'], reg=cfg['regulator'],
        authority=cfg['authority'], authority_url=cfg['authority_url']
    )


def render_cookies(code, cfg):
    folder = cfg['folder']
    if folder:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/cookies/'
        css_path = '../../css/app.css'
        manifest_path = '../manifest.json'
        back_href = '../'
        privacy_href = '../privacy/'
    else:
        canonical = 'https://tool.teamzlab.com/apps/always-ready-care/cookies/'
        css_path = '../css/app.css'
        manifest_path = '../manifest.json'
        back_href = '../'
        privacy_href = '../privacy/'

    reg_label = {'uk':'(UK)','au':'(Australia)','nz':'(New Zealand)','ie':'(Ireland)'}[code]

    return COOKIES_TMPL.format(
        lang=cfg['lang'], reg_label=reg_label, canonical=canonical,
        manifest_path=manifest_path, css_path=css_path, back_href=back_href,
        privacy_href=privacy_href, law=cfg['law']
    )


def main():
    for code, cfg in COUNTRIES.items():
        folder = cfg['folder']
        base = os.path.join(BASE, folder) if folder else BASE
        for page_type, render_fn in [('privacy', render_privacy), ('cookies', render_cookies)]:
            out_dir = os.path.join(base, page_type)
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, 'index.html')
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(render_fn(code, cfg))
            rel = os.path.relpath(out_path, BASE)
            print(f'BUILT: {rel}')


if __name__ == '__main__':
    main()
