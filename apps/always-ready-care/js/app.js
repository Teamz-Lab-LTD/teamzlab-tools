/* ============================================================
   AlwaysReady Care — UK Healthcare Compliance SaaS
   Pure client-side SPA · Firebase compat SDK
   ============================================================ */

// ── Firebase Init ──────────────────────────────────────────
var firebaseConfig = {
  apiKey: 'AIzaSyDDddb_lRfhnLt4p-Y47rfkd5Nfq8CGLMQ',
  authDomain: 'always-ready-care.firebaseapp.com',
  projectId: 'always-ready-care',
  storageBucket: 'always-ready-care.firebasestorage.app',
  messagingSenderId: '54979000806',
  appId: '1:54979000806:web:805514f2111f63fc6abe27'
};
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.firestore();
var storage = firebase.storage();

// Enable Firestore offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
  if (err.code === 'failed-precondition') {
    console.warn('[Firestore] Persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('[Firestore] Persistence not supported in this browser');
  }
});

// ── Service Worker Registration ───────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/apps/always-ready-care/sw.js', {
    scope: '/apps/always-ready-care/'
  }).then(function(reg) {
    console.log('[SW] Registered:', reg.scope);
  }).catch(function(err) {
    console.warn('[SW] Registration failed:', err);
  });

  // Listen for sync messages from service worker
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'sync-evidence') {
      syncOfflineEvidence();
    }
  });
}

// ── Offline Evidence Queue (IndexedDB) ────────────────────
var OFFLINE_DB_NAME = 'arc-offline';
var OFFLINE_STORE = 'evidence-queue';

function openOfflineDB() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(OFFLINE_DB_NAME, 1);
    request.onupgradeneeded = function(event) {
      var idb = event.target.result;
      if (!idb.objectStoreNames.contains(OFFLINE_STORE)) {
        idb.createObjectStore(OFFLINE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = function(event) { resolve(event.target.result); };
    request.onerror = function(event) { reject(event.target.error); };
  });
}

function queueOfflineEvidence(evidenceData) {
  return openOfflineDB().then(function(idb) {
    return new Promise(function(resolve, reject) {
      var tx = idb.transaction(OFFLINE_STORE, 'readwrite');
      tx.objectStore(OFFLINE_STORE).put(evidenceData);
      tx.oncomplete = function() {
        showToast('Saved offline — will sync when back online', 'info');
        resolve();
      };
      tx.onerror = function() { reject(tx.error); };
    });
  });
}

function syncOfflineEvidence() {
  if (!navigator.onLine || !AppState.orgId) return Promise.resolve();

  return openOfflineDB().then(function(idb) {
    return new Promise(function(resolve, reject) {
      var tx = idb.transaction(OFFLINE_STORE, 'readonly');
      var store = tx.objectStore(OFFLINE_STORE);
      var request = store.getAll();
      request.onsuccess = function() {
        var items = request.result || [];
        if (items.length === 0) return resolve();

        var promises = items.map(function(item) {
          return db.collection('orgs').doc(item.orgId)
            .collection('evidence').doc(item.id).set(item)
            .then(function() {
              // Remove from queue after successful sync
              return openOfflineDB().then(function(idb2) {
                var tx2 = idb2.transaction(OFFLINE_STORE, 'readwrite');
                tx2.objectStore(OFFLINE_STORE).delete(item.id);
              });
            });
        });

        Promise.all(promises).then(function() {
          if (items.length > 0) {
            showToast(items.length + ' offline record(s) synced', 'success');
          }
          resolve();
        }).catch(function(err) {
          console.error('[Offline] Sync error:', err);
          resolve(); // Don't block on sync errors
        });
      };
      request.onerror = function() { resolve(); };
    });
  }).catch(function(err) {
    console.warn('[Offline] DB error:', err);
  });
}

// Sync when coming back online
window.addEventListener('online', function() {
  syncOfflineEvidence();
});

// ── State Store ────────────────────────────────────────────
var AppState = {
  user: null,
  userData: null,
  userRole: 'carer',
  orgId: null,
  siteId: null,
  sites: [],
  currentView: 'login',
  isOnline: navigator.onLine,
  unsubscribers: [],
  evidenceCache: [],
  actionsCache: [],
  reviewFilter: 'all',
  selectedPhotos: [],
  selectedEvidenceType: 'text',
  rejectTargetId: null
};

// ── Role Permissions ───────────────────────────────────────
var Permissions = {
  canReview: function(role) {
    return ['senior', 'manager', 'director', 'admin'].indexOf(role) !== -1;
  },
  canViewCompliance: function(role) {
    return ['manager', 'director', 'admin'].indexOf(role) !== -1;
  },
  canGeneratePacks: function(role) {
    return ['manager', 'director', 'admin'].indexOf(role) !== -1;
  },
  canManageTeam: function(role) {
    return role === 'admin';
  }
};

// ── Evidence Templates ─────────────────────────────────────
var TEMPLATES = [
  {
    id: 'medication-given',
    name: 'Medication Given',
    icon: 'fas fa-pills',
    desc: 'Record medication administration with dosage, time, and resident response.',
    text: 'Medication administered to [Resident Name] at [Time].\n\nMedication: [Name], Dosage: [Amount]\nRoute: Oral / Topical / Injection\nResident response: Alert and cooperative. No adverse reactions observed.\nWitnessed by: [Staff Name]\n\nNotes: Medication taken with water. Resident confirmed understanding of medication purpose.'
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    icon: 'fas fa-hand-holding-heart',
    desc: 'Document personal care activities including hygiene, dressing, and mobility support.',
    text: 'Personal care provided to [Resident Name] at [Time].\n\nActivities completed:\n- Assisted with washing and bathing\n- Oral hygiene care provided\n- Clean clothing selected by resident and assisted with dressing\n- Skin integrity checked — no concerns noted\n\nResident was encouraged to be as independent as possible. Dignity and privacy maintained throughout.\nMood: Pleasant and cooperative.'
  },
  {
    id: 'meal-support',
    name: 'Meal Support',
    icon: 'fas fa-utensils',
    desc: 'Record mealtime assistance, dietary needs, and food/fluid intake observations.',
    text: 'Meal support provided to [Resident Name] during [Breakfast/Lunch/Dinner].\n\nDietary requirements: [Standard / Soft / Pureed / Diabetic]\nMeal served: [Description]\nPortion consumed: [All / Most / Half / Minimal]\nFluid intake: [Amount] ml\n\nResident was seated comfortably in dining room. Appropriate cutlery provided. Staff encouraged adequate fluid intake.\nNotes: No signs of swallowing difficulties observed.'
  },
  {
    id: 'activity-participation',
    name: 'Activity Participation',
    icon: 'fas fa-people-group',
    desc: 'Document engagement in social, recreational, or therapeutic activities.',
    text: 'Activity session with [Resident Name] at [Time].\n\nActivity: [Name of activity]\nDuration: [X] minutes\nParticipation level: Active / Assisted / Observer\nEngagement: [Resident appeared to enjoy the activity and engaged with other residents/staff]\n\nWellbeing observations: Positive mood throughout. Resident smiled and engaged in conversation.\nFollow-up: Continue to offer similar activities based on resident preferences.'
  },
  {
    id: 'incident-occurred',
    name: 'Incident Occurred',
    icon: 'fas fa-triangle-exclamation',
    desc: 'Report falls, injuries, safeguarding concerns, or other significant events.',
    text: 'INCIDENT REPORT — [Date] at [Time]\n\nResident: [Name]\nLocation: [Where the incident occurred]\n\nDescription of incident:\n[Detailed description of what happened]\n\nInjuries sustained: [None / Description]\nFirst aid given: [Yes/No — details]\nGP/paramedic called: [Yes/No]\n\nWitnesses: [Names]\nActions taken: [Immediate response]\nFollow-up required: [Description]\n\nReported to: [Manager name] at [Time]\nFamily notified: [Yes/No — time and person contacted]'
  },
  {
    id: 'safeguarding-concern',
    name: 'Safeguarding Concern',
    icon: 'fas fa-shield-halved',
    desc: 'Record safeguarding concerns, allegations, or protective actions taken.',
    text: 'SAFEGUARDING CONCERN — [Date] at [Time]\n\nResident: [Name]\nType of concern: [Physical / Emotional / Financial / Neglect / Self-neglect / Sexual / Organisational]\n\nDescription:\n[What was observed, disclosed, or reported]\n\nImmediate actions taken:\n- [Ensured resident safety]\n- [Preserved any evidence]\n- [Reported to safeguarding lead]\n\nReported to: [Manager/Safeguarding Lead name] at [Time]\nLocal authority referral: [Yes/No — reference number if known]\nFamily notified: [Yes/No — if appropriate]\n\nFollow-up plan:\n[Next steps and review date]'
  },
  {
    id: 'night-care',
    name: 'Night Care Check',
    icon: 'fas fa-moon',
    desc: 'Document overnight welfare checks, sleep patterns, and night-time support.',
    text: 'NIGHT CARE RECORD — [Date]\n\nResident: [Name]\nCheck time: [Time]\n\nSleep status: [Asleep / Awake / Restless / Required assistance]\nPosition: [Comfortable / Repositioned]\nContinent: [Dry / Pad changed / Toileting assistance]\n\nAny concerns: [None / Description]\nAction taken: [Description if applicable]\n\nStaff member: [Name]'
  },
  {
    id: 'morning-handover',
    name: 'Morning Handover',
    icon: 'fas fa-sun',
    desc: 'Record shift handover notes for continuity of care.',
    text: 'SHIFT HANDOVER — [Date] at [Time]\n\nOutgoing shift: [Night / Day / Evening]\nIncoming shift: [Day / Evening / Night]\n\nKey updates:\n1. [Resident name] — [Update]\n2. [Resident name] — [Update]\n3. [Resident name] — [Update]\n\nIncidents during shift: [None / Summary]\nMedication concerns: [None / Description]\nStaff issues: [None / Description]\nVisitors expected: [None / Details]\n\nHandover given by: [Name]\nHandover received by: [Name]'
  },
  {
    id: 'staff-supervision',
    name: 'Staff Supervision',
    icon: 'fas fa-user-check',
    desc: 'Document one-to-one supervision sessions with care staff.',
    text: 'SUPERVISION RECORD — [Date]\n\nStaff member: [Name]\nRole: [Carer / Senior / Other]\nSupervisor: [Name]\n\nTopics discussed:\n- Workload and wellbeing\n- Training and development needs\n- Performance and observations\n- Safeguarding awareness\n- Any concerns raised by staff member\n\nAgreed actions:\n1. [Action] — Due: [Date]\n2. [Action] — Due: [Date]\n\nNext supervision date: [Date]\n\nSigned: Staff member [Y/N] | Supervisor [Y/N]'
  },
  {
    id: 'complaint-record',
    name: 'Complaint Received',
    icon: 'fas fa-comment-dots',
    desc: 'Log complaints from residents, families, or staff with investigation and outcome.',
    text: 'COMPLAINT RECORD — [Date] at [Time]\n\nComplainant: [Name and relationship to resident]\nMethod: [Verbal / Written / Phone / Email]\n\nNature of complaint:\n[Detailed description]\n\nResident involved: [Name if applicable]\n\nImmediate response:\n[What was said/done]\n\nInvestigation plan:\n[Steps to be taken and by whom]\n\nTarget response date: [Date]\nDuty of Candour applies: [Yes / No]\n\nReceived by: [Name and role]'
  },
  {
    id: 'mental-capacity',
    name: 'Mental Capacity Assessment',
    icon: 'fas fa-brain',
    desc: 'Document decision-specific mental capacity assessments under the MCA 2005.',
    text: 'MENTAL CAPACITY ASSESSMENT — [Date]\n\nResident: [Name]\nDecision to be made: [Specific decision]\nAssessor: [Name and role]\n\nDoes the person have an impairment or disturbance in the functioning of their mind or brain?\n[Yes/No — details]\n\nCan the person:\n1. Understand the relevant information? [Yes/No]\n2. Retain the information? [Yes/No]\n3. Use or weigh the information? [Yes/No]\n4. Communicate their decision? [Yes/No]\n\nConclusion: [Has capacity / Lacks capacity for this specific decision]\n\nIf lacks capacity — best interests decision:\n[Who was consulted, what was decided, and why]\n\nDoLS application required: [Yes/No]\nReview date: [Date]'
  },
  {
    id: 'health-monitoring',
    name: 'Health Observation',
    icon: 'fas fa-heart-pulse',
    desc: 'Record vital signs, GP visits, hospital appointments, and health changes.',
    text: 'HEALTH OBSERVATION — [Date] at [Time]\n\nResident: [Name]\n\nObservation type: [Routine / GP visit / Hospital / Concern]\n\nVital signs (if taken):\n- Temperature: [°C]\n- Blood pressure: [/mmHg]\n- Pulse: [bpm]\n- Oxygen saturation: [%]\n- Blood sugar: [mmol/L]\n- Weight: [kg]\n\nObservations:\n[Description of health status, changes, or concerns]\n\nAction taken:\n[Description — GP called, medication adjusted, hospital referral, etc.]\n\nRecorded by: [Name]'
  }
];

// ── Region-Specific Templates ─────────────────────────────
// These are appended based on active region
var REGION_TEMPLATES = {
  au: [
    {
      id: 'sirs-priority1',
      name: 'SIRS — Priority 1 Incident',
      icon: 'fas fa-exclamation-circle',
      desc: 'Report a Priority 1 serious incident (must be reported within 24 hours).',
      text: 'SIRS PRIORITY 1 INCIDENT — [Date] at [Time]\n\nFacility: [Name]\nConsumer: [Name]\n\nIncident type: [Unreasonable use of force / Unlawful sexual contact / Psychological or emotional abuse / Stealing or financial coercion / Neglect / Unexpected death / Use of restrictive practice causing injury or trauma / Missing consumer]\n\nDescription:\n[Detailed description of the incident]\n\nImmediate actions taken:\n- [Ensured consumer safety]\n- [First aid / medical attention provided]\n- [Staff involved stood down if appropriate]\n\nWitnesses: [Names]\nPolice notified: [Yes/No — reference number]\nFamily/representative notified: [Yes/No — time and person]\n\nSIRS REPORTING:\n- Reported to Aged Care Quality and Safety Commission: [Yes — within 24 hours]\n- Notification ID: [If submitted]\n- Reported by: [Name and role]\n\nInvestigation plan:\n[Steps to be taken, responsible person, timeline]\n\nReview date: [Date]'
    },
    {
      id: 'sirs-priority2',
      name: 'SIRS — Priority 2 Incident',
      icon: 'fas fa-exclamation-triangle',
      desc: 'Report a Priority 2 serious incident (must be reported within 30 days).',
      text: 'SIRS PRIORITY 2 INCIDENT — [Date] at [Time]\n\nFacility: [Name]\nConsumer: [Name]\n\nIncident type: [Unreasonable use of force not causing injury / Rough or inappropriate handling / Use of restrictive practice not consistent with guidelines / Emotional abuse pattern / Unexplained absence / Neglect pattern]\n\nDescription:\n[Detailed description of the incident or pattern]\n\nActions taken:\n- [Description of immediate response]\n- [Support provided to consumer]\n\nFamily/representative notified: [Yes/No]\n\nSIRS REPORTING:\n- To be reported within 30 days of becoming aware\n- Reported to Commission: [Yes/No — date]\n- Notification ID: [If submitted]\n- Reported by: [Name and role]\n\nRoot cause analysis:\n[Initial assessment of contributing factors]\n\nCorrective actions:\n1. [Action] — Due: [Date] — Responsible: [Name]\n2. [Action] — Due: [Date] — Responsible: [Name]\n\nReview date: [Date]'
    },
    {
      id: 'restrictive-practice',
      name: 'Restrictive Practice Record',
      icon: 'fas fa-lock',
      desc: 'Document any use of restrictive practices as required under ACQS Standard 4.',
      text: 'RESTRICTIVE PRACTICE RECORD — [Date] at [Time]\n\nConsumer: [Name]\nFacility: [Name]\n\nType of restraint: [Physical / Chemical / Mechanical / Environmental / Seclusion]\n\nReason for use:\n[Description of circumstances requiring restrictive practice]\n\nAlternatives tried before restraint:\n1. [Alternative attempted]\n2. [Alternative attempted]\n3. [Alternative attempted]\n\nDuration: [Start time] to [End time]\nConsumer response: [Description]\nMonitoring during restraint: [Frequency and observations]\n\nAuthorised by: [Name and role]\nInformed consent obtained: [Yes/No — details]\nBehavior support plan in place: [Yes/No]\n\nPost-incident review:\n[Consumer wellbeing check, debrief, documentation]\n\nReported to: [Manager name]\nSIRS reportable: [Yes/No]\nReview date: [Date]'
    }
  ],
  nz: [
    {
      id: 'restraint-minimisation',
      name: 'Restraint Minimisation Record',
      icon: 'fas fa-lock',
      desc: 'Document restraint use under NZS 8134.4 Safe Environment requirements.',
      text: 'RESTRAINT MINIMISATION RECORD — [Date] at [Time]\n\nResident: [Name]\nFacility: [Name]\n\nType of restraint: [Physical / Environmental / Enabler]\nReason: [Description of circumstances]\n\nAlternatives tried:\n1. [Alternative attempted]\n2. [Alternative attempted]\n\nDuration: [Start time] to [End time]\nResident response: [Description]\n\nAuthorised by: [Name and role]\nConsent: [Resident/family/EPOA informed — Yes/No]\nCare plan updated: [Yes/No]\n\nReview date: [Date]\nRecorded by: [Name]'
    }
  ]
};

// Get templates for current region (base + region-specific)
function getActiveTemplates() {
  var regionCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
  var extra = REGION_TEMPLATES[regionCode] || [];
  return TEMPLATES.concat(extra);
}

