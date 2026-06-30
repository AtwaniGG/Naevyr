// Naevyr FRONTIER EXPANSION · ROADS — iso auto-tile terrain set.
// Eval after pixlib.js + tiles.js (uses hash2, diamondRows, inDiamond, RAMP).
//
// Roads SINK INTO the terrain like the drawFloor interior tiles: 64×36 cell,
// diamond-center anchored (32,16), drawn OVER the ground tile, painting only the
// worn road ribbon with SOFT DITHERED edges that blend into the ground — and NO
// billboard void outline on the ground-facing sides (the locked-conventions
// exception for floor-style tiles). Packed-earth bed + worn cobble center line,
// dithered ruts. RAMP only, dither not blur, crispEdges.
//
// A COMPACT AUTO-TILE SET keyed by a 4-neighbour road bitmask. The engine
// rotates / mirrors these ~6 canonical pieces to cover all 16 masks; we ship the
// canonical orientation of each shape + an optional drift-eaten `road_broken`.
//
//   bit 0 = NE neighbour, 1 = SE, 2 = SW, 3 = NW  (the diamond's four edges)
//   straight  NE+SW (5)   ·  bend SE+SW (6)  ·  tee NE+SE+SW (7)
//   cross     all (15)    ·  cap  SW (4)     ·  isolated (0)

const ROAD_CENTER = [32, 16];
// the midpoint of each diamond edge — where a road meets the neighbour tile's road.
const ROAD_EDGE = { ne: [48, 8], se: [48, 24], sw: [16, 24], nw: [16, 8] };
const ROAD_BIT = { ne: 1, se: 2, sw: 4, nw: 8 };

// canonical pieces: name -> connected dirs (engine rotates/mirrors to fill 16 masks)
const ROAD_PIECES = {
  straight: ['ne', 'sw'],
  bend:     ['se', 'sw'],
  tee:      ['ne', 'se', 'sw'],
  cross:    ['ne', 'se', 'sw', 'nw'],
  cap:      ['sw'],
  isolated: [],
};
function roadMask(dirs) { return dirs.reduce((m, d) => m | ROAD_BIT[d], 0); }

function distSeg(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const L2 = vx * vx + vy * vy || 1;
  let t = (wx * vx + wy * vy) / L2; t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + t * vx), dy = py - (ay + t * vy);
  return Math.sqrt(dx * dx + dy * dy);
}

function drawRoad(dirs, broken) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const [cxC, cyC] = ROAD_CENTER;
  const segs = dirs.map(d => [cxC, cyC, ROAD_EDGE[d][0], ROAD_EDGE[d][1]]);
  const isolated = dirs.length === 0;
  const seed = 900 + roadMask(dirs) + (broken ? 50 : 0);

  // iso distance scaled so the band reads circular on the 2:1 diamond
  const isoD = (px, py, ax, ay, bx, by) => distSeg(px, py * 2, ax, ay * 2, bx, by * 2);

  const BED = 7;        // packed-earth bed half-width
  const COB = 2.4;      // cobble center-line half-width

  for (let y = 0; y < 32; y++) {
    for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      // distance to the nearest connected segment (+ a hub disc at the center)
      let d = Infinity;
      for (const s of segs) d = Math.min(d, isoD(x, y, s[0], s[1], s[2], s[3]));
      const dHub = isoD(x, y, cxC, cyC, cxC, cyC);
      if (isolated) d = dHub;                 // lone worn patch
      const onBed = d <= BED || dHub <= (isolated ? 6 : 5.5);
      if (!onBed) continue;

      // ----- soft dithered outer edge (blends into ground, no outline) -----
      const edge = Math.min(BED - d, BED - 0);   // proximity to bed rim
      if (d > BED - 1.6 && (x + y) % 2 === 1) continue;       // 50% dither at the rim
      if (d > BED - 0.7 && hash2(x, y, seed + 3) < 0.5) continue;

      // ----- packed-earth bed -----
      let c = dt[2];
      if (hash2(x, y, seed) < 0.16) c = dt[3];               // trodden dark patches
      else if (hash2(x, y, seed + 1) < 0.12) c = dt[1];      // dry highlight grit
      // worn ruts: two darker dithered tracks flanking the center line
      const rut = (d > COB + 1 && d < COB + 3.2);
      if (rut && (x + y) % 2 === 0 && hash2(x, y, seed + 2) < 0.7) c = dt[3];

      // ----- worn cobble center line -----
      const onCob = (d <= COB || (!isolated && dHub <= COB + 0.6));
      if (onCob) {
        c = st[1];
        if (hash2(x, y, seed + 4) < 0.30) c = st[2];          // set stones
        if (hash2(x, y, seed + 5) < 0.14) c = st[3];          // mortar seams (dark)
        if (hash2(x, y, seed + 6) < 0.08) c = bn[2];          // pale worn cobble cap
        // moonlit-left / shadowed-right shaping on each stone
        if ((x + y) % 2 === 0 && hash2(x, y, seed + 7) < 0.4) c = st[0];
      }

      // ----- broken / drift-eaten variant -----
      if (broken) {
        const h = hash2(x, y, seed + 8);
        if (onCob && h < 0.45) c = (x + y) % 2 === 0 ? dt[3] : RAMP.void;   // shattered cobbles
        else if (h < 0.10) c = RAMP.void;                                    // pot-holes / cracks
        else if (h < 0.16) c = dr[3];                                        // drift creep
        if (h < 0.05) c = dr[2];                                             // a few drift motes
      }

      P(g, x, y, c);
    }
  }

  // NO outline() — roads sink into the terrain (floor-style exception).
  return g;
}

/* ============================ REGISTRY ============================ */
// Each piece is one frame; the engine derives every mask by rotate/mirror.
const ROADS = {};
Object.keys(ROAD_PIECES).forEach(name => {
  ROADS['road_' + name] = {
    fn: () => drawRoad(ROAD_PIECES[name], false),
    cell: [64, 36], tile: [64, 32], anchor: [32, 16],
    sink: true, outline: false,
    connects: ROAD_PIECES[name], mask: roadMask(ROAD_PIECES[name]),
  };
});
ROADS.road_broken = {
  fn: () => drawRoad(ROAD_PIECES.straight, true),
  cell: [64, 36], tile: [64, 32], anchor: [32, 16],
  sink: true, outline: false, variantOf: 'road_straight',
  connects: ROAD_PIECES.straight, mask: roadMask(ROAD_PIECES.straight),
  note: 'corrupt-cell variant; engine may instead hide the road on a corrupt cell',
};

// the full auto-tile lookup the engine fills by rotating/mirroring the 6 canon pieces.
const ROAD_AUTOTILE = {
  bits: { ne: 1, se: 2, sw: 4, nw: 8 },
  canon: Object.fromEntries(Object.keys(ROAD_PIECES).map(n => [n, roadMask(ROAD_PIECES[n])])),
  rule: 'index by 4-neighbour road bitmask; rotate/mirror the matching canonical piece',
};

Object.assign(globalThis, {
  drawRoad, distSeg, ROAD_CENTER, ROAD_EDGE, ROAD_BIT, ROAD_PIECES, roadMask,
  ROADS, ROAD_AUTOTILE,
});
