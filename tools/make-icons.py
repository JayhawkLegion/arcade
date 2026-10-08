#!/usr/bin/env python3
"""Draw the app icons. Run once; the PNGs are committed.

The motif is Rally at a glance -- a brick row, the ball, the paddle -- kept
blunt enough to still read at 48px on a home screen.

    python tools/make-icons.py
"""
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")

GROUND = (23, 19, 32)
BALL = (244, 236, 223)
PADDLE = (226, 84, 60)
ROWS = [(0, 72, 56), (95, 72, 56), (190, 72, 56), (285, 72, 56)]  # hsl, top to bottom

SS = 4  # supersample, then downscale for clean edges


def hsl(h, s, l):
    h, s, l = h / 360.0, s / 100.0, l / 100.0
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h * 6) % 2 - 1))
    m = l - c / 2
    r, g, b = [(c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x)][int(h * 6) % 6]
    return tuple(int(round((v + m) * 255)) for v in (r, g, b))


def draw(size, maskable=False):
    n = size * SS
    img = Image.new("RGB", (n, n), GROUND)
    d = ImageDraw.Draw(img)

    # a maskable icon gets its art pulled into the safe zone, since launchers
    # crop these to a circle and would otherwise clip the paddle off
    pad = 0.21 if maskable else 0.11
    x0, y0 = n * pad, n * pad
    w, h = n * (1 - 2 * pad), n * (1 - 2 * pad)

    gap = w * 0.035
    bw = (w - gap * 3) / 4
    bh = h * 0.115
    for r, (hu, s, l) in enumerate(ROWS[:3]):
        for c in range(4):
            bx = x0 + c * (bw + gap)
            by = y0 + r * (bh + gap * 0.9)
            d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=bh * 0.3, fill=hsl(hu, s, l))

    br = h * 0.115
    cx, cy = x0 + w * 0.5, y0 + h * 0.60
    d.ellipse([cx - br, cy - br, cx + br, cy + br], fill=BALL)

    pw, ph = w * 0.52, h * 0.10
    px, py = x0 + (w - pw) / 2, y0 + h - ph
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=ph / 2, fill=PADDLE)

    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    made = []
    for size in (192, 512):
        p = os.path.join(OUT, "icon-%d.png" % size)
        draw(size).save(p, optimize=True)
        made.append(p)
    for size in (192, 512):
        p = os.path.join(OUT, "maskable-%d.png" % size)
        draw(size, maskable=True).save(p, optimize=True)
        made.append(p)
    # iOS ignores the manifest and wants its own square
    p = os.path.join(OUT, "apple-touch-icon.png")
    draw(180).save(p, optimize=True)
    made.append(p)

    for p in made:
        print("%-34s %6d bytes" % (os.path.relpath(p, ROOT).replace("\\", "/"), os.path.getsize(p)))


if __name__ == "__main__":
    main()
