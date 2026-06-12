// Naevyr — PREMIUM AVATAR SET. Eval after pixlib.js + tiles.js (+ character.js
// for preview/scale). Four cosmetic player characters, DROP-IN COMPATIBLE with
// the wanderer rig: 32×40 cell, feet row y=37, 5 facings (s,se,e,ne,n; engine
// mirrors w/sw/nw), anims idle 2f · walk 6f · swing 4f, sheet rows=facings,
// cols=12 (idle0-1, walk0-5, swing0-3). Shoulder line y=18(+bob), swing hand
// pivot (cx+off+4, shoulderY+2), arc [-2.1,-1.35,-0.45,0.35], hit spark on f2,
// walk bob [0,-1,0,0,-1,0], idle-f1 secondary tell. RAMP only, 1px void outline.

const AV_RAMP = {
  ember: RAMP.ember, gold: RAMP.gold, blood: RAMP.blood, drift: RAMP.drift,
  bone: RAMP.bone, stone: RAMP.stone, dirt: RAMP.dirt, grass: RAMP.grass, water: RAMP.water,
};

// two cosmetic channels per character; each option names a locked ramp.
const AVATAR_CHANNELS = {
  ashbound:   { seam:   ['ember', 'gold', 'blood', 'drift', 'bone'],  wrap:   ['stone', 'dirt', 'blood', 'bone', 'drift'] },
  mireborn:   { flame:  ['ember', 'drift', 'gold', 'water', 'blood'], shawl:  ['grass', 'dirt', 'stone', 'water', 'bone'] },
  bonecaller: { socket: ['drift', 'ember', 'gold', 'blood', 'water'], mantle: ['bone', 'stone', 'gold', 'dirt', 'blood'] },
  veilborn:   { veil:   ['stone', 'drift', 'blood', 'water', 'bone'], mote:   ['drift', 'ember', 'gold', 'water', 'blood'] },
};
const AVATAR_KINDS = ['ashbound', 'mireborn', 'bonecaller', 'veilborn'];

// resolve a look {a,b} (ramp-name keys, or indices) to the two channel ramps
function resolveLook(kind, look) {
  look = look || {};
  const ch = AVATAR_CHANNELS[kind];
  const names = Object.keys(ch);
  function pick(chanName, v) {
    const opts = ch[chanName];
    if (v == null) return AV_RAMP[opts[0]];
    if (typeof v === 'number') return AV_RAMP[opts[Math.max(0, Math.min(opts.length - 1, v))]];
    if (AV_RAMP[v]) return AV_RAMP[v];
    return AV_RAMP[opts[0]];
  }
  return { rA: pick(names[0], look.a), rB: pick(names[1], look.b), names };
}

const AV_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const AV_ANIMS = [['idle', 2], ['walk', 6], ['swing', 4]];

// shared rig scalars for a frame
function rig(facing, anim, f) {
  const cx = 16;
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const off = [0, 1, 2, 1, 0][dir];
  const showFace = dir <= 2;
  const back = dir >= 3;
  let bob = 0, step = 0, hemSway = 0;
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; step = [2, 1, 0, -2, -1, 0][f]; hemSway = [0, 1, 1, 0, -1, -1][f]; }
  if (anim === 'idle') { hemSway = f === 1 ? 1 : 0; }
  return { cx, dir, off, showFace, back, bob, step, hemSway, top: 9 + bob, shoulderY: 18 + bob };
}

// shared two-foot draw (skip for veilborn). soleRamp solid, toe void.
function drawFeet(g, R, soleRamp, kind, extraStomp) {
  const footY = 37 + (extraStomp || 0);
  const fo = R.dir >= 1 ? 1 : 0;
  // left foot
  P(g, R.cx - 3 + fo + R.step, footY, soleRamp[3]); P(g, R.cx - 2 + fo + R.step, footY, RAMP.void);
  P(g, R.cx - 3 + fo + R.step, footY - 1, soleRamp[2]);
  // right foot
  P(g, R.cx + 2 + fo - R.step, footY, RAMP.void); P(g, R.cx + 3 + fo - R.step, footY, soleRamp[3]);
  P(g, R.cx + 3 + fo - R.step, footY - 1, soleRamp[2]);
}

