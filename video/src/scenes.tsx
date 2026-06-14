// Reusable canvas scenes built on the engine kit: a CROWDED overworld (lots of
// wanderers around a building) and a faithful building interior. Plus the DOM
// overlay bits (caption plates, vignette, brand) shared by every clip.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { spriteCache } from "../../game/render/sprites";
import { gridToIso } from "../../game/render/iso";
import type { BuildingSpriteKey, LookVisual, IsoFacing } from "../../game/render/sprites";
import type { InteriorSpec } from "../../game/world/interior";
import {
  EngineCanvas, Cam, camOnCell, cellToScreen, makeCrowd, crowdPose,
  facingFor, paint, type CrowdMember,
} from "./engine";

const VOID = "#0a0810";
export const PAL = {
  VOID, BONE: "#efe9f4", BONE_DIM: "#a99fb8", GOLD: "#e7c873",
  DRIFT: "#a855f7", DRIFT_HI: "#d8b4fe", EMBER: "#f59e0b", BLOOD: "#dc2626", MOSS: "#4d7c4d",
};

// ─── deterministic ground (mostly grass, a dirt plaza, stray dirt) ────────────
function groundType(gx: number, gy: number, seed: number, plaza?: { x: number; y: number; r: number }) {
  if (plaza && Math.max(Math.abs(gx - plaza.x), Math.abs(gy - plaza.y)) <= plaza.r) return "dirt";
  const h = Math.abs(Math.sin((gx * 12.9898 + gy * 78.233 + seed) * 43758.5453) % 1);
  if (h > 0.86) return "dirt";
  if (h > 0.8) return "stone";
  return "grass";
}

function drawGround(ctx: CanvasRenderingContext2D, cam: Cam, frame: number, seed: number, focus: { x: number; y: number }, plaza?: { x: number; y: number; r: number }) {
  const R = 16;
  for (let gy = focus.y - R; gy <= focus.y + R; gy++) {
    for (let gx = focus.x - R; gx <= focus.x + R; gx++) {
      const s = cellToScreen(cam, gx, gy);
      if (s.x < -80 || s.x > cam.w + 80 || s.y < -80 || s.y > cam.h + 80) continue;
      const t = groundType(gx, gy, seed, plaza);
      spriteCache.drawTile(ctx, t as never, s.x, s.y, cam.z, frame, { variant: (gx * 7 + gy * 3) % 3, edge: true });
    }
  }
}

// ─── a hero who walks from A to B across the scene, then idles ────────────────
export type Hero = { from: { x: number; y: number }; to: { x: number; y: number }; look?: LookVisual; arriveAt?: number };

function heroPose(hero: Hero, frame: number, fps: number, total: number) {
  const arrive = hero.arriveAt ?? total * 0.62;
  const t = Math.min(1, frame / arrive);
  const x = hero.from.x + (hero.to.x - hero.from.x) * t;
  const y = hero.from.y + (hero.to.y - hero.from.y) * t;
  const moving = t < 1;
  const fac = facingFor(hero.to.x - hero.from.x, hero.to.y - hero.from.y);
  const anim = moving ? "walk" : "idle";
  const af = moving ? Math.floor((frame / fps) * 8) % 6 : Math.floor((frame / fps) * 3) % 2;
  return { x, y, ...fac, anim: anim as "walk" | "idle", af };
}

