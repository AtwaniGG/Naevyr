import { ResourceKind, ResourceNode, TileType } from "@/game/types";

// The world grid: tiles + resource nodes. Owns walkability used by pathfinding.

export class World {
  readonly w: number;
  readonly h: number;
  tiles: TileType[]; // length w*h
  nodes: ResourceNode[] = [];
  private nodeAt: Map<number, ResourceNode> = new Map();
  private nodeById: Map<number, ResourceNode> = new Map();
  private nextNodeId = 1;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.tiles = new Array(w * h).fill("grass");
    this.generate();
  }

  idx(x: number, y: number) {
    return y * this.w + x;
  }

  inBounds(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  tile(x: number, y: number): TileType {
    return this.tiles[this.idx(x, y)];
  }

  setTile(x: number, y: number, t: TileType) {
    this.tiles[this.idx(x, y)] = t;
  }

  getNode(x: number, y: number): ResourceNode | undefined {
    return this.nodeAt.get(this.idx(x, y));
  }

  /** A cell blocks movement if it is water or holds a live resource node. */
  isWalkable(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    if (this.tile(x, y) === "water") return false;
    const n = this.nodeAt.get(this.idx(x, y));
    if (n && n.regrowIn <= 0) return false; // live node blocks; depleted does not
    return true;
  }

  /** empty walkable grass/dirt tile with no node — for Drift regrowth */
  randomEmptyCell(rng: () => number): { x: number; y: number } | null {
    for (let tries = 0; tries < 200; tries++) {
      const x = (rng() * this.w) | 0;
      const y = (rng() * this.h) | 0;
      const t = this.tile(x, y);
      if ((t === "grass" || t === "dirt") && !this.nodeAt.has(this.idx(x, y))) {
        return { x, y };
      }
    }
    return null;
  }

  addNode(kind: ResourceKind, gx: number, gy: number) {
    const amount = kind === "rock" ? 6 : kind === "tree" ? 5 : 8;
    const node: ResourceNode = {
      id: this.nextNodeId++,
      kind,
      gx,
      gy,
      amount,
      maxAmount: amount,
      regrowIn: 0,
      phase: Math.random() * Math.PI * 2,
    };
    this.nodes.push(node);
    this.nodeAt.set(this.idx(gx, gy), node);
    this.nodeById.set(node.id, node);
  }

  /**
   * Mirror a server-owned node into this world (online mode). Creates the node
   * on first sight; afterwards tracks position, charges and life state so
   * walkability and rendering stay consistent with the authoritative state.
   */
  syncNetNode(n: {
    id: number;
    kind: ResourceKind;
    gx: number;
    gy: number;
    amount: number;
    alive: boolean;
  }) {
    let node = this.nodeById.get(n.id);
    if (!node) {
      node = {
        id: n.id,
        kind: n.kind,
        gx: n.gx,
        gy: n.gy,
        amount: n.amount,
        maxAmount: Math.max(1, n.amount),
        regrowIn: n.alive ? 0 : 1,
        phase: Math.random() * Math.PI * 2,
      };
      this.nodes.push(node);
      this.nodeById.set(n.id, node);
      this.nodeAt.set(this.idx(n.gx, n.gy), node);
      return;
    }
    if (node.gx !== n.gx || node.gy !== n.gy) {
      if (this.nodeAt.get(this.idx(node.gx, node.gy)) === node) {
        this.nodeAt.delete(this.idx(node.gx, node.gy));
      }
      node.gx = n.gx;
      node.gy = n.gy;
      node.phase = Math.random() * Math.PI * 2;
      this.nodeAt.set(this.idx(n.gx, n.gy), node);
    }
    node.amount = n.amount;
    node.maxAmount = Math.max(node.maxAmount, n.amount);
    node.regrowIn = n.alive ? 0 : 1; // >0 = hidden + walkable, exact ms is server business
  }

  /** Drop all locally generated nodes (before mirroring the server's). */
  clearNodes() {
    this.nodes = [];
    this.nodeAt.clear();
    this.nodeById.clear();
  }

  /** Move a depleted node to a fresh empty cell and refill it (the Drift). */
  relocateNode(node: ResourceNode, cell: { x: number; y: number }) {
    this.nodeAt.delete(this.idx(node.gx, node.gy));
    node.gx = cell.x;
    node.gy = cell.y;
    node.amount = node.maxAmount;
    node.regrowIn = 0;
    node.phase = Math.random() * Math.PI * 2;
    this.nodeAt.set(this.idx(cell.x, cell.y), node);
  }

  private generate() {
    // a small water pool toward one corner
    const poolCx = Math.floor(this.w * 0.72);
    const poolCy = Math.floor(this.h * 0.28);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const d = Math.hypot(x - poolCx, y - poolCy);
        if (d < 3.2) this.setTile(x, y, "water");
        else if (d < 4.4) this.setTile(x, y, "dirt");
      }
    }
    // scatter a few dirt patches for texture
    const rng = mulberry32(1337);
    for (let i = 0; i < this.w * this.h * 0.04; i++) {
      const x = (rng() * this.w) | 0;
      const y = (rng() * this.h) | 0;
      if (this.tile(x, y) === "grass") this.setTile(x, y, "dirt");
    }

    // trees + rocks scattered on land; fish along water edge
    const place = (kind: ResourceKind, count: number, nearWater = false) => {
      let placed = 0;
      let guard = 0;
      while (placed < count && guard++ < 2000) {
        const x = (rng() * this.w) | 0;
        const y = (rng() * this.h) | 0;
        if (this.tile(x, y) === "water") continue;
        if (this.nodeAt.has(this.idx(x, y))) continue;
        if (nearWater && !this.adjacentToWater(x, y)) continue;
        // keep a clear spawn area in the center
        if (Math.hypot(x - this.w / 2, y - this.h / 2) < 2.2) continue;
        this.addNode(kind, x, y);
        placed++;
      }
    };
    place("tree", 22);
    place("rock", 14);
    place("fish", 8, true);
  }

  private adjacentToWater(x: number, y: number) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (this.inBounds(x + dx, y + dy) && this.tile(x + dx, y + dy) === "water")
          return true;
      }
    return false;
  }
}

// small deterministic PRNG so the map is stable across reloads
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
