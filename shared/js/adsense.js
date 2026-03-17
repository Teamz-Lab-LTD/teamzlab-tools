/**
 * Teamz Lab Tools — Google AdSense Integration
 * Publisher ID: ca-pub-7088022825081956
 *
 * Strategy (policy-compliant, revenue-maximized):
 * 1. Auto Ads enabled — Google optimizes anchor, vignette, in-page placements
 * 2. Manual ad in existing .ad-slot (between calculator and content)
 * 3. Second manual ad injected between content and FAQs
 * 4. All ads are responsive and mobile-friendly
 * 5. All ad events tracked in Firebase Analytics + GA4
 */

(function () {
  'use strict';

  var PUB_ID = 'ca-pub-7088022825081956';

  // Don't run ads on homepage, about, contact, privacy, or hub index pages
  var path = window.location.pathname;
  var noAdPages = ['/', '/about/', '/contact/', '/privacy/', '/terms/'];
  var isHubIndex = /^\/[a-z-]+\/(?:index\.html)?$/.test(path) && path.split('/').filter(Boolean).length <= 1;
  if (noAdPages.indexOf(path) !== -1 || isHubIndex) return;

  // Don't run in localhost without override
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

  // Don't run in in-app browsers (Messenger, Facebook, Instagram, etc.) — ads fail and show "Page can't be loaded"
  var ua = navigator.userAgent || '';
  if (/FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Twitter|Snapchat/i.test(ua)) return;

  // --- Analytics helper: track ad events in Firebase + GA4 ---
  function trackAdEvent(eventName, params) {
    var fullParams = Object.assign({
      page_path: path,
      tool_slug: path.replace(/^\/|\/$/g, '')
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

  // 1. Inject AdSense script with Auto Ads enabled
  var script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB_ID;
  script.onload = function () {
    trackAdEvent('adsense_script_loaded', { status: 'success' });
  };
  script.onerror = function () {
    trackAdEvent('adsense_script_blocked', { status: 'blocked' });
  };
  document.head.appendChild(script);

  // 2. Helper to create and push an ad unit
  function createAdUnit(container, placement) {
    container.innerHTML =
      '<ins class="adsbygoogle"' +
      ' style="display:block"' +
      ' data-ad-client="' + PUB_ID + '"' +
      ' data-ad-slot="auto"' +
      ' data-ad-format="auto"' +
      ' data-full-width-responsive="true"></ins>';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      trackAdEvent('ad_unit_rendered', { placement: placement });
    } catch (e) {
      trackAdEvent('ad_unit_error', { placement: placement, error: e.message });
    }

    // Track ad visibility with IntersectionObserver
    var ins = container.querySelector('.adsbygoogle');
    if (ins && window.IntersectionObserver) {
      var observed = false;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !observed) {
            observed = true;
            trackAdEvent('ad_impression', { placement: placement });
            observer.disconnect();
          }
        });
      }, { threshold: 0.5 });
      observer.observe(ins);
    }
  }

  // 3. Wait for DOM ready, then populate ad slots
  function initAds() {
    var adCount = 0;

    // --- Ad Unit 1: Existing .ad-slot (between calculator and content) ---
    var adSlots = document.querySelectorAll('.ad-slot');
    adSlots.forEach(function (slot, i) {
      slot.style.opacity = '1';
      slot.style.border = 'none';
      createAdUnit(slot, 'after-calculator' + (i > 0 ? '-' + i : ''));
      adCount++;
    });

    // --- Ad Unit 2: Between content and FAQs (in-article ad) ---
    var faqSection = document.getElementById('tool-faqs');
    if (faqSection) {
      var adDiv = document.createElement('div');
      adDiv.className = 'ad-slot ad-slot--mid';
      adDiv.style.cssText = 'margin:2rem 0;min-height:90px;';
      faqSection.parentNode.insertBefore(adDiv, faqSection);
      createAdUnit(adDiv, 'before-faqs');
      adCount++;
    }

    // --- Ad Unit 3: After related tools (bottom of page, before footer) ---
    var relatedTools = document.getElementById('related-tools');
    if (relatedTools) {
      var bottomAd = document.createElement('div');
      bottomAd.className = 'ad-slot ad-slot--bottom';
      bottomAd.style.cssText = 'margin:2rem 0;min-height:90px;';
      relatedTools.parentNode.insertBefore(bottomAd, relatedTools.nextSibling);
      createAdUnit(bottomAd, 'after-related');
      adCount++;
    }

    // Track total ads placed on this page
    trackAdEvent('ads_initialized', {
      ad_count: adCount,
      auto_ads: true
    });
  }

  // Run after a delay to ensure tool-engine and common.js have rendered content
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initAds, 500);
    });
  } else {
    setTimeout(initAds, 500);
  }
})();