// ─── CROWDED REALM canvas ─────────────────────────────────────────────────────
export const RealmCanvas: React.FC<{
  building: BuildingSpriteKey;
  buildingCell: { x: number; y: number };
  crowdSeed: number;
  crowdCount?: number;
  hero: Hero;
  zoom?: number;
  /** camera focus cell; defaults between hero start and the building */
  focus?: { x: number; y: number };
}> = ({ building, buildingCell, crowdSeed, crowdCount = 16, hero, zoom = 2.7, focus }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const crowd = React.useMemo(() => makeCrowd(crowdSeed, crowdCount, buildingCell.x, buildingCell.y + 4, 7), [crowdSeed, crowdCount, buildingCell.x, buildingCell.y]);
  const foc = focus ?? { x: (buildingCell.x + hero.from.x) / 2, y: (buildingCell.y + hero.from.y) / 2 + 1 };
  return (
    <EngineCanvas
      draw={(ctx, frame) => {
        const cam = camOnCell(foc.x, foc.y, zoom, ctx.canvas.width, ctx.canvas.height);
        const t = frame / fps;
        drawGround(ctx, cam, frame, crowdSeed, { x: Math.round(foc.x), y: Math.round(foc.y) }, { x: buildingCell.x, y: buildingCell.y + 3, r: 4 });
        const items: { depth: number; draw: () => void }[] = [];
        // the building
        items.push({
          depth: buildingCell.x + buildingCell.y,
          draw: () => {
            const s = cellToScreen(cam, buildingCell.x, buildingCell.y);
            spriteCache.drawBuilding(ctx, building, s.x, s.y, cam.z, Math.floor(t * 3) % 3, false);
          },
        });
        // the crowd
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
        // the hero
        const hp = heroPose(hero, frame, fps, durationInFrames);
        items.push({
          depth: hp.x + hp.y + 0.1,
          draw: () => {
            const s = cellToScreen(cam, hp.x, hp.y);
            spriteCache.drawChar(ctx, hp.facing, hp.mirror, hp.anim, hp.af, s.x, s.y, cam.z, { weapon: 2, ward: 2, held: "weapon" }, hero.look ?? { dye: "ember", eye: "blood" });
          },
        });
        paint(items);
      }}
    />
  );
};

// ─── BUILDING INTERIOR canvas (faithful port of game.ts drawInterior) ─────────
export type RoomHero = { cell: { x: number; y: number }; facing?: IsoFacing; anim?: "idle" | "swing"; look?: LookVisual };

export const RoomCanvas: React.FC<{
  spec: InteriorSpec;
  hero: RoomHero;
  zoom?: number;
}> = ({ spec, hero, zoom }) => {
  const { fps } = useVideoConfig();
  const isoC = gridToIso((spec.w - 1) / 2, (spec.h - 1) / 2);
  const isoW = (spec.w + spec.h) * 32;
  const autoZ = Math.min(3.4, (1920 * 0.6) / isoW);
  const z = zoom ?? autoZ;
  return (
    <EngineCanvas
      draw={(ctx, frame, _fps, w, h) => {
        const t = frame / fps;
        // a torch-lit room on the void, with a soft back-wall wash
        const cam: Cam = { cx: isoC.x, cy: isoC.y - 26, z, w, h };
        const tile = (x: number, y: number) => cellToScreen(cam, x, y);
        // back-wall band + floor vignette
        const top = tile((spec.w - 1) / 2, 0);
        const g = ctx.createRadialGradient(w / 2, h * 0.5, 80, w / 2, h * 0.5, h * 0.85);
        g.addColorStop(0, spec.cave ? "#1a1622" : "#241c2e");
        g.addColorStop(1, VOID);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = spec.cave ? "#0e0b14" : "#15101f";
        ctx.fillRect(0, 0, w, top.y - 40 * z);
        ctx.restore();
        // floor
        for (let y = 0; y < spec.h; y++)
          for (let x = 0; x < spec.w; x++) {
            const s = tile(x, y);
            spriteCache.drawFloor(ctx, spec.floor, (x * 7 + y * 13) % 3, s.x, s.y, z);
          }
        // door glow
        const ds = tile(spec.door.x, spec.door.y);
        ctx.save();
        ctx.globalAlpha = 0.55 + Math.sin(t * 6) * 0.15;
        ctx.strokeStyle = PAL.GOLD;
        ctx.lineWidth = Math.max(1, 1.6 * z);
        ctx.beginPath();
        ctx.moveTo(ds.x, ds.y - 14 * z); ctx.lineTo(ds.x + 28 * z, ds.y);
        ctx.lineTo(ds.x, ds.y + 14 * z); ctx.lineTo(ds.x - 28 * z, ds.y); ctx.closePath();
        ctx.stroke();
        ctx.restore();
        // rugs flat
        for (const f of spec.fixtures) {
          if (f.kind !== "rug") continue;
          const s = tile(f.x, f.y);
          spriteCache.drawFixture(ctx, "rug" as never, f.accent ?? spec.accent, s.x, s.y, z);
        }
        const items: { depth: number; draw: () => void }[] = [];
        for (const f of spec.fixtures) {
          if (f.kind === "rug") continue;
          items.push({ depth: f.x + f.y, draw: () => { const s = tile(f.x, f.y); spriteCache.drawFixture(ctx, f.kind as never, f.accent ?? spec.accent, s.x, s.y, z); } });
        }
        for (const v of spec.veins ?? []) {
          items.push({ depth: v.x + v.y, draw: () => { const s = tile(v.x, v.y); spriteCache.drawFixture(ctx, "goldVein" as never, spec.accent, s.x, s.y, z); } });
        }
        if (spec.keeper) {
          const k = spec.keeper;
          items.push({ depth: k.x + k.y, draw: () => { const s = tile(k.x, k.y); spriteCache.drawChar(ctx, "s", false, "idle", Math.floor(t * 1.4) % 2, s.x, s.y, z, undefined, { dye: (spec.keeperDye ?? "stone") as LookVisual["dye"], eye: "ember" }); } });
        }
        // the hero, doing the thing
        const hAnim = hero.anim ?? "idle";
        const hf = hAnim === "swing" ? Math.floor(t * 8) % 4 : Math.floor(t * 3) % 2;
        items.push({ depth: hero.cell.x + hero.cell.y + 0.1, draw: () => { const s = tile(hero.cell.x, hero.cell.y); spriteCache.drawChar(ctx, hero.facing ?? "n", false, hAnim, hf, s.x, s.y, z, { weapon: 2, ward: 2, held: "weapon" }, hero.look ?? { dye: "ember", eye: "blood" }); } });
        paint(items);
      }}
    />
  );
};

