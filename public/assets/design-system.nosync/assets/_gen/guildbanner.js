// NAEVYR — GUILD BANNER (engine sprite). Eval after pixlib.js + tiles.js.
// Standing war-banner, 48×96, bottom-center anchor (24,95). Dark wood pole,
// bone-ramp cloth with a BLANK plate area (engine overlays the guild tag as
// text), drift-violet trim. 3 frames cloth sway (~3fps) + a 1-frame fallen
// tattered variant. Rect-grid, RAMP only, 1px void outline, dither not blur.

const GB_W = 48, GB_H = 96, GB_ANCHOR = [24, 95];

// plate area the engine writes text into (returned in JSON): x,y,w,h in cell px
const GB_PLATE = { x: 14, y: 30, w: 22, h: 26 };

function drawGuildBanner(frame) {
  const g = makeGrid(GB_W, GB_H);
  const dt = RAMP.dirt, bn = RAMP.bone, dr = RAMP.drift, gd = RAMP.gold;
  const poleX = 14, topY = 8, baseY = GB_H - 2;

  // --- ground shadow ---
  for (let x = poleX - 7; x <= poleX + 7; x++) if ((x + 1) % 2 === 0) P(g, x, baseY, RAMP.void);

  // --- wooden pole ---
  for (let y = topY; y <= baseY - 1; y++) for (let x = poleX - 1; x <= poleX + 1; x++) {
    let c = dt[1]; if (x === poleX - 1) c = dt[0]; if (x === poleX + 1) c = dt[3];
    if (hash2(x, y, 3) < 0.08) c = dt[2];
    P(g, x, y, c);
  }
  // pole finial: drift-violet crystal cap
  P(g, poleX, topY - 3, dr[0]); P(g, poleX, topY - 2, dr[1]); P(g, poleX - 1, topY - 1, dr[2]); P(g, poleX + 1, topY - 1, dr[2]); P(g, poleX, topY - 1, dr[1]);
  // crossbar
  for (let x = poleX - 2; x <= poleX + 20; x++) P(g, x, topY, dt[3]);
  for (let x = poleX - 2; x <= poleX + 20; x++) P(g, x, topY + 1, dt[2]);
  P(g, poleX + 20, topY - 1, dr[2]);   // crossbar tip glint

  // --- cloth banner: hangs from crossbar, sways by frame ---
  const clothX0 = poleX + 2, clothW = 22, clothTop = topY + 2, clothBot = 70;
  const sway = [0, 1, 0][frame] || 0;
  const phase = frame;
  for (let y = clothTop; y <= clothBot; y++) {
    const t = (y - clothTop) / (clothBot - clothTop);
    // horizontal wave offset grows toward the free (right) edge & toward the bottom
    const wave = Math.round(Math.sin(t * 3.2 + phase * 1.3) * (1.4 * t) + sway * t);
    for (let x = clothX0; x <= clothX0 + clothW; x++) {
      const u = (x - clothX0) / clothW;                  // 0 at pole .. 1 free edge
      const xoff = Math.round(wave * u);
      let c = bn[1];
      if (u < 0.12) c = bn[3];                            // shadow fold at the pole
      else if (u > 0.86) c = bn[2];                       // far edge shade
      // soft vertical fold shading
      const fold = Math.sin(u * 9 + phase) ;
      if (fold > 0.7) c = bn[0]; else if (fold < -0.7) c = bn[2];
      // drift-violet trim border (top, bottom, free edge)
      if (y <= clothTop + 1 || u > 0.93) c = dr[2];
      P(g, x + xoff, y, c);
    }
    // swallowtail notch at the bottom
    if (y > clothBot - 8) {
      const cut = 8 - (clothBot - y);
      for (let x = clothX0 + clothW / 2 - cut; x <= clothX0 + clothW / 2 + cut; x++) {
        const u = (x - clothX0) / clothW; const xoff = Math.round(wave * u);
        if (Math.abs(x - (clothX0 + clothW / 2)) < cut) g.d[y * g.w + (x + xoff)] = null;
      }
    }
  }
  // --- blank plate area (engine writes the tag here): subtle recessed bone panel + trim ---
  const swayP = Math.round((sway) * 0.4);
  for (let y = GB_PLATE.y; y < GB_PLATE.y + GB_PLATE.h; y++) for (let x = GB_PLATE.x; x < GB_PLATE.x + GB_PLATE.w; x++) {
    const edge = (y === GB_PLATE.y || y === GB_PLATE.y + GB_PLATE.h - 1 || x === GB_PLATE.x || x === GB_PLATE.x + GB_PLATE.w - 1);
    P(g, x + swayP, y, edge ? dr[3] : bn[1]);
  }
  // emblem hint corners (so the blank plate still reads as heraldry)
  P(g, GB_PLATE.x + swayP, GB_PLATE.y, gd[2]); P(g, GB_PLATE.x + GB_PLATE.w - 1 + swayP, GB_PLATE.y, gd[2]);
  P(g, GB_PLATE.x + swayP, GB_PLATE.y + GB_PLATE.h - 1, gd[2]); P(g, GB_PLATE.x + GB_PLATE.w - 1 + swayP, GB_PLATE.y + GB_PLATE.h - 1, gd[2]);

  outline(g, RAMP.void);
  return g;
}

