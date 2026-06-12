// Naevyr INTERIOR SET + THE MINE — eval after pixlib.js + tiles.js.
// Rect-grid, RAMP only, 1px void auto-outline, dither not blur, deterministic.
// Moonlit-left / shadowed-right. Floors 64×36 (tiles.js format). Walls 64×56.
// Fixtures bottom-center anchored; top 6px of every fixture/building cell kept
// clear for engine labels.

/* ============================ FLOOR TILES (64×36) ============================ */
function makeFloorTile(type, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = type === 'wood' ? RAMP.dirt : RAMP.stone;
  const face = ramp[1], hi = ramp[0], sh = ramp[2], dp = ramp[3];

  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip
  for (let x = 0; x < 64; x++) { const my = contourMaxY(rows, x); if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh); }
  // 1px void north edge
  for (let x = 0; x < 64; x++) for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }

  if (type === 'wood') {
    // plank seams run NW→SE (parallel to top-left edge): constant (x+2y)
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      if ((x + 2 * y) % 10 === 0) P(g, x, y, dp);                      // board seam
      else if ((x + 2 * y) % 10 === 1) P(g, x, y, hi);                 // plank highlight edge
      if (hash2(x, y, seedN) < 0.015) { P(g, x, y, dp); P(g, x + 1, y, sh); } // knot
      else if (hash2(x, y, seedN + 5) < 0.03) P(g, x, y, sh);          // grain
    }
    // board END caps (cross seams) every few rows
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++)
      if ((x - 2 * y + 64) % 26 === (seedN * 7) % 26) P(g, x, y, dp);
  } else if (type === 'stone') {
    // flagstone courses (blocky), hairline cracks
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const bx = Math.floor((x + 2 * y) / 12), by = Math.floor((x - 2 * y + 128) / 12);
      if ((x + 2 * y) % 12 === 0 || (x - 2 * y + 128) % 12 === 0) P(g, x, y, dp);   // joints
      else if (hash2(bx, by, seedN) < 0.18 && hash2(x, y, seedN + 1) < 0.5) P(g, x, y, hash2(x, y, seedN + 2) < 0.5 ? hi : sh);
      if (hash2(x, y, seedN + 7) < 0.012) P(g, x, y, dp);             // hairline crack
    }
  } else { // cave
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const h = hash2(x, y, seedN);
      if (h < 0.08) P(g, x, y, sh);
      else if (h < 0.11) P(g, x, y, dp);
      else if (h < 0.135) P(g, x, y, hi);
      if (hash2(x, y, seedN + 9) < 0.012) { P(g, x, y, RAMP.gold[1]); if (hash2(x, y, seedN + 10) < 0.4) P(g, x + 1, y, RAMP.gold[2]); } // gold fleck
      if (hash2(x, y, seedN + 11) < 0.02) P(g, x, y, dp);             // rubble speck
    }
  }
  return g;
}

/* ============================ WALL SEGMENTS (64×56) ==========================
   Flat camera-facing face + a sheared iso top cap that implies the wall's
   recede direction. NW = back-left (moonlit), NE = back-right (shadowed). */
