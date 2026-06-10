import { Client, Room } from "colyseus.js";

// Thin wrapper around the Colyseus client. The engine polls synced state every
// frame (simplest possible consistency model at 60fps over a 20Hz server tick)
// and subscribes to one-shot server messages (loot, season, relocate).

export interface NetPlayer {
  id: string;
  x: number;
  y: number;
  action: string; // idle | walk | gather
  tx: number; // gather target cell (-1 when none)
  ty: number;
  name: string;
  dye: string;
  eye: string;
  title: string;
  aura: string;
  pet: string;
}

export interface NetProp {
  id: number;
  x: number;
  y: number;
  kind: string;
}

export interface NetNode {
  id: number;
  kind: string;
  gx: number;
  gy: number;
  amount: number;
  alive: boolean;
}

export interface NetClaim {
  id: number;
  x: number;
  y: number;
  integrity: number;
  ownerName: string;
}

export interface NetListing {
  id: number;
  item: string;
  qty: number;
  price: number;
  sellerName: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyState = any;

export class NetClient {
  readonly room: Room<AnyState>;

  private constructor(room: Room<AnyState>) {
    this.room = room;
  }

  /** Join the shared world; resolves null if the server can't be reached. */
  static async connect(
    url: string,
    timeoutMs: number,
    token: string,
  ): Promise<NetClient | null> {
    try {
      const room = await withTimeout(
        new Client(url).joinOrCreate<AnyState>("drift", { token }),
        timeoutMs,
      );
      // wait for the initial full state (map dims arrive with the first patch)
      await withTimeout(
        new Promise<void>((resolve) => {
          const check = () => {
            if (room.state.w > 0) resolve();
          };
          room.onStateChange(check);
          check();
        }),
        timeoutMs,
      );
      return new NetClient(room);
    } catch {
      return null;
    }
  }

  get sessionId(): string {
    return this.room.sessionId;
  }

  // ---- state reads (polled per frame) ----------------------------------------

  get w(): number {
    return this.room.state.w;
  }
  get h(): number {
    return this.room.state.h;
  }
  get season(): number {
    return this.room.state.season;
  }
  get driftPct(): number {
    return this.room.state.driftPct;
  }

  tileCodes(): number[] {
    return Array.from(this.room.state.tiles as Iterable<number>);
  }

  forEachPlayer(fn: (p: NetPlayer) => void) {
    (this.room.state.players as Map<string, NetPlayer>).forEach((p) => fn(p));
  }

  playerCount(): number {
    return (this.room.state.players as Map<string, NetPlayer>).size;
  }

  self(): NetPlayer | undefined {
    return (this.room.state.players as Map<string, NetPlayer>).get(this.sessionId);
  }

  forEachNode(fn: (n: NetNode) => void) {
    (this.room.state.nodes as Map<string, NetNode>).forEach((n) => fn(n));
  }

  forEachClaim(fn: (c: NetClaim) => void) {
    (this.room.state.claims as Map<string, NetClaim>).forEach((c) => fn(c));
  }

  forEachListing(fn: (l: NetListing) => void) {
    (this.room.state.listings as Map<string, NetListing>).forEach((l) => fn(l));
  }

  forEachProp(fn: (p: NetProp) => void) {
    (this.room.state.props as Map<string, NetProp>).forEach((p) => fn(p));
  }

  get shrinePot(): number {
    return this.room.state.shrinePot ?? 0;
  }
  get shrineGoal(): number {
    return this.room.state.shrineGoal ?? 500;
  }

  // ---- intents -----------------------------------------------------------------
  // every send is guarded: a dying socket must never throw into the game loop

  private safeSend(type: string, payload?: unknown) {
    try {
      this.room.send(type, payload);
    } catch {
      // connection is closing/closed — onDrop will switch us offline
    }
  }

  sendMove(x: number, y: number) {
    this.safeSend("move", { x, y });
  }

  sendGather(nodeId: number, speedMult: number) {
    this.safeSend("gather", { nodeId, speedMult });
  }

  sendRespawn() {
    this.safeSend("respawn");
  }

  sendIdentity(id: {
    name: string; dye: string; eye: string; title: string;
    aura: string; pet: string;
  }) {
    this.safeSend("identity", id);
  }

  sendBank(delta: number) {
    this.safeSend("bank", { delta });
  }

  sendSpin() {
    this.safeSend("spin");
  }

  sendDonate(amount: number) {
    this.safeSend("donate", { amount });
  }

  sendPlaceProp(kind: string, x: number, y: number) {
    this.safeSend("placeProp", { kind, x, y });
  }

  sendChallenge(target: string, wager: number) {
    this.safeSend("challenge", { target, wager });
  }

  sendAcceptDuel(from: string, wager: number) {
    this.safeSend("acceptDuel", { from, wager });
  }

  sendDuelHit(dmg: number) {
    this.safeSend("duelHit", { dmg });
  }

  sendChat(text: string, kind: "say" | "emote") {
    this.safeSend("chat", { text, kind });
  }

  sendClaim(x: number, y: number) {
    this.safeSend("claim", { x, y });
  }

  sendList(item: string, qty: number, price: number) {
    this.safeSend("list", { item, qty, price });
  }

  sendUnlist(id: number) {
    this.safeSend("unlist", { id });
  }

  sendBuy(id: number) {
    this.safeSend("buy", { id });
  }

  requestProfile() {
    this.safeSend("getProfile");
  }

  sendSave(snapshot: unknown) {
    this.safeSend("save", { snapshot });
  }

  // ---- lifecycle -----------------------------------------------------------------

  onMessage<T>(type: string, cb: (msg: T) => void) {
    this.room.onMessage(type, cb);
  }

  onDrop(cb: () => void) {
    this.room.onLeave(() => cb());
    this.room.onError(() => cb());
  }

  leave() {
    this.room.leave().catch(() => {});
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}
