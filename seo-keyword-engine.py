#!/usr/bin/env python3
"""
SEO Keyword Engine — Teamz Lab Tools
=====================================
Fully automated SEO keyword audit, research, and optimization.
No paid tools. No manual effort. Runs on every build.

Modes:
  audit       — Audit ALL tools for keyword placement issues (default)
  suggest     — Get free keyword suggestions for a tool (Google Autocomplete)
  cannibalize — Find keyword cannibalization across tools
  report      — Full SEO report with scores and fixes needed
  fix         — Auto-fix keyword placement issues (use with --dry-run first)

Usage:
  python3 seo-keyword-engine.py audit
  python3 seo-keyword-engine.py suggest "fuel cost calculator"
  python3 seo-keyword-engine.py cannibalize
  python3 seo-keyword-engine.py report
  python3 seo-keyword-engine.py fix --dry-run
  python3 seo-keyword-engine.py fix
"""

import os
import re
import sys
import json
import html
import glob
import urllib.request
import urllib.parse
import urllib.error
import time
from collections import defaultdict, Counter
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_URL = "https://tool.teamzlab.com"

# Directories to exclude from tool discovery
EXCLUDE_DIRS = {
    'about', 'contact', 'privacy', 'terms', 'docs', 'shared', 'branding',
    'node_modules', '.git', 'icons', 'fonts', 'images', 'css', 'js',
    'assets', '.github', '.vscode', 'scripts'
}

# ─── UTILITY FUNCTIONS ────────────────────────────────────────────────

def find_all_tools():
    """Discover all tool pages using the same pattern as build scripts."""
    tools = []
    for filepath in glob.glob(os.path.join(BASE_DIR, '*', '*', 'index.html')):
        rel = os.path.relpath(filepath, BASE_DIR)
        parts = rel.split(os.sep)
        if len(parts) >= 3:
            hub = parts[0]
            if hub in EXCLUDE_DIRS or hub.startswith('.'):
                continue
            tools.append(filepath)
    return sorted(tools)


