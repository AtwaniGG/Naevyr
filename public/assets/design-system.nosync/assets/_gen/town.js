// Naevyr TOWN SET — the Waystation. Eval after pixlib.js (+ tiles.js for hash2).
// Isometric 2:1 weathered frontier structures. Each house: south door + a warm
// lit window + a purpose sign/roof feature. Moonlit left, shadowed right. 1px
// void auto-outline, RAMP palette only, dithering not blur, deterministic.
// Houses: 144×152 cell, bottom-center anchor (72,151), top 6px kept clear.
// Shrine: 112×128 (3 flame frames). Pit: 240×120 flat, center anchor (120,60).

function rnd2(x, y, s) { return hash2(x, y, s || 0); }

// ---- packed-earth + stone foundation diamond (3×3-ish footprint, corners show)
function foundation(g, cx, topY, halfW, opt) {
  opt = opt || {};
  const dirt = RAMP.dirt, stone = RAMP.stone;
  const halfH = Math.round(halfW / 2);
  // top diamond surface (packed earth)
  for (let dy = -halfH; dy <= halfH; dy++) {
    const t = 1 - Math.abs(dy) / halfH;
    const w = Math.round(halfW * t);
    for (let dx = -w; dx <= w; dx++) {
      let c = dirt[1];
      if (dy < -halfH * 0.3 && dx < 0) c = dirt[0];          // moonlit back-left
      else if (dy > halfH * 0.3) c = dirt[2];                 // front shade
      if (rnd2(cx + dx, topY + dy, 3) < 0.06) c = dirt[2];
      P(g, cx + dx, topY + dy, c);
    }
  }
  // front rim (south faces) — 4px stone plinth height on the lower-front edges
  for (let dx = -halfW; dx <= halfW; dx++) {
    const t = 1 - Math.abs(dx) / halfW;
    const edgeY = topY + Math.round(halfH * t);
    for (let k = 1; k <= 4; k++) {
      let c = dx < 0 ? stone[1] : stone[2];
      if (k >= 3) c = stone[3];
      P(g, cx + dx, edgeY + k, c);
    }
  }
  // ash drifts against the front rim
  if (opt.ash !== false) {
    for (let i = 0; i < 14; i++) {
      const dx = -halfW + 6 + Math.floor(rnd2(i, cx, 7) * (halfW * 2 - 12));
      const t = 1 - Math.abs(dx) / halfW;
      const edgeY = topY + Math.round(halfH * t) + 4;
      const a = rnd2(i, cx, 8);
      if (a < 0.5) { P(g, cx + dx, edgeY, RAMP.bone[3]); if (a < 0.25) P(g, cx + dx, edgeY - 1, RAMP.bone[2]); }
    }
  }
  return { halfH };
}

// ---- front facade (south wall, camera-facing, moonlit-left)
function frontWall(g, x0, x1, ytop, ybot, ramp, seed, mat) {
  for (let x = x0; x <= x1; x++) {
    for (let y = ytop; y <= ybot; y++) {
      let c = ramp[1];
      if (x <= x0 + 1) c = ramp[0];
      else if (x >= x1 - 1) c = ramp[2];
      if (mat === 'timber') {           // horizontal plank seams
        if ((y - ytop) % 4 === 0) c = ramp[2];
        if (rnd2(x, y, seed) < 0.05) c = ramp[2];
      } else if (mat === 'plaster') {   // patchy plaster
        if (rnd2(x, y, seed) < 0.04) c = ramp[2];
        else if (rnd2(x, y, seed + 1) < 0.03) c = ramp[0];
      } else if (mat === 'block') {     // stone block courses
        if ((y - ytop) % 5 === 0) c = ramp[3];
        if ((x - x0 + (Math.floor((y - ytop) / 5) % 2) * 4) % 8 === 0) c = ramp[3];
      } else if (mat === 'log') {       // stacked log ends -> horizontal rounds
        const r = (y - ytop) % 5;
        if (r === 0) c = ramp[3]; else if (r === 1) c = ramp[0];
      }
      P(g, x, y, c);
    }
  }
}

// ---- right side wall (east face), recedes up-right by dep, in shadow
function rightWall(g, x1, ytop, ybot, dep, ramp, mat, seed) {
  for (let d = 1; d <= dep; d++) {
    const sx = x1 + d, yt = ytop - Math.floor(d / 2), yb = ybot - Math.floor(d / 2);
    for (let y = yt; y <= yb; y++) {
      let c = ramp[2];
      if (d >= dep - 1) c = ramp[3];
      if (mat === 'timber' && (y - yt) % 4 === 0) c = ramp[3];
      if (mat === 'block' && ((y - yt) % 5 === 0)) c = ramp[3];
      if (rnd2(sx, y, seed) < 0.05) c = ramp[3];
      P(g, sx, y, c);
    }
  }
}

