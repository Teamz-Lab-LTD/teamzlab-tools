/**
 * Teamz Lab Tools — Google AdSense Integration
 * Publisher ID: ca-pub-7088022825081956
 *
 * Strategy (policy-compliant, revenue-maximized):
 * 1. Auto Ads enabled — Google optimizes anchor, vignette, in-page placements
 * 2. Ad Unit 1: Manual .ad-slot (between calculator and content)
 * 3. Ad Unit 2: Mid-content (between 2nd and 3rd H2 inside .tool-content)
 *    — Only if content has 3+ H2s (ensures enough content between ads)
 * 4. Ad Unit 3: Between content and FAQs
 * 5. Ad Unit 4: After related tools (bottom of page)
 * 6. All ads are responsive and mobile-friendly
 * 7. All ad events tracked in Firebase Analytics + GA4
 *
 * Content density safeguard:
 * - Mid-content ad only placed if there are 3+ H2 sections
 * - This ensures ~200+ words of content exist on each side of the ad
 * - Complies with Google's "valuable content between ads" policy
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

    // --- Ad Unit 2: Mid-content (between H2 sections inside .tool-content) ---
    // Only inject if there are 3+ H2 headings (enough content for policy compliance)
    var contentSection = document.querySelector('.tool-content');
    if (contentSection) {
      var h2s = contentSection.querySelectorAll('h2');
      if (h2s.length >= 3) {
        // Place ad after the 2nd H2's content (before the 3rd H2)
        var targetH2 = h2s[2]; // 3rd H2 (0-indexed)
        var midAd = document.createElement('div');
        midAd.className = 'ad-slot ad-slot--in-content';
        midAd.style.cssText = 'margin:1.5rem 0;min-height:90px;';
        targetH2.parentNode.insertBefore(midAd, targetH2);
        createAdUnit(midAd, 'mid-content');
        adCount++;
      }
    }

    // --- Ad Unit 3: Between content and FAQs (in-article ad) ---
    var faqSection = document.getElementById('tool-faqs');
    if (faqSection) {
      var adDiv = document.createElement('div');
      adDiv.className = 'ad-slot ad-slot--mid';
      adDiv.style.cssText = 'margin:2rem 0;';
      faqSection.parentNode.insertBefore(adDiv, faqSection);
      createAdUnit(adDiv, 'before-faqs');
      adCount++;
    }

    // --- Ad Unit 4: After related tools (bottom of page, before footer) ---
    var relatedTools = document.getElementById('related-tools');
    if (relatedTools) {
      var bottomAd = document.createElement('div');
      bottomAd.className = 'ad-slot ad-slot--bottom';
      bottomAd.style.cssText = 'margin:2rem 0;';
      relatedTools.parentNode.insertBefore(bottomAd, relatedTools.nextSibling);
      createAdUnit(bottomAd, 'after-related');
      adCount++;
    }

    // Track total ads placed on this page
    trackAdEvent('ads_initialized', {
      ad_count: adCount,
      auto_ads: true
    });

    // Collapse unfilled ad slots after Google has had time to fill them
    // Google sets data-ad-status="unfilled" on slots it doesn't fill
    setTimeout(function () {
      document.querySelectorAll('.ad-slot').forEach(function (slot) {
        var ins = slot.querySelector('ins.adsbygoogle');
        if (!ins) {
          // No ad injected at all — collapse
          slot.style.cssText = 'min-height:0;margin:0;padding:0;height:0;overflow:hidden;border:none;opacity:0;';
          return;
        }
        var status = ins.getAttribute('data-ad-status');
        if (status === 'unfilled') {
          slot.style.cssText = 'min-height:0;margin:0;padding:0;height:0;overflow:hidden;border:none;opacity:0;';
          trackAdEvent('ad_slot_collapsed', { placement: slot.className });
        }
      });
    }, 5000); // Wait 5s for Google to fill or mark unfilled
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
