import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";

// Synced room state. Positions are fractional grid coordinates (same space the
// client engine already uses). Tiles are uint8-encoded TileType indices
// (encoding shared with the client via game/types.ts).

export { tileToCode, codeToTile } from "@/game/types";

export class PlayerState extends Schema {
  @type("string") id = "";
  @type("number") x = 0;
  @type("number") y = 0;
  /** idle | walk | gather */
  @type("string") action = "idle";
  /** gather target cell, -1 when not gathering (lets clients face the node) */
  @type("number") tx = -1;
  @type("number") ty = -1;
  // ---- cosmetics (client-chosen, server-sanitized) ----
  @type("string") name = "Wanderer";
  @type("string") dye = "stone";
  @type("string") eye = "drift";
  @type("string") title = "Drifter";
}

export class NodeState extends Schema {
  @type("number") id = 0;
  @type("string") kind = "tree";
  @type("number") gx = 0;
  @type("number") gy = 0;
  @type("number") amount = 0;
  @type("boolean") alive = true;
}

export class DriftRoomState extends Schema {
  @type("number") w = 0;
  @type("number") h = 0;
  @type(["uint8"]) tiles = new ArraySchema<number>();
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: NodeState }) nodes = new MapSchema<NodeState>();
  @type("number") season = 1;
  @type("number") driftPct = 0;
}
