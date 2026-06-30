// Naevyr EVENT ART — eval after pixlib.js + tiles.js + beasts.js (moteBurst, ell).
// World-event sprites. Drift corruption FX get NO void outline on the boil seam (it bleeds);
// solid props keep the 1px outline. RAMP only, dither not blur.
//   drift_rift  96×128  states sealed/opening/active(boil 4f)/closing — vertical world-tear
//   rift_mote   16×16   2f — small mote drifting around an active rift
//   blood_moon  64×64   2f — dark-red corrupted moon phase
//   blood_aura  96×48   3f pulse — ground ring under buffed mobs during the Blood Moon
//   (sky-tint gradient stops are emitted as data in events emit + the readme)

/* ============================ DRIFT RIFT (96×128) ============================ */
// A vertical tear hanging on the ground plane: dithered drift core, bone-white boil seam,
// roiling mote edges, a scorched dirt apron. open ∈ 0..1 controls width/height; boil ∈ 0..3.
function drawRiftBody(g, open, boil) {
  const dr = RAMP.drift, dt = RAMP.dirt;
  const cx = 48, midY = 66, groundY = 120;
  // scorched apron on the ground (dirt + ash + drift dither) — this part is outlined-ish via dither
  ell(g, cx, groundY, Math.round(20 + open * 16), Math.round(5 + open * 3), (x, y, d) => {
    let c = dt[3]; if (d < 0.4) c = RAMP.ash; if (hash2(x, y, 600) < open * 0.4 && d > 0.4) c = dr[3];
    P(g, x, y, c);
  });
  if (open <= 0.02) {
    // sealed: a dormant hairline scar with a few dim drift flecks
    for (let y = midY - 30; y <= groundY - 6; y++) { if (y % 3 !== 0) P(g, cx, y, dr[3]); if (y % 9 === 0) P(g, cx, y, dr[2]); }
    P(g, cx, midY, dr[2]);
    return;
  }
  const halfW = Math.round(2 + open * 20);
  const halfH = Math.round(20 + open * 42);
  // the tear: vertical lens, hard-banded drift ramp + pixel dither (NOT blurred)
  for (let y = midY - halfH; y <= midY + halfH; y++) {
    const ty = (y - (midY - halfH)) / (2 * halfH);        // 0 top .. 1 bottom
    const profile = Math.sin(ty * Math.PI);               // lens taper
    const w = Math.max(0, Math.round(halfW * profile));
    for (let x = cx - w; x <= cx + w; x++) {
      const r = Math.abs(x - cx) / Math.max(1, w);         // 0 core .. 1 edge
      let c;
      if (r < 0.18) c = dr[0]; else if (r < 0.4) c = dr[1]; else if (r < 0.66) c = dr[2]; else if (r < 0.86) c = dr[3]; else c = dr[4];
      // pixel dither breakup (toward the edges), animated by boil
      if (r > 0.45 && ((x + y + boil) % 2 === 0) && hash2(x, y, 601 + boil) < 0.5) continue;
      P(g, x, y, c);
    }
  }
  // bright bone-white boil seam down the centre (flickers per boil frame)
  for (let y = midY - halfH + 2; y <= midY + halfH - 2; y++) {
    if (hash2(0, y, 610 + boil) < 0.78) P(g, cx, y, dr[0]);
    if (hash2(0, y, 612 + boil) < 0.25) { P(g, cx - 1, y, dr[1]); P(g, cx + 1, y, dr[1]); }
  }
  // roiling mote edge (boils outward) — NO outline, it bleeds into the dark
  const rip = mulberry(620 + boil);
  for (let i = 0; i < Math.round(14 * open); i++) {
    const ty = rip(), y = Math.round(midY - halfH + ty * 2 * halfH);
    const profile = Math.sin(ty * Math.PI), w = halfW * profile;
    const side = rip() < 0.5 ? -1 : 1;
    const x = Math.round(cx + side * (w + 1 + rip() * 3));
    P(g, x, y, rip() < 0.4 ? dr[0] : dr[2]);
  }
  // motes escaping the top
  if (open > 0.6) moteBurst(g, cx, midY - halfH, 8, 0.4, 630 + boil);
}
const RIFT_STATES = { sealed: 2, opening: 4, active: 4, closing: 4 };
function drawDriftRift(state, f) {
  const g = makeGrid(96, 128);
  if (state === 'sealed')  drawRiftBody(g, 0, f % 2);
  if (state === 'opening') drawRiftBody(g, [0.15, 0.45, 0.72, 1][f], f % 4);
  if (state === 'active')  drawRiftBody(g, 1, f);                  // boil loop
  if (state === 'closing') drawRiftBody(g, [1, 0.7, 0.4, 0.12][f], (4 - f) % 4);
  // ground apron keeps a faint outline so it reads on the tile; the corruption does NOT.
  return g;  // intentionally no global outline (boil seam bleeds)
}

