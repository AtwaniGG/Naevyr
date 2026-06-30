// Naevyr — "Mobile + Guest Rift open to all" announce video.
// 6s, 1920×1080, loop. One continuous shot: dark ruined vista → a vertical
// Drift seam glimmers → the rift TEARS open (light spill + mote burst) → a phone
// rises out of the rift running the game → headline + CTA build on the right.
// Loads after animations.jsx. Pixel-art discipline: crisp sprites, dithered glow.

const { Stage, Sprite, useTime, Easing, interpolate, animate, clamp } = window;

/* ============================ palette ============================ */
const C = {
  void: '#0a0810', ash: '#171320', stone: '#2a2438',
  bone: '#d8cfe0', boneHi: '#efe9f4', boneMid: '#a99fb8', boneLo: '#6f6781',
  core: '#f3e8ff', driftHi: '#d8b4fe', drift: '#a855f7', driftLo: '#6b21a8', driftDp: '#3b1162',
  ember: '#f59e0b', emberHi: '#fcd34d',
  gold: '#e7c873', goldHi: '#f6e0a6', goldLo: '#b8943f',
  water: '#4a7fa0', moss: '#4d7c4d', blood: '#dc2626',
};
const FONT_PIX = "'Pixelify Sans', monospace";
const FONT_SILK = "'Silkscreen', monospace";
const FONT_SORA = "'Sora', system-ui, sans-serif";

// centre of the rift / phone (left third)
const RIFT_X = 600;

/* deterministic RNG */
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

/* a small pixel-dither overlay (checkerboard) as a CSS background */
function ditherBg(color, size = 3) {
  return {
    backgroundImage:
      `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%),` +
      `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%)`,
    backgroundSize: `${size * 2}px ${size * 2}px`,
    backgroundPosition: `0 0, ${size}px ${size}px`,
    imageRendering: 'pixelated',
  };
}

