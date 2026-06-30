// Naevyr "FILL THE REALM" · GROUND COVER & BIOME DOODADS — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2 from tiles.js; ell/shadeMass/moteBurst from beasts.js).
//
// Small native-size doodads, BOTTOM-CENTER anchored, 2 variants each (engine picks per cell),
// grouped by biome so each region reads distinct. RAMP only, 1px #0a0810 void outline on
// billboards, dither not blur, moonlit-left / shadowed-right.
//   EXCEPTION — ground-flat decor (clover, lilypad, mud, rubble, charred_bone): sink into the
//   ground like floor tiles — soft dithered edges, NO billboard outline. (spec.flat = true)
//
// Registry entry: { fn(variant, frame), cell:[w,h], anchor:[x,y], biome, variants(=2),
//   frames(=1), flat?, anim?{name,fps} }.  Variants laid major, frames minor, left-to-right.

/* ----------------------------- shared doodad helpers ----------------------------- */
// a tapering plant stem from (x,baseY) up to height h, optional lean
function stem(g, x, baseY, h, ramp, lean) {
  lean = lean || 0;
  for (let k = 0; k < h; k++) {
    const t = k / h, sx = Math.round(x + lean * t);
    let c = ramp[1]; if (k > h - 2) c = ramp[2];
    P(g, sx, baseY - k, c);
    if (k % 3 === 1) P(g, sx - 1, baseY - k, ramp[2]);   // shade side
  }
}
// dithered leafy volume (moonlit-left), seed varies the speckle
function leafMass(g, cx, cy, rx, ry, ramp, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    let c = ramp[1];
    if (dx + dy < -0.45) c = ramp[0];                    // moonlit top-left
    else if (dx + dy > 0.45) c = ramp[2];                // shaded lower-right
    if (d > 0.74) c = ramp[2];
    if (hash2(x, y, seed) < 0.12) c = ramp[2];           // leaf dither
    if (hash2(x, y, seed + 7) < 0.05) c = ramp[3];       // deep gaps
    P(g, x, y, c);
  });
}
// a 4-petal bloom around (x,y) in petal ramp, center dot in core ramp
function bloom(g, x, y, petal, core) {
  P(g, x - 1, y, petal[1]); P(g, x + 1, y, petal[1]);
  P(g, x, y - 1, petal[0]); P(g, x, y + 1, petal[2]);
  P(g, x, y, core);
}
// soft dithered ground splotch (flat decor) — no outline; rim fades by dither
function groundSplotch(g, cx, cy, rx, ry, fn, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    if (d > 0.9 && (x + y) % 2 === 1) return;            // 50% dithered rim
    if (d > 0.7 && hash2(x, y, seed) < 0.35) return;
    fn(x, y, d, dx, dy);
  });
}
// finish a billboard doodad (outline) unless flat
function fin(g, flat) { if (!flat) outline(g, RAMP.void); return g; }

/* =============================== MEADOW / HEARTLAND =============================== */

function drawWildflower(v) {
  const g = makeGrid(14, 14), gr = RAMP.grass, dr = RAMP.drift, gd = RAMP.gold, baseY = 13;
  const stalks = v === 0 ? [[5, 9, 1], [9, 11, -1], [7, 7, 0]] : [[4, 8, 1], [8, 10, 0], [10, 8, -1], [6, 6, 1]];
  stalks.forEach(([x, h, ln], i) => {
    stem(g, x, baseY, h, gr, ln);
    const bx = Math.round(x + ln * (h / 14)), by = baseY - h;
    const petal = (i + v) % 2 === 0 ? dr : gd;
    bloom(g, bx, by, petal, (i % 2 ? gd[0] : dr[0]));
  });
  // a couple low leaves
  P(g, 3, baseY - 1, gr[2]); P(g, 11, baseY - 1, gr[2]);
  return fin(g);
}