def extract_metadata(filepath):
    """Extract all SEO-relevant metadata from a tool page."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return None

    rel = os.path.relpath(filepath, BASE_DIR)
    parts = rel.replace('index.html', '').strip('/').split('/')
    hub = parts[0] if parts else ''
    slug = parts[1] if len(parts) > 1 else ''

    meta = {
        'filepath': filepath,
        'rel_path': rel,
        'hub': hub,
        'slug': slug,
        'url': f"/{hub}/{slug}/",
    }

    # Title tag
    m = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
    meta['title'] = html.unescape(m.group(1).strip()) if m else ''

    # Meta description
    m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.DOTALL)
    meta['description'] = html.unescape(m.group(1).strip()) if m else ''

    # H1
    m = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    meta['h1'] = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''

    # H2s
    meta['h2s'] = [re.sub(r'<[^>]+>', '', h).strip()
                   for h in re.findall(r'<h2[^>]*>(.*?)</h2>', content, re.DOTALL)]

    # H3s
    meta['h3s'] = [re.sub(r'<[^>]+>', '', h).strip()
                   for h in re.findall(r'<h3[^>]*>(.*?)</h3>', content, re.DOTALL)]

    # Tool description (first paragraph after H1)
    m = re.search(r'<p\s+class=["\']tool-description["\'][^>]*>(.*?)</p>', content, re.DOTALL)
    meta['intro'] = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''

    # All visible text (for keyword density)
    text_only = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
    text_only = re.sub(r'<style[^>]*>.*?</style>', '', text_only, flags=re.DOTALL)
    text_only = re.sub(r'<[^>]+>', ' ', text_only)
    text_only = re.sub(r'\s+', ' ', text_only).strip()
    meta['body_text'] = text_only
    meta['word_count'] = len(text_only.split())

    # Image alt texts
    meta['img_alts'] = re.findall(r'<img[^>]+alt=["\']([^"\']*)["\']', content)

    # OG image
    meta['has_og_image'] = bool(re.search(r'og:image', content))

    # Canonical URL
    m = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', content)
    meta['canonical'] = m.group(1) if m else ''

    # FAQ count
    faq_matches = re.findall(r'"@type"\s*:\s*"Question"', content)
    meta['faq_count'] = len(faq_matches)

    # Content section word count
    m = re.search(r'<section\s+class=["\']tool-content["\']>(.*?)</section>', content, re.DOTALL)
    if m:
        content_text = re.sub(r'<[^>]+>', ' ', m.group(1))
        meta['content_words'] = len(content_text.split())
    else:
        meta['content_words'] = 0

    return meta


def extract_primary_keyword(meta):
    """
    Step 1: Generate seed/primary keyword from tool metadata.
    Uses H1 as primary keyword (should match the main search intent).
    """
    h1 = meta.get('h1', '')
    if h1:
        # Clean up: remove "Free ", "Online ", brand suffixes
        kw = re.sub(r'\s*[—–|-]\s*Teamz Lab.*$', '', h1, flags=re.IGNORECASE)
        kw = kw.strip()
        return kw.lower()

    # Fallback: derive from slug
    slug = meta.get('slug', '')
    return slug.replace('-', ' ').lower()


def extract_secondary_keywords(meta):
    """Extract secondary/LSI keywords from description, H2s, H3s."""
    keywords = set()

    # From slug words
    slug_words = meta.get('slug', '').split('-')
    if len(slug_words) >= 2:
        keywords.add(' '.join(slug_words).lower())

    # From title (without brand)
    title = re.sub(r'\s*[—–|-]\s*Teamz Lab.*$', '', meta.get('title', ''), flags=re.IGNORECASE)
    if title.strip():
        keywords.add(title.strip().lower())

    # From H2s — extract key phrases
    for h2 in meta.get('h2s', []):
        # "How the Fuel Cost Calculator Works" → "fuel cost calculator"
        cleaned = re.sub(r'^(How|Why|What|When|Where|Tips for|Understanding)\s+(the\s+)?', '', h2, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s+(Works?|Matters?|Guide|Tips|Explained)$', '', cleaned, flags=re.IGNORECASE)
        if cleaned.strip() and len(cleaned.strip().split()) >= 2:
            keywords.add(cleaned.strip().lower())

    # From description — extract noun phrases (simple heuristic)
    desc = meta.get('description', '').lower()
    # Find quoted phrases
    quoted = re.findall(r'"([^"]+)"', desc)
    keywords.update(q.lower() for q in quoted if len(q.split()) >= 2)

    return list(keywords)


def fetch_google_autocomplete(query, lang='en', country='us'):
    """
    Step 2: FREE keyword research using Google Autocomplete API.
    No API key needed. Returns real search suggestions.
    """
    try:
        encoded = urllib.parse.quote(query)
        url = f"http://suggestqueries.google.com/complete/search?client=firefox&q={encoded}&hl={lang}&gl={country}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if isinstance(data, list) and len(data) > 1:
                return [s for s in data[1] if s.lower() != query.lower()]
    except Exception:
        pass
    return []


def fetch_related_searches(query):
    """Get 'People Also Search For' style suggestions using autocomplete variants."""
    suggestions = set()

    # Base autocomplete
    base = fetch_google_autocomplete(query)
    suggestions.update(base)

    # Prefix variations for long-tail keywords
    prefixes = ['how to', 'best', 'free', 'online', 'what is', 'why']
    for prefix in prefixes:
        results = fetch_google_autocomplete(f"{prefix} {query}")
        suggestions.update(results[:3])  # Top 3 per prefix
        time.sleep(0.1)  # Be polite

    # Suffix variations
    suffixes = ['calculator', 'tool', 'online', 'free', 'app']
    for suffix in suffixes:
        if suffix not in query.lower():
            results = fetch_google_autocomplete(f"{query} {suffix}")
            suggestions.update(results[:3])
            time.sleep(0.1)

    return list(suggestions)


def classify_search_intent(keyword):
    """
    Step 3: Classify search intent (informational, transactional, navigational).
    """
    kw = keyword.lower()

    transactional = ['buy', 'price', 'cost', 'cheap', 'deal', 'discount',
                     'download', 'free', 'tool', 'calculator', 'generator',
                     'converter', 'checker', 'maker', 'builder', 'creator']
    informational = ['how to', 'what is', 'why', 'guide', 'tutorial',
                     'tips', 'best way', 'vs', 'versus', 'compare',
                     'difference', 'meaning', 'definition', 'explain']
    navigational = ['login', 'sign in', 'official', 'website', 'app']

    for word in transactional:
        if word in kw:
            return 'transactional'
    for word in informational:
        if word in kw:
            return 'informational'
    for word in navigational:
        if word in kw:
            return 'navigational'
    return 'transactional'  # Default for tool pages


def is_long_tail(keyword):
    """Check if keyword is long-tail (3+ words, more specific)."""
    return len(keyword.split()) >= 3


# ─── AUDIT FUNCTIONS ──────────────────────────────────────────────────

def audit_keyword_placement(meta):
    """
    Step 4: Audit strategic keyword placement.
    Returns score (0-100) and list of issues.
    """
    primary_kw = extract_primary_keyword(meta)
    if not primary_kw:
        return 0, ['NO PRIMARY KEYWORD FOUND'], primary_kw

    issues = []
    score = 0
    max_score = 0

    # 1. Title tag — keyword near beginning (25 points)
    max_score += 25
    title = meta.get('title', '').lower()
    title_clean = re.sub(r'\s*[—–|-]\s*teamz lab.*$', '', title)
    if primary_kw in title_clean:
        if title_clean.startswith(primary_kw) or title_clean.find(primary_kw) < 10:
            score += 25
        else:
            score += 15
            issues.append(f'TITLE: Keyword "{primary_kw}" not near beginning of title')
    else:
        issues.append(f'TITLE: Primary keyword "{primary_kw}" missing from title tag')

    # 2. URL slug — contains keyword words (15 points)
    max_score += 15
    slug = meta.get('slug', '').lower()
    slug_words = set(slug.split('-'))
    kw_words = set(primary_kw.split())
    overlap = kw_words & slug_words
    if len(overlap) == len(kw_words):
        score += 15
    elif len(overlap) >= len(kw_words) * 0.5:
        score += 10
        missing = kw_words - slug_words
        issues.append(f'URL: Slug missing keyword words: {", ".join(missing)}')
    else:
        issues.append(f'URL: Slug "{slug}" poorly matches keyword "{primary_kw}"')

    # 3. H1 — exact or near match (20 points)
    max_score += 20
    h1 = meta.get('h1', '').lower()
    if primary_kw in h1:
        score += 20
    elif any(w in h1 for w in primary_kw.split()):
        score += 10
        issues.append(f'H1: Partial keyword match. H1="{meta["h1"]}", keyword="{primary_kw}"')
    else:
        issues.append(f'H1: Primary keyword "{primary_kw}" missing from H1')

    # 4. Intro/description — keyword in first 100 words (15 points)
    max_score += 15
    intro = meta.get('intro', '').lower()
    desc = meta.get('description', '').lower()
    if primary_kw in intro or primary_kw in desc:
        score += 15
    elif any(w in intro for w in primary_kw.split()):
        score += 8
        issues.append(f'INTRO: Only partial keyword match in intro paragraph')
    else:
        issues.append(f'INTRO: Primary keyword missing from intro/description')

    # 5. H2/H3 subheadings — keyword in at least one (10 points)
    max_score += 10
    all_headings = ' '.join(meta.get('h2s', []) + meta.get('h3s', [])).lower()
    if primary_kw in all_headings:
        score += 10
    elif any(w in all_headings for w in primary_kw.split() if len(w) > 3):
        score += 5
        issues.append(f'HEADINGS: Keyword not fully present in any H2/H3')
    else:
        issues.append(f'HEADINGS: Primary keyword "{primary_kw}" missing from all H2/H3 tags')

    # 6. Meta description quality (10 points)
    max_score += 10
    desc_text = meta.get('description', '')
    desc_len = len(desc_text)
    if desc_len == 0:
        issues.append('META DESC: Missing meta description!')
    elif desc_len < 70:
        score += 3
        issues.append(f'META DESC: Too short ({desc_len} chars, aim for 120-155)')
    elif desc_len > 155:
        score += 5
        issues.append(f'META DESC: Too long ({desc_len} chars, max 155)')
    else:
        score += 10

    # Check for action verb in description
    if desc_text:
        action_verbs = ['calculate', 'check', 'find', 'get', 'create', 'build',
                        'generate', 'convert', 'test', 'analyze', 'compare',
                        'discover', 'explore', 'learn', 'make', 'plan', 'rate',
                        'scan', 'search', 'track', 'try', 'use', 'estimate',
                        'measure', 'evaluate', 'assess', 'paste', 'enter', 'take']
        first_word = desc_text.split()[0].lower().rstrip('.,!') if desc_text.split() else ''
        if first_word not in action_verbs:
            issues.append(f'META DESC: Should start with action verb, starts with "{first_word}"')

    # 7. Keyword density check (5 points)
    max_score += 5
    body = meta.get('body_text', '').lower()
    word_count = meta.get('word_count', 0)
    if word_count > 0:
        kw_count = body.count(primary_kw)
        density = (kw_count * len(primary_kw.split()) / word_count) * 100
        if 0.5 <= density <= 2.5:
            score += 5
        elif density < 0.5:
            issues.append(f'DENSITY: Keyword density too low ({density:.1f}%, aim for 1-2%)')
        elif density > 2.5:
            issues.append(f'DENSITY: Keyword stuffing risk ({density:.1f}%, max 2.5%)')

    # Bonus checks (non-scoring but important)
    if not meta.get('has_og_image'):
        issues.append('OG IMAGE: Missing og:image tag')
    if not meta.get('canonical'):
        issues.append('CANONICAL: Missing canonical URL')
    if meta.get('faq_count', 0) < 3:
        issues.append(f'FAQs: Only {meta.get("faq_count", 0)} FAQs (aim for 5-8)')
    if meta.get('content_words', 0) < 300:
        issues.append(f'CONTENT: Only {meta.get("content_words", 0)} words in content section (aim for 300-600)')

    # Normalize score to 0-100
    final_score = int((score / max_score) * 100) if max_score > 0 else 0
    return final_score, issues, primary_kw


def find_cannibalization(all_meta):
    """Find tools competing for the same keywords."""
    keyword_map = defaultdict(list)
    for meta in all_meta:
        kw = extract_primary_keyword(meta)
        if kw:
            keyword_map[kw].append(meta['rel_path'])
            # Also check 2-word subsets
            words = kw.split()
            if len(words) >= 3:
                for i in range(len(words) - 1):
                    bigram = f"{words[i]} {words[i+1]}"
                    keyword_map[bigram].append(meta['rel_path'])

    conflicts = {}
    for kw, paths in keyword_map.items():
        if len(paths) > 1 and len(kw.split()) >= 2:
            conflicts[kw] = paths
    return conflicts


# ─── REPORT GENERATION ────────────────────────────────────────────────

def generate_score_badge(score):
    """Generate a letter grade from score."""
    if score >= 90: return 'A+'
    if score >= 80: return 'A'
    if score >= 70: return 'B'
    if score >= 60: return 'C'
    if score >= 50: return 'D'
    return 'F'


def run_audit(tools=None, verbose=False):
    """Run full SEO keyword audit on all tools."""
    if tools is None:
        tools = find_all_tools()

    print(f"\n{'='*60}")
    print(f"  SEO KEYWORD AUDIT — {len(tools)} tools")
    print(f"{'='*60}\n")

    all_meta = []
    scores = []
    all_issues = defaultdict(list)
    grade_counts = Counter()

    for filepath in tools:
        meta = extract_metadata(filepath)
        if not meta:
            continue
        all_meta.append(meta)

        score, issues, primary_kw = audit_keyword_placement(meta)
        scores.append(score)
        grade = generate_score_badge(score)
        grade_counts[grade] += 1

        if verbose or score < 70 or issues:
            if score < 70:
                print(f"  [{grade}] {score:3d}/100  {meta['rel_path']}")
                if verbose:
                    for issue in issues:
                        print(f"           -> {issue}")

        for issue in issues:
            category = issue.split(':')[0]
            all_issues[category].append(meta['rel_path'])

    # Summary
    avg_score = sum(scores) / len(scores) if scores else 0
    print(f"\n{'='*60}")
    print(f"  AUDIT SUMMARY")
    print(f"{'='*60}")
    print(f"  Tools audited:    {len(scores)}")
    print(f"  Average score:    {avg_score:.0f}/100 ({generate_score_badge(avg_score)})")
    print(f"  ")
    print(f"  Grade distribution:")
    for grade in ['A+', 'A', 'B', 'C', 'D', 'F']:
        count = grade_counts.get(grade, 0)
        bar = '#' * (count // 5) if count > 0 else ''
        print(f"    {grade:3s}: {count:4d} tools  {bar}")

    print(f"\n  Top issues (by frequency):")
    for category, paths in sorted(all_issues.items(), key=lambda x: -len(x[1])):
        print(f"    {category}: {len(paths)} tools affected")

    # Find critical issues (score < 50)
    critical = [(s, m) for s, m in zip(scores, all_meta) if s < 50]
    if critical:
        print(f"\n  CRITICAL ({len(critical)} tools scoring below 50):")
        for s, m in sorted(critical, key=lambda x: x[0])[:20]:
            print(f"    [{generate_score_badge(s)}] {s}/100  {m['rel_path']}")

    print(f"\n{'='*60}\n")
    return all_meta, scores


def run_suggest(query):
    """Get keyword suggestions for a topic using free Google Autocomplete."""
    print(f"\n{'='*60}")
    print(f"  KEYWORD SUGGESTIONS: \"{query}\"")
    print(f"{'='*60}\n")

    print("  [1/3] Fetching Google Autocomplete suggestions...")
    base_suggestions = fetch_google_autocomplete(query)
    if base_suggestions:
        print(f"  Found {len(base_suggestions)} direct suggestions:")
        for s in base_suggestions:
            intent = classify_search_intent(s)
            tail = "  (long-tail)" if is_long_tail(s) else ""
            print(f"    -> {s}  [{intent}]{tail}")
    else:
        print("  No direct suggestions found (may be rate-limited)")

    print(f"\n  [2/3] Fetching related searches (question-based)...")
    question_prefixes = ['how to', 'what is', 'why', 'can i', 'best']
    for prefix in question_prefixes:
        results = fetch_google_autocomplete(f"{prefix} {query}")
        if results:
            print(f"    \"{prefix} {query}\":")
            for r in results[:3]:
                print(f"      -> {r}")
        time.sleep(0.15)

    print(f"\n  [3/3] Long-tail variations...")
    suffixes = ['calculator', 'online free', 'tool', 'formula', 'example', 'app', 'template']
    for suffix in suffixes:
        if suffix not in query.lower():
            results = fetch_google_autocomplete(f"{query} {suffix}")
            if results:
                for r in results[:2]:
                    if is_long_tail(r):
                        print(f"    -> {r}  (long-tail)")
            time.sleep(0.15)

    print(f"\n{'='*60}\n")


def run_cannibalize():
    """Find keyword cannibalization across all tools."""
    print(f"\n{'='*60}")
    print(f"  KEYWORD CANNIBALIZATION CHECK")
    print(f"{'='*60}\n")

    tools = find_all_tools()
    all_meta = []
    for filepath in tools:
        meta = extract_metadata(filepath)
        if meta:
            all_meta.append(meta)

    conflicts = find_cannibalization(all_meta)

    if not conflicts:
        print("  No keyword cannibalization found!")
    else:
        # Sort by number of competing pages
        sorted_conflicts = sorted(conflicts.items(), key=lambda x: -len(x[1]))
        print(f"  Found {len(sorted_conflicts)} keyword conflicts:\n")
        for kw, paths in sorted_conflicts[:30]:
            if len(paths) <= 5:  # Skip overly generic matches
                print(f"  Keyword: \"{kw}\" ({len(paths)} pages competing)")
                for p in paths:
                    print(f"    -> {p}")
                print()

    print(f"{'='*60}\n")


def run_report():
    """Generate comprehensive SEO report."""
    tools = find_all_tools()
    all_meta, scores = run_audit(tools, verbose=False)

    print(f"\n{'='*60}")
    print(f"  DETAILED SEO KEYWORD REPORT")
    print(f"{'='*60}\n")

    # Missing elements summary
    missing_desc = [m for m in all_meta if not m.get('description')]
    missing_h1 = [m for m in all_meta if not m.get('h1')]
    missing_canonical = [m for m in all_meta if not m.get('canonical')]
    missing_og = [m for m in all_meta if not m.get('has_og_image')]
    low_faq = [m for m in all_meta if m.get('faq_count', 0) < 3]
    low_content = [m for m in all_meta if m.get('content_words', 0) < 300]
    short_desc = [m for m in all_meta if 0 < len(m.get('description', '')) < 100]
    long_desc = [m for m in all_meta if len(m.get('description', '')) > 155]

    print("  MISSING ELEMENTS:")
    print(f"    No meta description:    {len(missing_desc)} tools")
    print(f"    No H1 tag:              {len(missing_h1)} tools")
    print(f"    No canonical URL:       {len(missing_canonical)} tools")
    print(f"    No og:image:            {len(missing_og)} tools")
    print(f"    < 3 FAQs:              {len(low_faq)} tools")
    print(f"    < 300 words content:   {len(low_content)} tools")
    print(f"    Description too short:  {len(short_desc)} tools")
    print(f"    Description too long:   {len(long_desc)} tools")

    # Title length distribution
    title_lengths = [len(m.get('title', '')) for m in all_meta]
    print(f"\n  TITLE LENGTHS:")
    print(f"    Average: {sum(title_lengths)/len(title_lengths):.0f} chars")
    print(f"    Too long (>60): {sum(1 for t in title_lengths if t > 60)}")
    print(f"    Too short (<20): {sum(1 for t in title_lengths if t < 20)}")

    # Keyword density stats
    print(f"\n  CONTENT STATS:")
    word_counts = [m.get('word_count', 0) for m in all_meta]
    content_counts = [m.get('content_words', 0) for m in all_meta]
    print(f"    Avg total words:    {sum(word_counts)/len(word_counts):.0f}")
    print(f"    Avg content words:  {sum(content_counts)/len(content_counts):.0f}")

    # Hub-level scores
    hub_scores = defaultdict(list)
    for meta, score in zip(all_meta, scores):
        hub_scores[meta['hub']].append(score)

    print(f"\n  SCORES BY HUB:")
    for hub, hub_s in sorted(hub_scores.items(), key=lambda x: -sum(x[1])/len(x[1])):
        avg = sum(hub_s) / len(hub_s)
        print(f"    {hub:25s}  avg {avg:.0f}/100  ({len(hub_s)} tools)")

    print(f"\n{'='*60}\n")


# ─── AUTO-FIX FUNCTIONS ──────────────────────────────────────────────

def generate_fix_suggestions(meta):
    """Generate auto-fixable suggestions for a tool."""
    fixes = []
    primary_kw = extract_primary_keyword(meta)
    if not primary_kw:
        return fixes

    # Fix: Meta description starts with action verb
    desc = meta.get('description', '')
    if desc:
        action_verbs = ['calculate', 'check', 'find', 'get', 'create', 'build',
                        'generate', 'convert', 'test', 'analyze', 'compare',
                        'discover', 'explore', 'learn', 'make', 'plan', 'rate',
                        'scan', 'search', 'track', 'try', 'use', 'estimate',
                        'measure', 'evaluate', 'assess', 'paste', 'enter', 'take']
        first_word = desc.split()[0].lower().rstrip('.,!') if desc.split() else ''
        if first_word not in action_verbs:
            fixes.append({
                'type': 'meta_description_verb',
                'message': f'Description should start with action verb (currently: "{first_word}")',
                'file': meta['filepath'],
            })

    # Fix: Description too short or too long
    if len(desc) < 100 and desc:
        fixes.append({
            'type': 'meta_description_short',
            'message': f'Description too short ({len(desc)} chars, aim for 120-155)',
            'file': meta['filepath'],
        })
    elif len(desc) > 155:
        fixes.append({
            'type': 'meta_description_long',
            'message': f'Description too long ({len(desc)} chars, max 155)',
            'file': meta['filepath'],
        })

    # Fix: H1 doesn't match primary keyword
    h1 = meta.get('h1', '').lower()
    if primary_kw and primary_kw not in h1:
        fixes.append({
            'type': 'h1_keyword_mismatch',
            'message': f'H1 "{meta["h1"]}" doesn\'t contain primary keyword "{primary_kw}"',
            'file': meta['filepath'],
        })

    # Fix: No "How [Tool] Works" H2
    h2_text = ' '.join(meta.get('h2s', [])).lower()
    if 'how' not in h2_text or 'works' not in h2_text:
        fixes.append({
            'type': 'missing_how_works_h2',
            'message': f'Missing "How {meta["h1"]} Works" H2 section',
            'file': meta['filepath'],
        })

    # Fix: Low FAQ count
    if meta.get('faq_count', 0) < 3:
        fixes.append({
            'type': 'low_faq_count',
            'message': f'Only {meta.get("faq_count", 0)} FAQs (aim for 5-8)',
            'file': meta['filepath'],
        })

    # Fix: Low content word count
    if meta.get('content_words', 0) < 300:
        fixes.append({
            'type': 'low_content',
            'message': f'Only {meta.get("content_words", 0)} words in content section (aim for 300-600)',
            'file': meta['filepath'],
        })

    return fixes


def run_fix(dry_run=True):
    """Auto-fix keyword placement issues."""
    tools = find_all_tools()
    print(f"\n{'='*60}")
    print(f"  SEO AUTO-FIX {'(DRY RUN)' if dry_run else '(LIVE)'} — {len(tools)} tools")
    print(f"{'='*60}\n")

    total_fixes = 0
    for filepath in tools:
        meta = extract_metadata(filepath)
        if not meta:
            continue

        fixes = generate_fix_suggestions(meta)
        if fixes:
            print(f"  {meta['rel_path']}:")
            for fix in fixes:
                print(f"    [{fix['type']}] {fix['message']}")
                total_fixes += 1
            print()

    print(f"\n  Total fixable issues: {total_fixes}")
    if dry_run:
        print(f"  Run with 'fix' (no --dry-run) to apply auto-fixes")
    print(f"\n{'='*60}\n")


# ─── MAIN ─────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    command = sys.argv[1].lower()

    if command == 'audit':
        verbose = '--verbose' in sys.argv or '-v' in sys.argv
        run_audit(verbose=verbose)

    elif command == 'suggest':
        if len(sys.argv) < 3:
            print("Usage: python3 seo-keyword-engine.py suggest \"keyword\"")
            sys.exit(1)
        query = ' '.join(sys.argv[2:])
        query = query.strip('"\'')
        run_suggest(query)

    elif command == 'cannibalize':
        run_cannibalize()

    elif command == 'report':
        run_report()

    elif command == 'fix':
        dry_run = '--dry-run' in sys.argv
        run_fix(dry_run=dry_run)

    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
