// Naevyr CAMP MINI-BOSSES — Colossus-scale, one per Frontier camp.
// Eval after pixlib.js + tiles.js + beasts.js (ell, shadeMass, spike, moteBurst).
// Same rig as beasts.js: drawX(facing, anim, f) -> grid. 5 facings s/se/e/ne/n,
// bottom-center anchor, 1px void outline, RAMP only. TOP 4px CLEAR for HP/level UI.
// anims: idle 2 · walk 6 · attack 4. Each also has a 48×64 boss-alert "banner" portrait.
//   drowned_king 110×110 (Drowned Ruins) · barrow_lord 110×116 (Barrow-Crypt)
//   ash_warlord  100×110 (Ashen Warcamp)

/* shared: a thick limb segment (boulder/bone leg) bottom→top with iso shading */
function pillarLeg(g, cx, topY, botY, hw, ramp, seed) {
  for (let y = topY; y <= botY; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    let c = ramp[1]; if (x < cx - hw + 2) c = ramp[0]; if (x > cx + hw - 2) c = ramp[3];
    if (seed != null && hash2(x, y, seed) < 0.06) c = ramp[2];
    P(g, x, y, c);
  }
}

/* ============================ 1 · THE DROWNED KING (110×110) ============================ */
// Bloated waterlogged monarch: tattered royal robe, barnacle-crusted shoulders, kelp
// strands, a broken gold crown, drowned-pale glare. Drags a great rusted anchor-cleaver.
// water + stone(robe) + bone(barnacle) + gold(crown) + grass(kelp) + drift(eyes).
function drawDrownedKing(facing, anim, f) {
  const g = makeGrid(110, 110);
  const wa = RAMP.water, st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold, gr = RAMP.grass, dr = RAMP.drift;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 3, 6, 3, 0][dir], cx = 55 + lean, groundY = 106;

  let bob = 0, armUp = 0, sway = 0, glow = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; glow = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -2, 0, 0, -2, 0][f]; sway = [0, 1, 2, 0, -1, -2][f]; }
  if (anim === 'attack') { armUp = [10, 16, -10, -4][f]; glow = [1, 2, 2, 1][f]; bob = [-1, -2, 2, 1][f]; }

  // puddle / wet apron
  ell(g, cx, groundY, 40, 7, (x, y, d) => P(g, x, y, d > 0.6 ? wa[3] : (hash2(x, y, 300) < 0.4 ? wa[2] : wa[3])));
  // two bloated legs under the robe
  [[-16, 0], [15, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 4 : 0;
    pillarLeg(g, cx + lx + (i ? -sway : sway), groundY - 26, groundY - lift, 8, wa, 301);
    P(g, cx + lx, groundY - lift, RAMP.void);
  });
  // robe-draped bloated body (wide belly)
  const tx = cx + (profile ? 4 : 0), tTop = groundY - 78 + bob, tBot = groundY - 18;
  for (let y = tTop; y <= tBot; y++) {
    const t = (y - tTop) / (tBot - tTop);
    const w = Math.round(20 + Math.sin(t * Math.PI) * 12);     // bulge at the belly
    for (let x = tx - w; x <= tx + w; x++) {
      let c = st[1]; if (x < tx - w + 4) c = st[0]; if (x > tx + w - 4) c = st[3];
      if (hash2(x, y, 302) < 0.05) c = st[2];
      // soaked lower robe (water-darkened) + drip seam
      if (t > 0.66) { c = wa[2]; if (x < tx - w + 4) c = wa[1]; if (x > tx + w - 4) c = wa[3]; if (hash2(x, y, 303) < 0.12) c = wa[3]; }
      P(g, x, y, c);
    }
  }
  // kelp strands hanging off the hem
  for (let i = -3; i <= 3; i++) { const sx = tx + i * 9; for (let k = 0; k < 5 + (i % 2 ? 2 : 0); k++) P(g, sx + Math.round(Math.sin(k + f) * 0.8), tBot + k, gr[2 + (k > 3 ? 1 : 0)]); }
  // barnacle clusters on the shoulders (bone nubs)
  [[-20, tTop + 6], [20, tTop + 7], [-14, tTop + 2]].forEach(([ox, oy], i) => { ell(g, tx + ox, oy, 4, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2])); P(g, tx + ox, oy, bn[1]); });
  // ribs of a sunken crown of office on the chest (gold medallion)
  P(g, tx, tTop + 22, gd[1]); P(g, tx - 1, tTop + 22, gd[2]); P(g, tx + 1, tTop + 22, gd[2]); P(g, tx, tTop + 21, gd[0]);
  // arms: left rests, right drags / raises the anchor-cleaver
  // left arm (rests at side)
  if (!back) { const ax = tx - 22; for (let y = tTop + 8; y <= tTop + 34; y++) { P(g, ax, y, wa[1]); P(g, ax + 1, y, wa[2]); } shadeMass(g, ax, tTop + 36, 4, 3, wa, 304); }
  // weapon arm (right)
  const shX = tx + 20, shY = tTop + 8;
  const wRaise = (anim === 'attack') ? armUp : (anim === 'idle' ? 0 : sway);
  for (let y = shY; y <= shY + 26 - Math.max(0, wRaise); y++) { P(g, shX, y, wa[1]); P(g, shX + 1, y, wa[2]); P(g, shX - 1, y, wa[2]); }
  // the great rusted anchor-cleaver
  const hgx = shX + 2, hgy = shY + 26 - Math.max(0, wRaise);
  if (!back) {
    if (anim === 'attack' && f >= 2) {
      // crashing down to the ground in front
      for (let k = 0; k < 30; k++) P(g, hgx + 2 + Math.round(k * 0.2), hgy + k, st[3]);          // haft swung forward
      const bx = hgx + 8, by = hgy + 28;
      for (let yy = 0; yy < 16; yy++) for (let xx = -10; xx <= 4; xx++) { if (xx < -10 + yy * 0.4) continue; let c = bn[3]; if (xx < -6) c = st[2]; if (hash2(bx + xx, by + yy, 305) < 0.2) c = RAMP.ember[3]; P(g, bx + xx, by + yy, c); }  // rusted cleaver head
      // impact splash
      if (f === 2) for (let i = 0; i < 12; i++) { const a = Math.PI + (i / 12) * Math.PI; P(g, Math.round(bx + Math.cos(a) * 14), Math.round(by + 12 + Math.sin(a) * 6), wa[0]); }
    } else {
      // shouldered / dragging
      for (let k = 0; k < 30; k++) P(g, hgx + Math.round(k * 0.1), hgy - k, st[3]);                // haft up over the shoulder
      const bx = hgx + 2, by = hgy - 30;
      for (let yy = 0; yy < 14; yy++) for (let xx = -3; xx <= 9; xx++) { if (xx > 9 - yy * 0.3) continue; let c = bn[3]; if (xx > 5) c = st[2]; if (hash2(bx + xx, by + yy, 306) < 0.2) c = RAMP.ember[3]; P(g, bx + xx, by + yy, c); }
    }
  }
  // head: kelp-draped, broken gold crown, drowned glare
  const hx = tx + (profile ? 5 : 0), hy = tTop - 6 + bob;
  shadeMass(g, hx, hy, 10, 8, wa, 307);
  // crown (broken, askew)
  for (let i = -8; i <= 8; i += 2) { const ch = (i === -2 || i === 4) ? 0 : (2 + (Math.abs(i) % 4 === 0 ? 1 : 0)); for (let k = 0; k < ch; k++) P(g, hx + i, hy - 8 - k, gd[1]); }
  for (let x = hx - 8; x <= hx + 8; x++) P(g, x, hy - 7, gd[2]);
  // kelp over the brow
  for (let i = -6; i <= 6; i += 2) P(g, hx + i, hy - 5 + (i % 4 ? 1 : 0), gr[1]);
  // drowned eyes
  if (!back) {
    const lit = glow > 0 || anim === 'attack';
    if (profile) P(g, hx + 6, hy - 1, lit ? dr[0] : wa[0]);
    else { P(g, hx - 4, hy - 1, lit ? dr[0] : wa[0]); P(g, hx + 4, hy - 1, lit ? dr[0] : wa[0]); }
    for (let x = hx - 5; x <= hx + 5; x++) P(g, x, hy + 4, wa[3]);                                   // grim slack jaw
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · THE BARROW LORD (110×116) ============================ */
// Crowned skeletal giant: colossal bone frame, tattered burial mantle, tarnished crown,
// drift-fire sockets, bone shards orbiting. Cleaves with a great bone blade.
// bone + stone(mantle) + gold(crown) + drift(sockets/magic).
function drawBarrowLord(facing, anim, f) {
  const g = makeGrid(110, 116);
  const bn = RAMP.bone, st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 3, 6, 3, 0][dir], cx = 55 + lean, groundY = 112;

  let bob = 0, armUp = 0, sway = 0, glow = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; glow = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -2, 0, 0, -2, 0][f]; sway = [0, 1, 2, 0, -1, -2][f]; }
  if (anim === 'attack') { armUp = [12, 18, -12, -5][f]; glow = [1, 2, 2, 1][f]; bob = [-1, -2, 2, 1][f]; }

  // bone legs (femurs)
  [[-14, 0], [14, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 4 : 0;
    const lxx = cx + lx + (i ? -sway : sway);
    for (let y = groundY - 30; y <= groundY - lift; y++) { const w = 5 - Math.round(Math.abs(y - (groundY - 15)) / 14); P(g, lxx - w, y, bn[2]); for (let x = lxx - w + 1; x <= lxx + w - 1; x++) P(g, x, y, bn[1]); P(g, lxx + w, y, bn[3]); }
    P(g, lxx, groundY - lift, RAMP.void);
    ell(g, lxx, groundY - lift - 1, 5, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2]));         // knee knob
  });
  // ribcage torso
  const tx = cx + (profile ? 4 : 0), tTop = groundY - 80 + bob, tBot = groundY - 28;
  // spine
  for (let y = tTop; y <= tBot; y++) P(g, tx, y, bn[2]);
  // ribs (curved pairs)
  for (let r = 0; r < 7; r++) {
    const ry = tTop + 6 + r * 6; const span = 16 - r;
    for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) {
      const x = tx + s * k, y = ry + Math.round((k / span) * (k / span) * 7);
      P(g, x, y, k > span - 2 ? bn[2] : bn[1]);
    }
  }
  // tattered burial mantle over the shoulders (stone, sways)
  for (let y = tTop - 2; y <= tBot - 6; y++) {
    const t = (y - (tTop - 2)) / (tBot - 6 - (tTop - 2));
    const w = Math.round(20 + t * 6);
    for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 6; x++) { const xx = tx + s * (w - x) + (y > tBot - 16 ? Math.round(sway * t) : 0); let c = st[1]; if (x === 0) c = st[0]; if (x > 4) c = st[3]; if (hash2(xx, y, 311) < 0.06) c = st[2]; P(g, xx, y, c); }
  }
  // tattered mantle hem
  for (let x = tx - 26; x <= tx + 26; x++) { const yy = tBot - 6 + Math.round(Math.sin(x * 0.5) * 1.5); if (Math.abs(x - tx) > 14 && hash2(x, 0, 312) < 0.7) P(g, x, yy, st[3]); }
  // floating bone shards orbiting (denser on idle f1 / attack)
  if (glow > 0 || anim === 'attack') { [[-30, tTop + 14], [32, tTop + 24], [-26, tTop + 40], [30, tTop + 6]].forEach(([ox, oy], i) => { for (let k = 0; k < 3; k++) P(g, tx + ox, oy + k, k === 1 ? bn[0] : bn[2]); }); }
  // arms (humeri) + great bone blade in the right
  if (!back) { const ax = tx - 20; for (let y = tTop + 4; y <= tTop + 30; y++) { P(g, ax, y, bn[1]); P(g, ax - 1, y, bn[2]); P(g, ax + 1, y, bn[3]); } ell(g, ax, tTop + 32, 4, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2])); }
  const shX = tx + 18, shY = tTop + 4;
  const wRaise = (anim === 'attack') ? armUp : (anim === 'idle' ? 0 : sway);
  for (let y = shY; y <= shY + 24 - Math.max(0, wRaise); y++) { P(g, shX, y, bn[1]); P(g, shX + 1, y, bn[3]); P(g, shX - 1, y, bn[2]); }
  const hgx = shX, hgy = shY + 24 - Math.max(0, wRaise);
  if (!back) {
    if (anim === 'attack' && f >= 2) {
      // blade cleaving down
      for (let k = 0; k < 34; k++) { const x = hgx + 4 + Math.round(k * 0.2), y = hgy + k; const w = 1 + Math.round(k / 10); for (let i = -1; i <= w; i++) P(g, x + i, y, i === w ? bn[3] : (i < 0 ? bn[0] : bn[1])); }
      if (f === 2) moteBurst(g, hgx + 12, hgy + 30, 10, 0.6, 313);                                    // drift edge flare
    } else {
      // raised over the shoulder
      for (let k = 0; k < 36; k++) { const x = hgx - Math.round(k * 0.1), y = hgy - k; const w = 1 + Math.round(k / 11); for (let i = -1; i <= w; i++) P(g, x + i, y, i === w ? bn[3] : (i < 0 ? bn[0] : bn[1])); }
    }
  }
  // crowned skull
  const hx = tx + (profile ? 5 : 0), hy = tTop - 10 + bob;
  for (let y = hy - 8; y <= hy + 7; y++) for (let x = hx - 9; x <= hx + 9; x++) { if (Math.abs(x - hx) + Math.abs(y - hy) > 13) continue; let c = bn[1]; if (x < hx - 4) c = bn[0]; if (y > hy + 3) c = bn[2]; if (x > hx + 5) c = bn[3]; P(g, x, y, c); }
  // jaw + teeth
  for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy + 8, bn[2]); for (let x = hx - 5; x <= hx + 5; x += 2) P(g, x, hy + 7, bn[3]);
  // tarnished crown
  for (let i = -8; i <= 8; i += 2) { const chh = 2 + (Math.abs(i) % 4 === 0 ? 1 : 0); for (let k = 0; k < chh; k++) P(g, hx + i, hy - 9 - k, gd[2]); P(g, hx + i, hy - 9, gd[1]); }
  for (let x = hx - 8; x <= hx + 8; x++) P(g, x, hy - 8, gd[2]);
  // drift-fire sockets
  if (!back) {
    const lit = glow > 0 || anim === 'attack';
    if (profile) { for (let y = hy - 3; y <= hy; y++) P(g, hx + 5, y, RAMP.void); P(g, hx + 5, hy - 1, lit ? dr[0] : dr[1]); }
    else { for (const ox of [-4, 4]) { for (let y = hy - 3; y <= hy; y++) P(g, hx + ox, y, RAMP.void); P(g, hx + ox, hy - 1, lit ? dr[0] : dr[1]); } }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · THE ASH WARLORD (100×110) ============================ */
// Ember-armored raider champion: heavy ash plate veined with ember, horned helm with a
// burning visor, blood war-cloak, great ember-hot blade (two-handed overhead slash).
// dirt/stone(plate) + ember(forge cracks/blade) + gold(trim) + blood(cloak) + bone(horns).
function drawAshWarlord(facing, anim, f) {
  const g = makeGrid(100, 110);
  const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold, bl = RAMP.blood, bn = RAMP.bone;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 3, 5, 3, 0][dir], cx = 50 + lean, groundY = 106;

  let bob = 0, armUp = 0, sway = 0, hot = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; hot = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -2, 0, 0, -2, 0][f]; sway = [0, 1, 2, 0, -1, -2][f]; }
  if (anim === 'attack') { armUp = [14, 20, -14, -6][f]; hot = [1, 2, 2, 1][f]; bob = [-1, -2, 2, 1][f]; }

  // blood war-cloak behind (drawn first)
  if (!profile) {
    for (let y = groundY - 74 + bob; y <= groundY - 6; y++) {
      const t = (y - (groundY - 74 + bob)) / 68; const w = Math.round(16 + t * 10);
      for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 5; x++) { const xx = cx + s * (w - x) + (y > groundY - 24 ? Math.round(sway) : 0); let c = bl[2]; if (x === 0) c = bl[1]; if (x > 3) c = bl[3]; P(g, xx, y, c); }
    }
  }
  // armored legs (greaves)
  [[-13, 0], [13, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 4 : 0;
    pillarLeg(g, cx + lx + (i ? -sway : sway), groundY - 30, groundY - lift, 7, dt, 321);
    // ember knee crack + gold trim
    P(g, cx + lx, groundY - 16, em[hot ? 0 : 2]); for (let x = cx + lx - 6; x <= cx + lx + 6; x++) P(g, x, groundY - 22, gd[3]);
    P(g, cx + lx, groundY - lift, RAMP.void);
  });
  // heavy plate torso
  const tx = cx + (profile ? 3 : 0), tTop = groundY - 74 + bob, tBot = groundY - 26;
  for (let y = tTop; y <= tBot; y++) {
    const t = (y - tTop) / (tBot - tTop); const w = Math.round(19 - t * 4);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = dt[1]; if (x < tx - w + 4) c = dt[0]; if (x > tx + w - 4) c = dt[3];
      if (hash2(x, y, 322) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  // ember forge-cracks across the plate
  [[-8, 10], [5, 16], [-2, 24], [9, 12], [-10, 30], [2, 36]].forEach(([ox, oy]) => { const x = tx + ox, y = tTop + oy; P(g, x, y, hot ? em[0] : em[2]); P(g, x, y + 1, hot ? em[1] : em[3]); if (hot >= 2) P(g, x + 1, y, gd[0]); });
  // gold pauldron trim + a trophy skull on the left shoulder
  for (let x = tx - 20; x <= tx - 8; x++) P(g, x, tTop + 4, gd[2]);
  for (let x = tx + 8; x <= tx + 20; x++) P(g, x, tTop + 4, gd[2]);
  shadeMass(g, tx - 18, tTop + 2, 5, 4, dt, 323); P(g, tx - 18, tTop + 1, bn[1]); P(g, tx - 19, tTop + 2, RAMP.void); P(g, tx - 17, tTop + 2, RAMP.void);
  // arms (pauldrons + gauntlets); right wields the great blade two-handed
  [[-1, -17], [1, 17]].forEach(([sgn, ox]) => {
    const shX = tx + ox, shY = tTop + 3;
    shadeMass(g, shX, shY + 2, 6, 4, dt, 324);                                                       // pauldron
    const drop = (anim === 'attack' && sgn > 0) ? armUp : (anim === 'attack' ? Math.round(armUp * 0.6) : 0);
    for (let y = shY + 4; y <= shY + 20; y++) { const yy = y - drop; for (let x = shX - 3; x <= shX + 3; x++) { let c = dt[1]; if (x < shX - 1) c = dt[0]; if (x > shX + 1) c = dt[3]; P(g, x, Math.round(yy), c); } }
    shadeMass(g, shX, shY + 22 - drop, 4, 3, st, 325);                                                // gauntlet fist
  });
  // the great ember blade (held by the right fist)
  if (!back) {
    const fistX = tx + 17, fistY = tTop + 25 - (anim === 'attack' ? armUp : 0);
    if (anim === 'attack' && f >= 2) {
      // overhead slash crashing forward-down
      for (let k = 0; k < 46; k++) { const x = fistX + 2 + Math.round(k * 0.5), y = fistY - 6 + k; const w = 2 + Math.round(k / 12); for (let i = -1; i <= w; i++) { let c = st[0]; if (i === w) c = st[3]; if (i >= 0 && i < w) c = (hash2(x, y, 326) < 0.5 ? em[hot ? 0 : 1] : st[1]); P(g, x + i, y, c); } }
      if (f === 2) for (let i = 0; i < 14; i++) { const a = Math.PI * 0.2 + (i / 14) * Math.PI * 0.7; P(g, Math.round(fistX + 22 + Math.cos(a) * 16), Math.round(fistY + 28 + Math.sin(a) * 10), em[i % 2 ? 0 : 1]); }  // fire arc
    } else {
      // raised high overhead (windup / idle ready)
      for (let k = 0; k < 48; k++) { const x = fistX - Math.round(k * 0.08), y = fistY - 6 - k; const w = 2 + Math.round(k / 13); for (let i = -1; i <= w; i++) { let c = st[0]; if (i === w) c = st[3]; if (i >= 0 && i < w) c = (hash2(x, y, 327) < 0.5 ? em[hot ? 0 : 1] : st[1]); P(g, x + i, y, c); } }
      // crossguard
      for (let x = fistX - 5; x <= fistX + 5; x++) P(g, x, fistY - 4, gd[2]);
    }
  }
  // horned helm with burning visor
  const hx = tx + (profile ? 4 : 0), hy = tTop - 8 + bob;
  shadeMass(g, hx, hy, 8, 7, dt, 328);
  // horns (bone, curving up-out)
  for (let s = -1; s <= 1; s += 2) { for (let k = 0; k < 6; k++) P(g, hx + s * (7 + Math.round(k * 0.4)), hy - 4 - k, k > 3 ? bn[0] : bn[2]); }
  // gold helm ridge
  for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy - 6, gd[2]); P(g, hx, hy - 8, gd[1]);
  // burning visor slit
  if (!back) {
    const lit = hot || anim === 'attack';
    if (profile) { for (let x = hx + 2; x <= hx + 6; x++) P(g, x, hy, RAMP.void); P(g, hx + 5, hy, lit ? em[0] : em[1]); }
    else { for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy + 1, RAMP.void); for (let x = hx - 5; x <= hx + 5; x += 2) P(g, x, hy + 1, lit ? em[0] : em[1]); }
  }
  outline(g, RAMP.void);
  return g;
}

