// Naevyr character generator — hooded Drift-touched wanderer.
// 32×40 cell, ~30px tall, feet at bottom-center. 5 facings (s,se,e,ne,n);
// engine mirrors for w/sw/nw. Anim: idle 2f · walk 6f · swing 4f.

function drawWanderer(facing, anim, f) {
  const g = makeGrid(32, 40);
  const st = RAMP.stone, dr = RAMP.drift, bn = RAMP.bone;
  const cx = 16;
  const dir = { s: 0, se: 1, e: 2, ne: 3, n: 4 }[facing];
  const off = [0, 1, 2, 1, 0][dir];        // lateral shift toward facing
  const showFace = dir <= 2;

  let bob = 0, hemSway = 0;
  if (anim === 'walk') { bob = [0, -1, 0, 0, -1, 0][f]; hemSway = [0, 1, 1, 0, -1, -1][f]; }
  if (anim === 'idle') { hemSway = f === 1 ? 1 : 0; }

  const top = 9 + bob;
  const shoulderY = 18 + bob;

  // ---- cloak body (stooped taper, shoulder→hem) ----
  for (let y = shoulderY; y <= 36; y++) {
    const t = (y - shoulderY) / (36 - shoulderY);
    const halfw = Math.round(3.6 + t * 3.4);          // ~4 → 7
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(hemSway * 0.5) : 0);
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = st[1];
      if (x <= cxx - halfw + 1) c = st[0];            // moonlit left edge
      if (x >= cxx + halfw - 1) c = st[3];            // shadow right
      if (hash2(x, y, 61) < 0.06) c = st[2];          // worn cloth
      if (dir >= 3 && x === cxx) c = st[2];           // back seam
      P(g, x, y, c);
    }
  }
  // ---- hem glow (corruption creeping up from the ground) ----
  for (let y = 35; y <= 36; y++)
    for (let x = 0; x < 32; x++) {
      const v = G(g, x, y);
      if (v) P(g, x, y, y === 36 ? (hash2(x, y, 63) < 0.3 ? dr[2] : dr[3]) : (hash2(x, y, 63) < 0.25 ? dr[3] : v.c));
    }

  // ---- hood ----
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const halfw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.4);
    const cxx = cx + off;
    for (let x = cxx - halfw; x <= cxx + halfw; x++) {
      let c = st[1];
      if (x === cxx - halfw) c = st[0];
      if (x >= cxx + halfw - 1) c = st[3];
      if (y === top) c = st[0];
      P(g, x, y, c);
    }
  }
  // hood point (droops toward facing)
  P(g, cx + off, top - 1, st[1]);
  P(g, cx + off + (dir >= 1 && dir <= 3 ? 1 : 0), top - 2, st[2]);

  // ---- face shadow + Drift eyes ----
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : dir === 1 ? 1 : 0);
    const w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++)
      for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6;
    const blink = anim === 'idle' && f === 1;
    if (dir === 0) { P(g, fcx - 1, ey, blink ? dr[3] : dr[2]); P(g, fcx + 1, ey, blink ? dr[3] : dr[1]); }
    if (dir === 1) { P(g, fcx, ey, blink ? dr[3] : dr[2]); P(g, fcx + 2, ey, blink ? dr[3] : dr[1]); }
    if (dir === 2) { P(g, fcx + 1, ey, blink ? dr[3] : dr[1]); }
  }
  // idle mote drifting off the shoulder
  if (anim === 'idle' && f === 1) P(g, cx + off + 7, top + 3, dr[1]);

  // ---- feet ----
  const footY = 37;
  let step = 0;
  if (anim === 'walk') step = [2, 1, 0, -2, -1, 0][f];
  const fo = dir >= 1 ? 1 : 0;
  P(g, cx - 3 + fo + step, footY, st[3]); P(g, cx - 2 + fo + step, footY, RAMP.void);
  P(g, cx + 2 + fo - step, footY, RAMP.void); P(g, cx + 3 + fo - step, footY, st[3]);

  // ---- gather/swing arm + tool ----
  if (anim === 'swing') {
    const hx = cx + off + 4, hy = shoulderY + 2;
    const ang = [-2.1, -1.35, -0.45, 0.35][f];
    for (let k = 2; k < 8; k++) {
      const x = Math.round(hx + Math.cos(ang) * k), y = Math.round(hy + Math.sin(ang) * k);
      P(g, x, y, k < 4 ? st[2] : RAMP.dirt[0]);     // sleeve → wooden haft
    }
    const ex = Math.round(hx + Math.cos(ang) * 8), ey2 = Math.round(hy + Math.sin(ang) * 8);
    fillRect(g, ex - 1, ey2 - 1, 3, 2, bn[2]);       // tool head
    P(g, ex, ey2 - 2, bn[1]);
    if (f === 2) { P(g, ex + 2, ey2, bn[0]); P(g, ex + 3, ey2 + 1, RAMP.ember[0]); } // hit spark
  }

  outline(g);
  return g;
}

const WANDER_FACINGS = ['s', 'se', 'e', 'ne', 'n'];
const WANDER_ANIMS = [['idle', 2], ['walk', 6], ['swing', 4]];

function wandererSheetGrids() {
  // rows = facings, cols = 12 frames (idle0..1, walk0..5, swing0..3)
  const rows = [];
  WANDER_FACINGS.forEach(fc => {
    const row = [];
    WANDER_ANIMS.forEach(([anim, n]) => {
      for (let f = 0; f < n; f++) row.push(drawWanderer(fc, anim, f));
    });
    rows.push(row);
  });
  return rows;
}

Object.assign(globalThis, { drawWanderer, wandererSheetGrids, WANDER_FACINGS, WANDER_ANIMS });
