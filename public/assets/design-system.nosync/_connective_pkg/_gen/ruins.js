// Naevyr FRONTIER EXPANSION · RUINS & LANDMARKS — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2 from tiles.js; ell/shadeMass/spike/moteBurst from beasts.js).
//
// The wayside landmarks the road wanders between. Native-size, BOTTOM-CENTER anchored,
// 1px #0a0810 void outline, dither not blur, moonlit-left / shadowed-right, RAMP only.
//   waystone 28×44 (faint rune, 2f glow) · broken_arch 96×88 · fallen_statue 72×72 ·
//   battlefield_bones 80×40 (ground decor) · drift_monolith 48×96 (2f shimmer).
//
// NB drift_monolith ships a full dirt apron pad INSIDE its own canvas — the old obelisk
// sprite clipped its south foundation off-canvas; here the pad fits entirely on-cell.

// self-contained packed-earth apron diamond (so ruins don't depend on town.js)
function apron(g, cx, southY, halfW) {
  const dt = RAMP.dirt;
  const halfH = Math.round(halfW / 2);
  const topY = southY - halfH;                   // diamond spans topY .. southY
  for (let dy = -halfH; dy <= halfH; dy++) {
    const t = 1 - Math.abs(dy) / halfH;
    const w = Math.round(halfW * t);
    const y = (topY + halfH) + dy;
    for (let dx = -w; dx <= w; dx++) {
      let c = dt[1];
      if (dy < -halfH * 0.3 && dx < 0) c = dt[0];
      else if (dy > halfH * 0.3) c = dt[2];
      if (hash2(cx + dx, y, 3) < 0.07) c = dt[2];
      P(g, cx + dx, y, c);
    }
  }
  // front rim plinth (south faces)
  for (let dx = -halfW; dx <= halfW; dx++) {
    const t = 1 - Math.abs(dx) / halfW;
    const edgeY = topY + halfH + Math.round(halfH * t);
    for (let k = 1; k <= 3; k++) P(g, cx + dx, edgeY + k, dx < 0 ? RAMP.stone[2] : RAMP.stone[3]);
  }
}

