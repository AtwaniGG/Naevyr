// NAEVYR — THE EXCHANGE counter (Vault interior fixture). Eval after pixlib.js +
// tiles.js. Matches the interiors.js fixture conventions: bottom-center anchor,
// top 6px of the cell kept clear for labels, 1px void outline, RAMP only.
// Brass balance scales: a GOLD pan and a violet-glow DRIFTS pan, 48×48, 2-frame
// tip-totter (~2fps).

const EX_W = 48, EX_H = 48, EX_ANCHOR = [24, 47];

function drawExchange(frame) {
  const g = makeGrid(EX_W, EX_H);
  const gd = RAMP.gold, dr = RAMP.drift, st = RAMP.stone, dt = RAMP.dirt;
  const cx = 24, baseY = 45;

  // --- ledger/counter base the scales sit on ---
  for (let y = baseY - 6; y <= baseY; y++) for (let x = cx - 16; x <= cx + 16; x++) {
    let c = dt[1]; if (x < cx - 14) c = dt[0]; if (x > cx + 14) c = dt[3]; if (y > baseY - 2) c = dt[3];
    if ((x + y) % 7 === 0) c = dt[2];
    P(g, x, y, c);
  }
  // an open ledger book on the left of the counter
  fillRect(g, cx - 14, baseY - 9, 9, 3, RAMP.bone[1]); P(g, cx - 10, baseY - 9, dt[3]);
  for (let i = 0; i < 3; i++) { P(g, cx - 13 + i, baseY - 8, st[3]); P(g, cx - 8 + i, baseY - 8, st[3]); }

  // --- central brass column ---
  for (let y = 12; y <= baseY - 6; y++) { P(g, cx, y, gd[1]); P(g, cx - 1, y, gd[2]); P(g, cx + 1, y, gd[3]); }
  fillRect(g, cx - 2, baseY - 7, 5, 2, gd[3]);                 // foot
  // finial
  P(g, cx, 10, gd[0]); P(g, cx, 11, gd[1]);

  // --- balance beam (tips by frame) ---
  const tip = frame === 0 ? 1 : -1;                            // +1: gold pan down; -1: drifts pan down
  const beamY = 14;
  const armLen = 13;
  // beam as a shallow line pivoting at (cx, beamY)
  const pts = [];
  for (let i = -armLen; i <= armLen; i++) {
    const y = beamY + Math.round((i / armLen) * 2 * tip);
    P(g, cx + i, y, i < 0 ? gd[1] : gd[2]);
    P(g, cx + i, y - 1, gd[0]);
    pts.push(y);
  }
  // pivot knob
  P(g, cx, beamY - 1, gd[0]); P(g, cx, beamY, gd[1]);

  // --- left pan: GOLD coins ---
  const lpx = cx - armLen, lpy = pts[0] + 1;
  hangPan(g, lpx, lpy + (tip > 0 ? 4 : 2), gd, 'gold');
  // --- right pan: DRIFTS (violet glow) ---
  const rpx = cx + armLen, rpy = pts[pts.length - 1] + 1;
  hangPan(g, rpx, rpy + (tip < 0 ? 4 : 2), dr, 'drifts');

  outline(g, RAMP.void);

  // glow on the drifts pan AFTER outline (outline-free)
  const gy = (tip < 0 ? rpy + 4 : rpy + 2) + 4;
  for (let i = -1; i <= 1; i++) P(g, rpx + i, gy - 5, dr[0]);
  if (frame) { P(g, rpx, gy - 7, dr[1]); P(g, rpx - 2, gy - 5, dr[2]); P(g, rpx + 2, gy - 5, dr[2]); }
  return g;
}

// a hanging pan: 2 chains to a shallow bowl + its contents
function hangPan(g, px, py, ramp, kind) {
  const gd = RAMP.gold;
  // chains from beam end down to the bowl
  for (let k = 0; k < 4; k++) { P(g, px - 2, py - 4 + k, gd[3]); P(g, px + 2, py - 4 + k, gd[3]); }
  // bowl
  for (let x = px - 4; x <= px + 4; x++) { const d = Math.abs(x - px); const yy = py + Math.round(d * 0.4); P(g, x, yy, gd[2]); P(g, x, yy + 1, gd[3]); }
  // contents
  if (kind === 'gold') {
    P(g, px - 1, py - 1, gd[0]); P(g, px + 1, py - 1, gd[1]); P(g, px, py - 2, gd[0]); P(g, px, py - 1, gd[1]);  // coin stack
  } else {
    // a drift shard
    P(g, px, py - 3, RAMP.drift[0]); P(g, px, py - 2, RAMP.drift[1]); P(g, px - 1, py - 1, RAMP.drift[2]); P(g, px + 1, py - 1, RAMP.drift[2]); P(g, px, py - 1, RAMP.drift[1]);
  }
}

const EXCHANGE = {
  exchange_counter: { fn: drawExchange, frames: 2, fps: 2, cell: [EX_W, EX_H], anchor: EX_ANCHOR, ramp: 'gold(brass) + drift + dirt' },
};

Object.assign(globalThis, { EX_W, EX_H, EX_ANCHOR, drawExchange, hangPan, EXCHANGE });
