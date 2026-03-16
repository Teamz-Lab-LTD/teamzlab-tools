---
name: 76 pages with hardcoded hex colors (Rule #1 violation)
description: Complete list of pages using hardcoded hex colors instead of CSS design tokens. Most have #fff on accent backgrounds. Fix in batches.
type: project
---

# Pages With Hardcoded Colors (76 total, as of 2026-03-17)

**Why:** CLAUDE.md Rule #1 forbids hardcoded colors. The accent color is neon — white text (#fff) on it is invisible. Must use var(--bg) or #000 on accent backgrounds.

**How to apply:** Fix these in batches by category. Run `grep -r '#[0-9a-fA-F]\{3,6\}' --include="*.html" <file>` to find exact lines.

## AI Tools (8 pages)
- ai/grammar-checker/index.html
- ai/headline-generator/index.html
- ai/interview-question-generator/index.html
- ai/language-detector/index.html
- ai/private-translator/index.html
- ai/prompt-cleaner/index.html
- ai/resume-summary-generator/index.html
- ai/synonym-finder/index.html

## Tools/Utilities (30 pages)
- tools/ai-zero-shot-classifier/index.html
- tools/ai-audio-classifier/index.html
- tools/ai-sentiment-analyzer/index.html
- tools/ai-ocr/index.html
- tools/ai-image-classifier/index.html
- tools/ai-image-segmentation/index.html
- tools/ai-document-qa/index.html
- tools/ai-keyword-extractor/index.html
- tools/ai-translator/index.html
- tools/ai-image-captioner/index.html
- tools/ai-depth-map/index.html
- tools/ai-text-to-speech/index.html
- tools/ai-background-remover/index.html
- tools/ai-named-entity-extractor/index.html
- tools/ai-emotion-detector/index.html
- tools/face-detection/index.html
- tools/habit-streak-tracker/index.html
- tools/job-application-tracker/index.html
- tools/spin-wheel/index.html
- tools/daily-planner/index.html
- tools/voice-to-text/index.html
- tools/quick-notes-pad/index.html
- tools/subscription-tracker/index.html
- tools/random-name-picker/index.html
- tools/personal-budget-tracker/index.html
- tools/youtube-thumbnail-grabber/index.html
- tools/reaction-time-test/index.html
- tools/decision-maker/index.html
- tools/signature-maker/index.html
- tools/gif-maker/index.html
- tools/typing-speed-test/index.html
- tools/focus-timer/index.html

## Music (6 pages)
- music/chord-progression-generator/index.html
- music/bpm-tapper/index.html
- music/practice-timer/index.html
- music/time-signature-explainer/index.html

## Diagnostic (12 pages)
- diagnostic/metronome/index.html
- diagnostic/photo-booth/index.html
- diagnostic/tone-generator/index.html
- diagnostic/background-color-detector/index.html
- diagnostic/wifi-qr-code-generator/index.html
- diagnostic/online-tuner/index.html
- diagnostic/sound-level-meter/index.html
- diagnostic/webcam-mic-tester/index.html
- diagnostic/mirror-camera/index.html
- diagnostic/dns-lookup/index.html
- diagnostic/microphone-volume-meter/index.html
- diagnostic/passport-photo-maker/index.html
- diagnostic/white-noise-generator/index.html

## Football (3 pages)
- football/ucl-all-time-stats/index.html
- football/penalty-shootout-simulator/index.html
- football/ucl-bracket-predictor/index.html

## Dev (4 pages)
- dev/code-secret-scanner/index.html
- dev/csv-to-json/index.html
- dev/hash-generator/index.html
- dev/json-to-csv/index.html

## Evergreen (6 pages)
- evergreen/gpa-calculator/index.html
- evergreen/grade-calculator/index.html
- evergreen/invoice-generator/index.html
- evergreen/pomodoro-timer/index.html
- evergreen/pregnancy-due-date-calculator/index.html
- evergreen/scientific-calculator/index.html

## Text (4 pages)
- text/keyword-density-checker/index.html
- text/open-graph-previewer/index.html
- text/passive-voice-checker/index.html
- text/syllable-counter/index.html