// ---- gable roof: lit front triangle + shadowed right slope + eaves
function gableRoof(g, x0, x1, ytop, dep, roofH, ramp, opt) {
  opt = opt || {};
  const cx = (x0 + x1) / 2;
  const ov = opt.overhang == null ? 3 : opt.overhang;
  const gx0 = x0 - ov, gx1 = x1 + ov;
  // front gable triangle
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH;
    const hw = ((gx1 - gx0) / 2) * t;
    const yy = ytop - roofH + y;
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      let c = ramp[1];
      if (x <= cx - hw + 2) c = ramp[0];
      else if (x >= cx + hw - 1) c = ramp[2];
      if ((y) % 3 === 0) c = ramp[2];          // shingle rows
      P(g, x, yy, c);
    }
  }
  // ridge + right roof slope receding
  for (let d = 1; d <= dep + ov; d++) {
    const ys = Math.floor(d / 2);
    for (let y = 0; y <= roofH; y++) {
      const t = y / roofH;
      const x = Math.round(cx + d + (gx1 - cx) * t);
      const yy = Math.round(ytop - roofH - ys + y);
      let c = ramp[2];
      if (y % 3 === 0) c = ramp[3];
      if (d >= dep + ov - 1) c = ramp[3];
      P(g, x, yy, c);
    }
  }
  // ridge beam highlight
  for (let d = 0; d <= dep + ov; d++) P(g, Math.round(cx + d), ytop - roofH - Math.floor(d / 2), ramp[0]);
}

// ---- warm lit window (ember interior glow) with frame
function litWindow(g, x, y, w, h, opt) {
  opt = opt || {};
  const em = RAMP.ember, fr = opt.frame || RAMP.dirt;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = em[1];
    if (i === 0 || j === 0 || i === w - 1 || j === h - 1) c = em[0];
    if ((i + j) % 2 === 0 && rnd2(x + i, y + j, 12) < 0.3) c = em[0];
    P(g, x + i, y + j, c);
  }
  // frame + cross mullion
  for (let i = -1; i <= w; i++) { P(g, x + i, y - 1, fr[3]); P(g, x + i, y + h, fr[3]); }
  for (let j = -1; j <= h; j++) { P(g, x - 1, y + j, fr[3]); P(g, x + w, y + j, fr[3]); }
  if (!opt.noCross) {
    for (let j = 0; j < h; j++) P(g, x + (w >> 1) - (w > 5 ? 0 : 0), y + j, fr[3]);
    for (let i = 0; i < w; i++) P(g, x + i, y + (h >> 1), fr[3]);
  }
  // warm spill below the sill
  P(g, x, y + h + 1, em[2]); P(g, x + w - 1, y + h + 1, em[2]);
}

// ---- plank door on the south wall
function door(g, cx, ybot, w, h, ramp, opt) {
  opt = opt || {};
  const x0 = cx - (w >> 1);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = ramp[2];
    if (i === 0) c = ramp[1];
    if (i === w - 1) c = ramp[3];
    if (i % 2 === 1) c = ramp[3];                    // plank gaps
    P(g, x0 + i, ybot - h + j, c);
  }
  // frame
  for (let j = -1; j <= h; j++) { P(g, x0 - 1, ybot - h + j, ramp[3]); P(g, x0 + w, ybot - h + j, ramp[3]); }
  for (let i = -1; i <= w; i++) P(g, x0 + i, ybot - h - 1, opt.lintel || ramp[3]);
  // handle
  P(g, x0 + w - 2, ybot - (h >> 1), opt.handle || RAMP.gold[1]);
}

// ---- hanging sign board (post + chains + plate with a glyph)
function hangingSign(g, x, y, w, h, plate, glyphFn) {
  // bracket
  for (let i = 0; i < 6; i++) P(g, x - 1 + i, y - 2, RAMP.dirt[3]);
  P(g, x + 4, y - 2, RAMP.dirt[3]);
  // chains
  P(g, x + 1, y - 1, RAMP.bone[3]); P(g, x + w - 2, y - 1, RAMP.bone[3]);
  // plate
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = plate[1];
    if (i === 0 || j === 0) c = plate[0];
    if (i === w - 1 || j === h - 1) c = plate[3];
    P(g, x + i, y + j, c);
  }
  if (glyphFn) glyphFn(g, x, y, w, h);
}

function smoke(g, cx, topY) {
  const bn = RAMP.bone;
  let x = cx, y = topY;
  for (let k = 0; k < 10; k++) {
    P(g, x, y, bn[3]);
    if (k % 2 === 0) P(g, x + (k % 4 === 0 ? 1 : -1), y, bn[3]);
    y -= 1 + (k % 2); x += (k % 3 === 0 ? 1 : 0) * (k % 6 < 3 ? 1 : -1);
  }
}

function moss(g, x0, x1, y, ramp) {
  for (let x = x0; x <= x1; x++) if (rnd2(x, y, 15) < 0.4) { P(g, x, y, ramp[2]); if (rnd2(x, y, 16) < 0.4) P(g, x, y + 1, ramp[3]); }
}

/* ===================================================================== */
/* THE EIGHT STRUCTURES                                                  */
/* ===================================================================== */

