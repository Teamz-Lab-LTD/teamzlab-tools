#!/usr/bin/env python3
"""
Generate per-Bundesland landing pages (16) + hub index for the German market.
Targets: "md prüfung [Bundesland]", "pflegeheim aufsicht [Bundesland]", "[Bundesland] pflegegesetz".

Run: python3 build-bundeslaender.py
Output: /apps/always-ready-care/de/bundeslaender/<slug>/index.html + hub index.
"""
import os, json, html

BASE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE, 'de', 'bundeslaender')
BASE_URL = 'https://tool.teamzlab.com/apps/always-ready-care/de/bundeslaender'

# 16 Bundesländer — official names + state-specific Heimrecht info
STATES = [
    {'slug':'baden-wuerttemberg','name':'Baden-Württemberg','short':'BW','law':'Landesheimgesetz Baden-Württemberg (LHeimG BW)','authority':'Heimaufsicht beim Regierungspräsidium / Kommunalverband','hospitals':'ca. 1.890 Pflegeheime','context':'Baden-Württemberg hat mit knapp 1.900 stationären Pflegeeinrichtungen und rund 3.500 ambulanten Pflegediensten einen der größten Pflegemärkte Deutschlands. Die Heimaufsicht ist auf Ebene der Regierungspräsidien und teilweise der Kommunalverbände angesiedelt.'},
    {'slug':'bayern','name':'Bayern','short':'BY','law':'Pflege- und Wohnqualitätsgesetz (PfleWoqG)','authority':'Fachstelle für Pflege- und Behinderteneinrichtungen (FQA) bei Landkreisen/kreisfreien Städten','hospitals':'ca. 1.900 Pflegeheime','context':'Bayern prüft nach dem Pflege- und Wohnqualitätsgesetz (PfleWoqG). Die Fachstellen für Pflege- und Behinderteneinrichtungen (FQA) sind bei den Landkreisen und kreisfreien Städten angesiedelt und prüfen zusätzlich zur MD-Prüfung nach Landesrecht.'},
    {'slug':'berlin','name':'Berlin','short':'BE','law':'Wohnteilhabegesetz Berlin (WTG)','authority':'Heimaufsicht beim Landesamt für Gesundheit und Soziales (LAGeSo)','hospitals':'ca. 315 Pflegeheime','context':'Berlin führt nach dem Wohnteilhabegesetz (WTG) eine zusätzliche heimrechtliche Aufsicht durch das LAGeSo durch. Die landesweit zentrale Struktur erleichtert einheitliche Prüfstandards.'},
    {'slug':'brandenburg','name':'Brandenburg','short':'BB','law':'Brandenburgisches Pflege- und Betreuungswohngesetz (BbgPBWoG)','authority':'Kommunale Heimaufsichten in Kreisen und kreisfreien Städten','hospitals':'ca. 385 Pflegeheime','context':'Brandenburg hat nach dem BbgPBWoG eine dezentrale Heimaufsichtsstruktur auf Kreisebene. Kombinierte Prüfungen mit MD-Besuchen werden zunehmend abgestimmt.'},
    {'slug':'bremen','name':'Bremen','short':'HB','law':'Bremisches Wohn- und Betreuungsgesetz (BremWoBetrG)','authority':'Wohn- und Betreuungsaufsicht der Stadtgemeinde Bremen / Bremerhaven','hospitals':'ca. 85 Pflegeheime','context':'Bremen als Stadtstaat hat eine überschaubare Struktur mit zwei Aufsichtsbehörden (Bremen und Bremerhaven). Die enge Abstimmung mit dem MD ist hier besonders gut ausgeprägt.'},
    {'slug':'hamburg','name':'Hamburg','short':'HH','law':'Hamburgisches Wohn- und Betreuungsqualitätsgesetz (HmbWBG)','authority':'Wohn-Pflege-Aufsicht der Sozialbehörde Hamburg','hospitals':'ca. 160 Pflegeheime','context':'Hamburg prüft nach dem HmbWBG zentral über die Wohn-Pflege-Aufsicht der Sozialbehörde. Die Aufsicht arbeitet eng mit den Pflegekassen und dem MD zusammen.'},
    {'slug':'hessen','name':'Hessen','short':'HE','law':'Hessisches Gesetz über Betreuungs- und Pflegeleistungen (HGBP)','authority':'Betreuungs- und Pflegeaufsicht beim Regierungspräsidium','hospitals':'ca. 870 Pflegeheime','context':'Hessen prüft nach dem HGBP über die Betreuungs- und Pflegeaufsicht auf Ebene der Regierungspräsidien. Die Besonderheit: regelmäßige Transparenzberichte zu Prüfergebnissen.'},
    {'slug':'mecklenburg-vorpommern','name':'Mecklenburg-Vorpommern','short':'MV','law':'Einrichtungenqualitätsgesetz M-V (EQG M-V)','authority':'Landesamt für Gesundheit und Soziales M-V','hospitals':'ca. 310 Pflegeheime','context':'Mecklenburg-Vorpommern konzentriert die Heimaufsicht auf Landesebene beim LAGuS. Die Prüfung nach dem EQG M-V erfolgt ergänzend zur MD-Prüfung nach § 114 SGB XI.'},
    {'slug':'niedersachsen','name':'Niedersachsen','short':'NI','law':'Niedersächsisches Gesetz über unterstützende Wohnformen (NuWG)','authority':'Fachaufsicht Heime bei Landkreisen und kreisfreien Städten','hospitals':'ca. 1.650 Pflegeheime','context':'Niedersachsen hat eine dezentrale Struktur mit Fachaufsichten auf Kreisebene. Die Prüfung nach dem NuWG ist mit der MD-Prüfung abgestimmt.'},
    {'slug':'nordrhein-westfalen','name':'Nordrhein-Westfalen','short':'NW','law':'Wohn- und Teilhabegesetz NRW (WTG NRW)','authority':'WTG-Behörden bei Kreisen und kreisfreien Städten','hospitals':'ca. 2.250 Pflegeheime','context':'Nordrhein-Westfalen ist mit über 2.200 Pflegeheimen der größte Pflegemarkt Deutschlands. Das WTG NRW sieht umfassende Prüfrechte vor; die WTG-Behörden prüfen teilweise in gemeinsamen Terminen mit dem MD.'},
    {'slug':'rheinland-pfalz','name':'Rheinland-Pfalz','short':'RP','law':'Landesgesetz über Wohnformen und Teilhabe (LWTG)','authority':'Beratungs- und Prüfbehörde bei Landkreisen und kreisfreien Städten','hospitals':'ca. 490 Pflegeheime','context':'Rheinland-Pfalz setzt mit dem LWTG auf ein Zusammenspiel aus Beratung und Prüfung. Die Beratungs- und Prüfbehörden sind auf kommunaler Ebene angesiedelt.'},
    {'slug':'saarland','name':'Saarland','short':'SL','law':'Saarländisches Landesheimgesetz (LHeimGS)','authority':'Landesamt für Soziales','hospitals':'ca. 145 Pflegeheime','context':'Das Saarland hat eine zentrale Heimaufsicht beim Landesamt für Soziales. Die Prüfung nach dem LHeimGS ergänzt die MD-Prüfung.'},
    {'slug':'sachsen','name':'Sachsen','short':'SN','law':'Sächsisches Betreuungs- und Wohnqualitätsgesetz (SächsBeWoG)','authority':'Kommunaler Sozialverband Sachsen (KSV Sachsen)','hospitals':'ca. 780 Pflegeheime','context':'Sachsen bündelt die Heimaufsicht beim Kommunalen Sozialverband (KSV). Das SächsBeWoG sieht regelmäßige Prüfungen vor; die KSV veröffentlicht Prüfergebnisse.'},
    {'slug':'sachsen-anhalt','name':'Sachsen-Anhalt','short':'ST','law':'Wohn- und Teilhabegesetz Sachsen-Anhalt (WTG LSA)','authority':'Heimaufsicht bei Landkreisen und kreisfreien Städten','hospitals':'ca. 460 Pflegeheime','context':'Sachsen-Anhalt prüft dezentral nach dem WTG LSA. Die Heimaufsicht kooperiert mit dem MD und der Landespflegekasse.'},
    {'slug':'schleswig-holstein','name':'Schleswig-Holstein','short':'SH','law':'Selbstbestimmungsstärkungsgesetz (SbStG)','authority':'Heimaufsicht bei Kreisen und kreisfreien Städten','hospitals':'ca. 650 Pflegeheime','context':'Schleswig-Holstein hat mit dem Selbstbestimmungsstärkungsgesetz (SbStG) einen konsumentenorientierten Ansatz. Die Heimaufsicht ist auf Kreisebene organisiert.'},
    {'slug':'thueringen','name':'Thüringen','short':'TH','law':'Thüringer Wohn- und Teilhabegesetz (ThürWTG)','authority':'Heimaufsicht bei Landkreisen und kreisfreien Städten','hospitals':'ca. 420 Pflegeheime','context':'Thüringen prüft nach dem ThürWTG über kommunale Heimaufsichten. Die Zusammenarbeit mit dem MD erfolgt über gemeinsame Prüftermine oder abgestimmte Prüfzeiten.'}
]

