// Naevyr FRONTIER EXPANSION · WAYSIDE DECOR — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2 from tiles.js; ell/shadeMass from beasts.js).
//
// The connective-tissue props that fill the space between landmarks: rest stops and
// resource camps. Native-size cells, BOTTOM-CENTER anchored, 1px #0a0810 void outline,
// dither not blur, moonlit-left / shadowed-right, RAMP only.
//   Rest stops:  campfire(3f flame@4fps) · lean_to · bedroll · supply_crates · cook_pot
//   Logging:     log_pile · sawbuck · axe_stump
//   Quarry:      stone_cart · cut_blocks · pick_stump
//   Fishing:     pier(2f water-lap) · net_rack · fish_basket

/* ----------------------------- shared timber helpers ----------------------------- */
// a single timber log / pole drawn as a shaded column from (x,y0) down to (x,y1)
function pole(g, x, y0, y1, ramp, w) {
  w = w || 3;
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) {
    let c = ramp[1]; if (i === 0) c = ramp[0]; if (i === w - 1) c = ramp[3];
    if (hash2(x + i, y, 311) < 0.10) c = ramp[2];          // bark grain
    P(g, x + i, y, c);
  }
}
// a board / beam along a vector (axx) — horizontal plank
function plankH(g, x0, x1, y, ramp, th) {
  th = th || 3;
  for (let x = x0; x <= x1; x++) for (let j = 0; j < th; j++) {
    let c = ramp[1]; if (j === 0) c = ramp[0]; if (j === th - 1) c = ramp[3];
    if (hash2(x, y + j, 312) < 0.10) c = ramp[2];
    P(g, x, y + j, c);
  }
}
// a plank-faced crate/box: front face (x..x+w, top..top+h), lit-left/dark-right, top cap, seams
function crate(g, x, top, w, h, ramp, bands) {
  // top cap (2px parallelogram)
  for (let i = 0; i < w; i++) { P(g, x + i, top - 1, ramp[0]); }
  for (let i = -1; i < w + 1; i++) P(g, x + i, top, ramp[2]);
  for (let y = top; y < top + h; y++) for (let i = 0; i < w; i++) {
    let c = ramp[1]; if (i < 2) c = ramp[0]; if (i > w - 3) c = ramp[3];
    if (hash2(x + i, y, 313) < 0.08) c = ramp[2];
    P(g, x + i, y, c);
  }
  // vertical plank seams
  for (let i = 4; i < w; i += 5) for (let y = top; y < top + h; y++) P(g, x + i, y, ramp[3]);
  // horizontal rail seams
  plankSeam(g, x, x + w - 1, top + 2, ramp[3]);
  plankSeam(g, x, x + w - 1, top + h - 2, ramp[3]);
  if (bands) { // iron corner bands
    for (let y = top; y < top + h; y += h - 1) for (let i = 0; i < w; i++) if (i < 2 || i > w - 3) P(g, x + i, y, RAMP.stone[2]);
  }
}
function plankSeam(g, x0, x1, y, c) { for (let x = x0; x <= x1; x++) if ((x) % 2 === 0) P(g, x, y, c); }

// animated flame (used by campfire + cook_pot): cx,baseY, height h, frame f (0..2)
function flame(g, cx, baseY, h, f) {
  const em = RAMP.ember, gd = RAMP.gold;
  const sway = [0, 1, -1][f], flick = [0, -1, 1][f];
  for (let k = 0; k < h; k++) {
    const t = k / h;
    const w = Math.max(0, Math.round((1 - t) * 4) - (k > h - 3 ? 1 : 0));
    const xc = cx + Math.round(sway * t * 2);
    for (let i = -w; i <= w; i++) {
      let c = em[2];
      if (Math.abs(i) <= w - 1) c = em[1];
      if (Math.abs(i) <= 1 && k < h * 0.66) c = em[0];      // bright core
      if (Math.abs(i) === 0 && k < h * 0.4) c = gd[0];      // white-hot tip
      P(g, xc + i, baseY - k, c);
    }
  }
  // sparks rising
  P(g, cx + sway, baseY - h - 1 + flick, gd[0]);
  P(g, cx - 2 + flick, baseY - h + 1, em[0]);
  P(g, cx + 3 - flick, baseY - h, em[1]);
}

/* =============================== REST STOPS =============================== */