// shared house frame; returns key coords for detailing
function houseShell(g, opt) {
  const cx = 72, baseY = opt.baseY || 130;
  foundation(g, cx, baseY + 8, opt.found == null ? 58 : opt.found, { ash: opt.ash });
  const fw = opt.fw || 64, fh = opt.fh || 56, dep = opt.dep || 26, roofH = opt.roofH || 22;
  const x0 = cx - (fw >> 1), x1 = cx + (fw >> 1), ytop = baseY - fh, ybot = baseY;
  rightWall(g, x1, ytop, ybot, dep, opt.wall, opt.mat, opt.seed || 1);
  frontWall(g, x0, x1, ytop, ybot, opt.wall, opt.seed || 1, opt.mat);
  if (opt.roof !== false) gableRoof(g, x0, x1, ytop, dep, roofH, opt.roofRamp || RAMP.dirt, { overhang: opt.overhang });
  return { cx, x0, x1, ytop, ybot, fw, fh, dep, roofH };
}

function drawDyeworks() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.bone, mat: 'plaster', roofRamp: RAMP.stone, fh: 60, fw: 66, seed: 21 });
  // GREAT colorful dye drips running down from the upper floor (signature)
  const dyes = [
    [RAMP.drift[2], RAMP.drift[1]], [RAMP.ember[1], RAMP.ember[0]], [RAMP.water[0], '#6fa8c8'],
    [RAMP.gold[1], RAMP.gold[0]], [RAMP.blood[1], RAMP.blood[0]], [RAMP.grass[1], RAMP.grass[0]],
  ];
  let ddx = s.x0 + 3;
  for (let i = 0; ddx < s.x1 - 2; i++) {
    const dark = dyes[i % dyes.length][0], lit = dyes[i % dyes.length][1];
    const w = 2 + (rnd2(i, 2, 9) < 0.4 ? 1 : 0);
    const len = 16 + Math.floor(rnd2(i, 3, 9) * 26);     // long runs: upper floor → mid wall
    fillRect(g, ddx, s.ytop + 3, w + 1, 3, dark);         // pooled source at the seam
    for (let k = 0; k < len; k++) {
      const yy = s.ytop + 4 + k, wob = Math.round(Math.sin(k * 0.35 + i) * 0.5);
      for (let c = 0; c < w; c++) P(g, ddx + c + wob, yy, c === 0 ? lit : dark);
      if (k > len - 4) P(g, ddx + (w >> 1) + wob, yy, dark);
    }
    P(g, ddx + (w >> 1), s.ytop + 4 + len, dark);          // bead
    ddx += w + 2 + Math.floor(rnd2(i, 5, 9) * 5);
  }
  // door + lit window
  door(g, s.cx - 12, s.ybot, 10, 22, RAMP.dirt);
  litWindow(g, s.cx + 6, s.ytop + 18, 9, 9);
  // steaming dye vats out front
  [[s.x0 + 2, s.ybot + 6, RAMP.drift], [s.x0 + 12, s.ybot + 9, RAMP.ember]].forEach(([vx, vy, r]) => {
    for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) { let c = RAMP.dirt[2]; if (i === 0) c = RAMP.dirt[1]; if (i === 7) c = RAMP.dirt[3]; if (j === 0) c = r[2]; P(g, vx + i, vy + j, c); }
    P(g, vx + 3, vy - 2, RAMP.bone[3]); P(g, vx + 4, vy - 4, RAMP.bone[3]); P(g, vx + 3, vy - 6, RAMP.bone[3]);
  });
  // drying cloth line (many colors)
  for (let i = 0; i < 7; i++) { const lx = s.x1 + 2 + i * 4; const col = dyes[i % dyes.length][0]; P(g, lx, s.ytop + 8, RAMP.bone[3]); for (let j = 0; j < 6; j++) P(g, lx, s.ytop + 9 + j, col); }
  for (let x = s.x1; x <= s.x1 + 30; x++) P(g, x, s.ytop + 7, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}

function drawVault() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.stone, mat: 'block', roof: false, fh: 64, fw: 72, dep: 30, found: 60, seed: 31 });
  // flat fortified parapet instead of gable
  for (let x = s.x0 - 2; x <= s.x1 + 2; x++) for (let y = s.ytop - 6; y < s.ytop; y++) { let c = RAMP.stone[1]; if (x < s.x0) c = RAMP.stone[0]; if (x > s.x1) c = RAMP.stone[2]; if ((x % 6) < 2 && y < s.ytop - 3) c = null; P(g, x, y, c || RAMP.stone[1]); if ((x % 6) < 2 && y < s.ytop - 3) g.d[y * g.w + x] = null; }
  // crenellations
  for (let x = s.x0 - 2; x <= s.x1 + 2; x += 6) for (let i = 0; i < 3; i++) for (let y = s.ytop - 9; y < s.ytop - 6; y++) P(g, x + i, y, RAMP.stone[2]);
  // top face receding
  for (let d = 1; d <= s.dep; d++) for (let x = s.x0 - 2; x <= s.x1 + 2; x++) P(g, x + d, s.ytop - 6 - Math.floor(d / 2), RAMP.stone[3]);
  // gold-trimmed reinforced door
  const dx = s.cx, db = s.ybot;
  for (let j = 0; j < 26; j++) for (let i = -7; i <= 7; i++) { let c = RAMP.stone[3]; if (i === -7) c = RAMP.gold[2]; if (i === 7) c = RAMP.gold[3]; if (Math.abs(i) === 4) c = RAMP.gold[3]; P(g, dx + i, db - 26 + j, c); }
  for (let i = -8; i <= 8; i++) P(g, dx + i, db - 27, RAMP.gold[1]);          // gold lintel
  for (let j = -27; j <= 0; j += 1) { P(g, dx - 8, db + j, RAMP.gold[2]); P(g, dx + 8, db + j, RAMP.gold[2]); }
  // big gold ring + seam
  P(g, dx, db - 13, RAMP.gold[0]); P(g, dx - 1, db - 13, RAMP.gold[1]); P(g, dx + 1, db - 13, RAMP.gold[1]); P(g, dx, db - 12, RAMP.gold[2]);
  // small barred lit window high up
  litWindow(g, s.cx - 6, s.ytop + 8, 5, 5, { noCross: true });
  for (let i = 0; i < 5; i++) P(g, s.cx - 6 + i, s.ytop + 10, RAMP.stone[3]);  // bars
  // gold seam coin emblem on wall
  P(g, s.x1 - 8, s.ytop + 22, RAMP.gold[0]); fillRect(g, s.x1 - 9, s.ytop + 21, 3, 3, RAMP.gold[1]); P(g, s.x1 - 8, s.ytop + 22, RAMP.gold[0]);
  outline(g, RAMP.void);
  return g;
}

