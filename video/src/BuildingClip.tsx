// One clip per Waystation building: START in the crowded realm → the hero walks
// IN through the door → DO the thing inside → a look at what you get → PLAY NOW.
// All rendered from the real game art (SpriteCache) so it matches the live game.
import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useVideoConfig, useCurrentFrame, interpolate } from "remotion";
import { INTERIORS } from "../../game/world/interior";
import { DRINK_CATALOG, PROP_CATALOG, PET_CATALOG } from "../../game/types";
import type { BuildingSpriteKey } from "../../game/render/sprites";
import {
  RealmCanvas, RoomCanvas, ShowcaseCanvas, Caption, TitlePlate, Scrim, CornerBrand, PlayNow, PAL, fontFamily,
  type Hero, type RoomHero,
} from "./scenes";

export const FPS = 30;
const REALM = 100, INSIDE = 120, GOODS = 105, CTA = 55;
export const BUILDING_FRAMES = REALM + INSIDE + GOODS + CTA;

// where the building sits in the realm establishing shot + the hero's approach
const B_CELL = { x: 11, y: 8 };
const HERO_FROM = { x: 11, y: 15 };
const HERO_TO = { x: 11, y: 9 };

export type BuildingConf = {
  id: string;
  interiorKey: keyof typeof INTERIORS;
  exterior: BuildingSpriteKey;
  name: string;
  tagline: string;
  verb: React.ReactNode;     // interior caption
  verbSub: string;
  roomHero: RoomHero;
  goods: React.ReactNode;    // the "what you get" beat
  goodsCaption: React.ReactNode;
  goodsSub: string;
  ctaLine: string;
  crowdSeed: number;
};

