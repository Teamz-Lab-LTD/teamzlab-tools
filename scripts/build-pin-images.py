#!/usr/bin/env python3
"""
Pinterest Pin Image Generator — Teamz Lab Tools
Generates vertical 1000x1500px pin images optimized for Pinterest.

Usage:
  python3 scripts/build-pin-images.py                          # Generate for ALL articles
  python3 scripts/build-pin-images.py us-finance-tools-2026    # Generate for one article
  python3 scripts/build-pin-images.py --list                   # List articles without pin images

Output: scripts/distribute/pin-images/<slug>.png
"""

import math
import os
import re
import sys
import textwrap
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("  ERROR: Pillow not installed. Run: pip3 install Pillow")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
ARTICLES_DIR = SCRIPT_DIR / "distribute" / "articles"
PIN_DIR = SCRIPT_DIR / "distribute" / "pin-images"
PROJECT_ROOT = SCRIPT_DIR.parent

# Design constants
WIDTH = 1000
HEIGHT = 1500
ACCENT = (217, 254, 6)       # #D9FE06 — brand neon
BG_DARK = (18, 21, 26)       # #12151A — brand dark
ACCENT_TEXT = (18, 21, 26)   # dark text on neon
SURFACE = (30, 34, 42)       # #1E222A — card surface
BORDER = (50, 55, 65)        # subtle border
WHITE = (255, 255, 255)
MUTED = (160, 165, 175)

# Category → emoji + color accent for variety
CATEGORY_THEMES = {
    "finance":  {"icon": "💰", "stripe": (34, 197, 94)},    # green
    "tax":      {"icon": "🧾", "stripe": (34, 197, 94)},
    "health":   {"icon": "❤️", "stripe": (239, 68, 68)},    # red
    "career":   {"icon": "💼", "stripe": (59, 130, 246)},   # blue
    "dev":      {"icon": "⚡", "stripe": (139, 92, 246)},   # purple
    "ai":       {"icon": "🤖", "stripe": (139, 92, 246)},
    "design":   {"icon": "🎨", "stripe": (236, 72, 153)},   # pink
    "tools":    {"icon": "🛠️", "stripe": ACCENT},
    "crypto":   {"icon": "₿", "stripe": (251, 146, 60)},   # orange
    "photo":    {"icon": "📸", "stripe": (236, 72, 153)},
    "sports":   {"icon": "⚽", "stripe": (34, 197, 94)},
    "food":     {"icon": "🍳", "stripe": (251, 146, 60)},
    "coffee":   {"icon": "☕", "stripe": (180, 120, 60)},    # brown
    "tea":      {"icon": "🍵", "stripe": (34, 197, 94)},
    "baby":     {"icon": "👶", "stripe": (236, 72, 153)},
    "physics":  {"icon": "⚛️", "stripe": (59, 130, 246)},
    "science":  {"icon": "🔬", "stripe": (59, 130, 246)},
    "baking":   {"icon": "🧁", "stripe": (251, 146, 60)},
    "eid":      {"icon": "🌙", "stripe": (34, 197, 94)},
    "uae":      {"icon": "🇦🇪", "stripe": (34, 197, 94)},
    "japan":    {"icon": "🇯🇵", "stripe": (239, 68, 68)},
    "us":       {"icon": "🇺🇸", "stripe": (59, 130, 246)},
    "uk":       {"icon": "🇬🇧", "stripe": (59, 130, 246)},
    "de":       {"icon": "🇩🇪", "stripe": (251, 146, 60)},
    "eu":       {"icon": "🇪🇺", "stripe": (59, 130, 246)},
    "default":  {"icon": "⚡", "stripe": ACCENT},
}


def load_fonts():
    """Load fonts with fallback chain."""
    font_paths = {
        "title": [
            "/System/Library/Fonts/Avenir Next.ttc",
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/System/Library/Fonts/Helvetica.ttc",
        ],
        "body": [
            "/System/Library/Fonts/Avenir Next.ttc",
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/System/Library/Fonts/Helvetica.ttc",
        ],
    }
    fonts = {}
    for role, paths in font_paths.items():
        loaded = False
        for p in paths:
            if os.path.isfile(p):
                try:
                    if role == "title":
                        # Index 9 = Avenir Next Bold, fallback to 0
                        for idx in (9, 1, 0):
                            try:
                                fonts["title_lg"] = ImageFont.truetype(p, 58, index=idx)
                                fonts["title_sm"] = ImageFont.truetype(p, 44, index=idx)
                                loaded = True
                                break
                            except Exception:
                                continue
                    else:
                        for idx in (0, 1):
                            try:
                                fonts["body"] = ImageFont.truetype(p, 28, index=idx)
                                fonts["tag"] = ImageFont.truetype(p, 22, index=idx)
                                fonts["brand"] = ImageFont.truetype(p, 24, index=idx)
                                fonts["small"] = ImageFont.truetype(p, 20, index=idx)
                                loaded = True
                                break
                            except Exception:
                                continue
                except Exception:
                    continue
            if loaded:
                break
        if not loaded:
            fonts.setdefault("title_lg", ImageFont.load_default())
            fonts.setdefault("title_sm", ImageFont.load_default())
            fonts.setdefault("body", ImageFont.load_default())
            fonts.setdefault("tag", ImageFont.load_default())
            fonts.setdefault("brand", ImageFont.load_default())
            fonts.setdefault("small", ImageFont.load_default())
    return fonts