function drawDaisies(v) {
  const g = makeGrid(14, 10), gr = RAMP.grass, bn = RAMP.bone, gd = RAMP.gold, baseY = 9;
  const heads = v === 0 ? [[4, 4], [9, 5], [6, 2]] : [[3, 5], [7, 3], [10, 4], [5, 6]];
  heads.forEach(([x, y]) => {
    stem(g, x, baseY, baseY - y, gr, 0);
    // ring of bone petals + gold center
    [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], i) => P(g, x + dx, y + dy, i % 2 ? bn[1] : bn[0]));
    P(g, x, y, gd[1]);
  });
  return fin(g);
}

function drawClover(v) {  // FLAT ground patch
  const g = makeGrid(12, 8), gr = RAMP.grass, seed = 210 + v;
  groundSplotch(g, 6, 4, 6, 3.5, (x, y, d) => {
    let c = gr[1]; if (d < 0.3) c = gr[0]; if (hash2(x, y, seed) < 0.3) c = gr[2];
    P(g, x, y, c);
  }, seed);
  // a few three-leaf clover dots
  const cl = v === 0 ? [[3, 3], [8, 4], [6, 5]] : [[4, 5], [9, 3], [5, 2], [8, 6]];
  cl.forEach(([x, y]) => { P(g, x, y, gr[0]); P(g, x - 1, y, gr[1]); P(g, x + 1, y, gr[1]); P(g, x, y - 1, gr[1]); });
  return fin(g, true);
}

function drawBush(v) {
  const g = makeGrid(20, 18), gr = RAMP.grass, baseY = 16;
  // rounded leafy shrub — a cluster of overlapping leaf masses
  const lobes = v === 0 ? [[10, 10, 8, 6], [6, 12, 5, 4], [14, 12, 5, 4]] : [[8, 9, 6, 5], [13, 11, 6, 5], [10, 13, 7, 4]];
  lobes.forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 220 + v * 3 + i));
  // a little trunk peeking at the base
  P(g, 10, baseY - 1, RAMP.dirt[2]); P(g, 10, baseY, RAMP.dirt[3]);
  return fin(g);
}

function drawFern(v) {
  const g = makeGrid(16, 16), gr = RAMP.grass, baseY = 15, cx = 8;
  const fronds = v === 0 ? [[-1.1, 12], [-0.5, 14], [0.1, 14], [0.7, 13], [1.2, 11]] : [[-1.3, 11], [-0.7, 13], [0, 15], [0.7, 13], [1.3, 11]];
  fronds.forEach(([slope, len], fi) => {
    for (let k = 0; k < len; k++) {
      const t = k / len;
      const x = Math.round(cx + slope * k * 0.7);
      const y = baseY - k;
      let c = gr[1]; if (slope < 0) c = gr[0]; if (k > len - 2) c = gr[2];
      P(g, x, y, c);
      // leaflets along the arc
      if (k > 1 && k % 2 === 0) { P(g, x - 1, y, gr[2]); P(g, x + 1, y, gr[1]); }
    }
  });
  return fin(g);
}

function drawTallgrass(v) {
  const g = makeGrid(16, 16), gr = RAMP.grass, baseY = 15;
  const blades = v === 0 ? [[3, 11, 1], [5, 14, 0], [7, 12, -1], [9, 15, 1], [11, 13, 0], [13, 10, -1]]
                         : [[2, 10, 1], [4, 13, 0], [6, 15, -1], [8, 12, 1], [10, 14, 0], [12, 11, -1], [14, 9, 1]];
  blades.forEach(([x, h, curl]) => {
    for (let k = 0; k < h; k++) {
      const t = k / h, sx = Math.round(x + curl * t * 2.5);
      let c = gr[1]; if (curl < 0) c = gr[2]; if (k > h - 2) c = gr[0];
      P(g, sx, baseY - k, c);
    }
  });
  return fin(g);
}

