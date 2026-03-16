#!/usr/bin/env python3
"""
build-static-schema.py
Extracts schema data from each page's inline JS and injects
static <script type="application/ld+json"> into <head>.
Runs via build-static-schema.sh (called by pre-commit hook).
"""

import os, re, json, html, glob

SITE_URL = "https://tool.teamzlab.com"
TEAMZ_URL = "https://teamzlab.com"
MARKER = "<!-- STATIC-SCHEMA -->"

SKIP_DIRS = {"about", "contact", "privacy", "terms"}
count = 0
skip = 0
errors = []


def extract_breadcrumbs(content):
    """Extract breadcrumb schema from injectBreadcrumbSchema([...]) or variable."""
    # Pattern 1: inline array — injectBreadcrumbSchema([{...},{...}])
    m = re.search(r'injectBreadcrumbSchema\(\[(.+?)\]\)', content, re.DOTALL)
    if not m:
        # Pattern 2: variable — var breadcrumbs = [...] or var BREADCRUMBS = [...]
        for varname in ('breadcrumbs', 'BREADCRUMBS'):
            if f'injectBreadcrumbSchema({varname})' in content:
                m2 = re.search(rf'var {varname}\s*=\s*\[(.+?)\]', content, re.DOTALL)
                if m2:
                    m = m2
                    break
    if not m:
        return None

    arr_str = m.group(1)
    # Normalize JS objects to JSON: {name:'X',url:'/'} -> {"name":"X","url":"/"}
    arr_str = re.sub(r"(\w+)\s*:\s*'", r'"\1":"', arr_str)
    arr_str = re.sub(r"'\s*([,}])", r'"\1', arr_str)
    # Handle double-quoted JS too
    arr_str = re.sub(r'(\w+)\s*:\s*"', r'"\1":"', arr_str)

    try:
        items = json.loads("[" + arr_str + "]")
    except json.JSONDecodeError:
        return None

    elements = []
    for i, item in enumerate(items):
        entry = {"@type": "ListItem", "position": i + 1, "name": html.unescape(item["name"])}
        if "url" in item:
            entry["item"] = SITE_URL + item["url"]
        elements.append(entry)

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": elements,
    }


def extract_faqs(content):
    """Extract FAQ schema from var faqs = [...] block."""
    if "injectFAQSchema" not in content:
        return None

    # Try all variable name patterns
    start = -1
    for varname in ("var faqs = [", "var faqs=[", "var FAQS = [", "var FAQS=["):
        start = content.find(varname)
        if start != -1:
            break
    if start == -1:
        return None

    bracket_start = content.index("[", start)
    depth = 0
    end = bracket_start
    for i in range(bracket_start, len(content)):
        if content[i] == "[":
            depth += 1
        elif content[i] == "]":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    arr_str = content[bracket_start:end]

    # Extract q/a pairs with regex
    pairs = re.findall(
        r"q\s*:\s*['\"](.+?)['\"],\s*\n?\s*a\s*:\s*['\"](.+?)['\"]\s*\n?\s*}",
        arr_str,
        re.DOTALL,
    )

    if not pairs:
        return None

    faqs = []
    for q, a in pairs:
        q = q.replace("\\'", "'").replace('\\"', '"').strip()
        a = a.replace("\\'", "'").replace('\\"', '"').strip()
        faqs.append(
            {
                "@type": "Question",
                "name": html.unescape(q),
                "acceptedAnswer": {"@type": "Answer", "text": html.unescape(a)},
            }
        )

    if not faqs:
        return None

    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqs}


def extract_webapp(content):
    """Extract WebApplication schema from injectWebAppSchema({...}) or variable."""
    m = re.search(r"injectWebAppSchema\(\{(.*?)\}\)", content, re.DOTALL)
    if not m:
        # Try variable pattern: var TOOL_CONFIG = {...}; injectWebAppSchema(TOOL_CONFIG)
        for varname in ("TOOL_CONFIG", "toolConfig"):
            if f"injectWebAppSchema({varname})" in content:
                m2 = re.search(rf"var {varname}\s*=\s*\{{(.*?)\}}", content, re.DOTALL)
                if m2:
                    m = m2
                    break
    if not m:
        return None

    block = m.group(1)

    title_m = re.search(r"title\s*:\s*['\"](.+?)['\"]", block)
    desc_m = re.search(r"description\s*:\s*['\"](.+?)['\"]", block)
    slug_m = re.search(r"slug\s*:\s*['\"](.+?)['\"]", block)

    if not title_m or not slug_m:
        return None

    title = title_m.group(1).replace("\\'", "'")
    desc = desc_m.group(1).replace("\\'", "'") if desc_m else title
    slug = slug_m.group(1)

    # Get lang from <html lang="xx">
    lang_m = re.search(r'<html[^>]*lang="([^"]+)"', content)
    lang = lang_m.group(1) if lang_m else "en"

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": html.unescape(title),
        "description": html.unescape(desc),
        "url": f"{SITE_URL}/{slug}/",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "author": {"@type": "Organization", "name": "Teamz Lab", "url": TEAMZ_URL},
        "inLanguage": lang,
    }


def process_file(filepath):
    """Process a single HTML file: extract schemas, inject static JSON-LD."""
    global count, skip

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip redirect pages
    if 'http-equiv="refresh"' in content:
        return

    # Remove old static schema blocks
    if MARKER in content:
        content = re.sub(
            rf"{re.escape(MARKER)}.*?{re.escape(MARKER)}\n?",
            "",
            content,
            flags=re.DOTALL,
        )

    # Extract all schemas
    schema_blocks = []

    bc = extract_breadcrumbs(content)
    if bc:
        schema_blocks.append(json.dumps(bc, ensure_ascii=False))

    faq = extract_faqs(content)
    if faq:
        schema_blocks.append(json.dumps(faq, ensure_ascii=False))

    webapp = extract_webapp(content)
    if webapp:
        schema_blocks.append(json.dumps(webapp, ensure_ascii=False))

    if not schema_blocks:
        skip += 1
        return

    # Build the injection block
    lines = [MARKER]
    for schema_json in schema_blocks:
        lines.append(f'  <script type="application/ld+json">{schema_json}</script>')
    lines.append(MARKER)
    injection = "\n".join(lines) + "\n"

    # Insert before </head>
    if "</head>" in content:
        content = content.replace("</head>", injection + "</head>", 1)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        count += 1
    else:
        errors.append(filepath)


def main():
    print("=== Building static schema ===")

    for filepath in sorted(glob.glob("**/index.html", recursive=True)):
        # Skip root-level non-tool pages
        parts = filepath.split("/")
        if len(parts) < 2:
            continue  # skip root index.html
        if parts[0] in SKIP_DIRS:
            continue
        if filepath == "404.html":
            continue

        process_file(filepath)

    print(f"  Static schema: {count} pages updated, {skip} skipped")
    if errors:
        print(f"  Errors: {len(errors)} files")
        for e in errors:
            print(f"    {e}")
    print("=== Done ===")


if __name__ == "__main__":
    main()
