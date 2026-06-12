// Naevyr sprite generator library — evaled inside run_script.
// Pixel grids -> auto outline -> row-run-merged <rect> SVG (crispEdges).
// Deterministic RNG only; alpha used ONLY for the corruption overlay.

function makeGrid(w, h) { return { w, h, d: new Array(w * h).fill(null) }; }
function P(g, x, y, c, a) {
  x = x | 0; y = y | 0;
  if (x < 0 || y < 0 || x >= g.w || y >= g.h || !c) return;
  g.d[y * g.w + x] = a == null ? { c } : { c, a };
}
function G(g, x, y) {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null;
  return g.d[y * g.w + x];
}
function fillRect(g, x, y, w, h, c, a) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(g, x + i, y + j, c, a);
}
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function outline(g, c) {
  c = c || '#0a0810';
  const add = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (G(g, x, y)) continue;
    if (G(g, x + 1, y) || G(g, x - 1, y) || G(g, x, y + 1) || G(g, x, y - 1)) add.push([x, y]);
  }
  add.forEach(p => P(g, p[0], p[1], c));
}
function stamp(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const v = G(src, x, y); if (v) P(dst, ox + x, oy + y, v.c, v.a);
  }
}
function mirrorX(g) {
  const m = makeGrid(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y); if (v) P(m, g.w - 1 - x, y, v.c, v.a);
  }
  return m;
}
function gridRects(g, ox, oy) {
  ox = ox || 0; oy = oy || 0;
  const out = [];
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = G(g, x, y);
      if (!v) { x++; continue; }
      let x2 = x + 1;
      while (x2 < g.w) {
        const v2 = G(g, x2, y);
        if (!v2 || v2.c !== v.c || (v2.a == null ? 1 : v2.a) !== (v.a == null ? 1 : v.a)) break;
        x2++;
      }
      out.push({ x: x + ox, y: y + oy, w: x2 - x, c: v.c, a: v.a });
      x = x2;
    }
  }
  return out;
}
function rectsToSvg(rects, w, h) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
    '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">' +
    rects.map(r => '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="1" fill="' + r.c + '"' +
      (r.a != null ? ' fill-opacity="' + r.a + '"' : '') + '/>').join('') + '</svg>';
}
function gridSvg(g) { return rectsToSvg(gridRects(g), g.w, g.h); }
function sheetSvg(grids, cw, ch, cols) {
  const n = grids.length; cols = cols || n;
  const rows = Math.ceil(n / cols);
  let rects = [];
  grids.forEach((g, i) => {
    rects = rects.concat(gridRects(g, (i % cols) * cw, Math.floor(i / cols) * ch));
  });
  return rectsToSvg(rects, cols * cw, rows * ch);
}
function drawGrid(ctx, g, ox, oy, s) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y); if (!v) continue;
    ctx.globalAlpha = v.a == null ? 1 : v.a;
    ctx.fillStyle = v.c;
    ctx.fillRect(ox + x * s, oy + y * s, s, s);
  }
  ctx.globalAlpha = 1;
}

// 64x32 iso diamond face rows: y -> inclusive [x0,x1]
function diamondRows() {
  const rows = [];
  for (let y = 0; y < 32; y++) {
    const half = y < 16 ? 2 * (y + 1) : 2 * (32 - y);
    rows.push({ x0: 32 - half, x1: 32 + half - 1 });
  }
  return rows;
}
function inDiamond(rows, x, y) {
  if (y < 0 || y > 31) return false;
  return x >= rows[y].x0 && x <= rows[y].x1;
}

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

Object.assign(globalThis, {
  makeGrid, P, G, fillRect, mulberry, outline, stamp, mirrorX,
  gridRects, rectsToSvg, gridSvg, sheetSvg, drawGrid,
  diamondRows, inDiamond, RAMP,
});
