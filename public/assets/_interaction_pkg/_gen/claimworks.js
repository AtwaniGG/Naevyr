// Naevyr FRONTIER INTERACTION SET · CLAIMWORKS — eval after pixlib.js + tiles.js.
// Claim upgrade props (ride the Furnisher prop pipeline; placed on claimed ground). Native
// small cells, bottom-center anchor, 1px void outline, dither not blur, RAMP only.
//   claim_stash    32×28 1f         — reinforced banded-iron storage chest (richer than loot)
//   claim_workbench 36×28 1f        — crafting bench: tools, vise, scattered offcuts
//   claim_ward     24×44 glow 2f @4fps — warding totem/brazier, pale drift-flame + carved runes
//   rune_anvil     32×40 rune 2f @4fps — enchanter's anvil ringed with floating glyphs

/* ============================ CLAIM STASH (32×28, 1f) ============================ */
function drawClaimStash() {
  const g = makeGrid(32, 28);
  const dt = RAMP.dirt, st = RAMP.stone, gd = RAMP.gold;
  const cx = 16, x0 = 4, x1 = 27, topY = 11, botY = 26;
  // domed lid
  for (let y = 4; y <= topY; y++) { const t = (y - 4) / (topY - 4); const hw = Math.round(9 + t * 2); for (let x = cx - hw; x <= cx + hw; x++) { let c = dt[1]; if (x <= cx - hw + 1) c = dt[0]; if (x >= cx + hw - 1) c = dt[2]; P(g, x, y, c); } }
  // body
  for (let y = topY + 1; y <= botY; y++) for (let x = x0; x <= x1; x++) { let c = dt[2]; if (x <= x0 + 1) c = dt[1]; if (x >= x1 - 1) c = dt[3]; if (hash2(x, y, 1300) < 0.05) c = dt[3]; P(g, x, y, c); }
  // iron bands (vertical), clipped to the lid dome up top
  for (const bxp of [9, 16, 23]) for (let y = 4; y <= botY; y++) {
    if (y < topY) { const hw = Math.round(9 + ((y - 4) / (topY - 4)) * 2); if (Math.abs(bxp - cx) > hw) continue; }
    P(g, bxp, y, st[2]); P(g, bxp + 1, y, st[3]);
  }
  // lid seam band
  for (let x = x0; x <= x1; x++) { P(g, x, topY, st[3]); P(g, x, topY + 1, st[2]); }
  // gold lock plate + keyhole
  fillRect(g, cx - 2, topY - 1, 5, 5, gd[2]); P(g, cx - 2, topY - 1, gd[1]); P(g, cx, topY + 1, RAMP.void); P(g, cx, topY + 2, gd[0]);
  // corner rivets
  [[x0 + 1, topY + 2], [x1 - 1, topY + 2], [x0 + 1, botY - 1], [x1 - 1, botY - 1]].forEach(([rx, ry]) => P(g, rx, ry, st[1]));
  outline(g, RAMP.void);
  return g;
}

