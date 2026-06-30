// Naevyr FRONTIER INTERACTION SET · CAMPCRAFT — eval after pixlib.js + tiles.js.
// Field workstations at the roadside resource camps + salvage FX. Bottom-center anchors,
// 1px void outline on solids, dither not blur, RAMP only, moonlit-left/shadowed-right.
//   camp_tannery 40×48 idle 2f @2fps  (stretched hides sway)
//   camp_anvil   36×40 ember 2f @4fps (forge coals pulse)
//   camp_cookfire 36×40 flame 3f @4fps (cauldron on a tripod)
//   salvage_glint 16×16 2f @4fps ADDITIVE (no outline) — searchable-wreck twinkle
//   dig_puff     24×20 3f one-shot ADDITIVE — salvage-dig dust burst
function _line(g, x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) P(g, Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c); }

/* ============================ CAMP TANNERY (40×48, idle 2f) ============================ */
function drawCampTannery(f) {
  const g = makeGrid(40, 48);
  const dt = RAMP.dirt, bn = RAMP.bone;
  const baseY = 47, sway = f === 1 ? 1 : 0;
  // A-frame rack posts + top rail
  for (const px of [5, 33]) { for (let y = 8; y <= baseY; y++) { P(g, px, y, dt[2]); P(g, px + 1, y, dt[3]); } }
  for (let x = 4; x <= 35; x++) { P(g, x, 8, dt[3]); P(g, x, 9, dt[2]); }
  // pegged hides — bottoms sway on f1
  function hide(x0, w, h, tone) {
    for (let y = 0; y < h; y++) {
      const ww = Math.round(w * (0.6 + 0.4 * Math.sin((y / h) * Math.PI)));
      const s = y > h - 7 ? sway : 0;
      for (let x = -ww; x <= ww; x++) { let c = tone[2]; if (x <= -ww + 1) c = tone[1]; if (x >= ww - 1) c = tone[3]; if (hash2(x0 + x, y, 990) < 0.06) c = tone[3]; P(g, x0 + x + s, 10 + y, c); }
    }
    for (const dx of [-2, 0, 2]) P(g, x0 + dx, 9, bn[1]);   // pegs
  }
  hide(11, 4, 26, bn);
  hide(21, 5, 30, dt);
  hide(30, 3, 20, bn);
  // scraping beam in front
  for (let x = 8; x <= 31; x++) P(g, x, baseY - 2, dt[3]);
  P(g, 8, baseY - 1, dt[3]); P(g, 31, baseY - 1, dt[3]);
  // a curved scraper blade resting on the beam
  P(g, 18, baseY - 3, bn[1]); P(g, 19, baseY - 4, bn[2]); P(g, 20, baseY - 3, bn[1]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ CAMP ANVIL (36×40, ember 2f) ============================ */
function drawCampAnvil(f) {
  const g = makeGrid(36, 40);
  const st = RAMP.stone, dt = RAMP.dirt, em = RAMP.ember;
  const baseY = 39, hot = f === 1;
  // low open coal forge (left), stone ring
  for (let y = 0; y < 8; y++) { const w = 8 - Math.floor(y / 2); for (let x = -w; x <= w; x++) { let c = st[2]; if (x <= -w + 1) c = st[1]; if (x >= w - 1) c = st[3]; P(g, 10 + x, baseY - y, c); } }
  // glowing coal bed
  for (let x = -5; x <= 5; x++) for (let yy = 0; yy < 3; yy++) { if (hash2(x, yy, 1001) < 0.6) { let c = hot ? em[0] : em[2]; if (hash2(x, yy, 1002) < 0.4) c = hot ? em[1] : em[3]; P(g, 10 + x, baseY - 6 + yy, c); } }
  for (let yy = -4; yy <= 0; yy++) for (let xx = -4; xx <= 4; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 2 && d < 5 && (xx + yy) % 2 === 0) P(g, 10 + xx, baseY - 8 + yy, hot ? em[1] : em[2]); }
  if (hot) { P(g, 8, baseY - 11, em[2]); P(g, 12, baseY - 12, em[1]); }   // rising sparks
  // anvil on a stump (right)
  for (let y = 0; y < 7; y++) for (let x = -4; x <= 4; x++) { let c = dt[2]; if (x <= -3) c = dt[1]; if (x >= 3) c = dt[3]; P(g, 26 + x, baseY - y, c); }
  const ay = baseY - 7;
  for (let x = -6; x <= 4; x++) P(g, 26 + x, ay - 3, st[1]);    // top face
  for (let x = -5; x <= 3; x++) P(g, 26 + x, ay - 2, st[2]);
  for (let x = -2; x <= 1; x++) P(g, 26 + x, ay - 1, st[2]);    // waist
  for (let x = -3; x <= 2; x++) P(g, 26 + x, ay, st[3]);        // base
  P(g, 19, ay - 3, st[2]); P(g, 18, ay - 2, st[3]);            // horn
  // hammer resting on the anvil
  P(g, 24, ay - 4, dt[2]); P(g, 23, ay - 5, dt[1]);
  fillRect(g, 21, ay - 6, 3, 2, st[3]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ CAMP COOKFIRE (36×40, flame 3f) ============================ */
function drawCampCookfire(f) {
  const g = makeGrid(36, 40);
  const st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold, dt = RAMP.dirt;
  const baseY = 39, cx = 18, ay = baseY - 23;   // tripod apex
  // stone fire ring
  for (let x = -9; x <= 9; x++) if (Math.abs(x) > 5 && hash2(x, 0, 1010) < 0.85) { P(g, cx + x, baseY, st[2]); P(g, cx + x, baseY - 1, st[3]); }
  for (let x = -5; x <= 5; x++) P(g, cx + x, baseY - 1, dt[3]);   // logs
  P(g, cx - 4, baseY - 2, dt[2]); P(g, cx + 4, baseY - 2, dt[2]);
  // flames (3-frame, lick up under the cauldron)
  const flh = [6, 8, 7][f];
  for (let k = 0; k < flh; k++) {
    const w = Math.max(0, Math.round((1 - k / flh) * 4));
    const wob = Math.round(Math.sin(k * 0.9 + f * 1.3) * 1.2);
    for (let i = -w; i <= w; i++) { let c = em[1]; if (k < flh * 0.4) c = em[0]; if (i === 0 && k < flh * 0.7) c = gd[0]; if (k > flh * 0.7) c = em[2]; P(g, cx + i + wob, baseY - 2 - k, c); }
  }
  P(g, cx + 2 + f, baseY - flh - 1, em[2]); P(g, cx - 1, baseY - flh - 2, gd[0]);   // sparks
  // iron tripod legs
  _line(g, cx - 9, baseY - 1, cx, ay, st[2]);
  _line(g, cx + 9, baseY - 1, cx, ay, st[3]);
  _line(g, cx, baseY - 3, cx, ay, st[2]);
  P(g, cx, ay - 1, st[3]);
  // cauldron hung from the apex over the flame
  const cy = baseY - 15;
  for (let y = 0; y < 8; y++) { const w = (y < 2) ? 5 : (y > 6 ? 3 : 6 - Math.floor(y / 4)); for (let x = -w; x <= w; x++) { let c = st[2]; if (x <= -w + 1) c = st[1]; if (x >= w - 1) c = st[3]; if (y === 0) c = st[3]; P(g, cx + x, cy + y, c); } }
  for (let x = -5; x <= 5; x++) P(g, cx + x, cy - 1, st[3]);     // rim
  _line(g, cx, ay, cx, cy - 1, st[3]);                          // hook chain
  P(g, cx - 1, cy, gd[1]); P(g, cx + 2, cy, gd[2]);             // contents
  outline(g, RAMP.void);
  return g;
}

/* ============================ SALVAGE GLINT (16×16, 2f, ADDITIVE) ============================ */
function drawSalvageGlint(f) {
  const g = makeGrid(16, 16);
  const gd = RAMP.gold, dr = RAMP.drift;
  const cx = 8, cy = 9, big = f === 0, r = big ? 3 : 2;
  for (let k = -r; k <= r; k++) { P(g, cx + k, cy, k === 0 ? gd[0] : gd[1]); P(g, cx, cy + k, k === 0 ? gd[0] : gd[1]); }
  P(g, cx, cy, gd[0]);
  if (big) { P(g, cx + 1, cy, gd[0]); P(g, cx, cy - 1, gd[0]); P(g, cx - r - 1, cy, gd[3]); P(g, cx + r + 1, cy, gd[3]); P(g, cx, cy - r - 1, gd[3]); }
  P(g, cx - 1, cy - 1, dr[1]); P(g, cx + 1, cy + 1, dr[1]);     // drift-tinted diagonals
  // ADDITIVE — no outline
  return g;
}

/* ============================ DIG PUFF (24×20, 3f one-shot, ADDITIVE) ============================ */
function drawDigPuff(f) {
  const g = makeGrid(24, 20);
  const bn = RAMP.bone, dt = RAMP.dirt;
  const cx = 12, by = 18, r = [3, 7, 10][f];
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI;                 // upper hemisphere
    const rr = r * (0.55 + 0.45 * hash2(a, f, 1030));
    const x = Math.round(cx + Math.cos(ang) * rr * 1.2);
    const y = Math.round(by - Math.sin(ang) * rr);
    if (hash2(a, f, 1031) < 0.25 + 0.18 * f) continue;
    const c = f === 0 ? dt[1] : (f === 1 ? bn[2] : bn[3]);
    P(g, x, y, c);
    if (f === 0) P(g, x, y + 1, dt[2]);
  }
  if (f < 2) { P(g, cx - 2, by - 2, dt[2]); P(g, cx + 3, by - 3, dt[3]); }   // central debris bits
  // ADDITIVE — no outline
  return g;
}

/* ============================ REGISTRY ============================ */
const CAMPCRAFT = {
  camp_tannery:  { fn: (f) => drawCampTannery(f),  cell: [40, 48], anchor: [20, 47], frames: 2, anim: ['idle', 2, true],   solid: true,  labelClear: true, desc: 'Drying rack of pegged hides beside a scraping frame' },
  camp_anvil:    { fn: (f) => drawCampAnvil(f),    cell: [36, 40], anchor: [18, 39], frames: 2, anim: ['ember', 4, true],  solid: true,  labelClear: true, desc: 'Field anvil + low open coal forge, hammer resting on it' },
  camp_cookfire: { fn: (f) => drawCampCookfire(f), cell: [36, 40], anchor: [18, 39], frames: 3, anim: ['flame', 4, true],  solid: true,  labelClear: true, desc: 'Cauldron on an iron tripod over a fire — shrine/hearth flame language' },
  salvage_glint: { fn: (f) => drawSalvageGlint(f), cell: [16, 16], anchor: [8, 12],  frames: 2, anim: ['twinkle', 4, true], additive: true, outline: false, desc: 'Drift-gold twinkle marking a searchable wreck' },
  dig_puff:      { fn: (f) => drawDigPuff(f),      cell: [24, 20], anchor: [12, 18], frames: 3, anim: ['burst', 4, false], additive: true, outline: false, desc: 'Dust/debris burst for a salvage dig (one-shot)' },
};

Object.assign(globalThis, {
  drawCampTannery, drawCampAnvil, drawCampCookfire, drawSalvageGlint, drawDigPuff, CAMPCRAFT,
});
