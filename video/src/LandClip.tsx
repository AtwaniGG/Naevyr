// "Stake a corner of a dying world." Crowded realm → the hero plants a 3×3
// claim (banner rises, the plot lights gold) → furnish & HOLD it as the Drift
// gnaws the edge → more DRIFTS, more claims. All drawn from real game art.
import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { spriteCache } from "../../game/render/sprites";
import { CLAIM_COST } from "../../game/types";
import { EngineCanvas, camOnCell, cellToScreen, makeCrowd, crowdPose, paint, type Cam, type CrowdMember } from "./engine";
import { Caption, TitlePlate, Scrim, CornerBrand, PlayNow, PAL, fontFamily } from "./scenes";

export const FPS = 30;
const INTRO = 95, STAKE = 125, HOLD = 120, TIERS = 85, CTA = 55;
export const LAND_FRAMES = INTRO + STAKE + HOLD + TIERS + CTA;

const PLOT = { x: 11, y: 9 };
const FOCUS = { x: 11, y: 10 };

const FadeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// ground band + crowd, shared by every land beat
function drawLand(ctx: CanvasRenderingContext2D, cam: Cam, frame: number, t: number, seed: number, corrupt: number) {
  const R = 15;
  for (let gy = FOCUS.y - R; gy <= FOCUS.y + R; gy++)
    for (let gx = FOCUS.x - R; gx <= FOCUS.x + R; gx++) {
      const s = cellToScreen(cam, gx, gy);
      if (s.x < -80 || s.x > cam.w + 80 || s.y < -80 || s.y > cam.h + 80) continue;
      const isCorrupt = corrupt > 0 && gx < PLOT.x - 1 - 2 + Math.round(corrupt * 4);
      if (isCorrupt) { spriteCache.drawTile(ctx, "corrupt" as never, s.x, s.y, cam.z, frame); continue; }
      const hsh = Math.abs(Math.sin((gx * 12.9898 + gy * 78.233 + seed) * 43758.5453) % 1);
      const ty = hsh > 0.85 ? "dirt" : hsh > 0.8 ? "stone" : "grass";
      spriteCache.drawTile(ctx, ty as never, s.x, s.y, cam.z, frame, { variant: (gx * 7 + gy * 3) % 3, edge: true });
    }
}

function drawClaim(ctx: CanvasRenderingContext2D, cam: Cam, t: number, reveal: number) {
  if (reveal <= 0) return;
  ctx.save();
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const s = cellToScreen(cam, PLOT.x + dx, PLOT.y + dy);
      const w = 32 * cam.z, h = 16 * cam.z;
      ctx.globalAlpha = 0.16 * reveal;
      ctx.fillStyle = PAL.GOLD;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - h); ctx.lineTo(s.x + w, s.y); ctx.lineTo(s.x, s.y + h); ctx.lineTo(s.x - w, s.y); ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.7 * reveal;
      ctx.strokeStyle = PAL.GOLD; ctx.lineWidth = Math.max(1, 1.3 * cam.z);
      ctx.stroke();
    }
  ctx.restore();
}

