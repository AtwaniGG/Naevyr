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
  avatar: string;
  avA: string;
  avB: string;
  guildTag: string;
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

export interface NetMob {
  id: number;
  kind: string; // husk | stalker
  level: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: string; // wander | engaged | dead
  /** actually stepping on the server (drives the walk anim) */
  moving: boolean;
}

export interface NetGuild {
  id: number;
  name: string;
  tag: string;
  members: number;
  region: string;
  regionSecsLeft: number;
}

export interface NetRelic {
  id: number;
  key: string;
  price: number;
  sellerName: string;
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

export interface NetCaravan {
  run: number;
  phase: string; // idle | rolling | ambushed
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  gateX: number;
  gateY: number;
  departIn: number;
  wave: number;
  waves: number;
  waveKills: number;
  waveNeed: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyState = any;

export class NetClient {
  readonly room: Room<AnyState>;

  private constructor(room: Room<AnyState>) {
    this.room = room;
  }

  /** Join the shared world; resolves null if the server can't be reached.
   *  `address` rides along for the token entry gate (GATE_TOKENS servers);
   *  `proof` is the signed gateMessage proving the wallet is actually owned. */
  static async connect(
    url: string,
    timeoutMs: number,
    token: string,
    address?: string | null,
    proof?: { nonce: string; sig: string } | null,
  ): Promise<NetClient | null> {
    try {
      const room = await withTimeout(
        new Client(url).joinOrCreate<AnyState>("drift", {
          token,
          ...(address ? { address } : {}),
          ...(proof ? { gateNonce: proof.nonce, gateSig: proof.sig } : {}),
        }),
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

  forEachMob(fn: (m: NetMob) => void) {
    (this.room.state.mobs as Map<string, NetMob>).forEach((m) => fn(m));
  }

  forEachClaim(fn: (c: NetClaim) => void) {
    (this.room.state.claims as Map<string, NetClaim>).forEach((c) => fn(c));
  }

  forEachListing(fn: (l: NetListing) => void) {
    (this.room.state.listings as Map<string, NetListing>).forEach((l) => fn(l));
  }

  forEachGuild(fn: (g: NetGuild) => void) {
    (this.room.state.guilds as Map<string, NetGuild>)?.forEach((g) => fn(g));
  }

  forEachRelic(fn: (r: NetRelic) => void) {
    (this.room.state.relics as Map<string, NetRelic>)?.forEach((r) => fn(r));
  }

  forEachProp(fn: (p: NetProp) => void) {
    (this.room.state.props as Map<string, NetProp>).forEach((p) => fn(p));
  }

  get caravan(): NetCaravan | null {
    return (this.room.state.caravan as NetCaravan) ?? null;
  }

  get night(): { active: boolean; kills: number; need: number; endsIn: number } {
    const s = this.room.state;
    return {
      active: !!s.nightActive,
      kills: s.nightKills ?? 0,
      need: s.nightNeed ?? 0,
      endsIn: s.nightEndsIn ?? 0,
    };
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

  /** lock a shared beast's attention (it stops wandering) */
  sendEngage(id: number) {
    this.safeSend("engage", { id });
  }

  /** one swing at a shared beast (server clamps + rate-caps) */
  sendAttack(id: number, dmg: number) {
    this.safeSend("attack", { id, dmg });
  }

  sendIdentity(id: {
    name: string; dye: string; eye: string; title: string;
    aura: string; pet: string; avatar: string; avA: string; avB: string;
  }) {
    this.safeSend("identity", id);
  }

  sendBank(delta: number) {
    this.safeSend("bank", { delta });
  }

  sendSpin(burnSig?: string) {
    this.safeSend("spin", burnSig ? { burnSig } : undefined);
  }

  sendDonate(amount: number, burnSig?: string) {
    this.safeSend("donate", burnSig ? { burnSig } : { amount });
  }

  sendBurnQuote(action: string) {
    this.safeSend("burnQuote", { action });
  }

  sendBuyAura(key: string, burnSig: string) {
    this.safeSend("buyAura", { key, burnSig });
  }

  sendObeliskBurn(burnSig: string) {
    this.safeSend("obeliskBurn", { burnSig });
  }

  sendReinforce(burnSig: string) {
    this.safeSend("reinforce", { burnSig });
  }

  sendPrestige(key: string, burnSig: string) {
    this.safeSend("prestige", { key, burnSig });
  }

  // ---- the Drift Wheel + Caches (gacha cosmetics) ----
  sendDriftSpin(burnSig: string) {
    this.safeSend("driftSpin", { burnSig });
  }

  sendCache(burnSig: string) {
    this.safeSend("cache", { burnSig });
  }

  // ---- guilds ----
  sendGuildFound(name: string, tag: string, burnSig: string) {
    this.safeSend("guildFound", { name, tag, burnSig });
  }

  sendGuildJoin(id: number) {
    this.safeSend("guildJoin", { id });
  }

  sendGuildLeave() {
    this.safeSend("guildLeave", {});
  }

  sendGuildTerritory(region: string, burnSig: string) {
    this.safeSend("guildTerritory", { region, burnSig });
  }

  sendGuildUpkeep(burnSig: string) {
    this.safeSend("guildUpkeep", { burnSig });
  }

  // ---- the Exchange (gold ↔ DRIFTS) ----
  sendExInfo() {
    this.safeSend("exInfo", {});
  }

  sendExBuyQuote(gold: number) {
    this.safeSend("exBuyQuote", { gold });
  }

  sendExBuy(gold: number, sig: string) {
    this.safeSend("exBuy", { gold, sig });
  }

  sendExSell(gold: number) {
    this.safeSend("exSell", { gold });
  }

  // ---- the relic market (P2P Drift-touched cosmetics) ----
  sendRelicList(key: string, price: number) {
    this.safeSend("relicList", { key, price });
  }

  sendRelicUnlist(id: number) {
    this.safeSend("relicUnlist", { id });
  }

  sendRelicQuote(id: number) {
    this.safeSend("relicQuote", { id });
  }

  sendRelicBuy(id: number, sig: string) {
    this.safeSend("relicBuy", { id, sig });
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

  sendPitJoin(wager: number) {
    this.safeSend("pitJoin", { wager });
  }

  sendPitLeave() {
    this.safeSend("pitLeave");
  }

  requestWalletNonce() {
    this.safeSend("walletNonce");
  }

  sendLinkWallet(address: string, signatureHex: string) {
    this.safeSend("linkWallet", { address, signature: signatureHex });
  }

  sendUnlinkWallet() {
    this.safeSend("unlinkWallet");
  }

  sendChat(text: string, kind: "say" | "emote") {
    this.safeSend("chat", { text, kind });
  }

  sendClaim(x: number, y: number, burnSig?: string) {
    this.safeSend("claim", burnSig ? { x, y, burnSig } : { x, y });
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

  /** client-trusted gold event (mob loot, veins, quests…) → server ledger */
  sendGoldDelta(amount: number, reason: string) {
    this.safeSend("goldDelta", { amount, reason });
  }

  /** client-trusted item event (mob drops, eating…) → inventory ledger */
  sendItemDelta(item: string, qty: number, reason: string) {
    this.safeSend("itemDelta", { item, qty, reason });
  }

  /** cook fish (server moves fish → cooked on the inventory ledger) */
  sendCook(qty: number) {
    this.safeSend("cook", { qty });
  }

  /** forge a recipe (server debits the materials from the ledger) */
  sendCraft(id: string) {
    this.safeSend("craft", { id });
  }

  /** vendor sale (server debits the goods, credits gold at house prices) */
  sendSell(item: string, qty: number) {
    this.safeSend("sell", { item, qty });
  }

  sendQuestClaim(id: string) {
    this.safeSend("claimQuest", { id });
  }

  sendQuestReroll() {
    this.safeSend("questReroll", {});
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
