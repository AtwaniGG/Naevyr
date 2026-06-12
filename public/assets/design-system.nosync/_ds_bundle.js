/* @ds-bundle: {"format":3,"namespace":"DriftLandsDesignSystem_3de3e2","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"SeasonBadge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"ActivityLog","sourcePath":"components/game/ActivityLog.jsx"},{"name":"Hotbar","sourcePath":"components/game/Hotbar.jsx"},{"name":"Slot","sourcePath":"components/game/Slot.jsx"},{"name":"XPBar","sourcePath":"components/game/XPBar.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"TOOL_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"}],"sourceHashes":{"assets/_gen/auras.js":"01e9d29f4e14","assets/_gen/beasts.js":"f237a8bd4969","assets/_gen/cache.js":"63ec2b62b1be","assets/_gen/character.js":"c39fb75c7f1b","assets/_gen/exchange.js":"f36aebfd6998","assets/_gen/fxlogo.js":"d75e9312c3e4","assets/_gen/guildbanner.js":"91ce1c38fd2d","assets/_gen/interiors.js":"d91f90a460f0","assets/_gen/landing.js":"6ccb614cb388","assets/_gen/nodes.js":"423b0fe786d3","assets/_gen/pixlib.js":"68d1e384c31c","assets/_gen/social.js":"117e1c91be46","assets/_gen/threshold.js":"9a7b8510e4f6","assets/_gen/tiles.js":"6d77bc55b2e1","assets/_gen/town.js":"a7f2517c52fe","assets/_gen/walls.js":"034bfd562504","assets/_gen/wheelfaces.js":"e6055cb0a0a6","assets/_gen/wilds.js":"19f44fe8beb5","components/core/Badge.jsx":"85e7377ebd5a","components/core/Button.jsx":"1e68b0d79a01","components/core/Panel.jsx":"13ea472f5db3","components/game/ActivityLog.jsx":"cd0eda105b42","components/game/Hotbar.jsx":"b8493e549497","components/game/Slot.jsx":"a18ee855c625","components/game/XPBar.jsx":"8cd5c827574d","components/icons/Icon.jsx":"5150976deb7d","ui_kits/hud/Hud.jsx":"8fa35d5b4c86","ui_kits/hud/Scene.jsx":"572c11e0e9fa"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DriftLandsDesignSystem_3de3e2 = window.DriftLandsDesignSystem_3de3e2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/_gen/auras.js
try { (() => {
// NAEVYR PRESTIGE AURAS — eval after pixlib.js + tiles.js (+ character.js for
// preview). Procedural orbiting-mote cosmetics baked per-frame around the
// wanderer (32×40, bottom-center anchor 16,39). Each aura canvas is 64×64 with
// its own bottom-center FEET anchor at (32,56): align that point to the
// wanderer's (16,39) anchor (engine offset = aura(32,56) over char(16,39)).
//
// Rules: rect-grid, dither not blur, RAMP ramps only, crispEdges. Particles/
// motes are outline-free glow (like ambient drift motes); only solid wisp forms
// get the 1px void outline. Frames emitted left-to-right (per-frame x offset).

const AURA_N = 64,
  AURA_CX = 32,
  AURA_FEET = 56,
  AURA_HEAD = 18;

// glow mote: optional plus-halo (dimmer) + core; outline-free
function gmote(g, x, y, core, halo) {
  x = Math.round(x);
  y = Math.round(y);
  if (halo) {
    P(g, x - 1, y, halo);
    P(g, x + 1, y, halo);
    P(g, x, y - 1, halo);
    P(g, x, y + 1, halo);
  }
  P(g, x, y, core);
}
// big premium mote: 2×2 core + diamond halo
function gmoteBig(g, x, y, core, hi, halo) {
  x = Math.round(x);
  y = Math.round(y);
  if (halo) {
    P(g, x - 2, y, halo);
    P(g, x + 2, y, halo);
    P(g, x, y - 2, halo);
    P(g, x, y + 2, halo);
    P(g, x - 1, y - 1, halo);
    P(g, x + 1, y - 1, halo);
    P(g, x - 1, y + 1, halo);
    P(g, x + 1, y + 1, halo);
  }
  P(g, x, y, core);
  P(g, x + 1, y, hi);
  P(g, x, y + 1, hi);
  P(g, x + 1, y + 1, hi);
}
// draw a solid form on a temp grid, 1px void outline, stamp onto dest
function solidOn(dest, drawFn) {
  const t = makeGrid(AURA_N, AURA_N);
  drawFn(t);
  outline(t, RAMP.void);
  stamp(dest, t, 0, 0);
}

/* ===================== 1 · ASHEN CROWN (gold + bone + ash) ===================== */
// A slow ring of drifting ash flecks hovering above/around the head, crowned by
// a faint gold arc. 8 frames, 6 fps.
function drawAshenCrown(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const gd = RAMP.gold,
    bn = RAMP.bone,
    ash = RAMP.ash;
  const cx = AURA_CX,
    cy = AURA_HEAD - 3,
    rx = 15,
    ry = 6;
  const fp = frame / 8;

  // floating crown arc (solid, outlined) — prongs riding a gentle curved band
  solidOn(g, t => {
    const span = 13;
    // curved band: y dips at the ends (a tiara arc over the head)
    for (let x = cx - span; x <= cx + span; x++) {
      const u = (x - cx) / span; // -1..1
      const yb = Math.round(cy + 2 + u * u * 3 + Math.sin(fp * Math.PI * 2 + x * 0.25) * 0.4);
      P(t, x, yb, gd[2]);
      if ((x - cx) % 4 === 0) P(t, x, yb - 1, gd[1]); // beaded highlights, not a solid rail
    }
    // five prongs of unequal height rising off the band
    for (let i = -2; i <= 2; i++) {
      const px = cx + i * 6;
      const u = i / 2;
      const bandY = Math.round(cy + 2 + u * u * 3);
      const bob = Math.sin(fp * Math.PI * 2 + i) * 0.6;
      const h = i === 0 ? 6 : Math.abs(i) === 1 ? 4 : 3;
      for (let k = 0; k < h; k++) P(t, px, Math.round(bandY - 1 - k + bob), k === h - 1 ? gd[0] : gd[1]);
    }
  });
  // gem on the center prong
  gmote(g, cx, cy - 7 + Math.round(Math.sin(fp * Math.PI * 2) * 0.6), bn[0], gd[1]);

  // orbiting ash flecks (outline-free), slow drift, depth-dimmed on the far arc
  const M = 14;
  for (let i = 0; i < M; i++) {
    const ang = i / M * Math.PI * 2 + fp * Math.PI * 2 * 0.5;
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry + Math.sin(fp * Math.PI * 2 + i) * 0.8;
    const far = Math.sin(ang) < -0.2; // upper/back arc
    const pick = i % 5;
    let c = pick === 0 ? gd[0] : pick === 1 ? bn[0] : pick === 2 ? bn[1] : pick === 3 ? gd[1] : ash;
    if (far) c = pick < 2 ? gd[2] : bn[3];
    if (i % 4 === frame % 4) gmote(g, x, y, c, far ? null : pick === 0 ? gd[2] : bn[3]);else P(g, Math.round(x), Math.round(y), c);
    // trailing ash speck
    if (!far && i % 3 === 0) P(g, Math.round(x - Math.cos(ang)), Math.round(y - Math.sin(ang)), ash);
  }
  return g;
}

/* =================== 2 · CORRUPTION HALO (drift ramp) =================== */
// A pulsing violet ring around the whole figure with motes spiraling inward —
// the player reads as a small Drift. 6 frames, 8 fps.
function drawCorruptionHalo(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const dr = RAMP.drift;
  const cx = AURA_CX,
    cy = 35,
    fp = frame / 6;
  const pulse = Math.sin(fp * Math.PI * 2);
  const rx = 17 + pulse * 2,
    ry = 9 + pulse;

  // the pulsing ring (dotted drift motes on an iso ellipse)
  const RING = 26;
  for (let i = 0; i < RING; i++) {
    const ang = i / RING * Math.PI * 2 + fp * Math.PI * 0.5;
    const x = cx + Math.cos(ang) * rx,
      y = cy + Math.sin(ang) * ry;
    const far = Math.sin(ang) < 0;
    if ((i + frame) % 2 === 0) {
      const bright = pulse > 0.4 && i % 4 === 0;
      gmote(g, x, y, far ? dr[3] : bright ? dr[0] : dr[2], far ? null : dr[4]);
    }
  }
  // motes spiraling INWARD toward the core
  const SP = 10;
  for (let i = 0; i < SP; i++) {
    const t = (frame + i * 0.6) % 6 / 6; // 0 outer .. 1 core
    const r = (1 - t) * 22 + 3;
    const ang = i / SP * Math.PI * 2 + t * Math.PI * 2.2;
    const x = cx + Math.cos(ang) * r,
      y = cy + Math.sin(ang) * r * 0.5;
    const c = t > 0.7 ? dr[0] : t > 0.4 ? dr[1] : dr[2];
    gmote(g, x, y, c, t > 0.5 ? dr[3] : null);
  }
  // pulsing core (the small Drift) at chest height
  const corec = pulse > 0 ? dr[0] : dr[1];
  gmoteBig(g, cx, cy - 1, corec, dr[1], dr[3]);
  if (pulse > 0.5) {
    P(g, cx, cy - 4, dr[2]);
    P(g, cx, cy + 2, dr[2]);
    P(g, cx - 3, cy - 1, dr[2]);
    P(g, cx + 3, cy - 1, dr[2]);
  }
  return g;
}

/* ===================== 3 · EMBER CINDER (ember + blood) ===================== */
// Rising ember sparks that swirl upward and fade to blood-ash. 6 frames, 8 fps.
function drawEmberCinder(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const em = RAMP.ember,
    bl = RAMP.blood;
  const cx = AURA_CX;
  const K = 16;
  for (let i = 0; i < K; i++) {
    const t = (frame + i * 1.7) % 6 / 6; // 0 born at feet .. 1 spent at top
    const y = AURA_FEET - 2 - t * 46;
    const swirl = Math.sin(t * Math.PI * 2 + i * 1.3) * (11 * (1 - t * 0.35));
    const x = cx + swirl + (i % 2 ? 1 : -1) * 2;
    if (t > 0.92) continue; // fade out at the crest
    let core, halo;
    if (t < 0.3) {
      core = em[0];
      halo = em[1];
    } // hot newborn spark
    else if (t < 0.6) {
      core = em[1];
      halo = em[2];
    } else {
      core = bl[1];
      halo = i % 2 ? bl[2] : em[3];
    } // cooling to blood-ash
    if (t < 0.25 && i % 3 === 0) gmoteBig(g, x, y, em[0], em[1], em[2]);else gmote(g, x, y, core, t < 0.7 && i % 2 === 0 ? halo : null);
    // upward trailing wisp
    if (t < 0.7) P(g, Math.round(x), Math.round(y + 1), t < 0.4 ? em[2] : bl[3]);
  }
  // a low ember glow at the feet (source)
  for (let x = cx - 5; x <= cx + 5; x++) if ((x + frame) % 2 === 0) P(g, x, AURA_FEET, x % 3 ? em[3] : em[2]);
  return g;
}

