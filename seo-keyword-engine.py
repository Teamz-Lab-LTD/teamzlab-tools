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

    # Page language
    m = re.search(r'<html[^>]+lang=["\']([^"\']+)["\']', content)
    meta['lang'] = m.group(1).split('-')[0].lower() if m else 'en'

    # Title tag
    m = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
    meta['title'] = html.unescape(m.group(1).strip()) if m else ''

    # Meta description — match same quote type to handle apostrophes in content
    m = re.search(r'<meta\s+name="description"\s+content="(.*?)"', content, re.DOTALL)
    if not m:
        m = re.search(r"<meta\s+name='description'\s+content='(.*?)'", content, re.DOTALL)
    meta['description'] = html.unescape(m.group(1).strip()) if m else ''

    # Exclude redirect/noindex pages from audit
    if re.search(r'meta\s+(http-equiv=["\']refresh["\']|name=["\']robots["\']\s+content=["\']noindex)', content):
        return None

    # H1 (html.unescape to handle &amp; &eacute; etc.)
    m = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    meta['h1'] = html.unescape(re.sub(r'<[^>]+>', '', m.group(1)).strip()) if m else ''

    # H2s (html.unescape)
    meta['h2s'] = [html.unescape(re.sub(r'<[^>]+>', '', h).strip())
                   for h in re.findall(r'<h2[^>]*>(.*?)</h2>', content, re.DOTALL)]

    # H3s (html.unescape)
    meta['h3s'] = [html.unescape(re.sub(r'<[^>]+>', '', h).strip())
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
    Smart extraction: strips subtitles, privacy prefixes, handles non-Latin scripts.
    """
    h1 = meta.get('h1', '')
    slug = meta.get('slug', '')

    if not h1:
        return slug.replace('-', ' ').lower()

    kw = h1

    # Step 1: Strip brand suffixes
    kw = re.sub(r'\s*[—–|]\s*Teamz Lab.*$', '', kw, flags=re.IGNORECASE)

    # Step 2: Strip em-dash/en-dash subtitles ("Tool — Subtitle Here")
    stripped = re.split(r'\s*[—–]\s+', kw, maxsplit=1)[0]
    if len(stripped.split()) >= 2:
        kw = stripped
    elif len(stripped.split()) == 1 and slug:
        # Left side too short (e.g., "OCR — Extract Text"), fall back to slug
        return slug.replace('-', ' ').lower()

    # Step 3: Strip long parentheticals (>10 chars) — "(Duckworth-Lewis-Stern)", "(ASRS v1.1)"
    kw = re.sub(r'\s*\([^)]{10,}\)\s*$', '', kw)
    # Strip short parens with version numbers
    kw = re.sub(r'\s*\([^)]*v\d[^)]*\)\s*$', '', kw, flags=re.IGNORECASE)

    # Step 4: Strip privacy/free/confidential prefixes that aren't the real keyword
    kw = re.sub(r'^(Free\s+)?(Private\s+|Confidential\s+)', '', kw, flags=re.IGNORECASE)

    kw = kw.strip()

    # Step 5: If H1 is predominantly non-Latin script (Arabic, Japanese, CJK, etc.), prefer slug
    if slug:
        latin_chars = len(re.findall(r'[a-zA-Z]', kw))
        total_alpha = len(re.findall(r'[^\s\d\W]', kw)) or 1
        if latin_chars / total_alpha < 0.5:
            return slug.replace('-', ' ').lower()

    # Step 6: If H1 is a question ("What is...", "How much...", "Which..."), extract from title first
    if re.match(r'^(what|how|where|when|why|which|is|do|does|can|should|are|who)\s', kw, re.IGNORECASE):
        title = meta.get('title', '')
        title_kw = re.sub(r'\s*[—–|]\s*Teamz Lab.*$', '', title, flags=re.IGNORECASE).strip()
        title_kw = re.sub(r'\s*[—–]\s+.*$', '', title_kw).strip()
        if title_kw and len(title_kw.split()) >= 2:
            return title_kw.lower()
        elif slug:
            slug_kw = slug.replace('-', ' ')
            if len(slug_kw.split()) >= 2:
                return slug_kw.lower()

    # Step 7: If keyword is very long (>6 words), cross-reference with slug to shorten
    words = kw.split()
    if len(words) > 6 and slug:
        slug_kw = slug.replace('-', ' ')
        # Use slug if it has meaningful words (>= 3) and overlaps with H1
        slug_word_set = set(slug_kw.split())
        kw_word_set = set(w.lower() for w in words)
        if len(slug_word_set & kw_word_set) >= 2 and len(slug_kw.split()) >= 3:
            return slug_kw.lower()
        # Otherwise, keep first 6 words of H1
        kw = ' '.join(words[:6])

    return kw.lower().strip() if kw else slug.replace('-', ' ').lower()


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


def fetch_google_autocomplete(query, lang='en', country=''):
    """
    Step 2: FREE keyword research using Google Autocomplete API.
    No API key needed. Returns real search suggestions.
    country='' means worldwide (no geo filter).
    """
    try:
        encoded = urllib.parse.quote(query)
        geo_param = f"&gl={country}" if country else ""
        url = f"http://suggestqueries.google.com/complete/search?client=firefox&q={encoded}&hl={lang}{geo_param}"
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


# ─── GOOGLE TRENDS (FREE) ─────────────────────────────────────────

def fetch_google_trends(keyword, geo='', timeframe='today 12-m'):
    """
    Fetch Google Trends data for a keyword using the public embed/explore endpoint.
    Returns interest over time data (relative 0-100 scale).
    No API key needed — uses the same endpoint as the Trends website.
    """
    try:
        # Google Trends explore URL — returns a token we need
        encoded = urllib.parse.quote(keyword)
        # Use the trending searches daily API for related queries
        url = f"https://trends.google.com/trends/api/autocomplete/{encoded}?hl=en-US&tz=-360"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read().decode('utf-8')
            # Google prepends ")]}'\n" to JSON responses
            if raw.startswith(")]}'"):
                raw = raw[raw.index('\n')+1:]
            data = json.loads(raw)
            topics = []
            if 'default' in data and 'topics' in data['default']:
                for topic in data['default']['topics']:
                    mid = topic.get('mid', '')
                    title = topic.get('title', '')
                    topic_type = topic.get('type', '')
                    topics.append({'mid': mid, 'title': title, 'type': topic_type})
            return topics
    except Exception:
        pass
    return []


def _get_trends_opener():
    """Create a urllib opener with session cookies from Google Trends homepage."""
    import http.cookiejar
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    # Visit homepage to get NID cookie (required for API access)
    try:
        req = urllib.request.Request('https://trends.google.com/trends/?geo=US', headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        })
        opener.open(req, timeout=10)
    except Exception:
        pass
    return opener


def fetch_trends_interest(keyword, compare_keyword=None, geo='', timeframe='today 12-m'):
    """
    Fetch interest-over-time data from Google Trends.
    Uses session cookie + public widget endpoint. Returns monthly interest values (0-100).
    """
    try:
        opener = _get_trends_opener()

        # Build the comparison request
        kw_list = [keyword]
        if compare_keyword:
            kw_list.append(compare_keyword)

        # Google Trends explore API — get widget tokens
        req_obj = {
            'comparisonItem': [
                {'keyword': kw, 'geo': geo, 'time': timeframe}
                for kw in kw_list
            ],
            'category': 0,
            'property': ''
        }
        req_json = json.dumps(req_obj)
        explore_url = f"https://trends.google.com/trends/api/explore?hl=en-US&tz=-360&req={urllib.parse.quote(req_json)}&tz=-360"

        req = urllib.request.Request(explore_url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        })
        with opener.open(req, timeout=10) as resp:
            raw = resp.read().decode('utf-8')
            if raw.startswith(")]}'"):
                raw = raw[raw.index('\n')+1:]
            data = json.loads(raw)

            # Extract the TIMESERIES widget token
            widgets = data.get('widgets', [])
            time_widget = None
            related_widget = None
            for w in widgets:
                if w.get('id') == 'TIMESERIES':
                    time_widget = w
                elif w.get('id') == 'RELATED_QUERIES':
                    related_widget = w

            results = {'interest': [], 'related': [], 'keywords': kw_list}

            # Fetch interest over time
            if time_widget:
                token = time_widget.get('token', '')
                req_inner = time_widget.get('request', '')
                ts_url = f"https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=-360&req={urllib.parse.quote(json.dumps(req_inner))}&token={token}&tz=-360"
                req2 = urllib.request.Request(ts_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                })
                with opener.open(req2, timeout=10) as resp2:
                    raw2 = resp2.read().decode('utf-8')
                    if raw2.startswith(")]}'"):
                        raw2 = raw2[raw2.index('\n')+1:]
                    ts_data = json.loads(raw2)

                    timeline = ts_data.get('default', {}).get('timelineData', [])
                    for point in timeline:
                        time_str = point.get('formattedTime', '')
                        values = point.get('value', [])
                        results['interest'].append({
                            'time': time_str,
                            'values': values
                        })

            # Fetch related queries
            if related_widget:
                token = related_widget.get('token', '')
                req_inner = related_widget.get('request', '')
                rq_url = f"https://trends.google.com/trends/api/widgetdata/relatedsearches?hl=en-US&tz=-360&req={urllib.parse.quote(json.dumps(req_inner))}&token={token}&tz=-360"
                req3 = urllib.request.Request(rq_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                })
                with opener.open(req3, timeout=10) as resp3:
                    raw3 = resp3.read().decode('utf-8')
                    if raw3.startswith(")]}'"):
                        raw3 = raw3[raw3.index('\n')+1:]
                    rq_data = json.loads(raw3)

                    # Rising queries
                    ranked = rq_data.get('default', {}).get('rankedList', [])
                    for group in ranked:
                        for item in group.get('rankedKeyword', []):
                            query_text = item.get('query', '')
                            value = item.get('formattedValue', '')
                            link = item.get('link', '')
                            results['related'].append({
                                'query': query_text,
                                'value': value,
                            })

            return results
    except Exception as e:
        return {'error': str(e), 'interest': [], 'related': [], 'keywords': [keyword]}


def run_trends(keywords, geo=''):
    """
    Run Google Trends analysis for one or two keywords.
    Shows interest over time, trend direction, seasonal patterns, and related queries.
    """
    if not keywords:
        print("Usage: python3 seo-keyword-engine.py trends \"keyword1\" [\"keyword2\"]")
        return

    kw1 = keywords[0]
    kw2 = keywords[1] if len(keywords) > 1 else None

    print(f"\n{'='*60}")
    print(f"  GOOGLE TRENDS ANALYSIS")
    print(f"{'='*60}")
    print(f"  Keyword 1: \"{kw1}\"")
    if kw2:
        print(f"  Keyword 2: \"{kw2}\" (comparison)")
    print(f"  Region:    {geo if geo else 'Worldwide'}")
    print(f"  Period:    Last 12 months")
    print()

    # Step 1: Topic matching
    print(f"  [1/3] Finding trending topics for \"{kw1}\"...")
    topics = fetch_google_trends(kw1)
    if topics:
        print(f"  Google recognizes these related topics:")
        for t in topics[:5]:
            print(f"    -> {t['title']} ({t['type']})")
    else:
        print(f"  No topic matches found (niche keyword)")

    # Step 2: Interest over time
    print(f"\n  [2/3] Fetching interest over time...")
    data = fetch_trends_interest(kw1, kw2, geo=geo)

    if 'error' in data:
        print(f"  Error: {data['error']}")
        print(f"  Note: Google Trends may rate-limit automated requests.")
        print(f"  Try manually: https://trends.google.com/trends/explore?q={urllib.parse.quote(kw1)}")
        print(f"\n{'='*60}\n")
        return

    interest = data.get('interest', [])
    kw_names = data.get('keywords', [kw1])

    if interest:
        print(f"\n  Interest Over Time (0-100 scale):")
        print(f"  {'Month':<20s}", end='')
        for name in kw_names:
            print(f"  {name[:20]:<20s}", end='')
        print()
        print(f"  {'-'*20}", end='')
        for _ in kw_names:
            print(f"  {'-'*20}", end='')
        print()

        # Show data points
        values_per_kw = [[] for _ in kw_names]
        for point in interest:
            time_str = point['time']
            vals = point['values']
            print(f"  {time_str:<20s}", end='')
            for i, v in enumerate(vals):
                bar = '#' * (v // 5) if v > 0 else ''
                print(f"  {v:>3d} {bar:<15s}", end='')
                if i < len(values_per_kw):
                    values_per_kw[i].append(v)
            print()

        # Trend analysis
        print(f"\n  TREND ANALYSIS:")
        for i, name in enumerate(kw_names):
            if values_per_kw[i]:
                vals = values_per_kw[i]
                avg = sum(vals) / len(vals)
                peak = max(vals)
                low = min(vals)
                recent_3 = vals[-3:] if len(vals) >= 3 else vals
                early_3 = vals[:3] if len(vals) >= 3 else vals
                recent_avg = sum(recent_3) / len(recent_3)
                early_avg = sum(early_3) / len(early_3)

                if recent_avg > early_avg * 1.15:
                    direction = "RISING"
                elif recent_avg < early_avg * 0.85:
                    direction = "FALLING"
                else:
                    direction = "STABLE"

                print(f"    \"{name}\":")
                print(f"      Average interest:  {avg:.0f}/100")
                print(f"      Peak:              {peak}/100")
                print(f"      Low:               {low}/100")
                print(f"      Trend:             {direction}")
                print(f"      Seasonality:       {'Yes (>{0}pt swing)'.format(peak-low) if peak - low > 30 else 'Low variation'}")

        # Winner comparison
        if kw2 and len(values_per_kw) >= 2:
            avg1 = sum(values_per_kw[0]) / len(values_per_kw[0]) if values_per_kw[0] else 0
            avg2 = sum(values_per_kw[1]) / len(values_per_kw[1]) if values_per_kw[1] else 0
            print(f"\n  COMPARISON:")
            if avg1 > avg2 * 1.1:
                print(f"    WINNER: \"{kw_names[0]}\" (avg {avg1:.0f} vs {avg2:.0f})")
            elif avg2 > avg1 * 1.1:
                print(f"    WINNER: \"{kw_names[1]}\" (avg {avg2:.0f} vs {avg1:.0f})")
            else:
                print(f"    TIE: Both keywords have similar interest ({avg1:.0f} vs {avg2:.0f})")
    else:
        print(f"  No interest data returned.")
        print(f"  This usually means the keyword is too niche for Trends to track.")
        print(f"  Try a broader term or check manually:")
        print(f"  https://trends.google.com/trends/explore?q={urllib.parse.quote(kw1)}")

    # Step 3: Related queries
    print(f"\n  [3/3] Related & rising queries...")
    related = data.get('related', [])
    if related:
        # Split into top and rising
        rising = [r for r in related if 'Breakout' in r.get('value', '') or '%' in r.get('value', '')]
        top = [r for r in related if r not in rising]

        if rising:
            print(f"\n  RISING QUERIES (opportunities):")
            for r in rising[:10]:
                print(f"    {r['query']:<45s}  {r['value']}")

        if top:
            print(f"\n  TOP RELATED QUERIES:")
            for r in top[:10]:
                print(f"    {r['query']:<45s}  {r['value']}")
    else:
        print(f"  No related queries returned.")

    # Helpful link
    trends_url = f"https://trends.google.com/trends/explore?q={urllib.parse.quote(kw1)}"
    if kw2:
        trends_url += f",{urllib.parse.quote(kw2)}"
    print(f"\n  Full interactive chart: {trends_url}")
    print(f"\n{'='*60}\n")


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


def normalize_for_match(text):
    """Normalize text for keyword matching — strips punctuation, lowercases."""
    text = text.lower()
    # Replace & with space, strip commas, periods, colons, question marks, hyphens used as words
    text = re.sub(r'[&,.:;!?/+]', ' ', text)
    text = re.sub(r"['\"]", '', text)
    # Normalize hyphens between words to spaces for matching
    text = re.sub(r'(?<=[a-z])-(?=[a-z])', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def word_overlap_score(keyword, text):
    """Calculate what fraction of keyword words appear in text (0.0-1.0)."""
    kw_norm = normalize_for_match(keyword)
    text_norm = normalize_for_match(text)
    # First check exact normalized match
    if kw_norm in text_norm:
        return 1.0
    # Also check if joined keyword (compound word) exists in text
    # Handles German: "mietbelastungs rechner" → "mietbelastungsrechner"
    kw_joined = kw_norm.replace(' ', '')
    text_joined = text_norm.replace(' ', '')
    if kw_joined in text_joined:
        return 1.0
    # Word overlap
    kw_words = set(kw_norm.split())
    text_words = set(text_norm.split())
    if not kw_words:
        return 0.0
    # Also check if keyword words appear as substrings of text words (compound word matching)
    # e.g., "mietbelastungs" is in "mietbelastungsrechner"
    kw_significant = set(w for w in kw_words if len(w) > 2)
    if not kw_significant:
        kw_significant = kw_words
    overlap = set()
    for kw_w in kw_significant:
        if kw_w in text_words:
            overlap.add(kw_w)
        else:
            # Check if keyword word is substring of any text word (compound words)
            for tw in text_words:
                if kw_w in tw or tw in kw_w:
                    overlap.add(kw_w)
                    break
    return len(overlap) / len(kw_significant)


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

    # Detect non-Latin H1 (Arabic, Japanese, etc.) — these get relaxed scoring
    h1_raw = meta.get('h1', '')
    latin_in_h1 = len(re.findall(r'[a-zA-Z]', h1_raw))
    total_alpha_h1 = len(re.findall(r'[^\s\d\W]', h1_raw)) or 1
    is_non_latin = (latin_in_h1 / total_alpha_h1) < 0.5 if h1_raw else False

    # 1. Title tag — keyword near beginning (25 points)
    max_score += 25
    title = meta.get('title', '').lower()
    title_clean = re.sub(r'\s*[—–|-]\s*teamz lab.*$', '', title)
    title_overlap = word_overlap_score(primary_kw, title_clean)
    if primary_kw in title_clean:
        if title_clean.startswith(primary_kw) or title_clean.find(primary_kw) < 10:
            score += 25
        else:
            score += 15
            issues.append(f'TITLE: Keyword "{primary_kw}" not near beginning of title')
    elif normalize_for_match(primary_kw) in normalize_for_match(title_clean):
        # Exact match after normalizing punctuation (& → space, hyphens → space)
        score += 23
    elif title_overlap >= 0.8:
        score += 20
    elif is_non_latin and title:
        score += 20
    elif title_overlap >= 0.5:
        score += 12
        issues.append(f'TITLE: Only {title_overlap:.0%} keyword word overlap in title')
    else:
        issues.append(f'TITLE: Primary keyword "{primary_kw}" missing from title tag')

    # 2. URL slug — contains keyword words (15 points)
    max_score += 15
    slug = meta.get('slug', '').lower()
    slug_words = set(slug.split('-'))
    # Hyphen-aware: "self-employment" → {"self", "employment"} for matching
    kw_words = set(w for word in primary_kw.split() for w in word.split('-'))
    # Filter out very short words (1-2 chars) that cause false matches
    kw_words = set(w for w in kw_words if len(w) > 2)
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
    h1_overlap = word_overlap_score(primary_kw, h1)
    if primary_kw in h1 or normalize_for_match(primary_kw) in normalize_for_match(h1):
        score += 20
    elif is_non_latin:
        score += 20
    elif h1_overlap >= 0.7:
        score += 15
    elif h1_overlap >= 0.4:
        score += 10
        issues.append(f'H1: Partial keyword match ({h1_overlap:.0%}). H1="{meta["h1"]}"')
    else:
        issues.append(f'H1: Primary keyword "{primary_kw}" missing from H1')

    # 4. Intro/description — keyword in first 100 words (15 points)
    max_score += 15
    intro = meta.get('intro', '').lower()
    desc = meta.get('description', '').lower()
    intro_desc_combined = f"{intro} {desc}"
    intro_overlap = word_overlap_score(primary_kw, intro_desc_combined)
    if primary_kw in intro or primary_kw in desc:
        score += 15
    elif normalize_for_match(primary_kw) in normalize_for_match(intro_desc_combined):
        score += 14
    elif is_non_latin and (intro or desc):
        score += 12
    elif intro_overlap >= 0.7:
        score += 12
    elif intro_overlap >= 0.4:
        score += 8
        issues.append(f'INTRO: Only {intro_overlap:.0%} keyword overlap in intro/description')
    else:
        issues.append(f'INTRO: Primary keyword missing from intro/description')

    # 5. H2/H3 subheadings — keyword in at least one (10 points)
    max_score += 10
    all_headings = ' '.join(meta.get('h2s', []) + meta.get('h3s', [])).lower()
    headings_overlap = word_overlap_score(primary_kw, all_headings)
    if primary_kw in all_headings or normalize_for_match(primary_kw) in normalize_for_match(all_headings):
        score += 10
    elif is_non_latin and all_headings:
        score += 8
    elif headings_overlap >= 0.6:
        score += 8
    elif headings_overlap >= 0.3:
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

    # Check for action verb in description (English pages only)
    page_lang = meta.get('lang', 'en')
    if desc_text and not is_non_latin and page_lang == 'en':
        action_verbs = ['calculate', 'check', 'find', 'get', 'create', 'build',
                        'generate', 'convert', 'test', 'analyze', 'compare',
                        'discover', 'explore', 'learn', 'make', 'plan', 'rate',
                        'scan', 'search', 'track', 'try', 'use', 'estimate',
                        'measure', 'evaluate', 'assess', 'paste', 'enter', 'take',
                        'predict', 'decide', 'see', 'view', 'answer', 'log',
                        'spin', 'pick', 'choose', 'select', 'run', 'verify',
                        'identify', 'determine', 'solve', 'count', 'compute',
                        'free', 'instantly', 'quickly', 'easily']
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
        if is_non_latin:
            # Non-Latin: slug keyword density in native text is irrelevant — give full credit
            score += 5
        elif 0.5 <= density <= 2.5:
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

    elif command == 'trends':
        # Parse --geo flag
        geo = ''
        args = sys.argv[2:]
        filtered = []
        i = 0
        while i < len(args):
            if args[i] == '--geo' and i + 1 < len(args):
                geo = args[i+1].upper()
                i += 2
            elif args[i].startswith('--geo='):
                geo = args[i].split('=', 1)[1].upper()
                i += 1
            elif not args[i].startswith('-'):
                filtered.append(args[i].strip('"\''))
                i += 1
            else:
                i += 1
        if not filtered:
            print("Usage: python3 seo-keyword-engine.py trends \"keyword1\" [\"keyword2\"] [--geo US]")
            print("  Single:   trends \"bmi calculator\"")
            print("  Compare:  trends \"bmi calculator\" \"body mass index calculator\"")
            print("  Regional: trends \"tax calculator\" --geo GB")
            print("  Geo codes: US, GB, DE, FR, IN, AU, NL, JP, etc.")
            sys.exit(1)
        run_trends(filtered, geo=geo)

    elif command == 'fix':
        dry_run = '--dry-run' in sys.argv
        run_fix(dry_run=dry_run)

    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
