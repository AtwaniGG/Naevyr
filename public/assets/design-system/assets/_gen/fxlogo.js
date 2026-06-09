// DriftLands FX + logo generators — eval after pixlib.js.

// ---- FX ----
function makeMotes() {
  const dr = RAMP.drift;
  const v1 = makeGrid(2, 2); fillRect(v1, 0, 0, 2, 2, dr[1]);
  const v2 = makeGrid(2, 2); P(v2, 0, 0, dr[0]); P(v2, 1, 0, dr[1]); P(v2, 0, 1, dr[2]); P(v2, 1, 1, dr[2]);
  const v3 = makeGrid(2, 2); P(v3, 0, 0, dr[2]); P(v3, 1, 0, dr[3]); P(v3, 0, 1, dr[3]); P(v3, 1, 1, dr[2]);
  return [v1, v2, v3];
}
function makeEmbers() {
  return [0, 1, 2].map(i => { const g = makeGrid(1, 1); P(g, 0, 0, RAMP.ember[i]); return g; });
}
function makeAsh() {
  return ['#a99fb8', '#6f6781', '#d8cfe0'].map(c => { const g = makeGrid(1, 1); P(g, 0, 0, c); return g; });
}
// progress ring: 24×24, 8 fill steps, stepped pixel circumference
function makeRingFrames() {
  const dr = RAMP.drift;
  const pts = [];
  const n = 44;
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + (i / n) * Math.PI * 2; // start top, clockwise
    pts.push([Math.round(11.5 + Math.cos(t) * 9.5), Math.round(11.5 + Math.sin(t) * 9.5)]);
  }
  return Array.from({ length: 8 }, (_, s) => {
    const g = makeGrid(24, 24);
    const fillN = Math.round(((s + 1) / 8) * n);
    pts.forEach((p, i) => {
      const on = i < fillN;
      P(g, p[0], p[1], on ? dr[2] : dr[4]);
      // 2px thickness: inner ring pixel
      const t = -Math.PI / 2 + (i / n) * Math.PI * 2;
      P(g, Math.round(11.5 + Math.cos(t) * 8.5), Math.round(11.5 + Math.sin(t) * 8.5), on ? dr[3] : dr[4]);
      if (on && i === fillN - 1) P(g, p[0], p[1], dr[0]); // hot leading pixel
    });
    return g;
  });
}

// ---- LOGO ----
// custom 12px-tall pixel letterset (only the letters DRIFTLANDS needs)
const GLYPHS = {
  D: ['######..','#######.','##...##.','##....##','##....##','##....##','##....##','##....##','##....##','##...##.','#######.','######..'],
  R: ['#######.','########','##....##','##....##','##...###','#######.','######..','##.###..','##..##..','##...##.','##...###','##....##'],
  I: ['####','####','.##.','.##.','.##.','.##.','.##.','.##.','.##.','.##.','####','####'],
  F: ['########','########','##......','##......','##......','#######.','#######.','##......','##......','##......','##......','##......'],
  T: ['########','########','...##...','...##...','...##...','...##...','...##...','...##...','...##...','...##...','...##...','...##...'],
  L: ['##......','##......','##......','##......','##......','##......','##......','##......','##......','##......','########','########'],
  A: ['..####..','.######.','##....##','##....##','##....##','########','########','##....##','##....##','##....##','##....##','##....##'],
  N: ['##....##','##....##','###...##','####..##','##.##.##','##.##.##','##..####','##..####','##...###','##...###','##....##','##....##'],
  S: ['.#######','########','##......','##......','########','.#######','......##','......##','......##','......##','########','#######.'],
};
function scaleGrid(g, k) {
  const m = makeGrid(g.w * k, g.h * k);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = G(g, x, y);
    if (v) fillRect(m, x * k, y * k, k, k, v.c, v.a);
  }
  return m;
}
// build the DRIFTLANDS wordmark at 1× (12 tall) with corruption bleed
function wordmarkGrid(mono) {
  const word = 'DRIFTLANDS';
  const bn = RAMP.bone, dr = RAMP.drift;
  let widths = [], total = 0;
  for (const ch of word) { const w = GLYPHS[ch][0].length; widths.push(w); total += w + 1; }
  total -= 1;
  const g = makeGrid(total, 12);
  let ox = 0;
  word.split('').forEach((ch, gi) => {
    const rows = GLYPHS[ch];
    for (let y = 0; y < 12; y++) for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] !== '#') continue;
      let c;
      if (mono) c = bn[1];
      else if (y === 0) c = bn[0];
      else if (y < 8) c = bn[1];
      else if (y === 8) c = (x + y) % 2 === 0 ? bn[1] : dr[1];
      else if (y === 9) c = (x + y) % 2 === 0 ? dr[1] : dr[2];
      else if (y === 10) c = dr[2];
      else c = dr[3];
      // rising veins
      if (!mono && y >= 6 && y <= 8 && hash2(ox + x, y, 99) < 0.05) c = dr[2];
      P(g, ox + x, y, c);
    }
    ox += widths[gi] + 1;
  });
  return g;
}
// emblem (the stone iso-tile cradling a Drift mote) — 16×16 master
const EMBLEM_ROWS = [
  '.......kk.......','......kCCk......','.....kCccCk.....','....kCc..cCk....',
  '...kCc.p..cCk...','..kCc.pPp..cCk..','.kCc..pPp...cCk.','kCc..pPPPp...cCk',
  '.kCc..pPp...cCk.','..kCc.pPp..cCk..','...kCc.p..cCk...','....kCc..cCk....',
  '.....kCccCk.....','......kCCk......','.......kk.......','................',
];
function emblemGrid(mono) {
  const PALC = mono
    ? { k: '#0a0810', C: '#d8cfe0', c: '#a99fb8', P: '#efe9f4', p: '#d8cfe0' }
    : { k: '#0a0810', C: '#4a4360', c: '#322b46', P: '#f3e8ff', p: '#a855f7' };
  const g = makeGrid(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = EMBLEM_ROWS[y][x];
    if (ch !== '.' && PALC[ch]) P(g, x, y, PALC[ch]);
  }
  return g;
}
// lockups
function logoHorizontal(mono) {
  const g = makeGrid(512, 96);
  stamp(g, scaleGrid(emblemGrid(mono), 4), 4, 16);
  const wm = scaleGrid(wordmarkGrid(mono), 5); // 85*5=425 × 60
  stamp(g, wm, 80, 18);
  return g;
}
function logoStacked(mono) {
  const g = makeGrid(256, 220);
  stamp(g, scaleGrid(emblemGrid(mono), 6), 80, 12);
  const wm = scaleGrid(wordmarkGrid(mono), 3); // 255 × 36
  stamp(g, wm, 0, 132);
  if (!mono) {
    const dr = RAMP.drift;
    [[60, 190], [128, 198], [196, 188]].forEach((m, i) => {
      P(g, m[0], m[1], i === 1 ? dr[0] : dr[1]);
      P(g, m[0] + 1, m[1], dr[2]); P(g, m[0], m[1] + 1, dr[2]);
    });
  }
  return g;
}

Object.assign(globalThis, {
  makeMotes, makeEmbers, makeAsh, makeRingFrames,
  GLYPHS, scaleGrid, wordmarkGrid, emblemGrid, logoHorizontal, logoStacked,
});