// campfire 64×64 — stone ring + crossed logs + 3-frame flame @4fps. (Tall cell for the
// flame/glow column; the fire itself sits low, bottom-center anchored.)
function drawCampfire(f) {
  f = f || 0;
  const g = makeGrid(64, 64);
  const st = RAMP.stone, dt = RAMP.dirt, em = RAMP.ember, bn = RAMP.bone;
  const cx = 32, baseY = 60;
  // scorched dirt patch
  ell(g, cx, baseY, 16, 6, (x, y, d) => { if (d > 0.85 && (x + y) % 2) return; P(g, x, y, d < 0.4 ? RAMP.void : (hash2(x, y, 5) < 0.4 ? RAMP.ash : dt[3])); });
  // ring of stones
  for (let a = 0; a < 9; a++) {
    const ang = a / 9 * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(ang) * 14), sy = Math.round(baseY - 3 + Math.sin(ang) * 6);
    shadeMass(g, sx, sy, 3, 2.4, st, 30 + a);
  }
  // charred crossed logs
  for (let k = -7; k <= 7; k++) { P(g, cx + k, baseY - 4 + Math.round(k * 0.2), dt[3]); P(g, cx + k, baseY - 3 + Math.round(k * 0.2), RAMP.void); }
  for (let k = -7; k <= 7; k++) { P(g, cx + Math.round(k * 0.2), baseY - 4 - Math.round(k * 0.0) - Math.abs(k) * 0 + 0, dt[3]); }
  pole(g, cx - 8, baseY - 6, baseY - 4, dt, 4); pole(g, cx + 5, baseY - 6, baseY - 4, dt, 4);
  // embers under the fire
  for (let i = 0; i < 6; i++) { const ex = cx - 5 + i * 2, ey = baseY - 3; P(g, ex, ey, i % 2 ? em[1] : em[2]); }
  // the flame
  flame(g, cx, baseY - 4, 22, f);
  // warm ground glow (dither, pulses with frame)
  const rr = [12, 14, 13][f];
  for (let yy = -3; yy <= 4; yy++) for (let xx = -rr; xx <= rr; xx++) {
    if ((xx / rr) ** 2 + (yy / 5) ** 2 > 1) continue;
    if ((xx + yy + f) % 2 === 0 && Math.abs(xx) > 8 && hash2(xx, yy, 6) < 0.4) P(g, cx + xx, baseY - 1 + yy, em[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// lean_to 80×72 — A-frame pole shelter with a stretched hide/cloth roof + bedroll inside.
function drawLeanTo() {
  const g = makeGrid(80, 72);
  const dt = RAMP.dirt, bn = RAMP.bone, bl = RAMP.blood, st = RAMP.stone;
  const cx = 40, baseY = 68;
  // dirt pad
  ell(g, cx, baseY, 30, 7, (x, y, d) => { if (d > 0.9 && (x + y) % 2) return; P(g, x, y, d < 0.5 ? dt[2] : dt[3]); });
  // back frame: two tall rear poles + one ridge pole leaning forward
  pole(g, cx - 26, 22, baseY - 1, dt, 3);                 // rear-left upright
  pole(g, cx + 22, 24, baseY - 1, dt, 3);                 // rear-right upright
  // front (low) poles
  pole(g, cx - 14, 46, baseY - 1, dt, 3);
  pole(g, cx + 30, 48, baseY - 1, dt, 3);
  // ridge beam (high back -> low front)
  for (let x = cx - 26; x <= cx + 32; x++) { const y = 22 + Math.round((x - (cx - 26)) * 0.0); P(g, x, 22 + Math.round((x + 26 - cx) * 0.42), dt[2]); }
  // stretched roof hide — sloped panel from the ridge down to the front
  for (let x = cx - 28; x <= cx + 30; x++) {
    const topY = 20 + Math.round((x + 28 - cx) * 0.42);
    for (let k = 0; k < 22; k++) {
      const y = topY + k;
      if (y > baseY - 2) break;
      let c = bn[2];                                       // pale stretched hide
      if (k < 2) c = bn[1];                                // sun-lit ridge
      else if (k > 17) c = bn[3];                          // shaded lower hem
      else if (k > 13) c = dt[3];                          // hide darkens to the edge
      if (k % 6 === 2 && x % 2 === 0) c = dt[3];           // horizontal stitch seams
      if (hash2(x, y, 41) < 0.04) c = bn[3];               // sparse wear
      P(g, x, y, c);
    }
  }
  // a painted blood-rune ward on the hide
  [[cx - 4, 30], [cx - 6, 32], [cx - 2, 32], [cx - 4, 34], [cx + 8, 38], [cx + 6, 40], [cx + 10, 40]].forEach(([rx, ry]) => P(g, rx, ry, bl[2]));
  // lashings where roof meets poles
  for (const px of [cx - 26, cx + 22]) for (let j = 0; j < 3; j++) P(g, px, 24 + j * 2, st[3]);
  // a bedroll tucked under the lean-to
  for (let x = cx - 14; x <= cx + 6; x++) { P(g, x, baseY - 4, dt[2]); P(g, x, baseY - 3, bl[2]); P(g, x, baseY - 2, dt[3]); }
  ell(g, cx - 16, baseY - 4, 3, 3, (x, y, d) => P(g, x, y, d < 0.5 ? bn[1] : bn[3]));   // rolled end / pillow
  outline(g, RAMP.void);
  return g;
}

// bedroll 48×24 — rolled mat + blanket on the ground.
function drawBedroll() {
  const g = makeGrid(48, 24);
  const dt = RAMP.dirt, bl = RAMP.blood, bn = RAMP.bone;
  const cx = 24, baseY = 20;
  // the laid-out mat (long low mound)
  for (let x = 6; x <= 42; x++) {
    const t = (x - 6) / 36, h = Math.round(4 + Math.sin(t * Math.PI) * 2);
    for (let k = 0; k < h; k++) {
      let c = dt[1]; if (k > h - 2) c = dt[0]; if (x > 36) c = dt[2];
      P(g, x, baseY - k, c);
    }
  }
  // blanket folded over the top
  for (let x = 8; x <= 30; x++) { P(g, x, baseY - 5, bl[1]); P(g, x, baseY - 4, bl[2]); if (x % 4 === 0) P(g, x, baseY - 4, bl[0]); }
  // rolled pillow at one end
  ell(g, 40, baseY - 4, 4, 4, (x, y, d, dx, dy) => { let c = bn[2]; if (dy < -0.2) c = bn[1]; if (d > 0.7) c = bn[3]; P(g, x, y, c); });
  outline(g, RAMP.void);
  return g;
}

// supply_crates 48×40 — stacked crates + a barrel + a sack.
function drawSupplyCrates() {
  const g = makeGrid(48, 40);
  const dt = RAMP.dirt, bn = RAMP.bone, st = RAMP.stone;
  const baseY = 38;
  // ground shadow
  ell(g, 24, baseY, 22, 5, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.85) P(g, x, y, RAMP.void, 0.4); });
  crate(g, 4, baseY - 18, 18, 18, dt, true);              // big crate left
  crate(g, 23, baseY - 14, 13, 14, dt, true);             // small crate right
  crate(g, 9, baseY - 30, 14, 13, dt, false);             // crate stacked on top
  // a barrel at far right
  for (let y = baseY - 16; y <= baseY - 1; y++) {
    const t = (y - (baseY - 16)) / 15, bulge = Math.round(Math.sin(t * Math.PI) * 1.5);
    for (let x = 37 - bulge; x <= 45 + bulge; x++) {
      let c = dt[1]; if (x < 39) c = dt[0]; if (x > 43) c = dt[3];
      P(g, x, y, c);
    }
  }
  for (const yb of [baseY - 13, baseY - 5]) for (let x = 36; x <= 46; x++) P(g, x, yb, st[2]); // barrel hoops
  ell(g, 41, baseY - 16, 5, 2, (x, y) => P(g, x, y, dt[3]));    // barrel lid
  outline(g, RAMP.void);
  return g;
}

// cook_pot 32×32 — iron tripod pot over embers, with steam.
function drawCookPot() {
  const g = makeGrid(32, 32);
  const st = RAMP.stone, em = RAMP.ember, bn = RAMP.bone, dt = RAMP.dirt;
  const cx = 16, baseY = 29;
  // embers / small fire base
  ell(g, cx, baseY, 9, 3, (x, y, d) => { if (d < 0.7) P(g, x, y, hash2(x, y, 51) < 0.5 ? em[2] : RAMP.void); });
  for (let i = 0; i < 5; i++) P(g, cx - 4 + i * 2, baseY - 1, i % 2 ? em[0] : em[1]);
  // tripod legs
  P(g, cx - 9, baseY - 2, st[2]); for (let k = 0; k < 12; k++) P(g, cx - 8 + k, baseY - 3 - k, st[3]);
  for (let k = 0; k < 12; k++) P(g, cx + 8 - k, baseY - 3 - k, st[3]);
  for (let k = 0; k < 10; k++) P(g, cx, baseY - 3 - k, st[2]);
  // pot body (cast iron)
  ell(g, cx, baseY - 9, 7, 5, (x, y, d, dx, dy) => { let c = st[2]; if (dx + dy < -0.4) c = st[1]; if (d > 0.75) c = st[3]; P(g, x, y, c); });
  for (let x = cx - 6; x <= cx + 6; x++) P(g, x, baseY - 13, st[3]);   // rim
  for (let x = cx - 5; x <= cx + 5; x++) P(g, x, baseY - 14, st[1]);   // lit rim lip
  // handle arc
  for (let k = 0; k <= 6; k++) { const a = Math.PI * (k / 6); P(g, Math.round(cx - 6 + (1 - Math.cos(a)) * 6), Math.round(baseY - 14 - Math.sin(a) * 4), st[3]); }
  // bubbling stew + steam
  P(g, cx - 2, baseY - 13, bn[3]); P(g, cx + 2, baseY - 13, bn[2]);
  P(g, cx, baseY - 17, bn[3]); P(g, cx - 2, baseY - 20, bn[3]); P(g, cx + 2, baseY - 22, bn[3]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== LOGGING CAMP =============================== */

// log_pile 64×40 — stacked logs, ends facing the viewer (concentric rings).
function drawLogPile() {
  const g = makeGrid(64, 40);
  const dt = RAMP.dirt, bn = RAMP.bone;
  const baseY = 37;
  function logEnd(cx, cy, r) {
    ell(g, cx, cy, r, r, (x, y, d, dx, dy) => {
      let c = dt[1]; if (dx + dy < -0.3) c = dt[0]; if (d > 0.8) c = dt[3];
      P(g, x, y, c);
    });
    // growth rings + heartwood
    ell(g, cx, cy, r - 1.5, r - 1.5, (x, y, d) => { if (d > 0.7 && d < 0.85) P(g, x, y, dt[2]); });
    ell(g, cx, cy, r * 0.4, r * 0.4, (x, y, d) => P(g, x, y, bn[3]));
    P(g, cx, cy, dt[3]);
  }
  // bottom row of 4, supported by two bark logs lying sideways
  plankH(g, 4, 60, baseY - 1, dt, 3);
  const r = 6;
  [[12, baseY - 8], [25, baseY - 8], [38, baseY - 8], [51, baseY - 8]].forEach(([x, y]) => logEnd(x, y, r));
  // second row of 3 nested in the gaps
  [[18, baseY - 18], [31, baseY - 18], [44, baseY - 18]].forEach(([x, y]) => logEnd(x, y, r));
  // top row of 2
  [[25, baseY - 28], [38, baseY - 28]].forEach(([x, y]) => logEnd(x, y, r));
  // a couple of chocks / wedges keeping the stack
  P(g, 5, baseY - 4, dt[3]); P(g, 58, baseY - 4, dt[3]);
  outline(g, RAMP.void);
  return g;
}

// sawbuck 48×40 — X-frame sawhorse cradling a log, with a bucksaw leaning on it.
function drawSawbuck() {
  const g = makeGrid(48, 40);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone;
  const cx = 24, baseY = 37;
  // ground shadow
  ell(g, cx, baseY, 18, 4, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.8) P(g, x, y, RAMP.void, 0.4); });
  // X legs (two crossed pairs)
  function xleg(ox) {
    for (let k = 0; k < 20; k++) { P(g, ox + 6 + Math.round(k * 0.5), baseY - 1 - k, dt[2]); P(g, ox + 16 - Math.round(k * 0.5), baseY - 1 - k, dt[3]); }
  }
  xleg(2); xleg(20);
  // cradled log resting in the X notches
  for (let y = baseY - 24; y <= baseY - 18; y++) for (let x = 8; x <= 42; x++) {
    let c = dt[1]; if (y < baseY - 22) c = dt[0]; if (y > baseY - 20) c = dt[3];
    if (hash2(x, y, 61) < 0.10) c = dt[2];
    P(g, x, y, c);
  }
  ell(g, 8, baseY - 21, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2]));   // sawn end (left)
  ell(g, 42, baseY - 21, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2]));  // sawn end (right)
  // a bucksaw leaning against the right leg (toothed steel blade + wood bow)
  for (let k = 0; k < 16; k++) { const x = 38 + Math.round(k * 0.3), y = baseY - 2 - k; P(g, x, y, st[0]); if (k % 2 === 0) P(g, x + 1, y, st[2]); }
  P(g, 38, baseY - 2, dt[3]); P(g, 43, baseY - 18, dt[3]);  // saw handle / frame
  outline(g, RAMP.void);
  return g;
}