function drawCasino() {
  const g = makeGrid(144, 152);
  foundation(g, 72, 138, 56, {});
  const cx = 72, baseY = 130, tw = 76, th = 64;
  const x0 = cx - (tw >> 1), x1 = cx + (tw >> 1), ytop = baseY - th;
  // tent body: blood-red & void-black vertical stripes, slightly crooked
  for (let x = x0; x <= x1; x++) {
    const stripe = Math.floor((x - x0) / 6) % 2;
    for (let y = ytop + 10; y <= baseY; y++) {
      const skew = Math.round((y - ytop) * 0.04);
      let c = stripe ? RAMP.blood[2] : RAMP.ash;
      if (x <= x0 + 1) c = stripe ? RAMP.blood[1] : RAMP.stone[2];
      else if (x >= x1 - 1) c = stripe ? RAMP.blood[3] : RAMP.void;
      P(g, x + skew, y, c);
    }
  }
  // peaked tent roof (scalloped)
  for (let x = x0 - 4; x <= x1 + 4; x++) {
    const d = Math.abs(x - cx);
    const yy = ytop + 10 - Math.round((1 - d / ((tw / 2) + 4)) * 26);
    const stripe = Math.floor((x - x0) / 6) % 2;
    for (let y = yy; y <= ytop + 11; y++) P(g, x, y, stripe ? RAMP.blood[1] : RAMP.ash);
  }
  // scalloped valance
  for (let x = x0 - 4; x <= x1 + 4; x += 4) { for (let i = 0; i < 3; i++) P(g, x + i, ytop + 11 + (i === 1 ? 2 : 1), RAMP.gold[1]); }
  // center pole flag
  for (let y = ytop - 22; y < ytop - 12; y++) P(g, cx, y, RAMP.dirt[3]);
  fillRect(g, cx + 1, ytop - 22, 6, 4, RAMP.blood[1]); P(g, cx + 6, ytop - 21, RAMP.blood[2]);
  // entrance flap (door) — open dark interior with tied-back curtains
  for (let j = 0; j < 26; j++) for (let i = -7; i <= 7; i++) {
    const t = Math.abs(i) / 7;
    if (j < 26 * t * 0.5) continue;                  // arched top
    P(g, cx + i, baseY - 26 + j + Math.round(t * 3), i <= -5 ? RAMP.blood[3] : i >= 5 ? RAMP.void : RAMP.void);
  }
  for (let i = -8; i <= 8; i++) P(g, cx + i, baseY - 26 + Math.round(Math.abs(i) / 8 * 3), RAMP.gold[2]); // arch trim
  // warm glow + a beckoning lantern just inside
  litWindow(g, cx - 3, baseY - 18, 5, 5, { noCross: true });
  // big multicolor prize wheel by the entrance
  const wx = x0 - 12, wy = baseY - 30;
  const seg = [RAMP.blood[1], RAMP.ember[1], RAMP.gold[1], RAMP.water[0], RAMP.drift[2], RAMP.moss ? RAMP.grass[1] : RAMP.grass[1]];
  for (let yy = -11; yy <= 11; yy++) for (let xx = -11; xx <= 11; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    if (d > 11) continue;
    if (d > 9) { P(g, wx + xx, wy + yy, RAMP.dirt[3]); continue; }
    const ang = (Math.atan2(yy, xx) + Math.PI) / (Math.PI * 2);
    P(g, wx + xx, wy + yy, seg[Math.floor(ang * 6) % 6]);
  }
  P(g, wx, wy, RAMP.bone[0]); P(g, wx + 1, wy - 9, RAMP.bone[0]);                 // hub + pointer
  for (let k = 0; k < 14; k++) P(g, wx - 11, wy - 11 + k, RAMP.dirt[3]);          // post
  // hanging coin-charms over entrance
  for (let x = x0 + 4; x <= x1 - 4; x += 6) { P(g, x, ytop + 12, RAMP.gold[2]); P(g, x, ytop + 14, RAMP.gold[1]); P(g, x, ytop + 15, RAMP.gold[2]); }
  // a warm lit slit window
  litWindow(g, x1 - 14, baseY - 30, 6, 7, { noCross: true });
  outline(g, RAMP.void);
  return g;
}

