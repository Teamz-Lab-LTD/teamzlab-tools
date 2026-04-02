/**
 * TeamzAuth — Central Authentication Module
 *
 * Provides Google Sign-In (Firebase Auth) across all tools.
 * Tools can gate actions behind auth without blocking the UI.
 *
 * Usage in tools:
 *   // Gate an action — shows login modal if not signed in
 *   TeamzAuth.requireAuth(function(user) {
 *     // user is guaranteed signed in here
 *     console.log(user.displayName, user.email, user.photoURL, user.uid);
 *     doProtectedAction();
 *   });
 *
 *   // Check auth state
 *   if (TeamzAuth.isLoggedIn()) { ... }
 *   var user = TeamzAuth.getUser();
 *
 *   // Listen for auth changes
 *   TeamzAuth.onAuthChange(function(user) { ... });
 *
 *   // Get ID token for backend calls (Cloud Functions)
 *   TeamzAuth.getToken().then(function(token) { fetch(url, { headers: { Authorization: 'Bearer ' + token } }); });
 *
 *   // Logout
 *   TeamzAuth.logout();
 */
var TeamzAuth = (function () {
  'use strict';

  var _user = null;
  var _ready = false;
  var _authListeners = [];
  var _pendingCallback = null;
  var _authSDKLoaded = false;
  var _initPromise = null;
  var _initResolve = null;

  // Storage keys
  var STORAGE_KEY = 'tz_auth_user';
  var USAGE_KEY = 'tz_auth_usage';

  // ─── Self-load Firebase if common.js didn't (dev mode, bot detection) ───
  var FIREBASE_AUTH_CONFIG = {
    apiKey: "AIzaSyC9Spv8AEEST24cqHWOfWe4PKTJflJ6lPg",
    authDomain: "teamzlab-tools.firebaseapp.com",
    projectId: "teamzlab-tools"
  };

  function _selfLoadFirebase(cb) {
    var script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js';
    script.onload = function () {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(FIREBASE_AUTH_CONFIG);
      }
      cb();
    };
    script.onerror = function () {
      console.warn('TeamzAuth: Could not load Firebase SDK');
    };
    document.head.appendChild(script);
  }

  // ─── Cached user from localStorage (instant UI on page load) ───
  function _getCachedUser() {
    try {
      var cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  }

  function _setCachedUser(user) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }

  // ─── Load Firebase Auth SDK ───
  function _loadAuthSDK(callback) {
    if (_authSDKLoaded) { callback(); return; }

    // Wait for Firebase core to be ready
    // common.js may or may not load Firebase (skipped in dev mode / bot detection)
    // So we load it ourselves if needed
    function _waitForFirebase(cb) {
      // Already loaded?
      if (typeof firebase !== 'undefined' && firebase.app) {
        cb();
        return;
      }

      // Already signaled ready by common.js?
      if (window._firestoreReady) {
        cb();
        return;
      }

      // Listen for the event from common.js (fires on production for human visitors)
      var resolved = false;
      window.addEventListener('firestoreReady', function onReady() {
        window.removeEventListener('firestoreReady', onReady);
        if (!resolved) { resolved = true; cb(); }
      });

      // Also self-load Firebase after a short delay if common.js hasn't done it
      // This handles: localhost dev mode, bot-classified visitors, slow networks
      setTimeout(function () {
        if (resolved) return;
        if (typeof firebase !== 'undefined' && firebase.app) {
          resolved = true; cb(); return;
        }
        _selfLoadFirebase(function () {
          if (!resolved) { resolved = true; cb(); }
        });
      }, 300);
    }

    _waitForFirebase(function () {
      // Check if auth is already loaded
      if (firebase.auth) {
        _authSDKLoaded = true;
        callback();
        return;
      }

      var script = document.createElement('script');
      script.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js';
      script.onload = function () {
        _authSDKLoaded = true;
        callback();
      };
      script.onerror = function () {
        console.warn('TeamzAuth: Failed to load Firebase Auth SDK');
      };
      document.head.appendChild(script);
    });
  }

  // ─── Initialize auth listener ───
  function _initAuth() {
    if (_initPromise) return _initPromise;

    _initPromise = new Promise(function (resolve) {
      _initResolve = resolve;

      // Load cached user immediately for instant header render
      _user = _getCachedUser();
      if (_user) _renderHeaderAuth();

      _loadAuthSDK(function () {
        // Handle redirect result (when user returns from Google sign-in redirect)
        firebase.auth().getRedirectResult().then(function (result) {
          if (result && result.user) {
            if (window.showToast) window.showToast('Welcome, ' + (result.user.displayName || result.user.email) + '!');
            if (window.gtag) {
              try { window.gtag('event', 'login', { method: 'google' }); } catch (e) {}
            }
          }
        }).catch(function (err) {
          if (err.code && err.code !== 'auth/popup-closed-by-user') {
            console.warn('TeamzAuth: Redirect result error', err.code);
          }
        });

        firebase.auth().onAuthStateChanged(function (firebaseUser) {
          if (firebaseUser) {
            _user = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL
            };
            _setCachedUser(_user);
          } else {
            _user = null;
            _setCachedUser(null);
          }

          _ready = true;
          _renderHeaderAuth();
          _notifyListeners();

          // GA4 track
          if (window.gtag && _user) {
            try {
              window.gtag('set', 'user_properties', { logged_in: 'true' });
              window.gtag('set', { user_id: _user.uid });
            } catch (e) {}
          }

          resolve(_user);
        });
      });
    });

    return _initPromise;
  }

  // ─── Notify auth change listeners ───
  function _notifyListeners() {
    for (var i = 0; i < _authListeners.length; i++) {
      try { _authListeners[i](_user); } catch (e) {}
    }
  }

  // ─── Header Auth UI ───
  function _renderHeaderAuth() {
    var container = document.getElementById('tz-auth-container');
    if (!container) return;

    if (_user) {
      // Logged in — show avatar + dropdown
      var initial = (_user.displayName || _user.email || '?').charAt(0).toUpperCase();
      var avatarHtml = _user.photoURL
        ? '<img src="' + _user.photoURL + '" alt="" class="tz-auth-avatar" referrerpolicy="no-referrer">'
        : '<span class="tz-auth-avatar tz-auth-avatar--initial">' + initial + '</span>';

      container.innerHTML =
        '<div class="tz-auth-wrap">' +
          '<button class="tz-auth-btn tz-auth-btn--user header-icon-btn nav-link--icon" aria-label="Account menu" title="' + (_user.displayName || _user.email) + '">' +
            avatarHtml +
          '</button>' +
          '<div class="tz-auth-dropdown" id="tz-auth-dropdown" style="display:none;">' +
            '<div class="tz-auth-dropdown__header">' +
              avatarHtml +
              '<div class="tz-auth-dropdown__info">' +
                '<div class="tz-auth-dropdown__name">' + _escapeHtml(_user.displayName || 'User') + '</div>' +
                '<div class="tz-auth-dropdown__email">' + _escapeHtml(_user.email || '') + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="tz-auth-dropdown__divider"></div>' +
            '<button class="tz-auth-dropdown__item tz-auth-logout-btn">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
              ' Sign Out' +
            '</button>' +
          '</div>' +
        '</div>';

      // Wire dropdown toggle
      var userBtn = container.querySelector('.tz-auth-btn--user');
      var dropdown = document.getElementById('tz-auth-dropdown');
      if (userBtn && dropdown) {
        userBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = dropdown.style.display !== 'none';
          dropdown.style.display = isOpen ? 'none' : 'block';
        });
        document.addEventListener('click', function () {
          dropdown.style.display = 'none';
        });
        dropdown.addEventListener('click', function (e) { e.stopPropagation(); });
      }

      // Wire logout
      var logoutBtn = container.querySelector('.tz-auth-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
          TeamzAuth.logout();
          if (dropdown) dropdown.style.display = 'none';
        });
      }
    } else {
      // Not logged in — show sign-in button
      container.innerHTML =
        '<button class="tz-auth-btn tz-auth-btn--login header-icon-btn nav-link--icon" aria-label="Sign in" title="Sign in">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        '</button>';

      var loginBtn = container.querySelector('.tz-auth-btn--login');
      if (loginBtn) {
        loginBtn.addEventListener('click', function () {
          _showLoginModal();
        });
      }
    }
  }

  // ─── Login Modal ───
  function _showLoginModal() {
    // Remove existing modal if any
    var existing = document.getElementById('tz-auth-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'tz-auth-modal';
    modal.className = 'tz-auth-modal';
    modal.innerHTML =
      '<div class="tz-auth-modal__backdrop"></div>' +
      '<div class="tz-auth-modal__dialog">' +
        '<button class="tz-auth-modal__close" aria-label="Close">&times;</button>' +
        '<div class="tz-auth-modal__header">' +
          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' +
          '<h2>Sign in to Teamz Lab Tools</h2>' +
          '<p>Unlock AI-powered features, save your work, and more.</p>' +
        '</div>' +
        '<div class="tz-auth-modal__body">' +
          '<button class="tz-auth-google-btn" id="tz-auth-google-btn">' +
            '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>' +
            ' Continue with Google' +
          '</button>' +
          '<div class="tz-auth-modal__status" id="tz-auth-status" style="display:none;"></div>' +
        '</div>' +
        '<div class="tz-auth-modal__footer">' +
          '<p>Your data stays private. We only use your name and email for account features.</p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Wire close
    var closeBtn = modal.querySelector('.tz-auth-modal__close');
    var backdrop = modal.querySelector('.tz-auth-modal__backdrop');
    function closeModal() {
      modal.remove();
      document.body.style.overflow = '';
      _pendingCallback = null;
    }
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // ESC key
    function onEsc(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onEsc);
      }
    }
    document.addEventListener('keydown', onEsc);

    // Wire Google sign-in
    var googleBtn = document.getElementById('tz-auth-google-btn');
    var statusEl = document.getElementById('tz-auth-status');
    if (googleBtn) {
      googleBtn.addEventListener('click', function () {
        googleBtn.disabled = true;
        googleBtn.textContent = 'Signing in...';
        statusEl.style.display = 'none';

        _loginWithGoogle().then(function (user) {
          if (window.showToast) window.showToast('Welcome, ' + (user.displayName || user.email) + '!');
          if (window.gtag) {
            try { window.gtag('event', 'login', { method: 'google' }); } catch (e) {}
          }

          modal.remove();
          document.body.style.overflow = '';

          // Execute pending callback
          if (_pendingCallback) {
            var cb = _pendingCallback;
            _pendingCallback = null;
            cb(_user);
          }
        }).catch(function (err) {
          googleBtn.disabled = false;
          googleBtn.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>' +
            ' Continue with Google';

          if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
            return; // User cancelled — no error message needed
          }

          var msg = 'Sign-in failed. Please try again.';
          if (err.code === 'auth/operation-not-allowed') {
            msg = 'Google sign-in is not enabled yet.';
          } else if (err.code === 'auth/network-request-failed') {
            msg = 'Network error. Check your connection.';
          } else if (err.code === 'auth/unauthorized-domain') {
            msg = 'This domain is not authorized. Add it in Firebase Console → Auth → Settings → Authorized domains.';
          }
          statusEl.textContent = msg;
          statusEl.style.display = 'block';
          console.warn('TeamzAuth:', err.code, err.message);
        });
      });
    }
  }

  // ─── Google Sign-In ───
  function _loginWithGoogle() {
    return new Promise(function (resolve, reject) {
      _loadAuthSDK(function () {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        // Use popup (works on desktop + localhost, avoids redirect issues)
        // Falls back to redirect only if popup is blocked
        firebase.auth().signInWithPopup(provider).then(function (result) {
          resolve({
            uid: result.user.uid,
            displayName: result.user.displayName,
            email: result.user.email,
            photoURL: result.user.photoURL
          });
        }).catch(function (err) {
          if (err.code === 'auth/popup-blocked') {
            // Fallback: redirect (for strict popup blockers)
            firebase.auth().signInWithRedirect(provider).catch(reject);
          } else {
            reject(err);
          }
        });
      });
    });
  }

  // ─── Usage Tracking (per-user daily limits) ───
  function _getUsageToday(feature) {
    try {
      var data = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
      var today = new Date().toISOString().split('T')[0];
      if (data.date !== today) return 0;
      return (data[feature] || 0);
    } catch (e) { return 0; }
  }

  function _incrementUsage(feature) {
    try {
      var data = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
      var today = new Date().toISOString().split('T')[0];
      if (data.date !== today) {
        data = { date: today };
      }
      data[feature] = (data[feature] || 0) + 1;
      localStorage.setItem(USAGE_KEY, JSON.stringify(data));
      return data[feature];
    } catch (e) { return 0; }
  }

  // ─── Escape HTML helper ───
  function _escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ─── Inject header auth container ───
  function _injectAuthContainer() {
    // Wait for header to be rendered, then inject auth container before theme toggle
    var nav = document.querySelector('.header-nav');
    if (!nav) return;

    // Don't inject twice
    if (document.getElementById('tz-auth-container')) return;

    var container = document.createElement('div');
    container.id = 'tz-auth-container';
    container.className = 'tz-auth-container';

    // Insert before the theme toggle button
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      nav.insertBefore(container, themeToggle);
    } else {
      nav.appendChild(container);
    }

    _renderHeaderAuth();
  }

  // ─── Auto-initialize ───
  // Wait for DOMContentLoaded + header render, then inject auth
  function _autoInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        // Give common.js time to render header
        setTimeout(function () {
          _injectAuthContainer();
          _initAuth();
        }, 50);
      });
    } else {
      setTimeout(function () {
        _injectAuthContainer();
        _initAuth();
      }, 50);
    }
  }

  _autoInit();

  // ─── Public API ───
  return {
    /**
     * Check if user is currently logged in
     * @returns {boolean}
     */
    isLoggedIn: function () {
      return !!_user;
    },

    /**
     * Get current user object { uid, displayName, email, photoURL }
     * @returns {Object|null}
     */
    getUser: function () {
      return _user;
    },

    /**
     * Get Firebase ID token for backend API calls
     * @returns {Promise<string>}
     */
    getToken: function () {
      return new Promise(function (resolve, reject) {
        _loadAuthSDK(function () {
          var currentUser = firebase.auth().currentUser;
          if (currentUser) {
            currentUser.getIdToken().then(resolve).catch(reject);
          } else {
            reject(new Error('Not logged in'));
          }
        });
      });
    },

    /**
     * Gate an action behind auth — if not logged in, show login modal first.
     * Once logged in, the callback fires with the user object.
     *
     * @param {Function} callback - function(user) to call when authenticated
     * @param {Object} [options] - { feature: 'ai-interview', dailyLimit: 5 }
     */
    requireAuth: function (callback, options) {
      var opts = options || {};

      if (_user) {
        // Already logged in — check usage limits if specified
        if (opts.feature && opts.dailyLimit) {
          var used = _getUsageToday(opts.feature);
          if (used >= opts.dailyLimit) {
            if (window.showToast) {
              window.showToast('Daily limit reached (' + opts.dailyLimit + '/' + opts.dailyLimit + '). Upgrade for unlimited access.');
            }
            return;
          }
          _incrementUsage(opts.feature);
        }
        callback(_user);
        return;
      }

      // Not logged in — save callback and show modal
      _pendingCallback = function (user) {
        // Check limits after login too
        if (opts.feature && opts.dailyLimit) {
          var used = _getUsageToday(opts.feature);
          if (used >= opts.dailyLimit) {
            if (window.showToast) {
              window.showToast('Daily limit reached. Upgrade for unlimited access.');
            }
            return;
          }
          _incrementUsage(opts.feature);
        }
        callback(user);
      };
      _showLoginModal();
    },

    /**
     * Register a callback for auth state changes
     * @param {Function} callback - function(user|null)
     */
    onAuthChange: function (callback) {
      _authListeners.push(callback);
      // Fire immediately with current state if ready
      if (_ready) {
        try { callback(_user); } catch (e) {}
      }
    },

    /**
     * Trigger login modal manually
     */
    login: function () {
      if (_user) {
        if (window.showToast) window.showToast('Already signed in as ' + (_user.displayName || _user.email));
        return;
      }
      _showLoginModal();
    },

    /**
     * Sign out
     */
    logout: function () {
      _loadAuthSDK(function () {
        firebase.auth().signOut().then(function () {
          _user = null;
          _setCachedUser(null);
          _renderHeaderAuth();
          _notifyListeners();
          if (window.showToast) window.showToast('Signed out');
          if (window.gtag) {
            try { window.gtag('event', 'logout'); } catch (e) {}
          }
        }).catch(function (err) {
          console.warn('TeamzAuth: Logout error', err);
        });
      });
    },

    /**
     * Get today's usage count for a feature
     * @param {string} feature
     * @returns {number}
     */
    getUsage: function (feature) {
      return _getUsageToday(feature);
    },

    /**
     * Promise that resolves when auth is fully initialized
     * @returns {Promise}
     */
    ready: function () {
      return _initPromise || _initAuth();
    },

    /**
     * Re-render the header auth UI (call after header re-render)
     */
    refreshUI: function () {
      _injectAuthContainer();
      _renderHeaderAuth();
    },

    /**
     * Call a Firebase Cloud Function (authenticated).
     * Loads the Functions SDK on first use.
     *
     * Usage:
     *   TeamzAuth.callFunction('aiGenerate', {
     *     feature: 'interview-practice',
     *     prompt: 'Give me 5 behavioral questions',
     *     options: { maxTokens: 500 }
     *   }).then(function(result) { console.log(result.data.text); });
     *
     * @param {string} name - Cloud Function name
     * @param {Object} data - payload
     * @returns {Promise<Object>} - function response
     */
    callFunction: function (name, data) {
      return new Promise(function (resolve, reject) {
        _loadAuthSDK(function () {
          // Load Functions SDK if not loaded
          if (!firebase.functions) {
            var script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-functions-compat.js';
            script.onload = function () {
              _callFn(name, data, resolve, reject);
            };
            script.onerror = function () {
              reject(new Error('Failed to load Cloud Functions SDK'));
            };
            document.head.appendChild(script);
          } else {
            _callFn(name, data, resolve, reject);
          }
        });
      });
    }
  };

  function _callFn(name, data, resolve, reject) {
    var functions = firebase.app().functions('us-central1');
    var callable = functions.httpsCallable(name);
    callable(data).then(function (result) {
      resolve(result.data);
    }).catch(function (err) {
      if (err.code === 'unauthenticated') {
        // Token expired — re-login
        _user = null;
        _setCachedUser(null);
        _renderHeaderAuth();
        if (window.showToast) window.showToast('Session expired. Please sign in again.');
      }
      reject(err);
    });
  }
})();
