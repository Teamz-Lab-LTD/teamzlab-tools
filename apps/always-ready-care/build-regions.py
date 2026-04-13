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
    'de': 'Pflegesoftware f\u00fcr die MD-Pr\u00fcfung \u2014 jeden Tag pr\u00fcfbereit',
    'de-en': 'Care Compliance Software for German MD Audits \u2014 SGB XI Ready Every Day',
}
REGION_BADGE = {
    'au': 'Free Aged Care Software Australia',
    'nz': 'Free Rest Home Software New Zealand',
    'ie': 'Free Nursing Home Software Ireland',
    'de': 'Kostenlose Pflegesoftware Deutschland',
    'de-en': 'Free Care Compliance Software Germany',
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
    'de': {
        'lang': 'de-DE',
        'title': 'Pflegesoftware f\u00fcr die MD-Pr\u00fcfung \u2014 Kostenlos',
        'description': 'Kostenlose Pflegesoftware f\u00fcr die MD-Pr\u00fcfung nach SGB XI. Pflegedokumentation in 60 Sekunden, 24 Kategorien nach QPR, Pr\u00fcfungsmappe per Klick.',
        'og_title': 'Pflegesoftware Deutschland \u2014 MD-Pr\u00fcfung jederzeit bereit',
        'og_description': 'Kostenlose Software f\u00fcr Pflegeeinrichtungen. Nachweise erfassen, 24 QPR-Kategorien verfolgen, MD-Pr\u00fcfungsmappen erstellen. DSGVO-konform, ohne Systemwechsel.',
        'twitter_title': 'Pflegesoftware f\u00fcr MD-Pr\u00fcfung \u2014 Kostenlos',
        'twitter_description': 'Kostenlose Pflegesoftware Deutschland. 24 Kategorien nach QPR-Qualit\u00e4tsbereichen, Expertenstandards des DNQP, SGB XI konform.',
        'keywords': 'pflegesoftware, pflegesoftware deutschland, pflegesoftware kostenlos, md pr\u00fcfung pflegeheim, md pr\u00fcfung ambulante pflege, md pr\u00fcfung 2026, qualit\u00e4tspr\u00fcfung pflegeheim, pflegedokumentation software, pflegedoku software, qpr station\u00e4r, qpr ambulant, expertenstandards pflege, expertenstandards dnqp, dekubitusprophylaxe, sturzprophylaxe, sgb xi pflegeeinrichtung, pflegeheim software, ambulanter pflegedienst software, checkliste md pr\u00fcfung, indikatorengest\u00fctzte qualit\u00e4tspr\u00fcfung, qualit\u00e4tsindikatoren pflege, sis pflegedokumentation, strukturierte informationssammlung, heimaufsicht software, pflegequalit\u00e4t',
        'schema_desc': 'Kostenlose Pflegesoftware f\u00fcr die MD-Pr\u00fcfung. Pflegedokumentation in 60 Sekunden nach SIS-Struktur erfassen, 24 Kategorien verfolgen entsprechend der 6 QPR-Qualit\u00e4tsbereiche und 9 DNQP-Expertenstandards, Pr\u00fcfungsmappen f\u00fcr die MD-Pr\u00fcfung per Klick erstellen. F\u00fcr Pflegeheime und ambulante Pflegedienste nach SGB XI.',
        'schema_currency': 'EUR',
        'schema_price_desc': 'Kostenlos zum Starten. Pro-Pl\u00e4ne ab 99 \u20ac/Monat pro Einrichtung.',
        'schema_features': 'Pflegedokumentation, KI-Strukturierung, Compliance-Dashboard, MD-Pr\u00fcfungsmappe, QPR-Kategorien, DNQP-Expertenstandards, Ma\u00dfnahmen-Tracking, Multi-Einrichtungs-Verwaltung, SIS-konform',
        'faqs': [
            ('Was ist eine Pflegesoftware f\u00fcr die MD-Pr\u00fcfung?', 'Eine Pflegesoftware f\u00fcr die MD-Pr\u00fcfung hilft Pflegeeinrichtungen in Deutschland, Nachweise zu erfassen, zu strukturieren und zu exportieren, die die Qualit\u00e4t nach den Qualit\u00e4tspr\u00fcfungs-Richtlinien (QPR) des Qualit\u00e4tsausschusses Pflege belegen. AlwaysReady Care verfolgt 24 Kategorien entsprechend der 6 QPR-Qualit\u00e4tsbereiche in unter 60 Sekunden pro Eintrag.'),
            ('Wie bereite ich mich auf die MD-Pr\u00fcfung vor?', 'Die Vorbereitung auf eine MD-Pr\u00fcfung (fr\u00fcher MDK) erfordert kontinuierliche Nachweise in Bereichen wie Mobilit\u00e4t, Medikamentenmanagement, Dekubitusprophylaxe, Schmerzmanagement und Qualit\u00e4tsmanagement. AlwaysReady Care bildet alle 24 Kategorien nach den QPR-Qualit\u00e4tsbereichen ab und zeigt Ihren Pr\u00fcfungsstand in Echtzeit.'),
            ('Wie oft findet die MD-Pr\u00fcfung statt?', 'Nach \u00a7 114 SGB XI pr\u00fcft der Medizinische Dienst (MD) station\u00e4re Pflegeeinrichtungen und ambulante Pflegedienste einmal pro Jahr unangek\u00fcndigt. Seit 2019 erfolgt die Pr\u00fcfung indikatorengest\u00fctzt \u2014 kontinuierliche Nachweise sind daher unverzichtbar.'),
            ('Ist diese Pflegesoftware DSGVO-konform?', 'Ja. AlwaysReady Care erf\u00fcllt die Anforderungen der DSGVO, des BDSG sowie das Sozialgeheimnis nach SGB X. Daten werden verschl\u00fcsselt gespeichert und entsprechen den Aufbewahrungsfristen f\u00fcr Pflegedokumentation (mindestens 10 Jahre gem\u00e4\u00df SGB XI).'),
            ('Welche Expertenstandards deckt die Software ab?', 'Die Software ber\u00fccksichtigt alle 9 DNQP-Expertenstandards: Dekubitusprophylaxe, Entlassungsmanagement, Schmerzmanagement, Sturzprophylaxe, Kontinenzf\u00f6rderung, Wundversorgung, Ern\u00e4hrungsmanagement, Demenz sowie Mobilit\u00e4tsf\u00f6rderung \u2014 jeweils mit eigenen Vorlagen.'),
            ('Was kostet diese Pflegesoftware?', 'AlwaysReady Care ist kostenlos nutzbar mit vollst\u00e4ndiger Pflegedokumentation, Compliance-Tracking und Pr\u00fcfungsmappen-Generierung. Pro-Pl\u00e4ne mit erweiterten Funktionen beginnen bei 99 \u20ac pro Einrichtung und Monat.'),
        ],
    },
    'de-en': {
        'lang': 'en-DE',
        'title': 'Care Compliance Software Germany \u2014 Free MD Audit Tool',
        'description': 'Free care compliance software for German nursing homes & home care services. MD audit-ready evidence, 24 QPR categories, SGB XI compliant. English interface.',
        'og_title': 'Care Compliance Software Germany \u2014 MD Audit Ready',
        'og_description': 'Free compliance tool for Pflegeeinrichtungen in Germany. Track 24 QPR categories, 9 DNQP expert standards, generate MD audit packs. English UI, SGB XI compliant.',
        'twitter_title': 'Care Compliance Software Germany \u2014 Free MD Audit Tool',
        'twitter_description': 'Free SGB XI compliance tool for German care providers. English interface, 24 QPR categories, MD audit packs. Works alongside Vivendi, Medifox, SNAP.',
        'keywords': 'care compliance software germany, pflegesoftware english, nursing home software germany, german care home software, MD audit software, MDK audit software, SGB XI compliance software, QPR compliance tool, pflegeeinrichtung software english, ambulante pflege software english, expertenstandards english, DNQP english, pflege TUV software, indikatorengestutzte qualitatsprufung, Medizinischer Dienst audit, vivendi alternative, medifox alternative, snap alternative, german nursing home compliance, international care operator germany, korian germany, alloheim, orpea germany',
        'schema_desc': 'Free care compliance software for Germany. Record MD-ready evidence in 60 seconds, track compliance across 24 categories mapped to the 6 QPR Qualit\u00e4tsbereiche and 9 DNQP expert standards, generate MD audit packs instantly. For Pflegeheime and ambulante Pflegedienste under SGB XI. English interface for international operators.',
        'schema_currency': 'EUR',
        'schema_price_desc': 'Free to start. Pro plans from \u20ac99/month per facility.',
        'schema_features': 'Evidence capture, AI structuring, Compliance dashboard, MD audit packs, QPR categories, DNQP expert standards, Action tracking, Multi-facility management, SIS-compliant documentation',
        'faqs': [
            ('What is care compliance software for Germany?', 'Care compliance software for Germany helps Pflegeeinrichtungen (nursing homes and home care services) capture, organise, and export evidence that proves quality under the Qualit\u00e4tspr\u00fcfungs-Richtlinien (QPR) issued by the Qualit\u00e4tsausschuss Pflege. AlwaysReady Care tracks 24 categories aligned to the 6 QPR Qualit\u00e4tsbereiche in under 60 seconds per record.'),
            ('What is the MD audit in Germany?', 'The MD-Pr\u00fcfung (Medical Service audit, formerly MDK until 2020) is an unannounced annual inspection under \u00a7 114 SGB XI. Since 2019 it uses indicator-based quality assessment (indikatorengest\u00fctzte Qualit\u00e4tspr\u00fcfung) replacing the old Pflege-TUV grades. Continuous evidence is essential.'),
            ('Does it work alongside Vivendi, Medifox or SNAP?', 'Yes. AlwaysReady Care is a dedicated evidence layer designed to sit alongside existing German care management systems such as Vivendi, Medifox, SNAP or DAN. No rip-and-replace \u2014 we handle MD audit evidence while your primary system handles care planning and billing.'),
            ('Is this software GDPR & SGB X compliant?', 'Yes. AlwaysReady Care is built for GDPR (DSGVO), the German Federal Data Protection Act (BDSG) and the social data secrecy requirements of SGB X. Data is encrypted and retained according to the minimum 10-year documentation requirement under SGB XI.'),
            ('Which expert standards does it cover?', 'The tool covers all 9 DNQP expert standards (Expertenstandards): pressure ulcer prevention, discharge management, pain management, falls prevention, continence promotion, chronic wound care, nutritional management, dementia care and mobility promotion \u2014 each with dedicated templates.'),
            ('Is this care software free?', 'AlwaysReady Care is free to start with full evidence capture, compliance tracking, and MD audit pack generation. Pro plans with advanced features start from \u20ac99 per facility per month.'),
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
        "inLanguage": r['lang'],
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

def build_breadcrumb_schema(region_code, r):
    home_name = {'de': 'Startseite', 'de-en': 'Home'}.get(region_code, 'Home')
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": home_name, "item": "https://tool.teamzlab.com/"},
            {"@type": "ListItem", "position": 2, "name": "Apps", "item": "https://tool.teamzlab.com/apps/"},
            {"@type": "ListItem", "position": 3, "name": "AlwaysReady Care " + r.get('name_short', region_code.upper()), "item": f"https://tool.teamzlab.com/apps/always-ready-care/{region_code}/"}
        ]
    }, indent=2)