function wallSegment(side, mat, variant, opt) {
  opt = opt || {};
  const g = makeGrid(64, 56);
  const lit = side === 'nw';
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  // base/face brightness shift by side
  const cBase = lit ? ramp[1] : ramp[2];
  const cHi = lit ? ramp[0] : ramp[1];
  const cSh = lit ? ramp[2] : ramp[3];
  const faceTop = 14, faceBot = 53;

  // ---- top cap (iso thickness), sheared toward the far corner ----
  for (let x = 0; x < 64; x++) {
    // NW recedes up-right → cap rises to the right; NE mirror
    const sx = lit ? x : 63 - x;
    const capLift = Math.floor(sx / 8);             // 0..7 px
    for (let k = 0; k < 6; k++) P(g, x, faceTop - 1 - k - capLift, k < 2 ? RAMP.stone[lit ? 1 : 2] : (mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]));
    // void cap edge
    P(g, x, faceTop - 6 - capLift, RAMP.void);
  }

  // ---- face ----
  for (let y = faceTop; y <= faceBot; y++) for (let x = 0; x < 64; x++) {
    let c = cBase;
    if (x < 3) c = lit ? cHi : ramp[1];             // left edge lightest
    else if (x > 60) c = cSh;
    // material texture
    if (mat === 'timber') {
      if ((y - faceTop) % 4 === 0) c = cSh;          // plank seams
      if (hash2(x, y, 71) < 0.04) c = cSh;
    } else if (mat === 'block') {
      const course = Math.floor((y - faceTop) / 6);
      if ((y - faceTop) % 6 === 0) c = cSh;          // course line
      if ((x + (course % 2) * 6) % 12 === 0) c = cSh; // vertical joints (staggered)
      if (hash2(x, y, 72) < 0.03) c = lit ? ramp[1] : ramp[3];
    } else { // cave — raw rock
      const h = hash2(x, y, 73);
      if (h < 0.10) c = cSh;
      else if (h < 0.14) c = cHi;
      if (hash2(x, y, 74) < 0.02) c = ramp[3];
    }
    P(g, x, y, c);
  }
  // baseboard
  for (let x = 0; x < 64; x++) { P(g, x, faceBot, ramp[3]); P(g, x, faceBot - 1, cSh); }

  // ---- variants ----
  if (variant === 'window') {
    const wx = 24, wy = 24, ww = 16, wh = 14;
    for (let j = 0; j < wh; j++) for (let i = 0; i < ww; i++) {
      let c = RAMP.ember[1];
      if (i === 0 || j === 0 || i === ww - 1 || j === wh - 1) c = RAMP.ember[0];
      if ((i + j) % 2 === 0 && hash2(i, j, 75) < 0.25) c = RAMP.ember[0];
      P(g, wx + i, wy + j, c);
    }
    // bone frame + mullions
    for (let i = -1; i <= ww; i++) { P(g, wx + i, wy - 1, RAMP.bone[2]); P(g, wx + i, wy + wh, RAMP.bone[3]); }
    for (let j = -1; j <= wh; j++) { P(g, wx - 1, wy + j, RAMP.bone[2]); P(g, wx + ww, wy + j, RAMP.bone[3]); }
    for (let j = 0; j < wh; j++) P(g, wx + (ww >> 1), wy + j, RAMP.bone[3]);
    for (let i = 0; i < ww; i++) P(g, wx + i, wy + (wh >> 1), RAMP.bone[3]);
    // warm spill
    for (let i = -2; i < ww + 2; i++) P(g, wx + i, wy + wh + 1, RAMP.ember[2]);
  } else if (variant === 'banner') {
    const acc = opt.accent || RAMP.drift;
    const bx = 26, by = faceTop + 2, bw = 12, bh = 30;
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      let c = acc[2];
      if (i === 0) c = acc[1]; if (i === bw - 1) c = acc[3];
      P(g, bx + i, by + j, c);
    }
    for (let i = -1; i <= bw; i++) P(g, bx + i, by - 1, RAMP.dirt[3]);   // rod
    // pennant tail (notched bottom)
    for (let i = 0; i < bw; i++) { const t = Math.abs(i - (bw - 1) / 2) / ((bw - 1) / 2); for (let k = 0; k < Math.round((1 - t) * 5); k++) P(g, bx + i, by + bh + k, acc[3]); }
    // emblem
    P(g, bx + (bw >> 1), by + 10, acc[0]); P(g, bx + (bw >> 1) - 1, by + 11, acc[0]); P(g, bx + (bw >> 1) + 1, by + 11, acc[0]); P(g, bx + (bw >> 1), by + 12, acc[1]);
  } else if (variant === 'seam') {
    // glinting gold seam across raw rock
    let x = 8, y = faceTop + 6;
    for (let k = 0; k < 40; k++) {
      P(g, x, y, RAMP.gold[1]); if (hash2(x, y, 76) < 0.5) P(g, x, y + 1, RAMP.gold[2]);
      if (hash2(x, y, 77) < 0.3) P(g, x, y - 1, RAMP.gold[0]);          // glint
      x += 1 + (hash2(k, 1, 78) < 0.4 ? 1 : 0); y += hash2(k, 2, 78) < 0.5 ? 1 : (hash2(k, 3, 78) < 0.5 ? -1 : 0);
      if (x > 58) break; y = Math.max(faceTop + 2, Math.min(faceBot - 3, y));
    }
  } else if (variant === 'lantern') {
    // hanging miner's lantern (ember)
    const lx = 32, ly = faceTop + 6;
    for (let k = 0; k < 5; k++) P(g, lx, faceTop - 1 - k < 0 ? 0 : faceTop - 1 + k, RAMP.dirt[3]); // bracket down
    P(g, lx, ly - 3, RAMP.dirt[3]);
    for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) {
      let c = RAMP.ember[1]; if (j === 0 || j === 7) c = RAMP.dirt[3]; else if (i <= -2) c = RAMP.ember[0]; else if (i >= 2) c = RAMP.ember[2];
      if ((j === 1 || j === 6) && Math.abs(i) === 3) c = RAMP.dirt[3];
      P(g, lx + i, ly + j, c);
    }
    P(g, lx, ly + 3, RAMP.ember[0]);
    // glow dither
    for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 4 && d < 8 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]); }
  }

  outline(g, RAMP.void);
  return g;
}

