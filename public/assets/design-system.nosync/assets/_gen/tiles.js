// Naevyr tile generators — eval after pixlib.js.
// Tiles: 64×35 (32px diamond face + 3px south lip). Overlay: 64×32.

function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
  h = (h ^ (h >> 13)) * 1274126177 | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function contourMaxY(rows, x) {
  for (let y = 31; y >= 0; y--) if (inDiamond(rows, x, y)) return y;
  return -1;
}

function makeBaseTile(type, seedN) {
  const g = makeGrid(64, 36);
  const rows = diamondRows();
  const ramp = RAMP[type];
  const face = ramp[1], hi = ramp[0], sh = ramp[2], dp = ramp[3];

  for (let y = 0; y < 32; y++)
    for (let x = rows[y].x0; x <= rows[y].x1; x++) P(g, x, y, face);

  // 3px south lip in the shadow step
  for (let x = 0; x < 64; x++) {
    const my = contourMaxY(rows, x);
    if (my >= 0) for (let k = 1; k <= 3; k++) P(g, x, my + k, sh);
  }
  // 1px void north edge (top contour)
  for (let x = 0; x < 64; x++) {
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
      if ((x + y) % 2 === 0 || (k === 0 && hash2(x, y, 9) < 0.35)) P(g, x, y, oc);
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
      len: 2 + Math.floor(rnd() * 4),
    });
  }
  const DX = [0, 1, 0, -1], DY = [0, 0, 1, 0];
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
    for (let y = 0; y < 32; y++) if (inDiamond(rows, x, y)) { ty = y; break; }
    [[ty + 1, 0], [ty + 2, 1], [my, 0], [my - 1, 1]].forEach(p => {
      const y = p[0];
      if (y < 1 || y > 31 || !inDiamond(rows, x, y)) return;
      if ((x + y) % 2 === 0 && hash2(x, y, 6) < 0.6) P(g, x, y, RAMP.water[0]);
      else if (hash2(x, y, 5) < 0.14) P(g, x, y, RAMP.bone[2]);
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
    motes.push({ x: 14 + Math.floor(rnd() * 36), y: 6 + Math.floor(rnd() * 20) });
  }
  return alphas.map((a, f) => {
    const g = makeGrid(64, 32);
    for (let y = 0; y < 32; y++) {
      for (let x = rows[y].x0; x <= rows[y].x1; x++) {
        const dist = Math.abs(x - 32) / 2 + Math.abs(y - 16); // diamond metric 0..16
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

Object.assign(globalThis, {
  hash2, contourMaxY, makeBaseTile, transitionVariant, stoneSeamVariant,
  waterFrames, waterFoamVariant, corruptFrames,
});
