// Naevyr FRONTIER EXPANSION · CRYPT / RUIN INTERIOR — eval after pixlib.js + tiles.js +
// interiors.js (isoCuboid). Matches the existing interiors pack: a crypt FLOOR variant
// (64×36, 3 seed variants, tiles.js diamond format) + dungeon FIXTURES (bottom-center
// anchored, top 6px clear, each JSON carries a `solid` collision flag like the interiors set).
//   floor_crypt · sarcophagus · rubble_pile · standing_brazier (2f flame @4fps)
//   broken_pillar · bone_pile
// RAMP only, 1px void auto-outline, dither not blur, moonlit-left/shadowed-right.

/* ============================ CRYPT FLOOR (64×36, 3 variants) ============================ */
// Dark cracked flagstone (deep stone ramp), bone fragments + faint gold rune bits +
// dim drift seep welling in the joints. Reads as kin to floor_stone but corrupted.
function makeCryptFloor(seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold, dr = RAMP.drift;
  const face = st[2], hi = st[1], sh = st[3];

  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip + 1px void north edge
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }
  }
  // big crypt flagstones (coarser courses than floor_stone) + cracks
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const joint = (x + 2 * y) % 16 === 0 || (x - 2 * y + 128) % 16 === 0;
    if (joint) { P(g, x, y, sh); if (hash2(x, y, seedN) < 0.4) P(g, x, y, RAMP.void); continue; }
    const bx = Math.floor((x + 2 * y) / 16), by = Math.floor((x - 2 * y + 128) / 16);
    if (hash2(bx, by, seedN) < 0.22 && hash2(x, y, seedN + 1) < 0.5) P(g, x, y, hash2(x, y, seedN + 2) < 0.5 ? hi : sh);
    if (hash2(x, y, seedN + 7) < 0.018) P(g, x, y, RAMP.void);            // hairline crack
    // dim drift seep welling from the joints
    if (joint === false && hash2(x, y, seedN + 8) < 0.010) { P(g, x, y, dr[3]); if (hash2(x, y, seedN + 9) < 0.4) P(g, x, y, dr[2]); }
  }
  // a scatter of bone fragments + a worn gold rune fleck per variant
  const rng = mulberry(seedN * 13 + 3);
  for (let i = 0; i < 5; i++) {
    const fx = 14 + Math.floor(rng() * 36), fy = 6 + Math.floor(rng() * 20);
    if (!inDiamond(rows, fx, fy)) continue;
    P(g, fx, fy, bn[3]); if (rng() < 0.5) P(g, fx + 1, fy, bn[2]);
  }
  const gx = 20 + (seedN % 3) * 10, gy = 12 + (seedN % 2) * 6;
  if (inDiamond(rows, gx, gy)) { P(g, gx, gy, gd[2]); P(g, gx + 1, gy, gd[3]); }
  return g;
}

/* ============================ FIXTURES ============================ */

// SARCOPHAGUS — stone coffin: tapered body (iso) + a heavy lid with a carved
// recumbent figure, bone-and-gold trim, a crack with faint drift seep. SOLID.
function fxSarcophagus() {
  const g = makeGrid(44, 36); const st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold, dr = RAMP.drift;
  const baseY = 33, cx = 22;
  // coffin body — slightly tapered cuboid (head end wider, left)
  for (let y = 0; y < 12; y++) for (let x = 0; x < 34; x++) {
    const taper = Math.round((x / 34) * 1.5);
    let c = st[1]; if (x < 2) c = st[0]; if (x > 31) c = st[2];
    if (y > 9) c = st[3];
    P(g, 4 + x, baseY - y - taper, c);
  }
  // right iso side (shadow)
  for (let d = 1; d <= 6; d++) for (let y = 0; y < 12; y++) P(g, 4 + 33 + d, baseY - y - Math.floor(d / 2), d >= 5 ? st[3] : st[2]);
  // the lid — a wider slab on top with a carved figure
  for (let d = 0; d <= 7; d++) for (let x = -1; x < 35; x++) {
    let c = (d === 0 || x < 1) ? st[0] : st[1];
    if (d >= 6) c = st[2];
    P(g, 4 + x + d, baseY - 12 - Math.floor(d / 2), c);
  }
  // recumbent figure carved into the lid (bone, simplified effigy)
  const lx = 12, ly = baseY - 14;
  fillRect(g, lx, ly - 2, 16, 1, bn[2]);                       // body line
  P(g, lx - 1, ly - 2, bn[1]); P(g, lx, ly - 3, bn[1]); P(g, lx + 1, ly - 3, bn[2]);  // head
  fillRect(g, lx + 4, ly - 3, 6, 1, bn[3]); fillRect(g, lx + 5, ly - 4, 4, 1, bn[2]); // crossed arms
  // gold trim band + a worn rune on the foot
  for (let x = 4; x < 38; x++) if (x % 2 === 0) P(g, x, baseY - 1, gd[3]);
  P(g, 30, baseY - 6, gd[2]); P(g, 31, baseY - 6, gd[3]); P(g, 30, baseY - 7, gd[3]);
  // crack across the lid with faint drift seep
  for (let k = 0; k < 8; k++) { const cxk = 18 + Math.round(Math.sin(k) * 1.5), cyk = baseY - 18 + k; P(g, cxk, cyk, st[3]); if (k % 2 === 0) P(g, cxk, cyk, dr[3]); }
  outline(g, RAMP.void); return g;
}

