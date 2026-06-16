// The Frontier expansion clip: the doubled world + its new horrors. All drawn
// from the real game art (SpriteCache) — frontier camps, the new creatures and
// Colossus-scale camp warlords, a Drift Rift tearing open, and the Blood Moon.
// Crowded by rule (defenders ring every field). No server needed.
import React from "react";
import {
  AbsoluteFill, Sequence, Audio, staticFile, useVideoConfig, useCurrentFrame, interpolate,
} from "remotion";
import { spriteCache, steedSaddle, STEED_ANCHOR } from "../../game/render/sprites";
import type { BeastKind, BuildingSpriteKey, IsoFacing, RiftState, LookVisual, SteedFacing, WaysideKey } from "../../game/render/sprites";
import {
  EngineCanvas, Cam, camOnCell, cellToScreen, makeCrowd, crowdPose, paint, type CrowdMember,
} from "./engine";
import {
  Caption, TitlePlate, Scrim, CornerBrand, PlayNow, PAL, fontFamily,
} from "./scenes";

export const FPS = 30;
const TITLE = 135, BEASTS = 120, BOSSES = 115, RIFT = 130, MOON = 120, LIFE = 140, CTA = 55;
export const FRONTIER_FRAMES = TITLE + BEASTS + BOSSES + RIFT + MOON + LIFE + CTA;

// ─── frontier ground (ash-bitten: dirt/stone, the Drift creeping in as corrupt) ─
function frontierTile(gx: number, gy: number, seed: number, corruptBias: number): "dirt" | "stone" | "corrupt" {
  const h = Math.abs(Math.sin((gx * 12.9898 + gy * 78.233 + seed) * 43758.5453) % 1);
  if (h < corruptBias) return "corrupt";
  if (h > 0.82) return "stone";
  return "dirt";
}
function drawGround(ctx: CanvasRenderingContext2D, cam: Cam, frame: number, seed: number, focus: { x: number; y: number }, corruptBias: number) {
  const R = 17;
  for (let gy = focus.y - R; gy <= focus.y + R; gy++)
    for (let gx = focus.x - R; gx <= focus.x + R; gx++) {
      const s = cellToScreen(cam, gx, gy);
      if (s.x < -90 || s.x > cam.w + 90 || s.y < -90 || s.y > cam.h + 90) continue;
      const t = frontierTile(gx, gy, seed, corruptBias);
      spriteCache.drawTile(ctx, t, s.x, s.y, cam.z, frame, { variant: (gx * 7 + gy * 3) % 3, edge: true });
    }
}

// ─── a roaming beast (reuses the crowd path/pose maths) ───────────────────────
type RoamBeast = { kind: BeastKind; path: { x: number; y: number }[]; speed: number; phase: number };
// a defender who holds ground and swings
type Defender = { x: number; y: number; look: LookVisual; swing?: boolean };

type FieldConf = {
  seed: number;
  focus: { x: number; y: number };
  zoom: number;
  corruptBias: number;
  buildings: { key: BuildingSpriteKey; x: number; y: number }[];
  beasts: RoamBeast[];
  defenders: Defender[];
  crowd: { seed: number; count: number; cx: number; cy: number };
  rift?: { x: number; y: number; state: RiftState };
  moon?: boolean;
  // interactive frontier life (the new POIs + actors)
  props?: { key: WaysideKey; x: number; y: number }[];
  claimProps?: { key: "stash" | "workbench" | "ward" | "rune"; x: number; y: number }[];
  trader?: { path: { x: number; y: number }[]; speed: number; phase: number };
  mount?: { path: { x: number; y: number }[]; speed: number; phase: number; look: LookVisual };
};

