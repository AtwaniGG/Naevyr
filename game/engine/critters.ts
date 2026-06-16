// Ambient wildlife: a lightweight pool of cosmetic critters that wander near the
// player, region-typed and time-of-day aware. Pure client-side decoration (no
// server, no collision) — like doodads with movement. Ground critters flee the
// player; flyers drift. Reuses the DS critter sprites (CRITTER_SPECS).
import { CritterKind, CRITTER_SPECS } from "@/game/render/sprites";
import { regionAt, World } from "@/game/world/tilemap";

export interface Critter {
  kind: CritterKind;
  px: number; py: number;
  facing: string;      // 'e'|'w'|'s'|'n'|'_'
  flyer: boolean;
  flee: boolean;
  moving: boolean;
  tx: number; ty: number;
  speed: number;
  retargetAt: number;
}

const GROUND: CritterKind[] = ["deer", "rabbit", "frog"];

/** which critters haunt a region (weighted by repetition), day vs night */
function regionPool(region: string, day: boolean): CritterKind[] {
  switch (region) {
    case "The Ashen Flats": return ["crow", "crow", "vulture"];
    case "Hollowmere Reach": return day ? ["frog", "frog", "dragonfly", "songbird"] : ["frog", "firefly", "firefly", "dragonfly"];
    case "The Bonefields": return ["vulture", "crow", "crow"];
    case "Palewater": return day ? ["songbird", "butterfly", "deer", "rabbit"] : ["firefly", "firefly", "frog"];
    default: return day ? ["butterfly", "butterfly", "songbird", "rabbit", "deer"] : ["firefly", "firefly", "rabbit"]; // Wanderer's Rest / meadow
  }
}

/** the anim + frame + mirror to draw a critter this instant */
export function critterFrame(c: Critter, now: number): { anim: string; frame: number; facing: string; mirror: boolean } {
  const spec = CRITTER_SPECS[c.kind];
  let anim: string;
  if (c.flyer) {
    anim = { songbird: "fly", crow: "fly", vulture: "flap", dragonfly: "hover", firefly: "pulse", butterfly: "flutter" }[c.kind as string] ?? spec.anims[spec.anims.length - 1][0];
  } else {
    anim = c.moving ? (c.kind === "deer" ? "walk" : "hop") : "idle";
  }
  const a = spec.anims.find(([n]) => n === anim) ?? spec.anims[0];
  const [name, count, fps] = a;
  const frame = Math.floor(now / (1000 / fps)) % count;
  const mirror = c.facing === "w";
  const facing = mirror ? "e" : (c.facing === "_" ? "_" : c.facing);
  return { anim: name, frame, facing, mirror };
}

export class AmbientCritters {
  list: Critter[] = [];
  private cap = 22;
  private nextSpawnAt = 0;

  update(dt: number, now: number, px: number, py: number, world: World) {
    const night = 0.5 - 0.5 * Math.cos(((now / 480_000) % 1) * Math.PI * 2);
    const day = night < 0.5;
    // despawn ones that wandered far from the player
    if (this.list.length) this.list = this.list.filter((c) => Math.hypot(c.px - px, c.py - py) < 22);
    // paced spawning up to the cap (at the edge of the visible ring)
    if (this.list.length < this.cap && now > this.nextSpawnAt) {
      this.nextSpawnAt = now + 200;
      this.spawn(now, px, py, world, day);
    }
    for (const c of this.list) {
      if (GROUND.includes(c.kind)) {
        const dpx = c.px - px, dpy = c.py - py, dp = Math.hypot(dpx, dpy) || 1;
        if (dp < 4.5) { c.flee = true; c.tx = c.px + (dpx / dp) * 6; c.ty = c.py + (dpy / dp) * 6; }
        else if (c.flee && dp > 8) c.flee = false;
      }
      if (now > c.retargetAt && !c.flee) {
        c.retargetAt = now + 1500 + Math.random() * 2500;
        c.tx = c.px + (Math.random() - 0.5) * 8;
        c.ty = c.py + (Math.random() - 0.5) * 8;
      }
      const dx = c.tx - c.px, dy = c.ty - c.py, d = Math.hypot(dx, dy);
      const step = (c.flee ? c.speed * 2 : c.speed) * dt;
      c.moving = d > 0.15;
      if (c.moving) {
        c.px += (dx / d) * Math.min(step, d);
        c.py += (dy / d) * Math.min(step, d);
        if (c.facing !== "_") {
          const facings = CRITTER_SPECS[c.kind].facings;
          if (Math.abs(dx) >= Math.abs(dy)) c.facing = dx < 0 ? "w" : "e";
          else if (facings.includes(dy < 0 ? "n" : "s")) c.facing = dy < 0 ? "n" : "s";
          else c.facing = dx < 0 ? "w" : "e";
        }
      }
    }
  }

  clear() { this.list = []; }

  private spawn(now: number, px: number, py: number, world: World, day: boolean) {
    const ang = Math.random() * Math.PI * 2, r = 6 + Math.random() * 8;
    const gx = Math.round(px + Math.cos(ang) * r), gy = Math.round(py + Math.sin(ang) * r);
    if (!world.inBounds(gx, gy)) return;
    const pool = regionPool(regionAt(world.w, world.h, gx, gy), day);
    const kind = pool[(Math.random() * pool.length) | 0];
    const flyer = !!CRITTER_SPECS[kind].fly;
    if (!flyer && !world.isWalkable(gx, gy)) return; // ground critters need footing
    this.list.push({
      kind, px: gx, py: gy,
      facing: CRITTER_SPECS[kind].facings[0] === "_" ? "_" : "e",
      flyer, flee: false, moving: false, tx: gx, ty: gy,
      speed: flyer ? 2.4 : 1.4, retargetAt: 0,
    });
  }
}
