import { Cell, ResourceKind, ResourceNode, TileType, BOUNTY_REGIONS, BountyRegion } from "../types";

// The world grid: tiles + resource nodes. Owns walkability used by pathfinding.

// ─── The Waystation: the town at Wanderer's Rest ──────────────────────────────
// Shared by client and server so pathfinding and placement always agree.

export type BuildingKey =
  | "dyeworks" | "vault" | "wheel" | "lantern"
  | "furnisher" | "menagerie" | "shrine" | "pit" | "mine" | "stable"
  | "huskden" | "obelisk" | "mirehut" | "waystation"
  // Phase C wild camps (mini-dungeon sites in the frontier)
  | "drownedruins" | "barrowcrypt" | "ashwarcamp" | "mirelair"
  // Phase D the Frontier Outpost (second hub) keeper
  | "outpost";

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

// ─── World size ───────────────────────────────────────────────────────────
// Single source of truth for the realm grid. The server builds the world at
// this size and the client adopts whatever the server sends (net.w/net.h);
// the offline-solo path builds it locally from these constants too.
export const MAP_W = 80;
export const MAP_H = 80;

// The town layout below was authored around a center of (20,20). We keep the
// exact organic arrangement but shift it to the real map center so the town
// stays centered at any map size and the new space becomes the wild frontier.
const LEGACY_CENTER = 20;
export const TOWN_CENTER = { x: Math.floor(MAP_W / 2), y: Math.floor(MAP_H / 2) };
const SHIFT_X = TOWN_CENTER.x - LEGACY_CENTER;
const SHIFT_Y = TOWN_CENTER.y - LEGACY_CENTER;
/** shift an authored (≈20,20-centric) coord onto the live map center */
const place2 = (b: TownBuilding): TownBuilding => ({ ...b, x: b.x + SHIFT_X, y: b.y + SHIFT_Y });

/** no resource nodes inside this euclidean radius of town */
export const TOWN_NODE_FREE_RADIUS = 8;

/** the two water bodies, positioned by map fraction (shared by gen + clutter) */
export function poolCenter(w: number, h: number) {
  return { x: Math.floor(w * 0.72), y: Math.floor(h * 0.28) };
}
export function mereCenter(w: number, h: number) {
  return { x: Math.floor(w * 0.18), y: Math.floor(h * 0.86) };
}

// Organic scatter with one hard rule: no building may stand close enough
// south of another to cover its door. In iso terms, for any pair with
// depth gap Δ(x+y) in (0, 8], the screen-column gap |Δ(x-y)| must exceed 4.
// The Mine sits apart in the south-east rocks. (Authored ≈20,20-centric; the
// live coords are this layout shifted onto TOWN_CENTER.)
const TOWN_LAYOUT: TownBuilding[] = [
  { key: "shrine",    label: "Shrine of the Pale Flame", x: 17, y: 13, r: 1 },
  { key: "dyeworks",  label: "The Dyeworks",             x: 12, y: 17, r: 1 },
  { key: "vault",     label: "The Vault",                x: 24, y: 16, r: 1 },
  { key: "lantern",   label: "The Last Lantern",         x: 21, y: 22, r: 1 },
  { key: "menagerie", label: "The Menagerie",            x: 28, y: 22, r: 1 },
  { key: "furnisher", label: "The Furnisher",            x: 14, y: 24, r: 1 },
  { key: "wheel",     label: "Wheel of the Drift",       x: 13, y: 29, r: 1 },
  { key: "pit",       label: "The Pit",                  x: 20, y: 32, r: 2, walkable: true },
  { key: "mine",      label: "The Mine",                 x: 31, y: 29, r: 1 },
  // the Stable: a gold-bought steed for the open road. Sits in the travel
  // district by the Waystation hub (authored ≈20,20-centric → live (45,50)).
  { key: "stable",    label: "The Stable",               x: 25, y: 30, r: 1 },
];
export const TOWN_BUILDINGS: TownBuilding[] = TOWN_LAYOUT.map(place2);

export function buildingAt(x: number, y: number): TownBuilding | null {
  for (const b of ALL_STRUCTURES) {
    if (Math.max(Math.abs(x - b.x), Math.abs(y - b.y)) <= b.r) return b;
  }
  return null;
}

