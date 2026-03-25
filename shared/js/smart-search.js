/**
 * Smart Search Engine — Teamz Lab Tools
 *
 * Features:
 * 1. Synonym/concept mapping (photo↔image, money↔finance, etc.)
 * 2. Fuzzy matching for typos (Levenshtein distance ≤2)
 * 3. Basic word stemming (calculators→calculator)
 * 4. Weighted scoring (title > description > URL > synonym)
 * 5. AI-powered fallback via Chrome AI when static search fails
 * 6. Category/hub awareness for broad queries
 * 7. Tag-based concept expansion
 */
(function () {
  'use strict';

  /* =========================================
     SYNONYM / CONCEPT MAP
     Maps common user terms to tool-index terms
     ========================================= */
  var SYNONYMS = {
    // Photography & Images
    photo: ['image', 'picture', 'pic', 'photograph', 'snapshot', 'selfie'],
    image: ['photo', 'picture', 'pic', 'photograph', 'png', 'jpg', 'jpeg', 'webp'],
    picture: ['photo', 'image', 'pic', 'photograph'],
    resize: ['compress', 'shrink', 'reduce', 'scale', 'crop', 'smaller', 'optimize'],
    compress: ['resize', 'shrink', 'reduce', 'smaller', 'optimize', 'minify'],
    crop: ['trim', 'cut', 'resize', 'clip'],
    background: ['bg', 'backdrop', 'wallpaper'],
    remove: ['delete', 'erase', 'strip', 'clear', 'clean'],

    // Finance & Money
    money: ['finance', 'financial', 'cash', 'currency', 'dollar', 'payment', 'budget', 'income', 'salary', 'wage'],
    finance: ['money', 'financial', 'budget', 'investment', 'banking', 'loan', 'mortgage', 'tax', 'income'],
    budget: ['finance', 'money', 'expense', 'spending', 'savings', 'planner'],
    tax: ['taxation', 'income tax', 'vat', 'gst', 'duty', 'deduction', 'refund'],
    salary: ['wage', 'pay', 'income', 'earnings', 'compensation', 'paycheck', 'payroll'],
    loan: ['mortgage', 'emi', 'debt', 'borrow', 'interest', 'repayment', 'amortization'],
    mortgage: ['loan', 'home loan', 'housing', 'emi', 'property', 'interest'],
    invest: ['investment', 'stock', 'mutual fund', 'portfolio', 'returns', 'compound interest', 'sip'],
    investment: ['invest', 'stock', 'returns', 'portfolio', 'compound', 'sip', 'mutual fund'],
    retirement: ['pension', 'superannuation', '401k', 'ira', 'epf', 'ppf', 'savings'],
    pension: ['retirement', 'superannuation', '401k', 'ira', 'provident fund'],
    tip: ['gratuity', 'service charge', 'restaurant'],
    invoice: ['bill', 'receipt', 'billing', 'payment'],
    receipt: ['invoice', 'bill', 'proof of purchase'],

    // Health & Fitness
    health: ['fitness', 'wellness', 'medical', 'body', 'diet', 'nutrition', 'exercise', 'weight', 'bmi'],
    fitness: ['health', 'exercise', 'workout', 'gym', 'training', 'body', 'weight'],
    weight: ['body weight', 'mass', 'bmi', 'obesity', 'fat', 'pounds', 'kilograms', 'kg', 'lbs'],
    bmi: ['body mass index', 'weight', 'obesity', 'health', 'overweight'],
    calorie: ['calories', 'kcal', 'nutrition', 'diet', 'food', 'energy', 'intake', 'burn', 'tdee'],
    diet: ['nutrition', 'calorie', 'food', 'meal', 'eating', 'macros', 'protein'],
    exercise: ['workout', 'fitness', 'gym', 'training', 'cardio', 'strength', 'running'],
    pregnancy: ['pregnant', 'baby', 'due date', 'trimester', 'maternity', 'conception', 'ovulation'],
    sleep: ['insomnia', 'bedtime', 'rest', 'nap', 'circadian'],

    // Development & Code
    code: ['coding', 'programming', 'developer', 'dev', 'software', 'script'],
    developer: ['dev', 'programmer', 'coding', 'software', 'engineer'],
    json: ['javascript', 'api', 'data', 'parse', 'format', 'validate'],
    format: ['formatter', 'beautify', 'prettify', 'indent', 'minify', 'lint'],
    convert: ['converter', 'transform', 'translate', 'change', 'switch', 'encode', 'decode'],
    converter: ['convert', 'transformer', 'translator'],
    encode: ['encoding', 'encrypt', 'hash', 'base64', 'url encode'],
    decode: ['decoding', 'decrypt', 'base64', 'url decode'],
    generate: ['generator', 'create', 'make', 'build', 'produce'],
    generator: ['generate', 'creator', 'maker', 'builder'],
    validate: ['validator', 'check', 'verify', 'lint', 'test'],
    regex: ['regular expression', 'pattern', 'regexp', 'match'],
    api: ['endpoint', 'webhook', 'rest', 'json', 'request', 'response'],
    git: ['github', 'version control', 'repository', 'commit', 'branch'],
    css: ['style', 'stylesheet', 'design', 'layout', 'flexbox', 'grid'],
    html: ['webpage', 'markup', 'web', 'dom', 'element', 'tag'],

    // Text & Writing
    text: ['string', 'content', 'words', 'writing', 'paragraph', 'sentence'],
    write: ['writing', 'writer', 'compose', 'draft', 'author', 'create'],
    grammar: ['spelling', 'punctuation', 'proofread', 'language', 'english'],
    translate: ['translation', 'translator', 'language', 'convert'],
    summarize: ['summary', 'summarizer', 'tldr', 'digest', 'shorten', 'condense'],
    count: ['counter', 'word count', 'character count', 'length', 'tally'],

    // Design & Color
    color: ['colour', 'hex', 'rgb', 'hsl', 'palette', 'shade', 'tint', 'gradient'],
    palette: ['color scheme', 'theme', 'swatch', 'colors', 'combination'],
    font: ['typography', 'typeface', 'text style', 'lettering'],
    icon: ['emoji', 'symbol', 'glyph', 'favicon'],
    logo: ['brand', 'branding', 'icon', 'emblem', 'mark'],
    design: ['ui', 'ux', 'layout', 'visual', 'graphic', 'mockup', 'wireframe'],

    // Math & Calculation
    calculate: ['calculator', 'compute', 'math', 'formula', 'solve'],
    calculator: ['calculate', 'compute', 'math', 'tool'],
    math: ['mathematics', 'arithmetic', 'algebra', 'geometry', 'calculation'],
    percentage: ['percent', 'ratio', 'fraction', 'proportion'],
    average: ['mean', 'median', 'mode', 'statistics'],
    random: ['generate', 'dice', 'coin', 'shuffle', 'lottery', 'picker', 'spin'],

    // Date & Time
    date: ['calendar', 'day', 'month', 'year', 'schedule', 'deadline'],
    time: ['clock', 'timer', 'stopwatch', 'countdown', 'duration', 'hours', 'minutes'],
    age: ['birthday', 'birth date', 'years old', 'born'],
    countdown: ['timer', 'days until', 'remaining', 'deadline', 'event'],
    timezone: ['time zone', 'utc', 'gmt', 'convert time', 'world clock'],

    // SEO & Marketing
    seo: ['search engine', 'google', 'ranking', 'keyword', 'meta', 'sitemap', 'robots'],
    keyword: ['seo', 'search term', 'query', 'phrase', 'tag'],
    analytics: ['tracking', 'metrics', 'statistics', 'data', 'report', 'google analytics'],
    social: ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'share', 'post'],

    // Legal & Business
    legal: ['law', 'contract', 'agreement', 'terms', 'policy', 'privacy', 'nda', 'disclaimer'],
    contract: ['agreement', 'legal', 'nda', 'terms', 'document'],
    business: ['company', 'startup', 'enterprise', 'corporate', 'organization'],
    resume: ['cv', 'curriculum vitae', 'job application', 'career', 'ats'],

    // Video & Audio
    video: ['mp4', 'mov', 'avi', 'clip', 'film', 'movie', 'record', 'stream'],
    audio: ['sound', 'music', 'mp3', 'wav', 'voice', 'podcast', 'recording'],
    youtube: ['video', 'thumbnail', 'channel', 'subscribe'],

    // PDF & Documents
    pdf: ['document', 'acrobat', 'portable document', 'file'],
    document: ['pdf', 'doc', 'file', 'paper', 'report', 'template'],

    // Unit & Measurement
    unit: ['measurement', 'convert', 'metric', 'imperial'],
    length: ['distance', 'height', 'width', 'meters', 'feet', 'inches', 'centimeters', 'miles', 'kilometers'],
    weight: ['mass', 'kg', 'lbs', 'pounds', 'kilograms', 'grams', 'ounces'],
    temperature: ['celsius', 'fahrenheit', 'kelvin', 'degrees', 'heat', 'cold'],
    speed: ['velocity', 'mph', 'kmh', 'knots', 'pace'],
    area: ['square', 'acres', 'hectares', 'sqft', 'square feet', 'square meters'],
    volume: ['liters', 'gallons', 'cups', 'ml', 'fluid', 'capacity'],

    // Everyday / Misc
    password: ['passphrase', 'pin', 'security', 'login', 'credential', 'strong password'],
    qr: ['qr code', 'barcode', 'scan', 'quick response'],
    wifi: ['wireless', 'network', 'internet', 'connection', 'hotspot'],
    email: ['mail', 'e-mail', 'message', 'inbox', 'smtp', 'gmail'],
    download: ['save', 'export', 'get', 'fetch'],
    upload: ['import', 'attach', 'send', 'file'],
    free: ['no cost', 'gratis', 'open', 'zero cost'],
    private: ['privacy', 'secure', 'anonymous', 'no tracking', 'offline', 'local'],
    ai: ['artificial intelligence', 'machine learning', 'ml', 'smart', 'intelligent', 'gpt', 'chatgpt', 'claude'],

    // Food & Cooking
    recipe: ['cooking', 'baking', 'food', 'meal', 'ingredients', 'kitchen'],
    cooking: ['recipe', 'baking', 'food', 'chef', 'kitchen', 'meal prep'],
    coffee: ['espresso', 'latte', 'cappuccino', 'brew', 'caffeine', 'barista'],
    tea: ['brew', 'steep', 'herbal', 'matcha', 'chai'],
    baking: ['cake', 'bread', 'pastry', 'oven', 'flour', 'recipe'],

    // Real Estate & Property
    rent: ['rental', 'lease', 'tenant', 'landlord', 'apartment', 'housing'],
    property: ['real estate', 'house', 'home', 'apartment', 'land', 'building'],

    // Travel
    travel: ['trip', 'vacation', 'holiday', 'flight', 'hotel', 'booking', 'tourism'],
    flight: ['airplane', 'airline', 'airport', 'flying', 'travel', 'booking'],

    // Games & Fun
    game: ['play', 'gaming', 'puzzle', 'quiz', 'trivia', 'fun', 'entertainment'],
    quiz: ['trivia', 'test', 'question', 'game', 'challenge'],
    meme: ['funny', 'humor', 'joke', 'viral', 'image macro'],

    // Accessibility
    accessibility: ['a11y', 'wcag', 'ada', 'screen reader', 'disability', 'inclusive'],

    // 3D & Printing
    '3d': ['three dimensional', 'model', 'stl', 'obj', 'gltf', 'mesh', 'print'],
    print: ['printing', 'printer', 'paper', 'document', 'hard copy'],

    // Crypto
    crypto: ['cryptocurrency', 'bitcoin', 'ethereum', 'blockchain', 'web3', 'defi', 'token'],
    bitcoin: ['btc', 'crypto', 'cryptocurrency', 'blockchain', 'mining'],

    // Network & Security
    network: ['ip', 'subnet', 'dns', 'tcp', 'server', 'port', 'ping', 'traceroute'],
    security: ['password', 'encrypt', 'hash', 'ssl', 'tls', 'firewall', 'vulnerability'],
    ip: ['ip address', 'network', 'subnet', 'ipv4', 'ipv6', 'cidr'],

    // Music
    music: ['audio', 'song', 'melody', 'beat', 'rhythm', 'bpm', 'tempo', 'note', 'chord'],
    bpm: ['tempo', 'beat', 'rhythm', 'speed', 'music'],

    // Country-specific
    uk: ['united kingdom', 'british', 'england', 'gbp', 'pound', 'nhs', 'hmrc', 'paye'],
    usa: ['united states', 'american', 'us', 'usd', 'federal', 'irs'],
    india: ['indian', 'inr', 'rupee', 'gst', 'epf', 'pan'],
    bangladesh: ['bangla', 'bangladeshi', 'bdt', 'taka', 'bd'],
    uae: ['emirates', 'dubai', 'abu dhabi', 'aed', 'dirham'],
    canada: ['canadian', 'cad', 'rrsp', 'tfsa'],
    australia: ['australian', 'aud', 'super', 'superannuation'],
    germany: ['german', 'deutsch', 'eur', 'euro'],
    japan: ['japanese', 'jpy', 'yen'],

    // Common natural-language phrases mapped to tool concepts
    smaller: ['compress', 'resize', 'reduce', 'shrink', 'minify'],
    bigger: ['enlarge', 'upscale', 'resize', 'expand', 'zoom'],
    faster: ['optimize', 'speed', 'performance', 'compress', 'minify'],
    compare: ['comparison', 'versus', 'vs', 'diff', 'difference'],
    check: ['validate', 'verify', 'test', 'inspect', 'audit', 'scan'],
    fix: ['repair', 'correct', 'solve', 'debug', 'troubleshoot'],
    make: ['create', 'generate', 'build', 'produce', 'design'],
    track: ['tracker', 'monitor', 'log', 'record', 'history'],
    plan: ['planner', 'schedule', 'organize', 'manage', 'strategy'],
    share: ['sharing', 'send', 'distribute', 'post', 'social'],
    learn: ['education', 'study', 'tutorial', 'course', 'teaching', 'school'],
    kids: ['children', 'child', 'kid', 'school', 'student', 'young', 'youth'],
    baby: ['infant', 'newborn', 'child', 'toddler', 'pregnancy', 'name'],
    pet: ['dog', 'cat', 'animal', 'puppy', 'kitten', 'vet'],
    car: ['vehicle', 'automobile', 'auto', 'driving', 'fuel', 'gas', 'mileage'],
    home: ['house', 'household', 'domestic', 'interior', 'room', 'furniture'],
    birthday: ['birth', 'age', 'party', 'celebration', 'greeting', 'wish', 'invitation'],
    wedding: ['marriage', 'bride', 'groom', 'ceremony', 'engagement', 'ring'],
    holiday: ['vacation', 'festival', 'celebration', 'eid', 'christmas', 'easter', 'diwali'],
    eid: ['ramadan', 'islamic', 'muslim', 'celebration', 'festival', 'mubarak'],
    christmas: ['xmas', 'holiday', 'santa', 'gift', 'december'],
    military: ['army', 'navy', 'armed forces', 'soldier', 'defense', 'rank']
  };

  /* =========================================
     CONCEPT TAGS — broad queries to categories
     ========================================= */
  var CONCEPT_TAGS = {
    'make something look nice': ['design', 'color', 'palette', 'font', 'gradient', 'mockup'],
    'edit my photo': ['image', 'resize', 'compress', 'crop', 'background', 'filter'],
    'write better': ['grammar', 'rewrite', 'humanize', 'proofread', 'tone', 'email'],
    'save money': ['budget', 'savings', 'expense', 'discount', 'compare', 'calculator'],
    'get a job': ['resume', 'cv', 'cover letter', 'interview', 'career', 'ats'],
    'start business': ['business plan', 'invoice', 'receipt', 'llc', 'startup', 'swot'],
    'stay healthy': ['bmi', 'calorie', 'exercise', 'diet', 'sleep', 'water', 'fitness'],
    'learn coding': ['html', 'css', 'json', 'regex', 'git', 'developer', 'code'],
    'protect privacy': ['password', 'encrypt', 'hash', 'private', 'vpn', 'security'],
    'plan event': ['countdown', 'invitation', 'party', 'wedding', 'birthday', 'schedule']
  };

  /* =========================================
     STEMMING — very basic suffix stripping
     ========================================= */
  var SUFFIX_RULES = [
    [/ies$/i, 'y'],        // batteries → battery
    [/ves$/i, 'fe'],       // knives → knife
    [/ses$/i, 'se'],       // analyses → analyse
    [/ing$/i, ''],         // converting → convert
    [/tion$/i, 't'],       // calculation → calculat (close enough for matching)
    [/ment$/i, ''],        // measurement → measure
    [/ness$/i, ''],        // darkness → dark
    [/ers$/i, 'er'],       // calculators → calculator (via ers→er)
    [/ors$/i, 'or'],       // generators → generator
    [/s$/i, '']            // calculators → calculator
  ];

  function stem(word) {
    if (word.length < 4) return word;
    var w = word.toLowerCase();
    for (var i = 0; i < SUFFIX_RULES.length; i++) {
      var rule = SUFFIX_RULES[i];
      if (rule[0].test(w)) {
        var stemmed = w.replace(rule[0], rule[1]);
        if (stemmed.length >= 3) return stemmed;
      }
    }
    return w;
  }

  /* =========================================
     FUZZY MATCHING — Levenshtein distance
     ========================================= */
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    // Skip if lengths differ too much (optimization)
    if (Math.abs(a.length - b.length) > 2) return 3;

    var matrix = [];
    for (var i = 0; i <= b.length; i++) matrix[i] = [i];
    for (var j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
        // Early exit if distance already too high
        if (i === j && matrix[i][j] > 2) return 3;
      }
    }
    return matrix[b.length][a.length];
  }

  /* =========================================
     EXPAND QUERY — synonyms + stemming
     ========================================= */
  function expandQuery(words) {
    var expanded = {};
    words.forEach(function (w) {
      expanded[w] = true;
      expanded[stem(w)] = true;

      // Add synonyms
      var syns = SYNONYMS[w];
      if (syns) {
        syns.forEach(function (s) { expanded[s] = true; });
      }
      // Also check stemmed form
      var stemmed = stem(w);
      var stemSyns = SYNONYMS[stemmed];
      if (stemSyns) {
        stemSyns.forEach(function (s) { expanded[s] = true; });
      }
    });
    return Object.keys(expanded);
  }

  /* =========================================
     SCORE A SINGLE TOOL against query
     ========================================= */
  function scoreTool(tool, originalWords, expandedWords) {
    var title = (tool.t || '').toLowerCase();
    var desc = (tool.d || '').toLowerCase();
    var href = (tool.h || '').toLowerCase();
    var haystack = title + ' ' + desc + ' ' + href;
    var score = 0;

    // Phase 1: Original words — exact matches (highest weight)
    var allOriginalFound = true;
    originalWords.forEach(function (w) {
      if (title.indexOf(w) !== -1) {
        score += 15; // Title exact match
        if (title.indexOf(w) === 0 || title.indexOf(' ' + w) !== -1) score += 5; // Word boundary bonus
      } else if (href.indexOf(w) !== -1) {
        score += 10; // URL/slug match (strong signal)
      } else if (desc.indexOf(w) !== -1) {
        score += 5; // Description match
      } else {
        allOriginalFound = false;
      }
    });

    // Bonus: all original words found (high relevance)
    if (allOriginalFound && originalWords.length > 0) score += 20;

    // Phase 2: Expanded words (synonyms/stems) — lower weight
    expandedWords.forEach(function (w) {
      // Skip if it's an original word (already scored)
      if (originalWords.indexOf(w) !== -1) return;
      if (title.indexOf(w) !== -1) {
        score += 6;
      } else if (href.indexOf(w) !== -1) {
        score += 4;
      } else if (desc.indexOf(w) !== -1) {
        score += 2;
      }
    });

    // Phase 3: Fuzzy matching on title words (catches typos)
    if (score === 0 && originalWords.length > 0) {
      var titleWords = title.split(/[\s\-—\/&,]+/).filter(function(tw) { return tw.length > 2; });
      originalWords.forEach(function (w) {
        if (w.length < 3) return;
        for (var i = 0; i < titleWords.length; i++) {
          var dist = levenshtein(w, titleWords[i]);
          if (dist === 1) { score += 8; break; }
          if (dist === 2 && w.length > 4) { score += 4; break; }
        }
      });
      // Also fuzzy on slug
      var slugWords = href.replace(/\//g, ' ').split(/[\s\-]+/).filter(function(sw) { return sw.length > 2; });
      originalWords.forEach(function (w) {
        if (w.length < 3) return;
        for (var i = 0; i < slugWords.length; i++) {
          var dist = levenshtein(w, slugWords[i]);
          if (dist === 1) { score += 5; break; }
        }
      });
    }

    // Phase 4: Multi-word phrase matching (e.g., "pdf to jpg")
    if (originalWords.length >= 2) {
      var phrase = originalWords.join(' ');
      if (title.indexOf(phrase) !== -1) score += 25;
      else if (href.indexOf(originalWords.join('-')) !== -1) score += 20;
      else if (desc.indexOf(phrase) !== -1) score += 10;
    }

    // Phase 5: Hub page boost (category matches are important for broad queries)
    if (href.match(/^\/[^/]+\/$/)) {
      // This is a hub page — give a small boost if ANY word matches
      if (score > 0) score += 3;
    }

    return score;
  }

  /* =========================================
     MAIN SEARCH FUNCTION
     ========================================= */
  function smartSearch(query, searchPool, maxResults) {
    maxResults = maxResults || 15;
    if (!query || query.length < 2) return [];

    var words = query.toLowerCase().trim().split(/\s+/).filter(function (w) { return w.length > 0; });
    if (words.length === 0) return [];

    var expandedWords = expandQuery(words);

    // Score all tools
    var scored = [];
    for (var i = 0; i < searchPool.length; i++) {
      var s = scoreTool(searchPool[i], words, expandedWords);
      if (s > 0) {
        scored.push({ tool: searchPool[i], score: s });
      }
    }

    // Sort by score descending
    scored.sort(function (a, b) { return b.score - a.score; });

    // Return top results
    return scored.slice(0, maxResults).map(function (item) {
      return { t: item.tool.t, d: item.tool.d, h: item.tool.h, score: item.score, source: 'static' };
    });
  }

  /* =========================================
     AI-POWERED SEARCH FALLBACK (3-tier)
     Tier 1: Chrome AI Prompt API (instant, local)
     Tier 2: Transformers.js text2text (all browsers)
     Tier 3: Concept tag matching (rule-based)
     ========================================= */
  var _aiSearchAbort = null;

  function buildHubContext(searchPool) {
    var toolSamples = {};
    searchPool.forEach(function (t) {
      var parts = (t.h || '').split('/').filter(Boolean);
      if (parts.length >= 1) {
        var hub = parts[0];
        if (!toolSamples[hub]) toolSamples[hub] = [];
        if (toolSamples[hub].length < 5) toolSamples[hub].push(t.t);
      }
    });
    var lines = [];
    for (var hub in toolSamples) {
      lines.push(hub + ': ' + toolSamples[hub].join(', '));
    }
    return lines.slice(0, 30).join('\n');
  }

  var AI_SYSTEM_PROMPT = 'You are a search assistant for a tools website with 1400+ free browser-based tools. Given a user query, output 5-10 search keywords (single words or short phrases, comma-separated) that would match tools in our index. Think about synonyms, related concepts, what the user likely means, and alternative ways to describe what they want. Output ONLY the keywords, nothing else.';

  function buildUserPrompt(query, hubContext) {
    return 'User searched for: "' + query + '"\n\nOur tool categories:\n' + hubContext + '\n\nOutput comma-separated keywords to find matching tools:';
  }

  function parseAIKeywords(response) {
    return response.split(/[,\n]+/).map(function (k) {
      return k.trim().toLowerCase().replace(/[^a-z0-9\s\-]/g, '');
    }).filter(function (k) { return k.length > 1 && k.length < 40; });
  }

  function searchWithKeywords(keywords, searchPool, maxResults) {
    var results = [];
    var seen = {};
    keywords.forEach(function (kw) {
      var kwWords = kw.split(/\s+/);
      var expanded = expandQuery(kwWords);
      for (var i = 0; i < searchPool.length; i++) {
        var tool = searchPool[i];
        if (seen[tool.h]) continue;
        var haystack = ((tool.t || '') + ' ' + (tool.d || '') + ' ' + (tool.h || '')).toLowerCase();
        var matchCount = 0;
        expanded.forEach(function (ew) {
          if (haystack.indexOf(ew) !== -1) matchCount++;
        });
        if (matchCount >= 1) {
          seen[tool.h] = true;
          results.push({ t: tool.t, d: tool.d, h: tool.h, score: matchCount * 3, source: 'ai' });
        }
      }
    });
    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, maxResults);
  }

  async function aiSearch(query, searchPool, maxResults, onResults) {
    maxResults = maxResults || 12;
    var hubContext = buildHubContext(searchPool);
    var userPrompt = buildUserPrompt(query, hubContext);

    /* ---- Tier 1: Chrome AI Prompt API ---- */
    try {
      var hasChromeAI = false;
      if (window.TeamzAI && window.TeamzAI.chromeAI && window.TeamzAI.chromeAI.prompt) {
        hasChromeAI = true;
      } else if (window.ai && window.ai.languageModel) {
        var caps = await window.ai.languageModel.capabilities();
        if (caps && caps.available !== 'no') hasChromeAI = true;
      }

      if (hasChromeAI) {
        var session = await window.ai.languageModel.create({ systemPrompt: AI_SYSTEM_PROMPT });
        var response = await session.prompt(userPrompt);
        session.destroy();
        var keywords = parseAIKeywords(response);
        if (keywords.length > 0) {
          var results = searchWithKeywords(keywords, searchPool, maxResults);
          if (results.length > 0) { onResults(results, 'ai'); return; }
        }
      }
    } catch (e) {
      console.warn('[SmartSearch] Chrome AI fallback failed:', e);
    }

    /* ---- Tier 2: Transformers.js (flan-t5-base) ---- */
    try {
      if (window.TeamzAI) {
        await window.TeamzAI.init();
        var result = await window.TeamzAI.generate({
          // Skip Chrome AI (already tried above)
          chromePrompt: null,
          transformersTask: 'text2text-generation',
          transformersModel: 'Xenova/flan-t5-base',
          transformersPrompt: 'List search keywords related to: ' + query + '. Output comma-separated keywords:',
          transformersOptions: { max_new_tokens: 60, num_beams: 2 },
          fallback: null,
          onStatus: function () {}
        });
        if (result && result.text) {
          var tfKeywords = parseAIKeywords(result.text);
          if (tfKeywords.length > 0) {
            var tfResults = searchWithKeywords(tfKeywords, searchPool, maxResults);
            if (tfResults.length > 0) { onResults(tfResults, 'ai'); return; }
          }
        }
      }
    } catch (e) {
      console.warn('[SmartSearch] Transformers.js fallback failed:', e);
    }

    /* ---- Tier 3: Concept tag matching (rule-based) ---- */
    var conceptResults = conceptTagSearch(query, searchPool, maxResults);
    if (conceptResults.length > 0) onResults(conceptResults, 'concept');
  }

  /* =========================================
     CONCEPT TAG SEARCH — rule-based fallback
     for natural language queries
     ========================================= */
  function conceptTagSearch(query, searchPool, maxResults) {
    var q = query.toLowerCase();
    var matchedConcepts = [];

    for (var phrase in CONCEPT_TAGS) {
      // Check if query words overlap with concept phrase
      var phraseWords = phrase.split(/\s+/);
      var queryWords = q.split(/\s+/);
      var overlap = 0;
      queryWords.forEach(function (qw) {
        phraseWords.forEach(function (pw) {
          if (qw === pw || pw.indexOf(qw) !== -1 || qw.indexOf(pw) !== -1) overlap++;
        });
      });
      if (overlap >= 1) {
        matchedConcepts = matchedConcepts.concat(CONCEPT_TAGS[phrase]);
      }
    }

    if (matchedConcepts.length === 0) return [];

    // Search with concept keywords
    var results = [];
    var seen = {};
    matchedConcepts.forEach(function (keyword) {
      for (var i = 0; i < searchPool.length; i++) {
        var tool = searchPool[i];
        if (seen[tool.h]) continue;
        var haystack = ((tool.t || '') + ' ' + (tool.d || '') + ' ' + (tool.h || '')).toLowerCase();
        if (haystack.indexOf(keyword) !== -1) {
          seen[tool.h] = true;
          results.push({ t: tool.t, d: tool.d, h: tool.h, score: 1, source: 'concept' });
        }
      }
    });

    return results.slice(0, maxResults);
  }

  /* =========================================
     "DID YOU MEAN" — suggest corrections
     ========================================= */
  function getDidYouMean(query, searchPool) {
    var words = query.toLowerCase().split(/\s+/);
    if (words.length !== 1 || words[0].length < 3) return null;
    var w = words[0];

    // Collect unique words from tool titles
    var titleWords = {};
    searchPool.forEach(function (t) {
      (t.t || '').toLowerCase().split(/[\s\-—\/&,]+/).forEach(function (tw) {
        if (tw.length > 2) titleWords[tw] = true;
      });
    });

    var best = null;
    var bestDist = 3;
    for (var tw in titleWords) {
      if (tw === w) return null; // Exact match exists
      var dist = levenshtein(w, tw);
      if (dist < bestDist) {
        bestDist = dist;
        best = tw;
      }
    }

    return (best && bestDist <= 2) ? best : null;
  }

  /* =========================================
     PUBLIC API
     ========================================= */
  window.TeamzSearch = {
    search: smartSearch,
    aiSearch: aiSearch,
    expand: expandQuery,
    stem: stem,
    didYouMean: getDidYouMean,
    SYNONYMS: SYNONYMS,
    CONCEPT_TAGS: CONCEPT_TAGS
  };
})();
