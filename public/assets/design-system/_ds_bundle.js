/* @ds-bundle: {"format":3,"namespace":"DriftLandsDesignSystem_3de3e2","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"SeasonBadge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"ActivityLog","sourcePath":"components/game/ActivityLog.jsx"},{"name":"Hotbar","sourcePath":"components/game/Hotbar.jsx"},{"name":"Slot","sourcePath":"components/game/Slot.jsx"},{"name":"XPBar","sourcePath":"components/game/XPBar.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"TOOL_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"}],"sourceHashes":{"assets/_gen/character.js":"bfa95973ee9e","assets/_gen/fxlogo.js":"3f5a0b6e4d3d","assets/_gen/nodes.js":"76c3d5ae0969","assets/_gen/pixlib.js":"9e04175a932b","assets/_gen/tiles.js":"22b604e5b061","components/core/Badge.jsx":"ccdd07c8772a","components/core/Button.jsx":"19a408191a59","components/core/Panel.jsx":"bd9e204398e5","components/game/ActivityLog.jsx":"9dd668351d97","components/game/Hotbar.jsx":"1dc48c13f595","components/game/Slot.jsx":"9dd86e4254ac","components/game/XPBar.jsx":"ec7638c938cb","components/icons/Icon.jsx":"807bd0992422","ui_kits/hud/Hud.jsx":"161da3666ec3","ui_kits/hud/Scene.jsx":"23d63aaee578"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DriftLandsDesignSystem_3de3e2 = window.DriftLandsDesignSystem_3de3e2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/_gen/character.js
try { (() => {
// DriftLands character generator — hooded Drift-touched wanderer.
// 32×40 cell, ~30px tall, feet at bottom-center. 5 facings (s,se,e,ne,n);
// engine mirrors for w/sw/nw. Anim: idle 2f · walk 6f · swing 4f.

function drawWanderer(facing, anim, f) {
  const g = makeGrid(32, 40);
  const st = RAMP.stone,
    dr = RAMP.drift,
    bn = RAMP.bone;
  const cx = 16;
  const dir = {
    s: 0,
    se: 1,
    e: 2,
    ne: 3,
    n: 4
  }[facing];
  const off = [0, 1, 2, 1, 0][dir]; // lateral shift toward facing
  const showFace = dir <= 2;
  let bob = 0,
    hemSway = 0;
  if (anim === 'walk') {
    bob = [0, -1, 0, 0, -1, 0][f];
    hemSway = [0, 1, 1, 0, -1, -1][f];
  }
  if (anim === 'idle') {
    hemSway = f === 1 ? 1 : 0;
  }
  const top = 9 + bob;
  const shoulderY = 18 + bob;

  // ---- cloak body (stooped taper, shoulder→hem) ----
  for (let y = shoulderY; y <= 36; y++) {
    const t = (y - shoulderY) / (36 - shoulderY);
    const halfw = Math.round(3.6 + t * 3.4); // ~4 → 7
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(hemSway * 0.5) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = st[1];
      if (x <= cxx - halfw + 1) c = st[0]; // moonlit left edge
      if (x >= cxx + halfw - 1) c = st[3]; // shadow right
      if (hash2(x, y, 61) < 0.06) c = st[2]; // worn cloth
      if (dir >= 3 && x === cxx) c = st[2]; // back seam
      P(g, x, y, c);
    }
  }
  // ---- hem glow (corruption creeping up from the ground) ----
  for (let y = 35; y <= 36; y++) for (let x = 0; x < 32; x++) {
    const v = G(g, x, y);
    if (v) P(g, x, y, y === 36 ? hash2(x, y, 63) < 0.3 ? dr[2] : dr[3] : hash2(x, y, 63) < 0.25 ? dr[3] : v.c);
  }

  // ---- hood ----
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
  // hood point (droops toward facing)
  P(g, cx + off, top - 1, st[1]);
  P(g, cx + off + (dir >= 1 && dir <= 3 ? 1 : 0), top - 2, st[2]);

  // ---- face shadow + Drift eyes ----
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : dir === 1 ? 1 : 0);
    const w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    const blink = anim === 'idle' && f === 1;
    if (dir === 0) {
      P(g, fcx - 1, ey, blink ? dr[3] : dr[2]);
      P(g, fcx + 1, ey, blink ? dr[3] : dr[1]);
    }
    if (dir === 1) {
      P(g, fcx, ey, blink ? dr[3] : dr[2]);
      P(g, fcx + 2, ey, blink ? dr[3] : dr[1]);
    }
    if (dir === 2) {
      P(g, fcx + 1, ey, blink ? dr[3] : dr[1]);
    }
  }
  // idle mote drifting off the shoulder
  if (anim === 'idle' && f === 1) P(g, cx + off + 7, top + 3, dr[1]);

  // ---- feet ----
  const footY = 37;
  let step = 0;
  if (anim === 'walk') step = [2, 1, 0, -2, -1, 0][f];
  const fo = dir >= 1 ? 1 : 0;
  P(g, cx - 3 + fo + step, footY, st[3]);
  P(g, cx - 2 + fo + step, footY, RAMP.void);
  P(g, cx + 2 + fo - step, footY, RAMP.void);
  P(g, cx + 3 + fo - step, footY, st[3]);

  // ---- gather/swing arm + tool ----
  if (anim === 'swing') {
    const hx = cx + off + 4,
      hy = shoulderY + 2;
    const ang = [-2.1, -1.35, -0.45, 0.35][f];
    for (let k = 2; k < 8; k++) {
      const x = Math.round(hx + Math.cos(ang) * k),
        y = Math.round(hy + Math.sin(ang) * k);
      P(g, x, y, k < 4 ? st[2] : RAMP.dirt[0]); // sleeve → wooden haft
    }
    const ex = Math.round(hx + Math.cos(ang) * 8),
      ey2 = Math.round(hy + Math.sin(ang) * 8);
    fillRect(g, ex - 1, ey2 - 1, 3, 2, bn[2]); // tool head
    P(g, ex, ey2 - 2, bn[1]);
    if (f === 2) {
      P(g, ex + 2, ey2, bn[0]);
      P(g, ex + 3, ey2 + 1, RAMP.ember[0]);
    } // hit spark
  }
  outline(g);
  return g;
}
const WANDER_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const WANDER_ANIMS = [['idle', 2], ['walk', 6], ['swing', 4]];
function wandererSheetGrids() {
  // rows = facings, cols = 12 frames (idle0..1, walk0..5, swing0..3)
  const rows = [];
  WANDER_FACINGS.forEach(fc => {
    const row = [];
    WANDER_ANIMS.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(drawWanderer(fc, anim, f));
    });
    rows.push(row);
  });
  return rows;
}
Object.assign(globalThis, {
  drawWanderer,
  wandererSheetGrids,
  WANDER_FACINGS,
  WANDER_ANIMS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/character.js", error: String((e && e.message) || e) }); }

// assets/_gen/fxlogo.js
try { (() => {
// DriftLands FX + logo generators — eval after pixlib.js.

// ---- FX ----
function makeMotes() {
  const dr = RAMP.drift;
  const v1 = makeGrid(2, 2);
  fillRect(v1, 0, 0, 2, 2, dr[1]);
  const v2 = makeGrid(2, 2);
  P(v2, 0, 0, dr[0]);
  P(v2, 1, 0, dr[1]);
  P(v2, 0, 1, dr[2]);
  P(v2, 1, 1, dr[2]);
  const v3 = makeGrid(2, 2);
  P(v3, 0, 0, dr[2]);
  P(v3, 1, 0, dr[3]);
  P(v3, 0, 1, dr[3]);
  P(v3, 1, 1, dr[2]);
  return [v1, v2, v3];
}
function makeEmbers() {
  return [0, 1, 2].map(i => {
    const g = makeGrid(1, 1);
    P(g, 0, 0, RAMP.ember[i]);
    return g;
  });
}
function makeAsh() {
  return ['#a99fb8', '#6f6781', '#d8cfe0'].map(c => {
    const g = makeGrid(1, 1);
    P(g, 0, 0, c);
    return g;
  });
}
// progress ring: 24×24, 8 fill steps, stepped pixel circumference
function makeRingFrames() {
  const dr = RAMP.drift;
  const pts = [];
  const n = 44;
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + i / n * Math.PI * 2; // start top, clockwise
    pts.push([Math.round(11.5 + Math.cos(t) * 9.5), Math.round(11.5 + Math.sin(t) * 9.5)]);
  }
  return Array.from({
    length: 8
  }, (_, s) => {
    const g = makeGrid(24, 24);
    const fillN = Math.round((s + 1) / 8 * n);
    pts.forEach((p, i) => {
      const on = i < fillN;
      P(g, p[0], p[1], on ? dr[2] : dr[4]);
      // 2px thickness: inner ring pixel
      const t = -Math.PI / 2 + i / n * Math.PI * 2;
      P(g, Math.round(11.5 + Math.cos(t) * 8.5), Math.round(11.5 + Math.sin(t) * 8.5), on ? dr[3] : dr[4]);
      if (on && i === fillN - 1) P(g, p[0], p[1], dr[0]); // hot leading pixel
    });
    return g;
  });
}

// ---- LOGO ----
// custom 12px-tall pixel letterset (only the letters DRIFTLANDS needs)
const GLYPHS = {
  D: ['######..', '#######.', '##...##.', '##....##', '##....##', '##....##', '##....##', '##....##', '##....##', '##...##.', '#######.', '######..'],
  R: ['#######.', '########', '##....##', '##....##', '##...###', '#######.', '######..', '##.###..', '##..##..', '##...##.', '##...###', '##....##'],
  I: ['####', '####', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '####', '####'],
  F: ['########', '########', '##......', '##......', '##......', '#######.', '#######.', '##......', '##......', '##......', '##......', '##......'],
  T: ['########', '########', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
  L: ['##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '########', '########'],
  A: ['..####..', '.######.', '##....##', '##....##', '##....##', '########', '########', '##....##', '##....##', '##....##', '##....##', '##....##'],
  N: ['##....##', '##....##', '###...##', '####..##', '##.##.##', '##.##.##', '##..####', '##..####', '##...###', '##...###', '##....##', '##....##'],
  S: ['.#######', '########', '##......', '##......', '########', '.#######', '......##', '......##', '......##', '......##', '########', '#######.']
};
function scaleGrid(g, k) {
  const m = makeGrid(g.w * k, g.h * k);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v) fillRect(m, x * k, y * k, k, k, v.c, v.a);
  }
  return m;
}
// build the DRIFTLANDS wordmark at 1× (12 tall) with corruption bleed
function wordmarkGrid(mono) {
  const word = 'DRIFTLANDS';
  const bn = RAMP.bone,
    dr = RAMP.drift;
  let widths = [],
    total = 0;
  for (const ch of word) {
    const w = GLYPHS[ch][0].length;
    widths.push(w);
    total += w + 1;
  }
  total -= 1;
  const g = makeGrid(total, 12);
  let ox = 0;
  word.split('').forEach((ch, gi) => {
    const rows = GLYPHS[ch];
    for (let y = 0; y < 12; y++) for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] !== '#') continue;
      let c;
      if (mono) c = bn[1];else if (y === 0) c = bn[0];else if (y < 8) c = bn[1];else if (y === 8) c = (x + y) % 2 === 0 ? bn[1] : dr[1];else if (y === 9) c = (x + y) % 2 === 0 ? dr[1] : dr[2];else if (y === 10) c = dr[2];else c = dr[3];
      // rising veins
      if (!mono && y >= 6 && y <= 8 && hash2(ox + x, y, 99) < 0.05) c = dr[2];
      P(g, ox + x, y, c);
    }
    ox += widths[gi] + 1;
  });
  return g;
}
// emblem (the stone iso-tile cradling a Drift mote) — 16×16 master
const EMBLEM_ROWS = ['.......kk.......', '......kCCk......', '.....kCccCk.....', '....kCc..cCk....', '...kCc.p..cCk...', '..kCc.pPp..cCk..', '.kCc..pPp...cCk.', 'kCc..pPPPp...cCk', '.kCc..pPp...cCk.', '..kCc.pPp..cCk..', '...kCc.p..cCk...', '....kCc..cCk....', '.....kCccCk.....', '......kCCk......', '.......kk.......', '................'];
function emblemGrid(mono) {
  const PALC = mono ? {
    k: '#0a0810',
    C: '#d8cfe0',
    c: '#a99fb8',
    P: '#efe9f4',
    p: '#d8cfe0'
  } : {
    k: '#0a0810',
    C: '#4a4360',
    c: '#322b46',
    P: '#f3e8ff',
    p: '#a855f7'
  };
  const g = makeGrid(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = EMBLEM_ROWS[y][x];
    if (ch !== '.' && PALC[ch]) P(g, x, y, PALC[ch]);
  }
  return g;
}
// lockups
function logoHorizontal(mono) {
  const g = makeGrid(512, 96);
  stamp(g, scaleGrid(emblemGrid(mono), 4), 4, 16);
  const wm = scaleGrid(wordmarkGrid(mono), 5); // 85*5=425 × 60
  stamp(g, wm, 80, 18);
  return g;
}
function logoStacked(mono) {
  const g = makeGrid(256, 220);
  stamp(g, scaleGrid(emblemGrid(mono), 6), 80, 12);
  const wm = scaleGrid(wordmarkGrid(mono), 3); // 255 × 36
  stamp(g, wm, 0, 132);
  if (!mono) {
    const dr = RAMP.drift;
    [[60, 190], [128, 198], [196, 188]].forEach((m, i) => {
      P(g, m[0], m[1], i === 1 ? dr[0] : dr[1]);
      P(g, m[0] + 1, m[1], dr[2]);
      P(g, m[0], m[1] + 1, dr[2]);
    });
  }
  return g;
}
Object.assign(globalThis, {
  makeMotes,
  makeEmbers,
  makeAsh,
  makeRingFrames,
  GLYPHS,
  scaleGrid,
  wordmarkGrid,
  emblemGrid,
  logoHorizontal,
  logoStacked
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/fxlogo.js", error: String((e && e.message) || e) }); }

// assets/_gen/nodes.js
try { (() => {
// DriftLands resource-node generators — eval after pixlib.js + tiles.js.
// tree 48×56 · rock 40×30 · fish ripple 40×20. Bottom-center anchored.

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx,
    dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

// ---- TREE (ashen oak) ----
function makeTree(depleted) {
  const g = makeGrid(48, 56);
  const gr = RAMP.grass,
    dr = RAMP.dirt;

  // trunk: base at (24,55), tapering up
  for (let y = 26; y <= 55; y++) {
    const w = y > 50 ? 6 : y > 44 ? 5 : 4;
    const x0 = 24 - (w >> 1);
    for (let x = x0; x < x0 + w; x++) {
      let c = dr[1];
      if (x === x0) c = dr[0];else if (x === x0 + w - 1) c = dr[3];else if (hash2(x, y, 11) < 0.15) c = dr[2];
      P(g, x, y, c);
    }
  }
  // root flares
  for (let k = 0; k < 3; k++) {
    P(g, 19 + k, 54 + (k > 1 ? 1 : 0), dr[2]);
    P(g, 28 - 0 + k, 55, dr[2]);
  }
  P(g, 18, 55, dr[3]);
  P(g, 30, 55, dr[3]);
  if (!depleted) {
    // full canopy: blob cluster
    const blobs = [[24, 16, 17, 12], [14, 22, 10, 8], [34, 21, 10, 8], [24, 27, 13, 7]];
    for (let y = 2; y <= 36; y++) for (let x = 2; x <= 46; x++) {
      if (!blobs.some(b => inEllipse(x, y, b[0], b[1], b[2], b[3]))) continue;
      const h = hash2(x, y, 21);
      if (h < 0.04) continue; // leaf holes
      let c = gr[1];
      const lit = inEllipse(x, y, 18, 11, 13, 8);
      const shad = y > 26 || inEllipse(x, y, 32, 26, 12, 7);
      if (lit && h < 0.7) c = h < 0.18 ? gr[0] : gr[1];
      if (lit && h >= 0.7 && h < 0.78) c = gr[0];
      if (shad) c = h < 0.5 ? gr[2] : gr[1];
      if (y > 30 && h < 0.5) c = gr[3];
      if (h > 0.965) c = RAMP.bone[2]; // ashen flecks
      P(g, x, y, c);
    }
    // branch peeking under canopy
    for (let k = 0; k < 4; k++) P(g, 26 + k, 30 - (k >> 1), dr[2]);
  } else {
    // near-depleted: bare branches + thin patchy canopy
    const branch = (x0, y0, dx, dy, n, c, thick) => {
      for (let k = 0; k < n; k++) {
        const x = x0 + Math.round(dx * k),
          y = y0 + Math.round(dy * k);
        P(g, x, y, c);
        if (thick) P(g, x + 1, y, RAMP.dirt[3]);
      }
    };
    branch(24, 27, -0.9, -0.7, 12, dr[2], true); // left limb
    branch(24, 27, 0.95, -0.55, 13, dr[1], true); // right limb
    branch(24, 28, 0.1, -1, 9, dr[2], true); // top limb
    branch(15, 19, -0.7, -0.8, 5, dr[3]);
    branch(33, 22, 0.8, -0.7, 5, dr[3]);
    branch(25, 20, 0.4, -0.9, 5, dr[3]);
    // leaf clusters (2 small)
    [[12, 13, 5, 4], [36, 16, 4, 3]].forEach(b => {
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

// ---- ROCK / ORE VEIN ----
function makeRock(depleted) {
  const g = makeGrid(40, 30);
  const st = RAMP.stone,
    gd = RAMP.gold;
  // boulder silhouette: two lumps
  for (let y = 4; y <= 29; y++) for (let x = 3; x <= 37; x++) {
    const inA = inEllipse(x, y, 17, 19, 13, 9);
    const inB = inEllipse(x, y, 27, 21, 9, 7);
    if (!inA && !inB) continue;
    if (y > 28) continue;
    let c = st[1];
    const h = hash2(x, y, 41);
    if (inEllipse(x, y, 13, 14, 9, 6)) c = h < 0.75 ? st[0] : st[1]; // top-lit
    if (y > 22) c = h < 0.7 ? st[2] : st[1];
    if (y > 26) c = st[3];
    if (inB && !inA && y <= 22) c = h < 0.5 ? st[1] : st[2];
    // facet lines
    if (h > 0.97) c = st[2];
    P(g, x, y, c);
  }
  if (!depleted) {
    // gold ore flecks
    const fl = [[12, 16], [20, 13], [26, 19], [16, 22], [30, 23]];
    fl.forEach((f, i) => {
      P(g, f[0], f[1], gd[1]);
      P(g, f[0] + 1, f[1], gd[2]);
      P(g, f[0], f[1] + 1, gd[2]);
      if (i % 2 === 0) P(g, f[0] + 1, f[1] - 1, gd[0]); // glint
    });
  } else {
    // cracks + spent flecks + rubble
    const crack = (x0, y0, pts) => {
      let x = x0,
        y = y0;
      pts.forEach(p => {
        x += p[0];
        y += p[1];
        P(g, x, y, st[3]);
        if (y < 18) P(g, x - 1, y, st[0]); // chip highlight on lit face
      });
    };
    crack(14, 10, [[1, 1], [0, 1], [1, 1], [1, 0], [0, 1], [1, 1], [0, 1], [-1, 1], [0, 1], [1, 1]]);
    crack(24, 12, [[1, 1], [1, 0], [0, 1], [1, 1], [0, 1], [1, 0], [0, 1]]);
    crack(10, 18, [[1, 0], [1, 1], [1, 0], [1, 1]]);
    P(g, 20, 17, gd[3]);
    P(g, 27, 21, gd[3]); // spent dull flecks
    // rubble at base
    [[4, 27], [7, 28], [33, 27], [36, 28], [30, 28]].forEach(r => {
      P(g, r[0], r[1], st[2]);
      P(g, r[0] + 1, r[1], st[3]);
      P(g, r[0], r[1] - 1, st[1]);
    });
  }
  outline(g);
  return g;
}

// ---- FISHING SPOT (ripple; sits ON water, no outline) ----
function ellipseRing(g, cx, cy, rx, ry, c, skip) {
  const n = Math.max(16, (rx + ry) * 3);
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2;
    const x = Math.round(cx + Math.cos(t) * rx);
    const y = Math.round(cy + Math.sin(t) * ry);
    if (skip && hash2(x, y, 51) < skip) continue;
    P(g, x, y, c);
  }
}
function makeFishFrames() {
  const wa = RAMP.water;
  const frames = [0, 1, 2, 3].map(f => {
    const g = makeGrid(40, 20);
    const r = 4 + f * 2.2;
    ellipseRing(g, 20, 10, r, r / 2, wa[0], f > 1 ? 0.3 : 0); // expanding ring
    if (f >= 1) ellipseRing(g, 20, 10, r - 4, (r - 4) / 2, wa[0], 0.45); // trailing ring
    if (f === 0) {
      P(g, 20, 10, RAMP.bone[1]);
      P(g, 21, 10, wa[0]);
    } // plip
    if (f === 3) ellipseRing(g, 20, 10, r, r / 2, wa[1], 0.5); // fading outer
    // tiny fish shadow under
    for (let k = 0; k < 4; k++) P(g, 18 + k, 12 + f % 2, wa[2]);
    return g;
  });
  // depleted: one faint ring
  const d = makeGrid(40, 20);
  ellipseRing(d, 20, 10, 5, 2.5, wa[2], 0.35);
  P(d, 20, 10, wa[2]);
  frames.push(d);
  return frames;
}
Object.assign(globalThis, {
  inEllipse,
  makeTree,
  makeRock,
  makeFishFrames,
  ellipseRing
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/nodes.js", error: String((e && e.message) || e) }); }

// assets/_gen/pixlib.js
try { (() => {
// DriftLands sprite generator library — evaled inside run_script.
// Pixel grids -> auto outline -> row-run-merged <rect> SVG (crispEdges).
// Deterministic RNG only; alpha used ONLY for the corruption overlay.

function makeGrid(w, h) {
  return {
    w,
    h,
    d: new Array(w * h).fill(null)
  };
}
function P(g, x, y, c, a) {
  x = x | 0;
  y = y | 0;
  if (x < 0 || y < 0 || x >= g.w || y >= g.h || !c) return;
  g.d[y * g.w + x] = a == null ? {
    c
  } : {
    c,
    a
  };
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
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
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
    const v = G(src, x, y);
    if (v) P(dst, ox + x, oy + y, v.c, v.a);
  }
}
function mirrorX(g) {
  const m = makeGrid(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v) P(m, g.w - 1 - x, y, v.c, v.a);
  }
  return m;
}
function gridRects(g, ox, oy) {
  ox = ox || 0;
  oy = oy || 0;
  const out = [];
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = G(g, x, y);
      if (!v) {
        x++;
        continue;
      }
      let x2 = x + 1;
      while (x2 < g.w) {
        const v2 = G(g, x2, y);
        if (!v2 || v2.c !== v.c || (v2.a == null ? 1 : v2.a) !== (v.a == null ? 1 : v.a)) break;
        x2++;
      }
      out.push({
        x: x + ox,
        y: y + oy,
        w: x2 - x,
        c: v.c,
        a: v.a
      });
      x = x2;
    }
  }
  return out;
}
function rectsToSvg(rects, w, h) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">' + rects.map(r => '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="1" fill="' + r.c + '"' + (r.a != null ? ' fill-opacity="' + r.a + '"' : '') + '/>').join('') + '</svg>';
}
function gridSvg(g) {
  return rectsToSvg(gridRects(g), g.w, g.h);
}
function sheetSvg(grids, cw, ch, cols) {
  const n = grids.length;
  cols = cols || n;
  const rows = Math.ceil(n / cols);
  let rects = [];
  grids.forEach((g, i) => {
    rects = rects.concat(gridRects(g, i % cols * cw, Math.floor(i / cols) * ch));
  });
  return rectsToSvg(rects, cols * cw, rows * ch);
}
function drawGrid(ctx, g, ox, oy, s) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (!v) continue;
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
    rows.push({
      x0: 32 - half,
      x1: 32 + half - 1
    });
  }
  return rows;
}
function inDiamond(rows, x, y) {
  if (y < 0 || y > 31) return false;
  return x >= rows[y].x0 && x <= rows[y].x1;
}
const RAMP = {
  grass: ['#7fae5e', '#4d7c4d', '#356037', '#20402a'],
  dirt: ['#7a6048', '#50402e', '#36291c', '#241a11'],
  stone: ['#4a4360', '#322b46', '#211c30', '#14101e'],
  water: ['#4a7fa0', '#2c5775', '#173a52', '#0d2336'],
  drift: ['#f3e8ff', '#d8b4fe', '#a855f7', '#6b21a8', '#3b1162'],
  ember: ['#fcd34d', '#f59e0b', '#b45309', '#7c3a06'],
  gold: ['#f6e0a6', '#e7c873', '#b8943f', '#7c5f23'],
  blood: ['#ef4444', '#dc2626', '#991b1b', '#5f1212'],
  bone: ['#efe9f4', '#d8cfe0', '#a99fb8', '#6f6781'],
  void: '#0a0810',
  ash: '#171320'
};
Object.assign(globalThis, {
  makeGrid,
  P,
  G,
  fillRect,
  mulberry,
  outline,
  stamp,
  mirrorX,
  gridRects,
  rectsToSvg,
  gridSvg,
  sheetSvg,
  drawGrid,
  diamondRows,
  inDiamond,
  RAMP
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/pixlib.js", error: String((e && e.message) || e) }); }

// assets/_gen/tiles.js
try { (() => {
// DriftLands tile generators — eval after pixlib.js.
// Tiles: 64×35 (32px diamond face + 3px south lip). Overlay: 64×32.

function hash2(x, y, s) {
  let h = x * 374761393 + y * 668265263 + (s || 0) * 2147483647 | 0;
  h = (h ^ h >> 13) * 1274126177 | 0;
  return ((h ^ h >> 16) >>> 0) / 4294967296;
}
function contourMaxY(rows, x) {
  for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) return y;
  return -1;
}
function makeBaseTile(type, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = RAMP[type];
  const face = ramp[1],
    hi = ramp[0],
    sh = ramp[2],
    dp = ramp[3];
  for (let y = 0; y < 32; y++) for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);

  // 3px south lip in the shadow step
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
  }
  // 1px void north edge (top contour)
  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      P(g, x, y, RAMP.void);
      break;
    }
  }

  // per-type face detail
  for (let y = 1; y < 31; y++) {
    for (let x = rows[y].x0 + 1; x <= rows[y].x1 - 1; x++) {
      const h = hash2(x, y, seedN);
      if (type === 'grass') {
        if (h < 0.055) {
          P(g, x, y, sh);
          if (hash2(x, y, seedN + 1) < 0.4) P(g, x, y - 1, sh);
        } else if (h < 0.075) P(g, x, y, hi);
      } else if (type === 'dirt') {
        if (h < 0.04) {
          P(g, x, y, sh);
          P(g, x + 1, y, dp);
        } else if (h < 0.05) P(g, x, y, hi);
      } else if (type === 'stone') {
        if (h < 0.03) {
          P(g, x, y, dp);
          P(g, x + 1, y, dp);
          P(g, x + 2, y, dp);
        } else if (h < 0.045) P(g, x, y, hi);
      } else if (type === 'water') {
        if (h < 0.05 && y > 18) P(g, x, y, sh); // deeper toward south
      }
    }
  }
  return g;
}

// 2px dither transition band into `other` along the SOUTH edges
function transitionVariant(type, other, seedN) {
  const g = makeBaseTile(type, seedN);
  const rows = diamondRows();
  const oc = RAMP[other][1];
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my < 0) continue;
    for (let k = 0; k <= 1; k++) {
      const y = my - k;
      if (y < 1 || !inDiamond(rows, x, y)) continue;
      if ((x + y) % 2 === 0 || k === 0 && hash2(x, y, 9) < 0.35) P(g, x, y, oc);
    }
  }
  return g;
}

// stone hard 1px void seam variant (full perimeter)
function stoneSeamVariant(seedN) {
  const g = makeBaseTile('stone', seedN);
  const rows = diamondRows();
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) P(g, x, my, RAMP.void);
  }
  return g;
}

// water shimmer frames: same base, speculars drift ±1px
function waterFrames(seedN) {
  const specs = [];
  const rnd = mulberry(seedN + 100);
  for (let i = 0; i < 7; i++) {
    specs.push({
      x: 12 + Math.floor(rnd() * 38),
      y: 6 + Math.floor(rnd() * 20),
      len: 2 + Math.floor(rnd() * 4)
    });
  }
  const DX = [0, 1, 0, -1],
    DY = [0, 0, 1, 0];
  const rows = diamondRows();
  return [0, 1, 2, 3].map(f => {
    const g = makeBaseTile('water', seedN);
    specs.forEach((s, i) => {
      if ((i + f) % 4 === 3) return; // one streak rests per frame
      const y = s.y + DY[(f + i) % 4];
      for (let k = 0; k < s.len; k++) {
        const x = s.x + DX[(f + i) % 4] + k;
        if (inDiamond(rows, x, y) && y > 1) P(g, x, y, RAMP.water[0]);
      }
    });
    return g;
  });
}

// water foam edge variant (2px light dither at perimeter)
function waterFoamVariant(seedN) {
  const g = makeBaseTile('water', seedN);
  const rows = diamondRows();
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    let ty = -1;
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) {
      ty = y;
      break;
    }
    [[ty + 1, 0], [ty + 2, 1], [my, 0], [my - 1, 1]].forEach(p => {
      const y = p[0];
      if (y < 1 || y > 31 || !inDiamond(rows, x, y)) return;
      if ((x + y) % 2 === 0 && hash2(x, y, 6) < 0.6) P(g, x, y, RAMP.water[0]);else if (hash2(x, y, 5) < 0.14) P(g, x, y, RAMP.bone[2]);
    });
  }
  return g;
}

// corruption overlay: 6 pulse frames, static dither pattern, stepped alpha
function corruptFrames() {
  const alphas = [0.18, 0.212, 0.244, 0.276, 0.308, 0.34];
  const rows = diamondRows();
  const motes = [];
  const rnd = mulberry(424242);
  for (let i = 0; i < 6; i++) {
    motes.push({
      x: 14 + Math.floor(rnd() * 36),
      y: 6 + Math.floor(rnd() * 20)
    });
  }
  return alphas.map((a, f) => {
    const g = makeGrid(64, 32);
    for (let y = 0; y < 32; y++) {
      for (let x = rows[y].x0; x <= rows[y].x1; x++) {
        const dist = Math.abs(x - 32) / 2 + Math.abs(y - 16); // diamond metric 0..16
        const density = Math.max(0, 1 - dist / 15);
        const h = hash2(x, y, 77);
        if ((x + y) % 2 === 0 && h < density * 0.95) P(g, x, y, RAMP.drift[2], a);else if (h < density * 0.22) P(g, x, y, RAMP.drift[3], a);
      }
    }
    motes.forEach((m, i) => {
      const ph = (i + f) % 6;
      if (ph < 3) {
        P(g, m.x, m.y, ph === 1 ? RAMP.drift[0] : RAMP.drift[1], 0.85);
        if (ph === 1) {
          P(g, m.x, m.y - 1, RAMP.drift[1], 0.5);
          P(g, m.x, m.y + 1, RAMP.drift[1], 0.5);
        }
      }
    });
    return g;
  });
}
Object.assign(globalThis, {
  hash2,
  contourMaxY,
  makeBaseTile,
  transitionVariant,
  stoneSeamVariant,
  waterFrames,
  waterFoamVariant,
  corruptFrames
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/_gen/tiles.js", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Badge
   Pixel chip for statuses, counts, rarity & the seasonal "Drift"
   marker. variant="season" is the ornate HUD season badge; the rest
   are compact inline tags. */

