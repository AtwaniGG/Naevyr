// Naevyr FRONTIER NPCs — keeper rig. Eval after pixlib.js + tiles.js + avatars.js (rig).
// Keeper rig: 32×40 cell, feet y=37, 5 facings s/se/e/ne/n (engine mirrors), idle 2f only
// (stationary NPCs). 1px void outline, RAMP only. Each also has a 48×64 dialog portrait.
//   quartermaster — gruff frontier trader (leather apron, ledger, key-ring)
//   scout         — hooded watcher, hand shading eyes, bow on back
//   hermit        — ragged camp lore NPC, bent over a gnarled staff, long beard

// shared two-foot stand (planted; no step). soleRamp solid, toe void.
function keeperFeet(g, R, soleRamp) {
  const fo = R.dir >= 1 ? 1 : 0;
  P(g, R.cx - 3 + fo, 37, soleRamp[3]); P(g, R.cx - 2 + fo, 37, RAMP.void); P(g, R.cx - 3 + fo, 36, soleRamp[2]);
  P(g, R.cx + 2 + fo, 37, RAMP.void); P(g, R.cx + 3 + fo, 37, soleRamp[3]); P(g, R.cx + 3 + fo, 36, soleRamp[2]);
}

/* ============================ QUARTERMASTER (32×40) ============================ */
// Stout, broad. Leather apron over a tunic, rolled sleeves, thick beard, flat cap.
// Holds a ledger; a key-ring glints on the belt. idle f1: weighs a gold coin (glint).
function bodyQuartermaster(g, R, f) {
  const { cx, off, dir, top, shoulderY, showFace, back } = R;
  const lt = RAMP.dirt, tu = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold;
  const shift = f === 1 ? 1 : 0;
  // broad torso (tunic) + leather apron over it
  for (let y = shoulderY; y <= 34; y++) {
    const t = (y - shoulderY) / (34 - shoulderY);
    const hw = Math.round(5 + t * 1.5);
    const cxx = cx + Math.round(off * 0.5);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = tu[1]; if (x <= cxx - hw + 1) c = tu[0]; if (x >= cxx + hw - 1) c = tu[2];
      // apron panel (center, leather) front/side only
      if (!back && Math.abs(x - cxx) <= hw - 2 && y > shoulderY + 2) { c = lt[1]; if (x < cxx - 1) c = lt[0]; if (x > cxx + 1) c = lt[2]; }
      P(g, x, y, c);
    }
  }
  // apron strap + belt with key-ring
  for (let x = cx + off - 4; x <= cx + off + 4; x++) P(g, x, 30, lt[3]);
  P(g, cx + off + 5, 31, gd[2]); P(g, cx + off + 6, 31, gd[3]); P(g, cx + off + 5, 32, bn[3]);   // keys
  // rolled-sleeve arms
  [[-1, tu[0]], [1, tu[2]]].forEach(([s, c]) => { const ax = cx + off + s * 6; for (let y = shoulderY + 1; y <= 26; y++) P(g, ax, y, c); for (let y = 27; y <= 30; y++) P(g, ax, y, bn[2]); });  // forearms bare (bone-grey skin)
  // a ledger held at the belly (front/side)
  if (!back) { for (let y = 27; y <= 31; y++) for (let x = cx + off - 3; x <= cx + off + 1; x++) P(g, x, y, bn[1]); for (let y = 27; y <= 31; y++) P(g, cx + off - 3, y, lt[3]); }
  // head + flat cap + thick beard
  const hx = cx + off, hy = top + 3;
  for (let y = top + 1; y <= shoulderY; y++) { const hw = 3; for (let x = hx - hw; x <= hx + hw; x++) { let c = bn[2]; if (x < hx - hw + 1) c = bn[1]; if (x > hx + hw - 1) c = bn[3]; P(g, x, y, c); } }
  for (let x = hx - 4; x <= hx + 4; x++) P(g, x, top, lt[2]);            // flat cap brim
  for (let x = hx - 3; x <= hx + 3; x++) P(g, x, top - 1, lt[1]);
  if (!back) {
    for (let y = top + 5; y <= top + 8; y++) for (let x = hx - 3; x <= hx + 3; x++) if (hash2(x, y, 501) < 0.8) P(g, x, y, bn[3]);  // beard
    const ey = top + 4;
    if (dir === 0) { P(g, hx - 1, ey, RAMP.void); P(g, hx + 1, ey, RAMP.void); }
    else if (dir === 1) { P(g, hx, ey, RAMP.void); P(g, hx + 2, ey, RAMP.void); }
    else P(g, hx + 1, ey, RAMP.void);
  }
  // idle f1: weighs a gold coin off the right hand
  if (f === 1 && !back) { P(g, cx + off + 7, 24 - shift, gd[0]); P(g, cx + off + 7, 23 - shift, gd[1]); }
}

