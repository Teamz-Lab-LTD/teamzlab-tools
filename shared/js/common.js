/**
 * Teamz Lab Tools — Common utilities
 * Header, footer, theme, FAQ schema, breadcrumbs
 */

const TeamzTools = (() => {
  const SITE_NAME = 'Teamz Lab Tools';
  const SITE_URL = 'https://tool.teamzlab.com';
  const TEAMZ_URL = 'https://teamzlab.com';

  function renderHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    header.innerHTML = `
      <a href="/" class="header-logo teamz-logo" aria-label="Teamz Lab Tools Home">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <span>${SITE_NAME}</span>
      </a>
      <nav class="header-nav" aria-label="Main navigation">
        <a href="/" class="nav-link">Home</a>
        <a href="/about/" class="nav-link">About</a>
        <a href="/contact/" class="nav-link">Contact</a>
        <button id="theme-toggle" class="header-icon-btn nav-link--icon" aria-label="Toggle theme" title="Toggle dark/light mode">
          <svg id="theme-icon-dark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg id="theme-icon-light" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
      </nav>
    `;

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      if (typeof TeamzTheme !== 'undefined') {
        const newTheme = TeamzTheme.toggle();
        _updateThemeIcon(newTheme);
      }
    });

    _updateThemeIcon(typeof TeamzTheme !== 'undefined' ? TeamzTheme.get() : 'dark');
  }

  function _updateThemeIcon(theme) {
    const dark = document.getElementById('theme-icon-dark');
    const light = document.getElementById('theme-icon-light');
    if (dark && light) {
      dark.style.display = theme === 'dark' ? 'block' : 'none';
      light.style.display = theme === 'light' ? 'block' : 'none';
    }
  }

  function renderFooter() {
    const footer = document.getElementById('site-footer');
    if (!footer) return;

    const year = new Date().getFullYear();
    footer.innerHTML = `
      <div class="footer-cta">
        <div class="build-cta">
          <div class="build-cta__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div class="build-cta__text">
            <strong>Need a custom tool, app, or AI workflow?</strong>
            <span>Teamz Lab builds web apps, mobile apps, AI integrations, and MVPs for startups and businesses.</span>
          </div>
          <a href="${TEAMZ_URL}" target="_blank" rel="noopener" class="build-cta__btn btn-pill">Get in Touch</a>
        </div>
      </div>
      <div class="footer-links">
        <div class="footer-col">
          <h4>Tools</h4>
          <a href="/notice-period-calculator/">Notice Period Calculator</a>
          <a href="/leave-encashment-calculator/">Leave Encashment Calculator</a>
          <a href="/salary-per-day-calculator/">Salary Per Day Calculator</a>
          <a href="/invoice-due-date-calculator/">Invoice Due Date Calculator</a>
          <a href="/freelance-rate-calculator/">Freelance Rate Calculator</a>
          <a href="/late-fee-calculator/">Late Fee Calculator</a>
        </div>
        <div class="footer-col">
          <h4>More Tools</h4>
          <a href="/notice-period-buyout-calculator/">Buyout Calculator</a>
          <a href="/last-working-day-calculator/">Last Working Day</a>
          <a href="/probation-period-calculator/">Probation Calculator</a>
          <a href="/net-30-calculator/">Net 30 Calculator</a>
          <a href="/project-pricing-calculator/">Project Pricing</a>
          <a href="/retainer-calculator/">Retainer Calculator</a>
          <a href="/gratuity-calculator/">Gratuity Calculator</a>
          <a href="/overtime-pay-calculator/">Overtime Pay</a>
          <a href="/profit-margin-calculator/">Profit Margin</a>
          <a href="/utilization-rate-calculator/">Utilization Rate</a>
          <a href="/day-rate-calculator/">Day Rate Calculator</a>
          <a href="/salary-per-hour-calculator/">Salary Per Hour</a>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <a href="/about/">About</a>
          <a href="/contact/">Contact</a>
          <a href="/privacy/">Privacy Policy</a>
          <a href="/terms/">Terms of Service</a>
          <a href="${TEAMZ_URL}" target="_blank" rel="noopener">Teamz Lab</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${year} ${SITE_NAME}. A project by <a href="${TEAMZ_URL}" target="_blank" rel="noopener" class="teamz-logo">Teamz Lab</a>.</p>
      </div>
    `;
  }

  function renderBreadcrumbs(items) {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;

    let html = '<nav aria-label="Breadcrumb"><ol class="breadcrumb-list">';
    items.forEach((item, i) => {
      const isLast = i === items.length - 1;
      if (isLast) {
        html += `<li class="breadcrumb-item active" aria-current="page">${item.name}</li>`;
      } else {
        html += `<li class="breadcrumb-item"><a href="${item.url}">${item.name}</a></li>`;
      }
    });
    html += '</ol></nav>';
    container.innerHTML = html;
  }

  function injectBreadcrumbSchema(items) {
    const schemaItems = items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url ? SITE_URL + item.url : undefined
    }));

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": schemaItems
    };

    _injectSchema(schema);
  }

  function injectFAQSchema(faqs) {
    if (!faqs || !faqs.length) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    };

    _injectSchema(schema);
  }

  function injectWebAppSchema(config) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": config.title,
      "description": config.description,
      "url": SITE_URL + '/' + config.slug + '/',
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "author": {
        "@type": "Organization",
        "name": "Teamz Lab",
        "url": TEAMZ_URL
      }
    };

    _injectSchema(schema);
  }

  function injectOrganizationSchema() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Teamz Lab",
      "url": TEAMZ_URL,
      "logo": TEAMZ_URL + "/logo.png",
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "hello@teamzlab.com",
        "contactType": "customer service"
      }
    };
    _injectSchema(schema);
  }

  function injectWebSiteSchema() {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL,
      "publisher": {
        "@type": "Organization",
        "name": "Teamz Lab",
        "url": TEAMZ_URL
      }
    };
    _injectSchema(schema);
  }

  function _injectSchema(schema) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function renderRelatedTools(tools) {
    const container = document.getElementById('related-tools');
    if (!container || !tools?.length) return;

    let html = '<h2 class="section-title">Related Tools</h2>';
    html += '<div class="related-tools-grid">';
    tools.forEach(tool => {
      html += `
        <a href="/${tool.slug}/" class="card related-tool-card">
          <h3>${tool.name}</h3>
          <p>${tool.description}</p>
        </a>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderFAQs(faqs) {
    const container = document.getElementById('tool-faqs');
    if (!container || !faqs?.length) return;

    let html = '<h2 class="section-title">Frequently Asked Questions</h2>';
    faqs.forEach(faq => {
      html += `
        <details class="faq-item">
          <summary class="faq-question">${faq.q}</summary>
          <div class="faq-answer"><p>${faq.a}</p></div>
        </details>
      `;
    });
    container.innerHTML = html;
  }

  return {
    renderHeader,
    renderFooter,
    renderBreadcrumbs,
    injectBreadcrumbSchema,
    injectFAQSchema,
    injectWebAppSchema,
    injectOrganizationSchema,
    injectWebSiteSchema,
    renderRelatedTools,
    renderFAQs,
    SITE_NAME,
    SITE_URL
  };
})();

// Auto-render header and footer
document.addEventListener('DOMContentLoaded', () => {
  TeamzTools.renderHeader();
  TeamzTools.renderFooter();
});
