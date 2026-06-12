// Naevyr creature generators — eval after pixlib.js (+ tiles.js for RAMP/helpers).
// Same conventions as character.js: drawX(facing, anim, frame) -> grid.
// 5 facings s/se/e/ne/n (engine mirrors w/sw/nw), bottom-center anchor (base on
// last row), 1px void auto-outline, locked RAMP only, deterministic.
// TOP 4px OF EVERY CELL LEFT EMPTY for engine HP-bar / level-tag clearance.

function ell(g, cx, cy, rx, ry, fn) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d <= 1) fn(x, y, d, dx, dy);
    }
  }
}
// shade a stone-ish mass: lit top-left, shadowed bottom-right, rim dark
function shadeMass(g, cx, cy, rx, ry, ramp, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    let c = ramp[1];
    if (d > 0.72) c = ramp[3];                 // rim shadow
    else if (dx + dy < -0.45) c = ramp[0];     // moonlit hi
    else if (dx + dy > 0.5) c = ramp[2];       // lower shadow
    if (seed != null && hash2(x, y, seed) < 0.07) c = ramp[2]; // cracked speckle
    P(g, x, y, c);
  });
}
// jagged spike pointing up from (bx, baseY), height h, drift ramp + glow tip
function spike(g, bx, baseY, h, lit) {
  const dr = RAMP.drift;
  for (let k = 0; k < h; k++) {
    const w = Math.max(0, Math.round((h - k) / 2.4));
    for (let x = bx - w; x <= bx + w; x++) P(g, x, baseY - k, k > h - 2 ? (lit ? dr[0] : dr[1]) : dr[3]);
  }
  P(g, bx, baseY - h, lit ? dr[0] : dr[1]);
}
function moteBurst(g, cx, cy, r, density, seed) {
  const dr = RAMP.drift;
  for (let i = 0; i < 40; i++) {
    const t = hash2(i, seed, 1) * Math.PI * 2, rr = hash2(i, seed, 2) * r;
    if (hash2(i, seed, 3) > density) continue;
    const x = Math.round(cx + Math.cos(t) * rr), y = Math.round(cy + Math.sin(t) * rr * 0.7);
    P(g, x, y, hash2(i, seed, 4) < 0.3 ? dr[0] : hash2(i, seed, 4) < 0.6 ? dr[1] : dr[2]);
  }
}

