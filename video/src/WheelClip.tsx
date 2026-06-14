// "Spin the wheels of Naevyr — see what you can win." Crowded realm → a REAL
// captured gold-wheel spin → the rendered Drift Wheel landing on the 1% relic →
// the full Drift Wheel prize pool with odds → PLAY NOW.
import React from "react";
import { AbsoluteFill, Sequence, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { drawDarkWheelFace, wheelSegmentAngles, PRESTIGE_AURAS, spriteCache } from "../../game/render/sprites";
import { DRIFT_WHEEL, BURN_COSTS } from "../../game/types";
import { EngineCanvas, drawGrid, type GridLike } from "./engine";
import { RealmCanvas, Caption, TitlePlate, Scrim, CornerBrand, PlayNow, PAL, fontFamily, type Hero } from "./scenes";

export const FPS = 30;
const A = 95, GOLD_SPIN = 110, DRIFT_SPIN = 120, PRIZES = 150, CTA = 55;
export const WHEEL_FRAMES = A + GOLD_SPIN + DRIFT_SPIN + PRIZES + CTA;

const FadeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// ─── a rendered wheel face that eases onto a target segment ───────────────────
const WheelSpin: React.FC<{ kind: "gold" | "dark"; landLabel: string; spinF: number; size?: number }> = ({ kind, landLabel, spinF, size = 560 }) => {
  const frame = useCurrentFrame();
  const seg = wheelSegmentAngles(kind).find((s) => s.label === landLabel) ?? wheelSegmentAngles(kind)[0];
  const center = seg.start + seg.sweep / 2;
  const target = 6 * 360 + (360 - center);
  const t = Math.min(1, frame / spinF);
  const rot = (1 - Math.pow(1 - t, 3)) * target;
  const landed = frame >= spinF;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: size, height: size, filter: landed ? "drop-shadow(0 0 38px rgba(216,180,254,0.8))" : undefined }}>
        {/* fixed pointer */}
        <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", zIndex: 5, width: 0, height: 0, borderLeft: "18px solid transparent", borderRight: "18px solid transparent", borderTop: `28px solid ${PAL.GOLD}`, filter: "drop-shadow(0 2px 0 #0a0810)" }} />
        <div style={{ width: size, height: size, transform: `rotate(${rot}deg)` }}>
          <WheelFaceCanvas kind={kind} size={size} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WheelFaceCanvas: React.FC<{ kind: "gold" | "dark"; size: number }> = ({ kind, size }) => {
  const frame = useCurrentFrame();
  return (
    <EngineCanvas
      style={{ width: size, height: size }}
      draw={(ctx, f, _fp, w, h) => {
        const shimmer = Math.floor(frame / 15) % 2;
        const g = (kind === "dark" ? drawDarkWheelFace(shimmer, true).g : drawDarkWheelFace(shimmer, true).g) as GridLike;
        const z = (w / g.w) * 0.98;
        drawGrid(ctx, g, w / 2, h / 2, z, g.w / 2, g.h / 2);
      }}
    />
  );
};

// ─── the Drift Wheel prize pool (8 outcomes, art + odds) ──────────────────────
function drawAura(ctx: CanvasRenderingContext2D, key: keyof typeof PRESTIGE_AURAS, cx: number, cy: number, z: number, t: number) {
  const spec = PRESTIGE_AURAS[key];
  const af = Math.floor(t * spec.fps) % spec.frames;
  drawGrid(ctx, spec.fn(af) as GridLike, cx, cy + 4 * z, z, 32, 56);
}
function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.7, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.7, cy); ctx.closePath(); ctx.fill();
}

