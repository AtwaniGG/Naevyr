// Naevyr MOB FX & PROJECTILES — eval after pixlib.js + tiles.js + beasts.js (moteBurst, ell).
// Frame-strip sprites (no facings): drawX(f) -> grid. 1px void outline on solid bodies;
// dithered glow/ring FX. RAMP only. Anchors per-asset (projectiles center, ground FX as noted).
//   bog_spit       12×12  travel 3f + splat 2f   (Bogwretch projectile)
//   drift_bolt     10×10  travel 3f              (Drift Wisp projectile)
//   ash_shockwave  48×24  ring 4f                (Ash Brute slam ground FX; centered)

/* ---- bog_spit: a drift-tinted bile glob, spinning, with a wet trail; then splat ---- */
function drawBogSpit(f, splat) {
  const g = makeGrid(12, 12);
  const wa = RAMP.water, gr = RAMP.grass, dr = RAMP.drift;
  if (!splat) {
    const cx = 7, cy = 6;
    // tumbling glob (lit core shifts each frame)
    ell(g, cx, cy, 3, 2.6, (x, y, d, dx, dy) => {
      let c = wa[1]; if (d > 0.7) c = wa[3];
      if (dx + dy < -0.3) c = (f % 2 ? gr[0] : wa[0]);
      P(g, x, y, c);
    });
    P(g, cx, cy, dr[1]);                                   // drift-bile core
    P(g, cx + (f === 1 ? 1 : -1), cy - 1, dr[0]);
    // wet trail behind (toward back-left, since it flies right)
    const tr = [[-4, 1], [-3, 0], [-5, 2]];
    tr.forEach(([ox, oy], i) => { if (i <= f) P(g, cx + ox, cy + oy, i ? wa[3] : wa[2]); });
    P(g, cx - 6, cy + 1, dr[3]);
    outline(g, RAMP.void);
  } else {
    // splat: spreading puddle + droplets (2f)
    const cy = 9;
    for (let x = 2; x <= 10; x++) { if (hash2(x, splat, 200) < 0.85) P(g, x, cy, wa[2]); if (hash2(x, splat, 201) < 0.5) P(g, x, cy + 1, wa[3]); }
    P(g, 5, cy, dr[2]); P(g, 7, cy, dr[2]);
    if (splat === 0) { P(g, 3, cy - 2, wa[1]); P(g, 9, cy - 2, wa[1]); P(g, 6, cy - 3, dr[1]); }   // flung droplets
    else { for (let x = 1; x <= 11; x++) if (hash2(x, 9, 202) < 0.4) P(g, x, cy + 1, wa[3]); }
    outline(g, RAMP.void);
  }
  return g;
}

/* ---- drift_bolt: a bright corrupted dart, elongated toward travel, mote sparks ---- */
function drawDriftBolt(f) {
  const g = makeGrid(10, 10);
  const dr = RAMP.drift; const cx = 5, cy = 5;
  // elongated bright bolt (points right / travel dir; engine rotates per heading)
  for (let x = cx - 3; x <= cx + 3; x++) {
    const t = (x - (cx - 3)) / 6;                          // tail→head
    const hh = Math.round(t * 2.2);
    for (let y = cy - hh; y <= cy + hh; y++) {
      let c = dr[2]; if (t > 0.6) c = dr[1]; if (t > 0.85) c = dr[0]; if (Math.abs(y - cy) >= hh && hh > 0) c = dr[3];
      P(g, x, y, c);
    }
  }
  P(g, cx + 3, cy, dr[0]);                                 // hot tip
  // sparks trailing (vary by frame)
  const sp = [[-4, 0], [-3, -1], [-3, 1], [-5, 0]];
  sp.forEach(([ox, oy], i) => { if ((i + f) % 2 === 0) P(g, cx + ox, cy + oy, dr[3]); });
  if (f === 1) { P(g, cx, cy - 3, dr[0]); P(g, cx + 1, cy + 3, dr[1]); }
  outline(g, RAMP.void);
  return g;
}

/* ---- ash_shockwave: expanding ember ring on the iso ground plane (4f, centered) ---- */
function drawAshShockwave(f) {
  const g = makeGrid(48, 24);
  const em = RAMP.ember, gd = RAMP.gold, dt = RAMP.dirt;
  const cx = 24, cy = 12;
  const rx = [6, 14, 21, 23][f], ry = rx / 2;
  const fade = f;                                          // outer ring thins/darkens as it grows
  // the ring: iso ellipse outline, dithered, ember→gold hot on the inner edge
  for (let a = 0; a < 360; a += 4) {
    const rad = a * Math.PI / 180;
    const x = Math.round(cx + Math.cos(rad) * rx), y = Math.round(cy + Math.sin(rad) * ry);
    if ((x + y + f) % 2 === 0) continue;                   // dither
    let c = f < 2 ? em[0] : em[1];
    if (f >= 2 && hash2(x, y, 210) < 0.4) c = em[3];       // breaking up
    P(g, x, y, c);
    // hot inner lip
    const ix = Math.round(cx + Math.cos(rad) * (rx - 1.5)), iy = Math.round(cy + Math.sin(rad) * (ry - 0.8));
    if ((ix + iy) % 2 === 0) P(g, ix, iy, f === 0 ? gd[0] : em[2]);
  }
  // kicked ember dust inside the ring on the first frames
  if (f <= 1) for (let i = 0; i < 10; i++) { const t = hash2(i, f, 211) * Math.PI * 2, r = hash2(i, f, 212) * rx * 0.7; P(g, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.5), hash2(i, f, 213) < 0.5 ? em[1] : dt[2]); }
  // central scorch on the last frame
  if (f === 3) for (let x = cx - 3; x <= cx + 3; x++) P(g, x, cy, dt[3]);
  return g;  // ground FX: no silhouette outline (dithered ring reads on its own)
}

const MOBFX = {
  bog_spit:      { travel: 3, splat: 2, cell: [12, 12], anchor: [6, 6] },
  drift_bolt:    { travel: 3, cell: [10, 10], anchor: [5, 5] },
  ash_shockwave: { ring: 4, cell: [48, 24], anchor: [24, 12], centered: true },
};

Object.assign(globalThis, { drawBogSpit, drawDriftBolt, drawAshShockwave, MOBFX });
