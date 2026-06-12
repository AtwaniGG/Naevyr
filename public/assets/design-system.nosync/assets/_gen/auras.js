// NAEVYR PRESTIGE AURAS — eval after pixlib.js + tiles.js (+ character.js for
// preview). Procedural orbiting-mote cosmetics baked per-frame around the
// wanderer (32×40, bottom-center anchor 16,39). Each aura canvas is 64×64 with
// its own bottom-center FEET anchor at (32,56): align that point to the
// wanderer's (16,39) anchor (engine offset = aura(32,56) over char(16,39)).
//
// Rules: rect-grid, dither not blur, RAMP ramps only, crispEdges. Particles/
// motes are outline-free glow (like ambient drift motes); only solid wisp forms
// get the 1px void outline. Frames emitted left-to-right (per-frame x offset).

const AURA_N = 64, AURA_CX = 32, AURA_FEET = 56, AURA_HEAD = 18;

// glow mote: optional plus-halo (dimmer) + core; outline-free
function gmote(g, x, y, core, halo) {
  x = Math.round(x); y = Math.round(y);
  if (halo) { P(g, x - 1, y, halo); P(g, x + 1, y, halo); P(g, x, y - 1, halo); P(g, x, y + 1, halo); }
  P(g, x, y, core);
}
// big premium mote: 2×2 core + diamond halo
function gmoteBig(g, x, y, core, hi, halo) {
  x = Math.round(x); y = Math.round(y);
  if (halo) { P(g, x - 2, y, halo); P(g, x + 2, y, halo); P(g, x, y - 2, halo); P(g, x, y + 2, halo); P(g, x - 1, y - 1, halo); P(g, x + 1, y - 1, halo); P(g, x - 1, y + 1, halo); P(g, x + 1, y + 1, halo); }
  P(g, x, y, core); P(g, x + 1, y, hi); P(g, x, y + 1, hi); P(g, x + 1, y + 1, hi);
}
// draw a solid form on a temp grid, 1px void outline, stamp onto dest
function solidOn(dest, drawFn) {
  const t = makeGrid(AURA_N, AURA_N);
  drawFn(t);
  outline(t, RAMP.void);
  stamp(dest, t, 0, 0);
}

/* ===================== 1 · ASHEN CROWN (gold + bone + ash) ===================== */
// A slow ring of drifting ash flecks hovering above/around the head, crowned by
// a faint gold arc. 8 frames, 6 fps.
function drawAshenCrown(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const gd = RAMP.gold, bn = RAMP.bone, ash = RAMP.ash;
  const cx = AURA_CX, cy = AURA_HEAD - 3, rx = 15, ry = 6;
  const fp = frame / 8;

  // floating crown arc (solid, outlined) — prongs riding a gentle curved band
  solidOn(g, t => {
    const span = 13;
    // curved band: y dips at the ends (a tiara arc over the head)
    for (let x = cx - span; x <= cx + span; x++) {
      const u = (x - cx) / span;                       // -1..1
      const yb = Math.round(cy + 2 + u * u * 3 + Math.sin(fp * Math.PI * 2 + x * 0.25) * 0.4);
      P(t, x, yb, gd[2]);
      if ((x - cx) % 4 === 0) P(t, x, yb - 1, gd[1]);  // beaded highlights, not a solid rail
    }
    // five prongs of unequal height rising off the band
    for (let i = -2; i <= 2; i++) {
      const px = cx + i * 6;
      const u = i / 2;
      const bandY = Math.round(cy + 2 + u * u * 3);
      const bob = Math.sin(fp * Math.PI * 2 + i) * 0.6;
      const h = (i === 0 ? 6 : Math.abs(i) === 1 ? 4 : 3);
      for (let k = 0; k < h; k++) P(t, px, Math.round(bandY - 1 - k + bob), k === h - 1 ? gd[0] : gd[1]);
    }
  });
  // gem on the center prong
  gmote(g, cx, cy - 7 + Math.round(Math.sin(fp * Math.PI * 2) * 0.6), bn[0], gd[1]);

  // orbiting ash flecks (outline-free), slow drift, depth-dimmed on the far arc
  const M = 14;
  for (let i = 0; i < M; i++) {
    const ang = (i / M) * Math.PI * 2 + fp * Math.PI * 2 * 0.5;
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry + Math.sin(fp * Math.PI * 2 + i) * 0.8;
    const far = Math.sin(ang) < -0.2;       // upper/back arc
    const pick = i % 5;
    let c = pick === 0 ? gd[0] : pick === 1 ? bn[0] : pick === 2 ? bn[1] : pick === 3 ? gd[1] : ash;
    if (far) c = (pick < 2) ? gd[2] : bn[3];
    if (i % 4 === (frame % 4)) gmote(g, x, y, c, far ? null : (pick === 0 ? gd[2] : bn[3]));
    else P(g, Math.round(x), Math.round(y), c);
    // trailing ash speck
    if (!far && i % 3 === 0) P(g, Math.round(x - Math.cos(ang)), Math.round(y - Math.sin(ang)), ash);
  }
  return g;
}