/* ============================ FIXTURES ============================ */
// generic iso cuboid: front (lit) + right side (shadow) + top
function isoCuboid(g, x0, baseY, w, h, dep, ramp) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {           // front
    let c = ramp[1]; if (x < 1) c = ramp[0]; if (x > w - 2) c = ramp[2];
    P(g, x0 + x, baseY - y, c);
  }
  for (let d = 1; d <= dep; d++) for (let y = 0; y < h; y++) {        // right side
    P(g, x0 + w - 1 + d, baseY - y - Math.floor(d / 2), d >= dep - 1 ? ramp[3] : ramp[2]);
  }
  for (let d = 0; d <= dep; d++) for (let x = 0; x < w; x++) {        // top
    P(g, x0 + x + d, baseY - h - Math.floor(d / 2), d === 0 || x === 0 ? ramp[0] : ramp[1]);
  }
}

function fxCounter() {
  const g = makeGrid(48, 32); const r = RAMP.dirt; const baseY = 29, x0 = 3;
  isoCuboid(g, x0, baseY, 38, 16, 6, r);
  // top surface lighter plank
  for (let d = 0; d <= 6; d++) for (let x = 0; x < 38; x++) if ((x + d) % 6 === 0) P(g, x0 + x + d, baseY - 16 - Math.floor(d / 2), r[2]);
  // gold till glint
  P(g, x0 + 30, baseY - 17, RAMP.gold[0]); P(g, x0 + 31, baseY - 18, RAMP.gold[1]); P(g, x0 + 30, baseY - 16, RAMP.gold[2]);
  // panel seams on front
  for (let x = 8; x < 38; x += 10) for (let y = 0; y < 15; y++) P(g, x0 + x, baseY - y, r[3]);
  outline(g, RAMP.void); return g;
}

function fxShelf() {
  const g = makeGrid(40, 40); const r = RAMP.dirt; const x0 = 4, top = 8;
  // frame
  for (let j = 0; j < 28; j++) { P(g, x0, top + j, r[2]); P(g, x0 + 30, top + j, r[3]); }
  for (const sy of [top, top + 9, top + 18, top + 27]) for (let i = 0; i <= 30; i++) P(g, x0 + i, sy, r[3]);
  // bottles (top shelf)
  [[RAMP.drift, 6], [RAMP.ember, 11], [RAMP.water, 16], [RAMP.grass, 21]].forEach(([col, bx]) => {
    P(g, x0 + bx, top + 3, col[1]); P(g, x0 + bx, top + 4, col[2]); P(g, x0 + bx, top + 5, col[2]); P(g, x0 + bx, top + 2, RAMP.bone[2]);
  });
  // coffer (mid)
  for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) { let c = RAMP.dirt[1]; if (i === 0) c = RAMP.dirt[0]; if (i === 11) c = RAMP.dirt[2]; if (j === 0) c = RAMP.gold[2]; P(g, x0 + 8 + i, top + 11 + j, c); }
  P(g, x0 + 14, top + 13, RAMP.gold[0]);
  // cloth bolts (lower)
  [[RAMP.blood, 6], [RAMP.drift, 13], [RAMP.gold, 20]].forEach(([col, bx]) => { for (let j = 0; j < 6; j++) P(g, x0 + bx, top + 20 + j, col[1]), P(g, x0 + bx + 1, top + 20 + j, col[2]); });
  outline(g, RAMP.void); return g;
}

function fxTable() {
  const g = makeGrid(40, 32); const r = RAMP.dirt; const cx = 20, ty = 16;
  // round top (iso ellipse)
  for (let yy = -5; yy <= 5; yy++) for (let xx = -13; xx <= 13; xx++) { if ((xx / 13) ** 2 + (yy / 5) ** 2 > 1) continue; let c = r[1]; if (yy < -1) c = r[0]; if (yy > 2) c = r[2]; P(g, cx + xx, ty + yy, c); }
  for (let xx = -13; xx <= 13; xx++) { const t = 1 - Math.abs(xx) / 13; const ey = ty + Math.round(5 * t); for (let k = 1; k <= 3; k++) P(g, cx + xx, ey + k, r[3]); } // rim
  // legs
  P(g, cx - 8, ty + 8, r[3]); P(g, cx - 8, ty + 9, r[3]); P(g, cx + 8, ty + 8, r[3]); P(g, cx + 8, ty + 9, r[3]); P(g, cx, ty + 11, r[3]); P(g, cx, ty + 12, r[3]);
  // mug
  P(g, cx + 3, ty - 2, RAMP.dirt[2]); P(g, cx + 3, ty - 3, RAMP.dirt[1]); fillRect(g, cx + 2, ty - 4, 3, 2, RAMP.dirt[1]); P(g, cx + 5, ty - 3, RAMP.dirt[2]); P(g, cx + 3, ty - 5, RAMP.bone[1]);
  outline(g, RAMP.void); return g;
}