// shared swing arm; toolFn(g, ex, ey, f) paints the per-kind weapon head/haft.
function drawSwingArm(g, R, anim, f, armRamp, toolFn) {
  if (anim !== 'swing') return;
  const hx = R.cx + R.off + 4, hy = R.shoulderY + 2;
  const ang = [-2.1, -1.35, -0.45, 0.35][f];
  for (let k = 2; k < 8; k++) {
    const x = Math.round(hx + Math.cos(ang) * k), y = Math.round(hy + Math.sin(ang) * k);
    P(g, x, y, k < 4 ? armRamp[2] : RAMP.dirt[0]);    // sleeve/forearm → haft start
  }
  const ex = Math.round(hx + Math.cos(ang) * 8), ey = Math.round(hy + Math.sin(ang) * 8);
  toolFn(g, ex, ey, f);
}

/* ===================================================================== */
/* 1 · THE ASHBOUND — burned penitent. Broad, no hood, topknot, ember    */
/*     seams through ash-grey skin, chest straps.                        */
/* ===================================================================== */
function bodyAshbound(g, R, anim, f, seam, wrap) {
  const sk = RAMP.bone;                 // ash-grey skin = bone-ramp greys (mids/darks)
  const { cx, off, dir, top, shoulderY } = R;
  const flare = anim === 'idle' && f === 1;  // ember seam flares on idle f1

  // broad torso (widest of the set)
  for (let y = shoulderY; y <= 31; y++) {
    const t = (y - shoulderY) / (31 - shoulderY);
    const halfw = Math.round(5 + (1 - t) * 3);        // 8 at shoulders → 5 at waist
    const cxx = cx + Math.round(off * 0.5);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = sk[2];
      if (x <= cxx - halfw + 1) c = sk[1];            // moonlit
      if (x >= cxx + halfw - 1) c = sk[3];            // shadow
      if (hash2(x, y, 71) < 0.10) c = sk[3];          // scars/soot
      P(g, x, y, c);
    }
  }
  // cracked ember seams glowing through (vertical-ish, dithered)
  const seamPts = [[-3, 21], [2, 24], [-1, 27], [4, 22], [-4, 29], [1, 30]];
  seamPts.forEach((p, i) => {
    const x = cx + Math.round(off * 0.5) + p[0], y = p[1];
    P(g, x, y, flare ? seam[0] : seam[1]);
    if (flare) { P(g, x, y - 1, seam[2]); P(g, x + 1, y, seam[2]); }
    else P(g, x, y + 1, seam[3]);
  });
  // chest straps (wrap ramp), crossing — symmetric so it mirrors clean
  for (let k = 0; k <= 9; k++) { const y = shoulderY + 1 + k; P(g, cx + off - 4 + k, y, wrap[1]); P(g, cx + off + 4 - k, y, wrap[2]); }
  for (let x = cx + off - 5; x <= cx + off + 5; x++) P(g, x, 31, wrap[3]);   // belt
  // bare scarred arms (shoulders bulge out)
  [[-1, sk[1]], [1, sk[3]]].forEach(([s, c]) => {
    const ax = cx + off + s * 7;
    for (let y = shoulderY + 1; y <= 28; y++) { P(g, ax, y, c); P(g, ax - s, y, sk[2]); if (hash2(ax, y, 72) < 0.12) P(g, ax, y, seam[3]); }
  });
  // head (no hood), heavy brow
  for (let y = top + 1; y <= shoulderY; y++) { const hw = y < top + 4 ? 3 : 4; for (let x = cx + off - hw; x <= cx + off + hw; x++) { let c = sk[2]; if (x < cx + off - hw + 1) c = sk[1]; if (x > cx + off + hw - 1) c = sk[3]; P(g, x, y, c); } }
  // short brutal topknot (spike up + bound base)
  P(g, cx + off, top - 2, sk[3]); P(g, cx + off, top - 1, sk[2]); P(g, cx + off, top, sk[1]);
  P(g, cx + off - 1, top, wrap[3]); P(g, cx + off + 1, top, wrap[3]);   // hair tie
  // face: ember eyes + grim mouth
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0); const ey = top + 5;
    P(g, fcx - 2, ey, seam[1]); P(g, fcx + 2, ey, flare ? seam[0] : seam[1]);
    for (let x = fcx - 2; x <= fcx + 2; x++) P(g, x, top + 8, sk[3]);   // jaw shadow
  }
}
function toolAshbound(g, ex, ey, f) {       // haymaker fist (no haft)
  const sk = RAMP.bone;
  fillRect(g, ex - 1, ey - 1, 3, 3, sk[2]); P(g, ex, ey - 1, sk[1]);
  P(g, ex - 1, ey, RAMP.ember[2]); P(g, ex + 1, ey, RAMP.ember[2]);     // ember knuckles
  if (f === 2) { P(g, ex + 2, ey - 1, RAMP.ember[0]); P(g, ex + 3, ey, RAMP.ember[1]); P(g, ex + 2, ey + 1, RAMP.gold[0]); }
}

