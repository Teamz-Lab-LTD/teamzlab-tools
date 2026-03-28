#!/usr/bin/env python3
"""
Teamz Lab Tools — Bulk SEO Auto-Fixer
Fixes mechanical SEO issues across ALL tool pages.

Usage:
  python3 scripts/build-seo-fix-all.py --dry-run    # Preview changes
  python3 scripts/build-seo-fix-all.py --apply       # Apply all fixes
  python3 scripts/build-seo-fix-all.py --apply --hub us   # Fix one hub only
  python3 scripts/build-seo-fix-all.py --stats       # Show issue counts only

Fixes applied:
  1. Meta description: rewrite to start with action verb (if not already)
  2. Meta description: trim if >155 chars
  3. display='' bug: replace with showEl() or explicit display value
  4. Freshness signal: add "Last updated" to tool-content if missing
"""

import os
import re
import sys
import html
from pathlib import Path
from collections import defaultdict

# --- Config ---
ROOT = Path(__file__).resolve().parent.parent
EXCLUDED_DIRS = {'.git', 'node_modules', 'branding', 'shared', 'scripts', 'docs', 'icons', 'og-images', '.claude-memory'}

# Action verbs that meta descriptions should start with
ACTION_VERBS = {
    'calculate', 'check', 'find', 'get', 'create', 'build', 'generate',
    'convert', 'test', 'analyze', 'compare', 'discover', 'explore', 'learn',
    'make', 'plan', 'rate', 'scan', 'search', 'track', 'try', 'use',
    'estimate', 'measure', 'evaluate', 'assess', 'paste', 'enter', 'take',
    'pick', 'design', 'preview', 'simulate', 'visualize', 'transform',
    'decode', 'encode', 'format', 'parse', 'validate', 'verify', 'solve',
    'count', 'split', 'merge', 'resize', 'compress', 'extract', 'detect',
    'practice', 'quiz', 'play', 'spin', 'flip', 'draw', 'roll', 'shuffle',
    'organize', 'sort', 'filter', 'map', 'debug', 'monitor', 'audit',
    'optimize', 'manage', 'schedule', 'budget', 'save', 'export', 'download',
    'view', 'watch', 'listen', 'read', 'write', 'edit', 'craft', 'brew',
    'mix', 'bake', 'cook', 'pour', 'steep', 'grind', 'blend', 'whip',
    'knit', 'crochet', 'stitch', 'sew', 'cut', 'trim', 'shape', 'mold',
    'summarize', 'simplify', 'rewrite', 'improve', 'proofread', 'clean',
    'identify', 'diagnose', 'troubleshoot', 'fix', 'repair', 'restore',
    'run', 'start', 'launch', 'deploy', 'set', 'configure', 'setup',
    'select', 'choose', 'decide', 'determine', 'figure', 'predict',
    'project', 'forecast', 'model', 'map', 'chart', 'graph', 'plot',
    'log', 'record', 'capture', 'snap', 'grab', 'fetch', 'pull', 'push',
    'rank', 'score', 'grade', 'benchmark', 'profile', 'survey', 'poll',
    'type', 'input', 'submit', 'send', 'share', 'post', 'publish',
    'unlock', 'access', 'open', 'close', 'lock', 'secure', 'protect',
    'see', 'show', 'display', 'present', 'reveal', 'uncover', 'expose',
    'berechne', 'berechnen', 'prüfe', 'finde', 'erstelle', 'vergleiche',  # German
    'calcula', 'calcule', 'compara', 'encuentra', 'genera', 'convierte',  # Spanish
    'calcule', 'compare', 'trouvez', 'créez', 'générez', 'convertissez',  # French
    'calcola', 'confronta', 'trova', 'crea', 'genera', 'converti',  # Italian
    'laske', 'vertaa', 'etsi', 'luo', 'muunna', 'testaa', 'arvioi',  # Finnish
    'beräkna', 'jämför', 'hitta', 'skapa', 'konvertera', 'testa',  # Swedish
    'bereken', 'vergelijk', 'vind', 'maak', 'converteer', 'test',  # Dutch
    'oblicz', 'porównaj', 'znajdź', 'utwórz', 'konwertuj', 'testuj',  # Polish
    'vypočítejte', 'porovnejte', 'najděte', 'vytvořte',  # Czech
    'احسب', 'قارن', 'اعثر', 'أنشئ',  # Arabic
    'hitung', 'bandingkan', 'temukan', 'buat',  # Indonesian
    'tính', 'so', 'tìm', 'tạo',  # Vietnamese
}

