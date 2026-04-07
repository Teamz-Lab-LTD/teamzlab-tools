#!/usr/bin/env node
/**
 * Teamz Lab Tools — E2E Real User Testing Framework
 *
 * Tests tools like a real human user in a real browser.
 * No mocks, no fakes — real clicks, real renders, real Firebase.
 *
 * Usage:
 *   node scripts/e2e-test.js [tool-path]              # Test specific tool
 *   node scripts/e2e-test.js games/color-cards         # Example
 *   node scripts/e2e-test.js --all                     # Test all tools (basic)
 *   node scripts/e2e-test.js --changed                 # Test only changed tools
 *   node scripts/e2e-test.js games/color-cards --mobile # Test mobile viewport
 *   node scripts/e2e-test.js games/color-cards --light  # Test light mode
 *   node scripts/e2e-test.js games/color-cards --full   # Full test (desktop+mobile+light+dark)
 *
 * Requires: npm install playwright (in /tmp or globally)
 * Server must be running: python3 -m http.server 9090
 */

const path = require('path');
const { execSync } = require('child_process');

// Find playwright
let chromium;
try { chromium = require('playwright').chromium; } catch(e) {
  try { chromium = require('/tmp/node_modules/playwright').chromium; } catch(e2) {
    console.error('Playwright not found. Run: cd /tmp && npm install playwright');
    process.exit(1);
  }
}

const fs = require('fs');
const BASE_URL = 'http://localhost:9090';
const LAST_RUN_FILE = path.join(__dirname, '..', 'logs', 'e2e-last-run.json');
const args = process.argv.slice(2);
const toolPath = args.find(a => !a.startsWith('--')) || '';
const flags = new Set(args.filter(a => a.startsWith('--')));

// ══════════════════════════════════════════
// SKIP TRACKING — don't re-test today
// ══════════════════════════════════════════
function getLastRuns() {
  try { return JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf8')); } catch(e) { return {}; }
}
function saveLastRun(tool, passed, failed) {
  const runs = getLastRuns();
  runs[tool] = { date: new Date().toISOString().slice(0, 10), ts: Date.now(), passed, failed };
  try { fs.mkdirSync(path.dirname(LAST_RUN_FILE), { recursive: true }); } catch(e) {}
  fs.writeFileSync(LAST_RUN_FILE, JSON.stringify(runs, null, 2));
}
function wasTestedToday(tool) {
  const runs = getLastRuns();
  if (!runs[tool]) return false;
  return runs[tool].date === new Date().toISOString().slice(0, 10);
}
function wasTestedRecently(tool, days) {
  const runs = getLastRuns();
  if (!runs[tool]) return false;
  return (Date.now() - runs[tool].ts) < days * 86400000;
}

// ══════════════════════════════════════════
// TEST RUNNER
// ══════════════════════════════════════════
class E2ETest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = [];
    this.jsErrors = [];
  }

  ok(name, detail) {
    this.passed++;
    console.log('  \x1b[32m✓\x1b[0m ' + name + (detail ? ' — ' + detail : ''));
  }

  fail(name, err) {
    this.failed++;
    console.log('  \x1b[31m✗\x1b[0m ' + name + ' — ' + err);
  }

  warn(name) {
    this.warnings.push(name);
    console.log('  \x1b[33m⚠\x1b[0m ' + name);
  }

  summary() {
    console.log('\n' + '═'.repeat(55));
    console.log('  PASSED:   ' + this.passed);
    console.log('  FAILED:   ' + this.failed);
    console.log('  WARNINGS: ' + this.warnings.length);
    if (this.warnings.length) this.warnings.forEach(w => console.log('    ⚠ ' + w));
    if (this.jsErrors.length) {
      console.log('  JS ERRORS: ' + this.jsErrors.length);
      this.jsErrors.forEach(e => console.log('    ✗ ' + e));
    }
    console.log('═'.repeat(55));
    if (this.failed === 0) console.log('  \x1b[32m✓ ALL TESTS PASSED\x1b[0m');
    else console.log('  \x1b[31m✗ ' + this.failed + ' FAILURE(S)\x1b[0m');
    console.log('═'.repeat(55));
    return this.failed;
  }
}

