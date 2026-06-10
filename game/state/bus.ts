// Tiny typed event bus: lets the React HUD talk to the running Game instance
// without threading refs through the component tree.

type Events = {
  /** player typed a chat line (already trimmed, non-empty) */
  chat: string;
  /** player triggered an emote, e.g. "waves" */
  emote: string;
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