function fxBarrel() {
  const g = makeGrid(20, 28); const r = RAMP.dirt; const x0 = 3, baseY = 25;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 12; i++) { const t = Math.abs(i - 5.5) / 6; let c = r[1]; if (i <= 1) c = r[0]; if (i >= 9) c = r[2]; if (t > 0.85) c = r[3]; if (j === 0 || j === 21) c = r[3]; if (j === 5 || j === 16) c = r[3]; P(g, x0 + i, baseY - 21 + j, c); }
  // top rim ellipse
  for (let xx = 0; xx < 12; xx++) { const t = Math.abs(xx - 5.5) / 6; if (t < 0.92) P(g, x0 + xx, baseY - 21 - Math.round((1 - t) * 2), r[2]); }
  P(g, x0 + 5, baseY - 24, r[1]);
  outline(g, RAMP.void); return g;
}

const VAT_LIQUIDS = ['drift', 'ember', 'water', 'blood', 'grass', 'gold'];
function fxVat(liquid) {
  const g = makeGrid(28, 28); const r = RAMP.dirt; const lr = RAMP[liquid] || RAMP.drift; const cx = 14, baseY = 25;
  // wooden tub
  for (let j = 0; j < 16; j++) for (let i = -10; i <= 10; i++) { const t = Math.abs(i) / 10; if (t > 0.95 - j * 0.005) continue; let c = r[1]; if (i < -7) c = r[0]; if (i > 7) c = r[2]; if (j % 6 === 5) c = r[3]; if (Math.abs(i) >= 9) c = r[3]; P(g, cx + i, baseY - j, c); }
  // liquid surface (iso ellipse) near top
  for (let yy = -3; yy <= 3; yy++) for (let xx = -8; xx <= 8; xx++) { if ((xx / 8) ** 2 + (yy / 3) ** 2 > 1) continue; let c = lr[2] || lr[1]; if (yy < -1) c = lr[1]; if (yy <= -2) c = lr[0]; if ((xx + yy) % 3 === 0 && yy > 0) c = lr[3] || lr[2]; P(g, cx + xx, baseY - 14 + yy, c); }
  // steam
  P(g, cx - 2, baseY - 18, RAMP.bone[3]); P(g, cx + 1, baseY - 20, RAMP.bone[3]); P(g, cx - 1, baseY - 22, RAMP.bone[3]);
  // rim
  for (let xx = -9; xx <= 9; xx++) { const t = Math.abs(xx) / 9; if (t < 0.96) P(g, cx + xx, baseY - 16 - Math.round((1 - t) * 1), r[2]); }
  outline(g, RAMP.void); return g;
}

function fxCage() {
  const g = makeGrid(26, 32); const r = RAMP.stone; const x0 = 3, top = 6, w = 18, h = 22;
  // base
  for (let i = 0; i < w; i++) { P(g, x0 + i, top + h, r[3]); P(g, x0 + i, top + h - 1, r[2]); }
  // dome top
  for (let xx = 0; xx < w; xx++) { const t = Math.abs(xx - (w - 1) / 2) / ((w - 1) / 2); const yy = top - Math.round((1 - t) * 4); for (let k = yy; k < top + 1; k++) P(g, x0 + xx, k, r[2]); }
  P(g, x0 + (w >> 1), top - 5, r[3]); P(g, x0 + (w >> 1), top - 6, r[3]); // ring
  // vertical bars
  for (let i = 0; i <= w; i += 3) for (let j = top; j < top + h; j++) P(g, x0 + i, j, r[3]);
  for (let i = 0; i < w; i++) { P(g, x0 + i, top, r[3]); P(g, x0 + i, top + Math.round(h / 2), r[3]); }
  // glowing wisp inside
  const wx = x0 + (w >> 1), wy = top + 12;
  P(g, wx, wy, RAMP.drift[0]); P(g, wx - 1, wy, RAMP.drift[1]); P(g, wx + 1, wy, RAMP.drift[1]); P(g, wx, wy - 1, RAMP.drift[1]); P(g, wx, wy + 1, RAMP.drift[2]);
  for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy) % 2 === 0) P(g, wx + xx, wy + yy, RAMP.drift[2]);
  outline(g, RAMP.void); return g;
}