PAGE_TMPL = '''<!DOCTYPE html>
<html lang="de-DE" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{meta_title}</title>
    <meta name="description" content="{meta_desc}">
    <link rel="canonical" href="{canonical}">
    <meta property="og:title" content="{og_title}">
    <meta property="og:description" content="{meta_desc}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical}">
    <meta property="og:site_name" content="AlwaysReady Care">
    <meta property="og:image" content="https://tool.teamzlab.com/apps/always-ready-care/icons/icon-512.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{og_title}">
    <meta name="twitter:description" content="{meta_desc}">
    <meta name="keywords" content="{keywords}">
    <link rel="alternate" hreflang="de-DE" href="{canonical}">
    <link rel="alternate" hreflang="x-default" href="{canonical}">
    <script type="application/ld+json">
{article_schema}
    </script>
    <script type="application/ld+json">
{breadcrumb_schema}
    </script>
    <script type="application/ld+json">
{faq_schema}
    </script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="../../manifest.json">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../../../css/app.css">
    <script>localStorage.setItem('arc-region','de');</script>
    <style>
      .bl-wrap{{max-width:900px;margin:0 auto;padding:24px 20px 64px;}}
      .bl-breadcrumb{{font-size:13px;color:var(--text-muted);margin-bottom:16px;}}
      .bl-breadcrumb a{{color:var(--text-muted);text-decoration:none;}}
      .bl-breadcrumb a:hover{{color:var(--accent);}}
      .bl-hero{{padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .bl-badge{{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--border);color:var(--text-muted);font-size:12px;margin-bottom:12px;font-weight:600;}}
      .bl-hero h1{{font:700 clamp(24px,4vw,32px)/1.25 Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .bl-hero p{{color:var(--text-muted);max-width:720px;margin:0;line-height:1.6;}}
      .bl-factbox{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 22px;margin-bottom:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;}}
      .bl-fact strong{{display:block;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;}}
      .bl-fact span{{font-size:14px;color:var(--heading);font-weight:600;line-height:1.4;}}
      .bl-section{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 22px;margin-bottom:16px;}}
      .bl-section h2{{font:600 19px Poppins,sans-serif;color:var(--heading);margin:0 0 10px;}}
      .bl-section p{{color:var(--text);line-height:1.65;margin:0 0 8px;}}
      .bl-cta{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin-top:24px;text-align:center;}}
      .bl-cta a{{display:inline-block;padding:12px 22px;border-radius:10px;background:var(--accent);color:var(--accent-text);text-decoration:none;font:600 15px Poppins,sans-serif;}}
      .bl-faq details{{border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden;background:var(--surface);}}
      .bl-faq summary{{padding:14px 18px;cursor:pointer;font:600 15px Poppins,sans-serif;color:var(--heading);list-style:none;}}
      .bl-faq summary::-webkit-details-marker{{display:none;}}
      .bl-faq summary::after{{content:"+";float:right;}}
      .bl-faq details[open] summary::after{{content:"\u2212";}}
      .bl-faq details p{{padding:14px 18px;margin:0;color:var(--text);line-height:1.6;}}
      .bl-related{{margin-top:28px;padding-top:20px;border-top:1px solid var(--border);}}
      .bl-related h2{{font:600 18px Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .bl-related ul{{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;}}
      .bl-related a{{display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--heading);background:var(--surface);font-size:13px;}}
      .bl-related a:hover{{border-color:var(--accent);}}
      @media (max-width:600px){{.bl-wrap{{padding:16px 14px 48px;}}.bl-section,.bl-factbox{{padding:16px;}}}}
    </style>
</head>
<body>
    <a id="lang-toggle-en" href="#" role="button" aria-label="Switch to English" title="Translate to English via Google" style="position:fixed;top:14px;right:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:var(--accent,#D9FE06);color:var(--accent-text,#12151A);font:600 13px/1 Poppins,system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.18);border:1px solid rgba(0,0,0,.12);" onclick="var h=location.hostname;if(h==='localhost'||/^127\\.|^192\\.168\\.|^10\\.|^172\\.(1[6-9]|2[0-9]|3[01])\\./.test(h)||h===''){alert('Auto-Übersetzung funktioniert nur auf der Live-Website tool.teamzlab.com.\\n\\nAuto-translate works only on the live site, not on localhost.');return false;}window.location='https://'+h.replace(/\\./g,'-')+'.translate.goog'+location.pathname+'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';return false;"><span style="font-size:14px;line-height:1;">EN</span><span>Translate</span></a>
    <a href="../../" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>

    <main class="bl-wrap">
        <nav class="bl-breadcrumb" aria-label="Breadcrumb"><a href="../../">AlwaysReady Care</a> &rsaquo; <a href="../">Bundesländer</a> &rsaquo; {name}</nav>
        <header class="bl-hero">
            <span class="bl-badge">{short} &middot; Bundesland</span>
            <h1>MD-Prüfung {name} 2026 — Heimaufsicht, QPR & {short}-Pflegegesetz</h1>
            <p>Pflegeeinrichtungen in {name} unterliegen der jährlichen MD-Prüfung nach § 114 SGB XI sowie der Heimaufsicht nach {short}-Landesrecht. Hier erhalten Sie eine kompakte Übersicht der wichtigsten Besonderheiten.</p>
        </header>

        <section class="bl-factbox">
            <div class="bl-fact"><strong>Bundesland</strong><span>{name}</span></div>
            <div class="bl-fact"><strong>Landesrecht</strong><span>{law}</span></div>
            <div class="bl-fact"><strong>Heimaufsicht</strong><span>{authority}</span></div>
            <div class="bl-fact"><strong>Pflegeeinrichtungen</strong><span>{hospitals}</span></div>
        </section>

        <section class="bl-section">
            <h2>Pflegemarkt in {name}</h2>
            <p>{context}</p>
        </section>

        <section class="bl-section">
            <h2>Zwei Prüfebenen: MD-Prüfung &amp; Heimaufsicht</h2>
            <p>Pflegeeinrichtungen in {name} werden auf zwei Ebenen geprüft: Der Medizinische Dienst (MD) prüft bundesweit einheitlich nach § 114 SGB XI und den QPR-Richtlinien (Qualitätsprüfungs-Richtlinien). Zusätzlich prüft die Heimaufsicht nach dem {short}-Landesrecht — in diesem Fall {law}.</p>
            <p>Beide Prüfungen können getrennt oder koordiniert stattfinden. Für Einrichtungen bedeutet das: Neben der MD-relevanten Dokumentation (QPR-Kategorien, Expertenstandards, SIS) müssen landesrechtliche Anforderungen (Baustandards, Personalschlüssel, Bewohnerrechte) belegt werden.</p>
        </section>

        <section class="bl-section">
            <h2>So bereiten Sie sich auf die MD-Prüfung in {name} vor</h2>
            <p>Die Vorbereitung unterscheidet sich nicht grundsätzlich vom bundesweiten Vorgehen — der MD prüft überall einheitlich nach QPR. Unterschiede bestehen bei der Heimaufsicht: Prüfschwerpunkte, Meldepflichten und Prüffrequenz variieren je Bundesland. Nutzen Sie die interaktive <a href="../../md-pruefung-checkliste/" style="color:var(--accent);">MD-Prüfung Checkliste</a> als Einstieg, den <a href="../../qualitaetsindikatoren-check/" style="color:var(--accent);">Qualitätsindikatoren Selbstcheck</a> zur Tiefenprüfung und den <a href="../../pflegesoftware-vergleich/" style="color:var(--accent);">Pflegesoftware-Vergleich</a> zur Auswahl passender Werkzeuge.</p>
        </section>

        <div class="bl-cta">
            <p style="color:var(--text-muted);margin:0 0 12px;">AlwaysReady Care unterstützt Pflegeeinrichtungen in {name} bei der MD-Prüfungs-Vorbereitung — 24 QPR-Kategorien, SIS-Vorlagen, MD-Prüfungsmappe in einer App.</p>
            <a href="../../">AlwaysReady Care kostenlos starten</a>
        </div>

        <section class="bl-section bl-faq">
            <h2>Häufige Fragen zur MD-Prüfung in {name}</h2>
            <details><summary>Gilt die QPR auch in {name}?</summary><p>Ja. Die Qualitätsprüfungs-Richtlinien (QPR) des Qualitätsausschusses Pflege gelten bundesweit einheitlich für alle zugelassenen Pflegeeinrichtungen, inklusive {name}. Unterschiede bestehen nur in der landesrechtlichen Heimaufsicht nach {law}.</p></details>
            <details><summary>Wer ist Heimaufsicht in {name}?</summary><p>Zuständig ist die {authority}. Sie prüft ergänzend zum MD nach dem {law} und achtet auf Bewohnerrechte, Baustandards, Personal und Dokumentation.</p></details>
            <details><summary>Wie oft prüft der MD Einrichtungen in {name}?</summary><p>Mindestens einmal pro Jahr, unangekündigt, nach § 114 SGB XI. Bei Auffälligkeiten oder Beschwerden können Anlassprüfungen hinzukommen.</p></details>
            <details><summary>Gibt es in {name} zusätzliche Meldepflichten?</summary><p>Landesrechtliche Meldepflichten (z. B. schwere Vorkommnisse, Personalunterschreitungen, Gefährdungen) bestehen in allen Bundesländern — Details regelt das {law}. Informieren Sie sich bei der {authority}.</p></details>
            <details><summary>Kann die Heimaufsicht gemeinsam mit dem MD prüfen?</summary><p>Ja. In vielen Bundesländern werden Prüftermine abgestimmt oder koordiniert durchgeführt, um Doppelaufwand zu vermeiden. In {name} ist das je nach Landkreis und Aufsichtsbehörde unterschiedlich geregelt.</p></details>
        </section>

        <section class="bl-related">
            <h2>MD-Prüfung in anderen Bundesländern</h2>
            <ul>{related_html}</ul>
        </section>
    </main>
</body>
</html>
'''


