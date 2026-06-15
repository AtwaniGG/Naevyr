// Tiny typed event bus: lets the React HUD talk to the running Game instance
// without threading refs through the component tree.

import type { GoldReason, ItemReason } from "@/game/types";

type Events = {
  /** player typed a chat line (already trimmed, non-empty) */
  chat: string;
  /** player triggered an emote, e.g. "waves" */
  emote: string;
  /** toggle stake-a-claim mode (next ground click claims) */
  stake: boolean;
  /** put items up for sale on the market */
  marketList: { item: string; qty: number; price: number };
  /** buy a listing by id */
  marketBuy: number;
  /** cancel your own listing by id */
  marketUnlist: number;
  /** vault: positive = deposit, negative = withdraw */
  bank: number;
  /** spin the Wheel (client pays up front) */
  spin: boolean;
  /** donate to the Shrine */
  donate: number;
  /** bought a furnishing — arm placement mode (client already paid) */
  placeProp: string;
  /** challenge a player to a Pit duel */
  challenge: { target: string; wager: number };
  /** accept the pending duel challenge */
  duelAccept: boolean;
  /** post a stake and wait in the Pit's ring (the arena queue) */
  pitJoin: number;
  /** post a DRIFTS stake in the ring (signs an on-chain escrow deposit) */
  pitJoinDrifts: number;
  /** abandon the open arena challenge */
  pitLeave: boolean;
  /** start the Solana wallet link flow (devnet); false = unlink */
  walletLink: boolean;
  /** burn-paid Wheel spin (holders only) */
  spinBurn: boolean;
  /** burn-paid Shrine cleanse contribution */
  cleanseBurn: boolean;
  /** burn-paid Dyeworks aura (payload = aura key) */
  auraBurn: string;
  /** burn-paid Obelisk quest reroll */
  obeliskBurn: boolean;
  /** burn-paid fast-travel to a waystation (payload = destination index) */
  waystationTravel: number;
  /** gold fast-travel (Cluster B): leap to waystation index, paid in gold */
  waystationGoldTravel: number;
  /** claim a completed daily quest (server validates + pays) */
  questClaim: string;
  /** reroll the daily board for 75g (server debits + rerolls) */
  questReroll: boolean;
  /** frontier bounties: take / turn in / abandon a regional contract */
  bountyAccept: { region: string; tid: string };
  bountyClaim: { region: string; tid: string };
  bountyAbandon: { region: string; tid: string };
  /** the Roaming Trader: buy a stock item / sell loot back at a premium */
  traderBuy: { item: string };
  traderSell: { item: string; qty: number };
  /** Frontier Outpost: deliver a supply contract / buy the Quartermaster's wares */
  deliverSupply: { id: string };
  quartermasterBuy: { item: string };
  /** burn-paid claim reinforcement (server shores up your weakest claim) */
  reinforceBurn: boolean;
  /** burn-paid Drift-touched cosmetic (payload = prestige catalog key) */
  prestigeBurn: string;
  /** the Dyeworks glass: try a premium avatar on your own draw (null = take
   *  it off; never synced, cleared on interior exit) */
  avatarPreview: { kind: string; a: string; b: string } | null;
  /** burn-paid Drift Wheel spin (gacha cosmetics) */
  driftSpinBurn: boolean;
  /** burn-paid Drift Cache (3 spins bundled) */
  cacheBurn: boolean;
  /** found a guild (burn; name + tag chosen at the keeper) */
  guildFound: { name: string; tag: string };
  /** join / leave an existing guild (no burn) */
  guildJoin: number;
  guildLeave: boolean;
  /** burn-paid territory stake (payload = region name) */
  guildTerritory: string;
  /** burn-paid banner upkeep (+48h) */
  guildUpkeep: boolean;
  /** Exchange: buy gold with DRIFTS (payload = gold amount; wallet signs) */
  exBuy: number;
  /** Exchange: sell gold for DRIFTS (payload = gold; the escrow pays out) */
  exSell: number;
  /** ask the server for fresh Exchange rates/caps/pool */
  exInfo: boolean;
  /** relic market: list an owned Drift-touched cosmetic */
  relicList: { key: string; price: number };
  relicUnlist: number;
  /** relic market: buy a listing (wallet signs the transfer + fee burn) */
  relicBuy: number;
  /** client-trusted gold change, forwarded to the server ledger when online */
  goldDelta: { amount: number; reason: GoldReason };
  /** client-trusted item change, forwarded to the inventory ledger when online */
  itemDelta: { item: string; qty: number; reason: ItemReason };
  /** cook fish over the embers (server validates the fish are real) */
  cook: { qty: number };
  /** vendor (satchel) sale — server debits the goods, credits house prices */
  sell: { item: string; qty: number };
  /** forge a recipe (server debits the materials from the ledger) */
  craft: { id: string };
  /** buy a steed from the Stable (gold, never DRIFTS; server debits + persists) */
  buyMount: boolean;
  buySwiftMount: boolean;
  /** summon (true) or dismiss (false) the steed */
  mountToggle: boolean;
};

type Handler<K extends keyof Events> = (payload: Events[K]) => void;

const handlers = new Map<keyof Events, Set<(payload: never) => void>>();

export const bus = {
  on<K extends keyof Events>(type: K, fn: Handler<K>): () => void {
    let set = handlers.get(type);
    if (!set) {
      set = new Set();
      handlers.set(type, set);
    }
    set.add(fn as (payload: never) => void);
    return () => set.delete(fn as (payload: never) => void);
  },
  emit<K extends keyof Events>(type: K, payload: Events[K]) {
    handlers.get(type)?.forEach((fn) => (fn as Handler<K>)(payload));
  },
};
