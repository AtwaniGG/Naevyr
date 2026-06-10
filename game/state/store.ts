import { create } from "zustand";
import {
  EquipmentItem,
  EquipSlot,
  ItemKey,
  QuestDef,
  QuestEvent,
  SkillKey,
  INVENTORY_ORDER,
  QUEST_POOL,
  SKILL_META,
} from "@/game/types";
import { DyeKey, EyeKey } from "@/game/render/sprites";
import { play } from "@/game/audio/sound";

// Zustand holds only HUD-facing state. The live world/player simulation lives
// in the Game instance (mutable, per-frame) and pushes updates here on events.

export interface SkillState {
  xp: number;
  level: number;
}

export interface LogLine {
  id: number;
  text: string;
  color?: string;
}

export interface Vitals {
  hp: number;
  maxHp: number;
}

export interface QuestState {
  def: QuestDef;
  progress: number;
  claimed: boolean;
}

export interface Cosmetics {
  name: string;
  dye: DyeKey;
  eye: EyeKey;
}

/** lightweight world snapshot pushed by the engine ~2×/sec for the minimap */
export interface MinimapSnap {
  w: number;
  h: number;
  tiles: number[]; // TILE_CODES indices
  nodes: { x: number; y: number }[];
  players: { x: number; y: number; self: boolean }[];
  mobs: { x: number; y: number; boss: boolean }[];
  /** your unclaimed grave, if any */
  tomb: { x: number; y: number } | null;
}

/** lifetime tallies (persisted) — feeds the stats panel + future titles */
export interface LifetimeStats {
  deaths: number;
  gathered: number;
  crits: number;
  goldEarned: number;
  driftfalls: number;
}

/** who else shares the Drift right now (display only) */
export interface RosterEntry {
  name: string;
  title: string;
  self: boolean;
}

/** Earned title, best first. Derived — never stored. */
export function currentTitle(s: {
  skills: Record<SkillKey, SkillState>;
  kills: number;
  stats?: LifetimeStats;
}): string {
  if (s.kills >= 50) return "Beastbane";
  if (s.stats && s.stats.goldEarned >= 1000) return "Gilded";
  if (s.stats && s.stats.crits >= 50) return "Deathblow";
  if (s.skills.combat.level >= 5) return "Warbrand";
  if (s.stats && s.stats.gathered >= 500) return "Provider";
  if (s.skills.mining.level >= 5) return "Stonebreaker";
  if (s.skills.woodcutting.level >= 5) return "Hewer";
  if (s.skills.fishing.level >= 5) return "Tidecaller";
  if (s.stats && s.stats.deaths >= 5) return "Thrice-fallen";
  if (s.kills >= 10) return "Beast-tested";
  return "Drifter";
}

interface GameState {
  inventory: Record<ItemKey, number>;
  skills: Record<SkillKey, SkillState>;
  vitals: Vitals;
  equipment: Record<EquipSlot, EquipmentItem | null>;
  gold: number;
  quests: QuestState[];
  hotbar: number; // 1..6 selected slot
  log: LogLine[];
  driftSeason: number;
  /** % of land tiles consumed by the Drift (0-100) */
  driftPct: number;
  /** wanderers in the shared world (1 = just you / offline) */
  playersOnline: number;
  cosmetics: Cosmetics;
  /** lifetime Drift Beast kills (feeds titles) */
  kills: number;
  stats: LifetimeStats;
  minimap: MinimapSnap | null;
  roster: RosterEntry[];

  setDriftPct: (pct: number) => void;
  setSeason: (season: number) => void;
  setPlayersOnline: (n: number) => void;
  setCosmetics: (c: Partial<Cosmetics>) => void;
  bumpKills: () => void;
  bumpStat: (key: keyof LifetimeStats, n?: number) => void;
  setMinimap: (m: MinimapSnap) => void;
  setRoster: (r: RosterEntry[]) => void;

  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  questEvent: (e: QuestEvent) => void;
  claimQuest: (id: string) => void;
  sellItem: (item: ItemKey, qty: number, goldEach: number) => void;
  equip: (item: EquipmentItem) => void;
  addItem: (item: ItemKey, qty: number) => void;
  removeItem: (item: ItemKey, qty: number) => boolean;
  addXp: (skill: SkillKey, xp: number) => { leveledTo: number | null };
  setHp: (hp: number) => void;
  damage: (amount: number) => number; // returns remaining hp
  heal: (amount: number) => void;
  setHotbar: (slot: number) => void;
  pushLog: (text: string, color?: string) => void;
  bumpSeason: () => void;
}

const emptyInventory = () =>
  INVENTORY_ORDER.reduce(
    (acc, k) => ({ ...acc, [k]: 0 }),
    {} as Record<ItemKey, number>,
  );

export const MAX_HP = 50;

/** Pick 3 daily quests, deterministic for the calendar day (UTC). */
export function rollDailyQuests(): QuestState[] {
  const day = Math.floor(Date.now() / 86_400_000);
  const picks: QuestState[] = [];
  const pool = [...QUEST_POOL];
  let seed = day;
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    // simple LCG so the same day always rolls the same board
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const idx = seed % pool.length;
    picks.push({ def: pool[idx], progress: 0, claimed: false });
    pool.splice(idx, 1);
  }
  return picks;
}

