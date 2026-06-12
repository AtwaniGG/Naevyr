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
  /** burn-paid claim reinforcement (server shores up your weakest claim) */
  reinforceBurn: boolean;
  /** burn-paid Drift-touched cosmetic (payload = prestige catalog key) */
  prestigeBurn: string;
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
