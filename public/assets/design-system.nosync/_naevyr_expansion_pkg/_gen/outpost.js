// Naevyr FRONTIER EXPANSION · OUTPOST — a second small settlement (frontier garrison).
// Eval after pixlib.js + tiles.js + town.js (foundation, frontWall, rightWall, gableRoof,
// litWindow, door, hangingSign, smoke). Matches the TOWN pack: iso 2:1, weathered frontier
// timber, south door + warm lit window, same roof/door conventions so buildings face town.
//   palisade_gate  144×128 — fortified timber gate in a stake palisade run
//   trading_post   120×130 — small timber trade house, awning + wares
//   watchtower      80×152 — tall lookout tower, railed platform, ember brazier
// Bottom-center anchor, top 6px reserved for the label. RAMP only, 1px void, dither not blur.

/* ===================== 1 · PALISADE GATE (144×128) ===================== */
function drawPalisadeGate() {
  const g = makeGrid(144, 128); const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, bn = RAMP.bone;
  const cx = 72, baseY = 112;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 8, 60, { ash: true });

  // a run of sharpened palisade stakes to either side of the gate towers
  function stakeRun(x0, x1, topBase) {
    for (let sx = x0; sx <= x1; sx += 5) {
      const h = topBase + Math.floor(hash2(sx, 1, 701) * 5);
      for (let k = 0; k < h; k++) { let c = (sx / 5 % 2 < 1) ? dt[1] : dt[2]; if (k < 3) c = dt[3]; P(g, sx, baseY - k, c); P(g, sx + 1, baseY - k, dt[3]); P(g, sx + 2, baseY - k, dt[2]); }
      P(g, sx, baseY - h, dt[3]); P(g, sx + 1, baseY - h, dt[3]);    // point
    }
  }
  stakeRun(8, 30, 38);
  stakeRun(114, 136, 38);

  // two squat gate towers framing the opening
  function tower(tx) {
    const w = 22, h = 64, x0 = tx - w / 2, ytop = baseY - h;
    // log-stacked face
    for (let y = ytop; y <= baseY; y++) for (let x = x0; x <= x0 + w; x++) {
      let c = dt[1]; if (x <= x0 + 1) c = dt[0]; if (x >= x0 + w - 1) c = dt[2];
      const r = (y - ytop) % 5; if (r === 0) c = dt[3]; else if (r === 1) c = dt[0];
      if (hash2(x, y, 702) < 0.05) c = dt[2];
      P(g, x, y, c);
    }
    // right iso side
    for (let d = 1; d <= 10; d++) for (let y = ytop; y <= baseY; y++) P(g, x0 + w + d, y - Math.floor(d / 2), d >= 9 ? dt[3] : dt[2]);
    // crenellated stake cap
    for (let x = x0 - 2; x <= x0 + w + 2; x += 4) for (let k = 0; k < 6; k++) { P(g, x, ytop - 1 - k, dt[3]); P(g, x + 1, ytop - 1 - k, dt[2]); }
    // top platform line
    for (let x = x0 - 2; x <= x0 + w + 2; x++) P(g, x, ytop, dt[3]);
    return { x0, ytop, w };
  }
  const lt = tower(cx - 30), rt = tower(cx + 30);

  // heavy timber lintel beam spanning the towers
  for (let j = 0; j < 7; j++) for (let x = lt.x0 + lt.w; x <= rt.x0; x++) {
    let c = dt[1]; if (j === 0) c = dt[0]; if (j > 4) c = dt[3];
    if ((x % 6) === 0) c = dt[3];
    P(g, x, baseY - 60 + j, c);
  }
  // iron-strapped double gate doors (shut), banded
  const gl = lt.x0 + lt.w + 2, gr = rt.x0 - 2, gtop = baseY - 53;
  for (let y = gtop; y <= baseY; y++) for (let x = gl; x <= gr; x++) {
    let c = dt[2]; if ((x - gl) % 2 === 0) c = dt[3];
    if (x === Math.round((gl + gr) / 2) || x === Math.round((gl + gr) / 2) + 1) c = RAMP.void; // center seam
    if (x <= gl + 1) c = dt[1]; if (x >= gr - 1) c = dt[3];
    P(g, x, y, c);
  }
  // iron straps + bolts
  for (const sy of [gtop + 6, gtop + 24, baseY - 8]) { for (let x = gl; x <= gr; x++) P(g, x, sy, st[3]); for (let x = gl + 2; x <= gr - 2; x += 6) { P(g, x, sy - 1, st[2]); } }
  // big iron ring handles
  P(g, Math.round((gl + gr) / 2) - 5, baseY - 28, st[2]); P(g, Math.round((gl + gr) / 2) + 6, baseY - 28, st[2]);
  // a warning skull mounted over the gate
  fillRect(g, cx - 2, baseY - 64, 5, 4, bn[1]); P(g, cx - 1, baseY - 63, RAMP.void); P(g, cx + 1, baseY - 63, RAMP.void); P(g, cx, baseY - 60, bn[2]);
  // ember braziers atop each tower
  [lt, rt].forEach((t) => { const bxp = t.x0 + t.w / 2; for (let k = 0; k < 4; k++) { const hw = 2 - Math.floor(k / 2); for (let i = -hw; i <= hw; i++) P(g, bxp + i, t.ytop - 7 - k, k < 2 ? em[1] : em[2]); } P(g, bxp, t.ytop - 11, em[0]); for (let yy = -3; yy <= 1; yy++) for (let xx = -4; xx <= 4; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 3 && d < 6 && (xx + yy) % 2 === 0) P(g, bxp + xx, t.ytop - 9 + yy, em[2]); } });

  outline(g, RAMP.void);
  return g;
}