function fxAnvil() {
  const g = makeGrid(28, 24); const r = RAMP.stone; const baseY = 21, cx = 14;
  // stump
  for (let j = 0; j < 7; j++) for (let i = -5; i <= 5; i++) { let c = RAMP.dirt[1]; if (i < -3) c = RAMP.dirt[0]; if (i > 3) c = RAMP.dirt[2]; P(g, cx + i, baseY - j, c); }
  // anvil body
  for (let i = -6; i <= 6; i++) P(g, cx + i, baseY - 9, r[1]);            // base top
  for (let i = -4; i <= 4; i++) P(g, cx + i, baseY - 8, r[2]);           // waist
  for (let i = -7; i <= 9; i++) { let c = r[1]; if (i < -5) c = r[0]; if (i > 6) c = r[2]; P(g, cx + i, baseY - 12, c); P(g, cx + i, baseY - 11, c); } // top face + horn
  for (let i = 7; i <= 11; i++) P(g, cx + i, baseY - 11, r[2]);          // horn taper
  // gold spark
  P(g, cx + 2, baseY - 14, RAMP.gold[0]); P(g, cx + 3, baseY - 15, RAMP.gold[1]); P(g, cx + 1, baseY - 15, RAMP.ember[0]);
  outline(g, RAMP.void); return g;
}

function fxWheelStand() {
  const g = makeGrid(34, 40); const cx = 17, wy = 14, R = 12;
  const seg = [RAMP.blood[1], RAMP.ember[1], RAMP.gold[1], RAMP.water[0], RAMP.drift[2], RAMP.grass[1]];
  // stand post + feet
  for (let j = 0; j < 14; j++) P(g, cx, wy + R + j, RAMP.dirt[2]), P(g, cx + 1, wy + R + j, RAMP.dirt[3]);
  for (let i = -6; i <= 6; i++) P(g, cx + i, wy + R + 13, RAMP.dirt[3]);
  // wheel
  for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) { const d = Math.sqrt(xx * xx + yy * yy); if (d > R) continue; if (d > R - 2) { P(g, cx + xx, wy + yy, RAMP.dirt[3]); continue; } const ang = (Math.atan2(yy, xx) + Math.PI) / (Math.PI * 2); P(g, cx + xx, wy + yy, seg[Math.floor(ang * 6) % 6]); }
  P(g, cx, wy, RAMP.bone[1]);                                 // hub
  P(g, cx, wy - R - 1, RAMP.bone[0]); P(g, cx, wy - R, RAMP.bone[1]);   // pointer
  outline(g, RAMP.void); return g;
}

function fxHearth(frame) {
  frame = frame || 0;
  const g = makeGrid(36, 36); const r = RAMP.stone; const cx = 18, baseY = 33;
  // stone surround
  for (let j = 0; j < 28; j++) for (let i = -15; i <= 15; i++) {
    const inner = Math.abs(i) <= 9 && j < 18;
    if (inner) continue;
    if (Math.abs(i) > 15 || j > 27) continue;
    let c = r[1]; if (i < -11) c = r[0]; if (i > 11) c = r[2];
    if ((j % 6 === 0) || ((i + (Math.floor(j / 6) % 2) * 5) % 10 === 0)) c = r[3];
    P(g, cx + i, baseY - j, c);
  }
  // dark firebox
  for (let j = 0; j < 16; j++) for (let i = -8; i <= 8; i++) if (Math.abs(i) <= 8 && j < 16) P(g, cx + i, baseY - j, RAMP.void);
  // logs
  for (let i = -6; i <= 6; i++) P(g, cx + i, baseY - 1, RAMP.dirt[3]);
  P(g, cx - 4, baseY - 2, RAMP.dirt[2]); P(g, cx + 4, baseY - 2, RAMP.dirt[2]);
  // ember fire (flicker)
  const sway = [0, 1, -1][frame], tall = [0, 1, 2][frame];
  for (let yy = 0; yy <= 12 + tall; yy++) { const t = yy / (12 + tall); const hw = Math.round((1 - t) * 6); const sx = cx + Math.round(Math.sin(yy * 0.5 + frame) * 1.1) + Math.round(sway * t); for (let xx = -hw; xx <= hw; xx++) { let c = RAMP.ember[1]; if (Math.abs(xx) >= hw - 1) c = RAMP.ember[2]; if (yy < 5 && Math.abs(xx) < 2) c = RAMP.ember[0]; P(g, sx + xx, baseY - 2 - yy, c); } }
  for (let yy = 2; yy <= 7 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (8 + tall)) * 2)); for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, baseY - 4 - yy, RAMP.gold[0]); }
  // spark + glow
  if (frame !== 1) P(g, cx + sway, baseY - 16 - tall, RAMP.ember[0]);
  for (let yy = -10; yy <= 2; yy++) for (let xx = -10; xx <= 10; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 7 && d < 10 && (xx + yy + frame) % 2 === 0 && baseY - 4 + yy > 14) P(g, cx + xx, baseY - 6 + yy, RAMP.ember[2]); }
  outline(g, RAMP.void); return g;
}

