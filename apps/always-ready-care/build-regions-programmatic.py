#!/usr/bin/env python3
"""
Generate per-region landing pages for UK, AU, NZ, IE.
UK: 9 NHS England regions + Scotland + Wales + NI (12 total)
AU: 8 states/territories (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)
NZ: 20 Te Whatu Ora districts (former DHBs)
IE: 9 CHOs (Community Healthcare Organisations)

Output: /apps/always-ready-care/<country>/regions/<slug>/ + /regions/ hub
"""
import os, json, html

BASE = os.path.dirname(os.path.abspath(__file__))

COUNTRIES = {
    'uk': {
        'folder':'','lang':'en-GB','regulator':'CQC','region_label':'NHS region / nation',
        'hub_title':'Care Home Compliance by UK Region — 12 Guides',
        'hub_desc':'Care home compliance across UK NHS regions and devolved nations. CQC (England), Care Inspectorate (Scotland), CIW (Wales), RQIA (NI).',
        'hub_keywords':'care home regions uk, cqc regions, nhs england regions care home, care inspectorate, ciw wales, rqia northern ireland',
        'regions':[
            {'slug':'north-east-yorkshire','name':'North East & Yorkshire','reg':'CQC','law':'Health and Social Care Act 2008','authority':'CQC NE&Y regional office','note':'Covers Leeds, Sheffield, Newcastle, Hull plus all Yorkshire ICBs.'},
            {'slug':'north-west','name':'North West England','reg':'CQC','law':'Health and Social Care Act 2008','authority':'CQC NW regional office','note':'Covers Greater Manchester, Liverpool, Lancashire, Cheshire ICBs.'},
            {'slug':'midlands','name':'Midlands','reg':'CQC','law':'Health and Social Care Act 2008','authority':'CQC Midlands regional office','note':'Covers Birmingham, Nottingham, Leicester and the East/West Midlands ICBs.'},
            {'slug':'east-of-england','name':'East of England','reg':'CQC','law':'Health and Social Care Act 2008','authority':'CQC East of England regional office','note':'Covers Cambridge, Norwich, Essex and Hertfordshire ICBs.'},
            {'slug':'london','name':'London','reg':'CQC','law':'Health and Social Care Act 2008','authority':'CQC London regional office','note':'Covers all London ICBs including NW London, NC London, NE London, SE London and SW London.'},
            {'slug':'south-east','name':'South East England','reg':'CQC','law':'Health and Social Care Act 2008','authority':'CQC South East regional office','note':'Covers Kent, Sussex, Surrey, Hampshire, Thames Valley.'},
            {'slug':'south-west','name':'South West England','reg':'CQC','law':'Health and Social Care Act 2008','authority':'CQC South West regional office','note':'Covers Cornwall, Devon, Somerset, Bristol, Gloucestershire.'},
            {'slug':'scotland','name':'Scotland','reg':'Care Inspectorate','law':'Public Services Reform (Scotland) Act 2010','authority':'Care Inspectorate','note':'Scotland is regulated by the Care Inspectorate (not CQC). National Care Standards apply.'},
            {'slug':'wales','name':'Wales','reg':'CIW','law':'Regulation and Inspection of Social Care (Wales) Act 2016','authority':'Care Inspectorate Wales (CIW)','note':'Wales is regulated by CIW. Regulations 2017 apply for care home services.'},
            {'slug':'northern-ireland','name':'Northern Ireland','reg':'RQIA','law':'Health and Personal Social Services (Quality, Improvement and Regulation) (Northern Ireland) Order 2003','authority':'RQIA','note':'RQIA regulates care homes in NI. Minimum Standards for Nursing Homes apply.'}
        ],
        'note':'CQC regulates England only. Scotland, Wales and Northern Ireland have separate regulators and legislation.'
    },
    'au': {
        'folder':'au','lang':'en-AU','regulator':'ACQSC','region_label':'state / territory',
        'hub_title':'Aged Care Compliance by Australian State — 8 Guides',
        'hub_desc':'Aged care compliance across all 8 Australian states and territories. Federal ACQSC regulation plus state-level considerations.',
        'hub_keywords':'aged care states australia, acqs states, aged care nsw, aged care vic, aged care qld, aged care commission states, aged care by state',
        'regions':[
            {'slug':'new-south-wales','name':'New South Wales','reg':'ACQSC (Federal) + NSW Health','law':'Aged Care Act 1997; NSW Public Health Act 2010','authority':'ACQSC + NSW Ministry of Health','note':'NSW has ~880 residential aged care facilities, the largest state cohort. State oversight for certain cross-over services (MPS, transition care).'},
            {'slug':'victoria','name':'Victoria','reg':'ACQSC (Federal) + DH Victoria','law':'Aged Care Act 1997; VIC Health Services Act 1988','authority':'ACQSC + Department of Health Victoria','note':'VIC is the second-largest market with ~730 facilities and significant public residential aged care (PRAC) footprint.'},
            {'slug':'queensland','name':'Queensland','reg':'ACQSC (Federal) + QLD Health','law':'Aged Care Act 1997; QLD Hospital and Health Boards Act 2011','authority':'ACQSC + Queensland Health','note':'QLD has ~470 facilities with significant rural/remote coverage challenges.'},
            {'slug':'western-australia','name':'Western Australia','reg':'ACQSC (Federal) + WA Health','law':'Aged Care Act 1997; WA Health Services Act 2016','authority':'ACQSC + Department of Health WA','note':'WA has ~280 facilities with extensive regional / remote and Aboriginal-specific programs.'},
            {'slug':'south-australia','name':'South Australia','reg':'ACQSC (Federal) + SA Health','law':'Aged Care Act 1997; SA Health Care Act 2008','authority':'ACQSC + SA Health','note':'SA has ~240 facilities. State-run residential aged care transitioning under reform.'},
            {'slug':'tasmania','name':'Tasmania','reg':'ACQSC (Federal) + DoH Tasmania','law':'Aged Care Act 1997; TAS Residential Care Services Act 2005','authority':'ACQSC + Tasmanian Department of Health','note':'TAS has ~65 facilities — smaller market with demographic pressure.'},
            {'slug':'australian-capital-territory','name':'Australian Capital Territory','reg':'ACQSC (Federal) + ACT Health','law':'Aged Care Act 1997; ACT Public Health Act 1997','authority':'ACQSC + ACT Health','note':'ACT has ~30 facilities; smallest jurisdictional cohort.'},
            {'slug':'northern-territory','name':'Northern Territory','reg':'ACQSC (Federal) + NT Health','law':'Aged Care Act 1997','authority':'ACQSC + NT Department of Health','note':'NT has ~25 facilities with distinctive Aboriginal community service delivery.'}
        ],
        'note':'Aged care is primarily a Commonwealth responsibility under the Aged Care Act. States have adjunct roles in public residential aged care, health cross-overs, and building/environmental regulation.'
    },
    'nz': {
        'folder':'nz','lang':'en-NZ','regulator':'HealthCERT / DAA','region_label':'former-DHB district',
        'hub_title':'Aged Residential Care Compliance by NZ District — 20 Guides',
        'hub_desc':'ARC compliance across all 20 former-DHB districts (now Te Whatu Ora regions). NZS 8134 standards apply nationally.',
        'hub_keywords':'nz rest home regions, nz aged care districts, te whatu ora regions, former dhb aged care, healthcert regions',
        'regions':[
            {'slug':'northland','name':'Northland','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021; Health and Disability Services (Safety) Act 2001','authority':'HealthCERT + Te Whatu Ora Northland','note':'Northland serves Whangārei, Kaipara and Far North districts. Strong kaupapa Māori community care focus.'},
            {'slug':'waitemata','name':'Waitematā','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Waitematā','note':'Waitematā covers North Auckland — the largest single former-DHB catchment with 640,000+ population.'},
            {'slug':'auckland','name':'Auckland','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Auckland','note':'Central Auckland region — densely served with significant Pacific community needs.'},
            {'slug':'counties-manukau','name':'Counties Manukau','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Counties Manukau','note':'South Auckland — serves Manukau, Papakura, Franklin with substantial Pacific and Māori populations.'},
            {'slug':'waikato','name':'Waikato','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Waikato','note':'Waikato covers Hamilton plus Thames-Coromandel, Taupō, and ancillary rural areas.'},
            {'slug':'bay-of-plenty','name':'Bay of Plenty','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Bay of Plenty','note':'Bay of Plenty serves Tauranga and Whakatāne regions.'},
            {'slug':'lakes','name':'Lakes','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Lakes','note':'Lakes covers Rotorua and Taupō regions, strong Māori cultural integration.'},
            {'slug':'tairāwhiti','name':'Tairāwhiti','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Tairāwhiti','note':'Tairāwhiti (East Coast) serves Gisborne. Smaller cohort with rural access considerations.'},
            {'slug':'taranaki','name':'Taranaki','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Taranaki','note':'Taranaki serves New Plymouth, Stratford, and Hāwera regions.'},
            {'slug':'hawkes-bay','name':'Hawke\'s Bay','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Hawke\'s Bay','note':'Hawke\'s Bay covers Napier, Hastings, and Central Hawke\'s Bay.'},
            {'slug':'whanganui','name':'Whanganui','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Whanganui','note':'Whanganui covers Whanganui, Rangitikei, and Ruapehu districts.'},
            {'slug':'midcentral','name':'MidCentral','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora MidCentral','note':'MidCentral covers Palmerston North, Horowhenua, Tararua, Ōtaki.'},
            {'slug':'capital-coast','name':'Capital & Coast','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Capital & Coast','note':'Capital & Coast serves Wellington, Porirua, Kāpiti Coast.'},
            {'slug':'hutt-valley','name':'Hutt Valley','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Hutt Valley','note':'Hutt Valley covers Lower Hutt and Upper Hutt.'},
            {'slug':'wairarapa','name':'Wairarapa','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Wairarapa','note':'Wairarapa serves Masterton, Carterton, South Wairarapa — smaller rural-focused cohort.'},
            {'slug':'nelson-marlborough','name':'Nelson Marlborough','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Nelson Marlborough','note':'Nelson Marlborough covers Nelson City, Tasman, Marlborough.'},
            {'slug':'west-coast','name':'West Coast','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora West Coast','note':'West Coast covers Buller, Grey, Westland — smallest district by population with access challenges.'},
            {'slug':'canterbury','name':'Canterbury','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Canterbury','note':'Canterbury covers Christchurch, Selwyn, Waimakariri plus surrounding rural. Second-largest cohort.'},
            {'slug':'south-canterbury','name':'South Canterbury','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora South Canterbury','note':'South Canterbury serves Timaru, Mackenzie, Waimate.'},
            {'slug':'southern','name':'Southern','reg':'HealthCERT + Te Whatu Ora','law':'NZS 8134:2021','authority':'HealthCERT + Te Whatu Ora Southern','note':'Southern covers Dunedin, Otago, Southland — large geographic region with dispersed providers.'}
        ],
        'note':'Since 2022 the 20 former-DHBs were dissolved into a single Te Whatu Ora Health NZ with district structure. HealthCERT remains the national certification authority.'
    },
    'ie': {
        'folder':'ie','lang':'en-IE','regulator':'HIQA','region_label':'CHO area',
        'hub_title':'Nursing Home Compliance by Irish CHO — 9 Guides',
        'hub_desc':'HIQA compliance across all 9 Community Healthcare Organisations (CHOs) in Ireland. National Standards apply nationally.',
        'hub_keywords':'ireland cho areas, hiqa regions, nursing home regions ireland, community healthcare organisation, cho 1 cho 2 cho 3 cho 4 cho 5 cho 6 cho 7 cho 8 cho 9',
        'regions':[
            {'slug':'cho-1','name':'CHO 1 (Cavan, Donegal, Leitrim, Monaghan, Sligo)','reg':'HIQA + HSE CHO 1','law':'Health Act 2007; National Standards for Residential Care','authority':'HIQA + HSE CHO 1','note':'CHO 1 covers the North West with notable rural health-access considerations.'},
            {'slug':'cho-2','name':'CHO 2 (Galway, Mayo, Roscommon)','reg':'HIQA + HSE CHO 2','law':'Health Act 2007','authority':'HIQA + HSE CHO 2','note':'CHO 2 covers the West of Ireland with significant rural cohort.'},
            {'slug':'cho-3','name':'CHO 3 (Clare, Limerick, North Tipperary)','reg':'HIQA + HSE CHO 3','law':'Health Act 2007','authority':'HIQA + HSE CHO 3','note':'CHO 3 covers Mid-West Ireland centred on Limerick.'},
            {'slug':'cho-4','name':'CHO 4 (Cork, Kerry)','reg':'HIQA + HSE CHO 4','law':'Health Act 2007','authority':'HIQA + HSE CHO 4','note':'CHO 4 is the South-West — Cork is the largest designated-centre market outside Dublin.'},
            {'slug':'cho-5','name':'CHO 5 (Carlow, Kilkenny, South Tipperary, Waterford, Wexford)','reg':'HIQA + HSE CHO 5','law':'Health Act 2007','authority':'HIQA + HSE CHO 5','note':'CHO 5 is the South-East.'},
            {'slug':'cho-6','name':'CHO 6 (Dublin South East, Dún Laoghaire, Wicklow)','reg':'HIQA + HSE CHO 6','law':'Health Act 2007','authority':'HIQA + HSE CHO 6','note':'CHO 6 covers South Dublin and Wicklow.'},
            {'slug':'cho-7','name':'CHO 7 (Dublin South West, Dublin West, Kildare, West Wicklow)','reg':'HIQA + HSE CHO 7','law':'Health Act 2007','authority':'HIQA + HSE CHO 7','note':'CHO 7 is Dublin South-West including Kildare.'},
            {'slug':'cho-8','name':'CHO 8 (Laois, Longford, Louth, Meath, Offaly, Westmeath)','reg':'HIQA + HSE CHO 8','law':'Health Act 2007','authority':'HIQA + HSE CHO 8','note':'CHO 8 covers the Midlands and North-East.'},
            {'slug':'cho-9','name':'CHO 9 (Dublin North, Dublin North Central, Dublin North West)','reg':'HIQA + HSE CHO 9','law':'Health Act 2007','authority':'HIQA + HSE CHO 9','note':'CHO 9 is North Dublin.'}
        ],
        'note':'HIQA inspects nationally; HSE operates services via 9 Community Healthcare Organisations.'
    }
}