# Verb mapping: given a tool type keyword, suggest an action verb
VERB_SUGGESTIONS = {
    'calculator': 'Calculate', 'rechner': 'Berechne', 'laskuri': 'Laske',
    'checker': 'Check', 'tester': 'Test', 'test': 'Take',
    'generator': 'Generate', 'maker': 'Create', 'builder': 'Build',
    'converter': 'Convert', 'picker': 'Pick', 'simulator': 'Simulate',
    'planner': 'Plan', 'tracker': 'Track', 'timer': 'Track',
    'quiz': 'Take', 'game': 'Play', 'analyzer': 'Analyze',
    'detector': 'Detect', 'estimator': 'Estimate', 'finder': 'Find',
    'viewer': 'View', 'editor': 'Edit', 'formatter': 'Format',
    'counter': 'Count', 'sorter': 'Sort', 'splitter': 'Split',
    'resizer': 'Resize', 'compressor': 'Compress', 'extractor': 'Extract',
    'previewer': 'Preview', 'visualizer': 'Visualize', 'monitor': 'Monitor',
    'auditor': 'Audit', 'optimizer': 'Optimize', 'debugger': 'Debug',
    'scheduler': 'Schedule', 'budgeter': 'Budget', 'downloader': 'Download',
    'countdown': 'Track', 'comparison': 'Compare', 'lookup': 'Find',
}


def find_tool_pages(hub_filter=None):
    """Find all tool index.html files."""
    pages = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        rel = os.path.relpath(dirpath, ROOT)
        parts = Path(rel).parts

        # Must be at least 2 levels deep (hub/tool/)
        if len(parts) < 2:
            continue

        if hub_filter and parts[0] != hub_filter:
            continue

        if 'index.html' in filenames:
            filepath = os.path.join(dirpath, 'index.html')
            pages.append(filepath)

    return sorted(pages)


def extract_meta(content):
    """Extract SEO metadata from HTML content."""
    meta = {}

    # Title
    m = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
    meta['title'] = html.unescape(m.group(1).strip()) if m else ''

    # Meta description
    m = re.search(r'<meta\s+name="description"\s+content="(.*?)"', content, re.DOTALL)
    meta['description'] = html.unescape(m.group(1).strip()) if m else ''

    # H1
    m = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    meta['h1'] = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''

    # H2s in tool-content
    tool_content = ''
    m = re.search(r'<section\s+class="tool-content">(.*?)</section>', content, re.DOTALL)
    if m:
        tool_content = m.group(1)
    meta['h2s'] = re.findall(r'<h2[^>]*>(.*?)</h2>', tool_content, re.DOTALL)
    meta['h2s'] = [re.sub(r'<[^>]+>', '', h).strip() for h in meta['h2s']]

    # Content word count
    text = re.sub(r'<[^>]+>', ' ', tool_content)
    meta['content_words'] = len(text.split())

    # Has freshness signal
    meta['has_freshness'] = bool(re.search(r'last\s+updated|updated?\s*:?\s*\w+\s+20\d{2}', content, re.IGNORECASE))

    # Has display='' bug
    meta['display_empty'] = "style.display = ''" in content or 'style.display=""' in content

    # FAQ count
    meta['faq_count'] = len(re.findall(r"q:\s*'", content)) + len(re.findall(r'"q":\s*"', content))

    return meta


def suggest_verb(title, description):
    """Suggest an action verb based on tool type."""
    title_lower = title.lower()
    for keyword, verb in VERB_SUGGESTIONS.items():
        if keyword in title_lower:
            return verb

    # Default based on common patterns
    if any(w in title_lower for w in ['how', 'what', 'why']):
        return 'Discover'
    return 'Use'