function drawTavern() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.dirt, mat: 'timber', roofRamp: RAMP.blood, fh: 56, fw: 66, seed: 41, overhang: 4 });
  // timber A-frame braces on facade
  for (let k = 0; k < s.fh; k++) { P(g, s.x0 + 2 + Math.round(k * 0.5), s.ybot - k, RAMP.dirt[3]); P(g, s.x1 - 2 - Math.round(k * 0.5), s.ybot - k, RAMP.dirt[3]); }
  for (let x = s.x0 + 4; x <= s.x1 - 4; x++) P(g, x, s.ytop + 22, RAMP.dirt[3]);   // mid beam
  // crooked chimney with smoke
  const chx = s.x1 - 6;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 6; i++) { let c = RAMP.stone[2]; if (i === 0) c = RAMP.stone[1]; if (i === 5) c = RAMP.stone[3]; if (j % 4 === 0) c = RAMP.stone[3]; P(g, chx + i + Math.round(j * 0.15), s.ytop - 18 + j, c); }
  smoke(g, chx + 3, s.ytop - 19);
  // several glowing windows
  litWindow(g, s.cx - 18, s.ytop + 16, 8, 8);
  litWindow(g, s.cx + 10, s.ytop + 16, 8, 8);
  litWindow(g, s.cx - 4, s.ytop + 30, 7, 7, { noCross: true });
  // door (open, warm spill)
  door(g, s.cx, s.ybot, 12, 24, RAMP.dirt, { handle: RAMP.gold[0] });
  for (let j = 0; j < 22; j++) for (let i = -2; i <= 2; i++) if (rnd2(i, j, 17) < 0.5) P(g, s.cx + i, s.ybot - 22 + j, RAMP.ember[2]);
  // big ember lantern over the door
  const lx = s.cx, ly = s.ytop + 40;
  P(g, lx, ly - 3, RAMP.dirt[3]);
  for (let j = 0; j < 7; j++) for (let i = -3; i <= 3; i++) { const t = Math.abs(i) / 3; let c = RAMP.ember[1]; if (j === 0 || j === 6) c = RAMP.dirt[3]; else if (i <= -2) c = RAMP.ember[0]; else if (i >= 2) c = RAMP.ember[2]; if (t > 0.9 && (j === 1 || j === 5)) c = RAMP.dirt[3]; P(g, lx + i, ly + j, c); }
  P(g, lx, ly + 3, RAMP.ember[0]);
  // glow halo (dither)
  for (let yy = -5; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 5 && d < 9 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]); }
  // barrels outside
  [[s.x0 - 8, s.ybot + 4], [s.x0 - 1, s.ybot + 8]].forEach(([bx, by]) => {
    for (let j = 0; j < 10; j++) for (let i = 0; i < 8; i++) { const t = Math.abs(i - 3.5) / 4; let c = RAMP.dirt[1]; if (i === 0) c = RAMP.dirt[0]; if (i >= 6) c = RAMP.dirt[2]; if (j === 0 || j === 9 || j === 4) c = RAMP.dirt[3]; if (t > 0.85) c = RAMP.dirt[3]; P(g, bx + i, by + j, c); }
  });
  // hanging tavern sign (lantern glyph)
  hangingSign(g, s.x1 + 4, s.ytop + 26, 12, 9, RAMP.dirt, (gg, x, y, w, h) => {
    fillRect(gg, x + 4, y + 2, 4, 5, RAMP.ember[1]); P(gg, x + 5, y + 1, RAMP.ember[0]); P(gg, x + 5, y + 7, RAMP.ember[0]);
  });
  outline(g, RAMP.void);
  return g;
}

