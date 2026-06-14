// "The Drift Ledger" — the seasonal battle pass. Crowded realm + the chalice
// emblem → the 50-tier two-track ladder → the milestone rewards (auras, the
// Ashfall Cloak, the Tier-50 Tarnished Chalice) → burn to unlock Premium.
// Art note: the battle pass lives on the `battlepass` branch; its DS exports
// (pass_emblem / tarnished_chalice / ashfall_dye) were copied into public/.
import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { PRESTIGE_AURAS, spriteCache, type PrestigeAuraKey } from "../../game/render/sprites";
import { EngineCanvas, drawGrid, type GridLike } from "./engine";
import { FrameSheet } from "./FrameSheet";
import { RealmCanvas, Caption, TitlePlate, Scrim, CornerBrand, PlayNow, PAL, fontFamily, type Hero } from "./scenes";

export const FPS = 30;
const INTRO = 100, TRACK = 96, MILES = 200, UNLOCK = 90, CTA = 55;
export const BATTLEPASS_FRAMES = INTRO + TRACK + MILES + UNLOCK + CTA;

const FadeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// ─── the 50-tier two-track bar filling up ─────────────────────────────────────
const TierTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [10, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ticks = 50;
  const mile = new Set([15, 25, 30, 40, 50]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
      {(["Premium", "Free"] as const).map((track, ti) => (
        <div key={track} style={{ width: 1500 }}>
          <div style={{ fontFamily, fontSize: 28, color: ti === 0 ? PAL.GOLD : PAL.BONE_DIM, marginBottom: 8, letterSpacing: "0.1em" }}>{track.toUpperCase()} TRACK</div>
          <div style={{ position: "relative", height: 34, background: "rgba(10,8,16,0.7)", border: `2px solid ${ti === 0 ? PAL.GOLD : PAL.BONE_DIM}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, width: `${fill * 100}%`, background: ti === 0 ? "linear-gradient(90deg,#7c5f23,#e7c873)" : "linear-gradient(90deg,#4a4458,#a99fb8)" }} />
            {Array.from({ length: ticks }, (_, i) => {
              const t = i + 1;
              const isMile = mile.has(t) && ti === 0;
              return <div key={i} style={{ position: "absolute", left: `${(t / ticks) * 100}%`, top: isMile ? -6 : 4, width: isMile ? 4 : 2, height: isMile ? 46 : 26, background: isMile ? PAL.DRIFT_HI : "rgba(10,8,16,0.6)" }} />;
            })}
          </div>
        </div>
      ))}
      <div style={{ fontFamily, fontSize: 26, color: PAL.BONE_DIM, marginTop: 6 }}>50 tiers · season XP from weekly challenges & every kill, haul and caravan</div>
    </AbsoluteFill>
  );
};

// ─── the milestone rewards, one at a time ─────────────────────────────────────
type Milestone =
  | { tier: number; track: string; label: string; art: { type: "aura"; key: PrestigeAuraKey } }
  | { tier: number; track: string; label: string; art: { type: "cloak" } }
  | { tier: number; track: string; label: string; art: { type: "chalice" } };
const MILESTONES: Milestone[] = [
  { tier: 15, track: "Premium", label: "Ashen Crown", art: { type: "aura", key: "ashen_crown" } },
  { tier: 25, track: "Free", label: "Ashfall Cloak", art: { type: "cloak" } },
  { tier: 30, track: "Premium", label: "Ember Cinder", art: { type: "aura", key: "ember_cinder" } },
  { tier: 40, track: "Premium", label: "Corruption Halo", art: { type: "aura", key: "corruption_halo" } },
  { tier: 50, track: "Premium", label: "The Tarnished Chalice", art: { type: "chalice" } },
];

const MilestoneStage: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const per = durationInFrames / MILESTONES.length;
  const idx = Math.min(MILESTONES.length - 1, Math.floor(frame / per));
  const m = MILESTONES[idx];
  const local = frame - idx * per;
  const a = interpolate(local, [2, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isChalice = m.art.type === "chalice";
  return (
    <>
      {/* canvas art (auras + cloak) */}
      {!isChalice && (
        <EngineCanvas draw={(ctx, f, _fp, w, h) => {
          const t = f / fps;
          const cx = w / 2, cy = h * 0.62, z = 13;
          ctx.save(); ctx.globalAlpha = interpolate(f - idx * per, [2, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (m.art.type === "aura") {
            const spec = PRESTIGE_AURAS[m.art.key];
            drawGrid(ctx, spec.fn(Math.floor(t * spec.fps) % spec.frames) as GridLike, cx, cy + 4 * z, z, 32, 56);
            spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 3) % 2, cx, cy, z, { weapon: 2, ward: 2, held: "weapon" }, { dye: "drift", eye: "ember" });
          } else {
            // the Ashfall Cloak (DS art lands in-game; an ember-ash dye stands in)
            spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 3) % 2, cx, cy, z, { ward: 2 }, { dye: "ember", eye: "ember" });
          }
          ctx.restore();
        }} />
      )}
      {isChalice && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: a }}>
          <div style={{ filter: "drop-shadow(0 0 40px rgba(231,200,115,0.7))", transform: "translateY(-30px)" }}>
            <ChaliceArt />
          </div>
        </AbsoluteFill>
      )}
      <div style={{ position: "absolute", top: "15%", left: 0, right: 0, textAlign: "center", opacity: a }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily, fontSize: 40, fontWeight: 700, color: m.track === "Free" ? PAL.BONE : PAL.GOLD, padding: "6px 22px", border: `3px solid ${m.track === "Free" ? PAL.BONE_DIM : PAL.GOLD}`, borderRadius: 10, background: "rgba(10,8,16,0.7)" }}>TIER {m.tier}</span>
          <span style={{ fontFamily, fontSize: 28, color: m.track === "Free" ? PAL.BONE_DIM : PAL.DRIFT_HI, letterSpacing: "0.1em" }}>{m.track.toUpperCase()}</span>
        </div>
        <div style={{ fontFamily, fontSize: 64, fontWeight: 700, color: isChalice ? PAL.GOLD : PAL.DRIFT_HI, marginTop: 14, textShadow: "0 4px 24px #0a0810" }}>{m.label}</div>
      </div>
    </>
  );
};
const ChaliceArt: React.FC = () => {
  const frame = useCurrentFrame();
  return <FrameSheet src="assets/battlepass/tarnished_chalice.svg" frameW={64} frameH={64} frames={3} frame={Math.floor(frame / 8) % 3} scale={9} />;
};

const Emblem: React.FC<{ size?: number }> = ({ size = 150 }) => (
  <Img src={staticFile("assets/battlepass/pass_emblem.svg")} style={{ width: size, imageRendering: "pixelated", filter: "drop-shadow(0 0 24px rgba(231,200,115,0.55))" }} />
);

// ─── the clip ─────────────────────────────────────────────────────────────────
export const BattlePassClip: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.VOID }}>
    <Audio src={staticFile("naevyr-music.mp3")} volume={(f) => interpolate(f, [0, 20, BATTLEPASS_FRAMES - 24, BATTLEPASS_FRAMES], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />

    <Sequence durationInFrames={INTRO + 8} name="intro">
      <FadeShell>
        <RealmCanvas building="vault" buildingCell={{ x: 11, y: 8 }} crowdSeed={140} crowdCount={20} hero={{ from: { x: 11, y: 15 }, to: { x: 11, y: 10 }, look: { dye: "gold", eye: "gold" } } as Hero} />
        <Scrim />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "8%", textAlign: "center" }}>
            <Emblem />
            <TitlePlate at={8} sub="Season 1 · Ashfall" y="0%">The Drift Ledger</TitlePlate>
          </div>
        </AbsoluteFill>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO} durationInFrames={TRACK + 8} name="track">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #1c1526 0%, #0a0810 80%)" }} />
        <TierTrack />
        <Caption at={6} sub="a free track for all · a Premium track you unlock" color={PAL.GOLD} y="80%">Fifty tiers. Two tracks.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + TRACK} durationInFrames={MILES + 8} name="milestones">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, #1e1430 0%, #0a0810 82%)" }} />
        <MilestoneStage />
        <Scrim />
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + TRACK + MILES} durationInFrames={UNLOCK + 8} name="unlock">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 44%, #221a16 0%, #0a0810 80%)", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 26 }}>
          <Emblem size={130} />
          <div style={{ fontFamily, fontSize: 78, fontWeight: 700, color: PAL.GOLD, textShadow: "0 0 30px rgba(231,200,115,0.5)" }}>Burn 40,000 DRIFTS</div>
          <div style={{ fontFamily, fontSize: 38, color: PAL.BONE }}>unlock the Premium track</div>
          <div style={{ fontFamily, fontSize: 30, color: PAL.BONE_DIM, marginTop: 8 }}>4-week seasons · cosmetics, gold & shards · never a DRIFTS payout</div>
        </AbsoluteFill>
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + TRACK + MILES + UNLOCK} durationInFrames={CTA} name="cta">
      <PlayNow line="Fill the Ledger before the season turns." />
    </Sequence>
  </AbsoluteFill>
);
