// Naevyr FRONTIER INTERACTION SET · MERCHANT — eval after pixlib.js + tiles.js + avatars.js
// (rig, drawFeet). The Roaming Trader who walks the roads, DROP-IN COMPATIBLE with the
// wanderer rig: 32×40, feet row y=37, 5 facings s/se/e/ne/n (engine mirrors w/sw/nw),
// idle 2f · walk 6f, bottom-center anchor, shoulder y=18(+bob), walk-bob [0,-1,0,0,-1,0].
// One cosmetic ramp-swap CLOTH channel (hood/coat/pack-cloth). RAMP only, 1px void outline.
//   roaming_trader 32×40 idle2·walk6 · 5 facings · channel: cloth
//   pack_mule      28×28 walk4 · 4 facings (s/se/e/n; engine mirrors w/sw) — laden companion

const TRADER_CLOTH = ['dirt', 'stone', 'grass', 'blood', 'drift'];
const TRADER_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const TRADER_ANIMS = [['idle', 2], ['walk', 6]];
function traderCloth(look) {
  look = look || {}; const v = look.a;
  if (v == null) return RAMP.dirt;
  if (typeof v === 'number') return RAMP[TRADER_CLOTH[Math.max(0, Math.min(4, v))]];
  return RAMP[v] || RAMP.dirt;
}

function bodyTrader(g, R, anim, f, cloth) {
  const { cx, off, dir, top, shoulderY, hemSway, back, showFace } = R;
  const lt = RAMP.dirt, bn = RAMP.bone, st = RAMP.stone, em = RAMP.ember;
  // tall overloaded backpack rising above the shoulders
  function pack() {
    const bx = cx + off + (back ? 0 : (dir === 0 ? 0 : -1));
    for (let y = top - 6; y <= shoulderY + 6; y++) { P(g, bx - 5, y, lt[3]); P(g, bx + 5, y, lt[3]); }   // frame rails
    for (let y = top - 6; y <= shoulderY + 5; y++) for (let x = bx - 4; x <= bx + 4; x++) {
      let c = cloth[1]; if (x <= bx - 3) c = cloth[0]; if (x >= bx + 3) c = cloth[2];
      if ((x + y) % 4 === 0) c = cloth[2]; if (hash2(x, y, 1101) < 0.05) c = cloth[3];
      P(g, x, y, c);
    }
    fillRect(g, bx - 4, top - 3, 3, 3, st[2]); P(g, bx - 4, top - 4, st[3]);     // strapped pot
    fillRect(g, bx + 2, shoulderY - 1, 3, 3, lt[1]);                            // a bundle
    for (let x = bx - 5; x <= bx + 5; x++) { P(g, x, top - 7, bn[3]); P(g, x, top - 6, bn[2]); }   // bedroll across top
    for (let yy = top - 5; yy <= shoulderY; yy += 3) for (let x = bx - 5; x <= bx + 5; x++) if (x % 3 === 0) P(g, x, yy, RAMP.void);   // lashing
  }
  // swinging side lantern
  function lantern() {
    const lsw = (anim === 'walk') ? [0, 1, 1, 0, -1, -1][f] : (f === 1 ? 1 : 0);
    const lx = cx + off + 6 + lsw, ly = shoulderY + 7;
    P(g, lx, ly - 2, st[3]);
    for (let j = 0; j < 5; j++) for (let i = -1; i <= 1; i++) { let c = st[2]; if (i === 0 && j > 0 && j < 4) c = em[1]; if (Math.abs(i) === 1) c = st[3]; P(g, lx + i, ly + j, c); }
    P(g, lx, ly + 2, em[0]);
  }
  if (!back) pack();
  // coat / cloak
  for (let y = shoulderY; y <= 36; y++) {
    const t = (y - shoulderY) / (36 - shoulderY);
    const hw = Math.round(3.4 + t * 2.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 31 ? Math.round(hemSway * 0.6) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) { let c = cloth[1]; if (x <= cxx - hw + 1) c = cloth[0]; if (x >= cxx + hw - 1) c = cloth[2]; if (hash2(x, y, 1100) < 0.05) c = cloth[3]; P(g, x, y, c); }
  }
  // hood
  for (let y = top; y <= shoulderY + 1; y++) { const hy = (y - top) / (shoulderY + 1 - top); const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3); const hcx = cx + off; for (let x = hcx - hw; x <= hcx + hw; x++) { let c = cloth[1]; if (x === hcx - hw) c = cloth[0]; if (x >= hcx + hw - 1) c = cloth[2]; if (y === top) c = cloth[0]; P(g, x, y, c); } }
  P(g, cx + off + (dir >= 1 ? 1 : 0), top - 1, cloth[1]);
  // shadowed face + a glint of eye
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0), ey = top + 5;
    for (let y = top + 4; y <= top + 7; y++) for (let x = fcx - 2; x <= fcx + 2; x++) P(g, x, y, RAMP.void);
    P(g, fcx + (dir === 2 ? 1 : -1), ey, bn[0]); if (dir !== 2) P(g, fcx + 1, ey, bn[1]);
  }
  // forward arm + walking staff (front/side)
  if (!back) {
    const ax = cx + off - 5; for (let y = shoulderY + 1; y <= 28; y++) P(g, ax, y, cloth[2]);
    const sx = cx + off - 6; for (let y = top + 2; y <= 37; y++) P(g, sx, y, lt[2]); P(g, sx, top + 1, lt[3]);
    P(g, sx - 1, top + 2, bn[2]); P(g, sx + 1, top + 2, bn[2]);    // bundle tied at the staff head
    P(g, sx, top + 3, bn[1]);
  }
  if (back) pack();
  lantern();
}

