// Naevyr LANDING PAGE ART PACK — eval after pixlib.js + tiles.js (+ town.js
// & interiors.js for silhouette cues, fxlogo.js for the emblem). Rect-grid,
// RAMP only, 1px void outline, dither not blur, deterministic. Moonlit-left.

/* ============================ HERO VISTA (480×270, 2 frames) ============================
   Waystation cluster at dusk, distant 2:1 iso. Warm windows, shrine pale flame,
   corruption creeping from both edges + drifting motes. Center third kept calm
   & dark for overlaid UI text. */
function drawHeroVista(frame) {
  frame = frame || 0;
  const W = 480, H = 270, g = makeGrid(W, H);
  const horizon = 150;

  // --- sky: dusk gradient via stepped dither bands (void→stone→drift hint) ---
  const bands = [
    [0, 26, RAMP.void, '#13101d'],
    [26, 54, '#13101d', RAMP.ash],
    [54, 84, RAMP.ash, '#241d33'],
    [84, 116, '#241d33', '#2f2440'],
    [116, horizon, '#2f2440', '#3a2c4e'],
  ];
  bands.forEach(([y0, y1, a, b]) => {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        // ordered 2px dither between a and b
        const dith = ((x + y) % 2 === 0) ? t : t - 0.5;
        P(g, x, y, dith > 0.5 ? b : a);
      }
    }
  });
  // distant ridge silhouettes (two layers)
  for (let x = 0; x < W; x++) {
    const r1 = horizon - 10 - Math.round(8 * Math.sin(x * 0.013) + 5 * Math.sin(x * 0.05));
    for (let y = r1; y < horizon; y++) P(g, x, y, '#241d33');
    const r2 = horizon - 4 - Math.round(5 * Math.sin(x * 0.02 + 2));
    for (let y = r2; y < horizon; y++) P(g, x, y, '#1c1729');
  }
  // a cold moon, upper-left third (kept out of center)
  const mx = 70, my = 46;
  for (let yy = -9; yy <= 9; yy++) for (let xx = -9; xx <= 9; xx++) { if (xx * xx + yy * yy > 81) continue; let c = RAMP.bone[2]; if (xx + yy < -4) c = RAMP.bone[1]; if (xx * xx + yy * yy > 56) c = RAMP.bone[3]; P(g, mx + xx, my + yy, c); }
  for (let i = 0; i < 5; i++) { const cxs = mx + 2 + i, cys = my + 3 + (i % 2) * 2; for (let xx = 0; xx < 5; xx++) P(g, cxs + xx, cys, '#2f2440'); } // craters via dark streaks
  // faint stars
  const rng = mulberry(301);
  for (let i = 0; i < 60; i++) { const sx = Math.floor(rng() * W), sy = Math.floor(rng() * (horizon - 20)); if (Math.abs(sx - 240) < 70 && sy > 40) continue; P(g, sx, sy, rng() < 0.3 ? RAMP.bone[1] : RAMP.bone[3]); }

  // --- ground plane (iso-ish dark earth, fading to black at front) ---
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) {
      let c = t < 0.4 ? '#1a1626' : t < 0.75 ? '#13101d' : RAMP.void;
      if ((x + y) % 2 === 0 && hash2(x, y, 302) < 0.05 * (1 - t)) c = RAMP.dirt[3];
      P(g, x, y, c);
    }
  }
  // a faint iso path leading to the cluster (center, dark/calm)
  for (let y = horizon; y < H; y++) { const t = (y - horizon) / (H - horizon); const wdt = Math.round(6 + t * 40); for (let x = 240 - wdt; x <= 240 + wdt; x++) if ((x + y) % 3 === 0) P(g, x, y, '#1f1a2e'); }

  // --- distant Waystation cluster on the horizon (small simplified buildings) ---
  // helper: tiny iso house with optional warm window + roof color
  function tinyHouse(bx, by, w, hh, roof, lit, flicker) {
    // body
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) { let c = RAMP.stone[2]; if (x < 1) c = RAMP.stone[1]; if (x > w - 2) c = RAMP.stone[3]; P(g, bx + x, by - y, c); }
    // right side
    for (let d = 1; d <= 3; d++) for (let y = 0; y < hh; y++) P(g, bx + w - 1 + d, by - y - Math.floor(d / 2), RAMP.stone[3]);
    // roof
    for (let x = -1; x <= w; x++) { const d = Math.abs(x - (w - 1) / 2); const ry = by - hh - Math.round((w / 2 - d) * 0.7); for (let y = ry; y <= by - hh + 1; y++) P(g, bx + x, y, roof); }
    // warm window
    if (lit) { const wx = bx + (w >> 1) - 1, wy = by - (hh >> 1) - 1; const on = !flicker || frame === 0; fillRect(g, wx, wy, 2, 2, on ? RAMP.ember[1] : RAMP.ember[2]); if (on) P(g, wx, wy - 1, RAMP.ember[2]); }
  }
  // cluster center ~ x 210..290, sitting on horizon
  tinyHouse(196, horizon - 1, 12, 12, RAMP.blood[2], true, false);   // tavern-ish (warm)
  tinyHouse(214, horizon + 2, 10, 9, RAMP.stone[3], true, true);
  tinyHouse(252, horizon + 3, 14, 10, RAMP.dirt[3], true, false);
  tinyHouse(276, horizon - 1, 9, 11, RAMP.water[1], false, false);   // menagerie-ish
  tinyHouse(232, horizon - 3, 8, 8, RAMP.stone[3], true, true);
  // the shrine pale flame on a small dais (right of center)
  const sfx = 300, sfy = horizon + 1;
  fillRect(g, sfx - 3, sfy - 2, 7, 3, RAMP.stone[2]);                 // dais
  const tall = frame === 0 ? 0 : 1;
  for (let yy = 0; yy <= 6 + tall; yy++) { const hw = Math.max(0, Math.round((1 - yy / (7 + tall)) * 2)); for (let xx = -hw; xx <= hw; xx++) P(g, sfx + xx, sfy - 2 - yy, Math.abs(xx) === 0 ? RAMP.bone[0] : RAMP.bone[1]); }
  for (let yy = 1; yy <= 4 + tall; yy++) P(g, sfx, sfy - 3 - yy, RAMP.drift[1]);     // purple core
  // pale flame glow
  for (let yy = -5; yy <= 1; yy++) for (let xx = -4; xx <= 4; xx++) { const d = Math.abs(xx) + Math.abs(yy); if (d > 2 && d < 5 && (xx + yy + frame) % 2 === 0) P(g, sfx + xx, sfy - 4 + yy, RAMP.drift[2]); }

  // --- corruption creeping from BOTH screen edges ---
  function corruptEdge(side) {
    for (let y = 60; y < H; y++) {
      const reach = Math.round((40 + 26 * Math.sin(y * 0.05 + (side < 0 ? 0 : 2))) * (0.5 + 0.5 * (y / H)));
      for (let d = 0; d < reach; d++) {
        const x = side < 0 ? d : W - 1 - d;
        const edgeFade = 1 - d / reach;
        const h = hash2(x, y, 303);
        if ((x + y) % 2 === 0 && h < edgeFade * 0.8) P(g, x, y, h < edgeFade * 0.3 ? RAMP.drift[2] : RAMP.drift[3]);
        else if (h < edgeFade * 0.18) P(g, x, y, RAMP.drift[1]);    // bright vein nodes
        // glowing tendril tips
        if (d > reach - 3 && h < 0.04) P(g, x, y, RAMP.drift[1]);
      }
    }
  }
  corruptEdge(-1); corruptEdge(1);

  // --- drifting purple motes (shimmer between frames), avoid calm center top ---
  const mrng = mulberry(304);
  for (let i = 0; i < 70; i++) {
    let px = Math.floor(mrng() * W), py = Math.floor(mrng() * H);
    const drift = (frame === 0) ? 0 : 1;
    px = (px + (i % 3) * drift) % W; py = (py - drift + H) % H;
    // keep upper-center third calmer
    if (px > 150 && px < 330 && py < 120) { if (mrng() < 0.7) continue; }
    const big = i % 5 === 0;
    P(g, px, py, big ? RAMP.drift[0] : RAMP.drift[1]);
    if (big) { P(g, px + 1, py, RAMP.drift[2]); P(g, px, py + 1, RAMP.drift[2]); }
  }
  // bottom vignette so overlaid UI text reads
  for (let y = H - 60; y < H; y++) { const t = (y - (H - 60)) / 60; for (let x = 0; x < W; x++) if ((x + y) % 2 === 0 && hash2(x, y, 305) < t * 0.9) P(g, x, y, RAMP.void); }

  // NOTE: no global outline — this is a scene, not an object.
  return g;
}

