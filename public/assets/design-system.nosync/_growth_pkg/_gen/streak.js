// Naevyr STREAK SET — retention HUD art, DOM-rendered like the brand/landing set.
// eval after pixlib.js. Clean SVG sheets + JSON frame tables, CSS steps()
// friendly. Object glyphs get the 1px void outline (these are HUD art, not FX).

/* ============================ STREAK EMBER (24×24, 4f flicker @6fps) ============================
   A small flame marking an ACTIVE login streak. gold (hot core) → ember (body). */
function drawStreakEmber(frame) {
  frame = frame || 0;
  const g = makeGrid(24, 24);
  const gd = RAMP.gold, em = RAMP.ember, bn = RAMP.bone;
  const cx = 12, baseY = 20;
  const tall = [0, 2, 1, 2][frame];                 // tongue height flicker
  const sway = [0, 1, 0, -1][frame];                // tip sway
  const h = 12 + tall;

  // teardrop flame body — width tapers base→tip
  for (let yy = 0; yy < h; yy++) {
    const t = yy / h;
    const half = Math.max(1, Math.round((1 - t) * 4 + 1));
    const tipShift = Math.round(sway * t);
    const y = baseY - yy;
    for (let xx = -half; xx <= half; xx++) {
      const x = cx + xx + tipShift;
      const edge = Math.abs(xx) / (half + 0.001);
      let c;
      if (edge > 0.7) c = em[2];                     // outer dim ember
      else if (edge > 0.4) c = em[1];                // mid ember
      else c = t < 0.6 ? gd[0] : gd[1];              // hot gold core
      if (xx === 0 && t < 0.32) c = bn[0];           // white-hot center base
      P(g, x, y, c);
    }
  }
  // base coals
  for (let xx = -4; xx <= 4; xx++) if ((xx + frame) % 2 === 0) P(g, cx + xx, baseY + 1, xx % 2 ? em[2] : em[3]);
  P(g, cx - 2, baseY, em[1]); P(g, cx + 2, baseY, em[2]);
  // rising spark
  const sparkY = baseY - h - 1 - (frame % 2);
  if (sparkY > 0) P(g, cx + sway, sparkY, gd[0]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ STREAK PIP (16×16, 2 states) ============================
   One faceted gem pip. unlit = bone (dim), lit = gold (bright). The HUD tiles 7
   of these into a 120×16 week meter (stride 17px, 2px pad) lighting 1..7. */
function drawStreakPip(lit) {
  const g = makeGrid(16, 16);
  const ramp = lit ? RAMP.gold : RAMP.bone;
  const cx = 8, cy = 8, R = 5;
  for (let yy = -R; yy <= R; yy++) {
    const half = R - Math.abs(yy);
    for (let xx = -half; xx <= half; xx++) {
      let c = yy < 0 ? ramp[1] : yy === 0 ? ramp[1] : ramp[2];
      if (yy < -1 && xx <= 0) c = ramp[0];           // upper-left highlight facet
      if (Math.abs(xx) === half) c = ramp[2];        // edge facet
      P(g, cx + xx, cy + yy, c);
    }
  }
  P(g, cx, cy, ramp[0]);
  if (lit) { P(g, cx - 1, cy - 1, RAMP.bone[0]); P(g, cx + 2, cy + 2, RAMP.gold[3]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ MILESTONE SEALS (32×32) ============================
   Wax-seal medallions for reward popups. day-7 = gold wax, day-30 = drift wax
   (the signature accent, for the rarer reward). Emblem-adjacent: a Drift mote in
   a recessed field above an embossed numeral, scalloped wax rim, ribbon tails. */
const SEAL_DIGITS = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '3': ['###', '..#', '.##', '..#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
};
function drawSealNumber(g, str, cx, topY, face, shadow) {
  let totalW = str.length * 3 + (str.length - 1);
  let ox = Math.round(cx - totalW / 2);
  for (const ch of str) {
    const rows = SEAL_DIGITS[ch];
    if (rows) for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) {
      if (rows[y][x] === '#') { P(g, ox + x, topY + y + 1, shadow); P(g, ox + x, topY + y, face); }
    }
    ox += 4;
  }
}
function drawMilestoneSeal(days) {
  const g = makeGrid(32, 32);
  const wax = days >= 30 ? RAMP.drift : RAMP.gold;
  const rimHi = wax[0], rimMid = wax[1], rimSh = wax[2], deep = wax[3] || wax[2];
  const cx = 16, cy = 16, R = 13, scallops = 12;
  for (let yy = -R - 1; yy <= R + 1; yy++) for (let xx = -R - 1; xx <= R + 1; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    const ang = Math.atan2(yy, xx);
    const edge = R + Math.cos(ang * scallops) * 1.2;     // scalloped boundary
    if (d > edge) continue;
    let c = rimMid;
    if (d > edge - 2) c = rimSh;                          // outer rim shade
    else if (yy < -3 && d < edge - 2) c = rimHi;          // upper highlight
    else if (d < 6) c = deep;                             // recessed center field
    else if (d < 8) c = rimSh;
    P(g, cx + xx, cy + yy, c);
  }
  // drift mote in the recess (signature accent — always purple)
  const dr = RAMP.drift;
  P(g, cx, cy - 3, dr[0]); P(g, cx - 1, cy - 2, dr[1]); P(g, cx + 1, cy - 2, dr[1]); P(g, cx, cy - 2, dr[0]); P(g, cx, cy - 1, dr[2]);
  // embossed numeral
  drawSealNumber(g, String(days), cx, cy + 1, RAMP.bone[0], RAMP.void);
  // ribbon tails
  P(g, cx - 5, cy + R - 1, rimSh); P(g, cx - 6, cy + R + 1, rimSh); P(g, cx - 5, cy + R + 1, deep);
  P(g, cx + 5, cy + R - 1, rimSh); P(g, cx + 6, cy + R + 1, rimSh); P(g, cx + 5, cy + R + 1, deep);
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const STREAK = {
  streak_ember: { fn: drawStreakEmber, cell: [24, 24], anchor: [12, 21], frames: 4, anim: { name: 'flicker', fps: 6, loop: true }, dom: true },
  streak_pip: { fn: drawStreakPip, cell: [16, 16], anchor: [8, 8], frames: 2, states: ['unlit', 'lit'], dom: true, meter: { pips: 7, field: [120, 16], stride: 17, pad: 2 } },
  milestone_seal_7: { fn: () => drawMilestoneSeal(7), cell: [32, 32], anchor: [16, 16], frames: 1, dom: true },
  milestone_seal_30: { fn: () => drawMilestoneSeal(30), cell: [32, 32], anchor: [16, 16], frames: 1, dom: true },
};

Object.assign(globalThis, {
  drawStreakEmber, drawStreakPip, SEAL_DIGITS, drawSealNumber, drawMilestoneSeal, STREAK,
});