function drawTrader(facing, anim, f, look) {
  const g = makeGrid(32, 40);
  const R = rig(facing, anim, f);
  bodyTrader(g, R, anim, f, traderCloth(look));
  drawFeet(g, R, RAMP.dirt, 'trader', 0);
  outline(g, RAMP.void);
  return g;
}
function traderSheetGrids(look) {
  return TRADER_FACINGS.map(fc => { const row = []; TRADER_ANIMS.forEach(([anim, n]) => { for (let f = 0; f < n; f++) row.push(drawTrader(fc, anim, f, look)); }); return row; });
}

/* ============================ PACK MULE (28×28, walk 4f, 4 facings) ============================ */
const MULE_FACINGS = ['s', 'se', 'e', 'n'];
function drawPackMule(facing, f) {
  const g = makeGrid(28, 28);
  const dt = RAMP.dirt, bn = RAMP.bone, st = RAMP.stone, cl = RAMP.dirt;
  const dir = { s: 0, se: 1, e: 2, n: 3 }[facing];
  const profile = dir === 2, diagonal = dir === 1, back = dir === 3;
  const cx = 14, baseY = 27, bodyY = baseY - 12;
  const ph = [0, 1, 0, -1][f % 4];
  function leg(lx) { for (let k = 0; k < 7; k++) P(g, lx, baseY - k, k > 4 ? dt[1] : dt[2]); P(g, lx, baseY, RAMP.void); }
  if (profile || diagonal) { leg(cx - 6 + ph); leg(cx - 3); leg(cx + 3 - ph); leg(cx + 6); }
  else { leg(cx - 5); leg(cx - 2); leg(cx + 2); leg(cx + 5); }
  // barrel body
  for (let y = 0; y < 8; y++) for (let x = -8; x <= 8; x++) { if ((x / 8) ** 2 + ((y - 3) / 4) ** 2 > 1) continue; let c = dt[2]; if (x <= -6) c = dt[1]; if (x >= 6) c = dt[3]; if (hash2(x, y, 1200) < 0.05) c = dt[3]; P(g, cx + x, bodyY + y, c); }
  // head / neck toward facing
  if (!back) {
    const hd = profile ? cx + 9 : (diagonal ? cx + 7 : cx);
    const hy = (profile || diagonal) ? bodyY + 1 : bodyY - 2;
    for (let y = 0; y < 6; y++) for (let x = -2; x <= 2; x++) { let c = dt[2]; if (x <= -2) c = dt[1]; if (x >= 2) c = dt[3]; P(g, hd + x, hy + y, c); }
    P(g, hd - 1, hy - 2, dt[1]); P(g, hd - 1, hy - 3, dt[2]); P(g, hd + 1, hy - 2, dt[1]); P(g, hd + 1, hy - 3, dt[2]);   // long ears
    P(g, hd, hy + 6, bn[3]);                                                                                            // muzzle
    if (profile) P(g, hd + 1, hy + 2, RAMP.void); else { P(g, hd - 1, hy + 2, RAMP.void); P(g, hd + 1, hy + 2, RAMP.void); }
  } else { P(g, cx, bodyY + 1, dt[3]); P(g, cx, bodyY + 2, dt[2]); P(g, cx, bodyY + 3, dt[3]); }   // tail
  // side panniers
  if (profile || diagonal) { fillRect(g, cx + 2, bodyY + 2, 5, 5, cl[2]); P(g, cx + 2, bodyY + 2, cl[3]); fillRect(g, cx - 7, bodyY + 3, 4, 4, cl[1]); }
  // top bundle heap + lashing
  for (let y = 0; y < 5; y++) { const w = 6 - y; for (let x = -w; x <= w; x++) { let c = cl[1]; if (x <= -w + 1) c = cl[0]; if (x >= w - 1) c = cl[2]; if ((x + 2 * y) % 4 === 0) c = cl[3]; P(g, cx + x, bodyY - 1 - y, c); } }
  fillRect(g, cx - 2, bodyY - 6, 4, 3, st[2]); P(g, cx - 2, bodyY - 6, st[3]);   // strapped pot
  for (let x = -8; x <= 8; x++) if (x % 4 === 0) P(g, cx + x, bodyY + 3, RAMP.void);
  outline(g, RAMP.void);
  return g;
}
function muleSheetGrids() { return MULE_FACINGS.map(fc => { const row = []; for (let f = 0; f < 4; f++) row.push(drawPackMule(fc, f)); return row; }); }

const MERCHANT = {
  roaming_trader: { cell: [32, 40], anchor: [16, 39], facings: TRADER_FACINGS, anims: TRADER_ANIMS, channel: { cloth: TRADER_CLOTH }, desc: 'Hooded frontier peddler with a tall overloaded backpack + swinging lantern' },
  pack_mule:      { cell: [28, 28], anchor: [14, 27], facings: MULE_FACINGS, anims: [['walk', 4]], desc: 'Laden pack-beast that trails the trader' },
};

Object.assign(globalThis, {
  TRADER_CLOTH, TRADER_FACINGS, TRADER_ANIMS, MULE_FACINGS,
  traderCloth, bodyTrader, drawTrader, traderSheetGrids, drawPackMule, muleSheetGrids, MERCHANT,
});
