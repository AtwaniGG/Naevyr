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
  rollDailyQuestIds,
  SKILL_META,
  ENCHANT_MAX,
  enchantCost,
} from "@/game/types";
import { DyeKey, EyeKey } from "@/game/render/sprites";
import { AuraKey, PetKey, DrinkKey, DRINK_CATALOG, GoldReason, ItemReason, AvatarKind, PassTier } from "@/game/types";
import { BountyContract, BountyRegion, bountyTemplate } from "@/game/types";
import { play } from "@/game/audio/sound";
import { bus } from "@/game/state/bus";

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

/** the authoritative battle-pass snapshot the server pushes via "passSync" */
export interface PassSync {
  season: number;
  name: string;
  endsIn: number;
  week: number;
  xp: number;
  tier: number;
  maxTier: number;
  premium: boolean;
  tiers: PassTier[];
  challenges: { id: string; progress: number; claimed: boolean }[];
  claimedFree: number[];
  claimedPremium: number[];
}

export interface Cosmetics {
  name: string;
  dye: DyeKey;
  eye: EyeKey;
  /** equipped aura ("" = none) */
  aura: AuraKey | "";
  /** equipped pet ("" = none) */
  pet: PetKey | "";
  /** worn premium avatar ("" = the wanderer) + its two channel options */
  avatar: AvatarKind | "";
  avA: string;
  avB: string;
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
  /** land claims (3×3 plots, by center) */
  claims: { x: number; y: number; mine: boolean }[];
}

/** lifetime tallies (persisted) — feeds the stats panel + future titles */
export interface LifetimeStats {
  deaths: number;
  gathered: number;
  crits: number;
  goldEarned: number;
  driftfalls: number;
  /** gold given to the Shrine of the Pale Flame */
  donated: number;
}

/** an active duel as the HUD sees it */
export interface DuelState {
  oppName: string;
  myHp: number;
  oppHp: number;
  wager: number;
  currency: "gold" | "drifts";
}

/** who else shares the Drift right now */
export interface RosterEntry {
  id: string;
  name: string;
  title: string;
  self: boolean;
  /** guild tag ("" = guildless) */
  guildTag?: string;
}

/** a spin in flight: the HUD overlay animates the wheel onto `seg` */
export interface WheelSpin {
  kind: "gold" | "drift";
  /** segment index the wheel must land on (server's roll) */
  seg: number;
  /** prize lines revealed after the wheel stops */
  prizes: { label: string; key?: string; shards?: number; dup?: boolean; kind?: string }[];
  /** pity counter after this spin (drift wheel only) */
  pity?: number;
  /** this was a Drift Cache (3 rolls) — the overlay cracks the chest */
  cache?: boolean;
}

/** Exchange rates/caps/pool as the server last reported them */
export interface ExchangeInfo {
  buyRate: number;
  sellRate: number;
  minTrade: number;
  pool: number;
  buyOpen: boolean;
  sellOpen: boolean;
  /** when the sell side opens (ms epoch; 0 = no gate) */
  sellOpensAt?: number;
  boughtToday: number;
  soldToday: number;
  buyCap: number;
  sellCap: number;
}

export interface GuildInfo {
  id: number;
  name: string;
  tag: string;
  members: number;
  region: string;
  regionSecsLeft: number;
}

export interface RelicInfo {
  id: number;
  key: string;
  price: number;
  sellerName: string;
}

/** a marketplace offer as the HUD sees it */
export interface MarketListing {
  id: number;
  item: ItemKey;
  qty: number;
  price: number;
  sellerName: string;
  mine: boolean;
}

/** Earned title, best first. Derived — never stored.
 *  Drift-touched titles (burn-bought) outrank every earned one. */
/** THE HALL OF DEEDS — long-term goals that outlast a season.
 *  A deed tracks one lifetime measure toward a goal. Crossing the bar marks the
 *  deed walked (recorded in claimedDeeds, so it never re-fires) and — for the
 *  capstones — grants a permanent title (added to ownedTitles, pickable in the
 *  You panel). Deeds are HONOR, not a gold faucet: the reward is the title and
 *  the standing, never coin, so they don't touch the tuned economy. All of it
 *  is computed from the lifetime stats the client already keeps, so it works
 *  offline and needs no server rail (titles are client-trusted like cosmetics). */
export type DeedCategory = "combat" | "wealth" | "industry" | "survival" | "realm";

