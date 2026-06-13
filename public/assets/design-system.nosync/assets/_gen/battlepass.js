// NAEVYR — BATTLE PASS "ASHFALL" (Season 1). Eval after pixlib.js + tiles.js
// (hash2) + character.js (drawWanderer/WANDER_FACINGS/WANDER_ANIMS) and, for the
// aura preview, after auras.js (gmote/gmoteBig/solidOn/AURA_* helpers).
//
// Season-exclusive, ornate, gilded-but-corrupted cosmetics:
//   1. tarnished_chalice  — a 64×64 prestige AURA (auras.js conventions). A small
//      generic two-handled trophy cup hovering above the wanderer: gilded (gold
//      ramp) but pitted & rot-eaten at the rim with the Drift (drift ramp) creeping
//      in; its DETACHED LID slowly orbits the head while gilded motes rise from the
//      feet. 3-frame loop @4fps. anchor 32,56 aligns to the wanderer's 16,39.
//   2. ashfall_dye        — a wanderer CLOAK COLORWAY delivered as the existing
//      dye-channel ramp swap (locked-ramp names, baked at draw time, no new rig):
//      ash-grey base + banded gold trim + faint drift-purple corruption at the hem.
//   3. pass_emblem        — a 32×32 pixel sigil (+ -mono bone variant) reading as a
//      "seasonal ledger": a gilded chalice mark over a furled parchment banner with
//      drift-corruption flecks. For panel headers / docs.
//
// Rules (locked): RAMP ramps only; 1px void outline on solid forms; particles/
// motes are outline-free glow; dither, never blur; crispEdges; bottom-center /
// frames emitted left-to-right with a per-frame x offset.

/* ===================================================================== */
/* 1 · TARNISHED CHALICE — prestige aura (gold + drift)                  */
/* ===================================================================== */
// Uses auras.js globals: AURA_N(64), AURA_CX(32), AURA_FEET(56), gmote, solidOn.
// Cup floats above the head (y8..16); the detached lid orbits the head (~y30);
// gilded motes rise the full column from the feet up into the cup.
function drawTarnishedChalice(frame) {
  const N = (typeof AURA_N !== 'undefined') ? AURA_N : 64;
  const g = makeGrid(N, N);
  const gd = RAMP.gold, dr = RAMP.drift;
  const cx = 32;
  const fp = frame / 3;                       // 3-frame loop

  // ---- gilded motes rising from the feet up into the cup (outline-free) ----
  const M = 7;
  for (let i = 0; i < M; i++) {
    const t = ((i / M) + fp) % 1;             // 0 born at feet .. 1 spent at cup
    if (t < 0.04 || t > 0.95) continue;
    const y = 54 - t * 37;                    // 54 → ~17 (just under the foot)
    const sway = Math.sin(t * Math.PI * 2 + i * 1.7) * 3.2;
    const x = cx + sway + (i % 2 ? 2 : -2);
    const c = t < 0.4 ? gd[2] : t < 0.72 ? gd[1] : gd[0];
    gmote(g, x, y, c, (t > 0.45 && i % 2 === 0) ? gd[3] : null);
    if (t < 0.5) P(g, Math.round(x), Math.round(y + 1), gd[3]); // brief trailing spark
  }

  // ---- the gilded two-handled trophy cup (solid, void-outlined) ----
  solidOn(g, t => {
    const row = (y, x0, x1) => {
      for (let x = x0; x <= x1; x++) {
        let c = gd[1];
        if (x === x0) c = gd[0];              // moonlit left
        if (x === x1) c = gd[2];              // shadow right
        P(t, x, y, c);
      }
    };
    // bowl
    row(8, 28, 36); row(9, 28, 36); row(10, 29, 35); row(11, 30, 34); row(12, 31, 33);
    // stem
    P(t, 32, 13, gd[2]); P(t, 32, 14, gd[2]);
    // foot
    row(15, 30, 34); row(16, 29, 35);
    P(t, 30, 16, gd[2]); P(t, 35, 16, gd[3]);
    // loop handles
    P(t, 27, 9, gd[1]); P(t, 26, 10, gd[1]); P(t, 26, 11, gd[2]); P(t, 27, 12, gd[2]);
    P(t, 37, 9, gd[1]); P(t, 38, 10, gd[2]); P(t, 38, 11, gd[3]); P(t, 37, 12, gd[3]);
    // a couple of interior value steps so the gold reads as recovered, not flat
    P(t, 30, 9, gd[0]); P(t, 34, 10, gd[3]); P(t, 31, 11, gd[0]);
  });

  // ---- rim rot: the Drift eats the gold rim (dither + a chipped void notch) ----
  P(g, 34, 8, dr[2]); P(g, 33, 9, dr[3]); P(g, 35, 9, dr[2]);
  P(g, 36, 8, RAMP.void);                     // a chip pitted out of the rim
  if (frame % 2 === 0) P(g, 35, 11, dr[2]);   // a corruption droplet weeping down
  P(g, 29, 8, dr[3]);                         // far-rim pitting

  // ---- the DETACHED LID orbiting the head (solid, outlined) ----
  const ang = fp * Math.PI * 2 - Math.PI * 0.5;
  const lx = Math.round(cx + Math.cos(ang) * 12);
  const ly = Math.round(30 + Math.sin(ang) * 4);
  const far = Math.sin(ang) < -0.15;          // upper/back arc → dimmer, behind head
  solidOn(g, t => {
    const a = far ? gd[2] : gd[0], b = far ? gd[3] : gd[1];
    P(t, lx - 2, ly, b); P(t, lx - 1, ly, a); P(t, lx, ly, a); P(t, lx + 1, ly, a); P(t, lx + 2, ly, b);
    P(t, lx - 1, ly - 1, a); P(t, lx, ly - 1, a); P(t, lx + 1, ly - 1, b);
    P(t, lx, ly - 2, b);                      // knob
  });
  if (!far) P(g, lx + 1, ly, dr[2]);          // matching rot on the lid

  return g;
}