// axe_stump 32×40 — chopping block with an axe buried in it + split firewood.
function drawAxeStump() {
  const g = makeGrid(32, 40);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone;
  const cx = 16, baseY = 37;
  // split firewood billets stacked at the base
  [[2, baseY - 1, 6], [3, baseY - 3, 5], [23, baseY - 1, 7], [25, baseY - 3, 5]].forEach(([x, y, w]) => {
    for (let k = 0; k < w; k++) { let c = dt[1]; if (k === 0) c = dt[0]; if (k === w - 1) c = dt[3]; P(g, x + k, y, c); }
    P(g, x, y, bn[3]);                                      // pale split face
  });
  // the chopping block — a straight-sided round log section
  const sw = 8, topY = baseY - 15;
  for (let y = topY; y <= baseY - 1; y++) {
    for (let x = cx - sw; x <= cx + sw; x++) {
      let c = dt[2]; if (x < cx - sw + 2) c = dt[1]; if (x > cx + sw - 2) c = dt[3];
      if (x % 4 === 0 && hash2(x, y, 71) < 0.6) c = dt[3];  // vertical bark grooves
      P(g, x, y, c);
    }
  }
  // flat sawn top with end-grain rings (lighter heartwood)
  ell(g, cx, topY, sw, 3, (x, y, d) => {
    let c = dt[1]; if (d > 0.66) c = dt[3]; if (d < 0.3) c = bn[3];
    P(g, x, y, c);
  });
  for (const r of [3, 5.5]) ell(g, cx, topY, r, r * 0.36, (x, y, d) => { if (d > 0.74) P(g, x, y, dt[2]); });
  // the axe sunk into the block — long haft up-right, broad steel head
  for (let k = 0; k < 18; k++) { const x = cx + 2 + Math.round(k * 0.5), y = topY - 1 - k; P(g, x, y, dt[3]); P(g, x + 1, y, dt[2]); }
  // steel head (bit down-left into the wood)
  const hx = cx + 1, hy = topY - 1;
  for (let j = -3; j <= 3; j++) for (let i = -1; i <= 4; i++) {
    if (Math.abs(j) - i > 3) continue;
    let c = st[1]; if (i < 1) c = st[0]; if (j > 1) c = st[3];
    P(g, hx - i, hy + j, c);
  }
  P(g, hx - 4, hy - 2, st[0]); P(g, hx - 4, hy + 2, st[0]);   // bit edge glint
  outline(g, RAMP.void);
  return g;
}