// ── Compliance Categories (mapped to CQC 5 Key Questions) ─
// ── Multi-Region Compliance Frameworks ────────────────────
var REGION_CONFIGS = {
  uk: {
    name: 'United Kingdom',
    regulator: 'CQC (Care Quality Commission)',
    regulatorShort: 'CQC',
    currency: '£',
    locale: 'en-GB',
    categories: [
      'Medication Management', 'Safeguarding', 'Incident & Accident', 'Infection Control',
      'Risk Assessment', 'Falls Prevention', 'Care Planning', 'Nutrition & Hydration',
      'Health Monitoring', 'Mental Capacity & DoLS', 'Staff Training & Competency',
      'Personal Care & Dignity', 'Activities & Wellbeing', 'Communication & Engagement',
      'Complaints & Feedback', 'End of Life Care', 'Person-Centred Care',
      'Governance & Audits', 'Staff Supervision', 'Night Care', 'Duty of Candour'
    ],
    framework: {
      'Safe': ['Medication Management', 'Safeguarding', 'Incident & Accident', 'Infection Control', 'Risk Assessment', 'Falls Prevention'],
      'Effective': ['Care Planning', 'Nutrition & Hydration', 'Health Monitoring', 'Mental Capacity & DoLS', 'Staff Training & Competency'],
      'Caring': ['Personal Care & Dignity', 'Activities & Wellbeing', 'Communication & Engagement'],
      'Responsive': ['Complaints & Feedback', 'End of Life Care', 'Person-Centred Care'],
      'Well-led': ['Governance & Audits', 'Staff Supervision', 'Night Care', 'Duty of Candour']
    },
    frameworkLabel: 'CQC 5 Key Questions',
    inspectionLabel: 'CQC Inspection',
    packLabel: 'CQC Inspection Pack',
    readinessLabel: 'CQC Readiness'
  },
  au: {
    name: 'Australia',
    regulator: 'Aged Care Quality and Safety Commission',
    regulatorShort: 'ACQSC',
    currency: 'A$',
    locale: 'en-AU',
    categories: [
      'Identity & Preferences', 'Autonomy & Informed Consent', 'Dignity & Respect',
      'Governance & Leadership', 'Risk Management', 'Quality Improvement',
      'Workforce Planning', 'Staff Competency & Training', 'Staff Wellbeing',
      'Clinical Care & Assessment', 'Medication Management', 'Infection Prevention',
      'Falls Prevention', 'Restrictive Practices', 'Palliative & End of Life',
      'Living Environment', 'Equipment & Maintenance', 'Emergency Planning',
      'Meals & Nutrition', 'Daily Living Support', 'Social & Recreational Activities',
      'Feedback & Complaints', 'Incident Management', 'Open Disclosure'
    ],
    framework: {
      'Standard 1 — The Person': ['Identity & Preferences', 'Autonomy & Informed Consent', 'Dignity & Respect'],
      'Standard 2 — The Organisation': ['Governance & Leadership', 'Risk Management', 'Quality Improvement'],
      'Standard 3 — The Workforce': ['Workforce Planning', 'Staff Competency & Training', 'Staff Wellbeing'],
      'Standard 4 — Clinical Care': ['Clinical Care & Assessment', 'Medication Management', 'Infection Prevention', 'Falls Prevention', 'Restrictive Practices', 'Palliative & End of Life'],
      'Standard 5 — The Environment': ['Living Environment', 'Equipment & Maintenance', 'Emergency Planning'],
      'Standard 6 — Food & Nutrition': ['Meals & Nutrition', 'Daily Living Support', 'Social & Recreational Activities'],
      'Standard 7 — Feedback & Improvement': ['Feedback & Complaints', 'Incident Management', 'Open Disclosure']
    },
    frameworkLabel: '7 Strengthened Quality Standards',
    inspectionLabel: 'Quality Assessment',
    packLabel: 'Assessment Evidence Pack',
    readinessLabel: 'Compliance Readiness'
  },
  ie: {
    name: 'Ireland',
    regulator: 'HIQA (Health Information and Quality Authority)',
    regulatorShort: 'HIQA',
    currency: '€',
    locale: 'en-IE',
    categories: [
      'Person-Centred Care & Support', 'Effective Services', 'Safe Services',
      'Health & Wellbeing', 'Leadership & Governance', 'Workforce',
      'Use of Resources', 'Use of Information',
      'Medication Management', 'Nutrition & Hydration', 'Infection Prevention',
      'Falls Prevention', 'Safeguarding & Protection', 'Complaints Management',
      'End of Life Care', 'Activities & Social Care', 'Risk Management',
      'Staff Supervision & Training', 'Records & Documentation', 'Residents\' Rights'
    ],
    framework: {
      'Person-Centred': ['Person-Centred Care & Support', 'Residents\' Rights', 'Activities & Social Care', 'End of Life Care'],
      'Effective': ['Effective Services', 'Health & Wellbeing', 'Nutrition & Hydration', 'Medication Management'],
      'Safe': ['Safe Services', 'Infection Prevention', 'Falls Prevention', 'Safeguarding & Protection', 'Risk Management'],
      'Well-Led': ['Leadership & Governance', 'Workforce', 'Staff Supervision & Training', 'Use of Resources', 'Use of Information', 'Records & Documentation', 'Complaints Management']
    },
    frameworkLabel: 'HIQA 8 National Standards',
    inspectionLabel: 'HIQA Inspection',
    packLabel: 'HIQA Inspection Pack',
    readinessLabel: 'HIQA Readiness'
  },
  nz: {
    name: 'New Zealand',
    regulator: 'Ministry of Health (Designated Auditing Agencies)',
    regulatorShort: 'MoH/DAA',
    currency: 'NZ$',
    locale: 'en-NZ',
    categories: [
      'Consumer Rights', 'Organisational Management', 'Continuum of Service Delivery',
      'Safe & Appropriate Environment', 'Restraint Minimisation',
      'Infection Prevention & Control', 'Medication Management',
      'Nutrition & Fluid Balance', 'Personal Care & Dignity',
      'Activities & Recreation', 'Clinical Assessment & Care Planning',
      'Wound & Skin Care', 'Falls Prevention', 'Pain Management',
      'Palliative & End of Life', 'Complaints & Feedback',
      'Staffing & Workforce', 'Training & Competency',
      'Governance & Quality Improvement', 'Documentation & Records'
    ],
    framework: {
      'NZS 8134.1 — Consumer Rights': ['Consumer Rights', 'Complaints & Feedback', 'Personal Care & Dignity'],
      'NZS 8134.2 — Organisational Management': ['Organisational Management', 'Governance & Quality Improvement', 'Staffing & Workforce', 'Training & Competency', 'Documentation & Records'],
      'NZS 8134.3 — Continuum of Service': ['Continuum of Service Delivery', 'Clinical Assessment & Care Planning', 'Medication Management', 'Nutrition & Fluid Balance', 'Activities & Recreation', 'Palliative & End of Life', 'Pain Management', 'Wound & Skin Care'],
      'NZS 8134.4 — Safe Environment': ['Safe & Appropriate Environment', 'Infection Prevention & Control', 'Falls Prevention', 'Restraint Minimisation']
    },
    frameworkLabel: 'NZS 8134 Health & Disability Standards',
    inspectionLabel: 'Certification Audit',
    packLabel: 'Audit Evidence Pack',
    readinessLabel: 'Audit Readiness'
  }
};

// Auto-detect region from browser timezone
function detectRegionFromTimezone() {
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/Australia/.test(tz)) return 'au';
    if (/Pacific\/Auckland|Pacific\/Chatham/.test(tz)) return 'nz';
    if (/Europe\/Dublin/.test(tz)) return 'ie';
  } catch (e) {}
  return 'uk';
}

// Active region priority: localStorage (set by /au/, /nz/, /ie/ pages) > timezone > UK default
var _savedRegion = localStorage.getItem('arc-region');
var _detectedRegion = detectRegionFromTimezone();
var ActiveRegion = REGION_CONFIGS[_savedRegion || _detectedRegion] || REGION_CONFIGS.uk;

function setRegion(regionCode) {
  if (REGION_CONFIGS[regionCode]) {
    ActiveRegion = REGION_CONFIGS[regionCode];
    // Store in org if possible
    if (AppState.orgId) {
      db.collection('orgs').doc(AppState.orgId).update({ region: regionCode }).catch(function() {});
    }
    localStorage.setItem('arc-region', regionCode);
  }
}

function loadRegionFromOrg() {
  // Priority: org doc > localStorage > timezone detection > UK default
  var detected = detectRegionFromTimezone();
  if (AppState.orgId) {
    return db.collection('orgs').doc(AppState.orgId).get().then(function(doc) {
      if (doc.exists && doc.data().region && REGION_CONFIGS[doc.data().region]) {
        ActiveRegion = REGION_CONFIGS[doc.data().region];
      } else {
        var saved = localStorage.getItem('arc-region');
        ActiveRegion = REGION_CONFIGS[saved] || REGION_CONFIGS[detected] || REGION_CONFIGS.uk;
      }
    }).catch(function() {});
  }
  var saved = localStorage.getItem('arc-region');
  ActiveRegion = REGION_CONFIGS[saved] || REGION_CONFIGS[detected] || REGION_CONFIGS.uk;
  return Promise.resolve();
}

// ── Landing page localisation per region ──────────────────
var LANDING_CONTENT = {
  uk: {
    badge: 'Free Care Home Software UK',
    h1: 'Care Home Compliance Software That Keeps You CQC-Ready Every Day',
    heroSub: 'Keep your care planning system. We make your evidence inspection-ready. AlwaysReady Care captures, structures, reviews, and exports CQC-ready evidence — mapped to 5 key questions, 34 quality statements, and 6 evidence categories. Built for the 29,700+ CQC-regulated service locations across England.',
    trustGdpr: 'UK GDPR compliant',
    trustReg: 'Reg 17 governance ready',
    featDashTitle: 'See Your CQC Readiness',
    featDashDesc: 'A live compliance dashboard mapped to CQC\'s 5 key questions — Safe, Effective, Caring, Responsive, Well-led. See which of the 21 compliance categories have gaps before an inspector finds them.',
    featPackDesc: 'When CQC visits, generate a professional inspection-ready evidence pack in one click. Filter by date range, evidence type, or compliance area. Download, print, or share instantly.',
    painEvidence: 'Paper notes, WhatsApp messages, Excel spreadsheets, emails — your compliance evidence is in 5 different places. CQC asks for it and you spend hours pulling it together.',
    painAudit: 'You can show the audit, but not the action taken, who owns it, when it\'s due, or proof of improvement. CQC calls this a Regulation 17 governance failure — the #1 reason homes get "Requires Improvement".',
    painRecords: 'Staffing pressure means carers write evidence at the end of a shift — or not at all. Retrospective, incomplete records are a red flag for inspectors under Regulation 12 (safe care).',
    painInspection: 'Teams scramble before a CQC visit instead of running a continuous evidence process. Skills for Care data shows this is the single biggest gap in services rated "Requires Improvement".',
    audienceTitle: 'Best Care Home Software for Every Role',
    audienceManager: 'See compliance readiness at a glance. Spot gaps across all 21 CQC categories. Generate inspection packs. Manage your team\'s access and roles.',
    frameworkTitle: 'CQC Compliance Audit Tool — Mapped to 5 Key Questions',
    frameworkSub: 'The only free care home audit tool that tracks 21 compliance categories across Safe, Effective, Caring, Responsive, and Well-led',
    regsTitle: 'Built on CQC Regulatory Requirements',
    regsSub: 'AlwaysReady Care helps you evidence compliance with the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014',
    regsItems: [
      { code: 'Reg 9', label: 'Person-centred care' },
      { code: 'Reg 11', label: 'Need for consent & MCA' },
      { code: 'Reg 12', label: 'Safe care and treatment' },
      { code: 'Reg 13', label: 'Safeguarding from abuse' },
      { code: 'Reg 16', label: 'Receiving complaints' },
      { code: 'Reg 17', label: 'Good governance' },
      { code: 'Reg 18', label: 'Staffing competency' },
      { code: 'Reg 20', label: 'Duty of candour' }
    ],
    regsNote: 'UK GDPR & Data Protection Act 2018 compliant. Evidence retained per Digital Care Hub guidance: care records 8 years, serious incidents 20 years.',
    proofTitle: 'Why UK Care Homes Choose This Compliance Software',
    proofCategories: '21',
    proofCatLabel: 'CQC compliance categories tracked',
    proofQuestions: '5',
    proofQLabel: 'CQC Key Questions mapped',
    proCatFeature: '21 CQC compliance categories',
    priceFree: '£0', pricePro: '£79',
    priceUnit: '/home/month',
    leadNote: 'No spam, unsubscribe anytime. We respect UK GDPR.',
    leadSub: 'Get CQC compliance tips, product updates, and early access to new features',
    footerDesc: 'Free care home compliance software for UK social care providers',
    footerGdpr: '© 2026 Teamz Lab Ltd. All rights reserved. UK GDPR & Data Protection Act 2018 compliant.',
    facilityTerm: 'care home',
    workflowSub: 'From frontline carer to CQC inspector — the best care home compliance workflow in the UK'
  },
  au: {
    badge: 'Free Aged Care Software Australia',
    h1: 'Aged Care Compliance Software That Keeps You Audit-Ready Every Day',
    heroSub: 'Keep your care management system. We make your evidence audit-ready. AlwaysReady Care captures, structures, reviews, and exports evidence mapped to the 7 Strengthened Aged Care Quality Standards — 24 compliance categories across the new ACQS 2025 framework. Built for 3,600+ aged care facilities across Australia.',
    trustGdpr: 'Privacy Act 1988 compliant',
    trustReg: 'SIRS reporting ready',
    featDashTitle: 'See Your Compliance Readiness',
    featDashDesc: 'A live compliance dashboard mapped to 7 Strengthened Quality Standards — The Person, The Organisation, The Workforce, Clinical Care, The Environment, Food & Nutrition, Feedback & Improvement. See which of the 24 compliance categories have gaps before an assessor finds them.',
    featPackDesc: 'When the Aged Care Quality and Safety Commission visits, generate a professional assessment-ready evidence pack in one click. Filter by date range, evidence type, or compliance area.',
    painEvidence: 'Paper notes, WhatsApp messages, Excel spreadsheets, emails — your compliance evidence is scattered across systems. When the Commission requests it, you spend hours pulling it together.',
    painAudit: 'You can show the audit, but not the action taken, who owns it, when it\'s due, or proof of improvement. Under the Strengthened Standards, continuous improvement evidence is mandatory.',
    painRecords: 'Staffing pressure means care workers write evidence at the end of a shift — or not at all. Incomplete records are a red flag for assessors under the new ACQS 2025 requirements.',
    painInspection: 'Teams scramble before an assessment visit instead of running a continuous evidence process. The Aged Care Quality and Safety Commission expects ongoing compliance, not last-minute preparation.',
    audienceTitle: 'Best Aged Care Software for Every Role',
    audienceManager: 'See compliance readiness at a glance. Spot gaps across all 24 ACQS categories. Generate assessment packs. Manage your team\'s access and roles.',
    frameworkTitle: 'ACQS Compliance Tool — Mapped to 7 Strengthened Quality Standards',
    frameworkSub: 'The only free aged care compliance tool that tracks 24 categories across the new Aged Care Quality Standards (ACQS 2025)',
    regsTitle: 'Built on Aged Care Quality Standards 2025',
    regsSub: 'AlwaysReady Care helps you evidence compliance with the Aged Care Act 1997 and the Strengthened Aged Care Quality Standards',
    regsItems: [
      { code: 'Std 1', label: 'The Person — identity, autonomy, dignity' },
      { code: 'Std 2', label: 'The Organisation — governance, risk, quality' },
      { code: 'Std 3', label: 'The Workforce — planning, competency, wellbeing' },
      { code: 'Std 4', label: 'Clinical Care — assessment, medication, infection' },
      { code: 'Std 5', label: 'The Environment — living, equipment, emergency' },
      { code: 'Std 6', label: 'Food & Nutrition — meals, daily living, activities' },
      { code: 'Std 7', label: 'Feedback & Improvement — complaints, incidents, disclosure' }
    ],
    regsNote: 'Privacy Act 1988 & Australian Privacy Principles compliant. SIRS (Serious Incident Response Scheme) reporting integrated. Records retained per Commonwealth guidelines.',
    proofTitle: 'Why Australian Aged Care Facilities Choose This Software',
    proofCategories: '24',
    proofCatLabel: 'ACQS compliance categories tracked',
    proofQuestions: '7',
    proofQLabel: 'Quality Standards mapped',
    proCatFeature: '24 ACQS compliance categories',
    priceFree: 'A$0', pricePro: 'A$129',
    priceUnit: '/facility/month',
    leadNote: 'No spam, unsubscribe anytime. We respect Australian Privacy Principles.',
    leadSub: 'Get aged care compliance tips, product updates, and early access to new features',
    footerDesc: 'Free aged care compliance software for Australian care providers',
    footerGdpr: '© 2026 Teamz Lab Ltd. All rights reserved. Privacy Act 1988 & Australian Privacy Principles compliant.',
    facilityTerm: 'aged care facility',
    workflowSub: 'From frontline care worker to quality assessor — the best aged care compliance workflow in Australia'
  },
  nz: {
    badge: 'Free Rest Home Software New Zealand',
    h1: 'Rest Home Compliance Software That Keeps You Audit-Ready Every Day',
    heroSub: 'Keep your care management system. We make your evidence audit-ready. AlwaysReady Care captures, structures, reviews, and exports evidence mapped to NZS 8134 Health and Disability Services Standards — 20 compliance categories across 4 standards. Built for 900+ aged residential care facilities across New Zealand.',
    trustGdpr: 'Privacy Act 2020 compliant',
    trustReg: 'NZS 8134 audit ready',
    featDashTitle: 'See Your Audit Readiness',
    featDashDesc: 'A live compliance dashboard mapped to NZS 8134 standards — Consumer Rights, Organisational Management, Continuum of Service, Safe Environment. See which of the 20 compliance categories have gaps before an auditor finds them.',
    featPackDesc: 'When the Designated Auditing Agency visits, generate a professional audit-ready evidence pack in one click. Filter by date range, evidence type, or compliance area.',
    painEvidence: 'Paper notes, WhatsApp messages, Excel spreadsheets, emails — your compliance evidence is scattered across systems. When the auditing agency requests it, you spend hours pulling it together.',
    painAudit: 'You can show the audit, but not the action taken, who owns it, when it\'s due, or proof of improvement. Under the Health and Disability Services Standards, continuous improvement evidence is mandatory.',
    painRecords: 'Staffing pressure means caregivers write evidence at the end of a shift — or not at all. Incomplete records are a red flag for auditors under NZS 8134 requirements.',
    painInspection: 'Teams scramble before a certification audit instead of running a continuous evidence process. The Ministry of Health expects ongoing compliance, not last-minute preparation.',
    audienceTitle: 'Best Rest Home Software for Every Role',
    audienceManager: 'See compliance readiness at a glance. Spot gaps across all 20 NZS 8134 categories. Generate audit packs. Manage your team\'s access and roles.',
    frameworkTitle: 'NZS 8134 Compliance Tool — Mapped to Health & Disability Standards',
    frameworkSub: 'The only free rest home compliance tool that tracks 20 categories across NZS 8134.1 to NZS 8134.4',
    regsTitle: 'Built on NZS 8134 Health & Disability Standards',
    regsSub: 'AlwaysReady Care helps you evidence compliance with the Health and Disability Services (Safety) Act 2001 and NZS 8134:2021',
    regsItems: [
      { code: 'NZS 8134.1', label: 'Consumer Rights — rights, complaints, dignity' },
      { code: 'NZS 8134.2', label: 'Organisational Management — governance, staffing, training' },
      { code: 'NZS 8134.3', label: 'Continuum of Service — clinical care, medication, nutrition' },
      { code: 'NZS 8134.4', label: 'Safe Environment — infection control, falls, restraint' }
    ],
    regsNote: 'Privacy Act 2020 & Health Information Privacy Code compliant. Records retained per NZ Health and Disability Commissioner guidelines.',
    proofTitle: 'Why New Zealand Rest Homes Choose This Software',
    proofCategories: '20',
    proofCatLabel: 'NZS 8134 compliance categories tracked',
    proofQuestions: '4',
    proofQLabel: 'NZS 8134 Standards mapped',
    proCatFeature: '20 NZS 8134 compliance categories',
    priceFree: 'NZ$0', pricePro: 'NZ$99',
    priceUnit: '/facility/month',
    leadNote: 'No spam, unsubscribe anytime. We respect the NZ Privacy Act 2020.',
    leadSub: 'Get aged care compliance tips, product updates, and early access to new features',
    footerDesc: 'Free rest home compliance software for New Zealand care providers',
    footerGdpr: '© 2026 Teamz Lab Ltd. All rights reserved. Privacy Act 2020 & Health Information Privacy Code compliant.',
    facilityTerm: 'rest home',
    workflowSub: 'From frontline caregiver to certification auditor — the best rest home compliance workflow in New Zealand'
  },
  ie: {
    badge: 'Free Nursing Home Software Ireland',
    h1: 'Nursing Home Compliance Software That Keeps You HIQA-Ready Every Day',
    heroSub: 'Keep your care management system. We make your evidence inspection-ready. AlwaysReady Care captures, structures, reviews, and exports HIQA-ready evidence — mapped to 8 National Standards and 20 compliance categories. Built for 580+ HIQA-registered designated centres across Ireland.',
    trustGdpr: 'GDPR compliant',
    trustReg: 'HIQA standards ready',
    featDashTitle: 'See Your HIQA Readiness',
    featDashDesc: 'A live compliance dashboard mapped to HIQA\'s National Standards — Person-Centred, Effective, Safe, Well-Led. See which of the 20 compliance categories have gaps before an inspector finds them.',
    featPackDesc: 'When HIQA visits, generate a professional inspection-ready evidence pack in one click. Filter by date range, evidence type, or compliance area.',
    painEvidence: 'Paper notes, WhatsApp messages, Excel spreadsheets, emails — your compliance evidence is scattered across systems. When HIQA requests it, you spend hours pulling it together.',
    painAudit: 'You can show the audit, but not the action taken, who owns it, when it\'s due, or proof of improvement. HIQA expects governance evidence under the National Standards for Residential Care.',
    painRecords: 'Staffing pressure means carers write evidence at the end of a shift — or not at all. Incomplete records are a red flag for HIQA inspectors.',
    painInspection: 'Teams scramble before a HIQA visit instead of running a continuous evidence process. Continuous compliance is now a core expectation under the National Standards.',
    audienceTitle: 'Best Nursing Home Software for Every Role',
    audienceManager: 'See compliance readiness at a glance. Spot gaps across all 20 HIQA categories. Generate inspection packs. Manage your team\'s access and roles.',
    frameworkTitle: 'HIQA Compliance Tool — Mapped to 8 National Standards',
    frameworkSub: 'The only free nursing home compliance tool that tracks 20 categories across HIQA\'s National Standards for Residential Care',
    regsTitle: 'Built on HIQA National Standards',
    regsSub: 'AlwaysReady Care helps you evidence compliance with the Health Act 2007 and HIQA National Standards for Residential Care Settings',
    regsItems: [
      { code: 'Theme 1', label: 'Person-Centred Care & Support' },
      { code: 'Theme 2', label: 'Effective Services' },
      { code: 'Theme 3', label: 'Safe Services' },
      { code: 'Theme 4', label: 'Health & Wellbeing' },
      { code: 'Theme 5', label: 'Leadership, Governance & Management' },
      { code: 'Theme 6', label: 'Workforce' },
      { code: 'Theme 7', label: 'Use of Resources' },
      { code: 'Theme 8', label: 'Use of Information' }
    ],
    regsNote: 'GDPR & Data Protection Acts 1988-2018 compliant. Records retained per HIQA and HSE guidance.',
    proofTitle: 'Why Irish Nursing Homes Choose This Software',
    proofCategories: '20',
    proofCatLabel: 'HIQA compliance categories tracked',
    proofQuestions: '8',
    proofQLabel: 'National Standards mapped',
    proCatFeature: '20 HIQA compliance categories',
    priceFree: '€0', pricePro: '€89',
    priceUnit: '/centre/month',
    leadNote: 'No spam, unsubscribe anytime. We respect GDPR.',
    leadSub: 'Get nursing home compliance tips, product updates, and early access to new features',
    footerDesc: 'Free nursing home compliance software for Irish care providers',
    footerGdpr: '© 2026 Teamz Lab Ltd. All rights reserved. GDPR & Data Protection Acts 1988-2018 compliant.',
    facilityTerm: 'nursing home',
    workflowSub: 'From frontline carer to HIQA inspector — the best nursing home compliance workflow in Ireland'
  }
};

