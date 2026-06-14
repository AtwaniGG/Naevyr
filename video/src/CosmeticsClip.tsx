// "Wear the realm." A parade of the cosmetics: the 4 premium characters, cloak
// dyes + eye-glows, the Drift-touched prestige auras, and companion pets — all
// drawn live from the real game art, over a crowded realm.
import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { PRESTIGE_AURAS, spriteCache, type PrestigeAuraKey } from "../../game/render/sprites";
import { PRESTIGE_CATALOG } from "../../game/types";
import { EngineCanvas, drawGrid, makeCrowd, crowdPose, cellToScreen, camOnCell, paint, type GridLike } from "./engine";
import { RealmCanvas, ShowcaseCanvas, Caption, TitlePlate, Scrim, CornerBrand, PlayNow, PAL, fontFamily, type Hero } from "./scenes";

export const FPS = 30;
const INTRO = 90, AVATARS = 168, DYES = 100, AURAS = 132, PETS = 84, CTA = 55;
export const COSMETICS_FRAMES = INTRO + AVATARS + DYES + AURAS + PETS + CTA;

const FadeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// a faint crowd strolling behind a centerpiece (reused by avatar/aura stages)
function drawBackdropCrowd(ctx: CanvasRenderingContext2D, t: number, seed: number, w: number, h: number) {
  const cam = camOnCell(0, 6, 2.4, w, h);
  const crowd = makeCrowd(seed, 12, 0, 8, 9);
  const items: { depth: number; draw: () => void }[] = [];
  for (const m of crowd as (ReturnType<typeof makeCrowd>[number] & { pet?: string })[]) {
    const p = crowdPose(m, t);
    items.push({ depth: p.x + p.y, draw: () => {
      const s = cellToScreen(cam, p.x, p.y);
      ctx.save(); ctx.globalAlpha = 0.5;
      spriteCache.drawChar(ctx, p.facing, p.mirror, p.moving ? "walk" : "idle", Math.floor(t * 7) % 6, s.x, s.y, cam.z, m.equip, m.look);
      ctx.restore();
    } });
  }
  paint(items);
}

// ─── the 4 premium characters on a stage ──────────────────────────────────────
const AVATAR_ORDER = ["ashbound", "mireborn", "bonecaller", "veilborn"] as const;
const AvatarStage: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const per = durationInFrames / AVATAR_ORDER.length;
  const idx = Math.min(AVATAR_ORDER.length - 1, Math.floor(frame / per));
  return (
    <>
      <EngineCanvas draw={(ctx, f, _fp, w, h) => {
        const t = f / fps;
        drawBackdropCrowd(ctx, t, 200, w, h);
        const kind = AVATAR_ORDER[idx];
        const local = f - idx * per;
        const rise = interpolate(local, [0, 12], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const a = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        ctx.save(); ctx.globalAlpha = a;
        spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 3) % 2, w / 2, h * 0.74 + rise, 12, { weapon: 2, ward: 2, held: "weapon" }, { avatar: kind });
        ctx.restore();
      }} />
      <AvatarLabel kind={AVATAR_ORDER[idx]} keyIdx={idx} />
    </>
  );
};
const AvatarLabel: React.FC<{ kind: string; keyIdx: number }> = ({ kind, keyIdx }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const per = durationInFrames / AVATAR_ORDER.length;
  const local = frame - keyIdx * per;
  const a = interpolate(local, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cat = PRESTIGE_CATALOG[kind];
  return (
    <div style={{ position: "absolute", top: "16%", left: 0, right: 0, textAlign: "center", opacity: a }}>
      <div style={{ fontFamily, fontSize: 72, fontWeight: 700, color: PAL.GOLD, letterSpacing: "0.03em", textShadow: "0 4px 26px #0a0810" }}>{cat?.label ?? kind}</div>
      <div style={{ fontFamily, fontSize: 30, color: PAL.BONE_DIM, marginTop: 10, maxWidth: 1100, marginInline: "auto" }}>{cat?.desc}</div>
    </div>
  );
};

// ─── the prestige auras, one hero, cycling ────────────────────────────────────
const AURA_ORDER: { key: PrestigeAuraKey; label: string }[] = [
  { key: "ashen_crown", label: "the Ashen Crown" },
  { key: "corruption_halo", label: "the Corruption Halo" },
  { key: "ember_cinder", label: "the Ember Cinder" },
  { key: "bonewisp", label: "the Bonewisp" },
];
const AuraStage: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const per = durationInFrames / AURA_ORDER.length;
  const idx = Math.min(AURA_ORDER.length - 1, Math.floor(frame / per));
  return (
    <>
      <EngineCanvas draw={(ctx, f, _fp, w, h) => {
        const t = f / fps;
        drawBackdropCrowd(ctx, t, 300, w, h);
        const { key } = AURA_ORDER[idx];
        const spec = PRESTIGE_AURAS[key];
        const af = Math.floor(t * spec.fps) % spec.frames;
        const z = 13;
        const cx = w / 2, cy = h * 0.64;
        drawGrid(ctx, spec.fn(af) as GridLike, cx, cy + 4 * z, z, 32, 56);
        spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 3) % 2, cx, cy, z, { weapon: 2, ward: 2, held: "weapon" }, { dye: "drift", eye: "ember" });
      }} />
      <div style={{ position: "absolute", bottom: "12%", left: 0, right: 0, textAlign: "center", fontFamily, fontSize: 44, color: PAL.DRIFT_HI, letterSpacing: "0.06em", textShadow: "0 3px 18px #0a0810" }}>{AURA_ORDER[idx].label}</div>
    </>
  );
};

