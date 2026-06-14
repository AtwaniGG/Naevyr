import { ResourceKind, ResourceNode, TileType } from "../types";

// The world grid: tiles + resource nodes. Owns walkability used by pathfinding.

// ─── The Waystation: the town at Wanderer's Rest ──────────────────────────────
// Shared by client and server so pathfinding and placement always agree.

export type BuildingKey =
  | "dyeworks" | "vault" | "wheel" | "lantern"
  | "furnisher" | "menagerie" | "shrine" | "pit" | "mine"
  | "huskden" | "obelisk" | "mirehut";

export interface TownBuilding {
  key: BuildingKey;
  label: string;
  x: number;
  y: number;
  /** chebyshev footprint radius (r=1 → 3×3) */
  r: number;
  /** pit floor is enterable; everything else blocks */
  walkable?: boolean;
}

export const TOWN_CENTER = { x: 20, y: 20 };
/** no resource nodes inside this euclidean radius of town */
export const TOWN_NODE_FREE_RADIUS = 8;
/** keep nodes off the outermost ring of tiles: tree/rock sprites (48x56) are
 *  taller and wider than a tile, so on a border cell their canopy spills past
 *  the map's diamond edge into the void. */
export const EDGE_MARGIN = 2;

// Organic scatter with one hard rule: no building may stand close enough
// south of another to cover its door. In iso terms, for any pair with
// depth gap Δ(x+y) in (0, 8], the screen-column gap |Δ(x-y)| must exceed 4.
// The Mine sits apart in the south-east rocks.
export const TOWN_BUILDINGS: TownBuilding[] = [
  { key: "shrine",    label: "Shrine of the Pale Flame", x: 17, y: 13, r: 1 },
  { key: "dyeworks",  label: "The Dyeworks",             x: 12, y: 17, r: 1 },
  { key: "vault",     label: "The Vault",                x: 24, y: 16, r: 1 },
  { key: "lantern",   label: "The Last Lantern",         x: 21, y: 22, r: 1 },
  { key: "menagerie", label: "The Menagerie",            x: 28, y: 22, r: 1 },
  { key: "furnisher", label: "The Furnisher",            x: 14, y: 24, r: 1 },
  { key: "wheel",     label: "Wheel of the Drift",       x: 13, y: 29, r: 1 },
  { key: "pit",       label: "The Pit",                  x: 20, y: 32, r: 2, walkable: true },
  { key: "mine",      label: "The Mine",                 x: 31, y: 29, r: 1 },
];

export function buildingAt(x: number, y: number): TownBuilding | null {
  for (const b of ALL_STRUCTURES) {
    if (Math.max(Math.abs(x - b.x), Math.abs(y - b.y)) <= b.r) return b;
  }
  return null;
}

// ─── Wild structures: out in the quadrants, NOT Drift-immune ─────────────────
// Unlike the Waystation these have no corruption protection: the Drift can
// press right up against them. Same footprint/door rules as town buildings.
export const WILD_STRUCTURES: TownBuilding[] = [
  // the Ashen Flats (NW): the war quadrant
  { key: "huskden", label: "The Husk Den",   x: 8,  y: 8,  r: 1 },
  { key: "obelisk", label: "The Ash Obelisk", x: 15, y: 5,  r: 1 },
  // Hollowmere Reach (SW): the witch's marsh
  { key: "mirehut", label: "The Mirewife's Hut", x: 5, y: 24, r: 1 },
];

export const ALL_STRUCTURES: TownBuilding[] = [...TOWN_BUILDINGS, ...WILD_STRUCTURES];

/** building footprint + a visual buffer: sprites are ~2 tiles wider than
 *  their footprint, so nodes this close clip into walls/roofs */
export function nearBuilding(x: number, y: number, pad = 2): boolean {
  for (const b of ALL_STRUCTURES) {
    if (Math.max(Math.abs(x - b.x), Math.abs(y - b.y)) <= b.r + pad) return true;
  }
  return false;
}

