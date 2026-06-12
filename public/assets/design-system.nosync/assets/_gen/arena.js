// Naevyr — ARENA SET ("The Pit"). Eval after pixlib.js + tiles.js (+ walls.js
// for the W2 skew helpers). The Pit's duels float in the Drift's void: a torch-
// lit ring the corruption watches. Rect-grid, RAMP only, 1px void outline, dither
// never blur, deterministic. Iso 64×32 diamond floors; ring tiles at +32x,±16y.

/* ============================ ARENA FLOOR (64×36) ============================
   Packed blood-sand: warm dirt ramp base + ember-red accents; 3 seed variants
   + 1 blood-flecked variant. Reads under a violet vignette. */
function arenaFloor(variant, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const dt = RAMP.dirt, em = RAMP.ember, bl = RAMP.blood;
  const face = dt[1], hi = dt[0], sh = dt[2], dp = dt[3];

  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip
  for (let x = 0; x < 64; x++) { const my = contourMaxY(rows, x); if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh); }
  // 1px void north edge
  for (let x = 0; x < 64; x++) for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }

  // packed-sand grain + warm ember-red flecks
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0 + 1; x <= rows[y].x1 - 1; x++) {
    const h = hash2(x, y, seedN);
    if (h < 0.05) P(g, x, y, sh);                       // trodden grain
    else if (h < 0.075) P(g, x, y, hi);                 // lit grit
    else if (h < 0.088) P(g, x, y, em[2]);              // faint ember-red warmth
    if (hash2(x, y, seedN + 5) < 0.012) P(g, x, y, dp); // raked groove
  }
  // raked concentric arcs (subtle, arena-swept)
  for (let y = 4; y < 30; y += 6) for (let x = rows[y].x0 + 2; x <= rows[y].x1 - 2; x++) if ((x + 2 * y) % 9 === 0) P(g, x, y, sh);

  if (variant === 'blood') {
    // dark dried spatter, dithered
    const rng = mulberry(seedN + 40);
    for (let s = 0; s < 5; s++) {
      const cxp = 14 + Math.floor(rng() * 36), cyp = 8 + Math.floor(rng() * 18), r = 2 + Math.floor(rng() * 4);
      for (let yy = -r; yy <= r; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
        const x = cxp + xx, y = cyp + yy;
        if (!inDiamond(rows, x, y) || y < 1) continue;
        const d = xx * xx + yy * yy;
        if (d <= r * r && (x + y) % 2 === 0) P(g, x, y, bl[3]);
        else if (d <= (r + 1) * (r + 1) && hash2(x, y, 41) < 0.4) P(g, x, y, bl[3]);
      }
      // a drip tail
      for (let k = 0; k < 4; k++) if (hash2(s, k, 42) < 0.6) P(g, cxp + (k % 2), cyp + r + k, bl[3]);
    }
  }
  return g;
}

/* ============================ ARENA RING (32×72 segments) ====================
   Modular circular palisade in the skewed-segment style (tiles +32x,±16y).
   Bone-and-blackstone posts strung with iron chain. NO side void outline. */
function ringBottomY(side, x) { return side === 'ne' ? 55 + Math.round(x * 16 / 31) : 55 + Math.round((31 - x) * 16 / 31); }
function ringP(g, side, x, hAbove, c) { const by = ringBottomY(side, x); P(g, x, by - hAbove, c); }

