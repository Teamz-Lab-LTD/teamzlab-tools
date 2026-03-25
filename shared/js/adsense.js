/**
 * Teamz Lab Tools — Google AdSense Integration (Auto Ads + Manual Units)
 * Publisher ID: ca-pub-7088022825081956
 *
 * Strategy:
 * 1. Auto Ads ON — handles anchor, side rail placements automatically
 * 2. Manual ad units injected centrally — 3 in-article + 1 multiplex per tool page
 * 3. Manual ads ONLY on tool pages (pages with .tool-content) — not hubs or static pages
 * 4. Ad blocker detection tracked in Firebase/GA4
 * 5. In-app browsers: ads load AFTER user dismisses redirect overlay
 *
 * Manual Ad Units (tool pages only):
 * - teamzlab-below-tool     → In-article, placed in .ad-slot div (below calculator)
 * - teamzlab-mid-content-1  → In-article, after 1st H2 in .tool-content (needs 2+ H2s)
 * - teamzlab-mid-content-2  → In-article, after 2nd H2 in .tool-content (needs 3+ H2s)
 * - teamzlab-after-faq      → Multiplex, between #tool-faqs and #related-tools
 *
 * Policy compliance:
 * - No ads on error pages (404), non-content pages, or localhost
 * - Manual ads only placed when sufficient content exists (H2 count check)
 * - Minimum content gap between ad units (always separated by real content)
 * - data-full-width-responsive for proper mobile sizing
 * - Unfilled ads auto-collapse via CSS :has(ins[data-ad-status="unfilled"])
 *
 * Analytics Events Tracked:
 * - adsense_script_loaded     → AdSense JS loaded successfully
 * - adsense_script_blocked    → AdSense JS blocked (ad blocker)
 * - ad_blocker_detected       → Ad blocker preventing ads from loading
 * - auto_ads_initialized      → Auto Ads + manual units loaded and running
 *
 * Google auto-tracks these (via AdSense↔GA4 link — no code needed):
 * - ad_unit_rendered, ad_display_success, ad_click, ad_viewability, ad_revenue_page
 */