/** cells the Drift may never corrupt: buildings + a 1-tile skirt */
export function townProtected(x: number, y: number): boolean {
  for (const b of TOWN_BUILDINGS) {
    if (Math.max(Math.abs(x - b.x), Math.abs(y - b.y)) <= b.r + 1) return true;
  }
  return false;
}

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

  /** A cell blocks movement if it is water, a building, or a live node. */
  isWalkable(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    if (this.tile(x, y) === "water") return false;
    const b = buildingAt(x, y);
    if (b && !b.walkable) return false;
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
      if (
        (t === "grass" || t === "dirt") &&
        x >= EDGE_MARGIN && y >= EDGE_MARGIN &&
        x < this.w - EDGE_MARGIN && y < this.h - EDGE_MARGIN &&
        !this.nodeAt.has(this.idx(x, y)) &&
        !nearBuilding(x, y) &&
        Math.hypot(x - TOWN_CENTER.x, y - TOWN_CENTER.y) >= TOWN_NODE_FREE_RADIUS
      ) {
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
    // …and the Hollowmere itself, deep in the south-west corner
    const mereCx = Math.floor(this.w * 0.18);
    const mereCy = Math.floor(this.h * 0.86);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const d = Math.hypot(x - poolCx, y - poolCy);
        if (d < 3.2) this.setTile(x, y, "water");
        else if (d < 4.4) this.setTile(x, y, "dirt");
        const m = Math.hypot(x - mereCx, y - mereCy);
        if (m < 2.8) this.setTile(x, y, "water");
        else if (m < 4.2) this.setTile(x, y, "dirt");
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
        if (
          x < EDGE_MARGIN || y < EDGE_MARGIN ||
          x >= this.w - EDGE_MARGIN || y >= this.h - EDGE_MARGIN
        ) continue;
        if (this.tile(x, y) === "water") continue;
        if (this.nodeAt.has(this.idx(x, y))) continue;
        if (nearWater && !this.adjacentToWater(x, y)) continue;
        // keep the town clear of nodes (buffer included: sprites overhang)
        if (nearBuilding(x, y)) continue;
        if (Math.hypot(x - TOWN_CENTER.x, y - TOWN_CENTER.y) < TOWN_NODE_FREE_RADIUS) continue;
        this.addNode(kind, x, y);
        placed++;
      }
    };
    place("tree", 16);
    place("rock", 10);
    place("fish", 8, true);
    // the Hollowmere is the realm's best fishing: extra schools on its banks
    let mereFish = 0;
    let guard = 0;
    while (mereFish < 4 && guard++ < 400) {
      const x = mereCx - 5 + ((rng() * 11) | 0);
      const y = mereCy - 5 + ((rng() * 11) | 0);
      if (!this.inBounds(x, y) || this.tile(x, y) === "water") continue;
      if (
        x < EDGE_MARGIN || y < EDGE_MARGIN ||
        x >= this.w - EDGE_MARGIN || y >= this.h - EDGE_MARGIN
      ) continue;
      if (this.nodeAt.has(this.idx(x, y)) || nearBuilding(x, y)) continue;
      if (!this.adjacentToWater(x, y)) continue;
      this.addNode("fish", x, y);
      mereFish++;
    }
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

/** the named region a cell falls in (shared: the client banner, the roster,
 *  and the server's guild-territory perks all read the same geometry) */
export function regionAt(w: number, h: number, x: number, y: number): string {
  const cx = w / 2;
  const cy = h / 2;
  // the Rest covers the whole spread-out town (the Mine sits in the wilds)
  if (Math.hypot(x - cx, y - cy) < 13) return "Wanderer's Rest";
  if (x >= cx && y < cy) return "Palewater";
  if (x < cx && y < cy) return "The Ashen Flats";
  if (x < cx && y >= cy) return "Hollowmere Reach";
  return "The Bonefields";
}
