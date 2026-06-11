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
  @type("string") aura = "";
  @type("string") pet = "";
}

export class PropState extends Schema {
  @type("number") id = 0;
  @type("number") x = 0;
  @type("number") y = 0;
  @type("string") kind = "campfire";
}

export class NodeState extends Schema {
  @type("number") id = 0;
  @type("string") kind = "tree";
  @type("number") gx = 0;
  @type("number") gy = 0;
  @type("number") amount = 0;
  @type("boolean") alive = true;
}

export class ClaimState extends Schema {
  @type("number") id = 0;
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") integrity = 100;
  @type("string") ownerName = "";
}

export class ListingState extends Schema {
  @type("number") id = 0;
  @type("string") item = "";
  @type("number") qty = 0;
  @type("number") price = 0;
  @type("string") sellerName = "";
}

export class CaravanState extends Schema {
  /** increments each departure (clients key local raider cleanup off this) */
  @type("number") run = 0;
  /** idle | rolling | ambushed */
  @type("string") phase = "idle";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") hp = 0;
  @type("number") maxHp = 0;
  @type("number") gateX = -1;
  @type("number") gateY = -1;
  /** seconds until the next wagon departs (idle phase only) */
  @type("number") departIn = 0;
  @type("number") wave = 0;
  @type("number") waves = 0;
  @type("number") waveKills = 0;
  @type("number") waveNeed = 0;
}

export class DriftRoomState extends Schema {
  @type("number") w = 0;
  @type("number") h = 0;
  @type(["uint8"]) tiles = new ArraySchema<number>();
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: NodeState }) nodes = new MapSchema<NodeState>();
  @type({ map: ClaimState }) claims = new MapSchema<ClaimState>();
  @type({ map: ListingState }) listings = new MapSchema<ListingState>();
  @type({ map: PropState }) props = new MapSchema<PropState>();
  @type(CaravanState) caravan = new CaravanState();
  // THE LONG NIGHT: realm-wide assault on the Waystation at terminal corruption
  @type("boolean") nightActive = false;
  @type("number") nightEndsIn = 0; // seconds
  @type("number") nightKills = 0;
  @type("number") nightNeed = 0;
  @type("number") shrinePot = 0;
  @type("number") shrineGoal = 500;
  @type("number") season = 1;
  @type("number") driftPct = 0;
}