// ─── a centered row of "goods" (chars / pets / props / fixtures), bobbing ─────
import type { EquipVisual } from "../../game/render/sprites";
export type ShowcaseItem =
  | { type: "char"; look: LookVisual; equip?: EquipVisual; label: string; swing?: boolean }
  | { type: "pet"; kind: string; label: string }
  | { type: "prop"; kind: string; label: string }
  | { type: "fixture"; kind: string; accent: string; label: string };

export const ShowcaseCanvas: React.FC<{ items: ShowcaseItem[]; itemZoom?: number; baseY?: number }> = ({ items, itemZoom = 7, baseY = 0.58 }) => {
  const { fps } = useVideoConfig();
  return (
    <EngineCanvas
      draw={(ctx, frame, _f, w, h) => {
        const t = frame / fps;
        const n = items.length;
        const gap = w / (n + 1);
        const by = h * baseY;
        items.forEach((it, i) => {
          const cx = gap * (i + 1);
          const reveal = interpolate(frame, [i * 5, i * 5 + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (reveal <= 0) return;
          const bob = Math.sin(t * 2 + i) * 5 * itemZoom * 0.12;
          ctx.save();
          ctx.globalAlpha = reveal;
          const sy = by + bob;
          if (it.type === "char") {
            const af = it.swing ? Math.floor(t * 8) % 4 : Math.floor(t * 3) % 2;
            spriteCache.drawChar(ctx, "s", false, it.swing ? "swing" : "idle", af, cx, sy, itemZoom, it.equip, it.look);
          } else if (it.type === "pet") {
            spriteCache.drawPet(ctx, it.kind, Math.floor(t * 4) % 2, cx, sy, itemZoom * 1.6);
          } else if (it.type === "prop") {
            spriteCache.drawProp(ctx, it.kind, Math.floor(t * 3) % 2, cx, sy, itemZoom * 1.1);
          } else if (it.type === "fixture") {
            spriteCache.drawFixture(ctx, it.kind as never, it.accent, cx, sy, itemZoom);
          }
          // label
          ctx.globalAlpha = reveal;
          ctx.textAlign = "center";
          ctx.font = `700 ${22}px ui-sans-serif`;
          ctx.fillStyle = "rgba(10,8,16,0.85)";
          const tw = ctx.measureText(it.label).width;
          ctx.fillRect(cx - tw / 2 - 12, sy + 26, tw + 24, 30);
          ctx.fillStyle = PAL.BONE;
          ctx.fillText(it.label, cx, sy + 47);
          ctx.textAlign = "left";
          ctx.restore();
        });
      }}
    />
  );
};

// ─── DOM overlays ─────────────────────────────────────────────────────────────
import { loadFont } from "@remotion/google-fonts/PixelifySans";
const { fontFamily } = loadFont();
export { fontFamily };

/** dark scrim top+bottom so captions always read over busy footage */
export const Scrim: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,8,16,0.55) 0%, transparent 15%, transparent 64%, rgba(10,8,16,0.9) 100%)", pointerEvents: "none" }} />
);

