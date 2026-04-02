/**
 * Interview Practice Simulator — Core Engines
 * Built on cognitive science research for optimal interview skill acquisition:
 *
 * 1. Spaced Repetition (SM-2) — Questions you struggle with resurface sooner
 * 2. Active Recall — Type answers from memory, not recognition
 * 3. Interleaving — Mix question types for deeper learning
 * 4. Desirable Difficulty — Auto-adjusts difficulty based on performance
 * 5. Elaborative Interrogation — AI follow-up "why" questions
 * 6. Metacognitive Monitoring — Compare self-rating vs actual score
 * 7. Deliberate Practice — Prioritize weakest competencies
 * 8. Anxiety Inoculation — Progressive time pressure across sessions
 *
 * References:
 * - Ebbinghaus forgetting curve, SM-2 algorithm (Wozniak, 1985)
 * - Testing Effect (Roediger & Karpicke, 2006)
 * - Interleaving (Bjork & Bjork, 2013)
 * - Desirable Difficulties (Bjork, 1994)
 * - Stress Inoculation Training (Meichenbaum, 1977)
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
            all.push({ type: type, sub: sub, id: q.id, q: q.q, f: q.f, c: q.c, d: q.d, a: q.a || '', why: q.why || '' });
          });
        });
      });
      return all;
    }

    /* ========================================================================
     * SPACED REPETITION ENGINE (SM-2 adapted for interview practice)
     *
     * Each question gets a "memory card" with:
     * - easeFactor: how easy this question is (starts at 2.5, minimum 1.3)
     * - interval: days until next review (starts at 1)
     * - repetitions: consecutive correct answers
     * - lastReview: date string of last practice
     * - lastScore: 0-100 score from last attempt
     *
     * SM-2 quality mapping: score 0-100 → quality 0-5
     * Quality < 3 (score < 60) = reset to beginning (you forgot)
     * Quality >= 3 (score >= 60) = increase interval
     * ======================================================================== */
    var SRS = {
      STORAGE_KEY: 'tz_ims_srs',
      cards: {},

      load: function() {
        try {
          var raw = localStorage.getItem(this.STORAGE_KEY);
          this.cards = raw ? JSON.parse(raw) : {};
        } catch(e) { this.cards = {}; }
      },

      save: function() {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cards));
        } catch(e) {}
      },

      getCard: function(questionId) {
        if (!this.cards[questionId]) {
          this.cards[questionId] = {
            easeFactor: 2.5,
            interval: 1,
            repetitions: 0,
            lastReview: null,
            lastScore: 0,
            totalAttempts: 0
          };
        }
        return this.cards[questionId];
      },

      // SM-2 algorithm: update after answering
      updateCard: function(questionId, score) {
        var card = this.getCard(questionId);
        card.totalAttempts++;
        card.lastScore = score;
        card.lastReview = new Date().toISOString().split('T')[0];

        // Map 0-100 score to SM-2 quality 0-5
        var quality;
        if (score >= 90) quality = 5;       // perfect recall
        else if (score >= 80) quality = 4;  // correct with hesitation
        else if (score >= 70) quality = 3;  // correct with difficulty
        else if (score >= 60) quality = 2;  // incorrect but close
        else if (score >= 40) quality = 1;  // incorrect, remembered something
        else quality = 0;                    // complete blackout

        if (quality < 3) {
          // Failed — reset repetitions, review again soon
          card.repetitions = 0;
          card.interval = 1;
        } else {
          // Passed — increase interval
          card.repetitions++;
          if (card.repetitions === 1) {
            card.interval = 1;
          } else if (card.repetitions === 2) {
            card.interval = 3;
          } else {
            card.interval = Math.round(card.interval * card.easeFactor);
          }
        }

        // Update ease factor (SM-2 formula)
        card.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (card.easeFactor < 1.3) card.easeFactor = 1.3;

        this.save();
        return card;
      },

      // Get questions due for review (interval has passed)
      getDueQuestions: function(allQuestions) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var due = [];

        for (var i = 0; i < allQuestions.length; i++) {
          var q = allQuestions[i];
          var card = this.cards[q.id];
          if (!card || !card.lastReview) {
            // Never practiced — always available
            continue;
          }
          var lastDate = new Date(card.lastReview);
          lastDate.setHours(0, 0, 0, 0);
          var daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
          if (daysSince >= card.interval) {
            due.push({ question: q, card: card, daysSince: daysSince, overdue: daysSince - card.interval });
          }
        }

        // Sort by most overdue first
        due.sort(function(a, b) { return b.overdue - a.overdue; });
        return due;
      },

      // Get questions the user struggles with most (lowest ease factor)
      getWeakQuestions: function(count) {
        var entries = [];
        var self = this;
        Object.keys(this.cards).forEach(function(id) {
          var card = self.cards[id];
          if (card.totalAttempts > 0) {
            entries.push({ id: id, easeFactor: card.easeFactor, lastScore: card.lastScore, attempts: card.totalAttempts });
          }
        });
        entries.sort(function(a, b) { return a.easeFactor - b.easeFactor; });
        return entries.slice(0, count || 10);
      },

      // Get SRS status label for a question
      getStatus: function(questionId) {
        var card = this.cards[questionId];
        if (!card || !card.lastReview) return { label: 'New', class: 'new' };
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var lastDate = new Date(card.lastReview);
        lastDate.setHours(0, 0, 0, 0);
        var daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        if (daysSince >= card.interval) return { label: 'Due', class: 'due' };
        if (card.lastScore >= 80) return { label: 'Strong', class: 'strong' };
        if (card.lastScore >= 60) return { label: 'Learning', class: 'learning' };
        return { label: 'Weak', class: 'weak' };
      },

      reset: function() {
        this.cards = {};
        this.save();
      }
    };

    /* ========================================================================
     * ADAPTIVE DIFFICULTY ENGINE
     *
     * Principle: "Desirable Difficulty" (Bjork, 1994)
     * If user scores consistently high → increase difficulty
     * If user scores consistently low → decrease difficulty
     * Target zone: 60-80% (the "sweet spot" for learning)
     * ======================================================================== */
    var AdaptiveDifficulty = {
      // Calculate recommended difficulty based on recent performance
      recommend: function(stats) {
        if (!stats || !stats.competencyScores) return 2; // default medium
        var recentSessions = Progress.data.sessions.slice(-5);
        if (recentSessions.length < 2) return 2;

        var avgScore = 0;
        recentSessions.forEach(function(s) { avgScore += s.score; });
        avgScore = avgScore / recentSessions.length;

        // Target zone: 60-80 — if consistently above, increase difficulty
        if (avgScore >= 85) return 4;  // Expert
        if (avgScore >= 75) return 3;  // Hard
        if (avgScore >= 55) return 2;  // Medium (sweet spot)
        return 1;                       // Easy (build confidence first)
      },

      // For anxiety inoculation: recommend time pressure based on session count
      // Principle: Stress Inoculation Training (Meichenbaum, 1977)
      // Start relaxed → gradually increase pressure
      recommendTimeLimit: function() {
        var totalSessions = Progress.data.totalSessions || 0;
        if (totalSessions < 3) return 300;   // 5 min — relaxed start
        if (totalSessions < 8) return 180;   // 3 min — moderate pressure
        if (totalSessions < 15) return 120;  // 2 min — interview-realistic
        if (totalSessions < 25) return 90;   // 1.5 min — challenging
        return 60;                            // 1 min — rapid-fire (mastery)
      },

      // Get label for recommended settings
      getRecommendationLabel: function() {
        var diff = this.recommend(Progress.getStats());
        var time = this.recommendTimeLimit();
        var diffLabels = ['', 'Easy', 'Medium', 'Hard', 'Expert'];
        return 'Recommended: ' + diffLabels[diff] + ' difficulty, ' + Math.floor(time / 60) + ':' + (time % 60 < 10 ? '0' : '') + (time % 60) + ' per question';
      }
    };

    /* ========================================================================
     * INTERLEAVING ENGINE
     *
     * Principle: Mixed practice > blocked practice (Bjork, 2013)
     * Instead of all behavioral → all technical → all situational,
     * interleave: behavioral → technical → situational → behavioral...
     * This forces discrimination learning: "what type IS this question?"
     * ======================================================================== */
    var Interleaver = {
      // Take a flat array of questions and interleave by type
      interleave: function(questions) {
        if (questions.length <= 2) return questions;

        // Group by type
        var groups = {};
        questions.forEach(function(q) {
          var type = q.type || q.c || 'general';
          if (!groups[type]) groups[type] = [];
          groups[type].push(q);
        });

        var types = Object.keys(groups);
        if (types.length <= 1) return questions; // can't interleave 1 type

        // Round-robin: pick one from each type in rotation
        var result = [];
        var maxLen = 0;
        types.forEach(function(t) { if (groups[t].length > maxLen) maxLen = groups[t].length; });

        for (var i = 0; i < maxLen; i++) {
          for (var j = 0; j < types.length; j++) {
            if (i < groups[types[j]].length) {
              result.push(groups[types[j]][i]);
            }
          }
        }
        return result;
      }
    };

    /* ========================================================================
     * DELIBERATE PRACTICE ENGINE
     *
     * Principle: Focus on weakest areas (Ericsson, 1993)
     * Identify competencies with lowest scores, prioritize those questions
     * ======================================================================== */
    var DeliberatePractice = {
      // Get the user's weakest competencies
      getWeakCompetencies: function(count) {
        var scores = Progress.data.competencyScores || {};
        var entries = [];
        Object.keys(scores).forEach(function(c) {
          if (scores[c].count > 0) {
            entries.push({ competency: c, avg: Math.round(scores[c].total / scores[c].count), count: scores[c].count });
          }
        });
        entries.sort(function(a, b) { return a.avg - b.avg; });
        return entries.slice(0, count || 3);
      },

      // Filter questions to focus on weak competencies
      focusOnWeakness: function(questions, weakCompetencies) {
        if (!weakCompetencies || weakCompetencies.length === 0) return questions;
        var weakSet = {};
        weakCompetencies.forEach(function(w) { weakSet[w.competency] = true; });

        // Prioritize weak competency questions (put them first)
        var weak = [];
        var other = [];
        questions.forEach(function(q) {
          if (weakSet[q.c]) weak.push(q);
          else other.push(q);
        });

        // Mix: 60% weak, 40% other (don't make it ALL weakness — that's demotivating)
        var targetWeak = Math.ceil(questions.length * 0.6);
        var targetOther = questions.length - targetWeak;
        var result = weak.slice(0, targetWeak).concat(other.slice(0, targetOther));

        // If not enough weak questions, fill with others
        while (result.length < questions.length && other.length > targetOther) {
          result.push(other[targetOther++]);
        }
        while (result.length < questions.length && weak.length > targetWeak) {
          result.push(weak[targetWeak++]);
        }

        return result;
      }
    };

    /* ========================================================================
     * METACOGNITIVE MONITOR
     *
     * Principle: Self-assessment accuracy improves learning
     * Compare user's confidence rating vs actual score
     * Large gap = poor metacognition → show calibration feedback
     * ======================================================================== */
    var Metacognition = {
      // Analyze gap between confidence and actual score
      analyze: function(confidence, score) {
        // Confidence 1-5 maps to expected score: 1=20, 2=40, 3=60, 4=80, 5=100
        var expectedScore = confidence * 20;
        var gap = score - expectedScore;
        var absGap = Math.abs(gap);

        if (absGap <= 10) {
          return { calibration: 'accurate', message: 'Your self-assessment is well calibrated. You know what you know.', gap: gap };
        }
        if (gap > 10) {
          return { calibration: 'underconfident', message: 'You scored higher than you expected! Trust your preparation more — you know more than you think.', gap: gap };
        }
        return { calibration: 'overconfident', message: 'You rated yourself higher than your score. Focus on the specific feedback to close this gap.', gap: gap };
      },

      // Get session-level calibration
      sessionCalibration: function(answers) {
        var totalGap = 0;
        var count = 0;
        answers.forEach(function(a) {
          if (!a.skipped) {
            var expected = a.confidence * 20;
            totalGap += (a.scores.total - expected);
            count++;
          }
        });
        if (count === 0) return null;
        var avgGap = totalGap / count;
        if (Math.abs(avgGap) <= 10) return { type: 'calibrated', label: 'Well Calibrated', desc: 'Your confidence ratings closely match your actual performance.' };
        if (avgGap > 10) return { type: 'underconfident', label: 'Underconfident', desc: 'You consistently score better than you expect. Build more trust in your abilities.' };
        return { type: 'overconfident', label: 'Overconfident', desc: 'Your confidence exceeds your current skill level. Review feedback carefully and practice weak areas.' };
      }
    };

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
        var firstPerson = (a.match(/\b(i|my|me|we|our)\b/g) || []).length;
        score += Math.min(8, firstPerson * 1);
        var numbers = (a.match(/\d+/g) || []).length;
        score += Math.min(8, numbers * 2);
        var specifics = ['specifically', 'for example', 'such as', 'in particular', 'precisely', 'exactly', 'approximately', 'about', 'roughly', 'nearly'];
        specifics.forEach(function(w) {
          if (a.indexOf(w) >= 0) score += 1;
        });
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
     * SESSION MANAGER (with science-based question selection)
     * ======================================================================== */
    var SessionManager = {
      current: null,

      /**
       * Create session — calls AI to generate questions via Cloud Functions.
       * Falls back to local bank ONLY if AI fails.
       * Returns a Promise that resolves with the session object.
       *
       * @param {Object} config - session configuration
       * @param {Function} onStatus - callback for status updates
       * @returns {Promise<Object>} session
       */
      create: function(config, onStatus) {
        var self = this;
        var type = config.type;
        var level = config.level;
        var role = config.role;
        var difficulty = parseInt(config.difficulty) || 2;
        var count = parseInt(config.questionCount) || 5;
        var timePerQ = parseInt(config.timePerQuestion) || 120;

        var statusFn = onStatus || function() {};

        // Try AI-generated questions first (requires login)
        return new Promise(function(resolve) {
          if (typeof TeamzAuth !== 'undefined' && TeamzAuth.isLoggedIn()) {
            statusFn('Generating personalized questions with AI...');

            TeamzAuth.callFunction('generateQuestions', {
              role: role || 'general professional',
              company: config.company || '',
              level: level,
              type: type === 'mixed' ? 'mixed (behavioral + technical + situational)' : type,
              industry: config.industry || '',
              count: count,
              difficulty: difficulty
            }).then(function(result) {
              if (result && result.questions && result.questions.length > 0) {
                // AI generated questions successfully
                var questions = result.questions.map(function(q, idx) {
                  return {
                    id: 'ai_' + Date.now() + '_' + idx,
                    q: q.q,
                    f: q.f || '',
                    c: q.c || 'general',
                    d: difficulty,
                    why: q.why || '',
                    a: q.a || ''
                  };
                });
                statusFn('AI generated ' + questions.length + ' questions!');
                self._initSession(config, questions, timePerQ);
                resolve(self.current);
              } else {
                // AI returned empty — fall back
                statusFn('AI unavailable. Using practice questions...');
                self._createFromFallback(config, count, timePerQ);
                resolve(self.current);
              }
            }).catch(function(err) {
              statusFn('AI unavailable. Using practice questions...');
              self._createFromFallback(config, count, timePerQ);
              resolve(self.current);
            });
          } else {
            // Not logged in — show login prompt, then try again
            if (typeof TeamzAuth !== 'undefined') {
              TeamzAuth.requireAuth(function(user) {
                statusFn('Signed in! Generating questions...');
                // Retry with auth
                self.create(config, onStatus).then(resolve);
              });
            } else {
              // No auth module — use fallback
              statusFn('Sign in for AI-generated questions. Using practice questions...');
              self._createFromFallback(config, count, timePerQ);
              resolve(self.current);
            }
          }
        });
      },

      /**
       * Fallback: create session from local question bank (when AI unavailable)
       */
      _createFromFallback: function(config, count, timePerQ) {
        var type = config.type;
        var candidates = [];

        // Collect from fallback bank
        Object.keys(QUESTION_BANK).forEach(function(t) {
          if (type !== 'mixed' && t !== type) return;
          Object.keys(QUESTION_BANK[t]).forEach(function(sub) {
            QUESTION_BANK[t][sub].forEach(function(q) {
              candidates.push(q);
            });
          });
        });

        // If no match, collect ALL fallback questions
        if (candidates.length === 0) {
          Object.keys(QUESTION_BANK).forEach(function(t) {
            Object.keys(QUESTION_BANK[t]).forEach(function(sub) {
              QUESTION_BANK[t][sub].forEach(function(q) {
                candidates.push(q);
              });
            });
          });
        }

        // Shuffle
        for (var i = candidates.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = candidates[i]; candidates[i] = candidates[j]; candidates[j] = temp;
        }

        var questions = candidates.slice(0, Math.min(count, candidates.length));
        this._initSession(config, questions, timePerQ);
      },

      /**
       * Initialize session object with given questions
       */
      _initSession: function(config, questions, timePerQ) {
        this.current = {
          config: config,
          type: config.type,
          level: config.level,
          role: config.role,
          company: config.company || '',
          industry: config.industry || '',
          difficulty: difficulty,
          timePerQuestion: timePerQ,
          interleaved: useInterleaving,
          smartMode: useSRS,
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

        // Update SRS card for this question
        SRS.updateCard(q.id, scores.total);

        // Metacognitive analysis
        var meta = Metacognition.analyze(confidence, scores.total);

        var entry = {
          questionId: q.id,
          question: q.q,
          competency: q.c,
          answer: answer,
          confidence: confidence,
          timeSpent: timeSpent,
          scores: scores,
          metacognition: meta,
          skipped: false
        };
        this.current.answers.push(entry);
        this.current.currentIndex++;
        return entry;
      },

      skip: function() {
        if (!this.current) return;
        var q = this.current.questions[this.current.currentIndex];
        // Skipping = worst score for SRS
        SRS.updateCard(q.id, 0);
        this.current.answers.push({
          questionId: q.id,
          question: q.q,
          competency: q.c,
          answer: '',
          confidence: 0,
          timeSpent: 0,
          scores: { structure: 0, length: 0, specificity: 0, relevance: 0, total: 0 },
          metacognition: null,
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

        // Session-level metacognitive calibration
        this.current.calibration = Metacognition.sessionCalibration(this.current.answers);

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
          sessions: [],
          calibrationHistory: [] // metacognitive tracking
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

        if (d.typesCompleted.indexOf(session.type) < 0) d.typesCompleted.push(session.type);

        answered.forEach(function(a) {
          var c = a.competency;
          if (!d.competencyScores[c]) d.competencyScores[c] = { total: 0, count: 0 };
          d.competencyScores[c].total += a.scores.total;
          d.competencyScores[c].count++;

          if (a.timeSpent < 60 && a.timeSpent > 0) d.quickAnswers++;
          if (a.scores.structure >= 23) d.starMasterCount++;
        });

        // Metacognitive calibration history
        if (session.calibration) {
          d.calibrationHistory.push({ date: today, type: session.calibration.type });
          if (d.calibrationHistory.length > 50) d.calibrationHistory = d.calibrationHistory.slice(-50);
        }

        this.updateStreak();

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
        var avgScore = d.sessions.length > 0 ? Math.round(d.sessions.reduce(function(s, sess) { return s + sess.score; }, 0) / d.sessions.length) : 0;
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
          practiceDates: d.practiceDates,
          calibrationHistory: d.calibrationHistory || []
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
        SRS.reset();
        try { localStorage.removeItem(this.BOOKMARK_KEY); } catch(e) {}
      }
    };

    /* ========================================================================
     * BADGES (expanded with science-based badges)
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
        { id:'collector', name:'Question Collector', icon:'\uD83D\uDCDA', desc:'Bookmark 25+ questions', check: function(s) { return s.bookmarkCount >= 25; } },
        // Science-based badges
        { id:'calibrated', name:'Self-Aware', icon:'\uD83E\uDDE0', desc:'3 sessions with accurate self-assessment', check: function(s) { var cal = s.calibrationHistory || []; return cal.filter(function(c) { return c.type === 'calibrated'; }).length >= 3; } },
        { id:'comeback', name:'Comeback Kid', icon:'\uD83D\uDD04', desc:'Improve score by 20+ points between sessions', check: function(s) {
          if (!Progress.data.sessions || Progress.data.sessions.length < 2) return false;
          var sess = Progress.data.sessions;
          for (var i = 1; i < sess.length; i++) {
            if (sess[i].score - sess[i-1].score >= 20) return true;
          }
          return false;
        }},
        { id:'growth', name:'Growth Mindset', icon:'\uD83C\uDF31', desc:'Average score improved over 5+ sessions', check: function(s) {
          if (!Progress.data.sessions || Progress.data.sessions.length < 5) return false;
          var sess = Progress.data.sessions;
          var firstHalf = sess.slice(0, Math.floor(sess.length / 2));
          var secondHalf = sess.slice(Math.floor(sess.length / 2));
          var avg1 = firstHalf.reduce(function(a, b) { return a + b.score; }, 0) / firstHalf.length;
          var avg2 = secondHalf.reduce(function(a, b) { return a + b.score; }, 0) / secondHalf.length;
          return avg2 > avg1;
        }}
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

      // SRS status indicator
      var srsStatus = SRS.getStatus(q.id);
      var metaEl = document.getElementById('ims-q-meta');
      metaEl.innerHTML = '<span class="ims-q-tag">' + q.c.replace('-', ' ') + '</span>' +
        '<span class="ims-q-tag">Difficulty: ' + q.d + '/4</span>' +
        '<span class="ims-q-tag ims-srs-' + srsStatus.class + '">' + srsStatus.label + '</span>';

      document.getElementById('ims-hint-text').textContent = q.f;
      hideEl(document.getElementById('ims-hint-box'));

      // "Why is this asked?" content
      var whyBox = document.getElementById('ims-why-box');
      var whyText = document.getElementById('ims-why-text');
      if (whyBox) hideEl(whyBox);
      if (whyText) {
        whyText.textContent = q.why || ('This tests: ' + q.c.replace(/-/g, ' ') + '. Interviewers look for structured thinking, specific examples, and measurable outcomes.');
      }
      var whyToggle = document.getElementById('ims-why-toggle');
      if (whyToggle) whyToggle.textContent = 'Why Is This Asked?';

      document.getElementById('ims-answer').value = '';
      document.getElementById('ims-word-count').textContent = '0 words';

      currentConfidence = 3;
      updateStars(3);

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
        // Show metacognitive feedback inline
        var metaMsg = entry.metacognition ? ' | ' + entry.metacognition.calibration : '';
        window.showToast('Score: ' + entry.scores.total + '/100' + metaMsg);
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
      hideEl(document.getElementById('ims-practice-active'));
      window.showEl(document.getElementById('ims-practice-empty'));
      renderProgressTab();
    }

    function renderFeedback(session) {
      hideEl(document.getElementById('ims-feedback-empty'));
      window.showEl(document.getElementById('ims-feedback-content'));

      var score = session.totalScore;
      document.getElementById('ims-total-score').textContent = score;
      document.getElementById('ims-grade').textContent = Scoring.getGrade(score);
      document.getElementById('ims-grade-label').textContent = Scoring.getLabel(score);

      var pct = Math.min(100, score);
      document.getElementById('ims-gauge').style.background = 'conic-gradient(var(--accent) ' + (pct * 3.6) + 'deg, var(--border) ' + (pct * 3.6) + 'deg)';

      var answered = session.answers.filter(function(a) { return !a.skipped; });
      var skipped = session.answers.filter(function(a) { return a.skipped; });
      var avgTime = 0;
      if (answered.length > 0) {
        var totalTime = 0;
        answered.forEach(function(a) { totalTime += a.timeSpent; });
        avgTime = Math.round(totalTime / answered.length);
      }

      // Metacognitive calibration summary
      var calHtml = '';
      if (session.calibration) {
        calHtml = '<div class="ims-summary-stat"><div class="ims-summary-value">' + session.calibration.label + '</div><div class="ims-summary-label">Self-Assessment</div></div>';
      }

      // Adaptive difficulty recommendation
      var recDiff = AdaptiveDifficulty.recommend(Progress.getStats());
      var diffLabels = ['', 'Easy', 'Medium', 'Hard', 'Expert'];
      var recHtml = '<div class="ims-summary-stat"><div class="ims-summary-value">' + diffLabels[recDiff] + '</div><div class="ims-summary-label">Next Difficulty</div></div>';

      var summaryEl = document.getElementById('ims-session-summary');
      summaryEl.innerHTML =
        '<div class="ims-summary-stat"><div class="ims-summary-value">' + answered.length + '/' + session.questions.length + '</div><div class="ims-summary-label">Answered</div></div>' +
        '<div class="ims-summary-stat"><div class="ims-summary-value">' + Timer.getDisplay(avgTime) + '</div><div class="ims-summary-label">Avg Time</div></div>' +
        calHtml + recHtml;

      var listEl = document.getElementById('ims-answers-list');
      listEl.innerHTML = '';
      session.answers.forEach(function(a, idx) {
        var card = document.createElement('div');
        card.className = 'ims-answer-card';
        if (a.skipped) {
          card.innerHTML =
            '<div class="ims-answer-card-header"><div class="ims-answer-q">' + (idx+1) + '. ' + escapeHtml(a.question) + '</div><div class="ims-answer-score-badge">Skipped</div></div>' +
            '<div class="ims-answer-skipped">This question was skipped. It will appear again sooner (spaced repetition).</div>';
        } else {
          var metaHtml = '';
          if (a.metacognition) {
            metaHtml = '<div class="ims-ai-feedback"><strong>Self-Assessment:</strong> ' + a.metacognition.message + '</div>';
          }
          // Find model answer from question bank
          var modelHtml = '';
          var allQs = getAllQuestions();
          for (var qi = 0; qi < allQs.length; qi++) {
            if (allQs[qi].id === a.questionId && allQs[qi].a) {
              modelHtml = '<div class="ims-model-answer"><div class="ims-model-answer-title">Model Answer</div><div class="ims-model-answer-text">' + escapeHtml(allQs[qi].a) + '</div></div>';
              break;
            }
          }
          card.innerHTML =
            '<div class="ims-answer-card-header"><div class="ims-answer-q">' + (idx+1) + '. ' + escapeHtml(a.question) + '</div><div class="ims-answer-score-badge">' + a.scores.total + '/100</div></div>' +
            '<div class="ims-answer-text">' + escapeHtml(a.answer) + '</div>' +
            '<div class="ims-answer-breakdown">' +
              '<div class="ims-breakdown-item"><span>Structure (STAR)</span><span>' + a.scores.structure + '/25</span></div>' +
              '<div class="ims-breakdown-item"><span>Length</span><span>' + a.scores.length + '/25</span></div>' +
              '<div class="ims-breakdown-item"><span>Specificity</span><span>' + a.scores.specificity + '/25</span></div>' +
              '<div class="ims-breakdown-item"><span>Relevance</span><span>' + a.scores.relevance + '/25</span></div>' +
            '</div>' +
            metaHtml +
            modelHtml +
            // Self-grading buttons (Gap 1: Active Recall completion)
            '<div class="ims-self-grade" data-qid="' + a.questionId + '">' +
              '<button class="ims-grade-btn" data-grade="nailed">Nailed It</button>' +
              '<button class="ims-grade-btn" data-grade="partial">Partial</button>' +
              '<button class="ims-grade-btn" data-grade="missed">Missed</button>' +
            '</div>' +
            // Filler word report (Gap 6)
            (function() {
              if (typeof FillerDetector === 'undefined') return '';
              var result = FillerDetector.detect(a.answer);
              if (result.total === 0) return '<div class="ims-filler-report">No filler words detected.</div>';
              return '<div class="ims-filler-report">' +
                '<strong>Filler Words (' + result.total + '):</strong> ' +
                result.fillers.map(function(f) { return '<span class="ims-filler-word">"' + f.filler + '" x' + f.count + '</span>'; }).join(' ') +
                '<br>' + FillerDetector.getFeedback(result) +
                '</div>';
            })() +
            '<div id="ims-ai-fb-' + idx + '"></div>';
        }
        listEl.appendChild(card);
      });

      // Wire self-grading buttons via event delegation
      listEl.addEventListener('click', function(e) {
        var btn = e.target.closest('.ims-grade-btn');
        if (!btn) return;
        var gradeDiv = btn.closest('.ims-self-grade');
        if (!gradeDiv) return;
        var qid = gradeDiv.dataset.qid;
        var grade = btn.dataset.grade;
        // Visual feedback
        gradeDiv.querySelectorAll('.ims-grade-btn').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        // Apply to SRS
        if (typeof SelfGrade !== 'undefined') {
          SelfGrade.apply(qid, grade);
          var labels = { nailed: 'Nailed it! This question will appear less often.', partial: 'Noted. This question stays on regular schedule.', missed: 'This question will appear again soon for more practice.' };
          window.showToast(labels[grade] || 'Rated!');
        }
      });
    }

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

      var displayLimit = 50;
      var shown = filtered.slice(0, displayLimit);

      shown.forEach(function(q) {
        var li = document.createElement('li');
        li.className = 'ims-bank-item';
        var isBookmarked = Progress.isBookmarked(q.id);
        var srsStatus = SRS.getStatus(q.id);
        li.innerHTML =
          '<div style="flex:1"><div class="ims-bank-q">' + escapeHtml(q.q) + '</div>' +
          '<div class="ims-bank-tags">' +
            '<span class="ims-bank-tag">' + (typeLabels[q.type] || q.type) + '</span>' +
            '<span class="ims-bank-tag">' + q.c.replace('-', ' ') + '</span>' +
            '<span class="ims-bank-tag">' + (diffLabels[q.d] || 'Medium') + '</span>' +
            '<span class="ims-bank-tag ims-srs-' + srsStatus.class + '">' + srsStatus.label + '</span>' +
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

    function renderProgressTab() {
      var stats = Progress.getStats();

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

      var start = new Date(today);
      start.setDate(start.getDate() - 34);
      var startDay = start.getDay();
      if (startDay === 0) startDay = 7;
      start.setDate(start.getDate() - (startDay - 1));

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

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    /* ========================================================================
     * STAR BUILDER SCORING (for guided STAR mode)
     * ======================================================================== */
    var STARBuilder = {
      // Score individual STAR components
      scoreComponent: function(text, component) {
        // component: 'situation', 'task', 'action', 'result'
        var words = text.trim().split(/\s+/).length;
        var score = 0;

        // Word count (each component should be 20-75 words)
        if (words < 5) return 2;
        if (words < 15) score += 8;
        else if (words <= 75) score += 15;
        else score += 10; // too verbose

        // Component-specific keywords
        var keywords = {
          situation: ['when', 'at', 'during', 'while', 'our team', 'the company', 'my role', 'working', 'project', 'department'],
          task: ['responsible', 'needed', 'goal', 'objective', 'asked', 'required', 'my job', 'challenge', 'assigned', 'expected'],
          action: ['i decided', 'i created', 'i built', 'i led', 'i implemented', 'i organized', 'i developed', 'i initiated', 'i proposed', 'i analyzed', 'i designed', 'i coordinated'],
          result: ['resulted', 'achieved', 'increased', 'decreased', 'reduced', 'improved', 'saved', 'generated', 'delivered', 'led to', '%', 'percent', 'revenue', 'efficiency']
        };

        var found = 0;
        var kw = keywords[component] || [];
        var lower = text.toLowerCase();
        kw.forEach(function(k) {
          if (lower.indexOf(k) >= 0) found++;
        });
        score += Math.min(10, found * 3);

        return Math.min(25, score);
      },

      // Score all 4 components combined
      scoreAll: function(situation, task, action, result) {
        return {
          structure: this.scoreComponent(situation, 'situation'),
          length: this.scoreComponent(task, 'task'), // reusing field names for compatibility
          specificity: this.scoreComponent(action, 'action'),
          relevance: this.scoreComponent(result, 'result'),
          total: 0 // calculated below
        };
      },

      // Get feedback per component
      getFeedback: function(text, component, score) {
        var words = text.trim().split(/\s+/).length;
        if (words < 5) return 'Too brief. Add more context about the ' + component + '.';
        if (score >= 20) return 'Strong ' + component + ' section!';
        if (score >= 12) return 'Good, but add more specific details.';

        var tips = {
          situation: 'Set the scene: When was this? What company/team? What was happening?',
          task: 'Clarify YOUR specific responsibility. What were you personally expected to do?',
          action: 'Use "I" not "we". List specific steps YOU took. Be concrete.',
          result: 'Add numbers! Percentages, dollar amounts, time saved, people impacted.'
        };
        return tips[component] || 'Add more detail.';
      },

      // Combine 4 fields into a single answer string (for storage/comparison)
      combineAnswer: function(situation, task, action, result) {
        var parts = [];
        if (situation.trim()) parts.push('Situation: ' + situation.trim());
        if (task.trim()) parts.push('Task: ' + task.trim());
        if (action.trim()) parts.push('Action: ' + action.trim());
        if (result.trim()) parts.push('Result: ' + result.trim());
        return parts.join('\n\n');
      }
    };

    /* ========================================================================
     * PITCH TIMER & SCORING
     * ======================================================================== */
    var PitchEngine = {
      STORAGE_KEY: 'tz_ims_pitches',

      // Pitch types with target durations and word counts
      types: {
        elevator: { name: '30-Second Elevator Pitch', seconds: 30, targetWords: [40, 60], description: 'Quick networking intro' },
        intro: { name: '60-Second Introduction', seconds: 60, targetWords: [80, 130], description: 'Phone screen opener' },
        story: { name: '2-Minute Career Story', seconds: 120, targetWords: [200, 300], description: 'Deep behavioral intro' }
      },

      // Template fields
      templateFields: [
        { id: 'background', label: 'Background', placeholder: "I'm a [role] with [X] years of experience in [industry/domain]", hint: 'Who are you professionally?' },
        { id: 'current', label: 'Current Role', placeholder: 'Currently at [company], I [key achievement or responsibility]', hint: 'What do you do now? Include a measurable achievement.' },
        { id: 'highlight', label: 'Key Achievement', placeholder: 'One accomplishment I\'m proud of is [specific result with numbers]', hint: 'Your strongest selling point. Use numbers.' },
        { id: 'why', label: 'Why This Role/Company', placeholder: 'I\'m excited about [company/role] because [specific reason]', hint: 'Show you researched them. Be specific.' },
        { id: 'goal', label: 'Goal', placeholder: 'I\'m looking to [career goal that aligns with this role]', hint: 'Connect your goal to what they need.' }
      ],

      // Score a pitch
      scorePitch: function(text, pitchType) {
        var config = this.types[pitchType];
        if (!config) return { total: 0 };

        var words = text.trim().split(/\s+/).length;
        var score = { wordCount: words, targetMin: config.targetWords[0], targetMax: config.targetWords[1] };

        // Length score (0-25)
        if (words >= config.targetWords[0] && words <= config.targetWords[1]) {
          score.length = 25;
        } else if (words < config.targetWords[0]) {
          score.length = Math.round((words / config.targetWords[0]) * 25);
        } else {
          score.length = Math.max(5, 25 - Math.round((words - config.targetWords[1]) / 10) * 3);
        }

        // Structure score (0-25) — checks for key components
        var lower = text.toLowerCase();
        var components = 0;
        if (/\b(i am|i'm|i have|my background|my experience|years? of|years? in)\b/i.test(lower)) components++;
        if (/\b(currently|at \w+|my role|i work|i lead|i manage)\b/i.test(lower)) components++;
        if (/\b(\d+%|increased|decreased|saved|generated|delivered|built|launched|improved)\b/i.test(lower)) components++;
        if (/\b(excited|passionate|interested|looking to|goal|future|grow|contribute)\b/i.test(lower)) components++;
        score.structure = Math.min(25, components * 7);

        // Specificity (0-25)
        var numbers = (lower.match(/\d+/g) || []).length;
        var namedEntities = (text.match(/\s[A-Z][a-z]+/g) || []).length;
        score.specificity = Math.min(25, numbers * 4 + namedEntities * 2 + 5);

        // Confidence markers (0-25)
        var confident = 0;
        if (!/\b(um|uh|like|basically|kind of|sort of|maybe|i guess|i think maybe)\b/i.test(lower)) confident += 10;
        if (/\b(i led|i drove|i built|i created|i achieved|i delivered)\b/i.test(lower)) confident += 8;
        if ((text.match(/\./g) || []).length >= 2) confident += 7; // complete sentences
        score.confidence = Math.min(25, confident);

        score.total = score.length + score.structure + score.specificity + score.confidence;
        return score;
      },

      // Save pitch to localStorage
      savePitch: function(pitchType, text, score) {
        try {
          var data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
          if (!data.pitches) data.pitches = {};
          data.pitches[pitchType] = {
            text: text,
            score: score,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch(e) {}
      },

      // Load saved pitch
      loadPitch: function(pitchType) {
        try {
          var data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
          return (data.pitches && data.pitches[pitchType]) || null;
        } catch(e) { return null; }
      }
    };

    /* ========================================================================
     * WPM CALCULATOR (Words Per Minute during practice)
     * ======================================================================== */
    var WPMTracker = {
      startTime: null,

      start: function() {
        this.startTime = Date.now();
      },

      getWPM: function(wordCount) {
        if (!this.startTime || wordCount < 5) return 0;
        var elapsedMin = (Date.now() - this.startTime) / 60000;
        if (elapsedMin < 0.1) return 0;
        return Math.round(wordCount / elapsedMin);
      },

      // Ideal speaking pace for interviews: 130-150 WPM
      getLabel: function(wpm) {
        if (wpm === 0) return '';
        if (wpm < 100) return 'Slow pace \u2014 try to be more fluent';
        if (wpm <= 150) return 'Good pace for interviews';
        if (wpm <= 180) return 'Slightly fast \u2014 slow down for clarity';
        return 'Too fast \u2014 interviewers may struggle to follow';
      }
    };

    /* ========================================================================
     * INTERVIEW JOURNAL (Post-interview tracking)
     * ======================================================================== */
    var Journal = {
      STORAGE_KEY: 'tz_ims_journal',

      load: function() {
        try {
          var raw = localStorage.getItem(this.STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
      },

      save: function(entries) {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
        } catch(e) {}
      },

      addEntry: function(entry) {
        // entry: { date, company, role, type, interviewer, questions, rating, outcome, notes }
        var entries = this.load();
        entry.id = 'j_' + Date.now();
        entry.createdAt = new Date().toISOString();
        entries.unshift(entry); // newest first
        if (entries.length > 200) entries = entries.slice(0, 200);
        this.save(entries);
        return entry;
      },

      updateEntry: function(id, updates) {
        var entries = this.load();
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].id === id) {
            Object.keys(updates).forEach(function(key) {
              entries[i][key] = updates[key];
            });
            entries[i].updatedAt = new Date().toISOString();
            break;
          }
        }
        this.save(entries);
      },

      deleteEntry: function(id) {
        var entries = this.load();
        entries = entries.filter(function(e) { return e.id !== id; });
        this.save(entries);
      },

      // Analyze patterns across all journal entries
      getPatterns: function() {
        var entries = this.load();
        if (entries.length === 0) return null;

        // Count question topics
        var topicCounts = {};
        entries.forEach(function(e) {
          if (e.questions) {
            var qs = e.questions.split('\n').filter(function(q) { return q.trim().length > 0; });
            qs.forEach(function(q) {
              var lower = q.toLowerCase();
              // Simple topic detection
              var topics = ['leadership', 'teamwork', 'conflict', 'failure', 'weakness', 'strength',
                'challenge', 'pressure', 'deadline', 'technical', 'system design', 'coding',
                'tell me about yourself', 'why this company', 'salary', 'management', 'communication'];
              topics.forEach(function(t) {
                if (lower.indexOf(t) >= 0) {
                  topicCounts[t] = (topicCounts[t] || 0) + 1;
                }
              });
            });
          }
        });

        // Sort by frequency
        var sorted = Object.keys(topicCounts).map(function(t) {
          return { topic: t, count: topicCounts[t] };
        }).sort(function(a, b) { return b.count - a.count; });

        // Outcome stats
        var outcomes = { passed: 0, rejected: 0, pending: 0 };
        entries.forEach(function(e) {
          if (e.outcome === 'passed') outcomes.passed++;
          else if (e.outcome === 'rejected') outcomes.rejected++;
          else outcomes.pending++;
        });

        return {
          totalInterviews: entries.length,
          topTopics: sorted.slice(0, 5),
          outcomes: outcomes,
          avgRating: entries.reduce(function(s, e) { return s + (e.rating || 0); }, 0) / entries.length
        };
      }
    };

    /* ========================================================================
     * COMPANY PREP MODULE
     * ======================================================================== */
    var CompanyPrep = {
      STORAGE_KEY: 'tz_ims_company_prep',

      // Checklist items (static)
      checklist: [
        { id: 'mission', label: 'Research company mission and values', tip: 'Check their About page and annual report' },
        { id: 'news', label: 'Find 3 recent news articles about the company', tip: 'Google News, TechCrunch, industry publications' },
        { id: 'product', label: 'Try their product/service yourself', tip: 'First-hand experience shows genuine interest' },
        { id: 'why', label: 'Prepare your "Why this company?" answer', tip: 'Use the builder below to structure your answer' },
        { id: 'interviewer', label: 'Research the interviewer on LinkedIn', tip: 'Find common ground, shared interests, their background' },
        { id: 'questions', label: 'Prepare 3 thoughtful questions to ask', tip: 'About team culture, growth, current challenges' },
        { id: 'dress', label: 'Plan your outfit (match company culture)', tip: 'Business formal for finance/law, smart casual for tech/startups' },
        { id: 'logistics', label: 'Confirm date, time, location/link', tip: 'Test video call software beforehand if remote' }
      ],

      // Load saved prep for a company
      load: function(company) {
        try {
          var data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
          return data[company.toLowerCase().trim()] || { checked: {}, whyAnswer: '' };
        } catch(e) { return { checked: {}, whyAnswer: '' }; }
      },

      // Save prep for a company
      save: function(company, prepData) {
        try {
          var data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
          data[company.toLowerCase().trim()] = prepData;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch(e) {}
      }
    };

    /* ========================================================================
     * DELIVERY COACHING TIPS DATA
     * ======================================================================== */
    var DeliveryTips = {
      general: [
        'Speak at 130-150 words per minute \u2014 this is the ideal interview pace',
        'Pause for 1-2 seconds between STAR sections to let points sink in',
        'Avoid filler words: um, uh, like, basically, literally, you know, sort of, kind of',
        'Use "I" instead of "we" to highlight YOUR contributions',
        'End answers confidently \u2014 don\'t trail off or say "...so yeah"'
      ],
      behavioral: [
        'Maintain eye contact (or look at camera if video)',
        'Use hand gestures to emphasize key points',
        'Smile when describing positive outcomes',
        'Keep answers to 2-3 minutes maximum'
      ],
      technical: [
        'Think aloud \u2014 explain your reasoning process',
        'Ask clarifying questions before diving into the answer',
        'Structure: understand \u2192 plan \u2192 execute \u2192 test/verify',
        'It\'s OK to say "Let me think about that for a moment"'
      ],
      caseStudy: [
        'Repeat the question back to confirm understanding',
        'State your framework before diving into analysis',
        'Round numbers for easier mental math',
        'Summarize your conclusion at the end'
      ],
      panel: [
        'Address each panelist by name when possible',
        'Make eye contact with the person who asked the question, then scan others',
        'Pivot your body toward whoever you\'re addressing',
        'Don\'t fixate on one person \u2014 include everyone'
      ],
      phoneScreen: [
        'Stand up or sit straight \u2014 posture affects vocal energy',
        'Smile while speaking \u2014 it\'s audible in your voice',
        'Have your resume and notes visible (they can\'t see you)',
        'Keep a glass of water nearby'
      ],
      finalRound: [
        'Show executive presence \u2014 confident, composed, strategic',
        'Connect your answers to business impact and company goals',
        'Demonstrate you\'ve done deep research on the company',
        'Ask forward-looking questions about team vision and goals'
      ]
    };

    /* ========================================================================
     * GAP 1: SELF-GRADING (Active Recall completion)
     * After seeing model answer, user rates: Nailed / Partial / Missed
     * This feeds back into SRS — self-grading adjusts future scheduling
     * Science: Self-testing + judgment improves retention (Kornell & Son, 2009)
     * ======================================================================== */
    var SelfGrade = {
      // Adjust SRS based on self-grade (supplements the auto-score)
      apply: function(questionId, grade) {
        // grade: 'nailed' (boost interval), 'partial' (keep), 'missed' (reset)
        var card = SRS.getCard(questionId);
        if (grade === 'nailed') {
          card.easeFactor = Math.min(3.0, card.easeFactor + 0.15);
          card.interval = Math.round(card.interval * 1.3);
        } else if (grade === 'missed') {
          card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
          card.interval = 1;
          card.repetitions = 0;
        }
        // 'partial' — no change, keep current schedule
        SRS.save();
        return card;
      }
    };

    /* ========================================================================
     * GAP 2: MULTIPLE FRAMEWORKS
     * Beyond STAR: CIRCLES (PM), RICE (prioritization), MECE (consulting),
     * Porter's 5 Forces, SOAR, PAR, CAR
     * Science: Chunking — frameworks reduce cognitive load (Miller, 1956)
     * ======================================================================== */
    var Frameworks = {
      definitions: {
        STAR: {
          name: 'STAR Method',
          for: 'Behavioral questions',
          steps: ['Situation — Set the context', 'Task — Your specific responsibility', 'Action — Steps YOU took', 'Result — Measurable outcome'],
          fields: ['situation', 'task', 'action', 'result'],
          tip: 'Use first person "I". Quantify results with numbers.'
        },
        CIRCLES: {
          name: 'CIRCLES Framework',
          for: 'Product management / design questions',
          steps: ['Comprehend the situation', 'Identify the customer', 'Report customer needs', 'Cut through prioritization', 'List solutions', 'Evaluate trade-offs', 'Summarize recommendation'],
          fields: ['comprehend', 'customer', 'needs', 'prioritize', 'solutions', 'tradeoffs', 'summary'],
          tip: 'Start by asking clarifying questions. Think user-first.'
        },
        RICE: {
          name: 'RICE Scoring',
          for: 'Prioritization questions',
          steps: ['Reach — How many users affected?', 'Impact — How much improvement per user?', 'Confidence — How sure are you?', 'Effort — How much work to build?'],
          fields: ['reach', 'impact', 'confidence', 'effort'],
          tip: 'Score = (Reach × Impact × Confidence) / Effort'
        },
        MECE: {
          name: 'MECE Framework',
          for: 'Case study / consulting questions',
          steps: ['Mutually Exclusive — No overlapping categories', 'Collectively Exhaustive — All possibilities covered', 'Break problem into independent segments', 'Analyze each segment systematically'],
          fields: ['segment1', 'segment2', 'segment3', 'analysis'],
          tip: 'Draw a tree structure. Each branch must not overlap.'
        },
        PORTER: {
          name: 'Porter\'s 5 Forces',
          for: 'Market analysis / strategy questions',
          steps: ['Threat of new entrants', 'Bargaining power of suppliers', 'Bargaining power of buyers', 'Threat of substitutes', 'Industry rivalry'],
          fields: ['entrants', 'suppliers', 'buyers', 'substitutes', 'rivalry'],
          tip: 'Rate each force High/Medium/Low and explain why.'
        },
        SOAR: {
          name: 'SOAR Method',
          for: 'Achievement / accomplishment questions',
          steps: ['Situation — The challenge', 'Obstacle — What stood in the way', 'Action — How you overcame it', 'Result — The positive outcome'],
          fields: ['situation', 'obstacle', 'action', 'result'],
          tip: 'Emphasize the obstacle to make your action more impressive.'
        }
      },

      // Recommend the best framework for a question type
      recommend: function(questionType, competency) {
        if (questionType === 'behavioral') return 'STAR';
        if (questionType === 'caseStudy') return 'MECE';
        if (questionType === 'technical' && competency === 'analytical') return 'RICE';
        if (questionType === 'situational') return 'SOAR';
        if (questionType === 'panel') return 'STAR';
        if (questionType === 'finalRound') return 'PORTER';
        return 'STAR';
      },

      // Get framework details
      get: function(name) {
        return this.definitions[name] || this.definitions.STAR;
      },

      // List all framework names
      list: function() {
        return Object.keys(this.definitions);
      }
    };

    /* ========================================================================
     * GAP 3: PROJECT / PORTFOLIO DEFENSE
     * Structured template for "Walk me through a project" questions
     * Science: Elaborative rehearsal of own work deepens ownership
     * ======================================================================== */
    var ProjectDefense = {
      STORAGE_KEY: 'tz_ims_projects',

      template: {
        fields: [
          { id: 'name', label: 'Project Name', placeholder: 'e.g. Customer Dashboard Redesign', rows: 1 },
          { id: 'context', label: 'Context & Problem', placeholder: 'What was the business problem? Why did this project exist?', rows: 2 },
          { id: 'role', label: 'Your Role', placeholder: 'What was your specific role? Title, responsibilities, team size.', rows: 2 },
          { id: 'approach', label: 'Technical Approach', placeholder: 'What architecture/tech/methodology did you choose and WHY?', rows: 3 },
          { id: 'tradeoffs', label: 'Trade-offs & Decisions', placeholder: 'What alternatives did you consider? Why did you choose this path?', rows: 2 },
          { id: 'challenges', label: 'Challenges & How You Overcame Them', placeholder: 'What went wrong? What was hardest? How did you solve it?', rows: 2 },
          { id: 'impact', label: 'Impact & Results', placeholder: 'Measurable outcomes: revenue, users, performance, time saved. Use numbers.', rows: 2 },
          { id: 'change', label: 'What Would You Do Differently?', placeholder: 'Hindsight improvements. Shows self-awareness and growth mindset.', rows: 2 },
          { id: 'learnings', label: 'Key Learnings', placeholder: 'What did you learn? How did it make you a better professional?', rows: 2 }
        ],
        followUpQuestions: [
          'How would you scale this to 10x the users?',
          'What was the biggest technical risk and how did you mitigate it?',
          'If you had unlimited resources, what would you add?',
          'How did you handle disagreements within the team?',
          'What metrics did you track to measure success?',
          'How did you communicate progress to stakeholders?',
          'What would you do differently with more time?'
        ]
      },

      // Save a project
      save: function(project) {
        try {
          var projects = this.loadAll();
          var existing = projects.findIndex(function(p) { return p.id === project.id; });
          if (existing >= 0) {
            projects[existing] = project;
          } else {
            project.id = 'proj_' + Date.now();
            project.createdAt = new Date().toISOString();
            projects.unshift(project);
          }
          if (projects.length > 20) projects = projects.slice(0, 20);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
        } catch(e) {}
        return project;
      },

      loadAll: function() {
        try {
          var raw = localStorage.getItem(this.STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
      },

      delete: function(id) {
        var projects = this.loadAll().filter(function(p) { return p.id !== id; });
        try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects)); } catch(e) {}
      }
    };

    /* ========================================================================
     * GAP 4: SALARY NEGOTIATION TRAINER
     * Structured roleplay: offer → counter → response
     * Science: Scripted rehearsal reduces anxiety (Bandura, 1977)
     * ======================================================================== */
    var NegotiationTrainer = {
      scenarios: [
        {
          id: 'initial_offer',
          name: 'Responding to Initial Offer',
          prompt: 'The recruiter says: "We\'d like to offer you the position at $95,000 base salary with standard benefits. How does that sound?"',
          tips: [
            'Never accept the first offer immediately — even if it\'s good',
            'Express enthusiasm for the role first',
            'Ask for time: "I\'m very excited about this opportunity. Could I have a couple of days to review the full package?"',
            'Research market rate before responding with a counter'
          ],
          frameworkSteps: ['Express gratitude', 'Show enthusiasm', 'Ask for the complete package in writing', 'Request 2-3 days to review', 'Prepare your counter-offer with data']
        },
        {
          id: 'counter_offer',
          name: 'Making a Counter-Offer',
          prompt: 'You\'ve researched the market rate ($105K-$120K for your level). Time to make your counter-offer. What do you say?',
          tips: [
            'Anchor high but reasonable — ask for the top of the range',
            'Use specific numbers, not ranges (ranges anchor to the low end)',
            'Justify with data: "Based on my research and experience..."',
            'Focus on total compensation, not just base salary'
          ],
          frameworkSteps: ['State your target number', 'Justify with market data + your unique value', 'Mention competing offers if you have them', 'Suggest non-salary alternatives (signing bonus, equity, remote)']
        },
        {
          id: 'pushback',
          name: 'Handling Pushback',
          prompt: 'The recruiter says: "Unfortunately, $95K is the maximum we can offer for this role. Our budget is fixed."',
          tips: [
            'Don\'t take "no" as final — explore alternatives',
            'Ask: "Is there flexibility in signing bonus, equity, or review timeline?"',
            'Propose: "What if we agreed on a 6-month performance review with a defined path to $X?"',
            'Never make ultimatums unless you\'re willing to walk away'
          ],
          frameworkSteps: ['Acknowledge their constraint', 'Pivot to non-salary compensation', 'Propose accelerated review timeline', 'Ask about equity, bonus, or benefits flexibility', 'Get any verbal commitments in writing']
        },
        {
          id: 'multiple_offers',
          name: 'Leveraging Multiple Offers',
          prompt: 'You have another offer at $110K. How do you use this ethically in negotiation?',
          tips: [
            'Be honest — never fabricate offers',
            'Frame it positively: "I have another strong offer, but your company is my first choice because..."',
            'Give them a chance to match, not an ultimatum',
            'Set a deadline: "I need to respond to them by Friday"'
          ],
          frameworkSteps: ['Reaffirm your preference for this company', 'Mention the competing offer honestly', 'Ask if they can get closer to that number', 'Set a reasonable deadline', 'Be prepared to choose']
        }
      ],

      getScenario: function(id) {
        for (var i = 0; i < this.scenarios.length; i++) {
          if (this.scenarios[i].id === id) return this.scenarios[i];
        }
        return this.scenarios[0];
      }
    };

    /* ========================================================================
     * GAP 5: WHITEBOARD / CANVAS for visual thinking
     * Simple drawing canvas for system design, flowcharts, diagrams
     * Science: Dual coding — visual + verbal = 2x encoding (Paivio, 1986)
     * ======================================================================== */
    var Whiteboard = {
      canvas: null,
      ctx: null,
      drawing: false,
      color: 'var(--heading)',
      lineWidth: 2,
      history: [],

      init: function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        var self = this;
        // Mouse events
        this.canvas.addEventListener('mousedown', function(e) { self.startDraw(e); });
        this.canvas.addEventListener('mousemove', function(e) { self.draw(e); });
        this.canvas.addEventListener('mouseup', function() { self.stopDraw(); });
        this.canvas.addEventListener('mouseleave', function() { self.stopDraw(); });
        // Touch events
        this.canvas.addEventListener('touchstart', function(e) { e.preventDefault(); self.startDraw(e.touches[0]); });
        this.canvas.addEventListener('touchmove', function(e) { e.preventDefault(); self.draw(e.touches[0]); });
        this.canvas.addEventListener('touchend', function() { self.stopDraw(); });
      },

      resize: function() {
        if (!this.canvas) return;
        var rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = Math.max(300, rect.width * 0.5);
        // Restore drawing after resize
        this.redraw();
      },

      startDraw: function(e) {
        this.drawing = true;
        var pos = this.getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        // Save state for undo
        this.history.push(this.canvas.toDataURL());
        if (this.history.length > 30) this.history.shift();
      },

      draw: function(e) {
        if (!this.drawing) return;
        var pos = this.getPos(e);
        // Get computed color from CSS variable
        var style = getComputedStyle(document.documentElement);
        this.ctx.strokeStyle = style.getPropertyValue('--heading').trim() || '#ffffff';
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      },

      stopDraw: function() {
        this.drawing = false;
      },

      getPos: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        return {
          x: (e.clientX || e.pageX) - rect.left,
          y: (e.clientY || e.pageY) - rect.top
        };
      },

      clear: function() {
        if (!this.ctx) return;
        this.history.push(this.canvas.toDataURL());
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      },

      undo: function() {
        if (this.history.length === 0) return;
        var img = new Image();
        var self = this;
        img.onload = function() {
          self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
          self.ctx.drawImage(img, 0, 0);
        };
        img.src = this.history.pop();
      },

      redraw: function() {
        // placeholder for restore after resize
      },

      toImage: function() {
        if (!this.canvas) return null;
        return this.canvas.toDataURL('image/png');
      }
    };

    /* ========================================================================
     * GAP 6: FILLER WORD DETECTOR
     * Scans typed answers for filler words and phrases
     * Science: Awareness of verbal habits is first step to correction
     * ======================================================================== */
    var FillerDetector = {
      fillers: [
        'um', 'uh', 'like', 'basically', 'literally', 'you know',
        'sort of', 'kind of', 'i mean', 'i guess', 'actually',
        'honestly', 'right', 'so yeah', 'and stuff', 'or whatever',
        'i think maybe', 'in terms of', 'at the end of the day',
        'to be honest', 'the thing is'
      ],

      // Detect fillers in text, return array of { filler, count, positions }
      detect: function(text) {
        if (!text) return { fillers: [], total: 0, cleanScore: 100 };
        var lower = text.toLowerCase();
        var found = [];
        var total = 0;

        this.fillers.forEach(function(f) {
          var regex = new RegExp('\\b' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
          var matches = lower.match(regex);
          if (matches && matches.length > 0) {
            found.push({ filler: f, count: matches.length });
            total += matches.length;
          }
        });

        // Clean score: 100 = no fillers, decreases by 5 per filler
        var words = text.trim().split(/\s+/).length;
        var fillerRatio = words > 0 ? (total / words) * 100 : 0;
        var cleanScore = Math.max(0, Math.round(100 - fillerRatio * 20));

        found.sort(function(a, b) { return b.count - a.count; });
        return { fillers: found, total: total, cleanScore: cleanScore, ratio: Math.round(fillerRatio * 10) / 10 };
      },

      // Get feedback message
      getFeedback: function(result) {
        if (result.total === 0) return 'Excellent! No filler words detected. Your answer sounds confident and polished.';
        if (result.total <= 2) return 'Good. Only ' + result.total + ' filler word(s) found. Minor cleanup needed.';
        if (result.total <= 5) return 'Watch out for filler words (' + result.total + ' found). Common ones: ' + result.fillers.slice(0, 3).map(function(f) { return '"' + f.filler + '"'; }).join(', ') + '. Practice saying your answer without these.';
        return 'Too many filler words (' + result.total + ' found). This weakens your perceived confidence. Practice your answer aloud and consciously remove: ' + result.fillers.slice(0, 3).map(function(f) { return '"' + f.filler + '"'; }).join(', ');
      }
    };

    /* ========================================================================
     * EVENT WIRING
     * ======================================================================== */
