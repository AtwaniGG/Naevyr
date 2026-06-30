// Naevyr "FILL THE REALM" · BIOME TILE ACCENTS — eval after pixlib.js + tiles.js.
// (uses makeBaseTile/diamondRows/inDiamond/hash2 from tiles.js + pixlib.)
//
// 64×32 iso GROUND-TILE variants, drawn as the base tile per region so the terrain itself
// differs by biome. Diamond-center anchored (32,16) like drawFloor interior tiles —
// these are floor tiles, NOT billboards: no void outline on the face, accents dither into
// the surface. Cell 64×36 (32px diamond face + 3px south lip), tile 64×32. RAMP only.
//
// Registry: { fn(), cell:[64,36], tile:[64,32], anchor:[32,16], base, sink:true }.

// scatter accent pixels inside the diamond face only (never on the lip/edge)
function faceScatter(rows, fn) {
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0 + 2; x <= rows[y].x1 - 2; x++) fn(x, y);
}

/* =============================== MEADOW FLOWER =============================== */
// grass + scattered tiny blooms (drift / gold / bone), a lusher heartland floor.
function drawMeadowFlower() {
  const g = makeBaseTile('grass', 11);
  const rows = diamondRows(), dr = RAMP.drift, gd = RAMP.gold, bn = RAMP.bone, gr = RAMP.grass;
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 600);
    if (h < 0.012) { P(g, x, y, dr[1]); P(g, x, y - 1, dr[0]); P(g, x - 1, y, gr[2]); }      // purple bloom
    else if (h < 0.024) { P(g, x, y, gd[0]); P(g, x, y - 1, gd[1]); P(g, x - 1, y, gr[2]); } // gold bloom
    else if (h < 0.034) { P(g, x, y, bn[0]); P(g, x + 1, y, bn[1]); }                          // white daisy speck
    else if (h < 0.05) P(g, x, y, gr[0]);                                                       // lush highlight blade
  });
  return g;
}

/* =============================== ASH DIRT =============================== */
// grey scorched dirt + ember flecks — the Ashen Flats war ground.
function drawAshDirt() {
  const g = makeBaseTile('dirt', 12);
  const rows = diamondRows(), em = RAMP.ember;
  const ashgrey = ['#564f6b', '#3a3450', '#211c30', '#14101e'];
  // recolour the dirt face toward cold ash-grey (keep the lip/void edges from makeBaseTile)
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const v = G(g, x, y); if (!v || v.c === RAMP.void) continue;
    const dl = RAMP.dirt.indexOf(v.c);
    if (dl >= 0) P(g, x, y, ashgrey[dl]);
  }
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 610);
    if (h < 0.02) { P(g, x, y, em[2]); if (hash2(x, y, 611) < 0.5) P(g, x, y, em[1]); }   // ember fleck
    else if (h < 0.035) P(g, x, y, RAMP.ash);                                              // soot patch
    else if (h < 0.06) P(g, x, y, ashgrey[0]);                                             // dry ash highlight
  });
  return g;
}

/* =============================== HIGHLAND STONE =============================== */
// rocky grey — the Ashen Flats highland; cracked flagstone-ish ground.
function drawHighlandStone() {
  const g = makeBaseTile('stone', 13);
  const rows = diamondRows(), st = RAMP.stone, gr = RAMP.grass;
  // a few embedded boulders + cracks across the face
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 620);
    if (h < 0.02) { P(g, x, y, st[3]); P(g, x + 1, y, st[3]); }       // crack seam
    else if (h < 0.05) P(g, x, y, st[0]);                              // lit rock facet
    else if (h < 0.065) P(g, x, y, st[2]);                            // shadow pit
  });
  // two small embedded rocks (lit top-left)
  [[24, 14, 3], [42, 20, 4]].forEach(([cx, cy, r], i) => {
    ell(g, cx, cy, r, r * 0.7, (x, y, d, dx, dy) => { if (!inDiamond(rows, x, y)) return; let c = st[1]; if (dx + dy < -0.3) c = st[0]; if (d > 0.7) c = st[2]; P(g, x, y, c); });
    if (i === 0) P(g, cx - 1, cy - 2, gr[2]);   // a touch of moss
  });
  return g;
}

/* =============================== MARSH MUD =============================== */
// wet dark dirt + puddle dither — Hollowmere ground.
function drawMarshMud() {
  const g = makeBaseTile('dirt', 14);
  const rows = diamondRows(), wt = RAMP.water, dt = RAMP.dirt, gr = RAMP.grass;
  // darken the dirt face (wet)
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const v = G(g, x, y); if (!v || v.c === RAMP.void) continue;
    if (v.c === dt[0]) P(g, x, y, dt[1]); else if (v.c === dt[1]) P(g, x, y, dt[2]);
  }
  // a couple of puddles with dithered water + sheen
  [[26, 16, 7, 3], [44, 22, 6, 2.5]].forEach(([cx, cy, rx, ry], i) => {
    ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
      if (!inDiamond(rows, x, y)) return;
      if (d > 0.85 && (x + y) % 2) return;            // soft dithered puddle rim
      let c = wt[2]; if (d < 0.4) c = wt[3]; if (dx + dy < -0.4 && d < 0.6) c = wt[1];
      P(g, x, y, c);
    });
    P(g, cx - 1, cy - 1, wt[0]);                       // sky sheen glint
  });
  // scattered reeds / wet grass blades + mud flecks
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 630);
    if (h < 0.015) { P(g, x, y, gr[2]); P(g, x, y - 1, gr[1]); }   // reed blade
    else if (h < 0.03) P(g, x, y, dt[3]);                          // wet mud dark fleck
  });
  return g;
}

/* ============================ REGISTRY ============================ */
const BIOMETILES = {
  meadow_flower:   { fn: () => drawMeadowFlower(),   base: 'grass' },
  ash_dirt:        { fn: () => drawAshDirt(),        base: 'dirt'  },
  highland_stone:  { fn: () => drawHighlandStone(),  base: 'stone' },
  marsh_mud:       { fn: () => drawMarshMud(),       base: 'dirt'  },
};
Object.keys(BIOMETILES).forEach(k => Object.assign(BIOMETILES[k], { cell: [64, 36], tile: [64, 32], anchor: [32, 16], sink: true, outline: false }));

Object.assign(globalThis, {
  faceScatter, drawMeadowFlower, drawAshDirt, drawHighlandStone, drawMarshMud, BIOMETILES,
});
