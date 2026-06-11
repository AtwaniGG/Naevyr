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

// ─── the Waystation: town buildings (port of DS _gen/town.js) ─────────────────
// Iso 2:1 weathered frontier structures. Each house: south door + a warm lit
// window + a purpose sign/roof feature. Moonlit left, shadowed right.
// Houses: 144×152 cell, bottom-center anchor. Shrine: 112×128 (3 flame
// frames). Pit: 240×120 flat, center-anchored, drawn under entities.
// DS 'casino' → our 'wheel' key, DS 'tavern' → our 'lantern' key.

export type BuildingSpriteKey =
  | 'dyeworks' | 'vault' | 'wheel' | 'lantern'
  | 'furnisher' | 'menagerie' | 'shrine' | 'pit' | 'mine'
  | 'huskden' | 'obelisk' | 'mirehut';

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

// ─── WILD STRUCTURES (hand-built placeholders until the next design pack) ────

// the Husk Den: a corrupted burrow-mound ringed with old bones (Ashen Flats)
function drawHuskDen(): Grid {
  const g = makeGrid(120, 88);
  const cx = 60, baseY = 70;
  foundation(g, cx, baseY + 6, 46, {});
  // low dark mound, drift-tinged
  for (let yy = 0; yy <= 26; yy++) {
    const t = yy / 26;
    let hw = Math.round(46 * Math.sqrt(Math.max(0, 1 - t * t)));
    hw += Math.round((rnd2(yy, 0, 401) - 0.5) * 5);
    for (let xx = -hw; xx <= hw; xx++) {
      const h = rnd2(cx + xx, baseY - yy, 402);
      let c = RAMP.stone[2];
      if (xx < -hw + 5) c = RAMP.stone[1];
      else if (xx > hw - 5) c = RAMP.stone[3];
      if (h < 0.07) c = RAMP.drift[3];
      else if (h < 0.1) c = RAMP.stone[3];
      P(g, cx + xx, baseY - yy, c);
    }
  }
  // burrow mouth (south)
  for (let j = 0; j < 14; j++) for (let i = -9; i <= 9; i++) {
    const t = Math.abs(i) / 9;
    if (j < 8 * t * t) continue;
    P(g, cx + i, baseY - j, RAMP.void);
  }
  P(g, cx - 3, baseY - 5, RAMP.drift[1]); P(g, cx + 4, baseY - 7, RAMP.drift[2]); // eyes in the dark
  // ring of jutting bone spikes
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const sx = cx + Math.round(Math.cos(a) * 42);
    const sy = baseY + 4 + Math.round(Math.sin(a) * 9) - (Math.sin(a) < 0 ? 26 : 0);
    const h = 7 + ((i * 5) % 7);
    for (let k = 0; k < h; k++) {
      P(g, sx + Math.round(k * 0.2), sy - k, k > h - 3 ? RAMP.bone[0] : RAMP.bone[1]);
      if (k < h - 2) P(g, sx + 1 + Math.round(k * 0.2), sy - k, RAMP.bone[2]);
    }
  }
  // scattered bones
  for (let i = 0; i < 10; i++) {
    const bx = cx - 40 + Math.floor(rnd2(i, 1, 403) * 80);
    const by = baseY + 2 + Math.floor(rnd2(i, 2, 403) * 8);
    if (rnd2(i, 3, 403) < 0.6) { P(g, bx, by, RAMP.bone[2]); P(g, bx + 1, by, RAMP.bone[3]); }
  }
  outline(g, RAMP.void);
  return g;
}

// the Ash Obelisk: a drift-touched monolith with glowing runes (Ashen Flats)
function drawObelisk(): Grid {
  const g = makeGrid(64, 112);
  const cx = 32, baseY = 96;
  foundation(g, cx, baseY + 6, 26, {});
  // tapered monolith
  for (let yy = 0; yy <= 78; yy++) {
    const t = yy / 78;
    const hw = Math.round(11 * (1 - t * 0.55));
    for (let xx = -hw; xx <= hw; xx++) {
      let c = RAMP.stone[1];
      if (xx < -hw + 2) c = RAMP.stone[0];
      else if (xx > hw - 2) c = RAMP.stone[2];
      if (rnd2(cx + xx, baseY - yy, 404) < 0.06) c = RAMP.stone[2];
      P(g, cx + xx, baseY - yy, c);
    }
  }
  // capstone shard
  for (let k = 0; k < 7; k++) {
    for (let xx = -Math.max(0, 4 - k); xx <= Math.max(0, 4 - k); xx++) {
      P(g, cx + xx, baseY - 78 - k, k > 4 ? RAMP.drift[1] : RAMP.stone[0]);
    }
  }
  P(g, cx, baseY - 86, RAMP.drift[0]);
  // glowing runes down the face
  for (let i = 0; i < 6; i++) {
    const ry = baseY - 12 - i * 11;
    const rx = cx + ((i % 2) ? -2 : 1);
    P(g, rx, ry, RAMP.drift[1]); P(g, rx + 1, ry, RAMP.drift[2]);
    P(g, rx, ry - 1, RAMP.drift[2]); P(g, rx - 1, ry, RAMP.drift[3]);
    P(g, rx, ry + 1, RAMP.drift[0]);
  }
  // dither glow halo
  for (let yy = -40; yy <= 0; yy++) for (let xx = -10; xx <= 10; xx++) {
    const d = Math.abs(xx) + Math.abs((yy + 20) * 0.5);
    if (d > 11 && d < 14 && (xx + yy) % 2 === 0) P(g, cx + xx, baseY - 40 + yy, RAMP.drift[2]);
  }
  outline(g, RAMP.void);
  return g;
}

