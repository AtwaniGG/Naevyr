// NAEVYR — WHEEL FACES (HUD overlay art, DOM-rendered). Eval after pixlib.js +
// tiles.js. Two circular spin-wheel faces, 240×240, 2-frame idle rim shimmer
// (~2fps). Segment order is EXACT (the HUD lands a pointer on a named segment);
// each segment's start angle (degrees, 0 = up/12 o'clock, clockwise) is emitted
// in the JSON. Rect-grid, RAMP only, dither not blur, 1px void on the rim/pointer.

const WHEEL_N = 240, WCX = 120, WCY = 124;   // hub sits a touch low (pointer cap up top)

// pixel disc fill with a per-pixel callback (angle in deg from up, clockwise; radius)
function wheelDisc(g, r0, r1, fn) {
  for (let y = WCY - r1 - 2; y <= WCY + r1 + 2; y++) {
    for (let x = WCX - r1 - 2; x <= WCX + r1 + 2; x++) {
      const dx = x - WCX, dy = y - WCY, d = Math.sqrt(dx * dx + dy * dy);
      if (d < r0 || d > r1) continue;
      let ang = Math.atan2(dx, -dy) * 180 / Math.PI;  // 0 up, clockwise
      if (ang < 0) ang += 360;
      fn(x, y, d, ang);
    }
  }
}
function wheelRing(g, r, w, c) { wheelDisc(g, r - w, r, (x, y) => P(g, x, y, c)); }

// shared rim + pointer cap + hub; segDef = [{label, sweep, paint(localT, d, ang)}]
function buildWheel(frame, segs, opt) {
  opt = opt || {};
  const g = makeGrid(WHEEL_N, WHEEL_N);
  const st = RAMP.stone, dr = RAMP.drift, gd = RAMP.gold;
  const Rseg = 96, Rrim = 110;

  // total sweep -> start angles
  let acc = 0; const bounds = [];
  segs.forEach(s => { bounds.push([acc, acc + s.sweep, s]); acc += s.sweep; });

  // --- segments ---
  wheelDisc(g, 0, Rseg, (x, y, d, ang) => {
    const seg = bounds.find(b => ang >= b[0] && ang < b[1]) || bounds[bounds.length - 1];
    const localT = (ang - seg[0]) / seg[2].sweep;      // 0..1 across the wedge
    const c = seg[2].paint(localT, d / Rseg, ang, x, y);
    if (c) P(g, x, y, c);
    // wedge divider lines (dark spokes)
    for (const b of bounds) { const a0 = b[0]; const da = ((ang - a0 + 540) % 360) - 180; if (Math.abs(da) < 0.8 && d > 8) P(g, x, y, st[3]); }
  });

  // --- ornate stone rim ---
  wheelDisc(g, Rseg, Rrim, (x, y, d, ang) => {
    const lit = Math.cos((ang - 315) * Math.PI / 180) > 0;   // top-left lit
    let c = lit ? st[1] : st[3];
    if (d > Rrim - 2) c = RAMP.void;                          // 1px void outer
    else if (d < Rseg + 2) c = st[3];                         // inner lip
    else if (lit && d < Rseg + 5) c = st[0];
    // studs every 30deg
    if (Math.abs(((ang % 30) + 30) % 30 - 15) < 1.2 && d > Rseg + 3 && d < Rrim - 3) c = (frame ? gd[0] : gd[1]);
    P(g, x, y, c);
  });
  // rim shimmer glint (frame-dependent position)
  const glintAng = frame ? 48 : 312;
  wheelDisc(g, Rseg + 2, Rrim - 2, (x, y, d, ang) => { const da = ((ang - glintAng + 540) % 360) - 180; if (Math.abs(da) < 7) P(g, x, y, opt.corrupt ? dr[1] : gd[0]); });
  if (opt.corrupt) {
    // drift motes bleeding off the corrupted rim
    const mr = mulberry(frame + 1);
    for (let i = 0; i < 26; i++) { const a = mr() * 360 * Math.PI / 180; const rr = Rrim + mr() * 12; const x = Math.round(WCX + Math.sin(a) * rr), y = Math.round(WCY - Math.cos(a) * rr); P(g, x, y, mr() < 0.4 ? dr[0] : dr[2]); if (mr() < 0.3) P(g, x, y + 1, dr[3]); }
  }

  // --- hub ---
  wheelDisc(g, 0, 12, (x, y, d) => { let c = dr[3]; if (d < 9) c = dr[2]; if (d < 5) c = dr[1]; if (d < 2) c = dr[0]; P(g, x, y, c); });
  wheelRing(g, 12, 1, RAMP.void);
  wheelRing(g, 13, 1, gd[2]);

  // --- pointer cap at top (gold, void-outlined), overhangs the rim ---
  const py = WCY - Rrim - 2;
  for (let j = 0; j < 16; j++) { const w = Math.max(0, 7 - Math.floor(j / 1.4)); for (let x = -w; x <= w; x++) { let c = gd[1]; if (x < -w + 1) c = gd[0]; if (x > w - 1) c = gd[3]; P(g, WCX + x, py + j, c); } }
  for (let x = -6; x <= 6; x++) P(g, WCX + x, py - 1, gd[2]);
  fillRect(g, WCX - 3, py + 2, 3, 3, gd[0]);                  // jewel highlight
  // outline the pointer
  solidOutlineRegion(g, WCX - 9, py - 2, 18, 20);

  return { g, bounds };
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
  const st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift;
  const coin = (rich) => (t, d, ang, x, y) => {
    const base = rich ? gd[1] : gd[3];
    let c = ((x + y) % 2 === 0) ? base : (rich ? gd[2] : RAMP.dirt[2]);
    // a struck coin emblem mid-wedge
    if (d > 0.4 && d < 0.72 && Math.abs(t - 0.5) < 0.16) c = (rich ? gd[0] : gd[1]);
    if (d >= 0.72 && d < 0.78 && Math.abs(t - 0.5) < 0.2) c = gd[3];
    return c;
  };
  return [
    { label: 'house', sweep: 144, paint: (t, d, ang, x, y) => ((x + y) % 2 === 0 ? RAMP.void : st[3]) },   // dull void, the 40%
    { label: 'coin_poor', sweep: 43, paint: coin(false) },
    { label: 'coin_rich', sweep: 43, paint: coin(true) },
    { label: 'jackpot', sweep: 43, paint: (t, d, ang, x, y) => { let c = ((x + y) % 2 === 0) ? gd[0] : gd[1]; if (d > 0.55 && Math.abs(t - 0.5) < 0.22) c = RAMP.bone[0]; return c; } },
    { label: 'drift_shard', sweep: 43, paint: (t, d, ang, x, y) => { let c = ((x + y) % 2 === 0) ? dr[2] : dr[3]; if (d > 0.4 && d < 0.74 && Math.abs(t - 0.5) < 0.12) c = (d < 0.57 ? dr[0] : dr[1]); return c; } },
    { label: 'coin_mid', sweep: 44, paint: coin(false) },
  ];
}