/* ============================ NAV ICONS (16×16) ============================
   Icon.tsx style: single 'ink' silhouette + light/shadow, tintable. We draw in
   bone ramp so the DS can recolor via CSS. 1px void outline. */
function navIcon(name) {
  const g = makeGrid(16, 16);
  const I = RAMP.bone[1], D = RAMP.bone[3], H = RAMP.bone[0], A = RAMP.drift[1], G = RAMP.gold[1], E = RAMP.ember[1];
  const box = (x, y, w, h, c) => fillRect(g, x, y, w, h, c);
  const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) P(g, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); };
  switch (name) {
    case 'gauge': { // dashboard
      for (let yy = -5; yy <= 2; yy++) for (let xx = -6; xx <= 6; xx++) { if (xx * xx + (yy * 1.4) ** 2 > 36) continue; if (yy > 1) continue; P(g, 8 + xx, 9 + yy, I); }
      for (let xx = -6; xx <= 6; xx++) { P(g, 8 + xx, 9, D); } // base
      [-4, 0, 4].forEach(t => P(g, 8 + t, 4 + Math.abs(t) * 0.2, D));   // ticks
      line(8, 9, 11, 5, A); P(g, 8, 9, H);                              // needle
      break; }
    case 'scroll': { // updates
      box(4, 3, 8, 10, I); box(4, 3, 8, 1, D); box(4, 12, 8, 1, D);
      for (let yy = 5; yy <= 10; yy += 2) line(5, yy, 10, yy, D);
      P(g, 3, 3, D); P(g, 12, 3, D); P(g, 3, 13, D); P(g, 12, 13, D);   // rolled ends
      box(3, 2, 2, 2, H); box(11, 12, 2, 2, H);
      break; }
    case 'banner': { // events
      box(5, 2, 6, 9, A); P(g, 5, 2, RAMP.drift[0]); box(10, 2, 1, 9, RAMP.drift[3]);
      for (let i = 0; i < 3; i++) { P(g, 6 + i * 2, 11 + (i % 2), RAMP.drift[3]); }  // notched tail
      line(8, 2, 8, 14, D);                                             // pole
      P(g, 7, 5, H); P(g, 9, 5, H); P(g, 8, 6, H);                      // emblem
      break; }
    case 'book': { // docs / how-to-play
      box(3, 3, 5, 10, I); box(8, 3, 5, 10, I);
      box(3, 3, 5, 1, D); box(8, 3, 5, 1, D); line(8, 3, 8, 12, D);     // spine
      box(3, 12, 10, 1, D);
      P(g, 5, 6, D); P(g, 10, 6, D); P(g, 5, 8, D); P(g, 10, 8, D);     // text lines
      P(g, 8, 2, H);
      break; }
    case 'trophy': { // leaderboard
      for (let yy = 0; yy < 5; yy++) for (let xx = -4; xx <= 4; xx++) { if (Math.abs(xx) === 4 && yy > 2) continue; P(g, 8 + xx, 3 + yy, G); }
      P(g, 3, 4, G); P(g, 3, 5, G); P(g, 13, 4, G); P(g, 13, 5, G);     // handles
      box(7, 8, 3, 2, RAMP.gold[2]); box(5, 11, 7, 2, G); box(6, 13, 5, 1, RAMP.gold[3]); // stem+base
      P(g, 8, 4, H);
      break; }
    case 'ledger': { // index
      box(4, 2, 9, 12, I); box(4, 2, 9, 1, D); box(4, 13, 9, 1, D);
      box(4, 2, 1, 12, D);                                             // binding
      for (let yy = 4; yy <= 11; yy += 2) line(6, yy, 11, yy, D);
      P(g, 12, 5, A); P(g, 12, 9, G);                                   // tab marks
      break; }
    case 'discord': {
      for (let yy = -3; yy <= 3; yy++) for (let xx = -5; xx <= 5; xx++) { if (xx * xx / 25 + yy * yy / 9 > 1) continue; P(g, 8 + xx, 7 + yy, I); }
      P(g, 4, 11, I); P(g, 12, 11, I); P(g, 5, 10, I); P(g, 11, 10, I); // lower horns
      P(g, 6, 7, D); P(g, 10, 7, D); P(g, 6, 6, H); P(g, 10, 6, H);     // eyes
      break; }
    case 'telegram': {
      for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 11; xx++) { if (xx + yy < 4 || xx - yy > 8) continue; if (yy > 4 && xx < yy + 1) continue; P(g, 3 + xx, 3 + yy, I); }
      line(13, 4, 5, 9, H);                                            // fold highlight
      P(g, 7, 12, I); P(g, 6, 13, D);                                   // tail flick
      break; }
    case 'x_bird': {
      line(3, 3, 12, 12, I); line(4, 3, 13, 12, I);
      line(12, 3, 3, 12, I); line(13, 3, 4, 12, I);
      P(g, 3, 3, H); P(g, 13, 12, D);
      break; }
  }
  outline(g, RAMP.void);
  return g;
}
const NAV_ICONS = ['gauge', 'scroll', 'banner', 'book', 'trophy', 'ledger', 'discord', 'telegram', 'x_bird'];