// ─── Wild structures: out in the quadrants, NOT Drift-immune ─────────────────
// Unlike the Waystation these have no corruption protection: the Drift can
// press right up against them. Same footprint/door rules as town buildings.
// Positioned by MAP FRACTION (not the town shift) so they sit deep in their
// quadrants and ride outward as the map grows. Fractions reproduce the
// original 40×40 placements: huskden (8,8), obelisk (15,5), mirehut (5,24).
const wildAt = (
  key: BuildingKey, label: string, fx: number, fy: number, r = 1,
): TownBuilding => ({ key, label, x: Math.round(MAP_W * fx), y: Math.round(MAP_H * fy), r });
export const WILD_STRUCTURES: TownBuilding[] = [
  // the Ashen Flats (NW): the war quadrant
  wildAt("huskden", "The Husk Den",       0.20,  0.20),
  wildAt("obelisk", "The Ash Obelisk",    0.375, 0.125),
  wildAt("ashwarcamp", "The Ashen Warcamp", 0.08, 0.30),
  // Hollowmere Reach (SW): the witch's marsh
  wildAt("mirehut", "The Mirewife's Hut", 0.125, 0.60),
  wildAt("mirelair", "The Sunken Lair",   0.10,  0.82), // SW corner boss lair (the drowned king)
  // Phase C frontier camps in the emptier quadrants
  wildAt("drownedruins", "The Drowned Ruins", 0.72, 0.12), // Palewater (NE)
  wildAt("barrowcrypt", "The Barrow-Crypt",   0.84, 0.70), // Bonefields (SE)
];

// ─── Waystations: the fast-travel network (Phase B) ──────────────────────────
// Blocking landmarks (reuse the obelisk monolith art) standing at fixed nodes:
// a hub just south of the Waystation town + one out in each quadrant's frontier.
// You step up to any node and burn DRIFTS to leap to another. Positioned by
// fraction so they ride outward with the map (the hub stays near town center).
const wayHub = (): TownBuilding => ({
  key: "waystation", label: "Waystation", x: TOWN_CENTER.x, y: TOWN_CENTER.y + 6, r: 1,
});
export const WAYSTATIONS: TownBuilding[] = [
  wayHub(),
  wildAt("waystation", "Palewater Waygate",  0.82, 0.18),
  wildAt("waystation", "Ashfall Waygate",    0.14, 0.22),
  wildAt("waystation", "Hollowmere Waygate", 0.24, 0.80),
  wildAt("waystation", "Bonefield Waygate",  0.82, 0.82),
];

// ─── The Frontier Outpost (Phase D): a second hub deep in the SE Bonefields ───
// The Quartermaster (open-air keeper, key "outpost") plus a co-located strongbox
// + tavern (reused vault/lantern services) and the Bonefield waygate nearby.
// Placed on a shared screen-depth (x+y) so the three never cover each other's
// doors, and by fraction so the outpost rides outward with the map.
export const OUTPOST_BUILDINGS: TownBuilding[] = [
  wildAt("outpost", "The Frontier Outpost", 0.75, 0.75),
  wildAt("vault",   "Outpost Strongbox",    0.79, 0.71),
  wildAt("lantern", "The Last Drop",         0.71, 0.79),
];

export const ALL_STRUCTURES: TownBuilding[] = [
  ...TOWN_BUILDINGS, ...WILD_STRUCTURES, ...WAYSTATIONS, ...OUTPOST_BUILDINGS,
];

/** the waystation the given cell is standing at (within `pad`), or null. The
 *  server uses this as the departure gate; the index keys the WAYSTATIONS list. */