def fix_meta_description_verb(content, meta):
    """Fix meta description to start with action verb."""
    desc = meta['description']
    if not desc:
        return content, False

    first_word = desc.split()[0].lower().rstrip('.,!') if desc.split() else ''
    if first_word in ACTION_VERBS:
        return content, False

    # Suggest a verb
    verb = suggest_verb(meta['title'], desc)

    # Reconstruct: "Verb + rest of description"
    # Remove common non-verb starters
    new_desc = desc
    starters_to_remove = [
        r'^This\s+(tool|calculator|checker|generator|converter|quiz|game|maker|tester|analyzer)\s+(is\s+a|lets\s+you|helps\s+you|allows\s+you\s+to|will)\s*',
        r'^A\s+(free|simple|easy|quick|fast|online|browser-based)\s+',
        r'^The\s+(best|ultimate|free|online|most\s+accurate)\s+',
        r'^Free\s+(online\s+)?(tool|calculator|checker)\s+(to|for|that)\s+',
        r'^Online\s+(tool|calculator)\s+(to|for|that)\s+',
        r'^An?\s+',
    ]

    cleaned = desc
    for pattern in starters_to_remove:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()

    # Capitalize first letter of remaining
    if cleaned:
        cleaned = cleaned[0].lower() + cleaned[1:] if len(cleaned) > 1 else cleaned.lower()

    new_desc = f"{verb} {cleaned}"

    # Ensure it ends with period if not already
    if new_desc and not new_desc.endswith('.'):
        # Don't add period if it makes it too long
        if len(new_desc) < 155:
            pass  # Leave without period - many good meta descs don't have them

    # Trim to 155 chars
    if len(new_desc) > 155:
        new_desc = new_desc[:152].rsplit(' ', 1)[0] + '...'

    if new_desc == desc:
        return content, False

    # Replace in all locations
    escaped_old = re.escape(desc)
    # Replace meta description
    content = re.sub(
        r'(<meta\s+name="description"\s+content=")' + escaped_old + '"',
        lambda m: m.group(1) + new_desc.replace('"', '&quot;') + '"',
        content
    )
    # Replace og:description
    content = re.sub(
        r'(<meta\s+property="og:description"\s+content=")' + escaped_old + '"',
        lambda m: m.group(1) + new_desc.replace('"', '&quot;') + '"',
        content
    )
    # Replace twitter:description
    content = re.sub(
        r'(<meta\s+name="twitter:description"\s+content=")' + escaped_old + '"',
        lambda m: m.group(1) + new_desc.replace('"', '&quot;') + '"',
        content
    )

    return content, True


def fix_meta_description_length(content, meta):
    """Trim meta description if too long."""
    desc = meta['description']
    if not desc or len(desc) <= 155:
        return content, False

    # Trim to 155 chars at word boundary
    new_desc = desc[:152].rsplit(' ', 1)[0] + '...'

    escaped_old = re.escape(desc)
    content = re.sub(
        r'(<meta\s+name="description"\s+content=")' + escaped_old + '"',
        lambda m: m.group(1) + new_desc.replace('"', '&quot;') + '"',
        content
    )
    content = re.sub(
        r'(<meta\s+property="og:description"\s+content=")' + escaped_old + '"',
        lambda m: m.group(1) + new_desc.replace('"', '&quot;') + '"',
        content
    )
    content = re.sub(
        r'(<meta\s+name="twitter:description"\s+content=")' + escaped_old + '"',
        lambda m: m.group(1) + new_desc.replace('"', '&quot;') + '"',
        content
    )

    return content, True


def fix_display_empty(content, meta):
    """Fix style.display = '' bug with explicit display value."""
    if not meta['display_empty']:
        return content, False

    # Replace style.display = '' with showEl() if available, or 'block'
    content = content.replace("style.display = ''", "style.display = 'block'")
    content = content.replace('style.display=""', "style.display='block'")
    return content, True


def fix_freshness_signal(content, meta):
    """Add freshness signal to tool-content if missing."""
    if meta['has_freshness']:
        return content, False

    # Find the closing </section> of tool-content and add freshness before it
    # Look for the last </p> or </ul> before </section> in tool-content
    pattern = r'(</(?:p|ul|ol|table|div)>\s*)(</section>\s*<section\s+id="tool-faqs")'
    m = re.search(pattern, content)
    if m:
        freshness = '\n      <p style="font-size:var(--text-sm);color:var(--text-muted);margin-top:2rem;">Last updated: March 2026</p>\n    '
        content = content[:m.end(1)] + freshness + content[m.start(2):]
        return content, True

    return content, False