def render_page(state, all_states):
    canonical = f'{BASE_URL}/{state["slug"]}/'
    meta_title = f'MD-Prüfung {state["name"]} 2026 — Heimaufsicht & QPR'
    if len(meta_title) > 62:
        meta_title = f'MD-Prüfung {state["short"]} 2026 — Heimaufsicht & QPR'
    meta_desc = (f'MD-Prüfung in {state["name"]}: {state["law"]}, Heimaufsicht, '
                 f'QPR und Pflegemarkt-Überblick. Kostenlose Checkliste & Tools.')[:155]
    og_title = f'MD-Prüfung {state["name"]} — Heimaufsicht & QPR 2026'
    keywords = (f'md prüfung {state["name"].lower()}, pflegeheim aufsicht {state["name"].lower()}, '
                f'heimaufsicht {state["name"].lower()}, {state["name"].lower()} pflegegesetz, '
                f'qualitätsprüfung {state["name"].lower()}, {state["law"].lower()}, pflege {state["short"]}, '
                f'pflegeeinrichtung {state["name"].lower()}, md pr\u00fcfung {state["short"].lower()}')

    article_schema = json.dumps({
        '@context': 'https://schema.org', '@type': 'Article',
        'headline': f'MD-Prüfung {state["name"]} 2026 — Heimaufsicht & QPR',
        'description': f'Übersicht der MD-Prüfung und Heimaufsicht in {state["name"]} nach {state["law"]}.',
        'inLanguage': 'de-DE',
        'author': {'@type': 'Organization', 'name': 'Teamz Lab Ltd'},
        'publisher': {'@type': 'Organization', 'name': 'Teamz Lab Ltd'},
        'mainEntityOfPage': canonical,
        'about': {'@type': 'Place', 'name': state['name'], 'containedInPlace': {'@type': 'Country', 'name': 'Deutschland'}}
    }, ensure_ascii=False, indent=2)

    breadcrumb_schema = json.dumps({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Startseite', 'item': 'https://tool.teamzlab.com/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'AlwaysReady Care DE', 'item': 'https://tool.teamzlab.com/apps/always-ready-care/de/'},
            {'@type': 'ListItem', 'position': 3, 'name': 'Bundesländer', 'item': f'{BASE_URL}/'},
            {'@type': 'ListItem', 'position': 4, 'name': state['name'], 'item': canonical}
        ]
    }, ensure_ascii=False, indent=2)

    faqs = [
        (f'Gilt die QPR auch in {state["name"]}?', f'Ja. Die QPR des Qualitätsausschusses Pflege gilt bundesweit einheitlich. Unterschiede bestehen nur in der landesrechtlichen Heimaufsicht nach {state["law"]}.'),
        (f'Wer ist Heimaufsicht in {state["name"]}?', f'Zuständig ist die {state["authority"]}. Sie prüft ergänzend zum MD nach dem {state["law"]}.'),
        (f'Wie oft prüft der MD Einrichtungen in {state["name"]}?', 'Mindestens einmal pro Jahr, unangekündigt, nach § 114 SGB XI. Bei Auffälligkeiten können Anlassprüfungen hinzukommen.'),
        (f'Gibt es in {state["name"]} zusätzliche Meldepflichten?', f'Ja, landesrechtliche Meldepflichten regelt das {state["law"]}. Informieren Sie sich bei der {state["authority"]}.'),
        (f'Kann die Heimaufsicht gemeinsam mit dem MD prüfen?', f'Ja. In vielen Bundesländern werden Prüftermine abgestimmt. In {state["name"]} ist das je nach Landkreis und Aufsichtsbehörde unterschiedlich geregelt.'),
    ]
    faq_schema = json.dumps({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}}
            for q, a in faqs
        ]
    }, ensure_ascii=False, indent=2)

    related = [s for s in all_states if s['slug'] != state['slug']][:8]
    related_html = ''.join(
        f'<li><a href="../{s["slug"]}/">{html.escape(s["name"])}</a></li>'
        for s in related
    )

    return PAGE_TMPL.format(
        meta_title=html.escape(meta_title), meta_desc=html.escape(meta_desc),
        og_title=html.escape(og_title), canonical=canonical, keywords=html.escape(keywords),
        article_schema=article_schema, breadcrumb_schema=breadcrumb_schema, faq_schema=faq_schema,
        name=html.escape(state['name']), short=html.escape(state['short']),
        law=html.escape(state['law']), authority=html.escape(state['authority']),
        hospitals=html.escape(state['hospitals']), context=html.escape(state['context']),
        related_html=related_html
    )


