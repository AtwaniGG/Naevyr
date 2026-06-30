// Naevyr tweet-reel helpers — tiny canvas sprite-loop engine. No deps.
(function (g) {
  function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
  // fixed WxH canvas, scaled to fit viewport, black letterbox; calls draw(ctx, tLoopMs, tAbsMs) each frame
  function makeStage(W, H, loopMs, draw) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;background:#06040a;display:flex;align-items:center;justify-content:center;overflow:hidden';
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.style.cssText = 'image-rendering:pixelated;box-shadow:0 20px 80px rgba(0,0,0,.6)';
    wrap.appendChild(cv); document.body.appendChild(wrap);
    const ctx = cv.getContext('2d');
    function fit() { const s = Math.min(innerWidth / W, innerHeight / H); cv.style.width = (W * s) + 'px'; cv.style.height = (H * s) + 'px'; }
    fit(); addEventListener('resize', fit);
    const t0 = performance.now();
    function frame(now) { const ta = now - t0; try { ctx.imageSmoothingEnabled = false; draw(ctx, ta % loopMs, ta); } catch (e) { window.__err = (e && (e.stack || e.message)) || String(e); } requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
  }
  // draw frame `col,row` of a sheet (cell fw×fh) centred at (cx,cy) scaled, pixelated
  function spr(ctx, img, fw, fh, col, row, cx, cy, sc) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, col * fw, (row || 0) * fh, fw, fh, Math.round(cx - fw * sc / 2), Math.round(cy - fh * sc), fw * sc, fh * sc);
  }
  // bottom-anchored variant (cy = baseline of feet)
  function sprBase(ctx, img, fw, fh, col, cx, baseY, sc) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, col * fw, 0, fw, fh, Math.round(cx - fw * sc / 2), Math.round(baseY - fh * sc), fw * sc, fh * sc);
  }
  function radial(ctx, x, y, r, stops) { const gr = ctx.createRadialGradient(x, y, 0, x, y, r); stops.forEach(s => gr.addColorStop(s[0], s[1])); return gr; }
  function vignette(ctx, W, H, strength) { ctx.fillStyle = radial(ctx, W / 2, H / 2, Math.max(W, H) * 0.62, [[0.55, 'rgba(6,4,10,0)'], [1, 'rgba(6,4,10,' + (strength || 0.9) + ')']]); ctx.fillRect(0, 0, W, H); }
  // drifting motes
  function motes(ctx, W, H, t, n, color, seed) {
    seed = seed || 1; const s = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233 + seed) * 43758.5453; return v - Math.floor(v); };
    for (let i = 0; i < n; i++) {
      const sp = 6 + s(i, 1) * 14, y = ((s(i, 2) * (H + 40) - t / 1000 * sp * 14) % (H + 40) + (H + 40)) % (H + 40) - 20;
      const x = s(i, 3) * W + Math.sin(t / 1000 * 0.5 + i) * (8 + s(i, 4) * 20);
      const op = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t / 1000 * (0.5 + s(i, 5)) + i));
      ctx.globalAlpha = op; ctx.fillStyle = color; const sz = s(i, 6) < 0.8 ? 2 : 3; ctx.fillRect(Math.round(x), Math.round(y), sz, sz);
    }
    ctx.globalAlpha = 1;
  }
  // pick the active clip from a list of {at, ...} given loop time (ms)
  function phase(tMs, segs) { let cur = segs[0]; for (const s of segs) { if (tMs >= s.at) cur = s; } return cur; }
  g.Reel = { loadImg, makeStage, spr, sprBase, radial, vignette, motes, phase };
})(window);