/* ============================ RIFT MOTE (16×16, 2f) ============================ */
function drawRiftMote(f) {
  const g = makeGrid(16, 16);
  const dr = RAMP.drift; const cx = 8, cy = 7 + (f ? -1 : 1);
  ell(g, cx, cy, 2.2, 2.2, (x, y, d) => P(g, x, y, d < 0.3 ? dr[0] : d < 0.7 ? dr[1] : dr[2]));
  // little trailing tail + sparkle (alternates)
  P(g, cx, cy + 3, dr[3]); P(g, cx + (f ? 1 : -1), cy + 4, dr[3]);
  if (f) { P(g, cx - 3, cy - 2, dr[1]); P(g, cx + 3, cy, dr[2]); }
  else { P(g, cx + 3, cy - 2, dr[1]); P(g, cx - 3, cy, dr[2]); }
  return g;  // mote: no outline (it glows)
}

/* ============================ BLOOD MOON (64×64, 2f) ============================ */
// A corrupted blood-red moon: deep-red disc, darker maria/craters, a creeping drift-purple
// vein, a faint outer corrupted halo. 2f = a slow ember/drift glimmer along the vein.
function drawBloodMoon(f) {
  const g = makeGrid(64, 64);
  const bl = RAMP.blood, dr = RAMP.drift; const cx = 32, cy = 32, R = 22;
  // outer corrupted halo (dither, no hard edge)
  for (let y = 4; y < 60; y++) for (let x = 4; x < 60; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d > R && d < R + 6 && (x + y + f) % 2 === 0 && hash2(x, y, 640) < (1 - (d - R) / 6) * 0.6) P(g, x, y, bl[3]);
  }
  // the disc — blood ramp, lit upper-left
  ell(g, cx, cy, R, R, (x, y, d, dx, dy) => {
    let c = bl[1]; if (dx + dy < -0.4) c = bl[0]; if (d > 0.72) c = bl[2]; if (dx + dy > 0.55) c = bl[3];
    if (hash2(x, y, 641) < 0.06) c = bl[3];                       // mottling
    P(g, x, y, c);
  });
  // dark maria / craters
  [[-7, -5, 5], [6, 3, 6], [-3, 9, 4], [10, -8, 3]].forEach(([ox, oy, r]) => ell(g, cx + ox, cy + oy, r, r * 0.9, (x, y, d) => { if (d < 0.7) P(g, x, y, bl[3]); else if (d < 1) P(g, x, y, bl[2]); }));
  // creeping drift-purple corruption vein (glimmers on f1)
  let vx = cx - 14, vy = cy - 6;
  for (let k = 0; k < 22; k++) {
    if (Math.hypot(vx - cx, vy - cy) < R - 1) P(g, Math.round(vx), Math.round(vy), (f && k % 3 === 0) ? dr[0] : dr[2]);
    vx += 1.1 + (hash2(k, 0, 642) - 0.5); vy += 0.5 + (hash2(k, 1, 642) - 0.5) * 1.2;
  }
  if (f) moteBurst(g, cx + 6, cy + 2, 6, 0.3, 643);
  outline(g, RAMP.void);                                          // the moon is a solid body → outlined
  return g;
}

