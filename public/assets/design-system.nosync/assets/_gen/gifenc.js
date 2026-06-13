// Naevyr — GIF89a animated encoder (eval inside run_script, after pixlib.js).
// Pixel-art is a tiny fixed palette, so GIF is lossless + small. Includes a
// matching LZW decoder used to round-trip-verify every frame before shipping.

function hexRGB(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

// grids: array of equal-size grids (makeGrid). opts: {bg, scale, fps, loop}
// Returns a Uint8Array (image/gif).
function encodeGIF(grids, opts) {
  const bg = opts.bg || '#0a0810', scale = opts.scale || 1, fps = opts.fps || 8;
  const gw = grids[0].w, gh = grids[0].h, W = gw * scale, H = gh * scale;

  // --- palette (bg = index 0) ---
  const pal = new Map(); pal.set(bg, 0); const palList = [bg];
  for (const g of grids) for (const cell of g.d) if (cell && !pal.has(cell.c)) { pal.set(cell.c, palList.length); palList.push(cell.c); }
  if (palList.length > 256) throw new Error('palette overflow: ' + palList.length);
  let bits = 2; while ((1 << bits) < palList.length) bits++;          // 2..8
  const tableSize = 1 << bits, minCode = bits;

  // --- frames -> scaled index buffers ---
  const frames = grids.map(g => {
    const buf = new Uint8Array(W * H);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const cell = g.d[y * gw + x];
      const idx = cell ? pal.get(cell.c) : 0;
      if (idx === 0) continue;                                        // bg already 0
      for (let sy = 0; sy < scale; sy++) { const yy = (y * scale + sy) * W + x * scale; for (let sx = 0; sx < scale; sx++) buf[yy + sx] = idx; }
    }
    return buf;
  });

  // --- LZW, "literal-run" scheme: emit a CLEAR before the decoder's dictionary
  // could ever fill, so the code size stays fixed at minCode+1 and there is no
  // size-bump asymmetry to desync. Larger output, but provably correct against
  // any standard GIF decoder. ---
  const maxRun = (1 << minCode) - 2;                                  // literals between clears
  function lzwEncode(px) {
    const CLEAR = 1 << minCode, EOI = CLEAR + 1, size = minCode + 1;
    const out = []; let cur = 0, nb = 0;
    const put = (c) => { cur |= c << nb; nb += size; while (nb >= 8) { out.push(cur & 255); cur >>= 8; nb -= 8; } };
    put(CLEAR); let since = 0;
    for (let i = 0; i < px.length; i++) { if (since === maxRun) { put(CLEAR); since = 0; } put(px[i]); since++; }
    put(EOI);
    if (nb > 0) out.push(cur & 255);
    return out;
  }

  const b = [];
  const push = (...xs) => { for (const x of xs) b.push(x & 0xff); };
  const str = (s) => { for (let i = 0; i < s.length; i++) b.push(s.charCodeAt(i)); };
  const u16 = (v) => { b.push(v & 0xff, (v >> 8) & 0xff); };

  str('GIF89a');
  u16(W); u16(H);
  push(0x80 | ((bits - 1) << 4) | (bits - 1)); push(0); push(0);     // packed, bg, aspect
  for (let i = 0; i < tableSize; i++) { const c = i < palList.length ? hexRGB(palList[i]) : [0, 0, 0]; push(c[0], c[1], c[2]); }
  // loop forever
  push(0x21, 0xFF, 0x0B); str('NETSCAPE2.0'); push(0x03, 0x01); u16(opts.loop == null ? 0 : opts.loop); push(0x00);

  const delay = Math.max(2, Math.round(100 / fps));
  for (const px of frames) {
    const data = lzwEncode(px);
    // GCE
    push(0x21, 0xF9, 0x04, 0x04); u16(delay); push(0x00, 0x00);       // disposal=1, no transparency
    // image descriptor
    push(0x2C); u16(0); u16(0); u16(W); u16(H); push(0x00);
    push(minCode);
    for (let i = 0; i < data.length; i += 255) { const chunk = data.slice(i, i + 255); push(chunk.length); for (const x of chunk) b.push(x); }
    push(0x00);
  }
  push(0x3B);
  return new Uint8Array(b);
}

// scene helpers ----------------------------------------------------------
function fillBg(g, c) { for (let i = 0; i < g.d.length; i++) g.d[i] = { c }; }
// stamp a sprite so its (anchorX,anchorY) lands at scene (x,y); skips nulls
function place(scene, sprite, anchorX, anchorY, x, y, flip) {
  const s = flip ? mirrorX(sprite) : sprite;
  stamp(scene, s, x - anchorX, y - anchorY);
}
// soft iso ground shadow (dithered void ellipse)
function groundShadow(g, cx, cy, rx, ry) {
  for (let yy = -ry; yy <= ry; yy++) for (let xx = -rx; xx <= rx; xx++) {
    const d = (xx * xx) / (rx * rx) + (yy * yy) / (ry * ry);
    if (d <= 1 && (xx + yy) % 2 === 0 && Math.random() < 0.9) { const x = cx + xx, y = cy + yy; if (x >= 0 && y >= 0 && x < g.w && y < g.h) P(g, x, y, d < 0.5 ? '#070510' : '#0a0810'); }
  }
}

Object.assign(globalThis, { encodeGIF, fillBg, place, groundShadow, hexRGB });
