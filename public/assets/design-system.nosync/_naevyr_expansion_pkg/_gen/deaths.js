// Naevyr FRONTIER CREATURE DEATHS — eval after pixlib.js + tiles.js + beasts.js
// (ell, shadeMass, spike, moteBurst) + mobs.js (DIRMAP) + minibosses.js (pillarLeg).
// Standalone death sequences matching the beasts.js death convention: authored collapse
// frames, solids 1px void-outlined, then OUTLINE-FREE motes/scatter painted after the
// outline pass (like moteBurst). 5 facings handled (slight topple toward facing).
// Returns a grid of the creature's exact cell size. RAMP only, dither not blur,
// bottom-center anchor, top 4px clear, moonlit-left / shadowed-right.

/* shared: a rough rubble/debris mound (lit-left, shadow-right), void at the base seam */
function deathMound(g, cx, baseY, halfW, height, ramp, seed, fill) {
  fill = fill == null ? 0.8 : fill;
  for (let yy = 0; yy < height; yy++) {
    const t = yy / height;
    const w = Math.round(halfW * (1 - t * t * 0.85));
    for (let x = cx - w; x <= cx + w; x++) {
      if (hash2(x, baseY - yy, seed) > fill) continue;
      let c = ramp[1];
      if (x < cx - w + 2) c = ramp[0];
      if (x > cx + w - 2) c = ramp[3];
      if (yy === 0) c = ramp[3];
      if (hash2(x, baseY - yy, seed + 7) < 0.16) c = ramp[2];
      P(g, x, baseY - yy, c);
    }
  }
}
/* a low scatter of debris pixels flung out along the ground */
function deathScatter(g, cx, baseY, spread, n, ramp, seed) {
  const r = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.round(cx + (r() - 0.5) * spread * 2);
    const y = baseY - Math.floor(r() * 2);
    P(g, x, y, r() < 0.5 ? ramp[2] : ramp[3]);
  }
}
function leanOf(dir) { return [0, 1, 2, 1, 0][dir]; }

/* ============================ MOBS ============================ */

// BOGWRETCH 32×40 — collapses, throat-sac deflates, dissolves to drift motes (4f)
function bogwretchDeath(facing, f) {
  const g = makeGrid(32, 40); const wa = RAMP.water, gr = RAMP.grass, bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2; const cx = 16 + leanOf(dir), groundY = 38;
  if (f === 0) {
    // slumped: body sags flat, sac deflated, eyes dimming
    shadeMass(g, cx, groundY - 4, profile ? 9 : 8, 4, wa, 110);
    if (!back) { const hx = cx + (profile ? 5 : 0); shadeMass(g, hx, groundY - 5, 4, 3, wa, 112); P(g, hx + (profile ? 2 : -2), groundY - 6, dr[3]); if (!profile) P(g, hx + 2, groundY - 6, dr[3]); for (let i = -3; i <= 3; i++) P(g, hx + i, groundY - 1, wa[3]); }
    // legs splaying
    P(g, cx - 8, groundY - 1, wa[2]); P(g, cx + 8, groundY - 1, wa[2]);
    outline(g, RAMP.void); P(g, cx, groundY - 8, dr[3]);
  } else if (f === 1) {
    // collapsed splayed heap
    ell(g, cx, groundY - 2, 11, 3, (x, y, d, dx, dy) => { let c = wa[2]; if (dx + dy < -0.4) c = wa[1]; if (d > 0.7) c = wa[3]; if (hash2(x, y, 113) < 0.18) c = gr[2]; P(g, x, y, c); });
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 6, 8, 0.5, 114);
  } else if (f === 2) {
    // dissolving puddle + bone bits, motes rising
    for (let x = cx - 9; x <= cx + 9; x++) { if (hash2(x, 0, 115) < 0.7) P(g, x, groundY - 1, wa[3]); if (hash2(x, 1, 115) < 0.3) P(g, x, groundY - 2, wa[2]); }
    P(g, cx - 4, groundY - 1, bn[3]); P(g, cx + 3, groundY - 1, bn[3]);
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 9, 12, 0.7, 116);
  } else {
    // near-gone: faint stain + scattering drift motes (no body)
    for (let x = cx - 6; x <= cx + 6; x++) if (hash2(x, 2, 117) < 0.35) P(g, x, groundY - 1, wa[3]);
    moteBurst(g, cx, groundY - 12, 14, 0.4, 118);
  }
  return g;
}