HUB_TMPL = '''<!DOCTYPE html>
<html lang="de-DE" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MD-Prüfung nach Bundesland — 16 Übersichten (2026)</title>
    <meta name="description" content="MD-Prüfung und Heimaufsicht in allen 16 Bundesländern Deutschlands. Übersicht der Landesgesetze, Aufsichtsbehörden und Pflegemärkte.">
    <link rel="canonical" href="{base_url}/">
    <meta property="og:title" content="MD-Prüfung nach Bundesland — 16 Übersichten">
    <meta property="og:description" content="Heimaufsicht und QPR-Prüfung in allen 16 deutschen Bundesländern. Landesrecht, Aufsichtsbehörden, Pflegemarkt.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{base_url}/">
    <meta property="og:image" content="https://tool.teamzlab.com/apps/always-ready-care/icons/icon-512.png">
    <meta name="keywords" content="md prüfung bundesländer, heimaufsicht bundesland, pflegegesetz bundesländer, qpr bundesland, pflegeheim aufsicht deutschland, landesrecht pflege">
    <link rel="alternate" hreflang="de-DE" href="{base_url}/">
    <link rel="alternate" hreflang="x-default" href="{base_url}/">
    <script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "MD-Prüfung nach Bundesland",
  "inLanguage": "de-DE",
  "description": "Übersicht der MD-Prüfung und Heimaufsicht in allen 16 deutschen Bundesländern.",
  "hasPart": [{has_parts}]
}}
    </script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="../manifest.json">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../../css/app.css">
    <script>localStorage.setItem('arc-region','de');</script>
    <style>
      .blh{{max-width:1050px;margin:0 auto;padding:24px 20px 64px;}}
      .blh-hero{{padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .blh-hero h1{{font:700 clamp(24px,4vw,32px)/1.25 Poppins,sans-serif;color:var(--heading);margin:0 0 10px;}}
      .blh-hero p{{color:var(--text-muted);max-width:720px;margin:0;line-height:1.6;}}
      .blh-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;}}
      .blh-card{{display:block;padding:16px;border:1px solid var(--border);border-radius:12px;background:var(--surface);text-decoration:none;color:var(--text);transition:border-color .2s,transform .2s;}}
      .blh-card:hover{{border-color:var(--accent);transform:translateY(-2px);}}
      .blh-card-short{{display:inline-block;padding:2px 8px;border-radius:999px;background:var(--bg);border:1px solid var(--border);color:var(--accent);font-size:11px;font-weight:700;margin-bottom:8px;}}
      .blh-card h2{{font:600 16px Poppins,sans-serif;color:var(--heading);margin:0 0 4px;}}
      .blh-card p{{font-size:12px;color:var(--text-muted);margin:0;line-height:1.4;}}
      .blh-content{{margin-top:32px;color:var(--text);line-height:1.7;}}
      .blh-content h2{{font:600 22px Poppins,sans-serif;color:var(--heading);margin:20px 0 10px;}}
      .blh-content p{{margin:0 0 10px;}}
      @media (max-width:600px){{.blh{{padding:16px 14px 48px;}}}}
    </style>
</head>
<body>
    <a id="lang-toggle-en" href="#" role="button" aria-label="Switch to English" title="Translate to English via Google" style="position:fixed;top:14px;right:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:var(--accent,#D9FE06);color:var(--accent-text,#12151A);font:600 13px/1 Poppins,system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.18);border:1px solid rgba(0,0,0,.12);" onclick="var h=location.hostname;if(h==='localhost'||/^127\\.|^192\\.168\\.|^10\\.|^172\\.(1[6-9]|2[0-9]|3[01])\\./.test(h)||h===''){alert('Auto-Übersetzung funktioniert nur auf der Live-Website tool.teamzlab.com.\\n\\nAuto-translate works only on the live site, not on localhost.');return false;}window.location='https://'+h.replace(/\\./g,'-')+'.translate.goog'+location.pathname+'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';return false;"><span style="font-size:14px;line-height:1;">EN</span><span>Translate</span></a>
    <a href="../" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>
    <main class="blh">
        <header class="blh-hero">
            <h1>MD-Prüfung nach Bundesland — 16 Übersichten (2026)</h1>
            <p>Pflegeeinrichtungen in Deutschland werden bundesweit einheitlich nach QPR geprüft — die Heimaufsicht hingegen ist Sache der Bundesländer. Hier finden Sie kompakte Übersichten für alle 16 Länder mit Landesrecht, zuständiger Aufsichtsbehörde und Pflegemarkt-Kennzahlen.</p>
        </header>

        <div class="blh-grid">{cards}</div>

        <section class="blh-content">
            <h2>Warum 16 verschiedene Heimrechte?</h2>
            <p>Während die MD-Prüfung nach § 114 SGB XI bundesweit einheitlich geregelt ist, fällt die Heimaufsicht nach dem Grundgesetz in die Zuständigkeit der Bundesländer. Jedes Bundesland hat daher ein eigenes Wohn- und Teilhabegesetz (oder ähnlich benanntes Gesetz), das zusätzliche Prüfungen, Meldepflichten und Bewohnerrechte regelt.</p>

            <h2>Was bedeutet das für Pflegeeinrichtungen?</h2>
            <p>Einrichtungen unterliegen zwei Prüfungsebenen: der bundesweiten MD-Prüfung (QPR, 24 Kategorien, 98 Indikatorfragen) und der landesspezifischen Heimaufsicht. Während die MD-relevanten Dokumente (SIS, Expertenstandards, Pflegeplanung) überall gleich sind, variieren landesrechtliche Meldepflichten, Baustandards und Personalvorgaben stark.</p>

            <h2>Einheitlich bleibt</h2>
            <p>Nachweise über die Anwendung der DNQP-Expertenstandards, saubere SIS-Dokumentation nach Strukturmodell, Erfüllung der Qualitätsindikatoren (QDVS) und eine vollständige MD-Prüfungsmappe — diese Säulen gelten überall. AlwaysReady Care unterstützt genau diese einheitlichen Anforderungen; landesrechtliche Besonderheiten prüfen Sie zusätzlich mit Ihrer zuständigen Heimaufsicht.</p>
        </section>
    </main>
</body>
</html>
'''


def render_hub():
    cards = []
    has_parts = []
    for s in STATES:
        cards.append(
            f'<a class="blh-card" href="{s["slug"]}/">'
            f'<span class="blh-card-short">{html.escape(s["short"])}</span>'
            f'<h2>{html.escape(s["name"])}</h2>'
            f'<p>{html.escape(s["law"])}</p>'
            f'</a>'
        )
        has_parts.append(json.dumps({
            '@type': 'WebPage',
            'name': f'MD-Prüfung {s["name"]}',
            'url': f'{BASE_URL}/{s["slug"]}/'
        }, ensure_ascii=False))
    return HUB_TMPL.format(
        base_url=BASE_URL,
        cards='\n            '.join(cards),
        has_parts=','.join(has_parts)
    )


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for s in STATES:
        d = os.path.join(OUT_DIR, s['slug'])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(render_page(s, STATES))
        print(f'BUILT: de/bundeslaender/{s["slug"]}/index.html')
    with open(os.path.join(OUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(render_hub())
    print(f'BUILT: de/bundeslaender/index.html (hub)')


if __name__ == '__main__':
    main()