function drawMeadowMushroom(v) {
  const g = makeGrid(12, 10), bn = RAMP.bone, bl = RAMP.blood, em = RAMP.ember, baseY = 9;
  const caps = v === 0 ? [[4, 4, 2, bl], [8, 5, 2, em]] : [[3, 5, 2, em], [6, 3, 3, bl], [9, 6, 2, bl]];
  caps.forEach(([x, y, r, cap]) => {
    // stalk
    for (let k = y + 1; k <= baseY; k++) { P(g, x, k, bn[1]); P(g, x, k, k > baseY - 1 ? bn[2] : bn[1]); }
    // domed cap
    ell(g, x, y, r, r * 0.8, (px, py, d, dx, dy) => { if (py > y) return; let c = cap[1]; if (dy < -0.3) c = cap[0]; if (d > 0.7) c = cap[2]; P(g, px, py, c); });
    P(g, x - 1, y, bn[0]); P(g, x + 1, y - 1, cap[0]);   // spots
  });
  return fin(g);
}

/* =============================== WOODLAND / GROVES =============================== */

function drawGroveTree(v) {  // 2 silhouettes; walk-through decorative tree
  const g = makeGrid(32, 40), gr = RAMP.grass, dt = RAMP.dirt, baseY = 38, cx = 16;
  // trunk
  const trunkH = v === 0 ? 16 : 13;
  for (let y = baseY; y >= baseY - trunkH; y--) {
    const w = y > baseY - 3 ? 4 : 3;
    for (let i = -w; i <= w; i++) { let c = dt[1]; if (i < -w + 1) c = dt[0]; if (i > w - 1) c = dt[3]; if (hash2(cx + i, y, 30) < 0.1) c = dt[2]; P(g, cx + i, y, c); }
  }
  // a couple of root flares + low branch
  P(g, cx - 5, baseY, dt[2]); P(g, cx + 5, baseY, dt[3]);
  if (v === 0) { for (let k = 0; k < 5; k++) P(g, cx + 3 + k, baseY - 12 - k, dt[2]); }
  // canopy — variant 0 = broad round; variant 1 = taller, two-tier
  if (v === 0) {
    [[16, 13, 13, 10], [9, 16, 7, 6], [23, 16, 7, 6], [16, 8, 9, 7]].forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 31 + i));
  } else {
    [[16, 9, 10, 8], [11, 16, 7, 6], [21, 16, 7, 6], [16, 18, 9, 6]].forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 41 + i));
  }
  return fin(g);
}

function drawLog(v) {
  const g = makeGrid(24, 12), dt = RAMP.dirt, gr = RAMP.grass, bn = RAMP.bone, baseY = 10;
  // horizontal fallen log
  for (let y = baseY - 6; y <= baseY; y++) for (let x = 2; x <= 21; x++) {
    let c = dt[1]; if (y < baseY - 4) c = dt[0]; if (y > baseY - 2) c = dt[3];
    if (hash2(x, y, 50 + v) < 0.1) c = dt[2];            // bark grain
    P(g, x, y, c);
  }
  // sawn end-rings at one end
  ell(g, v === 0 ? 3 : 21, baseY - 3, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2]));
  // mossy top
  for (let x = 4; x <= 19; x++) if (hash2(x, 0, 51 + v) < 0.5) P(g, x, baseY - 6, gr[2]);
  for (let x = 4; x <= 19; x++) if (hash2(x, 1, 52 + v) < 0.25) P(g, x, baseY - 5, gr[1]);
  return fin(g);
}

function drawStump(v) {
  const g = makeGrid(16, 14), dt = RAMP.dirt, bn = RAMP.bone, gr = RAMP.grass, baseY = 13, cx = 8;
  const top = baseY - (v === 0 ? 8 : 6);
  for (let y = top; y <= baseY; y++) {
    const w = 5;
    for (let x = cx - w; x <= cx + w; x++) { let c = dt[1]; if (x < cx - w + 2) c = dt[0]; if (x > cx + w - 2) c = dt[3]; if (x % 3 === 0 && hash2(x, y, 60) < 0.6) c = dt[3]; P(g, x, y, c); }
  }
  // end-grain rings
  ell(g, cx, top, 5, 2, (x, y, d) => { let c = dt[2]; if (d < 0.3) c = bn[3]; if (d > 0.7) c = dt[1]; P(g, x, y, c); });
  ell(g, cx, top, 3, 1.2, (x, y, d) => { if (d > 0.6) P(g, x, y, dt[3]); });
  if (v === 1) { P(g, cx + 2, top, gr[2]); P(g, cx - 3, baseY - 1, gr[2]); }   // moss
  return fin(g);
}