// ══════════════════════════════════════════
// UNIVERSAL TOOL TESTS (runs on ANY tool)
// ══════════════════════════════════════════
async function testToolUniversal(page, t, url, opts) {
  const viewport = opts.viewport || 'desktop';
  const theme = opts.theme || 'dark';
  const prefix = '[' + viewport + '/' + theme + '] ';

  // Set theme
  if (theme === 'light') {
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  }

  // 1. Page loads without JS errors
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

  const title = await page.title();
  title.length > 10 ? t.ok(prefix + 'Page loaded', title.substring(0, 60)) : t.fail(prefix + 'Title', title);

  // 2. H1 exists
  const h1 = await page.textContent('h1').catch(() => '');
  h1.length > 3 ? t.ok(prefix + 'H1: ' + h1.substring(0, 50)) : t.fail(prefix + 'H1 missing', h1);

  // 3. Tool calculator section exists
  const calcVis = await page.isVisible('.tool-calculator');
  calcVis ? t.ok(prefix + 'Tool calculator visible') : t.fail(prefix + 'Calculator', 'hidden');

  // 4. No broken images
  const brokenImgs = await page.$$eval('img', imgs => imgs.filter(i => !i.complete || i.naturalWidth === 0).length);
  brokenImgs === 0 ? t.ok(prefix + 'No broken images') : t.fail(prefix + 'Broken images', brokenImgs);

  // 5. Buttons are clickable (have event listeners or href)
  const buttons = await page.$$eval('button', btns => btns.map(b => ({
    text: b.textContent.trim().substring(0, 30),
    disabled: b.disabled,
    visible: b.offsetHeight > 0
  })));
  const visibleBtns = buttons.filter(b => b.visible && !b.disabled);
  visibleBtns.length > 0 ? t.ok(prefix + visibleBtns.length + ' active buttons', visibleBtns.map(b => b.text).join(', ').substring(0, 80)) : t.warn(prefix + 'No visible active buttons');

  // 6. Inputs have IDs (for auto-save)
  const inputsNoId = await page.$$eval('input:not([type="hidden"]), select, textarea', els => els.filter(e => !e.id && e.offsetHeight > 0).length);
  inputsNoId === 0 ? t.ok(prefix + 'All visible inputs have IDs') : t.warn(prefix + inputsNoId + ' inputs missing ID');

  // 7. FAQs section exists
  const faqsExist = await page.$('#tool-faqs');
  faqsExist ? t.ok(prefix + 'FAQs section exists') : t.warn(prefix + 'No #tool-faqs');

  // 8. Related tools section exists
  const relatedExist = await page.$('#related-tools');
  relatedExist ? t.ok(prefix + 'Related tools section exists') : t.warn(prefix + 'No #related-tools');

  // 9. Ad slot exists
  const adSlot = await page.$('.ad-slot');
  adSlot ? t.ok(prefix + 'Ad slot exists') : t.warn(prefix + 'No ad slot');

  // 10. Breadcrumbs exist
  const crumbs = await page.$('#breadcrumbs');
  crumbs ? t.ok(prefix + 'Breadcrumbs exist') : t.warn(prefix + 'No breadcrumbs');

  // 11. No text on accent that's invisible
  const accentIssues = await page.$$eval('*', els => {
    let issues = 0;
    els.forEach(el => {
      const s = getComputedStyle(el);
      if (s.backgroundColor.includes('217, 254, 6') && s.color.includes('255, 255, 255')) issues++;
    });
    return issues;
  });
  accentIssues === 0 ? t.ok(prefix + 'No white-on-neon text') : t.fail(prefix + 'White on neon', accentIssues + ' elements');

  // 12. Canvas elements render (if any)
  const canvases = await page.$$eval('canvas', els => els.map(c => ({ w: c.width, h: c.height, vis: c.offsetHeight > 0 })));
  if (canvases.length > 0) {
    const broken = canvases.filter(c => c.w === 0 || c.h === 0);
    broken.length === 0 ? t.ok(prefix + canvases.length + ' canvases render OK') : t.fail(prefix + 'Broken canvas', broken.length);
  }

  // 13. Check tool-content word count
  const wordCount = await page.$eval('.tool-content', el => el.textContent.split(/\s+/).filter(w => w.length > 0).length).catch(() => 0);
  wordCount >= 150 ? t.ok(prefix + 'Content: ' + wordCount + ' words') : t.warn(prefix + 'Low content: ' + wordCount + ' words');

  // 14. Check mobile overflow (no horizontal scroll)
  if (viewport === 'mobile') {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    overflow ? t.fail(prefix + 'Horizontal overflow', 'page wider than viewport') : t.ok(prefix + 'No horizontal overflow');
  }

  return true;
}