const FrontierField: React.FC<{ conf: FieldConf }> = ({ conf }) => {
  const { fps } = useVideoConfig();
  const crowd = React.useMemo(
    () => makeCrowd(conf.crowd.seed, conf.crowd.count, conf.crowd.cx, conf.crowd.cy, 8),
    [conf.crowd.seed, conf.crowd.count, conf.crowd.cx, conf.crowd.cy],
  );
  return (
    <EngineCanvas
      draw={(ctx, frame) => {
        const cam = camOnCell(conf.focus.x, conf.focus.y, conf.zoom, ctx.canvas.width, ctx.canvas.height);
        const t = frame / fps;
        drawGround(ctx, cam, frame, conf.seed, { x: Math.round(conf.focus.x), y: Math.round(conf.focus.y) }, conf.corruptBias);

        // the Blood Moon hangs in the sky (screen space, behind everything)
        if (conf.moon) {
          spriteCache.drawBloodMoon(ctx, Math.floor(t * 2) % 2, ctx.canvas.width * 0.8, ctx.canvas.height * 0.2, 4.2);
        }

        const items: { depth: number; draw: () => void }[] = [];

        // buildings (camps / monolith / outpost)
        for (const b of conf.buildings) {
          items.push({
            depth: b.x + b.y - 0.5,
            draw: () => {
              const s = cellToScreen(cam, b.x, b.y);
              spriteCache.drawBuilding(ctx, b.key, s.x, s.y, cam.z, Math.floor(t * 3) % 3, false);
            },
          });
        }

        // interactive POIs (bounty boards / supply posts / quartermaster stalls)
        for (const pr of conf.props ?? []) {
          items.push({
            depth: pr.x + pr.y - 0.4,
            draw: () => {
              const s = cellToScreen(cam, pr.x, pr.y);
              spriteCache.drawWayside(ctx, pr.key, Math.floor(t * 3), s.x, s.y, cam.z);
            },
          });
        }

        // claim upgrade props (stash / workbench / ward / rune)
        for (const cp of conf.claimProps ?? []) {
          items.push({
            depth: cp.x + cp.y - 0.3,
            draw: () => {
              const s = cellToScreen(cam, cp.x, cp.y);
              spriteCache.drawClaimProp(ctx, cp.key, Math.floor(t * 3), s.x, s.y, cam.z);
            },
          });
        }

        // the Roaming Trader + pack mule (the mule trails a beat behind)
        if (conf.trader) {
          const tr = conf.trader;
          const pe = crowdPose({ path: tr.path, speed: tr.speed, phase: tr.phase } as CrowdMember, t);
          const pm = crowdPose({ path: tr.path, speed: tr.speed, phase: tr.phase } as CrowdMember, t - 0.7);
          const muleFacing = (pm.facing === "ne" ? "n" : pm.facing) as "s" | "se" | "e" | "n";
          items.push({
            depth: pm.x + pm.y,
            draw: () => {
              const s = cellToScreen(cam, pm.x, pm.y);
              spriteCache.drawPackMule(ctx, muleFacing, Math.floor(t * 5) % 4, s.x, s.y, cam.z, pm.mirror);
            },
          });
          items.push({
            depth: pe.x + pe.y + 0.05,
            draw: () => {
              const s = cellToScreen(cam, pe.x, pe.y);
              const tf = pe.moving ? Math.floor(t * 7) % 6 : Math.floor(t * 3) % 2;
              spriteCache.drawTrader(ctx, pe.facing, pe.moving ? "walk" : "idle", tf, s.x, s.y, cam.z, pe.mirror);
            },
          });
        }

        // a mounted rider on a swift steed (drift-road fast travel)
        if (conf.mount) {
          const mt = conf.mount;
          const p = crowdPose({ path: mt.path, speed: mt.speed, phase: mt.phase } as CrowdMember, t);
          const fc = p.facing as SteedFacing;
          const sf = Math.floor(t * 9) % 6;
          items.push({
            depth: p.x + p.y + 0.2,
            draw: () => {
              const s = cellToScreen(cam, p.x, p.y);
              spriteCache.drawSteed(ctx, fc, p.mirror, "walk", sf, s.x, s.y, cam.z);
              const sad = steedSaddle(fc, "walk", sf);
              const [ax, ay] = STEED_ANCHOR;
              const cx2 = p.mirror ? s.x - (sad.x - ax) * cam.z : s.x + (sad.x - ax) * cam.z;
              const cy2 = s.y + (sad.y - ay) * cam.z;
              spriteCache.drawChar(ctx, p.facing, p.mirror, "walk", sf, cx2, cy2, cam.z, { weapon: 2, ward: 1, held: "weapon" }, mt.look);
            },
          });
        }

        // the rift, if any (anchored at its cell base)
        if (conf.rift) {
          const r = conf.rift;
          items.push({
            depth: r.x + r.y,
            draw: () => {
              const s = cellToScreen(cam, r.x, r.y);
              spriteCache.drawRift(ctx, r.state, Math.floor(t * 6), s.x, s.y, cam.z);
              // motes spitting up out of the tear
              for (let i = 0; i < 7; i++) {
                const a = t * 1.4 + i * 0.9;
                const mx = s.x + Math.cos(a) * (10 + i * 3) * cam.z;
                const my = s.y - 18 * cam.z - ((t * 26 + i * 9) % 70) * cam.z;
                spriteCache.drawRiftMote(ctx, Math.floor(t * 8 + i) % 2, mx, my, cam.z * 0.9);
              }
            },
          });
        }

        // roaming beasts
        for (const b of conf.beasts) {
          const p = crowdPose({ path: b.path, speed: b.speed, phase: b.phase } as CrowdMember, t);
          items.push({
            depth: p.x + p.y,
            draw: () => {
              const s = cellToScreen(cam, p.x, p.y);
              spriteCache.drawBeast(ctx, b.kind, p.facing, p.mirror, "move", Math.floor(t * 7), s.x, s.y, cam.z);
            },
          });
        }

        // defenders (wanderers holding the line)
        for (const d of conf.defenders) {
          items.push({
            depth: d.x + d.y + 0.1,
            draw: () => {
              const s = cellToScreen(cam, d.x, d.y);
              const af = d.swing ? Math.floor(t * 8) % 4 : Math.floor(t * 3) % 2;
              spriteCache.drawChar(ctx, "se", false, d.swing ? "swing" : "idle", af, s.x, s.y, cam.z, { weapon: 2, ward: 2, held: "weapon" }, d.look);
            },
          });
        }

        // the crowd (more wanderers in the back — keep it busy)
        for (const m of crowd as (CrowdMember & { pet?: string })[]) {
          const p = crowdPose(m, t);
          items.push({
            depth: p.x + p.y,
            draw: () => {
              const s = cellToScreen(cam, p.x, p.y);
              const af = p.moving ? Math.floor(t * 8) % 6 : Math.floor(t * 3) % 2;
              spriteCache.drawChar(ctx, p.facing, p.mirror, p.moving ? "walk" : "idle", af, s.x, s.y, cam.z, m.equip, m.look);
              if (m.pet) spriteCache.drawPet(ctx, m.pet, Math.floor(t * 4) % 2, s.x + 12 * cam.z, s.y + 4 * cam.z, cam.z);
            },
          });
        }

        paint(items);
      }}
    />
  );
};