function drawFurnisher() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.dirt, mat: 'log', roofRamp: RAMP.stone, fh: 54, fw: 60, seed: 51 });
  // log-end texture already in wall; door + lit window
  door(g, s.cx + 8, s.ybot, 11, 22, RAMP.dirt);
  litWindow(g, s.cx - 12, s.ytop + 16, 9, 9);
  // lean-to awning over a workbench (left side)
  const ax0 = s.x0 - 26, ax1 = s.x0 + 2, ay = s.ytop + 20;
  for (let x = ax0; x <= ax1; x++) { const yy = ay + Math.round((x - ax0) * 0.4); for (let k = 0; k < 2; k++) P(g, x, yy + k, k ? RAMP.dirt[3] : RAMP.dirt[2]); }
  for (let k = 0; k < 18; k++) { P(g, ax0, ay + 1 + k, RAMP.dirt[3]); P(g, ax0 + 1, ay + 1 + k, RAMP.dirt[2]); } // post
  // workbench
  const wbx = ax0 + 4, wby = s.ybot - 4;
  for (let i = 0; i < 20; i++) P(g, wbx + i, wby, RAMP.dirt[1]);
  for (let i = 0; i < 20; i++) P(g, wbx + i, wby + 1, RAMP.dirt[3]);
  P(g, wbx + 1, wby + 2, RAMP.dirt[3]); P(g, wbx + 1, wby + 3, RAMP.dirt[3]); P(g, wbx + 18, wby + 2, RAMP.dirt[3]); P(g, wbx + 18, wby + 3, RAMP.dirt[3]);
  // a half-built chair on the bench + saw
  fillRect(g, wbx + 4, wby - 5, 2, 5, RAMP.dirt[2]); fillRect(g, wbx + 4, wby - 5, 5, 2, RAMP.dirt[1]); P(g, wbx + 8, wby - 5, RAMP.dirt[2]);
  for (let i = 0; i < 6; i++) P(g, wbx + 11 + i, wby - 2, RAMP.bone[1]);  // saw blade
  P(g, wbx + 17, wby - 3, RAMP.dirt[3]);
  // sawdust
  for (let i = 0; i < 12; i++) if (rnd2(i, 5, 18) < 0.6) P(g, wbx + 2 + i, s.ybot + 1 + (i % 2), RAMP.gold[2]);
  // stacked crates + planks (right)
  const px = s.x1 + 4;
  for (let c = 0; c < 2; c++) for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) { let col = RAMP.dirt[1]; if (i === 0) col = RAMP.dirt[0]; if (i === 8) col = RAMP.dirt[2]; if (j === 0 || j === 8 || i === 0 || i === 8) col = RAMP.dirt[3]; if (i === j || i === 8 - j) col = RAMP.dirt[2]; P(g, px + c * 10, s.ybot - 9 - (c ? 9 : 0) + j, col); P(g, px + c * 10 + i, s.ybot - 9 - (c ? 9 : 0) + j, col); }
  for (let i = 0; i < 12; i++) { P(g, px - 2, s.ybot - 2 - i * 0, RAMP.dirt[2]); } // (planks leaning)
  for (let k = 0; k < 14; k++) { P(g, px + 18 + Math.round(k * 0.2), s.ybot - k, RAMP.dirt[1]); P(g, px + 19 + Math.round(k * 0.2), s.ybot - k, RAMP.dirt[3]); }
  // small wares banner + lamp out front
  hangingSign(g, s.x1 + 2, s.ytop + 24, 11, 8, RAMP.dirt, (gg, x, y, w, h) => {
    fillRect(gg, x + 3, y + 2, 5, 2, RAMP.dirt[1]); P(gg, x + 4, y + 4, RAMP.dirt[2]); P(gg, x + 6, y + 4, RAMP.dirt[2]); // chair glyph
  });
  outline(g, RAMP.void);
  return g;
}

function drawMenagerie() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.dirt, mat: 'timber', roofRamp: RAMP.water, fh: 56, fw: 62, seed: 61 });
  // door + lit window
  door(g, s.cx, s.ybot, 11, 22, RAMP.dirt);
  litWindow(g, s.cx - 18, s.ytop + 30, 7, 7, { noCross: true });
  // cages built onto facade
  function cage(x, y, w, h, content) {
    for (let i = -1; i <= w; i++) { P(g, x + i, y - 1, RAMP.stone[3]); P(g, x + i, y + h, RAMP.stone[3]); }
    for (let j = -1; j <= h; j++) { P(g, x - 1, y + j, RAMP.stone[3]); P(g, x + w, y + j, RAMP.stone[3]); }
    for (let i = 0; i < w; i += 2) for (let j = 0; j < h; j++) P(g, x + i, y + j, RAMP.stone[2]);  // bars
    content(x, y, w, h);
  }
  // glowing wisp in a cage (left)
  cage(s.x0 + 4, s.ytop + 16, 10, 12, (x, y, w, h) => {
    const wx = x + 5, wy = y + 7;
    P(g, wx, wy, RAMP.drift[0]); P(g, wx - 1, wy, RAMP.drift[1]); P(g, wx + 1, wy, RAMP.drift[1]); P(g, wx, wy - 1, RAMP.drift[1]); P(g, wx, wy + 1, RAMP.drift[2]);
    for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy) % 2 === 0) P(g, wx + xx, wy + yy, RAMP.drift[2]);
  });
  // empty perch cage (right)
  cage(s.x1 - 14, s.ytop + 18, 10, 12, (x, y, w, h) => {
    for (let i = 2; i < w - 2; i++) P(g, x + i, y + h - 3, RAMP.dirt[3]);     // perch
    P(g, x + 4, y + h - 4, RAMP.gold[2]);                                      // seed
  });
  // perched black bird on the roofline (clear silhouette)
  const bx = s.cx + 2, by = s.ytop - s.roofH - 4;
  fillRect(g, bx, by + 1, 5, 3, RAMP.void);            // body
  fillRect(g, bx + 5, by + 2, 3, 1, RAMP.void);        // tail
  P(g, bx + 1, by, RAMP.void); P(g, bx + 1, by - 1, RAMP.void);  // raised head
  P(g, bx + 2, by - 1, RAMP.void);
  P(g, bx, by, RAMP.drift[1]);                          // drift eye glint
  P(g, bx + 1, by + 4, RAMP.gold[2]); P(g, bx + 3, by + 4, RAMP.gold[2]);  // legs
  for (let k = 0; k < 3; k++) P(g, bx + 5 + k, by + 1 - k, RAMP.void); // tail upsweep
  // drift-purple accents on eaves
  for (let x = s.x0 - 3; x <= s.x1 + 3; x += 5) P(g, x, s.ytop + 1, RAMP.drift[2]);
  // sign (paw/feather glyph)
  hangingSign(g, s.x1 + 2, s.ytop + 30, 11, 8, RAMP.water, (gg, x, y, w, h) => {
    P(gg, x + 5, y + 2, RAMP.bone[1]); P(gg, x + 4, y + 4, RAMP.bone[1]); P(gg, x + 6, y + 4, RAMP.bone[1]); P(gg, x + 5, y + 5, RAMP.bone[2]);
  });
  outline(g, RAMP.void);
  return g;
}

