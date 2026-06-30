// Naevyr "FILL THE REALM" · AMBIENT WILDLIFE — eval after pixlib.js + tiles.js + beasts.js
// (uses hash2; ell from beasts.js).
//
// Small wandering creatures for movement/life, style-matched to the pet/beast rigs.
// Each: idle + move anims. Flyers are flat (no facings); ground critters carry at least
// left/right (facing 'e' + engine mirror to 'w'). RAMP only, 1px void outline (billboards),
// dither not blur, moonlit-left / shadowed-right, bottom-center anchor.
//
// Registry: { fn(facing, anim, frame), cell:[w,h], anchor:[x,y], facings:[...],
//   mirror:{w:'e',...}|null, anims:[[name,count,fps],...], fly?:{height, shadow:[rx,ry]} }.
// Flyers: the SPRITE is drawn at the top of its cell; the engine offsets it up by fly.height
// and draws a ground shadow (fly.shadow ellipse) at the anchor.

/* ----------------------------- shared critter bits ----------------------------- */
function critterShadow(g, cx, cy, rx, ry) {
  ell(g, cx, cy, rx, ry, (x, y, d) => { if (d > 0.6 && (x + y) % 2) return; P(g, x, y, RAMP.void, 0.45); });
}
// a small dithered wing (for birds/insects), from (x0,y0) sweeping by angle, length L
function wing(g, x0, y0, dx, dy, L, ramp, lead) {
  for (let k = 0; k < L; k++) { const x = Math.round(x0 + dx * k), y = Math.round(y0 + dy * k); P(g, x, y, k < 1 ? ramp[0] : (k > L - 2 ? ramp[2] : ramp[1])); if (lead) P(g, x, y - 1, ramp[0]); }
}