// ─── a centered row of beasts, doing their ATTACK anim, with labels ───────────
type ParadeBeast = { kind: BeastKind; label: string; targetPx: number };
const BeastParade: React.FC<{ beasts: ParadeBeast[]; baseY?: number }> = ({ beasts, baseY = 0.62 }) => {
  const { fps } = useVideoConfig();
  return (
    <EngineCanvas
      draw={(ctx, frame, _f, w, h) => {
        const t = frame / fps;
        const n = beasts.length;
        const gap = w / (n + 1);
        const by = h * baseY;
        beasts.forEach((b, i) => {
          const cx = gap * (i + 1);
          const reveal = interpolate(frame, [i * 6, i * 6 + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (reveal <= 0) return;
          const z = Math.min(7.5, b.targetPx / spriteCache.beastHeight(b.kind));
          const bob = Math.sin(t * 2 + i) * 6;
          ctx.save();
          ctx.globalAlpha = reveal;
          spriteCache.drawBeast(ctx, b.kind, "s", false, "attack", Math.floor(t * 6), cx, by + bob, z);
          // label plate
          ctx.globalAlpha = reveal;
          ctx.textAlign = "center";
          ctx.font = `700 24px ui-sans-serif`;
          const tw = ctx.measureText(b.label).width;
          ctx.fillStyle = "rgba(10,8,16,0.86)";
          ctx.fillRect(cx - tw / 2 - 14, by + 34, tw + 28, 34);
          ctx.fillStyle = PAL.BONE;
          ctx.fillText(b.label, cx, by + 57);
          ctx.textAlign = "left";
          ctx.restore();
        });
      }}
    />
  );
};

// ─── 10f cross-fade shell ─────────────────────────────────────────────────────
const FadeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// a coloured atmosphere wash over a field (drift purple / blood red)
const Wash: React.FC<{ color: string; strength?: number }> = ({ color, strength = 0.22 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, transparent 30%, ${color} 100%)`, opacity: strength, pointerEvents: "none", mixBlendMode: "screen" }} />
);

// ─── beat configs ─────────────────────────────────────────────────────────────
const DEF_LOOKS: LookVisual[] = [
  { dye: "ember", eye: "blood" }, { dye: "drift", eye: "drift" },
  { dye: "gold", eye: "gold" }, { dye: "bone", eye: "ember" },
];

const TITLE_FIELD: FieldConf = {
  seed: 91, focus: { x: 11, y: 11 }, zoom: 2.7, corruptBias: 0.16,
  buildings: [
    { key: "ashwarcamp", x: 10, y: 14 },
    { key: "waystation", x: 16, y: 9 },
  ],
  beasts: [
    { kind: "brute", path: [{ x: 12, y: 12 }, { x: 9, y: 14 }, { x: 13, y: 15 }], speed: 1.0, phase: 0.1 },
    { kind: "bogwretch", path: [{ x: 14, y: 10 }, { x: 16, y: 13 }, { x: 13, y: 13 }], speed: 1.2, phase: 0.4 },
    { kind: "stalker", path: [{ x: 8, y: 11 }, { x: 11, y: 9 }, { x: 7, y: 13 }], speed: 1.5, phase: 0.7 },
    { kind: "wisp", path: [{ x: 10, y: 10 }, { x: 12, y: 8 }, { x: 9, y: 9 }], speed: 1.8, phase: 0.2 },
  ],
  defenders: [
    { x: 13, y: 13, look: DEF_LOOKS[0], swing: true },
    { x: 11, y: 14, look: DEF_LOOKS[3] },
  ],
  crowd: { seed: 91, count: 14, cx: 12, cy: 15 },
};

const RIFT_FIELD: FieldConf = {
  seed: 47, focus: { x: 11, y: 12 }, zoom: 2.8, corruptBias: 0.34,
  buildings: [{ key: "barrowcrypt", x: 8, y: 8 }],
  rift: { x: 11, y: 10, state: "active" },
  beasts: [
    { kind: "wisp", path: [{ x: 11, y: 10 }, { x: 14, y: 12 }, { x: 12, y: 14 }], speed: 1.9, phase: 0.0 },
    { kind: "wisp", path: [{ x: 11, y: 10 }, { x: 8, y: 12 }, { x: 10, y: 13 }], speed: 1.7, phase: 0.5 },
    { kind: "bogwretch", path: [{ x: 11, y: 10 }, { x: 13, y: 13 }, { x: 9, y: 13 }], speed: 1.2, phase: 0.3 },
  ],
  defenders: [
    { x: 13, y: 12, look: DEF_LOOKS[0], swing: true },
    { x: 9, y: 12, look: DEF_LOOKS[1], swing: true },
    { x: 11, y: 14, look: DEF_LOOKS[2] },
  ],
  crowd: { seed: 47, count: 10, cx: 11, cy: 16 },
};

const MOON_FIELD: FieldConf = {
  seed: 13, focus: { x: 11, y: 12 }, zoom: 2.7, corruptBias: 0.4, moon: true,
  buildings: [{ key: "outpost", x: 9, y: 8 }, { key: "watchtower", x: 15, y: 8 }],
  beasts: [
    { kind: "brute", path: [{ x: 12, y: 11 }, { x: 9, y: 13 }, { x: 13, y: 14 }], speed: 1.1, phase: 0.1 },
    { kind: "wight", path: [{ x: 14, y: 11 }, { x: 16, y: 13 }, { x: 13, y: 14 }], speed: 1.0, phase: 0.5 },
    { kind: "bonehusk", path: [{ x: 8, y: 12 }, { x: 11, y: 14 }, { x: 7, y: 13 }], speed: 1.4, phase: 0.7 },
    { kind: "stalker", path: [{ x: 10, y: 11 }, { x: 13, y: 9 }, { x: 9, y: 10 }], speed: 1.6, phase: 0.2 },
    { kind: "bogwretch", path: [{ x: 15, y: 12 }, { x: 12, y: 15 }, { x: 16, y: 14 }], speed: 1.2, phase: 0.9 },
  ],
  defenders: [
    { x: 12, y: 14, look: DEF_LOOKS[0], swing: true },
    { x: 10, y: 13, look: DEF_LOOKS[3], swing: true },
    { x: 13, y: 12, look: DEF_LOOKS[1] },
  ],
  crowd: { seed: 13, count: 12, cx: 11, cy: 16 },
};

// a settled, working stretch of the frontier — the new POIs, the trader, a steed
const LIFE_FIELD: FieldConf = {
  seed: 71, focus: { x: 11, y: 12 }, zoom: 2.5, corruptBias: 0.06,
  buildings: [
    { key: "waystation", x: 13, y: 15 },
    { key: "outpost", x: 16, y: 7 },
  ],
  props: [
    { key: "bounty_board", x: 10, y: 9 },
    { key: "supply_post", x: 13, y: 10 },
    { key: "quartermaster_stall", x: 6, y: 12 },
  ],
  claimProps: [
    { key: "ward", x: 16, y: 12 },
    { key: "stash", x: 15, y: 13 },
  ],
  trader: { path: [{ x: 5, y: 14 }, { x: 10, y: 13 }, { x: 15, y: 14 }], speed: 1.1, phase: 0.1 },
  mount: { path: [{ x: 4, y: 11 }, { x: 9, y: 12 }, { x: 14, y: 11 }, { x: 9, y: 12 }], speed: 2.0, phase: 0.0, look: { dye: "gold", eye: "gold" } },
  beasts: [],
  defenders: [{ x: 12, y: 13, look: DEF_LOOKS[2] }],
  crowd: { seed: 71, count: 13, cx: 11, cy: 15 },
};

// ─── the showcase scenes (each is a self-contained FadeShell beat; reused by
//     both the standalone FrontierClip AND the full ExpansionTrailer) ───────────
export const FrontierTitleScene: React.FC = () => (
  <FadeShell>
    <FrontierField conf={TITLE_FIELD} />
    <Wash color="rgba(168,85,247,0.5)" />
    <Scrim />
    <TitlePlate at={6} sub="the world doubled. the Drift dug deeper.">THE FRONTIER</TitlePlate>
    <Caption at={40} sub="frontier camps · waystations · drift roads">A wider, hungrier map</Caption>
    <CornerBrand />
  </FadeShell>
);

export const HorrorsScene: React.FC = () => (
  <FadeShell>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 44%, #1c1526 0%, #0a0810 76%)" }} />
    <BeastParade beasts={[
      { kind: "bogwretch", label: "Bogwretch", targetPx: 270 },
      { kind: "brute", label: "Ash Brute", targetPx: 330 },
      { kind: "bonehusk", label: "Bone Husk", targetPx: 300 },
      { kind: "wisp", label: "Drift Wisp", targetPx: 230 },
      { kind: "wight", label: "Barrow Wight", targetPx: 300 },
    ]} />
    <Scrim />
    <TitlePlate at={6} sub="they spit, they conjure, they swarm">NEW HORRORS</TitlePlate>
    <Caption at={8} color={PAL.GOLD} sub="ranged bog-spit · summoned adds · diving wisps">Five new species roam the wilds</Caption>
    <CornerBrand />
  </FadeShell>
);

export const WarlordsScene: React.FC = () => (
  <FadeShell>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #241016 0%, #0a0810 78%)" }} />
    <BeastParade baseY={0.66} beasts={[
      { kind: "drownedking", label: "The Drowned King", targetPx: 520 },
      { kind: "barrowlord", label: "The Barrow Lord", targetPx: 540 },
      { kind: "ashwarlord", label: "The Ashen Warlord", targetPx: 520 },
    ]} />
    <Wash color="rgba(220,38,38,0.55)" />
    <Scrim />
    <TitlePlate at={6} sub="each camp answers to a Colossus-scale boss">THE WARLORDS</TitlePlate>
    <Caption at={8} color={PAL.GOLD} sub="160-176 hp · they guard the war-chests">Bring friends. Bring more.</Caption>
    <CornerBrand />
  </FadeShell>
);

export const RiftScene: React.FC = () => (
  <FadeShell>
    <FrontierField conf={RIFT_FIELD} />
    <Wash color="rgba(168,85,247,0.7)" strength={0.3} />
    <Scrim />
    <TitlePlate at={6} sub="tears in the world that vomit the Drift">DRIFT RIFTS</TitlePlate>
    <Caption at={8} sub="cut down what crawls out before it seals shut">Seal it for gold and shards</Caption>
    <CornerBrand />
  </FadeShell>
);

export const MoonScene: React.FC = () => (
  <FadeShell>
    <FrontierField conf={MOON_FIELD} />
    <Wash color="rgba(220,38,38,0.85)" strength={0.32} />
    <Scrim />
    <TitlePlate at={6} color={PAL.BLOOD} sub="when it rises, everything hunts at once">THE BLOOD MOON</TitlePlate>
    <Caption at={8} color={PAL.GOLD} sub="hold the outpost · survive until it sets">The wilds turn feral</Caption>
    <CornerBrand />
  </FadeShell>
);

export const LifeScene: React.FC = () => (
  <FadeShell>
    <FrontierField conf={LIFE_FIELD} />
    <Wash color="rgba(231,200,115,0.6)" strength={0.16} />
    <Scrim />
    <TitlePlate at={6} color={PAL.GOLD} sub="the wilds give you work, and a way to run it">A LIVING FRONTIER</TitlePlate>
    <Caption at={8} sub="bounty boards · a roaming trader · drift roads · swift steeds">Earn it. Spend it. Claim it.</Caption>
    <CornerBrand />
  </FadeShell>
);

// the per-scene durations, exported so the ExpansionTrailer can lay them out too
export const FRONTIER_SCENES = { TITLE, BEASTS, BOSSES, RIFT, MOON, LIFE, CTA };

// ─── the standalone clip ──────────────────────────────────────────────────────
export const FrontierClip: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.VOID }}>
    <Audio src={staticFile("naevyr-music.mp3")} volume={(f) => interpolate(f, [0, 20, FRONTIER_FRAMES - 24, FRONTIER_FRAMES], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />

    <Sequence durationInFrames={TITLE + 8} name="frontier"><FrontierTitleScene /></Sequence>
    <Sequence from={TITLE} durationInFrames={BEASTS + 8} name="beasts"><HorrorsScene /></Sequence>
    <Sequence from={TITLE + BEASTS} durationInFrames={BOSSES + 8} name="bosses"><WarlordsScene /></Sequence>
    <Sequence from={TITLE + BEASTS + BOSSES} durationInFrames={RIFT + 8} name="rift"><RiftScene /></Sequence>
    <Sequence from={TITLE + BEASTS + BOSSES + RIFT} durationInFrames={MOON + 8} name="moon"><MoonScene /></Sequence>
    <Sequence from={TITLE + BEASTS + BOSSES + RIFT + MOON} durationInFrames={LIFE + 8} name="life"><LifeScene /></Sequence>
    <Sequence from={TITLE + BEASTS + BOSSES + RIFT + MOON + LIFE} durationInFrames={CTA} name="cta">
      <PlayNow line="The frontier is open." />
    </Sequence>
  </AbsoluteFill>
);
