// DriftLands resource-node generators — eval after pixlib.js + tiles.js.
// tree 48×56 · rock 40×30 · fish ripple 40×20. Bottom-center anchored.

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx, dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

// ---- TREE (ashen oak) ----
function makeTree(depleted) {
  const g = makeGrid(48, 56);
  const gr = RAMP.grass, dr = RAMP.dirt;

  // trunk: base at (24,55), tapering up
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
  // root flares
  for (let k = 0; k < 3; k++) { P(g, 19 + k, 54 + (k > 1 ? 1 : 0), dr[2]); P(g, 28 - 0 + k, 55, dr[2]); }
  P(g, 18, 55, dr[3]); P(g, 30, 55, dr[3]);

  if (!depleted) {
    // full canopy: blob cluster
    const blobs = [
      [24, 16, 17, 12], [14, 22, 10, 8], [34, 21, 10, 8], [24, 27, 13, 7],
    ];
    for (let y = 2; y <= 36; y++) for (let x = 2; x <= 46; x++) {
      if (!blobs.some(b => inEllipse(x, y, b[0], b[1], b[2], b[3]))) continue;
      const h = hash2(x, y, 21);
      if (h < 0.04) continue; // leaf holes
      let c = gr[1];
      const lit = inEllipse(x, y, 18, 11, 13, 8);
      const shad = y > 26 || inEllipse(x, y, 32, 26, 12, 7);
      if (lit && h < 0.7) c = (h < 0.18 ? gr[0] : gr[1]);
      if (lit && h >= 0.7 && h < 0.78) c = gr[0];
      if (shad) c = (h < 0.5 ? gr[2] : gr[1]);
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
        const x = x0 + Math.round(dx * k), y = y0 + Math.round(dy * k);
        P(g, x, y, c);
        if (thick) P(g, x + 1, y, RAMP.dirt[3]);
      }
    };
    branch(24, 27, -0.9, -0.7, 12, dr[2], true);   // left limb
    branch(24, 27, 0.95, -0.55, 13, dr[1], true);  // right limb
    branch(24, 28, 0.1, -1, 9, dr[2], true);       // top limb
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
  const st = RAMP.stone, gd = RAMP.gold;
  // boulder silhouette: two lumps
  for (let y = 4; y <= 29; y++) for (let x = 3; x <= 37; x++) {
    const inA = inEllipse(x, y, 17, 19, 13, 9);
    const inB = inEllipse(x, y, 27, 21, 9, 7);
    if (!inA && !inB) continue;
    if (y > 28) continue;
    let c = st[1];
    const h = hash2(x, y, 41);
    if (inEllipse(x, y, 13, 14, 9, 6)) c = h < 0.75 ? st[0] : st[1];   // top-lit
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
      P(g, f[0], f[1], gd[1]); P(g, f[0] + 1, f[1], gd[2]);
      P(g, f[0], f[1] + 1, gd[2]);
      if (i % 2 === 0) P(g, f[0] + 1, f[1] - 1, gd[0]); // glint
    });
  } else {
    // cracks + spent flecks + rubble
    const crack = (x0, y0, pts) => {
      let x = x0, y = y0;
      pts.forEach(p => {
        x += p[0]; y += p[1];
        P(g, x, y, st[3]);
        if (y < 18) P(g, x - 1, y, st[0]); // chip highlight on lit face
      });
    };
    crack(14, 10, [[1,1],[0,1],[1,1],[1,0],[0,1],[1,1],[0,1],[-1,1],[0,1],[1,1]]);
    crack(24, 12, [[1,1],[1,0],[0,1],[1,1],[0,1],[1,0],[0,1]]);
    crack(10, 18, [[1,0],[1,1],[1,0],[1,1]]);
    P(g, 20, 17, gd[3]); P(g, 27, 21, gd[3]); // spent dull flecks
    // rubble at base
    [[4, 27], [7, 28], [33, 27], [36, 28], [30, 28]].forEach(r => {
      P(g, r[0], r[1], st[2]); P(g, r[0] + 1, r[1], st[3]); P(g, r[0], r[1] - 1, st[1]);
    });
  }
  outline(g);
  return g;
}

// ---- FISHING SPOT (ripple; sits ON water, no outline) ----
function ellipseRing(g, cx, cy, rx, ry, c, skip) {
  const n = Math.max(16, (rx + ry) * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
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
    ellipseRing(g, 20, 10, r, r / 2, wa[0], f > 1 ? 0.3 : 0);   // expanding ring
    if (f >= 1) ellipseRing(g, 20, 10, r - 4, (r - 4) / 2, wa[0], 0.45); // trailing ring
    if (f === 0) { P(g, 20, 10, RAMP.bone[1]); P(g, 21, 10, wa[0]); }   // plip
    if (f === 3) ellipseRing(g, 20, 10, r, r / 2, wa[1], 0.5);          // fading outer
    // tiny fish shadow under
    for (let k = 0; k < 4; k++) P(g, 18 + k, 12 + (f % 2), wa[2]);
    return g;
  });
  // depleted: one faint ring
  const d = makeGrid(40, 20);
  ellipseRing(d, 20, 10, 5, 2.5, wa[2], 0.35);
  P(d, 20, 10, wa[2]);
  frames.push(d);
  return frames;
}

Object.assign(globalThis, { inEllipse, makeTree, makeRock, makeFishFrames, ellipseRing });
