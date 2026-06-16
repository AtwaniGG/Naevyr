// Shared game types for Naevyr.

export type TileType = "grass" | "dirt" | "stone" | "water" | "corrupt";

/** uint8 encoding of TileType for network sync (index = wire code) */
export const TILE_CODES: readonly TileType[] = [
  "grass",
  "dirt",
  "stone",
  "water",
  "corrupt",
];
export const tileToCode = (t: TileType) => TILE_CODES.indexOf(t);
export const codeToTile = (c: number): TileType => TILE_CODES[c] ?? "grass";

// land claims (3×3 plots; staked online, eroded by the Drift each season)
export const CLAIM_COST = 250;
export const CLAIM_MAX = 3;

// ─── Movement speed ──────────────────────────────────────────────────────────
// Base walk speed (tiles/sec). Shared so the authoritative server stepSim and
// the client's local prediction compute the SAME effective speed — any drift
// between the two shows up as rubber-banding.
export const PLAYER_BASE_SPEED = 3.2;
// The King's-Road network (game/world/tilemap.ts roadAt) speeds travel along the
// intended routes; a gold-bought mount stacks on top. Combined mul is capped so
// the 20Hz sim never steps more than a fraction of a tile (no cell-skipping).
export const MOVE_ROAD_MUL = 1.4;
export const MOVE_MOUNT_MUL = 1.5;
export const MOVE_SPEED_CAP = 2.0;
/** the Swift Steed upgrade: a faster mount + a higher combined cap */
export const MOVE_SWIFT_MOUNT_MUL = 1.7;
export const MOVE_SWIFT_CAP = 2.4;
/** a gold-bought steed from the Stable — never DRIFTS (a one-time gold sink) */
export const MOUNT_COST = 3000;
/** the Swift Steed: a Stable upgrade (requires a steed first) — gold sink */
export const SWIFT_MOUNT_COST = 4000;

/** The one effective-speed channel both sides compute identically. The road
 *  bonus is severed on corrupt ground (the Drift breaks the roads). */
export function effectiveMoveSpeed(opts: {
  base?: number;
  mounted?: boolean;
  swift?: boolean;
  onRoad?: boolean;
  corrupt?: boolean;
}): number {
  const base = opts.base ?? PLAYER_BASE_SPEED;
  let mul = 1;
  if (opts.mounted) mul *= opts.swift ? MOVE_SWIFT_MOUNT_MUL : MOVE_MOUNT_MUL;
  if (opts.onRoad && !opts.corrupt) mul *= MOVE_ROAD_MUL;
  const cap = opts.mounted && opts.swift ? MOVE_SWIFT_CAP : MOVE_SPEED_CAP;
  return base * Math.min(mul, cap);
}

// ─── the Waystation catalogs ───────────────────────────────────────────────────

export type AuraKey =
  | "driftmote" | "emberwake" | "goldhalo"
  // Drift-touched (prestige): burned into being, never bought with gold
  | "ashen_crown" | "corruption_halo" | "ember_cinder" | "bonewisp";
export const AURA_CATALOG: Record<
  AuraKey,
  { label: string; price: number; color: string; driftsOnly?: boolean }
> = {
  driftmote: { label: "Driftmote Orbit", price: 1000, color: "#a855f7" },
  emberwake: { label: "Emberwake", price: 1000, color: "#f59e0b" },
  goldhalo:  { label: "Gilded Halo", price: 1500, color: "#e7c873" },
  ashen_crown:     { label: "Ashen Crown", price: 0, color: "#e7c873", driftsOnly: true },
  corruption_halo: { label: "Corruption Halo", price: 0, color: "#a855f7", driftsOnly: true },
  ember_cinder:    { label: "Ember Cinder", price: 0, color: "#f59e0b", driftsOnly: true },
  bonewisp:        { label: "Bonewisp", price: 0, color: "#d8cfe0", driftsOnly: true },
};

// ─── Premium avatars: whole other bodies, DRIFTS burns only ───────────────────
// The art lives in game/render/sprites.ts (DS avatars.js port); this table is
// the shared truth for the HUD shop, the server's identity validation and the
// codex. Each kind has two cosmetic channels; options are locked-ramp names.
export type AvatarKind = "ashbound" | "mireborn" | "bonecaller" | "veilborn" | "driftwarden";
export const AVATAR_CHANNELS: Record<AvatarKind, Record<string, readonly string[]>> = {
  ashbound:   { seam:   ["ember", "gold", "blood", "drift", "bone"],  wrap:   ["stone", "dirt", "blood", "bone", "drift"] },
  mireborn:   { flame:  ["ember", "drift", "gold", "water", "blood"], shawl:  ["grass", "dirt", "stone", "water", "bone"] },
  bonecaller: { socket: ["drift", "ember", "gold", "blood", "water"], mantle: ["bone", "stone", "gold", "dirt", "blood"] },
  veilborn:   { veil:   ["stone", "drift", "blood", "water", "bone"], mote:   ["drift", "ember", "gold", "water", "blood"] },
  driftwarden:{ cloak:  ["stone", "dirt", "grass", "blood", "drift"], ward:   ["drift", "ember", "gold", "water", "blood"] },
};
export const AVATAR_KINDS = Object.keys(AVATAR_CHANNELS) as AvatarKind[];