// ─── the clip ─────────────────────────────────────────────────────────────────
export const CosmeticsClip: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.VOID }}>
    <Audio src={staticFile("naevyr-music.mp3")} volume={(f) => interpolate(f, [0, 20, COSMETICS_FRAMES - 24, COSMETICS_FRAMES], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />

    <Sequence durationInFrames={INTRO + 8} name="intro">
      <FadeShell>
        <RealmCanvas building="dyeworks" buildingCell={{ x: 11, y: 8 }} crowdSeed={101} crowdCount={20} hero={{ from: { x: 11, y: 15 }, to: { x: 11, y: 10 }, look: { avatar: "ashbound" } } as Hero} />
        <Scrim />
        <TitlePlate at={6} sub="every wanderer is yours to shape">Wear the realm.</TitlePlate>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO} durationInFrames={AVATARS + 8} name="avatars">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #1c1526 0%, #0a0810 80%)" }} />
        <AvatarStage />
        <Scrim />
        <Caption at={6} sub="whole new bodies · burn DRIFTS to wear them" color={PAL.GOLD} y="84%">Four premium characters.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + AVATARS} durationInFrames={DYES + 8} name="dyes">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #1a1426 0%, #0a0810 78%)" }} />
        <ShowcaseCanvas itemZoom={6} items={[
          { type: "char", look: { dye: "ember", eye: "blood" }, label: "Ember" },
          { type: "char", look: { dye: "moss", eye: "water" }, label: "Moss" },
          { type: "char", look: { dye: "blood", eye: "blood" }, label: "Blood" },
          { type: "char", look: { dye: "gold", eye: "gold" }, label: "Gilded" },
          { type: "char", look: { dye: "void", eye: "drift" }, label: "Void" },
          { type: "char", look: { dye: "water", eye: "water" }, label: "Tide" },
        ]} />
        <Scrim />
        <Caption at={6} sub="dye the cloak · light the eyes" color={PAL.GOLD}>Cloak dyes & eye-glows.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + AVATARS + DYES} durationInFrames={AURAS + 8} name="auras">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 48%, #1e1430 0%, #0a0810 80%)" }} />
        <AuraStage />
        <Scrim />
        <Caption at={6} sub="burned into being, never bought with gold" color={PAL.DRIFT_HI} y="20%">Drift-touched auras.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + AVATARS + DYES + AURAS} durationInFrames={PETS + 8} name="pets">
      <FadeShell>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #16121f 0%, #0a0810 78%)" }} />
        <ShowcaseCanvas itemZoom={8} items={[
          { type: "pet", kind: "wisp", label: "Drift Wisp" },
          { type: "pet", kind: "crow", label: "Bone Crow" },
          { type: "pet", kind: "emberling", label: "Emberling" },
        ]} />
        <Scrim />
        <Caption at={6} sub="something to follow you into the dark" color={PAL.GOLD}>Companion pets.</Caption>
        <CornerBrand />
      </FadeShell>
    </Sequence>

    <Sequence from={INTRO + AVATARS + DYES + AURAS + PETS} durationInFrames={CTA} name="cta">
      <PlayNow line="Burn DRIFTS. Wear the proof." />
    </Sequence>
  </AbsoluteFill>
);