// Region-specific FAQ schema data
var LANDING_FAQS = {
  uk: [
    { q: 'What is CQC compliance software?', a: 'CQC compliance software helps UK care homes capture, organise, and export evidence that proves they meet Care Quality Commission standards across 5 key questions: Safe, Effective, Caring, Responsive, and Well-led. AlwaysReady Care does this in under 60 seconds per record.' },
    { q: 'How do I prepare for a CQC inspection?', a: 'Preparing for a CQC inspection requires continuous evidence collection across compliance categories like medication management, safeguarding, personal care, and governance. AlwaysReady Care tracks 21 categories mapped to CQC\'s 34 quality statements, showing your readiness score in real-time.' },
    { q: 'What is the best care home software UK?', a: 'For full care planning, options include Person Centred Software, Nourish Care, and Log my Care. For compliance evidence specifically, AlwaysReady Care works alongside any existing system as a dedicated evidence layer — no rip-and-replace needed.' },
    { q: 'What triggers a CQC inspection?', a: 'CQC inspections can be triggered by complaints, safeguarding referrals, whistleblowing, changes in ratings, or routine scheduling. Having continuous, well-structured evidence ensures you are ready whenever an inspection happens.' },
    { q: 'Is this care home software free?', a: 'AlwaysReady Care is free to start with full evidence capture, compliance tracking, and inspection pack generation. Pro plans with advanced features start from £79 per care home per month.' }
  ],
  au: [
    { q: 'What is aged care compliance software?', a: 'Aged care compliance software helps Australian facilities capture, organise, and export evidence that proves they meet the Strengthened Aged Care Quality Standards (ACQS 2025) across 7 standards. AlwaysReady Care tracks 24 compliance categories in under 60 seconds per record.' },
    { q: 'How do I prepare for an ACQSC quality assessment?', a: 'Preparing for a quality assessment requires continuous evidence collection across categories like clinical care, medication, infection prevention, and governance. AlwaysReady Care tracks 24 categories mapped to the 7 Strengthened Standards, showing your readiness score in real-time.' },
    { q: 'What is the best aged care software Australia?', a: 'For full care management, options include AlayaCare, Statura Care, and MYP. For compliance evidence specifically, AlwaysReady Care works alongside any existing system as a dedicated evidence layer — no rip-and-replace needed.' },
    { q: 'What is the SIRS reporting scheme?', a: 'The Serious Incident Response Scheme (SIRS) requires aged care providers to report priority 1 incidents within 24 hours and priority 2 within 30 days to the Commission. AlwaysReady Care includes SIRS incident templates with automatic priority classification.' },
    { q: 'Is this aged care software free?', a: 'AlwaysReady Care is free to start with full evidence capture, compliance tracking, and assessment pack generation. Pro plans with advanced features start from A$129 per facility per month.' }
  ],
  nz: [
    { q: 'What is rest home compliance software?', a: 'Rest home compliance software helps New Zealand aged residential care facilities capture, organise, and export evidence that proves they meet NZS 8134 Health and Disability Services Standards across 4 standards. AlwaysReady Care tracks 20 categories in under 60 seconds per record.' },
    { q: 'How do I prepare for a certification audit?', a: 'Preparing for a certification audit requires continuous evidence collection across categories like consumer rights, clinical care, medication management, and organisational management. AlwaysReady Care tracks 20 categories mapped to NZS 8134.1 through 8134.4, showing your readiness score in real-time.' },
    { q: 'What is the best rest home software New Zealand?', a: 'For full care management, VCare is the market leader. For compliance evidence specifically, AlwaysReady Care works alongside any existing system as a dedicated evidence layer — no rip-and-replace needed.' },
    { q: 'How does the NZS 8134 certification cycle work?', a: 'New Zealand rest homes undergo certification audits by Designated Auditing Agencies on a 3-year cycle. Facilities must demonstrate continuous compliance with NZS 8134 standards between audits. AlwaysReady Care helps maintain audit-readiness throughout the cycle.' },
    { q: 'Is this rest home software free?', a: 'AlwaysReady Care is free to start with full evidence capture, compliance tracking, and audit pack generation. Pro plans with advanced features start from NZ$99 per facility per month.' }
  ],
  ie: [
    { q: 'What is HIQA compliance software?', a: 'HIQA compliance software helps Irish nursing homes capture, organise, and export evidence that proves they meet the National Standards for Residential Care Settings across 8 themes. AlwaysReady Care tracks 20 categories in under 60 seconds per record.' },
    { q: 'How do I prepare for a HIQA inspection?', a: 'Preparing for a HIQA inspection requires continuous evidence collection across areas like person-centred care, safe services, and governance. AlwaysReady Care tracks 20 categories mapped to the National Standards, showing your readiness score in real-time.' },
    { q: 'What is the best nursing home software Ireland?', a: 'For compliance evidence specifically, AlwaysReady Care works alongside any existing system as a dedicated evidence layer — no rip-and-replace needed. It covers all 8 HIQA National Standards themes.' },
    { q: 'What triggers a HIQA inspection?', a: 'HIQA inspections can be triggered by complaints, notifiable incidents, risk assessments, or routine scheduling. Having continuous, well-structured evidence ensures your designated centre is ready whenever an inspection happens.' },
    { q: 'Is this nursing home software free?', a: 'AlwaysReady Care is free to start with full evidence capture, compliance tracking, and inspection pack generation. Pro plans with advanced features start from €89 per centre per month.' }
  ]
};

// Inject region-specific FAQ schema into page head
function injectRegionalFAQSchema() {
  var regionCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
  var faqs = LANDING_FAQS[regionCode] || LANDING_FAQS.uk;

  // Remove existing FAQ schema
  var existing = document.querySelector('script[type="application/ld+json"]');
  var scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach(function(s) {
    try {
      var data = JSON.parse(s.textContent);
      if (data['@type'] === 'FAQPage') s.remove();
    } catch (e) {}
  });

  // Inject new FAQ schema
  var schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(function(f) {
      return { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } };
    })
  };
  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

// Localise landing page based on detected/selected region
function localiseLandingPage() {
  var regionCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
  var L = LANDING_CONTENT[regionCode] || LANDING_CONTENT.uk;
  var R = ActiveRegion;

  // Helper
  function setText(sel, text) { var el = document.querySelector(sel); if (el) el.textContent = text; }
  function setHtml(sel, html) { var el = document.querySelector(sel); if (el) el.innerHTML = html; }

  // Problem banner
  var problemBanner = document.querySelector('.landing-problem-banner');
  if (problemBanner && regionCode !== 'uk') {
    var inspectorTerms = { au: 'assessor', nz: 'auditor', ie: 'inspector' };
    var ps = problemBanner.querySelectorAll('p');
    if (ps.length >= 2) {
      ps[0].textContent = 'You provide great care. Can you prove it when the ' + inspectorTerms[regionCode] + ' arrives?';
      ps[1].innerHTML = 'Evidence scattered everywhere. Hours pulling records together. <span style="color:var(--heading);font-weight:500;">See how we fix that \u2193</span>';
    }
  }

  // Hero
  setText('.landing-badge', '');
  setHtml('.landing-badge', '<i class="fas fa-shield-heart"></i> ' + L.badge);
  setText('.landing-h1', L.h1);
  setText('.landing-hero-sub', L.heroSub);

  // Trust badges
  var trustSpans = document.querySelectorAll('.landing-trust span');
  if (trustSpans.length >= 5) {
    trustSpans[2].innerHTML = '<i class="fas fa-check-circle"></i> ' + L.trustGdpr;
    trustSpans[4].innerHTML = '<i class="fas fa-check-circle"></i> ' + L.trustReg;
  }

  // Feature section title
  var featuresTitle = document.getElementById('features-title');
  if (featuresTitle) {
    var facilityTerms = { uk: 'Care Home', au: 'Aged Care', nz: 'Rest Home', ie: 'Nursing Home' };
    featuresTitle.textContent = 'How This ' + (facilityTerms[regionCode] || 'Care Home') + ' Software Works';
  }

  // Feature cards
  setText('.landing-features .landing-section-sub', L.workflowSub);
  var featureCards = document.querySelectorAll('.landing-feature-card');
  if (featureCards.length >= 5) {
    featureCards[3].querySelector('h3').textContent = L.featDashTitle;
    featureCards[3].querySelector('p').textContent = L.featDashDesc;
    featureCards[4].querySelector('p').textContent = L.featPackDesc;
  }

  // Pain points subtitle
  var painSub = document.getElementById('pain-subtitle');
  if (painSub) {
    var managerTerms = { uk: 'care home managers', au: 'aged care facility managers', nz: 'rest home managers', ie: 'nursing home managers' };
    painSub.textContent = 'The top 5 compliance frustrations ' + (managerTerms[regionCode] || managerTerms.uk) + ' face every day';
  }

  // Pain points
  var painCards = document.querySelectorAll('.landing-pain-card p');
  if (painCards.length >= 4) {
    painCards[0].textContent = L.painEvidence;
    painCards[1].textContent = L.painAudit;
    painCards[2].textContent = L.painRecords;
    painCards[3].textContent = L.painInspection;
  }

  // Audience
  setText('.landing-audience .landing-section-title', L.audienceTitle);
  var audienceCards = document.querySelectorAll('.landing-audience-card p');
  if (audienceCards.length >= 3) audienceCards[2].textContent = L.audienceManager;

  // Framework section
  setText('.landing-cqc .landing-section-title', L.frameworkTitle);
  setText('.landing-cqc .landing-section-sub', L.frameworkSub);
  // Rebuild framework cards from ActiveRegion.framework
  var cqcGrid = document.querySelector('.landing-cqc-grid');
  if (cqcGrid) {
    cqcGrid.innerHTML = '';
    Object.keys(R.framework).forEach(function(key) {
      var card = document.createElement('div');
      card.className = 'landing-cqc-card';
      card.innerHTML = '<strong>' + key + '</strong><span>' + R.framework[key].join(', ') + '</span>';
      cqcGrid.appendChild(card);
    });
  }

  // Regulatory section
  setText('.landing-regs .landing-section-title', L.regsTitle);
  setText('.landing-regs .landing-section-sub', L.regsSub);
  var regsGrid = document.querySelector('.landing-regs-grid');
  if (regsGrid) {
    regsGrid.innerHTML = '';
    L.regsItems.forEach(function(item) {
      var div = document.createElement('div');
      div.className = 'landing-reg-item';
      div.innerHTML = '<strong>' + item.code + '</strong> ' + item.label;
      regsGrid.appendChild(div);
    });
  }
  setText('.landing-regs-note', L.regsNote);

  // Social proof
  setText('.landing-proof .landing-section-title', L.proofTitle);
  var proofItems = document.querySelectorAll('.landing-proof-item');
  if (proofItems.length >= 4) {
    proofItems[2].querySelector('.landing-proof-num').textContent = L.proofCategories;
    proofItems[2].querySelector('span:last-child').textContent = L.proofCatLabel;
    proofItems[3].querySelector('.landing-proof-num').textContent = L.proofQuestions;
    proofItems[3].querySelector('span:last-child').textContent = L.proofQLabel;
  }

  // Pricing
  var priceFreeEl = document.querySelector('.pricing-card:first-child .pricing-amount');
  var priceProEl = document.querySelector('.pricing-featured .pricing-amount');
  if (priceFreeEl) priceFreeEl.textContent = L.priceFree;
  if (priceProEl) priceProEl.textContent = L.pricePro;
  var priceUnits = document.querySelectorAll('.pricing-period');
  priceUnits.forEach(function(el) { el.textContent = L.priceUnit; });
  // Pro feature line
  var proFeatures = document.querySelectorAll('.pricing-featured .pricing-features li');
  if (proFeatures.length >= 7) proFeatures[6].innerHTML = '<i class="fas fa-check"></i> ' + L.proCatFeature;

  // Lead / newsletter
  setText('.landing-lead .landing-section-sub', L.leadSub);
  setText('.lead-note', L.leadNote);

  // Footer
  var footerP = document.querySelector('.landing-footer > p:first-child');
  if (footerP) footerP.innerHTML = '<strong>AlwaysReady Care</strong> — ' + L.footerDesc;
  setText('.landing-footer-copy', L.footerGdpr);

  // Update WhatsApp links with region-appropriate message
  var waMessages = {
    uk: 'Hi, I run a care home and need help with CQC compliance.',
    au: 'Hi, I run an aged care facility in Australia and need help with ACQS compliance.',
    nz: 'Hi, I run a rest home in New Zealand and need help with NZS 8134 compliance.',
    ie: 'Hi, I run a nursing home in Ireland and need help with HIQA compliance.'
  };
  var waMsg = encodeURIComponent(waMessages[regionCode] || waMessages.uk);
  var waBase = 'https://wa.me/447490356046?text=' + waMsg;
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) { a.href = waBase; });

  // Update footer compatibility text per region
  var footerCompat = document.querySelector('.landing-footer > p:nth-child(2)');
  if (footerCompat && regionCode !== 'uk') {
    var compatTexts = {
      au: 'Works alongside AlayaCare, Statura Care, MYP, Willow, FlowLogic, and any care management system. Not a replacement — a compliance evidence layer on top.',
      nz: 'Works alongside VCare, Hercules Health, and any care management system. Not a replacement — a compliance evidence layer on top.',
      ie: 'Works alongside any care management system in Ireland. Not a replacement — a compliance evidence layer on top.'
    };
    if (compatTexts[regionCode]) footerCompat.textContent = compatTexts[regionCode];
  }

  // Inject region-specific FAQ schema
  injectRegionalFAQSchema();

  // Update SoftwareApplication schema for region
  if (regionCode !== 'uk') {
    var appSchemas = document.querySelectorAll('script[type="application/ld+json"]');
    appSchemas.forEach(function(s) {
      try {
        var data = JSON.parse(s.textContent);
        if (data['@type'] === 'SoftwareApplication') {
          data.description = 'Free ' + L.facilityTerm + ' compliance software for ' + R.name + ' care providers. Record ' + R.regulatorShort + '-ready evidence in 60 seconds, track compliance across ' + R.categories.length + ' categories, generate ' + R.packLabel.toLowerCase() + 's instantly.';
          data.offers.priceCurrency = { au: 'AUD', nz: 'NZD', ie: 'EUR' }[regionCode] || 'GBP';
          data.offers.description = 'Free to start. Pro plans from ' + L.pricePro + '/month per ' + L.facilityTerm + '.';
          s.textContent = JSON.stringify(data);
        }
      } catch (e) {}
    });
  }

  // Update meta tags for SEO
  var titleEl = document.querySelector('title');
  if (titleEl && regionCode !== 'uk') {
    var titles = {
      au: 'Aged Care Compliance Software Australia — Free ACQS Evidence Tool | AlwaysReady Care',
      nz: 'Rest Home Compliance Software NZ — Free NZS 8134 Audit Tool | AlwaysReady Care',
      ie: 'Nursing Home Compliance Software Ireland — Free HIQA Evidence Tool | AlwaysReady Care'
    };
    if (titles[regionCode]) titleEl.textContent = titles[regionCode];
  }
  var descEl = document.querySelector('meta[name="description"]');
  if (descEl && regionCode !== 'uk') {
    var descs = {
      au: 'Free aged care software for Australian compliance. Record care evidence in 60 seconds, track ACQS readiness across 24 categories, generate assessment packs instantly.',
      nz: 'Free rest home software for NZ compliance. Record care evidence in 60 seconds, track NZS 8134 readiness across 20 categories, generate audit packs instantly.',
      ie: 'Free nursing home software for Irish compliance. Record care evidence in 60 seconds, track HIQA readiness across 20 categories, generate inspection packs instantly.'
    };
    if (descs[regionCode]) descEl.setAttribute('content', descs[regionCode]);
  }
}

