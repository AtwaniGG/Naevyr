import { Cell, ResourceNode } from "@/game/types";
import { IsoFacing } from "@/game/render/sprites";

export type PlayerAction = "idle" | "walk" | "gather" | "attack";

// Map a grid movement direction (dx, dy) to the nearest DS facing. The five
// drawn facings s/se/e/ne/n cover the right half; mirror covers the left half.
export function isoFacingFromDelta(
  dx: number,
  dy: number,
): { f: IsoFacing; m: boolean } | null {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return null;
  const sum  = dx + dy;  // positive = toward camera (south)
  const diff = dx - dy;  // positive = screen-right (east)
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 0.1) return { f: dy > 0 ? 's' : 'n', m: false };
  if (ady < 0.1) return { f: 'e', m: dx < 0 };
  if (sum > 0 && diff > 0)  return { f: 'se', m: false };
  if (sum > 0 && diff < 0)  return { f: 'se', m: true };  // sw = mirror se
  if (sum < 0 && diff > 0)  return { f: 'ne', m: false };
  if (sum < 0 && diff < 0)  return { f: 'ne', m: true };  // nw = mirror ne
  return { f: sum > 0 ? 's' : 'n', m: false };
}

// The player's smooth position is a fractional grid coordinate (px,py). It
// advances along `path` one cell at a time. Gathering is a timed action that
// fires a callback on completion (wired by the Game).

export class Player {
  px: number;
  py: number;
  path: Cell[] = [];
  speed = 3.2; // tiles per second (base; effective speed comes from speedAt)
  /** whether a steed is summoned (drives the road/mount speed channel) */
  mounted = false;
  /** effective walk speed (tiles/sec) at the cell underfoot — injected by the
   *  engine so the client's local prediction matches the authoritative server
   *  (roads + mount). Null → fall back to the base `speed`. */
  speedAt: ((x: number, y: number) => number) | null = null;
  action: PlayerAction = "idle";
  facing = 1; // 1 = right-ish, -1 = left-ish (legacy, kept for mob rendering)
  // iso facing for the wanderer sprite
  isoFacing: IsoFacing = 's';
  isoMirror  = false;
  bob = 0; // walk bob phase

  // cosmetic identity (remotes carry what the server synced)
  name = "";
  dye = "stone";
  eye = "drift";
  title = "";
  aura = "";
  pet = "";
  avatar = "";
  avA = "";
  avB = "";
  guildTag = "";
  /** a demo/guest-lane wanderer (shown muted on the nameplate) */
  guest = false;
  /** an ambient Echo: a server-spawned diegetic wanderer (drawn translucent,
   *  tagged on the nameplate, never logged as an arrival/departure) */
  echo = false;
  /** performance.now() when this Echo was first seen — drives the materialize
   *  puff (echo_fade) on appearance, then the veil shimmer loop */
  echoBornAt = 0;
  /** lagged follower position (NaN until the pet first appears) */
  petX = NaN;
  petY = NaN;
  /** active chat/emote bubble, drawn above the name tag */
  bubble: { text: string; t0: number; emote: boolean } | null = null;

  /** Pit duel: while now < swingUntil this player (a remote) plays the strike
   *  animation toward swingFace — duel swings aren't carried by the synced
   *  action, so the server's duelSwing event drives this. */
  swingUntil = 0;
  swingFace: Cell | null = null;

  // gather state
  gatherMs = 0;
  gatherTotal = 0;
  targetNode: ResourceNode | null = null;
  onGatherDone: (() => void) | null = null;

  constructor(gx: number, gy: number) {
    this.px = gx;
    this.py = gy;
  }

  get cell(): Cell {
    return { x: Math.round(this.px), y: Math.round(this.py) };
  }

  setPath(path: Cell[]) {
    this.path = path;
    if (path.length) {
      this.action = "walk";
      this.cancelGather();
    } else if (this.action === "walk") {
      this.action = "idle";
    }
  }

  beginGather(node: ResourceNode, totalMs: number, onDone: () => void) {
    this.action = "gather";
    this.targetNode = node;
    this.gatherMs = 0;
    this.gatherTotal = totalMs;
    this.onGatherDone = onDone;
    // face the node
    this.facing = node.gx >= this.px ? 1 : -1;
  }

  updateIsoFacing(dx: number, dy: number) {
    const r = isoFacingFromDelta(dx, dy);
    if (!r) return;
    this.isoFacing = r.f;
    this.isoMirror = r.m;
  }

  cancelGather() {
    if (this.action === "gather") this.action = "idle";
    this.targetNode = null;
    this.onGatherDone = null;
    this.gatherMs = 0;
  }

  update(dt: number) {
    if (this.action === "walk" && this.path.length) {
      const next = this.path[0];
      const dx = next.x - this.px;
      const dy = next.y - this.py;
      const dist = Math.hypot(dx, dy);
      const fx = Math.round(this.px), fy = Math.round(this.py);
      const step = (this.speedAt ? this.speedAt(fx, fy) : this.speed) * dt;
      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      this.updateIsoFacing(dx, dy);
      if (dist <= step) {
        this.px = next.x;
        this.py = next.y;
        this.path.shift();
        if (!this.path.length) this.action = "idle";
      } else {
        this.px += (dx / dist) * step;
        this.py += (dy / dist) * step;
      }
      this.bob += dt * 10;
    } else if (this.action === "gather") {
      this.gatherMs += dt * 1000;
      this.bob += dt * 6;
      if (this.gatherMs >= this.gatherTotal) {
        const cb = this.onGatherDone;
        this.gatherMs = 0;
        this.onGatherDone = null;
        const node = this.targetNode;
        this.targetNode = null;
        this.action = "idle";
        cb?.();
        // keep node ref cleared; Game decides whether to continue
        void node;
      }
    } else {
      this.bob = 0;
    }
  }
}