/** DOM chips for text-y goods (drinks, brews) */
const Chips: React.FC<{ rows: { title: string; sub: string; color: string }[] }> = ({ rows }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 22 }}>
    {rows.map((r, i) => {
      const frame = useCurrentFrame();
      const a = interpolate(frame, [i * 6, i * 6 + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const x = interpolate(frame, [i * 6, i * 6 + 12], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <div key={i} style={{ opacity: a, transform: `translateX(${x}px)`, display: "flex", alignItems: "baseline", gap: 18, background: "rgba(10,8,16,0.78)", border: `3px solid ${r.color}`, borderRadius: 12, padding: "14px 34px", minWidth: 620 }}>
          <span style={{ fontFamily, fontSize: 40, fontWeight: 700, color: r.color }}>{r.title}</span>
          <span style={{ fontFamily, fontSize: 28, color: PAL.BONE_DIM }}>{r.sub}</span>
        </div>
      );
    })}
  </AbsoluteFill>
);

// ─── the 7 buildings ──────────────────────────────────────────────────────────
export const BUILDINGS: BuildingConf[] = [
  {
    id: "Dyeworks", interiorKey: "dyeworks", exterior: "dyeworks",
    name: "The Dyeworks", tagline: "where wanderers are remade",
    verb: <>Dye your cloak.</>, verbSub: "vats of ember, blood, drift and bone",
    roomHero: { cell: { x: 4, y: 3 }, facing: "n", anim: "idle", look: { dye: "drift", eye: "ember" } },
    goods: <ShowcaseCanvas itemZoom={7} items={[
      { type: "char", look: { dye: "ember", eye: "blood" }, label: "Ember" },
      { type: "char", look: { dye: "drift", eye: "drift" }, label: "Driftweave" },
      { type: "char", look: { dye: "gold", eye: "gold" }, label: "Gilded" },
      { type: "char", look: { avatar: "bonecaller" }, label: "Bonecaller" },
      { type: "char", look: { avatar: "veilborn" }, label: "Veilborn" },
    ]} />,
    goodsCaption: <>Dyes · eye-glows · whole new bodies</>, goodsSub: "burn DRIFTS for the Drift-touched looks",
    ctaLine: "Become someone the Drift remembers.", crowdSeed: 11,
  },
  {
    id: "Vault", interiorKey: "vault", exterior: "vault",
    name: "The Vault", tagline: "gold kept, gold changed",
    verb: <>Bank your gold.</>, verbSub: "and weigh it against DRIFTS at the scales",
    roomHero: { cell: { x: 4, y: 3 }, facing: "n", anim: "idle", look: { dye: "gold", eye: "gold" } },
    goods: <ShowcaseCanvas itemZoom={8} items={[
      { type: "fixture", kind: "exchange", accent: "#e7c873", label: "The Exchange" },
    ]} />,
    goodsCaption: <>The Exchange · gold ⇄ <span style={{ color: PAL.DRIFT_HI }}>DRIFTS</span></>, goodsSub: "fixed rate, paid only from the merchant's purse",
    ctaLine: "The grind becomes the coin.", crowdSeed: 22,
  },
  {
    id: "Lantern", interiorKey: "lantern", exterior: "lantern",
    name: "The Last Lantern", tagline: "the only warm room left",
    verb: <>Drink to the buffs.</>, verbSub: "the hearth never quite goes out",
    roomHero: { cell: { x: 5, y: 3 }, facing: "n", anim: "idle", look: { dye: "ember", eye: "ember" } },
    goods: <Chips rows={[
      { title: DRINK_CATALOG.emberwine.label, sub: DRINK_CATALOG.emberwine.desc, color: PAL.EMBER },
      { title: DRINK_CATALOG.boneale.label, sub: DRINK_CATALOG.boneale.desc, color: PAL.BONE },
      { title: DRINK_CATALOG.driftgin.label, sub: DRINK_CATALOG.driftgin.desc, color: PAL.DRIFT_HI },
    ]} />,
    goodsCaption: <>Three draughts. Five minutes of edge.</>, goodsSub: "gather faster · hit harder · see the veins",
    ctaLine: "Drink before the dark.", crowdSeed: 33,
  },
  {
    id: "Furnisher", interiorKey: "furnisher", exterior: "furnisher",
    name: "The Furnisher", tagline: "make a claim a home",
    verb: <>Furnish your claim.</>, verbSub: "props you stake on land you hold",
    roomHero: { cell: { x: 4, y: 3 }, facing: "n", anim: "idle", look: { dye: "moss", eye: "water" } },
    goods: <ShowcaseCanvas itemZoom={7} items={[
      { type: "prop", kind: "campfire", label: PROP_CATALOG.campfire.label },
      { type: "prop", kind: "banner", label: PROP_CATALOG.banner.label },
      { type: "prop", kind: "driftlamp", label: PROP_CATALOG.driftlamp.label },
      { type: "prop", kind: "statue", label: PROP_CATALOG.statue.label },
    ]} />,
    goodsCaption: <>Campfire · Banner · Drift Lamp · Statue</>, goodsSub: "plant your mark before the Drift takes the ground",
    ctaLine: "Hold a corner of a dying world.", crowdSeed: 44,
  },
  {
    id: "Menagerie", interiorKey: "menagerie", exterior: "menagerie",
    name: "The Menagerie", tagline: "nothing here should be alive",
    verb: <>Take a companion.</>, verbSub: "something to follow you into the Drift",
    roomHero: { cell: { x: 4, y: 3 }, facing: "n", anim: "idle", look: { dye: "water", eye: "water" } },
    goods: <ShowcaseCanvas itemZoom={8} items={[
      { type: "pet", kind: "wisp", label: PET_CATALOG.wisp.label },
      { type: "pet", kind: "crow", label: PET_CATALOG.crow.label },
      { type: "pet", kind: "emberling", label: PET_CATALOG.emberling.label },
    ]} />,
    goodsCaption: <>A wisp, a crow, a coal that won't die</>, goodsSub: "they remember where everything died",
    ctaLine: "Walk the Drift with company.", crowdSeed: 55,
  },
  {
    id: "Mine", interiorKey: "mine", exterior: "mine",
    name: "The Mine", tagline: "deep under the Bonefields",
    verb: <>Swing for gold.</>, verbSub: "the glittering veins pay every strike",
    roomHero: { cell: { x: 2, y: 1 }, facing: "n", anim: "swing", look: { dye: "stone", eye: "gold" } },
    goods: <ShowcaseCanvas itemZoom={8} items={[
      { type: "fixture", kind: "goldVein", accent: "#e7c873", label: "Gold Vein" },
      { type: "char", look: { dye: "stone", eye: "gold" }, equip: { weapon: 2, ward: 1, held: "weapon" }, label: "Every strike pays", swing: true },
    ]} />,
    goodsCaption: <>Mine the vein. It pays in gold.</>, goodsSub: "skill makes you faster · veins regrow",
    ctaLine: "The deep still has gold to give.", crowdSeed: 66,
  },
  {
    id: "Mirewife", interiorKey: "mirehut", exterior: "mirehut",
    name: "The Mirewife's Hut", tagline: "out in Hollowmere Reach",
    verb: <>Brew her draughts.</>, verbSub: "gold and materials, stirred into power",
    roomHero: { cell: { x: 4, y: 3 }, facing: "n", anim: "idle", look: { dye: "moss", eye: "drift" } },
    goods: <Chips rows={[
      { title: "Brews", sub: "stronger buffs, brewed from what you gather", color: PAL.MOSS },
      { title: "Read the Drift", sub: "she forecasts where the corruption crawls next", color: PAL.DRIFT_HI },
    ]} />,
    goodsCaption: <>Brew power. Read the Drift.</>, goodsSub: "know where the corruption turns before it does",
    ctaLine: "The bog keeps its secrets cheap.", crowdSeed: 77,
  },
];

// ─── the clip ─────────────────────────────────────────────────────────────────
// NB: take only an `id` (serializable) and look the conf up here — the configs
// hold React elements (goods/captions) which do NOT survive Remotion's
// defaultProps JSON serialization.
export const BuildingClip: React.FC<{ id: string }> = ({ id }) => {
  const conf = BUILDINGS.find((b) => b.id === id) ?? BUILDINGS[0];
  const spec = INTERIORS[conf.interiorKey]!;
  const hero: Hero = { from: HERO_FROM, to: HERO_TO, look: { dye: "blood", eye: "blood" } };
  return (
    <AbsoluteFill style={{ background: PAL.VOID }}>
      <Audio src={staticFile("naevyr-music.mp3")} volume={(f) => interpolate(f, [0, 20, BUILDING_FRAMES - 24, BUILDING_FRAMES], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />

      <Sequence durationInFrames={REALM + 8} name="realm">
        <FadeShell>
          <RealmCanvas building={conf.exterior} buildingCell={B_CELL} crowdSeed={conf.crowdSeed} hero={hero} />
          <Scrim />
          <TitlePlate at={6} sub={conf.tagline}>{conf.name}</TitlePlate>
          <CornerBrand />
        </FadeShell>
      </Sequence>

      <Sequence from={REALM} durationInFrames={INSIDE + 8} name="inside">
        <FadeShell>
          <RoomCanvas spec={spec} hero={conf.roomHero} />
          <Scrim />
          <Caption at={8} sub={conf.verbSub}>{conf.verb}</Caption>
          <CornerBrand />
        </FadeShell>
      </Sequence>

      <Sequence from={REALM + INSIDE} durationInFrames={GOODS + 8} name="goods">
        <FadeShell>
          <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #1c1526 0%, #0a0810 75%)" }} />
          {conf.goods}
          <Scrim />
          <Caption at={6} sub={conf.goodsSub} color={PAL.GOLD}>{conf.goodsCaption}</Caption>
          <CornerBrand />
        </FadeShell>
      </Sequence>

      <Sequence from={REALM + INSIDE + GOODS} durationInFrames={CTA} name="cta">
        <PlayNow line={conf.ctaLine} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 10f cross-fade shell so beats don't hard-cut */
const FadeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