function arenaRing(side, variant) {
  const g = makeGrid(32, 72);
  const st = RAMP.stone, bn = RAMP.bone, em = RAMP.ember, dr = RAMP.drift;
  const FACE = 44;
  // low blackstone kerb wall (continuous, periodic mod 32 so seams match)
  for (let x = 0; x < 32; x++) {
    for (let h = 0; h <= 12; h++) {
      let c = st[2];
      if (h >= 11) c = st[0];                         // top lit lip
      else if (h <= 1) c = st[3];                     // base shadow
      if ((x % 8) < 1) c = st[3];                      // block joints (periodic)
      if (hash2(x, h, 211) < 0.05) c = st[3];
      ringP(g, side, x, h, c);
    }
  }
  // posts every 16px: bone-capped blackstone
  const postXs = variant === 'b' ? [4, 20] : [0, 16];
  postXs.forEach(px => {
    for (let h = 12; h <= FACE; h++) {
      const w = 2;
      for (let o = -w; o <= w; o++) {
        const x = px + o; if (x < 0 || x > 31) continue;
        let c = st[1]; if (o <= -w + 0) c = st[0]; if (o >= w) c = st[3];
        if (hash2(x, h, 212) < 0.06) c = st[2];
        ringP(g, side, x, h, c);
      }
    }
    // bone skull/cap finial
    for (let o = -2; o <= 2; o++) for (let k = 0; k <= 3; k++) { const x = px + o; if (x < 0 || x > 31) continue; let c = bn[1]; if (o <= -1) c = bn[0]; if (o >= 1) c = bn[2]; if (k === 0) c = bn[0]; ringP(g, side, x, FACE + 1 + k, c); }
    ringP(g, side, px - 1, FACE + 2, RAMP.void); ringP(g, side, px + 1, FACE + 2, RAMP.void);   // skull eye sockets
    if (variant === 'b') { ringP(g, side, px - 1, FACE + 2, em[1]); ringP(g, side, px + 1, FACE + 2, em[1]); }  // lit watcher-skulls
  });
  // iron chain swag strung between the posts (catenary dip)
  const x0 = postXs[0], x1 = postXs[0] + 16;
  for (let x = x0; x <= Math.min(31, x1); x++) {
    const t = (x - x0) / 16;
    const dip = Math.round(Math.sin(t * Math.PI) * 5);
    const h = FACE - 4 - dip;
    ringP(g, side, x, h, (x % 2 === 0) ? st[3] : st[0]);          // chain links alternate
  }
  return g;
}

/* gate segment: fighters' entrance with a raised iron portcullis (32×72) */
function arenaGate(side) {
  const g = makeGrid(32, 72);
  const st = RAMP.stone, bn = RAMP.bone, em = RAMP.ember;
  const FACE = 48;
  // two heavy jambs framing a dark archway
  [3, 28].forEach(px => {
    for (let h = 0; h <= FACE; h++) for (let o = -2; o <= 2; o++) { const x = px + o; if (x < 0 || x > 31) continue; let c = st[1]; if (o <= -2) c = st[0]; if (o >= 2) c = st[3]; if ((h % 6) === 0) c = st[3]; ringP(g, side, x, h, c); }
  });
  // dark archway void between jambs
  for (let x = 6; x <= 25; x++) for (let h = 0; h <= FACE - 6; h++) { const arch = (h > FACE - 14) ? Math.round(Math.sqrt(Math.max(0, 49 - (x - 15.5) * (x - 15.5)))) : 99; if (h < FACE - 6 - 0 && (FACE - 6 - h) < arch + 8) ringP(g, side, x, h, RAMP.void); }
  // lintel + bone trophy over the arch
  for (let x = 3; x <= 28; x++) ringP(g, side, x, FACE, st[2]);
  for (let x = 3; x <= 28; x++) ringP(g, side, x, FACE + 1, st[0]);
  for (let o = -2; o <= 2; o++) { ringP(g, side, 15 + o, FACE + 3, bn[1]); } ringP(g, side, 15, FACE + 4, bn[0]);
  ringP(g, side, 14, FACE + 3, RAMP.void); ringP(g, side, 16, FACE + 3, RAMP.void);
  // RAISED iron portcullis: bars pulled up into the lintel, fangs hanging down
  for (let x = 7; x <= 24; x += 3) for (let h = FACE - 6; h >= FACE - 11; h--) ringP(g, side, x, h, st[3]);   // retracted bars
  for (let x = 7; x <= 24; x += 3) { ringP(g, side, x, FACE - 12, st[2]); ringP(g, side, x, FACE - 13, st[3]); }  // fang tips
  for (let x = 6; x <= 25; x++) ringP(g, side, x, FACE - 6, st[3]);                                            // portcullis rail
  // ember cresset on the left jamb
  ringP(g, side, 2, 30, em[2]); ringP(g, side, 2, 31, em[1]); ringP(g, side, 2, 32, em[0]); ringP(g, side, 1, 31, em[2]);
  return g;
}

