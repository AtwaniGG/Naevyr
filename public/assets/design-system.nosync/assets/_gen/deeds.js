// NAEVYR — DEEDS & HONORS badge set. Eval after pixlib.js (+ tiles.js for hash2).
//
// Earned honors for the Hall of Deeds — weathered heraldic emblems, NOT shiny
// game trophies. Same pixel language as Icon.jsx: 16×16 rect grid, 1px void
// outline (auto via outline()), 2–3 step locked-RAMP shade per material, crisp
// edges, dither (never blur), no anti-aliasing. Each reads as a 1em inline icon
// and matches the silhouette weight of the sword/coin/ward/drift glyphs.
//
//   5 category badges (16×16) — one heraldic emblem per deed line:
//     deed_blade   crossed swords · war          (steel/bone + blood)
//     deed_coin    struck coin + star · value    (gold)
//     deed_labor   anvil on a stump · toil        (steel + wood)
//     deed_endure  ward shield + drift boss       (bone + drift)
//     deed_realm   the Drift sigil · corruption   (drift-purple)
//   3 tier rings (16×16 OVERLAY, transparent center) — wrap a badge to show rank:
//     tier_bronze / tier_silver / tier_gold        laurel half-wreath + tie
//   deed_emblem (16×16 + 32×32) — the "Hall of Deeds" mark: a struck gold
//     medallion, a 4-point star, and a short ribbon. Panel / tab icon.
//
// Gold is OLD STRUCK METAL: lean on the y→g→G ramp (shadow→base→hi), never a
// flat bright yellow. Blood/drift are the only saturated accents.

/* ---- shared: paint a char-grid using a per-icon palette, then let
   outline() add the exterior 1px void. '.' / ' ' = skip; 'k' = explicit
   void (internal separators); any other char = pal[char]. -------------- */
function paintRows(g, rows, pal, ox, oy) {
  ox = ox || 0; oy = oy || 0;
  for (let y = 0; y < rows.length; y++) {
    const r = rows[y];
    for (let x = 0; x < r.length; x++) {
      const ch = r[x];
      if (ch === '.' || ch === ' ') continue;
      if (ch === 'k') { P(g, ox + x, oy + y, RAMP.void); continue; }
      const c = pal[ch];
      if (c) P(g, ox + x, oy + y, c);
    }
  }
}

// Char → hex, drawn from the locked RAMP only (mirrors Icon.jsx letters).
const DPAL = {
  // bone / steel
  h: RAMP.bone[0], L: RAMP.bone[1], o: RAMP.bone[2], q: RAMP.bone[3],
  // stone (dark steel)
  C: RAMP.stone[0], c: RAMP.stone[1], s: RAMP.stone[2],
  // gold (struck) — y shadow · g base · G hi
  G: RAMP.gold[0], g: RAMP.gold[1], y: RAMP.gold[2], Y: RAMP.gold[3],
  // blood
  R: RAMP.blood[0], r: RAMP.blood[1], B: RAMP.blood[2],
  // drift
  P: RAMP.drift[0], d: RAMP.drift[1], p: RAMP.drift[2], u: RAMP.drift[3], v: RAMP.drift[4],
  // wood / dirt
  W: RAMP.dirt[0], w: RAMP.dirt[1], x: RAMP.dirt[2],
  // ember (bronze warmth)
  E: RAMP.ember[0], e: RAMP.ember[1], F: RAMP.ember[2],
};

/* ===================================================================== */
/* 1 · DEED_BLADE — crossed swords bound at the cross (war)              */
/* ===================================================================== */
function deedBlade() {
  const g = makeGrid(16, 16);
  paintRows(g, [
    '................',
    '.h............h.',
    '.Ch..........hC.',
    '..Ch........hC..',
    '...Ch......hC...',
    '....Ch....hC....',
    '.....Ch..hC.....',
    '......RrrR......',
    '......RrrR......',
    '.....hC..Ch.....',
    '....hC....Ch....',
    '...gg......gg...',
    '..gWg......gWg..',
    '...G........G...',
    '..GGG......GGG..',
    '................',
  ], DPAL);
  outline(g);
  return g;
}