BASE_URL = 'https://tool.teamzlab.com/apps/always-ready-care'

# Per-region manifest.json metadata (merged into base manifest per region)
MANIFEST_OVERRIDES = {
    'au': {
        'name': 'AlwaysReady Care — Aged Care Australia',
        'short_name': 'ARC AU',
        'description': 'ACQS compliance evidence layer for Australian aged care. Capture evidence, track 24 categories, generate assessment packs.',
        'lang': 'en-AU',
        'shortcuts_labels': [('Record Evidence', 'Record'), ('Dashboard', 'Dashboard')],
    },
    'nz': {
        'name': 'AlwaysReady Care — Rest Home NZ',
        'short_name': 'ARC NZ',
        'description': 'NZS 8134 compliance evidence layer for New Zealand rest homes. Capture evidence, track 20 categories, generate audit packs.',
        'lang': 'en-NZ',
        'shortcuts_labels': [('Record Evidence', 'Record'), ('Dashboard', 'Dashboard')],
    },
    'ie': {
        'name': 'AlwaysReady Care — Nursing Home Ireland',
        'short_name': 'ARC IE',
        'description': 'HIQA compliance evidence layer for Irish nursing homes. Capture evidence, track 20 categories, generate inspection packs.',
        'lang': 'en-IE',
        'shortcuts_labels': [('Record Evidence', 'Record'), ('Dashboard', 'Dashboard')],
    },
    'de': {
        'name': 'AlwaysReady Care — Pflegesoftware Deutschland',
        'short_name': 'ARC DE',
        'description': 'MD-Prüfungs-Nachweis-Layer für deutsche Pflegeeinrichtungen. Pflegedokumentation nach SIS, 24 QPR-Kategorien, MD-Prüfungsmappe per Klick. Nach SGB XI.',
        'lang': 'de-DE',
        'shortcuts_labels': [('Nachweis erfassen', 'Erfassen'), ('Übersicht', 'Übersicht')],
    },
    'de-en': {
        'name': 'AlwaysReady Care — Germany (English)',
        'short_name': 'ARC DE-EN',
        'description': 'MD audit evidence layer for German care facilities. SIS-compliant documentation, 24 QPR categories, MD audit packs on demand. SGB XI ready.',
        'lang': 'en-DE',
        'shortcuts_labels': [('Record Evidence', 'Record'), ('Dashboard', 'Dashboard')],
    },
}