/* ======================== 4 · BONEWISP (bone ramp) ======================== */
// Pale skeletal wisps orbiting low around the feet/legs — eerie and cold.
// 8 frames, 6 fps.
function drawBonewisp(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const bn = RAMP.bone,
    dr = RAMP.drift;
  const cx = AURA_CX,
    cy = 49,
    rx = 15,
    ry = 5,
    fp = frame / 8;
  const W = 5;
  // back wisps first (drawn dimmer), then front
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < W; i++) {
      const ang = i / W * Math.PI * 2 + fp * Math.PI * 2;
      const far = Math.sin(ang) < 0;
      if (pass === 0 !== far) continue;
      const x = cx + Math.cos(ang) * rx;
      const y = cy + Math.sin(ang) * ry;
      const flick = Math.sin(fp * Math.PI * 2 * 2 + i) > 0 ? 1 : 0;
      // small flame/comma wisp, solid + void outline
      solidOn(g, t => {
        const tip = far ? bn[2] : bn[0],
          body = far ? bn[3] : bn[1],
          base = bn[3];
        P(t, Math.round(x), Math.round(y - 2 - flick), tip);
        P(t, Math.round(x), Math.round(y - 1), body);
        P(t, Math.round(x), Math.round(y), body);
        P(t, Math.round(x + (i % 2 ? 1 : -1)), Math.round(y), base);
        P(t, Math.round(x), Math.round(y + 1), base);
      });
      // cold drift glint in the wisp's eye-hollow (sparingly)
      if (!far && i === frame % W) P(g, Math.round(x), Math.round(y - 1), dr[1]);
      // trailing cold spark
      if (!far) gmote(g, x - Math.cos(ang) * 2, y - Math.sin(ang) * 2, bn[2], null);
    }
  }
  // faint ground mist ring at the feet
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + fp * Math.PI;
    const x = cx + Math.cos(a) * (rx - 2);
    const y = cy + 3 + Math.sin(a) * (ry - 1);
    if ((i + frame) % 2 === 0) P(g, Math.round(x), Math.round(y), bn[3]);
  }
  return g;
}
const AURAS = {
  ashen_crown: {
    fn: drawAshenCrown,
    frames: 8,
    fps: 6,
    ramp: 'gold + bone + ash',
    desc: 'Slow ring of drifting ash flecks crowning the head.'
  },
  corruption_halo: {
    fn: drawCorruptionHalo,
    frames: 6,
    fps: 8,
    ramp: 'drift',
    desc: 'Pulsing violet ring with motes spiraling inward; the player as a small Drift.'
  },
  ember_cinder: {
    fn: drawEmberCinder,
    frames: 6,
    fps: 8,
    ramp: 'ember + blood',
    desc: 'Rising ember sparks swirling upward, cooling to blood-ash.'
  },
  bonewisp: {
    fn: drawBonewisp,
    frames: 8,
    fps: 6,
    ramp: 'bone',
    desc: 'Pale skeletal wisps orbiting low around the feet; eerie and cold.'
  }
};
Object.assign(globalThis, {
  AURA_N,
  AURA_CX,
  AURA_FEET,
  AURA_HEAD,
  gmote,
  gmoteBig,
  solidOn,
  drawAshenCrown,
  drawCorruptionHalo,
  drawEmberCinder,
  drawBonewisp,
  AURAS,
  solidOn
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/auras.js", error: String((e && e.message) || e) }); }

// assets/_gen/beasts.js
try { (() => {
// Naevyr creature generators — eval after pixlib.js (+ tiles.js for RAMP/helpers).
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

// assets/_gen/cache.js
try { (() => {
// NAEVYR — DRIFT CACHE (HUD/engine reveal art). Eval after pixlib.js + tiles.js.
// Small ornate chest, 64×64, bottom-center anchor (32,58). Dark iron + drift-
// violet seams. 3 states: sealed(1f) · opening(2f, lid cracking w/ violet light)
// · burst(2f, light column + motes). Rect-grid, RAMP only, 1px void outline on
// the solid chest, outline-free glow for light/motes.

const CACHE_N = 64,
  CC_X = 32,
  CC_BASE = 58;

// the chest body (shared); lidLift raises the lid + opens a glowing gap
function chestBody(g, lidLift) {
  const st = RAMP.stone,
    ir0 = '#1a1626',
    dr = RAMP.drift,
    gd = RAMP.gold;
  const cx = CC_X,
    w = 17,
    bodyTop = 34,
    bodyBot = CC_BASE;
  // --- body box (dark iron) ---
  for (let y = bodyTop; y <= bodyBot; y++) for (let x = cx - w; x <= cx + w; x++) {
    let c = '#2a2438';
    if (x < cx - w + 2) c = '#3a3350';
    if (x > cx + w - 2) c = ir0;
    if (y > bodyBot - 3) c = ir0;
    P(g, x, y, c);
  }
  // wood staves between iron bands
  for (let x = cx - w + 1; x <= cx + w - 1; x++) {
    if ((x - cx) % 5 === 0) for (let y = bodyTop + 1; y < bodyBot - 1; y++) P(g, x, y, RAMP.dirt[3]);
  }
  // iron corner brackets + drift-violet seams
  for (let y = bodyTop; y <= bodyBot; y++) {
    P(g, cx - w, y, ir0);
    P(g, cx + w, y, ir0);
    if (y % 2 === 0) {
      P(g, cx - w + 1, y, dr[3]);
      P(g, cx + w - 1, y, dr[3]);
    }
  }
  // gold lockplate
  fillRect(g, cx - 3, bodyTop + 4, 6, 7, gd[2]);
  P(g, cx, bodyTop + 7, RAMP.void);
  fillRect(g, cx - 2, bodyTop + 4, 4, 1, gd[1]);
  P(g, cx, bodyTop + 6, gd[0]);

  // --- lid (raised by lidLift) ---
  const lidBot = bodyTop,
    lidH = 13;
  const ly = lidBot - lidLift;
  // glowing gap revealed under a lifted lid
  if (lidLift > 0) {
    for (let yy = ly; yy < lidBot; yy++) for (let x = cx - w + 1; x <= cx + w - 1; x++) {
      const t = (yy - ly) / Math.max(1, lidBot - ly);
      let c = dr[3];
      if (t > 0.3) c = dr[2];
      if (t > 0.6) c = dr[1];
      if (t > 0.85) c = dr[0];
      if (hash2(x, yy, 9) < 0.25) c = dr[0];
      P(g, x, yy, c);
    }
  }
  // arched lid
  for (let x = cx - w; x <= cx + w; x++) {
    const u = (x - cx) / w;
    const arch = Math.round((1 - u * u) * 6);
    for (let y = ly - lidH - arch + 6; y <= ly; y++) {
      let c = '#2a2438';
      if (x < cx - w + 2) c = '#3a3350';
      if (x > cx + w - 2) c = ir0;
      if (y <= ly - lidH - arch + 7) c = '#3a3350'; // top highlight
      P(g, x, y, c);
    }
  }
  // lid iron bands + violet seam along the rim
  for (let x = cx - w; x <= cx + w; x++) {
    const u = (x - cx) / w;
    const arch = Math.round((1 - u * u) * 6);
    P(g, x, ly, ir0);
    P(g, x, ly - 1, dr[3]);
    if ((x - cx) % 6 === 0) for (let y = ly - lidH - arch + 7; y < ly; y++) P(g, x, y, RAMP.dirt[3]);
  }
  return {
    cx,
    w,
    bodyTop,
    lidTopY: ly - lidH
  };
}
function drawCacheSealed() {
  const g = makeGrid(CACHE_N, CACHE_N);
  chestBody(g, 0);
  // faint dormant violet glow in the seams
  outline(g, RAMP.void);
  return g;
}
function drawCacheOpening(frame) {
  // 0,1 — lid cracking
  const g = makeGrid(CACHE_N, CACHE_N);
  const lift = frame === 0 ? 4 : 9;
  chestBody(g, lift);
  // escaping light slivers at the crack
  const dr = RAMP.drift;
  for (let i = -2; i <= 2; i++) {
    const x = CC_X + i * 5;
    P(g, x, 34 - lift - 1, dr[0]);
    if (frame) P(g, x, 34 - lift - 3, dr[1]);
  }
  outline(g, RAMP.void);
  // motes (outline-free) added AFTER outline so they stay glow
  if (frame) for (let i = 0; i < 6; i++) {
    const x = CC_X - 8 + i * 3;
    const y = 30 - i % 3 * 3;
    P(g, x, y, i % 2 ? dr[0] : dr[2]);
  }
  return g;
}
function drawCacheBurst(frame) {
  // 0,1 — light column + motes
  const g = makeGrid(CACHE_N, CACHE_N);
  chestBody(g, 11);
  outline(g, RAMP.void);
  const dr = RAMP.drift,
    gd = RAMP.gold;
  const cx = CC_X,
    topGlow = 33 - 11;
  // vertical light column rising from the open chest (dithered, widening)
  const h = frame ? 30 : 22,
    halfMax = frame ? 9 : 6;
  for (let k = 0; k < h; k++) {
    const t = k / h;
    const hw = Math.round((1 - t) * halfMax) + 1;
    const yy = topGlow - k;
    for (let x = cx - hw; x <= cx + hw; x++) {
      const edge = Math.abs(x - cx) >= hw - 1;
      if (edge && (x + yy) % 2 !== 0) continue; // dithered edge
      let c = dr[2];
      if (Math.abs(x - cx) < hw - 2) c = dr[1];
      if (Math.abs(x - cx) <= 1) c = k < h * 0.6 ? dr[0] : RAMP.bone[0];
      if (t > 0.8 && Math.abs(x - cx) <= 1) c = gd[0]; // gold sparks at the crest
      P(g, x, yy, c);
    }
  }
  // burst motes flying out + up
  const mr = mulberry(frame + 5);
  const N = frame ? 22 : 14;
  for (let i = 0; i < N; i++) {
    const a = (-90 + (mr() - 0.5) * 150) * Math.PI / 180; // mostly upward fan
    const r = 6 + mr() * (frame ? 26 : 16);
    const x = Math.round(cx + Math.cos(a) * r),
      y = Math.round(topGlow + Math.sin(a) * r);
    P(g, x, y, mr() < 0.3 ? gd[0] : mr() < 0.6 ? dr[0] : dr[1]);
    if (mr() < 0.3) P(g, x, y + 1, dr[3]);
  }
  return g;
}
const CACHE = {
  drift_cache: {
    cell: [CACHE_N, CACHE_N],
    anchor: [CC_X, CC_BASE],
    ramp: 'iron(stone) + drift + gold',
    states: {
      sealed: {
        fn: () => [drawCacheSealed()],
        frames: 1,
        fps: 0
      },
      opening: {
        fn: () => [drawCacheOpening(0), drawCacheOpening(1)],
        frames: 2,
        fps: 6
      },
      burst: {
        fn: () => [drawCacheBurst(0), drawCacheBurst(1)],
        frames: 2,
        fps: 8
      }
    }
  }
};
Object.assign(globalThis, {
  CACHE_N,
  CC_X,
  CC_BASE,
  chestBody,
  drawCacheSealed,
  drawCacheOpening,
  drawCacheBurst,
  CACHE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/cache.js", error: String((e && e.message) || e) }); }

// assets/_gen/character.js
try { (() => {
// Naevyr character generator — hooded Drift-touched wanderer.
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

// assets/_gen/exchange.js
try { (() => {
// NAEVYR — THE EXCHANGE counter (Vault interior fixture). Eval after pixlib.js +
// tiles.js. Matches the interiors.js fixture conventions: bottom-center anchor,
// top 6px of the cell kept clear for labels, 1px void outline, RAMP only.
// Brass balance scales: a GOLD pan and a violet-glow DRIFTS pan, 48×48, 2-frame
// tip-totter (~2fps).

const EX_W = 48,
  EX_H = 48,
  EX_ANCHOR = [24, 47];
function drawExchange(frame) {
  const g = makeGrid(EX_W, EX_H);
  const gd = RAMP.gold,
    dr = RAMP.drift,
    st = RAMP.stone,
    dt = RAMP.dirt;
  const cx = 24,
    baseY = 45;

  // --- ledger/counter base the scales sit on ---
  for (let y = baseY - 6; y <= baseY; y++) for (let x = cx - 16; x <= cx + 16; x++) {
    let c = dt[1];
    if (x < cx - 14) c = dt[0];
    if (x > cx + 14) c = dt[3];
    if (y > baseY - 2) c = dt[3];
    if ((x + y) % 7 === 0) c = dt[2];
    P(g, x, y, c);
  }
  // an open ledger book on the left of the counter
  fillRect(g, cx - 14, baseY - 9, 9, 3, RAMP.bone[1]);
  P(g, cx - 10, baseY - 9, dt[3]);
  for (let i = 0; i < 3; i++) {
    P(g, cx - 13 + i, baseY - 8, st[3]);
    P(g, cx - 8 + i, baseY - 8, st[3]);
  }

  // --- central brass column ---
  for (let y = 12; y <= baseY - 6; y++) {
    P(g, cx, y, gd[1]);
    P(g, cx - 1, y, gd[2]);
    P(g, cx + 1, y, gd[3]);
  }
  fillRect(g, cx - 2, baseY - 7, 5, 2, gd[3]); // foot
  // finial
  P(g, cx, 10, gd[0]);
  P(g, cx, 11, gd[1]);

  // --- balance beam (tips by frame) ---
  const tip = frame === 0 ? 1 : -1; // +1: gold pan down; -1: drifts pan down
  const beamY = 14;
  const armLen = 13;
  // beam as a shallow line pivoting at (cx, beamY)
  const pts = [];
  for (let i = -armLen; i <= armLen; i++) {
    const y = beamY + Math.round(i / armLen * 2 * tip);
    P(g, cx + i, y, i < 0 ? gd[1] : gd[2]);
    P(g, cx + i, y - 1, gd[0]);
    pts.push(y);
  }
  // pivot knob
  P(g, cx, beamY - 1, gd[0]);
  P(g, cx, beamY, gd[1]);

  // --- left pan: GOLD coins ---
  const lpx = cx - armLen,
    lpy = pts[0] + 1;
  hangPan(g, lpx, lpy + (tip > 0 ? 4 : 2), gd, 'gold');
  // --- right pan: DRIFTS (violet glow) ---
  const rpx = cx + armLen,
    rpy = pts[pts.length - 1] + 1;
  hangPan(g, rpx, rpy + (tip < 0 ? 4 : 2), dr, 'drifts');
  outline(g, RAMP.void);

  // glow on the drifts pan AFTER outline (outline-free)
  const gy = (tip < 0 ? rpy + 4 : rpy + 2) + 4;
  for (let i = -1; i <= 1; i++) P(g, rpx + i, gy - 5, dr[0]);
  if (frame) {
    P(g, rpx, gy - 7, dr[1]);
    P(g, rpx - 2, gy - 5, dr[2]);
    P(g, rpx + 2, gy - 5, dr[2]);
  }
  return g;
}

// a hanging pan: 2 chains to a shallow bowl + its contents
function hangPan(g, px, py, ramp, kind) {
  const gd = RAMP.gold;
  // chains from beam end down to the bowl
  for (let k = 0; k < 4; k++) {
    P(g, px - 2, py - 4 + k, gd[3]);
    P(g, px + 2, py - 4 + k, gd[3]);
  }
  // bowl
  for (let x = px - 4; x <= px + 4; x++) {
    const d = Math.abs(x - px);
    const yy = py + Math.round(d * 0.4);
    P(g, x, yy, gd[2]);
    P(g, x, yy + 1, gd[3]);
  }
  // contents
  if (kind === 'gold') {
    P(g, px - 1, py - 1, gd[0]);
    P(g, px + 1, py - 1, gd[1]);
    P(g, px, py - 2, gd[0]);
    P(g, px, py - 1, gd[1]); // coin stack
  } else {
    // a drift shard
    P(g, px, py - 3, RAMP.drift[0]);
    P(g, px, py - 2, RAMP.drift[1]);
    P(g, px - 1, py - 1, RAMP.drift[2]);
    P(g, px + 1, py - 1, RAMP.drift[2]);
    P(g, px, py - 1, RAMP.drift[1]);
  }
}
const EXCHANGE = {
  exchange_counter: {
    fn: drawExchange,
    frames: 2,
    fps: 2,
    cell: [EX_W, EX_H],
    anchor: EX_ANCHOR,
    ramp: 'gold(brass) + drift + dirt'
  }
};
Object.assign(globalThis, {
  EX_W,
  EX_H,
  EX_ANCHOR,
  drawExchange,
  hangPan,
  EXCHANGE
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/exchange.js", error: String((e && e.message) || e) }); }

// assets/_gen/fxlogo.js
try { (() => {
// Naevyr FX + logo generators — eval after pixlib.js.

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
// custom 12px-tall pixel letterset (only the letters NAEVYR needs)
const GLYPHS = {
  D: ['######..', '#######.', '##...##.', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##...##.', '#######.', '######..'],
  R: ['#######.', '########', '##....##', '##....##', '##...###', '#######.', '######..', '##.###..', '##..##..', '##...##.', '##...###', '##....##'],
  I: ['####', '####', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '####', '####'],
  F: ['########', '########', '##......', '##......', '##......', '#######.', '#######.', '##......', '##......', '##......', '##......', '##......'],
  T: ['########', '########', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
  L: ['##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '########', '########'],
  A: ['..####..', '.######.', '##....##', '##....##', '##....##', '########', '########', '##....##', '##....##', '##....##', '##....##', '##....##'],
  N: ['##....##', '##....##', '###...##', '####..##', '##.##.##', '##.##.##', '##..####', '##..####', '##...###', '##...###', '##....##', '##....##'],
  S: ['.#######', '########', '##......', '##......', '########', '.#######', '......##', '......##', '......##', '......##', '########', '#######.'],
  E: ['########', '########', '##......', '##......', '##......', '#######.', '#######.', '##......', '##......', '##......', '########', '########'],
  V: ['##....##', '##....##', '##....##', '##....##', '##....##', '.##..##.', '.##..##.', '.##..##.', '..####..', '..####..', '...##...', '...##...'],
  Y: ['##....##', '##....##', '.##..##.', '.##..##.', '..####..', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...']
};
function scaleGrid(g, k) {
  const m = makeGrid(g.w * k, g.h * k);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v) fillRect(m, x * k, y * k, k, k, v.c, v.a);
  }
  return m;
}
// build the NAEVYR wordmark at 1× (12 tall) with corruption bleed
function wordmarkGrid(mono) {
  const word = 'NAEVYR';
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
  const wm = scaleGrid(wordmarkGrid(mono), 3); // centered (name length varies)
  stamp(g, wm, Math.round((256 - wm.w) / 2), 132);
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

// assets/_gen/guildbanner.js
try { (() => {
// NAEVYR — GUILD BANNER (engine sprite). Eval after pixlib.js + tiles.js.
// Standing war-banner, 48×96, bottom-center anchor (24,95). Dark wood pole,
// bone-ramp cloth with a BLANK plate area (engine overlays the guild tag as
// text), drift-violet trim. 3 frames cloth sway (~3fps) + a 1-frame fallen
// tattered variant. Rect-grid, RAMP only, 1px void outline, dither not blur.

const GB_W = 48,
  GB_H = 96,
  GB_ANCHOR = [24, 95];

// plate area the engine writes text into (returned in JSON): x,y,w,h in cell px
const GB_PLATE = {
  x: 14,
  y: 30,
  w: 22,
  h: 26
};
function drawGuildBanner(frame) {
  const g = makeGrid(GB_W, GB_H);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    dr = RAMP.drift,
    gd = RAMP.gold;
  const poleX = 14,
    topY = 8,
    baseY = GB_H - 2;

  // --- ground shadow ---
  for (let x = poleX - 7; x <= poleX + 7; x++) if ((x + 1) % 2 === 0) P(g, x, baseY, RAMP.void);

  // --- wooden pole ---
  for (let y = topY; y <= baseY - 1; y++) for (let x = poleX - 1; x <= poleX + 1; x++) {
    let c = dt[1];
    if (x === poleX - 1) c = dt[0];
    if (x === poleX + 1) c = dt[3];
    if (hash2(x, y, 3) < 0.08) c = dt[2];
    P(g, x, y, c);
  }
  // pole finial: drift-violet crystal cap
  P(g, poleX, topY - 3, dr[0]);
  P(g, poleX, topY - 2, dr[1]);
  P(g, poleX - 1, topY - 1, dr[2]);
  P(g, poleX + 1, topY - 1, dr[2]);
  P(g, poleX, topY - 1, dr[1]);
  // crossbar
  for (let x = poleX - 2; x <= poleX + 20; x++) P(g, x, topY, dt[3]);
  for (let x = poleX - 2; x <= poleX + 20; x++) P(g, x, topY + 1, dt[2]);
  P(g, poleX + 20, topY - 1, dr[2]); // crossbar tip glint

  // --- cloth banner: hangs from crossbar, sways by frame ---
  const clothX0 = poleX + 2,
    clothW = 22,
    clothTop = topY + 2,
    clothBot = 70;
  const sway = [0, 1, 0][frame] || 0;
  const phase = frame;
  for (let y = clothTop; y <= clothBot; y++) {
    const t = (y - clothTop) / (clothBot - clothTop);
    // horizontal wave offset grows toward the free (right) edge & toward the bottom
    const wave = Math.round(Math.sin(t * 3.2 + phase * 1.3) * (1.4 * t) + sway * t);
    for (let x = clothX0; x <= clothX0 + clothW; x++) {
      const u = (x - clothX0) / clothW; // 0 at pole .. 1 free edge
      const xoff = Math.round(wave * u);
      let c = bn[1];
      if (u < 0.12) c = bn[3]; // shadow fold at the pole
      else if (u > 0.86) c = bn[2]; // far edge shade
      // soft vertical fold shading
      const fold = Math.sin(u * 9 + phase);
      if (fold > 0.7) c = bn[0];else if (fold < -0.7) c = bn[2];
      // drift-violet trim border (top, bottom, free edge)
      if (y <= clothTop + 1 || u > 0.93) c = dr[2];
      P(g, x + xoff, y, c);
    }
    // swallowtail notch at the bottom
    if (y > clothBot - 8) {
      const cut = 8 - (clothBot - y);
      for (let x = clothX0 + clothW / 2 - cut; x <= clothX0 + clothW / 2 + cut; x++) {
        const u = (x - clothX0) / clothW;
        const xoff = Math.round(wave * u);
        if (Math.abs(x - (clothX0 + clothW / 2)) < cut) g.d[y * g.w + (x + xoff)] = null;
      }
    }
  }
  // --- blank plate area (engine writes the tag here): subtle recessed bone panel + trim ---
  const swayP = Math.round(sway * 0.4);
  for (let y = GB_PLATE.y; y < GB_PLATE.y + GB_PLATE.h; y++) for (let x = GB_PLATE.x; x < GB_PLATE.x + GB_PLATE.w; x++) {
    const edge = y === GB_PLATE.y || y === GB_PLATE.y + GB_PLATE.h - 1 || x === GB_PLATE.x || x === GB_PLATE.x + GB_PLATE.w - 1;
    P(g, x + swayP, y, edge ? dr[3] : bn[1]);
  }
  // emblem hint corners (so the blank plate still reads as heraldry)
  P(g, GB_PLATE.x + swayP, GB_PLATE.y, gd[2]);
  P(g, GB_PLATE.x + GB_PLATE.w - 1 + swayP, GB_PLATE.y, gd[2]);
  P(g, GB_PLATE.x + swayP, GB_PLATE.y + GB_PLATE.h - 1, gd[2]);
  P(g, GB_PLATE.x + GB_PLATE.w - 1 + swayP, GB_PLATE.y + GB_PLATE.h - 1, gd[2]);
  outline(g, RAMP.void);
  return g;
}
function drawGuildBannerFallen() {
  const g = makeGrid(GB_W, GB_H);
  const dt = RAMP.dirt,
    bn = RAMP.bone,
    dr = RAMP.drift;
  // leaning pole (diagonal), base bottom-center, top toward upper-right
  const baseX = 18,
    baseY = GB_H - 2;
  for (let k = 0; k < 60; k++) {
    const x = baseX + Math.round(k * 0.42),
      y = baseY - k;
    if (y < 18) break;
    for (let o = -1; o <= 1; o++) {
      let c = dt[1];
      if (o === -1) c = dt[0];
      if (o === 1) c = dt[3];
      if (hash2(x + o, y, 4) < 0.1) c = dt[2];
      P(g, x + o, y, c);
    }
  }
  const topX = baseX + Math.round(59 * 0.42),
    topY = baseY - 59;
  // broken crossbar
  for (let x = topX - 1; x <= topX + 12; x++) P(g, x, topY, dt[3]);
  // tattered cloth draping down-right, corruption-eaten edges
  const cx0 = topX + 1,
    cw = 20,
    ct = topY + 1,
    cb = topY + 40;
  for (let y = ct; y <= cb; y++) {
    const t = (y - ct) / (cb - ct);
    const lean = Math.round(t * 6);
    for (let x = cx0; x <= cx0 + cw; x++) {
      const u = (x - cx0) / cw;
      // ragged right/bottom edge: corruption eats away
      const eat = hash2(x, y, 7);
      const ragged = u > 0.6 + 0.35 * Math.sin(y * 0.7) || t > 0.7 && eat < 0.5;
      if (ragged) {
        if (eat < 0.35 && u > 0.5) P(g, x + lean, y, eat < 0.15 ? dr[1] : dr[3]);
        continue;
      }
      let c = bn[2];
      if (u < 0.14) c = bn[3];
      const fold = Math.sin(u * 8);
      if (fold > 0.6) c = bn[1];else if (fold < -0.6) c = bn[3];
      // corruption bleeding inward from the eaten edge
      if (u > 0.5 && eat < 0.2) c = dr[3];
      if (y <= ct + 1) c = dr[3];
      P(g, x + lean, y, c);
    }
  }
  // a few drift motes rising off the rot
  for (let i = 0; i < 6; i++) {
    const x = cx0 + 4 + i * 3 % cw,
      y = cb - 4 - i % 4 * 5;
    P(g, x, y, i % 2 ? dr[1] : dr[2]);
  }
  // fallen finial crystal on the ground
  P(g, baseX - 4, baseY - 1, dr[1]);
  P(g, baseX - 5, baseY, dr[3]);
  outline(g, RAMP.void);
  return g;
}
const GUILD = {
  guild_banner: {
    fn: drawGuildBanner,
    frames: 3,
    fps: 3,
    ramp: 'bone + dirt + drift',
    anchor: GB_ANCHOR,
    plate: GB_PLATE
  },
  guild_banner_fallen: {
    fn: drawGuildBannerFallen,
    frames: 1,
    fps: 0,
    ramp: 'bone + dirt + drift',
    anchor: GB_ANCHOR
  }
};
Object.assign(globalThis, {
  GB_W,
  GB_H,
  GB_ANCHOR,
  GB_PLATE,
  drawGuildBanner,
  drawGuildBannerFallen,
  GUILD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/guildbanner.js", error: String((e && e.message) || e) }); }

// assets/_gen/interiors.js
try { (() => {
// Naevyr INTERIOR SET + THE MINE — eval after pixlib.js + tiles.js.
// Rect-grid, RAMP only, 1px void auto-outline, dither not blur, deterministic.
// Moonlit-left / shadowed-right. Floors 64×36 (tiles.js format). Walls 64×56.
// Fixtures bottom-center anchored; top 6px of every fixture/building cell kept
// clear for engine labels.

/* ============================ FLOOR TILES (64×36) ============================ */
function makeFloorTile(type, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = type === 'wood' ? RAMP.dirt : RAMP.stone;
  const face = ramp[1],
    hi = ramp[0],
    sh = ramp[2],
    dp = ramp[3];
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
  }
  // 1px void north edge
  for (let x = 0; x < 64; x++) for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
    P(g, x, y, RAMP.void);
    break;
  }
  if (type === 'wood') {
    // plank seams run NW→SE (parallel to top-left edge): constant (x+2y)
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      if ((x + 2 * y) % 10 === 0) P(g, x, y, dp); // board seam
      else if ((x + 2 * y) % 10 === 1) P(g, x, y, hi); // plank highlight edge
      if (hash2(x, y, seedN) < 0.015) {
        P(g, x, y, dp);
        P(g, x + 1, y, sh);
      } // knot
      else if (hash2(x, y, seedN + 5) < 0.03) P(g, x, y, sh); // grain
    }
    // board END caps (cross seams) every few rows
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) if ((x - 2 * y + 64) % 26 === seedN * 7 % 26) P(g, x, y, dp);
  } else if (type === 'stone') {
    // flagstone courses (blocky), hairline cracks
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const bx = Math.floor((x + 2 * y) / 12),
        by = Math.floor((x - 2 * y + 128) / 12);
      if ((x + 2 * y) % 12 === 0 || (x - 2 * y + 128) % 12 === 0) P(g, x, y, dp); // joints
      else if (hash2(bx, by, seedN) < 0.18 && hash2(x, y, seedN + 1) < 0.5) P(g, x, y, hash2(x, y, seedN + 2) < 0.5 ? hi : sh);
      if (hash2(x, y, seedN + 7) < 0.012) P(g, x, y, dp); // hairline crack
    }
  } else {
    // cave
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const h = hash2(x, y, seedN);
      if (h < 0.08) P(g, x, y, sh);else if (h < 0.11) P(g, x, y, dp);else if (h < 0.135) P(g, x, y, hi);
      if (hash2(x, y, seedN + 9) < 0.012) {
        P(g, x, y, RAMP.gold[1]);
        if (hash2(x, y, seedN + 10) < 0.4) P(g, x + 1, y, RAMP.gold[2]);
      } // gold fleck
      if (hash2(x, y, seedN + 11) < 0.02) P(g, x, y, dp); // rubble speck
    }
  }
  return g;
}

/* ============================ WALL SEGMENTS (64×56) ==========================
   Flat camera-facing face + a sheared iso top cap that implies the wall's
   recede direction. NW = back-left (moonlit), NE = back-right (shadowed). */
function wallSegment(side, mat, variant, opt) {
  opt = opt || {};
  const g = makeGrid(64, 56);
  const lit = side === 'nw';
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  // base/face brightness shift by side
  const cBase = lit ? ramp[1] : ramp[2];
  const cHi = lit ? ramp[0] : ramp[1];
  const cSh = lit ? ramp[2] : ramp[3];
  const faceTop = 14,
    faceBot = 53;

  // ---- top cap (iso thickness), sheared toward the far corner ----
  for (let x = 0; x < 64; x++) {
    // NW recedes up-right → cap rises to the right; NE mirror
    const sx = lit ? x : 63 - x;
    const capLift = Math.floor(sx / 8); // 0..7 px
    for (let k = 0; k < 6; k++) P(g, x, faceTop - 1 - k - capLift, k < 2 ? RAMP.stone[lit ? 1 : 2] : mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]);
    // void cap edge
    P(g, x, faceTop - 6 - capLift, RAMP.void);
  }

  // ---- face ----
  for (let y = faceTop; y <= faceBot; y++) for (let x = 0; x < 64; x++) {
    let c = cBase;
    if (x < 3) c = lit ? cHi : ramp[1]; // left edge lightest
    else if (x > 60) c = cSh;
    // material texture
    if (mat === 'timber') {
      if ((y - faceTop) % 4 === 0) c = cSh; // plank seams
      if (hash2(x, y, 71) < 0.04) c = cSh;
    } else if (mat === 'block') {
      const course = Math.floor((y - faceTop) / 6);
      if ((y - faceTop) % 6 === 0) c = cSh; // course line
      if ((x + course % 2 * 6) % 12 === 0) c = cSh; // vertical joints (staggered)
      if (hash2(x, y, 72) < 0.03) c = lit ? ramp[1] : ramp[3];
    } else {
      // cave — raw rock
      const h = hash2(x, y, 73);
      if (h < 0.10) c = cSh;else if (h < 0.14) c = cHi;
      if (hash2(x, y, 74) < 0.02) c = ramp[3];
    }
    P(g, x, y, c);
  }
  // baseboard
  for (let x = 0; x < 64; x++) {
    P(g, x, faceBot, ramp[3]);
    P(g, x, faceBot - 1, cSh);
  }

  // ---- variants ----
  if (variant === 'window') {
    const wx = 24,
      wy = 24,
      ww = 16,
      wh = 14;
    for (let j = 0; j < wh; j++) for (let i = 0; i < ww; i++) {
      let c = RAMP.ember[1];
      if (i === 0 || j === 0 || i === ww - 1 || j === wh - 1) c = RAMP.ember[0];
      if ((i + j) % 2 === 0 && hash2(i, j, 75) < 0.25) c = RAMP.ember[0];
      P(g, wx + i, wy + j, c);
    }
    // bone frame + mullions
    for (let i = -1; i <= ww; i++) {
      P(g, wx + i, wy - 1, RAMP.bone[2]);
      P(g, wx + i, wy + wh, RAMP.bone[3]);
    }
    for (let j = -1; j <= wh; j++) {
      P(g, wx - 1, wy + j, RAMP.bone[2]);
      P(g, wx + ww, wy + j, RAMP.bone[3]);
    }
    for (let j = 0; j < wh; j++) P(g, wx + (ww >> 1), wy + j, RAMP.bone[3]);
    for (let i = 0; i < ww; i++) P(g, wx + i, wy + (wh >> 1), RAMP.bone[3]);
    // warm spill
    for (let i = -2; i < ww + 2; i++) P(g, wx + i, wy + wh + 1, RAMP.ember[2]);
  } else if (variant === 'banner') {
    const acc = opt.accent || RAMP.drift;
    const bx = 26,
      by = faceTop + 2,
      bw = 12,
      bh = 30;
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      let c = acc[2];
      if (i === 0) c = acc[1];
      if (i === bw - 1) c = acc[3];
      P(g, bx + i, by + j, c);
    }
    for (let i = -1; i <= bw; i++) P(g, bx + i, by - 1, RAMP.dirt[3]); // rod
    // pennant tail (notched bottom)
    for (let i = 0; i < bw; i++) {
      const t = Math.abs(i - (bw - 1) / 2) / ((bw - 1) / 2);
      for (let k = 0; k < Math.round((1 - t) * 5); k++) P(g, bx + i, by + bh + k, acc[3]);
    }
    // emblem
    P(g, bx + (bw >> 1), by + 10, acc[0]);
    P(g, bx + (bw >> 1) - 1, by + 11, acc[0]);
    P(g, bx + (bw >> 1) + 1, by + 11, acc[0]);
    P(g, bx + (bw >> 1), by + 12, acc[1]);
  } else if (variant === 'seam') {
    // glinting gold seam across raw rock
    let x = 8,
      y = faceTop + 6;
    for (let k = 0; k < 40; k++) {
      P(g, x, y, RAMP.gold[1]);
      if (hash2(x, y, 76) < 0.5) P(g, x, y + 1, RAMP.gold[2]);
      if (hash2(x, y, 77) < 0.3) P(g, x, y - 1, RAMP.gold[0]); // glint
      x += 1 + (hash2(k, 1, 78) < 0.4 ? 1 : 0);
      y += hash2(k, 2, 78) < 0.5 ? 1 : hash2(k, 3, 78) < 0.5 ? -1 : 0;
      if (x > 58) break;
      y = Math.max(faceTop + 2, Math.min(faceBot - 3, y));
    }
  } else if (variant === 'lantern') {
    // hanging miner's lantern (ember)
    const lx = 32,
      ly = faceTop + 6;
    for (let k = 0; k < 5; k++) P(g, lx, faceTop - 1 - k < 0 ? 0 : faceTop - 1 + k, RAMP.dirt[3]); // bracket down
    P(g, lx, ly - 3, RAMP.dirt[3]);
    for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) {
      let c = RAMP.ember[1];
      if (j === 0 || j === 7) c = RAMP.dirt[3];else if (i <= -2) c = RAMP.ember[0];else if (i >= 2) c = RAMP.ember[2];
      if ((j === 1 || j === 6) && Math.abs(i) === 3) c = RAMP.dirt[3];
      P(g, lx + i, ly + j, c);
    }
    P(g, lx, ly + 3, RAMP.ember[0]);
    // glow dither
    for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
      const d = Math.abs(xx) + Math.abs(yy);
      if (d > 4 && d < 8 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ FIXTURES ============================ */
// generic iso cuboid: front (lit) + right side (shadow) + top
function isoCuboid(g, x0, baseY, w, h, dep, ramp) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // front
    let c = ramp[1];
    if (x < 1) c = ramp[0];
    if (x > w - 2) c = ramp[2];
    P(g, x0 + x, baseY - y, c);
  }
  for (let d = 1; d <= dep; d++) for (let y = 0; y < h; y++) {
    // right side
    P(g, x0 + w - 1 + d, baseY - y - Math.floor(d / 2), d >= dep - 1 ? ramp[3] : ramp[2]);
  }
  for (let d = 0; d <= dep; d++) for (let x = 0; x < w; x++) {
    // top
    P(g, x0 + x + d, baseY - h - Math.floor(d / 2), d === 0 || x === 0 ? ramp[0] : ramp[1]);
  }
}
function fxCounter() {
  const g = makeGrid(48, 32);
  const r = RAMP.dirt;
  const baseY = 29,
    x0 = 3;
  isoCuboid(g, x0, baseY, 38, 16, 6, r);
  // top surface lighter plank
  for (let d = 0; d <= 6; d++) for (let x = 0; x < 38; x++) if ((x + d) % 6 === 0) P(g, x0 + x + d, baseY - 16 - Math.floor(d / 2), r[2]);
  // gold till glint
  P(g, x0 + 30, baseY - 17, RAMP.gold[0]);
  P(g, x0 + 31, baseY - 18, RAMP.gold[1]);
  P(g, x0 + 30, baseY - 16, RAMP.gold[2]);
  // panel seams on front
  for (let x = 8; x < 38; x += 10) for (let y = 0; y < 15; y++) P(g, x0 + x, baseY - y, r[3]);
  outline(g, RAMP.void);
  return g;
}
function fxShelf() {
  const g = makeGrid(40, 40);
  const r = RAMP.dirt;
  const x0 = 4,
    top = 8;
  // frame
  for (let j = 0; j < 28; j++) {
    P(g, x0, top + j, r[2]);
    P(g, x0 + 30, top + j, r[3]);
  }
  for (const sy of [top, top + 9, top + 18, top + 27]) for (let i = 0; i <= 30; i++) P(g, x0 + i, sy, r[3]);
  // bottles (top shelf)
  [[RAMP.drift, 6], [RAMP.ember, 11], [RAMP.water, 16], [RAMP.grass, 21]].forEach(([col, bx]) => {
    P(g, x0 + bx, top + 3, col[1]);
    P(g, x0 + bx, top + 4, col[2]);
    P(g, x0 + bx, top + 5, col[2]);
    P(g, x0 + bx, top + 2, RAMP.bone[2]);
  });
  // coffer (mid)
  for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) {
    let c = RAMP.dirt[1];
    if (i === 0) c = RAMP.dirt[0];
    if (i === 11) c = RAMP.dirt[2];
    if (j === 0) c = RAMP.gold[2];
    P(g, x0 + 8 + i, top + 11 + j, c);
  }
  P(g, x0 + 14, top + 13, RAMP.gold[0]);
  // cloth bolts (lower)
  [[RAMP.blood, 6], [RAMP.drift, 13], [RAMP.gold, 20]].forEach(([col, bx]) => {
    for (let j = 0; j < 6; j++) P(g, x0 + bx, top + 20 + j, col[1]), P(g, x0 + bx + 1, top + 20 + j, col[2]);
  });
  outline(g, RAMP.void);
  return g;
}
function fxTable() {
  const g = makeGrid(40, 32);
  const r = RAMP.dirt;
  const cx = 20,
    ty = 16;
  // round top (iso ellipse)
  for (let yy = -5; yy <= 5; yy++) for (let xx = -13; xx <= 13; xx++) {
    if ((xx / 13) ** 2 + (yy / 5) ** 2 > 1) continue;
    let c = r[1];
    if (yy < -1) c = r[0];
    if (yy > 2) c = r[2];
    P(g, cx + xx, ty + yy, c);
  }
  for (let xx = -13; xx <= 13; xx++) {
    const t = 1 - Math.abs(xx) / 13;
    const ey = ty + Math.round(5 * t);
    for (let k = 1; k <= 3; k++) P(g, cx + xx, ey + k, r[3]);
  } // rim
  // legs
  P(g, cx - 8, ty + 8, r[3]);
  P(g, cx - 8, ty + 9, r[3]);
  P(g, cx + 8, ty + 8, r[3]);
  P(g, cx + 8, ty + 9, r[3]);
  P(g, cx, ty + 11, r[3]);
  P(g, cx, ty + 12, r[3]);
  // mug
  P(g, cx + 3, ty - 2, RAMP.dirt[2]);
  P(g, cx + 3, ty - 3, RAMP.dirt[1]);
  fillRect(g, cx + 2, ty - 4, 3, 2, RAMP.dirt[1]);
  P(g, cx + 5, ty - 3, RAMP.dirt[2]);
  P(g, cx + 3, ty - 5, RAMP.bone[1]);
  outline(g, RAMP.void);
  return g;
}
function fxBarrel() {
  const g = makeGrid(20, 28);
  const r = RAMP.dirt;
  const x0 = 3,
    baseY = 25;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 12; i++) {
    const t = Math.abs(i - 5.5) / 6;
    let c = r[1];
    if (i <= 1) c = r[0];
    if (i >= 9) c = r[2];
    if (t > 0.85) c = r[3];
    if (j === 0 || j === 21) c = r[3];
    if (j === 5 || j === 16) c = r[3];
    P(g, x0 + i, baseY - 21 + j, c);
  }
  // top rim ellipse
  for (let xx = 0; xx < 12; xx++) {
    const t = Math.abs(xx - 5.5) / 6;
    if (t < 0.92) P(g, x0 + xx, baseY - 21 - Math.round((1 - t) * 2), r[2]);
  }
  P(g, x0 + 5, baseY - 24, r[1]);
  outline(g, RAMP.void);
  return g;
}
const VAT_LIQUIDS = ['drift', 'ember', 'water', 'blood', 'grass', 'gold'];
function fxVat(liquid) {
  const g = makeGrid(28, 28);
  const r = RAMP.dirt;
  const lr = RAMP[liquid] || RAMP.drift;
  const cx = 14,
    baseY = 25;
  // wooden tub
  for (let j = 0; j < 16; j++) for (let i = -10; i <= 10; i++) {
    const t = Math.abs(i) / 10;
    if (t > 0.95 - j * 0.005) continue;
    let c = r[1];
    if (i < -7) c = r[0];
    if (i > 7) c = r[2];
    if (j % 6 === 5) c = r[3];
    if (Math.abs(i) >= 9) c = r[3];
    P(g, cx + i, baseY - j, c);
  }
  // liquid surface (iso ellipse) near top
  for (let yy = -3; yy <= 3; yy++) for (let xx = -8; xx <= 8; xx++) {
    if ((xx / 8) ** 2 + (yy / 3) ** 2 > 1) continue;
    let c = lr[2] || lr[1];
    if (yy < -1) c = lr[1];
    if (yy <= -2) c = lr[0];
    if ((xx + yy) % 3 === 0 && yy > 0) c = lr[3] || lr[2];
    P(g, cx + xx, baseY - 14 + yy, c);
  }
  // steam
  P(g, cx - 2, baseY - 18, RAMP.bone[3]);
  P(g, cx + 1, baseY - 20, RAMP.bone[3]);
  P(g, cx - 1, baseY - 22, RAMP.bone[3]);
  // rim
  for (let xx = -9; xx <= 9; xx++) {
    const t = Math.abs(xx) / 9;
    if (t < 0.96) P(g, cx + xx, baseY - 16 - Math.round((1 - t) * 1), r[2]);
  }
  outline(g, RAMP.void);
  return g;
}
function fxCage() {
  const g = makeGrid(26, 32);
  const r = RAMP.stone;
  const x0 = 3,
    top = 6,
    w = 18,
    h = 22;
  // base
  for (let i = 0; i < w; i++) {
    P(g, x0 + i, top + h, r[3]);
    P(g, x0 + i, top + h - 1, r[2]);
  }
  // dome top
  for (let xx = 0; xx < w; xx++) {
    const t = Math.abs(xx - (w - 1) / 2) / ((w - 1) / 2);
    const yy = top - Math.round((1 - t) * 4);
    for (let k = yy; k < top + 1; k++) P(g, x0 + xx, k, r[2]);
  }
  P(g, x0 + (w >> 1), top - 5, r[3]);
  P(g, x0 + (w >> 1), top - 6, r[3]); // ring
  // vertical bars
  for (let i = 0; i <= w; i += 3) for (let j = top; j < top + h; j++) P(g, x0 + i, j, r[3]);
  for (let i = 0; i < w; i++) {
    P(g, x0 + i, top, r[3]);
    P(g, x0 + i, top + Math.round(h / 2), r[3]);
  }
  // glowing wisp inside
  const wx = x0 + (w >> 1),
    wy = top + 12;
  P(g, wx, wy, RAMP.drift[0]);
  P(g, wx - 1, wy, RAMP.drift[1]);
  P(g, wx + 1, wy, RAMP.drift[1]);
  P(g, wx, wy - 1, RAMP.drift[1]);
  P(g, wx, wy + 1, RAMP.drift[2]);
  for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy) % 2 === 0) P(g, wx + xx, wy + yy, RAMP.drift[2]);
  outline(g, RAMP.void);
  return g;
}
function fxAnvil() {
  const g = makeGrid(28, 24);
  const r = RAMP.stone;
  const baseY = 21,
    cx = 14;
  // stump
  for (let j = 0; j < 7; j++) for (let i = -5; i <= 5; i++) {
    let c = RAMP.dirt[1];
    if (i < -3) c = RAMP.dirt[0];
    if (i > 3) c = RAMP.dirt[2];
    P(g, cx + i, baseY - j, c);
  }
  // anvil body
  for (let i = -6; i <= 6; i++) P(g, cx + i, baseY - 9, r[1]); // base top
  for (let i = -4; i <= 4; i++) P(g, cx + i, baseY - 8, r[2]); // waist
  for (let i = -7; i <= 9; i++) {
    let c = r[1];
    if (i < -5) c = r[0];
    if (i > 6) c = r[2];
    P(g, cx + i, baseY - 12, c);
    P(g, cx + i, baseY - 11, c);
  } // top face + horn
  for (let i = 7; i <= 11; i++) P(g, cx + i, baseY - 11, r[2]); // horn taper
  // gold spark
  P(g, cx + 2, baseY - 14, RAMP.gold[0]);
  P(g, cx + 3, baseY - 15, RAMP.gold[1]);
  P(g, cx + 1, baseY - 15, RAMP.ember[0]);
  outline(g, RAMP.void);
  return g;
}
function fxWheelStand() {
  const g = makeGrid(34, 40);
  const cx = 17,
    wy = 14,
    R = 12;
  const seg = [RAMP.blood[1], RAMP.ember[1], RAMP.gold[1], RAMP.water[0], RAMP.drift[2], RAMP.grass[1]];
  // stand post + feet
  for (let j = 0; j < 14; j++) P(g, cx, wy + R + j, RAMP.dirt[2]), P(g, cx + 1, wy + R + j, RAMP.dirt[3]);
  for (let i = -6; i <= 6; i++) P(g, cx + i, wy + R + 13, RAMP.dirt[3]);
  // wheel
  for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    if (d > R) continue;
    if (d > R - 2) {
      P(g, cx + xx, wy + yy, RAMP.dirt[3]);
      continue;
    }
    const ang = (Math.atan2(yy, xx) + Math.PI) / (Math.PI * 2);
    P(g, cx + xx, wy + yy, seg[Math.floor(ang * 6) % 6]);
  }
  P(g, cx, wy, RAMP.bone[1]); // hub
  P(g, cx, wy - R - 1, RAMP.bone[0]);
  P(g, cx, wy - R, RAMP.bone[1]); // pointer
  outline(g, RAMP.void);
  return g;
}
function fxHearth(frame) {
  frame = frame || 0;
  const g = makeGrid(36, 36);
  const r = RAMP.stone;
  const cx = 18,
    baseY = 33;
  // stone surround
  for (let j = 0; j < 28; j++) for (let i = -15; i <= 15; i++) {
    const inner = Math.abs(i) <= 9 && j < 18;
    if (inner) continue;
    if (Math.abs(i) > 15 || j > 27) continue;
    let c = r[1];
    if (i < -11) c = r[0];
    if (i > 11) c = r[2];
    if (j % 6 === 0 || (i + Math.floor(j / 6) % 2 * 5) % 10 === 0) c = r[3];
    P(g, cx + i, baseY - j, c);
  }
  // dark firebox
  for (let j = 0; j < 16; j++) for (let i = -8; i <= 8; i++) if (Math.abs(i) <= 8 && j < 16) P(g, cx + i, baseY - j, RAMP.void);
  // logs
  for (let i = -6; i <= 6; i++) P(g, cx + i, baseY - 1, RAMP.dirt[3]);
  P(g, cx - 4, baseY - 2, RAMP.dirt[2]);
  P(g, cx + 4, baseY - 2, RAMP.dirt[2]);
  // ember fire (flicker)
  const sway = [0, 1, -1][frame],
    tall = [0, 1, 2][frame];
  for (let yy = 0; yy <= 12 + tall; yy++) {
    const t = yy / (12 + tall);
    const hw = Math.round((1 - t) * 6);
    const sx = cx + Math.round(Math.sin(yy * 0.5 + frame) * 1.1) + Math.round(sway * t);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = RAMP.ember[1];
      if (Math.abs(xx) >= hw - 1) c = RAMP.ember[2];
      if (yy < 5 && Math.abs(xx) < 2) c = RAMP.ember[0];
      P(g, sx + xx, baseY - 2 - yy, c);
    }
  }
  for (let yy = 2; yy <= 7 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (8 + tall)) * 2));
    for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, baseY - 4 - yy, RAMP.gold[0]);
  }
  // spark + glow
  if (frame !== 1) P(g, cx + sway, baseY - 16 - tall, RAMP.ember[0]);
  for (let yy = -10; yy <= 2; yy++) for (let xx = -10; xx <= 10; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 7 && d < 10 && (xx + yy + frame) % 2 === 0 && baseY - 4 + yy > 14) P(g, cx + xx, baseY - 6 + yy, RAMP.ember[2]);
  }
  outline(g, RAMP.void);
  return g;
}
function fxRug(accent) {
  const g = makeGrid(56, 30);
  const cx = 28,
    cy = 15;
  const acc = accent || RAMP.drift;
  for (let yy = -13; yy <= 13; yy++) for (let xx = -26; xx <= 26; xx++) {
    if ((xx / 26) ** 2 + (yy / 13) ** 2 > 1) continue;
    const e = (xx / 26) ** 2 + (yy / 13) ** 2;
    let c = RAMP.dirt[2];
    if (e > 0.78) c = acc[2]; // accent border
    else if (e > 0.66) c = acc[3];else if (e < 0.18) c = acc[3]; // center medallion
    else if (e < 0.28) c = RAMP.dirt[1];
    if ((xx + yy) % 6 === 0 && e < 0.6 && e > 0.3) c = RAMP.dirt[1]; // weave
    P(g, cx + xx, cy + yy, c);
  }
  // fringe
  for (let xx = -26; xx <= 26; xx += 3) {
    P(g, cx + xx, cy + Math.round(13 * Math.sqrt(Math.max(0, 1 - (xx / 26) ** 2))) + 1, RAMP.dirt[3]);
  }
  outline(g, RAMP.void);
  return g;
}
function fxGoldVein(state) {
  // state: 'rich0','rich1','spent'
  const g = makeGrid(28, 26);
  const r = RAMP.stone;
  const cx = 14,
    baseY = 23;
  for (let yy = 0; yy <= 18; yy++) for (let xx = -11; xx <= 11; xx++) {
    const t = yy / 18;
    const hw = Math.round(11 * (1 - Math.abs(t - 0.5) * 0.7));
    if (Math.abs(xx) > hw) continue;
    let c = r[1];
    if (xx < -hw + 2) c = r[0];
    if (xx > hw - 2) c = r[3];
    if (yy > 14) c = r[3];
    if (hash2(cx + xx, baseY - yy, 81) < 0.08) c = r[2];
    P(g, cx + xx, baseY - yy, c);
  }
  if (state === 'spent') {
    // hollowed dark pockets, no gold
    [[-4, 10], [3, 7], [0, 13], [-6, 6], [5, 12]].forEach(([ox, oy]) => {
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) P(g, cx + ox + xx, baseY - oy + yy, RAMP.void);
      P(g, cx + ox, baseY - oy, RAMP.stone[3]);
    });
  } else {
    const spark = state === 'rich1';
    // bright gold seams
    const seams = [[-7, 4, 1, 1], [-2, 6, 1, -1], [4, 5, 1, 1], [-5, 11, 1, 0], [2, 12, 1, 1]];
    seams.forEach(([sx, sy, dx, dy], i) => {
      let x = cx + sx,
        y = baseY - sy;
      for (let k = 0; k < 6; k++) {
        P(g, x, y, RAMP.gold[1]);
        if (k % 2 === 0) P(g, x, y + 1, RAMP.gold[2]);
        if (spark && (i + k) % 4 === 0) P(g, x, y - 1, RAMP.gold[0]);
        x += dx;
        y -= dy * (k % 2);
      }
    });
    // a couple of bright nuggets with glint
    P(g, cx - 3, baseY - 8, RAMP.gold[0]);
    P(g, cx - 2, baseY - 8, RAMP.gold[1]);
    if (spark) P(g, cx - 3, baseY - 9, RAMP.bone[0]);
    P(g, cx + 5, baseY - 10, RAMP.gold[0]);
    if (spark) P(g, cx + 6, baseY - 11, RAMP.bone[0]);
  }
  outline(g, RAMP.void);
  return g;
}
function fxOreCart() {
  const g = makeGrid(36, 28);
  const r = RAMP.dirt;
  const baseY = 25,
    x0 = 4;
  // rails under
  for (let i = 0; i < 36; i++) {
    P(g, i, baseY, RAMP.stone[3]);
    P(g, i, baseY - 1, RAMP.stone[2]);
  }
  for (let i = 2; i < 36; i += 5) P(g, i, baseY + 1, RAMP.dirt[3]); // ties
  // wheels
  [[x0 + 6, baseY - 2], [x0 + 22, baseY - 2]].forEach(([wx, wy]) => {
    for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 5) P(g, wx + xx, wy + yy, RAMP.stone[3]);
    P(g, wx, wy, RAMP.stone[2]);
  });
  // cart body (trapezoid bucket)
  for (let j = 0; j < 12; j++) {
    const w = 26 - j;
    const sx = x0 + 2 + Math.floor((26 - w) / 2);
    for (let i = 0; i < w; i++) {
      let c = r[1];
      if (i < 1) c = r[0];
      if (i > w - 2) c = r[2];
      if (j === 0) c = r[2];
      P(g, sx + i, baseY - 6 - j, c);
    }
  }
  // band + rivets
  for (let i = 0; i < 26; i++) P(g, x0 + 2 + i, baseY - 12, RAMP.dirt[3]);
  // raw gold ore heaped on top
  for (let i = 0; i < 9; i++) {
    const ox = x0 + 6 + i * 2,
      oy = baseY - 18 - i % 2;
    P(g, ox, oy, RAMP.gold[1]);
    P(g, ox + 1, oy, RAMP.gold[2]);
    P(g, ox, oy - 1, RAMP.gold[0]);
  }
  for (let i = 0; i < 5; i++) P(g, x0 + 9 + i * 3, baseY - 20, RAMP.stone[2]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ THE MINE (overworld, 144×120) ============================ */
function drawMine() {
  const g = makeGrid(144, 120);
  const cx = 72,
    baseY = 100;
  // foundation (reuse town foundation if available, else local)
  if (typeof foundation === 'function') foundation(g, cx, baseY + 6, 56, {});
  // rocky mound — low, broad, FLAT-topped dome, irregular silhouette
  const maxH = 46;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(66 * Math.pow(1 - Math.pow(t, 3), 0.42)); // stays wide, flat top
    hw += Math.round((hash2(yy, 0, 95) - 0.5) * 6); // rocky bumps
    if (yy > maxH - 6) hw = Math.max(hw, 10 - (maxH - yy) * 1.5); // rounded flat cap
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 91);
      let c = RAMP.stone[1];
      if (xx < -hw + 6) c = RAMP.stone[0]; // moonlit left
      else if (xx > hw - 6) c = RAMP.stone[3]; // shadow right
      else if (h < 0.10) c = RAMP.stone[2];else if (h < 0.13) c = RAMP.stone[0];
      if (h < 0.02) c = RAMP.stone[3];
      P(g, cx + xx, top, c);
    }
  }
  // gold seams glinting across the rock
  const rng = mulberry(913);
  for (let s = 0; s < 7; s++) {
    let x = cx - 40 + Math.floor(rng() * 80),
      y = baseY - 8 - Math.floor(rng() * 46);
    const dx = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < 10 + Math.floor(rng() * 8); k++) {
      if (G(g, x, y)) {
        P(g, x, y, RAMP.gold[1]);
        if (rng() < 0.5) P(g, x, y + 1, RAMP.gold[2]);
        if (rng() < 0.3) P(g, x, y - 1, RAMP.gold[0]);
      }
      x += dx * (rng() < 0.4 ? 1 : 0) + (rng() < 0.3 ? 1 : 0);
      y += rng() < 0.5 ? 1 : -1;
    }
  }
  // timber-framed dark adit on the south face
  const ax = cx,
    abot = baseY,
    aw = 30,
    ah = 30;
  for (let j = 0; j < ah; j++) for (let i = -aw / 2; i <= aw / 2; i++) {
    const t = Math.abs(i) / (aw / 2);
    if (j < ah * 0.45 * t) continue; // arched top
    P(g, ax + i, abot - j, RAMP.void);
  }
  // arch interior depth hint (dither toward lighter at top)
  for (let j = 0; j < 6; j++) for (let i = -aw / 2 + 3; i <= aw / 2 - 3; i++) if ((i + j) % 2 === 0 && Math.abs(i) < aw / 2 - 3) P(g, ax + i, abot - ah + 6 + j, RAMP.stone[3]);
  // timber frame (posts + lintel)
  for (let j = 0; j <= ah; j++) {
    fillRect(g, ax - aw / 2 - 3, abot - j, 3, 1, RAMP.dirt[1]);
    fillRect(g, ax + aw / 2, abot - j, 3, 1, RAMP.dirt[2]);
  }
  for (let i = -aw / 2 - 3; i <= aw / 2 + 3; i++) {
    const t = Math.abs(i) / (aw / 2 + 3);
    const ly = abot - ah - 2 + Math.round(t * 5);
    P(g, ax + i, ly, RAMP.dirt[1]);
    P(g, ax + i, ly - 1, RAMP.dirt[0]);
    P(g, ax + i, ly - 2, RAMP.dirt[3]);
  }
  // cross-brace
  for (let k = 0; k < aw + 6; k++) P(g, ax - aw / 2 - 3 + k, abot - ah + 2 + Math.round(Math.sin(k / (aw + 6) * Math.PI) * -2), RAMP.dirt[3]);
  // cart rails running out of the mouth (south, toward camera)
  for (let k = 0; k < 22; k++) {
    const ry = abot + k,
      spread = 4 + Math.floor(k * 0.5);
    P(g, ax - spread, ry, RAMP.stone[3]);
    P(g, ax - spread + 1, ry, RAMP.stone[2]);
    P(g, ax + spread, ry, RAMP.stone[3]);
    P(g, ax + spread - 1, ry, RAMP.stone[2]);
    if (k % 3 === 0) for (let i = -spread; i <= spread; i++) P(g, ax + i, ry, RAMP.dirt[3]); // tie
  }
  // a few raw ore chunks by the mouth
  [[ax - 22, abot + 2], [ax + 20, abot + 5]].forEach(([ox, oy]) => {
    P(g, ox, oy, RAMP.gold[1]);
    P(g, ox + 1, oy, RAMP.gold[2]);
    P(g, ox, oy - 1, RAMP.gold[0]);
    P(g, ox - 1, oy, RAMP.stone[2]);
  });
  // hung ember lantern by the entrance (on the left post)
  const lx = ax - aw / 2 - 6,
    ly = abot - ah + 6;
  P(g, lx + 2, ly - 4, RAMP.dirt[3]);
  for (let i = 0; i < 4; i++) P(g, lx + 2 + i, ly - 4, RAMP.dirt[3]);
  for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) {
    let c = RAMP.ember[1];
    if (j === 0 || j === 7) c = RAMP.dirt[3];else if (i <= -2) c = RAMP.ember[0];else if (i >= 2) c = RAMP.ember[2];
    P(g, lx + i, ly + j, c);
  }
  P(g, lx, ly + 3, RAMP.ember[0]);
  for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 4 && d < 8 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRIES ============================ */
const FLOORS = {
  floor_wood: 'wood',
  floor_stone: 'stone',
  floor_cave: 'cave'
};
const WALLS = [
// key, side, mat, variant
['wall_timber_nw', 'nw', 'timber', 'plain'], ['wall_timber_ne', 'ne', 'timber', 'plain'], ['wall_timber_window', 'nw', 'timber', 'window'], ['wall_timber_banner', 'nw', 'timber', 'banner'], ['wall_block_nw', 'nw', 'block', 'plain'], ['wall_block_ne', 'ne', 'block', 'plain'], ['wall_block_window', 'nw', 'block', 'window'], ['wall_block_banner', 'nw', 'block', 'banner'], ['wall_cave_nw', 'nw', 'cave', 'plain'], ['wall_cave_ne', 'ne', 'cave', 'plain'], ['wall_cave_seam', 'nw', 'cave', 'seam'], ['wall_cave_lantern', 'nw', 'cave', 'lantern']];
const FIX = {
  counter: {
    fn: fxCounter,
    cell: [48, 32],
    anchor: [24, 31]
  },
  shelf: {
    fn: fxShelf,
    cell: [40, 40],
    anchor: [20, 39]
  },
  table: {
    fn: fxTable,
    cell: [40, 32],
    anchor: [20, 31]
  },
  barrel: {
    fn: fxBarrel,
    cell: [20, 28],
    anchor: [10, 27]
  },
  cage: {
    fn: fxCage,
    cell: [26, 32],
    anchor: [13, 31]
  },
  anvil: {
    fn: fxAnvil,
    cell: [28, 24],
    anchor: [14, 23]
  },
  wheel_stand: {
    fn: fxWheelStand,
    cell: [34, 40],
    anchor: [17, 39]
  },
  ore_cart: {
    fn: fxOreCart,
    cell: [36, 28],
    anchor: [18, 26]
  }
};
Object.assign(globalThis, {
  makeFloorTile,
  wallSegment,
  isoCuboid,
  fxCounter,
  fxShelf,
  fxTable,
  fxBarrel,
  fxVat,
  fxCage,
  fxAnvil,
  fxWheelStand,
  fxHearth,
  fxRug,
  fxGoldVein,
  fxOreCart,
  drawMine,
  FLOORS,
  WALLS,
  FIX,
  VAT_LIQUIDS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/interiors.js", error: String((e && e.message) || e) }); }

// assets/_gen/landing.js
try { (() => {
// Naevyr LANDING PAGE ART PACK — eval after pixlib.js + tiles.js (+ town.js
// & interiors.js for silhouette cues, fxlogo.js for the emblem). Rect-grid,
// RAMP only, 1px void outline, dither not blur, deterministic. Moonlit-left.

/* ============================ HERO VISTA (480×270, 2 frames) ============================
   Waystation cluster at dusk, distant 2:1 iso. Warm windows, shrine pale flame,
   corruption creeping from both edges + drifting motes. Center third kept calm
   & dark for overlaid UI text. */
function drawHeroVista(frame) {
  frame = frame || 0;
  const W = 480,
    H = 270,
    g = makeGrid(W, H);
  const horizon = 150;

  // --- sky: dusk gradient via stepped dither bands (void→stone→drift hint) ---
  const bands = [[0, 26, RAMP.void, '#13101d'], [26, 54, '#13101d', RAMP.ash], [54, 84, RAMP.ash, '#241d33'], [84, 116, '#241d33', '#2f2440'], [116, horizon, '#2f2440', '#3a2c4e']];
  bands.forEach(([y0, y1, a, b]) => {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        // ordered 2px dither between a and b
        const dith = (x + y) % 2 === 0 ? t : t - 0.5;
        P(g, x, y, dith > 0.5 ? b : a);
      }
    }
  });
  // distant ridge silhouettes (two layers)
  for (let x = 0; x < W; x++) {
    const r1 = horizon - 10 - Math.round(8 * Math.sin(x * 0.013) + 5 * Math.sin(x * 0.05));
    for (let y = r1; y < horizon; y++) P(g, x, y, '#241d33');
    const r2 = horizon - 4 - Math.round(5 * Math.sin(x * 0.02 + 2));
    for (let y = r2; y < horizon; y++) P(g, x, y, '#1c1729');
  }
  // a cold moon, upper-left third (kept out of center)
  const mx = 70,
    my = 46;
  for (let yy = -9; yy <= 9; yy++) for (let xx = -9; xx <= 9; xx++) {
    if (xx * xx + yy * yy > 81) continue;
    let c = RAMP.bone[2];
    if (xx + yy < -4) c = RAMP.bone[1];
    if (xx * xx + yy * yy > 56) c = RAMP.bone[3];
    P(g, mx + xx, my + yy, c);
  }
  for (let i = 0; i < 5; i++) {
    const cxs = mx + 2 + i,
      cys = my + 3 + i % 2 * 2;
    for (let xx = 0; xx < 5; xx++) P(g, cxs + xx, cys, '#2f2440');
  } // craters via dark streaks
  // faint stars
  const rng = mulberry(301);
  for (let i = 0; i < 60; i++) {
    const sx = Math.floor(rng() * W),
      sy = Math.floor(rng() * (horizon - 20));
    if (Math.abs(sx - 240) < 70 && sy > 40) continue;
    P(g, sx, sy, rng() < 0.3 ? RAMP.bone[1] : RAMP.bone[3]);
  }

  // --- ground plane (iso-ish dark earth, fading to black at front) ---
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) {
      let c = t < 0.4 ? '#1a1626' : t < 0.75 ? '#13101d' : RAMP.void;
      if ((x + y) % 2 === 0 && hash2(x, y, 302) < 0.05 * (1 - t)) c = RAMP.dirt[3];
      P(g, x, y, c);
    }
  }
  // a faint iso path leading to the cluster (center, dark/calm)
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    const wdt = Math.round(6 + t * 40);
    for (let x = 240 - wdt; x <= 240 + wdt; x++) if ((x + y) % 3 === 0) P(g, x, y, '#1f1a2e');
  }

  // --- distant Waystation cluster on the horizon (small simplified buildings) ---
  // helper: tiny iso house with optional warm window + roof color
  function tinyHouse(bx, by, w, hh, roof, lit, flicker) {
    // body
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      let c = RAMP.stone[2];
      if (x < 1) c = RAMP.stone[1];
      if (x > w - 2) c = RAMP.stone[3];
      P(g, bx + x, by - y, c);
    }
    // right side
    for (let d = 1; d <= 3; d++) for (let y = 0; y < hh; y++) P(g, bx + w - 1 + d, by - y - Math.floor(d / 2), RAMP.stone[3]);
    // roof
    for (let x = -1; x <= w; x++) {
      const d = Math.abs(x - (w - 1) / 2);
      const ry = by - hh - Math.round((w / 2 - d) * 0.7);
      for (let y = ry; y <= by - hh + 1; y++) P(g, bx + x, y, roof);
    }
    // warm window
    if (lit) {
      const wx = bx + (w >> 1) - 1,
        wy = by - (hh >> 1) - 1;
      const on = !flicker || frame === 0;
      fillRect(g, wx, wy, 2, 2, on ? RAMP.ember[1] : RAMP.ember[2]);
      if (on) P(g, wx, wy - 1, RAMP.ember[2]);
    }
  }
  // cluster center ~ x 210..290, sitting on horizon
  tinyHouse(196, horizon - 1, 12, 12, RAMP.blood[2], true, false); // tavern-ish (warm)
  tinyHouse(214, horizon + 2, 10, 9, RAMP.stone[3], true, true);
  tinyHouse(252, horizon + 3, 14, 10, RAMP.dirt[3], true, false);
  tinyHouse(276, horizon - 1, 9, 11, RAMP.water[1], false, false); // menagerie-ish
  tinyHouse(232, horizon - 3, 8, 8, RAMP.stone[3], true, true);
  // the shrine pale flame on a small dais (right of center)
  const sfx = 300,
    sfy = horizon + 1;
  fillRect(g, sfx - 3, sfy - 2, 7, 3, RAMP.stone[2]); // dais
  const tall = frame === 0 ? 0 : 1;
  for (let yy = 0; yy <= 6 + tall; yy++) {
    const hw = Math.max(0, Math.round((1 - yy / (7 + tall)) * 2));
    for (let xx = -hw; xx <= hw; xx++) P(g, sfx + xx, sfy - 2 - yy, Math.abs(xx) === 0 ? RAMP.bone[0] : RAMP.bone[1]);
  }
  for (let yy = 1; yy <= 4 + tall; yy++) P(g, sfx, sfy - 3 - yy, RAMP.drift[1]); // purple core
  // pale flame glow
  for (let yy = -5; yy <= 1; yy++) for (let xx = -4; xx <= 4; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 2 && d < 5 && (xx + yy + frame) % 2 === 0) P(g, sfx + xx, sfy - 4 + yy, RAMP.drift[2]);
  }

  // --- corruption creeping from BOTH screen edges ---
  function corruptEdge(side) {
    for (let y = 60; y < H; y++) {
      const reach = Math.round((40 + 26 * Math.sin(y * 0.05 + (side < 0 ? 0 : 2))) * (0.5 + 0.5 * (y / H)));
      for (let d = 0; d < reach; d++) {
        const x = side < 0 ? d : W - 1 - d;
        const edgeFade = 1 - d / reach;
        const h = hash2(x, y, 303);
        if ((x + y) % 2 === 0 && h < edgeFade * 0.8) P(g, x, y, h < edgeFade * 0.3 ? RAMP.drift[2] : RAMP.drift[3]);else if (h < edgeFade * 0.18) P(g, x, y, RAMP.drift[1]); // bright vein nodes
        // glowing tendril tips
        if (d > reach - 3 && h < 0.04) P(g, x, y, RAMP.drift[1]);
      }
    }
  }
  corruptEdge(-1);
  corruptEdge(1);

  // --- drifting purple motes (shimmer between frames), avoid calm center top ---
  const mrng = mulberry(304);
  for (let i = 0; i < 70; i++) {
    let px = Math.floor(mrng() * W),
      py = Math.floor(mrng() * H);
    const drift = frame === 0 ? 0 : 1;
    px = (px + i % 3 * drift) % W;
    py = (py - drift + H) % H;
    // keep upper-center third calmer
    if (px > 150 && px < 330 && py < 120) {
      if (mrng() < 0.7) continue;
    }
    const big = i % 5 === 0;
    P(g, px, py, big ? RAMP.drift[0] : RAMP.drift[1]);
    if (big) {
      P(g, px + 1, py, RAMP.drift[2]);
      P(g, px, py + 1, RAMP.drift[2]);
    }
  }
  // bottom vignette so overlaid UI text reads
  for (let y = H - 60; y < H; y++) {
    const t = (y - (H - 60)) / 60;
    for (let x = 0; x < W; x++) if ((x + y) % 2 === 0 && hash2(x, y, 305) < t * 0.9) P(g, x, y, RAMP.void);
  }

  // NOTE: no global outline — this is a scene, not an object.
  return g;
}

/* ============================ NAV ICONS (16×16) ============================
   Icon.tsx style: single 'ink' silhouette + light/shadow, tintable. We draw in
   bone ramp so the DS can recolor via CSS. 1px void outline. */
function navIcon(name) {
  const g = makeGrid(16, 16);
  const I = RAMP.bone[1],
    D = RAMP.bone[3],
    H = RAMP.bone[0],
    A = RAMP.drift[1],
    G = RAMP.gold[1],
    E = RAMP.ember[1];
  const box = (x, y, w, h, c) => fillRect(g, x, y, w, h, c);
  const line = (x0, y0, x1, y1, c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) P(g, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
  };
  switch (name) {
    case 'gauge':
      {
        // dashboard
        for (let yy = -5; yy <= 2; yy++) for (let xx = -6; xx <= 6; xx++) {
          if (xx * xx + (yy * 1.4) ** 2 > 36) continue;
          if (yy > 1) continue;
          P(g, 8 + xx, 9 + yy, I);
        }
        for (let xx = -6; xx <= 6; xx++) {
          P(g, 8 + xx, 9, D);
        } // base
        [-4, 0, 4].forEach(t => P(g, 8 + t, 4 + Math.abs(t) * 0.2, D)); // ticks
        line(8, 9, 11, 5, A);
        P(g, 8, 9, H); // needle
        break;
      }
    case 'scroll':
      {
        // updates
        box(4, 3, 8, 10, I);
        box(4, 3, 8, 1, D);
        box(4, 12, 8, 1, D);
        for (let yy = 5; yy <= 10; yy += 2) line(5, yy, 10, yy, D);
        P(g, 3, 3, D);
        P(g, 12, 3, D);
        P(g, 3, 13, D);
        P(g, 12, 13, D); // rolled ends
        box(3, 2, 2, 2, H);
        box(11, 12, 2, 2, H);
        break;
      }
    case 'banner':
      {
        // events
        box(5, 2, 6, 9, A);
        P(g, 5, 2, RAMP.drift[0]);
        box(10, 2, 1, 9, RAMP.drift[3]);
        for (let i = 0; i < 3; i++) {
          P(g, 6 + i * 2, 11 + i % 2, RAMP.drift[3]);
        } // notched tail
        line(8, 2, 8, 14, D); // pole
        P(g, 7, 5, H);
        P(g, 9, 5, H);
        P(g, 8, 6, H); // emblem
        break;
      }
    case 'book':
      {
        // docs / how-to-play
        box(3, 3, 5, 10, I);
        box(8, 3, 5, 10, I);
        box(3, 3, 5, 1, D);
        box(8, 3, 5, 1, D);
        line(8, 3, 8, 12, D); // spine
        box(3, 12, 10, 1, D);
        P(g, 5, 6, D);
        P(g, 10, 6, D);
        P(g, 5, 8, D);
        P(g, 10, 8, D); // text lines
        P(g, 8, 2, H);
        break;
      }
    case 'trophy':
      {
        // leaderboard
        for (let yy = 0; yy < 5; yy++) for (let xx = -4; xx <= 4; xx++) {
          if (Math.abs(xx) === 4 && yy > 2) continue;
          P(g, 8 + xx, 3 + yy, G);
        }
        P(g, 3, 4, G);
        P(g, 3, 5, G);
        P(g, 13, 4, G);
        P(g, 13, 5, G); // handles
        box(7, 8, 3, 2, RAMP.gold[2]);
        box(5, 11, 7, 2, G);
        box(6, 13, 5, 1, RAMP.gold[3]); // stem+base
        P(g, 8, 4, H);
        break;
      }
    case 'ledger':
      {
        // index
        box(4, 2, 9, 12, I);
        box(4, 2, 9, 1, D);
        box(4, 13, 9, 1, D);
        box(4, 2, 1, 12, D); // binding
        for (let yy = 4; yy <= 11; yy += 2) line(6, yy, 11, yy, D);
        P(g, 12, 5, A);
        P(g, 12, 9, G); // tab marks
        break;
      }
    case 'discord':
      {
        for (let yy = -3; yy <= 3; yy++) for (let xx = -5; xx <= 5; xx++) {
          if (xx * xx / 25 + yy * yy / 9 > 1) continue;
          P(g, 8 + xx, 7 + yy, I);
        }
        P(g, 4, 11, I);
        P(g, 12, 11, I);
        P(g, 5, 10, I);
        P(g, 11, 10, I); // lower horns
        P(g, 6, 7, D);
        P(g, 10, 7, D);
        P(g, 6, 6, H);
        P(g, 10, 6, H); // eyes
        break;
      }
    case 'telegram':
      {
        for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 11; xx++) {
          if (xx + yy < 4 || xx - yy > 8) continue;
          if (yy > 4 && xx < yy + 1) continue;
          P(g, 3 + xx, 3 + yy, I);
        }
        line(13, 4, 5, 9, H); // fold highlight
        P(g, 7, 12, I);
        P(g, 6, 13, D); // tail flick
        break;
      }
    case 'x_bird':
      {
        line(3, 3, 12, 12, I);
        line(4, 3, 13, 12, I);
        line(12, 3, 3, 12, I);
        line(13, 3, 4, 12, I);
        P(g, 3, 3, H);
        P(g, 13, 12, D);
        break;
      }
  }
  outline(g, RAMP.void);
  return g;
}
const NAV_ICONS = ['gauge', 'scroll', 'banner', 'book', 'trophy', 'ledger', 'discord', 'telegram', 'x_bird'];

/* ============================ GATE DOOR (96×128, 3 frames) ============================
   Warded stone door: shut · runes pulsing (gold) · opening glow. */
function drawGateDoor(frame) {
  frame = frame || 0;
  const g = makeGrid(96, 128);
  const cx = 48,
    baseY = 122;
  const st = RAMP.stone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  // stone arch surround
  for (let y = 8; y <= baseY; y++) for (let x = 8; x <= 87; x++) {
    const inArch = x >= 18 && x <= 77 && y >= 28 - Math.round(Math.sqrt(Math.max(0, 900 - (x - 48) ** 2)) * 0.0);
    // outer block frame
    if (x < 18 || x > 77 || y < 26) {
      // arch top: carve circle
      const topGap = y < 40 && (x - 48) ** 2 + (y - 40) ** 2 < 30 ** 2 && x > 18 && x < 78;
      if (topGap) continue;
      let c = st[1];
      if (x < 12 || x > 77 && x < 84) c = st[0];
      if (x > 83 || x > 77) c = st[3];
      if (y % 8 === 0 || (x + Math.floor(y / 8) % 2 * 5) % 10 === 0) c = st[3];
      if (hash2(x, y, 311) < 0.05) c = st[2];
      P(g, x, y, c);
    }
  }
  // door leaves region
  const dl = 20,
    dr_ = 76,
    dtopFlat = 42,
    dtopArchR = 28;
  function inDoor(x, y) {
    if (x < dl || x > dr_) return false;
    if (y > baseY - 2) return false;
    if (y >= dtopFlat) return true;
    return (x - 48) ** 2 + (y - dtopFlat) ** 2 <= dtopArchR ** 2;
  }
  // opening: frame 2 splits the doors apart
  const split = frame === 2 ? 10 : 0;
  for (let y = 14; y <= baseY; y++) for (let x = dl; x <= dr_; x++) {
    if (!inDoor(x, y)) continue;
    const leftLeaf = x < 48;
    const sx = leftLeaf ? x - split : x + split;
    if (frame === 2 && Math.abs(x - 48) < split) {
      // revealed interior glow
      let c = dr[3];
      const d = Math.abs(x - 48);
      if (d < split - 4) c = dr[2];
      if (d < split - 7) c = dr[1];
      if (hash2(x, y, 312) < 0.2) c = dr[0];
      P(g, x, y, c);
      continue;
    }
    if (!inDoor(sx, y)) continue;
    // wood/stone leaf with vertical planks
    let c = st[2];
    if (leftLeaf && x < dl + 3 || !leftLeaf && x > dr_ - 3) c = st[1];
    const plank = (leftLeaf ? dr_ - x : x - dl) % 7;
    if (plank === 0) c = st[3];
    if (x > 44 && x < 52) c = st[3]; // center seam
    if (hash2(sx, y, 313) < 0.05) c = st[3];
    P(g, sx, y, c);
  }
  // iron bands
  if (frame !== 2) {
    for (const by of [56, 90]) for (let x = dl + 1; x <= dr_ - 1; x++) {
      if (inDoor(x, by)) P(g, x, by, st[3]);
      if (inDoor(x, by + 1)) P(g, x, by + 1, RAMP.void);
    }
  }

  // --- warded runes (a ring + glyphs) ---
  const glow = frame === 0 ? gd[3] : frame === 1 ? gd[0] : gd[1];
  const glowDim = frame === 0 ? RAMP.gold[3] : gd[2];
  // central ring sigil
  const rcx = 48,
    rcy = 78,
    R = 16;
  if (frame !== 2) {
    for (let a = 0; a < 48; a++) {
      const th = a / 48 * Math.PI * 2;
      const x = Math.round(rcx + Math.cos(th) * R),
        y = Math.round(rcy + Math.sin(th) * R);
      if (inDoor(x, y)) P(g, x, y, a % 6 < 3 ? glow : glowDim);
    }
    // inner triangle glyph
    for (let i = 0; i < 3; i++) {
      const a0 = -Math.PI / 2 + i * 2.094,
        a1 = -Math.PI / 2 + (i + 1) * 2.094;
      const x0 = rcx + Math.cos(a0) * 9,
        y0 = rcy + Math.sin(a0) * 9,
        x1 = rcx + Math.cos(a1) * 9,
        y1 = rcy + Math.sin(a1) * 9;
      const n = 12;
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / n),
          y = Math.round(y0 + (y1 - y0) * k / n);
        P(g, x, y, glow);
      }
    }
    P(g, rcx, rcy, frame === 1 ? gd[0] : gd[2]);
    // vertical rune column glyphs on each leaf
    [30, 66].forEach(rx => {
      [50, 62, 100].forEach(ry => {
        if (!inDoor(rx, ry)) return;
        P(g, rx, ry, glow);
        P(g, rx - 1, ry + 1, glowDim);
        P(g, rx + 1, ry + 1, glowDim);
        P(g, rx, ry + 2, glow);
      });
    });
    // glow halo on frame 1
    if (frame === 1) for (let yy = -R - 4; yy <= R + 4; yy++) for (let xx = -R - 4; xx <= R + 4; xx++) {
      const d = Math.sqrt(xx * xx + yy * yy);
      if (d > R + 1 && d < R + 4 && (xx + yy) % 2 === 0 && inDoor(rcx + xx, rcy + yy)) P(g, rcx + xx, rcy + yy, gd[3]);
    }
  } else {
    // opening: runes flare and scatter upward
    for (let yy = -R; yy <= R; yy += 2) for (let xx = -R; xx <= R; xx += 2) {
      const d = Math.sqrt(xx * xx + yy * yy);
      if (Math.abs(d - R) < 2) P(g, rcx + xx, rcy + yy, gd[0]);
    }
    for (let i = 0; i < 8; i++) {
      P(g, rcx - 12 + i * 3, rcy - 18 - i % 3 * 3, i % 2 ? gd[0] : dr[1]);
    }
  }
  // big ring handle / knocker (frames 0,1)
  if (frame !== 2) {
    for (let a = 0; a < 16; a++) {
      const th = a / 16 * Math.PI * 2;
      P(g, Math.round(46 + Math.cos(th) * 4), Math.round(106 + Math.sin(th) * 4), gd[2]);
    }
    P(g, 46, 102, gd[1]);
  }
  // threshold
  for (let x = 14; x <= 82; x++) {
    P(g, x, baseY + 1, st[3]);
    P(g, x, baseY + 2, st[2]);
  }
  if (frame === 2) for (let x = 38; x <= 58; x++) {
    P(g, x, baseY + 1, dr[2]);
  } // glow spill on ground
  outline(g, RAMP.void);
  return g;
}

/* ============================ WORDMARK PLATE (320×96, 2 frames) ============================
   Ornate bone-and-gold frame with drift-purple inlay to sit behind NAEVYR. */
function drawWordmarkPlate(frame) {
  frame = frame || 0;
  const W = 320,
    Hh = 96,
    g = makeGrid(W, Hh);
  const bn = RAMP.bone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const x0 = 6,
    x1 = W - 7,
    y0 = 14,
    y1 = Hh - 15;
  // outer bevel plate (bone), inset
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = Math.min(x - x0, x1 - x, y - y0, y1 - y);
    let c = bn[2];
    if (edge < 2) c = bn[3];else if (edge < 4) c = y - y0 < (y1 - y0) / 2 ? bn[1] : bn[2];else if (edge < 5) c = bn[0];else c = null; // hollow center (text sits here)
    if (c) P(g, x, y, c);
  }
  // gold inner rails
  for (let x = x0 + 6; x <= x1 - 6; x++) {
    P(g, x, y0 + 6, gd[1]);
    P(g, x, y1 - 6, gd[2]);
  }
  for (let y = y0 + 6; y <= y1 - 6; y++) {
    P(g, x0 + 6, y, gd[1]);
    P(g, x1 - 6, y, gd[2]);
  }
  // drift-purple inlay dots along the gold rail (pulse on frame 1)
  const lit = frame === 1;
  for (let x = x0 + 12; x <= x1 - 12; x += 12) {
    P(g, x, y0 + 6, lit ? dr[0] : dr[1]);
    P(g, x, y1 - 6, lit ? dr[0] : dr[1]);
    if (lit) {
      P(g, x, y0 + 5, dr[2]);
      P(g, x, y1 - 5, dr[2]);
    }
  }
  // ornate corner flourishes (gold scrollwork)
  function corner(cx, cy, sx, sy) {
    for (let k = 0; k < 10; k++) P(g, cx + sx * k, cy, gd[1]);
    for (let k = 0; k < 10; k++) P(g, cx, cy + sy * k, gd[1]);
    // little curl
    P(g, cx + sx * 9, cy + sy, gd[0]);
    P(g, cx + sx * 10, cy + sy * 2, gd[2]);
    P(g, cx + sx, cy + sy * 9, gd[0]);
    // drift gem at the corner
    P(g, cx + sx * 2, cy + sy * 2, lit ? dr[0] : dr[1]);
    P(g, cx + sx * 3, cy + sy * 2, dr[2]);
    P(g, cx + sx * 2, cy + sy * 3, dr[2]);
  }
  corner(x0 + 4, y0 + 4, 1, 1);
  corner(x1 - 4, y0 + 4, -1, 1);
  corner(x0 + 4, y1 - 4, 1, -1);
  corner(x1 - 4, y1 - 4, -1, -1);
  // center top & bottom finials
  [[x0 + x1 >> 1, y0 - 1, -1], [x0 + x1 >> 1, y1 + 1, 1]].forEach(([fx, fy, dir]) => {
    for (let k = 0; k < 5; k++) {
      const w = 4 - k;
      for (let i = -w; i <= w; i++) P(g, fx + i, fy + dir * k, i === 0 ? gd[0] : gd[1]);
    }
    P(g, fx, fy + dir * 5, lit ? dr[0] : dr[1]);
  });
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const LANDING = {
  hero_vista: {
    fn: drawHeroVista,
    cell: [480, 270],
    anchor: [240, 269],
    frames: 2,
    anim: {
      name: 'shimmer',
      fps: 2
    },
    scene: true
  },
  gate_door: {
    fn: drawGateDoor,
    cell: [96, 128],
    anchor: [48, 127],
    frames: 3,
    anim: {
      name: 'ward',
      fps: 3
    }
  },
  wordmark_plate: {
    fn: drawWordmarkPlate,
    cell: [320, 96],
    anchor: [160, 48],
    frames: 2,
    anim: {
      name: 'inlay',
      fps: 2
    }
  }
};
Object.assign(globalThis, {
  drawHeroVista,
  navIcon,
  NAV_ICONS,
  drawGateDoor,
  drawWordmarkPlate,
  LANDING
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/landing.js", error: String((e && e.message) || e) }); }

// assets/_gen/nodes.js
try { (() => {
// Naevyr resource-node generators — eval after pixlib.js + tiles.js.
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
// Naevyr sprite generator library — evaled inside run_script.
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

// assets/_gen/social.js
try { (() => {
// Naevyr SOCIAL / LAUNCH pack — eval after pixlib.js + tiles.js + fxlogo.js.
// Coin/pfp sigil + widescreen X banner. Rect-grid, RAMP only, 1px void feel,
// dither not blur, deterministic. Export with nearest-neighbor integer upscale.

/* ---- local circle helpers (filled / ring) ---- */
function disc(g, cx, cy, r, fn) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (d <= r) fn(x, y, d);
  }
}
function ring(g, cx, cy, r, w, c) {
  disc(g, cx, cy, r, (x, y, d) => {
    if (d >= r - w) P(g, x, y, c);
  });
}

/* ============================ COIN SIGIL (square, parametric) ============================
   The warded gate rune (triangle-in-circle door sigil) struck in gold on a
   void/drift field, ringed by a thin gold circle like a coin face. Drift
   corruption creeps in from the upper-left rim. Readable at 32px. */
function drawCoinSigil(N, ticker) {
  const g = makeGrid(N, N);
  const cx = (N - 1) / 2,
    cy = (N - 1) / 2;
  const gd = RAMP.gold,
    dr = RAMP.drift,
    st = RAMP.stone;
  const Rrim = N * 0.47; // coin edge
  const Rfield = N * 0.42; // inner field
  const Rsig = N * 0.30; // sigil ring radius

  // --- coin field: dark drift-purple, dithered toward void at the rim, brightest center ---
  disc(g, cx, cy, Rfield, (x, y, d) => {
    const t = d / Rfield; // 0 center .. 1 rim
    let c;
    if (t < 0.4) c = (x + y) % 2 === 0 ? '#241038' : RAMP.void; // calm dark center (contrast)
    else if (t < 0.72) c = (x + y) % 2 === 0 ? dr[4] : '#1a0c2c';else c = (x + y) % 2 === 0 ? dr[4] : RAMP.void;
    P(g, x, y, c);
  });

  // --- struck coin rim: gold ring with bevel (lit top-left, dark bottom-right) ---
  disc(g, cx, cy, Rrim, (x, y, d) => {
    if (d < Rfield - 0.5) return;
    const ang = Math.atan2(y - cy, x - cx);
    const lit = Math.cos(ang + 2.4) > 0; // top-left lit
    let c = lit ? gd[1] : gd[3];
    if (d > Rrim - 1.2) c = RAMP.void; // outer 1px void edge
    else if (d > Rrim - 2.4) c = lit ? gd[0] : gd[2];
    P(g, x, y, c);
  });
  // inner rim hairline
  ring(g, cx, cy, Rfield + 0.6, 1, gd[3]);

  // --- the door sigil: gold ring + triangle (point up) + inner ring + center mote ---
  ring(g, cx, cy, Rsig, Math.max(1, N * 0.012), gd[1]);
  ring(g, cx, cy, Rsig, Math.max(1, N * 0.012), gd[1]);
  // upward triangle inscribed in the sigil ring
  const verts = [0, 1, 2].map(i => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
    return [cx + Math.cos(a) * Rsig * 0.86, cy + Math.sin(a) * Rsig * 0.86];
  });
  function thickLine(x0, y0, x1, y1, c, t) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n,
        y = y0 + (y1 - y0) * i / n;
      for (let oy = 0; oy < t; oy++) for (let ox = 0; ox < t; ox++) P(g, Math.round(x) + ox, Math.round(y) + oy, c);
    }
  }
  const tw = Math.max(1, Math.round(N * 0.018));
  thickLine(verts[0][0], verts[0][1], verts[1][0], verts[1][1], gd[0], tw);
  thickLine(verts[1][0], verts[1][1], verts[2][0], verts[2][1], gd[1], tw);
  thickLine(verts[2][0], verts[2][1], verts[0][0], verts[0][1], gd[1], tw);
  // inner downward triangle ring (second sigil layer, dimmer) + center
  ring(g, cx, cy, Rsig * 0.5, 1, gd[2]);
  disc(g, cx, cy, N * 0.04, (x, y, d) => P(g, x, y, d < N * 0.02 ? dr[0] : dr[1])); // drift-core mote
  // vertical keyhole accent through the triangle
  for (let yy = -Rsig * 0.5; yy <= Rsig * 0.55; yy++) P(g, Math.round(cx), Math.round(cy + yy), (cy + yy | 0) % 2 ? gd[1] : gd[2]);

  // --- drift corruption creeping in from the upper-left rim ---
  const seedN = 911;
  disc(g, cx, cy, Rfield, (x, y, d) => {
    if (d < Rfield - 0.5) return;
    // only upper-left arc
    const ang = Math.atan2(y - cy, x - cx);
    if (Math.cos(ang + 2.4) < 0.25) return;
    if (hash2(x, y, seedN) < 0.6) {
      // tendrils reaching inward
      const reach = 2 + Math.floor(hash2(x, y, seedN + 1) * (N * 0.13));
      for (let k = 0; k < reach; k++) {
        const px = Math.round(x + Math.cos(ang) * -k),
          py = Math.round(y + Math.sin(ang) * -k);
        const fade = 1 - k / reach;
        if ((px + py) % 2 === 0 && hash2(px, py, seedN + 2) < fade * 0.8) P(g, px, py, hash2(px, py, 3) < 0.3 ? dr[1] : dr[3]);
      }
    }
  });
  // a few bright motes drifting off that rim
  const mr = mulberry(seedN);
  for (let i = 0; i < Math.round(N / 8); i++) {
    const a = -Math.PI * 0.95 + mr() * 0.9;
    const rr = Rfield * (0.7 + mr() * 0.28);
    const x = Math.round(cx + Math.cos(a) * rr),
      y = Math.round(cy + Math.sin(a) * rr);
    P(g, x, y, mr() < 0.4 ? dr[0] : dr[1]);
  }

  // --- optional struck ticker legend ($DRIFTS) along the lower field ---
  if (ticker) {
    const tw = 4 + textWidth35('DRIFTS'); // $ (4) + DRIFTS
    const sc = N >= 120 ? 1 : 1;
    const tx = Math.round(cx - tw / 2),
      ty = Math.round(cy + Rsig + N * 0.07);
    // small darkened plinth so gold reads over the dither
    for (let y = ty - 2; y <= ty + 7; y++) for (let x = tx - 3; x <= tx + tw + 2; x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d < Rfield - 1) P(g, x, y, (x + y) % 2 === 0 ? '#160a26' : RAMP.void);
    }
    for (let x = tx - 3; x <= tx + tw + 2; x++) {
      P(g, x, ty - 3, gd[3]);
      P(g, x, ty + 8, gd[3]);
    } // hairline rails
    drawTicker(g, tx, ty, gd[0], RAMP.void);
  }
  return g;
}

/* ============================ COMPACT TAGLINE FONT (3×5) ============================ */
const FONT35 = {
  A: ['010', '101', '111', '101', '101'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  K: ['101', '110', '100', '110', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['101', '111', '111', '111', '101'],
  O: ['010', '101', '101', '101', '010'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  ' ': ['000', '000', '000', '000', '000'],
  $: ['111', '110', '011', '110', '111']
};
// "$DRIFTS" struck in gold with a void shadow + a center keyhole bar on the $.
function drawTicker(g, x0, y0, col, shadow) {
  // $ glyph with a vertical bar extending 1px above & below (true dollar look)
  const dollar = FONT35['$'];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (dollar[y][x] === '1') {
    if (shadow) P(g, x0 + x, y0 + y + 1, shadow);
    P(g, x0 + x, y0 + y, col);
  }
  if (shadow) {
    P(g, x0 + 1, y0 - 1 + 1, shadow);
    P(g, x0 + 1, y0 + 5 + 1, shadow);
  }
  P(g, x0 + 1, y0 - 1, col);
  P(g, x0 + 1, y0 + 5, col);
  return drawText35(g, 'DRIFTS', x0 + 4, y0, col, shadow);
}
function textWidth35(str) {
  let w = 0;
  for (const ch of str.toUpperCase()) w += (FONT35[ch] ? 3 : 3) + 1;
  return w - 1;
}
function drawText35(g, str, x0, y0, col, shadow) {
  let ox = x0;
  for (const ch of str.toUpperCase()) {
    const gl = FONT35[ch];
    if (gl) for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (gl[y][x] === '1') {
      if (shadow) P(g, ox + x, y0 + y + 1, shadow);
      P(g, ox + x, y0 + y, col);
    }
    ox += 4;
  }
  return ox - 1;
}

/* ============================ X BANNER (375×125, 3:1) ============================ */
function drawBanner(centered) {
  const W = 375,
    H = 125,
    g = makeGrid(W, H);
  const dr = RAMP.drift,
    bn = RAMP.bone,
    st = RAMP.stone,
    gd = RAMP.gold;
  const horizon = 92;

  // --- dusk/night sky: stepped dither bands ---
  const bands = [[0, 24, RAMP.void, '#120f1c'], [24, 48, '#120f1c', RAMP.ash], [48, 72, RAMP.ash, '#241d33'], [72, horizon, '#241d33', '#2c2240']];
  bands.forEach(([y0, y1, a, b]) => {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        const dith = (x + y) % 2 === 0 ? t : t - 0.5;
        P(g, x, y, dith > 0.5 ? b : a);
      }
    }
  });

  // --- pale moon, left-high ---
  const mx = 64,
    my = 30;
  disc(g, mx, my, 13, (x, y, d) => {
    let c = bn[2];
    if (x - mx + (y - my) < -5) c = bn[1];
    if (d > 10) c = bn[3];
    P(g, x, y, c);
  });
  // scattered craters (not face-like)
  [[-5, -3, 2], [3, -5, 1], [5, 2, 2], [-2, 4, 1], [-6, 1, 1], [1, -1, 1]].forEach(([ox, oy, r]) => disc(g, mx + ox, my + oy, r, (x, y, d) => {
    if (d <= r) P(g, x, y, '#2c2240');
  }));
  // halo dither
  disc(g, mx, my, 18, (x, y, d) => {
    if (d > 13 && d < 18 && (x + y) % 2 === 0 && hash2(x, y, 71) < 0.4) P(g, x, y, '#2c2240');
  });

  // --- stars (dithered), skip near moon & where text sits ---
  const sr = mulberry(720);
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(sr() * W),
      y = Math.floor(sr() * (horizon - 6));
    if ((x - mx) ** 2 + (y - my) ** 2 < 360) continue;
    P(g, x, y, sr() < 0.25 ? bn[1] : bn[3]);
  }

  // --- Waystation rooftops as a dark horizon line ---
  for (let x = 0; x < W; x++) {
    for (let y = horizon; y < H; y++) {
      let c = y < horizon + 6 ? '#171221' : y < horizon + 18 ? '#100c1a' : RAMP.void;
      P(g, x, y, c);
    }
  }
  // roof silhouettes (varied pitched roofs + a couple towers), dark with rare warm window
  function roof(bx, w, h, warm) {
    const cxr = bx + w / 2;
    for (let x = bx; x < bx + w; x++) {
      const d = Math.abs(x - cxr);
      const ry = horizon - Math.round((w / 2 - d) * h / (w / 2));
      for (let y = ry; y <= horizon; y++) P(g, x, y, '#0d0a16');
    }
    // ridge highlight (faint moonlight)
    for (let x = bx; x < bx + w; x++) {
      const d = Math.abs(x - cxr);
      const ry = horizon - Math.round((w / 2 - d) * h / (w / 2));
      P(g, x, ry, '#1c1729');
    }
    if (warm) {
      const wx = Math.round(cxr) - 1,
        wy = horizon - Math.round(h * 0.4);
      fillRect(g, wx, wy, 2, 2, RAMP.ember[1]);
      P(g, wx, wy + 2, RAMP.ember[2]);
    }
  }
  let bx = -6;
  const roofs = [[28, 14, 1], [22, 10, 0], [30, 18, 1], [18, 9, 1], [26, 13, 0], [34, 20, 1], [20, 10, 0], [24, 12, 1], [30, 15, 0], [22, 11, 1], [28, 14, 0], [18, 9, 1], [32, 17, 1], [24, 12, 0], [40, 8, 0]];
  roofs.forEach(([w, h, warm]) => {
    roof(bx, w, h, warm);
    bx += w - 2;
  });
  // chimneys w/ thin smoke on a couple
  [40, 150, 250].forEach((px, i) => {
    for (let y = horizon - 16; y < horizon - 10; y++) P(g, px, y, '#100c1a');
    for (let k = 0; k < 6; k++) P(g, px + k % 2, horizon - 16 - k, bn[3]);
  });

  // --- Drift corruption bleeding in from BOTH side edges ---
  function edge(side) {
    for (let y = 18; y < H; y++) {
      const reach = Math.round((36 + 22 * Math.sin(y * 0.06 + (side < 0 ? 0 : 1.7))) * (0.45 + 0.55 * (y / H)));
      for (let d = 0; d < reach; d++) {
        const x = side < 0 ? d : W - 1 - d;
        const fade = 1 - d / reach,
          h = hash2(x, y, 73);
        if ((x + y) % 2 === 0 && h < fade * 0.85) P(g, x, y, h < fade * 0.28 ? dr[2] : dr[3]);else if (h < fade * 0.16) P(g, x, y, dr[1]);
        if (d > reach - 2 && h < 0.05) P(g, x, y, dr[1]); // glowing tips
      }
    }
  }
  edge(-1);
  edge(1);
  // drifting motes from both edges
  const pr = mulberry(74);
  for (let i = 0; i < 60; i++) {
    const fromL = i % 2 === 0;
    let x = fromL ? pr() * 110 : W - pr() * 110;
    let y = pr() * H;
    const big = i % 5 === 0;
    P(g, Math.round(x), Math.round(y), big ? dr[0] : dr[1]);
    if (big) P(g, Math.round(x) + 1, Math.round(y), dr[2]);
  }

  // --- wordmark plate (X: slightly right of center to clear the avatar; pump.fun: dead center) ---
  const wm = scaleGrid(wordmarkGrid(false), 2); // ~170 × 24
  const plateW = wm.w + 26,
    plateH = wm.h + 18;
  const px = Math.round((centered ? W * 0.5 : W * 0.545) - plateW / 2),
    py = 34;
  // plate body (bone bevel, hollow center) + gold rails + drift inlay
  for (let y = py; y < py + plateH; y++) for (let x = px; x < px + plateW; x++) {
    const edged = Math.min(x - px, px + plateW - 1 - x, y - py, py + plateH - 1 - y);
    let c = null;
    if (edged < 1) c = RAMP.void;else if (edged < 3) c = y - py < plateH / 2 ? bn[1] : bn[3];else if (edged < 4) c = bn[0];else if (edged < 5) c = bn[3];
    if (c) P(g, x, y, c);
  }
  for (let x = px + 5; x < px + plateW - 5; x++) {
    P(g, x, py + 5, gd[1]);
    P(g, x, py + plateH - 6, gd[2]);
  }
  for (let y = py + 5; y < py + plateH - 5; y++) {
    P(g, px + 5, y, gd[1]);
    P(g, px + plateW - 6, y, gd[2]);
  }
  for (let x = px + 10; x < px + plateW - 8; x += 12) {
    P(g, x, py + 5, dr[1]);
    P(g, x, py + plateH - 6, dr[1]);
  }
  // corner drift gems
  [[px + 4, py + 4], [px + plateW - 5, py + 4], [px + 4, py + plateH - 5], [px + plateW - 5, py + plateH - 5]].forEach(([gx, gy]) => {
    P(g, gx, gy, dr[0]);
    P(g, gx + 1, gy, dr[2]);
    P(g, gx, gy + 1, dr[2]);
  });
  // stamp wordmark into the hollow
  stamp(g, wm, px + (plateW - wm.w) / 2 | 0, py + (plateH - wm.h) / 2 | 0);

  // --- tagline beneath, bone ramp, above bottom 15% (H*0.85 = 106) ---
  const tag = 'THE DRIFT TAKES THE REALM';
  const tw = textWidth35(tag);
  const tx = Math.round(px + plateW / 2 - tw / 2),
    ty = py + plateH + 6;
  drawText35(g, tag, tx, ty, bn[1], RAMP.void);

  // --- $DRIFTS ticker beneath the tagline, gold on the rooftop band ---
  const tkw = 4 + textWidth35('DRIFTS');
  const kx = Math.round(px + plateW / 2 - tkw / 2),
    ky = ty + 8;
  for (let x = kx - 4; x <= kx + tkw + 3; x++) {
    P(g, x, ky - 2, gd[3]);
    P(g, x, ky + 7, gd[3]);
  } // rails
  for (let x = kx - 4; x <= kx + tkw + 3; x++) for (let y = ky - 1; y <= ky + 6; y++) if ((x + y) % 2 === 0) P(g, x, y, '#160a26'); // plinth
  drawTicker(g, kx, ky, gd[0], RAMP.void);
  return g;
}
const SOCIAL = {
  pfp_coin: {
    fn: () => drawCoinSigil(128, true),
    native: [128, 128],
    scale: 8,
    out: [1024, 1024]
  },
  pfp_coin_clean: {
    fn: () => drawCoinSigil(128, false),
    native: [128, 128],
    scale: 8,
    out: [1024, 1024]
  },
  pfp_x: {
    fn: () => drawCoinSigil(100, false),
    native: [100, 100],
    scale: 8,
    out: [800, 800]
  },
  banner_x: {
    fn: () => drawBanner(false),
    native: [375, 125],
    scale: 4,
    out: [1500, 500]
  },
  banner_pumpfun: {
    fn: () => drawBanner(true),
    native: [375, 125],
    scale: 4,
    out: [1500, 500]
  }
};
Object.assign(globalThis, {
  disc,
  ring,
  drawCoinSigil,
  drawBanner,
  drawTicker,
  drawText35,
  textWidth35,
  FONT35,
  SOCIAL
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/social.js", error: String((e && e.message) || e) }); }

// assets/_gen/threshold.js
try { (() => {
// Naevyr "THE THRESHOLD" tutorial micro-set — eval after pixlib.js + tiles.js.
// Rect-grid, RAMP only, 1px void outline, dither not blur, deterministic.
// Gate 96x128 (sealed+open, 3 rune-pulse frames each) · Gatewarden 32x40 (5
// facings, idle 2f) · Objective beacon 64x64 (3f) + arrow pip 16x16 (2f) ·
// Drift wall 64x96 FX (3f, seam-continuous) · ground accents 64x32 (2 variants).

/* ---- local circle / triangle helpers ---- */
function tDisc(g, cx, cy, r, fn) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= r) fn(x, y, d);
  }
}
function tRing(g, cx, cy, r, w, c) {
  tDisc(g, cx, cy, r, (x, y, d) => {
    if (d >= r - w) P(g, x, y, c);
  });
}
function triLine(g, x0, y0, x1, y1, c, t) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n,
      y = y0 + (y1 - y0) * i / n;
    for (let oy = 0; oy < t; oy++) for (let ox = 0; ox < t; ox++) P(g, Math.round(x) + ox, Math.round(y) + oy, c);
  }
}
// the triangle-in-circle door sigil, centered at cx,cy radius R, gold tone set by lit
function gateSigil(g, cx, cy, R, lit) {
  const gd = RAMP.gold,
    dr = RAMP.drift;
  const hi = lit ? gd[0] : gd[3],
    mid = lit ? gd[1] : gd[3],
    dim = lit ? gd[2] : '#5c4a1e';
  tRing(g, cx, cy, R, 1, mid);
  const v = [0, 1, 2].map(i => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
    return [cx + Math.cos(a) * R * 0.84, cy + Math.sin(a) * R * 0.84];
  });
  const tw = Math.max(1, Math.round(R * 0.12));
  triLine(g, v[0][0], v[0][1], v[1][0], v[1][1], hi, tw);
  triLine(g, v[1][0], v[1][1], v[2][0], v[2][1], mid, tw);
  triLine(g, v[2][0], v[2][1], v[0][0], v[0][1], mid, tw);
  tRing(g, cx, cy, R * 0.46, 1, dim);
  for (let yy = -R * 0.44; yy <= R * 0.5; yy++) P(g, Math.round(cx), Math.round(cy + yy), (cy + yy | 0) % 2 ? mid : dim); // keyhole bar
  if (lit) {
    P(g, cx, cy, dr[0]);
    P(g, cx, cy - 1, dr[1]);
    P(g, cx, cy + 1, dr[1]);
  } // drift mote in the eye
}

/* ============================ 1 · THRESHOLD GATE (96x128, sealed/open ×3f) ======== */
function drawThresholdGate(open, frame) {
  const g = makeGrid(96, 128);
  const cx = 48,
    baseY = 122;
  const st = RAMP.stone,
    gd = RAMP.gold,
    dr = RAMP.drift,
    bn = RAMP.bone;
  // pale-stone helper: stone ramp leaned lighter with bone highlights
  function block(x, y, lit) {
    let c = lit ? st[0] : st[1];
    const h = hash2(x, y, 401);
    if (h < 0.05) c = st[2];else if (h < 0.065) c = st[0];else if (h < 0.075) c = bn[2]; // chips + sparse pale highlights
    P(g, x, y, c);
  }
  // foundation slab (iso) under the arch
  const fb = 86,
    fh = 9;
  for (let dy = -fh; dy <= fh; dy++) {
    const t = 1 - Math.abs(dy) / fh,
      w = Math.round(fb / 2 * t);
    for (let dx = -w; dx <= w; dx++) {
      let c = st[2];
      if (dy < 0 && dx < 0) c = st[1];
      if (dy > 2) c = st[3];
      P(g, cx + dx, baseY + dy - 2, c);
    }
  }

  // pillars
  const pw = 16,
    ph = 84,
    lx0 = 12,
    rx0 = 96 - 12 - pw;
  for (const [x0, sideLit] of [[lx0, true], [rx0, false]]) {
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const yy = baseY - 6 - y,
        xx = x0 + x;
      const lit = sideLit ? x < 3 : x < 2;
      // course seams
      let edge = y % 10 === 0 || x === 0 || x === pw - 1;
      block(xx, yy, lit && !edge);
      if (edge) P(g, xx, yy, st[3]);
    }
    // right-side iso depth
    for (let d = 1; d <= 6; d++) for (let y = 0; y < ph; y++) P(g, x0 + pw - 1 + d, baseY - 6 - y - Math.floor(d / 2), st[3]);
  }
  // arch (semicircle spanning the pillars)
  const archCx = cx,
    archCy = baseY - 6 - ph + 4,
    archR = 36;
  tDisc(g, archCx, archCy, archR, (x, y, d) => {
    if (y > archCy) return;
    if (d > archR || d < archR - 16) return;
    const lit = x < archCx;
    let edge = Math.round(d) % 10 < 2 || d > archR - 1.5 || d < archR - 14.5;
    block(x, y, lit && !edge);
    if (edge) P(g, x, y, st[3]);
  });
  // iso depth on arch
  for (let d = 1; d <= 6; d++) tDisc(g, archCx, archCy, archR, (x, y, dd) => {
    if (y > archCy) return;
    if (dd > archR || dd < archR - 16) return;
    if (x < archCx + 8) return;
    P(g, x + d, y - Math.floor(d / 2), st[3]);
  });
  // keystone with the sigil
  gateSigil(g, archCx, archCy - archR + 8, 7, open ? true : false);

  // doorway interior (between pillars, under arch)
  const dl = lx0 + pw,
    dr_ = rx0,
    dtop = archCy,
    dbot = baseY - 6;
  for (let y = dtop; y <= dbot; y++) for (let x = dl; x <= dr_; x++) {
    const underArch = (x - archCx) ** 2 + (y - archCy) ** 2 <= (archR - 16) ** 2 || y >= archCy;
    if (!underArch) continue;
    if (open) {
      // glowing drift-purple void with dither + depth
      const t = (y - dtop) / (dbot - dtop);
      let c = dr[4];
      if ((x + y) % 2 === 0) c = t < 0.5 ? dr[3] : dr[4];
      if (Math.abs(x - cx) < 10 && hash2(x, y + frame, 402) < 0.18) c = dr[2]; // shifting glow
      if (Math.abs(x - cx) < 5 && hash2(x, y - frame * 2, 403) < 0.12) c = dr[1];
      P(g, x, y, c);
    } else {
      // filled with sealed stone blocks
      const lit = x < cx;
      let edge = y % 9 === 0 || (x + Math.floor(y / 9) % 2 * 4) % 8 === 0;
      block(x, y, lit && !edge);
      if (edge) P(g, x, y, st[3]);
    }
  }
  // rune ring around the doorway (pulse across frames)
  const pulse = [0, 1, 2, 1][frame % 4] / 2; // 0 .. 1
  const litRune = open ? true : pulse > 0.4;
  const runeTone = open ? pulse > 0.6 ? gd[0] : gd[1] : pulse > 0.4 ? gd[2] : gd[3];
  // runes set into the pillars + arch inner edge
  const runeSpots = [[dl + 1, dbot - 14], [dl + 1, dbot - 34], [dr_ - 1, dbot - 14], [dr_ - 1, dbot - 34], [cx - 14, dtop + 2], [cx + 14, dtop + 2]];
  runeSpots.forEach(([rx, ry], i) => {
    P(g, rx, ry, runeTone);
    P(g, rx, ry + 1, runeTone);
    P(g, rx + (i % 2 ? 1 : -1), ry, litRune ? runeTone : st[3]);
    P(g, rx, ry - 1, litRune ? gd[3] : st[3]);
  });
  // open: glow spill + escaping motes
  if (open) {
    for (let x = dl; x <= dr_; x++) if ((x + frame) % 3 === 0) P(g, x, dbot + 1, dr[2]);
    const mr = mulberry(404 + frame);
    for (let i = 0; i < 5; i++) {
      const mx = cx + Math.round((mr() - 0.5) * 24),
        my = dtop + Math.round(mr() * (dbot - dtop));
      P(g, mx, my - frame, mr() < 0.4 ? dr[0] : dr[1]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · THE GATEWARDEN (32x40, 5 facings, idle 2f) ====== */
function drawGatewarden(facing, frame) {
  const g = makeGrid(32, 40);
  const cx = 16,
    baseY = 37;
  const bn = RAMP.bone,
    gd = RAMP.gold,
    dr = RAMP.drift,
    st = RAMP.stone;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const off = [0, 1, 2, 1, 0][dir],
    showFace = dir <= 2;
  const sway = frame === 1 ? 1 : 0;
  const top = 8;
  // robe body (bone, tapered, gold hem)
  for (let y = 17; y <= 36; y++) {
    const t = (y - 17) / 19,
      hw = Math.round(3.4 + t * 4.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(sway * 0.5) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = bn[1];
      if (x <= cxx - hw + 1) c = bn[0];
      if (x >= cxx + hw - 1) c = bn[3];
      if (dir >= 3 && x === cxx) c = bn[2];
      if (hash2(x, y, 411) < 0.05) c = bn[2];
      P(g, x, y, c);
    }
  }
  // gold trim down the front + hem
  if (!(dir >= 3)) for (let y = 18; y <= 35; y += 1) P(g, cx + off, y, y % 2 ? gd[1] : gd[2]);
  for (let x = cx + off - 6; x <= cx + off + 6; x++) {
    const v = G(g, x, 36);
    if (v) P(g, x, 36, gd[2]);
  }
  // hood
  for (let y = top; y <= 18; y++) {
    const hy = (y - top) / (18 - top),
      hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.6);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = bn[1];
      if (x === cxx - hw) c = bn[0];
      if (x >= cxx + hw - 1) c = bn[3];
      if (y === top) c = bn[0];
      P(g, x, y, c);
    }
  }
  P(g, cx + off, top - 1, bn[1]);
  // gold trim on hood rim
  for (let x = cx + off - 4; x <= cx + off + 4; x++) {
    const v = G(g, x, 17);
    if (v) P(g, x, 17, gd[2]);
  }
  // hidden face + 2 gold eye glows
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0),
      w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    if (dir === 0) {
      P(g, fcx - 1, ey, gd[0]);
      P(g, fcx + 1, ey, gd[0]);
    } else if (dir === 1) {
      P(g, fcx, ey, gd[0]);
      P(g, fcx + 2, ey, gd[1]);
    } else {
      P(g, fcx + 1, ey, gd[0]);
    }
  }
  // tall iron staff with chained drift mote (mote bobs in idle)
  const stx = cx + off + (dir >= 1 ? 6 : -6);
  for (let y = top - 4; y <= baseY - 1; y++) P(g, stx, y, y % 6 === 0 ? st[3] : st[1]);
  P(g, stx - 1, top - 4, st[2]);
  P(g, stx + 1, top - 4, st[2]); // staff head crook
  P(g, stx, top - 5, st[2]);
  // chain + mote hanging from the head, bobs by frame
  const moteY = top - 1 + sway * 2;
  P(g, stx, top - 3, st[3]);
  P(g, stx, top - 2, st[3]); // chain links
  P(g, stx, moteY, dr[0]);
  P(g, stx - 1, moteY, dr[1]);
  P(g, stx + 1, moteY, dr[1]);
  P(g, stx, moteY + 1, dr[2]);
  P(g, stx, moteY - 1, dr[1]);
  for (let a = 0; a < 6; a++) {
    const ax = stx + [2, 2, -2, -2, 0, 0][a],
      ay = moteY + [0, 1, 0, 1, 2, -2][a];
    if (hash2(ax, ay + frame, 412) < 0.5) P(g, ax, ay, dr[2]);
  } // faint halo
  // feet
  P(g, cx - 3 + (dir >= 1 ? 1 : 0), baseY, RAMP.void);
  P(g, cx + 3 + (dir >= 1 ? 1 : 0), baseY, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · OBJECTIVE BEACON (64x64, 3f) + ARROW (16x16, 2f) */
function drawBeacon(frame) {
  const g = makeGrid(64, 64);
  const cx = 32,
    cy = 48; // diamond center
  const gd = RAMP.gold,
    dr = RAMP.drift;
  const rows = diamondRows();
  // rune-scribed tile (diamond), faint dirt so it reads on grass AND dirt
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const gx = x,
      gy = cy - 16 + y;
    let c = (x + y) % 2 === 0 ? '#2a2032' : '#1b1526';
    P(g, gx, gy, c);
  }
  // gold rune ring scribed on the tile
  tRing(g, cx, cy, 13, 1, gd[2]);
  tRing(g, cx, cy, 13, 1, gd[2]);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    P(g, Math.round(cx + Math.cos(a) * 8), Math.round(cy + Math.sin(a) * 4), gd[1]);
  }
  // diamond edge
  for (let y = 0; y < 32; y++) {
    P(g, rows[y].x0, cy - 16 + y, RAMP.void);
    P(g, rows[y].x1, cy - 16 + y, RAMP.void);
  }
  // rising column of dithered gold light (rise/peak/fall)
  const heights = [22, 34, 14],
    H = heights[frame % 3];
  const peak = frame === 1;
  for (let k = 0; k < H; k++) {
    const y = cy - 4 - k,
      t = k / H;
    const w = Math.max(1, Math.round((1 - t) * 6) + (peak ? 1 : 0));
    for (let x = -w; x <= w; x++) {
      const ax = cx + x;
      const core = Math.abs(x) <= 1;
      if (core) P(g, ax, y, t < 0.3 ? gd[0] : gd[1]);else if ((ax + y + frame) % 2 === 0 && hash2(ax, y, 421) < (1 - t) * 0.9) P(g, ax, y, Math.abs(x) <= 2 ? gd[1] : gd[2]);
    }
  }
  // crowning mote at the peak
  if (peak) {
    P(g, cx, cy - 4 - H, gd[0]);
    P(g, cx, cy - 5 - H, dr[1]);
  }
  return g; // no hard outline — it is light
}
function drawArrowPip(frame) {
  const g = makeGrid(16, 16);
  const cx = 8,
    bob = frame === 1 ? 2 : 0,
    gd = RAMP.gold;
  // chunky down-arrow
  const top = 3 + bob;
  for (let y = 0; y < 5; y++) for (let x = -4 + y; x <= 4 - y; x++) P(g, cx + x, top + y, y < 1 ? gd[0] : gd[1]);
  for (let y = 0; y < 4; y++) for (let x = -2; x <= 2; x++) P(g, cx + x, top - 1 - y, gd[2]); // stem
  for (let x = -2; x <= 2; x++) P(g, cx + x, top - 4, gd[1]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ 4 · DRIFT WALL FX (64x96, 3f, tiles horizontally) === */
function drawDriftWall(frame) {
  const W = 64,
    H = 96,
    g = makeGrid(W, H);
  const dr = RAMP.drift;
  const phase = frame * 1.15;
  for (let x = 0; x < W; x++) {
    // crest silhouette wobbles, PERIODIC across the 64 seam (sin of x/W*2pi)
    const crest = Math.round(H * 0.32 + 9 * Math.sin(x / W * Math.PI * 2 + phase) + 4 * Math.sin(x / W * Math.PI * 4 - phase));
    for (let y = crest; y < H; y++) {
      const below = (y - crest) / (H - crest); // 0 crest .. 1 floor
      const n = hash2(x, (y + frame * 5) % H, 431); // boil noise, scrolls up
      const n2 = hash2(x, ((y - frame * 4) % H + H) % H, 432);
      let c = null;
      if (below > 0.5) {
        // void-dark core w/ purple veins
        c = n < 0.13 ? dr[3] : (x + y) % 2 === 0 && n2 < 0.32 ? dr[4] : RAMP.void;
      } else {
        // boiling purple band
        if ((x + y + frame) % 2 === 0 && n < 0.86) c = n < 0.3 ? dr[2] : dr[3];else if (n2 < 0.22) c = dr[1]; // bright veins
      }
      if (below < 0.1 && n < 0.55) c = n < 0.16 ? dr[0] : dr[1]; // hot crest line
      if (c) P(g, x, y, c);
    }
    // wispy tendrils boiling above the crest (dithered, fade upward)
    for (let k = 1; k <= 9; k++) {
      const y = crest - k;
      if (y >= 0 && (x + y) % 2 === 0 && hash2(x, (y + frame * 6) % H, 433) < (1 - k / 9) * 0.55) P(g, x, y, k < 3 ? dr[2] : dr[3]);
    }
  }
  // escaping motes (periodic seeds so they wrap across the seam)
  for (let i = 0; i < 8; i++) {
    const mx = i * 37 % W;
    const my = ((i * 53 - frame * 7) % H + H) % H;
    P(g, mx, my, i % 3 === 0 ? dr[0] : dr[1]);
  }
  // NOTE: no outline (tiling FX strip; an outline would create seams)
  return g;
}

/* ============================ 5 · THRESHOLD GROUND ACCENT (64x32, 2 variants) ===== */
function drawThresholdTile(variant) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const st = RAMP.stone,
    bn = RAMP.bone,
    gd = RAMP.gold;
  // pale flagstone face
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    let c = (x + y) % 2 === 0 ? '#4a4660' : st[1]; // pale stone dither
    if (y > 22) c = st[2];
    P(g, x, y, c);
  }
  // 3px south lip + void north edge
  for (let x = 0; x < 64; x++) {
    let my = -1;
    for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) {
      my = y;
      break;
    }
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, st[3]);
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      P(g, x, y, RAMP.void);
      break;
    }
  }
  // cracks
  const seed = 440 + variant;
  let cxk = 20 + variant * 16,
    cyk = 8;
  for (let s = 0; s < 18; s++) {
    P(g, cxk, cyk, st[3]);
    if (hash2(cxk, cyk, seed) < 0.5) P(g, cxk, cyk + 1, st[3]);
    cxk += (hash2(cxk, cyk, seed + 1) < 0.5 ? 1 : 0) + 1;
    cyk += hash2(cxk, cyk, seed + 2) < 0.5 ? 1 : 0;
    if (!inDiamond(rows, cxk, cyk)) break;
  }
  // faint gold rune fragments scattered on the face
  const frag = variant === 0 ? [[26, 12], [34, 16], [30, 20]] : [[24, 14], [38, 12], [32, 18], [28, 22]];
  frag.forEach(([fx, fy], i) => {
    if (!inDiamond(rows, fx, fy)) return;
    P(g, fx, fy, gd[2]);
    if (i % 2 === 0) {
      P(g, fx + 1, fy, gd[3]);
    } else {
      P(g, fx, fy + 1, gd[3]);
      P(g, fx + 1, fy, gd[2]);
    }
  });
  return g; // accent overlay; keep its own diamond edge only
}
const THRESHOLD = {
  gate: {
    cell: [96, 128],
    anchor: [48, 127]
  },
  gatewarden: {
    cell: [32, 40],
    anchor: [16, 39]
  },
  beacon: {
    cell: [64, 64],
    anchor: [32, 48]
  },
  arrow_pip: {
    cell: [16, 16],
    anchor: [8, 8]
  },
  drift_wall: {
    cell: [64, 96],
    anchor: [32, 95]
  },
  ground: {
    cell: [64, 36],
    anchor: [32, 16]
  }
};
Object.assign(globalThis, {
  tDisc,
  tRing,
  triLine,
  gateSigil,
  drawThresholdGate,
  drawGatewarden,
  drawBeacon,
  drawArrowPip,
  drawDriftWall,
  drawThresholdTile,
  THRESHOLD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/threshold.js", error: String((e && e.message) || e) }); }

// assets/_gen/tiles.js
try { (() => {
// Naevyr tile generators — eval after pixlib.js.
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
// Naevyr TOWN SET — the Waystation. Eval after pixlib.js (+ tiles.js for hash2).
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

// assets/_gen/walls.js
try { (() => {
// Naevyr INTERIOR WALL SET (corrected) — eval after pixlib.js + tiles.js.
// Skewed parallelogram faces that follow the 2:1 iso diagonal and TILE
// seamlessly. Rect-grid, RAMP only, dither not blur, deterministic.
// One segment = one floor tile's back edge: 32 wide, bottom drops 16 across it.
// Face 48 tall, +6 top cap, +1 void cap edge. Cell 32×72.
//   ne  = bottom edge FALLS left→right  (shadowed back-right face)
//   nw  = bottom edge RISES left→right  (moonlit  back-left  face)
// Tiling: place adjacent segments at +32x,±16y. Textures are wall-relative
// (parallel to the sloped bottom) and horizontally periodic mod 32, so a
// segment's right edge continues onto the next segment's left edge.
// NO left/right void outline (would create seams); only the top cap carries
// the 1px void silhouette.

const W2 = {
  W: 32,
  H: 72,
  B: 55,
  FACE: 48,
  CAP: 6
};
function wall2BottomY(side, x) {
  // exact spec corners: ne (0,B)->(31,B+16); nw (0,B+16)->(31,B)
  return side === 'ne' ? W2.B + Math.round(x * 16 / 31) : W2.B + Math.round((31 - x) * 16 / 31);
}

// place a wall-relative feature pixel: (x, h) where h = rows up from bottom edge
function wfP(g, side, x, h, c) {
  if (x < 0 || x > 31) return;
  P(g, x, wall2BottomY(side, x) - h, c);
}
function drawWall2(side, mat, variant, opt) {
  opt = opt || {};
  const g = makeGrid(W2.W, W2.H);
  const lit = side === 'nw';
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  const base = lit ? ramp[1] : ramp[2];
  const hi = lit ? ramp[0] : ramp[1];
  const sh = lit ? ramp[2] : ramp[3];
  const dk = ramp[3];
  for (let x = 0; x < 32; x++) {
    const by = wall2BottomY(side, x);
    for (let h = 0; h < W2.FACE; h++) {
      const y = by - h;
      let c = base;
      // gentle ambient top-light (h-based → continuous across seams)
      if (h > W2.FACE - 5) c = hi;
      if (mat === 'timber') {
        if (h % 4 === 0) c = sh; // plank seams (wall-relative)
        if (hash2(x, h, 201) < 0.04) c = sh; // grain (periodic mod 32 in x)
      } else if (mat === 'block') {
        const course = Math.floor(h / 6),
          off = course % 2 * 4;
        if (h % 6 === 0) c = sh; // course mortar
        else if ((x + off) % 8 === 0) c = sh; // staggered vertical joints
        if (hash2(x, h, 202) < 0.03) c = lit ? ramp[1] : ramp[3];
      } else {
        // cave — raw rock
        const hh = hash2(x, h, 203);
        if (hh < 0.10) c = sh;else if (hh < 0.14) c = hi;
        if (hash2(x, h, 204) < 0.02) c = dk; // rubble speck
      }
      P(g, x, y, c);
    }
    // top cap (follows the slope), then 1px void cap edge
    const topRow = by - (W2.FACE - 1);
    for (let k = 1; k <= W2.CAP; k++) P(g, x, topRow - k, k < 2 ? lit ? RAMP.stone[1] : RAMP.stone[2] : mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]);
    P(g, x, topRow - W2.CAP - 1, RAMP.void);
    // baseboard trim
    P(g, x, by, dk);
  }

  // ---- feature variants (sit on a single segment; need not tile) ----
  if (variant === 'window') {
    const x0 = 8,
      x1 = 23,
      h0 = 20,
      h1 = 33;
    for (let x = x0; x <= x1; x++) for (let h = h0; h <= h1; h++) {
      let c = RAMP.ember[1];
      if (x === x0 || x === x1 || h === h0 || h === h1) c = RAMP.ember[0];
      if ((x + h) % 2 === 0 && hash2(x, h, 205) < 0.25) c = RAMP.ember[0];
      wfP(g, side, x, h, c);
    }
    for (let x = x0 - 1; x <= x1 + 1; x++) {
      wfP(g, side, x, h1 + 1, RAMP.bone[2]);
      wfP(g, side, x, h0 - 1, RAMP.bone[3]);
    }
    for (let h = h0 - 1; h <= h1 + 1; h++) {
      wfP(g, side, x0 - 1, h, RAMP.bone[2]);
      wfP(g, side, x1 + 1, h, RAMP.bone[3]);
    }
    for (let h = h0; h <= h1; h++) wfP(g, side, 15, h, RAMP.bone[3]); // mullion V
    for (let x = x0; x <= x1; x++) wfP(g, side, x, 26, RAMP.bone[3]); // mullion H
    for (let x = x0 - 1; x <= x1 + 1; x++) wfP(g, side, x, h0 - 2, RAMP.ember[2]); // warm spill below
  } else if (variant === 'banner') {
    const acc = opt.accent || RAMP.drift;
    const bx0 = 12,
      bx1 = 19,
      hTop = 41,
      hBot = 14;
    for (let x = bx0 - 1; x <= bx1 + 1; x++) wfP(g, side, x, hTop + 1, RAMP.dirt[3]); // rod
    for (let x = bx0; x <= bx1; x++) for (let h = hBot; h <= hTop; h++) {
      let c = acc[2];
      if (x === bx0) c = acc[1];
      if (x === bx1) c = acc[3];
      wfP(g, side, x, h, c);
    }
    // notched pennant tail
    for (let x = bx0; x <= bx1; x++) {
      const t = Math.abs(x - (bx0 + bx1) / 2) / ((bx1 - bx0) / 2);
      for (let k = 0; k < Math.round((1 - t) * 5); k++) wfP(g, side, x, hBot - 1 - k, acc[3]);
    }
    // emblem
    const ex = bx0 + bx1 >> 1;
    wfP(g, side, ex, 30, acc[0]);
    wfP(g, side, ex - 1, 29, acc[0]);
    wfP(g, side, ex + 1, 29, acc[0]);
    wfP(g, side, ex, 28, acc[1]);
  } else if (variant === 'seam') {
    let x = 3,
      h = 8;
    const rng = mulberry(206);
    for (let k = 0; k < 44; k++) {
      wfP(g, side, x, h, RAMP.gold[1]);
      if (rng() < 0.5) wfP(g, side, x, h - 1, RAMP.gold[2]);
      if (rng() < 0.3) wfP(g, side, x, h + 1, RAMP.gold[0]); // glint
      x += 1;
      h += rng() < 0.5 ? 1 : rng() < 0.5 ? -1 : 0;
      if (x > 29) break;
      h = Math.max(4, Math.min(W2.FACE - 5, h));
    }
  } else if (variant === 'lantern') {
    const lx = 16,
      lh = 30;
    for (let k = 0; k < 6; k++) wfP(g, side, lx, lh + 4 + k, RAMP.dirt[3]); // bracket up
    for (let h = 0; h < 8; h++) for (let i = -3; i <= 3; i++) {
      let c = RAMP.ember[1];
      if (h === 0 || h === 7) c = RAMP.dirt[3];else if (i <= -2) c = RAMP.ember[2];else if (i >= 2) c = RAMP.ember[0];
      if ((h === 1 || h === 6) && Math.abs(i) === 3) c = RAMP.dirt[3];
      wfP(g, side, lx + i, lh + h, c);
    }
    wfP(g, side, lx, lh, RAMP.ember[0]);
    for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
      const d = Math.abs(xx) + Math.abs(yy);
      if (d > 4 && d < 8 && (xx + yy) % 2 === 0) wfP(g, side, lx + xx, lh + 3 - yy, RAMP.ember[2]);
    }
  }

  // NO global outline (left/right must stay open to tile). Feature frames
  // carry their own edges; the top cap carries the void silhouette.
  return g;
}

// ---- corner wedge (16×72): caps the north junction where nw & ne meet ----
function drawWall2Corner(mat) {
  const g = makeGrid(16, 72);
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  const by = W2.B; // flat high bottom at the corner
  for (let x = 0; x < 16; x++) {
    const litCol = x < 8;
    const base = litCol ? ramp[1] : ramp[2];
    const hi = litCol ? ramp[0] : ramp[1];
    const sh = litCol ? ramp[2] : ramp[3];
    for (let h = 0; h < W2.FACE; h++) {
      const y = by - h;
      let c = base;
      if (x === 7) c = ramp[0]; // corner edge highlight (moonlit seam)
      if (x === 8) c = ramp[3]; // shadow turn
      if (h > W2.FACE - 5) c = hi;
      if (mat === 'timber') {
        if (h % 4 === 0) c = sh;
      } else if (mat === 'block') {
        const course = Math.floor(h / 6),
          off = course % 2 * 4;
        if (h % 6 === 0) c = sh;else if ((x + off) % 8 === 0) c = sh;
      } else {
        const hh = hash2(x, h, 207);
        if (hh < 0.10) c = sh;else if (hh < 0.14) c = hi;
      }
      P(g, x, y, c);
    }
    const topRow = by - (W2.FACE - 1);
    for (let k = 1; k <= W2.CAP; k++) P(g, x, topRow - k, k < 2 ? RAMP.stone[1] : mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]);
    P(g, x, topRow - W2.CAP - 1, RAMP.void);
    P(g, x, by, ramp[3]);
  }
  return g;
}

// corner coords for JSON
function wall2Corners(side) {
  return side === 'ne' ? {
    bottomLeft: [0, 55],
    bottomRight: [31, 71],
    topRight: [31, 23],
    topLeft: [0, 7]
  } : {
    bottomLeft: [0, 71],
    bottomRight: [31, 55],
    topRight: [31, 7],
    topLeft: [0, 23]
  };
}

// registry: key, side, mat, variant
const WALLS2 = [['wall2_timber_nw', 'nw', 'timber', 'plain'], ['wall2_timber_ne', 'ne', 'timber', 'plain'], ['wall2_timber_nw_window', 'nw', 'timber', 'window'], ['wall2_timber_ne_banner', 'ne', 'timber', 'banner'], ['wall2_block_nw', 'nw', 'block', 'plain'], ['wall2_block_ne', 'ne', 'block', 'plain'], ['wall2_block_nw_window', 'nw', 'block', 'window'], ['wall2_block_ne_banner', 'ne', 'block', 'banner'], ['wall2_cave_nw', 'nw', 'cave', 'plain'], ['wall2_cave_ne', 'ne', 'cave', 'plain'], ['wall2_cave_nw_seam', 'nw', 'cave', 'seam'], ['wall2_cave_ne_lantern', 'ne', 'cave', 'lantern']];
const WALLS2_CORNER = ['timber', 'block', 'cave'];
Object.assign(globalThis, {
  W2,
  wall2BottomY,
  drawWall2,
  drawWall2Corner,
  wall2Corners,
  WALLS2,
  WALLS2_CORNER
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/walls.js", error: String((e && e.message) || e) }); }

// assets/_gen/wheelfaces.js
try { (() => {
// NAEVYR — WHEEL FACES (HUD overlay art, DOM-rendered). Eval after pixlib.js +
// tiles.js. Two circular spin-wheel faces, 240×240, 2-frame idle rim shimmer
// (~2fps). Segment order is EXACT (the HUD lands a pointer on a named segment);
// each segment's start angle (degrees, 0 = up/12 o'clock, clockwise) is emitted
// in the JSON. Rect-grid, RAMP only, dither not blur, 1px void on the rim/pointer.

const WHEEL_N = 240,
  WCX = 120,
  WCY = 124; // hub sits a touch low (pointer cap up top)

// pixel disc fill with a per-pixel callback (angle in deg from up, clockwise; radius)
function wheelDisc(g, r0, r1, fn) {
  for (let y = WCY - r1 - 2; y <= WCY + r1 + 2; y++) {
    for (let x = WCX - r1 - 2; x <= WCX + r1 + 2; x++) {
      const dx = x - WCX,
        dy = y - WCY,
        d = Math.sqrt(dx * dx + dy * dy);
      if (d < r0 || d > r1) continue;
      let ang = Math.atan2(dx, -dy) * 180 / Math.PI; // 0 up, clockwise
      if (ang < 0) ang += 360;
      fn(x, y, d, ang);
    }
  }
}
function wheelRing(g, r, w, c) {
  wheelDisc(g, r - w, r, (x, y) => P(g, x, y, c));
}

// shared rim + pointer cap + hub; segDef = [{label, sweep, paint(localT, d, ang)}]
function buildWheel(frame, segs, opt) {
  opt = opt || {};
  const g = makeGrid(WHEEL_N, WHEEL_N);
  const st = RAMP.stone,
    dr = RAMP.drift,
    gd = RAMP.gold;
  const Rseg = 96,
    Rrim = 110;

  // total sweep -> start angles
  let acc = 0;
  const bounds = [];
  segs.forEach(s => {
    bounds.push([acc, acc + s.sweep, s]);
    acc += s.sweep;
  });

  // --- segments ---
  wheelDisc(g, 0, Rseg, (x, y, d, ang) => {
    const seg = bounds.find(b => ang >= b[0] && ang < b[1]) || bounds[bounds.length - 1];
    const localT = (ang - seg[0]) / seg[2].sweep; // 0..1 across the wedge
    const c = seg[2].paint(localT, d / Rseg, ang, x, y);
    if (c) P(g, x, y, c);
    // wedge divider lines (dark spokes)
    for (const b of bounds) {
      const a0 = b[0];
      const da = (ang - a0 + 540) % 360 - 180;
      if (Math.abs(da) < 0.8 && d > 8) P(g, x, y, st[3]);
    }
  });

  // --- ornate stone rim ---
  wheelDisc(g, Rseg, Rrim, (x, y, d, ang) => {
    const lit = Math.cos((ang - 315) * Math.PI / 180) > 0; // top-left lit
    let c = lit ? st[1] : st[3];
    if (d > Rrim - 2) c = RAMP.void; // 1px void outer
    else if (d < Rseg + 2) c = st[3]; // inner lip
    else if (lit && d < Rseg + 5) c = st[0];
    // studs every 30deg
    if (Math.abs((ang % 30 + 30) % 30 - 15) < 1.2 && d > Rseg + 3 && d < Rrim - 3) c = frame ? gd[0] : gd[1];
    P(g, x, y, c);
  });
  // rim shimmer glint (frame-dependent position)
  const glintAng = frame ? 48 : 312;
  wheelDisc(g, Rseg + 2, Rrim - 2, (x, y, d, ang) => {
    const da = (ang - glintAng + 540) % 360 - 180;
    if (Math.abs(da) < 7) P(g, x, y, opt.corrupt ? dr[1] : gd[0]);
  });
  if (opt.corrupt) {
    // drift motes bleeding off the corrupted rim
    const mr = mulberry(frame + 1);
    for (let i = 0; i < 26; i++) {
      const a = mr() * 360 * Math.PI / 180;
      const rr = Rrim + mr() * 12;
      const x = Math.round(WCX + Math.sin(a) * rr),
        y = Math.round(WCY - Math.cos(a) * rr);
      P(g, x, y, mr() < 0.4 ? dr[0] : dr[2]);
      if (mr() < 0.3) P(g, x, y + 1, dr[3]);
    }
  }

  // --- hub ---
  wheelDisc(g, 0, 12, (x, y, d) => {
    let c = dr[3];
    if (d < 9) c = dr[2];
    if (d < 5) c = dr[1];
    if (d < 2) c = dr[0];
    P(g, x, y, c);
  });
  wheelRing(g, 12, 1, RAMP.void);
  wheelRing(g, 13, 1, gd[2]);

  // --- pointer cap at top (gold, void-outlined), overhangs the rim ---
  const py = WCY - Rrim - 2;
  for (let j = 0; j < 16; j++) {
    const w = Math.max(0, 7 - Math.floor(j / 1.4));
    for (let x = -w; x <= w; x++) {
      let c = gd[1];
      if (x < -w + 1) c = gd[0];
      if (x > w - 1) c = gd[3];
      P(g, WCX + x, py + j, c);
    }
  }
  for (let x = -6; x <= 6; x++) P(g, WCX + x, py - 1, gd[2]);
  fillRect(g, WCX - 3, py + 2, 3, 3, gd[0]); // jewel highlight
  // outline the pointer
  solidOutlineRegion(g, WCX - 9, py - 2, 18, 20);
  return {
    g,
    bounds
  };
}
// outline only solid (non-empty) pixels within a sub-rect (keeps motes glow clean)
function solidOutlineRegion(g, x0, y0, w, h) {
  const add = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (G(g, x, y)) continue;
    if (G(g, x + 1, y) || G(g, x - 1, y) || G(g, x, y + 1) || G(g, x, y - 1)) add.push([x, y]);
  }
  add.forEach(p => P(g, p[0], p[1], RAMP.void));
}

/* ---- 1 · WHEEL OF THE DRIFT (gold wheel, 6 segments) ----
   order: house(void 40%/~144deg), coin-poor, coin-rich, jackpot(full gold),
   drift-shard(violet), coin-mid. */
function goldWheelSegs() {
  const st = RAMP.stone,
    gd = RAMP.gold,
    dr = RAMP.drift;
  const coin = rich => (t, d, ang, x, y) => {
    const base = rich ? gd[1] : gd[3];
    let c = (x + y) % 2 === 0 ? base : rich ? gd[2] : RAMP.dirt[2];
    // a struck coin emblem mid-wedge
    if (d > 0.4 && d < 0.72 && Math.abs(t - 0.5) < 0.16) c = rich ? gd[0] : gd[1];
    if (d >= 0.72 && d < 0.78 && Math.abs(t - 0.5) < 0.2) c = gd[3];
    return c;
  };
  return [{
    label: 'house',
    sweep: 144,
    paint: (t, d, ang, x, y) => (x + y) % 2 === 0 ? RAMP.void : st[3]
  },
  // dull void, the 40%
  {
    label: 'coin_poor',
    sweep: 43,
    paint: coin(false)
  }, {
    label: 'coin_rich',
    sweep: 43,
    paint: coin(true)
  }, {
    label: 'jackpot',
    sweep: 43,
    paint: (t, d, ang, x, y) => {
      let c = (x + y) % 2 === 0 ? gd[0] : gd[1];
      if (d > 0.55 && Math.abs(t - 0.5) < 0.22) c = RAMP.bone[0];
      return c;
    }
  }, {
    label: 'drift_shard',
    sweep: 43,
    paint: (t, d, ang, x, y) => {
      let c = (x + y) % 2 === 0 ? dr[2] : dr[3];
      if (d > 0.4 && d < 0.74 && Math.abs(t - 0.5) < 0.12) c = d < 0.57 ? dr[0] : dr[1];
      return c;
    }
  }, {
    label: 'coin_mid',
    sweep: 44,
    paint: coin(false)
  }];
}

/* ---- 2 · THE DRIFT WHEEL (dark gacha, 8 segments) ----
   mostly deep stone/drift; one searing gold-violet "relic" (the 1%, tiny sweep). */
function darkWheelSegs() {
  const st = RAMP.stone,
    dr = RAMP.drift,
    gd = RAMP.gold;
  const dim = violet => (t, d, ang, x, y) => {
    const base = violet ? dr[4] : RAMP.rock ? RAMP.rock : st[3];
    let c = (x + y) % 2 === 0 ? violet ? dr[3] : st[2] : violet ? RAMP.void : st[3];
    if (d > 0.5 && d < 0.7 && Math.abs(t - 0.5) < 0.1) c = violet ? dr[2] : st[1]; // faint rune
    return c;
  };
  const big = 51,
    relic = 9; // 7*51 + 9 = 366 -> normalize by trimming one to 45
  return [{
    label: 'common_a',
    sweep: 51,
    paint: dim(false)
  }, {
    label: 'drift_a',
    sweep: 51,
    paint: dim(true)
  }, {
    label: 'common_b',
    sweep: 51,
    paint: dim(false)
  }, {
    label: 'drift_b',
    sweep: 51,
    paint: dim(true)
  }, {
    label: 'relic',
    sweep: relic,
    paint: (t, d, ang, x, y) => {
      let c = (x + y) % 2 === 0 ? gd[0] : dr[1];
      if (d < 0.5) c = RAMP.bone[0];
      if (d > 0.78) c = gd[2];
      return c;
    }
  }, {
    label: 'common_c',
    sweep: 45,
    paint: dim(false)
  }, {
    label: 'drift_c',
    sweep: 51,
    paint: dim(true)
  }, {
    label: 'common_d',
    sweep: 51,
    paint: dim(false)
  }];
}
function drawGoldWheel(frame) {
  return buildWheel(frame, goldWheelSegs(), {
    corrupt: false
  });
}
function drawDarkWheel(frame) {
  return buildWheel(frame, darkWheelSegs(), {
    corrupt: true
  });
}
const WHEELS = {
  wheel_of_the_drift: {
    fn: drawGoldWheel,
    frames: 2,
    fps: 2,
    ramp: 'gold + stone + drift',
    segsFn: goldWheelSegs
  },
  the_drift_wheel: {
    fn: drawDarkWheel,
    frames: 2,
    fps: 2,
    ramp: 'stone + drift + gold (relic)',
    segsFn: darkWheelSegs
  }
};
Object.assign(globalThis, {
  WHEEL_N,
  WCX,
  WCY,
  wheelDisc,
  wheelRing,
  buildWheel,
  solidOutlineRegion,
  goldWheelSegs,
  darkWheelSegs,
  drawGoldWheel,
  drawDarkWheel,
  WHEELS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/wheelfaces.js", error: String((e && e.message) || e) }); }

// assets/_gen/wilds.js
try { (() => {
// Naevyr THE WILDS PACK — eval after pixlib.js + tiles.js (+ town.js for
// foundation, interiors.js for wallSegment). Rect-grid, RAMP only, 1px void
// auto-outline, dither not blur, deterministic. Moonlit-left/shadowed-right.
// Top 6px of every cell kept clear for labels.

// branching drift vein walk across a mass
function driftVeins(g, x0, y0, count, len, seed) {
  const dr = RAMP.drift,
    rng = mulberry(seed);
  for (let v = 0; v < count; v++) {
    let x = x0 + Math.floor((rng() - 0.5) * 40),
      y = y0 + Math.floor((rng() - 0.5) * 24);
    let dx = rng() < 0.5 ? 1 : -1,
      dy = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < len; k++) {
      if (G(g, x, y)) {
        P(g, x, y, k % 7 === 0 ? dr[1] : dr[2]);
        if (rng() < 0.4) P(g, x, y + 1, dr[3]);
        if (k % 9 === 0) P(g, x, y - 1, dr[0]); // glowing node
      }
      x += dx * (rng() < 0.6 ? 1 : 0);
      y += dy * (rng() < 0.5 ? 1 : 0);
      if (rng() < 0.15) dx = -dx;
      if (rng() < 0.12) dy = -dy;
    }
  }
}
function boneSpikeShape(g, bx, by, h, lean) {
  const bn = RAMP.bone;
  for (let k = 0; k < h; k++) {
    const t = k / h,
      w = Math.max(0, Math.round((1 - t) * 2));
    const sx = bx + Math.round(lean * t * 3);
    for (let i = -w; i <= w; i++) P(g, sx + i, by - k, i < 0 ? bn[0] : i > 0 ? bn[2] : bn[1]);
  }
  P(g, bx, by - h, bn[0]);
}

/* ============================ 1 · HUSK DEN (120×88, 2 frames) ============================ */
function drawHuskDen(frame) {
  frame = frame || 0;
  const g = makeGrid(120, 88);
  const cx = 60,
    baseY = 78;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 4, 50, {
    ash: true
  });
  // low corrupted burrow-mound
  const maxH = 46;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(52 * Math.pow(1 - Math.pow(t, 2.6), 0.5));
    hw += Math.round((hash2(yy, 0, 101) - 0.5) * 6);
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 102);
      let c = RAMP.stone[1];
      if (xx < -hw + 5) c = RAMP.stone[0];else if (xx > hw - 5) c = RAMP.stone[3];else if (h < 0.10) c = RAMP.stone[2];else if (h < 0.13) c = RAMP.stone[0];
      P(g, cx + xx, top, c);
    }
  }
  // drift-purple veining
  driftVeins(g, cx, baseY - 26, 5, 60, 103);
  // dark arched burrow mouth (south)
  const mw = 22,
    mh = 26;
  for (let j = 0; j < mh; j++) for (let i = -mw / 2; i <= mw / 2; i++) {
    const t = Math.abs(i) / (mw / 2);
    if (j < mh * 0.5 * t) continue;
    P(g, cx + i, baseY - j, RAMP.void);
  }
  // faint drift-glow eyes inside
  const bright = frame === 1;
  const ey = baseY - 14;
  [[-5, bright ? RAMP.drift[0] : RAMP.drift[2]], [5, bright ? RAMP.drift[1] : RAMP.drift[3]]].forEach(([ox, c]) => {
    P(g, cx + ox, ey, c);
    P(g, cx + ox + 1, ey, c);
    P(g, cx + ox, ey + 1, bright ? RAMP.drift[2] : RAMP.drift[3]);
    if (bright) {
      P(g, cx + ox, ey - 1, RAMP.drift[2]);
      P(g, cx + ox + 2, ey, RAMP.drift[3]);
      P(g, cx + ox - 1, ey, RAMP.drift[3]);
    }
  });
  // ringed bone spikes jutting out
  [[-44, 6, -0.6], [-30, 9, -0.3], [34, 9, 0.3], [46, 6, 0.6], [-16, 5, -0.2], [20, 6, 0.2]].forEach(([ox, h, ln]) => {
    const bx = cx + ox,
      by = baseY - Math.max(0, Math.round(46 * Math.pow(1 - Math.pow(Math.min(0.99, Math.abs(ox) / 52), 2.6), 0.5)) * 0.2) + 2;
    boneSpikeShape(g, bx, baseY + 1, h + 6, ln);
  });
  // scattered ribs at the base
  const rng = mulberry(104);
  for (let i = 0; i < 5; i++) {
    const rx = cx - 40 + Math.floor(rng() * 80),
      ry = baseY + 2 + Math.floor(rng() * 4);
    for (let k = 0; k < 5; k++) P(g, rx + k, ry - Math.round(Math.sin(k / 5 * Math.PI) * 2), RAMP.bone[2]);
    P(g, rx, ry, RAMP.bone[1]);
    P(g, rx + 5, ry, RAMP.bone[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 2 · ASH OBELISK (64×112, 3 frames) ============================ */
function drawAshObelisk(frame) {
  frame = frame || 0;
  const g = makeGrid(64, 112);
  const cx = 32,
    baseY = 104;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 2, 30, {
    ash: true
  });
  // tapered monolith
  const topY = 14;
  for (let y = baseY; y >= topY; y--) {
    const t = (baseY - y) / (baseY - topY);
    const hw = Math.round(13 - t * 5);
    const skew = Math.round(t * 2); // slight lean
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x + skew;
      let c = RAMP.stone[1];
      if (x < -hw + 2) c = RAMP.stone[0];else if (x > hw - 2) c = RAMP.stone[3];
      if (hash2(sx, y, 111) < 0.06) c = RAMP.stone[2];
      if (hash2(sx, y, 112) < 0.02) c = RAMP.stone[3]; // cracks
      P(g, sx, y, c);
    }
  }
  // weathered chips off the edges
  const rng = mulberry(113);
  for (let i = 0; i < 8; i++) {
    const y = topY + 6 + Math.floor(rng() * (baseY - topY - 12));
    const side = rng() < 0.5 ? -1 : 1;
    const t = (baseY - y) / (baseY - topY);
    const hw = Math.round(13 - t * 5);
    P(g, cx + side * hw + Math.round(t * 2), y, RAMP.void);
    P(g, cx + side * (hw - 1) + Math.round(t * 2), y, RAMP.stone[3]);
  }
  // glowing drift runes down the south face (pulse by frame)
  const lit = [RAMP.drift[2], RAMP.drift[1], RAMP.drift[0]][frame];
  const dim = [RAMP.drift[3], RAMP.drift[2], RAMP.drift[1]][frame];
  const runes = [[0, 30], [-1, 44], [1, 58], [0, 72], [-1, 86]];
  runes.forEach(([ox, ry], i) => {
    const t = (baseY - (baseY - ry)) / (baseY - topY);
    const skew = Math.round(ry / (baseY - topY) * 0);
    const rx = cx + ox;
    const yy = baseY - ry;
    // a small angular rune glyph
    const on = (frame + i) % 3 !== 2;
    const col = on ? lit : dim;
    P(g, rx, yy, col);
    P(g, rx - 1, yy + 1, col);
    P(g, rx + 1, yy + 1, col);
    P(g, rx, yy + 2, col);
    P(g, rx - 1, yy - 1, on ? dim : RAMP.drift[3]);
    P(g, rx + 1, yy - 1, on ? dim : RAMP.drift[3]);
  });
  // drift-crystal shard crown
  const cty = topY - 1;
  for (let k = 0; k < 12; k++) {
    const w = Math.max(0, Math.round((1 - k / 12) * 4));
    for (let i = -w; i <= w; i++) {
      let c = RAMP.drift[2];
      if (i < 0) c = RAMP.drift[1];
      if (i > 0) c = RAMP.drift[3];
      if (i === 0 && k < 8) c = RAMP.drift[0];
      P(g, cx + i, cty - k, c);
    }
  }
  P(g, cx, cty - 12, RAMP.drift[0]);
  // crown glow halo (dither, pulses)
  if (frame >= 1) for (let yy = -10; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 5 && d < (frame === 2 ? 9 : 7) && (xx + yy) % 2 === 0) P(g, cx + xx, cty - 6 + yy, RAMP.drift[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ 3 · MIREWIFE HUT (120×116) ============================ */
function drawMirewifeHut() {
  const g = makeGrid(120, 116);
  const cx = 58,
    baseY = 108;
  // boggy ground (water + dirt iso patch)
  for (let yy = -16; yy <= 16; yy++) for (let xx = -54; xx <= 54; xx++) {
    if ((xx / 54) ** 2 + (yy / 16) ** 2 > 1) continue;
    const h = hash2(cx + xx, baseY + yy, 121);
    let c = RAMP.dirt[2];
    if (h < 0.3) c = RAMP.water[2];else if (h < 0.36) c = RAMP.water[1];
    if (h > 0.93) c = RAMP.grass[2];
    P(g, cx + xx, baseY + yy, c);
  }
  // reed tufts in the bog
  for (let i = 0; i < 8; i++) {
    const rx = cx - 46 + Math.floor(hash2(i, 1, 122) * 92),
      ry = baseY + Math.floor((hash2(i, 2, 122) - 0.5) * 22);
    for (let k = 0; k < 4; k++) P(g, rx, ry - k, RAMP.grass[k > 2 ? 2 : 1]);
    P(g, rx, ry - 4, RAMP.bone[2]);
  }
  const lean = -1; // crooked
  // stilts lifting the hut
  const liftTop = baseY - 26;
  [-26, -10, 10, 26].forEach((ox, i) => {
    const sx = cx + ox;
    const ly = baseY + (i % 2 ? 4 : 2);
    for (let y = liftTop; y <= ly; y++) {
      const skew = Math.round((y - liftTop) * 0.0);
      P(g, sx + skew, y, RAMP.dirt[2]);
      P(g, sx + 1 + skew, y, RAMP.dirt[3]);
    }
    // cross-brace
    P(g, sx, liftTop + 8, RAMP.dirt[3]);
  });
  // hut body (leaning)
  const fw = 60,
    fh = 38,
    x0 = cx - fw / 2,
    ytop = liftTop - fh,
    ybot = liftTop;
  for (let y = ytop; y <= ybot; y++) {
    const sk = Math.round((ybot - y) / fh * lean * 4);
    for (let x = x0; x <= x0 + fw; x++) {
      let c = RAMP.dirt[1];
      if (x <= x0 + 2) c = RAMP.dirt[0];else if (x >= x0 + fw - 2) c = RAMP.dirt[2];
      if ((y - ytop) % 4 === 0) c = RAMP.dirt[3]; // plank seams
      if (hash2(x, y, 123) < 0.05) c = RAMP.dirt[2];
      P(g, x + sk, y, c);
    }
  }
  // right side wall (shadow), receding
  for (let d = 1; d <= 22; d++) for (let y = ytop; y <= ybot; y++) P(g, x0 + fw + d, y - Math.floor(d / 2), d >= 21 ? RAMP.dirt[3] : RAMP.dirt[2]);
  // mossy reed-thatch roof (gable, overhang)
  const ov = 6,
    roofH = 22,
    gx0 = x0 - ov,
    gx1 = x0 + fw + ov,
    rcx = (gx0 + gx1) / 2;
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH,
      hw = (gx1 - gx0) / 2 * t;
    const yy = ytop - roofH + y + Math.round((ybot - (ytop - roofH + y)) / fh * lean * 2);
    for (let x = Math.round(rcx - hw); x <= Math.round(rcx + hw); x++) {
      let c = RAMP.grass[2];
      if (x <= rcx - hw + 2) c = RAMP.grass[1];else if (x >= rcx + hw - 1) c = RAMP.grass[3];
      if (y % 3 === 0) c = RAMP.dirt[3]; // thatch rows
      if (hash2(x, y, 124) < 0.12) c = RAMP.grass[3]; // moss patches
      else if (hash2(x, y, 125) < 0.06) c = RAMP.grass[0];
      P(g, x, yy, c);
    }
  }
  // roof right slope receding
  for (let d = 1; d <= 22 + ov; d++) {
    const ys = Math.floor(d / 2);
    for (let y = 0; y <= roofH; y++) {
      const t = y / roofH;
      const x = Math.round(rcx + d + (gx1 - rcx) * t);
      const yy = Math.round(ytop - roofH - ys + y);
      P(g, x, yy, y % 3 === 0 ? RAMP.dirt[3] : RAMP.grass[3]);
    }
  }
  // ridge
  for (let d = 0; d <= 22 + ov; d++) P(g, Math.round(rcx + d), ytop - roofH - Math.floor(d / 2), RAMP.grass[1]);
  // warm lit window
  const wx = cx - 6,
    wy = ytop + 12;
  for (let j = 0; j < 11; j++) for (let i = 0; i < 11; i++) {
    let c = RAMP.ember[1];
    if (i === 0 || j === 0 || i === 10 || j === 10) c = RAMP.ember[0];
    if ((i + j) % 2 === 0 && hash2(i, j, 126) < 0.3) c = RAMP.ember[0];
    P(g, wx + i, wy + j, c);
  }
  for (let i = -1; i <= 11; i++) {
    P(g, wx + i, wy - 1, RAMP.dirt[3]);
    P(g, wx + i, wy + 11, RAMP.dirt[3]);
  }
  for (let j = -1; j <= 11; j++) {
    P(g, wx - 1, wy + j, RAMP.dirt[3]);
    P(g, wx + 11, wy + j, RAMP.dirt[3]);
  }
  for (let j = 0; j < 11; j++) P(g, wx + 5, wy + j, RAMP.dirt[3]);
  for (let i = 0; i < 11; i++) P(g, wx + i, wy + 5, RAMP.dirt[3]);
  // door
  for (let j = 0; j < 18; j++) for (let i = 0; i < 9; i++) {
    let c = RAMP.dirt[2];
    if (i % 2) c = RAMP.dirt[3];
    if (i === 0) c = RAMP.dirt[1];
    P(g, x0 + 8 + i, ybot - j, c);
  }
  // hanging bone-and-charm strings under the eave
  for (let s = 0; s < 6; s++) {
    const hxr = x0 + 6 + s * 9,
      hy = ytop + 2;
    P(g, hxr, hy, RAMP.dirt[3]);
    for (let k = 1; k < 5 + s % 3; k++) P(g, hxr, hy + k, RAMP.bone[3]);
    const cy = hy + 5 + s % 3;
    if (s % 3 === 0) {
      fillRect(g, hxr - 1, cy, 3, 2, RAMP.bone[1]);
      P(g, hxr - 1, cy + 1, RAMP.void);
      P(g, hxr + 1, cy + 1, RAMP.void);
    } // skull
    else if (s % 3 === 1) {
      P(g, hxr, cy, RAMP.drift[1]);
      P(g, hxr - 1, cy + 1, RAMP.drift[2]);
      P(g, hxr + 1, cy + 1, RAMP.drift[2]);
      P(g, hxr, cy + 2, RAMP.drift[2]);
    } // drift charm
    else {
      for (let k = 0; k < 3; k++) P(g, hxr, cy + k, RAMP.bone[2]);
    } // bone shard
  }
  // rickety stoop (steps down from door)
  for (let s = 0; s < 3; s++) for (let i = 0; i < 12 - s * 2; i++) P(g, x0 + 7 + s + i, ybot + 1 + s * 2, RAMP.dirt[3]), P(g, x0 + 7 + s + i, ybot + 2 + s * 2, RAMP.dirt[2]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ DOODADS ============================ */
function drawReedClump(variant) {
  const g = makeGrid(12, 18);
  const baseY = 16,
    cx = 6;
  const blades = variant ? 6 : 4;
  const rng = mulberry(131 + variant);
  for (let i = 0; i < blades; i++) {
    const bx = cx + Math.floor((rng() - 0.5) * 8),
      h = 9 + Math.floor(rng() * 6),
      lean = (rng() - 0.5) * 2;
    for (let k = 0; k < h; k++) {
      const sx = bx + Math.round(lean * (k / h));
      P(g, sx, baseY - k, k > h - 2 ? RAMP.grass[0] : k < 3 ? RAMP.grass[3] : RAMP.grass[1]);
    }
    if (rng() < 0.6) {
      const sy = baseY - h;
      P(g, bx + Math.round(lean), sy - 1, RAMP.bone[2]);
      P(g, bx + Math.round(lean), sy - 2, RAMP.bone[1]);
    } // seed-head
  }
  outline(g, RAMP.void);
  return g;
}
function drawDeadTree(variant) {
  const g = makeGrid(28, 40);
  const baseY = 38,
    cx = 13;
  const dr = RAMP.dirt;
  // trunk leaning
  const lean = variant ? 0.18 : -0.1;
  for (let y = 0; y < 30; y++) {
    const t = y / 30;
    const w = Math.round(3 - t * 1.5);
    const sx = cx + Math.round(lean * y);
    for (let i = -w; i <= w; i++) P(g, sx + i, baseY - y, i < 0 ? dr[0] : i > 0 ? dr[3] : dr[1]);
  }
  // bare branches
  const rng = mulberry(141 + variant);
  const branch = (x0, y0, dx, dy, n) => {
    let x = x0,
      y = y0;
    for (let k = 0; k < n; k++) {
      P(g, Math.round(x), Math.round(y), dr[2]);
      x += dx;
      y += dy;
      if (rng() < 0.3) P(g, Math.round(x), Math.round(y), dr[3]);
    }
  };
  const tx = cx + Math.round(lean * 24);
  branch(tx, baseY - 24, -0.9, -0.7, 9);
  branch(tx, baseY - 26, 0.95, -0.6, 10);
  branch(tx, baseY - 28, 0.1, -1, 7);
  branch(tx - 6, baseY - 28, -0.7, -0.6, 5);
  branch(tx + 6, baseY - 30, 0.7, -0.5, 5);
  // drift moss tufts
  for (let i = 0; i < (variant ? 5 : 3); i++) {
    const mx = tx + Math.floor((rng() - 0.5) * 18),
      my = baseY - 18 - Math.floor(rng() * 14);
    P(g, mx, my, RAMP.drift[2]);
    if (rng() < 0.5) P(g, mx + 1, my, RAMP.drift[3]);
    P(g, mx, my + 1, RAMP.drift[3]);
  }
  outline(g, RAMP.void);
  return g;
}
function drawBoneSpike(variant) {
  const g = makeGrid(10, 16);
  const baseY = 14,
    cx = variant ? 4 : 5;
  boneSpikeShape(g, cx, baseY, variant ? 11 : 13, variant ? 0.4 : -0.15);
  // a small second rib for variant
  if (variant) boneSpikeShape(g, cx + 3, baseY, 6, 0.6);
  // socket holes
  P(g, cx, baseY - 4, RAMP.bone[3]);
  P(g, cx, baseY - 8, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}
function drawMireBubble(frame) {
  const g = makeGrid(10, 8);
  const cx = 5,
    cy = 5;
  const wa = RAMP.water;
  // flat puddle
  for (let yy = -2; yy <= 2; yy++) for (let xx = -4; xx <= 4; xx++) {
    if ((xx / 4) ** 2 + (yy / 2) ** 2 > 1) continue;
    let c = wa[2];
    if (yy < 0) c = wa[1];
    if (yy <= -1 && xx < 0) c = wa[0];
    P(g, cx + xx, cy + yy, c);
  }
  // bubble swells (frame 0 small, frame 1 big/pop)
  if (frame === 0) {
    P(g, cx, cy - 1, wa[0]);
    P(g, cx, cy, wa[1]);
  } else {
    P(g, cx - 1, cy - 2, wa[0]);
    P(g, cx, cy - 2, wa[0]);
    P(g, cx - 1, cy - 1, wa[1]);
    P(g, cx, cy - 1, wa[1]);
    P(g, cx + 1, cy - 1, wa[1]);
    P(g, cx, cy - 3, RAMP.bone[2]);
    P(g, cx + 2, cy - 2, wa[0]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ INTERIOR ADDITIONS ============================ */
function drawHerbRack() {
  const g = makeGrid(24, 30);
  const baseY = 27,
    x0 = 2,
    top = 6;
  const dr = RAMP.dirt;
  // timber rack frame
  for (let i = 0; i <= 20; i++) {
    P(g, x0 + i, top, dr[1]);
    P(g, x0 + i, top + 1, dr[3]);
  } // top rail
  P(g, x0, top, dr[0]);
  P(g, x0 + 20, top, dr[2]);
  for (let j = top; j < baseY; j++) {
    P(g, x0, j, dr[2]);
    P(g, x0 + 20, j, dr[3]);
  } // posts
  // hanging dried herb bundles + charms
  const items = [[3, RAMP.grass], [7, RAMP.moss || RAMP.grass], [11, RAMP.ember], [15, RAMP.drift], [18, RAMP.grass]];
  items.forEach(([ix, col], i) => {
    const hx = x0 + ix,
      hy = top + 2;
    for (let k = 0; k < 3; k++) P(g, hx, hy + k, RAMP.bone[3]); // string
    const by = hy + 3,
      h = 8 + i % 3 * 2;
    if (i === 3) {
      // drift charm
      P(g, hx, by + 2, RAMP.drift[1]);
      P(g, hx - 1, by + 3, RAMP.drift[2]);
      P(g, hx + 1, by + 3, RAMP.drift[2]);
      P(g, hx, by + 4, RAMP.drift[2]);
    } else {
      for (let k = 0; k < h; k++) {
        const t = k / h,
          w = Math.round(1 + t * 1.5);
        for (let m = -w; m <= w; m++) P(g, hx + m, by + k, m < 0 ? col[1] : m > 0 ? col[3] : col[2]);
      }
      P(g, hx, by + h, col[3]); // tied tip
    }
  });
  outline(g, RAMP.void);
  return g;
}
function drawWallTimberCharms() {
  // plain timber NW wall + bone charms strung across
  const g = wallSegment('nw', 'timber', 'plain', {});
  const bn = RAMP.bone,
    dr = RAMP.drift;
  // a sagging string across the face
  const y0 = 22;
  for (let x = 2; x < 62; x++) {
    const sag = Math.round(Math.sin(x / 64 * Math.PI) * 4);
    P(g, x, y0 + sag, bn[3]);
  }
  // dangling charms
  for (let s = 0; s < 6; s++) {
    const hx = 6 + s * 10,
      sag = Math.round(Math.sin(hx / 64 * Math.PI) * 4),
      hy = y0 + sag;
    for (let k = 1; k < 4 + s % 3; k++) P(g, hx, hy + k, bn[3]);
    const cy = hy + 4 + s % 3;
    if (s % 3 === 0) {
      fillRect(g, hx - 1, cy, 3, 3, bn[1]);
      P(g, hx - 1, cy + 1, RAMP.void);
      P(g, hx + 1, cy + 1, RAMP.void);
    } // skull
    else if (s % 3 === 1) {
      for (let k = 0; k < 4; k++) P(g, hx, cy + k, bn[2]);
      P(g, hx - 1, cy + 2, bn[1]);
    } // bone shard
    else {
      P(g, hx, cy, dr[1]);
      P(g, hx - 1, cy + 1, dr[2]);
      P(g, hx + 1, cy + 1, dr[2]);
      P(g, hx, cy + 2, dr[2]);
    } // drift charm
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ THE LOST TOMBSTONE (16×20) ============================ */
function drawTombstone(sunken) {
  const g = makeGrid(16, 20);
  const bn = RAMP.bone;
  const cx = 8,
    baseY = 18;
  // mound of soil
  for (let xx = -7; xx <= 7; xx++) {
    const t = 1 - Math.abs(xx) / 7;
    const h = Math.round(t * 3);
    for (let k = 0; k < h; k++) P(g, cx + xx, baseY - k, RAMP.dirt[2]);
    P(g, cx + xx, baseY - h, RAMP.dirt[3]);
  }
  const lean = sunken ? 0.5 : 0.18;
  const topY = sunken ? 9 : 2,
    botY = baseY - 2;
  // stone slab (leaning)
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const w = 4;
    const sx = cx + Math.round(lean * (y - botY) * -1); // lean
    for (let i = -w; i <= w; i++) {
      if (y < topY + 4) {
        // rounded top
        const tt = (topY + 4 - y) / 4;
        if (Math.abs(i) > w * (1 - tt * 0.8)) continue;
      }
      let c = bn[2];
      if (i < -w + 1) c = bn[1];
      if (i > w - 1) c = bn[3];
      if (hash2(sx + i, y, 151) < 0.08) c = bn[3];
      P(g, sx + i, y, c);
    }
  }
  // cross/mark
  const msx = cx + Math.round(lean * (topY + 8 - botY) * -1);
  P(g, msx, topY + 6, bn[3]);
  P(g, msx, topY + 7, bn[3]);
  P(g, msx, topY + 8, bn[3]);
  P(g, msx - 1, topY + 7, bn[3]);
  P(g, msx + 1, topY + 7, bn[3]);
  // faint gold glint at the base (only non-sunken)
  if (!sunken) {
    P(g, cx + 4, baseY - 1, RAMP.gold[1]);
    P(g, cx + 4, baseY - 2, RAMP.gold[0]);
    P(g, cx + 5, baseY - 1, RAMP.gold[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRIES ============================ */
const WILDS_STRUCT = {
  husk_den: {
    fn: drawHuskDen,
    cell: [120, 88],
    anchor: [60, 87],
    frames: 2,
    anim: {
      name: 'eyes',
      fps: 2
    }
  },
  ash_obelisk: {
    fn: drawAshObelisk,
    cell: [64, 112],
    anchor: [32, 111],
    frames: 3,
    anim: {
      name: 'pulse',
      fps: 4
    }
  },
  mirewife_hut: {
    fn: drawMirewifeHut,
    cell: [120, 116],
    anchor: [58, 115]
  }
};
const WILDS_DOODAD = {
  reed_clump: {
    fn: drawReedClump,
    cell: [12, 18],
    anchor: [6, 17],
    variants: 2
  },
  dead_tree: {
    fn: drawDeadTree,
    cell: [28, 40],
    anchor: [13, 39],
    variants: 2
  },
  bone_spike: {
    fn: drawBoneSpike,
    cell: [10, 16],
    anchor: [5, 15],
    variants: 2
  },
  mire_bubble: {
    fn: drawMireBubble,
    cell: [10, 8],
    anchor: [5, 7],
    frames: 2,
    anim: {
      name: 'bubble',
      fps: 3
    }
  }
};
Object.assign(globalThis, {
  driftVeins,
  boneSpikeShape,
  drawHuskDen,
  drawAshObelisk,
  drawMirewifeHut,
  drawReedClump,
  drawDeadTree,
  drawBoneSpike,
  drawMireBubble,
  drawHerbRack,
  drawWallTimberCharms,
  drawTombstone,
  WILDS_STRUCT,
  WILDS_DOODAD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/wilds.js", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Naevyr — Badge
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
/* Naevyr — Button
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
/* Naevyr — Panel
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
/* Naevyr — ActivityLog
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
/* Naevyr — Slot
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
/* Naevyr — Hotbar
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
/* Naevyr — XPBar
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
   Naevyr PIXEL ICONS
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
/* Naevyr UI kit — the HUD overlay.
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
/* Naevyr UI kit — representative isometric world backdrop.
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