/* ============================ backdrop ============================ */
// hero_vista (480×270 frame, ×4 = 1920×1080) with a slow ken-burns push.
function Backdrop() {
  const t = useTime();
  const scale = interpolate([0, 6], [1.08, 1.16], Easing.easeInOutSine)(t);
  const drift = interpolate([0, 6], [0, -22], Easing.linear)(t);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.void }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${scale}) translate(${drift * 0.2}px, ${drift * 0.1}px)`,
        transformOrigin: '50% 60%',
      }}>
        {/* show frame 0 of the 960×270 sheet → display at 3840×1080, anchored left */}
        <img src="assets/landing/hero_vista.svg"
          style={{ position: 'absolute', left: 0, top: 0, width: 3840, height: 1080, display: 'block' }} />
      </div>
      {/* cool moonlight wash + slight desat at the edges */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 60% 40%, transparent 40%, rgba(10,8,16,0.55) 100%)' }} />
    </div>
  );
}

/* ============================ drifting motes ============================ */
function Motes({ count = 46, seed = 7 }) {
  const t = useTime();
  const r = React.useMemo(() => {
    const g = rng(seed); const arr = [];
    for (let i = 0; i < count; i++) arr.push({
      x: g() * 1920, y: g() * 1080, sp: 6 + g() * 16, sz: g() < 0.8 ? 2 : 3,
      ph: g() * Math.PI * 2, amp: 8 + g() * 26, tw: 0.4 + g() * 1.6,
      col: g() < 0.7 ? C.drift : (g() < 0.5 ? C.driftHi : C.gold),
    });
    return arr;
  }, [count, seed]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {r.map((m, i) => {
        const y = ((m.y - t * m.sp) % 1120 + 1120) % 1120 - 20;
        const x = m.x + Math.sin(t * 0.5 + m.ph) * m.amp;
        const op = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * m.tw + m.ph));
        return <div key={i} style={{
          position: 'absolute', left: x, top: y, width: m.sz, height: m.sz,
          background: m.col, opacity: op, imageRendering: 'pixelated',
          boxShadow: m.sz > 2 ? `0 0 6px ${m.col}` : 'none',
        }} />;
      })}
    </div>
  );
}

/* ============================ the rift ============================ */
function Rift() {
  const t = useTime();
  // anticipation seam (1.0–1.6), tear open (1.6→2.4), then breathe.
  const wRaw = interpolate(
    [0.9, 1.35, 1.55, 2.4, 6],
    [0, 7, 3, 360, 360],
    [Easing.easeOutQuad, Easing.easeInQuad, Easing.easeOutExpo, Easing.linear]
  )(t);
  const breathe = t > 2.4 ? Math.sin((t - 2.4) * 1.7) * 9 : 0;
  const W = Math.max(0, wRaw + (t > 2.4 ? breathe : 0));
  const H = interpolate([0.9, 1.55, 2.4], [60, 150, 930], Easing.easeOutExpo)(t);
  const op = interpolate([0.85, 1.2, 2.4, 6], [0, 0.85, 1, 1])(t);
  const flick = 0.86 + 0.14 * Math.sin(t * 22);
  const coreW = Math.max(2, W * 0.06);

  return (
    <div style={{ position: 'absolute', left: RIFT_X, top: 540, transform: 'translate(-50%,-50%)', opacity: op }}>
      {/* outer emitted bloom (luminous FX — kept modest) */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: W * 2.4, height: H * 1.04,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: `radial-gradient(50% 50% at 50% 50%, ${C.drift}66 0%, ${C.driftLo}33 38%, transparent 72%)`,
        filter: 'blur(2px)', opacity: 0.8 * flick,
      }} />
      {/* the portal body: vertical ellipse, hard-banded drift ramp */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: W, height: H,
        transform: 'translate(-50%,-50%)', borderRadius: '50%', overflow: 'hidden',
        background: `linear-gradient(to bottom,
          transparent 0%, ${C.driftDp} 5%, ${C.driftDp} 11%, ${C.driftLo} 11%, ${C.driftLo} 22%,
          ${C.drift} 22%, ${C.drift} 36%, ${C.driftHi} 36%, ${C.driftHi} 46%,
          ${C.core} 46%, ${C.core} 54%, ${C.driftHi} 54%, ${C.driftHi} 64%,
          ${C.drift} 64%, ${C.drift} 78%, ${C.driftLo} 78%, ${C.driftLo} 89%,
          ${C.driftDp} 89%, ${C.driftDp} 95%, transparent 100%)`,
        boxShadow: `0 0 ${18 * flick}px ${C.drift}, inset 0 0 14px ${C.core}99`,
      }}>
        {/* pixel dither over the ramp to break the gradient */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, ...ditherBg('rgba(243,232,255,0.5)', 3) }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4, ...ditherBg('rgba(59,17,98,0.7)', 2) }} />
      </div>
      {/* hot core seam */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: coreW, height: H * 0.9,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: C.core, opacity: flick, boxShadow: `0 0 16px ${C.core}, 0 0 40px ${C.driftHi}`,
      }} />
      {/* thin light columns rising */}
      {[-0.34, -0.14, 0.14, 0.34].map((f, i) => {
        const cx = f * W;
        const colOp = (0.18 + 0.16 * Math.sin(t * 3 + i)) * clamp((t - 1.8) * 2, 0, 1);
        return <div key={i} style={{
          position: 'absolute', left: `calc(50% + ${cx}px)`, top: '50%', width: 2, height: H * 1.18,
          transform: 'translate(-50%,-50%)', background: `linear-gradient(${C.core}, transparent)`,
          opacity: colOp, imageRendering: 'pixelated',
        }} />;
      })}
    </div>
  );
}

/* burst of shards/motes at the tear */
function TearBurst() {
  const t = useTime();
  const r = React.useMemo(() => {
    const g = rng(31); const arr = [];
    for (let i = 0; i < 34; i++) { const a = g() * Math.PI * 2; arr.push({ a, d: 120 + g() * 520, sz: g() < 0.6 ? 2 : 3, sp: 0.5 + g() * 0.5, col: g() < 0.6 ? C.driftHi : C.core, dy: (g() - 0.5) * 0.4 }); }
    return arr;
  }, []);
  if (t < 1.55 || t > 3.2) return null;
  const p = clamp((t - 1.6) / 1.0, 0, 1);
  const e = Easing.easeOutExpo(p);
  return (
    <div style={{ position: 'absolute', left: RIFT_X, top: 540, pointerEvents: 'none' }}>
      {r.map((m, i) => {
        const dist = m.d * e * m.sp;
        const x = Math.cos(m.a) * dist * 0.55;
        const y = Math.sin(m.a) * dist + m.dy * dist;
        const op = (1 - p) * 0.95;
        return <div key={i} style={{
          position: 'absolute', left: x, top: y, width: m.sz, height: m.sz,
          background: m.col, opacity: op, boxShadow: `0 0 6px ${m.col}`, imageRendering: 'pixelated',
        }} />;
      })}
    </div>
  );
}

/* white-purple flash at the moment of tearing */
function TearFlash() {
  const t = useTime();
  const g = Math.exp(-Math.pow((t - 1.98) / 0.26, 2));
  if (g < 0.01) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(60% 80% at ${RIFT_X / 1920 * 100}% 50%, ${C.core} 0%, ${C.driftHi}cc 22%, ${C.drift}55 45%, transparent 70%)`,
      opacity: g * 0.92, mixBlendMode: 'screen' }} />
  );
}