// BARROW WIGHT 32×44 — robe crumples, bones clatter apart (4f)
function barrowWightDeath(facing, f) {
  const g = makeGrid(32, 44); const st = RAMP.stone, bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIRMAP[facing], back = dir >= 3, profile = dir === 2; const cx = 16 + Math.round(leanOf(dir) * 0.5), groundY = 42;
  if (f === 0) {
    // robe sagging, hood drooping, sockets flickering out
    for (let y = groundY - 26; y <= groundY; y++) { const t = (y - (groundY - 26)) / 26; const w = Math.round(4 + t * 5); for (let x = cx - w; x <= cx + w; x++) { let c = st[1]; if (x < cx - w + 1) c = st[0]; if (x > cx + w - 1) c = st[3]; if (hash2(x, y, 121) < 0.05) c = st[2]; P(g, x, y, c); } }
    if (!back) { P(g, cx + (profile ? 3 : -2), groundY - 22, dr[3]); if (!profile) P(g, cx + 2, groundY - 22, dr[3]); }
    outline(g, RAMP.void);
  } else if (f === 1) {
    // crumpling, bones separating from the hem
    for (let y = groundY - 16; y <= groundY; y++) { const t = (y - (groundY - 16)) / 16; const w = Math.round(6 + t * 4); for (let x = cx - w; x <= cx + w; x++) { if (hash2(x, y, 122) > 0.85) continue; let c = st[1]; if (x < cx - w + 1) c = st[0]; if (x > cx + w - 1) c = st[3]; P(g, x, y, c); } }
    [[-7, 6], [8, 9], [-9, 4]].forEach(([ox, oy], i) => { for (let k = 0; k < 4; k++) P(g, cx + ox + (i ? 1 : -1), groundY - oy + k, bn[1]); });
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 18, 9, 0.5, 123);
  } else if (f === 2) {
    // robe heap + scattered clattering bones
    deathMound(g, cx, groundY - 1, 9, 6, st, 124, 0.82);
    const r = mulberry(125); for (let i = 0; i < 7; i++) { const bx = cx + Math.round((r() - 0.5) * 22), by = groundY - 1 - Math.floor(r() * 3); const len = 3 + Math.floor(r() * 3); const ang = (r() - 0.5) * 1.5; for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.5), bn[1]); P(g, bx, by, bn[0]); }
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 12, 11, 0.5, 126);
  } else {
    // settled: bone pile + collapsed robe + last drift wisp
    deathMound(g, cx, groundY - 1, 7, 4, st, 127, 0.7);
    const r = mulberry(128); for (let i = 0; i < 9; i++) { const bx = cx + Math.round((r() - 0.5) * 24), by = groundY - 1 - Math.floor(r() * 2); P(g, bx, by, bn[2]); if (r() < 0.5) P(g, bx + 1, by, bn[1]); }
    // a couple of skulls
    fillRect(g, cx - 8, groundY - 4, 4, 3, bn[1]); P(g, cx - 7, groundY - 3, RAMP.void);
    outline(g, RAMP.void); P(g, cx + 2, groundY - 8, dr[2]); P(g, cx + 2, groundY - 10, dr[3]);
  }
  return g;
}

