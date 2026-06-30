// Naevyr "FILL THE REALM" · MICRO-POIs — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2; ell/shadeMass from beasts.js).
//
// Small decorative landmarks scattered across the map, BOTTOM-CENTER anchored, native cells,
// 1px #0a0810 void outline. Mostly 1 frame; a few animate. RAMP only, dither not blur,
// moonlit-left / shadowed-right. Registry: { fn(frame), cell:[w,h], anchor:[x,y],
//   frames(=1), anim?{name,fps}, footprint?, ground? }.

/* ----------------------------- local timber helpers ----------------------------- */
function mpole(g, x, y0, y1, ramp, w) {
  w = w || 3;
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) { let c = ramp[1]; if (i === 0) c = ramp[0]; if (i === w - 1) c = ramp[3]; if (hash2(x + i, y, 411) < 0.1) c = ramp[2]; P(g, x + i, y, c); }
}
function mplank(g, x0, x1, y, ramp, th) {
  th = th || 3;
  for (let x = x0; x <= x1; x++) for (let j = 0; j < th; j++) { let c = ramp[1]; if (j === 0) c = ramp[0]; if (j === th - 1) c = ramp[3]; if (hash2(x, y + j, 412) < 0.1) c = ramp[2]; P(g, x, y + j, c); }
}
function mcrate(g, x, top, w, h, ramp) {
  for (let i = -1; i < w + 1; i++) P(g, x + i, top, ramp[2]);
  for (let y = top; y < top + h; y++) for (let i = 0; i < w; i++) { let c = ramp[1]; if (i < 2) c = ramp[0]; if (i > w - 3) c = ramp[3]; if (hash2(x + i, y, 413) < 0.08) c = ramp[2]; P(g, x + i, y, c); }
  for (let i = 4; i < w; i += 5) for (let y = top; y < top + h; y++) P(g, x + i, y, ramp[3]);
}
function groundOval(g, cx, cy, rx, ry, c, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d) => { if (y < cy - 1) return; if (d > 0.85 && (x + y) % 2) return; P(g, x, y, c, c === RAMP.void ? 0.4 : 1); });
}

/* =============================== WELL (32×40) =============================== */
function drawWell() {
  const g = makeGrid(32, 40), st = RAMP.stone, dt = RAMP.dirt, wt = RAMP.water, bn = RAMP.bone, cx = 16, baseY = 37;
  groundOval(g, cx, baseY, 14, 4, RAMP.void, 1);
  // circular stone wall (elliptical front)
  for (let y = baseY - 12; y <= baseY - 1; y++) for (let x = cx - 9; x <= cx + 9; x++) {
    const dx = (x - cx) / 9; if (Math.abs(dx) > 1) continue;
    let c = st[1]; if (x < cx - 6) c = st[0]; if (x > cx + 5) c = st[3];
    if ((x + y) % 4 === 0) c = st[3];                    // mortar courses
    if (hash2(x, y, 420) < 0.08) c = st[2];
    P(g, x, y, c);
  }
  // dark water mouth at the top rim
  ell(g, cx, baseY - 12, 9, 3, (x, y, d) => { let c = st[2]; if (d < 0.6) c = wt[3]; if (d < 0.3) c = wt[2]; P(g, x, y, c); });
  ell(g, cx, baseY - 12, 9, 3, (x, y, d) => { if (d > 0.82) P(g, x, y, st[0]); });   // lit rim lip
  // two roof posts + a peaked little shingle roof
  mpole(g, cx - 8, baseY - 26, baseY - 12, dt, 2); mpole(g, cx + 7, baseY - 26, baseY - 12, dt, 2);
  for (let k = 0; k <= 9; k++) { for (let x = cx - 11 + k; x <= cx + 11 - k; x++) P(g, x, baseY - 26 - k, k === 9 ? dt[0] : (x < cx ? dt[1] : dt[2])); }
  P(g, cx, baseY - 36, dt[0]);
  // a windlass + bucket hanging in the mouth
  for (let x = cx - 6; x <= cx + 6; x++) P(g, x, baseY - 24, dt[3]);   // crossbar
  P(g, cx + 1, baseY - 23, bn[3]); for (let y = baseY - 23; y <= baseY - 16; y++) P(g, cx + 1, y, bn[3]);  // rope
  mcrate(g, cx - 1, baseY - 16, 4, 4, dt); P(g, cx, baseY - 16, st[2]);  // bucket
  outline(g, RAMP.void);
  return g;
}

