// A tiny Remotion-side renderer that REUSES the real game art: it drives the
// engine's SpriteCache (game/render/sprites.ts) straight onto a <canvas>, with
// the same iso projection (game/render/iso.ts). That gives pixel-identical
// tiles, wanderers, keepers, buildings and interior fixtures — no screenshots,
// no re-implemented art. Used by every building/showcase clip to paint a
// CROWDED realm (lots of wanderers) and faithful interiors.
import React, { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { spriteCache, type IsoFacing, type LookVisual, type EquipVisual } from "../../game/render/sprites";
import { gridToIso } from "../../game/render/iso";
import type { InteriorSpec } from "../../game/world/interior";

// init the cache once per JS context (Remotion renders each frame-batch in its
// own browser tab → guard per-module). init() is synchronous.
let inited = false;
export function ensureSprites() {
  if (!inited) {
    spriteCache.init();
    inited = true;
  }
}

// ─── camera / projection ──────────────────────────────────────────────────────
// cam centers iso world point (cx,cy) on screen at zoom z.
export type Cam = { cx: number; cy: number; z: number; w: number; h: number };

export function isoToScreen(cam: Cam, ix: number, iy: number) {
  return { x: cam.w / 2 + (ix - cam.cx) * cam.z, y: cam.h / 2 + (iy - cam.cy) * cam.z };
}
export function cellToScreen(cam: Cam, gx: number, gy: number) {
  const iso = gridToIso(gx, gy);
  return isoToScreen(cam, iso.x, iso.y);
}
/** a camera that centers a grid cell on screen */
export function camOnCell(gx: number, gy: number, z: number, w: number, h: number): Cam {
  const iso = gridToIso(gx, gy);
  return { cx: iso.x, cy: iso.y, z, w, h };
}

// ─── facing from a grid-space movement delta ──────────────────────────────────
export function facingFor(dgx: number, dgy: number): { facing: IsoFacing; mirror: boolean } {
  // screen-space direction of the move
  const sx = dgx - dgy;
  const sy = dgx + dgy;
  if (Math.abs(sx) < 1e-3 && Math.abs(sy) < 1e-3) return { facing: "s", mirror: false };
  const ang = Math.atan2(sy, sx); // 0 = +screenX (east), +pi/2 = +screenY (south)
  const deg = (ang * 180) / Math.PI;
  // buckets: e(0) se(45) s(90) sw(135) w(180/-180) nw(-135) n(-90) ne(-45)
  if (deg >= -22.5 && deg < 22.5) return { facing: "e", mirror: false };
  if (deg >= 22.5 && deg < 67.5) return { facing: "se", mirror: false };
  if (deg >= 67.5 && deg < 112.5) return { facing: "s", mirror: false };
  if (deg >= 112.5 && deg < 157.5) return { facing: "se", mirror: true };
  if (deg >= 157.5 || deg < -157.5) return { facing: "e", mirror: true };
  if (deg >= -157.5 && deg < -112.5) return { facing: "ne", mirror: true };
  if (deg >= -112.5 && deg < -67.5) return { facing: "n", mirror: false };
  return { facing: "ne", mirror: false }; // -67.5..-22.5
}

// ─── entity sorting (painter's algorithm by iso depth) ────────────────────────
type Drawable = { depth: number; draw: () => void };
export function paint(list: Drawable[]) {
  list.sort((a, b) => a.depth - b.depth);
  for (const d of list) d.draw();
}

// ─── a moving wanderer (for crowds + heroes) ──────────────────────────────────
export type CharLook = { look?: LookVisual; equip?: EquipVisual };
export type CrowdMember = CharLook & {
  path: { x: number; y: number }[]; // looping waypoints (grid cells)
  speed: number;                    // cells / sec
  phase: number;                    // 0..1 start offset along the loop
};

/** position + facing of a crowd member at time t (seconds) */
export function crowdPose(m: CrowdMember, t: number) {
  const pts = m.path;
  if (pts.length === 1) return { x: pts[0].x, y: pts[0].y, facing: "s" as IsoFacing, mirror: false, moving: false };
  // total loop length
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push(d);
    total += d;
  }
  let dist = (((m.phase * total + t * m.speed) % total) + total) % total;
  for (let i = 0; i < pts.length; i++) {
    if (dist <= segs[i] || i === pts.length - 1) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const f = segs[i] > 1e-4 ? dist / segs[i] : 0;
      const x = a.x + (b.x - a.x) * f;
      const y = a.y + (b.y - a.y) * f;
      const fac = facingFor(b.x - a.x, b.y - a.y);
      return { x, y, ...fac, moving: true };
    }
    dist -= segs[i];
  }
  return { x: pts[0].x, y: pts[0].y, facing: "s" as IsoFacing, mirror: false, moving: false };
}

