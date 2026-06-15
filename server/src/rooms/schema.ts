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
  /** premium avatar ("" = the wanderer) + its two channel options — accepted
   *  only when the player owns the avatar (prestige, burned for) */
  @type("string") avatar = "";
  @type("string") avA = "";
  @type("string") avB = "";
  /** guild tag ("" = guildless) — server-set, never client-chosen */
  @type("string") guildTag = "";
  /** demo lane: a guest wanderer (no wallet, economy locked) — server-set */
  @type("boolean") guest = false;
  /** riding a gold-bought steed (drives the road/mount speed bonus + render) */
  @type("boolean") mounted = false;
}

/** a guild + its territory banner (the recurring social DRIFTS sink) */
export class GuildState extends Schema {
  @type("number") id = 0;
  @type("string") name = "";
  @type("string") tag = "";
  @type("number") members = 0;
  /** held region ("" = none) and seconds left on the banner */
  @type("string") region = "";
  @type("number") regionSecsLeft = 0;
}

/** a relic listing: a Drift-touched cosmetic for sale, priced in DRIFTS */
export class RelicState extends Schema {
  @type("number") id = 0;
  @type("string") key = "";
  @type("number") price = 0;
  @type("string") sellerName = "";
}

// Phase 6: shared ambient Drift Beasts (husk/stalker + the den pack). Raiders,
// the colossus and interior content stay per-client for now.
export class MobState extends Schema {
  @type("number") id = 0;
  /** husk | stalker */
  @type("string") kind = "husk";
  @type("number") level = 1;
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") hp = 0;
  @type("number") maxHp = 0;
  /** wander | engaged | dead */
  @type("string") state = "wander";
  /** actually stepping (authoritative walk-anim signal for the puppets) */
  @type("boolean") moving = false;
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

/** the Roaming Trader: a moving frontier vendor that walks the waystations */
export class TraderState extends Schema {
  @type("boolean") active = false;
  @type("number") x = 0;
  @type("number") y = 0;
  /** actually walking (drives the puppet's walk anim) */
  @type("boolean") moving = false;
  /** waystation index it's parked at, -1 while walking (drives the shelf roll) */
  @type("number") stop = -1;
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
  @type({ map: MobState }) mobs = new MapSchema<MobState>();
  @type({ map: GuildState }) guilds = new MapSchema<GuildState>();
  @type({ map: RelicState }) relics = new MapSchema<RelicState>();
  @type(CaravanState) caravan = new CaravanState();
  @type(TraderState) trader = new TraderState();
  // THE LONG NIGHT: realm-wide assault on the Waystation at terminal corruption
  @type("boolean") nightActive = false;
  @type("number") nightEndsIn = 0; // seconds
  @type("number") nightKills = 0;
  @type("number") nightNeed = 0;
  // DRIFT RIFT: a timed frontier incursion (clear the wave for loot, then it seals)
  @type("boolean") riftActive = false;
  @type("number") riftEndsIn = 0; // seconds
  @type("number") riftKills = 0;
  @type("number") riftNeed = 0;
  @type("number") riftX = 0;
  @type("number") riftY = 0;
  // BLOOD MOON: a scheduled corrupted night that buffs the frontier
  @type("boolean") bloodMoon = false;
  @type("number") bloodMoonEndsIn = 0; // seconds
  @type("number") shrinePot = 0;
  @type("number") shrineGoal = 500;
  @type("number") season = 1;
  @type("number") driftPct = 0;
}