/* ===================================================================== */
/* 2 · DEED_COIN — old struck coin stamped with a 4-point star (value)   */
/* ===================================================================== */
function deedCoin() {
  const g = makeGrid(16, 16);
  paintRows(g, [
    '................',
    '.....ggggg......',
    '...ggGGGGGgg....',
    '..gGyyyyyyyGg...',
    '..gGy..G..yGg...',
    '.gGy..GGG..yGg..',
    '.gGy.GG.GG.yGg..',
    '.gGy.G...G.yGg..',
    '.gGy.GG.GG.yGg..',
    '.gGy..GGG..yGg..',
    '..gGy..G..yGg...',
    '..gGyyyyyyyGg...',
    '...ggGGGGGgg....',
    '.....ggggg......',
    '................',
    '................',
  ], DPAL);
  outline(g);
  return g;
}

/* ===================================================================== */
/* 3 · DEED_LABOR — anvil (steel) on a wood stump (toil)                 */
/* ===================================================================== */
function deedLabor() {
  const g = makeGrid(16, 16);
  paintRows(g, [
    '................',
    '................',
    '...CCCCCCCC.....',
    '.CCCsssssssC....',
    'CCCssssssssC....',
    '..CCsssssCC.....',
    '....CssssC......',
    '....CssssC......',
    '...CCssssCC.....',
    '..CCCCCCCCCC....',
    '..WWWWWWWWWW....',
    '..WwwwwwwwwW....',
    '..WwxWWWWxwW....',
    '..WwwwwwwwwW....',
    '..WWWWWWWWWW....',
    '................',
  ], DPAL);
  outline(g);
  return g;
}

/* ===================================================================== */
/* 4 · DEED_ENDURE — bone ward shield with a Drift boss (endurance)      */
/* ===================================================================== */
function deedEndure() {
  const g = makeGrid(16, 16);
  const o = RAMP.bone[2], L = RAMP.bone[1], q = RAMP.bone[3], dr = RAMP.drift;
  // heater-shield silhouette: y -> [x0, x1] body span (frame = the endpoints)
  const span = [
    [1, 3, 10], [2, 2, 11], [3, 2, 11], [4, 2, 11], [5, 2, 11], [6, 2, 11],
    [7, 2, 11], [8, 3, 10], [9, 3, 10], [10, 4, 9], [11, 4, 9], [12, 5, 8], [13, 6, 7],
  ];
  span.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) {
      let c = o;                 // weathered pewter body
      if (x === x0) c = L;       // moonlit left edge
      else if (x === x1) c = q;  // shadowed right edge
      if (y === 1) c = L;        // top rim catches the light
      P(g, x, y, c);
    }
  });
  // recessed Drift boss (the ward that endures), center of the field
  const bx = 4, by = 3;
  for (let d = 0; d < 5; d++) { P(g, bx + d, by, dr[3]); P(g, bx + d, by + 3, dr[3]); }
  for (let d = 0; d < 4; d++) { P(g, bx, by + d, dr[3]); P(g, bx + 4, by + d, dr[3]); }
  P(g, bx + 1, by + 1, dr[2]); P(g, bx + 2, by + 1, dr[1]); P(g, bx + 3, by + 1, dr[2]);
  P(g, bx + 1, by + 2, dr[2]); P(g, bx + 2, by + 2, dr[0]); P(g, bx + 3, by + 2, dr[2]);
  outline(g);
  return g;
}

/* ===================================================================== */
/* 5 · DEED_REALM — the Drift sigil: glowing core + 4 spikes (corruption)*/
/* ===================================================================== */
function deedRealm() {
  const g = makeGrid(16, 16);
  const dr = RAMP.drift;
  const cx = 7, cy = 7;
  // bright diamond core (2×2 hi, ringed by mid)
  P(g, cx, cy, dr[0]); P(g, cx + 1, cy, dr[0]);
  P(g, cx, cy + 1, dr[0]); P(g, cx + 1, cy + 1, dr[0]);
  P(g, cx, cy - 1, dr[1]); P(g, cx + 1, cy - 1, dr[1]);
  P(g, cx, cy + 2, dr[1]); P(g, cx + 1, cy + 2, dr[1]);
  P(g, cx - 1, cy, dr[1]); P(g, cx - 1, cy + 1, dr[1]);
  P(g, cx + 2, cy, dr[1]); P(g, cx + 2, cy + 1, dr[1]);
  // four orthogonal spikes (taper mid→deep)
  for (let i = 2; i <= 5; i++) {
    const c = i <= 3 ? dr[2] : dr[3];
    P(g, cx, cy - i, c); P(g, cx + 1, cy - i, c);        // up
    P(g, cx, cy + 1 + i, c); P(g, cx + 1, cy + 1 + i, c); // down
    P(g, cx - i, cy, c); P(g, cx - i, cy + 1, c);         // left
    P(g, cx + 1 + i, cy, c); P(g, cx + 1 + i, cy + 1, c); // right
  }
  // diagonal dither motes (corruption flecks, glow — drawn, no outline added by spikes)
  [[cx - 3, cy - 3], [cx + 4, cy - 3], [cx - 3, cy + 4], [cx + 4, cy + 4]].forEach(([mx, my]) => {
    P(g, mx, my, dr[2]); P(g, mx + (mx < cx ? 1 : -1), my + (my < cy ? 1 : -1), dr[3]);
  });
  outline(g);
  return g;
}

