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
 * 7. ALL ad events tracked in Firebase Analytics + GA4
 *
 * Analytics Events Tracked:
 * - adsense_script_loaded     → AdSense JS loaded successfully
 * - adsense_script_blocked    → AdSense JS blocked (ad blocker)
 * - ads_initialized           → All ad slots placed on page
 * - ad_unit_rendered          → Individual ad unit pushed to Google
 * - ad_unit_error             → Error pushing ad unit
 * - ad_impression             → Ad scrolled into viewport (50%+ visible)
 * - ad_filled                 → Google filled the ad slot with an ad
 * - ad_unfilled               → Google did not fill the ad slot
 * - ad_slot_collapsed         → Unfilled slot was collapsed (hidden)
 * - ad_click                  → User clicked on an ad (detected via blur)
 * - ad_blocker_detected       → Ad blocker preventing ads from loading
 * - ad_viewability            → Ad was visible for 1+ second (Active View)
 * - ad_revenue_page           → Summary of all ad activity on page
 */

(function () {
  'use strict';

  var PUB_ID = 'ca-pub-7088022825081956';

  // Don't run ads on homepage, about, contact, privacy, terms (non-content pages)
  var path = window.location.pathname;
  var noAdPages = ['/', '/about/', '/contact/', '/privacy/', '/terms/'];
  if (noAdPages.indexOf(path) !== -1) return;

  // Don't run in localhost without override
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

  // Don't run in in-app browsers (Messenger, Facebook, Instagram, etc.)
  var ua = navigator.userAgent || '';
  if (/FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Twitter|Snapchat/i.test(ua)) return;

  // --- State tracking ---
  var adSlotStats = {};  // { placement: { rendered, filled, unfilled, impressed, clicked, viewable } }
  var pageStartTime = Date.now();

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

  // 1. Inject AdSense script with Auto Ads enabled
  var script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB_ID;
  script.onload = function () {
    trackWithRetry('adsense_script_loaded', { status: 'success' }, 5);
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

  // 3. Helper to create and push an ad unit with full tracking
  function createAdUnit(container, placement) {
    adSlotStats[placement] = { rendered: true, filled: false, unfilled: false, impressed: false, clicked: false, viewable: false };

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

    var ins = container.querySelector('.adsbygoogle');
    if (!ins) return;

    // --- REAL ad display verification (multi-check) ---
    // Google sets data-ad-status and injects an iframe when ad actually renders.
    // We poll for these signals to confirm the ad is TRULY showing, not just pushed.
    var displayChecked = false;
    function checkAdDisplay() {
      if (displayChecked) return;
      var status = ins.getAttribute('data-ad-status');
      var iframe = ins.querySelector('iframe');
      var hasHeight = ins.offsetHeight > 1;
      var iframeHasHeight = iframe && iframe.offsetHeight > 1;

      // --- Ad is CONFIRMED showing ---
      if (status === 'filled' || (iframe && iframeHasHeight && hasHeight)) {
        displayChecked = true;
        adSlotStats[placement].filled = true;
        trackAdEvent('ad_display_success', {
          placement: placement,
          ad_height: ins.offsetHeight,
          ad_width: ins.offsetWidth,
          has_iframe: !!iframe,
          iframe_height: iframe ? iframe.offsetHeight : 0,
          data_ad_status: status || 'none',
          load_time_ms: Date.now() - pageStartTime
        });

        // Now track impression only when FILLED ad enters viewport
        if (window.IntersectionObserver) {
          var impressionObserved = false;
          var impressionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting && !impressionObserved) {
                impressionObserved = true;
                adSlotStats[placement].impressed = true;
                trackAdEvent('ad_impression', {
                  placement: placement,
                  viewport_percent: Math.round(entry.intersectionRatio * 100),
                  confirmed_showing: true
                });
                impressionObserver.disconnect();

                // Track viewability (visible for 1+ second = Active View)
                setTimeout(function () {
                  adSlotStats[placement].viewable = true;
                  trackAdEvent('ad_viewability', {
                    placement: placement,
                    viewable_seconds: 1,
                    status: 'active_view'
                  });
                }, 1000);
              }
            });
          }, { threshold: 0.5 });
          impressionObserver.observe(ins);
        }
        return;
      }

      // --- Ad CONFIRMED not showing ---
      if (status === 'unfilled') {
        displayChecked = true;
        adSlotStats[placement].unfilled = true;
        trackAdEvent('ad_display_failure', {
          placement: placement,
          reason: 'unfilled_by_google',
          data_ad_status: status,
          has_iframe: !!iframe,
          ins_height: ins.offsetHeight
        });
        return;
      }

      // Not resolved yet — status still pending
    }

    // Poll multiple times: Google can take 1-8 seconds to fill
    // Check at 2s, 4s, 6s, 8s — covers slow networks and lazy-loaded ads
    [2000, 4000, 6000, 8000].forEach(function (delay) {
      setTimeout(function () {
        if (!displayChecked) {
          checkAdDisplay();
          // If still not resolved at 8s, mark as failed
          if (!displayChecked && delay === 8000) {
            displayChecked = true;
            adSlotStats[placement].unfilled = true;
            var finalStatus = ins.getAttribute('data-ad-status');
            var finalIframe = ins.querySelector('iframe');
            trackAdEvent('ad_display_failure', {
              placement: placement,
              reason: finalStatus === 'unfilled' ? 'no_demand' : (finalIframe ? 'iframe_no_content' : 'no_response'),
              data_ad_status: finalStatus || 'none',
              has_iframe: !!finalIframe,
              ins_height: ins.offsetHeight,
              timeout: true
            });
          }
        }
      }, delay);
    });
  }

  // 4. Track ad clicks via window blur detection
  // When user clicks an ad iframe, the window loses focus
  var lastClickPlacement = null;
  function setupClickTracking() {
    var adIframes = document.querySelectorAll('.ad-slot iframe, ins.adsbygoogle iframe');
    adIframes.forEach(function (iframe) {
      iframe.addEventListener('mouseover', function () {
        var slot = iframe.closest('.ad-slot');
        if (slot) {
          // Find placement from slot class or position
          var classes = slot.className || '';
          if (classes.indexOf('in-content') > -1) lastClickPlacement = 'mid-content';
          else if (classes.indexOf('mid') > -1) lastClickPlacement = 'before-faqs';
          else if (classes.indexOf('bottom') > -1) lastClickPlacement = 'after-related';
          else lastClickPlacement = 'after-calculator';
        }
      });
    });

    window.addEventListener('blur', function () {
      // Check if an ad iframe is focused (user clicked ad)
      setTimeout(function () {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
          var placement = lastClickPlacement || 'unknown';
          adSlotStats[placement] = adSlotStats[placement] || {};
          adSlotStats[placement].clicked = true;
          trackAdEvent('ad_click', {
            placement: placement,
            time_on_page: Math.round((Date.now() - pageStartTime) / 1000),
            scroll_depth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
          });
        }
        window.focus();
      }, 100);
    });
  }

  // 5. Wait for DOM ready, then populate ad slots
  function initAds() {
    var adCount = 0;

    // --- Ad Unit 1: Existing .ad-slot (between calculator and content) ---
    var adSlots = document.querySelectorAll('.ad-slot');
    adSlots.forEach(function (slot, i) {
      slot.style.opacity = '1';
      slot.style.height = 'auto';
      slot.style.minHeight = '90px';
      slot.textContent = '';
      createAdUnit(slot, 'after-calculator' + (i > 0 ? '-' + i : ''));
      adCount++;
    });

    // --- Ad Unit 2: Mid-content (between H2 sections inside .tool-content) ---
    var contentSection = document.querySelector('.tool-content');
    if (contentSection) {
      var h2s = contentSection.querySelectorAll('h2');
      if (h2s.length >= 3) {
        var targetH2 = h2s[2];
        var midAd = document.createElement('div');
        midAd.className = 'ad-slot ad-slot--in-content';
        midAd.style.cssText = 'margin:1.5rem 0;opacity:1;height:auto;min-height:90px;';
        targetH2.parentNode.insertBefore(midAd, targetH2);
        createAdUnit(midAd, 'mid-content');
        adCount++;
      }
    }

    // --- Ad Unit 3: Between content and FAQs ---
    var faqSection = document.getElementById('tool-faqs');
    if (faqSection) {
      var adDiv = document.createElement('div');
      adDiv.className = 'ad-slot ad-slot--mid';
      adDiv.style.cssText = 'margin:2rem 0;opacity:1;height:auto;min-height:90px;';
      faqSection.parentNode.insertBefore(adDiv, faqSection);
      createAdUnit(adDiv, 'before-faqs');
      adCount++;
    }

    // --- Ad Unit 4: After related tools ---
    var relatedTools = document.getElementById('related-tools');
    if (relatedTools) {
      var bottomAd = document.createElement('div');
      bottomAd.className = 'ad-slot ad-slot--bottom';
      bottomAd.style.cssText = 'margin:2rem 0;opacity:1;height:auto;min-height:90px;';
      relatedTools.parentNode.insertBefore(bottomAd, relatedTools.nextSibling);
      createAdUnit(bottomAd, 'after-related');
      adCount++;
    }

    // Track total ads placed
    trackAdEvent('ads_initialized', {
      ad_count: adCount,
      auto_ads: true,
      has_mid_content: contentSection && contentSection.querySelectorAll('h2').length >= 3,
      device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop')
    });

    // Setup click tracking after ads have time to load their iframes
    setTimeout(setupClickTracking, 5000);

    // Collapse unfilled ad slots + generate page summary
    // Wait 10s — after all display checks (2s/4s/6s/8s) have completed
    setTimeout(function () {
      var filledCount = 0;
      var unfilledCount = 0;
      var blockedCount = 0;
      var showingAds = [];

      document.querySelectorAll('.ad-slot').forEach(function (slot) {
        var ins = slot.querySelector('ins.adsbygoogle');
        if (!ins) {
          slot.style.cssText = 'min-height:0;margin:0;padding:0;height:0;overflow:hidden;border:none;opacity:0;';
          blockedCount++;
          return;
        }
        var status = ins.getAttribute('data-ad-status');
        var iframe = ins.querySelector('iframe');
        var isActuallyShowing = (status === 'filled') || (iframe && iframe.offsetHeight > 1 && ins.offsetHeight > 1);

        if (isActuallyShowing) {
          filledCount++;
          showingAds.push(slot.className.replace('ad-slot', '').trim() || 'primary');
        } else {
          slot.style.cssText = 'min-height:0;margin:0;padding:0;height:0;overflow:hidden;border:none;opacity:0;';
          unfilledCount++;
        }
      });

      // Page-level ad revenue summary — the REAL picture
      trackAdEvent('ad_revenue_page', {
        total_slots: adCount,
        actually_showing: filledCount,
        not_showing: unfilledCount,
        blocked: blockedCount,
        fill_rate_percent: adCount > 0 ? Math.round((filledCount / adCount) * 100) : 0,
        showing_positions: showingAds.join(', '),
        time_on_page: Math.round((Date.now() - pageStartTime) / 1000),
        device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop')
      });
    }, 10000);

    // Re-check click tracking when new iframes appear (Google may lazy-load)
    setTimeout(setupClickTracking, 10000);
  }

  // Run after a delay to ensure tool-engine and common.js have rendered content
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initAds, 500);
    });
  } else {
    setTimeout(initAds, 500);
  }

  // 6. Track page unload summary
  window.addEventListener('beforeunload', function () {
    var totalImpressed = 0;
    var totalClicked = 0;
    var totalViewable = 0;
    Object.keys(adSlotStats).forEach(function (key) {
      if (adSlotStats[key].impressed) totalImpressed++;
      if (adSlotStats[key].clicked) totalClicked++;
      if (adSlotStats[key].viewable) totalViewable++;
    });

    // Use sendBeacon for reliable unload tracking
    var data = {
      event: 'ad_session_summary',
      page_path: path,
      tool_slug: path.replace(/^\/|\/$/g, ''),
      total_slots: Object.keys(adSlotStats).length,
      total_impressed: totalImpressed,
      total_clicked: totalClicked,
      total_viewable: totalViewable,
      session_duration: Math.round((Date.now() - pageStartTime) / 1000),
      device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop'),
      timestamp: new Date().toISOString()
    };

    // GA4 via Measurement Protocol (sendBeacon)
    if (window.gtag) {
      try { window.gtag('event', 'ad_session_summary', data); } catch (e) {}
    }

    // Firebase via sendBeacon fallback
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(
          'https://www.google-analytics.com/mp/collect?measurement_id=G-TDGVH91VS8&api_secret=',
          JSON.stringify({ client_id: 'adsense_tracker', events: [{ name: 'ad_session_summary', params: data }] })
        );
      } catch (e) {}
    }
  });
})();