// RUBBLE PILE — collapsed stone blocks heaped up, dust. SOLID (low cover).
function fxRubblePile() {
  const g = makeGrid(34, 24); const st = RAMP.stone; const baseY = 21, cx = 17;
  // a heap of broken blocks of varying sizes
  const blocks = [
    [cx - 11, baseY, 8, 6], [cx - 2, baseY, 9, 7], [cx + 7, baseY, 7, 5],
    [cx - 7, baseY - 6, 7, 5], [cx + 1, baseY - 7, 8, 6], [cx - 1, baseY - 12, 6, 5],
  ];
  blocks.forEach(([bx, by, w, h], i) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = st[1]; if (x < 1) c = st[0]; if (x > w - 2) c = st[2]; if (y === 0) c = st[0]; if (y > h - 2) c = st[3];
      if (hash2(bx + x, by - y, 631 + i) < 0.12) c = st[2];
      P(g, bx + x, by - y, c);
    }
    // dark gap seams between blocks
    for (let x = 0; x < w; x++) P(g, bx + x, by + 1, st[3]);
  });
  // dust / gravel at the base
  const rng = mulberry(632);
  for (let i = 0; i < 14; i++) { const dx = cx - 14 + Math.floor(rng() * 28); P(g, dx, baseY + 1 + Math.floor(rng() * 2), st[3]); }
  outline(g, RAMP.void); return g;
}

// STANDING BRAZIER — iron tripod bowl with ember flame (2-frame flicker @4fps). SOLID.
function fxStandingBrazier(frame) {
  frame = frame || 0;
  const g = makeGrid(24, 40); const st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold; const cx = 12, baseY = 37;
  // three splayed iron legs
  [[-6, -1], [0, 0], [6, 1]].forEach(([ox, dir]) => {
    for (let k = 0; k < 18; k++) { const lx = cx + ox + Math.round(dir * k * 0.4); P(g, lx, baseY - k, dir === 0 ? st[1] : st[2]); P(g, lx + 1, baseY - k, st[3]); }
  });
  // cross-brace ring
  for (let x = cx - 5; x <= cx + 6; x++) P(g, x, baseY - 10, st[3]);
  // the bowl (iso half-ellipse)
  for (let yy = 0; yy < 7; yy++) for (let xx = -9 + yy; xx <= 9 - yy; xx++) {
    let c = st[1]; if (xx < -7 + yy) c = st[0]; if (xx > 7 - yy) c = st[3]; if (yy === 0) c = st[2];
    P(g, cx + xx, baseY - 19 - yy, c);
  }
  for (let xx = -9; xx <= 9; xx++) P(g, cx + xx, baseY - 19, st[2]);    // rim
  // ember coals
  for (let xx = -6; xx <= 6; xx++) if (hash2(cx + xx, frame, 633) < 0.6) P(g, cx + xx, baseY - 20, em[2]);
  // flame (2-frame flicker)
  const sway = [0, 1][frame], tall = [0, 2][frame];
  for (let yy = 0; yy <= 12 + tall; yy++) {
    const t = yy / (12 + tall), hw = Math.round((1 - t) * 5);
    const sx = cx + Math.round(Math.sin(yy * 0.6 + frame * 2) * 1.2) + Math.round(sway * t);
    for (let xx = -hw; xx <= hw; xx++) { let c = em[1]; if (Math.abs(xx) >= hw - 1) c = em[2]; if (yy < 4 && Math.abs(xx) < 2) c = em[0]; P(g, sx + xx, baseY - 21 - yy, c); }
  }
  for (let yy = 2; yy <= 7 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (8 + tall)) * 2)); for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, baseY - 23 - yy, gd[0]); }
  if (frame === 1) P(g, cx + sway, baseY - 35 - tall, em[0]);
  // glow halo (dither)
  const rr = frame === 1 ? 10 : 8;
  for (let yy = -9; yy <= 3; yy++) for (let xx = -10; xx <= 10; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 5 && d < rr && (xx + yy + frame) % 2 === 0) P(g, cx + xx, baseY - 24 + yy, em[2]); }
  outline(g, RAMP.void); return g;
}

