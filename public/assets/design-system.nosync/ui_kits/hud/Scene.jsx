/* Naevyr UI kit — representative isometric world backdrop.
   NOT part of the design system: the real world is Canvas sprites
   handled by the engine. This is a stand-in so the HUD can be shown
   reading over a busy, moving scene. Iso 2:1, tiles 64×32. */

function IsoScene({ driftPct = 42 }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    let raf, t = 0;

    const TW = 64, TH = 32;            // tile diamond
    const COLS = 16, ROWS = 16;
    const PAL = {
      grass: ['#4d7c4d', '#356037', '#20402a'],
      dirt:  ['#50402e', '#36291c', '#241a11'],
      stone: ['#322b46', '#211c30', '#14101e'],
      water: ['#2c5775', '#173a52', '#0d2336'],
      drift: ['#a855f7', '#6b21a8', '#3b1162'],
    };
    // deterministic terrain map
    const map = [];
    for (let gy = 0; gy < ROWS; gy++) {
      const r = [];
      for (let gx = 0; gx < COLS; gx++) {
        const n = (Math.sin(gx * 1.7) + Math.cos(gy * 1.3) + Math.sin((gx + gy) * 0.6)) ;
        let type = 'grass';
        if (n < -1.3) type = 'water';
        else if (n < -0.5) type = 'dirt';
        else if (n > 1.4) type = 'stone';
        r.push({ type, corrupt: gx + gy > (COLS + ROWS) * (1 - driftPct / 100) && Math.sin(gx * 2.1 + gy) > -0.2 });
      }
      map.push(r);
    }
    // objects: trees/rocks at a few tiles
    const objs = [
      { gx: 3, gy: 5, kind: 'tree' }, { gx: 6, gy: 3, kind: 'tree' }, { gx: 10, gy: 6, kind: 'tree' },
      { gx: 12, gy: 9, kind: 'rock' }, { gx: 4, gy: 10, kind: 'rock' }, { gx: 8, gy: 8, kind: 'player' },
    ];

    function resize() {
      const r = cv.getBoundingClientRect();
      cv.width = r.width; cv.height = r.height;
    }
    resize();
    window.addEventListener('resize', resize);

    function isoX(gx, gy, ox) { return ox + (gx - gy) * (TW / 2); }
    function isoY(gx, gy, oy) { return oy + (gx + gy) * (TH / 2); }

    function diamond(cx, cy, fill, edge) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - TH / 2);
      ctx.lineTo(cx + TW / 2, cy);
      ctx.lineTo(cx, cy + TH / 2);
      ctx.lineTo(cx - TW / 2, cy);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke(); }
    }

    function draw() {
      const W = cv.width, H = cv.height;
      // sky / void wash
      ctx.fillStyle = '#0a0810'; ctx.fillRect(0, 0, W, H);
      const ox = W / 2, oy = H / 2 - (COLS + ROWS) * TH / 4 + 40;

      // ground
      for (let gy = 0; gy < ROWS; gy++) {
        for (let gx = 0; gx < COLS; gx++) {
          const cell = map[gy][gx];
          const cx = isoX(gx, gy, ox), cy = isoY(gx, gy, oy);
          const ramp = PAL[cell.type];
          diamond(cx, cy, ramp[0], 'rgba(10,8,16,0.35)');
          // south shading lip
          ctx.fillStyle = ramp[1];
          ctx.beginPath();
          ctx.moveTo(cx - TW / 2, cy);
          ctx.lineTo(cx, cy + TH / 2);
          ctx.lineTo(cx, cy + TH / 2 + 3);
          ctx.lineTo(cx - TW / 2, cy + 3);
          ctx.closePath(); ctx.fill();
          if (cell.type === 'water') {
            // shimmer
            const sh = (Math.sin(t / 22 + gx + gy) + 1) / 2;
            ctx.fillStyle = `rgba(120,180,210,${0.06 + sh * 0.10})`;
            diamond(cx, cy - 1, ctx.fillStyle, null);
          }
          if (cell.corrupt) {
            const pulse = 0.18 + (Math.sin(t / 30 + gx - gy) + 1) / 2 * 0.16;
            ctx.fillStyle = `rgba(168,85,247,${pulse})`;
            diamond(cx, cy, ctx.fillStyle, null);
          }
        }
      }

      // objects (depth sorted by gx+gy)
      [...objs].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy)).forEach(o => {
        const cx = isoX(o.gx, o.gy, ox), cy = isoY(o.gx, o.gy, oy);
        if (o.kind === 'tree') {
          ctx.fillStyle = '#241a11'; ctx.fillRect(cx - 3, cy - 14, 6, 16);     // trunk
          ctx.fillStyle = '#36291c'; ctx.fillRect(cx - 1, cy - 14, 2, 16);
          ctx.fillStyle = '#356037'; ctx.fillRect(cx - 12, cy - 40, 24, 28);   // canopy
          ctx.fillStyle = '#4d7c4d'; ctx.fillRect(cx - 12, cy - 40, 18, 22);
          ctx.fillStyle = '#7fae5e'; ctx.fillRect(cx - 10, cy - 38, 8, 8);
          ctx.fillStyle = '#0a0810'; ctx.fillRect(cx - 12, cy - 41, 24, 1);
        } else if (o.kind === 'rock') {
          ctx.fillStyle = '#211c30'; ctx.fillRect(cx - 12, cy - 14, 24, 14);
          ctx.fillStyle = '#322b46'; ctx.fillRect(cx - 12, cy - 14, 18, 10);
          ctx.fillStyle = '#4a4360'; ctx.fillRect(cx - 10, cy - 12, 6, 4);
          ctx.fillStyle = '#e7c873'; ctx.fillRect(cx - 2, cy - 8, 3, 3);       // ore fleck
          ctx.fillStyle = '#0a0810'; ctx.fillRect(cx - 12, cy - 15, 24, 1);
        } else if (o.kind === 'player') {
          // hooded wanderer
          ctx.fillStyle = '#0a0810'; ctx.fillRect(cx - 7, cy - 30, 14, 30);
          ctx.fillStyle = '#2a2438'; ctx.fillRect(cx - 6, cy - 28, 12, 26);    // cloak
          ctx.fillStyle = '#171320'; ctx.fillRect(cx - 5, cy - 22, 10, 5);     // hood shadow
          ctx.fillStyle = '#a855f7'; ctx.fillRect(cx - 3, cy - 21, 2, 2);      // drift eyes
          ctx.fillStyle = '#d8b4fe'; ctx.fillRect(cx + 1, cy - 21, 2, 2);
          ctx.fillStyle = '#6b21a8'; ctx.fillRect(cx - 6, cy - 6, 12, 2);      // drift hem glow
        }
      });

      // ambient drift motes + ash
      for (let i = 0; i < 26; i++) {
        const mx = (i * 97 + t * (0.3 + (i % 3) * 0.2)) % W;
        const my = (i * 53 + Math.sin(t / 40 + i) * 18 + t * 0.15) % H;
        const drift = i % 4 === 0;
        ctx.fillStyle = drift ? 'rgba(168,85,247,0.8)' : 'rgba(216,207,224,0.25)';
        ctx.fillRect(W - mx, my, drift ? 2 : 1, drift ? 2 : 1);
      }

      t += 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [driftPct]);

  return <canvas ref={ref} className="drift-pixel" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }} />;
}

window.IsoScene = IsoScene;
