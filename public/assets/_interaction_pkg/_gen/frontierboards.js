// Naevyr FRONTIER INTERACTION SET · FRONTIERBOARDS — eval after pixlib.js + tiles.js.
// Wood-and-parchment frontier signage. Weathered timber, drift-stained. Bottom-center
// anchors, 1px void outline, dither not blur, moonlit-left / shadowed-right, RAMP only.
//   bounty_board  40×56  idle 2f @2fps   (pinned parchments flutter)  — flagship "get work"
//   supply_post   56×56  1f              (crates + tally board + lantern)
//   quartermaster_stall 64×48 1f         (counter + canvas canopy + wares)
//   garrison_banner 24×72 sway 3f @3fps + lowered variant (rep not earned)

/* ============================ BOUNTY BOARD (40×56, idle 2f) ============================ */
function drawBountyBoard(f) {
  const g = makeGrid(40, 56);
  const dt = RAMP.dirt, bn = RAMP.bone, dr = RAMP.drift, st = RAMP.stone;
  const cx = 20, baseY = 55;
  // ground scuff
  for (let x = cx - 9; x <= cx + 9; x++) if ((x + baseY) % 2 === 0 && hash2(x, 0, 950) < 0.45) P(g, x, baseY, RAMP.ash);
  // two posts
  for (const px of [7, 30]) {
    for (let y = 13; y <= baseY; y++) { let c = dt[1]; if (y % 5 === 0) c = dt[3]; P(g, px, y, dt[2]); P(g, px + 1, y, c); P(g, px + 2, y, dt[3]); }
    P(g, px, 12, dt[3]); P(g, px + 1, 12, dt[2]); P(g, px + 2, 12, dt[3]);
  }
  // board planks
  for (let y = 15; y <= 40; y++) for (let x = 5; x <= 35; x++) {
    let c = dt[1];
    if (x % 7 === 0) c = dt[3];                 // plank seams
    if (y === 15 || y === 40) c = dt[3];        // frame top/bottom
    if (x <= 6) c = dt[0]; if (x >= 34) c = dt[2];
    if (hash2(x, y, 951) < 0.05) c = dt[3];     // wear/knots
    if (hash2(x, y, 952) < 0.03) c = dr[3];     // drift stain
    P(g, x, y, c);
  }
  for (let x = 5; x <= 35; x++) { P(g, x, 18, dt[3]); P(g, x, 37, dt[3]); }   // battens
  P(g, cx, 14, dt[3]);                                                         // crown spar
  // carved skull motif at the crown
  const sx = cx, sy = 7;
  for (let yy = 0; yy <= 5; yy++) for (let xx = -3; xx <= 3; xx++) { if (Math.abs(xx) === 3 && (yy === 0 || yy >= 4)) continue; P(g, sx + xx, sy + yy, bn[2]); }
  P(g, sx - 1, sy + 2, RAMP.void); P(g, sx + 1, sy + 2, RAMP.void);
  P(g, sx, sy + 4, RAMP.void);
  for (let xx = -2; xx <= 2; xx++) if (xx % 2 === 0) P(g, sx + xx, sy + 5, bn[3]);
  // nailed bounty slips — one flutters on f1
  const slips = [[8, 20, 9, 11], [22, 19, 9, 12], [13, 28, 12, 9]];
  slips.forEach((s, i) => {
    const [bx, by, bw, bh] = s;
    const lift = (f === 1 && i === 1) ? 1 : 0;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      let c = bn[0]; if (x === 0 || x === bw - 1 || y === 0 || y === bh - 1) c = bn[2];
      const curl = (x > bw - 3) ? lift : 0;
      P(g, bx + x, by + y - curl, c);
    }
    for (let ty = 2; ty < bh - 1; ty += 2) for (let tx = 2; tx < bw - 2; tx++) if (hash2(tx, ty, 960 + i) < 0.7) P(g, bx + tx, by + ty, bn[3]);
    P(g, bx + (bw >> 1), by, st[3]);            // nail
  });
  outline(g, RAMP.void);
  return g;
}

