// "The Hall of Deeds" — the lifetime-honors launch clip. Crowded realm at the
// shrine + the struck-gold emblem → the five lines (Blade / Coin / Labor /
// Endure / Realm) → a line filling and taking its laurel (bronze → silver →
// gold) → the capstone titles struck for good → PLAY NOW.
// Art: the DS "Deeds & Honors" exports (deed_* / tier_* / deed_emblem) copied
// into video/public/assets/deeds/ (served via staticFile, pixelated).
import React from "react";
import { AbsoluteFill, Sequence, Audio, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { RealmCanvas, Caption, TitlePlate, Scrim, CornerBrand, PlayNow, PAL, fontFamily, type Hero } from "./scenes";

export const FPS = 30;
const INTRO = 100, LINES = 172, LAUREL = 132, TITLES = 138, CTA = 56;
export const DEEDS_FRAMES = INTRO + LINES + LAUREL + TITLES + CTA;

const ART = (name: string) => staticFile(`assets/deeds/${name}.svg`);
const GLOW = (rgba: string) => `drop-shadow(0 0 18px ${rgba})`;

const FadeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const DeedImg: React.FC<{ name: string; size: number; glow?: string; style?: React.CSSProperties }> = ({ name, size, glow, style }) => (
  <Img src={ART(name)} style={{ width: size, height: size, imageRendering: "pixelated", filter: glow ? GLOW(glow) : undefined, ...style }} />
);

const Emblem: React.FC<{ size?: number }> = ({ size = 150 }) => (
  <DeedImg name="deed_emblem-32" size={size} glow="rgba(231,200,115,0.55)" />
);

// ─── the five lines, sliding up one after another ─────────────────────────────
const LINE_DEFS = [
  { badge: "deed_blade", name: "Blade", motif: "beasts felled · crits landed" },
  { badge: "deed_coin", name: "Coin", motif: "gold earned · given to the Flame" },
  { badge: "deed_labor", name: "Labor", motif: "resources gathered · trades mastered" },
  { badge: "deed_endure", name: "Endure", motif: "falls survived · days unbroken" },
  { badge: "deed_realm", name: "Realm", motif: "driftfalls weathered" },
];

const LinesStage: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 64 }}>
      <div style={{ display: "flex", gap: 70, alignItems: "flex-start" }}>
        {LINE_DEFS.map((l, i) => {
          const at = 8 + i * 14;
          const a = interpolate(frame, [at, at + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const dy = interpolate(frame, [at, at + 16], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={l.badge} style={{ opacity: a, transform: `translateY(${dy}px)`, textAlign: "center", width: 230 }}>
              <DeedImg name={l.badge} size={128} glow="rgba(168,85,247,0.35)" />
              <div style={{ fontFamily, fontSize: 38, fontWeight: 700, color: PAL.GOLD, marginTop: 14, letterSpacing: "0.06em" }}>{l.name}</div>
              <div style={{ fontFamily, fontSize: 21, color: PAL.BONE_DIM, marginTop: 6, lineHeight: 1.35 }}>{l.motif}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── one line filling, taking its laurel: bronze → silver → gold ──────────────
const LAURELS = [
  { tier: "tier_bronze", label: "BRONZE", note: "the line is begun", color: PAL.EMBER },
  { tier: "tier_silver", label: "SILVER", note: "halfway walked", color: PAL.BONE },
  { tier: "tier_gold", label: "GOLD", note: "every deed in the line walked", color: PAL.GOLD },
];

const LaurelStage: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const per = durationInFrames / LAURELS.length;
  const idx = Math.min(LAURELS.length - 1, Math.floor(frame / per));
  const l = LAURELS[idx];
  const local = frame - idx * per;
  const a = interpolate(local, [2, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = interpolate(local, [2, 16], [0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
      <div style={{ position: "relative", width: 320, height: 320, opacity: a, transform: `scale(${pop})` }}>
        <DeedImg name="deed_blade" size={320} glow="rgba(168,85,247,0.4)" style={{ position: "absolute", inset: 0 }} />
        <DeedImg name={l.tier} size={320} glow="rgba(231,200,115,0.5)" style={{ position: "absolute", inset: 0 }} />
      </div>
      <div style={{ fontFamily, fontSize: 64, fontWeight: 700, color: l.color, letterSpacing: "0.08em", textShadow: `0 0 26px ${PAL.VOID}`, opacity: a }}>{l.label}</div>
      <div style={{ fontFamily, fontSize: 30, color: PAL.BONE_DIM, opacity: a }}>{l.note}</div>
    </AbsoluteFill>
  );
};

// ─── the capstone titles, struck one by one for good ──────────────────────────
const TITLE_LIST = ["Beastbane", "Centurion", "Magnate", "Flamekeeper", "Realm-worn", "Drift-walker", "Warlord", "Tycoon"];

const TitlesStage: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 22 }}>
      <Emblem size={104} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 80px", marginTop: 14 }}>
        {TITLE_LIST.map((t, i) => {
          const at = 14 + i * 13;
          const a = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sc = interpolate(frame, [at, at + 12], [1.18, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={t} style={{ opacity: a, transform: `scale(${sc})`, display: "flex", alignItems: "center", gap: 14, justifyContent: "flex-start" }}>
              <DeedImg name="deed_emblem" size={34} glow="rgba(231,200,115,0.5)" />
              <span style={{ fontFamily, fontSize: 44, fontWeight: 700, color: PAL.GOLD, letterSpacing: "0.03em", textShadow: `0 2px 14px ${PAL.VOID}` }}>{t}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── the clip ─────────────────────────────────────────────────────────────────
export const DeedsClip: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.VOID }}>
    <Audio src={staticFile("naevyr-music.mp3")} volume={(f) => interpolate(f, [0, 20, DEEDS_FRAMES - 24, DEEDS_FRAMES], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />

    <Sequence durationInFrames={INTRO + 8} name="intro">
      <FadeShell>
        <RealmCanvas building="shrine" buildingCell={{ x: 11, y: 8 }} crowdSeed={211} crowdCount={22} hero={{ from: { x: 11, y: 15 }, to: { x: 11, y: 10 }, look: { dye: "gold", eye: "gold" } } as Hero} />
        <Scrim />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "8%", textAlign: "center" }}>
            <Emblem />
            <TitlePlate at={8} sub="Lifetime honors · earned, never given" y="0%">The Hall of Deeds</TitlePlate>
          </div>
        </AbsoluteFill>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO} durationInFrames={LINES + 8} name="lines">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #1c1526 0%, #0a0810 80%)" }} />
        <LinesStage />
        <Caption at={6} sub="thirty deeds across five lines" color={PAL.GOLD} y="84%">Five roads to walk.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + LINES} durationInFrames={LAUREL + 8} name="laurel">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, #1e1430 0%, #0a0810 82%)" }} />
        <LaurelStage />
        <Caption at={6} sub="fill a line, take its laurel" color={PAL.GOLD} y="86%">Bronze. Silver. Gold.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + LINES + LAUREL} durationInFrames={TITLES + 8} name="titles">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 44%, #221a16 0%, #0a0810 80%)" }} />
        <TitlesStage />
        <Scrim />
        <Caption at={6} sub="a capstone strikes a title that is yours for good" color={PAL.GOLD} y="88%">No coin. Only honor.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + LINES + LAUREL + TITLES} durationInFrames={CTA} name="cta">
      <PlayNow line="Walk the road. The standing never fades." />
    </Sequence>
  </AbsoluteFill>
);
