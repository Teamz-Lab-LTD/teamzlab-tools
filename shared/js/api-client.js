/**
 * TeamzAPI — Centralized API Client
 * All external API calls across the site route through here.
 *
 * Usage:
 *   var result = await TeamzAPI.call('quotes15', url, { tool: 'quote-generator' });
 *   var data = result.data; // result.fromCache === true if served from cache
 *
 * Debug (browser console):
 *   TeamzAPI.status()           — show all API health at a glance
 *   TeamzAPI.log()              — show last 50 events
 *   TeamzAPI.clearBackoff('quotes15')  — reset backoff after fixing an issue
 *   TeamzAPI.clearAll()         — reset all status/logs (fresh start)
 */

window.TeamzAPI = (function () {

  /* ============================================================
     API REGISTRY — add every external API the site uses here
     ============================================================ */
  var REGISTRY = {

    /* ---------- RapidAPI ---------- */
    'quotes15': {
      name: 'Quotes15',
      host: 'quotes15.p.rapidapi.com',
      key: 'd44d321dacmshed0968b153fd15fp145327jsne2ec00671ac7',
      keyHeader: 'X-RapidAPI-Key',
      cacheTTL: 3600000,   // 1 hour
      backoffMs: 600000    // 10 min after 429
    },

    /* ---------- Finance ---------- */
    'alpha-vantage': {
      name: 'Alpha Vantage (Stocks)',
      baseUrl: 'https://www.alphavantage.co/query',
      cacheTTL: 300000,    // 5 min — stock prices change fast
      backoffMs: 3600000   // 1 hour after rate limit (25 req/day free)
    },
    'exchangerate': {
      name: 'ExchangeRate-API (Currency)',
      cacheTTL: 3600000,   // 1 hour
      backoffMs: 300000
    },
    'coingecko': {
      name: 'CoinGecko (Crypto)',
      cacheTTL: 300000,    // 5 min
      backoffMs: 600000
    },
    'gold-api': {
      name: 'Gold Price API',
      cacheTTL: 3600000,
      backoffMs: 3600000
    },

    /* ---------- Space / Science ---------- */
    'nasa-apod': {
      name: 'NASA APOD',
      cacheTTL: 86400000,  // 24 hours — picture changes once a day
      backoffMs: 3600000
    },
    'spacex': {
      name: 'SpaceX API',
      cacheTTL: 3600000,
      backoffMs: 600000
    },
    'iss': {
      name: 'ISS Location API',
      cacheTTL: 10000,     // 10 sec — ISS moves fast
      backoffMs: 60000
    },

    /* ---------- Knowledge / Data ---------- */
    'wikipedia': {
      name: 'Wikipedia REST API',
      cacheTTL: 86400000,
      backoffMs: 300000
    },
    'crossref': {
      name: 'CrossRef DOI Lookup',
      cacheTTL: 86400000,
      backoffMs: 600000
    },
    'openlibrary': {
      name: 'Open Library (Books)',
      cacheTTL: 86400000,
      backoffMs: 600000
    },
    'us-census': {
      name: 'US Census Demographics',
      cacheTTL: 86400000,
      backoffMs: 3600000
    },
    'zip-lookup': {
      name: 'ZIP Code Lookup API',
      cacheTTL: 86400000,
      backoffMs: 600000
    },
    'agify': {
      name: 'Agify (Name Predictor)',
      cacheTTL: 86400000,
      backoffMs: 600000
    },
    'rest-countries': {
      name: 'REST Countries API',
      cacheTTL: 86400000,
      backoffMs: 600000
    },

    /* ---------- Health / Food ---------- */
    'openfoodfacts': {
      name: 'Open Food Facts (Barcode)',
      cacheTTL: 86400000,
      backoffMs: 600000
    },
    'themealdb': {
      name: 'TheMealDB (Recipes)',
      cacheTTL: 3600000,
      backoffMs: 600000
    },

    /* ---------- Media / Entertainment ---------- */
    'tvmaze': {
      name: 'TVMaze (TV Shows)',
      cacheTTL: 3600000,
      backoffMs: 600000
    },

    /* ---------- Weather ---------- */
    'openweather': {
      name: 'OpenWeatherMap',
      cacheTTL: 1800000,   // 30 min
      backoffMs: 600000
    },

    /* ---------- Geography / World Data ---------- */
    'world-bank': {
      name: 'World Bank API',
      cacheTTL: 86400000,  // 24 hours
      backoffMs: 3600000
    },
    'datausa': {
      name: 'DataUSA (US Census)',
      cacheTTL: 86400000,  // 24 hours
      backoffMs: 3600000
    }
  };

  /* ============================================================
     STORAGE KEYS
     ============================================================ */
  var SK = {
    cache:   function (id, ep) { return 'tapi_c_' + id + '_' + _hash(ep); },
    backoff: function (id)     { return 'tapi_bo_' + id; },
    status:  'tapi_status',
    log:     'tapi_log'
  };

  /* ============================================================
     INTERNAL HELPERS
     ============================================================ */
  function _hash(str) {
    // Simple short hash for cache keys
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
    return Math.abs(h).toString(36).slice(0, 10);
  }

  function _getCache(apiId, url) {
    try {
      var cfg = REGISTRY[apiId] || {};
      var ttl = cfg.cacheTTL || 3600000;
      var raw = localStorage.getItem(SK.cache(apiId, url));
      if (!raw) return null;
      var e = JSON.parse(raw);
      if (Date.now() - e.ts < ttl) return e.data;
    } catch (ex) {}
    return null;
  }

  function _setCache(apiId, url, data) {
    try {
      localStorage.setItem(SK.cache(apiId, url), JSON.stringify({ data: data, ts: Date.now() }));
    } catch (ex) {}
  }

  function _isBackoff(apiId) {
    try {
      var cfg = REGISTRY[apiId] || {};
      var ms = cfg.backoffMs || 600000;
      var t = parseInt(localStorage.getItem(SK.backoff(apiId)) || '0');
      return Date.now() - t < ms;
    } catch (ex) { return false; }
  }

  function _setBackoff(apiId) {
    try { localStorage.setItem(SK.backoff(apiId), Date.now().toString()); } catch (ex) {}
  }

  function _updateStatus(apiId, event, detail) {
    try {
      var s = JSON.parse(localStorage.getItem(SK.status) || '{}');
      if (!s[apiId]) s[apiId] = { calls: 0, errors: 0, cacheHits: 0 };
      s[apiId].lastEvent = event;
      s[apiId].lastTs = new Date().toISOString();
      s[apiId].calls = (s[apiId].calls || 0) + 1;
      if (event === 'success')    { s[apiId].healthy = true; s[apiId].consecutiveErrors = 0; }
      if (event === 'cache_hit')  { s[apiId].cacheHits = (s[apiId].cacheHits || 0) + 1; }
      if (event === 'rate_limit' || event === 'auth_fail' || event === 'server_error' || event === 'offline') {
        s[apiId].healthy = false;
        s[apiId].errors = (s[apiId].errors || 0) + 1;
        s[apiId].consecutiveErrors = (s[apiId].consecutiveErrors || 0) + 1;
        s[apiId].lastError = detail || event;
      }
      localStorage.setItem(SK.status, JSON.stringify(s));
    } catch (ex) {}
  }

  function _writeLog(apiId, event, detail) {
    try {
      var logs = JSON.parse(localStorage.getItem(SK.log) || '[]');
      logs.push({ api: apiId, event: event, ts: new Date().toISOString(), detail: detail || null });
      if (logs.length > 200) logs = logs.slice(-200);
      localStorage.setItem(SK.log, JSON.stringify(logs));
    } catch (ex) {}
  }

  function _ga4(apiId, event, extra) {
    try {
      if (window.gtag) {
        gtag('event', 'api_' + event, Object.assign({ api_id: apiId, api_name: (REGISTRY[apiId] || {}).name || apiId }, extra || {}));
      }
    } catch (ex) {}
  }

  function _track(apiId, event, detail) {
    _updateStatus(apiId, event, detail);
    _writeLog(apiId, event, detail);
    // GA4 — only log errors + rate limits to keep event count low
    if (event !== 'success' && event !== 'cache_hit') {
      _ga4(apiId, event, detail);
    }
    // Always log rate_limit to GA4 — that's the one you care about most
    if (event === 'rate_limit') {
      _ga4(apiId, 'rate_limit_hit', detail);
    }
  }

  function _friendlyError(status, hint) {
    if (status === 401 || status === 403) return 'API key invalid or expired.';
    if (status === 429) return 'Rate limit reached. Tool will retry automatically later.';
    if (status === 404) return hint ? '"' + hint + '" not found. Try a different value.' : 'Resource not found.';
    if (status >= 500) return 'Service temporarily unavailable (' + status + ').';
    return 'Request failed (' + status + ').';
  }

  /* ============================================================
     TeamzAPIError — catchable error type
     ============================================================ */
  function TeamzAPIError(type, message) {
    this.type = type;
    this.message = message;
    this.isTeamzAPIError = true;
  }

  /* ============================================================
     MAIN CALL FUNCTION
     ============================================================ */
  async function call(apiId, url, options) {
    options = options || {};
    var cfg = REGISTRY[apiId] || {};
    var tool = options.tool || 'unknown';
    var useCache = options.cache !== false;

    // 1. Backoff — API was rate-limited recently, skip
    if (_isBackoff(apiId)) {
      _track(apiId, 'backoff_skip', { tool: tool });
      throw new TeamzAPIError('backoff', 'Rate limit active. Using fallback content.');
    }

    // 2. Cache hit — serve without hitting API
    if (useCache) {
      var cached = _getCache(apiId, url);
      if (cached) {
        _track(apiId, 'cache_hit', { tool: tool });
        return { data: cached, fromCache: true };
      }
    }

    // 3. Build request headers
    var headers = Object.assign({}, options.headers || {});
    if (cfg.key && cfg.keyHeader) headers[cfg.keyHeader] = cfg.key;
    if (cfg.host) headers['X-RapidAPI-Host'] = cfg.host;
    if (!headers['Accept']) headers['Accept'] = 'application/json';

    var t0 = Date.now();

    try {
      var resp = await fetch(url, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body || undefined,
        signal: options.signal || undefined
      });

      var latency = Date.now() - t0;

      // 4. Handle HTTP errors
      if (!resp.ok) {
        var errType;
        if (resp.status === 401 || resp.status === 403) errType = 'auth_fail';
        else if (resp.status === 429) { errType = 'rate_limit'; _setBackoff(apiId); }
        else if (resp.status === 404) errType = 'not_found';
        else if (resp.status >= 500) errType = 'server_error';
        else errType = 'http_error';

        _track(apiId, errType, { tool: tool, status: resp.status, latency: latency });
        throw new TeamzAPIError(errType, _friendlyError(resp.status, options.notFoundHint));
      }

      // 5. Parse JSON
      var data;
      try { data = await resp.json(); }
      catch (ex) {
        _track(apiId, 'parse_error', { tool: tool });
        throw new TeamzAPIError('parse_error', 'Unexpected response format.');
      }

      // 6. Cache + log success
      if (useCache) _setCache(apiId, url, data);
      _track(apiId, 'success', { tool: tool, latency: latency });

      return { data: data, fromCache: false };

    } catch (e) {
      if (e.isTeamzAPIError) throw e;
      // Network / offline error
      var msg = e.message || '';
      if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) {
        _track(apiId, 'offline', { tool: tool });
        throw new TeamzAPIError('offline', 'No internet connection. Check your network.');
      }
      _track(apiId, 'unknown_error', { tool: tool, message: msg });
      throw new TeamzAPIError('unknown', msg || 'Unknown error.');
    }
  }

  /* ============================================================
     STATUS DASHBOARD — run TeamzAPI.status() in console
     ============================================================ */
  function status() {
    try {
      var s = JSON.parse(localStorage.getItem(SK.status) || '{}');
      var apiIds = Object.keys(s);
      if (apiIds.length === 0) { console.log('TeamzAPI: no calls recorded yet.'); return s; }

      console.group('%cTeamzAPI Status Dashboard', 'font-weight:bold;font-size:14px');
      apiIds.forEach(function (id) {
        var a = s[id];
        var name = (REGISTRY[id] || {}).name || id;
        var icon = a.healthy === false ? '❌' : a.healthy === true ? '✅' : '⚪';
        var backoff = _isBackoff(id) ? ' 🚫 BACKOFF ACTIVE' : '';
        console.log(
          icon + ' ' + name + backoff +
          '\n   Calls: ' + (a.calls || 0) +
          ' | Cache hits: ' + (a.cacheHits || 0) +
          ' | Errors: ' + (a.errors || 0) +
          ' | Last: ' + a.lastEvent +
          ' @ ' + (a.lastTs || 'never') +
          (a.lastError ? '\n   Last error: ' + JSON.stringify(a.lastError) : '')
        );
      });
      console.groupEnd();
      return s;
    } catch (ex) { console.error('TeamzAPI.status() error:', ex); }
  }

  /* ============================================================
     LOG — show recent events
     ============================================================ */
  function log(n) {
    try {
      var logs = JSON.parse(localStorage.getItem(SK.log) || '[]');
      var recent = logs.slice(-(n || 20));
      console.group('%cTeamzAPI Log (last ' + recent.length + ' events)', 'font-weight:bold');
      recent.forEach(function (e) {
        var icon = e.event === 'success' ? '✅' : e.event === 'cache_hit' ? '💾' : e.event === 'rate_limit' ? '🚫' : '❌';
        console.log(icon + ' [' + e.api + '] ' + e.event + ' @ ' + e.ts, e.detail || '');
      });
      console.groupEnd();
      return recent;
    } catch (ex) {}
  }

  /* ============================================================
     MANAGEMENT HELPERS
     ============================================================ */
  function clearBackoff(apiId) {
    try {
      localStorage.removeItem(SK.backoff(apiId));
      var s = JSON.parse(localStorage.getItem(SK.status) || '{}');
      if (s[apiId]) { s[apiId].healthy = true; s[apiId].consecutiveErrors = 0; }
      localStorage.setItem(SK.status, JSON.stringify(s));
      console.log('TeamzAPI: backoff cleared for', apiId);
    } catch (ex) {}
  }

  function clearAll() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.startsWith('tapi_')) localStorage.removeItem(k);
      });
      console.log('TeamzAPI: all status, logs and cache cleared.');
    } catch (ex) {}
  }

  function clearCache(apiId) {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.startsWith('tapi_c_' + apiId + '_')) localStorage.removeItem(k);
      });
      console.log('TeamzAPI: cache cleared for', apiId);
    } catch (ex) {}
  }

  /* ============================================================
     PUBLIC INTERFACE
     ============================================================ */
  return {
    call: call,
    status: status,
    log: log,
    clearBackoff: clearBackoff,
    clearCache: clearCache,
    clearAll: clearAll,
    Error: TeamzAPIError,
    registry: REGISTRY  // read-only access to see registered APIs
  };

}());
