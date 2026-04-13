#!/usr/bin/env python3
"""
Generate interactive inspection/audit checklists for UK, AU, NZ, IE.
Matches the pattern of the German md-pruefung-checkliste.

Output: /apps/always-ready-care/<region>/inspection-checklist/index.html
"""
import os, json, html

BASE = os.path.dirname(os.path.abspath(__file__))

COUNTRIES = {
    'uk': {
        'folder': '',
        'lang': 'en-GB',
        'regulator': 'CQC',
        'regulator_full': 'Care Quality Commission',
        'framework': '5 Key Questions',
        'inspection': 'CQC inspection',
        'currency': '£',
        'title': 'CQC Inspection Checklist 2026 — Free Interactive Tool',
        'desc': 'Free interactive CQC inspection checklist. 30 items across all 5 Key Questions, live scoring, print/share, DSGVO-compliant.',
        'keywords': 'cqc inspection checklist, cqc preparation checklist, cqc compliance checklist, care home inspection checklist, cqc audit checklist, cqc ready, cqc readiness, cqc inspection preparation, care home compliance checklist, cqc kloe checklist',
        'sections': [
            {'code':'Safe','title':'Safe','desc':'Safeguarding, medication, incidents, infection, risk.',
             'items':['Safeguarding policy current and team trained','DBS checks current for all staff','Medication audit within last 3 months','Accident/incident log complete with follow-up','Infection control audit current','Fire safety checks documented','Risk assessments current for all service users','Falls prevention plans in place','Whistleblowing policy visible to staff']},
            {'code':'Effective','title':'Effective','desc':'Care planning, nutrition, consent, training.',
             'items':['Care plans reviewed in last 6 months','Nutrition/hydration records complete','MCA/DoLS assessments current','Staff training matrix up to date','Mandatory training ≥ 90% completion','Deprivation of Liberty authorisations current','Consent documented for all interventions']},
            {'code':'Caring','title':'Caring',
             'desc':'Dignity, preferences, communication.',
             'items':['Personal care plans reflect preferences','Staff-resident interactions observed positive','Dignity-in-care training completed','Life stories/biographies recorded','End-of-life preferences documented']},
            {'code':'Responsive','title':'Responsive','desc':'Complaints, activities, person-centred care.',
             'items':['Complaints log with actions and timescales','Activities programme weekly with engagement logs','Person-centred care reviewed quarterly','Family/representative meetings documented']},
            {'code':'Well-led','title':'Well-led','desc':'Governance, leadership, quality improvement.',
             'items':['Governance audits monthly with minutes','Registered manager present with Statement of Purpose','Staff supervision records current','Quality improvement plan live','Regulation 17 audits evidence available','Duty of candour log maintained']}
        ],
        'faqs':[
            ('How often does CQC inspect care homes?','CQC inspection frequency is risk-based — typically every 1-2 years for Good services, sooner for Requires Improvement or Inadequate. New registrations inspect within 6-12 months.'),
            ('What are the 5 CQC Key Questions?','Safe, Effective, Caring, Responsive, Well-led. Each question has sub-questions (KLOEs) that CQC inspectors use during inspection.'),
            ('Is this CQC checklist official?','No — this is an independent readiness self-check. For official CQC guidance see cqc.org.uk. This tool helps your internal governance prep.'),
            ('What is CQC Regulation 17?','Good governance — requires providers to have systems for quality assurance, record-keeping and risk management. Most common reason homes are rated Requires Improvement.'),
            ('Does this checklist cover Single Assessment Framework?','Partially. This tool follows the 5 KQs structure that underpins the SAF and its 34 quality statements. For quality-statement-level detail see our framework hub.')
        ]
    },
    'au': {
        'folder': 'au',
        'lang': 'en-AU',
        'regulator': 'ACQSC',
        'regulator_full': 'Aged Care Quality and Safety Commission',
        'framework': '7 Strengthened Quality Standards',
        'inspection': 'Quality Assessment',
        'currency': 'A$',
        'title': 'Aged Care Quality Assessment Checklist 2026 — Free ACQS Tool',
        'desc': 'Free interactive ACQS assessment checklist. 28 items mapped to the 7 Strengthened Quality Standards. SIRS-ready, live scoring, print/share.',
        'keywords': 'aged care quality assessment checklist, acqs checklist, acqsc compliance checklist, aged care audit checklist australia, strengthened quality standards checklist, aged care preparation checklist, sirs checklist, aged care commission checklist',
        'sections':[
            {'code':'Std 1','title':'The Person','desc':'Identity, autonomy, informed consent, dignity.',
             'items':['Consumer identity and preferences documented','Informed consent recorded for each intervention','Dignity-of-risk framework applied']},
            {'code':'Std 2','title':'The Organisation','desc':'Governance, risk management, quality improvement.',
             'items':['Governance framework documented and active','Risk management plan current','Continuous improvement plan live with actions','Board/leadership reviews quarterly']},
            {'code':'Std 3','title':'The Workforce','desc':'Planning, competency, wellbeing.',
             'items':['Workforce plan meets strengthened standards','Competency matrix current and updated','Staff supervision and wellbeing checks documented']},
            {'code':'Std 4','title':'Clinical Care','desc':'Assessment, medication, infection, falls, restrictive practices, palliative.',
             'items':['Clinical care assessment within 7 days of entry','Medication management audit current','Infection prevention audits documented','Falls risk plans for all at-risk consumers','Restrictive practices reviewed monthly','Palliative care plans for end-of-life consumers','Advance care directives recorded']},
            {'code':'Std 5','title':'Environment','desc':'Living environment, equipment, emergency planning.',
             'items':['Living environment complies with ACQS requirements','Equipment maintenance log current','Emergency plan tested within last 12 months']},
            {'code':'Std 6','title':'Food & Nutrition','desc':'Meals, daily living, social activities.',
             'items':['Menus reviewed by dietitian annually','Daily living support plans individualised','Social and recreational activity log updated weekly']},
            {'code':'Std 7','title':'Feedback & Improvement','desc':'Complaints, incidents, open disclosure.',
             'items':['Complaints log with resolution and improvement actions','SIRS incident reports filed within required timeframes','Open disclosure recorded for reportable events']}
        ],
        'faqs':[
            ('How often does ACQSC assess aged care facilities?','ACQSC assesses facilities at minimum every 3 years for accredited providers, more often if risks are identified. Unannounced visits may occur at any time.'),
            ('What are the 7 Strengthened Quality Standards?','The Person, The Organisation, The Workforce, Clinical Care, Environment, Food & Nutrition, Feedback & Improvement. These replaced the previous 8 standards framework in 2024.'),
            ('Is this assessment official?','No — this is an independent self-check. For official assessment processes see agedcarequality.gov.au. This tool helps internal preparation.'),
            ('What is SIRS in aged care?','Serious Incident Response Scheme — mandatory reporting of Priority 1 incidents within 24 hours, Priority 2 within 30 days to ACQSC.'),
            ('Does this cover consumer experience interviews?','Partially — Standard 1 items align with consumer experience themes. Actual consumer feedback interviews are conducted by ACQSC assessors.')
        ]
    },
    'nz': {
        'folder': 'nz',
        'lang': 'en-NZ',
        'regulator': 'DAA (Designated Auditing Agency)',
        'regulator_full': 'Designated Auditing Agency',
        'framework': 'NZS 8134 standards',
        'inspection': 'Certification audit',
        'currency': 'NZ$',
        'title': 'NZS 8134 Audit Checklist 2026 — Free Rest Home Tool',
        'desc': 'Free interactive NZS 8134:2021 audit checklist. 20 items across 4 standard outcome areas. Certification-ready, live scoring.',
        'keywords': 'nzs 8134 audit checklist, nz rest home audit checklist, ngā paerewa checklist, rest home certification nz, daa audit checklist, nz aged care audit, health disability services audit',
        'sections':[
            {'code':'Rights','title':'Consumer Rights (Ngā Paerewa 1)','desc':'Rights, dignity, informed choice, advocacy.',
             'items':['Code of Rights displayed in common area','Advocacy information available','Cultural safety plan documented','Consumer feedback system active']},
            {'code':'Org Mgmt','title':'Organisational Management (Ngā Paerewa 2)','desc':'Governance, staffing, training, documentation.',
             'items':['Governance framework documented','Staffing meets required minimums','Training records current','Documentation management system in place']},
            {'code':'Continuum','title':'Continuum of Service (Ngā Paerewa 3)','desc':'Entry, assessment, care planning, medication, palliative.',
             'items':['Entry assessment completed within 7 days','Care plan reviewed monthly or after change','Medication audit current','Nutrition and hydration monitored','End-of-life planning documented','interRAI assessment completed']},
            {'code':'Safe Env','title':'Safe Environment (Ngā Paerewa 4)','desc':'Infection, falls, restraint minimisation.',
             'items':['Infection prevention audit current','Falls register with follow-up','Restraint minimisation policy and log','Emergency preparedness tested','Hazard register current','Equipment maintenance logged']}
        ],
        'faqs':[
            ('How often are certification audits in NZ?','Every 3 years by default. Spot audits or unannounced surveillance audits may occur sooner based on risk.'),
            ('What is Ngā Paerewa?','The Māori name for the NZS 8134:2021 Health and Disability Services Standards — integrating te Tiriti o Waitangi principles.'),
            ('Is interRAI mandatory?','Yes for aged residential care — interRAI LTCF assessments are required on admission and every 6 months (or after significant change).'),
            ('Who performs certification audits?','Designated Auditing Agencies (DAAs) approved by the Ministry of Health — not government auditors directly.'),
            ('What happens after a failed audit?','Corrective action plan required within specified timeframes. Serious non-compliance can lead to reduced certification length or conditions.')
        ]
    },
    'ie': {
        'folder': 'ie',
        'lang': 'en-IE',
        'regulator': 'HIQA',
        'regulator_full': 'Health Information and Quality Authority',
        'framework': '8 National Standards themes',
        'inspection': 'HIQA inspection',
        'currency': '€',
        'title': 'HIQA Inspection Checklist 2026 — Free Nursing Home Tool',
        'desc': 'Free interactive HIQA inspection checklist. 24 items across all 8 National Standards themes. Designated Centre ready.',
        'keywords': 'hiqa inspection checklist, hiqa compliance checklist, nursing home inspection checklist ireland, hiqa audit checklist, designated centre checklist, national standards residential care, hiqa preparation, hiqa judgment framework',
        'sections':[
            {'code':'Theme 1','title':'Person-Centred Care & Support','desc':'Rights, dignity, individual care.',
             'items':['Resident assessments reflect preferences','Rights notices displayed','End-of-life care planning documented']},
            {'code':'Theme 2','title':'Effective Services','desc':'Evidence-based care, governance of service.',
             'items':['Clinical governance framework active','Policies reviewed within 3 years','Audit cycle active across service']},
            {'code':'Theme 3','title':'Safe Services','desc':'Safeguarding, infection, medication, risk.',
             'items':['Safeguarding policy and Designated Officer','Infection prevention audit current','Medication management audit current','Risk register active with owners']},
            {'code':'Theme 4','title':'Health & Wellbeing','desc':'Nutrition, activity, mental health.',
             'items':['Nutritional screening completed','Activity programme with attendance logs','Mental health/wellbeing plans for residents needing support']},
            {'code':'Theme 5','title':'Leadership, Governance & Management','desc':'Registered Provider, PIC, accountability.',
             'items':['Registered Provider named and accountable','Person In Charge (PIC) with required qualifications','Annual review of quality documented']},
            {'code':'Theme 6','title':'Workforce','desc':'Staffing, training, induction.',
             'items':['Staffing levels meet regulations','Training records current (Fire, Manual Handling, Safeguarding)','Induction programme documented']},
            {'code':'Theme 7','title':'Use of Resources','desc':'Accommodation, equipment, financial governance.',
             'items':['Accommodation meets HIQA requirements','Equipment register with maintenance','Financial governance evidenced']},
            {'code':'Theme 8','title':'Use of Information','desc':'Records, notifications, data governance.',
             'items':['Residents records secured and accurate','Notifiable events reported within required timeframes','GDPR DPIA completed for key processes']}
        ],
        'faqs':[
            ('How often does HIQA inspect designated centres?','Risk-based — typically annually, but can be more frequent if issues arise. Initial inspections within 6 months of new registration.'),
            ('What are the 8 HIQA National Standards themes?','Person-Centred Care, Effective Services, Safe Services, Health & Wellbeing, Leadership/Governance/Management, Workforce, Use of Resources, Use of Information.'),
            ('What is a Designated Centre?','A residential centre providing nursing, personal and social care registered under the Health Act 2007.'),
            ('Is this checklist official?','No — this is an independent self-check. HIQA inspections use the Judgment Framework 2018 with Compliant / Substantially Compliant / Not Compliant findings.'),
            ('What is the Provider / PIC distinction?','The Registered Provider is the legal entity; the Person In Charge (PIC) is the qualified manager responsible day-to-day. Both accountable to HIQA.')
        ]
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
    <meta property="og:title" content="{og_title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical}">
    <meta property="og:image" content="https://tool.teamzlab.com/apps/always-ready-care/icons/icon-512.png">
    <meta name="twitter:card" content="summary">
    <meta name="keywords" content="{keywords}">
    <link rel="alternate" hreflang="{lang}" href="{canonical}">
    <link rel="alternate" hreflang="x-default" href="{canonical}">
    <script type="application/ld+json">
{howto_schema}
    </script>
    <script type="application/ld+json">
{breadcrumb_schema}
    </script>
    <script type="application/ld+json">
{faq_schema}
    </script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="../manifest.json">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{css_path}">
    {localstorage_script}
    <style>
      .chk-wrap{{max-width:960px;margin:0 auto;padding:24px 20px 64px;}}
      .chk-hero{{padding:28px 0 20px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .chk-hero h1{{font:700 clamp(24px,4vw,34px)/1.25 Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .chk-hero p{{color:var(--text-muted);max-width:720px;margin:0;}}
      .chk-progress{{position:sticky;top:0;z-index:10;background:var(--bg);padding:14px 0;border-bottom:1px solid var(--border);margin-bottom:24px;}}
      .chk-progress-bar{{height:10px;background:var(--surface);border-radius:999px;overflow:hidden;border:1px solid var(--border);}}
      .chk-progress-fill{{height:100%;background:var(--accent);width:0;transition:width .3s ease;}}
      .chk-progress-meta{{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:14px;color:var(--text);}}
      .chk-progress-meta strong{{color:var(--heading);font-size:18px;}}
      .chk-actions{{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 28px;}}
      .chk-actions button{{padding:10px 16px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--heading);font:600 14px Poppins,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:8px;}}
      .chk-actions button:hover{{border-color:var(--accent);}}
      .chk-actions .chk-btn-primary{{background:var(--accent);color:var(--accent-text);border-color:var(--accent);}}
      .chk-section{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 22px;margin-bottom:16px;}}
      .chk-section-head{{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px;flex-wrap:wrap;}}
      .chk-section h2{{font:600 18px/1.3 Poppins,sans-serif;color:var(--heading);margin:0;}}
      .chk-section-desc{{color:var(--text-muted);font-size:13px;margin:0 0 10px;line-height:1.55;}}
      .chk-section-score{{font:600 13px/1 Poppins,sans-serif;color:var(--text-muted);padding:4px 10px;border-radius:999px;background:var(--bg);border:1px solid var(--border);}}
      .chk-section-score.chk-done{{color:var(--accent-text);background:var(--accent);border-color:var(--accent);}}
      .chk-item{{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--border);}}
      .chk-item:first-of-type{{border-top:0;}}
      .chk-item input[type=checkbox]{{width:20px;height:20px;margin-top:2px;accent-color:var(--accent);flex-shrink:0;cursor:pointer;}}
      .chk-item label{{flex:1;cursor:pointer;color:var(--text);line-height:1.5;}}
      .chk-item input:checked + label{{opacity:0.6;text-decoration:line-through;}}
      .chk-cta{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin-top:28px;text-align:center;}}
      .chk-cta a{{display:inline-block;padding:12px 22px;border-radius:10px;background:var(--accent);color:var(--accent-text);text-decoration:none;font:600 15px Poppins,sans-serif;}}
      .chk-faq details{{border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden;background:var(--surface);margin-top:10px;}}
      .chk-faq summary{{padding:14px 18px;cursor:pointer;font:600 15px Poppins,sans-serif;color:var(--heading);list-style:none;}}
      .chk-faq summary::-webkit-details-marker{{display:none;}}
      .chk-faq summary::after{{content:"+";float:right;}}
      .chk-faq details[open] summary::after{{content:"−";}}
      .chk-faq details p{{padding:14px 18px;margin:0;color:var(--text);line-height:1.6;}}
      @media print{{.chk-progress,.chk-actions,.chk-cta,.chk-faq,#back-to-app{{display:none !important;}}}}
      @media (max-width:600px){{.chk-wrap{{padding:16px 14px 48px;}}.chk-section{{padding:16px;}}}}
    </style>
</head>
<body>
    <a href="../" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>

    <main class="chk-wrap">
        <header class="chk-hero">
            <h1>{h1}</h1>
            <p>{intro}</p>
        </header>

        <div class="chk-progress">
            <div class="chk-progress-meta">
                <span>Readiness: <strong id="chk-percent">0 %</strong></span>
                <span><span id="chk-done">0</span> / <span id="chk-total">0</span> items</span>
            </div>
            <div class="chk-progress-bar"><div class="chk-progress-fill" id="chk-fill"></div></div>
        </div>

        <div class="chk-actions">
            <button type="button" class="chk-btn-primary" id="chk-share"><i class="fas fa-share-nodes"></i> Share</button>
            <button type="button" id="chk-print"><i class="fas fa-print"></i> Print</button>
            <button type="button" id="chk-reset"><i class="fas fa-rotate-left"></i> Reset</button>
        </div>

        <div id="chk-list"></div>

        <div class="chk-cta">
            <p style="color:var(--text-muted);margin:0 0 12px;">AlwaysReady Care captures {reg} evidence across all {fw} and generates inspection-ready packs in one click.</p>
            <a href="../">Start free with AlwaysReady Care</a>
        </div>

        <section class="chk-faq">
            <h2 style="font:600 22px Poppins,sans-serif;color:var(--heading);margin:32px 0 14px;">FAQ — {reg}</h2>
            {faq_html}
        </section>
    </main>

    <script>
    (function(){{
      var SECTIONS = {sections_json};
      var STORAGE_KEY = '{storage_key}';
      var state = {{}};
      try {{ state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{{}}') || {{}}; }} catch(e){{ state = {{}}; }}

      var totalItems = SECTIONS.reduce(function(n,s){{ return n + s.items.length; }}, 0);
      document.getElementById('chk-total').textContent = totalItems;

      var root = document.getElementById('chk-list');
      SECTIONS.forEach(function(s, si){{
        var sec = document.createElement('section');
        sec.className = 'chk-section';
        var itemsHtml = s.items.map(function(it, i){{
          var key = 'c' + si + '-' + i;
          var checked = state[key] ? 'checked' : '';
          return '<div class="chk-item"><input type="checkbox" id="' + key + '" data-key="' + key + '" ' + checked + '><label for="' + key + '">' + it + '</label></div>';
        }}).join('');
        sec.innerHTML = '<div class="chk-section-head"><h2>' + s.code + ' — ' + s.title + '</h2><span class="chk-section-score" data-score>0 / ' + s.items.length + '</span></div><p class="chk-section-desc">' + s.desc + '</p>' + itemsHtml;
        root.appendChild(sec);
      }});

      function recalc(){{
        var done = 0;
        document.querySelectorAll('.chk-section').forEach(function(sec){{
          var inputs = sec.querySelectorAll('input[type=checkbox]');
          var sDone = 0;
          inputs.forEach(function(i){{ if(i.checked){{ sDone++; done++; }} }});
          var score = sec.querySelector('[data-score]');
          score.textContent = sDone + ' / ' + inputs.length;
          score.classList.toggle('chk-done', sDone === inputs.length);
        }});
        var pct = totalItems ? Math.round((done / totalItems) * 100) : 0;
        document.getElementById('chk-done').textContent = done;
        document.getElementById('chk-percent').textContent = pct + ' %';
        document.getElementById('chk-fill').style.width = pct + '%';
      }}

      root.addEventListener('change', function(e){{
        var el = e.target;
        if (el.type !== 'checkbox') return;
        if (el.checked) state[el.dataset.key] = 1; else delete state[el.dataset.key];
        try {{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }} catch(err){{}}
        recalc();
      }});

      document.getElementById('chk-reset').addEventListener('click', function(){{
        if (!confirm('Reset all checks?')) return;
        state = {{}};
        try {{ localStorage.removeItem(STORAGE_KEY); }} catch(err){{}}
        document.querySelectorAll('#chk-list input[type=checkbox]').forEach(function(i){{ i.checked = false; }});
        recalc();
      }});

      document.getElementById('chk-print').addEventListener('click', function(){{ window.print(); }});

      document.getElementById('chk-share').addEventListener('click', function(){{
        var pct = document.getElementById('chk-percent').textContent;
        var text = 'My {reg} readiness: ' + pct + '. Free checklist: ' + location.href;
        if (navigator.share) navigator.share({{title:'{reg} Checklist', text:text, url:location.href}}).catch(function(){{}});
        else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function(){{ alert('Copied to clipboard'); }});
        else prompt('Copy:', text);
      }});

      recalc();
    }})();
    </script>
</body>
</html>
'''


def render(code, cfg):
    folder_path = cfg['folder']
    # URL depth: uk is root, au/nz/ie are 1 level deep
    if folder_path:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{folder_path}/inspection-checklist/'
        css_path = '../../css/app.css'
        back_href = '../'
        localstorage_region = folder_path
    else:
        canonical = 'https://tool.teamzlab.com/apps/always-ready-care/inspection-checklist/'
        css_path = '../css/app.css'
        back_href = '../'
        localstorage_region = 'uk'

    howto = {
        '@context': 'https://schema.org', '@type': 'HowTo',
        'name': f'{cfg["regulator"]} {cfg["inspection"]} checklist',
        'inLanguage': cfg['lang'],
        'description': cfg['desc'],
        'step': [{'@type':'HowToStep','name':s['title'],'text':s['desc']} for s in cfg['sections']]
    }

    breadcrumb = {
        '@context':'https://schema.org','@type':'BreadcrumbList',
        'itemListElement':[
            {'@type':'ListItem','position':1,'name':'Home','item':'https://tool.teamzlab.com/'},
            {'@type':'ListItem','position':2,'name':'AlwaysReady Care','item':'https://tool.teamzlab.com/apps/always-ready-care/'},
        ] + ([{'@type':'ListItem','position':3,'name':cfg['regulator'],'item':f'https://tool.teamzlab.com/apps/always-ready-care/{folder_path}/'}] if folder_path else []) + [
            {'@type':'ListItem','position':4 if folder_path else 3,'name':'Inspection Checklist','item':canonical}
        ]
    }

    faqs = cfg['faqs']
    faqpage = {
        '@context':'https://schema.org','@type':'FAQPage',
        'mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in faqs]
    }

    faq_html = ''.join(
        f'<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>'
        for q,a in faqs
    )

    h1 = f'{cfg["regulator"]} {cfg["inspection"]} Checklist — Free &amp; Interactive'
    intro = f'Interactive {cfg["regulator_full"]} {cfg["inspection"]} checklist with items across the {cfg["framework"]}. Check off items as your facility meets them — progress auto-saved in your browser, no sign-up.'

    return PAGE_TMPL.format(
        title=html.escape(cfg['title']),
        desc=html.escape(cfg['desc']),
        og_title=html.escape(cfg['title']),
        canonical=canonical,
        keywords=html.escape(cfg['keywords']),
        lang=cfg['lang'],
        howto_schema=json.dumps(howto, ensure_ascii=False, indent=2),
        breadcrumb_schema=json.dumps(breadcrumb, ensure_ascii=False, indent=2),
        faq_schema=json.dumps(faqpage, ensure_ascii=False, indent=2),
        css_path=css_path,
        localstorage_script=f"<script>localStorage.setItem('arc-region','{localstorage_region}');</script>",
        h1=html.escape(h1).replace('&amp;amp;','&amp;'),
        intro=html.escape(intro),
        reg=html.escape(cfg['regulator']),
        fw=html.escape(cfg['framework']),
        faq_html=faq_html,
        sections_json=json.dumps(cfg['sections'], ensure_ascii=False),
        storage_key=f"arc-chk-{code}"
    )


def main():
    for code, cfg in COUNTRIES.items():
        folder = cfg['folder']
        # UK is root, others are in /au /nz /ie
        out_dir = os.path.join(BASE, folder, 'inspection-checklist') if folder else os.path.join(BASE, 'inspection-checklist')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, 'index.html')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(render(code, cfg))
        rel = os.path.relpath(out_path, BASE)
        print(f'BUILT: {rel}')


if __name__ == '__main__':
    main()