PAGE_TMPL = '''<!DOCTYPE html>
<html lang="{lang}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="{canonical}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical}">
    <meta property="og:image" content="https://tool.teamzlab.com/apps/always-ready-care/icons/icon-512.png">
    <meta name="keywords" content="{keywords}">
    <link rel="alternate" hreflang="{lang}" href="{canonical}">
    <script type="application/ld+json">
{article_schema}
    </script>
    <script type="application/ld+json">
{breadcrumb_schema}
    </script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="{manifest_path}">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{css_path}">
    <script>localStorage.setItem('arc-region','{region_code}');</script>
    <style>
      .rg-wrap{{max-width:880px;margin:0 auto;padding:24px 20px 64px;}}
      .rg-bc{{font-size:13px;color:var(--text-muted);margin-bottom:16px;}}
      .rg-bc a{{color:var(--text-muted);text-decoration:none;}}
      .rg-bc a:hover{{color:var(--accent);}}
      .rg-hero{{padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .rg-badge{{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--border);color:var(--text-muted);font-size:12px;margin-bottom:12px;font-weight:600;}}
      .rg-hero h1{{font:700 clamp(22px,4vw,30px) Poppins,sans-serif;color:var(--heading);margin:0 0 10px;}}
      .rg-hero p{{color:var(--text-muted);max-width:720px;margin:0;line-height:1.6;}}
      .rg-facts{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 22px;margin-bottom:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;}}
      .rg-fact strong{{display:block;font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;}}
      .rg-fact span{{font-size:13px;color:var(--heading);font-weight:600;line-height:1.4;}}
      .rg-section{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 22px;margin-bottom:16px;}}
      .rg-section h2{{font:600 18px Poppins,sans-serif;color:var(--heading);margin:0 0 10px;}}
      .rg-section p{{color:var(--text);line-height:1.65;margin:0 0 8px;}}
      .rg-cta{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin-top:24px;text-align:center;}}
      .rg-cta a{{display:inline-block;padding:12px 22px;border-radius:10px;background:var(--accent);color:var(--accent-text);text-decoration:none;font:600 15px Poppins,sans-serif;}}
      .rg-related{{margin-top:28px;padding-top:20px;border-top:1px solid var(--border);}}
      .rg-related h2{{font:600 18px Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .rg-related ul{{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;}}
      .rg-related a{{display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--heading);background:var(--surface);font-size:13px;}}
      .rg-related a:hover{{border-color:var(--accent);}}
      @media (max-width:600px){{.rg-wrap{{padding:16px 14px 48px;}}.rg-section,.rg-facts{{padding:16px;}}}}
    </style>
</head>
<body>
    <a href="{app_back}" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>

    <main class="rg-wrap">
        <nav class="rg-bc"><a href="{app_back}">AlwaysReady Care</a> &rsaquo; <a href="../">Regions</a> &rsaquo; {name}</nav>
        <header class="rg-hero">
            <span class="rg-badge">{country_label} &middot; Region</span>
            <h1>{h1}</h1>
            <p>{intro}</p>
        </header>

        <section class="rg-facts">
            <div class="rg-fact"><strong>Region</strong><span>{name}</span></div>
            <div class="rg-fact"><strong>Regulator</strong><span>{reg}</span></div>
            <div class="rg-fact"><strong>Framework / Law</strong><span>{law}</span></div>
            <div class="rg-fact"><strong>Authority</strong><span>{authority}</span></div>
        </section>

        <section class="rg-section">
            <h2>Regional context</h2>
            <p>{note}</p>
        </section>

        <section class="rg-section">
            <h2>What applies nationally vs. regionally</h2>
            <p>{national_note}</p>
        </section>

        <div class="rg-cta">
            <p style="color:var(--text-muted);margin:0 0 12px;">AlwaysReady Care helps providers in {name} stay inspection-ready — track evidence, generate packs, manage compliance in one app.</p>
            <a href="{app_back}">Start free with AlwaysReady Care</a>
        </div>

        <section class="rg-related">
            <h2>Other {country_label_lower} regions</h2>
            <ul>{related_html}</ul>
        </section>
    </main>
</body>
</html>
'''