// the Mirewife's Hut: a crooked stilted hut hung with charms (Hollowmere Reach)
function drawMireHut(): Grid {
  const g = makeGrid(120, 116);
  const cx = 60, baseY = 96;
  foundation(g, cx, baseY + 6, 48, {});
  // stilts
  for (const sx of [-26, -8, 10, 26]) {
    for (let k = 0; k < 12; k++) { P(g, cx + sx, baseY - k, RAMP.dirt[3]); P(g, cx + sx + 1, baseY - k, RAMP.dirt[2]); }
  }
  // hut body (timber, slightly skewed)
  for (let y = 0; y <= 34; y++) for (let x = -30; x <= 30; x++) {
    const skew = Math.round(y * 0.12);
    let c = RAMP.dirt[1];
    if (x < -26) c = RAMP.dirt[0];
    else if (x > 26) c = RAMP.dirt[2];
    if (y % 4 === 0) c = RAMP.dirt[2];
    if (rnd2(x, y, 405) < 0.05) c = RAMP.dirt[3];
    P(g, cx + x + skew, baseY - 12 - y, c);
  }
  // mossy reed roof
  for (let y = 0; y <= 18; y++) {
    const t = y / 18;
    const hw = Math.round((36 - 30 * t));
    for (let x = -hw; x <= hw; x++) {
      let c = RAMP.grass[1];
      if (x < -hw + 3) c = RAMP.grass[0];
      else if (x > hw - 3) c = RAMP.grass[2];
      if (y % 3 === 0) c = RAMP.grass[2];
      if (rnd2(x, y, 406) < 0.07) c = RAMP.grass[3];
      P(g, cx + x + Math.round((18 - y) * 0.12), baseY - 46 - y + 18, c);
    }
  }
  // door + warm window
  door(g, cx - 6, baseY - 12, 10, 18, RAMP.dirt);
  litWindow(g, cx + 12, baseY - 36, 8, 7, { noCross: true });
  // hanging charms under the eave
  for (let i = 0; i < 5; i++) {
    const hx = cx - 22 + i * 11;
    P(g, hx, baseY - 44, RAMP.bone[3]);
    P(g, hx, baseY - 43, RAMP.bone[2]);
    P(g, hx, baseY - 42, i % 2 ? RAMP.drift[2] : RAMP.bone[1]);
  }
  // a rickety stoop down the front
  for (let k = 0; k < 4; k++) {
    for (let i = -7; i <= 1; i++) P(g, cx + i - 4 + k, baseY - 8 + k * 2, RAMP.dirt[2]);
    for (let i = -7; i <= 1; i++) P(g, cx + i - 4 + k, baseY - 7 + k * 2, RAMP.dirt[3]);
  }
  outline(g, RAMP.void);
  return g;
}

export const SHRINE_FRAMES = 3;

// (exported for the headless smoke test; frame only matters for the shrine)
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
    case 'huskden':   return drawHuskDen();
    case 'obelisk':   return drawObelisk();
    case 'mirehut':   return drawMireHut();
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

export type InteriorFloorStyle = 'wood' | 'stone' | 'cave';

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
  | 'goldVein' | 'goldVeinEmpty' | 'hearth' | 'oreCart';

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
  }
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
  private wagon: OffscreenCanvas[] = [];
  // interiors: floors keyed `${style}-${variant}`, fixtures `${kind}-${accent}` (lazy)
  private floors = new Map<string, OffscreenCanvas>();
  private fixtures = new Map<string, OffscreenCanvas>();
  private walls = new Map<string, OffscreenCanvas>();
  private buildings = new Map<string, OffscreenCanvas>(); // key (+ `-${frame}` for shrine)
  private pets = new Map<string, OffscreenCanvas>();   // `${kind}-${frame}`
  private props = new Map<string, OffscreenCanvas>();  // `${kind}-${frame}`
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
    this.wagon = [gridToCanvas(makeWagon(0)), gridToCanvas(makeWagon(1))];
    // the Waystation
    for (const k of [
      'dyeworks', 'vault', 'wheel', 'lantern',
      'furnisher', 'menagerie', 'pit', 'mine',
      'huskden', 'obelisk', 'mirehut',
    ] as BuildingSpriteKey[]) {
      this.buildings.set(k, gridToCanvas(makeBuildingSprite(k)));
    }
    for (let f = 0; f < SHRINE_FRAMES; f++) {
      this.buildings.set(`shrine-${f}`, gridToCanvas(makeBuildingSprite('shrine', f)));
    }
    for (const k of ['wisp', 'crow', 'emberling'] as PetSpriteKey[]) {
      this.pets.set(`${k}-0`, gridToCanvas(makePet(k, 0)));
      this.pets.set(`${k}-1`, gridToCanvas(makePet(k, 1)));
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
    if (cv) ctx.drawImage(cv, sx - 8 * z, sy - 11 * z, 16 * z, 12 * z);
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
    const cv = this.buildings.get(key === 'shrine' ? `shrine-${frame % SHRINE_FRAMES}` : key);
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

  /** sprite height of a building (for floating labels) */
  buildingHeight(key: BuildingSpriteKey): number {
    const cv = this.buildings.get(key === 'shrine' ? 'shrine-0' : key);
    return cv ? cv.height : 0;
  }

  /** little follower, bottom-center anchored */
  drawPet(ctx: CanvasRenderingContext2D, kind: string, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const cv = this.pets.get(`${kind}-${frame % 2}`);
    if (cv) ctx.drawImage(cv, sx - 7 * z, sy - 13 * z, 14 * z, 14 * z);
  }

  /** claim furniture, bottom-center anchored */
  drawProp(ctx: CanvasRenderingContext2D, kind: string, frame: number, sx: number, sy: number, z: number) {
    if (!this.ready) return;
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
      kind === 'goldVein' ? Math.floor(performance.now() / 500) % 2 : 0;
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
