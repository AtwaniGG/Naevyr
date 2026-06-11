// DriftLands SOCIAL / LAUNCH pack — eval after pixlib.js + tiles.js + fxlogo.js.
// Coin/pfp sigil + widescreen X banner. Rect-grid, RAMP only, 1px void feel,
// dither not blur, deterministic. Export with nearest-neighbor integer upscale.

/* ---- local circle helpers (filled / ring) ---- */
function disc(g, cx, cy, r, fn) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d <= r) fn(x, y, d);
    }
}
function ring(g, cx, cy, r, w, c) {
  disc(g, cx, cy, r, (x, y, d) => { if (d >= r - w) P(g, x, y, c); });
}

/* ============================ COIN SIGIL (square, parametric) ============================
   The warded gate rune (triangle-in-circle door sigil) struck in gold on a
   void/drift field, ringed by a thin gold circle like a coin face. Drift
   corruption creeps in from the upper-left rim. Readable at 32px. */
function drawCoinSigil(N, ticker) {
  const g = makeGrid(N, N);
  const cx = (N - 1) / 2, cy = (N - 1) / 2;
  const gd = RAMP.gold, dr = RAMP.drift, st = RAMP.stone;
  const Rrim = N * 0.47;       // coin edge
  const Rfield = N * 0.42;     // inner field
  const Rsig = N * 0.30;       // sigil ring radius

  // --- coin field: dark drift-purple, dithered toward void at the rim, brightest center ---
  disc(g, cx, cy, Rfield, (x, y, d) => {
    const t = d / Rfield;                       // 0 center .. 1 rim
    let c;
    if (t < 0.4) c = ((x + y) % 2 === 0) ? '#241038' : RAMP.void;     // calm dark center (contrast)
    else if (t < 0.72) c = ((x + y) % 2 === 0) ? dr[4] : '#1a0c2c';
    else c = ((x + y) % 2 === 0) ? dr[4] : RAMP.void;
    P(g, x, y, c);
  });

  // --- struck coin rim: gold ring with bevel (lit top-left, dark bottom-right) ---
  disc(g, cx, cy, Rrim, (x, y, d) => {
    if (d < Rfield - 0.5) return;
    const ang = Math.atan2(y - cy, x - cx);
    const lit = Math.cos(ang + 2.4) > 0;        // top-left lit
    let c = lit ? gd[1] : gd[3];
    if (d > Rrim - 1.2) c = RAMP.void;           // outer 1px void edge
    else if (d > Rrim - 2.4) c = lit ? gd[0] : gd[2];
    P(g, x, y, c);
  });
  // inner rim hairline
  ring(g, cx, cy, Rfield + 0.6, 1, gd[3]);

  // --- the door sigil: gold ring + triangle (point up) + inner ring + center mote ---
  ring(g, cx, cy, Rsig, Math.max(1, N * 0.012), gd[1]);
  ring(g, cx, cy, Rsig, Math.max(1, N * 0.012), gd[1]);
  // upward triangle inscribed in the sigil ring
  const verts = [0, 1, 2].map(i => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
    return [cx + Math.cos(a) * Rsig * 0.86, cy + Math.sin(a) * Rsig * 0.86];
  });
  function thickLine(x0, y0, x1, y1, c, t) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      for (let oy = 0; oy < t; oy++) for (let ox = 0; ox < t; ox++) P(g, Math.round(x) + ox, Math.round(y) + oy, c);
    }
  }
  const tw = Math.max(1, Math.round(N * 0.018));
  thickLine(verts[0][0], verts[0][1], verts[1][0], verts[1][1], gd[0], tw);
  thickLine(verts[1][0], verts[1][1], verts[2][0], verts[2][1], gd[1], tw);
  thickLine(verts[2][0], verts[2][1], verts[0][0], verts[0][1], gd[1], tw);
  // inner downward triangle ring (second sigil layer, dimmer) + center
  ring(g, cx, cy, Rsig * 0.5, 1, gd[2]);
  disc(g, cx, cy, N * 0.04, (x, y, d) => P(g, x, y, d < N * 0.02 ? dr[0] : dr[1]));  // drift-core mote
  // vertical keyhole accent through the triangle
  for (let yy = -Rsig * 0.5; yy <= Rsig * 0.55; yy++) P(g, Math.round(cx), Math.round(cy + yy), ((cy + yy) | 0) % 2 ? gd[1] : gd[2]);

  // --- drift corruption creeping in from the upper-left rim ---
  const seedN = 911;
  disc(g, cx, cy, Rfield, (x, y, d) => {
    if (d < Rfield - 0.5) return;
    // only upper-left arc
    const ang = Math.atan2(y - cy, x - cx);
    if (Math.cos(ang + 2.4) < 0.25) return;
    if (hash2(x, y, seedN) < 0.6) {
      // tendrils reaching inward
      const reach = 2 + Math.floor(hash2(x, y, seedN + 1) * (N * 0.13));
      for (let k = 0; k < reach; k++) {
        const px = Math.round(x + Math.cos(ang) * -k), py = Math.round(y + Math.sin(ang) * -k);
        const fade = 1 - k / reach;
        if ((px + py) % 2 === 0 && hash2(px, py, seedN + 2) < fade * 0.8) P(g, px, py, hash2(px, py, 3) < 0.3 ? dr[1] : dr[3]);
      }
    }
  });
  // a few bright motes drifting off that rim
  const mr = mulberry(seedN);
  for (let i = 0; i < Math.round(N / 8); i++) {
    const a = -Math.PI * 0.95 + mr() * 0.9;
    const rr = Rfield * (0.7 + mr() * 0.28);
    const x = Math.round(cx + Math.cos(a) * rr), y = Math.round(cy + Math.sin(a) * rr);
    P(g, x, y, mr() < 0.4 ? dr[0] : dr[1]);
  }

  // --- optional struck ticker legend ($DRIFTS) along the lower field ---
  if (ticker) {
    const tw = 4 + textWidth35('DRIFTS');          // $ (4) + DRIFTS
    const sc = N >= 120 ? 1 : 1;
    const tx = Math.round(cx - tw / 2), ty = Math.round(cy + Rsig + (N * 0.07));
    // small darkened plinth so gold reads over the dither
    for (let y = ty - 2; y <= ty + 7; y++) for (let x = tx - 3; x <= tx + tw + 2; x++) { const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2); if (d < Rfield - 1) P(g, x, y, ((x + y) % 2 === 0) ? '#160a26' : RAMP.void); }
    for (let x = tx - 3; x <= tx + tw + 2; x++) { P(g, x, ty - 3, gd[3]); P(g, x, ty + 8, gd[3]); }  // hairline rails
    drawTicker(g, tx, ty, gd[0], RAMP.void);
  }

  return g;
}

