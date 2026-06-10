// game/render/sprites.ts
// TypeScript port of the DriftLands DS _gen/*.js sprite generators.
// All sprites are generated once at init() into OffscreenCanvas objects and
// drawn with imageSmoothingEnabled=false for crisp pixel scaling at any zoom.

// ─── Types ────────────────────────────────────────────────────────────────────

type Grid = { w: number; h: number; d: (Pixel | null)[] };
type Pixel = { c: string; a?: number };

export type IsoFacing = 's' | 'se' | 'e' | 'ne' | 'n';
export type AnimName  = 'idle' | 'walk' | 'swing';

// ─── Palette (exact mirror of DS RAMP) ────────────────────────────────────────

const RAMP = {
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

export type DoodadKind = 'tuft' | 'pebbles' | 'bones' | 'masonry' | 'crystal';

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

/** how the wanderer presents: dye + eye glow (cosmetic, multiplayer-synced) */
export interface LookVisual {
  dye?: DyeKey;
  eye?: EyeKey;
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

// ─── beasts.js — creature set ─────────────────────────────────────────────────

export type BeastKind = 'husk' | 'stalker' | 'colossus' | 'raider';
export type BeastAnim = 'idle' | 'move' | 'attack' | 'death';

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

// ─── tombstone: dropped-gold grave marker ─────────────────────────────────────

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

// kind → cell dims, anim table (generic name → [sheet anim, frames]) and
// hurt-flash tint, all per the design package's beasts metadata.
// (exported for the headless smoke test — engine code goes through SpriteCache)
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
};

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

export class SpriteCache {
  ready = false;

  // tile key: `${type}-v${variant}-${edge ? 'e' : 'n'}`; transitions use
  // `${type}>${other}-${edge ? 'e' : 'n'}`
  private tiles    = new Map<string, OffscreenCanvas>();
  private waterAnim: OffscreenCanvas[]  = [];
  private waterShore: OffscreenCanvas[] = [];
  private corruptOv: OffscreenCanvas[]  = [];
  private doodads  = new Map<string, OffscreenCanvas>();
  private glow!: OffscreenCanvas;
  private tombstone!: OffscreenCanvas;
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
    // soft corruption glow (screen-space atmosphere, drawn additively)
    this.glow = makeGlowCanvas();
    this.tombstone = gridToCanvas(makeTombstone());
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
    if (cv) ctx.drawImage(cv, sx - 8 * z, sy - 11 * z, 16 * z, 12 * z);
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
    ctx.drawImage(this.glow, sx - 64 * z, sy - 32 * z, 128 * z, 64 * z);
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
    const hasLook = !!(look && ((look.dye && look.dye !== 'stone') || (look.eye && look.eye !== 'drift')));
    let sig = '';
    if (hasGear) sig += `-w${equip!.weapon ?? 0}t${equip!.tool ?? 0}d${equip!.ward ?? 0}h${equip!.held ?? ''}`;
    if (hasLook) sig += `-c${look!.dye ?? 'stone'}.${look!.eye ?? 'drift'}`;
    const key = `${facing}-${anim}-${f}${mirrored ? '-m' : ''}${sig}`;
    let cv = this.charMap.get(key);
    if (!cv && (hasGear || hasLook)) {
      // gear/cosmetics change rarely — bake the variant frame on first sight
      let g = drawWanderer(facing, anim, f, equip, look);
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