function drawSapling(v) {
  const g = makeGrid(14, 20), gr = RAMP.grass, dt = RAMP.dirt, baseY = 19, cx = 7;
  const h = v === 0 ? 13 : 15;
  stem(g, cx, baseY, h, dt, v === 0 ? 1 : -1);
  // a few small leaf tufts up the thin stem
  const ty = baseY - h;
  const tufts = v === 0 ? [[cx + 1, ty, 4, 3], [cx - 2, ty + 4, 3, 2], [cx + 3, ty + 6, 3, 2]] : [[cx - 1, ty, 4, 3], [cx + 2, ty + 4, 3, 2], [cx - 3, ty + 7, 3, 2]];
  tufts.forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 70 + v + i));
  return fin(g);
}

function drawToadstool(v) {
  const g = makeGrid(12, 12), bn = RAMP.bone, bl = RAMP.blood, dr = RAMP.drift, baseY = 11;
  const cx = v === 0 ? 6 : 5, capColor = v === 0 ? bl : dr;
  // fat stalk
  for (let y = 4; y <= baseY; y++) { const w = y > baseY - 2 ? 2 : 1; for (let i = -w; i <= w; i++) P(g, cx + i, y, i < 0 ? bn[0] : bn[1]); }
  // broad domed cap
  ell(g, cx, 4, 5, 3.5, (x, y, d, dx, dy) => { if (y > 5) return; let c = capColor[1]; if (dy < -0.3) c = capColor[0]; if (d > 0.7) c = capColor[2]; P(g, x, y, c); });
  // pale spots
  [[cx - 2, 3], [cx + 2, 3], [cx, 2], [cx + 1, 5]].forEach(([x, y]) => P(g, x, y, bn[0]));
  if (v === 1) { P(g, cx, 1, dr[0]); }                  // drift glow tip
  // a small companion
  if (v === 0) { for (let y = 8; y <= baseY; y++) P(g, 10, y, bn[1]); ell(g, 10, 8, 2, 1.5, (x, y, d) => { if (y > 8) return; P(g, x, y, d > 0.6 ? bl[2] : bl[1]); }); }
  return fin(g);
}

/* =============================== HIGHLAND (Ashen Flats stone) =============================== */

function drawBoulder(v) {
  const g = makeGrid(22, 16), st = RAMP.stone, gr = RAMP.grass, baseY = 14, cx = 11;
  shadeMass(g, cx, baseY - 5, v === 0 ? 9 : 8, v === 0 ? 6 : 7, st, 80 + v);
  if (v === 1) shadeMass(g, 16, baseY - 3, 4, 3, st, 82);   // a second smaller rock
  // moss cap on the lit shoulder
  for (let x = cx - 6; x <= cx; x++) if (hash2(x, 0, 81 + v) < 0.45) P(g, x, baseY - 10 + Math.round(hash2(x, 1, 81) * 2), gr[2]);
  for (let x = cx - 5; x <= cx - 1; x++) if (hash2(x, 2, 81 + v) < 0.3) P(g, x, baseY - 9, gr[1]);
  return fin(g);
}