const TONES = {
  corrupt: {
    fg: 'var(--drift-core)',
    bg: 'var(--corrupt-32)',
    edge: 'var(--corrupt-55)'
  },
  gold: {
    fg: '#1a130a',
    bg: 'var(--drift-gold)',
    edge: 'var(--gold-hi)'
  },
  success: {
    fg: '#dff1df',
    bg: 'var(--moss-24)',
    edge: 'var(--drift-moss)'
  },
  warning: {
    fg: '#241a05',
    bg: 'var(--drift-ember)',
    edge: 'var(--ember-hi)'
  },
  danger: {
    fg: '#ffe7e7',
    bg: 'var(--blood-24)',
    edge: 'var(--drift-blood)'
  },
  neutral: {
    fg: 'var(--text-secondary)',
    bg: 'var(--surface-well)',
    edge: 'var(--bone-14)'
  }
};
function Badge({
  children,
  tone = 'corrupt',
  icon = null,
  className = '',
  style = {},
  ...rest
}) {
  const t = TONES[tone] || TONES.corrupt;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: `var(--weight-regular) var(--text-2xs)/1 var(--font-pixel)`,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: t.fg,
      background: t.bg,
      padding: '4px 8px',
      boxShadow: `0 0 0 1px ${t.edge}`,
      clipPath: 'polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))',
      ...style
    }
  }, rest), icon, children);
}

