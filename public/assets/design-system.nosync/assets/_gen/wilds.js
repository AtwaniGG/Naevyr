// DriftLands THE WILDS PACK — eval after pixlib.js + tiles.js (+ town.js for
// foundation, interiors.js for wallSegment). Rect-grid, RAMP only, 1px void
// auto-outline, dither not blur, deterministic. Moonlit-left/shadowed-right.
// Top 6px of every cell kept clear for labels.

// branching drift vein walk across a mass
function driftVeins(g, x0, y0, count, len, seed) {
  const dr = RAMP.drift, rng = mulberry(seed);
  for (let v = 0; v < count; v++) {
    let x = x0 + Math.floor((rng() - 0.5) * 40), y = y0 + Math.floor((rng() - 0.5) * 24);
    let dx = rng() < 0.5 ? 1 : -1, dy = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < len; k++) {
      if (G(g, x, y)) {
        P(g, x, y, k % 7 === 0 ? dr[1] : dr[2]);
        if (rng() < 0.4) P(g, x, y + 1, dr[3]);
        if (k % 9 === 0) P(g, x, y - 1, dr[0]);     // glowing node
      }
      x += dx * (rng() < 0.6 ? 1 : 0); y += dy * (rng() < 0.5 ? 1 : 0);
      if (rng() < 0.15) dx = -dx; if (rng() < 0.12) dy = -dy;
    }
  }
}

function boneSpikeShape(g, bx, by, h, lean) {
  const bn = RAMP.bone;
  for (let k = 0; k < h; k++) {
    const t = k / h, w = Math.max(0, Math.round((1 - t) * 2));
    const sx = bx + Math.round(lean * t * 3);
    for (let i = -w; i <= w; i++) P(g, sx + i, by - k, i < 0 ? bn[0] : i > 0 ? bn[2] : bn[1]);
  }
  P(g, bx, by - h, bn[0]);
}