/* ============================ phone + game HUD ============================ */
function PhoneScreen() {
  const t = useTime();
  // xp bar ticks up; a +XP float rises on a loop
  const xp = interpolate([3.0, 5.6], [0.36, 0.66], Easing.easeInOutQuad)(t);
  const floatP = ((t - 3.0) % 2.2) / 2.2;
  const showFloat = t > 3.0 && floatP >= 0 && floatP < 1;
  const selPulse = 0.5 + 0.5 * Math.sin(t * 4);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.void }}>
      {/* the world inside the screen — vista scaled to COVER the portrait screen,
         centred on the village, with a gentle parallax drift */}
      <img src="assets/landing/hero_vista.svg" style={{
        position: 'absolute', left: -384 - Math.sin(t * 0.4) * 5, top: 0, width: 1004, height: 565, display: 'block',
      }} />
      {/* selection diamond on a tile */}
      <div style={{ position: 'absolute', left: 150, top: 250 }}>
        <div style={{ width: 40, height: 20, transform: 'translate(-50%,-50%) rotate(45deg)', border: `2px solid ${C.gold}`, opacity: 0.5 + 0.5 * selPulse, boxShadow: `0 0 8px ${C.gold}` }} />
      </div>
      {/* +XP float */}
      {showFloat && (
        <div style={{ position: 'absolute', left: 150, top: 232 - floatP * 30, transform: 'translateX(-50%)', fontFamily: FONT_SILK, fontSize: 11, color: C.driftHi, opacity: (1 - floatP), textShadow: `0 1px 0 ${C.void}` }}>+18 XP</div>
      )}
      {/* top HUD row */}
      <div style={{ position: 'absolute', left: 8, top: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ background: 'rgba(23,19,32,0.86)', border: `1px solid ${C.drift}88`, padding: '3px 6px', display: 'flex', gap: 5, alignItems: 'center' }}>
          <div style={{ width: 7, height: 7, background: C.drift, transform: 'rotate(45deg)', boxShadow: `0 0 5px ${C.drift}` }} />
          <span style={{ fontFamily: FONT_SILK, fontSize: 8, color: C.bone, letterSpacing: '0.04em' }}>S3·THE DRIFT</span>
        </div>
        <div style={{ background: 'rgba(23,19,32,0.86)', border: `1px solid ${C.gold}66`, padding: '3px 6px', display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ width: 6, height: 6, background: C.gold, transform: 'rotate(45deg)' }} />
          <span style={{ fontFamily: FONT_SORA, fontWeight: 700, fontSize: 10, color: C.goldHi }}>1,240</span>
        </div>
      </div>
      {/* mini-map pip top-right under coins */}
      <div style={{ position: 'absolute', right: 8, top: 34, width: 46, height: 46, background: 'rgba(10,8,16,0.7)', border: `1px solid ${C.bone}22` }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 5, height: 5, transform: 'translate(-50%,-50%)', background: C.drift, boxShadow: `0 0 5px ${C.drift}` }} />
      </div>
      {/* bottom: xp bar + hotbar */}
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
        <div style={{ height: 7, background: 'rgba(10,8,16,0.8)', border: `1px solid ${C.bone}22`, marginBottom: 6, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${xp * 100}%`, background: `linear-gradient(90deg, ${C.driftLo}, ${C.drift})`, boxShadow: `0 0 6px ${C.drift}` }} />
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { c: C.ember, sel: false }, { c: C.gold, sel: true }, { c: C.water, sel: false }, { c: C.drift, sel: false },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, height: 30, background: 'rgba(23,19,32,0.9)', border: `1px solid ${s.sel ? C.gold : C.drift + '66'}`, boxShadow: s.sel ? `0 0 8px ${C.gold}88` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 11, height: 11, background: s.c, transform: 'rotate(45deg)', opacity: 0.92, boxShadow: `0 0 5px ${s.c}88` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Phone() {
  const t = useTime();
  if (t < 2.2) return null;
  const p = clamp((t - 2.25) / 0.95, 0, 1);
  const rise = Easing.easeOutBack(p);
  const targetTop = 244;
  const startTop = 1120;
  const bob = t > 3.2 ? Math.sin((t - 3.2) * 1.5) * 7 : 0;
  const top = startTop + (targetTop - startTop) * rise + bob;
  const op = clamp((t - 2.25) / 0.4, 0, 1);
  const W = 312, H = 624;
  // rim light at the base where it emerges from the rift
  return (
    <div style={{ position: 'absolute', left: RIFT_X, top: 0, transform: 'translateX(-50%)' }}>
      <div style={{ position: 'absolute', left: '50%', top: top, transform: 'translateX(-50%)', width: W, height: H, opacity: op }}>
        {/* outer void edge */}
        <div style={{ position: 'absolute', inset: 0, background: C.void, clipPath: 'polygon(0 14px,14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px))', boxShadow: `0 0 30px ${C.drift}aa, 0 18px 50px rgba(10,8,16,0.7)` }} />
        {/* bevel highlight */}
        <div style={{ position: 'absolute', inset: 3, background: `linear-gradient(135deg, ${C.stone} 0%, ${C.ash} 60%)`, clipPath: 'polygon(0 12px,12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px))' }} />
        {/* purple signature frame edge */}
        <div style={{ position: 'absolute', inset: 7, border: `2px solid ${C.drift}`, clipPath: 'polygon(0 10px,10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px))', boxShadow: `inset 0 0 12px ${C.drift}66` }} />
        {/* speaker notch */}
        <div style={{ position: 'absolute', left: '50%', top: 14, transform: 'translateX(-50%)', width: 54, height: 5, background: C.void, borderRadius: 3 }} />
        {/* screen */}
        <div style={{ position: 'absolute', left: 16, top: 30, right: 16, bottom: 30, overflow: 'hidden', boxShadow: `inset 0 0 0 1px ${C.void}` }}>
          <PhoneScreen />
        </div>
        {/* home indicator */}
        <div style={{ position: 'absolute', left: '50%', bottom: 12, transform: 'translateX(-50%)', width: 70, height: 4, background: C.boneLo, borderRadius: 2, opacity: 0.6 }} />
      </div>
    </div>
  );
}

/* ============================ text column (right) ============================ */
const COL_X = 1040;

function Kicker() {
  const t = useTime();
  const p = clamp((t - 2.75) / 0.5, 0, 1);
  const op = p * clamp((6 - t) / 0.3, 0, 1);
  const tx = (1 - Easing.easeOutCubic(p)) * 24;
  return (
    <div style={{ position: 'absolute', left: COL_X, top: 286, opacity: op, transform: `translateX(${tx}px)`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 9, height: 9, background: C.drift, transform: 'rotate(45deg)', boxShadow: `0 0 8px ${C.drift}` }} />
      <span style={{ fontFamily: FONT_SILK, fontSize: 21, letterSpacing: '0.16em', color: C.bone }}>NOW PLAYABLE ON MOBILE</span>
    </div>
  );
}

function Headline() {
  const t = useTime();
  // two lines slam in (nowrap; accent the thematic word)
  const lines = [
    { start: 3.25, content: <React.Fragment>THE GUEST <span style={{ color: C.driftHi, textShadow: `0 0 24px ${C.drift}, 0 3px 0 ${C.void}` }}>RIFT</span></React.Fragment> },
    { start: 3.45, content: 'IS OPEN.' },
  ];
  return (
    <div style={{ position: 'absolute', left: COL_X, top: 312 }}>
      {lines.map((ln, i) => {
        const p = clamp((t - ln.start) / 0.42, 0, 1);
        const e = Easing.easeOutBack(p);
        const op = clamp((t - ln.start) / 0.28, 0, 1) * clamp((6 - t) / 0.3, 0, 1);
        const sc = 0.84 + 0.16 * e;
        return (
          <div key={i} style={{
            fontFamily: FONT_PIX, fontWeight: 700, fontSize: 82, lineHeight: 1.06,
            color: C.boneHi, whiteSpace: 'nowrap',
            opacity: op, transform: `scale(${sc})`, transformOrigin: 'left center',
            textShadow: `0 3px 0 ${C.void}, 0 0 18px rgba(168,85,247,0.22)`,
            letterSpacing: '0.01em',
          }}>{ln.content}</div>
        );
      })}
    </div>
  );
}

function Subline() {
  const t = useTime();
  const p = clamp((t - 4.0) / 0.5, 0, 1);
  const op = p * clamp((6 - t) / 0.3, 0, 1);
  const tx = (1 - Easing.easeOutCubic(p)) * 20;
  return (
    <div style={{ position: 'absolute', left: COL_X, top: 560, opacity: op, transform: `translateX(${tx}px)`, width: 760 }}>
      <div style={{ fontFamily: FONT_SORA, fontWeight: 400, fontSize: 30, lineHeight: 1.45, color: C.bone }}>
        No account. No wallet. <span style={{ color: C.boneMid }}>Step through</span><br />as a guest — the realm is <span style={{ color: C.driftHi, fontWeight: 600 }}>open to all</span>.
      </div>
    </div>
  );
}

function CTA() {
  const t = useTime();
  const p = clamp((t - 4.55) / 0.5, 0, 1);
  const e = Easing.easeOutBack(p);
  const op = clamp((t - 4.55) / 0.32, 0, 1) * clamp((6 - t) / 0.3, 0, 1);
  const glow = 0.6 + 0.4 * Math.sin(t * 3);
  return (
    <div style={{ position: 'absolute', left: COL_X, top: 706, opacity: op, transform: `scale(${0.9 + 0.1 * e})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 18 }}>
      {/* emblem */}
      <img src="assets/brand/emblem-64.svg" style={{ width: 64, height: 64, display: 'block', filter: `drop-shadow(0 0 ${8 * glow}px ${C.drift})` }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: FONT_PIX, fontWeight: 600, fontSize: 44, color: C.goldHi, letterSpacing: '0.02em', textShadow: `0 2px 0 ${C.void}` }}>naevyr.com</span>
        <span style={{ fontFamily: FONT_SILK, fontSize: 13, letterSpacing: '0.22em', color: C.boneMid }}>FREE TO PLAY · NO DOWNLOAD</span>
      </div>
    </div>
  );
}

