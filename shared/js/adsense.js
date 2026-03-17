/**
 * Teamz Lab Tools — Google AdSense Integration
 * Publisher ID: ca-pub-7088022825081956
 *
 * Strategy (policy-compliant, revenue-maximized):
 * 1. Auto Ads enabled — Google optimizes anchor, vignette, in-page placements
 * 2. Manual ad in existing .ad-slot (between calculator and content)
 * 3. Second manual ad injected between content and FAQs
 * 4. All ads are responsive and mobile-friendly
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

  // 1. Inject AdSense script with Auto Ads enabled
  var script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB_ID;
  document.head.appendChild(script);

  // 2. Wait for DOM ready, then populate ad slots
  function initAds() {
    // --- Ad Unit 1: Existing .ad-slot (between calculator and content) ---
    var adSlots = document.querySelectorAll('.ad-slot');
    adSlots.forEach(function (slot) {
      slot.style.opacity = '1';
      slot.style.border = 'none';
      slot.innerHTML =
        '<ins class="adsbygoogle"' +
        ' style="display:block"' +
        ' data-ad-client="' + PUB_ID + '"' +
        ' data-ad-slot="auto"' +
        ' data-ad-format="auto"' +
        ' data-full-width-responsive="true"></ins>';
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) { /* ad blocked or not loaded yet */ }
    });

    // --- Ad Unit 2: Between content and FAQs (in-article ad) ---
    var faqSection = document.getElementById('tool-faqs');
    if (faqSection) {
      var adDiv = document.createElement('div');
      adDiv.className = 'ad-slot ad-slot--mid';
      adDiv.style.cssText = 'margin:2rem 0;min-height:90px;';
      adDiv.innerHTML =
        '<ins class="adsbygoogle"' +
        ' style="display:block"' +
        ' data-ad-client="' + PUB_ID + '"' +
        ' data-ad-slot="auto"' +
        ' data-ad-format="auto"' +
        ' data-full-width-responsive="true"></ins>';
      faqSection.parentNode.insertBefore(adDiv, faqSection);
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) { /* ad blocked or not loaded yet */ }
    }

    // --- Ad Unit 3: After related tools (bottom of page, before footer) ---
    var relatedTools = document.getElementById('related-tools');
    if (relatedTools) {
      var bottomAd = document.createElement('div');
      bottomAd.className = 'ad-slot ad-slot--bottom';
      bottomAd.style.cssText = 'margin:2rem 0;min-height:90px;';
      bottomAd.innerHTML =
        '<ins class="adsbygoogle"' +
        ' style="display:block"' +
        ' data-ad-client="' + PUB_ID + '"' +
        ' data-ad-slot="auto"' +
        ' data-ad-format="auto"' +
        ' data-full-width-responsive="true"></ins>';
      relatedTools.parentNode.insertBefore(bottomAd, relatedTools.nextSibling);
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) { /* ad blocked or not loaded yet */ }
    }
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