// ─── Drift-touched cosmetics (Phase 6): DRIFTS burns only, never gold ─────────
// One shared catalog so the Dyeworks panel, the server's burn validation and
// the codex all read the same truth. `action` keys into BURN_COSTS.
export type PrestigeKind = "dye" | "aura" | "title" | "avatar";
export interface PrestigeEntry {
  kind: PrestigeKind;
  label: string;
  desc: string;
  action: "prestigeDye" | "prestigeAura" | "prestigeTitle" | "prestigeAvatar";
}
export const PRESTIGE_CATALOG: Record<string, PrestigeEntry> = {
  drift: {
    kind: "dye", label: "Driftweave Cloak", action: "prestigeDye",
    desc: "cloth dyed in the corruption itself; it never quite holds still",
  },
  ashen_crown: {
    kind: "aura", label: "Ashen Crown", action: "prestigeAura",
    desc: "a slow ring of drifting ash, crowned in old gold",
  },
  corruption_halo: {
    kind: "aura", label: "Corruption Halo", action: "prestigeAura",
    desc: "the Drift orbits you now, not the other way around",
  },
  ember_cinder: {
    kind: "aura", label: "Ember Cinder", action: "prestigeAura",
    desc: "sparks rise off you and cool to blood-ash",
  },
  bonewisp: {
    kind: "aura", label: "Bonewisp", action: "prestigeAura",
    desc: "pale wisps circle your feet; they remember being people",
  },
  ashgilded: {
    kind: "title", label: "Ashgilded", action: "prestigeTitle",
    desc: "a name written in what the fire left",
  },
  driftmarked: {
    kind: "title", label: "Drift-Marked", action: "prestigeTitle",
    desc: "the corruption knows you on sight",
  },
  // premium avatars: bound to the buyer, never on the relic stall
  ashbound: {
    kind: "avatar", label: "The Ashbound", action: "prestigeAvatar",
    desc: "a burned penitent of the Ashen Flats. The fire never quite left",
  },
  mireborn: {
    kind: "avatar", label: "The Mireborn", action: "prestigeAvatar",
    desc: "a bog seer of Hollowmere, lantern guttering at the belt",
  },
  bonecaller: {
    kind: "avatar", label: "The Bonecaller", action: "prestigeAvatar",
    desc: "an ossuary priest of the Bonefields. The mantle clicks when it moves",
  },
  veilborn: {
    kind: "avatar", label: "The Veilborn", action: "prestigeAvatar",
    desc: "one the Drift gave back. The hem never touches the ground",
  },
  driftwarden: {
    kind: "avatar", label: "The Driftwarden", action: "prestigeAvatar",
    desc: "a ranger of the frontier line. The belt-lantern burns where the Drift is thickest",
  },
};

export type PetKey = "wisp" | "crow" | "emberling";
export const PET_CATALOG: Record<PetKey, { label: string; price: number; flavor: string }> = {
  wisp:      { label: "Drift Wisp", price: 750, flavor: "a curious scrap of the Drift that chose you" },
  crow:      { label: "Bone Crow", price: 750, flavor: "it remembers where everything died" },
  emberling: { label: "Emberling", price: 900, flavor: "a coal that refuses to go out" },
};

export type DrinkKey = "emberwine" | "boneale" | "driftgin";
export const DRINK_CATALOG: Record<
  DrinkKey,
  { label: string; price: number; desc: string; buff: "gather" | "damage" | "sight"; ms: number }
> = {
  emberwine: { label: "Emberwine", price: 30, desc: "+15% gather speed, 5 min", buff: "gather", ms: 300_000 },
  boneale:   { label: "Boneale", price: 40, desc: "+1 damage, 5 min", buff: "damage", ms: 300_000 },
  driftgin:  { label: "Driftgin", price: 35, desc: "see node charges at a glance, 5 min", buff: "sight", ms: 300_000 },
};

export type PropKey =
  | "campfire" | "banner" | "driftlamp" | "statue"
  | "claim_stash" | "claim_workbench" | "claim_ward";
export const PROP_CATALOG: Record<PropKey, { label: string; price: number }> = {
  campfire:  { label: "Campfire", price: 100 },
  banner:    { label: "Claim Banner", price: 150 },
  driftlamp: { label: "Drift Lamp", price: 200 },
  statue:    { label: "Wanderer Statue", price: 300 },
  // claim upgrades (functional): field banking, field forge, Drift-ward
  claim_stash:     { label: "Storage Stash", price: 400 },
  claim_workbench: { label: "Workbench", price: 350 },
  claim_ward:      { label: "Drift-Ward", price: 500 },
};
/** claim upgrade props grant a benefit rather than just decorating */
export const CLAIM_UPGRADE_KEYS = ["claim_stash", "claim_workbench", "claim_ward"] as const;

