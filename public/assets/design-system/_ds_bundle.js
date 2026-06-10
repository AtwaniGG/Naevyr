/* @ds-bundle: {"format":3,"namespace":"DriftLandsDesignSystem_3de3e2","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"SeasonBadge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"ActivityLog","sourcePath":"components/game/ActivityLog.jsx"},{"name":"Hotbar","sourcePath":"components/game/Hotbar.jsx"},{"name":"Slot","sourcePath":"components/game/Slot.jsx"},{"name":"XPBar","sourcePath":"components/game/XPBar.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"TOOL_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"}],"sourceHashes":{"assets/_gen/beasts.js":"4a960edc3f84","assets/_gen/character.js":"bfa95973ee9e","assets/_gen/fxlogo.js":"3f5a0b6e4d3d","assets/_gen/nodes.js":"76c3d5ae0969","assets/_gen/pixlib.js":"9e04175a932b","assets/_gen/tiles.js":"22b604e5b061","assets/_gen/town.js":"e1016422c4f1","components/core/Badge.jsx":"ccdd07c8772a","components/core/Button.jsx":"19a408191a59","components/core/Panel.jsx":"bd9e204398e5","components/game/ActivityLog.jsx":"9dd668351d97","components/game/Hotbar.jsx":"1dc48c13f595","components/game/Slot.jsx":"9dd86e4254ac","components/game/XPBar.jsx":"ec7638c938cb","components/icons/Icon.jsx":"807bd0992422","ui_kits/hud/Hud.jsx":"161da3666ec3","ui_kits/hud/Scene.jsx":"23d63aaee578"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DriftLandsDesignSystem_3de3e2 = window.DriftLandsDesignSystem_3de3e2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/_gen/beasts.js
try { (() => {
// DriftLands creature generators — eval after pixlib.js (+ tiles.js for RAMP/helpers).
// Same conventions as character.js: drawX(facing, anim, frame) -> grid.
// 5 facings s/se/e/ne/n (engine mirrors w/sw/nw), bottom-center anchor (base on
// last row), 1px void auto-outline, locked RAMP only, deterministic.
// TOP 4px OF EVERY CELL LEFT EMPTY for engine HP-bar / level-tag clearance.

function ell(g, cx, cy, rx, ry, fn) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx,
        dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d <= 1) fn(x, y, d, dx, dy);
    }
  }
}
// shade a stone-ish mass: lit top-left, shadowed bottom-right, rim dark
function shadeMass(g, cx, cy, rx, ry, ramp, seed) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    let c = ramp[1];
    if (d > 0.72) c = ramp[3]; // rim shadow
    else if (dx + dy < -0.45) c = ramp[0]; // moonlit hi
    else if (dx + dy > 0.5) c = ramp[2]; // lower shadow
    if (seed != null && hash2(x, y, seed) < 0.07) c = ramp[2]; // cracked speckle
    P(g, x, y, c);
  });
}
// jagged spike pointing up from (bx, baseY), height h, drift ramp + glow tip
function spike(g, bx, baseY, h, lit) {
  const dr = RAMP.drift;
  for (let k = 0; k < h; k++) {
    const w = Math.max(0, Math.round((h - k) / 2.4));
    for (let x = bx - w; x <= bx + w; x++) P(g, x, baseY - k, k > h - 2 ? lit ? dr[0] : dr[1] : dr[3]);
  }
  P(g, bx, baseY - h, lit ? dr[0] : dr[1]);
}
function moteBurst(g, cx, cy, r, density, seed) {
  const dr = RAMP.drift;
  for (let i = 0; i < 40; i++) {
    const t = hash2(i, seed, 1) * Math.PI * 2,
      rr = hash2(i, seed, 2) * r;
    if (hash2(i, seed, 3) > density) continue;
    const x = Math.round(cx + Math.cos(t) * rr),
      y = Math.round(cy + Math.sin(t) * rr * 0.7);
    P(g, x, y, hash2(i, seed, 4) < 0.3 ? dr[0] : hash2(i, seed, 4) < 0.6 ? dr[1] : dr[2]);
  }
}

/* ============================ 1 · DRIFT HUSK (32×32) ============================ */
function drawHusk(facing, anim, f) {
  const g = makeGrid(32, 32);
  const st = RAMP.stone,
    dr = RAMP.drift;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir];
  const cx = 16 + lean;
  const groundY = 30;
  let dx = 0,
    sq = 0,
    legP = 0,
    alive = true,
    df = -1;
  if (anim === 'idle') sq = f === 1 ? 1 : 0;
  if (anim === 'skitter') {
    legP = f;
    dx = [0, 1, 0, -1][f];
  }
  if (anim === 'lunge') {
    dx = [-3, -4, 5, 7][f];
    sq = [1, 2, -1, 0][f];
  }
  if (anim === 'death') {
    alive = false;
    df = f;
  }
  if (!alive) {
    if (df === 0) {
      // collapsing
      shadeMass(g, cx, groundY - 3, profile ? 10 : 8, 3, st, 1);
      moteBurst(g, cx, 18, 6, 0.5, 7);
    } else if (df === 1) {
      for (let i = 0; i < 10; i++) P(g, 10 + i * 3 % 14, 27 + i % 3, st[3]); // rubble
      moteBurst(g, cx, 16, 11, 0.85, 9);
    } else {
      moteBurst(g, cx, 13, 13, 0.4, 11);
    }
    outline(g, RAMP.void);
    return g;
  }
  const bodyX = cx + dx,
    bodyY = groundY - 5 + 0;
  const rx = profile ? 9 : 7,
    ry = 5 - sq;

  // legs (under body)
  const legXs = profile ? [-6, -2, 3, 7] : [-5, -2, 2, 5];
  legXs.forEach((lx, i) => {
    const fwd = anim === 'skitter' ? (i + legP) % 2 === 0 ? 1 : 0 : 0;
    for (let k = 0; k < 4 - fwd; k++) P(g, bodyX + lx, bodyY + 3 + k, st[3]);
    P(g, bodyX + lx, groundY, RAMP.void);
  });
  // body mass
  shadeMass(g, bodyX, bodyY, rx, ry, st, 2);
  // back spines (drift) — flicker on idle f1
  const lit = anim === 'idle' ? f === 1 : anim === 'lunge' && f >= 2;
  const spineXs = back ? [-4, 0, 4] : profile ? [-6, -2, 2, 6] : [-4, 0, 4];
  spineXs.forEach((sx, i) => spike(g, bodyX + sx, bodyY - ry + 1, 4 + i % 2, lit));
  // head (front/side only)
  if (!back) {
    const hx = bodyX + (profile ? rx - 1 : 0),
      hy = bodyY + 1 + (profile ? 1 : 2);
    shadeMass(g, hx, hy, 3, 3, st, 3);
    const ey = hy - 1;
    if (profile) {
      P(g, hx + 1, ey, lit ? dr[0] : dr[1]);
    } else {
      P(g, hx - 1, ey, lit ? dr[0] : dr[1]);
      P(g, hx + 1, ey, dr[1]);
    }
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
  const st = RAMP.stone,
    dr = RAMP.drift,
    bl = RAMP.blood;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir];
  const cx = 18 + lean;
  const groundY = 38;
  let crouch = 0,
    armSwing = 0,
    alive = true,
    df = -1,
    dx = 0;
  if (anim === 'idle') crouch = f === 1 ? 1 : 0;
  if (anim === 'stalk') {
    dx = [0, 1, 1, 0, -1, -1][f];
    crouch = [0, 1, 1, 0, 1, 1][f];
  }
  if (anim === 'lunge') {
    dx = [-2, -3, 6, 8][f];
    crouch = [2, 3, -2, -1][f];
  }
  if (anim === 'death') {
    alive = false;
    df = f;
  }
  if (!alive) {
    if (df <= 1) {
      const yy = groundY - 8 + df * 4;
      shadeMass(g, cx, yy, 8 - df, 5 - df, st, 1);
      if (df === 1) moteBurst(g, cx, yy - 4, 8, 0.6, 21);
    } else if (df === 2) {
      moteBurst(g, cx, 20, 12, 0.85, 23);
      for (let i = 0; i < 8; i++) P(g, 12 + i * 3 % 12, 35 + i % 3, st[3]);
    } else moteBurst(g, cx, 16, 15, 0.4, 25);
    outline(g, RAMP.void);
    return g;
  }
  const hipY = groundY - 10 + crouch;
  const headY = hipY - 13 + crouch;
  // legs (digitigrade)
  [[-4, 1], [4, -1]].forEach(([lx, ph], i) => {
    const k2 = anim === 'stalk' ? (f + i) % 2 : 0;
    P(g, cx + lx, hipY + 2, st[2]);
    P(g, cx + lx + ph, hipY + 5, st[2]);
    P(g, cx + lx + ph, hipY + 8 - k2, st[3]);
    P(g, cx + lx + ph + 1, groundY, RAMP.void);
    P(g, cx + lx + ph + 2, groundY, bl[1]); // gore-stained foot-claw
  });
  // torso (upright, leaning forward)
  const torsoX = cx + dx,
    leanF = profile ? 2 : 0;
  shadeMass(g, torsoX + leanF, (hipY + headY) / 2, 5, 7, st, 2);
  // exposed drift veins down torso
  for (let y = headY + 3; y < hipY; y += 2) P(g, torsoX + leanF - 1, y, dr[2]);
  P(g, torsoX + leanF, headY + 5, dr[1]);
  // back spines
  const lit = anim === 'idle' ? f === 1 : anim === 'lunge' && f >= 2;
  [-2, 1, 4].forEach((sx, i) => spike(g, torsoX + (back ? sx : sx + 3), (hipY + headY) / 2 - 5, 5 + i % 2, lit));
  // arms with clawed hands
  const ang = anim === 'lunge' ? [-1.6, -2.0, 0.2, 0.5][f] : anim === 'stalk' ? -0.6 + Math.sin(f) * 0.2 : -0.7;
  const sx0 = torsoX + leanF + 2,
    sy0 = headY + 5;
  for (let k = 1; k < 7; k++) {
    const x = Math.round(sx0 + Math.cos(ang) * k),
      y = Math.round(sy0 + Math.sin(ang) * k + 3);
    P(g, x, y, st[2]);
  }
  const cxh = Math.round(sx0 + Math.cos(ang) * 7),
    cyh = Math.round(sy0 + Math.sin(ang) * 7 + 3);
  P(g, cxh, cyh, bl[0]);
  P(g, cxh + 1, cyh - 1, bl[1]);
  P(g, cxh + 1, cyh + 1, bl[1]); // gore claws
  // head
  if (!back) {
    shadeMass(g, torsoX + leanF + (profile ? 2 : 0), headY, 3, 3, st, 3);
    const ey = headY;
    if (profile) P(g, torsoX + leanF + 3, ey, lit ? dr[0] : dr[1]);else {
      P(g, torsoX + leanF - 1, ey, lit ? dr[0] : dr[1]);
      P(g, torsoX + leanF + 1, ey, dr[1]);
    }
    // bloodied maw
    P(g, torsoX + leanF + (profile ? 3 : 0), headY + 2, bl[1]);
  } else shadeMass(g, torsoX, headY, 3, 3, st, 4);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · DRIFT COLOSSUS (64×64) ========================= */