function drawRubble(v) {  // FLAT-ish scattered rock
  const g = makeGrid(16, 10), st = RAMP.stone, seed = 90 + v;
  const rocks = v === 0 ? [[4, 7, 3], [10, 8, 2], [7, 5, 2], [13, 6, 2]] : [[3, 6, 2], [6, 8, 3], [11, 7, 2], [9, 5, 2], [13, 8, 2]];
  rocks.forEach(([x, y, r], i) => {
    ell(g, x, y, r, r * 0.7, (px, py, d, dx, dy) => { let c = st[1]; if (dx + dy < -0.3) c = st[0]; if (d > 0.7) c = st[2]; if (py > y) c = st[3]; P(g, px, py, c); });
  });
  // a little gravel dither between
  for (let i = 0; i < 6; i++) { const x = 2 + Math.floor(hash2(i, 1, seed) * 12), y = 4 + Math.floor(hash2(i, 2, seed) * 5); P(g, x, y, st[2]); }
  return fin(g, true);
}

/* =============================== MARSH (Hollowmere) =============================== */

function drawCattail(v) {
  const g = makeGrid(14, 20), gr = RAMP.grass, dt = RAMP.dirt, baseY = 19;
  const reeds = v === 0 ? [[4, 16, 1], [7, 18, 0], [10, 15, -1]] : [[3, 14, 1], [6, 17, 0], [9, 18, -1], [11, 13, 1]];
  reeds.forEach(([x, h, ln], i) => {
    for (let k = 0; k < h; k++) { const sx = Math.round(x + ln * (k / h)); P(g, sx, baseY - k, k > h - 2 ? gr[0] : gr[1]); if (k % 4 === 2) P(g, sx - 1, baseY - k, gr[2]); }
    // brown bulrush head on some reeds
    if (i % 2 === 0) { const hx = Math.round(x + ln), hy = baseY - h; for (let k = 0; k < 5; k++) for (let i2 = -1; i2 <= 1; i2++) { let c = dt[2]; if (i2 < 0) c = dt[1]; if (i2 > 0) c = dt[3]; P(g, hx + i2, hy + k, c); } P(g, hx, hy - 1, dt[2]); }
  });
  return fin(g);
}

function drawLilypad(v, f) {  // FLAT on water, 2f gentle bob
  const g = makeGrid(16, 8), gr = RAMP.grass, dr = RAMP.drift, wt = RAMP.water, seed = 100 + v;
  const bob = (f || 0) === 1 ? 1 : 0;
  const cx = 8, cy = 4 + bob;
  // round pad with the classic notch
  groundSplotch(g, cx, cy, v === 0 ? 7 : 6, 3.2, (x, y, d, dx, dy) => {
    if (dx > 0.3 && Math.abs(dy) < 0.25) return;          // V notch on the right
    let c = gr[1]; if (dx + dy < -0.3) c = gr[0]; if (d > 0.6) c = gr[2]; if (hash2(x, y, seed) < 0.12) c = gr[2];
    P(g, x, y, c);
  }, seed);
  // ripple ring + a drift bloom on one pad
  P(g, cx - 7, cy + 1, wt[0]); P(g, cx + 6, cy + 2, wt[0]);
  if (v === 0) { P(g, cx - 1, cy - 1, dr[0]); P(g, cx, cy - 2, dr[1]); P(g, cx + 1, cy - 1, dr[1]); P(g, cx, cy - 1, dr[0]); }
  return fin(g, true);
}

function drawMud(v) {  // FLAT wet-dirt splotch
  const g = makeGrid(16, 8), dt = RAMP.dirt, wt = RAMP.water, seed = 110 + v;
  groundSplotch(g, 8, 4, v === 0 ? 7 : 6.5, 3.4, (x, y, d, dx, dy) => {
    let c = dt[2]; if (d < 0.3) c = dt[3]; if (hash2(x, y, seed) < 0.2) c = dt[1];
    P(g, x, y, c);
  }, seed);
  // wet sheen puddles
  const pud = v === 0 ? [[6, 4], [10, 5]] : [[5, 3], [9, 5], [11, 4]];
  pud.forEach(([x, y]) => { P(g, x, y, wt[1]); P(g, x + 1, y, wt[0]); P(g, x, y + 1, wt[2]); });
  return fin(g, true);
}

