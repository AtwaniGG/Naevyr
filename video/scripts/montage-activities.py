#!/usr/bin/env python3
"""Build the activity montage (out/naevyr-clip.mp4) from public/gameplay/activities.webm:
intro -> chop -> fish -> mine -> kill -> spin -> CTA, each a tight crop-zoomed
window with a big POP-IN action word (and music). The homebrew ffmpeg has no
drawtext, so PIL renders the pop text per frame and ffmpeg overlays it.
    python3 scripts/montage-activities.py
"""
import os, shutil, subprocess, tempfile, math
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "public", "gameplay", "activities.webm")
MUSIC = os.path.join(HERE, "..", "public", "naevyr-music.mp3")  # the realm score
OUT = os.path.join(HERE, "..", "out", "naevyr-clip.mp4")

W, H, FPS = 1920, 1080, 25
IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"
NARROW = "/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf"
GOLD = (231, 200, 115); BONE = (233, 224, 210); PURPLE = (196, 163, 240)
BLOOD = (224, 83, 61); MOSS = (140, 200, 120); WATER = (120, 190, 230); VOID = (10, 8, 16)

# src = start sec in activities.webm · dur · z = crop-zoom · fy = vertical crop focus
# big = the BIG instructional line (on a dark plate so it's always readable)
# sub = small accent line under it · col = big-text colour
BEATS = [
    dict(src=13.6, dur=3.4, z=1.55, fy=0.40, kind="pop", big="CHOP TREES FOR WOOD", sub="", col=MOSS),
    dict(src=24.6, dur=3.4, z=1.55, fy=0.40, kind="pop", big="FISH THE WATERS",     sub="", col=WATER),
    dict(src=32.6, dur=3.6, z=1.18, fy=0.45, kind="pop", big="MINE GOLD FROM THE VEIN", sub="", col=GOLD),
    dict(src=39.2, dur=3.6, z=1.55, fy=0.38, kind="pop", big="PUT THE BEAST DOWN",  sub="", col=BLOOD),
    dict(src=47.4, dur=4.0, z=1.22, fy=0.42, kind="pop", big="BURN DRIFTS TO SPIN", sub="fortune favours the burned", col=PURPLE),
]

_f = {}
def font(p, s):
    _f.setdefault((p, s), ImageFont.truetype(p, s))
    return _f[(p, s)]

def text_img(text, fpath, size, rgb, stroke=7, plate=False, accent=None):
    """render one centered text line to its own tight RGBA image (for scaling).
    plate=True paints a dark rounded bar behind it so it reads over ANY footage."""
    f = font(fpath, size)
    tmp = Image.new("RGBA", (W, 600), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp)
    bb = d.textbbox((W // 2, 300), text, font=f, anchor="mm", stroke_width=stroke)
    padx, pady = (70, 36) if plate else (24, 24)
    w = (bb[2] - bb[0]) + padx * 2
    h = (bb[3] - bb[1]) + pady * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    if plate:
        d.rounded_rectangle([0, 0, w - 1, h - 1], radius=14, fill=VOID + (205,),
                            outline=(accent or rgb) + (235,), width=4)
    d.text((cx, cy + 5), text, font=f, fill=(0, 0, 0, 180), anchor="mm")             # shadow
    d.text((cx, cy), text, font=f, fill=rgb + (255,), anchor="mm",
           stroke_width=stroke, stroke_fill=VOID + (255,))                            # outline
    return img

def paste_alpha(base, img, cx, cy, a):
    if a <= 0:
        return
    if a < 1:
        ch = img.split()[3].point(lambda p: int(p * a))
        img = img.copy(); img.putalpha(ch)
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))