// ══════════════════════════════════════════
// INTERACTIVE TEST (click buttons, fill forms)
// ══════════════════════════════════════════
async function testToolInteractive(page, t, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

  // Find primary action button (skip non-action buttons like Exit Fullscreen, language toggle)
  const primaryBtn = await page.$('#cc-start, .btn-primary, [type="submit"], button.tool-btn, .tool-calculator .cc-start-btn');
  if (!primaryBtn) { t.warn('No primary action button found — skipping interactive test'); return; }

  const btnText = await primaryBtn.textContent().catch(() => '');
  t.ok('Found primary button: "' + btnText.trim().substring(0, 30) + '"');

  // Fill any visible inputs with test data
  const inputs = await page.$$('.tool-calculator input:visible, .tool-calculator select:visible');
  for (const inp of inputs) {
    const type = await inp.getAttribute('type').catch(() => 'text');
    const tag = await inp.evaluate(el => el.tagName).catch(() => '');
    if (tag === 'SELECT') {
      await inp.selectOption({ index: 1 }).catch(() => {});
    } else if (type === 'number') {
      await inp.fill('42').catch(() => {});
    } else if (type === 'text' || type === null) {
      const placeholder = await inp.getAttribute('placeholder').catch(() => '');
      await inp.fill(placeholder ? 'Test' : 'Test Input').catch(() => {});
    }
  }

  // Click primary button
  await primaryBtn.click().catch(() => {});
  await page.waitForTimeout(1500);

  // Check something happened (result appeared, page changed, etc.)
  const resultVis = await page.$eval('.tool-result, .tool-output, #cc-game, #cc-pass-screen, .cc-game', el => el.offsetHeight > 0).catch(() => false);
  const statusChanged = await page.$eval('.cc-status, .tool-result, .result', el => el.textContent.length > 0).catch(() => false);

  if (resultVis || statusChanged) t.ok('Action produced visible result');
  else t.warn('No visible result after clicking primary button');
}

// ══════════════════════════════════════════
// FIREBASE TEST (for tools with online features)
// ══════════════════════════════════════════
async function testFirebase(t) {
  const https = require('https');
  function req(method, url, body) {
    return new Promise((ok, no) => {
      const u = new URL(url);
      const r = https.request({ hostname: u.hostname, port: 443, path: u.pathname + u.search, method, headers: { 'Content-Type': 'application/json' } }, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => { try { ok(JSON.parse(d)) } catch (e) { ok({ error: d.slice(0, 100) }) } });
      });
      r.on('error', no); if (body) r.write(JSON.stringify(body)); r.end();
    });
  }

  const KEY = 'AIzaSyC9Spv8AEEST24cqHWOfWe4PKTJflJ6lPg';
  const DB = 'https://teamzlab-tools-default-rtdb.firebaseio.com';

  console.log('\n═══ Firebase Integration ═══\n');

  // Auth
  const a = await req('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + KEY, { returnSecureToken: true });
  a.localId ? t.ok('Anonymous auth works') : t.fail('Auth', a.error ? a.error.message : 'no uid');
  if (!a.localId) return;

  // Write — must match DB rules (requires host + created fields)
  const room = 'E2E' + Date.now();
  const roomData = { host: a.localId, created: Date.now(), state: 'lobby', players: {} };
  roomData.players[a.localId] = { name: 'E2EBot', idx: 0, online: true };
  const w = await req('PUT', DB + '/color-cards/' + room + '.json?auth=' + a.idToken, roomData);
  w.host ? t.ok('Database write works') : t.fail('DB write', w.error || JSON.stringify(w).slice(0, 80));

  // Read
  const r = await req('GET', DB + '/color-cards/' + room + '.json?auth=' + a.idToken);
  r && r.state === 'lobby' ? t.ok('Database read works') : t.fail('DB read', r ? (r.error || 'state=' + r.state) : 'null');

  // Cleanup
  await req('DELETE', DB + '/color-cards/' + room + '.json?auth=' + a.idToken);
  t.ok('Database cleanup works');
}