/* ===================== 2 · TRADING POST (120×130) ===================== */
function drawTradingPost() {
  const g = makeGrid(120, 130); const dt = RAMP.dirt, gd = RAMP.gold, bn = RAMP.bone;
  // reuse the town house shell vocabulary (timber + plank roof), sized to 120×130
  const cx = 60, baseY = 112;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 8, 50, { ash: true });
  const fw = 58, fh = 54, dep = 24, roofH = 22, x0 = cx - fw / 2, x1 = cx + fw / 2, ytop = baseY - fh;
  if (typeof rightWall === 'function') rightWall(g, x1, ytop, baseY, dep, dt, 'timber', 71);
  if (typeof frontWall === 'function') frontWall(g, x0, x1, ytop, baseY, dt, 71, 'timber');
  if (typeof gableRoof === 'function') gableRoof(g, x0, x1, ytop, dep, roofH, RAMP.stone, { overhang: 4 });
  // timber corner braces
  for (let k = 0; k < fh; k++) { P(g, x0 + 2 + Math.round(k * 0.4), baseY - k, dt[3]); P(g, x1 - 2 - Math.round(k * 0.4), baseY - k, dt[3]); }
  // door + lit window
  if (typeof door === 'function') door(g, cx + 10, baseY, 11, 22, dt);
  if (typeof litWindow === 'function') litWindow(g, cx - 14, ytop + 16, 9, 9);

  // open-front trade stall awning on the left (a market counter under a lean-to)
  const ax0 = x0 - 30, ax1 = x0 + 2, ay = ytop + 18;
  for (let x = ax0; x <= ax1; x++) { const yy = ay + Math.round((x - ax0) * 0.42); P(g, x, yy, dt[2]); P(g, x, yy + 1, dt[3]); }
  for (let k = 0; k < 22; k++) { P(g, ax0, ay + 1 + k, dt[3]); P(g, ax0 + 1, ay + 1 + k, dt[2]); }      // post
  // striped awning cloth
  for (let x = ax0; x <= ax1; x++) { const yy = ay + Math.round((x - ax0) * 0.42); for (let k = 2; k < 6; k++) P(g, x, yy + k, ((x % 6) < 3) ? bn[2] : RAMP.blood[2]); }
  // counter heaped with wares (crates, sacks, a gold coin stack)
  const wbx = ax0 + 3, wby = baseY - 4;
  for (let i = 0; i < 24; i++) P(g, wbx + i, wby, dt[1]);
  for (let i = 0; i < 24; i++) P(g, wbx + i, wby + 1, dt[3]);
  P(g, wbx + 1, wby + 2, dt[3]); P(g, wbx + 22, wby + 2, dt[3]);
  // crate
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { let c = dt[1]; if (i === 0 || i === 7 || j === 0 || j === 7) c = dt[3]; if (i === j || i === 7 - j) c = dt[2]; P(g, wbx + 2 + i, wby - 8 + j, c); }
  // sacks
  for (let j = 0; j < 6; j++) { const w = 6 - Math.abs(j - 3); for (let i = -w; i <= w; i++) P(g, wbx + 14 + i, wby - 1 - j, i < 0 ? bn[2] : bn[3]); }
  // gold coin stack on the counter
  for (let k = 0; k < 4; k++) { P(g, wbx + 19, wby - 1 - k, gd[1]); P(g, wbx + 20, wby - 1 - k, gd[2]); }
  P(g, wbx + 19, wby - 5, gd[0]);
  // hanging trade sign (coin glyph)
  if (typeof hangingSign === 'function') hangingSign(g, x1 + 2, ytop + 24, 12, 9, dt, (gg, x, y, w, h) => {
    for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 4) P(gg, x + 6 + xx, y + 4 + yy, RAMP.gold[1]); P(gg, x + 6, y + 4, RAMP.gold[0]);
  });
  // chimney smoke for a lived-in read
  if (typeof smoke === 'function') smoke(g, x1 - 8, ytop - 14);

  outline(g, RAMP.void);
  return g;
}