/* ===================================================================== */
/* TIER RINGS — 16×16 laurel half-wreath OVERLAY (transparent center)    */
/* ===================================================================== */
// bronze = warm ember ramp · silver = cool bone ramp · gold = struck gold ramp.
function tierRing(metal) {
  const g = makeGrid(16, 16);
  const R = metal === 'gold' ? RAMP.gold : metal === 'silver' ? RAMP.bone : RAMP.ember;
  // bottom tie knot
  P(g, 7, 14, R[1]); P(g, 8, 14, R[1]);
  P(g, 6, 14, R[2]); P(g, 9, 14, R[2]);
  P(g, 7, 13, R[0]); P(g, 8, 13, R[0]);
  // leaves climbing each side from the tie, open at the top.
  // [base x, base y] of each left-side leaf; mirrored to the right.
  const leaves = [[4, 13], [3, 11], [2, 9], [2, 7], [3, 5], [4, 3]];
  leaves.forEach(([lx, ly], i) => {
    const lite = i % 2 ? R[0] : R[1];
    // left leaf — small dash angled up-and-out
    P(g, lx, ly, R[1]);
    P(g, lx - 1, ly - 1, lite);
    P(g, lx, ly - 1, R[0]);
    P(g, lx + 1, ly, R[2]);
    // mirrored right leaf
    const rx = 15 - lx;
    P(g, rx, ly, R[1]);
    P(g, rx + 1, ly - 1, lite);
    P(g, rx, ly - 1, R[0]);
    P(g, rx - 1, ly, R[2]);
  });
  outline(g);
  return g;
}

/* ===================================================================== */
/* DEED_EMBLEM — the Hall of Deeds mark (16×16 inline + 32×32 panel)     */
/* ===================================================================== */
function deedEmblem16() {
  const g = makeGrid(16, 16);
  paintRows(g, [
    '................',
    '....ggggg.......',
    '..ggGyyyGgg.....',
    '.ggGyyyyyGgg....',
    '.gGyy.G.yyGg....',
    '.gGy.GGG.yGg....',
    '.gGyyGGGyyGg....',
    '.gGy.GGG.yGg....',
    '.gGyy.G.yyGg....',
    '.ggGyyyyyGgg....',
    '..ggGyyyGgg.....',
    '....ggggg.......',
    '...Rr...rR......',
    '...Rr...rR......',
    '...rR...Rr......',
    '....r...r.......',
  ], DPAL);
  outline(g);
  return g;
}