/* ============================ COMPACT TAGLINE FONT (3×5) ============================ */
const FONT35 = {
  A: ['010','101','111','101','101'], C: ['011','100','100','100','011'],
  D: ['110','101','101','101','110'], E: ['111','100','110','100','111'],
  F: ['111','100','110','100','100'], H: ['101','101','111','101','101'],
  I: ['111','010','010','010','111'], K: ['101','110','100','110','101'],
  L: ['100','100','100','100','111'], M: ['101','111','111','101','101'],
  N: ['101','111','111','111','101'], O: ['010','101','101','101','010'],
  R: ['110','101','110','101','101'], S: ['011','100','010','001','110'],
  T: ['111','010','010','010','010'], ' ': ['000','000','000','000','000'],
  $: ['111','110','011','110','111'],
};
// "$DRIFTS" struck in gold with a void shadow + a center keyhole bar on the $.
function drawTicker(g, x0, y0, col, shadow) {
  // $ glyph with a vertical bar extending 1px above & below (true dollar look)
  const dollar = FONT35['$'];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (dollar[y][x] === '1') { if (shadow) P(g, x0 + x, y0 + y + 1, shadow); P(g, x0 + x, y0 + y, col); }
  if (shadow) { P(g, x0 + 1, y0 - 1 + 1, shadow); P(g, x0 + 1, y0 + 5 + 1, shadow); }
  P(g, x0 + 1, y0 - 1, col); P(g, x0 + 1, y0 + 5, col);
  return drawText35(g, 'DRIFTS', x0 + 4, y0, col, shadow);
}
function textWidth35(str) { let w = 0; for (const ch of str.toUpperCase()) w += (FONT35[ch] ? 3 : 3) + 1; return w - 1; }
function drawText35(g, str, x0, y0, col, shadow) {
  let ox = x0;
  for (const ch of str.toUpperCase()) {
    const gl = FONT35[ch];
    if (gl) for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (gl[y][x] === '1') {
      if (shadow) P(g, ox + x, y0 + y + 1, shadow);
      P(g, ox + x, y0 + y, col);
    }
    ox += 4;
  }
  return ox - 1;
}