/* =================== 2 · CORRUPTION HALO (drift ramp) =================== */
// A pulsing violet ring around the whole figure with motes spiraling inward —
// the player reads as a small Drift. 6 frames, 8 fps.
function drawCorruptionHalo(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const dr = RAMP.drift;
  const cx = AURA_CX, cy = 35, fp = frame / 6;
  const pulse = Math.sin(fp * Math.PI * 2);
  const rx = 17 + pulse * 2, ry = 9 + pulse;

  // the pulsing ring (dotted drift motes on an iso ellipse)
  const RING = 26;
  for (let i = 0; i < RING; i++) {
    const ang = (i / RING) * Math.PI * 2 + fp * Math.PI * 0.5;
    const x = cx + Math.cos(ang) * rx, y = cy + Math.sin(ang) * ry;
    const far = Math.sin(ang) < 0;
    if ((i + frame) % 2 === 0) {
      const bright = pulse > 0.4 && i % 4 === 0;
      gmote(g, x, y, far ? dr[3] : (bright ? dr[0] : dr[2]), far ? null : dr[4]);
    }
  }
  // motes spiraling INWARD toward the core
  const SP = 10;
  for (let i = 0; i < SP; i++) {
    const t = ((frame + i * 0.6) % 6) / 6;            // 0 outer .. 1 core
    const r = (1 - t) * 22 + 3;
    const ang = i / SP * Math.PI * 2 + t * Math.PI * 2.2;
    const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.5;
    const c = t > 0.7 ? dr[0] : t > 0.4 ? dr[1] : dr[2];
    gmote(g, x, y, c, t > 0.5 ? dr[3] : null);
  }
  // pulsing core (the small Drift) at chest height
  const corec = pulse > 0 ? dr[0] : dr[1];
  gmoteBig(g, cx, cy - 1, corec, dr[1], dr[3]);
  if (pulse > 0.5) { P(g, cx, cy - 4, dr[2]); P(g, cx, cy + 2, dr[2]); P(g, cx - 3, cy - 1, dr[2]); P(g, cx + 3, cy - 1, dr[2]); }
  return g;
}

/* ===================== 3 · EMBER CINDER (ember + blood) ===================== */
// Rising ember sparks that swirl upward and fade to blood-ash. 6 frames, 8 fps.
function drawEmberCinder(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const em = RAMP.ember, bl = RAMP.blood;
  const cx = AURA_CX;
  const K = 16;
  for (let i = 0; i < K; i++) {
    const t = ((frame + i * 1.7) % 6) / 6;            // 0 born at feet .. 1 spent at top
    const y = AURA_FEET - 2 - t * 46;
    const swirl = Math.sin(t * Math.PI * 2 + i * 1.3) * (11 * (1 - t * 0.35));
    const x = cx + swirl + (i % 2 ? 1 : -1) * 2;
    if (t > 0.92) continue;                            // fade out at the crest
    let core, halo;
    if (t < 0.3) { core = em[0]; halo = em[1]; }       // hot newborn spark
    else if (t < 0.6) { core = em[1]; halo = em[2]; }
    else { core = bl[1]; halo = i % 2 ? bl[2] : em[3]; } // cooling to blood-ash
    if (t < 0.25 && i % 3 === 0) gmoteBig(g, x, y, em[0], em[1], em[2]);
    else gmote(g, x, y, core, (t < 0.7 && i % 2 === 0) ? halo : null);
    // upward trailing wisp
    if (t < 0.7) P(g, Math.round(x), Math.round(y + 1), t < 0.4 ? em[2] : bl[3]);
  }
  // a low ember glow at the feet (source)
  for (let x = cx - 5; x <= cx + 5; x++) if ((x + frame) % 2 === 0) P(g, x, AURA_FEET, x % 3 ? em[3] : em[2]);
  return g;
}

