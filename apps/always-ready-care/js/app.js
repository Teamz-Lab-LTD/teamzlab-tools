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

// ── Compliance Categories (mapped to CQC 5 Key Questions) ─
var COMPLIANCE_CATEGORIES = [
  // SAFE
  'Medication Management',
  'Safeguarding',
  'Incident & Accident',
  'Infection Control',
  'Risk Assessment',
  'Falls Prevention',
  // EFFECTIVE
  'Care Planning',
  'Nutrition & Hydration',
  'Health Monitoring',
  'Mental Capacity & DoLS',
  'Staff Training & Competency',
  // CARING
  'Personal Care & Dignity',
  'Activities & Wellbeing',
  'Communication & Engagement',
  // RESPONSIVE
  'Complaints & Feedback',
  'End of Life Care',
  'Person-Centred Care',
  // WELL-LED
  'Governance & Audits',
  'Staff Supervision',
  'Night Care',
  'Duty of Candour'
];

var CQC_KEY_QUESTIONS = {
  'Safe': ['Medication Management', 'Safeguarding', 'Incident & Accident', 'Infection Control', 'Risk Assessment', 'Falls Prevention'],
  'Effective': ['Care Planning', 'Nutrition & Hydration', 'Health Monitoring', 'Mental Capacity & DoLS', 'Staff Training & Competency'],
  'Caring': ['Personal Care & Dignity', 'Activities & Wellbeing', 'Communication & Engagement'],
  'Responsive': ['Complaints & Feedback', 'End of Life Care', 'Person-Centred Care'],
  'Well-led': ['Governance & Audits', 'Staff Supervision', 'Night Care', 'Duty of Candour']
};

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
      actions.push('Notify registered manager and local authority');
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
      await seedDemoData(user, orgId);
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
async function seedDemoData(user, orgId) {
  var batch = db.batch();
  var now = firebase.firestore.Timestamp.now();

  // Org doc
  batch.set(db.collection('orgs').doc(orgId), {
    name: 'Demo Care Home',
    createdAt: now,
    ownerUid: user.uid
  });

  // Site
  var siteRef = db.collection('orgs').doc(orgId).collection('sites').doc('site_main');
  batch.set(siteRef, {
    name: 'Sunrise Care Home',
    address: '42 Maple Drive, Bristol, BS1 4QR',
    createdAt: now
  });

  // User
  var displayName = user.displayName || user.email || 'Guest User';
  if (user.isAnonymous) displayName = 'Guest (Demo)';
  batch.set(db.collection('orgs').doc(orgId).collection('users').doc(user.uid), {
    name: displayName,
    email: user.email || '',
    role: 'manager',
    siteIds: ['site_main'],
    createdAt: now
  });

  // Compliance categories config
  batch.set(db.collection('orgs').doc(orgId).collection('config').doc('categories'), {
    required: COMPLIANCE_CATEGORIES,
    updatedAt: now
  });

  await batch.commit();

  // Create sample evidence (separate batch for subcollections)
  var batch2 = db.batch();

  var sampleEvidence = [
    {
      type: 'text',
      rawText: 'Medication administered to Mrs. Johnson at 08:00. Paracetamol 500mg given orally as prescribed. Resident was alert and cooperative. No adverse reactions observed. Medication taken with water and breakfast.',
      status: 'approved',
      manualTags: ['medication'],
      siteId: 'site_main',
      createdByUid: user.uid,
      createdByName: displayName,
      createdAt: firebase.firestore.Timestamp.fromDate(daysAgo(0)),
      reviewedByUid: user.uid,
      reviewedAt: now
    },
    {
      type: 'text',
      rawText: 'Personal care provided to Mr. Smith at 09:30. Assisted with morning wash, oral hygiene, and dressing. Skin integrity checked — no concerns noted. Resident chose own clothing. Dignity and privacy maintained throughout. Mood was pleasant.',
      status: 'submitted',
      manualTags: ['personal-care'],
      siteId: 'site_main',
      createdByUid: user.uid,
      createdByName: displayName,
      createdAt: firebase.firestore.Timestamp.fromDate(daysAgo(0))
    },
    {
      type: 'text',
      rawText: 'Meal support provided to Mrs. Davies during lunch. Soft diet served as per care plan. Consumed most of main course and all dessert. Fluid intake approximately 200ml. No signs of swallowing difficulties. Resident enjoyed the meal and chatted with tablemates.',
      status: 'approved',
      manualTags: ['nutrition'],
      siteId: 'site_main',
      createdByUid: user.uid,
      createdByName: displayName,
      createdAt: firebase.firestore.Timestamp.fromDate(daysAgo(1)),
      reviewedByUid: user.uid,
      reviewedAt: now
    },
    {
      type: 'incident',
      rawText: 'INCIDENT: Mr. Wilson had a fall in the corridor at 14:20. Found on the floor near room 12. No visible injuries sustained. Resident was alert and oriented. Assisted back to feet with two staff. Vital signs checked — all within normal range. GP notified. Family informed at 15:00. Falls risk assessment to be reviewed.',
      status: 'submitted',
      manualTags: ['safety'],
      siteId: 'site_main',
      createdByUid: user.uid,
      createdByName: displayName,
      createdAt: firebase.firestore.Timestamp.fromDate(daysAgo(2))
    }
  ];

  sampleEvidence.forEach(function(ev) {
    var ref = db.collection('orgs').doc(orgId).collection('evidence').doc();
    batch2.set(ref, ev);
  });

  // Sample actions
  var sampleActions = [
    {
      title: 'Review falls risk assessment for Mr. Wilson',
      priority: 'high',
      status: 'open',
      dueDate: firebase.firestore.Timestamp.fromDate(daysAgo(-1)),
      siteId: 'site_main',
      createdAt: firebase.firestore.Timestamp.fromDate(daysAgo(2))
    },
    {
      title: 'Update medication chart for Mrs. Johnson',
      priority: 'medium',
      status: 'open',
      dueDate: firebase.firestore.Timestamp.fromDate(daysAgo(-3)),
      siteId: 'site_main',
      createdAt: firebase.firestore.Timestamp.fromDate(daysAgo(1))
    },
    {
      title: 'Complete monthly fire safety check',
      priority: 'critical',
      status: 'open',
      dueDate: firebase.firestore.Timestamp.fromDate(daysAgo(1)),
      siteId: 'site_main',
      createdAt: firebase.firestore.Timestamp.fromDate(daysAgo(5))
    }
  ];

  sampleActions.forEach(function(ac) {
    var ref = db.collection('orgs').doc(orgId).collection('actions').doc();
    batch2.set(ref, ac);
  });

  await batch2.commit();
  AppState.siteId = 'site_main';
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

    var doc = {
      type: type,
      rawText: rawText,
      status: 'submitted',
      manualTags: analysis.tags,
      riskLevel: analysis.riskLevel,
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
      var offlineDoc = {
        id: 'offline_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        orgId: AppState.orgId,
        type: type,
        rawText: rawText,
        status: 'submitted',
        manualTags: AIEngine.analyze(rawText).tags,
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

  var tagToCategoryMap = {
    'medication': 'Medication Management',
    'personal-care': 'Personal Care',
    'nutrition': 'Nutrition & Hydration',
    'skin-care': 'Skin Integrity',
    'mobility': 'Falls Prevention',
    'mental-health': 'Mental Health & Wellbeing',
    'social': 'Activities & Engagement',
    'infection-control': 'Infection Control',
    'safeguarding': 'Safeguarding',
    'safety': 'Health & Safety'
  };

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
      '<h1>AlwaysReady Care — Inspection Evidence Pack</h1>' +
      '<p><strong>Period:</strong> ' + escapeHtml(startDate) + ' to ' + escapeHtml(endDate) + '</p>' +
      '<p><strong>Generated:</strong> ' + new Date().toLocaleDateString('en-GB') + '</p>' +
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
    a.download = 'inspection-pack-' + startDate + '-to-' + endDate + '.html';
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
  TEMPLATES.forEach(function(tpl) {
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
  var tpl = TEMPLATES.find(function(t) { return t.id === templateId; });
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

  // If template is incident, switch to incident type
  if (tpl.id === 'incident-occurred') {
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
//  EVENT LISTENERS — Wired up on DOMContentLoaded
// ======================================================================
document.addEventListener('DOMContentLoaded', function() {
  // Apply saved theme
  setTheme(getTheme());

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
  if (!name.trim()) { showToast('Please enter a care home name', 'warning'); return; }
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Saving...';
  if (spinner) spinner.classList.remove('hidden');
  try {
    await db.collection('orgs').doc(AppState.orgId).update({ name: name.trim(), address: address.trim() });
    logAudit('home_settings_updated', 'Name: ' + name.trim());
    showToast('Care home settings saved', 'success');
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
var ONBOARDING_STEPS = [
  { icon: 'fas fa-shield-heart', title: 'Welcome to AlwaysReady Care', desc: 'Your compliance evidence layer. Record care, review evidence, and always be ready for CQC.' },
  { icon: 'fas fa-clipboard-check', title: 'Record Evidence in 60 Seconds', desc: 'Use templates to quickly document medication, personal care, meals, activities, and incidents.' },
  { icon: 'fas fa-circle-check', title: 'Review & Approve', desc: 'Seniors and managers review evidence. Only approved records count towards compliance.' },
  { icon: 'fas fa-chart-bar', title: 'Always Inspection Ready', desc: 'See your compliance score, spot gaps, and generate inspection packs with one click.' }
];
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
      if (subtitle && homeName && homeName !== 'Demo Care Home') {
        subtitle.textContent = homeName + ' \u2014 compliance overview';
      }
    }
  } catch (err) { console.error('Failed to load org name:', err); }
}

window.changeStaffRole = changeStaffRole;
window.removeStaffMember = removeStaffMember;
