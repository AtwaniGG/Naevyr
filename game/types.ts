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

// ─── Drift-touched cosmetics (Phase 6): DRIFTS burns only, never gold ─────────
// One shared catalog so the Dyeworks panel, the server's burn validation and
// the codex all read the same truth. `action` keys into BURN_COSTS.
export type PrestigeKind = "dye" | "aura" | "title";
export interface PrestigeEntry {
  kind: PrestigeKind;
  label: string;
  desc: string;
  action: "prestigeDye" | "prestigeAura" | "prestigeTitle";
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
  sellRate: 90,   // DRIFTS received per 1 gold sold
  buyCapPerDay: 2_000,  // gold buyable per wallet per UTC day
  /** gold sellable per wallet per UTC day, by holder tier key ("" = base) */
  sellCapPerDay: { "": 200, keeper: 500, warden: 1_500, driftlord: 5_000 } as Record<string, number>,
  minTrade: 10,   // gold per transaction, both directions
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