HUB_TMPL = '''<!DOCTYPE html>
<html lang="{lang}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="{canonical}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical}">
    <meta property="og:image" content="https://tool.teamzlab.com/apps/always-ready-care/icons/icon-512.png">
    <meta name="keywords" content="{keywords}">
    <link rel="alternate" hreflang="{lang}" href="{canonical}">
    <script type="application/ld+json">
{collection_schema}
    </script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="{manifest_path}">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{css_path}">
    <script>localStorage.setItem('arc-region','{region_code}');</script>
    <style>
      .rgh{{max-width:1000px;margin:0 auto;padding:24px 20px 64px;}}
      .rgh-hero{{padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .rgh-hero h1{{font:700 clamp(24px,4vw,32px) Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .rgh-hero p{{color:var(--text-muted);max-width:720px;margin:0;line-height:1.6;}}
      .rgh-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}}
      .rgh-card{{display:block;padding:16px;border:1px solid var(--border);border-radius:12px;background:var(--surface);text-decoration:none;color:var(--text);transition:border-color .2s,transform .2s;}}
      .rgh-card:hover{{border-color:var(--accent);transform:translateY(-2px);}}
      .rgh-card h2{{font:600 16px Poppins,sans-serif;color:var(--heading);margin:0 0 6px;}}
      .rgh-card p{{font-size:12px;color:var(--text-muted);margin:0;line-height:1.5;}}
      .rgh-note{{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:18px;font-size:14px;color:var(--text);line-height:1.6;}}
      @media (max-width:600px){{.rgh{{padding:16px 14px 48px;}}}}
    </style>
</head>
<body>
    <a href="{app_back}" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>

    <main class="rgh">
        <header class="rgh-hero">
            <h1>{h1}</h1>
            <p>{intro}</p>
        </header>

        <div class="rgh-note"><i class="fas fa-info-circle" style="color:var(--accent);margin-right:6px;"></i>{note}</div>

        <div class="rgh-grid">{cards}</div>
    </main>
</body>
</html>
'''