/* ===================================================================== */
/* 2 · THE MIREBORN — bog seer. Lean, hunched, reed shawl + wet hem,     */
/*     belt bone-charm lantern (sways/gutters), root-staff swing.        */
/* ===================================================================== */
function bodyMireborn(g, R, anim, f, flame, shawl) {
  const { cx, off, dir, top, shoulderY, hemSway } = R;
  const gutter = anim === 'idle' && f === 1;
  const hunch = 1;  // pushed-forward head

  // reed shawl: rounded dome over hunched shoulders → trailing wet hem
  for (let y = shoulderY - 1; y <= 37; y++) {
    const t = (y - (shoulderY - 1)) / (37 - (shoulderY - 1));
    const halfw = Math.round(3.4 + t * 3.0 + (y > 33 ? 1 : 0));
    const cxx = cx + Math.round(off * 0.5) + (y > 31 ? Math.round(hemSway * 0.6) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = shawl[1];
      if (x <= cxx - halfw + 1) c = shawl[0];
      if (x >= cxx + halfw - 1) c = shawl[2];
      // reed weave texture (diagonal dashes)
      if ((x + 2 * y) % 5 === 0) c = shawl[2];
      if (hash2(x, y, 81) < 0.05) c = shawl[3];
      P(g, x, y, c);
    }
  }
  // wet hem: darker, dripping
  for (let x = 0; x < 32; x++) { const v = G(g, x, 37); if (v) { P(g, x, 37, shawl[3]); if (hash2(x, 0, 82) < 0.3 && G(g, x, 36)) P(g, x, 36, shawl[3]); } }
  // hunched head (forward/down), cowl peak low
  const hy0 = top + hunch;
  for (let y = hy0; y <= shoulderY; y++) { const hw = 3; const hcx = cx + off + (dir <= 2 ? 1 : 0); for (let x = hcx - hw; x <= hcx + hw; x++) { let c = shawl[1]; if (x < hcx - hw + 1) c = shawl[0]; if (x > hcx + hw - 1) c = shawl[2]; if (y === hy0) c = shawl[2]; P(g, x, y, c); } }
  // face in shadow + pale seer eyes (flame-tinted)
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : 1); const ey = hy0 + 5;
    for (let y = hy0 + 3; y <= hy0 + 7; y++) for (let x = fcx - 2; x <= fcx + 1; x++) P(g, x, y, RAMP.void);
    P(g, fcx - 1, ey, gutter ? flame[2] : flame[1]); P(g, fcx + 1, ey, gutter ? flame[3] : flame[0]);
  }
  // belt bone-charm lantern hanging front, sways on walk / gutters on idle f1
  const lsw = (anim === 'walk') ? [0, 1, 1, 0, -1, -1][f] : 0;
  const lx = cx + off - 4 + lsw, ly = 30;
  P(g, lx, ly - 1, RAMP.bone[2]);                 // hook/charm
  for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) { let c = RAMP.bone[3]; if (i === 0 && j > 0 && j < 3) c = gutter ? flame[2] : flame[1]; P(g, lx + i, ly + j, c); }
  P(g, lx, ly + 1, gutter ? flame[0] : flame[1]);  // flame core
  if (!gutter) P(g, lx, ly - 0, flame[0]);
}
function toolMireborn(g, ex, ey, f) {       // crooked root-staff (longer, gnarled)
  const dt = RAMP.dirt;
  // the haft is drawn by drawSwingArm; add a gnarled root knob + side roots
  fillRect(g, ex - 1, ey - 1, 2, 3, dt[1]); P(g, ex, ey - 2, dt[2]); P(g, ex + 1, ey - 1, dt[3]);
  P(g, ex - 2, ey, dt[2]); P(g, ex + 1, ey + 1, dt[3]);   // twisted roots
  if (f === 2) { P(g, ex + 2, ey - 1, RAMP.drift[0]); P(g, ex + 2, ey, RAMP.ember[1]); P(g, ex + 3, ey, RAMP.drift[1]); }
}