const BP_AURAS = {
  tarnished_chalice: {
    fn: drawTarnishedChalice, frames: 3, fps: 4, ramp: 'gold + drift',
    desc: 'Gilded, rot-eaten two-handled trophy cup; detached lid orbits the head, gilded motes rise.',
    tier: 'season-exclusive', season: 'S01 Ashfall',
  },
};

/* ===================================================================== */
/* 2 · ASHFALL DYE — wanderer cloak colorway (existing dye-channel swap) */
/* ===================================================================== */
// Same mechanism as avatars.js (AVATAR_CHANNELS + resolveLook): each channel
// resolves to a LOCKED RAMP, baked at draw time — no new rig. The look post-
// processes the stock wanderer grid: stone→base ramp swap, drift→corrupt ramp
// swap, then banded trim + faint hem corruption painted on the garment.
const DYE_RAMP = {
  stone: RAMP.stone, bone: RAMP.bone, dirt: RAMP.dirt, blood: RAMP.blood,
  grass: RAMP.grass, gold: RAMP.gold, ember: RAMP.ember, drift: RAMP.drift, water: RAMP.water,
};
// three cosmetic channels, each a list of locked-ramp options (mirrors AVATAR_CHANNELS shape)
const WANDERER_DYE_CHANNELS = {
  base:    ['stone', 'bone', 'dirt', 'blood', 'grass'],   // cloak/hood body
  trim:    ['gold', 'ember', 'bone', 'drift', 'blood'],   // banded trim
  corrupt: ['drift', 'blood', 'ember', 'water', 'grass'],  // hem corruption + eyes
};
// named season colorways (look = {base,trim,corrupt} ramp names)
const WANDERER_DYES = {
  ashfall: {
    base: 'stone', trim: 'gold', corrupt: 'drift',
    note: 'ash-grey base, banded gold trim, faint drift-purple corruption at the hem',
  },
};
function resolveDye(look) {
  look = look || WANDERER_DYES.ashfall;
  const pick = (chan, v) => {
    const opts = WANDERER_DYE_CHANNELS[chan];
    if (v == null) return DYE_RAMP[opts[0]];
    if (typeof v === 'number') return DYE_RAMP[opts[Math.max(0, Math.min(opts.length - 1, v))]];
    return DYE_RAMP[v] || DYE_RAMP[opts[0]];
  };
  return { base: pick('base', look.base), trim: pick('trim', look.trim), corrupt: pick('corrupt', look.corrupt) };
}