/* ============================ SUPPLY POST (56×56, 1f) ============================ */
function drawSupplyPost() {
  const g = makeGrid(56, 56);
  const dt = RAMP.dirt, bn = RAMP.bone, em = RAMP.ember, st = RAMP.stone;
  const baseY = 55;
  function crate(x0, y0, s) {
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
      let c = dt[1]; if (i === 0 || i === s - 1 || j === 0 || j === s - 1) c = dt[3];
      if (i === j || i === s - 1 - j) c = dt[2];
      if (hash2(x0 + i, y0 + j, 970) < 0.05) c = dt[2];
      P(g, x0 + i, y0 + j, c);
    }
  }
  // stacked crates (bottom-left)
  crate(4, baseY - 15, 16);
  crate(6, baseY - 28, 12);
  crate(21, baseY - 12, 12);
  // a sack on top
  for (let j = 0; j < 7; j++) { const w = 7 - Math.abs(j - 3); for (let i = -w; i <= w; i++) P(g, 12 + i, baseY - 29 - j, i < 0 ? bn[2] : bn[3]); }
  P(g, 12, baseY - 36, bn[1]);
  // tally board post (right)
  const px = 44;
  for (let y = 6; y <= baseY; y++) { P(g, px, y, dt[2]); P(g, px + 1, y, dt[1]); P(g, px + 2, y, dt[3]); }
  // the board
  for (let y = 10; y <= 35; y++) for (let x = 31; x <= px + 2; x++) {
    let c = dt[1]; if (y === 10 || y === 35) c = dt[3]; if (x <= 32) c = dt[0];
    if (hash2(x, y, 971) < 0.05) c = dt[3];
    P(g, x, y, c);
  }
  for (let x = 31; x <= px + 2; x++) P(g, x, 22, dt[3]);   // mid batten
  // chalk tally marks (groups of |||| with a slash)
  function tally(tx, ty) {
    for (let k = 0; k < 4; k++) for (let yy = 0; yy < 5; yy++) P(g, tx + k * 2, ty + yy, bn[0]);
    for (let k = 0; k < 5; k++) P(g, tx - 1 + k * 2, ty + 4 - k, bn[0]);
  }
  tally(34, 13); tally(34, 25);
  P(g, 34, 31, bn[0]); P(g, 36, 31, bn[0]); P(g, 38, 31, bn[0]);
  // lantern bracket + hanging lantern at the post crown
  for (let x = px - 6; x <= px; x++) P(g, x, 7, st[3]);
  P(g, px - 6, 8, st[3]);
  const lx = px - 6, ly = 10;
  for (let j = 0; j < 6; j++) for (let i = -2; i <= 2; i++) { let c = st[2]; if (i === 0 && j > 0 && j < 5) c = em[1]; if (Math.abs(i) === 2) c = st[3]; P(g, lx + i, ly + j, c); }
  P(g, lx, ly + 2, em[0]);
  for (let yy = -2; yy <= 4; yy++) for (let xx = -3; xx <= 3; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 2 && d < 5 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, em[2]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ QUARTERMASTER STALL (64×48, 1f) ============================ */
function drawQuartermasterStall() {
  const g = makeGrid(64, 48);
  const dt = RAMP.dirt, bn = RAMP.bone, bl = RAMP.blood, gd = RAMP.gold, st = RAMP.stone;
  const baseY = 47;
  // poles
  for (const px of [6, 30, 56]) for (let y = 10; y <= baseY; y++) { P(g, px, y, dt[2]); P(g, px + 1, y, dt[3]); }
  // back wares behind the counter
  function crate(x0, y0, s) { for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { let c = dt[1]; if (i === 0 || i === s - 1 || j === 0 || j === s - 1) c = dt[3]; if (i === j || i === s - 1 - j) c = dt[2]; P(g, x0 + i, y0 + j, c); } }
  crate(10, baseY - 18, 11);
  crate(40, baseY - 16, 12);
  // a barrel
  for (let y = 0; y < 13; y++) { const w = 5 - (y === 0 || y === 12 ? 1 : 0); for (let i = -w; i <= w; i++) { let c = dt[1]; if (i <= -w + 1) c = dt[0]; if (i >= w - 1) c = dt[2]; if (y % 5 === 0) c = dt[3]; P(g, 26 + i, baseY - 13 + y, c); } }
  // canvas canopy (striped), slanting down to the front
  for (let x = 4; x <= 58; x++) {
    const yy = 9 + Math.round((x - 4) * 0.06);
    for (let k = 0; k < 5; k++) { let c = ((x % 6) < 3) ? bn[1] : bl[2]; if (k === 0) c = bn[2]; if (k === 4) c = dt[3]; P(g, x, yy + k, c); }
  }
  for (let x = 4; x <= 58; x++) { const yy = 9 + Math.round((x - 4) * 0.06) + 5; if ((x % 4) < 2) P(g, x, yy, bn[2]); }   // scalloped fringe
  // timber counter
  for (let x = 4; x <= 58; x++) { P(g, x, baseY - 7, dt[1]); P(g, x, baseY - 6, dt[2]); P(g, x, baseY - 5, dt[3]); }
  for (let x = 4; x <= 58; x++) for (let y = baseY - 4; y <= baseY; y++) P(g, x, y, ((x % 8) < 1) ? dt[3] : dt[2]);
  // coin stack on the counter
  for (let k = 0; k < 5; k++) { P(g, 13, baseY - 8 - k, gd[1]); P(g, 14, baseY - 8 - k, gd[2]); } P(g, 13, baseY - 13, gd[0]);
  // small trade scale
  for (let i = -3; i <= 3; i++) P(g, 46 + i, baseY - 12, st[2]);
  P(g, 46, baseY - 11, st[3]); P(g, 46, baseY - 10, st[3]); P(g, 46, baseY - 9, st[3]); P(g, 46, baseY - 8, st[3]);
  for (let i = -1; i <= 1; i++) { P(g, 43 + i, baseY - 10, st[3]); P(g, 49 + i, baseY - 10, st[3]); }
  outline(g, RAMP.void);
  return g;
}

/* ============================ GARRISON BANNER (24×72) ============================ */
// state 'raised': sway 3f @3fps · state 'lowered': furled, dim (rep not yet earned)
function drawGarrisonBanner(state, f) {
  const g = makeGrid(24, 72);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift, bl = RAMP.blood;
  const baseY = 71, px = 11;
  // spear pole
  for (let y = 4; y <= baseY; y++) { P(g, px, y, st[1]); P(g, px + 1, y, st[2]); }
  // spear head + crossguard
  P(g, px, 0, st[0]); P(g, px, 1, st[0]);
  for (let yy = 2; yy <= 3; yy++) for (let xx = -1; xx <= 2; xx++) P(g, px + xx, yy, st[1]);
  P(g, px - 1, 4, st[2]); P(g, px + 2, 4, st[2]);
  if (state === 'lowered') {
    // banner furled + lashed to the pole, drained of colour (rep not yet earned)
    const fb = RAMP.stone;            // muted grey cloth — unlit / unearned, not the blood red
    for (let y = 9; y <= 41; y++) {
      const w = Math.max(1, 2 + Math.round(Math.sin(y * 0.22) * 1.2));
      for (let x = px + 2; x <= px + 2 + w; x++) { let c = fb[2]; if (x === px + 2) c = fb[1]; if (x >= px + 2 + w) c = fb[3]; if ((x + y) % 5 === 0) c = fb[3]; P(g, x, y, c); }
    }
    for (const ty of [15, 29]) for (let x = px; x <= px + 5; x++) P(g, x, ty, bn[3]);   // two lashings binding it down
    P(g, px + 4, 22, st[3]);          // a faint, unlit sigil ghost
    outline(g, RAMP.void);
    return g;
  }
  // raised banner: billows by frame
  const sway = [0, 1, 2][f], bx0 = px + 2, by0 = 8, bw = 9, bh = 42;
  for (let y = 0; y < bh; y++) {
    const billow = Math.round(Math.sin(y * 0.25 + f * 0.8) * (1 + (y / bh) * sway));
    const edge = bw - 1 - ((y > bh - 12 && hash2(y, 0, 980) < 0.4) ? 2 : 0);   // tattered fly edge
    for (let x = 0; x <= edge; x++) {
      if (y > bh - 9 && hash2(x, y, 981) < 0.28) continue;                      // ragged hem
      let c = bl[2]; if (x <= 1) c = bl[3]; if (x >= edge - 1) c = bl[1];
      if ((x + y) % 7 === 0) c = bl[3];
      P(g, bx0 + x + billow, by0 + y, c);
    }
  }
  for (let x = 0; x < bw; x++) P(g, bx0 + x, by0, bn[3]);   // top binding
  // company drift sigil
  const ex = bx0 + 4, ey = by0 + 17;
  P(g, ex, ey, dr[0]); P(g, ex - 1, ey, dr[2]); P(g, ex + 1, ey, dr[2]); P(g, ex, ey - 1, dr[2]); P(g, ex, ey + 1, dr[2]);
  P(g, ex - 2, ey, dr[3]); P(g, ex + 2, ey, dr[3]);
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const FRONTIERBOARDS = {
  bounty_board:        { fn: (f) => drawBountyBoard(f),        cell: [40, 56], anchor: [20, 55], frames: 2, anim: ['flutter', 2, true],  solid: true,  labelClear: true, desc: 'Standing notice board, nailed bounty slips, carved skull crown — the "get work" object' },
  supply_post:         { fn: () => drawSupplyPost(),           cell: [56, 56], anchor: [28, 55], frames: 1,                               solid: true,  labelClear: true, desc: "Quartermaster's contract post — stacked crates, chalk tally board, hung lantern" },
  quartermaster_stall: { fn: () => drawQuartermasterStall(),   cell: [64, 48], anchor: [32, 47], frames: 1,                               solid: true,  labelClear: true, desc: 'Rough frontier trade counter — timber counter, canvas canopy, crated wares' },
  garrison_banner:     { fn: (s, f) => drawGarrisonBanner(s, f), cell: [24, 72], anchor: [12, 71], states: { raised: 3, lowered: 1 }, anim: ['sway', 3, true], solid: false, labelClear: true, desc: 'Frontier company banner on a spear-pole; raised (sway) or lowered (rep not earned)' },
};

Object.assign(globalThis, {
  drawBountyBoard, drawSupplyPost, drawQuartermasterStall, drawGarrisonBanner, FRONTIERBOARDS,
});