/* =============================== ASH / WAR (Ashen Flats) =============================== */

function drawAshTuft(v) {
  const g = makeGrid(14, 10), em = RAMP.ember, baseY = 9;
  const ashgrey = ['#6f6781', '#564f6b', '#3a3450', '#211c30'];  // grey from bone[3]/stone tones
  const blades = v === 0 ? [[3, 6, 1], [6, 8, 0], [9, 6, -1], [11, 5, 1]] : [[2, 5, 1], [5, 7, 0], [8, 8, -1], [11, 6, 1]];
  blades.forEach(([x, h, ln]) => {
    for (let k = 0; k < h; k++) { const sx = Math.round(x + ln * (k / h)); let c = ashgrey[1]; if (ln < 0) c = ashgrey[2]; if (k > h - 2) c = ashgrey[0]; P(g, sx, baseY - k, c); }
  });
  // ember flecks smouldering at the base
  P(g, 5, baseY, em[1]); P(g, 9, baseY - 1, em[2]); if (v === 1) P(g, 7, baseY, em[0]);
  return fin(g);
}

function drawCharredBone(v) {  // FLAT burnt bone shards
  const g = makeGrid(16, 10), bn = RAMP.bone, em = RAMP.ember, seed = 120 + v;
  // scorched ground hint
  groundSplotch(g, 8, 7, 7, 2.5, (x, y, d) => P(g, x, y, RAMP.ash), seed);
  const shards = v === 0 ? [[3, 6, 5, 0.2], [9, 7, 4, -0.3], [6, 5, 3, 0.5]] : [[2, 7, 4, 0.1], [7, 6, 5, -0.2], [11, 7, 4, 0.3], [5, 5, 3, -0.4]];
  shards.forEach(([x, y, len, sl]) => {
    for (let k = 0; k < len; k++) { const px = x + k, py = y + Math.round(k * sl); let c = bn[2]; if (k < 1) c = RAMP.void; if (k > len - 2) c = bn[3]; P(g, px, py, c); P(g, px, py - 1, bn[1]); }
  });
  // a couple ember glints among the char
  P(g, 5, 8, em[2]); if (v === 0) P(g, 11, 8, em[1]);
  return fin(g, true);
}

function drawWarDebris(v) {
  const g = makeGrid(20, 12), st = RAMP.stone, dt = RAMP.dirt, bl = RAMP.blood, baseY = 11;
  // a broken round shield leaning
  const sx = v === 0 ? 7 : 12;
  ell(g, sx, baseY - 4, 5, 5, (x, y, d, dx, dy) => { let c = dt[1]; if (d < 0.25) c = dt[3]; if (dx + dy < -0.3) c = dt[0]; if (d > 0.78) c = dt[3]; P(g, x, y, c); });
  ell(g, sx, baseY - 4, 1.6, 1.6, (x, y) => P(g, x, y, st[1]));   // boss
  for (let k = -4; k <= 4; k++) if (k % 3 === 0) P(g, sx + k, baseY - 4, RAMP.void);  // splits
  P(g, sx - 2, baseY - 7, bl[2]); P(g, sx + 1, baseY - 6, bl[2]);  // blood stains
  // a snapped spear lying across
  const ex = v === 0 ? 13 : 4;
  for (let k = 0; k < 9; k++) P(g, ex + Math.round(k * (v === 0 ? 0.6 : -0.6)), baseY - 1 - Math.round(k * 0.3), dt[3]);
  const tipx = ex + Math.round(8 * (v === 0 ? 0.6 : -0.6)), tipy = baseY - 1 - Math.round(8 * 0.3);
  P(g, tipx, tipy, st[0]); P(g, tipx + (v === 0 ? 1 : -1), tipy - 1, st[1]);
  return fin(g);
}

/* =============================== BONEFIELDS (death) =============================== */