/** gold cost of a waystation fast-travel jump (the DRIFTS burn is the premium tier) */
export const WAYSTATION_GOLD = 60;

export const DYE_PRICE = 200;
export const EYE_PRICE = 350;
export const SPIN_COST = 50;
export const VAULT_FEE = 0.02; // withdrawal fee (base; tiers lower it)

/** token burn costs per rite (shared: the server debits them on-chain, the HUD
 *  and codex display them — one table so the copy can't drift from the truth) */
export const BURN_COSTS = {
  spin: 5_000,     // a Wheel spin
  claim: 25_000,   // staking a 3×3 claim
  aura: 15_000,    // any Dyeworks aura
  cleanse: 10_000, // feeds the Shrine pot
  obelisk: 5_000,  // the Ash Obelisk rewrites the day's quests
  waystation: 3_000, // leap across the realm between waystations
  reinforce: 10_000, // shore up your weakest claim against the Drift
  prestigeDye: 15_000,   // Drift-touched cloak dye (burn-only, never gold)
  prestigeAura: 25_000,  // Drift-touched aura (burn-only, never gold)
  prestigeTitle: 40_000, // Drift-touched title (burn-only, never gold)
  prestigeAvatar: 30_000, // a premium avatar: a whole other body (burn-only)
  driftSpin: 5_000,      // one Drift Wheel spin (gacha cosmetics)
  cache: 12_000,         // a Drift Cache = 3 Drift Wheel spins (20% off)
  guildFound: 50_000,    // found a guild (also requires holding ≥ GUILD.foundHold)
  guildTerritory: 25_000, // stake a region banner (48h)
  guildUpkeep: 10_000,   // extend the banner another 48h
} as const;
/** integrity restored per reinforce burn (cap 100 — delay, never immunity) */
export const REINFORCE_INTEGRITY = 25;

// ─── The gold Wheel (50g a spin; server-rolled) ────────────────────────────────
// Shared so the HUD's spin animation and the docs render the same segments the
// server actually rolls. EV ≈ 42.5g + 0.16 shards per 50g spin (a sink).
export interface GoldWheelSeg { p: number; gold: number; shards: number; label: string }
export const GOLD_WHEEL: GoldWheelSeg[] = [
  { p: 0.40, gold: 0,   shards: 0, label: "The Drift takes your coin." },
  { p: 0.25, gold: 25,  shards: 0, label: "A modest return: 25g." },
  { p: 0.15, gold: 75,  shards: 0, label: "The wheel favors you: 75g!" },
  { p: 0.10, gold: 150, shards: 0, label: "A fine spin: 150g!" },
  { p: 0.08, gold: 0,   shards: 2, label: "Two Drift Shards tumble out!" },
  { p: 0.02, gold: 500, shards: 0, label: "JACKPOT: 500 GOLD!" },
];

// ─── The Drift Wheel (gacha cosmetics — DRIFTS burns only) ─────────────────────
// Server-rolled. Pays cosmetics/shards, NEVER DRIFTS (no faucet). Duplicates
// convert to shards (`dupShards`). The docs render this table so it can't
// go stale. Tiers `aura`+ count as "rare" for the pity counter.
export interface DriftWheelSeg {
  p: number;
  kind: "shards" | "dye" | "eye" | "aura" | "pet" | "title" | "prestigeAura";
  amount?: number;     // shards
  dupShards?: number;  // consolation when already owned
  label: string;
  rare?: boolean;      // feeds/resets the pity counter
}
export const DRIFT_WHEEL: DriftWheelSeg[] = [
  { p: 0.30, kind: "shards", amount: 2, label: "Two Drift Shards tumble out." },
  { p: 0.22, kind: "dye", dupShards: 3, label: "A vial of cloak dye." },
  { p: 0.15, kind: "eye", dupShards: 3, label: "An eye glow, still warm." },
  { p: 0.12, kind: "shards", amount: 6, label: "Six Drift Shards!" },
  { p: 0.10, kind: "aura", dupShards: 6, label: "An aura unwinds from the wheel!", rare: true },
  { p: 0.06, kind: "pet", dupShards: 6, label: "Something small chose you.", rare: true },
  { p: 0.04, kind: "title", dupShards: 10, label: "The wheel names you.", rare: true },
  { p: 0.01, kind: "prestigeAura", dupShards: 15, label: "A DRIFT-TOUCHED aura!", rare: true },
];
/** forced-rare after this many dry spins (rolls re-normalize over rare tiers) */
export const DRIFT_WHEEL_PITY = 12;
/** the wheel-exclusive title */
export const WHEEL_TITLE = "Wheelturned";

