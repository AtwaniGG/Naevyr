import { World, mulberry32 } from "@/game/world/tilemap";
import { Cell, ResourceKind } from "@/game/types";

// The Drift: the signature mechanic. Depleted nodes don't simply respawn in
// place — after a delay they RELOCATE to a fresh cell elsewhere, so the map's
// resource geography is always shifting. A slow corruption also creeps across
// the land each season, nudging the world toward decay. Periodically a shard
// of the Drift CRASHES somewhere ("driftfall"), spawning short-lived rich
// nodes that decay back to normal if not harvested fast.

const STANDARD_AMOUNT: Record<ResourceKind, number> = { rock: 6, tree: 5, fish: 8 };

export class Drift {
  private rng = mulberry32(0xc0ffee);
  private seasonTimer = 0;
  readonly seasonLengthMs: number; // a "season" tick (server: SEASON_MS env)
  readonly regrowDelayMs = 2_500; // fast respawn: a cut/mined node relocates ~2.5s later

  constructor(seasonLengthMs = 900_000) { // 15 min per season (production pace)
    this.seasonLengthMs = seasonLengthMs;
  }

  // driftfall bookkeeping (internal clock; first fall 2-4 min in)
  private timeMs = 0;
  private nextFallAt = 120_000 + Math.random() * 120_000;
  private fallNodes: { id: number; expiresAt: number }[] = [];
  readonly fallRichness = 3;     // charges multiplier on fallen nodes
  readonly fallLifetimeMs = 90_000;

  onSeason: (() => void) | null = null;
  onRelocate: ((kind: string) => void) | null = null;
  onDriftfall: ((cell: Cell) => void) | null = null;
  /** claimed ground resists corruption (server wires this to live claims) */
  isProtected: ((x: number, y: number) => boolean) | null = null;
  /** relocation bias: claimed land draws nodes toward it (returns a free cell) */
  preferRelocationCell: (() => Cell | null) | null = null;

  update(world: World, dt: number) {
    const ms = dt * 1000;

    // 0) driftfall: spawn + expiry
    this.timeMs += ms;
    if (this.timeMs >= this.nextFallAt) {
      this.nextFallAt = this.timeMs + 150_000 + this.rng() * 150_000;
      this.spawnDriftfall(world);
    }
    for (const f of [...this.fallNodes]) {
      if (this.timeMs < f.expiresAt) continue;
      this.fallNodes = this.fallNodes.filter((x) => x !== f);
      const node = world.nodes.find((n) => n.id === f.id);
      if (node && node.regrowIn <= 0) {
        // richness fades: shrink back to a standard node and hand it to the Drift
        node.maxAmount = STANDARD_AMOUNT[node.kind];
        node.amount = Math.min(node.amount, node.maxAmount);
        this.depleteNode(world, node.gx, node.gy);
      }
    }

    // 1) advance regrow timers for depleted nodes; relocate when ready
    for (const node of world.nodes) {
      if (node.regrowIn > 0) {
        node.regrowIn -= ms;
        if (node.regrowIn <= 0) {
          // 30% of relocations are pulled toward claimed land (yield perk)
          const preferred =
            this.rng() < 0.3 ? this.preferRelocationCell?.() ?? null : null;
          const cell = preferred ?? world.randomEmptyCell(this.rng);
          if (cell) {
            world.relocateNode(node, cell);
            this.onRelocate?.(node.kind);
          } else {
            node.regrowIn = this.regrowDelayMs; // try again later
          }
        }
      }
      node.phase += dt;
    }

    // 2) season tick -> spread a little corruption from existing corrupt tiles
    this.seasonTimer += ms;
    if (this.seasonTimer >= this.seasonLengthMs) {
      this.seasonTimer = 0;
      this.spreadCorruption(world);
      this.onSeason?.();
    }
  }

  /** Mark a node depleted; the Drift will move it after a delay. */
  depleteNode(world: World, x: number, y: number) {
    const node = world.getNode(x, y);
    if (node) node.regrowIn = this.regrowDelayMs;
  }

  /** A shard crashes: cluster of rich nodes appears around an empty cell. */
  private spawnDriftfall(world: World) {
    const cell = world.randomEmptyCell(this.rng);
    if (!cell) return;
    const spots: Cell[] = [
      cell,
      { x: cell.x + 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y - 1 },
    ].filter((c) => {
      if (!world.inBounds(c.x, c.y)) return false;
      const t = world.tile(c.x, c.y);
      return (t === "grass" || t === "dirt") && !world.getNode(c.x, c.y);
    });
    const kinds: ResourceKind[] = ["tree", "rock", "rock"];
    let placed = 0;
    for (const c of spots) {
      if (placed >= kinds.length) break;
      world.addNode(kinds[placed], c.x, c.y);
      const n = world.getNode(c.x, c.y);
      if (n) {
        n.maxAmount = STANDARD_AMOUNT[n.kind] * this.fallRichness;
        n.amount = n.maxAmount;
        this.fallNodes.push({ id: n.id, expiresAt: this.timeMs + this.fallLifetimeMs });
        placed++;
      }
    }
    if (placed > 0) this.onDriftfall?.(cell);
  }

  private spreadCorruption(world: World) {
    // seed a corruption origin on the first season if none exists
    let hasCorrupt = world.tiles.some((t) => t === "corrupt");
    if (!hasCorrupt) {
      const seed = world.randomEmptyCell(this.rng);
      if (seed) world.setTile(seed.x, seed.y, "corrupt");
      hasCorrupt = true;
    }
    // grow corruption to a few neighbours of existing corrupt land
    const additions: { x: number; y: number }[] = [];
    for (let y = 0; y < world.h; y++) {
      for (let x = 0; x < world.w; x++) {
        if (world.tile(x, y) !== "corrupt") continue;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (!world.inBounds(nx, ny)) continue;
          const t = world.tile(nx, ny);
          if (
            (t === "grass" || t === "dirt") &&
            this.rng() < 0.12 &&
            !this.isProtected?.(nx, ny)
          ) {
            additions.push({ x: nx, y: ny });
          }
        }
      }
    }
    for (const c of additions) world.setTile(c.x, c.y, "corrupt");
  }
}
