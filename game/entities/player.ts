import { Cell, ResourceNode } from "@/game/types";

export type PlayerAction = "idle" | "walk" | "gather" | "attack";

// The player's smooth position is a fractional grid coordinate (px,py). It
// advances along `path` one cell at a time. Gathering is a timed action that
// fires a callback on completion (wired by the Game).

export class Player {
  px: number;
  py: number;
  path: Cell[] = [];
  speed = 3.2; // tiles per second
  action: PlayerAction = "idle";
  facing = 1; // 1 = right-ish, -1 = left-ish (for sprite flip)
  bob = 0; // walk bob phase

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
      const step = this.speed * dt;
      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
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