/* The HUD "season" badge — number + name, corruption-styled. */
function SeasonBadge({
  season = 3,
  name = 'Ashfall',
  driftPct = 42,
  className = '',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `drift-panel ${className}`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 12px 7px 8px',
      boxShadow: 'var(--frame-shadow)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 34,
      padding: '3px 6px',
      background: 'var(--corrupt-32)',
      boxShadow: '0 0 0 1px var(--corrupt-55)',
      clipPath: 'polygon(0 2px,2px 0,calc(100% - 2px) 0,100% 2px,100% calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,0 calc(100% - 2px))'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 8px/1 var(--font-pixel)',
      letterSpacing: '.1em',
      color: 'var(--bone-72)'
    }
  }, "S"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 17px/1 var(--font-display)',
      color: 'var(--drift-core)'
    }
  }, String(season).padStart(2, '0'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "drift-heading",
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-primary)',
      lineHeight: 1
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: '400 9px/1 var(--font-pixel)',
      letterSpacing: '.06em',
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      background: 'var(--drift-corrupt)',
      boxShadow: 'var(--glow-corrupt-sm)'
    }
  }), "Drift ", driftPct, "%")));
}
Object.assign(__ds_scope, { Badge, SeasonBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Button
   Pixel button: hard bevel + hard drop shadow that presses down on
   :active (chrome in styles.css → .drift-pixel-btn). Variants tie to
   the palette; React only sets the --btn-* vars + size + content. */

const VARIANTS = {
  primary: {
    '--btn-bg': 'var(--drift-corrupt-dim)',
    '--btn-bg-hi': 'var(--drift-corrupt)',
    '--btn-fg': '#f6efff',
    '--btn-edge': 'var(--drift-corrupt)'
  },
  gold: {
    '--btn-bg': 'var(--gold-lo)',
    '--btn-bg-hi': 'var(--drift-gold)',
    '--btn-fg': '#1a130a',
    '--btn-edge': 'var(--gold-hi)'
  },
  ghost: {
    '--btn-bg': 'var(--surface-frame)',
    '--btn-bg-hi': 'var(--ui-100)',
    '--btn-fg': 'var(--text-primary)',
    '--btn-edge': 'var(--corrupt-32)'
  },
  danger: {
    '--btn-bg': 'var(--blood-lo)',
    '--btn-bg-hi': 'var(--drift-blood)',
    '--btn-fg': '#fff',
    '--btn-edge': 'var(--blood-hi)'
  }
};
const SIZES = {
  sm: {
    minHeight: 32,
    padding: '6px 10px',
    fontSize: 'var(--text-xs)'
  },
  md: {
    minHeight: 40,
    padding: '9px 14px',
    fontSize: 'var(--text-sm)'
  },
  lg: {
    minHeight: 48,
    padding: '12px 18px',
    fontSize: 'var(--text-md)'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  className = '',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    className: `drift-pixel-btn ${className}`,
    style: {
      ...(VARIANTS[variant] || VARIANTS.primary),
      ...(SIZES[size] || SIZES.md),
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : undefined,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Panel
   The canonical pixel HUD frame: notched corners, hard bevel, a thin
   corruption-purple edge, semi-transparent fill, purple corner pips.
   Composes into every HUD surface (inventory, log, skills). */

function Panel({
  title,
  kicker,
  accessory,
  corners = true,
  glow = false,
  padded = true,
  as: Tag = 'section',
  className = '',
  style = {},
  children,
  ...rest
}) {
  const pip = pos => /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      width: 3,
      height: 3,
      background: 'var(--drift-corrupt)',
      boxShadow: '0 0 0 1px var(--corrupt-32)',
      ...pos,
      pointerEvents: 'none'
    }
  });
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `drift-panel ${className}`,
    style: {
      boxShadow: glow ? 'var(--frame-shadow), 0 0 0 3px var(--corrupt-16)' : 'var(--frame-shadow)',
      ...style
    }
  }, rest), corners && /*#__PURE__*/React.createElement(React.Fragment, null, pip({
    left: 2,
    top: 2
  }), pip({
    right: 2,
    top: 2
  }), pip({
    left: 2,
    bottom: 2
  }), pip({
    right: 2,
    bottom: 2
  })), (title || kicker || accessory) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      padding: padded ? '10px 14px 8px' : '10px 12px 8px',
      borderBottom: '1px solid var(--bone-14)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, kicker && /*#__PURE__*/React.createElement("span", {
    className: "drift-label",
    style: {
      color: 'var(--text-muted)'
    }
  }, kicker), title && /*#__PURE__*/React.createElement("span", {
    className: "drift-heading",
    style: {
      fontSize: 'var(--text-md)',
      color: 'var(--text-primary)'
    }
  }, title)), accessory), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: padded ? '12px 14px' : 0
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/game/ActivityLog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — ActivityLog
   The scrolling HUD feed: gathers, level-ups, loot, Drift events.
   Pass `entries` newest-first; each = { kind, text, meta }. kind tints
   the bullet + accent: loot/xp/info/warning/danger/drift. */