// ---- SHRINE (not a house): stepped dais + cracked altar + Pale Flame (3 frames)
function drawShrine(frame) {
  frame = frame || 0;
  const g = makeGrid(112, 128);
  const cx = 56, baseY = 116;
  // scorch marks on ground
  for (let i = 0; i < 26; i++) { const a = rnd2(i, frame, 19); const x = cx - 30 + Math.floor(rnd2(i, 1, 19) * 60); const y = baseY + 2 + Math.floor(rnd2(i, 2, 19) * 6); if (a < 0.5) P(g, x, y, RAMP.void); else if (a < 0.7) P(g, x, y, RAMP.ash); }
  // stepped stone dais (3 tiers, iso)
  for (let t = 0; t < 3; t++) {
    const hw = 38 - t * 8, ty = baseY - t * 8, hh = Math.round(hw / 2);
    for (let dy = -hh; dy <= hh; dy++) {
      const k = 1 - Math.abs(dy) / hh, w = Math.round(hw * k);
      for (let dx = -w; dx <= w; dx++) { let c = RAMP.stone[1]; if (dy < 0 && dx < 0) c = RAMP.stone[0]; else if (dy > 0) c = RAMP.stone[2]; if (rnd2(cx + dx, ty + dy, 20) < 0.05) c = RAMP.stone[2]; P(g, cx + dx, ty + dy, c); }
    }
    for (let dx = -hw; dx <= hw; dx++) { const k = 1 - Math.abs(dx) / hw; const ey = ty + Math.round(hh * k); for (let s2 = 1; s2 <= 4; s2++) P(g, cx + dx, ey + s2, s2 < 3 ? RAMP.stone[2] : RAMP.stone[3]); }
  }
  // cracked altar block
  const ay = baseY - 30;
  for (let j = 0; j < 12; j++) for (let i = -10; i <= 10; i++) { let c = RAMP.stone[1]; if (i < -7) c = RAMP.stone[0]; if (i > 7) c = RAMP.stone[2]; if (j === 0) c = RAMP.stone[0]; if (j > 9) c = RAMP.stone[3]; P(g, cx + i, ay + j, c); }
  // crack
  for (let j = 0; j < 12; j++) P(g, cx + 2 + Math.round(Math.sin(j) * 1.5), ay + j, RAMP.stone[3]);
  // votive candles
  [[cx - 14, baseY - 16], [cx + 14, baseY - 16], [cx - 20, baseY - 6], [cx + 20, baseY - 6]].forEach(([vx, vy], i) => {
    P(g, vx, vy, RAMP.bone[1]); P(g, vx, vy + 1, RAMP.bone[2]); P(g, vx, vy - 1, RAMP.ember[(frame + i) % 2 ? 1 : 0]);
  });
  // THE PALE FLAME — bone-white fire, drift-purple core, flicker per frame
  const fx = cx, fy = ay - 2;
  const sway = [0, 1, -1][frame], tall = [0, 1, 2][frame];
  // outer bone flame
  for (let yy = 0; yy <= 14 + tall; yy++) {
    const t = yy / (14 + tall);
    const hw = Math.round((1 - t) * 6 * (1 - t * 0.2)) + (yy < 3 ? 1 : 0);
    const sx = fx + Math.round(Math.sin(yy * 0.5 + frame) * 1.2) + Math.round(sway * t * 2);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = RAMP.bone[0];
      if (Math.abs(xx) >= hw - 1) c = RAMP.bone[1];
      if (Math.abs(xx) >= hw) c = RAMP.drift[1];
      P(g, sx + xx, fy - yy, c);
    }
  }
  // drift-purple core
  for (let yy = 1; yy <= 8 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (9 + tall)) * 3)); const sx = fx + Math.round(sway * (yy / 10)); for (let xx = -hw; xx <= hw; xx++) P(g, sx + xx, fy - yy - 1, Math.abs(xx) === 0 ? RAMP.drift[0] : RAMP.drift[2]); }
  // rising mote sparks
  for (let i = 0; i < 4; i++) { const a = (frame + i) % 3; if (a < 2) P(g, fx - 3 + i * 2, fy - 14 - i * 2 - tall, i % 2 ? RAMP.drift[1] : RAMP.bone[0]); }
  // pale glow halo (dither)
  for (let yy = -12; yy <= 4; yy++) for (let xx = -10; xx <= 10; xx++) { const d = Math.abs(xx) + Math.abs(yy * 1.3); if (d > 8 && d < 12 && (xx + yy + frame) % 2 === 0) P(g, fx + xx, fy - 6 + yy, RAMP.drift[2]); }
  outline(g, RAMP.void);
  return g;
}