function drawColossus(facing, anim, f) {
  const g = makeGrid(64, 64);
  const st = RAMP.stone,
    dr = RAMP.drift,
    em = RAMP.ember;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const back = dir >= 3,
    profile = dir === 2;
  const lean = [0, 2, 4, 2, 0][dir];
  const cx = 32 + lean;
  const groundY = 60;
  let stagger = 0,
    armUp = 0,
    alive = true,
    df = -1,
    shake = 0;
  if (anim === 'idle') stagger = f === 1 ? 1 : 0;
  if (anim === 'walk') {
    stagger = [0, 1, 0, 1][f];
    shake = [0, 0, 1, 0][f];
  }
  if (anim === 'slam') {
    armUp = [3, 6, 6, -2, -4][f];
    shake = [0, 0, 0, 2, 1][f];
  }
  if (anim === 'death') {
    alive = false;
    df = f;
  }
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
      for (let i = 0; i < 18; i++) P(g, cx - 16 + i * 5 % 32, groundY - i % 3, st[3]);
      moteBurst(g, cx, 30, 22, 0.5, 49);
    }
    outline(g, RAMP.void);
    return g;
  }
  const baseY = groundY + (shake ? 1 : 0);
  // two stone legs (broken pillars)
  [[-10, 0], [9, 1]].forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && (f + i) % 2 === 0 ? 2 : 0;
    for (let y = baseY - 18; y <= baseY - lift; y++) {
      for (let x = cx + lx - 4; x <= cx + lx + 4; x++) {
        let c = st[1];
        if (x < cx + lx - 2) c = st[0];
        if (x > cx + lx + 2) c = st[3];
        if (hash2(x, y, 31) < 0.06) c = st[2];
        P(g, x, y, c);
      }
    }
    P(g, cx + lx, baseY - lift, RAMP.void);
    // drift leaking at the knee
    P(g, cx + lx - 4, baseY - 9, dr[2]);
    P(g, cx + lx + 4, baseY - 12, dr[3]);
  });
  // masonry torso (broken brick block)
  const tx = cx + (profile ? 3 : 0),
    tTop = baseY - 44 + stagger,
    tBot = baseY - 20;
  for (let y = tTop; y <= tBot; y++) {
    const w = 13 + Math.round((y - tTop) / 6);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = st[1];
      if (x < tx - w + 3) c = st[0];
      if (x > tx + w - 3) c = st[2];
      if (y > tBot - 4) c = st[3];
      // brick seams
      if ((y - tTop) % 6 === 0 || (x - tx + Math.floor((y - tTop) / 6) % 2 * 4) % 8 === 0) c = st[3];
      if (hash2(x, y, 32) < 0.05) c = dr[3]; // corruption in cracks
      P(g, x, y, c);
    }
  }
  // corruption leaking from torso cracks
  [[-8, 6], [5, 10], [-2, 16], [9, 4]].forEach(([ox, oy], i) => {
    P(g, tx + ox, tTop + oy, dr[2]);
    P(g, tx + ox, tTop + oy + 1, dr[3]);
    if (anim === 'idle' && f === 1 || anim === 'slam') P(g, tx + ox, tTop + oy - 1, i % 2 ? dr[0] : em[1]);
  });
  // arms (raise on slam)
  [[-1, -16], [1, 16]].forEach(([sgn, ox]) => {
    const shoulderX = tx + ox * 0.9,
      shoulderY = tTop + 4;
    const ay = shoulderY + 8 - (anim === 'slam' ? armUp : 0);
    for (let y = shoulderY; y <= shoulderY + 16; y++) {
      const yy = anim === 'slam' && armUp > 0 ? shoulderY + (y - shoulderY) - armUp : y;
      for (let x = shoulderX - 3; x <= shoulderX + 3; x++) {
        let c = st[1];
        if (x < shoulderX - 1) c = st[0];
        if (x > shoulderX + 1) c = st[2];
        P(g, Math.round(x), Math.round(yy), c);
      }
    }
    // fist
    const fy = anim === 'slam' && armUp > 0 ? shoulderY + 16 - armUp : shoulderY + 16;
    shadeMass(g, shoulderX, fy, 4, 3, st, 6);
  });
  // shockwave on slam impact frames
  if (anim === 'slam' && f >= 3) {
    const r = f === 3 ? 16 : 24;
    for (let a = 0; a < 2; a++) {
      P(g, cx - r + a, groundY - 1, dr[1]);
      P(g, cx + r - a, groundY - 1, dr[1]);
      P(g, cx - r + a, groundY, em[1]);
      P(g, cx + r - a, groundY, em[1]);
    }
  }
  // fractured head with single drift-core eye
  if (!back) {
    const hx = tx + (profile ? 4 : 0),
      hy = tTop - 5 + stagger;
    for (let y = hy - 5; y <= hy + 4; y++) for (let x = hx - 6; x <= hx + 6; x++) {
      if (Math.abs(x - hx) + Math.abs(y - hy) > 8) continue;
      let c = st[1];
      if (x < hx - 2) c = st[0];
      if (y > hy + 1) c = st[3];
      if (hash2(x, y, 33) < 0.08) c = st[2];
      P(g, x, y, c);
    }
    // crack across head
    for (let k = -5; k <= 5; k++) P(g, hx + k, hy - 1 + Math.round(Math.sin(k)), st[3]);
    // huge drift-core eye
    const lit = anim === 'idle' && f === 1 || anim === 'slam' && f >= 1;
    ell(g, hx, hy + 1, 2.4, 2.4, (x, y, d) => P(g, x, y, d < 0.3 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
    if (lit) {
      P(g, hx - 3, hy + 1, dr[2]);
      P(g, hx + 3, hy + 1, dr[2]);
    }
  } else {
    const hx = tx,
      hy = tTop - 5 + stagger;
    for (let y = hy - 5; y <= hy + 4; y++) for (let x = hx - 6; x <= hx + 6; x++) {
      if (Math.abs(x - hx) + Math.abs(y - hy) > 8) continue;
      P(g, x, y, hash2(x, y, 33) < 0.5 ? st[2] : st[1]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 4 · CARAVAN RAIDER (32×40) ========================= */
function drawRaider(facing, anim, f) {
  const g = makeGrid(32, 40);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    em = RAMP.ember,
    bl = RAMP.blood;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const back = dir >= 3,
    profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir];
  const cx = 16;
  const groundY = 38;
  let bob = 0,
    step = 0,
    armAng = null,
    alive = true,
    df = -1;
  if (anim === 'idle') bob = f === 1 ? 1 : 0;
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    step = [2, 1, 0, -2, -1, 0][f];
  }
  if (anim === 'slash') armAng = [-1.9, -0.9, 0.2, 0.7][f];
  if (anim === 'death') {
    alive = false;
    df = f;
  }
  if (!alive) {
    if (df === 0) {
      // stagger back, clutching
      drawRaiderBody(g, cx + 1, 12, dt, bn, off, dir, profile, back, 2, 0);
      P(g, cx + 6, 17, bl[1]);
      P(g, cx + 7, 18, bl[2]); // blood
    } else if (df === 1) {
      // slumping to knees, bowed
      ell(g, cx, 30, 8, 6, (x, y, d, dx, dy) => {
        let c = dt[1];
        if (dx + dy < -0.4) c = dt[0];
        if (dx + dy > 0.5) c = dt[2];
        if (hash2(x, y, 62) < 0.1) c = dt[3];
        P(g, x, y, c);
      });
      ell(g, cx + 4, 25, 3, 3, (x, y) => P(g, x, y, dt[2])); // bowed head
      for (let y = 24; y <= 26; y++) for (let x = cx + 3; x <= cx + 6; x++) if (hash2(x, y, 65) < 0.7) P(g, x, y, bn[1]); // mask
      P(g, cx - 6, 36, bl[2]);
    } else {
      // sprawled flat
      for (let x = cx - 9; x <= cx + 8; x++) {
        P(g, x, groundY - 1, dt[2]);
        if (hash2(x, 0, 61) < 0.6) P(g, x, groundY - 2, dt[1]);
      }
      ell(g, cx - 7, groundY - 3, 3, 2, (x, y) => P(g, x, y, bn[1])); // dropped mask
      P(g, cx + 8, groundY - 1, em[2]);
      P(g, cx + 9, groundY - 2, em[1]); // dropped torch
    }
    outline(g, RAMP.void);
    return g;
  }
  const top = 9 + bob;
  drawRaiderBody(g, cx, top, dt, bn, off, dir, profile, back, 0, step);

  // weapon arm: ember torch (idle/walk) or blade (slash)
  const shoulderY = top + 9;
  if (anim === 'slash') {
    const sx = cx + off + 3,
      ang = armAng;
    for (let k = 1; k < 7; k++) P(g, Math.round(sx + Math.cos(ang) * k), Math.round(shoulderY + Math.sin(ang) * k), dt[1]);
    const bx = Math.round(sx + Math.cos(ang) * 7),
      by = Math.round(shoulderY + Math.sin(ang) * 7);
    for (let k = 0; k < 6; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by + Math.sin(ang) * k), bn[0]); // steel blade
    if (f === 2) {
      P(g, bx + 3, by, bn[0]);
      P(g, bx + 4, by + 1, em[0]);
    } // slash glint
  } else {
    // torch held at side
    const tx = cx + off + (profile ? 5 : 4),
      ty = shoulderY - 2;
    for (let k = 0; k < 6; k++) P(g, tx, ty + k, dt[2]); // haft
    P(g, tx, ty - 1, em[2]);
    const flick = anim === 'idle' ? f : 0;
    P(g, tx, ty - 2 - flick, em[1]);
    P(g, tx, ty - 3 - flick, em[0]);
    P(g, tx + (flick ? 1 : -1), ty - 2, em[1]);
  }
  outline(g, RAMP.void);
  return g;
}
// shared raider body (so death frames can reuse)
function drawRaiderBody(g, cx, top, dt, bn, off, dir, profile, back, hunch, step) {
  const shoulderY = top + 9 + hunch,
    hipY = top + 19,
    groundY = 38;
  // legs
  const fo = dir >= 1 ? 1 : 0;
  for (let leg = 0; leg < 2; leg++) {
    const sgn = leg ? 1 : -1,
      sx = cx + sgn * 2 + fo + (leg ? -step : step);
    for (let y = hipY; y < groundY - 1; y++) {
      let c = dt[2];
      if (y > groundY - 4) c = dt[3];
      P(g, sx, y, c);
      P(g, sx + sgn, y, dt[1]);
    }
    P(g, sx, groundY - 1, RAMP.void);
    P(g, sx + sgn, groundY - 1, dt[3]); // boot
  }
  // patched-leather torso
  for (let y = shoulderY; y <= hipY; y++) {
    const w = 4 + Math.round((y - shoulderY) / 8);
    for (let x = cx - w + off / 2; x <= cx + w + off / 2; x++) {
      let c = dt[1];
      if (x < cx - w + off / 2 + 1) c = dt[0];
      if (x > cx + w + off / 2 - 1) c = dt[3];
      if (hash2(x, y, 62) < 0.08) c = dt[2]; // patches
      if (hash2(x, y, 64) < 0.02) c = bn[2]; // bone trinket
      P(g, Math.round(x), y, c);
    }
  }
  // belt
  for (let x = cx - 4 + off / 2; x <= cx + 4 + off / 2; x++) P(g, Math.round(x), hipY, dt[3]);
  // head + bone mask
  const hx = cx + off;
  ell(g, hx, top + 4, 3.2, 3.6, (x, y, d, dx, dy) => {
    let c = dt[1];
    if (dx + dy < -0.4) c = dt[0];
    if (dx + dy > 0.5) c = dt[2];
    P(g, x, y, c);
  });
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
  for (let x = hx - 4; x <= hx + 4; x++) {
    const yy = top + Math.round(((x - hx) / 4) ** 2 * 2);
    if ((x - hx) ** 2 < 17) P(g, x, yy, dt[2]);
  }
}
const BEAST_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const BEASTS = {
  husk: {
    fn: 'drawHusk',
    cell: [32, 32],
    anims: [['idle', 2], ['skitter', 4], ['lunge', 4], ['death', 3]],
    hurt: 'drift-hi (#d8b4fe)'
  },
  stalker: {
    fn: 'drawStalker',
    cell: [36, 40],
    anims: [['idle', 2], ['stalk', 6], ['lunge', 4], ['death', 4]],
    hurt: 'blood-hi (#ef4444)'
  },
  colossus: {
    fn: 'drawColossus',
    cell: [64, 64],
    anims: [['idle', 2], ['walk', 4], ['slam', 5], ['death', 5]],
    hurt: 'bone-hi (#efe9f4) then drift-hi'
  },
  raider: {
    fn: 'drawRaider',
    cell: [32, 40],
    anims: [['idle', 2], ['walk', 6], ['slash', 4], ['death', 3]],
    hurt: 'blood-hi (#ef4444)'
  }
};
function beastSheetGrids(name) {
  const spec = BEASTS[name],
    fn = globalThis[spec.fn];
  return BEAST_FACINGS.map(fc => {
    const row = [];
    spec.anims.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(fn(fc, anim, f));
    });
    return row;
  });
}
Object.assign(globalThis, {
  ell,
  shadeMass,
  spike,
  moteBurst,
  drawHusk,
  drawStalker,
  drawColossus,
  drawRaider,
  drawRaiderBody,
  BEAST_FACINGS,
  BEASTS,
  beastSheetGrids
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/beasts.js", error: String((e && e.message) || e) }); }

// assets/_gen/character.js
try { (() => {
// DriftLands character generator — hooded Drift-touched wanderer.
// 32×40 cell, ~30px tall, feet at bottom-center. 5 facings (s,se,e,ne,n);
// engine mirrors for w/sw/nw. Anim: idle 2f · walk 6f · swing 4f.

function drawWanderer(facing, anim, f) {
  const g = makeGrid(32, 40);
  const st = RAMP.stone,
    dr = RAMP.drift,
    bn = RAMP.bone;
  const cx = 16;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const off = [0, 1, 2, 1, 0][dir]; // lateral shift toward facing
  const showFace = dir <= 2;
  let bob = 0,
    hemSway = 0;
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    hemSway = [0, 1, 1, 0, -1, -1][f];
  }
  if (anim === 'idle') {
    hemSway = f === 1 ? 1 : 0;
  }
  const top = 9 + bob;
  const shoulderY = 18 + bob;

  // ---- cloak body (stooped taper, shoulder→hem) ----
  for (let y = shoulderY; y <= 36; y++) {
    const t = (y - shoulderY) / (36 - shoulderY);
    const halfw = Math.round(3.6 + t * 3.4); // ~4 → 7
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(hemSway * 0.5) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = st[1];
      if (x <= cxx - halfw + 1) c = st[0]; // moonlit left edge
      if (x >= cxx + halfw - 1) c = st[3]; // shadow right
      if (hash2(x, y, 61) < 0.06) c = st[2]; // worn cloth
      if (dir >= 3 && x === cxx) c = st[2]; // back seam
      P(g, x, y, c);
    }
  }
  // ---- hem glow (corruption creeping up from the ground) ----
  for (let y = 35; y <= 36; y++) for (let x = 0; x < 32; x++) {
    const v = G(g, x, y);
    if (v) P(g, x, y, y === 36 ? hash2(x, y, 63) < 0.3 ? dr[2] : dr[3] : hash2(x, y, 63) < 0.25 ? dr[3] : v.c);
  }

  // ---- hood ----
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const halfw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.4);
    const cxx = cx + off;
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = st[1];
      if (x === cxx - halfw) c = st[0];
      if (x >= cxx + halfw - 1) c = st[3];
      if (y === top) c = st[0];
      P(g, x, y, c);
    }
  }
  // hood point (droops toward facing)
  P(g, cx + off, top - 1, st[1]);
  P(g, cx + off + (dir >= 1 && dir <= 3 ? 1 : 0), top - 2, st[2]);

  // ---- face shadow + Drift eyes ----
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : dir === 1 ? 1 : 0);
    const w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    const blink = anim === 'idle' && f === 1;
    if (dir === 0) {
      P(g, fcx - 1, ey, blink ? dr[3] : dr[2]);
      P(g, fcx + 1, ey, blink ? dr[3] : dr[1]);
    }
    if (dir === 1) {
      P(g, fcx, ey, blink ? dr[3] : dr[2]);
      P(g, fcx + 2, ey, blink ? dr[3] : dr[1]);
    }
    if (dir === 2) {
      P(g, fcx + 1, ey, blink ? dr[3] : dr[1]);
    }
  }
  // idle mote drifting off the shoulder
  if (anim === 'idle' && f === 1) P(g, cx + off + 7, top + 3, dr[1]);

  // ---- feet ----
  const footY = 37;
  let step = 0;
  if (anim === 'walk') step = [2, 1, 0, -2, -1, 0][f];
  const fo = dir >= 1 ? 1 : 0;
  P(g, cx - 3 + fo + step, footY, st[3]);
  P(g, cx - 2 + fo + step, footY, RAMP.void);
  P(g, cx + 2 + fo - step, footY, RAMP.void);
  P(g, cx + 3 + fo - step, footY, st[3]);

  // ---- gather/swing arm + tool ----
  if (anim === 'swing') {
    const hx = cx + off + 4,
      hy = shoulderY + 2;
    const ang = [-2.1, -1.35, -0.45, 0.35][f];
    for (let k = 2; k < 8; k++) {
      const x = Math.round(hx + Math.cos(ang) * k),
        y = Math.round(hy + Math.sin(ang) * k);
      P(g, x, y, k < 4 ? st[2] : RAMP.dirt[0]); // sleeve → wooden haft
    }
    const ex = Math.round(hx + Math.cos(ang) * 8),
      ey2 = Math.round(hy + Math.sin(ang) * 8);
    fillRect(g, ex - 1, ey2 - 1, 3, 2, bn[2]); // tool head
    P(g, ex, ey2 - 2, bn[1]);
    if (f === 2) {
      P(g, ex + 2, ey2, bn[0]);
      P(g, ex + 3, ey2 + 1, RAMP.ember[0]);
    } // hit spark
  }
  outline(g);
  return g;
}
const WANDER_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const WANDER_ANIMS = [['idle', 2], ['walk', 6], ['swing', 4]];
function wandererSheetGrids() {
  // rows = facings, cols = 12 frames (idle0..1, walk0..5, swing0..3)
  const rows = [];
  WANDER_FACINGS.forEach(fc => {
    const row = [];
    WANDER_ANIMS.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(drawWanderer(fc, anim, f));
    });
    rows.push(row);
  });
  return rows;
}
Object.assign(globalThis, {
  drawWanderer,
  wandererSheetGrids,
  WANDER_FACINGS,
  WANDER_ANIMS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/character.js", error: String((e && e.message) || e) }); }

// assets/_gen/fxlogo.js
try { (() => {
// DriftLands FX + logo generators — eval after pixlib.js.

// ---- FX ----
function makeMotes() {
  const dr = RAMP.drift;
  const v1 = makeGrid(2, 2);
  fillRect(v1, 0, 0, 2, 2, dr[1]);
  const v2 = makeGrid(2, 2);
  P(v2, 0, 0, dr[0]);
  P(v2, 1, 0, dr[1]);
  P(v2, 0, 1, dr[2]);
  P(v2, 1, 1, dr[2]);
  const v3 = makeGrid(2, 2);
  P(v3, 0, 0, dr[2]);
  P(v3, 1, 0, dr[3]);
  P(v3, 0, 1, dr[3]);
  P(v3, 1, 1, dr[2]);
  return [v1, v2, v3];
}
function makeEmbers() {
  return [0, 1, 2].map(i => {
    const g = makeGrid(1, 1);
    P(g, 0, 0, RAMP.ember[i]);
    return g;
  });
}
function makeAsh() {
  return ['#a99fb8', '#6f6781', '#d8cfe0'].map(c => {
    const g = makeGrid(1, 1);
    P(g, 0, 0, c);
    return g;
  });
}
// progress ring: 24×24, 8 fill steps, stepped pixel circumference
function makeRingFrames() {
  const dr = RAMP.drift;
  const pts = [];
  const n = 44;
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + i / n * Math.PI * 2; // start top, clockwise
    pts.push([Math.round(11.5 + Math.cos(t) * 9.5), Math.round(11.5 + Math.sin(t) * 9.5)]);
  }
  return Array.from({
    length: 8
  }, (_, s) => {
    const g = makeGrid(24, 24);
    const fillN = Math.round((s + 1) / 8 * n);
    pts.forEach((p, i) => {
      const on = i < fillN;
      P(g, p[0], p[1], on ? dr[2] : dr[4]);
      // 2px thickness: inner ring pixel
      const t = -Math.PI / 2 + i / n * Math.PI * 2;
      P(g, Math.round(11.5 + Math.cos(t) * 8.5), Math.round(11.5 + Math.sin(t) * 8.5), on ? dr[3] : dr[4]);
      if (on && i === fillN - 1) P(g, p[0], p[1], dr[0]); // hot leading pixel
    });
    return g;
  });
}

// ---- LOGO ----
// custom 12px-tall pixel letterset (only the letters DRIFTLANDS needs)
const GLYPHS = {
  D: ['######..', '#######.', '##...##.', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##...##.', '#######.', '######..'],
  R: ['#######.', '########', '##....##', '##....##', '##...###', '#######.', '######..', '##.###..', '##..##..', '##...##.', '##...###', '##....##'],
  I: ['####', '####', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '####', '####'],
  F: ['########', '########', '##......', '##......', '##......', '#######.', '#######.', '##......', '##......', '##......', '##......', '##......'],
  T: ['########', '########', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
  L: ['##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '########', '########'],
  A: ['..####..', '.######.', '##....##', '##....##', '##....##', '########', '########', '##....##', '##....##', '##....##', '##....##', '##....##'],
  N: ['##....##', '##....##', '###...##', '####..##', '##.##.##', '##.##.##', '##..####', '##..####', '##...###', '##...###', '##....##', '##....##'],
  S: ['.#######', '########', '##......', '##......', '########', '.#######', '......##', '......##', '......##', '......##', '########', '#######.']
};
function scaleGrid(g, k) {
  const m = makeGrid(g.w * k, g.h * k);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v) fillRect(m, x * k, y * k, k, k, v.c, v.a);
  }
  return m;
}
// build the DRIFTLANDS wordmark at 1× (12 tall) with corruption bleed
function wordmarkGrid(mono) {
  const word = 'DRIFTLANDS';
  const bn = RAMP.bone,
    dr = RAMP.drift;
  let widths = [],
    total = 0;
  for (const ch of word) {
    const w = GLYPHS[ch][0].length;
    widths.push(w);
    total += w + 1;
  }
  total -= 1;
  const g = makeGrid(total, 12);
  let ox = 0;
  word.split('').forEach((ch, gi) => {
    const rows = GLYPHS[ch];
    for (let y = 0; y < 12; y++) for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] !== '#') continue;
      let c;
      if (mono) c = bn[1];else if (y === 0) c = bn[0];else if (y < 8) c = bn[1];else if (y === 8) c = (x + y) % 2 === 0 ? bn[1] : dr[1];else if (y === 9) c = (x + y) % 2 === 0 ? dr[1] : dr[2];else if (y === 10) c = dr[2];else c = dr[3];
      // rising veins
      if (!mono && y >= 6 && y <= 8 && hash2(ox + x, y, 99) < 0.05) c = dr[2];
      P(g, ox + x, y, c);
    }
    ox += widths[gi] + 1;
  });
  return g;
}
// emblem (the stone iso-tile cradling a Drift mote) — 16×16 master
const EMBLEM_ROWS = ['.......kk.......', '......kCCk......', '.....kCccCk.....', '....kCc..cCk....', '...kCc.p..cCk...', '..kCc.pPp..cCk..', '.kCc..pPp...cCk.', 'kCc..pPPPp...cCk', '.kCc..pPp...cCk.', '..kCc.pPp..cCk..', '...kCc.p..cCk...', '....kCc..cCk....', '.....kCccCk.....', '......kCCk......', '.......kk.......', '................'];
function emblemGrid(mono) {
  const PALC = mono ? {
    k: '#0a0810',
    C: '#d8cfe0',
    c: '#a99fb8',
    P: '#efe9f4',
    p: '#d8cfe0'
  } : {
    k: '#0a0810',
    C: '#4a4360',
    c: '#322b46',
    P: '#f3e8ff',
    p: '#a855f7'
  };
  const g = makeGrid(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = EMBLEM_ROWS[y][x];
    if (ch !== '.' && PALC[ch]) P(g, x, y, PALC[ch]);
  }
  return g;
}
// lockups
function logoHorizontal(mono) {
  const g = makeGrid(512, 96);
  stamp(g, scaleGrid(emblemGrid(mono), 4), 4, 16);
  const wm = scaleGrid(wordmarkGrid(mono), 5); // 85*5=425 × 60
  stamp(g, wm, 80, 18);
  return g;
}
function logoStacked(mono) {
  const g = makeGrid(256, 220);
  stamp(g, scaleGrid(emblemGrid(mono), 6), 80, 12);
  const wm = scaleGrid(wordmarkGrid(mono), 3); // 255 × 36
  stamp(g, wm, 0, 132);
  if (!mono) {
    const dr = RAMP.drift;
    [[60, 190], [128, 198], [196, 188]].forEach((m, i) => {
      P(g, m[0], m[1], i === 1 ? dr[0] : dr[1]);
      P(g, m[0] + 1, m[1], dr[2]);
      P(g, m[0], m[1] + 1, dr[2]);
    });
  }
  return g;
}
Object.assign(globalThis, {
  makeMotes,
  makeEmbers,
  makeAsh,
  makeRingFrames,
  GLYPHS,
  scaleGrid,
  wordmarkGrid,
  emblemGrid,
  logoHorizontal,
  logoStacked
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/fxlogo.js", error: String((e && e.message) || e) }); }

// assets/_gen/nodes.js
try { (() => {
// DriftLands resource-node generators — eval after pixlib.js + tiles.js.
// tree 48×56 · rock 40×30 · fish ripple 40×20. Bottom-center anchored.

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx,
    dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

// ---- TREE (ashen oak) ----
function makeTree(depleted) {
  const g = makeGrid(48, 56);
  const gr = RAMP.grass,
    dr = RAMP.dirt;

  // trunk: base at (24,55), tapering up
  for (let y = 26; y <= 55; y++) {
    const w = y > 50 ? 6 : y > 44 ? 5 : 4;
    const x0 = 24 - (w >> 1);
    for (let x = x0; x < x0 + w; x++) {
      let c = dr[1];
      if (x === x0) c = dr[0];else if (x === x0 + w - 1) c = dr[3];else if (hash2(x, y, 11) < 0.15) c = dr[2];
      P(g, x, y, c);
    }
  }
  // root flares
  for (let k = 0; k < 3; k++) {
    P(g, 19 + k, 54 + (k > 1 ? 1 : 0), dr[2]);
    P(g, 28 - 0 + k, 55, dr[2]);
  }
  P(g, 18, 55, dr[3]);
  P(g, 30, 55, dr[3]);
  if (!depleted) {
    // full canopy: blob cluster
    const blobs = [[24, 16, 17, 12], [14, 22, 10, 8], [34, 21, 10, 8], [24, 27, 13, 7]];
    for (let y = 2; y <= 36; y++) for (let x = 2; x <= 46; x++) {
      if (!blobs.some(b => inEllipse(x, y, b[0], b[1], b[2], b[3]))) continue;
      const h = hash2(x, y, 21);
      if (h < 0.04) continue; // leaf holes
      let c = gr[1];
      const lit = inEllipse(x, y, 18, 11, 13, 8);
      const shad = y > 26 || inEllipse(x, y, 32, 26, 12, 7);
      if (lit && h < 0.7) c = h < 0.18 ? gr[0] : gr[1];
      if (lit && h >= 0.7 && h < 0.78) c = gr[0];
      if (shad) c = h < 0.5 ? gr[2] : gr[1];
      if (y > 30 && h < 0.5) c = gr[3];
      if (h > 0.965) c = RAMP.bone[2]; // ashen flecks
      P(g, x, y, c);
    }
    // branch peeking under canopy
    for (let k = 0; k < 4; k++) P(g, 26 + k, 30 - (k >> 1), dr[2]);
  } else {
    // near-depleted: bare branches + thin patchy canopy
    const branch = (x0, y0, dx, dy, n, c, thick) => {
      for (let k = 0; k < n; k++) {
        const x = x0 + Math.round(dx * k),
          y = y0 + Math.round(dy * k);
        P(g, x, y, c);
        if (thick) P(g, x + 1, y, RAMP.dirt[3]);
      }
    };
    branch(24, 27, -0.9, -0.7, 12, dr[2], true); // left limb
    branch(24, 27, 0.95, -0.55, 13, dr[1], true); // right limb
    branch(24, 28, 0.1, -1, 9, dr[2], true); // top limb
    branch(15, 19, -0.7, -0.8, 5, dr[3]);
    branch(33, 22, 0.8, -0.7, 5, dr[3]);
    branch(25, 20, 0.4, -0.9, 5, dr[3]);
    // leaf clusters (2 small)
    [[12, 13, 5, 4], [36, 16, 4, 3]].forEach(b => {
      for (let y = b[1] - b[3]; y <= b[1] + b[3]; y++) for (let x = b[0] - b[2]; x <= b[0] + b[2]; x++) {
        if (!inEllipse(x, y, b[0], b[1], b[2], b[3])) continue;
        const h = hash2(x, y, 31);
        if (h < 0.18) continue;
        P(g, x, y, h < 0.5 ? gr[2] : gr[1]);
      }
    });
  }
  outline(g);
  return g;
}

// ---- ROCK / ORE VEIN ----
function makeRock(depleted) {
  const g = makeGrid(40, 30);
  const st = RAMP.stone,
    gd = RAMP.gold;
  // boulder silhouette: two lumps
  for (let y = 4; y <= 29; y++) for (let x = 3; x <= 37; x++) {
    const inA = inEllipse(x, y, 17, 19, 13, 9);
    const inB = inEllipse(x, y, 27, 21, 9, 7);
    if (!inA && !inB) continue;
    if (y > 28) continue;
    let c = st[1];
    const h = hash2(x, y, 41);
    if (inEllipse(x, y, 13, 14, 9, 6)) c = h < 0.75 ? st[0] : st[1]; // top-lit
    if (y > 22) c = h < 0.7 ? st[2] : st[1];
    if (y > 26) c = st[3];
    if (inB && !inA && y <= 22) c = h < 0.5 ? st[1] : st[2];
    // facet lines
    if (h > 0.97) c = st[2];
    P(g, x, y, c);
  }
  if (!depleted) {
    // gold ore flecks
    const fl = [[12, 16], [20, 13], [26, 19], [16, 22], [30, 23]];
    fl.forEach((f, i) => {
      P(g, f[0], f[1], gd[1]);
      P(g, f[0] + 1, f[1], gd[2]);
      P(g, f[0], f[1] + 1, gd[2]);
      if (i % 2 === 0) P(g, f[0] + 1, f[1] - 1, gd[0]); // glint
    });
  } else {
    // cracks + spent flecks + rubble
    const crack = (x0, y0, pts) => {
      let x = x0,
        y = y0;
      pts.forEach(p => {
        x += p[0];
        y += p[1];
        P(g, x, y, st[3]);
        if (y < 18) P(g, x - 1, y, st[0]); // chip highlight on lit face
      });
    };
    crack(14, 10, [[1, 1], [0, 1], [1, 1], [1, 0], [0, 1], [1, 1], [0, 1], [-1, 1], [0, 1], [1, 1]]);
    crack(24, 12, [[1, 1], [1, 0], [0, 1], [1, 1], [0, 1], [1, 0], [0, 1]]);
    crack(10, 18, [[1, 0], [1, 1], [1, 0], [1, 1]]);
    P(g, 20, 17, gd[3]);
    P(g, 27, 21, gd[3]); // spent dull flecks
    // rubble at base
    [[4, 27], [7, 28], [33, 27], [36, 28], [30, 28]].forEach(r => {
      P(g, r[0], r[1], st[2]);
      P(g, r[0] + 1, r[1], st[3]);
      P(g, r[0], r[1] - 1, st[1]);
    });
  }
  outline(g);
  return g;
}

// ---- FISHING SPOT (ripple; sits ON water, no outline) ----
function ellipseRing(g, cx, cy, rx, ry, c, skip) {
  const n = Math.max(16, (rx + ry) * 3);
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2;
    const x = Math.round(cx + Math.cos(t) * rx);
    const y = Math.round(cy + Math.sin(t) * ry);
    if (skip && hash2(x, y, 51) < skip) continue;
    P(g, x, y, c);
  }
}
function makeFishFrames() {
  const wa = RAMP.water;
  const frames = [0, 1, 2, 3].map(f => {
    const g = makeGrid(40, 20);
    const r = 4 + f * 2.2;
    ellipseRing(g, 20, 10, r, r / 2, wa[0], f > 1 ? 0.3 : 0); // expanding ring
    if (f >= 1) ellipseRing(g, 20, 10, r - 4, (r - 4) / 2, wa[0], 0.45); // trailing ring
    if (f === 0) {
      P(g, 20, 10, RAMP.bone[1]);
      P(g, 21, 10, wa[0]);
    } // plip
    if (f === 3) ellipseRing(g, 20, 10, r, r / 2, wa[1], 0.5); // fading outer
    // tiny fish shadow under
    for (let k = 0; k < 4; k++) P(g, 18 + k, 12 + f % 2, wa[2]);
    return g;
  });
  // depleted: one faint ring
  const d = makeGrid(40, 20);
  ellipseRing(d, 20, 10, 5, 2.5, wa[2], 0.35);
  P(d, 20, 10, wa[2]);
  frames.push(d);
  return frames;
}
Object.assign(globalThis, {
  inEllipse,
  makeTree,
  makeRock,
  makeFishFrames,
  ellipseRing
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/nodes.js", error: String((e && e.message) || e) }); }

// assets/_gen/pixlib.js
try { (() => {
// DriftLands sprite generator library — evaled inside run_script.
// Pixel grids -> auto outline -> row-run-merged <rect> SVG (crispEdges).
// Deterministic RNG only; alpha used ONLY for the corruption overlay.

function makeGrid(w, h) {
  return {
    w,
    h,
    d: new Array(w * h).fill(null)
  };
}
function P(g, x, y, c, a) {
  x = x | 0;
  y = y | 0;
  if (x < 0 || y < 0 || x >= g.w || y >= g.h || !c) return;
  g.d[y * g.w + x] = a == null ? {
    c
  } : {
    c,
    a
  };
}
function G(g, x, y) {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null;
  return g.d[y * g.w + x];
}
function fillRect(g, x, y, w, h, c, a) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(g, x + i, y + j, c, a);
}
function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function outline(g, c) {
  c = c || '#0a0810';
  const add = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (G(g, x, y)) continue;
    if (G(g, x + 1, y) || G(g, x - 1, y) || G(g, x, y + 1) || G(g, x, y - 1)) add.push([x, y]);
  }
  add.forEach(p => P(g, p[0], p[1], c));
}
function stamp(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const v = G(src, x, y);
    if (v) P(dst, ox + x, oy + y, v.c, v.a);
  }
}
function mirrorX(g) {
  const m = makeGrid(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v) P(m, g.w - 1 - x, y, v.c, v.a);
  }
  return m;
}
function gridRects(g, ox, oy) {
  ox = ox || 0;
  oy = oy || 0;
  const out = [];
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = G(g, x, y);
      if (!v) {
        x++;
        continue;
      }
      let x2 = x + 1;
      while (x2 < g.w) {
        const v2 = G(g, x2, y);
        if (!v2 || v2.c !== v.c || (v2.a == null ? 1 : v2.a) !== (v.a == null ? 1 : v.a)) break;
        x2++;
      }
      out.push({
        x: x + ox,
        y: y + oy,
        w: x2 - x,
        c: v.c,
        a: v.a
      });
      x = x2;
    }
  }
  return out;
}
function rectsToSvg(rects, w, h) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">' + rects.map(r => '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="1" fill="' + r.c + '"' + (r.a != null ? ' fill-opacity="' + r.a + '"' : '') + '/>').join('') + '</svg>';
}
function gridSvg(g) {
  return rectsToSvg(gridRects(g), g.w, g.h);
}
function sheetSvg(grids, cw, ch, cols) {
  const n = grids.length;
  cols = cols || n;
  const rows = Math.ceil(n / cols);
  let rects = [];
  grids.forEach((g, i) => {
    rects = rects.concat(gridRects(g, i % cols * cw, Math.floor(i / cols) * ch));
  });
  return rectsToSvg(rects, cols * cw, rows * ch);
}
function drawGrid(ctx, g, ox, oy, s) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (!v) continue;
    ctx.globalAlpha = v.a == null ? 1 : v.a;
    ctx.fillStyle = v.c;
    ctx.fillRect(ox + x * s, oy + y * s, s, s);
  }
  ctx.globalAlpha = 1;
}

// 64x32 iso diamond face rows: y -> inclusive [x0,x1]
function diamondRows() {
  const rows = [];
  for (let y = 0; y < 32; y++) {
    const half = y < 16 ? 2 * (y + 1) : 2 * (32 - y);
    rows.push({
      x0: 32 - half,
      x1: 32 + half - 1
    });
  }
  return rows;
}
function inDiamond(rows, x, y) {
  if (y < 0 || y > 31) return false;
  return x >= rows[y].x0 && x <= rows[y].x1;
}
const RAMP = {
  grass: ['#7fae5e', '#4d7c4d', '#356037', '#20402a'],
  dirt: ['#7a6048', '#50402e', '#36291c', '#241a11'],
  stone: ['#4a4360', '#322b46', '#211c30', '#14101e'],
  water: ['#4a7fa0', '#2c5775', '#173a52', '#0d2336'],
  drift: ['#f3e8ff', '#d8b4fe', '#a855f7', '#6b21a8', '#3b1162'],
  ember: ['#fcd34d', '#f59e0b', '#b45309', '#7c3a06'],
  gold: ['#f6e0a6', '#e7c873', '#b8943f', '#7c5f23'],
  blood: ['#ef4444', '#dc2626', '#991b1b', '#5f1212'],
  bone: ['#efe9f4', '#d8cfe0', '#a99fb8', '#6f6781'],
  void: '#0a0810',
  ash: '#171320'
};
Object.assign(globalThis, {
  makeGrid,
  P,
  G,
  fillRect,
  mulberry,
  outline,
  stamp,
  mirrorX,
  gridRects,
  rectsToSvg,
  gridSvg,
  sheetSvg,
  drawGrid,
  diamondRows,
  inDiamond,
  RAMP
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/pixlib.js", error: String((e && e.message) || e) }); }

// assets/_gen/tiles.js
try { (() => {
// DriftLands tile generators — eval after pixlib.js.
// Tiles: 64×35 (32px diamond face + 3px south lip). Overlay: 64×32.

function hash2(x, y, s) {
  let h = x * 374761393 + y * 668265263 + (s || 0) * 2147483647 | 0;
  h = (h ^ h >> 13) * 1274126177 | 0;
  return ((h ^ h >> 16) >>> 0) / 4294967296;
}
function contourMaxY(rows, x) {
  for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) return y;
  return -1;
}
function makeBaseTile(type, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = RAMP[type];
  const face = ramp[1],
    hi = ramp[0],
    sh = ramp[2],
    dp = ramp[3];
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);

  // 3px south lip in the shadow step
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
  }
  // 1px void north edge (top contour)
  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      P(g, x, y, RAMP.void);
      break;
    }
  }

  // per-type face detail
  for (let y = 1; y < 31; y++) {
    for (let x = rows[y].x0 + 1; x <= rows[y].x1 - 1; x++) {
      const h = hash2(x, y, seedN);
      if (type === 'grass') {
        if (h < 0.055) {
          P(g, x, y, sh);
          if (hash2(x, y, seedN + 1) < 0.4) P(g, x, y - 1, sh);
        } else if (h < 0.075) P(g, x, y, hi);
      } else if (type === 'dirt') {
        if (h < 0.04) {
          P(g, x, y, sh);
          P(g, x + 1, y, dp);
        } else if (h < 0.05) P(g, x, y, hi);
      } else if (type === 'stone') {
        if (h < 0.03) {
          P(g, x, y, dp);
          P(g, x + 1, y, dp);
          P(g, x + 2, y, dp);
        } else if (h < 0.045) P(g, x, y, hi);
      } else if (type === 'water') {
        if (h < 0.05 && y > 18) P(g, x, y, sh); // deeper toward south
      }
    }
  }
  return g;
}

// 2px dither transition band into `other` along the SOUTH edges
function transitionVariant(type, other, seedN) {
  const g = makeBaseTile(type, seedN);
  const rows = diamondRows();
  const oc = RAMP[other][1];
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my < 0) continue;
    for (let k = 0; k <= 1; k++) {
      const y = my - k;
      if (y < 1 || !inDiamond(rows, x, y)) continue;
      if ((x + y) % 2 === 0 || k === 0 && hash2(x, y, 9) < 0.35) P(g, x, y, oc);
    }
  }
  return g;
}

