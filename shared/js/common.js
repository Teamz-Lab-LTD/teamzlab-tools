/**
 * Teamz Lab Tools — Common utilities
 * Header, footer, theme, FAQ schema, breadcrumbs
 */

var TeamzTools = (function () {
  var SITE_NAME = 'Teamz Lab Tools';
  var SITE_URL = 'https://tool.teamzlab.com';
  var TEAMZ_URL = 'https://teamzlab.com';

  // ===== Global Toast Notification =====
  var _toastStyle = null;
  function _showToast(msg) {
    if (!_toastStyle) {
      _toastStyle = document.createElement('style');
      _toastStyle.textContent = '.teamz-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--heading);color:var(--bg);padding:0.65rem 1.5rem;border-radius:8px;font-size:0.9rem;font-weight:600;font-family:"Poppins",sans-serif;z-index:99999;opacity:0;transition:all 0.3s ease;pointer-events:none;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.2)}.teamz-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}';
      document.head.appendChild(_toastStyle);
    }
    var existing = document.querySelector('.teamz-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'teamz-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { toast.classList.add('show'); });
    });
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
  }
  // Expose globally so tool pages can use it too
  window.showToast = _showToast;

  // === CENTRAL FIX: Override alert() to use showToast() ===
  // Fixes 110+ tools that use alert() instead of showToast()
  // alert() is blocking and ugly — showToast() is non-blocking and styled
  window.alert = function (msg) {
    _showToast(String(msg));
  };

  // === CENTRAL FIX: Safe clipboard helpers ===
  // Fixes 316+ clipboard calls missing .catch() — silent failure on permission denied / Firefox
  window.safeClipboardText = function (text, successMsg, failMsg) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      _showToast(failMsg || 'Copy not supported in this browser.');
      return Promise.resolve(false);
    }
    return navigator.clipboard.writeText(text).then(function () {
      _showToast(successMsg || 'Copied to clipboard!');
      return true;
    }).catch(function () {
      _showToast(failMsg || 'Copy failed — try selecting and copying manually.');
      return false;
    });
  };

  window.safeClipboardImage = function (canvas, successMsg, failMsg) {
    if (!canvas || !canvas.toBlob) {
      _showToast(failMsg || 'Could not create image.');
      return Promise.resolve(false);
    }
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        if (!blob) { _showToast(failMsg || 'Could not create image.'); resolve(false); return; }
        try {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function () {
            _showToast(successMsg || 'Image copied to clipboard!');
            resolve(true);
          }).catch(function () {
            _showToast(failMsg || 'Copy failed — try Download instead.');
            resolve(false);
          });
        } catch (e) {
          _showToast(failMsg || 'Image copy not supported — use Download instead.');
          resolve(false);
        }
      }, 'image/png');
    });
  };

  // === CENTRAL FIX: Safe html2canvas wrapper ===
  // Always uses white background (not null/transparent), handles CDN loading
  window.safeHtml2Canvas = function (el, callback, options) {
    var opts = Object.assign({ backgroundColor: '#ffffff', scale: 2 }, options || {});
    function run() { html2canvas(el, opts).then(callback).catch(function () { _showToast('Could not render image.'); }); }
    if (window.html2canvas) { run(); return; }
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = run;
    script.onerror = function () { _showToast('Could not load image library. Try again.'); };
    document.head.appendChild(script);
  };

  // === CENTRAL FIX: Safe show/hide helpers ===
  // Fixes style.display='' bug — setting display to '' only removes inline style,
  // does NOT override CSS class display:none. Use showEl()/hideEl() instead.
  // showEl() auto-detects the right display value (block, flex, grid, etc.)
  window.showEl = function (el, displayType) {
    if (!el) return;
    if (displayType) { el.style.display = displayType; return; }
    // Temporarily show to detect the natural CSS display value
    el.style.display = '';
    var computed = window.getComputedStyle(el).display;
    if (computed === 'none') {
      el.style.display = 'block'; // Safe fallback
    }
    // Otherwise '' worked fine (CSS default is visible)
  };
  window.hideEl = function (el) {
    if (el) el.style.display = 'none';
  };

  // === CENTRAL FIX: Runtime safety net for style.display='' bug ===
  // When JS sets style.display='', it removes the inline style. If the CSS class has display:none,
  // the element stays hidden. This observer catches that and auto-fixes to display:block.
  // Only fires when: old style had 'display' → cleared to '' → computed is still 'none'.
  (function _patchDisplayBug() {
    if (typeof MutationObserver === 'undefined') return;
    var _fixing = false;
    var observer = new MutationObserver(function (mutations) {
      if (_fixing) return;
      _fixing = true;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        var el = m.target;
        var oldVal = m.oldValue || '';
        // Only act if: old style had display set AND current inline display is now cleared
        if (oldVal.indexOf('display') !== -1 && el.style && el.style.display === '') {
          try {
            var comp = window.getComputedStyle(el).display;
            if (comp === 'none') {
              el.style.display = 'block';
            }
          } catch (e) { /* ignore */ }
        }
      }
      _fixing = false;
    });
    function start() {
      if (document.body) {
        observer.observe(document.body, {
          attributes: true, subtree: true,
          attributeFilter: ['style'], attributeOldValue: true
        });
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  })();

  function _escapeHtml(text) {
    if (text === null || text === undefined) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
  }

  function renderHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;

    header.innerHTML =
      '<a href="/" class="header-logo teamz-logo" aria-label="Teamz Lab Tools Home">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' +
        '<span>' + SITE_NAME + '</span>' +
      '</a>' +
      '<nav class="header-nav" aria-label="Main navigation">' +
        '<a href="/" class="nav-link">Home</a>' +
        '<a href="https://apps.teamzlab.com/" target="_blank" rel="noopener" class="nav-link">About</a>' +
        '<a href="https://teamzlab.com/contact" target="_blank" rel="noopener" class="nav-link">Contact</a>' +
        '<div class="lang-selector notranslate" translate="no">' +
          '<button class="lang-btn notranslate" id="lang-toggle" type="button" aria-label="Change language" title="Change language" translate="no">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
            ' <span id="current-lang" class="notranslate" translate="no">EN</span>' +
          '</button>' +
          '<div class="lang-dropdown notranslate" id="lang-dropdown" translate="no"></div>' +
        '</div>' +
        '<div class="fav-header-wrap">' +
          '<button id="fav-header-btn" class="header-icon-btn nav-link--icon" aria-label="Favorites" title="Your Favourites">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
            '<span id="fav-badge" class="fav-badge" style="display:none;">0</span>' +
          '</button>' +
          '<div id="fav-dropdown" class="fav-dropdown" style="display:none;"></div>' +
        '</div>' +
        '<button id="theme-toggle" class="header-icon-btn nav-link--icon" aria-label="Toggle theme" title="Toggle dark/light mode">' +
          '<svg id="theme-icon-dark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
          '<svg id="theme-icon-light" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' +
        '</button>' +
      '</nav>';

    var toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        if (typeof TeamzTheme !== 'undefined') {
          var newTheme = TeamzTheme.toggle();
          _updateThemeIcon(newTheme);
        }
      });
    }

    _updateThemeIcon(typeof TeamzTheme !== 'undefined' ? TeamzTheme.get() : 'dark');

    // --- Favorites header button ---
    window._updateFavBadge();
    var favHeaderBtn = document.getElementById('fav-header-btn');
    var favDropdown = document.getElementById('fav-dropdown');
    if (favHeaderBtn && favDropdown) {
      favHeaderBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = favDropdown.style.display !== 'none';
        if (isOpen) {
          favDropdown.style.display = 'none';
          return;
        }
        // Render favorites list
        var favs = [];
        try { favs = JSON.parse(localStorage.getItem('tz_favorites') || '[]'); } catch(ex) {}
        var html = '<div class="fav-dropdown__header">Your Favourites</div>';
        if (favs.length === 0) {
          html += '<div class="fav-dropdown__empty">No favourites yet.<br>Tap the heart on any tool to save it here.</div>';
        } else {
          html += '<div class="fav-dropdown__list">';
          for (var fi = 0; fi < favs.length; fi++) {
            var f = favs[fi];
            html += '<a href="/' + f.slug + '/" class="fav-dropdown__item">' +
              '<span class="fav-dropdown__title">' + (f.title || f.slug) + '</span>' +
              '<button class="fav-dropdown__remove" data-slug="' + f.slug + '" title="Remove">&times;</button>' +
            '</a>';
          }
          html += '</div>';
          if (favs.length > 3) {
            html += '<div class="fav-dropdown__footer"><a href="/#favorites">See all ' + favs.length + ' favourites</a></div>';
          }
        }
        favDropdown.innerHTML = html;
        favDropdown.style.display = 'block';

        // Remove buttons
        favDropdown.querySelectorAll('.fav-dropdown__remove').forEach(function(rb) {
          rb.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var slug = rb.getAttribute('data-slug');
            try {
              var list = JSON.parse(localStorage.getItem('tz_favorites') || '[]');
              list = list.filter(function(item) { return item.slug !== slug; });
              localStorage.setItem('tz_favorites', JSON.stringify(list));
              window._updateFavBadge();

              // Remove item from dropdown
              var itemEl = rb.closest('.fav-dropdown__item');
              if (itemEl) itemEl.remove();

              // If dropdown list is now empty, show empty state
              var remaining = favDropdown.querySelectorAll('.fav-dropdown__item');
              if (remaining.length === 0) {
                favDropdown.innerHTML = '<div class="fav-dropdown__header">Your Favourites</div>' +
                  '<div class="fav-dropdown__empty">No favourites yet.<br>Tap the heart on any tool to save it here.</div>';
              }

              // Update share bar fav button if on same page
              var shareFav = document.querySelector('.share-btn--fav');
              if (shareFav && window.location.pathname.replace(/^\/|\/$/g, '') === slug) {
                shareFav.classList.remove('share-btn--faved');
                shareFav.querySelector('svg').setAttribute('fill', 'none');
              }

              // Remove from homepage/hub favourites grid
              var homeCard = document.querySelector('.fav-homepage-card[href="/' + slug + '/"]');
              if (homeCard) homeCard.remove();
              // Hide entire section if no favourites left
              var favSection = document.getElementById('favorites');
              if (favSection) {
                var grid = favSection.querySelector('.fav-homepage-grid');
                if (grid && grid.children.length === 0) favSection.remove();
              }

              window.showToast('Removed from favourites');
            } catch(ex) {}
          });
        });
      });

      // Close dropdown on outside click
      document.addEventListener('click', function() {
        if (favDropdown) favDropdown.style.display = 'none';
      });
      favDropdown.addEventListener('click', function(e) { e.stopPropagation(); });
    }
  }

  window._updateFavBadge = function() {
    var badge = document.getElementById('fav-badge');
    if (!badge) return;
    try {
      var favs = JSON.parse(localStorage.getItem('tz_favorites') || '[]');
      if (favs.length > 0) {
        badge.textContent = favs.length;
        badge.style.display = 'flex';
        var svg = badge.parentElement.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'currentColor');
      } else {
        badge.style.display = 'none';
        var svg = badge.parentElement.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'none');
      }
    } catch(e) {}
  };

  function _updateThemeIcon(theme) {
    var dark = document.getElementById('theme-icon-dark');
    var light = document.getElementById('theme-icon-light');
    if (dark && light) {
      dark.style.display = theme === 'dark' ? 'block' : 'none';
      light.style.display = theme === 'light' ? 'block' : 'none';
    }
  }

  function renderFooter() {
    var footer = document.getElementById('site-footer');
    if (!footer) return;

    var year = new Date().getFullYear();
    footer.innerHTML =
      '<div class="footer-cta">' +
        '<div class="build-cta">' +
          '<div class="build-cta__text">' +
            '<strong>Need a custom tool, app, or AI workflow?</strong>' +
            '<span>Teamz Lab builds web apps, mobile apps, AI integrations, and MVPs for startups and businesses.</span>' +
          '</div>' +
          '<a href="' + TEAMZ_URL + '" target="_blank" rel="noopener" class="build-cta__btn btn-pill">Hire Us</a>' +
          '<div class="build-cta__stores">' +
            '<a href="https://play.google.com/store/apps/dev?id=7194763656319643086" target="_blank" rel="noopener" class="build-cta__store-link">' +
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 2l16 10L4 22V2z"/></svg>' +
              'Google Play' +
            '</a>' +
            '<a href="https://apps.apple.com/us/developer/teamz-lab-ltd/id1785282466" target="_blank" rel="noopener" class="build-cta__store-link">' +
              '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>' +
              'App Store' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="footer-engage">' +
        '<div class="engage-card">' +
          '<div class="engage-card__icon">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
          '</div>' +
          '<div class="engage-card__text">' +
            '<strong>Got a tool idea or feedback?</strong>' +
            '<span>Tell us what to build next — we read every message.</span>' +
          '</div>' +
          '<a href="' + TEAMZ_URL + '/contact" target="_blank" rel="noopener" class="engage-card__btn btn-pill">Share Feedback</a>' +
        '</div>' +
        '<div class="engage-card">' +
          '<div class="engage-card__icon">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
          '</div>' +
          '<div class="engage-card__text">' +
            '<strong>Want custom tools for your business?</strong>' +
            '<span>We build apps, dashboards &amp; AI workflows. Drop us your email.</span>' +
          '</div>' +
          '<a href="' + TEAMZ_URL + '/contact" target="_blank" rel="noopener" class="engage-card__btn btn-pill">Get in Touch</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-links">' +
        '<div class="footer-col">' +
          '<h4>Work &amp; Payroll</h4>' +
          '<a href="/work/notice-period-calculator/">Notice Period</a>' +
          '<a href="/work/notice-period-buyout-calculator/">Notice Buyout</a>' +
          '<a href="/work/last-working-day-calculator/">Last Working Day</a>' +
          '<a href="/work/leave-encashment-calculator/">Leave Encashment</a>' +
          '<a href="/work/salary-per-day-calculator/">Salary Per Day</a>' +
          '<a href="/work/salary-per-hour-calculator/">Salary Per Hour</a>' +
          '<a href="/work/gratuity-calculator/">Gratuity</a>' +
          '<a href="/work/overtime-pay-calculator/">Overtime Pay</a>' +
          '<a href="/work/severance-pay-calculator/">Severance Pay</a>' +
          '<a href="/work/final-settlement-estimator/">Final Settlement</a>' +
          '<a href="/work/holiday-pay-calculator/">Holiday Pay</a>' +
          '<a href="/career/salary-hike-calculator/">Salary Hike</a>' +
          '<a href="/career/take-home-pay-estimator/">Take-Home Pay</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>Invoice &amp; Freelance</h4>' +
          '<a href="/freelance/invoice-due-date-calculator/">Invoice Due Date</a>' +
          '<a href="/freelance/net-30-calculator/">Net 30</a>' +
          '<a href="/freelance/late-fee-calculator/">Late Fee</a>' +
          '<a href="/freelance/freelance-rate-calculator/">Freelance Rate</a>' +
          '<a href="/freelance/project-pricing-calculator/">Project Pricing</a>' +
          '<a href="/freelance/retainer-calculator/">Retainer</a>' +
          '<a href="/freelance/profit-margin-calculator/">Profit Margin</a>' +
          '<a href="/freelance/quote-estimator/">Quote Estimator</a>' +
          '<a href="/freelance/scope-creep-cost-calculator/">Scope Creep Cost</a>' +
          '<a href="/freelance/milestone-payout-calculator/">Milestone Payout</a>' +
          '<a href="/freelance/deposit-split-calculator/">Deposit Split</a>' +
          '<a href="/freelance/revision-cost-calculator/">Revision Cost</a>' +
          '<a href="/freelance/vat-calculator/">VAT Calculator</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>Creator &amp; Ads</h4>' +
          '<a href="/creator/ugc-rate-calculator/">UGC Rate</a>' +
          '<a href="/creator/sponsorship-rate-calculator/">Sponsorship Rate</a>' +
          '<a href="/creator/brand-deal-calculator/">Brand Deal</a>' +
          '<a href="/creator/cpm-calculator/">CPM Calculator</a>' +
          '<a href="/creator/cpv-calculator/">CPV Calculator</a>' +
          '<a href="/creator/creator-income-goal-calculator/">Income Goal</a>' +
          '<a href="/creator/digital-product-pricing-calculator/">Product Pricing</a>' +
          '<a href="/creator/course-pricing-calculator/">Course Pricing</a>' +
          '<a href="/creator/newsletter-sponsorship-calculator/">Newsletter Sponsor</a>' +
          '<a href="/creator/affiliate-income-goal-calculator/">Affiliate Income</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>More Tools</h4>' +
          '<a href="/student/attendance-percentage-calculator/">Attendance %</a>' +
          '<a href="/student/exam-countdown-planner/">Exam Countdown</a>' +
          '<a href="/housing/rent-burden-calculator/">Rent Burden</a>' +
          '<a href="/software/app-development-cost-calculator/">App Dev Cost</a>' +
          '<a href="/software/mvp-cost-estimator/">MVP Cost</a>' +
          '<a href="/software/token-cost-calculator/">Token Cost</a>' +
          '<a href="/career/offer-comparison-calculator/">Offer Compare</a>' +
          '<a href="/career/contractor-vs-employee-calculator/">Contractor vs Employee</a>' +
          '<a href="/work/business-day-calculator/">Business Day</a>' +
          '<a href="/housing/appliance-running-cost-calculator/">Appliance Cost</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>Company</h4>' +
          '<a href="https://apps.teamzlab.com/" target="_blank" rel="noopener">About</a>' +
          '<a href="https://teamzlab.com/contact" target="_blank" rel="noopener">Contact</a>' +
          '<a href="/privacy/">Privacy Policy</a>' +
          '<a href="/terms/">Terms of Service</a>' +
          '<a href="' + TEAMZ_URL + '" target="_blank" rel="noopener">Teamz Lab</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-trust">' +
        '<div class="trust-badges">' +
          '<span class="trust-badge">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
            ' 100% Private &mdash; your data never leaves your browser' +
          '</span>' +
          '<span class="trust-badge">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
            ' No sign-up required' +
          '</span>' +
          '<span class="trust-badge">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
            ' Free forever &mdash; 700+ tools' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<p>&copy; ' + year + ' ' + SITE_NAME + '. A project by <a href="' + TEAMZ_URL + '" target="_blank" rel="noopener" class="teamz-logo">Teamz Lab</a>.</p>' +
      '</div>';
  }

  function renderBreadcrumbs(items) {
    var container = document.getElementById('breadcrumbs');
    if (!container || !items || !items.length) return;

    var html = '<nav aria-label="Breadcrumb"><ol class="breadcrumb-list">';
    items.forEach(function (item, i) {
      var isLast = i === items.length - 1;
      if (isLast) {
        html += '<li class="breadcrumb-item active" aria-current="page">' + _escapeHtml(item.name) + '</li>';
      } else {
        html += '<li class="breadcrumb-item"><a href="' + _escapeHtml(item.url) + '">' + _escapeHtml(item.name) + '</a></li>';
      }
    });
    html += '</ol></nav>';
    container.innerHTML = html;
  }

  function injectBreadcrumbSchema(items) {
    if (!items || items.length < 2) return;

    var schemaItems = [];
    items.forEach(function (item, i) {
      var entry = {
        "@type": "ListItem",
        "position": i + 1,
        "name": item.name
      };
      if (item.url) {
        entry["item"] = SITE_URL + item.url;
      }
      schemaItems.push(entry);
    });

    _injectSchema({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": schemaItems
    });
  }

  function injectFAQSchema(faqs) {
    if (!faqs || !faqs.length) return;

    _injectSchema({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(function (faq) {
        return {
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        };
      })
    });
  }

  function injectWebAppSchema(config) {
    if (!config || !config.slug) return;

    _injectSchema({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": config.title,
      "description": config.description,
      "url": SITE_URL + '/' + config.slug + '/',
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "author": {
        "@type": "Organization",
        "name": "Teamz Lab",
        "url": TEAMZ_URL
      },
      "inLanguage": document.documentElement.lang || "en"
    });
  }

  function injectOrganizationSchema() {
    _injectSchema({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Teamz Lab",
      "url": TEAMZ_URL,
      "logo": TEAMZ_URL + "/logo.png",
      "email": "mailto:hello@teamzlab.com",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "mailto:hello@teamzlab.com",
        "contactType": "customer service",
        "availableLanguage": "English"
      }
    });
  }

  function injectWebSiteSchema() {
    _injectSchema({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL,
      "inLanguage": "en",
      "publisher": {
        "@type": "Organization",
        "name": "Teamz Lab",
        "url": TEAMZ_URL
      }
    });
  }

  function _injectSchema(schema) {
    try {
      // Skip if static schema already exists (injected by build-static-schema.py)
      var existing = document.querySelectorAll('script[type="application/ld+json"]');
      var schemaType = schema['@type'];
      for (var i = 0; i < existing.length; i++) {
        try {
          var parsed = JSON.parse(existing[i].textContent);
          if (parsed['@type'] === schemaType) return; // already present
        } catch (e) {}
      }
      var script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    } catch (e) {}
  }

  function renderRelatedTools(tools) {
    var container = document.getElementById('related-tools');
    if (!container || !tools || !tools.length) return;

    var html = '<h2 class="section-title">Related Tools</h2>';
    html += '<div class="related-tools-grid">';
    tools.forEach(function (tool) {
      html += '<a href="/' + _escapeHtml(tool.slug) + '/" class="card related-tool-card">' +
        '<h3>' + _escapeHtml(tool.name) + '</h3>' +
        '<p>' + _escapeHtml(tool.description) + '</p>' +
      '</a>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderFAQs(faqs) {
    var container = document.getElementById('tool-faqs');
    if (!container || !faqs || !faqs.length) return;

    var html = '<h2 class="section-title">Frequently Asked Questions</h2>';
    faqs.forEach(function (faq) {
      html += '<details class="faq-item">' +
        '<summary class="faq-question">' + _escapeHtml(faq.q) + '</summary>' +
        '<div class="faq-answer"><p>' + _escapeHtml(faq.a) + '</p></div>' +
      '</details>';
    });
    container.innerHTML = html;
  }

  // --- Star Rating Widget (Firebase RTDB for cross-user aggregation) ---
  var RTDB_URL = 'https://teamzlab-tools-default-rtdb.firebaseio.com/ratings';

  function _getToolSlug() {
    var path = window.location.pathname.replace(/^\/|\/$/g, '');
    return path || 'home';
  }

  function _safeKey(slug) {
    // Firebase keys can't have . # $ [ ] /
    return slug.replace(/\//g, '__');
  }

  function _hasUserRated(slug) {
    try {
      return localStorage.getItem('tz_rated_' + slug) === '1';
    } catch (e) { return false; }
  }

  function _markUserRated(slug) {
    try { localStorage.setItem('tz_rated_' + slug, '1'); } catch (e) {}
  }

  function _sendRatingToGA(slug, rating) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'tool_rating', {
        event_category: 'engagement',
        event_label: slug,
        value: rating,
        tool_slug: slug,
        rating_value: rating
      });
    }
    if (window._fbAnalytics) {
      try {
        window._fbAnalytics.logEvent('tool_rating', { tool_slug: slug, rating_value: rating });
      } catch (e) {}
    }
  }

  function _submitRatingToFirebase(slug, rating, callback) {
    var key = _safeKey(slug);
    // First read current totals
    fetch(RTDB_URL + '/' + key + '.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var total = (data && data.total) ? data.total + rating : rating;
        var count = (data && data.count) ? data.count + 1 : 1;
        var avg = Math.round((total / count) * 10) / 10;
        // Write back
        return fetch(RTDB_URL + '/' + key + '.json', {
          method: 'PUT',
          body: JSON.stringify({ total: total, count: count, avg: avg })
        }).then(function () {
          if (callback) callback({ avg: avg, count: count });
        });
      })
      .catch(function () {
        // Firebase not available — degrade silently
        if (callback) callback(null);
      });
  }

  function _fetchRatingFromFirebase(slug, callback) {
    var key = _safeKey(slug);
    fetch(RTDB_URL + '/' + key + '.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.count && data.avg) {
          callback({ avg: data.avg, count: data.count });
        } else {
          callback(null);
        }
      })
      .catch(function () { callback(null); });
  }

  function _injectAggregateRating(avg, count) {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      try {
        var schema = JSON.parse(scripts[i].textContent);
        if (schema['@type'] === 'WebApplication') {
          schema.aggregateRating = {
            '@type': 'AggregateRating',
            'ratingValue': String(avg),
            'ratingCount': String(count),
            'bestRating': '5',
            'worstRating': '1'
          };
          scripts[i].textContent = JSON.stringify(schema);
          break;
        }
      } catch (e) {}
    }
  }

  function _updateStarsUI(starsDiv, label, avg, count, userRated) {
    var rounded = Math.round(avg);
    var stars = starsDiv.querySelectorAll('.rating-star');
    for (var j = 0; j < stars.length; j++) {
      stars[j].classList.toggle('active', j < rounded);
      if (userRated) stars[j].disabled = true;
    }
    if (userRated) {
      label.textContent = 'Thanks! ' + avg + '/5 (' + count + ' rating' + (count > 1 ? 's' : '') + ')';
    } else if (count > 0) {
      label.textContent = avg + '/5 (' + count + ' rating' + (count > 1 ? 's' : '') + ') — Rate this tool';
    }
  }

  function renderRating() {
    // Skip if already rendered
    if (document.getElementById('tool-rating')) return;

    // Insert after related-tools, or after tool-faqs, or skip
    var relTools = document.getElementById('related-tools');
    var faqSection = document.getElementById('tool-faqs');
    var anchor = relTools || faqSection;
    if (!anchor) return;

    var slug = _getToolSlug();
    var userRated = _hasUserRated(slug);

    // Create container
    var wrapper = document.createElement('div');
    wrapper.className = 'tool-rating';
    wrapper.id = 'tool-rating';

    var label = document.createElement('p');
    label.className = 'rating-label';
    label.textContent = userRated ? 'Thanks for rating!' : 'Rate this tool';

    var starsDiv = document.createElement('div');
    starsDiv.className = 'rating-stars';

    for (var i = 1; i <= 5; i++) {
      var star = document.createElement('button');
      star.className = 'rating-star';
      star.setAttribute('data-value', i);
      star.setAttribute('aria-label', 'Rate ' + i + ' star' + (i > 1 ? 's' : ''));
      star.innerHTML = '&#9733;';
      if (userRated) star.disabled = true;
      starsDiv.appendChild(star);
    }

    wrapper.appendChild(label);
    wrapper.appendChild(starsDiv);
    // Insert after the anchor (after related-tools or after tool-faqs)
    if (anchor.nextSibling) {
      anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);
    } else {
      anchor.parentNode.appendChild(wrapper);
    }

    // Fetch aggregate rating from Firebase and update UI + schema
    _fetchRatingFromFirebase(slug, function (data) {
      if (data) {
        _updateStarsUI(starsDiv, label, data.avg, data.count, userRated);
        _injectAggregateRating(data.avg, data.count);
      }
    });

    // Click handler (only if not already rated)
    if (!userRated) {
      starsDiv.addEventListener('click', function (e) {
        var btn = e.target.closest('.rating-star');
        if (!btn || _hasUserRated(slug)) return;

        var value = parseInt(btn.getAttribute('data-value'), 10);
        _markUserRated(slug);
        _sendRatingToGA(slug, value);

        // Disable all stars immediately
        var allStars = starsDiv.querySelectorAll('.rating-star');
        for (var j = 0; j < allStars.length; j++) {
          allStars[j].classList.toggle('active', j < value);
          allStars[j].disabled = true;
        }
        label.textContent = 'Saving...';

        // Submit to Firebase and update
        _submitRatingToFirebase(slug, value, function (data) {
          if (data) {
            _updateStarsUI(starsDiv, label, data.avg, data.count, true);
            _injectAggregateRating(data.avg, data.count);
          } else {
            label.textContent = 'Thanks for rating!';
          }
        });
      });

      // Hover effect
      starsDiv.addEventListener('mouseover', function (e) {
        var btn = e.target.closest('.rating-star');
        if (!btn || _hasUserRated(slug)) return;
        var val = parseInt(btn.getAttribute('data-value'), 10);
        var stars = starsDiv.querySelectorAll('.rating-star');
        for (var j = 0; j < stars.length; j++) {
          stars[j].classList.toggle('hover', j < val);
        }
      });
      starsDiv.addEventListener('mouseout', function () {
        var stars = starsDiv.querySelectorAll('.rating-star');
        for (var j = 0; j < stars.length; j++) {
          stars[j].classList.remove('hover');
        }
      });
    }
  }

  // --- Quick Feedback Widget (shows after star rating or standalone) ---
  var FEEDBACK_URL = 'https://teamzlab-tools-default-rtdb.firebaseio.com/feedback';

  function renderFeedback() {
    if (document.getElementById('tool-feedback')) return;

    var ratingEl = document.getElementById('tool-rating');
    var relTools = document.getElementById('related-tools');
    var anchor = ratingEl || relTools;
    if (!anchor) return;

    var slug = _getToolSlug();
    var key = _safeKey(slug);
    var hasFeedback = false;
    try { hasFeedback = localStorage.getItem('tz_fb_' + slug) === '1'; } catch(e) {}

    var widget = document.createElement('div');
    widget.id = 'tool-feedback';
    widget.className = 'tool-feedback';

    if (hasFeedback) {
      widget.innerHTML = '<p class="feedback-thanks">Thanks for your feedback!</p>';
    } else {
      widget.innerHTML =
        '<p class="feedback-question">Was this tool useful?</p>' +
        '<div class="feedback-reactions">' +
          '<button class="feedback-btn" data-reaction="love" title="Love it!">&#10084;&#65039; Love it</button>' +
          '<button class="feedback-btn" data-reaction="useful" title="Useful">&#128077; Useful</button>' +
          '<button class="feedback-btn" data-reaction="ok" title="It\'s OK">&#128528; OK</button>' +
          '<button class="feedback-btn" data-reaction="needs-work" title="Needs work">&#128679; Needs work</button>' +
        '</div>' +
        '<div class="feedback-followup" id="feedback-followup" style="display:none;">' +
          '<p class="feedback-followup-q" id="feedback-followup-q"></p>' +
          '<div class="feedback-tags" id="feedback-tags"></div>' +
        '</div>';
    }

    if (anchor.nextSibling) {
      anchor.parentNode.insertBefore(widget, anchor.nextSibling);
    } else {
      anchor.parentNode.appendChild(widget);
    }

    if (hasFeedback) return;

    // Reaction tags based on sentiment
    var positiveTags = ['Use daily', 'Better than alternatives', 'Fast & simple', 'Great results', 'Privacy-first'];
    var negativeTags = ['Confusing UI', 'Wrong results', 'Missing features', 'Too slow', 'Not what I expected'];

    widget.querySelectorAll('.feedback-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var reaction = btn.getAttribute('data-reaction');
        var isPositive = (reaction === 'love' || reaction === 'useful');

        // Highlight selected button
        widget.querySelectorAll('.feedback-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');

        // Show follow-up tags
        var followup = document.getElementById('feedback-followup');
        var followupQ = document.getElementById('feedback-followup-q');
        var tagsDiv = document.getElementById('feedback-tags');

        followupQ.textContent = isPositive ? 'What did you like most?' : 'What could be better?';
        var tags = isPositive ? positiveTags : negativeTags;
        tagsDiv.innerHTML = '';
        tags.forEach(function(tag) {
          var tagBtn = document.createElement('button');
          tagBtn.className = 'feedback-tag';
          tagBtn.textContent = tag;
          tagBtn.addEventListener('click', function() {
            tagBtn.classList.toggle('selected');
          });
          tagsDiv.appendChild(tagBtn);
        });

        // Add submit button
        var submitBtn = document.createElement('button');
        submitBtn.className = 'btn-primary feedback-submit';
        submitBtn.textContent = 'Submit Feedback';
        submitBtn.addEventListener('click', function() {
          var selectedTags = [];
          tagsDiv.querySelectorAll('.feedback-tag.selected').forEach(function(t) {
            selectedTags.push(t.textContent);
          });

          // Save to Firebase
          var feedbackData = {
            reaction: reaction,
            tags: selectedTags.join(','),
            timestamp: Date.now(),
            path: window.location.pathname
          };
          fetch(FEEDBACK_URL + '/' + key + '.json')
            .then(function(r) { return r.json(); })
            .then(function(existing) {
              var reactions = (existing && existing.reactions) || {};
              reactions[reaction] = (reactions[reaction] || 0) + 1;
              var tagCounts = (existing && existing.tagCounts) || {};
              selectedTags.forEach(function(t) { tagCounts[t] = (tagCounts[t] || 0) + 1; });
              var totalFeedback = (existing && existing.total) || 0;
              return fetch(FEEDBACK_URL + '/' + key + '.json', {
                method: 'PUT',
                body: JSON.stringify({
                  reactions: reactions,
                  tagCounts: tagCounts,
                  total: totalFeedback + 1,
                  lastUpdated: Date.now()
                })
              });
            })
            .catch(function() {});

          // Track in GA
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'tool_feedback', {
              event_category: 'engagement',
              event_label: slug,
              reaction: reaction,
              tags: selectedTags.join(',')
            });
          }

          // Mark as submitted
          try { localStorage.setItem('tz_fb_' + slug, '1'); } catch(e) {}

          // Show thanks
          widget.innerHTML = '<p class="feedback-thanks">Thanks for your feedback! We\'ll use it to make this tool better.</p>';
          if (window.showToast) window.showToast('Feedback submitted!');
        });

        // Remove existing submit button if any
        var existingSubmit = tagsDiv.parentNode.querySelector('.feedback-submit');
        if (existingSubmit) existingSubmit.remove();
        tagsDiv.parentNode.appendChild(submitBtn);
        followup.style.display = '';
      });
    });
  }

  return {
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    renderBreadcrumbs: renderBreadcrumbs,
    injectBreadcrumbSchema: injectBreadcrumbSchema,
    injectFAQSchema: injectFAQSchema,
    injectWebAppSchema: injectWebAppSchema,
    injectOrganizationSchema: injectOrganizationSchema,
    injectWebSiteSchema: injectWebSiteSchema,
    renderRelatedTools: renderRelatedTools,
    renderFAQs: renderFAQs,
    renderRating: renderRating,
    renderFeedback: renderFeedback,
    SITE_NAME: SITE_NAME,
    SITE_URL: SITE_URL,

    // ─── VIRAL SHARE LINKS — encode/decode tool data in URL params ───
    /**
     * Encode data object into a shareable URL
     * Usage: TeamzTools.shareEncode({ to: 'Nahid', from: 'Sazzad', amount: '500' })
     * Returns: https://tool.teamzlab.com/ramadan/eid-salami-card-generator/?to=Nahid&from=Sazzad&amount=500
     */
    shareEncode: function(data) {
      var params = new URLSearchParams();
      Object.keys(data).forEach(function(key) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          params.set(key, data[key]);
        }
      });
      return SITE_URL + window.location.pathname + '?' + params.toString();
    },

    /**
     * Decode URL params into a data object
     * Usage: var data = TeamzTools.shareDecode(); // { to: 'Nahid', from: 'Sazzad', amount: '500' }
     */
    shareDecode: function() {
      var params = new URLSearchParams(window.location.search);
      var data = {};
      // Keys that are enum/ID values — strip any trailing text from share API pollution
      var enumKeys = ['style', 'bank', 'currency', 'theme', 'mode', 'type', 'format'];
      params.forEach(function(value, key) {
        // Skip tracking params
        if (key === 'fbclid' || key === 'utm_source' || key === 'utm_medium' || key === 'utm_campaign' || key === 'ref') return;
        var decoded = decodeURIComponent(value);
        // Some messaging apps (WhatsApp, Messenger) append share text to the last URL param
        // e.g. "sonar-bank Check out this Eid Salami!" — strip trailing junk from enum keys
        if (enumKeys.indexOf(key) !== -1 && decoded.indexOf(' ') !== -1) {
          decoded = decoded.split(/\s/)[0];
        }
        data[key] = decoded;
      });
      return data;
    },

    /**
     * Check if page was opened via a share link (has data params, not just tracking)
     */
    isSharedView: function() {
      var data = this.shareDecode();
      return Object.keys(data).length > 0;
    },

    /**
     * Copy share URL to clipboard and show toast
     * Usage: TeamzTools.copyShareLink({ to: 'Nahid', amount: '500' })
     */
    copyShareLink: function(data, toastFn, shareOpts) {
      var url = this.shareEncode(data);
      var notify = toastFn || function() {};
      var opts = shareOpts || {};
      var pageTitle = opts.title || document.querySelector('h1') && document.querySelector('h1').textContent || 'Teamz Lab Tools';
      var shareText = opts.text || pageTitle;

      // Try Web Share API first (best on mobile)
      if (navigator.share) {
        navigator.share({
          title: pageTitle + ' — Teamz Lab Tools',
          text: shareText,
          url: url
        }).then(function() {
          notify('Shared!');
        }).catch(function() {
          // User cancelled or share failed — fallback to copy
          fallbackCopy(url, notify);
        });
        return url;
      }

      fallbackCopy(url, notify);
      return url;

      function fallbackCopy(u, cb) {
        // Try clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(u).then(function() {
            cb('Share link copied!');
          }).catch(function() {
            textareaCopy(u, cb);
          });
        } else {
          textareaCopy(u, cb);
        }
      }

      function textareaCopy(u, cb) {
        try {
          var ta = document.createElement('textarea');
          ta.value = u;
          ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          cb('Share link copied!');
        } catch(e) {
          // Last resort — show URL in prompt
          window.prompt('Copy this link:', u);
        }
      }
    },

    /**
     * Show a viral banner when viewing a shared card
     * Usage: TeamzTools.showSharedBanner('Sazzad sent Nahid ৳500 Eid Salami!')
     */
    showSharedBanner: function(message) {
      var banner = document.createElement('div');
      banner.className = 'teamz-shared-banner';
      banner.innerHTML =
        '<div class="shared-banner__text">' + _escapeHtml(message) + '</div>' +
        '<a href="' + window.location.pathname + '" class="shared-banner__cta">Create Your Own</a>';
      var hero = document.querySelector('.tool-hero');
      if (hero) {
        hero.parentNode.insertBefore(banner, hero.nextSibling);
      }
    }
  };
})();