import copy
with open(os.path.join(BASE, 'manifest.json'), 'r') as _f:
    BASE_MANIFEST = json.load(_f)

def write_region_manifest(region_code):
    """Generate region-specific manifest.json in the region folder."""
    if region_code not in MANIFEST_OVERRIDES:
        return
    mf = copy.deepcopy(BASE_MANIFEST)
    o = MANIFEST_OVERRIDES[region_code]
    mf['name'] = o['name']
    mf['short_name'] = o['short_name']
    mf['description'] = o['description']
    mf['lang'] = o['lang']
    mf['start_url'] = f'/apps/always-ready-care/{region_code}/#dashboard'
    # scope stays at app root so the language-toggle can navigate across locales inside the installed PWA
    mf['scope'] = '/apps/always-ready-care/'
    # Icon paths are absolute (start with /apps/...) in base manifest; rewrite relative ones for the subfolder
    for icon in mf.get('icons', []):
        if not icon['src'].startswith('/') and not icon['src'].startswith('http'):
            icon['src'] = '../' + icon['src']
    # Localise shortcuts + rewrite URL to region path preserving the fragment
    shortcuts = mf.get('shortcuts', [])
    for i, (name, short) in enumerate(o['shortcuts_labels']):
        if i >= len(shortcuts):
            continue
        shortcuts[i]['name'] = name
        shortcuts[i]['short_name'] = short
        orig_url = shortcuts[i].get('url', '')
        frag = orig_url.split('#', 1)[1] if '#' in orig_url else ''
        shortcuts[i]['url'] = f'/apps/always-ready-care/{region_code}/' + (f'#{frag}' if frag else '')
        for ic in shortcuts[i].get('icons', []):
            if not ic['src'].startswith('/') and not ic['src'].startswith('http'):
                ic['src'] = '../' + ic['src']
    out_path = os.path.join(BASE, region_code, 'manifest.json')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(mf, f, ensure_ascii=False, indent=2)
    print(f'  └ manifest.json ({len(json.dumps(mf))} bytes)')

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
    <link rel="alternate" hreflang="de-DE" href="{BASE_URL}/de/">
    <link rel="alternate" hreflang="en-DE" href="{BASE_URL}/de-en/">
    <link rel="alternate" hreflang="x-default" href="{BASE_URL}/">
    <script type="application/ld+json">
{build_app_schema(r, region_code)}
    </script>
    <script type="application/ld+json">
{build_faq_schema(r["faqs"])}
    </script>
    <script type="application/ld+json">
{build_breadcrumb_schema(region_code, r)}
    </script>'''

    html = f'''<!DOCTYPE html>
