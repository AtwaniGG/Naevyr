#!/usr/bin/env python3
"""Burn catchy, on-brand captions onto out/naevyr-clip.mp4 (the Wheel-of-the-Drift
social clip): town hook -> spin hype -> the Drift takes its cut -> CTA.

The homebrew ffmpeg has no drawtext, so PIL renders a transparent caption frame
per video frame (full control of fonts + fades) and ffmpeg overlays the sequence.
    python3 scripts/caption-clip.py
"""
import os, shutil, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "out", "naevyr-clip.mp4")
SRC = os.path.join(HERE, "..", "out", "naevyr-clip.src.mp4")
if not os.path.exists(SRC):
    shutil.copyfile(OUT, SRC)  # pristine source (ffmpeg can't read+write one file)

W, H, FPS = 1920, 1080, 25
DUR = 16.0
IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"
NARROW = "/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf"

GOLD = (231, 200, 115)
BONE = (233, 224, 210)
PURPLE = (196, 163, 240)
BLOOD = (224, 83, 61)
VOID = (10, 8, 16)

# text, font, px size, rgb, vertical anchor (fraction of H), [start, end, fadeIn, fadeOut], box?
BEATS = [
    ("A DARK-FANTASY MMO", NARROW, 46, PURPLE, 0.60, (0.6, 4.2, 0.45, 0.45), False),
    ("ENTER THE DRIFT",    IMPACT, 122, GOLD,  0.66, (0.8, 4.2, 0.45, 0.45), False),
    ("GATHER. CRAFT. CONQUER.", IMPACT, 92, BONE, 0.70, (4.5, 8.2, 0.45, 0.45), False),

    ("WHEEL OF THE DRIFT", NARROW, 46, PURPLE, 0.055, (9.3, 13.4, 0.45, 0.45), False),
    ("SPIN TO WIN",        IMPACT, 128, GOLD,  0.11,  (9.5, 13.4, 0.45, 0.45), False),
    ("the drift loves a gambler", NARROW, 46, BONE, 0.88, (9.8, 13.4, 0.45, 0.45), False),

    ("THE DRIFT ALWAYS WINS", IMPACT, 96, BLOOD, 0.10, (13.7, 15.1, 0.30, 0.30), False),
    ("NAEVYR",             IMPACT, 152, GOLD,  0.40,  (14.9, 16.0, 0.35, 0.20), True),
    ("play free  .  drifts live on solana", NARROW, 44, BONE, 0.57, (15.0, 16.0, 0.35, 0.20), False),
]

_fonts = {}
def font(path, size):
    key = (path, size)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(path, size)
    return _fonts[key]

def alpha_at(t, start, end, fin, fout):
    if t < start or t > end:
        return 0.0
    if t < start + fin:
        return (t - start) / fin
    if t > end - fout:
        return max(0.0, (end - t) / fout)
    return 1.0

def draw_beat(base, text, fpath, size, rgb, yfrac, a, box):
    f = font(fpath, size)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = W // 2, int(H * yfrac)
    if box:
        bb = d.textbbox((x, y), text, font=f, anchor="ma", stroke_width=6)
        pad = 34
        d.rounded_rectangle(
            [bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad],
            radius=8, fill=VOID + (190,))
    d.text((x, y + 6), text, font=f, fill=(0, 0, 0, 170), anchor="ma")          # shadow
    d.text((x, y), text, font=f, fill=rgb + (255,), anchor="ma",
           stroke_width=6, stroke_fill=VOID + (255,))                            # outline
    if a < 1.0:
        ch = layer.split()[3].point(lambda p: int(p * a))
        layer.putalpha(ch)
    return Image.alpha_composite(base, layer)

def main():
    tmp = tempfile.mkdtemp(prefix="clipcap_")
    n = int(round(DUR * FPS))
    print(f"rendering {n} caption frames with PIL …")
    for i in range(n):
        t = i / FPS
        frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        for text, fpath, size, rgb, yfrac, (s, e, fin, fout), box in BEATS:
            a = alpha_at(t, s, e, fin, fout)
            if a <= 0:
                continue
            frame = draw_beat(frame, text, fpath, size, rgb, yfrac, a, box)
        frame.save(os.path.join(tmp, f"f{i:04d}.png"))

    print("compositing with ffmpeg …")
    subprocess.run([
        "ffmpeg", "-y",
        "-i", SRC,
        "-framerate", str(FPS), "-i", os.path.join(tmp, "f%04d.png"),
        "-filter_complex", "[0:v][1:v]overlay=format=auto:shortest=1[v]",
        "-map", "[v]", "-map", "0:a?",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        "-c:a", "copy",
        OUT,
    ], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"DONE -> {OUT}")

if __name__ == "__main__":
    main()