/* ============================ BLOOD AURA RING (96×48, 3f) ============================ */
// Iso ground ring placed UNDER buffed mobs during the Blood Moon. Pulses 3f.
function drawBloodAura(f) {
  const g = makeGrid(96, 48); const bl = RAMP.blood, dr = RAMP.drift; const cx = 48, cy = 24;
  const rx = [30, 34, 32][f], ry = rx / 2;
  const bright = f === 1;
  for (let a = 0; a < 360; a += 3) {
    const rad = a * Math.PI / 180, x = Math.round(cx + Math.cos(rad) * rx), y = Math.round(cy + Math.sin(rad) * ry);
    if ((x + y + f) % 2 === 0) continue;                          // dither
    P(g, x, y, bright ? bl[0] : bl[1]);
    // inner glow lip
    const ix = Math.round(cx + Math.cos(rad) * (rx - 2)), iy = Math.round(cy + Math.sin(rad) * (ry - 1));
    if ((ix + iy) % 3 === 0) P(g, ix, iy, bright ? bl[1] : bl[2]);
  }
  // a few drift-tainted flecks rising inside the ring
  for (let i = 0; i < 6; i++) { const t = hash2(i, f, 650) * Math.PI * 2, r = hash2(i, f, 651) * rx * 0.6; P(g, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * 0.5), i % 2 ? dr[2] : bl[2]); }
  return g;  // ground FX: no outline
}

// Full-screen Blood-Moon SKY TINT — vertical gradient reference (top → horizon).
// Exact hex stops (overlay the world with these, top-to-bottom; ~0.5 strength):
const BLOOD_SKY_STOPS = [
  { at: 0.0,  hex: '#1a0610', note: 'zenith — near-void, faint red' },
  { at: 0.35, hex: '#2a0810', note: 'upper sky' },
  { at: 0.62, hex: '#3b0d14', note: 'mid sky' },
  { at: 0.82, hex: '#5f1212', note: 'low sky (blood-dp)' },
  { at: 1.0,  hex: '#991b1b', note: 'horizon glow (blood-lo)' },
];
// a 64×128 banded-dither swatch of the gradient for the preview / engine reference
function drawBloodSkySwatch() {
  const g = makeGrid(64, 128);
  for (let y = 0; y < 128; y++) {
    const t = y / 127;
    // pick the two surrounding stops and hard-band with a dither between them
    let lo = BLOOD_SKY_STOPS[0], hi = BLOOD_SKY_STOPS[BLOOD_SKY_STOPS.length - 1];
    for (let i = 0; i < BLOOD_SKY_STOPS.length - 1; i++) if (t >= BLOOD_SKY_STOPS[i].at && t <= BLOOD_SKY_STOPS[i + 1].at) { lo = BLOOD_SKY_STOPS[i]; hi = BLOOD_SKY_STOPS[i + 1]; }
    const f = (t - lo.at) / Math.max(0.0001, hi.at - lo.at);
    for (let x = 0; x < 64; x++) {
      const c = ((x + y) % 2 === 0 && hash2(x, y, 660) < f) ? hi.hex : lo.hex;
      P(g, x, y, c);
    }
  }
  return g;
}

const EVENTS = {
  drift_rift: { states: RIFT_STATES, cell: [96, 128], anchor: [48, 127], note: 'world-tear; sits on ground plane; boil seam un-outlined' },
  rift_mote:  { frames: 2, cell: [16, 16], anchor: [8, 8] },
  blood_moon: { frames: 2, cell: [64, 64], anchor: [32, 32] },
  blood_aura: { frames: 3, cell: [96, 48], anchor: [48, 24], centered: true },
};

Object.assign(globalThis, {
  drawRiftBody, RIFT_STATES, drawDriftRift, drawRiftMote, drawBloodMoon, drawBloodAura,
  BLOOD_SKY_STOPS, drawBloodSkySwatch, EVENTS,
});
