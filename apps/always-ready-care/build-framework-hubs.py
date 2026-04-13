#!/usr/bin/env python3
"""
Generate framework hubs + per-dimension subpages for UK / AU / NZ / IE.
Each hub has: 1 hub page + N subpages (1 per framework dimension).

UK: 5 Key Questions (Safe, Effective, Caring, Responsive, Well-led) → 6 pages total
AU: 7 Strengthened Standards → 8 pages total
NZ: 4 Ngā Paerewa areas → 5 pages total
IE: 8 National Standards themes → 9 pages total

Output: /apps/always-ready-care/<region>/framework/ + /framework/<slug>/
"""
import os, json, html

BASE = os.path.dirname(os.path.abspath(__file__))

COUNTRIES = {
    'uk': {
        'folder': '',
        'lang': 'en-GB',
        'regulator': 'CQC',
        'framework_name': '5 Key Questions',
        'framework_slug': 'framework',
        'hub_title': 'CQC 5 Key Questions — Complete Guide for Care Homes',
        'hub_desc': 'All 5 CQC Key Questions (Safe, Effective, Caring, Responsive, Well-led) explained with evidence examples, compliance tips and free checklists.',
        'hub_keywords': 'cqc 5 key questions, cqc kloes, cqc quality statements, cqc single assessment framework, cqc evidence categories, care home kloes, cqc inspection framework',
        'sections': [
            {'slug':'safe','code':'Safe','title':'Safe','keyword':'cqc safe key question','summary':'Protecting people from avoidable harm: safeguarding, medication, incidents, infection, risk.',
             'intro':'The Safe Key Question asks: Are people protected from abuse and avoidable harm? It covers safeguarding, medicines management, incident prevention, infection control, falls, and risk management. It is the most commonly cited area in CQC enforcement.',
             'requirements':[
                ('Safeguarding','Policy current; team trained; Local Authority safeguarding referrals logged.'),
                ('Medication management','Monthly audit; MAR chart complete; controlled drugs compliant.'),
                ('Incident & near-miss','Logged within 24h; root cause analysis for serious events.'),
                ('Infection prevention','IPC audit; PPE stock; hand-hygiene training current.'),
                ('Falls prevention','Risk assessed; falls plan; post-fall protocol.'),
                ('Risk management','Dynamic risk assessments; updated after incidents.')
             ],
             'pitfalls':['No follow-through on safeguarding alerts','Medicine errors not analysed','Incomplete incident records','Missing IPC audits','Falls register gaps.']},
            {'slug':'effective','code':'Effective','title':'Effective','keyword':'cqc effective key question','summary':'Care outcomes and evidence-based practice.',
             'intro':'Effective asks whether care delivers the right outcomes using evidence-based practice. It covers care planning, nutrition/hydration, consent, MCA/DoLS, and staff competency.',
             'requirements':[
                ('Care planning','Reviewed in last 6 months; reflects preferences.'),
                ('Nutrition & hydration','Screening tool used; records kept.'),
                ('MCA/DoLS','Capacity assessments current; authorisations active.'),
                ('Staff training','Matrix ≥ 90% complete; competency checks.'),
                ('Consent','Documented for each intervention.')
             ],
             'pitfalls':['Copy-paste care plans','No mental capacity assessments','Expired DoLS','Low training completion rates.']},
            {'slug':'caring','code':'Caring','title':'Caring','keyword':'cqc caring key question','summary':'Dignity, privacy, respect, and involvement.',
             'intro':'Caring asks whether staff treat people with compassion and respect. It is observational — inspectors watch interactions and interview residents.',
             'requirements':[
                ('Dignity','Privacy respected; personal care private; resident-directed.'),
                ('Involvement','Residents involved in care decisions.'),
                ('Emotional support','Life stories recorded; bereavement support available.'),
                ('Communication','Information accessible; reasonable adjustments made.')
             ],
             'pitfalls':['Institutional language / routines','Staff discussing residents within earshot','Care done TO rather than WITH residents.']},
            {'slug':'responsive','code':'Responsive','title':'Responsive','keyword':'cqc responsive key question','summary':'Person-centred care and complaints.',
             'intro':'Responsive asks if the service responds to individual needs, preferences and complaints. It includes activities, end-of-life care and reasonable adjustments.',
             'requirements':[
                ('Person-centred care','Care reflects individual preferences, not routines.'),
                ('Activities','Weekly programme with attendance logs.'),
                ('Complaints','Log with actions and timescales; learning evidenced.'),
                ('End-of-life','Advance care planning; palliative support.')
             ],
             'pitfalls':['One-size-fits-all activity programmes','Complaints resolved without learning','No advance care plans.']},
            {'slug':'well-led','code':'Well-led','title':'Well-led','keyword':'cqc well led key question','summary':'Governance, leadership, learning.',
             'intro':'Well-led asks whether leadership, governance and culture drive continuous improvement. Most commonly cited alongside Safe for Requires Improvement ratings.',
             'requirements':[
                ('Regulation 17 governance','Audits monthly; actions tracked; learning evidenced.'),
                ('Registered Manager','Present; accountable; knows service well.'),
                ('Staff supervision','Records current; team engagement measured.'),
                ('Duty of candour','Log maintained for notifiable events.'),
                ('Quality improvement','Plan live; measured outcomes.')
             ],
             'pitfalls':['Audits without follow-up','Manager not visible on floor','Staff surveys unread','Duty of candour gaps.']}
        ],
        'hub_faqs':[
            ('What are the 5 CQC Key Questions?','Safe, Effective, Caring, Responsive, Well-led. Each has sub-questions (KLOEs) and contributes to your overall rating of Outstanding, Good, Requires Improvement or Inadequate.'),
            ('How does the Single Assessment Framework fit in?','The SAF (from 2023) added 34 quality statements grouped under the 5 Key Questions and 6 evidence categories. The 5 KQs remain the headline framework.'),
            ('Which Key Question carries most weight?','All five must be at least Good for an overall Good rating. Safe and Well-led issues most often cause Requires Improvement or Inadequate.'),
            ('Where can I find official CQC guidance?','cqc.org.uk has the full framework. This hub summarises for internal prep and is not official CQC guidance.')
        ]
    },
    'au': {
        'folder':'au',
        'lang':'en-AU',
        'regulator':'ACQSC',
        'framework_name':'7 Strengthened Quality Standards',
        'framework_slug':'standards',
        'hub_title':'Strengthened Aged Care Quality Standards — 7 Standards Guide',
        'hub_desc':'All 7 Strengthened Aged Care Quality Standards (ACQS 2024) explained with evidence requirements, implementation tips and free checklists.',
        'hub_keywords':'acqs standards, strengthened quality standards, aged care quality standards 2024, acqsc standards, 7 aged care standards, aged care act standards',
        'sections':[
            {'slug':'person','code':'Std 1','title':'The Person','keyword':'acqs standard 1 the person','summary':'Identity, autonomy, dignity, informed consent.',
             'intro':'Standard 1 centres the older person: their identity, values, preferences and right to make choices. Covers autonomy, dignity, informed consent, and dignity of risk.',
             'requirements':[('Identity & preferences','Documented and visible in care plan.'),('Autonomy','Supported decision-making; informed consent.'),('Dignity of risk','Framework in place; balanced against duty of care.')],
             'pitfalls':['Generic care plans that ignore preferences','Consent treated as a one-time signature.']},
            {'slug':'organisation','code':'Std 2','title':'The Organisation','keyword':'acqs standard 2 organisation','summary':'Governance, risk management, continuous improvement.',
             'intro':'Standard 2 addresses governance and leadership. Board accountability, risk management framework, quality improvement cycles.',
             'requirements':[('Governance framework','Documented; board engagement.'),('Risk management','Register; owners; reviewed.'),('Continuous improvement','Plan; measures; outcomes.')],
             'pitfalls':['Governance on paper only','Risk register not reviewed.']},
            {'slug':'workforce','code':'Std 3','title':'The Workforce','keyword':'acqs standard 3 workforce','summary':'Planning, competency, wellbeing.',
             'intro':'Standard 3 focuses on workforce capacity, capability, and wellbeing — including psychological safety and support.',
             'requirements':[('Workforce plan','Demand/supply aligned; responsive.'),('Competency','Matrix current; appraisals.'),('Wellbeing','Staff support; safe systems of work.')],
             'pitfalls':['Understaffing as normalised risk','Training on paper only.']},
            {'slug':'clinical-care','code':'Std 4','title':'Clinical Care','keyword':'acqs standard 4 clinical care','summary':'Assessment, medication, infection, falls, restrictive practices, palliative.',
             'intro':'Standard 4 is the clinical-care heart: assessment, medication, infection prevention, falls, restrictive practices and palliative care.',
             'requirements':[('Clinical assessment','Within 7 days of entry.'),('Medication management','Audit current; safe systems.'),('Infection prevention','Audit; IPC lead.'),('Falls','Risk plan; post-fall analysis.'),('Restrictive practices','Reviewed monthly; least-restrictive.'),('Palliative care','Plan; advance care directive.')],
             'pitfalls':['Blanket restrictive practices','No advance care directive discussions.']},
            {'slug':'environment','code':'Std 5','title':'The Environment','keyword':'acqs standard 5 environment','summary':'Living environment, equipment, emergency.',
             'intro':'Standard 5 covers the physical environment, equipment safety and emergency preparedness.',
             'requirements':[('Living environment','ACQS-compliant; reviewed.'),('Equipment','Maintenance log; risk-rated.'),('Emergency','Tested annually.')],
             'pitfalls':['Equipment maintenance gaps','Fire / evacuation drills overdue.']},
            {'slug':'food-nutrition','code':'Std 6','title':'Food & Nutrition','keyword':'acqs standard 6 food nutrition','summary':'Meals, daily living, social activities.',
             'intro':'Standard 6 addresses food quality, nutrition, hydration and daily-living support — a strong focus of the Royal Commission recommendations.',
             'requirements':[('Menus','Dietitian-reviewed annually.'),('Daily living','Support plans individualised.'),('Social activities','Weekly logs.')],
             'pitfalls':['Food temperature / variety issues','Isolation not identified.']},
            {'slug':'feedback-improvement','code':'Std 7','title':'Feedback & Improvement','keyword':'acqs standard 7 feedback improvement','summary':'Complaints, incidents, open disclosure.',
             'intro':'Standard 7 closes the loop: how feedback, complaints and incidents drive improvement through open disclosure.',
             'requirements':[('Complaints','Log; resolution; learning.'),('SIRS','Timely reporting; actions.'),('Open disclosure','Documented for reportable events.')],
             'pitfalls':['SIRS late / missed','Open disclosure not evidenced.']}
        ],
        'hub_faqs':[
            ('What are the 7 Strengthened Quality Standards?','The Person, The Organisation, The Workforce, Clinical Care, The Environment, Food & Nutrition, Feedback & Improvement. They replaced the 8-standard framework from July 2025 commencement (subject to final government timing).'),
            ('Who must comply?','All approved providers of Commonwealth-subsidised aged care under the Aged Care Act.'),
            ('How are they assessed?','Through accreditation visits by ACQSC assessors — announced and unannounced.'),
            ('Is open disclosure compulsory?','Yes. Open disclosure is a standalone Standard 7 requirement for serious adverse events.')
        ]
    },
    'nz': {
        'folder':'nz',
        'lang':'en-NZ',
        'regulator':'HealthCERT / DAA',
        'framework_name':'Ngā Paerewa standards',
        'framework_slug':'standards',
        'hub_title':'NZS 8134 Ngā Paerewa — Complete Guide for Rest Homes',
        'hub_desc':'All 4 Ngā Paerewa (NZS 8134:2021) outcome areas explained with evidence requirements, te Tiriti o Waitangi integration and free checklists.',
        'hub_keywords':'ngā paerewa, nzs 8134 standards, nzs 8134 2021, nz rest home standards, health disability standards nz, certification audit nz standards',
        'sections':[
            {'slug':'consumer-rights','code':'NZS 8134.1','title':'Consumer Rights (Ngā Paerewa 1)','keyword':'ngā paerewa consumer rights','summary':'Rights, dignity, advocacy, cultural safety.',
             'intro':'Ngā Paerewa 1 addresses consumer rights — starting with te Tiriti o Waitangi principles and the Code of Rights.',
             'requirements':[('Code of Rights','Displayed; staff trained.'),('Advocacy','Information available.'),('Cultural safety','Plan documented; Māori engagement.'),('Feedback','System active.')],
             'pitfalls':['No cultural safety plan','Advocacy information outdated.']},
            {'slug':'organisational-management','code':'NZS 8134.2','title':'Organisational Management (Ngā Paerewa 2)','keyword':'ngā paerewa organisational management','summary':'Governance, staffing, training, documentation.',
             'intro':'Ngā Paerewa 2 addresses organisational management — governance, workforce, documentation and improvement.',
             'requirements':[('Governance','Framework documented.'),('Staffing','Meets required minimums.'),('Training','Records current.'),('Documentation','Management system active.')],
             'pitfalls':['Staff records incomplete','Policy/procedure lag.']},
            {'slug':'continuum-of-service','code':'NZS 8134.3','title':'Continuum of Service (Ngā Paerewa 3)','keyword':'ngā paerewa continuum of service','summary':'Entry, assessment, care planning, medication, palliative.',
             'intro':'Ngā Paerewa 3 covers clinical care delivery from entry to end-of-life — including interRAI assessment.',
             'requirements':[('Entry assessment','Within 7 days.'),('Care plan','Monthly review.'),('Medication','Audit current.'),('interRAI','Admission + 6-monthly.'),('End-of-life','Planning documented.')],
             'pitfalls':['interRAI late / incomplete','Care plans static.']},
            {'slug':'safe-environment','code':'NZS 8134.4','title':'Safe Environment (Ngā Paerewa 4)','keyword':'ngā paerewa safe environment','summary':'Infection, falls, restraint minimisation.',
             'intro':'Ngā Paerewa 4 focuses on the physical and procedural safety of the environment.',
             'requirements':[('Infection prevention','Audit current.'),('Falls','Register; follow-up.'),('Restraint minimisation','Policy; log.'),('Emergency preparedness','Tested.')],
             'pitfalls':['Restraint without review','Emergency drills overdue.']}
        ],
        'hub_faqs':[
            ('What is Ngā Paerewa?','The Māori name for NZS 8134:2021 — integrating te Tiriti o Waitangi principles throughout the Health and Disability Services Standards.'),
            ('Who audits these standards?','Designated Auditing Agencies (DAAs) approved by the Ministry of Health / Manatū Hauora, not the Ministry directly.'),
            ('How often are certification audits?','Every 3 years by default; risk-based sooner if issues are identified.'),
            ('Are the standards compulsory?','Yes — certification against NZS 8134 is a condition of operating health and disability services including rest homes and aged residential care.')
        ]
    },
    'ie': {
        'folder':'ie',
        'lang':'en-IE',
        'regulator':'HIQA',
        'framework_name':'8 National Standards themes',
        'framework_slug':'standards',
        'hub_title':'HIQA National Standards — 8 Themes for Residential Care',
        'hub_desc':'All 8 HIQA National Standards themes explained with evidence examples, Judgment Framework context and free readiness checklists.',
        'hub_keywords':'hiqa national standards, national standards residential care, hiqa themes, hiqa 8 themes, designated centre standards, hiqa judgment framework, hiqa inspection themes',
        'sections':[
            {'slug':'person-centred-care','code':'Theme 1','title':'Person-Centred Care & Support','keyword':'hiqa theme 1 person centred care','summary':'Rights, dignity, preferences.',
             'intro':'Theme 1 centres the resident: their rights, preferences and dignity. Includes end-of-life planning.',
             'requirements':[('Resident assessments','Reflect preferences.'),('Rights notices','Displayed.'),('End-of-life','Planning documented.')],
             'pitfalls':['Generic assessments','No end-of-life discussions.']},
            {'slug':'effective-services','code':'Theme 2','title':'Effective Services','keyword':'hiqa theme 2 effective services','summary':'Evidence-based care, clinical governance.',
             'intro':'Theme 2 addresses whether services deliver quality outcomes through clinical governance.',
             'requirements':[('Clinical governance','Framework active.'),('Policies','Reviewed within 3 years.'),('Audit cycle','Active across service.')],
             'pitfalls':['Expired policies','Audits without action.']},
            {'slug':'safe-services','code':'Theme 3','title':'Safe Services','keyword':'hiqa theme 3 safe services','summary':'Safeguarding, infection, medication, risk.',
             'intro':'Theme 3 focuses on safeguarding, infection prevention, medication management and risk.',
             'requirements':[('Safeguarding','Policy + Designated Officer.'),('Infection prevention','Audit current.'),('Medication','Audit current.'),('Risk register','Active with owners.')],
             'pitfalls':['Safeguarding lapses','Risk register stale.']},
            {'slug':'health-wellbeing','code':'Theme 4','title':'Health & Wellbeing','keyword':'hiqa theme 4 health wellbeing','summary':'Nutrition, activity, mental health.',
             'intro':'Theme 4 addresses physical and mental wellbeing — nutrition, activity and psychological support.',
             'requirements':[('Nutritional screening','Completed.'),('Activity programme','Attendance logged.'),('Mental health','Plans for residents needing support.')],
             'pitfalls':['Weight loss unnoticed','Activities dropped for convenience.']},
            {'slug':'leadership-governance','code':'Theme 5','title':'Leadership, Governance & Management','keyword':'hiqa theme 5 leadership governance','summary':'Registered Provider, PIC, accountability.',
             'intro':'Theme 5 addresses the Registered Provider + PIC accountability structure and annual review.',
             'requirements':[('Registered Provider','Named; accountable.'),('PIC','Qualified.'),('Annual review','Documented.')],
             'pitfalls':['Absent PIC','No annual review.']},
            {'slug':'workforce','code':'Theme 6','title':'Workforce','keyword':'hiqa theme 6 workforce','summary':'Staffing, training, induction.',
             'intro':'Theme 6 covers workforce planning, training and induction.',
             'requirements':[('Staffing','Meets regulations.'),('Training','Fire, manual handling, safeguarding current.'),('Induction','Documented.')],
             'pitfalls':['Training records incomplete','Agency staff no induction.']},
            {'slug':'use-of-resources','code':'Theme 7','title':'Use of Resources','keyword':'hiqa theme 7 use of resources','summary':'Accommodation, equipment, financial governance.',
             'intro':'Theme 7 addresses physical resources and financial governance.',
             'requirements':[('Accommodation','Meets HIQA requirements.'),('Equipment','Register with maintenance.'),('Financial governance','Evidenced.')],
             'pitfalls':['Maintenance backlog','Financial controls weak.']},
            {'slug':'use-of-information','code':'Theme 8','title':'Use of Information','keyword':'hiqa theme 8 use of information','summary':'Records, notifications, data governance.',
             'intro':'Theme 8 covers records, notifications and data governance under GDPR.',
             'requirements':[('Resident records','Secured and accurate.'),('Notifications','Reported in required timeframes.'),('GDPR','DPIA completed.')],
             'pitfalls':['Notification delays','No DPIA on key processes.']}
        ],
        'hub_faqs':[
            ('What are the 8 HIQA National Standards themes?','Person-Centred Care, Effective Services, Safe Services, Health & Wellbeing, Leadership/Governance/Management, Workforce, Use of Resources, Use of Information.'),
            ('Are they specific to nursing homes?','They apply to designated centres for older people. Different standards sets apply to disability centres.'),
            ('What is the HIQA Judgment Framework?','Inspector judgments: Compliant / Substantially Compliant / Not Compliant / Not Compliant major — used to rate each relevant regulation during inspection.'),
            ('Does this cover the Care of Older People regulations?','Yes — Theme-level, not regulation-level. For reg-level detail see hiqa.ie.')
        ]
    }
}


