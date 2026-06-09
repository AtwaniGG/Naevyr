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

function hash2(x: number, y: number, s: number): number {
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

function makeBaseTile(type: 'grass' | 'dirt' | 'stone' | 'water', seedN: number): Grid {
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
  // 1px void north edge
  for (let x = 0; x < 64; x++)
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { P(g, x, y, RAMP.void); break; }

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

function genWaterFrames(seedN: number): Grid[] {
  const specs: { x: number; y: number; len: number }[] = [];
  const rnd = mulberry(seedN + 100);
  for (let i = 0; i < 7; i++) {
    specs.push({ x: 12 + Math.floor(rnd() * 38), y: 6 + Math.floor(rnd() * 20), len: 2 + Math.floor(rnd() * 4) });
  }
  const DX = [0, 1, 0, -1], DY = [0, 0, 1, 0];
  const rows = diamondRows();
  return [0, 1, 2, 3].map(f => {
    const g = makeBaseTile('water', seedN);
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

function drawWanderer(facing: IsoFacing, anim: AnimName, f: number): Grid {
  const g = makeGrid(32, 40);
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone;
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
    if (dir === 0) { P(g, fcx - 1, ey, blink ? dr[3] : dr[2]); P(g, fcx + 1, ey, blink ? dr[3] : dr[1]); }
    if (dir === 1) { P(g, fcx, ey, blink ? dr[3] : dr[2]); P(g, fcx + 2, ey, blink ? dr[3] : dr[1]); }
    if (dir === 2) { P(g, fcx + 1, ey, blink ? dr[3] : dr[1]); }
  }
  if (anim === 'idle' && f === 1) P(g, cx + off + 7, top + 3, dr[1]);

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
  }

  outline(g);
  return g;
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

export class SpriteCache {
  ready = false;

  private tiles    = new Map<string, OffscreenCanvas>();
  private waterAnim: OffscreenCanvas[]  = [];
  private corruptOv: OffscreenCanvas[]  = [];
  private treeNorm!: OffscreenCanvas;
  private treeDep!:  OffscreenCanvas;
  private rockNorm!: OffscreenCanvas;
  private rockDep!:  OffscreenCanvas;
  private fishAnim: OffscreenCanvas[]   = [];
  // char key: `${facing}-${anim}-${frame}` (or +'-m' for mirrored)
  private charMap  = new Map<string, OffscreenCanvas>();

  init() {
    // tiles
    for (const t of ['grass', 'dirt', 'stone'] as const)
      this.tiles.set(t, gridToCanvas(makeBaseTile(t, 0)));
    // corrupt tile = stone base (overlay drawn on top)
    this.tiles.set('corrupt', gridToCanvas(makeBaseTile('stone', 1)));
    // water animation frames
    this.waterAnim = genWaterFrames(0).map(gridToCanvas);
    // corruption overlay frames (alpha)
    this.corruptOv = genCorruptFrames().map(gridToCanvas);
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
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;

    let cv: OffscreenCanvas | undefined;
    if (type === 'water') {
      cv = this.waterAnim[frame % this.waterAnim.length];
    } else {
      cv = this.tiles.get(type);
    }
    if (cv) ctx.drawImage(cv, sx - 32 * z, sy - 15 * z, 64 * z, 36 * z);

    if (type === 'corrupt') {
      const ov = this.corruptOv[frame % this.corruptOv.length];
      ctx.drawImage(ov, sx - 32 * z, sy - 15 * z, 64 * z, 32 * z);
    }
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
  ) {
    if (!this.ready) return;
    ctx.imageSmoothingEnabled = false;
    const key = `${facing}-${anim}-${frame % ANIM_FRAMES.find(a => a[0] === anim)![1]}${mirrored ? '-m' : ''}`;
    const cv = this.charMap.get(key);
    if (!cv) return;
    // 32×40, feet at y=37 → anchor at sy
    ctx.drawImage(cv, sx - 16 * z, sy - 37 * z, 32 * z, 40 * z);
  }
}

export const spriteCache = new SpriteCache();
