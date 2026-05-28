#!/usr/bin/env python3
"""
BankAI Icon Generator
Design: Dark navy rounded square, 3 ascending white bar chart bars,
        gold 4-pointed sparkle star (AI element) in upper right.
"""

from PIL import Image, ImageDraw, ImageFilter
import math
import os
import subprocess

ICONS_DIR = os.path.join(os.path.dirname(__file__), "../src-tauri/icons")


def draw_sparkle(draw, cx, cy, outer_r, inner_r, color):
    """Draw a 4-pointed star sparkle."""
    points = []
    for i in range(8):
        angle = math.pi * i / 4 - math.pi / 2
        r = outer_r if i % 2 == 0 else inner_r
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        points.append((x, y))
    draw.polygon(points, fill=color)


def create_icon(size: int) -> Image.Image:
    s = size

    # Work at 4× for anti-aliasing then downscale
    scale = 4
    ws = s * scale
    img = Image.new("RGBA", (ws, ws), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(ws * 0.08)

    # ── Background ───────────────────────────────────────────────────────────
    bg = (13, 17, 38, 255)          # Very dark navy
    draw.rounded_rectangle(
        [pad, pad, ws - pad, ws - pad],
        radius=int(ws * 0.22),
        fill=bg,
    )

    # Subtle inner glow / lighter stripe at top-left (gives depth)
    glow = Image.new("RGBA", (ws, ws), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle(
        [pad, pad, ws // 2, ws // 2],
        radius=int(ws * 0.22),
        fill=(255, 255, 255, 8),
    )
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # ── Bar chart ─────────────────────────────────────────────────────────────
    bar_w       = int(ws * 0.135)
    gap         = int(ws * 0.055)
    chart_bot   = int(ws * 0.73)
    chart_left  = int(ws * 0.19)
    max_h       = int(ws * 0.44)

    heights     = [0.42, 0.67, 0.97]
    bar_radius  = max(2, int(ws * 0.022))

    for i, h in enumerate(heights):
        bh  = int(h * max_h)
        x0  = chart_left + i * (bar_w + gap)
        y0  = chart_bot - bh
        x1  = x0 + bar_w
        y1  = chart_bot

        # Bar shadow (soft dark underneath)
        shadow = Image.new("RGBA", (ws, ws), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle(
            [x0 + 2, y0 + 4, x1 + 2, y1 + 2],
            radius=bar_radius,
            fill=(0, 0, 0, 60),
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=ws * 0.015))
        img = Image.alpha_composite(img, shadow)
        draw = ImageDraw.Draw(img)

        # Bar fill — tallest bar gets an indigo tint
        if i == 2:
            bar_color = (180, 185, 255, 245)  # soft indigo-white
        else:
            bar_color = (255, 255, 255, 210)

        draw.rounded_rectangle([x0, y0, x1, y1], radius=bar_radius, fill=bar_color)

    # Baseline rule
    rule_y = chart_bot + int(ws * 0.025)
    draw.rectangle(
        [chart_left - int(ws * 0.02), rule_y,
         chart_left + 3 * bar_w + 2 * gap + int(ws * 0.02), rule_y + max(1, int(ws * 0.01))],
        fill=(255, 255, 255, 55),
    )

    # ── Gold sparkle star (AI element) ────────────────────────────────────────
    gold       = (255, 200, 40, 255)
    gold_dim   = (255, 200, 40, 140)
    spk_cx     = int(ws * 0.755)
    spk_cy     = int(ws * 0.265)
    outer_r    = int(ws * 0.108)
    inner_r    = int(ws * 0.044)
    draw_sparkle(draw, spk_cx, spk_cy, outer_r, inner_r, gold)

    # Small accent dots around sparkle
    for dx, dy, alpha in [(-0.155, -0.09, 160), (0.07, -0.155, 120), (0.155, 0.06, 90)]:
        dot_r = int(ws * 0.022)
        cx2   = spk_cx + int(ws * dx)
        cy2   = spk_cy + int(ws * dy)
        draw.ellipse(
            [cx2 - dot_r, cy2 - dot_r, cx2 + dot_r, cy2 + dot_r],
            fill=(255, 200, 40, alpha),
        )

    # ── Downscale with LANCZOS ────────────────────────────────────────────────
    final = img.resize((s, s), Image.LANCZOS)
    return final


def main():
    os.makedirs(ICONS_DIR, exist_ok=True)

    # ── Required Tauri PNGs ───────────────────────────────────────────────────
    required = {
        "32x32.png":       32,
        "128x128.png":     128,
        "128x128@2x.png":  256,
    }
    for fname, sz in required.items():
        path = os.path.join(ICONS_DIR, fname)
        create_icon(sz).save(path)
        print(f"  ✓ {fname}  ({sz}×{sz})")

    # ── icon.ico (multi-size) ─────────────────────────────────────────────────
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    ico_imgs  = [create_icon(s) for s in ico_sizes]
    ico_path  = os.path.join(ICONS_DIR, "icon.ico")
    ico_imgs[0].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_imgs[1:],
    )
    print(f"  ✓ icon.ico")

    # ── icon.icns (macOS) via iconutil ────────────────────────────────────────
    iconset_dir = os.path.join(ICONS_DIR, "icon.iconset")
    os.makedirs(iconset_dir, exist_ok=True)

    icns_map = {
        "icon_16x16.png":      16,
        "icon_16x16@2x.png":   32,
        "icon_32x32.png":      32,
        "icon_32x32@2x.png":   64,
        "icon_128x128.png":    128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png":    256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png":    512,
        "icon_512x512@2x.png": 1024,
    }
    for fname, sz in icns_map.items():
        create_icon(sz).save(os.path.join(iconset_dir, fname))

    icns_path = os.path.join(ICONS_DIR, "icon.icns")
    result = subprocess.run(
        ["iconutil", "-c", "icns", iconset_dir, "-o", icns_path],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        print(f"  ✓ icon.icns")
    else:
        print(f"  ✗ icon.icns failed: {result.stderr}")

    # ── Preview a 256px PNG ───────────────────────────────────────────────────
    preview_path = os.path.join(ICONS_DIR, "preview_256.png")
    create_icon(256).save(preview_path)
    print(f"\n  Preview saved → {preview_path}")
    print("\nAll icons generated! ✨")


if __name__ == "__main__":
    main()