/* ============================ SCOUT (32×40) ============================ */
// Lean hooded watcher. One hand raised to shade the eyes (scanning the horizon),
// a short cloak, a bow slung on the back. idle f1: hand/head shift + cloak sway.
function bodyScout(g, R, f) {
  const { cx, off, dir, top, shoulderY, showFace, back } = R;
  const ck = RAMP.grass, lt = RAMP.dirt, bn = RAMP.bone, dr = RAMP.drift;
  const sway = f === 1 ? 1 : 0;
  // slung bow on the back (behind body)
  if (back || dir === 1 || dir === 2) {
    const bx = cx + off - (back ? 0 : 3);
    for (let y = shoulderY - 2; y <= shoulderY + 12; y++) { const c = Math.abs(y - (shoulderY + 5)); P(g, bx + Math.round(c * 0.18), y, lt[2]); }
    P(g, bx, shoulderY - 2, lt[3]); P(g, bx, shoulderY + 12, lt[3]);
  }
  // short ranger cloak (green), open
  for (let y = shoulderY; y <= 33; y++) {
    const t = (y - shoulderY) / (33 - shoulderY);
    const hw = Math.round(3.4 + t * 2.6);
    const cxx = cx + Math.round(off * 0.5) + (y > 29 ? sway : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) { let c = ck[1]; if (x <= cxx - hw + 1) c = ck[0]; if (x >= cxx + hw - 1) c = ck[2]; if (hash2(x, y, 511) < 0.05) c = ck[3]; P(g, x, y, c); }
  }
  // legs (leggings) below the short cloak
  for (const s of [-1, 1]) { const lx = cx + off + s * 2; for (let y = 33; y <= 36; y++) P(g, lx, y, lt[2]); }
  // hood
  for (let y = top; y <= shoulderY + 1; y++) { const hy = (y - top) / (shoulderY + 1 - top); const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.2); const cxx = cx + off; for (let x = cxx - hw; x <= cxx + hw; x++) { let c = ck[1]; if (x === cxx - hw) c = ck[0]; if (x >= cxx + hw - 1) c = ck[2]; if (y === top) c = ck[0]; P(g, x, y, c); } }
  P(g, cx + off + (dir >= 1 ? 1 : 0), top - 1, ck[1]);
  // face shadow + a keen eye
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0);
    for (let y = top + 4; y <= top + 7; y++) for (let x = fcx - 2; x <= fcx + 2; x++) P(g, x, y, RAMP.void);
    P(g, fcx + (dir === 2 ? 1 : -1), top + 5, bn[0]); if (dir !== 2) P(g, fcx + 1, top + 5, bn[1]);
  }
  // raised hand shading the eyes (front/side) — the scout's read
  if (!back) {
    const hx = cx + off + 5, hy = top + 3 - sway;
    for (let k = 0; k < 4; k++) P(g, hx - k, top + 6 - k, lt[1]);     // forearm up to brow
    fillRect(g, hx - 4, top + 2 - sway, 4, 1, bn[2]);                 // flat hand over brow
  } else {
    // arms at sides from behind
    for (const s of [-1, 1]) { const ax = cx + off + s * 4; for (let y = shoulderY + 1; y <= 27; y++) P(g, ax, y, ck[2]); }
  }
}