/* ===================== WAYSTONE (28×44, 2-frame rune glow) ===================== */
function drawWaystone(frame) {
  frame = frame || 0;
  const g = makeGrid(28, 44);
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone, gd = RAMP.gold;
  const cx = 14, baseY = 41;
  // small earth pad
  apron(g, cx, baseY, 11);
  // a leaning weathered marker stone — wider base, chipped top
  const botY = baseY - 1, topY = 6;
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const lean = Math.round(t * 1.5);                       // leans slightly right
    const hw = Math.round(6.5 - t * 2.2);
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x + lean;
      let c = st[1];
      if (x <= -hw + 1) c = st[0];                          // moonlit left
      else if (x >= hw - 1) c = st[3];                      // shadow right
      if (hash2(sx, y, 102) < 0.07) c = st[2];              // pitting
      if (hash2(sx, y, 103) < 0.02) c = st[3];              // cracks
      P(g, sx, y, c);
    }
  }
  // chipped/rounded crown
  P(g, cx + 1, topY - 1, st[1]); P(g, cx, topY - 1, st[0]);
  P(g, cx + 4, topY + 1, RAMP.void);                        // a knocked-off corner
  // moss / lichen at the base
  for (let i = 0; i < 6; i++) { const mx = cx - 5 + Math.floor(hash2(i, 1, 104) * 11), my = botY - Math.floor(hash2(i, 2, 104) * 4); P(g, mx, my, RAMP.grass[2]); }
  // a carved directional rune (chevron + bar) on the face — glows on frame 1
  const lit = frame === 1;
  const rc = lit ? dr[0] : '#3b1162';
  const rim = lit ? dr[1] : dr[3];
  [[cx - 2, 20], [cx - 1, 21], [cx, 22], [cx + 1, 21], [cx + 2, 20]].forEach(([rx, ry]) => P(g, rx, ry, rc));   // chevron
  [[cx, 24], [cx, 26], [cx - 1, 28], [cx + 1, 28]].forEach(([rx, ry]) => P(g, rx, ry, rim));                    // shaft + feet
  if (lit) { // faint glow halo around the rune
    for (let yy = 18; yy <= 30; yy++) for (let xx = -5; xx <= 6; xx++) {
      const d = Math.abs(xx) + Math.abs(yy - 24);
      if (d > 4 && d < 7 && (xx + yy) % 2 === 0 && !G(g, cx + xx, yy)) P(g, cx + xx, yy, dr[3]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ===================== BROKEN ARCH (96×88) ===================== */
function drawBrokenArch() {
  const g = makeGrid(96, 88);
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone, gr = RAMP.grass;
  const cx = 48, baseY = 84;
  apron(g, cx, baseY, 42);

  // helper: a weathered ashlar block column
  function pier(px, topY, w) {
    for (let y = baseY - 2; y >= topY; y--) {
      const sway = Math.round((baseY - y) * 0.04);          // slight outward lean
      for (let x = -w; x <= w; x++) {
        const sx = px + x + sway;
        let c = st[1]; if (x < -w + 2) c = st[0]; if (x > w - 2) c = st[3];
        // ashlar courses
        if ((baseY - y) % 9 === 0) c = st[3];
        if ((x + Math.floor((baseY - y) / 9) * 3) % 7 === 0) c = st[3];
        if (hash2(sx, y, 111) < 0.06) c = st[2];
        if (hash2(sx, y, 112) < 0.02) c = dr[3];            // drift in the cracks
        P(g, sx, y, c);
      }
    }
  }
  // LEFT pier — tall, intact, with the arch springer
  pier(26, 18, 9);
  // RIGHT pier — snapped off partway (collapsed)
  pier(72, 40, 9);

  // the ARCH — a thick stone band springing from the left pier, broken at the apex
  const aCx = 49, aCy = 24, aR = 26, band = 9;
  for (let deg = 200; deg <= 340; deg += 1) {               // left half + over the top, stops before the right
    const a = deg * Math.PI / 180;
    for (let b = 0; b < band; b++) {
      const r = aR - b;
      const x = Math.round(aCx + Math.cos(a) * r * 1.0);
      const y = Math.round(aCy - Math.sin(a) * r * 0.8);    // squashed for iso
      if (y > baseY - 2) continue;
      // break the arch just past the crown (drop the far-right voussoirs)
      if (deg > 305 && hash2(x, y, 113) < 0.6) continue;
      let c = st[1];
      if (b < 2) c = st[0]; if (b > band - 3) c = st[3];
      if (deg % 14 < 2) c = st[3];                           // voussoir joints
      if (hash2(x, y, 114) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  // fallen voussoir blocks + rubble heaped at the right base
  [[66, baseY - 8, 9, 7], [78, baseY - 6, 8, 6], [70, baseY - 14, 7, 6], [84, baseY - 5, 6, 5]].forEach(([x, y, w, h], i) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1]; if (xx < x + 2) c = st[0]; if (xx > x + w - 3) c = st[3]; if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 115 + i) < 0.08) c = st[2];
      P(g, xx, yy, c);
    }
  });
  for (let i = 0; i < 22; i++) { const x = 58 + Math.floor(hash2(i, 1, 116) * 34), y = baseY - 2 - Math.floor(hash2(i, 2, 116) * 4); P(g, x, y, hash2(i, 3, 116) < 0.5 ? st[2] : st[3]); }
  // grass reclaiming the base + drift seeping from the broken apex
  for (let i = 0; i < 14; i++) { const x = 18 + Math.floor(hash2(i, 4, 117) * 60), y = baseY - 2 - Math.floor(hash2(i, 5, 117) * 2); P(g, x, y, gr[2]); }
  [[64, 26], [68, 30], [66, 34]].forEach(([mx, my]) => P(g, mx, my, dr[2]));
  outline(g, RAMP.void);
  return g;
}

/* ===================== FALLEN STATUE (72×72) ===================== */
function drawFallenStatue() {
  const g = makeGrid(72, 72);
  const st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift, gr = RAMP.grass, gd = RAMP.gold;
  const cx = 36, baseY = 68;
  apron(g, cx, baseY, 32);

  // the toppled plinth (a stepped stone pedestal, now empty + cracked)
  for (let step = 0; step < 3; step++) {
    const w = 13 - step * 2, h = 4, x0 = 12 - step, y0 = baseY - 4 - step * 4;
    for (let yy = y0; yy < y0 + h; yy++) for (let x = x0; x < x0 + w * 2; x++) {
      let c = st[1]; if (x < x0 + 2) c = st[0]; if (x > x0 + w * 2 - 3) c = st[3]; if (yy > y0 + h - 2) c = st[3];
      if (hash2(x, yy, 121) < 0.07) c = st[2];
      P(g, x, yy, c);
    }
  }
  // broken stumps of the statue's legs, snapped at the shin, still on the plinth
  for (const fx of [15, 21]) { for (let y = baseY - 24; y <= baseY - 16; y++) for (let x = fx; x <= fx + 4; x++) { let c = st[1]; if (x > fx + 2) c = st[2]; P(g, x, y, c); } for (let x = fx; x <= fx + 4; x++) P(g, x, baseY - 24, st[3]); /* jagged snapped top */ }

  // the FALLEN figure — a stone warrior lying on its back, head to the right.
  // legs (broken off, lying between plinth and torso, knees bent)
  for (let x = 24; x <= 33; x++) { for (let j = 0; j < 5; j++) { let c = st[1]; if (j === 0) c = st[0]; if (j > 3) c = st[3]; P(g, x, baseY - 6 - j, c); } }
  P(g, 33, baseY - 11, st[3]);                                      // knee
  for (let x = 33; x <= 38; x++) { for (let j = 0; j < 4; j++) P(g, x, baseY - 8 - j - (x - 33), st[2]); }   // raised shin
  // torso (broad carved cuirass slab, tapering to the waist)
  for (let x = 36; x <= 52; x++) {
    const t = (x - 36) / 16;
    const hh = Math.round(7 - Math.abs(t - 0.45) * 5);             // chest broad, waist narrow
    for (let j = -hh; j <= hh; j++) {
      let c = st[1]; if (j < -hh + 2) c = st[0]; if (j > hh - 2) c = st[2];
      if (hash2(x, baseY - 9 + j, 122) < 0.06) c = st[2];
      P(g, x, baseY - 9 + j, c);
    }
  }
  // carved cuirass detail: collarbone ridge + a sun-sigil boss on the chest
  for (let x = 38; x <= 44; x++) P(g, x, baseY - 14, st[0]);
  ell(g, 43, baseY - 9, 2.4, 2.4, (x, y, d) => P(g, x, y, d < 0.4 ? gd[1] : st[3]));
  // a great crack splitting the torso, drift glowing inside
  for (let k = -4; k <= 4; k++) { const yy = baseY - 9 + Math.round(Math.sin(k) * 1.3); P(g, 44 + k, yy, RAMP.void); P(g, 44 + k, yy - 1, dr[3]); }
  P(g, 44, baseY - 9, dr[1]);
  // shoulder pauldron + an arm flung out to the left, hand open
  ell(g, 37, baseY - 14, 3, 3, (x, y, d) => P(g, x, y, d < 0.5 ? st[0] : st[2]));   // pauldron
  for (let k = 0; k < 8; k++) P(g, 35 - k, baseY - 13 + Math.round(k * 0.5), st[2]);
  ell(g, 27, baseY - 9, 3, 2, (x, y, d) => P(g, x, y, d < 0.5 ? st[1] : st[3]));    // hand
  // neck connecting the torso to the broken-off head
  for (let x = 52; x <= 55; x++) for (let j = -2; j <= 2; j++) P(g, x, baseY - 9 + j, st[2]);
  // the broken-off HEAD, rolled to the right, face up (noble visage, hollow eyes, circlet)
  ell(g, 61, baseY - 8, 6, 6, (x, y, d, dx, dy) => {
    let c = st[1]; if (dx < -0.3) c = st[0]; if (dy > 0.3) c = st[2]; if (d > 0.8) c = st[3];
    if (hash2(x, y, 123) < 0.06) c = st[2];
    P(g, x, y, c);
  });
  P(g, 59, baseY - 9, RAMP.void); P(g, 63, baseY - 9, RAMP.void);   // hollow eyes
  P(g, 60, baseY - 9, st[3]); P(g, 64, baseY - 9, st[3]);           // brow shade
  for (let x = 59; x <= 63; x++) P(g, x, baseY - 5, st[3]);         // grim mouth line
  for (let x = 56; x <= 66; x++) P(g, x, baseY - 13, gd[2]);        // worn circlet band
  P(g, 61, baseY - 14, gd[1]); P(g, 58, baseY - 13, gd[0]);
  // moss + rubble reclaiming the wreck
  for (let i = 0; i < 12; i++) { const x = 16 + Math.floor(hash2(i, 1, 124) * 50), y = baseY - 2 - Math.floor(hash2(i, 2, 124) * 2); P(g, x, y, hash2(i, 3, 124) < 0.5 ? gr[2] : st[3]); }
  outline(g, RAMP.void);
  return g;
}

/* ===================== BATTLEFIELD BONES (80×40, ground decor) ===================== */
function drawBattlefieldBones() {
  const g = makeGrid(80, 40);
  const bn = RAMP.bone, dt = RAMP.dirt, st = RAMP.stone, bl = RAMP.blood, dr = RAMP.drift;
  const cx = 40, baseY = 37;
  // trampled dirt / ash ground patch (low, spreads wide)
  ell(g, cx, baseY - 2, 38, 8, (x, y, d) => {
    if (d > 0.92 && (x + y) % 2) return;
    let c = dt[2]; if (d > 0.7) c = dt[3]; if (hash2(x, y, 131) < 0.18) c = RAMP.ash;
    P(g, x, y, c);
  });

  // a half-buried RIBCAGE (arcing ribs from a spine)
  function ribcage(ox, oy, n, dirn) {
    for (let k = 0; k < n; k++) P(g, ox + k * dirn, oy, bn[3]);    // spine
    for (let k = 0; k < n; k++) {
      const rx = ox + k * dirn;
      for (let j = 1; j <= 4; j++) { const yy = oy - j; P(g, rx + Math.round(j * 0.3) * dirn, yy, j < 4 ? bn[2] : bn[1]); }
    }
  }
  ribcage(20, baseY - 4, 7, 1);
  ribcage(54, baseY - 3, 6, -1);
  // two skulls
  [[16, baseY - 6], [60, baseY - 5]].forEach(([sx, sy]) => {
    ell(g, sx, sy, 4, 3.4, (x, y, d, dx, dy) => { let c = bn[2]; if (dy < -0.2) c = bn[1]; if (d > 0.78) c = bn[3]; P(g, x, y, c); });
    P(g, sx - 1, sy, RAMP.void); P(g, sx + 1, sy, RAMP.void);    // eye sockets
    P(g, sx, sy + 2, bn[3]);                                      // jaw
  });
  // broken spears / arrows stuck in the ground at angles
  [[30, 1.2, 14], [44, -0.9, 16], [50, 1.6, 12], [12, -1.4, 10]].forEach(([bx, ang, len], i) => {
    for (let k = 0; k < len; k++) { const x = Math.round(bx + Math.cos(ang) * k), y = baseY - 4 - Math.round(Math.sin(ang) * k); P(g, x, y, dt[3]); }
    const tx = Math.round(bx + Math.cos(ang) * len), ty = baseY - 4 - Math.round(Math.sin(ang) * len);
    P(g, tx, ty, st[1]); P(g, tx + 1, ty, st[0]);                 // spearhead glint
  });
  // a couple of cracked round shields lying flat
  [[34, baseY - 2, bl], [58, baseY - 1, dt]].forEach(([sx, sy, ramp]) => {
    ell(g, sx, sy, 6, 3, (x, y, d) => { let c = ramp[2]; if (d < 0.3) c = ramp[3]; if (d > 0.72) c = ramp[1]; P(g, x, y, c); });
    ell(g, sx, sy, 2, 1, (x, y) => P(g, x, y, RAMP.stone[2]));    // boss
    for (let k = -5; k <= 5; k++) if (k % 3 === 0) P(g, sx + k, sy, RAMP.void);   // splits
  });
  // faint drift motes drifting over the dead
  [[26, baseY - 10], [48, baseY - 12], [38, baseY - 8]].forEach(([mx, my], i) => P(g, mx, my, i % 2 ? dr[1] : dr[2]));
  outline(g, RAMP.void);
  return g;
}

/* ===================== DRIFT MONOLITH (48×96, 2-frame shimmer) ===================== */
function drawDriftMonolith(frame) {
  frame = frame || 0;
  const g = makeGrid(48, 96);
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone;
  const cx = 24, baseY = 90;
  // FULL dirt apron pad — fits entirely inside the 48-wide canvas (the fix vs the old obelisk)
  apron(g, cx, baseY, 20);

  // the tapering monolith — a black-stone obelisk with a drift-crystal core seam
  const botY = baseY - 4, topY = 10;
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const hw = Math.round(8 - t * 4.5);                     // tapers toward the top
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x;
      let c = st[1];
      if (x <= -hw + 1) c = st[0];                          // moonlit left face
      else if (x >= hw - 1) c = st[3];                      // shadowed right face
      else if (x > 0) c = st[2];
      if (hash2(sx, y, 141) < 0.06) c = st[2];              // pitting
      if (hash2(sx, y, 142) < 0.025) c = st[3];             // cracks
      P(g, sx, y, c);
    }
  }
  // pyramidion cap
  for (let k = 0; k < 4; k++) for (let x = -(3 - k); x <= (3 - k); x++) P(g, cx + x, topY - 1 - k, x < 0 ? st[1] : st[2]);

  // a vertical drift-crystal seam glowing up the front face (shimmers across 2 frames)
  const lit0 = frame === 0, hi = dr[0], mid = dr[1], lo = dr[2];
  for (let y = botY - 4; y >= topY + 2; y -= 1) {
    const t = (botY - y) / (botY - topY);
    const jitter = Math.round(Math.sin(y * 0.6 + frame * 1.7));
    const sx = cx + jitter;
    // brightness travels up the seam by frame for a shimmer
    const phase = (Math.floor((botY - y) / 3) + frame) % 3;
    P(g, sx, y, phase === 0 ? hi : phase === 1 ? mid : lo);
    if (phase === 0) { P(g, sx - 1, y, mid); P(g, sx + 1, y, lo); }
  }
  // carved runes flanking the seam (pulse with frame)
  const runeC = frame === 0 ? dr[1] : dr[2];
  [22, 40, 58].forEach((ry, i) => {
    const y = botY - 10 - i * 20; if (y < topY + 4) return;
    [[-4, 1], [4, -1]].forEach(([rx, dirn]) => { P(g, cx + rx, y, runeC); P(g, cx + rx + dirn, y, runeC); P(g, cx + rx, y + 1, runeC); });
  });
  // drift-crystal shard crown bursting from the cap (Ash-Obelisk kinship)
  const cty = topY - 5;
  for (let k = 0; k < 8; k++) { const w = Math.max(0, Math.round((1 - k / 8) * 2)); for (let i = -w; i <= w; i++) { let c = dr[2]; if (i < 0) c = dr[1]; if (i > 0) c = dr[3]; if (i === 0 && k < 5) c = dr[0]; P(g, cx + i, cty - k, c); } }
  P(g, cx, cty - 8, dr[0]);
  // glow halo around the crown + rising motes (brighten/drift per frame)
  const rr = frame === 0 ? 7 : 6;
  for (let yy = -7; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 4 && d < rr && (xx + yy + frame) % 2 === 0 && !G(g, cx + xx, cty - 3 + yy)) P(g, cx + xx, cty - 3 + yy, dr[2]);
  }
  for (let i = 0; i < 5; i++) { const mx = cx + Math.round((hash2(i, frame, 143) - 0.5) * 14); const my = topY + 6 + Math.round(hash2(i, 1, 143) * 40) - frame * 3; P(g, mx, my, hash2(i, 2, 143) < 0.4 ? dr[0] : dr[1]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const RUINS = {
  waystone:          { fn: (i) => drawWaystone(i),       cell: [28, 44], anchor: [14, 43], frames: 2, anim: { name: 'rune_glow', fps: 2, loop: true } },
  broken_arch:       { fn: () => drawBrokenArch(),       cell: [96, 88], anchor: [48, 87], footprint: '3x3' },
  fallen_statue:     { fn: () => drawFallenStatue(),     cell: [72, 72], anchor: [36, 71], footprint: '2x2' },
  battlefield_bones: { fn: () => drawBattlefieldBones(), cell: [80, 40], anchor: [40, 39], ground: true },
  drift_monolith:    { fn: (i) => drawDriftMonolith(i),  cell: [48, 96], anchor: [24, 95], frames: 2, anim: { name: 'shimmer', fps: 2, loop: true }, footprint: '2x2' },
};

Object.assign(globalThis, {
  apron, drawWaystone, drawBrokenArch, drawFallenStatue, drawBattlefieldBones, drawDriftMonolith,
  RUINS,
});