/* ============================ ARENA TORCH (32×64, 3-frame flame) ============ */
function arenaTorch(frame) {
  const g = makeGrid(32, 64);
  const st = RAMP.stone, dt = RAMP.dirt, em = RAMP.ember, gd = RAMP.gold;
  const cx = 16, baseY = 60;
  // tripod legs
  [[-6, 0], [6, 0], [0, 2]].forEach(([dx, sk]) => { for (let k = 0; k < 16; k++) { const x = cx + Math.round(dx * (1 - k / 16)), y = baseY - k; P(g, x, y, st[2]); P(g, x, y + 1, st[3]); } });
  for (let x = cx - 7; x <= cx + 7; x++) if ((x + 1) % 2 === 0) P(g, x, baseY + 1, RAMP.void);   // ground contact
  // brazier bowl
  for (let j = 0; j < 7; j++) for (let i = -7 + j; i <= 7 - j; i++) { let c = st[1]; if (i < -4) c = st[0]; if (i > 4) c = st[3]; if (j === 0) c = st[3]; P(g, cx + i, baseY - 16 + j, c); }
  for (let i = -7; i <= 7; i++) P(g, cx + i, baseY - 17, st[3]);       // rim
  for (let i = -5; i <= 5; i++) P(g, cx + i, baseY - 16, RAMP.void);   // coals shadow
  // coals
  for (let i = -4; i <= 4; i++) if ((i + frame) % 2 === 0) P(g, cx + i, baseY - 16, em[2]);
  // FLAME (3-frame), strong + tall, the only light in the void
  const sway = [0, 1, -1][frame], tall = [0, 2, 1][frame];
  const fb = baseY - 17;
  for (let yy = 0; yy <= 22 + tall; yy++) {
    const t = yy / (22 + tall);
    const hw = Math.round((1 - t) * 6 * (1 - t * 0.25)) + (yy < 4 ? 1 : 0);
    const sx = cx + Math.round(Math.sin(yy * 0.45 + frame) * 1.3) + Math.round(sway * t * 2);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = em[1];
      if (Math.abs(xx) >= hw - 1) c = em[2];
      if (yy < 7 && Math.abs(xx) < 2) c = em[0];
      if (t > 0.78 && Math.abs(xx) <= 1) c = gd[0];        // white-hot tip
      P(g, sx + xx, fb - yy, c);
    }
  }
  // inner gold core
  for (let yy = 2; yy <= 12 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (13 + tall)) * 3)); for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, fb - yy - 1, gd[0]); }
  // escaping spark
  if (frame !== 1) P(g, cx + sway * 2, fb - 26 - tall, em[0]);
  outline(g, RAMP.void);
  // strong glow pixels (outline-free, added after) — stepped ember halo into the void
  for (let yy = -20; yy <= 6; yy++) for (let xx = -14; xx <= 14; xx++) {
    const d = Math.abs(xx) + Math.abs(yy * 1.2);
    if (d > 8 && d < 13 && (xx + yy + frame) % 2 === 0) { const gy = fb - 8 + yy; if (gy > 4 && !G(g, cx + xx, gy)) P(g, cx + xx, gy, em[3]); }
  }
  return g;
}

