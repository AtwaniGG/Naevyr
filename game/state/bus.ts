// Tiny typed event bus: lets the React HUD talk to the running Game instance
// without threading refs through the component tree.

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
