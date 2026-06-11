// DriftLands "THE THRESHOLD" tutorial micro-set — eval after pixlib.js + tiles.js.
// Rect-grid, RAMP only, 1px void outline, dither not blur, deterministic.
// Gate 96x128 (sealed+open, 3 rune-pulse frames each) · Gatewarden 32x40 (5
// facings, idle 2f) · Objective beacon 64x64 (3f) + arrow pip 16x16 (2f) ·
// Drift wall 64x96 FX (3f, seam-continuous) · ground accents 64x32 (2 variants).

/* ---- local circle / triangle helpers ---- */
function tDisc(g, cx, cy, r, fn) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy); if (d <= r) fn(x, y, d);
    }
}
function tRing(g, cx, cy, r, w, c) { tDisc(g, cx, cy, r, (x, y, d) => { if (d >= r - w) P(g, x, y, c); }); }
function triLine(g, x0, y0, x1, y1, c, t) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let oy = 0; oy < t; oy++) for (let ox = 0; ox < t; ox++) P(g, Math.round(x) + ox, Math.round(y) + oy, c); }
}
// the triangle-in-circle door sigil, centered at cx,cy radius R, gold tone set by lit
function gateSigil(g, cx, cy, R, lit) {
  const gd = RAMP.gold, dr = RAMP.drift;
  const hi = lit ? gd[0] : gd[3], mid = lit ? gd[1] : gd[3], dim = lit ? gd[2] : '#5c4a1e';
  tRing(g, cx, cy, R, 1, mid);
  const v = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 3); return [cx + Math.cos(a) * R * 0.84, cy + Math.sin(a) * R * 0.84]; });
  const tw = Math.max(1, Math.round(R * 0.12));
  triLine(g, v[0][0], v[0][1], v[1][0], v[1][1], hi, tw);
  triLine(g, v[1][0], v[1][1], v[2][0], v[2][1], mid, tw);
  triLine(g, v[2][0], v[2][1], v[0][0], v[0][1], mid, tw);
  tRing(g, cx, cy, R * 0.46, 1, dim);
  for (let yy = -R * 0.44; yy <= R * 0.5; yy++) P(g, Math.round(cx), Math.round(cy + yy), ((cy + yy) | 0) % 2 ? mid : dim);  // keyhole bar
  if (lit) { P(g, cx, cy, dr[0]); P(g, cx, cy - 1, dr[1]); P(g, cx, cy + 1, dr[1]); }   // drift mote in the eye
}