// BONE HUSK 28×36 — skeleton shatters (4f)
function boneHuskDeath(facing, f) {
  const g = makeGrid(28, 36); const bn = RAMP.bone, dr = RAMP.drift;
  const dir = DIRMAP[facing], back = dir >= 3; const cx = 14 + leanOf(dir), groundY = 34;
  if (f === 0) {
    // jolt + cracks, skull tilts, eyes flare
    const top = 9, hipY = top + 13;
    for (let y = top + 6; y <= hipY; y++) { P(g, cx - 2, y, bn[2]); P(g, cx + 2, y, bn[3]); if ((y - top) % 2 === 0) for (let x = cx - 1; x <= cx + 1; x++) P(g, x, y, bn[1]); }
    shadeMass(g, cx + 1, top + 3, 3, 3, bn, 131); if (!back) { P(g, cx, top + 3, dr[0]); P(g, cx + 2, top + 3, dr[0]); }
    for (let y = hipY; y < groundY - 1; y++) { P(g, cx - 2, y, bn[2]); P(g, cx + 3, y, bn[2]); }
    // cracks
    P(g, cx, top + 8, RAMP.void); P(g, cx + 1, top + 10, RAMP.void);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // bones flying apart (radiating shards)
    const cyk = 20; const r = mulberry(132);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const dst = 4 + r() * 6; const bx = Math.round(cx + Math.cos(a) * dst), by = Math.round(cyk + Math.sin(a) * dst * 0.7); const len = 2 + Math.floor(r() * 3); for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(a) * k), Math.round(by + Math.sin(a) * k * 0.6), i % 2 ? bn[1] : bn[2]); }
    shadeMass(g, cx, cyk, 2, 2, bn, 133);
    outline(g, RAMP.void); moteBurst(g, cx, cyk, 9, 0.4, 134);
  } else if (f === 2) {
    // scattered shards on the ground + dust
    const r = mulberry(135); for (let i = 0; i < 11; i++) { const bx = cx + Math.round((r() - 0.5) * 22), by = groundY - 1 - Math.floor(r() * 3); const len = 2 + Math.floor(r() * 3), ang = (r() - 0.5) * 1.8; for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.4), bn[1]); }
    outline(g, RAMP.void); deathScatter(g, cx, groundY - 1, 12, 8, bn, 136);
  } else {
    // small bone pile + dust settling
    deathMound(g, cx, groundY - 1, 6, 4, bn, 137, 0.75);
    fillRect(g, cx - 5, groundY - 3, 4, 3, bn[1]); P(g, cx - 4, groundY - 2, RAMP.void);   // a skull
    outline(g, RAMP.void); deathScatter(g, cx, groundY - 1, 13, 6, bn, 138);
  }
  return g;
}

// ASH BRUTE 48×52 — ember cracks flare then go cold, slumps (4f)
function ashBruteDeath(facing, f) {
  const g = makeGrid(48, 52); const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold;
  const dir = DIRMAP[facing]; const cx = 24 + leanOf(dir) * 2, groundY = 50;
  const crk = [[-7, 8], [4, 12], [-2, 18], [8, 6], [-9, 15], [1, 22], [-5, 26], [6, 24]];
  if (f === 0) {
    // rigid, every crack blazing gold-hot
    deathMound(g, cx, groundY - 1, 17, 34, dt, 141, 0.96);
    crk.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 34 + oy; P(g, x, y, gd[0]); P(g, x, y + 1, em[0]); P(g, x + 1, y, em[0]); P(g, x - 1, y, em[1]); });
    // head glare
    shadeMass(g, cx, groundY - 38, 5, 4, dt, 145); P(g, cx - 2, groundY - 38, gd[0]); P(g, cx + 2, groundY - 38, gd[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // buckling — body squat, cracks at peak flare + ember spray rising
    deathMound(g, cx, groundY - 1, 18, 26, dt, 142, 0.95);
    crk.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 26 + Math.round(oy * 0.7); P(g, x, y, em[0]); P(g, x, y + 1, gd[0]); });
    outline(g, RAMP.void);
    for (let i = 0; i < 10; i++) { const t = hash2(i, 1, 143) * Math.PI; P(g, Math.round(cx + Math.cos(t) * 14), groundY - 24 - Math.floor(hash2(i, 2, 143) * 8), i % 2 ? em[0] : gd[0]); }
  } else if (f === 2) {
    // collapsing, cracks cooling to dim ember
    deathMound(g, cx, groundY - 1, 19, 16, dt, 144, 0.9);
    crk.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 14 + Math.round(oy * 0.4); P(g, x, y, em[2]); if (hash2(x, y, 145) < 0.4) P(g, x, y, em[3]); });
    outline(g, RAMP.void);
    for (let i = 0; i < 6; i++) P(g, cx + Math.round((hash2(i, 3, 146) - 0.5) * 26), groundY - 1, em[3]);   // dying embers
  } else {
    // cold dark rubble heap, a couple of fading embers
    deathMound(g, cx, groundY - 1, 20, 11, st, 147, 0.85);
    for (let i = 0; i < 14; i++) { const x = cx + Math.round((hash2(i, 4, 148) - 0.5) * 38); P(g, x, groundY - 1, st[3]); if (hash2(i, 5, 148) < 0.3) P(g, x, groundY - 2, dt[3]); }
    outline(g, RAMP.void);
    P(g, cx - 6, groundY - 4, em[3]); P(g, cx + 5, groundY - 3, em[3]);   // last cooling coals (outline-free)
  }
  return g;
}