def render_page(country_code, cfg, region, siblings):
    folder = cfg['folder']
    if folder:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/regions/{region["slug"]}/'
        css_path = '../../../css/app.css'
        manifest_path = '../../manifest.json'
        app_back = '../../'
        country_label = {'au':'Australia','nz':'New Zealand','ie':'Ireland'}[country_code]
    else:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/regions/{region["slug"]}/'
        css_path = '../../css/app.css'
        manifest_path = '../../manifest.json'
        app_back = '../../'
        country_label = 'United Kingdom'

    title = f'{cfg["regulator"]} in {region["name"]} — Compliance Guide'
    if len(title) > 70:
        title = f'{region["name"]} — Care Compliance Guide'
    desc = f'Care home / aged care compliance in {region["name"]}: {region["reg"]} regulation, {cfg["region_label"]} context, and free readiness tools.'
    keywords = f'care compliance {region["name"].lower()}, {region["reg"].lower()} {region["name"].lower()}, {cfg["regulator"].lower()} {region["name"].lower()}, {region["slug"]} care'
    h1 = f'Care Compliance in {region["name"]}'
    intro = f'Regulatory and compliance overview for care providers operating in {region["name"]}. Includes the applicable law, authority and context alongside national standards.'

    article_schema = json.dumps({
        '@context':'https://schema.org','@type':'Article',
        'headline':title,'description':desc,'inLanguage':cfg['lang'],
        'author':{'@type':'Organization','name':'Teamz Lab Ltd'},
        'publisher':{'@type':'Organization','name':'Teamz Lab Ltd'},
        'mainEntityOfPage':canonical,
        'about':{'@type':'Place','name':region['name']}
    }, ensure_ascii=False, indent=2)

    breadcrumb_schema = json.dumps({
        '@context':'https://schema.org','@type':'BreadcrumbList',
        'itemListElement':[
            {'@type':'ListItem','position':1,'name':'AlwaysReady Care','item':f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/' if folder else 'https://tool.teamzlab.com/apps/always-ready-care/'},
            {'@type':'ListItem','position':2,'name':'Regions','item':f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/regions/' if folder else 'https://tool.teamzlab.com/apps/always-ready-care/regions/'},
            {'@type':'ListItem','position':3,'name':region['name'],'item':canonical}
        ]
    }, ensure_ascii=False, indent=2)

    related_html = ''.join(f'<li><a href="../{s["slug"]}/">{html.escape(s["name"])}</a></li>' for s in siblings if s['slug'] != region['slug'])

    national_note = cfg['note']

    return PAGE_TMPL.format(
        lang=cfg['lang'], title=html.escape(title), desc=html.escape(desc),
        canonical=canonical, keywords=html.escape(keywords),
        article_schema=article_schema, breadcrumb_schema=breadcrumb_schema,
        css_path=css_path, manifest_path=manifest_path, app_back=app_back,
        region_code=folder if folder else 'uk',
        country_label=html.escape(country_label),
        country_label_lower=html.escape(country_label),
        name=html.escape(region['name']),
        h1=html.escape(h1), intro=html.escape(intro),
        reg=html.escape(region['reg']), law=html.escape(region['law']),
        authority=html.escape(region['authority']),
        note=html.escape(region['note']),
        national_note=html.escape(national_note),
        related_html=related_html
    )


def render_hub(country_code, cfg):
    folder = cfg['folder']
    if folder:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/regions/'
        css_path = '../../css/app.css'
        manifest_path = '../manifest.json'
        app_back = '../'
    else:
        canonical = 'https://tool.teamzlab.com/apps/always-ready-care/regions/'
        css_path = '../css/app.css'
        manifest_path = '../manifest.json'
        app_back = '../'

    collection_schema = json.dumps({
        '@context':'https://schema.org','@type':'CollectionPage',
        'name':cfg['hub_title'],'inLanguage':cfg['lang'],
        'description':cfg['hub_desc'],
        'hasPart':[{'@type':'WebPage','name':r['name'],'url':f'{canonical}{r["slug"]}/'} for r in cfg['regions']]
    }, ensure_ascii=False, indent=2)

    cards = '\n            '.join(
        f'<a class="rgh-card" href="{r["slug"]}/"><h2>{html.escape(r["name"])}</h2><p>{html.escape(r["reg"])}</p></a>'
        for r in cfg['regions']
    )

    return HUB_TMPL.format(
        lang=cfg['lang'], title=html.escape(cfg['hub_title']),
        desc=html.escape(cfg['hub_desc']), canonical=canonical,
        keywords=html.escape(cfg['hub_keywords']),
        collection_schema=collection_schema,
        css_path=css_path, manifest_path=manifest_path, app_back=app_back,
        region_code=folder if folder else 'uk',
        h1=html.escape(cfg['hub_title']),
        intro=html.escape(f'Care home and aged care regulatory guides for every {cfg["region_label"]}.'),
        note=html.escape(cfg['note']),
        cards=cards
    )


def main():
    for code, cfg in COUNTRIES.items():
        folder = cfg['folder']
        base_dir = os.path.join(BASE, folder, 'regions') if folder else os.path.join(BASE, 'regions')
        os.makedirs(base_dir, exist_ok=True)

        for region in cfg['regions']:
            d = os.path.join(base_dir, region['slug'])
            os.makedirs(d, exist_ok=True)
            with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(render_page(code, cfg, region, cfg['regions']))
            print(f'BUILT: {os.path.relpath(os.path.join(d, "index.html"), BASE)}')

        with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(render_hub(code, cfg))
        print(f'BUILT: {os.path.relpath(os.path.join(base_dir, "index.html"), BASE)} (hub)')


if __name__ == '__main__':
    main()