def detect_category(slug, tags, title):
    """Detect category from article metadata."""
    text = f"{slug} {tags} {title}".lower()
    for cat in CATEGORY_THEMES:
        if cat == "default":
            continue
        if cat in text:
            return cat
    return "default"


def extract_bullet_points(body, max_points=5):
    """Extract key bullet points from article body."""
    points = []
    for line in body.split("\n"):
        line = line.strip()
        # Match markdown headers as topic points
        m = re.match(r"^##\s+\d*\.?\s*(.*)", line)
        if m:
            text = m.group(1).strip()
            # Clean markdown
            text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
            text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
            if len(text) > 10 and len(text) < 80:
                points.append(text)
        if len(points) >= max_points:
            break

    # Fallback: extract bold items
    if len(points) < 3:
        for m in re.finditer(r"\*\*(.+?)\*\*", body):
            text = m.group(1).strip()
            if 15 < len(text) < 70 and text not in points:
                points.append(text)
            if len(points) >= max_points:
                break

    return points[:max_points]


def count_tools(body):
    """Count tool links in the article."""
    links = re.findall(r"\[.+?\]\(https://tool\.teamzlab\.com/.+?\)", body)
    return len(links)


def draw_rounded_rect(draw, xy, radius, fill, outline=None):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline)


def generate_pin(slug, title, tags, body, canonical_url, output_path):
    """Generate a single Pinterest pin image."""
    fonts = load_fonts()
    category = detect_category(slug, tags, title)
    theme = CATEGORY_THEMES.get(category, CATEGORY_THEMES["default"])
    stripe_color = theme["stripe"]
    bullet_points = extract_bullet_points(body)
    tool_count = count_tools(body)

    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)

    # --- Top accent stripe ---
    draw.rectangle([0, 0, WIDTH, 8], fill=stripe_color)

    # --- "TEAMZ LAB TOOLS" brand bar ---
    y = 50
    draw.text((60, y), "TEAMZ LAB TOOLS", fill=MUTED, font=fonts["tag"])

    # --- Accent pill: "FREE" ---
    free_text = "FREE"
    free_bbox = draw.textbbox((0, 0), free_text, font=fonts["tag"])
    free_w = free_bbox[2] - free_bbox[0] + 24
    free_x = WIDTH - 60 - free_w
    draw_rounded_rect(draw, (free_x, y - 4, free_x + free_w, y + 30), radius=14, fill=ACCENT)
    draw.text((free_x + 12, y - 1), free_text, fill=ACCENT_TEXT, font=fonts["tag"])

    # --- Title ---
    y = 110
    # Word-wrap title
    title_clean = title.replace(" — ", "\n").replace(" - ", "\n")
    if len(title_clean) > 50:
        wrapped = textwrap.fill(title_clean, width=22)
        font = fonts["title_sm"]
    else:
        wrapped = textwrap.fill(title_clean, width=18)
        font = fonts["title_lg"]

    for line in wrapped.split("\n")[:5]:
        draw.text((60, y), line, fill=WHITE, font=font)
        line_bbox = draw.textbbox((0, 0), line, font=font)
        y += (line_bbox[3] - line_bbox[1]) + 14
    y += 10

    # --- Separator line ---
    draw.rectangle([60, y, 200, y + 3], fill=stripe_color)
    y += 35

    # --- Bullet points (key topics from article) ---
    if bullet_points:
        for i, point in enumerate(bullet_points[:5]):
            # Bullet marker
            draw.ellipse([66, y + 8, 78, y + 20], fill=stripe_color)
            # Truncate if too long
            display = point[:55] + ("..." if len(point) > 55 else "")
            draw.text((95, y), display, fill=WHITE, font=fonts["body"])
            y += 48

    y += 20

    # --- Stats card ---
    card_y = y
    card_h = 130
    draw_rounded_rect(draw, (50, card_y, WIDTH - 50, card_y + card_h), radius=16, fill=SURFACE, outline=BORDER)

    # Tool count
    stat_y = card_y + 20
    if tool_count > 0:
        count_text = f"{tool_count}+"
        draw.text((90, stat_y), count_text, fill=ACCENT, font=fonts["title_sm"])
        count_bbox = draw.textbbox((0, 0), count_text, font=fonts["title_sm"])
        draw.text((90 + count_bbox[2] - count_bbox[0] + 12, stat_y + 12), "Free Tools", fill=MUTED, font=fonts["body"])

    # Trust badges
    stat_y += 65
    badges = ["No Signup", "100% Private", "Runs in Browser"]
    bx = 90
    for badge in badges:
        draw.text((bx, stat_y), f"  {badge}", fill=MUTED, font=fonts["small"])
        badge_bbox = draw.textbbox((0, 0), f"  {badge}", font=fonts["small"])
        bx += (badge_bbox[2] - badge_bbox[0]) + 30

    y = card_y + card_h + 40

    # --- Tags ---
    if tags:
        tag_list = [t.strip() for t in tags.split(",")][:5]
        tx = 60
        for tag in tag_list:
            tag_text = f"#{tag}"
            tag_bbox = draw.textbbox((0, 0), tag_text, font=fonts["tag"])
            tw = tag_bbox[2] - tag_bbox[0] + 20
            if tx + tw > WIDTH - 60:
                break
            draw_rounded_rect(draw, (tx, y, tx + tw, y + 32), radius=12, fill=SURFACE, outline=BORDER)
            draw.text((tx + 10, y + 4), tag_text, fill=MUTED, font=fonts["tag"])
            tx += tw + 12

    # --- Bottom CTA bar ---
    cta_h = 90
    cta_y = HEIGHT - cta_h
    draw.rectangle([0, cta_y, WIDTH, HEIGHT], fill=ACCENT)

    cta_text = "tool.teamzlab.com"
    cta_bbox = draw.textbbox((0, 0), cta_text, font=fonts["body"])
    cta_tw = cta_bbox[2] - cta_bbox[0]
    draw.text(((WIDTH - cta_tw) // 2, cta_y + 15), cta_text, fill=ACCENT_TEXT, font=fonts["body"])

    sub_text = "Try it free — tap to open"
    sub_bbox = draw.textbbox((0, 0), sub_text, font=fonts["small"])
    sub_tw = sub_bbox[2] - sub_bbox[0]
    draw.text(((WIDTH - sub_tw) // 2, cta_y + 52), sub_text, fill=(50, 55, 40), font=fonts["small"])

    # --- Bottom stripe ---
    draw.rectangle([0, HEIGHT - 6, WIDTH, HEIGHT], fill=stripe_color)

    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG", optimize=True)
    return output_path


def parse_frontmatter(filepath):
    """Parse YAML-ish frontmatter from markdown file."""
    with open(filepath, encoding="utf-8") as f:
        content = f.read()
    if not content.startswith("---"):
        return {}, content
    end = content.index("---", 3)
    fm_text = content[3:end]
    body = content[end + 3:].strip()
    meta = {}
    for line in fm_text.strip().split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            meta[key.strip()] = val.strip().strip('"').strip("'")
    return meta, body


def main():
    args = sys.argv[1:]

    if "--list" in args:
        print("\n  Articles without pin images:")
        for md in sorted(ARTICLES_DIR.glob("*.md")):
            slug = md.stem
            pin = PIN_DIR / f"{slug}.png"
            if not pin.exists():
                print(f"    {slug}")
        return

    # Determine which articles to process
    if args and args[0] != "--list":
        targets = [args[0]]
    else:
        targets = [md.stem for md in sorted(ARTICLES_DIR.glob("*.md")) if md.stem != "sample-post"]

    generated = 0
    for slug in targets:
        md_file = ARTICLES_DIR / f"{slug}.md"
        if not md_file.exists():
            print(f"  SKIP: {slug} — article not found")
            continue

        output = PIN_DIR / f"{slug}.png"
        meta, body = parse_frontmatter(md_file)
        title = meta.get("title", slug.replace("-", " ").title())

        # Try to extract title from first H1 or article content
        if title == slug.replace("-", " ").title():
            for line in body.split("\n"):
                if line.startswith("# "):
                    title = line[2:].strip()
                    break

        # Use the distribute history title if no explicit title
        tags = meta.get("tags", "")
        canonical = meta.get("canonical_url", "")

        print(f"  Generating: {slug}...", end=" ", flush=True)
        try:
            generate_pin(slug, title, tags, body, canonical, str(output))
            print(f"OK — {output}")
            generated += 1
        except Exception as e:
            print(f"FAILED — {e}")

    print(f"\n  Generated {generated} pin images in {PIN_DIR}/")


if __name__ == "__main__":
    main()