/* ===================================================================== */
/* 3 · THE BONECALLER — ossuary priest. Tall narrow, beast-skull mask    */
/*     (sockets glow), hanging-bone mantle (sways opp. hem), bandage arms.*/
/* ===================================================================== */
function bodyBonecaller(g, R, anim, f, socket, mantle) {
  const { cx, off, dir, top, shoulderY, hemSway } = R;
  const robe = RAMP.stone;
  const click = anim === 'idle' && f === 1;     // one hanging bone clicks (1px shift)

  // narrow tall robe
  for (let y = shoulderY; y <= 37; y++) {
    const t = (y - shoulderY) / (37 - shoulderY);
    const halfw = Math.round(2.8 + t * 2.6);
    const cxx = cx + Math.round(off * 0.5) + (y > 31 ? Math.round(hemSway * 0.5) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = robe[1]; if (x <= cxx - halfw + 1) c = robe[0]; if (x >= cxx + halfw - 1) c = robe[3];
      if (hash2(x, y, 91) < 0.05) c = robe[2];
      P(g, x, y, c);
    }
  }
  // bone mantle: small bones hanging from the shoulders, sway OPPOSITE the hem
  const msw = (anim === 'walk') ? -[0, 1, 1, 0, -1, -1][f] : 0;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const bx = cx + off + i * 2 + (Math.abs(i) > 1 ? msw : 0);
    const len = 3 - (Math.abs(i) === 3 ? 1 : 0);
    const clickShift = (click && i === 2) ? 1 : 0;
    for (let j = 0; j < len; j++) P(g, bx, shoulderY + 1 + j + clickShift, j === len - 1 ? mantle[0] : mantle[1]);
    P(g, bx, shoulderY + 1 + len + clickShift, mantle[3]);   // bead/knot tip
  }
  // bandage-wrapped arms (thin, at sides)
  [[-1, robe[0]], [1, robe[3]]].forEach(([s, c]) => {
    const ax = cx + off + s * 4;
    for (let y = shoulderY + 2; y <= 30; y++) { P(g, ax, y, c); if ((y % 2) === 0) P(g, ax, y, RAMP.bone[2]); }   // wrap stripes
  });
  // tall beast-skull half-mask head
  const hy0 = top - 1;
  for (let y = hy0; y <= shoulderY; y++) { const hw = y < hy0 + 3 ? 2 : 3; const hcx = cx + off; for (let x = hcx - hw; x <= hcx + hw; x++) { let c = mantle[1]; if (x < hcx - hw + 1) c = mantle[0]; if (x > hcx + hw - 1) c = mantle[2]; P(g, x, y, c); } }
  // skull snout juts forward (toward facing) for profile silhouette
  if (dir >= 1) { P(g, cx + off + 3, top + 3, mantle[1]); P(g, cx + off + 4, top + 3, mantle[2]); P(g, cx + off + 3, top + 4, mantle[3]); }
  // horns
  P(g, cx + off - 2, hy0 - 1, mantle[2]); P(g, cx + off + 2, hy0 - 1, mantle[2]); P(g, cx + off - 2, hy0 - 2, mantle[3]); P(g, cx + off + 2, hy0 - 2, mantle[3]);
  // glowing eye sockets
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0); const ey = top + 3;
    for (let y = ey - 1; y <= ey + 1; y++) { P(g, fcx - 2, y, RAMP.void); P(g, fcx + 2, y, RAMP.void); }
    P(g, fcx - 2, ey, socket[0]); P(g, fcx + 2, ey, socket[0]); P(g, fcx - 2, ey + 1, socket[1]); P(g, fcx + 2, ey + 1, socket[1]);
  }
}
function toolBonecaller(g, ex, ey, f) {     // ritual bone wand; spark bone-white then ember
  const bn = RAMP.bone;
  fillRect(g, ex - 1, ey - 1, 2, 3, bn[1]); P(g, ex, ey - 2, bn[0]); P(g, ex + 1, ey, bn[3]);
  if (f === 2) { P(g, ex + 2, ey - 1, bn[0]); P(g, ex + 3, ey, bn[0]); P(g, ex + 2, ey + 1, RAMP.ember[1]); P(g, ex + 3, ey + 1, RAMP.ember[0]); }
}