// DRIFT WISP 28×32 — pops into scattering motes (3f, NO outline)
function driftWispDeath(facing, f) {
  const g = makeGrid(28, 32); const dr = RAMP.drift; const cx = 14, cy = 12;
  if (f === 0) {
    // core flares supernova-bright, halo intensifies
    ell(g, cx, cy, 5, 4.4, (x, y, d) => P(g, x, y, d < 0.4 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
    P(g, cx, cy, dr[0]);
    for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2; P(g, Math.round(cx + Math.cos(t) * 7), Math.round(cy + Math.sin(t) * 6), dr[0]); }
    moteBurst(g, cx, cy, 9, 0.6, 150);
  } else if (f === 1) {
    // bursting outward
    const r = mulberry(151);
    for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, dst = 4 + r() * 9; const x = Math.round(cx + Math.cos(a) * dst), y = Math.round(cy + Math.sin(a) * dst * 0.9); P(g, x, y, r() < 0.3 ? dr[0] : r() < 0.6 ? dr[1] : dr[2]); }
    P(g, cx, cy, dr[1]);
  } else {
    // scattered, fading — mostly empty
    const r = mulberry(152);
    for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, dst = 7 + r() * 6; P(g, Math.round(cx + Math.cos(a) * dst), Math.round(cy - 2 + Math.sin(a) * dst * 0.8), r() < 0.5 ? dr[2] : dr[3]); }
  }
  return g;  // no outline — pure corruption motes
}

/* ============================ MINI-BOSSES (5f dramatic collapse) ============================ */