SUB_TMPL = '''<!DOCTYPE html>
<html lang="{lang}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="{canonical}">
    <meta property="og:title" content="{og_title}">
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
      .fw-wrap{{max-width:880px;margin:0 auto;padding:24px 20px 64px;}}
      .fw-bc{{font-size:13px;color:var(--text-muted);margin-bottom:16px;}}
      .fw-bc a{{color:var(--text-muted);text-decoration:none;}}
      .fw-bc a:hover{{color:var(--accent);}}
      .fw-hero{{padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .fw-badge{{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--border);color:var(--text-muted);font-size:12px;margin-bottom:12px;font-weight:600;}}
      .fw-hero h1{{font:700 clamp(24px,4vw,32px) Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .fw-hero p{{color:var(--text-muted);max-width:720px;margin:0;line-height:1.6;}}
      .fw-section{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 22px;margin-bottom:16px;}}
      .fw-section h2{{font:600 19px Poppins,sans-serif;color:var(--heading);margin:0 0 10px;}}
      .fw-section p{{color:var(--text);line-height:1.65;margin:0 0 8px;}}
      .fw-table{{width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;}}
      .fw-table th,.fw-table td{{padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;}}
      .fw-table th{{color:var(--heading);background:var(--bg);}}
      .fw-list{{padding-left:22px;margin:8px 0;color:var(--text);line-height:1.6;}}
      .fw-cta{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin-top:24px;text-align:center;}}
      .fw-cta a{{display:inline-block;padding:12px 22px;border-radius:10px;background:var(--accent);color:var(--accent-text);text-decoration:none;font:600 15px Poppins,sans-serif;}}
      .fw-related{{margin-top:28px;padding-top:20px;border-top:1px solid var(--border);}}
      .fw-related h2{{font:600 18px Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .fw-related ul{{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;}}
      .fw-related a{{display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--heading);background:var(--surface);font-size:13px;}}
      .fw-related a:hover{{border-color:var(--accent);}}
      @media (max-width:600px){{.fw-wrap{{padding:16px 14px 48px;}}.fw-section{{padding:16px;}}}}
    </style>
</head>
<body>
    <a href="{app_back}" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>

    <main class="fw-wrap">
        <nav class="fw-bc"><a href="{app_back}">AlwaysReady Care</a> &rsaquo; <a href="../">{framework_name}</a> &rsaquo; {code}</nav>
        <header class="fw-hero">
            <span class="fw-badge">{regulator} &middot; {code}</span>
            <h1>{h1}</h1>
            <p>{summary}</p>
        </header>

        <section class="fw-section">
            <h2>What this {code_simple} covers</h2>
            <p>{intro}</p>
        </section>

        <section class="fw-section">
            <h2>Evidence requirements</h2>
            <table class="fw-table">
                <thead><tr><th>Area</th><th>What inspectors look for</th></tr></thead>
                <tbody>{requirements_rows}</tbody>
            </table>
        </section>

        <section class="fw-section">
            <h2>Common pitfalls</h2>
            <ul class="fw-list">{pitfalls_list}</ul>
        </section>

        <div class="fw-cta">
            <p style="color:var(--text-muted);margin:0 0 12px;">AlwaysReady Care captures evidence for every {framework_name_lower} in one click.</p>
            <a href="{app_back}">Start free with AlwaysReady Care</a>
        </div>

        <section class="fw-related">
            <h2>Other {framework_name}</h2>
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
    <script type="application/ld+json">
{hub_faq_schema}
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
      .hub{{max-width:1000px;margin:0 auto;padding:24px 20px 64px;}}
      .hub-hero{{padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .hub-hero h1{{font:700 clamp(24px,4vw,34px) Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .hub-hero p{{color:var(--text-muted);max-width:720px;margin:0;line-height:1.6;}}
      .hub-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;}}
      .hub-card{{display:block;padding:18px;border:1px solid var(--border);border-radius:12px;background:var(--surface);text-decoration:none;color:var(--text);transition:border-color .2s,transform .2s;}}
      .hub-card:hover{{border-color:var(--accent);transform:translateY(-2px);}}
      .hub-card-code{{display:inline-block;padding:3px 8px;border-radius:999px;background:var(--bg);color:var(--accent);font-size:11px;margin-bottom:8px;font-weight:700;}}
      .hub-card h2{{font:600 17px Poppins,sans-serif;color:var(--heading);margin:0 0 6px;}}
      .hub-card p{{font-size:13px;color:var(--text-muted);margin:0;line-height:1.5;}}
      .hub-faq{{margin-top:32px;}}
      .hub-faq details{{border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden;background:var(--surface);}}
      .hub-faq summary{{padding:14px 18px;cursor:pointer;font:600 15px Poppins,sans-serif;color:var(--heading);list-style:none;}}
      .hub-faq summary::-webkit-details-marker{{display:none;}}
      .hub-faq summary::after{{content:"+";float:right;}}
      .hub-faq details[open] summary::after{{content:"−";}}
      .hub-faq details p{{padding:14px 18px;margin:0;color:var(--text);line-height:1.6;}}
      .hub-cta{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin-top:24px;text-align:center;}}
      .hub-cta a{{display:inline-block;padding:12px 22px;border-radius:10px;background:var(--accent);color:var(--accent-text);text-decoration:none;font:600 15px Poppins,sans-serif;}}
      @media (max-width:600px){{.hub{{padding:16px 14px 48px;}}}}
    </style>
</head>
<body>
    <a href="{app_back}" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>

    <main class="hub">
        <header class="hub-hero">
            <h1>{h1}</h1>
            <p>{intro}</p>
        </header>

        <div class="hub-grid">{cards}</div>

        <div class="hub-cta">
            <p style="color:var(--text-muted);margin:0 0 12px;">Track evidence across every {framework_name_lower} in one app.</p>
            <a href="{app_back}">Start free with AlwaysReady Care</a>
        </div>

        <section class="hub-faq">
            <h2 style="font:600 22px Poppins,sans-serif;color:var(--heading);margin:32px 0 14px;">FAQ — {framework_name}</h2>
            {faq_html}
        </section>
    </main>
</body>
</html>
'''