/* ===================================================================== */
/* 4 · THE VEILBORN — one the Drift gave back. Weightless: feet replaced  */
/*     by a drift-mote gap, layered veil, afterimage on walk.            */
/* ===================================================================== */
function bodyVeilborn(g, R, anim, f, veil, mote) {
  const { cx, off, dir, top, shoulderY, hemSway, step } = R;
  const detach = anim === 'idle' && f === 1;

  // afterimage trail on walk (faint veil pixels offset behind motion)
  if (anim === 'walk' && (f === 1 || f === 4)) {
    const tdir = f === 1 ? -1 : 1;
    for (let y = shoulderY + 2; y <= 30; y += 2) P(g, cx + off + tdir * 4, y, veil[3]);
  }
  // layered veil: scalloped tiers, hem floats (stops ~y34, never touches ground)
  for (let y = shoulderY; y <= 34; y++) {
    const t = (y - shoulderY) / (34 - shoulderY);
    const halfw = Math.round(3.2 + t * 3.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 28 ? Math.round(hemSway * 0.7) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = veil[1];
      if (x <= cxx - halfw + 1) c = veil[0];
      if (x >= cxx + halfw - 1) c = veil[2];
      // translucent dither holes (weightless, wrong)
      if (hash2(x, y, 101) < 0.10) continue;
      // scallop tier lines
      if ((y - shoulderY) % 5 === 0) c = veil[2];
      P(g, x, y, c);
    }
  }
  // ragged floating hem (scalloped bottom, drift-tinted)
  for (let x = cx + off - 6; x <= cx + off + 6; x++) {
    const s = Math.sin((x - cx) * 0.9 + hemSway);
    if (s > 0.2) { const y = 34 - Math.round(s); if (G(g, x, y - 1)) { P(g, x, y, veil[2]); P(g, x, y + 1, mote[3]); } }
  }
  // veil head (no face, just a hollow with mote eyes)
  for (let y = top; y <= shoulderY; y++) { const hw = 3; const hcx = cx + off; for (let x = hcx - hw; x <= hcx + hw; x++) { if (hash2(x, y, 102) < 0.10) continue; let c = veil[1]; if (x < hcx - hw + 1) c = veil[0]; if (x > hcx + hw - 1) c = veil[2]; if (y === top) c = veil[2]; P(g, x, y, c); } }
  if (R.showFace) {
    const fcx = cx + off + (dir === 2 ? 1 : 0); const ey = top + 5;
    P(g, fcx - 1, ey, mote[0]); P(g, fcx + 1, ey, mote[1]);
  }
  // drift-mote gap where feet would be (weightless) — replaces drawFeet
  const gy = 36, fo = R.dir >= 1 ? 1 : 0;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + f;
    const x = Math.round(cx + off + Math.cos(a) * 3 - step * 0.5), y = Math.round(gy + Math.sin(a) * 1.2);
    P(g, x, y, i % 2 ? mote[1] : mote[2]);
  }
  P(g, cx + off, 37, mote[3]);
  // idle f1: a mote detaches and rises
  if (detach) { P(g, cx + off + 5, top + 1, mote[0]); P(g, cx + off + 5, top, mote[1]); }
}
function toolVeilborn(g, ex, ey, f, mote) { // drift shard + smear behind arm
  const dr = mote || RAMP.drift;
  fillRect(g, ex - 1, ey - 1, 2, 2, dr[1]); P(g, ex, ey - 2, dr[0]);
  // smear trail behind the arc
  P(g, ex - 2, ey + 1, dr[3]); P(g, ex - 3, ey + 2, dr[3]);
  if (f === 2) { P(g, ex + 2, ey - 1, dr[0]); P(g, ex + 2, ey, dr[1]); P(g, ex + 3, ey, dr[2]); }
}

