/**
 * Interview Practice Simulator — Core Engines
 * Timer, Scoring, Session Manager, Progress Tracker, Badges, Role Detection
 */
    /* ========================================================================
     * ROLE DETECTION
     * ======================================================================== */
    function detectRoleCategory(role) {
      if (!role) return 'general';
      var r = role.toLowerCase();
      if (/engineer|developer|programmer|coder|devops|sre|architect|fullstack|frontend|backend|software|qa|sdet|data engineer/i.test(r)) return 'developer';
      if (/designer|ux|ui|graphic|visual|product design|interaction/i.test(r)) return 'designer';
      if (/product manager|product owner|pm|program manager|scrum master|project manager/i.test(r)) return 'pm';
      if (/market|growth|seo|content|brand|digital market|social media|pr |public relations|communications/i.test(r)) return 'marketing';
      if (/sales|account exec|business develop|revenue|sdr|bdr|account manager|customer success/i.test(r)) return 'sales';
      if (/hr|human resource|recruiter|talent|people ops|people operations|compensation|benefits/i.test(r)) return 'hr';
      if (/finance|accounting|cfo|controller|treasurer|analyst.*finance|financial/i.test(r)) return 'finance';
      return 'general';
    }

    /* ========================================================================
     * FLATTEN QUESTIONS HELPER
     * ======================================================================== */
    function getAllQuestions() {
      var all = [];
      Object.keys(QUESTION_BANK).forEach(function(type) {
        Object.keys(QUESTION_BANK[type]).forEach(function(sub) {
          QUESTION_BANK[type][sub].forEach(function(q) {
            all.push({ type: type, sub: sub, id: q.id, q: q.q, f: q.f, c: q.c, d: q.d });
          });
        });
      });
      return all;
    }

    /* ========================================================================
     * TIMER ENGINE
     * ======================================================================== */
    var Timer = {
      seconds: 0,
      totalSeconds: 0,
      interval: null,
      running: false,
      onTick: null,
      onExpire: null,
      start: function(total) {
        this.stop();
        this.totalSeconds = total;
        this.seconds = total;
        this.running = true;
        if (total <= 0) {
          // No time limit — count up
          this.seconds = 0;
          var self = this;
          this.interval = setInterval(function() {
            self.seconds++;
            if (self.onTick) self.onTick(self.seconds, 0);
          }, 1000);
          return;
        }
        var self = this;
        this.interval = setInterval(function() {
          self.seconds--;
          var pct = ((self.totalSeconds - self.seconds) / self.totalSeconds) * 100;
          if (self.onTick) self.onTick(self.seconds, pct);
          if (self.seconds <= 0) {
            self.stop();
            if (self.onExpire) self.onExpire();
          }
        }, 1000);
      },
      stop: function() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
        this.running = false;
      },
      pause: function() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
      },
      resume: function() {
        if (!this.running || this.interval) return;
        var self = this;
        if (this.totalSeconds <= 0) {
          this.interval = setInterval(function() {
            self.seconds++;
            if (self.onTick) self.onTick(self.seconds, 0);
          }, 1000);
        } else {
          this.interval = setInterval(function() {
            self.seconds--;
            var pct = ((self.totalSeconds - self.seconds) / self.totalSeconds) * 100;
            if (self.onTick) self.onTick(self.seconds, pct);
            if (self.seconds <= 0) {
              self.stop();
              if (self.onExpire) self.onExpire();
            }
          }, 1000);
        }
      },
      getElapsed: function() {
        if (this.totalSeconds <= 0) return this.seconds;
        return this.totalSeconds - this.seconds;
      },
      getDisplay: function(secs) {
        var s = (typeof secs === 'number') ? secs : this.seconds;
        if (s < 0) s = 0;
        var m = Math.floor(s / 60);
        var sec = s % 60;
        return m + ':' + (sec < 10 ? '0' : '') + sec;
      }
    };

    /* ========================================================================
     * SCORING ENGINE
     * ======================================================================== */
    var Scoring = {
      scoreAnswer: function(answer, question) {
        var s = {};
        s.structure = this.scoreSTAR(answer);
        s.length = this.scoreLength(answer);
        s.specificity = this.scoreSpecificity(answer);
        s.relevance = this.scoreRelevance(answer, question);
        s.total = s.structure + s.length + s.specificity + s.relevance;
        return s;
      },
      scoreSTAR: function(answer) {
        var a = answer.toLowerCase();
        var score = 0;
        var starKeywords = {
          situation: ['situation', 'context', 'background', 'when i was', 'at my previous', 'in my role', 'working at', 'our team was', 'the company'],
          task: ['task', 'responsibility', 'my role was', 'i was responsible', 'i was asked', 'i needed to', 'the goal was', 'my objective', 'assigned to'],
          action: ['action', 'i decided', 'i implemented', 'i created', 'i built', 'i led', 'i organized', 'i developed', 'i initiated', 'i proposed', 'i analyzed', 'steps i took', 'my approach'],
          result: ['result', 'outcome', 'as a result', 'this led to', 'we achieved', 'the impact', 'increased by', 'decreased by', 'reduced', 'improved', 'saved', 'generated', 'delivered']
        };
        var found = 0;
        Object.keys(starKeywords).forEach(function(part) {
          for (var i = 0; i < starKeywords[part].length; i++) {
            if (a.indexOf(starKeywords[part][i]) >= 0) { found++; break; }
          }
        });
        score = Math.min(25, Math.round((found / 4) * 25));
        // Bonus for explicit STAR labels
        if (/\bsituation\b/i.test(a) && /\btask\b/i.test(a) && /\baction\b/i.test(a) && /\bresult\b/i.test(a)) {
          score = 25;
        }
        return score;
      },
      scoreLength: function(answer) {
        var words = answer.trim().split(/\s+/).length;
        if (words < 20) return 2;
        if (words < 50) return 8;
        if (words < 80) return 15;
        if (words >= 80 && words <= 300) return 25;
        if (words <= 400) return 20;
        if (words <= 500) return 15;
        return 10;
      },
      scoreSpecificity: function(answer) {
        var score = 0;
        var a = answer.toLowerCase();
        // First person pronouns
        var firstPerson = (a.match(/\b(i|my|me|we|our)\b/g) || []).length;
        score += Math.min(8, firstPerson * 1);
        // Numbers and percentages
        var numbers = (a.match(/\d+/g) || []).length;
        score += Math.min(8, numbers * 2);
        // Specific words (concrete details)
        var specifics = ['specifically', 'for example', 'such as', 'in particular', 'precisely', 'exactly', 'approximately', 'about', 'roughly', 'nearly'];
        specifics.forEach(function(w) {
          if (a.indexOf(w) >= 0) score += 1;
        });
        // Named entities (capital words that arent sentence starters)
        var caps = (answer.match(/\s[A-Z][a-z]+/g) || []).length;
        score += Math.min(4, caps);
        return Math.min(25, score);
      },
      scoreRelevance: function(answer, question) {
        var qWords = question.q.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(function(w) {
          return w.length > 3 && ['what','when','where','that','this','with','from','your','have','does','about','tell','describe','give','example','time','would'].indexOf(w) < 0;
        });
        if (qWords.length === 0) return 15;
        var aLower = answer.toLowerCase();
        var matches = 0;
        qWords.forEach(function(w) {
          if (aLower.indexOf(w) >= 0) matches++;
        });
        var ratio = matches / qWords.length;
        return Math.min(25, Math.round(ratio * 25));
      },
      getGrade: function(score) {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'A-';
        if (score >= 80) return 'B+';
        if (score >= 75) return 'B';
        if (score >= 70) return 'B-';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        if (score >= 55) return 'C-';
        if (score >= 50) return 'D+';
        if (score >= 45) return 'D';
        return 'F';
      },
      getLabel: function(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 55) return 'Needs Work';
        return 'Weak';
      }
    };

    /* ========================================================================
     * SESSION MANAGER
     * ======================================================================== */
    var SessionManager = {
      current: null,
      create: function(config) {
        var type = config.type;
        var level = config.level;
        var role = config.role;
        var difficulty = parseInt(config.difficulty) || 2;
        var count = parseInt(config.questionCount) || 5;
        var timePerQ = parseInt(config.timePerQuestion) || 120;
        var roleCat = detectRoleCategory(role);

        // Collect candidate questions
        var candidates = [];
        var bank = QUESTION_BANK[type];
        if (!bank) bank = QUESTION_BANK.behavioral;

        // For types with level sub-keys
        if (bank[level]) {
          bank[level].forEach(function(q) { candidates.push(q); });
        }
        // For types with role sub-keys
        if (bank[roleCat]) {
          bank[roleCat].forEach(function(q) { candidates.push(q); });
        }
        // For types with general sub-key
        if (bank.general) {
          bank.general.forEach(function(q) { candidates.push(q); });
        }

        // If not enough, pull from adjacent levels and behavioral
        if (candidates.length < count) {
          var allLevels = ['junior', 'mid', 'senior', 'lead'];
          allLevels.forEach(function(lv) {
            if (bank[lv] && lv !== level) {
              bank[lv].forEach(function(q) { candidates.push(q); });
            }
          });
        }
        if (candidates.length < count) {
          // Pull from behavioral as fallback
          var beh = QUESTION_BANK.behavioral;
          Object.keys(beh).forEach(function(lv) {
            beh[lv].forEach(function(q) { candidates.push(q); });
          });
        }

        // Remove duplicates
        var seen = {};
        candidates = candidates.filter(function(q) {
          if (seen[q.id]) return false;
          seen[q.id] = true;
          return true;
        });

        // Filter by difficulty preference (allow +-1)
        var filtered = candidates.filter(function(q) {
          return Math.abs(q.d - difficulty) <= 1;
        });
        if (filtered.length < count) filtered = candidates;

        // Shuffle
        for (var i = filtered.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = filtered[i]; filtered[i] = filtered[j]; filtered[j] = temp;
        }

        var questions = filtered.slice(0, count);
        this.current = {
          config: config,
          type: type,
          level: level,
          role: role,
          company: config.company || '',
          industry: config.industry || '',
          difficulty: difficulty,
          timePerQuestion: timePerQ,
          questions: questions,
          answers: [],
          currentIndex: 0,
          startTime: Date.now(),
          endTime: null,
          totalScore: 0
        };
        return this.current;
      },
      getNextQuestion: function() {
        if (!this.current) return null;
        if (this.current.currentIndex >= this.current.questions.length) return null;
        return this.current.questions[this.current.currentIndex];
      },
      submitAnswer: function(answer, confidence, timeSpent) {
        if (!this.current) return null;
        var q = this.current.questions[this.current.currentIndex];
        var scores = Scoring.scoreAnswer(answer, q);
        var entry = {
          questionId: q.id,
          question: q.q,
          competency: q.c,
          answer: answer,
          confidence: confidence,
          timeSpent: timeSpent,
          scores: scores,
          skipped: false
        };
        this.current.answers.push(entry);
        this.current.currentIndex++;
        return entry;
      },
      skip: function() {
        if (!this.current) return;
        var q = this.current.questions[this.current.currentIndex];
        this.current.answers.push({
          questionId: q.id,
          question: q.q,
          competency: q.c,
          answer: '',
          confidence: 0,
          timeSpent: 0,
          scores: { structure: 0, length: 0, specificity: 0, relevance: 0, total: 0 },
          skipped: true
        });
        this.current.currentIndex++;
      },
      end: function() {
        if (!this.current) return null;
        this.current.endTime = Date.now();
        var answered = this.current.answers.filter(function(a) { return !a.skipped; });
        if (answered.length > 0) {
          var sum = 0;
          answered.forEach(function(a) { sum += a.scores.total; });
          this.current.totalScore = Math.round(sum / answered.length);
        }
        return this.current;
      },
      getProgress: function() {
        if (!this.current) return { current: 0, total: 0, pct: 0 };
        return {
          current: this.current.currentIndex + 1,
          total: this.current.questions.length,
          pct: Math.round(((this.current.currentIndex) / this.current.questions.length) * 100)
        };
      }
    };

    /* ========================================================================
     * PROGRESS TRACKER (localStorage)
     * ======================================================================== */
    var Progress = {
      STORAGE_KEY: 'tz_ims_sessions',
      BOOKMARK_KEY: 'tz_ims_bookmarks',
      data: null,
      load: function() {
        try {
          var raw = localStorage.getItem(this.STORAGE_KEY);
          this.data = raw ? JSON.parse(raw) : this.defaultData();
        } catch(e) {
          this.data = this.defaultData();
        }
      },
      defaultData: function() {
        return {
          totalSessions: 0,
          totalQuestions: 0,
          totalScore: 0,
          bestScore: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastPracticeDate: null,
          practiceDates: [],
          typesCompleted: [],
          competencyScores: {},
          quickAnswers: 0,
          starMasterCount: 0,
          earnedBadges: [],
          sessions: []
        };
      },
      save: function() {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch(e) {}
      },
      addSession: function(session) {
        var d = this.data;
        d.totalSessions++;
        var answered = session.answers.filter(function(a) { return !a.skipped; });
        d.totalQuestions += answered.length;

        if (session.totalScore > d.bestScore) d.bestScore = session.totalScore;

        var today = new Date().toISOString().split('T')[0];
        if (d.practiceDates.indexOf(today) < 0) d.practiceDates.push(today);
        d.lastPracticeDate = today;

        // Types completed
        if (d.typesCompleted.indexOf(session.type) < 0) d.typesCompleted.push(session.type);

        // Competency scores
        answered.forEach(function(a) {
          var c = a.competency;
          if (!d.competencyScores[c]) d.competencyScores[c] = { total: 0, count: 0 };
          d.competencyScores[c].total += a.scores.total;
          d.competencyScores[c].count++;

          // Quick answers (under 60s)
          if (a.timeSpent < 60 && a.timeSpent > 0) d.quickAnswers++;
          // STAR master (structure >= 23)
          if (a.scores.structure >= 23) d.starMasterCount++;
        });

        // Streak
        this.updateStreak();

        // Save session summary
        d.sessions.push({
          date: today,
          type: session.type,
          score: session.totalScore,
          questions: session.questions.length,
          answered: answered.length
        });
        if (d.sessions.length > 100) d.sessions = d.sessions.slice(-100);

        this.save();
      },
      updateStreak: function() {
        var dates = this.data.practiceDates.sort();
        if (dates.length === 0) return;
        var today = new Date();
        today.setHours(0,0,0,0);
        var yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        var lastDate = new Date(dates[dates.length - 1]);
        lastDate.setHours(0,0,0,0);

        if (lastDate.getTime() !== today.getTime() && lastDate.getTime() !== yesterday.getTime()) {
          this.data.currentStreak = (lastDate.getTime() === today.getTime()) ? 1 : 0;
        }

        // Count streak backwards from today
        var streak = 0;
        var check = new Date(today);
        for (var i = 0; i < 365; i++) {
          var ds = check.toISOString().split('T')[0];
          if (dates.indexOf(ds) >= 0) {
            streak++;
          } else if (i > 0) {
            break;
          }
          check.setDate(check.getDate() - 1);
        }
        this.data.currentStreak = streak;
        if (streak > this.data.longestStreak) this.data.longestStreak = streak;
      },
      getStats: function() {
        var d = this.data;
        var avgScore = d.totalSessions > 0 ? Math.round(d.totalQuestions > 0 ? d.sessions.reduce(function(s, sess) { return s + sess.score; }, 0) / d.sessions.length : 0) : 0;
        return {
          totalSessions: d.totalSessions,
          totalQuestions: d.totalQuestions,
          avgScore: avgScore,
          bestScore: d.bestScore,
          currentStreak: d.currentStreak,
          longestStreak: d.longestStreak,
          typesCompleted: d.typesCompleted,
          competencyScores: d.competencyScores,
          quickAnswers: d.quickAnswers,
          starMasterCount: d.starMasterCount,
          earnedBadges: d.earnedBadges,
          bookmarkCount: this.getBookmarks().length,
          practiceDates: d.practiceDates
        };
      },
      toggleBookmark: function(questionId) {
        var bookmarks = this.getBookmarks();
        var idx = bookmarks.indexOf(questionId);
        if (idx >= 0) {
          bookmarks.splice(idx, 1);
        } else {
          bookmarks.push(questionId);
        }
        try {
          localStorage.setItem(this.BOOKMARK_KEY, JSON.stringify(bookmarks));
        } catch(e) {}
      },
      isBookmarked: function(questionId) {
        return this.getBookmarks().indexOf(questionId) >= 0;
      },
      getBookmarks: function() {
        try {
          var raw = localStorage.getItem(this.BOOKMARK_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
      },
      reset: function() {
        this.data = this.defaultData();
        this.save();
        try { localStorage.removeItem(this.BOOKMARK_KEY); } catch(e) {}
      }
    };

    /* ========================================================================
     * BADGES
     * ======================================================================== */
    var Badges = {
      definitions: [
        { id:'first_session', name:'First Steps', icon:'\uD83C\uDFAF', desc:'Complete your first session', check: function(s) { return s.totalSessions >= 1; } },
        { id:'ten_sessions', name:'Dedicated', icon:'\uD83D\uDCAA', desc:'Complete 10 sessions', check: function(s) { return s.totalSessions >= 10; } },
        { id:'fifty_sessions', name:'Interview Pro', icon:'\uD83C\uDFC6', desc:'Complete 50 sessions', check: function(s) { return s.totalSessions >= 50; } },
        { id:'streak_3', name:'On a Roll', icon:'\uD83D\uDD25', desc:'3-day practice streak', check: function(s) { return s.currentStreak >= 3; } },
        { id:'streak_7', name:'Week Warrior', icon:'\u26A1', desc:'7-day streak', check: function(s) { return s.currentStreak >= 7; } },
        { id:'streak_30', name:'Monthly Master', icon:'\uD83D\uDC51', desc:'30-day streak', check: function(s) { return s.currentStreak >= 30; } },
        { id:'perfect', name:'Perfect 10', icon:'\uD83D\uDCAF', desc:'Score 95+ on any answer', check: function(s) { return s.bestScore >= 95; } },
        { id:'all_types', name:'Well-Rounded', icon:'\uD83C\uDFAD', desc:'Practice all interview types', check: function(s) { return s.typesCompleted && s.typesCompleted.length >= 5; } },
        { id:'speed', name:'Quick Thinker', icon:'\u23F1\uFE0F', desc:'Answer 5 questions under 60s', check: function(s) { return s.quickAnswers >= 5; } },
        { id:'star_master', name:'STAR Master', icon:'\u2B50', desc:'Score 90+ structure on 10 answers', check: function(s) { return s.starMasterCount >= 10; } },
        { id:'century', name:'Century Club', icon:'\uD83C\uDF96\uFE0F', desc:'Answer 100+ questions', check: function(s) { return s.totalQuestions >= 100; } },
        { id:'collector', name:'Question Collector', icon:'\uD83D\uDCDA', desc:'Bookmark 25+ questions', check: function(s) { return s.bookmarkCount >= 25; } }
      ],
      checkAll: function(stats) {
        var earned = [];
        var newlyEarned = [];
        this.definitions.forEach(function(badge) {
          if (badge.check(stats)) {
            earned.push(badge.id);
            if (Progress.data.earnedBadges.indexOf(badge.id) < 0) {
              newlyEarned.push(badge);
            }
          }
        });
        Progress.data.earnedBadges = earned;
        Progress.save();
        return newlyEarned;
      }
    };

    /* ========================================================================
     * UI RENDERING FUNCTIONS
     * ======================================================================== */
    var currentConfidence = 3;

    // Tab switching
    function initTabs() {
      var tabs = document.querySelectorAll('.ims-tab');
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          switchTab(tab.dataset.tab);
        });
      });
    }

    function switchTab(name) {
      document.querySelectorAll('.ims-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.ims-panel').forEach(function(p) { p.classList.remove('active'); });
      var tab = document.querySelector('.ims-tab[data-tab="' + name + '"]');
      var panel = document.getElementById('ims-panel-' + name);
      if (tab) tab.classList.add('active');
      if (panel) panel.classList.add('active');
    }

    // Render practice question
    function renderQuestion() {
      var q = SessionManager.getNextQuestion();
      if (!q) {
        endSession();
        return;
      }
      var prog = SessionManager.getProgress();
      document.getElementById('ims-q-counter').textContent = 'Question ' + prog.current + ' of ' + prog.total;
      document.getElementById('ims-progress-bar').style.width = prog.pct + '%';

      var typeNames = { behavioral:'Behavioral', technical:'Technical', situational:'Situational', caseStudy:'Case Study', panel:'Panel', phoneScreen:'Phone Screen', finalRound:'Final Round' };
      document.getElementById('ims-q-type-badge').textContent = typeNames[SessionManager.current.type] || 'Interview';

      var diffLabels = ['', 'Easy', 'Medium', 'Hard', 'Expert'];
      document.getElementById('ims-q-difficulty').textContent = diffLabels[q.d] || 'Medium';
      document.getElementById('ims-q-text').textContent = q.q;

      // Meta tags
      var metaEl = document.getElementById('ims-q-meta');
      metaEl.innerHTML = '<span class="ims-q-tag">' + q.c.replace('-', ' ') + '</span><span class="ims-q-tag">Difficulty: ' + q.d + '/4</span>';

      // Hint
      document.getElementById('ims-hint-text').textContent = q.f;
      hideEl(document.getElementById('ims-hint-box'));

      // Reset answer
      document.getElementById('ims-answer').value = '';
      document.getElementById('ims-word-count').textContent = '0 words';

      // Reset confidence
      currentConfidence = 3;
      updateStars(3);

      // Timer
      var timePerQ = SessionManager.current.timePerQuestion;
      if (timePerQ > 0) {
        document.getElementById('ims-timer-display').textContent = Timer.getDisplay(timePerQ);
      } else {
        document.getElementById('ims-timer-display').textContent = '0:00';
      }
      Timer.onTick = function(secs, pct) {
        var el = document.getElementById('ims-timer-display');
        el.textContent = Timer.getDisplay(secs);
        el.className = 'ims-timer';
        if (timePerQ > 0) {
          if (secs <= 10) el.className = 'ims-timer ims-timer--danger';
          else if (secs <= 30) el.className = 'ims-timer ims-timer--warning';
        }
      };
      Timer.onExpire = function() {
        window.showToast('Time is up! Submitting your answer.');
        submitCurrentAnswer();
      };
      Timer.start(timePerQ);
    }

    function updateStars(val) {
      document.querySelectorAll('.ims-star').forEach(function(star) {
        var sv = parseInt(star.dataset.star);
        if (sv <= val) star.classList.add('active');
        else star.classList.remove('active');
      });
    }

    function submitCurrentAnswer() {
      var answer = document.getElementById('ims-answer').value.trim();
      if (!answer) {
        window.showToast('Please write an answer or click Skip.');
        return;
      }
      Timer.stop();
      var timeSpent = Timer.getElapsed();
      var entry = SessionManager.submitAnswer(answer, currentConfidence, timeSpent);
      if (entry) {
        window.showToast('Answer submitted! Score: ' + entry.scores.total + '/100');
      }
      renderQuestion();
    }

    function endSession() {
      Timer.stop();
      var session = SessionManager.end();
      if (session && session.answers.length > 0) {
        Progress.addSession(session);
        var newBadges = Badges.checkAll(Progress.getStats());
        if (newBadges.length > 0) {
          newBadges.forEach(function(b) {
            window.showToast('Badge earned: ' + b.icon + ' ' + b.name);
          });
        }
        renderFeedback(session);
        switchTab('feedback');
      } else {
        window.showToast('No answers submitted.');
        switchTab('setup');
      }
      // Reset practice view
      hideEl(document.getElementById('ims-practice-active'));
      window.showEl(document.getElementById('ims-practice-empty'));
      renderProgressTab();
    }

    // Render feedback
    function renderFeedback(session) {
      hideEl(document.getElementById('ims-feedback-empty'));
      window.showEl(document.getElementById('ims-feedback-content'));

      var score = session.totalScore;
      document.getElementById('ims-total-score').textContent = score;
      document.getElementById('ims-grade').textContent = Scoring.getGrade(score);
      document.getElementById('ims-grade-label').textContent = Scoring.getLabel(score);

      // Gauge conic gradient
      var pct = Math.min(100, score);
      document.getElementById('ims-gauge').style.background = 'conic-gradient(var(--accent) ' + (pct * 3.6) + 'deg, var(--border) ' + (pct * 3.6) + 'deg)';

      // Session summary
      var answered = session.answers.filter(function(a) { return !a.skipped; });
      var skipped = session.answers.filter(function(a) { return a.skipped; });
      var avgTime = 0;
      if (answered.length > 0) {
        var totalTime = 0;
        answered.forEach(function(a) { totalTime += a.timeSpent; });
        avgTime = Math.round(totalTime / answered.length);
      }
      var summaryEl = document.getElementById('ims-session-summary');
      summaryEl.innerHTML =
        '<div class="ims-summary-stat"><div class="ims-summary-value">' + answered.length + '/' + session.questions.length + '</div><div class="ims-summary-label">Answered</div></div>' +
        '<div class="ims-summary-stat"><div class="ims-summary-value">' + Timer.getDisplay(avgTime) + '</div><div class="ims-summary-label">Avg Time</div></div>' +
        '<div class="ims-summary-stat"><div class="ims-summary-value">' + skipped.length + '</div><div class="ims-summary-label">Skipped</div></div>';

      // Answer cards
      var listEl = document.getElementById('ims-answers-list');
      listEl.innerHTML = '';
      session.answers.forEach(function(a, idx) {
        var card = document.createElement('div');
        card.className = 'ims-answer-card';
        if (a.skipped) {
          card.innerHTML =
            '<div class="ims-answer-card-header"><div class="ims-answer-q">' + (idx+1) + '. ' + escapeHtml(a.question) + '</div><div class="ims-answer-score-badge">Skipped</div></div>' +
            '<div class="ims-answer-skipped">This question was skipped.</div>';
        } else {
          card.innerHTML =
            '<div class="ims-answer-card-header"><div class="ims-answer-q">' + (idx+1) + '. ' + escapeHtml(a.question) + '</div><div class="ims-answer-score-badge">' + a.scores.total + '/100</div></div>' +
            '<div class="ims-answer-text">' + escapeHtml(a.answer) + '</div>' +
            '<div class="ims-answer-breakdown">' +
              '<div class="ims-breakdown-item"><span>Structure (STAR)</span><span>' + a.scores.structure + '/25</span></div>' +
              '<div class="ims-breakdown-item"><span>Length</span><span>' + a.scores.length + '/25</span></div>' +
              '<div class="ims-breakdown-item"><span>Specificity</span><span>' + a.scores.specificity + '/25</span></div>' +
              '<div class="ims-breakdown-item"><span>Relevance</span><span>' + a.scores.relevance + '/25</span></div>' +
            '</div>' +
            '<div id="ims-ai-fb-' + idx + '"></div>';
        }
        listEl.appendChild(card);
      });
    }

    // Render question bank
    function renderBankTab() {
      var all = getAllQuestions();
      var searchVal = (document.getElementById('ims-bank-search').value || '').toLowerCase();
      var typeFilter = document.getElementById('ims-bank-type-filter').value;
      var compFilter = document.getElementById('ims-bank-comp-filter').value;
      var diffFilter = document.getElementById('ims-bank-diff-filter').value;
      var bookmarkFilter = document.getElementById('ims-bank-bookmark-filter').value;

      var filtered = all.filter(function(q) {
        if (searchVal && q.q.toLowerCase().indexOf(searchVal) < 0 && q.c.indexOf(searchVal) < 0) return false;
        if (typeFilter && q.type !== typeFilter) return false;
        if (compFilter && q.c !== compFilter) return false;
        if (diffFilter && q.d !== parseInt(diffFilter)) return false;
        if (bookmarkFilter === 'bookmarked' && !Progress.isBookmarked(q.id)) return false;
        return true;
      });

      document.getElementById('ims-bank-count').textContent = 'Showing ' + filtered.length + ' of ' + all.length + ' questions';

      var listEl = document.getElementById('ims-bank-list');
      listEl.innerHTML = '';
      var diffLabels = ['', 'Easy', 'Medium', 'Hard', 'Expert'];
      var typeLabels = { behavioral:'Behavioral', technical:'Technical', situational:'Situational', caseStudy:'Case Study', panel:'Panel', phoneScreen:'Phone Screen', finalRound:'Final Round' };

      // Show max 50 at a time for performance
      var displayLimit = 50;
      var shown = filtered.slice(0, displayLimit);

      shown.forEach(function(q) {
        var li = document.createElement('li');
        li.className = 'ims-bank-item';
        var isBookmarked = Progress.isBookmarked(q.id);
        li.innerHTML =
          '<div style="flex:1"><div class="ims-bank-q">' + escapeHtml(q.q) + '</div>' +
          '<div class="ims-bank-tags">' +
            '<span class="ims-bank-tag">' + (typeLabels[q.type] || q.type) + '</span>' +
            '<span class="ims-bank-tag">' + q.c.replace('-', ' ') + '</span>' +
            '<span class="ims-bank-tag">' + (diffLabels[q.d] || 'Medium') + '</span>' +
          '</div></div>' +
          '<button class="ims-bookmark-btn' + (isBookmarked ? ' bookmarked' : '') + '" data-qid="' + q.id + '" title="Bookmark">' + (isBookmarked ? '\u2605' : '\u2606') + '</button>';
        listEl.appendChild(li);
      });

      if (filtered.length > displayLimit) {
        var moreEl = document.createElement('li');
        moreEl.className = 'ims-bank-item';
        moreEl.innerHTML = '<div class="ims-bank-q" style="color:var(--text-muted);text-align:center;width:100%">Showing ' + displayLimit + ' of ' + filtered.length + ' — use filters to narrow down.</div>';
        listEl.appendChild(moreEl);
      }

      // Wire bookmark buttons
      listEl.querySelectorAll('.ims-bookmark-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var qid = btn.dataset.qid;
          Progress.toggleBookmark(qid);
          var nowBookmarked = Progress.isBookmarked(qid);
          btn.textContent = nowBookmarked ? '\u2605' : '\u2606';
          if (nowBookmarked) btn.classList.add('bookmarked');
          else btn.classList.remove('bookmarked');
          window.showToast(nowBookmarked ? 'Question bookmarked' : 'Bookmark removed');
        });
      });
    }

    // Render progress tab
    function renderProgressTab() {
      var stats = Progress.getStats();

      // Stats grid
      var statsEl = document.getElementById('ims-stats-grid');
      statsEl.innerHTML =
        '<div class="ims-stat-card"><div class="ims-stat-value">' + stats.totalSessions + '</div><div class="ims-stat-label">Sessions</div></div>' +
        '<div class="ims-stat-card"><div class="ims-stat-value">' + stats.totalQuestions + '</div><div class="ims-stat-label">Questions</div></div>' +
        '<div class="ims-stat-card"><div class="ims-stat-value">' + stats.avgScore + '</div><div class="ims-stat-label">Avg Score</div></div>' +
        '<div class="ims-stat-card"><div class="ims-stat-value">' + stats.bestScore + '</div><div class="ims-stat-label">Best Score</div></div>' +
        '<div class="ims-stat-card"><div class="ims-stat-value">' + stats.currentStreak + '</div><div class="ims-stat-label">Day Streak</div></div>' +
        '<div class="ims-stat-card"><div class="ims-stat-value">' + stats.longestStreak + '</div><div class="ims-stat-label">Best Streak</div></div>' +
        '<div class="ims-stat-card"><div class="ims-stat-value">' + (stats.typesCompleted ? stats.typesCompleted.length : 0) + '/7</div><div class="ims-stat-label">Types Done</div></div>' +
        '<div class="ims-stat-card"><div class="ims-stat-value">' + stats.bookmarkCount + '</div><div class="ims-stat-label">Bookmarked</div></div>';

      // Badges
      var badgesEl = document.getElementById('ims-badges-grid');
      badgesEl.innerHTML = '';
      Badges.definitions.forEach(function(b) {
        var earned = stats.earnedBadges.indexOf(b.id) >= 0;
        var el = document.createElement('div');
        el.className = 'ims-badge' + (earned ? ' earned' : '');
        el.title = b.desc;
        el.innerHTML = '<span class="ims-badge-icon">' + b.icon + '</span><span class="ims-badge-name">' + b.name + '</span>';
        badgesEl.appendChild(el);
      });

      // Competency bars
      var compEl = document.getElementById('ims-comp-bars');
      compEl.innerHTML = '';
      var comps = ['leadership', 'problem-solving', 'teamwork', 'communication', 'adaptability', 'technical', 'customer-focus', 'conflict-resolution', 'initiative', 'analytical'];
      comps.forEach(function(c) {
        var data = stats.competencyScores[c];
        var avg = data ? Math.round(data.total / data.count) : 0;
        var row = document.createElement('div');
        row.className = 'ims-comp-row';
        row.innerHTML =
          '<div class="ims-comp-label">' + c.replace('-', ' ') + '</div>' +
          '<div class="ims-bar-track"><div class="ims-bar-fill" style="width:' + avg + '%"></div></div>' +
          '<div class="ims-comp-score">' + avg + '</div>';
        compEl.appendChild(row);
      });

      // Calendar
      renderCalendar(stats.practiceDates);
    }

    function renderCalendar(practiceDates) {
      var calEl = document.getElementById('ims-calendar');
      calEl.innerHTML = '';
      var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach(function(d) {
        var el = document.createElement('div');
        el.className = 'ims-cal-day-label';
        el.textContent = d;
        calEl.appendChild(el);
      });

      var today = new Date();
      today.setHours(0,0,0,0);
      var todayStr = today.toISOString().split('T')[0];

      // Go back 35 days
      var start = new Date(today);
      start.setDate(start.getDate() - 34);
      // Align to Monday
      var startDay = start.getDay();
      if (startDay === 0) startDay = 7;
      start.setDate(start.getDate() - (startDay - 1));

      // Count practices per day
      var dateCounts = {};
      practiceDates.forEach(function(d) {
        dateCounts[d] = (dateCounts[d] || 0) + 1;
      });

      for (var i = 0; i < 35; i++) {
        var d = new Date(start);
        d.setDate(d.getDate() + i);
        var ds = d.toISOString().split('T')[0];
        var cell = document.createElement('div');
        cell.className = 'ims-cal-cell';
        var count = dateCounts[ds] || 0;
        if (count >= 3) cell.classList.add('level-3');
        else if (count >= 2) cell.classList.add('level-2');
        else if (count >= 1) cell.classList.add('level-1');
        if (ds === todayStr) cell.classList.add('today');
        cell.title = ds + (count > 0 ? ' (' + count + ' session' + (count > 1 ? 's' : '') + ')' : '');
        calEl.appendChild(cell);
      }
    }

    // Escape HTML
    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    /* ========================================================================
     * EVENT WIRING
     * ======================================================================== */