// Localise in-app labels (after login, when region is known)
function localiseAppShell() {
  var regionCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
  var R = ActiveRegion;

  // Dashboard subtitle
  var dashSub = document.querySelector('#view-dashboard .view-subtitle');
  if (dashSub) dashSub.textContent = 'Your ' + R.readinessLabel.toLowerCase() + ' at a glance';

  // Compliance view subtitle
  var compSub = document.getElementById('compliance-subtitle');
  if (compSub) compSub.textContent = 'Your ' + R.readinessLabel.toLowerCase() + ' at a glance';

  // Inspection pack title + subtitle
  var packsTitle = document.getElementById('packs-title');
  if (packsTitle) packsTitle.textContent = R.packLabel;
  var packsSub = document.getElementById('packs-subtitle');
  if (packsSub) packsSub.textContent = 'Generate evidence packs for ' + R.inspectionLabel.toLowerCase() + 's';

  // Admin subtitle & labels
  var adminSub = document.querySelector('#view-admin .view-subtitle');
  if (adminSub) adminSub.textContent = 'Add staff, assign roles, manage your ' + (LANDING_CONTENT[regionCode] || LANDING_CONTENT.uk).facilityTerm;

  var homeSettingsTitle = document.querySelector('#view-admin .section-title');
  if (homeSettingsTitle && homeSettingsTitle.textContent.indexOf('Care Home') !== -1) {
    var facilityName = { uk: 'Care Home', au: 'Facility', nz: 'Rest Home', ie: 'Nursing Home' };
    homeSettingsTitle.innerHTML = '<i class="fas fa-building"></i> ' + (facilityName[regionCode] || 'Care Home') + ' Settings';
  }

  var homeNameInput = document.getElementById('input-home-name');
  if (homeNameInput) {
    var placeholders = { uk: 'Enter your care home name', au: 'Enter your facility name', nz: 'Enter your rest home name', ie: 'Enter your nursing home name' };
    homeNameInput.placeholder = placeholders[regionCode] || placeholders.uk;
  }

  // In-app help text
  var helpText = document.querySelector('.help-text');
  if (helpText) {
    var helpTexts = {
      uk: 'AlwaysReady Care is a simple tool that helps care homes record and organise evidence of the care they provide. It keeps all your records in one place so you are always ready if CQC comes to inspect. Everything runs in your browser and your data stays private.',
      au: 'AlwaysReady Care is a simple tool that helps aged care facilities record and organise evidence of the care they provide. It keeps all your records in one place so you are always ready for quality assessments. Everything runs in your browser and your data stays private.',
      nz: 'AlwaysReady Care is a simple tool that helps rest homes record and organise evidence of the care they provide. It keeps all your records in one place so you are always ready for certification audits. Everything runs in your browser and your data stays private.',
      ie: 'AlwaysReady Care is a simple tool that helps nursing homes record and organise evidence of the care they provide. It keeps all your records in one place so you are always ready if HIQA comes to inspect. Everything runs in your browser and your data stays private.'
    };
    helpText.textContent = helpTexts[regionCode] || helpTexts.uk;
  }

  // In-app FAQ answers
  var faqAnswers = document.querySelectorAll('.faq-answer');
  faqAnswers.forEach(function(el) {
    if (regionCode !== 'uk') {
      var text = el.textContent;
      text = text.replace(/CQC evidence categories/g, R.regulatorShort + ' compliance categories');
      text = text.replace(/CQC/g, R.regulatorShort);
      text = text.replace(/care home/gi, (LANDING_CONTENT[regionCode] || LANDING_CONTENT.uk).facilityTerm);
      el.textContent = text;
    }
  });

  // In-app trust strip
  var trustPrivacy = document.getElementById('trust-privacy');
  var trustFramework = document.getElementById('trust-framework');
  if (trustPrivacy) {
    var privacyLabels = { uk: 'UK GDPR Compliant', au: 'Privacy Act 1988 Compliant', nz: 'Privacy Act 2020 Compliant', ie: 'GDPR Compliant' };
    trustPrivacy.textContent = privacyLabels[regionCode] || privacyLabels.uk;
  }
  if (trustFramework) {
    trustFramework.textContent = R.regulatorShort + ' Framework';
  }

  // Sidebar sales contact
  var salesLink = document.getElementById('sidebar-contact-sales');
  if (salesLink) {
    var salesMsgs = {
      uk: 'Hi, I tried the demo and want to learn more about CQC compliance.',
      au: 'Hi, I tried the demo and want to learn more about ACQS compliance for our aged care facility.',
      nz: 'Hi, I tried the demo and want to learn more about NZS 8134 compliance for our rest home.',
      ie: 'Hi, I tried the demo and want to learn more about HIQA compliance for our nursing home.'
    };
    salesLink.href = 'https://wa.me/447490356046?text=' + encodeURIComponent(salesMsgs[regionCode] || salesMsgs.uk);
  }

  // Sidebar nav label
  var navPacksLabel = document.getElementById('nav-packs-label');
  if (navPacksLabel) navPacksLabel.textContent = R.packLabel;

  // Refresh onboarding steps
  ONBOARDING_STEPS = getOnboardingSteps();

  // Update guide links with region param
  document.querySelectorAll('a[href*="guide.html"]').forEach(function(a) {
    a.href = 'guide.html' + (regionCode !== 'uk' ? '?region=' + regionCode : '');
  });

  // Re-render templates for region
  renderTemplateList();
}

// Backwards-compatible aliases (existing code references these)
var COMPLIANCE_CATEGORIES = REGION_CONFIGS.uk.categories;
var CQC_KEY_QUESTIONS = REGION_CONFIGS.uk.framework;

// Update aliases when region changes
function updateComplianceAliases() {
  COMPLIANCE_CATEGORIES = ActiveRegion.categories;
  CQC_KEY_QUESTIONS = ActiveRegion.framework;
}

// ── AI Analysis Engine (rule-based) ────────────────────────
var AIEngine = {
  tagKeywords: {
    'medication': ['medication', 'medicine', 'drug', 'dosage', 'prescribed', 'tablet', 'pills', 'administered', 'dose', 'pharmacy'],
    'personal-care': ['personal care', 'washing', 'bathing', 'hygiene', 'dressing', 'grooming', 'toileting', 'continence'],
    'nutrition': ['meal', 'food', 'eating', 'diet', 'nutrition', 'hydration', 'fluid', 'drink', 'breakfast', 'lunch', 'dinner', 'snack'],
    'mobility': ['mobility', 'walking', 'transfer', 'wheelchair', 'hoist', 'standing', 'balance', 'physiotherapy'],
    'skin-care': ['skin', 'wound', 'dressing', 'pressure', 'sore', 'bruise', 'rash', 'cream', 'ointment'],
    'mental-health': ['mood', 'anxiety', 'depression', 'confusion', 'agitation', 'behaviour', 'emotional', 'wellbeing', 'mental'],
    'social': ['activity', 'social', 'engage', 'participation', 'group', 'visit', 'family', 'recreation', 'conversation'],
    'safety': ['safety', 'risk', 'hazard', 'fire', 'emergency', 'alarm', 'check', 'inspection'],
    'infection-control': ['infection', 'hygiene', 'PPE', 'handwashing', 'isolation', 'outbreak', 'cleaning', 'sanitise'],
    'safeguarding': ['safeguarding', 'abuse', 'neglect', 'allegation', 'disclosure', 'referral', 'protection', 'vulnerable', 'concern'],
    'risk-assessment': ['risk', 'assessment', 'hazard', 'mitigation', 'prevention', 'likelihood'],
    'infection-control': ['infection', 'hygiene', 'handwashing', 'PPE', 'outbreak', 'isolation', 'clean', 'sanitise'],
    'health-monitoring': ['blood pressure', 'temperature', 'pulse', 'oxygen', 'weight', 'GP', 'hospital', 'appointment', 'vital signs'],
    'mental-capacity': ['capacity', 'consent', 'best interests', 'DoLS', 'deprivation', 'MCA', 'decision', 'advocate'],
    'complaints': ['complaint', 'feedback', 'concern raised', 'response', 'investigation', 'resolution'],
    'staff-training': ['training', 'supervision', 'competency', 'NVQ', 'diploma', 'mandatory', 'induction', 'certificate'],
    'governance': ['audit', 'quality', 'governance', 'policy', 'procedure', 'review', 'compliance check', 'improvement'],
    'night-care': ['night', 'overnight', 'sleep', 'check', 'repositioned', 'nocturnal'],
    'end-of-life': ['palliative', 'end of life', 'DNAR', 'advance', 'preferred place', 'comfort', 'bereavement'],
    'duty-of-candour': ['candour', 'duty', 'open', 'transparent', 'apology', 'notification']
  },

  riskKeywords: ['fall', 'fell', 'injury', 'injured', 'bruise', 'bruising', 'bleeding', 'bleed', 'error', 'mistake', 'missing', 'absent', 'choking', 'choke', 'unconscious', 'unresponsive', 'aggressive', 'aggression', 'abuse', 'safeguarding', 'ambulance', 'hospital', 'emergency', 'death', 'deceased', 'fracture', 'broken'],

  analyze: function(text) {
    if (!text || text.trim().length < 10) {
      return { summary: 'Insufficient text for analysis.', tags: [], risks: [], actions: [], riskLevel: 'low' };
    }

    var lower = text.toLowerCase();
    var words = lower.split(/\s+/);

    // Extract tags
    var tags = [];
    var self = this;
    Object.keys(self.tagKeywords).forEach(function(tag) {
      var keywords = self.tagKeywords[tag];
      for (var i = 0; i < keywords.length; i++) {
        if (lower.indexOf(keywords[i]) !== -1) {
          tags.push(tag);
          break;
        }
      }
    });

    // Detect risks
    var risks = [];
    self.riskKeywords.forEach(function(keyword) {
      if (lower.indexOf(keyword) !== -1) {
        risks.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    // Risk level
    var riskLevel = 'low';
    if (risks.length >= 3) riskLevel = 'high';
    else if (risks.length >= 1) riskLevel = 'medium';

    // Generate summary
    var sentences = text.split(/[.!?]+/).filter(function(s) { return s.trim().length > 10; });
    var summary = sentences.length > 0 ? sentences[0].trim() + '.' : text.substring(0, 120) + '...';

    // Suggest actions
    var actions = [];
    if (risks.indexOf('Fall') !== -1 || risks.indexOf('Fell') !== -1) {
      actions.push('Complete falls risk assessment');
      actions.push('Review mobility care plan');
      actions.push('Document post-fall neurological observations');
    }
    if (risks.indexOf('Injury') !== -1 || risks.indexOf('Injured') !== -1 || risks.indexOf('Bruise') !== -1 || risks.indexOf('Bruising') !== -1) {
      actions.push('Photograph injury and record body map');
      actions.push('Notify GP if medical attention required');
    }
    if (risks.indexOf('Abuse') !== -1 || risks.indexOf('Safeguarding') !== -1) {
      actions.push('Raise safeguarding alert immediately');
      var regionCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
      var safeguardingActions = {
        uk: 'Notify registered manager and local authority',
        au: 'Notify facility manager and report via SIRS if applicable',
        nz: 'Notify facility manager and contact relevant authorities',
        ie: 'Notify person in charge and notify HIQA if required'
      };
      actions.push(safeguardingActions[regionCode] || safeguardingActions.uk);
      actions.push('Preserve any evidence and document timeline');
    }
    if (risks.indexOf('Error') !== -1 || risks.indexOf('Mistake') !== -1) {
      actions.push('Complete incident report form');
      actions.push('Review and update relevant procedures');
    }
    if (risks.indexOf('Choking') !== -1 || risks.indexOf('Choke') !== -1) {
      actions.push('Review SALT recommendations');
      actions.push('Update dietary care plan');
    }
    if (risks.indexOf('Emergency') !== -1 || risks.indexOf('Ambulance') !== -1 || risks.indexOf('Hospital') !== -1) {
      actions.push('Record all observations and vital signs');
      actions.push('Notify next of kin');
    }
    // AU-specific: SIRS reporting trigger
    var rCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
    if (rCode === 'au' && (riskLevel === 'high' || risks.indexOf('Abuse') !== -1 || risks.indexOf('Death') !== -1 || risks.indexOf('Deceased') !== -1)) {
      actions.push('Assess if SIRS Priority 1 reportable (24-hour deadline)');
    } else if (rCode === 'au' && riskLevel === 'medium') {
      actions.push('Assess if SIRS Priority 2 reportable (30-day deadline)');
    }

    if (actions.length === 0 && tags.length > 0) {
      actions.push('File under relevant care plan section');
      actions.push('Review at next care plan update');
    }

    return { summary: summary, tags: tags, risks: risks, actions: actions, riskLevel: riskLevel };
  }
};

// ── Utility Functions ──────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(ts) {
  if (!ts) return 'N/A';
  var d;
  if (ts.toDate) d = ts.toDate();
  else if (ts instanceof Date) d = ts;
  else d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(ts) {
  if (!ts) return 'N/A';
  var d;
  if (ts.toDate) d = ts.toDate();
  else if (ts instanceof Date) d = ts;
  else d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function todayStart() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  var d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Toast Notifications ────────────────────────────────────
function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) return;
  var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<i class="fas ' + escapeHtml(icons[type] || icons.info) + '"></i> ' + escapeHtml(message);
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('removing');
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 3000);
}

// ── Theme System ───────────────────────────────────────────
function getTheme() {
  return localStorage.getItem('arc-theme') || 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('arc-theme', theme);
  updateThemeUI(theme);
  // Update PWA status bar color
  var themeColor = theme === 'dark' ? '#12151A' : '#F4F5F5';
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', themeColor);
}

function updateThemeUI(theme) {
  var iconEl = document.getElementById('icon-theme');
  var labelEl = document.getElementById('label-theme');
  var loginBtn = document.getElementById('btn-theme-login');

  if (iconEl) {
    iconEl.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }
  if (labelEl) {
    labelEl.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
  }
  if (loginBtn) {
    loginBtn.querySelector('i').className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }

  // Profile theme buttons
  var darkBtn = document.getElementById('btn-theme-dark');
  var lightBtn = document.getElementById('btn-theme-light');
  if (darkBtn && lightBtn) {
    darkBtn.classList.toggle('active', theme === 'dark');
    lightBtn.classList.toggle('active', theme === 'light');
  }
}

function toggleTheme() {
  var current = getTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
}

// ── Router / Navigation ────────────────────────────────────
function navigate(viewName) {
  // Hide all views
  var views = document.querySelectorAll('[data-view]');
  views.forEach(function(v) {
    if (v.id !== 'view-login') {
      v.classList.add('hidden');
    }
  });

  // Show target view
  var target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.remove('hidden');
  }

  // Update sidebar active state
  var navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(function(link) {
    link.classList.remove('active');
    if (link.getAttribute('data-nav') === viewName) {
      link.classList.add('active');
    }
  });

  // Update topbar title
  var titles = {
    dashboard: 'Dashboard',
    capture: 'Record Evidence',
    review: 'Review Evidence',
    compliance: 'Compliance',
    actions: 'Actions',
    packs: 'Inspection Packs',
    admin: 'Team Management',
    help: 'Help & FAQ',
    profile: 'Profile & Settings'
  };
  var topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = titles[viewName] || 'Dashboard';

  // Update hash
  window.location.hash = viewName;

  // Close mobile sidebar
  closeSidebar();

  // Store current view
  AppState.currentView = viewName;
  updateFloatingCTA();

  // Load view-specific data
  loadViewData(viewName);
}

function loadViewData(viewName) {
  if (viewName === 'dashboard') loadDashboard();
  else if (viewName === 'capture') loadCapture();
  else if (viewName === 'review') loadReview();
  else if (viewName === 'compliance') loadCompliance();
  else if (viewName === 'actions') loadActions();
  else if (viewName === 'packs') loadPacks();
  else if (viewName === 'admin') loadAdmin();
  else if (viewName === 'help') { /* static content, no data load needed */ }
  else if (viewName === 'profile') loadProfile();
}

