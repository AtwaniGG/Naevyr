// game/render/sprites.ts
// TypeScript port of the Naevyr DS _gen/*.js sprite generators.
// All sprites are generated once at init() into OffscreenCanvas objects and
// drawn with imageSmoothingEnabled=false for crisp pixel scaling at any zoom.

import { AVATAR_CHANNELS, AVATAR_KINDS, type AvatarKind } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Grid = { w: number; h: number; d: (Pixel | null)[] };
type Pixel = { c: string; a?: number };

export type IsoFacing = 's' | 'se' | 'e' | 'ne' | 'n';
export type AnimName  = 'idle' | 'walk' | 'swing';

// ─── Palette (exact mirror of DS RAMP) ────────────────────────────────────────

export const RAMP = {
  grass: ['#7fae5e', '#4d7c4d', '#356037', '#20402a'],
  dirt:  ['#7a6048', '#50402e', '#36291c', '#241a11'],
  stone: ['#4a4360', '#322b46', '#211c30', '#14101e'],
  water: ['#4a7fa0', '#2c5775', '#173a52', '#0d2336'],
  drift: ['#f3e8ff', '#d8b4fe', '#a855f7', '#6b21a8', '#3b1162'],
  ember: ['#fcd34d', '#f59e0b', '#b45309', '#7c3a06'],
  gold:  ['#f6e0a6', '#e7c873', '#b8943f', '#7c5f23'],
  blood: ['#ef4444', '#dc2626', '#991b1b', '#5f1212'],
  bone:  ['#efe9f4', '#d8cfe0', '#a99fb8', '#6f6781'],
  void:  '#0a0810',
  ash:   '#171320',
};

// ─── pixlib ────────────────────────────────────────────────────────────────────

function makeGrid(w: number, h: number): Grid {
  return { w, h, d: new Array(w * h).fill(null) };
}
function P(g: Grid, x: number, y: number, c: string, a?: number) {
  x = x | 0; y = y | 0;
  if (x < 0 || y < 0 || x >= g.w || y >= g.h || !c) return;
  g.d[y * g.w + x] = a == null ? { c } : { c, a };
}
function G(g: Grid, x: number, y: number): Pixel | null {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null;
  return g.d[y * g.w + x];
}
function fillRect(g: Grid, x: number, y: number, w: number, h: number, c: string, a?: number) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(g, x + i, y + j, c, a);
}
function outline(g: Grid, c = '#0a0810') {
  const add: [number, number][] = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (G(g, x, y)) continue;
    if (G(g, x + 1, y) || G(g, x - 1, y) || G(g, x, y + 1) || G(g, x, y - 1)) add.push([x, y]);
  }
  add.forEach(p => P(g, p[0], p[1], c));
}
function mirrorX(g: Grid): Grid {
  const m = makeGrid(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y); if (v) P(m, g.w - 1 - x, y, v.c, v.a);
  }
  return m;
}
function mulberry(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ─── tiles.js ─────────────────────────────────────────────────────────────────

export function hash2(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
  h = (h ^ (h >> 13)) * 1274126177 | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function diamondRows(): { x0: number; x1: number }[] {
  const rows: { x0: number; x1: number }[] = [];
  for (let y = 0; y < 32; y++) {
    const half = y < 16 ? 2 * (y + 1) : 2 * (32 - y);
    rows.push({ x0: 32 - half, x1: 32 + half - 1 });
  }
  return rows;
}
function inDiamond(rows: { x0: number; x1: number }[], x: number, y: number): boolean {
  if (y < 0 || y > 31) return false;
  return x >= rows[y].x0 && x <= rows[y].x1;
}
function contourMaxY(rows: { x0: number; x1: number }[], x: number): number {
  for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) return y;
  return -1;
}

function makeBaseTile(
  type: 'grass' | 'dirt' | 'stone' | 'water',
  seedN: number,
  edge = true,
): Grid {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = RAMP[type];
  const face = ramp[1], hi = ramp[0], sh = ramp[2], dp = ramp[3];

  for (let y = 0; y < 32; y++)
    for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);

  // 3px south lip
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
  }
  // 1px void north edge — only at type boundaries (edge=false dissolves the
  // checkerboard between same-type neighbours)
  if (edge) {
    for (let x = 0; x < 64; x++)
      for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }
  }

  // per-type face detail
  for (let y = 1; y < 31; y++) {
    for (let x = rows[y].x0 + 1; x <= rows[y].x1 - 1; x++) {
      const h = hash2(x, y, seedN);
      if (type === 'grass') {
        if (h < 0.055) { P(g, x, y, sh); if (hash2(x, y, seedN + 1) < 0.4) P(g, x, y - 1, sh); }
        else if (h < 0.075) P(g, x, y, hi);
      } else if (type === 'dirt') {
        if (h < 0.04) { P(g, x, y, sh); P(g, x + 1, y, dp); }
        else if (h < 0.05) P(g, x, y, hi);
      } else if (type === 'stone') {
        if (h < 0.03) { P(g, x, y, dp); P(g, x + 1, y, dp); P(g, x + 2, y, dp); }
        else if (h < 0.045) P(g, x, y, hi);
      } else if (type === 'water') {
        if (h < 0.05 && y > 18) P(g, x, y, sh);
      }
    }
  }
  return g;
}

// 2px dither transition band into `other` along the SOUTH edges (tiles.js)
function makeTransitionTile(
  type: 'grass' | 'dirt',
  other: 'grass' | 'dirt',
  seedN: number,
  edge: boolean,
): Grid {
  const g = makeBaseTile(type, seedN, edge);
  const rows = diamondRows();
  const oc = RAMP[other][1];
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my < 0) continue;
    for (let k = 0; k <= 1; k++) {
      const y = my - k;
      if (y < 1 || !inDiamond(rows, x, y)) continue;
      if ((x + y) % 2 === 0 || (k === 0 && hash2(x, y, 9) < 0.35)) P(g, x, y, oc);
    }
  }
  return g;
}

// light foam dither around the water perimeter (tiles.js waterFoamVariant)
function applyFoam(g: Grid) {
  const rows = diamondRows();
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    let ty = -1;
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { ty = y; break; }
    ([[ty + 1, 0], [ty + 2, 1], [my, 0], [my - 1, 1]] as const).forEach((p) => {
      const y = p[0];
      if (y < 1 || y > 31 || !inDiamond(rows, x, y)) return;
      if ((x + y) % 2 === 0 && hash2(x, y, 6) < 0.6) P(g, x, y, RAMP.water[0]);
      else if (hash2(x, y, 5) < 0.14) P(g, x, y, RAMP.bone[2]);
    });
  }
}

function genWaterFrames(seedN: number, foam = false): Grid[] {
  const specs: { x: number; y: number; len: number }[] = [];
  const rnd = mulberry(seedN + 100);
  for (let i = 0; i < 7; i++) {
    specs.push({ x: 12 + Math.floor(rnd() * 38), y: 6 + Math.floor(rnd() * 20), len: 2 + Math.floor(rnd() * 4) });
  }
  const DX = [0, 1, 0, -1], DY = [0, 0, 1, 0];
  const rows = diamondRows();
  return [0, 1, 2, 3].map(f => {
    const g = makeBaseTile('water', seedN);
    if (foam) applyFoam(g);
    specs.forEach((s, i) => {
      if ((i + f) % 4 === 3) return;
      const y = s.y + DY[(f + i) % 4];
      for (let k = 0; k < s.len; k++) {
        const x = s.x + DX[(f + i) % 4] + k;
        if (inDiamond(rows, x, y) && y > 1) P(g, x, y, RAMP.water[0]);
      }
    });
    return g;
  });
}

// ─── ground doodads — cosmetic clutter, no collision ─────────────────────────

export type DoodadKind =
  | 'tuft' | 'pebbles' | 'bones' | 'masonry' | 'crystal'
  // wilds pack: regional clutter (reeds by the mere, bones + dead trees in the
  // Flats, bog bubbles on water — bubble "variant" is its 2-frame animation)
  | 'reed_clump' | 'dead_tree' | 'bone_spike' | 'mire_bubble'
  // frontier pack: the deadly outer ring (drift-crystal clusters, ash dunes,
  // scorched stumps) — standing native-size doodads like the wilds set
  | 'drift_crystal' | 'ash_dune' | 'scorched_stump'
  // "Fill the Realm" biome ground cover (placeholders; DS groundcover.js later)
  | BiomeDoodadKey;

function makeDoodad(kind: DoodadKind, seedN: number): Grid {
  const g = makeGrid(16, 12);
  const gr = RAMP.grass, st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const rnd = mulberry(seedN * 31 + 7);
  if (kind === 'tuft') {
    // a few grass blades leaning apart
    for (let i = 0; i < 4 + Math.floor(rnd() * 3); i++) {
      const bx = 4 + Math.floor(rnd() * 8);
      const h = 2 + Math.floor(rnd() * 3);
      const lean = rnd() < 0.5 ? -1 : 1;
      for (let k = 0; k <= h; k++) {
        P(g, bx + (k > h - 2 ? lean : 0), 10 - k, k === h ? gr[0] : k > 1 ? gr[1] : gr[2]);
      }
    }
  } else if (kind === 'pebbles') {
    for (let i = 0; i < 3 + Math.floor(rnd() * 3); i++) {
      const bx = 3 + Math.floor(rnd() * 10), by = 8 + Math.floor(rnd() * 3);
      P(g, bx, by, st[1]); P(g, bx + 1, by, st[2]); P(g, bx, by - 1, st[0]);
    }
  } else if (kind === 'bones') {
    // a half-buried ribcage curve + skull nub
    const bx = 5 + Math.floor(rnd() * 4);
    for (let i = 0; i < 4; i++) {
      P(g, bx + i * 2, 9 - (i % 2), bn[2]);
      P(g, bx + i * 2, 10 - (i % 2), bn[1]);
    }
    P(g, bx - 2, 10, bn[1]); P(g, bx - 3, 10, bn[2]); P(g, bx - 2, 9, bn[2]);
  } else if (kind === 'masonry') {
    // a fallen worked-stone block, half sunk
    const bx = 4 + Math.floor(rnd() * 5);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) {
      let c = st[1];
      if (y === 0) c = st[0];
      if (x === 4 || y === 2) c = st[2];
      if (hash2(x, y, seedN) < 0.12) c = st[3];
      P(g, bx + x, 8 + y, c);
    }
    P(g, bx + 1, 7, st[2]); // chipped corner
  } else {
    // drift crystal shard cluster
    const bx = 6 + Math.floor(rnd() * 4);
    for (let k = 0; k < 4; k++) P(g, bx, 10 - k, k === 3 ? dr[0] : k >= 1 ? dr[1] : dr[3]);
    for (let k = 0; k < 2; k++) P(g, bx - 2, 10 - k, k === 1 ? dr[1] : dr[3]);
    P(g, bx + 2, 10, dr[3]); P(g, bx + 2, 9, dr[2]);
  }
  return g;
}

// ── Biome ground cover (PLACEHOLDERS) ─────────────────────────────────────────
// The "Fill the Realm" pack: dense region-flavoured doodads. Hand-built in-style
// now; the DS `_gen/groundcover.js` swaps in later. Native cells, bottom-center
// anchored; flat ground decor skips the billboard outline so it sinks.
export type BiomeDoodadKey =
  | 'wildflower' | 'daisies' | 'clover' | 'bush' | 'fern' | 'tallgrass' | 'meadow_mushroom'
  | 'grove_tree' | 'log' | 'stump' | 'sapling' | 'toadstool'
  | 'boulder' | 'rubble'
  | 'cattail' | 'lilypad' | 'mud'
  | 'ash_tuft' | 'charred_bone' | 'war_debris'
  | 'skull' | 'grave_nub' | 'dead_shrub';
export const BIOME_DOODAD_KEYS: BiomeDoodadKey[] = [
  'wildflower', 'daisies', 'clover', 'bush', 'fern', 'tallgrass', 'meadow_mushroom',
  'grove_tree', 'log', 'stump', 'sapling', 'toadstool', 'boulder', 'rubble',
  'cattail', 'lilypad', 'mud', 'ash_tuft', 'charred_bone', 'war_debris',
  'skull', 'grave_nub', 'dead_shrub',
];

// ── biome-doodad helpers (DS groundcover.js port) ──
function stem(g: Grid, x: number, baseY: number, h: number, ramp: readonly string[], lean = 0) {
  for (let k = 0; k < h; k++) {
    const t = k / h, sx = Math.round(x + lean * t);
    let c = ramp[1]; if (k > h - 2) c = ramp[2];
    P(g, sx, baseY - k, c);
    if (k % 3 === 1) P(g, sx - 1, baseY - k, ramp[2]);
  }
}
function leafMass(g: Grid, cx: number, cy: number, rx: number, ry: number, ramp: readonly string[], seed: number) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    let c = ramp[1];
    if (dx + dy < -0.45) c = ramp[0];
    else if (dx + dy > 0.45) c = ramp[2];
    if (d > 0.74) c = ramp[2];
    if (hash2(x, y, seed) < 0.12) c = ramp[2];
    if (hash2(x, y, seed + 7) < 0.05) c = ramp[3];
    P(g, x, y, c);
  });
}
function bloom(g: Grid, x: number, y: number, petal: readonly string[], core: string) {
  P(g, x - 1, y, petal[1]); P(g, x + 1, y, petal[1]);
  P(g, x, y - 1, petal[0]); P(g, x, y + 1, petal[2]);
  P(g, x, y, core);
}
function groundSplotch(g: Grid, cx: number, cy: number, rx: number, ry: number, fn: (x: number, y: number, d: number, dx: number, dy: number) => void, seed: number) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    if (d > 0.9 && (x + y) % 2 === 1) return;
    if (d > 0.7 && hash2(x, y, seed) < 0.35) return;
    fn(x, y, d, dx, dy);
  });
}
function fin(g: Grid, flat = false) { if (!flat) outline(g, RAMP.void); return g; }

function drawWildflower(v: number): Grid {
  const g = makeGrid(14, 14), gr = RAMP.grass, dr = RAMP.drift, gd = RAMP.gold, baseY = 13;
  const stalks = v === 0 ? [[5, 9, 1], [9, 11, -1], [7, 7, 0]] : [[4, 8, 1], [8, 10, 0], [10, 8, -1], [6, 6, 1]];
  stalks.forEach(([x, h, ln], i) => {
    stem(g, x, baseY, h, gr, ln);
    const bx = Math.round(x + ln * (h / 14)), by = baseY - h;
    const petal = (i + v) % 2 === 0 ? dr : gd;
    bloom(g, bx, by, petal, (i % 2 ? gd[0] : dr[0]));
  });
  P(g, 3, baseY - 1, gr[2]); P(g, 11, baseY - 1, gr[2]);
  return fin(g);
}
function drawDaisies(v: number): Grid {
  const g = makeGrid(14, 10), gr = RAMP.grass, bn = RAMP.bone, gd = RAMP.gold, baseY = 9;
  const heads = v === 0 ? [[4, 4], [9, 5], [6, 2]] : [[3, 5], [7, 3], [10, 4], [5, 6]];
  heads.forEach(([x, y]) => {
    stem(g, x, baseY, baseY - y, gr, 0);
    [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], i) => P(g, x + dx, y + dy, i % 2 ? bn[1] : bn[0]));
    P(g, x, y, gd[1]);
  });
  return fin(g);
}
function drawClover(v: number): Grid {
  const g = makeGrid(12, 8), gr = RAMP.grass, seed = 210 + v;
  groundSplotch(g, 6, 4, 6, 3.5, (x, y, d) => { let c = gr[1]; if (d < 0.3) c = gr[0]; if (hash2(x, y, seed) < 0.3) c = gr[2]; P(g, x, y, c); }, seed);
  const cl = v === 0 ? [[3, 3], [8, 4], [6, 5]] : [[4, 5], [9, 3], [5, 2], [8, 6]];
  cl.forEach(([x, y]) => { P(g, x, y, gr[0]); P(g, x - 1, y, gr[1]); P(g, x + 1, y, gr[1]); P(g, x, y - 1, gr[1]); });
  return fin(g, true);
}
function drawBush(v: number): Grid {
  const g = makeGrid(20, 18), gr = RAMP.grass, baseY = 16;
  const lobes = v === 0 ? [[10, 10, 8, 6], [6, 12, 5, 4], [14, 12, 5, 4]] : [[8, 9, 6, 5], [13, 11, 6, 5], [10, 13, 7, 4]];
  lobes.forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 220 + v * 3 + i));
  P(g, 10, baseY - 1, RAMP.dirt[2]); P(g, 10, baseY, RAMP.dirt[3]);
  return fin(g);
}
function drawFern(v: number): Grid {
  const g = makeGrid(16, 16), gr = RAMP.grass, baseY = 15, cx = 8;
  const fronds = v === 0 ? [[-1.1, 12], [-0.5, 14], [0.1, 14], [0.7, 13], [1.2, 11]] : [[-1.3, 11], [-0.7, 13], [0, 15], [0.7, 13], [1.3, 11]];
  fronds.forEach(([slope, len]) => {
    for (let k = 0; k < len; k++) {
      const x = Math.round(cx + slope * k * 0.7), y = baseY - k;
      let c = gr[1]; if (slope < 0) c = gr[0]; if (k > len - 2) c = gr[2];
      P(g, x, y, c);
      if (k > 1 && k % 2 === 0) { P(g, x - 1, y, gr[2]); P(g, x + 1, y, gr[1]); }
    }
  });
  return fin(g);
}
function drawTallgrass(v: number): Grid {
  const g = makeGrid(16, 16), gr = RAMP.grass, baseY = 15;
  const blades = v === 0 ? [[3, 11, 1], [5, 14, 0], [7, 12, -1], [9, 15, 1], [11, 13, 0], [13, 10, -1]]
    : [[2, 10, 1], [4, 13, 0], [6, 15, -1], [8, 12, 1], [10, 14, 0], [12, 11, -1], [14, 9, 1]];
  blades.forEach(([x, h, curl]) => {
    for (let k = 0; k < h; k++) {
      const sx = Math.round(x + curl * (k / h) * 2.5);
      let c = gr[1]; if (curl < 0) c = gr[2]; if (k > h - 2) c = gr[0];
      P(g, sx, baseY - k, c);
    }
  });
  return fin(g);
}
function drawMeadowMushroom(v: number): Grid {
  const g = makeGrid(12, 10), bn = RAMP.bone, bl = RAMP.blood, em = RAMP.ember, baseY = 9;
  const caps: [number, number, number, readonly string[]][] = v === 0 ? [[4, 4, 2, bl], [8, 5, 2, em]] : [[3, 5, 2, em], [6, 3, 3, bl], [9, 6, 2, bl]];
  caps.forEach(([x, y, r, cap]) => {
    for (let k = y + 1; k <= baseY; k++) { P(g, x, k, bn[1]); P(g, x, k, k > baseY - 1 ? bn[2] : bn[1]); }
    ell(g, x, y, r, r * 0.8, (px, py, d, dx, dy) => { if (py > y) return; let c = cap[1]; if (dy < -0.3) c = cap[0]; if (d > 0.7) c = cap[2]; P(g, px, py, c); });
    P(g, x - 1, y, bn[0]); P(g, x + 1, y - 1, cap[0]);
  });
  return fin(g);
}
function drawGroveTree(v: number): Grid {
  const g = makeGrid(32, 40), gr = RAMP.grass, dt = RAMP.dirt, baseY = 38, cx = 16;
  const trunkH = v === 0 ? 16 : 13;
  for (let y = baseY; y >= baseY - trunkH; y--) {
    const w = y > baseY - 3 ? 4 : 3;
    for (let i = -w; i <= w; i++) { let c = dt[1]; if (i < -w + 1) c = dt[0]; if (i > w - 1) c = dt[3]; if (hash2(cx + i, y, 30) < 0.1) c = dt[2]; P(g, cx + i, y, c); }
  }
  P(g, cx - 5, baseY, dt[2]); P(g, cx + 5, baseY, dt[3]);
  if (v === 0) { for (let k = 0; k < 5; k++) P(g, cx + 3 + k, baseY - 12 - k, dt[2]); }
  if (v === 0) {
    ([[16, 13, 13, 10], [9, 16, 7, 6], [23, 16, 7, 6], [16, 8, 9, 7]] as [number, number, number, number][]).forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 31 + i));
  } else {
    ([[16, 9, 10, 8], [11, 16, 7, 6], [21, 16, 7, 6], [16, 18, 9, 6]] as [number, number, number, number][]).forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 41 + i));
  }
  return fin(g);
}
function drawLog(v: number): Grid {
  const g = makeGrid(24, 12), dt = RAMP.dirt, gr = RAMP.grass, bn = RAMP.bone, baseY = 10;
  for (let y = baseY - 6; y <= baseY; y++) for (let x = 2; x <= 21; x++) {
    let c = dt[1]; if (y < baseY - 4) c = dt[0]; if (y > baseY - 2) c = dt[3];
    if (hash2(x, y, 50 + v) < 0.1) c = dt[2];
    P(g, x, y, c);
  }
  ell(g, v === 0 ? 3 : 21, baseY - 3, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2]));
  for (let x = 4; x <= 19; x++) if (hash2(x, 0, 51 + v) < 0.5) P(g, x, baseY - 6, gr[2]);
  for (let x = 4; x <= 19; x++) if (hash2(x, 1, 52 + v) < 0.25) P(g, x, baseY - 5, gr[1]);
  return fin(g);
}
function drawStump(v: number): Grid {
  const g = makeGrid(16, 14), dt = RAMP.dirt, bn = RAMP.bone, gr = RAMP.grass, baseY = 13, cx = 8;
  const top = baseY - (v === 0 ? 8 : 6);
  for (let y = top; y <= baseY; y++) {
    const w = 5;
    for (let x = cx - w; x <= cx + w; x++) { let c = dt[1]; if (x < cx - w + 2) c = dt[0]; if (x > cx + w - 2) c = dt[3]; if (x % 3 === 0 && hash2(x, y, 60) < 0.6) c = dt[3]; P(g, x, y, c); }
  }
  ell(g, cx, top, 5, 2, (x, y, d) => { let c = dt[2]; if (d < 0.3) c = bn[3]; if (d > 0.7) c = dt[1]; P(g, x, y, c); });
  ell(g, cx, top, 3, 1.2, (x, y, d) => { if (d > 0.6) P(g, x, y, dt[3]); });
  if (v === 1) { P(g, cx + 2, top, gr[2]); P(g, cx - 3, baseY - 1, gr[2]); }
  return fin(g);
}
function drawSapling(v: number): Grid {
  const g = makeGrid(14, 20), gr = RAMP.grass, dt = RAMP.dirt, baseY = 19, cx = 7;
  const h = v === 0 ? 13 : 15;
  stem(g, cx, baseY, h, dt, v === 0 ? 1 : -1);
  const ty = baseY - h;
  const tufts = v === 0 ? [[cx + 1, ty, 4, 3], [cx - 2, ty + 4, 3, 2], [cx + 3, ty + 6, 3, 2]] : [[cx - 1, ty, 4, 3], [cx + 2, ty + 4, 3, 2], [cx - 3, ty + 7, 3, 2]];
  tufts.forEach(([x, y, rx, ry], i) => leafMass(g, x, y, rx, ry, gr, 70 + v + i));
  return fin(g);
}
function drawToadstool(v: number): Grid {
  const g = makeGrid(12, 12), bn = RAMP.bone, bl = RAMP.blood, dr = RAMP.drift, baseY = 11;
  const cx = v === 0 ? 6 : 5, capColor = v === 0 ? bl : dr;
  for (let y = 4; y <= baseY; y++) { const w = y > baseY - 2 ? 2 : 1; for (let i = -w; i <= w; i++) P(g, cx + i, y, i < 0 ? bn[0] : bn[1]); }
  ell(g, cx, 4, 5, 3.5, (x, y, d, dx, dy) => { if (y > 5) return; let c = capColor[1]; if (dy < -0.3) c = capColor[0]; if (d > 0.7) c = capColor[2]; P(g, x, y, c); });
  [[cx - 2, 3], [cx + 2, 3], [cx, 2], [cx + 1, 5]].forEach(([x, y]) => P(g, x, y, bn[0]));
  if (v === 1) { P(g, cx, 1, dr[0]); }
  if (v === 0) { for (let y = 8; y <= baseY; y++) P(g, 10, y, bn[1]); ell(g, 10, 8, 2, 1.5, (x, y, d) => { if (y > 8) return; P(g, x, y, d > 0.6 ? bl[2] : bl[1]); }); }
  return fin(g);
}
function drawBoulder(v: number): Grid {
  const g = makeGrid(22, 16), st = RAMP.stone, gr = RAMP.grass, baseY = 14, cx = 11;
  shadeMass(g, cx, baseY - 5, v === 0 ? 9 : 8, v === 0 ? 6 : 7, st as unknown as string[], 80 + v);
  if (v === 1) shadeMass(g, 16, baseY - 3, 4, 3, st as unknown as string[], 82);
  for (let x = cx - 6; x <= cx; x++) if (hash2(x, 0, 81 + v) < 0.45) P(g, x, baseY - 10 + Math.round(hash2(x, 1, 81) * 2), gr[2]);
  for (let x = cx - 5; x <= cx - 1; x++) if (hash2(x, 2, 81 + v) < 0.3) P(g, x, baseY - 9, gr[1]);
  return fin(g);
}
function drawRubble(v: number): Grid {
  const g = makeGrid(16, 10), st = RAMP.stone, seed = 90 + v;
  const rocks = v === 0 ? [[4, 7, 3], [10, 8, 2], [7, 5, 2], [13, 6, 2]] : [[3, 6, 2], [6, 8, 3], [11, 7, 2], [9, 5, 2], [13, 8, 2]];
  rocks.forEach(([x, y, r]) => {
    ell(g, x, y, r, r * 0.7, (px, py, d, dx, dy) => { let c = st[1]; if (dx + dy < -0.3) c = st[0]; if (d > 0.7) c = st[2]; if (py > y) c = st[3]; P(g, px, py, c); });
  });
  for (let i = 0; i < 6; i++) { const x = 2 + Math.floor(hash2(i, 1, seed) * 12), y = 4 + Math.floor(hash2(i, 2, seed) * 5); P(g, x, y, st[2]); }
  return fin(g, true);
}
function drawCattail(v: number): Grid {
  const g = makeGrid(14, 20), gr = RAMP.grass, dt = RAMP.dirt, baseY = 19;
  const reeds = v === 0 ? [[4, 16, 1], [7, 18, 0], [10, 15, -1]] : [[3, 14, 1], [6, 17, 0], [9, 18, -1], [11, 13, 1]];
  reeds.forEach(([x, h, ln], i) => {
    for (let k = 0; k < h; k++) { const sx = Math.round(x + ln * (k / h)); P(g, sx, baseY - k, k > h - 2 ? gr[0] : gr[1]); if (k % 4 === 2) P(g, sx - 1, baseY - k, gr[2]); }
    if (i % 2 === 0) { const hx = Math.round(x + ln), hy = baseY - h; for (let k = 0; k < 5; k++) for (let i2 = -1; i2 <= 1; i2++) { let c = dt[2]; if (i2 < 0) c = dt[1]; if (i2 > 0) c = dt[3]; P(g, hx + i2, hy + k, c); } P(g, hx, hy - 1, dt[2]); }
  });
  return fin(g);
}
function drawLilypad(v: number, f = 0): Grid {
  const g = makeGrid(16, 8), gr = RAMP.grass, dr = RAMP.drift, wt = RAMP.water, seed = 100 + v;
  const bob = f === 1 ? 1 : 0;
  const cx = 8, cy = 4 + bob;
  groundSplotch(g, cx, cy, v === 0 ? 7 : 6, 3.2, (x, y, d, dx, dy) => {
    if (dx > 0.3 && Math.abs(dy) < 0.25) return;
    let c = gr[1]; if (dx + dy < -0.3) c = gr[0]; if (d > 0.6) c = gr[2]; if (hash2(x, y, seed) < 0.12) c = gr[2];
    P(g, x, y, c);
  }, seed);
  P(g, cx - 7, cy + 1, wt[0]); P(g, cx + 6, cy + 2, wt[0]);
  if (v === 0) { P(g, cx - 1, cy - 1, dr[0]); P(g, cx, cy - 2, dr[1]); P(g, cx + 1, cy - 1, dr[1]); P(g, cx, cy - 1, dr[0]); }
  return fin(g, true);
}
function drawMud(v: number): Grid {
  const g = makeGrid(16, 8), dt = RAMP.dirt, wt = RAMP.water, seed = 110 + v;
  groundSplotch(g, 8, 4, v === 0 ? 7 : 6.5, 3.4, (x, y, d) => { let c = dt[2]; if (d < 0.3) c = dt[3]; if (hash2(x, y, seed) < 0.2) c = dt[1]; P(g, x, y, c); }, seed);
  const pud = v === 0 ? [[6, 4], [10, 5]] : [[5, 3], [9, 5], [11, 4]];
  pud.forEach(([x, y]) => { P(g, x, y, wt[1]); P(g, x + 1, y, wt[0]); P(g, x, y + 1, wt[2]); });
  return fin(g, true);
}
function drawAshTuft(v: number): Grid {
  const g = makeGrid(14, 10), em = RAMP.ember, baseY = 9;
  const ashgrey = ['#6f6781', '#564f6b', '#3a3450', '#211c30'];
  const blades = v === 0 ? [[3, 6, 1], [6, 8, 0], [9, 6, -1], [11, 5, 1]] : [[2, 5, 1], [5, 7, 0], [8, 8, -1], [11, 6, 1]];
  blades.forEach(([x, h, ln]) => {
    for (let k = 0; k < h; k++) { const sx = Math.round(x + ln * (k / h)); let c = ashgrey[1]; if (ln < 0) c = ashgrey[2]; if (k > h - 2) c = ashgrey[0]; P(g, sx, baseY - k, c); }
  });
  P(g, 5, baseY, em[1]); P(g, 9, baseY - 1, em[2]); if (v === 1) P(g, 7, baseY, em[0]);
  return fin(g);
}
function drawCharredBone(v: number): Grid {
  const g = makeGrid(16, 10), bn = RAMP.bone, em = RAMP.ember, seed = 120 + v;
  groundSplotch(g, 8, 7, 7, 2.5, (x, y) => P(g, x, y, RAMP.ash), seed);
  const shards = v === 0 ? [[3, 6, 5, 0.2], [9, 7, 4, -0.3], [6, 5, 3, 0.5]] : [[2, 7, 4, 0.1], [7, 6, 5, -0.2], [11, 7, 4, 0.3], [5, 5, 3, -0.4]];
  shards.forEach(([x, y, len, sl]) => {
    for (let k = 0; k < len; k++) { const px = x + k, py = y + Math.round(k * sl); let c = bn[2]; if (k < 1) c = RAMP.void; if (k > len - 2) c = bn[3]; P(g, px, py, c); P(g, px, py - 1, bn[1]); }
  });
  P(g, 5, 8, em[2]); if (v === 0) P(g, 11, 8, em[1]);
  return fin(g, true);
}
function drawWarDebris(v: number): Grid {
  const g = makeGrid(20, 12), st = RAMP.stone, dt = RAMP.dirt, bl = RAMP.blood, baseY = 11;
  const sx = v === 0 ? 7 : 12;
  ell(g, sx, baseY - 4, 5, 5, (x, y, d, dx, dy) => { let c = dt[1]; if (d < 0.25) c = dt[3]; if (dx + dy < -0.3) c = dt[0]; if (d > 0.78) c = dt[3]; P(g, x, y, c); });
  ell(g, sx, baseY - 4, 1.6, 1.6, (x, y) => P(g, x, y, st[1]));
  for (let k = -4; k <= 4; k++) if (k % 3 === 0) P(g, sx + k, baseY - 4, RAMP.void);
  P(g, sx - 2, baseY - 7, bl[2]); P(g, sx + 1, baseY - 6, bl[2]);
  const ex = v === 0 ? 13 : 4;
  for (let k = 0; k < 9; k++) P(g, ex + Math.round(k * (v === 0 ? 0.6 : -0.6)), baseY - 1 - Math.round(k * 0.3), dt[3]);
  const tipx = ex + Math.round(8 * (v === 0 ? 0.6 : -0.6)), tipy = baseY - 1 - Math.round(8 * 0.3);
  P(g, tipx, tipy, st[0]); P(g, tipx + (v === 0 ? 1 : -1), tipy - 1, st[1]);
  return fin(g);
}
function drawSkull(v: number): Grid {
  const g = makeGrid(12, 10), bn = RAMP.bone, dt = RAMP.dirt, baseY = 9, cx = 6;
  groundSplotch(g, cx, baseY, 6, 2, (x, y) => P(g, x, y, dt[3]), 130 + v);
  ell(g, cx, baseY - 4, 4, 3.6, (x, y, d, dx, dy) => { if (y > baseY - 1) return; let c = bn[2]; if (dy < -0.2) c = bn[1]; if (dx < -0.2) c = bn[0]; if (d > 0.78) c = bn[3]; P(g, x, y, c); });
  P(g, cx - 2, baseY - 4, RAMP.void); P(g, cx + 1, baseY - 4, RAMP.void);
  P(g, cx - 1, baseY - 2, RAMP.void);
  for (let x = cx - 2; x <= cx + 1; x++) P(g, x, baseY - 1, bn[3]);
  if (v === 1) { ell(g, cx + 4, baseY - 1, 2, 1.5, (x, y) => P(g, x, y, bn[3])); }
  return fin(g);
}
function drawGraveNub(v: number): Grid {
  const g = makeGrid(14, 16), st = RAMP.stone, gr = RAMP.grass, baseY = 15, cx = 7;
  if (v === 0) {
    const lean = 1;
    for (let y = baseY - 1; y >= 3; y--) { const t = (baseY - y) / 12; const w = 3; const off = Math.round(t * lean * 2); for (let i = -w; i <= w; i++) { let c = st[1]; if (i < -w + 1) c = st[0]; if (i > w - 1) c = st[3]; if (hash2(cx + i, y, 140) < 0.08) c = st[2]; P(g, cx + i + off, y, c); } }
    ell(g, cx + 2, 3, 3, 2, (x, y, d) => { if (y > 3) return; P(g, x, y, d > 0.6 ? st[3] : st[1]); });
    P(g, cx + 1, 7, st[3]); P(g, cx + 3, 7, st[3]);
  } else {
    ([[cx, baseY - 2, 4, 2.5], [cx - 1, baseY - 5, 3, 2], [cx + 1, baseY - 8, 2.5, 2], [cx, baseY - 10, 1.8, 1.5]] as [number, number, number, number][]).forEach(([x, y, rx, ry], i) => shadeMass(g, x, y, rx, ry, st as unknown as string[], 141 + i));
  }
  P(g, cx - 4, baseY, gr[1]); P(g, cx + 4, baseY, gr[2]);
  return fin(g);
}
function drawDeadShrub(v: number): Grid {
  const g = makeGrid(16, 14), dt = RAMP.dirt, baseY = 13, cx = 8;
  const branches = v === 0 ? [[-1.0, 10], [-0.4, 12], [0.2, 11], [0.8, 10], [1.3, 8]] : [[-1.3, 9], [-0.6, 11], [0, 12], [0.5, 11], [1.1, 9], [-0.2, 7]];
  branches.forEach(([slope, len]) => {
    let x = cx, y = baseY;
    for (let k = 0; k < len; k++) {
      x = Math.round(cx + slope * k * 0.8); y = baseY - k;
      let c = dt[2]; if (slope < 0) c = dt[1]; if (k > len - 2) c = dt[3];
      P(g, x, y, c);
      if (k > 2 && k % 3 === 0) { P(g, x + (slope < 0 ? -1 : 1), y - 1, dt[3]); }
    }
  });
  P(g, cx, baseY, dt[3]); P(g, cx - 1, baseY, dt[2]); P(g, cx + 1, baseY, dt[2]);
  return fin(g);
}

export function makeBiomeDoodad(key: BiomeDoodadKey, v = 0, f = 0): Grid {
  switch (key) {
    case 'wildflower': return drawWildflower(v);
    case 'daisies': return drawDaisies(v);
    case 'clover': return drawClover(v);
    case 'bush': return drawBush(v);
    case 'fern': return drawFern(v);
    case 'tallgrass': return drawTallgrass(v);
    case 'meadow_mushroom': return drawMeadowMushroom(v);
    case 'grove_tree': return drawGroveTree(v);
    case 'log': return drawLog(v);
    case 'stump': return drawStump(v);
    case 'sapling': return drawSapling(v);
    case 'toadstool': return drawToadstool(v);
    case 'boulder': return drawBoulder(v);
    case 'rubble': return drawRubble(v);
    case 'cattail': return drawCattail(v);
    case 'lilypad': return drawLilypad(v, f);
    case 'mud': return drawMud(v);
    case 'ash_tuft': return drawAshTuft(v);
    case 'charred_bone': return drawCharredBone(v);
    case 'war_debris': return drawWarDebris(v);
    case 'skull': return drawSkull(v);
    case 'grave_nub': return drawGraveNub(v);
    case 'dead_shrub': return drawDeadShrub(v);
  }
}

// ── Ambient wildlife — DS port (_gen/critters.js) ────────────────────────────
export type CritterKind = 'deer' | 'rabbit' | 'frog' | 'songbird' | 'crow' | 'vulture' | 'dragonfly' | 'firefly' | 'butterfly';
export interface CritterSpec {
  cell: [number, number]; anchor: [number, number]; facings: string[];
  mirror: Record<string, string> | null; anims: [string, number, number][];
  fly?: { height: number; shadow: [number, number] }; additive?: boolean; flat?: boolean;
}
function critterShadow(g: Grid, cx: number, cy: number, rx: number, ry: number) {
  ell(g, cx, cy, rx, ry, (x, y, d) => { if (d > 0.6 && (x + y) % 2) return; P(g, x, y, RAMP.void, 0.45); });
}
function wing(g: Grid, x0: number, y0: number, dx: number, dy: number, L: number, ramp: readonly string[], lead: boolean) {
  for (let k = 0; k < L; k++) { const x = Math.round(x0 + dx * k), y = Math.round(y0 + dy * k); P(g, x, y, k < 1 ? ramp[0] : (k > L - 2 ? ramp[2] : ramp[1])); if (lead) P(g, x, y - 1, ramp[0]); }
}
function drawDeer(facing: string, anim: string, f: number): Grid {
  const g = makeGrid(24, 28), co = RAMP.dirt, bn = RAMP.bone, baseY = 26, cx = 12;
  const breath = anim === 'idle' ? (f === 1 ? -1 : 0) : 0, oy = breath;
  const swA = anim === 'walk' ? [2, 0, -2, 0][f] : 0;
  const swB = anim === 'walk' ? [-2, 0, 2, 0][f] : 0;
  const headBob = anim === 'walk' ? [0, -1, 0, -1][f] : (anim === 'idle' && f === 1 ? -1 : 0);
  const leg = (x: number, topY: number, sw: number, ramp: readonly string[]) => {
    for (let y = topY; y <= baseY - 1; y++) { const t = (y - topY) / (baseY - topY); P(g, Math.round(x + sw * t), y, y > baseY - 3 ? RAMP.void : ramp[2]); }
  };
  if (facing === 'e') {
    critterShadow(g, cx, baseY, 10, 2);
    leg(cx - 4, 16 + oy, swB, co); leg(cx + 5, 16 + oy, swA, co);
    ell(g, cx, 15 + oy, 8, 5, (x, y, d, dx, dy) => { let c = co[1]; if (dy < -0.3) c = co[0]; if (dy > 0.4) c = co[2]; if (d > 0.78) c = co[2]; P(g, x, y, c); });
    P(g, cx - 6, 17 + oy, bn[1]);
    P(g, cx - 8, 13 + oy, co[2]); P(g, cx - 8, 12 + oy, bn[0]);
    leg(cx - 3, 17 + oy, swA, co); leg(cx + 6, 17 + oy, swB, co);
    for (let k = 0; k < 7; k++) { const x = cx + 6 + Math.round(k * 0.5), y = 14 + oy - k + headBob; for (let i = 0; i < 3; i++) P(g, x + i, y, i === 0 ? co[0] : co[1]); }
    const hx = cx + 11, hy = 8 + oy + headBob;
    ell(g, hx, hy, 2.4, 2, (x, y, d, dx) => { let c = co[1]; if (dx < -0.2) c = co[0]; if (d > 0.7) c = co[2]; P(g, x, y, c); });
    for (let k = 0; k < 3; k++) P(g, hx + 1 + k, hy + 1 + k, co[2]);
    P(g, hx + 3, hy + 3, RAMP.void); P(g, hx, hy - 1, RAMP.void);
    P(g, hx - 2, hy - 2, co[2]); P(g, hx + 1, hy - 2, co[1]);
    P(g, hx, hy - 3, bn[3]); P(g, hx + 1, hy - 4, bn[2]);
  } else if (facing === 's') {
    critterShadow(g, cx, baseY, 8, 2);
    leg(cx - 4, 18 + oy, 0, co); leg(cx + 4, 18 + oy, 0, co);
    leg(cx - 2, 18 + oy, swA, co); leg(cx + 2, 18 + oy, swB, co);
    ell(g, cx, 15 + oy, 6, 6, (x, y, d, dx, dy) => { let c = co[1]; if (dx < -0.25) c = co[0]; if (dx > 0.3) c = co[2]; if (d > 0.8) c = co[2]; P(g, x, y, c); });
    P(g, cx, 19 + oy, bn[1]);
    for (let k = 0; k < 5; k++) for (let i = -2; i <= 2; i++) P(g, cx + i, 12 + oy - k + headBob, i < 0 ? co[0] : co[1]);
    const hy = 7 + oy + headBob;
    ell(g, cx, hy, 3, 2.6, (x, y, d, dx) => { let c = co[1]; if (dx < -0.2) c = co[0]; if (d > 0.78) c = co[2]; P(g, x, y, c); });
    P(g, cx, hy + 2, RAMP.void); P(g, cx - 2, hy - 1, RAMP.void); P(g, cx + 2, hy - 1, RAMP.void);
    P(g, cx - 3, hy - 2, co[2]); P(g, cx + 3, hy - 2, co[1]);
    P(g, cx - 1, hy - 4, bn[3]); P(g, cx + 1, hy - 4, bn[3]);
  } else {
    critterShadow(g, cx, baseY, 8, 2);
    for (let k = 0; k < 4; k++) for (let i = -1; i <= 1; i++) P(g, cx + i, 9 + oy - k, co[2]);
    ell(g, cx, 7 + oy, 2.2, 2, (x, y, d) => P(g, x, y, d > 0.6 ? co[3] : co[2]));
    P(g, cx - 2, 5 + oy, co[3]); P(g, cx + 2, 5 + oy, co[3]);
    leg(cx - 4, 18 + oy, swA, co); leg(cx + 4, 18 + oy, swB, co);
    leg(cx - 2, 18 + oy, swB, co); leg(cx + 2, 18 + oy, swA, co);
    ell(g, cx, 15 + oy, 6, 6, (x, y, d, dx, dy) => { let c = co[1]; if (dy < -0.3) c = co[0]; if (Math.abs(dx) > 0.5) c = co[2]; if (d > 0.8) c = co[2]; P(g, x, y, c); });
    P(g, cx, 12 + oy, bn[0]); P(g, cx, 13 + oy, bn[1]);
  }
  outline(g, RAMP.void);
  return g;
}
function drawRabbit(_facing: string, anim: string, f: number): Grid {
  const g = makeGrid(14, 14), co = RAMP.bone, dt = RAMP.dirt, baseY = 13, cx = 6;
  const hop = anim === 'hop' ? f : -1;
  const lift = hop === 1 ? 3 : 0, stretch = hop === 1 ? 1 : 0;
  const earTw = (anim === 'idle' && f === 1) ? 1 : 0, oy = -lift;
  if (hop !== 1) critterShadow(g, cx + 1, baseY, 5, 1.5); else critterShadow(g, cx + 3, baseY, 4, 1);
  if (hop !== 1) { P(g, cx - 2, baseY - 1, co[2]); P(g, cx - 1, baseY - 1, co[1]); P(g, cx - 2, baseY, dt[3]); }
  ell(g, cx, baseY - 4 + oy, 4 + stretch, 4 - stretch, (x, y, d, dx, dy) => { let c = co[1]; if (dy < -0.3) c = co[0]; if (d > 0.74) c = co[2]; P(g, x, y, c); });
  const hx = cx + 4 + stretch, hy = baseY - 6 + oy;
  ell(g, hx, hy, 2.2, 2, (x, y, d, dx) => { let c = co[1]; if (dx < -0.2) c = co[0]; if (d > 0.7) c = co[2]; P(g, x, y, c); });
  P(g, hx + 2, hy, RAMP.void); P(g, hx + 2, hy + 1, dt[2]);
  P(g, hx - 1, hy - 2 - earTw, co[1]); P(g, hx - 1, hy - 3 - earTw, co[2]); P(g, hx - 1, hy - 4 - earTw, co[2]);
  P(g, hx + 1, hy - 2, co[0]); P(g, hx + 1, hy - 3, co[1]); P(g, hx + 1, hy - 4, co[2]);
  P(g, cx - 4, baseY - 5 + oy, co[0]); P(g, cx - 4, baseY - 4 + oy, co[1]);
  outline(g, RAMP.void);
  return g;
}
function drawFrog(_facing: string, anim: string, f: number): Grid {
  const g = makeGrid(12, 10), gr = RAMP.grass, baseY = 9, cx = 6;
  const leap = anim === 'hop' && f === 1, oy = leap ? -2 : 0;
  const puff = (anim === 'idle' && f === 1) ? 1 : 0;
  critterShadow(g, cx, baseY, 5, 1.5);
  if (leap) { for (let k = 0; k < 4; k++) P(g, cx - 3 - k, baseY - 1, gr[2]); }
  else { P(g, cx - 4, baseY - 1, gr[2]); P(g, cx - 4, baseY - 2, gr[1]); P(g, cx + 4, baseY - 1, gr[2]); }
  ell(g, cx, baseY - 3 + oy, 4, 3, (x, y, d, dx, dy) => { let c = gr[1]; if (dy < -0.3) c = gr[0]; if (d > 0.74) c = gr[2]; P(g, x, y, c); });
  for (let i = -1; i <= 1; i++) P(g, cx + 2 + i, baseY - 1 + oy, gr[0]);
  if (puff) { P(g, cx + 2, baseY + oy, gr[1]); }
  P(g, cx - 1, baseY - 6 + oy, gr[0]); P(g, cx - 1, baseY - 7 + oy, RAMP.void);
  P(g, cx + 2, baseY - 6 + oy, gr[0]); P(g, cx + 2, baseY - 7 + oy, RAMP.void);
  P(g, cx, baseY - 5 + oy, gr[2]);
  outline(g, RAMP.void);
  return g;
}
function drawSongbird(_facing: string, anim: string, f: number): Grid {
  const g = makeGrid(12, 10), co = RAMP.stone, em = RAMP.ember, baseY = 9, cx = 6;
  const fly = anim === 'fly';
  const oy = fly ? -2 : (anim === 'hop' && f === 1 ? -1 : 0);
  if (!fly) critterShadow(g, cx, baseY, 4, 1.2);
  if (!fly) { P(g, cx, baseY - 1, em[3]); P(g, cx + 1, baseY - 1, em[3]); }
  ell(g, cx, baseY - 4 + oy, 3, 3, (x, y, d, dx, dy) => { let c = co[1]; if (dy < -0.3) c = co[0]; if (d > 0.74) c = co[2]; P(g, x, y, c); });
  P(g, cx + 1, baseY - 3 + oy, em[1]); P(g, cx + 2, baseY - 3 + oy, em[0]); P(g, cx + 1, baseY - 2 + oy, em[2]);
  P(g, cx + 3, baseY - 5 + oy, co[0]); P(g, cx + 4, baseY - 5 + oy, co[1]);
  P(g, cx + 5, baseY - 5 + oy, em[2]);
  P(g, cx + 4, baseY - 6 + oy, RAMP.void); P(g, cx + 4, baseY - 5 + oy, RAMP.void);
  if (fly) { const up = f === 0; wing(g, cx, baseY - 4 + oy, -1.2, up ? -1 : 1, 4, co, false); }
  else { for (let k = 0; k < 3; k++) P(g, cx - 1 - k, baseY - 4 + oy, co[2]); }
  for (let k = 0; k < 3; k++) P(g, cx - 3 - k, baseY - 3 + oy + (fly ? 1 : 0), co[2]);
  outline(g, RAMP.void);
  return g;
}
function drawCrow(_facing: string, anim: string, f: number): Grid {
  const g = makeGrid(16, 16), bk = ['#322b46', '#211c30', '#14101e', '#0a0810'], dr = RAMP.drift, cx = 8;
  const fly = anim === 'fly', cy = fly ? 7 : 10;
  if (anim === 'perch') {
    const ht = f === 1 ? 1 : 0;
    P(g, cx, 14, bk[2]); P(g, cx + 1, 14, bk[2]);
    ell(g, cx, cy, 4, 4, (x, y, d, dx, dy) => { let c = bk[1]; if (dy < -0.3) c = bk[0]; if (d > 0.74) c = bk[2]; P(g, x, y, c); });
    for (let k = 0; k < 4; k++) P(g, cx - 3 - 0, cy + 2 + k, bk[2]);
    P(g, cx + 3 + ht, cy - 3, bk[0]); P(g, cx + 4 + ht, cy - 3, bk[1]);
    P(g, cx + 5 + ht, cy - 3, bk[3]); P(g, cx + 6 + ht, cy - 3, bk[3]);
    P(g, cx + 4 + ht, cy - 4, bk[0]);
    P(g, cx + 4 + ht, cy - 3, dr[1]);
  } else {
    ell(g, cx, cy, 3, 2.4, (x, y, d, dx, dy) => { let c = bk[1]; if (dy < -0.3) c = bk[0]; if (d > 0.74) c = bk[2]; P(g, x, y, c); });
    const up = f === 0;
    wing(g, cx - 1, cy, -1.4, up ? -1 : 0.8, 6, bk, false);
    wing(g, cx + 1, cy, 1.4, up ? -1 : 0.8, 6, bk, false);
    P(g, cx + 3, cy - 1, bk[0]); P(g, cx + 4, cy - 1, bk[2]); P(g, cx + 5, cy - 1, bk[3]);
    P(g, cx + 3, cy - 1, dr[2]);
    for (let k = 0; k < 3; k++) P(g, cx - 3 - k, cy + 1, bk[2]);
  }
  outline(g, RAMP.void);
  return g;
}
function drawVulture(_facing: string, anim: string, f: number): Grid {
  const g = makeGrid(18, 16), co = RAMP.dirt, bn = RAMP.bone, bl = RAMP.blood, cx = 9, cy = 8;
  const flap = anim === 'flap';
  const wy = flap ? (f === 0 ? -2 : 1) : (f === 0 ? 0 : -1);
  ell(g, cx, cy, 3, 2.6, (x, y, d, dx, dy) => { let c = co[2]; if (dy < -0.3) c = co[1]; if (d > 0.74) c = co[3]; P(g, x, y, c); });
  for (let s = -1; s <= 1; s += 2) {
    for (let k = 1; k <= 7; k++) {
      const x = cx + s * k, y = cy - 1 + Math.round(wy * (k / 7)) + (k > 4 ? 1 : 0);
      let c = co[2]; if (k <= 2) c = co[1]; if (k > 5) c = co[3];
      P(g, x, y, c);
      if (k > 4) P(g, x, y + 1, RAMP.void);
    }
  }
  P(g, cx + 3, cy - 2, bn[2]); P(g, cx + 4, cy - 2, bn[1]);
  P(g, cx + 5, cy - 2, bn[3]); P(g, cx + 5, cy - 1, co[3]);
  P(g, cx + 3, cy - 2, RAMP.void);
  P(g, cx + 1, cy - 1, bl[2]); P(g, cx + 2, cy, bl[3]);
  for (let k = 0; k < 3; k++) P(g, cx - 3 - k, cy + 1, co[3]);
  outline(g, RAMP.void);
  return g;
}
function drawDragonfly(_facing: string, _anim: string, f: number): Grid {
  const g = makeGrid(12, 8), dr = RAMP.drift, wt = RAMP.water, bn = RAMP.bone, cx = 4, cy = 4;
  for (let k = 0; k < 7; k++) { let c = wt[1]; if (k % 2) c = dr[2]; if (k > 4) c = wt[2]; P(g, cx + 1 + k, cy, c); }
  P(g, cx + 8, cy, dr[1]);
  P(g, cx, cy, dr[1]); P(g, cx - 1, cy, dr[0]);
  P(g, cx - 2, cy, RAMP.void);
  const up = f === 0;
  const wingBlur = (x: number, y: number, dy: number) => { for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= 3; k++) P(g, x + s * k, y + dy * (k > 1 ? 1 : 0), bn[3]); };
  wingBlur(cx, cy - 1, up ? -1 : 0);
  wingBlur(cx + 1, cy - 1, up ? -1 : 0);
  outline(g, RAMP.void);
  return g;
}
function drawFirefly(_facing: string, _anim: string, f: number): Grid {
  const g = makeGrid(8, 8), gd = RAMP.gold, dr = RAMP.drift, cx = 4, cy = 4;
  const bright = f === 0, r = bright ? 3 : 2;
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
    const d = xx * xx + yy * yy;
    if (d > (r - 0.5) * (r - 0.5) && d <= (r + 0.5) * (r + 0.5) && (xx + yy + f) % 2 === 0) P(g, cx + xx, cy + yy, bright ? gd[2] : dr[3]);
  }
  P(g, cx - 1, cy, RAMP.void); P(g, cx, cy, RAMP.dirt[3]);
  P(g, cx + 1, cy, bright ? gd[0] : gd[1]);
  P(g, cx + 1, cy - 1, bright ? '#fffdf0' : gd[0]);
  P(g, cx, cy + 1, bright ? gd[1] : gd[2]);
  return g;
}
function drawButterfly(_facing: string, _anim: string, f: number): Grid {
  const g = makeGrid(10, 10), dr = RAMP.drift, gd = RAMP.gold, cx = 5, cy = 5;
  for (let k = -2; k <= 2; k++) P(g, cx, cy + k, RAMP.dirt[3]);
  P(g, cx, cy - 3, RAMP.dirt[2]);
  P(g, cx - 1, cy - 4, RAMP.dirt[2]); P(g, cx + 1, cy - 4, RAMP.dirt[2]);
  const spread = [3, 2, 1][f];
  for (let s = -1; s <= 1; s += 2) {
    for (let wy = -2; wy <= 2; wy++) for (let wx = 1; wx <= spread; wx++) {
      let c = dr[1]; if (Math.abs(wy) >= 2) c = dr[2]; if (wx === 1) c = dr[0];
      if (wy === 0 && wx === spread) c = gd[1];
      P(g, cx + s * wx, cy + wy, c);
    }
    if (f < 2) { P(g, cx + s * 1, cy + 3, dr[2]); P(g, cx + s * 2, cy + 3, dr[2]); }
  }
  outline(g, RAMP.void);
  return g;
}
const CRITTER_DRAW: Record<CritterKind, (facing: string, anim: string, f: number) => Grid> = {
  deer: drawDeer, rabbit: drawRabbit, frog: drawFrog, songbird: drawSongbird, crow: drawCrow,
  vulture: drawVulture, dragonfly: drawDragonfly, firefly: drawFirefly, butterfly: drawButterfly,
};
export const CRITTER_SPECS: Record<CritterKind, CritterSpec> = {
  deer: { cell: [24, 28], anchor: [12, 26], facings: ['s', 'e', 'n'], mirror: { w: 'e' }, anims: [['idle', 2, 2], ['walk', 4, 6]] },
  rabbit: { cell: [14, 14], anchor: [6, 13], facings: ['e'], mirror: { w: 'e' }, anims: [['idle', 2, 2], ['hop', 3, 8]] },
  frog: { cell: [12, 10], anchor: [6, 9], facings: ['e'], mirror: { w: 'e' }, anims: [['idle', 2, 2], ['hop', 2, 6]] },
  songbird: { cell: [12, 10], anchor: [6, 9], facings: ['e'], mirror: { w: 'e' }, anims: [['hop', 2, 4], ['fly', 2, 8]], fly: { height: 14, shadow: [4, 1.5] } },
  crow: { cell: [16, 16], anchor: [8, 14], facings: ['_'], mirror: null, anims: [['perch', 2, 2], ['fly', 2, 6]], fly: { height: 22, shadow: [5, 2] } },
  vulture: { cell: [18, 16], anchor: [9, 8], facings: ['_'], mirror: null, anims: [['glide', 2, 2], ['flap', 2, 4]], fly: { height: 34, shadow: [7, 2.5] } },
  dragonfly: { cell: [12, 8], anchor: [4, 4], facings: ['_'], mirror: null, anims: [['hover', 2, 12]], fly: { height: 12, shadow: [3, 1] } },
  firefly: { cell: [8, 8], anchor: [4, 4], facings: ['_'], mirror: null, anims: [['pulse', 2, 3]], fly: { height: 16, shadow: [2, 1] }, additive: true, flat: true },
  butterfly: { cell: [10, 10], anchor: [5, 5], facings: ['_'], mirror: null, anims: [['flutter', 3, 6]], fly: { height: 14, shadow: [3, 1] } },
};
export function makeCritter(kind: CritterKind, facing: string, anim: string, f: number): Grid {
  return CRITTER_DRAW[kind](facing, anim, f);
}

// ── Micro-POIs — DS port (_gen/micropoi.js) ──────────────────────────────────
export type MicroPoiKey = 'well' | 'signpost' | 'wagon_wreck' | 'ruined_hut' | 'grave_row'
  | 'standing_stones' | 'scarecrow' | 'beehive' | 'hay_bales' | 'old_campfire' | 'fence'
  | 'fishing_spot' | 'bridge';
export interface MicroPoiSpec { cell: [number, number]; anchor: [number, number]; frames: number; fn: (f: number) => Grid; ground?: boolean; tileable?: string }
function mpole(g: Grid, x: number, y0: number, y1: number, ramp: readonly string[], w = 3) {
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) { let c = ramp[1]; if (i === 0) c = ramp[0]; if (i === w - 1) c = ramp[3]; if (hash2(x + i, y, 411) < 0.1) c = ramp[2]; P(g, x + i, y, c); }
}
function mcrate(g: Grid, x: number, top: number, w: number, h: number, ramp: readonly string[]) {
  for (let i = -1; i < w + 1; i++) P(g, x + i, top, ramp[2]);
  for (let y = top; y < top + h; y++) for (let i = 0; i < w; i++) { let c = ramp[1]; if (i < 2) c = ramp[0]; if (i > w - 3) c = ramp[3]; if (hash2(x + i, y, 413) < 0.08) c = ramp[2]; P(g, x + i, y, c); }
  for (let i = 4; i < w; i += 5) for (let y = top; y < top + h; y++) P(g, x + i, y, ramp[3]);
}
function groundOval(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string, _seed: number) {
  ell(g, cx, cy, rx, ry, (x, y, d) => { if (y < cy - 1) return; if (d > 0.85 && (x + y) % 2) return; P(g, x, y, c, c === RAMP.void ? 0.4 : 1); });
}
function drawWell(): Grid {
  const g = makeGrid(32, 40), st = RAMP.stone, dt = RAMP.dirt, wt = RAMP.water, bn = RAMP.bone, cx = 16, baseY = 37;
  groundOval(g, cx, baseY, 14, 4, RAMP.void, 1);
  for (let y = baseY - 12; y <= baseY - 1; y++) for (let x = cx - 9; x <= cx + 9; x++) {
    const dx = (x - cx) / 9; if (Math.abs(dx) > 1) continue;
    let c = st[1]; if (x < cx - 6) c = st[0]; if (x > cx + 5) c = st[3];
    if ((x + y) % 4 === 0) c = st[3];
    if (hash2(x, y, 420) < 0.08) c = st[2];
    P(g, x, y, c);
  }
  ell(g, cx, baseY - 12, 9, 3, (x, y, d) => { let c = st[2]; if (d < 0.6) c = wt[3]; if (d < 0.3) c = wt[2]; P(g, x, y, c); });
  ell(g, cx, baseY - 12, 9, 3, (x, y, d) => { if (d > 0.82) P(g, x, y, st[0]); });
  mpole(g, cx - 8, baseY - 26, baseY - 12, dt, 2); mpole(g, cx + 7, baseY - 26, baseY - 12, dt, 2);
  for (let k = 0; k <= 9; k++) { for (let x = cx - 11 + k; x <= cx + 11 - k; x++) P(g, x, baseY - 26 - k, k === 9 ? dt[0] : (x < cx ? dt[1] : dt[2])); }
  P(g, cx, baseY - 36, dt[0]);
  for (let x = cx - 6; x <= cx + 6; x++) P(g, x, baseY - 24, dt[3]);
  P(g, cx + 1, baseY - 23, bn[3]); for (let y = baseY - 23; y <= baseY - 16; y++) P(g, cx + 1, y, bn[3]);
  mcrate(g, cx - 1, baseY - 16, 4, 4, dt); P(g, cx, baseY - 16, st[2]);
  outline(g, RAMP.void);
  return g;
}
function drawSignpost(): Grid {
  const g = makeGrid(24, 40), dt = RAMP.dirt, bn = RAMP.bone, gr = RAMP.grass, cx = 11, baseY = 37;
  groundOval(g, cx, baseY, 7, 2, RAMP.void, 1);
  mpole(g, cx, 6, baseY - 1, dt, 3);
  const board = (y: number, dir: number) => {
    const x0 = dir > 0 ? cx + 3 : cx - 13, x1 = dir > 0 ? cx + 13 : cx - 3;
    for (let yy = y; yy < y + 5; yy++) for (let x = x0; x <= x1; x++) { let c = dt[1]; if (yy === y) c = dt[0]; if (yy === y + 4) c = dt[3]; if (hash2(x, yy, 430) < 0.1) c = dt[2]; P(g, x, yy, c); }
    const tip = dir > 0 ? x1 : x0;
    P(g, tip + dir, y + 1, dt[2]); P(g, tip + dir, y + 3, dt[3]); P(g, tip + 2 * dir, y + 2, dt[2]);
    for (let x = (dir > 0 ? cx + 5 : cx - 11); x < (dir > 0 ? cx + 11 : cx - 5); x += 2) P(g, x, y + 2, bn[3]);
  };
  board(11, 1); board(20, -1);
  P(g, cx - 3, baseY - 1, gr[2]); P(g, cx + 4, baseY - 1, gr[2]);
  outline(g, RAMP.void);
  return g;
}
function drawWagonWreck(): Grid {
  const g = makeGrid(64, 40), dt = RAMP.dirt, st = RAMP.stone, gr = RAMP.grass, baseY = 37;
  groundOval(g, 32, baseY, 28, 5, RAMP.void, 1);
  for (let y = baseY - 14; y <= baseY - 2; y++) for (let x = 10; x <= 44; x++) {
    const tilt = Math.round((x - 10) * 0.2);
    let c = dt[1]; if (y - tilt < baseY - 12) c = dt[0]; if (y - tilt > baseY - 5) c = dt[3];
    if (x % 6 === 0) c = dt[3];
    if (hash2(x, y, 440) < 0.1) c = dt[2];
    P(g, x, y - tilt + 6, c);
  }
  const wheel = (wx: number, wy: number, broken: boolean) => {
    ell(g, wx, wy, 7, 7, (x, y, d) => { if (d > 0.78) P(g, x, y, dt[3]); else if (d > 0.62) P(g, x, y, dt[2]); });
    if (!broken) { for (let a = 0; a < 6; a++) { const ang = a / 6 * Math.PI * 2; for (let k = 0; k < 6; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(wy + Math.sin(ang) * k), dt[3]); } ell(g, wx, wy, 1.6, 1.6, (x, y) => P(g, x, y, st[2])); }
    else { for (let a = 0; a < 3; a++) { const ang = a / 6 * Math.PI * 2 + 0.4; for (let k = 0; k < 5; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(wy + Math.sin(ang) * k), dt[3]); } }
  };
  wheel(16, baseY - 7, false); wheel(45, baseY - 4, true);
  for (let k = 0; k < 10; k++) P(g, 48 + k, baseY - 12 - k, dt[2]);
  mcrate(g, 30, baseY - 11, 9, 9, dt); mcrate(g, 40, baseY - 8, 7, 7, dt);
  for (let i = 0; i < 8; i++) { const x = 12 + Math.floor(hash2(i, 1, 441) * 40); P(g, x, baseY - 2, gr[2]); }
  outline(g, RAMP.void);
  return g;
}
function drawRuinedHut(): Grid {
  const g = makeGrid(80, 72), st = RAMP.stone, dt = RAMP.dirt, gr = RAMP.grass, baseY = 68;
  groundOval(g, 40, baseY, 34, 6, RAMP.void, 1);
  const wall = (x0: number, x1: number, topFn: (x: number) => number) => {
    for (let x = x0; x <= x1; x++) { const top = topFn(x); for (let y = top; y <= baseY - 1; y++) { let c = st[1]; if (x < x0 + 3) c = st[0]; if (x > x1 - 3) c = st[3]; if ((x + y) % 4 === 0) c = st[3]; if (hash2(x, y, 450) < 0.08) c = st[2]; P(g, x, y, c); } }
  };
  wall(12, 40, (x) => 26 + Math.round(Math.sin(x * 0.7) * 2) + (x > 34 ? (x - 34) * 1.5 : 0));
  wall(50, 68, (x) => baseY - 14 + Math.round(Math.sin(x * 0.9) * 3) + (x < 56 ? -6 : 0));
  for (let y = baseY - 16; y <= baseY - 1; y++) for (let x = 40; x <= 48; x++) P(g, x, y, null as unknown as string);
  for (let y = baseY - 16; y <= baseY - 1; y++) { P(g, 40, y, st[3]); P(g, 48, y, st[3]); }
  for (let x = 10; x <= 44; x++) { const topY = 22 + Math.round(Math.abs(x - 27) * 0.4); for (let k = 0; k < 6; k++) { const y = topY + k; if (hash2(x, y, 451) < 0.25) continue; let c = dt[2]; if (k === 0) c = dt[1]; if (k > 4) c = dt[3]; P(g, x, y, c); } }
  for (let i = 0; i < 18; i++) { const x = 50 + Math.floor(hash2(i, 1, 452) * 18), y = baseY - 2 - Math.floor(hash2(i, 2, 452) * 4); P(g, x, y, hash2(i, 3, 452) < 0.5 ? st[2] : st[3]); }
  for (let k = 0; k < 12; k++) P(g, 52 + k, baseY - 6 - Math.round(k * 0.4), dt[3]);
  for (let i = 0; i < 14; i++) { const x = 14 + Math.floor(hash2(i, 4, 453) * 60); P(g, x, baseY - 1, gr[2]); }
  for (let y = baseY - 8; y <= baseY - 1; y++) P(g, 30, y, dt[2]);
  ell(g, 30, baseY - 9, 4, 4, (x, y, d) => P(g, x, y, d > 0.7 ? gr[2] : gr[1]));
  outline(g, RAMP.void);
  return g;
}
function drawGraveRow(): Grid {
  const g = makeGrid(64, 32), st = RAMP.stone, dt = RAMP.dirt, gr = RAMP.grass, baseY = 29;
  groundOval(g, 32, baseY, 30, 4, dt[3], 1);
  const stones: [number, number, number][] = [[10, 12, 1], [24, 10, -1], [40, 13, 1], [54, 11, 0]];
  stones.forEach(([cx, h, lean], i) => {
    for (let y = baseY - 1; y >= baseY - h; y--) { const t = (baseY - y) / h; const off = Math.round(t * lean * 2); const w = 4; for (let x = -w; x <= w; x++) { let c = st[1]; if (x < -w + 1) c = st[0]; if (x > w - 1) c = st[3]; if (hash2(cx + x, y, 460 + i) < 0.08) c = st[2]; P(g, cx + x + off, y, c); } }
    const off = Math.round(lean * 2);
    ell(g, cx + off, baseY - h, 4, 2, (x, y, d) => { if (y > baseY - h) return; P(g, x, y, d > 0.6 ? st[3] : st[1]); });
    P(g, cx + off - 1, baseY - h + 4, st[3]); P(g, cx + off + 1, baseY - h + 4, st[3]); P(g, cx + off, baseY - h + 3, st[3]); P(g, cx + off, baseY - h + 5, st[3]);
    groundOval(g, cx, baseY, 5, 2, dt[2], 5 + i);
    P(g, cx - 5, baseY, gr[2]); P(g, cx + 5, baseY - 1, gr[2]);
  });
  outline(g, RAMP.void);
  return g;
}
function drawStandingStones(frame: number): Grid {
  const g = makeGrid(64, 72), st = RAMP.stone, dr = RAMP.drift, gr = RAMP.grass, baseY = 68;
  groundOval(g, 32, baseY, 30, 6, RAMP.dirt[3], 1);
  const monolith = (cx: number, topY: number, hw: number, runeY: number | null) => {
    for (let y = baseY - 1; y >= topY; y--) { const t = (baseY - y) / (baseY - topY); const w = Math.round(hw - t * 1.5); for (let x = -w; x <= w; x++) { let c = st[1]; if (x < -w + 1) c = st[0]; if (x > w - 1) c = st[3]; if (hash2(cx + x, y, 470) < 0.07) c = st[2]; if (hash2(cx + x, y, 471) < 0.02) c = st[3]; P(g, cx + x, y, c); } }
    P(g, cx - 1, topY - 1, st[1]); P(g, cx + hw, topY + 1, RAMP.void);
    if (runeY != null) { const lit = frame === 1; const rc = lit ? dr[0] : dr[3]; [[cx - 1, runeY], [cx, runeY - 1], [cx + 1, runeY], [cx, runeY + 1], [cx, runeY + 2]].forEach(([rx, ry]) => P(g, rx, ry, rc)); if (lit) for (let yy = runeY - 3; yy <= runeY + 4; yy++) for (let xx = -3; xx <= 3; xx++) { const d = Math.abs(xx) + Math.abs(yy - runeY); if (d > 2 && d < 4 && (xx + yy) % 2 === 0 && !G(g, cx + xx, yy)) P(g, cx + xx, yy, dr[3]); } }
  };
  monolith(20, 26, 4, null); monolith(44, 24, 4, null);
  monolith(14, 14, 5, 40); monolith(50, 12, 5, 38);
  for (let x = 26; x <= 40; x++) { const y = 30 + Math.round((x - 26) * 0.5); for (let k = 0; k < 4; k++) { let c = st[2]; if (k === 0) c = st[1]; if (k === 3) c = st[3]; P(g, x, y + k, c); } }
  for (let i = 0; i < 8; i++) { const x = 8 + Math.floor(hash2(i, 1, 472) * 48); P(g, x, baseY - 1, gr[2]); }
  outline(g, RAMP.void);
  return g;
}
function drawScarecrow(): Grid {
  const g = makeGrid(24, 44), dt = RAMP.dirt, gd = RAMP.gold, bl = RAMP.blood, bn = RAMP.bone, cx = 11;
  groundOval(g, cx, 41, 7, 2, RAMP.void, 1);
  mpole(g, cx, 8, 40, dt, 3);
  for (let x = cx - 8; x <= cx + 9; x++) P(g, x, 18, dt[2]);
  for (let x = cx - 8; x <= cx + 9; x++) P(g, x, 19, dt[3]);
  ([[cx - 9, 18], [cx + 10, 18]] as [number, number][]).forEach(([x, y]) => { for (let k = 0; k < 4; k++) { P(g, x, y + k - 1, gd[1]); P(g, x, y + k, gd[2]); } });
  for (let k = 0; k < 5; k++) { P(g, cx - 2 - k, 18 + k, gd[1]); P(g, cx + 3 + k, 18 + k, gd[2]); }
  for (let y = 18; y <= 30; y++) { const w = 5 - Math.round((y - 18) / 6); for (let x = -w; x <= w; x++) { let c = bl[2]; if (x < -w + 1) c = bl[1]; if (x > w - 1) c = bl[3]; if (hash2(cx + x, y, 480) < 0.15) c = dt[3]; P(g, cx + x, y, c); } }
  for (let x = cx - 4; x <= cx + 4; x++) if (x % 2 === 0) P(g, x, 31, bl[3]);
  ell(g, cx, 12, 4, 4, (x, y, d, dx, dy) => { let c = bn[2]; if (dy < -0.3) c = bn[1]; if (d > 0.76) c = bn[3]; if (hash2(x, y, 481) < 0.1) c = gd[2]; P(g, x, y, c); });
  P(g, cx - 2, 11, RAMP.void); P(g, cx + 2, 11, RAMP.void);
  P(g, cx - 1, 14, dt[3]); P(g, cx, 14, dt[3]); P(g, cx + 1, 14, dt[3]);
  for (let x = cx - 5; x <= cx + 5; x++) P(g, x, 8, dt[2]);
  for (let x = cx - 3; x <= cx + 3; x++) P(g, x, 7, dt[3]); P(g, cx, 5, dt[2]);
  for (let k = 0; k < 4; k++) { P(g, cx - 4, 9 + k, gd[1]); P(g, cx + 4, 9 + k, gd[2]); }
  outline(g, RAMP.void);
  return g;
}
function drawBeehive(frame: number): Grid {
  const g = makeGrid(20, 28), gd = RAMP.gold, dt = RAMP.dirt, em = RAMP.ember, cx = 10, baseY = 25;
  groundOval(g, cx, baseY, 8, 2, RAMP.void, 1);
  mpole(g, cx - 6, baseY - 4, baseY - 1, dt, 2); mpole(g, cx + 5, baseY - 4, baseY - 1, dt, 2);
  for (let x = cx - 7; x <= cx + 7; x++) P(g, x, baseY - 5, dt[2]);
  for (let y = baseY - 5; y >= baseY - 18; y--) {
    const t = (baseY - 5 - y) / 13, w = Math.round(7 - t * 4.5);
    for (let x = -w; x <= w; x++) { let c = gd[2]; if (x < -w + 2) c = gd[1]; if (x > w - 2) c = gd[3]; if (y % 2 === 0) c = gd[3]; P(g, cx + x, y, c); }
  }
  P(g, cx, baseY - 19, gd[1]);
  P(g, cx, baseY - 8, dt[3]); P(g, cx - 1, baseY - 8, dt[3]); P(g, cx, baseY - 7, dt[3]);
  const bees: [number, number][] = frame === 0 ? [[cx + 6, baseY - 12], [cx - 7, baseY - 9], [cx + 2, baseY - 22]] : [[cx + 8, baseY - 10], [cx - 5, baseY - 14], [cx - 2, baseY - 23]];
  bees.forEach(([bx, by]) => { P(g, bx, by, gd[0]); P(g, bx, by, em[1]); P(g, bx + 1, by, dt[3]); });
  outline(g, RAMP.void);
  return g;
}
function drawHayBales(): Grid {
  const g = makeGrid(40, 24), gd = RAMP.gold, baseY = 22;
  groundOval(g, 20, baseY, 18, 3, RAMP.void, 1);
  const bale = (cx: number, cy: number, r: number) => {
    ell(g, cx, cy, r, r * 0.82, (x, y, d, dx, dy) => { let c = gd[2]; if (dy < -0.3) c = gd[1]; if (d > 0.78) c = gd[3]; P(g, x, y, c); });
    for (let yy = Math.round(cy - r * 0.5); yy <= cy + r * 0.5; yy += 3) for (let x = cx - r; x <= cx + r; x++) if (hash2(x, yy, 490) < 0.5) P(g, x, yy, gd[3]);
    ell(g, cx, cy, r * 0.95, r * 0.78, (x, y, d) => { if (d > 0.85) P(g, x, y, gd[3]); });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI; P(g, Math.round(cx + Math.cos(a) * r * 0.7), Math.round(cy - Math.abs(Math.sin(a)) * r * 0.5), gd[0]); }
  };
  bale(11, baseY - 6, 9); bale(29, baseY - 6, 9); bale(20, baseY - 15, 8);
  outline(g, RAMP.void);
  return g;
}
function drawOldCampfire(frame: number): Grid {
  const g = makeGrid(32, 28), st = RAMP.stone, dt = RAMP.dirt, em = RAMP.ember, cx = 16, baseY = 25;
  ell(g, cx, baseY - 1, 12, 4, (x, y, d) => { if (d > 0.85 && (x + y) % 2) return; P(g, x, y, d < 0.4 ? RAMP.void : (hash2(x, y, 500) < 0.4 ? RAMP.ash : dt[3])); });
  for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; const sx = Math.round(cx + Math.cos(ang) * 11), sy = Math.round(baseY - 2 + Math.sin(ang) * 4); shadeMass(g, sx, sy, 2.6, 2, st as unknown as string[], 30 + a); }
  for (let k = -6; k <= 6; k++) { P(g, cx + k, baseY - 3 + Math.round(k * 0.2), dt[3]); P(g, cx + k, baseY - 4 + Math.round(k * 0.2), RAMP.void); }
  for (let k = -6; k <= 6; k++) P(g, cx + Math.round(k * 0.25), baseY - 3 - Math.abs(Math.round(k * 0.2)), dt[3]);
  const e: [number, number][] = frame === 0 ? [[cx - 2, baseY - 3], [cx + 3, baseY - 2]] : [[cx, baseY - 3], [cx - 3, baseY - 2]];
  e.forEach(([x, y]) => { P(g, x, y, em[2]); P(g, x, y, frame === 0 ? em[1] : em[3]); });
  P(g, cx, baseY - 6 - frame, RAMP.bone[3]); P(g, cx + (frame ? 1 : -1), baseY - 8, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}
function drawFence(): Grid {
  const g = makeGrid(48, 20), dt = RAMP.dirt, gr = RAMP.grass, baseY = 18;
  for (const px of [2, 18, 34]) { mpole(g, px, 4, baseY - 1, dt, 3); groundOval(g, px + 1, baseY, 4, 1.5, RAMP.void, px); }
  mpole(g, 46, 4, baseY - 1, dt, 2);
  for (const ry of [7, 12]) for (let x = 0; x < 48; x++) { let c = dt[1]; if (x % 7 < 1) c = dt[3]; if (hash2(x, ry, 510) < 0.12) c = dt[2]; P(g, x, ry, c); P(g, x, ry + 1, dt[3]); }
  for (let i = 0; i < 12; i++) { const x = Math.floor(hash2(i, 1, 511) * 48); P(g, x, baseY - 1, gr[2]); }
  outline(g, RAMP.void);
  return g;
}
function drawFishingSpot(frame: number): Grid {
  const g = makeGrid(40, 28), dt = RAMP.dirt, wt = RAMP.water, bn = RAMP.bone, em = RAMP.ember, baseY = 25;
  for (let y = baseY - 7; y <= baseY; y++) for (let x = 2; x < 38; x++) { let c = (x + y) % 2 === 0 ? wt[1] : wt[2]; if (y > baseY - 2) c = wt[3]; P(g, x, y, c); }
  mpole(g, 8, baseY - 6, baseY - 1, dt, 2); mpole(g, 16, baseY - 6, baseY - 1, dt, 2);
  for (let x = 3; x <= 22; x++) { const y = baseY - 8; for (let j = 0; j < 3; j++) { let c = dt[1]; if (j === 0) c = dt[0]; if (j === 2) c = dt[3]; P(g, x, y + j, c); } if (x % 6 === 0) P(g, x, y, dt[3]); }
  for (let x = 0; x < 6; x++) for (let y = baseY - 10; y <= baseY; y++) P(g, x, y, RAMP.grass[2]);
  const fx = 30, fy = baseY - 4 + (frame === 1 ? 1 : 0);
  P(g, fx, fy - 1, bn[0]); P(g, fx, fy, em[1]); P(g, fx, fy + 1, em[2]);
  for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; const rx = Math.round(fx + Math.cos(ang) * (frame === 0 ? 3 : 4)), ry = Math.round(fy + Math.sin(ang) * (frame === 0 ? 1.5 : 2)); P(g, rx, ry, wt[0]); }
  for (let x = 22; x <= fx; x++) P(g, x, baseY - 8 + Math.round((x - 22) / (fx - 22) * (fy - (baseY - 8))), bn[3]);
  outline(g, RAMP.void);
  return g;
}
function drawBridge(): Grid {
  const g = makeGrid(96, 40), dt = RAMP.dirt, wt = RAMP.water, baseY = 34;
  for (let y = baseY - 2; y <= baseY + 4; y++) for (let x = 4; x < 92; x++) { if (y > 38) break; const c = (x + y) % 2 === 0 ? wt[1] : wt[2]; P(g, x, y, c); }
  for (const px of [16, 48, 80]) { mpole(g, px, baseY - 4, baseY + 3, dt, 3); P(g, px, baseY + 3, wt[0]); P(g, px + 4, baseY + 3, wt[0]); }
  for (let x = 2; x <= 93; x++) {
    const t = (x - 47.5) / 47.5;
    const y = baseY - 8 - Math.round((1 - t * t) * 4);
    for (let j = 0; j < 4; j++) { let c = dt[1]; if (j === 0) c = dt[0]; if (j === 3) c = dt[3]; P(g, x, y + j, c); }
    if (x % 6 === 0) for (let j = 0; j < 4; j++) P(g, x, y + j, dt[3]);
  }
  for (let x = 4; x <= 91; x += 1) { const t = (x - 47.5) / 47.5; const y = baseY - 8 - Math.round((1 - t * t) * 4); if (x % 12 === 0) for (let k = 1; k <= 5; k++) P(g, x, y - k, dt[2]); }
  for (let x = 4; x <= 91; x++) { const t = (x - 47.5) / 47.5; const y = baseY - 13 - Math.round((1 - t * t) * 4); P(g, x, y, dt[2]); P(g, x, y + 1, dt[3]); }
  outline(g, RAMP.void);
  return g;
}
export const MICROPOI_SPECS: Record<MicroPoiKey, MicroPoiSpec> = {
  well: { cell: [32, 40], anchor: [16, 37], frames: 1, fn: () => drawWell() },
  signpost: { cell: [24, 40], anchor: [11, 37], frames: 1, fn: () => drawSignpost() },
  wagon_wreck: { cell: [64, 40], anchor: [32, 37], frames: 1, fn: () => drawWagonWreck() },
  ruined_hut: { cell: [80, 72], anchor: [40, 68], frames: 1, fn: () => drawRuinedHut() },
  grave_row: { cell: [64, 32], anchor: [32, 29], frames: 1, fn: () => drawGraveRow(), ground: true },
  standing_stones: { cell: [64, 72], anchor: [32, 68], frames: 2, fn: (f) => drawStandingStones(f) },
  scarecrow: { cell: [24, 44], anchor: [11, 41], frames: 1, fn: () => drawScarecrow() },
  beehive: { cell: [20, 28], anchor: [10, 25], frames: 2, fn: (f) => drawBeehive(f) },
  hay_bales: { cell: [40, 24], anchor: [20, 22], frames: 1, fn: () => drawHayBales() },
  old_campfire: { cell: [32, 28], anchor: [16, 25], frames: 2, fn: (f) => drawOldCampfire(f) },
  fence: { cell: [48, 20], anchor: [24, 18], frames: 1, fn: () => drawFence(), tileable: 'x' },
  fishing_spot: { cell: [40, 28], anchor: [20, 25], frames: 2, fn: (f) => drawFishingSpot(f) },
  bridge: { cell: [96, 40], anchor: [48, 34], frames: 1, fn: () => drawBridge() },
};
export const MICROPOI_KEYS = Object.keys(MICROPOI_SPECS) as MicroPoiKey[];
export function makeMicroPoi(key: MicroPoiKey, f = 0): Grid { return MICROPOI_SPECS[key].fn(f); }

// ── Biome tile accents — DS port (_gen/biometiles.js) ────────────────────────
// 64×36 ground-tile variants (diamond-center anchored like drawTile), drawn as
// the base tile per region so the terrain itself differs.
export type BiomeTileKey = 'meadow_flower' | 'ash_dirt' | 'highland_stone' | 'marsh_mud';
function faceScatter(rows: { x0: number; x1: number }[], fn: (x: number, y: number) => void) {
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0 + 2; x <= rows[y].x1 - 2; x++) fn(x, y);
}
function drawMeadowFlower(): Grid {
  const g = makeBaseTile('grass', 11);
  const rows = diamondRows(), dr = RAMP.drift, gd = RAMP.gold, bn = RAMP.bone, gr = RAMP.grass;
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 600);
    if (h < 0.012) { P(g, x, y, dr[1]); P(g, x, y - 1, dr[0]); P(g, x - 1, y, gr[2]); }
    else if (h < 0.024) { P(g, x, y, gd[0]); P(g, x, y - 1, gd[1]); P(g, x - 1, y, gr[2]); }
    else if (h < 0.034) { P(g, x, y, bn[0]); P(g, x + 1, y, bn[1]); }
    else if (h < 0.05) P(g, x, y, gr[0]);
  });
  return g;
}
function drawAshDirt(): Grid {
  const g = makeBaseTile('dirt', 12);
  const rows = diamondRows(), em = RAMP.ember;
  const ashgrey = ['#564f6b', '#3a3450', '#211c30', '#14101e'];
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const v = G(g, x, y); if (!v || v.c === RAMP.void) continue;
    const dl = (RAMP.dirt as readonly string[]).indexOf(v.c);
    if (dl >= 0) P(g, x, y, ashgrey[dl]);
  }
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 610);
    if (h < 0.02) { P(g, x, y, em[2]); if (hash2(x, y, 611) < 0.5) P(g, x, y, em[1]); }
    else if (h < 0.035) P(g, x, y, RAMP.ash);
    else if (h < 0.06) P(g, x, y, ashgrey[0]);
  });
  return g;
}
function drawHighlandStone(): Grid {
  const g = makeBaseTile('stone', 13);
  const rows = diamondRows(), st = RAMP.stone, gr = RAMP.grass;
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 620);
    if (h < 0.02) { P(g, x, y, st[3]); P(g, x + 1, y, st[3]); }
    else if (h < 0.05) P(g, x, y, st[0]);
    else if (h < 0.065) P(g, x, y, st[2]);
  });
  ([[24, 14, 3], [42, 20, 4]] as [number, number, number][]).forEach(([cx, cy, r], i) => {
    ell(g, cx, cy, r, r * 0.7, (x, y, d, dx, dy) => { if (!inDiamond(rows, x, y)) return; let c = st[1]; if (dx + dy < -0.3) c = st[0]; if (d > 0.7) c = st[2]; P(g, x, y, c); });
    if (i === 0) P(g, cx - 1, cy - 2, gr[2]);
  });
  return g;
}
function drawMarshMud(): Grid {
  const g = makeBaseTile('dirt', 14);
  const rows = diamondRows(), wt = RAMP.water, dt = RAMP.dirt, gr = RAMP.grass;
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const v = G(g, x, y); if (!v || v.c === RAMP.void) continue;
    if (v.c === dt[0]) P(g, x, y, dt[1]); else if (v.c === dt[1]) P(g, x, y, dt[2]);
  }
  ([[26, 16, 7, 3], [44, 22, 6, 2.5]] as [number, number, number, number][]).forEach(([cx, cy, rx, ry]) => {
    ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
      if (!inDiamond(rows, x, y)) return;
      if (d > 0.85 && (x + y) % 2) return;
      let c = wt[2]; if (d < 0.4) c = wt[3]; if (dx + dy < -0.4 && d < 0.6) c = wt[1];
      P(g, x, y, c);
    });
    P(g, cx - 1, cy - 1, wt[0]);
  });
  faceScatter(rows, (x, y) => {
    const h = hash2(x, y, 630);
    if (h < 0.015) { P(g, x, y, gr[2]); P(g, x, y - 1, gr[1]); }
    else if (h < 0.03) P(g, x, y, dt[3]);
  });
  return g;
}
export const BIOME_TILE_KEYS: BiomeTileKey[] = ['meadow_flower', 'ash_dirt', 'highland_stone', 'marsh_mud'];
export function makeBiomeTile(key: BiomeTileKey): Grid {
  switch (key) {
    case 'meadow_flower': return drawMeadowFlower();
    case 'ash_dirt': return drawAshDirt();
    case 'highland_stone': return drawHighlandStone();
    case 'marsh_mud': return drawMarshMud();
  }
}

function genCorruptFrames(): Grid[] {
  const alphas = [0.18, 0.212, 0.244, 0.276, 0.308, 0.34];
  const rows = diamondRows();
  const motes: { x: number; y: number }[] = [];
  const rnd = mulberry(424242);
  for (let i = 0; i < 6; i++)
    motes.push({ x: 14 + Math.floor(rnd() * 36), y: 6 + Math.floor(rnd() * 20) });

  return alphas.map((a, f) => {
    const g = makeGrid(64, 32);
    for (let y = 0; y < 32; y++) {
      for (let x = rows[y].x0; x <= rows[y].x1; x++) {
        const dist = Math.abs(x - 32) / 2 + Math.abs(y - 16);
        const density = Math.max(0, 1 - dist / 15);
        const h = hash2(x, y, 77);
        if ((x + y) % 2 === 0 && h < density * 0.95) P(g, x, y, RAMP.drift[2], a);
        else if (h < density * 0.22) P(g, x, y, RAMP.drift[3], a);
      }
    }
    motes.forEach((m, i) => {
      const ph = (i + f) % 6;
      if (ph < 3) {
        P(g, m.x, m.y, ph === 1 ? RAMP.drift[0] : RAMP.drift[1], 0.85);
        if (ph === 1) { P(g, m.x, m.y - 1, RAMP.drift[1], 0.5); P(g, m.x, m.y + 1, RAMP.drift[1], 0.5); }
      }
    });
    return g;
  });
}

// ─── nodes.js ─────────────────────────────────────────────────────────────────

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const dx = (x - cx) / rx, dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function makeTree(depleted: boolean): Grid {
  const g = makeGrid(48, 56);
  const gr = RAMP.grass, dr = RAMP.dirt;

  for (let y = 26; y <= 55; y++) {
    const w = y > 50 ? 6 : y > 44 ? 5 : 4;
    const x0 = 24 - (w >> 1);
    for (let x = x0; x < x0 + w; x++) {
      let c = dr[1];
      if (x === x0) c = dr[0];
      else if (x === x0 + w - 1) c = dr[3];
      else if (hash2(x, y, 11) < 0.15) c = dr[2];
      P(g, x, y, c);
    }
  }
  for (let k = 0; k < 3; k++) { P(g, 19 + k, 54 + (k > 1 ? 1 : 0), dr[2]); P(g, 28 + k, 55, dr[2]); }
  P(g, 18, 55, dr[3]); P(g, 30, 55, dr[3]);

  if (!depleted) {
    const blobs: [number, number, number, number][] = [
      [24, 16, 17, 12], [14, 22, 10, 8], [34, 21, 10, 8], [24, 27, 13, 7],
    ];
    for (let y = 2; y <= 36; y++) for (let x = 2; x <= 46; x++) {
      if (!blobs.some(b => inEllipse(x, y, b[0], b[1], b[2], b[3]))) continue;
      const h = hash2(x, y, 21);
      if (h < 0.04) continue;
      let c = gr[1];
      const lit = inEllipse(x, y, 18, 11, 13, 8);
      const shad = y > 26 || inEllipse(x, y, 32, 26, 12, 7);
      if (lit && h < 0.7) c = (h < 0.18 ? gr[0] : gr[1]);
      if (lit && h >= 0.7 && h < 0.78) c = gr[0];
      if (shad) c = (h < 0.5 ? gr[2] : gr[1]);
      if (y > 30 && h < 0.5) c = gr[3];
      if (h > 0.965) c = RAMP.bone[2];
      P(g, x, y, c);
    }
    for (let k = 0; k < 4; k++) P(g, 26 + k, 30 - (k >> 1), dr[2]);
  } else {
    const branch = (x0: number, y0: number, dx: number, dy: number, n: number, c: string, thick?: boolean) => {
      for (let k = 0; k < n; k++) {
        const x = x0 + Math.round(dx * k), y = y0 + Math.round(dy * k);
        P(g, x, y, c);
        if (thick) P(g, x + 1, y, RAMP.dirt[3]);
      }
    };
    branch(24, 27, -0.9, -0.7, 12, dr[2], true);
    branch(24, 27, 0.95, -0.55, 13, dr[1], true);
    branch(24, 28, 0.1, -1, 9, dr[2], true);
    branch(15, 19, -0.7, -0.8, 5, dr[3]);
    branch(33, 22, 0.8, -0.7, 5, dr[3]);
    branch(25, 20, 0.4, -0.9, 5, dr[3]);
    ([[12, 13, 5, 4], [36, 16, 4, 3]] as [number, number, number, number][]).forEach(b => {
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

function makeRock(depleted: boolean): Grid {
  const g = makeGrid(40, 30);
  const st = RAMP.stone, gd = RAMP.gold;
  for (let y = 4; y <= 29; y++) for (let x = 3; x <= 37; x++) {
    const inA = inEllipse(x, y, 17, 19, 13, 9);
    const inB = inEllipse(x, y, 27, 21, 9, 7);
    if (!inA && !inB) continue;
    if (y > 28) continue;
    let c = st[1];
    const h = hash2(x, y, 41);
    if (inEllipse(x, y, 13, 14, 9, 6)) c = h < 0.75 ? st[0] : st[1];
    if (y > 22) c = h < 0.7 ? st[2] : st[1];
    if (y > 26) c = st[3];
    if (inB && !inA && y <= 22) c = h < 0.5 ? st[1] : st[2];
    if (h > 0.97) c = st[2];
    P(g, x, y, c);
  }
  if (!depleted) {
    const fl: [number, number][] = [[12, 16], [20, 13], [26, 19], [16, 22], [30, 23]];
    fl.forEach((f, i) => {
      P(g, f[0], f[1], gd[1]); P(g, f[0] + 1, f[1], gd[2]);
      P(g, f[0], f[1] + 1, gd[2]);
      if (i % 2 === 0) P(g, f[0] + 1, f[1] - 1, gd[0]);
    });
  } else {
    const crack = (x0: number, y0: number, pts: [number, number][]) => {
      let x = x0, y = y0;
      pts.forEach(p => {
        x += p[0]; y += p[1];
        P(g, x, y, st[3]);
        if (y < 18) P(g, x - 1, y, st[0]);
      });
    };
    crack(14, 10, [[1,1],[0,1],[1,1],[1,0],[0,1],[1,1],[0,1],[-1,1],[0,1],[1,1]]);
    crack(24, 12, [[1,1],[1,0],[0,1],[1,1],[0,1],[1,0],[0,1]]);
    crack(10, 18, [[1,0],[1,1],[1,0],[1,1]]);
    P(g, 20, 17, gd[3]); P(g, 27, 21, gd[3]);
    ([[4, 27], [7, 28], [33, 27], [36, 28], [30, 28]] as [number, number][]).forEach(r => {
      P(g, r[0], r[1], st[2]); P(g, r[0] + 1, r[1], st[3]); P(g, r[0], r[1] - 1, st[1]);
    });
  }
  outline(g);
  return g;
}

function ellipseRing(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string, skip: number) {
  const n = Math.max(16, (rx + ry) * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(t) * rx);
    const y = Math.round(cy + Math.sin(t) * ry);
    if (skip && hash2(x, y, 51) < skip) continue;
    P(g, x, y, c);
  }
}

function genFishFrames(): Grid[] {
  const wa = RAMP.water;
  const frames: Grid[] = [0, 1, 2, 3].map(f => {
    const g = makeGrid(40, 20);
    const r = 4 + f * 2.2;
    ellipseRing(g, 20, 10, r, r / 2, wa[0], f > 1 ? 0.3 : 0);
    if (f >= 1) ellipseRing(g, 20, 10, r - 4, (r - 4) / 2, wa[0], 0.45);
    if (f === 0) { P(g, 20, 10, RAMP.bone[1]); P(g, 21, 10, wa[0]); }
    if (f === 3) ellipseRing(g, 20, 10, r, r / 2, wa[1], 0.5);
    for (let k = 0; k < 4; k++) P(g, 18 + k, 12 + (f % 2), wa[2]);
    return g;
  });
  // depleted frame
  const d = makeGrid(40, 20);
  ellipseRing(d, 20, 10, 5, 2.5, wa[2], 0.35);
  P(d, 20, 10, wa[2]);
  frames.push(d);
  return frames;
}

// ─── character.js ─────────────────────────────────────────────────────────────

/** forged gear baked into the sprite (tiers 1-2); `held` picks the swing prop */
export interface EquipVisual {
  weapon?: number;
  tool?: number;
  ward?: number;
  held?: 'weapon' | 'tool' | null;
}

// ─── cosmetics: cloak dyes + eye glow (palette swaps of the locked ramps) ────
export const DYES = {
  stone: RAMP.stone,
  ember: ['#b45309', '#7c3a06', '#4a2404', '#2b1502'],   // burnt-leather warmth
  moss:  ['#4d7c4d', '#356037', '#20402a', '#142a1b'],
  blood: ['#991b1b', '#5f1212', '#3d0b0b', '#250606'],
  gold:  ['#b8943f', '#7c5f23', '#4f3c14', '#2f240b'],
  bone:  ['#a99fb8', '#6f6781', '#4a4458', '#2e2a38'],
  water: ['#2c5775', '#173a52', '#0d2336', '#071624'],
  void:  ['#211c30', '#14101e', '#0d0a16', '#08060e'],   // deep-drift black
  drift: ['#a855f7', '#6b21a8', '#3b1162', '#22093d'],   // Drift-touched (burn-only)
  // season-exclusive cloak (battle pass). NOT a flat ramp — drawChar special-
  // cases it to drawWandererDyed(ASHFALL_DYE). This entry only makes "ashfall"
  // a valid DyeKey; the ramp here is never read.
  ashfall: RAMP.stone,
} as const;
export type DyeKey = keyof typeof DYES;

export const EYE_GLOWS = {
  drift: RAMP.drift,
  ember: RAMP.ember,
  blood: RAMP.blood,
  gold:  RAMP.gold,
  water: RAMP.water,
} as const;
export type EyeKey = keyof typeof EYE_GLOWS;

/** how the wanderer presents: dye + eye glow (cosmetic, multiplayer-synced).
 *  A premium avatar replaces the whole body; avA/avB are its two channel
 *  options (locked-ramp names) and dye/eye are ignored while it's worn. */
export interface LookVisual {
  dye?: DyeKey;
  eye?: EyeKey;
  avatar?: AvatarKind | '';
  avA?: string;
  avB?: string;
}

// (exported for the headless smoke test — engine code goes through SpriteCache)
export function drawWanderer(
  facing: IsoFacing,
  anim: AnimName,
  f: number,
  equip?: EquipVisual,
  look?: LookVisual,
): Grid {
  const g = makeGrid(32, 40);
  // dye swaps the cloak ramp; eye glow swaps the eye ramp. The hem glow stays
  // drift-purple — that's the corruption creeping up, not clothing.
  const st: readonly string[] = DYES[look?.dye ?? 'stone'];
  const eyeR: readonly string[] = EYE_GLOWS[look?.eye ?? 'drift'];
  const dr = RAMP.drift, bn = RAMP.bone;
  const cx = 16;
  const dir = ({ s: 0, se: 1, e: 2, ne: 3, n: 4 } as Record<IsoFacing, number>)[facing];
  const off = [0, 1, 2, 1, 0][dir];
  const showFace = dir <= 2;

  let bob = 0, hemSway = 0;
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; hemSway = [0, 1, 1, 0, -1, -1][f]; }
  if (anim === 'idle') { hemSway = f === 1 ? 1 : 0; }

  const top = 9 + bob;
  const shoulderY = 18 + bob;

  // cloak body
  for (let y = shoulderY; y <= 36; y++) {
    const t = (y - shoulderY) / (36 - shoulderY);
    const halfw = Math.round(3.6 + t * 3.4);
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(hemSway * 0.5) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = st[1];
      if (x <= cxx - halfw + 1) c = st[0];
      if (x >= cxx + halfw - 1) c = st[3];
      if (hash2(x, y, 61) < 0.06) c = st[2];
      if (dir >= 3 && x === cxx) c = st[2];
      P(g, x, y, c);
    }
  }
  // hem glow
  for (let y = 35; y <= 36; y++)
    for (let x = 0; x < 32; x++) {
      const v = G(g, x, y);
      if (v) P(g, x, y, y === 36 ? (hash2(x, y, 63) < 0.3 ? dr[2] : dr[3]) : (hash2(x, y, 63) < 0.25 ? dr[3] : v.c));
    }
  // hood
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
  P(g, cx + off, top - 1, st[1]);
  P(g, cx + off + (dir >= 1 && dir <= 3 ? 1 : 0), top - 2, st[2]);

  // face shadow + drift eyes
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : dir === 1 ? 1 : 0);
    const w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++)
      for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    const blink = anim === 'idle' && f === 1;
    if (dir === 0) { P(g, fcx - 1, ey, blink ? eyeR[3] : eyeR[2]); P(g, fcx + 1, ey, blink ? eyeR[3] : eyeR[1]); }
    if (dir === 1) { P(g, fcx, ey, blink ? eyeR[3] : eyeR[2]); P(g, fcx + 2, ey, blink ? eyeR[3] : eyeR[1]); }
    if (dir === 2) { P(g, fcx + 1, ey, blink ? eyeR[3] : eyeR[1]); }
  }
  if (anim === 'idle' && f === 1) P(g, cx + off + 7, top + 3, eyeR[1]);

  // feet
  const footY = 37;
  let step = 0;
  if (anim === 'walk') step = [2, 1, 0, -2, -1, 0][f];
  const fo = dir >= 1 ? 1 : 0;
  P(g, cx - 3 + fo + step, footY, st[3]); P(g, cx - 2 + fo + step, footY, RAMP.void);
  P(g, cx + 2 + fo - step, footY, RAMP.void); P(g, cx + 3 + fo - step, footY, st[3]);

  // swing arm
  if (anim === 'swing') {
    const hx = cx + off + 4, hy = shoulderY + 2;
    const ang = [-2.1, -1.35, -0.45, 0.35][f];
    for (let k = 2; k < 8; k++) {
      const x = Math.round(hx + Math.cos(ang) * k), y = Math.round(hy + Math.sin(ang) * k);
      P(g, x, y, k < 4 ? st[2] : RAMP.dirt[0]);
    }
    const ex = Math.round(hx + Math.cos(ang) * 8), ey2 = Math.round(hy + Math.sin(ang) * 8);
    fillRect(g, ex - 1, ey2 - 1, 3, 2, bn[2]);
    P(g, ex, ey2 - 2, bn[1]);
    if (f === 2) { P(g, ex + 2, ey2, bn[0]); P(g, ex + 3, ey2 + 1, RAMP.ember[0]); }

    // held equipment replaces the generic tool head
    if (equip?.held === 'weapon' && equip.weapon) {
      const t2 = equip.weapon >= 2;
      // blade body extending along the swing angle
      fillRect(g, ex - 1, ey2 - 1, 3, 2, t2 ? st[0] : bn[1]);
      for (let k = 0; k < 5; k++) {
        const bx = Math.round(ex + Math.cos(ang) * k);
        const by = Math.round(ey2 - 1 + Math.sin(ang) * k);
        P(g, bx, by, t2 ? st[0] : bn[1]);
        if (t2) P(g, bx, by - 1, dr[1]); // corruption edge
      }
      const tx2 = Math.round(ex + Math.cos(ang) * 5);
      const ty2 = Math.round(ey2 - 1 + Math.sin(ang) * 5);
      P(g, tx2, ty2, t2 ? dr[0] : bn[0]); // tip
    } else if (equip?.held === 'tool' && (equip.tool ?? 0) >= 2) {
      P(g, ex + 1, ey2 - 1, RAMP.ember[1]); // ember-forged glint
      if (f === 2) P(g, ex + 2, ey2 - 2, RAMP.ember[0]);
    }
  }

  // ---- worn equipment (visible in idle/walk; in the swing hand during own swing) ----
  if (equip?.weapon && !(anim === 'swing' && equip.held === 'weapon')) {
    // blade held in the weapon hand, point down at the side
    const t2 = equip.weapon >= 2;
    const hx = cx + off + 6;          // hand, just outside the cloak edge
    const hy = shoulderY + 4;
    P(g, hx - 1, hy - 1, st[2]);      // sleeve hint
    P(g, hx, hy - 1, RAMP.dirt[2]);   // grip in fist
    P(g, hx, hy - 2, RAMP.dirt[1]);   // pommel
    for (let k = 0; k < 6; k++) {     // blade, slight outward cant
      const bx = hx + (k >= 3 ? 1 : 0);
      P(g, bx, hy + k, t2 ? st[0] : bn[2]);
      if (t2 && k % 2 === 0) P(g, bx + 1, hy + k, dr[1]); // corruption edge
      else if (!t2 && k === 1) P(g, bx + 1, hy + k, bn[1]); // bone highlight
    }
    P(g, hx + 1, hy + 6, t2 ? dr[0] : bn[0]); // tip
  }
  if (equip?.tool && !(anim === 'swing' && equip.held === 'tool')) {
    // haft slung over the right shoulder
    const t2 = (equip.tool ?? 0) >= 2;
    for (let k = 0; k < 3; k++) P(g, cx + off + 4 + (k >> 1), shoulderY - 3 - k, RAMP.dirt[0]);
    P(g, cx + off + 6, shoulderY - 6, t2 ? RAMP.ember[1] : bn[2]); // head
  }
  if (equip?.ward && showFace) {
    // charm at the chest
    const wx = cx + off, wy = shoulderY + 3;
    if (equip.ward >= 2) {
      P(g, wx, wy, dr[0]); P(g, wx - 1, wy, dr[2]); P(g, wx + 1, wy, dr[2]);
      P(g, wx, wy + 1, dr[3]);
      if (anim === 'idle' && f === 1) P(g, wx + 1, wy - 2, dr[1]); // escaping mote
    } else {
      P(g, wx, wy, bn[1]); P(g, wx, wy + 1, bn[2]);
    }
  }

  outline(g);
  return g;
}

// ─── avatars.js — PREMIUM AVATAR SET (4 cosmetic characters, DRIFTS-bought) ──
// Drop-in compatible with the wanderer rig: 32×40, feet y=37, 5 facings,
// idle 2f · walk 6f · swing 4f. Two ramp-swap cosmetic channels per kind.

const AV_RAMP: Record<string, readonly string[]> = {
  ember: RAMP.ember, gold: RAMP.gold, blood: RAMP.blood, drift: RAMP.drift,
  bone: RAMP.bone, stone: RAMP.stone, dirt: RAMP.dirt, grass: RAMP.grass, water: RAMP.water,
};

// two cosmetic channels per character (shared table in game/types.ts — the
// server validates identity against the same truth); re-exported for the
// smoke test + byte-diff script.
export { AVATAR_CHANNELS, AVATAR_KINDS, type AvatarKind };

/** avatar cosmetic channels: a/b are locked-ramp names (or option indices) */
export interface AvatarLook { a?: string | number; b?: string | number }

function resolveAvatarLook(kind: AvatarKind, look?: AvatarLook) {
  const ch = AVATAR_CHANNELS[kind] as Record<string, readonly string[]>;
  const names = Object.keys(ch);
  function pick(chanName: string, v: string | number | undefined) {
    const opts = ch[chanName];
    if (v == null) return AV_RAMP[opts[0]];
    if (typeof v === 'number') return AV_RAMP[opts[Math.max(0, Math.min(opts.length - 1, v))]];
    if (AV_RAMP[v]) return AV_RAMP[v];
    return AV_RAMP[opts[0]];
  }
  return { rA: pick(names[0], look?.a), rB: pick(names[1], look?.b), names };
}

interface AvatarRig {
  cx: number; dir: number; off: number; showFace: boolean; back: boolean;
  bob: number; step: number; hemSway: number; top: number; shoulderY: number;
}

function avatarRig(facing: IsoFacing, anim: AnimName, f: number): AvatarRig {
  const cx = 16;
  const dir = ({ s: 0, se: 1, e: 2, ne: 3, n: 4 } as Record<IsoFacing, number>)[facing];
  const off = [0, 1, 2, 1, 0][dir];
  const showFace = dir <= 2;
  const back = dir >= 3;
  let bob = 0, step = 0, hemSway = 0;
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; step = [2, 1, 0, -2, -1, 0][f]; hemSway = [0, 1, 1, 0, -1, -1][f]; }
  if (anim === 'idle') { hemSway = f === 1 ? 1 : 0; }
  return { cx, dir, off, showFace, back, bob, step, hemSway, top: 9 + bob, shoulderY: 18 + bob };
}

// shared two-foot draw (skip for veilborn). soleRamp solid, toe void.
function avatarFeet(g: Grid, R: AvatarRig, soleRamp: readonly string[], extraStomp = 0) {
  const footY = 37 + extraStomp;
  const fo = R.dir >= 1 ? 1 : 0;
  P(g, R.cx - 3 + fo + R.step, footY, soleRamp[3]); P(g, R.cx - 2 + fo + R.step, footY, RAMP.void);
  P(g, R.cx - 3 + fo + R.step, footY - 1, soleRamp[2]);
  P(g, R.cx + 2 + fo - R.step, footY, RAMP.void); P(g, R.cx + 3 + fo - R.step, footY, soleRamp[3]);
  P(g, R.cx + 3 + fo - R.step, footY - 1, soleRamp[2]);
}

// shared swing arm; toolFn(g, ex, ey, f) paints the per-kind weapon head/haft.
function avatarSwingArm(
  g: Grid, R: AvatarRig, anim: AnimName, f: number,
  armRamp: readonly string[], toolFn: (g: Grid, ex: number, ey: number, f: number) => void,
) {
  if (anim !== 'swing') return;
  const hx = R.cx + R.off + 4, hy = R.shoulderY + 2;
  const ang = [-2.1, -1.35, -0.45, 0.35][f];
  for (let k = 2; k < 8; k++) {
    const x = Math.round(hx + Math.cos(ang) * k), y = Math.round(hy + Math.sin(ang) * k);
    P(g, x, y, k < 4 ? armRamp[2] : RAMP.dirt[0]);    // sleeve/forearm → haft start
  }
  const ex = Math.round(hx + Math.cos(ang) * 8), ey = Math.round(hy + Math.sin(ang) * 8);
  toolFn(g, ex, ey, f);
}

// 1 · THE ASHBOUND — burned penitent. Broad, no hood, topknot, ember seams.
function bodyAshbound(g: Grid, R: AvatarRig, anim: AnimName, f: number, seam: readonly string[], wrap: readonly string[]) {
  const sk = RAMP.bone;                 // ash-grey skin = bone-ramp greys (mids/darks)
  const { cx, off, dir, top, shoulderY } = R;
  const flare = anim === 'idle' && f === 1;  // ember seam flares on idle f1

  // broad torso (widest of the set)
  for (let y = shoulderY; y <= 31; y++) {
    const t = (y - shoulderY) / (31 - shoulderY);
    const halfw = Math.round(5 + (1 - t) * 3);        // 8 at shoulders → 5 at waist
    const cxx = cx + Math.round(off * 0.5);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = sk[2];
      if (x <= cxx - halfw + 1) c = sk[1];            // moonlit
      if (x >= cxx + halfw - 1) c = sk[3];            // shadow
      if (hash2(x, y, 71) < 0.10) c = sk[3];          // scars/soot
      P(g, x, y, c);
    }
  }
  // cracked ember seams glowing through (vertical-ish, dithered)
  const seamPts: [number, number][] = [[-3, 21], [2, 24], [-1, 27], [4, 22], [-4, 29], [1, 30]];
  seamPts.forEach((p) => {
    const x = cx + Math.round(off * 0.5) + p[0], y = p[1];
    P(g, x, y, flare ? seam[0] : seam[1]);
    if (flare) { P(g, x, y - 1, seam[2]); P(g, x + 1, y, seam[2]); }
    else P(g, x, y + 1, seam[3]);
  });
  // chest straps (wrap ramp), crossing — symmetric so it mirrors clean
  for (let k = 0; k <= 9; k++) { const y = shoulderY + 1 + k; P(g, cx + off - 4 + k, y, wrap[1]); P(g, cx + off + 4 - k, y, wrap[2]); }
  for (let x = cx + off - 5; x <= cx + off + 5; x++) P(g, x, 31, wrap[3]);   // belt
  // bare scarred arms (shoulders bulge out)
  ([[-1, sk[1]], [1, sk[3]]] as [number, string][]).forEach(([s, c]) => {
    const ax = cx + off + s * 7;
    for (let y = shoulderY + 1; y <= 28; y++) { P(g, ax, y, c); P(g, ax - s, y, sk[2]); if (hash2(ax, y, 72) < 0.12) P(g, ax, y, seam[3]); }
  });
  // head (no hood), heavy brow
  for (let y = top + 1; y <= shoulderY; y++) { const hw = y < top + 4 ? 3 : 4; for (let x = cx + off - hw; x <= cx + off + hw; x++) { let c = sk[2]; if (x < cx + off - hw + 1) c = sk[1]; if (x > cx + off + hw - 1) c = sk[3]; P(g, x, y, c); } }
  // short brutal topknot (spike up + bound base)
  P(g, cx + off, top - 2, sk[3]); P(g, cx + off, top - 1, sk[2]); P(g, cx + off, top, sk[1]);
  P(g, cx + off - 1, top, wrap[3]); P(g, cx + off + 1, top, wrap[3]);   // hair tie
  // face: ember eyes + grim mouth
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0); const ey = top + 5;
    P(g, fcx - 2, ey, seam[1]); P(g, fcx + 2, ey, flare ? seam[0] : seam[1]);
    for (let x = fcx - 2; x <= fcx + 2; x++) P(g, x, top + 8, sk[3]);   // jaw shadow
  }
}
function toolAshbound(g: Grid, ex: number, ey: number, f: number) {       // haymaker fist (no haft)
  const sk = RAMP.bone;
  fillRect(g, ex - 1, ey - 1, 3, 3, sk[2]); P(g, ex, ey - 1, sk[1]);
  P(g, ex - 1, ey, RAMP.ember[2]); P(g, ex + 1, ey, RAMP.ember[2]);     // ember knuckles
  if (f === 2) { P(g, ex + 2, ey - 1, RAMP.ember[0]); P(g, ex + 3, ey, RAMP.ember[1]); P(g, ex + 2, ey + 1, RAMP.gold[0]); }
}

// 2 · THE MIREBORN — bog seer. Lean, hunched, reed shawl, belt lantern.
function bodyMireborn(g: Grid, R: AvatarRig, anim: AnimName, f: number, flame: readonly string[], shawl: readonly string[]) {
  const { cx, off, dir, top, shoulderY, hemSway } = R;
  const gutter = anim === 'idle' && f === 1;
  const hunch = 1;  // pushed-forward head

  // reed shawl: rounded dome over hunched shoulders → trailing wet hem
  for (let y = shoulderY - 1; y <= 37; y++) {
    const t = (y - (shoulderY - 1)) / (37 - (shoulderY - 1));
    const halfw = Math.round(3.4 + t * 3.0 + (y > 33 ? 1 : 0));
    const cxx = cx + Math.round(off * 0.5) + (y > 31 ? Math.round(hemSway * 0.6) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = shawl[1];
      if (x <= cxx - halfw + 1) c = shawl[0];
      if (x >= cxx + halfw - 1) c = shawl[2];
      // reed weave texture (diagonal dashes)
      if ((x + 2 * y) % 5 === 0) c = shawl[2];
      if (hash2(x, y, 81) < 0.05) c = shawl[3];
      P(g, x, y, c);
    }
  }
  // wet hem: darker, dripping
  for (let x = 0; x < 32; x++) { const v = G(g, x, 37); if (v) { P(g, x, 37, shawl[3]); if (hash2(x, 0, 82) < 0.3 && G(g, x, 36)) P(g, x, 36, shawl[3]); } }
  // hunched head (forward/down), cowl peak low
  const hy0 = top + hunch;
  for (let y = hy0; y <= shoulderY; y++) { const hw = 3; const hcx = cx + off + (dir <= 2 ? 1 : 0); for (let x = hcx - hw; x <= hcx + hw; x++) { let c = shawl[1]; if (x < hcx - hw + 1) c = shawl[0]; if (x > hcx + hw - 1) c = shawl[2]; if (y === hy0) c = shawl[2]; P(g, x, y, c); } }
  // face in shadow + pale seer eyes (flame-tinted)
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : 1); const ey = hy0 + 5;
    for (let y = hy0 + 3; y <= hy0 + 7; y++) for (let x = fcx - 2; x <= fcx + 1; x++) P(g, x, y, RAMP.void);
    P(g, fcx - 1, ey, gutter ? flame[2] : flame[1]); P(g, fcx + 1, ey, gutter ? flame[3] : flame[0]);
  }
  // belt bone-charm lantern hanging front, sways on walk / gutters on idle f1
  const lsw = (anim === 'walk') ? [0, 1, 1, 0, -1, -1][f] : 0;
  const lx = cx + off - 4 + lsw, ly = 30;
  P(g, lx, ly - 1, RAMP.bone[2]);                 // hook/charm
  for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) { let c = RAMP.bone[3]; if (i === 0 && j > 0 && j < 3) c = gutter ? flame[2] : flame[1]; P(g, lx + i, ly + j, c); }
  P(g, lx, ly + 1, gutter ? flame[0] : flame[1]);  // flame core
  if (!gutter) P(g, lx, ly - 0, flame[0]);
}
function toolMireborn(g: Grid, ex: number, ey: number, f: number) {       // crooked root-staff (longer, gnarled)
  const dt = RAMP.dirt;
  // the haft is drawn by avatarSwingArm; add a gnarled root knob + side roots
  fillRect(g, ex - 1, ey - 1, 2, 3, dt[1]); P(g, ex, ey - 2, dt[2]); P(g, ex + 1, ey - 1, dt[3]);
  P(g, ex - 2, ey, dt[2]); P(g, ex + 1, ey + 1, dt[3]);   // twisted roots
  if (f === 2) { P(g, ex + 2, ey - 1, RAMP.drift[0]); P(g, ex + 2, ey, RAMP.ember[1]); P(g, ex + 3, ey, RAMP.drift[1]); }
}

// 3 · THE BONECALLER — ossuary priest. Skull mask, hanging-bone mantle.
function bodyBonecaller(g: Grid, R: AvatarRig, anim: AnimName, f: number, socket: readonly string[], mantle: readonly string[]) {
  const { cx, off, dir, top, shoulderY, hemSway } = R;
  const robe = RAMP.stone;
  const click = anim === 'idle' && f === 1;     // one hanging bone clicks (1px shift)

  // narrow tall robe
  for (let y = shoulderY; y <= 37; y++) {
    const t = (y - shoulderY) / (37 - shoulderY);
    const halfw = Math.round(2.8 + t * 2.6);
    const cxx = cx + Math.round(off * 0.5) + (y > 31 ? Math.round(hemSway * 0.5) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = robe[1]; if (x <= cxx - halfw + 1) c = robe[0]; if (x >= cxx + halfw - 1) c = robe[3];
      if (hash2(x, y, 91) < 0.05) c = robe[2];
      P(g, x, y, c);
    }
  }
  // bone mantle: small bones hanging from the shoulders, sway OPPOSITE the hem
  const msw = (anim === 'walk') ? -[0, 1, 1, 0, -1, -1][f] : 0;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const bx = cx + off + i * 2 + (Math.abs(i) > 1 ? msw : 0);
    const len = 3 - (Math.abs(i) === 3 ? 1 : 0);
    const clickShift = (click && i === 2) ? 1 : 0;
    for (let j = 0; j < len; j++) P(g, bx, shoulderY + 1 + j + clickShift, j === len - 1 ? mantle[0] : mantle[1]);
    P(g, bx, shoulderY + 1 + len + clickShift, mantle[3]);   // bead/knot tip
  }
  // bandage-wrapped arms (thin, at sides)
  ([[-1, robe[0]], [1, robe[3]]] as [number, string][]).forEach(([s, c]) => {
    const ax = cx + off + s * 4;
    for (let y = shoulderY + 2; y <= 30; y++) { P(g, ax, y, c); if ((y % 2) === 0) P(g, ax, y, RAMP.bone[2]); }   // wrap stripes
  });
  // tall beast-skull half-mask head
  const hy0 = top - 1;
  for (let y = hy0; y <= shoulderY; y++) { const hw = y < hy0 + 3 ? 2 : 3; const hcx = cx + off; for (let x = hcx - hw; x <= hcx + hw; x++) { let c = mantle[1]; if (x < hcx - hw + 1) c = mantle[0]; if (x > hcx + hw - 1) c = mantle[2]; P(g, x, y, c); } }
  // skull snout juts forward (toward facing) for profile silhouette
  if (dir >= 1) { P(g, cx + off + 3, top + 3, mantle[1]); P(g, cx + off + 4, top + 3, mantle[2]); P(g, cx + off + 3, top + 4, mantle[3]); }
  // horns
  P(g, cx + off - 2, hy0 - 1, mantle[2]); P(g, cx + off + 2, hy0 - 1, mantle[2]); P(g, cx + off - 2, hy0 - 2, mantle[3]); P(g, cx + off + 2, hy0 - 2, mantle[3]);
  // glowing eye sockets
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0); const ey = top + 3;
    for (let y = ey - 1; y <= ey + 1; y++) { P(g, fcx - 2, y, RAMP.void); P(g, fcx + 2, y, RAMP.void); }
    P(g, fcx - 2, ey, socket[0]); P(g, fcx + 2, ey, socket[0]); P(g, fcx - 2, ey + 1, socket[1]); P(g, fcx + 2, ey + 1, socket[1]);
  }
}
function toolBonecaller(g: Grid, ex: number, ey: number, f: number) {     // ritual bone wand; spark bone-white then ember
  const bn = RAMP.bone;
  fillRect(g, ex - 1, ey - 1, 2, 3, bn[1]); P(g, ex, ey - 2, bn[0]); P(g, ex + 1, ey, bn[3]);
  if (f === 2) { P(g, ex + 2, ey - 1, bn[0]); P(g, ex + 3, ey, bn[0]); P(g, ex + 2, ey + 1, RAMP.ember[1]); P(g, ex + 3, ey + 1, RAMP.ember[0]); }
}

// 4 · THE VEILBORN — one the Drift gave back. Weightless, layered veil.
function bodyVeilborn(g: Grid, R: AvatarRig, anim: AnimName, f: number, veil: readonly string[], mote: readonly string[]) {
  const { cx, off, dir, top, shoulderY, hemSway, step } = R;
  const detach = anim === 'idle' && f === 1;

  // afterimage trail on walk (faint veil pixels offset behind motion)
  if (anim === 'walk' && (f === 1 || f === 4)) {
    const tdir = f === 1 ? -1 : 1;
    for (let y = shoulderY + 2; y <= 30; y += 2) P(g, cx + off + tdir * 4, y, veil[3]);
  }
  // layered veil: scalloped tiers, hem floats (stops ~y34, never touches ground)
  for (let y = shoulderY; y <= 34; y++) {
    const t = (y - shoulderY) / (34 - shoulderY);
    const halfw = Math.round(3.2 + t * 3.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 28 ? Math.round(hemSway * 0.7) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = veil[1];
      if (x <= cxx - halfw + 1) c = veil[0];
      if (x >= cxx + halfw - 1) c = veil[2];
      // translucent dither holes (weightless, wrong)
      if (hash2(x, y, 101) < 0.10) continue;
      // scallop tier lines
      if ((y - shoulderY) % 5 === 0) c = veil[2];
      P(g, x, y, c);
    }
  }
  // ragged floating hem (scalloped bottom, drift-tinted)
  for (let x = cx + off - 6; x <= cx + off + 6; x++) {
    const s = Math.sin((x - cx) * 0.9 + hemSway);
    if (s > 0.2) { const y = 34 - Math.round(s); if (G(g, x, y - 1)) { P(g, x, y, veil[2]); P(g, x, y + 1, mote[3]); } }
  }
  // veil head (no face, just a hollow with mote eyes)
  for (let y = top; y <= shoulderY; y++) { const hw = 3; const hcx = cx + off; for (let x = hcx - hw; x <= hcx + hw; x++) { if (hash2(x, y, 102) < 0.10) continue; let c = veil[1]; if (x < hcx - hw + 1) c = veil[0]; if (x > hcx + hw - 1) c = veil[2]; if (y === top) c = veil[2]; P(g, x, y, c); } }
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0); const ey = top + 5;
    P(g, fcx - 1, ey, mote[0]); P(g, fcx + 1, ey, mote[1]);
  }
  // drift-mote gap where feet would be (weightless) — replaces avatarFeet
  const gy = 36;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + f;
    const x = Math.round(cx + off + Math.cos(a) * 3 - step * 0.5), y = Math.round(gy + Math.sin(a) * 1.2);
    P(g, x, y, i % 2 ? mote[1] : mote[2]);
  }
  P(g, cx + off, 37, mote[3]);
  // idle f1: a mote detaches and rises
  if (detach) { P(g, cx + off + 5, top + 1, mote[0]); P(g, cx + off + 5, top, mote[1]); }
}
function toolVeilborn(g: Grid, ex: number, ey: number, f: number, mote?: readonly string[]) { // drift shard + smear behind arm
  const dr = mote || RAMP.drift;
  fillRect(g, ex - 1, ey - 1, 2, 2, dr[1]); P(g, ex, ey - 2, dr[0]);
  // smear trail behind the arc
  P(g, ex - 2, ey + 1, dr[3]); P(g, ex - 3, ey + 2, dr[3]);
  if (f === 2) { P(g, ex + 2, ey - 1, dr[0]); P(g, ex + 2, ey, dr[1]); P(g, ex + 3, ey, dr[2]); }
}

// 5 · THE DRIFTWARDEN — frontier ranger. Open travel-cloak + hood over a leather
// jerkin, one pauldron, a slung quiver, a belt drift-lantern (the ward glow), a
// warden's glaive on swing. cloak ramp = a, ward ramp = b.
function bodyDriftwarden(g: Grid, R: AvatarRig, anim: AnimName, f: number, cloak: readonly string[], ward: readonly string[]) {
  const { cx, off, dir, top, shoulderY, hemSway, back, showFace } = R;
  const lt = RAMP.dirt;                         // leather jerkin under the cloak
  const flare = anim === 'idle' && f === 1;     // lantern pulses on idle f1

  // slung quiver on the back (visible from behind / sides)
  if (back || dir === 1 || dir === 2) {
    const qx = cx + off - (back ? 0 : 3);
    for (let y = shoulderY - 1; y <= shoulderY + 8; y++) P(g, qx, y, lt[3]);
    P(g, qx, shoulderY - 2, ward[1]); P(g, qx - 1, shoulderY - 2, RAMP.bone[1]); P(g, qx + 1, shoulderY - 2, RAMP.bone[1]); // arrow fletching
  }

  // open travel-cloak (knee-length, parts at the front to show the jerkin)
  for (let y = shoulderY; y <= 35; y++) {
    const t = (y - shoulderY) / (35 - shoulderY);
    const hw = Math.round(3.6 + t * 3.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(hemSway * 0.5) : 0);
    const gap = (!back && y > shoulderY + 6) ? Math.max(0, Math.round(t * 2)) : -1;  // front opening
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      if (gap >= 0 && Math.abs(x - cxx) <= gap) {     // jerkin shows through the parted cloak
        P(g, x, y, x < cxx ? lt[1] : lt[2]); continue;
      }
      let c = cloak[1]; if (x <= cxx - hw + 1) c = cloak[0]; if (x >= cxx + hw - 1) c = cloak[3];
      if (hash2(x, y, 401) < 0.05) c = cloak[2];
      if (back && x === cxx) c = cloak[2];
      P(g, x, y, c);
    }
  }
  // ward-trim along the cloak's leading edge (a thin glowing hem line)
  for (let y = shoulderY + 3; y <= 34; y += 1) { const t = (y - shoulderY) / (35 - shoulderY); const cxx = cx + Math.round(off * 0.5); const hw = Math.round(3.6 + t * 3.2); if (y % 2 === 0) P(g, cxx + hw - 1, y, ward[flare ? 1 : 2]); }
  // a pauldron on the right shoulder (leather + ward stud)
  const px = cx + off + 4;
  for (let y = shoulderY - 1; y <= shoulderY + 3; y++) for (let x = px - 2; x <= px + 2; x++) { let c = lt[1]; if (x < px - 1) c = lt[0]; if (x > px + 1) c = lt[2]; P(g, x, y, c); }
  P(g, px, shoulderY, ward[flare ? 0 : 2]);
  // belt drift-lantern (the ward glow) hanging at the left hip; sways on walk
  if (!back) {
    const lsw = anim === 'walk' ? [0, 1, 1, 0, -1, -1][f] : 0;
    const lx = cx + off - 5 + lsw, ly = 28;
    P(g, lx, ly - 1, RAMP.bone[2]);                                   // hook
    for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) { let c = lt[3]; if (i === 0 && j === 1) c = flare ? ward[0] : ward[1]; P(g, lx + i, ly + j, c); }
    if (flare) { P(g, lx, ly - 2, ward[1]); P(g, lx + 2, ly + 1, ward[2]); P(g, lx - 2, ly + 1, ward[2]); }
  }
  // hood (peaked, drawn over the head)
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.4);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) { let c = cloak[1]; if (x === cxx - hw) c = cloak[0]; if (x >= cxx + hw - 1) c = cloak[3]; if (y === top) c = cloak[0]; P(g, x, y, c); }
  }
  P(g, cx + off, top - 1, cloak[1]);
  P(g, cx + off + (dir >= 1 && dir <= 3 ? 1 : 0), top - 2, cloak[2]);  // hood point droops toward facing
  // face shadow + steady warden eyes (ward-tinted glint)
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : dir === 1 ? 1 : 0), w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6, lit = flare;
    if (dir === 0) { P(g, fcx - 1, ey, lit ? ward[0] : ward[1]); P(g, fcx + 1, ey, ward[1]); }
    if (dir === 1) { P(g, fcx, ey, lit ? ward[0] : ward[1]); P(g, fcx + 2, ey, ward[1]); }
    if (dir === 2) { P(g, fcx + 1, ey, lit ? ward[0] : ward[1]); }
  }
  if (flare) P(g, cx + off + 7, top + 3, ward[1]);                    // drifting mote off the shoulder
}
// warden's glaive — a long haft with a hooked blade; the edge sparks ward-energy on f2.
function toolDriftwarden(g: Grid, ex: number, ey: number, f: number, ward: readonly string[]) {
  const bn = RAMP.bone;
  // hooked blade head
  fillRect(g, ex - 1, ey - 2, 2, 4, bn[1]); P(g, ex, ey - 3, bn[0]);
  P(g, ex + 1, ey - 2, bn[2]); P(g, ex + 2, ey - 3, bn[1]); P(g, ex + 2, ey - 4, bn[0]);   // hook curl
  if (f === 2) { P(g, ex + 3, ey - 2, ward[0]); P(g, ex + 4, ey - 1, ward[1]); P(g, ex + 3, ey, ward[2]); }  // ward arc-spark
}

/** worn equipment overlay for premium avatars (same anchors as the wanderer's
 *  worn-gear block, stone ramp standing in for the cloak dye; the avatar's own
 *  signature swing prop replaces the wanderer's held-blade swap) */
function avatarWornGear(g: Grid, R: AvatarRig, anim: AnimName, f: number, equip: EquipVisual) {
  const { cx, off, shoulderY, showFace } = R;
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone;
  if (equip.weapon && !(anim === 'swing' && equip.held === 'weapon')) {
    const t2 = equip.weapon >= 2;
    const hx = cx + off + 6, hy = shoulderY + 4;
    P(g, hx - 1, hy - 1, st[2]);
    P(g, hx, hy - 1, RAMP.dirt[2]);
    P(g, hx, hy - 2, RAMP.dirt[1]);
    for (let k = 0; k < 6; k++) {
      const bx = hx + (k >= 3 ? 1 : 0);
      P(g, bx, hy + k, t2 ? st[0] : bn[2]);
      if (t2 && k % 2 === 0) P(g, bx + 1, hy + k, dr[1]);
      else if (!t2 && k === 1) P(g, bx + 1, hy + k, bn[1]);
    }
    P(g, hx + 1, hy + 6, t2 ? dr[0] : bn[0]);
  }
  if (equip.tool && !(anim === 'swing' && equip.held === 'tool')) {
    const t2 = (equip.tool ?? 0) >= 2;
    for (let k = 0; k < 3; k++) P(g, cx + off + 4 + (k >> 1), shoulderY - 3 - k, RAMP.dirt[0]);
    P(g, cx + off + 6, shoulderY - 6, t2 ? RAMP.ember[1] : bn[2]);
  }
  if (equip.ward && showFace) {
    const wx = cx + off, wy = shoulderY + 3;
    if (equip.ward >= 2) {
      P(g, wx, wy, dr[0]); P(g, wx - 1, wy, dr[2]); P(g, wx + 1, wy, dr[2]);
      P(g, wx, wy + 1, dr[3]);
      if (anim === 'idle' && f === 1) P(g, wx + 1, wy - 2, dr[1]);
    } else {
      P(g, wx, wy, bn[1]); P(g, wx, wy + 1, bn[2]);
    }
  }
}

// (exported for the smoke test + byte-diff — engine code goes through SpriteCache)
export function drawAvatar(
  kind: AvatarKind, facing: IsoFacing, anim: AnimName, f: number,
  look?: AvatarLook, equip?: EquipVisual,
): Grid {
  const g = makeGrid(32, 40);
  const R = avatarRig(facing, anim, f);
  const { rA, rB } = resolveAvatarLook(kind, look);

  if (kind === 'ashbound') {
    const stomp = (anim === 'walk' && (f === 1 || f === 4)) ? 1 : 0;
    bodyAshbound(g, R, anim, f, rA, rB);
    avatarFeet(g, R, rB, stomp);
    avatarSwingArm(g, R, anim, f, RAMP.bone, toolAshbound);
  } else if (kind === 'mireborn') {
    bodyMireborn(g, R, anim, f, rA, rB);
    avatarFeet(g, R, rB, 0);
    avatarSwingArm(g, R, anim, f, rB, toolMireborn);
  } else if (kind === 'bonecaller') {
    bodyBonecaller(g, R, anim, f, rA, rB);
    avatarFeet(g, R, RAMP.stone, 0);
    avatarSwingArm(g, R, anim, f, RAMP.stone, toolBonecaller);
  } else if (kind === 'veilborn') {
    bodyVeilborn(g, R, anim, f, rA, rB);   // draws its own mote "feet"
    avatarSwingArm(g, R, anim, f, rA, (gg, ex, ey, ff) => toolVeilborn(gg, ex, ey, ff, rB));
  } else if (kind === 'driftwarden') {
    const stomp = (anim === 'walk' && (f === 1 || f === 4)) ? 1 : 0;
    bodyDriftwarden(g, R, anim, f, rA, rB);
    avatarFeet(g, R, RAMP.dirt, stomp);
    avatarSwingArm(g, R, anim, f, rA, (gg, ex, ey, ff) => toolDriftwarden(gg, ex, ey, ff, rB));
  }
  if (equip && (equip.weapon || equip.tool || equip.ward)) avatarWornGear(g, R, anim, f, equip);
  outline(g, RAMP.void);
  return g;
}

/** shop portrait: 48×64 bust, s-facing, 2f idle (the DS bust crop of the sheet) */
export function drawAvatarPortrait(kind: AvatarKind, f = 0, look?: AvatarLook): Grid {
  const g = makeGrid(48, 64);
  const cx = 24, top = 10;
  const src = drawAvatar(kind, 's', 'idle', f || 0, look);
  // bust crop: take src rows ~6..27 (head+shoulders) and 2× scale into the portrait
  for (let y = 6; y <= 27; y++) for (let x = 4; x <= 27; x++) {
    const v = G(src, x, y); if (!v) continue;
    const px = cx - 24 + (x - 4) * 2, py = top + (y - 6) * 2;
    fillRect(g, px, py, 2, 2, v.c);
  }
  // pedestal shadow + frame hint
  for (let x = cx - 16; x <= cx + 16; x++) if ((x + 1) % 2 === 0) P(g, x, 61, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

// ── Frontier Expansion: keeper NPCs (ported from _gen/npcs.js) ──
// Keeper rig: 32×40, feet y=37, 5 facings, idle 2f only (planted; no step).
export type KeeperKind = 'quartermaster' | 'scout' | 'hermit';

function keeperFeet(g: Grid, R: AvatarRig, soleRamp: readonly string[]) {
  const fo = R.dir >= 1 ? 1 : 0;
  P(g, R.cx - 3 + fo, 37, soleRamp[3]); P(g, R.cx - 2 + fo, 37, RAMP.void); P(g, R.cx - 3 + fo, 36, soleRamp[2]);
  P(g, R.cx + 2 + fo, 37, RAMP.void); P(g, R.cx + 3 + fo, 37, soleRamp[3]); P(g, R.cx + 3 + fo, 36, soleRamp[2]);
}

// QUARTERMASTER — stout frontier trader: leather apron, ledger, key-ring, flat cap
function bodyQuartermaster(g: Grid, R: AvatarRig, f: number) {
  const { cx, off, dir, top, shoulderY, back } = R;
  const lt = RAMP.dirt, tu = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold;
  const shift = f === 1 ? 1 : 0;
  for (let y = shoulderY; y <= 34; y++) {
    const t = (y - shoulderY) / (34 - shoulderY);
    const hw = Math.round(5 + t * 1.5);
    const cxx = cx + Math.round(off * 0.5);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = tu[1]; if (x <= cxx - hw + 1) c = tu[0]; if (x >= cxx + hw - 1) c = tu[2];
      if (!back && Math.abs(x - cxx) <= hw - 2 && y > shoulderY + 2) { c = lt[1]; if (x < cxx - 1) c = lt[0]; if (x > cxx + 1) c = lt[2]; }
      P(g, x, y, c);
    }
  }
  for (let x = cx + off - 4; x <= cx + off + 4; x++) P(g, x, 30, lt[3]);
  P(g, cx + off + 5, 31, gd[2]); P(g, cx + off + 6, 31, gd[3]); P(g, cx + off + 5, 32, bn[3]);
  ([[-1, tu[0]], [1, tu[2]]] as [number, string][]).forEach(([s, c]) => { const ax = cx + off + s * 6; for (let y = shoulderY + 1; y <= 26; y++) P(g, ax, y, c); for (let y = 27; y <= 30; y++) P(g, ax, y, bn[2]); });
  if (!back) { for (let y = 27; y <= 31; y++) for (let x = cx + off - 3; x <= cx + off + 1; x++) P(g, x, y, bn[1]); for (let y = 27; y <= 31; y++) P(g, cx + off - 3, y, lt[3]); }
  const hx = cx + off;
  for (let y = top + 1; y <= shoulderY; y++) { const hw = 3; for (let x = hx - hw; x <= hx + hw; x++) { let c = bn[2]; if (x < hx - hw + 1) c = bn[1]; if (x > hx + hw - 1) c = bn[3]; P(g, x, y, c); } }
  for (let x = hx - 4; x <= hx + 4; x++) P(g, x, top, lt[2]);
  for (let x = hx - 3; x <= hx + 3; x++) P(g, x, top - 1, lt[1]);
  if (!back) {
    for (let y = top + 5; y <= top + 8; y++) for (let x = hx - 3; x <= hx + 3; x++) if (hash2(x, y, 501) < 0.8) P(g, x, y, bn[3]);
    const ey = top + 4;
    if (dir === 0) { P(g, hx - 1, ey, RAMP.void); P(g, hx + 1, ey, RAMP.void); }
    else if (dir === 1) { P(g, hx, ey, RAMP.void); P(g, hx + 2, ey, RAMP.void); }
    else P(g, hx + 1, ey, RAMP.void);
  }
  if (f === 1 && !back) { P(g, cx + off + 7, 24 - shift, gd[0]); P(g, cx + off + 7, 23 - shift, gd[1]); }
}

// SCOUT — lean hooded watcher, hand shading the eyes, bow slung on the back
function bodyScout(g: Grid, R: AvatarRig, f: number) {
  const { cx, off, dir, top, shoulderY, showFace, back } = R;
  const ck = RAMP.grass, lt = RAMP.dirt, bn = RAMP.bone;
  const sway = f === 1 ? 1 : 0;
  if (back || dir === 1 || dir === 2) {
    const bx = cx + off - (back ? 0 : 3);
    for (let y = shoulderY - 2; y <= shoulderY + 12; y++) { const c = Math.abs(y - (shoulderY + 5)); P(g, bx + Math.round(c * 0.18), y, lt[2]); }
    P(g, bx, shoulderY - 2, lt[3]); P(g, bx, shoulderY + 12, lt[3]);
  }
  for (let y = shoulderY; y <= 33; y++) {
    const t = (y - shoulderY) / (33 - shoulderY);
    const hw = Math.round(3.4 + t * 2.6);
    const cxx = cx + Math.round(off * 0.5) + (y > 29 ? sway : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) { let c = ck[1]; if (x <= cxx - hw + 1) c = ck[0]; if (x >= cxx + hw - 1) c = ck[2]; if (hash2(x, y, 511) < 0.05) c = ck[3]; P(g, x, y, c); }
  }
  for (const s of [-1, 1]) { const lx = cx + off + s * 2; for (let y = 33; y <= 36; y++) P(g, lx, y, lt[2]); }
  for (let y = top; y <= shoulderY + 1; y++) { const hy = (y - top) / (shoulderY + 1 - top); const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.2); const cxx = cx + off; for (let x = cxx - hw; x <= cxx + hw; x++) { let c = ck[1]; if (x === cxx - hw) c = ck[0]; if (x >= cxx + hw - 1) c = ck[2]; if (y === top) c = ck[0]; P(g, x, y, c); } }
  P(g, cx + off + (dir >= 1 ? 1 : 0), top - 1, ck[1]);
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0);
    for (let y = top + 4; y <= top + 7; y++) for (let x = fcx - 2; x <= fcx + 2; x++) P(g, x, y, RAMP.void);
    P(g, fcx + (dir === 2 ? 1 : -1), top + 5, bn[0]); if (dir !== 2) P(g, fcx + 1, top + 5, bn[1]);
  }
  if (!back) {
    const hx = cx + off + 5;
    for (let k = 0; k < 4; k++) P(g, hx - k, top + 6 - k, lt[1]);
    fillRect(g, hx - 4, top + 2 - sway, 4, 1, bn[2]);
  } else {
    for (const s of [-1, 1]) { const ax = cx + off + s * 4; for (let y = shoulderY + 1; y <= 27; y++) P(g, ax, y, ck[2]); }
  }
}

// HERMIT — bent ragged lore-keeper, long beard, gnarled drift-trinket staff
function bodyHermit(g: Grid, R: AvatarRig, f: number) {
  const { cx, off, dir, top, shoulderY, back } = R;
  const rb = RAMP.stone, lt = RAMP.dirt, bn = RAMP.bone, dr = RAMP.drift;
  const glint = f === 1;
  const hunch = 2;
  for (let y = shoulderY + hunch; y <= 36; y++) {
    const t = (y - (shoulderY + hunch)) / (36 - (shoulderY + hunch));
    const hw = Math.round(3.2 + t * 4.0);
    const cxx = cx + Math.round(off * 0.5) + (dir <= 2 ? 1 : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = rb[1]; if (x <= cxx - hw + 1) c = rb[0]; if (x >= cxx + hw - 1) c = rb[3];
      if ((x + 2 * y) % 6 === 0) c = rb[2];
      if (hash2(x, y, 521) < 0.06) c = lt[3];
      P(g, x, y, c);
    }
  }
  for (let x = 0; x < 32; x++) { const v = G(g, x, 36); if (v && hash2(x, 0, 522) < 0.5) P(g, x, 36, RAMP.void); }
  const hx = cx + off + (dir <= 2 ? 1 : 0), hy = top + hunch + 2;
  for (let y = hy - 2; y <= hy + 2; y++) for (let x = hx - 3; x <= hx + 3; x++) { if ((x - hx) ** 2 + (y - hy) ** 2 > 11) continue; let c = bn[2]; if (x < hx - 1) c = bn[1]; if (y > hy + 1) c = bn[3]; P(g, x, y, c); }
  P(g, hx - 3, hy - 2, bn[3]); P(g, hx + 3, hy - 1, bn[3]);
  if (!back) {
    for (let y = hy + 2; y <= 30; y++) { const bw = Math.max(1, 3 - Math.floor((y - hy) / 6)); for (let x = hx - bw; x <= hx + bw; x++) if (hash2(x, y, 523) < 0.85) P(g, x, y, bn[3 - (y < hy + 6 ? 1 : 0)]); }
    const ey = hy;
    P(g, hx + (dir === 2 ? 1 : -1), ey, RAMP.void); if (dir !== 2) P(g, hx + 1, ey, RAMP.void);
  }
  const sx = cx + off + 7;
  for (let y = top + 1; y <= 37; y++) P(g, sx + Math.round(Math.sin(y * 0.5) * 0.4), y, lt[1]);
  P(g, sx, top, lt[2]);
  P(g, sx, top - 1, glint ? dr[0] : dr[1]); P(g, sx - 1, top - 1, dr[2]); P(g, sx + 1, top - 1, dr[2]);
  if (glint) { P(g, sx, top - 2, dr[1]); P(g, sx - 2, top - 1, dr[3]); P(g, sx + 2, top - 1, dr[3]); }
  P(g, sx - 1, top + 8, bn[2]); P(g, sx, top + 8, bn[1]);
}

const KEEPER_BODY: Record<KeeperKind, { body: (g: Grid, R: AvatarRig, f: number) => void; sole: readonly string[] }> = {
  quartermaster: { body: bodyQuartermaster, sole: RAMP.dirt },
  scout:         { body: bodyScout,         sole: RAMP.dirt },
  hermit:        { body: bodyHermit,        sole: RAMP.stone },
};

export function drawKeeper(kind: KeeperKind, facing: IsoFacing, f: number): Grid {
  const g = makeGrid(32, 40);
  const R = avatarRig(facing, 'idle', f);
  KEEPER_BODY[kind].body(g, R, f);
  keeperFeet(g, R, KEEPER_BODY[kind].sole);
  outline(g, RAMP.void);
  return g;
}
export function drawKeeperPortrait(kind: KeeperKind, f = 0): Grid {
  const g = makeGrid(48, 64);
  const cx = 24, top = 10;
  const src = drawKeeper(kind, 's', f || 0);
  for (let y = 4; y <= 25; y++) for (let x = 4; x <= 27; x++) { const v = G(src, x, y); if (!v) continue; fillRect(g, cx - 24 + (x - 4) * 2, top + (y - 4) * 2, 2, 2, v.c); }
  for (let x = cx - 16; x <= cx + 16; x++) if ((x + 1) % 2 === 0) P(g, x, 61, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

// ─── beasts.js — creature set ─────────────────────────────────────────────────

export type BeastKind =
  | 'husk' | 'stalker' | 'colossus' | 'raider'
  // frontier expansion: real ported species + camp mini-bosses
  | 'bogwretch' | 'wight' | 'bonehusk' | 'brute' | 'wisp'
  | 'drownedking' | 'barrowlord' | 'ashwarlord';
export type BeastAnim = 'idle' | 'move' | 'attack' | 'death';

/** maps a server mob `kind` string to the BeastKind the cache draws. The
 *  expansion species + mini-bosses now have real ported art (identity map);
 *  any unknown kind falls back to the husk. */
const BEAST_PLACEHOLDER: Record<string, BeastKind> = {
  husk: 'husk', stalker: 'stalker', colossus: 'colossus', raider: 'raider',
  bogwretch: 'bogwretch', wisp: 'wisp', wight: 'wight', bonehusk: 'bonehusk', brute: 'brute',
  drownedking: 'drownedking', barrowlord: 'barrowlord', ashwarlord: 'ashwarlord',
};
export function beastSpriteFor(kind: string): BeastKind {
  return BEAST_PLACEHOLDER[kind] ?? 'husk';
}
/** mini-bosses + the Colossus read as bosses (minimap marker, bigger HP bar) */
export function isBossKind(kind: string): boolean {
  return kind === 'colossus' || kind === 'drownedking' || kind === 'barrowlord' || kind === 'ashwarlord';
}

function ell(
  g: Grid, cx: number, cy: number, rx: number, ry: number,
  fn: (x: number, y: number, d: number, dx: number, dy: number) => void,
) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d <= 1) fn(x, y, d, dx, dy);
    }
  }
}
// shade a stone-ish mass: lit top-left, shadowed bottom-right, rim dark
function shadeMass(g: Grid, cx: number, cy: number, rx: number, ry: number, ramp: string[], seed?: number) {
  ell(g, cx, cy, rx, ry, (x, y, d, dx, dy) => {
    let c = ramp[1];
    if (d > 0.72) c = ramp[3];
    else if (dx + dy < -0.45) c = ramp[0];
    else if (dx + dy > 0.5) c = ramp[2];
    if (seed != null && hash2(x, y, seed) < 0.07) c = ramp[2];
    P(g, x, y, c);
  });
}
// jagged spike pointing up from (bx, baseY), height h, drift ramp + glow tip
function spike(g: Grid, bx: number, baseY: number, h: number, lit: boolean) {
  const dr = RAMP.drift;
  for (let k = 0; k < h; k++) {
    const w = Math.max(0, Math.round((h - k) / 2.4));
    for (let x = bx - w; x <= bx + w; x++) P(g, x, baseY - k, k > h - 2 ? (lit ? dr[0] : dr[1]) : dr[3]);
  }
  P(g, bx, baseY - h, lit ? dr[0] : dr[1]);
}
function moteBurst(g: Grid, cx: number, cy: number, r: number, density: number, seed: number) {
  const dr = RAMP.drift;
  for (let i = 0; i < 40; i++) {
    const t = hash2(i, seed, 1) * Math.PI * 2, rr = hash2(i, seed, 2) * r;
    if (hash2(i, seed, 3) > density) continue;
    const x = Math.round(cx + Math.cos(t) * rr), y = Math.round(cy + Math.sin(t) * rr * 0.7);
    P(g, x, y, hash2(i, seed, 4) < 0.3 ? dr[0] : hash2(i, seed, 4) < 0.6 ? dr[1] : dr[2]);
  }
}

const DIR_OF: Record<IsoFacing, number> = { s: 0, se: 1, e: 2, ne: 3, n: 4 };

/* ── 1 · DRIFT HUSK (32×32) ── */
function drawHusk(facing: IsoFacing, anim: string, f: number): Grid {
  const g = makeGrid(32, 32);
  const st = RAMP.stone, dr = RAMP.drift;
  const dir = DIR_OF[facing];
  const back = dir >= 3, profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir];
  const cx = 16 + lean;
  const groundY = 30;

  let dx = 0, sq = 0, legP = 0, alive = true, df = -1;
  if (anim === 'idle') sq = f === 1 ? 1 : 0;
  if (anim === 'skitter') { legP = f; dx = [0, 1, 0, -1][f]; }
  if (anim === 'lunge') { dx = [-3, -4, 5, 7][f]; sq = [1, 2, -1, 0][f]; }
  if (anim === 'death') { alive = false; df = f; }

  if (!alive) {
    if (df === 0) {
      shadeMass(g, cx, groundY - 3, profile ? 10 : 8, 3, st, 1);
      moteBurst(g, cx, 18, 6, 0.5, 7);
    } else if (df === 1) {
      for (let i = 0; i < 10; i++) P(g, 10 + (i * 3) % 14, 27 + (i % 3), st[3]);
      moteBurst(g, cx, 16, 11, 0.85, 9);
    } else {
      moteBurst(g, cx, 13, 13, 0.4, 11);
    }
    outline(g, RAMP.void);
    return g;
  }

  const bodyX = cx + dx, bodyY = groundY - 5;
  const rx = profile ? 9 : 7, ry = 5 - sq;

  const legXs = profile ? [-6, -2, 3, 7] : [-5, -2, 2, 5];
  legXs.forEach((lx, i) => {
    const fwd = anim === 'skitter' ? ((i + legP) % 2 === 0 ? 1 : 0) : 0;
    for (let k = 0; k < 4 - fwd; k++) P(g, bodyX + lx, bodyY + 3 + k, st[3]);
    P(g, bodyX + lx, groundY, RAMP.void);
  });
  shadeMass(g, bodyX, bodyY, rx, ry, st, 2);
  const lit = anim === 'idle' ? f === 1 : (anim === 'lunge' && f >= 2);
  const spineXs = back ? [-4, 0, 4] : profile ? [-6, -2, 2, 6] : [-4, 0, 4];
  spineXs.forEach((sx, i) => spike(g, bodyX + sx, bodyY - ry + 1, 4 + (i % 2), lit));
  if (!back) {
    const hx = bodyX + (profile ? rx - 1 : 0), hy = bodyY + 1 + (profile ? 1 : 2);
    shadeMass(g, hx, hy, 3, 3, st, 3);
    const ey = hy - 1;
    if (profile) { P(g, hx + 1, ey, lit ? dr[0] : dr[1]); }
    else { P(g, hx - 1, ey, lit ? dr[0] : dr[1]); P(g, hx + 1, ey, dr[1]); }
  } else {
    shadeMass(g, bodyX, bodyY - 1, rx - 2, ry, st, 4);
  }
  outline(g, RAMP.void);
  return g;
}

/* ── 2 · DRIFT STALKER (36×40) ── */
function drawStalker(facing: IsoFacing, anim: string, f: number): Grid {
  const g = makeGrid(36, 40);
  const st = RAMP.stone, dr = RAMP.drift, bl = RAMP.blood;
  const dir = DIR_OF[facing];
  const back = dir >= 3, profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir];
  const cx = 18 + lean;
  const groundY = 38;

  let crouch = 0, alive = true, df = -1, dx = 0;
  if (anim === 'idle') crouch = f === 1 ? 1 : 0;
  if (anim === 'stalk') { dx = [0, 1, 1, 0, -1, -1][f]; crouch = [0, 1, 1, 0, 1, 1][f]; }
  if (anim === 'lunge') { dx = [-2, -3, 6, 8][f]; crouch = [2, 3, -2, -1][f]; }
  if (anim === 'death') { alive = false; df = f; }

  if (!alive) {
    if (df <= 1) {
      const yy = groundY - 8 + df * 4;
      shadeMass(g, cx, yy, 8 - df, 5 - df, st, 1);
      if (df === 1) moteBurst(g, cx, yy - 4, 8, 0.6, 21);
    } else if (df === 2) {
      moteBurst(g, cx, 20, 12, 0.85, 23);
      for (let i = 0; i < 8; i++) P(g, 12 + (i * 3) % 12, 35 + i % 3, st[3]);
    } else moteBurst(g, cx, 16, 15, 0.4, 25);
    outline(g, RAMP.void);
    return g;
  }

  const hipY = groundY - 10 + crouch;
  const headY = hipY - 13 + crouch;
  ([[-4, 1], [4, -1]] as const).forEach(([lx, ph], i) => {
    const k2 = anim === 'stalk' ? (f + i) % 2 : 0;
    P(g, cx + lx, hipY + 2, st[2]); P(g, cx + lx + ph, hipY + 5, st[2]);
    P(g, cx + lx + ph, hipY + 8 - k2, st[3]); P(g, cx + lx + ph + 1, groundY, RAMP.void);
    P(g, cx + lx + ph + 2, groundY, bl[1]);
  });
  const torsoX = cx + dx, leanF = profile ? 2 : 0;
  shadeMass(g, torsoX + leanF, (hipY + headY) / 2, 5, 7, st, 2);
  for (let y = headY + 3; y < hipY; y += 2) P(g, torsoX + leanF - 1, y, dr[2]);
  P(g, torsoX + leanF, headY + 5, dr[1]);
  const lit = anim === 'idle' ? f === 1 : anim === 'lunge' && f >= 2;
  [-2, 1, 4].forEach((sx, i) => spike(g, torsoX + (back ? sx : sx + 3), (hipY + headY) / 2 - 5, 5 + i % 2, lit));
  const ang = anim === 'lunge' ? [-1.6, -2.0, 0.2, 0.5][f] : (anim === 'stalk' ? -0.6 + Math.sin(f) * 0.2 : -0.7);
  const sx0 = torsoX + leanF + 2, sy0 = headY + 5;
  for (let k = 1; k < 7; k++) {
    const x = Math.round(sx0 + Math.cos(ang) * k), y = Math.round(sy0 + Math.sin(ang) * k + 3);
    P(g, x, y, st[2]);
  }
  const cxh = Math.round(sx0 + Math.cos(ang) * 7), cyh = Math.round(sy0 + Math.sin(ang) * 7 + 3);
  P(g, cxh, cyh, bl[0]); P(g, cxh + 1, cyh - 1, bl[1]); P(g, cxh + 1, cyh + 1, bl[1]);
  if (!back) {
    shadeMass(g, torsoX + leanF + (profile ? 2 : 0), headY, 3, 3, st, 3);
    const ey = headY;
    if (profile) P(g, torsoX + leanF + 3, ey, lit ? dr[0] : dr[1]);
    else { P(g, torsoX + leanF - 1, ey, lit ? dr[0] : dr[1]); P(g, torsoX + leanF + 1, ey, dr[1]); }
    P(g, torsoX + leanF + (profile ? 3 : 0), headY + 2, bl[1]);
  } else shadeMass(g, torsoX, headY, 3, 3, st, 4);
  outline(g, RAMP.void);
  return g;
}

/* ── 3 · DRIFT COLOSSUS (64×64) ── */
function drawColossus(facing: IsoFacing, anim: string, f: number): Grid {
  const g = makeGrid(64, 64);
  const st = RAMP.stone, dr = RAMP.drift, em = RAMP.ember;
  const dir = DIR_OF[facing];
  const back = dir >= 3, profile = dir === 2;
  const lean = [0, 2, 4, 2, 0][dir];
  const cx = 32 + lean;
  const groundY = 60;

  let stagger = 0, armUp = 0, alive = true, df = -1, shake = 0;
  if (anim === 'idle') stagger = f === 1 ? 1 : 0;
  if (anim === 'walk') { stagger = [0, 1, 0, 1][f]; shake = [0, 0, 1, 0][f]; }
  if (anim === 'slam') { armUp = [3, 6, 6, -2, -4][f]; shake = [0, 0, 0, 2, 1][f]; }
  if (anim === 'death') { alive = false; df = f; }

  if (!alive) {
    if (df < 4) {
      const h = 30 - df * 6;
      for (let y = groundY; y > groundY - h; y--) {
        const w = Math.round((groundY - y) * 0.5 + 6);
        for (let x = cx - w; x <= cx + w; x++) if (hash2(x, y, 30 + df) < 0.7) P(g, x, y, hash2(x, y, 5) < 0.4 ? st[2] : st[1]);
      }
      moteBurst(g, cx, groundY - h - 4, 16 + df * 3, 0.7, 40 + df);
      for (let i = 0; i < 6 - df; i++) P(g, cx - 8 + i * 3, groundY - 8, dr[2]);
    } else {
      for (let i = 0; i < 18; i++) P(g, cx - 16 + (i * 5) % 32, groundY - (i % 3), st[3]);
      moteBurst(g, cx, 30, 22, 0.5, 49);
    }
    outline(g, RAMP.void);
    return g;
  }

  const baseY = groundY + (shake ? 1 : 0);
  ([[-10, 0], [9, 1]] as const).forEach(([lx], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 2 : 0;
    for (let y = baseY - 18; y <= baseY - lift; y++) {
      for (let x = cx + lx - 4; x <= cx + lx + 4; x++) {
        let c = st[1]; if (x < cx + lx - 2) c = st[0]; if (x > cx + lx + 2) c = st[3];
        if (hash2(x, y, 31) < 0.06) c = st[2];
        P(g, x, y, c);
      }
    }
    P(g, cx + lx, baseY - lift, RAMP.void);
    P(g, cx + lx - 4, baseY - 9, dr[2]); P(g, cx + lx + 4, baseY - 12, dr[3]);
  });
  const tx = cx + (profile ? 3 : 0), tTop = baseY - 44 + stagger, tBot = baseY - 20;
  for (let y = tTop; y <= tBot; y++) {
    const w = 13 + Math.round((y - tTop) / 6);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = st[1]; if (x < tx - w + 3) c = st[0]; if (x > tx + w - 3) c = st[2];
      if (y > tBot - 4) c = st[3];
      if ((y - tTop) % 6 === 0 || (x - tx + ((Math.floor((y - tTop) / 6)) % 2) * 4) % 8 === 0) c = st[3];
      if (hash2(x, y, 32) < 0.05) c = dr[3];
      P(g, x, y, c);
    }
  }
  ([[-8, 6], [5, 10], [-2, 16], [9, 4]] as const).forEach(([ox, oy], i) => {
    P(g, tx + ox, tTop + oy, dr[2]); P(g, tx + ox, tTop + oy + 1, dr[3]);
    if ((anim === 'idle' && f === 1) || anim === 'slam') P(g, tx + ox, tTop + oy - 1, i % 2 ? dr[0] : em[1]);
  });
  ([[-1, -16], [1, 16]] as const).forEach(([, ox]) => {
    const shoulderX = tx + ox * 0.9, shoulderY = tTop + 4;
    for (let y = shoulderY; y <= shoulderY + 16; y++) {
      const yy = (anim === 'slam' && armUp > 0) ? shoulderY + (y - shoulderY) - armUp : y;
      for (let x = shoulderX - 3; x <= shoulderX + 3; x++) {
        let c = st[1]; if (x < shoulderX - 1) c = st[0]; if (x > shoulderX + 1) c = st[2];
        P(g, Math.round(x), Math.round(yy), c);
      }
    }
    const fy = (anim === 'slam' && armUp > 0) ? shoulderY + 16 - armUp : shoulderY + 16;
    shadeMass(g, shoulderX, fy, 4, 3, st, 6);
  });
  if (anim === 'slam' && f >= 3) {
    const r = f === 3 ? 16 : 24;
    for (let a = 0; a < 2; a++) {
      P(g, cx - r + a, groundY - 1, dr[1]); P(g, cx + r - a, groundY - 1, dr[1]);
      P(g, cx - r + a, groundY, em[1]); P(g, cx + r - a, groundY, em[1]);
    }
  }
  if (!back) {
    const hx = tx + (profile ? 4 : 0), hy = tTop - 5 + stagger;
    for (let y = hy - 5; y <= hy + 4; y++) for (let x = hx - 6; x <= hx + 6; x++) {
      if (Math.abs(x - hx) + Math.abs(y - hy) > 8) continue;
      let c = st[1]; if (x < hx - 2) c = st[0]; if (y > hy + 1) c = st[3];
      if (hash2(x, y, 33) < 0.08) c = st[2];
      P(g, x, y, c);
    }
    for (let k = -5; k <= 5; k++) P(g, hx + k, hy - 1 + Math.round(Math.sin(k)), st[3]);
    const lit = (anim === 'idle' && f === 1) || (anim === 'slam' && f >= 1);
    ell(g, hx, hy + 1, 2.4, 2.4, (x, y, d) => P(g, x, y, d < 0.3 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
    if (lit) { P(g, hx - 3, hy + 1, dr[2]); P(g, hx + 3, hy + 1, dr[2]); }
  } else {
    const hx = tx, hy = tTop - 5 + stagger;
    for (let y = hy - 5; y <= hy + 4; y++) for (let x = hx - 6; x <= hx + 6; x++) {
      if (Math.abs(x - hx) + Math.abs(y - hy) > 8) continue;
      P(g, x, y, hash2(x, y, 33) < 0.5 ? st[2] : st[1]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

/* ── 4 · CARAVAN RAIDER (32×40) ── */
function drawRaiderBody(
  g: Grid, cx: number, top: number, dt: string[], bn: string[],
  off: number, dir: number, profile: boolean, back: boolean, hunch: number, step: number,
) {
  const shoulderY = top + 9 + hunch, hipY = top + 19, groundY = 38;
  const fo = dir >= 1 ? 1 : 0;
  for (let leg = 0; leg < 2; leg++) {
    const sgn = leg ? 1 : -1, sx = cx + sgn * 2 + fo + (leg ? -step : step);
    for (let y = hipY; y < groundY - 1; y++) {
      let c = dt[2]; if (y > groundY - 4) c = dt[3];
      P(g, sx, y, c); P(g, sx + sgn, y, dt[1]);
    }
    P(g, sx, groundY - 1, RAMP.void); P(g, sx + sgn, groundY - 1, dt[3]);
  }
  for (let y = shoulderY; y <= hipY; y++) {
    const w = 4 + Math.round((y - shoulderY) / 8);
    for (let x = cx - w + off / 2; x <= cx + w + off / 2; x++) {
      let c = dt[1]; if (x < cx - w + off / 2 + 1) c = dt[0]; if (x > cx + w + off / 2 - 1) c = dt[3];
      if (hash2(x, y, 62) < 0.08) c = dt[2];
      if (hash2(x, y, 64) < 0.02) c = bn[2];
      P(g, Math.round(x), y, c);
    }
  }
  for (let x = cx - 4 + off / 2; x <= cx + 4 + off / 2; x++) P(g, Math.round(x), hipY, dt[3]);
  const hx = cx + off;
  ell(g, hx, top + 4, 3.2, 3.6, (x, y, d, dx, dy) => {
    let c = dt[1]; if (dx + dy < -0.4) c = dt[0]; if (dx + dy > 0.5) c = dt[2];
    P(g, x, y, c);
  });
  if (!back) {
    const mw = profile ? 1 : 2;
    for (let y = top + 3; y <= top + 6; y++)
      for (let x = hx - (profile ? 0 : mw); x <= hx + mw; x++)
        P(g, x, y, hash2(x, y, 65) < 0.2 ? bn[2] : bn[1]);
    P(g, hx + (profile ? 1 : 0), top + 4, RAMP.void);
    if (!profile) P(g, hx + 1, top + 4, RAMP.void);
  } else {
    for (let y = top + 1; y <= top + 5; y++)
      for (let x = hx - 3; x <= hx + 3; x++)
        if ((x - hx) ** 2 + (y - top - 3) ** 2 < 10) P(g, x, y, dt[3]);
  }
  for (let x = hx - 4; x <= hx + 4; x++) {
    const yy = top + Math.round(((x - hx) / 4) ** 2 * 2);
    if ((x - hx) ** 2 < 17) P(g, x, yy, dt[2]);
  }
}

function drawRaider(facing: IsoFacing, anim: string, f: number): Grid {
  const g = makeGrid(32, 40);
  const dt = RAMP.dirt, bn = RAMP.bone, em = RAMP.ember, bl = RAMP.blood;
  const dir = DIR_OF[facing];
  const back = dir >= 3, profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir];
  const cx = 16;
  const groundY = 38;

  let bob = 0, step = 0, armAng: number | null = null, alive = true, df = -1;
  if (anim === 'idle') bob = f === 1 ? 1 : 0;
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; step = [2, 1, 0, -2, -1, 0][f]; }
  if (anim === 'slash') armAng = [-1.9, -0.9, 0.2, 0.7][f];
  if (anim === 'death') { alive = false; df = f; }

  if (!alive) {
    if (df === 0) {
      drawRaiderBody(g, cx + 1, 12, dt, bn, off, dir, profile, back, 2, 0);
      P(g, cx + 6, 17, bl[1]); P(g, cx + 7, 18, bl[2]);
    } else if (df === 1) {
      ell(g, cx, 30, 8, 6, (x, y, d, dx, dy) => {
        let c = dt[1]; if (dx + dy < -0.4) c = dt[0]; if (dx + dy > 0.5) c = dt[2];
        if (hash2(x, y, 62) < 0.1) c = dt[3];
        P(g, x, y, c);
      });
      ell(g, cx + 4, 25, 3, 3, (x, y) => P(g, x, y, dt[2]));
      for (let y = 24; y <= 26; y++) for (let x = cx + 3; x <= cx + 6; x++)
        if (hash2(x, y, 65) < 0.7) P(g, x, y, bn[1]);
      P(g, cx - 6, 36, bl[2]);
    } else {
      for (let x = cx - 9; x <= cx + 8; x++) {
        P(g, x, groundY - 1, dt[2]);
        if (hash2(x, 0, 61) < 0.6) P(g, x, groundY - 2, dt[1]);
      }
      ell(g, cx - 7, groundY - 3, 3, 2, (x, y) => P(g, x, y, bn[1]));
      P(g, cx + 8, groundY - 1, em[2]); P(g, cx + 9, groundY - 2, em[1]);
    }
    outline(g, RAMP.void);
    return g;
  }

  const top = 9 + bob;
  drawRaiderBody(g, cx, top, dt, bn, off, dir, profile, back, 0, step);

  const shoulderY = top + 9;
  if (anim === 'slash' && armAng !== null) {
    const sx = cx + off + 3, ang = armAng;
    for (let k = 1; k < 7; k++)
      P(g, Math.round(sx + Math.cos(ang) * k), Math.round(shoulderY + Math.sin(ang) * k), dt[1]);
    const bx = Math.round(sx + Math.cos(ang) * 7), by = Math.round(shoulderY + Math.sin(ang) * 7);
    for (let k = 0; k < 6; k++)
      P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by + Math.sin(ang) * k), bn[0]);
    if (f === 2) { P(g, bx + 3, by, bn[0]); P(g, bx + 4, by + 1, em[0]); }
  } else {
    const tx = cx + off + (profile ? 5 : 4), ty = shoulderY - 2;
    for (let k = 0; k < 6; k++) P(g, tx, ty + k, dt[2]);
    P(g, tx, ty - 1, em[2]);
    const flick = anim === 'idle' ? f : 0;
    P(g, tx, ty - 2 - flick, em[1]); P(g, tx, ty - 3 - flick, em[0]);
    P(g, tx + (flick ? 1 : -1), ty - 2, em[1]);
  }
  outline(g, RAMP.void);
  return g;
}

// ─── the Waystation: town buildings (port of DS _gen/town.js) ─────────────────
// Iso 2:1 weathered frontier structures. Each house: south door + a warm lit
// window + a purpose sign/roof feature. Moonlit left, shadowed right.
// Houses: 144×152 cell, bottom-center anchor. Shrine: 112×128 (3 flame
// frames). Pit: 240×120 flat, center-anchored, drawn under entities.
// DS 'casino' → our 'wheel' key, DS 'tavern' → our 'lantern' key.

export type BuildingSpriteKey =
  | 'dyeworks' | 'vault' | 'wheel' | 'lantern'
  | 'furnisher' | 'menagerie' | 'shrine' | 'pit' | 'mine' | 'stable'
  | 'huskden' | 'obelisk' | 'mirehut' | 'waystation'
  | 'drownedruins' | 'barrowcrypt' | 'ashwarcamp' | 'mirelair' | 'outpost'
  | 'palisade_gate' | 'watchtower';

const rnd2 = (x: number, y: number, s = 0) => hash2(x, y, s);

// packed-earth + stone foundation diamond (3×3-ish footprint, corners show)
function foundation(g: Grid, cx: number, topY: number, halfW: number, opt: { ash?: boolean } = {}) {
  const dirt = RAMP.dirt, stone = RAMP.stone;
  const halfH = Math.round(halfW / 2);
  // top diamond surface (packed earth)
  for (let dy = -halfH; dy <= halfH; dy++) {
    const t = 1 - Math.abs(dy) / halfH;
    const w = Math.round(halfW * t);
    for (let dx = -w; dx <= w; dx++) {
      let c = dirt[1];
      if (dy < -halfH * 0.3 && dx < 0) c = dirt[0];          // moonlit back-left
      else if (dy > halfH * 0.3) c = dirt[2];                 // front shade
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
      if (a < 0.5) { P(g, cx + dx, edgeY, RAMP.bone[3]); if (a < 0.25) P(g, cx + dx, edgeY - 1, RAMP.bone[2]); }
    }
  }
}

type WallMat = 'timber' | 'plaster' | 'block' | 'log';

// front facade (south wall, camera-facing, moonlit-left)
function frontWall(g: Grid, x0: number, x1: number, ytop: number, ybot: number, ramp: readonly string[], seed: number, mat?: WallMat) {
  for (let x = x0; x <= x1; x++) {
    for (let y = ytop; y <= ybot; y++) {
      let c = ramp[1];
      if (x <= x0 + 1) c = ramp[0];
      else if (x >= x1 - 1) c = ramp[2];
      if (mat === 'timber') {           // horizontal plank seams
        if ((y - ytop) % 4 === 0) c = ramp[2];
        if (rnd2(x, y, seed) < 0.05) c = ramp[2];
      } else if (mat === 'plaster') {   // patchy plaster
        if (rnd2(x, y, seed) < 0.04) c = ramp[2];
        else if (rnd2(x, y, seed + 1) < 0.03) c = ramp[0];
      } else if (mat === 'block') {     // stone block courses
        if ((y - ytop) % 5 === 0) c = ramp[3];
        if ((x - x0 + (Math.floor((y - ytop) / 5) % 2) * 4) % 8 === 0) c = ramp[3];
      } else if (mat === 'log') {       // stacked log ends -> horizontal rounds
        const r = (y - ytop) % 5;
        if (r === 0) c = ramp[3]; else if (r === 1) c = ramp[0];
      }
      P(g, x, y, c);
    }
  }
}

// right side wall (east face), recedes up-right by dep, in shadow
function rightWall(g: Grid, x1: number, ytop: number, ybot: number, dep: number, ramp: readonly string[], mat: WallMat | undefined, seed: number) {
  for (let d = 1; d <= dep; d++) {
    const sx = x1 + d, yt = ytop - Math.floor(d / 2), yb = ybot - Math.floor(d / 2);
    for (let y = yt; y <= yb; y++) {
      let c = ramp[2];
      if (d >= dep - 1) c = ramp[3];
      if (mat === 'timber' && (y - yt) % 4 === 0) c = ramp[3];
      if (mat === 'block' && ((y - yt) % 5 === 0)) c = ramp[3];
      if (rnd2(sx, y, seed) < 0.05) c = ramp[3];
      P(g, sx, y, c);
    }
  }
}

// gable roof: lit front triangle + shadowed right slope + eaves
function gableRoof(g: Grid, x0: number, x1: number, ytop: number, dep: number, roofH: number, ramp: readonly string[], opt: { overhang?: number } = {}) {
  const cx = (x0 + x1) / 2;
  const ov = opt.overhang == null ? 3 : opt.overhang;
  const gx0 = x0 - ov, gx1 = x1 + ov;
  // front gable triangle
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH;
    const hw = ((gx1 - gx0) / 2) * t;
    const yy = ytop - roofH + y;
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      let c = ramp[1];
      if (x <= cx - hw + 2) c = ramp[0];
      else if (x >= cx + hw - 1) c = ramp[2];
      if ((y) % 3 === 0) c = ramp[2];          // shingle rows
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

// warm lit window (ember interior glow) with frame
function litWindow(g: Grid, x: number, y: number, w: number, h: number, opt: { frame?: readonly string[]; noCross?: boolean } = {}) {
  const em = RAMP.ember, fr = opt.frame || RAMP.dirt;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = em[1];
    if (i === 0 || j === 0 || i === w - 1 || j === h - 1) c = em[0];
    if ((i + j) % 2 === 0 && rnd2(x + i, y + j, 12) < 0.3) c = em[0];
    P(g, x + i, y + j, c);
  }
  // frame + cross mullion
  for (let i = -1; i <= w; i++) { P(g, x + i, y - 1, fr[3]); P(g, x + i, y + h, fr[3]); }
  for (let j = -1; j <= h; j++) { P(g, x - 1, y + j, fr[3]); P(g, x + w, y + j, fr[3]); }
  if (!opt.noCross) {
    for (let j = 0; j < h; j++) P(g, x + (w >> 1), y + j, fr[3]);
    for (let i = 0; i < w; i++) P(g, x + i, y + (h >> 1), fr[3]);
  }
  // warm spill below the sill
  P(g, x, y + h + 1, em[2]); P(g, x + w - 1, y + h + 1, em[2]);
}

// plank door on the south wall
function door(g: Grid, cx: number, ybot: number, w: number, h: number, ramp: readonly string[], opt: { lintel?: string; handle?: string } = {}) {
  const x0 = cx - (w >> 1);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = ramp[2];
    if (i === 0) c = ramp[1];
    if (i === w - 1) c = ramp[3];
    if (i % 2 === 1) c = ramp[3];                    // plank gaps
    P(g, x0 + i, ybot - h + j, c);
  }
  // frame
  for (let j = -1; j <= h; j++) { P(g, x0 - 1, ybot - h + j, ramp[3]); P(g, x0 + w, ybot - h + j, ramp[3]); }
  for (let i = -1; i <= w; i++) P(g, x0 + i, ybot - h - 1, opt.lintel || ramp[3]);
  // handle
  P(g, x0 + w - 2, ybot - (h >> 1), opt.handle || RAMP.gold[1]);
}

// hanging sign board (post + chains + plate with a glyph)
function hangingSign(g: Grid, x: number, y: number, w: number, h: number, plate: readonly string[], glyphFn?: (gg: Grid, x: number, y: number, w: number, h: number) => void) {
  // bracket
  for (let i = 0; i < 6; i++) P(g, x - 1 + i, y - 2, RAMP.dirt[3]);
  P(g, x + 4, y - 2, RAMP.dirt[3]);
  // chains
  P(g, x + 1, y - 1, RAMP.bone[3]); P(g, x + w - 2, y - 1, RAMP.bone[3]);
  // plate
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = plate[1];
    if (i === 0 || j === 0) c = plate[0];
    if (i === w - 1 || j === h - 1) c = plate[3];
    P(g, x + i, y + j, c);
  }
  if (glyphFn) glyphFn(g, x, y, w, h);
}

function chimneySmoke(g: Grid, cx: number, topY: number) {
  const bn = RAMP.bone;
  let x = cx, y = topY;
  for (let k = 0; k < 10; k++) {
    P(g, x, y, bn[3]);
    if (k % 2 === 0) P(g, x + (k % 4 === 0 ? 1 : -1), y, bn[3]);
    y -= 1 + (k % 2); x += (k % 3 === 0 ? 1 : 0) * (k % 6 < 3 ? 1 : -1);
  }
}

/* ── the eight structures ─────────────────────────────────────────────────── */

interface ShellOpt {
  wall: readonly string[];
  mat?: WallMat;
  roofRamp?: readonly string[];
  roof?: boolean;
  fw?: number; fh?: number; dep?: number; roofH?: number;
  found?: number; baseY?: number; seed?: number; overhang?: number; ash?: boolean;
}

// shared house frame; returns key coords for detailing
function houseShell(g: Grid, opt: ShellOpt) {
  const cx = 72, baseY = opt.baseY || 130;
  foundation(g, cx, baseY + 8, opt.found == null ? 58 : opt.found, { ash: opt.ash });
  const fw = opt.fw || 64, fh = opt.fh || 56, dep = opt.dep || 26, roofH = opt.roofH || 22;
  const x0 = cx - (fw >> 1), x1 = cx + (fw >> 1), ytop = baseY - fh, ybot = baseY;
  rightWall(g, x1, ytop, ybot, dep, opt.wall, opt.mat, opt.seed || 1);
  frontWall(g, x0, x1, ytop, ybot, opt.wall, opt.seed || 1, opt.mat);
  if (opt.roof !== false) gableRoof(g, x0, x1, ytop, dep, roofH, opt.roofRamp || RAMP.dirt, { overhang: opt.overhang });
  return { cx, x0, x1, ytop, ybot, fw, fh, dep, roofH };
}

function drawDyeworks(): Grid {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.bone, mat: 'plaster', roofRamp: RAMP.stone, fh: 60, fw: 66, seed: 21 });
  // GREAT colorful dye drips running down from the upper floor (signature)
  const dyes = [
    [RAMP.drift[2], RAMP.drift[1]], [RAMP.ember[1], RAMP.ember[0]], [RAMP.water[0], '#6fa8c8'],
    [RAMP.gold[1], RAMP.gold[0]], [RAMP.blood[1], RAMP.blood[0]], [RAMP.grass[1], RAMP.grass[0]],
  ];
  let ddx = s.x0 + 3;
  for (let i = 0; ddx < s.x1 - 2; i++) {
    const dark = dyes[i % dyes.length][0], lit = dyes[i % dyes.length][1];
    const w = 2 + (rnd2(i, 2, 9) < 0.4 ? 1 : 0);
    const len = 16 + Math.floor(rnd2(i, 3, 9) * 26);     // long runs: upper floor → mid wall
    fillRect(g, ddx, s.ytop + 3, w + 1, 3, dark);         // pooled source at the seam
    for (let k = 0; k < len; k++) {
      const yy = s.ytop + 4 + k, wob = Math.round(Math.sin(k * 0.35 + i) * 0.5);
      for (let c = 0; c < w; c++) P(g, ddx + c + wob, yy, c === 0 ? lit : dark);
      if (k > len - 4) P(g, ddx + (w >> 1) + wob, yy, dark);
    }
    P(g, ddx + (w >> 1), s.ytop + 4 + len, dark);          // bead
    ddx += w + 2 + Math.floor(rnd2(i, 5, 9) * 5);
  }
  // door + lit window
  door(g, s.cx - 12, s.ybot, 10, 22, RAMP.dirt);
  litWindow(g, s.cx + 6, s.ytop + 18, 9, 9);
  // steaming dye vats out front
  ([[s.x0 + 2, s.ybot + 6, RAMP.drift], [s.x0 + 12, s.ybot + 9, RAMP.ember]] as [number, number, readonly string[]][]).forEach(([vx, vy, r]) => {
    for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) { let c = RAMP.dirt[2]; if (i === 0) c = RAMP.dirt[1]; if (i === 7) c = RAMP.dirt[3]; if (j === 0) c = r[2]; P(g, vx + i, vy + j, c); }
    P(g, vx + 3, vy - 2, RAMP.bone[3]); P(g, vx + 4, vy - 4, RAMP.bone[3]); P(g, vx + 3, vy - 6, RAMP.bone[3]);
  });
  // drying cloth line (many colors)
  for (let i = 0; i < 7; i++) { const lx = s.x1 + 2 + i * 4; const col = dyes[i % dyes.length][0]; P(g, lx, s.ytop + 8, RAMP.bone[3]); for (let j = 0; j < 6; j++) P(g, lx, s.ytop + 9 + j, col); }
  for (let x = s.x1; x <= s.x1 + 30; x++) P(g, x, s.ytop + 7, RAMP.bone[3]);
  outline(g, RAMP.void);
  return g;
}

function drawVault(): Grid {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.stone, mat: 'block', roof: false, fh: 64, fw: 72, dep: 30, found: 60, seed: 31 });
  // flat fortified parapet instead of gable (gaps punched between merlons)
  for (let x = s.x0 - 2; x <= s.x1 + 2; x++) for (let y = s.ytop - 6; y < s.ytop; y++) {
    if ((x % 6) < 2 && y < s.ytop - 3) { if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.d[y * g.w + x] = null; continue; }
    let c = RAMP.stone[1];
    if (x < s.x0) c = RAMP.stone[0];
    if (x > s.x1) c = RAMP.stone[2];
    P(g, x, y, c);
  }
  // crenellations
  for (let x = s.x0 - 2; x <= s.x1 + 2; x += 6) for (let i = 0; i < 3; i++) for (let y = s.ytop - 9; y < s.ytop - 6; y++) P(g, x + i, y, RAMP.stone[2]);
  // top face receding
  for (let d = 1; d <= s.dep; d++) for (let x = s.x0 - 2; x <= s.x1 + 2; x++) P(g, x + d, s.ytop - 6 - Math.floor(d / 2), RAMP.stone[3]);
  // parapet east face — the DS export leaves a transparent diagonal seam here
  // between the top face and the right wall; fill it so ground can't show through
  for (let d = 1; d <= s.dep; d++) {
    const sx = s.x1 + d, yt = s.ytop - 6 - Math.floor(d / 2);
    for (let y = yt; y < s.ytop - Math.floor(d / 2); y++) {
      P(g, sx, y, d >= s.dep - 1 ? RAMP.stone[3] : RAMP.stone[2]);
    }
  }
  // gold-trimmed reinforced door
  const dx = s.cx, db = s.ybot;
  for (let j = 0; j < 26; j++) for (let i = -7; i <= 7; i++) { let c = RAMP.stone[3]; if (i === -7) c = RAMP.gold[2]; if (i === 7) c = RAMP.gold[3]; if (Math.abs(i) === 4) c = RAMP.gold[3]; P(g, dx + i, db - 26 + j, c); }
  for (let i = -8; i <= 8; i++) P(g, dx + i, db - 27, RAMP.gold[1]);          // gold lintel
  for (let j = -27; j <= 0; j += 1) { P(g, dx - 8, db + j, RAMP.gold[2]); P(g, dx + 8, db + j, RAMP.gold[2]); }
  // big gold ring + seam
  P(g, dx, db - 13, RAMP.gold[0]); P(g, dx - 1, db - 13, RAMP.gold[1]); P(g, dx + 1, db - 13, RAMP.gold[1]); P(g, dx, db - 12, RAMP.gold[2]);
  // small barred lit window high up
  litWindow(g, s.cx - 6, s.ytop + 8, 5, 5, { noCross: true });
  for (let i = 0; i < 5; i++) P(g, s.cx - 6 + i, s.ytop + 10, RAMP.stone[3]);  // bars
  // gold seam coin emblem on wall
  fillRect(g, s.x1 - 9, s.ytop + 21, 3, 3, RAMP.gold[1]); P(g, s.x1 - 8, s.ytop + 22, RAMP.gold[0]);
  outline(g, RAMP.void);
  return g;
}

// the Wheel of the Drift — DS 'casino': striped games tent + prize wheel
function drawCasino(): Grid {
  const g = makeGrid(144, 152);
  foundation(g, 72, 138, 56, {});
  const cx = 72, baseY = 130, tw = 76, th = 64;
  const x0 = cx - (tw >> 1), x1 = cx + (tw >> 1), ytop = baseY - th;
  // tent body: blood-red & void-black vertical stripes, slightly crooked
  for (let x = x0; x <= x1; x++) {
    const stripe = Math.floor((x - x0) / 6) % 2;
    for (let y = ytop + 10; y <= baseY; y++) {
      const skew = Math.round((y - ytop) * 0.04);
      let c = stripe ? RAMP.blood[2] : RAMP.ash;
      if (x <= x0 + 1) c = stripe ? RAMP.blood[1] : RAMP.stone[2];
      else if (x >= x1 - 1) c = stripe ? RAMP.blood[3] : RAMP.void;
      P(g, x + skew, y, c);
    }
  }
  // peaked tent roof (scalloped)
  for (let x = x0 - 4; x <= x1 + 4; x++) {
    const d = Math.abs(x - cx);
    const yy = ytop + 10 - Math.round((1 - d / ((tw / 2) + 4)) * 26);
    const stripe = Math.floor((x - x0) / 6) % 2;
    for (let y = yy; y <= ytop + 11; y++) P(g, x, y, stripe ? RAMP.blood[1] : RAMP.ash);
  }
  // scalloped valance
  for (let x = x0 - 4; x <= x1 + 4; x += 4) { for (let i = 0; i < 3; i++) P(g, x + i, ytop + 11 + (i === 1 ? 2 : 1), RAMP.gold[1]); }
  // center pole flag
  for (let y = ytop - 22; y < ytop - 12; y++) P(g, cx, y, RAMP.dirt[3]);
  fillRect(g, cx + 1, ytop - 22, 6, 4, RAMP.blood[1]); P(g, cx + 6, ytop - 21, RAMP.blood[2]);
  // entrance flap (door) — open dark interior with tied-back curtains
  for (let j = 0; j < 26; j++) for (let i = -7; i <= 7; i++) {
    const t = Math.abs(i) / 7;
    if (j < 26 * t * 0.5) continue;                  // arched top
    P(g, cx + i, baseY - 26 + j + Math.round(t * 3), i <= -5 ? RAMP.blood[3] : RAMP.void);
  }
  for (let i = -8; i <= 8; i++) P(g, cx + i, baseY - 26 + Math.round(Math.abs(i) / 8 * 3), RAMP.gold[2]); // arch trim
  // warm glow + a beckoning lantern just inside
  litWindow(g, cx - 3, baseY - 18, 5, 5, { noCross: true });
  // big multicolor prize wheel by the entrance
  const wx = x0 - 12, wy = baseY - 30;
  const seg = [RAMP.blood[1], RAMP.ember[1], RAMP.gold[1], RAMP.water[0], RAMP.drift[2], RAMP.grass[1]];
  for (let yy = -11; yy <= 11; yy++) for (let xx = -11; xx <= 11; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    if (d > 11) continue;
    if (d > 9) { P(g, wx + xx, wy + yy, RAMP.dirt[3]); continue; }
    const ang = (Math.atan2(yy, xx) + Math.PI) / (Math.PI * 2);
    P(g, wx + xx, wy + yy, seg[Math.floor(ang * 6) % 6]);
  }
  P(g, wx, wy, RAMP.bone[0]); P(g, wx + 1, wy - 9, RAMP.bone[0]);                 // hub + pointer
  for (let k = 0; k < 14; k++) P(g, wx - 11, wy - 11 + k, RAMP.dirt[3]);          // post
  // hanging coin-charms over entrance
  for (let x = x0 + 4; x <= x1 - 4; x += 6) { P(g, x, ytop + 12, RAMP.gold[2]); P(g, x, ytop + 14, RAMP.gold[1]); P(g, x, ytop + 15, RAMP.gold[2]); }
  // a warm lit slit window
  litWindow(g, x1 - 14, baseY - 30, 6, 7, { noCross: true });
  outline(g, RAMP.void);
  return g;
}

// the Last Lantern — DS 'tavern': timbered taphouse with the big ember lantern
function drawTavern(): Grid {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.dirt, mat: 'timber', roofRamp: RAMP.blood, fh: 56, fw: 66, seed: 41, overhang: 4 });
  // timber A-frame braces on facade
  for (let k = 0; k < s.fh; k++) { P(g, s.x0 + 2 + Math.round(k * 0.5), s.ybot - k, RAMP.dirt[3]); P(g, s.x1 - 2 - Math.round(k * 0.5), s.ybot - k, RAMP.dirt[3]); }
  for (let x = s.x0 + 4; x <= s.x1 - 4; x++) P(g, x, s.ytop + 22, RAMP.dirt[3]);   // mid beam
  // crooked chimney with smoke
  const chx = s.x1 - 6;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 6; i++) { let c = RAMP.stone[2]; if (i === 0) c = RAMP.stone[1]; if (i === 5) c = RAMP.stone[3]; if (j % 4 === 0) c = RAMP.stone[3]; P(g, chx + i + Math.round(j * 0.15), s.ytop - 18 + j, c); }
  chimneySmoke(g, chx + 3, s.ytop - 19);
  // several glowing windows
  litWindow(g, s.cx - 18, s.ytop + 16, 8, 8);
  litWindow(g, s.cx + 10, s.ytop + 16, 8, 8);
  litWindow(g, s.cx - 4, s.ytop + 30, 7, 7, { noCross: true });
  // door (open, warm spill)
  door(g, s.cx, s.ybot, 12, 24, RAMP.dirt, { handle: RAMP.gold[0] });
  for (let j = 0; j < 22; j++) for (let i = -2; i <= 2; i++) if (rnd2(i, j, 17) < 0.5) P(g, s.cx + i, s.ybot - 22 + j, RAMP.ember[2]);
  // big ember lantern over the door
  const lx = s.cx, ly = s.ytop + 40;
  P(g, lx, ly - 3, RAMP.dirt[3]);
  for (let j = 0; j < 7; j++) for (let i = -3; i <= 3; i++) { const t = Math.abs(i) / 3; let c = RAMP.ember[1]; if (j === 0 || j === 6) c = RAMP.dirt[3]; else if (i <= -2) c = RAMP.ember[0]; else if (i >= 2) c = RAMP.ember[2]; if (t > 0.9 && (j === 1 || j === 5)) c = RAMP.dirt[3]; P(g, lx + i, ly + j, c); }
  P(g, lx, ly + 3, RAMP.ember[0]);
  // glow halo (dither)
  for (let yy = -5; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 5 && d < 9 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]); }
  // barrels outside
  [[s.x0 - 8, s.ybot + 4], [s.x0 - 1, s.ybot + 8]].forEach(([bx, by]) => {
    for (let j = 0; j < 10; j++) for (let i = 0; i < 8; i++) { const t = Math.abs(i - 3.5) / 4; let c = RAMP.dirt[1]; if (i === 0) c = RAMP.dirt[0]; if (i >= 6) c = RAMP.dirt[2]; if (j === 0 || j === 9 || j === 4) c = RAMP.dirt[3]; if (t > 0.85) c = RAMP.dirt[3]; P(g, bx + i, by + j, c); }
  });
  // hanging tavern sign (lantern glyph)
  hangingSign(g, s.x1 + 4, s.ytop + 26, 12, 9, RAMP.dirt, (gg, x, y) => {
    fillRect(gg, x + 4, y + 2, 4, 5, RAMP.ember[1]); P(gg, x + 5, y + 1, RAMP.ember[0]); P(gg, x + 5, y + 7, RAMP.ember[0]);
  });
  outline(g, RAMP.void);
  return g;
}

function drawFurnisher(): Grid {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.dirt, mat: 'log', roofRamp: RAMP.stone, fh: 54, fw: 60, seed: 51 });
  // log-end texture already in wall; door + lit window
  door(g, s.cx + 8, s.ybot, 11, 22, RAMP.dirt);
  litWindow(g, s.cx - 12, s.ytop + 16, 9, 9);
  // lean-to awning over a workbench (left side)
  const ax0 = s.x0 - 26, ax1 = s.x0 + 2, ay = s.ytop + 20;
  for (let x = ax0; x <= ax1; x++) { const yy = ay + Math.round((x - ax0) * 0.4); for (let k = 0; k < 2; k++) P(g, x, yy + k, k ? RAMP.dirt[3] : RAMP.dirt[2]); }
  for (let k = 0; k < 18; k++) { P(g, ax0, ay + 1 + k, RAMP.dirt[3]); P(g, ax0 + 1, ay + 1 + k, RAMP.dirt[2]); } // post
  // workbench
  const wbx = ax0 + 4, wby = s.ybot - 4;
  for (let i = 0; i < 20; i++) P(g, wbx + i, wby, RAMP.dirt[1]);
  for (let i = 0; i < 20; i++) P(g, wbx + i, wby + 1, RAMP.dirt[3]);
  P(g, wbx + 1, wby + 2, RAMP.dirt[3]); P(g, wbx + 1, wby + 3, RAMP.dirt[3]); P(g, wbx + 18, wby + 2, RAMP.dirt[3]); P(g, wbx + 18, wby + 3, RAMP.dirt[3]);
  // a half-built chair on the bench + saw
  fillRect(g, wbx + 4, wby - 5, 2, 5, RAMP.dirt[2]); fillRect(g, wbx + 4, wby - 5, 5, 2, RAMP.dirt[1]); P(g, wbx + 8, wby - 5, RAMP.dirt[2]);
  for (let i = 0; i < 6; i++) P(g, wbx + 11 + i, wby - 2, RAMP.bone[1]);  // saw blade
  P(g, wbx + 17, wby - 3, RAMP.dirt[3]);
  // sawdust
  for (let i = 0; i < 12; i++) if (rnd2(i, 5, 18) < 0.6) P(g, wbx + 2 + i, s.ybot + 1 + (i % 2), RAMP.gold[2]);
  // stacked crates + planks (right)
  const px = s.x1 + 4;
  for (let c = 0; c < 2; c++) for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) { let col = RAMP.dirt[1]; if (i === 0) col = RAMP.dirt[0]; if (i === 8) col = RAMP.dirt[2]; if (j === 0 || j === 8 || i === 0 || i === 8) col = RAMP.dirt[3]; if (i === j || i === 8 - j) col = RAMP.dirt[2]; P(g, px + c * 10, s.ybot - 9 - (c ? 9 : 0) + j, col); P(g, px + c * 10 + i, s.ybot - 9 - (c ? 9 : 0) + j, col); }
  for (let i = 0; i < 12; i++) { P(g, px - 2, s.ybot - 2 - i * 0, RAMP.dirt[2]); } // (planks leaning)
  for (let k = 0; k < 14; k++) { P(g, px + 18 + Math.round(k * 0.2), s.ybot - k, RAMP.dirt[1]); P(g, px + 19 + Math.round(k * 0.2), s.ybot - k, RAMP.dirt[3]); }
  // small wares banner + lamp out front
  hangingSign(g, s.x1 + 2, s.ytop + 24, 11, 8, RAMP.dirt, (gg, x, y) => {
    fillRect(gg, x + 3, y + 2, 5, 2, RAMP.dirt[1]); P(gg, x + 4, y + 4, RAMP.dirt[2]); P(gg, x + 6, y + 4, RAMP.dirt[2]); // chair glyph
  });
  outline(g, RAMP.void);
  return g;
}

function drawMenagerie(): Grid {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.dirt, mat: 'timber', roofRamp: RAMP.water, fh: 56, fw: 62, seed: 61 });
  // door + lit window
  door(g, s.cx, s.ybot, 11, 22, RAMP.dirt);
  litWindow(g, s.cx - 18, s.ytop + 30, 7, 7, { noCross: true });
  // cages built onto facade
  const cage = (x: number, y: number, w: number, h: number, content: (x: number, y: number, w: number, h: number) => void) => {
    for (let i = -1; i <= w; i++) { P(g, x + i, y - 1, RAMP.stone[3]); P(g, x + i, y + h, RAMP.stone[3]); }
    for (let j = -1; j <= h; j++) { P(g, x - 1, y + j, RAMP.stone[3]); P(g, x + w, y + j, RAMP.stone[3]); }
    for (let i = 0; i < w; i += 2) for (let j = 0; j < h; j++) P(g, x + i, y + j, RAMP.stone[2]);  // bars
    content(x, y, w, h);
  };
  // glowing wisp in a cage (left)
  cage(s.x0 + 4, s.ytop + 16, 10, 12, (x, y) => {
    const wx = x + 5, wy = y + 7;
    P(g, wx, wy, RAMP.drift[0]); P(g, wx - 1, wy, RAMP.drift[1]); P(g, wx + 1, wy, RAMP.drift[1]); P(g, wx, wy - 1, RAMP.drift[1]); P(g, wx, wy + 1, RAMP.drift[2]);
    for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy) % 2 === 0) P(g, wx + xx, wy + yy, RAMP.drift[2]);
  });
  // empty perch cage (right)
  cage(s.x1 - 14, s.ytop + 18, 10, 12, (x, y, w, h) => {
    for (let i = 2; i < w - 2; i++) P(g, x + i, y + h - 3, RAMP.dirt[3]);     // perch
    P(g, x + 4, y + h - 4, RAMP.gold[2]);                                      // seed
  });
  // perched black bird on the roofline (clear silhouette)
  const bx = s.cx + 2, by = s.ytop - s.roofH - 4;
  fillRect(g, bx, by + 1, 5, 3, RAMP.void);            // body
  fillRect(g, bx + 5, by + 2, 3, 1, RAMP.void);        // tail
  P(g, bx + 1, by, RAMP.void); P(g, bx + 1, by - 1, RAMP.void);  // raised head
  P(g, bx + 2, by - 1, RAMP.void);
  P(g, bx, by, RAMP.drift[1]);                          // drift eye glint
  P(g, bx + 1, by + 4, RAMP.gold[2]); P(g, bx + 3, by + 4, RAMP.gold[2]);  // legs
  for (let k = 0; k < 3; k++) P(g, bx + 5 + k, by + 1 - k, RAMP.void); // tail upsweep
  // drift-purple accents on eaves
  for (let x = s.x0 - 3; x <= s.x1 + 3; x += 5) P(g, x, s.ytop + 1, RAMP.drift[2]);
  // sign (paw/feather glyph)
  hangingSign(g, s.x1 + 2, s.ytop + 30, 11, 8, RAMP.water, (gg, x, y) => {
    P(gg, x + 5, y + 2, RAMP.bone[1]); P(gg, x + 4, y + 4, RAMP.bone[1]); P(gg, x + 6, y + 4, RAMP.bone[1]); P(gg, x + 5, y + 5, RAMP.bone[2]);
  });
  outline(g, RAMP.void);
  return g;
}

// SHRINE (not a house): stepped dais + cracked altar + Pale Flame (3 frames)
function drawShrine(frame = 0): Grid {
  const g = makeGrid(112, 128);
  // DS uses baseY=116, which pushes the bottom dais tier (tip at baseY+19, rim
  // +4 more) past row 127 and shears it flat. 103 fits the full diamond + rim
  // + 1px void outline inside the cell.
  const cx = 56, baseY = 103;
  // scorch marks on ground
  for (let i = 0; i < 26; i++) { const a = rnd2(i, frame, 19); const x = cx - 30 + Math.floor(rnd2(i, 1, 19) * 60); const y = baseY + 2 + Math.floor(rnd2(i, 2, 19) * 6); if (a < 0.5) P(g, x, y, RAMP.void); else if (a < 0.7) P(g, x, y, RAMP.ash); }
  // stepped stone dais (3 tiers, iso)
  for (let t = 0; t < 3; t++) {
    const hw = 38 - t * 8, ty = baseY - t * 8, hh = Math.round(hw / 2);
    for (let dy = -hh; dy <= hh; dy++) {
      const k = 1 - Math.abs(dy) / hh, w = Math.round(hw * k);
      for (let dx = -w; dx <= w; dx++) { let c = RAMP.stone[1]; if (dy < 0 && dx < 0) c = RAMP.stone[0]; else if (dy > 0) c = RAMP.stone[2]; if (rnd2(cx + dx, ty + dy, 20) < 0.05) c = RAMP.stone[2]; P(g, cx + dx, ty + dy, c); }
    }
    for (let dx = -hw; dx <= hw; dx++) { const k = 1 - Math.abs(dx) / hw; const ey = ty + Math.round(hh * k); for (let s2 = 1; s2 <= 4; s2++) P(g, cx + dx, ey + s2, s2 < 3 ? RAMP.stone[2] : RAMP.stone[3]); }
  }
  // cracked altar block
  const ay = baseY - 30;
  for (let j = 0; j < 12; j++) for (let i = -10; i <= 10; i++) { let c = RAMP.stone[1]; if (i < -7) c = RAMP.stone[0]; if (i > 7) c = RAMP.stone[2]; if (j === 0) c = RAMP.stone[0]; if (j > 9) c = RAMP.stone[3]; P(g, cx + i, ay + j, c); }
  // crack
  for (let j = 0; j < 12; j++) P(g, cx + 2 + Math.round(Math.sin(j) * 1.5), ay + j, RAMP.stone[3]);
  // votive candles
  ([[cx - 14, baseY - 16], [cx + 14, baseY - 16], [cx - 20, baseY - 6], [cx + 20, baseY - 6]] as [number, number][]).forEach(([vx, vy], i) => {
    P(g, vx, vy, RAMP.bone[1]); P(g, vx, vy + 1, RAMP.bone[2]); P(g, vx, vy - 1, RAMP.ember[(frame + i) % 2 ? 1 : 0]);
  });
  // THE PALE FLAME — bone-white fire, drift-purple core, flicker per frame
  const fx = cx, fy = ay - 2;
  const sway = [0, 1, -1][frame], tall = [0, 1, 2][frame];
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
  for (let yy = 1; yy <= 8 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (9 + tall)) * 3)); const sx = fx + Math.round(sway * (yy / 10)); for (let xx = -hw; xx <= hw; xx++) P(g, sx + xx, fy - yy - 1, Math.abs(xx) === 0 ? RAMP.drift[0] : RAMP.drift[2]); }
  // rising mote sparks
  for (let i = 0; i < 4; i++) { const a = (frame + i) % 3; if (a < 2) P(g, fx - 3 + i * 2, fy - 14 - i * 2 - tall, i % 2 ? RAMP.drift[1] : RAMP.bone[0]); }
  // pale glow halo (dither)
  for (let yy = -12; yy <= 4; yy++) for (let xx = -10; xx <= 10; xx++) { const d = Math.abs(xx) + Math.abs(yy * 1.3); if (d > 8 && d < 12 && (xx + yy + frame) % 2 === 0) P(g, fx + xx, fy - 6 + yy, RAMP.drift[2]); }
  outline(g, RAMP.void);
  return g;
}

// THE PIT (not a house): flat arena ring, center-anchored, drawn UNDER entities
function drawPit(): Grid {
  const g = makeGrid(240, 120);
  const cx = 120, cy = 60, RX = 108, RY = 54;
  // packed-sand floor (iso ellipse)
  for (let y = -RY; y <= RY; y++) for (let x = -RX; x <= RX; x++) {
    const d = (x / RX) ** 2 + (y / RY) ** 2; if (d > 1) continue;
    let c = RAMP.dirt[1];
    if (d > 0.82) c = RAMP.dirt[3];                       // worn rim
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
    for (let yy = -3; yy <= 3; yy++) for (let xx = -4; xx <= 4; xx++) { if (rnd2(bx + xx, by + yy, 25) < 0.45 && xx * xx + yy * yy < 14) P(g, bx + xx, by + yy, RAMP.blood[3]); }
  }
  // ten weathered standing stones around the rim, drift-touched tips
  const N = 10;
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(ang) * RX * 0.96);
    const sy = Math.round(cy + Math.sin(ang) * RY * 0.96);
    const h = 16 + Math.floor(rnd2(i, 3, 26) * 8);
    const w = 4 + Math.floor(rnd2(i, 4, 26) * 2);
    for (let j = 0; j < h; j++) for (let k = -w; k <= w; k++) {
      const t = j / h; const ww = Math.round(w * (1 - t * 0.3));
      if (Math.abs(k) > ww) continue;
      let c = RAMP.stone[1]; if (k < -ww + 1) c = RAMP.stone[0]; if (k > ww - 1) c = RAMP.stone[3];
      if (rnd2(sx + k, sy - j, 27) < 0.08) c = RAMP.stone[2];
      P(g, sx + k, sy - j, c);
    }
    // drift-touched tip
    for (let k = -w + 1; k <= w - 1; k++) P(g, sx + k, sy - h, RAMP.drift[2]);
    P(g, sx, sy - h - 1, RAMP.drift[1]); if (i % 2) P(g, sx, sy - h - 2, RAMP.drift[0]);
    // base shadow
    for (let k = -w - 1; k <= w + 1; k++) P(g, sx + k, sy + 1, RAMP.void);
    // half-buried skull at some rims
    if (i % 3 === 0) { const kx = sx + 5, ky = sy + 2; fillRect(g, kx, ky, 4, 3, RAMP.bone[1]); P(g, kx + 1, ky + 1, RAMP.void); P(g, kx + 3, ky + 1, RAMP.void); P(g, kx + 1, ky + 3, RAMP.bone[2]); }
  }
  // sagging rope/chain between some stones
  for (let i = 0; i < N; i++) {
    if (i % 2) continue;
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * RX * 0.96, y0 = cy + Math.sin(a0) * RY * 0.96;
    const x1 = cx + Math.cos(a1) * RX * 0.96, y1 = cy + Math.sin(a1) * RY * 0.96;
    for (let t = 0; t <= 1; t += 0.06) {
      const x = Math.round(x0 + (x1 - x0) * t);
      const sag = Math.sin(t * Math.PI) * 5;
      const y = Math.round(y0 + (y1 - y0) * t - 14 + sag);
      P(g, x, y, RAMP.dirt[3]); if (Math.floor(t * 16) % 2 === 0) P(g, x, y, RAMP.stone[3]);
    }
  }
  outline(g, RAMP.void);
  return g;
}

// THE STABLE — placeholder building (the DS stable art swaps in here later):
// a timber barn with a wide dark stall, a hay bale, and a paddock rail.
function drawStable(): Grid {
  const g = makeGrid(144, 152);
  const s = houseShell(g, { wall: RAMP.dirt, mat: 'log', roofRamp: RAMP.stone, fh: 52, fw: 66, seed: 71 });
  // a wide barn doorway (dark stall mouth) with a cross-braced upper hatch
  door(g, s.cx, s.ybot, 22, 30, RAMP.dirt);
  for (let i = -10; i <= 10; i++) P(g, s.cx + i, s.ytop + 14, RAMP.dirt[3]); // hatch lintel
  for (let i = 0; i < 9; i++) { P(g, s.cx - 9 + i, s.ytop + 15 + i, RAMP.dirt[2]); P(g, s.cx + 9 - i, s.ytop + 15 + i, RAMP.dirt[2]); } // X brace
  // a hay bale out front (left)
  const hx = s.x0 - 6, hy = s.ybot - 10;
  for (let j = 0; j < 10; j++) for (let i = 0; i < 14; i++) {
    const edge = i === 0 || i === 13 || j === 0 || j === 9;
    P(g, hx + i, hy + j, edge ? RAMP.gold[3] : ((i + j) % 3 === 0 ? RAMP.gold[1] : RAMP.gold[2]));
  }
  // a paddock rail to the right (two horizontals + posts)
  const rx = s.x1 + 3, ry = s.ybot - 4;
  for (let i = 0; i < 26; i++) { P(g, rx + i, ry, RAMP.dirt[2]); P(g, rx + i, ry - 8, RAMP.dirt[2]); }
  for (const px of [rx, rx + 12, rx + 24]) for (let k = 0; k < 14; k++) P(g, px, ry + 2 - k, RAMP.dirt[3]);
  outline(g, RAMP.void);
  return g;
}

// THE MINE entrance — DS port (_gen/interiors.js drawMine, 144×120)
function drawMine(): Grid {
  const g = makeGrid(144, 120);
  const cx = 72, baseY = 100;
  foundation(g, cx, baseY + 6, 56, {});
  // rocky mound — low, broad, FLAT-topped dome, irregular silhouette
  const maxH = 46;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(66 * Math.pow(1 - Math.pow(t, 3), 0.42));  // stays wide, flat top
    hw += Math.round((hash2(yy, 0, 95) - 0.5) * 6);   // rocky bumps
    if (yy > maxH - 6) hw = Math.max(hw, 10 - (maxH - yy) * 1.5);  // rounded flat cap
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 91);
      let c = RAMP.stone[1];
      if (xx < -hw + 6) c = RAMP.stone[0];          // moonlit left
      else if (xx > hw - 6) c = RAMP.stone[3];      // shadow right
      else if (h < 0.10) c = RAMP.stone[2];
      else if (h < 0.13) c = RAMP.stone[0];
      if (h < 0.02) c = RAMP.stone[3];
      P(g, cx + xx, top, c);
    }
  }
  // gold seams glinting across the rock
  const rng = mulberry(913);
  for (let s = 0; s < 7; s++) {
    let x = cx - 40 + Math.floor(rng() * 80), y = baseY - 8 - Math.floor(rng() * 46);
    const dx = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < 10 + Math.floor(rng() * 8); k++) {
      if (G(g, x, y)) { P(g, x, y, RAMP.gold[1]); if (rng() < 0.5) P(g, x, y + 1, RAMP.gold[2]); if (rng() < 0.3) P(g, x, y - 1, RAMP.gold[0]); }
      x += dx * (rng() < 0.4 ? 1 : 0) + (rng() < 0.3 ? 1 : 0); y += rng() < 0.5 ? 1 : -1;
    }
  }
  // timber-framed dark adit on the south face
  const ax = cx, abot = baseY, aw = 30, ah = 30;
  for (let j = 0; j < ah; j++) for (let i = -aw / 2; i <= aw / 2; i++) {
    const t = Math.abs(i) / (aw / 2);
    if (j < ah * 0.45 * t) continue;                // arched top
    P(g, ax + i, abot - j, RAMP.void);
  }
  // arch interior depth hint (dither toward lighter at top)
  for (let j = 0; j < 6; j++) for (let i = -aw / 2 + 3; i <= aw / 2 - 3; i++) if ((i + j) % 2 === 0 && Math.abs(i) < (aw / 2 - 3)) P(g, ax + i, abot - ah + 6 + j, RAMP.stone[3]);
  // timber frame (posts + lintel)
  for (let j = 0; j <= ah; j++) { fillRect(g, ax - aw / 2 - 3, abot - j, 3, 1, RAMP.dirt[1]); fillRect(g, ax + aw / 2, abot - j, 3, 1, RAMP.dirt[2]); }
  for (let i = -aw / 2 - 3; i <= aw / 2 + 3; i++) { const t = Math.abs(i) / (aw / 2 + 3); const ly = abot - ah - 2 + Math.round(t * 5); P(g, ax + i, ly, RAMP.dirt[1]); P(g, ax + i, ly - 1, RAMP.dirt[0]); P(g, ax + i, ly - 2, RAMP.dirt[3]); }
  // cross-brace
  for (let k = 0; k < aw + 6; k++) P(g, ax - aw / 2 - 3 + k, abot - ah + 2 + Math.round(Math.sin(k / (aw + 6) * Math.PI) * -2), RAMP.dirt[3]);
  // cart rails running out of the mouth (south, toward camera)
  for (let k = 0; k < 22; k++) {
    const ry = abot + k, spread = 4 + Math.floor(k * 0.5);
    P(g, ax - spread, ry, RAMP.stone[3]); P(g, ax - spread + 1, ry, RAMP.stone[2]);
    P(g, ax + spread, ry, RAMP.stone[3]); P(g, ax + spread - 1, ry, RAMP.stone[2]);
    if (k % 3 === 0) for (let i = -spread; i <= spread; i++) P(g, ax + i, ry, RAMP.dirt[3]); // tie
  }
  // a few raw ore chunks by the mouth
  ([[ax - 22, abot + 2], [ax + 20, abot + 5]] as [number, number][]).forEach(([ox, oy]) => { P(g, ox, oy, RAMP.gold[1]); P(g, ox + 1, oy, RAMP.gold[2]); P(g, ox, oy - 1, RAMP.gold[0]); P(g, ox - 1, oy, RAMP.stone[2]); });
  // hung ember lantern by the entrance (on the left post)
  const lx = ax - aw / 2 - 6, ly = abot - ah + 6;
  P(g, lx + 2, ly - 4, RAMP.dirt[3]); for (let i = 0; i < 4; i++) P(g, lx + 2 + i, ly - 4, RAMP.dirt[3]);
  for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) { let c = RAMP.ember[1]; if (j === 0 || j === 7) c = RAMP.dirt[3]; else if (i <= -2) c = RAMP.ember[0]; else if (i >= 2) c = RAMP.ember[2]; P(g, lx + i, ly + j, c); }
  P(g, lx, ly + 3, RAMP.ember[0]);
  for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 4 && d < 8 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]); }
  outline(g, RAMP.void);
  return g;
}

// ─── WILD STRUCTURES (ported from DS _gen/wilds.js — byte-checked) ───────────

/** branching drift vein walk across a mass (wilds pack helper) */
function driftVeins(g: Grid, x0: number, y0: number, count: number, len: number, seed: number) {
  const dr = RAMP.drift, rng = mulberry(seed);
  for (let v = 0; v < count; v++) {
    let x = x0 + Math.floor((rng() - 0.5) * 40), y = y0 + Math.floor((rng() - 0.5) * 24);
    let dx = rng() < 0.5 ? 1 : -1, dy = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < len; k++) {
      if (G(g, x, y)) {
        P(g, x, y, k % 7 === 0 ? dr[1] : dr[2]);
        if (rng() < 0.4) P(g, x, y + 1, dr[3]);
        if (k % 9 === 0) P(g, x, y - 1, dr[0]); // glowing node
      }
      x += dx * (rng() < 0.6 ? 1 : 0); y += dy * (rng() < 0.5 ? 1 : 0);
      if (rng() < 0.15) dx = -dx;
      if (rng() < 0.12) dy = -dy;
    }
  }
}

function boneSpikeShape(g: Grid, bx: number, by: number, h: number, lean: number) {
  const bn = RAMP.bone;
  for (let k = 0; k < h; k++) {
    const t = k / h, w = Math.max(0, Math.round((1 - t) * 2));
    const sx = bx + Math.round(lean * t * 3);
    for (let i = -w; i <= w; i++) P(g, sx + i, by - k, i < 0 ? bn[0] : i > 0 ? bn[2] : bn[1]);
  }
  P(g, bx, by - h, bn[0]);
}

// the Husk Den: a corrupted burrow-mound ringed with old bones (120×88, 2f eye-blink)
function drawHuskDen(frame = 0): Grid {
  const g = makeGrid(120, 88);
  const cx = 60, baseY = 78;
  foundation(g, cx, baseY + 4, 50, { ash: true });
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
      if (xx < -hw + 5) c = RAMP.stone[0];
      else if (xx > hw - 5) c = RAMP.stone[3];
      else if (h < 0.10) c = RAMP.stone[2];
      else if (h < 0.13) c = RAMP.stone[0];
      P(g, cx + xx, top, c);
    }
  }
  // drift-purple veining
  driftVeins(g, cx, baseY - 26, 5, 60, 103);
  // dark arched burrow mouth (south)
  const mw = 22, mh = 26;
  for (let j = 0; j < mh; j++) for (let i = -mw / 2; i <= mw / 2; i++) {
    const t = Math.abs(i) / (mw / 2);
    if (j < mh * 0.5 * t) continue;
    P(g, cx + i, baseY - j, RAMP.void);
  }
  // faint drift-glow eyes inside
  const bright = frame === 1;
  const ey = baseY - 14;
  ([[-5, bright ? RAMP.drift[0] : RAMP.drift[2]], [5, bright ? RAMP.drift[1] : RAMP.drift[3]]] as [number, string][]).forEach(([ox, c]) => {
    P(g, cx + ox, ey, c); P(g, cx + ox + 1, ey, c);
    P(g, cx + ox, ey + 1, bright ? RAMP.drift[2] : RAMP.drift[3]);
    if (bright) { P(g, cx + ox, ey - 1, RAMP.drift[2]); P(g, cx + ox + 2, ey, RAMP.drift[3]); P(g, cx + ox - 1, ey, RAMP.drift[3]); }
  });
  // ringed bone spikes jutting out
  ([[-44, 6, -0.6], [-30, 9, -0.3], [34, 9, 0.3], [46, 6, 0.6], [-16, 5, -0.2], [20, 6, 0.2]] as [number, number, number][]).forEach(([ox, h, ln]) => {
    boneSpikeShape(g, cx + ox, baseY + 1, h + 6, ln);
  });
  // scattered ribs at the base
  const rng = mulberry(104);
  for (let i = 0; i < 5; i++) {
    const rx = cx - 40 + Math.floor(rng() * 80), ry = baseY + 2 + Math.floor(rng() * 4);
    for (let k = 0; k < 5; k++) P(g, rx + k, ry - Math.round(Math.sin(k / 5 * Math.PI) * 2), RAMP.bone[2]);
    P(g, rx, ry, RAMP.bone[1]); P(g, rx + 5, ry, RAMP.bone[1]);
  }
  outline(g, RAMP.void);
  return g;
}

// the Ash Obelisk: a leaning monolith with pulsing runes (64×112, 3f pulse)
function drawAshObelisk(frame = 0): Grid {
  const g = makeGrid(64, 112);
  const cx = 32, baseY = 104;
  foundation(g, cx, baseY + 2, 30, { ash: true });
  // tapered monolith
  const topY = 14;
  for (let y = baseY; y >= topY; y--) {
    const t = (baseY - y) / (baseY - topY);
    const hw = Math.round(13 - t * 5);
    const skew = Math.round(t * 2); // slight lean
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x + skew;
      let c = RAMP.stone[1];
      if (x < -hw + 2) c = RAMP.stone[0];
      else if (x > hw - 2) c = RAMP.stone[3];
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
  const runes: [number, number][] = [[0, 30], [-1, 44], [1, 58], [0, 72], [-1, 86]];
  runes.forEach(([ox, ry], i) => {
    const rx = cx + ox;
    const yy = baseY - ry;
    // a small angular rune glyph
    const on = ((frame + i) % 3) !== 2;
    const col = on ? lit : dim;
    P(g, rx, yy, col); P(g, rx - 1, yy + 1, col); P(g, rx + 1, yy + 1, col); P(g, rx, yy + 2, col);
    P(g, rx - 1, yy - 1, on ? dim : RAMP.drift[3]); P(g, rx + 1, yy - 1, on ? dim : RAMP.drift[3]);
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

// the Mirewife's Hut: a crooked stilted hut over the bog (120×116)
function drawMirewifeHut(): Grid {
  const g = makeGrid(120, 116);
  const cx = 58, baseY = 108;
  // boggy ground (water + dirt iso patch)
  for (let yy = -16; yy <= 16; yy++) for (let xx = -54; xx <= 54; xx++) {
    if ((xx / 54) ** 2 + (yy / 16) ** 2 > 1) continue;
    const h = hash2(cx + xx, baseY + yy, 121);
    let c = RAMP.dirt[2];
    if (h < 0.3) c = RAMP.water[2]; else if (h < 0.36) c = RAMP.water[1];
    if (h > 0.93) c = RAMP.grass[2];
    P(g, cx + xx, baseY + yy, c);
  }
  // reed tufts in the bog
  for (let i = 0; i < 8; i++) {
    const rx = cx - 46 + Math.floor(hash2(i, 1, 122) * 92), ry = baseY + Math.floor((hash2(i, 2, 122) - 0.5) * 22);
    for (let k = 0; k < 4; k++) P(g, rx, ry - k, RAMP.grass[k > 2 ? 2 : 1]);
    P(g, rx, ry - 4, RAMP.bone[2]);
  }

  const lean = -1; // crooked
  // stilts lifting the hut
  const liftTop = baseY - 26;
  [-26, -10, 10, 26].forEach((ox, i) => {
    const sx = cx + ox; const ly = baseY + (i % 2 ? 4 : 2);
    for (let y = liftTop; y <= ly; y++) { P(g, sx, y, RAMP.dirt[2]); P(g, sx + 1, y, RAMP.dirt[3]); }
    // cross-brace
    P(g, sx, liftTop + 8, RAMP.dirt[3]);
  });
  // hut body (leaning)
  const fw = 60, fh = 38, x0 = cx - fw / 2, ytop = liftTop - fh, ybot = liftTop;
  for (let y = ytop; y <= ybot; y++) {
    const sk = Math.round((ybot - y) / fh * lean * 4);
    for (let x = x0; x <= x0 + fw; x++) {
      let c = RAMP.dirt[1];
      if (x <= x0 + 2) c = RAMP.dirt[0]; else if (x >= x0 + fw - 2) c = RAMP.dirt[2];
      if ((y - ytop) % 4 === 0) c = RAMP.dirt[3]; // plank seams
      if (hash2(x, y, 123) < 0.05) c = RAMP.dirt[2];
      P(g, x + sk, y, c);
    }
  }
  // right side wall (shadow), receding
  for (let d = 1; d <= 22; d++) for (let y = ytop; y <= ybot; y++) P(g, x0 + fw + d, y - Math.floor(d / 2), d >= 21 ? RAMP.dirt[3] : RAMP.dirt[2]);
  // mossy reed-thatch roof (gable, overhang)
  const ov = 6, roofH = 22, gx0 = x0 - ov, gx1 = x0 + fw + ov, rcx = (gx0 + gx1) / 2;
  for (let y = 0; y <= roofH; y++) {
    const t = y / roofH, hw = ((gx1 - gx0) / 2) * t;
    const yy = ytop - roofH + y + Math.round((ybot - (ytop - roofH + y)) / fh * lean * 2);
    for (let x = Math.round(rcx - hw); x <= Math.round(rcx + hw); x++) {
      let c = RAMP.grass[2];
      if (x <= rcx - hw + 2) c = RAMP.grass[1];
      else if (x >= rcx + hw - 1) c = RAMP.grass[3];
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
  const wx = cx - 6, wy = ytop + 12;
  for (let j = 0; j < 11; j++) for (let i = 0; i < 11; i++) {
    let c = RAMP.ember[1];
    if (i === 0 || j === 0 || i === 10 || j === 10) c = RAMP.ember[0];
    if ((i + j) % 2 === 0 && hash2(i, j, 126) < 0.3) c = RAMP.ember[0];
    P(g, wx + i, wy + j, c);
  }
  for (let i = -1; i <= 11; i++) { P(g, wx + i, wy - 1, RAMP.dirt[3]); P(g, wx + i, wy + 11, RAMP.dirt[3]); }
  for (let j = -1; j <= 11; j++) { P(g, wx - 1, wy + j, RAMP.dirt[3]); P(g, wx + 11, wy + j, RAMP.dirt[3]); }
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
    const hxr = x0 + 6 + s * 9, hy = ytop + 2;
    P(g, hxr, hy, RAMP.dirt[3]);
    for (let k = 1; k < 5 + (s % 3); k++) P(g, hxr, hy + k, RAMP.bone[3]);
    const cy = hy + 5 + (s % 3);
    if (s % 3 === 0) { fillRect(g, hxr - 1, cy, 3, 2, RAMP.bone[1]); P(g, hxr - 1, cy + 1, RAMP.void); P(g, hxr + 1, cy + 1, RAMP.void); } // skull
    else if (s % 3 === 1) { P(g, hxr, cy, RAMP.drift[1]); P(g, hxr - 1, cy + 1, RAMP.drift[2]); P(g, hxr + 1, cy + 1, RAMP.drift[2]); P(g, hxr, cy + 2, RAMP.drift[2]); } // drift charm
    else { for (let k = 0; k < 3; k++) P(g, hxr, cy + k, RAMP.bone[2]); } // bone shard
  }
  // rickety stoop (steps down from door)
  for (let s = 0; s < 3; s++) for (let i = 0; i < 12 - s * 2; i++) {
    P(g, x0 + 7 + s + i, ybot + 1 + s * 2, RAMP.dirt[3]);
    P(g, x0 + 7 + s + i, ybot + 2 + s * 2, RAMP.dirt[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// ─── wilds doodads + interior additions (DS _gen/wilds.js) ───────────────────

export type WildDoodadKey = 'reed_clump' | 'dead_tree' | 'bone_spike' | 'mire_bubble';

export function drawReedClump(variant: number): Grid {
  const g = makeGrid(12, 18); const baseY = 16, cx = 6;
  const blades = variant ? 6 : 4;
  const rng = mulberry(131 + variant);
  for (let i = 0; i < blades; i++) {
    const bx = cx + Math.floor((rng() - 0.5) * 8), h = 9 + Math.floor(rng() * 6), lean = (rng() - 0.5) * 2;
    for (let k = 0; k < h; k++) {
      const sx = bx + Math.round(lean * (k / h));
      P(g, sx, baseY - k, k > h - 2 ? RAMP.grass[0] : (k < 3 ? RAMP.grass[3] : RAMP.grass[1]));
    }
    if (rng() < 0.6) { const sy = baseY - h; P(g, bx + Math.round(lean), sy - 1, RAMP.bone[2]); P(g, bx + Math.round(lean), sy - 2, RAMP.bone[1]); } // seed-head
  }
  outline(g, RAMP.void); return g;
}

export function drawDeadTree(variant: number): Grid {
  const g = makeGrid(28, 40); const baseY = 38, cx = 13;
  const dr = RAMP.dirt;
  // trunk leaning
  const lean = variant ? 0.18 : -0.1;
  for (let y = 0; y < 30; y++) {
    const t = y / 30; const w = Math.round(3 - t * 1.5); const sx = cx + Math.round(lean * y);
    for (let i = -w; i <= w; i++) P(g, sx + i, baseY - y, i < 0 ? dr[0] : i > 0 ? dr[3] : dr[1]);
  }
  // bare branches
  const rng = mulberry(141 + variant);
  const branch = (x0: number, y0: number, dx: number, dy: number, n: number) => {
    let x = x0, y = y0;
    for (let k = 0; k < n; k++) {
      P(g, Math.round(x), Math.round(y), dr[2]);
      x += dx; y += dy;
      if (rng() < 0.3) P(g, Math.round(x), Math.round(y), dr[3]);
    }
  };
  const tx = cx + Math.round(lean * 24);
  branch(tx, baseY - 24, -0.9, -0.7, 9); branch(tx, baseY - 26, 0.95, -0.6, 10); branch(tx, baseY - 28, 0.1, -1, 7);
  branch(tx - 6, baseY - 28, -0.7, -0.6, 5); branch(tx + 6, baseY - 30, 0.7, -0.5, 5);
  // drift moss tufts
  for (let i = 0; i < (variant ? 5 : 3); i++) {
    const mx = tx + Math.floor((rng() - 0.5) * 18), my = baseY - 18 - Math.floor(rng() * 14);
    P(g, mx, my, RAMP.drift[2]);
    if (rng() < 0.5) P(g, mx + 1, my, RAMP.drift[3]);
    P(g, mx, my + 1, RAMP.drift[3]);
  }
  outline(g, RAMP.void); return g;
}

export function drawBoneSpike(variant: number): Grid {
  const g = makeGrid(10, 16); const baseY = 14, cx = variant ? 4 : 5;
  boneSpikeShape(g, cx, baseY, variant ? 11 : 13, variant ? 0.4 : -0.15);
  // a small second rib for variant
  if (variant) boneSpikeShape(g, cx + 3, baseY, 6, 0.6);
  // socket holes
  P(g, cx, baseY - 4, RAMP.bone[3]); P(g, cx, baseY - 8, RAMP.bone[3]);
  outline(g, RAMP.void); return g;
}

export function drawMireBubble(frame: number): Grid {
  const g = makeGrid(10, 8); const cx = 5, cy = 5; const wa = RAMP.water;
  // flat puddle
  for (let yy = -2; yy <= 2; yy++) for (let xx = -4; xx <= 4; xx++) {
    if ((xx / 4) ** 2 + (yy / 2) ** 2 > 1) continue;
    let c = wa[2];
    if (yy < 0) c = wa[1];
    if (yy <= -1 && xx < 0) c = wa[0];
    P(g, cx + xx, cy + yy, c);
  }
  // bubble swells (frame 0 small, frame 1 big/pop)
  if (frame === 0) { P(g, cx, cy - 1, wa[0]); P(g, cx, cy, wa[1]); }
  else { P(g, cx - 1, cy - 2, wa[0]); P(g, cx, cy - 2, wa[0]); P(g, cx - 1, cy - 1, wa[1]); P(g, cx, cy - 1, wa[1]); P(g, cx + 1, cy - 1, wa[1]); P(g, cx, cy - 3, RAMP.bone[2]); P(g, cx + 2, cy - 2, wa[0]); }
  outline(g, RAMP.void); return g;
}

export function makeWildDoodad(key: WildDoodadKey, v = 0): Grid {
  switch (key) {
    case 'reed_clump':  return drawReedClump(v);
    case 'dead_tree':   return drawDeadTree(v);
    case 'bone_spike':  return drawBoneSpike(v);
    case 'mire_bubble': return drawMireBubble(v);
  }
}

// ── Frontier Expansion: ground accents + doodads (ported from _gen/frontier.js) ──
// Heavier ash / corruption ground-accent tiles (64×36, drawn UNDER entities like
// the threshold accents) + native-size bottom-anchored frontier doodads.

/** ash / corruption ground accent (64×36, 2 variants): keeps only its diamond
 *  edge (no full outline) so it tiles seam-continuous under entities */
export function drawAshGround(variant: number): Grid {
  const g = makeGrid(64, 36); const rows = diamondRows();
  const st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const seed = 801 + variant;
  // dark ashen face (ash + deep-stone dither)
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    let c = ((x + y) % 2 === 0) ? RAMP.ash : st[3];
    if (y > 23) c = RAMP.void;
    P(g, x, y, c);
  }
  // 3px south lip + 1px void north edge
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, RAMP.void);
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }
  }

  if (variant === 0) {
    // ASH DRIFT — pale wind-blown ash piled in streaks, scorch blotches
    for (let i = 0; i < 64; i++) {
      const ax = 8 + Math.floor(hash2(i, 1, seed) * 48), ay = 6 + Math.floor(hash2(i, 2, seed) * 20);
      if (!inDiamond(rows, ax, ay)) continue;
      const a = hash2(i, 3, seed);
      if (a < 0.5) { P(g, ax, ay, bn[3]); if (a < 0.22) { P(g, ax + 1, ay, bn[2]); } }
      else if (a < 0.62) P(g, ax, ay, st[2]);             // grey grit
    }
    // a couple of darker scorch patches
    ([[22, 14], [40, 18]] as [number, number][]).forEach(([bx, by]) => { for (let yy = -3; yy <= 3; yy++) for (let xx = -4; xx <= 4; xx++) { if ((xx / 4) ** 2 + (yy / 3) ** 2 > 1) continue; if (inDiamond(rows, bx + xx, by + yy) && hash2(bx + xx, by + yy, seed + 5) < 0.7) P(g, bx + xx, by + yy, RAMP.void); } });
  } else {
    // CORRUPTION STAIN — drift-purple dither bloom welling from a void core + motes
    const ccx = 32, ccy = 16;
    for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const d = Math.abs(x - ccx) / 2 + Math.abs(y - ccy);     // diamond metric
      const density = Math.max(0, 1 - d / 16);
      const h = hash2(x, y, seed);
      if (d < 3) { if (h < 0.7) P(g, x, y, RAMP.void); }        // dead core
      else if ((x + y) % 2 === 0 && h < density * 0.95) P(g, x, y, dr[3]);
      else if (h < density * 0.28) P(g, x, y, dr[4] || dr[3]);
    }
    // bright drift motes welling up
    ([[26, 12], [36, 18], [30, 20], [40, 10]] as [number, number][]).forEach(([mx, my], i) => { if (!inDiamond(rows, mx, my)) return; P(g, mx, my, i % 2 ? dr[1] : dr[2]); if (i % 2 === 0) P(g, mx, my - 1, dr[2]); });
    // faint purple veins crawling to the rim
    let vx = ccx, vy = ccy;
    for (let k = 0; k < 22; k++) { if (inDiamond(rows, vx, vy)) P(g, vx, vy, dr[2]); vx += (hash2(vx, vy, seed + 9) < 0.5 ? 1 : -1); vy += (hash2(vx, vy, seed + 8) < 0.5 ? 1 : 0); }
  }
  return g;  // ground accent: keep only its diamond edge (no full outline)
}

/** drift-crystal cluster (28×44, 2 variants): shards erupting from a rocky base */
export function drawDriftCrystal(variant: number): Grid {
  const g = makeGrid(28, 44); const dr = RAMP.drift, st = RAMP.stone;
  const cx = 14, baseY = 41;
  // small dark rocky base the shards erupt from
  for (let yy = 0; yy < 5; yy++) for (let xx = -9 + yy; xx <= 9 - yy; xx++) { let c = st[2]; if (xx < -7 + yy) c = st[1]; if (xx > 7 - yy) c = st[3]; P(g, cx + xx, baseY - yy, c); }
  // a single drift shard (tapered crystal) leaning by `lean`
  function shard(sx: number, sy: number, h: number, lean: number, thick: number) {
    for (let k = 0; k < h; k++) {
      const t = k / h, w = Math.max(0, Math.round((1 - t) * thick));
      const x = sx + Math.round(lean * t * 4);
      for (let i = -w; i <= w; i++) {
        let c = dr[2]; if (i < 0) c = dr[1]; if (i > 0) c = dr[3]; if (i === 0 && k < h * 0.7) c = dr[0];
        P(g, x + i, sy - k, c);
      }
    }
    P(g, sx + Math.round(lean * 4), sy - h, dr[0]);     // bright tip
  }
  // cluster layout per variant
  if (variant === 0) {                                  // upright tall cluster
    shard(cx, baseY - 2, 34, 0.1, 3);
    shard(cx - 6, baseY - 1, 20, -0.5, 2);
    shard(cx + 6, baseY - 1, 24, 0.5, 2);
    shard(cx - 2, baseY, 12, -0.2, 1);
  } else {                                              // wider, splayed cluster
    shard(cx - 2, baseY - 1, 26, -0.3, 3);
    shard(cx + 4, baseY - 2, 30, 0.4, 2);
    shard(cx - 8, baseY, 16, -0.7, 2);
    shard(cx + 9, baseY, 14, 0.8, 1);
    shard(cx + 1, baseY, 10, 0.1, 1);
  }
  // faint glow halo (dither)
  for (let yy = -2; yy <= 6; yy++) for (let xx = -11; xx <= 11; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 8 && d < 12 && (xx + yy) % 2 === 0 && !G(g, cx + xx, baseY - 18 + yy)) P(g, cx + xx, baseY - 18 + yy, dr[3]); }
  outline(g, RAMP.void); return g;
}

/** low wind-blown ash dune tuft (26×16, 2 variants) */
export function drawAshDune(variant: number): Grid {
  const g = makeGrid(26, 16); const dt = RAMP.dirt, bn = RAMP.bone;
  const cx = 13, baseY = 14;
  // a low wind-blown ash mound (asymmetric, tail to the right)
  const peak = variant ? 7 : 6;
  for (let xx = -12; xx <= 12; xx++) {
    const t = (xx + 12) / 24;
    // asymmetric profile: steep left face, long drift tail right
    const h = Math.round(peak * Math.exp(-Math.pow((xx + (variant ? -2 : 2)) / 7, 2)) * (1 + 0.3 * (xx > 0 ? (1 - t) : 0)));
    for (let k = 0; k < h; k++) {
      let c = dt[2]; if (k > h - 2) c = bn[3]; if (xx < -peak + 2) c = dt[1]; if (xx > peak) c = RAMP.ash;
      P(g, cx + xx, baseY - k, c);
    }
    // pale ash crest streaks
    if (h > 1 && hash2(cx + xx, h, 821 + variant) < 0.5) P(g, cx + xx, baseY - h, bn[2]);
  }
  // wind-blown ash flecks trailing off the tail
  for (let i = 0; i < 4; i++) { const fx = cx + 8 + i * 2, fy = baseY - 4 - Math.floor(hash2(i, 1, 822 + variant) * 3); P(g, fx, fy, bn[3]); }
  // a dead reed or bone shard poking out (variant differs)
  if (variant === 0) { for (let k = 0; k < 6; k++) P(g, cx - 3, baseY - peak - k, bn[2]); P(g, cx - 3, baseY - peak - 6, bn[1]); }
  else { for (let k = 0; k < 5; k++) P(g, cx + 1, baseY - peak - k, RAMP.grass[2]); P(g, cx + 1, baseY - peak - 5, RAMP.grass[0]); }
  outline(g, RAMP.void); return g;
}

/** burnt broken trunk with smouldering embers (24×22, 2 variants) */
export function drawScorchedStump(variant: number): Grid {
  const g = makeGrid(24, 22); const dt = RAMP.dirt, em = RAMP.ember;
  const cx = 12, baseY = 20;
  // burnt broken trunk — charred dark wood, jagged snapped top
  const hgt = variant ? 13 : 10, rad = variant ? 4 : 5;
  const topProfile = [hgt, hgt - 2, hgt + 1, hgt - 3, hgt, hgt - 1];
  for (let x = -rad; x <= rad; x++) {
    const col = x + rad, top = topProfile[Math.min(topProfile.length - 1, Math.floor((col / (rad * 2)) * (topProfile.length - 1)))];
    for (let y = 0; y < top; y++) {
      let c = dt[3]; if (x < -rad + 1) c = dt[2]; if (x > rad - 1) c = RAMP.void;
      if (y > top - 3) c = RAMP.void;                       // charred black crown
      if (hash2(cx + x, y, 831 + variant) < 0.10) c = RAMP.ash;
      P(g, cx + x, baseY - y, c);
    }
    // ember glow smouldering in the cracks of the crown
    if (x % 2 === 0 && Math.abs(x) < rad) { P(g, cx + x, baseY - top + 2, em[2]); if (Math.abs(x) < 2) P(g, cx + x, baseY - top + 3, em[1]); }
  }
  // exposed charred roots flaring at the base
  for (const dir of [-1, 1]) for (let k = 0; k < 4; k++) P(g, cx + dir * (rad + k), baseY - Math.floor(k / 2), k > 1 ? dt[3] : dt[2]);
  // a broken branch stub (variant 1) or an ember spark drifting up (variant 0)
  if (variant === 1) { for (let k = 0; k < 5; k++) P(g, cx + rad - 1 + k, baseY - hgt + 4 - Math.floor(k * 0.6), dt[3]); }
  else { P(g, cx + 1, baseY - hgt - 2, em[1]); P(g, cx, baseY - hgt - 4, em[2]); }
  // faint rising ash/ember glow
  for (let yy = -2; yy <= 1; yy++) for (let xx = -4; xx <= 4; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 3 && d < 5 && (xx + yy) % 2 === 0) P(g, cx + xx, baseY - hgt + yy, em[2]); }
  outline(g, RAMP.void); return g;
}

/** frontier standing doodads (drift_crystal / ash_dune / scorched_stump) */
export type FrontierDoodadKey = 'drift_crystal' | 'ash_dune' | 'scorched_stump';
export function makeFrontierDoodad(key: FrontierDoodadKey, v = 0): Grid {
  switch (key) {
    case 'drift_crystal':  return drawDriftCrystal(v);
    case 'ash_dune':       return drawAshDune(v);
    case 'scorched_stump': return drawScorchedStump(v);
  }
}
export const ASH_GROUND_VARIANTS = 2;

/** the Mirewife's drying rack (interior fixture, 24×30) */
export function drawHerbRack(): Grid {
  const g = makeGrid(24, 30); const baseY = 27, x0 = 2, top = 6; const dr = RAMP.dirt;
  // timber rack frame
  for (let i = 0; i <= 20; i++) { P(g, x0 + i, top, dr[1]); P(g, x0 + i, top + 1, dr[3]); } // top rail
  P(g, x0, top, dr[0]); P(g, x0 + 20, top, dr[2]);
  for (let j = top; j < baseY; j++) { P(g, x0, j, dr[2]); P(g, x0 + 20, j, dr[3]); } // posts
  // hanging dried herb bundles + charms
  const items: [number, readonly string[]][] = [
    [3, RAMP.grass], [7, RAMP.grass], [11, RAMP.ember], [15, RAMP.drift], [18, RAMP.grass],
  ];
  items.forEach(([ix, col], i) => {
    const hx = x0 + ix, hy = top + 2;
    for (let k = 0; k < 3; k++) P(g, hx, hy + k, RAMP.bone[3]); // string
    const by = hy + 3, h = 8 + (i % 3) * 2;
    if (i === 3) { // drift charm
      P(g, hx, by + 2, RAMP.drift[1]); P(g, hx - 1, by + 3, RAMP.drift[2]); P(g, hx + 1, by + 3, RAMP.drift[2]); P(g, hx, by + 4, RAMP.drift[2]);
    } else {
      for (let k = 0; k < h; k++) {
        const t = k / h, w = Math.round(1 + t * 1.5);
        for (let m = -w; m <= w; m++) P(g, hx + m, by + k, m < 0 ? col[1] : m > 0 ? col[3] : col[2]);
      }
      P(g, hx, by + h, col[3]); // tied tip
    }
  });
  outline(g, RAMP.void); return g;
}

/** plain timber NW wall strung with bone charms (DS export parity; the flat
 *  v1 wall set is dead art — never place this along iso diagonals) */
export function drawWallTimberCharms(): Grid {
  const g = makeWallSegment('nw', 'timber', 'plain', {});
  const bn = RAMP.bone, dr = RAMP.drift;
  // a sagging string across the face
  const y0 = 22;
  for (let x = 2; x < 62; x++) { const sag = Math.round(Math.sin((x / 64) * Math.PI) * 4); P(g, x, y0 + sag, bn[3]); }
  // dangling charms
  for (let s = 0; s < 6; s++) {
    const hx = 6 + s * 10, sag = Math.round(Math.sin((hx / 64) * Math.PI) * 4), hy = y0 + sag;
    for (let k = 1; k < 4 + (s % 3); k++) P(g, hx, hy + k, bn[3]);
    const cy = hy + 4 + (s % 3);
    if (s % 3 === 0) { fillRect(g, hx - 1, cy, 3, 3, bn[1]); P(g, hx - 1, cy + 1, RAMP.void); P(g, hx + 1, cy + 1, RAMP.void); } // skull
    else if (s % 3 === 1) { for (let k = 0; k < 4; k++) P(g, hx, cy + k, bn[2]); P(g, hx - 1, cy + 2, bn[1]); } // bone shard
    else { P(g, hx, cy, dr[1]); P(g, hx - 1, cy + 1, dr[2]); P(g, hx + 1, cy + 1, dr[2]); P(g, hx, cy + 2, dr[2]); } // drift charm
  }
  outline(g, RAMP.void); return g;
}

/** a grave slab: rich (gold glint at the base) or sunken (16×20) */
export function drawLostTombstone(sunken: boolean): Grid {
  const g = makeGrid(16, 20); const bn = RAMP.bone; const cx = 8, baseY = 18;
  // mound of soil
  for (let xx = -7; xx <= 7; xx++) {
    const t = 1 - Math.abs(xx) / 7; const h = Math.round(t * 3);
    for (let k = 0; k < h; k++) P(g, cx + xx, baseY - k, RAMP.dirt[2]);
    P(g, cx + xx, baseY - h, RAMP.dirt[3]);
  }
  const lean = sunken ? 0.5 : 0.18;
  const topY = sunken ? 9 : 2, botY = baseY - 2;
  // stone slab (leaning)
  for (let y = botY; y >= topY; y--) {
    const w = 4;
    const sx = cx + Math.round(lean * (y - botY) * -1); // lean
    for (let i = -w; i <= w; i++) {
      if (y < topY + 4) { // rounded top
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
  P(g, msx, topY + 6, bn[3]); P(g, msx, topY + 7, bn[3]); P(g, msx, topY + 8, bn[3]); P(g, msx - 1, topY + 7, bn[3]); P(g, msx + 1, topY + 7, bn[3]);
  // faint gold glint at the base (only non-sunken)
  if (!sunken) { P(g, cx + 4, baseY - 1, RAMP.gold[1]); P(g, cx + 4, baseY - 2, RAMP.gold[0]); P(g, cx + 5, baseY - 1, RAMP.gold[2]); }
  outline(g, RAMP.void); return g;
}

export const SHRINE_FRAMES = 3;
export const HUSKDEN_FRAMES = 2;
export const OBELISK_FRAMES = 3;
export const WAYSTATION_FRAMES = 4; // 0 = sealed, 1-3 = active rune-pulse

// ── Frontier Expansion: the Waystation fast-travel monolith (ported from the
//    expansion _gen/waystation.js — a rune-arch gateway on a dirt apron) ──
function drawWaystation(active: boolean, frame: number): Grid {
  frame = frame || 0;
  const g = makeGrid(64, 112);
  const st = RAMP.stone, dr = RAMP.drift;
  const cx = 32, baseY = 104;

  // dirt apron (packed earth + ash drifts) — no grass
  foundation(g, cx, baseY + 2, 27, { ash: true });

  // active ground glow on the apron (dithered drift, pulses)
  if (active) {
    const reach = [6, 8, 7][frame];
    for (let dy = -4; dy <= 6; dy++) for (let dx = -24; dx <= 24; dx++) {
      if ((dx / 24) ** 2 + (dy / 7) ** 2 > 1) continue;
      const d = Math.abs(dx) / 3 + Math.abs(dy);
      if ((dx + dy + frame) % 2 === 0 && d > 4 && d < reach + 14 && hash2(dx, dy, 501) < 0.4)
        P(g, cx + dx, baseY + 4 + dy, dr[3]);
    }
  }

  // two leaning standing stones
  const postBot = baseY, postTop = 34;
  const stone = (side: number) => {
    for (let y = postBot; y >= postTop; y--) {
      const t = (postBot - y) / (postBot - postTop);
      const cxp = cx + side * (16 - Math.round(t * 4));
      const hw = Math.round(6 - t * 1.2);
      for (let x = -hw; x <= hw; x++) {
        const sx = cxp + x;
        let c = side < 0 ? st[1] : st[2];
        if (x < -hw + 2) c = side < 0 ? st[0] : st[1];
        else if (x > hw - 2) c = st[3];
        if (hash2(sx, y, 502) < 0.06) c = st[2];
        if (hash2(sx, y, 503) < 0.02) c = st[3];
        P(g, sx, y, c);
      }
    }
    const rng = mulberry(504 + side);
    for (let i = 0; i < 5; i++) {
      const y = postTop + 6 + Math.floor(rng() * (postBot - postTop - 12));
      const t = (postBot - y) / (postBot - postTop);
      const cxp = cx + side * (16 - Math.round(t * 4));
      const hw = Math.round(6 - t * 1.2);
      P(g, cxp + side * hw, y, RAMP.void);
      P(g, cxp + side * (hw - 1), y, st[3]);
    }
  };
  stone(-1); stone(1);

  // the arch (semicircle band spanning the post tops)
  const archCx = cx, archCy = postTop + 4, archR = 21, band = 8;
  tDisc(g, archCx, archCy, archR, (x, y, d) => {
    if (y > archCy) return;
    if (d > archR || d < archR - band) return;
    let c = (x < archCx) ? st[1] : st[2];
    const edge = d > archR - 1.4 || d < archR - band + 1.4;
    if (edge) c = st[3];
    else if (hash2(x, y, 505) < 0.07) c = st[2];
    if (x < archCx - archR + 4) c = st[0];
    P(g, x, y, c);
  });
  for (let dd = 1; dd <= 4; dd++) tDisc(g, archCx, archCy, archR, (x, y, d) => {
    if (y > archCy) return; if (d > archR || d < archR - band) return; if (x < archCx + 6) return;
    P(g, x + dd, y - Math.floor(dd / 2), st[3]);
  });

  // keystone block at the crown, carrying the gate sigil
  const ksY = archCy - archR - 1;
  for (let j = 0; j < 12; j++) for (let i = -7; i <= 7; i++) {
    const t = Math.abs(i) / 7;
    if (j < 2 && t > 0.6) continue;
    let c = i < 0 ? st[1] : st[2];
    if (i < -5) c = st[0]; if (i > 5) c = st[3];
    if (j === 0) c = st[0];
    if (hash2(cx + i, ksY + j, 506) < 0.08) c = st[2];
    P(g, cx + i, ksY + j, c);
  }
  gateSigil(g, cx, ksY + 6, 5, active);

  // drift-crystal shard crown above the keystone
  const cty = ksY - 1;
  for (let k = 0; k < 9; k++) {
    const w = Math.max(0, Math.round((1 - k / 9) * 3));
    for (let i = -w; i <= w; i++) {
      let c = dr[2]; if (i < 0) c = dr[1]; if (i > 0) c = dr[3]; if (i === 0 && k < 6) c = dr[0];
      P(g, cx + i, cty - k, c);
    }
  }
  P(g, cx, cty - 9, dr[0]);
  if (active) {
    const rr = [6, 8, 7][frame];
    for (let yy = -8; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) {
      const d = Math.abs(xx) + Math.abs(yy);
      if (d > 4 && d < rr && (xx + yy + frame) % 2 === 0) P(g, cx + xx, cty - 4 + yy, dr[2]);
    }
  }

  // the portal opening (between posts, under the arch)
  const pl = cx - 9, pr = cx + 9, ptop = archCy, pbot = baseY - 2;
  for (let y = ptop; y <= pbot; y++) for (let x = pl; x <= pr; x++) {
    const underArch = (x - archCx) ** 2 + (y - archCy) ** 2 <= (archR - band) ** 2 || y >= archCy;
    if (!underArch) continue;
    if (active) {
      const t = (y - ptop) / (pbot - ptop);
      let c = dr[4] || dr[3];
      if ((x + y) % 2 === 0) c = t < 0.5 ? dr[3] : (dr[4] || dr[3]);
      if (Math.abs(x - cx) < 6 && hash2(x, y + frame, 507) < 0.20) c = dr[2];
      if (Math.abs(x - cx) < 3 && hash2(x, y - frame * 2, 508) < 0.14) c = dr[1];
      P(g, x, y, c);
    } else {
      let c: string = RAMP.void;
      if (x === cx && (y % 3 !== 0)) c = dr[3];
      if (x === cx && y % 6 === 0) c = dr[2];
      P(g, x, y, c);
    }
  }

  // carved runes down the inner faces of the posts (pulse when active)
  const lit = active ? [dr[2], dr[1], dr[0]][frame] : dr[3];
  const dim = active ? [dr[3], dr[2], dr[1]][frame] : '#3b1162';
  const runeYs = [pbot - 12, pbot - 28, pbot - 44, pbot - 58];
  runeYs.forEach((ry, i) => {
    if (ry < ptop + 2) return;
    ([[pl - 1, 1], [pr + 1, -1]] as const).forEach(([rx, dir]) => {
      const on = active ? ((frame + i) % 3) !== 2 : false;
      const col = on ? lit : dim;
      P(g, rx, ry, col); P(g, rx + dir, ry, col);
      P(g, rx, ry + 1, col); P(g, rx, ry - 1, on ? dim : '#3b1162');
    });
  });

  // active: rising column of dithered drift light up the gateway
  if (active) {
    const H = [16, 26, 12][frame];
    for (let k = 0; k < H; k++) {
      const y = pbot - 6 - k, t = k / H;
      const w = Math.max(1, Math.round((1 - t) * 4));
      for (let x = -w; x <= w; x++) {
        const ax = cx + x, core = Math.abs(x) <= 1;
        if (y < ptop - 10) continue;
        if (core) { if (G(g, ax, y) || y < ptop) P(g, ax, y, t < 0.3 ? dr[0] : dr[1]); }
        else if ((ax + y + frame) % 2 === 0 && hash2(ax, y, 509) < (1 - t) * 0.8) P(g, ax, y, dr[2]);
      }
    }
    const mr = mulberry(510 + frame);
    for (let i = 0; i < 5; i++) {
      const mx = cx + Math.round((mr() - 0.5) * 16);
      const my = ptop + Math.round(mr() * (pbot - ptop)) - frame * 2;
      if (my > ptop - 12) P(g, mx, my, mr() < 0.4 ? dr[0] : dr[1]);
    }
    for (let x = pl; x <= pr; x++) if ((x + frame) % 3 === 0) P(g, x, pbot + 1, dr[2]);
  }

  outline(g, RAMP.void);
  return g;
}

/** the Waystation as a 4-frame building sheet (0 sealed, 1-3 active pulse) */
export function makeWaystation(i: number): Grid {
  return i === 0 ? drawWaystation(false, 0) : drawWaystation(true, i - 1);
}

export const CAMP_FRAMES = 2; // each camp has a subtle 2-frame idle

// ── Frontier Expansion: wild camps / mini-dungeons (ported from _gen/camps.js) ──
function drawDrownedRuins(frame: number): Grid {
  frame = frame || 0;
  const g = makeGrid(120, 96);
  const wa = RAMP.water, st = RAMP.stone, bn = RAMP.bone;
  const cx = 60, baseY = 88;
  for (let dy = -18; dy <= 18; dy++) for (let dx = -58; dx <= 58; dx++) {
    const e = (dx / 58) ** 2 + (dy / 18) ** 2;
    if (e > 1) continue;
    const h = hash2(cx + dx, baseY + dy, 601);
    let c: string;
    if (e > 0.86) { c = RAMP.dirt[2]; if (h < 0.3) c = RAMP.dirt[3]; }
    else { c = wa[2]; if (dy < -2) c = wa[1]; if (h < 0.10) c = wa[1]; if (h > 0.94) c = wa[3]; }
    P(g, cx + dx, baseY + dy, c);
  }
  for (let i = 0; i < 10; i++) {
    const rx = cx - 48 + Math.floor(hash2(i, 1, 602) * 96);
    const ry = baseY + Math.floor((hash2(i, 2, 602) - 0.5) * 30);
    if ((rx - cx) ** 2 / 58 ** 2 + (ry - baseY) ** 2 / 18 ** 2 > 0.95) continue;
    for (let k = 0; k < 4; k++) P(g, rx, ry - k, RAMP.grass[k > 2 ? 2 : 1]);
    P(g, rx, ry - 4, bn[2]);
  }
  const arch = (acx: number, springY: number, R: number, band: number, breakAt: number) => {
    for (const side of [-1, 1]) {
      const lx = acx + side * R;
      for (let y = springY; y <= baseY + 4; y++) {
        const sub = y > baseY - 6;
        for (let x = -3; x <= 3; x++) {
          let c = side < 0 ? st[0] : st[2];
          if (x > 1) c = st[3];
          if (sub) c = (hash2(lx + x, y, 603) < 0.4) ? RAMP.grass[3] : st[3];
          P(g, lx + x, y, c);
        }
      }
    }
    tDisc(g, acx, springY, R + 3, (x, y, d) => {
      if (y > springY) return;
      if (d > R + 3 || d < R - band) return;
      if (breakAt < 0 && x < acx - R * 0.3 && y < springY - R * 0.4) return;
      if (breakAt > 0 && x > acx + R * 0.3 && y < springY - R * 0.4) return;
      let c = (x < acx) ? st[0] : st[1];
      const edge = d > R + 2 || d < R - band + 1.3;
      if (edge) c = st[3];
      else if (hash2(x, y, 604) < 0.10) c = bn[2];
      P(g, x, y, c);
    });
    for (let s = 0; s < 3; s++) {
      const dx2 = acx - R + 2 + s * R;
      for (let k = 0; k < 5; k++) P(g, dx2, springY + 1 + k, RAMP.grass[3]);
    }
  };
  arch(cx - 30, baseY - 30, 16, 6, +1);
  arch(cx + 26, baseY - 36, 19, 7, -1);
  for (let j = 0; j < 6; j++) for (let i = 0; i < 16; i++) {
    let c = st[1]; if (i < 2) c = st[0]; if (i > 13) c = st[3]; if (j > 3) c = st[3];
    P(g, cx - 52 + i, baseY - 4 - j + Math.round(i * 0.25), c);
  }
  const DX = [0, 1], DY = [0, -1];
  const specs = [[cx - 18, baseY + 4], [cx + 4, baseY - 2], [cx + 30, baseY + 6], [cx - 40, baseY + 8], [cx + 16, baseY + 10]];
  specs.forEach((s, i) => {
    const sx = s[0] + DX[(frame + i) % 2], sy = s[1] + DY[(frame + i) % 2];
    if ((sx - cx) ** 2 / 58 ** 2 + (sy - baseY) ** 2 / 18 ** 2 <= 0.84) { P(g, sx, sy, wa[0]); P(g, sx + 1, sy, wa[0]); }
  });
  if (frame === 1) { P(g, cx - 6, baseY + 2, wa[0]); P(g, cx - 6, baseY + 1, bn[2]); }
  outline(g, RAMP.void);
  return g;
}

function drawBarrowCrypt(frame: number): Grid {
  frame = frame || 0;
  const g = makeGrid(116, 100);
  const gr = RAMP.grass, dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const cx = 58, baseY = 92;
  foundation(g, cx, baseY + 4, 52, { ash: false });
  const maxH = 50;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(54 * Math.pow(1 - Math.pow(t, 2.4), 0.5));
    hw += Math.round((hash2(yy, 0, 611) - 0.5) * 5);
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 612);
      let c = gr[1];
      if (xx < -hw + 6) c = gr[0];
      else if (xx > hw - 6) c = gr[3];
      else if (h < 0.10) c = gr[2];
      else if (h < 0.13) c = gr[0];
      if (h > 0.95) c = dt[2];
      if (yy < 8 && h < 0.35) c = dt[2];
      P(g, cx + xx, top, c);
    }
  }
  for (let i = 0; i < 10; i++) {
    const tx = cx - 30 + Math.floor(hash2(i, 1, 613) * 60);
    const ty = baseY - maxH + 2 + Math.floor(hash2(i, 2, 613) * 8);
    for (let k = 0; k < 3; k++) P(g, tx, ty - k, gr[k > 1 ? 0 : 2]);
  }
  const dw = 22, dh = 30, dtop = baseY - dh;
  for (const side of [-1, 1]) {
    const jx = cx + side * (dw / 2 + 2);
    for (let y = dtop - 2; y <= baseY; y++) for (let x = -3; x <= 3; x++) {
      let c = side < 0 ? st[0] : st[2]; if (x > 1) c = st[3];
      if (hash2(jx + x, y, 614) < 0.08) c = st[2];
      P(g, jx + x, y, c);
    }
  }
  for (let j = 0; j < 5; j++) for (let i = -dw / 2 - 5; i <= dw / 2 + 5; i++) {
    let c = i < 0 ? st[1] : st[2]; if (i < -dw / 2 - 2) c = st[0]; if (i > dw / 2 + 2) c = st[3];
    P(g, cx + i, dtop - 2 - j, c);
  }
  for (let j = 0; j < dh; j++) for (let i = -dw / 2 + 1; i <= dw / 2 - 1; i++) {
    const t = Math.abs(i) / (dw / 2);
    if (j < dh * 0.18 * t) continue;
    P(g, cx + i, baseY - j, RAMP.void);
  }
  const bright = frame === 1;
  const gy = baseY - 10;
  ([[-3, bright ? dr[1] : dr[3]], [3, bright ? dr[2] : dr[3]], [0, bright ? dr[0] : dr[2]]] as Array<[number, string]>).forEach(([ox, c]) => {
    P(g, cx + ox, gy, c); P(g, cx + ox, gy + 1, bright ? dr[2] : dr[3]);
    if (bright) { P(g, cx + ox, gy - 1, dr[2]); }
  });
  if (bright) for (let x = -dw / 2 + 2; x <= dw / 2 - 2; x++) if ((cx + x) % 2 === 0) P(g, cx + x, baseY + 1, dr[3]);
  ([[-44, 7, -0.5], [44, 7, 0.5], [-30, 5, -0.2], [32, 6, 0.3]] as Array<[number, number, number]>).forEach(([ox, h, ln]) => boneSpikeShape(g, cx + ox, baseY + 1, h + 4, ln));
  const rng = mulberry(615);
  for (let i = 0; i < 4; i++) {
    const kx = cx - 40 + Math.floor(rng() * 80), ky = baseY + 1 + Math.floor(rng() * 4);
    if (Math.abs(kx - cx) < dw / 2 + 6) continue;
    fillRect(g, kx, ky - 2, 4, 3, bn[1]); P(g, kx + 1, ky - 1, RAMP.void); P(g, kx + 3, ky - 1, RAMP.void); P(g, kx + 1, ky + 1, bn[2]);
  }
  for (let k = 0; k < 10; k++) P(g, cx - 14 + Math.round(k * 0.2), baseY - maxH + 6 - k, bn[2]);
  P(g, cx - 12, baseY - maxH - 4, bn[1]); P(g, cx - 13, baseY - maxH - 3, bn[1]); P(g, cx - 11, baseY - maxH - 3, bn[1]);
  outline(g, RAMP.void);
  return g;
}

function drawAshenWarcamp(frame: number): Grid {
  frame = frame || 0;
  const g = makeGrid(120, 104);
  const dt = RAMP.dirt, bl = RAMP.blood, bn = RAMP.bone, em = RAMP.ember;
  const cx = 60, baseY = 96;
  for (let dy = -16; dy <= 16; dy++) for (let dx = -56; dx <= 56; dx++) {
    if ((dx / 56) ** 2 + (dy / 16) ** 2 > 1) continue;
    const h = hash2(cx + dx, baseY + dy, 621);
    let c = dt[2];
    if (h < 0.16) c = RAMP.ash; else if (h < 0.22) c = dt[3];
    if (dy < -4 && dx < 0) c = dt[1];
    P(g, cx + dx, baseY + dy, c);
  }
  const stakes = 13;
  for (let i = 0; i < stakes; i++) {
    const t = i / (stakes - 1);
    const sx = cx - 46 + Math.round(t * 92);
    const sy = baseY - 30 - Math.round(Math.sin(t * Math.PI) * 8);
    const h = 22 + Math.floor(hash2(i, 1, 622) * 6);
    const lean = Math.round((hash2(i, 2, 622) - 0.5) * 2);
    for (let k = 0; k < h; k++) {
      const px = sx + Math.round(lean * (k / h));
      let c = dt[1]; if (i % 2) c = dt[2];
      if (k < 3) c = dt[3];
      P(g, px, sy - k, c); P(g, px + 1, sy - k, dt[3]);
    }
    P(g, sx + lean, sy - h, dt[3]); P(g, sx + lean, sy - h + 1, dt[2]);
  }
  for (let x = cx - 44; x <= cx + 44; x++) { const t = (x - (cx - 44)) / 88; const ry = baseY - 30 - Math.round(Math.sin(t * Math.PI) * 8) - 12; P(g, x, ry, bn[3]); }
  fillRect(g, cx - 2, baseY - 58, 5, 4, bn[1]); P(g, cx - 1, baseY - 57, RAMP.void); P(g, cx + 1, baseY - 57, RAMP.void); P(g, cx, baseY - 55, bn[2]);
  const tent = (tx: number, by: number, w: number, hgt: number, ramp: string[]) => {
    for (let row = 0; row <= hgt; row++) {
      const t = row / hgt, hw = Math.round((w / 2) * t);
      const sy = by - hgt + row;
      for (let x = -hw; x <= hw; x++) {
        let c = ramp[1]; if (x < -hw + 2) c = ramp[0]; if (x > hw - 2) c = ramp[2];
        if ((x - row) % 6 === 0) c = ramp[3];
        if (hash2(tx + x, sy, 623) < 0.05) c = ramp[3];
        P(g, tx + x, sy, c);
      }
      if (row === hgt) for (let x = -hw; x <= hw; x++) if (x % 2 === 0) P(g, tx + x, sy, ramp[3]);
    }
    for (let k = 0; k < 6; k++) P(g, tx, by - hgt - k, dt[3]);
    P(g, tx - 2, by - hgt - 4, dt[3]); P(g, tx + 2, by - hgt - 5, dt[3]);
    const eh = Math.round(hgt * 0.55);
    for (let j = 0; j < eh; j++) { const ew = Math.round((1 - j / eh) * 4); for (let i = -ew; i <= ew; i++) P(g, tx + i, by - j, RAMP.void); }
    for (let j = 0; j < eh; j++) { const ew = Math.round((1 - j / eh) * 4); P(g, tx - ew - 1, by - j, ramp[0]); P(g, tx + ew + 1, by - j, ramp[2]); }
    for (let k = 0; k < 4; k++) { P(g, tx - Math.round(w / 2) - 1 - k, by - 2 + k, dt[3]); P(g, tx + Math.round(w / 2) + 1 + k, by - 2 + k, dt[3]); }
  };
  tent(cx - 30, baseY, 34, 30, dt);
  tent(cx + 26, baseY - 2, 28, 26, bl);
  const bx = cx + 46, byTop = baseY - 54;
  for (let y = byTop; y <= baseY; y++) P(g, bx, y, dt[3]);
  P(g, bx, byTop - 1, bn[1]); P(g, bx - 1, byTop - 2, bn[2]); P(g, bx + 1, byTop - 2, bn[2]);
  const flutter = frame === 1 ? 1 : 0;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 14; i++) {
    const wob = Math.round(Math.sin(j * 0.4 + frame) * 1.3) + (i > 9 ? flutter : 0);
    let c = bl[2]; if (i === 0) c = bl[1]; if (i >= 12) c = bl[3];
    if (i > 9 + flutter && j > 16) continue;
    P(g, bx - 1 - i + wob, byTop + 2 + j, c);
  }
  fillRect(g, bx - 7, byTop + 9, 3, 4, bn[1]); P(g, bx - 6, byTop + 10, RAMP.void); P(g, bx - 8, byTop + 13, bn[2]); P(g, bx - 4, byTop + 13, bn[2]);
  const fxp = cx - 4, fy = baseY - 2;
  for (let i = -6; i <= 6; i++) P(g, fxp + i, fy, dt[3]);
  P(g, fxp - 4, fy - 1, dt[2]); P(g, fxp + 4, fy - 1, dt[2]);
  const sway = [0, 1][frame], tall = [0, 2][frame];
  for (let yy = 0; yy <= 11 + tall; yy++) {
    const t = yy / (11 + tall), hw = Math.round((1 - t) * 5);
    const sxf = fxp + Math.round(Math.sin(yy * 0.6 + frame) * 1.1) + Math.round(sway * t);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = em[1]; if (Math.abs(xx) >= hw - 1) c = em[2]; if (yy < 4 && Math.abs(xx) < 2) c = em[0];
      P(g, sxf + xx, fy - 2 - yy, c);
    }
  }
  for (let yy = 2; yy <= 6 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (7 + tall)) * 2)); for (let xx = -hw; xx <= hw; xx++) P(g, fxp + xx, fy - 4 - yy, RAMP.gold[0]); }
  if (frame === 1) P(g, fxp + sway, fy - 15 - tall, em[0]);
  const rr = frame === 1 ? 11 : 9;
  for (let yy = -9; yy <= 3; yy++) for (let xx = -12; xx <= 12; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 6 && d < rr && (xx + yy + frame) % 2 === 0) P(g, fxp + xx, fy - 5 + yy, em[2]); }
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { let c = dt[1]; if (i === 0) c = dt[0]; if (i === 7) c = dt[2]; if (i === 0 || i === 7 || j === 0 || j === 7) c = dt[3]; if (i === j || i === 7 - j) c = dt[2]; P(g, cx + 16 + i, baseY - 8 + j, c); }
  outline(g, RAMP.void);
  return g;
}

export function makeDrownedRuins(f: number): Grid { return drawDrownedRuins(f % CAMP_FRAMES); }
export function makeBarrowCrypt(f: number): Grid { return drawBarrowCrypt(f % CAMP_FRAMES); }
export function makeAshenWarcamp(f: number): Grid { return drawAshenWarcamp(f % CAMP_FRAMES); }

// ── Frontier Expansion: the Outpost (second hub) buildings (ported from
//    _gen/outpost.js — town.js helper vocabulary; `smoke` == chimneySmoke) ──
export function drawPalisadeGate(): Grid {
  const g = makeGrid(144, 128); const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, bn = RAMP.bone;
  const cx = 72, baseY = 112;
  foundation(g, cx, baseY + 8, 60, { ash: true });

  function stakeRun(x0: number, x1: number, topBase: number) {
    for (let sx = x0; sx <= x1; sx += 5) {
      const h = topBase + Math.floor(hash2(sx, 1, 701) * 5);
      for (let k = 0; k < h; k++) { let c = (sx / 5 % 2 < 1) ? dt[1] : dt[2]; if (k < 3) c = dt[3]; P(g, sx, baseY - k, c); P(g, sx + 1, baseY - k, dt[3]); P(g, sx + 2, baseY - k, dt[2]); }
      P(g, sx, baseY - h, dt[3]); P(g, sx + 1, baseY - h, dt[3]);
    }
  }
  stakeRun(8, 30, 38);
  stakeRun(114, 136, 38);

  function tower(tx: number) {
    const w = 22, h = 64, x0 = tx - w / 2, ytop = baseY - h;
    for (let y = ytop; y <= baseY; y++) for (let x = x0; x <= x0 + w; x++) {
      let c = dt[1]; if (x <= x0 + 1) c = dt[0]; if (x >= x0 + w - 1) c = dt[2];
      const r = (y - ytop) % 5; if (r === 0) c = dt[3]; else if (r === 1) c = dt[0];
      if (hash2(x, y, 702) < 0.05) c = dt[2];
      P(g, x, y, c);
    }
    for (let d = 1; d <= 10; d++) for (let y = ytop; y <= baseY; y++) P(g, x0 + w + d, y - Math.floor(d / 2), d >= 9 ? dt[3] : dt[2]);
    for (let x = x0 - 2; x <= x0 + w + 2; x += 4) for (let k = 0; k < 6; k++) { P(g, x, ytop - 1 - k, dt[3]); P(g, x + 1, ytop - 1 - k, dt[2]); }
    for (let x = x0 - 2; x <= x0 + w + 2; x++) P(g, x, ytop, dt[3]);
    return { x0, ytop, w };
  }
  const lt = tower(cx - 30), rt = tower(cx + 30);

  for (let j = 0; j < 7; j++) for (let x = lt.x0 + lt.w; x <= rt.x0; x++) {
    let c = dt[1]; if (j === 0) c = dt[0]; if (j > 4) c = dt[3];
    if ((x % 6) === 0) c = dt[3];
    P(g, x, baseY - 60 + j, c);
  }
  const gl = lt.x0 + lt.w + 2, gr = rt.x0 - 2, gtop = baseY - 53;
  for (let y = gtop; y <= baseY; y++) for (let x = gl; x <= gr; x++) {
    let c = dt[2]; if ((x - gl) % 2 === 0) c = dt[3];
    if (x === Math.round((gl + gr) / 2) || x === Math.round((gl + gr) / 2) + 1) c = RAMP.void;
    if (x <= gl + 1) c = dt[1]; if (x >= gr - 1) c = dt[3];
    P(g, x, y, c);
  }
  for (const sy of [gtop + 6, gtop + 24, baseY - 8]) { for (let x = gl; x <= gr; x++) P(g, x, sy, st[3]); for (let x = gl + 2; x <= gr - 2; x += 6) { P(g, x, sy - 1, st[2]); } }
  P(g, Math.round((gl + gr) / 2) - 5, baseY - 28, st[2]); P(g, Math.round((gl + gr) / 2) + 6, baseY - 28, st[2]);
  fillRect(g, cx - 2, baseY - 64, 5, 4, bn[1]); P(g, cx - 1, baseY - 63, RAMP.void); P(g, cx + 1, baseY - 63, RAMP.void); P(g, cx, baseY - 60, bn[2]);
  [lt, rt].forEach((t) => { const bxp = t.x0 + t.w / 2; for (let k = 0; k < 4; k++) { const hw = 2 - Math.floor(k / 2); for (let i = -hw; i <= hw; i++) P(g, bxp + i, t.ytop - 7 - k, k < 2 ? em[1] : em[2]); } P(g, bxp, t.ytop - 11, em[0]); for (let yy = -3; yy <= 1; yy++) for (let xx = -4; xx <= 4; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 3 && d < 6 && (xx + yy) % 2 === 0) P(g, bxp + xx, t.ytop - 9 + yy, em[2]); } });

  outline(g, RAMP.void);
  return g;
}

export function drawTradingPost(): Grid {
  const g = makeGrid(120, 130); const dt = RAMP.dirt, gd = RAMP.gold, bn = RAMP.bone;
  const cx = 60, baseY = 112;
  foundation(g, cx, baseY + 8, 50, { ash: true });
  const fw = 58, fh = 54, dep = 24, roofH = 22, x0 = cx - fw / 2, x1 = cx + fw / 2, ytop = baseY - fh;
  rightWall(g, x1, ytop, baseY, dep, dt, 'timber', 71);
  frontWall(g, x0, x1, ytop, baseY, dt, 71, 'timber');
  gableRoof(g, x0, x1, ytop, dep, roofH, RAMP.stone, { overhang: 4 });
  for (let k = 0; k < fh; k++) { P(g, x0 + 2 + Math.round(k * 0.4), baseY - k, dt[3]); P(g, x1 - 2 - Math.round(k * 0.4), baseY - k, dt[3]); }
  door(g, cx + 10, baseY, 11, 22, dt);
  litWindow(g, cx - 14, ytop + 16, 9, 9);

  const ax0 = x0 - 30, ax1 = x0 + 2, ay = ytop + 18;
  for (let x = ax0; x <= ax1; x++) { const yy = ay + Math.round((x - ax0) * 0.42); P(g, x, yy, dt[2]); P(g, x, yy + 1, dt[3]); }
  for (let k = 0; k < 22; k++) { P(g, ax0, ay + 1 + k, dt[3]); P(g, ax0 + 1, ay + 1 + k, dt[2]); }
  for (let x = ax0; x <= ax1; x++) { const yy = ay + Math.round((x - ax0) * 0.42); for (let k = 2; k < 6; k++) P(g, x, yy + k, ((x % 6) < 3) ? bn[2] : RAMP.blood[2]); }
  const wbx = ax0 + 3, wby = baseY - 4;
  for (let i = 0; i < 24; i++) P(g, wbx + i, wby, dt[1]);
  for (let i = 0; i < 24; i++) P(g, wbx + i, wby + 1, dt[3]);
  P(g, wbx + 1, wby + 2, dt[3]); P(g, wbx + 22, wby + 2, dt[3]);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { let c = dt[1]; if (i === 0 || i === 7 || j === 0 || j === 7) c = dt[3]; if (i === j || i === 7 - j) c = dt[2]; P(g, wbx + 2 + i, wby - 8 + j, c); }
  for (let j = 0; j < 6; j++) { const w = 6 - Math.abs(j - 3); for (let i = -w; i <= w; i++) P(g, wbx + 14 + i, wby - 1 - j, i < 0 ? bn[2] : bn[3]); }
  for (let k = 0; k < 4; k++) { P(g, wbx + 19, wby - 1 - k, gd[1]); P(g, wbx + 20, wby - 1 - k, gd[2]); }
  P(g, wbx + 19, wby - 5, gd[0]);
  hangingSign(g, x1 + 2, ytop + 24, 12, 9, dt, (gg, x, y) => {
    for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 4) P(gg, x + 6 + xx, y + 4 + yy, RAMP.gold[1]); P(gg, x + 6, y + 4, RAMP.gold[0]);
  });
  chimneySmoke(g, x1 - 8, ytop - 14);

  outline(g, RAMP.void);
  return g;
}

export function drawWatchtower(): Grid {
  const g = makeGrid(80, 152); const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, bn = RAMP.bone, dr = RAMP.drift;
  const cx = 40, baseY = 140;
  foundation(g, cx, baseY + 6, 30, { ash: true });

  const baseHW = 17, topHW = 13, botY = baseY, platY = 40;
  function leg(sideX: number, depth: number) {
    for (let y = platY; y <= botY; y++) {
      const t = (botY - y) / (botY - platY);
      const lx = cx + sideX * Math.round(baseHW - t * (baseHW - topHW)) + depth;
      P(g, lx, y - (depth ? Math.floor(depth / 2) : 0), depth ? dt[3] : (sideX < 0 ? dt[1] : dt[2]));
      P(g, lx + 1, y - (depth ? Math.floor(depth / 2) : 0), dt[3]);
    }
  }
  leg(-1, 7); leg(1, 7);
  leg(-1, 0); leg(1, 0);
  for (const by of [botY - 28, botY - 60, botY - 88]) {
    const t0 = (botY - by) / (botY - platY), t1 = (botY - (by - 28)) / (botY - platY);
    const lxB = cx - Math.round(baseHW - t0 * (baseHW - topHW)), rxB = cx + Math.round(baseHW - t0 * (baseHW - topHW));
    const lxT = cx - Math.round(baseHW - t1 * (baseHW - topHW)), rxT = cx + Math.round(baseHW - t1 * (baseHW - topHW));
    const n = 30;
    for (let k = 0; k <= n; k++) { P(g, Math.round(lxB + (rxT - lxB) * k / n), Math.round(by - 28 * k / n), dt[2]); P(g, Math.round(rxB + (lxT - rxB) * k / n), Math.round(by - 28 * k / n), dt[3]); }
    for (let x = lxB; x <= rxB; x++) P(g, x, by, dt[3]);
  }

  const pHW = topHW + 5, pTop = platY;
  for (let d = 0; d <= 10; d++) for (let x = -pHW; x <= pHW; x++) P(g, cx + x + d, pTop + 6 - Math.floor(d / 2), (d === 0 || x === -pHW) ? dt[1] : (d >= 9 ? dt[3] : dt[2]));
  for (let x = -pHW; x <= pHW; x++) { P(g, cx + x, pTop + 6, dt[3]); P(g, cx + x, pTop + 7, dt[3]); }
  for (let x = -pHW; x <= pHW; x += 1) if (x === -pHW || x === pHW || x % 6 === 0) for (let k = 0; k < 9; k++) P(g, cx + x, pTop + 5 - k, dt[3]);
  for (let x = -pHW; x <= pHW; x++) P(g, cx + x, pTop - 4, dt[2]);
  const rHW = pHW + 3, roofH = 16;
  for (let y = 0; y <= roofH; y++) { const t = y / roofH, hw = Math.round(rHW * t); const yy = pTop - 5 - roofH + y; for (let x = -hw; x <= hw; x++) { let c = st[1]; if (x < -hw + 2) c = st[0]; if (x > hw - 1) c = st[2]; if (y % 3 === 0) c = st[3]; P(g, cx + x, yy, c); } }
  for (let d = 1; d <= 10; d++) for (let y = 0; y <= roofH; y++) { const t = y / roofH; const x = Math.round(d + rHW * t); const yy = Math.round(pTop - 5 - roofH - Math.floor(d / 2) + y); P(g, cx + x, yy, y % 3 === 0 ? st[3] : st[2]); }
  for (let d = 0; d <= 10; d++) P(g, cx + d, pTop - 5 - roofH - Math.floor(d / 2), st[0]);
  P(g, cx + pHW - 3, pTop - 6, st[3]); for (let j = 0; j < 4; j++) { const w = 1 + j; for (let i = -w; i <= w; i++) P(g, cx + pHW - 3 + i, pTop - 5 + j, st[2]); } P(g, cx + pHW - 3, pTop - 1, st[3]);

  const fxp = cx - 4, fy = pTop + 2;
  for (let i = -3; i <= 3; i++) P(g, fxp + i, fy, st[3]);
  for (let k = 0; k < 5; k++) { const hw = 3 - Math.floor(k / 2); for (let i = -hw; i <= hw; i++) P(g, fxp + i, fy - 2 - k, k < 2 ? em[0] : em[1]); }
  for (let yy = -3; yy <= 1; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 3 && d < 6 && (xx + yy) % 2 === 0) P(g, fxp + xx, fy - 3 + yy, em[2]); }
  const ldx = cx - baseHW + 4;
  for (let y = pTop + 8; y <= botY - 2; y += 4) for (let i = 0; i < 6; i++) P(g, ldx + i, y, dt[3]);
  for (let y = pTop + 8; y <= botY - 2; y++) { P(g, ldx, y, dt[2]); P(g, ldx + 5, y, dt[2]); }
  const bx = cx + baseHW - 4;
  for (let y = botY - 70; y <= botY - 46; y++) for (let i = 0; i < 8; i++) { const wob = Math.round(Math.sin(y * 0.4) * 0.6); let c = bn[2]; if (i === 0) c = bn[1]; if (i >= 6) c = bn[3]; P(g, bx - i + wob, y, c); }
  P(g, bx - 4, botY - 60, dr[1]); P(g, bx - 5, botY - 59, dr[2]); P(g, bx - 3, botY - 59, dr[2]); P(g, bx - 4, botY - 58, dr[2]);

  outline(g, RAMP.void);
  return g;
}

// ── Frontier Expansion: world-event FX (ported from _gen/events.js) ──
// Drift corruption FX get NO void outline on the boil seam (it bleeds); solid
// props (the moon) keep the 1px outline. RAMP only, dither not blur.

// DRIFT RIFT (96×128): a vertical ground tear. open ∈ 0..1 width/height; boil ∈ 0..3.
function drawRiftBody(g: Grid, open: number, boil: number) {
  const dr = RAMP.drift, dt = RAMP.dirt;
  const cx = 48, midY = 66, groundY = 120;
  ell(g, cx, groundY, Math.round(20 + open * 16), Math.round(5 + open * 3), (x, y, d) => {
    let c = dt[3]; if (d < 0.4) c = RAMP.ash; if (hash2(x, y, 600) < open * 0.4 && d > 0.4) c = dr[3];
    P(g, x, y, c);
  });
  if (open <= 0.02) {
    for (let y = midY - 30; y <= groundY - 6; y++) { if (y % 3 !== 0) P(g, cx, y, dr[3]); if (y % 9 === 0) P(g, cx, y, dr[2]); }
    P(g, cx, midY, dr[2]);
    return;
  }
  const halfW = Math.round(2 + open * 20);
  const halfH = Math.round(20 + open * 42);
  for (let y = midY - halfH; y <= midY + halfH; y++) {
    const ty = (y - (midY - halfH)) / (2 * halfH);
    const profile = Math.sin(ty * Math.PI);
    const w = Math.max(0, Math.round(halfW * profile));
    for (let x = cx - w; x <= cx + w; x++) {
      const r = Math.abs(x - cx) / Math.max(1, w);
      let c;
      if (r < 0.18) c = dr[0]; else if (r < 0.4) c = dr[1]; else if (r < 0.66) c = dr[2]; else if (r < 0.86) c = dr[3]; else c = dr[4];
      if (r > 0.45 && ((x + y + boil) % 2 === 0) && hash2(x, y, 601 + boil) < 0.5) continue;
      P(g, x, y, c);
    }
  }
  for (let y = midY - halfH + 2; y <= midY + halfH - 2; y++) {
    if (hash2(0, y, 610 + boil) < 0.78) P(g, cx, y, dr[0]);
    if (hash2(0, y, 612 + boil) < 0.25) { P(g, cx - 1, y, dr[1]); P(g, cx + 1, y, dr[1]); }
  }
  const rip = mulberry(620 + boil);
  for (let i = 0; i < Math.round(14 * open); i++) {
    const ty = rip(), y = Math.round(midY - halfH + ty * 2 * halfH);
    const profile = Math.sin(ty * Math.PI), w = halfW * profile;
    const side = rip() < 0.5 ? -1 : 1;
    const x = Math.round(cx + side * (w + 1 + rip() * 3));
    P(g, x, y, rip() < 0.4 ? dr[0] : dr[2]);
  }
  if (open > 0.6) moteBurst(g, cx, midY - halfH, 8, 0.4, 630 + boil);
}
export type RiftState = 'sealed' | 'opening' | 'active' | 'closing';
export const RIFT_STATE_FRAMES: Record<RiftState, number> = { sealed: 2, opening: 4, active: 4, closing: 4 };
export function drawDriftRift(state: RiftState, f: number): Grid {
  const g = makeGrid(96, 128);
  if (state === 'sealed')  drawRiftBody(g, 0, f % 2);
  if (state === 'opening') drawRiftBody(g, [0.15, 0.45, 0.72, 1][f], f % 4);
  if (state === 'active')  drawRiftBody(g, 1, f);
  if (state === 'closing') drawRiftBody(g, [1, 0.7, 0.4, 0.12][f], (4 - f) % 4);
  return g;  // no global outline (boil seam bleeds)
}

// RIFT MOTE (16×16, 2f): a small mote drifting around an active rift (no outline)
export function drawRiftMote(f: number): Grid {
  const g = makeGrid(16, 16);
  const dr = RAMP.drift; const cx = 8, cy = 7 + (f ? -1 : 1);
  ell(g, cx, cy, 2.2, 2.2, (x, y, d) => P(g, x, y, d < 0.3 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
  P(g, cx, cy + 3, dr[3]); P(g, cx + (f ? 1 : -1), cy + 4, dr[3]);
  if (f) { P(g, cx - 3, cy - 2, dr[1]); P(g, cx + 3, cy, dr[2]); }
  else { P(g, cx + 3, cy - 2, dr[1]); P(g, cx - 3, cy, dr[2]); }
  return g;
}

// BLOOD MOON (64×64, 2f): a corrupted blood-red moon (solid body → outlined)
export function drawBloodMoon(f: number): Grid {
  const g = makeGrid(64, 64);
  const bl = RAMP.blood, dr = RAMP.drift; const cx = 32, cy = 32, R = 22;
  for (let y = 4; y < 60; y++) for (let x = 4; x < 60; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d > R && d < R + 6 && (x + y + f) % 2 === 0 && hash2(x, y, 640) < (1 - (d - R) / 6) * 0.6) P(g, x, y, bl[3]);
  }
  ell(g, cx, cy, R, R, (x, y, d, dx, dy) => {
    let c = bl[1]; if (dx + dy < -0.4) c = bl[0]; if (d > 0.72) c = bl[2]; if (dx + dy > 0.55) c = bl[3];
    if (hash2(x, y, 641) < 0.06) c = bl[3];
    P(g, x, y, c);
  });
  ([[-7, -5, 5], [6, 3, 6], [-3, 9, 4], [10, -8, 3]] as [number, number, number][]).forEach(([ox, oy, r]) => ell(g, cx + ox, cy + oy, r, r * 0.9, (x, y, d) => { if (d < 0.7) P(g, x, y, bl[3]); else if (d < 1) P(g, x, y, bl[2]); }));
  let vx = cx - 14, vy = cy - 6;
  for (let k = 0; k < 22; k++) {
    if (Math.hypot(vx - cx, vy - cy) < R - 1) P(g, Math.round(vx), Math.round(vy), (f && k % 3 === 0) ? dr[0] : dr[2]);
    vx += 1.1 + (hash2(k, 0, 642) - 0.5); vy += 0.5 + (hash2(k, 1, 642) - 0.5) * 1.2;
  }
  if (f) moteBurst(g, cx + 6, cy + 2, 6, 0.3, 643);
  outline(g, RAMP.void);
  return g;
}

// BLOOD AURA RING (96×48, 3f): iso ground ring under buffed mobs (no outline)
export function drawBloodAura(f: number): Grid {
  const g = makeGrid(96, 48); const bl = RAMP.blood, dr = RAMP.drift; const cx = 48, cy = 24;
  const rx = [30, 34, 32][f], ry = rx / 2;
  const bright = f === 1;
  for (let a = 0; a < 360; a += 3) {
    const rad = a * Math.PI / 180, x = Math.round(cx + Math.cos(rad) * rx), y = Math.round(cy + Math.sin(rad) * ry);
    if ((x + y + f) % 2 === 0) continue;
    P(g, x, y, bright ? bl[0] : bl[1]);
    const ix = Math.round(cx + Math.cos(rad) * (rx - 2)), iy = Math.round(cy + Math.sin(rad) * (ry - 1));
    if ((ix + iy) % 3 === 0) P(g, ix, iy, bright ? bl[1] : bl[2]);
  }
  for (let i = 0; i < 6; i++) { const t = hash2(i, f, 650) * Math.PI * 2, r = hash2(i, f, 651) * rx * 0.6; P(g, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.5), i % 2 ? dr[2] : bl[2]); }
  return g;
}

// Blood-Moon sky tint stops (top → horizon; overlay the world at ~0.5 strength)
export const BLOOD_SKY_STOPS = [
  { at: 0.0,  hex: '#1a0610' },
  { at: 0.35, hex: '#2a0810' },
  { at: 0.62, hex: '#3b0d14' },
  { at: 0.82, hex: '#5f1212' },
  { at: 1.0,  hex: '#991b1b' },
];
export function drawBloodSkySwatch(): Grid {
  const g = makeGrid(64, 128);
  for (let y = 0; y < 128; y++) {
    const t = y / 127;
    let lo = BLOOD_SKY_STOPS[0], hi = BLOOD_SKY_STOPS[BLOOD_SKY_STOPS.length - 1];
    for (let i = 0; i < BLOOD_SKY_STOPS.length - 1; i++) if (t >= BLOOD_SKY_STOPS[i].at && t <= BLOOD_SKY_STOPS[i + 1].at) { lo = BLOOD_SKY_STOPS[i]; hi = BLOOD_SKY_STOPS[i + 1]; }
    const fr = (t - lo.at) / Math.max(0.0001, hi.at - lo.at);
    for (let x = 0; x < 64; x++) {
      const c = ((x + y) % 2 === 0 && hash2(x, y, 660) < fr) ? hi.hex : lo.hex;
      P(g, x, y, c);
    }
  }
  return g;
}

// ── Frontier Expansion: mob projectiles + ability FX (ported from _gen/mobfx.js) ──
// Frame-strip sprites (no facings): drawX(f) -> grid. Projectiles center-anchored.

// bog_spit (12×12): a drift-tinted bile glob. `splat` 0 = travel frame `f`;
// splat ≥ 1 = a spreading-puddle frame (the number is the dither seed; the
// export's two splat frames use seeds 1 and 2).
export function drawBogSpit(f: number, splat: number): Grid {
  const g = makeGrid(12, 12);
  const wa = RAMP.water, gr = RAMP.grass, dr = RAMP.drift;
  if (!splat) {
    const cx = 7, cy = 6;
    ell(g, cx, cy, 3, 2.6, (x, y, d, dx, dy) => {
      let c = wa[1]; if (d > 0.7) c = wa[3];
      if (dx + dy < -0.3) c = (f % 2 ? gr[0] : wa[0]);
      P(g, x, y, c);
    });
    P(g, cx, cy, dr[1]);
    P(g, cx + (f === 1 ? 1 : -1), cy - 1, dr[0]);
    const tr: [number, number][] = [[-4, 1], [-3, 0], [-5, 2]];
    tr.forEach(([ox, oy], i) => { if (i <= f) P(g, cx + ox, cy + oy, i ? wa[3] : wa[2]); });
    P(g, cx - 6, cy + 1, dr[3]);
    outline(g, RAMP.void);
  } else {
    const cy = 9;
    for (let x = 2; x <= 10; x++) { if (hash2(x, splat, 200) < 0.85) P(g, x, cy, wa[2]); if (hash2(x, splat, 201) < 0.5) P(g, x, cy + 1, wa[3]); }
    P(g, 5, cy, dr[2]); P(g, 7, cy, dr[2]);
    if (splat === 0) { P(g, 3, cy - 2, wa[1]); P(g, 9, cy - 2, wa[1]); P(g, 6, cy - 3, dr[1]); }
    else { for (let x = 1; x <= 11; x++) if (hash2(x, 9, 202) < 0.4) P(g, x, cy + 1, wa[3]); }
    outline(g, RAMP.void);
  }
  return g;
}

// drift_bolt (10×10, 3f): a bright corrupted dart pointing right (engine rotates)
export function drawDriftBolt(f: number): Grid {
  const g = makeGrid(10, 10);
  const dr = RAMP.drift; const cx = 5, cy = 5;
  for (let x = cx - 3; x <= cx + 3; x++) {
    const t = (x - (cx - 3)) / 6;
    const hh = Math.round(t * 2.2);
    for (let y = cy - hh; y <= cy + hh; y++) {
      let c = dr[2]; if (t > 0.6) c = dr[1]; if (t > 0.85) c = dr[0]; if (Math.abs(y - cy) >= hh && hh > 0) c = dr[3];
      P(g, x, y, c);
    }
  }
  P(g, cx + 3, cy, dr[0]);
  const sp: [number, number][] = [[-4, 0], [-3, -1], [-3, 1], [-5, 0]];
  sp.forEach(([ox, oy], i) => { if ((i + f) % 2 === 0) P(g, cx + ox, cy + oy, dr[3]); });
  if (f === 1) { P(g, cx, cy - 3, dr[0]); P(g, cx + 1, cy + 3, dr[1]); }
  outline(g, RAMP.void);
  return g;
}

// ash_shockwave (48×24, 4f): expanding ember ring on the ground plane (centered)
export function drawAshShockwave(f: number): Grid {
  const g = makeGrid(48, 24);
  const em = RAMP.ember, gd = RAMP.gold, dt = RAMP.dirt;
  const cx = 24, cy = 12;
  const rx = [6, 14, 21, 23][f], ry = rx / 2;
  for (let a = 0; a < 360; a += 4) {
    const rad = a * Math.PI / 180;
    const x = Math.round(cx + Math.cos(rad) * rx), y = Math.round(cy + Math.sin(rad) * ry);
    if ((x + y + f) % 2 === 0) continue;
    let c = f < 2 ? em[0] : em[1];
    if (f >= 2 && hash2(x, y, 210) < 0.4) c = em[3];
    P(g, x, y, c);
    const ix = Math.round(cx + Math.cos(rad) * (rx - 1.5)), iy = Math.round(cy + Math.sin(rad) * (ry - 0.8));
    if ((ix + iy) % 2 === 0) P(g, ix, iy, f === 0 ? gd[0] : em[2]);
  }
  if (f <= 1) for (let i = 0; i < 10; i++) { const t = hash2(i, f, 211) * Math.PI * 2, r = hash2(i, f, 212) * rx * 0.7; P(g, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.5), hash2(i, f, 213) < 0.5 ? em[1] : dt[2]); }
  if (f === 3) for (let x = cx - 3; x <= cx + 3; x++) P(g, x, cy, dt[3]);
  return g;  // ground FX: no silhouette outline
}

// (exported for the headless smoke test; frame matters for shrine/den/obelisk)
export function makeBuildingSprite(key: BuildingSpriteKey, frame = 0): Grid {
  switch (key) {
    case 'dyeworks':  return drawDyeworks();
    case 'vault':     return drawVault();
    case 'wheel':     return drawCasino();
    case 'lantern':   return drawTavern();
    case 'furnisher': return drawFurnisher();
    case 'menagerie': return drawMenagerie();
    case 'shrine':    return drawShrine(frame % SHRINE_FRAMES);
    case 'pit':       return drawPit();
    case 'mine':      return drawMine();
    case 'stable':    return drawStable();
    case 'huskden':   return drawHuskDen(frame % HUSKDEN_FRAMES);
    case 'obelisk':   return drawAshObelisk(frame % OBELISK_FRAMES);
    // expansion art: the Waystation + the three frontier camps
    case 'waystation': return makeWaystation(frame % WAYSTATION_FRAMES);
    case 'barrowcrypt': return makeBarrowCrypt(frame);
    case 'ashwarcamp': return makeAshenWarcamp(frame);
    case 'drownedruins': return makeDrownedRuins(frame);
    case 'mirelair':    return makeDrownedRuins(frame); // SW lair reuses the sunken-ruin art
    // the Frontier Outpost now renders on its real trade house; the gate +
    // watchtower flank it as decor
    case 'outpost':   return drawTradingPost();
    case 'palisade_gate': return drawPalisadeGate();
    case 'watchtower':    return drawWatchtower();
    case 'mirehut':   return drawMirewifeHut();
  }
}

// ─── pets: small followers (2 frames each) ────────────────────────────────────

export type PetSpriteKey = 'wisp' | 'crow' | 'emberling';

function makePet(kind: PetSpriteKey, f: number): Grid {
  const g = makeGrid(14, 14);
  const dr = RAMP.drift, bn = RAMP.bone, em = RAMP.ember;
  const bob = f === 1 ? 1 : 0;
  if (kind === 'wisp') {
    ell(g, 7, 7 - bob, 3, 3, (x, y, d) => {
      if (hash2(x, y, 401) < 0.15) return;
      P(g, x, y, d < 0.3 ? dr[0] : d < 0.7 ? dr[1] : dr[2]);
    });
    P(g, 7 + (f ? 2 : -2), 11, dr[2]); // trailing mote
  } else if (kind === 'crow') {
    // hunched black bird with a bone beak
    ell(g, 7, 8 - bob, 3, 2.4, (x, y, d) => P(g, x, y, d < 0.5 ? RAMP.stone[2] : RAMP.stone[3]));
    P(g, 7, 5 - bob, RAMP.stone[2]); P(g, 7, 4 - bob, RAMP.stone[2]); // head
    P(g, 9, 4 - bob, bn[1]); // beak
    P(g, 8, 4 - bob, dr[1]); // eye
    P(g, 4 + (f ? 1 : 0), 7 - bob, RAMP.stone[1]); // wing hint
    P(g, 6, 11, RAMP.void); P(g, 8, 11, RAMP.void); // feet
  } else {
    // emberling: a hot coal with flame licks
    ell(g, 7, 9, 2.6, 2.2, (x, y, d) => P(g, x, y, d < 0.4 ? em[0] : d < 0.8 ? em[1] : em[2]));
    P(g, 6, 6 - bob, em[1]); P(g, 8, 5 - bob + (f ? 1 : 0), em[0]);
    P(g, 7, 4 - bob, em[0]);
    P(g, 7, 12, em[3]); // scorch
  }
  outline(g);
  return g;
}

// ─── the Stable steed — DS port (_gen/mounts.js, frontier_steed) ──────────────
// 56×48, bottom-center anchor (28,47), 5 facings s/se/e/ne/n + engine mirror.
// idle 2f / walk 6f (gait timed to the wanderer's 6-frame walk). Each frame
// carries a saddleAnchor where the rider's bottom-center sits.
export type SteedFacing = 's' | 'se' | 'e' | 'ne' | 'n';
export const STEED_FACINGS: SteedFacing[] = ['s', 'se', 'e', 'ne', 'n'];
export const STEED_CELL: [number, number] = [56, 48];
export const STEED_ANCHOR: [number, number] = [28, 47];
const STEED_WALK_BOB = [0, -1, 0, 0, -1, 0];
const STEED_IDLE_BOB = [0, -1];
const STEED_GAIT: Record<string, { sw: number[]; lift: number[] }> = {
  fNear: { sw: [2, 1, 0, -2, -1, 0], lift: [0, 1, 1, 0, 0, 0] },
  fFar:  { sw: [-2, -1, 0, 2, 1, 0], lift: [0, 0, 0, 0, 1, 1] },
  bNear: { sw: [-2, -1, 0, 2, 1, 0], lift: [0, 0, 0, 0, 1, 1] },
  bFar:  { sw: [2, 1, 0, -2, -1, 0], lift: [0, 1, 1, 0, 0, 0] },
};
const STEED_KINDS = {
  frontier_steed: { coat: 'stone', mane: 'void', glow: 'drift', undead: false },
} as const;
const STEED_SADDLE_BASE: Record<SteedFacing, [number, number]> = {
  s: [28, 26], se: [27, 25], e: [27, 24], ne: [29, 25], n: [28, 26],
};
function steedBob(anim: string, f: number) {
  return (anim === 'walk' ? STEED_WALK_BOB : STEED_IDLE_BOB)[f] || 0;
}
export function steedSaddle(facing: SteedFacing, anim: string, f: number) {
  const b = STEED_SADDLE_BASE[facing];
  return { x: b[0], y: b[1] + steedBob(anim, f) };
}
function steedLeg(g: Grid, x: number, topY: number, hoofY: number, sw: number, lift: number, ramp: readonly string[], w = 2) {
  const by = hoofY - lift;
  for (let y = topY; y <= by - 1; y++) {
    const t = (y - topY) / Math.max(1, by - topY);
    const xx = Math.round(x + sw * t);
    for (let i = 0; i < w; i++) {
      let c = ramp[2];
      if (i === 0) c = ramp[1];
      if (i === w - 1) c = ramp[3];
      if (y > by - 4) c = ramp[3];
      P(g, xx + i, y, c);
    }
  }
  const hx = Math.round(x + sw);
  for (let i = 0; i < w; i++) P(g, hx + i, by, RAMP.void);
}
function steedShadow(g: Grid, cx: number, cy: number, rx: number, ry: number) {
  ell(g, cx, cy, rx, ry, (x, y, d) => {
    if (y < cy - 1) return;
    if (d > 0.62 && (x + y) % 2 === 1) return;
    P(g, x, y, RAMP.void, 0.5);
  });
}
export function drawSteed(kind: keyof typeof STEED_KINDS, facing: SteedFacing, anim: string, f: number): Grid {
  const K = STEED_KINDS[kind];
  const co = RAMP[K.coat as keyof typeof RAMP] as unknown as readonly string[];
  const mane = K.mane === 'void' ? [RAMP.void, co[3], co[3]] : (RAMP[K.mane as keyof typeof RAMP] as unknown as readonly string[]);
  const gl = RAMP[K.glow as keyof typeof RAMP] as unknown as readonly string[];
  const g = makeGrid(56, 48);
  const cx = 28, groundY = 45;
  const oy = steedBob(anim, f);
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const tailFlick = anim === 'idle' ? (f === 1 ? 2 : 0) : (anim === 'walk' ? [0, 1, 1, 0, -1, -1][f] : 0);
  const swOf = (key: string) => anim === 'walk' ? STEED_GAIT[key].sw[f] : 0;
  const liOf = (key: string) => anim === 'walk' ? STEED_GAIT[key].lift[f] : 0;

  steedShadow(g, cx, groundY + 1, 17, 5);

  const profile = dir === 2;
  const threeQ = dir === 1 || dir === 3;
  const front = dir === 0;
  const headRight = profile || threeQ;

  if (headRight) {
    const squash = threeQ ? 0.86 : 1;
    const bx = cx - 1;
    const byc = 27 + oy;
    const rx = Math.round(14 * squash), ry = 8;
    const headEndX = bx + Math.round(rx * 0.95);
    const rumpX = bx - Math.round(rx * 0.95);

    steedLeg(g, headEndX - 1, byc + 4, groundY - 1, swOf('fFar'), liOf('fFar'), co, 2);
    steedLeg(g, rumpX + 1, byc + 4, groundY - 1, swOf('bFar'), liOf('bFar'), co, 2);

    const tlx = rumpX - 2;
    for (let k = 0; k < 13; k++) {
      const xx = tlx - Math.round(k * 0.35) - (k > 4 ? Math.round(tailFlick * (k - 4) / 6) : 0);
      const yy = byc - 2 + k;
      P(g, xx, yy, k % 3 === 0 ? mane[1] : RAMP.void);
      if (k > 2 && k % 2 === 0) P(g, xx - 1, yy, co[3]);
    }

    ell(g, bx, byc, rx, ry, (x, y, d, dx, dy) => {
      let c = co[1];
      if (dy < -0.35) c = co[0];
      else if (dy > 0.4) c = co[2];
      if (dx > 0.55) c = co[2];
      if (d > 0.78) c = co[3];
      if (hash2(x, y, 71) < 0.05) c = co[2];
      P(g, x, y, c);
    });
    for (let x = rumpX + 2; x <= headEndX - 2; x++) if ((x + byc) % 2 === 0) P(g, x, byc + ry - 1, co[3]);

    ell(g, headEndX - 1, byc + 1, 5, 7, (x, y, d, dx, dy) => {
      if (x < headEndX - 5) return;
      let c = co[1]; if (dy < -0.3) c = co[0]; if (dy > 0.4) c = co[2]; if (d > 0.8) c = co[3];
      P(g, x, y, c);
    });

    const wX = headEndX - 1, wY = byc - ry + 1;
    const pollX = headEndX + (threeQ ? 6 : 9), pollY = 12 + oy;
    const NSEG = 12;
    for (let s = 0; s <= NSEG; s++) {
      const t = s / NSEG;
      const nx = Math.round(wX + (pollX - wX) * t);
      const ny = Math.round(wY + (pollY - wY) * t);
      const hw = Math.round(4.2 - t * 1.8);
      for (let i = -hw; i <= hw; i++) {
        let c = co[1];
        if (i <= -hw + 1) c = co[0];
        if (i >= hw - 1) c = co[2];
        P(g, nx + i, ny, c);
      }
      P(g, nx + hw, ny, mane[0]);
      if (s < NSEG) P(g, nx + hw - 1, ny, hash2(nx, ny, 72) < 0.5 ? mane[1] : co[3]);
    }

    const hx = pollX, hy = pollY;
    ell(g, hx, hy + 3, 3, 4, (x, y, d, dx, dy) => {
      let c = co[1]; if (dx < -0.2) c = co[0]; if (dy > 0.4) c = co[2]; if (d > 0.8) c = co[3];
      P(g, x, y, c);
    });
    for (let k = 0; k < 6; k++) {
      const mxx = hx + 1 + k, myy = hy + 4 + k;
      const ww = Math.max(1, 2 - Math.floor(k / 3));
      for (let i = 0; i <= ww; i++) P(g, mxx, myy + i, k > 3 ? co[3] : co[2]);
    }
    P(g, hx + 6, hy + 10, RAMP.void);
    P(g, hx - 1, hy - 2, co[2]); P(g, hx - 1, hy - 3, co[3]);
    P(g, hx + 1, hy - 2, co[1]); P(g, hx + 1, hy - 3, co[2]);
    P(g, hx, hy - 1, mane[0]);
    const eyeLit = (anim === 'idle' && f === 1);
    P(g, hx + 2, hy + 2, eyeLit ? gl[0] : gl[1]);
    if (K.undead) P(g, hx + 1, hy + 2, gl[2]);

    const sb = STEED_SADDLE_BASE[facing];
    for (let x = sb[0] - 5; x <= sb[0] + 5; x++) {
      const t = Math.abs(x - sb[0]) / 5;
      const yTop = sb[1] + oy - 1 + Math.round(t * 1.5);
      P(g, x, yTop, RAMP.dirt[3]);
      P(g, x, yTop + 1, RAMP.dirt[2]);
      if (x === sb[0] - 5 || x === sb[0] + 5) P(g, x, yTop, gl[2]);
    }
    P(g, sb[0] + 5, sb[1] + oy - 2, RAMP.dirt[2]);
    P(g, sb[0] - 5, sb[1] + oy - 2, RAMP.dirt[2]);

    steedLeg(g, headEndX - 2, byc + 4, groundY, swOf('fNear'), liOf('fNear'), co, 3);
    steedLeg(g, rumpX, byc + 4, groundY, swOf('bNear'), liOf('bNear'), co, 3);

  } else if (front) {
    const byc = 26 + oy;
    ell(g, cx, byc - 4, 11, 7, (x, y, d, dx, dy) => {
      let c = co[1]; if (dy < -0.3) c = co[0]; if (dy > 0.4) c = co[2]; if (d > 0.8) c = co[3];
      if (hash2(x, y, 73) < 0.05) c = co[2];
      P(g, x, y, c);
    });
    steedLeg(g, cx - 8, byc + 1, groundY - 2, 0, liOf('bFar'), co, 2);
    steedLeg(g, cx + 7, byc + 1, groundY - 2, 0, liOf('bNear'), co, 2);
    ell(g, cx, byc + 3, 9, 7, (x, y, d, dx, dy) => {
      let c = co[1]; if (dx < -0.25) c = co[0]; if (dx > 0.3) c = co[2]; if (dy > 0.4) c = co[2]; if (d > 0.82) c = co[3];
      P(g, x, y, c);
    });
    steedLeg(g, cx - 6, byc + 7, groundY, swOf('fFar'), liOf('fFar'), co, 3);
    steedLeg(g, cx + 4, byc + 7, groundY, swOf('fNear'), liOf('fNear'), co, 3);
    const nbY = byc - 1, hY = 14 + oy;
    for (let s = 0; s <= 10; s++) {
      const t = s / 10, ny = Math.round(nbY - (nbY - hY) * t), hw = Math.round(3.6 - t * 1.2);
      for (let i = -hw; i <= hw; i++) {
        let c = co[1]; if (i < 0) c = co[0]; if (i > hw - 2) c = co[2]; P(g, cx + i, ny, c);
      }
      P(g, cx - hw, ny, mane[0]); P(g, cx + hw, ny, mane[1]);
    }
    ell(g, cx, hY, 4, 5, (x, y, d, dx) => {
      let c = co[1]; if (dx < -0.2) c = co[0]; if (dx > 0.3) c = co[2]; if (d > 0.82) c = co[3];
      P(g, x, y, c);
    });
    for (let y = hY + 3; y <= hY + 7; y++) for (let x = cx - 1; x <= cx + 1; x++) P(g, x, y, co[2]);
    P(g, cx, hY + 8, RAMP.void);
    P(g, cx - 3, hY - 4, co[2]); P(g, cx - 3, hY - 5, co[3]);
    P(g, cx + 3, hY - 4, co[1]); P(g, cx + 3, hY - 5, co[2]);
    P(g, cx, hY - 3, mane[0]);
    const eyeLit = (anim === 'idle' && f === 1);
    P(g, cx - 2, hY + 1, eyeLit ? gl[0] : gl[1]); P(g, cx + 2, hY + 1, eyeLit ? gl[0] : gl[1]);
    const sb = STEED_SADDLE_BASE.s;
    for (let x = sb[0] - 4; x <= sb[0] + 4; x++) { P(g, x, sb[1] + oy - 6, RAMP.dirt[3]); P(g, x, sb[1] + oy - 5, RAMP.dirt[2]); }

  } else {
    const byc = 26 + oy;
    const hY = 12 + oy;
    for (let s = 0; s <= 8; s++) {
      const t = s / 8, ny = Math.round((byc - 8) - ((byc - 8) - hY) * t), hw = Math.round(3 - t * 1.2);
      for (let i = -hw; i <= hw; i++) { let c = co[2]; if (i < 0) c = co[1]; P(g, cx + i, ny, c); }
      P(g, cx, ny, mane[1]);
    }
    ell(g, cx, hY, 3, 3, (x, y, d) => P(g, x, y, d > 0.7 ? co[3] : co[2]));
    P(g, cx - 1, hY - 3, co[3]); P(g, cx + 1, hY - 3, co[3]);
    steedLeg(g, cx - 7, byc - 1, groundY - 2, 0, liOf('fFar'), co, 2);
    steedLeg(g, cx + 6, byc - 1, groundY - 2, 0, liOf('fNear'), co, 2);
    ell(g, cx, byc + 2, 11, 8, (x, y, d, dx, dy) => {
      let c = co[1]; if (dy < -0.35) c = co[0]; if (dy > 0.35) c = co[2]; if (Math.abs(dx) > 0.55) c = co[2]; if (d > 0.8) c = co[3];
      if (hash2(x, y, 74) < 0.05) c = co[2];
      P(g, x, y, c);
    });
    for (let k = 0; k < 15; k++) {
      const xx = cx + Math.round(tailFlick * (k > 5 ? (k - 5) / 8 : 0));
      const yy = byc - 2 + k;
      P(g, xx, yy, k % 3 === 0 ? mane[1] : RAMP.void);
      if (k > 3 && k % 2 === 0) { P(g, xx - 1, yy, co[3]); P(g, xx + 1, yy, co[3]); }
    }
    steedLeg(g, cx - 6, byc + 6, groundY, swOf('bFar'), liOf('bFar'), co, 3);
    steedLeg(g, cx + 4, byc + 6, groundY, swOf('bNear'), liOf('bNear'), co, 3);
    const sb = STEED_SADDLE_BASE.n;
    for (let x = sb[0] - 4; x <= sb[0] + 4; x++) P(g, x, sb[1] + oy - 4, RAMP.dirt[3]);
  }

  outline(g, RAMP.void);
  return g;
}

// ─── Roads — DS port (_gen/roads.js) ─────────────────────────────────────────
// iso auto-tile terrain set: 64×36 cell, diamond-center anchor (32,16), drawn
// OVER the ground tile (sink:true, no billboard outline). drawRoad takes the
// connected directions, so the engine generates any of the 16 neighbour masks.
export type RoadDir = 'ne' | 'se' | 'sw' | 'nw';
const ROAD_CENTER: [number, number] = [32, 16];
const ROAD_EDGE: Record<RoadDir, [number, number]> = { ne: [48, 8], se: [48, 24], sw: [16, 24], nw: [16, 8] };
const ROAD_BIT: Record<RoadDir, number> = { ne: 1, se: 2, sw: 4, nw: 8 };
export const ROAD_PIECES: Record<string, RoadDir[]> = {
  straight: ['ne', 'sw'], bend: ['se', 'sw'], tee: ['ne', 'se', 'sw'],
  cross: ['ne', 'se', 'sw', 'nw'], cap: ['sw'], isolated: [],
};
export function roadMask(dirs: RoadDir[]): number { return dirs.reduce((m, d) => m | ROAD_BIT[d], 0); }
export function roadDirsFromMask(mask: number): RoadDir[] {
  return (Object.keys(ROAD_BIT) as RoadDir[]).filter((d) => mask & ROAD_BIT[d]);
}
function distSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const L2 = vx * vx + vy * vy || 1;
  let t = (wx * vx + wy * vy) / L2; t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + t * vx), dy = py - (ay + t * vy);
  return Math.sqrt(dx * dx + dy * dy);
}
export function drawRoad(dirs: RoadDir[], broken = false): Grid {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const [cxC, cyC] = ROAD_CENTER;
  const segs = dirs.map((d) => [cxC, cyC, ROAD_EDGE[d][0], ROAD_EDGE[d][1]]);
  const isolated = dirs.length === 0;
  const seed = 900 + roadMask(dirs) + (broken ? 50 : 0);
  const isoD = (px: number, py: number, ax: number, ay: number, bx: number, by: number) =>
    distSeg(px, py * 2, ax, ay * 2, bx, by * 2);
  const BED = 7, COB = 2.4;
  for (let y = 0; y < 32; y++) {
    for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      let d = Infinity;
      for (const s of segs) d = Math.min(d, isoD(x, y, s[0], s[1], s[2], s[3]));
      const dHub = isoD(x, y, cxC, cyC, cxC, cyC);
      if (isolated) d = dHub;
      const onBed = d <= BED || dHub <= (isolated ? 6 : 5.5);
      if (!onBed) continue;
      if (d > BED - 1.6 && (x + y) % 2 === 1) continue;
      if (d > BED - 0.7 && hash2(x, y, seed + 3) < 0.5) continue;
      let c = dt[2];
      if (hash2(x, y, seed) < 0.16) c = dt[3];
      else if (hash2(x, y, seed + 1) < 0.12) c = dt[1];
      const rut = (d > COB + 1 && d < COB + 3.2);
      if (rut && (x + y) % 2 === 0 && hash2(x, y, seed + 2) < 0.7) c = dt[3];
      const onCob = (d <= COB || (!isolated && dHub <= COB + 0.6));
      if (onCob) {
        c = st[1];
        if (hash2(x, y, seed + 4) < 0.30) c = st[2];
        if (hash2(x, y, seed + 5) < 0.14) c = st[3];
        if (hash2(x, y, seed + 6) < 0.08) c = bn[2];
        if ((x + y) % 2 === 0 && hash2(x, y, seed + 7) < 0.4) c = st[0];
      }
      if (broken) {
        const h = hash2(x, y, seed + 8);
        if (onCob && h < 0.45) c = (x + y) % 2 === 0 ? dt[3] : RAMP.void;
        else if (h < 0.10) c = RAMP.void;
        else if (h < 0.16) c = dr[3];
        if (h < 0.05) c = dr[2];
      }
      P(g, x, y, c);
    }
  }
  return g; // NO outline — roads sink into the terrain
}

// ─── Wayside decor — DS port (_gen/wayside.js) ────────────────────────────────
function pole(g: Grid, x: number, y0: number, y1: number, ramp: readonly string[], w = 3) {
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) {
    let c = ramp[1]; if (i === 0) c = ramp[0]; if (i === w - 1) c = ramp[3];
    if (hash2(x + i, y, 311) < 0.10) c = ramp[2];
    P(g, x + i, y, c);
  }
}
function plankH(g: Grid, x0: number, x1: number, y: number, ramp: readonly string[], th = 3) {
  for (let x = x0; x <= x1; x++) for (let j = 0; j < th; j++) {
    let c = ramp[1]; if (j === 0) c = ramp[0]; if (j === th - 1) c = ramp[3];
    if (hash2(x, y + j, 312) < 0.10) c = ramp[2];
    P(g, x, y + j, c);
  }
}
function plankSeam(g: Grid, x0: number, x1: number, y: number, c: string) { for (let x = x0; x <= x1; x++) if (x % 2 === 0) P(g, x, y, c); }
function crate(g: Grid, x: number, top: number, w: number, h: number, ramp: readonly string[], bands?: boolean) {
  for (let i = 0; i < w; i++) P(g, x + i, top - 1, ramp[0]);
  for (let i = -1; i < w + 1; i++) P(g, x + i, top, ramp[2]);
  for (let y = top; y < top + h; y++) for (let i = 0; i < w; i++) {
    let c = ramp[1]; if (i < 2) c = ramp[0]; if (i > w - 3) c = ramp[3];
    if (hash2(x + i, y, 313) < 0.08) c = ramp[2];
    P(g, x + i, y, c);
  }
  for (let i = 4; i < w; i += 5) for (let y = top; y < top + h; y++) P(g, x + i, y, ramp[3]);
  plankSeam(g, x, x + w - 1, top + 2, ramp[3]);
  plankSeam(g, x, x + w - 1, top + h - 2, ramp[3]);
  if (bands) for (let y = top; y < top + h; y += h - 1) for (let i = 0; i < w; i++) if (i < 2 || i > w - 3) P(g, x + i, y, RAMP.stone[2]);
}
function flame(g: Grid, cx: number, baseY: number, h: number, f: number) {
  const em = RAMP.ember, gd = RAMP.gold;
  const sway = [0, 1, -1][f], flick = [0, -1, 1][f];
  for (let k = 0; k < h; k++) {
    const t = k / h;
    const w = Math.max(0, Math.round((1 - t) * 4) - (k > h - 3 ? 1 : 0));
    const xc = cx + Math.round(sway * t * 2);
    for (let i = -w; i <= w; i++) {
      let c = em[2];
      if (Math.abs(i) <= w - 1) c = em[1];
      if (Math.abs(i) <= 1 && k < h * 0.66) c = em[0];
      if (Math.abs(i) === 0 && k < h * 0.4) c = gd[0];
      P(g, xc + i, baseY - k, c);
    }
  }
  P(g, cx + sway, baseY - h - 1 + flick, gd[0]);
  P(g, cx - 2 + flick, baseY - h + 1, em[0]);
  P(g, cx + 3 - flick, baseY - h, em[1]);
}

export function drawCampfire(f = 0): Grid {
  const g = makeGrid(64, 64);
  const st = RAMP.stone, dt = RAMP.dirt, em = RAMP.ember;
  const cx = 32, baseY = 60;
  ell(g, cx, baseY, 16, 6, (x, y, d) => { if (d > 0.85 && (x + y) % 2) return; P(g, x, y, d < 0.4 ? RAMP.void : (hash2(x, y, 5) < 0.4 ? RAMP.ash : dt[3])); });
  for (let a = 0; a < 9; a++) {
    const ang = a / 9 * Math.PI * 2;
    const sx = Math.round(cx + Math.cos(ang) * 14), sy = Math.round(baseY - 3 + Math.sin(ang) * 6);
    shadeMass(g, sx, sy, 3, 2.4, st as unknown as string[], 30 + a);
  }
  for (let k = -7; k <= 7; k++) { P(g, cx + k, baseY - 4 + Math.round(k * 0.2), dt[3]); P(g, cx + k, baseY - 3 + Math.round(k * 0.2), RAMP.void); }
  for (let k = -7; k <= 7; k++) P(g, cx + Math.round(k * 0.2), baseY - 4, dt[3]);
  pole(g, cx - 8, baseY - 6, baseY - 4, dt, 4); pole(g, cx + 5, baseY - 6, baseY - 4, dt, 4);
  for (let i = 0; i < 6; i++) { const ex = cx - 5 + i * 2, ey = baseY - 3; P(g, ex, ey, i % 2 ? em[1] : em[2]); }
  flame(g, cx, baseY - 4, 22, f);
  const rr = [12, 14, 13][f];
  for (let yy = -3; yy <= 4; yy++) for (let xx = -rr; xx <= rr; xx++) {
    if ((xx / rr) ** 2 + (yy / 5) ** 2 > 1) continue;
    if ((xx + yy + f) % 2 === 0 && Math.abs(xx) > 8 && hash2(xx, yy, 6) < 0.4) P(g, cx + xx, baseY - 1 + yy, em[2]);
  }
  outline(g, RAMP.void);
  return g;
}
export function drawLeanTo(): Grid {
  const g = makeGrid(80, 72);
  const dt = RAMP.dirt, bn = RAMP.bone, bl = RAMP.blood, st = RAMP.stone;
  const cx = 40, baseY = 68;
  ell(g, cx, baseY, 30, 7, (x, y, d) => { if (d > 0.9 && (x + y) % 2) return; P(g, x, y, d < 0.5 ? dt[2] : dt[3]); });
  pole(g, cx - 26, 22, baseY - 1, dt, 3);
  pole(g, cx + 22, 24, baseY - 1, dt, 3);
  pole(g, cx - 14, 46, baseY - 1, dt, 3);
  pole(g, cx + 30, 48, baseY - 1, dt, 3);
  for (let x = cx - 26; x <= cx + 32; x++) P(g, x, 22 + Math.round((x + 26 - cx) * 0.42), dt[2]);
  for (let x = cx - 28; x <= cx + 30; x++) {
    const topY = 20 + Math.round((x + 28 - cx) * 0.42);
    for (let k = 0; k < 22; k++) {
      const y = topY + k;
      if (y > baseY - 2) break;
      let c = bn[2];
      if (k < 2) c = bn[1];
      else if (k > 17) c = bn[3];
      else if (k > 13) c = dt[3];
      if (k % 6 === 2 && x % 2 === 0) c = dt[3];
      if (hash2(x, y, 41) < 0.04) c = bn[3];
      P(g, x, y, c);
    }
  }
  [[cx - 4, 30], [cx - 6, 32], [cx - 2, 32], [cx - 4, 34], [cx + 8, 38], [cx + 6, 40], [cx + 10, 40]].forEach(([rx, ry]) => P(g, rx, ry, bl[2]));
  for (const px of [cx - 26, cx + 22]) for (let j = 0; j < 3; j++) P(g, px, 24 + j * 2, st[3]);
  for (let x = cx - 14; x <= cx + 6; x++) { P(g, x, baseY - 4, dt[2]); P(g, x, baseY - 3, bl[2]); P(g, x, baseY - 2, dt[3]); }
  ell(g, cx - 16, baseY - 4, 3, 3, (x, y, d) => P(g, x, y, d < 0.5 ? bn[1] : bn[3]));
  outline(g, RAMP.void);
  return g;
}
export function drawBedroll(): Grid {
  const g = makeGrid(48, 24);
  const dt = RAMP.dirt, bl = RAMP.blood, bn = RAMP.bone;
  const baseY = 20;
  for (let x = 6; x <= 42; x++) {
    const t = (x - 6) / 36, h = Math.round(4 + Math.sin(t * Math.PI) * 2);
    for (let k = 0; k < h; k++) { let c = dt[1]; if (k > h - 2) c = dt[0]; if (x > 36) c = dt[2]; P(g, x, baseY - k, c); }
  }
  for (let x = 8; x <= 30; x++) { P(g, x, baseY - 5, bl[1]); P(g, x, baseY - 4, bl[2]); if (x % 4 === 0) P(g, x, baseY - 4, bl[0]); }
  ell(g, 40, baseY - 4, 4, 4, (x, y, d, dx, dy) => { let c = bn[2]; if (dy < -0.2) c = bn[1]; if (d > 0.7) c = bn[3]; P(g, x, y, c); });
  outline(g, RAMP.void);
  return g;
}
export function drawSupplyCrates(): Grid {
  const g = makeGrid(48, 40);
  const dt = RAMP.dirt, st = RAMP.stone;
  const baseY = 38;
  ell(g, 24, baseY, 22, 5, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.85) P(g, x, y, RAMP.void, 0.4); });
  crate(g, 4, baseY - 18, 18, 18, dt, true);
  crate(g, 23, baseY - 14, 13, 14, dt, true);
  crate(g, 9, baseY - 30, 14, 13, dt, false);
  for (let y = baseY - 16; y <= baseY - 1; y++) {
    const t = (y - (baseY - 16)) / 15, bulge = Math.round(Math.sin(t * Math.PI) * 1.5);
    for (let x = 37 - bulge; x <= 45 + bulge; x++) { let c = dt[1]; if (x < 39) c = dt[0]; if (x > 43) c = dt[3]; P(g, x, y, c); }
  }
  for (const yb of [baseY - 13, baseY - 5]) for (let x = 36; x <= 46; x++) P(g, x, yb, st[2]);
  ell(g, 41, baseY - 16, 5, 2, (x, y) => P(g, x, y, dt[3]));
  outline(g, RAMP.void);
  return g;
}
export function drawCookPot(): Grid {
  const g = makeGrid(32, 32);
  const st = RAMP.stone, em = RAMP.ember, bn = RAMP.bone;
  const cx = 16, baseY = 29;
  ell(g, cx, baseY, 9, 3, (x, y, d) => { if (d < 0.7) P(g, x, y, hash2(x, y, 51) < 0.5 ? em[2] : RAMP.void); });
  for (let i = 0; i < 5; i++) P(g, cx - 4 + i * 2, baseY - 1, i % 2 ? em[0] : em[1]);
  P(g, cx - 9, baseY - 2, st[2]); for (let k = 0; k < 12; k++) P(g, cx - 8 + k, baseY - 3 - k, st[3]);
  for (let k = 0; k < 12; k++) P(g, cx + 8 - k, baseY - 3 - k, st[3]);
  for (let k = 0; k < 10; k++) P(g, cx, baseY - 3 - k, st[2]);
  ell(g, cx, baseY - 9, 7, 5, (x, y, d, dx, dy) => { let c = st[2]; if (dx + dy < -0.4) c = st[1]; if (d > 0.75) c = st[3]; P(g, x, y, c); });
  for (let x = cx - 6; x <= cx + 6; x++) P(g, x, baseY - 13, st[3]);
  for (let x = cx - 5; x <= cx + 5; x++) P(g, x, baseY - 14, st[1]);
  for (let k = 0; k <= 6; k++) { const a = Math.PI * (k / 6); P(g, Math.round(cx - 6 + (1 - Math.cos(a)) * 6), Math.round(baseY - 14 - Math.sin(a) * 4), st[3]); }
  P(g, cx - 2, baseY - 13, bn[3]); P(g, cx + 2, baseY - 13, bn[2]);
  P(g, cx, baseY - 17, bn[3]); P(g, cx - 2, baseY - 20, bn[3]); P(g, cx + 2, baseY - 22, bn[3]);
  outline(g, RAMP.void);
  return g;
}
export function drawLogPile(): Grid {
  const g = makeGrid(64, 40);
  const dt = RAMP.dirt, bn = RAMP.bone;
  const baseY = 37;
  const logEnd = (cx: number, cy: number, r: number) => {
    ell(g, cx, cy, r, r, (x, y, d, dx, dy) => { let c = dt[1]; if (dx + dy < -0.3) c = dt[0]; if (d > 0.8) c = dt[3]; P(g, x, y, c); });
    ell(g, cx, cy, r - 1.5, r - 1.5, (x, y, d) => { if (d > 0.7 && d < 0.85) P(g, x, y, dt[2]); });
    ell(g, cx, cy, r * 0.4, r * 0.4, (x, y) => P(g, x, y, bn[3]));
    P(g, cx, cy, dt[3]);
  };
  plankH(g, 4, 60, baseY - 1, dt, 3);
  const r = 6;
  [[12, baseY - 8], [25, baseY - 8], [38, baseY - 8], [51, baseY - 8]].forEach(([x, y]) => logEnd(x, y, r));
  [[18, baseY - 18], [31, baseY - 18], [44, baseY - 18]].forEach(([x, y]) => logEnd(x, y, r));
  [[25, baseY - 28], [38, baseY - 28]].forEach(([x, y]) => logEnd(x, y, r));
  P(g, 5, baseY - 4, dt[3]); P(g, 58, baseY - 4, dt[3]);
  outline(g, RAMP.void);
  return g;
}
export function drawSawbuck(): Grid {
  const g = makeGrid(48, 40);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone;
  const cx = 24, baseY = 37;
  ell(g, cx, baseY, 18, 4, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.8) P(g, x, y, RAMP.void, 0.4); });
  const xleg = (ox: number) => { for (let k = 0; k < 20; k++) { P(g, ox + 6 + Math.round(k * 0.5), baseY - 1 - k, dt[2]); P(g, ox + 16 - Math.round(k * 0.5), baseY - 1 - k, dt[3]); } };
  xleg(2); xleg(20);
  for (let y = baseY - 24; y <= baseY - 18; y++) for (let x = 8; x <= 42; x++) {
    let c = dt[1]; if (y < baseY - 22) c = dt[0]; if (y > baseY - 20) c = dt[3];
    if (hash2(x, y, 61) < 0.10) c = dt[2];
    P(g, x, y, c);
  }
  ell(g, 8, baseY - 21, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2]));
  ell(g, 42, baseY - 21, 2, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[3] : dt[2]));
  for (let k = 0; k < 16; k++) { const x = 38 + Math.round(k * 0.3), y = baseY - 2 - k; P(g, x, y, st[0]); if (k % 2 === 0) P(g, x + 1, y, st[2]); }
  P(g, 38, baseY - 2, dt[3]); P(g, 43, baseY - 18, dt[3]);
  outline(g, RAMP.void);
  return g;
}
export function drawAxeStump(): Grid {
  const g = makeGrid(32, 40);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone;
  const cx = 16, baseY = 37;
  [[2, baseY - 1, 6], [3, baseY - 3, 5], [23, baseY - 1, 7], [25, baseY - 3, 5]].forEach(([x, y, w]) => {
    for (let k = 0; k < w; k++) { let c = dt[1]; if (k === 0) c = dt[0]; if (k === w - 1) c = dt[3]; P(g, x + k, y, c); }
    P(g, x, y, bn[3]);
  });
  const sw = 8, topY = baseY - 15;
  for (let y = topY; y <= baseY - 1; y++) for (let x = cx - sw; x <= cx + sw; x++) {
    let c = dt[2]; if (x < cx - sw + 2) c = dt[1]; if (x > cx + sw - 2) c = dt[3];
    if (x % 4 === 0 && hash2(x, y, 71) < 0.6) c = dt[3];
    P(g, x, y, c);
  }
  ell(g, cx, topY, sw, 3, (x, y, d) => { let c = dt[1]; if (d > 0.66) c = dt[3]; if (d < 0.3) c = bn[3]; P(g, x, y, c); });
  for (const r of [3, 5.5]) ell(g, cx, topY, r, r * 0.36, (x, y, d) => { if (d > 0.74) P(g, x, y, dt[2]); });
  for (let k = 0; k < 18; k++) { const x = cx + 2 + Math.round(k * 0.5), y = topY - 1 - k; P(g, x, y, dt[3]); P(g, x + 1, y, dt[2]); }
  const hx = cx + 1, hy = topY - 1;
  for (let j = -3; j <= 3; j++) for (let i = -1; i <= 4; i++) {
    if (Math.abs(j) - i > 3) continue;
    let c = st[1]; if (i < 1) c = st[0]; if (j > 1) c = st[3];
    P(g, hx - i, hy + j, c);
  }
  P(g, hx - 4, hy - 2, st[0]); P(g, hx - 4, hy + 2, st[0]);
  outline(g, RAMP.void);
  return g;
}
export function drawStoneCart(): Grid {
  const g = makeGrid(64, 48);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone;
  const cx = 32, baseY = 45;
  ell(g, cx, baseY, 28, 5, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.85) P(g, x, y, RAMP.void, 0.4); });
  const wheel = (wx: number) => {
    ell(g, wx, baseY - 6, 6, 6, (x, y, d) => { if (d > 0.78) P(g, x, y, dt[3]); else if (d > 0.6) P(g, x, y, dt[2]); });
    for (let a = 0; a < 6; a++) { const ang = a / 6 * Math.PI * 2; for (let k = 0; k < 5; k++) P(g, Math.round(wx + Math.cos(ang) * k), Math.round(baseY - 6 + Math.sin(ang) * k), dt[3]); }
    ell(g, wx, baseY - 6, 1.6, 1.6, (x, y) => P(g, x, y, st[2]));
  };
  wheel(16); wheel(48);
  for (let y = baseY - 20; y <= baseY - 10; y++) for (let x = 8; x <= 56; x++) {
    let c = dt[1]; if (y < baseY - 18) c = dt[0]; if (y > baseY - 12) c = dt[3];
    if ((x - 8) % 6 === 0) c = dt[3];
    P(g, x, y, c);
  }
  plankH(g, 6, 58, baseY - 21, dt, 2);
  for (let x = 8; x <= 56; x++) P(g, x, baseY - 8, dt[3]);
  for (let k = 0; k < 8; k++) P(g, 56 + k, baseY - 14 + Math.round(k * 0.4), dt[2]);
  ([[16, baseY - 27, 12, 7], [30, baseY - 25, 11, 6], [42, baseY - 28, 10, 7], [24, baseY - 33, 10, 6]] as const).forEach(([x, y, w, h], i) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1]; if (xx < x + 2) c = st[0]; if (xx > x + w - 3) c = st[3]; if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 81 + i) < 0.07) c = st[2];
      P(g, xx, yy, c);
    }
    for (let xx = x; xx < x + w; xx++) P(g, xx, y - 1, st[0]);
    if (i % 2) for (let xx = x; xx < x + w; xx++) if (hash2(xx, y, 9) < 0.2) P(g, xx, y, bn[3]);
  });
  outline(g, RAMP.void);
  return g;
}
export function drawCutBlocks(): Grid {
  const g = makeGrid(56, 32);
  const st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold;
  const baseY = 30;
  ell(g, 28, baseY, 26, 4, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.85) P(g, x, y, RAMP.void, 0.4); });
  const block = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1]; if (xx < x + 2) c = st[0]; if (xx > x + w - 3) c = st[3]; if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 85) < 0.06) c = st[2];
      P(g, xx, yy, c);
    }
    for (let xx = x; xx < x + w; xx++) P(g, xx, y - 1, st[0]);
    for (let yy = y + 1; yy < y + h - 1; yy += 2) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (hash2(xx, yy, 86) < 0.5) P(g, xx, yy, st[2]);
  };
  block(2, baseY - 11, 16, 11); block(19, baseY - 11, 16, 11); block(36, baseY - 11, 16, 11);
  block(10, baseY - 22, 16, 11); block(28, baseY - 22, 16, 11);
  P(g, 18, baseY - 23, gd[1]); P(g, 35, baseY - 23, bn[3]);
  for (let k = 0; k < 6; k++) P(g, 14 + k, baseY - 24, RAMP.stone[3]);
  P(g, 14, baseY - 24, st[0]);
  outline(g, RAMP.void);
  return g;
}
export function drawPickStump(): Grid {
  const g = makeGrid(32, 40);
  const st = RAMP.stone, dt = RAMP.dirt, gd = RAMP.gold;
  const cx = 16, baseY = 37;
  for (let i = 0; i < 10; i++) { const x = 3 + Math.floor(hash2(i, 1, 91) * 26), y = baseY - Math.floor(hash2(i, 2, 91) * 3); P(g, x, y, hash2(i, 3, 91) < 0.5 ? st[2] : st[3]); if (hash2(i, 4, 91) < 0.15) P(g, x, y, gd[1]); }
  for (let y = baseY - 14; y <= baseY - 1; y++) {
    const w = 9;
    for (let x = cx - w; x <= cx + w; x++) {
      let c = st[1]; if (x < cx - w + 2) c = st[0]; if (x > cx + w - 2) c = st[3]; if (y > baseY - 3) c = st[3];
      if (hash2(x, y, 92) < 0.08) c = st[2];
      P(g, x, y, c);
    }
  }
  for (let x = cx - 9; x <= cx + 9; x++) P(g, x, baseY - 15, st[0]);
  for (let x = cx - 6; x <= cx + 4; x++) if (x % 2 === 0) P(g, x, baseY - 12 + Math.round(Math.sin(x)), gd[1]);
  for (let k = 0; k < 17; k++) P(g, cx + 2 - Math.round(k * 0.45), baseY - 16 - k, dt[3]);
  const hx = cx + 2, hy = baseY - 16;
  for (let k = -5; k <= 5; k++) { P(g, hx + k, hy - Math.round(Math.abs(k) * 0.5), st[1]); P(g, hx + k, hy + 1 - Math.round(Math.abs(k) * 0.5), st[3]); }
  P(g, hx - 5, hy - 3, st[0]); P(g, hx + 5, hy - 3, st[0]);
  outline(g, RAMP.void);
  return g;
}
export function drawPier(f = 0): Grid {
  const g = makeGrid(96, 48);
  const dt = RAMP.dirt, wt = RAMP.water, bn = RAMP.bone;
  const baseY = 45;
  for (let y = baseY - 6; y <= baseY; y++) for (let x = 4; x < 92; x++) {
    let c = (x + y) % 2 === 0 ? wt[1] : wt[2];
    if (y > baseY - 2) c = wt[3];
    P(g, x, y, c);
  }
  const posts = [14, 30, 46, 62, 78];
  posts.forEach((px, i) => {
    pole(g, px, baseY - 18, baseY - 1, dt, 3);
    const ly = baseY - 4 + ((i + f) % 2);
    P(g, px - 2, ly, wt[0]); P(g, px + 3, ly, wt[0]);
    if ((i + f) % 2 === 0) { P(g, px - 3, ly, bn[3]); P(g, px + 4, ly, bn[3]); }
  });
  for (let x = 6; x <= 90; x++) {
    const y = baseY - 20 - Math.round((x - 6) * 0.03);
    for (let j = 0; j < 4; j++) { let c = dt[1]; if (j === 0) c = dt[0]; if (j === 3) c = dt[3]; P(g, x, y + j, c); }
    if (x % 7 === 0) for (let j = 0; j < 4; j++) P(g, x, y + j, dt[3]);
  }
  for (const px of [10, 88]) pole(g, px, baseY - 26, baseY - 22, dt, 2);
  ell(g, 88, baseY - 27, 3, 2, (x, y, d) => P(g, x, y, d < 0.5 ? dt[2] : dt[3]));
  ell(g, 20, baseY - 24, 4, 2, (x, y, d) => P(g, x, y, d < 0.4 ? bn[2] : bn[3]));
  crate(g, 60, baseY - 30, 11, 8, dt, false);
  outline(g, RAMP.void);
  return g;
}
export function drawNetRack(): Grid {
  const g = makeGrid(48, 56);
  const dt = RAMP.dirt, bn = RAMP.bone, wt = RAMP.water, st = RAMP.stone;
  const cx = 24, baseY = 53;
  ell(g, cx, baseY, 20, 4, (x, y, d) => { if (y < baseY - 1) return; if (d < 0.8) P(g, x, y, RAMP.void, 0.4); });
  pole(g, 6, 14, baseY - 1, dt, 3); pole(g, 39, 14, baseY - 1, dt, 3);
  for (let x = 4; x <= 44; x++) P(g, x, 14, dt[2]);
  plankH(g, 4, 44, 13, dt, 2);
  for (let k = 0; k < 6; k++) { P(g, 7 + k, 14 + k, dt[3]); P(g, 41 - k, 14 + k, dt[3]); }
  for (let y = 16; y <= 44; y++) for (let x = 8; x <= 40; x++) {
    const sag = Math.round(Math.sin((x - 8) / 32 * Math.PI) * 3);
    const yy = y + sag;
    if (yy > 46) continue;
    if ((x + yy) % 4 === 0 || (x - yy) % 4 === 0) P(g, x, yy, bn[3]);
  }
  for (let x = 10; x <= 38; x += 6) P(g, x, 16, RAMP.ember[2]);
  for (let x = 10; x <= 38; x += 5) P(g, x, 44 + Math.round(Math.sin((x - 8) / 32 * Math.PI) * 3), st[3]);
  ([[18, 30], [28, 36]] as const).forEach(([fx, fy]) => { ell(g, fx, fy, 3, 1.6, (x, y, d, dx) => { let c = st[0]; if (dx > 0.2) c = wt[1]; if (d > 0.7) c = st[3]; P(g, x, y, c); }); P(g, fx - 3, fy, wt[2]); P(g, fx + 3, fy, st[2]); });
  outline(g, RAMP.void);
  return g;
}
export function drawFishBasket(): Grid {
  const g = makeGrid(32, 28);
  const gd = RAMP.gold, wt = RAMP.water, st = RAMP.stone, bn = RAMP.bone;
  const cx = 16, baseY = 25;
  for (let y = baseY - 13; y <= baseY - 1; y++) {
    const t = (y - (baseY - 13)) / 12, w = Math.round(7 + t * 3);
    for (let x = cx - w; x <= cx + w; x++) {
      let c = gd[2]; if (x < cx - w + 2) c = gd[1]; if (x > cx + w - 2) c = gd[3];
      if ((x + y) % 2 === 0) c = gd[3];
      P(g, x, y, c);
    }
  }
  for (let x = cx - 8; x <= cx + 8; x++) P(g, x, baseY - 13, gd[1]);
  for (let x = cx - 8; x <= cx + 8; x++) P(g, x, baseY - 14, gd[0]);
  ([[11, baseY - 16, -0.4], [20, baseY - 16, 0.4], [15, baseY - 19, -0.1]] as const).forEach(([fx, fy, sl], i) => {
    const dirn = sl < 0 ? -1 : 1;
    ell(g, fx, fy, 4, 2.2, (x, y, d, dx, dy) => { let c = wt[1]; if (dy < -0.2) c = st[0]; if (d > 0.7) c = wt[2]; P(g, x, y + Math.round((x - fx) * sl), c); });
    const tx = fx + dirn * 5, ty = fy + Math.round(dirn * 5 * sl);
    for (let j = -2; j <= 2; j++) P(g, tx, ty + j, st[2]);
    P(g, tx + dirn, ty - 2, st[2]); P(g, tx + dirn, ty + 2, st[2]);
    const hx2 = fx - dirn * 4, hy2 = fy - Math.round(dirn * 4 * sl);
    P(g, hx2, hy2, st[0]); P(g, hx2 - dirn, hy2, RAMP.void);
    if (i === 2) { P(g, fx, fy - 2, bn[3]); P(g, fx - 1, fy, st[0]); }
  });
  outline(g, RAMP.void);
  return g;
}

// ─── Frontier interaction set — DS port (_gen/frontierboards.js) ──────────────
// Wood-and-parchment frontier signage, byte-exact ports of the _interaction_pkg
// exports. bounty_board (cluster A) is wired into the waysides; supply_post +
// quartermaster_stall + garrison_banner serve the Outpost (cluster D).
export function drawBountyBoard(f: number): Grid {
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
export function drawSupplyPost(): Grid {
  const g = makeGrid(56, 56);
  const dt = RAMP.dirt, bn = RAMP.bone, em = RAMP.ember, st = RAMP.stone;
  const baseY = 55;
  function crate(x0: number, y0: number, s: number) {
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
      let c = dt[1]; if (i === 0 || i === s - 1 || j === 0 || j === s - 1) c = dt[3];
      if (i === j || i === s - 1 - j) c = dt[2];
      if (hash2(x0 + i, y0 + j, 970) < 0.05) c = dt[2];
      P(g, x0 + i, y0 + j, c);
    }
  }
  crate(4, baseY - 15, 16);
  crate(6, baseY - 28, 12);
  crate(21, baseY - 12, 12);
  // a sack on top
  for (let j = 0; j < 7; j++) { const w = 7 - Math.abs(j - 3); for (let i = -w; i <= w; i++) P(g, 12 + i, baseY - 29 - j, i < 0 ? bn[2] : bn[3]); }
  P(g, 12, baseY - 36, bn[1]);
  // tally board post (right)
  const px = 44;
  for (let y = 6; y <= baseY; y++) { P(g, px, y, dt[2]); P(g, px + 1, y, dt[1]); P(g, px + 2, y, dt[3]); }
  for (let y = 10; y <= 35; y++) for (let x = 31; x <= px + 2; x++) {
    let c = dt[1]; if (y === 10 || y === 35) c = dt[3]; if (x <= 32) c = dt[0];
    if (hash2(x, y, 971) < 0.05) c = dt[3];
    P(g, x, y, c);
  }
  for (let x = 31; x <= px + 2; x++) P(g, x, 22, dt[3]);   // mid batten
  function tally(tx: number, ty: number) {
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
export function drawQuartermasterStall(): Grid {
  const g = makeGrid(64, 48);
  const dt = RAMP.dirt, bl = RAMP.blood, gd = RAMP.gold, st = RAMP.stone, bn = RAMP.bone;
  const baseY = 47;
  for (const px of [6, 30, 56]) for (let y = 10; y <= baseY; y++) { P(g, px, y, dt[2]); P(g, px + 1, y, dt[3]); }
  function crate(x0: number, y0: number, s: number) { for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { let c = dt[1]; if (i === 0 || i === s - 1 || j === 0 || j === s - 1) c = dt[3]; if (i === j || i === s - 1 - j) c = dt[2]; P(g, x0 + i, y0 + j, c); } }
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
// state 'raised': sway 3f @3fps · state 'lowered': furled, dim (rep not yet earned)
export function drawGarrisonBanner(state: string, f: number): Grid {
  const g = makeGrid(24, 72);
  const st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift, bl = RAMP.blood;
  const baseY = 71, px = 11;
  // spear pole
  for (let y = 4; y <= baseY; y++) { P(g, px, y, st[1]); P(g, px + 1, y, st[2]); }
  P(g, px, 0, st[0]); P(g, px, 1, st[0]);
  for (let yy = 2; yy <= 3; yy++) for (let xx = -1; xx <= 2; xx++) P(g, px + xx, yy, st[1]);
  P(g, px - 1, 4, st[2]); P(g, px + 2, 4, st[2]);
  if (state === 'lowered') {
    const fb = RAMP.stone;            // muted grey cloth — unlit / unearned
    for (let y = 9; y <= 41; y++) {
      const w = Math.max(1, 2 + Math.round(Math.sin(y * 0.22) * 1.2));
      for (let x = px + 2; x <= px + 2 + w; x++) { let c = fb[2]; if (x === px + 2) c = fb[1]; if (x >= px + 2 + w) c = fb[3]; if ((x + y) % 5 === 0) c = fb[3]; P(g, x, y, c); }
    }
    for (const ty of [15, 29]) for (let x = px; x <= px + 5; x++) P(g, x, ty, bn[3]);   // lashings
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
  const ex = bx0 + 4, ey = by0 + 17;
  P(g, ex, ey, dr[0]); P(g, ex - 1, ey, dr[2]); P(g, ex + 1, ey, dr[2]); P(g, ex, ey - 1, dr[2]); P(g, ex, ey + 1, dr[2]);
  P(g, ex - 2, ey, dr[3]); P(g, ex + 2, ey, dr[3]);
  outline(g, RAMP.void);
  return g;
}

// ─── The Roaming Trader — DS port (_gen/merchant.js) ──────────────────────────
// Wanderer-rig actor (reuses avatarRig/avatarFeet): 32×40, 5 facings, idle 2f /
// walk 6f, one ramp-swap `cloth` channel. Plus the pack_mule companion.
export const TRADER_CLOTH_RAMPS = ['dirt', 'stone', 'grass', 'blood', 'drift'] as const;
export type TraderCloth = (typeof TRADER_CLOTH_RAMPS)[number];
function bodyTrader(g: Grid, R: AvatarRig, anim: AnimName, f: number, cloth: readonly string[]) {
  const { cx, off, dir, top, shoulderY, hemSway, back, showFace } = R;
  const lt = RAMP.dirt, bn = RAMP.bone, st = RAMP.stone, em = RAMP.ember;
  function pack() {
    const bx = cx + off + (back ? 0 : (dir === 0 ? 0 : -1));
    for (let y = top - 6; y <= shoulderY + 6; y++) { P(g, bx - 5, y, lt[3]); P(g, bx + 5, y, lt[3]); }   // frame rails
    for (let y = top - 6; y <= shoulderY + 5; y++) for (let x = bx - 4; x <= bx + 4; x++) {
      let c = cloth[1]; if (x <= bx - 3) c = cloth[0]; if (x >= bx + 3) c = cloth[2];
      if ((x + y) % 4 === 0) c = cloth[2]; if (hash2(x, y, 1101) < 0.05) c = cloth[3];
      P(g, x, y, c);
    }
    fillRect(g, bx - 4, top - 3, 3, 3, st[2]); P(g, bx - 4, top - 4, st[3]);     // strapped pot
    fillRect(g, bx + 2, shoulderY - 1, 3, 3, lt[1]);                            // a bundle
    for (let x = bx - 5; x <= bx + 5; x++) { P(g, x, top - 7, bn[3]); P(g, x, top - 6, bn[2]); }   // bedroll across top
    for (let yy = top - 5; yy <= shoulderY; yy += 3) for (let x = bx - 5; x <= bx + 5; x++) if (x % 3 === 0) P(g, x, yy, RAMP.void);   // lashing
  }
  function lantern() {
    const lsw = (anim === 'walk') ? [0, 1, 1, 0, -1, -1][f] : (f === 1 ? 1 : 0);
    const lx = cx + off + 6 + lsw, ly = shoulderY + 7;
    P(g, lx, ly - 2, st[3]);
    for (let j = 0; j < 5; j++) for (let i = -1; i <= 1; i++) { let c = st[2]; if (i === 0 && j > 0 && j < 4) c = em[1]; if (Math.abs(i) === 1) c = st[3]; P(g, lx + i, ly + j, c); }
    P(g, lx, ly + 2, em[0]);
  }
  if (!back) pack();
  // coat / cloak
  for (let y = shoulderY; y <= 36; y++) {
    const t = (y - shoulderY) / (36 - shoulderY);
    const hw = Math.round(3.4 + t * 2.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 31 ? Math.round(hemSway * 0.6) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) { let c = cloth[1]; if (x <= cxx - hw + 1) c = cloth[0]; if (x >= cxx + hw - 1) c = cloth[2]; if (hash2(x, y, 1100) < 0.05) c = cloth[3]; P(g, x, y, c); }
  }
  // hood
  for (let y = top; y <= shoulderY + 1; y++) { const hy = (y - top) / (shoulderY + 1 - top); const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3); const hcx = cx + off; for (let x = hcx - hw; x <= hcx + hw; x++) { let c = cloth[1]; if (x === hcx - hw) c = cloth[0]; if (x >= hcx + hw - 1) c = cloth[2]; if (y === top) c = cloth[0]; P(g, x, y, c); } }
  P(g, cx + off + (dir >= 1 ? 1 : 0), top - 1, cloth[1]);
  // shadowed face + a glint of eye
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0), ey = top + 5;
    for (let y = top + 4; y <= top + 7; y++) for (let x = fcx - 2; x <= fcx + 2; x++) P(g, x, y, RAMP.void);
    P(g, fcx + (dir === 2 ? 1 : -1), ey, bn[0]); if (dir !== 2) P(g, fcx + 1, ey, bn[1]);
  }
  // forward arm + walking staff (front/side)
  if (!back) {
    const ax = cx + off - 5; for (let y = shoulderY + 1; y <= 28; y++) P(g, ax, y, cloth[2]);
    const sx = cx + off - 6; for (let y = top + 2; y <= 37; y++) P(g, sx, y, lt[2]); P(g, sx, top + 1, lt[3]);
    P(g, sx - 1, top + 2, bn[2]); P(g, sx + 1, top + 2, bn[2]);    // bundle tied at the staff head
    P(g, sx, top + 3, bn[1]);
  }
  if (back) pack();
  lantern();
}
export function drawTrader(facing: IsoFacing, anim: AnimName, f: number, cloth: readonly string[] = RAMP.dirt): Grid {
  const g = makeGrid(32, 40);
  const R = avatarRig(facing, anim, f);
  bodyTrader(g, R, anim, f, cloth);
  avatarFeet(g, R, RAMP.dirt, 0);
  outline(g, RAMP.void);
  return g;
}
const MULE_FACINGS = ['s', 'se', 'e', 'n'] as const;
export function drawPackMule(facing: 's' | 'se' | 'e' | 'n', f: number): Grid {
  const g = makeGrid(28, 28);
  const dt = RAMP.dirt, bn = RAMP.bone, st = RAMP.stone, cl = RAMP.dirt;
  const dir = { s: 0, se: 1, e: 2, n: 3 }[facing];
  const profile = dir === 2, diagonal = dir === 1, back = dir === 3;
  const cx = 14, baseY = 27, bodyY = baseY - 12;
  const ph = [0, 1, 0, -1][f % 4];
  function leg(lx: number) { for (let k = 0; k < 7; k++) P(g, lx, baseY - k, k > 4 ? dt[1] : dt[2]); P(g, lx, baseY, RAMP.void); }
  if (profile || diagonal) { leg(cx - 6 + ph); leg(cx - 3); leg(cx + 3 - ph); leg(cx + 6); }
  else { leg(cx - 5); leg(cx - 2); leg(cx + 2); leg(cx + 5); }
  // barrel body
  for (let y = 0; y < 8; y++) for (let x = -8; x <= 8; x++) { if ((x / 8) ** 2 + ((y - 3) / 4) ** 2 > 1) continue; let c = dt[2]; if (x <= -6) c = dt[1]; if (x >= 6) c = dt[3]; if (hash2(x, y, 1200) < 0.05) c = dt[3]; P(g, cx + x, bodyY + y, c); }
  // head / neck toward facing
  if (!back) {
    const hd = profile ? cx + 9 : (diagonal ? cx + 7 : cx);
    const hy = (profile || diagonal) ? bodyY + 1 : bodyY - 2;
    for (let y = 0; y < 6; y++) for (let x = -2; x <= 2; x++) { let c = dt[2]; if (x <= -2) c = dt[1]; if (x >= 2) c = dt[3]; P(g, hd + x, hy + y, c); }
    P(g, hd - 1, hy - 2, dt[1]); P(g, hd - 1, hy - 3, dt[2]); P(g, hd + 1, hy - 2, dt[1]); P(g, hd + 1, hy - 3, dt[2]);   // long ears
    P(g, hd, hy + 6, bn[3]);                                                                                            // muzzle
    if (profile) P(g, hd + 1, hy + 2, RAMP.void); else { P(g, hd - 1, hy + 2, RAMP.void); P(g, hd + 1, hy + 2, RAMP.void); }
  } else { P(g, cx, bodyY + 1, dt[3]); P(g, cx, bodyY + 2, dt[2]); P(g, cx, bodyY + 3, dt[3]); }   // tail
  // side panniers
  if (profile || diagonal) { fillRect(g, cx + 2, bodyY + 2, 5, 5, cl[2]); P(g, cx + 2, bodyY + 2, cl[3]); fillRect(g, cx - 7, bodyY + 3, 4, 4, cl[1]); }
  // top bundle heap + lashing
  for (let y = 0; y < 5; y++) { const w = 6 - y; for (let x = -w; x <= w; x++) { let c = cl[1]; if (x <= -w + 1) c = cl[0]; if (x >= w - 1) c = cl[2]; if ((x + 2 * y) % 4 === 0) c = cl[3]; P(g, cx + x, bodyY - 1 - y, c); } }
  fillRect(g, cx - 2, bodyY - 6, 4, 3, st[2]); P(g, cx - 2, bodyY - 6, st[3]);   // strapped pot
  for (let x = -8; x <= 8; x++) if (x % 4 === 0) P(g, cx + x, bodyY + 3, RAMP.void);
  outline(g, RAMP.void);
  return g;
}
// ─── Campcraft + claimworks — DS port (_gen/campcraft.js, _gen/claimworks.js) ─
// Field workstations + salvage FX (camp crafting / wreck salvage) and the claim
// upgrade props (Forge enchant + claim upgrades). Byte-exact ports.
function campLine(g: Grid, x0: number, y0: number, x1: number, y1: number, c: string) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let k = 0; k <= n; k++) P(g, Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c);
}
export function drawCampTannery(f: number): Grid {
  const g = makeGrid(40, 48);
  const dt = RAMP.dirt, bn = RAMP.bone;
  const baseY = 47, sway = f === 1 ? 1 : 0;
  for (const px of [5, 33]) { for (let y = 8; y <= baseY; y++) { P(g, px, y, dt[2]); P(g, px + 1, y, dt[3]); } }
  for (let x = 4; x <= 35; x++) { P(g, x, 8, dt[3]); P(g, x, 9, dt[2]); }
  function hide(x0: number, w: number, h: number, tone: readonly string[]) {
    for (let y = 0; y < h; y++) {
      const ww = Math.round(w * (0.6 + 0.4 * Math.sin((y / h) * Math.PI)));
      const s = y > h - 7 ? sway : 0;
      for (let x = -ww; x <= ww; x++) { let c = tone[2]; if (x <= -ww + 1) c = tone[1]; if (x >= ww - 1) c = tone[3]; if (hash2(x0 + x, y, 990) < 0.06) c = tone[3]; P(g, x0 + x + s, 10 + y, c); }
    }
    for (const dx of [-2, 0, 2]) P(g, x0 + dx, 9, bn[1]);
  }
  hide(11, 4, 26, bn);
  hide(21, 5, 30, dt);
  hide(30, 3, 20, bn);
  for (let x = 8; x <= 31; x++) P(g, x, baseY - 2, dt[3]);
  P(g, 8, baseY - 1, dt[3]); P(g, 31, baseY - 1, dt[3]);
  P(g, 18, baseY - 3, bn[1]); P(g, 19, baseY - 4, bn[2]); P(g, 20, baseY - 3, bn[1]);
  outline(g, RAMP.void);
  return g;
}
export function drawCampAnvil(f: number): Grid {
  const g = makeGrid(36, 40);
  const st = RAMP.stone, dt = RAMP.dirt, em = RAMP.ember;
  const baseY = 39, hot = f === 1;
  for (let y = 0; y < 8; y++) { const w = 8 - Math.floor(y / 2); for (let x = -w; x <= w; x++) { let c = st[2]; if (x <= -w + 1) c = st[1]; if (x >= w - 1) c = st[3]; P(g, 10 + x, baseY - y, c); } }
  for (let x = -5; x <= 5; x++) for (let yy = 0; yy < 3; yy++) { if (hash2(x, yy, 1001) < 0.6) { let c = hot ? em[0] : em[2]; if (hash2(x, yy, 1002) < 0.4) c = hot ? em[1] : em[3]; P(g, 10 + x, baseY - 6 + yy, c); } }
  for (let yy = -4; yy <= 0; yy++) for (let xx = -4; xx <= 4; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 2 && d < 5 && (xx + yy) % 2 === 0) P(g, 10 + xx, baseY - 8 + yy, hot ? em[1] : em[2]); }
  if (hot) { P(g, 8, baseY - 11, em[2]); P(g, 12, baseY - 12, em[1]); }
  for (let y = 0; y < 7; y++) for (let x = -4; x <= 4; x++) { let c = dt[2]; if (x <= -3) c = dt[1]; if (x >= 3) c = dt[3]; P(g, 26 + x, baseY - y, c); }
  const ay = baseY - 7;
  for (let x = -6; x <= 4; x++) P(g, 26 + x, ay - 3, st[1]);
  for (let x = -5; x <= 3; x++) P(g, 26 + x, ay - 2, st[2]);
  for (let x = -2; x <= 1; x++) P(g, 26 + x, ay - 1, st[2]);
  for (let x = -3; x <= 2; x++) P(g, 26 + x, ay, st[3]);
  P(g, 19, ay - 3, st[2]); P(g, 18, ay - 2, st[3]);
  P(g, 24, ay - 4, dt[2]); P(g, 23, ay - 5, dt[1]);
  fillRect(g, 21, ay - 6, 3, 2, st[3]);
  outline(g, RAMP.void);
  return g;
}
export function drawCampCookfire(f: number): Grid {
  const g = makeGrid(36, 40);
  const st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold, dt = RAMP.dirt;
  const baseY = 39, cx = 18, ay = baseY - 23;
  for (let x = -9; x <= 9; x++) if (Math.abs(x) > 5 && hash2(x, 0, 1010) < 0.85) { P(g, cx + x, baseY, st[2]); P(g, cx + x, baseY - 1, st[3]); }
  for (let x = -5; x <= 5; x++) P(g, cx + x, baseY - 1, dt[3]);
  P(g, cx - 4, baseY - 2, dt[2]); P(g, cx + 4, baseY - 2, dt[2]);
  const flh = [6, 8, 7][f];
  for (let k = 0; k < flh; k++) {
    const w = Math.max(0, Math.round((1 - k / flh) * 4));
    const wob = Math.round(Math.sin(k * 0.9 + f * 1.3) * 1.2);
    for (let i = -w; i <= w; i++) { let c = em[1]; if (k < flh * 0.4) c = em[0]; if (i === 0 && k < flh * 0.7) c = gd[0]; if (k > flh * 0.7) c = em[2]; P(g, cx + i + wob, baseY - 2 - k, c); }
  }
  P(g, cx + 2 + f, baseY - flh - 1, em[2]); P(g, cx - 1, baseY - flh - 2, gd[0]);
  campLine(g, cx - 9, baseY - 1, cx, ay, st[2]);
  campLine(g, cx + 9, baseY - 1, cx, ay, st[3]);
  campLine(g, cx, baseY - 3, cx, ay, st[2]);
  P(g, cx, ay - 1, st[3]);
  const cy = baseY - 15;
  for (let y = 0; y < 8; y++) { const w = (y < 2) ? 5 : (y > 6 ? 3 : 6 - Math.floor(y / 4)); for (let x = -w; x <= w; x++) { let c = st[2]; if (x <= -w + 1) c = st[1]; if (x >= w - 1) c = st[3]; if (y === 0) c = st[3]; P(g, cx + x, cy + y, c); } }
  for (let x = -5; x <= 5; x++) P(g, cx + x, cy - 1, st[3]);
  campLine(g, cx, ay, cx, cy - 1, st[3]);
  P(g, cx - 1, cy, gd[1]); P(g, cx + 2, cy, gd[2]);
  outline(g, RAMP.void);
  return g;
}
export function drawSalvageGlint(f: number): Grid {
  const g = makeGrid(16, 16);
  const gd = RAMP.gold, dr = RAMP.drift;
  const cx = 8, cy = 9, big = f === 0, r = big ? 3 : 2;
  for (let k = -r; k <= r; k++) { P(g, cx + k, cy, k === 0 ? gd[0] : gd[1]); P(g, cx, cy + k, k === 0 ? gd[0] : gd[1]); }
  P(g, cx, cy, gd[0]);
  if (big) { P(g, cx + 1, cy, gd[0]); P(g, cx, cy - 1, gd[0]); P(g, cx - r - 1, cy, gd[3]); P(g, cx + r + 1, cy, gd[3]); P(g, cx, cy - r - 1, gd[3]); }
  P(g, cx - 1, cy - 1, dr[1]); P(g, cx + 1, cy + 1, dr[1]);
  return g; // ADDITIVE — no outline
}
export function drawDigPuff(f: number): Grid {
  const g = makeGrid(24, 20);
  const bn = RAMP.bone, dt = RAMP.dirt;
  const cx = 12, by = 18, r = [3, 7, 10][f];
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI;
    const rr = r * (0.55 + 0.45 * hash2(a, f, 1030));
    const x = Math.round(cx + Math.cos(ang) * rr * 1.2);
    const y = Math.round(by - Math.sin(ang) * rr);
    if (hash2(a, f, 1031) < 0.25 + 0.18 * f) continue;
    const c = f === 0 ? dt[1] : (f === 1 ? bn[2] : bn[3]);
    P(g, x, y, c);
    if (f === 0) P(g, x, y + 1, dt[2]);
  }
  if (f < 2) { P(g, cx - 2, by - 2, dt[2]); P(g, cx + 3, by - 3, dt[3]); }
  return g; // ADDITIVE — no outline
}
export function drawClaimStash(): Grid {
  const g = makeGrid(32, 28);
  const dt = RAMP.dirt, st = RAMP.stone, gd = RAMP.gold;
  const cx = 16, x0 = 4, x1 = 27, topY = 11, botY = 26;
  for (let y = 4; y <= topY; y++) { const t = (y - 4) / (topY - 4); const hw = Math.round(9 + t * 2); for (let x = cx - hw; x <= cx + hw; x++) { let c = dt[1]; if (x <= cx - hw + 1) c = dt[0]; if (x >= cx + hw - 1) c = dt[2]; P(g, x, y, c); } }
  for (let y = topY + 1; y <= botY; y++) for (let x = x0; x <= x1; x++) { let c = dt[2]; if (x <= x0 + 1) c = dt[1]; if (x >= x1 - 1) c = dt[3]; if (hash2(x, y, 1300) < 0.05) c = dt[3]; P(g, x, y, c); }
  for (const bxp of [9, 16, 23]) for (let y = 4; y <= botY; y++) {
    if (y < topY) { const hw = Math.round(9 + ((y - 4) / (topY - 4)) * 2); if (Math.abs(bxp - cx) > hw) continue; }
    P(g, bxp, y, st[2]); P(g, bxp + 1, y, st[3]);
  }
  for (let x = x0; x <= x1; x++) { P(g, x, topY, st[3]); P(g, x, topY + 1, st[2]); }
  fillRect(g, cx - 2, topY - 1, 5, 5, gd[2]); P(g, cx - 2, topY - 1, gd[1]); P(g, cx, topY + 1, RAMP.void); P(g, cx, topY + 2, gd[0]);
  ([[x0 + 1, topY + 2], [x1 - 1, topY + 2], [x0 + 1, botY - 1], [x1 - 1, botY - 1]] as const).forEach(([rx, ry]) => P(g, rx, ry, st[1]));
  outline(g, RAMP.void);
  return g;
}
export function drawClaimWorkbench(): Grid {
  const g = makeGrid(36, 28);
  const dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone;
  const baseY = 27;
  for (const lx of [5, 30]) { for (let y = 16; y <= baseY; y++) { P(g, lx, y, dt[3]); P(g, lx + 1, y, dt[2]); } }
  for (let x = 5; x <= 31; x++) P(g, x, 22, dt[3]);
  for (let d = 0; d <= 4; d++) for (let x = 3; x <= 33; x++) P(g, x + d, 12 - Math.floor(d / 2), d === 0 ? dt[1] : (d >= 3 ? dt[3] : dt[2]));
  for (let x = 3; x <= 33; x++) { P(g, x, 15, dt[3]); P(g, x, 16, dt[3]); }
  fillRect(g, 29, 9, 4, 4, st[2]); P(g, 29, 9, st[1]); P(g, 33, 10, st[3]); P(g, 31, 13, st[3]); P(g, 31, 8, st[3]);
  P(g, 9, 11, dt[2]); P(g, 8, 11, dt[1]); fillRect(g, 6, 9, 3, 2, st[3]);
  P(g, 14, 11, st[2]); P(g, 15, 11, st[1]); P(g, 16, 11, bn[2]);
  P(g, 18, 11, st[2]); P(g, 19, 11, bn[2]);
  for (let k = 0; k < 7; k++) { P(g, 22 + k, 11 - k, st[2]); P(g, 22 + k, 12 - k, bn[3]); }
  for (let i = 0; i < 8; i++) { const ox = 6 + Math.floor(hash2(i, 1, 1400) * 26); P(g, ox, 14, dt[1]); if (hash2(i, 2, 1400) < 0.4) P(g, ox + 1, 14, dt[2]); }
  for (let i = 0; i < 5; i++) { const ox = 8 + Math.floor(hash2(i, 3, 1400) * 22); P(g, ox, baseY, dt[1]); }
  outline(g, RAMP.void);
  return g;
}
export function drawClaimWard(f: number): Grid {
  const g = makeGrid(24, 44);
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone;
  const cx = 12, baseY = 43, bright = f === 1;
  for (let y = 14; y <= baseY; y++) { const t = (y - 14) / (baseY - 14); const hw = Math.round(3 + t * 2); for (let x = cx - hw; x <= cx + hw; x++) { let c = st[2]; if (x <= cx - hw + 1) c = st[1]; if (x >= cx + hw - 1) c = st[3]; P(g, x, y, c); } }
  for (let x = cx - 6; x <= cx + 6; x++) { P(g, x, baseY, st[3]); P(g, x, baseY - 1, st[2]); }
  ([[0, 20], [-2, 26], [2, 30], [0, 36]] as const).forEach(([rx, ry]) => { const c = bright ? dr[0] : dr[2]; P(g, cx + rx, ry, c); P(g, cx + rx - 1, ry, dr[3]); P(g, cx + rx + 1, ry, dr[3]); P(g, cx + rx, ry + 1, dr[3]); });
  for (let x = cx - 5; x <= cx + 5; x++) P(g, x, 13, st[3]);
  for (let x = cx - 4; x <= cx + 4; x++) P(g, x, 14, st[2]);
  for (let x = cx - 3; x <= cx + 3; x++) P(g, x, 12, st[1]);
  const flh = bright ? 7 : 5;
  for (let k = 0; k < flh; k++) { const w = Math.max(0, Math.round((1 - k / flh) * 3)); const wob = Math.round(Math.sin(k * 0.9 + f) * 1); for (let i = -w; i <= w; i++) { let c = dr[1]; if (k < flh * 0.4) c = dr[0]; if (i === 0 && k < flh * 0.7) c = bn[0]; if (k > flh * 0.7) c = dr[2]; P(g, cx + i + wob, 11 - k, c); } }
  P(g, cx + 2, 11 - flh - 1, bright ? dr[0] : dr[2]); P(g, cx - 1, 11 - flh - 2, dr[1]);
  for (let yy = -3; yy <= 3; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 3 && d < (bright ? 7 : 6) && (xx + yy) % 2 === 0) P(g, cx + xx, 8 + yy, dr[3]); }
  outline(g, RAMP.void);
  return g;
}
export function drawRuneAnvil(f: number): Grid {
  const g = makeGrid(32, 40);
  const st = RAMP.stone, dr = RAMP.drift, dt = RAMP.dirt;
  const cx = 16, baseY = 39, bright = f === 1;
  for (let y = 0; y < 9; y++) for (let x = -5; x <= 5; x++) { let c = dt[2]; if (x <= -4) c = dt[1]; if (x >= 4) c = dt[3]; if (y === 0) c = dt[3]; P(g, cx + x, baseY - y, c); }
  const ay = baseY - 9;
  for (let x = -7; x <= 5; x++) P(g, cx + x, ay - 4, st[1]);
  for (let x = -6; x <= 4; x++) P(g, cx + x, ay - 3, st[2]);
  for (let x = -2; x <= 2; x++) { P(g, cx + x, ay - 2, st[2]); P(g, cx + x, ay - 1, st[3]); }
  for (let x = -4; x <= 3; x++) P(g, cx + x, ay, st[3]);
  P(g, cx - 8, ay - 4, st[2]); P(g, cx - 9, ay - 3, st[3]);
  P(g, cx - 1, ay - 2, bright ? dr[0] : dr[2]); P(g, cx + 1, ay - 2, bright ? dr[1] : dr[3]);
  const glyphs = [[-9, -8], [9, -9], [0, -13], [-6, -12], [7, -12]];
  glyphs.forEach(([gx, gy], i) => {
    const on = bright ? (i % 2 === 0) : (i % 2 === 1);
    const c = on ? dr[0] : dr[3];
    const yy = ay + gy - (bright ? 1 : 0);
    P(g, cx + gx, yy, c);
    if (on) { P(g, cx + gx - 1, yy, dr[2]); P(g, cx + gx + 1, yy, dr[2]); P(g, cx + gx, yy - 1, dr[2]); }
  });
  for (let a = 0; a < 16; a++) { const ang = (a / 16) * Math.PI * 2; const rx = Math.round(cx + Math.cos(ang) * 9); const ry = Math.round(ay - 7 + Math.sin(ang) * 5); if ((a + f) % 3 === 0) P(g, rx, ry, dr[3]); }
  P(g, cx + 3, ay - 5, dt[2]); P(g, cx + 4, ay - 6, dt[1]); fillRect(g, cx + 4, ay - 8, 3, 2, st[3]);
  outline(g, RAMP.void);
  return g;
}

export type WaysideKey =
  | 'campfire' | 'lean_to' | 'bedroll' | 'supply_crates' | 'cook_pot'
  | 'log_pile' | 'sawbuck' | 'axe_stump'
  | 'stone_cart' | 'cut_blocks' | 'pick_stump'
  | 'pier' | 'net_rack' | 'fish_basket'
  | 'bounty_board' | 'supply_post' | 'quartermaster_stall'
  | 'camp_tannery' | 'camp_anvil' | 'camp_cookfire';
export const WAYSIDE_SPECS: Record<WaysideKey, { cell: [number, number]; frames: number; fn: (f: number) => Grid }> = {
  bounty_board:        { cell: [40, 56], frames: 2, fn: (f) => drawBountyBoard(f) },
  supply_post:         { cell: [56, 56], frames: 1, fn: () => drawSupplyPost() },
  quartermaster_stall: { cell: [64, 48], frames: 1, fn: () => drawQuartermasterStall() },
  camp_tannery:        { cell: [40, 48], frames: 2, fn: (f) => drawCampTannery(f) },
  camp_anvil:          { cell: [36, 40], frames: 2, fn: (f) => drawCampAnvil(f) },
  camp_cookfire:       { cell: [36, 40], frames: 3, fn: (f) => drawCampCookfire(f) },
  campfire:      { cell: [64, 64], frames: 3, fn: (f) => drawCampfire(f) },
  lean_to:       { cell: [80, 72], frames: 1, fn: () => drawLeanTo() },
  bedroll:       { cell: [48, 24], frames: 1, fn: () => drawBedroll() },
  supply_crates: { cell: [48, 40], frames: 1, fn: () => drawSupplyCrates() },
  cook_pot:      { cell: [32, 32], frames: 1, fn: () => drawCookPot() },
  log_pile:      { cell: [64, 40], frames: 1, fn: () => drawLogPile() },
  sawbuck:       { cell: [48, 40], frames: 1, fn: () => drawSawbuck() },
  axe_stump:     { cell: [32, 40], frames: 1, fn: () => drawAxeStump() },
  stone_cart:    { cell: [64, 48], frames: 1, fn: () => drawStoneCart() },
  cut_blocks:    { cell: [56, 32], frames: 1, fn: () => drawCutBlocks() },
  pick_stump:    { cell: [32, 40], frames: 1, fn: () => drawPickStump() },
  pier:          { cell: [96, 48], frames: 2, fn: (f) => drawPier(f) },
  net_rack:      { cell: [48, 56], frames: 1, fn: () => drawNetRack() },
  fish_basket:   { cell: [32, 28], frames: 1, fn: () => drawFishBasket() },
};

// ─── Ruins / landmarks — DS port (_gen/ruins.js) ──────────────────────────────
function apron(g: Grid, cx: number, southY: number, halfW: number) {
  const dt = RAMP.dirt;
  const halfH = Math.round(halfW / 2);
  const topY = southY - halfH;
  for (let dy = -halfH; dy <= halfH; dy++) {
    const t = 1 - Math.abs(dy) / halfH;
    const w = Math.round(halfW * t);
    const y = (topY + halfH) + dy;
    for (let dx = -w; dx <= w; dx++) {
      let c = dt[1];
      if (dy < -halfH * 0.3 && dx < 0) c = dt[0];
      else if (dy > halfH * 0.3) c = dt[2];
      if (hash2(cx + dx, y, 3) < 0.07) c = dt[2];
      P(g, cx + dx, y, c);
    }
  }
  for (let dx = -halfW; dx <= halfW; dx++) {
    const t = 1 - Math.abs(dx) / halfW;
    const edgeY = topY + halfH + Math.round(halfH * t);
    for (let k = 1; k <= 3; k++) P(g, cx + dx, edgeY + k, dx < 0 ? RAMP.stone[2] : RAMP.stone[3]);
  }
}
export function drawWaystone(frame = 0): Grid {
  const g = makeGrid(28, 44);
  const st = RAMP.stone, dr = RAMP.drift;
  const cx = 14, baseY = 41;
  apron(g, cx, baseY, 11);
  const botY = baseY - 1, topY = 6;
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const lean = Math.round(t * 1.5);
    const hw = Math.round(6.5 - t * 2.2);
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x + lean;
      let c = st[1];
      if (x <= -hw + 1) c = st[0];
      else if (x >= hw - 1) c = st[3];
      if (hash2(sx, y, 102) < 0.07) c = st[2];
      if (hash2(sx, y, 103) < 0.02) c = st[3];
      P(g, sx, y, c);
    }
  }
  P(g, cx + 1, topY - 1, st[1]); P(g, cx, topY - 1, st[0]);
  P(g, cx + 4, topY + 1, RAMP.void);
  for (let i = 0; i < 6; i++) { const mx = cx - 5 + Math.floor(hash2(i, 1, 104) * 11), my = botY - Math.floor(hash2(i, 2, 104) * 4); P(g, mx, my, RAMP.grass[2]); }
  const lit = frame === 1;
  const rc = lit ? dr[0] : '#3b1162';
  const rim = lit ? dr[1] : dr[3];
  [[cx - 2, 20], [cx - 1, 21], [cx, 22], [cx + 1, 21], [cx + 2, 20]].forEach(([rx, ry]) => P(g, rx, ry, rc));
  [[cx, 24], [cx, 26], [cx - 1, 28], [cx + 1, 28]].forEach(([rx, ry]) => P(g, rx, ry, rim));
  if (lit) {
    for (let yy = 18; yy <= 30; yy++) for (let xx = -5; xx <= 6; xx++) {
      const d = Math.abs(xx) + Math.abs(yy - 24);
      if (d > 4 && d < 7 && (xx + yy) % 2 === 0 && !G(g, cx + xx, yy)) P(g, cx + xx, yy, dr[3]);
    }
  }
  outline(g, RAMP.void);
  return g;
}
export function drawBrokenArch(): Grid {
  const g = makeGrid(96, 88);
  const st = RAMP.stone, dr = RAMP.drift, gr = RAMP.grass;
  const cx = 48, baseY = 84;
  apron(g, cx, baseY, 42);
  const pier = (px: number, topY: number, w: number) => {
    for (let y = baseY - 2; y >= topY; y--) {
      const sway = Math.round((baseY - y) * 0.04);
      for (let x = -w; x <= w; x++) {
        const sx = px + x + sway;
        let c = st[1]; if (x < -w + 2) c = st[0]; if (x > w - 2) c = st[3];
        if ((baseY - y) % 9 === 0) c = st[3];
        if ((x + Math.floor((baseY - y) / 9) * 3) % 7 === 0) c = st[3];
        if (hash2(sx, y, 111) < 0.06) c = st[2];
        if (hash2(sx, y, 112) < 0.02) c = dr[3];
        P(g, sx, y, c);
      }
    }
  };
  pier(26, 18, 9);
  pier(72, 40, 9);
  const aCx = 49, aCy = 24, aR = 26, band = 9;
  for (let deg = 200; deg <= 340; deg += 1) {
    const a = deg * Math.PI / 180;
    for (let b = 0; b < band; b++) {
      const r = aR - b;
      const x = Math.round(aCx + Math.cos(a) * r * 1.0);
      const y = Math.round(aCy - Math.sin(a) * r * 0.8);
      if (y > baseY - 2) continue;
      if (deg > 305 && hash2(x, y, 113) < 0.6) continue;
      let c = st[1];
      if (b < 2) c = st[0]; if (b > band - 3) c = st[3];
      if (deg % 14 < 2) c = st[3];
      if (hash2(x, y, 114) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  ([[66, baseY - 8, 9, 7], [78, baseY - 6, 8, 6], [70, baseY - 14, 7, 6], [84, baseY - 5, 6, 5]] as const).forEach(([x, y, w, h], i) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      let c = st[1]; if (xx < x + 2) c = st[0]; if (xx > x + w - 3) c = st[3]; if (yy > y + h - 2) c = st[3];
      if (hash2(xx, yy, 115 + i) < 0.08) c = st[2];
      P(g, xx, yy, c);
    }
  });
  for (let i = 0; i < 22; i++) { const x = 58 + Math.floor(hash2(i, 1, 116) * 34), y = baseY - 2 - Math.floor(hash2(i, 2, 116) * 4); P(g, x, y, hash2(i, 3, 116) < 0.5 ? st[2] : st[3]); }
  for (let i = 0; i < 14; i++) { const x = 18 + Math.floor(hash2(i, 4, 117) * 60), y = baseY - 2 - Math.floor(hash2(i, 5, 117) * 2); P(g, x, y, gr[2]); }
  [[64, 26], [68, 30], [66, 34]].forEach(([mx, my]) => P(g, mx, my, dr[2]));
  outline(g, RAMP.void);
  return g;
}
export function drawFallenStatue(): Grid {
  const g = makeGrid(72, 72);
  const st = RAMP.stone, dr = RAMP.drift, gr = RAMP.grass, gd = RAMP.gold;
  const cx = 36, baseY = 68;
  apron(g, cx, baseY, 32);
  for (let step = 0; step < 3; step++) {
    const w = 13 - step * 2, h = 4, x0 = 12 - step, y0 = baseY - 4 - step * 4;
    for (let yy = y0; yy < y0 + h; yy++) for (let x = x0; x < x0 + w * 2; x++) {
      let c = st[1]; if (x < x0 + 2) c = st[0]; if (x > x0 + w * 2 - 3) c = st[3]; if (yy > y0 + h - 2) c = st[3];
      if (hash2(x, yy, 121) < 0.07) c = st[2];
      P(g, x, yy, c);
    }
  }
  for (const fx of [15, 21]) { for (let y = baseY - 24; y <= baseY - 16; y++) for (let x = fx; x <= fx + 4; x++) { let c = st[1]; if (x > fx + 2) c = st[2]; P(g, x, y, c); } for (let x = fx; x <= fx + 4; x++) P(g, x, baseY - 24, st[3]); }
  for (let x = 24; x <= 33; x++) for (let j = 0; j < 5; j++) { let c = st[1]; if (j === 0) c = st[0]; if (j > 3) c = st[3]; P(g, x, baseY - 6 - j, c); }
  P(g, 33, baseY - 11, st[3]);
  for (let x = 33; x <= 38; x++) for (let j = 0; j < 4; j++) P(g, x, baseY - 8 - j - (x - 33), st[2]);
  for (let x = 36; x <= 52; x++) {
    const t = (x - 36) / 16;
    const hh = Math.round(7 - Math.abs(t - 0.45) * 5);
    for (let j = -hh; j <= hh; j++) {
      let c = st[1]; if (j < -hh + 2) c = st[0]; if (j > hh - 2) c = st[2];
      if (hash2(x, baseY - 9 + j, 122) < 0.06) c = st[2];
      P(g, x, baseY - 9 + j, c);
    }
  }
  for (let x = 38; x <= 44; x++) P(g, x, baseY - 14, st[0]);
  ell(g, 43, baseY - 9, 2.4, 2.4, (x, y, d) => P(g, x, y, d < 0.4 ? gd[1] : st[3]));
  for (let k = -4; k <= 4; k++) { const yy = baseY - 9 + Math.round(Math.sin(k) * 1.3); P(g, 44 + k, yy, RAMP.void); P(g, 44 + k, yy - 1, dr[3]); }
  P(g, 44, baseY - 9, dr[1]);
  ell(g, 37, baseY - 14, 3, 3, (x, y, d) => P(g, x, y, d < 0.5 ? st[0] : st[2]));
  for (let k = 0; k < 8; k++) P(g, 35 - k, baseY - 13 + Math.round(k * 0.5), st[2]);
  ell(g, 27, baseY - 9, 3, 2, (x, y, d) => P(g, x, y, d < 0.5 ? st[1] : st[3]));
  for (let x = 52; x <= 55; x++) for (let j = -2; j <= 2; j++) P(g, x, baseY - 9 + j, st[2]);
  ell(g, 61, baseY - 8, 6, 6, (x, y, d, dx, dy) => {
    let c = st[1]; if (dx < -0.3) c = st[0]; if (dy > 0.3) c = st[2]; if (d > 0.8) c = st[3];
    if (hash2(x, y, 123) < 0.06) c = st[2];
    P(g, x, y, c);
  });
  P(g, 59, baseY - 9, RAMP.void); P(g, 63, baseY - 9, RAMP.void);
  P(g, 60, baseY - 9, st[3]); P(g, 64, baseY - 9, st[3]);
  for (let x = 59; x <= 63; x++) P(g, x, baseY - 5, st[3]);
  for (let x = 56; x <= 66; x++) P(g, x, baseY - 13, gd[2]);
  P(g, 61, baseY - 14, gd[1]); P(g, 58, baseY - 13, gd[0]);
  for (let i = 0; i < 12; i++) { const x = 16 + Math.floor(hash2(i, 1, 124) * 50), y = baseY - 2 - Math.floor(hash2(i, 2, 124) * 2); P(g, x, y, hash2(i, 3, 124) < 0.5 ? gr[2] : st[3]); }
  outline(g, RAMP.void);
  return g;
}
export function drawBattlefieldBones(): Grid {
  const g = makeGrid(80, 40);
  const bn = RAMP.bone, dt = RAMP.dirt, st = RAMP.stone, bl = RAMP.blood, dr = RAMP.drift;
  const cx = 40, baseY = 37;
  ell(g, cx, baseY - 2, 38, 8, (x, y, d) => {
    if (d > 0.92 && (x + y) % 2) return;
    let c = dt[2]; if (d > 0.7) c = dt[3]; if (hash2(x, y, 131) < 0.18) c = RAMP.ash;
    P(g, x, y, c);
  });
  const ribcage = (ox: number, oy: number, n: number, dirn: number) => {
    for (let k = 0; k < n; k++) P(g, ox + k * dirn, oy, bn[3]);
    for (let k = 0; k < n; k++) { const rx = ox + k * dirn; for (let j = 1; j <= 4; j++) { const yy = oy - j; P(g, rx + Math.round(j * 0.3) * dirn, yy, j < 4 ? bn[2] : bn[1]); } }
  };
  ribcage(20, baseY - 4, 7, 1);
  ribcage(54, baseY - 3, 6, -1);
  ([[16, baseY - 6], [60, baseY - 5]] as const).forEach(([sx, sy]) => {
    ell(g, sx, sy, 4, 3.4, (x, y, d, dx, dy) => { let c = bn[2]; if (dy < -0.2) c = bn[1]; if (d > 0.78) c = bn[3]; P(g, x, y, c); });
    P(g, sx - 1, sy, RAMP.void); P(g, sx + 1, sy, RAMP.void);
    P(g, sx, sy + 2, bn[3]);
  });
  ([[30, 1.2, 14], [44, -0.9, 16], [50, 1.6, 12], [12, -1.4, 10]] as const).forEach(([bx, ang, len]) => {
    for (let k = 0; k < len; k++) { const x = Math.round(bx + Math.cos(ang) * k), y = baseY - 4 - Math.round(Math.sin(ang) * k); P(g, x, y, dt[3]); }
    const tx = Math.round(bx + Math.cos(ang) * len), ty = baseY - 4 - Math.round(Math.sin(ang) * len);
    P(g, tx, ty, st[1]); P(g, tx + 1, ty, st[0]);
  });
  ([[34, baseY - 2, bl], [58, baseY - 1, dt]] as const).forEach(([sx, sy, ramp]) => {
    ell(g, sx, sy, 6, 3, (x, y, d) => { let c = ramp[2]; if (d < 0.3) c = ramp[3]; if (d > 0.72) c = ramp[1]; P(g, x, y, c); });
    ell(g, sx, sy, 2, 1, (x, y) => P(g, x, y, RAMP.stone[2]));
    for (let k = -5; k <= 5; k++) if (k % 3 === 0) P(g, sx + k, sy, RAMP.void);
  });
  ([[26, baseY - 10], [48, baseY - 12], [38, baseY - 8]] as const).forEach(([mx, my], i) => P(g, mx, my, i % 2 ? dr[1] : dr[2]));
  outline(g, RAMP.void);
  return g;
}
export function drawDriftMonolith(frame = 0): Grid {
  const g = makeGrid(48, 96);
  const st = RAMP.stone, dr = RAMP.drift;
  const cx = 24, baseY = 90;
  apron(g, cx, baseY, 20);
  const botY = baseY - 4, topY = 10;
  for (let y = botY; y >= topY; y--) {
    const t = (botY - y) / (botY - topY);
    const hw = Math.round(8 - t * 4.5);
    for (let x = -hw; x <= hw; x++) {
      const sx = cx + x;
      let c = st[1];
      if (x <= -hw + 1) c = st[0];
      else if (x >= hw - 1) c = st[3];
      else if (x > 0) c = st[2];
      if (hash2(sx, y, 141) < 0.06) c = st[2];
      if (hash2(sx, y, 142) < 0.025) c = st[3];
      P(g, sx, y, c);
    }
  }
  for (let k = 0; k < 4; k++) for (let x = -(3 - k); x <= (3 - k); x++) P(g, cx + x, topY - 1 - k, x < 0 ? st[1] : st[2]);
  const hi = dr[0], mid = dr[1], lo = dr[2];
  for (let y = botY - 4; y >= topY + 2; y -= 1) {
    const jitter = Math.round(Math.sin(y * 0.6 + frame * 1.7));
    const sx = cx + jitter;
    const phase = (Math.floor((botY - y) / 3) + frame) % 3;
    P(g, sx, y, phase === 0 ? hi : phase === 1 ? mid : lo);
    if (phase === 0) { P(g, sx - 1, y, mid); P(g, sx + 1, y, lo); }
  }
  const runeC = frame === 0 ? dr[1] : dr[2];
  [22, 40, 58].forEach((_ry, i) => {
    const y = botY - 10 - i * 20; if (y < topY + 4) return;
    ([[-4, 1], [4, -1]] as const).forEach(([rx, dirn]) => { P(g, cx + rx, y, runeC); P(g, cx + rx + dirn, y, runeC); P(g, cx + rx, y + 1, runeC); });
  });
  const cty = topY - 5;
  for (let k = 0; k < 8; k++) { const w = Math.max(0, Math.round((1 - k / 8) * 2)); for (let i = -w; i <= w; i++) { let c = dr[2]; if (i < 0) c = dr[1]; if (i > 0) c = dr[3]; if (i === 0 && k < 5) c = dr[0]; P(g, cx + i, cty - k, c); } }
  P(g, cx, cty - 8, dr[0]);
  const rr = frame === 0 ? 7 : 6;
  for (let yy = -7; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) {
    const d = Math.abs(xx) + Math.abs(yy);
    if (d > 4 && d < rr && (xx + yy + frame) % 2 === 0 && !G(g, cx + xx, cty - 3 + yy)) P(g, cx + xx, cty - 3 + yy, dr[2]);
  }
  for (let i = 0; i < 5; i++) { const mx = cx + Math.round((hash2(i, frame, 143) - 0.5) * 14); const my = topY + 6 + Math.round(hash2(i, 1, 143) * 40) - frame * 3; P(g, mx, my, hash2(i, 2, 143) < 0.4 ? dr[0] : dr[1]); }
  outline(g, RAMP.void);
  return g;
}
export type RuinKey = 'waystone' | 'broken_arch' | 'fallen_statue' | 'battlefield_bones' | 'drift_monolith';
export const RUIN_SPECS: Record<RuinKey, { cell: [number, number]; frames: number; fn: (f: number) => Grid }> = {
  waystone:          { cell: [28, 44], frames: 2, fn: (f) => drawWaystone(f) },
  broken_arch:       { cell: [96, 88], frames: 1, fn: () => drawBrokenArch() },
  fallen_statue:     { cell: [72, 72], frames: 1, fn: () => drawFallenStatue() },
  battlefield_bones: { cell: [80, 40], frames: 1, fn: () => drawBattlefieldBones() },
  drift_monolith:    { cell: [48, 96], frames: 2, fn: (f) => drawDriftMonolith(f) },
};

// ─── claim props (the Furnisher's wares) ──────────────────────────────────────

export type PropSpriteKey = 'campfire' | 'banner' | 'driftlamp' | 'statue';

function makeProp(kind: PropSpriteKey, f: number): Grid {
  const g = makeGrid(20, 26);
  const dt = RAMP.dirt, st = RAMP.stone, dr = RAMP.drift, em = RAMP.ember, gd = RAMP.gold;
  const base = 24;
  if (kind === 'campfire') {
    // log ring + flame (2 frames)
    for (let x = 5; x <= 15; x++) P(g, x, base, dt[1]);
    P(g, 4, base, dt[2]); P(g, 16, base, dt[2]);
    fillRect(g, 7, base - 2, 7, 2, dt[0]);
    const lick = f === 1 ? 1 : 0;
    for (let k = 0; k < 6 + lick; k++) {
      const w = Math.max(1, 3 - (k >> 1));
      for (let x = 10 - w; x <= 10 + w; x++) {
        if (hash2(x, base - 3 - k, 411 + f) < 0.8) {
          P(g, x, base - 3 - k, k < 2 ? em[0] : k < 4 ? em[1] : em[2]);
        }
      }
    }
  } else if (kind === 'banner') {
    for (let y = base - 20; y <= base; y++) P(g, 6, y, dt[0]); // pole
    P(g, 6, base - 21, gd[1]); // finial
    for (let y = base - 19; y <= base - 11; y++) {
      const sway = f === 1 && y > base - 15 ? 1 : 0;
      for (let x = 7; x <= 14 - ((y - (base - 19)) >> 2); x++) {
        P(g, x + sway, y, x < 9 ? dr[1] : dr[2]);
      }
    }
    P(g, 9, base - 16, gd[0]); P(g, 10, base - 15, gd[0]); // sigil
  } else if (kind === 'driftlamp') {
    for (let y = base - 14; y <= base; y++) P(g, 10, y, st[1]);
    fillRect(g, 8, base - 18, 5, 4, st[0]);
    P(g, 10, base - 16, f === 1 ? dr[0] : dr[1]); // crystal pulses
    P(g, 9, base - 16, dr[2]); P(g, 11, base - 16, dr[2]);
    fillRect(g, 8, base - 1, 5, 1, st[2]);
  } else {
    // statue: a small stone wanderer on a plinth
    fillRect(g, 6, base - 3, 9, 3, st[1]);
    fillRect(g, 7, base - 4, 7, 1, st[0]);
    for (let y = base - 14; y <= base - 4; y++) {
      const t = (y - (base - 14)) / 10;
      const hw = Math.round(1.5 + t * 1.5);
      for (let x = 10 - hw; x <= 10 + hw; x++) P(g, x, y, x < 10 ? st[0] : st[2]);
    }
    ell(g, 10, base - 16, 2, 2, (x, y) => P(g, x, y, st[1]));
    P(g, 9, base - 16, dr[2]); P(g, 11, base - 16, dr[2]); // stone eyes, faintly lit
  }
  outline(g);
  return g;
}

function makeTombstone(): Grid {
  const g = makeGrid(16, 18);
  const st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold;
  // weathered slab with a rounded top
  for (let y = 4; y <= 15; y++) {
    const w = y < 7 ? 3 + (y - 4) : 5;
    for (let x = 8 - w; x <= 8 + w - 1; x++) {
      let c = bn[2];
      if (x < 8 - w + 2) c = bn[1];
      if (x > 8 + w - 3) c = st[1];
      if (hash2(x, y, 71) < 0.1) c = st[2]; // weathering
      P(g, x, y, c);
    }
  }
  // carved mark
  P(g, 7, 7, st[3]); P(g, 9, 7, st[3]);
  P(g, 8, 8, st[3]); P(g, 8, 9, st[3]); P(g, 8, 10, st[3]);
  // base rubble + spilled gold glint
  for (let x = 3; x <= 12; x++) if (hash2(x, 0, 73) < 0.6) P(g, x, 16, st[2]);
  P(g, 4, 15, gd[1]); P(g, 5, 16, gd[0]); P(g, 11, 16, gd[1]); P(g, 12, 15, gd[2]);
  outline(g);
  return g;
}

// the caravan wagon (hand-built one-off, DS style): covered wagon, 2 frames
// (wheel spokes turn + 1px sway). 56×44, bottom-center anchored.
// (exported for the headless smoke test)
export function makeWagon(f: number): Grid {
  const g = makeGrid(56, 44);
  const dt = RAMP.dirt, bn = RAMP.bone, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold;
  const bob = f === 1 ? 1 : 0;

  // wooden bed (plank seams, moonlit left / shaded right)
  for (let y = 24 - bob; y <= 34 - bob; y++) {
    for (let x = 10; x <= 46; x++) {
      let c = dt[1];
      if (x <= 12) c = dt[0];
      else if (x >= 44) c = dt[2];
      if ((y - (24 - bob)) % 4 === 0) c = dt[3];          // plank seams
      if (hash2(x, y, 81) < 0.05) c = dt[2];
      P(g, x, y, c);
    }
  }
  // canvas cover: arched bone tarp with rib lines
  for (let y = 10 - bob; y <= 24 - bob; y++) {
    const t = (y - (10 - bob)) / 14;
    const hw = Math.round(10 + t * 8);                     // arch widens downward
    for (let x = 28 - hw; x <= 28 + hw; x++) {
      let c = bn[1];
      if (x <= 28 - hw + 2) c = bn[0];                     // moonlit left
      else if (x >= 28 + hw - 2) c = bn[2];                // shaded right
      if ((x - 28 + 60) % 6 === 0) c = bn[3];              // ribs
      if (hash2(x, y, 82) < 0.06) c = bn[2];               // weathering
      P(g, x, y, c);
    }
  }
  // dark mouth at the back of the tarp
  for (let y = 14 - bob; y <= 22 - bob; y++) {
    const hw = Math.round(2 + (y - (14 - bob)) * 0.5);
    for (let x = 12 - 0; x <= 12 + hw; x++) P(g, x, y, RAMP.void);
  }
  // strongbox peeking out the back
  fillRect(g, 11, 20 - bob, 5, 4, dt[2]);
  for (let x = 11; x <= 15; x++) P(g, x, 21 - bob, gd[1]);
  P(g, 13, 22 - bob, gd[0]);
  // wheels: stone rims, rotating spokes (+ on frame 0, × on frame 1)
  for (const [wx, wy] of [[18, 36], [38, 36]] as const) {
    for (let yy = -6; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) {
      const d = Math.sqrt(xx * xx + yy * yy);
      if (d > 6) continue;
      if (d > 4.6) { P(g, wx + xx, wy + yy, st[3]); continue; }   // rim
      P(g, wx + xx, wy + yy, st[2]);
    }
    for (let k = -4; k <= 4; k++) {
      if (f === 0) { P(g, wx + k, wy, dt[3]); P(g, wx, wy + k, dt[3]); }
      else {
        const kk = Math.round(k * 0.7);
        P(g, wx + kk, wy + kk, dt[3]); P(g, wx + kk, wy - kk, dt[3]);
      }
    }
    P(g, wx, wy, dt[0]);                                    // hub
  }
  // tongue + yoke out the front
  for (let k = 0; k < 7; k++) P(g, 46 + k, 32 - Math.round(k * 0.35) - bob, dt[3]);
  P(g, 53, 29 - bob, dt[2]); P(g, 53, 30 - bob, dt[2]);
  // hanging ember lantern at the front bow
  P(g, 45, 18 - bob, dt[3]);
  fillRect(g, 44, 19 - bob, 3, 4, em[1]);
  P(g, 45, 20 - bob, em[0]);
  P(g, 45, 23 - bob, em[2]);                                // warm spill
  outline(g);
  return g;
}

// ─── interiors.js — INTERIOR SET + THE MINE (DS port) ─────────────────────────
// Faithful port of _gen/interiors.js. Floors 64×36 (tiles.js format), walls
// 64×56 (bottom-center anchor), fixtures bottom-center anchored.

export type InteriorFloorStyle = 'wood' | 'stone' | 'cave' | 'crypt';

/** map a room accent hex to its RAMP ramp (banner/rug/vat tinting) */
const ACCENT_RAMP: Record<string, readonly string[]> = {
  '#a855f7': RAMP.drift, '#f59e0b': RAMP.ember, '#4a7fa0': RAMP.water,
  '#dc2626': RAMP.blood, '#4d7c4d': RAMP.grass, '#e7c873': RAMP.gold,
  '#d8cfe0': RAMP.bone,
};
const ACCENT_LIQUID: Record<string, string> = {
  '#a855f7': 'drift', '#f59e0b': 'ember', '#4a7fa0': 'water',
  '#dc2626': 'blood', '#4d7c4d': 'grass', '#e7c873': 'gold',
};
const RAMP_BY_NAME: Record<string, readonly string[]> = {
  drift: RAMP.drift, ember: RAMP.ember, water: RAMP.water,
  blood: RAMP.blood, grass: RAMP.grass, gold: RAMP.gold,
};

export function makeInteriorFloor(style: InteriorFloorStyle, seedN: number): Grid {
  if (style === 'crypt') return makeCryptFloor(seedN);
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = style === 'wood' ? RAMP.dirt : RAMP.stone;
  const face = ramp[1], hi = ramp[0], sh = ramp[2], dp = ramp[3];

  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip
  for (let x = 0; x < 64; x++) { const my = contourMaxY(rows, x); if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh); }
  // 1px void north edge
  for (let x = 0; x < 64; x++) for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }

  if (style === 'wood') {
    // plank seams run NW→SE (parallel to top-left edge): constant (x+2y)
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      if ((x + 2 * y) % 10 === 0) P(g, x, y, dp);                      // board seam
      else if ((x + 2 * y) % 10 === 1) P(g, x, y, hi);                 // plank highlight edge
      if (hash2(x, y, seedN) < 0.015) { P(g, x, y, dp); P(g, x + 1, y, sh); } // knot
      else if (hash2(x, y, seedN + 5) < 0.03) P(g, x, y, sh);          // grain
    }
    // board END caps (cross seams) every few rows
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++)
      if ((x - 2 * y + 64) % 26 === (seedN * 7) % 26) P(g, x, y, dp);
  } else if (style === 'stone') {
    // flagstone courses (blocky), hairline cracks
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const bx = Math.floor((x + 2 * y) / 12), by = Math.floor((x - 2 * y + 128) / 12);
      if ((x + 2 * y) % 12 === 0 || (x - 2 * y + 128) % 12 === 0) P(g, x, y, dp);   // joints
      else if (hash2(bx, by, seedN) < 0.18 && hash2(x, y, seedN + 1) < 0.5) P(g, x, y, hash2(x, y, seedN + 2) < 0.5 ? hi : sh);
      if (hash2(x, y, seedN + 7) < 0.012) P(g, x, y, dp);             // hairline crack
    }
  } else { // cave
    for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
      const h = hash2(x, y, seedN);
      if (h < 0.08) P(g, x, y, sh);
      else if (h < 0.11) P(g, x, y, dp);
      else if (h < 0.135) P(g, x, y, hi);
      if (hash2(x, y, seedN + 9) < 0.012) { P(g, x, y, RAMP.gold[1]); if (hash2(x, y, seedN + 10) < 0.4) P(g, x + 1, y, RAMP.gold[2]); } // gold fleck
      if (hash2(x, y, seedN + 11) < 0.02) P(g, x, y, dp);             // rubble speck
    }
  }
  return g;
}

// ── Frontier Expansion: crypt / ruin interior tileset (ported from _gen/crypt.js) ──
// A crypt FLOOR variant (dark cracked flagstone, bone/gold flecks, drift seep) +
// dungeon fixtures (bottom-center anchored, each carries a `solid` flag).

/** crypt floor (64×36, 3 seed variants): coarse cracked flagstone, kin to
 *  floor_stone but corrupted (bone fragments, gold rune fleck, drift seep) */
export function makeCryptFloor(seedN: number): Grid {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold, dr = RAMP.drift;
  const hi = st[1], sh = st[3];
  const face = st[2];

  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip + 1px void north edge
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }
  }
  // big crypt flagstones (coarser courses than floor_stone) + cracks
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const joint = (x + 2 * y) % 16 === 0 || (x - 2 * y + 128) % 16 === 0;
    if (joint) { P(g, x, y, sh); if (hash2(x, y, seedN) < 0.4) P(g, x, y, RAMP.void); continue; }
    const bx = Math.floor((x + 2 * y) / 16), by = Math.floor((x - 2 * y + 128) / 16);
    if (hash2(bx, by, seedN) < 0.22 && hash2(x, y, seedN + 1) < 0.5) P(g, x, y, hash2(x, y, seedN + 2) < 0.5 ? hi : sh);
    if (hash2(x, y, seedN + 7) < 0.018) P(g, x, y, RAMP.void);            // hairline crack
    // dim drift seep welling from the joints
    if (joint === false && hash2(x, y, seedN + 8) < 0.010) { P(g, x, y, dr[3]); if (hash2(x, y, seedN + 9) < 0.4) P(g, x, y, dr[2]); }
  }
  // a scatter of bone fragments + a worn gold rune fleck per variant
  const rng = mulberry(seedN * 13 + 3);
  for (let i = 0; i < 5; i++) {
    const fx = 14 + Math.floor(rng() * 36), fy = 6 + Math.floor(rng() * 20);
    if (!inDiamond(rows, fx, fy)) continue;
    P(g, fx, fy, bn[3]); if (rng() < 0.5) P(g, fx + 1, fy, bn[2]);
  }
  const gx = 20 + (seedN % 3) * 10, gy = 12 + (seedN % 2) * 6;
  if (inDiamond(rows, gx, gy)) { P(g, gx, gy, gd[2]); P(g, gx + 1, gy, gd[3]); }
  return g;
}

// SARCOPHAGUS — stone coffin: tapered body + heavy carved lid, gold trim, crack. SOLID.
function fxSarcophagus(): Grid {
  const g = makeGrid(44, 36); const st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold, dr = RAMP.drift;
  const baseY = 33;
  // coffin body — slightly tapered cuboid (head end wider, left)
  for (let y = 0; y < 12; y++) for (let x = 0; x < 34; x++) {
    const taper = Math.round((x / 34) * 1.5);
    let c = st[1]; if (x < 2) c = st[0]; if (x > 31) c = st[2];
    if (y > 9) c = st[3];
    P(g, 4 + x, baseY - y - taper, c);
  }
  // right iso side (shadow)
  for (let d = 1; d <= 6; d++) for (let y = 0; y < 12; y++) P(g, 4 + 33 + d, baseY - y - Math.floor(d / 2), d >= 5 ? st[3] : st[2]);
  // the lid — a wider slab on top with a carved figure
  for (let d = 0; d <= 7; d++) for (let x = -1; x < 35; x++) {
    let c = (d === 0 || x < 1) ? st[0] : st[1];
    if (d >= 6) c = st[2];
    P(g, 4 + x + d, baseY - 12 - Math.floor(d / 2), c);
  }
  // recumbent figure carved into the lid (bone, simplified effigy)
  const lx = 12, ly = baseY - 14;
  fillRect(g, lx, ly - 2, 16, 1, bn[2]);                       // body line
  P(g, lx - 1, ly - 2, bn[1]); P(g, lx, ly - 3, bn[1]); P(g, lx + 1, ly - 3, bn[2]);  // head
  fillRect(g, lx + 4, ly - 3, 6, 1, bn[3]); fillRect(g, lx + 5, ly - 4, 4, 1, bn[2]); // crossed arms
  // gold trim band + a worn rune on the foot
  for (let x = 4; x < 38; x++) if (x % 2 === 0) P(g, x, baseY - 1, gd[3]);
  P(g, 30, baseY - 6, gd[2]); P(g, 31, baseY - 6, gd[3]); P(g, 30, baseY - 7, gd[3]);
  // crack across the lid with faint drift seep
  for (let k = 0; k < 8; k++) { const cxk = 18 + Math.round(Math.sin(k) * 1.5), cyk = baseY - 18 + k; P(g, cxk, cyk, st[3]); if (k % 2 === 0) P(g, cxk, cyk, dr[3]); }
  outline(g, RAMP.void); return g;
}

// RUBBLE PILE — collapsed stone blocks heaped up, dust. SOLID (low cover).
function fxRubblePile(): Grid {
  const g = makeGrid(34, 24); const st = RAMP.stone; const baseY = 21, cx = 17;
  const blocks: [number, number, number, number][] = [
    [cx - 11, baseY, 8, 6], [cx - 2, baseY, 9, 7], [cx + 7, baseY, 7, 5],
    [cx - 7, baseY - 6, 7, 5], [cx + 1, baseY - 7, 8, 6], [cx - 1, baseY - 12, 6, 5],
  ];
  blocks.forEach(([bx, by, w, h], i) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = st[1]; if (x < 1) c = st[0]; if (x > w - 2) c = st[2]; if (y === 0) c = st[0]; if (y > h - 2) c = st[3];
      if (hash2(bx + x, by - y, 631 + i) < 0.12) c = st[2];
      P(g, bx + x, by - y, c);
    }
    // dark gap seams between blocks
    for (let x = 0; x < w; x++) P(g, bx + x, by + 1, st[3]);
  });
  // dust / gravel at the base
  const rng = mulberry(632);
  for (let i = 0; i < 14; i++) { const dx = cx - 14 + Math.floor(rng() * 28); P(g, dx, baseY + 1 + Math.floor(rng() * 2), st[3]); }
  outline(g, RAMP.void); return g;
}

// STANDING BRAZIER — iron tripod bowl with ember flame (2-frame flicker @4fps). SOLID.
function fxStandingBrazier(frame: number): Grid {
  frame = frame || 0;
  const g = makeGrid(24, 40); const st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold; const cx = 12, baseY = 37;
  // three splayed iron legs
  ([[-6, -1], [0, 0], [6, 1]] as [number, number][]).forEach(([ox, dir]) => {
    for (let k = 0; k < 18; k++) { const lx = cx + ox + Math.round(dir * k * 0.4); P(g, lx, baseY - k, dir === 0 ? st[1] : st[2]); P(g, lx + 1, baseY - k, st[3]); }
  });
  // cross-brace ring
  for (let x = cx - 5; x <= cx + 6; x++) P(g, x, baseY - 10, st[3]);
  // the bowl (iso half-ellipse)
  for (let yy = 0; yy < 7; yy++) for (let xx = -9 + yy; xx <= 9 - yy; xx++) {
    let c = st[1]; if (xx < -7 + yy) c = st[0]; if (xx > 7 - yy) c = st[3]; if (yy === 0) c = st[2];
    P(g, cx + xx, baseY - 19 - yy, c);
  }
  for (let xx = -9; xx <= 9; xx++) P(g, cx + xx, baseY - 19, st[2]);    // rim
  // ember coals
  for (let xx = -6; xx <= 6; xx++) if (hash2(cx + xx, frame, 633) < 0.6) P(g, cx + xx, baseY - 20, em[2]);
  // flame (2-frame flicker)
  const sway = [0, 1][frame], tall = [0, 2][frame];
  for (let yy = 0; yy <= 12 + tall; yy++) {
    const t = yy / (12 + tall), hw = Math.round((1 - t) * 5);
    const sx = cx + Math.round(Math.sin(yy * 0.6 + frame * 2) * 1.2) + Math.round(sway * t);
    for (let xx = -hw; xx <= hw; xx++) { let c = em[1]; if (Math.abs(xx) >= hw - 1) c = em[2]; if (yy < 4 && Math.abs(xx) < 2) c = em[0]; P(g, sx + xx, baseY - 21 - yy, c); }
  }
  for (let yy = 2; yy <= 7 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (8 + tall)) * 2)); for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, baseY - 23 - yy, gd[0]); }
  if (frame === 1) P(g, cx + sway, baseY - 35 - tall, em[0]);
  // glow halo (dither)
  const rr = frame === 1 ? 10 : 8;
  for (let yy = -9; yy <= 3; yy++) for (let xx = -10; xx <= 10; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 5 && d < rr && (xx + yy + frame) % 2 === 0) P(g, cx + xx, baseY - 24 + yy, em[2]); }
  outline(g, RAMP.void); return g;
}

// BROKEN PILLAR — a fluted column snapped off jagged, on a square plinth. SOLID.
function fxBrokenPillar(): Grid {
  const g = makeGrid(24, 40); const st = RAMP.stone; const cx = 12, baseY = 37;
  // square plinth (iso cuboid)
  isoCuboid(g, cx - 8, baseY, 14, 5, 4, st);
  // the column shaft, snapped at ~70% with a jagged top
  const shaftBot = baseY - 5, shaftTop = 10;
  const breakProfile = [shaftTop + 2, shaftTop, shaftTop + 3, shaftTop + 1, shaftTop + 4];
  for (let x = -5; x <= 5; x++) {
    const col = x + 5;
    const topY = breakProfile[Math.min(breakProfile.length - 1, Math.floor((col / 10) * (breakProfile.length - 1)))] + ((col % 2) ? 1 : 0);
    for (let y = shaftBot; y >= topY; y--) {
      let c = st[1]; if (x < -3) c = st[0]; if (x > 3) c = st[2]; if (x > 4) c = st[3];
      // vertical fluting
      if (x % 2 === 0) c = (x < 0) ? st[0] : st[2];
      if (hash2(cx + x, y, 641) < 0.05) c = st[3];
      P(g, cx + x, y, c);
    }
    // dark broken-core top edge
    P(g, cx + x, topY - 1, st[3]);
  }
  // capital ring near the break
  for (let x = -6; x <= 6; x++) P(g, cx + x, shaftBot - 2, st[2]);
  // a chunk of fallen column lying at the base (right)
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) { let c = st[1]; if (i < 1) c = st[0]; if (i > 7) c = st[3]; if (j > 2) c = st[3]; P(g, cx + 4 + i, baseY - 1 - j, c); }
  outline(g, RAMP.void); return g;
}

// BONE PILE — a heap of bones, ribs & two skulls. Decorative, NOT solid.
function fxBonePile(): Grid {
  const g = makeGrid(30, 20); const bn = RAMP.bone; const cx = 15, baseY = 17;
  // mound of long bones crossing
  const rng = mulberry(651);
  for (let i = 0; i < 9; i++) {
    const bx = cx - 11 + Math.floor(rng() * 22), by = baseY - Math.floor(rng() * 6);
    const len = 5 + Math.floor(rng() * 5), ang = (rng() - 0.5) * 1.6;
    for (let k = 0; k < len; k++) { const x = Math.round(bx + Math.cos(ang) * k), y = Math.round(by - Math.sin(ang) * k * 0.5); P(g, x, y, i % 2 ? bn[1] : bn[2]); }
    // knuckle ends
    P(g, bx, by, bn[0]); P(g, Math.round(bx + Math.cos(ang) * len), Math.round(by - Math.sin(ang) * len * 0.5), bn[0]);
  }
  // two skulls nestled in the pile
  ([[cx - 6, baseY - 2], [cx + 4, baseY - 4]] as [number, number][]).forEach(([sx, sy]) => {
    fillRect(g, sx, sy - 3, 5, 4, bn[1]); P(g, sx, sy - 3, bn[0]);
    P(g, sx + 1, sy - 2, RAMP.void); P(g, sx + 3, sy - 2, RAMP.void);   // eye sockets
    P(g, sx + 2, sy, bn[3]); fillRect(g, sx + 1, sy + 1, 3, 1, bn[2]);  // jaw
  });
  outline(g, RAMP.void); return g;
}

// exported for the byte-diff + smoke (engine goes through SpriteCache/makeFixture)
export { fxSarcophagus, fxRubblePile, fxStandingBrazier, fxBrokenPillar, fxBonePile };
export const BRAZIER_FRAMES = 2;

// ── wall segments (64×56): flat face + sheared iso top cap ────────────────────
export type WallSide = 'nw' | 'ne';
export type WallMatKind = 'timber' | 'block' | 'cave';
export type WallVariant = 'plain' | 'window' | 'banner' | 'seam' | 'lantern';

export function makeWallSegment(
  side: WallSide,
  mat: WallMatKind,
  variant: WallVariant,
  opt: { accent?: readonly string[] } = {},
): Grid {
  const g = makeGrid(64, 56);
  const lit = side === 'nw';
  const ramp = mat === 'timber' ? RAMP.dirt : RAMP.stone;
  // base/face brightness shift by side
  const cBase = lit ? ramp[1] : ramp[2];
  const cHi = lit ? ramp[0] : ramp[1];
  const cSh = lit ? ramp[2] : ramp[3];
  const faceTop = 14, faceBot = 53;

  // ---- top cap (iso thickness), sheared toward the far corner ----
  for (let x = 0; x < 64; x++) {
    // NW recedes up-right → cap rises to the right; NE mirror
    const sx = lit ? x : 63 - x;
    const capLift = Math.floor(sx / 8);             // 0..7 px
    for (let k = 0; k < 6; k++) P(g, x, faceTop - 1 - k - capLift, k < 2 ? RAMP.stone[lit ? 1 : 2] : (mat === 'timber' ? RAMP.dirt[3] : RAMP.stone[3]));
    // void cap edge
    P(g, x, faceTop - 6 - capLift, RAMP.void);
  }

  // ---- face ----
  for (let y = faceTop; y <= faceBot; y++) for (let x = 0; x < 64; x++) {
    let c = cBase;
    if (x < 3) c = lit ? cHi : ramp[1];             // left edge lightest
    else if (x > 60) c = cSh;
    // material texture
    if (mat === 'timber') {
      if ((y - faceTop) % 4 === 0) c = cSh;          // plank seams
      if (hash2(x, y, 71) < 0.04) c = cSh;
    } else if (mat === 'block') {
      const course = Math.floor((y - faceTop) / 6);
      if ((y - faceTop) % 6 === 0) c = cSh;          // course line
      if ((x + (course % 2) * 6) % 12 === 0) c = cSh; // vertical joints (staggered)
      if (hash2(x, y, 72) < 0.03) c = lit ? ramp[1] : ramp[3];
    } else { // cave — raw rock
      const h = hash2(x, y, 73);
      if (h < 0.10) c = cSh;
      else if (h < 0.14) c = cHi;
      if (hash2(x, y, 74) < 0.02) c = ramp[3];
    }
    P(g, x, y, c);
  }
  // baseboard
  for (let x = 0; x < 64; x++) { P(g, x, faceBot, ramp[3]); P(g, x, faceBot - 1, cSh); }

  // ---- variants ----
  if (variant === 'window') {
    const wx = 24, wy = 24, ww = 16, wh = 14;
    for (let j = 0; j < wh; j++) for (let i = 0; i < ww; i++) {
      let c = RAMP.ember[1];
      if (i === 0 || j === 0 || i === ww - 1 || j === wh - 1) c = RAMP.ember[0];
      if ((i + j) % 2 === 0 && hash2(i, j, 75) < 0.25) c = RAMP.ember[0];
      P(g, wx + i, wy + j, c);
    }
    // bone frame + mullions
    for (let i = -1; i <= ww; i++) { P(g, wx + i, wy - 1, RAMP.bone[2]); P(g, wx + i, wy + wh, RAMP.bone[3]); }
    for (let j = -1; j <= wh; j++) { P(g, wx - 1, wy + j, RAMP.bone[2]); P(g, wx + ww, wy + j, RAMP.bone[3]); }
    for (let j = 0; j < wh; j++) P(g, wx + (ww >> 1), wy + j, RAMP.bone[3]);
    for (let i = 0; i < ww; i++) P(g, wx + i, wy + (wh >> 1), RAMP.bone[3]);
    // warm spill
    for (let i = -2; i < ww + 2; i++) P(g, wx + i, wy + wh + 1, RAMP.ember[2]);
  } else if (variant === 'banner') {
    const acc = opt.accent || RAMP.drift;
    const bx = 26, by = faceTop + 2, bw = 12, bh = 30;
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      let c = acc[2];
      if (i === 0) c = acc[1]; if (i === bw - 1) c = acc[3];
      P(g, bx + i, by + j, c);
    }
    for (let i = -1; i <= bw; i++) P(g, bx + i, by - 1, RAMP.dirt[3]);   // rod
    // pennant tail (notched bottom)
    for (let i = 0; i < bw; i++) { const t = Math.abs(i - (bw - 1) / 2) / ((bw - 1) / 2); for (let k = 0; k < Math.round((1 - t) * 5); k++) P(g, bx + i, by + bh + k, acc[3]); }
    // emblem
    P(g, bx + (bw >> 1), by + 10, acc[0]); P(g, bx + (bw >> 1) - 1, by + 11, acc[0]); P(g, bx + (bw >> 1) + 1, by + 11, acc[0]); P(g, bx + (bw >> 1), by + 12, acc[1]);
  } else if (variant === 'seam') {
    // glinting gold seam across raw rock
    let x = 8, y = faceTop + 6;
    for (let k = 0; k < 40; k++) {
      P(g, x, y, RAMP.gold[1]); if (hash2(x, y, 76) < 0.5) P(g, x, y + 1, RAMP.gold[2]);
      if (hash2(x, y, 77) < 0.3) P(g, x, y - 1, RAMP.gold[0]);          // glint
      x += 1 + (hash2(k, 1, 78) < 0.4 ? 1 : 0); y += hash2(k, 2, 78) < 0.5 ? 1 : (hash2(k, 3, 78) < 0.5 ? -1 : 0);
      if (x > 58) break;
      y = Math.max(faceTop + 2, Math.min(faceBot - 3, y));
    }
  } else if (variant === 'lantern') {
    // hanging miner's lantern (ember)
    const lx = 32, ly = faceTop + 6;
    for (let k = 0; k < 5; k++) P(g, lx, faceTop - 1 - k < 0 ? 0 : faceTop - 1 + k, RAMP.dirt[3]); // bracket down
    P(g, lx, ly - 3, RAMP.dirt[3]);
    for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) {
      let c = RAMP.ember[1]; if (j === 0 || j === 7) c = RAMP.dirt[3]; else if (i <= -2) c = RAMP.ember[0]; else if (i >= 2) c = RAMP.ember[2];
      if ((j === 1 || j === 6) && Math.abs(i) === 3) c = RAMP.dirt[3];
      P(g, lx + i, ly + j, c);
    }
    P(g, lx, ly + 3, RAMP.ember[0]);
    // glow dither
    for (let yy = -4; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 4 && d < 8 && (xx + yy) % 2 === 0) P(g, lx + xx, ly + 2 + yy, RAMP.ember[2]); }
  }

  outline(g, RAMP.void);
  return g;
}

// ── wall set v2: skewed parallelogram faces (DS walls.js port) ─────────────────
// One segment = one floor tile's back edge: 32 wide, bottom drops 16 across.
// Face 48 tall + 6px cap + 1px void cap edge; cell 32×72. Sides have NO
// outline so segments tile seamlessly at +32x,±16y along the iso diagonal.

const W2 = { W: 32, H: 72, B: 55, FACE: 48, CAP: 6 };

function wall2BottomY(side: WallSide, x: number): number {
  return side === 'ne'
    ? W2.B + Math.round((x * 16) / 31)
    : W2.B + Math.round(((31 - x) * 16) / 31);
}

/** place a wall-relative feature pixel: h = rows up from the sloped bottom */
function wfP(g: Grid, side: WallSide, x: number, h: number, c: string) {
  if (x < 0 || x > 31) return;
  P(g, x, wall2BottomY(side, x) - h, c);
}

export function makeWall2(
  side: WallSide,
  mat: WallMatKind,
  variant: WallVariant,
  opt: { accent?: readonly string[] } = {},
): Grid {
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
    let x = 3, h = 8;
    const rng = mulberry(206);
    for (let k = 0; k < 44; k++) {
      wfP(g, side, x, h, RAMP.gold[1]);
      if (rng() < 0.5) wfP(g, side, x, h - 1, RAMP.gold[2]);
      if (rng() < 0.3) wfP(g, side, x, h + 1, RAMP.gold[0]);         // glint
      x += 1; h += rng() < 0.5 ? 1 : (rng() < 0.5 ? -1 : 0);
      if (x > 29) break;
      h = Math.max(4, Math.min(W2.FACE - 5, h));
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

  // NO global outline (left/right must stay open to tile)
  return g;
}

/** corner wedge (16×72): caps the north junction where nw & ne meet */
export function makeWall2Corner(mat: WallMatKind): Grid {
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

// ── fixtures ───────────────────────────────────────────────────────────────────
export type FixtureSpriteKind =
  | 'counter' | 'vat' | 'shelf' | 'table' | 'barrel'
  | 'cage' | 'anvil' | 'rug' | 'wheelDisc'
  | 'goldVein' | 'goldVeinEmpty' | 'hearth' | 'oreCart' | 'herbrack'
  | 'exchange' | 'mirror'
  // crypt pack (dungeon fixtures): brazier flame is a 2f flicker @4fps
  | 'sarcophagus' | 'rubblePile' | 'standingBrazier' | 'brokenPillar' | 'bonePile';

// generic iso cuboid: front (lit) + right side (shadow) + top
function isoCuboid(g: Grid, x0: number, baseY: number, w: number, h: number, dep: number, ramp: readonly string[]) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {           // front
    let c = ramp[1]; if (x < 1) c = ramp[0]; if (x > w - 2) c = ramp[2];
    P(g, x0 + x, baseY - y, c);
  }
  for (let d = 1; d <= dep; d++) for (let y = 0; y < h; y++) {        // right side
    P(g, x0 + w - 1 + d, baseY - y - Math.floor(d / 2), d >= dep - 1 ? ramp[3] : ramp[2]);
  }
  for (let d = 0; d <= dep; d++) for (let x = 0; x < w; x++) {        // top
    P(g, x0 + x + d, baseY - h - Math.floor(d / 2), d === 0 || x === 0 ? ramp[0] : ramp[1]);
  }
}

function fxCounter(): Grid {
  const g = makeGrid(48, 32); const r = RAMP.dirt; const baseY = 29, x0 = 3;
  isoCuboid(g, x0, baseY, 38, 16, 6, r);
  // top surface lighter plank
  for (let d = 0; d <= 6; d++) for (let x = 0; x < 38; x++) if ((x + d) % 6 === 0) P(g, x0 + x + d, baseY - 16 - Math.floor(d / 2), r[2]);
  // gold till glint
  P(g, x0 + 30, baseY - 17, RAMP.gold[0]); P(g, x0 + 31, baseY - 18, RAMP.gold[1]); P(g, x0 + 30, baseY - 16, RAMP.gold[2]);
  // panel seams on front
  for (let x = 8; x < 38; x += 10) for (let y = 0; y < 15; y++) P(g, x0 + x, baseY - y, r[3]);
  outline(g, RAMP.void); return g;
}

function fxShelf(): Grid {
  const g = makeGrid(40, 40); const r = RAMP.dirt; const x0 = 4, top = 8;
  // frame
  for (let j = 0; j < 28; j++) { P(g, x0, top + j, r[2]); P(g, x0 + 30, top + j, r[3]); }
  for (const sy of [top, top + 9, top + 18, top + 27]) for (let i = 0; i <= 30; i++) P(g, x0 + i, sy, r[3]);
  // bottles (top shelf)
  ([[RAMP.drift, 6], [RAMP.ember, 11], [RAMP.water, 16], [RAMP.grass, 21]] as [readonly string[], number][]).forEach(([col, bx]) => {
    P(g, x0 + bx, top + 3, col[1]); P(g, x0 + bx, top + 4, col[2]); P(g, x0 + bx, top + 5, col[2]); P(g, x0 + bx, top + 2, RAMP.bone[2]);
  });
  // coffer (mid)
  for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) { let c = RAMP.dirt[1]; if (i === 0) c = RAMP.dirt[0]; if (i === 11) c = RAMP.dirt[2]; if (j === 0) c = RAMP.gold[2]; P(g, x0 + 8 + i, top + 11 + j, c); }
  P(g, x0 + 14, top + 13, RAMP.gold[0]);
  // cloth bolts (lower)
  ([[RAMP.blood, 6], [RAMP.drift, 13], [RAMP.gold, 20]] as [readonly string[], number][]).forEach(([col, bx]) => {
    for (let j = 0; j < 6; j++) { P(g, x0 + bx, top + 20 + j, col[1]); P(g, x0 + bx + 1, top + 20 + j, col[2]); }
  });
  outline(g, RAMP.void); return g;
}

function fxTable(): Grid {
  const g = makeGrid(40, 32); const r = RAMP.dirt; const cx = 20, ty = 16;
  // round top (iso ellipse)
  for (let yy = -5; yy <= 5; yy++) for (let xx = -13; xx <= 13; xx++) { if ((xx / 13) ** 2 + (yy / 5) ** 2 > 1) continue; let c = r[1]; if (yy < -1) c = r[0]; if (yy > 2) c = r[2]; P(g, cx + xx, ty + yy, c); }
  for (let xx = -13; xx <= 13; xx++) { const t = 1 - Math.abs(xx) / 13; const ey = ty + Math.round(5 * t); for (let k = 1; k <= 3; k++) P(g, cx + xx, ey + k, r[3]); } // rim
  // legs
  P(g, cx - 8, ty + 8, r[3]); P(g, cx - 8, ty + 9, r[3]); P(g, cx + 8, ty + 8, r[3]); P(g, cx + 8, ty + 9, r[3]); P(g, cx, ty + 11, r[3]); P(g, cx, ty + 12, r[3]);
  // mug
  P(g, cx + 3, ty - 2, RAMP.dirt[2]); P(g, cx + 3, ty - 3, RAMP.dirt[1]); fillRect(g, cx + 2, ty - 4, 3, 2, RAMP.dirt[1]); P(g, cx + 5, ty - 3, RAMP.dirt[2]); P(g, cx + 3, ty - 5, RAMP.bone[1]);
  outline(g, RAMP.void); return g;
}

function fxBarrel(): Grid {
  const g = makeGrid(20, 28); const r = RAMP.dirt; const x0 = 3, baseY = 25;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 12; i++) { const t = Math.abs(i - 5.5) / 6; let c = r[1]; if (i <= 1) c = r[0]; if (i >= 9) c = r[2]; if (t > 0.85) c = r[3]; if (j === 0 || j === 21) c = r[3]; if (j === 5 || j === 16) c = r[3]; P(g, x0 + i, baseY - 21 + j, c); }
  // top rim ellipse
  for (let xx = 0; xx < 12; xx++) { const t = Math.abs(xx - 5.5) / 6; if (t < 0.92) P(g, x0 + xx, baseY - 21 - Math.round((1 - t) * 2), r[2]); }
  P(g, x0 + 5, baseY - 24, r[1]);
  outline(g, RAMP.void); return g;
}

function fxVat(liquid: string): Grid {
  const g = makeGrid(28, 28); const r = RAMP.dirt; const lr = RAMP_BY_NAME[liquid] ?? RAMP.drift; const cx = 14, baseY = 25;
  // wooden tub
  for (let j = 0; j < 16; j++) for (let i = -10; i <= 10; i++) { const t = Math.abs(i) / 10; if (t > 0.95 - j * 0.005) continue; let c = r[1]; if (i < -7) c = r[0]; if (i > 7) c = r[2]; if (j % 6 === 5) c = r[3]; if (Math.abs(i) >= 9) c = r[3]; P(g, cx + i, baseY - j, c); }
  // liquid surface (iso ellipse) near top
  for (let yy = -3; yy <= 3; yy++) for (let xx = -8; xx <= 8; xx++) { if ((xx / 8) ** 2 + (yy / 3) ** 2 > 1) continue; let c = lr[2] || lr[1]; if (yy < -1) c = lr[1]; if (yy <= -2) c = lr[0]; if ((xx + yy) % 3 === 0 && yy > 0) c = lr[3] || lr[2]; P(g, cx + xx, baseY - 14 + yy, c); }
  // steam
  P(g, cx - 2, baseY - 18, RAMP.bone[3]); P(g, cx + 1, baseY - 20, RAMP.bone[3]); P(g, cx - 1, baseY - 22, RAMP.bone[3]);
  // rim
  for (let xx = -9; xx <= 9; xx++) { const t = Math.abs(xx) / 9; if (t < 0.96) P(g, cx + xx, baseY - 16 - Math.round((1 - t) * 1), r[2]); }
  outline(g, RAMP.void); return g;
}

function fxCage(): Grid {
  const g = makeGrid(26, 32); const r = RAMP.stone; const x0 = 3, top = 6, w = 18, h = 22;
  // base
  for (let i = 0; i < w; i++) { P(g, x0 + i, top + h, r[3]); P(g, x0 + i, top + h - 1, r[2]); }
  // dome top
  for (let xx = 0; xx < w; xx++) { const t = Math.abs(xx - (w - 1) / 2) / ((w - 1) / 2); const yy = top - Math.round((1 - t) * 4); for (let k = yy; k < top + 1; k++) P(g, x0 + xx, k, r[2]); }
  P(g, x0 + (w >> 1), top - 5, r[3]); P(g, x0 + (w >> 1), top - 6, r[3]); // ring
  // vertical bars
  for (let i = 0; i <= w; i += 3) for (let j = top; j < top + h; j++) P(g, x0 + i, j, r[3]);
  for (let i = 0; i < w; i++) { P(g, x0 + i, top, r[3]); P(g, x0 + i, top + Math.round(h / 2), r[3]); }
  // glowing wisp inside
  const wx = x0 + (w >> 1), wy = top + 12;
  P(g, wx, wy, RAMP.drift[0]); P(g, wx - 1, wy, RAMP.drift[1]); P(g, wx + 1, wy, RAMP.drift[1]); P(g, wx, wy - 1, RAMP.drift[1]); P(g, wx, wy + 1, RAMP.drift[2]);
  for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy) % 2 === 0) P(g, wx + xx, wy + yy, RAMP.drift[2]);
  outline(g, RAMP.void); return g;
}

function fxAnvil(): Grid {
  const g = makeGrid(28, 24); const r = RAMP.stone; const baseY = 21, cx = 14;
  // stump
  for (let j = 0; j < 7; j++) for (let i = -5; i <= 5; i++) { let c = RAMP.dirt[1]; if (i < -3) c = RAMP.dirt[0]; if (i > 3) c = RAMP.dirt[2]; P(g, cx + i, baseY - j, c); }
  // anvil body
  for (let i = -6; i <= 6; i++) P(g, cx + i, baseY - 9, r[1]);            // base top
  for (let i = -4; i <= 4; i++) P(g, cx + i, baseY - 8, r[2]);           // waist
  for (let i = -7; i <= 9; i++) { let c = r[1]; if (i < -5) c = r[0]; if (i > 6) c = r[2]; P(g, cx + i, baseY - 12, c); P(g, cx + i, baseY - 11, c); } // top face + horn
  for (let i = 7; i <= 11; i++) P(g, cx + i, baseY - 11, r[2]);          // horn taper
  // gold spark
  P(g, cx + 2, baseY - 14, RAMP.gold[0]); P(g, cx + 3, baseY - 15, RAMP.gold[1]); P(g, cx + 1, baseY - 15, RAMP.ember[0]);
  outline(g, RAMP.void); return g;
}

function fxWheelStand(): Grid {
  const g = makeGrid(34, 40); const cx = 17, wy = 14, R = 12;
  const seg = [RAMP.blood[1], RAMP.ember[1], RAMP.gold[1], RAMP.water[0], RAMP.drift[2], RAMP.grass[1]];
  // stand post + feet
  for (let j = 0; j < 14; j++) { P(g, cx, wy + R + j, RAMP.dirt[2]); P(g, cx + 1, wy + R + j, RAMP.dirt[3]); }
  for (let i = -6; i <= 6; i++) P(g, cx + i, wy + R + 13, RAMP.dirt[3]);
  // wheel
  for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) { const d = Math.sqrt(xx * xx + yy * yy); if (d > R) continue; if (d > R - 2) { P(g, cx + xx, wy + yy, RAMP.dirt[3]); continue; } const ang = (Math.atan2(yy, xx) + Math.PI) / (Math.PI * 2); P(g, cx + xx, wy + yy, seg[Math.floor(ang * 6) % 6]); }
  P(g, cx, wy, RAMP.bone[1]);                                 // hub
  P(g, cx, wy - R - 1, RAMP.bone[0]); P(g, cx, wy - R, RAMP.bone[1]);   // pointer
  outline(g, RAMP.void); return g;
}

function fxHearth(frame = 0): Grid {
  const g = makeGrid(36, 36); const r = RAMP.stone; const cx = 18, baseY = 33;
  // stone surround
  for (let j = 0; j < 28; j++) for (let i = -15; i <= 15; i++) {
    const inner = Math.abs(i) <= 9 && j < 18;
    if (inner) continue;
    if (Math.abs(i) > 15 || j > 27) continue;
    let c = r[1]; if (i < -11) c = r[0]; if (i > 11) c = r[2];
    if ((j % 6 === 0) || ((i + (Math.floor(j / 6) % 2) * 5) % 10 === 0)) c = r[3];
    P(g, cx + i, baseY - j, c);
  }
  // dark firebox
  for (let j = 0; j < 16; j++) for (let i = -8; i <= 8; i++) if (Math.abs(i) <= 8 && j < 16) P(g, cx + i, baseY - j, RAMP.void);
  // logs
  for (let i = -6; i <= 6; i++) P(g, cx + i, baseY - 1, RAMP.dirt[3]);
  P(g, cx - 4, baseY - 2, RAMP.dirt[2]); P(g, cx + 4, baseY - 2, RAMP.dirt[2]);
  // ember fire (flicker)
  const sway = [0, 1, -1][frame], tall = [0, 1, 2][frame];
  for (let yy = 0; yy <= 12 + tall; yy++) { const t = yy / (12 + tall); const hw = Math.round((1 - t) * 6); const sx = cx + Math.round(Math.sin(yy * 0.5 + frame) * 1.1) + Math.round(sway * t); for (let xx = -hw; xx <= hw; xx++) { let c = RAMP.ember[1]; if (Math.abs(xx) >= hw - 1) c = RAMP.ember[2]; if (yy < 5 && Math.abs(xx) < 2) c = RAMP.ember[0]; P(g, sx + xx, baseY - 2 - yy, c); } }
  for (let yy = 2; yy <= 7 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (8 + tall)) * 2)); for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, baseY - 4 - yy, RAMP.gold[0]); }
  // spark + glow
  if (frame !== 1) P(g, cx + sway, baseY - 16 - tall, RAMP.ember[0]);
  for (let yy = -10; yy <= 2; yy++) for (let xx = -10; xx <= 10; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 7 && d < 10 && (xx + yy + frame) % 2 === 0 && baseY - 4 + yy > 14) P(g, cx + xx, baseY - 6 + yy, RAMP.ember[2]); }
  outline(g, RAMP.void); return g;
}

function fxRug(accent: readonly string[]): Grid {
  const g = makeGrid(56, 30); const cx = 28, cy = 15; const acc = accent || RAMP.drift;
  for (let yy = -13; yy <= 13; yy++) for (let xx = -26; xx <= 26; xx++) {
    if ((xx / 26) ** 2 + (yy / 13) ** 2 > 1) continue;
    const e = (xx / 26) ** 2 + (yy / 13) ** 2;
    let c = RAMP.dirt[2];
    if (e > 0.78) c = acc[2];                       // accent border
    else if (e > 0.66) c = acc[3];
    else if (e < 0.18) c = acc[3];                  // center medallion
    else if (e < 0.28) c = RAMP.dirt[1];
    if ((xx + yy) % 6 === 0 && e < 0.6 && e > 0.3) c = RAMP.dirt[1]; // weave
    P(g, cx + xx, cy + yy, c);
  }
  // fringe
  for (let xx = -26; xx <= 26; xx += 3) { P(g, cx + xx, cy + Math.round(13 * Math.sqrt(Math.max(0, 1 - (xx / 26) ** 2))) + 1, RAMP.dirt[3]); }
  outline(g, RAMP.void); return g;
}

function fxGoldVein(state: 'rich0' | 'rich1' | 'spent'): Grid {
  const g = makeGrid(28, 26); const r = RAMP.stone; const cx = 14, baseY = 23;
  for (let yy = 0; yy <= 18; yy++) for (let xx = -11; xx <= 11; xx++) {
    const t = yy / 18; const hw = Math.round(11 * (1 - Math.abs(t - 0.5) * 0.7));
    if (Math.abs(xx) > hw) continue;
    let c = r[1]; if (xx < -hw + 2) c = r[0]; if (xx > hw - 2) c = r[3]; if (yy > 14) c = r[3];
    if (hash2(cx + xx, baseY - yy, 81) < 0.08) c = r[2];
    P(g, cx + xx, baseY - yy, c);
  }
  if (state === 'spent') {
    // hollowed dark pockets, no gold
    ([[-4, 10], [3, 7], [0, 13], [-6, 6], [5, 12]] as [number, number][]).forEach(([ox, oy]) => { for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) P(g, cx + ox + xx, baseY - oy + yy, RAMP.void); P(g, cx + ox, baseY - oy, RAMP.stone[3]); });
  } else {
    const spark = state === 'rich1';
    // bright gold seams
    const seams: [number, number, number, number][] = [[-7, 4, 1, 1], [-2, 6, 1, -1], [4, 5, 1, 1], [-5, 11, 1, 0], [2, 12, 1, 1]];
    seams.forEach(([sx, sy, dx, dy], i) => { let x = cx + sx, y = baseY - sy; for (let k = 0; k < 6; k++) { P(g, x, y, RAMP.gold[1]); if (k % 2 === 0) P(g, x, y + 1, RAMP.gold[2]); if (spark && (i + k) % 4 === 0) P(g, x, y - 1, RAMP.gold[0]); x += dx; y -= dy * (k % 2); } });
    // a couple of bright nuggets with glint
    P(g, cx - 3, baseY - 8, RAMP.gold[0]); P(g, cx - 2, baseY - 8, RAMP.gold[1]); if (spark) P(g, cx - 3, baseY - 9, RAMP.bone[0]);
    P(g, cx + 5, baseY - 10, RAMP.gold[0]); if (spark) P(g, cx + 6, baseY - 11, RAMP.bone[0]);
  }
  outline(g, RAMP.void); return g;
}

function fxOreCart(): Grid {
  const g = makeGrid(36, 28); const r = RAMP.dirt; const baseY = 25, x0 = 4;
  // rails under
  for (let i = 0; i < 36; i++) { P(g, i, baseY, RAMP.stone[3]); P(g, i, baseY - 1, RAMP.stone[2]); }
  for (let i = 2; i < 36; i += 5) P(g, i, baseY + 1, RAMP.dirt[3]);       // ties
  // wheels
  ([[x0 + 6, baseY - 2], [x0 + 22, baseY - 2]] as [number, number][]).forEach(([wx, wy]) => { for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 5) P(g, wx + xx, wy + yy, RAMP.stone[3]); P(g, wx, wy, RAMP.stone[2]); });
  // cart body (trapezoid bucket)
  for (let j = 0; j < 12; j++) { const w = 26 - j; const sx = x0 + 2 + Math.floor((26 - w) / 2); for (let i = 0; i < w; i++) { let c = r[1]; if (i < 1) c = r[0]; if (i > w - 2) c = r[2]; if (j === 0) c = r[2]; P(g, sx + i, baseY - 6 - j, c); } }
  // band + rivets
  for (let i = 0; i < 26; i++) P(g, x0 + 2 + i, baseY - 12, RAMP.dirt[3]);
  // raw gold ore heaped on top
  for (let i = 0; i < 9; i++) { const ox = x0 + 6 + i * 2, oy = baseY - 18 - (i % 2); P(g, ox, oy, RAMP.gold[1]); P(g, ox + 1, oy, RAMP.gold[2]); P(g, ox, oy - 1, RAMP.gold[0]); }
  for (let i = 0; i < 5; i++) P(g, x0 + 9 + i * 3, baseY - 20, RAMP.stone[2]);
  outline(g, RAMP.void); return g;
}

// Drift Mirror — tall standing mirror, bone-and-iron frame, 32×48, bottom-center
// anchor (16,47). The glass is NOT reflective: it swirls dark with drift-ramp
// motes ("what the Drift could make of you"). 2-frame ripple. Stands in the
// Dyeworks (the avatar try-on anchor).
export function fxMirror(frame = 0): Grid {
  const g = makeGrid(32, 48);
  const bn = RAMP.bone, st = RAMP.stone, dr = RAMP.drift;
  const cx = 16, baseY = 46;

  // iron feet / splayed base
  for (let x = cx - 8; x <= cx + 8; x++) { P(g, x, baseY, st[3]); if (Math.abs(x - cx) > 4) P(g, x, baseY - 1, st[2]); }
  P(g, cx - 8, baseY - 1, st[3]); P(g, cx + 8, baseY - 1, st[3]);
  // base post
  for (let y = baseY - 4; y <= baseY - 1; y++) for (let x = cx - 2; x <= cx + 2; x++) P(g, x, y, x < cx ? st[1] : st[3]);

  // bone-and-iron frame (rounded-arch top), glass cavity y 6..40, x 6..25
  const gx0 = 6, gx1 = 25, gTop = 6, gBot = 40, arch = 6;
  function inGlass(x: number, y: number): boolean {
    if (x < gx0 || x > gx1 || y > gBot) return false;
    if (y >= gTop + arch) return true;
    const mx = (gx0 + gx1) / 2;
    return (x - mx) * (x - mx) + (y - gTop - arch) * (y - gTop - arch) <= (arch + 3.5) * (arch + 3.5) * ((gx1 - gx0) / 2 / (arch + 3.5)) * ((gx1 - gx0) / 2 / (arch + 3.5));
  }
  // frame: a 3px band around the glass cavity, bone outer + iron inner, with arch
  for (let y = 1; y <= baseY - 4; y++) for (let x = 2; x <= 29; x++) {
    if (inGlass(x, y)) continue;
    const nearX = x >= gx0 - 4 && x <= gx1 + 4, nearY = y >= gTop - 4 && y <= gBot + 4;
    if (!nearX || !nearY) continue;
    // inner iron ring (touching glass) vs outer bone
    let touchesGlass = false;
    for (let oy = -1; oy <= 1 && !touchesGlass; oy++) for (let ox = -1; ox <= 1; ox++) if (inGlass(x + ox, y + oy)) { touchesGlass = true; break; }
    let c: string;
    if (touchesGlass) c = st[3];                                  // iron lip on the glass
    else {
      c = bn[1];
      if (x < gx0 - 1) c = bn[0];                                  // moonlit left
      if (x > gx1 + 1) c = bn[2];                                  // shadow right
      if (y < gTop) c = bn[0];
      if (hash2(x, y, 51) < 0.10) c = bn[2];                       // bone grain
      // iron rivets at the corners + arch crown
      if ((Math.abs(x - gx0) < 2 || Math.abs(x - gx1) < 2) && (Math.abs(y - gBot) < 2)) c = st[2];
    }
    P(g, x, y, c);
  }
  // arch crown ornament (a small drift crystal set in the bone)
  P(g, cx, gTop - 4, dr[0]); P(g, cx, gTop - 3, dr[1]); P(g, cx - 1, gTop - 2, dr[2]); P(g, cx + 1, gTop - 2, dr[2]); P(g, cx, gTop - 2, dr[1]);

  // the glass: dark swirling Drift (NOT reflective), 2-frame ripple
  const mx = (gx0 + gx1) / 2, my = (gTop + arch + gBot) / 2;
  for (let y = gTop - arch; y <= gBot; y++) for (let x = gx0; x <= gx1; x++) {
    if (!inGlass(x, y)) continue;
    const dx = x - mx, dy = (y - my) * 1.4;
    const rad = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx);
    // swirl field: phase shifts between frames for the ripple
    const swirl = Math.sin(ang * 2 + rad * 0.5 - frame * 1.7);
    let c: string;
    if (swirl > 0.55) c = dr[2];
    else if (swirl > 0.0) c = dr[3];
    else c = RAMP.void;
    // dithered mid tone so it reads as depth, not flat
    if (c === dr[3] && (x + y) % 2 === 0) c = dr[4] || dr[3];
    P(g, x, y, c);
  }
  // floating drift motes in the glass (drift up, reposition per frame)
  const mr = mulberry(frame + 3);
  for (let i = 0; i < 9; i++) {
    let mxx = gx0 + 1 + Math.floor(mr() * (gx1 - gx0 - 1));
    let myy = gTop + arch - 2 + Math.floor(mr() * (gBot - gTop - arch));
    myy -= frame * 2;                                              // rise between frames
    if (!inGlass(mxx, myy)) continue;
    const bright = i % 3 === 0;
    P(g, mxx, myy, bright ? dr[0] : dr[1]);
    if (bright) { P(g, mxx, myy - 1, dr[2]); }
  }
  // a faint pale "figure" hint deep in the glass (what the Drift could make of you)
  const fy = my + (frame ? 1 : 0);
  for (let y = fy - 6; y <= fy + 6; y++) { const w = y < fy - 2 ? 1 : 2; for (let x = mx - w; x <= mx + w; x++) if (inGlass(x, y) && hash2(x, y, 60 + frame) < 0.5) P(g, x, y, dr[2]); }
  P(g, mx, fy - 5, dr[1]); P(g, mx - 1, fy - 4, dr[1]); P(g, mx + 1, fy - 4, dr[1]);  // shoulders/head hint

  outline(g, RAMP.void);
  return g;
}

/** dispatch by engine fixture kind (accent hex → DS liquid/ramp; frame for
 *  animated kinds: goldVein sparkle 2f, hearth flame 3f) */
export function makeFixture(kind: FixtureSpriteKind, accent: string, frame = 0): Grid {
  switch (kind) {
    case 'counter':       return fxCounter();
    case 'shelf':         return fxShelf();
    case 'table':         return fxTable();
    case 'barrel':        return fxBarrel();
    case 'vat':           return fxVat(ACCENT_LIQUID[accent] ?? 'drift');
    case 'cage':          return fxCage();
    case 'anvil':         return fxAnvil();
    case 'wheelDisc':     return fxWheelStand();
    case 'rug':           return fxRug(ACCENT_RAMP[accent] ?? RAMP.drift);
    case 'goldVein':      return fxGoldVein(frame % 2 ? 'rich1' : 'rich0');
    case 'goldVeinEmpty': return fxGoldVein('spent');
    case 'hearth':        return fxHearth(frame % 3);
    case 'oreCart':       return fxOreCart();
    case 'exchange':      return drawExchangeCounter(frame % 2);
    case 'herbrack':      return drawHerbRack();
    case 'mirror':        return fxMirror(frame % 2);
    case 'sarcophagus':     return fxSarcophagus();
    case 'rubblePile':      return fxRubblePile();
    case 'standingBrazier': return fxStandingBrazier(frame % BRAZIER_FRAMES);
    case 'brokenPillar':    return fxBrokenPillar();
    case 'bonePile':        return fxBonePile();
  }
}

// kind → cell dims, anim table (generic name → [sheet anim, frames]) and
// hurt-flash tint, all per the design package's beasts metadata.
// (exported for the headless smoke test — engine code goes through SpriteCache)
// ── Frontier Expansion: new mob species + camp mini-bosses ───────────────────
// Ported from _gen/mobs.js + _gen/minibosses.js + _gen/deaths.js. Same beasts.js
// rig (drawX(facing, anim, f) → grid; ell/shadeMass/spike/moteBurst reused).
// The death sequences are authored (deaths.js): solids 1px-outlined, then
// outline-free motes/scatter painted after, like moteBurst.

/* shared death helpers (ported from deaths.js) */
function deathMound(g: Grid, cx: number, baseY: number, halfW: number, height: number, ramp: string[], seed: number, fill = 0.8) {
  for (let yy = 0; yy < height; yy++) {
    const t = yy / height;
    const w = Math.round(halfW * (1 - t * t * 0.85));
    for (let x = cx - w; x <= cx + w; x++) {
      if (hash2(x, baseY - yy, seed) > fill) continue;
      let c = ramp[1];
      if (x < cx - w + 2) c = ramp[0];
      if (x > cx + w - 2) c = ramp[3];
      if (yy === 0) c = ramp[3];
      if (hash2(x, baseY - yy, seed + 7) < 0.16) c = ramp[2];
      P(g, x, baseY - yy, c);
    }
  }
}
function deathScatter(g: Grid, cx: number, baseY: number, spread: number, n: number, ramp: string[], seed: number) {
  const r = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.round(cx + (r() - 0.5) * spread * 2);
    const y = baseY - Math.floor(r() * 2);
    P(g, x, y, r() < 0.5 ? ramp[2] : ramp[3]);
  }
}
function leanOf(dir: number) { return [0, 1, 2, 1, 0][dir]; }

// BOGWRETCH death (4f) — collapses, sac deflates, dissolves to drift motes
function bogwretchDeath(facing: IsoFacing, f: number): Grid {
  const g = makeGrid(32, 40); const wa = RAMP.water, gr = RAMP.grass, bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2; const cx = 16 + leanOf(dir), groundY = 38;
  if (f === 0) {
    shadeMass(g, cx, groundY - 4, profile ? 9 : 8, 4, wa, 110);
    if (!back) { const hx = cx + (profile ? 5 : 0); shadeMass(g, hx, groundY - 5, 4, 3, wa, 112); P(g, hx + (profile ? 2 : -2), groundY - 6, dr[3]); if (!profile) P(g, hx + 2, groundY - 6, dr[3]); for (let i = -3; i <= 3; i++) P(g, hx + i, groundY - 1, wa[3]); }
    P(g, cx - 8, groundY - 1, wa[2]); P(g, cx + 8, groundY - 1, wa[2]);
    outline(g, RAMP.void); P(g, cx, groundY - 8, dr[3]);
  } else if (f === 1) {
    ell(g, cx, groundY - 2, 11, 3, (x, y, d, dx, dy) => { let c = wa[2]; if (dx + dy < -0.4) c = wa[1]; if (d > 0.7) c = wa[3]; if (hash2(x, y, 113) < 0.18) c = gr[2]; P(g, x, y, c); });
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 6, 8, 0.5, 114);
  } else if (f === 2) {
    for (let x = cx - 9; x <= cx + 9; x++) { if (hash2(x, 0, 115) < 0.7) P(g, x, groundY - 1, wa[3]); if (hash2(x, 1, 115) < 0.3) P(g, x, groundY - 2, wa[2]); }
    P(g, cx - 4, groundY - 1, bn[3]); P(g, cx + 3, groundY - 1, bn[3]);
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 9, 12, 0.7, 116);
  } else {
    for (let x = cx - 6; x <= cx + 6; x++) if (hash2(x, 2, 117) < 0.35) P(g, x, groundY - 1, wa[3]);
    moteBurst(g, cx, groundY - 12, 14, 0.4, 118);
  }
  return g;
}

// BARROW WIGHT death (4f) — robe crumples, bones clatter apart
function barrowWightDeath(facing: IsoFacing, f: number): Grid {
  const g = makeGrid(32, 44); const st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2; const cx = 16 + Math.round(leanOf(dir) * 0.5), groundY = 42;
  if (f === 0) {
    for (let y = groundY - 26; y <= groundY; y++) { const t = (y - (groundY - 26)) / 26; const w = Math.round(4 + t * 5); for (let x = cx - w; x <= cx + w; x++) { let c = st[1]; if (x < cx - w + 1) c = st[0]; if (x > cx + w - 1) c = st[3]; if (hash2(x, y, 121) < 0.05) c = st[2]; P(g, x, y, c); } }
    if (!back) { P(g, cx + (profile ? 3 : -2), groundY - 22, dr[3]); if (!profile) P(g, cx + 2, groundY - 22, dr[3]); }
    outline(g, RAMP.void);
  } else if (f === 1) {
    for (let y = groundY - 16; y <= groundY; y++) { const t = (y - (groundY - 16)) / 16; const w = Math.round(6 + t * 4); for (let x = cx - w; x <= cx + w; x++) { if (hash2(x, y, 122) > 0.85) continue; let c = st[1]; if (x < cx - w + 1) c = st[0]; if (x > cx + w - 1) c = st[3]; P(g, x, y, c); } }
    ([[-7, 6], [8, 9], [-9, 4]] as [number, number][]).forEach(([ox, oy], i) => { for (let k = 0; k < 4; k++) P(g, cx + ox + (i ? 1 : -1), groundY - oy + k, bn[1]); });
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 18, 9, 0.5, 123);
  } else if (f === 2) {
    deathMound(g, cx, groundY - 1, 9, 6, st, 124, 0.82);
    const r = mulberry(125); for (let i = 0; i < 7; i++) { const bx = cx + Math.round((r() - 0.5) * 22), by = groundY - 1 - Math.floor(r() * 3); const len = 3 + Math.floor(r() * 3); const ang = (r() - 0.5) * 1.5; for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.5), bn[1]); P(g, bx, by, bn[0]); }
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 12, 11, 0.5, 126);
  } else {
    deathMound(g, cx, groundY - 1, 7, 4, st, 127, 0.7);
    const r = mulberry(128); for (let i = 0; i < 9; i++) { const bx = cx + Math.round((r() - 0.5) * 24), by = groundY - 1 - Math.floor(r() * 2); P(g, bx, by, bn[2]); if (r() < 0.5) P(g, bx + 1, by, bn[1]); }
    fillRect(g, cx - 8, groundY - 4, 4, 3, bn[1]); P(g, cx - 7, groundY - 3, RAMP.void);
    outline(g, RAMP.void); P(g, cx + 2, groundY - 8, dr[2]); P(g, cx + 2, groundY - 10, dr[3]);
  }
  return g;
}

// BONE HUSK death (4f) — skeleton shatters
function boneHuskDeath(facing: IsoFacing, f: number): Grid {
  const g = makeGrid(28, 36); const bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIR_OF[facing], back = dir >= 3; const cx = 14 + leanOf(dir), groundY = 34;
  if (f === 0) {
    const top = 9, hipY = top + 13;
    for (let y = top + 6; y <= hipY; y++) { P(g, cx - 2, y, bn[2]); P(g, cx + 2, y, bn[3]); if ((y - top) % 2 === 0) for (let x = cx - 1; x <= cx + 1; x++) P(g, x, y, bn[1]); }
    shadeMass(g, cx + 1, top + 3, 3, 3, bn, 131); if (!back) { P(g, cx, top + 3, dr[0]); P(g, cx + 2, top + 3, dr[0]); }
    for (let y = hipY; y < groundY - 1; y++) { P(g, cx - 2, y, bn[2]); P(g, cx + 3, y, bn[2]); }
    P(g, cx, top + 8, RAMP.void); P(g, cx + 1, top + 10, RAMP.void);
    outline(g, RAMP.void);
  } else if (f === 1) {
    const cyk = 20; const r = mulberry(132);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const dst = 4 + r() * 6; const bx = Math.round(cx + Math.cos(a) * dst), by = Math.round(cyk + Math.sin(a) * dst * 0.7); const len = 2 + Math.floor(r() * 3); for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(a) * k), Math.round(by + Math.sin(a) * k * 0.6), i % 2 ? bn[1] : bn[2]); }
    shadeMass(g, cx, cyk, 2, 2, bn, 133);
    outline(g, RAMP.void); moteBurst(g, cx, cyk, 9, 0.4, 134);
  } else if (f === 2) {
    const r = mulberry(135); for (let i = 0; i < 11; i++) { const bx = cx + Math.round((r() - 0.5) * 22), by = groundY - 1 - Math.floor(r() * 3); const len = 2 + Math.floor(r() * 3), ang = (r() - 0.5) * 1.8; for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.4), bn[1]); }
    outline(g, RAMP.void); deathScatter(g, cx, groundY - 1, 12, 8, bn, 136);
  } else {
    deathMound(g, cx, groundY - 1, 6, 4, bn, 137, 0.75);
    fillRect(g, cx - 5, groundY - 3, 4, 3, bn[1]); P(g, cx - 4, groundY - 2, RAMP.void);
    outline(g, RAMP.void); deathScatter(g, cx, groundY - 1, 13, 6, bn, 138);
  }
  return g;
}

// ASH BRUTE death (4f) — ember cracks flare then go cold, slumps
function ashBruteDeath(facing: IsoFacing, f: number): Grid {
  const g = makeGrid(48, 52); const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold;
  const dir = DIR_OF[facing]; const cx = 24 + leanOf(dir) * 2, groundY = 50;
  const crk: [number, number][] = [[-7, 8], [4, 12], [-2, 18], [8, 6], [-9, 15], [1, 22], [-5, 26], [6, 24]];
  if (f === 0) {
    deathMound(g, cx, groundY - 1, 17, 34, dt, 141, 0.96);
    crk.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 34 + oy; P(g, x, y, gd[0]); P(g, x, y + 1, em[0]); P(g, x + 1, y, em[0]); P(g, x - 1, y, em[1]); });
    shadeMass(g, cx, groundY - 38, 5, 4, dt, 145); P(g, cx - 2, groundY - 38, gd[0]); P(g, cx + 2, groundY - 38, gd[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    deathMound(g, cx, groundY - 1, 18, 26, dt, 142, 0.95);
    crk.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 26 + Math.round(oy * 0.7); P(g, x, y, em[0]); P(g, x, y + 1, gd[0]); });
    outline(g, RAMP.void);
    for (let i = 0; i < 10; i++) { const t = hash2(i, 1, 143) * Math.PI; P(g, Math.round(cx + Math.cos(t) * 14), groundY - 24 - Math.floor(hash2(i, 2, 143) * 8), i % 2 ? em[0] : gd[0]); }
  } else if (f === 2) {
    deathMound(g, cx, groundY - 1, 19, 16, dt, 144, 0.9);
    crk.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 14 + Math.round(oy * 0.4); P(g, x, y, em[2]); if (hash2(x, y, 145) < 0.4) P(g, x, y, em[3]); });
    outline(g, RAMP.void);
    for (let i = 0; i < 6; i++) P(g, cx + Math.round((hash2(i, 3, 146) - 0.5) * 26), groundY - 1, em[3]);
  } else {
    deathMound(g, cx, groundY - 1, 20, 11, st, 147, 0.85);
    for (let i = 0; i < 14; i++) { const x = cx + Math.round((hash2(i, 4, 148) - 0.5) * 38); P(g, x, groundY - 1, st[3]); if (hash2(i, 5, 148) < 0.3) P(g, x, groundY - 2, dt[3]); }
    outline(g, RAMP.void);
    P(g, cx - 6, groundY - 4, em[3]); P(g, cx + 5, groundY - 3, em[3]);
  }
  return g;
}

// DRIFT WISP death (3f, NO outline) — pops into scattering motes
function driftWispDeath(facing: IsoFacing, f: number): Grid {
  const g = makeGrid(28, 32); const dr = RAMP.drift; const cx = 14, cy = 12;
  if (f === 0) {
    ell(g, cx, cy, 5, 4.4, (x, y, d) => P(g, x, y, d < 0.4 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
    P(g, cx, cy, dr[0]);
    for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2; P(g, Math.round(cx + Math.cos(t) * 7), Math.round(cy + Math.sin(t) * 6), dr[0]); }
    moteBurst(g, cx, cy, 9, 0.6, 150);
  } else if (f === 1) {
    const r = mulberry(151);
    for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, dst = 4 + r() * 9; const x = Math.round(cx + Math.cos(a) * dst), y = Math.round(cy + Math.sin(a) * dst * 0.9); P(g, x, y, r() < 0.3 ? dr[0] : r() < 0.6 ? dr[1] : dr[2]); }
    P(g, cx, cy, dr[1]);
  } else {
    const r = mulberry(152);
    for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, dst = 7 + r() * 6; P(g, Math.round(cx + Math.cos(a) * dst), Math.round(cy - 2 + Math.sin(a) * dst * 0.8), r() < 0.5 ? dr[2] : dr[3]); }
  }
  return g;
}

// THE DROWNED KING death (5f) — topples, water bursts, crumbles to rubble + drift
function drownedKingDeath(facing: IsoFacing, f: number): Grid {
  const g = makeGrid(110, 110); const wa = RAMP.water, st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold, gr = RAMP.grass;
  const dir = DIR_OF[facing]; const cx = 55 + leanOf(dir) * 3, groundY = 106; const tip = dir <= 2 ? 1 : -1;
  if (f === 0) {
    deathMound(g, cx + tip * 4, groundY - 1, 26, 64, st, 301, 0.95);
    for (let i = 0; i < 16; i++) { const x = cx + Math.round((hash2(i, 0, 302) - 0.5) * 44), y = groundY - 20 - Math.floor(hash2(i, 1, 302) * 40); if (hash2(i, 2, 302) < 0.5) P(g, x, y, wa[2]); }
    for (let i = -8; i <= 8; i += 2) P(g, cx + tip * 8 + i, groundY - 70, gd[1]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    for (let yy = 0; yy < 50; yy++) { const t = yy / 50; const w = Math.round(24 * (1 - t * 0.6)); const sx = cx + tip * Math.round(t * 22); for (let x = sx - w; x <= sx + w; x++) { if (hash2(x, yy, 303) > 0.9) continue; let c = st[1]; if (x < sx - w + 3) c = st[0]; if (x > sx + w - 3) c = st[3]; if (t > 0.5 && hash2(x, yy, 304) < 0.3) c = wa[2]; P(g, x, groundY - yy, c); } }
    for (let i = 0; i < 24; i++) { const a = Math.PI + (i / 24) * Math.PI; P(g, Math.round(cx + tip * 30 + Math.cos(a) * 26), Math.round(groundY - 10 + Math.sin(a) * 14), i % 2 ? wa[0] : wa[1]); }
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 40, 18, 0.4, 305);
  } else if (f === 2) {
    deathMound(g, cx + tip * 10, groundY - 1, 34, 30, st, 306, 0.82);
    ([[-18, 8], [16, 12], [24, 6], [-26, 5]] as [number, number][]).forEach(([ox, oy]) => ell(g, cx + ox, groundY - oy, 6, 4, (x, y, d) => P(g, x, y, d < 0.5 ? st[1] : st[3])));
    for (let i = 0; i < 8; i++) { const x = cx + Math.round((hash2(i, 0, 307) - 0.5) * 56); P(g, x, groundY - 1 - Math.floor(hash2(i, 1, 307) * 6), bn[1]); }
    for (let a = 0; a < 30; a++) { const t = a / 30 * Math.PI * 2; if (a % 2) P(g, Math.round(cx + Math.cos(t) * 40), Math.round(groundY - 2 + Math.sin(t) * 9), wa[0]); }
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 30, 24, 0.5, 308);
  } else if (f === 3) {
    deathMound(g, cx, groundY - 1, 32, 18, st, 309, 0.8);
    for (let i = 0; i < 12; i++) { const x = cx + Math.round((hash2(i, 0, 310) - 0.5) * 60); P(g, x, groundY - 1 - Math.floor(hash2(i, 1, 310) * 4), bn[2]); }
    for (let i = 0; i < 8; i++) { const kx = cx + Math.round((hash2(i, 2, 310) - 0.5) * 54); for (let k = 0; k < 4; k++) P(g, kx, groundY - 1 - k, gr[2]); }
    for (let i = -6; i <= 6; i += 2) P(g, cx - 24 + i, groundY - 3, gd[1]); for (let x = cx - 30; x <= cx - 18; x++) P(g, x, groundY - 2, gd[2]);
    for (let x = cx - 44; x <= cx + 44; x++) if (hash2(x, 3, 311) < 0.4) P(g, x, groundY - 1, wa[3]);
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 20, 22, 0.35, 312);
  } else {
    deathMound(g, cx, groundY - 1, 28, 12, st, 313, 0.78);
    for (let i = 0; i < 14; i++) { const x = cx + Math.round((hash2(i, 0, 314) - 0.5) * 56); P(g, x, groundY - 1, st[3]); P(g, x, groundY - 2 - Math.floor(hash2(i, 1, 314) * 3), bn[2]); }
    for (let i = -6; i <= 6; i += 2) P(g, cx - 22 + i, groundY - 3, gd[2]);
    for (let x = cx - 46; x <= cx + 46; x++) if (hash2(x, 4, 315) < 0.3) P(g, x, groundY - 1, wa[3]);
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 16, 20, 0.3, 316);
  }
  return g;
}

// THE BARROW LORD death (5f) — collapses, bones explode apart, crown falls
function barrowLordDeath(facing: IsoFacing, f: number): Grid {
  const g = makeGrid(110, 116); const bn = RAMP.bone, st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift;
  const dir = DIR_OF[facing]; const cx = 55 + leanOf(dir) * 3, groundY = 112;
  if (f === 0) {
    for (let y = groundY - 78; y <= groundY - 28; y++) P(g, cx, y, bn[2]);
    for (let r = 0; r < 7; r++) { const ry = groundY - 72 + r * 6, span = 16 - r; for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) { const x = cx + s * k, y = ry + Math.round((k / span) ** 2 * 7) + (r % 2 ? 1 : 0); P(g, x, y, bn[1]); } }
    for (const lx of [-13, 13]) for (let y = groundY - 30; y <= groundY; y++) P(g, cx + lx, y, bn[2]);
    const hy = groundY - 90; for (let y = hy - 8; y <= hy + 7; y++) for (let x = cx - 9; x <= cx + 9; x++) { if (Math.abs(x - cx) + Math.abs(y - hy) > 13) continue; P(g, x, y, bn[1]); }
    for (let i = -8; i <= 8; i += 2) for (let k = 0; k < 3; k++) P(g, cx + i, hy - 9 - k, gd[2]);
    P(g, cx - 4, hy - 1, dr[0]); P(g, cx + 4, hy - 1, dr[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    for (let r = 0; r < 6; r++) { const ry = groundY - 66 + r * 7, span = 15 - r, off = (r % 2 ? 3 : -3); for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) { if (hash2(k, ry, 320) > 0.85) continue; const x = cx + off + s * k, y = ry + Math.round((k / span) ** 2 * 6); P(g, x, y, bn[1]); } }
    const r = mulberry(321); for (let i = 0; i < 10; i++) { const a = r() * Math.PI * 2, dst = 16 + r() * 18; const bx = Math.round(cx + Math.cos(a) * dst), by = Math.round(groundY - 50 + Math.sin(a) * dst * 0.7); const len = 4 + Math.floor(r() * 4); for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(a) * k), Math.round(by + Math.sin(a) * k * 0.6), bn[2]); }
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 56, 26, 0.4, 322);
  } else if (f === 2) {
    const r = mulberry(323);
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, dst = 10 + r() * 40; const bx = Math.round(cx + Math.cos(a) * dst), by = Math.round(groundY - 40 + Math.sin(a) * dst * 0.6); const len = 3 + Math.floor(r() * 5); const ang = a + (r() - 0.5); for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.5), i % 2 ? bn[0] : bn[1]); }
    deathMound(g, cx, groundY - 1, 14, 8, bn, 324, 0.7);
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 40, 30, 0.5, 325);
  } else if (f === 3) {
    deathMound(g, cx, groundY - 1, 26, 16, st, 326, 0.74);
    const r = mulberry(327); for (let i = 0; i < 20; i++) { const bx = cx + Math.round((r() - 0.5) * 70), by = groundY - 1 - Math.floor(r() * 5); const len = 3 + Math.floor(r() * 4), ang = (r() - 0.5) * 1.8; for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.4), bn[1]); }
    for (let i = -6; i <= 6; i += 2) P(g, cx - 4 + i, groundY - 14, gd[1]); for (let x = cx - 12; x <= cx + 4; x++) P(g, x, groundY - 13, gd[2]);
    outline(g, RAMP.void); P(g, cx - 10, groundY - 18, dr[2]); P(g, cx + 8, groundY - 16, dr[3]);
  } else {
    deathMound(g, cx, groundY - 1, 22, 11, st, 328, 0.7);
    const r = mulberry(329); for (let i = 0; i < 26; i++) { const bx = cx + Math.round((r() - 0.5) * 78), by = groundY - 1 - Math.floor(r() * 3); P(g, bx, by, bn[2]); if (r() < 0.5) P(g, bx + 1, by, bn[1]); }
    fillRect(g, cx + 14, groundY - 6, 7, 5, bn[1]); P(g, cx + 16, groundY - 5, RAMP.void); P(g, cx + 18, groundY - 5, RAMP.void);
    for (let i = -6; i <= 6; i += 2) P(g, cx - 18 + i, groundY - 4, gd[2]); for (let x = cx - 26; x <= cx - 10; x++) P(g, x, groundY - 3, gd[1]);
    outline(g, RAMP.void); P(g, cx - 2, groundY - 14, dr[3]); P(g, cx + 4, groundY - 12, dr[3]);
  }
  return g;
}

// THE ASH WARLORD death (5f) — armor cracks blaze then cool, buckles, collapses
function ashWarlordDeath(facing: IsoFacing, f: number): Grid {
  const g = makeGrid(100, 110); const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold, bl = RAMP.blood, bn = RAMP.bone;
  const dir = DIR_OF[facing]; const cx = 50 + leanOf(dir) * 2, groundY = 106; const tip = dir <= 2 ? 1 : -1;
  const seams: [number, number][] = [[-8, 12], [5, 18], [-2, 26], [9, 14], [-10, 32], [2, 40], [-5, 46], [7, 36]];
  if (f === 0) {
    if (dir <= 2) for (let y = groundY - 70; y <= groundY - 6; y++) { const t = (y - (groundY - 70)) / 64; const w = Math.round(16 + t * 10); for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 5; x++) P(g, cx + s * (w - x), y, x === 0 ? bl[1] : bl[2]); }
    deathMound(g, cx, groundY - 1, 19, 70, dt, 341, 0.95);
    seams.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 70 + oy; P(g, x, y, gd[0]); P(g, x, y + 1, em[0]); });
    shadeMass(g, cx, groundY - 74, 7, 5, dt, 342); P(g, cx - 2, groundY - 73, em[0]); P(g, cx + 2, groundY - 73, em[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    deathMound(g, cx + tip * 3, groundY - 1, 21, 50, dt, 343, 0.93);
    seams.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 50 + Math.round(oy * 0.7); P(g, x, y, em[0]); P(g, x, y + 1, gd[0]); P(g, x + 1, y, em[1]); });
    if (dir <= 2) for (let i = 0; i < 16; i++) { const a = Math.PI + (i / 16) * Math.PI; P(g, Math.round(cx + tip * 18 + Math.cos(a) * 22), Math.round(groundY - 30 + Math.sin(a) * 16), bl[2]); }
    outline(g, RAMP.void);
    for (let i = 0; i < 12; i++) P(g, cx + Math.round((hash2(i, 0, 344) - 0.5) * 30), groundY - 44 - Math.floor(hash2(i, 1, 344) * 10), i % 2 ? em[0] : gd[0]);
  } else if (f === 2) {
    for (let yy = 0; yy < 40; yy++) { const t = yy / 40, w = Math.round(20 * (1 - t * 0.5)), sx = cx + tip * Math.round(t * 20); for (let x = sx - w; x <= sx + w; x++) { if (hash2(x, yy, 345) > 0.88) continue; let c = dt[1]; if (x < sx - w + 3) c = dt[0]; if (x > sx + w - 3) c = dt[3]; P(g, x, groundY - yy, c); } }
    seams.forEach(([ox, oy]) => { const x = cx + tip * 10 + ox, y = groundY - 30 + Math.round(oy * 0.4); P(g, x, y, em[2]); if (hash2(x, y, 346) < 0.4) P(g, x, y, em[3]); });
    outline(g, RAMP.void);
    for (let i = 0; i < 18; i++) { const a = hash2(i, 0, 347) * Math.PI; P(g, Math.round(cx + tip * 24 + Math.cos(a) * 20), Math.round(groundY - 12 + Math.sin(a) * 10), i % 2 ? em[1] : em[2]); }
  } else if (f === 3) {
    deathMound(g, cx, groundY - 1, 24, 18, dt, 348, 0.84);
    for (let x = cx - 30; x <= cx + 6; x++) P(g, x, groundY - 2, bl[3]);
    seams.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 14 + Math.round(oy * 0.2); if (y < groundY) { P(g, x, y, em[3]); if (hash2(x, y, 349) < 0.5) P(g, x, y, em[2]); } });
    for (let k = 0; k < 30; k++) { const x = cx + 18 + k, y = groundY - 2 - Math.round(k * 0.1); P(g, x, y, k % 4 === 0 ? em[2] : st[1]); }
    outline(g, RAMP.void);
  } else {
    deathMound(g, cx, groundY - 1, 26, 12, st, 350, 0.8);
    for (let i = 0; i < 16; i++) { const x = cx + Math.round((hash2(i, 0, 351) - 0.5) * 50); P(g, x, groundY - 1, st[3]); if (hash2(i, 1, 351) < 0.3) P(g, x, groundY - 2, dt[3]); }
    for (let x = cx - 32; x <= cx - 6; x++) P(g, x, groundY - 2, bl[3]);
    for (let k = 0; k < 32; k++) P(g, cx + 16 + k, groundY - 2, k % 5 === 0 ? st[0] : st[1]);
    fillRect(g, cx - 24, groundY - 5, 6, 4, bn[1]); P(g, cx - 23, groundY - 4, RAMP.void); P(g, cx - 21, groundY - 4, RAMP.void);
    outline(g, RAMP.void);
    P(g, cx - 4, groundY - 6, em[3]); P(g, cx + 6, groundY - 5, em[3]);
  }
  return g;
}

/* ── BOGWRETCH (32×40) — Palewater ranged spitter ── */
function drawBogwretch(facing: IsoFacing, anim: string, f: number): Grid {
  if (anim === 'death') return bogwretchDeath(facing, f);
  const g = makeGrid(32, 40);
  const wa = RAMP.water, gr = RAMP.grass, bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 1, 2, 1, 0][dir], cx = 16 + lean, groundY = 38;

  let bob = 0, sac = 0, rear = 0, mouth = 0, step = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; sac = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; step = [2, 1, 0, -2, -1, 0][f]; }
  if (anim === 'cast') { rear = [-2, -3, 1, 2][f]; sac = [1, 3, 1, 0][f]; mouth = [0, 0, 2, 1][f]; }

  const hipY = groundY - 7 + bob;
  ([[-7, -1], [7, 1]] as [number, number][]).forEach(([lx, ph], i) => {
    const k2 = anim === 'walk' ? ((f + i) % 2 ? 1 : 0) : 0;
    const fx = cx + lx + (i ? -step : step);
    P(g, fx - ph, hipY - 1, wa[2]); P(g, fx - ph, hipY, wa[1]);
    for (let y = hipY + 1; y < groundY - 1 - k2; y++) { P(g, fx, y, wa[2]); P(g, fx + ph, y, wa[3]); }
    P(g, fx - 1, groundY - 1, wa[1]); P(g, fx, groundY - 1, RAMP.void); P(g, fx + 1, groundY - 1, wa[1]); P(g, fx + ph, groundY - 1, wa[2]);
  });
  const bx = cx + rear * 0.4;
  shadeMass(g, bx, hipY - 4, profile ? 8 : 7, 5, wa, 110);
  if (!back) {
    const ax = bx + (profile ? 5 : 4);
    P(g, ax, hipY + 1, wa[2]); P(g, ax + 1, hipY + 2, wa[1]); P(g, ax + 2, hipY + 2, wa[1]);
    if (!profile) { P(g, bx - 4, hipY + 1, wa[2]); P(g, bx - 5, hipY + 2, wa[1]); P(g, bx - 6, hipY + 2, wa[1]); }
  }
  ([[-3, -5], [2, -6], [4, -2], [-5, -1]] as [number, number][]).forEach(([ox, oy], i) => { if (hash2(i, 1, 111) < 0.8) P(g, bx + ox, hipY - 4 + oy, gr[2]); });
  if (back) { [-3, 0, 3].forEach(sx => spike(g, bx + sx, hipY - 8, 3, false)); }
  if (!back) {
    const hx = bx + (profile ? 6 : 0), hy = hipY - 6;
    shadeMass(g, hx, hy, profile ? 5 : 5, 4, wa, 112);
    const lit = (anim === 'idle' && f === 1) || anim === 'cast';
    if (profile) { P(g, hx + 3, hy - 2, bn[0]); P(g, hx + 3, hy - 2, lit ? dr[1] : bn[2]); }
    else { P(g, hx - 2, hy - 2, lit ? dr[1] : bn[0]); P(g, hx + 2, hy - 2, lit ? dr[1] : bn[0]); }
    if (mouth > 0) { for (let i = -2; i <= 2; i++) P(g, hx + (profile ? 3 : i), hy + 2 + (profile ? i : 0), RAMP.void); P(g, hx + (profile ? 4 : 0), hy + 2, dr[2]); }
    const sw = 3 + sac;
    ell(g, hx, hy + 4 + Math.floor(sac / 2), sw, 2 + sac, (x, y, d, dx, dy) => { let c = wa[1]; if (dy < -0.3) c = wa[0]; if (d > 0.7) c = wa[3]; P(g, x, y, c); });
    if (sac >= 2) for (let i = -1; i <= 1; i++) P(g, hx + i, hy + 4, dr[3]);
  } else {
    shadeMass(g, bx, hipY - 6, 4, 3, wa, 113);
  }
  outline(g, RAMP.void);
  return g;
}

/* ── BARROW WIGHT (32×44) — Bonefields summoner ── */
function drawBarrowWight(facing: IsoFacing, anim: string, f: number): Grid {
  if (anim === 'death') return barrowWightDeath(facing, f);
  const g = makeGrid(32, 44);
  const st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir], cx = 16, groundY = 42;

  let bob = 0, hemSway = 0, arms = 0, glow = 0, step = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; hemSway = f === 1 ? 1 : 0; glow = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; hemSway = [0, 1, 1, 0, -1, -1][f]; step = [1, 1, 0, -1, -1, 0][f]; }
  if (anim === 'summon') { arms = [1, 3, 4, 2][f]; glow = [0, 1, 2, 1][f]; }

  const top = 7 + bob, shoulderY = 17 + bob;
  for (let y = shoulderY; y <= 40; y++) {
    const t = (y - shoulderY) / (40 - shoulderY);
    const hw = Math.round(3.4 + t * 4.0);
    const cxx = cx + Math.round(off * 0.5) + (y > 33 ? Math.round(hemSway * 0.6) : 0) + (anim === 'walk' ? Math.round(step * t) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = st[1]; if (x <= cxx - hw + 1) c = st[0]; if (x >= cxx + hw - 1) c = st[3];
      if (hash2(x, y, 121) < 0.05) c = st[2];
      if (back && x === cxx) c = st[2];
      P(g, x, y, c);
    }
  }
  for (let x = 0; x < 32; x++) { const v = G(g, x, 40); if (v && hash2(x, 0, 122) < 0.4) P(g, x, 40, RAMP.void); }
  P(g, cx + off, shoulderY + 6, dr[glow > 0 ? 1 : 2]);
  if (glow >= 1) { P(g, cx + off - 1, shoulderY + 6, dr[2]); P(g, cx + off + 1, shoulderY + 6, dr[2]); P(g, cx + off, shoulderY + 5, dr[2]); }
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.2) * Math.PI * 0.55) * 3.6);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) { let c = st[1]; if (x === cxx - hw) c = st[0]; if (x >= cxx + hw - 1) c = st[3]; if (y === top) c = st[0]; P(g, x, y, c); }
  }
  P(g, cx + off, top - 1, st[1]);
  if (!back) {
    const fcx = cx + off + (profile ? 2 : 0); const ey = top + 5;
    for (let y = top + 3; y <= top + 8; y++) for (let x = fcx - (profile ? 0 : 2); x <= fcx + 2; x++) P(g, x, y, RAMP.void);
    const lit = glow > 0 || anim === 'summon';
    if (profile) P(g, fcx + 1, ey, lit ? dr[0] : dr[1]);
    else { P(g, fcx - 1, ey, lit ? dr[0] : dr[1]); P(g, fcx + 1, ey, lit ? dr[0] : dr[1]); }
  }
  ([[-1], [1]] as [number][]).forEach(([s]) => {
    const ax = cx + off + s * 4;
    if (anim === 'summon') {
      const ay = shoulderY + 2 - arms;
      for (let k = 0; k < 6; k++) { const x = ax + s * Math.round(k * 0.5), y = ay - k; P(g, x, y, bn[1]); }
      const hx = ax + s * 3, hy = ay - 6;
      P(g, hx, hy, bn[0]); P(g, hx + s, hy, bn[1]); P(g, hx, hy - 1, bn[0]);
      if (glow >= 1) moteBurst(g, hx, hy - 2, 3 + glow, 0.6, 125 + s);
    } else {
      for (let y = shoulderY + 2; y <= 30; y++) P(g, ax + s * (profile ? 1 : 0), y, st[3]);
      P(g, ax + s, 30, bn[2]);
    }
  });
  if (anim === 'summon' && f >= 2) {
    ([[-7, 2], [7, 1], [0, 3]] as [number, number][]).forEach(([ox, h]) => { for (let k = 0; k < h + f - 1; k++) P(g, cx + off + ox, groundY - 1 - k, bn[k > h ? 0 : 1]); });
  }
  outline(g, RAMP.void);
  return g;
}

/* ── BONE HUSK (28×36) — the Wight's skeletal add ── */
function drawBoneHusk(facing: IsoFacing, anim: string, f: number): Grid {
  if (anim === 'death') return boneHuskDeath(facing, f);
  const g = makeGrid(28, 36);
  const bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2;
  const off = [0, 1, 2, 1, 0][dir], cx = 14, groundY = 34;

  let bob = 0, step = 0, ang: number | null = null, rattle = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; rattle = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; step = [2, 1, 0, -2, -1, 0][f]; }
  if (anim === 'swing') ang = [-2.1, -1.35, -0.45, 0.35][f];

  const top = 8 + bob, hipY = top + 14, shoulderY = top + 6;
  ([[-2, -1], [2, 1]] as [number, number][]).forEach(([lx, ph], i) => {
    const sx = cx + lx + (i ? -step : step);
    for (let y = hipY; y < groundY - 1; y++) P(g, sx, y, bn[2]);
    P(g, sx, groundY - 1, RAMP.void); P(g, sx + ph, groundY - 1, bn[1]);
  });
  for (let y = shoulderY; y <= hipY; y++) {
    const hw = 3; const cxx = cx + Math.round(off * 0.4);
    P(g, cxx - hw, y, bn[2]); P(g, cxx + hw, y, bn[3]);
    if ((y - shoulderY) % 2 === 0) for (let x = cxx - hw + 1; x <= cxx + hw - 1; x++) P(g, x, y, bn[1]);
    else P(g, cxx, y, bn[2]);
  }
  const hx = cx + off;
  shadeMass(g, hx, top + 3, 3, 3, bn, 131);
  if (!back) {
    const lit = rattle || anim === 'swing';
    if (profile) P(g, hx + 2, top + 3, lit ? dr[0] : dr[2]);
    else { P(g, hx - 1, top + 3, lit ? dr[0] : dr[2]); P(g, hx + 1, top + 3, lit ? dr[0] : dr[2]); }
    P(g, hx, top + 5, RAMP.void);
  }
  const shx = hx + 3, shy = shoulderY + 1;
  if (anim === 'swing' && ang !== null) {
    for (let k = 1; k < 6; k++) P(g, Math.round(shx + Math.cos(ang) * k), Math.round(shy + Math.sin(ang) * k), bn[2]);
    const ex = Math.round(shx + Math.cos(ang) * 6), ey = Math.round(shy + Math.sin(ang) * 6);
    fillRect(g, ex - 1, ey - 1, 2, 3, bn[1]); P(g, ex, ey - 2, bn[0]);
    if (f === 2) P(g, ex + 2, ey, dr[0]);
  } else {
    for (let y = shy; y <= shy + 5; y++) P(g, shx, y, bn[2]);
    P(g, shx, shy + 6, bn[1]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ── ASH BRUTE (48×52) — Ashen AoE slammer ── */
function drawAshBrute(facing: IsoFacing, anim: string, f: number): Grid {
  if (anim === 'death') return ashBruteDeath(facing, f);
  const g = makeGrid(48, 52);
  const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 2, 3, 2, 0][dir], cx = 24 + lean, groundY = 50;

  let stomp = 0, armUp = 0, hot = 0;
  if (anim === 'idle') { stomp = f === 1 ? 1 : 0; hot = f === 1 ? 1 : 0; }
  if (anim === 'walk') { stomp = [0, 1, 0, 1][f] ?? 0; }
  if (anim === 'slam') { armUp = [4, 7, 7, -3][f]; hot = [1, 2, 2, 0][f]; }

  const baseY = groundY;
  ([[-9, 0], [9, 0]] as [number, number][]).forEach(([lx], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 2 : 0;
    for (let y = baseY - 16; y <= baseY - lift; y++) for (let x = cx + lx - 4; x <= cx + lx + 4; x++) {
      let c = dt[1]; if (x < cx + lx - 2) c = dt[0]; if (x > cx + lx + 2) c = dt[3];
      if (hash2(x, y, 141) < 0.06) c = st[2];
      P(g, x, y, c);
    }
    P(g, cx + lx, baseY - lift, RAMP.void);
  });
  const tx = cx + (profile ? 3 : 0), tTop = baseY - 40 + stomp, tBot = baseY - 15;
  for (let y = tTop; y <= tBot; y++) {
    const w = 14 + Math.round((y - tTop) / 7);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = dt[1]; if (x < tx - w + 3) c = dt[0]; if (x > tx + w - 3) c = dt[3];
      if (y > tBot - 4) c = dt[3];
      if (hash2(x, y, 142) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  const crk: [number, number][] = [[-7, 8], [4, 12], [-2, 18], [8, 6], [-9, 15], [1, 22]];
  crk.forEach(([ox, oy]) => {
    const x = tx + ox, y = tTop + oy;
    P(g, x, y, hot ? em[0] : em[2]); P(g, x, y + 1, hot ? em[1] : em[3]);
    if (hot >= 2) { P(g, x + 1, y, gd[0]); P(g, x, y - 1, em[1]); }
  });
  ([[-1, -15], [1, 15]] as [number, number][]).forEach(([, ox]) => {
    const shX = tx + ox, shY = tTop + 3;
    shadeMass(g, shX, shY + 1, 5, 4, dt, 143);
    const drop = (anim === 'slam') ? armUp : 0;
    for (let y = shY + 3; y <= shY + 16; y++) {
      const yy = y - drop;
      for (let x = shX - 3; x <= shX + 3; x++) { let c = dt[1]; if (x < shX - 1) c = dt[0]; if (x > shX + 1) c = dt[3]; P(g, x, Math.round(yy), c); }
    }
    const fy = shY + 16 - drop;
    shadeMass(g, shX, fy, 5, 4, st, 144);
    if (hot >= 1) { P(g, shX, fy - 1, em[1]); }
  });
  if (!back) {
    const hx = tx + (profile ? 4 : 0), hy = tTop - 3 + stomp;
    shadeMass(g, hx, hy, 5, 4, dt, 145);
    const lit = hot || anim === 'slam';
    if (profile) P(g, hx + 2, hy, lit ? em[0] : em[1]);
    else { P(g, hx - 2, hy, lit ? em[0] : em[1]); P(g, hx + 2, hy, lit ? em[0] : em[1]); }
    for (let x = hx - 3; x <= hx + 3; x++) P(g, x, hy + 3, dt[3]);
  } else shadeMass(g, tx, tTop - 3 + stomp, 5, 4, dt, 146);
  if (anim === 'slam' && f === 3) {
    for (let i = 0; i < 10; i++) { const ox = -20 + i * 4; P(g, cx + ox, groundY - 1, em[2]); if (i % 2) P(g, cx + ox, groundY - 2, em[1]); }
  }
  outline(g, RAMP.void);
  return g;
}

/* ── DRIFT WISP (28×32, flying) — hovering corrupted mote ── */
function drawDriftWisp(facing: IsoFacing, anim: string, f: number): Grid {
  if (anim === 'death') return driftWispDeath(facing, f);
  const g = makeGrid(28, 32);
  const dr = RAMP.drift;
  const dir = DIR_OF[facing]; const profile = dir === 2;
  const cx = 14 + [0, 1, 1, 1, 0][dir];

  let cy = 12, gather = 0;
  if (anim === 'hover') { cy = 12 + [0, -1, -2, -1][f]; }
  if (anim === 'dive')  { cy = [10, 8, 18][f]; gather = [1, 2, 0][f]; }

  for (let i = -1; i <= 1; i++) {
    const tx = cx + i * 3;
    for (let k = 1; k <= 5; k++) {
      const wob = Math.round(Math.sin(k * 0.8 + f + i) * 1.2);
      P(g, tx + wob, cy + 3 + k, k > 3 ? dr[3] : dr[2]);
    }
  }
  ell(g, cx, cy, 4, 3.4, (x, y, d) => P(g, x, y, d < 0.28 ? dr[0] : d < 0.62 ? dr[1] : d < 0.85 ? dr[2] : dr[3]));
  P(g, cx, cy, dr[0]); P(g, cx + (profile ? 1 : 0), cy, dr[0]);
  moteBurst(g, cx, cy, 6 + gather * 2, 0.4 + gather * 0.18, 150 + f);
  if (gather >= 1) { P(g, cx, cy - 5, dr[0]); P(g, cx - 5, cy, dr[1]); P(g, cx + 5, cy, dr[1]); }
  outline(g, RAMP.void);
  return g;
}
/** the wisp's separate ground shadow (16×8, 4f, no outline — a cast shadow) */
export function drawWispShadow(f: number): Grid {
  const g = makeGrid(16, 8);
  const wide = [4, 3, 2, 3][f] || 3;
  ell(g, 8, 5, wide, 1.6, (x, y, d) => P(g, x, y, d < 0.5 ? RAMP.drift[4] : RAMP.stone[3]));
  return g;
}

/* shared: a thick limb segment (boulder/bone leg) bottom→top with iso shading */
function pillarLeg(g: Grid, cx: number, topY: number, botY: number, hw: number, ramp: string[], seed?: number) {
  for (let y = topY; y <= botY; y++) for (let x = cx - hw; x <= cx + hw; x++) {
    let c = ramp[1]; if (x < cx - hw + 2) c = ramp[0]; if (x > cx + hw - 2) c = ramp[3];
    if (seed != null && hash2(x, y, seed) < 0.06) c = ramp[2];
    P(g, x, y, c);
  }
}

/* ── THE DROWNED KING (110×110) — Drowned Ruins mini-boss ── */
function drawDrownedKing(facing: IsoFacing, anim: string, f: number): Grid {
  if (anim === 'death') return drownedKingDeath(facing, f);
  const g = makeGrid(110, 110);
  const wa = RAMP.water, st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold, gr = RAMP.grass, dr = RAMP.drift;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 3, 6, 3, 0][dir], cx = 55 + lean, groundY = 106;

  let bob = 0, armUp = 0, sway = 0, glow = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; glow = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -2, 0, 0, -2, 0][f]; sway = [0, 1, 2, 0, -1, -2][f]; }
  if (anim === 'attack') { armUp = [10, 16, -10, -4][f]; glow = [1, 2, 2, 1][f]; bob = [-1, -2, 2, 1][f]; }

  ell(g, cx, groundY, 40, 7, (x, y, d) => P(g, x, y, d > 0.6 ? wa[3] : (hash2(x, y, 300) < 0.4 ? wa[2] : wa[3])));
  ([[-16, 0], [15, 1]] as [number, number][]).forEach(([lx, ph], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 4 : 0;
    pillarLeg(g, cx + lx + (i ? -sway : sway), groundY - 26, groundY - lift, 8, wa, 301);
    P(g, cx + lx, groundY - lift, RAMP.void);
  });
  const tx = cx + (profile ? 4 : 0), tTop = groundY - 78 + bob, tBot = groundY - 18;
  for (let y = tTop; y <= tBot; y++) {
    const t = (y - tTop) / (tBot - tTop);
    const w = Math.round(20 + Math.sin(t * Math.PI) * 12);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = st[1]; if (x < tx - w + 4) c = st[0]; if (x > tx + w - 4) c = st[3];
      if (hash2(x, y, 302) < 0.05) c = st[2];
      if (t > 0.66) { c = wa[2]; if (x < tx - w + 4) c = wa[1]; if (x > tx + w - 4) c = wa[3]; if (hash2(x, y, 303) < 0.12) c = wa[3]; }
      P(g, x, y, c);
    }
  }
  for (let i = -3; i <= 3; i++) { const sx = tx + i * 9; for (let k = 0; k < 5 + (i % 2 ? 2 : 0); k++) P(g, sx + Math.round(Math.sin(k + f) * 0.8), tBot + k, gr[2 + (k > 3 ? 1 : 0)]); }
  ([[-20, tTop + 6], [20, tTop + 7], [-14, tTop + 2]] as [number, number][]).forEach(([ox, oy]) => { ell(g, tx + ox, oy, 4, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2])); P(g, tx + ox, oy, bn[1]); });
  P(g, tx, tTop + 22, gd[1]); P(g, tx - 1, tTop + 22, gd[2]); P(g, tx + 1, tTop + 22, gd[2]); P(g, tx, tTop + 21, gd[0]);
  if (!back) { const ax = tx - 22; for (let y = tTop + 8; y <= tTop + 34; y++) { P(g, ax, y, wa[1]); P(g, ax + 1, y, wa[2]); } shadeMass(g, ax, tTop + 36, 4, 3, wa, 304); }
  const shX = tx + 20, shY = tTop + 8;
  const wRaise = (anim === 'attack') ? armUp : (anim === 'idle' ? 0 : sway);
  for (let y = shY; y <= shY + 26 - Math.max(0, wRaise); y++) { P(g, shX, y, wa[1]); P(g, shX + 1, y, wa[2]); P(g, shX - 1, y, wa[2]); }
  const hgx = shX + 2, hgy = shY + 26 - Math.max(0, wRaise);
  if (!back) {
    if (anim === 'attack' && f >= 2) {
      for (let k = 0; k < 30; k++) P(g, hgx + 2 + Math.round(k * 0.2), hgy + k, st[3]);
      const bx = hgx + 8, by = hgy + 28;
      for (let yy = 0; yy < 16; yy++) for (let xx = -10; xx <= 4; xx++) { if (xx < -10 + yy * 0.4) continue; let c = bn[3]; if (xx < -6) c = st[2]; if (hash2(bx + xx, by + yy, 305) < 0.2) c = RAMP.ember[3]; P(g, bx + xx, by + yy, c); }
      if (f === 2) for (let i = 0; i < 12; i++) { const a = Math.PI + (i / 12) * Math.PI; P(g, Math.round(bx + Math.cos(a) * 14), Math.round(by + 12 + Math.sin(a) * 6), wa[0]); }
    } else {
      for (let k = 0; k < 30; k++) P(g, hgx + Math.round(k * 0.1), hgy - k, st[3]);
      const bx = hgx + 2, by = hgy - 30;
      for (let yy = 0; yy < 14; yy++) for (let xx = -3; xx <= 9; xx++) { if (xx > 9 - yy * 0.3) continue; let c = bn[3]; if (xx > 5) c = st[2]; if (hash2(bx + xx, by + yy, 306) < 0.2) c = RAMP.ember[3]; P(g, bx + xx, by + yy, c); }
    }
  }
  const hx = tx + (profile ? 5 : 0), hy = tTop - 6 + bob;
  shadeMass(g, hx, hy, 10, 8, wa, 307);
  for (let i = -8; i <= 8; i += 2) { const ch = (i === -2 || i === 4) ? 0 : (2 + (Math.abs(i) % 4 === 0 ? 1 : 0)); for (let k = 0; k < ch; k++) P(g, hx + i, hy - 8 - k, gd[1]); }
  for (let x = hx - 8; x <= hx + 8; x++) P(g, x, hy - 7, gd[2]);
  for (let i = -6; i <= 6; i += 2) P(g, hx + i, hy - 5 + (i % 4 ? 1 : 0), gr[1]);
  if (!back) {
    const lit = glow > 0 || anim === 'attack';
    if (profile) P(g, hx + 6, hy - 1, lit ? dr[0] : wa[0]);
    else { P(g, hx - 4, hy - 1, lit ? dr[0] : wa[0]); P(g, hx + 4, hy - 1, lit ? dr[0] : wa[0]); }
    for (let x = hx - 5; x <= hx + 5; x++) P(g, x, hy + 4, wa[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ── THE BARROW LORD (110×116) — Barrow-Crypt mini-boss ── */
function drawBarrowLord(facing: IsoFacing, anim: string, f: number): Grid {
  if (anim === 'death') return barrowLordDeath(facing, f);
  const g = makeGrid(110, 116);
  const bn = RAMP.bone, st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 3, 6, 3, 0][dir], cx = 55 + lean, groundY = 112;

  let bob = 0, armUp = 0, sway = 0, glow = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; glow = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -2, 0, 0, -2, 0][f]; sway = [0, 1, 2, 0, -1, -2][f]; }
  if (anim === 'attack') { armUp = [12, 18, -12, -5][f]; glow = [1, 2, 2, 1][f]; bob = [-1, -2, 2, 1][f]; }

  ([[-14, 0], [14, 1]] as [number, number][]).forEach(([lx], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 4 : 0;
    const lxx = cx + lx + (i ? -sway : sway);
    for (let y = groundY - 30; y <= groundY - lift; y++) { const w = 5 - Math.round(Math.abs(y - (groundY - 15)) / 14); P(g, lxx - w, y, bn[2]); for (let x = lxx - w + 1; x <= lxx + w - 1; x++) P(g, x, y, bn[1]); P(g, lxx + w, y, bn[3]); }
    P(g, lxx, groundY - lift, RAMP.void);
    ell(g, lxx, groundY - lift - 1, 5, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2]));
  });
  const tx = cx + (profile ? 4 : 0), tTop = groundY - 80 + bob, tBot = groundY - 28;
  for (let y = tTop; y <= tBot; y++) P(g, tx, y, bn[2]);
  for (let r = 0; r < 7; r++) {
    const ry = tTop + 6 + r * 6; const span = 16 - r;
    for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) {
      const x = tx + s * k, y = ry + Math.round((k / span) * (k / span) * 7);
      P(g, x, y, k > span - 2 ? bn[2] : bn[1]);
    }
  }
  for (let y = tTop - 2; y <= tBot - 6; y++) {
    const t = (y - (tTop - 2)) / (tBot - 6 - (tTop - 2));
    const w = Math.round(20 + t * 6);
    for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 6; x++) { const xx = tx + s * (w - x) + (y > tBot - 16 ? Math.round(sway * t) : 0); let c = st[1]; if (x === 0) c = st[0]; if (x > 4) c = st[3]; if (hash2(xx, y, 311) < 0.06) c = st[2]; P(g, xx, y, c); }
  }
  for (let x = tx - 26; x <= tx + 26; x++) { const yy = tBot - 6 + Math.round(Math.sin(x * 0.5) * 1.5); if (Math.abs(x - tx) > 14 && hash2(x, 0, 312) < 0.7) P(g, x, yy, st[3]); }
  if (glow > 0 || anim === 'attack') { ([[-30, tTop + 14], [32, tTop + 24], [-26, tTop + 40], [30, tTop + 6]] as [number, number][]).forEach(([ox, oy]) => { for (let k = 0; k < 3; k++) P(g, tx + ox, oy + k, k === 1 ? bn[0] : bn[2]); }); }
  if (!back) { const ax = tx - 20; for (let y = tTop + 4; y <= tTop + 30; y++) { P(g, ax, y, bn[1]); P(g, ax - 1, y, bn[2]); P(g, ax + 1, y, bn[3]); } ell(g, ax, tTop + 32, 4, 3, (x, y, d) => P(g, x, y, d < 0.4 ? bn[0] : bn[2])); }
  const shX = tx + 18, shY = tTop + 4;
  const wRaise = (anim === 'attack') ? armUp : (anim === 'idle' ? 0 : sway);
  for (let y = shY; y <= shY + 24 - Math.max(0, wRaise); y++) { P(g, shX, y, bn[1]); P(g, shX + 1, y, bn[3]); P(g, shX - 1, y, bn[2]); }
  const hgx = shX, hgy = shY + 24 - Math.max(0, wRaise);
  if (!back) {
    if (anim === 'attack' && f >= 2) {
      for (let k = 0; k < 34; k++) { const x = hgx + 4 + Math.round(k * 0.2), y = hgy + k; const w = 1 + Math.round(k / 10); for (let i = -1; i <= w; i++) P(g, x + i, y, i === w ? bn[3] : (i < 0 ? bn[0] : bn[1])); }
      if (f === 2) moteBurst(g, hgx + 12, hgy + 30, 10, 0.6, 313);
    } else {
      for (let k = 0; k < 36; k++) { const x = hgx - Math.round(k * 0.1), y = hgy - k; const w = 1 + Math.round(k / 11); for (let i = -1; i <= w; i++) P(g, x + i, y, i === w ? bn[3] : (i < 0 ? bn[0] : bn[1])); }
    }
  }
  const hx = tx + (profile ? 5 : 0), hy = tTop - 10 + bob;
  for (let y = hy - 8; y <= hy + 7; y++) for (let x = hx - 9; x <= hx + 9; x++) { if (Math.abs(x - hx) + Math.abs(y - hy) > 13) continue; let c = bn[1]; if (x < hx - 4) c = bn[0]; if (y > hy + 3) c = bn[2]; if (x > hx + 5) c = bn[3]; P(g, x, y, c); }
  for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy + 8, bn[2]); for (let x = hx - 5; x <= hx + 5; x += 2) P(g, x, hy + 7, bn[3]);
  for (let i = -8; i <= 8; i += 2) { const chh = 2 + (Math.abs(i) % 4 === 0 ? 1 : 0); for (let k = 0; k < chh; k++) P(g, hx + i, hy - 9 - k, gd[2]); P(g, hx + i, hy - 9, gd[1]); }
  for (let x = hx - 8; x <= hx + 8; x++) P(g, x, hy - 8, gd[2]);
  if (!back) {
    const lit = glow > 0 || anim === 'attack';
    if (profile) { for (let y = hy - 3; y <= hy; y++) P(g, hx + 5, y, RAMP.void); P(g, hx + 5, hy - 1, lit ? dr[0] : dr[1]); }
    else { for (const ox of [-4, 4]) { for (let y = hy - 3; y <= hy; y++) P(g, hx + ox, y, RAMP.void); P(g, hx + ox, hy - 1, lit ? dr[0] : dr[1]); } }
  }
  outline(g, RAMP.void);
  return g;
}

/* ── THE ASH WARLORD (100×110) — Ashen Warcamp mini-boss ── */
function drawAshWarlord(facing: IsoFacing, anim: string, f: number): Grid {
  if (anim === 'death') return ashWarlordDeath(facing, f);
  const g = makeGrid(100, 110);
  const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold, bl = RAMP.blood, bn = RAMP.bone;
  const dir = DIR_OF[facing], back = dir >= 3, profile = dir === 2;
  const lean = [0, 3, 5, 3, 0][dir], cx = 50 + lean, groundY = 106;

  let bob = 0, armUp = 0, sway = 0, hot = 0;
  if (anim === 'idle') { bob = f === 1 ? -1 : 0; hot = f === 1 ? 1 : 0; }
  if (anim === 'walk') { bob = [0, -2, 0, 0, -2, 0][f]; sway = [0, 1, 2, 0, -1, -2][f]; }
  if (anim === 'attack') { armUp = [14, 20, -14, -6][f]; hot = [1, 2, 2, 1][f]; bob = [-1, -2, 2, 1][f]; }

  if (!profile) {
    for (let y = groundY - 74 + bob; y <= groundY - 6; y++) {
      const t = (y - (groundY - 74 + bob)) / 68; const w = Math.round(16 + t * 10);
      for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 5; x++) { const xx = cx + s * (w - x) + (y > groundY - 24 ? Math.round(sway) : 0); let c = bl[2]; if (x === 0) c = bl[1]; if (x > 3) c = bl[3]; P(g, xx, y, c); }
    }
  }
  ([[-13, 0], [13, 1]] as [number, number][]).forEach(([lx], i) => {
    const lift = anim === 'walk' && ((f + i) % 2 === 0) ? 4 : 0;
    pillarLeg(g, cx + lx + (i ? -sway : sway), groundY - 30, groundY - lift, 7, dt, 321);
    P(g, cx + lx, groundY - 16, em[hot ? 0 : 2]); for (let x = cx + lx - 6; x <= cx + lx + 6; x++) P(g, x, groundY - 22, gd[3]);
    P(g, cx + lx, groundY - lift, RAMP.void);
  });
  const tx = cx + (profile ? 3 : 0), tTop = groundY - 74 + bob, tBot = groundY - 26;
  for (let y = tTop; y <= tBot; y++) {
    const t = (y - tTop) / (tBot - tTop); const w = Math.round(19 - t * 4);
    for (let x = tx - w; x <= tx + w; x++) {
      let c = dt[1]; if (x < tx - w + 4) c = dt[0]; if (x > tx + w - 4) c = dt[3];
      if (hash2(x, y, 322) < 0.06) c = st[2];
      P(g, x, y, c);
    }
  }
  ([[-8, 10], [5, 16], [-2, 24], [9, 12], [-10, 30], [2, 36]] as [number, number][]).forEach(([ox, oy]) => { const x = tx + ox, y = tTop + oy; P(g, x, y, hot ? em[0] : em[2]); P(g, x, y + 1, hot ? em[1] : em[3]); if (hot >= 2) P(g, x + 1, y, gd[0]); });
  for (let x = tx - 20; x <= tx - 8; x++) P(g, x, tTop + 4, gd[2]);
  for (let x = tx + 8; x <= tx + 20; x++) P(g, x, tTop + 4, gd[2]);
  shadeMass(g, tx - 18, tTop + 2, 5, 4, dt, 323); P(g, tx - 18, tTop + 1, bn[1]); P(g, tx - 19, tTop + 2, RAMP.void); P(g, tx - 17, tTop + 2, RAMP.void);
  ([[-1, -17], [1, 17]] as [number, number][]).forEach(([sgn, ox]) => {
    const shX = tx + ox, shY = tTop + 3;
    shadeMass(g, shX, shY + 2, 6, 4, dt, 324);
    const drop = (anim === 'attack' && sgn > 0) ? armUp : (anim === 'attack' ? Math.round(armUp * 0.6) : 0);
    for (let y = shY + 4; y <= shY + 20; y++) { const yy = y - drop; for (let x = shX - 3; x <= shX + 3; x++) { let c = dt[1]; if (x < shX - 1) c = dt[0]; if (x > shX + 1) c = dt[3]; P(g, x, Math.round(yy), c); } }
    shadeMass(g, shX, shY + 22 - drop, 4, 3, st, 325);
  });
  if (!back) {
    const fistX = tx + 17, fistY = tTop + 25 - (anim === 'attack' ? armUp : 0);
    if (anim === 'attack' && f >= 2) {
      for (let k = 0; k < 46; k++) { const x = fistX + 2 + Math.round(k * 0.5), y = fistY - 6 + k; const w = 2 + Math.round(k / 12); for (let i = -1; i <= w; i++) { let c = st[0]; if (i === w) c = st[3]; if (i >= 0 && i < w) c = (hash2(x, y, 326) < 0.5 ? em[hot ? 0 : 1] : st[1]); P(g, x + i, y, c); } }
      if (f === 2) for (let i = 0; i < 14; i++) { const a = Math.PI * 0.2 + (i / 14) * Math.PI * 0.7; P(g, Math.round(fistX + 22 + Math.cos(a) * 16), Math.round(fistY + 28 + Math.sin(a) * 10), em[i % 2 ? 0 : 1]); }
    } else {
      for (let k = 0; k < 48; k++) { const x = fistX - Math.round(k * 0.08), y = fistY - 6 - k; const w = 2 + Math.round(k / 13); for (let i = -1; i <= w; i++) { let c = st[0]; if (i === w) c = st[3]; if (i >= 0 && i < w) c = (hash2(x, y, 327) < 0.5 ? em[hot ? 0 : 1] : st[1]); P(g, x + i, y, c); } }
      for (let x = fistX - 5; x <= fistX + 5; x++) P(g, x, fistY - 4, gd[2]);
    }
  }
  const hx = tx + (profile ? 4 : 0), hy = tTop - 8 + bob;
  shadeMass(g, hx, hy, 8, 7, dt, 328);
  for (let s = -1; s <= 1; s += 2) { for (let k = 0; k < 6; k++) P(g, hx + s * (7 + Math.round(k * 0.4)), hy - 4 - k, k > 3 ? bn[0] : bn[2]); }
  for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy - 6, gd[2]); P(g, hx, hy - 8, gd[1]);
  if (!back) {
    const lit = hot || anim === 'attack';
    if (profile) { for (let x = hx + 2; x <= hx + 6; x++) P(g, x, hy, RAMP.void); P(g, hx + 5, hy, lit ? em[0] : em[1]); }
    else { for (let x = hx - 6; x <= hx + 6; x++) P(g, x, hy + 1, RAMP.void); for (let x = hx - 5; x <= hx + 5; x += 2) P(g, x, hy + 1, lit ? em[0] : em[1]); }
  }
  outline(g, RAMP.void);
  return g;
}

// 48×64 boss-alert banner portrait — a menacing bust, 2f idle, from the s-facing.
const BOSS_PORTRAIT_SRC: Record<string, (facing: IsoFacing, anim: string, f: number) => Grid> = {
  drowned_king: drawDrownedKing, barrow_lord: drawBarrowLord, ash_warlord: drawAshWarlord,
};
const BOSS_PORTRAIT_CELL: Record<string, [number, number]> = {
  drowned_king: [110, 110], barrow_lord: [110, 116], ash_warlord: [100, 110],
};
export function drawBossPortrait(name: string, f: number): Grid {
  const g = makeGrid(48, 64);
  const src = BOSS_PORTRAIT_SRC[name]('s', 'idle', f || 0);
  const [cw] = BOSS_PORTRAIT_CELL[name];
  const cropX0 = Math.round(cw / 2 - 22), cropY0 = (name === 'ash_warlord' ? 18 : 14);
  const cropW = 44, cropH = 40, sc = 48 / cropW;
  for (let y = 0; y < cropH; y++) for (let x = 0; x < cropW; x++) {
    const v = G(src, cropX0 + x, cropY0 + y); if (!v) continue;
    const px = Math.round(x * sc), py = 6 + Math.round(y * sc);
    fillRect(g, px, py, Math.ceil(sc), Math.ceil(sc), v.c);
  }
  for (let x = 0; x < 48; x++) P(g, x, 60, RAMP.void);
  for (let x = 0; x < 48; x++) if ((x + (f || 0)) % 2 === 0) P(g, x, 61, RAMP.blood[3]);
  outline(g, RAMP.void);
  return g;
}

// exported for the byte-diff + smoke (engine renders via BEAST_SPECS/drawBeast)
export {
  drawBogwretch, drawBarrowWight, drawBoneHusk, drawAshBrute, drawDriftWisp,
  drawDrownedKing, drawBarrowLord, drawAshWarlord,
};

export const BEAST_SPECS: Record<BeastKind, {
  w: number; h: number;
  anims: Record<BeastAnim, [string, number]>;
  hurt: string;
  draw: (facing: IsoFacing, anim: string, f: number) => Grid;
}> = {
  husk: {
    w: 32, h: 32, hurt: '#d8b4fe', draw: drawHusk,
    anims: { idle: ['idle', 2], move: ['skitter', 4], attack: ['lunge', 4], death: ['death', 3] },
  },
  stalker: {
    w: 36, h: 40, hurt: '#ef4444', draw: drawStalker,
    anims: { idle: ['idle', 2], move: ['stalk', 6], attack: ['lunge', 4], death: ['death', 4] },
  },
  colossus: {
    w: 64, h: 64, hurt: '#efe9f4', draw: drawColossus,
    anims: { idle: ['idle', 2], move: ['walk', 4], attack: ['slam', 5], death: ['death', 5] },
  },
  raider: {
    w: 32, h: 40, hurt: '#ef4444', draw: drawRaider,
    anims: { idle: ['idle', 2], move: ['walk', 6], attack: ['slash', 4], death: ['death', 3] },
  },
  // ── frontier species (authored death anims, ported from deaths.js) ──
  bogwretch: {
    w: 32, h: 40, hurt: '#4a7fa0', draw: drawBogwretch,
    anims: { idle: ['idle', 2], move: ['walk', 6], attack: ['cast', 4], death: ['death', 4] },
  },
  wight: {
    w: 32, h: 44, hurt: '#d8b4fe', draw: drawBarrowWight,
    anims: { idle: ['idle', 2], move: ['walk', 6], attack: ['summon', 4], death: ['death', 4] },
  },
  bonehusk: {
    w: 28, h: 36, hurt: '#efe9f4', draw: drawBoneHusk,
    anims: { idle: ['idle', 2], move: ['walk', 6], attack: ['swing', 4], death: ['death', 4] },
  },
  brute: {
    w: 48, h: 52, hurt: '#fcd34d', draw: drawAshBrute,
    anims: { idle: ['idle', 2], move: ['walk', 4], attack: ['slam', 4], death: ['death', 4] },
  },
  // the wisp flies (body hovers in the upper cell): idle/move both hover
  wisp: {
    w: 28, h: 32, hurt: '#f3e8ff', draw: drawDriftWisp,
    anims: { idle: ['hover', 4], move: ['hover', 4], attack: ['dive', 3], death: ['death', 3] },
  },
  // ── camp mini-bosses (Colossus-scale; 5f dramatic collapse) ──
  drownedking: {
    w: 110, h: 110, hurt: '#4a7fa0', draw: drawDrownedKing,
    anims: { idle: ['idle', 2], move: ['walk', 6], attack: ['attack', 4], death: ['death', 5] },
  },
  barrowlord: {
    w: 110, h: 116, hurt: '#efe9f4', draw: drawBarrowLord,
    anims: { idle: ['idle', 2], move: ['walk', 6], attack: ['attack', 4], death: ['death', 5] },
  },
  ashwarlord: {
    w: 100, h: 110, hurt: '#fcd34d', draw: drawAshWarlord,
    anims: { idle: ['idle', 2], move: ['walk', 6], attack: ['attack', 4], death: ['death', 5] },
  },
};

// ─── threshold.js — "THE THRESHOLD" tutorial micro-set ───────────────────────
// Gate 96x128 (sealed+open, 3 rune-pulse frames each) · Gatewarden 32x40 (5
// facings, idle 2f) · Objective beacon 64x64 (3f) + arrow pip 16x16 (2f) ·
// Drift wall 64x96 FX (3f, seam-continuous) · ground accents 64x36 (2 variants).

function tDisc(g: Grid, cx: number, cy: number, r: number, fn: (x: number, y: number, d: number) => void) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy); if (d <= r) fn(x, y, d);
    }
}
function tRing(g: Grid, cx: number, cy: number, r: number, w: number, c: string) {
  tDisc(g, cx, cy, r, (x, y, d) => { if (d >= r - w) P(g, x, y, c); });
}
function triLine(g: Grid, x0: number, y0: number, x1: number, y1: number, c: string, t: number) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let oy = 0; oy < t; oy++) for (let ox = 0; ox < t; ox++) P(g, Math.round(x) + ox, Math.round(y) + oy, c); }
}
// the triangle-in-circle door sigil, centered at cx,cy radius R, gold tone set by lit
function gateSigil(g: Grid, cx: number, cy: number, R: number, lit: boolean) {
  const gd = RAMP.gold, dr = RAMP.drift;
  const hi = lit ? gd[0] : gd[3], mid = lit ? gd[1] : gd[3], dim = lit ? gd[2] : '#5c4a1e';
  tRing(g, cx, cy, R, 1, mid);
  const v = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 3); return [cx + Math.cos(a) * R * 0.84, cy + Math.sin(a) * R * 0.84]; });
  const tw = Math.max(1, Math.round(R * 0.12));
  triLine(g, v[0][0], v[0][1], v[1][0], v[1][1], hi, tw);
  triLine(g, v[1][0], v[1][1], v[2][0], v[2][1], mid, tw);
  triLine(g, v[2][0], v[2][1], v[0][0], v[0][1], mid, tw);
  tRing(g, cx, cy, R * 0.46, 1, dim);
  for (let yy = -R * 0.44; yy <= R * 0.5; yy++) P(g, Math.round(cx), Math.round(cy + yy), ((cy + yy) | 0) % 2 ? mid : dim);  // keyhole bar
  if (lit) { P(g, cx, cy, dr[0]); P(g, cx, cy - 1, dr[1]); P(g, cx, cy + 1, dr[1]); }   // drift mote in the eye
}

/** the Threshold gate (96×128, sealed/open × 3 rune-pulse frames) */
export function drawThresholdGate(open: boolean, frame: number): Grid {
  const g = makeGrid(96, 128); const cx = 48, baseY = 122;
  const st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift, bn = RAMP.bone;
  // pale-stone helper: stone ramp leaned lighter with bone highlights
  function block(x: number, y: number, lit: boolean) {
    let c = lit ? st[0] : st[1];
    const h = hash2(x, y, 401);
    if (h < 0.05) c = st[2]; else if (h < 0.065) c = st[0]; else if (h < 0.075) c = bn[2];  // chips + sparse pale highlights
    P(g, x, y, c);
  }
  // foundation slab (iso) under the arch
  const fb = 86, fh = 9;
  for (let dy = -fh; dy <= fh; dy++) { const t = 1 - Math.abs(dy) / fh, w = Math.round((fb / 2) * t); for (let dx = -w; dx <= w; dx++) { let c = st[2]; if (dy < 0 && dx < 0) c = st[1]; if (dy > 2) c = st[3]; P(g, cx + dx, baseY + dy - 2, c); } }

  // pillars
  const pw = 16, ph = 84, lx0 = 12, rx0 = 96 - 12 - pw;
  for (const [x0, sideLit] of [[lx0, true], [rx0, false]] as [number, boolean][]) {
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const yy = baseY - 6 - y, xx = x0 + x;
      const lit = sideLit ? x < 3 : x < 2;
      // course seams
      const edge = (y % 10 === 0) || (x === 0) || (x === pw - 1);
      block(xx, yy, lit && !edge);
      if (edge) P(g, xx, yy, st[3]);
    }
    // right-side iso depth
    for (let d = 1; d <= 6; d++) for (let y = 0; y < ph; y++) P(g, x0 + pw - 1 + d, baseY - 6 - y - Math.floor(d / 2), st[3]);
  }
  // arch (semicircle spanning the pillars)
  const archCx = cx, archCy = baseY - 6 - ph + 4, archR = 36;
  tDisc(g, archCx, archCy, archR, (x, y, d) => { if (y > archCy) return; if (d > archR || d < archR - 16) return; const lit = (x < archCx); const edge = (Math.round(d) % 10 < 2) || d > archR - 1.5 || d < archR - 14.5; block(x, y, lit && !edge); if (edge) P(g, x, y, st[3]); });
  // iso depth on arch
  for (let d = 1; d <= 6; d++) tDisc(g, archCx, archCy, archR, (x, y, dd) => { if (y > archCy) return; if (dd > archR || dd < archR - 16) return; if (x < archCx + 8) return; P(g, x + d, y - Math.floor(d / 2), st[3]); });
  // keystone with the sigil
  gateSigil(g, archCx, archCy - archR + 8, 7, open);

  // doorway interior (between pillars, under arch)
  const dl = lx0 + pw, dr_ = rx0, dtop = archCy, dbot = baseY - 6;
  for (let y = dtop; y <= dbot; y++) for (let x = dl; x <= dr_; x++) {
    const underArch = (x - archCx) ** 2 + (y - archCy) ** 2 <= (archR - 16) ** 2 || y >= archCy;
    if (!underArch) continue;
    if (open) {
      // glowing drift-purple void with dither + depth
      const t = (y - dtop) / (dbot - dtop);
      let c = dr[4];
      if ((x + y) % 2 === 0) c = t < 0.5 ? dr[3] : dr[4];
      if (Math.abs(x - cx) < 10 && hash2(x, y + frame, 402) < 0.18) c = dr[2];   // shifting glow
      if (Math.abs(x - cx) < 5 && hash2(x, y - frame * 2, 403) < 0.12) c = dr[1];
      P(g, x, y, c);
    } else {
      // filled with sealed stone blocks
      const lit = x < cx;
      const edge = (y % 9 === 0) || ((x + (Math.floor(y / 9) % 2) * 4) % 8 === 0);
      block(x, y, lit && !edge); if (edge) P(g, x, y, st[3]);
    }
  }
  // rune ring around the doorway (pulse across frames)
  const pulse = [0, 1, 2, 1][frame % 4] / 2;  // 0 .. 1
  const litRune = open ? true : (pulse > 0.4);
  const runeTone = open ? (pulse > 0.6 ? gd[0] : gd[1]) : (pulse > 0.4 ? gd[2] : gd[3]);
  // runes set into the pillars + arch inner edge
  const runeSpots = [[dl + 1, dbot - 14], [dl + 1, dbot - 34], [dr_ - 1, dbot - 14], [dr_ - 1, dbot - 34], [cx - 14, dtop + 2], [cx + 14, dtop + 2]];
  runeSpots.forEach(([rx, ry], i) => { P(g, rx, ry, runeTone); P(g, rx, ry + 1, runeTone); P(g, rx + (i % 2 ? 1 : -1), ry, litRune ? runeTone : st[3]); P(g, rx, ry - 1, litRune ? gd[3] : st[3]); });
  // open: glow spill + escaping motes
  if (open) {
    for (let x = dl; x <= dr_; x++) if ((x + frame) % 3 === 0) P(g, x, dbot + 1, dr[2]);
    const mr = mulberry(404 + frame);
    for (let i = 0; i < 5; i++) { const mx = cx + Math.round((mr() - 0.5) * 24), my = dtop + Math.round(mr() * (dbot - dtop)); P(g, mx, my - frame, mr() < 0.4 ? dr[0] : dr[1]); }
  }
  outline(g, RAMP.void);
  return g;
}

/** the Gatewarden (32×40, 5 facings, idle 2f) */
export function drawGatewarden(facing: IsoFacing, frame: number): Grid {
  const g = makeGrid(32, 40); const cx = 16, baseY = 37;
  const bn = RAMP.bone, gd = RAMP.gold, dr = RAMP.drift, st = RAMP.stone;
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const off = [0, 1, 2, 1, 0][dir], showFace = dir <= 2;
  const sway = frame === 1 ? 1 : 0;
  const top = 8;
  // robe body (bone, tapered, gold hem)
  for (let y = 17; y <= 36; y++) {
    const t = (y - 17) / 19, hw = Math.round(3.4 + t * 4.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(sway * 0.5) : 0);
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      let c = bn[1]; if (x <= cxx - hw + 1) c = bn[0]; if (x >= cxx + hw - 1) c = bn[3];
      if (dir >= 3 && x === cxx) c = bn[2];
      if (hash2(x, y, 411) < 0.05) c = bn[2];
      P(g, x, y, c);
    }
  }
  // gold trim down the front + hem
  if (!(dir >= 3)) for (let y = 18; y <= 35; y += 1) P(g, cx + off, y, (y % 2 ? gd[1] : gd[2]));
  for (let x = cx + off - 6; x <= cx + off + 6; x++) { const v = G(g, x, 36); if (v) P(g, x, 36, gd[2]); }
  // hood
  for (let y = top; y <= 18; y++) { const hy = (y - top) / (18 - top), hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.6); const cxx = cx + off; for (let x = cxx - hw; x <= cxx + hw; x++) { let c = bn[1]; if (x === cxx - hw) c = bn[0]; if (x >= cxx + hw - 1) c = bn[3]; if (y === top) c = bn[0]; P(g, x, y, c); } }
  P(g, cx + off, top - 1, bn[1]);
  // gold trim on hood rim
  for (let x = cx + off - 4; x <= cx + off + 4; x++) { const v = G(g, x, 17); if (v) P(g, x, 17, gd[2]); }
  // hidden face + 2 gold eye glows
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0), w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    if (dir === 0) { P(g, fcx - 1, ey, gd[0]); P(g, fcx + 1, ey, gd[0]); }
    else if (dir === 1) { P(g, fcx, ey, gd[0]); P(g, fcx + 2, ey, gd[1]); }
    else { P(g, fcx + 1, ey, gd[0]); }
  }
  // tall iron staff with chained drift mote (mote bobs in idle)
  const stx = cx + off + (dir >= 1 ? 6 : -6);
  for (let y = top - 4; y <= baseY - 1; y++) P(g, stx, y, y % 6 === 0 ? st[3] : st[1]);
  P(g, stx - 1, top - 4, st[2]); P(g, stx + 1, top - 4, st[2]);                 // staff head crook
  P(g, stx, top - 5, st[2]);
  // chain + mote hanging from the head, bobs by frame
  const moteY = top - 1 + sway * 2;
  P(g, stx, top - 3, st[3]); P(g, stx, top - 2, st[3]);                         // chain links
  P(g, stx, moteY, dr[0]); P(g, stx - 1, moteY, dr[1]); P(g, stx + 1, moteY, dr[1]); P(g, stx, moteY + 1, dr[2]); P(g, stx, moteY - 1, dr[1]);
  for (let a = 0; a < 6; a++) { const ax = stx + [2, 2, -2, -2, 0, 0][a], ay = moteY + [0, 1, 0, 1, 2, -2][a]; if (hash2(ax, ay + frame, 412) < 0.5) P(g, ax, ay, dr[2]); }  // faint halo
  // feet
  P(g, cx - 3 + (dir >= 1 ? 1 : 0), baseY, RAMP.void); P(g, cx + 3 + (dir >= 1 ? 1 : 0), baseY, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

/** the objective beacon (64×64, 3 frames: rise/peak/fall of gold light) */
export function drawBeacon(frame: number): Grid {
  const g = makeGrid(64, 64); const cx = 32, cy = 48;            // diamond center
  const gd = RAMP.gold, dr = RAMP.drift;
  const rows = diamondRows();
  // rune-scribed tile (diamond), faint dirt so it reads on grass AND dirt
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    const gx = x, gy = cy - 16 + y;
    const c = ((x + y) % 2 === 0) ? '#2a2032' : '#1b1526';
    P(g, gx, gy, c);
  }
  // gold rune ring scribed on the tile
  tRing(g, cx, cy, 13, 1, gd[2]); tRing(g, cx, cy, 13, 1, gd[2]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P(g, Math.round(cx + Math.cos(a) * 8), Math.round(cy + Math.sin(a) * 4), gd[1]); }
  // diamond edge
  for (let y = 0; y < 32; y++) { P(g, rows[y].x0, cy - 16 + y, RAMP.void); P(g, rows[y].x1, cy - 16 + y, RAMP.void); }
  // rising column of dithered gold light (rise/peak/fall)
  const heights = [22, 34, 14], H = heights[frame % 3];
  const peak = frame === 1;
  for (let k = 0; k < H; k++) {
    const y = cy - 4 - k, t = k / H;
    const w = Math.max(1, Math.round((1 - t) * 6) + (peak ? 1 : 0));
    for (let x = -w; x <= w; x++) {
      const ax = cx + x;
      const core = Math.abs(x) <= 1;
      if (core) P(g, ax, y, t < 0.3 ? gd[0] : gd[1]);
      else if ((ax + y + frame) % 2 === 0 && hash2(ax, y, 421) < (1 - t) * 0.9) P(g, ax, y, Math.abs(x) <= 2 ? gd[1] : gd[2]);
    }
  }
  // crowning mote at the peak
  if (peak) { P(g, cx, cy - 4 - H, gd[0]); P(g, cx, cy - 5 - H, dr[1]); }
  return g;  // no hard outline — it is light
}

/** the bobbing gold arrow pip (16×16, 2 frames) */
export function drawArrowPip(frame: number): Grid {
  const g = makeGrid(16, 16); const cx = 8, bob = frame === 1 ? 2 : 0, gd = RAMP.gold;
  // chunky down-arrow
  const top = 3 + bob;
  for (let y = 0; y < 5; y++) for (let x = -4 + y; x <= 4 - y; x++) P(g, cx + x, top + y, y < 1 ? gd[0] : gd[1]);
  for (let y = 0; y < 4; y++) for (let x = -2; x <= 2; x++) P(g, cx + x, top - 1 - y, gd[2]);  // stem
  for (let x = -2; x <= 2; x++) P(g, cx + x, top - 4, gd[1]);
  outline(g, RAMP.void);
  return g;
}

/** the advancing Drift wall FX (64×96, 3 frames, tiles horizontally seam-free) */
export function drawDriftWall(frame: number): Grid {
  const W = 64, H = 96, g = makeGrid(W, H);
  const dr = RAMP.drift;
  const phase = frame * 1.15;
  for (let x = 0; x < W; x++) {
    // crest silhouette wobbles, PERIODIC across the 64 seam (sin of x/W*2pi)
    const crest = Math.round(H * 0.32 + 9 * Math.sin((x / W) * Math.PI * 2 + phase) + 4 * Math.sin((x / W) * Math.PI * 4 - phase));
    for (let y = crest; y < H; y++) {
      const below = (y - crest) / (H - crest);                 // 0 crest .. 1 floor
      const n = hash2(x, (y + frame * 5) % H, 431);            // boil noise, scrolls up
      const n2 = hash2(x, ((y - frame * 4) % H + H) % H, 432);
      let c: string | null = null;
      if (below > 0.5) {                                        // void-dark core w/ purple veins
        c = (n < 0.13) ? dr[3] : (((x + y) % 2 === 0 && n2 < 0.32) ? dr[4] : RAMP.void);
      } else {                                                  // boiling purple band
        if ((x + y + frame) % 2 === 0 && n < 0.86) c = n < 0.3 ? dr[2] : dr[3];
        else if (n2 < 0.22) c = dr[1];                          // bright veins
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
  for (let i = 0; i < 8; i++) { const mx = (i * 37) % W; const my = ((i * 53 - frame * 7) % H + H) % H; P(g, mx, my, i % 3 === 0 ? dr[0] : dr[1]); }
  // NOTE: no outline (tiling FX strip; an outline would create seams)
  return g;
}

/** Threshold ground accent (64×36 tile overlay, 2 variants: pale flagstone + rune fragments) */
export function drawThresholdTile(variant: number): Grid {
  const g = makeGrid(64, 36); const rows = diamondRows();
  const st = RAMP.stone, gd = RAMP.gold;
  // pale flagstone face
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) {
    let c = ((x + y) % 2 === 0) ? '#4a4660' : st[1];           // pale stone dither
    if (y > 22) c = st[2];
    P(g, x, y, c);
  }
  // 3px south lip + void north edge
  for (let x = 0; x < 64; x++) { let my = -1; for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) { my = y; break; } if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, st[3]); for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; } }
  // cracks
  const seed = 440 + variant;
  let cxk = 20 + variant * 16, cyk = 8;
  for (let s = 0; s < 18; s++) { P(g, cxk, cyk, st[3]); if (hash2(cxk, cyk, seed) < 0.5) P(g, cxk, cyk + 1, st[3]); cxk += (hash2(cxk, cyk, seed + 1) < 0.5 ? 1 : 0) + 1; cyk += (hash2(cxk, cyk, seed + 2) < 0.5 ? 1 : 0); if (!inDiamond(rows, cxk, cyk)) break; }
  // faint gold rune fragments scattered on the face
  const frag: [number, number][] = variant === 0
    ? [[26, 12], [34, 16], [30, 20]]
    : [[24, 14], [38, 12], [32, 18], [28, 22]];
  frag.forEach(([fx, fy], i) => { if (!inDiamond(rows, fx, fy)) return; P(g, fx, fy, gd[2]); if (i % 2 === 0) { P(g, fx + 1, fy, gd[3]); } else { P(g, fx, fy + 1, gd[3]); P(g, fx + 1, fy, gd[2]); } });
  return g;  // accent overlay; keep its own diamond edge only
}

// ─── auras.js — PRESTIGE AURAS (burn-only cosmetics) ─────────────────────────
// 64×64 frames baked around the wanderer; aura anchor (32,56) coincides with
// the wanderer cell anchor (16,39) → draw top-left = char top-left + (-16,-17).
// Particles/motes are outline-free glow; only solid wisp forms get the 1px
// void outline (matching the DS exports byte-for-byte).

const AURA_N = 64, AURA_CX = 32, AURA_FEET = 56, AURA_HEAD = 18;

function stamp(dest: Grid, src: Grid, ox: number, oy: number) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const v = G(src, x, y); if (v) P(dest, ox + x, oy + y, v.c, v.a);
  }
}
// glow mote: optional plus-halo (dimmer) + core; outline-free
function gmote(g: Grid, x: number, y: number, core: string, halo?: string | null) {
  x = Math.round(x); y = Math.round(y);
  if (halo) { P(g, x - 1, y, halo); P(g, x + 1, y, halo); P(g, x, y - 1, halo); P(g, x, y + 1, halo); }
  P(g, x, y, core);
}
// big premium mote: 2×2 core + diamond halo
function gmoteBig(g: Grid, x: number, y: number, core: string, hi: string, halo?: string | null) {
  x = Math.round(x); y = Math.round(y);
  if (halo) { P(g, x - 2, y, halo); P(g, x + 2, y, halo); P(g, x, y - 2, halo); P(g, x, y + 2, halo); P(g, x - 1, y - 1, halo); P(g, x + 1, y - 1, halo); P(g, x - 1, y + 1, halo); P(g, x + 1, y + 1, halo); }
  P(g, x, y, core); P(g, x + 1, y, hi); P(g, x, y + 1, hi); P(g, x + 1, y + 1, hi);
}
// draw a solid form on a temp grid, 1px void outline, stamp onto dest
function solidOn(dest: Grid, drawFn: (t: Grid) => void) {
  const t = makeGrid(AURA_N, AURA_N);
  drawFn(t);
  outline(t, RAMP.void);
  stamp(dest, t, 0, 0);
}

/** Ashen Crown — ash flecks + gold tiara arc over the head. 8f, 6fps. */
export function drawAshenCrown(frame: number): Grid {
  const g = makeGrid(AURA_N, AURA_N);
  const gd = RAMP.gold, bn = RAMP.bone, ash = RAMP.ash;
  const cx = AURA_CX, cy = AURA_HEAD - 3, rx = 15, ry = 6;
  const fp = frame / 8;

  // floating crown arc (solid, outlined) — prongs riding a gentle curved band
  solidOn(g, t => {
    const span = 13;
    // curved band: y dips at the ends (a tiara arc over the head)
    for (let x = cx - span; x <= cx + span; x++) {
      const u = (x - cx) / span;                       // -1..1
      const yb = Math.round(cy + 2 + u * u * 3 + Math.sin(fp * Math.PI * 2 + x * 0.25) * 0.4);
      P(t, x, yb, gd[2]);
      if ((x - cx) % 4 === 0) P(t, x, yb - 1, gd[1]);  // beaded highlights, not a solid rail
    }
    // five prongs of unequal height rising off the band
    for (let i = -2; i <= 2; i++) {
      const px = cx + i * 6;
      const u = i / 2;
      const bandY = Math.round(cy + 2 + u * u * 3);
      const bob = Math.sin(fp * Math.PI * 2 + i) * 0.6;
      const h = (i === 0 ? 6 : Math.abs(i) === 1 ? 4 : 3);
      for (let k = 0; k < h; k++) P(t, px, Math.round(bandY - 1 - k + bob), k === h - 1 ? gd[0] : gd[1]);
    }
  });
  // gem on the center prong
  gmote(g, cx, cy - 7 + Math.round(Math.sin(fp * Math.PI * 2) * 0.6), bn[0], gd[1]);

  // orbiting ash flecks (outline-free), slow drift, depth-dimmed on the far arc
  const M = 14;
  for (let i = 0; i < M; i++) {
    const ang = (i / M) * Math.PI * 2 + fp * Math.PI * 2 * 0.5;
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry + Math.sin(fp * Math.PI * 2 + i) * 0.8;
    const far = Math.sin(ang) < -0.2;       // upper/back arc
    const pick = i % 5;
    let c = pick === 0 ? gd[0] : pick === 1 ? bn[0] : pick === 2 ? bn[1] : pick === 3 ? gd[1] : ash;
    if (far) c = (pick < 2) ? gd[2] : bn[3];
    if (i % 4 === (frame % 4)) gmote(g, x, y, c, far ? null : (pick === 0 ? gd[2] : bn[3]));
    else P(g, Math.round(x), Math.round(y), c);
    // trailing ash speck
    if (!far && i % 3 === 0) P(g, Math.round(x - Math.cos(ang)), Math.round(y - Math.sin(ang)), ash);
  }
  return g;
}

/** Corruption Halo — pulsing violet ring, motes spiraling inward. 6f, 8fps. */
export function drawCorruptionHalo(frame: number): Grid {
  const g = makeGrid(AURA_N, AURA_N);
  const dr = RAMP.drift;
  const cx = AURA_CX, cy = 35, fp = frame / 6;
  const pulse = Math.sin(fp * Math.PI * 2);
  const rx = 17 + pulse * 2, ry = 9 + pulse;

  // the pulsing ring (dotted drift motes on an iso ellipse)
  const RING = 26;
  for (let i = 0; i < RING; i++) {
    const ang = (i / RING) * Math.PI * 2 + fp * Math.PI * 0.5;
    const x = cx + Math.cos(ang) * rx, y = cy + Math.sin(ang) * ry;
    const far = Math.sin(ang) < 0;
    if ((i + frame) % 2 === 0) {
      const bright = pulse > 0.4 && i % 4 === 0;
      gmote(g, x, y, far ? dr[3] : (bright ? dr[0] : dr[2]), far ? null : dr[4]);
    }
  }
  // motes spiraling INWARD toward the core
  const SP = 10;
  for (let i = 0; i < SP; i++) {
    const t = ((frame + i * 0.6) % 6) / 6;            // 0 outer .. 1 core
    const r = (1 - t) * 22 + 3;
    const ang = i / SP * Math.PI * 2 + t * Math.PI * 2.2;
    const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.5;
    const c = t > 0.7 ? dr[0] : t > 0.4 ? dr[1] : dr[2];
    gmote(g, x, y, c, t > 0.5 ? dr[3] : null);
  }
  // pulsing core (the small Drift) at chest height
  const corec = pulse > 0 ? dr[0] : dr[1];
  gmoteBig(g, cx, cy - 1, corec, dr[1], dr[3]);
  if (pulse > 0.5) { P(g, cx, cy - 4, dr[2]); P(g, cx, cy + 2, dr[2]); P(g, cx - 3, cy - 1, dr[2]); P(g, cx + 3, cy - 1, dr[2]); }
  return g;
}

/** Ember Cinder — rising sparks cooling to blood-ash. 6f, 8fps. */
export function drawEmberCinder(frame: number): Grid {
  const g = makeGrid(AURA_N, AURA_N);
  const em = RAMP.ember, bl = RAMP.blood;
  const cx = AURA_CX;
  const K = 16;
  for (let i = 0; i < K; i++) {
    const t = ((frame + i * 1.7) % 6) / 6;            // 0 born at feet .. 1 spent at top
    const y = AURA_FEET - 2 - t * 46;
    const swirl = Math.sin(t * Math.PI * 2 + i * 1.3) * (11 * (1 - t * 0.35));
    const x = cx + swirl + (i % 2 ? 1 : -1) * 2;
    if (t > 0.92) continue;                            // fade out at the crest
    let core: string, halo: string;
    if (t < 0.3) { core = em[0]; halo = em[1]; }       // hot newborn spark
    else if (t < 0.6) { core = em[1]; halo = em[2]; }
    else { core = bl[1]; halo = i % 2 ? bl[2] : em[3]; } // cooling to blood-ash
    if (t < 0.25 && i % 3 === 0) gmoteBig(g, x, y, em[0], em[1], em[2]);
    else gmote(g, x, y, core, (t < 0.7 && i % 2 === 0) ? halo : null);
    // upward trailing wisp
    if (t < 0.7) P(g, Math.round(x), Math.round(y + 1), t < 0.4 ? em[2] : bl[3]);
  }
  // a low ember glow at the feet (source)
  for (let x = cx - 5; x <= cx + 5; x++) if ((x + frame) % 2 === 0) P(g, x, AURA_FEET, x % 3 ? em[3] : em[2]);
  return g;
}

/** Bonewisp — pale skeletal wisps orbiting low at the feet. 8f, 6fps. */
export function drawBonewisp(frame: number): Grid {
  const g = makeGrid(AURA_N, AURA_N);
  const bn = RAMP.bone, dr = RAMP.drift;
  const cx = AURA_CX, cy = 49, rx = 15, ry = 5, fp = frame / 8;
  const W = 5;
  // back wisps first (drawn dimmer), then front
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < W; i++) {
      const ang = (i / W) * Math.PI * 2 + fp * Math.PI * 2;
      const far = Math.sin(ang) < 0;
      if ((pass === 0) !== far) continue;
      const x = cx + Math.cos(ang) * rx;
      const y = cy + Math.sin(ang) * ry;
      const flick = Math.sin(fp * Math.PI * 2 * 2 + i) > 0 ? 1 : 0;
      // small flame/comma wisp, solid + void outline
      solidOn(g, t => {
        const tip = far ? bn[2] : bn[0], body = far ? bn[3] : bn[1], base = bn[3];
        P(t, Math.round(x), Math.round(y - 2 - flick), tip);
        P(t, Math.round(x), Math.round(y - 1), body);
        P(t, Math.round(x), Math.round(y), body);
        P(t, Math.round(x + (i % 2 ? 1 : -1)), Math.round(y), base);
        P(t, Math.round(x), Math.round(y + 1), base);
      });
      // cold drift glint in the wisp's eye-hollow (sparingly)
      if (!far && i === (frame % W)) P(g, Math.round(x), Math.round(y - 1), dr[1]);
      // trailing cold spark
      if (!far) gmote(g, x - Math.cos(ang) * 2, y - Math.sin(ang) * 2, bn[2], null);
    }
  }
  // faint ground mist ring at the feet
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + fp * Math.PI; const x = cx + Math.cos(a) * (rx - 2); const y = cy + 3 + Math.sin(a) * (ry - 1); if ((i + frame) % 2 === 0) P(g, Math.round(x), Math.round(y), bn[3]); }
  return g;
}

/** The Tarnished Chalice — season-exclusive (battle pass) prestige aura. A
 *  gilded, rot-eaten two-handled trophy cup floats above the head; its detached
 *  lid orbits while gilded motes rise from the feet. 3f, 4fps. (DS battlepass.js) */
export function drawTarnishedChalice(frame: number): Grid {
  const N = AURA_N;
  const g = makeGrid(N, N);
  const gd = RAMP.gold, dr = RAMP.drift;
  const cx = 32;
  const fp = frame / 3;                       // 3-frame loop

  // ---- gilded motes rising from the feet up into the cup (outline-free) ----
  const M = 7;
  for (let i = 0; i < M; i++) {
    const t = ((i / M) + fp) % 1;             // 0 born at feet .. 1 spent at cup
    if (t < 0.04 || t > 0.95) continue;
    const y = 54 - t * 37;                    // 54 → ~17 (just under the foot)
    const sway = Math.sin(t * Math.PI * 2 + i * 1.7) * 3.2;
    const x = cx + sway + (i % 2 ? 2 : -2);
    const c = t < 0.4 ? gd[2] : t < 0.72 ? gd[1] : gd[0];
    gmote(g, x, y, c, (t > 0.45 && i % 2 === 0) ? gd[3] : null);
    if (t < 0.5) P(g, Math.round(x), Math.round(y + 1), gd[3]); // brief trailing spark
  }

  // ---- the gilded two-handled trophy cup (solid, void-outlined) ----
  solidOn(g, t => {
    const row = (y: number, x0: number, x1: number) => {
      for (let x = x0; x <= x1; x++) {
        let c = gd[1];
        if (x === x0) c = gd[0];              // moonlit left
        if (x === x1) c = gd[2];              // shadow right
        P(t, x, y, c);
      }
    };
    // bowl
    row(8, 28, 36); row(9, 28, 36); row(10, 29, 35); row(11, 30, 34); row(12, 31, 33);
    // stem
    P(t, 32, 13, gd[2]); P(t, 32, 14, gd[2]);
    // foot
    row(15, 30, 34); row(16, 29, 35);
    P(t, 30, 16, gd[2]); P(t, 35, 16, gd[3]);
    // loop handles
    P(t, 27, 9, gd[1]); P(t, 26, 10, gd[1]); P(t, 26, 11, gd[2]); P(t, 27, 12, gd[2]);
    P(t, 37, 9, gd[1]); P(t, 38, 10, gd[2]); P(t, 38, 11, gd[3]); P(t, 37, 12, gd[3]);
    // a couple of interior value steps so the gold reads as recovered, not flat
    P(t, 30, 9, gd[0]); P(t, 34, 10, gd[3]); P(t, 31, 11, gd[0]);
  });

  // ---- rim rot: the Drift eats the gold rim (dither + a chipped void notch) ----
  P(g, 34, 8, dr[2]); P(g, 33, 9, dr[3]); P(g, 35, 9, dr[2]);
  P(g, 36, 8, RAMP.void);                     // a chip pitted out of the rim
  if (frame % 2 === 0) P(g, 35, 11, dr[2]);   // a corruption droplet weeping down
  P(g, 29, 8, dr[3]);                         // far-rim pitting

  // ---- the DETACHED LID orbiting the head (solid, outlined) ----
  const ang = fp * Math.PI * 2 - Math.PI * 0.5;
  const lx = Math.round(cx + Math.cos(ang) * 12);
  const ly = Math.round(30 + Math.sin(ang) * 4);
  const far = Math.sin(ang) < -0.15;          // upper/back arc → dimmer, behind head
  solidOn(g, t => {
    const a = far ? gd[2] : gd[0], b = far ? gd[3] : gd[1];
    P(t, lx - 2, ly, b); P(t, lx - 1, ly, a); P(t, lx, ly, a); P(t, lx + 1, ly, a); P(t, lx + 2, ly, b);
    P(t, lx - 1, ly - 1, a); P(t, lx, ly - 1, a); P(t, lx + 1, ly - 1, b);
    P(t, lx, ly - 2, b);                      // knob
  });
  if (!far) P(g, lx + 1, ly, dr[2]);          // matching rot on the lid

  return g;
}

// ─── Ashfall dye — the season-exclusive wanderer cloak colorway (DS battlepass.js)
// Same mechanism as avatars: each channel resolves to a LOCKED RAMP, baked at
// draw time over the stock wanderer (no new rig). base=cloak/hood (ramp-swap
// from stone), trim=banded gilt, corrupt=hem corruption + eyes (swap from drift).
const DYE_RAMP: Record<string, readonly string[]> = {
  stone: RAMP.stone, bone: RAMP.bone, dirt: RAMP.dirt, blood: RAMP.blood,
  grass: RAMP.grass, gold: RAMP.gold, ember: RAMP.ember, drift: RAMP.drift, water: RAMP.water,
};
export const WANDERER_DYE_CHANNELS = {
  base:    ['stone', 'bone', 'dirt', 'blood', 'grass'],
  trim:    ['gold', 'ember', 'bone', 'drift', 'blood'],
  corrupt: ['drift', 'blood', 'ember', 'water', 'grass'],
} as const;
export interface WandererDyeLook { base?: string | number; trim?: string | number; corrupt?: string | number }
/** the named season colorway: ash-grey base, banded gold trim, drift hem */
export const ASHFALL_DYE: WandererDyeLook = { base: 'stone', trim: 'gold', corrupt: 'drift' };
function resolveDye(look?: WandererDyeLook) {
  const L = look || ASHFALL_DYE;
  const pick = (chan: keyof typeof WANDERER_DYE_CHANNELS, v: string | number | undefined) => {
    const opts = WANDERER_DYE_CHANNELS[chan];
    if (v == null) return DYE_RAMP[opts[0]];
    if (typeof v === 'number') return DYE_RAMP[opts[Math.max(0, Math.min(opts.length - 1, v))]];
    return DYE_RAMP[v] || DYE_RAMP[opts[0]];
  };
  return { base: pick('base', L.base), trim: pick('trim', L.trim), corrupt: pick('corrupt', L.corrupt) };
}
/** the dyed wanderer: stock rig post-processed (ramp swap + banded trim + hem
 *  corruption). `equip` composes (gear ramps aren't in the base set). */
export function drawWandererDyed(
  facing: IsoFacing, anim: AnimName, f: number, look?: WandererDyeLook, equip?: EquipVisual,
): Grid {
  const { base, trim, corrupt } = resolveDye(look);
  const g = drawWanderer(facing, anim, f, equip);   // stone cloak, drift hem/eyes, void outline

  // 1) ramp swap (skip void outline / anything off-ramp)
  const map: Record<string, string> = {};
  RAMP.stone.forEach((c, i) => { map[c] = base[Math.min(i, base.length - 1)]; });
  RAMP.drift.forEach((c, i) => { map[c] = corrupt[Math.min(i, corrupt.length - 1)]; });
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y); if (v && map[v.c]) P(g, x, y, map[v.c]);
  }

  // 2) banded gold trim — adaptive scan per row across the garment interior
  const bob = (anim === 'walk') ? [0, -1, 0, 0, -1, 0][f] : 0;
  const baseSet = new Set(base);
  const bandRow = (y: number, midC: string, loC: string, hiC: string) => {
    let lo = 99, hi = -1;
    for (let x = 0; x < g.w; x++) { const v = G(g, x, y); if (v && baseSet.has(v.c)) { if (x < lo) lo = x; if (x > hi) hi = x; } }
    if (hi < lo) return;
    for (let x = lo; x <= hi; x++) { const v = G(g, x, y); if (v && baseSet.has(v.c)) P(g, x, y, x === lo ? loC : x === hi ? hiC : midC); }
  };
  bandRow(20 + bob, trim[1], trim[0], trim[2]);   // collar
  bandRow(32 + bob, trim[1], trim[0], trim[2]);   // mid-hem band
  bandRow(34 + bob, trim[2], trim[1], trim[3] || trim[2]); // lower band

  // 3) faint drift-purple corruption creeping up the hem
  for (let x = 0; x < g.w; x++) for (let y = 31 + bob; y <= 34 + bob; y++) {
    const v = G(g, x, y); if (v && baseSet.has(v.c) && hash2(x, y, 137) < 0.10) P(g, x, y, corrupt[3]);
  }
  return g;
}

export type PrestigeAuraKey = 'ashen_crown' | 'corruption_halo' | 'ember_cinder' | 'bonewisp' | 'tarnished_chalice';
export const PRESTIGE_AURAS: Record<PrestigeAuraKey, { fn: (frame: number) => Grid; frames: number; fps: number }> = {
  ashen_crown:     { fn: drawAshenCrown,     frames: 8, fps: 6 },
  corruption_halo: { fn: drawCorruptionHalo, frames: 6, fps: 8 },
  ember_cinder:    { fn: drawEmberCinder,    frames: 6, fps: 8 },
  bonewisp:        { fn: drawBonewisp,       frames: 8, fps: 6 },
  tarnished_chalice: { fn: drawTarnishedChalice, frames: 3, fps: 4 },
};

/** pass_emblem — a 32×32 "seasonal ledger" sigil: a gilded two-handled chalice
 *  mark over a furled parchment banner with drift-corruption flecks. mono = the
 *  bone-only variant. Static (panel headers / docs). (DS battlepass.js) */
export function drawPassEmblem(mono: boolean): Grid {
  const g = makeGrid(32, 32);
  const GOLD = mono ? RAMP.bone : RAMP.gold;
  const PARCH = RAMP.bone;                     // parchment banner (ledger)
  const TRIM = mono ? RAMP.bone : RAMP.gold;
  const ROT = mono ? RAMP.bone : RAMP.drift;
  const pb = mono ? 2 : 1;                      // parchment darkened a step in mono for contrast

  // ---- furled parchment banner (behind): a hanging ledger scroll ----
  for (let x = 7; x <= 24; x++) P(g, x, 10, PARCH[mono ? 2 : 0]);
  for (let x = 7; x <= 24; x++) P(g, x, 11, PARCH[3]);
  P(g, 6, 10, PARCH[3]); P(g, 6, 11, PARCH[2]); P(g, 25, 10, PARCH[3]); P(g, 25, 11, PARCH[2]); // rolled end curls
  // draped body (narrower than the furl bar)
  for (let y = 12; y <= 23; y++) {
    const lo = 9, hi = 22;
    for (let x = lo; x <= hi; x++) {
      let c = PARCH[pb];
      if (x === lo) c = PARCH[mono ? 1 : 0];
      if (x === hi) c = PARCH[mono ? 3 : 2];
      P(g, x, y, c);
    }
  }
  // ledger rule-lines (full horizontal strokes)
  [15, 18, 21].forEach((y) => { for (let x = 11; x <= 20; x++) P(g, x, y, PARCH[3]); });
  // forked swallowtail bottom (two tails + a center V-notch)
  for (let y = 24; y <= 27; y++) {
    const k = y - 24;
    for (let x = 9; x <= 13 - k; x++) P(g, x, y, x === 9 ? PARCH[mono ? 1 : 0] : PARCH[pb]);
    for (let x = 18 + k; x <= 22; x++) P(g, x, y, x === 22 ? PARCH[mono ? 3 : 2] : PARCH[pb]);
  }
  // gold trim bands (top & bottom of the draped body)
  for (let x = 9; x <= 22; x++) P(g, x, 12, TRIM[1]);
  for (let x = 10; x <= 21; x++) P(g, x, 23, TRIM[2]);

  // ---- gilded two-handled chalice mark (front, on the banner) ----
  const crow = (y: number, x0: number, x1: number) => {
    for (let x = x0; x <= x1; x++) { let c = GOLD[1]; if (x === x0) c = GOLD[0]; if (x === x1) c = GOLD[2]; P(g, x, y, c); }
  };
  crow(4, 13, 19); crow(5, 13, 19); crow(6, 14, 18); crow(7, 15, 17);   // bowl
  P(g, 16, 8, GOLD[2]); P(g, 16, 9, GOLD[2]);                            // stem
  crow(10, 13, 19); P(g, 13, 10, GOLD[0]); P(g, 19, 10, GOLD[2]);        // foot
  // loop handles
  P(g, 12, 4, GOLD[1]); P(g, 11, 5, GOLD[1]); P(g, 11, 6, GOLD[2]); P(g, 12, 7, GOLD[2]);
  P(g, 20, 4, GOLD[1]); P(g, 21, 5, GOLD[2]); P(g, 21, 6, GOLD[3]); P(g, 20, 7, GOLD[3]);
  // rim rot on the chalice
  P(g, 18, 4, ROT[mono ? 3 : 2]); P(g, 19, 4, ROT[3]);

  outline(g, RAMP.void);

  // ---- drift-corruption flecks (outline-free, after outline) ----
  if (!mono) {
    P(g, 9, 17, RAMP.drift[2]); P(g, 8, 17, RAMP.drift[3]);     // corruption eating the left edge
    P(g, 22, 20, RAMP.drift[2]); P(g, 23, 20, RAMP.drift[3]);   // right edge
    P(g, 16, 25, RAMP.drift[3]);                                // a fleck in the notch
  } else {
    P(g, 9, 17, RAMP.bone[3]); P(g, 22, 20, RAMP.bone[3]); P(g, 16, 25, RAMP.bone[3]);
  }
  return g;
}

// ─── wheelfaces.js — the two spin-wheel faces (HUD overlay art) ───────────────
// 240×240, hub at (120,124), pointer baked at top. Segment order is EXACT
// (the overlay lands the pointer on a server-named segment). The `noPointer`
// option is a runtime-only deviation: the overlay keeps its own FIXED pointer
// while the face rotates (byte-diffs against the exports use the full face).

const WHEEL_N = 240, WCX = 120, WCY = 124;

function wheelDisc(g: Grid, r0: number, r1: number, fn: (x: number, y: number, d: number, ang: number) => void) {
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
function wheelRing(g: Grid, r: number, w: number, c: string) {
  wheelDisc(g, r - w, r, (x, y) => P(g, x, y, c));
}
// outline only solid pixels within a sub-rect (keeps motes glow clean)
function solidOutlineRegion(g: Grid, x0: number, y0: number, w: number, h: number) {
  const add: [number, number][] = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (G(g, x, y)) continue;
    if (G(g, x + 1, y) || G(g, x - 1, y) || G(g, x, y + 1) || G(g, x, y - 1)) add.push([x, y]);
  }
  add.forEach((p) => P(g, p[0], p[1], RAMP.void));
}

interface WheelSeg { label: string; sweep: number; paint: (t: number, d: number, ang: number, x: number, y: number) => string | undefined }

function buildWheel(frame: number, segs: WheelSeg[], opt: { corrupt?: boolean; noPointer?: boolean } = {}): { g: Grid; bounds: [number, number, WheelSeg][] } {
  const g = makeGrid(WHEEL_N, WHEEL_N);
  const st = RAMP.stone, dr = RAMP.drift, gd = RAMP.gold;
  const Rseg = 96, Rrim = 110;

  let acc = 0; const bounds: [number, number, WheelSeg][] = [];
  segs.forEach((s) => { bounds.push([acc, acc + s.sweep, s]); acc += s.sweep; });

  // --- segments ---
  wheelDisc(g, 0, Rseg, (x, y, d, ang) => {
    const seg = bounds.find((b) => ang >= b[0] && ang < b[1]) || bounds[bounds.length - 1];
    const localT = (ang - seg[0]) / seg[2].sweep;
    const c = seg[2].paint(localT, d / Rseg, ang, x, y);
    if (c) P(g, x, y, c);
    for (const b of bounds) { const a0 = b[0]; const da = ((ang - a0 + 540) % 360) - 180; if (Math.abs(da) < 0.8 && d > 8) P(g, x, y, st[3]); }
  });

  // --- ornate stone rim ---
  wheelDisc(g, Rseg, Rrim, (x, y, d, ang) => {
    const lit = Math.cos((ang - 315) * Math.PI / 180) > 0;
    let c = lit ? st[1] : st[3];
    if (d > Rrim - 2) c = RAMP.void;
    else if (d < Rseg + 2) c = st[3];
    else if (lit && d < Rseg + 5) c = st[0];
    if (Math.abs(((ang % 30) + 30) % 30 - 15) < 1.2 && d > Rseg + 3 && d < Rrim - 3) c = (frame ? gd[0] : gd[1]);
    P(g, x, y, c);
  });
  const glintAng = frame ? 48 : 312;
  wheelDisc(g, Rseg + 2, Rrim - 2, (x, y, d, ang) => { const da = ((ang - glintAng + 540) % 360) - 180; if (Math.abs(da) < 7) P(g, x, y, opt.corrupt ? dr[1] : gd[0]); });
  if (opt.corrupt) {
    const mr = mulberry(frame + 1);
    for (let i = 0; i < 26; i++) { const a = mr() * 360 * Math.PI / 180; const rr = Rrim + mr() * 12; const x = Math.round(WCX + Math.sin(a) * rr), y = Math.round(WCY - Math.cos(a) * rr); P(g, x, y, mr() < 0.4 ? dr[0] : dr[2]); if (mr() < 0.3) P(g, x, y + 1, dr[3]); }
  }

  // --- hub ---
  wheelDisc(g, 0, 12, (x, y, d) => { let c = dr[3]; if (d < 9) c = dr[2]; if (d < 5) c = dr[1]; if (d < 2) c = dr[0]; P(g, x, y, c); });
  wheelRing(g, 12, 1, RAMP.void);
  wheelRing(g, 13, 1, gd[2]);

  // --- pointer cap at top (omittable: the overlay keeps a fixed pointer) ---
  if (!opt.noPointer) {
    const py = WCY - Rrim - 2;
    for (let j = 0; j < 16; j++) { const w = Math.max(0, 7 - Math.floor(j / 1.4)); for (let x = -w; x <= w; x++) { let c = gd[1]; if (x < -w + 1) c = gd[0]; if (x > w - 1) c = gd[3]; P(g, WCX + x, py + j, c); } }
    for (let x = -6; x <= 6; x++) P(g, WCX + x, py - 1, gd[2]);
    fillRect(g, WCX - 3, py + 2, 3, 3, gd[0]);
    solidOutlineRegion(g, WCX - 9, py - 2, 18, 20);
  }

  return { g, bounds };
}

function goldWheelSegs(): WheelSeg[] {
  const st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift;
  const coin = (rich: boolean) => (t: number, d: number, _ang: number, x: number, y: number) => {
    let c = ((x + y) % 2 === 0) ? (rich ? gd[1] : gd[3]) : (rich ? gd[2] : RAMP.dirt[2]);
    if (d > 0.4 && d < 0.72 && Math.abs(t - 0.5) < 0.16) c = (rich ? gd[0] : gd[1]);
    if (d >= 0.72 && d < 0.78 && Math.abs(t - 0.5) < 0.2) c = gd[3];
    return c;
  };
  return [
    { label: 'house', sweep: 144, paint: (_t, _d, _ang, x, y) => ((x + y) % 2 === 0 ? RAMP.void : st[3]) },
    { label: 'coin_poor', sweep: 43, paint: coin(false) },
    { label: 'coin_rich', sweep: 43, paint: coin(true) },
    { label: 'jackpot', sweep: 43, paint: (t, d, _ang, x, y) => { let c = ((x + y) % 2 === 0) ? gd[0] : gd[1]; if (d > 0.55 && Math.abs(t - 0.5) < 0.22) c = RAMP.bone[0]; return c; } },
    { label: 'drift_shard', sweep: 43, paint: (t, d, _ang, x, y) => { let c = ((x + y) % 2 === 0) ? dr[2] : dr[3]; if (d > 0.4 && d < 0.74 && Math.abs(t - 0.5) < 0.12) c = (d < 0.57 ? dr[0] : dr[1]); return c; } },
    { label: 'coin_mid', sweep: 44, paint: coin(false) },
  ];
}

function darkWheelSegs(): WheelSeg[] {
  const st = RAMP.stone, dr = RAMP.drift, gd = RAMP.gold;
  const dim = (violet: boolean) => (t: number, d: number, _ang: number, x: number, y: number) => {
    let c = ((x + y) % 2 === 0) ? (violet ? dr[3] : st[2]) : (violet ? RAMP.void : st[3]);
    if (d > 0.5 && d < 0.7 && Math.abs(t - 0.5) < 0.1) c = violet ? dr[2] : st[1];
    return c;
  };
  return [
    { label: 'common_a', sweep: 51, paint: dim(false) },
    { label: 'drift_a', sweep: 51, paint: dim(true) },
    { label: 'common_b', sweep: 51, paint: dim(false) },
    { label: 'drift_b', sweep: 51, paint: dim(true) },
    { label: 'relic', sweep: 9, paint: (_t, d, _ang, x, y) => { let c = ((x + y) % 2 === 0) ? gd[0] : dr[1]; if (d < 0.5) c = RAMP.bone[0]; if (d > 0.78) c = gd[2]; return c; } },
    { label: 'common_c', sweep: 45, paint: dim(false) },
    { label: 'drift_c', sweep: 51, paint: dim(true) },
    { label: 'common_d', sweep: 51, paint: dim(false) },
  ];
}

export function drawGoldWheelFace(frame: number, noPointer = false) { return buildWheel(frame, goldWheelSegs(), { corrupt: false, noPointer }); }
export function drawDarkWheelFace(frame: number, noPointer = false) { return buildWheel(frame, darkWheelSegs(), { corrupt: true, noPointer }); }

/** segment angular spans by label (the overlay lands the pointer on these) */
export function wheelSegmentAngles(kind: 'gold' | 'dark'): { label: string; start: number; sweep: number }[] {
  const segs = kind === 'gold' ? goldWheelSegs() : darkWheelSegs();
  let acc = 0;
  return segs.map((s) => { const out = { label: s.label, start: acc, sweep: s.sweep }; acc += s.sweep; return out; });
}

// ─── guildbanner.js — the territory banner (engine sprite) ───────────────────
// 48×96, bottom-center anchor (24,95); the tag is drawn by the engine over
// the blank plate (GB_PLATE, in cell px). 3f sway + a fallen variant.

export const GB_PLATE = { x: 14, y: 30, w: 22, h: 26 };

export function drawGuildBanner(frame: number): Grid {
  const g = makeGrid(48, 96);
  const dt = RAMP.dirt, bn = RAMP.bone, dr = RAMP.drift, gd = RAMP.gold;
  const poleX = 14, topY = 8, baseY = 96 - 2;

  for (let x = poleX - 7; x <= poleX + 7; x++) if ((x + 1) % 2 === 0) P(g, x, baseY, RAMP.void);

  for (let y = topY; y <= baseY - 1; y++) for (let x = poleX - 1; x <= poleX + 1; x++) {
    let c = dt[1]; if (x === poleX - 1) c = dt[0]; if (x === poleX + 1) c = dt[3];
    if (hash2(x, y, 3) < 0.08) c = dt[2];
    P(g, x, y, c);
  }
  P(g, poleX, topY - 3, dr[0]); P(g, poleX, topY - 2, dr[1]); P(g, poleX - 1, topY - 1, dr[2]); P(g, poleX + 1, topY - 1, dr[2]); P(g, poleX, topY - 1, dr[1]);
  for (let x = poleX - 2; x <= poleX + 20; x++) P(g, x, topY, dt[3]);
  for (let x = poleX - 2; x <= poleX + 20; x++) P(g, x, topY + 1, dt[2]);
  P(g, poleX + 20, topY - 1, dr[2]);

  const clothX0 = poleX + 2, clothW = 22, clothTop = topY + 2, clothBot = 70;
  const sway = [0, 1, 0][frame] || 0;
  const phase = frame;
  for (let y = clothTop; y <= clothBot; y++) {
    const t = (y - clothTop) / (clothBot - clothTop);
    const wave = Math.round(Math.sin(t * 3.2 + phase * 1.3) * (1.4 * t) + sway * t);
    for (let x = clothX0; x <= clothX0 + clothW; x++) {
      const u = (x - clothX0) / clothW;
      const xoff = Math.round(wave * u);
      let c = bn[1];
      if (u < 0.12) c = bn[3];
      else if (u > 0.86) c = bn[2];
      const fold = Math.sin(u * 9 + phase);
      if (fold > 0.7) c = bn[0]; else if (fold < -0.7) c = bn[2];
      if (y <= clothTop + 1 || u > 0.93) c = dr[2];
      P(g, x + xoff, y, c);
    }
    if (y > clothBot - 8) {
      const cut = 8 - (clothBot - y);
      for (let x = clothX0 + clothW / 2 - cut; x <= clothX0 + clothW / 2 + cut; x++) {
        const u = (x - clothX0) / clothW; const xoff = Math.round(wave * u);
        if (Math.abs(x - (clothX0 + clothW / 2)) < cut) g.d[y * g.w + (x + xoff)] = null;
      }
    }
  }
  const swayP = Math.round(sway * 0.4);
  for (let y = GB_PLATE.y; y < GB_PLATE.y + GB_PLATE.h; y++) for (let x = GB_PLATE.x; x < GB_PLATE.x + GB_PLATE.w; x++) {
    const edge = (y === GB_PLATE.y || y === GB_PLATE.y + GB_PLATE.h - 1 || x === GB_PLATE.x || x === GB_PLATE.x + GB_PLATE.w - 1);
    P(g, x + swayP, y, edge ? dr[3] : bn[1]);
  }
  P(g, GB_PLATE.x + swayP, GB_PLATE.y, gd[2]); P(g, GB_PLATE.x + GB_PLATE.w - 1 + swayP, GB_PLATE.y, gd[2]);
  P(g, GB_PLATE.x + swayP, GB_PLATE.y + GB_PLATE.h - 1, gd[2]); P(g, GB_PLATE.x + GB_PLATE.w - 1 + swayP, GB_PLATE.y + GB_PLATE.h - 1, gd[2]);

  outline(g, RAMP.void);
  return g;
}

export function drawGuildBannerFallen(): Grid {
  const g = makeGrid(48, 96);
  const dt = RAMP.dirt, bn = RAMP.bone, dr = RAMP.drift;
  const baseX = 18, baseY = 96 - 2;
  for (let k = 0; k < 60; k++) {
    const x = baseX + Math.round(k * 0.42), y = baseY - k;
    if (y < 18) break;
    for (let o = -1; o <= 1; o++) { let c = dt[1]; if (o === -1) c = dt[0]; if (o === 1) c = dt[3]; if (hash2(x + o, y, 4) < 0.1) c = dt[2]; P(g, x + o, y, c); }
  }
  const topX = baseX + Math.round(59 * 0.42), topY = baseY - 59;
  for (let x = topX - 1; x <= topX + 12; x++) P(g, x, topY, dt[3]);
  const cx0 = topX + 1, cw = 20, ct = topY + 1, cb = topY + 40;
  for (let y = ct; y <= cb; y++) {
    const t = (y - ct) / (cb - ct);
    const lean = Math.round(t * 6);
    for (let x = cx0; x <= cx0 + cw; x++) {
      const u = (x - cx0) / cw;
      const eat = hash2(x, y, 7);
      const ragged = u > (0.6 + 0.35 * Math.sin(y * 0.7)) || (t > 0.7 && eat < 0.5);
      if (ragged) { if (eat < 0.35 && u > 0.5) P(g, x + lean, y, eat < 0.15 ? dr[1] : dr[3]); continue; }
      let c = bn[2];
      if (u < 0.14) c = bn[3];
      const fold = Math.sin(u * 8); if (fold > 0.6) c = bn[1]; else if (fold < -0.6) c = bn[3];
      if (u > 0.5 && eat < 0.2) c = dr[3];
      if (y <= ct + 1) c = dr[3];
      P(g, x + lean, y, c);
    }
  }
  for (let i = 0; i < 6; i++) { const x = cx0 + 4 + (i * 3) % cw, y = cb - 4 - (i % 4) * 5; P(g, x, y, i % 2 ? dr[1] : dr[2]); }
  P(g, baseX - 4, baseY - 1, dr[1]); P(g, baseX - 5, baseY, dr[3]);
  outline(g, RAMP.void);
  return g;
}

// ─── cache.js — the Drift Cache (HUD reveal art) ──────────────────────────────
// 64×64, bottom-center anchor (32,58). sealed(1f) · opening(2f) · burst(2f).

function chestBody(g: Grid, lidLift: number) {
  const ir0 = '#1a1626', dr = RAMP.drift, gd = RAMP.gold;
  const cx = 32, w = 17, bodyTop = 34, bodyBot = 58;
  for (let y = bodyTop; y <= bodyBot; y++) for (let x = cx - w; x <= cx + w; x++) {
    let c = '#2a2438'; if (x < cx - w + 2) c = '#3a3350'; if (x > cx + w - 2) c = ir0;
    if (y > bodyBot - 3) c = ir0;
    P(g, x, y, c);
  }
  for (let x = cx - w + 1; x <= cx + w - 1; x++) { if ((x - cx) % 5 === 0) for (let y = bodyTop + 1; y < bodyBot - 1; y++) P(g, x, y, RAMP.dirt[3]); }
  for (let y = bodyTop; y <= bodyBot; y++) { P(g, cx - w, y, ir0); P(g, cx + w, y, ir0); if (y % 2 === 0) { P(g, cx - w + 1, y, dr[3]); P(g, cx + w - 1, y, dr[3]); } }
  fillRect(g, cx - 3, bodyTop + 4, 6, 7, gd[2]); P(g, cx, bodyTop + 7, RAMP.void); fillRect(g, cx - 2, bodyTop + 4, 4, 1, gd[1]);
  P(g, cx, bodyTop + 6, gd[0]);

  const lidBot = bodyTop, lidH = 13;
  const ly = lidBot - lidLift;
  if (lidLift > 0) {
    for (let yy = ly; yy < lidBot; yy++) for (let x = cx - w + 1; x <= cx + w - 1; x++) {
      const t = (yy - ly) / Math.max(1, lidBot - ly);
      let c = dr[3]; if (t > 0.3) c = dr[2]; if (t > 0.6) c = dr[1]; if (t > 0.85) c = dr[0];
      if (hash2(x, yy, 9) < 0.25) c = dr[0];
      P(g, x, yy, c);
    }
  }
  for (let x = cx - w; x <= cx + w; x++) {
    const u = (x - cx) / w;
    const arch = Math.round((1 - u * u) * 6);
    for (let y = ly - lidH - arch + 6; y <= ly; y++) {
      let c = '#2a2438'; if (x < cx - w + 2) c = '#3a3350'; if (x > cx + w - 2) c = ir0;
      if (y <= ly - lidH - arch + 7) c = '#3a3350';
      P(g, x, y, c);
    }
  }
  for (let x = cx - w; x <= cx + w; x++) { P(g, x, ly, ir0); P(g, x, ly - 1, dr[3]); if ((x - cx) % 6 === 0) { const u = (x - cx) / w; const arch = Math.round((1 - u * u) * 6); for (let y = ly - lidH - arch + 7; y < ly; y++) P(g, x, y, RAMP.dirt[3]); } }
}

export function drawCacheSealed(): Grid {
  const g = makeGrid(64, 64);
  chestBody(g, 0);
  outline(g, RAMP.void);
  return g;
}
export function drawCacheOpening(frame: number): Grid {
  const g = makeGrid(64, 64);
  const lift = frame === 0 ? 4 : 9;
  chestBody(g, lift);
  const dr = RAMP.drift;
  for (let i = -2; i <= 2; i++) { const x = 32 + i * 5; P(g, x, 34 - lift - 1, dr[0]); if (frame) P(g, x, 34 - lift - 3, dr[1]); }
  outline(g, RAMP.void);
  if (frame) for (let i = 0; i < 6; i++) { const x = 32 - 8 + (i * 3); const y = 30 - (i % 3) * 3; P(g, x, y, i % 2 ? dr[0] : dr[2]); }
  return g;
}
export function drawCacheBurst(frame: number): Grid {
  const g = makeGrid(64, 64);
  chestBody(g, 11);
  outline(g, RAMP.void);
  const dr = RAMP.drift, gd = RAMP.gold;
  const cx = 32, topGlow = 33 - 11;
  const h = frame ? 30 : 22, halfMax = frame ? 9 : 6;
  for (let k = 0; k < h; k++) {
    const t = k / h;
    const hw = Math.round((1 - t) * halfMax) + 1;
    const yy = topGlow - k;
    for (let x = cx - hw; x <= cx + hw; x++) {
      const edge = Math.abs(x - cx) >= hw - 1;
      if (edge && (x + yy) % 2 !== 0) continue;
      let c = dr[2]; if (Math.abs(x - cx) < hw - 2) c = dr[1]; if (Math.abs(x - cx) <= 1) c = (k < h * 0.6 ? dr[0] : RAMP.bone[0]);
      if (t > 0.8 && Math.abs(x - cx) <= 1) c = gd[0];
      P(g, x, yy, c);
    }
  }
  const mr = mulberry(frame + 5);
  const N = frame ? 22 : 14;
  for (let i = 0; i < N; i++) {
    const a = (-90 + (mr() - 0.5) * 150) * Math.PI / 180;
    const r = 6 + mr() * (frame ? 26 : 16);
    const x = Math.round(cx + Math.cos(a) * r), y = Math.round(topGlow + Math.sin(a) * r);
    P(g, x, y, mr() < 0.3 ? gd[0] : mr() < 0.6 ? dr[0] : dr[1]);
    if (mr() < 0.3) P(g, x, y + 1, dr[3]);
  }
  return g;
}

// ─── exchange.js — the Exchange counter (Vault interior fixture) ─────────────
// 48×48, bottom-center anchor (24,47), 2-frame tip-totter.

export function drawExchangeCounter(frame: number): Grid {
  const g = makeGrid(48, 48);
  const gd = RAMP.gold, dr = RAMP.drift, st = RAMP.stone, dt = RAMP.dirt;
  const cx = 24, baseY = 45;

  for (let y = baseY - 6; y <= baseY; y++) for (let x = cx - 16; x <= cx + 16; x++) {
    let c = dt[1]; if (x < cx - 14) c = dt[0]; if (x > cx + 14) c = dt[3]; if (y > baseY - 2) c = dt[3];
    if ((x + y) % 7 === 0) c = dt[2];
    P(g, x, y, c);
  }
  fillRect(g, cx - 14, baseY - 9, 9, 3, RAMP.bone[1]); P(g, cx - 10, baseY - 9, dt[3]);
  for (let i = 0; i < 3; i++) { P(g, cx - 13 + i, baseY - 8, st[3]); P(g, cx - 8 + i, baseY - 8, st[3]); }

  for (let y = 12; y <= baseY - 6; y++) { P(g, cx, y, gd[1]); P(g, cx - 1, y, gd[2]); P(g, cx + 1, y, gd[3]); }
  fillRect(g, cx - 2, baseY - 7, 5, 2, gd[3]);
  P(g, cx, 10, gd[0]); P(g, cx, 11, gd[1]);

  const tip = frame === 0 ? 1 : -1;
  const beamY = 14;
  const armLen = 13;
  const pts: number[] = [];
  for (let i = -armLen; i <= armLen; i++) {
    const y = beamY + Math.round((i / armLen) * 2 * tip);
    P(g, cx + i, y, i < 0 ? gd[1] : gd[2]);
    P(g, cx + i, y - 1, gd[0]);
    pts.push(y);
  }
  P(g, cx, beamY - 1, gd[0]); P(g, cx, beamY, gd[1]);

  const lpx = cx - armLen, lpy = pts[0] + 1;
  hangPan(g, lpx, lpy + (tip > 0 ? 4 : 2), 'gold');
  const rpx = cx + armLen, rpy = pts[pts.length - 1] + 1;
  hangPan(g, rpx, rpy + (tip < 0 ? 4 : 2), 'drifts');

  outline(g, RAMP.void);

  const gy = (tip < 0 ? rpy + 4 : rpy + 2) + 4;
  for (let i = -1; i <= 1; i++) P(g, rpx + i, gy - 5, dr[0]);
  if (frame) { P(g, rpx, gy - 7, dr[1]); P(g, rpx - 2, gy - 5, dr[2]); P(g, rpx + 2, gy - 5, dr[2]); }
  return g;
}

function hangPan(g: Grid, px: number, py: number, kind: 'gold' | 'drifts') {
  const gd = RAMP.gold;
  for (let k = 0; k < 4; k++) { P(g, px - 2, py - 4 + k, gd[3]); P(g, px + 2, py - 4 + k, gd[3]); }
  for (let x = px - 4; x <= px + 4; x++) { const d = Math.abs(x - px); const yy = py + Math.round(d * 0.4); P(g, x, yy, gd[2]); P(g, x, yy + 1, gd[3]); }
  if (kind === 'gold') {
    P(g, px - 1, py - 1, gd[0]); P(g, px + 1, py - 1, gd[1]); P(g, px, py - 2, gd[0]); P(g, px, py - 1, gd[1]);
  } else {
    P(g, px, py - 3, RAMP.drift[0]); P(g, px, py - 2, RAMP.drift[1]); P(g, px - 1, py - 1, RAMP.drift[2]); P(g, px + 1, py - 1, RAMP.drift[2]); P(g, px, py - 1, RAMP.drift[1]);
  }
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function gridToCanvas(g: Grid): OffscreenCanvas {
  const cv = new OffscreenCanvas(g.w, g.h);
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(g.w, g.h);
  const data = img.data;
  for (let i = 0; i < g.d.length; i++) {
    const v = g.d[i];
    if (!v) continue;
    const [r, gr, b] = hexToRgb(v.c);
    const alpha = Math.round((v.a ?? 1) * 255);
    data[i * 4] = r;
    data[i * 4 + 1] = gr;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = alpha;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ─── SpriteCache ──────────────────────────────────────────────────────────────

// Tile sprite dimensions (in source pixels before zoom):
//   Tile:      64 × 36 (32 face + 3 lip + 1 void top)
//   CorruptOv: 64 × 32 (face-only alpha overlay)
//   Tree:      48 × 56 (bottom-center anchor at y=55)
//   Rock:      40 × 30 (bottom-center anchor at y=29)
//   Fish:      40 × 20 (centered)
//   Character: 32 × 40 (feet at y=37)

export type TileType = 'grass' | 'dirt' | 'stone' | 'water' | 'corrupt';

const FACINGS: IsoFacing[]             = ['s', 'se', 'e', 'ne', 'n'];
const ANIM_FRAMES: [AnimName, number][] = [['idle', 2], ['walk', 6], ['swing', 4]];

// ─── arena.js — ARENA SET ("The Pit": duels float in the Drift's void) ─────────
// Faithful port of _gen/arena.js. Torch-lit ring + watchers + victory plate;
// floors are 64×36 iso diamonds, ring segments tile at +32x,±16y (no side
// outline — seam-continuous like the W2 walls).

export function drawArenaFloor(variant: 'a' | 'b' | 'c' | 'blood', seedN: number): Grid {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const dt = RAMP.dirt, em = RAMP.ember, bl = RAMP.blood;
  const face = dt[1], hi = dt[0], sh = dt[2], dp = dt[3];

  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);
  // 3px south lip
  for (let x = 0; x < 64; x++) { const my = contourMaxY(rows, x); if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh); }
  // 1px void north edge
  for (let x = 0; x < 64; x++) for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }

  // packed-sand grain + warm ember-red flecks
  for (let y = 1; y < 31; y++) for (let x = rows[y].x0 + 1; x <= rows[y].x1 - 1; x++) {
    const h = hash2(x, y, seedN);
    if (h < 0.05) P(g, x, y, sh);                       // trodden grain
    else if (h < 0.075) P(g, x, y, hi);                 // lit grit
    else if (h < 0.088) P(g, x, y, em[2]);              // faint ember-red warmth
    if (hash2(x, y, seedN + 5) < 0.012) P(g, x, y, dp); // raked groove
  }
  // raked concentric arcs (subtle, arena-swept)
  for (let y = 4; y < 30; y += 6) for (let x = rows[y].x0 + 2; x <= rows[y].x1 - 2; x++) if ((x + 2 * y) % 9 === 0) P(g, x, y, sh);

  if (variant === 'blood') {
    // dark dried spatter, dithered
    const rng = mulberry(seedN + 40);
    for (let s = 0; s < 5; s++) {
      const cxp = 14 + Math.floor(rng() * 36), cyp = 8 + Math.floor(rng() * 18), r = 2 + Math.floor(rng() * 4);
      for (let yy = -r; yy <= r; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
        const x = cxp + xx, y = cyp + yy;
        if (!inDiamond(rows, x, y) || y < 1) continue;
        const d = xx * xx + yy * yy;
        if (d <= r * r && (x + y) % 2 === 0) P(g, x, y, bl[3]);
        else if (d <= (r + 1) * (r + 1) && hash2(x, y, 41) < 0.4) P(g, x, y, bl[3]);
      }
      // a drip tail
      for (let k = 0; k < 4; k++) if (hash2(s, k, 42) < 0.6) P(g, cxp + (k % 2), cyp + r + k, bl[3]);
    }
  }
  return g;
}

/* ring segments: modular circular palisade (skewed-segment style, +32x/±16y) */
function ringBottomY(side: 'ne' | 'nw', x: number): number {
  return side === 'ne' ? 55 + Math.round(x * 16 / 31) : 55 + Math.round((31 - x) * 16 / 31);
}
function ringP(g: Grid, side: 'ne' | 'nw', x: number, hAbove: number, c: string) {
  const by = ringBottomY(side, x); P(g, x, by - hAbove, c);
}

export function drawArenaRing(side: 'ne' | 'nw', variant: 'a' | 'b'): Grid {
  const g = makeGrid(32, 72);
  const st = RAMP.stone, bn = RAMP.bone, em = RAMP.ember;
  const FACE = 44;
  // low blackstone kerb wall (continuous, periodic mod 32 so seams match)
  for (let x = 0; x < 32; x++) {
    for (let h = 0; h <= 12; h++) {
      let c = st[2];
      if (h >= 11) c = st[0];                         // top lit lip
      else if (h <= 1) c = st[3];                     // base shadow
      if ((x % 8) < 1) c = st[3];                      // block joints (periodic)
      if (hash2(x, h, 211) < 0.05) c = st[3];
      ringP(g, side, x, h, c);
    }
  }
  // posts every 16px: bone-capped blackstone
  const postXs = variant === 'b' ? [4, 20] : [0, 16];
  postXs.forEach(px => {
    for (let h = 12; h <= FACE; h++) {
      const w = 2;
      for (let o = -w; o <= w; o++) {
        const x = px + o; if (x < 0 || x > 31) continue;
        let c = st[1]; if (o <= -w + 0) c = st[0]; if (o >= w) c = st[3];
        if (hash2(x, h, 212) < 0.06) c = st[2];
        ringP(g, side, x, h, c);
      }
    }
    // bone skull/cap finial
    for (let o = -2; o <= 2; o++) for (let k = 0; k <= 3; k++) { const x = px + o; if (x < 0 || x > 31) continue; let c = bn[1]; if (o <= -1) c = bn[0]; if (o >= 1) c = bn[2]; if (k === 0) c = bn[0]; ringP(g, side, x, FACE + 1 + k, c); }
    ringP(g, side, px - 1, FACE + 2, RAMP.void); ringP(g, side, px + 1, FACE + 2, RAMP.void);   // skull eye sockets
    if (variant === 'b') { ringP(g, side, px - 1, FACE + 2, em[1]); ringP(g, side, px + 1, FACE + 2, em[1]); }  // lit watcher-skulls
  });
  // iron chain swag strung between the posts (catenary dip)
  const x0 = postXs[0], x1 = postXs[0] + 16;
  for (let x = x0; x <= Math.min(31, x1); x++) {
    const t = (x - x0) / 16;
    const dip = Math.round(Math.sin(t * Math.PI) * 5);
    const h = FACE - 4 - dip;
    ringP(g, side, x, h, (x % 2 === 0) ? st[3] : st[0]);          // chain links alternate
  }
  return g;
}

/* gate segment: fighters' entrance with a raised iron portcullis (32×72) */
export function drawArenaGate(side: 'ne' | 'nw'): Grid {
  const g = makeGrid(32, 72);
  const st = RAMP.stone, bn = RAMP.bone, em = RAMP.ember;
  const FACE = 48;
  // two heavy jambs framing a dark archway
  [3, 28].forEach(px => {
    for (let h = 0; h <= FACE; h++) for (let o = -2; o <= 2; o++) { const x = px + o; if (x < 0 || x > 31) continue; let c = st[1]; if (o <= -2) c = st[0]; if (o >= 2) c = st[3]; if ((h % 6) === 0) c = st[3]; ringP(g, side, x, h, c); }
  });
  // dark archway void between jambs
  for (let x = 6; x <= 25; x++) for (let h = 0; h <= FACE - 6; h++) { const arch = (h > FACE - 14) ? Math.round(Math.sqrt(Math.max(0, 49 - (x - 15.5) * (x - 15.5)))) : 99; if (h < FACE - 6 - 0 && (FACE - 6 - h) < arch + 8) ringP(g, side, x, h, RAMP.void); }
  // lintel + bone trophy over the arch
  for (let x = 3; x <= 28; x++) ringP(g, side, x, FACE, st[2]);
  for (let x = 3; x <= 28; x++) ringP(g, side, x, FACE + 1, st[0]);
  for (let o = -2; o <= 2; o++) { ringP(g, side, 15 + o, FACE + 3, bn[1]); } ringP(g, side, 15, FACE + 4, bn[0]);
  ringP(g, side, 14, FACE + 3, RAMP.void); ringP(g, side, 16, FACE + 3, RAMP.void);
  // RAISED iron portcullis: bars pulled up into the lintel, fangs hanging down
  for (let x = 7; x <= 24; x += 3) for (let h = FACE - 6; h >= FACE - 11; h--) ringP(g, side, x, h, st[3]);   // retracted bars
  for (let x = 7; x <= 24; x += 3) { ringP(g, side, x, FACE - 12, st[2]); ringP(g, side, x, FACE - 13, st[3]); }  // fang tips
  for (let x = 6; x <= 25; x++) ringP(g, side, x, FACE - 6, st[3]);                                            // portcullis rail
  // ember cresset on the left jamb
  ringP(g, side, 2, 30, em[2]); ringP(g, side, 2, 31, em[1]); ringP(g, side, 2, 32, em[0]); ringP(g, side, 1, 31, em[2]);
  return g;
}

export function drawArenaTorch(frame: number): Grid {
  const g = makeGrid(32, 64);
  const st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold;
  const cx = 16, baseY = 60;
  // tripod legs
  ([[-6, 0], [6, 0], [0, 2]] as const).forEach(([dx]) => { for (let k = 0; k < 16; k++) { const x = cx + Math.round(dx * (1 - k / 16)), y = baseY - k; P(g, x, y, st[2]); P(g, x, y + 1, st[3]); } });
  for (let x = cx - 7; x <= cx + 7; x++) if ((x + 1) % 2 === 0) P(g, x, baseY + 1, RAMP.void);   // ground contact
  // brazier bowl
  for (let j = 0; j < 7; j++) for (let i = -7 + j; i <= 7 - j; i++) { let c = st[1]; if (i < -4) c = st[0]; if (i > 4) c = st[3]; if (j === 0) c = st[3]; P(g, cx + i, baseY - 16 + j, c); }
  for (let i = -7; i <= 7; i++) P(g, cx + i, baseY - 17, st[3]);       // rim
  for (let i = -5; i <= 5; i++) P(g, cx + i, baseY - 16, RAMP.void);   // coals shadow
  // coals
  for (let i = -4; i <= 4; i++) if ((i + frame) % 2 === 0) P(g, cx + i, baseY - 16, em[2]);
  // FLAME (3-frame), strong + tall, the only light in the void
  const sway = [0, 1, -1][frame], tall = [0, 2, 1][frame];
  const fb = baseY - 17;
  for (let yy = 0; yy <= 22 + tall; yy++) {
    const t = yy / (22 + tall);
    const hw = Math.round((1 - t) * 6 * (1 - t * 0.25)) + (yy < 4 ? 1 : 0);
    const sx = cx + Math.round(Math.sin(yy * 0.45 + frame) * 1.3) + Math.round(sway * t * 2);
    for (let xx = -hw; xx <= hw; xx++) {
      let c = em[1];
      if (Math.abs(xx) >= hw - 1) c = em[2];
      if (yy < 7 && Math.abs(xx) < 2) c = em[0];
      if (t > 0.78 && Math.abs(xx) <= 1) c = gd[0];        // white-hot tip
      P(g, sx + xx, fb - yy, c);
    }
  }
  // inner gold core
  for (let yy = 2; yy <= 12 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (13 + tall)) * 3)); for (let xx = -hw; xx <= hw; xx++) P(g, cx + xx, fb - yy - 1, gd[0]); }
  // escaping spark
  if (frame !== 1) P(g, cx + sway * 2, fb - 26 - tall, em[0]);
  outline(g, RAMP.void);
  // strong glow pixels (outline-free, added after) — stepped ember halo into the void
  for (let yy = -20; yy <= 6; yy++) for (let xx = -14; xx <= 14; xx++) {
    const d = Math.abs(xx) + Math.abs(yy * 1.2);
    if (d > 8 && d < 13 && (xx + yy + frame) % 2 === 0) { const gy = fb - 8 + yy; if (gy > 4 && !G(g, cx + xx, gy)) P(g, cx + xx, gy, em[3]); }
  }
  return g;
}

export type ArenaWatcherVariant = 'bone' | 'blood' | 'void';
export function drawArenaWatcher(variant: ArenaWatcherVariant, anim: 'idle' | 'cheer', f: number): Grid {
  const g = makeGrid(32, 40);
  const ramp = variant === 'blood' ? RAMP.blood : variant === 'void' ? RAMP.stone : RAMP.bone;
  const dark = variant === 'void';
  const cx = 16, em = RAMP.ember;
  let bob = 0, armUp = 0;
  if (anim === 'idle') bob = f === 1 ? 1 : 0;            // sway
  if (anim === 'cheer') armUp = f === 1 ? 1 : 0;         // fist up on f1
  const top = 11 + bob, shoulderY = 19 + bob;

  // hooded cloak (rounded, faceless)
  for (let y = shoulderY; y <= 37; y++) {
    const t = (y - shoulderY) / (37 - shoulderY);
    const hw = Math.round(4 + t * 3);
    for (let x = cx - hw; x <= cx + hw; x++) {
      let c = dark ? RAMP.void : ramp[1];
      if (x <= cx - hw + 1) c = dark ? RAMP.stone[3] : ramp[0];
      if (x >= cx + hw - 1) c = dark ? '#0a0810' : ramp[2];
      if (!dark && hash2(x, y, 221) < 0.06) c = ramp[2];
      P(g, x, y, c);
    }
  }
  // hood dome
  for (let y = top; y <= shoulderY; y++) {
    const hy = (y - top) / (shoulderY - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.3) * Math.PI * 0.5) * 3.2);
    for (let x = cx - hw; x <= cx + hw; x++) { let c = dark ? RAMP.stone[3] : ramp[1]; if (x === cx - hw) c = dark ? RAMP.stone[2] : ramp[0]; if (x >= cx + hw - 1) c = '#0a0810'; if (y === top) c = dark ? RAMP.stone[2] : ramp[0]; P(g, x, y, c); }
  }
  P(g, cx, top - 1, dark ? RAMP.stone[2] : ramp[1]);
  // faceless void + ember eyes
  for (let y = top + 3; y <= top + 7; y++) for (let x = cx - 2; x <= cx + 2; x++) P(g, x, y, RAMP.void);
  const eyOn = !(anim === 'idle' && f === 1);
  P(g, cx - 1, top + 5, eyOn ? em[0] : em[2]); P(g, cx + 1, top + 5, eyOn ? em[0] : em[2]);
  // arms: resting, or fist raised on cheer f1
  if (anim === 'cheer' && armUp) {
    for (let k = 0; k < 8; k++) P(g, cx + 5, shoulderY + 2 - k, dark ? RAMP.stone[2] : ramp[2]);   // raised arm
    fillRect(g, cx + 4, shoulderY - 7, 3, 3, dark ? RAMP.stone[1] : ramp[1]);                       // fist
  } else {
    P(g, cx - 5, shoulderY + 3, dark ? RAMP.stone[2] : ramp[2]); P(g, cx + 5, shoulderY + 3, dark ? RAMP.stone[2] : ramp[2]);
  }
  // hem
  for (let x = 0; x < 32; x++) { const v = G(g, x, 37); if (v) P(g, x, 37, dark ? '#0a0810' : ramp[3]); }
  outline(g, RAMP.void);
  return g;
}

export function drawVictoryPlate(frame: number): Grid {
  const g = makeGrid(96, 48);
  const gd = RAMP.gold, bn = RAMP.bone;
  const cx = 48, cy = 24;
  // floating gold plaque on void (no bg fill = transparent void)
  // laurel of finger-bones (two arcs)
  for (let s = -1; s <= 1; s += 2) {
    for (let a = 0; a < 11; a++) {
      const ang = Math.PI * (0.15 + a * 0.07);
      const x = Math.round(cx + s * Math.cos(ang) * 38), y = Math.round(cy + Math.sin(ang) * 20 - 0);
      // each bone: 2px with knuckle ends
      P(g, x, y, bn[1]); P(g, x, y + 1, bn[2]); P(g, x + s, y, bn[0]);
      if (a % 2 === 0) { P(g, x, y - 1, bn[0]); }
    }
  }
  // crossed blades (gold), X through the center
  for (let k = -16; k <= 16; k++) {
    // blade 1 (down-right)
    P(g, cx + k, cy + Math.round(k * 0.55), gd[1]); P(g, cx + k, cy + Math.round(k * 0.55) - 1, gd[0]);
    // blade 2 (down-left)
    P(g, cx - k, cy + Math.round(k * 0.55), gd[2]); P(g, cx - k, cy + Math.round(k * 0.55) - 1, gd[1]);
  }
  // hilts + pommels at the lower ends
  ([[-16, 1], [16, -1]] as const).forEach(([k]) => { const x = cx + k, y = cy + Math.round(Math.abs(k) * 0.55); fillRect(g, x - 1, y, 3, 2, gd[3]); P(g, x, y + 2, gd[2]); });
  // central boss gem (drift accent, the corruption watches)
  fillRect(g, cx - 2, cy - 2, 4, 4, gd[0]); P(g, cx, cy, RAMP.drift[1]);
  // shimmer sweep (frame-dependent diagonal highlight)
  const sweepX = frame ? cx + 14 : cx - 14;
  for (let yy = -10; yy <= 10; yy++) { const x = sweepX + Math.round(yy * 0.4); if (G(g, x, cy + yy)) P(g, x, cy + yy, RAMP.bone[0]); }
  outline(g, RAMP.void);
  return g;
}

export function drawBloodFx(variant: number): Grid {
  const g = makeGrid(48, 24);
  const bl = RAMP.blood;
  const rng = mulberry(300 + variant);
  const cx = 24, cy = 13;
  const blobs = variant === 0 ? 1 : variant === 1 ? 2 : 3;
  for (let b = 0; b < blobs; b++) {
    const bxp = cx + Math.round((rng() - 0.5) * 22), byp = cy + Math.round((rng() - 0.5) * 10), r = 3 + Math.floor(rng() * 4);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
      const x = bxp + xx, y = byp + Math.round(yy * 0.6);
      if (x < 0 || x > 47 || y < 0 || y > 23) continue;
      const d = (xx * xx) / ((r + 1) * (r + 1)) + (yy * yy) / (r * r);
      if (d <= 0.75) P(g, x, y, (x + y) % 3 === 0 ? bl[3] : bl[2]);
      else if (d <= 1.1 && (x + y) % 2 === 0) P(g, x, y, bl[3]);     // dithered edge
    }
    // splatter droplets + a drip
    for (let s = 0; s < 5; s++) { const dx = bxp + Math.round((rng() - 0.5) * 16), dy = byp + Math.round((rng() - 0.5) * 9); if (dx >= 0 && dx < 48 && dy >= 0 && dy < 24) P(g, dx, dy, bl[3]); }
    for (let k = 0; k < 3; k++) if (rng() < 0.6) P(g, bxp + (k % 2), Math.min(23, byp + r + k), bl[3]);
  }
  // NOTE: ground decal — no void outline (sits flush on sand)
  return g;
}

export class SpriteCache {
  ready = false;

  // tile key: `${type}-v${variant}-${edge ? 'e' : 'n'}`; transitions use
  // `${type}>${other}-${edge ? 'e' : 'n'}`
  private tiles    = new Map<string, OffscreenCanvas>();
  private waterAnim: OffscreenCanvas[]  = [];
  private waterShore: OffscreenCanvas[] = [];
  private corruptOv: OffscreenCanvas[]  = [];
  private doodads  = new Map<string, OffscreenCanvas>();
  /** frontier ash/corruption ground accents, keyed by variant (under entities) */
  private ashGround = new Map<number, OffscreenCanvas>();
  /** world-event FX (rift states, rift motes, blood moon), lazy */
  private events = new Map<string, OffscreenCanvas>();
  private glow!: OffscreenCanvas;
  private tombstone!: OffscreenCanvas;
  /** [rich (gold glint), sunken] Drowned Field grave slabs */
  private lostTombs: OffscreenCanvas[] = [];
  private wagon: OffscreenCanvas[] = [];
  // interiors: floors keyed `${style}-${variant}`, fixtures `${kind}-${accent}` (lazy)
  private floors = new Map<string, OffscreenCanvas>();
  private fixtures = new Map<string, OffscreenCanvas>();
  private walls = new Map<string, OffscreenCanvas>();
  private buildings = new Map<string, OffscreenCanvas>(); // key (+ `-${frame}` for shrine)
  private pets = new Map<string, OffscreenCanvas>();   // `${kind}-${frame}`
  private mounts = new Map<string, OffscreenCanvas>(); // steed `${facing}-${anim}-${frame}`
  private critters = new Map<string, OffscreenCanvas>(); // `${kind}-${facing}-${anim}-${frame}`
  private trader = new Map<string, OffscreenCanvas>();    // `t-${facing}-${anim}-${f}` / `m-${facing}-${f}`
  private salvageFx = new Map<string, OffscreenCanvas>(); // glint-${f} / puff-${f} (additive)
  private claimProps = new Map<string, OffscreenCanvas>(); // stash / workbench / ward-${f} / rune-${f}
  private micropoi = new Map<string, OffscreenCanvas>(); // `${key}-${frame}`
  private biomeTiles = new Map<string, OffscreenCanvas>(); // `${key}`
  private roads = new Map<string, OffscreenCanvas>();  // `${mask}` 0-15 (+ `broken`), lazy
  private wayside = new Map<string, OffscreenCanvas>();// `${key}-${frame}`
  private ruins = new Map<string, OffscreenCanvas>();  // `${key}-${frame}`
  private props = new Map<string, OffscreenCanvas>();  // `${kind}-${frame}`
  // the Threshold tutorial set, all lazy (only the first login ever pays for it)
  private thresholdMap = new Map<string, OffscreenCanvas>();
  // the Pit's arena set, lazy (only a live duel ever pays for it)
  private arenaMap = new Map<string, OffscreenCanvas>();
  private prestigeAuraMap = new Map<string, OffscreenCanvas>(); // `${key}-${frame}`, lazy — only holders pay
  private treeNorm!: OffscreenCanvas;
  private treeDep!:  OffscreenCanvas;
  private rockNorm!: OffscreenCanvas;
  private rockDep!:  OffscreenCanvas;
  private fishAnim: OffscreenCanvas[]   = [];
  // char key: `${facing}-${anim}-${frame}` (or +'-m' for mirrored);
  // equipped variants append the gear signature and are generated lazily
  private charMap  = new Map<string, OffscreenCanvas>();
  // beast key: `${kind}-${facing}-${anim}-${frame}` (+'-m', +'-h') — all lazy
  private beastMap = new Map<string, OffscreenCanvas>();

  init() {
    // land tiles: 3 seed variants × with/without north edge
    for (const t of ['grass', 'dirt', 'stone'] as const) {
      for (let v = 0; v < 3; v++) {
        this.tiles.set(`${t}-v${v}-e`, gridToCanvas(makeBaseTile(t, v, true)));
        this.tiles.set(`${t}-v${v}-n`, gridToCanvas(makeBaseTile(t, v, false)));
      }
    }
    // dithered south-edge transitions between grass and dirt
    for (const [a, b] of [['grass', 'dirt'], ['dirt', 'grass']] as const) {
      this.tiles.set(`${a}>${b}-e`, gridToCanvas(makeTransitionTile(a, b, 0, true)));
      this.tiles.set(`${a}>${b}-n`, gridToCanvas(makeTransitionTile(a, b, 0, false)));
    }
    // corrupt tile = stone base (overlay drawn on top)
    this.tiles.set('corrupt-e', gridToCanvas(makeBaseTile('stone', 1, true)));
    this.tiles.set('corrupt-n', gridToCanvas(makeBaseTile('stone', 1, false)));
    // water animation frames — open water + foamy shoreline
    this.waterAnim  = genWaterFrames(0).map(gridToCanvas);
    this.waterShore = genWaterFrames(0, true).map(gridToCanvas);
    // corruption overlay frames (alpha)
    this.corruptOv = genCorruptFrames().map(gridToCanvas);
    // ground doodads, 2 variants each
    for (const k of ['tuft', 'pebbles', 'bones', 'masonry', 'crystal'] as DoodadKind[]) {
      this.doodads.set(`${k}-0`, gridToCanvas(makeDoodad(k, 1)));
      this.doodads.set(`${k}-1`, gridToCanvas(makeDoodad(k, 2)));
    }
    for (const k of ['reed_clump', 'dead_tree', 'bone_spike', 'mire_bubble'] as WildDoodadKey[]) {
      this.doodads.set(`${k}-0`, gridToCanvas(makeWildDoodad(k, 0)));
      this.doodads.set(`${k}-1`, gridToCanvas(makeWildDoodad(k, 1)));
    }
    // frontier pack: standing doodads (deadly outer ring) + ash ground accents
    for (const k of BIOME_DOODAD_KEYS) {
      this.doodads.set(`${k}-0`, gridToCanvas(makeBiomeDoodad(k, 0)));
      this.doodads.set(`${k}-1`, gridToCanvas(makeBiomeDoodad(k, 1)));
    }
    // ambient wildlife (DS critters): every kind × facing × anim frame
    for (const kind of Object.keys(CRITTER_SPECS) as CritterKind[]) {
      const spec = CRITTER_SPECS[kind];
      for (const fc of spec.facings) for (const [anim, n] of spec.anims) {
        for (let f = 0; f < n; f++) this.critters.set(`${kind}-${fc}-${anim}-${f}`, gridToCanvas(makeCritter(kind, fc, anim, f)));
      }
    }
    // the Roaming Trader (wanderer-rig actor) + the pack mule companion
    for (const fc of ['s', 'se', 'e', 'ne', 'n'] as IsoFacing[])
      for (const [anim, n] of [['idle', 2], ['walk', 6]] as [AnimName, number][])
        for (let f = 0; f < n; f++) this.trader.set(`t-${fc}-${anim}-${f}`, gridToCanvas(drawTrader(fc, anim, f)));
    for (const fc of ['s', 'se', 'e', 'n'] as const)
      for (let f = 0; f < 4; f++) this.trader.set(`m-${fc}-${f}`, gridToCanvas(drawPackMule(fc, f)));
    // salvage FX (additive) + claim upgrade props
    for (let f = 0; f < 2; f++) this.salvageFx.set(`glint-${f}`, gridToCanvas(drawSalvageGlint(f)));
    for (let f = 0; f < 3; f++) this.salvageFx.set(`puff-${f}`, gridToCanvas(drawDigPuff(f)));
    this.claimProps.set('stash', gridToCanvas(drawClaimStash()));
    this.claimProps.set('workbench', gridToCanvas(drawClaimWorkbench()));
    for (let f = 0; f < 2; f++) { this.claimProps.set(`ward-${f}`, gridToCanvas(drawClaimWard(f))); this.claimProps.set(`rune-${f}`, gridToCanvas(drawRuneAnvil(f))); }
    // micro-POIs (DS landmarks)
    for (const key of MICROPOI_KEYS) {
      const spec = MICROPOI_SPECS[key];
      for (let f = 0; f < spec.frames; f++) this.micropoi.set(`${key}-${f}`, gridToCanvas(makeMicroPoi(key, f)));
    }
    // biome tile accents (DS) — region-flavoured ground variants
    for (const key of BIOME_TILE_KEYS) this.biomeTiles.set(key, gridToCanvas(makeBiomeTile(key)));
    for (const k of ['drift_crystal', 'ash_dune', 'scorched_stump'] as FrontierDoodadKey[]) {
      this.doodads.set(`${k}-0`, gridToCanvas(makeFrontierDoodad(k, 0)));
      this.doodads.set(`${k}-1`, gridToCanvas(makeFrontierDoodad(k, 1)));
    }
    for (let v = 0; v < ASH_GROUND_VARIANTS; v++) {
      this.ashGround.set(v, gridToCanvas(drawAshGround(v)));
    }
    this.lostTombs = [gridToCanvas(drawLostTombstone(false)), gridToCanvas(drawLostTombstone(true))];
    // soft corruption glow (screen-space atmosphere, drawn additively)
    this.glow = makeGlowCanvas();
    this.tombstone = gridToCanvas(makeTombstone());
    this.wagon = [gridToCanvas(makeWagon(0)), gridToCanvas(makeWagon(1))];
    // the Waystation
    for (const k of [
      'dyeworks', 'vault', 'wheel', 'lantern',
      'furnisher', 'menagerie', 'pit', 'mine', 'stable', 'mirehut',
      'outpost', 'palisade_gate', 'watchtower',
    ] as BuildingSpriteKey[]) {
      this.buildings.set(k, gridToCanvas(makeBuildingSprite(k)));
    }
    for (let f = 0; f < SHRINE_FRAMES; f++) {
      this.buildings.set(`shrine-${f}`, gridToCanvas(makeBuildingSprite('shrine', f)));
    }
    // animated wild structures (den eyes blink, obelisk runes pulse)
    for (let f = 0; f < HUSKDEN_FRAMES; f++) {
      this.buildings.set(`huskden-${f}`, gridToCanvas(makeBuildingSprite('huskden', f)));
    }
    for (let f = 0; f < OBELISK_FRAMES; f++) {
      this.buildings.set(`obelisk-${f}`, gridToCanvas(makeBuildingSprite('obelisk', f)));
    }
    // the Waystation monolith (expansion art): 0 sealed + 1-3 active rune-pulse
    for (let f = 0; f < WAYSTATION_FRAMES; f++) {
      this.buildings.set(`waystation-${f}`, gridToCanvas(makeWaystation(f)));
    }
    // the frontier camps (expansion art): 2-frame idle each
    for (let f = 0; f < CAMP_FRAMES; f++) {
      this.buildings.set(`drownedruins-${f}`, gridToCanvas(makeDrownedRuins(f)));
      this.buildings.set(`mirelair-${f}`, gridToCanvas(makeDrownedRuins(f)));
      this.buildings.set(`barrowcrypt-${f}`, gridToCanvas(makeBarrowCrypt(f)));
      this.buildings.set(`ashwarcamp-${f}`, gridToCanvas(makeAshenWarcamp(f)));
    }
    for (const k of ['wisp', 'crow', 'emberling'] as PetSpriteKey[]) {
      this.pets.set(`${k}-0`, gridToCanvas(makePet(k, 0)));
      this.pets.set(`${k}-1`, gridToCanvas(makePet(k, 1)));
    }
    // the Stable steed (DS frontier_steed): 5 facings × idle 2f / walk 6f
    for (const fc of STEED_FACINGS) {
      for (const [anim, n] of [['idle', 2], ['walk', 6]] as const) {
        for (let f = 0; f < n; f++) {
          this.mounts.set(`${fc}-${anim}-${f}`, gridToCanvas(drawSteed('frontier_steed', fc, anim, f)));
        }
      }
    }
    // wayside decor + ruin landmarks (DS connective pack)
    for (const k of Object.keys(WAYSIDE_SPECS) as WaysideKey[]) {
      const spec = WAYSIDE_SPECS[k];
      for (let f = 0; f < spec.frames; f++) this.wayside.set(`${k}-${f}`, gridToCanvas(spec.fn(f)));
    }
    for (const k of Object.keys(RUIN_SPECS) as RuinKey[]) {
      const spec = RUIN_SPECS[k];
      for (let f = 0; f < spec.frames; f++) this.ruins.set(`${k}-${f}`, gridToCanvas(spec.fn(f)));
    }
    for (const k of ['campfire', 'banner', 'driftlamp', 'statue'] as PropSpriteKey[]) {
      this.props.set(`${k}-0`, gridToCanvas(makeProp(k, 0)));
      this.props.set(`${k}-1`, gridToCanvas(makeProp(k, 1)));
    }
    // nodes
    this.treeNorm = gridToCanvas(makeTree(false));
    this.treeDep  = gridToCanvas(makeTree(true));
    this.rockNorm = gridToCanvas(makeRock(false));
    this.rockDep  = gridToCanvas(makeRock(true));
    this.fishAnim = genFishFrames().map(gridToCanvas);
    // character frames (5 facings × 12 frames + mirrored)
    for (const facing of FACINGS) {
      for (const [anim, n] of ANIM_FRAMES) {
        for (let f = 0; f < n; f++) {
          const g = drawWanderer(facing, anim, f);
          const key = `${facing}-${anim}-${f}`;
          this.charMap.set(key,       gridToCanvas(g));
          this.charMap.set(key + '-m', gridToCanvas(mirrorX(g)));
        }
      }
    }
    this.ready = true;
  }

  // ── Tile drawing ────────────────────────────────────────────────────────────
  // sx, sy = screen center of tile diamond (waist at y=15 of tile)
  // Tile pixel (32, 15) aligns to (sx, sy).
  drawTile(
    ctx:    CanvasRenderingContext2D,
    type:   TileType,
    sx:     number,
    sy:     number,
    z:      number,
    frame = 0,
    opts?: {
      /** seed variant 0-2 (land tiles) */
      variant?: number;
      /** draw the hard 1px north outline (type boundary above) */
      edge?: boolean;
      /** south neighbour differs → dither into it (grass↔dirt only) */
      blendInto?: TileType | null;
      /** water adjacent to land → foam shoreline */
      shore?: boolean;
    },
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const edge = opts?.edge ?? true;
    const e = edge ? 'e' : 'n';

    let cv: OffscreenCanvas | undefined;
    if (type === 'water') {
      const set = opts?.shore ? this.waterShore : this.waterAnim;
      cv = set[frame % set.length];
    } else if (type === 'corrupt') {
      cv = this.tiles.get(`corrupt-${e}`);
    } else if (
      opts?.blendInto &&
      (type === 'grass' || type === 'dirt') &&
      (opts.blendInto === 'grass' || opts.blendInto === 'dirt') &&
      opts.blendInto !== type
    ) {
      cv = this.tiles.get(`${type}>${opts.blendInto}-${e}`);
    } else {
      cv = this.tiles.get(`${type}-v${(opts?.variant ?? 0) % 3}-${e}`);
    }
    if (cv) ctx.drawImage(cv, sx - 32 * z, sy - 15 * z, 64 * z, 36 * z);

    if (type === 'corrupt') {
      const ov = this.corruptOv[frame % this.corruptOv.length];
      ctx.drawImage(ov, sx - 32 * z, sy - 15 * z, 64 * z, 32 * z);
    }
  }

  /** small ground clutter, bottom-center anchored on the tile waist */
  drawDoodad(
    ctx:     CanvasRenderingContext2D,
    kind:    DoodadKind,
    variant: number,
    sx:      number,
    sy:      number,
    z:       number,
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.doodads.get(`${kind}-${variant % 2}`);
    if (!cv) return;
    // bottom-center anchored at native size (classic clutter is 16×12;
    // wilds doodads run from 10×8 bubbles to 28×40 dead trees)
    ctx.drawImage(cv, sx - (cv.width / 2) * z, sy - (cv.height - 1) * z, cv.width * z, cv.height * z);
  }

  /** frontier ash/corruption ground accent: a 64×36 tile-aligned overlay drawn
   *  UNDER entities (same anchor as a floor diamond, sx,sy = tile center) */
  drawGroundAccent(ctx: CanvasRenderingContext2D, variant: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.ashGround.get(variant % ASH_GROUND_VARIANTS);
    if (!cv) return;
    ctx.drawImage(cv, sx - 32 * z, sy - 15 * z, 64 * z, 36 * z);
  }

  /** the Drift Rift: 96×128 ground-tear, bottom-center anchored on its tile */
  drawRift(ctx: CanvasRenderingContext2D, state: RiftState, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % RIFT_STATE_FRAMES[state];
    const k = `rift-${state}-${f}`;
    let cv = this.events.get(k);
    if (!cv) { cv = gridToCanvas(drawDriftRift(state, f)); this.events.set(k, cv); }
    ctx.drawImage(cv, sx - 48 * z, sy - 127 * z, 96 * z, 128 * z);
  }

  /** a rift mote (16×16) centered at sx,sy */
  drawRiftMote(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `mote-${frame % 2}`;
    let cv = this.events.get(k);
    if (!cv) { cv = gridToCanvas(drawRiftMote(frame % 2)); this.events.set(k, cv); }
    ctx.drawImage(cv, sx - 8 * z, sy - 8 * z, 16 * z, 16 * z);
  }

  /** the Blood Moon (64×64) centered at sx,sy — drawn in screen space (sky) */
  drawBloodMoon(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, scale: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `moon-${frame % 2}`;
    let cv = this.events.get(k);
    if (!cv) { cv = gridToCanvas(drawBloodMoon(frame % 2)); this.events.set(k, cv); }
    ctx.drawImage(cv, sx - 32 * scale, sy - 32 * scale, 64 * scale, 64 * scale);
  }

  /** Blood-Moon aura ring (96×48, 3f), centered on a buffed mob's ground point */
  drawBloodAura(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `aura-${frame % 3}`;
    let cv = this.events.get(k);
    if (!cv) { cv = gridToCanvas(drawBloodAura(frame % 3)); this.events.set(k, cv); }
    ctx.drawImage(cv, sx - 48 * z, sy - 24 * z, 96 * z, 48 * z);
  }

  /** an open-air keeper NPC (32×40, idle 2f), bottom-center anchored on its tile */
  drawKeeperNpc(ctx: CanvasRenderingContext2D, kind: KeeperKind, facing: IsoFacing, mirrored: boolean, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `npc-${kind}-${facing}-${frame % 2}${mirrored ? '-m' : ''}`;
    let cv = this.events.get(k);
    if (!cv) { let g = drawKeeper(kind, facing, frame % 2); if (mirrored) g = mirrorX(g); cv = gridToCanvas(g); this.events.set(k, cv); }
    ctx.drawImage(cv, sx - 16 * z, sy - 39 * z, 32 * z, 40 * z);
  }

  /** Bogwretch spit glob (12×12), centered. travel frame `f` (splat=false) or a
   *  spreading puddle (splat=true, `f` selects the seed 1/2) */
  drawSpit(ctx: CanvasRenderingContext2D, f: number, splat: boolean, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = splat ? `spit-s${f % 2}` : `spit-t${f % 3}`;
    let cv = this.events.get(k);
    if (!cv) { cv = gridToCanvas(splat ? drawBogSpit(0, (f % 2) + 1) : drawBogSpit(f % 3, 0)); this.events.set(k, cv); }
    ctx.drawImage(cv, sx - 6 * z, sy - 6 * z, 12 * z, 12 * z);
  }

  /** Drift Wisp bolt (10×10), centered + rotated toward `angle` (radians) */
  drawBolt(ctx: CanvasRenderingContext2D, f: number, sx: number, sy: number, z: number, angle: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `bolt-${f % 3}`;
    let cv = this.events.get(k);
    if (!cv) { cv = gridToCanvas(drawDriftBolt(f % 3)); this.events.set(k, cv); }
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.drawImage(cv, -5 * z, -5 * z, 10 * z, 10 * z);
    ctx.restore();
  }

  /** Ash Brute slam shockwave (48×24, 4f), centered ground ring */
  drawShockwave(ctx: CanvasRenderingContext2D, f: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `shock-${f % 4}`;
    let cv = this.events.get(k);
    if (!cv) { cv = gridToCanvas(drawAshShockwave(f % 4)); this.events.set(k, cv); }
    ctx.drawImage(cv, sx - 24 * z, sy - 12 * z, 48 * z, 24 * z);
  }

  /** town building, bottom-center anchored on its south tile (frame: shrine
   *  flicker; mirror flips east-side houses so they lean toward town) */
  drawBuilding(
    ctx: CanvasRenderingContext2D,
    key: BuildingSpriteKey,
    sx: number,
    sy: number,
    z: number,
    frame = 0,
    mirror = false,
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const fkey =
      key === 'shrine'  ? `shrine-${frame % SHRINE_FRAMES}` :
      key === 'huskden' ? `huskden-${frame % HUSKDEN_FRAMES}` :
      key === 'obelisk' ? `obelisk-${frame % OBELISK_FRAMES}` :
      // the Waystation always reads as an ACTIVE gateway (frames 1-3 pulse)
      key === 'waystation' ? `waystation-${1 + (frame % 3)}` :
      // Phase C camps now render on ported expansion art (2-frame idle)
      key === 'drownedruins' || key === 'barrowcrypt' || key === 'ashwarcamp' || key === 'mirelair'
        ? `${key}-${frame % CAMP_FRAMES}` :
      key;
    const cv = this.buildings.get(fkey);
    if (!cv) return;
    // pit is flat ground decor; houses stand on the south edge of their tile
    const yOff = key === 'pit' ? cv.height / 2 + 16 : cv.height - 16;
    if (mirror) {
      ctx.save();
      ctx.translate(sx, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(cv, -(cv.width / 2) * z, sy - yOff * z, cv.width * z, cv.height * z);
      ctx.restore();
      return;
    }
    ctx.drawImage(
      cv,
      sx - (cv.width / 2) * z,
      sy - yOff * z,
      cv.width * z,
      cv.height * z,
    );
  }

  /** lazy fetch from the Threshold set (tutorial-only art, baked on first sight) */
  private thresholdCv(key: string, gen: () => Grid): OffscreenCanvas {
    let cv = this.thresholdMap.get(key);
    if (!cv) { cv = gridToCanvas(gen()); this.thresholdMap.set(key, cv); }
    return cv;
  }

  /** lazy fetch from the arena set (duel-only art, baked when the ring seals) */
  private arenaCv(key: string, gen: () => Grid): OffscreenCanvas {
    let cv = this.arenaMap.get(key);
    if (!cv) { cv = gridToCanvas(gen()); this.arenaMap.set(key, cv); }
    return cv;
  }

  /** blood-sand floor overlay, aligned over a base tile (anchor 32,16) */
  drawArenaFloor(ctx: CanvasRenderingContext2D, variant: 'a' | 'b' | 'c' | 'blood', seedN: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.arenaCv(`floor-${variant}-${seedN}`, () => drawArenaFloor(variant, seedN));
    ctx.drawImage(cv, sx - 32 * z, sy - 16 * z, 64 * z, 36 * z);
  }

  /** ring palisade segment — same skew/anchors as the W2 walls (ne 0,55 ·
   *  nw 0,71; sx is the segment's LEFT edge); tiles +32x,±16y, no side outline */
  drawArenaRing(ctx: CanvasRenderingContext2D, side: 'ne' | 'nw', variant: 'a' | 'b', sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.arenaCv(`ring-${side}-${variant}`, () => drawArenaRing(side, variant));
    ctx.drawImage(cv, sx, sy - (side === 'ne' ? 55 : 71) * z, 32 * z, 72 * z);
  }

  /** the fighters' gate segment (anchored like the ring) */
  drawArenaGate(ctx: CanvasRenderingContext2D, side: 'ne' | 'nw', sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.arenaCv(`gate-${side}`, () => drawArenaGate(side));
    ctx.drawImage(cv, sx, sy - (side === 'ne' ? 55 : 71) * z, 32 * z, 72 * z);
  }

  /** standing brazier-torch, 3f flame at 4fps (anchor 16,60) */
  drawArenaTorch(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % 3;
    const cv = this.arenaCv(`torch-${f}`, () => drawArenaTorch(f));
    ctx.drawImage(cv, sx - 16 * z, sy - 60 * z, 32 * z, 64 * z);
  }

  /** ring-side watcher (32×40, wanderer-rig anchor 16,39) */
  drawArenaWatcher(ctx: CanvasRenderingContext2D, variant: ArenaWatcherVariant, anim: 'idle' | 'cheer', frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % 2;
    const cv = this.arenaCv(`watcher-${variant}-${anim}-${f}`, () => drawArenaWatcher(variant, anim, f));
    ctx.drawImage(cv, sx - 16 * z, sy - 39 * z, 32 * z, 40 * z);
  }

  /** floating victory plaque, center-anchored (96×48, 2f shimmer) */
  drawVictoryPlate(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % 2;
    const cv = this.arenaCv(`victory-${f}`, () => drawVictoryPlate(f));
    ctx.drawImage(cv, sx - 48 * z, sy - 24 * z, 96 * z, 48 * z);
  }

  /** blood decal on the sand (drawn under entities, no outline) */
  drawBloodFx(ctx: CanvasRenderingContext2D, variant: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const v = ((variant % 3) + 3) % 3;
    const cv = this.arenaCv(`blood-${v}`, () => drawBloodFx(v));
    ctx.drawImage(cv, sx - 24 * z, sy - 12 * z, 48 * z, 24 * z);
  }

  /** the Threshold gate, bottom-center anchored like a town building */
  drawThresholdGate(ctx: CanvasRenderingContext2D, open: boolean, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % 3;
    const cv = this.thresholdCv(`gate-${open ? 'o' : 's'}-${f}`, () => drawThresholdGate(open, f));
    ctx.drawImage(cv, sx - 48 * z, sy - (128 - 16) * z, 96 * z, 128 * z);
  }

  /** the Gatewarden (32×40 rig, feet on the tile waist like the wanderer) */
  drawGatewarden(ctx: CanvasRenderingContext2D, facing: IsoFacing, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % 2;
    const cv = this.thresholdCv(`warden-${facing}-${f}`, () => drawGatewarden(facing, f));
    ctx.drawImage(cv, sx - 16 * z, sy - 37 * z, 32 * z, 40 * z);
  }

  /** objective beacon: rune-scribed tile + rising gold light (diamond row 47 sits on the waist) */
  drawBeacon(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % 3;
    const cv = this.thresholdCv(`beacon-${f}`, () => drawBeacon(f));
    ctx.drawImage(cv, sx - 32 * z, sy - 47 * z, 64 * z, 64 * z);
  }

  /** bobbing gold arrow pip, centered on sx,sy (bob is baked into the frames) */
  drawArrowPip(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % 2;
    const cv = this.thresholdCv(`arrow-${f}`, () => drawArrowPip(f));
    ctx.drawImage(cv, sx - 8 * z, sy - 8 * z, 16 * z, 16 * z);
  }

  /** the advancing Drift wall FX, bottom anchored on the tile's south corner */
  drawDriftWall(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % 3;
    const cv = this.thresholdCv(`wall-${f}`, () => drawDriftWall(f));
    ctx.drawImage(cv, sx - 32 * z, sy - (96 - 16) * z, 64 * z, 96 * z);
  }

  /** Threshold ground accent overlay, aligned exactly over a base tile */
  drawThresholdTile(ctx: CanvasRenderingContext2D, variant: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const v = variant % 2;
    const cv = this.thresholdCv(`ground-${v}`, () => drawThresholdTile(v));
    ctx.drawImage(cv, sx - 32 * z, sy - 15 * z, 64 * z, 36 * z);
  }

  /** prestige aura over a wanderer: sx,sy = the char anchor passed to drawChar.
   *  Aura anchor (32,56) aligns to the char cell anchor (16,39) → top-left =
   *  char top-left + (-16,-17) = (sx-32z, sy-54z). */
  drawPrestigeAura(ctx: CanvasRenderingContext2D, key: PrestigeAuraKey, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    const spec = PRESTIGE_AURAS[key];
    if (!spec) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % spec.frames;
    const ck = `${key}-${f}`;
    let cv = this.prestigeAuraMap.get(ck);
    if (!cv) { cv = gridToCanvas(spec.fn(f)); this.prestigeAuraMap.set(ck, cv); }
    ctx.drawImage(cv, sx - 32 * z, sy - 54 * z, 64 * z, 64 * z);
  }

  /** a guild's territory banner (48×96, bottom-center anchor) — the engine
   *  writes the tag over GB_PLATE. 3f sway; `fallen` = the tattered variant. */
  drawGuildBanner(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number, fallen = false) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = fallen ? 0 : frame % 3;
    const ck = fallen ? 'banner-fallen' : `banner-${f}`;
    let cv = this.prestigeAuraMap.get(ck); // shares the lazy economy map
    if (!cv) {
      cv = gridToCanvas(fallen ? drawGuildBannerFallen() : drawGuildBanner(f));
      this.prestigeAuraMap.set(ck, cv);
    }
    ctx.drawImage(cv, sx - 24 * z, sy - 95 * z, 48 * z, 96 * z);
  }

  /** sprite height of a building (for floating labels) */
  buildingHeight(key: BuildingSpriteKey): number {
    const framed = ['shrine', 'huskden', 'obelisk', 'waystation', 'drownedruins', 'barrowcrypt', 'ashwarcamp'];
    const cv = this.buildings.get(framed.includes(key) ? `${key}-0` : key);
    return cv ? cv.height : 0;
  }

  /** a Drowned Field grave: rich (gold glint) or sunken lore stone */
  drawLostTomb(ctx: CanvasRenderingContext2D, sunken: boolean, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.lostTombs[sunken ? 1 : 0];
    if (cv) ctx.drawImage(cv, sx - 8 * z, sy - 19 * z, 16 * z, 20 * z);
  }

  /** an ambient critter (DS wildlife). Flyers draw a ground shadow at (sx,sy)
   *  then the sprite offset up by fly.height; `mirror` flips for the 'w' facing. */
  drawCritter(
    ctx: CanvasRenderingContext2D, kind: CritterKind, facing: string, anim: string,
    frame: number, sx: number, sy: number, z: number, mirror = false,
  ) {
    if (!this.ready) return;
    const spec = CRITTER_SPECS[kind];
    const cv = this.critters.get(`${kind}-${facing}-${anim}-${frame}`);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    const [w, h] = spec.cell, [ax, ay] = spec.anchor;
    if (spec.fly) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#0a0810";
      ctx.beginPath();
      ctx.ellipse(sx, sy, spec.fly.shadow[0] * z, spec.fly.shadow[1] * z, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const lift = spec.fly ? spec.fly.height * z : 0;
    const dx = sx - ax * z, dy = sy - ay * z - lift;
    if (spec.additive) ctx.save(), (ctx.globalCompositeOperation = "lighter");
    if (mirror) {
      ctx.save();
      ctx.translate(sx, 0); ctx.scale(-1, 1);
      ctx.drawImage(cv, -(w - ax) * z, dy, w * z, h * z);
      ctx.restore();
    } else {
      ctx.drawImage(cv, dx, dy, w * z, h * z);
    }
    if (spec.additive) ctx.restore();
  }

  /** the Roaming Trader puppet (wanderer-rig, 32×40, bottom-center anchored).
   *  `mirror` flips for the w/sw/nw facings (only s/se/e/ne/n are cached). */
  drawTrader(ctx: CanvasRenderingContext2D, facing: string, anim: string, frame: number, sx: number, sy: number, z: number, mirror = false) {
    if (!this.ready) return;
    const cv = this.trader.get(`t-${facing}-${anim}-${frame}`);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    if (mirror) {
      ctx.save(); ctx.translate(sx, 0); ctx.scale(-1, 1);
      ctx.drawImage(cv, -(32 - 16) * z, sy - 39 * z, 32 * z, 40 * z);
      ctx.restore();
    } else {
      ctx.drawImage(cv, sx - 16 * z, sy - 39 * z, 32 * z, 40 * z);
    }
  }

  /** the trader's pack mule (28×28, 4 facings + mirror) */
  drawPackMule(ctx: CanvasRenderingContext2D, facing: string, frame: number, sx: number, sy: number, z: number, mirror = false) {
    if (!this.ready) return;
    const cv = this.trader.get(`m-${facing}-${frame}`);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    if (mirror) {
      ctx.save(); ctx.translate(sx, 0); ctx.scale(-1, 1);
      ctx.drawImage(cv, -(28 - 14) * z, sy - 27 * z, 28 * z, 28 * z);
      ctx.restore();
    } else {
      ctx.drawImage(cv, sx - 14 * z, sy - 27 * z, 28 * z, 28 * z);
    }
  }

  /** a drift-gold twinkle marking a searchable wreck (additive, anchor 8,12) */
  drawSalvageGlint(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    const cv = this.salvageFx.get(`glint-${frame % 2}`);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(cv, sx - 8 * z, sy - 12 * z, 16 * z, 16 * z);
    ctx.restore();
  }

  /** one-shot dust burst on a salvage dig (additive, anchor 12,18) */
  drawDigPuff(ctx: CanvasRenderingContext2D, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    const cv = this.salvageFx.get(`puff-${Math.min(2, frame)}`);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(cv, sx - 12 * z, sy - 18 * z, 24 * z, 20 * z);
    ctx.restore();
  }

  /** a claim upgrade prop (stash/workbench/ward/rune), bottom-center anchored */
  drawClaimProp(ctx: CanvasRenderingContext2D, key: 'stash' | 'workbench' | 'ward' | 'rune', frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    const dims: Record<string, [number, number, number, number]> = {
      stash: [32, 28, 16, 27], workbench: [36, 28, 18, 27], ward: [24, 44, 12, 43], rune: [32, 40, 16, 39],
    };
    const animated = key === 'ward' || key === 'rune';
    const cv = this.claimProps.get(animated ? `${key}-${frame % 2}` : key);
    if (!cv) return;
    const [w, h, ax, ay] = dims[key];
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, sx - ax * z, sy - ay * z, w * z, h * z);
  }

  /** a region biome ground tile (replaces the base tile; diamond-center anchored) */
  drawBiomeTile(ctx: CanvasRenderingContext2D, key: BiomeTileKey, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    const cv = this.biomeTiles.get(key);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, sx - 32 * z, sy - 15 * z, 64 * z, 36 * z);
  }

  /** a scattered micro-POI landmark, bottom-center anchored */
  drawMicroPoi(ctx: CanvasRenderingContext2D, key: MicroPoiKey, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    const spec = MICROPOI_SPECS[key];
    const cv = this.micropoi.get(`${key}-${frame % spec.frames}`);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, sx - (spec.cell[0] / 2) * z, sy - (spec.cell[1] - 1) * z, spec.cell[0] * z, spec.cell[1] * z);
  }

  /** little follower, bottom-center anchored */
  drawPet(ctx: CanvasRenderingContext2D, kind: string, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.pets.get(`${kind}-${frame % 2}`);
    if (cv) ctx.drawImage(cv, sx - 7 * z, sy - 13 * z, 14 * z, 14 * z);
  }

  /** the steed under a mounted wanderer (DS frontier_steed): 56×48, bottom-center
   *  anchor (28,47). `mirror` flips to the left-half facings, like the rig. */
  drawSteed(
    ctx: CanvasRenderingContext2D, facing: SteedFacing, mirror: boolean,
    anim: string, frame: number, sx: number, sy: number, z: number,
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.mounts.get(`${facing}-${anim}-${frame}`);
    if (!cv) return;
    const [w, h] = STEED_CELL, [ax, ay] = STEED_ANCHOR;
    if (!mirror) {
      ctx.drawImage(cv, sx - ax * z, sy - ay * z, w * z, h * z);
    } else {
      ctx.save();
      ctx.translate(sx, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(cv, -(w - ax) * z, sy - ay * z, w * z, h * z);
      ctx.restore();
    }
  }

  /** an auto-tiled road cell drawn over the ground (64×36, diamond-center). The
   *  mask is the 4-neighbour road bitmask (ne1/se2/sw4/nw8); lazily cached. */
  drawRoadTile(ctx: CanvasRenderingContext2D, mask: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    let cv = this.roads.get(String(mask));
    if (!cv) { cv = gridToCanvas(drawRoad(roadDirsFromMask(mask), false)); this.roads.set(String(mask), cv); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, sx - 32 * z, sy - 15 * z, 64 * z, 36 * z);
  }

  /** wayside decor (campfire/tent/camp props), bottom-center anchored */
  drawWayside(ctx: CanvasRenderingContext2D, key: WaysideKey, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    const spec = WAYSIDE_SPECS[key];
    const cv = this.wayside.get(`${key}-${frame % spec.frames}`);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, sx - (spec.cell[0] / 2) * z, sy - (spec.cell[1] - 1) * z, spec.cell[0] * z, spec.cell[1] * z);
  }

  /** ruin / landmark decor, bottom-center anchored */
  drawRuin(ctx: CanvasRenderingContext2D, key: RuinKey, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    const spec = RUIN_SPECS[key];
    const cv = this.ruins.get(`${key}-${frame % spec.frames}`);
    if (!cv) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, sx - (spec.cell[0] / 2) * z, sy - (spec.cell[1] - 1) * z, spec.cell[0] * z, spec.cell[1] * z);
  }

  /** claim furniture, bottom-center anchored */
  drawProp(ctx: CanvasRenderingContext2D, kind: string, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    // claim upgrade props use the larger claimworks art
    if (kind === "claim_stash") return this.drawClaimProp(ctx, "stash", frame, sx, sy, z);
    if (kind === "claim_workbench") return this.drawClaimProp(ctx, "workbench", frame, sx, sy, z);
    if (kind === "claim_ward") return this.drawClaimProp(ctx, "ward", frame, sx, sy, z);
    ctx.imageSmoothingEnabled = false;
    const cv = this.props.get(`${kind}-${frame % 2}`);
    if (cv) ctx.drawImage(cv, sx - 10 * z, sy - 25 * z, 20 * z, 26 * z);
  }

  /** interior floor tile, same alignment contract as drawTile */
  drawFloor(ctx: CanvasRenderingContext2D, style: InteriorFloorStyle, variant: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    // DS floor variants are seeded 1..3
    const seed = (variant % 3) + 1;
    const k = `${style}-${seed}`;
    let cv = this.floors.get(k);
    if (!cv) {
      cv = gridToCanvas(makeInteriorFloor(style, seed));
      this.floors.set(k, cv);
    }
    ctx.drawImage(cv, sx - 32 * z, sy - 15 * z, 64 * z, 36 * z);
  }

  /** interior furniture, bottom-center anchored (rug: flat, center-anchored).
   *  Animated kinds flicker internally: goldVein sparkle 2f, hearth flame 3f. */
  drawFixture(ctx: CanvasRenderingContext2D, kind: FixtureSpriteKind, accent: string, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const frame =
      kind === 'hearth' ? Math.floor(performance.now() / 250) % 3 :
      kind === 'goldVein' ? Math.floor(performance.now() / 500) % 2 :
      kind === 'exchange' ? Math.floor(performance.now() / 500) % 2 :
      kind === 'mirror' ? Math.floor(performance.now() / 500) % 2 :
      kind === 'standingBrazier' ? Math.floor(performance.now() / 250) % 2 : 0;
    const k = `${kind}-${accent}-${frame}`;
    let cv = this.fixtures.get(k);
    if (!cv) {
      cv = gridToCanvas(makeFixture(kind, accent, frame));
      this.fixtures.set(k, cv);
    }
    if (kind === 'rug') {
      ctx.drawImage(cv, sx - (cv.width / 2) * z, sy - (cv.height / 2) * z, cv.width * z, cv.height * z);
    } else {
      ctx.drawImage(cv, sx - (cv.width / 2) * z, sy - (cv.height - 1) * z, cv.width * z, cv.height * z);
    }
  }

  /** skewed wall segment (32×72) — anchor: bottom-LEFT corner of the sloped
   *  bottom edge (ne: the tile's north corner; nw: the tile's west corner) */
  drawWall2(
    ctx: CanvasRenderingContext2D,
    side: WallSide,
    mat: WallMatKind,
    variant: WallVariant,
    accent: string,
    sx: number,
    sy: number,
    z: number,
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `2-${side}-${mat}-${variant}-${accent}`;
    let cv = this.walls.get(k);
    if (!cv) {
      cv = gridToCanvas(makeWall2(side, mat, variant, { accent: ACCENT_RAMP[accent] }));
      this.walls.set(k, cv);
    }
    // ne anchor (0,55); nw anchor (0,71)
    const ay = side === 'ne' ? 55 : 71;
    ctx.drawImage(cv, sx, sy - ay * z, 32 * z, 72 * z);
  }

  /** corner wedge capping the nw/ne junction (anchor: bottom-center, y=55) */
  drawWall2Corner(ctx: CanvasRenderingContext2D, mat: WallMatKind, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `2c-${mat}`;
    let cv = this.walls.get(k);
    if (!cv) {
      cv = gridToCanvas(makeWall2Corner(mat));
      this.walls.set(k, cv);
    }
    ctx.drawImage(cv, sx - 8 * z, sy - 55 * z, 16 * z, 72 * z);
  }

  /** interior wall segment, bottom-center anchored (64×56) */
  drawWall(
    ctx: CanvasRenderingContext2D,
    side: WallSide,
    mat: WallMatKind,
    variant: WallVariant,
    accent: string,
    sx: number,
    sy: number,
    z: number,
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const k = `${side}-${mat}-${variant}-${accent}`;
    let cv = this.walls.get(k);
    if (!cv) {
      cv = gridToCanvas(makeWallSegment(side, mat, variant, { accent: ACCENT_RAMP[accent] }));
      this.walls.set(k, cv);
    }
    ctx.drawImage(cv, sx - 32 * z, sy - 55 * z, 64 * z, 56 * z);
  }

  /** the caravan wagon, bottom-center anchored (frame alternates while rolling) */
  drawWagon(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number, frame = 0) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.wagon[frame % 2];
    if (cv) ctx.drawImage(cv, sx - 28 * z, sy - 41 * z, 56 * z, 44 * z);
  }

  /** grave marker for dropped gold, bottom-center anchored */
  drawTombstone(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.tombstone, sx - 8 * z, sy - 17 * z, 16 * z, 18 * z);
  }

  /** additive purple glow centered on a corrupt tile */
  drawGlow(ctx: CanvasRenderingContext2D, sx: number, sy: number, z: number, alpha: number) {
    if (!this.ready) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    // keep the glow close to the tile footprint (72x36 ≈ one diamond + a thin
    // halo) so corruption reads at its true size; the old 128x64 bled a full
    // tile outward and additively bloomed clusters into looking far larger
    // than the drift % actually is.
    ctx.drawImage(this.glow, sx - 36 * z, sy - 18 * z, 72 * z, 36 * z);
    ctx.restore();
  }

  // ── Node drawing ─────────────────────────────────────────────────────────────
  // sx, sy = screen center of tile (entity base anchor)
  drawNode(
    ctx:      CanvasRenderingContext2D,
    kind:     'tree' | 'rock' | 'fish',
    depleted: boolean,
    sx:       number,
    sy:       number,
    z:        number,
    frame  = 0,
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;

    if (kind === 'tree') {
      const cv = depleted ? this.treeDep : this.treeNorm;
      // 48×56, bottom-center at (24, 55) → anchor at (sx, sy)
      ctx.drawImage(cv, sx - 24 * z, sy - 55 * z, 48 * z, 56 * z);
    } else if (kind === 'rock') {
      const cv = depleted ? this.rockDep : this.rockNorm;
      // 40×30, bottom-center at (20, 29) → anchor at (sx, sy)
      ctx.drawImage(cv, sx - 20 * z, sy - 29 * z, 40 * z, 30 * z);
    } else {
      // fish ripple — centered on tile waist
      const idx = depleted ? this.fishAnim.length - 1 : frame % (this.fishAnim.length - 1);
      const cv = this.fishAnim[idx];
      // 40×20, center at (20,10)
      ctx.drawImage(cv, sx - 20 * z, sy - 10 * z, 40 * z, 20 * z);
    }
  }

  // ── Character drawing ────────────────────────────────────────────────────────
  // sx, sy = screen position of character's iso center (feet land at sy)
  drawChar(
    ctx:     CanvasRenderingContext2D,
    facing:  IsoFacing,
    mirrored: boolean,
    anim:    AnimName,
    frame:   number,
    sx:      number,
    sy:      number,
    z:       number,
    equip?:  EquipVisual,
    look?:   LookVisual,
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const f = frame % ANIM_FRAMES.find(a => a[0] === anim)![1];
    const hasGear = !!(equip && (equip.weapon || equip.tool || equip.ward));
    const avatar = look?.avatar && AVATAR_CHANNELS[look.avatar as AvatarKind]
      ? (look.avatar as AvatarKind) : null;
    const hasLook = !!(look && ((look.dye && look.dye !== 'stone') || (look.eye && look.eye !== 'drift')));
    let sig = '';
    if (hasGear) sig += `-w${equip!.weapon ?? 0}t${equip!.tool ?? 0}d${equip!.ward ?? 0}h${equip!.held ?? ''}`;
    if (avatar) sig += `-av${avatar}.${look!.avA ?? ''}.${look!.avB ?? ''}`;
    else if (hasLook) sig += `-c${look!.dye ?? 'stone'}.${look!.eye ?? 'drift'}`;
    const key = `${facing}-${anim}-${f}${mirrored ? '-m' : ''}${sig}`;
    let cv = this.charMap.get(key);
    if (!cv && (hasGear || hasLook || avatar)) {
      // gear/cosmetics change rarely — bake the variant frame on first sight
      let g = avatar
        ? drawAvatar(avatar, facing, anim, f, { a: look!.avA, b: look!.avB }, equip)
        : look?.dye === 'ashfall'
        ? drawWandererDyed(facing, anim, f, ASHFALL_DYE, equip) // season cloak (composes with gear)
        : drawWanderer(facing, anim, f, equip, look);
      if (mirrored) g = mirrorX(g);
      cv = gridToCanvas(g);
      this.charMap.set(key, cv);
    }
    if (!cv) return;
    // 32×40, feet at y=37 → anchor at sy
    ctx.drawImage(cv, sx - 16 * z, sy - 37 * z, 32 * z, 40 * z);
  }

  // ── Beast drawing ─────────────────────────────────────────────────────────────
  // sx, sy = screen position of the beast's iso center (base lands at sy)

  beastFrames(kind: BeastKind, anim: BeastAnim): number {
    return BEAST_SPECS[kind].anims[anim][1];
  }

  drawBeast(
    ctx:      CanvasRenderingContext2D,
    kind:     BeastKind,
    facing:   IsoFacing,
    mirrored: boolean,
    anim:     BeastAnim,
    frame:    number,
    sx:       number,
    sy:       number,
    z:        number,
    hurt = false,
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const spec = BEAST_SPECS[kind];
    const [sheetAnim, n] = spec.anims[anim];
    const f = frame % n;
    const key = `${kind}-${facing}-${anim}-${f}${mirrored ? '-m' : ''}${hurt ? '-h' : ''}`;
    let cv = this.beastMap.get(key);
    if (!cv) {
      let g = spec.draw(facing, sheetAnim, f);
      if (mirrored) g = mirrorX(g);
      cv = gridToCanvas(g);
      if (hurt) cv = tintCanvas(cv, spec.hurt);
      this.beastMap.set(key, cv);
    }
    // bottom-center anchored: cell base row sits at sy
    ctx.drawImage(cv, sx - (spec.w / 2) * z, sy - (spec.h - 1) * z, spec.w * z, spec.h * z);
  }

  /** cell height for a beast kind (HP bar / tag placement) */
  beastHeight(kind: BeastKind): number {
    return BEAST_SPECS[kind].h;
  }
}

/** soft elliptical glow used for corruption light pools (atmosphere layer —
 *  gradient is fine here, the dither rule applies to sprites) */
function makeGlowCanvas(): OffscreenCanvas {
  const cv = new OffscreenCanvas(128, 64);
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 32, 4, 64, 32, 60);
  g.addColorStop(0, 'rgba(168,85,247,0.32)');
  g.addColorStop(0.5, 'rgba(107,33,168,0.14)');
  g.addColorStop(1, 'rgba(107,33,168,0)');
  ctx.fillStyle = g;
  ctx.save();
  ctx.scale(1, 0.5);
  ctx.translate(0, 32);
  ctx.fillRect(0, 0, 128, 128);
  ctx.restore();
  return cv;
}

/** flash variant: repaint the sprite's own pixels toward the hurt color */
function tintCanvas(src: OffscreenCanvas, color: string): OffscreenCanvas {
  const out = new OffscreenCanvas(src.width, src.height);
  const ctx = out.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, src.width, src.height);
  return out;
}

export const spriteCache = new SpriteCache();