/* =============================== QUARRY CAMP =============================== */

// stone_cart 64×48 — wooden cart loaded with cut stone blocks, two wheels.
function drawStoneCart() {
  const g = makeGrid(64, 48);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone;
  const cx = 32, baseY = 45;
  // ground shadow
  ell(g, cx, baseY, 28, 5, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.85) P(g, x, y, RAMP.void, 0.4); });
  // two wheels
  function wheel(wx) {
    ell(g, wx, baseY - 6, 6, 6, (x, y, d) => { if (d > 0.78) P(g, x, y, dt[3]); else if (d > 0.6) P(g, x, y, dt[2]); });
    for (let a = 0; a < 6; a++) { const ang = a / 6 * Math.PI * 2; for (let k = 0; k < 5; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(baseY - 6 + Math.sin(ang) * k), dt[3]); } // spokes
    ell(g, wx, baseY - 6, 1.6, 1.6, (x, y) => P(g, x, y, st[2]));  // hub
  }
  wheel(16); wheel(48);
  // cart bed (plank box, open top) tilted slightly
  for (let y = baseY - 20; y <= baseY - 10; y++) for (let x = 8; x <= 56; x++) {
    let c = dt[1]; if (y < baseY - 18) c = dt[0]; if (y > baseY - 12) c = dt[3];
    if ((x - 8) % 6 === 0) c = dt[3];                       // plank seams
    P(g, x, y, c);
  }
  plankH(g, 6, 58, baseY - 21, dt, 2);                      // top rail
  // axle + shaft
  for (let x = 8; x <= 56; x++) P(g, x, baseY - 8, dt[3]);
  for (let k = 0; k < 8; k++) P(g, 56 + k, baseY - 14 + Math.round(k * 0.4), dt[2]); // pull shaft
  // load of cut stone blocks heaped above the bed
  [[16, baseY - 27, 12, 7], [30, baseY - 25, 11, 6], [42, baseY - 28, 10, 7], [24, baseY - 33, 10, 6]].forEach(([x, y, w, h], i) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1]; if (xx < x + 2) c = st[0]; if (xx > x + w - 3) c = st[3]; if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 81 + i) < 0.07) c = st[2];
      P(g, xx, yy, c);
    }
    for (let xx = x; xx < x + w; xx++) P(g, xx, y - 1, st[0]);  // lit top edge
    if (i % 2) for (let xx = x; xx < x + w; xx++) if (hash2(xx, y, 9) < 0.2) P(g, xx, y, bn[3]); // quartz fleck
  });
  outline(g, RAMP.void);
  return g;
}