/* ============================ framing ============================ */
function Scrims() {
  const t = useTime();
  const rightScrim = clamp((t - 2.6) / 0.8, 0, 1) * 0.5; // darken right side as text comes
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(90deg, transparent 38%, rgba(10,8,16,${rightScrim * 0.7}) 62%, rgba(10,8,16,${rightScrim}) 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(10,8,16,0.45) 0%, transparent 18%, transparent 80%, rgba(10,8,16,0.5) 100%)' }} />
      {/* vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 220px 60px rgba(10,8,16,0.85)' }} />
    </React.Fragment>
  );
}

// loop seam: brief fade from/to black at the ends
function LoopFade() {
  const t = useTime();
  const inFade = clamp((0.32 - t) / 0.32, 0, 1);
  const outFade = clamp((t - 5.7) / 0.3, 0, 1);
  const op = Math.max(inFade, outFade * 0.82);
  if (op < 0.01) return null;
  return <div style={{ position: 'absolute', inset: 0, background: C.void, opacity: op, pointerEvents: 'none' }} />;
}

/* ============================ root ============================ */
function NaevyrAnnounce() {
  const t = useTime();
  // gentle global push-in
  const cam = interpolate([0, 6], [1.0, 1.055], Easing.easeOutSine)(t);
  React.useEffect(() => {
    const root = document.getElementById('anim-root');
    if (root) root.setAttribute('data-screen-label', `t=${t.toFixed(1)}s`);
  }, [Math.floor(t)]);
  return (
    <div id="anim-root" data-screen-label="t=0.0s" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.void }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam})`, transformOrigin: '42% 50%' }}>
        <Backdrop />
        <Rift />
        <TearBurst />
        <Motes />
        <Phone />
        <TearFlash />
        <Scrims />
        <Kicker />
        <Headline />
        <Subline />
        <CTA />
      </div>
      <LoopFade />
    </div>
  );
}

window.NaevyrAnnounce = NaevyrAnnounce;
