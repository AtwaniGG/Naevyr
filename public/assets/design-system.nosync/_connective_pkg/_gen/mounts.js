// Naevyr FRONTIER EXPANSION · MOUNTS — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2 from tiles.js; ell/shadeMass from beasts.js).
//
// v1 kind: frontier_steed — a lean dark-fantasy horse, wanderer-rig compatible.
//   Cell 56×48, bottom-center anchor (28,47), aligned to the ~1-tile 64×32 footprint.
//   5 facings s/se/e/ne/n + engine mirror (w←e, sw←se, nw←ne) — matches the 32×40
//   wanderer rig (5 facings + mirror) exactly.
//   Anims: idle 2f (tail-flick / breath) · walk 6f. The walk gait is timed to the
//   wanderer's 6-frame walk so a seated rider's bob lines up: body bob = [0,-1,0,0,-1,0]
//   (identical to drawWanderer's walk bob), legs stay planted.
//   Per facing & frame a saddleAnchor {x,y} (cell-local px) marks where the rider's
//   bottom-center anchor sits — engine draws wanderer at steedScreenPos + saddleAnchor,
//   exactly like worn-gear anchors line up on the rig.
//   Bottom-center contact shadow. One coat dye channel (RAMP swap) — v1 ships 'ink'.
//   RAMP only, 1px void auto-outline, dither not blur, moonlit-left / shadowed-right.
//
// Build the generator so future variants (e.g. a skeletal drift-horse) slot in:
// STEED_KINDS maps a kind → { coat ramp, mane, glow eye, undead? } and the body
// builder reads it; add a kind, ship a sheet, no rig changes.

/* ---- shared rig constants (LOCK — the TS port keys off these) ---- */
const STEED_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const STEED_MIRROR = { w: 'e', sw: 'se', nw: 'ne' };
const STEED_ANIMS = [['idle', 2], ['walk', 6]];
const STEED_CELL = [56, 48];
const STEED_ANCHOR = [28, 47];
// bob lines up with drawWanderer: walk rises 1px on f1 & f4; idle breathes on f1.
const STEED_WALK_BOB = [0, -1, 0, 0, -1, 0];
const STEED_IDLE_BOB = [0, -1];
// per-leg fore/aft swing over the 6 walk frames (diagonal gait), + a hoof lift.
// near pair leads the far pair by half a cycle; front opposes back (trot-ish walk).
const GAIT = {
  // [swingX per frame], [lift per frame]
  fNear: { sw: [2, 1, 0, -2, -1, 0], lift: [0, 1, 1, 0, 0, 0] },
  fFar:  { sw: [-2, -1, 0, 2, 1, 0], lift: [0, 0, 0, 0, 1, 1] },
  bNear: { sw: [-2, -1, 0, 2, 1, 0], lift: [0, 0, 0, 0, 1, 1] },
  bFar:  { sw: [2, 1, 0, -2, -1, 0], lift: [0, 1, 1, 0, 0, 0] },
};

// coat dye channel — RAMP swap. v1 ships 'ink' (dark stone). Future skeletal variant
// would register a kind with coat:'bone', undead:true.
const STEED_KINDS = {
  frontier_steed: { coat: 'stone', mane: 'void', sock: false, glow: 'drift', undead: false },
};

function steedBob(anim, f) { return (anim === 'walk' ? STEED_WALK_BOB : STEED_IDLE_BOB)[f] || 0; }

// saddle seat point per facing (where the rider's bottom-center anchor is placed),
// before the per-frame bob is added. Sits just behind the withers, top of the barrel.
const SADDLE_BASE = {
  s:  [28, 26],
  se: [27, 25],
  e:  [27, 24],
  ne: [29, 25],
  n:  [28, 26],
};
function steedSaddle(facing, anim, f) {
  const b = SADDLE_BASE[facing];
  return { x: b[0], y: b[1] + steedBob(anim, f) };
}

/* ---- a tapered horse leg: hip at (x,topY), down to ground at hoofY, shifted by sw,
       lifted by `lift`, drawn in `ramp`. Hoof = 1px void cap. ---- */