// stone hard 1px void seam variant (full perimeter)
function stoneSeamVariant(seedN) {
  const g = makeBaseTile('stone', seedN);
  const rows = diamondRows();
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) P(g, x, my, RAMP.void);
  }
  return g;
}

// water shimmer frames: same base, speculars drift ±1px
function waterFrames(seedN) {
  const specs = [];
  const rnd = mulberry(seedN + 100);
  for (let i = 0; i < 7; i++) {
    specs.push({
      x: 12 + Math.floor(rnd() * 38),
      y: 6 + Math.floor(rnd() * 20),
      len: 2 + Math.floor(rnd() * 4)
    });
  }
  const DX = [0, 1, 0, -1],
    DY = [0, 0, 1, 0];
  const rows = diamondRows();
  return [0, 1, 2, 3].map(f => {
    const g = makeBaseTile('water', seedN);
    specs.forEach((s, i) => {
      if ((i + f) % 4 === 3) return; // one streak rests per frame
      const y = s.y + DY[(f + i) % 4];
      for (let k = 0; k < s.len; k++) {
        const x = s.x + DX[(f + i) % 4] + k;
        if (inDiamond(rows, x, y) && y > 1) P(g, x, y, RAMP.water[0]);
      }
    });
    return g;
  });
}

// water foam edge variant (2px light dither at perimeter)
function waterFoamVariant(seedN) {
  const g = makeBaseTile('water', seedN);
  const rows = diamondRows();
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    let ty = -1;
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      ty = y;
      break;
    }
    [[ty + 1, 0], [ty + 2, 1], [my, 0], [my - 1, 1]].forEach(p => {
      const y = p[0];
      if (y < 1 || y > 31 || !inDiamond(rows, x, y)) return;
      if ((x + y) % 2 === 0 && hash2(x, y, 6) < 0.6) P(g, x, y, RAMP.water[0]);else if (hash2(x, y, 5) < 0.14) P(g, x, y, RAMP.bone[2]);
    });
  }
  return g;
}