(function () {
  'use strict';

  var PUB_ID = 'ca-pub-7088022825081956';

  // Don't run ads on non-content pages or error pages (Google policy)
  var path = window.location.pathname;
  var noAdPages = ['/', '/about/', '/contact/', '/privacy/', '/terms/', '/404.html'];
  if (noAdPages.indexOf(path) !== -1) return;

  // Don't run in localhost or local IPs
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return;

  // In-app browser detection
  var ua = navigator.userAgent || '';
  var isInApp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Twitter|Snapchat|MicroMessenger|WeChat|TikTok|BytedanceWebview/i.test(ua);

  if (isInApp) {
    // Check if user already dismissed overlay in this session (returning visitor)
    var alreadySkipped = false;
    try { alreadySkipped = sessionStorage.getItem('tz_inapp_closed') === '1'; } catch(e) {}
    if (alreadySkipped) {
      loadAds();
      return;
    }

    // Wait for overlay to appear first, THEN wait for it to be dismissed.
    var overlayAppeared = false;
    var waitForSkip = setInterval(function() {
      var overlayExists = !!document.querySelector('.inapp-overlay');
      if (overlayExists) overlayAppeared = true;

      if (overlayAppeared && !overlayExists) {
        clearInterval(waitForSkip);
        loadAds();
      }
    }, 500);

    // Safety timeout: if overlay never appears after 8s, load ads anyway
    setTimeout(function() { clearInterval(waitForSkip); loadAds(); }, 8000);
    return;
  }

  // Normal browsers: load ads immediately
  loadAds();

  function loadAds() {
    // Prevent double-load (safety for in-app timer + interval race)
    if (window.__tzAdsLoaded) return;
    window.__tzAdsLoaded = true;

    // --- Analytics helper ---
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

    function trackWithRetry(eventName, params, retries) {
      if (window.gtag || window._fbAnalytics) {
        trackAdEvent(eventName, params);
      } else if (retries > 0) {
        setTimeout(function () { trackWithRetry(eventName, params, retries - 1); }, 1000);
      }
    }

    // --- Ad slot IDs (manual units) ---
    var AD_SLOTS = {
      belowTool:   '7069872276',  // in-article: below calculator
      midContent1: '4783454435',  // in-article: after 1st H2
      midContent2: '2758825278',  // in-article: after 2nd H2
      afterFaq:    '7932361959'   // multiplex: after FAQs
    };

    // --- Helper: create an in-article ad element ---
    // insideAdSlot: true if placed inside existing .ad-slot (skip margin, parent handles it)
    function createInArticleAd(slotId, insideAdSlot) {
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.cssText = 'display:block;text-align:center;';
      ins.setAttribute('data-ad-layout', 'in-article');
      ins.setAttribute('data-ad-format', 'fluid');
      ins.setAttribute('data-ad-client', PUB_ID);
      ins.setAttribute('data-ad-slot', slotId);
      ins.setAttribute('data-full-width-responsive', 'true');

      var wrap = document.createElement('div');
      wrap.className = 'tz-ad-unit';
      // No margin when inside .ad-slot — the .ad-slot CSS already handles spacing
      wrap.style.cssText = insideAdSlot
        ? 'overflow:hidden;clear:both;'
        : 'margin:24px 0;overflow:hidden;clear:both;';
      wrap.appendChild(ins);
      return wrap;
    }

    // --- Helper: create a multiplex ad element ---
    function createMultiplexAd(slotId) {
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.cssText = 'display:block;';
      ins.setAttribute('data-ad-format', 'autorelaxed');
      ins.setAttribute('data-ad-client', PUB_ID);
      ins.setAttribute('data-ad-slot', slotId);

      var wrap = document.createElement('div');
      wrap.className = 'tz-ad-unit';
      wrap.style.cssText = 'margin:32px 0;overflow:hidden;clear:both;';
      wrap.appendChild(ins);
      return wrap;
    }

    // --- Helper: push ad to render (with safety check) ---
    function pushAd() {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    }

    // --- Check if this is a tool page (has real content for manual ads) ---
    function isToolPage() {
      return !!document.querySelector('.tool-content');
    }

    // 1. Place manual ad units into the DOM (only on tool pages with content)
    function placeManualAds() {
      // Only place manual ads on actual tool pages — not hub index pages
      if (!isToolPage()) return;

      var adsPlaced = 0;

      // Ad 1: In .ad-slot placeholder (below calculator)
      var adSlot = document.querySelector('.ad-slot');
      if (adSlot) {
        adSlot.textContent = '';
        adSlot.appendChild(createInArticleAd(AD_SLOTS.belowTool, true));
        adsPlaced++;
      }

      // Ad 2 & 3: Between H2s inside .tool-content
      // Policy: only place mid-content ads when there's enough content between them
      var toolContent = document.querySelector('.tool-content');
      if (toolContent) {
        var h2s = toolContent.querySelectorAll('h2');

        // Ad 2: before 2nd H2 (only if 2+ H2s = content between 1st and 2nd)
        if (h2s.length >= 2) {
          h2s[1].parentNode.insertBefore(createInArticleAd(AD_SLOTS.midContent1), h2s[1]);
          adsPlaced++;
        }

        // Ad 3: before 3rd H2 (only if 3+ H2s = content between 2nd and 3rd)
        if (h2s.length >= 3) {
          h2s[2].parentNode.insertBefore(createInArticleAd(AD_SLOTS.midContent2), h2s[2]);
          adsPlaced++;
        }
        // If only 2 H2s, skip Ad 3 — not enough content to justify another mid-content ad
      }

      // Ad 4: Multiplex between FAQs and related tools
      var faqSection = document.getElementById('tool-faqs');
      var relatedSection = document.getElementById('related-tools');
      if (faqSection && relatedSection && relatedSection.parentNode) {
        relatedSection.parentNode.insertBefore(createMultiplexAd(AD_SLOTS.afterFaq), relatedSection);
        adsPlaced++;
      } else if (faqSection && faqSection.parentNode) {
        faqSection.parentNode.insertBefore(createMultiplexAd(AD_SLOTS.afterFaq), faqSection.nextSibling);
        adsPlaced++;
      }

      trackWithRetry('manual_ads_placed', { count: adsPlaced }, 5);
    }

    // 2. Inject AdSense script (Auto Ads + triggers manual unit rendering)
    var script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB_ID;

    // Track how many manual <ins> elements need pushing
    var adsPushed = false;

    function pushAllAds() {
      if (adsPushed) return;
      adsPushed = true;
      var units = document.querySelectorAll('.tz-ad-unit ins.adsbygoogle');
      units.forEach(function () { pushAd(); });
      trackWithRetry('auto_ads_initialized', {
        mode: units.length > 0 ? 'auto_plus_manual' : 'auto_only',
        manual_units: units.length,
        device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop')
      }, 5);
    }

    script.onload = function () {
      trackWithRetry('adsense_script_loaded', { status: 'success' }, 5);
      // Push manual ads — but only if DOM placement already happened
      // If DOM not ready yet, the DOMContentLoaded handler will push after placing
      if (document.readyState !== 'loading') {
        pushAllAds();
      }
    };

    script.onerror = function () {
      trackWithRetry('adsense_script_blocked', {
        status: 'blocked',
        reason: 'script_load_failed',
        likely_cause: 'ad_blocker'
      }, 5);
    };

    document.head.appendChild(script);

    // 3. Place manual ads when DOM is ready, then push them
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        placeManualAds();
        // If AdSense script already loaded, push now; otherwise script.onload will push
        if (window.adsbygoogle) {
          pushAllAds();
        }
      });
    } else {
      // DOM already ready (script loaded late) — place and push immediately
      placeManualAds();
      if (window.adsbygoogle) {
        pushAllAds();
      }
    }

    // 4. Safety net: if neither onload nor DOMContentLoaded pushed ads yet, retry
    //    This handles edge timing where script loads between DOM placement and push
    setTimeout(function () {
      if (!adsPushed && document.querySelectorAll('.tz-ad-unit ins.adsbygoogle').length > 0) {
        pushAllAds();
      }
    }, 2000);

    // 5. Detect ad blocker
    setTimeout(function () {
      if (!window.adsbygoogle || typeof window.adsbygoogle.push !== 'function') {
        trackWithRetry('ad_blocker_detected', {
          blocker_type: 'adsense_global_missing',
          user_agent: ua.substring(0, 100)
        }, 5);
      }
    }, 3000);

    // 6. Hide .ad-slot placeholder text on non-tool pages (hub pages etc.)
    //    Tool pages get their .ad-slot replaced above; this handles the rest
    if (!isToolPage()) {
      var cleanAdSlots = function () {
        document.querySelectorAll('.ad-slot').forEach(function (slot) {
          slot.textContent = '';
        });
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanAdSlots);
      } else {
        cleanAdSlots();
      }
    }
  }
})();