/* ============================ GATE DOOR (96×128, 3 frames) ============================
   Warded stone door: shut · runes pulsing (gold) · opening glow. */
function drawGateDoor(frame) {
  frame = frame || 0;
  const g = makeGrid(96, 128); const cx = 48, baseY = 122;
  const st = RAMP.stone, gd = RAMP.gold, dr = RAMP.drift;
  // stone arch surround
  for (let y = 8; y <= baseY; y++) for (let x = 8; x <= 87; x++) {
    const inArch = (x >= 18 && x <= 77) && (y >= (28 - Math.round(Math.sqrt(Math.max(0, 900 - (x - 48) ** 2)) * 0.0)) ) ;
    // outer block frame
    if (x < 18 || x > 77 || y < 26) {
      // arch top: carve circle
      const topGap = (y < 40) && ((x - 48) ** 2 + (y - 40) ** 2 < 30 ** 2) && x > 18 && x < 78;
      if (topGap) continue;
      let c = st[1]; if (x < 12 || (x > 77 && x < 84)) c = st[0]; if (x > 83 || x > 77) c = st[3];
      if ((y % 8 === 0) || ((x + (Math.floor(y / 8) % 2) * 5) % 10 === 0)) c = st[3];
      if (hash2(x, y, 311) < 0.05) c = st[2];
      P(g, x, y, c);
    }
  }
  // door leaves region
  const dl = 20, dr_ = 76, dtopFlat = 42, dtopArchR = 28;
  function inDoor(x, y) {
    if (x < dl || x > dr_) return false;
    if (y > baseY - 2) return false;
    if (y >= dtopFlat) return true;
    return (x - 48) ** 2 + (y - dtopFlat) ** 2 <= dtopArchR ** 2;
  }
  // opening: frame 2 splits the doors apart
  const split = frame === 2 ? 10 : 0;
  for (let y = 14; y <= baseY; y++) for (let x = dl; x <= dr_; x++) {
    if (!inDoor(x, y)) continue;
    const leftLeaf = x < 48;
    const sx = leftLeaf ? x - split : x + split;
    if (frame === 2 && Math.abs(x - 48) < split) { // revealed interior glow
      let c = dr[3]; const d = Math.abs(x - 48);
      if (d < split - 4) c = dr[2]; if (d < split - 7) c = dr[1];
      if (hash2(x, y, 312) < 0.2) c = dr[0];
      P(g, x, y, c); continue;
    }
    if (!inDoor(sx, y)) continue;
    // wood/stone leaf with vertical planks
    let c = st[2]; if ((leftLeaf && x < dl + 3) || (!leftLeaf && x > dr_ - 3)) c = st[1];
    const plank = ((leftLeaf ? (dr_ - x) : (x - dl)) % 7);
    if (plank === 0) c = st[3];
    if (x > 44 && x < 52) c = st[3];                  // center seam
    if (hash2(sx, y, 313) < 0.05) c = st[3];
    P(g, sx, y, c);
  }
  // iron bands
  if (frame !== 2) { for (const by of [56, 90]) for (let x = dl + 1; x <= dr_ - 1; x++) { if (inDoor(x, by)) P(g, x, by, st[3]); if (inDoor(x, by + 1)) P(g, x, by + 1, RAMP.void); } }

  // --- warded runes (a ring + glyphs) ---
  const glow = frame === 0 ? gd[3] : frame === 1 ? gd[0] : gd[1];
  const glowDim = frame === 0 ? RAMP.gold[3] : gd[2];
  // central ring sigil
  const rcx = 48, rcy = 78, R = 16;
  if (frame !== 2) {
    for (let a = 0; a < 48; a++) { const th = a / 48 * Math.PI * 2; const x = Math.round(rcx + Math.cos(th) * R), y = Math.round(rcy + Math.sin(th) * R); if (inDoor(x, y)) P(g, x, y, a % 6 < 3 ? glow : glowDim); }
    // inner triangle glyph
    for (let i = 0; i < 3; i++) { const a0 = -Math.PI / 2 + i * 2.094, a1 = -Math.PI / 2 + (i + 1) * 2.094; const x0 = rcx + Math.cos(a0) * 9, y0 = rcy + Math.sin(a0) * 9, x1 = rcx + Math.cos(a1) * 9, y1 = rcy + Math.sin(a1) * 9; const n = 12; for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); P(g, x, y, glow); } }
    P(g, rcx, rcy, frame === 1 ? gd[0] : gd[2]);
    // vertical rune column glyphs on each leaf
    [30, 66].forEach(rx => { [50, 62, 100].forEach(ry => { if (!inDoor(rx, ry)) return; P(g, rx, ry, glow); P(g, rx - 1, ry + 1, glowDim); P(g, rx + 1, ry + 1, glowDim); P(g, rx, ry + 2, glow); }); });
    // glow halo on frame 1
    if (frame === 1) for (let yy = -R - 4; yy <= R + 4; yy++) for (let xx = -R - 4; xx <= R + 4; xx++) { const d = Math.sqrt(xx * xx + yy * yy); if (d > R + 1 && d < R + 4 && (xx + yy) % 2 === 0 && inDoor(rcx + xx, rcy + yy)) P(g, rcx + xx, rcy + yy, gd[3]); }
  } else {
    // opening: runes flare and scatter upward
    for (let yy = -R; yy <= R; yy += 2) for (let xx = -R; xx <= R; xx += 2) { const d = Math.sqrt(xx * xx + yy * yy); if (Math.abs(d - R) < 2) P(g, rcx + xx, rcy + yy, gd[0]); }
    for (let i = 0; i < 8; i++) { P(g, rcx - 12 + i * 3, rcy - 18 - (i % 3) * 3, i % 2 ? gd[0] : dr[1]); }
  }
  // big ring handle / knocker (frames 0,1)
  if (frame !== 2) { for (let a = 0; a < 16; a++) { const th = a / 16 * Math.PI * 2; P(g, Math.round(46 + Math.cos(th) * 4), Math.round(106 + Math.sin(th) * 4), gd[2]); } P(g, 46, 102, gd[1]); }
  // threshold
  for (let x = 14; x <= 82; x++) { P(g, x, baseY + 1, st[3]); P(g, x, baseY + 2, st[2]); }
  if (frame === 2) for (let x = 38; x <= 58; x++) { P(g, x, baseY + 1, dr[2]); }  // glow spill on ground
  outline(g, RAMP.void);
  return g;
}