def run(dry_run=True, hub_filter=None, stats_only=False):
    """Main runner."""
    pages = find_tool_pages(hub_filter)
    print(f"\n{'='*60}")
    print(f"  SEO BULK FIXER {'(DRY RUN)' if dry_run else '(APPLYING)'} — {len(pages)} pages")
    if hub_filter:
        print(f"  Hub filter: {hub_filter}")
    print(f"{'='*60}\n")

    counters = defaultdict(int)
    fixed_files = []

    for filepath in pages:
        rel_path = os.path.relpath(filepath, ROOT)

        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()

        meta = extract_meta(original)
        content = original
        fixes_for_file = []

        # Fix 1: Meta description verb — DISABLED (too risky for auto-fix, needs manual review)
        # content, fixed = fix_meta_description_verb(content, meta)
        # if fixed:
        #     counters['meta_verb'] += 1
        #     fixes_for_file.append('meta_verb')

        # Fix 2: Meta description length — DISABLED (trimming can cut important info)
        # meta2 = extract_meta(content)
        # content, fixed = fix_meta_description_length(content, meta2)
        # if fixed:
        #     counters['meta_length'] += 1
        #     fixes_for_file.append('meta_length')

        # Fix 3: display='' bug
        content, fixed = fix_display_empty(content, meta)
        if fixed:
            counters['display_bug'] += 1
            fixes_for_file.append('display_bug')

        # Fix 4: Freshness signal — HANDLED CENTRALLY in common.js (renderAuthorByline)
        # No per-file changes needed

        # Count issues (for stats)
        first_word = meta['description'].split()[0].lower().rstrip('.,!') if meta['description'].split() else ''
        if first_word not in ACTION_VERBS and meta['description']:
            counters['needs_verb'] += 1
        if len(meta['description']) > 155:
            counters['needs_trim'] += 1
        if meta['display_empty']:
            counters['has_display_bug'] += 1
        if not meta['has_freshness']:
            counters['needs_freshness'] += 1
        if meta['content_words'] < 300:
            counters['low_content'] += 1
        if meta['faq_count'] < 5:
            counters['low_faqs'] += 1

        h2_lower = ' '.join(meta['h2s']).lower()
        if 'how' not in h2_lower or 'works' not in h2_lower:
            counters['needs_how_works'] += 1

        if fixes_for_file:
            if not stats_only:
                print(f"  {rel_path}: {', '.join(fixes_for_file)}")
            fixed_files.append(rel_path)

            if not dry_run and not stats_only:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

    # Summary
    print(f"\n{'='*60}")
    print(f"  SUMMARY")
    print(f"{'='*60}")
    print(f"\n  Auto-fixable (applied{'  — DRY RUN' if dry_run else ''}):")
    print(f"    Meta desc verb fix:    {counters['meta_verb']} pages")
    print(f"    Meta desc trim:        {counters['meta_length']} pages")
    print(f"    display='' bug fix:    {counters['display_bug']} pages")
    print(f"    Freshness signal:      {counters['freshness']} pages")
    print(f"    TOTAL auto-fixed:      {len(fixed_files)} pages")

    print(f"\n  Needs AI/manual content:")
    print(f"    Low content (<300w):   {counters['low_content']} pages")
    print(f"    Missing 'How Works' H2:{counters['needs_how_works']} pages")
    print(f"    Low FAQ count (<5):    {counters['low_faqs']} pages")

    print(f"\n  Total pages scanned:     {len(pages)}")
    if dry_run and not stats_only:
        print(f"\n  Run with --apply to write changes to disk")
    print(f"\n{'='*60}\n")


if __name__ == '__main__':
    args = sys.argv[1:]
    dry_run = '--apply' not in args
    stats_only = '--stats' in args
    hub_filter = None
    if '--hub' in args:
        idx = args.index('--hub')
        if idx + 1 < len(args):
            hub_filter = args[idx + 1]

    run(dry_run=dry_run, hub_filter=hub_filter, stats_only=stats_only)
