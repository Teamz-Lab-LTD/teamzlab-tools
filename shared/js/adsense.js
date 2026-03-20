/**
 * Teamz Lab Tools — Google AdSense Integration (Auto Ads Only)
 * Publisher ID: ca-pub-7088022825081956
 *
 * Strategy:
 * 1. Auto Ads ON — Google handles all ad placement, format, and frequency
 * 2. No manual ad units — avoids competing with Auto Ads (which caused "vanishing" ads)
 * 3. Ad blocker detection tracked in Firebase/GA4
 * 4. Existing .ad-slot divs in HTML are left alone (used as layout anchors by common.js)
 *    — CSS collapses them since they have no adsbygoogle content
 * 5. In-app browsers: ads load AFTER user dismisses redirect overlay
 *    — fill rates are lower but some revenue > zero revenue
 *
 * Analytics Events Tracked:
 * - adsense_script_loaded     → AdSense JS loaded successfully
 * - adsense_script_blocked    → AdSense JS blocked (ad blocker)
 * - ad_blocker_detected       → Ad blocker preventing ads from loading
 * - auto_ads_initialized      → Auto Ads script loaded and running
 *
 * Google auto-tracks these (via AdSense↔GA4 link — no code needed):
 * - ad_unit_rendered, ad_display_success, ad_click, ad_viewability, ad_revenue_page
 */

(function () {
  'use strict';

  var PUB_ID = 'ca-pub-7088022825081956';

  // Don't run ads on homepage, about, contact, privacy, terms (non-content pages)
  var path = window.location.pathname;
  var noAdPages = ['/', '/about/', '/contact/', '/privacy/', '/terms/'];
  if (noAdPages.indexOf(path) !== -1) return;

  // Don't run in localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

  // In-app browser detection
  var ua = navigator.userAgent || '';
  var isInApp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Twitter|Snapchat|MicroMessenger|WeChat|TikTok|BytedanceWebview/i.test(ua);

  if (isInApp) {
    // Check if user already dismissed overlay in this session (returning visitor)
    var alreadySkipped = false;
    try { alreadySkipped = sessionStorage.getItem('tz_inapp_closed') === '1'; } catch(e) {}
    if (alreadySkipped) {
      // User already chose "Continue anyway" earlier — load ads immediately
      loadAds();
      return;
    }

    // Wait for overlay to appear first, THEN wait for it to be dismissed.
    // This prevents the race condition where adsense.js polls before
    // common.js has created the overlay DOM element.
    var overlayAppeared = false;
    var waitForSkip = setInterval(function() {
      var overlayExists = !!document.querySelector('.inapp-overlay');
      if (overlayExists) overlayAppeared = true;

      // Only load ads if overlay appeared AND was then removed (user skipped)
      if (overlayAppeared && !overlayExists) {
        clearInterval(waitForSkip);
        loadAds();
      }
    }, 500);

    // Safety timeout: if overlay never appears after 8s, user was likely
    // redirected to a real browser (Android intent / iOS Chrome scheme).
    // In that case this page will be abandoned — loading ads is harmless.
    setTimeout(function() { clearInterval(waitForSkip); loadAds(); }, 8000);
    return;
  }

  // Normal browsers: load ads immediately
  loadAds();

  function loadAds() {
    // Prevent double-load (safety for in-app timer + interval race)
    if (window.__tzAdsLoaded) return;
    window.__tzAdsLoaded = true;

    // --- Analytics helper: track ad events in Firebase + GA4 ---
    function trackAdEvent(eventName, params) {
      var fullParams = Object.assign({
        page_path: path,
        tool_slug: path.replace(/^\/|\/$/g, ''),
        timestamp: new Date().toISOString(),
        in_app_browser: isInApp ? 'yes' : 'no'
      }, params || {});

      if (window.gtag) {
        try { window.gtag('event', eventName, fullParams); } catch (e) {}
      }
      if (window._fbAnalytics) {
        try { window._fbAnalytics.logEvent(eventName, fullParams); } catch (e) {}
      }
    }

    // --- Retry analytics if not ready yet (Firebase loads async) ---
    function trackWithRetry(eventName, params, retries) {
      if (window.gtag || window._fbAnalytics) {
        trackAdEvent(eventName, params);
      } else if (retries > 0) {
        setTimeout(function () { trackWithRetry(eventName, params, retries - 1); }, 1000);
      }
    }

    // 1. Inject AdSense script — Auto Ads handles all placement
    var script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB_ID;
    script.onload = function () {
      trackWithRetry('adsense_script_loaded', { status: 'success' }, 5);
      trackWithRetry('auto_ads_initialized', {
        mode: 'auto_ads_only',
        device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop')
      }, 5);
    };
    script.onerror = function () {
      trackWithRetry('adsense_script_blocked', {
        status: 'blocked',
        reason: 'script_load_failed',
        likely_cause: 'ad_blocker'
      }, 5);
    };
    document.head.appendChild(script);

    // 2. Detect ad blocker (check if AdSense script actually created the global)
    setTimeout(function () {
      if (!window.adsbygoogle || typeof window.adsbygoogle.push !== 'function') {
        trackWithRetry('ad_blocker_detected', {
          blocker_type: 'adsense_global_missing',
          user_agent: ua.substring(0, 100)
        }, 5);
      }
    }, 3000);

    // 3. Hide existing .ad-slot placeholder text (the "Ad Space" text)
    function cleanAdSlots() {
      document.querySelectorAll('.ad-slot').forEach(function (slot) {
        slot.textContent = '';
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cleanAdSlots);
    } else {
      cleanAdSlots();
    }
  }
})();
