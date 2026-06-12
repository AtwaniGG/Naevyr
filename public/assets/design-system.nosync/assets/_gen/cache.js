// NAEVYR — DRIFT CACHE (HUD/engine reveal art). Eval after pixlib.js + tiles.js.
// Small ornate chest, 64×64, bottom-center anchor (32,58). Dark iron + drift-
// violet seams. 3 states: sealed(1f) · opening(2f, lid cracking w/ violet light)
// · burst(2f, light column + motes). Rect-grid, RAMP only, 1px void outline on
// the solid chest, outline-free glow for light/motes.

const CACHE_N = 64, CC_X = 32, CC_BASE = 58;

// the chest body (shared); lidLift raises the lid + opens a glowing gap
function chestBody(g, lidLift) {
  const st = RAMP.stone, ir0 = '#1a1626', dr = RAMP.drift, gd = RAMP.gold;
  const cx = CC_X, w = 17, bodyTop = 34, bodyBot = CC_BASE;
  // --- body box (dark iron) ---
  for (let y = bodyTop; y <= bodyBot; y++) for (let x = cx - w; x <= cx + w; x++) {
    let c = '#2a2438'; if (x < cx - w + 2) c = '#3a3350'; if (x > cx + w - 2) c = ir0;
    if (y > bodyBot - 3) c = ir0;
    P(g, x, y, c);
  }
  // wood staves between iron bands
  for (let x = cx - w + 1; x <= cx + w - 1; x++) { if ((x - cx) % 5 === 0) for (let y = bodyTop + 1; y < bodyBot - 1; y++) P(g, x, y, RAMP.dirt[3]); }
  // iron corner brackets + drift-violet seams
  for (let y = bodyTop; y <= bodyBot; y++) { P(g, cx - w, y, ir0); P(g, cx + w, y, ir0); if (y % 2 === 0) { P(g, cx - w + 1, y, dr[3]); P(g, cx + w - 1, y, dr[3]); } }
  // gold lockplate
  fillRect(g, cx - 3, bodyTop + 4, 6, 7, gd[2]); P(g, cx, bodyTop + 7, RAMP.void); fillRect(g, cx - 2, bodyTop + 4, 4, 1, gd[1]);
  P(g, cx, bodyTop + 6, gd[0]);

  // --- lid (raised by lidLift) ---
  const lidBot = bodyTop, lidH = 13;
  const ly = lidBot - lidLift;
  // glowing gap revealed under a lifted lid
  if (lidLift > 0) {
    for (let yy = ly; yy < lidBot; yy++) for (let x = cx - w + 1; x <= cx + w - 1; x++) {
      const t = (yy - ly) / Math.max(1, lidBot - ly);
      let c = dr[3]; if (t > 0.3) c = dr[2]; if (t > 0.6) c = dr[1]; if (t > 0.85) c = dr[0];
      if (hash2(x, yy, 9) < 0.25) c = dr[0];
      P(g, x, yy, c);
    }
  }
  // arched lid
  for (let x = cx - w; x <= cx + w; x++) {
    const u = (x - cx) / w;
    const arch = Math.round((1 - u * u) * 6);
    for (let y = ly - lidH - arch + 6; y <= ly; y++) {
      let c = '#2a2438'; if (x < cx - w + 2) c = '#3a3350'; if (x > cx + w - 2) c = ir0;
      if (y <= ly - lidH - arch + 7) c = '#3a3350';                 // top highlight
      P(g, x, y, c);
    }
  }
  // lid iron bands + violet seam along the rim
  for (let x = cx - w; x <= cx + w; x++) { const u = (x - cx) / w; const arch = Math.round((1 - u * u) * 6); P(g, x, ly, ir0); P(g, x, ly - 1, dr[3]); if ((x - cx) % 6 === 0) for (let y = ly - lidH - arch + 7; y < ly; y++) P(g, x, y, RAMP.dirt[3]); }
  return { cx, w, bodyTop, lidTopY: ly - lidH };
}

function drawCacheSealed() {
  const g = makeGrid(CACHE_N, CACHE_N);
  chestBody(g, 0);
  // faint dormant violet glow in the seams
  outline(g, RAMP.void);
  return g;
}
function drawCacheOpening(frame) {  // 0,1 — lid cracking
  const g = makeGrid(CACHE_N, CACHE_N);
  const lift = frame === 0 ? 4 : 9;
  chestBody(g, lift);
  // escaping light slivers at the crack
  const dr = RAMP.drift;
  for (let i = -2; i <= 2; i++) { const x = CC_X + i * 5; P(g, x, 34 - lift - 1, dr[0]); if (frame) P(g, x, 34 - lift - 3, dr[1]); }
  outline(g, RAMP.void);
  // motes (outline-free) added AFTER outline so they stay glow
  if (frame) for (let i = 0; i < 6; i++) { const x = CC_X - 8 + (i * 3); const y = 30 - (i % 3) * 3; P(g, x, y, i % 2 ? dr[0] : dr[2]); }
  return g;
}
function drawCacheBurst(frame) {   // 0,1 — light column + motes
  const g = makeGrid(CACHE_N, CACHE_N);
  chestBody(g, 11);
  outline(g, RAMP.void);
  const dr = RAMP.drift, gd = RAMP.gold;
  const cx = CC_X, topGlow = 33 - 11;
  // vertical light column rising from the open chest (dithered, widening)
  const h = frame ? 30 : 22, halfMax = frame ? 9 : 6;
  for (let k = 0; k < h; k++) {
    const t = k / h;
    const hw = Math.round((1 - t) * halfMax) + 1;
    const yy = topGlow - k;
    for (let x = cx - hw; x <= cx + hw; x++) {
      const edge = Math.abs(x - cx) >= hw - 1;
      if (edge && (x + yy) % 2 !== 0) continue;                     // dithered edge
      let c = dr[2]; if (Math.abs(x - cx) < hw - 2) c = dr[1]; if (Math.abs(x - cx) <= 1) c = (k < h * 0.6 ? dr[0] : RAMP.bone[0]);
      if (t > 0.8 && Math.abs(x - cx) <= 1) c = gd[0];              // gold sparks at the crest
      P(g, x, yy, c);
    }
  }
  // burst motes flying out + up
  const mr = mulberry(frame + 5);
  const N = frame ? 22 : 14;
  for (let i = 0; i < N; i++) {
    const a = (-90 + (mr() - 0.5) * 150) * Math.PI / 180;           // mostly upward fan
    const r = 6 + mr() * (frame ? 26 : 16);
    const x = Math.round(cx + Math.cos(a) * r), y = Math.round(topGlow + Math.sin(a) * r);
    P(g, x, y, mr() < 0.3 ? gd[0] : mr() < 0.6 ? dr[0] : dr[1]);
    if (mr() < 0.3) P(g, x, y + 1, dr[3]);
  }
  return g;
}

const CACHE = {
  drift_cache: {
    cell: [CACHE_N, CACHE_N], anchor: [CC_X, CC_BASE], ramp: 'iron(stone) + drift + gold',
    states: {
      sealed:  { fn: () => [drawCacheSealed()],                 frames: 1, fps: 0 },
      opening: { fn: () => [drawCacheOpening(0), drawCacheOpening(1)], frames: 2, fps: 6 },
      burst:   { fn: () => [drawCacheBurst(0), drawCacheBurst(1)],     frames: 2, fps: 8 },
    },
  },
};

Object.assign(globalThis, { CACHE_N, CC_X, CC_BASE, chestBody, drawCacheSealed, drawCacheOpening, drawCacheBurst, CACHE });