// ─── Guilds + territory ─────────────────────────────────────────────────────────
export const GUILD = {
  foundHold: 25_000,    // DRIFTS the founder's wallet must HOLD to found
  maxMembers: 20,
  nameMax: 20,
  tagMax: 4,
  territoryMs: 48 * 3_600_000,  // one stake/upkeep buys 48h
  territoryMaxMs: 7 * 24 * 3_600_000, // banner can be paid at most 7 days ahead
  /** member perks while the banner stands, inside the held region */
  richStrikeBonus: 0.02,
  caravanWeightBonus: 0.1,
  /** regions a guild banner can hold (never the town) */
  regions: ["Palewater", "The Ashen Flats", "Hollowmere Reach", "The Bonefields"],
} as const;

// ─── The Exchange (gold ↔ DRIFTS at the Vault) ─────────────────────────────────
// Anchor: the live economy prices 100 DRIFTS ≈ 1 gold (spin 5,000◆ vs 50g,
// claim 25,000◆ vs 250g). Fixed rates ±10% around it; payouts ONLY from the
// escrow pool (what buyers paid in) — never minted, never a house faucet.
export const EXCHANGE = {
  buyRate: 110,   // DRIFTS paid per 1 gold bought
  sellRate: 20,   // DRIFTS received per 1 gold sold (wide spread vs buy:
                  // conserves the escrow pool, blocks cheap round-trip drain)
  buyCapPerDay: 2_000,  // gold buyable per wallet per UTC day
  /** gold sellable per wallet per UTC day, by holder tier key ("" = base).
   *  Post-launch throttle: flat 100g for everyone so DRIFTS doesn't drain out
   *  of escrow fast right after launch. Restore the tiered caps
   *  (200/500/1500/5000) once the pool is healthy. */
  sellCapPerDay: { "": 100, keeper: 100, warden: 100, driftlord: 100 } as Record<string, number>,
  minTrade: 10,   // gold per transaction, both directions
} as const;

// ─── Pit DRIFTS wagers ─────────────────────────────────────────────────────────
// Real on-chain stakes (the realm never mints, so the pot is held in escrow):
// both fighters transfer their stake into escrow, the winner is paid 90% out of
// it, and the house keeps 10% of the TOTAL pot. Gold wagers are unchanged.
export const DUEL_DRIFTS = {
  min: 20_000,      // minimum stake, DRIFTS
  max: 1_000_000,   // bound the escrow's exposure per duel
  feePct: 0.10,     // house cut of the total pot (winner takes the other 90%)
} as const;

// ─── The relic market (P2P, Drift-touched cosmetics only) ──────────────────────
// Only server-authoritative prestige cosmetics trade (gold cosmetics are
// client-trusted, so untradable). Titles are soul-bound. The fee leg BURNS.
export const RELIC_MARKET = {
  minPrice: 1_000,        // DRIFTS
  maxPrice: 10_000_000,
  feePct: 0.05,           // burned forever on every sale
  maxListings: 4,         // per seller
} as const;
/** short display form: 5_000 → "5k" (pixel HUD space is tight) */
export const burnAmt = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n));

// ─── Holding tiers ──────────────────────────────────────────────────────────────
// What a wallet's DRIFTS balance is worth INSIDE the realm. Server-enforced on
// every rail listed; the HUD, docs and codex render from this same table so the
// promises can't go stale. Order matters: highest tier first.
export interface HolderTier {
  key: string;
  label: string;
  min: number;         // DRIFTS held (linked wallet) to qualify
  claimSlots: number;  // total land claims held at once (base 3)
  marketSlots: number; // total market listings at once (base 6)
  vaultFee: number;    // vault withdrawal fee (base 2%)
  richStrikeP: number; // chance a gather swing pays double (base 10%)
  caravanWeight: number; // caravan payout shares weigh this much per kill
}
export const BASE_PERKS: HolderTier = {
  key: "", label: "", min: 0,
  claimSlots: 3, marketSlots: 6, vaultFee: VAULT_FEE,
  richStrikeP: 0.1, caravanWeight: 1,
};
export const HOLDER_TIERS: HolderTier[] = [
  { key: "driftlord", label: "Drift Lord", min: 1_000_000,
    claimSlots: 6, marketSlots: 12, vaultFee: 0, richStrikeP: 0.2, caravanWeight: 1.5 },
  { key: "warden", label: "Warden", min: 100_000,
    claimSlots: 5, marketSlots: 10, vaultFee: 0.005, richStrikeP: 0.15, caravanWeight: 1.25 },
  { key: "keeper", label: "Keeper", min: 10_000,
    claimSlots: 4, marketSlots: 8, vaultFee: 0.01, richStrikeP: 0.12, caravanWeight: 1.1 },
];
/** the perks a balance earns (base perks when below every tier) */
export function holderPerks(balance: number): HolderTier {
  return HOLDER_TIERS.find((t) => balance >= t.min) ?? BASE_PERKS;
}
export const DUEL_MIN_WAGER = 0;
export const DUEL_MAX_WAGER = 5000;