/* ============================ X BANNER (375×125, 3:1) ============================ */
function drawBanner(centered) {
  const W = 375, H = 125, g = makeGrid(W, H);
  const dr = RAMP.drift, bn = RAMP.bone, st = RAMP.stone, gd = RAMP.gold;
  const horizon = 92;

  // --- dusk/night sky: stepped dither bands ---
  const bands = [[0, 24, RAMP.void, '#120f1c'], [24, 48, '#120f1c', RAMP.ash], [48, 72, RAMP.ash, '#241d33'], [72, horizon, '#241d33', '#2c2240']];
  bands.forEach(([y0, y1, a, b]) => { for (let y = y0; y < y1; y++) { const t = (y - y0) / (y1 - y0); for (let x = 0; x < W; x++) { const dith = ((x + y) % 2 === 0) ? t : t - 0.5; P(g, x, y, dith > 0.5 ? b : a); } } });

  // --- pale moon, left-high ---
  const mx = 64, my = 30;
  disc(g, mx, my, 13, (x, y, d) => { let c = bn[2]; if ((x - mx) + (y - my) < -5) c = bn[1]; if (d > 10) c = bn[3]; P(g, x, y, c); });
  // scattered craters (not face-like)
  [[-5, -3, 2], [3, -5, 1], [5, 2, 2], [-2, 4, 1], [-6, 1, 1], [1, -1, 1]].forEach(([ox, oy, r]) => disc(g, mx + ox, my + oy, r, (x, y, d) => { if (d <= r) P(g, x, y, '#2c2240'); }));
  // halo dither
  disc(g, mx, my, 18, (x, y, d) => { if (d > 13 && d < 18 && (x + y) % 2 === 0 && hash2(x, y, 71) < 0.4) P(g, x, y, '#2c2240'); });

  // --- stars (dithered), skip near moon & where text sits ---
  const sr = mulberry(720);
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(sr() * W), y = Math.floor(sr() * (horizon - 6));
    if ((x - mx) ** 2 + (y - my) ** 2 < 360) continue;
    P(g, x, y, sr() < 0.25 ? bn[1] : bn[3]);
  }

  // --- Waystation rooftops as a dark horizon line ---
  for (let x = 0; x < W; x++) { for (let y = horizon; y < H; y++) { let c = y < horizon + 6 ? '#171221' : y < horizon + 18 ? '#100c1a' : RAMP.void; P(g, x, y, c); } }
  // roof silhouettes (varied pitched roofs + a couple towers), dark with rare warm window
  function roof(bx, w, h, warm) {
    const cxr = bx + w / 2;
    for (let x = bx; x < bx + w; x++) { const d = Math.abs(x - cxr); const ry = horizon - Math.round((w / 2 - d) * h / (w / 2)); for (let y = ry; y <= horizon; y++) P(g, x, y, '#0d0a16'); }
    // ridge highlight (faint moonlight)
    for (let x = bx; x < bx + w; x++) { const d = Math.abs(x - cxr); const ry = horizon - Math.round((w / 2 - d) * h / (w / 2)); P(g, x, ry, '#1c1729'); }
    if (warm) { const wx = Math.round(cxr) - 1, wy = horizon - Math.round(h * 0.4); fillRect(g, wx, wy, 2, 2, RAMP.ember[1]); P(g, wx, wy + 2, RAMP.ember[2]); }
  }
  let bx = -6;
  const roofs = [[28, 14, 1], [22, 10, 0], [30, 18, 1], [18, 9, 1], [26, 13, 0], [34, 20, 1], [20, 10, 0], [24, 12, 1], [30, 15, 0], [22, 11, 1], [28, 14, 0], [18, 9, 1], [32, 17, 1], [24, 12, 0], [40, 8, 0]];
  roofs.forEach(([w, h, warm]) => { roof(bx, w, h, warm); bx += w - 2; });
  // chimneys w/ thin smoke on a couple
  [40, 150, 250].forEach((px, i) => { for (let y = horizon - 16; y < horizon - 10; y++) P(g, px, y, '#100c1a'); for (let k = 0; k < 6; k++) P(g, px + (k % 2), horizon - 16 - k, bn[3]); });

  // --- Drift corruption bleeding in from BOTH side edges ---
  function edge(side) {
    for (let y = 18; y < H; y++) {
      const reach = Math.round((36 + 22 * Math.sin(y * 0.06 + (side < 0 ? 0 : 1.7))) * (0.45 + 0.55 * (y / H)));
      for (let d = 0; d < reach; d++) {
        const x = side < 0 ? d : W - 1 - d;
        const fade = 1 - d / reach, h = hash2(x, y, 73);
        if ((x + y) % 2 === 0 && h < fade * 0.85) P(g, x, y, h < fade * 0.28 ? dr[2] : dr[3]);
        else if (h < fade * 0.16) P(g, x, y, dr[1]);
        if (d > reach - 2 && h < 0.05) P(g, x, y, dr[1]);  // glowing tips
      }
    }
  }
  edge(-1); edge(1);
  // drifting motes from both edges
  const pr = mulberry(74);
  for (let i = 0; i < 60; i++) { const fromL = i % 2 === 0; let x = fromL ? pr() * 110 : W - pr() * 110; let y = pr() * H; const big = i % 5 === 0; P(g, Math.round(x), Math.round(y), big ? dr[0] : dr[1]); if (big) P(g, Math.round(x) + 1, Math.round(y), dr[2]); }

  // --- wordmark plate (X: slightly right of center to clear the avatar; pump.fun: dead center) ---
  const wm = scaleGrid(wordmarkGrid(false), 2);          // ~170 × 24
  const plateW = wm.w + 26, plateH = wm.h + 18;
  const px = Math.round((centered ? W * 0.5 : W * 0.545) - plateW / 2), py = 34;
  // plate body (bone bevel, hollow center) + gold rails + drift inlay
  for (let y = py; y < py + plateH; y++) for (let x = px; x < px + plateW; x++) {
    const edged = Math.min(x - px, px + plateW - 1 - x, y - py, py + plateH - 1 - y);
    let c = null;
    if (edged < 1) c = RAMP.void;
    else if (edged < 3) c = (y - py < plateH / 2) ? bn[1] : bn[3];
    else if (edged < 4) c = bn[0];
    else if (edged < 5) c = bn[3];
    if (c) P(g, x, y, c);
  }
  for (let x = px + 5; x < px + plateW - 5; x++) { P(g, x, py + 5, gd[1]); P(g, x, py + plateH - 6, gd[2]); }
  for (let y = py + 5; y < py + plateH - 5; y++) { P(g, px + 5, y, gd[1]); P(g, px + plateW - 6, y, gd[2]); }
  for (let x = px + 10; x < px + plateW - 8; x += 12) { P(g, x, py + 5, dr[1]); P(g, x, py + plateH - 6, dr[1]); }
  // corner drift gems
  [[px + 4, py + 4], [px + plateW - 5, py + 4], [px + 4, py + plateH - 5], [px + plateW - 5, py + plateH - 5]].forEach(([gx, gy]) => { P(g, gx, gy, dr[0]); P(g, gx + 1, gy, dr[2]); P(g, gx, gy + 1, dr[2]); });
  // stamp wordmark into the hollow
  stamp(g, wm, px + (plateW - wm.w) / 2 | 0, py + (plateH - wm.h) / 2 | 0);

  // --- tagline beneath, bone ramp, above bottom 15% (H*0.85 = 106) ---
  const tag = 'THE DRIFT TAKES THE REALM';
  const tw = textWidth35(tag);
  const tx = Math.round(px + plateW / 2 - tw / 2), ty = py + plateH + 6;
  drawText35(g, tag, tx, ty, bn[1], RAMP.void);

  // --- $DRIFTS ticker beneath the tagline, gold on the rooftop band ---
  const tkw = 4 + textWidth35('DRIFTS');
  const kx = Math.round(px + plateW / 2 - tkw / 2), ky = ty + 8;
  for (let x = kx - 4; x <= kx + tkw + 3; x++) { P(g, x, ky - 2, gd[3]); P(g, x, ky + 7, gd[3]); }   // rails
  for (let x = kx - 4; x <= kx + tkw + 3; x++) for (let y = ky - 1; y <= ky + 6; y++) if ((x + y) % 2 === 0) P(g, x, y, '#160a26'); // plinth
  drawTicker(g, kx, ky, gd[0], RAMP.void);

  return g;
}

const SOCIAL = {
  pfp_coin:       { fn: () => drawCoinSigil(128, true),  native: [128, 128], scale: 8, out: [1024, 1024] },
  pfp_coin_clean: { fn: () => drawCoinSigil(128, false), native: [128, 128], scale: 8, out: [1024, 1024] },
  pfp_x:          { fn: () => drawCoinSigil(100, false), native: [100, 100], scale: 8, out: [800, 800] },
  banner_x:       { fn: () => drawBanner(false),         native: [375, 125], scale: 4, out: [1500, 500] },
  banner_pumpfun: { fn: () => drawBanner(true),          native: [375, 125], scale: 4, out: [1500, 500] },
};

Object.assign(globalThis, { disc, ring, drawCoinSigil, drawBanner, drawTicker, drawText35, textWidth35, FONT35, SOCIAL });