function deedEmblem32() {
  const g = makeGrid(32, 32);
  const gd = RAMP.gold, bl = RAMP.blood;
  const cx = 15.5, cy = 13;
  const rO = 11;          // outer disc radius
  // ---- ribbon (behind disc): two forked tails, struck blood ----
  for (let y = 22; y <= 31; y++) {
    const k = y - 22;
    // left tail
    for (let x = 11; x <= 14; x++) {
      if (k >= 7 && x >= 13) continue;              // forked notch
      P(g, x - Math.floor(k * 0.15), y, x === 11 ? bl[2] : x === 14 ? bl[2] : bl[1]);
    }
    // right tail (mirror)
    for (let x = 17; x <= 20; x++) {
      if (k >= 7 && x <= 18) continue;
      P(g, x + Math.floor(k * 0.15), y, x === 20 ? bl[2] : x === 17 ? bl[2] : bl[1]);
    }
  }
  // ribbon highlight threads
  for (let y = 22; y <= 28; y++) { P(g, 12, y, bl[0]); P(g, 19, y, bl[0]); }

  // ---- struck gold medallion disc ----
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
    if (d > rO) continue;
    let c;
    if (d > rO - 1.4) c = gd[3];                    // dark struck edge
    else if (d > rO - 3) c = gd[2];                 // bevel shadow
    else c = gd[1];                                 // base field
    // top-left moonlit catch
    if (dx + dy < -rO * 0.5 && d <= rO - 1) c = gd[0];
    if (dx + dy < -rO * 0.78 && d <= rO - 2) c = gd[0];
    P(g, x, y, c);
  }
  // inner rule ring (dull groove)
  for (let a = 0; a < 360; a += 5) {
    const rr = rO - 3.4;
    const x = Math.round(cx + Math.cos(a * Math.PI / 180) * rr);
    const y = Math.round(cy + Math.sin(a * Math.PI / 180) * rr);
    P(g, x, y, gd[3]);
  }
  // weathered struck mottle — break up the flat field so it reads as old metal
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
    if (d > rO - 4 || d < 2) continue;
    if (hash2(x, y, 91) < 0.10) P(g, x, y, gd[2]);
  }

  // ---- 4-point star struck into the field (embossed: lit upper-left, shadow lower-right) ----
  const sx = 15, sy = 12;
  for (let i = 1; i <= 7; i++) {
    P(g, sx, sy - i, gd[0]);     P(g, sx + 1, sy - i, i <= 3 ? gd[0] : gd[1]);     // up (lit)
    P(g, sx - i, sy, gd[0]);     P(g, sx - i, sy + 1, i <= 3 ? gd[0] : gd[1]);     // left (lit)
    P(g, sx, sy + 1 + i, i <= 3 ? gd[2] : gd[3]); P(g, sx + 1, sy + 1 + i, gd[3]); // down (shadow)
    P(g, sx + 1 + i, sy, i <= 3 ? gd[2] : gd[3]); P(g, sx + 1 + i, sy + 1, gd[3]); // right (shadow)
  }
  for (let dy = -2; dy <= 3; dy++) for (let dx = -2; dx <= 3; dx++) {
    if (Math.abs(dx - 0.5) + Math.abs(dy - 0.5) <= 2.5) {
      P(g, sx + dx, sy + dy, (dx + dy) < 1 ? gd[0] : gd[3]);
    }
  }
  outline(g);
  // tiny drift fleck on the rim (the honor is touched by the realm's decay)
  P(g, 24, 7, RAMP.drift[2]); P(g, 25, 8, RAMP.drift[3]);
  return g;
}

/* ===================================================================== */
/* METADATA                                                              */
/* ===================================================================== */
const DEED_BADGES = {
  deed_blade:  { fn: deedBlade,  cell: 16, ramp: 'steel/bone + blood', motif: 'crossed swords bound at the cross', line: 'War' },
  deed_coin:   { fn: deedCoin,   cell: 16, ramp: 'gold (struck)',      motif: 'old coin stamped with a 4-point star', line: 'Value' },
  deed_labor:  { fn: deedLabor,  cell: 16, ramp: 'steel + wood',       motif: 'anvil on a wood stump', line: 'Toil' },
  deed_endure: { fn: deedEndure, cell: 16, ramp: 'bone + drift',       motif: 'ward shield with a Drift boss', line: 'Endurance' },
  deed_realm:  { fn: deedRealm,  cell: 16, ramp: 'drift-purple',       motif: 'the Drift sigil — core + four spikes', line: 'The Realm' },
};
const DEED_TIERS = {
  tier_bronze: { metal: 'bronze', cell: 16, ramp: 'ember (warm)', overlay: true },
  tier_silver: { metal: 'silver', cell: 16, ramp: 'bone (cool)',  overlay: true },
  tier_gold:   { metal: 'gold',   cell: 16, ramp: 'gold (struck)', overlay: true },
};
const DEEDS = {
  theme: 'earned honors · weathered heraldry · old struck gold, not shiny trophies',
  badges: DEED_BADGES,
  tiers: DEED_TIERS,
  emblem: { cell: [16, 32], ramp: 'gold + blood (ribbon) + drift (fleck)', motif: 'medallion · 4-point star · short ribbon', use: 'Hall of Deeds panel / tab icon' },
};

Object.assign(globalThis, {
  paintRows, DPAL,
  deedBlade, deedCoin, deedLabor, deedEndure, deedRealm,
  tierRing, deedEmblem16, deedEmblem32,
  DEED_BADGES, DEED_TIERS, DEEDS,
});