export type ResourceKind = "tree" | "rock" | "fish";

export type SkillKey = "woodcutting" | "mining" | "fishing" | "combat";

export type ItemKey =
  | "wood"
  | "stone"
  | "fish"
  | "cooked_fish"
  | "driftshard"
  | "hide";

/** items shown in the inventory bar, in order */
export const INVENTORY_ORDER: ItemKey[] = [
  "wood",
  "stone",
  "fish",
  "cooked_fish",
  "driftshard",
  "hide",
];

export interface ResourceNode {
  id: number;
  kind: ResourceKind;
  gx: number;
  gy: number;
  /** charges left before depletion */
  amount: number;
  maxAmount: number;
  /** when > 0, node is depleted and counting down to regrow elsewhere (ms) */
  regrowIn: number;
  /** swaying / shimmer phase for render */
  phase: number;
}

export interface Cell {
  x: number;
  y: number;
}

export const RESOURCE_META: Record<
  ResourceKind,
  { skill: SkillKey; item: ItemKey; label: string; actionMs: number; xp: number }
> = {
  tree: { skill: "woodcutting", item: "wood", label: "Chop", actionMs: 1400, xp: 12 },
  rock: { skill: "mining", item: "stone", label: "Mine", actionMs: 1800, xp: 16 },
  fish: { skill: "fishing", item: "fish", label: "Fish", actionMs: 2000, xp: 20 },
};

export const ITEM_META: Record<
  ItemKey,
  { label: string; color: string; icon: string; heal?: number; sellValue: number }
> = {
  wood: { label: "Driftwood", color: "#9a6b3f", icon: "🪵", sellValue: 2 },
  stone: { label: "Pale Stone", color: "#9aa0b0", icon: "🪨", sellValue: 3 },
  fish: { label: "Raw Hollowfish", color: "#5fb0c9", icon: "🐟", sellValue: 3 },
  cooked_fish: {
    label: "Cooked Hollowfish",
    color: "#e9a86b",
    icon: "🍢",
    heal: 18,
    sellValue: 6,
  },
  driftshard: { label: "Drift Shard", color: "#a855f7", icon: "🔮", sellValue: 15 },
  hide: { label: "Beast Hide", color: "#8a6b52", icon: "🟫", sellValue: 8 },
};

// skill tints from the design system (--skill-* tokens)
export const SKILL_META: Record<SkillKey, { label: string; color: string }> = {
  woodcutting: { label: "Woodcutting", color: "#f59e0b" },
  mining: { label: "Mining", color: "#e7c873" },
  fishing: { label: "Fishing", color: "#4a7fa0" },
  combat: { label: "Combat", color: "#dc2626" },
};

// ---- crafting & equipment ---------------------------------------------------

export type EquipSlot = "weapon" | "tool" | "ward";

export interface EquipmentItem {
  id: string;
  label: string;
  slot: EquipSlot;
  icon: string;
  tier: number;
  /** flat bonus: weapon = +damage, tool = gather speed %, ward = damage reduction */
  power: number;
  flavor: string;
  /** reinforcement level from the Forge enchant rail (0..ENCHANT_MAX) */
  ench?: number;
}

/** Forge enchanting: reinforce equipped gear for gold (a flat +1 power each, capped) */
export const ENCHANT_MAX = 5;
export function enchantCost(ench: number): number { return 100 + ench * 75; }

export interface Recipe {
  result: EquipmentItem;
  cost: Partial<Record<ItemKey, number>>;
  /** minimum combat level to craft (gear gating) */
  reqCombat?: number;
}

export const RECIPES: Recipe[] = [
  {
    result: {
      id: "bone_blade",
      label: "Bone Blade",
      slot: "weapon",
      icon: "🗡️",
      tier: 1,
      power: 3,
      flavor: "+3 damage",
    },
    cost: { wood: 6, stone: 4 },
  },
  {
    result: {
      id: "shard_saber",
      label: "Shard Saber",
      slot: "weapon",
      icon: "⚔️",
      tier: 2,
      power: 7,
      flavor: "+7 damage",
    },
    cost: { wood: 10, driftshard: 3, hide: 2 },
    reqCombat: 3,
  },
  {
    result: {
      id: "keen_tools",
      label: "Keen Tools",
      slot: "tool",
      icon: "🪚",
      tier: 1,
      power: 25,
      flavor: "+25% gather speed",
    },
    cost: { wood: 8, stone: 8 },
  },
  {
    result: {
      id: "shardtooth_tools",
      label: "Shardtooth Tools",
      slot: "tool",
      icon: "⚒️",
      tier: 2,
      power: 45,
      flavor: "+45% gather speed",
    },
    cost: { stone: 12, driftshard: 4 },
  },
  {
    result: {
      id: "hide_ward",
      label: "Hide Ward",
      slot: "ward",
      icon: "🛡️",
      tier: 1,
      power: 2,
      flavor: "-2 damage taken",
    },
    cost: { hide: 3, wood: 4 },
  },
  {
    result: {
      id: "drift_sigil",
      label: "Drift Sigil",
      slot: "ward",
      icon: "🜂",
      tier: 2,
      power: 4,
      flavor: "-4 damage taken",
    },
    cost: { driftshard: 6, hide: 4, stone: 6 },
    reqCombat: 4,
  },
];

