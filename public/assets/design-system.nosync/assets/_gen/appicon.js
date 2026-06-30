// Naevyr PWA + NOTIFICATION ICONS — eval after pixlib.js + fxlogo.js
// (reuses emblemGrid / scaleGrid — the DRIFTS/Naevyr emblem). Pixel art is
// authored at a small NATIVE grid; each export's SVG carries the native viewBox
// but is sized to the exact target px (512/192/96) so PNG rasterization is crisp
// and the file stays tiny. No global outline (the emblem brings its own void).

// dark drift-stone field with central glow lift + vignette + a faint mote ring
function appField(W, H, glow) {
  const g = makeGrid(W, H);
  const cx = (W - 1) / 2, cy = (H - 1) / 2, maxd = Math.hypot(cx, cy);
  const st = RAMP.stone, dr = RAMP.drift;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, y - cy) / maxd;          // 0 center → 1 corner
    let a, b, t;
    if (d > 0.62) { a = RAMP.void; b = st[3]; t = (d - 0.62) / 0.38; }   // outer vignette
    else if (d > 0.32) { a = st[3]; b = st[2]; t = (d - 0.32) / 0.30; }  // body
    else { a = st[2]; b = glow ? '#2a2342' : st[2]; t = d / 0.32; }      // central drift-stone lift
    const dith = (((x >> 1) + (y >> 1)) % 2 === 0) ? t : t - 0.5;        // 2px ordered dither
    P(g, x, y, dith > 0.5 ? a : b);
  }
  // faint drift motes orbiting the emblem
  const rng = mulberry(861);
  const moteN = Math.round(W * 0.5);
  for (let i = 0; i < moteN; i++) {
    const ang = rng() * Math.PI * 2, rr = (0.36 + rng() * 0.22) * maxd;
    P(g, Math.round(cx + Math.cos(ang) * rr), Math.round(cy + Math.sin(ang) * rr), rng() < 0.4 ? dr[1] : dr[2]);
  }
  return g;
}

// full-bleed standard icon (native 48×48): emblem ×2 centered on the field
function drawAppIcon() {
  const g = appField(48, 48, true);
  stamp(g, scaleGrid(emblemGrid(false), 2), 8, 8);        // (48-32)/2 = 8
  return g;
}

// MASKABLE icon (native 56×56): same emblem, extra padding so it survives the
// Android safe-zone crop (emblem 32/56 ≈ 57% of the field, well inside 80%).
function drawAppIconMaskable() {
  const g = appField(56, 56, true);
  stamp(g, scaleGrid(emblemGrid(false), 2), 12, 12);      // (56-32)/2 = 12
  return g;
}

// MONOCHROME notification badge (native 16×16): the emblem reduced to one flat
// white shape on transparent — the status bar tints it. No bg, no outline.
function drawNotifBadge() {
  const src = emblemGrid(true);
  const g = makeGrid(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (G(src, x, y)) P(g, x, y, '#ffffff');
  return g;
}

/* ============================ REGISTRY ============================
   native = authored grid (viewBox); out = exact px the SVG is sized to. */
const APPICON = {
  app_icon_512:          { fn: drawAppIcon,         native: [48, 48], out: [512, 512], purpose: 'any',        frames: 1 },
  app_icon_192:          { fn: drawAppIcon,         native: [48, 48], out: [192, 192], purpose: 'any',        frames: 1 },
  app_icon_maskable_512: { fn: drawAppIconMaskable, native: [56, 56], out: [512, 512], purpose: 'maskable',   frames: 1 },
  notif_badge:           { fn: drawNotifBadge,      native: [16, 16], out: [96, 96],   purpose: 'monochrome', frames: 1, mono: true },
};

Object.assign(globalThis, {
  appField, drawAppIcon, drawAppIconMaskable, drawNotifBadge, APPICON,
});