// --- Translation System (Google Translate + Language Switcher) ---
var TeamzTranslate = (function () {
  var LANG_KEY = 'teamztools_lang';
  var RTL_LANGS = ['ar', 'he', 'fa', 'ur', 'ps', 'sd'];
  var gtLoaded = false;
  var currentLang = 'en';

  var LANGUAGES = {
    en: 'English', bn: 'বাংলা', hi: 'हिन्दी', ur: 'اردو', ar: 'العربية',
    de: 'Deutsch', fr: 'Français', es: 'Español', pt: 'Português', it: 'Italiano',
    nl: 'Nederlands', sv: 'Svenska', no: 'Norsk', fi: 'Suomi', da: 'Dansk',
    pl: 'Polski', cs: 'Čeština', ro: 'Română', hu: 'Magyar', el: 'Ελληνικά',
    tr: 'Türkçe', ru: 'Русский', uk: 'Українська', ja: '日本語', ko: '한국어',
    zh: '中文', th: 'ไทย', vi: 'Tiếng Việt', id: 'Bahasa Indonesia', ms: 'Bahasa Melayu',
    tl: 'Filipino', sw: 'Kiswahili', am: 'አማርኛ', ha: 'Hausa', yo: 'Yorùbá',
    ig: 'Igbo', zu: 'isiZulu', af: 'Afrikaans', ta: 'தமிழ்', te: 'తెలుగు',
    ml: 'മലയാളം', kn: 'ಕನ್ನಡ', mr: 'मराठी', gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ',
    ne: 'नेपाली', si: 'සිංහල', my: 'မြန်မာ', km: 'ខ្មែរ', lo: 'ລາວ',
    ka: 'ქართული', hy: 'Հայերեն', az: 'Azərbaycan', uz: 'Oʻzbek', kk: 'Қазақ',
    he: 'עברית', fa: 'فارسی'
  };

  // Country → local hub mapping (only countries that have dedicated hub pages)
  var COUNTRY_HUB = {
    BD:{hub:'/bd/',flag:'🇧🇩',name:'Bangladesh Tools',native:'বাংলাদেশ টুলস'},
    IN:{hub:'/in/',flag:'🇮🇳',name:'India Tools',native:'भारत टूल्स'},
    DE:{hub:'/de/',flag:'🇩🇪',name:'Deutsche Tools',native:'Deutsche Tools'},
    FR:{hub:'/fr/',flag:'🇫🇷',name:'Outils français',native:'Outils français'},
    JP:{hub:'/jp/',flag:'🇯🇵',name:'日本のツール',native:'日本のツール'},
    AE:{hub:'/ae/',flag:'🇦🇪',name:'UAE Tools',native:'أدوات الإمارات'},
    SA:{hub:'/sa/',flag:'🇸🇦',name:'Saudi Tools',native:'أدوات السعودية'},
    EG:{hub:'/eg/',flag:'🇪🇬',name:'Egypt Tools',native:'أدوات مصر'},
    GB:{hub:'/uk/',flag:'🇬🇧',name:'UK Tools',native:'UK Tools'},
    AU:{hub:'/au/',flag:'🇦🇺',name:'Australia Tools',native:'Australia Tools'},
    CA:{hub:'/ca/',flag:'🇨🇦',name:'Canada Tools',native:'Canada Tools'},
    SE:{hub:'/se/',flag:'🇸🇪',name:'Svenska verktyg',native:'Svenska verktyg'},
    NO:{hub:'/no/',flag:'🇳🇴',name:'Norske verktøy',native:'Norske verktøy'},
    FI:{hub:'/fi/',flag:'🇫🇮',name:'Suomalaiset työkalut',native:'Suomalaiset työkalut'},
    NL:{hub:'/nl/',flag:'🇳🇱',name:'Nederlandse tools',native:'Nederlandse tools'},
    ID:{hub:'/id/',flag:'🇮🇩',name:'Alat Indonesia',native:'Alat Indonesia'},
    MY:{hub:'/my/',flag:'🇲🇾',name:'Malaysian Tools',native:'Alat Malaysia'},
    PH:{hub:'/ph/',flag:'🇵🇭',name:'Philippine Tools',native:'Philippine Tools'},
    GH:{hub:'/gh/',flag:'🇬🇭',name:'Ghana Tools',native:'Ghana Tools'},
    KE:{hub:'/ke/',flag:'🇰🇪',name:'Kenya Tools',native:'Kenya Tools'},
    NG:{hub:'/ng/',flag:'🇳🇬',name:'Nigeria Tools',native:'Nigeria Tools'},
    ZA:{hub:'/za/',flag:'🇿🇦',name:'South Africa Tools',native:'SA Tools'},
    VN:{hub:'/vn/',flag:'🇻🇳',name:'Công cụ Việt Nam',native:'Công cụ Việt Nam'},
    SG:{hub:'/sg/',flag:'🇸🇬',name:'Singapore Tools',native:'Singapore Tools'},
    US:{hub:'/us/',flag:'🇺🇸',name:'US Tools',native:'US Tools'},
    MA:{hub:'/ma/',flag:'🇲🇦',name:'Morocco Tools',native:'أدوات المغرب'}
  };

  function init() {
    var urlLang = new URLSearchParams(location.search).get('lang');
    var storedLang = localStorage.getItem(LANG_KEY);
    currentLang = _normalize(urlLang || storedLang || 'en');

    _renderDropdown();
    _bindEvents();
    _updateDisplay();

    if (currentLang !== 'en') {
      _applyLang(currentLang);
    }

    // Smart country suggestion: suggest local hub if visitor is from a country with one
    _suggestLocalHub();
  }

  function _suggestLocalHub() {
    // Only on homepage or English pages, only once per session
    if (sessionStorage.getItem('tz_hub_suggested')) return;
    if (localStorage.getItem('tz_hub_dismissed')) return;
    // Don't suggest if already on a country hub
    var path = location.pathname;
    for (var c in COUNTRY_HUB) {
      if (path.indexOf(COUNTRY_HUB[c].hub) === 0) return;
    }

    fetch('https://www.cloudflare.com/cdn-cgi/trace')
      .then(function(r) { return r.text(); })
      .then(function(text) {
        var match = text.match(/loc=([A-Z]{2})/);
        if (!match) return;
        var hub = COUNTRY_HUB[match[1]];
        if (!hub) return;
        sessionStorage.setItem('tz_hub_suggested', '1');
        _showHubBanner(hub);
      })
      .catch(function() {});
  }

  function _showHubBanner(hub) {
    var banner = document.createElement('div');
    banner.className = 'lang-auto-banner';
    banner.innerHTML =
      '<span>' + hub.flag + ' ' + hub.native + ' available!</span>' +
      '<a href="' + hub.hub + '" class="lang-auto-banner__switch" style="text-decoration:none">Visit ' + hub.name + '</a>' +
      '<button class="lang-auto-banner__close" onclick="this.parentNode.remove();try{localStorage.setItem(\'tz_hub_dismissed\',\'1\')}catch(e){}" aria-label="Close">&times;</button>';
    var header = document.getElementById('site-header');
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(banner, header.nextSibling);
    }
  }

  function _normalize(lang) {
    if (!lang) return 'en';
    var raw = String(lang).trim().toLowerCase();
    if (LANGUAGES[raw]) return raw;
    return 'en';
  }

  function _renderDropdown() {
    var dropdown = document.getElementById('lang-dropdown');
    if (!dropdown) return;
    var html = '';
    for (var code in LANGUAGES) {
      var active = code === currentLang ? ' lang-option--active' : '';
      html += '<button class="lang-option notranslate' + active + '" type="button" data-lang="' + code + '" translate="no">' + LANGUAGES[code] + '</button>';
    }
    dropdown.innerHTML = html;
  }

  function _bindEvents() {
    var toggle = document.getElementById('lang-toggle');
    var dropdown = document.getElementById('lang-dropdown');
    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', function () {
      dropdown.classList.toggle('open');
    });

    dropdown.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-option');
      if (!btn) return;
      var lang = btn.getAttribute('data-lang') || 'en';
      setLang(lang);
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.lang-selector')) {
        dropdown.classList.remove('open');
      }
    });
  }

  function setLang(lang) {
    lang = _normalize(lang);
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);

    var isRtl = RTL_LANGS.indexOf(lang) !== -1;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

    _updateDisplay();
    _applyLang(lang);

    if (typeof TeamzAnalytics !== 'undefined') {
      TeamzAnalytics.trackClick('language::' + lang);
    }
  }

  function _updateDisplay() {
    var el = document.getElementById('current-lang');
    if (el) el.textContent = currentLang.toUpperCase();

    var options = document.querySelectorAll('.lang-option');
    for (var i = 0; i < options.length; i++) {
      if (options[i].getAttribute('data-lang') === currentLang) {
        options[i].classList.add('lang-option--active');
      } else {
        options[i].classList.remove('lang-option--active');
      }
    }

    var dropdown = document.getElementById('lang-dropdown');
    if (dropdown) dropdown.classList.remove('open');
  }

  function _applyLang(lang) {
    if (lang === 'en') {
      _setGoogCookie('en');
      _triggerGT('en');
      setTimeout(function () { _triggerGT('en'); }, 300);
      document.documentElement.classList.add('notranslate');
      document.documentElement.setAttribute('translate', 'no');
      return;
    }

    document.documentElement.classList.remove('notranslate');
    document.documentElement.removeAttribute('translate');

    // Protect technical terms
    _protectTerms();

    _setGoogCookie(lang);
    if (!gtLoaded) {
      _loadGT(function () {
        _triggerGT(lang);
        setTimeout(function () { _triggerGT(lang); }, 300);
      });
    } else {
      _triggerGT(lang);
      setTimeout(function () { _triggerGT(lang); }, 300);
    }
  }

  function _setGoogCookie(lang) {
    var pageLang = (document.documentElement.getAttribute('lang') || 'en').split('-')[0];
    var value = '/' + pageLang + '/' + lang;
    var host = location.hostname;
    var parts = host.split('.');
    var domains = [host, '.' + host];
    if (parts.length > 1) domains.push('.' + parts.slice(-2).join('.'));
    for (var i = 0; i < domains.length; i++) {
      document.cookie = 'googtrans=' + value + ';path=/;domain=' + domains[i];
    }
    document.cookie = 'googtrans=' + value + ';path=/';
  }

  function _loadGT(callback) {
    if (gtLoaded) { callback(); return; }

    // Detect page's actual language for proper translation
    var pageLang = document.documentElement.getAttribute('lang') || 'en';
    // Normalize: ja, ar, de, fr, etc. → use as source
    var sourceLang = pageLang.split('-')[0]; // handle en-US, zh-CN etc.

    window.googleTranslateElementInit = function () {
      new google.translate.TranslateElement({
        pageLanguage: sourceLang,
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
      gtLoaded = true;
      if (callback) callback();
    };

    var div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);

    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
  }

  function _triggerGT(lang) {
    try {
      var frame = document.querySelector('.goog-te-combo');
      if (frame) {
        frame.value = lang;
        frame.dispatchEvent(new Event('change'));
      }
    } catch (e) {}
  }

  function _protectTerms() {
    var terms = ['Teamz Lab', 'GitHub', 'JSON', 'HTML', 'CSS', 'JavaScript', 'SQL', 'XML', 'YAML', 'JWT', 'UUID', 'Base64', 'URL', 'API', 'SaaS', 'MVP', 'CTA', 'SEO', 'AdSense', 'Firebase'];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while (node = walker.nextNode()) {
      if (node.parentElement && node.parentElement.classList && node.parentElement.classList.contains('notranslate')) continue;
      for (var i = 0; i < terms.length; i++) {
        if (node.textContent.indexOf(terms[i]) !== -1 && node.parentElement) {
          node.parentElement.classList.add('notranslate');
          node.parentElement.setAttribute('translate', 'no');
          break;
        }
      }
    }
  }

  return {
    init: init,
    setLang: setLang,
    currentLang: function () { return currentLang; }
  };
})();

