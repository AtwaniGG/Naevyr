// Naevyr WORLDCHOICE ART PACK — eval after pixlib.js + tiles.js (hash2).
// DOM art (served as SVG exports, animated with CSS steps() like the landing
// set) — NOT engine-ported. Rect-grid, RAMP only, dither not blur, crispEdges,
// 1px void outline on the seal (vistas are scenes → no global outline).
//
// "Choose your path" cards, both 256×160 so they tile as equal columns:
//   guest_vista — safe walled threshold camp at dusk, warm lantern glow, one
//     open stone gateway, calm dirt ground, NO corruption. "Free, no risk."
//   realm_vista — the full Waystation skyline sprawling under a creeping violet
//     Drift corruption haze. Towers, banners, scale. "The real, wallet-gated world."
//   guest_seal — 32×32 bone sigil (open padlock) = "guest / no wallet".

const WC_W = 256, WC_H = 160;

// ordered 2px dither between two colors over a vertical band a→b
function wcSky(g, bands, W) {
  bands.forEach(([y0, y1, a, b]) => {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        const dith = ((x + y) % 2 === 0) ? t : t - 0.5;
        P(g, x, y, dith > 0.5 ? b : a);
      }
    }
  });
}

/* ===================== GUEST VISTA (256×160, 2f, NO corruption) ===================== */
function drawGuestVista(frame) {
  frame = frame || 0;
  const W = WC_W, H = WC_H, g = makeGrid(W, H);
  const horizon = 100;
  const st = RAMP.stone, dt = RAMP.dirt, em = RAMP.ember, gd = RAMP.gold, bn = RAMP.bone;

  // warm dusk sky
  wcSky(g, [
    [0, 20, RAMP.void, '#14101c'],
    [20, 42, '#14101c', '#1d1722'],
    [42, 64, '#1d1722', '#2a2030'],
    [64, 84, '#2a2030', '#3a2a22'],
    [84, horizon, '#3a2a22', '#4d3320'],
  ], W);

  // setting-sun warm bloom on the horizon, centered behind the gate
  const sx = 128;
  for (let yy = -30; yy <= 6; yy++) for (let xx = -46; xx <= 46; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy * 2.4); if (d > 46) continue;
    const t = 1 - d / 46;
    if ((xx + yy) % 2 === 0 && hash2(sx + xx, horizon + yy, 11) < t * 0.75) {
      P(g, sx + xx, horizon + yy, t > 0.62 ? '#7c3a06' : t > 0.34 ? '#562a14' : '#37200f');
    }
  }
  // sun disc just over the horizon
  for (let yy = -6; yy <= 6; yy++) for (let xx = -7; xx <= 7; xx++) { if (xx * xx + yy * yy > 46) continue; P(g, sx + xx, horizon - 12 + yy, (xx * xx + yy * yy > 30) ? em[3] : em[2]); }
  // distant warm ridge
  for (let x = 0; x < W; x++) { const r = horizon - 6 - Math.round(4 * Math.sin(x * 0.022) + 3 * Math.sin(x * 0.07)); for (let y = r; y < horizon; y++) P(g, x, y, '#241812'); }
  // a few faint warm stars high up
  const rng = mulberry(21); for (let i = 0; i < 22; i++) { const px = Math.floor(rng() * W), py = Math.floor(rng() * 46); P(g, px, py, rng() < 0.3 ? bn[2] : '#3a2c24'); }

  // calm dirt ground
  for (let y = horizon; y < H; y++) {
    const t = (y - horizon) / (H - horizon);
    for (let x = 0; x < W; x++) { let c = t < 0.4 ? dt[2] : t < 0.78 ? dt[3] : '#19120b'; if ((x + y) % 2 === 0 && hash2(x, y, 22) < 0.05 * (1 - t)) c = dt[1]; P(g, x, y, c); }
  }
  // packed path leading to the gate
  for (let y = horizon; y < H; y++) { const t = (y - horizon) / (H - horizon); const wdt = Math.round(5 + t * 30); for (let x = sx - wdt; x <= sx + wdt; x++) if ((x + y) % 3 === 0) P(g, x, y, dt[1]); }

  // --- low stone perimeter wall with a single open gateway ---
  for (let x = 22; x <= 234; x++) for (let y = horizon - 13; y <= horizon - 1; y++) {
    if (x > 110 && x < 146 && y > horizon - 12) continue;            // gateway opening
    let c = st[2]; if ((x % 15) < 1) c = st[3]; if (y <= horizon - 12) c = st[1]; if (hash2(x, y, 23) < 0.06) c = st[3]; P(g, x, y, c);
  }
  for (let x = 22; x <= 232; x += 9) { if (x > 106 && x < 150) continue; fillRect(g, x, horizon - 15, 4, 2, st[1]); } // crenellations

  // gateway arch (stone), open, warm glow inside
  const gx = 128;
  for (let y = horizon - 25; y <= horizon - 1; y++) for (const dx of [[-18, -13], [13, 18]]) for (let x = gx + dx[0]; x <= gx + dx[1]; x++) { let c = st[1]; if (x < gx - 16 || x > gx + 16) c = st[3]; if (hash2(x, y, 24) < 0.06) c = st[2]; P(g, x, y, c); }
  for (let x = gx - 18; x <= gx + 18; x++) { const a = Math.round(Math.sqrt(Math.max(0, 18 * 18 - (x - gx) * (x - gx)))); const ty = horizon - 7 - a; for (let y = ty; y <= ty + 4; y++) P(g, x, y, st[2]); P(g, x, ty, st[1]); }
  // warm interior of the gateway
  for (let y = horizon - 20; y <= horizon - 1; y++) for (let x = gx - 12; x <= gx + 12; x++) {
    const a = Math.round(Math.sqrt(Math.max(0, 12 * 12 - (x - gx) * (x - gx))));
    if (y < horizon - 7 - a) continue;
    const fl = frame === 1; const d = Math.abs(x - gx);
    let c = '#2a1a0f'; if (d < 7) c = em[3]; if (d < 4) c = fl ? em[1] : em[2]; if (d < 2 && y > horizon - 10) c = fl ? em[0] : em[1];
    P(g, x, y, c);
  }
  // flanking lanterns on the gate posts
  for (const lx of [gx - 22, gx + 22]) { const ly = horizon - 19; P(g, lx, ly - 2, st[3]); P(g, lx, ly - 1, st[3]); fillRect(g, lx - 1, ly, 3, 3, frame ? em[0] : em[1]); for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (Math.abs(xx) + Math.abs(yy) === 3 && (xx + yy + frame) % 2 === 0) P(g, lx + xx, ly + 1 + yy, em[2]); }

  // --- campfire in front of the gate (warm, flickers) ---
  const fx = 128, fy = horizon + 22;
  fillRect(g, fx - 5, fy, 11, 2, st[3]); for (let i = 0; i < 9; i++) P(g, fx - 4 + i, fy - 1, i % 2 ? em[2] : em[3]);
  const fh = frame ? 6 : 5;
  for (let yy = 0; yy <= fh; yy++) { const hw = Math.max(0, Math.round((1 - yy / (fh + 1)) * 3)); for (let xx = -hw; xx <= hw; xx++) { let c = yy < 2 ? em[2] : Math.abs(xx) === hw ? em[3] : yy < fh - 1 ? em[1] : em[0]; P(g, fx + xx, fy - 2 - yy, c); } }
  for (let yy = -2; yy <= 3; yy++) for (let xx = -9; xx <= 9; xx++) { const d = Math.abs(xx) + Math.abs(yy) * 2; if (d > 5 && d < 10 && (xx + yy) % 2 === 0) P(g, fx + xx, fy + yy, dt[1]); }
  for (let i = 0; i < 6; i++) { const t = ((i / 6) + (frame ? 0.5 : 0)) % 1; const ey = fy - 6 - t * 20; const ex = fx + Math.sin(t * 6.28 + i) * 5 + (i % 2 ? 3 : -3); P(g, Math.round(ex), Math.round(ey), t < 0.5 ? em[1] : em[3]); }

  // --- small tents either side (a safe little camp) ---
  function tent(tx, by, c) {
    for (let yy = 0; yy < 11; yy++) { const hw = Math.round(yy * 0.9); for (let xx = -hw; xx <= hw; xx++) { let cc = c[2]; if (xx < -hw + 1) cc = c[1]; if (xx > hw - 1) cc = c[3]; P(g, tx + xx, by - 10 + yy, cc); } }
    P(g, tx, by - 11, c[1]); for (let yy = 0; yy < 6; yy++) P(g, tx, by - yy, c[3]);   // pole tip + door slit
  }
  tent(56, horizon + 12, dt); tent(198, horizon + 14, dt);
  // a warm gold pennant on a pole (no corruption)
  const pbx = 88; for (let y = horizon - 17; y <= horizon - 1; y++) P(g, pbx, y, st[3]); for (let yy = 0; yy < 6; yy++) { const ww = 5 - yy; for (let xx = 0; xx < ww; xx++) P(g, pbx + 1 + xx, horizon - 16 + yy, xx === ww - 1 ? gd[2] : gd[1]); }

  return g; // scene: no global outline
}