function drawWandererDyed(facing, anim, f, look) {
  const { base, trim, corrupt } = resolveDye(look);
  const g = drawWanderer(facing, anim, f);   // stock rig: stone cloak, drift hem/eyes, void outline

  // 1) ramp swap (skip void outline / anything off-ramp)
  const map = {};
  RAMP.stone.forEach((c, i) => { map[c] = base[Math.min(i, base.length - 1)]; });
  RAMP.drift.forEach((c, i) => { map[c] = corrupt[Math.min(i, corrupt.length - 1)]; });
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y); if (v && map[v.c]) P(g, x, y, map[v.c]);
  }

  // 2) banded gold trim — adaptive scan per row across the garment interior
  const bob = (anim === 'walk') ? [0, -1, 0, 0, -1, 0][f] : 0;
  const baseSet = new Set(base);
  const bandRow = (y, midC, loC, hiC) => {
    let lo = 99, hi = -1;
    for (let x = 0; x < g.w; x++) { const v = G(g, x, y); if (v && baseSet.has(v.c)) { if (x < lo) lo = x; if (x > hi) hi = x; } }
    if (hi < lo) return;
    for (let x = lo; x <= hi; x++) { const v = G(g, x, y); if (v && baseSet.has(v.c)) P(g, x, y, x === lo ? loC : x === hi ? hiC : midC); }
  };
  bandRow(20 + bob, trim[1], trim[0], trim[2]);   // collar
  bandRow(32 + bob, trim[1], trim[0], trim[2]);   // mid-hem band
  bandRow(34 + bob, trim[2], trim[1], trim[3] || trim[2]); // lower band

  // 3) faint drift-purple corruption creeping up the hem
  for (let x = 0; x < g.w; x++) for (let y = 31 + bob; y <= 34 + bob; y++) {
    const v = G(g, x, y); if (v && baseSet.has(v.c) && hash2(x, y, 137) < 0.10) P(g, x, y, corrupt[3]);
  }
  return g;
}

function ashfallDyeSheetGrids(look) {
  return WANDER_FACINGS.map(fc => {
    const row = [];
    WANDER_ANIMS.forEach(([anim, n]) => { for (let f = 0; f < n; f++) row.push(drawWandererDyed(fc, anim, f, look)); });
    return row;
  });
}