function drawSkull(v) {
  const g = makeGrid(12, 10), bn = RAMP.bone, dt = RAMP.dirt, baseY = 9, cx = 6;
  // half-buried — dirt mound at the base
  groundSplotch(g, cx, baseY, 6, 2, (x, y, d) => P(g, x, y, dt[3]), 130 + v);
  // cranium
  ell(g, cx, baseY - 4, 4, 3.6, (x, y, d, dx, dy) => { if (y > baseY - 1) return; let c = bn[2]; if (dy < -0.2) c = bn[1]; if (dx < -0.2) c = bn[0]; if (d > 0.78) c = bn[3]; P(g, x, y, c); });
  // eye sockets + nasal
  P(g, cx - 2, baseY - 4, RAMP.void); P(g, cx + 1, baseY - 4, RAMP.void);
  P(g, cx - 1, baseY - 2, RAMP.void);
  // teeth row
  for (let x = cx - 2; x <= cx + 1; x++) P(g, x, baseY - 1, bn[3]);
  if (v === 1) { ell(g, cx + 4, baseY - 1, 2, 1.5, (x, y) => P(g, x, y, bn[3])); }  // a stray jawbone
  return fin(g);
}

function drawGraveNub(v) {
  const g = makeGrid(14, 16), st = RAMP.stone, dt = RAMP.dirt, gr = RAMP.grass, baseY = 15, cx = 7;
  if (v === 0) {
    // leaning headstone
    const lean = 1;
    for (let y = baseY - 1; y >= 3; y--) { const t = (baseY - y) / 12; const w = 3; const off = Math.round(t * lean * 2); for (let i = -w; i <= w; i++) { let c = st[1]; if (i < -w + 1) c = st[0]; if (i > w - 1) c = st[3]; if (hash2(cx + i, y, 140) < 0.08) c = st[2]; P(g, cx + i + off, y, c); } }
    // rounded top + a carved line
    ell(g, cx + 2, 3, 3, 2, (x, y, d) => { if (y > 3) return; P(g, x, y, d > 0.6 ? st[3] : st[1]); });
    P(g, cx + 1, 7, st[3]); P(g, cx + 3, 7, st[3]);
  } else {
    // a small stacked cairn
    [[cx, baseY - 2, 4, 2.5], [cx - 1, baseY - 5, 3, 2], [cx + 1, baseY - 8, 2.5, 2], [cx, baseY - 10, 1.8, 1.5]].forEach(([x, y, rx, ry], i) => shadeMass(g, x, y, rx, ry, st, 141 + i));
  }
  // grass tufts at the base
  P(g, cx - 4, baseY, gr[1]); P(g, cx + 4, baseY, gr[2]);
  return fin(g);
}

function drawDeadShrub(v) {
  const g = makeGrid(16, 14), dt = RAMP.dirt, baseY = 13, cx = 8;
  // bare thorny branches radiating from a low base
  const branches = v === 0 ? [[-1.0, 10], [-0.4, 12], [0.2, 11], [0.8, 10], [1.3, 8]] : [[-1.3, 9], [-0.6, 11], [0, 12], [0.5, 11], [1.1, 9], [-0.2, 7]];
  branches.forEach(([slope, len], bi) => {
    let x = cx, y = baseY;
    for (let k = 0; k < len; k++) {
      x = Math.round(cx + slope * k * 0.8); y = baseY - k;
      let c = dt[2]; if (slope < 0) c = dt[1]; if (k > len - 2) c = dt[3];
      P(g, x, y, c);
      // thorns / twig forks
      if (k > 2 && k % 3 === 0) { P(g, x + (slope < 0 ? -1 : 1), y - 1, dt[3]); }
    }
  });
  // gnarled trunk base
  P(g, cx, baseY, dt[3]); P(g, cx - 1, baseY, dt[2]); P(g, cx + 1, baseY, dt[2]);
  return fin(g);
}