// BROKEN PILLAR — a fluted stone column snapped off jagged, rubble at the base,
// on a square plinth. SOLID.
function fxBrokenPillar() {
  const g = makeGrid(24, 40); const st = RAMP.stone; const cx = 12, baseY = 37;
  // square plinth (iso cuboid)
  if (typeof isoCuboid === 'function') isoCuboid(g, cx - 8, baseY, 14, 5, 4, st);
  // the column shaft, snapped at ~70% with a jagged top
  const shaftBot = baseY - 5, shaftTop = 10;
  const breakProfile = [shaftTop + 2, shaftTop, shaftTop + 3, shaftTop + 1, shaftTop + 4];
  for (let x = -5; x <= 5; x++) {
    const col = x + 5;
    const topY = breakProfile[Math.min(breakProfile.length - 1, Math.floor((col / 10) * (breakProfile.length - 1)))] + ((col % 2) ? 1 : 0);
    for (let y = shaftBot; y >= topY; y--) {
      let c = st[1]; if (x < -3) c = st[0]; if (x > 3) c = st[2]; if (x > 4) c = st[3];
      // vertical fluting
      if (x % 2 === 0) c = (x < 0) ? st[0] : st[2];
      if (hash2(cx + x, y, 641) < 0.05) c = st[3];
      P(g, cx + x, y, c);
    }
    // dark broken-core top edge
    P(g, cx + x, topY - 1, st[3]);
  }
  // capital ring near the break
  for (let x = -6; x <= 6; x++) P(g, cx + x, shaftBot - 2, st[2]);
  // a chunk of fallen column lying at the base (right)
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) { let c = st[1]; if (i < 1) c = st[0]; if (i > 7) c = st[3]; if (j > 2) c = st[3]; P(g, cx + 4 + i, baseY - 1 - j, c); }
  outline(g, RAMP.void); return g;
}

// BONE PILE — a heap of bones, ribs & two skulls. Decorative, NOT solid.
function fxBonePile() {
  const g = makeGrid(30, 20); const bn = RAMP.bone; const cx = 15, baseY = 17;
  // mound of long bones crossing
  const rng = mulberry(651);
  for (let i = 0; i < 9; i++) {
    const bx = cx - 11 + Math.floor(rng() * 22), by = baseY - Math.floor(rng() * 6);
    const len = 5 + Math.floor(rng() * 5), ang = (rng() - 0.5) * 1.6;
    for (let k = 0; k < len; k++) { const x = Math.round(bx + Math.cos(ang) * k), y = Math.round(by - Math.sin(ang) * k * 0.5); P(g, x, y, i % 2 ? bn[1] : bn[2]); }
    // knuckle ends
    P(g, bx, by, bn[0]); P(g, Math.round(bx + Math.cos(ang) * len), Math.round(by - Math.sin(ang) * len * 0.5), bn[0]);
  }
  // two skulls nestled in the pile
  [[cx - 6, baseY - 2], [cx + 4, baseY - 4]].forEach(([sx, sy], i) => {
    fillRect(g, sx, sy - 3, 5, 4, bn[1]); P(g, sx, sy - 3, bn[0]);
    P(g, sx + 1, sy - 2, RAMP.void); P(g, sx + 3, sy - 2, RAMP.void);   // eye sockets
    P(g, sx + 2, sy, bn[3]); fillRect(g, sx + 1, sy + 1, 3, 1, bn[2]);  // jaw
  });
  outline(g, RAMP.void); return g;
}

/* ============================ REGISTRY ============================ */
const CRYPT_FLOOR = { floor_crypt: { fn: (i) => makeCryptFloor(i), cell: [64, 36], anchor: [32, 16], variants: 3, tile: true } };

const CRYPT_FIX = {
  sarcophagus:      { fn: () => fxSarcophagus(),        cell: [44, 36], anchor: [22, 35], labelClear: true, solid: true },
  rubble_pile:      { fn: () => fxRubblePile(),         cell: [34, 24], anchor: [17, 23], labelClear: true, solid: true },
  standing_brazier: { fn: (i) => fxStandingBrazier(i),  cell: [24, 40], anchor: [12, 37], labelClear: true, solid: true, frames: 2, anim: { name: 'flame', fps: 4 } },
  broken_pillar:    { fn: () => fxBrokenPillar(),       cell: [24, 40], anchor: [12, 37], labelClear: true, solid: true },
  bone_pile:        { fn: () => fxBonePile(),           cell: [30, 20], anchor: [15, 19], labelClear: true, solid: false },
};

Object.assign(globalThis, {
  makeCryptFloor, fxSarcophagus, fxRubblePile, fxStandingBrazier, fxBrokenPillar, fxBonePile,
  CRYPT_FLOOR, CRYPT_FIX,
});