/* ============================ CLAIM WORKBENCH (36×28, 1f) ============================ */
function drawClaimWorkbench() {
  const g = makeGrid(36, 28);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone;
  const baseY = 27;
  for (const lx of [5, 30]) { for (let y = 16; y <= baseY; y++) { P(g, lx, y, dt[3]); P(g, lx + 1, y, dt[2]); } }   // legs
  for (let x = 5; x <= 31; x++) P(g, x, 22, dt[3]);                                                                 // stretcher
  // benchtop slab (iso)
  for (let d = 0; d <= 4; d++) for (let x = 3; x <= 33; x++) P(g, x + d, 12 - Math.floor(d / 2), d === 0 ? dt[1] : (d >= 3 ? dt[3] : dt[2]));
  for (let x = 3; x <= 33; x++) { P(g, x, 15, dt[3]); P(g, x, 16, dt[3]); }   // front edge
  // vise at the right end
  fillRect(g, 29, 9, 4, 4, st[2]); P(g, 29, 9, st[1]); P(g, 33, 10, st[3]); P(g, 31, 13, st[3]); P(g, 31, 8, st[3]);
  // tools laid on top
  P(g, 9, 11, dt[2]); P(g, 8, 11, dt[1]); fillRect(g, 6, 9, 3, 2, st[3]);            // hammer
  P(g, 14, 11, st[2]); P(g, 15, 11, st[1]); P(g, 16, 11, bn[2]);                     // chisels
  P(g, 18, 11, st[2]); P(g, 19, 11, bn[2]);
  for (let k = 0; k < 7; k++) { P(g, 22 + k, 11 - k, st[2]); P(g, 22 + k, 12 - k, bn[3]); }   // a leaning saw
  // offcuts / shavings on top + on the ground
  for (let i = 0; i < 8; i++) { const ox = 6 + Math.floor(hash2(i, 1, 1400) * 26); P(g, ox, 14, dt[1]); if (hash2(i, 2, 1400) < 0.4) P(g, ox + 1, 14, dt[2]); }
  for (let i = 0; i < 5; i++) { const ox = 8 + Math.floor(hash2(i, 3, 1400) * 22); P(g, ox, baseY, dt[1]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ CLAIM WARD (24×44, glow 2f) ============================ */
function drawClaimWard(f) {
  const g = makeGrid(24, 44);
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone;
  const cx = 12, baseY = 43, bright = f === 1;
  // stone totem shaft
  for (let y = 14; y <= baseY; y++) { const t = (y - 14) / (baseY - 14); const hw = Math.round(3 + t * 2); for (let x = cx - hw; x <= cx + hw; x++) { let c = st[2]; if (x <= cx - hw + 1) c = st[1]; if (x >= cx + hw - 1) c = st[3]; P(g, x, y, c); } }
  for (let x = cx - 6; x <= cx + 6; x++) { P(g, x, baseY, st[3]); P(g, x, baseY - 1, st[2]); }   // base
  // carved drift runes glowing on the shaft
  [[0, 20], [-2, 26], [2, 30], [0, 36]].forEach(([rx, ry]) => { const c = bright ? dr[0] : dr[2]; P(g, cx + rx, ry, c); P(g, cx + rx - 1, ry, dr[3]); P(g, cx + rx + 1, ry, dr[3]); P(g, cx + rx, ry + 1, dr[3]); });
  // bowl at the crown
  for (let x = cx - 5; x <= cx + 5; x++) P(g, x, 13, st[3]);
  for (let x = cx - 4; x <= cx + 4; x++) P(g, x, 14, st[2]);
  for (let x = cx - 3; x <= cx + 3; x++) P(g, x, 12, st[1]);
  // pale drift-flame (cool fire), 2f
  const flh = bright ? 7 : 5;
  for (let k = 0; k < flh; k++) { const w = Math.max(0, Math.round((1 - k / flh) * 3)); const wob = Math.round(Math.sin(k * 0.9 + f) * 1); for (let i = -w; i <= w; i++) { let c = dr[1]; if (k < flh * 0.4) c = dr[0]; if (i === 0 && k < flh * 0.7) c = bn[0]; if (k > flh * 0.7) c = dr[2]; P(g, cx + i + wob, 11 - k, c); } }
  P(g, cx + 2, 11 - flh - 1, bright ? dr[0] : dr[2]); P(g, cx - 1, 11 - flh - 2, dr[1]);   // rising motes
  // glow halo
  for (let yy = -3; yy <= 3; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 3 && d < (bright ? 7 : 6) && (xx + yy) % 2 === 0) P(g, cx + xx, 8 + yy, dr[3]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ RUNE ANVIL (32×40, rune 2f) ============================ */
function drawRuneAnvil(f) {
  const g = makeGrid(32, 40);
  const st = RAMP.stone, dr = RAMP.drift, dt = RAMP.dirt;
  const cx = 16, baseY = 39, bright = f === 1;
  // stump base
  for (let y = 0; y < 9; y++) for (let x = -5; x <= 5; x++) { let c = dt[2]; if (x <= -4) c = dt[1]; if (x >= 4) c = dt[3]; if (y === 0) c = dt[3]; P(g, cx + x, baseY - y, c); }
  const ay = baseY - 9;
  // anvil body
  for (let x = -7; x <= 5; x++) P(g, cx + x, ay - 4, st[1]);      // top face
  for (let x = -6; x <= 4; x++) P(g, cx + x, ay - 3, st[2]);
  for (let x = -2; x <= 2; x++) { P(g, cx + x, ay - 2, st[2]); P(g, cx + x, ay - 1, st[3]); }   // waist
  for (let x = -4; x <= 3; x++) P(g, cx + x, ay, st[3]);          // base flare
  P(g, cx - 8, ay - 4, st[2]); P(g, cx - 9, ay - 3, st[3]);       // horn
  // inlaid glowing rune on the side
  P(g, cx - 1, ay - 2, bright ? dr[0] : dr[2]); P(g, cx + 1, ay - 2, bright ? dr[1] : dr[3]);
  // floating glyphs ringing the anvil (alternate on/off by frame)
  const glyphs = [[-9, -8], [9, -9], [0, -13], [-6, -12], [7, -12]];
  glyphs.forEach(([gx, gy], i) => {
    const on = bright ? (i % 2 === 0) : (i % 2 === 1);
    const c = on ? dr[0] : dr[3];
    const yy = ay + gy - (bright ? 1 : 0);
    P(g, cx + gx, yy, c);
    if (on) { P(g, cx + gx - 1, yy, dr[2]); P(g, cx + gx + 1, yy, dr[2]); P(g, cx + gx, yy - 1, dr[2]); }
  });
  // faint dither ring linking the glyphs
  for (let a = 0; a < 16; a++) { const ang = (a / 16) * Math.PI * 2; const rx = Math.round(cx + Math.cos(ang) * 9); const ry = Math.round(ay - 7 + Math.sin(ang) * 5); if ((a + f) % 3 === 0) P(g, rx, ry, dr[3]); }
  // hammer on the anvil
  P(g, cx + 3, ay - 5, dt[2]); P(g, cx + 4, ay - 6, dt[1]); fillRect(g, cx + 4, ay - 8, 3, 2, st[3]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const CLAIMWORKS = {
  claim_stash:     { fn: () => drawClaimStash(),     cell: [32, 28], anchor: [16, 27], frames: 1,                              solid: true, desc: 'Reinforced banded-iron storage chest, richer than the loot chest' },
  claim_workbench: { fn: () => drawClaimWorkbench(), cell: [36, 28], anchor: [18, 27], frames: 1,                              solid: true, desc: 'Crafting bench with tools, a vise, scattered offcuts' },
  claim_ward:      { fn: (f) => drawClaimWard(f),    cell: [24, 44], anchor: [12, 43], frames: 2, anim: ['glow', 4, true],     solid: true, desc: 'Warding totem/brazier — pale drift-flame bowl + carved runes; resists the Drift' },
  rune_anvil:      { fn: (f) => drawRuneAnvil(f),    cell: [32, 40], anchor: [16, 39], frames: 2, anim: ['rune', 4, true],     solid: true, desc: "Enchanter's anvil ringed with floating glyphs (Forge enchant tier / HUD motif)" },
};

Object.assign(globalThis, {
  drawClaimStash, drawClaimWorkbench, drawClaimWard, drawRuneAnvil, CLAIMWORKS,
});