function fxRug(accent) {
  const g = makeGrid(56, 30); const cx = 28, cy = 15; const acc = accent || RAMP.drift;
  for (let yy = -13; yy <= 13; yy++) for (let xx = -26; xx <= 26; xx++) {
    if ((xx / 26) ** 2 + (yy / 13) ** 2 > 1) continue;
    const e = (xx / 26) ** 2 + (yy / 13) ** 2;
    let c = RAMP.dirt[2];
    if (e > 0.78) c = acc[2];                       // accent border
    else if (e > 0.66) c = acc[3];
    else if (e < 0.18) c = acc[3];                  // center medallion
    else if (e < 0.28) c = RAMP.dirt[1];
    if ((xx + yy) % 6 === 0 && e < 0.6 && e > 0.3) c = RAMP.dirt[1]; // weave
    P(g, cx + xx, cy + yy, c);
  }
  // fringe
  for (let xx = -26; xx <= 26; xx += 3) { P(g, cx + xx, cy + Math.round(13 * Math.sqrt(Math.max(0, 1 - (xx / 26) ** 2))) + 1, RAMP.dirt[3]); }
  outline(g, RAMP.void); return g;
}

function fxGoldVein(state) {
  // state: 'rich0','rich1','spent'
  const g = makeGrid(28, 26); const r = RAMP.stone; const cx = 14, baseY = 23;
  for (let yy = 0; yy <= 18; yy++) for (let xx = -11; xx <= 11; xx++) {
    const t = yy / 18; const hw = Math.round(11 * (1 - Math.abs(t - 0.5) * 0.7));
    if (Math.abs(xx) > hw) continue;
    let c = r[1]; if (xx < -hw + 2) c = r[0]; if (xx > hw - 2) c = r[3]; if (yy > 14) c = r[3];
    if (hash2(cx + xx, baseY - yy, 81) < 0.08) c = r[2];
    P(g, cx + xx, baseY - yy, c);
  }
  if (state === 'spent') {
    // hollowed dark pockets, no gold
    [[-4, 10], [3, 7], [0, 13], [-6, 6], [5, 12]].forEach(([ox, oy]) => { for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) P(g, cx + ox + xx, baseY - oy + yy, RAMP.void); P(g, cx + ox, baseY - oy, RAMP.stone[3]); });
  } else {
    const spark = state === 'rich1';
    // bright gold seams
    const seams = [[-7, 4, 1, 1], [-2, 6, 1, -1], [4, 5, 1, 1], [-5, 11, 1, 0], [2, 12, 1, 1]];
    seams.forEach(([sx, sy, dx, dy], i) => { let x = cx + sx, y = baseY - sy; for (let k = 0; k < 6; k++) { P(g, x, y, RAMP.gold[1]); if (k % 2 === 0) P(g, x, y + 1, RAMP.gold[2]); if (spark && (i + k) % 4 === 0) P(g, x, y - 1, RAMP.gold[0]); x += dx; y -= dy * (k % 2); } });
    // a couple of bright nuggets with glint
    P(g, cx - 3, baseY - 8, RAMP.gold[0]); P(g, cx - 2, baseY - 8, RAMP.gold[1]); if (spark) P(g, cx - 3, baseY - 9, RAMP.bone[0]);
    P(g, cx + 5, baseY - 10, RAMP.gold[0]); if (spark) P(g, cx + 6, baseY - 11, RAMP.bone[0]);
  }
  outline(g, RAMP.void); return g;
}