// corruption overlay: 6 pulse frames, static dither pattern, stepped alpha
function corruptFrames() {
  const alphas = [0.18, 0.212, 0.244, 0.276, 0.308, 0.34];
  const rows = diamondRows();
  const motes = [];
  const rnd = mulberry(424242);
  for (let i = 0; i < 6; i++) {
    motes.push({
      x: 14 + Math.floor(rnd() * 36),
      y: 6 + Math.floor(rnd() * 20)
    });
  }
  return alphas.map((a, f) => {
    const g = makeGrid(64, 32);
    for (let y = 0; y < 32; y++) {
      for (let x = rows[y].x0; x <= rows[y].x1; x++) {
        const dist = Math.abs(x - 32) / 2 + Math.abs(y - 16); // diamond metric 0..16
        const density = Math.max(0, 1 - dist / 15);
        const h = hash2(x, y, 77);
        if ((x + y) % 2 === 0 && h < density * 0.95) P(g, x, y, RAMP.drift[2], a);else if (h < density * 0.22) P(g, x, y, RAMP.drift[3], a);
      }
    }
    motes.forEach((m, i) => {
      const ph = (i + f) % 6;
      if (ph < 3) {
        P(g, m.x, m.y, ph === 1 ? RAMP.drift[0] : RAMP.drift[1], 0.85);
        if (ph === 1) {
          P(g, m.x, m.y - 1, RAMP.drift[1], 0.5);
          P(g, m.x, m.y + 1, RAMP.drift[1], 0.5);
        }
      }
    });
    return g;
  });
}
Object.assign(globalThis, {
  hash2,
  contourMaxY,
  makeBaseTile,
  transitionVariant,
  stoneSeamVariant,
  waterFrames,
  waterFoamVariant,
  corruptFrames
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/tiles.js", error: String((e && e.message) || e) }); }

// assets/_gen/town.js
try { (() => {
// DriftLands TOWN SET — the Waystation. Eval after pixlib.js (+ tiles.js for hash2).
// Isometric 2:1 weathered frontier structures. Each house: south door + a warm
// lit window + a purpose sign/roof feature. Moonlit left, shadowed right. 1px
// void auto-outline, RAMP palette only, dithering not blur, deterministic.
// Houses: 144×152 cell, bottom-center anchor (72,151), top 6px kept clear.
// Shrine: 112×128 (3 flame frames). Pit: 240×120 flat, center anchor (120,60).

function rnd2(x, y, s) {
  return hash2(x, y, s || 0);
}

// ---- packed-earth + stone foundation diamond (3×3-ish footprint, corners show)
function foundation(g, cx, topY, halfW, opt) {
  opt = opt || {};
  const dirt = RAMP.dirt,
    stone = RAMP.stone;
  const halfH = Math.round(halfW / 2);
  // top diamond surface (packed earth)
  for (let dy = -halfH; dy <= halfH; dy++) {
    const t = 1 - Math.abs(dy) / halfH;
    const w = Math.round(halfW * t);
    for (let dx = -w; dx <= w; dx++) {
      let c = dirt[1];
      if (dy < -halfH * 0.3 && dx < 0) c = dirt[0]; // moonlit back-left
      else if (dy > halfH * 0.3) c = dirt[2]; // front shade
      if (rnd2(cx + dx, topY + dy, 3) < 0.06) c = dirt[2];
      P(g, cx + dx, topY + dy, c);
    }
  }
  // front rim (south faces) — 4px stone plinth height on the lower-front edges
  for (let dx = -halfW; dx <= halfW; dx++) {
    const t = 1 - Math.abs(dx) / halfW;
    const edgeY = topY + Math.round(halfH * t);
    for (let k = 1; k <= 4; k++) {
      let c = dx < 0 ? stone[1] : stone[2];
      if (k >= 3) c = stone[3];
      P(g, cx + dx, edgeY + k, c);
    }
  }
  // ash drifts against the front rim
  if (opt.ash !== false) {
    for (let i = 0; i < 14; i++) {
      const dx = -halfW + 6 + Math.floor(rnd2(i, cx, 7) * (halfW * 2 - 12));
      const t = 1 - Math.abs(dx) / halfW;
      const edgeY = topY + Math.round(halfH * t) + 4;
      const a = rnd2(i, cx, 8);
      if (a < 0.5) {
        P(g, cx + dx, edgeY, RAMP.bone[3]);
        if (a < 0.25) P(g, cx + dx, edgeY - 1, RAMP.bone[2]);
      }
    }
  }
  return {
    halfH
  };
}

// ---- front facade (south wall, camera-facing, moonlit-left)
function frontWall(g, x0, x1, ytop, ybot, ramp, seed, mat) {
  for (let x = x0; x <= x1; x++) {
    for (let y = ytop; y <= ybot; y++) {
      let c = ramp[1];
      if (x <= x0 + 1) c = ramp[0];else if (x >= x1 - 1) c = ramp[2];
      if (mat === 'timber') {
        // horizontal plank seams
        if ((y - ytop) % 4 === 0) c = ramp[2];
        if (rnd2(x, y, seed) < 0.05) c = ramp[2];
      } else if (mat === 'plaster') {
        // patchy plaster
        if (rnd2(x, y, seed) < 0.04) c = ramp[2];else if (rnd2(x, y, seed + 1) < 0.03) c = ramp[0];
      } else if (mat === 'block') {
        // stone block courses
        if ((y - ytop) % 5 === 0) c = ramp[3];
        if ((x - x0 + Math.floor((y - ytop) / 5) % 2 * 4) % 8 === 0) c = ramp[3];
      } else if (mat === 'log') {
        // stacked log ends -> horizontal rounds
        const r = (y - ytop) % 5;
        if (r === 0) c = ramp[3];else if (r === 1) c = ramp[0];
      }
      P(g, x, y, c);
    }
  }
}

// ---- right side wall (east face), recedes up-right by dep, in shadow
function rightWall(g, x1, ytop, ybot, dep, ramp, mat, seed) {
  for (let d = 1; d <= dep; d++) {
    const sx = x1 + d,
      yt = ytop - Math.floor(d / 2),
      yb = ybot - Math.floor(d / 2);
    for (let y = yt; y <= yb; y++) {
      let c = ramp[2];
      if (d >= dep - 1) c = ramp[3];
      if (mat === 'timber' && (y - yt) % 4 === 0) c = ramp[3];
      if (mat === 'block' && (y - yt) % 5 === 0) c = ramp[3];
      if (rnd2(sx, y, seed) < 0.05) c = ramp[3];
      P(g, sx, y, c);
    }
  }
}

// ---- gable roof: lit front triangle + shadowed right slope + eaves
function gableRoof(g, x0, x1, ytop, dep, roofH, ramp, opt) {
  opt = opt || {};
  const cx = (x0 + x1) / 2;
  const ov = opt.overhang == null ? 3 : opt.overhang;
  const gx0 = x0 - ov,
    gx1 = x1 + ov;
  // front gable triangle
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH;
    const hw = (gx1 - gx0) / 2 * t;
    const yy = ytop - roofH + y;
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      let c = ramp[1];
      if (x <= cx - hw + 2) c = ramp[0];else if (x >= cx + hw - 1) c = ramp[2];
      if (y % 3 === 0) c = ramp[2]; // shingle rows
      P(g, x, yy, c);
    }
  }
  // ridge + right roof slope receding
  for (let d = 1; d <= dep + ov; d++) {
    const ys = Math.floor(d / 2);
    for (let y = 0; y <= roofH; y++) {
      const t = y / roofH;
      const x = Math.round(cx + d + (gx1 - cx) * t);
      const yy = Math.round(ytop - roofH - ys + y);
      let c = ramp[2];
      if (y % 3 === 0) c = ramp[3];
      if (d >= dep + ov - 1) c = ramp[3];
      P(g, x, yy, c);
    }
  }
  // ridge beam highlight
  for (let d = 0; d <= dep + ov; d++) P(g, Math.round(cx + d), ytop - roofH - Math.floor(d / 2), ramp[0]);
}

// ---- warm lit window (ember interior glow) with frame
function litWindow(g, x, y, w, h, opt) {
  opt = opt || {};
  const em = RAMP.ember,
    fr = opt.frame || RAMP.dirt;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = em[1];
    if (i === 0 || j === 0 || i === w - 1 || j === h - 1) c = em[0];
    if ((i + j) % 2 === 0 && rnd2(x + i, y + j, 12) < 0.3) c = em[0];
    P(g, x + i, y + j, c);
  }
  // frame + cross mullion
  for (let i = -1; i <= w; i++) {
    P(g, x + i, y - 1, fr[3]);
    P(g, x + i, y + h, fr[3]);
  }
  for (let j = -1; j <= h; j++) {
    P(g, x - 1, y + j, fr[3]);
    P(g, x + w, y + j, fr[3]);
  }
  if (!opt.noCross) {
    for (let j = 0; j < h; j++) P(g, x + (w >> 1) - (w > 5 ? 0 : 0), y + j, fr[3]);
    for (let i = 0; i < w; i++) P(g, x + i, y + (h >> 1), fr[3]);
  }
  // warm spill below the sill
  P(g, x, y + h + 1, em[2]);
  P(g, x + w - 1, y + h + 1, em[2]);
}

// ---- plank door on the south wall
function door(g, cx, ybot, w, h, ramp, opt) {
  opt = opt || {};
  const x0 = cx - (w >> 1);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = ramp[2];
    if (i === 0) c = ramp[1];
    if (i === w - 1) c = ramp[3];
    if (i % 2 === 1) c = ramp[3]; // plank gaps
    P(g, x0 + i, ybot - h + j, c);
  }
  // frame
  for (let j = -1; j <= h; j++) {
    P(g, x0 - 1, ybot - h + j, ramp[3]);
    P(g, x0 + w, ybot - h + j, ramp[3]);
  }
  for (let i = -1; i <= w; i++) P(g, x0 + i, ybot - h - 1, opt.lintel || ramp[3]);
  // handle
  P(g, x0 + w - 2, ybot - (h >> 1), opt.handle || RAMP.gold[1]);
}

// ---- hanging sign board (post + chains + plate with a glyph)
function hangingSign(g, x, y, w, h, plate, glyphFn) {
  // bracket
  for (let i = 0; i < 6; i++) P(g, x - 1 + i, y - 2, RAMP.dirt[3]);
  P(g, x + 4, y - 2, RAMP.dirt[3]);
  // chains
  P(g, x + 1, y - 1, RAMP.bone[3]);
  P(g, x + w - 2, y - 1, RAMP.bone[3]);
  // plate
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = plate[1];
    if (i === 0 || j === 0) c = plate[0];
    if (i === w - 1 || j === h - 1) c = plate[3];
    P(g, x + i, y + j, c);
  }
  if (glyphFn) glyphFn(g, x, y, w, h);
}
function smoke(g, cx, topY) {
  const bn = RAMP.bone;
  let x = cx,
    y = topY;
  for (let k = 0; k < 10; k++) {
    P(g, x, y, bn[3]);
    if (k % 2 === 0) P(g, x + (k % 4 === 0 ? 1 : -1), y, bn[3]);
    y -= 1 + k % 2;
    x += (k % 3 === 0 ? 1 : 0) * (k % 6 < 3 ? 1 : -1);
  }
}
function moss(g, x0, x1, y, ramp) {
  for (let x = x0; x <= x1; x++) if (rnd2(x, y, 15) < 0.4) {
    P(g, x, y, ramp[2]);
    if (rnd2(x, y, 16) < 0.4) P(g, x, y + 1, ramp[3]);
  }
}

/* ===================================================================== */
/* THE EIGHT STRUCTURES                                                  */
/* ===================================================================== */

// shared house frame; returns key coords for detailing
function houseShell(g, opt) {
  const cx = 72,
    baseY = opt.baseY || 130;
  foundation(g, cx, baseY + 8, opt.found == null ? 58 : opt.found, {
    ash: opt.ash
  });
  const fw = opt.fw || 64,
    fh = opt.fh || 56,
    dep = opt.dep || 26,
    roofH = opt.roofH || 22;
  const x0 = cx - (fw >> 1),
    x1 = cx + (fw >> 1),
    ytop = baseY - fh,
    ybot = baseY;
  rightWall(g, x1, ytop, ybot, dep, opt.wall, opt.mat, opt.seed || 1);
  frontWall(g, x0, x1, ytop, ybot, opt.wall, opt.seed || 1, opt.mat);
  if (opt.roof !== false) gableRoof(g, x0, x1, ytop, dep, roofH, opt.roofRamp || RAMP.dirt, {
    overhang: opt.overhang
  });
  return {
    cx,
    x0,
    x1,
    ytop,
    ybot,
    fw,
    fh,
    dep,
    roofH
  };
}
function drawDyeworks() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.bone,
    mat: 'plaster',
    roofRamp: RAMP.stone,
    fh: 60,
    fw: 66,
    seed: 21
  });
  // GREAT colorful dye drips running down from the upper floor (signature)
  const dyes = [[RAMP.drift[2], RAMP.drift[1]], [RAMP.ember[1], RAMP.ember[0]], [RAMP.water[0], '#6fa8c8'], [RAMP.gold[1], RAMP.gold[0]], [RAMP.blood[1], RAMP.blood[0]], [RAMP.grass[1], RAMP.grass[0]]];
  let ddx = s.x0 + 3;
  for (let i = 0; ddx < s.x1 - 2; i++) {
    const dark = dyes[i % dyes.length][0],
      lit = dyes[i % dyes.length][1];
    const w = 2 + (rnd2(i, 2, 9) < 0.4 ? 1 : 0);
    const len = 16 + Math.floor(rnd2(i, 3, 9) * 26); // long runs: upper floor → mid wall
    fillRect(g, ddx, s.ytop + 3, w + 1, 3, dark); // pooled source at the seam
    for (let k = 0; k < len; k++) {
      const yy = s.ytop + 4 + k,
        wob = Math.round(Math.sin(k * 0.35 + i) * 0.5);
      for (let c = 0; c < w; c++) P(g, ddx + c + wob, yy, c === 0 ? lit : dark);
      if (k > len - 4) P(g, ddx + (w >> 1) + wob, yy, dark);
    }
    P(g, ddx + (w >> 1), s.ytop + 4 + len, dark); // bead
    ddx += w + 2 + Math.floor(rnd2(i, 5, 9) * 5);
  }
  // door + lit window
  door(g, s.cx - 12, s.ybot, 10, 22, RAMP.dirt);
  litWindow(g, s.cx + 6, s.ytop + 18, 9, 9);
  // steaming dye vats out front
  [[s.x0 + 2, s.ybot + 6, RAMP.drift], [s.x0 + 12, s.ybot + 9, RAMP.ember]].forEach(([vx, vy, r]) => {
    for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) {
      let c = RAMP.dirt[2];
      if (i === 0) c = RAMP.dirt[1];
      if (i === 7) c = RAMP.dirt[3];
      if (j === 0) c = r[2];
      P(g, vx + i, vy + j, c);
    }
    P(g, vx + 3, vy - 2, RAMP.bone[3]);
    P(g, vx + 4, vy - 4, RAMP.bone[3]);
    P(g, vx + 3, vy - 6, RAMP.bone[3]);
  });
  // drying cloth line (many colors)
  for (let i = 0; i < 7; i++) {
    const lx = s.x1 + 2 + i * 4;
    const col = dyes[i % dyes.length][0];
    P(g, lx, s.ytop + 8, RAMP.bone[3]);
    for (let j = 0; j < 6; j++) P(g, lx, s.ytop + 9 + j, col);
  }
  for (let x = s.x1; x <= s.x1 + 30; x++) P(g, x, s.ytop + 7, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}