// ---- daily quests -----------------------------------------------------------

/** events the quest system listens for */
export type QuestEvent =
  | { type: "gather"; item: ItemKey }
  | { type: "kill" }
  | { type: "cook"; qty: number };

export interface QuestDef {
  id: string;
  label: string;
  icon: string;
  target: number;
  goldReward: number;
  xpReward: { skill: SkillKey; xp: number };
  /** does a given event advance this quest, and by how much? */
  matches: (e: QuestEvent) => number;
}

export const QUEST_POOL: QuestDef[] = [
  {
    id: "chop_wood",
    label: "Fell 10 Driftwood",
    icon: "🪓",
    target: 10,
    goldReward: 30,
    xpReward: { skill: "woodcutting", xp: 40 },
    matches: (e) => (e.type === "gather" && e.item === "wood" ? 1 : 0),
  },
  {
    id: "mine_stone",
    label: "Mine 8 Pale Stone",
    icon: "⛏️",
    target: 8,
    goldReward: 35,
    xpReward: { skill: "mining", xp: 40 },
    matches: (e) => (e.type === "gather" && e.item === "stone" ? 1 : 0),
  },
  {
    id: "catch_fish",
    label: "Catch 8 Hollowfish",
    icon: "🎣",
    target: 8,
    goldReward: 35,
    xpReward: { skill: "fishing", xp: 40 },
    matches: (e) => (e.type === "gather" && e.item === "fish" ? 1 : 0),
  },
  {
    id: "slay_beasts",
    label: "Slay 3 Drift Beasts",
    icon: "⚔️",
    target: 3,
    goldReward: 60,
    xpReward: { skill: "combat", xp: 60 },
    matches: (e) => (e.type === "kill" ? 1 : 0),
  },
  {
    id: "cook_fish",
    label: "Cook 5 Hollowfish",
    icon: "🔥",
    target: 5,
    goldReward: 25,
    xpReward: { skill: "fishing", xp: 30 },
    matches: (e) => (e.type === "cook" ? e.qty : 0),
  },
];

/** Pick the 3 daily quest ids, deterministic for a given UTC day index
 *  (Math.floor(Date.now()/86_400_000)). Shared truth: the client builds the
 *  offline board from this and the server rolls the authoritative board from it,
 *  so the same day yields the same three quests everywhere. */
export function rollDailyQuestIds(day: number): string[] {
  const ids: string[] = [];
  const pool = QUEST_POOL.map((q) => q.id);
  let seed = day;
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    // simple LCG so the same day always rolls the same board
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const idx = seed % pool.length;
    ids.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return ids;
}

// ---- frontier bounties ------------------------------------------------------
// Regional work orders posted at the waystation boards. Distinct from the daily
// quests: sourced PER REGION, refreshed on a clock, accepted then turned in at
// the board. Progress is region-scoped (the kill/gather must happen in the
// board's region). Reward is gold + bonus driftshards — and gold feeds DRIFTS
// through the Exchange, so the boards are an "earn" rail without minting tokens.

/** the four frontier quadrants that post bounties (the heartland does not) */
export const BOUNTY_REGIONS = [
  "Palewater",
  "The Ashen Flats",
  "Hollowmere Reach",
  "The Bonefields",
] as const;
export type BountyRegion = (typeof BOUNTY_REGIONS)[number];

/** boards re-post every 30 min; at most 3 contracts active at once */
export const BOUNTY_REFRESH_MS = 30 * 60_000;
export const MAX_ACTIVE_BOUNTIES = 3;
export function bountyEpoch(now = Date.now()): number {
  return Math.floor(now / BOUNTY_REFRESH_MS);
}