/* ===================================================================== */
/* 3 · PASS EMBLEM — 32×32 "seasonal ledger" sigil (+ -mono)             */
/* ===================================================================== */
// A gilded two-handled chalice mark over a furled parchment banner (the season's
// ledger), with drift-corruption flecks. mono = the bone-only variant.
function drawPassEmblem(mono) {
  const g = makeGrid(32, 32);
  const GOLD = mono ? RAMP.bone : RAMP.gold;
  const PARCH = RAMP.bone;                     // parchment banner (ledger)
  const TRIM = mono ? RAMP.bone : RAMP.gold;
  const ROT = mono ? RAMP.bone : RAMP.drift;
  const pb = mono ? 2 : 1;                      // parchment darkened a step in mono for contrast

  // ---- furled parchment banner (behind): a hanging ledger scroll ----
  // rolled furl bar across the top (overhangs the body → reads as a furled roll)
  for (let x = 7; x <= 24; x++) P(g, x, 10, PARCH[mono ? 2 : 0]);
  for (let x = 7; x <= 24; x++) P(g, x, 11, PARCH[3]);
  P(g, 6, 10, PARCH[3]); P(g, 6, 11, PARCH[2]); P(g, 25, 10, PARCH[3]); P(g, 25, 11, PARCH[2]); // rolled end curls
  // draped body (narrower than the furl bar)
  for (let y = 12; y <= 23; y++) {
    const lo = 9, hi = 22;
    for (let x = lo; x <= hi; x++) {
      let c = PARCH[pb];
      if (x === lo) c = PARCH[mono ? 1 : 0];
      if (x === hi) c = PARCH[mono ? 3 : 2];
      P(g, x, y, c);
    }
  }
  // ledger rule-lines (full horizontal strokes)
  [15, 18, 21].forEach(y => { for (let x = 11; x <= 20; x++) P(g, x, y, PARCH[3]); });
  // forked swallowtail bottom (two tails + a center V-notch)
  for (let y = 24; y <= 27; y++) {
    const k = y - 24;
    for (let x = 9; x <= 13 - k; x++) P(g, x, y, x === 9 ? PARCH[mono ? 1 : 0] : PARCH[pb]);
    for (let x = 18 + k; x <= 22; x++) P(g, x, y, x === 22 ? PARCH[mono ? 3 : 2] : PARCH[pb]);
  }
  // gold trim bands (top & bottom of the draped body)
  for (let x = 9; x <= 22; x++) P(g, x, 12, TRIM[1]);
  for (let x = 10; x <= 21; x++) P(g, x, 23, TRIM[2]);

  // ---- gilded two-handled chalice mark (front, on the banner) ----
  const crow = (y, x0, x1) => { for (let x = x0; x <= x1; x++) { let c = GOLD[1]; if (x === x0) c = GOLD[0]; if (x === x1) c = GOLD[2]; P(g, x, y, c); } };
  crow(4, 13, 19); crow(5, 13, 19); crow(6, 14, 18); crow(7, 15, 17);   // bowl
  P(g, 16, 8, GOLD[2]); P(g, 16, 9, GOLD[2]);                            // stem
  crow(10, 13, 19); P(g, 13, 10, GOLD[0]); P(g, 19, 10, GOLD[2]);        // foot
  // loop handles
  P(g, 12, 4, GOLD[1]); P(g, 11, 5, GOLD[1]); P(g, 11, 6, GOLD[2]); P(g, 12, 7, GOLD[2]);
  P(g, 20, 4, GOLD[1]); P(g, 21, 5, GOLD[2]); P(g, 21, 6, GOLD[3]); P(g, 20, 7, GOLD[3]);
  // rim rot on the chalice
  P(g, 18, 4, ROT[mono ? 3 : 2]); P(g, 19, 4, ROT[mono ? 3 : 3]);

  outline(g, RAMP.void);

  // ---- drift-corruption flecks (outline-free, after outline) ----
  if (!mono) {
    P(g, 9, 17, RAMP.drift[2]); P(g, 8, 17, RAMP.drift[3]);     // corruption eating the left edge
    P(g, 22, 20, RAMP.drift[2]); P(g, 23, 20, RAMP.drift[3]);   // right edge
    P(g, 16, 25, RAMP.drift[3]);                                // a fleck in the notch
  } else {
    P(g, 9, 17, RAMP.bone[3]); P(g, 22, 20, RAMP.bone[3]); P(g, 16, 25, RAMP.bone[3]);
  }
  return g;
}

const BATTLEPASS = {
  season: 'S01 Ashfall',
  theme: 'ornate · gilded-but-corrupted · season-exclusive',
  assets: {
    tarnished_chalice: { kind: 'aura', cell: '64×64', anchor: '32,56', frames: 3, fps: 4, ramp: 'gold + drift' },
    ashfall_dye:       { kind: 'wanderer dye', cell: '32×40', anchor: '16,39', ramp: 'stone(base) + gold(trim) + drift(corrupt)' },
    pass_emblem:       { kind: 'sigil', cell: '32×32', ramp: 'gold + bone + drift', variants: ['', '-mono'] },
  },
};

Object.assign(globalThis, {
  drawTarnishedChalice, BP_AURAS,
  DYE_RAMP, WANDERER_DYE_CHANNELS, WANDERER_DYES, resolveDye,
  drawWandererDyed, ashfallDyeSheetGrids,
  drawPassEmblem, BATTLEPASS,
});