const KINDS = {
  xp: {
    dot: 'var(--drift-corrupt)',
    accent: 'var(--drift-corrupt)'
  },
  loot: {
    dot: 'var(--drift-gold)',
    accent: 'var(--drift-gold)'
  },
  info: {
    dot: 'var(--bone-45)',
    accent: 'var(--text-secondary)'
  },
  warning: {
    dot: 'var(--drift-ember)',
    accent: 'var(--drift-ember)'
  },
  danger: {
    dot: 'var(--drift-blood)',
    accent: 'var(--drift-blood)'
  },
  drift: {
    dot: 'var(--drift-core)',
    accent: 'var(--drift-hi)'
  }
};
function ActivityLog({
  entries = [],
  max = 6,
  className = '',
  style = {},
  ...rest
}) {
  const rows = entries.slice(0, max);
  return /*#__PURE__*/React.createElement("ul", _extends({
    className: className,
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, rest), rows.map((e, i) => {
    const k = KINDS[e.kind] || KINDS.info;
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        opacity: 1 - i * 0.085
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        flex: 'none',
        width: 5,
        height: 5,
        marginTop: 1,
        background: k.dot,
        boxShadow: e.kind === 'drift' || e.kind === 'xp' ? 'var(--glow-corrupt-sm)' : 'none'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: '400 13px/1.35 var(--font-ui)',
        color: 'var(--text-secondary)',
        textShadow: 'var(--text-shadow-hud)'
      }
    }, e.text, e.meta && /*#__PURE__*/React.createElement("span", {
      className: "drift-num",
      style: {
        color: k.accent,
        fontWeight: 600,
        marginLeft: 6
      }
    }, e.meta)));
  }));
}
Object.assign(__ds_scope, { ActivityLog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ActivityLog.jsx", error: String((e && e.message) || e) }); }

// components/game/Slot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Slot
   Inventory / hotbar cell. Pixel well with a hard inset bevel; a
   rarity edge, a stack count, an optional keybind cap, and the Drift
   selection glow. Pass `icon` as a node (e.g. <Icon name="axe" />). */

const RARITY = {
  common: 'var(--bone-14)',
  uncommon: 'var(--drift-moss)',
  rare: 'var(--water-hi)',
  epic: 'var(--drift-corrupt)',
  legendary: 'var(--drift-gold)'
};
function Slot({
  icon = null,
  count = null,
  keybind = null,
  rarity = null,
  selected = false,
  disabled = false,
  size = 52,
  onClick,
  title,
  className = '',
  style = {},
  ...rest
}) {
  const edge = rarity ? RARITY[rarity] : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: disabled ? undefined : onClick,
    title: title,
    className: className,
    style: {
      position: 'relative',
      width: size,
      height: size,
      padding: 0,
      border: 0,
      background: 'var(--surface-well)',
      cursor: disabled ? 'default' : 'pointer',
      imageRendering: 'pixelated',
      boxShadow: selected ? 'var(--bevel-slot), 0 0 0 1px var(--drift-core), 0 0 0 2px var(--drift-corrupt), 0 0 0 4px var(--corrupt-16)' : edge ? `var(--bevel-slot), inset 0 0 0 1px ${edge}` : 'var(--bevel-slot)',
      transition: 'box-shadow var(--dur-fast) steps(2)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, icon), keybind != null && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: 3,
      font: '400 9px/1 var(--font-pixel)',
      color: 'var(--bone-45)'
    }
  }, keybind), count != null && /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      position: 'absolute',
      right: 3,
      bottom: 2,
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      textShadow: 'var(--text-shadow-hud)'
    }
  }, count));
}
Object.assign(__ds_scope, { Slot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Slot.jsx", error: String((e && e.message) || e) }); }

// components/game/Hotbar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — Hotbar
   The 6-slot action bar (keys 1–6). Pass `slots` as an array of up to
   6 items ({ icon, count, rarity }); `selected` is the active index.
   Empty positions render as quiet wells. */

function Hotbar({
  slots = [],
  selected = 0,
  onSelect,
  size = 52,
  className = '',
  style = {},
  ...rest
}) {
  const cells = Array.from({
    length: 6
  }, (_, i) => slots[i] || null);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      display: 'flex',
      gap: 'var(--slot-gap)',
      ...style
    },
    role: "toolbar",
    "aria-label": "Hotbar"
  }, rest), cells.map((item, i) => /*#__PURE__*/React.createElement(__ds_scope.Slot, {
    key: i,
    size: size,
    keybind: i + 1,
    icon: item ? item.icon : null,
    count: item ? item.count : null,
    rarity: item ? item.rarity : null,
    selected: i === selected,
    title: item ? item.name : `Slot ${i + 1}`,
    onClick: () => onSelect && onSelect(i)
  })));
}
Object.assign(__ds_scope, { Hotbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Hotbar.jsx", error: String((e && e.message) || e) }); }

// components/game/XPBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DriftLands — XPBar
   A skill progress row: icon + name on the left, level chip on the
   right, a pixel track with a stepped corruption fill, and the
   value/next readout. `color` tints the fill per skill. */

function XPBar({
  skill = 'Woodcutting',
  level = 1,
  value = 0,
  max = 100,
  color = 'var(--drift-corrupt)',
  icon = null,
  showNumbers = true,
  className = '',
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, icon, /*#__PURE__*/React.createElement("span", {
    className: "drift-label",
    style: {
      color: 'var(--text-secondary)',
      flex: 1
    }
  }, skill), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      background: 'var(--surface-well)',
      boxShadow: 'var(--bevel-slot)',
      padding: '2px 6px',
      whiteSpace: 'nowrap'
    }
  }, "Lv ", level)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 'var(--xpbar-height)',
      background: 'var(--surface-well)',
      boxShadow: 'var(--bevel-slot)',
      overflow: 'hidden',
      imageRendering: 'pixelated'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${pct}%`,
      background: `linear-gradient(180deg, ${color} 0%, ${color} 55%, rgba(10,8,16,.25) 55%, rgba(10,8,16,.25) 100%)`,
      boxShadow: `0 0 0 1px rgba(10,8,16,.4), 0 0 6px ${color}`,
      transition: 'width var(--dur-slow) steps(8)'
    }
  })), showNumbers && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '10px',
      color: 'var(--text-muted)'
    }
  }, value.toLocaleString(), " / ", max.toLocaleString(), " XP"), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontSize: '10px',
      color
    }
  }, Math.round(pct), "%")));
}
Object.assign(__ds_scope, { XPBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/XPBar.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ============================================================
   DriftLands PIXEL ICONS
   Each icon is a 16×16 grid of chars; every char maps to a palette
   entry below and renders as one 1×1 <rect> with crisp edges. Tune
   pixels by editing the grids — keep the 'k' outline + 2–3 shade
   ramp per material so icons match sprites & tiles.
   ============================================================ */

const PAL = {
  '.': null,
  // transparent
  k: '#0a0810',
  // outline / void
  // bone / steel-light
  L: '#d8cfe0',
  o: '#a99fb8',
  h: '#efe9f4',
  // steel / stone
  S: '#9b94ab',
  C: '#4a4360',
  s: '#6f6781',
  z: '#3a3350',
  c: '#322b46',
  // wood
  W: '#7a6048',
  w: '#50402e',
  x: '#36291c',
  // gold
  G: '#f6e0a6',
  g: '#e7c873',
  y: '#b8943f',
  // ember
  E: '#fcd34d',
  e: '#f59e0b',
  // drift purple
  P: '#f3e8ff',
  p: '#a855f7',
  u: '#6b21a8',
  v: '#3b1162',
  // blood
  R: '#ef4444',
  r: '#dc2626',
  // moss / leaf
  M: '#7fae5e',
  m: '#4d7c4d',
  n: '#356037',
  // water / fish
  B: '#4a7fa0',
  b: '#2c5775'
};
const GRID = 16;
const ICONS = {
  /* ---------------- 6 TOOLS ---------------- */
  axe: ['................', '......kkkkkk....', '.....kSShhhSzk..', '....kSSSSSShSzk.', '....kSSSSSSSSzk.', '....kzSSSSSSzk..', '.....kkzSSzkk...', '......kwwk......', '......kWwk......', '......kwWk......', '......kWwk......', '......kwWk......', '......kWwk......', '......kwWkk.....', '.......kkk......', '................'],
  pickaxe: ['................', '..kk........kk..', '.kssk......kssk.', 'kSsszk....kzssSk', 'kSsszkk..kkzssSk', '.kzsssk..ksssszk', '..kkzsssssszkk..', '.....kkwwkk.....', '......kWwk......', '......kwWk......', '......kxwk......', '......kWwk......', '......kwxk......', '......kWwk......', '......kxwkk.....', '.......kk.......'],
  rod: ['............kkk.', '...........kWWk.', '..........kWzk..', '.........kWzk...', '........kWzk....', '.......kWzk.....', '......kWzk..k...', '.....kWzk...k...', '....kWzk....k...', '...kWzk.....k...', '..kWzk....kBBk..', '..kWk.....kPBk..', '.kWk......kbbk..', '.kk........kk...', '................', '................'],
  sword: ['.......k........', '......kLk.......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '......kzLk......', '.....kzzLLk.....', '...kkkkkkkkkk...', '...kygggggyk...', '....kkkwwkk.....', '......kwwk......', '......kwwk......', '.....kgGGgk.....', '......kkkk......'],
  ward: ['...kkkkkkkkk....', '..kCsssssssCk...', '..kCsuuuuusCk...', '..kCsuPPpusCk...', '..kCsupPpusCk...', '..kCsuppppsCk...', '..kCsssssssCk...', '..kCsssssssCk...', '...kCsssssCk....', '...kCsssssCk....', '....kCsssCk.....', '....kCsssCk.....', '.....kCsCk......', '.....kCsCk......', '......kkk.......', '................'],
  sigil: ['......kkkk......', '....kkuuuukk....', '...kuppppppuk...', '..kupppPppppuk..', '..kuppPPPpppuk..', '.kuppPPpPPpppuk.', '.kupppPPPppppuk.', '.kuppPPpPPpppuk.', '..kpppPPPpppuk..', '..kupppPppppuk..', '...kuppppppuk...', '....kkuuuukk....', '......kkkk......', '................', '................', '................'],
  /* ---------------- RESOURCES ---------------- */
  log: ['................', '...kkkkkkkkk....', '..kWWWWWWWWWk...', '.kWWxoxWWWWWk...', '.kWxoxoxWWWWk...', '.kWWxoxWWWWWk...', '..kWWWWWWWWWk...', '...kkkkkkkkk....', '...kkkkkkkkk....', '..kwwwwwwwwwk...', '.kwwxoxwwwwwk...', '.kwxoxoxwwwwk...', '.kwwxoxwwwwwk...', '..kwwwwwwwwwk...', '...kkkkkkkkk....', '................'],
  ore: ['................', '......kkkk......', '....kkCCCCkk....', '...kCCsssCCk....', '..kCsgssssgCk...', '..kCsssgsssCk...', '.kcsgssssgsck...', '.kcssgsssscck...', '..kcssgsssck....', '..kccssssgck....', '...kccsssck.....', '....kcccck......', '.....kkkk.......', '................', '................', '................'],
  fish: ['................', '................', '....kkkk....kk..', '..kkBBBBkk.kBk..', '.kBBBBBBBBkBBk..', 'kBBbbkBBBBBBBk..', 'kBkLBBBBBBBBBk..', 'kBBbbkBBBBBBk...', '.kBBBBBBBBkBBk..', '..kkBBBBkk.kBk..', '....kkkk....kk..', '................', '................', '................', '................', '................'],
  coin: ['................', '.....kkkkk......', '...kkgggggkk....', '..kgGGGGGGgk....', '..kgGyppyGgk....', '.kgGyppppyGgk...', '.kgGyppPppyGk...', '.kgGyppppyGgk...', '..kgGyppyGgk....', '..kgGGGGGGgk....', '...kkgggggkk....', '.....kkkkk......', '................', '................', '................', '................'],
  drift: ['................', '.......k........', '......kPk.......', '......kPk.......', '.....kpPpk......', '....kppPppk.....', '.kk.kppPppk.kk..', 'kPppppPPPpppPk..', '.kk.kppPppk.kk..', '....kppPppk.....', '.....kpPpk......', '......kPk.......', '......kPk.......', '.......k........', '................', '................'],
  /* ---------------- HUD ---------------- */
  heart: ['................', '..kkk....kkk....', '.kRRRkk.kRRRk...', 'kRRRRRkkRRRRRk..', 'kRRRRRRRRRRRRk..', 'kRRRRRRRRRRRRk..', 'kRRRRRRRRRRRRk..', '.kRRRRRRRRRRk...', '..kRRRRRRRRk....', '...kRRRRRRk.....', '....kRRRRk......', '.....kRRk.......', '......kk........', '................', '................', '................'],
  leaf: ['................', '.............kk.', '..........kkMMk.', '........kkMMMnk.', '......kkMMMMnk..', '.....kMMMMMnk...', '....kMMMMnnk....', '...kMMMnnk......', '..kMMnnk.k......', '..kMnnk.kn......', '.kMnnk.kn.......', '.knnk.kn........', '.kkk.kn.........', '....kn..........', '...kk...........', '................'],
  bag: ['................', '.....kkkk.......', '....kk..kk......', '....k....k......', '...kkkkkkkk.....', '..kWwwwwwwWk....', '..kwwwwwwwwk....', '..kwwwggwwwk....', '..kwwwggwwwk....', '..kwwwwwwwwk....', '..kwwwwwwwwk....', '...kwwwwwwk.....', '....kkkkkk......', '................', '................', '................'],
  bolt: ['................', '........kk......', '.......kEk......', '......kEek......', '.....kEek.......', '....kEek........', '...kEekkk.......', '..kEeEEEk.......', '..kkkkEek.......', '.....kEek.......', '....kEek........', '...kEek.........', '..kEek..........', '..kek...........', '..kk............', '................'],
  chevronRight: ['................', '.....k..........', '.....kk.........', '.....kLk........', '......kLk.......', '.......kLk......', '........kLk.....', '........kLk.....', '.......kLk......', '......kLk.......', '.....kLk........', '.....kk.........', '.....k..........', '................', '................', '................'],
  x: ['................', '..kk......kk....', '..kLk....kLk....', '...kLk..kLk.....', '....kLkkLk......', '.....kLLk.......', '.....kLLk.......', '....kLkkLk......', '...kLk..kLk.....', '..kLk....kLk....', '..kk......kk....', '................', '................', '................', '................', '................']
};
const ICON_NAMES = Object.keys(ICONS);
const TOOL_NAMES = ['axe', 'pickaxe', 'rod', 'sword', 'ward', 'sigil'];
function Icon({
  name,
  size = 32,
  glow = false,
  style = {},
  className = '',
  ...rest
}) {
  const grid = ICONS[name] || [];
  const rects = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const fill = PAL[row[x]];
      if (fill) rects.push(/*#__PURE__*/React.createElement("rect", {
        key: `${x}-${y}`,
        x: x,
        y: y,
        width: 1,
        height: 1,
        fill: fill
      }));
    }
  }
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: `0 0 ${GRID} ${GRID}`,
    shapeRendering: "crispEdges",
    className: className,
    style: {
      display: 'block',
      flex: 'none',
      imageRendering: 'pixelated',
      filter: glow ? 'drop-shadow(0 0 0.5px #a855f7) drop-shadow(0 0 2px rgba(168,85,247,0.8))' : undefined,
      ...style
    },
    "aria-hidden": "true"
  }, rest), rects);
}
Object.assign(__ds_scope, { ICON_NAMES, TOOL_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hud/Hud.jsx
try { (() => {
/* DriftLands UI kit — the HUD overlay.
   Composes the design-system components (Panel, Hotbar, XPBar, Slot,
   ActivityLog, SeasonBadge, Button, Icon) into the full in-game HUD,
   sitting over the canvas world. Light interactivity: pick a tool,
   gather → XP + loot + log. */

const NS = window.DriftLandsDesignSystem_3de3e2 || window[Object.keys(window).find(k => k.startsWith('DriftLandsDesignSystem'))];
const {
  Panel,
  Button,
  Badge,
  SeasonBadge,
  Slot,
  Hotbar,
  XPBar,
  ActivityLog,
  Icon
} = NS;
const TOOLS = [{
  name: 'Axe',
  icon: 'axe',
  skill: 'Woodcutting',
  loot: 'Ashen log',
  lootIcon: 'log',
  xp: 128
}, {
  name: 'Pickaxe',
  icon: 'pickaxe',
  skill: 'Mining',
  loot: 'Drift ore',
  lootIcon: 'ore',
  xp: 96
}, {
  name: 'Rod',
  icon: 'rod',
  skill: 'Fishing',
  loot: 'Pale carp',
  lootIcon: 'fish',
  xp: 74
}, {
  name: 'Sword',
  icon: 'sword',
  skill: null
}, {
  name: 'Ward',
  icon: 'ward',
  skill: null
}, {
  name: 'Sigil',
  icon: 'sigil',
  skill: null,
  rarity: 'epic'
}];
const SKILL_COLOR = {
  Woodcutting: 'var(--skill-woodcutting)',
  Mining: 'var(--skill-mining)',
  Fishing: 'var(--skill-fishing)'
};
const SKILL_ICON = {
  Woodcutting: 'axe',
  Mining: 'pickaxe',
  Fishing: 'rod'
};
function Vitals({
  hearts,
  shards
}) {
  return /*#__PURE__*/React.createElement(Panel, {
    padded: false,
    corners: false,
    style: {
      padding: '8px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement(Icon, {
    key: i,
    name: "heart",
    size: 16,
    style: {
      opacity: i < hearts ? 1 : 0.18
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coin",
    size: 16,
    glow: true
  }), /*#__PURE__*/React.createElement("span", {
    className: "drift-num",
    style: {
      fontWeight: 700,
      fontSize: 15,
      color: 'var(--drift-gold)',
      textShadow: 'var(--text-shadow-hud)'
    }
  }, shards.toLocaleString()))));
}
function HUD() {
  const [sel, setSel] = React.useState(0);
  const [xp, setXp] = React.useState({
    Woodcutting: {
      level: 42,
      value: 6280,
      max: 9000
    },
    Mining: {
      level: 31,
      value: 3400,
      max: 7200
    },
    Fishing: {
      level: 28,
      value: 5100,
      max: 6400
    }
  });
  const [shards, setShards] = React.useState(1284);
  const [log, setLog] = React.useState([{
    kind: 'drift',
    text: 'The Drift crept into Hollowmere.'
  }, {
    kind: 'info',
    text: 'A rock vein re-formed nearby.'
  }, {
    kind: 'loot',
    text: 'Ashen log',
    meta: 'x2'
  }]);
  const [bag, setBag] = React.useState([{
    icon: 'log',
    count: 64,
    rarity: 'common'
  }, {
    icon: 'ore',
    count: 18,
    rarity: 'rare'
  }, {
    icon: 'fish',
    count: 7,
    rarity: 'uncommon'
  }, {
    icon: 'coin',
    count: '1.2k',
    rarity: 'legendary'
  }]);
  const [progress, setProgress] = React.useState(null); // 0..1 while gathering
  const [floaters, setFloaters] = React.useState([]);
  const timer = React.useRef(null);
  const tool = TOOLS[sel];
  const canGather = !!tool.skill && progress === null;
  function gather() {
    if (!canGather) return;
    let p = 0;
    setProgress(0);
    timer.current = setInterval(() => {
      p += 0.04;
      if (p >= 1) {
        clearInterval(timer.current);
        setProgress(null);
        // rewards
        const t = TOOLS[sel];
        setXp(prev => {
          const s = {
            ...prev[t.skill]
          };
          s.value = Math.min(s.max, s.value + t.xp);
          if (s.value >= s.max) {
            s.level += 1;
            s.value = s.value - s.max;
          }
          return {
            ...prev,
            [t.skill]: s
          };
        });
        setShards(v => v + 12);
        const fid = Date.now();
        setFloaters(f => [...f, {
          id: fid,
          text: `+${t.xp} XP`,
          kind: 'xp'
        }, {
          id: fid + 1,
          text: '+12',
          kind: 'gold'
        }]);
        setTimeout(() => setFloaters(f => f.filter(x => x.id !== fid && x.id !== fid + 1)), 1100);
        setLog(l => [{
          kind: 'xp',
          text: t.skill,
          meta: `+${t.xp} XP`
        }, {
          kind: 'loot',
          text: t.loot,
          meta: 'x1'
        }, ...l].slice(0, 7));
        setBag(b => {
          const idx = b.findIndex(x => x.icon === t.lootIcon);
          if (idx >= 0) {
            const n = [...b];
            n[idx] = {
              ...n[idx],
              count: (parseInt(n[idx].count) || 0) + 1
            };
            return n;
          }
          return [...b, {
            icon: t.lootIcon,
            count: 1,
            rarity: 'common'
          }];
        });
      } else setProgress(p);
    }, 60);
  }
  React.useEffect(() => () => clearInterval(timer.current), []);
  const bagSlots = Array.from({
    length: 12
  }, (_, i) => bag[i] || null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        .hud-region { position: absolute; pointer-events: auto; }
        @keyframes floatUp { 0% { transform: translate(-50%,0); opacity: 1; } 100% { transform: translate(-50%,-46px); opacity: 0; } }
        .floater { position:absolute; left:50%; bottom:64px; transform:translateX(-50%); animation: floatUp 1.1s steps(10) forwards;
          font-family: var(--font-num); font-weight:700; font-size:16px; text-shadow: var(--text-shadow-hud); }
      `), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      top: 16,
      left: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(SeasonBadge, {
    season: 3,
    name: "Ashfall",
    driftPct: 42
  }), /*#__PURE__*/React.createElement(Vitals, {
    hearts: 4,
    shards: shards
  })), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      top: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Satchel",
    title: "Inventory",
    style: {
      width: 232
    },
    accessory: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, bag.length, "/24")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 'var(--slot-gap)'
    }
  }, bagSlots.map((it, i) => /*#__PURE__*/React.createElement(Slot, {
    key: i,
    size: 48,
    icon: it ? /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 30
    }) : null,
    count: it ? it.count : null,
    rarity: it ? it.rarity : null
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      left: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Skills",
    title: "Gathering",
    style: {
      width: 264
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13
    }
  }, ['Woodcutting', 'Mining', 'Fishing'].map(s => /*#__PURE__*/React.createElement(XPBar, {
    key: s,
    skill: s,
    level: xp[s].level,
    value: xp[s].value,
    max: xp[s].max,
    color: SKILL_COLOR[s],
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: SKILL_ICON[s],
      size: 16
    })
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    kicker: "Realm",
    title: "Activity",
    style: {
      width: 248
    }
  }, /*#__PURE__*/React.createElement(ActivityLog, {
    entries: log,
    max: 7
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 'calc(50% + 36px)',
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none'
    }
  }, progress !== null && /*#__PURE__*/React.createElement("svg", {
    width: "64",
    height: "64",
    viewBox: "0 0 64 64",
    style: {
      filter: 'drop-shadow(0 0 4px rgba(168,85,247,.8))'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "26",
    fill: "none",
    stroke: "rgba(10,8,16,.7)",
    strokeWidth: "6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "32",
    cy: "32",
    r: "26",
    fill: "none",
    stroke: "#a855f7",
    strokeWidth: "6",
    strokeDasharray: 2 * Math.PI * 26,
    strokeDashoffset: (1 - progress) * 2 * Math.PI * 26,
    transform: "rotate(-90 32 32)",
    strokeLinecap: "butt"
  })), floaters.map((f, i) => /*#__PURE__*/React.createElement("span", {
    key: f.id,
    className: "floater",
    style: {
      color: f.kind === 'gold' ? 'var(--drift-gold)' : 'var(--drift-corrupt)',
      left: `calc(50% + ${i % 2 ? 22 : -22}px)`
    }
  }, f.text))), /*#__PURE__*/React.createElement("div", {
    className: "hud-region",
    style: {
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: canGather ? 'primary' : 'ghost',
    size: "md",
    onClick: gather,
    disabled: !canGather,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: tool.icon,
      size: 16
    })
  }, progress !== null ? 'Gathering…' : tool.skill ? `${tool.skill}` : `${tool.name} equipped`), /*#__PURE__*/React.createElement(Hotbar, {
    selected: sel,
    onSelect: setSel,
    slots: TOOLS.map(t => ({
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: t.icon,
        size: 32
      }),
      name: t.name,
      rarity: t.rarity
    }))
  })));
}
window.HUD = HUD;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hud/Hud.jsx", error: String((e && e.message) || e) }); }

