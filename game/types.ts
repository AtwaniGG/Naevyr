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

// ─── the Waystation catalogs ───────────────────────────────────────────────────

export type AuraKey =
  | "driftmote" | "emberwake" | "goldhalo"
  // Drift-touched (prestige): burned into being, never bought with gold
  | "ashen_crown" | "corruption_halo" | "ember_cinder" | "bonewisp"
  // season-exclusive relic: only the battle pass grants it, never sold (see
  // BATTLE_PASS_SEASONS + the passOnly flag on its PRESTIGE_CATALOG entry)
  | "tarnished_chalice";
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
  // driftsOnly keeps it out of the gold-aura buy list. Rendered as a baked DS
  // prestige aura (PRESTIGE_AURAS.tarnished_chalice in sprites.ts); `color` is
  // only the legacy-mote fallback (never hit while the port is registered).
  tarnished_chalice: { label: "The Tarnished Chalice", price: 0, color: "#e7c873", driftsOnly: true },
};

// ─── Premium avatars: whole other bodies, DRIFTS burns only ───────────────────
// The art lives in game/render/sprites.ts (DS avatars.js port); this table is
// the shared truth for the HUD shop, the server's identity validation and the
// codex. Each kind has two cosmetic channels; options are locked-ramp names.
export type AvatarKind = "ashbound" | "mireborn" | "bonecaller" | "veilborn";
export const AVATAR_CHANNELS: Record<AvatarKind, Record<string, readonly string[]>> = {
  ashbound:   { seam:   ["ember", "gold", "blood", "drift", "bone"],  wrap:   ["stone", "dirt", "blood", "bone", "drift"] },
  mireborn:   { flame:  ["ember", "drift", "gold", "water", "blood"], shawl:  ["grass", "dirt", "stone", "water", "bone"] },
  bonecaller: { socket: ["drift", "ember", "gold", "blood", "water"], mantle: ["bone", "stone", "gold", "dirt", "blood"] },
  veilborn:   { veil:   ["stone", "drift", "blood", "water", "bone"], mote:   ["drift", "ember", "gold", "water", "blood"] },
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
  /** season-exclusive relics: ownership-gated + relic-tradeable like any
   *  prestige aura, but NEVER sold at the Dyeworks or rolled on a wheel — only
   *  a battle pass grants them. Filtered out of every buy/roll surface. */
  passOnly?: boolean;
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
  // Season 1 ("Ashfall") capstone relic. passOnly: only the pass grants it; it
  // can never be bought at the Dyeworks or rolled on a wheel. After the season
  // closes it survives only on the Relic stall, second-hand.
  tarnished_chalice: {
    kind: "aura", label: "The Tarnished Chalice", action: "prestigeAura", passOnly: true,
    desc: "a prize from a contest the world forgot it ever held. the gold still glints under the rot",
  },
  // Season 1 free-track cloak (tier 25). passOnly: pass-granted only, never sold,
  // but relic-tradeable + ownership-gated like any Drift-touched dye.
  ashfall: {
    kind: "dye", label: "Ashfall Cloak", action: "prestigeDye", passOnly: true,
    desc: "ash-grey weave banded in old gold, the hem already going to drift",
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

export type PropKey = "campfire" | "banner" | "driftlamp" | "statue";
export const PROP_CATALOG: Record<PropKey, { label: string; price: number }> = {
  campfire:  { label: "Campfire", price: 100 },
  banner:    { label: "Claim Banner", price: 150 },
  driftlamp: { label: "Drift Lamp", price: 200 },
  statue:    { label: "Wanderer Statue", price: 300 },
};

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
  battlePass: 40_000,    // unlock the season's Premium track (cosmetics + gold/shards)
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
}

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

// ─── The Drift Ledger: the seasonal battle pass ───────────────────────────────
// A fifth server ledger (mirrors the daily-quest ledger): season XP from weekly
// challenges + play events fills 50 tiers; a free track for everyone and a
// Premium track unlocked by burning DRIFTS (BURN_COSTS.battlePass). Premium pays
// exclusive cosmetics + gold/shards, NEVER DRIFTS (utility, not investment).
// Shared truth: the server adjudicates, the HUD renders, the verify suite asserts.

/** real-world season clock — deterministic, no DB row (like rollDailyQuestIds).
 *  Env overrides let the verify suite compress a "season" to seconds. */
export const BP_EPOCH_MS = Number(
  (typeof process !== "undefined" && process.env?.BATTLEPASS_EPOCH_MS) || Date.UTC(2026, 5, 8),
); // launch anchor (2026-06-08, Mon) → Season 1 = Ashfall; boundaries on the period grid
export const BP_PERIOD_MS = Number(
  (typeof process !== "undefined" && process.env?.BATTLEPASS_PERIOD_MS) || 28 * 86_400_000,
); // 4 weeks
export const BP_TIERS = 50;
export const BP_XP_PER_TIER = 1000; // flat → 50,000 XP to max the track
export const BP_WEEKS = 4;
export const BP_CHALLENGES_PER_WEEK = 6;

/** the current real-time season number (1-based) and ms left in it */
export function passSeasonNow(now = Date.now()): number {
  return Math.floor((now - BP_EPOCH_MS) / BP_PERIOD_MS) + 1;
}
export function passEndsIn(now = Date.now()): number {
  const elapsed = (now - BP_EPOCH_MS) % BP_PERIOD_MS;
  return BP_PERIOD_MS - elapsed;
}
/** which challenge week (0-based) we're in within the current season */
export function passWeekNow(now = Date.now()): number {
  const elapsed = (now - BP_EPOCH_MS) % BP_PERIOD_MS;
  return Math.min(BP_WEEKS - 1, Math.floor(elapsed / (BP_PERIOD_MS / BP_WEEKS)));
}
export function passTierForXp(xp: number): number {
  return Math.min(BP_TIERS, Math.floor(Math.max(0, xp) / BP_XP_PER_TIER));
}
export function passXpInTier(xp: number): number {
  return Math.max(0, xp) % BP_XP_PER_TIER;
}

/** the pass listens for the same world events the quests do, plus the big
 *  server-adjudicated milestones (caravan/night/boss) and a quest-claim tick. */
export type PassEvent =
  | QuestEvent
  | { type: "caravan" }
  | { type: "night" }
  | { type: "boss" }
  | { type: "questClaim" };

export interface PassChallengeDef {
  id: string;
  label: string;
  icon: string;
  target: number;
  passXp: number;
  matches: (e: PassEvent) => number;
}

/** weekly challenge pool — like QUEST_POOL but pays season XP, not gold.
 *  rollWeeklyChallenges picks BP_CHALLENGES_PER_WEEK deterministically. */
export const BP_CHALLENGE_POOL: PassChallengeDef[] = [
  { id: "bp_chop", label: "Fell 40 Driftwood", icon: "🪓", target: 40, passXp: 1500,
    matches: (e) => (e.type === "gather" && e.item === "wood" ? 1 : 0) },
  { id: "bp_mine", label: "Mine 35 Pale Stone", icon: "⛏️", target: 35, passXp: 1500,
    matches: (e) => (e.type === "gather" && e.item === "stone" ? 1 : 0) },
  { id: "bp_fish", label: "Land 35 Hollowfish", icon: "🎣", target: 35, passXp: 1500,
    matches: (e) => (e.type === "gather" && e.item === "fish" ? 1 : 0) },
  { id: "bp_cook", label: "Cook 25 Hollowfish", icon: "🔥", target: 25, passXp: 1800,
    matches: (e) => (e.type === "cook" ? e.qty : 0) },
  { id: "bp_slay", label: "Slay 20 Drift Beasts", icon: "⚔️", target: 20, passXp: 2000,
    matches: (e) => (e.type === "kill" ? 1 : 0) },
  { id: "bp_caravan", label: "Escort 3 Caravans home", icon: "🐂", target: 3, passXp: 2500,
    matches: (e) => (e.type === "caravan" ? 1 : 0) },
  { id: "bp_boss", label: "Bring down 2 Colossi", icon: "💀", target: 2, passXp: 2500,
    matches: (e) => (e.type === "boss" ? 1 : 0) },
  { id: "bp_night", label: "Survive the Long Night", icon: "🌑", target: 1, passXp: 2500,
    matches: (e) => (e.type === "night" ? 1 : 0) },
];

/** deterministic weekly draw: the same season+week rolls the same challenges
 *  everywhere (server authoritative, client can mirror). LCG, like daily quests. */
export function rollWeeklyChallenges(season: number, week: number): string[] {
  const ids: string[] = [];
  const pool = BP_CHALLENGE_POOL.map((c) => c.id);
  let seed = (season * 1000 + week) >>> 0;
  for (let i = 0; i < BP_CHALLENGES_PER_WEEK && pool.length > 0; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const idx = seed % pool.length;
    ids.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return ids;
}

/** a single tier's payout on either track */
export type PassReward =
  | { kind: "gold"; amount: number }
  | { kind: "shards"; amount: number }
  | { kind: "cosmetic"; cosmetic: string; label: string };

export interface PassTier {
  free?: PassReward;
  premium?: PassReward;
}

export interface PassSeasonDef {
  name: string;
  tiers: PassTier[]; // length BP_TIERS; index 0 = tier 1
}

/** Build a generic tier table for any season we haven't hand-authored: gold and
 *  shards scale up the track, with a richer Premium node every 5th tier. Keeps
 *  unconfigured future seasons valid without bespoke art/copy. */
function genericPassTiers(): PassTier[] {
  const tiers: PassTier[] = [];
  for (let i = 0; i < BP_TIERS; i++) {
    const t = i + 1;
    const gold = 50 + Math.round((250 * i) / (BP_TIERS - 1)); // 50 → 300
    const tier: PassTier = { free: { kind: "gold", amount: gold } };
    // free shards every 5th tier instead of gold
    if (t % 5 === 0) tier.free = { kind: "shards", amount: 3 + Math.floor(t / 10) };
    // premium: richer gold most tiers, shards on the 5s, a milestone every 10th
    tier.premium = { kind: "gold", amount: gold * 2 };
    if (t % 5 === 0) tier.premium = { kind: "shards", amount: 6 + Math.floor(t / 10) };
    tiers.push(tier);
  }
  return tiers;
}

/** Season 1 — "Ashfall". All cosmetic rewards are PRESTIGE_CATALOG keys (granted
 *  server-side via sim.prestige, so they're owned, render, and trade like any
 *  Drift-touched cosmetic). Cosmetics ride the Premium track; the free track is
 *  a steady gold/shard drip with a beefy shard finale. */
function ashfallTiers(): PassTier[] {
  const tiers = genericPassTiers();
  // free-track finales — the season cloak at the halfway mark, gold at the top
  tiers[24].free = { kind: "cosmetic", cosmetic: "ashfall", label: "Ashfall Cloak" };
  tiers[49].free = { kind: "gold", amount: 1000 };
  // premium cosmetic milestones (existing prestige auras — a 25k◆-each bundle)
  tiers[14].premium = { kind: "cosmetic", cosmetic: "ashen_crown", label: "Ashen Crown" };
  tiers[29].premium = { kind: "cosmetic", cosmetic: "ember_cinder", label: "Ember Cinder" };
  tiers[39].premium = { kind: "cosmetic", cosmetic: "corruption_halo", label: "Corruption Halo" };
  // the season-exclusive capstone relic — never sold, never rolled
  tiers[49].premium = { kind: "cosmetic", cosmetic: "tarnished_chalice", label: "The Tarnished Chalice" };
  return tiers;
}

export const BATTLE_PASS_SEASONS: Record<number, PassSeasonDef> = {
  1: { name: "Ashfall", tiers: ashfallTiers() },
};

/** the season's table, falling back to a generic one named off SEASON_NAMES */
export function passSeasonDef(season: number): PassSeasonDef {
  return (
    BATTLE_PASS_SEASONS[season] ?? {
      name: seasonName(season),
      tiers: genericPassTiers(),
    }
  );
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