export type BountyKind = "kill" | "gather";
export interface BountyTemplate {
  id: string;
  kind: BountyKind;
  item?: ItemKey; // gather target
  verb: string;
  noun: string;
  icon: string;
  target: number;
  gold: number;
  /** bonus driftshards paid on top of the gold */
  shards: number;
}
export const BOUNTY_TEMPLATES: BountyTemplate[] = [
  { id: "cull",  kind: "kill",                       verb: "Cull",    noun: "Drift Beasts", icon: "⚔️", target: 6,  gold: 90,  shards: 2 },
  { id: "hunt",  kind: "kill",                       verb: "Hunt",    noun: "frontier beasts", icon: "🏹", target: 12, gold: 130, shards: 3 },
  { id: "wood",  kind: "gather", item: "wood",       verb: "Harvest", noun: "Driftwood",    icon: "🪓", target: 14, gold: 70,  shards: 1 },
  { id: "stone", kind: "gather", item: "stone",      verb: "Quarry",  noun: "Pale Stone",   icon: "⛏️", target: 12, gold: 75,  shards: 1 },
  { id: "fish",  kind: "gather", item: "fish",       verb: "Land",    noun: "Hollowfish",   icon: "🎣", target: 12, gold: 70,  shards: 1 },
];
export function bountyTemplate(tid: string): BountyTemplate | undefined {
  return BOUNTY_TEMPLATES.find((t) => t.id === tid);
}
export function bountyLabel(tid: string): string {
  const t = bountyTemplate(tid);
  return t ? `${t.verb} ${t.target} ${t.noun}` : tid;
}

/** the three template ids a region's board posts this epoch (deterministic, so
 *  the client renders the same board the server will accept against) */