function drawVault() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.stone,
    mat: 'block',
    roof: false,
    fh: 64,
    fw: 72,
    dep: 30,
    found: 60,
    seed: 31
  });
  // flat fortified parapet instead of gable
  for (let x = s.x0 - 2; x <= s.x1 + 2; x++) for (let y = s.ytop - 6; y < s.ytop; y++) {
    let c = RAMP.stone[1];
    if (x < s.x0) c = RAMP.stone[0];
    if (x > s.x1) c = RAMP.stone[2];
    if (x % 6 < 2 && y < s.ytop - 3) c = null;
    P(g, x, y, c || RAMP.stone[1]);
    if (x % 6 < 2 && y < s.ytop - 3) g.d[y * g.w + x] = null;
  }
  // crenellations
  for (let x = s.x0 - 2; x <= s.x1 + 2; x += 6) for (let i = 0; i < 3; i++) for (let y = s.ytop - 9; y < s.ytop - 6; y++) P(g, x + i, y, RAMP.stone[2]);
  // top face receding
  for (let d = 1; d <= s.dep; d++) for (let x = s.x0 - 2; x <= s.x1 + 2; x++) P(g, x + d, s.ytop - 6 - Math.floor(d / 2), RAMP.stone[3]);
  // gold-trimmed reinforced door
  const dx = s.cx,
    db = s.ybot;
  for (let j = 0; j < 26; j++) for (let i = -7; i <= 7; i++) {
    let c = RAMP.stone[3];
    if (i === -7) c = RAMP.gold[2];
    if (i === 7) c = RAMP.gold[3];
    if (Math.abs(i) === 4) c = RAMP.gold[3];
    P(g, dx + i, db - 26 + j, c);
  }
  for (let i = -8; i <= 8; i++) P(g, dx + i, db - 27, RAMP.gold[1]); // gold lintel
  for (let j = -27; j <= 0; j += 1) {
    P(g, dx - 8, db + j, RAMP.gold[2]);
    P(g, dx + 8, db + j, RAMP.gold[2]);
  }
  // big gold ring + seam
  P(g, dx, db - 13, RAMP.gold[0]);
  P(g, dx - 1, db - 13, RAMP.gold[1]);
  P(g, dx + 1, db - 13, RAMP.gold[1]);
  P(g, dx, db - 12, RAMP.gold[2]);
  // small barred lit window high up
  litWindow(g, s.cx - 6, s.ytop + 8, 5, 5, {
    noCross: true
  });
  for (let i = 0; i < 5; i++) P(g, s.cx - 6 + i, s.ytop + 10, RAMP.stone[3]); // bars
  // gold seam coin emblem on wall
  P(g, s.x1 - 8, s.ytop + 22, RAMP.gold[0]);
  fillRect(g, s.x1 - 9, s.ytop + 21, 3, 3, RAMP.gold[1]);
  P(g, s.x1 - 8, s.ytop + 22, RAMP.gold[0]);
  outline(g, RAMP.void);
  return g;
}
function drawCasino() {
  const g = makeGrid(144, 152);
  foundation(g, 72, 138, 56, {});
  const cx = 72,
    baseY = 130,
    tw = 76,
    th = 64;
  const x0 = cx - (tw >> 1),
    x1 = cx + (tw >> 1),
    ytop = baseY - th;
  // tent body: blood-red & void-black vertical stripes, slightly crooked
  for (let x = x0; x <= x1; x++) {
    const stripe = Math.floor((x - x0) / 6) % 2;
    for (let y = ytop + 10; y <= baseY; y++) {
      const skew = Math.round((y - ytop) * 0.04);
      let c = stripe ? RAMP.blood[2] : RAMP.ash;
      if (x <= x0 + 1) c = stripe ? RAMP.blood[1] : RAMP.stone[2];else if (x >= x1 - 1) c = stripe ? RAMP.blood[3] : RAMP.void;
      P(g, x + skew, y, c);
    }
  }
  // peaked tent roof (scalloped)
  for (let x = x0 - 4; x <= x1 + 4; x++) {
    const d = Math.abs(x - cx);
    const yy = ytop + 10 - Math.round((1 - d / (tw / 2 + 4)) * 26);
    const stripe = Math.floor((x - x0) / 6) % 2;
    for (let y = yy; y <= ytop + 11; y++) P(g, x, y, stripe ? RAMP.blood[1] : RAMP.ash);
  }
  // scalloped valance
  for (let x = x0 - 4; x <= x1 + 4; x += 4) {
    for (let i = 0; i < 3; i++) P(g, x + i, ytop + 11 + (i === 1 ? 2 : 1), RAMP.gold[1]);
  }
  // center pole flag
  for (let y = ytop - 22; y < ytop - 12; y++) P(g, cx, y, RAMP.dirt[3]);
  fillRect(g, cx + 1, ytop - 22, 6, 4, RAMP.blood[1]);
  P(g, cx + 6, ytop - 21, RAMP.blood[2]);
  // entrance flap (door) — open dark interior with tied-back curtains
  for (let j = 0; j < 26; j++) for (let i = -7; i <= 7; i++) {
    const t = Math.abs(i) / 7;
    if (j < 26 * t * 0.5) continue; // arched top
    P(g, cx + i, baseY - 26 + j + Math.round(t * 3), i <= -5 ? RAMP.blood[3] : i >= 5 ? RAMP.void : RAMP.void);
  }
  for (let i = -8; i <= 8; i++) P(g, cx + i, baseY - 26 + Math.round(Math.abs(i) / 8 * 3), RAMP.gold[2]); // arch trim
  // warm glow + a beckoning lantern just inside
  litWindow(g, cx - 3, baseY - 18, 5, 5, {
    noCross: true
  });
  // big multicolor prize wheel by the entrance
  const wx = x0 - 12,
    wy = baseY - 30;
  const seg = [RAMP.blood[1], RAMP.ember[1], RAMP.gold[1], RAMP.water[0], RAMP.drift[2], RAMP.moss ? RAMP.grass[1] : RAMP.grass[1]];
  for (let yy = -11; yy <= 11; yy++) for (let xx = -11; xx <= 11; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    if (d > 11) continue;
    if (d > 9) {
      P(g, wx + xx, wy + yy, RAMP.dirt[3]);
      continue;
    }
    const ang = (Math.atan2(yy, xx) + Math.PI) / (Math.PI * 2);
    P(g, wx + xx, wy + yy, seg[Math.floor(ang * 6) % 6]);
  }
  P(g, wx, wy, RAMP.bone[0]);
  P(g, wx + 1, wy - 9, RAMP.bone[0]); // hub + pointer
  for (let k = 0; k < 14; k++) P(g, wx - 11, wy - 11 + k, RAMP.dirt[3]); // post
  // hanging coin-charms over entrance
  for (let x = x0 + 4; x <= x1 - 4; x += 6) {
    P(g, x, ytop + 12, RAMP.gold[2]);
    P(g, x, ytop + 14, RAMP.gold[1]);
    P(g, x, ytop + 15, RAMP.gold[2]);
  }
  // a warm lit slit window
  litWindow(g, x1 - 14, baseY - 30, 6, 7, {
    noCross: true
  });
  outline(g, RAMP.void);
  return g;
}
function drawTavern() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.dirt,
    mat: 'timber',
    roofRamp: RAMP.blood,
    fh: 56,
    fw: 66,
    seed: 41,
    overhang: 4
  });
  // timber A-frame braces on facade
  for (let k = 0; k < s.fh; k++) {
    P(g, s.x0 + 2 + Math.round(k * 0.5), s.ybot - k, RAMP.dirt[3]);
    P(g, s.x1 - 2 - Math.round(k * 0.5), s.ybot - k, RAMP.dirt[3]);
  }
  for (let x = s.x0 + 4; x <= s.x1 - 4; x++) P(g, x, s.ytop + 22, RAMP.dirt[3]); // mid beam
  // crooked chimney with smoke
  const chx = s.x1 - 6;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 6; i++) {
    let c = RAMP.stone[2];
    if (i === 0) c = RAMP.stone[1];
    if (i === 5) c = RAMP.stone[3];
    if (j % 4 === 0) c = RAMP.stone[3];
    P(g, chx + i + Math.round(j * 0.15), s.ytop - 18 + j, c);
  }
  smoke(g, chx + 3, s.ytop - 19);
  // several glowing windows
  litWindow(g, s.cx - 18, s.ytop + 16, 8, 8);
  litWindow(g, s.cx + 10, s.ytop + 16, 8, 8);
  litWindow(g, s.cx - 4, s.ytop + 30, 7, 7, {
    noCross: true
  });
  // door (open, warm spill)
  door(g, s.cx, s.ybot, 12, 24, RAMP.dirt, {
    handle: RAMP.gold[0]
  });
  for (let j = 0; j < 22; j++) for (let i = -2; i <= 2; i++) if (rnd2(i, j, 17) < 0.5) P(g, s.cx + i, s.ybot - 22 + j, RAMP.ember[2]);
  // big ember lantern over the door
  const lx = s.cx,
    ly = s.ytop + 40;
  P(g, lx, ly - 3, RAMP.dirt[3]);
  for (let j = 0; j < 7; j++) for (let i = -3; i <= 3; i++) {
    const t = Math.abs(i) / 3;
    let c = RAMP.ember[1];
    if (j === 0 || j === 6) c = RAMP.dirt[3];else if (i <= -2) c = RAMP.ember[0];else if (i >= 2) c = RAMP.ember[2];
    if (t > 0.9 && (j === 1 || j === 5)) c = RAMP.dirt[3];
    P(g, lx + i, ly + j, c);
  }
  P(g, lx, ly + 3, RAMP.ember[0]);
  // glow halo (dither)
  for (let yy = -5; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 5 && d < 9 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]);
  }
  // barrels outside
  [[s.x0 - 8, s.ybot + 4], [s.x0 - 1, s.ybot + 8]].forEach(([bx, by]) => {
    for (let j = 0; j < 10; j++) for (let i = 0; i < 8; i++) {
      const t = Math.abs(i - 3.5) / 4;
      let c = RAMP.dirt[1];
      if (i === 0) c = RAMP.dirt[0];
      if (i >= 6) c = RAMP.dirt[2];
      if (j === 0 || j === 9 || j === 4) c = RAMP.dirt[3];
      if (t > 0.85) c = RAMP.dirt[3];
      P(g, bx + i, by + j, c);
    }
  });
  // hanging tavern sign (lantern glyph)
  hangingSign(g, s.x1 + 4, s.ytop + 26, 12, 9, RAMP.dirt, (gg, x, y, w, h) => {
    fillRect(gg, x + 4, y + 2, 4, 5, RAMP.ember[1]);
    P(gg, x + 5, y + 1, RAMP.ember[0]);
    P(gg, x + 5, y + 7, RAMP.ember[0]);
  });
  outline(g, RAMP.void);
  return g;
}
function drawFurnisher() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.dirt,
    mat: 'log',
    roofRamp: RAMP.stone,
    fh: 54,
    fw: 60,
    seed: 51
  });
  // log-end texture already in wall; door + lit window
  door(g, s.cx + 8, s.ybot, 11, 22, RAMP.dirt);
  litWindow(g, s.cx - 12, s.ytop + 16, 9, 9);
  // lean-to awning over a workbench (left side)
  const ax0 = s.x0 - 26,
    ax1 = s.x0 + 2,
    ay = s.ytop + 20;
  for (let x = ax0; x <= ax1; x++) {
    const yy = ay + Math.round((x - ax0) * 0.4);
    for (let k = 0; k < 2; k++) P(g, x, yy + k, k ? RAMP.dirt[3] : RAMP.dirt[2]);
  }
  for (let k = 0; k < 18; k++) {
    P(g, ax0, ay + 1 + k, RAMP.dirt[3]);
    P(g, ax0 + 1, ay + 1 + k, RAMP.dirt[2]);
  } // post
  // workbench
  const wbx = ax0 + 4,
    wby = s.ybot - 4;
  for (let i = 0; i < 20; i++) P(g, wbx + i, wby, RAMP.dirt[1]);
  for (let i = 0; i < 20; i++) P(g, wbx + i, wby + 1, RAMP.dirt[3]);
  P(g, wbx + 1, wby + 2, RAMP.dirt[3]);
  P(g, wbx + 1, wby + 3, RAMP.dirt[3]);
  P(g, wbx + 18, wby + 2, RAMP.dirt[3]);
  P(g, wbx + 18, wby + 3, RAMP.dirt[3]);
  // a half-built chair on the bench + saw
  fillRect(g, wbx + 4, wby - 5, 2, 5, RAMP.dirt[2]);
  fillRect(g, wbx + 4, wby - 5, 5, 2, RAMP.dirt[1]);
  P(g, wbx + 8, wby - 5, RAMP.dirt[2]);
  for (let i = 0; i < 6; i++) P(g, wbx + 11 + i, wby - 2, RAMP.bone[1]); // saw blade
  P(g, wbx + 17, wby - 3, RAMP.dirt[3]);
  // sawdust
  for (let i = 0; i < 12; i++) if (rnd2(i, 5, 18) < 0.6) P(g, wbx + 2 + i, s.ybot + 1 + i % 2, RAMP.gold[2]);
  // stacked crates + planks (right)
  const px = s.x1 + 4;
  for (let c = 0; c < 2; c++) for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
    let col = RAMP.dirt[1];
    if (i === 0) col = RAMP.dirt[0];
    if (i === 8) col = RAMP.dirt[2];
    if (j === 0 || j === 8 || i === 0 || i === 8) col = RAMP.dirt[3];
    if (i === j || i === 8 - j) col = RAMP.dirt[2];
    P(g, px + c * 10, s.ybot - 9 - (c ? 9 : 0) + j, col);
    P(g, px + c * 10 + i, s.ybot - 9 - (c ? 9 : 0) + j, col);
  }
  for (let i = 0; i < 12; i++) {
    P(g, px - 2, s.ybot - 2 - i * 0, RAMP.dirt[2]);
  } // (planks leaning)
  for (let k = 0; k < 14; k++) {
    P(g, px + 18 + Math.round(k * 0.2), s.ybot - k, RAMP.dirt[1]);
    P(g, px + 19 + Math.round(k * 0.2), s.ybot - k, RAMP.dirt[3]);
  }
  // small wares banner + lamp out front
  hangingSign(g, s.x1 + 2, s.ytop + 24, 11, 8, RAMP.dirt, (gg, x, y, w, h) => {
    fillRect(gg, x + 3, y + 2, 5, 2, RAMP.dirt[1]);
    P(gg, x + 4, y + 4, RAMP.dirt[2]);
    P(gg, x + 6, y + 4, RAMP.dirt[2]); // chair glyph
  });
  outline(g, RAMP.void);
  return g;
}
function drawMenagerie() {
  const g = makeGrid(144, 152);
  const s = houseShell(g, {
    wall: RAMP.dirt,
    mat: 'timber',
    roofRamp: RAMP.water,
    fh: 56,
    fw: 62,
    seed: 61
  });
  // door + lit window
  door(g, s.cx, s.ybot, 11, 22, RAMP.dirt);
  litWindow(g, s.cx - 18, s.ytop + 30, 7, 7, {
    noCross: true
  });
  // cages built onto facade
  function cage(x, y, w, h, content) {
    for (let i = -1; i <= w; i++) {
      P(g, x + i, y - 1, RAMP.stone[3]);
      P(g, x + i, y + h, RAMP.stone[3]);
    }
    for (let j = -1; j <= h; j++) {
      P(g, x - 1, y + j, RAMP.stone[3]);
      P(g, x + w, y + j, RAMP.stone[3]);
    }
    for (let i = 0; i < w; i += 2) for (let j = 0; j < h; j++) P(g, x + i, y + j, RAMP.stone[2]); // bars
    content(x, y, w, h);
  }
  // glowing wisp in a cage (left)
  cage(s.x0 + 4, s.ytop + 16, 10, 12, (x, y, w, h) => {
    const wx = x + 5,
      wy = y + 7;
    P(g, wx, wy, RAMP.drift[0]);
    P(g, wx - 1, wy, RAMP.drift[1]);
    P(g, wx + 1, wy, RAMP.drift[1]);
    P(g, wx, wy - 1, RAMP.drift[1]);
    P(g, wx, wy + 1, RAMP.drift[2]);
    for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy) % 2 === 0) P(g, wx + xx, wy + yy, RAMP.drift[2]);
  });
  // empty perch cage (right)
  cage(s.x1 - 14, s.ytop + 18, 10, 12, (x, y, w, h) => {
    for (let i = 2; i < w - 2; i++) P(g, x + i, y + h - 3, RAMP.dirt[3]); // perch
    P(g, x + 4, y + h - 4, RAMP.gold[2]); // seed
  });
  // perched black bird on the roofline (clear silhouette)
  const bx = s.cx + 2,
    by = s.ytop - s.roofH - 4;
  fillRect(g, bx, by + 1, 5, 3, RAMP.void); // body
  fillRect(g, bx + 5, by + 2, 3, 1, RAMP.void); // tail
  P(g, bx + 1, by, RAMP.void);
  P(g, bx + 1, by - 1, RAMP.void); // raised head
  P(g, bx + 2, by - 1, RAMP.void);
  P(g, bx, by, RAMP.drift[1]); // drift eye glint
  P(g, bx + 1, by + 4, RAMP.gold[2]);
  P(g, bx + 3, by + 4, RAMP.gold[2]); // legs
  for (let k = 0; k < 3; k++) P(g, bx + 5 + k, by + 1 - k, RAMP.void); // tail upsweep
  // drift-purple accents on eaves
  for (let x = s.x0 - 3; x <= s.x1 + 3; x += 5) P(g, x, s.ytop + 1, RAMP.drift[2]);
  // sign (paw/feather glyph)
  hangingSign(g, s.x1 + 2, s.ytop + 30, 11, 8, RAMP.water, (gg, x, y, w, h) => {
    P(gg, x + 5, y + 2, RAMP.bone[1]);
    P(gg, x + 4, y + 4, RAMP.bone[1]);
    P(gg, x + 6, y + 4, RAMP.bone[1]);
    P(gg, x + 5, y + 5, RAMP.bone[2]);
  });
  outline(g, RAMP.void);
  return g;
}