const PrizeCanvas: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <EngineCanvas
      draw={(ctx, frame, _f, w, h) => {
        const t = frame / fps;
        const cols = 4, rows = 2;
        const cellW = w / cols, cellH = (h * 0.66) / rows;
        const top = h * 0.16;
        DRIFT_WHEEL.forEach((seg, i) => {
          const col = i % cols, row = Math.floor(i / cols);
          const cx = cellW * col + cellW / 2;
          const cy = top + cellH * row + cellH * 0.46;
          const reveal = interpolate(frame, [i * 5, i * 5 + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (reveal <= 0) return;
          ctx.save();
          ctx.globalAlpha = reveal;
          const z = 5;
          // art
          if (seg.kind === "shards") {
            for (let k = 0; k < Math.min(3, seg.amount ?? 2); k++) diamond(ctx, cx - 18 + k * 18, cy - 6, 16, k === 1 ? PAL.DRIFT_HI : PAL.DRIFT);
          } else if (seg.kind === "dye") {
            spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 3) % 2, cx, cy + 24, z, undefined, { dye: "drift", eye: "drift" });
          } else if (seg.kind === "eye") {
            spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 3) % 2, cx, cy + 24, z, undefined, { dye: "bone", eye: "blood" });
          } else if (seg.kind === "aura") {
            drawAura(ctx, "ashen_crown", cx, cy + 20, z, t);
            spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 3) % 2, cx, cy + 24, z, undefined, { dye: "gold", eye: "gold" });
          } else if (seg.kind === "pet") {
            spriteCache.drawPet(ctx, "wisp", Math.floor(t * 4) % 2, cx, cy + 6, z * 1.7);
          } else if (seg.kind === "title") {
            ctx.font = `700 ${24}px ui-sans-serif`; ctx.textAlign = "center"; ctx.fillStyle = PAL.GOLD; ctx.fillText("⟡ TITLE ⟡", cx, cy);
          } else if (seg.kind === "prestigeAura") {
            drawAura(ctx, "corruption_halo", cx, cy + 20, z * 1.05, t);
            spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 3) % 2, cx, cy + 24, z, { weapon: 2, ward: 2, held: "weapon" }, { dye: "drift", eye: "ember" });
          }
          // odds chip + label
          ctx.textAlign = "center";
          ctx.font = `700 ${30}px ui-sans-serif`;
          ctx.fillStyle = seg.rare ? PAL.DRIFT_HI : PAL.GOLD;
          ctx.fillText(`${(seg.p * 100).toFixed(seg.p < 0.02 ? 0 : 0)}%`, cx, cy - 56);
          ctx.font = `${21}px ui-sans-serif`;
          ctx.fillStyle = PAL.BONE;
          const label = prizeName(seg.kind, seg.amount);
          ctx.fillText(label, cx, cy + 64);
          ctx.restore();
        });
      }}
    />
  );
};
function prizeName(kind: string, amount?: number) {
  switch (kind) {
    case "shards": return `${amount ?? 2} Drift Shards`;
    case "dye": return "Cloak Dye";
    case "eye": return "Eye Glow";
    case "aura": return "An Aura";
    case "pet": return "A Companion";
    case "title": return "A Title";
    case "prestigeAura": return "DRIFT-TOUCHED Aura";
    default: return kind;
  }
}

// ─── the clip ─────────────────────────────────────────────────────────────────
export const WheelClip: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.VOID }}>
    <Audio src={staticFile("naevyr-music.mp3")} volume={(f) => interpolate(f, [0, 20, WHEEL_FRAMES - 24, WHEEL_FRAMES], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />

    <Sequence durationInFrames={A + 8} name="realm">
      <FadeShell>
        <RealmCanvas building="wheel" buildingCell={{ x: 11, y: 8 }} crowdSeed={91} hero={{ from: { x: 11, y: 15 }, to: { x: 11, y: 9 }, look: { dye: "blood", eye: "blood" } } as Hero} />
        <Scrim />
        <TitlePlate at={6} sub="two wheels turn at the Waystation">The Wheels of Naevyr</TitlePlate>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={A} durationInFrames={GOLD_SPIN + 8} name="gold">
      <FadeShell>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          {/* the REAL in-game spin overlay (Wheel of the Drift interior, ~18s in) */}
          <OffthreadVideo src={staticFile("gameplay/wheel.webm")} startFrom={Math.round(18.2 * FPS)} playbackRate={1.0} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.75)", transformOrigin: "50% 48%" }} />
        </AbsoluteFill>
        <Scrim />
        <Caption at={8} sub="50 gold a spin · up to a 500g jackpot" color={PAL.GOLD}>Spin gold for gold.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={A + GOLD_SPIN} durationInFrames={DRIFT_SPIN + 8} name="driftspin">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1c1526 0%, #0a0810 75%)" }} />
        <WheelSpin kind="dark" landLabel="relic" spinF={62} />
        <Scrim />
        <TitlePlate at={4} sub={`burn ${BURN_COSTS.driftSpin.toLocaleString()} DRIFTS a spin`} color={PAL.DRIFT_HI}>The Drift Wheel</TitlePlate>
        <Caption at={70} sub="one spin in a hundred, a relic" color={PAL.DRIFT_HI}>It lands on the 1%.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={A + GOLD_SPIN + DRIFT_SPIN} durationInFrames={PRIZES + 8} name="prizes">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 38%, #1a1426 0%, #0a0810 78%)" }} />
        <PrizeCanvas />
        <div style={{ position: "absolute", top: 24, left: 0, right: 0, textAlign: "center", fontFamily, fontSize: 58, fontWeight: 700, color: PAL.GOLD, textShadow: "0 0 30px rgba(231,200,115,0.4)" }}>What the Drift Wheel pays</div>
        <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", fontFamily, fontSize: 28, color: PAL.BONE_DIM }}>dupes refund shards · pity guarantees a rare every 12 dry spins</div>
      </FadeShell>
    </Sequence>

    <Sequence from={A + GOLD_SPIN + DRIFT_SPIN + PRIZES} durationInFrames={CTA} name="cta">
      <PlayNow line="Fortune favours the burned." />
    </Sequence>
  </AbsoluteFill>
);
