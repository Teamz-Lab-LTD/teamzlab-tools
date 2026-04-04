/**
 * TeamzUserData — central Firestore sync for signed-in users.
 *
 * Uses existing security rules: match /user_data/{userId}/{document=**}
 * Path: user_data/{uid}/tools/interview_practice_simulator
 *
 * Interview Practice Simulator stores the same strings as localStorage keys.
 * Other tools can add helpers following the same pattern (collection tools, doc per tool).
 */
var TeamzUserData = (function () {
  'use strict';

  var DOC_ID = 'interview_practice_simulator';
  var COL_TOOLS = 'tools';

  /** Firestore field name → localStorage key (raw JSON strings). */
  var INTERVIEW_SIMULATOR_FIELDS = {
    srs: 'tz_ims_srs',
    sessions: 'tz_ims_sessions',
    bookmarks: 'tz_ims_bookmarks',
    pitches: 'tz_ims_pitches',
    journal: 'tz_ims_journal',
    companyPrep: 'tz_ims_company_prep',
    projects: 'tz_ims_projects'
  };

  var _debounceTimer = null;
  var DEBOUNCE_MS = 2200;

  function getDb() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      return firebase.firestore();
    }
    return null;
  }

  function getUid() {
    if (typeof TeamzAuth === 'undefined' || !TeamzAuth.isLoggedIn || !TeamzAuth.isLoggedIn()) {
      return null;
    }
    var u = TeamzAuth.getUser && TeamzAuth.getUser();
    return u && u.uid ? u.uid : null;
  }

  function interviewSimulatorRef() {
    var uid = getUid();
    var db = getDb();
    if (!uid || !db) return null;
    return db.collection('user_data').doc(uid).collection(COL_TOOLS).doc(DOC_ID);
  }

  function buildInterviewSimulatorPayload() {
    var o = { updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    Object.keys(INTERVIEW_SIMULATOR_FIELDS).forEach(function (field) {
      var lsKey = INTERVIEW_SIMULATOR_FIELDS[field];
      var v = null;
      try {
        v = localStorage.getItem(lsKey);
      } catch (e) {}
      if (v !== null && v !== undefined && v !== '') {
        o[field] = v;
      } else {
        o[field] = firebase.firestore.FieldValue.delete();
      }
    });
    return o;
  }

  function applyInterviewSimulatorFromCloud(data) {
    if (!data || typeof data !== 'object') return;
    Object.keys(INTERVIEW_SIMULATOR_FIELDS).forEach(function (field) {
      var lsKey = INTERVIEW_SIMULATOR_FIELDS[field];
      var v = data[field];
      try {
        if (typeof v === 'string' && v.length > 0) {
          localStorage.setItem(lsKey, v);
        } else {
          localStorage.removeItem(lsKey);
        }
      } catch (e) {}
    });
  }

  function pushInterviewSimulator() {
    var ref = interviewSimulatorRef();
    if (!ref) return;
    var payload = buildInterviewSimulatorPayload();
    ref
      .set(payload, { merge: true })
      .catch(function (e) {
        console.warn('TeamzUserData: interview simulator sync failed', e);
      });
  }

  function pullInterviewSimulator(callback) {
    var ref = interviewSimulatorRef();
    if (!ref) {
      if (callback) callback(false);
      return;
    }
    ref
      .get()
      .then(function (doc) {
        if (doc.exists) {
          applyInterviewSimulatorFromCloud(doc.data());
          if (callback) callback(true);
        } else {
          if (callback) callback(false);
        }
      })
      .catch(function (e) {
        console.warn('TeamzUserData: interview simulator pull failed', e);
        if (callback) callback(false);
      });
  }

  function scheduleInterviewSimulatorSave() {
    if (!getUid()) return;
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function () {
      _debounceTimer = null;
      pushInterviewSimulator();
    }, DEBOUNCE_MS);
  }

  function flushInterviewSimulatorSave() {
    if (_debounceTimer) {
      clearTimeout(_debounceTimer);
      _debounceTimer = null;
    }
    if (getUid()) pushInterviewSimulator();
  }

  function initInterviewPracticeSimulatorSync() {
    function tryPull() {
      if (!window._firestoreReady || !getDb()) return;
      if (!getUid()) return;
      pullInterviewSimulator(function () {
        try {
          window.dispatchEvent(new CustomEvent('imsCloudSyncLoaded'));
        } catch (e) {}
      });
    }

    window.addEventListener(
      'firestoreReady',
      function () {
        tryPull();
      },
      { once: true }
    );
    if (window._firestoreReady) tryPull();

    if (typeof TeamzAuth !== 'undefined' && TeamzAuth.onAuthChange) {
      TeamzAuth.onAuthChange(function (user) {
        if (user && window._firestoreReady) tryPull();
      });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushInterviewSimulatorSave();
    });

    window.addEventListener('pagehide', function () {
      flushInterviewSimulatorSave();
    });
  }

  return {
    INTERVIEW_SIMULATOR_FIELDS: INTERVIEW_SIMULATOR_FIELDS,
    initInterviewPracticeSimulatorSync: initInterviewPracticeSimulatorSync,
    scheduleInterviewSimulatorSave: scheduleInterviewSimulatorSave,
    flushInterviewSimulatorSave: flushInterviewSimulatorSave,
    pushInterviewSimulator: pushInterviewSimulator,
    pullInterviewSimulator: pullInterviewSimulator
  };
})();