/* =============================== DEER (24×28) =============================== */
// idle 2f, walk 4f, 3 facings s/e/n + mirror. Calm forest deer; tan dirt-ramp coat.
function drawDeer(facing, anim, f) {
  const g = makeGrid(24, 28);
  const co = RAMP.dirt, bn = RAMP.bone, baseY = 26, cx = 12;
  const breath = anim === 'idle' ? (f === 1 ? -1 : 0) : 0;
  const oy = breath;
  // gait: 4-frame walk, alternating diagonal legs
  const swA = anim === 'walk' ? [2, 0, -2, 0][f] : 0;
  const swB = anim === 'walk' ? [-2, 0, 2, 0][f] : 0;
  const headBob = anim === 'walk' ? [0, -1, 0, -1][f] : (anim === 'idle' && f === 1 ? -1 : 0);

  function leg(x, topY, sw, ramp) {
    for (let y = topY; y <= baseY - 1; y++) { const t = (y - topY) / (baseY - topY); P(g, Math.round(x + sw * t), y, y > baseY - 3 ? RAMP.void : ramp[2]); }
  }
  if (facing === 'e') {
    critterShadow(g, cx, baseY, 10, 2);
    // far legs
    leg(cx - 4, 16 + oy, swB, co); leg(cx + 5, 16 + oy, swA, co);
    // barrel
    ell(g, cx, 15 + oy, 8, 5, (x, y, d, dx, dy) => { let c = co[1]; if (dy < -0.3) c = co[0]; if (dy > 0.4) c = co[2]; if (d > 0.78) c = co[2]; P(g, x, y, c); });
    P(g, cx - 6, 17 + oy, bn[1]);   // pale rump/belly
    // tail
    P(g, cx - 8, 13 + oy, co[2]); P(g, cx - 8, 12 + oy, bn[0]);
    // near legs
    leg(cx - 3, 17 + oy, swA, co); leg(cx + 6, 17 + oy, swB, co);
    // neck + head up-right
    for (let k = 0; k < 7; k++) { const x = cx + 6 + Math.round(k * 0.5), y = 14 + oy - k + headBob; for (let i = 0; i < 3; i++) P(g, x + i, y, i === 0 ? co[0] : co[1]); }
    const hx = cx + 11, hy = 8 + oy + headBob;
    ell(g, hx, hy, 2.4, 2, (x, y, d, dx) => { let c = co[1]; if (dx < -0.2) c = co[0]; if (d > 0.7) c = co[2]; P(g, x, y, c); });
    for (let k = 0; k < 3; k++) P(g, hx + 1 + k, hy + 1 + k, co[2]);   // muzzle
    P(g, hx + 3, hy + 3, RAMP.void);                                   // nose
    P(g, hx, hy - 1, RAMP.void);                                       // eye
    // ears + small antler nubs
    P(g, hx - 2, hy - 2, co[2]); P(g, hx + 1, hy - 2, co[1]);
    P(g, hx, hy - 3, bn[3]); P(g, hx + 1, hy - 4, bn[2]);
  } else if (facing === 's') {
    critterShadow(g, cx, baseY, 8, 2);
    leg(cx - 4, 18 + oy, 0, co); leg(cx + 4, 18 + oy, 0, co);
    leg(cx - 2, 18 + oy, swA, co); leg(cx + 2, 18 + oy, swB, co);
    ell(g, cx, 15 + oy, 6, 6, (x, y, d, dx, dy) => { let c = co[1]; if (dx < -0.25) c = co[0]; if (dx > 0.3) c = co[2]; if (d > 0.8) c = co[2]; P(g, x, y, c); });
    P(g, cx, 19 + oy, bn[1]);
    // neck + head toward viewer
    for (let k = 0; k < 5; k++) for (let i = -2; i <= 2; i++) P(g, cx + i, 12 + oy - k + headBob, i < 0 ? co[0] : co[1]);
    const hy = 7 + oy + headBob;
    ell(g, cx, hy, 3, 2.6, (x, y, d, dx) => { let c = co[1]; if (dx < -0.2) c = co[0]; if (d > 0.78) c = co[2]; P(g, x, y, c); });
    P(g, cx, hy + 2, RAMP.void);                                       // nose
    P(g, cx - 2, hy - 1, RAMP.void); P(g, cx + 2, hy - 1, RAMP.void);  // eyes
    P(g, cx - 3, hy - 2, co[2]); P(g, cx + 3, hy - 2, co[1]);          // ears
    P(g, cx - 1, hy - 4, bn[3]); P(g, cx + 1, hy - 4, bn[3]);          // antler nubs
  } else { // n — rear, head away
    critterShadow(g, cx, baseY, 8, 2);
    // small head/neck away at top first
    for (let k = 0; k < 4; k++) for (let i = -1; i <= 1; i++) P(g, cx + i, 9 + oy - k, co[2]);
    ell(g, cx, 7 + oy, 2.2, 2, (x, y, d) => P(g, x, y, d > 0.6 ? co[3] : co[2]));
    P(g, cx - 2, 5 + oy, co[3]); P(g, cx + 2, 5 + oy, co[3]);          // ear backs
    leg(cx - 4, 18 + oy, swA, co); leg(cx + 4, 18 + oy, swB, co);
    leg(cx - 2, 18 + oy, swB, co); leg(cx + 2, 18 + oy, swA, co);
    // rump toward viewer
    ell(g, cx, 15 + oy, 6, 6, (x, y, d, dx, dy) => { let c = co[1]; if (dy < -0.3) c = co[0]; if (Math.abs(dx) > 0.5) c = co[2]; if (d > 0.8) c = co[2]; P(g, x, y, c); });
    P(g, cx, 12 + oy, bn[0]);                                          // white tail flash
    P(g, cx, 13 + oy, bn[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* =============================== RABBIT (14×14) =============================== */
// idle 2f (ear twitch), hop 3f (crouch/leap/land); facing e + mirror.
function drawRabbit(facing, anim, f) {
  const g = makeGrid(14, 14), co = RAMP.bone, dt = RAMP.dirt, baseY = 13, cx = 6;
  const hop = anim === 'hop' ? f : -1;       // 0 crouch, 1 leap (airborne), 2 land
  const lift = hop === 1 ? 3 : 0;            // leap lifts the body
  const stretch = hop === 1 ? 1 : 0;
  const earTw = (anim === 'idle' && f === 1) ? 1 : 0;
  const oy = -lift;
  if (hop !== 1) critterShadow(g, cx + 1, baseY, 5, 1.5);
  else critterShadow(g, cx + 3, baseY, 4, 1);
  // hind feet
  if (hop !== 1) { P(g, cx - 2, baseY - 1, co[2]); P(g, cx - 1, baseY - 1, co[1]); P(g, cx - 2, baseY, dt[3]); }
  // body (crouched egg shape, stretches when leaping)
  ell(g, cx, baseY - 4 + oy, 4 + stretch, 4 - stretch, (x, y, d, dx, dy) => { let c = co[1]; if (dy < -0.3) c = co[0]; if (d > 0.74) c = co[2]; P(g, x, y, c); });
  // head + nose to the right
  const hx = cx + 4 + stretch, hy = baseY - 6 + oy;
  ell(g, hx, hy, 2.2, 2, (x, y, d, dx) => { let c = co[1]; if (dx < -0.2) c = co[0]; if (d > 0.7) c = co[2]; P(g, x, y, c); });
  P(g, hx + 2, hy, RAMP.void);                 // eye
  P(g, hx + 2, hy + 1, dt[2]);                 // nose
  // two tall ears (twitch on idle)
  P(g, hx - 1, hy - 2 - earTw, co[1]); P(g, hx - 1, hy - 3 - earTw, co[2]); P(g, hx - 1, hy - 4 - earTw, co[2]);
  P(g, hx + 1, hy - 2, co[0]); P(g, hx + 1, hy - 3, co[1]); P(g, hx + 1, hy - 4, co[2]);
  // cotton tail
  P(g, cx - 4, baseY - 5 + oy, co[0]); P(g, cx - 4, baseY - 4 + oy, co[1]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== FROG (12×10) =============================== */
// idle 2f (throat puff), hop 2f; facing e + mirror.
function drawFrog(facing, anim, f) {
  const g = makeGrid(12, 10), gr = RAMP.grass, baseY = 9, cx = 6;
  const leap = anim === 'hop' && f === 1;
  const oy = leap ? -2 : 0;
  const puff = (anim === 'idle' && f === 1) ? 1 : 0;
  critterShadow(g, cx, baseY, 5, 1.5);
  // hind legs folded (extend on leap)
  if (leap) { for (let k = 0; k < 4; k++) P(g, cx - 3 - k, baseY - 1, gr[2]); }
  else { P(g, cx - 4, baseY - 1, gr[2]); P(g, cx - 4, baseY - 2, gr[1]); P(g, cx + 4, baseY - 1, gr[2]); }
  // body
  ell(g, cx, baseY - 3 + oy, 4, 3, (x, y, d, dx, dy) => { let c = gr[1]; if (dy < -0.3) c = gr[0]; if (d > 0.74) c = gr[2]; P(g, x, y, c); });
  // throat
  for (let i = -1; i <= 1; i++) P(g, cx + 2 + i, baseY - 1 + oy, gr[0]);
  if (puff) { P(g, cx + 2, baseY + oy, gr[1]); }
  // eyes bulging on top
  P(g, cx - 1, baseY - 6 + oy, gr[0]); P(g, cx - 1, baseY - 7 + oy, RAMP.void);
  P(g, cx + 2, baseY - 6 + oy, gr[0]); P(g, cx + 2, baseY - 7 + oy, RAMP.void);
  P(g, cx, baseY - 5 + oy, gr[2]);             // top of head
  outline(g, RAMP.void);
  return g;
}

/* =============================== SONGBIRD (12×10) =============================== */
// hop 2f, fly 2f; facing e + mirror. Small meadow/woods bird, ember breast.
function drawSongbird(facing, anim, f) {
  const g = makeGrid(12, 10), co = RAMP.stone, em = RAMP.ember, baseY = 9, cx = 6;
  const fly = anim === 'fly';
  const oy = fly ? -2 : (anim === 'hop' && f === 1 ? -1 : 0);
  if (!fly) critterShadow(g, cx, baseY, 4, 1.2);
  // legs (only when grounded)
  if (!fly) { P(g, cx, baseY - 1, em[3]); P(g, cx + 1, baseY - 1, em[3]); }
  // plump body
  ell(g, cx, baseY - 4 + oy, 3, 3, (x, y, d, dx, dy) => { let c = co[1]; if (dy < -0.3) c = co[0]; if (d > 0.74) c = co[2]; P(g, x, y, c); });
  // ember breast
  P(g, cx + 1, baseY - 3 + oy, em[1]); P(g, cx + 2, baseY - 3 + oy, em[0]); P(g, cx + 1, baseY - 2 + oy, em[2]);
  // head + beak
  P(g, cx + 3, baseY - 5 + oy, co[0]); P(g, cx + 4, baseY - 5 + oy, co[1]);
  P(g, cx + 5, baseY - 5 + oy, em[2]);          // beak
  P(g, cx + 4, baseY - 6 + oy, RAMP.void);      // eye-ish dark crown
  P(g, cx + 4, baseY - 5 + oy, RAMP.void);
  // wing — folded (hop) / spread (fly, up or down by frame)
  if (fly) { const up = f === 0; wing(g, cx, baseY - 4 + oy, -1.2, up ? -1 : 1, 4, co, false); }
  else { for (let k = 0; k < 3; k++) P(g, cx - 1 - k, baseY - 4 + oy, co[2]); }
  // tail
  for (let k = 0; k < 3; k++) P(g, cx - 3 - k, baseY - 3 + oy + (fly ? 1 : 0), co[2]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== CROW (16×16, flat flyer) =============================== */
// perch/idle 2f, fly 2f. Ashen Flats / Bonefields. Black bird, drift-glint eye.
function drawCrow(facing, anim, f) {
  const g = makeGrid(16, 16), bk = ['#322b46', '#211c30', '#14101e', '#0a0810'], dr = RAMP.drift, cx = 8;
  const fly = anim === 'fly';
  const cy = fly ? 7 : 10;
  if (anim === 'perch') {
    // perched, folded wings; subtle head turn on f1
    const ht = f === 1 ? 1 : 0;
    P(g, cx, 14, bk[2]); P(g, cx + 1, 14, bk[2]);    // feet
    ell(g, cx, cy, 4, 4, (x, y, d, dx, dy) => { let c = bk[1]; if (dy < -0.3) c = bk[0]; if (d > 0.74) c = bk[2]; P(g, x, y, c); });
    // tail down
    for (let k = 0; k < 4; k++) P(g, cx - 3 - 0, cy + 2 + k, bk[2]);
    // head + beak
    P(g, cx + 3 + ht, cy - 3, bk[0]); P(g, cx + 4 + ht, cy - 3, bk[1]);
    P(g, cx + 5 + ht, cy - 3, bk[3]); P(g, cx + 6 + ht, cy - 3, bk[3]);   // beak
    P(g, cx + 4 + ht, cy - 4, bk[0]);
    P(g, cx + 4 + ht, cy - 3, dr[1]);                 // drift-glint eye
  } else {
    // flying — wings up (f0) / down (f1), body tilted
    ell(g, cx, cy, 3, 2.4, (x, y, d, dx, dy) => { let c = bk[1]; if (dy < -0.3) c = bk[0]; if (d > 0.74) c = bk[2]; P(g, x, y, c); });
    const up = f === 0;
    wing(g, cx - 1, cy, -1.4, up ? -1 : 0.8, 6, bk, false);
    wing(g, cx + 1, cy, 1.4, up ? -1 : 0.8, 6, bk, false);
    // head + beak forward
    P(g, cx + 3, cy - 1, bk[0]); P(g, cx + 4, cy - 1, bk[2]); P(g, cx + 5, cy - 1, bk[3]);
    P(g, cx + 3, cy - 1, dr[2]);
    // tail
    for (let k = 0; k < 3; k++) P(g, cx - 3 - k, cy + 1, bk[2]);
  }
  outline(g, RAMP.void);
  return g;
}

/* =============================== VULTURE (18×16, flat flyer) =============================== */
// glide 2f, flap 2f. Bonefields. Broad dark wings, bone-bald head, blood ruff.
function drawVulture(facing, anim, f) {
  const g = makeGrid(18, 16), co = RAMP.dirt, bn = RAMP.bone, bl = RAMP.blood, cx = 9, cy = 8;
  const flap = anim === 'flap';
  // body
  ell(g, cx, cy, 3, 2.6, (x, y, d, dx, dy) => { let c = co[2]; if (dy < -0.3) c = co[1]; if (d > 0.74) c = co[3]; P(g, x, y, c); });
  // broad wings — glide = near-flat (slight dihedral wobble by f); flap = up/down
  let wy;
  if (glideOrFlap()) wy = flap ? (f === 0 ? -2 : 1) : (f === 0 ? 0 : -1);
  function glideOrFlap() { return true; }
  for (let s = -1; s <= 1; s += 2) {
    for (let k = 1; k <= 7; k++) {
      const x = cx + s * k;
      const y = cy - 1 + Math.round((wy) * (k / 7)) + (k > 4 ? 1 : 0);
      let c = co[2]; if (k <= 2) c = co[1]; if (k > 5) c = co[3];
      P(g, x, y, c);
      if (k > 4) P(g, x, y + 1, RAMP.void);   // finger feather tips
    }
  }
  // bone-bald head + hooked beak + blood ruff
  P(g, cx + 3, cy - 2, bn[2]); P(g, cx + 4, cy - 2, bn[1]);
  P(g, cx + 5, cy - 2, bn[3]); P(g, cx + 5, cy - 1, co[3]);   // hooked beak
  P(g, cx + 3, cy - 2, RAMP.void);                            // eye
  P(g, cx + 1, cy - 1, bl[2]); P(g, cx + 2, cy, bl[3]);       // ruff
  // short tail
  for (let k = 0; k < 3; k++) P(g, cx - 3 - k, cy + 1, co[3]);
  outline(g, RAMP.void);
  return g;
}

/* =============================== DRAGONFLY (12×8, flat flyer) =============================== */
// hover 2f (wing blur), marsh, fast flit. Drift-blue body, bone wings.
function drawDragonfly(facing, anim, f) {
  const g = makeGrid(12, 8), dr = RAMP.drift, wt = RAMP.water, bn = RAMP.bone, cx = 4, cy = 4;
  // long thin abdomen trailing right
  for (let k = 0; k < 7; k++) { let c = wt[1]; if (k % 2) c = dr[2]; if (k > 4) c = wt[2]; P(g, cx + 1 + k, cy, c); }
  P(g, cx + 8, cy, dr[1]);   // tail tip
  // thorax + head
  P(g, cx, cy, dr[1]); P(g, cx - 1, cy, dr[0]);
  P(g, cx - 2, cy, RAMP.void);   // head/eye
  // 4 wings — blurred position alternates per frame
  const up = f === 0;
  // forewings
  wingBlur(cx, cy - 1, up ? -1 : 0);
  wingBlur(cx + 1, cy - 1, up ? -1 : 0);
  function wingBlur(x, y, dy) {
    for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= 3; k++) P(g, x + s * k, y + dy * (k > 1 ? 1 : 0), bn[3]);
  }
  outline(g, RAMP.void);
  // re-lighten wings to read as translucent (no hard void around them is fine; keep subtle)
  return g;
}

/* =============================== FIREFLY (8×8, flat, additive glow) =============================== */
// 2f glow pulse — marsh/meadow at night. Tiny dark body + pulsing gold/drift glow.
function drawFirefly(facing, anim, f) {
  const g = makeGrid(8, 8), gd = RAMP.gold, dr = RAMP.drift, cx = 4, cy = 4;
  const bright = f === 0;
  // glow halo (dithered ring; brighter on f0)
  const r = bright ? 3 : 2;
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
    const d = xx * xx + yy * yy;
    if (d > (r - 0.5) * (r - 0.5) && d <= (r + 0.5) * (r + 0.5) && (xx + yy + f) % 2 === 0) P(g, cx + xx, cy + yy, bright ? gd[2] : dr[3]);
  }
  // body + bright tail lantern
  P(g, cx - 1, cy, RAMP.void); P(g, cx, cy, RAMP.dirt[3]);
  P(g, cx + 1, cy, bright ? gd[0] : gd[1]);
  P(g, cx + 1, cy - 1, bright ? '#fffdf0' : gd[0]);   // lantern core
  P(g, cx, cy + 1, bright ? gd[1] : gd[2]);
  // NO void outline — additive glow reads softer; flat:true
  return g;
}

/* =============================== BUTTERFLY (10×10, flat) =============================== */
// flutter 3f (wings open / mid / closed), meadow day. Drift+gold wings.
function drawButterfly(facing, anim, f) {
  const g = makeGrid(10, 10), dr = RAMP.drift, gd = RAMP.gold, cx = 5, cy = 5;
  // body
  for (let k = -2; k <= 2; k++) P(g, cx, cy + k, RAMP.dirt[3]);
  P(g, cx, cy - 3, RAMP.dirt[2]);
  P(g, cx - 1, cy - 4, RAMP.dirt[2]); P(g, cx + 1, cy - 4, RAMP.dirt[2]);   // antennae
  // wings — spread (f0), mid (f1), nearly closed edge-on (f2)
  const spread = [3, 2, 1][f];
  for (let s = -1; s <= 1; s += 2) {
    for (let wy = -2; wy <= 2; wy++) for (let wx = 1; wx <= spread; wx++) {
      let c = dr[1]; if (Math.abs(wy) >= 2) c = dr[2]; if (wx === 1) c = dr[0];
      if (wy === 0 && wx === spread) c = gd[1];        // gold eyespot
      P(g, cx + s * wx, cy + wy, c);
    }
    // lower wing lobe
    if (f < 2) { P(g, cx + s * 1, cy + 3, dr[2]); P(g, cx + s * 2, cy + 3, dr[2]); }
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const CRITTERS = {
  deer:      { fn: drawDeer,      cell: [24, 28], anchor: [12, 26], facings: ['s', 'e', 'n'], mirror: { w: 'e' }, anims: [['idle', 2, 2], ['walk', 4, 6]] },
  rabbit:    { fn: drawRabbit,    cell: [14, 14], anchor: [6, 13],  facings: ['e'], mirror: { w: 'e' }, anims: [['idle', 2, 2], ['hop', 3, 8]] },
  frog:      { fn: drawFrog,      cell: [12, 10], anchor: [6, 9],   facings: ['e'], mirror: { w: 'e' }, anims: [['idle', 2, 2], ['hop', 2, 6]] },
  songbird:  { fn: drawSongbird,  cell: [12, 10], anchor: [6, 9],   facings: ['e'], mirror: { w: 'e' }, anims: [['hop', 2, 4], ['fly', 2, 8]], fly: { height: 14, shadow: [4, 1.5] } },
  crow:      { fn: drawCrow,      cell: [16, 16], anchor: [8, 14],  facings: ['_'], mirror: null, anims: [['perch', 2, 2], ['fly', 2, 6]], fly: { height: 22, shadow: [5, 2] } },
  vulture:   { fn: drawVulture,   cell: [18, 16], anchor: [9, 8],   facings: ['_'], mirror: null, anims: [['glide', 2, 2], ['flap', 2, 4]], fly: { height: 34, shadow: [7, 2.5] } },
  dragonfly: { fn: drawDragonfly, cell: [12, 8],  anchor: [4, 4],   facings: ['_'], mirror: null, anims: [['hover', 2, 12]], fly: { height: 12, shadow: [3, 1] } },
  firefly:   { fn: drawFirefly,   cell: [8, 8],   anchor: [4, 4],   facings: ['_'], mirror: null, anims: [['pulse', 2, 3]], fly: { height: 16, shadow: [2, 1] }, additive: true, flat: true },
  butterfly: { fn: drawButterfly, cell: [10, 10], anchor: [5, 5],   facings: ['_'], mirror: null, anims: [['flutter', 3, 6]], fly: { height: 14, shadow: [3, 1] } },
};

Object.assign(globalThis, {
  critterShadow, wing,
  drawDeer, drawRabbit, drawFrog, drawSongbird, drawCrow, drawVulture, drawDragonfly, drawFirefly, drawButterfly,
  CRITTERS,
});
