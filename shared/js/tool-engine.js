/**
 * Teamz Lab Tools — Reusable Calculator Engine
 * Config-driven tool system for static calculator pages.
 */

var ToolEngine = (function () {
  var _config = null;
  var _history = [];
  var STORAGE_PREFIX = 'teamztools_';

  function _escapeHtml(text) {
    if (text === null || text === undefined) return '';
    var str = String(text);
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function init(config) {
    if (!config || !config.slug || !config.inputs || !config.calculate) {
      console.warn('ToolEngine: invalid config — slug, inputs, and calculate are required.');
      return;
    }
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
      var raw = localStorage.getItem(_storageKey() + '_history');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function _saveHistory(entry) {
    _history.unshift(entry);
    if (_history.length > 10) _history = _history.slice(0, 10);
    try {
      localStorage.setItem(_storageKey() + '_history', JSON.stringify(_history));
    } catch (e) {}
  }

  function _saveLastInputs(values) {
    try {
      localStorage.setItem(_storageKey() + '_last', JSON.stringify(values));
    } catch (e) {}
  }

  function _restoreLastInputs() {
    try {
      var raw = localStorage.getItem(_storageKey() + '_last');
      if (!raw) return;
      var values = JSON.parse(raw);
      _config.inputs.forEach(function (input) {
        var el = document.getElementById('input-' + input.id);
        if (el && values[input.id] !== undefined) {
          if (input.type === 'checkbox') {
            el.checked = !!values[input.id];
          } else {
            el.value = values[input.id];
          }
        }
      });
    } catch (e) {}
  }

  // --- Rendering ---
  function _renderCalculator() {
    var container = document.getElementById('tool-calculator');
    if (!container) return;

    var html = '<div class="tool-inputs">';
    _config.inputs.forEach(function (input) {
      html += _renderInput(input);
    });
    html += '</div>';

    html += '<div class="tool-actions">';
    html += '<button type="button" id="tool-calculate" class="btn-pill tool-calculate-btn">Calculate</button>';
    html += '<button type="button" id="tool-clear" class="btn-pill-ghost tool-clear-btn">Clear</button>';
    html += '</div>';

    html += '<div id="tool-result" class="tool-result" style="display:none;"></div>';

    container.innerHTML = html;
  }

  function _renderInput(input) {
    var id = 'input-' + input.id;
    var label = _escapeHtml(input.label);
    var hint = input.hint ? ' <span class="tool-hint">' + _escapeHtml(input.hint) + '</span>' : '';
    var errorId = id + '-error';

    var html = '<div class="tool-field">';
    html += '<label for="' + id + '" class="tool-label">' + label + hint + '</label>';

    if (input.type === 'select') {
      html += '<select id="' + id + '" class="tool-select" aria-label="' + label + '">';
      (input.options || []).forEach(function (opt) {
        var selected = opt.value === input.default ? ' selected' : '';
        html += '<option value="' + _escapeHtml(opt.value) + '"' + selected + '>' + _escapeHtml(opt.label) + '</option>';
      });
      html += '</select>';
    } else if (input.type === 'checkbox') {
      html += '<label class="tool-checkbox-label">';
      html += '<input type="checkbox" id="' + id + '" class="tool-checkbox"' + (input.default ? ' checked' : '') + ' aria-label="' + _escapeHtml(input.checkboxLabel || label) + '">';
      html += ' ' + _escapeHtml(input.checkboxLabel || '');
      html += '</label>';
    } else {
      var type = input.type || 'text';
      var placeholder = input.placeholder ? ' placeholder="' + _escapeHtml(input.placeholder) + '"' : '';
      var step = input.step ? ' step="' + input.step + '"' : '';
      var min = input.min !== undefined ? ' min="' + input.min + '"' : '';
      var max = input.max !== undefined ? ' max="' + input.max + '"' : '';
      var defaultVal = input.default !== undefined ? ' value="' + _escapeHtml(String(input.default)) + '"' : '';
      var ariaDesc = input.error ? ' aria-describedby="' + errorId + '"' : '';
      html += '<input type="' + type + '" id="' + id + '" class="tool-input"' + placeholder + step + min + max + defaultVal + ariaDesc + '>';
    }

    if (input.error) {
      html += '<span id="' + errorId + '" class="tool-error" role="alert" style="display:none;">' + _escapeHtml(input.error) + '</span>';
    }
    html += '</div>';
    return html;
  }

  function _renderResult(result) {
    var container = document.getElementById('tool-result');
    if (!container) return;

    var html = '<div class="tool-result-inner">';
    html += '<h3 class="tool-result-title">Result</h3>';

    if (result.items) {
      result.items.forEach(function (item) {
        html += '<div class="tool-result-row">';
        html += '<span class="tool-result-label">' + _escapeHtml(item.label) + '</span>';
        html += '<span class="tool-result-value">' + _escapeHtml(item.value) + '</span>';
        html += '</div>';
      });
    }

    if (result.summary) {
      html += '<div class="tool-result-summary">' + _escapeHtml(result.summary) + '</div>';
    }

    html += '<div class="tool-result-actions">';
    html += '<button type="button" id="tool-copy" class="btn-pill-ghost tool-copy-btn">Copy Result</button>';
    html += '<button type="button" id="tool-print" class="btn-pill-ghost tool-print-btn">Print</button>';
    html += '</div>';

    // Teamz Lab CTA in result
    html += '<div class="tool-result-cta">';
    html += '<p>Need a custom calculator, dashboard, or app? <a href="https://teamzlab.com" target="_blank" rel="noopener" id="tool-cta-link">Teamz Lab</a> can build it.</p>';
    html += '</div>';

    html += '</div>';

    container.innerHTML = html;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    var copyBtn = document.getElementById('tool-copy');
    var printBtn = document.getElementById('tool-print');
    var ctaLink = document.getElementById('tool-cta-link');
    if (copyBtn) copyBtn.addEventListener('click', _copyResult);
    if (printBtn) printBtn.addEventListener('click', function () {
      if (typeof TeamzAnalytics !== 'undefined') TeamzAnalytics.trackClick('print::' + _config.slug);
      window.print();
    });
    if (ctaLink) ctaLink.addEventListener('click', function () {
      if (typeof TeamzAnalytics !== 'undefined') TeamzAnalytics.trackClick('cta::' + _config.slug);
    });
  }

  // --- Events ---
  function _bindEvents() {
    var calcBtn = document.getElementById('tool-calculate');
    var clearBtn = document.getElementById('tool-clear');
    var calcContainer = document.getElementById('tool-calculator');

    if (calcBtn) calcBtn.addEventListener('click', _calculate);
    if (clearBtn) clearBtn.addEventListener('click', _clear);

    if (calcContainer) {
      calcContainer.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') _calculate();
      });
    }
  }

  function _getValues() {
    var values = {};
    _config.inputs.forEach(function (input) {
      var el = document.getElementById('input-' + input.id);
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
    var valid = true;
    _config.inputs.forEach(function (input) {
      var errorEl = document.getElementById('input-' + input.id + '-error');
      var inputEl = document.getElementById('input-' + input.id);

      // Required check
      if (input.required !== false && (values[input.id] === null || values[input.id] === '')) {
        _showError(errorEl, inputEl, input.error || 'This field is required');
        valid = false;
        return;
      }

      // Min/max validation for numbers
      if (input.type === 'number' && values[input.id] !== null) {
        var val = values[input.id];
        if (input.min !== undefined && val < input.min) {
          _showError(errorEl, inputEl, 'Minimum value is ' + input.min);
          valid = false;
          return;
        }
        if (input.max !== undefined && val > input.max) {
          _showError(errorEl, inputEl, 'Maximum value is ' + input.max);
          valid = false;
          return;
        }
        if (isNaN(val)) {
          _showError(errorEl, inputEl, 'Please enter a valid number');
          valid = false;
          return;
        }
      }

      // Clear error
      if (errorEl) errorEl.style.display = 'none';
      if (inputEl) inputEl.classList.remove('tool-input--error');
    });
    return valid;
  }

  function _showError(errorEl, inputEl, message) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
    if (inputEl) inputEl.classList.add('tool-input--error');
  }

  function _calculate() {
    var values = _getValues();
    if (!_validate(values)) return;

    _saveLastInputs(values);

    try {
      var result = _config.calculate(values);
      if (result) {
        _renderResult(result);
        _saveHistory({ inputs: values, result: result, timestamp: Date.now() });

        // Track calculation in analytics
        if (typeof TeamzAnalytics !== 'undefined') {
          TeamzAnalytics.trackClick('calculate::' + _config.slug);
        }
      }
    } catch (e) {
      console.error('ToolEngine: calculation error', e);
    }
  }

  function _clear() {
    _config.inputs.forEach(function (input) {
      var el = document.getElementById('input-' + input.id);
      if (!el) return;
      if (input.type === 'checkbox') {
        el.checked = !!input.default;
      } else {
        el.value = input.default !== undefined ? input.default : '';
      }
      var errorEl = document.getElementById('input-' + input.id + '-error');
      if (errorEl) errorEl.style.display = 'none';
      el.classList.remove('tool-input--error');
    });
    var resultEl = document.getElementById('tool-result');
    if (resultEl) resultEl.style.display = 'none';
  }

  function _copyResult() {
    var resultEl = document.getElementById('tool-result');
    if (!resultEl) return;

    var rows = resultEl.querySelectorAll('.tool-result-row');
    var text = _config.title + '\n';
    text += '='.repeat(_config.title.length) + '\n\n';
    rows.forEach(function (row) {
      var label = row.querySelector('.tool-result-label');
      var value = row.querySelector('.tool-result-value');
      text += (label ? label.textContent : '') + ': ' + (value ? value.textContent : '') + '\n';
    });
    var summary = resultEl.querySelector('.tool-result-summary');
    if (summary) text += '\n' + summary.textContent;
    text += '\n\nCalculated at tool.teamzlab.com/' + _config.slug;

    // Track copy click
    if (typeof TeamzAnalytics !== 'undefined') TeamzAnalytics.trackClick('copy::' + _config.slug);

    // Clipboard API with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        _showCopyFeedback();
      }).catch(function () {
        _fallbackCopy(text);
      });
    } else {
      _fallbackCopy(text);
    }
  }

  function _fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      _showCopyFeedback();
    } catch (e) {
      // Silent fail
    }
    document.body.removeChild(textarea);
  }

  function _showCopyFeedback() {
    var btn = document.getElementById('tool-copy');
    if (btn) {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 2000);
    }
  }

  // --- Utility exports ---
  function formatCurrency(amount, currency) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
    var formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency ? currency + ' ' + formatted : formatted;
  }

  function formatDate(date) {
    if (!date || isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function parseInputDate(dateString) {
    if (!dateString) return null;
    var parts = dateString.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function addBusinessDays(startDate, days) {
    var date = startDate instanceof Date ? new Date(startDate.getTime()) : parseInputDate(startDate) || new Date(startDate);
    var added = 0;
    while (added < days) {
      date.setDate(date.getDate() + 1);
      var dow = date.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return date;
  }

  function addCalendarDays(startDate, days) {
    var date = startDate instanceof Date ? new Date(startDate.getTime()) : parseInputDate(startDate) || new Date(startDate);
    date.setDate(date.getDate() + days);
    return date;
  }

  function daysBetween(date1, date2) {
    var d1 = date1 instanceof Date ? date1 : parseInputDate(date1) || new Date(date1);
    var d2 = date2 instanceof Date ? date2 : parseInputDate(date2) || new Date(date2);
    var diffMs = d2.getTime() - d1.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  function businessDaysBetween(date1, date2) {
    var d1 = date1 instanceof Date ? date1 : parseInputDate(date1) || new Date(date1);
    var d2 = date2 instanceof Date ? date2 : parseInputDate(date2) || new Date(date2);
    var count = 0;
    var current = new Date(d1.getTime());
    while (current < d2) {
      current.setDate(current.getDate() + 1);
      var dow = current.getDay();
      if (dow !== 0 && dow !== 6) count++;
    }
    return count;
  }

  return {
    init: init,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    parseInputDate: parseInputDate,
    addBusinessDays: addBusinessDays,
    addCalendarDays: addCalendarDays,
    daysBetween: daysBetween,
    businessDaysBetween: businessDaysBetween
  };
})();