<html lang="{r["lang"]}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
{head}
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="manifest.json">
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
        'au': "You provide great care. Can you prove it when the assessor arrives?",
        'nz': "You provide great care. Can you prove it when the auditor arrives?",
        'ie': "You provide great care. Can you prove it when the inspector arrives?",
        'de': "Sie pflegen mit Herz. K\u00f6nnen Sie es auch belegen, wenn der MD kommt?",
        'de-en': "You provide great care. Can you prove it when the MD (Medizinischer Dienst) arrives?",
    }
    if region_code in PROBLEM_LINE1:
        html = html.replace(
            "You provide great care. Can you prove it when the inspector arrives?",
            PROBLEM_LINE1[region_code]
        )

    # Hero subtitle — localise for Googlebot
    HERO_SUB = {
        'au': 'Record care evidence in 60 seconds. AI auto-tags it to the right ACQS category. See your readiness score live across 24 categories. Generate a professional assessment pack in one click. Works alongside your existing system.',
        'nz': 'Record care evidence in 60 seconds. AI auto-tags it to the right NZS 8134 category. See your readiness score live across 20 categories. Generate a professional audit pack in one click. Works alongside your existing system.',
        'ie': 'Record care evidence in 60 seconds. AI auto-tags it to the right HIQA category. See your readiness score live across 20 categories. Generate a professional inspection pack in one click. Works alongside your existing system.',
        'de': 'Pflegenachweise in 60 Sekunden erfassen. KI ordnet sie automatisch dem richtigen QPR-Qualit\u00e4tsbereich zu. Sehen Sie Ihre Pr\u00fcfungsbereitschaft live \u00fcber 24 Kategorien. Erstellen Sie mit einem Klick eine professionelle MD-Pr\u00fcfungsmappe. L\u00e4uft parallel zu Vivendi, Medifox oder SNAP \u2014 kein Systemwechsel n\u00f6tig.',
        'de-en': 'Record care evidence in 60 seconds. AI auto-tags it to the right QPR Qualit\u00e4tsbereich. See your MD-readiness score live across 24 categories. Generate a professional MD audit pack in one click. Works alongside Vivendi, Medifox or SNAP \u2014 no rip-and-replace.',
    }
    if region_code in HERO_SUB:
        html = html.replace(
            "Record care evidence in 60 seconds. AI auto-tags it to the right compliance category. See your readiness score live. Generate a professional inspection pack in one click. Works alongside your existing system \u2014 no rip-and-replace.",
            HERO_SUB[region_code]
        )

    # ── Strip the UK country-resource strip. apply-country-resources.py
    #    re-injects a region-appropriate one on au/nz/ie after build;
    #    de/de-en inject their own via the replacements below. ──
    html = re.sub(
        r'<span id="arc-country-resources">.*?</span>\s*',
        '',
        html,
        count=1,
        flags=re.DOTALL
    )

    # ── Full German landing-page translation (static, SEO-perfect) ──
    if region_code == 'de':
        DE_REPLACEMENTS = [
            # Trust strip
            ('UK GDPR compliant', 'DSGVO & SGB X konform'),
            ('Reg 17 governance ready', '\u00a7 114 SGB XI bereit'),
            # Features section
            ('How This Care Home Software Works', 'So funktioniert diese Pflegesoftware'),
            ('From frontline carer to CQC inspector \u2014 the best care home compliance workflow in the UK', 'Von der Pflegefachkraft bis zum MD-Pr\u00fcfer \u2014 der beste Compliance-Workflow f\u00fcr deutsche Pflegeeinrichtungen'),
            ('Record in 60 Seconds', 'Erfassung in 60 Sekunden'),
            ('Carers capture evidence during or right after care. Choose from 12 pre-built templates covering medication, personal care, meals, incidents, safeguarding, night care, and more. Text, photo, or incident \u2014 all from a phone.', 'Pflegekr\u00e4fte erfassen Nachweise w\u00e4hrend oder direkt nach der Pflege. W\u00e4hlen Sie aus 12 Vorlagen f\u00fcr Medikamente, K\u00f6rperpflege, Mahlzeiten, Vorf\u00e4lle, Schutz vor Gewalt, Nachtdienst und mehr. Text, Foto oder Vorfall \u2014 alles vom Smartphone.'),
            ('AI Structures Your Notes', 'KI strukturiert Ihre Notizen'),
            ('Our AI reads messy handover notes and care records, then suggests compliance tags, flags risks like falls or safeguarding concerns, and recommends follow-up actions. You stay in control \u2014 AI assists, humans decide.', 'Unsere KI liest \u00dcbergabe-Notizen und Pflegeberichte, schl\u00e4gt QPR-Kategorien vor, markiert Risiken wie St\u00fcrze oder Gewaltschutz und empfiehlt Folgema\u00dfnahmen. Sie behalten die Kontrolle \u2014 KI unterst\u00fctzt, Menschen entscheiden.'),
            ('Review and Approve', 'Pr\u00fcfen und freigeben'),
            ('Senior care workers and managers review submitted evidence. Approve good records, send back incomplete ones with feedback. Only approved evidence counts towards your compliance readiness score.', 'Pflegedienstleitungen und Wohnbereichsleitungen pr\u00fcfen eingereichte Nachweise. Geben Sie gute Eintr\u00e4ge frei, schicken Sie unvollst\u00e4ndige mit R\u00fcckmeldung zur\u00fcck. Nur freigegebene Nachweise z\u00e4hlen zur MD-Pr\u00fcfungsbereitschaft.'),
            ('See Your CQC Readiness', 'Ihre MD-Pr\u00fcfungsbereitschaft'),
            ('A live compliance dashboard mapped to CQC\'s 5 key questions \u2014 Safe, Effective, Caring, Responsive, Well-led. See which of the 21 compliance categories have gaps before an inspector finds them.', 'Ein Live-Compliance-Dashboard abgebildet auf die 6 QPR-Qualit\u00e4tsbereiche. Erkennen Sie L\u00fccken in allen 24 Kategorien, bevor der MD sie findet.'),
            ('One-Click Inspection Packs', 'MD-Pr\u00fcfungsmappe per Klick'),
            ('When CQC visits, generate a professional inspection-ready evidence pack in one click. Filter by date range, evidence type, or compliance area. Download, print, or share instantly.', 'Wenn der Medizinische Dienst kommt, erstellen Sie mit einem Klick eine professionelle MD-Pr\u00fcfungsmappe. Filtern Sie nach Zeitraum, Nachweistyp oder QPR-Qualit\u00e4tsbereich. Herunterladen, drucken oder teilen.'),
            ('Never Miss a Follow-Up', 'Keine Ma\u00dfnahme mehr vergessen'),
            ('Falls risk reviews, medication chart updates, safeguarding referrals \u2014 every follow-up action is tracked with due dates and priority levels. Overdue actions are flagged so nothing slips through.', 'Sturzrisikopr\u00fcfungen, Medikamentenplan-Updates, Gef\u00e4hrdungsmeldungen \u2014 jede Folgema\u00dfnahme wird mit F\u00e4lligkeit und Priorit\u00e4t verfolgt. \u00dcberf\u00e4llige Ma\u00dfnahmen werden markiert.'),
            # Pain points
            ('Sound Familiar?', 'Kommt Ihnen das bekannt vor?'),
            ('The top 5 compliance frustrations care home managers face every day', 'Die 5 gr\u00f6\u00dften Compliance-Probleme, mit denen Pflegedienstleitungen t\u00e4glich k\u00e4mpfen'),
            ('Evidence Scattered Everywhere', 'Nachweise \u00fcberall verstreut'),
            ('Paper notes, WhatsApp messages, Excel spreadsheets, emails \u2014 your compliance evidence is in 5 different places. CQC asks for it and you spend hours pulling it together.', 'Papiernotizen, WhatsApp-Nachrichten, Excel-Tabellen, E-Mails \u2014 Ihre Qualit\u00e4tsnachweise sind \u00fcber 5 Orte verteilt. Der MD fragt danach, und Sie verlieren Stunden beim Zusammentragen.'),
            ('Audits Don\'t Close the Loop', 'Audits ohne Folgeprozess'),
            ('You can show the audit, but not the action taken, who owns it, when it\'s due, or proof of improvement. CQC calls this a Regulation 17 governance failure \u2014 the #1 reason homes get "Requires Improvement".', 'Sie k\u00f6nnen die Ma\u00dfnahme zeigen \u2014 aber nicht die umgesetzte Handlung, wer verantwortlich ist, die Frist oder den Verbesserungsnachweis. Genau das bewertet der MD als QM-Schw\u00e4che nach QPR-Bereich 6.'),
            ('Records Are Patchy and Late', 'Dokumentation l\u00fcckenhaft und versp\u00e4tet'),
            ('Staffing pressure means carers write evidence at the end of a shift \u2014 or not at all. Retrospective, incomplete records are a red flag for inspectors under Regulation 12 (safe care).', 'Personalknappheit bedeutet: Nachweise werden am Schichtende geschrieben \u2014 oder gar nicht. R\u00fcckwirkende, l\u00fcckenhafte Pflegedokumentation ist ein rotes Tuch bei der indikatorengest\u00fctzten Qualit\u00e4tspr\u00fcfung.'),
            ('Inspection Readiness Is Last-Minute', 'Pr\u00fcfungsbereitschaft erst in letzter Minute'),
            ('Teams scramble before a CQC visit instead of running a continuous evidence process. Skills for Care data shows this is the single biggest gap in services rated "Requires Improvement".', 'Teams bereiten sich hektisch auf die MD-Pr\u00fcfung vor statt kontinuierlich Nachweise zu f\u00fchren. Seit Einf\u00fchrung der indikatorengest\u00fctzten Qualit\u00e4tspr\u00fcfung 2019 ist das die gr\u00f6\u00dfte Schwachstelle.'),
            ('No Visibility Across Sites', 'Keine \u00dcbersicht \u00fcber mehrere Standorte'),
            ('Multi-site operators can\'t see compliance gaps until it\'s too late. Each home runs its own system \u2014 or no system at all. Governance visibility is weak, especially for nominated individuals.', 'Tr\u00e4ger mit mehreren Einrichtungen sehen Compliance-L\u00fccken oft zu sp\u00e4t. Jede Einrichtung hat ihr eigenes System \u2014 oder gar keins. Governance-Transparenz ist schwach.'),
            # Audience
            ('Best Care Home Software for Every Role', 'Die beste Pflegesoftware f\u00fcr jede Rolle'),
            ('Care Workers', 'Pflegekr\u00e4fte'),
            ('Record evidence during or after care. Use templates so you never miss important details. See your follow-up actions. Takes less than a minute.', 'Nachweise w\u00e4hrend oder nach der Pflege erfassen. Vorlagen nutzen, damit nichts vergessen wird. Offene Folgema\u00dfnahmen einsehen. Dauert weniger als eine Minute.'),
            ('Seniors &amp; Deputies', 'Wohnbereichs- &amp; Stellv. Leitung'),
            ('Review your team\'s evidence in real-time. Approve or send back with feedback. Ensure quality and consistency across every shift.', 'Nachweise Ihres Teams in Echtzeit pr\u00fcfen. Freigeben oder mit R\u00fcckmeldung zur\u00fcckschicken. Qualit\u00e4t und Konsistenz in jeder Schicht sichern.'),
            ('Managers &amp; Directors', 'Pflegedienstleitung &amp; Heimleitung'),
            ('See compliance readiness at a glance. Spot gaps across all 21 CQC categories. Generate inspection packs. Manage your team\'s access and roles.', 'MD-Pr\u00fcfungsbereitschaft auf einen Blick. L\u00fccken in allen 24 QPR-Kategorien erkennen. Pr\u00fcfungsmappen erstellen. Team-Zugriffe und Rollen verwalten.'),
            # Framework section
            ('CQC Compliance Audit Tool \u2014 Mapped to 5 Key Questions', 'Pflegesoftware mit QPR-Struktur \u2014 6 Qualit\u00e4tsbereiche'),
            ('The only free care home audit tool that tracks 21 compliance categories across Safe, Effective, Caring, Responsive, and Well-led', 'Die einzige kostenlose Pflegesoftware, die 24 Kategorien nach den 6 QPR-Qualit\u00e4tsbereichen und allen 9 DNQP-Expertenstandards verfolgt'),
            ('<strong>Safe</strong><span>Medication, Safeguarding, Incidents, Infection Control, Risk Assessment, Falls Prevention</span>', '<strong>QB 1</strong><span>Mobilit\u00e4t, K\u00f6rperpflege, Ern\u00e4hrung, Kontinenzf\u00f6rderung</span>'),
            ('<strong>Effective</strong><span>Care Planning, Nutrition, Health Monitoring, Mental Capacity &amp; DoLS, Staff Training</span>', '<strong>QB 2</strong><span>Medikamente, Wundversorgung, Dekubitus, Schmerz, Vitalzeichen</span>'),
            ('<strong>Caring</strong><span>Personal Care &amp; Dignity, Activities &amp; Wellbeing, Communication</span>', '<strong>QB 3 &amp; QB 4</strong><span>Biografie, Teilhabe, Demenz, Palliativ, FEM</span>'),
            ('<strong>Responsive</strong><span>Complaints &amp; Feedback, End of Life Care, Person-Centred Care</span>', '<strong>QB 5</strong><span>Hygiene, SIS-Dokumentation, Risikomanagement, Beratung</span>'),
            ('<strong>Well-led</strong><span>Governance &amp; Audits, Staff Supervision, Night Care, Duty of Candour</span>', '<strong>QB 6</strong><span>QM, Personal, Beschwerden, Notfall, Leitung</span>'),
            # Regulatory
            ('Built on CQC Regulatory Requirements', 'Aufgebaut auf SGB XI &amp; QPR-Richtlinien'),
            ('AlwaysReady Care helps you evidence compliance with the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014', 'AlwaysReady Care hilft Ihnen, die Qualit\u00e4t gem\u00e4\u00df \u00a7 113 SGB XI, QPR des Qualit\u00e4tsausschusses Pflege und den DNQP-Expertenstandards zu belegen'),
            ('<strong>Reg 9</strong> Person-centred care', '<strong>QB 1</strong> Mobilit\u00e4t &amp; Selbstversorgung'),
            ('<strong>Reg 11</strong> Need for consent &amp; MCA', '<strong>QB 2</strong> Krankheit/Therapie'),
            ('<strong>Reg 12</strong> Safe care and treatment', '<strong>QB 3</strong> Alltag &amp; soziale Kontakte'),
            ('<strong>Reg 13</strong> Safeguarding from abuse', '<strong>QB 4</strong> Besondere Versorgung'),
            ('<strong>Reg 16</strong> Receiving complaints', '<strong>QB 5</strong> Fachliche Anforderungen'),
            ('<strong>Reg 17</strong> Good governance', '<strong>QB 6</strong> Organisation &amp; QM'),
            ('<strong>Reg 18</strong> Staffing competency', '<strong>\u00a7 114</strong> SGB XI \u2014 MD-Pr\u00fcfung'),
            ('<strong>Reg 20</strong> Duty of candour', '<strong>DNQP</strong> 9 Expertenstandards'),
            ('UK GDPR &amp; Data Protection Act 2018 compliant. Evidence retained per Digital Care Hub guidance: care records 8 years, serious incidents 20 years.', 'DSGVO, BDSG und Sozialgeheimnis (SGB X) konform. Nachweise werden mindestens 10 Jahre gem\u00e4\u00df SGB XI-Aufbewahrungsfrist sicher gespeichert.'),
            # Proof
            ('Why UK Care Homes Choose This Compliance Software', 'Warum deutsche Pflegeeinrichtungen diese Software w\u00e4hlen'),
            ('Average time to record care evidence', 'Durchschnittliche Zeit f\u00fcr Pflegenachweis'),
            ('Pre-built evidence templates', 'Vorgefertigte Nachweis-Vorlagen'),
            ('CQC compliance categories tracked', 'QPR-Kategorien erfasst'),
            ('CQC Key Questions mapped', 'QPR-Qualit\u00e4tsbereiche abgebildet'),
            # Pricing
            ('Simple, Transparent Pricing', 'Einfache, transparente Preise'),
            ('Per care home, not per user. Start free, upgrade when ready.', 'Pro Einrichtung, nicht pro Nutzer. Kostenlos starten, sp\u00e4ter upgraden.'),
            ('>Free<', '>Kostenlos<'),
            ('\u00a30', '0 \u20ac'),
            ('\u00a379', '99 \u20ac'),
            ('/home/month', '/Einrichtung/Monat zzgl. MwSt'),
            ('Evidence capture (text + photo)', 'Nachweise (Text + Foto)'),
            ('5 evidence templates', '5 Nachweis-Vorlagen'),
            ('Basic compliance dashboard', 'Basis-Compliance-Dashboard'),
            ('Up to 3 staff accounts', 'Bis zu 3 Mitarbeiter-Konten'),
            ('Offline support', 'Offline-Funktion'),
            ('>Get Started Free<', '>Kostenlos starten<'),
            ('Most Popular', 'Am beliebtesten'),
            ('>Pro<', '>Pro<'),
            ('Everything in Free', 'Alles aus Kostenlos'),
            ('All 12 evidence templates', 'Alle 12 Nachweis-Vorlagen'),
            ('AI evidence structuring', 'KI-Nachweis-Strukturierung'),
            ('Inspection pack generation', 'MD-Pr\u00fcfungsmappen'),
            ('Follow-up action tracking', 'Ma\u00dfnahmen-Tracking'),
            ('Unlimited staff accounts', 'Unbegrenzte Mitarbeiter-Konten'),
            ('21 CQC compliance categories', '24 QPR-Kategorien'),
            ('Priority support', 'Priorit\u00e4ts-Support'),
            ('Start 30-Day Free Trial', '30 Tage kostenlos testen'),
            ('>Enterprise<', '>Enterprise<'),
            ('>Custom<', '>Individuell<'),
            ('Everything in Pro', 'Alles aus Pro'),
            ('Multi-site dashboard', 'Multi-Einrichtungs-Dashboard'),
            ('Group-level reporting', 'Tr\u00e4ger-Reporting'),
            ('API access', 'API-Zugang'),
            ('Dedicated onboarding', 'Dediziertes Onboarding'),
            ('SLA &amp; compliance guarantee', 'SLA &amp; Compliance-Garantie'),
            ('>Contact Sales<', '>Vertrieb kontaktieren<'),
            # Lead capture
            ('Not Ready Yet? Stay Updated', 'Noch nicht bereit? Bleiben Sie informiert'),
            ('Get CQC compliance tips, product updates, and early access to new features', 'Erhalten Sie Tipps zur MD-Pr\u00fcfung, Produktupdates und Zugang zu neuen Funktionen'),
            ('Enter your work email', 'Ihre berufliche E-Mail-Adresse'),
            ('>Subscribe<', '>Abonnieren<'),
            ('No spam, unsubscribe anytime. We respect UK GDPR.', 'Kein Spam, jederzeit abbestellbar. Wir respektieren die DSGVO.'),
            # Final CTA
            ('Ready to Be Always Ready?', 'Bereit, immer pr\u00fcfbereit zu sein?'),
            ('Start free. No credit card. No installation. Works in your browser.', 'Kostenlos starten. Keine Kreditkarte. Keine Installation. L\u00e4uft im Browser.'),
            ('<i class="fas fa-rocket"></i> Get Started Free', '<i class="fas fa-rocket"></i> Kostenlos starten'),
            ('<i class="fab fa-whatsapp"></i> Book a Demo', '<i class="fab fa-whatsapp"></i> Demo buchen'),
            ('Also available for:', '<a href="md-pruefung-checkliste/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 MD-Pr\u00fcfung Checkliste</a> &middot; <a href="expertenstandards/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 9 DNQP-Expertenstandards</a> &middot; <a href="sis-formulierungshilfen/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 SIS Formulierungshilfen</a> &middot; <a href="qualitaetsindikatoren-check/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Qualit\u00e4tsindikatoren Selbstcheck</a> &middot; <a href="pflegedokumentation-vorlagen/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 12 Doku-Vorlagen</a> &middot; <a href="pflegesoftware-vergleich/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Pflegesoftware Vergleich</a> &middot; <a href="pflegegrad-rechner/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Pflegegrad Rechner</a> &middot; <a href="bundeslaender/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 MD-Pr\u00fcfung nach Bundesland</a> &middot; <a href="md-pruefung-vorbereitung/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 12-Wochen-Vorbereitung</a> &middot; <a href="pflegeheim-eroeffnen/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Pflegeheim er\u00f6ffnen</a> &middot; <a href="schweiz/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Schweiz (CH)</a> &middot; <a href="oesterreich/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 \u00d6sterreich (AT)</a> &middot; Auch verf\u00fcgbar f\u00fcr:'),
            # Footer
            ('Free care home compliance software for UK social care providers', 'Kostenlose Pflegesoftware f\u00fcr deutsche Pflegeeinrichtungen nach SGB XI'),
            ('Works alongside Person Centred Software, Nourish Care, Log my Care, Care Control, Birdie, CareDocs, StoriiCare, and any care planning system. Not a replacement \u2014 a compliance evidence layer on top.', 'L\u00e4uft parallel zu Vivendi, Medifox, SNAP, DAN Produkte und jedem anderen Pflegesystem. Kein Ersatz \u2014 eine Compliance-Nachweis-Schicht obendrauf.'),
            ('>User Guide<', '>Bedienungsanleitung<'),
            ('>Contact<', '>Kontakt<'),
            # Target specifically the footer anchor version (not the span in the login button).
            ('>Sign In</a>', '>Anmelden</a> &middot;\n                <a href="impressum/">Impressum</a> &middot;\n                <a href="datenschutz/">Datenschutz</a>'),
            # Login + demo UI translations (visible for any DE user who scrolls to the login card)
            ('>Get Started<', '>Jetzt starten<'),
            ('Sign in or try the free demo', 'Anmelden oder Demo testen'),
            ('>Email<', '>E-Mail<'),
            ('>Password<', '>Passwort<'),
            ('<span class="btn-text">Sign In</span>', '<span class="btn-text">Anmelden</span>'),
            ('Sign in with Google', 'Mit Google anmelden'),
            ('Try Free Demo', 'Demo kostenlos testen'),
            ('>Free Demo<', '>Demo<'),
            ('title="Try free demo"', 'title="Demo kostenlos testen"'),
            ('>Submit Evidence<', '>Nachweis einreichen<'),
            ('>Guest User<', '>Gast<'),
            ('>Not signed in<', '>Nicht angemeldet<'),
            ('Staff member\'s email', 'E-Mail-Adresse Mitarbeiter'),
            # ── App-shell chrome (post-login UI) — visible after user signs in ──
            ('>Cancel<', '>Abbrechen<'),
            ('>Save<', '>Speichern<'),
            ('>Next<', '>Weiter<'),
            ('>Back<', '>Zur\u00fcck<'),
            ('>Close<', '>Schlie\u00dfen<'),
            ('>Submit<', '>Absenden<'),
            ('>Confirm<', '>Best\u00e4tigen<'),
            ('>Delete<', '>L\u00f6schen<'),
            ('>Edit<', '>Bearbeiten<'),
            ('>Approve<', '>Freigeben<'),
            ('>Reject<', '>Ablehnen<'),
            ('>Approved<', '>Freigegeben<'),
            ('>Completed<', '>Erledigt<'),
            ('>Critical<', '>Kritisch<'),
            ('>Low<', '>Niedrig<'),
            ('>Medium<', '>Mittel<'),
            ('>High<', '>Hoch<'),
            ('>All Priorities<', '>Alle Priorit\u00e4ten<'),
            ('>All Statuses<', '>Alle Status<'),
            ('>All Types<', '>Alle Typen<'),
            ('>Add Staff Member<', '>Mitarbeiter hinzuf\u00fcgen<'),
            ('>Admin<', '>Admin<'),
            ('>Carer<', '>Pflegekraft<'),
            ('>Director<', '>Leitung<'),
            ('>Active Site<', '>Aktive Einrichtung<'),
            ('>Access Restricted<', '>Zugang eingeschr\u00e4nkt<'),
            ('>Full Name<', '>Vollst\u00e4ndiger Name<'),
            ('>Address<', '>Adresse<'),
            ('>Current Role<', '>Aktuelle Rolle<'),
            ('>Start Date<', '>Startdatum<'),
            ('>End Date<', '>Enddatum<'),
            ('>Evidence Type<', '>Nachweistyp<'),
            ('>Evidence Types<', '>Nachweistypen<'),
            ('>Evidence Details<', '>Nachweisdetails<'),
            ('>Category Coverage<', '>Kategorie-Abdeckung<'),
            ('>Generate New Pack<', '>Neue Mappe erzeugen<'),
            ('>Generate Pack<', '>Mappe erzeugen<'),
            ('>Capture and document care activities<', '>Pflegehandlungen erfassen und dokumentieren<'),
            ('>Capture care records, photos, and incidents<', '>Pflegedokumentation, Fotos und Vorf\u00e4lle erfassen<'),
            ('>Approve or reject pending submissions<', '>Offene Eintr\u00e4ge freigeben oder ablehnen<'),
            ('>Approve or reject submitted evidence<', '>Eingereichte Nachweise freigeben oder ablehnen<'),
            ('>Drag and drop photos here<', '>Fotos hierher ziehen<'),
            ('>Get it reviewed<', '>Zur Freigabe senden<'),
            ('>Audio<', '>Audio<'),
            ('>Caption<', '>Bildunterschrift<'),
            ('>Dark<', '>Dunkel<'),
            ('>Light<', '>Hell<'),
            ('Add to your home screen for quick access', 'Zum Startbildschirm hinzuf\u00fcgen f\u00fcr schnellen Zugriff'),
            ('Everything you need to know about AlwaysReady Care', 'Alles, was Sie \u00fcber AlwaysReady Care wissen m\u00fcssen'),
            ('Manage your account and preferences', 'Konto und Einstellungen verwalten'),
            ('Reason for Rejection', 'Grund f\u00fcr Ablehnung'),
            ('UK GDPR &amp; Data Protection Act 2018 compliant.', 'DSGVO, BDSG und SGB X konform.'),
            # Login form
            ('you@example.com', 'sie@beispiel.de'),
            ('Enter your password', 'Passwort eingeben'),
            # Dashboard & App shell (post-login) — key strings only
            ('Welcome back', 'Willkommen zur\u00fcck'),
            ('Here is your compliance overview', 'Hier ist Ihre Compliance-\u00dcbersicht'),
            ('Today\'s Records', 'Heutige Nachweise'),
            ('Total Records', 'Gesamte Nachweise'),
            ('Pending Actions', 'Offene Ma\u00dfnahmen'),
            ('Pending Reviews', 'Offene Pr\u00fcfungen'),
            ('Quick Actions', 'Schnellzugriff'),
            ('Recent Evidence', 'Letzte Nachweise'),
            ('No recent evidence recorded yet.', 'Noch keine Nachweise erfasst.'),
            ('Coming Soon', 'Demn\u00e4chst'),
            ('Offline Sync', 'Offline-Synchronisation'),
            ('Smart Notifications', 'Intelligente Benachrichtigungen'),
            ('>Dashboard<', '>\u00dcbersicht<'),
            ('>Record Evidence<', '>Nachweis erfassen<'),
            ('>Review Evidence<', '>Nachweis pr\u00fcfen<'),
            ('>Compliance<', '>Compliance<'),
            ('>Actions<', '>Ma\u00dfnahmen<'),
            ('>Inspection Packs<', '>Pr\u00fcfungsmappen<'),
            ('>Team Management<', '>Team-Verwaltung<'),
            ('>Help &amp; FAQ<', '>Hilfe &amp; FAQ<'),
            ('>Profile &amp; Settings<', '>Profil &amp; Einstellungen<'),
            ('>Talk to Sales<', '>Vertrieb kontaktieren<'),
            ('>Dark Mode<', '>Dunkler Modus<'),
            ('>Logout<', '>Abmelden<'),
            ('>Online<', '>Online<'),
            ('UK GDPR Compliant', 'DSGVO-konform'),
            ('Encrypted Cloud Storage', 'Verschl\u00fcsselter Cloud-Speicher'),
            ('Data Isolated Per Facility', 'Datenisolierung pro Einrichtung'),
            ('CQC Framework', 'QPR-Rahmenwerk'),
            ('Your CQC inspection readiness at a glance', 'Ihre MD-Pr\u00fcfungsbereitschaft auf einen Blick'),
            ('Generate evidence packs for CQC inspections', 'Nachweismappen f\u00fcr die MD-Pr\u00fcfung erstellen'),
            ('Add staff, assign roles, manage your care home', 'Mitarbeiter hinzuf\u00fcgen, Rollen zuweisen, Einrichtung verwalten'),
            ('Enter your care home name', 'Name Ihrer Pflegeeinrichtung'),
            ('AlwaysReady Care is a simple tool that helps care homes record and organise evidence of the care they provide. It keeps all your records in one place so you are always ready if CQC comes to inspect. Everything runs in your browser and your data stays private.', 'AlwaysReady Care ist ein einfaches Tool f\u00fcr Pflegeeinrichtungen zur Erfassung und Organisation von Pflegenachweisen. Alle Aufzeichnungen an einem Ort, damit Sie jederzeit auf die MD-Pr\u00fcfung vorbereitet sind. L\u00e4uft im Browser, Daten bleiben privat.'),
            ('What is the compliance score?', 'Was ist der Compliance-Score?'),
            ('The compliance score shows the percentage of CQC evidence categories that have at least one record in the last 30 days. A score of 100% means every category (medication, personal care, nutrition, etc.) has recent evidence. Gaps are highlighted so you know what to focus on.', 'Der Compliance-Score zeigt den Prozentsatz der QPR-Kategorien mit mindestens einem Nachweis in den letzten 30 Tagen. 100 % bedeutet: jede Kategorie (Medikamente, K\u00f6rperpflege, Ern\u00e4hrung etc.) hat aktuelle Nachweise. L\u00fccken werden hervorgehoben.'),
            ('What is an inspection pack?', 'Was ist eine Pr\u00fcfungsmappe?'),
            ('An inspection pack is a downloadable report containing all approved evidence for a chosen date range. You can filter by evidence type. It produces a formatted HTML document you can print or share with inspectors.', 'Eine Pr\u00fcfungsmappe ist ein herunterladbarer Bericht mit allen freigegebenen Nachweisen f\u00fcr einen Zeitraum. Sie k\u00f6nnen nach Nachweistyp filtern. Es entsteht ein formatiertes HTML-Dokument zum Drucken oder Teilen mit MD-Pr\u00fcfern.'),
            ('Is my data private and secure?', 'Sind meine Daten privat und sicher?'),
            ('Yes. Your data is stored securely in Firebase with access restricted to your organisation. Each care home has its own isolated data. We do not share your information with anyone.', 'Ja. Ihre Daten werden sicher in Firebase gespeichert, Zugriff nur f\u00fcr Ihre Organisation. Jede Einrichtung hat isolierte Daten. Wir geben keine Informationen weiter.'),
            ('How do I add more staff to my care home?', 'Wie f\u00fcge ich weitere Mitarbeiter hinzu?'),
            ('If you have the Admin role, go to "Team Management" in the sidebar. There you can add staff members by entering their email, name, and role. You can also change roles or remove staff from the same page.', 'Mit der Admin-Rolle gehen Sie in der Seitenleiste auf \u201eTeam-Verwaltung\u201c. Dort f\u00fcgen Sie Mitarbeiter \u00fcber E-Mail, Name und Rolle hinzu. Rollen \u00e4ndern oder Mitarbeiter entfernen geht ebenfalls dort.'),
        ]
        for eng, de in DE_REPLACEMENTS:
            html = html.replace(eng, de)

    # ── /de-en/ gets English labels but the same tool links (tools live under /de/) ──
    if region_code == 'de-en':
        DE_EN_RESOURCES = (
            '<span id="arc-de-en-resources">Free tools for the German market: '
            '<a href="../de/md-pruefung-checkliste/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 MD Audit Checklist</a> &middot; '
            '<a href="../de/expertenstandards/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 9 DNQP Expert Standards</a> &middot; '
            '<a href="../de/sis-formulierungshilfen/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 SIS Formularies</a> &middot; '
            '<a href="../de/qualitaetsindikatoren-check/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Quality Indicators Self-Check</a> &middot; '
            '<a href="../de/pflegedokumentation-vorlagen/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 12 Documentation Templates</a> &middot; '
            '<a href="../de/pflegesoftware-vergleich/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Care Software Comparison</a> &middot; '
            '<a href="../de/pflegegrad-rechner/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Pflegegrad Calculator</a> &middot; '
            '<a href="../de/bundeslaender/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 MD Audit by Bundesland</a> &middot; '
            '<a href="../de/md-pruefung-vorbereitung/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 12-Week Prep Plan</a> &middot; '
            '<a href="../de/pflegeheim-eroeffnen/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Open a Care Facility</a> &middot; '
            '<a href="../de/schweiz/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Switzerland (CH)</a> &middot; '
            '<a href="../de/oesterreich/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Austria (AT)</a> &middot; '
            '<a href="../de/impressum/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Impressum</a> &middot; '
            '<a href="../de/datenschutz/" style="color:var(--accent);text-decoration:underline;font-weight:600;">\u2192 Datenschutz</a>'
            '</span><br><br>Also available for:'
        )
        html = html.replace('Also available for:', DE_EN_RESOURCES, 1)

    # Language toggle — ONE-button switch between /de/ and /de-en/
    if region_code in ('de', 'de-en'):
        target = '../de-en/' if region_code == 'de' else '../de/'
        label = 'EN' if region_code == 'de' else 'DE'
        flag = '\U0001F1EC\U0001F1E7' if region_code == 'de' else '\U0001F1E9\U0001F1EA'
        title = 'Switch to English' if region_code == 'de' else 'Zur deutschen Version wechseln'
        toggle = (
            f'<a href="{target}" id="lang-toggle" aria-label="{title}" title="{title}" '
            'style="position:fixed;top:14px;right:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;'
            'padding:8px 14px;border-radius:999px;background:var(--accent,#D9FE06);color:var(--accent-text,#12151A);'
            'font:600 13px/1 Poppins,system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.18);'
            'border:1px solid rgba(0,0,0,.12);">'
            f'<span style="font-size:16px;line-height:1;">{flag}</span>'
            f'<span>{label}</span></a>'
        )
        html = html.replace('<body>', '<body>\n' + toggle, 1)

    outdir = os.path.join(BASE, region_code)
    os.makedirs(outdir, exist_ok=True)
    outpath = os.path.join(outdir, 'index.html')
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'BUILT: {region_code}/index.html ({len(html)} bytes)')
    write_region_manifest(region_code)

print('Done. Run this again after editing index.html to keep regions in sync.')