/* =============================== SIGNPOST (24×40) =============================== */
function drawSignpost() {
  const g = makeGrid(24, 40), dt = RAMP.dirt, bn = RAMP.bone, gr = RAMP.grass, cx = 11, baseY = 37;
  groundOval(g, cx, baseY, 7, 2, RAMP.void, 1);
  mpole(g, cx, 6, baseY - 1, dt, 3);
  // two arrow boards pointing opposite ways
  function board(y, dir) {
    const x0 = dir > 0 ? cx + 3 : cx - 13, x1 = dir > 0 ? cx + 13 : cx - 3;
    for (let yy = y; yy < y + 5; yy++) for (let x = x0; x <= x1; x++) { let c = dt[1]; if (yy === y) c = dt[0]; if (yy === y + 4) c = dt[3]; if (hash2(x, yy, 430) < 0.1) c = dt[2]; P(g, x, yy, c); }
    // pointed tip
    const tip = dir > 0 ? x1 : x0;
    P(g, tip + dir, y + 1, dt[2]); P(g, tip + dir, y + 3, dt[3]); P(g, tip + 2 * dir, y + 2, dt[2]);
    // faint carved text marks
    for (let x = (dir > 0 ? cx + 5 : cx - 11); x < (dir > 0 ? cx + 11 : cx - 5); x += 2) P(g, x, y + 2, bn[3]);
  }
  board(11, 1); board(20, -1);
  // moss at base
  P(g, cx - 3, baseY - 1, gr[2]); P(g, cx + 4, baseY - 1, gr[2]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== WAGON WRECK (64×40) =============================== */
function drawWagonWreck() {
  const g = makeGrid(64, 40), dt = RAMP.dirt, st = RAMP.stone, gr = RAMP.grass, baseY = 37, cx = 32;
  groundOval(g, cx, baseY, 28, 5, RAMP.void, 1);
  // toppled cart bed lying at an angle
  for (let y = baseY - 14; y <= baseY - 2; y++) for (let x = 10; x <= 44; x++) {
    const tilt = Math.round((x - 10) * 0.2);
    let c = dt[1]; if (y - tilt < baseY - 12) c = dt[0]; if (y - tilt > baseY - 5) c = dt[3];
    if ((x) % 6 === 0) c = dt[3];                        // plank seams
    if (hash2(x, y, 440) < 0.1) c = dt[2];
    P(g, x, y - tilt + 6, c);
  }
  // one broken wheel (collapsed spokes) + one wheel still up
  function wheel(wx, wy, broken) {
    ell(g, wx, wy, 7, 7, (x, y, d) => { if (d > 0.78) P(g, x, y, dt[3]); else if (d > 0.62) P(g, x, y, dt[2]); });
    if (!broken) { for (let a = 0; a < 6; a++) { const ang = a / 6 * Math.PI * 2; for (let k = 0; k < 6; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(wy + Math.sin(ang) * k), dt[3]); } ell(g, wx, wy, 1.6, 1.6, (x, y) => P(g, x, y, st[2])); }
    else { for (let a = 0; a < 3; a++) { const ang = a / 6 * Math.PI * 2 + 0.4; for (let k = 0; k < 5; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(wy + Math.sin(ang) * k), dt[3]); } }   // a couple snapped spokes
  }
  wheel(16, baseY - 7, false); wheel(45, baseY - 4, true);
  // a broken axle shaft jutting up
  for (let k = 0; k < 10; k++) P(g, 48 + k, baseY - 12 - k, dt[2]);
  // scattered crates spilling out
  mcrate(g, 30, baseY - 11, 9, 9, dt); mcrate(g, 40, baseY - 8, 7, 7, dt);
  // grass reclaiming
  for (let i = 0; i < 8; i++) { const x = 12 + Math.floor(hash2(i, 1, 441) * 40); P(g, x, baseY - 2, gr[2]); }
  outline(g, RAMP.void);
  return g;
}

/* =============================== RUINED HUT (80×72) =============================== */
function drawRuinedHut() {
  const g = makeGrid(80, 72), st = RAMP.stone, dt = RAMP.dirt, gr = RAMP.grass, baseY = 68, cx = 40;
  groundOval(g, cx, baseY, 34, 6, RAMP.void, 1);
  // crumbling stone walls — left wall tall, right wall broken low
  function wall(x0, x1, topFn) {
    for (let x = x0; x <= x1; x++) { const top = topFn(x); for (let y = top; y <= baseY - 1; y++) { let c = st[1]; if (x < x0 + 3) c = st[0]; if (x > x1 - 3) c = st[3]; if ((x + y) % 4 === 0) c = st[3]; if (hash2(x, y, 450) < 0.08) c = st[2]; P(g, x, y, c); } }
  }
  // left + back wall (taller), jagged broken top
  wall(12, 40, x => 26 + Math.round(Math.sin(x * 0.7) * 2) + (x > 34 ? (x - 34) * 1.5 : 0));
  // right wall stub (collapsed)
  wall(50, 68, x => baseY - 14 + Math.round(Math.sin(x * 0.9) * 3) + (x < 56 ? -6 : 0));
  // doorway gap in the front
  for (let y = baseY - 16; y <= baseY - 1; y++) for (let x = 40; x <= 48; x++) P(g, x, y, null);
  for (let y = baseY - 16; y <= baseY - 1; y++) { P(g, 40, y, st[3]); P(g, 48, y, st[3]); }   // door jambs
  // caved-in thatch roof — a sagging dark mass over the left half, broken open
  for (let x = 10; x <= 44; x++) { const topY = 22 + Math.round(Math.abs(x - 27) * 0.4); for (let k = 0; k < 6; k++) { const y = topY + k; if (hash2(x, y, 451) < 0.25) continue; let c = dt[2]; if (k === 0) c = dt[1]; if (k > 4) c = dt[3]; P(g, x, y, c); } }
  // rubble pile + fallen beams in front of the broken wall
  for (let i = 0; i < 18; i++) { const x = 50 + Math.floor(hash2(i, 1, 452) * 18), y = baseY - 2 - Math.floor(hash2(i, 2, 452) * 4); P(g, x, y, hash2(i, 3, 452) < 0.5 ? st[2] : st[3]); }
  for (let k = 0; k < 12; k++) P(g, 52 + k, baseY - 6 - Math.round(k * 0.4), dt[3]);   // fallen beam
  // grass + a sapling reclaiming the interior
  for (let i = 0; i < 14; i++) { const x = 14 + Math.floor(hash2(i, 4, 453) * 60); P(g, x, baseY - 1, gr[2]); }
  for (let y = baseY - 8; y <= baseY - 1; y++) P(g, 30, y, dt[2]);
  ell(g, 30, baseY - 9, 4, 4, (x, y, d) => P(g, x, y, d > 0.7 ? gr[2] : gr[1]));
  outline(g, RAMP.void);
  return g;
}

/* =============================== GRAVE ROW (64×32, ground decor) =============================== */
function drawGraveRow() {
  const g = makeGrid(64, 32), st = RAMP.stone, dt = RAMP.dirt, gr = RAMP.grass, baseY = 29;
  groundOval(g, 32, baseY, 30, 4, dt[3], 1);
  const stones = [[10, 12, 1], [24, 10, -1], [40, 13, 1], [54, 11, 0]];
  stones.forEach(([cx, h, lean], i) => {
    for (let y = baseY - 1; y >= baseY - h; y--) { const t = (baseY - y) / h; const off = Math.round(t * lean * 2); const w = 4; for (let x = -w; x <= w; x++) { let c = st[1]; if (x < -w + 1) c = st[0]; if (x > w - 1) c = st[3]; if (hash2(cx + x, y, 460 + i) < 0.08) c = st[2]; P(g, cx + x + off, y, c); } }
    // rounded top
    const off = Math.round((h / h) * lean * 2);
    ell(g, cx + off, baseY - h, 4, 2, (x, y, d) => { if (y > baseY - h) return; P(g, x, y, d > 0.6 ? st[3] : st[1]); });
    // carved cross line
    P(g, cx + off - 1, baseY - h + 4, st[3]); P(g, cx + off + 1, baseY - h + 4, st[3]); P(g, cx + off, baseY - h + 3, st[3]); P(g, cx + off, baseY - h + 5, st[3]);
    // a little grave mound + grass
    groundOval(g, cx, baseY, 5, 2, dt[2], 5 + i);
    P(g, cx - 5, baseY, gr[2]); P(g, cx + 5, baseY - 1, gr[2]);
  });
  outline(g, RAMP.void);
  return g;
}

/* =============================== STANDING STONES (64×72, 2f shimmer) =============================== */
function drawStandingStones(frame) {
  frame = frame || 0;
  const g = makeGrid(64, 72), st = RAMP.stone, dr = RAMP.drift, gr = RAMP.grass, baseY = 68;
  groundOval(g, 32, baseY, 30, 6, dt3(), 1);
  function dt3() { return RAMP.dirt[3]; }
  // a pair of tall monoliths + two shorter ones behind (a small ring)
  function monolith(cx, topY, hw, runeY) {
    for (let y = baseY - 1; y >= topY; y--) { const t = (baseY - y) / (baseY - topY); const w = Math.round(hw - t * 1.5); for (let x = -w; x <= w; x++) { let c = st[1]; if (x < -w + 1) c = st[0]; if (x > w - 1) c = st[3]; if (hash2(cx + x, y, 470) < 0.07) c = st[2]; if (hash2(cx + x, y, 471) < 0.02) c = st[3]; P(g, cx + x, y, c); } }
    // chipped top
    P(g, cx - 1, topY - 1, st[1]); P(g, cx + hw, topY + 1, RAMP.void);
    // a faint drift rune, shimmers across the 2 frames
    if (runeY != null) { const lit = frame === 1; const rc = lit ? dr[0] : dr[3]; [[cx - 1, runeY], [cx, runeY - 1], [cx + 1, runeY], [cx, runeY + 1], [cx, runeY + 2]].forEach(([rx, ry]) => P(g, rx, ry, rc)); if (lit) for (let yy = runeY - 3; yy <= runeY + 4; yy++) for (let xx = -3; xx <= 3; xx++) { const d = Math.abs(xx) + Math.abs(yy - runeY); if (d > 2 && d < 4 && (xx + yy) % 2 === 0 && !G(g, cx + xx, yy)) P(g, cx + xx, yy, dr[3]); } }
  }
  // back pair (shorter, drawn first)
  monolith(20, 26, 4, null); monolith(44, 24, 4, null);
  // front pair (tall, with runes)
  monolith(14, 14, 5, 40); monolith(50, 12, 5, 38);
  // a fallen lintel stone leaning between
  for (let x = 26; x <= 40; x++) { const y = 30 + Math.round((x - 26) * 0.5); for (let k = 0; k < 4; k++) { let c = st[2]; if (k === 0) c = st[1]; if (k === 3) c = st[3]; P(g, x, y + k, c); } }
  // grass tufts
  for (let i = 0; i < 8; i++) { const x = 8 + Math.floor(hash2(i, 1, 472) * 48); P(g, x, baseY - 1, gr[2]); }
  outline(g, RAMP.void);
  return g;
}

/* =============================== SCARECROW (24×44) =============================== */
function drawScarecrow() {
  const g = makeGrid(24, 44), dt = RAMP.dirt, gd = RAMP.gold, bl = RAMP.blood, bn = RAMP.bone, cx = 11, baseY = 41;
  groundOval(g, cx, baseY, 7, 2, RAMP.void, 1);
  // cross-post
  mpole(g, cx, 8, baseY - 1, dt, 3);
  for (let x = cx - 8; x <= cx + 9; x++) P(g, x, 18, dt[2]);   // arm bar
  for (let x = cx - 8; x <= cx + 9; x++) P(g, x, 19, dt[3]);
  // straw stuffing at the arm ends + bottom
  [[cx - 9, 18], [cx + 10, 18]].forEach(([x, y]) => { for (let k = 0; k < 4; k++) { P(g, x + (x < cx ? -k : k) * 0, y + k - 1, gd[1]); P(g, x, y + k, gd[2]); } });
  for (let k = 0; k < 5; k++) { P(g, cx - 2 - k, 18 + k, gd[1]); P(g, cx + 3 + k, 18 + k, gd[2]); }   // straw wrists
  // ragged blood-cloth tunic over the torso
  for (let y = 18; y <= 30; y++) { const w = 5 - Math.round((y - 18) / 6); for (let x = -w; x <= w; x++) { let c = bl[2]; if (x < -w + 1) c = bl[1]; if (x > w - 1) c = bl[3]; if (hash2(cx + x, y, 480) < 0.15) c = dt[3]; P(g, cx + x, y, c); } }
  // ragged hem
  for (let x = cx - 4; x <= cx + 4; x++) if (x % 2 === 0) P(g, x, 31, bl[3]);
  // burlap head with stitched face + straw hair + a tattered hat
  ell(g, cx, 12, 4, 4, (x, y, d, dx, dy) => { let c = bn[2]; if (dy < -0.3) c = bn[1]; if (d > 0.76) c = bn[3]; if (hash2(x, y, 481) < 0.1) c = gd[2]; P(g, x, y, c); });
  P(g, cx - 2, 11, RAMP.void); P(g, cx + 2, 11, RAMP.void);          // stitched X eyes
  P(g, cx - 1, 14, dt[3]); P(g, cx, 14, dt[3]); P(g, cx + 1, 14, dt[3]);   // stitched mouth
  for (let x = cx - 5; x <= cx + 5; x++) P(g, x, 8, dt[2]);          // hat brim
  for (let x = cx - 3; x <= cx + 3; x++) P(g, x, 7, dt[3]); P(g, cx, 5, dt[2]);   // hat crown
  for (let k = 0; k < 4; k++) { P(g, cx - 4 - 0, 9 + k, gd[1]); P(g, cx + 4, 9 + k, gd[2]); }  // straw hair
  outline(g, RAMP.void);
  return g;
}

/* =============================== BEEHIVE (20×28, 2f bee motes) =============================== */
function drawBeehive(frame) {
  frame = frame || 0;
  const g = makeGrid(20, 28), gd = RAMP.gold, dt = RAMP.dirt, em = RAMP.ember, cx = 10, baseY = 25;
  groundOval(g, cx, baseY, 8, 2, RAMP.void, 1);
  // little wooden stand
  mpole(g, cx - 6, baseY - 4, baseY - 1, dt, 2); mpole(g, cx + 5, baseY - 4, baseY - 1, dt, 2);
  for (let x = cx - 7; x <= cx + 7; x++) P(g, x, baseY - 5, dt[2]);
  // woven straw skep — stacked tapering coils
  for (let y = baseY - 5; y >= baseY - 18; y--) {
    const t = (baseY - 5 - y) / 13, w = Math.round(7 - t * 4.5);
    for (let x = -w; x <= w; x++) { let c = gd[2]; if (x < -w + 2) c = gd[1]; if (x > w - 2) c = gd[3]; if ((y) % 2 === 0) c = gd[3]; P(g, cx + x, y, c); }
  }
  P(g, cx, baseY - 19, gd[1]);                  // knot at the top
  // dark entrance hole
  P(g, cx, baseY - 8, dt[3]); P(g, cx - 1, baseY - 8, dt[3]); P(g, cx, baseY - 7, dt[3]);
  // bee motes circling (move per frame)
  const bees = frame === 0 ? [[cx + 6, baseY - 12], [cx - 7, baseY - 9], [cx + 2, baseY - 22]] : [[cx + 8, baseY - 10], [cx - 5, baseY - 14], [cx - 2, baseY - 23]];
  bees.forEach(([bx, by]) => { P(g, bx, by, gd[0]); P(g, bx, by, em[1]); P(g, bx + 1, by, dt[3]); });
  outline(g, RAMP.void);
  return g;
}

/* =============================== HAY BALES (40×24) =============================== */
function drawHayBales() {
  const g = makeGrid(40, 24), gd = RAMP.gold, dt = RAMP.dirt, baseY = 22;
  groundOval(g, 20, baseY, 18, 3, RAMP.void, 1);
  function bale(cx, cy, r) {
    ell(g, cx, cy, r, r * 0.82, (x, y, d, dx, dy) => { let c = gd[2]; if (dy < -0.3) c = gd[1]; if (d > 0.78) c = gd[3]; P(g, x, y, c); });
    // horizontal binding lines + straw texture
    for (let yy = Math.round(cy - r * 0.5); yy <= cy + r * 0.5; yy += 3) for (let x = cx - r; x <= cx + r; x++) if (hash2(x, yy, 490) < 0.5) P(g, x, yy, gd[3]);
    ell(g, cx, cy, r * 0.95, r * 0.78, (x, y, d) => { if (d > 0.85) P(g, x, y, gd[3]); });   // rim
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI; P(g, Math.round(cx + Math.cos(a) * r * 0.7), Math.round(cy - Math.abs(Math.sin(a)) * r * 0.5), gd[0]); }   // loose straw
  }
  // two on the ground, one stacked on top
  bale(11, baseY - 6, 9); bale(29, baseY - 6, 9); bale(20, baseY - 15, 8);
  outline(g, RAMP.void);
  return g;
}

/* =============================== OLD CAMPFIRE (32×28, faint 2f embers) =============================== */
function drawOldCampfire(frame) {
  frame = frame || 0;
  const g = makeGrid(32, 28), st = RAMP.stone, dt = RAMP.dirt, em = RAMP.ember, cx = 16, baseY = 25;
  // scorched ash patch
  ell(g, cx, baseY - 1, 12, 4, (x, y, d) => { if (d > 0.85 && (x + y) % 2) return; P(g, x, y, d < 0.4 ? RAMP.void : (hash2(x, y, 500) < 0.4 ? RAMP.ash : dt[3])); });
  // cold stone ring
  for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; const sx = Math.round(cx + Math.cos(ang) * 11), sy = Math.round(baseY - 2 + Math.sin(ang) * 4); shadeMass(g, sx, sy, 2.6, 2, st, 30 + a); }
  // charred crossed logs (cold, dark)
  for (let k = -6; k <= 6; k++) { P(g, cx + k, baseY - 3 + Math.round(k * 0.2), dt[3]); P(g, cx + k, baseY - 4 + Math.round(k * 0.2), RAMP.void); }
  for (let k = -6; k <= 6; k++) P(g, cx + Math.round(k * 0.25), baseY - 3 - Math.abs(Math.round(k * 0.2)), dt[3]);
  // a few faint embers still glowing (pulse per frame)
  const e = frame === 0 ? [[cx - 2, baseY - 3], [cx + 3, baseY - 2]] : [[cx, baseY - 3], [cx - 3, baseY - 2]];
  e.forEach(([x, y]) => { P(g, x, y, em[2]); P(g, x, y, frame === 0 ? em[1] : em[3]); });
  // a thin wisp of smoke
  P(g, cx, baseY - 6 - frame, RAMP.bone[3]); P(g, cx + (frame ? 1 : -1), baseY - 8, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== FENCE (48×20, tileable) =============================== */
function drawFence() {
  const g = makeGrid(48, 20), dt = RAMP.dirt, gr = RAMP.grass, baseY = 18;
  // posts at a tileable spacing (0, 16, 32, and a 48-edge post for seamless tiling)
  for (const px of [2, 18, 34]) { mpole(g, px, 4, baseY - 1, dt, 3); groundOval(g, px + 1, baseY, 4, 1.5, RAMP.void, px); }
  mpole(g, 46, 4, baseY - 1, dt, 2);   // edge post (meets the next tile's x=2 post region visually)
  // two split rails spanning the full width (run off both edges to tile)
  for (const ry of [7, 12]) for (let x = 0; x < 48; x++) { let c = dt[1]; if (x % 7 < 1) c = dt[3]; if (hash2(x, ry, 510) < 0.12) c = dt[2]; P(g, x, ry, c); P(g, x, ry + 1, dt[3]); }
  // grass along the base
  for (let i = 0; i < 12; i++) { const x = Math.floor(hash2(i, 1, 511) * 48); P(g, x, baseY - 1, gr[2]); }
  outline(g, RAMP.void);
  return g;
}

/* =============================== FISHING SPOT (40×28, 2f water lap) =============================== */
function drawFishingSpot(frame) {
  frame = frame || 0;
  const g = makeGrid(40, 28), dt = RAMP.dirt, wt = RAMP.water, bn = RAMP.bone, em = RAMP.ember, baseY = 25;
  // water area
  for (let y = baseY - 7; y <= baseY; y++) for (let x = 2; x < 38; x++) { let c = (x + y) % 2 === 0 ? wt[1] : wt[2]; if (y > baseY - 2) c = wt[3]; P(g, x, y, c); }
  // a tiny plank jetty jutting from the left bank
  mpole(g, 8, baseY - 6, baseY - 1, dt, 2); mpole(g, 16, baseY - 6, baseY - 1, dt, 2);   // posts
  for (let x = 3; x <= 22; x++) { const y = baseY - 8; for (let j = 0; j < 3; j++) { let c = dt[1]; if (j === 0) c = dt[0]; if (j === 2) c = dt[3]; P(g, x, y + j, c); } if (x % 6 === 0) P(g, x, y, dt[3]); }
  // bank / grass behind the jetty
  for (let x = 0; x < 6; x++) for (let y = baseY - 10; y <= baseY; y++) P(g, x, y, RAMP.grass[2]);
  // a fishing float bobbing on the water (laps per frame) + ripple ring
  const fx = 30, fy = baseY - 4 + (frame === 1 ? 1 : 0);
  P(g, fx, fy - 1, bn[0]); P(g, fx, fy, em[1]); P(g, fx, fy + 1, em[2]);
  for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; const rx = Math.round(fx + Math.cos(ang) * (frame === 0 ? 3 : 4)), ry = Math.round(fy + Math.sin(ang) * (frame === 0 ? 1.5 : 2)); P(g, rx, ry, wt[0]); }
  // a thin fishing line from the jetty to the float
  for (let x = 22; x <= fx; x++) P(g, x, baseY - 8 + Math.round((x - 22) / (fx - 22) * (fy - (baseY - 8))), bn[3]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== BRIDGE (96×40) =============================== */
function drawBridge() {
  const g = makeGrid(96, 40), dt = RAMP.dirt, wt = RAMP.water, st = RAMP.stone, baseY = 34, cx = 48;
  // a gap with water below
  for (let y = baseY - 2; y <= baseY + 4; y++) for (let x = 4; x < 92; x++) { if (y > 38) break; let c = (x + y) % 2 === 0 ? wt[1] : wt[2]; P(g, x, y, c); }
  // support posts down into the gap
  for (const px of [16, 48, 80]) { mpole(g, px, baseY - 4, baseY + 3, dt, 3); P(g, px, baseY + 3, wt[0]); P(g, px + 4, baseY + 3, wt[0]); }
  // a gently arched plank deck spanning the width
  for (let x = 2; x <= 93; x++) {
    const t = (x - 47.5) / 47.5;
    const y = baseY - 8 - Math.round((1 - t * t) * 4);   // arch
    for (let j = 0; j < 4; j++) { let c = dt[1]; if (j === 0) c = dt[0]; if (j === 3) c = dt[3]; P(g, x, y + j, c); }
    if (x % 6 === 0) for (let j = 0; j < 4; j++) P(g, x, y + j, dt[3]);   // plank gaps
  }
  // hand rails (posts + top rail) following the arch
  for (let x = 4; x <= 91; x += 1) { const t = (x - 47.5) / 47.5; const y = baseY - 8 - Math.round((1 - t * t) * 4); if (x % 12 === 0) for (let k = 1; k <= 5; k++) P(g, x, y - k, dt[2]); }
  for (let x = 4; x <= 91; x++) { const t = (x - 47.5) / 47.5; const y = baseY - 13 - Math.round((1 - t * t) * 4); P(g, x, y, dt[2]); P(g, x, y + 1, dt[3]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const MICROPOI = {
  well:            { fn: () => drawWell(),            cell: [32, 40], anchor: [16, 37] },
  signpost:        { fn: () => drawSignpost(),        cell: [24, 40], anchor: [11, 37] },
  wagon_wreck:     { fn: () => drawWagonWreck(),      cell: [64, 40], anchor: [32, 37], footprint: '2x1' },
  ruined_hut:      { fn: () => drawRuinedHut(),       cell: [80, 72], anchor: [40, 68], footprint: '3x3' },
  grave_row:       { fn: () => drawGraveRow(),        cell: [64, 32], anchor: [32, 29], ground: true },
  standing_stones: { fn: (i) => drawStandingStones(i),cell: [64, 72], anchor: [32, 68], frames: 2, anim: { name: 'shimmer', fps: 2, loop: true }, footprint: '2x2' },
  scarecrow:       { fn: () => drawScarecrow(),       cell: [24, 44], anchor: [11, 41] },
  beehive:         { fn: (i) => drawBeehive(i),       cell: [20, 28], anchor: [10, 25], frames: 2, anim: { name: 'bees', fps: 3, loop: true } },
  hay_bales:       { fn: () => drawHayBales(),        cell: [40, 24], anchor: [20, 22] },
  old_campfire:    { fn: (i) => drawOldCampfire(i),   cell: [32, 28], anchor: [16, 25], frames: 2, anim: { name: 'embers', fps: 2, loop: true } },
  fence:           { fn: () => drawFence(),           cell: [48, 20], anchor: [24, 18], tileable: 'x' },
  fishing_spot:    { fn: (i) => drawFishingSpot(i),   cell: [40, 28], anchor: [20, 25], frames: 2, anim: { name: 'water_lap', fps: 2, loop: true } },
  bridge:          { fn: () => drawBridge(),          cell: [96, 40], anchor: [48, 34], footprint: '3x1' },
};

Object.assign(globalThis, {
  mpole, mplank, mcrate, groundOval,
  drawWell, drawSignpost, drawWagonWreck, drawRuinedHut, drawGraveRow, drawStandingStones,
  drawScarecrow, drawBeehive, drawHayBales, drawOldCampfire, drawFence, drawFishingSpot, drawBridge,
  MICROPOI,
});