function fxOreCart() {
  const g = makeGrid(36, 28); const r = RAMP.dirt; const baseY = 25, x0 = 4;
  // rails under
  for (let i = 0; i < 36; i++) { P(g, i, baseY, RAMP.stone[3]); P(g, i, baseY - 1, RAMP.stone[2]); }
  for (let i = 2; i < 36; i += 5) P(g, i, baseY + 1, RAMP.dirt[3]);       // ties
  // wheels
  [[x0 + 6, baseY - 2], [x0 + 22, baseY - 2]].forEach(([wx, wy]) => { for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 5) P(g, wx + xx, wy + yy, RAMP.stone[3]); P(g, wx, wy, RAMP.stone[2]); });
  // cart body (trapezoid bucket)
  for (let j = 0; j < 12; j++) { const w = 26 - j; const sx = x0 + 2 + Math.floor((26 - w) / 2); for (let i = 0; i < w; i++) { let c = r[1]; if (i < 1) c = r[0]; if (i > w - 2) c = r[2]; if (j === 0) c = r[2]; P(g, sx + i, baseY - 6 - j, c); } }
  // band + rivets
  for (let i = 0; i < 26; i++) P(g, x0 + 2 + i, baseY - 12, RAMP.dirt[3]);
  // raw gold ore heaped on top
  for (let i = 0; i < 9; i++) { const ox = x0 + 6 + i * 2, oy = baseY - 18 - (i % 2); P(g, ox, oy, RAMP.gold[1]); P(g, ox + 1, oy, RAMP.gold[2]); P(g, ox, oy - 1, RAMP.gold[0]); }
  for (let i = 0; i < 5; i++) P(g, x0 + 9 + i * 3, baseY - 20, RAMP.stone[2]);
  outline(g, RAMP.void); return g;
}

/* ============================ THE MINE (overworld, 144×120) ============================ */
function drawMine() {
  const g = makeGrid(144, 120);
  const cx = 72, baseY = 100;
  // foundation (reuse town foundation if available, else local)
  if (typeof foundation === 'function') foundation(g, cx, baseY + 6, 56, {});
  // rocky mound — low, broad, FLAT-topped dome, irregular silhouette
  const maxH = 46;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(66 * Math.pow(1 - Math.pow(t, 3), 0.42));  // stays wide, flat top
    hw += Math.round((hash2(yy, 0, 95) - 0.5) * 6);   // rocky bumps
    if (yy > maxH - 6) hw = Math.max(hw, 10 - (maxH - yy) * 1.5);  // rounded flat cap
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 91);
      let c = RAMP.stone[1];
      if (xx < -hw + 6) c = RAMP.stone[0];          // moonlit left
      else if (xx > hw - 6) c = RAMP.stone[3];      // shadow right
      else if (h < 0.10) c = RAMP.stone[2];
      else if (h < 0.13) c = RAMP.stone[0];
      if (h < 0.02) c = RAMP.stone[3];
      P(g, cx + xx, top, c);
    }
  }
  // gold seams glinting across the rock
  const rng = mulberry(913);
  for (let s = 0; s < 7; s++) {
    let x = cx - 40 + Math.floor(rng() * 80), y = baseY - 8 - Math.floor(rng() * 46);
    const dx = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < 10 + Math.floor(rng() * 8); k++) {
      if (G(g, x, y)) { P(g, x, y, RAMP.gold[1]); if (rng() < 0.5) P(g, x, y + 1, RAMP.gold[2]); if (rng() < 0.3) P(g, x, y - 1, RAMP.gold[0]); }
      x += dx * (rng() < 0.4 ? 1 : 0) + (rng() < 0.3 ? 1 : 0); y += rng() < 0.5 ? 1 : -1;
    }
  }
  // timber-framed dark adit on the south face
  const ax = cx, abot = baseY, aw = 30, ah = 30;
  for (let j = 0; j < ah; j++) for (let i = -aw / 2; i <= aw / 2; i++) {
    const t = Math.abs(i) / (aw / 2);
    if (j < ah * 0.45 * t) continue;                // arched top
    P(g, ax + i, abot - j, RAMP.void);
  }
  // arch interior depth hint (dither toward lighter at top)
  for (let j = 0; j < 6; j++) for (let i = -aw / 2 + 3; i <= aw / 2 - 3; i++) if ((i + j) % 2 === 0 && Math.abs(i) < (aw / 2 - 3)) P(g, ax + i, abot - ah + 6 + j, RAMP.stone[3]);
  // timber frame (posts + lintel)
  for (let j = 0; j <= ah; j++) { fillRect(g, ax - aw / 2 - 3, abot - j, 3, 1, RAMP.dirt[1]); fillRect(g, ax + aw / 2, abot - j, 3, 1, RAMP.dirt[2]); }
  for (let i = -aw / 2 - 3; i <= aw / 2 + 3; i++) { const t = Math.abs(i) / (aw / 2 + 3); const ly = abot - ah - 2 + Math.round(t * 5); P(g, ax + i, ly, RAMP.dirt[1]); P(g, ax + i, ly - 1, RAMP.dirt[0]); P(g, ax + i, ly - 2, RAMP.dirt[3]); }
  // cross-brace
  for (let k = 0; k < aw + 6; k++) P(g, ax - aw / 2 - 3 + k, abot - ah + 2 + Math.round(Math.sin(k / (aw + 6) * Math.PI) * -2), RAMP.dirt[3]);
  // cart rails running out of the mouth (south, toward camera)
  for (let k = 0; k < 22; k++) {
    const ry = abot + k, spread = 4 + Math.floor(k * 0.5);
    P(g, ax - spread, ry, RAMP.stone[3]); P(g, ax - spread + 1, ry, RAMP.stone[2]);
    P(g, ax + spread, ry, RAMP.stone[3]); P(g, ax + spread - 1, ry, RAMP.stone[2]);
    if (k % 3 === 0) for (let i = -spread; i <= spread; i++) P(g, ax + i, ry, RAMP.dirt[3]); // tie
  }
  // a few raw ore chunks by the mouth
  [[ax - 22, abot + 2], [ax + 20, abot + 5]].forEach(([ox, oy]) => { P(g, ox, oy, RAMP.gold[1]); P(g, ox + 1, oy, RAMP.gold[2]); P(g, ox, oy - 1, RAMP.gold[0]); P(g, ox - 1, oy, RAMP.stone[2]); });
  // hung ember lantern by the entrance (on the left post)
  const lx = ax - aw / 2 - 6, ly = abot - ah + 6;
  P(g, lx + 2, ly - 4, RAMP.dirt[3]); for (let i = 0; i < 4; i++) P(g, lx + 2 + i, ly - 4, RAMP.dirt[3]);
  for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) { let c = RAMP.ember[1]; if (j === 0 || j === 7) c = RAMP.dirt[3]; else if (i <= -2) c = RAMP.ember[0]; else if (i >= 2) c = RAMP.ember[2]; P(g, lx + i, ly + j, c); }
  P(g, lx, ly + 3, RAMP.ember[0]);
  for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 4 && d < 8 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRIES ============================ */
