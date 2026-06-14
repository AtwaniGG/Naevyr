// Naevyr FRONTIER EXPANSION · WAYSTATION — fast-travel monolith.
// Eval after pixlib.js + tiles.js + town.js (foundation) + threshold.js (tDisc/tRing/gateSigil).
// A rune-arch standing-stone GATEWAY — kin to the Ash Obelisk in silhouette weight
// (tapered weathered stone, drift-crystal crown, glowing runes) but a portal, not a spire.
// Sits on a DIRT apron (its ground pad must NOT rely on grass).
// 64×112, bottom-center anchor (32,111), top 6px reserved for the label.
// One sheet: frame 0 = SEALED (runes dormant, portal dark), frames 1-3 = ACTIVE
// rune-pulse @4fps (runes lit + portal glow swirl + rising light column).
// RAMP only, 1px void auto-outline, dither not blur, moonlit-left/shadowed-right.

function drawWaystation(active, frame) {
  frame = frame || 0;
  const g = makeGrid(64, 112);
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone, gd = RAMP.gold;
  const cx = 32, baseY = 104;

  // ---- DIRT apron (packed earth + stone plinth + ash drifts) — no grass ----
  if (typeof foundation === 'function') foundation(g, cx, baseY + 2, 27, { ash: true });

  // ---- active ground glow on the apron (dithered drift, pulses) ----
  if (active) {
    const reach = [6, 8, 7][frame];
    for (let dy = -4; dy <= 6; dy++) for (let dx = -24; dx <= 24; dx++) {
      if ((dx / 24) ** 2 + (dy / 7) ** 2 > 1) continue;
      const d = Math.abs(dx) / 3 + Math.abs(dy);
      if ((dx + dy + frame) % 2 === 0 && d > 4 && d < reach + 14 && hash2(dx, dy, 501) < 0.4)
        P(g, cx + dx, baseY + 4 + dy, dr[3]);
    }
  }

  // ---- two leaning standing stones ----
  const postBot = baseY, postTop = 34;
  function stone(side) {                 // side: -1 left (moonlit), +1 right (shadow)
    for (let y = postBot; y >= postTop; y--) {
      const t = (postBot - y) / (postBot - postTop);
      const cxp = cx + side * (16 - Math.round(t * 4));        // lean inward at the top
      const hw = Math.round(6 - t * 1.2);
      for (let x = -hw; x <= hw; x++) {
        const sx = cxp + x;
        let c = side < 0 ? st[1] : st[2];
        if (x < -hw + 2) c = side < 0 ? st[0] : st[1];          // left face lighter
        else if (x > hw - 2) c = st[3];                          // right face darker
        if (hash2(sx, y, 502) < 0.06) c = st[2];                 // pitting
        if (hash2(sx, y, 503) < 0.02) c = st[3];                 // cracks
        P(g, sx, y, c);
      }
    }
    // weathered chips knocked off the outer edge
    const rng = mulberry(504 + side);
    for (let i = 0; i < 5; i++) {
      const y = postTop + 6 + Math.floor(rng() * (postBot - postTop - 12));
      const t = (postBot - y) / (postBot - postTop);
      const cxp = cx + side * (16 - Math.round(t * 4));
      const hw = Math.round(6 - t * 1.2);
      P(g, cxp + side * hw, y, RAMP.void);
      P(g, cxp + side * (hw - 1), y, st[3]);
    }
  }
  stone(-1); stone(1);

  // ---- the arch (semicircle band spanning the post tops) ----
  const archCx = cx, archCy = postTop + 4, archR = 21, band = 8;
  if (typeof tDisc === 'function') {
    tDisc(g, archCx, archCy, archR, (x, y, d) => {
      if (y > archCy) return;
      if (d > archR || d < archR - band) return;
      let c = (x < archCx) ? st[1] : st[2];
      const edge = d > archR - 1.4 || d < archR - band + 1.4;
      if (edge) c = st[3];
      else if (hash2(x, y, 505) < 0.07) c = st[2];
      if (x < archCx - archR + 4) c = st[0];
      P(g, x, y, c);
    });
    // arch iso depth (shadow recede up-right)
    for (let dd = 1; dd <= 4; dd++) tDisc(g, archCx, archCy, archR, (x, y, d) => {
      if (y > archCy) return; if (d > archR || d < archR - band) return; if (x < archCx + 6) return;
      P(g, x + dd, y - Math.floor(dd / 2), st[3]);
    });
  }

  // ---- keystone block at the crown, carrying the gate sigil ----
  const ksY = archCy - archR - 1;
  for (let j = 0; j < 12; j++) for (let i = -7; i <= 7; i++) {
    const t = Math.abs(i) / 7;
    if (j < 2 && t > 0.6) continue;                              // chamfered top corners
    let c = i < 0 ? st[1] : st[2];
    if (i < -5) c = st[0]; if (i > 5) c = st[3];
    if (j === 0) c = st[0];
    if (hash2(cx + i, ksY + j, 506) < 0.08) c = st[2];
    P(g, cx + i, ksY + j, c);
  }
  if (typeof gateSigil === 'function') gateSigil(g, cx, ksY + 6, 5, active);

  // ---- drift-crystal shard crown above the keystone (Ash-Obelisk kinship) ----
  const cty = ksY - 1;
  for (let k = 0; k < 9; k++) {
    const w = Math.max(0, Math.round((1 - k / 9) * 3));
    for (let i = -w; i <= w; i++) {
      let c = dr[2]; if (i < 0) c = dr[1]; if (i > 0) c = dr[3]; if (i === 0 && k < 6) c = dr[0];
      P(g, cx + i, cty - k, c);
    }
  }
  P(g, cx, cty - 9, dr[0]);
  // crown halo (dither, brightens when active)
  if (active) {
    const rr = [6, 8, 7][frame];
    for (let yy = -8; yy <= 4; yy++) for (let xx = -7; xx <= 7; xx++) {
      const d = Math.abs(xx) + Math.abs(yy);
      if (d > 4 && d < rr && (xx + yy + frame) % 2 === 0) P(g, cx + xx, cty - 4 + yy, dr[2]);
    }
  }

  // ---- the portal opening (between posts, under the arch) ----
  const pl = cx - 9, pr = cx + 9, ptop = archCy, pbot = baseY - 2;
  for (let y = ptop; y <= pbot; y++) for (let x = pl; x <= pr; x++) {
    const underArch = (x - archCx) ** 2 + (y - archCy) ** 2 <= (archR - band) ** 2 || y >= archCy;
    if (!underArch) continue;
    if (active) {
      const t = (y - ptop) / (pbot - ptop);
      let c = dr[4] || dr[3];
      if ((x + y) % 2 === 0) c = t < 0.5 ? dr[3] : (dr[4] || dr[3]);
      if (Math.abs(x - cx) < 6 && hash2(x, y + frame, 507) < 0.20) c = dr[2];     // shifting glow
      if (Math.abs(x - cx) < 3 && hash2(x, y - frame * 2, 508) < 0.14) c = dr[1]; // bright core
      P(g, x, y, c);
    } else {
      // sealed: dark void with a single dormant vertical drift seam
      let c = RAMP.void;
      if (x === cx && (y % 3 !== 0)) c = dr[3];
      if (x === cx && y % 6 === 0) c = dr[2];
      P(g, x, y, c);
    }
  }

  // ---- carved runes down the inner faces of the posts (pulse when active) ----
  const lit = active ? [dr[2], dr[1], dr[0]][frame] : dr[3];
  const dim = active ? [dr[3], dr[2], dr[1]][frame] : '#3b1162';
  const runeYs = [pbot - 12, pbot - 28, pbot - 44, pbot - 58];
  runeYs.forEach((ry, i) => {
    if (ry < ptop + 2) return;
    [[pl - 1, 1], [pr + 1, -1]].forEach(([rx, dir]) => {
      const on = active ? ((frame + i) % 3) !== 2 : false;
      const col = on ? lit : dim;
      P(g, rx, ry, col); P(g, rx + dir, ry, col);
      P(g, rx, ry + 1, col); P(g, rx, ry - 1, on ? dim : '#3b1162');
    });
  });

  // ---- active: rising column of dithered drift light up the gateway ----
  if (active) {
    const H = [16, 26, 12][frame];
    for (let k = 0; k < H; k++) {
      const y = pbot - 6 - k, t = k / H;
      const w = Math.max(1, Math.round((1 - t) * 4));
      for (let x = -w; x <= w; x++) {
        const ax = cx + x, core = Math.abs(x) <= 1;
        if (y < ptop - 10) continue;
        if (core) { if (G(g, ax, y) || y < ptop) P(g, ax, y, t < 0.3 ? dr[0] : dr[1]); }
        else if ((ax + y + frame) % 2 === 0 && hash2(ax, y, 509) < (1 - t) * 0.8) P(g, ax, y, dr[2]);
      }
    }
    // escaping motes
    const mr = mulberry(510 + frame);
    for (let i = 0; i < 5; i++) {
      const mx = cx + Math.round((mr() - 0.5) * 16);
      const my = ptop + Math.round(mr() * (pbot - ptop)) - frame * 2;
      if (my > ptop - 12) P(g, mx, my, mr() < 0.4 ? dr[0] : dr[1]);
    }
    // glow spill at the threshold
    for (let x = pl; x <= pr; x++) if ((x + frame) % 3 === 0) P(g, x, pbot + 1, dr[2]);
  }

  outline(g, RAMP.void);
  return g;
}