/** the pop-in instruction plate (dark bar, accent outline) */
export const Caption: React.FC<{ at?: number; children: React.ReactNode; sub?: React.ReactNode; color?: string; y?: string }> = ({ at = 4, children, sub, color = PAL.BONE, y = "79%" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lt = frame - at;
  const a = interpolate(lt, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = lt < 0 ? 0 : lt < fps * 0.18 ? 1.12 * (lt / (fps * 0.18)) : lt < fps * 0.32 ? 1.12 - 0.12 * ((lt - fps * 0.18) / (fps * 0.14)) : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: y, transform: `scale(${pop})`, opacity: a, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily, fontSize: 62, fontWeight: 700, color, letterSpacing: "0.04em", padding: "16px 48px", background: "rgba(10,8,16,0.82)", border: `4px solid ${color}`, borderRadius: 14, textShadow: `0 3px 14px ${VOID}` }}>
          {children}
        </div>
        {sub ? <div style={{ fontFamily, fontSize: 34, color: PAL.BONE_DIM, letterSpacing: "0.05em", textShadow: `0 2px 10px ${VOID}` }}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/** big building/section title that fades up */
export const TitlePlate: React.FC<{ at?: number; children: React.ReactNode; sub?: React.ReactNode; y?: string; color?: string }> = ({ at = 6, children, sub, y = "12%", color = PAL.GOLD }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [at, at + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(frame, [at, at + 16], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", opacity: a, transform: `translateY(${rise}px)`, pointerEvents: "none" }}>
      <div style={{ fontFamily, fontSize: 76, fontWeight: 700, color, letterSpacing: "0.04em", textShadow: `0 4px 26px ${VOID}, 0 0 46px rgba(168,85,247,0.3)` }}>{children}</div>
      {sub ? <div style={{ fontFamily, fontSize: 32, color: PAL.BONE_DIM, marginTop: 8, letterSpacing: "0.08em" }}>{sub}</div> : null}
    </div>
  );
};

/** small wordmark in the corner the whole time */
export const CornerBrand: React.FC = () => (
  <Img src={staticFile("assets/logo-horizontal.svg")} style={{ position: "absolute", bottom: 28, right: 18, width: 360, imageRendering: "pixelated", opacity: 0.9, filter: `drop-shadow(0 2px 10px ${VOID})` }} />
);

/** end card */
export const PlayNow: React.FC<{ line?: string }> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = interpolate(frame, [0, 14], [0.8, 1], { extrapolateRight: "clamp" });
  const glow = 0.5 + 0.5 * Math.sin(frame / 8);
  return (
    <AbsoluteFill style={{ background: VOID, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 26 }}>
      <Img src={staticFile("assets/logo-stacked.svg")} style={{ width: 520, imageRendering: "pixelated", transform: `scale(${pop})`, filter: `drop-shadow(0 0 ${22 + glow * 28}px rgba(168,85,247,0.55))` }} />
      {line ? <div style={{ fontFamily, fontSize: 36, color: PAL.BONE_DIM, letterSpacing: "0.08em" }}>{line}</div> : null}
      <div style={{ fontFamily, fontSize: 64, fontWeight: 700, color: PAL.GOLD, letterSpacing: "0.06em", textShadow: `0 0 30px rgba(231,200,115,0.5)` }}>PLAY NOW</div>
    </AbsoluteFill>
  );
};