// THE DROWNED KING 110×110 — topples, water bursts, crumbles to barnacled rubble + drift
function drownedKingDeath(facing, f) {
  const g = makeGrid(110, 110); const wa = RAMP.water, st = RAMP.stone, bn = RAMP.bone, gd = RAMP.gold, gr = RAMP.grass, dr = RAMP.drift;
  const dir = DIRMAP[facing]; const cx = 55 + leanOf(dir) * 3, groundY = 106; const tip = dir <= 2 ? 1 : -1;
  if (f === 0) {
    // staggered, listing, water weeping from the seams, crown tipping
    deathMound(g, cx + tip * 4, groundY - 1, 26, 64, st, 301, 0.95);
    for (let i = 0; i < 16; i++) { const x = cx + Math.round((hash2(i, 0, 302) - 0.5) * 44), y = groundY - 20 - Math.floor(hash2(i, 1, 302) * 40); if (hash2(i, 2, 302) < 0.5) P(g, x, y, wa[2]); }
    // tipping crown
    for (let i = -8; i <= 8; i += 2) P(g, cx + tip * 8 + i, groundY - 70, gd[1]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // toppling — leans hard, big water burst
    for (let yy = 0; yy < 50; yy++) { const t = yy / 50; const w = Math.round(24 * (1 - t * 0.6)); const sx = cx + tip * Math.round(t * 22); for (let x = sx - w; x <= sx + w; x++) { if (hash2(x, yy, 303) > 0.9) continue; let c = st[1]; if (x < sx - w + 3) c = st[0]; if (x > sx + w - 3) c = st[3]; if (t > 0.5 && hash2(x, yy, 304) < 0.3) c = wa[2]; P(g, x, groundY - yy, c); } }
    for (let i = 0; i < 24; i++) { const a = Math.PI + (i / 24) * Math.PI; P(g, Math.round(cx + tip * 30 + Math.cos(a) * 26), Math.round(groundY - 10 + Math.sin(a) * 14), i % 2 ? wa[0] : wa[1]); }
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 40, 18, 0.4, 305);
  } else if (f === 2) {
    // crashing down — body breaking into barnacled chunks, splash ring
    deathMound(g, cx + tip * 10, groundY - 1, 34, 30, st, 306, 0.82);
    [[-18, 8], [16, 12], [24, 6], [-26, 5]].forEach(([ox, oy], i) => ell(g, cx + ox, groundY - oy, 6, 4, (x, y, d) => P(g, x, y, d < 0.5 ? st[1] : st[3])));
    // barnacles + kelp in the rubble
    for (let i = 0; i < 8; i++) { const x = cx + Math.round((hash2(i, 0, 307) - 0.5) * 56); P(g, x, groundY - 1 - Math.floor(hash2(i, 1, 307) * 6), bn[1]); }
    for (let a = 0; a < 30; a++) { const t = a / 30 * Math.PI * 2; if (a % 2) P(g, Math.round(cx + Math.cos(t) * 40), Math.round(groundY - 2 + Math.sin(t) * 9), wa[0]); }
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 30, 24, 0.5, 308);
  } else if (f === 3) {
    // heap of barnacled rubble + kelp + draining puddle, crown fallen
    deathMound(g, cx, groundY - 1, 32, 18, st, 309, 0.8);
    for (let i = 0; i < 12; i++) { const x = cx + Math.round((hash2(i, 0, 310) - 0.5) * 60); P(g, x, groundY - 1 - Math.floor(hash2(i, 1, 310) * 4), bn[2]); }
    for (let i = 0; i < 8; i++) { const kx = cx + Math.round((hash2(i, 2, 310) - 0.5) * 54); for (let k = 0; k < 4; k++) P(g, kx, groundY - 1 - k, gr[2]); }
    // fallen crown (left)
    for (let i = -6; i <= 6; i += 2) P(g, cx - 24 + i, groundY - 3, gd[1]); for (let x = cx - 30; x <= cx - 18; x++) P(g, x, groundY - 2, gd[2]);
    for (let x = cx - 44; x <= cx + 44; x++) if (hash2(x, 3, 311) < 0.4) P(g, x, groundY - 1, wa[3]);   // draining water
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 20, 22, 0.35, 312);
  } else {
    // settled barnacled mound + the broken crown + drift + wet stain
    deathMound(g, cx, groundY - 1, 28, 12, st, 313, 0.78);
    for (let i = 0; i < 14; i++) { const x = cx + Math.round((hash2(i, 0, 314) - 0.5) * 56); P(g, x, groundY - 1, st[3]); P(g, x, groundY - 2 - Math.floor(hash2(i, 1, 314) * 3), bn[2]); }
    for (let i = -6; i <= 6; i += 2) P(g, cx - 22 + i, groundY - 3, gd[2]);
    for (let x = cx - 46; x <= cx + 46; x++) if (hash2(x, 4, 315) < 0.3) P(g, x, groundY - 1, wa[3]);
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 16, 20, 0.3, 316);
  }
  return g;
}