// 16×16 fast-travel map / minimap pip — matches the nav-icon / arrow-pip style.
// 2 frames: the gateway drift-mote pulses (dim → bright + halo).
function drawWaystationPip(frame) {
  frame = frame || 0;
  const g = makeGrid(16, 16);
  const st = RAMP.stone, dr = RAMP.drift, dt = RAMP.dirt;
  const cx = 8;
  // two short standing posts
  for (let y = 6; y <= 13; y++) {
    P(g, 4, y, st[0]); P(g, 5, y, st[1]);
    P(g, 10, y, st[2]); P(g, 11, y, st[3]);
  }
  // arched lintel across the top
  for (let x = 4; x <= 11; x++) P(g, x, 5, x < 8 ? st[1] : st[2]);
  P(g, 5, 4, st[1]); P(g, 6, 4, st[0]); P(g, 9, 4, st[2]); P(g, 10, 4, st[3]);
  P(g, 7, 3, st[1]); P(g, 8, 3, st[2]);                 // crown notch
  // dirt apron line
  for (let x = 3; x <= 12; x++) P(g, x, 14, dt[3]);
  P(g, 4, 13, dt[2]); P(g, 11, 13, dt[2]);
  // gateway drift mote (pulses by frame)
  const bright = frame === 1;
  const mx = 8, my = 10;
  P(g, mx, my, bright ? dr[0] : dr[2]);
  P(g, mx - 1, my, bright ? dr[1] : dr[3]);
  P(g, mx, my - 1, bright ? dr[1] : dr[3]);
  P(g, mx, my + 1, dr[2]);
  if (bright) {
    P(g, mx + 1, my, dr[1]); P(g, mx - 1, my - 1, dr[2]); P(g, mx + 1, my - 1, dr[2]);
    P(g, mx, my - 2, dr[2]); P(g, mx - 2, my, dr[3]); P(g, mx + 2, my, dr[3]);
  }
  outline(g, RAMP.void);
  return g;
}

/* ============================ REGISTRY ============================ */
const WAYSTATION = {
  waystation: {
    fn: (i) => i === 0 ? drawWaystation(false, 0) : drawWaystation(true, i - 1),
    cell: [64, 112], anchor: [32, 111], frames: 4, footprint: '3x3', tile: true, labelClear: true,
    states: {
      sealed: { frames: [0], fps: 1, loop: false },
      active: { frames: [1, 2, 3], fps: 4, loop: true },
    },
    anim: { name: 'rune_pulse', fps: 4, frames: [1, 2, 3] },
  },
  waystation_pip: {
    fn: (i) => drawWaystationPip(i),
    cell: [16, 16], anchor: [8, 8], frames: 2, anim: { name: 'pulse', fps: 2 },
  },
};

Object.assign(globalThis, {
  drawWaystation, drawWaystationPip, WAYSTATION,
});