// ── Sidebar Toggle ─────────────────────────────────────────
function openSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// ── Update Sidebar Visibility by Role ──────────────────────
function updateSidebarForRole(role) {
  var reviewItems = document.querySelectorAll('[data-requires="review"]');
  var complianceItems = document.querySelectorAll('[data-requires="compliance"]');
  var packsItems = document.querySelectorAll('[data-requires="packs"]');

  reviewItems.forEach(function(el) {
    el.style.display = Permissions.canReview(role) ? '' : 'none';
  });
  complianceItems.forEach(function(el) {
    el.style.display = Permissions.canViewCompliance(role) ? '' : 'none';
  });
  packsItems.forEach(function(el) {
    el.style.display = Permissions.canGeneratePacks(role) ? '' : 'none';
  });

  // Reviews stat card
  var reviewsStat = document.getElementById('stat-reviews');
  if (reviewsStat) {
    reviewsStat.style.display = Permissions.canReview(role) ? '' : 'none';
  }

  // Admin items
  var adminItems = document.querySelectorAll('[data-requires="admin"]');
  adminItems.forEach(function(el) {
    el.style.display = Permissions.canManageTeam(role) ? '' : 'none';
  });

  // Quick action review card
  var qaReview = document.getElementById('qa-review');
  if (qaReview) {
    qaReview.style.display = Permissions.canReview(role) ? '' : 'none';
  }

  // Update role badge
  var roleBadge = document.getElementById('user-role');
  if (roleBadge) roleBadge.textContent = role;
}

// ── Auth State Observer ────────────────────────────────────
auth.onAuthStateChanged(function(user) {
  if (user) {
    AppState.user = user;
    onUserSignedIn(user);
  } else {
    AppState.user = null;
    showLogin();
  }
});

function showLogin() {
  cleanupListeners();
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  AppState.currentView = 'login';
}

function showApp() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  // Navigate to hash or dashboard
  var hash = window.location.hash.replace('#', '');
  var validViews = ['dashboard', 'capture', 'review', 'compliance', 'actions', 'packs', 'admin', 'help', 'profile'];
  if (hash && validViews.indexOf(hash) !== -1) {
    navigate(hash);
  } else {
    navigate('dashboard');
  }
}

async function onUserSignedIn(user) {
  try {
    // Determine orgId
    var orgId = 'org_' + user.uid.substring(0, 12);
    AppState.orgId = orgId;

    // Check if user doc exists
    var userDoc = await db.collection('orgs').doc(orgId).collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      // First time — seed demo data
      await initNewOrg(user, orgId);
      // Re-read
      userDoc = await db.collection('orgs').doc(orgId).collection('users').doc(user.uid).get();
    }

    if (userDoc.exists) {
      AppState.userData = userDoc.data();
      AppState.userRole = userDoc.data().role || 'manager';
      AppState.siteId = userDoc.data().siteIds ? userDoc.data().siteIds[0] : null;
    } else {
      AppState.userRole = 'manager';
    }

    // Load sites
    await loadSites();

    // Load region config from org
    await loadRegionFromOrg();
    updateComplianceAliases();
    localiseAppShell();

    // Update UI
    updateUserUI(user);
    updateSidebarForRole(AppState.userRole);
    showApp();
    showOnboarding();
    setupRealtimeListeners();

  } catch (err) {
    console.error('Sign in setup failed:', err);
    showToast('Setup error: ' + err.message, 'error');
    // Still show app with defaults
    updateUserUI(user);
    updateSidebarForRole('manager');
    showApp();
    showOnboarding();
  }
}

function updateUserUI(user) {
  var name = user.displayName || user.email || 'Guest User';
  if (user.isAnonymous) name = 'Guest (Demo)';

  var nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = name;

  // Avatar with photo
  var avatarEl = document.getElementById('user-avatar');
  if (avatarEl) {
    if (user.photoURL) {
      avatarEl.innerHTML = '<img src="' + escapeHtml(user.photoURL) + '" alt="Avatar">';
    } else {
      avatarEl.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
  }

  // Load and display org name on dashboard
  loadOrgName();

  updateSidebarForRole(AppState.userRole);
}

// ── Load Sites ─────────────────────────────────────────────
async function loadSites() {
  if (!AppState.orgId) return;
  try {
    var snap = await db.collection('orgs').doc(AppState.orgId).collection('sites').get();
    AppState.sites = [];
    snap.forEach(function(doc) {
      AppState.sites.push({ id: doc.id, name: doc.data().name });
    });
    if (AppState.sites.length > 0 && !AppState.siteId) {
      AppState.siteId = AppState.sites[0].id;
    }
  } catch (err) {
    console.error('Failed to load sites:', err);
  }
}

function populateSiteDropdowns() {
  var selectors = [document.getElementById('select-site'), document.getElementById('select-profile-site')];
  selectors.forEach(function(sel) {
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = '<option value="">Select a site...</option>';
    AppState.sites.forEach(function(site) {
      var opt = document.createElement('option');
      opt.value = site.id;
      opt.textContent = site.name;
      sel.appendChild(opt);
    });
    if (AppState.siteId) sel.value = AppState.siteId;
    else if (current) sel.value = current;
  });
}

// ── Demo Data Seeding ──────────────────────────────────────
async function initNewOrg(user, orgId) {
  var batch = db.batch();
  var now = firebase.firestore.Timestamp.now();

  // Detect region for new org
  var detectedRegion = detectRegionFromTimezone();
  var sampleAddresses = {
    uk: '42 Maple Drive, Bristol, BS1 4QR',
    au: '15 Wattle Street, Melbourne, VIC 3000',
    nz: '8 Kauri Lane, Auckland 1010',
    ie: '12 Liffey Road, Dublin, D01 X2Y3'
  };

  // Org doc — blank name, user sets it in Team Management
  batch.set(db.collection('orgs').doc(orgId), {
    name: '',
    region: detectedRegion,
    createdAt: now,
    ownerUid: user.uid
  });

  // Site — blank name, user sets it in Team Management
  var siteRef = db.collection('orgs').doc(orgId).collection('sites').doc('site_main');
  batch.set(siteRef, {
    name: 'Main Site',
    address: sampleAddresses[detectedRegion] || sampleAddresses.uk,
    createdAt: now
  });

  // User
  var displayName = user.displayName || user.email || 'Guest User';
  if (user.isAnonymous) displayName = 'Guest (Demo)';
  // Demo users get admin role so they can test ALL features
  var demoRole = user.isAnonymous ? 'admin' : 'manager';
  batch.set(db.collection('orgs').doc(orgId).collection('users').doc(user.uid), {
    name: displayName,
    email: user.email || '',
    role: demoRole,
    siteIds: ['site_main'],
    createdAt: now
  });

  // Compliance categories config
  batch.set(db.collection('orgs').doc(orgId).collection('config').doc('categories'), {
    required: COMPLIANCE_CATEGORIES,
    updatedAt: now
  });

  await batch.commit();
  AppState.siteId = 'site_main';

  // For demo/guest users: seed sample evidence so dashboard isn't empty
  if (user.isAnonymous) {
    await seedDemoEvidence(orgId, user, detectedRegion);
  }
}

// Sample evidence for demo mode — shows dashboard working immediately
async function seedDemoEvidence(orgId, user, region) {
  var R = REGION_CONFIGS[region] || REGION_CONFIGS.uk;
  var cats = R.categories;
  var batch = db.batch();
  var evCol = db.collection('orgs').doc(orgId).collection('evidence');
  var now = new Date();

  // Create 8 sample evidence records across different categories (some approved, some pending)
  var samples = [
    {
      type: 'text', status: 'approved',
      rawText: 'Medication administered to Mrs. Johnson at 08:15. Paracetamol 500mg (2 tablets) given orally with water. Resident alert and cooperative. No adverse reactions. Witnessed by Sarah.',
      manualTags: ['medication'], riskLevel: 'low',
      daysAgo: 1
    },
    {
      type: 'text', status: 'approved',
      rawText: 'Personal care provided to Mr. Davies at 07:30. Assisted with morning wash, oral hygiene, and dressing. Skin integrity checked — small redness noted on left heel, cream applied. Resident chose own clothing. Dignity maintained throughout.',
      manualTags: ['personal-care', 'skin-care'], riskLevel: 'low',
      daysAgo: 1
    },
    {
      type: 'text', status: 'approved',
      rawText: 'Lunch served to Mrs. Chen at 12:30. Soft diet as per care plan. Consumed most of main course (fish pie) and full dessert. Fluid intake: 200ml water, 150ml juice. Sat in dining room with other residents. Mood cheerful.',
      manualTags: ['nutrition'], riskLevel: 'low',
      daysAgo: 2
    },
    {
      type: 'incident', status: 'approved',
      rawText: 'INCIDENT: Mr. Thompson found on floor beside bed at 23:45. No visible injuries. Helped back to bed. Vital signs normal. GP not called — resident declined. Falls risk assessment updated. Family notified 08:00 next day.',
      manualTags: ['safety', 'risk-assessment'], riskLevel: 'medium',
      daysAgo: 3
    },
    {
      type: 'text', status: 'submitted',
      rawText: 'Night check completed at 02:00. All residents checked. Mrs. Johnson sleeping well. Mr. Davies repositioned — no skin concerns. Mr. Thompson sleeping after earlier fall — checked every 30 minutes as per updated care plan.',
      manualTags: ['night-care'], riskLevel: 'low',
      daysAgo: 1
    },
    {
      type: 'text', status: 'approved',
      rawText: 'Staff supervision session with Nurse Sarah completed. Discussed recent safeguarding training, medication round audit results (98% accuracy), and upcoming mandatory training due dates. Sarah flagged staffing concern on weekends — escalated to manager.',
      manualTags: ['staff-training', 'governance'], riskLevel: 'low',
      daysAgo: 5
    },
    {
      type: 'text', status: 'submitted',
      rawText: 'Activity session: Music therapy group at 14:00. Six residents participated. Mrs. Chen sang along to familiar songs — strong engagement. Mr. Thompson observed but smiled. Session lasted 45 minutes. Wellbeing scores recorded.',
      manualTags: ['social'], riskLevel: 'low',
      daysAgo: 2
    },
    {
      type: 'text', status: 'approved',
      rawText: 'Infection control audit completed. Hand hygiene stations checked — all dispensers full. PPE stock adequate. Laundry procedure reviewed with staff. No outbreak concerns. Monthly cleaning schedule up to date.',
      manualTags: ['infection-control'], riskLevel: 'low',
      daysAgo: 7
    },
    {
      type: 'text', status: 'approved',
      rawText: 'Health monitoring: Blood pressure check for Mrs. Johnson — 130/85 mmHg. Pulse 72 bpm, oxygen 97%. Weight stable at 68kg. GP appointment scheduled for annual medication review next week.',
      manualTags: ['health-monitoring'], riskLevel: 'low',
      daysAgo: 3
    },
    {
      type: 'text', status: 'approved',
      rawText: 'Complaint received from family of Mr. Davies regarding laundry mix-up. Clean clothing belonging to another resident was placed in his wardrobe. Apology given, laundry team briefed. New labelling procedure implemented. Family satisfied with response.',
      manualTags: ['complaints', 'duty-of-candour'], riskLevel: 'low',
      daysAgo: 6
    },
    {
      type: 'text', status: 'approved',
      rawText: 'End of life care planning meeting held with Mrs. Williams and her daughter. Advance care preferences discussed and documented. DNAR form completed with GP. Preferred place of death confirmed as the facility. Palliative care team notified.',
      manualTags: ['end-of-life', 'mental-capacity'], riskLevel: 'low',
      daysAgo: 10
    },
    {
      type: 'text', status: 'submitted',
      rawText: 'Monthly governance review completed. Audit of medication administration records — 98.5% accuracy. 2 minor discrepancies identified and corrected. Risk register reviewed and updated. Next audit scheduled for 15th.',
      manualTags: ['governance', 'risk-assessment'], riskLevel: 'low',
      daysAgo: 4
    }
  ];

  samples.forEach(function(s, i) {
    var ref = evCol.doc('demo_' + i);
    var createdAt = new Date(now.getTime() - s.daysAgo * 24 * 60 * 60 * 1000);
    batch.set(ref, {
      type: s.type,
      rawText: s.rawText,
      status: s.status,
      manualTags: s.manualTags,
      riskLevel: s.riskLevel,
      region: region,
      complianceFramework: R.regulatorShort,
      siteId: 'site_main',
      createdByUid: user.uid,
      createdByName: 'Demo Staff',
      createdAt: firebase.firestore.Timestamp.fromDate(createdAt),
      reviewedByName: s.status === 'approved' ? 'Demo Manager' : '',
      reviewedAt: s.status === 'approved' ? firebase.firestore.Timestamp.fromDate(createdAt) : null
    });
  });

  // Add one follow-up action (from the fall incident)
  var actionRef = db.collection('orgs').doc(orgId).collection('actions').doc('demo_action_1');
  batch.set(actionRef, {
    title: 'Update falls risk assessment for Mr. Thompson',
    description: 'Following fall incident on ' + new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString() + '. Review mobility care plan and bed rail assessment.',
    priority: 'high',
    status: 'open',
    dueDate: firebase.firestore.Timestamp.fromDate(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)),
    evidenceId: 'demo_3',
    siteId: 'site_main',
    assignedTo: user.uid,
    createdAt: firebase.firestore.Timestamp.fromDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000))
  });

  await batch.commit();
}

// ── Realtime Listeners ─────────────────────────────────────
function setupRealtimeListeners() {
  cleanupListeners();
  if (!AppState.orgId) return;

  // Evidence listener
  var evidenceUnsub = db.collection('orgs').doc(AppState.orgId)
    .collection('evidence')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot(function(snap) {
      AppState.evidenceCache = [];
      snap.forEach(function(doc) {
        AppState.evidenceCache.push(Object.assign({ id: doc.id }, doc.data()));
      });
      if (AppState.currentView === 'dashboard') renderDashboardData();
      if (AppState.currentView === 'review') renderReviewList();
      if (AppState.currentView === 'compliance') renderComplianceData();
    }, function(err) {
      console.error('Evidence listener error:', err);
    });
  AppState.unsubscribers.push(evidenceUnsub);

  // Actions listener
  var actionsUnsub = db.collection('orgs').doc(AppState.orgId)
    .collection('actions')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot(function(snap) {
      AppState.actionsCache = [];
      snap.forEach(function(doc) {
        AppState.actionsCache.push(Object.assign({ id: doc.id }, doc.data()));
      });
      if (AppState.currentView === 'dashboard') renderDashboardData();
      if (AppState.currentView === 'actions') renderActionsList();
    }, function(err) {
      console.error('Actions listener error:', err);
    });
  AppState.unsubscribers.push(actionsUnsub);
}

function cleanupListeners() {
  AppState.unsubscribers.forEach(function(unsub) {
    if (typeof unsub === 'function') unsub();
  });
  AppState.unsubscribers = [];
}

// ── Audit Logging ──────────────────────────────────────────
function logAudit(action, details) {
  if (!AppState.orgId || !AppState.user) return;
  db.collection('orgs').doc(AppState.orgId).collection('auditLogs').add({
    action: action,
    details: details || '',
    userId: AppState.user.uid,
    userName: AppState.user.displayName || AppState.user.email || 'Guest',
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(err) { console.error('Audit log error:', err); });
}

// ======================================================================
//  VIEW: DASHBOARD
// ======================================================================
function loadDashboard() {
  var user = AppState.user;
  var welcome = document.getElementById('dashboard-welcome');
  if (welcome && user) {
    var name = user.displayName || 'there';
    if (user.isAnonymous) name = 'Guest';
    welcome.textContent = 'Welcome back, ' + name;
  }
  renderDashboardData();
}

function renderDashboardData() {
  var evidence = AppState.evidenceCache;
  var actions = AppState.actionsCache;
  var today = todayStart();

  // Stats
  var todayCount = evidence.filter(function(e) {
    var d = e.createdAt ? (e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt)) : new Date(0);
    return d >= today;
  }).length;
  var totalCount = evidence.length;
  var pendingActions = actions.filter(function(a) { return a.status !== 'completed'; }).length;
  var pendingReviews = evidence.filter(function(e) { return e.status === 'submitted'; }).length;

  var valToday = document.getElementById('val-today');
  var valTotal = document.getElementById('val-total');
  var valPending = document.getElementById('val-pending');
  var valReviews = document.getElementById('val-reviews');
  if (valToday) valToday.textContent = todayCount;
  if (valTotal) valTotal.textContent = totalCount;
  if (valPending) valPending.textContent = pendingActions;
  if (valReviews) valReviews.textContent = pendingReviews;

  // Recent evidence
  var listRecent = document.getElementById('list-recent');
  if (!listRecent) return;

  var recent = evidence.slice(0, 5);
  if (recent.length === 0) {
    listRecent.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No recent evidence recorded yet.</p></div>';
    return;
  }

  var html = '';
  recent.forEach(function(ev) {
    html += renderEvidenceCard(ev, false);
  });
  listRecent.innerHTML = html;
}

function renderEvidenceCard(ev, showActions) {
  var typeClass = 'badge-text';
  var typeLabel = 'Text';
  if (ev.type === 'photo') { typeClass = 'badge-photo'; typeLabel = 'Photo'; }
  else if (ev.type === 'incident') { typeClass = 'badge-incident'; typeLabel = 'Incident'; }
  else if (ev.type === 'audio') { typeClass = 'badge-audio'; typeLabel = 'Audio'; }

  var text = ev.rawText || 'No description';
  var preview = text.length > 150 ? text.substring(0, 150) + '...' : text;
  var date = formatDateTime(ev.createdAt);
  var statusHtml = '';
  if (ev.status) {
    statusHtml = '<span class="status-badge status-' + escapeHtml(ev.status) + '">' + escapeHtml(ev.status) + '</span>';
  }

  var actionsHtml = '';
  if (showActions && ev.status === 'submitted') {
    actionsHtml = '<div class="evidence-card-actions">' +
      '<button class="btn-approve" onclick="approveEvidence(\'' + escapeHtml(ev.id) + '\')">Approve</button>' +
      '<button class="btn-reject" onclick="openRejectModal(\'' + escapeHtml(ev.id) + '\')">Reject</button>' +
      '</div>';
  }

  return '<div class="evidence-card">' +
    '<span class="evidence-type-badge ' + typeClass + '"><i class="fas fa-' + (ev.type === 'photo' ? 'camera' : ev.type === 'incident' ? 'triangle-exclamation' : 'align-left') + '"></i> ' + typeLabel + '</span>' +
    '<div class="evidence-card-body">' +
    '<p class="evidence-card-text">' + escapeHtml(preview) + '</p>' +
    '<div class="evidence-card-meta"><span>' + escapeHtml(date) + '</span>' + statusHtml + '</div>' +
    '</div>' +
    actionsHtml +
    '</div>';
}

// ======================================================================
//  VIEW: EVIDENCE CAPTURE
// ======================================================================
function loadCapture() {
  populateSiteDropdowns();
  resetCaptureForm();
}

function resetCaptureForm() {
  var form = document.getElementById('form-evidence');
  if (form) form.reset();
  AppState.selectedPhotos = [];
  AppState.selectedEvidenceType = 'text';
  showEvidenceSection('text');
  var aiPanel = document.getElementById('panel-ai');
  if (aiPanel) aiPanel.classList.add('hidden');
  var labelTpl = document.getElementById('label-template');
  if (labelTpl) labelTpl.textContent = 'Choose a template...';
  var preview = document.getElementById('preview-photo');
  if (preview) preview.innerHTML = '';
  // Reset type tabs
  var tabs = document.querySelectorAll('#evidence-type-tabs .type-btn');
  tabs.forEach(function(t) {
    t.classList.toggle('active', t.getAttribute('data-type') === 'text');
  });
  // Re-populate site
  populateSiteDropdowns();
}

