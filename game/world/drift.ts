import { World, mulberry32 } from "@/game/world/tilemap";

// The Drift: the signature mechanic. Depleted nodes don't simply respawn in
// place — after a delay they RELOCATE to a fresh cell elsewhere, so the map's
// resource geography is always shifting. A slow corruption also creeps across
// the land each season, nudging the world toward decay.

export class Drift {
  private rng = mulberry32(0xc0ffee);
  private seasonTimer = 0;
  readonly seasonLengthMs = 45_000; // a "season" tick every 45s
  readonly regrowDelayMs = 8_000;

  onSeason: (() => void) | null = null;
  onRelocate: ((kind: string) => void) | null = null;

  update(world: World, dt: number) {
    const ms = dt * 1000;

    // 1) advance regrow timers for depleted nodes; relocate when ready
    for (const node of world.nodes) {
      if (node.regrowIn > 0) {
        node.regrowIn -= ms;
        if (node.regrowIn <= 0) {
          const cell = world.randomEmptyCell(this.rng);
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
          if ((t === "grass" || t === "dirt") && this.rng() < 0.18) {
            additions.push({ x: nx, y: ny });
          }
        }
      }
    }
    for (const c of additions) world.setTile(c.x, c.y, "corrupt");
  }
}
