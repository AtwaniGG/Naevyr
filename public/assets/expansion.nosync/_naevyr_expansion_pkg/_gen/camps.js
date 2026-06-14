// Naevyr FRONTIER EXPANSION · WILD CAMPS / MINI-DUNGEONS — eval after pixlib.js +
// tiles.js + wilds.js (driftVeins, boneSpikeShape) + town.js (foundation).
// Three explorable wild structures, each ~96-120px wide, 3×3 footprint, bottom-center
// anchor, top 6px reserved for the label, with a subtle 2-frame idle.
//   drowned_ruins  (Palewater)  120×96  — half-sunken pale arches in shallow water
//   barrow_crypt   (Bonefields) 116×100 — grass-grown burial mound + dark stone door
//   ashen_warcamp  (frontier)   120×104 — raider tents + crude palisade + war-banner
// RAMP only, 1px void auto-outline, dither not blur, moonlit-left/shadowed-right.

/* ===================== 1 · DROWNED RUINS (120×96, 2f water shimmer) ===================== */
function drawDrownedRuins(frame) {
  frame = frame || 0;
  const g = makeGrid(120, 96);
  const wa = RAMP.water, st = RAMP.stone, bn = RAMP.bone;
  const cx = 60, baseY = 88;

  // shallow waterlogged basin (iso ellipse) — pale, with land rim
  for (let dy = -18; dy <= 18; dy++) for (let dx = -58; dx <= 58; dx++) {
    const e = (dx / 58) ** 2 + (dy / 18) ** 2;
    if (e > 1) continue;
    const h = hash2(cx + dx, baseY + dy, 601);
    let c;
    if (e > 0.86) { c = RAMP.dirt[2]; if (h < 0.3) c = RAMP.dirt[3]; }   // muddy shore rim
    else { c = wa[2]; if (dy < -2) c = wa[1]; if (h < 0.10) c = wa[1]; if (h > 0.94) c = wa[3]; }
    P(g, cx + dx, baseY + dy, c);
  }
  // pale waterline scum / reeds at the rim
  for (let i = 0; i < 10; i++) {
    const rx = cx - 48 + Math.floor(hash2(i, 1, 602) * 96);
    const ry = baseY + Math.floor((hash2(i, 2, 602) - 0.5) * 30);
    if ((rx - cx) ** 2 / 58 ** 2 + (ry - baseY) ** 2 / 18 ** 2 > 0.95) continue;
    for (let k = 0; k < 4; k++) P(g, rx, ry - k, RAMP.grass[k > 2 ? 2 : 1]);
    P(g, rx, ry - 4, bn[2]);
  }

  // helper: a half-sunken broken stone arch (pale + waterlogged base)
  function arch(acx, springY, R, band, breakAt) {
    // two stubby legs down into the water
    for (const side of [-1, 1]) {
      const lx = acx + side * R;
      for (let y = springY; y <= baseY + 4; y++) {
        const sub = y > baseY - 6;                       // submerged darker + algae
        for (let x = -3; x <= 3; x++) {
          let c = side < 0 ? st[0] : st[2];
          if (x > 1) c = st[3];
          if (sub) c = (hash2(lx + x, y, 603) < 0.4) ? RAMP.grass[3] : st[3];
          P(g, lx + x, y, c);
        }
      }
    }
    // the broken semicircle (missing a chunk at breakAt side)
    tDisc(g, acx, springY, R + 3, (x, y, d) => {
      if (y > springY) return;
      if (d > R + 3 || d < R - band) return;
      if (breakAt < 0 && x < acx - R * 0.3 && y < springY - R * 0.4) return;   // knocked-out chunk (left)
      if (breakAt > 0 && x > acx + R * 0.3 && y < springY - R * 0.4) return;   // (right)
      let c = (x < acx) ? st[0] : st[1];
      const edge = d > R + 2 || d < R - band + 1.3;
      if (edge) c = st[3];
      else if (hash2(x, y, 604) < 0.10) c = bn[2];        // pale weather bloom
      P(g, x, y, c);
    });
    // dripping algae streaks down the inner faces
    for (let s = 0; s < 3; s++) {
      const dx2 = acx - R + 2 + s * R;
      for (let k = 0; k < 5; k++) P(g, dx2, springY + 1 + k, RAMP.grass[3]);
    }
  }
  arch(cx - 30, baseY - 30, 16, 6, +1);
  arch(cx + 26, baseY - 36, 19, 7, -1);
  // a lone toppled capstone half in the water (foreground left)
  for (let j = 0; j < 6; j++) for (let i = 0; i < 16; i++) {
    let c = st[1]; if (i < 2) c = st[0]; if (i > 13) c = st[3]; if (j > 3) c = st[3];
    P(g, cx - 52 + i, baseY - 4 - j + Math.round(i * 0.25), c);
  }

  // 2-frame water shimmer (pale speculars drift ±1px) + a rising bubble
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

/* ===================== 2 · BARROW-CRYPT (116×100, 2f doorway glow) ===================== */
function drawBarrowCrypt(frame) {
  frame = frame || 0;
  const g = makeGrid(116, 100);
  const gr = RAMP.grass, dt = RAMP.dirt, st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const cx = 58, baseY = 92;
  if (typeof foundation === 'function') foundation(g, cx, baseY + 4, 52, { ash: false });

  // low, broad, grass-grown burial mound
  const maxH = 50;
  for (let yy = 0; yy <= maxH; yy++) {
    const t = yy / maxH;
    let hw = Math.round(54 * Math.pow(1 - Math.pow(t, 2.4), 0.5));
    hw += Math.round((hash2(yy, 0, 611) - 0.5) * 5);
    const top = baseY - yy;
    for (let xx = -hw; xx <= hw; xx++) {
      const h = hash2(cx + xx, top, 612);
      let c = gr[1];
      if (xx < -hw + 6) c = gr[0];                       // moonlit back-left
      else if (xx > hw - 6) c = gr[3];                   // shadow right
      else if (h < 0.10) c = gr[2];
      else if (h < 0.13) c = gr[0];
      if (h > 0.95) c = dt[2];                           // bare earth scars
      // earth showing through near the base
      if (yy < 8 && h < 0.35) c = dt[2];
      P(g, cx + xx, top, c);
    }
  }
  // grass tufts on the crown
  for (let i = 0; i < 10; i++) {
    const tx = cx - 30 + Math.floor(hash2(i, 1, 613) * 60);
    const ty = baseY - maxH + 2 + Math.floor(hash2(i, 2, 613) * 8);
    for (let k = 0; k < 3; k++) P(g, tx, ty - k, gr[k > 1 ? 0 : 2]);
  }

  // dark stone trilithon doorway at the south base (two jambs + lintel)
  const dw = 22, dh = 30, dx0 = cx - dw / 2, dtop = baseY - dh;
  // jambs
  for (const side of [-1, 1]) {
    const jx = cx + side * (dw / 2 + 2);
    for (let y = dtop - 2; y <= baseY; y++) for (let x = -3; x <= 3; x++) {
      let c = side < 0 ? st[0] : st[2]; if (x > 1) c = st[3];
      if (hash2(jx + x, y, 614) < 0.08) c = st[2];
      P(g, jx + x, y, c);
    }
  }
  // lintel slab
  for (let j = 0; j < 5; j++) for (let i = -dw / 2 - 5; i <= dw / 2 + 5; i++) {
    let c = i < 0 ? st[1] : st[2]; if (i < -dw / 2 - 2) c = st[0]; if (i > dw / 2 + 2) c = st[3];
    P(g, cx + i, dtop - 2 - j, c);
  }
  // dark doorway void
  for (let j = 0; j < dh; j++) for (let i = -dw / 2 + 1; i <= dw / 2 - 1; i++) {
    const t = Math.abs(i) / (dw / 2);
    if (j < dh * 0.18 * t) continue;
    P(g, cx + i, baseY - j, RAMP.void);
  }
  // faint drift glow seeping from the doorway (blinks per frame)
  const bright = frame === 1;
  const gy = baseY - 10;
  [[-3, bright ? dr[1] : dr[3]], [3, bright ? dr[2] : dr[3]], [0, bright ? dr[0] : dr[2]]].forEach(([ox, c]) => {
    P(g, cx + ox, gy, c); P(g, cx + ox, gy + 1, bright ? dr[2] : dr[3]);
    if (bright) { P(g, cx + ox, gy - 1, dr[2]); }
  });
  if (bright) for (let x = -dw / 2 + 2; x <= dw / 2 - 2; x++) if ((cx + x) % 2 === 0) P(g, cx + x, baseY + 1, dr[3]);

  // bone accents — ribs & skulls half-buried around the base, markers on top
  if (typeof boneSpikeShape === 'function') {
    [[-44, 7, -0.5], [44, 7, 0.5], [-30, 5, -0.2], [32, 6, 0.3]].forEach(([ox, h, ln]) => boneSpikeShape(g, cx + ox, baseY + 1, h + 4, ln));
  }
  const rng = mulberry(615);
  for (let i = 0; i < 4; i++) {
    const kx = cx - 40 + Math.floor(rng() * 80), ky = baseY + 1 + Math.floor(rng() * 4);
    if (Math.abs(kx - cx) < dw / 2 + 6) continue;
    fillRect(g, kx, ky - 2, 4, 3, bn[1]); P(g, kx + 1, ky - 1, RAMP.void); P(g, kx + 3, ky - 1, RAMP.void); P(g, kx + 1, ky + 1, bn[2]);
  }
  // a leaning bone marker post on the crown
  for (let k = 0; k < 10; k++) P(g, cx - 14 + Math.round(k * 0.2), baseY - maxH + 6 - k, bn[2]);
  P(g, cx - 12, baseY - maxH - 4, bn[1]); P(g, cx - 13, baseY - maxH - 3, bn[1]); P(g, cx - 11, baseY - maxH - 3, bn[1]);

  outline(g, RAMP.void);
  return g;
}

/* ===================== 3 · ASHEN WARCAMP (120×104, 2f ember flicker) ===================== */
function drawAshenWarcamp(frame) {
  frame = frame || 0;
  const g = makeGrid(120, 104);
  const dt = RAMP.dirt, bl = RAMP.blood, bn = RAMP.bone, em = RAMP.ember, st = RAMP.stone;
  const cx = 60, baseY = 96;

  // ashen ground pad (dirt + dark ash dither)
  for (let dy = -16; dy <= 16; dy++) for (let dx = -56; dx <= 56; dx++) {
    if ((dx / 56) ** 2 + (dy / 16) ** 2 > 1) continue;
    const h = hash2(cx + dx, baseY + dy, 621);
    let c = dt[2];
    if (h < 0.16) c = RAMP.ash; else if (h < 0.22) c = dt[3];
    if (dy < -4 && dx < 0) c = dt[1];
    P(g, cx + dx, baseY + dy, c);
  }

  // crude palisade of sharpened stakes arcing across the back
  const stakes = 13;
  for (let i = 0; i < stakes; i++) {
    const t = i / (stakes - 1);
    const sx = cx - 46 + Math.round(t * 92);
    const sy = baseY - 30 - Math.round(Math.sin(t * Math.PI) * 8);   // arc up in the middle (recede)
    const h = 22 + Math.floor(hash2(i, 1, 622) * 6);
    const lean = Math.round((hash2(i, 2, 622) - 0.5) * 2);
    for (let k = 0; k < h; k++) {
      const px = sx + Math.round(lean * (k / h));
      let c = dt[1]; if (i % 2) c = dt[2];
      if (k < 3) c = dt[3];                                          // sharpened dark tip
      P(g, px, sy - k, c); P(g, px + 1, sy - k, dt[3]);
    }
    // sharpened point
    P(g, sx + lean, sy - h, dt[3]); P(g, sx + lean, sy - h + 1, dt[2]);
  }
  // lashing rope across the stakes
  for (let x = cx - 44; x <= cx + 44; x++) { const t = (x - (cx - 44)) / 88; const ry = baseY - 30 - Math.round(Math.sin(t * Math.PI) * 8) - 12; P(g, x, ry, bn[3]); }
  // a skull impaled on the tallest stake
  fillRect(g, cx - 2, baseY - 58, 5, 4, bn[1]); P(g, cx - 1, baseY - 57, RAMP.void); P(g, cx + 1, baseY - 57, RAMP.void); P(g, cx, baseY - 55, bn[2]);

  // helper: a raider tent (angular hide cloth)
  function tent(tx, by, w, hgt, ramp) {
    // triangular hide tent: narrow at the apex (top), wide at the base
    for (let row = 0; row <= hgt; row++) {
      const t = row / hgt, hw = Math.round((w / 2) * t);
      const sy = by - hgt + row;
      for (let x = -hw; x <= hw; x++) {
        let c = ramp[1]; if (x < -hw + 2) c = ramp[0]; if (x > hw - 2) c = ramp[2];
        if ((x - row) % 6 === 0) c = ramp[3];                        // hide-seam stitching (runs down the slope)
        if (hash2(tx + x, sy, 623) < 0.05) c = ramp[3];
        P(g, tx + x, sy, c);
      }
      // lashed lower hem
      if (row === hgt) for (let x = -hw; x <= hw; x++) if (x % 2 === 0) P(g, tx + x, sy, ramp[3]);
    }
    // crossed ridge poles poking out the apex
    for (let k = 0; k < 6; k++) P(g, tx, by - hgt - k, dt[3]);
    P(g, tx - 2, by - hgt - 4, dt[3]); P(g, tx + 2, by - hgt - 5, dt[3]);
    // dark triangular entrance flap at the base center
    const eh = Math.round(hgt * 0.55);
    for (let j = 0; j < eh; j++) { const ew = Math.round((1 - j / eh) * 4); for (let i = -ew; i <= ew; i++) P(g, tx + i, by - j, RAMP.void); }
    // tied-back flap edges (lit)
    for (let j = 0; j < eh; j++) { const ew = Math.round((1 - j / eh) * 4); P(g, tx - ew - 1, by - j, ramp[0]); P(g, tx + ew + 1, by - j, ramp[2]); }
    // guy-lines pegged to the ground
    for (let k = 0; k < 4; k++) { P(g, tx - Math.round(w / 2) - 1 - k, by - 2 + k, dt[3]); P(g, tx + Math.round(w / 2) + 1 + k, by - 2 + k, dt[3]); }
  }
  tent(cx - 30, baseY, 34, 30, dt);
  tent(cx + 26, baseY - 2, 28, 26, bl);

  // war-banner on a pole (right) — blood cloth, bone finial; 2f flutter
  const bx = cx + 46, byTop = baseY - 54;
  for (let y = byTop; y <= baseY; y++) P(g, bx, y, dt[3]);
  P(g, bx, byTop - 1, bn[1]); P(g, bx - 1, byTop - 2, bn[2]); P(g, bx + 1, byTop - 2, bn[2]);  // bone finial
  const flutter = frame === 1 ? 1 : 0;
  for (let j = 0; j < 22; j++) for (let i = 0; i < 14; i++) {
    const wob = Math.round(Math.sin(j * 0.4 + frame) * 1.3) + (i > 9 ? flutter : 0);
    let c = bl[2]; if (i === 0) c = bl[1]; if (i >= 12) c = bl[3];
    if (i > 9 + flutter && j > 16) continue;                         // notched/torn tail
    P(g, bx - 1 - i + wob, byTop + 2 + j, c);
  }
  // bone emblem on the banner
  fillRect(g, bx - 7, byTop + 9, 3, 4, bn[1]); P(g, bx - 6, byTop + 10, RAMP.void); P(g, bx - 8, byTop + 13, bn[2]); P(g, bx - 4, byTop + 13, bn[2]);

  // central campfire — logs + ember flame (2f flicker) + warm glow
  const fxp = cx - 4, fy = baseY - 2;
  for (let i = -6; i <= 6; i++) P(g, fxp + i, fy, dt[3]);                          // log bed
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
  // warm glow halo (dither, pulses)
  const rr = frame === 1 ? 11 : 9;
  for (let yy = -9; yy <= 3; yy++) for (let xx = -12; xx <= 12; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 6 && d < rr && (xx + yy + frame) % 2 === 0) P(g, fxp + xx, fy - 5 + yy, em[2]); }

  // a couple of crates / loot by the fire
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { let c = dt[1]; if (i === 0) c = dt[0]; if (i === 7) c = dt[2]; if (i === 0 || i === 7 || j === 0 || j === 7) c = dt[3]; if (i === j || i === 7 - j) c = dt[2]; P(g, cx + 16 + i, baseY - 8 + j, c); }

  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const CAMPS = {
  drowned_ruins: { fn: (i) => drawDrownedRuins(i), cell: [120, 96], anchor: [60, 95], frames: 2, footprint: '3x3', tile: true, labelClear: true, anim: { name: 'idle', fps: 2 } },
  barrow_crypt:  { fn: (i) => drawBarrowCrypt(i),  cell: [116, 100], anchor: [58, 99], frames: 2, footprint: '3x3', tile: true, labelClear: true, anim: { name: 'idle', fps: 2 } },
  ashen_warcamp: { fn: (i) => drawAshenWarcamp(i), cell: [120, 104], anchor: [60, 103], frames: 2, footprint: '3x3', tile: true, labelClear: true, anim: { name: 'idle', fps: 2 } },
};

Object.assign(globalThis, {
  drawDrownedRuins, drawBarrowCrypt, drawAshenWarcamp, CAMPS,
});