/* ============================ 1 · THRESHOLD GATE (96x128, sealed/open ×3f) ======== */
function drawThresholdGate(open, frame) {
  const g = makeGrid(96, 128); const cx = 48, baseY = 122;
  const st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift, bn = RAMP.bone;
  // pale-stone helper: stone ramp leaned lighter with bone highlights
  function block(x, y, lit) {
    let c = lit ? st[0] : st[1];
    const h = hash2(x, y, 401);
    if (h < 0.05) c = st[2]; else if (h < 0.065) c = st[0]; else if (h < 0.075) c = bn[2];  // chips + sparse pale highlights
    P(g, x, y, c);
  }
  // foundation slab (iso) under the arch
  const fb = 86, fh = 9;
  for (let dy = -fh; dy <= fh; dy++) { const t = 1 - Math.abs(dy) / fh, w = Math.round((fb / 2) * t); for (let dx = -w; dx <= w; dx++) { let c = st[2]; if (dy < 0 && dx < 0) c = st[1]; if (dy > 2) c = st[3]; P(g, cx + dx, baseY + dy - 2, c); } }

  // pillars
  const pw = 16, ph = 84, lx0 = 12, rx0 = 96 - 12 - pw;
  for (const [x0, sideLit] of [[lx0, true], [rx0, false]]) {
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const yy = baseY - 6 - y, xx = x0 + x;
      const lit = sideLit ? x < 3 : x < 2;
      // course seams
      let edge = (y % 10 === 0) || (x === 0) || (x === pw - 1);
      block(xx, yy, lit && !edge);
      if (edge) P(g, xx, yy, st[3]);
    }
    // right-side iso depth
    for (let d = 1; d <= 6; d++) for (let y = 0; y < ph; y++) P(g, x0 + pw - 1 + d, baseY - 6 - y - Math.floor(d / 2), st[3]);
  }
  // arch (semicircle spanning the pillars)
  const archCx = cx, archCy = baseY - 6 - ph + 4, archR = 36;
  tDisc(g, archCx, archCy, archR, (x, y, d) => { if (y > archCy) return; if (d > archR || d < archR - 16) return; const lit = (x < archCx); let edge = (Math.round(d) % 10 < 2) || d > archR - 1.5 || d < archR - 14.5; block(x, y, lit && !edge); if (edge) P(g, x, y, st[3]); });
  // iso depth on arch
  for (let d = 1; d <= 6; d++) tDisc(g, archCx, archCy, archR, (x, y, dd) => { if (y > archCy) return; if (dd > archR || dd < archR - 16) return; if (x < archCx + 8) return; P(g, x + d, y - Math.floor(d / 2), st[3]); });
  // keystone with the sigil
  gateSigil(g, archCx, archCy - archR + 8, 7, open ? true : false);

  // doorway interior (between pillars, under arch)
  const dl = lx0 + pw, dr_ = rx0, dtop = archCy, dbot = baseY - 6;
  for (let y = dtop; y <= dbot; y++) for (let x = dl; x <= dr_; x++) {
    const underArch = (x - archCx) ** 2 + (y - archCy) ** 2 <= (archR - 16) ** 2 || y >= archCy;
    if (!underArch) continue;
    if (open) {
      // glowing drift-purple void with dither + depth
      const t = (y - dtop) / (dbot - dtop);
      let c = dr[4];
      if ((x + y) % 2 === 0) c = t < 0.5 ? dr[3] : dr[4];
      if (Math.abs(x - cx) < 10 && hash2(x, y + frame, 402) < 0.18) c = dr[2];   // shifting glow
      if (Math.abs(x - cx) < 5 && hash2(x, y - frame * 2, 403) < 0.12) c = dr[1];
      P(g, x, y, c);
    } else {
      // filled with sealed stone blocks
      const lit = x < cx;
      let edge = (y % 9 === 0) || ((x + (Math.floor(y / 9) % 2) * 4) % 8 === 0);
      block(x, y, lit && !edge); if (edge) P(g, x, y, st[3]);
    }
  }
  // rune ring around the doorway (pulse across frames)
  const pulse = [0, 1, 2, 1][frame % 4] / 2;  // 0 .. 1
  const litRune = open ? true : (pulse > 0.4);
  const runeTone = open ? (pulse > 0.6 ? gd[0] : gd[1]) : (pulse > 0.4 ? gd[2] : gd[3]);
  // runes set into the pillars + arch inner edge
  const runeSpots = [[dl + 1, dbot - 14], [dl + 1, dbot - 34], [dr_ - 1, dbot - 14], [dr_ - 1, dbot - 34], [cx - 14, dtop + 2], [cx + 14, dtop + 2]];
  runeSpots.forEach(([rx, ry], i) => { P(g, rx, ry, runeTone); P(g, rx, ry + 1, runeTone); P(g, rx + (i % 2 ? 1 : -1), ry, litRune ? runeTone : st[3]); P(g, rx, ry - 1, litRune ? gd[3] : st[3]); });
  // open: glow spill + escaping motes
  if (open) {
    for (let x = dl; x <= dr_; x++) if ((x + frame) % 3 === 0) P(g, x, dbot + 1, dr[2]);
    const mr = mulberry(404 + frame);
    for (let i = 0; i < 5; i++) { const mx = cx + Math.round((mr() - 0.5) * 24), my = dtop + Math.round(mr() * (dbot - dtop)); P(g, mx, my - frame, mr() < 0.4 ? dr[0] : dr[1]); }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · THE GATEWARDEN (32x40, 5 facings, idle 2f) ====== */
function drawGatewarden(facing, frame) {
  const g = makeGrid(32, 40); const cx = 16, baseY = 37;
  const bn = RAMP.bone, gd = RAMP.gold, dr = RAMP.drift, st = RAMP.stone;
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const off = [0, 1, 2, 1, 0][dir], showFace = dir <= 2;
  const sway = frame === 1 ? 1 : 0;
  const top = 8;
  // robe body (bone, tapered, gold hem)
  for (let y = 17; y <= 36; y++) {
    const t = (y - 17) / 19, hw = Math.round(3.4 + t * 4.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(sway * 0.5) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = bn[1]; if (x <= cxx - hw + 1) c = bn[0]; if (x >= cxx + hw - 1) c = bn[3];
      if (dir >= 3 && x === cxx) c = bn[2];
      if (hash2(x, y, 411) < 0.05) c = bn[2];
      P(g, x, y, c);
    }
  }
  // gold trim down the front + hem
  if (!(dir >= 3)) for (let y = 18; y <= 35; y += 1) P(g, cx + off, y, (y % 2 ? gd[1] : gd[2]));
  for (let x = cx + off - 6; x <= cx + off + 6; x++) { const v = G(g, x, 36); if (v) P(g, x, 36, gd[2]); }
  // hood
  for (let y = top; y <= 18; y++) { const hy = (y - top) / (18 - top), hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.6); const cxx = cx + off; for (let x = cxx - hw; x <= cxx + hw; x++) { let c = bn[1]; if (x === cxx - hw) c = bn[0]; if (x >= cxx + hw - 1) c = bn[3]; if (y === top) c = bn[0]; P(g, x, y, c); } }
  P(g, cx + off, top - 1, bn[1]);
  // gold trim on hood rim
  for (let x = cx + off - 4; x <= cx + off + 4; x++) { const v = G(g, x, 17); if (v) P(g, x, 17, gd[2]); }
  // hidden face + 2 gold eye glows
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0), w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    if (dir === 0) { P(g, fcx - 1, ey, gd[0]); P(g, fcx + 1, ey, gd[0]); }
    else if (dir === 1) { P(g, fcx, ey, gd[0]); P(g, fcx + 2, ey, gd[1]); }
    else { P(g, fcx + 1, ey, gd[0]); }
  }
  // tall iron staff with chained drift mote (mote bobs in idle)
  const stx = cx + off + (dir >= 1 ? 6 : -6);
  for (let y = top - 4; y <= baseY - 1; y++) P(g, stx, y, y % 6 === 0 ? st[3] : st[1]);
  P(g, stx - 1, top - 4, st[2]); P(g, stx + 1, top - 4, st[2]);                 // staff head crook
  P(g, stx, top - 5, st[2]);
  // chain + mote hanging from the head, bobs by frame
  const moteY = top - 1 + sway * 2;
  P(g, stx, top - 3, st[3]); P(g, stx, top - 2, st[3]);                         // chain links
  P(g, stx, moteY, dr[0]); P(g, stx - 1, moteY, dr[1]); P(g, stx + 1, moteY, dr[1]); P(g, stx, moteY + 1, dr[2]); P(g, stx, moteY - 1, dr[1]);
  for (let a = 0; a < 6; a++) { const ax = stx + [2, 2, -2, -2, 0, 0][a], ay = moteY + [0, 1, 0, 1, 2, -2][a]; if (hash2(ax, ay + frame, 412) < 0.5) P(g, ax, ay, dr[2]); }  // faint halo
  // feet
  P(g, cx - 3 + (dir >= 1 ? 1 : 0), baseY, RAMP.void); P(g, cx + 3 + (dir >= 1 ? 1 : 0), baseY, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · OBJECTIVE BEACON (64x64, 3f) + ARROW (16x16, 2f) */
function drawBeacon(frame) {
  const g = makeGrid(64, 64); const cx = 32, cy = 48;            // diamond center
  const gd = RAMP.gold, dr = RAMP.drift;
  const rows = diamondRows();
  // rune-scribed tile (diamond), faint dirt so it reads on grass AND dirt
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const gx = x, gy = cy - 16 + y;
    let c = ((x + y) % 2 === 0) ? '#2a2032' : '#1b1526';
    P(g, gx, gy, c);
  }
  // gold rune ring scribed on the tile
  tRing(g, cx, cy, 13, 1, gd[2]); tRing(g, cx, cy, 13, 1, gd[2]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P(g, Math.round(cx + Math.cos(a) * 8), Math.round(cy + Math.sin(a) * 4), gd[1]); }
  // diamond edge
  for (let y = 0; y < 32; y++) { P(g, rows[y].x0, cy - 16 + y, RAMP.void); P(g, rows[y].x1, cy - 16 + y, RAMP.void); }
  // rising column of dithered gold light (rise/peak/fall)
  const heights = [22, 34, 14], H = heights[frame % 3];
  const peak = frame === 1;
  for (let k = 0; k < H; k++) {
    const y = cy - 4 - k, t = k / H;
    const w = Math.max(1, Math.round((1 - t) * 6) + (peak ? 1 : 0));
    for (let x = -w; x <= w; x++) {
      const ax = cx + x;
      const core = Math.abs(x) <= 1;
      if (core) P(g, ax, y, t < 0.3 ? gd[0] : gd[1]);
      else if ((ax + y + frame) % 2 === 0 && hash2(ax, y, 421) < (1 - t) * 0.9) P(g, ax, y, Math.abs(x) <= 2 ? gd[1] : gd[2]);
    }
  }
  // crowning mote at the peak
  if (peak) { P(g, cx, cy - 4 - H, gd[0]); P(g, cx, cy - 5 - H, dr[1]); }
  return g;  // no hard outline — it is light
}
function drawArrowPip(frame) {
  const g = makeGrid(16, 16); const cx = 8, bob = frame === 1 ? 2 : 0, gd = RAMP.gold;
  // chunky down-arrow
  const top = 3 + bob;
  for (let y = 0; y < 5; y++) for (let x = -4 + y; x <= 4 - y; x++) P(g, cx + x, top + y, y < 1 ? gd[0] : gd[1]);
  for (let y = 0; y < 4; y++) for (let x = -2; x <= 2; x++) P(g, cx + x, top - 1 - y, gd[2]);  // stem
  for (let x = -2; x <= 2; x++) P(g, cx + x, top - 4, gd[1]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 4 · DRIFT WALL FX (64x96, 3f, tiles horizontally) === */
function drawDriftWall(frame) {
  const W = 64, H = 96, g = makeGrid(W, H);
  const dr = RAMP.drift;
  const phase = frame * 1.15;
  for (let x = 0; x < W; x++) {
    // crest silhouette wobbles, PERIODIC across the 64 seam (sin of x/W*2pi)
    const crest = Math.round(H * 0.32 + 9 * Math.sin((x / W) * Math.PI * 2 + phase) + 4 * Math.sin((x / W) * Math.PI * 4 - phase));
    for (let y = crest; y < H; y++) {
      const below = (y - crest) / (H - crest);                 // 0 crest .. 1 floor
      const n = hash2(x, (y + frame * 5) % H, 431);            // boil noise, scrolls up
      const n2 = hash2(x, ((y - frame * 4) % H + H) % H, 432);
      let c = null;
      if (below > 0.5) {                                        // void-dark core w/ purple veins
        c = (n < 0.13) ? dr[3] : (((x + y) % 2 === 0 && n2 < 0.32) ? dr[4] : RAMP.void);
      } else {                                                  // boiling purple band
        if ((x + y + frame) % 2 === 0 && n < 0.86) c = n < 0.3 ? dr[2] : dr[3];
        else if (n2 < 0.22) c = dr[1];                          // bright veins
      }
      if (below < 0.1 && n < 0.55) c = n < 0.16 ? dr[0] : dr[1]; // hot crest line
      if (c) P(g, x, y, c);
    }
    // wispy tendrils boiling above the crest (dithered, fade upward)
    for (let k = 1; k <= 9; k++) {
      const y = crest - k;
      if (y >= 0 && (x + y) % 2 === 0 && hash2(x, (y + frame * 6) % H, 433) < (1 - k / 9) * 0.55) P(g, x, y, k < 3 ? dr[2] : dr[3]);
    }
  }
  // escaping motes (periodic seeds so they wrap across the seam)
  for (let i = 0; i < 8; i++) { const mx = (i * 37) % W; const my = ((i * 53 - frame * 7) % H + H) % H; P(g, mx, my, i % 3 === 0 ? dr[0] : dr[1]); }
  // NOTE: no outline (tiling FX strip; an outline would create seams)
  return g;
}

/* ============================ 5 · THRESHOLD GROUND ACCENT (64x32, 2 variants) ===== */
function drawThresholdTile(variant) {
  const g = makeGrid(64, 36); const rows = diamondRows();
  const st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold;
  // pale flagstone face
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    let c = ((x + y) % 2 === 0) ? '#4a4660' : st[1];           // pale stone dither
    if (y > 22) c = st[2];
    P(g, x, y, c);
  }
  // 3px south lip + void north edge
  for (let x = 0; x < 64; x++) { let my = -1; for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) { my = y; break; } if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, st[3]); for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; } }
  // cracks
  const seed = 440 + variant;
  let cxk = 20 + variant * 16, cyk = 8;
  for (let s = 0; s < 18; s++) { P(g, cxk, cyk, st[3]); if (hash2(cxk, cyk, seed) < 0.5) P(g, cxk, cyk + 1, st[3]); cxk += (hash2(cxk, cyk, seed + 1) < 0.5 ? 1 : 0) + 1; cyk += (hash2(cxk, cyk, seed + 2) < 0.5 ? 1 : 0); if (!inDiamond(rows, cxk, cyk)) break; }
  // faint gold rune fragments scattered on the face
  const frag = variant === 0
    ? [[26, 12], [34, 16], [30, 20]]
    : [[24, 14], [38, 12], [32, 18], [28, 22]];
  frag.forEach(([fx, fy], i) => { if (!inDiamond(rows, fx, fy)) return; P(g, fx, fy, gd[2]); if (i % 2 === 0) { P(g, fx + 1, fy, gd[3]); } else { P(g, fx, fy + 1, gd[3]); P(g, fx + 1, fy, gd[2]); } });
  return g;  // accent overlay; keep its own diamond edge only
}

const THRESHOLD = {
  gate:        { cell: [96, 128], anchor: [48, 127] },
  gatewarden:  { cell: [32, 40], anchor: [16, 39] },
  beacon:      { cell: [64, 64], anchor: [32, 48] },
  arrow_pip:   { cell: [16, 16], anchor: [8, 8] },
  drift_wall:  { cell: [64, 96], anchor: [32, 95] },
  ground:      { cell: [64, 36], anchor: [32, 16] },
};

Object.assign(globalThis, {
  tDisc, tRing, triLine, gateSigil,
  drawThresholdGate, drawGatewarden, drawBeacon, drawArrowPip, drawDriftWall, drawThresholdTile,
  THRESHOLD,
});