// ---- THE PIT (not a house): flat arena ring, center-anchored, drawn UNDER entities
function drawPit() {
  const g = makeGrid(240, 120);
  const cx = 120, cy = 60, RX = 108, RY = 54;
  // packed-sand floor (iso ellipse)
  for (let y = -RY; y <= RY; y++) for (let x = -RX; x <= RX; x++) {
    const d = (x / RX) ** 2 + (y / RY) ** 2; if (d > 1) continue;
    let c = RAMP.dirt[1];
    if (d > 0.82) c = RAMP.dirt[3];                       // worn rim
    else if (d > 0.6) c = RAMP.dirt[2];
    if (rnd2(cx + x, cy + y, 22) < 0.05) c = RAMP.dirt[2];
    if (rnd2(cx + x, cy + y, 23) < 0.02) c = RAMP.dirt[0];
    P(g, cx + x, cy + y, c);
  }
  // old bloodstains
  for (let i = 0; i < 7; i++) {
    const bx = cx + Math.floor((rnd2(i, 1, 24) - 0.5) * RX * 1.2);
    const by = cy + Math.floor((rnd2(i, 2, 24) - 0.5) * RY * 1.2);
    if ((bx - cx) ** 2 / RX ** 2 + (by - cy) ** 2 / RY ** 2 > 0.7) continue;
    for (let yy = -3; yy <= 3; yy++) for (let xx = -4; xx <= 4; xx++) { if (rnd2(bx + xx, by + yy, 25) < 0.45 && xx * xx + yy * yy < 14) P(g, bx + xx, by + yy, RAMP.blood[3]); }
  }
  // ten weathered standing stones around the rim, drift-touched tips
  const N = 10;
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(ang) * RX * 0.96);
    const sy = Math.round(cy + Math.sin(ang) * RY * 0.96);
    const h = 16 + Math.floor(rnd2(i, 3, 26) * 8);
    const w = 4 + Math.floor(rnd2(i, 4, 26) * 2);
    for (let j = 0; j < h; j++) for (let k = -w; k <= w; k++) {
      const t = j / h; const ww = Math.round(w * (1 - t * 0.3));
      if (Math.abs(k) > ww) continue;
      let c = RAMP.stone[1]; if (k < -ww + 1) c = RAMP.stone[0]; if (k > ww - 1) c = RAMP.stone[3];
      if (rnd2(sx + k, sy - j, 27) < 0.08) c = RAMP.stone[2];
      P(g, sx + k, sy - j, c);
    }
    // drift-touched tip
    for (let k = -w + 1; k <= w - 1; k++) P(g, sx + k, sy - h, RAMP.drift[2]);
    P(g, sx, sy - h - 1, RAMP.drift[1]); if (i % 2) P(g, sx, sy - h - 2, RAMP.drift[0]);
    // base shadow
    for (let k = -w - 1; k <= w + 1; k++) P(g, sx + k, sy + 1, RAMP.void);
    // half-buried skull at some rims
    if (i % 3 === 0) { const kx = sx + 5, ky = sy + 2; fillRect(g, kx, ky, 4, 3, RAMP.bone[1]); P(g, kx + 1, ky + 1, RAMP.void); P(g, kx + 3, ky + 1, RAMP.void); P(g, kx + 1, ky + 3, RAMP.bone[2]); }
  }
  // sagging rope/chain between some stones
  for (let i = 0; i < N; i++) {
    if (i % 2) continue;
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * RX * 0.96, y0 = cy + Math.sin(a0) * RY * 0.96;
    const x1 = cx + Math.cos(a1) * RX * 0.96, y1 = cy + Math.sin(a1) * RY * 0.96;
    for (let t = 0; t <= 1; t += 0.06) {
      const x = Math.round(x0 + (x1 - x0) * t);
      const sag = Math.sin(t * Math.PI) * 5;
      const y = Math.round(y0 + (y1 - y0) * t - 14 + sag);
      P(g, x, y, RAMP.dirt[3]); if (Math.floor(t * 16) % 2 === 0) P(g, x, y, RAMP.stone[3]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

const TOWN = {
  dyeworks:  { fn: drawDyeworks,  cell: [144, 152], anchor: [72, 151] },
  vault:     { fn: drawVault,     cell: [144, 152], anchor: [72, 151] },
  casino:    { fn: drawCasino,    cell: [144, 152], anchor: [72, 151] },
  tavern:    { fn: drawTavern,    cell: [144, 152], anchor: [72, 151] },
  furnisher: { fn: drawFurnisher, cell: [144, 152], anchor: [72, 151] },
  menagerie: { fn: drawMenagerie, cell: [144, 152], anchor: [72, 151] },
  shrine:    { fn: drawShrine,    cell: [112, 128], anchor: [56, 127], frames: 3 },
  pit:       { fn: drawPit,       cell: [240, 120], anchor: [120, 60], under: true },
};

Object.assign(globalThis, {
  rnd2, foundation, frontWall, rightWall, gableRoof, litWindow, door, hangingSign, smoke, moss,
  houseShell, drawDyeworks, drawVault, drawCasino, drawTavern, drawFurnisher, drawMenagerie, drawShrine, drawPit,
  TOWN,
});