export function waystationAt(x: number, y: number, pad = 2): number {
  for (let i = 0; i < WAYSTATIONS.length; i++) {
    const w = WAYSTATIONS[i];
    if (Math.max(Math.abs(x - w.x), Math.abs(y - w.y)) <= w.r + pad) return i;
  }
  return -1;
}

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
    const pool = poolCenter(this.w, this.h);
    const poolCx = pool.x, poolCy = pool.y;
    // …and the Hollowmere itself, deep in the south-west corner
    const mere = mereCenter(this.w, this.h);
    const mereCx = mere.x, mereCy = mere.y;
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

    // region terrain accents: each quadrant reads distinct at the tile level.
    // The Ashen Flats turn rocky-highland + ash-scorched; the marsh + Bonefields
    // go muddy/dry. The heartland + Palewater stay green (flowers carry them).
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.tile(x, y) !== "grass") continue;
        const region = regionAt(this.w, this.h, x, y);
        const r = rng();
        if (region === "The Ashen Flats") {
          if (r < 0.10) this.setTile(x, y, "stone"); // rocky highland
          else if (r < 0.30) this.setTile(x, y, "dirt"); // ash-scorched ground
        } else if (region === "Hollowmere Reach") {
          if (r < 0.16) this.setTile(x, y, "dirt"); // boggy marsh ground
        } else if (region === "The Bonefields") {
          if (r < 0.12) this.setTile(x, y, "dirt"); // dry grave dirt
        }
      }

    // a dirt apron under each waystation: the obelisk-style monolith art clips
    // its own south ground pad, so it needs dirt-toned tiles beneath it.
    for (const w of WAYSTATIONS) {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const ax = w.x + dx, ay = w.y + dy;
          if (this.inBounds(ax, ay) && this.tile(ax, ay) !== "water") {
            this.setTile(ax, ay, "dirt");
          }
        }
    }

    // trees + rocks scattered on land; fish along water edge.
    // counts scale with map area so a bigger realm keeps the same density
    // (40×40 → 22 trees / 14 rocks / 8 fish; the ratios below reproduce that).
    const area = this.w * this.h;
    const place = (kind: ResourceKind, count: number, nearWater = false) => {
      let placed = 0;
      let guard = 0;
      const cap = Math.max(2000, count * 60);
      while (placed < count && guard++ < cap) {
        const x = (rng() * this.w) | 0;
        const y = (rng() * this.h) | 0;
        if (this.tile(x, y) === "water") continue;
        if (this.nodeAt.has(this.idx(x, y))) continue;
        if (nearWater && !this.adjacentToWater(x, y)) continue;
        // keep the town clear of nodes (buffer included: sprites overhang)
        if (nearBuilding(x, y)) continue;
        if (roadAt(this.w, this.h, x, y)) continue; // never block a road
        if (Math.hypot(x - TOWN_CENTER.x, y - TOWN_CENTER.y) < TOWN_NODE_FREE_RADIUS) continue;
        this.addNode(kind, x, y);
        placed++;
      }
    };
    place("tree", Math.max(8, Math.round(area / 58)));   // denser woods (groves)
    place("rock", Math.max(6, Math.round(area / 100)));
    place("fish", Math.max(4, Math.round(area / 180)), true);
    // the Hollowmere is the realm's best fishing: extra schools on its banks
    const mereTarget = Math.max(4, Math.round(area / 400));
    let mereFish = 0;
    let guard = 0;
    while (mereFish < mereTarget && guard++ < mereTarget * 120) {
      const x = mereCx - 5 + ((rng() * 11) | 0);
      const y = mereCy - 5 + ((rng() * 11) | 0);
      if (!this.inBounds(x, y) || this.tile(x, y) === "water") continue;
      if (this.nodeAt.has(this.idx(x, y)) || nearBuilding(x, y)) continue;
      if (roadAt(this.w, this.h, x, y)) continue; // never block a road
      if (!this.adjacentToWater(x, y)) continue;
      this.addNode("fish", x, y);
      mereFish++;
    }

    // resource camps: a bonus cluster worth a detour, seeded around each camp
    // center (logging→trees, quarry→rocks, fishing→fish on the bank)
    for (const camp of RESOURCE_CAMPS) {
      const kind: ResourceKind =
        camp.kind === "logging" ? "tree" : camp.kind === "quarry" ? "rock" : "fish";
      let placed = 0, tries = 0;
      while (placed < 5 && tries++ < 200) {
        const x = camp.x - 3 + ((rng() * 7) | 0);
        const y = camp.y - 3 + ((rng() * 7) | 0);
        if (!this.inBounds(x, y) || this.tile(x, y) === "water") continue;
        if (this.nodeAt.has(this.idx(x, y)) || nearBuilding(x, y)) continue;
        if (roadAt(this.w, this.h, x, y)) continue;
        if (kind === "fish" && !this.adjacentToWater(x, y)) continue;
        this.addNode(kind, x, y);
        placed++;
      }
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

/** Danger gradient by distance from town: 0 heartland, 1 borderlands,
 *  2 frontier (the deadly outer ring). Independent of region NAMES so guild
 *  territory is undisturbed. Server scales mob level / loot / spawns by this;
 *  the client tints the minimap edges. Normalized so the threshold tiles fall
 *  at the same fractions on any map size. */
export function frontierTier(w: number, h: number, x: number, y: number): 0 | 1 | 2 {
  const cx = w / 2, cy = h / 2;
  const maxR = Math.min(cx, cy) || 1;
  const d = Math.hypot(x - cx, y - cy) / maxR; // 0 at center, 1 at nearest edge
  if (d < 0.45) return 0;
  if (d < 0.72) return 1;
  return 2;
}

/** Which wild-clutter style a cell grows (decor only; the render loop reads
 *  this so doodads follow the wild structures wherever they sit, rather than
 *  the old hardcoded den/mire coords). 1 = bone/dead (war quadrant), 2 =
 *  reed/bog (the marsh + the Hollowmere). */
export function wildClutterZone(w: number, h: number, x: number, y: number): 0 | 1 | 2 {
  for (const b of WILD_STRUCTURES) {
    const d = Math.max(Math.abs(x - b.x), Math.abs(y - b.y));
    if (b.key === "huskden" && d <= 8) return 1;
    if (b.key === "mirehut" && d <= 8) return 2;
    if (b.key === "mirelair" && d <= 8) return 2;
  }
  const m = mereCenter(w, h);
  if (Math.max(Math.abs(x - m.x), Math.abs(y - m.y)) <= 6) return 2;
  return 0;
}

// ─── The King's Roads: the free travel network ───────────────────────────────
// A deterministic road graph carved by A* between the town, its waystation hub,
// each frontier waygate, and the wild landmarks. It depends ONLY on (w,h) + the
// static structure layout (never on resource nodes), so the client and server
// compute an identical Set with zero sync. Walking a road cell speeds travel
// (effectiveMoveSpeed); the Drift severs the bonus on corrupt ground.

/** terrain-only walkability for road carving: water + building footprints block;
 *  resource nodes are ignored so the road set never depends on node RNG. */
function roadCarveWalkable(w: number, h: number, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  const pool = poolCenter(w, h);
  const mere = mereCenter(w, h);
  if (Math.hypot(x - pool.x, y - pool.y) < 3.2) return false; // the two pools
  if (Math.hypot(x - mere.x, y - mere.y) < 2.8) return false;
  const b = buildingAt(x, y);
  if (b && !b.walkable) return false;
  return true;
}

/** nearest road-walkable cell to a (possibly blocked) structure center, so the
 *  road runs up to the doorstep rather than into the footprint. */
function nearestCarveCell(w: number, h: number, cx: number, cy: number): Cell | null {
  for (let r = 0; r <= 6; r++) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (roadCarveWalkable(w, h, cx + dx, cy + dy)) return { x: cx + dx, y: cy + dy };
      }
  }
  return null;
}