/** `badge` = the Design-System deed_* svg export served from design-system.nosync */
export const DEED_CATEGORIES: { key: DeedCategory; label: string; badge: string }[] = [
  { key: "combat",   label: "Blade",  badge: "deed_blade" },
  { key: "wealth",   label: "Coin",   badge: "deed_coin" },
  { key: "industry", label: "Labor",  badge: "deed_labor" },
  { key: "survival", label: "Endure", badge: "deed_endure" },
  { key: "realm",    label: "Realm",  badge: "deed_realm" },
];

export interface DeedCtx {
  kills: number;
  stats: LifetimeStats;
  skills: Record<SkillKey, SkillState>;
  loginStreak: number;
}

export interface Deed {
  id: string;
  cat: DeedCategory;
  name: string;
  desc: string;
  goal: number;
  /** the current lifetime measure (uncapped) toward `goal` */
  progress: (s: DeedCtx) => number;
  /** capstone deeds grant a permanent title when walked */
  title?: string;
}

const maxSkill = (s: DeedCtx) => Math.max(...Object.values(s.skills).map((k) => k.level));

export const DEEDS: Deed[] = [
  // ── Blade ──────────────────────────────────────────────────────────────
  { id: "first_blood", cat: "combat", name: "First Blood", desc: "Fell your first Drift Beast", goal: 1, progress: (s) => s.kills },
  { id: "beast_tested", cat: "combat", name: "Beast-tested", desc: "Fell 10 Drift Beasts", goal: 10, progress: (s) => s.kills, title: "Beast-tested" },
  { id: "beastbane", cat: "combat", name: "Beastbane", desc: "Fell 50 Drift Beasts", goal: 50, progress: (s) => s.kills, title: "Beastbane" },
  { id: "centurion", cat: "combat", name: "Centurion", desc: "Fell 100 Drift Beasts", goal: 100, progress: (s) => s.kills, title: "Centurion" },
  { id: "warbringer", cat: "combat", name: "Warbringer", desc: "Fell 500 Drift Beasts", goal: 500, progress: (s) => s.kills, title: "Warbringer" },
  { id: "deathblow", cat: "combat", name: "Deathblow", desc: "Landed 50 critical strikes", goal: 50, progress: (s) => s.stats.crits, title: "Deathblow" },
  { id: "executioner", cat: "combat", name: "Executioner", desc: "Landed 250 critical strikes", goal: 250, progress: (s) => s.stats.crits, title: "Executioner" },
  { id: "warbrand", cat: "combat", name: "Warbrand", desc: "Reached Combat 10", goal: 10, progress: (s) => s.skills.combat.level, title: "Warbrand" },
  { id: "warlord", cat: "combat", name: "Warlord", desc: "Reached Combat 20", goal: 20, progress: (s) => s.skills.combat.level, title: "Warlord" },

  // ── Coin ───────────────────────────────────────────────────────────────
  { id: "first_coin", cat: "wealth", name: "First Coin", desc: "Earned 100 gold", goal: 100, progress: (s) => s.stats.goldEarned },
  { id: "gilded", cat: "wealth", name: "Gilded", desc: "Earned 1,000 gold", goal: 1000, progress: (s) => s.stats.goldEarned, title: "Gilded" },
  { id: "magnate", cat: "wealth", name: "Magnate", desc: "Earned 10,000 gold", goal: 10000, progress: (s) => s.stats.goldEarned, title: "Magnate" },
  { id: "tycoon", cat: "wealth", name: "Tycoon", desc: "Earned 100,000 gold", goal: 100000, progress: (s) => s.stats.goldEarned, title: "Tycoon" },
  { id: "flamekeeper", cat: "wealth", name: "Flamekeeper", desc: "Gave 500 to the Pale Flame", goal: 500, progress: (s) => s.stats.donated, title: "Flamekeeper" },
  { id: "pyre_warden", cat: "wealth", name: "Pyre-warden", desc: "Gave 2,500 to the Pale Flame", goal: 2500, progress: (s) => s.stats.donated, title: "Pyre-warden" },

  // ── Labor ──────────────────────────────────────────────────────────────
  { id: "provider", cat: "industry", name: "Provider", desc: "Gathered 500 resources", goal: 500, progress: (s) => s.stats.gathered, title: "Provider" },
  { id: "harvester", cat: "industry", name: "Harvester", desc: "Gathered 2,500 resources", goal: 2500, progress: (s) => s.stats.gathered, title: "Harvester" },
  { id: "realm_fed", cat: "industry", name: "Realm-fed", desc: "Gathered 10,000 resources", goal: 10000, progress: (s) => s.stats.gathered, title: "Realm-fed" },
  { id: "hewer", cat: "industry", name: "Hewer", desc: "Reached Woodcutting 5", goal: 5, progress: (s) => s.skills.woodcutting.level, title: "Hewer" },
  { id: "timberlord", cat: "industry", name: "Timberlord", desc: "Reached Woodcutting 15", goal: 15, progress: (s) => s.skills.woodcutting.level, title: "Timberlord" },
  { id: "stonebreaker", cat: "industry", name: "Stonebreaker", desc: "Reached Mining 5", goal: 5, progress: (s) => s.skills.mining.level, title: "Stonebreaker" },
  { id: "deepdelver", cat: "industry", name: "Deepdelver", desc: "Reached Mining 15", goal: 15, progress: (s) => s.skills.mining.level, title: "Deepdelver" },
  { id: "tidecaller", cat: "industry", name: "Tidecaller", desc: "Reached Fishing 5", goal: 5, progress: (s) => s.skills.fishing.level, title: "Tidecaller" },
  { id: "deepnet", cat: "industry", name: "Deepnet", desc: "Reached Fishing 15", goal: 15, progress: (s) => s.skills.fishing.level, title: "Deepnet" },
  { id: "realm_worn", cat: "industry", name: "Realm-worn", desc: "Took a skill to level 20", goal: 20, progress: maxSkill, title: "Realm-worn" },

  // ── Endure ─────────────────────────────────────────────────────────────
  { id: "thrice_fallen", cat: "survival", name: "Thrice-fallen", desc: "Fell to the Drift 5 times", goal: 5, progress: (s) => s.stats.deaths, title: "Thrice-fallen" },
  { id: "faithful", cat: "survival", name: "Faithful", desc: "Walked 7 days unbroken", goal: 7, progress: (s) => s.loginStreak, title: "Faithful" },
  { id: "devoted", cat: "survival", name: "Devoted", desc: "Walked 30 days unbroken", goal: 30, progress: (s) => s.loginStreak, title: "Devoted" },

  // ── Realm ──────────────────────────────────────────────────────────────
  { id: "drift_touched", cat: "realm", name: "Drift-touched", desc: "Endured 5 driftfalls", goal: 5, progress: (s) => s.stats.driftfalls },
  { id: "drift_walker", cat: "realm", name: "Drift-walker", desc: "Endured 25 driftfalls", goal: 25, progress: (s) => s.stats.driftfalls, title: "Drift-walker" },
];