function showEvidenceSection(type) {
  AppState.selectedEvidenceType = type;
  var sections = ['section-text', 'section-photo', 'section-audio', 'section-incident'];
  sections.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  var target = document.getElementById('section-' + type);
  if (target) target.classList.remove('hidden');
}

async function submitEvidence(e) {
  if (e) e.preventDefault();

  var btn = document.getElementById('btn-submit');
  var btnText = btn ? btn.querySelector('.btn-text') : null;
  var spinner = btn ? btn.querySelector('.spinner') : null;

  var siteId = document.getElementById('select-site') ? document.getElementById('select-site').value : '';
  if (!siteId) {
    showToast('Please select a site', 'warning');
    return;
  }

  var type = AppState.selectedEvidenceType;
  var rawText = '';
  if (type === 'text') {
    rawText = (document.getElementById('input-evidence') || {}).value || '';
  } else if (type === 'incident') {
    rawText = (document.getElementById('input-incident') || {}).value || '';
  } else if (type === 'photo') {
    rawText = (document.getElementById('input-photo-caption') || {}).value || '';
  } else if (type === 'audio') {
    showToast('Audio recording is coming soon', 'info');
    return;
  }

  if (!rawText.trim() && type !== 'photo') {
    showToast('Please enter evidence details', 'warning');
    return;
  }
  if (type === 'photo' && AppState.selectedPhotos.length === 0 && !rawText.trim()) {
    showToast('Please add a photo or caption', 'warning');
    return;
  }

  // Loading state
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Submitting...';
  if (spinner) spinner.classList.remove('hidden');

  try {
    // Run AI analysis
    var analysis = AIEngine.analyze(rawText);

    // Determine current region code
    var regionCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';

    var doc = {
      type: type,
      rawText: rawText,
      status: 'submitted',
      manualTags: analysis.tags,
      riskLevel: analysis.riskLevel,
      region: regionCode,
      complianceFramework: ActiveRegion.regulatorShort,
      siteId: siteId,
      createdByUid: AppState.user.uid,
      createdByName: AppState.user.displayName || AppState.user.email || 'Guest',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Upload photos if any
    if (type === 'photo' && AppState.selectedPhotos.length > 0) {
      try {
        var urls = [];
        for (var i = 0; i < AppState.selectedPhotos.length; i++) {
          var file = AppState.selectedPhotos[i];
          var path = 'orgs/' + AppState.orgId + '/evidence/' + Date.now() + '_' + i + '_' + file.name;
          var storageRef = storage.ref().child(path);
          await storageRef.put(file);
          var url = await storageRef.getDownloadURL();
          urls.push(url);
        }
        doc.attachments = urls;
      } catch (storageErr) {
        console.error('Photo upload failed:', storageErr);
        showToast('Photo upload is not available yet. Your text evidence has been saved.', 'warning');
      }
    }

    await db.collection('orgs').doc(AppState.orgId).collection('evidence').add(doc);

    // Create follow-up actions if risks found
    if (analysis.actions.length > 0 && analysis.riskLevel !== 'low') {
      var actionBatch = db.batch();
      analysis.actions.slice(0, 3).forEach(function(actionText) {
        var actionRef = db.collection('orgs').doc(AppState.orgId).collection('actions').doc();
        actionBatch.set(actionRef, {
          title: actionText,
          priority: analysis.riskLevel === 'high' ? 'high' : 'medium',
          status: 'open',
          dueDate: firebase.firestore.Timestamp.fromDate(daysAgo(-7)),
          siteId: siteId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      await actionBatch.commit();
    }

    logAudit('evidence_submitted', 'Type: ' + type);
    showToast('Evidence submitted successfully', 'success');
    resetCaptureForm();

  } catch (err) {
    console.error('Submit error:', err);
    // If offline, queue locally
    if (!navigator.onLine) {
      var offRegion = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
      var offlineDoc = {
        id: 'offline_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        orgId: AppState.orgId,
        type: type,
        rawText: rawText,
        status: 'submitted',
        manualTags: AIEngine.analyze(rawText).tags,
        region: offRegion,
        complianceFramework: ActiveRegion.regulatorShort,
        siteId: siteId,
        createdByUid: AppState.user ? AppState.user.uid : 'offline',
        createdByName: AppState.user ? (AppState.user.displayName || AppState.user.email || 'Guest') : 'Offline User',
        createdAt: new Date().toISOString(),
        _offlineQueued: true
      };
      await queueOfflineEvidence(offlineDoc);
      resetCaptureForm();
      // Request background sync when online
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        var reg = await navigator.serviceWorker.ready;
        await reg.sync.register('sync-evidence').catch(function() {});
      }
    } else {
      showToast('Failed to submit: ' + err.message, 'error');
    }
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Submit Evidence';
    if (spinner) spinner.classList.add('hidden');
  }
}

// ── Photo Handling ─────────────────────────────────────────
function handlePhotoFiles(files) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (!file.type.startsWith('image/')) {
      showToast('Only image files are allowed', 'warning');
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB', 'warning');
      continue;
    }
    AppState.selectedPhotos.push(file);
  }
  renderPhotoPreview();
}

function renderPhotoPreview() {
  var container = document.getElementById('preview-photo');
  if (!container) return;
  container.innerHTML = '';
  AppState.selectedPhotos.forEach(function(file, idx) {
    var item = document.createElement('div');
    item.className = 'photo-preview-item';
    var img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = 'Preview';
    var removeBtn = document.createElement('button');
    removeBtn.className = 'photo-preview-remove';
    removeBtn.innerHTML = '<i class="fas fa-xmark"></i>';
    removeBtn.type = 'button';
    removeBtn.onclick = (function(index) {
      return function() {
        AppState.selectedPhotos.splice(index, 1);
        renderPhotoPreview();
      };
    })(idx);
    item.appendChild(img);
    item.appendChild(removeBtn);
    container.appendChild(item);
  });
}

// ── AI Assist ──────────────────────────────────────────────
function runAIAssist() {
  var type = AppState.selectedEvidenceType;
  var text = '';
  if (type === 'text') text = (document.getElementById('input-evidence') || {}).value || '';
  else if (type === 'incident') text = (document.getElementById('input-incident') || {}).value || '';
  else if (type === 'photo') text = (document.getElementById('input-photo-caption') || {}).value || '';

  if (!text.trim()) {
    showToast('Please enter some text before using AI Assist', 'warning');
    return;
  }

  var result = AIEngine.analyze(text);
  var panel = document.getElementById('panel-ai');
  if (!panel) return;

  // Summary
  var summaryEl = document.getElementById('ai-summary');
  if (summaryEl) summaryEl.textContent = result.summary;

  // Tags
  var tagsEl = document.getElementById('ai-tags');
  if (tagsEl) {
    tagsEl.innerHTML = result.tags.length > 0
      ? result.tags.map(function(t) { return '<span class="ai-tag">' + escapeHtml(t) + '</span>'; }).join('')
      : '<span class="ai-tag" style="opacity:0.5">No specific tags detected</span>';
  }

  // Risk level
  var riskLevelEl = document.getElementById('ai-risk-level');
  if (riskLevelEl) {
    riskLevelEl.innerHTML = '<span class="ai-risk-badge risk-' + result.riskLevel + '">' + result.riskLevel.toUpperCase() + ' RISK</span>';
  }

  // Risk flags
  var risksEl = document.getElementById('ai-risks');
  if (risksEl) {
    risksEl.innerHTML = result.risks.length > 0
      ? result.risks.map(function(r) { return '<span class="ai-risk-flag">' + escapeHtml(r) + '</span>'; }).join('')
      : '<span style="font-size:13px;color:var(--text-secondary);">No risk flags detected</span>';
  }

  // Actions
  var actionsEl = document.getElementById('ai-actions');
  if (actionsEl) {
    actionsEl.innerHTML = result.actions.length > 0
      ? result.actions.map(function(a) { return '<li>' + escapeHtml(a) + '</li>'; }).join('')
      : '<li style="color:var(--text-secondary);">No follow-up actions suggested</li>';
  }

  panel.classList.remove('hidden');
  showToast('AI analysis complete', 'success');
}

// ======================================================================
//  VIEW: REVIEW
// ======================================================================
function loadReview() {
  var denied = document.getElementById('review-denied');
  var content = document.getElementById('review-content');

  if (!Permissions.canReview(AppState.userRole)) {
    if (denied) denied.classList.remove('hidden');
    if (content) content.style.display = 'none';
    return;
  }

  if (denied) denied.classList.add('hidden');
  if (content) content.style.display = '';
  renderReviewList();
}

function renderReviewList() {
  var list = document.getElementById('list-review');
  if (!list) return;

  var filter = AppState.reviewFilter;
  var evidence = AppState.evidenceCache.filter(function(ev) {
    if (filter === 'all') return true;
    return ev.status === filter;
  });

  if (evidence.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-check-double"></i><p>No evidence matches the current filter.</p></div>';
    return;
  }

  var html = '';
  evidence.forEach(function(ev) {
    html += renderEvidenceCard(ev, Permissions.canReview(AppState.userRole));
  });
  list.innerHTML = html;
}

async function approveEvidence(evidenceId) {
  try {
    await db.collection('orgs').doc(AppState.orgId).collection('evidence').doc(evidenceId).update({
      status: 'approved',
      reviewedByUid: AppState.user.uid,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    logAudit('evidence_approved', 'Evidence ID: ' + evidenceId);
    showToast('Evidence approved', 'success');
  } catch (err) {
    console.error('Approve error:', err);
    showToast('Failed to approve: ' + err.message, 'error');
  }
}

function openRejectModal(evidenceId) {
  AppState.rejectTargetId = evidenceId;
  var modal = document.getElementById('modal-reject');
  if (modal) modal.classList.remove('hidden');
  var textarea = document.getElementById('input-reject-reason');
  if (textarea) { textarea.value = ''; textarea.focus(); }
}

async function confirmReject() {
  var reason = (document.getElementById('input-reject-reason') || {}).value || '';
  if (!reason.trim()) {
    showToast('Please provide a reason for rejection', 'warning');
    return;
  }

  var evidenceId = AppState.rejectTargetId;
  if (!evidenceId) return;

  try {
    await db.collection('orgs').doc(AppState.orgId).collection('evidence').doc(evidenceId).update({
      status: 'rejected',
      rejectReason: reason,
      reviewedByUid: AppState.user.uid,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    logAudit('evidence_rejected', 'Evidence ID: ' + evidenceId + ', Reason: ' + reason);
    showToast('Evidence rejected', 'info');
    closeModal('modal-reject');
    AppState.rejectTargetId = null;
  } catch (err) {
    console.error('Reject error:', err);
    showToast('Failed to reject: ' + err.message, 'error');
  }
}

// ======================================================================
//  VIEW: COMPLIANCE
// ======================================================================
function loadCompliance() {
  var denied = document.getElementById('compliance-denied');
  var content = document.getElementById('compliance-content');

  if (!Permissions.canViewCompliance(AppState.userRole)) {
    if (denied) denied.classList.remove('hidden');
    if (content) content.style.display = 'none';
    return;
  }

  if (denied) denied.classList.add('hidden');
  if (content) content.style.display = '';
  renderComplianceData();
}

function renderComplianceData() {
  var evidence = AppState.evidenceCache;
  var thirtyDaysAgo = daysAgo(30);

  // Count evidence per category in last 30 days
  var categoryCounts = {};
  COMPLIANCE_CATEGORIES.forEach(function(cat) { categoryCounts[cat] = 0; });

  // Region-aware tag-to-category mapping
  var TAG_CATEGORY_MAPS = {
    uk: {
      'medication': 'Medication Management', 'personal-care': 'Personal Care & Dignity',
      'nutrition': 'Nutrition & Hydration', 'skin-care': 'Personal Care & Dignity',
      'mobility': 'Falls Prevention', 'mental-health': 'Mental Capacity & DoLS',
      'social': 'Activities & Wellbeing', 'infection-control': 'Infection Control',
      'safeguarding': 'Safeguarding', 'safety': 'Risk Assessment',
      'risk-assessment': 'Risk Assessment', 'health-monitoring': 'Health Monitoring',
      'complaints': 'Complaints & Feedback', 'staff-training': 'Staff Training & Competency',
      'governance': 'Governance & Audits', 'night-care': 'Night Care',
      'end-of-life': 'End of Life Care', 'duty-of-candour': 'Duty of Candour',
      'mental-capacity': 'Mental Capacity & DoLS'
    },
    au: {
      'medication': 'Medication Management', 'personal-care': 'Daily Living Support',
      'nutrition': 'Meals & Nutrition', 'skin-care': 'Clinical Care & Assessment',
      'mobility': 'Falls Prevention', 'mental-health': 'Clinical Care & Assessment',
      'social': 'Social & Recreational Activities', 'infection-control': 'Infection Prevention',
      'safeguarding': 'Incident Management', 'safety': 'Risk Management',
      'risk-assessment': 'Risk Management', 'health-monitoring': 'Clinical Care & Assessment',
      'complaints': 'Feedback & Complaints', 'staff-training': 'Staff Competency & Training',
      'governance': 'Governance & Leadership', 'night-care': 'Daily Living Support',
      'end-of-life': 'Palliative & End of Life', 'duty-of-candour': 'Open Disclosure',
      'mental-capacity': 'Autonomy & Informed Consent'
    },
    nz: {
      'medication': 'Medication Management', 'personal-care': 'Personal Care & Dignity',
      'nutrition': 'Nutrition & Fluid Balance', 'skin-care': 'Wound & Skin Care',
      'mobility': 'Falls Prevention', 'mental-health': 'Clinical Assessment & Care Planning',
      'social': 'Activities & Recreation', 'infection-control': 'Infection Prevention & Control',
      'safeguarding': 'Consumer Rights', 'safety': 'Safe & Appropriate Environment',
      'risk-assessment': 'Governance & Quality Improvement', 'health-monitoring': 'Clinical Assessment & Care Planning',
      'complaints': 'Complaints & Feedback', 'staff-training': 'Training & Competency',
      'governance': 'Governance & Quality Improvement', 'night-care': 'Continuum of Service Delivery',
      'end-of-life': 'Palliative & End of Life', 'duty-of-candour': 'Consumer Rights',
      'mental-capacity': 'Consumer Rights'
    },
    ie: {
      'medication': 'Medication Management', 'personal-care': 'Person-Centred Care & Support',
      'nutrition': 'Nutrition & Hydration', 'skin-care': 'Safe Services',
      'mobility': 'Falls Prevention', 'mental-health': 'Health & Wellbeing',
      'social': 'Activities & Social Care', 'infection-control': 'Infection Prevention',
      'safeguarding': 'Safeguarding & Protection', 'safety': 'Risk Management',
      'risk-assessment': 'Risk Management', 'health-monitoring': 'Effective Services',
      'complaints': 'Complaints Management', 'staff-training': 'Staff Supervision & Training',
      'governance': 'Leadership & Governance', 'night-care': 'Safe Services',
      'end-of-life': 'End of Life Care', 'duty-of-candour': 'Leadership & Governance',
      'mental-capacity': "Residents' Rights"
    }
  };
  var regionCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
  var tagToCategoryMap = TAG_CATEGORY_MAPS[regionCode] || TAG_CATEGORY_MAPS.uk;

  evidence.forEach(function(ev) {
    var d = ev.createdAt ? (ev.createdAt.toDate ? ev.createdAt.toDate() : new Date(ev.createdAt)) : new Date(0);
    if (d < thirtyDaysAgo) return;
    if (ev.status !== 'approved' && ev.status !== 'submitted') return;

    var tags = ev.manualTags || [];
    tags.forEach(function(tag) {
      var cat = tagToCategoryMap[tag];
      if (cat && categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      }
    });
  });

  // Calculate score
  var coveredCount = 0;
  COMPLIANCE_CATEGORIES.forEach(function(cat) {
    if (categoryCounts[cat] > 0) coveredCount++;
  });
  var score = Math.round((coveredCount / COMPLIANCE_CATEGORIES.length) * 100);

  // Update score circle
  var scoreValue = document.getElementById('score-value');
  if (scoreValue) scoreValue.textContent = score;
  var scoreFill = document.getElementById('score-fill');
  if (scoreFill) {
    var circumference = 2 * Math.PI * 54;
    var offset = circumference - (score / 100) * circumference;
    scoreFill.style.strokeDasharray = circumference;
    scoreFill.style.strokeDashoffset = offset;
  }

  // Gaps
  var gapsList = document.getElementById('list-gaps');
  if (gapsList) {
    var gapHtml = '';
    COMPLIANCE_CATEGORIES.forEach(function(cat) {
      var count = categoryCounts[cat];
      var isCovered = count > 0;
      gapHtml += '<div class="gap-item">' +
        '<span class="gap-item-name">' + escapeHtml(cat) + '</span>' +
        '<span class="gap-item-status ' + (isCovered ? 'gap-covered' : 'gap-missing') + '">' +
        (isCovered ? count + ' records' : 'No evidence') +
        '</span></div>';
    });
    gapsList.innerHTML = gapHtml || '<div class="empty-state"><i class="fas fa-chart-pie"></i><p>No data.</p></div>';
  }

  // Category grid
  var grid = document.getElementById('grid-categories');
  if (grid) {
    var gridHtml = '';
    COMPLIANCE_CATEGORIES.forEach(function(cat) {
      var count = categoryCounts[cat];
      gridHtml += '<div class="category-card">' +
        '<div class="category-card-name">' + escapeHtml(cat) + '</div>' +
        '<div class="category-card-count">' + count + '</div>' +
        '<div class="category-card-label">records (30d)</div></div>';
    });
    grid.innerHTML = gridHtml;
  }
}

// ======================================================================
//  VIEW: ACTIONS
// ======================================================================
function loadActions() {
  renderActionsList();
}

function renderActionsList() {
  var list = document.getElementById('list-actions');
  if (!list) return;

  var statusFilter = (document.getElementById('filter-status') || {}).value || 'all';
  var priorityFilter = (document.getElementById('filter-priority') || {}).value || 'all';
  var now = new Date();

  var actions = AppState.actionsCache.map(function(a) {
    var dueDate = a.dueDate ? (a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate)) : null;
    var isOverdue = dueDate && dueDate < now && a.status !== 'completed';
    return Object.assign({}, a, { _dueDate: dueDate, _isOverdue: isOverdue });
  });

  // Filter
  actions = actions.filter(function(a) {
    if (statusFilter === 'overdue') return a._isOverdue;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
    return true;
  });

  // Sort: overdue first, then by priority
  var priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort(function(a, b) {
    if (a._isOverdue && !b._isOverdue) return -1;
    if (!a._isOverdue && b._isOverdue) return 1;
    return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
  });

  // Overdue banner
  var overdueCount = AppState.actionsCache.filter(function(a) {
    var d = a.dueDate ? (a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate)) : null;
    return d && d < now && a.status !== 'completed';
  }).length;
  var banner = document.getElementById('banner-overdue');
  var bannerText = document.getElementById('text-overdue');
  if (banner) {
    if (overdueCount > 0) {
      banner.classList.remove('hidden');
      if (bannerText) bannerText.textContent = 'You have ' + overdueCount + ' overdue action' + (overdueCount > 1 ? 's' : '') + ' that need attention!';
    } else {
      banner.classList.add('hidden');
    }
  }

  if (actions.length === 0) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No actions match the current filters.</p></div>';
    return;
  }

  var html = '';
  actions.forEach(function(a) {
    var dueStr = a._dueDate ? formatDate(a._dueDate) : 'No due date';
    var overdueClass = a._isOverdue ? ' overdue' : '';
    var completedAttr = a.status === 'completed' ? ' style="opacity:0.5;pointer-events:none;"' : '';

    html += '<div class="action-card' + overdueClass + '"' + completedAttr + '>' +
      '<div class="action-card-body">' +
      '<div class="action-card-title">' + escapeHtml(a.title) + '</div>' +
      '<div class="action-card-meta">' +
      '<span>Due: ' + escapeHtml(dueStr) + '</span>' +
      '<span class="priority-badge priority-' + escapeHtml(a.priority) + '">' + escapeHtml(a.priority) + '</span>' +
      (a._isOverdue ? '<span class="priority-badge priority-critical">OVERDUE</span>' : '') +
      '</div></div>' +
      (a.status !== 'completed'
        ? '<button class="btn-complete" onclick="completeAction(\'' + escapeHtml(a.id) + '\')">Complete</button>'
        : '<span class="status-badge status-approved">Done</span>') +
      '</div>';
  });
  list.innerHTML = html;
}

async function completeAction(actionId) {
  try {
    await db.collection('orgs').doc(AppState.orgId).collection('actions').doc(actionId).update({
      status: 'completed',
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      completedByUid: AppState.user.uid
    });
    logAudit('action_completed', 'Action ID: ' + actionId);
    showToast('Action marked as complete', 'success');
  } catch (err) {
    console.error('Complete action error:', err);
    showToast('Failed to complete action: ' + err.message, 'error');
  }
}

// ======================================================================
//  VIEW: INSPECTION PACKS
// ======================================================================
function loadPacks() {
  var denied = document.getElementById('packs-denied');
  var content = document.getElementById('packs-content');

  if (!Permissions.canGeneratePacks(AppState.userRole)) {
    if (denied) denied.classList.remove('hidden');
    if (content) content.style.display = 'none';
    return;
  }

  if (denied) denied.classList.add('hidden');
  if (content) content.style.display = '';

  // Set default dates
  var startInput = document.getElementById('input-date-start');
  var endInput = document.getElementById('input-date-end');
  if (startInput && !startInput.value) {
    var d30 = daysAgo(30);
    startInput.value = d30.toISOString().split('T')[0];
  }
  if (endInput && !endInput.value) {
    endInput.value = new Date().toISOString().split('T')[0];
  }

  loadPacksList();
}

async function loadPacksList() {
  if (!AppState.orgId) return;
  try {
    var snap = await db.collection('orgs').doc(AppState.orgId)
      .collection('packs')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    var list = document.getElementById('list-packs');
    if (!list) return;

    if (snap.empty) {
      list.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No inspection packs generated yet.</p></div>';
      return;
    }

    var html = '';
    snap.forEach(function(doc) {
      var p = doc.data();
      html += '<div class="pack-card">' +
        '<div class="pack-card-body">' +
        '<div class="pack-card-title">' + escapeHtml(p.title || 'Inspection Pack') + '</div>' +
        '<div class="pack-card-meta">' + escapeHtml(formatDate(p.createdAt)) + ' — ' + (p.evidenceCount || 0) + ' evidence items</div>' +
        '</div></div>';
    });
    list.innerHTML = html;
  } catch (err) {
    console.error('Load packs error:', err);
  }
}

async function generatePack() {
  var btn = document.getElementById('btn-generate');
  var btnText = btn ? btn.querySelector('.btn-text') : null;
  var spinner = btn ? btn.querySelector('.spinner') : null;

  var startDate = (document.getElementById('input-date-start') || {}).value;
  var endDate = (document.getElementById('input-date-end') || {}).value;

  if (!startDate || !endDate) {
    showToast('Please select both start and end dates', 'warning');
    return;
  }

  // Get selected type
  var activeChip = document.querySelector('#pack-type-chips .chip-type.active');
  var packType = activeChip ? activeChip.getAttribute('data-type') : 'all';

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Generating...';
  if (spinner) spinner.classList.remove('hidden');

  try {
    var startTs = firebase.firestore.Timestamp.fromDate(new Date(startDate));
    var endTs = firebase.firestore.Timestamp.fromDate(new Date(endDate + 'T23:59:59'));

    var query = db.collection('orgs').doc(AppState.orgId)
      .collection('evidence')
      .where('status', '==', 'approved')
      .where('createdAt', '>=', startTs)
      .where('createdAt', '<=', endTs)
      .orderBy('createdAt', 'desc');

    var snap = await query.get();
    var items = [];
    snap.forEach(function(doc) {
      var d = doc.data();
      if (packType !== 'all' && d.type !== packType) return;
      items.push(d);
    });

    if (items.length === 0) {
      showToast('No approved evidence found for the selected period', 'warning');
      return;
    }

    // Build HTML report
    var reportHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
      '<title>Inspection Pack — ' + escapeHtml(startDate) + ' to ' + escapeHtml(endDate) + '</title>' +
      '<style>body{font-family:Arial,sans-serif;margin:40px;color:#333;}' +
      'h1{color:#12151A;border-bottom:2px solid #D9FE06;padding-bottom:10px;}' +
      'h2{color:#555;margin-top:30px;}' +
      '.evidence{border:1px solid #ddd;padding:16px;margin:12px 0;border-radius:8px;page-break-inside:avoid;}' +
      '.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;margin-right:8px;}' +
      '.text{background:#e3f2fd;color:#1565c0;}.photo{background:#e8f5e9;color:#2e7d32;}' +
      '.incident{background:#ffebee;color:#c62828;}.meta{color:#888;font-size:12px;margin-top:8px;}' +
      '</style></head><body>' +
      '<h1>AlwaysReady Care — ' + escapeHtml(ActiveRegion.packLabel) + '</h1>' +
      '<p><strong>Period:</strong> ' + escapeHtml(startDate) + ' to ' + escapeHtml(endDate) + '</p>' +
      '<p><strong>Framework:</strong> ' + escapeHtml(ActiveRegion.regulator) + '</p>' +
      '<p><strong>Generated:</strong> ' + new Date().toLocaleDateString(ActiveRegion.locale || 'en-GB') + '</p>' +
      '<p><strong>Evidence count:</strong> ' + items.length + '</p>' +
      '<h2>Evidence Records</h2>';

    items.forEach(function(ev, idx) {
      var typeClass = ev.type === 'photo' ? 'photo' : ev.type === 'incident' ? 'incident' : 'text';
      reportHtml += '<div class="evidence">' +
        '<span class="badge ' + typeClass + '">' + escapeHtml(ev.type || 'text').toUpperCase() + '</span>' +
        '<p>' + escapeHtml(ev.rawText || 'No description') + '</p>' +
        '<div class="meta">Recorded: ' + formatDateTime(ev.createdAt) + ' | By: ' + escapeHtml(ev.createdByName || 'Unknown') + '</div>' +
        '</div>';
    });

    reportHtml += '</body></html>';

    // Download as HTML
    var blob = new Blob([reportHtml], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = ActiveRegion.packLabel.toLowerCase().replace(/\s+/g, '-') + '-' + startDate + '-to-' + endDate + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Save pack record
    await db.collection('orgs').doc(AppState.orgId).collection('packs').add({
      title: 'Pack: ' + startDate + ' to ' + endDate,
      startDate: startDate,
      endDate: endDate,
      evidenceType: packType,
      evidenceCount: items.length,
      createdByUid: AppState.user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    logAudit('pack_generated', items.length + ' evidence items, ' + startDate + ' to ' + endDate);
    showToast('Inspection pack downloaded (' + items.length + ' items)', 'success');
    loadPacksList();

  } catch (err) {
    console.error('Generate pack error:', err);
    showToast('Failed to generate pack: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Generate Pack';
    if (spinner) spinner.classList.add('hidden');
  }
}

// ======================================================================
//  VIEW: PROFILE & SETTINGS
// ======================================================================
function loadProfile() {
  var user = AppState.user;

  // Name and email
  var nameEl = document.getElementById('profile-name');
  var emailEl = document.getElementById('profile-email');
  if (nameEl) nameEl.textContent = user ? (user.displayName || 'Guest User') : 'Not signed in';
  if (emailEl) emailEl.textContent = user ? (user.email || (user.isAnonymous ? 'Anonymous guest account' : 'No email')) : '';

  // Avatar
  var avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    if (user && user.photoURL) {
      avatarEl.innerHTML = '<img src="' + escapeHtml(user.photoURL) + '" alt="Avatar">';
    } else {
      avatarEl.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
  }

  // Role selector
  var roleSelect = document.getElementById('select-role');
  if (roleSelect) roleSelect.value = AppState.userRole;

  // Site selector
  populateSiteDropdowns();

  // Theme buttons
  updateThemeUI(getTheme());
}

async function changeRole(newRole) {
  AppState.userRole = newRole;
  updateSidebarForRole(newRole);

  // Persist to Firestore
  if (AppState.orgId && AppState.user) {
    try {
      await db.collection('orgs').doc(AppState.orgId).collection('users').doc(AppState.user.uid).update({
        role: newRole
      });
      logAudit('role_changed', 'New role: ' + newRole);
    } catch (err) {
      console.error('Role update error:', err);
    }
  }

  showToast('Role changed to ' + newRole, 'success');

  // If currently viewing a restricted view, redirect to dashboard
  var restricted = {
    review: Permissions.canReview(newRole),
    compliance: Permissions.canViewCompliance(newRole),
    packs: Permissions.canGeneratePacks(newRole),
    admin: Permissions.canManageTeam(newRole)
  };
  if (restricted[AppState.currentView] === false) {
    navigate('dashboard');
  } else {
    // Reload current view to reflect permission changes
    loadViewData(AppState.currentView);
  }
}

// ── Modal Management ───────────────────────────────────────
function openModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// ── Login Handlers ─────────────────────────────────────────
async function loginWithEmail(e) {
  e.preventDefault();
  var email = (document.getElementById('input-email') || {}).value;
  var password = (document.getElementById('input-password') || {}).value;
  var btn = document.getElementById('btn-login');
  var btnText = btn ? btn.querySelector('.btn-text') : null;
  var spinner = btn ? btn.querySelector('.spinner') : null;
  var errorDiv = document.getElementById('login-error');

  if (errorDiv) errorDiv.classList.add('hidden');
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Signing in...';
  if (spinner) spinner.classList.remove('hidden');

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    // Try creating account if not found
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        await auth.createUserWithEmailAndPassword(email, password);
      } catch (createErr) {
        showLoginError(createErr.message);
      }
    } else {
      showLoginError(err.message);
    }
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Sign In';
    if (spinner) spinner.classList.add('hidden');
  }
}

async function loginWithGoogle() {
  var btn = document.getElementById('btn-google');
  if (btn) btn.disabled = true;

  try {
    var provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showLoginError(err.message);
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loginAsGuest() {
  var btn = document.getElementById('btn-guest');
  if (btn) btn.disabled = true;

  try {
    await auth.signInAnonymously();
  } catch (err) {
    showLoginError(err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function showLoginError(msg) {
  var errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
  }
}

async function logout() {
  try {
    cleanupListeners();
    AppState.evidenceCache = [];
    AppState.actionsCache = [];
    AppState.orgId = null;
    AppState.siteId = null;
    AppState.sites = [];
    AppState.userData = null;
    AppState.userRole = 'carer';
    await auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Logout failed', 'error');
  }
}

// ── Online/Offline Detection ───────────────────────────────
function updateOnlineStatus() {
  var isOnline = navigator.onLine;
  AppState.isOnline = isOnline;
  var dot = document.getElementById('dot-online');
  var text = document.getElementById('text-online');
  if (dot) {
    dot.classList.toggle('online', isOnline);
    dot.classList.toggle('offline', !isOnline);
  }
  if (text) text.textContent = isOnline ? 'Online' : 'Offline';
}

// ── Template Rendering ─────────────────────────────────────
function renderTemplateList() {
  var list = document.getElementById('template-list');
  if (!list) return;
  var html = '';
  getActiveTemplates().forEach(function(tpl) {
    html += '<li><button type="button" class="card-template" data-template-id="' + escapeHtml(tpl.id) + '">' +
      '<div class="template-icon"><i class="' + escapeHtml(tpl.icon) + '"></i></div>' +
      '<div class="template-info">' +
      '<span class="template-name">' + escapeHtml(tpl.name) + '</span>' +
      '<span class="template-desc">' + escapeHtml(tpl.desc) + '</span>' +
      '</div></button></li>';
  });
  list.innerHTML = html;

  // Attach click handlers
  list.querySelectorAll('.card-template').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tplId = this.getAttribute('data-template-id');
      selectTemplate(tplId);
    });
  });
}

function selectTemplate(templateId) {
  var tpl = getActiveTemplates().find(function(t) { return t.id === templateId; });
  if (!tpl) return;

  // Apply to the current evidence type textarea
  var type = AppState.selectedEvidenceType;
  if (type === 'text') {
    var el = document.getElementById('input-evidence');
    if (el) el.value = tpl.text;
  } else if (type === 'incident') {
    var el2 = document.getElementById('input-incident');
    if (el2) el2.value = tpl.text;
  } else if (type === 'photo') {
    var el3 = document.getElementById('input-photo-caption');
    if (el3) el3.value = tpl.text;
  }

  // If template is incident-type, switch to incident type
  var incidentTemplates = ['incident-occurred', 'safeguarding-concern', 'sirs-priority1', 'sirs-priority2', 'restrictive-practice', 'restraint-minimisation'];
  if (incidentTemplates.indexOf(tpl.id) !== -1) {
    switchEvidenceType('incident');
    var incidentEl = document.getElementById('input-incident');
    if (incidentEl) incidentEl.value = tpl.text;
  }

  var label = document.getElementById('label-template');
  if (label) label.textContent = tpl.name;

  closeModal('modal-template');
  showToast('Template applied: ' + tpl.name, 'success');
}

function switchEvidenceType(type) {
  AppState.selectedEvidenceType = type;
  showEvidenceSection(type);
  var tabs = document.querySelectorAll('#evidence-type-tabs .type-btn');
  tabs.forEach(function(t) {
    t.classList.toggle('active', t.getAttribute('data-type') === type);
  });
}

// ======================================================================
// ── Lead Capture ──────────────────────────────────────────
function handleLeadCapture(e) {
  if (e) e.preventDefault();
  var emailInput = document.getElementById('input-lead-email');
  var btn = document.getElementById('btn-lead-submit');
  var email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    showToast('Please enter your email', 'warning');
    return false;
  }

  if (btn) btn.disabled = true;

  // Save lead to Firestore (public collection)
  db.collection('leads').add({
    email: email,
    source: 'landing-page',
    product: 'always-ready-care',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    userAgent: navigator.userAgent
  }).then(function() {
    showToast('Subscribed! We\'ll keep you updated.', 'success');
    if (emailInput) emailInput.value = '';
    // Also log as audit
    logAudit('lead_captured', 'Email: ' + email);
  }).catch(function(err) {
    console.error('Lead capture error:', err);
    showToast('Something went wrong. Please try again.', 'error');
  }).finally(function() {
    if (btn) btn.disabled = false;
  });

  return false;
}

// Make it available globally for inline onsubmit
window.handleLeadCapture = handleLeadCapture;

// ── Floating CTA visibility ──────────────────────────────
function updateFloatingCTA() {
  var floatingCTA = document.getElementById('floating-cta');
  if (!floatingCTA) return;
  // Only show on landing page (when not logged in)
  if (AppState.currentView === 'login') {
    floatingCTA.style.display = 'flex';
  } else {
    floatingCTA.style.display = 'none';
  }
}

// ── PWA Install Prompt ────────────────────────────────────
var deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredInstallPrompt = e;
  // Show install banner after 3 seconds (not immediately)
  setTimeout(function() {
    var banner = document.getElementById('pwa-install-banner');
    if (banner && !localStorage.getItem('arc-pwa-dismissed')) {
      banner.classList.remove('hidden');
    }
  }, 3000);
});

function installPWA() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(function(result) {
    if (result.outcome === 'accepted') {
      showToast('App installed! Check your home screen.', 'success');
    }
    deferredInstallPrompt = null;
    var banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.add('hidden');
  });
}

