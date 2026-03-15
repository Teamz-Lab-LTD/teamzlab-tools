/**
 * Teamz Lab Tools — Reusable Calculator Engine
 * Config-driven tool system for static calculator pages.
 */

const ToolEngine = (() => {
  let _config = null;
  let _history = [];
  const STORAGE_PREFIX = 'teamztools_';

  function init(config) {
    _config = config;
    _history = _loadHistory();
    _renderCalculator();
    _bindEvents();
    _restoreLastInputs();
  }

  // --- Storage ---
  function _storageKey() {
    return STORAGE_PREFIX + _config.slug;
  }

  function _loadHistory() {
    try {
      const raw = localStorage.getItem(_storageKey() + '_history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function _saveHistory(entry) {
    _history.unshift(entry);
    if (_history.length > 10) _history = _history.slice(0, 10);
    try {
      localStorage.setItem(_storageKey() + '_history', JSON.stringify(_history));
    } catch {}
  }

  function _saveLastInputs(values) {
    try {
      localStorage.setItem(_storageKey() + '_last', JSON.stringify(values));
    } catch {}
  }

  function _restoreLastInputs() {
    try {
      const raw = localStorage.getItem(_storageKey() + '_last');
      if (!raw) return;
      const values = JSON.parse(raw);
      _config.inputs.forEach(input => {
        const el = document.getElementById('input-' + input.id);
        if (el && values[input.id] !== undefined) {
          el.value = values[input.id];
        }
      });
    } catch {}
  }

  // --- Rendering ---
  function _renderCalculator() {
    const container = document.getElementById('tool-calculator');
    if (!container) return;

    let html = '<div class="tool-inputs">';
    _config.inputs.forEach(input => {
      html += _renderInput(input);
    });
    html += '</div>';

    html += '<div class="tool-actions">';
    html += `<button type="button" id="tool-calculate" class="btn-pill tool-calculate-btn">Calculate</button>`;
    html += `<button type="button" id="tool-clear" class="btn-pill-ghost tool-clear-btn">Clear</button>`;
    html += '</div>';

    html += '<div id="tool-result" class="tool-result" style="display:none;"></div>';

    container.innerHTML = html;
  }

  function _renderInput(input) {
    const id = 'input-' + input.id;
    let html = `<div class="tool-field">`;
    html += `<label for="${id}" class="tool-label">${input.label}`;
    if (input.hint) html += ` <span class="tool-hint">${input.hint}</span>`;
    html += `</label>`;

    if (input.type === 'select') {
      html += `<select id="${id}" class="tool-select">`;
      (input.options || []).forEach(opt => {
        const selected = opt.value === input.default ? ' selected' : '';
        html += `<option value="${opt.value}"${selected}>${opt.label}</option>`;
      });
      html += `</select>`;
    } else if (input.type === 'checkbox') {
      html += `<label class="tool-checkbox-label">`;
      html += `<input type="checkbox" id="${id}" class="tool-checkbox"${input.default ? ' checked' : ''}>`;
      html += ` ${input.checkboxLabel || ''}`;
      html += `</label>`;
    } else {
      const type = input.type || 'text';
      const placeholder = input.placeholder || '';
      const step = input.step ? ` step="${input.step}"` : '';
      const min = input.min !== undefined ? ` min="${input.min}"` : '';
      const max = input.max !== undefined ? ` max="${input.max}"` : '';
      const defaultVal = input.default !== undefined ? ` value="${input.default}"` : '';
      html += `<input type="${type}" id="${id}" class="tool-input" placeholder="${placeholder}"${step}${min}${max}${defaultVal}>`;
    }

    if (input.error) {
      html += `<span id="${id}-error" class="tool-error" style="display:none;">${input.error}</span>`;
    }
    html += `</div>`;
    return html;
  }

  function _renderResult(result) {
    const container = document.getElementById('tool-result');
    if (!container) return;

    let html = '<div class="tool-result-inner">';
    html += `<h3 class="tool-result-title">Result</h3>`;

    if (result.items) {
      result.items.forEach(item => {
        html += `<div class="tool-result-row">`;
        html += `<span class="tool-result-label">${item.label}</span>`;
        html += `<span class="tool-result-value">${item.value}</span>`;
        html += `</div>`;
      });
    }

    if (result.summary) {
      html += `<div class="tool-result-summary">${result.summary}</div>`;
    }

    html += `<div class="tool-result-actions">`;
    html += `<button type="button" id="tool-copy" class="btn-pill-ghost tool-copy-btn">Copy Result</button>`;
    html += `<button type="button" id="tool-print" class="btn-pill-ghost tool-print-btn">Print</button>`;
    html += `</div>`;
    html += '</div>';

    container.innerHTML = html;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    document.getElementById('tool-copy')?.addEventListener('click', _copyResult);
    document.getElementById('tool-print')?.addEventListener('click', () => window.print());
  }

  // --- Events ---
  function _bindEvents() {
    document.getElementById('tool-calculate')?.addEventListener('click', _calculate);
    document.getElementById('tool-clear')?.addEventListener('click', _clear);

    // Enter key support
    document.getElementById('tool-calculator')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _calculate();
    });
  }

  function _getValues() {
    const values = {};
    _config.inputs.forEach(input => {
      const el = document.getElementById('input-' + input.id);
      if (!el) return;
      if (input.type === 'checkbox') {
        values[input.id] = el.checked;
      } else if (input.type === 'number') {
        values[input.id] = el.value === '' ? null : parseFloat(el.value);
      } else {
        values[input.id] = el.value;
      }
    });
    return values;
  }

  function _validate(values) {
    let valid = true;
    _config.inputs.forEach(input => {
      const errorEl = document.getElementById('input-' + input.id + '-error');
      const inputEl = document.getElementById('input-' + input.id);

      if (input.required !== false && (values[input.id] === null || values[input.id] === '')) {
        if (errorEl) {
          errorEl.textContent = input.error || 'This field is required';
          errorEl.style.display = 'block';
        }
        inputEl?.classList.add('tool-input--error');
        valid = false;
      } else {
        if (errorEl) errorEl.style.display = 'none';
        inputEl?.classList.remove('tool-input--error');
      }
    });
    return valid;
  }

  function _calculate() {
    const values = _getValues();
    if (!_validate(values)) return;

    _saveLastInputs(values);

    const result = _config.calculate(values);
    if (result) {
      _renderResult(result);
      _saveHistory({ inputs: values, result, timestamp: Date.now() });
    }
  }

  function _clear() {
    _config.inputs.forEach(input => {
      const el = document.getElementById('input-' + input.id);
      if (!el) return;
      if (input.type === 'checkbox') {
        el.checked = !!input.default;
      } else {
        el.value = input.default !== undefined ? input.default : '';
      }
      const errorEl = document.getElementById('input-' + input.id + '-error');
      if (errorEl) errorEl.style.display = 'none';
      el.classList.remove('tool-input--error');
    });
    const resultEl = document.getElementById('tool-result');
    if (resultEl) resultEl.style.display = 'none';
  }

  function _copyResult() {
    const resultEl = document.getElementById('tool-result');
    if (!resultEl) return;

    const rows = resultEl.querySelectorAll('.tool-result-row');
    let text = _config.title + '\n';
    text += '='.repeat(_config.title.length) + '\n\n';
    rows.forEach(row => {
      const label = row.querySelector('.tool-result-label')?.textContent || '';
      const value = row.querySelector('.tool-result-value')?.textContent || '';
      text += label + ': ' + value + '\n';
    });
    const summary = resultEl.querySelector('.tool-result-summary');
    if (summary) text += '\n' + summary.textContent;
    text += '\n\nCalculated at tool.teamzlab.com/' + _config.slug;

    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('tool-copy');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 2000);
      }
    }).catch(() => {});
  }

  // --- Utility exports ---
  function formatCurrency(amount, currency = '') {
    const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency ? currency + ' ' + formatted : formatted;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function addBusinessDays(startDate, days) {
    const date = new Date(startDate);
    let added = 0;
    while (added < days) {
      date.setDate(date.getDate() + 1);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return date;
  }

  function addCalendarDays(startDate, days) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date;
  }

  function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function businessDaysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    let count = 0;
    const current = new Date(d1);
    while (current < d2) {
      current.setDate(current.getDate() + 1);
      const dow = current.getDay();
      if (dow !== 0 && dow !== 6) count++;
    }
    return count;
  }

  return {
    init,
    formatCurrency,
    formatDate,
    addBusinessDays,
    addCalendarDays,
    daysBetween,
    businessDaysBetween
  };
})();