export const deedCtx = (s: { kills: number; stats: LifetimeStats; skills: Record<SkillKey, SkillState>; loginStreak: number }): DeedCtx => ({
  kills: s.kills, stats: s.stats, skills: s.skills, loginStreak: s.loginStreak,
});
export const deedWalked = (d: Deed, ctx: DeedCtx) => d.progress(ctx) >= d.goal;

export function currentTitle(s: {
  skills: Record<SkillKey, SkillState>;
  kills: number;
  stats?: LifetimeStats;
  ownedTitles?: string[];
}): string {
  if (s.ownedTitles && s.ownedTitles.length > 0)
    return s.ownedTitles[s.ownedTitles.length - 1];
  if (s.kills >= 50) return "Beastbane";
  if (s.stats && s.stats.donated >= 500) return "Flamekeeper";
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
  /** the seasonal battle pass (server-authoritative; null offline/until first sync) */
  battlePass: PassSync | null;
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
  /** ids of Hall-of-Deeds deeds already walked (so they never re-fire) */
  claimedDeeds: string[];
  minimap: MinimapSnap | null;
  roster: RosterEntry[];
  /** connected to the shared world (claims need it) */
  online: boolean;
  /** demo lane: in the shared world as a guest, blocked from economy/chain */
  guest: boolean;
  /** armed: next ground click stakes a claim */
  claimMode: boolean;
  /** how many claims you currently hold */
  myClaims: number;
  listings: MarketListing[];
  /** which town building's panel is open (null = none) */
  openShop: string | null;
  // ---- frontier bounties ----
  /** accepted contracts (server-authoritative online; empty offline) */
  bounties: BountyContract[];
  /** each region board's current 3 offered template ids */
  bountyOffers: { region: BountyRegion; tids: string[] }[];
  /** which bounty board panel is open (region name, null = none) */
  openBounty: BountyRegion | null;
  // ---- the Roaming Trader ----
  /** the trader's vendor panel is open */
  openTrader: boolean;
  /** the waystation index the trader is parked at (-1 = none/walking) */
  traderStop: number;
  /** the player is in dealing range of the parked trader */
  traderNear: boolean;
  /** Frontier Outpost reputation (server-authoritative; 0 offline) */
  outpostRep: number;
  /** daily login streak (server-authoritative; 0 offline) */
  loginStreak: number;
  // ---- the Waystation ----
  ownedDyes: DyeKey[];
  ownedEyes: EyeKey[];
  ownedAuras: AuraKey[];
  ownedPets: PetKey[];
  /** premium avatars, burn-bought (server-authoritative ownership) */
  ownedAvatars: AvatarKind[];
  /** Drift-touched titles, burn-bought (latest outranks earned titles) */
  ownedTitles: string[];
  /** active drink buffs: expiry timestamps (ms) */
  buffs: { gather: number; damage: number; sight: number };
  /** gold stored safely in the Vault (server-held; display copy) */
  banked: number;
  /** linked Solana wallet address (devnet), null when unlinked */
  wallet: string | null;
  /** game-token balance of the linked wallet (devnet; 0 when no mint/wallet) */
  tokenBalance: number;
  /** token gate: holds >= 1 whole token */
  holder: boolean;
  /** owns a gold-bought steed from the Stable (server-authoritative online,
   *  SaveData cache offline) */
  ownsMount: boolean;
  /** owns the Swift Steed upgrade (faster mount) */
  swiftMount: boolean;
  /** the steed is currently summoned (drives the road/mount speed bonus) */
  mounted: boolean;
  /** THE LONG NIGHT: live defense status (null when no night) */
  night: { kills: number; need: number; endsIn: number } | null;
  /** DRIFT RIFT: live incursion status (null when no rift) */
  rift: { kills: number; need: number; endsIn: number; x: number; y: number } | null;
  /** BLOOD MOON: true while the corrupted night is up */
  bloodMoon: boolean;
  /** which right-rail popout is open (one at a time) */
  openDock: "forge" | "market" | "you" | "trade" | "pass" | "deeds" | null;
  /** the Satchel panel: collapsed to a button when false (Activity grows) */
  satchelOpen: boolean;
  shrine: { pot: number; goal: number };
  duel: DuelState | null;
  duelChallenge: { from: string; name: string; wager: number } | null;
  /** the arena queue: who waits in the Pit's ring (mine = it's me) */
  pitQueue: { name: string; wager: number; mine: boolean; currency: "gold" | "drifts" } | null;
  /** the Threshold walked (or skipped); persists in the save */
  tutorialDone: boolean;
  /** current tutorial objective line (null = no banner) */
  tutorialObjective: string | null;
  /** a wheel spin awaiting its animation (HUD overlay); null = idle */
  wheelSpin: WheelSpin | null;
  /** Exchange counter state (Vault keeper), null until first exInfo */
  exchange: ExchangeInfo | null;
  /** all guilds in the realm (schema-mirrored ~1/s) */
  guilds: GuildInfo[];
  /** my guild tag ("" = guildless; from my own PlayerState) */
  myGuildTag: string;
  /** relic market listings (schema-mirrored) */
  relics: RelicInfo[];

  setDriftPct: (pct: number) => void;
  setSeason: (season: number) => void;
  setPlayersOnline: (n: number) => void;
  setCosmetics: (c: Partial<Cosmetics>) => void;
  bumpKills: () => void;
  bumpStat: (key: keyof LifetimeStats, n?: number) => void;
  setMinimap: (m: MinimapSnap) => void;
  setRoster: (r: RosterEntry[]) => void;
  setOnline: (b: boolean) => void;
  setGuest: (b: boolean) => void;
  setClaimMode: (b: boolean) => void;
  setMyClaims: (n: number) => void;
  setListings: (l: MarketListing[]) => void;
  setOpenShop: (k: string | null) => void;
  // ---- frontier bounties ----
  setBounties: (epoch: number, bounties: BountyContract[], offers: { region: BountyRegion; tids: string[] }[]) => void;
  setOpenBounty: (region: BountyRegion | null) => void;
  acceptBounty: (region: BountyRegion, tid: string) => void;
  claimBounty: (region: BountyRegion, tid: string) => void;
  abandonBounty: (region: BountyRegion, tid: string) => void;
  setOpenTrader: (open: boolean) => void;
  setTraderInfo: (stop: number, near: boolean) => void;
  traderBuy: (item: string) => void;
  traderSell: (item: string, qty: number) => void;
  setOutpostRep: (rep: number) => void;
  deliverSupply: (id: string) => void;
  quartermasterBuy: (item: string) => void;
  setLoginStreak: (n: number) => void;
  /** grant any newly-earned achievement titles (called after stat changes) */
  checkAchievements: () => void;
  /** record ownership of a bought cosmetic (gold is spent by the caller) */
  grantCosmetic: (kind: "dye" | "eye" | "aura" | "pet" | "title" | "avatar", key: string) => void;
  /** a relic left your hands (sold P2P) — stop owning it locally too */
  revokeCosmetic: (kind: "dye" | "aura", key: string) => void;
  drink: (kind: DrinkKey) => boolean;
  setBanked: (n: number) => void;
  setWallet: (a: string | null) => void;
  setTokenStatus: (balance: number, holder: boolean) => void;
  setNight: (n: { kills: number; need: number; endsIn: number } | null) => void;
  setRift: (r: { kills: number; need: number; endsIn: number; x: number; y: number } | null) => void;
  setBloodMoon: (b: boolean) => void;
  setOpenDock: (d: "forge" | "market" | "you" | "trade" | "pass" | "deeds" | null) => void;
  setSatchelOpen: (b: boolean) => void;
  setShrine: (s: { pot: number; goal: number }) => void;
  setDuel: (d: DuelState | null) => void;
  setDuelChallenge: (c: { from: string; name: string; wager: number } | null) => void;
  setPitQueue: (q: { name: string; wager: number; mine: boolean; currency: "gold" | "drifts" } | null) => void;
  setTutorialDone: (b: boolean) => void;
  setTutorialObjective: (s: string | null) => void;
  setWheelSpin: (s: WheelSpin | null) => void;
  setExchange: (e: ExchangeInfo | null) => void;
  setGuilds: (g: GuildInfo[]) => void;
  setMyGuildTag: (t: string) => void;
  setRelics: (r: RelicInfo[]) => void;

  /**
   * Mutate pocket gold locally. A reason tags client-trusted events so the
   * engine can forward them to the server ledger (online); reasonless calls
   * are local-only (offline sim, server-result application).
   */
  addGold: (amount: number, reason?: GoldReason) => void;
  spendGold: (amount: number, reason?: GoldReason) => boolean;
  /** adopt the server ledger's authoritative balance (no forwarding) */
  setGold: (amount: number) => void;
  setOwnsMount: (owns: boolean) => void;
  setSwiftMount: (owns: boolean) => void;
  setMounted: (on: boolean) => void;
  questEvent: (e: QuestEvent) => void;
  claimQuest: (id: string) => void;
  sellItem: (item: ItemKey, qty: number, goldEach: number) => void;
  equip: (item: EquipmentItem) => void;
  /** Forge enchant: reinforce an equipped slot for gold (+1 power, capped) */
  enchant: (slot: EquipSlot) => void;
  /** reason-tagged calls forward to the server inventory ledger when online */
  addItem: (item: ItemKey, qty: number, reason?: ItemReason) => void;
  removeItem: (item: ItemKey, qty: number, reason?: ItemReason) => boolean;
  /** adopt the server inventory ledger (no forwarding) */
  setInventory: (inv: Partial<Record<ItemKey, number>>) => void;
  /** Mirewife brews / Obelisk blessings: set a buff for an arbitrary duration */
  applyBuff: (buff: "gather" | "damage" | "sight", ms: number) => void;
  /** the Ash Obelisk: trade coin for a fresh set of dailies */
  rerollQuests: () => void;
  /** adopt the server's authoritative quest board (online; wholesale replace) */
  setQuests: (list: { id: string; progress: number; claimed: boolean }[]) => void;
  /** adopt the server's authoritative battle-pass snapshot */
  setBattlePass: (bp: PassSync) => void;
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

/** Build today's 3 daily quests (offline path); deterministic per UTC day. */
export function rollDailyQuests(): QuestState[] {
  const day = Math.floor(Date.now() / 86_400_000);
  return rollDailyQuestIds(day).flatMap((id) => {
    const def = QUEST_POOL.find((d) => d.id === id);
    return def ? [{ def, progress: 0, claimed: false }] : [];
  });
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
  battlePass: null,
  hotbar: 1,
  log: [],
  driftSeason: 1,
  driftPct: 0,
  playersOnline: 1,
  cosmetics: { name: "Wanderer", dye: "stone", eye: "drift", aura: "", pet: "", avatar: "", avA: "", avB: "" },
  kills: 0,
  stats: { deaths: 0, gathered: 0, crits: 0, goldEarned: 0, driftfalls: 0, donated: 0 },
  minimap: null,
  roster: [],
  online: false,
  guest: false,
  claimMode: false,
  myClaims: 0,
  listings: [],
  openShop: null,
  bounties: [],
  bountyOffers: [],
  openBounty: null,
  openTrader: false,
  traderStop: -1,
  traderNear: false,
  outpostRep: 0,
  loginStreak: 0,
  claimedDeeds: [],
  ownedDyes: ["stone"],
  ownedEyes: ["drift"],
  ownedAuras: [],
  ownedPets: [],
  ownedAvatars: [],
  ownedTitles: [],
  buffs: { gather: 0, damage: 0, sight: 0 },
  banked: 0,
  wallet: null,
  tokenBalance: 0,
  holder: false,
  ownsMount: false,
  swiftMount: false,
  mounted: false,
  night: null,
  rift: null,
  bloodMoon: false,
  tutorialDone: false,
  tutorialObjective: null,
  wheelSpin: null,
  exchange: null,
  guilds: [],
  myGuildTag: "",
  relics: [],
  openDock: null,
  satchelOpen: true,
  shrine: { pot: 0, goal: 500 },
  duel: null,
  duelChallenge: null,
  pitQueue: null,

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
  bumpKills: () => { set((s) => ({ kills: s.kills + 1 })); get().checkAchievements(); },
  bumpStat: (key, n = 1) => {
    set((s) => ({ stats: { ...s.stats, [key]: s.stats[key] + n } }));
    get().checkAchievements();
  },
  setMinimap: (m) => set({ minimap: m }),
  setRoster: (r) => set({ roster: r }),
  setOnline: (b) => set({ online: b }),
  setGuest: (b) => set({ guest: b }),
  setClaimMode: (b) => set({ claimMode: b }),
  setMyClaims: (n) => set({ myClaims: n }),
  setListings: (l) => set({ listings: l }),
  setOpenShop: (k) => set({ openShop: k }),

  // ---- frontier bounties (server-authoritative online; read-only offline) ----
  setBounties: (epoch, bounties, offers) => set({ bounties, bountyOffers: offers }),
  setOpenBounty: (region) => set({ openBounty: region }),
  acceptBounty: (region, tid) => {
    if (!get().online) {
      get().pushLog("The frontier postmaster keeps no ledger while you wander offline.", "#a99fb8");
      return;
    }
    bus.emit("bountyAccept", { region, tid });
  },
  claimBounty: (region, tid) => {
    const c = get().bounties.find((b) => b.tid === tid && b.region === region);
    const t = bountyTemplate(tid);
    if (!c || !t || c.progress < t.target) return;
    if (!get().online) return;
    bus.emit("bountyClaim", { region, tid });
  },
  abandonBounty: (region, tid) => {
    if (!get().online) return;
    bus.emit("bountyAbandon", { region, tid });
  },

  setOpenTrader: (open) => set({ openTrader: open }),
  setTraderInfo: (stop, near) =>
    set((s) => (s.traderStop === stop && s.traderNear === near ? s : { traderStop: stop, traderNear: near })),
  traderBuy: (item) => { if (get().online) bus.emit("traderBuy", { item }); },
  traderSell: (item, qty) => { if (get().online && qty > 0) bus.emit("traderSell", { item, qty }); },
  setOutpostRep: (rep) => set((s) => (s.outpostRep === rep ? s : { outpostRep: rep })),
  deliverSupply: (id) => {
    if (!get().online) { get().pushLog("The Quartermaster keeps no tally while you wander offline.", "#a99fb8"); return; }
    bus.emit("deliverSupply", { id });
  },
  quartermasterBuy: (item) => { if (get().online) bus.emit("quartermasterBuy", { item }); },
  setLoginStreak: (n) => set((s) => (s.loginStreak === n ? s : { loginStreak: n })),
  checkAchievements: () => {
    const s = get();
    const ctx = deedCtx(s);
    const freshlyWalked: string[] = [];
    for (const d of DEEDS) {
      if (s.claimedDeeds.includes(d.id)) continue;
      if (!deedWalked(d, ctx)) continue;
      freshlyWalked.push(d.id);
      if (d.title) get().grantCosmetic("title", d.title);
      play("coin");
      get().pushLog(
        d.title ? `Deed walked: ${d.name}. Title earned: "${d.title}".` : `Deed walked: ${d.name}.`,
        "#e7c873",
      );
    }
    if (freshlyWalked.length)
      set((st) => ({ claimedDeeds: [...st.claimedDeeds, ...freshlyWalked] }));
  },
  grantCosmetic: (kind, key) =>
    set((s) => {
      if (kind === "dye" && !s.ownedDyes.includes(key as DyeKey))
        return { ownedDyes: [...s.ownedDyes, key as DyeKey] };
      if (kind === "eye" && !s.ownedEyes.includes(key as EyeKey))
        return { ownedEyes: [...s.ownedEyes, key as EyeKey] };
      if (kind === "aura" && !s.ownedAuras.includes(key as AuraKey))
        return { ownedAuras: [...s.ownedAuras, key as AuraKey] };
      if (kind === "pet" && !s.ownedPets.includes(key as PetKey))
        return { ownedPets: [...s.ownedPets, key as PetKey] };
      if (kind === "title" && !s.ownedTitles.includes(key))
        return { ownedTitles: [...s.ownedTitles, key] };
      if (kind === "avatar" && !s.ownedAvatars.includes(key as AvatarKind))
        return { ownedAvatars: [...s.ownedAvatars, key as AvatarKind] };
      return {};
    }),
  revokeCosmetic: (kind, key) =>
    set((s) => {
      if (kind === "dye")
        return { ownedDyes: s.ownedDyes.filter((k) => k !== key) };
      return { ownedAuras: s.ownedAuras.filter((k) => k !== key) };
    }),
  drink: (kind) => {
    const meta = DRINK_CATALOG[kind];
    if (!get().spendGold(meta.price, "shop")) return false;
    play("eat");
    set((s) => ({
      buffs: { ...s.buffs, [meta.buff]: Date.now() + meta.ms },
    }));
    get().pushLog(`You drink ${meta.label}. ${meta.desc}.`, "#e9a86b");
    return true;
  },
  setBanked: (n) => set({ banked: n }),
  setWallet: (a) => set({ wallet: a }),
  setTokenStatus: (tokenBalance, holder) => set({ tokenBalance, holder }),
  setNight: (night) => set({ night }),
  setRift: (rift) => set({ rift }),
  setBloodMoon: (bloodMoon) => set({ bloodMoon }),
  setTutorialDone: (tutorialDone) => set({ tutorialDone }),
  setTutorialObjective: (tutorialObjective) => set({ tutorialObjective }),
  setWheelSpin: (wheelSpin) => set({ wheelSpin }),
  setExchange: (exchange) => set({ exchange }),
  setGuilds: (guilds) => set({ guilds }),
  setMyGuildTag: (myGuildTag) => set({ myGuildTag }),
  setRelics: (relics) => set({ relics }),
  setOpenDock: (openDock) => set({ openDock }),
  setSatchelOpen: (satchelOpen) => set({ satchelOpen }),
  setShrine: (s) => set({ shrine: s }),
  setDuel: (d) => set({ duel: d }),
  setDuelChallenge: (c) => set({ duelChallenge: c }),
  setPitQueue: (pitQueue) => set({ pitQueue }),

  addGold: (amount, reason) => {
    set((s) => ({
      gold: s.gold + amount,
      stats:
        amount > 0
          ? { ...s.stats, goldEarned: s.stats.goldEarned + amount }
          : s.stats,
    }));
    if (reason) bus.emit("goldDelta", { amount, reason });
  },

  spendGold: (amount, reason) => {
    if (get().gold < amount) return false;
    set((s) => ({ gold: s.gold - amount }));
    if (reason) bus.emit("goldDelta", { amount: -amount, reason });
    return true;
  },

  setGold: (amount) => set({ gold: Math.max(0, amount) }),
  setOwnsMount: (owns) => set({ ownsMount: owns }),
  setSwiftMount: (owns) => set({ swiftMount: owns }),
  setMounted: (on) => set({ mounted: on }),

  setQuests: (list) =>
    set({
      quests: list.flatMap((q) => {
        const def = QUEST_POOL.find((d) => d.id === q.id);
        return def ? [{ def, progress: q.progress, claimed: q.claimed }] : [];
      }),
    }),

  setBattlePass: (bp) => set({ battlePass: bp }),

  questEvent: (e) =>
    set((s) => {
      if (s.online) return s; // server drives quest progress via questSync
      return {
        quests: s.quests.map((q) => {
          if (q.claimed || q.progress >= q.def.target) return q;
          const inc = q.def.matches(e);
          return inc > 0
            ? { ...q, progress: Math.min(q.def.target, q.progress + inc) }
            : q;
        }),
      };
    }),

  claimQuest: (id) => {
    const q = get().quests.find((x) => x.def.id === id);
    if (!q || q.claimed || q.progress < q.def.target) return;
    if (get().online) {
      bus.emit("questClaim", id); // server validates, pays the ledger, syncs
      return;
    }
    set((s) => ({
      quests: s.quests.map((x) =>
        x.def.id === id ? { ...x, claimed: true } : x,
      ),
    }));
    get().addGold(q.def.goldReward, "quest");
    play("coin");
    get().addXp(q.def.xpReward.skill, q.def.xpReward.xp);
    get().pushLog(
      `Quest complete: ${q.def.label}. +${q.def.goldReward}g, +${q.def.xpReward.xp} ${SKILL_META[q.def.xpReward.skill].label} XP`,
      "#e7c873",
    );
  },

  sellItem: (item, qty, goldEach) => {
    // local mutation is the offline path AND the instant feedback; online the
    // "sell" intent makes it real and invSync/goldSync adopt the server's word
    if (!get().removeItem(item, qty)) return;
    const total = qty * goldEach;
    play("coin");
    get().addGold(total);
    bus.emit("sell", { item, qty });
    get().pushLog(`Sold ${qty}× for ${total}g.`, "#e7c873");
  },

  equip: (item) =>
    set((s) => ({ equipment: { ...s.equipment, [item.slot]: item } })),

  enchant: (slot) => {
    const item = get().equipment[slot];
    if (!item) return;
    const ench = item.ench ?? 0;
    if (ench >= ENCHANT_MAX) { get().pushLog("This gear can take no more reinforcement.", "#a99fb8"); return; }
    const cost = enchantCost(ench);
    if (get().gold < cost) { get().pushLog(`The rune-anvil needs ${cost}g.`, "#dc2626"); return; }
    if (!get().spendGold(cost, "shop")) return; // server ledger debits online
    const power = item.power + 1;
    const upgraded: EquipmentItem = {
      ...item, power, ench: ench + 1,
      flavor: item.flavor.replace(/\d+/, String(power)),
    };
    set((s) => ({ equipment: { ...s.equipment, [slot]: upgraded } }));
    play("craft");
    get().pushLog(`You reinforce your ${item.label}. ${upgraded.flavor} (+${ench + 1}).`, "#e7c873");
  },

  addItem: (item, qty, reason) => {
    set((s) => ({ inventory: { ...s.inventory, [item]: s.inventory[item] + qty } }));
    if (reason) bus.emit("itemDelta", { item, qty, reason });
  },

  applyBuff: (buff, ms) => set((s) => ({ buffs: { ...s.buffs, [buff]: Date.now() + ms } })),
  rerollQuests: () => set({ quests: rollDailyQuests() }),
  removeItem: (item, qty, reason) => {
    if (get().inventory[item] < qty) return false;
    set((s) => ({ inventory: { ...s.inventory, [item]: s.inventory[item] - qty } }));
    if (reason) bus.emit("itemDelta", { item, qty: -qty, reason });
    return true;
  },

  setInventory: (inv) =>
    set(() => {
      const next = emptyInventory();
      for (const k of INVENTORY_ORDER) {
        const v = Number(inv[k] ?? 0);
        next[k] = Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
      }
      return { inventory: next };
    }),

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
    if (leveledTo) get().checkAchievements(); // skill-level titles (Warbrand, Realm-worn)
    return { leveledTo };
  },

  setHotbar: (slot) => set({ hotbar: slot }),

  pushLog: (text, color) =>
    set((s) => ({
      log: [...s.log.slice(-40), { id: logId++, text, color }],
    })),

  bumpSeason: () => set((s) => ({ driftSeason: s.driftSeason + 1 })),
}));