let roadCache: { w: number; h: number; set: Set<number> } | null = null;

/** the road-cell set for a given map size (memoised; pure in (w,h)) */
export function buildRoadNetwork(w: number, h: number): Set<number> {
  if (roadCache && roadCache.w === w && roadCache.h === h) return roadCache.set;
  const set = new Set<number>();
  const wild = (k: BuildingKey): Cell => {
    const b = WILD_STRUCTURES.find((s) => s.key === k);
    return b ? { x: b.x, y: b.y } : { x: Math.floor(w / 2), y: Math.floor(h / 2) };
  };
  const [hub, palewater, ashfall, hollowmere, bonefield] = WAYSTATIONS;
  const outpost = OUTPOST_BUILDINGS[0];
  const plaza: Cell = { x: TOWN_CENTER.x, y: TOWN_CENTER.y };
  const edges: [Cell, Cell][] = [
    [plaza, hub],                                                   // town → waystation hub
    [hub, palewater], [hub, ashfall], [hub, hollowmere], [hub, bonefield], // four spokes
    [ashfall, wild("ashwarcamp")], [ashfall, wild("huskden")],      // NW branches
    [wild("huskden"), wild("obelisk")],
    [palewater, wild("drownedruins")],                              // NE branch
    [hollowmere, wild("mirehut")], [wild("mirehut"), wild("mirelair")], // SW branches
    [bonefield, wild("barrowcrypt")], [bonefield, outpost],         // SE branches
    [plaza, outpost],                                               // trunk road across the SE
  ];
  const walk = (x: number, y: number) => roadCarveWalkable(w, h, x, y);
  for (const [a, b] of edges) {
    const sa = nearestCarveCell(w, h, a.x, a.y);
    const sb = nearestCarveCell(w, h, b.x, b.y);
    if (!sa || !sb) continue;
    // cardinal-only carve with a turn penalty: roads run in long straight runs
    // with deliberate bends (clean iso roads), and consecutive cells are always
    // cardinal neighbours so the auto-tile pieces connect them.
    const path = carveRoad(w, sa, sb, walk);
    if (!path) continue;
    for (const c of [sa, ...path]) set.add(c.y * w + c.x);
  }
  roadCache = { w, h, set };
  return set;
}