// ─── deterministic crowd generator ────────────────────────────────────────────
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const CROWD_DYES = ["ember", "moss", "blood", "gold", "bone", "water", "void", "stone", "drift"];
const CROWD_EYES = ["drift", "ember", "blood", "gold", "water"];
const CROWD_PETS = ["", "", "wisp", "crow", "emberling"];
const CROWD_AVATARS = ["", "", "", "", "ashbound", "mireborn", "bonecaller", "veilborn"];

/** a busy knot of wanderers strolling random loops around (cx,cy) */
export function makeCrowd(seed: number, count: number, cx: number, cy: number, spread = 7): CrowdMember[] {
  const r = rng(seed);
  const out: CrowdMember[] = [];
  for (let i = 0; i < count; i++) {
    const hops = 2 + Math.floor(r() * 3);
    const path: { x: number; y: number }[] = [];
    for (let h = 0; h < hops; h++) {
      path.push({
        x: cx + Math.round((r() - 0.5) * spread * 2),
        y: cy + Math.round((r() - 0.5) * spread * 2),
      });
    }
    const av = CROWD_AVATARS[Math.floor(r() * CROWD_AVATARS.length)];
    const look: LookVisual = av
      ? { avatar: av as LookVisual["avatar"] }
      : {
          dye: CROWD_DYES[Math.floor(r() * CROWD_DYES.length)] as LookVisual["dye"],
          eye: CROWD_EYES[Math.floor(r() * CROWD_EYES.length)] as LookVisual["eye"],
        };
    const gear = r() > 0.55;
    out.push({
      look,
      equip: gear ? { weapon: 1 + Math.floor(r() * 2), ward: r() > 0.5 ? 1 : 0, held: "weapon" } : undefined,
      path,
      speed: 0.8 + r() * 1.1,
      phase: r(),
      // pet rendered separately below via look hack: stash in look-less field
    } as CrowdMember & { pet?: string });
    (out[i] as CrowdMember & { pet?: string }).pet = CROWD_PETS[Math.floor(r() * CROWD_PETS.length)];
  }
  return out;
}

// ─── draw a wanderer (with optional pet trailing) ─────────────────────────────
export function drawWandererAt(
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  gx: number,
  gy: number,
  facing: IsoFacing,
  mirror: boolean,
  anim: "idle" | "walk" | "swing",
  frame: number,
  look?: LookVisual,
  equip?: EquipVisual,
) {
  const s = cellToScreen(cam, gx, gy);
  spriteCache.drawChar(ctx, facing, mirror, anim, frame, s.x, s.y, cam.z, equip, look);
}

// ─── paint an arbitrary sprite Grid straight onto the canvas ──────────────────
// (auras, wheel faces, cache, etc. — same RLE scheme the DS exports use). The
// anchor (ax,ay) is in sprite px; the sprite lands so (ax,ay) sits at (sx,sy).
export type GridLike = { w: number; h: number; d: ({ c: string; a?: number } | null)[] };
export function drawGrid(ctx: CanvasRenderingContext2D, g: GridLike, sx: number, sy: number, z: number, ax = 0, ay = 0) {
  ctx.imageSmoothingEnabled = false;
  const ox = sx - ax * z;
  const oy = sy - ay * z;
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = g.d[y * g.w + x];
      if (!v) { x++; continue; }
      let x2 = x + 1;
      while (x2 < g.w) {
        const v2 = g.d[y * g.w + x2];
        if (!v2 || v2.c !== v.c || (v2.a ?? 1) !== (v.a ?? 1)) break;
        x2++;
      }
      ctx.globalAlpha = v.a ?? 1;
      ctx.fillStyle = v.c;
      ctx.fillRect(Math.round(ox + x * z), Math.round(oy + y * z), Math.ceil((x2 - x) * z), Math.ceil(z));
      x = x2;
    }
  }
  ctx.globalAlpha = 1;
}

// ─── the canvas host: redraws deterministically each Remotion frame ───────────
export const EngineCanvas: React.FC<{
  draw: (ctx: CanvasRenderingContext2D, frame: number, fps: number, w: number, h: number) => void;
  style?: React.CSSProperties;
}> = ({ draw, style }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ensureSprites();
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    draw(ctx, frame, fps, width, height);
  });
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, width, height, display: "block", imageRendering: "pixelated", ...style }}
    />
  );
};

export type { InteriorSpec };