// cut_blocks 56×32 — a neat stack of dressed stone blocks + chisel marks.
function drawCutBlocks() {
  const g = makeGrid(56, 32);
  const st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold;
  const baseY = 30;
  ell(g, 28, baseY, 26, 4, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.85) P(g, x, y, RAMP.void, 0.4); });
  function block(x, y, w, h) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1]; if (xx < x + 2) c = st[0]; if (xx > x + w - 3) c = st[3]; if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 85) < 0.06) c = st[2];
      P(g, xx, yy, c);
    }
    for (let xx = x; xx < x + w; xx++) P(g, xx, y - 1, st[0]);        // lit top
    // chisel-dressed face marks
    for (let yy = y + 1; yy < y + h - 1; yy += 2) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (hash2(xx, yy, 86) < 0.5) P(g, xx, yy, st[2]);
  }
  // bottom row of 3, top row of 2 (offset)
  block(2, baseY - 11, 16, 11); block(19, baseY - 11, 16, 11); block(36, baseY - 11, 16, 11);
  block(10, baseY - 22, 16, 11); block(28, baseY - 22, 16, 11);
  // a few gold-vein flecks + a discarded chisel on top
  P(g, 18, baseY - 23, gd[1]); P(g, 35, baseY - 23, bn[3]);
  for (let k = 0; k < 6; k++) P(g, 14 + k, baseY - 24, RAMP.stone[3]);   // chisel
  P(g, 14, baseY - 24, st[0]);
  outline(g, RAMP.void);
  return g;
}