// THE BARROW LORD 110×116 — collapses, bones explode apart, crown falls
function barrowLordDeath(facing, f) {
  const g = makeGrid(110, 116); const bn = RAMP.bone, st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift;
  const dir = DIRMAP[facing]; const cx = 55 + leanOf(dir) * 3, groundY = 112;
  if (f === 0) {
    // shudder, sockets flare, ribcage jolts, crown rattling
    for (let y = groundY - 78; y <= groundY - 28; y++) P(g, cx, y, bn[2]);
    for (let r = 0; r < 7; r++) { const ry = groundY - 72 + r * 6, span = 16 - r; for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) { const x = cx + s * k, y = ry + Math.round((k / span) ** 2 * 7) + (r % 2 ? 1 : 0); P(g, x, y, bn[1]); } }
    // legs
    for (const lx of [-13, 13]) for (let y = groundY - 30; y <= groundY; y++) P(g, cx + lx, y, bn[2]);
    // skull + crown + flaring sockets
    const hy = groundY - 90; for (let y = hy - 8; y <= hy + 7; y++) for (let x = cx - 9; x <= cx + 9; x++) { if (Math.abs(x - cx) + Math.abs(y - hy) > 13) continue; P(g, x, y, bn[1]); }
    for (let i = -8; i <= 8; i += 2) for (let k = 0; k < 3; k++) P(g, cx + i, hy - 9 - k, gd[2]);
    P(g, cx - 4, hy - 1, dr[0]); P(g, cx + 4, hy - 1, dr[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // ribcage cracking apart, bones beginning to fly
    for (let r = 0; r < 6; r++) { const ry = groundY - 66 + r * 7, span = 15 - r, off = (r % 2 ? 3 : -3); for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= span; k++) { if (hash2(k, ry, 320) > 0.85) continue; const x = cx + off + s * k, y = ry + Math.round((k / span) ** 2 * 6); P(g, x, y, bn[1]); } }
    const r = mulberry(321); for (let i = 0; i < 10; i++) { const a = r() * Math.PI * 2, dst = 16 + r() * 18; const bx = Math.round(cx + Math.cos(a) * dst), by = Math.round(groundY - 50 + Math.sin(a) * dst * 0.7); const len = 4 + Math.floor(r() * 4); for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(a) * k), Math.round(by + Math.sin(a) * k * 0.6), bn[2]); }
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 56, 26, 0.4, 322);
  } else if (f === 2) {
    // explosive scatter — bones flung wide
    const r = mulberry(323);
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, dst = 10 + r() * 40; const bx = Math.round(cx + Math.cos(a) * dst), by = Math.round(groundY - 40 + Math.sin(a) * dst * 0.6); const len = 3 + Math.floor(r() * 5); const ang = a + (r() - 0.5); for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.5), i % 2 ? bn[0] : bn[1]); }
    deathMound(g, cx, groundY - 1, 14, 8, bn, 324, 0.7);
    outline(g, RAMP.void); moteBurst(g, cx, groundY - 40, 30, 0.5, 325);
  } else if (f === 3) {
    // collapsing skeletal heap, crown falling, mantle crumpling
    deathMound(g, cx, groundY - 1, 26, 16, st, 326, 0.74);
    const r = mulberry(327); for (let i = 0; i < 20; i++) { const bx = cx + Math.round((r() - 0.5) * 70), by = groundY - 1 - Math.floor(r() * 5); const len = 3 + Math.floor(r() * 4), ang = (r() - 0.5) * 1.8; for (let k = 0; k < len; k++) P(g, Math.round(bx + Math.cos(ang) * k), Math.round(by - Math.sin(ang) * k * 0.4), bn[1]); }
    for (let i = -6; i <= 6; i += 2) P(g, cx - 4 + i, groundY - 14, gd[1]); for (let x = cx - 12; x <= cx + 4; x++) P(g, x, groundY - 13, gd[2]);  // crown sliding off
    outline(g, RAMP.void); P(g, cx - 10, groundY - 18, dr[2]); P(g, cx + 8, groundY - 16, dr[3]);
  } else {
    // pile of bones + fallen gold crown + fading drift fire
    deathMound(g, cx, groundY - 1, 22, 11, st, 328, 0.7);
    const r = mulberry(329); for (let i = 0; i < 26; i++) { const bx = cx + Math.round((r() - 0.5) * 78), by = groundY - 1 - Math.floor(r() * 3); P(g, bx, by, bn[2]); if (r() < 0.5) P(g, bx + 1, by, bn[1]); }
    fillRect(g, cx + 14, groundY - 6, 7, 5, bn[1]); P(g, cx + 16, groundY - 5, RAMP.void); P(g, cx + 18, groundY - 5, RAMP.void);   // a big skull
    for (let i = -6; i <= 6; i += 2) P(g, cx - 18 + i, groundY - 4, gd[2]); for (let x = cx - 26; x <= cx - 10; x++) P(g, x, groundY - 3, gd[1]);   // fallen crown
    outline(g, RAMP.void); P(g, cx - 2, groundY - 14, dr[3]); P(g, cx + 4, groundY - 12, dr[3]);
  }
  return g;
}