const LandCanvas: React.FC<{ seed: number; claimReveal?: (f: number) => number; banner?: boolean; props?: boolean; corrupt?: (f: number) => number; hero?: { from: { x: number; y: number }; to: { x: number; y: number }; swingAtPlot?: boolean }; crowdCount?: number }> = ({ seed, claimReveal, banner, props, corrupt, hero, crowdCount = 16 }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const crowd = React.useMemo(() => makeCrowd(seed, crowdCount, PLOT.x, PLOT.y + 5, 8), [seed, crowdCount]);
  return (
    <EngineCanvas draw={(ctx, frame, _f, w, h) => {
      const cam = camOnCell(FOCUS.x, FOCUS.y, 2.7, w, h);
      const t = frame / fps;
      const cr = corrupt ? corrupt(frame) : 0;
      drawLand(ctx, cam, frame, t, seed, cr);
      drawClaim(ctx, cam, t, claimReveal ? claimReveal(frame) : 0);
      const items: { depth: number; draw: () => void }[] = [];
      // props on the plot (campfire/banner/lamp/statue at the corners + center)
      if (props) {
        const placed: [number, number, string][] = [[0, 0, "banner"], [-1, -1, "campfire"], [1, -1, "driftlamp"], [-1, 1, "statue"], [1, 1, "campfire"]];
        for (const [dx, dy, kind] of placed)
          items.push({ depth: (PLOT.x + dx) + (PLOT.y + dy), draw: () => { const s = cellToScreen(cam, PLOT.x + dx, PLOT.y + dy); spriteCache.drawProp(ctx, kind, Math.floor(t * 3) % 2, s.x, s.y, cam.z); } });
      } else if (banner) {
        const rise = interpolate(frame, [0, 18], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const a = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        items.push({ depth: PLOT.x + PLOT.y, draw: () => { const s = cellToScreen(cam, PLOT.x, PLOT.y); ctx.save(); ctx.globalAlpha = a; spriteCache.drawProp(ctx, "banner", Math.floor(t * 3) % 2, s.x, s.y + rise, cam.z); ctx.restore(); } });
      }
      // crowd
      for (const m of crowd as (CrowdMember & { pet?: string })[]) {
        const p = crowdPose(m, t);
        items.push({ depth: p.x + p.y, draw: () => { const s = cellToScreen(cam, p.x, p.y); spriteCache.drawChar(ctx, p.facing, p.mirror, p.moving ? "walk" : "idle", Math.floor(t * 7) % 6, s.x, s.y, cam.z, m.equip, m.look); if (m.pet) spriteCache.drawPet(ctx, m.pet, Math.floor(t * 4) % 2, s.x + 12 * cam.z, s.y + 4 * cam.z, cam.z); } });
      }
      // hero
      if (hero) {
        const arrive = durationInFrames * 0.5;
        const tt = Math.min(1, frame / arrive);
        const hx = hero.from.x + (hero.to.x - hero.from.x) * tt;
        const hy = hero.from.y + (hero.to.y - hero.from.y) * tt;
        const moving = tt < 1;
        const swing = !moving && hero.swingAtPlot;
        items.push({ depth: hx + hy + 0.1, draw: () => {
          const s = cellToScreen(cam, hx, hy);
          const anim = moving ? "walk" : swing ? "swing" : "idle";
          const af = moving ? Math.floor(t * 8) % 6 : swing ? Math.floor(t * 8) % 4 : Math.floor(t * 3) % 2;
          spriteCache.drawChar(ctx, moving ? "n" : "s", false, anim, af, s.x, s.y, cam.z, { weapon: 2, ward: 2, held: "weapon" }, { dye: "blood", eye: "blood" });
        } });
      }
      paint(items);
    }} />
  );
};

const TierRow: React.FC<{ tier: string; min: string; slots: number; color: string; i: number }> = ({ tier, min, slots, color, i }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [i * 8, i * 8 + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = interpolate(frame, [i * 8, i * 8 + 12], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: a, transform: `translateX(${x}px)`, display: "flex", alignItems: "center", gap: 20, background: "rgba(10,8,16,0.78)", border: `3px solid ${color}`, borderRadius: 12, padding: "12px 30px", minWidth: 760, justifyContent: "space-between" }}>
      <span style={{ fontFamily, fontSize: 36, fontWeight: 700, color }}>{tier}</span>
      <span style={{ fontFamily, fontSize: 24, color: PAL.BONE_DIM }}>{min}</span>
      <span style={{ fontFamily, fontSize: 30, color: PAL.BONE }}>{"◆".repeat(0)}{slots} claims</span>
    </div>
  );
};

export const LandClip: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.VOID }}>
    <Audio src={staticFile("naevyr-music.mp3")} volume={(f) => interpolate(f, [0, 20, LAND_FRAMES - 24, LAND_FRAMES], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />

    <Sequence durationInFrames={INTRO + 8} name="realm">
      <FadeShell>
        <LandCanvas seed={181} crowdCount={20} hero={{ from: { x: 11, y: 15 }, to: { x: 11, y: 11 } }} />
        <Scrim />
        <TitlePlate at={6} sub="the Drift eats the map · claim what you can hold">Stake your land.</TitlePlate>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO} durationInFrames={STAKE + 8} name="stake">
      <FadeShell>
        <LandCanvas seed={181} hero={{ from: { x: 11, y: 14 }, to: PLOT, swingAtPlot: true }} banner claimReveal={(f) => interpolate(f, [40, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        <Scrim />
        <Caption at={66} sub={`${CLAIM_COST} gold a stake · or burn DRIFTS`} color={PAL.GOLD}>Plant a 3×3 claim.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + STAKE} durationInFrames={HOLD + 8} name="hold">
      <FadeShell>
        <LandCanvas seed={181} props claimReveal={() => 1} corrupt={(f) => interpolate(f, [20, HOLD], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        <Scrim />
        <Caption at={6} sub="furnish it · reinforce it · the corruption never stops" color={PAL.GOLD}>Hold the line.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + STAKE + HOLD} durationInFrames={TIERS + 8} name="tiers">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, #1c1526 0%, #0a0810 80%)" }} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18 }}>
          <TierRow tier="Wanderer" min="no DRIFTS needed" slots={3} color={PAL.BONE_DIM} i={0} />
          <TierRow tier="Keeper" min="hold 10,000 DRIFTS" slots={4} color={PAL.GOLD} i={1} />
          <TierRow tier="Warden" min="hold 100,000 DRIFTS" slots={5} color={PAL.EMBER} i={2} />
          <TierRow tier="Drift Lord" min="hold 1,000,000 DRIFTS" slots={6} color={PAL.DRIFT_HI} i={3} />
        </AbsoluteFill>
        <Caption at={6} sub="hold more DRIFTS, hold more land" color={PAL.GOLD} y="80%">More DRIFTS, more claims.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + STAKE + HOLD + TIERS} durationInFrames={CTA} name="cta">
      <PlayNow line="Hold a corner of a dying world." />
    </Sequence>
  </AbsoluteFill>
);