// pick_stump 32×40 — a low stone anvil/block with a pickaxe driven in + rubble.
function drawPickStump() {
  const g = makeGrid(32, 40);
  const st = RAMP.stone, dt = RAMP.dirt, bn = RAMP.bone, gd = RAMP.gold;
  const cx = 16, baseY = 37;
  // rubble scatter
  for (let i = 0; i < 10; i++) { const x = 3 + Math.floor(hash2(i, 1, 91) * 26), y = baseY - Math.floor(hash2(i, 2, 91) * 3); P(g, x, y, hash2(i, 3, 91) < 0.5 ? st[2] : st[3]); if (hash2(i, 4, 91) < 0.15) P(g, x, y, gd[1]); }
  // squat stone block / anvil
  for (let y = baseY - 14; y <= baseY - 1; y++) {
    const w = 9;
    for (let x = cx - w; x <= cx + w; x++) {
      let c = st[1]; if (x < cx - w + 2) c = st[0]; if (x > cx + w - 2) c = st[3]; if (y > baseY - 3) c = st[3];
      if (hash2(x, y, 92) < 0.08) c = st[2];
      P(g, x, y, c);
    }
  }
  // lit top + a gold vein running through it
  for (let x = cx - 9; x <= cx + 9; x++) P(g, x, baseY - 15, st[0]);
  for (let x = cx - 6; x <= cx + 4; x++) if ((x) % 2 === 0) P(g, x, baseY - 12 + Math.round(Math.sin(x) ), gd[1]);
  // pickaxe driven into the block (haft up-left, double-pointed steel head)
  for (let k = 0; k < 17; k++) P(g, cx + 2 - Math.round(k * 0.45), baseY - 16 - k, dt[3]);  // haft
  const hx = cx + 2, hy = baseY - 16;
  for (let k = -5; k <= 5; k++) { P(g, hx + k, hy - Math.round(Math.abs(k) * 0.5), st[1]); P(g, hx + k, hy + 1 - Math.round(Math.abs(k) * 0.5), st[3]); }
  P(g, hx - 5, hy - 3, st[0]); P(g, hx + 5, hy - 3, st[0]);  // pick points
  outline(g, RAMP.void);
  return g;
}

/* =============================== FISHING CAMP =============================== */