// ---- SHRINE (not a house): stepped dais + cracked altar + Pale Flame (3 frames)
function drawShrine(frame) {
  frame = frame || 0;
  const g = makeGrid(112, 128);
  const cx = 56,
    baseY = 116;
  // scorch marks on ground
  for (let i = 0; i < 26; i++) {
    const a = rnd2(i, frame, 19);
    const x = cx - 30 + Math.floor(rnd2(i, 1, 19) * 60);
    const y = baseY + 2 + Math.floor(rnd2(i, 2, 19) * 6);
    if (a < 0.5) P(g, x, y, RAMP.void);else if (a < 0.7) P(g, x, y, RAMP.ash);
  }
  // stepped stone dais (3 tiers, iso)
  for (let t = 0; t < 3; t++) {
    const hw = 38 - t * 8,
      ty = baseY - t * 8,
      hh = Math.round(hw / 2);
    for (let dy = -hh; dy <= hh; dy++) {
      const k = 1 - Math.abs(dy) / hh,
        w = Math.round(hw * k);
      for (let dx = -w; dx <= w; dx++) {
        let c = RAMP.stone[1];
        if (dy < 0 && dx < 0) c = RAMP.stone[0];else if (dy > 0) c = RAMP.stone[2];
        if (rnd2(cx + dx, ty + dy, 20) < 0.05) c = RAMP.stone[2];
        P(g, cx + dx, ty + dy, c);
      }
    }
    for (let dx = -hw; dx <= hw; dx++) {
      const k = 1 - Math.abs(dx) / hw;
      const ey = ty + Math.round(hh * k);
      for (let s2 = 1; s2 <= 4; s2++) P(g, cx + dx, ey + s2, s2 < 3 ? RAMP.stone[2] : RAMP.stone[3]);
    }
  }
  // cracked altar block
  const ay = baseY - 30;
  for (let j = 0; j < 12; j++) for (let i = -10; i <= 10; i++) {
    let c = RAMP.stone[1];
    if (i < -7) c = RAMP.stone[0];
    if (i > 7) c = RAMP.stone[2];
    if (j === 0) c = RAMP.stone[0];
    if (j > 9) c = RAMP.stone[3];
    P(g, cx + i, ay + j, c);
  }
  // crack
  for (let j = 0; j < 12; j++) P(g, cx + 2 + Math.round(Math.sin(j) * 1.5), ay + j, RAMP.stone[3]);
  // votive candles
  [[cx - 14, baseY - 16], [cx + 14, baseY - 16], [cx - 20, baseY - 6], [cx + 20, baseY - 6]].forEach(([vx, vy], i) => {
    P(g, vx, vy, RAMP.bone[1]);
    P(g, vx, vy + 1, RAMP.bone[2]);
    P(g, vx, vy - 1, RAMP.ember[(frame + i) % 2 ? 1 : 0]);
  });
  // THE PALE FLAME — bone-white fire, drift-purple core, flicker per frame
  const fx = cx,
    fy = ay - 2;
  const sway = [0, 1, -1][frame],
    tall = [0, 1, 2][frame];
  // outer bone flame
  for (let yy = 0; yy <= 14 + tall; yy++) {
    const t = yy / (14 + tall);
    const hw = Math.round((1 - t) * 6 * (1 - t * 0.2)) + (yy < 3 ? 1 : 0);
    const sx = fx + Math.round(Math.sin(yy * 0.5 + frame) * 1.2) + Math.round(sway * t * 2);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = RAMP.bone[0];
      if (Math.abs(xx) >= hw - 1) c = RAMP.bone[1];
      if (Math.abs(xx) >= hw) c = RAMP.drift[1];
      P(g, sx + xx, fy - yy, c);
    }
  }
  // drift-purple core
  for (let yy = 1; yy <= 8 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (9 + tall)) * 3));
    const sx = fx + Math.round(sway * (yy / 10));
    for (let xx = -hw; xx <= hw; xx++) P(g, sx + xx, fy - yy - 1, Math.abs(xx) === 0 ? RAMP.drift[0] : RAMP.drift[2]);
  }
  // rising mote sparks
  for (let i = 0; i < 4; i++) {
    const a = (frame + i) % 3;
    if (a < 2) P(g, fx - 3 + i * 2, fy - 14 - i * 2 - tall, i % 2 ? RAMP.drift[1] : RAMP.bone[0]);
  }
  // pale glow halo (dither)
  for (let yy = -12; yy <= 4; yy++) for (let xx = -10; xx <= 10; xx++) {
    const d = Math.abs(xx) + Math.abs(yy * 1.3);
    if (d > 8 && d < 12 && (xx + yy + frame) % 2 === 0) P(g, fx + xx, fy - 6 + yy, RAMP.drift[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// ---- THE PIT (not a house): flat arena ring, center-anchored, drawn UNDER entities
function drawPit() {
  const g = makeGrid(240, 120);
  const cx = 120,
    cy = 60,
    RX = 108,
    RY = 54;
  // packed-sand floor (iso ellipse)
  for (let y = -RY; y <= RY; y++) for (let x = -RX; x <= RX; x++) {
    const d = (x / RX) ** 2 + (y / RY) ** 2;
    if (d > 1) continue;
    let c = RAMP.dirt[1];
    if (d > 0.82) c = RAMP.dirt[3]; // worn rim
    else if (d > 0.6) c = RAMP.dirt[2];
    if (rnd2(cx + x, cy + y, 22) < 0.05) c = RAMP.dirt[2];
    if (rnd2(cx + x, cy + y, 23) < 0.02) c = RAMP.dirt[0];
    P(g, cx + x, cy + y, c);
  }
  // old bloodstains
  for (let i = 0; i < 7; i++) {
    const bx = cx + Math.floor((rnd2(i, 1, 24) - 0.5) * RX * 1.2);
    const by = cy + Math.floor((rnd2(i, 2, 24) - 0.5) * RY * 1.2);
    if ((bx - cx) ** 2 / RX ** 2 + (by - cy) ** 2 / RY ** 2 > 0.7) continue;
    for (let yy = -3; yy <= 3; yy++) for (let xx = -4; xx <= 4; xx++) {
      if (rnd2(bx + xx, by + yy, 25) < 0.45 && xx * xx + yy * yy < 14) P(g, bx + xx, by + yy, RAMP.blood[3]);
    }
  }
  // ten weathered standing stones around the rim, drift-touched tips
  const N = 10;
  for (let i = 0; i < N; i++) {
    const ang = i / N * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(ang) * RX * 0.96);
    const sy = Math.round(cy + Math.sin(ang) * RY * 0.96);
    const h = 16 + Math.floor(rnd2(i, 3, 26) * 8);
    const w = 4 + Math.floor(rnd2(i, 4, 26) * 2);
    for (let j = 0; j < h; j++) for (let k = -w; k <= w; k++) {
      const t = j / h;
      const ww = Math.round(w * (1 - t * 0.3));
      if (Math.abs(k) > ww) continue;
      let c = RAMP.stone[1];
      if (k < -ww + 1) c = RAMP.stone[0];
      if (k > ww - 1) c = RAMP.stone[3];
      if (rnd2(sx + k, sy - j, 27) < 0.08) c = RAMP.stone[2];
      P(g, sx + k, sy - j, c);
    }
    // drift-touched tip
    for (let k = -w + 1; k <= w - 1; k++) P(g, sx + k, sy - h, RAMP.drift[2]);
    P(g, sx, sy - h - 1, RAMP.drift[1]);
    if (i % 2) P(g, sx, sy - h - 2, RAMP.drift[0]);
    // base shadow
    for (let k = -w - 1; k <= w + 1; k++) P(g, sx + k, sy + 1, RAMP.void);
    // half-buried skull at some rims
    if (i % 3 === 0) {
      const kx = sx + 5,
        ky = sy + 2;
      fillRect(g, kx, ky, 4, 3, RAMP.bone[1]);
      P(g, kx + 1, ky + 1, RAMP.void);
      P(g, kx + 3, ky + 1, RAMP.void);
      P(g, kx + 1, ky + 3, RAMP.bone[2]);
    }
  }
  // sagging rope/chain between some stones
  for (let i = 0; i < N; i++) {
    if (i % 2) continue;
    const a0 = i / N * Math.PI * 2,
      a1 = (i + 1) / N * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * RX * 0.96,
      y0 = cy + Math.sin(a0) * RY * 0.96;
    const x1 = cx + Math.cos(a1) * RX * 0.96,
      y1 = cy + Math.sin(a1) * RY * 0.96;
    for (let t = 0; t <= 1; t += 0.06) {
      const x = Math.round(x0 + (x1 - x0) * t);
      const sag = Math.sin(t * Math.PI) * 5;
      const y = Math.round(y0 + (y1 - y0) * t - 14 + sag);
      P(g, x, y, RAMP.dirt[3]);
      if (Math.floor(t * 16) % 2 === 0) P(g, x, y, RAMP.stone[3]);
    }
  }
  outline(g, RAMP.void);
  return g;
}
const TOWN = {
  dyeworks: {
    fn: drawDyeworks,
    cell: [144, 152],
    anchor: [72, 151]
  },
  vault: {
    fn: drawVault,
    cell: [144, 152],
    anchor: [72, 151]
  },
  casino: {
    fn: drawCasino,
    cell: [144, 152],
    anchor: [72, 151]
  },
  tavern: {
    fn: drawTavern,
    cell: [144, 152],
    anchor: [72, 151]
  },
  furnisher: {
    fn: drawFurnisher,
    cell: [144, 152],
    anchor: [72, 151]
  },
  menagerie: {
    fn: drawMenagerie,
    cell: [144, 152],
    anchor: [72, 151]
  },
  shrine: {
    fn: drawShrine,
    cell: [112, 128],
    anchor: [56, 127],
    frames: 3
  },
  pit: {
    fn: drawPit,
    cell: [240, 120],
    anchor: [120, 60],
    under: true
  }
};
Object.assign(globalThis, {
  rnd2,
  foundation,
  frontWall,
  rightWall,
  gableRoof,
  litWindow,
  door,
  hangingSign,
  smoke,
  moss,
  houseShell,
  drawDyeworks,
  drawVault,
  drawCasino,
  drawTavern,
  drawFurnisher,
  drawMenagerie,
  drawShrine,
  drawPit,
  TOWN
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/town.js", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Badge
   Pixel chip for statuses, counts, rarity & the seasonal "Drift"
   marker. variant="season" is the ornate HUD season badge; the rest
   are compact inline tags. */

const TONES = {
  corrupt: {
    fg: 'var(--drift-core)',
    bg: 'var(--corrupt-32)',
    edge: 'var(--corrupt-55)'
  },
  gold: {
    fg: '#1a130a',
    bg: 'var(--drift-gold)',
    edge: 'var(--gold-hi)'
  },
  success: {
    fg: '#dff1df',
    bg: 'var(--moss-24)',
    edge: 'var(--drift-moss)'
  },
  warning: {
    fg: '#241a05',
    bg: 'var(--drift-ember)',
    edge: 'var(--ember-hi)'
  },
  danger: {
    fg: '#ffe7e7',
    bg: 'var(--blood-24)',
    edge: 'var(--drift-blood)'
  },
  neutral: {
    fg: 'var(--text-secondary)',
    bg: 'var(--surface-well)',
    edge: 'var(--bone-14)'
  }
};
function Badge({
  children,
  tone = 'corrupt',
  icon = null,
  className = '',
  style = {},
  ...rest
}) {
  const t = TONES[tone] || TONES.corrupt;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: `var(--weight-regular) var(--text-2xs)/1 var(--font-pixel)`,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: t.fg,
      background: t.bg,
      padding: '4px 8px',
      boxShadow: `0 0 0 1px ${t.edge}`,
      clipPath: 'polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))',
      ...style
    }
  }, rest), icon, children);
}

/* The HUD "season" badge — number + name, corruption-styled. */
function SeasonBadge({
  season = 3,
  name = 'Ashfall',
  driftPct = 42,
  className = '',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `drift-panel ${className}`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 12px 7px 8px',
      boxShadow: 'var(--frame-shadow)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 34,
      padding: '3px 6px',
      background: 'var(--corrupt-32)',
      boxShadow: '0 0 0 1px var(--corrupt-55)',
      clipPath: 'polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 8px/1 var(--font-pixel)',
      letterSpacing: '.1em',
      color: 'var(--bone-72)'
    }
  }, "S"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 17px/1 var(--font-display)',
      color: 'var(--drift-core)'
    }
  }, String(season).padStart(2, '0'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "drift-heading",
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-primary)',
      lineHeight: 1
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: '400 9px/1 var(--font-pixel)',
      letterSpacing: '.06em',
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      background: 'var(--drift-corrupt)',
      boxShadow: 'var(--glow-corrupt-sm)'
    }
  }), "Drift ", driftPct, "%")));
}
Object.assign(__ds_scope, { Badge, SeasonBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Button
   Pixel button: hard bevel + hard drop shadow that presses down on
   :active (chrome in styles.css → .drift-pixel-btn). Variants tie to
   the palette; React only sets the --btn-* vars + size + content. */

const VARIANTS = {
  primary: {
    '--btn-bg': 'var(--drift-corrupt-dim)',
    '--btn-bg-hi': 'var(--drift-corrupt)',
    '--btn-fg': '#f6efff',
    '--btn-edge': 'var(--drift-corrupt)'
  },
  gold: {
    '--btn-bg': 'var(--gold-lo)',
    '--btn-bg-hi': 'var(--drift-gold)',
    '--btn-fg': '#1a130a',
    '--btn-edge': 'var(--gold-hi)'
  },
  ghost: {
    '--btn-bg': 'var(--surface-frame)',
    '--btn-bg-hi': 'var(--ui-100)',
    '--btn-fg': 'var(--text-primary)',
    '--btn-edge': 'var(--corrupt-32)'
  },
  danger: {
    '--btn-bg': 'var(--blood-lo)',
    '--btn-bg-hi': 'var(--drift-blood)',
    '--btn-fg': '#fff',
    '--btn-edge': 'var(--blood-hi)'
  }
};
const SIZES = {
  sm: {
    minHeight: 32,
    padding: '6px 10px',
    fontSize: 'var(--text-xs)'
  },
  md: {
    minHeight: 40,
    padding: '9px 14px',
    fontSize: 'var(--text-sm)'
  },
  lg: {
    minHeight: 48,
    padding: '12px 18px',
    fontSize: 'var(--text-md)'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  className = '',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    className: `drift-pixel-btn ${className}`,
    style: {
      ...(VARIANTS[variant] || VARIANTS.primary),
      ...(SIZES[size] || SIZES.md),
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : undefined,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Panel
   The canonical pixel HUD frame: notched corners, hard bevel, a thin
   corruption-purple edge, semi-transparent fill, purple corner pips.
   Composes into every HUD surface (inventory, log, skills). */

function Panel({
  title,
  kicker,
  accessory,
  corners = true,
  glow = false,
  padded = true,
  as: Tag = 'section',
  className = '',
  style = {},
  children,
  ...rest
}) {
  const pip = pos => /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      width: 3,
      height: 3,
      background: 'var(--drift-corrupt)',
      boxShadow: '0 0 0 1px var(--corrupt-32)',
      ...pos,
      pointerEvents: 'none'
    }
  });
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `drift-panel ${className}`,
    style: {
      boxShadow: glow ? 'var(--frame-shadow), 0 0 0 3px var(--corrupt-16)' : 'var(--frame-shadow)',
      ...style
    }
  }, rest), corners && /*#__PURE__*/React.createElement(React.Fragment, null, pip({
    left: 2,
    top: 2
  }), pip({
    right: 2,
    top: 2
  }), pip({
    left: 2,
    bottom: 2
  }), pip({
    right: 2,
    bottom: 2
  })), (title || kicker || accessory) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      padding: padded ? '10px 14px 8px' : '10px 12px 8px',
      borderBottom: '1px solid var(--bone-14)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, kicker && /*#__PURE__*/React.createElement("span", {
    className: "drift-label",
    style: {
      color: 'var(--text-muted)'
    }
  }, kicker), title && /*#__PURE__*/React.createElement("span", {
    className: "drift-heading",
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-primary)'
    }
  }, title)), accessory), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padded ? '12px 14px' : 0
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/game/ActivityLog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — ActivityLog
   The scrolling HUD feed: gathers, level-ups, loot, Drift events.
   Pass `entries` newest-first; each = { kind, text, meta }. kind tints
   the bullet + accent: loot/xp/info/warning/danger/drift. */

