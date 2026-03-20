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
 *
 * Analytics Events Tracked:
 * - adsense_script_loaded     → AdSense JS loaded successfully
 * - adsense_script_blocked    → AdSense JS blocked (ad blocker)
 * - ad_blocker_detected       → Ad blocker preventing ads from loading
 * - auto_ads_initialized      → Auto Ads script loaded and running
 * - ad_impression_confirmed   → At least 1 ad actually rendered on page (ads_filled count)
 * - ad_no_impression          → AdSense loaded but no ads rendered (low inventory/geo)
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

  // Don't run in in-app browsers (Messenger, Facebook, Instagram, etc.)
  var ua = navigator.userAgent || '';
  if (/FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Twitter|Snapchat/i.test(ua)) return;

  // --- Analytics helper: track ad events in Firebase + GA4 ---
  function trackAdEvent(eventName, params) {
    var fullParams = Object.assign({
      page_path: path,
      tool_slug: path.replace(/^\/|\/$/g, ''),
      timestamp: new Date().toISOString()
    }, params || {});

    // GA4 gtag
    if (window.gtag) {
      try { window.gtag('event', eventName, fullParams); } catch (e) {}
    }
    // Firebase Analytics
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

  // 3. Detect actual ad impressions (Auto Ads injects iframes dynamically)
  setTimeout(function () {
    var autoAdFrames = document.querySelectorAll('ins.adsbygoogle[data-ad-status="filled"], iframe[id^="aswift_"], iframe[id^="google_ads_iframe"]');
    var filled = autoAdFrames.length;
    var allIns = document.querySelectorAll('ins.adsbygoogle');
    var unfilled = 0;
    allIns.forEach(function (ins) {
      if (ins.dataset.adStatus === 'unfilled') unfilled++;
    });

    if (filled > 0) {
      trackWithRetry('ad_impression_confirmed', {
        ads_filled: filled,
        ads_unfilled: unfilled,
        device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop')
      }, 5);
    } else if (window.adsbygoogle && !unfilled) {
      trackWithRetry('ad_no_impression', {
        reason: 'no_auto_ads_rendered',
        adsense_loaded: true,
        ins_tags: allIns.length
      }, 5);
    }
  }, 5000);

  // 4. Hide existing .ad-slot placeholder text (the "Ad Space" text)
  //    These divs stay in DOM (common.js uses them as layout anchors)
  //    but CSS already collapses them since they have no adsbygoogle content
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
})();