/* ===================== REALM VISTA (256×160, 2f, violet Drift haze) ===================== */
function drawRealmVista(frame) {
  frame = frame || 0;
  const W = WC_W, H = WC_H, g = makeGrid(W, H);
  const horizon = 106;
  const st = RAMP.stone, dr = RAMP.drift, bl = RAMP.blood, gd = RAMP.gold, em = RAMP.ember, bn = RAMP.bone, dt = RAMP.dirt;

  // cool violet dusk sky
  wcSky(g, [
    [0, 22, RAMP.void, '#13101d'],
    [22, 46, '#13101d', RAMP.ash],
    [46, 72, RAMP.ash, '#241d33'],
    [72, 92, '#241d33', '#2f2440'],
    [92, horizon, '#2f2440', '#3a2c4e'],
  ], W);
  // cold moon, upper right
  const mx = 206, my = 36;
  for (let yy = -8; yy <= 8; yy++) for (let xx = -8; xx <= 8; xx++) { if (xx * xx + yy * yy > 64) continue; let c = bn[2]; if (xx + yy < -3) c = bn[1]; if (xx * xx + yy * yy > 44) c = bn[3]; P(g, mx + xx, my + yy, c); }
  const rng = mulberry(31); for (let i = 0; i < 46; i++) { const px = Math.floor(rng() * W), py = Math.floor(rng() * (horizon - 16)); if (Math.abs(px - mx) < 12 && Math.abs(py - my) < 12) continue; P(g, px, py, rng() < 0.3 ? bn[1] : bn[3]); }

  // distant city ridge (back haze layer) just under the horizon
  for (let x = 0; x < W; x++) { const r = horizon - 2 - Math.round(3 * Math.sin(x * 0.05 + 1)); for (let y = r; y < horizon; y++) P(g, x, y, '#1c1729'); }

  // ground plane (cool, dark), with a faint path
  for (let y = horizon; y < H; y++) { const t = (y - horizon) / (H - horizon); for (let x = 0; x < W; x++) { let c = t < 0.4 ? '#1a1626' : t < 0.78 ? '#13101d' : RAMP.void; if ((x + y) % 2 === 0 && hash2(x, y, 32) < 0.05 * (1 - t)) c = st[3]; P(g, x, y, c); } }
  for (let y = horizon; y < H; y++) { const t = (y - horizon) / (H - horizon); const wdt = Math.round(4 + t * 26); for (let x = 128 - wdt; x <= 128 + wdt; x++) if ((x + y) % 3 === 0) P(g, x, y, '#241d33'); }

  // --- building helpers ---
  function building(bx, by, w, hh, roof, lit, flick) {
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) { let c = st[2]; if (x < 1) c = st[1]; if (x > w - 2) c = st[3]; if (hash2(bx + x, by - y, 71) < 0.05) c = st[3]; P(g, bx + x, by - y, c); }
    for (let d = 1; d <= 2; d++) for (let y = 0; y < hh; y++) P(g, bx + w - 1 + d, by - y - Math.floor(d / 2), st[3]); // right depth
    for (let x = -1; x <= w; x++) { const dd = Math.abs(x - (w - 1) / 2); const ry = by - hh - Math.round((w / 2 - dd) * 0.6); for (let y = ry; y <= by - hh + 1; y++) P(g, bx + x, y, roof); }
    if (lit) for (let wy = 2; wy < hh - 1; wy += 4) for (let wx = 1; wx < w - 1; wx += 3) { const on = !flick || frame === 0 || (wx + wy) % 2 === 0; fillRect(g, bx + wx, by - wy, 1, 2, on ? em[1] : em[3]); }
  }
  function tower(bx, by, w, hh, roof, lit) {
    building(bx, by, w, hh, roof, lit, false);
    // battlements
    for (let x = -1; x <= w; x += 2) P(g, bx + x, by - hh - 1, st[1]);
    // a banner hung on the tower face (drift or blood), 2-frame sway
    const sway = frame ? 1 : 0; const bcol = roof === bl[2] ? bl : dr;
    const bxk = bx + (w >> 1) - 1, byk = by - hh + 4;
    for (let y = 0; y < 9; y++) for (let x = 0; x < 3; x++) { let c = bcol[2]; if (x === 0) c = bcol[1]; if (x === 2) c = bcol[3]; if (y > 6 && x === 1) continue; P(g, bxk + x + (y > 4 ? sway : 0), byk + y, c); }
    P(g, bxk + 1, byk - 1, gd[1]);
  }

  // back row: many small buildings receding along the horizon
  const seed = mulberry(33);
  for (let bx = 4; bx < W - 10; bx += 12 + Math.floor(seed() * 7)) {
    const w = 7 + Math.floor(seed() * 6), hh = 7 + Math.floor(seed() * 11);
    const roof = seed() < 0.28 ? bl[2] : seed() < 0.6 ? st[3] : dt[3];
    building(bx, horizon - 1 + Math.floor(seed() * 3), w, hh, roof, seed() < 0.72, seed() < 0.4);
  }
  // prominent towers (scale)
  tower(40, horizon + 1, 11, 36, bl[2], true);
  tower(150, horizon, 13, 44, st[3], true);
  tower(206, horizon + 2, 9, 30, dr[3], true);

  // --- creeping violet Drift corruption haze along the horizon, bleeding up ---
  for (let x = 0; x < W; x++) {
    const top = horizon - 18 - Math.round(8 * Math.sin(x * 0.028) + 4 * Math.sin(x * 0.1 + frame));
    for (let y = top; y < horizon + 2; y++) {
      const t = (y - top) / (horizon + 2 - top);              // 0 faint top .. 1 dense base
      const h = hash2(x, y, 34 + frame);
      if ((x + y) % 2 === 0 && h < t * 0.42) P(g, x, y, h < t * 0.16 ? dr[2] : dr[3]);
      else if (h < t * 0.045) P(g, x, y, dr[1]);             // bright vein nodes
    }
  }

  // front-scale buildings (big, close) framing the sides
  building(10, horizon + 20, 24, 26, bl[2], true, false);
  building(W - 50, horizon + 17, 26, 28, st[3], true, true);
  // blood banner pole near the right front building
  const pbx = W - 22; for (let y = horizon - 4; y <= horizon + 12; y++) P(g, pbx, y, st[3]); for (let yy = 0; yy < 7; yy++) { const ww = 5 - Math.floor(yy / 2); for (let xx = 0; xx < ww; xx++) P(g, pbx - 1 - xx, horizon - 3 + yy, xx === ww - 1 ? bl[3] : bl[2]); }

  // drifting corruption motes (shimmer)
  const mr = mulberry(35);
  for (let i = 0; i < 54; i++) {
    let px = Math.floor(mr() * W), py = Math.floor(mr() * H);
    const d = frame ? 1 : 0; px = (px + (i % 3) * d) % W; py = (py - d + H) % H;
    if (py > horizon + 30) continue;
    const big = i % 6 === 0; P(g, px, py, big ? dr[0] : dr[1]); if (big) { P(g, px + 1, py, dr[2]); P(g, px, py + 1, dr[2]); }
  }
  // bottom vignette so overlaid UI reads
  for (let y = H - 46; y < H; y++) { const t = (y - (H - 46)) / 46; for (let x = 0; x < W; x++) if ((x + y) % 2 === 0 && hash2(x, y, 36) < t * 0.9) P(g, x, y, RAMP.void); }

  return g; // scene: no global outline
}