/* ============================ REGISTRY ============================ */
const GROUNDCOVER = {
  // meadow / heartland
  wildflower:       { fn: (v) => drawWildflower(v),    cell: [14, 14], anchor: [7, 13],  biome: 'meadow' },
  daisies:          { fn: (v) => drawDaisies(v),       cell: [14, 10], anchor: [7, 9],   biome: 'meadow' },
  clover:           { fn: (v) => drawClover(v),        cell: [12, 8],  anchor: [6, 7],   biome: 'meadow', flat: true },
  bush:             { fn: (v) => drawBush(v),          cell: [20, 18], anchor: [10, 16], biome: 'meadow' },
  fern:             { fn: (v) => drawFern(v),          cell: [16, 16], anchor: [8, 15],  biome: 'meadow' },
  tallgrass:        { fn: (v) => drawTallgrass(v),     cell: [16, 16], anchor: [8, 15],  biome: 'meadow' },
  meadow_mushroom:  { fn: (v) => drawMeadowMushroom(v),cell: [12, 10], anchor: [6, 9],   biome: 'meadow' },
  // woodland / groves
  grove_tree:       { fn: (v) => drawGroveTree(v),     cell: [32, 40], anchor: [16, 38], biome: 'woodland', footprint: '1x1 walk-through' },
  log:              { fn: (v) => drawLog(v),           cell: [24, 12], anchor: [12, 10], biome: 'woodland' },
  stump:            { fn: (v) => drawStump(v),         cell: [16, 14], anchor: [8, 13],  biome: 'woodland' },
  sapling:          { fn: (v) => drawSapling(v),       cell: [14, 20], anchor: [7, 19],  biome: 'woodland' },
  toadstool:        { fn: (v) => drawToadstool(v),     cell: [12, 12], anchor: [6, 11],  biome: 'woodland' },
  // highland (Ashen Flats stone)
  boulder:          { fn: (v) => drawBoulder(v),       cell: [22, 16], anchor: [11, 14], biome: 'highland' },
  rubble:           { fn: (v) => drawRubble(v),        cell: [16, 10], anchor: [8, 8],   biome: 'highland', flat: true },
  // marsh (Hollowmere)
  cattail:          { fn: (v) => drawCattail(v),       cell: [14, 20], anchor: [7, 19],  biome: 'marsh' },
  lilypad:          { fn: (v, f) => drawLilypad(v, f), cell: [16, 8],  anchor: [8, 6],   biome: 'marsh', flat: true, frames: 2, anim: { name: 'bob', fps: 2, loop: true } },
  mud:              { fn: (v) => drawMud(v),           cell: [16, 8],  anchor: [8, 6],   biome: 'marsh', flat: true },
  // ash / war (Ashen Flats)
  ash_tuft:         { fn: (v) => drawAshTuft(v),       cell: [14, 10], anchor: [7, 9],   biome: 'ash' },
  charred_bone:     { fn: (v) => drawCharredBone(v),   cell: [16, 10], anchor: [8, 8],   biome: 'ash', flat: true },
  war_debris:       { fn: (v) => drawWarDebris(v),     cell: [20, 12], anchor: [10, 11], biome: 'ash' },
  // bonefields (death)
  skull:            { fn: (v) => drawSkull(v),         cell: [12, 10], anchor: [6, 9],   biome: 'bonefields' },
  grave_nub:        { fn: (v) => drawGraveNub(v),      cell: [14, 16], anchor: [7, 15],  biome: 'bonefields' },
  dead_shrub:       { fn: (v) => drawDeadShrub(v),     cell: [16, 14], anchor: [8, 13],  biome: 'bonefields' },
};

Object.assign(globalThis, {
  stem, leafMass, bloom, groundSplotch, fin,
  drawWildflower, drawDaisies, drawClover, drawBush, drawFern, drawTallgrass, drawMeadowMushroom,
  drawGroveTree, drawLog, drawStump, drawSapling, drawToadstool,
  drawBoulder, drawRubble, drawCattail, drawLilypad, drawMud,
  drawAshTuft, drawCharredBone, drawWarDebris, drawSkull, drawGraveNub, drawDeadShrub,
  GROUNDCOVER,
});
