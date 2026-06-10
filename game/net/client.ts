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
}

export interface NetNode {
  id: number;
  kind: string;
  gx: number;
  gy: number;
  amount: number;
  alive: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyState = any;

export class NetClient {
  readonly room: Room<AnyState>;

  private constructor(room: Room<AnyState>) {
    this.room = room;
  }

  /** Join the shared world; resolves null if the server can't be reached. */
  static async connect(url: string, timeoutMs: number): Promise<NetClient | null> {
    try {
      const room = await withTimeout(
        new Client(url).joinOrCreate<AnyState>("drift"),
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

  // ---- intents -----------------------------------------------------------------

  sendMove(x: number, y: number) {
    this.room.send("move", { x, y });
  }

  sendGather(nodeId: number, speedMult: number) {
    this.room.send("gather", { nodeId, speedMult });
  }

  sendRespawn() {
    this.room.send("respawn");
  }

  sendIdentity(id: { name: string; dye: string; eye: string; title: string }) {
    this.room.send("identity", id);
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