/* ===================== GUEST SEAL (32×32, 1f, bone) — open padlock ===================== */
function drawGuestSeal() {
  const g = makeGrid(32, 32);
  const bn = RAMP.bone;
  // round badge plate
  for (let yy = -13; yy <= 13; yy++) for (let xx = -13; xx <= 13; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy); if (d > 13) continue;
    let c = bn[2]; if (d > 11.2) c = bn[3]; else if (xx + yy < -7) c = bn[1]; else if (xx + yy > 8) c = bn[3];
    P(g, 16 + xx, 16 + yy, c);
  }
  // engraved inner ring
  for (let a = 0; a < 64; a++) { const th = a / 64 * Math.PI * 2; P(g, Math.round(16 + Math.cos(th) * 10), Math.round(16 + Math.sin(th) * 10), bn[3]); }

  // open padlock glyph — body (rounded), lower-center
  for (let y = 20; y <= 27; y++) for (let x = 11; x <= 21; x++) {
    if ((x === 11 || x === 21) && (y === 20 || y === 27)) continue;     // rounded corners
    let c = bn[1]; if (x <= 12) c = bn[0]; if (x >= 20) c = bn[3]; if (y >= 26) c = bn[3]; if (y === 20) c = bn[2];
    P(g, x, y, c);
  }
  // keyhole (circle + slot)
  P(g, 16, 22, bn[3]); P(g, 15, 23, bn[3]); P(g, 17, 23, bn[3]); P(g, 16, 23, RAMP.void); P(g, 16, 24, bn[3]); P(g, 16, 25, bn[3]);
  // bold shackle (2px). right leg seated in the body; left leg lifted OPEN (gap above body)
  for (let y = 14; y <= 20; y++) { P(g, 19, y, bn[1]); P(g, 20, y, bn[2]); }                 // right leg → into body
  [[18, 12], [17, 11], [15, 10], [13, 10], [12, 11]].forEach(([x, y]) => { P(g, x, y, bn[0]); P(g, x, y + 1, bn[1]); }); // arch
  for (let y = 12; y <= 16; y++) { P(g, 12, y, bn[1]); P(g, 11, y, bn[2]); }                 // left leg — short, sprung open
  P(g, 9, 13, bn[3]); P(g, 9, 15, bn[3]);                                                    // motion ticks

  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const WORLDCHOICE = {
  guest_vista: { fn: drawGuestVista, cell: [256, 160], anchor: [128, 159], frames: 2, anim: { name: 'shimmer', fps: 2 }, scene: true, ramps: 'stone + dirt + ember/gold (warm) — NO corruption', reads: 'free, no risk, try it' },
  realm_vista: { fn: drawRealmVista, cell: [256, 160], anchor: [128, 159], frames: 2, anim: { name: 'shimmer', fps: 2 }, scene: true, ramps: 'stone town + drift haze + blood/gold accents', reads: 'the real world, wallet-gated' },
  guest_seal:  { fn: drawGuestSeal,  cell: [32, 32],   anchor: [16, 31],   frames: 1, anim: null, ramps: 'bone only', reads: 'guest / no wallet (open padlock)' },
};

Object.assign(globalThis, {
  WC_W, WC_H, wcSky, drawGuestVista, drawRealmVista, drawGuestSeal, WORLDCHOICE,
});