/* ===================== 3 · WATCHTOWER (80×152) ===================== */
function drawWatchtower() {
  const g = makeGrid(80, 152); const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, bn = RAMP.bone, dr = RAMP.drift;
  const cx = 40, baseY = 140;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 6, 30, { ash: true });

  // tall four-post timber tower, tapering slightly inward toward the platform
  const baseHW = 17, topHW = 13, botY = baseY, platY = 40;
  // back-right legs (drawn first, shadow)
  function leg(sideX, depth) {
    for (let y = platY; y <= botY; y++) {
      const t = (botY - y) / (botY - platY);
      const lx = cx + sideX * Math.round(baseHW - t * (baseHW - topHW)) + depth;
      P(g, lx, y - (depth ? Math.floor(depth / 2) : 0), depth ? dt[3] : (sideX < 0 ? dt[1] : dt[2]));
      P(g, lx + 1, y - (depth ? Math.floor(depth / 2) : 0), dt[3]);
    }
  }
  leg(-1, 7); leg(1, 7);          // back legs (recede up-right)
  leg(-1, 0); leg(1, 0);          // front legs
  // X cross-braces between the front legs (three storeys)
  for (const by of [botY - 28, botY - 60, botY - 88]) {
    const t0 = (botY - by) / (botY - platY), t1 = (botY - (by - 28)) / (botY - platY);
    const lxB = cx - Math.round(baseHW - t0 * (baseHW - topHW)), rxB = cx + Math.round(baseHW - t0 * (baseHW - topHW));
    const lxT = cx - Math.round(baseHW - t1 * (baseHW - topHW)), rxT = cx + Math.round(baseHW - t1 * (baseHW - topHW));
    const n = 30;
    for (let k = 0; k <= n; k++) { P(g, Math.round(lxB + (rxT - lxB) * k / n), Math.round(by - 28 * k / n), dt[2]); P(g, Math.round(rxB + (lxT - rxB) * k / n), Math.round(by - 28 * k / n), dt[3]); }
    // horizontal girt
    for (let x = lxB; x <= rxB; x++) P(g, x, by, dt[3]);
  }

  // the railed lookout platform (overhangs the posts)
  const pHW = topHW + 5, pTop = platY;
  // platform deck (iso slab)
  for (let d = 0; d <= 10; d++) for (let x = -pHW; x <= pHW; x++) P(g, cx + x + d, pTop + 6 - Math.floor(d / 2), (d === 0 || x === -pHW) ? dt[1] : (d >= 9 ? dt[3] : dt[2]));
  for (let x = -pHW; x <= pHW; x++) { P(g, cx + x, pTop + 6, dt[3]); P(g, cx + x, pTop + 7, dt[3]); }   // deck underside
  // corner posts + railing
  for (let x = -pHW; x <= pHW; x += 1) if (x === -pHW || x === pHW || x % 6 === 0) for (let k = 0; k < 9; k++) P(g, cx + x, pTop + 5 - k, dt[3]);
  for (let x = -pHW; x <= pHW; x++) P(g, cx + x, pTop - 4, dt[2]);     // top rail
  // little shingled roof over the platform
  const rHW = pHW + 3, roofH = 16;
  for (let y = 0; y <= roofH; y++) { const t = y / roofH, hw = Math.round(rHW * t); const yy = pTop - 5 - roofH + y; for (let x = -hw; x <= hw; x++) { let c = st[1]; if (x < -hw + 2) c = st[0]; if (x > hw - 1) c = st[2]; if (y % 3 === 0) c = st[3]; P(g, cx + x, yy, c); } }
  for (let d = 1; d <= 10; d++) for (let y = 0; y <= roofH; y++) { const t = y / roofH; const x = Math.round(d + rHW * t); const yy = Math.round(pTop - 5 - roofH - Math.floor(d / 2) + y); P(g, cx + x, yy, y % 3 === 0 ? st[3] : st[2]); }
  for (let d = 0; d <= 10; d++) P(g, cx + d, pTop - 5 - roofH - Math.floor(d / 2), st[0]);   // ridge
  // a warning bell hung under the eave
  P(g, cx + pHW - 3, pTop - 6, st[3]); for (let j = 0; j < 4; j++) { const w = 1 + j; for (let i = -w; i <= w; i++) P(g, cx + pHW - 3 + i, pTop - 5 + j, st[2]); } P(g, cx + pHW - 3, pTop - 1, st[3]);

  // signal brazier glowing on the platform (the lookout's fire) + drift-touched smoke
  const fxp = cx - 4, fy = pTop + 2;
  for (let i = -3; i <= 3; i++) P(g, fxp + i, fy, st[3]);
  for (let k = 0; k < 5; k++) { const hw = 3 - Math.floor(k / 2); for (let i = -hw; i <= hw; i++) P(g, fxp + i, fy - 2 - k, k < 2 ? em[0] : em[1]); }
  for (let yy = -3; yy <= 1; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 3 && d < 6 && (xx + yy) % 2 === 0) P(g, fxp + xx, fy - 3 + yy, em[2]); }
  // ladder up the front-left leg
  const ldx = cx - baseHW + 4;
  for (let y = pTop + 8; y <= botY - 2; y += 4) for (let i = 0; i < 6; i++) P(g, ldx + i, y, dt[3]);
  for (let y = pTop + 8; y <= botY - 2; y++) { P(g, ldx, y, dt[2]); P(g, ldx + 5, y, dt[2]); }
  // a small banner with the frontier mark on a front leg
  const bx = cx + baseHW - 4;
  for (let y = botY - 70; y <= botY - 46; y++) for (let i = 0; i < 8; i++) { const wob = Math.round(Math.sin(y * 0.4) * 0.6); let c = bn[2]; if (i === 0) c = bn[1]; if (i >= 6) c = bn[3]; P(g, bx - i + wob, y, c); }
  P(g, bx - 4, botY - 60, dr[1]); P(g, bx - 5, botY - 59, dr[2]); P(g, bx - 3, botY - 59, dr[2]); P(g, bx - 4, botY - 58, dr[2]);  // drift emblem

  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const OUTPOST = {
  palisade_gate: { fn: () => drawPalisadeGate(), cell: [144, 128], anchor: [72, 127], footprint: '3x3', tile: true, labelClear: true },
  trading_post:  { fn: () => drawTradingPost(),  cell: [120, 130], anchor: [60, 129], footprint: '3x3', tile: true, labelClear: true },
  watchtower:    { fn: () => drawWatchtower(),   cell: [80, 152],  anchor: [40, 151], footprint: '2x2', tile: true, labelClear: true },
};

Object.assign(globalThis, {
  drawPalisadeGate, drawTradingPost, drawWatchtower, OUTPOST,
});
