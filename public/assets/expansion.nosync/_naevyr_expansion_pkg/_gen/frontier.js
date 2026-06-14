// Naevyr FRONTIER EXPANSION · GROUND ACCENTS + DOODADS — eval after pixlib.js + tiles.js.
// Heavier ash / corruption ground-accent tiles (64×36, drawn UNDER entities, like the
// threshold ground accents) + native-size bottom-anchored frontier doodads.
//   ash_ground   64×36 ×2 variants (a=ash drift, b=corruption stain)
//   drift_crystal 28×44 ×2 · ash_dune 26×16 ×2 · scorched_stump 24×22 ×2
// RAMP only, 1px void outline on doodads (accents keep only their diamond edge),
// dither not blur, moonlit-left/shadowed-right.

/* ===================== GROUND ACCENTS (64×36, 2 variants, under-entities) ===================== */
function drawAshGround(variant) {
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
    [[22, 14], [40, 18]].forEach(([bx, by]) => { for (let yy = -3; yy <= 3; yy++) for (let xx = -4; xx <= 4; xx++) { if ((xx / 4) ** 2 + (yy / 3) ** 2 > 1) continue; if (inDiamond(rows, bx + xx, by + yy) && hash2(bx + xx, by + yy, seed + 5) < 0.7) P(g, bx + xx, by + yy, RAMP.void); } });
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
    [[26, 12], [36, 18], [30, 20], [40, 10]].forEach(([mx, my], i) => { if (!inDiamond(rows, mx, my)) return; P(g, mx, my, i % 2 ? dr[1] : dr[2]); if (i % 2 === 0) P(g, mx, my - 1, dr[2]); });
    // faint purple veins crawling to the rim
    let vx = ccx, vy = ccy;
    for (let k = 0; k < 22; k++) { if (inDiamond(rows, vx, vy)) P(g, vx, vy, dr[2]); vx += (hash2(vx, vy, seed + 9) < 0.5 ? 1 : -1); vy += (hash2(vx, vy, seed + 8) < 0.5 ? 1 : 0); }
  }
  return g;  // ground accent: keep only its diamond edge (no full outline)
}

/* ===================== DRIFT CRYSTAL CLUSTER (28×44, 2 variants) ===================== */
function drawDriftCrystal(variant) {
  const g = makeGrid(28, 44); const dr = RAMP.drift, st = RAMP.stone;
  const cx = 14, baseY = 41;
  // small dark rocky base the shards erupt from
  for (let yy = 0; yy < 5; yy++) for (let xx = -9 + yy; xx <= 9 - yy; xx++) { let c = st[2]; if (xx < -7 + yy) c = st[1]; if (xx > 7 - yy) c = st[3]; P(g, cx + xx, baseY - yy, c); }
  // a single drift shard (tapered crystal) leaning by `lean`
  function shard(sx, sy, h, lean, thick) {
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

/* ===================== ASH DUNE TUFT (26×16, 2 variants) ===================== */
function drawAshDune(variant) {
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

/* ===================== SCORCHED STUMP (24×22, 2 variants) ===================== */
function drawScorchedStump(variant) {
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

/* ============================ REGISTRY ============================ */
const FRONTIER_GROUND = {
  ash_ground: { fn: (i) => drawAshGround(i), cell: [64, 36], anchor: [32, 16], variants: 2, tile: true, under: true },
};
const FRONTIER_DOODAD = {
  drift_crystal:  { fn: (i) => drawDriftCrystal(i),  cell: [28, 44], anchor: [14, 41], variants: 2 },
  ash_dune:       { fn: (i) => drawAshDune(i),       cell: [26, 16], anchor: [13, 15], variants: 2 },
  scorched_stump: { fn: (i) => drawScorchedStump(i), cell: [24, 22], anchor: [12, 21], variants: 2 },
};

Object.assign(globalThis, {
  drawAshGround, drawDriftCrystal, drawAshDune, drawScorchedStump,
  FRONTIER_GROUND, FRONTIER_DOODAD,
});