function steedLeg(g, x, topY, hoofY, sw, lift, ramp, w) {
  w = w || 2;
  const by = hoofY - lift;                 // bent / lifted hoof
  for (let y = topY; y <= by - 1; y++) {
    // leg tapers and drifts toward the swing as it descends
    const t = (y - topY) / Math.max(1, by - topY);
    const xx = Math.round(x + sw * t);
    for (let i = 0; i < w; i++) {
      let c = ramp[2];
      if (i === 0) c = ramp[1];
      if (i === w - 1) c = ramp[3];
      if (y > by - 4) c = ramp[3];          // dark cannon/fetlock
      P(g, xx + i, y, c);
    }
  }
  const hx = Math.round(x + sw);
  for (let i = 0; i < w; i++) P(g, hx + i, by, RAMP.void);   // hoof
}

/* ---- contact shadow ellipse on the ground, drawn first (under the body) ---- */
function steedShadow(g, cx, cy, rx, ry) {
  ell(g, cx, cy, rx, ry, (x, y, d) => {
    if (y < cy - 1) return;                  // only the lower half reads as shadow
    if (d > 0.62 && (x + y) % 2 === 1) return;   // dithered soft rim
    P(g, x, y, RAMP.void, 0.5);
  });
}

/* ====================== the steed body builder ====================== */
function drawSteed(kind, facing, anim, f) {
  kind = kind || 'frontier_steed';
  const K = STEED_KINDS[kind];
  const co = RAMP[K.coat];                  // coat ramp
  const mane = K.mane === 'void' ? [RAMP.void, co[3], co[3]] : RAMP[K.mane];
  const gl = RAMP[K.glow];
  const g = makeGrid(56, 48);
  const cx = 28, groundY = 45;
  const bob = steedBob(anim, f);
  const oy = bob;                            // upper-body vertical bob (legs stay planted)
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];

  // idle tail flick / breath
  const tailFlick = anim === 'idle' ? (f === 1 ? 2 : 0) : (anim === 'walk' ? [0, 1, 1, 0, -1, -1][f] : 0);

  // per-leg swing/lift (only when walking)
  const swOf = (key) => anim === 'walk' ? GAIT[key].sw[f] : 0;
  const liOf = (key) => anim === 'walk' ? GAIT[key].lift[f] : 0;

  // contact shadow (footprint ~ one 64×32 tile, scaled to cell)
  steedShadow(g, cx, groundY + 1, 17, 5);

  // ---------- profile / three-quarter share a barrel; front & rear are foreshortened ----------
  const profile = dir === 2;
  const threeQ = dir === 1 || dir === 3;
  const front = dir === 0;
  const rear = dir === 4;
  // head end on screen: +1 = head to the right (e/se/ne), 0 = toward/away (s/n)
  const headRight = profile || threeQ;
  const rumpToViewer = rear;                 // n: rump near viewer (low), head away (high)

  if (headRight) {
    // ===================== SIDE-ISH FACINGS (e, se, ne) =====================
    // squash horizontally a touch for the 3/4 turns
    const squash = threeQ ? 0.86 : 1;
    const bx = cx - 1;                        // barrel center x
    const byc = 27 + oy;                      // barrel center y
    const rx = Math.round(14 * squash), ry = 8;
    const headEndX = bx + Math.round(rx * 0.95);     // shoulder/chest side (right)
    const rumpX = bx - Math.round(rx * 0.95);        // hindquarter (left)

    // --- far legs first (behind the barrel), then body, then near legs ---
    steedLeg(g, headEndX - 1, byc + 4, groundY - 1, swOf('fFar'), liOf('fFar'), co, 2);  // front-far
    steedLeg(g, rumpX + 1, byc + 4, groundY - 1, swOf('bFar'), liOf('bFar'), co, 2);     // back-far

    // --- tail (flows off the rump, dark strands) ---
    const tlx = rumpX - 2;
    for (let k = 0; k < 13; k++) {
      const xx = tlx - Math.round(k * 0.35) - (k > 4 ? Math.round(tailFlick * (k - 4) / 6) : 0);
      const yy = byc - 2 + k;
      P(g, xx, yy, k % 3 === 0 ? mane[1] : RAMP.void);
      if (k > 2 && k % 2 === 0) P(g, xx - 1, yy, co[3]);
    }

    // --- barrel body ---
    ell(g, bx, byc, rx, ry, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dy < -0.35) c = co[0];              // moonlit topline
      else if (dy > 0.4) c = co[2];           // belly shade
      if (dx > 0.55) c = co[2];               // shaded toward rump? keep chest lit
      if (d > 0.78) c = co[3];                // rim
      if (hash2(x, y, 71) < 0.05) c = co[2];  // coat speckle (dither, lean musculature)
      P(g, x, y, c);
    });
    // belly tuck shadow
    for (let x = rumpX + 2; x <= headEndX - 2; x++) if ((x + byc) % 2 === 0) P(g, x, byc + ry - 1, co[3]);

    // --- chest / shoulder swell at the head end ---
    ell(g, headEndX - 1, byc + 1, 5, 7, (x, y, d, dx, dy) => {
      if (x < headEndX - 5) return;
      let c = co[1]; if (dy < -0.3) c = co[0]; if (dy > 0.4) c = co[2]; if (d > 0.8) c = co[3];
      P(g, x, y, c);
    });

    // --- neck (tapered) rising up-right from the withers to the poll ---
    const wX = headEndX - 1, wY = byc - ry + 1;     // withers
    const pollX = headEndX + (threeQ ? 6 : 9), pollY = 12 + oy;  // poll (top of head)
    const NSEG = 12;
    for (let s = 0; s <= NSEG; s++) {
      const t = s / NSEG;
      const nx = Math.round(wX + (pollX - wX) * t);
      const ny = Math.round(wY + (pollY - wY) * t);
      const hw = Math.round(4.2 - t * 1.8);         // neck thickness tapers
      for (let i = -hw; i <= hw; i++) {
        let c = co[1];
        if (i <= -hw + 1) c = co[0];                // crest-lit front edge
        if (i >= hw - 1) c = co[2];                 // shaded back edge
        P(g, nx + i, ny, c);
      }
      // mane down the back of the neck
      P(g, nx + hw, ny, mane[0]);
      if (s < NSEG) P(g, nx + hw - 1, ny, hash2(nx, ny, 72) < 0.5 ? mane[1] : co[3]);
    }

    // --- head: a lean wedge with a tapered muzzle pointing down-right ---
    const hx = pollX, hy = pollY;
    // skull
    ell(g, hx, hy + 3, 3, 4, (x, y, d, dx, dy) => {
      let c = co[1]; if (dx < -0.2) c = co[0]; if (dy > 0.4) c = co[2]; if (d > 0.8) c = co[3];
      P(g, x, y, c);
    });
    // muzzle (tapers down-right toward the nose)
    for (let k = 0; k < 6; k++) {
      const mxx = hx + 1 + k, myy = hy + 4 + k;
      const ww = Math.max(1, 2 - Math.floor(k / 3));
      for (let i = 0; i <= ww; i++) P(g, mxx, myy + i, k > 3 ? co[3] : co[2]);
    }
    P(g, hx + 6, hy + 10, RAMP.void);               // nostril/lip dark
    // ears (two short, pricked)
    P(g, hx - 1, hy - 2, co[2]); P(g, hx - 1, hy - 3, co[3]);
    P(g, hx + 1, hy - 2, co[1]); P(g, hx + 1, hy - 3, co[2]);
    // forelock
    P(g, hx, hy - 1, mane[0]);
    // drift-touched eye
    const eyeLit = (anim === 'idle' && f === 1);
    P(g, hx + 2, hy + 2, eyeLit ? gl[0] : gl[1]);
    if (K.undead) P(g, hx + 1, hy + 2, gl[2]);

    // --- saddle pad on the back (dark leather + drift trim), behind the withers ---
    const sb = SADDLE_BASE[facing];
    for (let x = sb[0] - 5; x <= sb[0] + 5; x++) {
      const t = Math.abs(x - sb[0]) / 5;
      const yTop = sb[1] + oy - 1 + Math.round(t * 1.5);
      P(g, x, yTop, RAMP.dirt[3]);
      P(g, x, yTop + 1, RAMP.dirt[2]);
      if (x === sb[0] - 5 || x === sb[0] + 5) P(g, x, yTop, gl[2]);   // drift trim corners
    }
    // a low cantle/pommel nub so an un-ridden steed still reads as tacked
    P(g, sb[0] + 5, sb[1] + oy - 2, RAMP.dirt[2]);
    P(g, sb[0] - 5, sb[1] + oy - 2, RAMP.dirt[2]);

    // --- near legs (in front of the barrel) ---
    steedLeg(g, headEndX - 2, byc + 4, groundY, swOf('fNear'), liOf('fNear'), co, 3);   // front-near
    steedLeg(g, rumpX, byc + 4, groundY, swOf('bNear'), liOf('bNear'), co, 3);          // back-near

  } else if (front) {
    // ===================== FRONT (s) — head toward viewer, foreshortened =====================
    const byc = 26 + oy;
    // rump bulge up-back (small), chest/head toward viewer (low-front)
    // hindquarters (behind, higher on screen)
    ell(g, cx, byc - 4, 11, 7, (x, y, d, dx, dy) => {
      let c = co[1]; if (dy < -0.3) c = co[0]; if (dy > 0.4) c = co[2]; if (d > 0.8) c = co[3];
      if (hash2(x, y, 73) < 0.05) c = co[2];
      P(g, x, y, c);
    });
    // far/back legs (under the rump)
    steedLeg(g, cx - 8, byc + 1, groundY - 2, 0, liOf('bFar'), co, 2);
    steedLeg(g, cx + 7, byc + 1, groundY - 2, 0, liOf('bNear'), co, 2);
    // chest mass toward viewer
    ell(g, cx, byc + 3, 9, 7, (x, y, d, dx, dy) => {
      let c = co[1]; if (dx < -0.25) c = co[0]; if (dx > 0.3) c = co[2]; if (dy > 0.4) c = co[2]; if (d > 0.82) c = co[3];
      P(g, x, y, c);
    });
    // front legs splayed toward viewer
    steedLeg(g, cx - 6, byc + 7, groundY, swOf('fFar'), liOf('fFar'), co, 3);
    steedLeg(g, cx + 4, byc + 7, groundY, swOf('fNear'), liOf('fNear'), co, 3);
    // neck rising up the middle to a lowered head
    const nbX = cx, nbY = byc - 1, hY = 14 + oy;
    for (let s = 0; s <= 10; s++) {
      const t = s / 10, ny = Math.round(nbY - (nbY - hY) * t), hw = Math.round(3.6 - t * 1.2);
      for (let i = -hw; i <= hw; i++) {
        let c = co[1]; if (i < 0) c = co[0]; if (i > hw - 2) c = co[2]; P(g, cx + i, ny, c);
      }
      P(g, cx - hw, ny, mane[0]); P(g, cx + hw, ny, mane[1]);  // mane both edges from front
    }
    // head facing viewer (long face)
    ell(g, cx, hY, 4, 5, (x, y, d, dx, dy) => {
      let c = co[1]; if (dx < -0.2) c = co[0]; if (dx > 0.3) c = co[2]; if (d > 0.82) c = co[3];
      P(g, x, y, c);
    });
    for (let y = hY + 3; y <= hY + 7; y++) for (let x = cx - 1; x <= cx + 1; x++) P(g, x, y, co[2]); // muzzle
    P(g, cx, hY + 8, RAMP.void);
    // ears
    P(g, cx - 3, hY - 4, co[2]); P(g, cx - 3, hY - 5, co[3]);
    P(g, cx + 3, hY - 4, co[1]); P(g, cx + 3, hY - 5, co[2]);
    P(g, cx, hY - 3, mane[0]);   // forelock
    // two drift eyes
    const eyeLit = (anim === 'idle' && f === 1);
    P(g, cx - 2, hY + 1, eyeLit ? gl[0] : gl[1]); P(g, cx + 2, hY + 1, eyeLit ? gl[0] : gl[1]);
    // saddle visible behind the neck
    const sb = SADDLE_BASE.s;
    for (let x = sb[0] - 4; x <= sb[0] + 4; x++) { P(g, x, sb[1] + oy - 6, RAMP.dirt[3]); P(g, x, sb[1] + oy - 5, RAMP.dirt[2]); }

  } else {
    // ===================== REAR (n) — rump toward viewer, head away (high) =====================
    const byc = 26 + oy;
    // head & neck small, away (top), drawn first so the rump overlaps
    const hY = 12 + oy;
    for (let s = 0; s <= 8; s++) {
      const t = s / 8, ny = Math.round((byc - 8) - ((byc - 8) - hY) * t), hw = Math.round(3 - t * 1.2);
      for (let i = -hw; i <= hw; i++) { let c = co[2]; if (i < 0) c = co[1]; P(g, cx + i, ny, c); }
      P(g, cx, ny, mane[1]);
    }
    ell(g, cx, hY, 3, 3, (x, y, d) => P(g, x, y, d > 0.7 ? co[3] : co[2]));  // back of head
    P(g, cx - 1, hY - 3, co[3]); P(g, cx + 1, hY - 3, co[3]);                 // ear backs
    // far/front legs (under, ahead)
    steedLeg(g, cx - 7, byc - 1, groundY - 2, 0, liOf('fFar'), co, 2);
    steedLeg(g, cx + 6, byc - 1, groundY - 2, 0, liOf('fNear'), co, 2);
    // rump mass toward viewer (rounded, lit top)
    ell(g, cx, byc + 2, 11, 8, (x, y, d, dx, dy) => {
      let c = co[1]; if (dy < -0.35) c = co[0]; if (dy > 0.35) c = co[2]; if (Math.abs(dx) > 0.55) c = co[2]; if (d > 0.8) c = co[3];
      if (hash2(x, y, 74) < 0.05) c = co[2];
      P(g, x, y, c);
    });
    // dock + tail hanging down the center
    for (let k = 0; k < 15; k++) {
      const xx = cx + Math.round(tailFlick * (k > 5 ? (k - 5) / 8 : 0));
      const yy = byc - 2 + k;
      P(g, xx, yy, k % 3 === 0 ? mane[1] : RAMP.void);
      if (k > 3 && k % 2 === 0) { P(g, xx - 1, yy, co[3]); P(g, xx + 1, yy, co[3]); }
    }
    // back legs toward viewer
    steedLeg(g, cx - 6, byc + 6, groundY, swOf('bFar'), liOf('bFar'), co, 3);
    steedLeg(g, cx + 4, byc + 6, groundY, swOf('bNear'), liOf('bNear'), co, 3);
    // saddle cantle peeking over the rump
    const sb = SADDLE_BASE.n;
    for (let x = sb[0] - 4; x <= sb[0] + 4; x++) P(g, x, sb[1] + oy - 4, RAMP.dirt[3]);
  }

  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const MOUNTS = {
  frontier_steed: {
    fn: (facing, anim, f) => drawSteed('frontier_steed', facing, anim, f),
    saddle: (facing, anim, f) => steedSaddle(facing, anim, f),
    cell: STEED_CELL, anchor: STEED_ANCHOR,
    facings: STEED_FACINGS, mirror: STEED_MIRROR, anims: STEED_ANIMS,
    rideRig: 'wanderer', riderCell: [32, 40], riderAnchor: [16, 39],
    coatDye: { channel: 'coat', ramp: 'stone', swappable: ['stone', 'bone', 'blood', 'drift'] },
    labelClearTop: 0,
  },
};

function steedSheetGrids(kind) {
  // rows = facings, cols = frames (idle0,idle1, walk0..5) laid left-to-right
  return STEED_FACINGS.map(fc => {
    const row = [];
    STEED_ANIMS.forEach(([anim, n]) => { for (let f = 0; f < n; f++) row.push(MOUNTS[kind].fn(fc, anim, f)); });
    return row;
  });
}

Object.assign(globalThis, {
  drawSteed, steedLeg, steedShadow, steedSaddle, steedBob,
  STEED_FACINGS, STEED_MIRROR, STEED_ANIMS, STEED_CELL, STEED_ANCHOR,
  STEED_WALK_BOB, STEED_IDLE_BOB, GAIT, STEED_KINDS, SADDLE_BASE,
  MOUNTS, steedSheetGrids,
});
