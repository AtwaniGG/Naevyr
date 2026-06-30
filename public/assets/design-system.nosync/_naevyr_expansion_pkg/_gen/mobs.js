// Naevyr FRONTIER MOBS — eval after pixlib.js + tiles.js + beasts.js (ell, shadeMass,
// spike, moteBurst). Same rig as beasts.js: drawX(facing, anim, f) -> grid.
// 5 facings s/se/e/ne/n (engine mirrors w/sw/nw), bottom-center anchor (base on last
// row), 1px void auto-outline, RAMP only, deterministic. TOP 4px LEFT CLEAR for HP bar.
//   bogwretch  32×40  idle2 · walk6 · cast4         (Palewater ranged spitter)
//   barrow_wight 32×44 idle2 · walk6 · summon4      (Bonefields summoner)
//   bone_husk  28×36  idle2 · walk6 · swing4        (Wight's skeletal add)
//   ash_brute  48×52  idle2 · walk6 · slam4         (Ashen AoE slammer)
//   drift_wisp 28×32  hover4 · dive3                (flying; paired ground shadow)
//   drift_wisp_shadow 16×8  bob4                    (separate ground shadow)

const DIRMAP = { s: 0, se: 1, e: 2, ne: 3, n: 4 };

/* ============================ 1 · BOGWRETCH (32×40) ============================ */
// Hunched amphibian spitter — waterlogged pale hide, bloated throat sac that
// inflates on cast, wide maw. water + grass + bone ramps, drift-tinted spit.
function drawBogwretch(facing, anim, f) {
  const g = makeGrid(32, 40);
  const wa = RAMP.water, gr = RAMP.grass, bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir], cx = 16 + lean, groundY = 38;

  let bob = 0, sac = 0, rear = 0, mouth = 0, step = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; sac = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; step = [2, 1, 0, -2, -1, 0][f]; }
  if (anim === 'cast') { rear = [-2, -3, 1, 2][f]; sac = [1, 3, 1, 0][f]; mouth = [0, 0, 2, 1][f]; }

  const hipY = groundY - 7 + bob;
  // squat bent toad legs (thick, splayed knees) + webbed feet
  [[-7, -1], [7, 1]].forEach(([lx, ph], i) => {
    const k2 = anim === 'walk' ? ((f + i) % 2 ? 1 : 0) : 0;
    const fx = cx + lx + (i ? -step : step);
    // thigh up-and-out, shin down to foot (bent knee)
    P(g, fx - ph, hipY - 1, wa[2]); P(g, fx - ph, hipY, wa[1]);
    for (let y = hipY + 1; y < groundY - 1 - k2; y++) { P(g, fx, y, wa[2]); P(g, fx + ph, y, wa[3]); }
    // webbed foot (3 wide)
    P(g, fx - 1, groundY - 1, wa[1]); P(g, fx, groundY - 1, RAMP.void); P(g, fx + 1, groundY - 1, wa[1]); P(g, fx + ph, groundY - 1, wa[2]);
  });
  // bloated hunched body
  const bx = cx + rear * 0.4;
  shadeMass(g, bx, hipY - 4, profile ? 8 : 7, 5, wa, 110);
  // small forelimbs resting forward on the ground (front/side facings)
  if (!back) {
    const ax = bx + (profile ? 5 : 4);
    P(g, ax, hipY + 1, wa[2]); P(g, ax + 1, hipY + 2, wa[1]); P(g, ax + 2, hipY + 2, wa[1]);   // little clawed hand
    if (!profile) { P(g, bx - 4, hipY + 1, wa[2]); P(g, bx - 5, hipY + 2, wa[1]); P(g, bx - 6, hipY + 2, wa[1]); }
  }
  // mottled grass-slime blotches on the back
  [[-3, -5], [2, -6], [4, -2], [-5, -1]].forEach(([ox, oy], i) => { if (hash2(i, 1, 111) < 0.8) P(g, bx + ox, hipY - 4 + oy, gr[2]); });
  // spine nubs
  if (back) { [-3, 0, 3].forEach(sx => spike(g, bx + sx, hipY - 8, 3, false)); }
  // head + throat sac (front/side)
  if (!back) {
    const hx = bx + (profile ? 6 : 0), hy = hipY - 6 + (profile ? 0 : 0);
    shadeMass(g, hx, hy, profile ? 5 : 5, 4, wa, 112);
    // bulging eyes (pale, drift glint when casting)
    const lit = (anim === 'idle' && f === 1) || anim === 'cast';
    if (profile) { P(g, hx + 3, hy - 2, bn[0]); P(g, hx + 3, hy - 2, lit ? dr[1] : bn[2]); }
    else { P(g, hx - 2, hy - 2, lit ? dr[1] : bn[0]); P(g, hx + 2, hy - 2, lit ? dr[1] : bn[0]); }
    // wide maw (opens on spit)
    if (mouth > 0) { for (let i = -2; i <= 2; i++) P(g, hx + (profile ? 3 : i), hy + 2 + (profile ? i : 0), RAMP.void); P(g, hx + (profile ? 4 : 0), hy + 2, dr[2]); }
    // inflating throat sac under the chin
    const sw = 3 + sac;
    ell(g, hx, hy + 4 + Math.floor(sac / 2), sw, 2 + sac, (x, y, d, dx, dy) => { let c = wa[1]; if (dy < -0.3) c = wa[0]; if (d > 0.7) c = wa[3]; P(g, x, y, c); });
    if (sac >= 2) for (let i = -1; i <= 1; i++) P(g, hx + i, hy + 4, dr[3]);       // drift glow charging
  } else {
    shadeMass(g, bx, hipY - 6, 4, 3, wa, 113);                                    // haunch from behind
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · BARROW WIGHT (32×44) ========================= */
// Tall robed undead summoner — stone-grey burial robe, deep hood, skeletal hands
// that rise to call adds; drift-fire eyes. stone(robe) + bone + drift.
function drawBarrowWight(facing, anim, f) {
  const g = makeGrid(32, 44);
  const st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir], cx = 16, groundY = 42;

  let bob = 0, hemSway = 0, arms = 0, glow = 0, step = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; hemSway = f === 1 ? 1 : 0; glow = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; hemSway = [0, 1, 1, 0, -1, -1][f]; step = [1, 1, 0, -1, -1, 0][f]; }
  if (anim === 'summon') { arms = [1, 3, 4, 2][f]; glow = [0, 1, 2, 1][f]; }

  const top = 7 + bob, shoulderY = 17 + bob;
  // long burial robe (tall taper to floor)
  for (let y = shoulderY; y <= 40; y++) {
    const t = (y - shoulderY) / (40 - shoulderY);
    const hw = Math.round(3.4 + t * 4.0);
    const cxx = cx + Math.round(off * 0.5) + (y > 33 ? Math.round(hemSway * 0.6) : 0) + (anim === 'walk' ? Math.round(step * t) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = st[1]; if (x <= cxx - hw + 1) c = st[0]; if (x >= cxx + hw - 1) c = st[3];
      if (hash2(x, y, 121) < 0.05) c = st[2];
      if (back && x === cxx) c = st[2];
      P(g, x, y, c);
    }
  }
  // tattered hem
  for (let x = 0; x < 32; x++) { const v = G(g, x, 40); if (v && hash2(x, 0, 122) < 0.4) P(g, x, 40, RAMP.void); }
  // bone trim at the hem + a drift sigil on the chest
  P(g, cx + off, shoulderY + 6, dr[glow > 0 ? 1 : 2]);
  if (glow >= 1) { P(g, cx + off - 1, shoulderY + 6, dr[2]); P(g, cx + off + 1, shoulderY + 6, dr[2]); P(g, cx + off, shoulderY + 5, dr[2]); }
  // deep hood
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.2) * Math.PI * 0.55) * 3.6);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) { let c = st[1]; if (x === cxx - hw) c = st[0]; if (x >= cxx + hw - 1) c = st[3]; if (y === top) c = st[0]; P(g, x, y, c); }
  }
  P(g, cx + off, top - 1, st[1]);
  // hollow face + drift-fire eyes
  if (!back) {
    const fcx = cx + off + (profile ? 2 : 0); const ey = top + 5;
    for (let y = top + 3; y <= top + 8; y++) for (let x = fcx - (profile ? 0 : 2); x <= fcx + 2; x++) P(g, x, y, RAMP.void);
    const lit = glow > 0 || anim === 'summon';
    if (profile) P(g, fcx + 1, ey, lit ? dr[0] : dr[1]);
    else { P(g, fcx - 1, ey, lit ? dr[0] : dr[1]); P(g, fcx + 1, ey, lit ? dr[0] : dr[1]); }
  }
  // skeletal arms — at sides (idle/walk) or raised (summon)
  [[-1], [1]].forEach(([s]) => {
    const ax = cx + off + s * 4;
    if (anim === 'summon') {
      const ay = shoulderY + 2 - arms;
      for (let k = 0; k < 6; k++) { const x = ax + s * Math.round(k * 0.5), y = ay - k; P(g, x, y, bn[1]); }
      const hx = ax + s * 3, hy = ay - 6;
      P(g, hx, hy, bn[0]); P(g, hx + s, hy, bn[1]); P(g, hx, hy - 1, bn[0]);       // bony hand
      if (glow >= 1) moteBurst(g, hx, hy - 2, 3 + glow, 0.6, 125 + s);
    } else {
      for (let y = shoulderY + 2; y <= 30; y++) P(g, ax + s * (profile ? 1 : 0), y, st[3]);
      P(g, ax + s, 30, bn[2]);                                                     // hand peeks from sleeve
    }
  });
  // summon: bone shards rising from the ground in front
  if (anim === 'summon' && f >= 2) {
    [[-7, 2], [7, 1], [0, 3]].forEach(([ox, h]) => { for (let k = 0; k < h + f - 1; k++) P(g, cx + off + ox, groundY - 1 - k, bn[k > h ? 0 : 1]); });
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · BONE HUSK (28×36) ============================ */
// Small skeletal minion the Wight summons — crude bone club, drift-spark eyes.
function drawBoneHusk(facing, anim, f) {
  const g = makeGrid(28, 36);
  const bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir], cx = 14, groundY = 34;

  let bob = 0, step = 0, ang = null, rattle = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; rattle = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; step = [2, 1, 0, -2, -1, 0][f]; }
  if (anim === 'swing') ang = [-2.1, -1.35, -0.45, 0.35][f];

  const top = 8 + bob, hipY = top + 14, shoulderY = top + 6;
  // legs (bone)
  [[-2, -1], [2, 1]].forEach(([lx, ph], i) => {
    const sx = cx + lx + (i ? -step : step);
    for (let y = hipY; y < groundY - 1; y++) P(g, sx, y, bn[2]);
    P(g, sx, groundY - 1, RAMP.void); P(g, sx + ph, groundY - 1, bn[1]);
  });
  // ribcage torso
  for (let y = shoulderY; y <= hipY; y++) {
    const hw = 3; const cxx = cx + Math.round(off * 0.4);
    P(g, cxx - hw, y, bn[2]); P(g, cxx + hw, y, bn[3]);                            // spine sides
    if ((y - shoulderY) % 2 === 0) for (let x = cxx - hw + 1; x <= cxx + hw - 1; x++) P(g, x, y, bn[1]); // ribs
    else P(g, cxx, y, bn[2]);                                                       // spine
  }
  // skull
  const hx = cx + off;
  shadeMass(g, hx, top + 3, 3, 3, bn, 131);
  if (!back) {
    const lit = rattle || anim === 'swing';
    if (profile) P(g, hx + 2, top + 3, lit ? dr[0] : dr[2]);
    else { P(g, hx - 1, top + 3, lit ? dr[0] : dr[2]); P(g, hx + 1, top + 3, lit ? dr[0] : dr[2]); }
    P(g, hx, top + 5, RAMP.void);                                                  // jaw gap
  }
  // arm + bone club
  const shx = hx + 3, shy = shoulderY + 1;
  if (anim === 'swing') {
    for (let k = 1; k < 6; k++) P(g, Math.round(shx + Math.cos(ang) * k), Math.round(shy + Math.sin(ang) * k), bn[2]);
    const ex = Math.round(shx + Math.cos(ang) * 6), ey = Math.round(shy + Math.sin(ang) * 6);
    fillRect(g, ex - 1, ey - 1, 2, 3, bn[1]); P(g, ex, ey - 2, bn[0]);             // club head
    if (f === 2) P(g, ex + 2, ey, dr[0]);
  } else {
    for (let y = shy; y <= shy + 5; y++) P(g, shx, y, bn[2]);
    P(g, shx, shy + 6, bn[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 4 · ASH BRUTE (48×52) ============================ */
// Heavy AoE slammer — slab-muscled ash-grey hulk veined with ember; raises both
// fists and slams. dirt/stone body + ember cracks + gold-hot core on slam.
function drawAshBrute(facing, anim, f) {
  const g = makeGrid(48, 52);
  const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 2, 3, 2, 0][dir], cx = 24 + lean, groundY = 50;

  let stomp = 0, armUp = 0, hot = 0, shake = 0;
  if (anim === 'idle') { stomp = f === 1 ? 1 : 0; hot = f === 1 ? 1 : 0; }
  if (anim === 'walk') { stomp = [0, 1, 0, 1][f] ?? 0; shake = [0, 0, 1, 0][f] ?? 0; }
  if (anim === 'slam') { armUp = [4, 7, 7, -3][f]; hot = [1, 2, 2, 0][f]; shake = [0, 0, 0, 2][f]; }

  const baseY = groundY - (shake ? 0 : 0);
  // thick legs
  [[-9, 0], [9, 0]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 2 : 0;
    for (let y = baseY - 16; y <= baseY - lift; y++) for (let x = cx + lx - 4; x <= cx + lx + 4; x++) {
      let c = dt[1]; if (x < cx + lx - 2) c = dt[0]; if (x > cx + lx + 2) c = dt[3];
      if (hash2(x, y, 141) < 0.06) c = st[2];
      P(g, x, y, c);
    }
    P(g, cx + lx, baseY - lift, RAMP.void);
  });
  // hulking torso (slab muscle)
  const tx = cx + (profile ? 3 : 0), tTop = baseY - 40 + stomp, tBot = baseY - 15;
  for (let y = tTop; y <= tBot; y++) {
    const w = 14 + Math.round((y - tTop) / 7);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = dt[1]; if (x < tx - w + 3) c = dt[0]; if (x > tx + w - 3) c = dt[3];
      if (y > tBot - 4) c = dt[3];
      if (hash2(x, y, 142) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  // glowing ember cracks (pulse on idle f1 / hot on slam)
  const crk = [[-7, 8], [4, 12], [-2, 18], [8, 6], [-9, 15], [1, 22]];
  crk.forEach(([ox, oy], i) => {
    const x = tx + ox, y = tTop + oy;
    P(g, x, y, hot ? em[0] : em[2]); P(g, x, y + 1, hot ? em[1] : em[3]);
    if (hot >= 2) { P(g, x + 1, y, gd[0]); P(g, x, y - 1, em[1]); }
  });
  // shoulders + arms (raise on slam)
  [[-1, -15], [1, 15]].forEach(([sgn, ox]) => {
    const shX = tx + ox, shY = tTop + 3;
    shadeMass(g, shX, shY + 1, 5, 4, dt, 143);                                     // shoulder boulder
    const drop = (anim === 'slam') ? armUp : 0;
    for (let y = shY + 3; y <= shY + 16; y++) {
      const yy = y - drop;
      for (let x = shX - 3; x <= shX + 3; x++) { let c = dt[1]; if (x < shX - 1) c = dt[0]; if (x > shX + 1) c = dt[3]; P(g, x, Math.round(yy), c); }
    }
    // massive fist
    const fy = shY + 16 - drop;
    shadeMass(g, shX, fy, 5, 4, st, 144);
    if (hot >= 1) { P(g, shX, fy - 1, em[1]); }
  });
  // head (small, sunken, single ember glare) on a thick neck
  if (!back) {
    const hx = tx + (profile ? 4 : 0), hy = tTop - 3 + stomp;
    shadeMass(g, hx, hy, 5, 4, dt, 145);
    const lit = hot || anim === 'slam';
    if (profile) P(g, hx + 2, hy, lit ? em[0] : em[1]);
    else { P(g, hx - 2, hy, lit ? em[0] : em[1]); P(g, hx + 2, hy, lit ? em[0] : em[1]); }
    for (let x = hx - 3; x <= hx + 3; x++) P(g, x, hy + 3, dt[3]);                  // heavy brow/jaw
  } else shadeMass(g, tx, tTop - 3 + stomp, 5, 4, dt, 146);
  // slam impact: ember dust kicked at the feet (the full shockwave ring is mobfx)
  if (anim === 'slam' && f === 3) {
    for (let i = 0; i < 10; i++) { const ox = -20 + i * 4; P(g, cx + ox, groundY - 1, em[2]); if (i % 2) P(g, cx + ox, groundY - 2, em[1]); }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 5 · DRIFT WISP (28×32, flying) ==================== */
// Hovering corrupted mote — bright drift core, trailing tendrils, mote halo. Body
// sits in the UPPER cell (hovers); bottom rows empty. Pairs with drift_wisp_shadow.
function drawDriftWisp(facing, anim, f) {
  const g = makeGrid(28, 32);
  const dr = RAMP.drift;
  const dir = DIRMAP[facing]; const profile = dir === 2, back = dir >= 3;
  const cx = 14 + [0, 1, 1, 1, 0][dir];

  let cy = 12, gather = 0;
  if (anim === 'hover') { cy = 12 + [0, -1, -2, -1][f]; }          // 4-frame bob
  if (anim === 'dive')  { cy = [10, 8, 18][f]; gather = [1, 2, 0][f]; }  // gather high → dart down

  // trailing tendrils below the core (wave with bob)
  for (let i = -1; i <= 1; i++) {
    const tx = cx + i * 3;
    for (let k = 1; k <= 5; k++) {
      const wob = Math.round(Math.sin(k * 0.8 + f + i) * 1.2);
      P(g, tx + wob, cy + 3 + k, k > 3 ? dr[3] : dr[2]);
    }
  }
  // glowing core
  ell(g, cx, cy, 4, 3.4, (x, y, d) => P(g, x, y, d < 0.28 ? dr[0] : d < 0.62 ? dr[1] : d < 0.85 ? dr[2] : dr[3]));
  // bright inner eye
  P(g, cx, cy, dr[0]); P(g, cx + (profile ? 1 : 0), cy, dr[0]);
  // mote halo (denser when gathering to dive)
  moteBurst(g, cx, cy, 6 + gather * 2, 0.4 + gather * 0.18, 150 + f);
  if (gather >= 1) { P(g, cx, cy - 5, dr[0]); P(g, cx - 5, cy, dr[1]); P(g, cx + 5, cy, dr[1]); }
  // NOTE: corruption motes get NO outline; the core does
  outline(g, RAMP.void);
  return g;
}
// separate ground shadow (bottom-anchored). 4f to track the hover bob (wider when low).
function drawWispShadow(f) {
  const g = makeGrid(16, 8);
  const wide = [4, 3, 2, 3][f] || 3;            // smaller when wisp is higher
  ell(g, 8, 5, wide, 1.6, (x, y, d) => P(g, x, y, d < 0.5 ? RAMP.drift[4] : RAMP.stone[3]));
  return g;  // no outline — it's a cast shadow
}

const MOB_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const MOBS = {
  bogwretch:    { fn: 'drawBogwretch',  cell: [32, 40], anims: [['idle', 2], ['walk', 6], ['cast', 4]], hurt: 'water-hi (#4a7fa0)' },
  barrow_wight: { fn: 'drawBarrowWight',cell: [32, 44], anims: [['idle', 2], ['walk', 6], ['summon', 4]], hurt: 'drift-hi (#d8b4fe)' },
  bone_husk:    { fn: 'drawBoneHusk',   cell: [28, 36], anims: [['idle', 2], ['walk', 6], ['swing', 4]], hurt: 'bone-hi (#efe9f4)' },
  ash_brute:    { fn: 'drawAshBrute',   cell: [48, 52], anims: [['idle', 2], ['walk', 4], ['slam', 4]], hurt: 'ember-hi (#fcd34d)' },
  drift_wisp:   { fn: 'drawDriftWisp',  cell: [28, 32], anims: [['hover', 4], ['dive', 3]], hurt: 'drift-core (#f3e8ff)', flying: true },
};

Object.assign(globalThis, {
  DIRMAP, drawBogwretch, drawBarrowWight, drawBoneHusk, drawAshBrute, drawDriftWisp, drawWispShadow,
  MOB_FACINGS, MOBS,
});