// ui_kits/hud/Scene.jsx
try { (() => {
/* DriftLands UI kit — representative isometric world backdrop.
   NOT part of the design system: the real world is Canvas sprites
   handled by the engine. This is a stand-in so the HUD can be shown
   reading over a busy, moving scene. Iso 2:1, tiles 64×32. */

function IsoScene({
  driftPct = 42
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    let raf,
      t = 0;
    const TW = 64,
      TH = 32; // tile diamond
    const COLS = 16,
      ROWS = 16;
    const PAL = {
      grass: ['#4d7c4d', '#356037', '#20402a'],
      dirt: ['#50402e', '#36291c', '#241a11'],
      stone: ['#322b46', '#211c30', '#14101e'],
      water: ['#2c5775', '#173a52', '#0d2336'],
      drift: ['#a855f7', '#6b21a8', '#3b1162']
    };
    // deterministic terrain map
    const map = [];
    for (let gy = 0; gy < ROWS; gy++) {
      const r = [];
      for (let gx = 0; gx < COLS; gx++) {
        const n = Math.sin(gx * 1.7) + Math.cos(gy * 1.3) + Math.sin((gx + gy) * 0.6);
        let type = 'grass';
        if (n < -1.3) type = 'water';else if (n < -0.5) type = 'dirt';else if (n > 1.4) type = 'stone';
        r.push({
          type,
          corrupt: gx + gy > (COLS + ROWS) * (1 - driftPct / 100) && Math.sin(gx * 2.1 + gy) > -0.2
        });
      }
      map.push(r);
    }
    // objects: trees/rocks at a few tiles
    const objs = [{
      gx: 3,
      gy: 5,
      kind: 'tree'
    }, {
      gx: 6,
      gy: 3,
      kind: 'tree'
    }, {
      gx: 10,
      gy: 6,
      kind: 'tree'
    }, {
      gx: 12,
      gy: 9,
      kind: 'rock'
    }, {
      gx: 4,
      gy: 10,
      kind: 'rock'
    }, {
      gx: 8,
      gy: 8,
      kind: 'player'
    }];
    function resize() {
      const r = cv.getBoundingClientRect();
      cv.width = r.width;
      cv.height = r.height;
    }
    resize();
    window.addEventListener('resize', resize);
    function isoX(gx, gy, ox) {
      return ox + (gx - gy) * (TW / 2);
    }
    function isoY(gx, gy, oy) {
      return oy + (gx + gy) * (TH / 2);
    }
    function diamond(cx, cy, fill, edge) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - TH / 2);
      ctx.lineTo(cx + TW / 2, cy);
      ctx.lineTo(cx, cy + TH / 2);
      ctx.lineTo(cx - TW / 2, cy);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (edge) {
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    function draw() {
      const W = cv.width,
        H = cv.height;
      // sky / void wash
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(0, 0, W, H);
      const ox = W / 2,
        oy = H / 2 - (COLS + ROWS) * TH / 4 + 40;

      // ground
      for (let gy = 0; gy < ROWS; gy++) {
        for (let gx = 0; gx < COLS; gx++) {
          const cell = map[gy][gx];
          const cx = isoX(gx, gy, ox),
            cy = isoY(gx, gy, oy);
          const ramp = PAL[cell.type];
          diamond(cx, cy, ramp[0], 'rgba(10,8,16,0.35)');
          // south shading lip
          ctx.fillStyle = ramp[1];
          ctx.beginPath();
          ctx.moveTo(cx - TW / 2, cy);
          ctx.lineTo(cx, cy + TH / 2);
          ctx.lineTo(cx, cy + TH / 2 + 3);
          ctx.lineTo(cx - TW / 2, cy + 3);
          ctx.closePath();
          ctx.fill();
          if (cell.type === 'water') {
            // shimmer
            const sh = (Math.sin(t / 22 + gx + gy) + 1) / 2;
            ctx.fillStyle = `rgba(120,180,210,${0.06 + sh * 0.10})`;
            diamond(cx, cy - 1, ctx.fillStyle, null);
          }
          if (cell.corrupt) {
            const pulse = 0.18 + (Math.sin(t / 30 + gx - gy) + 1) / 2 * 0.16;
            ctx.fillStyle = `rgba(168,85,247,${pulse})`;
            diamond(cx, cy, ctx.fillStyle, null);
          }
        }
      }

      // objects (depth sorted by gx+gy)
      [...objs].sort((a, b) => a.gx + a.gy - (b.gx + b.gy)).forEach(o => {
        const cx = isoX(o.gx, o.gy, ox),
          cy = isoY(o.gx, o.gy, oy);
        if (o.kind === 'tree') {
          ctx.fillStyle = '#241a11';
          ctx.fillRect(cx - 3, cy - 14, 6, 16); // trunk
          ctx.fillStyle = '#36291c';
          ctx.fillRect(cx - 1, cy - 14, 2, 16);
          ctx.fillStyle = '#356037';
          ctx.fillRect(cx - 12, cy - 40, 24, 28); // canopy
          ctx.fillStyle = '#4d7c4d';
          ctx.fillRect(cx - 12, cy - 40, 18, 22);
          ctx.fillStyle = '#7fae5e';
          ctx.fillRect(cx - 10, cy - 38, 8, 8);
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 12, cy - 41, 24, 1);
        } else if (o.kind === 'rock') {
          ctx.fillStyle = '#211c30';
          ctx.fillRect(cx - 12, cy - 14, 24, 14);
          ctx.fillStyle = '#322b46';
          ctx.fillRect(cx - 12, cy - 14, 18, 10);
          ctx.fillStyle = '#4a4360';
          ctx.fillRect(cx - 10, cy - 12, 6, 4);
          ctx.fillStyle = '#e7c873';
          ctx.fillRect(cx - 2, cy - 8, 3, 3); // ore fleck
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 12, cy - 15, 24, 1);
        } else if (o.kind === 'player') {
          // hooded wanderer
          ctx.fillStyle = '#0a0810';
          ctx.fillRect(cx - 7, cy - 30, 14, 30);
          ctx.fillStyle = '#2a2438';
          ctx.fillRect(cx - 6, cy - 28, 12, 26); // cloak
          ctx.fillStyle = '#171320';
          ctx.fillRect(cx - 5, cy - 22, 10, 5); // hood shadow
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(cx - 3, cy - 21, 2, 2); // drift eyes
          ctx.fillStyle = '#d8b4fe';
          ctx.fillRect(cx + 1, cy - 21, 2, 2);
          ctx.fillStyle = '#6b21a8';
          ctx.fillRect(cx - 6, cy - 6, 12, 2); // drift hem glow
        }
      });

      // ambient drift motes + ash
      for (let i = 0; i < 26; i++) {
        const mx = (i * 97 + t * (0.3 + i % 3 * 0.2)) % W;
        const my = (i * 53 + Math.sin(t / 40 + i) * 18 + t * 0.15) % H;
        const drift = i % 4 === 0;
        ctx.fillStyle = drift ? 'rgba(168,85,247,0.8)' : 'rgba(216,207,224,0.25)';
        ctx.fillRect(W - mx, my, drift ? 2 : 1, drift ? 2 : 1);
      }
      t += 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [driftPct]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    className: "drift-pixel",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      imageRendering: 'pixelated'
    }
  });
}
window.IsoScene = IsoScene;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/hud/Scene.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.SeasonBadge = __ds_scope.SeasonBadge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.ActivityLog = __ds_scope.ActivityLog;

__ds_ns.Hotbar = __ds_scope.Hotbar;

__ds_ns.Slot = __ds_scope.Slot;

__ds_ns.XPBar = __ds_scope.XPBar;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.TOOL_NAMES = __ds_scope.TOOL_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

})();