// 4-direction grid moves (each = a screen diagonal); index = direction id
const ROAD_MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** Carve a road with a 4-dir A* that PENALISES turns, so roads prefer long
 *  straight runs and bend deliberately — instead of the staircase a plain
 *  octile A* produces on the iso grid. State = (cell, arrival-direction). */
function carveRoad(
  w: number, start: Cell, goal: Cell,
  walk: (x: number, y: number) => boolean, turnCost = 3,
): Cell[] | null {
  if (!walk(goal.x, goal.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [];
  const sid = (idx: number, dir: number) => idx * 5 + dir; // dir 0-3 = move, 4 = start
  const g = new Map<number, number>();
  const came = new Map<number, number>();
  const open: { s: number; f: number }[] = [];
  const push = (s: number, f: number) => {
    open.push({ s, f }); let i = open.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (open[p].f <= open[i].f) break; [open[p], open[i]] = [open[i], open[p]]; i = p; }
  };
  const pop = () => {
    const top = open[0]; const last = open.pop()!;
    if (open.length) {
      open[0] = last; let i = 0;
      for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let m = i; if (l < open.length && open[l].f < open[m].f) m = l; if (r < open.length && open[r].f < open[m].f) m = r; if (m === i) break; [open[m], open[i]] = [open[i], open[m]]; i = m; }
    }
    return top;
  };
  const hMan = (x: number, y: number) => Math.abs(x - goal.x) + Math.abs(y - goal.y);
  const s0 = sid(start.y * w + start.x, 4);
  g.set(s0, 0); push(s0, hMan(start.x, start.y));
  while (open.length) {
    const cur = pop().s;
    const cidx = Math.floor(cur / 5), cdir = cur % 5;
    const cx = cidx % w, cy = (cidx / w) | 0;
    if (cx === goal.x && cy === goal.y) {
      const path: Cell[] = [];
      let s: number | undefined = cur;
      while (s !== undefined && s !== s0) { const ix = Math.floor(s / 5); path.push({ x: ix % w, y: (ix / w) | 0 }); s = came.get(s); }
      return path.reverse();
    }
    const cg = g.get(cur)!;
    for (let d = 0; d < 4; d++) {
      const nx = cx + ROAD_MOVES[d][0], ny = cy + ROAD_MOVES[d][1];
      if (!walk(nx, ny)) continue;
      const step = 1 + (cdir !== 4 && cdir !== d ? turnCost : 0);
      const ns = sid(ny * w + nx, d);
      const t = cg + step;
      if (t < (g.get(ns) ?? Infinity)) {
        g.set(ns, t); came.set(ns, cur);
        push(ns, t + hMan(nx, ny));
      }
    }
  }
  return null;
}

/** is this cell part of the road network? */
export function roadAt(w: number, h: number, x: number, y: number): boolean {
  return buildRoadNetwork(w, h).has(y * w + x);
}

// ─── Groves: clustered woods (decorative trees fill the open stretches) ──────
let groveCache: { w: number; h: number; set: Set<number> } | null = null;
/** deterministic clustered grove cells (pure in w,h; client renders trees here) */
export function buildGroves(w: number, h: number): Set<number> {
  if (groveCache && groveCache.w === w && groveCache.h === h) return groveCache.set;
  const set = new Set<number>();
  const rng = mulberry32(909);
  const N = Math.round((w * h) / 430); // ~15 groves on 80×80
  for (let i = 0; i < N; i++) {
    const cx = (rng() * w) | 0, cy = (rng() * h) | 0, r = 3 + ((rng() * 3) | 0);
    if (Math.hypot(cx - TOWN_CENTER.x, cy - TOWN_CENTER.y) < 13) continue; // keep the town airy
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if (rng() < 0.5) set.add(y * w + x);
      }
  }
  groveCache = { w, h, set };
  return set;
}
/** is this cell inside a decorative grove? */
export function groveAt(w: number, h: number, x: number, y: number): boolean {
  return buildGroves(w, h).has(y * w + x);
}