// THE ASH WARLORD 100×110 — armor cracks blaze ember-hot then cool, buckles, collapses
function ashWarlordDeath(facing, f) {
  const g = makeGrid(100, 110); const dt = RAMP.dirt, st = RAMP.stone, em = RAMP.ember, gd = RAMP.gold, bl = RAMP.blood, bn = RAMP.bone;
  const dir = DIRMAP[facing]; const cx = 50 + leanOf(dir) * 2, groundY = 106; const tip = dir <= 2 ? 1 : -1;
  const seams = [[-8, 12], [5, 18], [-2, 26], [9, 14], [-10, 32], [2, 40], [-5, 46], [7, 36]];
  if (f === 0) {
    // rigid, every seam blazing, blade lowering, cloak settling
    if (dir <= 2) for (let y = groundY - 70; y <= groundY - 6; y++) { const t = (y - (groundY - 70)) / 64; const w = Math.round(16 + t * 10); for (let s = -1; s <= 1; s += 2) for (let x = 0; x < 5; x++) P(g, cx + s * (w - x), y, x === 0 ? bl[1] : bl[2]); }
    deathMound(g, cx, groundY - 1, 19, 70, dt, 341, 0.95);
    seams.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 70 + oy; P(g, x, y, gd[0]); P(g, x, y + 1, em[0]); });
    shadeMass(g, cx, groundY - 74, 7, 5, dt, 342); P(g, cx - 2, groundY - 73, em[0]); P(g, cx + 2, groundY - 73, em[0]);
    outline(g, RAMP.void);
  } else if (f === 1) {
    // buckling — knees give, ember light flares through every seam, cloak billows
    deathMound(g, cx + tip * 3, groundY - 1, 21, 50, dt, 343, 0.93);
    seams.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 50 + Math.round(oy * 0.7); P(g, x, y, em[0]); P(g, x, y + 1, gd[0]); P(g, x + 1, y, em[1]); });
    if (dir <= 2) for (let i = 0; i < 16; i++) { const a = Math.PI + (i / 16) * Math.PI; P(g, Math.round(cx + tip * 18 + Math.cos(a) * 22), Math.round(groundY - 30 + Math.sin(a) * 16), bl[2]); }
    outline(g, RAMP.void);
    for (let i = 0; i < 12; i++) P(g, cx + Math.round((hash2(i, 0, 344) - 0.5) * 30), groundY - 44 - Math.floor(hash2(i, 1, 344) * 10), i % 2 ? em[0] : gd[0]);
  } else if (f === 2) {
    // collapsing forward, plates breaking, ember spray
    for (let yy = 0; yy < 40; yy++) { const t = yy / 40, w = Math.round(20 * (1 - t * 0.5)), sx = cx + tip * Math.round(t * 20); for (let x = sx - w; x <= sx + w; x++) { if (hash2(x, yy, 345) > 0.88) continue; let c = dt[1]; if (x < sx - w + 3) c = dt[0]; if (x > sx + w - 3) c = dt[3]; P(g, x, groundY - yy, c); } }
    seams.forEach(([ox, oy]) => { const x = cx + tip * 10 + ox, y = groundY - 30 + Math.round(oy * 0.4); P(g, x, y, em[2]); if (hash2(x, y, 346) < 0.4) P(g, x, y, em[3]); });
    outline(g, RAMP.void);
    for (let i = 0; i < 18; i++) { const a = hash2(i, 0, 347) * Math.PI; P(g, Math.round(cx + tip * 24 + Math.cos(a) * 20), Math.round(groundY - 12 + Math.sin(a) * 10), i % 2 ? em[1] : em[2]); }
  } else if (f === 3) {
    // crumpled smouldering heap, blade fallen, cloak draped, embers cooling
    deathMound(g, cx, groundY - 1, 24, 18, dt, 348, 0.84);
    for (let x = cx - 30; x <= cx + 6; x++) P(g, x, groundY - 2, bl[3]);   // draped cloak
    seams.forEach(([ox, oy]) => { const x = cx + ox, y = groundY - 14 + Math.round(oy * 0.2); if (y < groundY) { P(g, x, y, em[3]); if (hash2(x, y, 349) < 0.5) P(g, x, y, em[2]); } });
    // fallen blade (right), still ember-warm
    for (let k = 0; k < 30; k++) { const x = cx + 18 + k, y = groundY - 2 - Math.round(k * 0.1); P(g, x, y, k % 4 === 0 ? em[2] : st[1]); }
    outline(g, RAMP.void);
  } else {
    // cold dark armor rubble + fallen blade + dying embers + trophy skull rolled free
    deathMound(g, cx, groundY - 1, 26, 12, st, 350, 0.8);
    for (let i = 0; i < 16; i++) { const x = cx + Math.round((hash2(i, 0, 351) - 0.5) * 50); P(g, x, groundY - 1, st[3]); if (hash2(i, 1, 351) < 0.3) P(g, x, groundY - 2, dt[3]); }
    for (let x = cx - 32; x <= cx - 6; x++) P(g, x, groundY - 2, bl[3]);   // cloak
    for (let k = 0; k < 32; k++) P(g, cx + 16 + k, groundY - 2, k % 5 === 0 ? st[0] : st[1]);   // cold blade
    fillRect(g, cx - 24, groundY - 5, 6, 4, bn[1]); P(g, cx - 23, groundY - 4, RAMP.void); P(g, cx - 21, groundY - 4, RAMP.void);   // trophy skull rolled free
    outline(g, RAMP.void);
    P(g, cx - 4, groundY - 6, em[3]); P(g, cx + 6, groundY - 5, em[3]);   // last coals (outline-free)
  }
  return g;
}

const CREATURE_DEATHS = {
  bogwretch:    { fn: 'bogwretchDeath',    frames: 4, group: 'mobs' },
  barrow_wight: { fn: 'barrowWightDeath',  frames: 4, group: 'mobs' },
  bone_husk:    { fn: 'boneHuskDeath',     frames: 4, group: 'mobs' },
  ash_brute:    { fn: 'ashBruteDeath',     frames: 4, group: 'mobs' },
  drift_wisp:   { fn: 'driftWispDeath',    frames: 3, group: 'mobs', noOutline: true },
  drowned_king: { fn: 'drownedKingDeath',  frames: 5, group: 'beasts' },
  barrow_lord:  { fn: 'barrowLordDeath',   frames: 5, group: 'beasts' },
  ash_warlord:  { fn: 'ashWarlordDeath',   frames: 5, group: 'beasts' },
};

Object.assign(globalThis, {
  deathMound, deathScatter, leanOf,
  bogwretchDeath, barrowWightDeath, boneHuskDeath, ashBruteDeath, driftWispDeath,
  drownedKingDeath, barrowLordDeath, ashWarlordDeath, CREATURE_DEATHS,
});