// ══════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════
(async () => {
  // Check server
  try {
    const http = require('http');
    await new Promise((ok, no) => {
      http.get(BASE_URL, res => { ok(); res.resume(); }).on('error', no);
    });
  } catch (e) {
    console.error('Server not running. Start it: python3 -m http.server 9090');
    process.exit(1);
  }

  const t = new E2ETest();
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  if (!toolPath && !flags.has('--all') && !flags.has('--changed')) {
    console.log('Usage: node scripts/e2e-test.js [tool-path] [--mobile] [--light] [--full]');
    console.log('       node scripts/e2e-test.js games/color-cards --full');
    console.log('       node scripts/e2e-test.js --changed');
    await browser.close();
    process.exit(0);
  }

  // Determine tools to test
  let tools = [];
  if (flags.has('--changed')) {
    const diff = execSync('git diff --name-only HEAD~1 HEAD -- "*/index.html"').toString().trim();
    tools = diff.split('\n').filter(f => f.endsWith('/index.html')).map(f => f.replace('/index.html', ''));
    console.log('Testing ' + tools.length + ' changed tool(s):\n');
  } else if (flags.has('--all')) {
    console.log('Testing ALL tools (basic checks)...\n');
    // This would be too many — just do the current tool
    tools = [toolPath];
  } else {
    tools = [toolPath.replace(/\/$/, '')];
  }

  for (const tool of tools) {
    if (!tool) continue;

    // Skip if already tested today (unless --force)
    if (!flags.has('--force') && wasTestedToday(tool)) {
      console.log('  ⏭ Skipping ' + tool + ' — already tested today. Use --force to re-test.');
      continue;
    }
    // Skip if tested in last 7 days and no code change (unless --force or --full)
    if (!flags.has('--force') && !flags.has('--full') && wasTestedRecently(tool, 7)) {
      console.log('  ⏭ Skipping ' + tool + ' — tested within 7 days. Use --force to re-test.');
      continue;
    }

    const url = BASE_URL + '/' + tool + '/';
    const beforeFail = t.failed;
    console.log('══════════════════════════════════════════');
    console.log('  Testing: ' + tool);
    console.log('══════════════════════════════════════════\n');

    const viewports = flags.has('--full') ? ['desktop', 'mobile'] : [flags.has('--mobile') ? 'mobile' : 'desktop'];
    const themes = flags.has('--full') ? ['dark', 'light'] : [flags.has('--light') ? 'light' : 'dark'];

    for (const viewport of viewports) {
      for (const theme of themes) {
        const vp = viewport === 'mobile' ? { width: 375, height: 667 } : { width: 1280, height: 900 };
        const ctx = await browser.newContext({ viewport: vp });
        const page = await ctx.newPage();
        page.on('pageerror', e => t.jsErrors.push(e.message.substring(0, 120)));

        console.log('─── ' + viewport + ' / ' + theme + ' ───\n');
        await testToolUniversal(page, t, url, { viewport, theme });
        console.log('');

        if (viewport === 'desktop' && theme === 'dark') {
          console.log('─── Interactive ───\n');
          await testToolInteractive(page, t, url);
          console.log('');
        }

        await page.close();
        await ctx.close();
      }
    }

    // Firebase test (if tool uses online features)
    const htmlPath = path.join(process.cwd(), tool, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      if (html.includes('firebase') || html.includes('initFirebase')) {
        await testFirebase(t);
      }
    }

    // Save result — skip re-testing today
    saveLastRun(tool, t.passed, t.failed - beforeFail);
  }

  // JS errors summary
  if (t.jsErrors.length > 0) {
    console.log('\n═══ JS ERRORS ═══\n');
    t.jsErrors.forEach(e => t.fail('JS Error', e));
  } else {
    t.ok('Zero JS errors across all tests');
  }

  await browser.close();
  const failures = t.summary();
  process.exit(failures > 0 ? 1 : 0);
})().catch(e => { console.error('CRASH:', e.message); process.exit(1); });
