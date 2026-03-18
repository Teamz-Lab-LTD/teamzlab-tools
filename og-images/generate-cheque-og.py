#!/usr/bin/env python3
"""Generate compelling OG image for Eid Salami Cheque Book shared links."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), 'eid-salami-cheque.png')

# Colors
BG = '#12151A'
SURFACE = '#1E2128'
CHEQUE_BG = '#F5F5F0'
CHEQUE_BORDER = '#8a8670'
ACCENT = '#D9FE06'
TEXT_DARK = '#1a1a10'
TEXT_LIGHT = '#888880'
WHITE = '#FFFFFF'
MUTED = '#8B8D94'

img = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)

# Load fonts
def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

bn_bold = load_font('/System/Library/Fonts/KohinoorBangla.ttc', 44)
bn_reg = load_font('/System/Library/Fonts/KohinoorBangla.ttc', 26)
bn_small = load_font('/System/Library/Fonts/KohinoorBangla.ttc', 20)
en_bold = load_font('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 22)
en_small = load_font('/System/Library/Fonts/Supplemental/Arial.ttf', 16)
en_big = load_font('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 36)
en_cheque = load_font('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 14)
en_cheque_amt = load_font('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 18)
en_mono = load_font('/System/Library/Fonts/Supplemental/Courier New Bold.ttf', 11)
en_tiny = load_font('/System/Library/Fonts/Supplemental/Arial.ttf', 9)
en_11 = load_font('/System/Library/Fonts/Supplemental/Arial.ttf', 11)
en_8 = load_font('/System/Library/Fonts/Supplemental/Arial.ttf', 8)
bn_cheque = load_font('/System/Library/Fonts/KohinoorBangla.ttc', 16)

# === Background ===
# Subtle grid
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill='#181B22', width=1)
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill='#181B22', width=1)

# Decorative accent circles (top-right and bottom-left)
for cx, cy, r, alpha in [(1100, 80, 120, 15), (100, 550, 80, 10), (950, 500, 60, 8)]:
    overlay = Image.new('RGBA', (W, H), (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(217, 254, 6, alpha))
    img.paste(Image.alpha_composite(Image.new('RGBA', (W, H), (0,0,0,0)), overlay).convert('RGB'), mask=overlay.split()[3])

draw = ImageDraw.Draw(img)  # Refresh draw after paste

# === Mini cheque (left side) ===
cx, cy = 60, 155
cw, ch = 500, 230

# Shadow
draw.rounded_rectangle([cx+8, cy+8, cx+cw+8, cy+ch+8], radius=10, fill='#080A0E')
# Body
draw.rounded_rectangle([cx, cy, cx+cw, cy+ch], radius=10, fill=CHEQUE_BG, outline=CHEQUE_BORDER, width=2)
# Inner border
draw.rounded_rectangle([cx+5, cy+5, cx+cw-5, cy+ch-5], radius=7, outline='#b5b09a', width=1)

# Header
draw.text((cx+18, cy+14), '\u262A Bank of Eid Mubarak', fill=TEXT_DARK, font=en_cheque)
draw.text((cx+18, cy+33), 'EID SALAMI CHEQUE', fill=TEXT_LIGHT, font=en_tiny)

# Right side of cheque header
draw.text((cx+cw-110, cy+14), '#EID-2026-001', fill=TEXT_LIGHT, font=en_mono)
draw.text((cx+cw-130, cy+38), 'Date: 20 Mar 2026', fill=TEXT_DARK, font=en_11)

# Crescent icon (right)
draw.text((cx+cw-40, cy+10), '\u262A', fill=TEXT_DARK, font=en_bold)

# Pay to
draw.text((cx+18, cy+62), 'PAY TO THE ORDER OF', fill=TEXT_LIGHT, font=en_tiny)
draw.text((cx+18, cy+78), 'আপনার নাম এখানে', fill=TEXT_DARK, font=bn_cheque)
draw.line([(cx+18, cy+102), (cx+cw-120, cy+102)], fill='#ccc8b0', width=1)

# Amount box with "???"
amt_x = cx + cw - 115
amt_y = cy + 108
draw.rounded_rectangle([amt_x, amt_y, amt_x+95, amt_y+35], radius=5, outline=TEXT_DARK, width=2)
draw.text((amt_x+18, amt_y+7), '\u09F3 ???', fill=TEXT_DARK, font=en_cheque_amt)

# Words line
draw.text((cx+18, cy+118), 'কত টাকা? খুলে দেখুন!', fill=TEXT_DARK, font=bn_cheque)
draw.line([(cx+18, cy+140), (cx+cw-135, cy+140)], fill='#ccc8b0', width=1)

# Watermark
draw.text((cx+85, cy+158), 'NOT NEGOTIABLE \u2014 LOVE & BLESSINGS ONLY \u2665', fill='#d8d5c8', font=en_tiny)

# Signature area
draw.line([(cx+cw-160, cy+ch-42), (cx+cw-18, cy+ch-42)], fill='#999', width=1)
draw.text((cx+cw-145, cy+ch-37), 'AUTHORIZED SIGNATURE', fill=TEXT_LIGHT, font=en_8)

# MICR
draw.text((cx+18, cy+ch-27), '\u2590: EID-2026-001 \u2590: 0000 \u2590', fill='#b0b0a0', font=en_mono)

# === Right side: CTA ===
rx = 620

# Stars decoration
draw.text((rx, 110), '\u2605', fill=ACCENT, font=en_big)
draw.text((rx+55, 100), '\u2605', fill='#444', font=en_bold)
draw.text((rx+90, 120), '\u2605', fill='#2a2a2a', font=en_small)

# Bengali heading
draw.text((rx, 165), 'আপনার জন্য একটি', fill=WHITE, font=bn_reg)
draw.text((rx, 208), 'ঈদ সালামি চেক', fill=ACCENT, font=bn_bold)
draw.text((rx, 270), 'এসেছে!', fill=ACCENT, font=bn_bold)

# Neon accent line
draw.rectangle([rx, 325, rx+350, 328], fill=ACCENT)

# Subtext
draw.text((rx, 345), 'খুলে দেখুন কত টাকা সালামি পেলেন!', fill=MUTED, font=bn_small)

# Arrow hint
draw.text((rx, 385), '\u25B6  Tap to open your cheque', fill='#666', font=en_small)

# Brand
draw.rectangle([rx, 440, rx+350, 441], fill='#2A2D34')
draw.text((rx, 455), 'tool.teamzlab.com', fill='#555860', font=en_bold)
draw.text((rx, 482), 'Eid Salami Cheque Book Generator', fill='#3A3D44', font=en_small)

# === Bottom bar ===
draw.rectangle([0, H-48, W, H], fill=SURFACE)
draw.text((30, H-36), '\u263E  Eid Mubarak \u2014 Open to see your Salami cheque!', fill=MUTED, font=en_small)
draw.text((W-200, H-36), 'Teamz Lab Tools', fill='#555860', font=en_bold)

img.save(OUT, 'PNG', quality=95)
print(f'OG image saved: {OUT} ({os.path.getsize(OUT)} bytes)')