/* ============================ 1 · HUSK DEN (120×88, 2 frames) ============================ */
function drawHuskDen(frame) {
  frame = frame || 0;
  const g = makeGrid(120, 88);
  const cx = 60, baseY = 78;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 4, 50, { ash: true });
  // low corrupted burrow-mound
  const maxH = 46;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(52 * Math.pow(1 - Math.pow(t, 2.6), 0.5));
    hw += Math.round((hash2(yy, 0, 101) - 0.5) * 6);
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 102);
      let c = RAMP.stone[1];
      if (xx < -hw + 5) c = RAMP.stone[0];
      else if (xx > hw - 5) c = RAMP.stone[3];
      else if (h < 0.10) c = RAMP.stone[2];
      else if (h < 0.13) c = RAMP.stone[0];
      P(g, cx + xx, top, c);
    }
  }
  // drift-purple veining
  driftVeins(g, cx, baseY - 26, 5, 60, 103);
  // dark arched burrow mouth (south)
  const mw = 22, mh = 26;
  for (let j = 0; j < mh; j++) for (let i = -mw / 2; i <= mw / 2; i++) {
    const t = Math.abs(i) / (mw / 2);
    if (j < mh * 0.5 * t) continue;
    P(g, cx + i, baseY - j, RAMP.void);
  }
  // faint drift-glow eyes inside
  const bright = frame === 1;
  const ey = baseY - 14;
  [[-5, bright ? RAMP.drift[0] : RAMP.drift[2]], [5, bright ? RAMP.drift[1] : RAMP.drift[3]]].forEach(([ox, c]) => {
    P(g, cx + ox, ey, c); P(g, cx + ox + 1, ey, c);
    P(g, cx + ox, ey + 1, bright ? RAMP.drift[2] : RAMP.drift[3]);
    if (bright) { P(g, cx + ox, ey - 1, RAMP.drift[2]); P(g, cx + ox + 2, ey, RAMP.drift[3]); P(g, cx + ox - 1, ey, RAMP.drift[3]); }
  });
  // ringed bone spikes jutting out
  [[-44, 6, -0.6], [-30, 9, -0.3], [34, 9, 0.3], [46, 6, 0.6], [-16, 5, -0.2], [20, 6, 0.2]].forEach(([ox, h, ln]) => {
    const bx = cx + ox, by = baseY - Math.max(0, Math.round(46 * Math.pow(1 - Math.pow(Math.min(0.99, Math.abs(ox) / 52), 2.6), 0.5)) * 0.2) + 2;
    boneSpikeShape(g, bx, baseY + 1, h + 6, ln);
  });
  // scattered ribs at the base
  const rng = mulberry(104);
  for (let i = 0; i < 5; i++) {
    const rx = cx - 40 + Math.floor(rng() * 80), ry = baseY + 2 + Math.floor(rng() * 4);
    for (let k = 0; k < 5; k++) P(g, rx + k, ry - Math.round(Math.sin(k / 5 * Math.PI) * 2), RAMP.bone[2]);
    P(g, rx, ry, RAMP.bone[1]); P(g, rx + 5, ry, RAMP.bone[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · ASH OBELISK (64×112, 3 frames) ============================ */
function drawAshObelisk(frame) {
  frame = frame || 0;
  const g = makeGrid(64, 112);
  const cx = 32, baseY = 104;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 2, 30, { ash: true });
  // tapered monolith
  const topY = 14;
  for (let y = baseY; y >= topY; y--) {
    const t = (baseY - y) / (baseY - topY);
    const hw = Math.round(13 - t * 5);
    const skew = Math.round(t * 2);                 // slight lean
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x + skew;
      let c = RAMP.stone[1];
      if (x < -hw + 2) c = RAMP.stone[0];
      else if (x > hw - 2) c = RAMP.stone[3];
      if (hash2(sx, y, 111) < 0.06) c = RAMP.stone[2];
      if (hash2(sx, y, 112) < 0.02) c = RAMP.stone[3];   // cracks
      P(g, sx, y, c);
    }
  }
  // weathered chips off the edges
  const rng = mulberry(113);
  for (let i = 0; i < 8; i++) { const y = topY + 6 + Math.floor(rng() * (baseY - topY - 12)); const side = rng() < 0.5 ? -1 : 1; const t = (baseY - y) / (baseY - topY); const hw = Math.round(13 - t * 5); P(g, cx + side * hw + Math.round(t * 2), y, RAMP.void); P(g, cx + side * (hw - 1) + Math.round(t * 2), y, RAMP.stone[3]); }
  // glowing drift runes down the south face (pulse by frame)
  const lit = [RAMP.drift[2], RAMP.drift[1], RAMP.drift[0]][frame];
  const dim = [RAMP.drift[3], RAMP.drift[2], RAMP.drift[1]][frame];
  const runes = [[0, 30], [-1, 44], [1, 58], [0, 72], [-1, 86]];
  runes.forEach(([ox, ry], i) => {
    const t = (baseY - (baseY - ry)) / (baseY - topY);
    const skew = Math.round(((ry) / (baseY - topY)) * 0);
    const rx = cx + ox;
    const yy = baseY - ry;
    // a small angular rune glyph
    const on = ((frame + i) % 3) !== 2;
    const col = on ? lit : dim;
    P(g, rx, yy, col); P(g, rx - 1, yy + 1, col); P(g, rx + 1, yy + 1, col); P(g, rx, yy + 2, col);
    P(g, rx - 1, yy - 1, on ? dim : RAMP.drift[3]); P(g, rx + 1, yy - 1, on ? dim : RAMP.drift[3]);
  });
  // drift-crystal shard crown
  const cty = topY - 1;
  for (let k = 0; k < 12; k++) {
    const w = Math.max(0, Math.round((1 - k / 12) * 4));
    for (let i = -w; i <= w; i++) { let c = RAMP.drift[2]; if (i < 0) c = RAMP.drift[1]; if (i > 0) c = RAMP.drift[3]; if (i === 0 && k < 8) c = RAMP.drift[0]; P(g, cx + i, cty - k, c); }
  }
  P(g, cx, cty - 12, RAMP.drift[0]);
  // crown glow halo (dither, pulses)
  if (frame >= 1) for (let yy = -10; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 5 && d < (frame === 2 ? 9 : 7) && (xx + yy) % 2 === 0) P(g, cx + xx, cty - 6 + yy, RAMP.drift[2]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · MIREWIFE HUT (120×116) ============================ */
function drawMirewifeHut() {
  const g = makeGrid(120, 116);
  const cx = 58, baseY = 108;
  // boggy ground (water + dirt iso patch)
  for (let yy = -16; yy <= 16; yy++) for (let xx = -54; xx <= 54; xx++) {
    if ((xx / 54) ** 2 + (yy / 16) ** 2 > 1) continue;
    const h = hash2(cx + xx, baseY + yy, 121);
    let c = RAMP.dirt[2];
    if (h < 0.3) c = RAMP.water[2]; else if (h < 0.36) c = RAMP.water[1];
    if (h > 0.93) c = RAMP.grass[2];
    P(g, cx + xx, baseY + yy, c);
  }
  // reed tufts in the bog
  for (let i = 0; i < 8; i++) { const rx = cx - 46 + Math.floor(hash2(i, 1, 122) * 92), ry = baseY + Math.floor((hash2(i, 2, 122) - 0.5) * 22); for (let k = 0; k < 4; k++) P(g, rx, ry - k, RAMP.grass[k > 2 ? 2 : 1]); P(g, rx, ry - 4, RAMP.bone[2]); }

  const lean = -1; // crooked
  // stilts lifting the hut
  const liftTop = baseY - 26;
  [-26, -10, 10, 26].forEach((ox, i) => {
    const sx = cx + ox; const ly = baseY + (i % 2 ? 4 : 2);
    for (let y = liftTop; y <= ly; y++) { const skew = Math.round((y - liftTop) * 0.0); P(g, sx + skew, y, RAMP.dirt[2]); P(g, sx + 1 + skew, y, RAMP.dirt[3]); }
    // cross-brace
    P(g, sx, liftTop + 8, RAMP.dirt[3]);
  });
  // hut body (leaning)
  const fw = 60, fh = 38, x0 = cx - fw / 2, ytop = liftTop - fh, ybot = liftTop;
  for (let y = ytop; y <= ybot; y++) {
    const sk = Math.round((ybot - y) / fh * lean * 4);
    for (let x = x0; x <= x0 + fw; x++) {
      let c = RAMP.dirt[1];
      if (x <= x0 + 2) c = RAMP.dirt[0]; else if (x >= x0 + fw - 2) c = RAMP.dirt[2];
      if ((y - ytop) % 4 === 0) c = RAMP.dirt[3];        // plank seams
      if (hash2(x, y, 123) < 0.05) c = RAMP.dirt[2];
      P(g, x + sk, y, c);
    }
  }
  // right side wall (shadow), receding
  for (let d = 1; d <= 22; d++) for (let y = ytop; y <= ybot; y++) P(g, x0 + fw + d, y - Math.floor(d / 2), d >= 21 ? RAMP.dirt[3] : RAMP.dirt[2]);
  // mossy reed-thatch roof (gable, overhang)
  const ov = 6, roofH = 22, gx0 = x0 - ov, gx1 = x0 + fw + ov, rcx = (gx0 + gx1) / 2;
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH, hw = ((gx1 - gx0) / 2) * t;
    const yy = ytop - roofH + y + Math.round((ybot - (ytop - roofH + y)) / fh * lean * 2);
    for (let x = Math.round(rcx - hw); x <= Math.round(rcx + hw); x++) {
      let c = RAMP.grass[2];
      if (x <= rcx - hw + 2) c = RAMP.grass[1];
      else if (x >= rcx + hw - 1) c = RAMP.grass[3];
      if (y % 3 === 0) c = RAMP.dirt[3];                 // thatch rows
      if (hash2(x, y, 124) < 0.12) c = RAMP.grass[3];    // moss patches
      else if (hash2(x, y, 125) < 0.06) c = RAMP.grass[0];
      P(g, x, yy, c);
    }
  }
  // roof right slope receding
  for (let d = 1; d <= 22 + ov; d++) { const ys = Math.floor(d / 2); for (let y = 0; y <= roofH; y++) { const t = y / roofH; const x = Math.round(rcx + d + (gx1 - rcx) * t); const yy = Math.round(ytop - roofH - ys + y); P(g, x, yy, y % 3 === 0 ? RAMP.dirt[3] : RAMP.grass[3]); } }
  // ridge
  for (let d = 0; d <= 22 + ov; d++) P(g, Math.round(rcx + d), ytop - roofH - Math.floor(d / 2), RAMP.grass[1]);
  // warm lit window
  const wx = cx - 6, wy = ytop + 12;
  for (let j = 0; j < 11; j++) for (let i = 0; i < 11; i++) { let c = RAMP.ember[1]; if (i === 0 || j === 0 || i === 10 || j === 10) c = RAMP.ember[0]; if ((i + j) % 2 === 0 && hash2(i, j, 126) < 0.3) c = RAMP.ember[0]; P(g, wx + i, wy + j, c); }
  for (let i = -1; i <= 11; i++) { P(g, wx + i, wy - 1, RAMP.dirt[3]); P(g, wx + i, wy + 11, RAMP.dirt[3]); }
  for (let j = -1; j <= 11; j++) { P(g, wx - 1, wy + j, RAMP.dirt[3]); P(g, wx + 11, wy + j, RAMP.dirt[3]); }
  for (let j = 0; j < 11; j++) P(g, wx + 5, wy + j, RAMP.dirt[3]); for (let i = 0; i < 11; i++) P(g, wx + i, wy + 5, RAMP.dirt[3]);
  // door
  for (let j = 0; j < 18; j++) for (let i = 0; i < 9; i++) { let c = RAMP.dirt[2]; if (i % 2) c = RAMP.dirt[3]; if (i === 0) c = RAMP.dirt[1]; P(g, x0 + 8 + i, ybot - j, c); }
  // hanging bone-and-charm strings under the eave
  for (let s = 0; s < 6; s++) {
    const hxr = x0 + 6 + s * 9, hy = ytop + 2;
    P(g, hxr, hy, RAMP.dirt[3]);
    for (let k = 1; k < 5 + (s % 3); k++) P(g, hxr, hy + k, RAMP.bone[3]);
    const cy = hy + 5 + (s % 3);
    if (s % 3 === 0) { fillRect(g, hxr - 1, cy, 3, 2, RAMP.bone[1]); P(g, hxr - 1, cy + 1, RAMP.void); P(g, hxr + 1, cy + 1, RAMP.void); } // skull
    else if (s % 3 === 1) { P(g, hxr, cy, RAMP.drift[1]); P(g, hxr - 1, cy + 1, RAMP.drift[2]); P(g, hxr + 1, cy + 1, RAMP.drift[2]); P(g, hxr, cy + 2, RAMP.drift[2]); } // drift charm
    else { for (let k = 0; k < 3; k++) P(g, hxr, cy + k, RAMP.bone[2]); } // bone shard
  }
  // rickety stoop (steps down from door)
  for (let s = 0; s < 3; s++) for (let i = 0; i < 12 - s * 2; i++) P(g, x0 + 7 + s + i, ybot + 1 + s * 2, RAMP.dirt[3]), P(g, x0 + 7 + s + i, ybot + 2 + s * 2, RAMP.dirt[2]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ DOODADS ============================ */
function drawReedClump(variant) {
  const g = makeGrid(12, 18); const baseY = 16, cx = 6;
  const blades = variant ? 6 : 4;
  const rng = mulberry(131 + variant);
  for (let i = 0; i < blades; i++) {
    const bx = cx + Math.floor((rng() - 0.5) * 8), h = 9 + Math.floor(rng() * 6), lean = (rng() - 0.5) * 2;
    for (let k = 0; k < h; k++) { const sx = bx + Math.round(lean * (k / h)); P(g, sx, baseY - k, k > h - 2 ? RAMP.grass[0] : (k < 3 ? RAMP.grass[3] : RAMP.grass[1])); }
    if (rng() < 0.6) { const sy = baseY - h; P(g, bx + Math.round(lean), sy - 1, RAMP.bone[2]); P(g, bx + Math.round(lean), sy - 2, RAMP.bone[1]); } // seed-head
  }
  outline(g, RAMP.void); return g;
}

function drawDeadTree(variant) {
  const g = makeGrid(28, 40); const baseY = 38, cx = 13;
  const dr = RAMP.dirt;
  // trunk leaning
  const lean = variant ? 0.18 : -0.1;
  for (let y = 0; y < 30; y++) { const t = y / 30; const w = Math.round(3 - t * 1.5); const sx = cx + Math.round(lean * y); for (let i = -w; i <= w; i++) P(g, sx + i, baseY - y, i < 0 ? dr[0] : i > 0 ? dr[3] : dr[1]); }
  // bare branches
  const rng = mulberry(141 + variant);
  const branch = (x0, y0, dx, dy, n) => { let x = x0, y = y0; for (let k = 0; k < n; k++) { P(g, Math.round(x), Math.round(y), dr[2]); x += dx; y += dy; if (rng() < 0.3) P(g, Math.round(x), Math.round(y), dr[3]); } };
  const tx = cx + Math.round(lean * 24);
  branch(tx, baseY - 24, -0.9, -0.7, 9); branch(tx, baseY - 26, 0.95, -0.6, 10); branch(tx, baseY - 28, 0.1, -1, 7);
  branch(tx - 6, baseY - 28, -0.7, -0.6, 5); branch(tx + 6, baseY - 30, 0.7, -0.5, 5);
  // drift moss tufts
  for (let i = 0; i < (variant ? 5 : 3); i++) { const mx = tx + Math.floor((rng() - 0.5) * 18), my = baseY - 18 - Math.floor(rng() * 14); P(g, mx, my, RAMP.drift[2]); if (rng() < 0.5) P(g, mx + 1, my, RAMP.drift[3]); P(g, mx, my + 1, RAMP.drift[3]); }
  outline(g, RAMP.void); return g;
}

function drawBoneSpike(variant) {
  const g = makeGrid(10, 16); const baseY = 14, cx = variant ? 4 : 5;
  boneSpikeShape(g, cx, baseY, variant ? 11 : 13, variant ? 0.4 : -0.15);
  // a small second rib for variant
  if (variant) boneSpikeShape(g, cx + 3, baseY, 6, 0.6);
  // socket holes
  P(g, cx, baseY - 4, RAMP.bone[3]); P(g, cx, baseY - 8, RAMP.bone[3]);
  outline(g, RAMP.void); return g;
}

function drawMireBubble(frame) {
  const g = makeGrid(10, 8); const cx = 5, cy = 5; const wa = RAMP.water;
  // flat puddle
  for (let yy = -2; yy <= 2; yy++) for (let xx = -4; xx <= 4; xx++) { if ((xx / 4) ** 2 + (yy / 2) ** 2 > 1) continue; let c = wa[2]; if (yy < 0) c = wa[1]; if (yy <= -1 && xx < 0) c = wa[0]; P(g, cx + xx, cy + yy, c); }
  // bubble swells (frame 0 small, frame 1 big/pop)
  if (frame === 0) { P(g, cx, cy - 1, wa[0]); P(g, cx, cy, wa[1]); }
  else { P(g, cx - 1, cy - 2, wa[0]); P(g, cx, cy - 2, wa[0]); P(g, cx - 1, cy - 1, wa[1]); P(g, cx, cy - 1, wa[1]); P(g, cx + 1, cy - 1, wa[1]); P(g, cx, cy - 3, RAMP.bone[2]); P(g, cx + 2, cy - 2, wa[0]); }
  outline(g, RAMP.void); return g;
}

/* ============================ INTERIOR ADDITIONS ============================ */
function drawHerbRack() {
  const g = makeGrid(24, 30); const baseY = 27, x0 = 2, top = 6; const dr = RAMP.dirt;
  // timber rack frame
  for (let i = 0; i <= 20; i++) { P(g, x0 + i, top, dr[1]); P(g, x0 + i, top + 1, dr[3]); }   // top rail
  P(g, x0, top, dr[0]); P(g, x0 + 20, top, dr[2]);
  for (let j = top; j < baseY; j++) { P(g, x0, j, dr[2]); P(g, x0 + 20, j, dr[3]); }            // posts
  // hanging dried herb bundles + charms
  const items = [[3, RAMP.grass], [7, RAMP.moss || RAMP.grass], [11, RAMP.ember], [15, RAMP.drift], [18, RAMP.grass]];
  items.forEach(([ix, col], i) => {
    const hx = x0 + ix, hy = top + 2;
    for (let k = 0; k < 3; k++) P(g, hx, hy + k, RAMP.bone[3]);              // string
    const by = hy + 3, h = 8 + (i % 3) * 2;
    if (i === 3) { // drift charm
      P(g, hx, by + 2, RAMP.drift[1]); P(g, hx - 1, by + 3, RAMP.drift[2]); P(g, hx + 1, by + 3, RAMP.drift[2]); P(g, hx, by + 4, RAMP.drift[2]);
    } else {
      for (let k = 0; k < h; k++) { const t = k / h, w = Math.round(1 + t * 1.5); for (let m = -w; m <= w; m++) P(g, hx + m, by + k, m < 0 ? col[1] : m > 0 ? col[3] : col[2]); }
      P(g, hx, by + h, col[3]);  // tied tip
    }
  });
  outline(g, RAMP.void); return g;
}

function drawWallTimberCharms() {
  // plain timber NW wall + bone charms strung across
  const g = wallSegment('nw', 'timber', 'plain', {});
  const bn = RAMP.bone, dr = RAMP.drift;
  // a sagging string across the face
  const y0 = 22;
  for (let x = 2; x < 62; x++) { const sag = Math.round(Math.sin((x / 64) * Math.PI) * 4); P(g, x, y0 + sag, bn[3]); }
  // dangling charms
  for (let s = 0; s < 6; s++) {
    const hx = 6 + s * 10, sag = Math.round(Math.sin((hx / 64) * Math.PI) * 4), hy = y0 + sag;
    for (let k = 1; k < 4 + (s % 3); k++) P(g, hx, hy + k, bn[3]);
    const cy = hy + 4 + (s % 3);
    if (s % 3 === 0) { fillRect(g, hx - 1, cy, 3, 3, bn[1]); P(g, hx - 1, cy + 1, RAMP.void); P(g, hx + 1, cy + 1, RAMP.void); } // skull
    else if (s % 3 === 1) { for (let k = 0; k < 4; k++) P(g, hx, cy + k, bn[2]); P(g, hx - 1, cy + 2, bn[1]); }                  // bone shard
    else { P(g, hx, cy, dr[1]); P(g, hx - 1, cy + 1, dr[2]); P(g, hx + 1, cy + 1, dr[2]); P(g, hx, cy + 2, dr[2]); }            // drift charm
  }
  outline(g, RAMP.void); return g;
}

/* ============================ THE LOST TOMBSTONE (16×20) ============================ */
function drawTombstone(sunken) {
  const g = makeGrid(16, 20); const bn = RAMP.bone; const cx = 8, baseY = 18;
  // mound of soil
  for (let xx = -7; xx <= 7; xx++) { const t = 1 - Math.abs(xx) / 7; const h = Math.round(t * 3); for (let k = 0; k < h; k++) P(g, cx + xx, baseY - k, RAMP.dirt[2]); P(g, cx + xx, baseY - h, RAMP.dirt[3]); }
  const lean = sunken ? 0.5 : 0.18;
  const topY = sunken ? 9 : 2, botY = baseY - 2;
  // stone slab (leaning)
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const w = 4;
    const sx = cx + Math.round(lean * (y - botY) * -1);   // lean
    for (let i = -w; i <= w; i++) {
      if (y < topY + 4) { // rounded top
        const tt = (topY + 4 - y) / 4; if (Math.abs(i) > w * (1 - tt * 0.8)) continue;
      }
      let c = bn[2]; if (i < -w + 1) c = bn[1]; if (i > w - 1) c = bn[3];
      if (hash2(sx + i, y, 151) < 0.08) c = bn[3];
      P(g, sx + i, y, c);
    }
  }
  // cross/mark
  const msx = cx + Math.round(lean * (topY + 8 - botY) * -1);
  P(g, msx, topY + 6, bn[3]); P(g, msx, topY + 7, bn[3]); P(g, msx, topY + 8, bn[3]); P(g, msx - 1, topY + 7, bn[3]); P(g, msx + 1, topY + 7, bn[3]);
  // faint gold glint at the base (only non-sunken)
  if (!sunken) { P(g, cx + 4, baseY - 1, RAMP.gold[1]); P(g, cx + 4, baseY - 2, RAMP.gold[0]); P(g, cx + 5, baseY - 1, RAMP.gold[2]); }
  outline(g, RAMP.void); return g;
}

/* ============================ REGISTRIES ============================ */
const WILDS_STRUCT = {
  husk_den:     { fn: drawHuskDen,     cell: [120, 88],  anchor: [60, 87],  frames: 2, anim: { name: 'eyes', fps: 2 } },
  ash_obelisk:  { fn: drawAshObelisk,  cell: [64, 112],  anchor: [32, 111], frames: 3, anim: { name: 'pulse', fps: 4 } },
  mirewife_hut: { fn: drawMirewifeHut, cell: [120, 116], anchor: [58, 115] },
};
const WILDS_DOODAD = {
  reed_clump:  { fn: drawReedClump, cell: [12, 18], anchor: [6, 17],  variants: 2 },
  dead_tree:   { fn: drawDeadTree,  cell: [28, 40], anchor: [13, 39], variants: 2 },
  bone_spike:  { fn: drawBoneSpike, cell: [10, 16], anchor: [5, 15],  variants: 2 },
  mire_bubble: { fn: drawMireBubble,cell: [10, 8],  anchor: [5, 7],   frames: 2, anim: { name: 'bubble', fps: 3 } },
};

Object.assign(globalThis, {
  driftVeins, boneSpikeShape,
  drawHuskDen, drawAshObelisk, drawMirewifeHut,
  drawReedClump, drawDeadTree, drawBoneSpike, drawMireBubble,
  drawHerbRack, drawWallTimberCharms, drawTombstone,
  WILDS_STRUCT, WILDS_DOODAD,
});