// pier 96×48 — wooden dock running out over water on posts; 2-frame water lap.
function drawPier(f) {
  f = f || 0;
  const g = makeGrid(96, 48);
  const dt = RAMP.dirt, wt = RAMP.water, bn = RAMP.bone, st = RAMP.stone;
  const cx = 48, baseY = 45;
  // water under the pier (dithered, laps in 2 frames)
  for (let y = baseY - 6; y <= baseY; y++) for (let x = 4; x < 92; x++) {
    let c = (x + y) % 2 === 0 ? wt[1] : wt[2];
    if (y > baseY - 2) c = wt[3];
    P(g, x, y, c);
  }
  // support posts down into the water
  const posts = [14, 30, 46, 62, 78];
  posts.forEach((px, i) => {
    pole(g, px, baseY - 18, baseY - 1, dt, 3);
    // lapping foam ring at the waterline (drifts with frame)
    const ly = baseY - 4 + ((i + f) % 2);
    P(g, px - 2, ly, wt[0]); P(g, px + 3, ly, wt[0]);
    if ((i + f) % 2 === 0) { P(g, px - 3, ly, bn[3]); P(g, px + 4, ly, bn[3]); }
  });
  // the plank deck (running left->right, slight iso tilt)
  for (let x = 6; x <= 90; x++) {
    const y = baseY - 20 - Math.round((x - 6) * 0.03);
    for (let j = 0; j < 4; j++) { let c = dt[1]; if (j === 0) c = dt[0]; if (j === 3) c = dt[3]; P(g, x, y + j, c); }
    if (x % 7 === 0) for (let j = 0; j < 4; j++) P(g, x, y + j, dt[3]);   // plank gaps
  }
  // deck edge rail posts + a mooring bollard at the end
  for (const px of [10, 88]) pole(g, px, baseY - 26, baseY - 22, dt, 2);
  ell(g, 88, baseY - 27, 3, 2, (x, y, d) => P(g, x, y, d < 0.5 ? dt[2] : dt[3]));
  // a coiled rope + a couple fish-crates on the deck
  ell(g, 20, baseY - 24, 4, 2, (x, y, d) => P(g, x, y, d < 0.4 ? bn[2] : bn[3]));
  crate(g, 60, baseY - 30, 11, 8, dt, false);
  outline(g, RAMP.void);
  return g;
}

// net_rack 48×56 — A-frame drying rack with a hanging fishing net + fish.
function drawNetRack() {
  const g = makeGrid(48, 56);
  const dt = RAMP.dirt, bn = RAMP.bone, wt = RAMP.water, st = RAMP.stone;
  const cx = 24, baseY = 53;
  ell(g, cx, baseY, 20, 4, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.8) P(g, x, y, RAMP.void, 0.4); });
  // two A-frame legs + a top cross beam
  pole(g, 6, 14, baseY - 1, dt, 3); pole(g, 39, 14, baseY - 1, dt, 3);
  for (let x = 4; x <= 44; x++) P(g, x, 14 + Math.round(Math.abs(x - cx) * 0.0), dt[2]);   // top beam
  plankH(g, 4, 44, 13, dt, 2);
  for (let k = 0; k < 6; k++) { P(g, 7 + k, 14 + k, dt[3]); P(g, 41 - k, 14 + k, dt[3]); }  // leg braces
  // hanging net (diamond mesh, draped) — bone-coloured cord
  for (let y = 16; y <= 44; y++) for (let x = 8; x <= 40; x++) {
    const sag = Math.round(Math.sin((x - 8) / 32 * Math.PI) * 3);
    const yy = y + sag;
    if (yy > 46) continue;
    if ((x + yy) % 4 === 0 || (x - yy) % 4 === 0) P(g, x, yy, bn[3]);
  }
  // float-corks along the top of the net + weights at the bottom
  for (let x = 10; x <= 38; x += 6) P(g, x, 16, RAMP.ember[2]);
  for (let x = 10; x <= 38; x += 5) P(g, x, 44 + Math.round(Math.sin((x - 8) / 32 * Math.PI) * 3), st[3]);
  // a couple of caught fish hanging in the net
  [[18, 30], [28, 36]].forEach(([fx, fy]) => { ell(g, fx, fy, 3, 1.6, (x, y, d, dx) => { let c = st[0]; if (dx > 0.2) c = wt[1]; if (d > 0.7) c = st[3]; P(g, x, y, c); }); P(g, fx - 3, fy, wt[2]); P(g, fx + 3, fy, st[2]); });
  outline(g, RAMP.void);
  return g;
}