/* ============================ WATCHER (32×40, wanderer-rig) =================== */
function arenaWatcher(variant, anim, f) {
  const g = makeGrid(32, 40);
  const ramp = variant === 'blood' ? RAMP.blood : variant === 'void' ? RAMP.stone : RAMP.bone;
  const dark = variant === 'void';
  const cx = 16, em = RAMP.ember;
  let bob = 0, armUp = 0;
  if (anim === 'idle') bob = f === 1 ? 1 : 0;            // sway
  if (anim === 'cheer') armUp = f === 1 ? 1 : 0;         // fist up on f1
  const top = 11 + bob, shoulderY = 19 + bob;

  // hooded cloak (rounded, faceless)
  for (let y = shoulderY; y <= 37; y++) {
    const t = (y - shoulderY) / (37 - shoulderY);
    const hw = Math.round(4 + t * 3);
    for (let x = cx - hw; x <= cx + hw; x++) {
      let c = dark ? RAMP.void : ramp[1];
      if (x <= cx - hw + 1) c = dark ? RAMP.stone[3] : ramp[0];
      if (x >= cx + hw - 1) c = dark ? '#0a0810' : ramp[2];
      if (!dark && hash2(x, y, 221) < 0.06) c = ramp[2];
      P(g, x, y, c);
    }
  }
  // hood dome
  for (let y = top; y <= shoulderY; y++) {
    const hy = (y - top) / (shoulderY - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.3) * Math.PI * 0.5) * 3.2);
    for (let x = cx - hw; x <= cx + hw; x++) { let c = dark ? RAMP.stone[3] : ramp[1]; if (x === cx - hw) c = dark ? RAMP.stone[2] : ramp[0]; if (x >= cx + hw - 1) c = '#0a0810'; if (y === top) c = dark ? RAMP.stone[2] : ramp[0]; P(g, x, y, c); }
  }
  P(g, cx, top - 1, dark ? RAMP.stone[2] : ramp[1]);
  // faceless void + ember eyes
  for (let y = top + 3; y <= top + 7; y++) for (let x = cx - 2; x <= cx + 2; x++) P(g, x, y, RAMP.void);
  const eyOn = !(anim === 'idle' && f === 1);
  P(g, cx - 1, top + 5, eyOn ? em[0] : em[2]); P(g, cx + 1, top + 5, eyOn ? em[0] : em[2]);
  // arms: resting, or fist raised on cheer f1
  if (anim === 'cheer' && armUp) {
    for (let k = 0; k < 8; k++) P(g, cx + 5, shoulderY + 2 - k, dark ? RAMP.stone[2] : ramp[2]);   // raised arm
    fillRect(g, cx + 4, shoulderY - 7, 3, 3, dark ? RAMP.stone[1] : ramp[1]);                       // fist
  } else {
    P(g, cx - 5, shoulderY + 3, dark ? RAMP.stone[2] : ramp[2]); P(g, cx + 5, shoulderY + 3, dark ? RAMP.stone[2] : ramp[2]);
  }
  // hem
  for (let x = 0; x < 32; x++) { const v = G(g, x, 37); if (v) P(g, x, 37, dark ? '#0a0810' : ramp[3]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ VICTORY PLATE (96×48, 2-frame shimmer) ========= */
function victoryPlate(frame) {
  const g = makeGrid(96, 48);
  const gd = RAMP.gold, bn = RAMP.bone, vd = RAMP.void;
  const cx = 48, cy = 24;
  // floating gold plaque on void (no bg fill = transparent void)
  // laurel of finger-bones (two arcs)
  for (let s = -1; s <= 1; s += 2) {
    for (let a = 0; a < 11; a++) {
      const ang = Math.PI * (0.15 + a * 0.07);
      const x = Math.round(cx + s * Math.cos(ang) * 38), y = Math.round(cy + Math.sin(ang) * 20 - 0);
      // each bone: 2px with knuckle ends
      P(g, x, y, bn[1]); P(g, x, y + 1, bn[2]); P(g, x + s, y, bn[0]);
      if (a % 2 === 0) { P(g, x, y - 1, bn[0]); }
    }
  }
  // crossed blades (gold), X through the center
  for (let k = -16; k <= 16; k++) {
    // blade 1 (down-right)
    P(g, cx + k, cy + Math.round(k * 0.55), gd[1]); P(g, cx + k, cy + Math.round(k * 0.55) - 1, gd[0]);
    // blade 2 (down-left)
    P(g, cx - k, cy + Math.round(k * 0.55), gd[2]); P(g, cx - k, cy + Math.round(k * 0.55) - 1, gd[1]);
  }
  // hilts + pommels at the lower ends
  [[-16, 1], [16, -1]].forEach(([k, s]) => { const x = cx + k, y = cy + Math.round(Math.abs(k) * 0.55); fillRect(g, x - 1, y, 3, 2, gd[3]); P(g, x, y + 2, gd[2]); });
  // central boss gem (drift accent, the corruption watches)
  fillRect(g, cx - 2, cy - 2, 4, 4, gd[0]); P(g, cx, cy, RAMP.drift[1]);
  // shimmer sweep (frame-dependent diagonal highlight)
  const sweepX = frame ? cx + 14 : cx - 14;
  for (let yy = -10; yy <= 10; yy++) { const x = sweepX + Math.round(yy * 0.4); if (G(g, x, cy + yy)) P(g, x, cy + yy, RAMP.bone[0]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ BLOOD FX (48×24 decal, 3 variants) ============= */
function bloodFx(variant) {
  const g = makeGrid(48, 24);
  const bl = RAMP.blood;
  const rng = mulberry(300 + variant);
  const cx = 24, cy = 13;
  const blobs = variant === 0 ? 1 : variant === 1 ? 2 : 3;
  for (let b = 0; b < blobs; b++) {
    const bxp = cx + Math.round((rng() - 0.5) * 22), byp = cy + Math.round((rng() - 0.5) * 10), r = 3 + Math.floor(rng() * 4);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
      const x = bxp + xx, y = byp + Math.round(yy * 0.6);
      if (x < 0 || x > 47 || y < 0 || y > 23) continue;
      const d = (xx * xx) / ((r + 1) * (r + 1)) + (yy * yy) / (r * r);
      if (d <= 0.75) P(g, x, y, (x + y) % 3 === 0 ? bl[3] : bl[2]);
      else if (d <= 1.1 && (x + y) % 2 === 0) P(g, x, y, bl[3]);     // dithered edge
    }
    // splatter droplets + a drip
    for (let s = 0; s < 5; s++) { const dx = bxp + Math.round((rng() - 0.5) * 16), dy = byp + Math.round((rng() - 0.5) * 9); if (dx >= 0 && dx < 48 && dy >= 0 && dy < 24) P(g, dx, dy, bl[3]); }
    for (let k = 0; k < 3; k++) if (rng() < 0.6) P(g, bxp + (k % 2), Math.min(23, byp + r + k), bl[3]);
  }
  // NOTE: ground decal — no void outline (sits flush on sand)
  return g;
}

const ARENA = {
  floors: { fn: arenaFloor, cell: [64, 36], anchor: [32, 16], variants: ['a', 'b', 'c', 'blood'] },
  ring:   { fn: arenaRing,  cell: [32, 72], anchor: [16, 55], note: 'tile +32x,±16y; no side outline', tiles: ['ne', 'nw'], variants: ['a', 'b'] },
  gate:   { fn: arenaGate,  cell: [32, 72], anchor: [16, 55] },
  torch:  { fn: arenaTorch, cell: [32, 64], anchor: [16, 60], frames: 3, fps: 4 },
  watcher:{ fn: arenaWatcher, cell: [32, 40], anchor: [16, 39], variants: ['bone', 'blood', 'void'], anims: [['idle', 2], ['cheer', 2]] },
  victory:{ fn: victoryPlate, cell: [96, 48], anchor: [48, 24], frames: 2, fps: 3 },
  blood:  { fn: bloodFx, cell: [48, 24], anchor: [24, 12], variants: [0, 1, 2] },
};

Object.assign(globalThis, {
  arenaFloor, ringBottomY, ringP, arenaRing, arenaGate, arenaTorch,
  arenaWatcher, victoryPlate, bloodFx, ARENA,
});