const FLOORS = { floor_wood: 'wood', floor_stone: 'stone', floor_cave: 'cave' };

const WALLS = [
  // key, side, mat, variant
  ['wall_timber_nw', 'nw', 'timber', 'plain'], ['wall_timber_ne', 'ne', 'timber', 'plain'],
  ['wall_timber_window', 'nw', 'timber', 'window'], ['wall_timber_banner', 'nw', 'timber', 'banner'],
  ['wall_block_nw', 'nw', 'block', 'plain'], ['wall_block_ne', 'ne', 'block', 'plain'],
  ['wall_block_window', 'nw', 'block', 'window'], ['wall_block_banner', 'nw', 'block', 'banner'],
  ['wall_cave_nw', 'nw', 'cave', 'plain'], ['wall_cave_ne', 'ne', 'cave', 'plain'],
  ['wall_cave_seam', 'nw', 'cave', 'seam'], ['wall_cave_lantern', 'nw', 'cave', 'lantern'],
];

const FIX = {
  counter:    { fn: fxCounter,    cell: [48, 32], anchor: [24, 31] },
  shelf:      { fn: fxShelf,      cell: [40, 40], anchor: [20, 39] },
  table:      { fn: fxTable,      cell: [40, 32], anchor: [20, 31] },
  barrel:     { fn: fxBarrel,     cell: [20, 28], anchor: [10, 27] },
  cage:       { fn: fxCage,       cell: [26, 32], anchor: [13, 31] },
  anvil:      { fn: fxAnvil,      cell: [28, 24], anchor: [14, 23] },
  wheel_stand:{ fn: fxWheelStand, cell: [34, 40], anchor: [17, 39] },
  ore_cart:   { fn: fxOreCart,    cell: [36, 28], anchor: [18, 26] },
};

Object.assign(globalThis, {
  makeFloorTile, wallSegment, isoCuboid,
  fxCounter, fxShelf, fxTable, fxBarrel, fxVat, fxCage, fxAnvil, fxWheelStand, fxHearth, fxRug, fxGoldVein, fxOreCart,
  drawMine, FLOORS, WALLS, FIX, VAT_LIQUIDS,
});