// fish_basket 32×28 — woven wicker basket brimming with fish.
function drawFishBasket() {
  const g = makeGrid(32, 28);
  const dt = RAMP.dirt, gd = RAMP.gold, wt = RAMP.water, st = RAMP.stone, bn = RAMP.bone;
  const cx = 16, baseY = 25;
  // woven basket body (tapered, horizontal weave bands)
  for (let y = baseY - 13; y <= baseY - 1; y++) {
    const t = (y - (baseY - 13)) / 12, w = Math.round(7 + t * 3);
    for (let x = cx - w; x <= cx + w; x++) {
      let c = gd[2]; if (x < cx - w + 2) c = gd[1]; if (x > cx + w - 2) c = gd[3];
      if ((x + y) % 2 === 0) c = gd[3];                     // weave dither
      P(g, x, y, c);
    }
  }
  // rim
  for (let x = cx - 8; x <= cx + 8; x++) P(g, x, baseY - 13, gd[1]);
  for (let x = cx - 8; x <= cx + 8; x++) P(g, x, baseY - 14, gd[0]);
  // fish spilling out of the top (clear body + tail fin + eye)
  [[11, baseY - 16, -0.4], [20, baseY - 16, 0.4], [15, baseY - 19, -0.1]].forEach(([fx, fy, sl], i) => {
    const dirn = sl < 0 ? -1 : 1;
    // fish body
    ell(g, fx, fy, 4, 2.2, (x, y, d, dx, dy) => {
      let c = wt[1]; if (dy < -0.2) c = st[0]; if (d > 0.7) c = wt[2];
      P(g, x, y + Math.round((x - fx) * sl), c);
    });
    // tail fin (away from the basket center)
    const tx = fx + dirn * 5, ty = fy + Math.round(dirn * 5 * sl);
    for (let j = -2; j <= 2; j++) P(g, tx, ty + j, st[2]);
    P(g, tx + dirn, ty - 2, st[2]); P(g, tx + dirn, ty + 2, st[2]);
    // head + eye (toward center)
    const hx2 = fx - dirn * 4, hy2 = fy - Math.round(dirn * 4 * sl);
    P(g, hx2, hy2, st[0]); P(g, hx2 - dirn, hy2, RAMP.void);
    if (i === 2) { P(g, fx, fy - 2, bn[3]); P(g, fx - 1, fy, st[0]); }   // top-fish scales glint
  });
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const WAYSIDE = {
  // rest stops
  campfire:       { fn: (i) => drawCampfire(i), cell: [64, 64], anchor: [32, 63], frames: 3, anim: { name: 'flame', fps: 4, loop: true }, group: 'rest' },
  lean_to:        { fn: () => drawLeanTo(),      cell: [80, 72], anchor: [40, 71], group: 'rest', footprint: '2x2' },
  bedroll:        { fn: () => drawBedroll(),     cell: [48, 24], anchor: [24, 23], group: 'rest' },
  supply_crates:  { fn: () => drawSupplyCrates(),cell: [48, 40], anchor: [24, 39], group: 'rest' },
  cook_pot:       { fn: () => drawCookPot(),     cell: [32, 32], anchor: [16, 31], group: 'rest' },
  // logging
  log_pile:       { fn: () => drawLogPile(),     cell: [64, 40], anchor: [32, 39], group: 'logging' },
  sawbuck:        { fn: () => drawSawbuck(),     cell: [48, 40], anchor: [24, 39], group: 'logging' },
  axe_stump:      { fn: () => drawAxeStump(),    cell: [32, 40], anchor: [16, 39], group: 'logging' },
  // quarry
  stone_cart:     { fn: () => drawStoneCart(),   cell: [64, 48], anchor: [32, 47], group: 'quarry' },
  cut_blocks:     { fn: () => drawCutBlocks(),   cell: [56, 32], anchor: [28, 31], group: 'quarry' },
  pick_stump:     { fn: () => drawPickStump(),   cell: [32, 40], anchor: [16, 39], group: 'quarry' },
  // fishing
  pier:           { fn: (i) => drawPier(i),      cell: [96, 48], anchor: [48, 47], frames: 2, anim: { name: 'water_lap', fps: 2, loop: true }, group: 'fishing' },
  net_rack:       { fn: () => drawNetRack(),     cell: [48, 56], anchor: [24, 55], group: 'fishing' },
  fish_basket:    { fn: () => drawFishBasket(),  cell: [32, 28], anchor: [16, 27], group: 'fishing' },
};

Object.assign(globalThis, {
  pole, plankH, plankSeam, crate, flame,
  drawCampfire, drawLeanTo, drawBedroll, drawSupplyCrates, drawCookPot,
  drawLogPile, drawSawbuck, drawAxeStump,
  drawStoneCart, drawCutBlocks, drawPickStump,
  drawPier, drawNetRack, drawFishBasket,
  WAYSIDE,
});