// --- Central Analytics: Firebase + GA4 + Local Tracker ---
var TeamzAnalytics = (function () {
  // Firebase config
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyC9Spv8AEEST24cqHWOfWe4PKTJflJ6lPg",
    authDomain: "teamzlab-tools.firebaseapp.com",
    projectId: "teamzlab-tools",
    storageBucket: "teamzlab-tools.firebasestorage.app",
    messagingSenderId: "969055848716",
    appId: "1:969055848716:web:b1283be103e3cf334d6129",
    measurementId: "G-TDGVH91VS8",
    databaseURL: "https://teamzlab-tools-default-rtdb.firebaseio.com"
  };
  var GA_ID = 'G-TDGVH91VS8';
  var STORAGE_KEY = 'teamztools_analytics';
  var _firebaseReady = false;
  var _isDevMode = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
  // Skip analytics for site owner — run this once in browser console: localStorage.setItem('teamz_owner','1')
  var _isOwner = (localStorage.getItem('teamz_owner') === '1');

  function init() {
    if (!_isDevMode && !_isOwner) {
      _loadFirebase();
      _trackEngagement();
    }
    // Local tracker always runs (useful for dev too)
    _trackPageView();
  }

  // --- Firebase + GA4 Loading ---
  function _loadFirebase() {
    // Load Firebase SDK via CDN (compat version for var/function support)
    var fbApp = document.createElement('script');
    fbApp.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js';
    fbApp.onload = function () {
      var fbAnalytics = document.createElement('script');
      fbAnalytics.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics-compat.js';
      fbAnalytics.onload = function () {
        // Load App Check (reCAPTCHA v3 — invisible to users)
        var fbAppCheck = document.createElement('script');
        fbAppCheck.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check-compat.js';
        fbAppCheck.onload = function () {
          _initFirebaseApp();
        };
        fbAppCheck.onerror = function () {
          // App Check failed to load — init without it
          _initFirebaseApp();
        };
        document.head.appendChild(fbAppCheck);
      };
      document.head.appendChild(fbAnalytics);
    };
    document.head.appendChild(fbApp);

    function _initFirebaseApp() {
      try {
        var app = firebase.initializeApp(FIREBASE_CONFIG);

        // Activate App Check with reCAPTCHA v3 (invisible, no user interaction)
        if (firebase.appCheck) {
          try {
            firebase.appCheck().activate('6LdTN48sAAAAABRarboqZwlBDY-YTPjD9A4MzRWn', true);
          } catch (e) {
            console.warn('App Check activation error:', e);
          }
        }

        var analytics = firebase.analytics(app);
        window._fbAnalytics = analytics;
        _firebaseReady = true;

        // Log initial page view with rich data
        analytics.logEvent('page_view', _getPageContext());

        // Track tool category view
        var ctx = _getPageContext();
        if (ctx.tool_category && ctx.tool_category !== 'home') {
          analytics.logEvent('tool_category_view', {
            category: ctx.tool_category,
            tool_slug: ctx.tool_slug,
            country: ctx.country,
            language: document.documentElement.lang || 'en'
          });
        }
      } catch (e) {
        console.warn('Firebase init error:', e);
      }
    }

    // Microsoft Clarity — session recordings + heatmaps
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "w1hpj87iy0");

    // Also load gtag for GA4 (works alongside Firebase)
    var gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      send_page_view: true,
      custom_map: {
        dimension1: 'tool_category',
        dimension2: 'tool_slug',
        dimension3: 'tool_country',
        dimension4: 'tool_language'
      }
    });

    // Send custom dimensions
    var ctx = _getPageContext();
    window.gtag('set', 'user_properties', {
      preferred_language: document.documentElement.lang || 'en'
    });
    if (ctx.tool_category) {
      window.gtag('event', 'page_view', {
        tool_category: ctx.tool_category,
        tool_slug: ctx.tool_slug,
        tool_country: ctx.country,
        tool_language: document.documentElement.lang || 'en'
      });
    }
  }

  // --- Page Context Extraction ---
  function _getPageContext() {
    var path = window.location.pathname;
    var parts = path.split('/').filter(function (p) { return p.length > 0; });
    var category = parts[0] || 'home';
    var slug = parts[1] || '';
    var country = 'global';

    // Detect country from category
    var countryCodes = {
      'uk': 'UK', 'de': 'DE', 'fr': 'FR', 'se': 'SE', 'no': 'NO', 'fi': 'FI',
      'in': 'IN', 'ca': 'CA', 'jp': 'JP', 'au': 'AU', 'my': 'MY', 'id': 'ID',
      'ph': 'PH', 'sg': 'SG', 'vn': 'VN', 'sa': 'SA', 'ae': 'AE', 'eg': 'EG', 'ma': 'MA'
    };
    if (countryCodes[category]) {
      country = countryCodes[category];
    }

    return {
      page_path: path,
      tool_category: category,
      tool_slug: slug,
      country: country,
      page_title: document.title,
      language: document.documentElement.lang || 'en'
    };
  }

  // --- Local Tracker ---
  function _trackPageView() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      var path = window.location.pathname;
      var today = new Date().toISOString().split('T')[0];

      if (!data.pages) data.pages = {};
      if (!data.pages[path]) data.pages[path] = { views: 0, clicks: 0, first: today, last: today };

      data.pages[path].views++;
      data.pages[path].last = today;
      data.totalViews = (data.totalViews || 0) + 1;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // --- Engagement Tracking ---
  function _trackEngagement() {
    // Track scroll depth
    var scrollTracked = {};
    window.addEventListener('scroll', function () {
      var scrollPct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      var milestones = [25, 50, 75, 90];
      for (var i = 0; i < milestones.length; i++) {
        if (scrollPct >= milestones[i] && !scrollTracked[milestones[i]]) {
          scrollTracked[milestones[i]] = true;
          _fireEvent('scroll_depth', { depth: milestones[i] + '%', page_path: window.location.pathname });
        }
      }
    });

    // Track time on page
    var startTime = Date.now();
    window.addEventListener('beforeunload', function () {
      var timeSpent = Math.round((Date.now() - startTime) / 1000);
      _fireEvent('time_on_page', {
        seconds: timeSpent,
        page_path: window.location.pathname,
        tool_category: _getPageContext().tool_category
      });
    });

    // Track outbound link clicks
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (link && link.hostname && link.hostname !== window.location.hostname) {
        _fireEvent('outbound_click', {
          url: link.href,
          link_text: (link.textContent || '').substring(0, 50),
          page_path: window.location.pathname
        });
      }
    });

    // Track FAQ opens
    document.addEventListener('toggle', function (e) {
      if (e.target.tagName === 'DETAILS' && e.target.open) {
        var question = e.target.querySelector('summary');
        _fireEvent('faq_open', {
          question: question ? question.textContent.substring(0, 100) : '',
          page_path: window.location.pathname
        });
      }
    }, true);

    // Track related tool clicks
    document.addEventListener('click', function (e) {
      var card = e.target.closest('.related-tool-card');
      if (card) {
        _fireEvent('related_tool_click', {
          destination: card.getAttribute('href') || '',
          source_page: window.location.pathname
        });
      }
    });

    // Track tool card clicks on homepage
    document.addEventListener('click', function (e) {
      var card = e.target.closest('.tool-card');
      if (card) {
        _fireEvent('tool_card_click', {
          destination: card.getAttribute('href') || '',
          source_page: window.location.pathname
        });
      }
    });

    // Track theme toggle
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        _fireEvent('theme_toggle', { new_theme: newTheme });
      });
    }
  }

  // --- Core Event Dispatcher ---
  function _fireEvent(eventName, params) {
    // Skip all remote analytics in dev mode
    if (_isDevMode) return;

    // Firebase Analytics
    if (_firebaseReady && window._fbAnalytics) {
      try { window._fbAnalytics.logEvent(eventName, params); } catch (e) {}
    }
    // GA4 gtag
    if (window.gtag) {
      try { window.gtag('event', eventName, params); } catch (e) {}
    }
  }

  // --- Public: Track Tool Actions ---
  function trackClick(label) {
    var ctx = _getPageContext();

    // Local storage
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      var path = window.location.pathname;
      if (!data.pages) data.pages = {};
      if (!data.pages[path]) data.pages[path] = { views: 0, clicks: 0, first: '', last: '' };
      data.pages[path].clicks++;
      data.totalClicks = (data.totalClicks || 0) + 1;
      if (!data.clickLabels) data.clickLabels = {};
      data.clickLabels[path + '::' + label] = (data.clickLabels[path + '::' + label] || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}

    // Determine action type from label
    var action = label.split('::')[0]; // calculate, copy, print, cta, download, process
    var toolSlug = label.split('::')[1] || ctx.tool_slug;

    _fireEvent('tool_action', {
      action: action,
      tool_slug: toolSlug,
      tool_category: ctx.tool_category,
      country: ctx.country,
      page_path: ctx.page_path
    });

    // Also fire specific events for key actions
    if (action === 'calculate' || action === 'process') {
      _fireEvent('tool_use', {
        tool_slug: toolSlug,
        tool_category: ctx.tool_category,
        country: ctx.country
      });
    }
    if (action === 'cta') {
      _fireEvent('lead_click', {
        tool_slug: toolSlug,
        tool_category: ctx.tool_category,
        country: ctx.country,
        page_path: ctx.page_path
      });
    }
    if (action === 'copy') {
      _fireEvent('result_copy', { tool_slug: toolSlug });
    }
    if (action === 'download') {
      _fireEvent('file_download', { tool_slug: toolSlug });
    }
  }

  // --- Public: Get Local Stats ---
  function getStats() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function getTopPages(limit) {
    var data = getStats();
    if (!data.pages) return [];
    var pages = Object.keys(data.pages).map(function (path) {
      return { path: path, views: data.pages[path].views, clicks: data.pages[path].clicks };
    });
    pages.sort(function (a, b) { return b.views - a.views; });
    return pages.slice(0, limit || 20);
  }

  return {
    init: init,
    trackClick: trackClick,
    getStats: getStats,
    getTopPages: getTopPages,
    GA_ID: GA_ID
  };
})();

