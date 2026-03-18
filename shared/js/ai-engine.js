/**
 * TeamzAI — Central AI Engine for Teamz Lab Tools
 * Shared module for Chrome AI detection, Transformers.js management,
 * model caching, and 3-tier AI fallback.
 *
 * Usage: <script src="/shared/js/ai-engine.js"></script>
 * Then:  await TeamzAI.init();
 *        var result = await TeamzAI.generate({ ... });
 */
(function() {
  'use strict';

  /* =========================================
     CONSTANTS
     ========================================= */
  var DB_NAME = 'teamz-ai-models';
  var DB_VERSION = 1;
  var STORE_NAME = 'models';
  var LOG_PREFIX = '[TeamzAI]';

  /* =========================================
     INTERNAL STATE
     ========================================= */
  var pipelineCache = {};          // key: 'task|model', value: pipeline instance
  var transformersModule = null;   // cached dynamic import
  var initPromise = null;          // single init promise (idempotent)
  var db = null;                   // IndexedDB reference

  /* =========================================
     LOGGING
     ========================================= */
  function log() {
    var args = [LOG_PREFIX];
    for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
    console.log.apply(console, args);
  }

  function warn() {
    var args = [LOG_PREFIX];
    for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
    console.warn.apply(console, args);
  }

  /* =========================================
     INDEXEDDB — Model Tracking
     ========================================= */
  function openDB() {
    return new Promise(function(resolve, reject) {
      if (db) { resolve(db); return; }
      try {
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function(e) {
          var database = e.target.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'name' });
          }
        };
        request.onsuccess = function(e) {
          db = e.target.result;
          resolve(db);
        };
        request.onerror = function() {
          warn('IndexedDB open failed:', request.error);
          resolve(null);
        };
      } catch (e) {
        warn('IndexedDB not available:', e);
        resolve(null);
      }
    });
  }

  function getModelRecord(modelName) {
    return new Promise(function(resolve) {
      openDB().then(function(database) {
        if (!database) { resolve(null); return; }
        try {
          var tx = database.transaction(STORE_NAME, 'readonly');
          var store = tx.objectStore(STORE_NAME);
          var req = store.get(modelName);
          req.onsuccess = function() { resolve(req.result || null); };
          req.onerror = function() { resolve(null); };
        } catch (e) { resolve(null); }
      });
    });
  }

  function putModelRecord(record) {
    return new Promise(function(resolve) {
      openDB().then(function(database) {
        if (!database) { resolve(); return; }
        try {
          var tx = database.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          store.put(record);
          tx.oncomplete = function() { resolve(); };
          tx.onerror = function() { resolve(); };
        } catch (e) { resolve(); }
      });
    });
  }

  function deleteModelRecord(modelName) {
    return new Promise(function(resolve) {
      openDB().then(function(database) {
        if (!database) { resolve(); return; }
        try {
          var tx = database.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          store.delete(modelName);
          tx.oncomplete = function() { resolve(); };
          tx.onerror = function() { resolve(); };
        } catch (e) { resolve(); }
      });
    });
  }

  function getAllModelRecords() {
    return new Promise(function(resolve) {
      openDB().then(function(database) {
        if (!database) { resolve([]); return; }
        try {
          var tx = database.transaction(STORE_NAME, 'readonly');
          var store = tx.objectStore(STORE_NAME);
          var req = store.getAll();
          req.onsuccess = function() { resolve(req.result || []); };
          req.onerror = function() { resolve([]); };
        } catch (e) { resolve([]); }
      });
    });
  }

  function clearAllModelRecords() {
    return new Promise(function(resolve) {
      openDB().then(function(database) {
        if (!database) { resolve(); return; }
        try {
          var tx = database.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          store.clear();
          tx.oncomplete = function() { resolve(); };
          tx.onerror = function() { resolve(); };
        } catch (e) { resolve(); }
      });
    });
  }

  function touchModelLastUsed(modelName) {
    getModelRecord(modelName).then(function(record) {
      if (record) {
        record.lastUsed = Date.now();
        putModelRecord(record);
      }
    });
  }

  /* =========================================
     CHROME AI DETECTION
     ========================================= */
  async function detectChromeAI() {
    var result = {
      available: false,
      prompt: false,
      summarizer: false,
      writer: false,
      rewriter: false
    };

    // Prompt API (languageModel)
    try {
      if (window.ai && window.ai.languageModel) {
        var caps = await window.ai.languageModel.capabilities();
        if (caps && caps.available !== 'no') result.prompt = true;
      }
    } catch (e) { /* not available */ }

    // Summarizer API
    try {
      if (window.ai && window.ai.summarizer) {
        var caps = await window.ai.summarizer.capabilities();
        if (caps && caps.available !== 'no') result.summarizer = true;
      }
    } catch (e) { /* not available */ }

    // Writer API
    try {
      if (window.ai && window.ai.writer) {
        var caps = await window.ai.writer.capabilities();
        if (caps && caps.available !== 'no') result.writer = true;
      }
    } catch (e) { /* not available */ }

    // Rewriter API
    try {
      if (window.ai && window.ai.rewriter) {
        var caps = await window.ai.rewriter.capabilities();
        if (caps && caps.available !== 'no') result.rewriter = true;
      }
    } catch (e) { /* not available */ }

    result.available = result.prompt || result.summarizer || result.writer || result.rewriter;
    return result;
  }

  /* =========================================
     TRANSFORMERS.JS — Lazy Loading
     ========================================= */
  async function getTransformersModule() {
    if (!transformersModule) {
      log('Loading Transformers.js...');
      transformersModule = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3');
      transformersModule.env.allowLocalModels = false;
      log('Transformers.js loaded');
    }
    return transformersModule;
  }

  /* =========================================
     PIPELINE MANAGEMENT
     ========================================= */

  // Track in-flight pipeline loads to prevent duplicate downloads
  var pipelineLoadPromises = {};

  async function getPipelineInternal(task, model, options) {
    options = options || {};
    var key = task + '|' + model;

    // Return cached pipeline instantly
    if (pipelineCache[key]) {
      log('Pipeline cache hit:', key);
      touchModelLastUsed(model);
      return pipelineCache[key];
    }

    // If already loading this exact pipeline, wait for it
    if (pipelineLoadPromises[key]) {
      log('Pipeline already loading, waiting:', key);
      return pipelineLoadPromises[key];
    }

    // Start loading
    var loadPromise = (async function() {
      try {
        var onProgress = options.onProgress || function() {};
        var onStatus = options.onStatus || function() {};

        // Check if model was previously downloaded (Transformers.js handles cache)
        var existingRecord = await getModelRecord(model);
        if (existingRecord) {
          onStatus('Loading cached model...');
          log('Model previously downloaded:', model);
        } else {
          onStatus('Downloading AI model (first time only)...');
          log('Downloading model:', model);
        }

        var mod = await getTransformersModule();
        var pipeline = await mod.pipeline(task, model, {
          progress_callback: function(p) {
            if (p.status === 'progress' && p.total) {
              var pct = Math.round((p.loaded / p.total) * 100);
              onProgress(pct);
              onStatus('Downloading AI model... ' + pct + '%');
            }
            if (p.status === 'done' && p.file) {
              log('File ready:', p.file);
            }
          }
        });

        // Cache the pipeline
        pipelineCache[key] = pipeline;

        // Record in IndexedDB
        await putModelRecord({
          name: model,
          task: task,
          size: existingRecord ? existingRecord.size : 0,
          downloadDate: existingRecord ? existingRecord.downloadDate : Date.now(),
          lastUsed: Date.now()
        });

        onStatus('AI Ready \u2014 Works offline now');
        log('Pipeline ready:', key);

        return pipeline;
      } finally {
        // Clean up the in-flight promise
        delete pipelineLoadPromises[key];
      }
    })();

    pipelineLoadPromises[key] = loadPromise;
    return loadPromise;
  }

  /* =========================================
     3-TIER GENERATE
     ========================================= */
  async function generateInternal(options) {
    options = options || {};
    var onProgress = options.onProgress || function() {};
    var onStatus = options.onStatus || function() {};
    var qualityCheck = options.qualityCheck || null;

    // Tier 1: Chrome AI (Prompt API)
    if (TeamzAI.chromeAI.prompt && options.chromePrompt) {
      try {
        onStatus('Using Chrome AI (Gemini Nano)...');
        log('Trying Chrome AI...');

        var sessionOpts = {};
        if (options.chromeSystemPrompt) {
          sessionOpts.systemPrompt = options.chromeSystemPrompt;
        }
        var session = await window.ai.languageModel.create(sessionOpts);
        var result = await session.prompt(options.chromePrompt);
        session.destroy();

        var text = (result || '').trim();

        // Quality check
        if (qualityCheck && !qualityCheck(text)) {
          log('Chrome AI output failed quality check, falling through');
          onStatus('Chrome AI output was low quality, trying next tier...');
        } else {
          log('Chrome AI success');
          onStatus('Generated with Chrome AI');
          return { text: text, source: 'chrome-ai' };
        }
      } catch (e) {
        warn('Chrome AI failed:', e.message || e);
        onStatus('Chrome AI failed, trying Transformers.js...');
      }
    }

    // Tier 2: Transformers.js
    if (options.transformersTask && options.transformersModel && options.transformersPrompt) {
      try {
        log('Trying Transformers.js...');
        var pipeline = await getPipelineInternal(
          options.transformersTask,
          options.transformersModel,
          { onProgress: onProgress, onStatus: onStatus }
        );

        onStatus('Generating with local AI...');
        var genOptions = options.transformersOptions || {};
        var result = await pipeline(options.transformersPrompt, genOptions);

        var text = '';
        if (Array.isArray(result) && result.length > 0) {
          text = (result[0].generated_text || result[0].translation_text || '').trim();
        } else if (typeof result === 'string') {
          text = result.trim();
        } else if (result && result.generated_text) {
          text = result.generated_text.trim();
        }

        // Quality check
        if (qualityCheck && !qualityCheck(text)) {
          log('Transformers.js output failed quality check, falling through');
          onStatus('AI output was low quality, using fallback...');
        } else {
          log('Transformers.js success');
          onStatus('Generated with Transformers.js (local AI)');
          return { text: text, source: 'transformers' };
        }
      } catch (e) {
        warn('Transformers.js failed:', e.message || e);
        onStatus('Local AI unavailable, using fallback...');
      }
    }

    // Tier 3: Fallback function
    if (typeof options.fallback === 'function') {
      try {
        log('Using fallback function');
        var fallbackResult = await options.fallback();
        var text = typeof fallbackResult === 'string' ? fallbackResult : (fallbackResult || '').toString();
        onStatus('Using curated result');
        return { text: text, source: 'fallback' };
      } catch (e) {
        warn('Fallback function failed:', e.message || e);
      }
    }

    // Nothing worked
    onStatus('Generation failed');
    return { text: '', source: 'error' };
  }

  /* =========================================
     SUMMARIZE
     ========================================= */
  async function summarizeInternal(text, options) {
    options = options || {};
    var onProgress = options.onProgress || function() {};
    var onStatus = options.onStatus || function() {};

    // Try Chrome Summarizer API first
    if (TeamzAI.chromeAI.summarizer) {
      try {
        onStatus('Using Chrome Summarizer...');
        var summarizerOpts = {};
        if (options.type) summarizerOpts.type = options.type;           // 'tl;dr', 'key-points', 'teaser', 'headline'
        if (options.length) summarizerOpts.length = options.length;     // 'short', 'medium', 'long'
        if (options.format) summarizerOpts.format = options.format;     // 'plain-text', 'markdown'

        var summarizer = await window.ai.summarizer.create(summarizerOpts);
        var result = await summarizer.summarize(text);
        summarizer.destroy();

        onStatus('Summarized with Chrome AI');
        return { text: (result || '').trim(), source: 'chrome-ai' };
      } catch (e) {
        warn('Chrome Summarizer failed:', e.message || e);
        onStatus('Chrome Summarizer failed, trying Transformers.js...');
      }
    }

    // Fallback to Transformers.js summarization
    var model = options.model || 'Xenova/distilbart-cnn-6-6';
    try {
      var pipeline = await getPipelineInternal('summarization', model, {
        onProgress: onProgress,
        onStatus: onStatus
      });
      onStatus('Summarizing with local AI...');
      var result = await pipeline(text, {
        max_new_tokens: options.maxTokens || 150,
        min_length: options.minLength || 30
      });
      var summary = '';
      if (Array.isArray(result) && result.length > 0) {
        summary = (result[0].summary_text || '').trim();
      }
      onStatus('Summarized with Transformers.js');
      return { text: summary, source: 'transformers' };
    } catch (e) {
      warn('Summarization failed:', e.message || e);
      onStatus('Summarization failed');
      return { text: '', source: 'error' };
    }
  }

  /* =========================================
     REWRITE
     ========================================= */
  async function rewriteInternal(text, options) {
    options = options || {};
    var onProgress = options.onProgress || function() {};
    var onStatus = options.onStatus || function() {};

    // Try Chrome Rewriter API first
    if (TeamzAI.chromeAI.rewriter) {
      try {
        onStatus('Using Chrome Rewriter...');
        var rewriterOpts = {};
        if (options.tone) rewriterOpts.tone = options.tone;               // 'as-is', 'more-formal', 'more-casual'
        if (options.length) rewriterOpts.length = options.length;         // 'as-is', 'shorter', 'longer'
        if (options.format) rewriterOpts.format = options.format;         // 'as-is', 'plain-text', 'markdown'

        var rewriter = await window.ai.rewriter.create(rewriterOpts);
        var result = await rewriter.rewrite(text);
        rewriter.destroy();

        onStatus('Rewritten with Chrome AI');
        return { text: (result || '').trim(), source: 'chrome-ai' };
      } catch (e) {
        warn('Chrome Rewriter failed:', e.message || e);
        onStatus('Chrome Rewriter failed, trying Transformers.js...');
      }
    }

    // Fallback to Transformers.js text2text
    var model = options.model || 'Xenova/flan-t5-base';
    var prompt = 'Rewrite the following text';
    if (options.tone === 'more-formal') prompt += ' in a formal tone';
    else if (options.tone === 'more-casual') prompt += ' in a casual tone';
    if (options.length === 'shorter') prompt += ', making it shorter';
    else if (options.length === 'longer') prompt += ', making it longer';
    prompt += ': ' + text;

    try {
      var pipeline = await getPipelineInternal('text2text-generation', model, {
        onProgress: onProgress,
        onStatus: onStatus
      });
      onStatus('Rewriting with local AI...');
      var result = await pipeline(prompt, {
        max_new_tokens: options.maxTokens || 200,
        num_beams: 4,
        early_stopping: true
      });
      var rewritten = '';
      if (Array.isArray(result) && result.length > 0) {
        rewritten = (result[0].generated_text || '').trim();
      }
      onStatus('Rewritten with Transformers.js');
      return { text: rewritten, source: 'transformers' };
    } catch (e) {
      warn('Rewrite failed:', e.message || e);
      onStatus('Rewrite failed');
      return { text: '', source: 'error' };
    }
  }

  /* =========================================
     PUBLIC API
     ========================================= */
  window.TeamzAI = {
    // Chrome AI detection results (populated after init)
    chromeAI: {
      available: false,
      prompt: false,
      summarizer: false,
      writer: false,
      rewriter: false
    },

    /**
     * Initialize the AI engine (idempotent — safe to call multiple times).
     * Detects Chrome AI capabilities and opens IndexedDB.
     */
    init: function() {
      if (initPromise) return initPromise;
      initPromise = (async function() {
        log('Initializing...');

        // Open IndexedDB
        await openDB();

        // Detect Chrome AI
        var result = await detectChromeAI();
        TeamzAI.chromeAI.available = result.available;
        TeamzAI.chromeAI.prompt = result.prompt;
        TeamzAI.chromeAI.summarizer = result.summarizer;
        TeamzAI.chromeAI.writer = result.writer;
        TeamzAI.chromeAI.rewriter = result.rewriter;

        if (result.available) {
          var apis = [];
          if (result.prompt) apis.push('Prompt');
          if (result.summarizer) apis.push('Summarizer');
          if (result.writer) apis.push('Writer');
          if (result.rewriter) apis.push('Rewriter');
          log('Chrome AI available:', apis.join(', '));
        } else {
          log('Chrome AI not available, Transformers.js will be used as fallback');
        }

        log('Ready');
      })();
      return initPromise;
    },

    /**
     * Get or create a Transformers.js pipeline (cached in memory).
     * If the pipeline is already loaded, returns it instantly.
     *
     * @param {string} task - Pipeline task (e.g., 'text2text-generation', 'summarization')
     * @param {string} model - Model name (e.g., 'Xenova/flan-t5-base')
     * @param {Object} [options] - Options
     * @param {Function} [options.onProgress] - Progress callback: function(pct)
     * @param {Function} [options.onStatus] - Status callback: function(msg)
     * @returns {Promise<Object>} Pipeline instance
     */
    getPipeline: function(task, model, options) {
      return getPipelineInternal(task, model, options);
    },

    /**
     * High-level generation with 3-tier fallback:
     * Chrome AI -> Transformers.js -> fallback function
     *
     * @param {Object} options
     * @param {string} [options.chromePrompt] - Prompt for Chrome AI
     * @param {string} [options.chromeSystemPrompt] - System prompt for Chrome AI
     * @param {string} [options.transformersTask] - Transformers.js task
     * @param {string} [options.transformersModel] - Transformers.js model
     * @param {string} [options.transformersPrompt] - Prompt for Transformers.js
     * @param {Object} [options.transformersOptions] - Generation options (max_new_tokens, etc.)
     * @param {Function} [options.fallback] - Fallback function returning string
     * @param {Function} [options.onProgress] - Download progress: function(pct)
     * @param {Function} [options.onStatus] - Status messages: function(msg)
     * @param {Function} [options.qualityCheck] - Validate output: function(text) -> boolean
     * @returns {Promise<{text: string, source: string}>}
     */
    generate: function(options) {
      return generateInternal(options);
    },

    /**
     * Summarize text using Chrome Summarizer or Transformers.js.
     *
     * @param {string} text - Text to summarize
     * @param {Object} [options]
     * @param {string} [options.type] - 'tl;dr', 'key-points', 'teaser', 'headline'
     * @param {string} [options.length] - 'short', 'medium', 'long'
     * @param {string} [options.format] - 'plain-text', 'markdown'
     * @param {string} [options.model] - Override Transformers.js model
     * @param {number} [options.maxTokens] - Max tokens for generation
     * @param {Function} [options.onProgress] - Download progress callback
     * @param {Function} [options.onStatus] - Status message callback
     * @returns {Promise<{text: string, source: string}>}
     */
    summarize: function(text, options) {
      return summarizeInternal(text, options);
    },

    /**
     * Rewrite text using Chrome Rewriter or Transformers.js.
     *
     * @param {string} text - Text to rewrite
     * @param {Object} [options]
     * @param {string} [options.tone] - 'as-is', 'more-formal', 'more-casual'
     * @param {string} [options.length] - 'as-is', 'shorter', 'longer'
     * @param {string} [options.format] - 'as-is', 'plain-text', 'markdown'
     * @param {string} [options.model] - Override Transformers.js model
     * @param {number} [options.maxTokens] - Max tokens for generation
     * @param {Function} [options.onProgress] - Download progress callback
     * @param {Function} [options.onStatus] - Status message callback
     * @returns {Promise<{text: string, source: string}>}
     */
    rewrite: function(text, options) {
      return rewriteInternal(text, options);
    },

    /**
     * Get status of all tracked models.
     * @returns {Promise<Array<{name, task, size, downloadDate, lastUsed}>>}
     */
    getModelStatus: function() {
      return getAllModelRecords();
    },

    /**
     * Check if a specific model has been downloaded before.
     * @param {string} modelName - e.g., 'Xenova/flan-t5-base'
     * @returns {Promise<boolean>}
     */
    isModelCached: async function(modelName) {
      var record = await getModelRecord(modelName);
      return !!record;
    },

    /**
     * Remove a model's tracking record.
     * Note: This removes the IndexedDB record only. Browser Cache API
     * (used by Transformers.js) must be cleared separately by the user.
     * @param {string} modelName
     */
    clearModel: async function(modelName) {
      var key = null;
      // Remove from pipeline cache
      for (var k in pipelineCache) {
        if (k.indexOf(modelName) !== -1) {
          key = k;
          break;
        }
      }
      if (key) delete pipelineCache[key];

      // Remove from IndexedDB
      await deleteModelRecord(modelName);
      log('Model record cleared:', modelName);
    },

    /**
     * Clear all model tracking records and pipeline cache.
     */
    clearAllModels: async function() {
      pipelineCache = {};
      await clearAllModelRecords();
      log('All model records cleared');
    }
  };

  /* =========================================
     AUTO-INITIALIZE (non-blocking)
     ========================================= */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      TeamzAI.init();
    });
  } else {
    TeamzAI.init();
  }

})();