function drawGuildBannerFallen() {
  const g = makeGrid(GB_W, GB_H);
  const dt = RAMP.dirt, bn = RAMP.bone, dr = RAMP.drift;
  // leaning pole (diagonal), base bottom-center, top toward upper-right
  const baseX = 18, baseY = GB_H - 2;
  for (let k = 0; k < 60; k++) {
    const x = baseX + Math.round(k * 0.42), y = baseY - k;
    if (y < 18) break;
    for (let o = -1; o <= 1; o++) { let c = dt[1]; if (o === -1) c = dt[0]; if (o === 1) c = dt[3]; if (hash2(x + o, y, 4) < 0.1) c = dt[2]; P(g, x + o, y, c); }
  }
  const topX = baseX + Math.round(59 * 0.42), topY = baseY - 59;
  // broken crossbar
  for (let x = topX - 1; x <= topX + 12; x++) P(g, x, topY, dt[3]);
  // tattered cloth draping down-right, corruption-eaten edges
  const cx0 = topX + 1, cw = 20, ct = topY + 1, cb = topY + 40;
  for (let y = ct; y <= cb; y++) {
    const t = (y - ct) / (cb - ct);
    const lean = Math.round(t * 6);
    for (let x = cx0; x <= cx0 + cw; x++) {
      const u = (x - cx0) / cw;
      // ragged right/bottom edge: corruption eats away
      const eat = hash2(x, y, 7);
      const ragged = u > (0.6 + 0.35 * Math.sin(y * 0.7)) || (t > 0.7 && eat < 0.5);
      if (ragged) { if (eat < 0.35 && u > 0.5) P(g, x + lean, y, eat < 0.15 ? dr[1] : dr[3]); continue; }
      let c = bn[2];
      if (u < 0.14) c = bn[3];
      const fold = Math.sin(u * 8); if (fold > 0.6) c = bn[1]; else if (fold < -0.6) c = bn[3];
      // corruption bleeding inward from the eaten edge
      if (u > 0.5 && eat < 0.2) c = dr[3];
      if (y <= ct + 1) c = dr[3];
      P(g, x + lean, y, c);
    }
  }
  // a few drift motes rising off the rot
  for (let i = 0; i < 6; i++) { const x = cx0 + 4 + (i * 3) % cw, y = cb - 4 - (i % 4) * 5; P(g, x, y, i % 2 ? dr[1] : dr[2]); }
  // fallen finial crystal on the ground
  P(g, baseX - 4, baseY - 1, dr[1]); P(g, baseX - 5, baseY, dr[3]);
  outline(g, RAMP.void);
  return g;
}

const GUILD = {
  guild_banner:        { fn: drawGuildBanner,       frames: 3, fps: 3, ramp: 'bone + dirt + drift', anchor: GB_ANCHOR, plate: GB_PLATE },
  guild_banner_fallen: { fn: drawGuildBannerFallen, frames: 1, fps: 0, ramp: 'bone + dirt + drift', anchor: GB_ANCHOR },
};

Object.assign(globalThis, { GB_W, GB_H, GB_ANCHOR, GB_PLATE, drawGuildBanner, drawGuildBannerFallen, GUILD });
