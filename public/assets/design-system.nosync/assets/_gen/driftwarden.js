// Naevyr — DRIFTWARDEN (5th premium avatar, frontier ranger). Eval after pixlib.js +
// tiles.js + avatars.js (rig, drawFeet, drawSwingArm, AV_RAMP). DROP-IN COMPATIBLE with
// the wanderer/avatar rig: 32×40, feet y=37, 5 facings, idle2·walk6·swing4, shoulder y=18,
// swing pivot (cx+off+4, shoulderY+2), arc [-2.1,-1.35,-0.45,0.35], hit spark f2. RAMP only.
// Two cosmetic ramp-swap channels: cloak (the travel-cloak/hood) + ward (drift-lantern glow
// + cloak-edge trim + glaive energy). 48×64 shop portrait. Worn-gear lines up with the rig.

const DW_CHANNELS = {
  driftwarden: {
    cloak: ['stone', 'dirt', 'grass', 'blood', 'drift'],   // a = cloak/hood body ramp
    ward:  ['drift', 'ember', 'gold', 'water', 'blood'],   // b = lantern/trim/glaive glow ramp
  },
};
function dwResolve(look) {
  look = look || {};
  const ch = DW_CHANNELS.driftwarden, names = Object.keys(ch);
  const pick = (chan, v) => {
    const opts = ch[chan];
    if (v == null) return AV_RAMP[opts[0]];
    if (typeof v === 'number') return AV_RAMP[opts[Math.max(0, Math.min(opts.length - 1, v))]];
    return AV_RAMP[v] || AV_RAMP[opts[0]];
  };
  return { rCloak: pick('cloak', look.a), rWard: pick('ward', look.b) };
}

// frontier ranger body: open travel-cloak + hood over a leather jerkin, one pauldron,
// a slung quiver, a belt drift-lantern (the ward glow), a warden's glaive on swing.
function bodyDriftwarden(g, R, anim, f, cloak, ward) {
  const { cx, off, dir, top, shoulderY, hemSway, back, showFace } = R;
  const lt = RAMP.dirt;                         // leather jerkin under the cloak
  const flare = anim === 'idle' && f === 1;     // lantern pulses on idle f1

  // slung quiver on the back (visible from behind / sides)
  if (back || dir === 1 || dir === 2) {
    const qx = cx + off - (back ? 0 : 3);
    for (let y = shoulderY - 1; y <= shoulderY + 8; y++) P(g, qx, y, lt[3]);
    P(g, qx, shoulderY - 2, ward[1]); P(g, qx - 1, shoulderY - 2, RAMP.bone[1]); P(g, qx + 1, shoulderY - 2, RAMP.bone[1]); // arrow fletching
  }

  // open travel-cloak (knee-length, parts at the front to show the jerkin)
  for (let y = shoulderY; y <= 35; y++) {
    const t = (y - shoulderY) / (35 - shoulderY);
    const hw = Math.round(3.6 + t * 3.2);
    const cxx = cx + Math.round(off * 0.5) + (y > 30 ? Math.round(hemSway * 0.5) : 0);
    const gap = (!back && y > shoulderY + 6) ? Math.max(0, Math.round(t * 2)) : -1;  // front opening
    for (let x = cxx - hw; x <= cxx + hw; x++) {
      if (gap >= 0 && Math.abs(x - cxx) <= gap) {     // jerkin shows through the parted cloak
        P(g, x, y, x < cxx ? lt[1] : lt[2]); continue;
      }
      let c = cloak[1]; if (x <= cxx - hw + 1) c = cloak[0]; if (x >= cxx + hw - 1) c = cloak[3];
      if (hash2(x, y, 401) < 0.05) c = cloak[2];
      if (back && x === cxx) c = cloak[2];
      P(g, x, y, c);
    }
  }
  // ward-trim along the cloak's leading edge (a thin glowing hem line)
  for (let y = shoulderY + 3; y <= 34; y += 1) { const t = (y - shoulderY) / (35 - shoulderY); const cxx = cx + Math.round(off * 0.5); const hw = Math.round(3.6 + t * 3.2); if (y % 2 === 0) P(g, cxx + hw - 1, y, ward[flare ? 1 : 2]); }
  // a pauldron on the right shoulder (leather + ward stud)
  const px = cx + off + 4;
  for (let y = shoulderY - 1; y <= shoulderY + 3; y++) for (let x = px - 2; x <= px + 2; x++) { let c = lt[1]; if (x < px - 1) c = lt[0]; if (x > px + 1) c = lt[2]; P(g, x, y, c); }
  P(g, px, shoulderY, ward[flare ? 0 : 2]);
  // belt drift-lantern (the ward glow) hanging at the left hip; sways on walk
  if (!back) {
    const lsw = anim === 'walk' ? [0, 1, 1, 0, -1, -1][f] : 0;
    const lx = cx + off - 5 + lsw, ly = 28;
    P(g, lx, ly - 1, RAMP.bone[2]);                                   // hook
    for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) { let c = lt[3]; if (i === 0 && j === 1) c = flare ? ward[0] : ward[1]; P(g, lx + i, ly + j, c); }
    if (flare) { P(g, lx, ly - 2, ward[1]); P(g, lx + 2, ly + 1, ward[2]); P(g, lx - 2, ly + 1, ward[2]); }
  }
  // hood (peaked, drawn over the head)
  for (let y = top; y <= shoulderY + 1; y++) {
    const hy = (y - top) / (shoulderY + 1 - top);
    const hw = Math.round(2 + Math.sin(Math.min(1, hy * 1.25) * Math.PI * 0.55) * 3.4);
    const cxx = cx + off;
    for (let x = cxx - hw; x <= cxx + hw; x++) { let c = cloak[1]; if (x === cxx - hw) c = cloak[0]; if (x >= cxx + hw - 1) c = cloak[3]; if (y === top) c = cloak[0]; P(g, x, y, c); }
  }
  P(g, cx + off, top - 1, cloak[1]);
  P(g, cx + off + (dir >= 1 && dir <= 3 ? 1 : 0), top - 2, cloak[2]);  // hood point droops toward facing
  // face shadow + steady warden eyes (ward-tinted glint)
  if (showFace) {
    const fcx = cx + off + (dir === 2 ? 2 : dir === 1 ? 1 : 0), w = dir === 2 ? 2 : 3;
    for (let y = top + 4; y <= top + 8; y++) for (let x = fcx - (dir === 2 ? 0 : w - 1); x <= fcx + w - 1; x++) P(g, x, y, RAMP.void);
    const ey = top + 6, lit = flare;
    if (dir === 0) { P(g, fcx - 1, ey, lit ? ward[0] : ward[1]); P(g, fcx + 1, ey, ward[1]); }
    if (dir === 1) { P(g, fcx, ey, lit ? ward[0] : ward[1]); P(g, fcx + 2, ey, ward[1]); }
    if (dir === 2) { P(g, fcx + 1, ey, lit ? ward[0] : ward[1]); }
  }
  if (flare) P(g, cx + off + 7, top + 3, ward[1]);                    // drifting mote off the shoulder
}
// warden's glaive — a long haft with a hooked blade; the edge sparks ward-energy on f2.
function toolDriftwarden(g, ex, ey, f, ward) {
  const bn = RAMP.bone;
  // hooked blade head
  fillRect(g, ex - 1, ey - 2, 2, 4, bn[1]); P(g, ex, ey - 3, bn[0]);
  P(g, ex + 1, ey - 2, bn[2]); P(g, ex + 2, ey - 3, bn[1]); P(g, ex + 2, ey - 4, bn[0]);   // hook curl
  if (f === 2) { P(g, ex + 3, ey - 2, ward[0]); P(g, ex + 4, ey - 1, ward[1]); P(g, ex + 3, ey, ward[2]); }  // ward arc-spark
}

