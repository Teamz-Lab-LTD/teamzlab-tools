/**
 * Teamz Lab Tools — Utility Engine
 * Config-driven engine for text tools, dev tools, image tools, and generators.
 * Parallel to ToolEngine (calculators). Does NOT modify ToolEngine.
 */

var UtilityEngine = (function () {
  var _config = null;
  var STORAGE_PREFIX = 'teamzutil_';

  function _escapeHtml(text) {
    if (text === null || text === undefined) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  function init(config) {
    if (!config || !config.slug || !config.mode) {
      console.warn('UtilityEngine: slug and mode required');
      return;
    }
    _config = config;

    if (_config.mode === 'text') _renderTextMode();
    else if (_config.mode === 'file') _renderFileMode();
    else if (_config.mode === 'generator') _renderGeneratorMode();

    _restoreInputs();
  }

  // ==================== TEXT MODE ====================
  function _renderTextMode() {
    var container = document.getElementById('tool-calculator');
    if (!container) return;

    var html = '<div class="utility-inputs">';

    // Render textareas and other inputs
    (_config.inputs || []).forEach(function (input) {
      html += _renderInput(input);
    });

    html += '</div>';

    // Action buttons
    if (!_config.liveOnly) {
      var label = _config.processLabel || 'Process';
      html += '<div class="tool-actions">';
      html += '<button type="button" id="util-process" class="btn-pill tool-calculate-btn">' + _escapeHtml(label) + '</button>';
      html += '<button type="button" id="util-clear" class="btn-pill-ghost tool-clear-btn">Clear</button>';
      html += '</div>';
    }

    // Stats bar (for live tools like word counter)
    if (_config.showStats) {
      html += '<div id="util-stats" class="tool-stats-bar"></div>';
    }

    // Output area
    html += '<div id="util-output" class="tool-output" style="display:none;"></div>';

    // Result CTA
    html += '<div id="util-result-cta" class="tool-result-cta" style="display:none;">';
    html += '<p>Need a custom tool, dashboard, or app? <a href="https://teamzlab.com" target="_blank" rel="noopener" id="util-cta-link">Teamz Lab</a> can build it.</p>';
    html += '</div>';

    container.innerHTML = html;
    _bindTextEvents();
  }

  function _bindTextEvents() {
    var processBtn = document.getElementById('util-process');
    var clearBtn = document.getElementById('util-clear');

    if (processBtn) processBtn.addEventListener('click', _processText);
    if (clearBtn) clearBtn.addEventListener('click', _clearAll);

    // Live preview / live stats
    if (_config.livePreview || _config.showStats) {
      var debouncedProcess = debounce(function () {
        _processText();
      }, 150);

      (_config.inputs || []).forEach(function (input) {
        if (input.type === 'textarea') {
          var el = document.getElementById('input-' + input.id);
          if (el) el.addEventListener('input', debouncedProcess);
        }
      });
    }

    // Enter key on non-textarea inputs
    var container = document.getElementById('tool-calculator');
    if (container) {
      container.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
          _processText();
        }
      });
    }
  }

  function _processText() {
    var values = _getValues();
    _saveInputs(values);

    try {
      var result = _config.process(values);
      if (result) {
        _renderOutput(result);
        if (typeof TeamzAnalytics !== 'undefined') {
          TeamzAnalytics.trackClick('process::' + _config.slug);
        }
      }
    } catch (e) {
      _renderOutput({ output: 'Error: ' + e.message, outputType: 'text' });
    }
  }

  function _renderOutput(result) {
    var container = document.getElementById('util-output');
    var ctaEl = document.getElementById('util-result-cta');
    if (!container) return;

    var html = '';

    // Stats bar
    if (result.stats) {
      var statsEl = document.getElementById('util-stats');
      if (statsEl) {
        var statsHtml = '';
        result.stats.forEach(function (stat) {
          statsHtml += '<span class="tool-stat-item"><strong>' + _escapeHtml(stat.label) + ':</strong> ' + _escapeHtml(stat.value) + '</span>';
        });
        statsEl.innerHTML = statsHtml;
        statsEl.style.display = 'flex';
      }
    }

    // Output header with copy button
    html += '<div class="tool-output-header">';
    html += '<span class="tool-output-title">' + _escapeHtml(result.title || 'Output') + '</span>';
    html += '<button type="button" id="util-copy" class="btn-pill-ghost tool-copy-btn">Copy</button>';
    if (result.downloadable) {
      html += '<button type="button" id="util-download" class="btn-pill-ghost tool-copy-btn">Download</button>';
    }
    html += '</div>';

    // Output content
    if (result.outputType === 'code') {
      html += '<pre class="tool-output--code"><code>' + _escapeHtml(result.output) + '</code></pre>';
    } else if (result.outputType === 'html') {
      html += '<div class="tool-output--preview">' + result.output + '</div>';
    } else if (result.outputType === 'diff') {
      html += '<div class="tool-output--diff">' + result.output + '</div>';
    } else if (result.outputType === 'table') {
      html += result.output;
    } else {
      html += '<pre class="tool-output--text">' + _escapeHtml(result.output) + '</pre>';
    }

    container.innerHTML = html;
    container.style.display = 'block';

    if (ctaEl) ctaEl.style.display = 'block';

    // Bind copy
    var copyBtn = document.getElementById('util-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = result.copyText || result.output || '';
        _copyToClipboard(text, copyBtn);
        if (typeof TeamzAnalytics !== 'undefined') TeamzAnalytics.trackClick('copy::' + _config.slug);
      });
    }

    // Bind download
    var downloadBtn = document.getElementById('util-download');
    if (downloadBtn && result.downloadData) {
      downloadBtn.addEventListener('click', function () {
        _downloadText(result.downloadData, result.downloadFilename || 'output.txt');
        if (typeof TeamzAnalytics !== 'undefined') TeamzAnalytics.trackClick('download::' + _config.slug);
      });
    }

    // CTA tracking
    var ctaLink = document.getElementById('util-cta-link');
    if (ctaLink) {
      ctaLink.addEventListener('click', function () {
        if (typeof TeamzAnalytics !== 'undefined') TeamzAnalytics.trackClick('cta::' + _config.slug);
      });
    }
  }

  // ==================== FILE MODE ====================
  function _renderFileMode() {
    var container = document.getElementById('tool-calculator');
    if (!container) return;

    var accept = _config.accept || 'image/*';
    var html = '';

    // Dropzone
    html += '<div id="util-dropzone" class="tool-dropzone" tabindex="0" role="button" aria-label="Upload file">';
    html += '<div class="tool-dropzone-content">';
    html += '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
    html += '<p>Drag &amp; drop your file here, or <strong>click to browse</strong></p>';
    html += '<span class="tool-dropzone-hint">Accepts: ' + _escapeHtml(accept) + '</span>';
    html += '</div>';
    html += '<input type="file" id="util-file-input" accept="' + _escapeHtml(accept) + '" style="display:none;">';
    html += '</div>';

    // File preview
    html += '<div id="util-file-preview" class="tool-file-preview" style="display:none;"></div>';

    // Options
    if (_config.inputs && _config.inputs.length) {
      html += '<div class="utility-inputs" id="util-file-options" style="display:none;">';
      _config.inputs.forEach(function (input) {
        html += _renderInput(input);
      });
      html += '</div>';
    }

    // Process button
    html += '<div class="tool-actions" id="util-file-actions" style="display:none;">';
    html += '<button type="button" id="util-process-file" class="btn-pill tool-calculate-btn">' + _escapeHtml(_config.processLabel || 'Process') + '</button>';
    html += '</div>';

    // Output
    html += '<div id="util-output" class="tool-output" style="display:none;"></div>';

    // CTA
    html += '<div id="util-result-cta" class="tool-result-cta" style="display:none;">';
    html += '<p>Need a custom tool, dashboard, or app? <a href="https://teamzlab.com" target="_blank" rel="noopener" id="util-cta-link">Teamz Lab</a> can build it.</p>';
    html += '</div>';

    container.innerHTML = html;
    _bindFileEvents();
  }

  var _currentFile = null;

  function _bindFileEvents() {
    var dropzone = document.getElementById('util-dropzone');
    var fileInput = document.getElementById('util-file-input');
    var processBtn = document.getElementById('util-process-file');

    if (dropzone) {
      dropzone.addEventListener('click', function () { fileInput.click(); });
      dropzone.addEventListener('keydown', function (e) { if (e.key === 'Enter') fileInput.click(); });

      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropzone.classList.add('tool-dropzone--active');
      });
      dropzone.addEventListener('dragleave', function () {
        dropzone.classList.remove('tool-dropzone--active');
      });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.classList.remove('tool-dropzone--active');
        if (e.dataTransfer.files.length) _handleFile(e.dataTransfer.files[0]);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files.length) _handleFile(fileInput.files[0]);
      });
    }

    if (processBtn) {
      processBtn.addEventListener('click', _processFile);
    }
  }

  function _handleFile(file) {
    _currentFile = file;
    var preview = document.getElementById('util-file-preview');
    var options = document.getElementById('util-file-options');
    var actions = document.getElementById('util-file-actions');
    var dropzone = document.getElementById('util-dropzone');

    if (preview && file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function (e) {
        preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview" style="max-width:100%;max-height:300px;border-radius:8px;">' +
          '<div class="tool-file-info"><strong>' + _escapeHtml(file.name) + '</strong> — ' + _formatFileSize(file.size) + '</div>';
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }

    if (options) options.style.display = 'block';
    if (actions) actions.style.display = 'flex';
    if (dropzone) dropzone.style.display = 'none';
  }

  function _processFile() {
    if (!_currentFile || !_config.process) return;

    var values = _getValues();

    try {
      _config.process(_currentFile, values, function (result) {
        _renderFileOutput(result);
        if (typeof TeamzAnalytics !== 'undefined') {
          TeamzAnalytics.trackClick('process::' + _config.slug);
        }
      });
    } catch (e) {
      console.error('UtilityEngine file process error:', e);
    }
  }

  function _renderFileOutput(result) {
    var container = document.getElementById('util-output');
    var ctaEl = document.getElementById('util-result-cta');
    if (!container) return;

    var html = '';

    // Stats
    if (result.stats) {
      html += '<div class="tool-stats-bar">';
      result.stats.forEach(function (stat) {
        html += '<span class="tool-stat-item"><strong>' + _escapeHtml(stat.label) + ':</strong> ' + _escapeHtml(stat.value) + '</span>';
      });
      html += '</div>';
    }

    // Preview
    if (result.previewUrl) {
      html += '<div class="tool-file-preview">';
      html += '<img src="' + result.previewUrl + '" alt="Result" style="max-width:100%;max-height:400px;border-radius:8px;">';
      html += '</div>';
    }

    // Download button
    if (result.blob) {
      html += '<div class="tool-download-zone">';
      html += '<button type="button" id="util-download-result" class="btn-pill tool-calculate-btn">Download ' + _escapeHtml(result.filename || 'result') + '</button>';
      html += '</div>';
    }

    // Text output (e.g., base64 string)
    if (result.textOutput) {
      html += '<div class="tool-output-header">';
      html += '<span class="tool-output-title">Output</span>';
      html += '<button type="button" id="util-copy-text" class="btn-pill-ghost tool-copy-btn">Copy</button>';
      html += '</div>';
      html += '<pre class="tool-output--code"><code>' + _escapeHtml(result.textOutput) + '</code></pre>';
    }

    container.innerHTML = html;
    container.style.display = 'block';
    if (ctaEl) ctaEl.style.display = 'block';

    // Bind download
    var dlBtn = document.getElementById('util-download-result');
    if (dlBtn && result.blob) {
      dlBtn.addEventListener('click', function () {
        downloadBlob(result.blob, result.filename || 'result');
        if (typeof TeamzAnalytics !== 'undefined') TeamzAnalytics.trackClick('download::' + _config.slug);
      });
    }

    // Bind copy
    var copyBtn = document.getElementById('util-copy-text');
    if (copyBtn && result.textOutput) {
      copyBtn.addEventListener('click', function () {
        _copyToClipboard(result.textOutput, copyBtn);
      });
    }

    // Process another
    var dropzone = document.getElementById('util-dropzone');
    if (dropzone) {
      setTimeout(function () {
        var again = document.createElement('button');
        again.type = 'button';
        again.className = 'btn-pill-ghost';
        again.textContent = 'Process Another';
        again.style.marginTop = '1rem';
        again.addEventListener('click', function () {
          _currentFile = null;
          dropzone.style.display = 'block';
          container.style.display = 'none';
          if (ctaEl) ctaEl.style.display = 'none';
          var preview = document.getElementById('util-file-preview');
          if (preview) preview.style.display = 'none';
          var opts = document.getElementById('util-file-options');
          if (opts) opts.style.display = 'none';
          var acts = document.getElementById('util-file-actions');
          if (acts) acts.style.display = 'none';
        });
        container.appendChild(again);
      }, 0);
    }
  }

  // ==================== GENERATOR MODE ====================
  function _renderGeneratorMode() {
    var container = document.getElementById('tool-calculator');
    if (!container) return;

    var html = '<div class="utility-inputs">';
    (_config.inputs || []).forEach(function (input) {
      html += _renderInput(input);
    });
    html += '</div>';

    html += '<div class="tool-actions">';
    html += '<button type="button" id="util-generate" class="btn-pill tool-calculate-btn">' + _escapeHtml(_config.processLabel || 'Generate') + '</button>';
    html += '<button type="button" id="util-clear" class="btn-pill-ghost tool-clear-btn">Clear</button>';
    html += '</div>';

    html += '<div id="util-output" class="tool-output" style="display:none;"></div>';

    html += '<div id="util-result-cta" class="tool-result-cta" style="display:none;">';
    html += '<p>Need a custom tool, dashboard, or app? <a href="https://teamzlab.com" target="_blank" rel="noopener">Teamz Lab</a> can build it.</p>';
    html += '</div>';

    container.innerHTML = html;

    var genBtn = document.getElementById('util-generate');
    var clearBtn = document.getElementById('util-clear');
    if (genBtn) genBtn.addEventListener('click', _processText);
    if (clearBtn) clearBtn.addEventListener('click', _clearAll);
  }

  // ==================== SHARED HELPERS ====================
  function _renderInput(input) {
    var id = 'input-' + input.id;
    var label = _escapeHtml(input.label || '');
    var hint = input.hint ? ' <span class="tool-hint">' + _escapeHtml(input.hint) + '</span>' : '';

    var html = '<div class="tool-field">';
    html += '<label for="' + id + '" class="tool-label">' + label + hint + '</label>';

    if (input.type === 'textarea') {
      var rows = input.rows || 8;
      var mono = input.monospace ? ' tool-textarea--mono' : '';
      var placeholder = input.placeholder ? ' placeholder="' + _escapeHtml(input.placeholder) + '"' : '';
      html += '<textarea id="' + id + '" class="tool-textarea' + mono + '" rows="' + rows + '"' + placeholder + '>' + _escapeHtml(input.default || '') + '</textarea>';
    } else if (input.type === 'select') {
      html += '<select id="' + id + '" class="tool-select">';
      (input.options || []).forEach(function (opt) {
        var selected = opt.value === input.default ? ' selected' : '';
        html += '<option value="' + _escapeHtml(opt.value) + '"' + selected + '>' + _escapeHtml(opt.label) + '</option>';
      });
      html += '</select>';
    } else if (input.type === 'checkbox') {
      html += '<label class="tool-checkbox-label">';
      html += '<input type="checkbox" id="' + id + '" class="tool-checkbox"' + (input.default ? ' checked' : '') + '>';
      html += ' ' + _escapeHtml(input.checkboxLabel || '');
      html += '</label>';
    } else {
      var type = input.type || 'text';
      var placeholder2 = input.placeholder ? ' placeholder="' + _escapeHtml(input.placeholder) + '"' : '';
      var step = input.step ? ' step="' + input.step + '"' : '';
      var min = input.min !== undefined ? ' min="' + input.min + '"' : '';
      var max = input.max !== undefined ? ' max="' + input.max + '"' : '';
      var defaultVal = input.default !== undefined ? ' value="' + _escapeHtml(String(input.default)) + '"' : '';
      html += '<input type="' + type + '" id="' + id + '" class="tool-input"' + placeholder2 + step + min + max + defaultVal + '>';
    }

    html += '</div>';
    return html;
  }

  function _getValues() {
    var values = {};
    (_config.inputs || []).forEach(function (input) {
      var el = document.getElementById('input-' + input.id);
      if (!el) return;
      if (input.type === 'checkbox') {
        values[input.id] = el.checked;
      } else if (input.type === 'number') {
        values[input.id] = el.value === '' ? null : parseFloat(el.value);
      } else if (input.type === 'textarea') {
        values[input.id] = el.value;
      } else {
        values[input.id] = el.value;
      }
    });
    return values;
  }

  function _clearAll() {
    (_config.inputs || []).forEach(function (input) {
      var el = document.getElementById('input-' + input.id);
      if (!el) return;
      if (input.type === 'checkbox') el.checked = !!input.default;
      else el.value = input.default !== undefined ? input.default : '';
    });
    var output = document.getElementById('util-output');
    if (output) output.style.display = 'none';
    var stats = document.getElementById('util-stats');
    if (stats) { stats.innerHTML = ''; stats.style.display = 'none'; }
    var cta = document.getElementById('util-result-cta');
    if (cta) cta.style.display = 'none';
  }

  function _saveInputs(values) {
    try {
      var save = {};
      for (var key in values) {
        if (typeof values[key] === 'string' && values[key].length > 5000) continue;
        save[key] = values[key];
      }
      localStorage.setItem(STORAGE_PREFIX + _config.slug, JSON.stringify(save));
    } catch (e) {}
  }

  function _restoreInputs() {
    try {
      var raw = localStorage.getItem(STORAGE_PREFIX + _config.slug);
      if (!raw) return;
      var values = JSON.parse(raw);
      (_config.inputs || []).forEach(function (input) {
        var el = document.getElementById('input-' + input.id);
        if (el && values[input.id] !== undefined) {
          if (input.type === 'checkbox') el.checked = !!values[input.id];
          else el.value = values[input.id];
        }
      });
    } catch (e) {}
  }

  function _copyToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        _showCopyFeedback(btn);
      }).catch(function () { _fallbackCopy(text, btn); });
    } else {
      _fallbackCopy(text, btn);
    }
  }

  function _fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); _showCopyFeedback(btn); } catch (e) {}
    document.body.removeChild(ta);
  }

  function _showCopyFeedback(btn) {
    if (!btn) return;
    var orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(function () { btn.textContent = orig; }, 2000);
  }

  function _downloadText(text, filename) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, filename);
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 100);
  }

  function _formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function copyToClipboard(text) {
    _copyToClipboard(text, null);
  }

  return {
    init: init,
    copyToClipboard: copyToClipboard,
    downloadBlob: downloadBlob,
    debounce: debounce,
    formatFileSize: _formatFileSize
  };
})();