// === CENTRAL SEARCH COMPONENT ===
// Auto-injects smart search bar into ALL hub page hero sections
// Lazy-loads search-index.js + smart-search.js on demand
// Uses TeamzSearch for synonym/fuzzy/AI-powered search (Chrome AI → Transformers.js → concept)
// Homepage search is also upgraded to use smart search when available
(function initCentralSearch() {
  document.addEventListener('DOMContentLoaded', function () {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var existingSearch = document.getElementById('tool-search');
    var isHomepage = (existingSearch !== null);
    var isHubPage = !isHomepage && !!document.querySelector('.tools-grid');

    // Only activate on homepage (upgrade) or hub pages (inject)
    if (!isHomepage && !isHubPage) return;

    var pathParts = window.location.pathname.split('/').filter(Boolean);
    var currentHub = pathParts.length > 0 ? pathParts[0] : '';
    var hubName = (hero.querySelector('h1') || {}).textContent || '';

    // For hub pages: inject search bar into hero
    if (isHubPage) {
      var searchWrap = document.createElement('div');
      searchWrap.style.cssText = 'max-width:500px;margin:1.2rem auto 0;';
      var toolCount = document.querySelectorAll('.tool-card').length;
      var cleanName = (hubName || 'tools').replace(/\s*—.*/, '').trim();
      searchWrap.innerHTML =
        '<input type="text" id="tool-search" class="tool-input" placeholder="Search' + (toolCount > 0 ? ' ' + toolCount : '') + ' ' + cleanName + ' tools..." style="text-align:center;font-size:var(--text-lg);" autocomplete="off">' +
        '<div id="search-results" style="max-width:600px;margin:0.8rem auto 0;display:none;"></div>';
      hero.appendChild(searchWrap);
    }

    var searchInput = document.getElementById('tool-search');
    var searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    // Lazy-load search scripts if not already present
    function loadScript(src) {
      return new Promise(function (resolve) {
        var basename = src.split('/').pop().split('?')[0];
        if (document.querySelector('script[src*="' + basename + '"]')) { resolve(); return; }
        var s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = resolve;
        document.head.appendChild(s);
      });
    }

    var _scriptsLoaded = false;
    function ensureScripts() {
      if (_scriptsLoaded && typeof TOOL_SEARCH_INDEX !== 'undefined' && window.TeamzSearch) return Promise.resolve();
      var promises = [];
      if (typeof TOOL_SEARCH_INDEX === 'undefined') promises.push(loadScript('/shared/js/search-index.js'));
      if (!window.TeamzSearch) promises.push(loadScript('/shared/js/smart-search.js'));
      return Promise.all(promises).then(function () { _scriptsLoaded = true; });
    }

    var toolsSections = document.querySelectorAll('.tools-section');
    var adSlots = document.querySelectorAll('.ad-slot');
    var aiDebounce = null;

    function showToolsGrid() {
      toolsSections.forEach(function (s) { s.style.display = ''; });
      adSlots.forEach(function (s) { s.style.display = ''; });
    }
    function hideToolsGrid() {
      toolsSections.forEach(function (s) { s.style.display = 'none'; });
      adSlots.forEach(function (s) { s.style.display = 'none'; });
    }

    searchInput.addEventListener('input', function () {
      var query = searchInput.value.trim();
      if (query.length < 2) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        showToolsGrid();
        return;
      }

      ensureScripts().then(function () {
        var searchPool = (typeof TOOL_SEARCH_INDEX !== 'undefined') ? TOOL_SEARCH_INDEX : [];
        var results = [];

        if (window.TeamzSearch) {
          if (currentHub && isHubPage) {
            // Hub page: prioritize hub tools, then show global
            var hubPool = [], globalPool = [];
            searchPool.forEach(function (t) {
              if ((t.h || '').indexOf('/' + currentHub + '/') === 0) hubPool.push(t);
              else globalPool.push(t);
            });
            var hubResults = hubPool.length > 0 ? window.TeamzSearch.search(query, hubPool, 8) : [];
            var globalResults = window.TeamzSearch.search(query, globalPool, 15 - hubResults.length);
            var seen = {};
            hubResults.concat(globalResults).forEach(function (r) {
              if (!seen[r.h]) { seen[r.h] = true; results.push(r); }
            });
          } else {
            results = window.TeamzSearch.search(query, searchPool, 15);
          }
        } else {
          var words = query.toLowerCase().split(/\s+/);
          results = searchPool.filter(function (t) {
            var h = ((t.t || '') + ' ' + (t.d || '') + ' ' + (t.h || '')).toLowerCase();
            return words.every(function (w) { return h.indexOf(w) !== -1; });
          }).slice(0, 12).map(function (t) { return { t: t.t, d: t.d, h: t.h, source: 'static' }; });
        }

        _renderSearchResults(results, query, null);

        // AI fallback when few/no results
        if (results.length < 3 && window.TeamzSearch && query.length >= 3) {
          clearTimeout(aiDebounce);
          var captured = results.slice();
          aiDebounce = setTimeout(function () {
            window.TeamzSearch.aiSearch(query, searchPool, 12, function (aiR, src) {
              if (searchInput.value.trim().toLowerCase() !== query.toLowerCase()) return;
              var merged = captured.slice();
              var seenH = {};
              merged.forEach(function (r) { seenH[r.h] = true; });
              aiR.forEach(function (r) { if (!seenH[r.h]) { seenH[r.h] = true; merged.push(r); } });
              _renderSearchResults(merged, query, src);
            });
          }, 600);
        }

        // "Did you mean" for zero results
        if (results.length === 0 && window.TeamzSearch) {
          var sug = window.TeamzSearch.didYouMean(query, searchPool);
          if (sug) {
            searchResults.innerHTML += '<p style="color:var(--text-muted);text-align:center;font-size:var(--text-sm);margin-top:0.5rem;">Did you mean: <a href="#" style="color:var(--heading);text-decoration:underline;" data-suggest="' + sug + '">' + sug + '</a>?</p>';
            searchResults.querySelector('[data-suggest]').addEventListener('click', function (e) {
              e.preventDefault();
              searchInput.value = this.getAttribute('data-suggest');
              searchInput.dispatchEvent(new Event('input'));
            });
          }
        }
      });
    });

    function _renderSearchResults(matches, query, aiSource) {
      if (matches.length === 0) {
        searchResults.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No tools found for "' + _esc(query) + '"</p>';
        searchResults.style.display = 'block';
        hideToolsGrid();
        return;
      }
      var html = '';
      if (aiSource === 'ai') {
        html += '<p style="color:var(--text-muted);text-align:center;font-size:var(--text-sm);margin-bottom:0.5rem;">Smart suggestions</p>';
      }
      html += '<div class="tools-grid" style="grid-template-columns:1fr;">';
      matches.forEach(function (m) {
        var desc = (m.d || '').substring(0, 120);
        html += '<a href="' + m.h + '" class="tool-card" style="text-decoration:none;"><div class="card" style="padding:0.75rem 1rem;"><h3 style="font-size:var(--text-md);margin:0 0 0.2rem;">' + _esc(m.t) + '</h3>';
        if (desc) html += '<p style="font-size:var(--text-sm);margin:0;color:var(--text-muted);">' + _esc(desc) + '</p>';
        html += '</div></a>';
      });
      html += '</div>';
      searchResults.innerHTML = html;
      searchResults.style.display = 'block';
      hideToolsGrid();
    }

    function _esc(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    // Escape clears search and restores hub grid
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        showToolsGrid();
      }
    });
  });
})();

