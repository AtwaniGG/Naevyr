// Shared game types for Driftlands.

export type TileType = "grass" | "dirt" | "stone" | "water" | "corrupt";

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