/** Total XP required to have reached a given level (gentle curve). */
export function xpForLevel(level: number): number {
  // L1=0, L2=50, L3=130, ... grows ~quadratically
  return Math.floor(25 * (level - 1) * level);
}

export function levelForXp(xp: number): number {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  return lvl;
}

let logId = 1;

export const useGame = create<GameState>((set, get) => ({
  inventory: emptyInventory(),
  skills: {
    woodcutting: { xp: 0, level: 1 },
    mining: { xp: 0, level: 1 },
    fishing: { xp: 0, level: 1 },
    combat: { xp: 0, level: 1 },
  },
  vitals: { hp: MAX_HP, maxHp: MAX_HP },
  equipment: { weapon: null, tool: null, ward: null },
  gold: 0,
  quests: rollDailyQuests(),
  hotbar: 1,
  log: [],
  driftSeason: 1,
  driftPct: 0,
  playersOnline: 1,
  cosmetics: { name: "Wanderer", dye: "stone", eye: "drift" },
  kills: 0,
  stats: { deaths: 0, gathered: 0, crits: 0, goldEarned: 0, driftfalls: 0 },
  minimap: null,
  roster: [],

  setDriftPct: (pct) => set({ driftPct: Math.round(pct) }),
  setSeason: (season) => set({ driftSeason: season }),
  setPlayersOnline: (n) => set({ playersOnline: n }),
  setCosmetics: (c) =>
    set((s) => ({
      cosmetics: {
        ...s.cosmetics,
        ...c,
        ...(c.name !== undefined
          ? { name: c.name.trim().slice(0, 16) || "Wanderer" }
          : {}),
      },
    })),
  bumpKills: () => set((s) => ({ kills: s.kills + 1 })),
  bumpStat: (key, n = 1) =>
    set((s) => ({ stats: { ...s.stats, [key]: s.stats[key] + n } })),
  setMinimap: (m) => set({ minimap: m }),
  setRoster: (r) => set({ roster: r }),

  addGold: (amount) =>
    set((s) => ({
      gold: s.gold + amount,
      stats:
        amount > 0
          ? { ...s.stats, goldEarned: s.stats.goldEarned + amount }
          : s.stats,
    })),

  spendGold: (amount) => {
    if (get().gold < amount) return false;
    set((s) => ({ gold: s.gold - amount }));
    return true;
  },

  questEvent: (e) =>
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.claimed || q.progress >= q.def.target) return q;
        const inc = q.def.matches(e);
        return inc > 0
          ? { ...q, progress: Math.min(q.def.target, q.progress + inc) }
          : q;
      }),
    })),

  claimQuest: (id) => {
    const q = get().quests.find((x) => x.def.id === id);
    if (!q || q.claimed || q.progress < q.def.target) return;
    set((s) => ({
      gold: s.gold + q.def.goldReward,
      quests: s.quests.map((x) =>
        x.def.id === id ? { ...x, claimed: true } : x,
      ),
    }));
    play("coin");
    get().addXp(q.def.xpReward.skill, q.def.xpReward.xp);
    get().pushLog(
      `Quest complete: ${q.def.label} — +${q.def.goldReward}g, +${q.def.xpReward.xp} ${SKILL_META[q.def.xpReward.skill].label} XP`,
      "#e7c873",
    );
  },

  sellItem: (item, qty, goldEach) => {
    if (!get().removeItem(item, qty)) return;
    const total = qty * goldEach;
    play("coin");
    get().addGold(total);
    get().pushLog(`Sold ${qty}× for ${total}g.`, "#e7c873");
  },

  equip: (item) =>
    set((s) => ({ equipment: { ...s.equipment, [item.slot]: item } })),

  addItem: (item, qty) =>
    set((s) => ({ inventory: { ...s.inventory, [item]: s.inventory[item] + qty } })),

  removeItem: (item, qty) => {
    if (get().inventory[item] < qty) return false;
    set((s) => ({ inventory: { ...s.inventory, [item]: s.inventory[item] - qty } }));
    return true;
  },

  setHp: (hp) =>
    set((s) => ({ vitals: { ...s.vitals, hp: Math.max(0, Math.min(s.vitals.maxHp, hp)) } })),

  damage: (amount) => {
    const next = Math.max(0, get().vitals.hp - amount);
    set((s) => ({ vitals: { ...s.vitals, hp: next } }));
    return next;
  },

  heal: (amount) =>
    set((s) => ({
      vitals: { ...s.vitals, hp: Math.min(s.vitals.maxHp, s.vitals.hp + amount) },
    })),

  addXp: (skill, xp) => {
    const prev = get().skills[skill];
    const newXp = prev.xp + xp;
    const newLevel = levelForXp(newXp);
    const leveledTo = newLevel > prev.level ? newLevel : null;
    set((s) => ({
      skills: { ...s.skills, [skill]: { xp: newXp, level: newLevel } },
    }));
    return { leveledTo };
  },

  setHotbar: (slot) => set({ hotbar: slot }),

  pushLog: (text, color) =>
    set((s) => ({
      log: [...s.log.slice(-40), { id: logId++, text, color }],
    })),

  bumpSeason: () => set((s) => ({ driftSeason: s.driftSeason + 1 })),
}));
