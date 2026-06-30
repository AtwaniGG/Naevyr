// Naevyr ECHO FX — eval after pixlib.js + tiles.js (for hash2).
// Drift-shimmer overlays sized to the 32×40 wanderer rig (feet row y=37,
// bottom-center anchor [16,37]). These composite OVER a half-alpha wanderer so
// an "Echo" (a replayed past wanderer) reads as a ghost. Alpha is intentional —
// these are FX, NOT outlined (corruption/drift FX never get the void outline).

// Approximate silhouette envelope of the wanderer rig: y -> [x0,x1] (inclusive)
// or null. Matches the 32×40 avatar body so wisps hug the edges and the
// materialize puff fills the right footprint.
function wandererEnvelope() {
  const env = [];
  for (let y = 0; y < 40; y++) {
    if (y < 6) { env.push(null); continue; }          // above head
    else if (y < 16) env.push([12, 19]);              // head + hood
    else if (y < 20) env.push([11, 20]);              // shoulders
    else if (y < 31) env.push([10, 21]);              // torso + arms
    else if (y <= 37) env.push([12, 19]);             // legs
    else env.push(null);                              // below feet
  }
  return env;
}

/* ============================ ECHO VEIL (32×40, 3 frames @3fps loop) ============================
   Faint vertical drift-wisps + rising motes that cling to the wanderer's edges.
   Subtle by design — edges only, low alpha — so the body shows through. */
function drawEchoVeil(frame) {
  frame = frame || 0;
  const g = makeGrid(32, 40);
  const env = wandererEnvelope();
  const dr = RAMP.drift;

  // edge wisps: faint vertical motes just outside the body edges, phase-shifted
  // per frame so they shimmer/rise.
  for (let y = 6; y <= 37; y++) {
    const e = env[y]; if (!e) continue;
    const ph = y + frame * 2;
    if (ph % 3 === 0)       P(g, e[0] - 1, y, dr[1], 0.34);   // left outer wisp
    if ((y + frame) % 4 === 0) P(g, e[0], y, dr[0], 0.22);    // left inner shimmer
    if ((ph + 1) % 3 === 0) P(g, e[1] + 1, y, dr[1], 0.34);   // right outer wisp
    if ((y + frame + 2) % 4 === 0) P(g, e[1], y, dr[0], 0.22);// right inner shimmer
    // sparse bright vein nodes along the seam
    if (hash2(e[0], y, 711) < 0.04) P(g, e[0] - 1, y, dr[0], 0.5);
    if (hash2(e[1], y, 712) < 0.04) P(g, e[1] + 1, y, dr[0], 0.5);
  }

  // a handful of interior motes drifting upward (same set, shifted by frame)
  const motes = [[14, 34], [18, 30], [12, 25], [20, 21], [16, 15], [19, 37], [11, 29], [21, 18]];
  motes.forEach(([mx, my], i) => {
    let yy = my - frame * 2;
    while (yy < 6) yy += 32;                                  // wrap up through the body
    const e = env[yy]; if (!e) return;
    const x = Math.min(Math.max(mx, e[0]), e[1]);
    P(g, x, yy, i % 2 ? dr[0] : dr[1], 0.3);
  });

  // crown shimmer — a couple of motes lifting off the head
  const crownY = 5 - frame;
  if (crownY >= 0) { P(g, 15, crownY, dr[0], 0.28); P(g, 17, crownY + 1, dr[1], 0.22); }
  // NOTE: no outline — FX overlay.
  return g;
}

/* ============================ ECHO FADE (32×40, 4 frames, one-shot) ============================
   Materialize/dissolve puff: drift motes gather INTO the wanderer silhouette
   across frames 0→3. Play forward to spawn an Echo, reversed to despawn it. */
function drawEchoFade(frame) {
  frame = frame || 0;
  const g = makeGrid(32, 40);
  const env = wandererEnvelope();
  const dr = RAMP.drift;
  const rng = mulberry(733);

  const dens   = [0.14, 0.42, 0.72, 1][frame];               // silhouette fill ratio
  const spread = [5, 4, 2, 0][frame];                        // how far motes scatter outside

  // fill the silhouette with motes, density rising toward frame 3
  for (let y = 6; y <= 37; y++) {
    const e = env[y]; if (!e) continue;
    for (let x = e[0]; x <= e[1]; x++) {
      const h = hash2(x, y, 73);
      if (h < dens) {
        const c = h < dens * 0.3 ? dr[0] : h < dens * 0.6 ? dr[1] : dr[2];
        P(g, x, y, c, 0.3 + 0.6 * dens);
      }
    }
  }

  // scattered outer motes — many while forming, gone once solid
  if (spread > 0) {
    for (let i = 0; i < 26; i++) {
      const ey = 6 + Math.floor(rng() * 32);
      const e = env[ey]; if (!e) continue;
      const side = rng() < 0.5 ? -1 : 1;
      const off = 1 + Math.floor(rng() * spread);
      const x = side < 0 ? e[0] - off : e[1] + off;
      P(g, x, ey, rng() < 0.5 ? dr[0] : dr[1], 0.22 + 0.06 * (4 - spread));
    }
  }
  // NOTE: no outline — FX overlay.
  return g;
}

/* ============================ REGISTRY ============================ */
const ECHOFX = {
  echo_veil: { fn: drawEchoVeil, cell: [32, 40], anchor: [16, 37], frames: 3, anim: { name: 'shimmer', fps: 3, loop: true }, overlay: true, compositeOver: 'wanderer 32×40 @ half alpha' },
  echo_fade: { fn: drawEchoFade, cell: [32, 40], anchor: [16, 37], frames: 4, anim: { name: 'materialize', fps: 8, loop: false }, overlay: true, note: 'forward = spawn, reversed = despawn' },
};

Object.assign(globalThis, {
  wandererEnvelope, drawEchoVeil, drawEchoFade, ECHOFX,
});
