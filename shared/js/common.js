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
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' +
        '<span>' + SITE_NAME + '</span>' +
      '</a>' +
      '<nav class="header-nav" aria-label="Main navigation">' +
        '<a href="/" class="nav-link">Home</a>' +
        '<a href="/about/" class="nav-link">About</a>' +
        '<a href="/contact/" class="nav-link">Contact</a>' +
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
          '<div class="build-cta__icon">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' +
          '</div>' +
          '<div class="build-cta__text">' +
            '<strong>Need a custom tool, app, or AI workflow?</strong>' +
            '<span>Teamz Lab builds web apps, mobile apps, AI integrations, and MVPs for startups and businesses.</span>' +
          '</div>' +
          '<a href="' + TEAMZ_URL + '" target="_blank" rel="noopener" class="build-cta__btn btn-pill">Get in Touch</a>' +
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
      "inLanguage": "en"
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
      var script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    } catch (e) {
      console.warn('TeamzTools: schema injection failed', e);
    }
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
    SITE_NAME: SITE_NAME,
    SITE_URL: SITE_URL
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
    measurementId: "G-TDGVH91VS8"
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

// Auto-render header, footer, and init analytics
document.addEventListener('DOMContentLoaded', function () {
  TeamzTools.renderHeader();
  TeamzTools.renderFooter();
  TeamzAnalytics.init();
});