function drawDriftwarden(facing, anim, f, look) {
  const g = makeGrid(32, 40);
  const R = rig(facing, anim, f);
  const { rCloak, rWard } = dwResolve(look);
  const stomp = (anim === 'walk' && (f === 1 || f === 4)) ? 1 : 0;
  bodyDriftwarden(g, R, anim, f, rCloak, rWard);
  drawFeet(g, R, RAMP.dirt, 'driftwarden', stomp);
  drawSwingArm(g, R, anim, f, rCloak, (gg, ex, ey, ff) => toolDriftwarden(gg, ex, ey, ff, rWard));
  outline(g, RAMP.void);
  return g;
}

// 48×64 shop portrait — s-facing idle bust, 2f (reuses the avatar portrait crop logic).
function drawDriftwardenPortrait(f, look) {
  const g = makeGrid(48, 64);
  const cx = 24, top = 10;
  const src = drawDriftwarden('s', 'idle', f || 0, look);
  for (let y = 6; y <= 27; y++) for (let x = 4; x <= 27; x++) {
    const v = G(src, x, y); if (!v) continue;
    fillRect(g, cx - 24 + (x - 4) * 2, top + (y - 6) * 2, 2, 2, v.c);
  }
  for (let x = cx - 16; x <= cx + 16; x++) if ((x + 1) % 2 === 0) P(g, x, 61, RAMP.void);
  outline(g, RAMP.void);
  return g;
}

const DRIFTWARDEN = { ramp: 'stone/dirt(cloak) + dirt(jerkin) + drift/ember(ward)', channels: DW_CHANNELS.driftwarden };

Object.assign(globalThis, {
  DW_CHANNELS, dwResolve, bodyDriftwarden, toolDriftwarden,
  drawDriftwarden, drawDriftwardenPortrait, DRIFTWARDEN,
});