// ─── Wayside content: what fills the road between the landmarks ───────────────
// Authored points placed along the spokes (fractions ride outward with the map).
// Rest stops are safe campfires; landmarks are scenic lore markers; resource
// camps seed bonus node clusters; ambush zones bias the ambient mob spawns.
export interface WaysidePoint { x: number; y: number; name: string }
const frac = (fx: number, fy: number, name: string): WaysidePoint => ({
  x: Math.round(MAP_W * fx), y: Math.round(MAP_H * fy), name,
});

/** safe campfire hadsteads at the spoke midpoints (no ambient spawns within R) */
export const REST_STOPS: WaysidePoint[] = [
  frac(0.66, 0.35, "Palewater Rest"),  // NE spoke
  frac(0.31, 0.35, "Ashfall Rest"),    // NW spoke
  frac(0.37, 0.66, "Mirewatch Rest"),  // SW spoke
  frac(0.69, 0.66, "Bonefield Rest"),  // SE spoke
];
export const REST_STOP_R = 3;

/** scenic lore markers (decoration only; some named on the minimap). Kinds map
 *  1:1 to the DS ruin sprites (waystone/broken_arch/fallen_statue/
 *  battlefield_bones/drift_monolith). */
export type LandmarkKind = "waystone" | "broken_arch" | "fallen_statue" | "battlefield_bones" | "drift_monolith";
export interface Landmark { x: number; y: number; kind: LandmarkKind; name: string }
export const LANDMARKS: Landmark[] = [
  { ...frac(0.56, 0.26, "The Leaning Waystone"), kind: "waystone" },
  { ...frac(0.30, 0.46, "The Broken Arch"), kind: "broken_arch" },
  { ...frac(0.46, 0.62, "The Sunken Monolith"), kind: "drift_monolith" },
  { ...frac(0.70, 0.40, "The Fallen King"), kind: "fallen_statue" }, // clear of the quarry camp

  { ...frac(0.24, 0.58, "Fallow Battleground"), kind: "battlefield_bones" },
];

/** node clusters worth stopping for, seeded in World.generate */
export type ResourceCampKind = "logging" | "quarry" | "fishing";
export interface ResourceCamp { x: number; y: number; kind: ResourceCampKind; name: string }
export const RESOURCE_CAMPS: ResourceCamp[] = [
  { ...frac(0.35, 0.28, "Old Logging Camp"), kind: "logging" },
  { ...frac(0.62, 0.50, "The Roadside Quarry"), kind: "quarry" },
  { ...frac(0.66, 0.27, "Palewater Dock"), kind: "fishing" },
];

/** borderland stretches where the road carries teeth (ambient-spawn bias) */
export const AMBUSH_ZONES: WaysidePoint[] = [
  frac(0.60, 0.30, "Palewater road"),
  frac(0.26, 0.32, "Ashfall road"),
  frac(0.34, 0.60, "Mire road"),
  frac(0.62, 0.62, "Bonefield road"),
];

/** within the safe radius of a rest stop? (server suppresses spawns here) */
export function nearRestStop(x: number, y: number, pad = 0): boolean {
  for (const r of REST_STOPS) {
    if (Math.hypot(x - r.x, y - r.y) <= REST_STOP_R + pad) return true;
  }
  return false;
}

// ─── Frontier bounty boards: one per waystation, posting that region's work ───
// The board stands at the rest-stop center (shares the safe campfire); the kinds
// REST_STOPS order matches BOUNTY_REGIONS order (NE/NW/SW/SE → the four quadrants).
export interface BountyBoardSite { x: number; y: number; region: BountyRegion; name: string }
export const BOUNTY_BOARDS: BountyBoardSite[] = REST_STOPS.map((r, i) => ({
  x: r.x, y: r.y, region: BOUNTY_REGIONS[i], name: r.name,
}));

/** the bounty board whose center cell was clicked (within `pad`), else null */
export function bountyBoardAt(x: number, y: number, pad = 0): BountyBoardSite | null {
  for (const b of BOUNTY_BOARDS) {
    if (Math.max(Math.abs(x - b.x), Math.abs(y - b.y)) <= pad) return b;
  }
  return null;
}