function dismissPWABanner() {
  var banner = document.getElementById('pwa-install-banner');
  if (banner) banner.classList.add('hidden');
  localStorage.setItem('arc-pwa-dismissed', 'true');
}

window.addEventListener('appinstalled', function() {
  showToast('AlwaysReady Care installed successfully!', 'success');
  var banner = document.getElementById('pwa-install-banner');
  if (banner) banner.classList.add('hidden');
  deferredInstallPrompt = null;
});

//  EVENT LISTENERS — Wired up on DOMContentLoaded
// ======================================================================
document.addEventListener('DOMContentLoaded', function() {
  // Apply saved theme
  setTheme(getTheme());

  // Localise landing page for detected region (AU/NZ/IE/UK)
  localiseLandingPage();

  // Render template list
  renderTemplateList();

  // ── Login events ──
  var loginForm = document.getElementById('form-login');
  if (loginForm) loginForm.addEventListener('submit', loginWithEmail);

  var googleBtn = document.getElementById('btn-google');
  if (googleBtn) googleBtn.addEventListener('click', loginWithGoogle);

  var guestBtn = document.getElementById('btn-guest');
  if (guestBtn) guestBtn.addEventListener('click', loginAsGuest);

  // ── Theme toggles ──
  var themeLogin = document.getElementById('btn-theme-login');
  if (themeLogin) themeLogin.addEventListener('click', toggleTheme);

  var themeSidebar = document.getElementById('btn-theme-sidebar');
  if (themeSidebar) themeSidebar.addEventListener('click', toggleTheme);

  var themeDark = document.getElementById('btn-theme-dark');
  if (themeDark) themeDark.addEventListener('click', function() { setTheme('dark'); });

  var themeLight = document.getElementById('btn-theme-light');
  if (themeLight) themeLight.addEventListener('click', function() { setTheme('light'); });

  // ── Sidebar / Navigation ──
  var hamburger = document.getElementById('btn-hamburger');
  if (hamburger) hamburger.addEventListener('click', openSidebar);

  var sidebarClose = document.getElementById('btn-sidebar-close');
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);

  var sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // Nav links
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var viewName = this.getAttribute('data-nav');
      if (viewName) navigate(viewName);
    });
  });

  // User profile click -> go to profile
  var userProfile = document.getElementById('btn-user-profile');
  if (userProfile) userProfile.addEventListener('click', function() { navigate('profile'); });

  // Quick actions
  var qaCapture = document.getElementById('qa-capture');
  if (qaCapture) qaCapture.addEventListener('click', function() { navigate('capture'); });

  var qaReview = document.getElementById('qa-review');
  if (qaReview) qaReview.addEventListener('click', function() { navigate('review'); });

  // Logout
  var logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // ── Evidence Capture ──
  // Evidence form submit
  var evidenceForm = document.getElementById('form-evidence');
  if (evidenceForm) evidenceForm.addEventListener('submit', submitEvidence);

  // Evidence type tabs
  var typeTabs = document.getElementById('evidence-type-tabs');
  if (typeTabs) {
    typeTabs.addEventListener('click', function(e) {
      var btn = e.target.closest('.type-btn');
      if (!btn) return;
      var type = btn.getAttribute('data-type');
      switchEvidenceType(type);
    });
  }

  // Template button
  var templateBtn = document.getElementById('btn-template');
  if (templateBtn) templateBtn.addEventListener('click', function() { openModal('modal-template'); });

  // AI Assist
  var aiBtn = document.getElementById('btn-ai');
  if (aiBtn) aiBtn.addEventListener('click', runAIAssist);

  // Photo handling
  var pickPhotoBtn = document.getElementById('btn-pick-photo');
  var photoInput = document.getElementById('input-photo');
  if (pickPhotoBtn && photoInput) {
    pickPhotoBtn.addEventListener('click', function() { photoInput.click(); });
  }
  if (photoInput) {
    photoInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) handlePhotoFiles(this.files);
    });
  }

  // Drag and drop
  var dropzone = document.getElementById('dropzone-photo');
  if (dropzone) {
    dropzone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', function() {
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handlePhotoFiles(e.dataTransfer.files);
      }
    });
  }

  // ── Review filters ──
  var reviewFilters = document.getElementById('review-filters');
  if (reviewFilters) {
    reviewFilters.addEventListener('click', function(e) {
      var tab = e.target.closest('.tab-filter');
      if (!tab) return;
      reviewFilters.querySelectorAll('.tab-filter').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      AppState.reviewFilter = tab.getAttribute('data-status');
      renderReviewList();
    });
  }

  // ── Reject modal ──
  var confirmRejectBtn = document.getElementById('btn-confirm-reject');
  if (confirmRejectBtn) confirmRejectBtn.addEventListener('click', confirmReject);

  // ── Compliance refresh ──
  var refreshCompliance = document.getElementById('btn-refresh-compliance');
  if (refreshCompliance) refreshCompliance.addEventListener('click', renderComplianceData);

  // ── Actions filters ──
  var filterStatus = document.getElementById('filter-status');
  var filterPriority = document.getElementById('filter-priority');
  if (filterStatus) filterStatus.addEventListener('change', renderActionsList);
  if (filterPriority) filterPriority.addEventListener('change', renderActionsList);

  // ── Inspection Packs ──
  var generateBtn = document.getElementById('btn-generate');
  if (generateBtn) generateBtn.addEventListener('click', generatePack);

  // Pack type chips
  var packChips = document.getElementById('pack-type-chips');
  if (packChips) {
    packChips.addEventListener('click', function(e) {
      var chip = e.target.closest('.chip-type');
      if (!chip) return;
      packChips.querySelectorAll('.chip-type').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
    });
  }

  // ── Profile role change ──
  var roleSelect = document.getElementById('select-role');
  if (roleSelect) {
    roleSelect.addEventListener('change', function() {
      changeRole(this.value);
    });
  }

  // Profile site change
  var profileSite = document.getElementById('select-profile-site');
  if (profileSite) {
    profileSite.addEventListener('change', function() {
      AppState.siteId = this.value;
      populateSiteDropdowns();
      showToast('Active site updated', 'info');
    });
  }

  // ── Admin panel ──
  var saveHomeBtn = document.getElementById('btn-save-home');
  if (saveHomeBtn) saveHomeBtn.addEventListener('click', saveHomeSettings);
  var addStaffBtn = document.getElementById('btn-add-staff');
  if (addStaffBtn) addStaffBtn.addEventListener('click', addStaffMember);

  // ── Onboarding ──
  var onboardingNext = document.getElementById('btn-onboarding-next');
  if (onboardingNext) onboardingNext.addEventListener('click', nextOnboardingStep);
  var onboardingSkip = document.getElementById('btn-onboarding-skip');
  if (onboardingSkip) onboardingSkip.addEventListener('click', skipOnboarding);

  // ── FAQ accordion ──
  initFAQAccordion();

  // ── Modal close (generic) ──
  document.querySelectorAll('[data-modal-close]').forEach(function(el) {
    el.addEventListener('click', function() {
      var modalId = this.getAttribute('data-modal-close');
      closeModal(modalId);
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(function(modal) {
        modal.classList.add('hidden');
      });
    }
  });

  // ── Online/Offline ──
  window.addEventListener('online', function() {
    updateOnlineStatus();
    showToast('You are back online', 'success');
  });
  window.addEventListener('offline', function() {
    updateOnlineStatus();
    showToast('You are offline — some features may not work', 'warning');
  });
  updateOnlineStatus();

  // ── Hash change ──
  window.addEventListener('hashchange', function() {
    if (AppState.user && AppState.currentView !== 'login') {
      var hash = window.location.hash.replace('#', '');
      var validViews = ['dashboard', 'capture', 'review', 'compliance', 'actions', 'packs', 'admin', 'help', 'profile'];
      if (hash && validViews.indexOf(hash) !== -1 && hash !== AppState.currentView) {
        navigate(hash);
      }
    }
  });

  // ── PWA Install buttons ──
  var pwaInstallBtn = document.getElementById('btn-pwa-install');
  if (pwaInstallBtn) pwaInstallBtn.addEventListener('click', installPWA);
  var pwaDismissBtn = document.getElementById('btn-pwa-dismiss');
  if (pwaDismissBtn) pwaDismissBtn.addEventListener('click', dismissPWABanner);
});