/* ============================ WORDMARK PLATE (320×96, 2 frames) ============================
   Ornate bone-and-gold frame with drift-purple inlay to sit behind NAEVYR. */
function drawWordmarkPlate(frame) {
  frame = frame || 0;
  const W = 320, Hh = 96, g = makeGrid(W, Hh);
  const bn = RAMP.bone, gd = RAMP.gold, dr = RAMP.drift;
  const x0 = 6, x1 = W - 7, y0 = 14, y1 = Hh - 15;
  // outer bevel plate (bone), inset
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = Math.min(x - x0, x1 - x, y - y0, y1 - y);
    let c = bn[2];
    if (edge < 2) c = bn[3];
    else if (edge < 4) c = (y - y0 < (y1 - y0) / 2) ? bn[1] : bn[2];
    else if (edge < 5) c = bn[0];
    else c = null;                                   // hollow center (text sits here)
    if (c) P(g, x, y, c);
  }
  // gold inner rails
  for (let x = x0 + 6; x <= x1 - 6; x++) { P(g, x, y0 + 6, gd[1]); P(g, x, y1 - 6, gd[2]); }
  for (let y = y0 + 6; y <= y1 - 6; y++) { P(g, x0 + 6, y, gd[1]); P(g, x1 - 6, y, gd[2]); }
  // drift-purple inlay dots along the gold rail (pulse on frame 1)
  const lit = frame === 1;
  for (let x = x0 + 12; x <= x1 - 12; x += 12) { P(g, x, y0 + 6, lit ? dr[0] : dr[1]); P(g, x, y1 - 6, lit ? dr[0] : dr[1]); if (lit) { P(g, x, y0 + 5, dr[2]); P(g, x, y1 - 5, dr[2]); } }
  // ornate corner flourishes (gold scrollwork)
  function corner(cx, cy, sx, sy) {
    for (let k = 0; k < 10; k++) P(g, cx + sx * k, cy, gd[1]);
    for (let k = 0; k < 10; k++) P(g, cx, cy + sy * k, gd[1]);
    // little curl
    P(g, cx + sx * 9, cy + sy, gd[0]); P(g, cx + sx * 10, cy + sy * 2, gd[2]); P(g, cx + sx, cy + sy * 9, gd[0]);
    // drift gem at the corner
    P(g, cx + sx * 2, cy + sy * 2, lit ? dr[0] : dr[1]); P(g, cx + sx * 3, cy + sy * 2, dr[2]); P(g, cx + sx * 2, cy + sy * 3, dr[2]);
  }
  corner(x0 + 4, y0 + 4, 1, 1); corner(x1 - 4, y0 + 4, -1, 1); corner(x0 + 4, y1 - 4, 1, -1); corner(x1 - 4, y1 - 4, -1, -1);
  // center top & bottom finials
  [[(x0 + x1) >> 1, y0 - 1, -1], [(x0 + x1) >> 1, y1 + 1, 1]].forEach(([fx, fy, dir]) => {
    for (let k = 0; k < 5; k++) { const w = 4 - k; for (let i = -w; i <= w; i++) P(g, fx + i, fy + dir * k, i === 0 ? gd[0] : gd[1]); }
    P(g, fx, fy + dir * 5, lit ? dr[0] : dr[1]);
  });
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const LANDING = {
  hero_vista:     { fn: drawHeroVista,     cell: [480, 270], anchor: [240, 269], frames: 2, anim: { name: 'shimmer', fps: 2 }, scene: true },
  gate_door:      { fn: drawGateDoor,      cell: [96, 128],  anchor: [48, 127],  frames: 3, anim: { name: 'ward', fps: 3 } },
  wordmark_plate: { fn: drawWordmarkPlate, cell: [320, 96],  anchor: [160, 48],  frames: 2, anim: { name: 'inlay', fps: 2 } },
};

Object.assign(globalThis, {
  drawHeroVista, navIcon, NAV_ICONS, drawGateDoor, drawWordmarkPlate, LANDING,
});