const BOSS_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const MINIBOSSES = {
  drowned_king: { fn: 'drawDrownedKing', cell: [110, 110], anims: [['idle', 2], ['walk', 6], ['attack', 4]], hurt: 'water-hi (#4a7fa0) then bone-hi', camp: 'Drowned Ruins' },
  barrow_lord:  { fn: 'drawBarrowLord',  cell: [110, 116], anims: [['idle', 2], ['walk', 6], ['attack', 4]], hurt: 'bone-hi (#efe9f4) then drift-hi', camp: 'Barrow-Crypt' },
  ash_warlord:  { fn: 'drawAshWarlord',  cell: [100, 110], anims: [['idle', 2], ['walk', 6], ['attack', 4]], hurt: 'ember-hi (#fcd34d)', camp: 'Ashen Warcamp' },
};

// 48×64 boss-alert banner portrait — a menacing bust, 2f idle, drawn from the s-facing.
function drawBossPortrait(name, f) {
  const g = makeGrid(48, 64);
  const fn = globalThis[MINIBOSSES[name].fn];
  const src = fn('s', 'idle', f || 0);
  const [cw, ch] = MINIBOSSES[name].cell;
  // crop the head+shoulders band from the big sprite and 1.6×-ish fit into the bust
  const cropX0 = Math.round(cw / 2 - 22), cropY0 = Math.round(ch * 0.0) + (name === 'ash_warlord' ? 18 : 14);
  const cropW = 44, cropH = 40, sc = 48 / cropW;
  for (let y = 0; y < cropH; y++) for (let x = 0; x < cropW; x++) {
    const v = G(src, cropX0 + x, cropY0 + y); if (!v) continue;
    const px = Math.round(x * sc), py = 6 + Math.round(y * sc);
    fillRect(g, px, py, Math.ceil(sc), Math.ceil(sc), v.c);
  }
  // bottom banner bar + name notch
  for (let x = 0; x < 48; x++) P(g, x, 60, RAMP.void);
  for (let x = 0; x < 48; x++) if ((x + (f || 0)) % 2 === 0) P(g, x, 61, RAMP.blood[3]);
  outline(g, RAMP.void);
  return g;
}

Object.assign(globalThis, {
  pillarLeg, drawDrownedKing, drawBarrowLord, drawAshWarlord,
  BOSS_FACINGS, MINIBOSSES, drawBossPortrait,
});