/* ===================== dispatcher ===================== */
function drawAvatar(kind, facing, anim, f, look) {
  const g = makeGrid(32, 40);
  const R = rig(facing, anim, f);
  const { rA, rB } = resolveLook(kind, look);

  if (kind === 'ashbound') {
    const stomp = (anim === 'walk' && (f === 1 || f === 4)) ? 1 : 0;
    bodyAshbound(g, R, anim, f, rA, rB);
    drawFeet(g, R, rB, kind, stomp);
    drawSwingArm(g, R, anim, f, RAMP.bone, toolAshbound);
  } else if (kind === 'mireborn') {
    bodyMireborn(g, R, anim, f, rA, rB);
    drawFeet(g, R, rB, kind, 0);
    drawSwingArm(g, R, anim, f, rB, toolMireborn);
  } else if (kind === 'bonecaller') {
    bodyBonecaller(g, R, anim, f, rA, rB);
    drawFeet(g, R, RAMP.stone, kind, 0);
    drawSwingArm(g, R, anim, f, RAMP.stone, toolBonecaller);
  } else if (kind === 'veilborn') {
    bodyVeilborn(g, R, anim, f, rA, rB);   // draws its own mote "feet"
    drawSwingArm(g, R, anim, f, rA, (gg, ex, ey, ff) => toolVeilborn(gg, ex, ey, ff, rB));
  }
  outline(g, RAMP.void);
  // post-outline glow accents (kept outline-free) per kind on idle f1
  return g;
}

function avatarSheetGrids(kind, look) {
  return AV_FACINGS.map(fc => {
    const row = [];
    AV_ANIMS.forEach(([anim, n]) => { for (let f = 0; f < n; f++) row.push(drawAvatar(kind, fc, anim, f, look)); });
    return row;
  });
}

/* ===================== shop portrait (48×64 bust, s-facing, 2f idle) ===================== */
function drawAvatarPortrait(kind, f, look) {
  const g = makeGrid(48, 64);
  const { rA, rB } = resolveLook(kind, look);
  const cx = 24, top = 10;
  // draw the s-facing idle body large by scaling the head/shoulders region:
  // simplest reliable route — render the 32×40 idle frame and 1.5×-ish place bust.
  const src = drawAvatar(kind, 's', 'idle', f || 0, look);
  // bust crop: take src rows ~6..26 (head+shoulders) and 2× scale into the portrait
  for (let y = 6; y <= 27; y++) for (let x = 4; x <= 27; x++) {
    const v = G(src, x, y); if (!v) continue;
    const px = cx - 24 + (x - 4) * 2, py = top + (y - 6) * 2;
    fillRect(g, px, py, 2, 2, v.c);
  }
  // pedestal shadow + frame hint
  for (let x = cx - 16; x <= cx + 16; x++) if ((x + 1) % 2 === 0) P(g, x, 61, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

const AVATARS = {
  ashbound:   { ramp: 'bone(ash) + ember + dirt', channels: AVATAR_CHANNELS.ashbound },
  mireborn:   { ramp: 'grass/stone(shawl) + ember(flame)', channels: AVATAR_CHANNELS.mireborn },
  bonecaller: { ramp: 'stone(robe) + bone(mantle) + drift(socket)', channels: AVATAR_CHANNELS.bonecaller },
  veilborn:   { ramp: 'stone/drift(veil) + drift(mote)', channels: AVATAR_CHANNELS.veilborn },
};

Object.assign(globalThis, {
  AV_RAMP, AVATAR_CHANNELS, AVATAR_KINDS, AV_FACINGS, AV_ANIMS,
  resolveLook, rig, drawFeet, drawSwingArm,
  drawAvatar, avatarSheetGrids, drawAvatarPortrait, AVATARS,
});