// Auto-render header, footer, floating CTA, and init analytics
document.addEventListener('DOMContentLoaded', function () {
  TeamzTools.renderHeader();
  TeamzTools.renderFooter();
  TeamzTranslate.init();

  // Render favorites section on homepage + hub pages
  (function renderFavoritesSection() {
    var favs = [];
    try { favs = JSON.parse(localStorage.getItem('tz_favorites') || '[]'); } catch(e) {}
    if (favs.length === 0) return;

    // Show on: homepage, hub index pages (1-segment paths like /ai/, /tools/)
    var path = window.location.pathname.replace(/^\/|\/$/g, '');
    var segments = path ? path.split('/') : [];
    var isHomepage = path === '' || path === 'index.html';
    var isHubPage = segments.length === 1; // /ai/, /tools/, /evergreen/ etc.
    if (!isHomepage && !isHubPage) return;

    // Find insertion point: after .hero or before .tools-grid parent
    var anchor = document.querySelector('.hero') || document.querySelector('.tool-hero');
    if (!anchor) {
      var grid = document.querySelector('.tools-grid');
      if (grid) anchor = grid.parentElement;
    }
    if (!anchor) return;

    var section = document.createElement('section');
    section.className = 'fav-homepage-section';
    section.id = 'favorites';
    var html = '<h2 style="font-size:var(--text-lg);color:var(--heading);margin-bottom:4px;">Your Favourites</h2>';
    html += '<div class="fav-homepage-grid">';
    for (var i = 0; i < favs.length; i++) {
      var f = favs[i];
      html += '<a href="/' + f.slug + '/" class="fav-homepage-card">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '<span class="fav-homepage-card__title">' + (f.title || f.slug) + '</span>' +
      '</a>';
    }
    html += '</div>';
    section.innerHTML = html;

    anchor.parentNode.insertBefore(section, anchor.nextSibling);
  })();
  // Rating widget renders after a short delay to ensure FAQs/related tools are rendered first
  setTimeout(function () { TeamzTools.renderRating(); TeamzTools.renderFeedback(); }, 100);

  // === CENTRAL FIX: Auto-scroll to results when they become visible ===
  // Uses MutationObserver to detect when tool-result divs go from hidden to visible
  (function initAutoScroll() {
    var results = document.querySelectorAll('.tool-result, [id*="result"], [id*="output"], [id*="preview"]');
    if (!results.length || !window.MutationObserver) return;
    results.forEach(function (el) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.type === 'attributes' && m.attributeName === 'style') {
            var display = el.style.display;
            if (display && display !== 'none') {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        });
      });
      observer.observe(el, { attributes: true, attributeFilter: ['style'] });
    });
  })();

  // === CENTRAL FIX: Auto-generate IDs for inputs without them ===
  // Ensures auto-save works for all inputs by generating IDs from label text or position
  (function initAutoIds() {
    var inputs = document.querySelectorAll('.tool-calculator input:not([id]), .tool-calculator textarea:not([id]), .tool-calculator select:not([id]), .site-main input:not([id]), .site-main textarea:not([id]), .site-main select:not([id])');
    inputs.forEach(function (input, i) {
      // Try to derive ID from label
      var label = input.closest('label') || (input.previousElementSibling && input.previousElementSibling.tagName === 'LABEL' ? input.previousElementSibling : null);
      if (label) {
        var text = (label.textContent || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 30);
        if (text && !document.getElementById('auto-' + text)) {
          input.id = 'auto-' + text;
          return;
        }
      }
      // Fallback: use position-based ID
      input.id = 'auto-input-' + i;
    });
  })();

  // Offline indicator — show banner when offline, hide when back online
  (function initOfflineIndicator() {
    var banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.innerHTML = 'You are offline — this tool still works. Your data is saved locally.';
    banner.style.display = 'none';
    document.body.appendChild(banner);

    function update() {
      banner.style.display = navigator.onLine ? 'none' : 'block';
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  })();

  // In-app browser detection — aggressive redirect / overlay
  var ua = navigator.userAgent || '';
  var isInAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Twitter|Snapchat|MicroMessenger|WeChat|TikTok|BytedanceWebview/i.test(ua);

  if (isInAppBrowser) {
    (function initInAppRedirect() {
      var pageUrl = window.location.href;
      var isAndroid = /android/i.test(ua);
      var isIOS = /iphone|ipad|ipod/i.test(ua);

      var appName = 'this app';
      var menuIcon = '⋯';
      if (/FBAN|FBAV|FB_IAB/i.test(ua)) { appName = 'Facebook'; menuIcon = '⋮'; }
      else if (/Messenger/i.test(ua)) { appName = 'Messenger'; menuIcon = 'ⓘ'; }
      else if (/Instagram/i.test(ua)) { appName = 'Instagram'; menuIcon = '⋯'; }
      else if (/TikTok|BytedanceWebview/i.test(ua)) { appName = 'TikTok'; menuIcon = '⋯'; }
      else if (/Line\//i.test(ua)) { appName = 'LINE'; menuIcon = '⋮'; }
      else if (/Twitter/i.test(ua)) { appName = 'Twitter/X'; menuIcon = '⋮'; }
      else if (/Snapchat/i.test(ua)) { appName = 'Snapchat'; menuIcon = '⋮'; }
      else if (/MicroMessenger|WeChat/i.test(ua)) { appName = 'WeChat'; menuIcon = '⋯'; }

      // Android: auto-redirect to Chrome via intent immediately
      if (isAndroid) {
        var intentUrl = 'intent://' + pageUrl.replace(/^https?:\/\//, '') +
          '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' +
          encodeURIComponent(pageUrl) + ';end';
        window.location.href = intentUrl;
        // Fallback: if intent fails after 2s, show overlay
        setTimeout(function() { showInAppOverlay(); }, 2000);
        return;
      }

      // iOS: try multiple redirect tricks before showing overlay
      if (isIOS) {
        var redirected = false;

        // Trick 1: Try googlechrome:// scheme (opens Chrome iOS if installed)
        // googlechrome:// for http, googlechromes:// for https
        var chromeScheme = pageUrl.replace(/^https:\/\//, 'googlechromes://').replace(/^http:\/\//, 'googlechrome://');
        var hiddenFrame = document.createElement('iframe');
        hiddenFrame.style.cssText = 'display:none;width:0;height:0';
        hiddenFrame.src = chromeScheme;
        document.body.appendChild(hiddenFrame);

        // Trick 2: Try window.open with _blank (some in-app browsers trigger "Open in Safari")
        setTimeout(function() {
          if (redirected) return;
          try { window.open(pageUrl, '_blank'); } catch(e) {}
        }, 800);

        // Trick 3: If still here after 2s, show overlay (tricks didn't work)
        setTimeout(function() {
          if (redirected) return;
          try { document.body.removeChild(hiddenFrame); } catch(e) {}
          showInAppOverlay();
        }, 2000);

        // If page becomes hidden, user was redirected
        document.addEventListener('visibilitychange', function() {
          if (document.hidden) redirected = true;
        });
        return;
      }

      // Other platforms: show overlay immediately
      showInAppOverlay();

      function showInAppOverlay() {
        var dismissed = false;
        try { dismissed = sessionStorage.getItem('tz_inapp_closed') === '1'; } catch(e) {}
        if (dismissed) return;

        var browserName = isIOS ? 'Safari' : 'Chrome';
        var stepsHTML = '';

        if (isIOS) {
          stepsHTML =
            '<li><span class="inapp-overlay__step-num">1</span>Tap the <strong>' + menuIcon + '</strong> menu or <strong>share icon</strong> at the bottom</li>' +
            '<li><span class="inapp-overlay__step-num">2</span>Tap <strong>"Open in ' + browserName + '"</strong> or <strong>"Open in Browser"</strong></li>';
        } else {
          stepsHTML =
            '<li><span class="inapp-overlay__step-num">1</span>Tap the <strong>' + menuIcon + '</strong> menu at the top right</li>' +
            '<li><span class="inapp-overlay__step-num">2</span>Tap <strong>"Open in ' + browserName + '"</strong></li>';
        }

        var overlay = document.createElement('div');
        overlay.className = 'inapp-overlay';
        overlay.innerHTML =
          '<div class="inapp-overlay__card">' +
            '<div class="inapp-overlay__icon">\uD83D\uDD12</div>' +
            '<h2 class="inapp-overlay__title">Open in ' + browserName + ' for Full Experience</h2>' +
            '<p class="inapp-overlay__desc">' + appName + '\'s browser blocks ads that keep this tool free, and limits features like file upload and copy.</p>' +
            '<ul class="inapp-overlay__steps">' + stepsHTML + '</ul>' +
            '<button class="inapp-overlay__btn" id="inapp-copy-btn">\uD83D\uDCCB Copy Link &amp; Open in ' + browserName + '</button>' +
            '<button class="inapp-overlay__skip" id="inapp-skip-btn">Continue anyway (limited experience)</button>' +
            '<p class="inapp-overlay__note">This tool is 100% free — ads help us keep it that way.</p>' +
          '</div>';
        document.body.appendChild(overlay);

        document.getElementById('inapp-copy-btn').addEventListener('click', function() {
          // Copy the URL first
          function doCopy(cb) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(pageUrl).then(cb).catch(function() { fallbackCopy(); cb(); });
            } else {
              fallbackCopy(); cb();
            }
          }

          doCopy(function() {
            if (window.showToast) window.showToast('Link copied! Opening browser...');
            // After copying, try to open in external browser
            if (isIOS) {
              // Try Chrome iOS first, then Safari fallback
              var chromeUrl = pageUrl.replace(/^https:\/\//, 'googlechromes://').replace(/^http:\/\//, 'googlechrome://');
              window.location.href = chromeUrl;
              // If Chrome not installed, try x-web-search (opens Safari)
              setTimeout(function() {
                window.location.href = 'x-safari-' + pageUrl;
              }, 500);
            } else if (isAndroid) {
              window.location.href = 'intent://' + pageUrl.replace(/^https?:\/\//, '') +
                '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' +
                encodeURIComponent(pageUrl) + ';end';
            }
          });
        });

        function fallbackCopy() {
          var ta = document.createElement('textarea');
          ta.value = pageUrl;
          ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }

        document.getElementById('inapp-skip-btn').addEventListener('click', function() {
          overlay.remove();
          try { sessionStorage.setItem('tz_inapp_closed', '1'); } catch(e) {}
        });
      }
    })();
  }

  // Floating CTA bar — always visible at bottom

  var cta = document.createElement('div');
  cta.className = 'floating-cta';
  // Check if user previously closed the CTA
  var ctaDismissed = false;
  try { ctaDismissed = sessionStorage.getItem('tz_cta_closed') === '1'; } catch(e) {}
  if (ctaDismissed || isInAppBrowser) { cta.style.display = 'none'; }

  cta.innerHTML =
    '<button class="floating-cta__close" id="floating-cta-close" aria-label="Close" title="Close">&times;</button>' +
    '<div class="floating-cta__text">' +
      '<strong>Need a custom tool, app, or AI workflow?</strong> ' +
      '<span>Teamz Lab builds web apps, mobile apps, and AI-powered products.</span>' +
    '</div>' +
    '<div class="floating-cta__actions">' +
      '<a href="https://play.google.com/store/apps/dev?id=7194763656319643086" target="_blank" rel="noopener" class="floating-cta__store" aria-label="Google Play" title="Google Play">' +
        '<svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor"><path d="M48 59.49v393a11.27 11.27 0 0 0 7.3 10.65l218.77-218.77L55.3 48.84A11.27 11.27 0 0 0 48 59.49zM345.77 243.9L94.58 24.16l237.63 137.21zm-8.4 24.2L99.08 487.84l236.19-136.36zm38.67-10.92l94.34 54.47a27.39 27.39 0 0 0 0-47.44l-94.34-54.47z"/></svg>' +
      '</a>' +
      '<a href="https://teamzlab.com" target="_blank" rel="noopener" class="floating-cta__btn" id="floating-cta-btn">Hire Us</a>' +
      '<a href="https://apps.apple.com/us/developer/teamz-lab-ltd/id1785282466" target="_blank" rel="noopener" class="floating-cta__store" aria-label="App Store" title="App Store">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>' +
      '</a>' +
    '</div>';
  document.body.appendChild(cta);

  // Close button for floating CTA
  var closeBtn = document.getElementById('floating-cta-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      cta.style.display = 'none';
      try { sessionStorage.setItem('tz_cta_closed', '1'); } catch(e) {}
    });
  }

  // Track floating CTA click
  var ctaBtn = document.getElementById('floating-cta-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function () {
      if (typeof TeamzAnalytics !== 'undefined') {
        TeamzAnalytics.trackClick('floating-cta::' + window.location.pathname);
      }
    });
  }

  TeamzAnalytics.init();

  // ─── SHARE BAR: Web Share API + Social Buttons + Embed Code ───
  (function initShareBar() {
    // Only show on tool pages (not homepage, about, etc.)
    var path = window.location.pathname.replace(/^\/|\/$/g, '');
    if (!path || path.split('/').length < 2) return;
    var calc = document.querySelector('.tool-calculator') || document.querySelector('.tool-hero') || document.querySelector('.tool-content');
    if (!calc) return;

    var pageTitle = document.title.replace(' — Teamz Lab Tools', '').replace(' | Teamz Lab Tools', '');
    var pageUrl = window.location.href;
    var pageDesc = '';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) pageDesc = metaDesc.getAttribute('content') || '';

    // Create share bar container
    var bar = document.createElement('div');
    bar.className = 'teamz-share-bar';
    bar.setAttribute('aria-label', 'Share this tool');

    // Fav button — toggle favorite for this tool
    var _favKey = 'tz_favorites';
    var _toolSlug = window.location.pathname.replace(/^\/|\/$/g, '');
    var _isFaved = false;
    try {
      var _favs = JSON.parse(localStorage.getItem(_favKey) || '[]');
      _isFaved = _favs.some(function(f) { return f.slug === _toolSlug; });
    } catch(e) {}

    var barHTML = '<button class="share-btn share-btn--fav' + (_isFaved ? ' share-btn--faved' : '') + '" title="' + (_isFaved ? 'Remove from Favourites' : 'Add to Favourites') + '" aria-label="Favorite this tool">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (_isFaved ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
      '<span class="share-fav-text"> Favourite</span>' +
    '</button>';

    // WhatsApp
    barHTML += '<a href="https://wa.me/?text=' + encodeURIComponent(pageTitle + ' — ' + pageUrl) + '" target="_blank" rel="noopener" class="share-btn share-btn--wa" title="Share on WhatsApp" aria-label="Share on WhatsApp">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
    '</a>';

    // Twitter/X
    barHTML += '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(pageTitle) + '&url=' + encodeURIComponent(pageUrl) + '" target="_blank" rel="noopener" class="share-btn share-btn--tw" title="Share on X/Twitter" aria-label="Share on X">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
    '</a>';

    // Facebook
    barHTML += '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl) + '" target="_blank" rel="noopener" class="share-btn share-btn--fb" title="Share on Facebook" aria-label="Share on Facebook">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
    '</a>';

    // Copy Link
    barHTML += '<button class="share-btn share-btn--copy" title="Copy link" aria-label="Copy link">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
    '</button>';

    // Web Share API (mobile) — replaces individual buttons on supported devices
    if (navigator.share) {
      barHTML += '<button class="share-btn share-btn--native" title="Share" aria-label="Share this tool">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
        ' Share' +
      '</button>';
    }

    // Add to Home button (only on tool pages, not if already installed as PWA)
    var _isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!_isStandalone) {
      barHTML += '<button class="share-btn share-btn--install" title="Add to Home Screen" aria-label="Add to Home Screen">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
        '<span class="share-install-text"> Add to Home</span>' +
      '</button>';
    }

    bar.innerHTML = barHTML;

    // Insert after the tool calculator
    calc.parentNode.insertBefore(bar, calc.nextSibling);

    // --- Event handlers ---

    // Fav toggle
    var favBtn = bar.querySelector('.share-btn--fav');
    if (favBtn) {
      favBtn.addEventListener('click', function () {
        try {
          var favs = JSON.parse(localStorage.getItem(_favKey) || '[]');
          var idx = -1;
          for (var i = 0; i < favs.length; i++) {
            if (favs[i].slug === _toolSlug) { idx = i; break; }
          }
          if (idx >= 0) {
            // Remove
            favs.splice(idx, 1);
            favBtn.classList.remove('share-btn--faved');
            favBtn.querySelector('svg').setAttribute('fill', 'none');
            favBtn.title = 'Add to Favourites';
            window.showToast('Removed from favourites');
          } else {
            // Add
            favs.unshift({ slug: _toolSlug, title: pageTitle.replace(' — Teamz Lab Tools', ''), url: pageUrl, added: Date.now() });
            favBtn.classList.add('share-btn--faved');
            favBtn.querySelector('svg').setAttribute('fill', 'currentColor');
            favBtn.title = 'Remove from Favourites';
            window.showToast('Added to favourites!');
          }
          localStorage.setItem(_favKey, JSON.stringify(favs));
          // Update header badge count
          window._updateFavBadge();
        } catch (e) {
          window.showToast('Could not save favourite.');
        }
      });
    }

    // Copy link
    var copyBtn = bar.querySelector('.share-btn--copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(pageUrl).then(function () {
          copyBtn.classList.add('share-btn--copied');
          copyBtn.title = 'Copied!';
          window.showToast('Link copied to clipboard!');
          setTimeout(function () {
            copyBtn.classList.remove('share-btn--copied');
            copyBtn.title = 'Copy link';
          }, 2000);
        }).catch(function() {
          window.showToast('Copy failed — try manually.');
        });
      });
    }

    // Web Share API
    var nativeBtn = bar.querySelector('.share-btn--native');
    if (nativeBtn) {
      nativeBtn.addEventListener('click', function () {
        navigator.share({
          title: pageTitle,
          text: pageDesc.substring(0, 100),
          url: pageUrl
        }).catch(function () {});
      });
    }

    // Add to Home button — uses deferred prompt or shows instructions
    var _shareDeferredPrompt = null;
    var _shareIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      _shareDeferredPrompt = e;
    });

    var installBtn = bar.querySelector('.share-btn--install');
    if (installBtn) {
      installBtn.addEventListener('click', function () {
        if (_shareDeferredPrompt) {
          _shareDeferredPrompt.prompt();
          _shareDeferredPrompt.userChoice.then(function (choiceResult) {
            if (choiceResult.outcome === 'accepted' && typeof TeamzAnalytics !== 'undefined') {
              TeamzAnalytics.trackClick('pwa-install::accepted');
            }
            _shareDeferredPrompt = null;
          });
        } else if (_shareIsIOS) {
          _showInstallInstructions('ios');
        } else {
          _showInstallInstructions('generic');
        }
      });
    }

    function _showInstallInstructions(type) {
      var steps = '';
      if (type === 'ios') {
        steps =
          '<h3>Install on iPhone / iPad</h3>' +
          '<div class="pwa-ios-steps">' +
            '<div class="pwa-ios-step"><div class="pwa-ios-step__num">1</div><div class="pwa-ios-step__text">Tap the <strong>Share</strong> button <span style="font-size:1.2em">&#x2191;</span> at the bottom of Safari</div></div>' +
            '<div class="pwa-ios-step"><div class="pwa-ios-step__num">2</div><div class="pwa-ios-step__text">Scroll down and tap <strong>"Add to Home Screen"</strong></div></div>' +
            '<div class="pwa-ios-step"><div class="pwa-ios-step__num">3</div><div class="pwa-ios-step__text">Tap <strong>"Add"</strong> — the app icon will appear on your home screen</div></div>' +
          '</div>';
      } else {
        var isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
        var isChromeLike = navigator.userAgent.indexOf('Chrome') > -1;
        var isSafari = navigator.userAgent.indexOf('Safari') > -1 && !isChromeLike;
        if (isChromeLike) {
          steps =
            '<h3>Add to Home Screen</h3>' +
            '<div class="pwa-ios-steps">' +
              '<div class="pwa-ios-step"><div class="pwa-ios-step__num">1</div><div class="pwa-ios-step__text">Click the <strong>install icon</strong> in the address bar (or <strong>menu &#x22EE; &rarr; Install app</strong>)</div></div>' +
              '<div class="pwa-ios-step"><div class="pwa-ios-step__num">2</div><div class="pwa-ios-step__text">Click <strong>"Install"</strong> — the app will appear on your desktop or home screen</div></div>' +
            '</div>';
        } else if (isSafari) {
          steps =
            '<h3>Add to Dock</h3>' +
            '<div class="pwa-ios-steps">' +
              '<div class="pwa-ios-step"><div class="pwa-ios-step__num">1</div><div class="pwa-ios-step__text">Click <strong>File &rarr; Add to Dock</strong> in the menu bar</div></div>' +
              '<div class="pwa-ios-step"><div class="pwa-ios-step__num">2</div><div class="pwa-ios-step__text">The app will appear in your Dock for quick access</div></div>' +
            '</div>';
        } else {
          steps =
            '<h3>Add to Home Screen</h3>' +
            '<div class="pwa-ios-steps">' +
              '<div class="pwa-ios-step"><div class="pwa-ios-step__num">1</div><div class="pwa-ios-step__text">Open <strong>browser menu</strong> and look for <strong>"Install"</strong> or <strong>"Add to Home Screen"</strong></div></div>' +
              '<div class="pwa-ios-step"><div class="pwa-ios-step__num">2</div><div class="pwa-ios-step__text">The app launches like a native app — works offline</div></div>' +
            '</div>';
        }
      }
      var overlay = document.createElement('div');
      overlay.className = 'pwa-ios-modal';
      overlay.innerHTML =
        '<div class="pwa-ios-modal__content">' +
          '<button class="pwa-ios-modal__close" aria-label="Close">&times;</button>' +
          steps +
          '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:1rem;">Works offline — your data stays on your device.</p>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.classList.contains('pwa-ios-modal__close')) overlay.remove();
      });
      overlay.querySelector('.pwa-ios-modal__close').addEventListener('click', function () { overlay.remove(); });
    }

    // Track share clicks
    bar.querySelectorAll('.share-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (typeof TeamzAnalytics !== 'undefined') {
          var type = btn.className.match(/share-btn--(\w+)/);
          TeamzAnalytics.trackClick('share-' + (type ? type[1] : 'unknown') + '::' + path);
        }
      });
    });
  })();

  // AdSense: Load ad integration script
  (function loadAdSense() {
    var s = document.createElement('script');
    s.src = '/shared/js/adsense.js?v=202603201719';
    s.async = true;
    document.body.appendChild(s);
  })();

  // PWA: Inject manifest, favicon, and apple-touch-icon into every page
  (function injectPWA() {
    var head = document.head;
    if (!head.querySelector('link[rel="manifest"]')) {
      var manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = '/manifest.json';
      head.appendChild(manifest);
    }
    if (!head.querySelector('meta[name="theme-color"]')) {
      var theme = document.createElement('meta');
      theme.name = 'theme-color';
      theme.content = '#6c63ff';
      head.appendChild(theme);
    }
    if (!head.querySelector('link[rel="icon"]')) {
      var icon32 = document.createElement('link');
      icon32.rel = 'icon';
      icon32.type = 'image/png';
      icon32.sizes = '32x32';
      icon32.href = '/icons/icon-32x32.png';
      head.appendChild(icon32);
      var icon16 = document.createElement('link');
      icon16.rel = 'icon';
      icon16.type = 'image/png';
      icon16.sizes = '16x16';
      icon16.href = '/icons/icon-16x16.png';
      head.appendChild(icon16);
    }
    if (!head.querySelector('link[rel="apple-touch-icon"]')) {
      var apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.sizes = '180x180';
      apple.href = '/apple-touch-icon.png';
      head.appendChild(apple);
    }
    // PWA meta tags (mobile-web-app-capable is the standard; apple- is legacy iOS)
    if (!head.querySelector('meta[name="mobile-web-app-capable"]')) {
      var mw = document.createElement('meta');
      mw.name = 'mobile-web-app-capable';
      mw.content = 'yes';
      head.appendChild(mw);
    }
    if (!head.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      var m1 = document.createElement('meta');
      m1.name = 'apple-mobile-web-app-capable';
      m1.content = 'yes';
      head.appendChild(m1);
      var m2 = document.createElement('meta');
      m2.name = 'apple-mobile-web-app-status-bar-style';
      m2.content = 'black-translucent';
      head.appendChild(m2);
      var m3 = document.createElement('meta');
      m3.name = 'apple-mobile-web-app-title';
      m3.content = 'Teamz Tools';
      head.appendChild(m3);
    }
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(function (reg) {
        // Tell SW to cache the current page for offline use
        if (reg.active) {
          reg.active.postMessage({ type: 'CACHE_PAGE', url: window.location.href });
        }
      }).catch(function () {});
    }
  })();

  // ─── INSTALL AS APP BUTTON (legacy banner — replaced by share bar install button) ───
  // Kept as fallback for edge cases where share bar doesn't render
  (function initInstallButton() {
    // Only show on tool pages (path must have at least 2 segments like /hub/tool/)
    var path = window.location.pathname.replace(/^\/|\/$/g, '');
    if (!path || path.split('/').length < 2) return;
    // Find any main tool container — calculator, generator, hero, or content section
    var calc = document.querySelector('.tool-calculator') || document.querySelector('.tool-hero') || document.querySelector('.tool-content');
    if (!calc) return;

    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Don't show if already installed
    if (isStandalone) return;

    var deferredPrompt = null;

    // Listen for Chrome/Edge install prompt
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      // Update button text if banner already rendered
      var btn = document.getElementById('pwa-install-btn');
      if (btn) btn.textContent = 'Install App';
    });

    // Always show the install banner on all tools
    showInstallButton();

    function showInstallButton() {
      var btn = document.createElement('div');
      btn.className = 'pwa-install-banner';
      btn.innerHTML =
        '<div class="pwa-install-banner__icon">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
        '</div>' +
        '<div class="pwa-install-banner__text">' +
          '<strong>Use this tool offline</strong>' +
          '<span>Install as an app — no download needed, works without internet</span>' +
        '</div>' +
        '<button class="pwa-install-banner__btn" id="pwa-install-btn">' +
          (isIOS ? 'How to Install' : 'Add to Home') +
        '</button>' +
        '<button class="pwa-install-banner__close" id="pwa-install-close" aria-label="Close">&times;</button>';

      // Insert after the first ad-slot, or after the tool container
      var adSlot = document.querySelector('.ad-slot');
      if (adSlot && adSlot.nextElementSibling) {
        adSlot.parentNode.insertBefore(btn, adSlot.nextElementSibling);
      } else if (calc.nextElementSibling) {
        calc.parentNode.insertBefore(btn, calc.nextElementSibling);
      } else {
        calc.parentNode.appendChild(btn);
      }

      // Check if user dismissed before
      try {
        if (localStorage.getItem('tz_pwa_dismissed')) {
          btn.style.display = 'none';
          return;
        }
      } catch (e) {}

      // Install button click
      var installBtn = document.getElementById('pwa-install-btn');
      if (installBtn) {
        installBtn.addEventListener('click', function () {
          if (deferredPrompt) {
            // Chrome/Edge — native install prompt
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function (choiceResult) {
              if (choiceResult.outcome === 'accepted') {
                btn.style.display = 'none';
                if (typeof TeamzAnalytics !== 'undefined') {
                  TeamzAnalytics.trackClick('pwa-install::accepted');
                }
              }
              deferredPrompt = null;
            });
          } else if (isIOS) {
            showIOSInstructions();
          } else {
            showGenericInstructions();
          }
        });
      }

      // Close button
      var closeBtn = document.getElementById('pwa-install-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          btn.style.display = 'none';
          try { localStorage.setItem('tz_pwa_dismissed', '1'); } catch (e) {}
        });
      }
    }

    function showIOSInstructions() {
      var overlay = document.createElement('div');
      overlay.className = 'pwa-ios-modal';
      overlay.innerHTML =
        '<div class="pwa-ios-modal__content">' +
          '<button class="pwa-ios-modal__close" aria-label="Close">&times;</button>' +
          '<h3>Install on iPhone / iPad</h3>' +
          '<div class="pwa-ios-steps">' +
            '<div class="pwa-ios-step">' +
              '<div class="pwa-ios-step__num">1</div>' +
              '<div class="pwa-ios-step__text">Tap the <strong>Share</strong> button <span style="font-size:1.2em">&#x2191;</span> at the bottom of Safari</div>' +
            '</div>' +
            '<div class="pwa-ios-step">' +
              '<div class="pwa-ios-step__num">2</div>' +
              '<div class="pwa-ios-step__text">Scroll down and tap <strong>"Add to Home Screen"</strong></div>' +
            '</div>' +
            '<div class="pwa-ios-step">' +
              '<div class="pwa-ios-step__num">3</div>' +
              '<div class="pwa-ios-step__text">Tap <strong>"Add"</strong> — the app icon will appear on your home screen</div>' +
            '</div>' +
          '</div>' +
          '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:1rem;">The app works offline and your data stays on your device.</p>' +
        '</div>';
      document.body.appendChild(overlay);

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.classList.contains('pwa-ios-modal__close')) {
          overlay.remove();
        }
      });
      overlay.querySelector('.pwa-ios-modal__close').addEventListener('click', function () {
        overlay.remove();
      });
    }

    function showGenericInstructions() {
      var isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
      var isChrome = navigator.userAgent.indexOf('Chrome') > -1 && navigator.userAgent.indexOf('Edg') === -1;
      var isEdge = navigator.userAgent.indexOf('Edg') > -1;
      var isSafari = navigator.userAgent.indexOf('Safari') > -1 && !isChrome && !isEdge;

      var steps = '';
      if (isChrome || isEdge) {
        steps =
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">1</div><div class="pwa-ios-step__text">Click the <strong>install icon</strong> in the address bar (or the <strong>three-dot menu &#x22EE;</strong>)</div></div>' +
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">2</div><div class="pwa-ios-step__text">Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></div></div>' +
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">3</div><div class="pwa-ios-step__text">Click <strong>"Install"</strong> — the app will appear on your desktop or home screen</div></div>';
      } else if (isFirefox) {
        steps =
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">1</div><div class="pwa-ios-step__text">Open this page in <strong>Chrome</strong> or <strong>Edge</strong> for the best install experience</div></div>' +
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">2</div><div class="pwa-ios-step__text">Or <strong>bookmark</strong> this page for quick access</div></div>' +
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">3</div><div class="pwa-ios-step__text">On Android Firefox, tap <strong>menu &#x22EE; → Install</strong></div></div>';
      } else if (isSafari) {
        steps =
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">1</div><div class="pwa-ios-step__text">Click <strong>File</strong> in the menu bar</div></div>' +
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">2</div><div class="pwa-ios-step__text">Select <strong>"Add to Dock"</strong></div></div>' +
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">3</div><div class="pwa-ios-step__text">The app will appear in your Dock for quick access</div></div>';
      } else {
        steps =
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">1</div><div class="pwa-ios-step__text">Open the <strong>browser menu</strong></div></div>' +
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">2</div><div class="pwa-ios-step__text">Look for <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></div></div>' +
          '<div class="pwa-ios-step"><div class="pwa-ios-step__num">3</div><div class="pwa-ios-step__text">The app will launch like a native app — works offline too</div></div>';
      }

      var overlay = document.createElement('div');
      overlay.className = 'pwa-ios-modal';
      overlay.innerHTML =
        '<div class="pwa-ios-modal__content">' +
          '<button class="pwa-ios-modal__close" aria-label="Close">&times;</button>' +
          '<h3>Add to Home Screen</h3>' +
          '<div class="pwa-ios-steps">' + steps + '</div>' +
          '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:1rem;">The app works offline and your data stays on your device.</p>' +
        '</div>';
      document.body.appendChild(overlay);

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.classList.contains('pwa-ios-modal__close')) {
          overlay.remove();
        }
      });
      overlay.querySelector('.pwa-ios-modal__close').addEventListener('click', function () {
        overlay.remove();
      });
    }
  })();

  // ─── COPY IMAGE BUTTON — auto-inject on any page with canvas download ───
  (function initCopyImageButtons() {
    // Find all download buttons that download canvas images
    // Convention: any button with id containing 'download' or 'Download' near a canvas
    var canvases = document.querySelectorAll('canvas');
    if (!canvases.length) return;
    if (!navigator.clipboard || !navigator.clipboard.write) return;

    // Also expose a global helper that tool scripts can call
    window.TeamzCopyImage = function(canvasEl, toastFn) {
      if (!canvasEl) return;
      canvasEl.toBlob(function(blob) {
        if (!blob) { if (toastFn) toastFn('Copy failed'); return; }
        try {
          var item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(function() {
            if (toastFn) toastFn('Image copied to clipboard!');
          }).catch(function() {
            if (toastFn) toastFn('Copy not supported — please download instead');
          });
        } catch(e) {
          if (toastFn) toastFn('Copy not supported — please download instead');
        }
      }, 'image/png');
    };

    // Auto-inject: find .card-actions or button groups with download buttons
    // and add a Copy Image button if one doesn't already exist
    var downloadBtns = document.querySelectorAll('[id*="ownload"], [id*="btnDownload"], [id*="downloadPreview"]');
    downloadBtns.forEach(function(dlBtn) {
      // Skip if a copy button already exists nearby
      var parent = dlBtn.parentElement;
      if (!parent) return;
      if (parent.querySelector('[id*="opyImg"], [id*="opy"], [id*="btnCopy"]')) return;
      if (parent.querySelector('[id*="copyImg"], [id*="CopyImg"]')) return;

      // Find the nearest canvas
      var canvas = document.querySelector('canvas');
      if (!canvas) return;

      // Create copy button matching the style of nearby secondary buttons
      var copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy Image';
      copyBtn.id = 'teamz-copy-img-' + Math.random().toString(36).substr(2, 5);

      // Match the class of the download button or sibling secondary button
      var sibling = parent.querySelector('.btn-secondary, .tool-btn--secondary');
      if (sibling) {
        copyBtn.className = sibling.className;
      } else {
        copyBtn.className = dlBtn.className;
      }

      // Insert after download button
      if (dlBtn.nextSibling) {
        parent.insertBefore(copyBtn, dlBtn.nextSibling);
      } else {
        parent.appendChild(copyBtn);
      }

      copyBtn.addEventListener('click', function() {
        var toastFn = window.showToast || function(msg) {
          var t = document.getElementById('toast');
          if (t) {
            t.textContent = msg;
            t.classList.add('show');
            setTimeout(function() { t.classList.remove('show'); }, 2200);
          } else {
            alert(msg);
          }
        };
        window.TeamzCopyImage(canvas, toastFn);
      });
    });
  })();

  // ===================================================================
  // AUTO-SAVE: Automatically save & restore all form inputs per tool page
  // Works on ALL tool pages — no per-tool code needed.
  // Saves: input[type=text/number/date/email/tel/url], textarea, select
  // Storage key: 'tz_autosave_' + page path
  // Clears on: explicit "Clear" button click (if tool has one)
  // ===================================================================
  (function initAutoSave() {
    // Only run on tool pages (not homepage, hub pages, about, etc.)
    var path = window.location.pathname;
    var segments = path.replace(/^\/|\/$/g, '').split('/');
    if (segments.length < 2) return; // Hub or homepage — skip

    // Don't auto-save if page was opened via share link (has query params)
    if (window.location.search && window.location.search.length > 5) return;

    var STORAGE_KEY = 'tz_autosave_' + path;
    var debounceTimer = null;

    function getFormData() {
      var data = {};
      var inputs = document.querySelectorAll('.tool-calculator input, .tool-calculator textarea, .tool-calculator select, .site-main input, .site-main textarea, .site-main select');
      inputs.forEach(function(el) {
        var key = el.id || el.name;
        if (!key) return;
        if (el.type === 'file') return; // Never save file inputs
        if (el.type === 'checkbox') { data[key] = el.checked; return; }
        if (el.type === 'radio') { if (el.checked) data[key] = el.value; return; }
        if (el.value && el.value.trim()) data[key] = el.value;
      });
      return Object.keys(data).length > 0 ? data : null;
    }

    function restoreFormData() {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        var data = JSON.parse(saved);
        if (!data || typeof data !== 'object') return;

        var restored = 0;
        Object.keys(data).forEach(function(key) {
          var el = document.getElementById(key) || document.querySelector('[name="' + key + '"]');
          if (!el) return;
          if (el.type === 'checkbox') { el.checked = !!data[key]; }
          else if (el.type === 'radio') { if (el.value === data[key]) el.checked = true; }
          else { el.value = data[key]; }
          restored++;
          // Trigger input event so tool JS picks up the restored values
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });

        if (restored > 0) {
          console.log('[AutoSave] Restored ' + restored + ' fields for ' + path);
        }
      } catch (e) {
        // Silently fail — don't break the tool
      }
    }

    function saveFormData() {
      try {
        var data = getFormData();
        if (data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch (e) {
        // Storage full or unavailable — silently fail
      }
    }

    var dirty = false; // Track if user changed anything since last save

    function debouncedSave() {
      dirty = true;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() { saveFormData(); dirty = false; }, 500);
    }

    function flushSave() {
      if (dirty) {
        clearTimeout(debounceTimer);
        saveFormData();
        dirty = false;
      }
    }

    // Flush pending save when user leaves the page or switches tabs/apps
    window.addEventListener('beforeunload', flushSave);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') flushSave();
    });

    // Restore saved data after a short delay (let tool JS initialize first)
    setTimeout(restoreFormData, 300);

    // Listen for changes on all form elements (tool-calculator or site-main as fallback)
    var formContainer = document.querySelector('.tool-calculator') || document.querySelector('.site-main');
    if (formContainer) {
      formContainer.addEventListener('input', debouncedSave);
      formContainer.addEventListener('change', debouncedSave);
    }

    // Clear saved data AND reset all form inputs when user clicks any "Clear" or "Reset" button
    document.querySelectorAll('.tool-clear-btn, [id*="clear"], [id*="reset"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        dirty = false;
        clearTimeout(debounceTimer);
        try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}

        // Central form reset — clears ALL inputs so per-tool code doesn't need to
        var container = document.querySelector('.tool-calculator') || document.querySelector('.site-main');
        if (!container) return;
        container.querySelectorAll('input, textarea, select').forEach(function(el) {
          if (el.type === 'file') return;
          if (el.type === 'checkbox' || el.type === 'radio') { el.checked = false; return; }
          if (el.tagName === 'SELECT') { el.selectedIndex = 0; return; }
          if (el.type === 'range') { el.value = el.defaultValue || el.min || 0; return; }
          el.value = '';
        });
      });
    });
  })();
});
