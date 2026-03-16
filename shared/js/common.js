/**
 * Teamz Lab Tools — Common utilities
 * Header, footer, theme, FAQ schema, breadcrumbs
 */

var TeamzTools = (function () {
  var SITE_NAME = 'Teamz Lab Tools';
  var SITE_URL = 'https://tool.teamzlab.com';
  var TEAMZ_URL = 'https://teamzlab.com';

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
        '<a href="/about/" class="nav-link">About</a>' +
        '<a href="/contact/" class="nav-link">Contact</a>' +
        '<div class="lang-selector notranslate" translate="no">' +
          '<button class="lang-btn notranslate" id="lang-toggle" type="button" aria-label="Change language" title="Change language" translate="no">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
            ' <span id="current-lang" class="notranslate" translate="no">EN</span>' +
          '</button>' +
          '<div class="lang-dropdown notranslate" id="lang-dropdown" translate="no"></div>' +
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
  }

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
          '<a href="/about/">About</a>' +
          '<a href="/contact/">Contact</a>' +
          '<a href="/privacy/">Privacy Policy</a>' +
          '<a href="/terms/">Terms of Service</a>' +
          '<a href="' + TEAMZ_URL + '" target="_blank" rel="noopener">Teamz Lab</a>' +
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
    var anchor = document.getElementById('tool-faqs') || document.getElementById('related-tools');
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
    anchor.parentNode.insertBefore(wrapper, anchor);

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
    SITE_NAME: SITE_NAME,
    SITE_URL: SITE_URL
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

  function init() {
    if (!_isDevMode) {
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
        try {
          var app = firebase.initializeApp(FIREBASE_CONFIG);
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
      };
      document.head.appendChild(fbAnalytics);
    };
    document.head.appendChild(fbApp);

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

// Auto-render header, footer, floating CTA, and init analytics
document.addEventListener('DOMContentLoaded', function () {
  TeamzTools.renderHeader();
  TeamzTools.renderFooter();
  TeamzTools.renderRating();
  TeamzTranslate.init();

  // Floating CTA bar — always visible at bottom
  var cta = document.createElement('div');
  cta.className = 'floating-cta';
  cta.innerHTML =
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
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    }
  })();
});
