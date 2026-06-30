// Naevyr SPECTATOR / DEMO SET — eval after pixlib.js (+ landing.js for nav style).
// An eye nav glyph for the existing nav_icons family, a read-only "observing"
// frame overlay, and a banner plate matching the landing wordmark_plate.

/* ============================ EYE ICON (16×16, nav_icons style) ============================
   Open eye, drift iris. bone silhouette + 1px void outline, tintable — drop into
   the nav_icons family. */
function drawEyeIcon() {
  const g = makeGrid(16, 16);
  const I = RAMP.bone[1], D = RAMP.bone[3], H = RAMP.bone[0], dr = RAMP.drift;
  const cx = 8, cy = 8;
  // almond eye: sin-arc opening, sclera fill + lid edges
  for (let x = 3; x <= 13; x++) {
    const t = (x - 3) / 10;
    const span = Math.round(Math.sin(t * Math.PI) * 4);
    for (let yy = -span; yy <= span; yy++) P(g, x, cy + yy, I);
    P(g, x, cy - span, D); P(g, x, cy + span, D);
  }
  // drift iris
  for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) { if (xx * xx + yy * yy > 5) continue; P(g, cx + xx, cy + yy, dr[2]); }
  for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { if (xx * xx + yy * yy > 2) continue; P(g, cx + xx, cy + yy, dr[1]); }
  P(g, cx, cy, RAMP.void);          // pupil
  P(g, cx - 1, cy - 1, dr[0]);      // glint
  P(g, 5, cy - 1, H);               // sclera highlight
  outline(g, RAMP.void);
  return g;
}

/* ============================ WATCH FRAME (480×270, 2f pulse @2fps) ============================
   Read-only spectator overlay: a thin drift-rune border + soft corner darkening
   that says "observing" without blocking the world. Center stays transparent.
   Alpha + dither (no blur); no outline — it's an overlay. */
function drawWatchFrame(frame) {
  frame = frame || 0;
  const W = 480, H = 270, g = makeGrid(W, H);
  const dr = RAMP.drift, lit = frame === 1;

  // soft corner darkening (checkerboard-dithered alpha, quantized to keep it crisp)
  const cornerR = 96;
  [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].forEach(([cxp, cyp]) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if ((x + y) % 2 !== 0) continue;
      const d = Math.hypot(x - cxp, y - cyp);
      if (d > cornerR) continue;
      let a = (1 - d / cornerR) * 0.85;
      a = Math.round(a / 0.17) * 0.17;            // quantize to ~5 alpha steps
      if (a >= 0.17) P(g, x, y, RAMP.void, a);
    }
  });

  // thin dashed rune border, inset
  const inset = 6, x0 = inset, y0 = inset, x1 = W - 1 - inset, y1 = H - 1 - inset;
  const edge = lit ? dr[0] : dr[1], dim = lit ? dr[1] : dr[2];
  for (let x = x0; x <= x1; x++) { const on = x % 6 < 3; P(g, x, y0, on ? edge : dim, on ? 0.7 : 0.4); P(g, x, y1, on ? edge : dim, on ? 0.7 : 0.4); }
  for (let y = y0; y <= y1; y++) { const on = y % 6 < 3; P(g, x0, y, on ? edge : dim, on ? 0.7 : 0.4); P(g, x1, y, on ? edge : dim, on ? 0.7 : 0.4); }

  // corner rune marks
  function runeMark(px, py, sx, sy) {
    P(g, px, py, edge, 0.9);
    P(g, px + sx * 3, py, edge, 0.8); P(g, px, py + sy * 3, edge, 0.8);
    P(g, px + sx * 2, py + sy * 2, dim, 0.6);
    if (lit) P(g, px + sx, py + sy, dr[0], 0.7);
  }
  runeMark(x0 + 3, y0 + 3, 1, 1); runeMark(x1 - 3, y0 + 3, -1, 1);
  runeMark(x0 + 3, y1 - 3, 1, -1); runeMark(x1 - 3, y1 - 3, -1, -1);
  return g; // no outline — transparent-center overlay
}

/* ============================ WATCH PLATE (200×28) ============================
   "You are watching the realm" banner plate — landing wordmark_plate style
   (bone bevel + gold rails + drift inlay). Hollow center holds DOM text. */
function drawWatchPlate() {
  const W = 200, Hh = 28, g = makeGrid(W, Hh);
  const bn = RAMP.bone, gd = RAMP.gold, dr = RAMP.drift;
  const x0 = 4, x1 = W - 5, y0 = 3, y1 = Hh - 4;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const edge = Math.min(x - x0, x1 - x, y - y0, y1 - y);
    let c = bn[2];
    if (edge < 1) c = bn[3];
    else if (edge < 2) c = (y - y0 < (y1 - y0) / 2) ? bn[1] : bn[2];
    else if (edge < 3) c = bn[0];
    else c = null;
    if (c) P(g, x, y, c);
  }
  for (let x = x0 + 3; x <= x1 - 3; x++) { P(g, x, y0 + 3, gd[1]); P(g, x, y1 - 3, gd[2]); }
  for (let y = y0 + 3; y <= y1 - 3; y++) { P(g, x0 + 3, y, gd[1]); P(g, x1 - 3, y, gd[2]); }
  for (let x = x0 + 10; x <= x1 - 10; x += 11) { P(g, x, y0 + 3, dr[1]); P(g, x, y1 - 3, dr[1]); }
  [[x0 + 3, y0 + 3], [x1 - 3, y0 + 3], [x0 + 3, y1 - 3], [x1 - 3, y1 - 3]].forEach(([gx, gy]) => P(g, gx, gy, dr[0]));
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const SPECTATE = {
  eye_icon:    { fn: drawEyeIcon,    cell: [16, 16],   anchor: [8, 8],     frames: 1, tintable: true, family: 'nav_icons' },
  watch_frame: { fn: drawWatchFrame, cell: [480, 270], anchor: [240, 135], frames: 2, anim: { name: 'pulse', fps: 2, loop: true }, overlay: true },
  watch_plate: { fn: drawWatchPlate, cell: [200, 28],  anchor: [100, 14],  frames: 1, dom: true },
};

Object.assign(globalThis, {
  drawEyeIcon, drawWatchFrame, drawWatchPlate, SPECTATE,
});