// Make functions available for inline onclick handlers
window.approveEvidence = approveEvidence;
window.openRejectModal = openRejectModal;
window.completeAction = completeAction;

// ======================================================================
//  VIEW: ADMIN / TEAM MANAGEMENT
// ======================================================================
function loadAdmin() {
  var denied = document.getElementById('admin-denied');
  var content = document.getElementById('admin-content');
  if (!Permissions.canManageTeam(AppState.userRole)) {
    if (denied) denied.classList.remove('hidden');
    if (content) content.style.display = 'none';
    return;
  }
  if (denied) denied.classList.add('hidden');
  if (content) content.style.display = '';
  loadHomeSettings();
  loadStaffList();
}

async function loadHomeSettings() {
  if (!AppState.orgId) return;
  try {
    var orgDoc = await db.collection('orgs').doc(AppState.orgId).get();
    if (orgDoc.exists) {
      var data = orgDoc.data();
      var nameInput = document.getElementById('input-home-name');
      var addressInput = document.getElementById('input-home-address');
      if (nameInput) nameInput.value = data.name || '';
      if (addressInput) addressInput.value = data.address || '';
      // Set region dropdown
      var regionSelect = document.getElementById('select-region');
      if (regionSelect && data.region && REGION_CONFIGS[data.region]) {
        regionSelect.value = data.region;
      }
    }
  } catch (err) {
    console.error('Failed to load home settings:', err);
  }
}

async function saveHomeSettings() {
  var btn = document.getElementById('btn-save-home');
  var btnText = btn ? btn.querySelector('.btn-text') : null;
  var spinner = btn ? btn.querySelector('.spinner') : null;
  var name = (document.getElementById('input-home-name') || {}).value || '';
  var address = (document.getElementById('input-home-address') || {}).value || '';
  var regionCode = Object.keys(REGION_CONFIGS).find(function(k) { return REGION_CONFIGS[k] === ActiveRegion; }) || 'uk';
  var ft = { uk: 'care home', au: 'facility', nz: 'rest home', ie: 'nursing home' };
  if (!name.trim()) { showToast('Please enter a ' + (ft[regionCode] || 'care home') + ' name', 'warning'); return; }
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Saving...';
  if (spinner) spinner.classList.remove('hidden');
  try {
    // Save region selection
    var regionSelect = document.getElementById('select-region');
    var selectedRegion = regionSelect ? regionSelect.value : 'uk';
    setRegion(selectedRegion);
    updateComplianceAliases();
    localiseAppShell();

    await db.collection('orgs').doc(AppState.orgId).update({
      name: name.trim(),
      address: address.trim(),
      region: selectedRegion
    });
    var facilityTerms = { uk: 'Care home', au: 'Facility', nz: 'Rest home', ie: 'Nursing home' };
    logAudit('home_settings_updated', 'Name: ' + name.trim() + ', Region: ' + selectedRegion);
    showToast((facilityTerms[selectedRegion] || 'Care home') + ' settings saved', 'success');
    var subtitle = document.getElementById('dashboard-subtitle');
    if (subtitle) subtitle.textContent = name.trim() + ' \u2014 compliance overview';
  } catch (err) {
    console.error('Save home settings error:', err);
    showToast('Failed to save: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Save Changes';
    if (spinner) spinner.classList.add('hidden');
  }
}

async function loadStaffList() {
  if (!AppState.orgId) return;
  var container = document.getElementById('admin-staff-list');
  var countBadge = document.getElementById('admin-staff-count');
  if (!container) return;
  try {
    var snap = await db.collection('orgs').doc(AppState.orgId).collection('users').get();
    var staff = [];
    snap.forEach(function(doc) { staff.push(Object.assign({ id: doc.id }, doc.data())); });
    if (countBadge) countBadge.textContent = staff.length;
    if (staff.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No staff members yet.</p></div>';
      return;
    }
    var html = '';
    staff.forEach(function(member) {
      var isCurrentUser = AppState.user && member.id === AppState.user.uid;
      html += '<div class="staff-card"><div class="staff-card-info"><div class="staff-card-name">' + escapeHtml(member.name || 'Unknown') + (isCurrentUser ? ' <span style="font-size:11px;color:var(--text-muted);">(you)</span>' : '') + '</div><div class="staff-card-email">' + escapeHtml(member.email || 'No email') + '</div></div><div class="staff-card-actions"><select class="staff-role-select" data-user-id="' + escapeHtml(member.id) + '" onchange="changeStaffRole(\'' + escapeHtml(member.id) + '\', this.value)"><option value="carer"' + (member.role === 'carer' ? ' selected' : '') + '>Carer</option><option value="senior"' + (member.role === 'senior' ? ' selected' : '') + '>Senior</option><option value="manager"' + (member.role === 'manager' ? ' selected' : '') + '>Manager</option><option value="director"' + (member.role === 'director' ? ' selected' : '') + '>Director</option><option value="admin"' + (member.role === 'admin' ? ' selected' : '') + '>Admin</option></select>' + (isCurrentUser ? '' : '<button class="btn-remove-staff" onclick="removeStaffMember(\'' + escapeHtml(member.id) + '\', \'' + escapeHtml(member.name || 'this member') + '\')" title="Remove"><i class="fas fa-trash-can"></i></button>') + '</div></div>';
    });
    container.innerHTML = html;
  } catch (err) {
    console.error('Failed to load staff:', err);
    container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load staff list.</p></div>';
  }
}

async function addStaffMember() {
  var btn = document.getElementById('btn-add-staff');
  var btnText = btn ? btn.querySelector('.btn-text') : null;
  var spinner = btn ? btn.querySelector('.spinner') : null;
  var email = (document.getElementById('input-staff-email') || {}).value || '';
  var name = (document.getElementById('input-staff-name') || {}).value || '';
  var role = (document.getElementById('select-staff-role') || {}).value || 'carer';
  if (!email.trim() || !name.trim()) { showToast('Please enter both email and name', 'warning'); return; }
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Adding...';
  if (spinner) spinner.classList.remove('hidden');
  try {
    await db.collection('orgs').doc(AppState.orgId).collection('users').add({
      name: name.trim(), email: email.trim(), role: role,
      siteIds: [AppState.siteId || 'site_main'],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    logAudit('staff_added', 'Name: ' + name.trim() + ', Role: ' + role);
    showToast('Staff member added: ' + name.trim(), 'success');
    var emailInput = document.getElementById('input-staff-email');
    var nameInput = document.getElementById('input-staff-name');
    var roleSelect = document.getElementById('select-staff-role');
    if (emailInput) emailInput.value = '';
    if (nameInput) nameInput.value = '';
    if (roleSelect) roleSelect.selectedIndex = 0;
    loadStaffList();
  } catch (err) {
    console.error('Add staff error:', err);
    showToast('Failed to add staff: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Add Staff Member';
    if (spinner) spinner.classList.add('hidden');
  }
}

async function changeStaffRole(userId, newRole) {
  try {
    await db.collection('orgs').doc(AppState.orgId).collection('users').doc(userId).update({ role: newRole });
    logAudit('staff_role_changed', 'User: ' + userId + ', New role: ' + newRole);
    showToast('Role updated to ' + newRole, 'success');
  } catch (err) {
    console.error('Change staff role error:', err);
    showToast('Failed to update role: ' + err.message, 'error');
    loadStaffList();
  }
}

async function removeStaffMember(userId, memberName) {
  var btn = document.querySelector('.btn-remove-staff[onclick*="' + userId + '"]');
  if (btn && !btn.getAttribute('data-confirm')) {
    btn.setAttribute('data-confirm', 'true');
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.title = 'Click again to confirm removal';
    showToast('Click again to confirm removing ' + memberName, 'warning');
    setTimeout(function() { if (btn) { btn.removeAttribute('data-confirm'); btn.innerHTML = '<i class="fas fa-trash-can"></i>'; btn.title = 'Remove'; } }, 3000);
    return;
  }
  try {
    await db.collection('orgs').doc(AppState.orgId).collection('users').doc(userId).delete();
    logAudit('staff_removed', 'User: ' + userId + ', Name: ' + memberName);
    showToast(memberName + ' has been removed', 'success');
    loadStaffList();
  } catch (err) {
    console.error('Remove staff error:', err);
    showToast('Failed to remove: ' + err.message, 'error');
  }
}

// ======================================================================
//  ONBOARDING
// ======================================================================
function getOnboardingSteps() {
  var R = ActiveRegion;
  return [
    { icon: 'fas fa-shield-heart', title: 'Welcome to AlwaysReady Care', desc: 'Your compliance evidence layer. Record care, review evidence, and always be ready for ' + R.regulatorShort + ' ' + R.inspectionLabel.toLowerCase() + 's.' },
    { icon: 'fas fa-clipboard-check', title: 'Record Evidence in 60 Seconds', desc: 'Use templates to quickly document medication, personal care, meals, activities, and incidents.' },
    { icon: 'fas fa-circle-check', title: 'Review & Approve', desc: 'Seniors and managers review evidence. Only approved records count towards compliance.' },
    { icon: 'fas fa-chart-bar', title: 'Always ' + R.inspectionLabel + ' Ready', desc: 'See your compliance score, spot gaps, and generate ' + R.packLabel.toLowerCase() + 's with one click.' }
  ];
}
var ONBOARDING_STEPS = getOnboardingSteps();
var onboardingStep = 0;

function showOnboarding() {
  if (localStorage.getItem('arc-onboarded')) return;
  onboardingStep = 0;
  renderOnboardingStep(0);
  var modal = document.getElementById('modal-onboarding');
  if (modal) modal.classList.remove('hidden');
}

function renderOnboardingStep(index) {
  var step = ONBOARDING_STEPS[index];
  if (!step) return;
  var content = document.getElementById('onboarding-content');
  if (content) {
    content.innerHTML = '<div class="onboarding-icon"><i class="' + escapeHtml(step.icon) + '"></i></div><h2 class="onboarding-title">' + escapeHtml(step.title) + '</h2><p class="onboarding-desc">' + escapeHtml(step.desc) + '</p>';
  }
  var dotsContainer = document.getElementById('onboarding-dots');
  if (dotsContainer) {
    var dotsHtml = '';
    for (var i = 0; i < ONBOARDING_STEPS.length; i++) { dotsHtml += '<div class="onboarding-dot' + (i === index ? ' active' : '') + '"></div>'; }
    dotsContainer.innerHTML = dotsHtml;
  }
  var nextBtn = document.getElementById('btn-onboarding-next');
  if (nextBtn) nextBtn.textContent = (index === ONBOARDING_STEPS.length - 1) ? 'Get Started' : 'Next';
}

function nextOnboardingStep() {
  onboardingStep++;
  if (onboardingStep >= ONBOARDING_STEPS.length) { completeOnboarding(); }
  else { renderOnboardingStep(onboardingStep); }
}

function completeOnboarding() {
  localStorage.setItem('arc-onboarded', 'true');
  var modal = document.getElementById('modal-onboarding');
  if (modal) modal.classList.add('hidden');
  showToast("You're all set!", 'success');
}

function skipOnboarding() { completeOnboarding(); }

// ======================================================================
//  FAQ ACCORDION
// ======================================================================
function initFAQAccordion() {
  document.querySelectorAll('.faq-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var answer = this.nextElementSibling;
      var isOpen = !answer.classList.contains('hidden');
      if (isOpen) { answer.classList.add('hidden'); this.classList.remove('open'); }
      else { answer.classList.remove('hidden'); this.classList.add('open'); }
    });
  });
}

// ======================================================================
//  ORG NAME LOADER (Feature 5)
// ======================================================================
async function loadOrgName() {
  if (!AppState.orgId) return;
  try {
    var orgDoc = await db.collection('orgs').doc(AppState.orgId).get();
    if (orgDoc.exists) {
      var orgData = orgDoc.data();
      var homeName = orgData.name || '';
      var subtitle = document.getElementById('dashboard-subtitle');
      if (subtitle && homeName) {
        subtitle.textContent = homeName + ' \u2014 compliance overview';
      }
    }
  } catch (err) { console.error('Failed to load org name:', err); }
}

window.changeStaffRole = changeStaffRole;
window.removeStaffMember = removeStaffMember;