/* ---- 2 · THE DRIFT WHEEL (dark gacha, 8 segments) ----
   mostly deep stone/drift; one searing gold-violet "relic" (the 1%, tiny sweep). */
function darkWheelSegs() {
  const st = RAMP.stone, dr = RAMP.drift, gd = RAMP.gold;
  const dim = (violet) => (t, d, ang, x, y) => {
    const base = violet ? dr[4] : RAMP.rock ? RAMP.rock : st[3];
    let c = ((x + y) % 2 === 0) ? (violet ? dr[3] : st[2]) : (violet ? RAMP.void : st[3]);
    if (d > 0.5 && d < 0.7 && Math.abs(t - 0.5) < 0.1) c = violet ? dr[2] : st[1];   // faint rune
    return c;
  };
  const big = 51, relic = 9;   // 7*51 + 9 = 366 -> normalize by trimming one to 45
  return [
    { label: 'common_a', sweep: 51, paint: dim(false) },
    { label: 'drift_a', sweep: 51, paint: dim(true) },
    { label: 'common_b', sweep: 51, paint: dim(false) },
    { label: 'drift_b', sweep: 51, paint: dim(true) },
    { label: 'relic', sweep: relic, paint: (t, d, ang, x, y) => { let c = ((x + y) % 2 === 0) ? gd[0] : dr[1]; if (d < 0.5) c = RAMP.bone[0]; if (d > 0.78) c = gd[2]; return c; } },
    { label: 'common_c', sweep: 45, paint: dim(false) },
    { label: 'drift_c', sweep: 51, paint: dim(true) },
    { label: 'common_d', sweep: 51, paint: dim(false) },
  ];
}

function drawGoldWheel(frame) { return buildWheel(frame, goldWheelSegs(), { corrupt: false }); }
function drawDarkWheel(frame) { return buildWheel(frame, darkWheelSegs(), { corrupt: true }); }

const WHEELS = {
  wheel_of_the_drift: { fn: drawGoldWheel, frames: 2, fps: 2, ramp: 'gold + stone + drift', segsFn: goldWheelSegs },
  the_drift_wheel:    { fn: drawDarkWheel, frames: 2, fps: 2, ramp: 'stone + drift + gold (relic)', segsFn: darkWheelSegs },
};

Object.assign(globalThis, {
  WHEEL_N, WCX, WCY, wheelDisc, wheelRing, buildWheel, solidOutlineRegion,
  goldWheelSegs, darkWheelSegs, drawGoldWheel, drawDarkWheel, WHEELS,
});
