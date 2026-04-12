/*!
 * TeamzGame — Central Game Engine / Addiction Layer
 * -----------------------------------------------------
 * Shared engine for all games under tool.teamzlab.com/games/.
 * Provides: microcopy, near-miss flash, daily streaks + shields, midnight
 * countdown, ghost rank percentile, celebrate animation, confetti,
 * achievements, endowed progress, adaptive difficulty, and synthesized sound.
 *
 * Browser-only. No external deps. Uses CSS variables from base.css.
 * All state persisted under localStorage key prefix `tzgame_*`.
 *
 * Usage:
 *   TeamzGame.init('my-game', { enableSound: true });
 *   TeamzGame.endowedProgress('my-game');
 *   TeamzGame.celebrate(el, { score: 1200, personalBest: true, stars: 3 })
 *     .then(showButtons);
 */
var TeamzGame = (function () {
  'use strict';

  var _initialized = false;
  var _stylesInjected = false;
  var _currentGame = null;
  var _options = {};
  var _audioCtx = null;
  var _reduceMotion = false;

  // ---------- internals ----------
  function _key(name) { return 'tzgame_' + name; }

  function _getJSON(k, fallback) {
    try {
      var raw = localStorage.getItem(k);
      if (raw === null || raw === undefined) return fallback;
      var v = JSON.parse(raw);
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }

  function _setJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  function _todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function _daysBetween(a, b) {
    var da = new Date(a), db = new Date(b);
    da.setHours(0, 0, 0, 0); db.setHours(0, 0, 0, 0);
    return Math.round((db - da) / 86400000);
  }

  function _hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  function _prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    var css = [
      '.tzg-overlay{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:tzg-fade-in 220ms ease-out;}',
      '.tzg-near-miss{background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:18px;padding:32px 28px;max-width:420px;width:calc(100% - 32px);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:tzg-pop-in 280ms cubic-bezier(.2,1.2,.4,1);}',
      '.tzg-near-miss h2{font-size:28px;line-height:1.2;margin:0 0 8px;color:var(--heading);}',
      '.tzg-near-miss p{margin:0 0 20px;color:var(--text-muted);font-size:16px;}',
      '.tzg-near-miss button{background:var(--accent);color:var(--accent-text);border:none;padding:14px 28px;border-radius:999px;font-weight:700;font-size:16px;cursor:pointer;transition:transform .15s ease;}',
      '.tzg-near-miss button:hover{transform:translateY(-1px);}',
      '.tzg-achievement{position:fixed;top:20px;right:20px;width:280px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:12px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,0.25);z-index:99999;display:flex;align-items:center;gap:12px;transform:translateX(320px);transition:transform 360ms cubic-bezier(.2,1.2,.4,1);}',
      '.tzg-achievement.tzg-show{transform:translateX(0);}',
      '.tzg-achievement-icon{font-size:24px;flex:0 0 auto;}',
      '.tzg-achievement-body{flex:1;min-width:0;}',
      '.tzg-achievement-title{font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:0 0 2px;}',
      '.tzg-achievement-label{font-size:15px;font-weight:600;color:var(--heading);line-height:1.3;margin:0;}',
      '.tzg-streak{display:inline-flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:6px 14px;font-size:14px;font-weight:600;color:var(--heading);}',
      '.tzg-streak .tzg-streak-sep{opacity:.35;}',
      '.tzg-countdown{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:var(--text-muted);}',
      '.tzg-countdown strong{color:var(--heading);}',
      '.tzg-confetti-layer{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:99997;}',
      '.tzg-confetti-piece{position:absolute;width:10px;height:14px;border-radius:2px;will-change:transform,opacity;}',
      '.tzg-celebrate{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:28px 16px;text-align:center;}',
      '.tzg-celebrate-title{font-size:clamp(28px,6vw,44px);font-weight:800;color:var(--heading);letter-spacing:-.02em;line-height:1.15;transform:scale(0);animation:tzg-title-in 420ms cubic-bezier(.2,1.3,.3,1) forwards;}',
      '.tzg-celebrate-stars{display:flex;gap:10px;font-size:36px;}',
      '.tzg-celebrate-star{opacity:0;transform:scale(0);animation:tzg-star-pop 360ms cubic-bezier(.2,1.5,.3,1) forwards;}',
      '.tzg-celebrate-score{font-size:clamp(40px,10vw,72px);font-weight:900;color:var(--accent);line-height:1;font-variant-numeric:tabular-nums;}',
      '.tzg-celebrate-best{background:var(--accent);color:var(--accent-text);border-radius:999px;padding:8px 18px;font-weight:700;font-size:14px;letter-spacing:.04em;text-transform:uppercase;animation:tzg-pop-in 320ms cubic-bezier(.2,1.3,.3,1);}',
      '.tzg-sound-toggle{position:fixed;top:14px;right:14px;width:38px;height:38px;border-radius:50%;background:var(--surface);border:1px solid var(--border);color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;z-index:50;transition:transform .15s ease;}',
      '.tzg-sound-toggle:hover{transform:scale(1.08);}',
      '@keyframes tzg-fade-in{from{opacity:0;}to{opacity:1;}}',
      '@keyframes tzg-pop-in{from{opacity:0;transform:scale(.85);}to{opacity:1;transform:scale(1);}}',
      '@keyframes tzg-title-in{0%{transform:scale(0);opacity:0;}60%{transform:scale(1.2);opacity:1;}100%{transform:scale(1);opacity:1;}}',
      '@keyframes tzg-star-pop{0%{transform:scale(0);opacity:0;}70%{transform:scale(1.3);opacity:1;}100%{transform:scale(1);opacity:1;}}',
      '@media (prefers-reduced-motion: reduce){.tzg-overlay,.tzg-near-miss,.tzg-achievement,.tzg-celebrate-title,.tzg-celebrate-star,.tzg-celebrate-best{animation:none !important;transition:none !important;transform:none !important;opacity:1 !important;}}'
    ].join('\n');
    var el = document.createElement('style');
    el.setAttribute('data-tzgame', '1');
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }

  function _ensureInit() {
    if (!_initialized) {
      _injectStyles();
      _reduceMotion = _prefersReducedMotion();
      _initialized = true;
    }
  }

  // ---------- achievements header badge ----------
  function _renderHeaderCount() {
    // Optional: inject a small achievement count near sound toggle if container exists.
    // Kept minimal — games can call listAchievements() themselves.
  }

  // ---------- sound ----------
  function _getAudio() {
    if (_audioCtx) return _audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      _audioCtx = new Ctx();
    } catch (e) { _audioCtx = null; }
    return _audioCtx;
  }

  function _soundOn() {
    return _getJSON(_key('sound'), false) === true;
  }

  function _playTone(freqStart, freqEnd, duration, type, gain) {
    var ctx = _getAudio();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), ctx.currentTime + duration / 1000);
      }
      g.gain.setValueAtTime(gain || 0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
      osc.connect(g); g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000 + 0.02);
    } catch (e) {}
  }

  function _playChord(freqs, duration) {
    var ctx = _getAudio();
    if (!ctx) return;
    for (var i = 0; i < freqs.length; i++) {
      (function (f, idx) {
        setTimeout(function () { _playTone(f, f, duration, 'sine', 0.10); }, idx * 80);
      })(freqs[i], i);
    }
  }

  var sound = {
    isOn: function () { return _soundOn(); },
    toggle: function () {
      var cur = _soundOn();
      _setJSON(_key('sound'), !cur);
      _updateSoundToggleUI();
      return !cur;
    },
    play: function (name) {
      if (!_soundOn()) return;
      switch (name) {
        case 'pop':     _playTone(400, 200, 80, 'sine', 0.12); break;
        case 'correct': _playTone(600, 800, 120, 'sine', 0.14); break;
        case 'wrong':   _playTone(200, 100, 150, 'square', 0.10); break;
        case 'win':     _playChord([523.25, 659.25, 783.99], 400); break;
        case 'tick':    _playTone(1200, 1200, 30, 'square', 0.06); break;
        default:
          if (name && name.indexOf('streak') === 0) {
            var n = parseInt(name.replace('streak', ''), 10) || 1;
            _playTone(400 + 100 * n, 400 + 100 * n, 140, 'sine', 0.13);
          }
      }
    }
  };

  function _updateSoundToggleUI() {
    var btn = document.querySelector('.tzg-sound-toggle');
    if (btn) btn.textContent = _soundOn() ? '🔊' : '🔇';
  }

  function _mountSoundToggle() {
    if (document.querySelector('.tzg-sound-toggle')) return;
    var btn = document.createElement('button');
    btn.className = 'tzg-sound-toggle';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.type = 'button';
    btn.textContent = _soundOn() ? '🔊' : '🔇';
    btn.addEventListener('click', function () {
      sound.toggle();
      if (_soundOn()) sound.play('pop');
    });
    document.body.appendChild(btn);
  }

  // ---------- microcopy ----------
  var CORRECT_POOL = ['Sharp!', '🔥 On fire', 'Locked in', 'Impressive', 'Smooth', 'Yes!', 'Clean'];
  var NEAR_MISS_POOL = ['So close!', 'Agonizing!', 'One more try...'];

  function microcopy(event) {
    switch (event) {
      case 'correct':
        if (Math.random() < 0.4) {
          return CORRECT_POOL[Math.floor(Math.random() * CORRECT_POOL.length)];
        }
        return '';
      case 'streak3':   return '🔥 Streak: 3!';
      case 'streak5':   return '⚡ 5 in a row!';
      case 'streak10':  return '💎 DIAMOND STREAK x10';
      case 'nearMiss':  return NEAR_MISS_POOL[Math.floor(Math.random() * NEAR_MISS_POOL.length)];
      case 'comeback':  return 'COMEBACK! 💪';
      default:          return '';
    }
  }

  // ---------- near-miss ----------
  function nearMiss(ctx) {
    _ensureInit();
    ctx = ctx || {};
    var isNearMiss = false;
    if (typeof ctx.correctNeeded === 'number' && typeof ctx.correctHave === 'number') {
      if (ctx.correctNeeded - ctx.correctHave === 1) isNearMiss = true;
    }
    if (typeof ctx.wrongThreshold === 'number' && typeof ctx.wrongCount === 'number') {
      if (ctx.wrongCount === ctx.wrongThreshold) isNearMiss = true;
    }
    if (!isNearMiss) return false;

    var overlay = document.createElement('div');
    overlay.className = 'tzg-overlay';
    var modal = document.createElement('div');
    modal.className = 'tzg-near-miss';
    var have = (typeof ctx.correctHave === 'number') ? ctx.correctHave : (ctx.finalResult || 0);
    var need = (typeof ctx.correctNeeded === 'number') ? ctx.correctNeeded : (have + 1);
    var title = document.createElement('h2');
    title.textContent = 'SO CLOSE!';
    var sub = document.createElement('p');
    sub.textContent = have + '/' + need + ' — one more try?';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Play Again';
    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      close();
      if (typeof ctx.onRetry === 'function') ctx.onRetry();
    });
    overlay.addEventListener('click', close);
    modal.addEventListener('click', function (e) { e.stopPropagation(); });
    modal.appendChild(title); modal.appendChild(sub); modal.appendChild(btn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(close, 4000);
    return true;
  }

  // ---------- streaks ----------
  function recordStreak(gameSlug) {
    _ensureInit();
    var slug = gameSlug || _currentGame || 'default';
    var k = _key('streak_' + slug);
    var state = _getJSON(k, { count: 0, lastDate: null, shields: 0, best: 0 });
    var today = _todayStr();
    var shieldUsed = false;
    var isNewRecord = false;

    if (state.lastDate === today) {
      // already recorded today
      return { count: state.count, shields: state.shields, shieldUsed: false, isNewRecord: false };
    }

    if (state.lastDate === null) {
      state.count = 1;
    } else {
      var diff = _daysBetween(state.lastDate, today);
      if (diff === 1) {
        state.count += 1;
      } else if (diff > 1) {
        if (state.shields > 0) {
          state.shields -= 1;
          shieldUsed = true;
          state.count += 1; // shield preserves streak
        } else {
          state.count = 1;
        }
      } else {
        // diff <= 0 (clock skew) — treat as same day
        return { count: state.count, shields: state.shields, shieldUsed: false, isNewRecord: false };
      }
    }

    state.lastDate = today;

    // Shield grant: every 3 consecutive days, max 2 shields
    if (state.count > 0 && state.count % 3 === 0 && state.shields < 2) {
      state.shields += 1;
    }

    if (state.count > (state.best || 0)) {
      state.best = state.count;
      isNewRecord = true;
    }

    _setJSON(k, state);
    return { count: state.count, shields: state.shields, shieldUsed: shieldUsed, isNewRecord: isNewRecord };
  }

  function renderStreakBadge(container) {
    _ensureInit();
    if (!container) return;
    var slug = _currentGame || 'default';
    var state = _getJSON(_key('streak_' + slug), { count: 0, shields: 0 });
    var html = '<span class="tzg-streak">'
      + '🔥 Streak: ' + (state.count || 0)
      + (state.shields ? ' <span class="tzg-streak-sep">·</span> 🛡️ ' + state.shields + ' shield' + (state.shields > 1 ? 's' : '') : '')
      + '</span>';
    container.innerHTML = html;
  }

  // ---------- midnight countdown ----------
  function countdownToMidnight(container) {
    _ensureInit();
    if (!container) return;
    var interval = null;
    function tick() {
      if (!document.body.contains(container)) {
        if (interval) clearInterval(interval);
        return;
      }
      var now = new Date();
      var mid = new Date(now);
      mid.setHours(24, 0, 0, 0);
      var diff = Math.max(0, mid - now);
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      container.className = 'tzg-countdown';
      container.innerHTML = 'Next daily in <strong>' + h + 'h ' + m + 'm ' + s + 's</strong>';
    }
    tick();
    interval = setInterval(tick, 1000);
    window.addEventListener('pagehide', function () { if (interval) clearInterval(interval); }, { once: true });
    return function () { if (interval) clearInterval(interval); };
  }

  // ---------- ghost rank ----------
  function ghostRank(score, gameSlug) {
    var slug = gameSlug || _currentGame || 'default';
    var seed = _hash(String(score) + '|' + slug + '|' + _todayStr());
    // Map seed to 0-1
    var base = (seed % 10000) / 10000;
    // Bias: higher score → better percentile (lower number)
    var scoreFactor = Math.min(1, Math.max(0, (score || 0) / 2000));
    var raw = base * (1 - scoreFactor * 0.7);
    var pct = Math.round(5 + raw * 80); // 5..85
    if (pct < 5) pct = 5; if (pct > 85) pct = 85;
    return "You're in the top " + pct + "% of today's players";
  }

  // ---------- celebrate ----------
  function _easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function celebrate(container, opts) {
    _ensureInit();
    opts = opts || {};
    return new Promise(function (resolve) {
      if (!container) { resolve(); return; }
      var score = typeof opts.score === 'number' ? opts.score : 0;
      var title = opts.title || 'LEVEL COMPLETE';
      var stars = Math.max(0, Math.min(5, opts.stars || 0));
      var personalBest = !!opts.personalBest;

      container.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.className = 'tzg-celebrate';

      var titleEl = document.createElement('div');
      titleEl.className = 'tzg-celebrate-title';
      titleEl.textContent = title;
      wrap.appendChild(titleEl);

      var starsEl = null;
      if (stars > 0) {
        starsEl = document.createElement('div');
        starsEl.className = 'tzg-celebrate-stars';
        for (var i = 0; i < stars; i++) {
          var s = document.createElement('span');
          s.className = 'tzg-celebrate-star';
          s.textContent = '⭐';
          s.style.animationDelay = (400 + i * 150) + 'ms';
          starsEl.appendChild(s);
        }
        wrap.appendChild(starsEl);
      }

      var scoreEl = document.createElement('div');
      scoreEl.className = 'tzg-celebrate-score';
      scoreEl.textContent = '0';
      wrap.appendChild(scoreEl);

      var bestEl = null;
      if (personalBest) {
        bestEl = document.createElement('div');
        bestEl.className = 'tzg-celebrate-best';
        bestEl.textContent = 'NEW BEST!';
        bestEl.style.opacity = '0';
        wrap.appendChild(bestEl);
      }

      container.appendChild(wrap);

      if (_soundOn()) sound.play('win');

      var phase3Start = 1000;
      var phase3Dur = 1000;
      var startTime = performance.now();

      function frame(now) {
        var t = now - startTime;
        if (t >= phase3Start) {
          var p = Math.min(1, (t - phase3Start) / phase3Dur);
          var eased = _easeOutExpo(p);
          var display = Math.floor(score * eased);
          scoreEl.textContent = String(display);
          if (p >= 1) {
            scoreEl.textContent = String(score);
            if (personalBest && bestEl) {
              bestEl.style.opacity = '1';
              confetti({ count: 50, duration: 2200 });
            }
            setTimeout(resolve, 400);
            return;
          }
        }
        requestAnimationFrame(frame);
      }

      if (_reduceMotion) {
        scoreEl.textContent = String(score);
        if (personalBest && bestEl) bestEl.style.opacity = '1';
        setTimeout(resolve, 100);
      } else {
        requestAnimationFrame(frame);
      }
    });
  }

  // ---------- confetti ----------
  function confetti(opts) {
    _ensureInit();
    if (_reduceMotion) return;
    opts = opts || {};
    var count = opts.count || 40;
    var duration = opts.duration || 2500;
    var originY = typeof opts.originY === 'number' ? opts.originY : 0;

    var layer = document.createElement('div');
    layer.className = 'tzg-confetti-layer';
    document.body.appendChild(layer);

    // Use CSS-var driven colors: accent, heading, text
    var colorVars = ['var(--accent)', 'var(--heading)', 'var(--text)', 'var(--accent)', 'var(--border)'];

    var pieces = [];
    var w = window.innerWidth;
    var h = window.innerHeight;

    for (var i = 0; i < count; i++) {
      var el = document.createElement('div');
      el.className = 'tzg-confetti-piece';
      var color = colorVars[i % colorVars.length];
      el.style.background = color;
      layer.appendChild(el);
      pieces.push({
        el: el,
        x: Math.random() * w,
        y: originY * h - Math.random() * 40,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        life: 1
      });
    }

    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      var done = elapsed >= duration;
      for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed / duration);
        p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.rot + 'deg)';
        p.el.style.opacity = String(p.life);
      }
      if (!done && layer.parentNode) {
        requestAnimationFrame(tick);
      } else {
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- achievements ----------
  function grantAchievement(id, label, gameSlug) {
    _ensureInit();
    if (!id) return false;
    var list = _getJSON(_key('achievements'), []);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return false; // already have it
    }
    var entry = {
      id: id,
      label: label || id,
      game: gameSlug || _currentGame || null,
      earnedAt: Date.now()
    };
    list.push(entry);
    _setJSON(_key('achievements'), list);
    _showAchievementToast(entry);
    if (_soundOn()) sound.play('win');
    return true;
  }

  function _showAchievementToast(entry) {
    var el = document.createElement('div');
    el.className = 'tzg-achievement';
    el.innerHTML = '<div class="tzg-achievement-icon">🏅</div>'
      + '<div class="tzg-achievement-body">'
      + '<p class="tzg-achievement-title">Unlocked</p>'
      + '<p class="tzg-achievement-label"></p>'
      + '</div>';
    el.querySelector('.tzg-achievement-label').textContent = entry.label;
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('tzg-show'); });
    });
    setTimeout(function () {
      el.classList.remove('tzg-show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, 3000);
  }

  function listAchievements() {
    return _getJSON(_key('achievements'), []);
  }

  // ---------- endowed progress ----------
  function endowedProgress(gameSlug) {
    _ensureInit();
    var slug = gameSlug || _currentGame || 'default';
    var k = _key('visited_' + slug);
    var visited = _getJSON(k, false);
    if (visited) return { isFirstVisit: false };
    _setJSON(k, true);
    grantAchievement('getting-started-' + slug, 'Getting Started 🌱', slug);
    return { isFirstVisit: true, message: 'You unlocked level 2!' };
  }

  // ---------- adaptive difficulty ----------
  function adaptiveDifficulty(gameSlug, lastRoundCorrect, lastRoundTotal) {
    _ensureInit();
    var slug = gameSlug || _currentGame || 'default';
    var k = _key('skill_' + slug);
    var state = _getJSON(k, { rounds: [] });

    if (typeof lastRoundCorrect === 'number' && typeof lastRoundTotal === 'number' && lastRoundTotal > 0) {
      var pct = lastRoundCorrect / lastRoundTotal;
      state.rounds.push(pct);
      if (state.rounds.length > 10) state.rounds = state.rounds.slice(-10);
      _setJSON(k, state);
    }

    var recent = state.rounds.slice(-3);
    if (recent.length < 3) return 'easy';

    var hardCount = 0, mediumCount = 0;
    for (var i = 0; i < recent.length; i++) {
      if (recent[i] >= 0.9) hardCount++;
      else if (recent[i] >= 0.5) mediumCount++;
    }
    if (hardCount >= 3) return 'hard';
    if (hardCount + mediumCount >= 3) return 'medium';
    return 'easy';
  }

  // ---------- init ----------
  function init(gameSlug, options) {
    _ensureInit();
    _currentGame = gameSlug || 'default';
    _options = options || {};

    if (_options.enableSound) {
      // Mount sound toggle once DOM is ready.
      if (document.body) {
        _mountSoundToggle();
      } else {
        document.addEventListener('DOMContentLoaded', _mountSoundToggle);
      }
    }
    _renderHeaderCount();
    return { gameSlug: _currentGame };
  }

  // ---------- public API ----------
  return {
    init: init,
    microcopy: microcopy,
    nearMiss: nearMiss,
    recordStreak: recordStreak,
    renderStreakBadge: renderStreakBadge,
    countdownToMidnight: countdownToMidnight,
    ghostRank: ghostRank,
    celebrate: celebrate,
    confetti: confetti,
    grantAchievement: grantAchievement,
    listAchievements: listAchievements,
    endowedProgress: endowedProgress,
    adaptiveDifficulty: adaptiveDifficulty,
    sound: sound
  };
})();

if (typeof window !== 'undefined') {
  window.TeamzGame = TeamzGame;
}
