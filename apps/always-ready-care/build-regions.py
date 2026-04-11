#!/usr/bin/env python3
"""
Build regional landing pages (AU, NZ, IE) from the main UK index.html.
Each gets its own <head> for SEO but shares the same <body>.
Run after editing index.html to keep regional pages in sync.

Usage: python3 build-regions.py
"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))
MAIN = os.path.join(BASE, 'index.html')

with open(MAIN, 'r') as f:
    main_html = f.read()

# Extract body (from <body> to </html>)
body_match = re.search(r'(<body>.*</html>)', main_html, re.DOTALL)
if not body_match:
    print('ERROR: Could not find <body> in index.html')
    exit(1)

body = body_match.group(1)

# Fix asset paths for subdirectory
body = body.replace('href="css/', 'href="../css/')
body = body.replace('href="guide.html', 'href="../guide.html')
body = body.replace('href="manifest.json', 'href="../manifest.json')
body = body.replace('href="icons/', 'href="../icons/')
body = body.replace('src="js/', 'src="../js/')
# Fix service worker path
body = body.replace("register('/apps/always-ready-care/sw.js'", "register('/apps/always-ready-care/sw.js'")

# Static H1 and badge text per region (for Googlebot — JS also localises at runtime)
REGION_H1 = {
    'au': 'Aged Care Compliance Software That Keeps You Audit-Ready Every Day',
    'nz': 'Rest Home Compliance Software That Keeps You Audit-Ready Every Day',
    'ie': 'Nursing Home Compliance Software That Keeps You HIQA-Ready Every Day',
}
REGION_BADGE = {
    'au': 'Free Aged Care Software Australia',
    'nz': 'Free Rest Home Software New Zealand',
    'ie': 'Free Nursing Home Software Ireland',
}

REGIONS = {
    'au': {
        'lang': 'en-AU',
        'title': 'Aged Care Compliance Software Australia \u2014 Free Tool',
        'description': 'Free ACQS compliance software for Australian aged care. Record evidence in 60 seconds, track 24 categories, generate assessment packs. SIRS ready.',
        'og_title': 'Aged Care Compliance Software Australia',
        'og_description': 'Free aged care compliance tool. Track 24 ACQS categories, generate assessment packs. SIRS reporting built in. No rip-and-replace.',
        'twitter_title': 'Aged Care Compliance Software Australia',
        'twitter_description': 'Free ACQS compliance tool for Australian aged care. Track 24 categories, generate assessment packs, SIRS reporting included.',
        'keywords': 'aged care compliance software australia, aged care quality standards software, ACQS 2025 compliance tool, aged care audit tool australia, aged care quality and safety commission, SIRS reporting software, aged care facility management software, best aged care software australia, free aged care compliance tool, aged care evidence capture, quality assessment evidence pack, strengthened quality standards software, aged care governance tool, residential aged care compliance',
        'schema_desc': 'Free aged care compliance software for Australian providers. Record ACQS-ready evidence in 60 seconds, track compliance across 24 categories mapped to 7 Strengthened Quality Standards, generate assessment packs instantly. SIRS incident reporting included.',
        'schema_currency': 'AUD',
        'schema_price_desc': 'Free to start. Pro plans from A$129/month per facility.',
        'schema_features': 'Evidence capture, AI structuring, Compliance dashboard, ACQS assessment packs, SIRS reporting, Follow-up action tracking, Multi-site management',
        'faqs': [
            ('What is aged care compliance software?', 'Aged care compliance software helps Australian facilities capture, organise, and export evidence that proves they meet the Strengthened Aged Care Quality Standards (ACQS 2025) across 7 standards. AlwaysReady Care tracks 24 compliance categories in under 60 seconds per record.'),
            ('How do I prepare for an ACQSC quality assessment?', 'Preparing for a quality assessment requires continuous evidence collection across categories like clinical care, medication, infection prevention, and governance. AlwaysReady Care tracks 24 categories mapped to the 7 Strengthened Standards, showing your readiness score in real-time.'),
            ('What is the SIRS reporting scheme?', 'The Serious Incident Response Scheme (SIRS) requires aged care providers to report priority 1 incidents within 24 hours and priority 2 within 30 days to the Commission. AlwaysReady Care includes SIRS incident templates with automatic priority classification.'),
            ('What is the best aged care software Australia?', 'For full care management, options include AlayaCare, Statura Care, and MYP. For compliance evidence specifically, AlwaysReady Care works alongside any existing system as a dedicated evidence layer \u2014 no rip-and-replace needed.'),
            ('Is this aged care software free?', 'AlwaysReady Care is free to start with full evidence capture, compliance tracking, and assessment pack generation. Pro plans with advanced features start from A$129 per facility per month.'),
        ],
    },
    'nz': {
        'lang': 'en-NZ',
        'title': 'Rest Home Compliance Software NZ \u2014 Free Audit Tool',
        'description': 'Free NZS 8134 compliance software for NZ rest homes. Record evidence in 60 seconds, track 20 categories, generate audit packs for certification.',
        'og_title': 'Rest Home Compliance Software New Zealand',
        'og_description': 'Free rest home compliance tool. Capture evidence, track 20 NZS 8134 categories, generate audit packs. Works alongside VCare. No rip-and-replace.',
        'twitter_title': 'Rest Home Compliance Software NZ \u2014 Free Tool',
        'twitter_description': 'Free NZS 8134 compliance tool for NZ rest homes. Track 20 categories, generate audit packs for certification audits.',
        'keywords': 'rest home compliance software new zealand, rest home software nz, NZS 8134 compliance tool, aged care software new zealand, certification audit tool nz, rest home audit software, aged residential care compliance, health and disability services standards software, designated auditing agency, rest home management software, best rest home software nz, free rest home compliance tool, rest home evidence capture, nz aged care governance',
        'schema_desc': 'Free rest home compliance software for New Zealand providers. Record audit-ready evidence in 60 seconds, track compliance across 20 categories mapped to NZS 8134 Health and Disability Services Standards, generate audit packs for certification audits instantly.',
        'schema_currency': 'NZD',
        'schema_price_desc': 'Free to start. Pro plans from NZ$99/month per facility.',
        'schema_features': 'Evidence capture, AI structuring, Compliance dashboard, NZS 8134 audit packs, Follow-up action tracking, Multi-site management, Restraint minimisation tracking',
        'faqs': [
            ('What is rest home compliance software?', 'Rest home compliance software helps New Zealand aged residential care facilities capture, organise, and export evidence that proves they meet NZS 8134 Health and Disability Services Standards across 4 standards. AlwaysReady Care tracks 20 categories in under 60 seconds per record.'),
            ('How do I prepare for a certification audit?', 'Preparing for a certification audit requires continuous evidence collection across categories like consumer rights, clinical care, medication management, and organisational management. AlwaysReady Care tracks 20 categories mapped to NZS 8134.1 through 8134.4, showing your readiness score in real-time.'),
            ('How does the NZS 8134 certification cycle work?', 'New Zealand rest homes undergo certification audits by Designated Auditing Agencies on a 3-year cycle. Facilities must demonstrate continuous compliance with NZS 8134 standards between audits. AlwaysReady Care helps maintain audit-readiness throughout the cycle.'),
            ('What is the best rest home software New Zealand?', 'For full care management, VCare is the market leader. For compliance evidence specifically, AlwaysReady Care works alongside any existing system as a dedicated evidence layer \u2014 no rip-and-replace needed.'),
            ('Is this rest home software free?', 'AlwaysReady Care is free to start with full evidence capture, compliance tracking, and audit pack generation. Pro plans with advanced features start from NZ$99 per facility per month.'),
        ],
    },
    'ie': {
        'lang': 'en-IE',
        'title': 'Nursing Home Compliance Software Ireland \u2014 Free Tool',
        'description': 'Free HIQA compliance software for Irish nursing homes. Record evidence in 60 seconds, track 20 categories mapped to 8 National Standards.',
        'og_title': 'Nursing Home Compliance Software Ireland',
        'og_description': 'Free nursing home compliance tool. Capture evidence, track 20 HIQA categories, generate inspection packs. Works alongside any care system. No rip-and-replace.',
        'twitter_title': 'Nursing Home Compliance Software Ireland',
        'twitter_description': 'Free HIQA compliance tool for Irish nursing homes. Track 20 categories, generate inspection packs instantly.',
        'keywords': 'nursing home compliance software ireland, HIQA compliance software, nursing home software ireland, HIQA inspection tool, nursing home audit software ireland, designated centre compliance, national standards residential care, HIQA readiness tool, best nursing home software ireland, free nursing home compliance tool, nursing home evidence capture, HIQA inspection checklist, nursing home governance tool, health act 2007 compliance',
        'schema_desc': 'Free nursing home compliance software for Irish care providers. Record HIQA-ready evidence in 60 seconds, track compliance across 20 categories mapped to 8 National Standards for Residential Care, generate inspection packs instantly.',
        'schema_currency': 'EUR',
        'schema_price_desc': 'Free to start. Pro plans from \u20ac89/month per centre.',
        'schema_features': 'Evidence capture, AI structuring, Compliance dashboard, HIQA inspection packs, Follow-up action tracking, Multi-site management',
        'faqs': [
            ('What is HIQA compliance software?', 'HIQA compliance software helps Irish nursing homes capture, organise, and export evidence that proves they meet the National Standards for Residential Care Settings across 8 themes. AlwaysReady Care tracks 20 categories in under 60 seconds per record.'),
            ('How do I prepare for a HIQA inspection?', 'Preparing for a HIQA inspection requires continuous evidence collection across areas like person-centred care, safe services, and governance. AlwaysReady Care tracks 20 categories mapped to the National Standards, showing your readiness score in real-time.'),
            ('What triggers a HIQA inspection?', 'HIQA inspections can be triggered by complaints, notifiable incidents, risk assessments, or routine scheduling. Having continuous, well-structured evidence ensures your designated centre is ready whenever an inspection happens.'),
            ('What is the best nursing home software Ireland?', 'For compliance evidence specifically, AlwaysReady Care works alongside any existing system as a dedicated evidence layer. It covers all 8 HIQA National Standards themes with 20 compliance categories.'),
            ('Is this nursing home software free?', 'AlwaysReady Care is free to start with full evidence capture, compliance tracking, and inspection pack generation. Pro plans with advanced features start from \u20ac89 per centre per month.'),
        ],
    },
}

import json

def build_faq_schema(faqs):
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in faqs
        ]
    }, indent=2)

def build_app_schema(r, region_code):
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "AlwaysReady Care",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "description": r['schema_desc'],
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": r['schema_currency'],
            "description": r['schema_price_desc']
        },
        "featureList": r['schema_features'],
        "url": f"https://tool.teamzlab.com/apps/always-ready-care/{region_code}/",
        "publisher": {"@type": "Organization", "name": "Teamz Lab Ltd"}
    }, indent=2)

BASE_URL = 'https://tool.teamzlab.com/apps/always-ready-care'

for region_code, r in REGIONS.items():
    head = f'''    <title>{r["title"]}</title>
    <meta name="description" content="{r["description"]}">
    <link rel="canonical" href="{BASE_URL}/{region_code}/">
    <meta property="og:title" content="{r["og_title"]}">
    <meta property="og:description" content="{r["og_description"]}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{BASE_URL}/{region_code}/">
    <meta property="og:site_name" content="AlwaysReady Care">
    <meta property="og:image" content="https://tool.teamzlab.com/apps/always-ready-care/icons/icon-512.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{r["twitter_title"]}">
    <meta name="twitter:description" content="{r["twitter_description"]}">
    <meta name="keywords" content="{r["keywords"]}">
    <link rel="alternate" hreflang="en-GB" href="{BASE_URL}/">
    <link rel="alternate" hreflang="en-AU" href="{BASE_URL}/au/">
    <link rel="alternate" hreflang="en-NZ" href="{BASE_URL}/nz/">
    <link rel="alternate" hreflang="en-IE" href="{BASE_URL}/ie/">
    <link rel="alternate" hreflang="x-default" href="{BASE_URL}/">
    <script type="application/ld+json">
{build_app_schema(r, region_code)}
    </script>
    <script type="application/ld+json">
{build_faq_schema(r["faqs"])}
    </script>'''

    html = f'''<!DOCTYPE html>
<html lang="{r["lang"]}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
{head}
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="../manifest.json">
    <meta name="theme-color" content="#12151A">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="AlwaysReady Care">
    <link rel="apple-touch-icon" href="../icons/icon-192.png">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="msapplication-TileColor" content="#12151A">
    <meta name="msapplication-TileImage" content="../icons/icon-144.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../css/app.css">
    <script>localStorage.setItem('arc-region','{region_code}');</script>
</head>
{body}
'''

    # Post-process: Replace UK content with region-specific text for Googlebot
    if region_code in REGION_H1:
        html = re.sub(
            r'(<h1 class="landing-h1">)[^<]*(</h1>)',
            r'\1' + REGION_H1[region_code] + r'\2',
            html
        )
    if region_code in REGION_BADGE:
        html = re.sub(
            r'(class="landing-badge"><i class="fas fa-shield-heart"></i>) [^<]*(</div>)',
            r'\1 ' + REGION_BADGE[region_code] + r'\2',
            html
        )

    # Problem banner — localise for Googlebot
    PROBLEM_LINE1 = {
        'au': "Aged care facilities don't fail assessments because of bad care.",
        'nz': "Rest homes don't fail audits because of bad care.",
        'ie': "Nursing homes don't fail inspections because of bad care.",
    }
    PROBLEM_LINE2 = {
        'au': 'They fail because their evidence is scattered across WhatsApp, paper notes, and spreadsheets. When the assessor arrives, managers spend hours pulling records together. We fix that.',
        'nz': 'They fail because their evidence is scattered across WhatsApp, paper notes, and spreadsheets. When the auditor arrives, managers spend hours pulling records together. We fix that.',
        'ie': 'They fail because their evidence is scattered across WhatsApp, paper notes, and spreadsheets. When the inspector arrives, managers spend hours pulling records together. We fix that.',
    }
    if region_code in PROBLEM_LINE1:
        html = html.replace(
            "Care homes don't fail inspections because of bad care.",
            PROBLEM_LINE1[region_code]
        )
        html = html.replace(
            "They fail because their evidence is scattered across WhatsApp, paper notes, and spreadsheets. When the inspector arrives, managers spend hours pulling records together. We fix that.",
            PROBLEM_LINE2[region_code]
        )

    # Hero subtitle — localise for Googlebot
    HERO_SUB = {
        'au': 'Record care evidence in 60 seconds. AI auto-tags it to the right ACQS category. See your readiness score live across 24 categories. Generate a professional assessment pack in one click. Works alongside your existing system.',
        'nz': 'Record care evidence in 60 seconds. AI auto-tags it to the right NZS 8134 category. See your readiness score live across 20 categories. Generate a professional audit pack in one click. Works alongside your existing system.',
        'ie': 'Record care evidence in 60 seconds. AI auto-tags it to the right HIQA category. See your readiness score live across 20 categories. Generate a professional inspection pack in one click. Works alongside your existing system.',
    }
    if region_code in HERO_SUB:
        html = html.replace(
            "Record care evidence in 60 seconds. AI auto-tags it to the right compliance category. See your readiness score live. Generate a professional inspection pack in one click. Works alongside your existing system \u2014 no rip-and-replace.",
            HERO_SUB[region_code]
        )

    outdir = os.path.join(BASE, region_code)
    os.makedirs(outdir, exist_ok=True)
    outpath = os.path.join(outdir, 'index.html')
    with open(outpath, 'w') as f:
        f.write(html)
    print(f'BUILT: {region_code}/index.html ({len(html)} bytes)')

print('Done. Run this again after editing index.html to keep regions in sync.')