/* ============================ HERMIT (32×40) ============================ */
// Bent, ragged camp lore-keeper. Tattered layered robes, very long beard, leans on a
// gnarled staff topped with a small drift trinket. idle f1: trinket glints, beard sway.
function bodyHermit(g, R, f) {
  const { cx, off, dir, top, shoulderY, showFace, back } = R;
  const rb = RAMP.stone, lt = RAMP.dirt, bn = RAMP.bone, dr = RAMP.drift;
  const glint = f === 1;
  const hunch = 2;  // bent forward
  // tattered layered robe (hunched, wide hem)
  for (let y = shoulderY + hunch; y <= 36; y++) {
    const t = (y - (shoulderY + hunch)) / (36 - (shoulderY + hunch));
    const hw = Math.round(3.2 + t * 4.0);
    const cxx = cx + Math.round(off * 0.5) + (dir <= 2 ? 1 : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = rb[1]; if (x <= cxx - hw + 1) c = rb[0]; if (x >= cxx + hw - 1) c = rb[3];
      if ((x + 2 * y) % 6 === 0) c = rb[2];                            // patched layers
      if (hash2(x, y, 521) < 0.06) c = lt[3];
      P(g, x, y, c);
    }
  }
  // ragged hem
  for (let x = 0; x < 32; x++) { const v = G(g, x, 36); if (v && hash2(x, 0, 522) < 0.5) P(g, x, 36, RAMP.void); }
  // hunched head (down/forward), bald pate + wisp of hair
  const hx = cx + off + (dir <= 2 ? 1 : 0), hy = top + hunch + 2;
  for (let y = hy - 2; y <= hy + 2; y++) for (let x = hx - 3; x <= hx + 3; x++) { if ((x-hx)**2+(y-hy)**2 > 11) continue; let c = bn[2]; if (x < hx - 1) c = bn[1]; if (y > hy + 1) c = bn[3]; P(g, x, y, c); }
  P(g, hx - 3, hy - 2, bn[3]); P(g, hx + 3, hy - 1, bn[3]);            // wispy hair
  // very long beard cascading down the chest (front/side)
  if (!back) {
    for (let y = hy + 2; y <= 30; y++) { const bw = Math.max(1, 3 - Math.floor((y - hy) / 6)); for (let x = hx - bw; x <= hx + bw; x++) if (hash2(x, y, 523) < 0.85) P(g, x, y, bn[3 - (y < hy + 6 ? 1 : 0)]); }
    const ey = hy;
    P(g, hx + (dir === 2 ? 1 : -1), ey, RAMP.void); if (dir !== 2) P(g, hx + 1, ey, RAMP.void);
  }
  // gnarled staff in the right hand, topped with a drift trinket
  const sx = cx + off + 7;
  for (let y = top + 1; y <= 37; y++) P(g, sx + Math.round(Math.sin(y * 0.5) * 0.4), y, lt[1]);   // gnarled
  P(g, sx, top, lt[2]);
  // drift trinket bound at the top
  P(g, sx, top - 1, glint ? dr[0] : dr[1]); P(g, sx - 1, top - 1, dr[2]); P(g, sx + 1, top - 1, dr[2]);
  if (glint) { P(g, sx, top - 2, dr[1]); P(g, sx - 2, top - 1, dr[3]); P(g, sx + 2, top - 1, dr[3]); }
  // a hand gripping the staff
  P(g, sx - 1, top + 8, bn[2]); P(g, sx, top + 8, bn[1]);
}

const KEEPER_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const NPCS = {
  quartermaster: { body: 'bodyQuartermaster', sole: 'dirt',  desc: 'Outpost Quartermaster — gruff frontier trader' },
  scout:         { body: 'bodyScout',         sole: 'dirt',  desc: 'Frontier Scout — hooded watcher' },
  hermit:        { body: 'bodyHermit',        sole: 'stone', desc: 'The Hermit — ragged camp lore-keeper' },
};

function drawKeeper(kind, facing, f) {
  const g = makeGrid(32, 40);
  const R = rig(facing, 'idle', f);
  globalThis[NPCS[kind].body](g, R, f);
  keeperFeet(g, R, RAMP[NPCS[kind].sole]);
  outline(g, RAMP.void);
  return g;
}
function drawKeeperPortrait(kind, f) {
  const g = makeGrid(48, 64);
  const cx = 24, top = 10;
  const src = drawKeeper(kind, 's', f || 0);
  for (let y = 4; y <= 25; y++) for (let x = 4; x <= 27; x++) { const v = G(src, x, y); if (!v) continue; fillRect(g, cx - 24 + (x - 4) * 2, top + (y - 4) * 2, 2, 2, v.c); }
  for (let x = cx - 16; x <= cx + 16; x++) if ((x + 1) % 2 === 0) P(g, x, 61, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

Object.assign(globalThis, {
  keeperFeet, bodyQuartermaster, bodyScout, bodyHermit,
  KEEPER_FACINGS, NPCS, drawKeeper, drawKeeperPortrait,
});