export function rollBountyOffers(region: BountyRegion, epoch: number): string[] {
  const ri = BOUNTY_REGIONS.indexOf(region);
  let seed = (((epoch * 2654435761) >>> 0) ^ ((ri + 1) * 40503)) >>> 0;
  const pool = BOUNTY_TEMPLATES.map((t) => t.id);
  const out: string[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const idx = seed % pool.length;
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

/** an accepted contract (per-player; lives until claimed or abandoned) */
export interface BountyContract {
  tid: string;
  region: BountyRegion;
  progress: number;
}
/** how much an event in `region` advances a contract (0 = no match) */
export function bountyMatch(c: BountyContract, region: string, e: QuestEvent): number {
  if (region !== c.region) return 0;
  const t = bountyTemplate(c.tid);
  if (!t) return 0;
  if (t.kind === "kill" && e.type === "kill") return 1;
  if (t.kind === "gather" && e.type === "gather" && e.item === t.item) return 1;
  return 0;
}
/** clamp/validate a stored contract list (used on both ends) */
export function sanitizeBounties(raw: unknown): BountyContract[] {
  if (!Array.isArray(raw)) return [];
  const out: BountyContract[] = [];
  for (const r of raw as BountyContract[]) {
    const t = bountyTemplate(r?.tid);
    if (!t) continue;
    if (!BOUNTY_REGIONS.includes(r.region)) continue;
    out.push({ tid: r.tid, region: r.region, progress: Math.max(0, Math.min(t.target, r.progress | 0)) });
    if (out.length >= MAX_ACTIVE_BOUNTIES) break;
  }
  return out;
}

// ---- the Roaming Trader (a moving frontier vendor) --------------------------
// A peddler who walks the waystation circuit. While parked, an adjacent player
// can BUY a rotating stock with gold, or SELL loot back at a premium over the
// town vendor rate (the "earn" edge). Server-authoritative (online only); the
// stock is deterministic per (epoch, stop) so the client renders the same shelf.
export interface TraderStockItem { item: ItemKey; price: number }
export const TRADER_STOCK_POOL: TraderStockItem[] = [
  { item: "cooked_fish", price: 12 },
  { item: "hide", price: 16 },
  { item: "driftshard", price: 28 },
  { item: "wood", price: 6 },
  { item: "stone", price: 7 },
  { item: "fish", price: 8 },
];
/** the trader pays this multiple of ITEM_META.sellValue on a buyback (a
 *  convenience premium over the town vendor, tuned to stay in the economy band) */
export const TRADER_BUYBACK_MULT = 1.4;
export const TRADER_RANGE = 2.5; // tiles within which you can deal
/** the 4 items the trader stocks at a waystation this epoch (deterministic) */
export function rollTraderStock(epoch: number, stop: number): TraderStockItem[] {
  let seed = (((epoch * 374761393) >>> 0) ^ ((stop + 1) * 668265263)) >>> 0;
  const pool = [...TRADER_STOCK_POOL];
  const out: TraderStockItem[] = [];
  for (let i = 0; i < 4 && pool.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const idx = seed % pool.length;
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}
/** what the trader pays for one unit of `item` (0 = it won't buy that) */
export function traderBuyback(item: ItemKey): number {
  const v = ITEM_META[item]?.sellValue ?? 0;
  return v > 0 ? Math.round(v * TRADER_BUYBACK_MULT) : 0;
}

// ---- the Frontier Outpost: reputation + supply contracts --------------------
// Deliver supplies to the Quartermaster for gold + reputation. Rep tiers unlock
// the quartermaster's wares (gold). Server-authoritative rep; contracts roll
// deterministically per epoch (client renders what the server will accept).
export const OUTPOST_TIERS = [
  { name: "Drifter", rep: 0 },
  { name: "Recruit", rep: 100 },
  { name: "Regular", rep: 350 },
  { name: "Veteran", rep: 800 },
] as const;
export function outpostTier(rep: number): number {
  let t = 0;
  for (let i = 0; i < OUTPOST_TIERS.length; i++) if (rep >= OUTPOST_TIERS[i].rep) t = i;
  return t;
}
export function outpostTierName(rep: number): string { return OUTPOST_TIERS[outpostTier(rep)].name; }

export interface SupplyContract { id: string; item: ItemKey; qty: number; gold: number; rep: number }
export const SUPPLY_CONTRACTS: SupplyContract[] = [
  { id: "wood",   item: "wood",        qty: 15, gold: 80,  rep: 15 },
  { id: "stone",  item: "stone",       qty: 12, gold: 85,  rep: 15 },
  { id: "fish",   item: "fish",        qty: 12, gold: 80,  rep: 14 },
  { id: "cooked", item: "cooked_fish", qty: 8,  gold: 110, rep: 20 },
  { id: "hide",   item: "hide",        qty: 8,  gold: 120, rep: 22 },
  { id: "shard",  item: "driftshard",  qty: 5,  gold: 150, rep: 30 },
];
export function supplyContract(id: string): SupplyContract | undefined { return SUPPLY_CONTRACTS.find((c) => c.id === id); }
/** the 3 supply contracts the Quartermaster posts this epoch (deterministic) */
export function rollSupplyContracts(epoch: number): string[] {
  let seed = ((epoch * 2246822519) >>> 0) ^ 0x9e3779b9;
  const pool = SUPPLY_CONTRACTS.map((c) => c.id);
  const out: string[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const idx = seed % pool.length;
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}
/** the Quartermaster's gold wares, each gated behind a rep tier */
export interface QuartermasterItem { item: ItemKey; price: number; tier: number }
export const QUARTERMASTER_STOCK: QuartermasterItem[] = [
  { item: "cooked_fish", price: 10, tier: 0 },
  { item: "hide",        price: 13, tier: 1 },
  { item: "driftshard",  price: 22, tier: 2 },
];

// ---- seasons ----------------------------------------------------------------

/** evocative season names, cycled by season number (voice: place-like, decaying) */
export const SEASON_NAMES = [
  "Ashfall",
  "Hollowmere",
  "Gloamreach",
  "Palewake",
  "Vesselrot",
  "Embershade",
  "Duskharrow",
  "Mournveil",
] as const;

export function seasonName(season: number): string {
  return SEASON_NAMES[(season - 1) % SEASON_NAMES.length];
}

// ─── Phase 6: server-side gold ledger ─────────────────────────────────────────
// Client-trusted gold events (mob loot, veins, chests, quest rewards, vendor
// sells, shop spends) flow to the server as one "goldDelta" intent tagged with
// a reason. The server applies per-reason caps and keeps the authoritative
// balance; everything the server adjudicates itself (wheel, vault, market,
// claims, duels, donations, payouts) never touches this rail.
export type GoldReason =
  | "mob"      // beast/raider/colossus kill loot
  | "vein"     // a Mine vein strike
  | "chest"    // the Husk Den war-chest
  | "losttomb" // a Drowned Field lost tombstone
  | "salvage"  // searching a frontier wreck (wagon/hut/old campfire)
  | "quest"    // daily quest reward
  | "sell"     // vendor (satchel) sale
  | "death"    // negative: half your purse drops into your tombstone
  | "tomb"     // reclaiming your tombstone (capped at what "death" recorded)
  | "shop";    // negative: drinks, dyes, brews, obelisk rites (gold paths)

// Same rail for items (the inventory ledger). Positive reasons are capped
// server-side; negative ones floor at zero (spends can't mint). Cooking and
// crafting go through their own server-validated intents instead.
export type ItemReason =
  | "mob"   // beast drops: shards + hides (colossus pays 5 shards)
  | "chest" // the Husk Den war-chest shards
  | "eat"   // negative: food leaves the satchel
  | "brew"  // negative: Mirewife brew materials
  | "salvage" // a frontier wreck gave up scrap (shards/hide/wood/stone)
  | "sell"; // negative: vendor (satchel) sale

// ─── Phase 5: Solana wallet link (devnet) ─────────────────────────────────────
// The exact text a wallet signs to bind itself to a guest token. Client builds
// it for signMessage; the server rebuilds it verbatim to verify the signature.
export function walletLinkMessage(address: string, nonce: string): string {
  return [
    "Naevyr (beta)",
    "Link this wallet to your wanderer.",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

/** the canonical text a wallet signs to prove itself at the token entry gate
 *  (same rail as the link message; distinct wording so the wallet popup says
 *  what is actually being authorized) */
export function gateMessage(address: string, nonce: string): string {
  return [
    "Naevyr (beta)",
    "Prove this wallet to pass the gate.",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}