const KINDS = {
  xp: {
    dot: 'var(--drift-corrupt)',
    accent: 'var(--drift-corrupt)'
  },
  loot: {
    dot: 'var(--drift-gold)',
    accent: 'var(--drift-gold)'
  },
  info: {
    dot: 'var(--bone-45)',
    accent: 'var(--text-secondary)'
  },
  warning: {
    dot: 'var(--drift-ember)',
    accent: 'var(--drift-ember)'
  },
  danger: {
    dot: 'var(--drift-blood)',
    accent: 'var(--drift-blood)'
  },
  drift: {
    dot: 'var(--drift-core)',
    accent: 'var(--drift-hi)'
  }
};
function ActivityLog({
  entries = [],
  max = 6,
  className = '',
  style = {},
  ...rest
}) {
  const rows = entries.slice(0, max);
  return /*#__PURE__*/React.createElement("ul", _extends({
    className: className,
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, rest), rows.map((e, i) => {
    const k = KINDS[e.kind] || KINDS.info;
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        opacity: 1 - i * 0.085
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        flex: 'none',
        width: 5,
        height: 5,
        marginTop: 1,
        background: k.dot,
        boxShadow: e.kind === 'drift' || e.kind === 'xp' ? 'var(--glow-corrupt-sm)' : 'none'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: '400 13px/1.35 var(--font-ui)',
        color: 'var(--text-secondary)',
        textShadow: 'var(--text-shadow-hud)'
      }
    }, e.text, e.meta && /*#__PURE__*/React.createElement("span", {
      className: "drift-num",
      style: {
        color: k.accent,
        fontWeight: 600,
        marginLeft: 6
      }
    }, e.meta)));
  }));
}
Object.assign(__ds_scope, { ActivityLog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ActivityLog.jsx", error: String((e && e.message) || e) }); }

// components/game/Slot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Slot
   Inventory / hotbar cell. Pixel well with a hard inset bevel; a
   rarity edge, a stack count, an optional keybind cap, and the Drift
   selection glow. Pass `icon` as a node (e.g. <Icon name="axe" />). */

const RARITY = {
  common: 'var(--bone-14)',
  uncommon: 'var(--drift-moss)',
  rare: 'var(--water-hi)',
  epic: 'var(--drift-corrupt)',
  legendary: 'var(--drift-gold)'
};
function Slot({
  icon = null,
  count = null,
  keybind = null,
  rarity = null,
  selected = false,
  disabled = false,
  size = 52,
  onClick,
  title,
  className = '',
  style = {},
  ...rest
}) {
  const edge = rarity ? RARITY[rarity] : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: disabled ? undefined : onClick,
    title: title,
    className: className,
    style: {
      position: 'relative',
      width: size,
      height: size,
      padding: 0,
      border: 0,
      background: 'var(--surface-well)',
      cursor: disabled ? 'default' : 'pointer',
      imageRendering: 'pixelated',
      boxShadow: selected ? 'var(--bevel-slot), 0 0 0 1px var(--drift-core), 0 0 0 2px var(--drift-corrupt), 0 0 0 4px var(--corrupt-16)' : edge ? `var(--bevel-slot), inset 0 0 0 1px ${edge}` : 'var(--bevel-slot)',
      transition: 'box-shadow var(--dur-fast) steps(2)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, icon), keybind != null && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: 3,
      font: '400 9px/1 var(--font-pixel)',
      color: 'var(--bone-45)'
    }
  }, keybind), count != null && /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      position: 'absolute',
      right: 3,
      bottom: 2,
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      textShadow: 'var(--text-shadow-hud)'
    }
  }, count));
}
Object.assign(__ds_scope, { Slot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Slot.jsx", error: String((e && e.message) || e) }); }

// components/game/Hotbar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Hotbar
   The 6-slot action bar (keys 1–6). Pass `slots` as an array of up to
   6 items ({ icon, count, rarity }); `selected` is the active index.
   Empty positions render as quiet wells. */

function Hotbar({
  slots = [],
  selected = 0,
  onSelect,
  size = 52,
  className = '',
  style = {},
  ...rest
}) {
  const cells = Array.from({
    length: 6
  }, (_, i) => slots[i] || null);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      display: 'flex',
      gap: 'var(--slot-gap)',
      ...style
    },
    role: "toolbar",
    "aria-label": "Hotbar"
  }, rest), cells.map((item, i) => /*#__PURE__*/React.createElement(__ds_scope.Slot, {
    key: i,
    size: size,
    keybind: i + 1,
    icon: item ? item.icon : null,
    count: item ? item.count : null,
    rarity: item ? item.rarity : null,
    selected: i === selected,
    title: item ? item.name : `Slot ${i + 1}`,
    onClick: () => onSelect && onSelect(i)
  })));
}
Object.assign(__ds_scope, { Hotbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Hotbar.jsx", error: String((e && e.message) || e) }); }

// components/game/XPBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — XPBar
   A skill progress row: icon + name on the left, level chip on the
   right, a pixel track with a stepped corruption fill, and the
   value/next readout. `color` tints the fill per skill. */

function XPBar({
  skill = 'Woodcutting',
  level = 1,
  value = 0,
  max = 100,
  color = 'var(--drift-corrupt)',
  icon = null,
  showNumbers = true,
  className = '',
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, icon, /*#__PURE__*/React.createElement("span", {
    className: "drift-label",
    style: {
      color: 'var(--text-secondary)',
      flex: 1
    }
  }, skill), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      background: 'var(--surface-well)',
      boxShadow: 'var(--bevel-slot)',
      padding: '2px 6px',
      whiteSpace: 'nowrap'
    }
  }, "Lv ", level)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 'var(--xpbar-height)',
      background: 'var(--surface-well)',
      boxShadow: 'var(--bevel-slot)',
      overflow: 'hidden',
      imageRendering: 'pixelated'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${pct}%`,
      background: `linear-gradient(180deg, ${color} 0%, ${color} 55%, rgba(10,8,16,.25) 55%, rgba(10,8,16,.25) 100%)`,
      boxShadow: `0 0 0 1px rgba(10,8,16,.4), 0 0 6px ${color}`,
      transition: 'width var(--dur-slow) steps(8)'
    }
  })), showNumbers && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, value.toLocaleString(), " / ", max.toLocaleString(), " XP"), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '10px',
      color
    }
  }, Math.round(pct), "%")));
}
Object.assign(__ds_scope, { XPBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/XPBar.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ============================================================
   DriftLands PIXEL ICONS
   Each icon is a 16×16 grid of chars; every char maps to a palette
   entry below and renders as one 1×1 <rect> with crisp edges. Tune
   pixels by editing the grids — keep the 'k' outline + 2–3 shade
   ramp per material so icons match sprites & tiles.
   ============================================================ */

const PAL = {
  '.': null,
  // transparent
  k: '#0a0810',
  // outline / void
  // bone / steel-light
  L: '#d8cfe0',
  o: '#a99fb8',
  h: '#efe9f4',
  // steel / stone
  S: '#9b94ab',
  C: '#4a4360',
  s: '#6f6781',
  z: '#3a3350',
  c: '#322b46',
  // wood
  W: '#7a6048',
  w: '#50402e',
  x: '#36291c',
  // gold
  G: '#f6e0a6',
  g: '#e7c873',
  y: '#b8943f',
  // ember
  E: '#fcd34d',
  e: '#f59e0b',
  // drift purple
  P: '#f3e8ff',
  p: '#a855f7',
  u: '#6b21a8',
  v: '#3b1162',
  // blood
  R: '#ef4444',
  r: '#dc2626',
  // moss / leaf
  M: '#7fae5e',
  m: '#4d7c4d',
  n: '#356037',
  // water / fish
  B: '#4a7fa0',
  b: '#2c5775'
};
const GRID = 16;
const ICONS = {
  /* ---------------- 6 TOOLS ---------------- */
  axe: ['................', '......kkkkkk....', '.....kSShhhSzk..', '....kSSSSSShSzk.', '....kSSSSSSSSzk.', '....kzSSSSSSzk..', '.....kkzSSzkk...', '......kwwk......', '......kWwk......', '......kwWk......', '......kWwk......', '......kwWk......', '......kWwk......', '......kwWkk.....', '.......kkk......', '................'],
  pickaxe: ['................', '..kk........kk..', '.kssk......kssk.', 'kSsszk....kzssSk', 'kSsszkk..kkzssSk', '.kzsssk..ksssszk', '..kkzsssssszkk..', '.....kkwwkk.....', '......kWwk......', '......kwWk......', '......kxwk......', '......kWwk......', '......kwxk......', '......kWwk......', '......kxwkk.....', '.......kk.......'],
  rod: ['............kkk.', '...........kWWk.', '..........kWzk..', '.........kWzk...', '........kWzk....', '.......kWzk.....', '......kWzk..k...', '.....kWzk...k...', '....kWzk....k...', '...kWzk.....k...', '..kWzk....kBBk..', '..kWk.....kPBk..', '.kWk......kbbk..', '.kk........kk...', '................', '................'],
  sword: ['.......k........', '......kLk.......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '.....kzzLLk.....', '...kkkkkkkkkk...', '...kygggggyk...', '....kkkwwkk.....', '......kwwk......', '......kwwk......', '.....kgGGgk.....', '......kkkk......'],
  ward: ['...kkkkkkkkk....', '..kCsssssssCk...', '..kCsuuuuusCk...', '..kCsuPPpusCk...', '..kCsupPpusCk...', '..kCsuppppsCk...', '..kCsssssssCk...', '..kCsssssssCk...', '...kCsssssCk....', '...kCsssssCk....', '....kCsssCk.....', '....kCsssCk.....', '.....kCsCk......', '.....kCsCk......', '......kkk.......', '................'],
  sigil: ['......kkkk......', '....kkuuuukk....', '...kuppppppuk...', '..kupppPppppuk..', '..kuppPPPpppuk..', '.kuppPPpPPpppuk.', '.kupppPPPppppuk.', '.kuppPPpPPpppuk.', '..kpppPPPpppuk..', '..kupppPppppuk..', '...kuppppppuk...', '....kkuuuukk....', '......kkkk......', '................', '................', '................'],
  /* ---------------- RESOURCES ---------------- */
  log: ['................', '...kkkkkkkkk....', '..kWWWWWWWWWk...', '.kWWxoxWWWWWk...', '.kWxoxoxWWWWk...', '.kWWxoxWWWWWk...', '..kWWWWWWWWWk...', '...kkkkkkkkk....', '...kkkkkkkkk....', '..kwwwwwwwwwk...', '.kwwxoxwwwwwk...', '.kwxoxoxwwwwk...', '.kwwxoxwwwwwk...', '..kwwwwwwwwwk...', '...kkkkkkkkk....', '................'],
  ore: ['................', '......kkkk......', '....kkCCCCkk....', '...kCCsssCCk....', '..kCsgssssgCk...', '..kCsssgsssCk...', '.kcsgssssgsck...', '.kcssgsssscck...', '..kcssgsssck....', '..kccssssgck....', '...kccsssck.....', '....kcccck......', '.....kkkk.......', '................', '................', '................'],
  fish: ['................', '................', '....kkkk....kk..', '..kkBBBBkk.kBk..', '.kBBBBBBBBkBBk..', 'kBBbbkBBBBBBBk..', 'kBkLBBBBBBBBBk..', 'kBBbbkBBBBBBk...', '.kBBBBBBBBkBBk..', '..kkBBBBkk.kBk..', '....kkkk....kk..', '................', '................', '................', '................', '................'],
  coin: ['................', '.....kkkkk......', '...kkgggggkk....', '..kgGGGGGGgk....', '..kgGyppyGgk....', '.kgGyppppyGgk...', '.kgGyppPppyGk...', '.kgGyppppyGgk...', '..kgGyppyGgk....', '..kgGGGGGGgk....', '...kkgggggkk....', '.....kkkkk......', '................', '................', '................', '................'],
  drift: ['................', '.......k........', '......kPk.......', '......kPk.......', '.....kpPpk......', '....kppPppk.....', '.kk.kppPppk.kk..', 'kPppppPPPpppPk..', '.kk.kppPppk.kk..', '....kppPppk.....', '.....kpPpk......', '......kPk.......', '......kPk.......', '.......k........', '................', '................'],
  /* ---------------- HUD ---------------- */
  heart: ['................', '..kkk....kkk....', '.kRRRkk.kRRRk...', 'kRRRRRkkRRRRRk..', 'kRRRRRRRRRRRRk..', 'kRRRRRRRRRRRRk..', 'kRRRRRRRRRRRRk..', '.kRRRRRRRRRRk...', '..kRRRRRRRRk....', '...kRRRRRRk.....', '....kRRRRk......', '.....kRRk.......', '......kk........', '................', '................', '................'],
  leaf: ['................', '.............kk.', '..........kkMMk.', '........kkMMMnk.', '......kkMMMMnk..', '.....kMMMMMnk...', '....kMMMMnnk....', '...kMMMnnk......', '..kMMnnk.k......', '..kMnnk.kn......', '.kMnnk.kn.......', '.knnk.kn........', '.kkk.kn.........', '....kn..........', '...kk...........', '................'],
  bag: ['................', '.....kkkk.......', '....kk..kk......', '....k....k......', '...kkkkkkkk.....', '..kWwwwwwwWk....', '..kwwwwwwwwk....', '..kwwwggwwwk....', '..kwwwggwwwk....', '..kwwwwwwwwk....', '..kwwwwwwwwk....', '...kwwwwwwk.....', '....kkkkkk......', '................', '................', '................'],
  bolt: ['................', '........kk......', '.......kEk......', '......kEek......', '.....kEek.......', '....kEek........', '...kEekkk.......', '..kEeEEEk.......', '..kkkkEek.......', '.....kEek.......', '....kEek........', '...kEek.........', '..kEek..........', '..kek...........', '..kk............', '................'],
  chevronRight: ['................', '.....k..........', '.....kk.........', '.....kLk........', '......kLk.......', '.......kLk......', '........kLk.....', '........kLk.....', '.......kLk......', '......kLk.......', '.....kLk........', '.....kk.........', '.....k..........', '................', '................', '................'],
  x: ['................', '..kk......kk....', '..kLk....kLk....', '...kLk..kLk.....', '....kLkkLk......', '.....kLLk.......', '.....kLLk.......', '....kLkkLk......', '...kLk..kLk.....', '..kLk....kLk....', '..kk......kk....', '................', '................', '................', '................', '................']
};
const ICON_NAMES = Object.keys(ICONS);
const TOOL_NAMES = ['axe', 'pickaxe', 'rod', 'sword', 'ward', 'sigil'];
function Icon({
  name,
  size = 32,
  glow = false,
  style = {},
  className = '',
  ...rest
}) {
  const grid = ICONS[name] || [];
  const rects = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const fill = PAL[row[x]];
      if (fill) rects.push(/*#__PURE__*/React.createElement("rect", {
        key: `${x}-${y}`,
        x: x,
        y: y,
        width: 1,
        height: 1,
        fill: fill
      }));
    }
  }
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: `0 0 ${GRID} ${GRID}`,
    shapeRendering: "crispEdges",
    className: className,
    style: {
      display: 'block',
      flex: 'none',
      imageRendering: 'pixelated',
      filter: glow ? 'drop-shadow(0 0 0.5px #a855f7) drop-shadow(0 0 2px rgba(168,85,247,0.8))' : undefined,
      ...style
    },
    "aria-hidden": "true"
  }, rest), rects);
}
Object.assign(__ds_scope, { ICON_NAMES, TOOL_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hud/Hud.jsx
try { (() => {
/* DriftLands UI kit — the HUD overlay.
   Composes the design-system components (Panel, Hotbar, XPBar, Slot,
   ActivityLog, SeasonBadge, Button, Icon) into the full in-game HUD,
   sitting over the canvas world. Light interactivity: pick a tool,
   gather → XP + loot + log. */

const NS = window.DriftLandsDesignSystem_3de3e2 || window[Object.keys(window).find(k => k.startsWith('DriftLandsDesignSystem'))];
const {
  Panel,
  Button,
  Badge,
  SeasonBadge,
  Slot,
  Hotbar,
  XPBar,
  ActivityLog,
  Icon
} = NS;
const TOOLS = [{
  name: 'Axe',
  icon: 'axe',
  skill: 'Woodcutting',
  loot: 'Ashen log',
  lootIcon: 'log',
  xp: 128
}, {
  name: 'Pickaxe',
  icon: 'pickaxe',
  skill: 'Mining',
  loot: 'Drift ore',
  lootIcon: 'ore',
  xp: 96
}, {
  name: 'Rod',
  icon: 'rod',
  skill: 'Fishing',
  loot: 'Pale carp',
  lootIcon: 'fish',
  xp: 74
}, {
  name: 'Sword',
  icon: 'sword',
  skill: null
}, {
  name: 'Ward',
  icon: 'ward',
  skill: null
}, {
  name: 'Sigil',
  icon: 'sigil',
  skill: null,
  rarity: 'epic'
}];
const SKILL_COLOR = {
  Woodcutting: 'var(--skill-woodcutting)',
  Mining: 'var(--skill-mining)',
  Fishing: 'var(--skill-fishing)'
};
const SKILL_ICON = {
  Woodcutting: 'axe',
  Mining: 'pickaxe',
  Fishing: 'rod'
};
function Vitals({
  hearts,
  shards
}) {
  return /*#__PURE__*/React.createElement(Panel, {
    padded: false,
    corners: false,
    style: {
      padding: '8px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement(Icon, {
    key: i,
    name: "heart",
    size: 16,
    style: {
      opacity: i < hearts ? 1 : 0.18
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coin",
    size: 16,
    glow: true
  }), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontWeight: 700,
      fontSize: 15,
      color: 'var(--drift-gold)',
      textShadow: 'var(--text-shadow-hud)'
    }
  }, shards.toLocaleString()))));
}
function HUD() {
  const [sel, setSel] = React.useState(0);
  const [xp, setXp] = React.useState({
    Woodcutting: {
      level: 42,
      value: 6280,
      max: 9000
    },
    Mining: {
      level: 31,
      value: 3400,
      max: 7200
    },
    Fishing: {
      level: 28,
      value: 5100,
      max: 6400
    }
  });
  const [shards, setShards] = React.useState(1284);
  const [log, setLog] = React.useState([{
    kind: 'drift',
    text: 'The Drift crept into Hollowmere.'
  }, {
    kind: 'info',
    text: 'A rock vein re-formed nearby.'
  }, {
    kind: 'loot',
    text: 'Ashen log',
    meta: 'x2'
  }]);
  const [bag, setBag] = React.useState([{
    icon: 'log',
    count: 64,
    rarity: 'common'
  }, {
    icon: 'ore',
    count: 18,
    rarity: 'rare'
  }, {
    icon: 'fish',
    count: 7,
    rarity: 'uncommon'
  }, {
    icon: 'coin',
    count: '1.2k',
    rarity: 'legendary'
  }]);
  const [progress, setProgress] = React.useState(null); // 0..1 while gathering
  const [floaters, setFloaters] = React.useState([]);
  const timer = React.useRef(null);
  const tool = TOOLS[sel];
  const canGather = !!tool.skill && progress === null;
  function gather() {
    if (!canGather) return;
    let p = 0;
    setProgress(0);
    timer.current = setInterval(() => {
      p += 0.04;
      if (p >= 1) {
        clearInterval(timer.current);
        setProgress(null);
        // rewards
        const t = TOOLS[sel];
        setXp(prev => {
          const s = {
            ...prev[t.skill]
          };
          s.value = Math.min(s.max, s.value + t.xp);
          if (s.value >= s.max) {
            s.level += 1;
            s.value = s.value - s.max;
          }
          return {
            ...prev,
            [t.skill]: s
          };
        });
        setShards(v => v + 12);
        const fid = Date.now();
        setFloaters(f => [...f, {
          id: fid,
          text: `+${t.xp} XP`,
          kind: 'xp'
        }, {
          id: fid + 1,
          text: '+12',
          kind: 'gold'
        }]);
        setTimeout(() => setFloaters(f => f.filter(x => x.id !== fid && x.id !== fid + 1)), 1100);
        setLog(l => [{
          kind: 'xp',
          text: t.skill,
          meta: `+${t.xp} XP`
        }, {
          kind: 'loot',
          text: t.loot,
          meta: 'x1'
        }, ...l].slice(0, 7));
        setBag(b => {
          const idx = b.findIndex(x => x.icon === t.lootIcon);
          if (idx >= 0) {
            const n = [...b];
            n[idx] = {
              ...n[idx],
              count: (parseInt(n[idx].count) || 0) + 1
            };
            return n;
          }
          return [...b, {
            icon: t.lootIcon,
            count: 1,
            rarity: 'common'
          }];
        });
      } else setProgress(p);
    }, 60);
  }
  React.useEffect(() => () => clearInterval(timer.current), []);
  const bagSlots = Array.from({
    length: 12
  }, (_, i) => bag[i] || null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        .hud-region { position: absolute; pointer-events: auto; }
        @keyframes floatUp { 0% { transform: translate(-50%,0); opacity: 1; } 100% { transform: translate(-50%,-46px); opacity: 0; } }
        .floater { position:absolute; left:50%; bottom:64px; transform:translateX(-50%); animation: floatUp 1.1s steps(10) forwards;
          font-family: var(--font-num); font-weight:700; font-size:16px; text-shadow: var(--text-shadow-hud); }
      `), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      top: 16,
      left: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(SeasonBadge, {
    season: 3,
    name: "Ashfall",
    driftPct: 42
  }), /*#__PURE__*/React.createElement(Vitals, {
    hearts: 4,
    shards: shards
  })), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      top: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Satchel",
    title: "Inventory",
    style: {
      width: 232
    },
    accessory: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, bag.length, "/24")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 'var(--slot-gap)'
    }
  }, bagSlots.map((it, i) => /*#__PURE__*/React.createElement(Slot, {
    key: i,
    size: 48,
    icon: it ? /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 30
    }) : null,
    count: it ? it.count : null,
    rarity: it ? it.rarity : null
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      left: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Skills",
    title: "Gathering",
    style: {
      width: 264
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13
    }
  }, ['Woodcutting', 'Mining', 'Fishing'].map(s => /*#__PURE__*/React.createElement(XPBar, {
    key: s,
    skill: s,
    level: xp[s].level,
    value: xp[s].value,
    max: xp[s].max,
    color: SKILL_COLOR[s],
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: SKILL_ICON[s],
      size: 16
    })
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Realm",
    title: "Activity",
    style: {
      width: 248
    }
  }, /*#__PURE__*/React.createElement(ActivityLog, {
    entries: log,
    max: 7
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 'calc(50% + 36px)',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none'
    }
  }, progress !== null && /*#__PURE__*/React.createElement("svg", {
    width: "64",
    height: "64",
    viewBox: "0 0 64 64",
    style: {
      filter: 'drop-shadow(0 0 4px rgba(168,85,247,.8))'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "26",
    fill: "none",
    stroke: "rgba(10,8,16,.7)",
    strokeWidth: "6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "26",
    fill: "none",
    stroke: "#a855f7",
    strokeWidth: "6",
    strokeDasharray: 2 * Math.PI * 26,
    strokeDashoffset: (1 - progress) * 2 * Math.PI * 26,
    transform: "rotate(-90 32 32)",
    strokeLinecap: "butt"
  })), floaters.map((f, i) => /*#__PURE__*/React.createElement("span", {
    key: f.id,
    className: "floater",
    style: {
      color: f.kind === 'gold' ? 'var(--drift-gold)' : 'var(--drift-corrupt)',
      left: `calc(50% + ${i % 2 ? 22 : -22}px)`
    }
  }, f.text))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: canGather ? 'primary' : 'ghost',
    size: "md",
    onClick: gather,
    disabled: !canGather,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: tool.icon,
      size: 16
    })
  }, progress !== null ? 'Gathering…' : tool.skill ? `${tool.skill}` : `${tool.name} equipped`), /*#__PURE__*/React.createElement(Hotbar, {
    selected: sel,
    onSelect: setSel,
    slots: TOOLS.map(t => ({
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: t.icon,
        size: 32
      }),
      name: t.name,
      rarity: t.rarity
    }))
  })));
}
window.HUD = HUD;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hud/Hud.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hud/Scene.jsx
try { (() => {
/* DriftLands UI kit — representative isometric world backdrop.
   NOT part of the design system: the real world is Canvas sprites
   handled by the engine. This is a stand-in so the HUD can be shown
   reading over a busy, moving scene. Iso 2:1, tiles 64×32. */

function IsoScene({
  driftPct = 42
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    let raf,
      t = 0;
    const TW = 64,
      TH = 32; // tile diamond
    const COLS = 16,
      ROWS = 16;
    const PAL = {
      grass: ['#4d7c4d', '#356037', '#20402a'],
      dirt: ['#50402e', '#36291c', '#241a11'],
      stone: ['#322b46', '#211c30', '#14101e'],
      water: ['#2c5775', '#173a52', '#0d2336'],
      drift: ['#a855f7', '#6b21a8', '#3b1162']
    };
    // deterministic terrain map
    const map = [];
    for (let gy = 0; gy < ROWS; gy++) {
      const r = [];
      for (let gx = 0; gx < COLS; gx++) {
        const n = Math.sin(gx * 1.7) + Math.cos(gy * 1.3) + Math.sin((gx + gy) * 0.6);
        let type = 'grass';
        if (n < -1.3) type = 'water';else if (n < -0.5) type = 'dirt';else if (n > 1.4) type = 'stone';
        r.push({
          type,
          corrupt: gx + gy > (COLS + ROWS) * (1 - driftPct / 100) && Math.sin(gx * 2.1 + gy) > -0.2
        });
      }
      map.push(r);
    }
    // objects: trees/rocks at a few tiles
    const objs = [{
      gx: 3,
      gy: 5,
      kind: 'tree'
    }, {
      gx: 6,
      gy: 3,
      kind: 'tree'
    }, {
      gx: 10,
      gy: 6,
      kind: 'tree'
    }, {
      gx: 12,
      gy: 9,
      kind: 'rock'
    }, {
      gx: 4,
      gy: 10,
      kind: 'rock'
    }, {
      gx: 8,
      gy: 8,
      kind: 'player'
    }];
    function resize() {
      const r = cv.getBoundingClientRect();
      cv.width = r.width;
      cv.height = r.height;
    }
    resize();
    window.addEventListener('resize', resize);
    function isoX(gx, gy, ox) {
      return ox + (gx - gy) * (TW / 2);
    }
    function isoY(gx, gy, oy) {
      return oy + (gx + gy) * (TH / 2);
    }
    function diamond(cx, cy, fill, edge) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - TH / 2);
      ctx.lineTo(cx + TW / 2, cy);
      ctx.lineTo(cx, cy + TH / 2);
      ctx.lineTo(cx - TW / 2, cy);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (edge) {
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    function draw() {
      const W = cv.width,
        H = cv.height;
      // sky / void wash
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(0, 0, W, H);
      const ox = W / 2,
        oy = H / 2 - (COLS + ROWS) * TH / 4 + 40;

      // ground
      for (let gy = 0; gy < ROWS; gy++) {
        for (let gx = 0; gx < COLS; gx++) {
          const cell = map[gy][gx];
          const cx = isoX(gx, gy, ox),
            cy = isoY(gx, gy, oy);
          const ramp = PAL[cell.type];
          diamond(cx, cy, ramp[0], 'rgba(10,8,16,0.35)');
          // south shading lip
          ctx.fillStyle = ramp[1];
          ctx.beginPath();
          ctx.moveTo(cx - TW / 2, cy);
          ctx.lineTo(cx, cy + TH / 2);
          ctx.lineTo(cx, cy + TH / 2 + 3);
          ctx.lineTo(cx - TW / 2, cy + 3);
          ctx.closePath();
          ctx.fill();
          if (cell.type === 'water') {
            // shimmer
            const sh = (Math.sin(t / 22 + gx + gy) + 1) / 2;
            ctx.fillStyle = `rgba(120,180,210,${0.06 + sh * 0.10})`;
            diamond(cx, cy - 1, ctx.fillStyle, null);
          }
          if (cell.corrupt) {
            const pulse = 0.18 + (Math.sin(t / 30 + gx - gy) + 1) / 2 * 0.16;
            ctx.fillStyle = `rgba(168,85,247,${pulse})`;
            diamond(cx, cy, ctx.fillStyle, null);
          }
        }
      }

      // objects (depth sorted by gx+gy)
      [...objs].sort((a, b) => a.gx + a.gy - (b.gx + b.gy)).forEach(o => {
        const cx = isoX(o.gx, o.gy, ox),
          cy = isoY(o.gx, o.gy, oy);
        if (o.kind === 'tree') {
          ctx.fillStyle = '#241a11';
          ctx.fillRect(cx - 3, cy - 14, 6, 16); // trunk
          ctx.fillStyle = '#36291c';
          ctx.fillRect(cx - 1, cy - 14, 2, 16);
          ctx.fillStyle = '#356037';
          ctx.fillRect(cx - 12, cy - 40, 24, 28); // canopy
          ctx.fillStyle = '#4d7c4d';
          ctx.fillRect(cx - 12, cy - 40, 18, 22);
          ctx.fillStyle = '#7fae5e';
          ctx.fillRect(cx - 10, cy - 38, 8, 8);
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 12, cy - 41, 24, 1);
        } else if (o.kind === 'rock') {
          ctx.fillStyle = '#211c30';
          ctx.fillRect(cx - 12, cy - 14, 24, 14);
          ctx.fillStyle = '#322b46';
          ctx.fillRect(cx - 12, cy - 14, 18, 10);
          ctx.fillStyle = '#4a4360';
          ctx.fillRect(cx - 10, cy - 12, 6, 4);
          ctx.fillStyle = '#e7c873';
          ctx.fillRect(cx - 2, cy - 8, 3, 3); // ore fleck
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 12, cy - 15, 24, 1);
        } else if (o.kind === 'player') {
          // hooded wanderer
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 7, cy - 30, 14, 30);
          ctx.fillStyle = '#2a2438';
          ctx.fillRect(cx - 6, cy - 28, 12, 26); // cloak
          ctx.fillStyle = '#171320';
          ctx.fillRect(cx - 5, cy - 22, 10, 5); // hood shadow
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(cx - 3, cy - 21, 2, 2); // drift eyes
          ctx.fillStyle = '#d8b4fe';
          ctx.fillRect(cx + 1, cy - 21, 2, 2);
          ctx.fillStyle = '#6b21a8';
          ctx.fillRect(cx - 6, cy - 6, 12, 2); // drift hem glow
        }
      });

      // ambient drift motes + ash
      for (let i = 0; i < 26; i++) {
        const mx = (i * 97 + t * (0.3 + i % 3 * 0.2)) % W;
        const my = (i * 53 + Math.sin(t / 40 + i) * 18 + t * 0.15) % H;
        const drift = i % 4 === 0;
        ctx.fillStyle = drift ? 'rgba(168,85,247,0.8)' : 'rgba(216,207,224,0.25)';
        ctx.fillRect(W - mx, my, drift ? 2 : 1, drift ? 2 : 1);
      }
      t += 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [driftPct]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    className: "drift-pixel",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      imageRendering: 'pixelated'
    }
  });
}
window.IsoScene = IsoScene;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hud/Scene.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.SeasonBadge = __ds_scope.SeasonBadge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.ActivityLog = __ds_scope.ActivityLog;

__ds_ns.Hotbar = __ds_scope.Hotbar;

__ds_ns.Slot = __ds_scope.Slot;

__ds_ns.XPBar = __ds_scope.XPBar;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.TOOL_NAMES = __ds_scope.TOOL_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

})();
