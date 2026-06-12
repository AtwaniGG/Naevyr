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

const W2 = { W: 32, H: 72, B: 55, FACE: 48, CAP: 6 };

function wall2BottomY(side, x) {
  // exact spec corners: ne (0,B)->(31,B+16); nw (0,B+16)->(31,B)
  return side === 'ne' ? W2.B + Math.round(x * 16 / 31) : W2.B + Math.round((31 - x) * 16 / 31);
}

// place a wall-relative feature pixel: (x, h) where h = rows up from bottom edge
function wfP(g, side, x, h, c) { if (x < 0 || x > 31) return; P(g, x, wall2BottomY(side, x) - h, c); }

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
        if (h % 4 === 0) c = sh;                              // plank seams (wall-relative)
        if (hash2(x, h, 201) < 0.04) c = sh;                  // grain (periodic mod 32 in x)
      } else if (mat === 'block') {
        const course = Math.floor(h / 6), off = (course % 2) * 4;
        if (h % 6 === 0) c = sh;                              // course mortar
        else if ((x + off) % 8 === 0) c = sh;                 // staggered vertical joints
        if (hash2(x, h, 202) < 0.03) c = lit ? ramp[1] : ramp[3];
      } else { // cave — raw rock
        const hh = hash2(x, h, 203);
        if (hh < 0.10) c = sh; else if (hh < 0.14) c = hi;
        if (hash2(x, h, 204) < 0.02) c = dk;                  // rubble speck
      }
      P(g, x, y, c);
    }
    // top cap (follows the slope), then 1px void cap edge
    const topRow = by - (W2.FACE - 1);
    for (let k = 1; k <= W2.CAP; k++) P(g, x, topRow - k, k < 2 ? (lit ? RAMP.stone[1] : RAMP.stone[2]) : (mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]));
    P(g, x, topRow - W2.CAP - 1, RAMP.void);
    // baseboard trim
    P(g, x, by, dk);
  }

  // ---- feature variants (sit on a single segment; need not tile) ----
  if (variant === 'window') {
    const x0 = 8, x1 = 23, h0 = 20, h1 = 33;
    for (let x = x0; x <= x1; x++) for (let h = h0; h <= h1; h++) {
      let c = RAMP.ember[1];
      if (x === x0 || x === x1 || h === h0 || h === h1) c = RAMP.ember[0];
      if ((x + h) % 2 === 0 && hash2(x, h, 205) < 0.25) c = RAMP.ember[0];
      wfP(g, side, x, h, c);
    }
    for (let x = x0 - 1; x <= x1 + 1; x++) { wfP(g, side, x, h1 + 1, RAMP.bone[2]); wfP(g, side, x, h0 - 1, RAMP.bone[3]); }
    for (let h = h0 - 1; h <= h1 + 1; h++) { wfP(g, side, x0 - 1, h, RAMP.bone[2]); wfP(g, side, x1 + 1, h, RAMP.bone[3]); }
    for (let h = h0; h <= h1; h++) wfP(g, side, 15, h, RAMP.bone[3]);            // mullion V
    for (let x = x0; x <= x1; x++) wfP(g, side, x, 26, RAMP.bone[3]);            // mullion H
    for (let x = x0 - 1; x <= x1 + 1; x++) wfP(g, side, x, h0 - 2, RAMP.ember[2]); // warm spill below
  } else if (variant === 'banner') {
    const acc = opt.accent || RAMP.drift;
    const bx0 = 12, bx1 = 19, hTop = 41, hBot = 14;
    for (let x = bx0 - 1; x <= bx1 + 1; x++) wfP(g, side, x, hTop + 1, RAMP.dirt[3]);   // rod
    for (let x = bx0; x <= bx1; x++) for (let h = hBot; h <= hTop; h++) {
      let c = acc[2]; if (x === bx0) c = acc[1]; if (x === bx1) c = acc[3];
      wfP(g, side, x, h, c);
    }
    // notched pennant tail
    for (let x = bx0; x <= bx1; x++) { const t = Math.abs(x - (bx0 + bx1) / 2) / ((bx1 - bx0) / 2); for (let k = 0; k < Math.round((1 - t) * 5); k++) wfP(g, side, x, hBot - 1 - k, acc[3]); }
    // emblem
    const ex = (bx0 + bx1) >> 1; wfP(g, side, ex, 30, acc[0]); wfP(g, side, ex - 1, 29, acc[0]); wfP(g, side, ex + 1, 29, acc[0]); wfP(g, side, ex, 28, acc[1]);
  } else if (variant === 'seam') {
    let x = 3, h = 8; const rng = mulberry(206);
    for (let k = 0; k < 44; k++) {
      wfP(g, side, x, h, RAMP.gold[1]);
      if (rng() < 0.5) wfP(g, side, x, h - 1, RAMP.gold[2]);
      if (rng() < 0.3) wfP(g, side, x, h + 1, RAMP.gold[0]);         // glint
      x += 1; h += rng() < 0.5 ? 1 : (rng() < 0.5 ? -1 : 0);
      if (x > 29) break; h = Math.max(4, Math.min(W2.FACE - 5, h));
    }
  } else if (variant === 'lantern') {
    const lx = 16, lh = 30;
    for (let k = 0; k < 6; k++) wfP(g, side, lx, lh + 4 + k, RAMP.dirt[3]);   // bracket up
    for (let h = 0; h < 8; h++) for (let i = -3; i <= 3; i++) {
      let c = RAMP.ember[1]; if (h === 0 || h === 7) c = RAMP.dirt[3]; else if (i <= -2) c = RAMP.ember[2]; else if (i >= 2) c = RAMP.ember[0];
      if ((h === 1 || h === 6) && Math.abs(i) === 3) c = RAMP.dirt[3];
      wfP(g, side, lx + i, lh + h, c);
    }
    wfP(g, side, lx, lh, RAMP.ember[0]);
    for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 4 && d < 8 && (xx + yy) % 2 === 0) wfP(g, side, lx + xx, lh + 3 - yy, RAMP.ember[2]); }
  }

  // NO global outline (left/right must stay open to tile). Feature frames
  // carry their own edges; the top cap carries the void silhouette.
  return g;
}