/* ======================== 4 · BONEWISP (bone ramp) ======================== */
// Pale skeletal wisps orbiting low around the feet/legs — eerie and cold.
// 8 frames, 6 fps.
function drawBonewisp(frame) {
  const g = makeGrid(AURA_N, AURA_N);
  const bn = RAMP.bone, dr = RAMP.drift;
  const cx = AURA_CX, cy = 49, rx = 15, ry = 5, fp = frame / 8;
  const W = 5;
  // back wisps first (drawn dimmer), then front
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < W; i++) {
      const ang = (i / W) * Math.PI * 2 + fp * Math.PI * 2;
      const far = Math.sin(ang) < 0;
      if ((pass === 0) !== far) continue;
      const x = cx + Math.cos(ang) * rx;
      const y = cy + Math.sin(ang) * ry;
      const flick = Math.sin(fp * Math.PI * 2 * 2 + i) > 0 ? 1 : 0;
      // small flame/comma wisp, solid + void outline
      solidOn(g, t => {
        const tip = far ? bn[2] : bn[0], body = far ? bn[3] : bn[1], base = bn[3];
        P(t, Math.round(x), Math.round(y - 2 - flick), tip);
        P(t, Math.round(x), Math.round(y - 1), body);
        P(t, Math.round(x), Math.round(y), body);
        P(t, Math.round(x + (i % 2 ? 1 : -1)), Math.round(y), base);
        P(t, Math.round(x), Math.round(y + 1), base);
      });
      // cold drift glint in the wisp's eye-hollow (sparingly)
      if (!far && i === (frame % W)) P(g, Math.round(x), Math.round(y - 1), dr[1]);
      // trailing cold spark
      if (!far) gmote(g, x - Math.cos(ang) * 2, y - Math.sin(ang) * 2, bn[2], null);
    }
  }
  // faint ground mist ring at the feet
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + fp * Math.PI; const x = cx + Math.cos(a) * (rx - 2); const y = cy + 3 + Math.sin(a) * (ry - 1); if ((i + frame) % 2 === 0) P(g, Math.round(x), Math.round(y), bn[3]); }
  return g;
}

const AURAS = {
  ashen_crown:     { fn: drawAshenCrown,     frames: 8, fps: 6, ramp: 'gold + bone + ash', desc: 'Slow ring of drifting ash flecks crowning the head.' },
  corruption_halo: { fn: drawCorruptionHalo, frames: 6, fps: 8, ramp: 'drift',             desc: 'Pulsing violet ring with motes spiraling inward; the player as a small Drift.' },
  ember_cinder:    { fn: drawEmberCinder,    frames: 6, fps: 8, ramp: 'ember + blood',     desc: 'Rising ember sparks swirling upward, cooling to blood-ash.' },
  bonewisp:        { fn: drawBonewisp,       frames: 8, fps: 6, ramp: 'bone',              desc: 'Pale skeletal wisps orbiting low around the feet; eerie and cold.' },
};

Object.assign(globalThis, {
  AURA_N, AURA_CX, AURA_FEET, AURA_HEAD, gmote, gmoteBig, solidOn,
  drawAshenCrown, drawCorruptionHalo, drawEmberCinder, drawBonewisp, AURAS, solidOn,
});