/* ============================ 1 · DRIFT HUSK (32×32) ============================ */
function drawHusk(facing, anim, f) {
  const g = makeGrid(32, 32);
  const st = RAMP.stone, dr = RAMP.drift;
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const back = dir >= 3, profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir];
  const cx = 16 + lean;
  const groundY = 30;

  let dx = 0, sq = 0, legP = 0, alive = true, df = -1;
  if (anim === 'idle') sq = f === 1 ? 1 : 0;
  if (anim === 'skitter') { legP = f; dx = [0, 1, 0, -1][f]; }
  if (anim === 'lunge') { dx = [-3, -4, 5, 7][f]; sq = [1, 2, -1, 0][f]; }
  if (anim === 'death') { alive = false; df = f; }

  if (!alive) {
    if (df === 0) { // collapsing
      shadeMass(g, cx, groundY - 3, profile ? 10 : 8, 3, st, 1);
      moteBurst(g, cx, 18, 6, 0.5, 7);
    } else if (df === 1) {
      for (let i = 0; i < 10; i++) P(g, 10 + (i * 3) % 14, 27 + (i % 3), st[3]); // rubble
      moteBurst(g, cx, 16, 11, 0.85, 9);
    } else {
      moteBurst(g, cx, 13, 13, 0.4, 11);
    }
    outline(g, RAMP.void);
    return g;
  }

  const bodyX = cx + dx, bodyY = groundY - 5 + 0;
  const rx = profile ? 9 : 7, ry = 5 - sq;

  // legs (under body)
  const legXs = profile ? [-6, -2, 3, 7] : [-5, -2, 2, 5];
  legXs.forEach((lx, i) => {
    const fwd = anim === 'skitter' ? ((i + legP) % 2 === 0 ? 1 : 0) : 0;
    for (let k = 0; k < 4 - fwd; k++) P(g, bodyX + lx, bodyY + 3 + k, st[3]);
    P(g, bodyX + lx, groundY, RAMP.void);
  });
  // body mass
  shadeMass(g, bodyX, bodyY, rx, ry, st, 2);
  // back spines (drift) — flicker on idle f1
  const lit = anim === 'idle' ? f === 1 : (anim === 'lunge' && f >= 2);
  const spineXs = back ? [-4, 0, 4] : profile ? [-6, -2, 2, 6] : [-4, 0, 4];
  spineXs.forEach((sx, i) => spike(g, bodyX + sx, bodyY - ry + 1, 4 + (i % 2), lit));
  // head (front/side only)
  if (!back) {
    const hx = bodyX + (profile ? rx - 1 : 0), hy = bodyY + 1 + (profile ? 1 : 2);
    shadeMass(g, hx, hy, 3, 3, st, 3);
    const ey = hy - 1;
    if (profile) { P(g, hx + 1, ey, lit ? dr[0] : dr[1]); }
    else { P(g, hx - 1, ey, lit ? dr[0] : dr[1]); P(g, hx + 1, ey, dr[1]); }
  } else {
    // haunch hump from behind
    shadeMass(g, bodyX, bodyY - 1, rx - 2, ry, st, 4);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · DRIFT STALKER (36×40) ========================= */
function drawStalker(facing, anim, f) {
  const g = makeGrid(36, 40);
  const st = RAMP.stone, dr = RAMP.drift, bl = RAMP.blood;
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const back = dir >= 3, profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir];
  const cx = 18 + lean;
  const groundY = 38;

  let crouch = 0, armSwing = 0, alive = true, df = -1, dx = 0;
  if (anim === 'idle') crouch = f === 1 ? 1 : 0;
  if (anim === 'stalk') { dx = [0, 1, 1, 0, -1, -1][f]; crouch = [0, 1, 1, 0, 1, 1][f]; }
  if (anim === 'lunge') { dx = [-2, -3, 6, 8][f]; crouch = [2, 3, -2, -1][f]; }
  if (anim === 'death') { alive = false; df = f; }

  if (!alive) {
    if (df <= 1) {
      const yy = groundY - 8 + df * 4;
      shadeMass(g, cx, yy, 8 - df, 5 - df, st, 1);
      if (df === 1) moteBurst(g, cx, yy - 4, 8, 0.6, 21);
    } else if (df === 2) { moteBurst(g, cx, 20, 12, 0.85, 23); for (let i = 0; i < 8; i++) P(g, 12 + (i * 3) % 12, 35 + i % 3, st[3]); }
    else moteBurst(g, cx, 16, 15, 0.4, 25);
    outline(g, RAMP.void);
    return g;
  }

  const hipY = groundY - 10 + crouch;
  const headY = hipY - 13 + crouch;
  // legs (digitigrade)
  [[-4, 1], [4, -1]].forEach(([lx, ph], i) => {
    const k2 = anim === 'stalk' ? (f + i) % 2 : 0;
    P(g, cx + lx, hipY + 2, st[2]); P(g, cx + lx + ph, hipY + 5, st[2]);
    P(g, cx + lx + ph, hipY + 8 - k2, st[3]); P(g, cx + lx + ph + 1, groundY, RAMP.void);
    P(g, cx + lx + ph + 2, groundY, bl[1]); // gore-stained foot-claw
  });
  // torso (upright, leaning forward)
  const torsoX = cx + dx, leanF = profile ? 2 : 0;
  shadeMass(g, torsoX + leanF, (hipY + headY) / 2, 5, 7, st, 2);
  // exposed drift veins down torso
  for (let y = headY + 3; y < hipY; y += 2) P(g, torsoX + leanF - 1, y, dr[2]);
  P(g, torsoX + leanF, headY + 5, dr[1]);
  // back spines
  const lit = anim === 'idle' ? f === 1 : anim === 'lunge' && f >= 2;
  [-2, 1, 4].forEach((sx, i) => spike(g, torsoX + (back ? sx : sx + 3), (hipY + headY) / 2 - 5, 5 + i % 2, lit));
  // arms with clawed hands
  const ang = anim === 'lunge' ? [-1.6, -2.0, 0.2, 0.5][f] : (anim === 'stalk' ? -0.6 + Math.sin(f) * 0.2 : -0.7);
  const sx0 = torsoX + leanF + 2, sy0 = headY + 5;
  for (let k = 1; k < 7; k++) { const x = Math.round(sx0 + Math.cos(ang) * k), y = Math.round(sy0 + Math.sin(ang) * k + 3); P(g, x, y, st[2]); }
  const cxh = Math.round(sx0 + Math.cos(ang) * 7), cyh = Math.round(sy0 + Math.sin(ang) * 7 + 3);
  P(g, cxh, cyh, bl[0]); P(g, cxh + 1, cyh - 1, bl[1]); P(g, cxh + 1, cyh + 1, bl[1]); // gore claws
  // head
  if (!back) {
    shadeMass(g, torsoX + leanF + (profile ? 2 : 0), headY, 3, 3, st, 3);
    const ey = headY;
    if (profile) P(g, torsoX + leanF + 3, ey, lit ? dr[0] : dr[1]);
    else { P(g, torsoX + leanF - 1, ey, lit ? dr[0] : dr[1]); P(g, torsoX + leanF + 1, ey, dr[1]); }
    // bloodied maw
    P(g, torsoX + leanF + (profile ? 3 : 0), headY + 2, bl[1]);
  } else shadeMass(g, torsoX, headY, 3, 3, st, 4);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · DRIFT COLOSSUS (64×64) ========================= */
function drawColossus(facing, anim, f) {
  const g = makeGrid(64, 64);
  const st = RAMP.stone, dr = RAMP.drift, em = RAMP.ember;
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const back = dir >= 3, profile = dir === 2;
  const lean = [0, 2, 4, 2, 0][dir];
  const cx = 32 + lean;
  const groundY = 60;

  let stagger = 0, armUp = 0, alive = true, df = -1, shake = 0;
  if (anim === 'idle') stagger = f === 1 ? 1 : 0;
  if (anim === 'walk') { stagger = [0, 1, 0, 1][f]; shake = [0, 0, 1, 0][f]; }
  if (anim === 'slam') { armUp = [3, 6, 6, -2, -4][f]; shake = [0, 0, 0, 2, 1][f]; }
  if (anim === 'death') { alive = false; df = f; }

  if (!alive) {
    const collapse = df; // 0..4 crumble
    if (df < 4) {
      // shrinking rubble pile
      const h = 30 - df * 6;
      for (let y = groundY; y > groundY - h; y--) {
        const w = Math.round((groundY - y) * 0.5 + 6);
        for (let x = cx - w; x <= cx + w; x++) if (hash2(x, y, 30 + df) < 0.7) P(g, x, y, hash2(x, y, 5) < 0.4 ? st[2] : st[1]);
      }
      moteBurst(g, cx, groundY - h - 4, 16 + df * 3, 0.7, 40 + df);
      // cracks leaking drift
      for (let i = 0; i < 6 - df; i++) P(g, cx - 8 + i * 3, groundY - 8, dr[2]);
    } else {
      for (let i = 0; i < 18; i++) P(g, cx - 16 + (i * 5) % 32, groundY - (i % 3), st[3]);
      moteBurst(g, cx, 30, 22, 0.5, 49);
    }
    outline(g, RAMP.void);
    return g;
  }

  const baseY = groundY + (shake ? 1 : 0);
  // two stone legs (broken pillars)
  [[-10, 0], [9, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 2 : 0;
    for (let y = baseY - 18; y <= baseY - lift; y++) {
      for (let x = cx + lx - 4; x <= cx + lx + 4; x++) {
        let c = st[1]; if (x < cx + lx - 2) c = st[0]; if (x > cx + lx + 2) c = st[3];
        if (hash2(x, y, 31) < 0.06) c = st[2]; P(g, x, y, c);
      }
    }
    P(g, cx + lx, baseY - lift, RAMP.void);
    // drift leaking at the knee
    P(g, cx + lx - 4, baseY - 9, dr[2]); P(g, cx + lx + 4, baseY - 12, dr[3]);
  });
  // masonry torso (broken brick block)
  const tx = cx + (profile ? 3 : 0), tTop = baseY - 44 + stagger, tBot = baseY - 20;
  for (let y = tTop; y <= tBot; y++) {
    const w = 13 + Math.round((y - tTop) / 6);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = st[1]; if (x < tx - w + 3) c = st[0]; if (x > tx + w - 3) c = st[2];
      if (y > tBot - 4) c = st[3];
      // brick seams
      if ((y - tTop) % 6 === 0 || (x - tx + ((Math.floor((y - tTop) / 6)) % 2) * 4) % 8 === 0) c = st[3];
      if (hash2(x, y, 32) < 0.05) c = dr[3];   // corruption in cracks
      P(g, x, y, c);
    }
  }
  // corruption leaking from torso cracks
  [[-8, 6], [5, 10], [-2, 16], [9, 4]].forEach(([ox, oy], i) => {
    P(g, tx + ox, tTop + oy, dr[2]); P(g, tx + ox, tTop + oy + 1, dr[3]);
    if ((anim === 'idle' && f === 1) || anim === 'slam') P(g, tx + ox, tTop + oy - 1, i % 2 ? dr[0] : em[1]);
  });
  // arms (raise on slam)
  [[-1, -16], [1, 16]].forEach(([sgn, ox]) => {
    const shoulderX = tx + ox * 0.9, shoulderY = tTop + 4;
    const ay = shoulderY + 8 - (anim === 'slam' ? armUp : 0);
    for (let y = shoulderY; y <= shoulderY + 16; y++) {
      const yy = (anim === 'slam' && armUp > 0) ? shoulderY + (y - shoulderY) - armUp : y;
      for (let x = shoulderX - 3; x <= shoulderX + 3; x++) { let c = st[1]; if (x < shoulderX - 1) c = st[0]; if (x > shoulderX + 1) c = st[2]; P(g, Math.round(x), Math.round(yy), c); }
    }
    // fist
    const fy = (anim === 'slam' && armUp > 0) ? shoulderY + 16 - armUp : shoulderY + 16;
    shadeMass(g, shoulderX, fy, 4, 3, st, 6);
  });
  // shockwave on slam impact frames
  if (anim === 'slam' && f >= 3) {
    const r = f === 3 ? 16 : 24;
    for (let a = 0; a < 2; a++) { P(g, cx - r + a, groundY - 1, dr[1]); P(g, cx + r - a, groundY - 1, dr[1]); P(g, cx - r + a, groundY, em[1]); P(g, cx + r - a, groundY, em[1]); }
  }
  // fractured head with single drift-core eye
  if (!back) {
    const hx = tx + (profile ? 4 : 0), hy = tTop - 5 + stagger;
    for (let y = hy - 5; y <= hy + 4; y++) for (let x = hx - 6; x <= hx + 6; x++) {
      if (Math.abs(x - hx) + Math.abs(y - hy) > 8) continue;
      let c = st[1]; if (x < hx - 2) c = st[0]; if (y > hy + 1) c = st[3];
      if (hash2(x, y, 33) < 0.08) c = st[2]; P(g, x, y, c);
    }
    // crack across head
    for (let k = -5; k <= 5; k++) P(g, hx + k, hy - 1 + Math.round(Math.sin(k) ), st[3]);
    // huge drift-core eye
    const lit = (anim === 'idle' && f === 1) || (anim === 'slam' && f >= 1);
    ell(g, hx, hy + 1, 2.4, 2.4, (x, y, d) => P(g, x, y, d < 0.3 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
    if (lit) { P(g, hx - 3, hy + 1, dr[2]); P(g, hx + 3, hy + 1, dr[2]); }
  } else {
    const hx = tx, hy = tTop - 5 + stagger;
    for (let y = hy - 5; y <= hy + 4; y++) for (let x = hx - 6; x <= hx + 6; x++) { if (Math.abs(x - hx) + Math.abs(y - hy) > 8) continue; P(g, x, y, hash2(x, y, 33) < 0.5 ? st[2] : st[1]); }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 4 · CARAVAN RAIDER (32×40) ========================= */
function drawRaider(facing, anim, f) {
  const g = makeGrid(32, 40);
  const dt = RAMP.dirt, bn = RAMP.bone, em = RAMP.ember, bl = RAMP.blood;
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const back = dir >= 3, profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir];
  const cx = 16;
  const groundY = 38;

  let bob = 0, step = 0, armAng = null, alive = true, df = -1;
  if (anim === 'idle') bob = f === 1 ? 1 : 0;
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; step = [2, 1, 0, -2, -1, 0][f]; }
  if (anim === 'slash') armAng = [-1.9, -0.9, 0.2, 0.7][f];
  if (anim === 'death') { alive = false; df = f; }

  if (!alive) {
    if (df === 0) { // stagger back, clutching
      drawRaiderBody(g, cx + 1, 12, dt, bn, off, dir, profile, back, 2, 0);
      P(g, cx + 6, 17, bl[1]); P(g, cx + 7, 18, bl[2]); // blood
    } else if (df === 1) { // slumping to knees, bowed
      ell(g, cx, 30, 8, 6, (x, y, d, dx, dy) => { let c = dt[1]; if (dx + dy < -0.4) c = dt[0]; if (dx + dy > 0.5) c = dt[2]; if (hash2(x, y, 62) < 0.1) c = dt[3]; P(g, x, y, c); });
      ell(g, cx + 4, 25, 3, 3, (x, y) => P(g, x, y, dt[2]));                 // bowed head
      for (let y = 24; y <= 26; y++) for (let x = cx + 3; x <= cx + 6; x++) if (hash2(x, y, 65) < 0.7) P(g, x, y, bn[1]); // mask
      P(g, cx - 6, 36, bl[2]);
    } else { // sprawled flat
      for (let x = cx - 9; x <= cx + 8; x++) { P(g, x, groundY - 1, dt[2]); if (hash2(x, 0, 61) < 0.6) P(g, x, groundY - 2, dt[1]); }
      ell(g, cx - 7, groundY - 3, 3, 2, (x, y) => P(g, x, y, bn[1]));        // dropped mask
      P(g, cx + 8, groundY - 1, em[2]); P(g, cx + 9, groundY - 2, em[1]);   // dropped torch
    }
    outline(g, RAMP.void);
    return g;
  }

  const top = 9 + bob;
  drawRaiderBody(g, cx, top, dt, bn, off, dir, profile, back, 0, step);

  // weapon arm: ember torch (idle/walk) or blade (slash)
  const shoulderY = top + 9;
  if (anim === 'slash') {
    const sx = cx + off + 3, ang = armAng;
    for (let k = 1; k < 7; k++) P(g, Math.round(sx + Math.cos(ang) * k), Math.round(shoulderY + Math.sin(ang) * k), dt[1]);
    const bx = Math.round(sx + Math.cos(ang) * 7), by = Math.round(shoulderY + Math.sin(ang) * 7);
    for (let k = 0; k < 6; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by + Math.sin(ang) * k), bn[0]); // steel blade
    if (f === 2) { P(g, bx + 3, by, bn[0]); P(g, bx + 4, by + 1, em[0]); }   // slash glint
  } else {
    // torch held at side
    const tx = cx + off + (profile ? 5 : 4), ty = shoulderY - 2;
    for (let k = 0; k < 6; k++) P(g, tx, ty + k, dt[2]); // haft
    P(g, tx, ty - 1, em[2]);
    const flick = anim === 'idle' ? f : 0;
    P(g, tx, ty - 2 - flick, em[1]); P(g, tx, ty - 3 - flick, em[0]); P(g, tx + (flick ? 1 : -1), ty - 2, em[1]);
  }
  outline(g, RAMP.void);
  return g;
}
// shared raider body (so death frames can reuse)
function drawRaiderBody(g, cx, top, dt, bn, off, dir, profile, back, hunch, step) {
  const shoulderY = top + 9 + hunch, hipY = top + 19, groundY = 38;
  // legs
  const fo = dir >= 1 ? 1 : 0;
  for (let leg = 0; leg < 2; leg++) {
    const sgn = leg ? 1 : -1, sx = cx + sgn * 2 + fo + (leg ? -step : step);
    for (let y = hipY; y < groundY - 1; y++) { let c = dt[2]; if (y > groundY - 4) c = dt[3]; P(g, sx, y, c); P(g, sx + sgn, y, dt[1]); }
    P(g, sx, groundY - 1, RAMP.void); P(g, sx + sgn, groundY - 1, dt[3]); // boot
  }
  // patched-leather torso
  for (let y = shoulderY; y <= hipY; y++) {
    const w = 4 + Math.round((y - shoulderY) / 8);
    for (let x = cx - w + off / 2; x <= cx + w + off / 2; x++) {
      let c = dt[1]; if (x < cx - w + off / 2 + 1) c = dt[0]; if (x > cx + w + off / 2 - 1) c = dt[3];
      if (hash2(x, y, 62) < 0.08) c = dt[2];             // patches
      if (hash2(x, y, 64) < 0.02) c = bn[2];             // bone trinket
      P(g, Math.round(x), y, c);
    }
  }
  // belt
  for (let x = cx - 4 + off / 2; x <= cx + 4 + off / 2; x++) P(g, Math.round(x), hipY, dt[3]);
  // head + bone mask
  const hx = cx + off;
  ell(g, hx, top + 4, 3.2, 3.6, (x, y, d, dx, dy) => { let c = dt[1]; if (dx + dy < -0.4) c = dt[0]; if (dx + dy > 0.5) c = dt[2]; P(g, x, y, c); });
  if (!back) {
    // bone mask plate over face
    const mw = profile ? 1 : 2;
    for (let y = top + 3; y <= top + 6; y++) for (let x = hx - (profile ? 0 : mw); x <= hx + mw; x++) P(g, x, y, hash2(x, y, 65) < 0.2 ? bn[2] : bn[1]);
    // eye slit (dark)
    P(g, hx + (profile ? 1 : 0), top + 4, RAMP.void);
    if (!profile) P(g, hx + 1, top + 4, RAMP.void);
  } else {
    // hood/hair from behind
    for (let y = top + 1; y <= top + 5; y++) for (let x = hx - 3; x <= hx + 3; x++) if ((x - hx) ** 2 + (y - top - 3) ** 2 < 10) P(g, x, y, dt[3]);
  }
  // hood cowl
  for (let x = hx - 4; x <= hx + 4; x++) { const yy = top + Math.round(((x - hx) / 4) ** 2 * 2); if ((x - hx) ** 2 < 17) P(g, x, yy, dt[2]); }
}

const BEAST_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const BEASTS = {
  husk:     { fn: 'drawHusk',     cell: [32, 32], anims: [['idle', 2], ['skitter', 4], ['lunge', 4], ['death', 3]], hurt: 'drift-hi (#d8b4fe)' },
  stalker:  { fn: 'drawStalker',  cell: [36, 40], anims: [['idle', 2], ['stalk', 6], ['lunge', 4], ['death', 4]], hurt: 'blood-hi (#ef4444)' },
  colossus: { fn: 'drawColossus', cell: [64, 64], anims: [['idle', 2], ['walk', 4], ['slam', 5], ['death', 5]], hurt: 'bone-hi (#efe9f4) then drift-hi' },
  raider:   { fn: 'drawRaider',   cell: [32, 40], anims: [['idle', 2], ['walk', 6], ['slash', 4], ['death', 3]], hurt: 'blood-hi (#ef4444)' },
};

function beastSheetGrids(name) {
  const spec = BEASTS[name], fn = globalThis[spec.fn];
  return BEAST_FACINGS.map(fc => {
    const row = [];
    spec.anims.forEach(([anim, n]) => { for (let f = 0; f < n; f++) row.push(fn(fc, anim, f)); });
    return row;
  });
}

Object.assign(globalThis, {
  ell, shadeMass, spike, moteBurst,
  drawHusk, drawStalker, drawColossus, drawRaider, drawRaiderBody,
  BEAST_FACINGS, BEASTS, beastSheetGrids,
});
