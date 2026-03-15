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
          '<a href="/notice-period-calculator/">Notice Period Calculator</a>' +
          '<a href="/notice-period-buyout-calculator/">Buyout Calculator</a>' +
          '<a href="/last-working-day-calculator/">Last Working Day</a>' +
          '<a href="/leave-encashment-calculator/">Leave Encashment</a>' +
          '<a href="/probation-period-calculator/">Probation Period</a>' +
          '<a href="/salary-per-day-calculator/">Salary Per Day</a>' +
          '<a href="/salary-per-hour-calculator/">Salary Per Hour</a>' +
          '<a href="/gratuity-calculator/">Gratuity Calculator</a>' +
          '<a href="/overtime-pay-calculator/">Overtime Pay</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>Invoice &amp; Freelance</h4>' +
          '<a href="/invoice-due-date-calculator/">Invoice Due Date</a>' +
          '<a href="/net-30-calculator/">Net 30 Calculator</a>' +
          '<a href="/late-fee-calculator/">Late Fee Calculator</a>' +
          '<a href="/freelance-rate-calculator/">Freelance Rate</a>' +
          '<a href="/project-pricing-calculator/">Project Pricing</a>' +
          '<a href="/retainer-calculator/">Retainer Calculator</a>' +
          '<a href="/day-rate-calculator/">Day Rate Calculator</a>' +
          '<a href="/profit-margin-calculator/">Profit Margin</a>' +
          '<a href="/utilization-rate-calculator/">Utilization Rate</a>' +
          '<a href="/early-payment-discount-calculator/">Early Payment Discount</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>More Tools</h4>' +
          '<a href="/business-day-calculator/">Business Day Calculator</a>' +
          '<a href="/holiday-pay-calculator/">Holiday Pay</a>' +
          '<a href="/attendance-percentage-calculator/">Attendance Calculator</a>' +
          '<a href="/ugc-rate-calculator/">UGC Rate Calculator</a>' +
          '<a href="/cpm-calculator/">CPM Calculator</a>' +
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

// Auto-render header and footer
document.addEventListener('DOMContentLoaded', function () {
  TeamzTools.renderHeader();
  TeamzTools.renderFooter();
});