def render_sub(country_code, cfg, section, siblings):
    folder = cfg['folder']
    slug = cfg['framework_slug']
    sec_slug = section['slug']
    if folder:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/{slug}/{sec_slug}/'
        css_path = '../../../css/app.css'
        manifest_path = '../../manifest.json'
        app_back = '../../'
    else:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{slug}/{sec_slug}/'
        css_path = '../../css/app.css'
        manifest_path = '../../manifest.json'
        app_back = '../../'

    title = f'{section["title"]} — {cfg["regulator"]} {cfg["framework_name"]} Guide'
    if len(title) > 70:
        title = f'{section["title"]} — {cfg["regulator"]} Guide'
    desc = f'{section["title"]}: what {cfg["regulator"]} inspectors look for, evidence requirements, common pitfalls, and a free readiness checklist.'
    keywords = f'{section["keyword"]}, {cfg["regulator"].lower()} {section["title"].lower()}, {cfg["framework_name"].lower()}, {section["code"].lower()} {cfg["regulator"].lower()}'

    article_schema = json.dumps({
        '@context':'https://schema.org','@type':'Article',
        'headline':title,'description':desc,'inLanguage':cfg['lang'],
        'author':{'@type':'Organization','name':'Teamz Lab Ltd'},
        'publisher':{'@type':'Organization','name':'Teamz Lab Ltd'},
        'mainEntityOfPage':canonical,
        'about':{'@type':'DefinedTerm','name':section['title']}
    }, ensure_ascii=False, indent=2)

    breadcrumb_schema = json.dumps({
        '@context':'https://schema.org','@type':'BreadcrumbList',
        'itemListElement':[
            {'@type':'ListItem','position':1,'name':'AlwaysReady Care','item':f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/' if folder else 'https://tool.teamzlab.com/apps/always-ready-care/'},
            {'@type':'ListItem','position':2,'name':cfg['framework_name'],'item':f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/{slug}/' if folder else f'https://tool.teamzlab.com/apps/always-ready-care/{slug}/'},
            {'@type':'ListItem','position':3,'name':section['title'],'item':canonical}
        ]
    }, ensure_ascii=False, indent=2)

    req_rows = ''.join(f'<tr><td>{html.escape(a)}</td><td>{html.escape(b)}</td></tr>' for a,b in section['requirements'])
    pitfalls_list = ''.join(f'<li>{html.escape(p)}</li>' for p in section['pitfalls'])
    related_html = ''.join(f'<li><a href="../{s["slug"]}/">{html.escape(s["title"])}</a></li>' for s in siblings if s['slug'] != sec_slug)

    return SUB_TMPL.format(
        lang=cfg['lang'], title=html.escape(title), desc=html.escape(desc),
        canonical=canonical, og_title=html.escape(title), keywords=html.escape(keywords),
        article_schema=article_schema, breadcrumb_schema=breadcrumb_schema,
        css_path=css_path, manifest_path=manifest_path, app_back=app_back,
        region_code=folder if folder else 'uk',
        framework_name=html.escape(cfg['framework_name']),
        framework_name_lower=html.escape(cfg['framework_name'].lower()),
        regulator=html.escape(cfg['regulator']),
        code=html.escape(section['code']),
        code_simple=html.escape(section['code']),
        h1=html.escape(section['title']),
        summary=html.escape(section['summary']),
        intro=html.escape(section['intro']),
        requirements_rows=req_rows, pitfalls_list=pitfalls_list,
        related_html=related_html
    )


def render_hub(country_code, cfg):
    folder = cfg['folder']
    slug = cfg['framework_slug']
    if folder:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{folder}/{slug}/'
        css_path = '../../css/app.css'
        manifest_path = '../manifest.json'
        app_back = '../'
    else:
        canonical = f'https://tool.teamzlab.com/apps/always-ready-care/{slug}/'
        css_path = '../css/app.css'
        manifest_path = '../manifest.json'
        app_back = '../'

    collection_schema = json.dumps({
        '@context':'https://schema.org','@type':'CollectionPage',
        'name':cfg['hub_title'],'inLanguage':cfg['lang'],
        'description':cfg['hub_desc'],
        'hasPart':[{'@type':'WebPage','name':s['title'],'url':f'{canonical}{s["slug"]}/'} for s in cfg['sections']]
    }, ensure_ascii=False, indent=2)

    hub_faq_schema = json.dumps({
        '@context':'https://schema.org','@type':'FAQPage',
        'mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in cfg['hub_faqs']]
    }, ensure_ascii=False, indent=2)

    cards = '\n            '.join(
        f'<a class="hub-card" href="{s["slug"]}/"><span class="hub-card-code">{html.escape(s["code"])}</span><h2>{html.escape(s["title"])}</h2><p>{html.escape(s["summary"])}</p></a>'
        for s in cfg['sections']
    )
    faq_html = ''.join(
        f'<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>'
        for q,a in cfg['hub_faqs']
    )

    h1 = cfg['hub_title']
    intro = f'Complete guide to the {cfg["regulator"]} {cfg["framework_name"]} — each dimension explained with evidence requirements, common pitfalls and free readiness tools.'

    return HUB_TMPL.format(
        lang=cfg['lang'], title=html.escape(cfg['hub_title']),
        desc=html.escape(cfg['hub_desc']), canonical=canonical,
        keywords=html.escape(cfg['hub_keywords']),
        collection_schema=collection_schema, hub_faq_schema=hub_faq_schema,
        css_path=css_path, manifest_path=manifest_path, app_back=app_back,
        region_code=folder if folder else 'uk',
        framework_name=html.escape(cfg['framework_name']),
        framework_name_lower=html.escape(cfg['framework_name'].lower()),
        h1=html.escape(h1), intro=html.escape(intro),
        cards=cards, faq_html=faq_html
    )


def main():
    for code, cfg in COUNTRIES.items():
        folder = cfg['folder']
        slug = cfg['framework_slug']
        base_dir = os.path.join(BASE, folder, slug) if folder else os.path.join(BASE, slug)
        os.makedirs(base_dir, exist_ok=True)

        # subpages first
        for section in cfg['sections']:
            sec_dir = os.path.join(base_dir, section['slug'])
            os.makedirs(sec_dir, exist_ok=True)
            with open(os.path.join(sec_dir, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(render_sub(code, cfg, section, cfg['sections']))
            rel = os.path.relpath(os.path.join(sec_dir, 'index.html'), BASE)
            print(f'BUILT: {rel}')

        # hub
        with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(render_hub(code, cfg))
        rel = os.path.relpath(os.path.join(base_dir, 'index.html'), BASE)
        print(f'BUILT: {rel} (hub)')


if __name__ == '__main__':
    main()