def trim_zoom(b, dst):
    z, fy = b["z"], b["fy"]
    if z <= 1.001:
        vf = f"scale={W}:{H},setsar=1,fps={FPS}"
    else:
        vf = (f"crop=iw/{z}:ih/{z}:(iw-iw/{z})/2:(ih-ih/{z})*{fy},"
              f"scale={W}:{H},setsar=1,fps={FPS}")
    subprocess.run(["ffmpeg", "-y", "-ss", str(b["src"]), "-t", str(b["dur"]),
                    "-i", SRC, "-vf", vf, "-an",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", dst],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    tmp = tempfile.mkdtemp(prefix="montage_")
    # 1) trim + zoom each beat, concat
    parts = []
    for i, b in enumerate(BEATS):
        p = os.path.join(tmp, f"beat{i}.mp4")
        trim_zoom(b, p)
        parts.append(p)
    listf = os.path.join(tmp, "list.txt")
    with open(listf, "w") as fh:
        for p in parts:
            fh.write(f"file '{p}'\n")
    base = os.path.join(tmp, "base.mp4")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listf,
                    "-c", "copy", base], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 2) pre-render the text images + per-beat final-timeline windows
    starts, t = [], 0.0
    for b in BEATS:
        starts.append(t); t += b["dur"]
    total = t
    bigimg, subimg = [], []
    for b in BEATS:
        # auto-shrink so a long instruction still fits within the frame on its plate
        big_sz = 150 if b["kind"] == "cta" else (112 if b["kind"] == "title" else 116)
        plate = b["kind"] in ("pop", "cta", "title")
        img = text_img(b["big"], IMPACT, big_sz, b["col"], plate=plate)
        while img.width > W - 80 and big_sz > 70:
            big_sz -= 6
            img = text_img(b["big"], IMPACT, big_sz, b["col"], plate=plate)
        bigimg.append(img)
        subimg.append(text_img(b["sub"], NARROW, 52, BONE, stroke=4) if b["sub"] else None)

    # 3) PIL overlay frames: pop = scale-in punch; title/cta = fade
    frames = os.path.join(tmp, "frames"); os.makedirs(frames)
    n = int(round(total * FPS))
    print(f"rendering {n} caption frames …")
    for fi in range(n):
        tt = fi / FPS
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        for i, b in enumerate(BEATS):
            s, e = starts[i], starts[i] + b["dur"]
            if tt < s or tt > e:
                continue
            lt = tt - s
            big, sub = bigimg[i], subimg[i]
            if b["kind"] == "pop":
                # punch in: 0->1.10->1.0 over 0.34s, hold, fade last 0.4s. The big
                # line already carries its dark plate, so it stays readable.
                if lt < 0.20:
                    scale = 1.10 * (lt / 0.20)
                elif lt < 0.34:
                    scale = 1.10 - 0.10 * ((lt - 0.20) / 0.14)
                else:
                    scale = 1.0
                a = 1.0 if lt < b["dur"] - 0.4 else max(0.0, (b["dur"] - lt) / 0.4)
                cy = H * 0.80
                if scale > 0.02:
                    im = big.resize((max(1, int(big.width * scale)), max(1, int(big.height * scale))))
                    paste_alpha(layer, im, W / 2, cy, a)
                if sub:
                    paste_alpha(layer, sub, W / 2, cy + big.height * 0.74, a)
            else:  # title / cta : fade in/out (cta plate is baked into the image)
                fin, fout = 0.4, 0.4
                a = (lt / fin if lt < fin else (1.0 if lt < b["dur"] - fout else max(0.0, (b["dur"] - lt) / fout)))
                cy = H * 0.44 if b["kind"] == "cta" else H * 0.72
                paste_alpha(layer, big, W / 2, cy, a)
                if sub:
                    paste_alpha(layer, sub, W / 2, cy + big.height * 0.74, a)
        layer.save(os.path.join(frames, f"f{fi:04d}.png"))

    # 4) overlay text + music, encode
    print("compositing montage + music …")
    cmd = ["ffmpeg", "-y", "-i", base, "-framerate", str(FPS), "-i",
           os.path.join(frames, "f%04d.png")]
    if os.path.exists(MUSIC):
        cmd += ["-i", MUSIC]
        filt = ("[0:v][1:v]overlay=format=auto:shortest=1[v];"
                f"[2:a]atrim=0:{total},afade=t=in:st=0:d=0.5,"
                # keep the score moderate (not too loud): normalise to a calm
                # background loudness rather than blindly multiplying volume
                f"afade=t=out:st={total-0.8}:d=0.8,loudnorm=I=-20:TP=-1.5[a]")
        maps = ["-map", "[v]", "-map", "[a]", "-shortest"]
    else:
        filt = "[0:v][1:v]overlay=format=auto:shortest=1[v]"
        maps = ["-map", "[v]"]
    cmd += ["-filter_complex", filt] + maps + [
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        "-c:a", "aac", "-b:a", "192k", OUT]
    subprocess.run(cmd, check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"DONE -> {OUT}  ({total:.1f}s)")

if __name__ == "__main__":
    main()