// ---- corner wedge (16×72): caps the north junction where nw & ne meet ----
function drawWall2Corner(mat) {
  const g = makeGrid(16, 72);
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  const by = W2.B;                       // flat high bottom at the corner
  for (let x = 0; x < 16; x++) {
    const litCol = x < 8;
    const base = litCol ? ramp[1] : ramp[2];
    const hi = litCol ? ramp[0] : ramp[1];
    const sh = litCol ? ramp[2] : ramp[3];
    for (let h = 0; h < W2.FACE; h++) {
      const y = by - h;
      let c = base;
      if (x === 7) c = ramp[0];           // corner edge highlight (moonlit seam)
      if (x === 8) c = ramp[3];           // shadow turn
      if (h > W2.FACE - 5) c = hi;
      if (mat === 'timber') { if (h % 4 === 0) c = sh; }
      else if (mat === 'block') { const course = Math.floor(h / 6), off = (course % 2) * 4; if (h % 6 === 0) c = sh; else if ((x + off) % 8 === 0) c = sh; }
      else { const hh = hash2(x, h, 207); if (hh < 0.10) c = sh; else if (hh < 0.14) c = hi; }
      P(g, x, y, c);
    }
    const topRow = by - (W2.FACE - 1);
    for (let k = 1; k <= W2.CAP; k++) P(g, x, topRow - k, k < 2 ? RAMP.stone[1] : (mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]));
    P(g, x, topRow - W2.CAP - 1, RAMP.void);
    P(g, x, by, ramp[3]);
  }
  return g;
}

// corner coords for JSON
function wall2Corners(side) {
  return side === 'ne'
    ? { bottomLeft: [0, 55], bottomRight: [31, 71], topRight: [31, 23], topLeft: [0, 7] }
    : { bottomLeft: [0, 71], bottomRight: [31, 55], topRight: [31, 7], topLeft: [0, 23] };
}

// registry: key, side, mat, variant
const WALLS2 = [
  ['wall2_timber_nw', 'nw', 'timber', 'plain'], ['wall2_timber_ne', 'ne', 'timber', 'plain'],
  ['wall2_timber_nw_window', 'nw', 'timber', 'window'], ['wall2_timber_ne_banner', 'ne', 'timber', 'banner'],
  ['wall2_block_nw', 'nw', 'block', 'plain'], ['wall2_block_ne', 'ne', 'block', 'plain'],
  ['wall2_block_nw_window', 'nw', 'block', 'window'], ['wall2_block_ne_banner', 'ne', 'block', 'banner'],
  ['wall2_cave_nw', 'nw', 'cave', 'plain'], ['wall2_cave_ne', 'ne', 'cave', 'plain'],
  ['wall2_cave_nw_seam', 'nw', 'cave', 'seam'], ['wall2_cave_ne_lantern', 'ne', 'cave', 'lantern'],
];
const WALLS2_CORNER = ['timber', 'block', 'cave'];

Object.assign(globalThis, {
  W2, wall2BottomY, drawWall2, drawWall2Corner, wall2Corners, WALLS2, WALLS2_CORNER,
});
