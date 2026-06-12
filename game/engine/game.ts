import { Camera } from "@/game/render/camera";
import { gridToIso, TILE_H, TILE_W, isoToGrid } from "@/game/render/iso";
import {
  World,
  buildingAt,
  townProtected,
  TOWN_BUILDINGS,
  ALL_STRUCTURES,
  WILD_STRUCTURES,
  TOWN_CENTER,
  TownBuilding,
  BuildingKey,
  regionAt as sharedRegionAt,
} from "@/game/world/tilemap";
import { Player } from "@/game/entities/player";
import { TutorialDirector, buildThreshold, THRESHOLD } from "@/game/engine/tutorial";
import { Drift } from "@/game/world/drift";
import { interiorFor, interiorNav, InteriorSpec } from "@/game/world/interior";
import { KEEPER_TALK, pickLine } from "@/game/world/keeperTalk";
import { findPath, adjacentWalkable } from "@/game/world/pathfinding";
import { startGathering, applyGatherLoot } from "@/game/systems/gathering";
import { gatherSpeedMultiplier, damageReduction, weaponBonus } from "@/game/systems/crafting";
import {
  Cell, ResourceKind, ResourceNode, codeToTile,
  CLAIM_COST, CLAIM_MAX, AURA_CATALOG, PropKey, AuraKey,
  walletLinkMessage, PRESTIGE_CATALOG, AvatarKind, SkillKey, SKILL_META,
} from "@/game/types";
import { useGame } from "@/game/state/store";
import { CombatManager } from "@/game/systems/combat";
import { Mob } from "@/game/entities/mob";
import { NetClient } from "@/game/net/client";
import {
  spriteCache, hash2,
  TileType, BeastKind, BeastAnim, DoodadKind, EquipVisual, LookVisual,
  DyeKey, EyeKey, PRESTIGE_AURAS, PrestigeAuraKey,
} from "@/game/render/sprites";
import { currentTitle } from "@/game/state/store";
import {
  applySnapshot,
  buildSnapshot,
  getDeviceToken,
  getGateWallet,
  getGateProof,
  takeDoorName,
  SaveData,
} from "@/game/state/persistence";
import { bus } from "@/game/state/bus";
import { tileToCode, BURN_COSTS } from "@/game/types";
import { initAudio, play } from "@/game/audio/sound";
import { Transaction } from "@solana/web3.js";

/** where each region's guild banner stands (decor only — no walkability
 *  change; cells chosen clear of every structure sprite) */
// the Pit's ring (duels seal fighters inside it; the client veils the realm)
const ARENA = (() => {
  const b = TOWN_BUILDINGS.find((s) => s.key === "pit")!;
  return { x: b.x, y: b.y, r: b.r };
})();
// ring-side watchers (DS arena set: hooded, faceless, ember-eyed)
const ARENA_CROWD: { x: number; y: number; v: "bone" | "blood" | "void" }[] = [
  { x: ARENA.x - 3, y: ARENA.y - 1, v: "bone" },
  { x: ARENA.x - 3, y: ARENA.y + 1, v: "blood" },
  { x: ARENA.x + 3, y: ARENA.y - 1, v: "void" },
  { x: ARENA.x + 3, y: ARENA.y + 1, v: "bone" },
  { x: ARENA.x - 1, y: ARENA.y - 3, v: "blood" },
  { x: ARENA.x + 1, y: ARENA.y + 3, v: "void" },
];
// torches at the sand's corners (the only light in the void)
const ARENA_TORCHES: { x: number; y: number }[] = [
  { x: ARENA.x - 3, y: ARENA.y - 3 }, { x: ARENA.x + 3, y: ARENA.y - 3 },
  { x: ARENA.x - 3, y: ARENA.y + 3 }, { x: ARENA.x + 3, y: ARENA.y + 3 },
];
// dried blood on the sand (the ring remembers every duel before this one)
const ARENA_BLOOD: { x: number; y: number; v: number }[] = [
  { x: ARENA.x - 1, y: ARENA.y + 1, v: 0 }, { x: ARENA.x + 1, y: ARENA.y - 1, v: 2 },
];

const REGION_BANNER_CELLS: Record<string, { x: number; y: number }> = {
  "Palewater": { x: 33, y: 5 },
  "The Ashen Flats": { x: 5, y: 12 },
  "Hollowmere Reach": { x: 10, y: 34 },
  "The Bonefields": { x: 35, y: 34 },
};

/** the slice of a browser Solana wallet (Phantom/Solflare/Backpack) we use */
interface WalletProvider {
  connect?: () => Promise<{ publicKey?: { toString(): string } } | undefined>;
  signMessage?: (
    message: Uint8Array,
    encoding?: string,
  ) => Promise<{ signature?: Uint8Array }>;
  signAndSendTransaction?: (tx: unknown) => Promise<{ signature?: string }>;
  publicKey?: { toString(): string };
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera = new Camera();
  world: World;
  player: Player;
  drift = new Drift();
  combat = new CombatManager();
  /** THE THRESHOLD: non-null while running the first-login tutorial */
  private tutorial: TutorialDirector | null = null;

  private raf = 0;
  private last = 0;
  private dpr = 1;
  private running = false;

  private pendingNode: ResourceNode | null = null;
  private pendingMob: Mob | null = null;
  private hover: { x: number; y: number } | null = null;
  private clickMarker: { x: number; y: number; t: number } | null = null;

  /** screen positions of visible corrupt tiles, refreshed each ground pass */
  private corruptGlows: { sx: number; sy: number }[] = [];

  // ---- multiplayer (null = offline, local sim) ----
  private net: NetClient | null = null;
  private remotes = new Map<string, Player>();
  /** schema mob id → local puppet (lives inside combat.mobs for draw/click) */
  private netMobs = new Map<number, Mob>();
  /** local visual for the server-run gather timer (progress arc + swing) */
  private gatherVis: { nodeId: number; start: number; total: number } | null = null;
  /** last cosmetic identity pushed to the server (resend on change) */
  private sentIdentity = "";

  // ---- juice: floaters / sparks / shake / level-up flash ----
  private floaters: { gx: number; gy: number; txt: string; color: string; t0: number }[] = [];
  private sparkParts: { gx: number; gy: number; vx: number; vy: number; t0: number; color: string }[] = [];
  private shakeUntil = 0;
  private shakeMag = 0;
  private levelFlashT0 = 0;
  private lastLevels: number[] | null = null;

  // ---- world events + living-world bits ----
  /** corruption thresholds that wake a Colossus (consumed in order) */
  private bossThresholds = [10, 25, 40, 60, 80];
  private driftfallFx: { gx: number; gy: number; t0: number } | null = null;
  /** reinforce ward-pulse: a gold ring closing over the claim, ~1.8s */
  private wardFx: { gx: number; gy: number; t0: number } | null = null;
  private minimapTimer = 0;

  // ---- danger & depth ----
  /** your unclaimed grave: half your gold waits here for 5 minutes */
  private tomb: { x: number; y: number; gold: number; t0: number } | null = null;
  private corruptTickT = 0;
  private corruptWarned = false;
  /** drives the red hurt vignette */
  private lastHurtT0 = 0;
  private region = "";
  private banner: { name: string; t0: number } | null = null;
  private storm: { until: number } | null = null;
  private nextStormAt = performance.now() + 180_000 + Math.random() * 180_000;
  private stepAcc = 0;
  /** seconds since the last progress push to the server */
  private netSaveT = 0;
  /** ids of land claims this player owns */
  private myClaimIds = new Set<number>();
  /** shop to open when we arrive at its door */
  private pendingShop: TownBuilding | null = null;
  /** furnishing armed for placement (already paid; refunded on failure) */
  private propPlaceKind: PropKey | null = null;
  /** opponent sessionId while dueling */
  private duelOpp: string | null = null;
  private duelLastSwing = 0;
  /** any live duel (everyone sees the ring crowd; fighters get the arena veil) */
  private activeDuel: { a: string; b: string } | null = null;
  /** when I last won in the Pit (drives the floating victory plate) */
  private victoryAt = 0;
  /** ids of market listings this player owns */
  private myListingIds = new Set<number>();
  /** gold already deducted for an in-flight buy (refunded on failure) */

  private cleanupFns: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, opts?: { tutorial?: boolean }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    if (opts?.tutorial) {
      // THE THRESHOLD: a handcrafted pocket world, no server, no ambient sim
      this.world = new World(THRESHOLD.w, THRESHOLD.h);
      buildThreshold(this.world);
      this.player = new Player(THRESHOLD.spawn.x, THRESHOLD.spawn.y);
      this.tutorial = new TutorialDirector(this.world, this.player, this.combat);
    } else {
      this.world = new World(40, 40);
      this.player = new Player(20, 20);
    }
    const iso = gridToIso(this.player.px, this.player.py);
    this.camera.snapTo(iso.x, iso.y);

    spriteCache.init();

    if (!this.tutorial) {
      this.combat.spawn(this.world, 8);
      this.spawnDenPack();
    }
    this.wireCombat();

    this.drift.onRelocate = (kind) =>
      useGame.getState().pushLog(`A ${kind} re-forms somewhere in the Drift…`, "#7c6f93");
    // offline driftfall (online: the server's Drift fires and broadcasts)
    this.drift.onDriftfall = (cell) => this.announceDriftfall(cell.x, cell.y);
    // the Waystation never falls to the Drift (offline sim; server has its own)
    this.drift.isProtected = (x, y) => townProtected(x, y);
    this.drift.onSeason = () => {
      const store = useGame.getState();
      store.bumpSeason();
      store.setDriftPct(this.corruptionPct());
      store.pushLog("The Drift deepens. A new season corrupts the land.", "#a855f7");
    };

    this.bindEvents();
    this.resize();
  }

  /** share of land tiles (non-water) consumed by the Drift */
  private corruptionPct(): number {
    let corrupt = 0;
    let land = 0;
    for (const t of this.world.tiles) {
      if (t === "water") continue;
      land++;
      if (t === "corrupt") corrupt++;
    }
    return land > 0 ? (corrupt / land) * 100 : 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    if (!this.tutorial) useGame.getState().pushLog("You awaken in Naevyr.", "#d8cfe0");
    this.cleanupFns.push(bus.on("chat", (text) => this.handleChatInput(text)));
    this.cleanupFns.push(bus.on("emote", (e) => this.handleChatInput(`/${e}`)));
    this.cleanupFns.push(bus.on("stake", () => this.toggleClaimMode()));
    this.cleanupFns.push(bus.on("marketList", (m) => this.marketList(m)));
    this.cleanupFns.push(bus.on("marketBuy", (id) => this.marketBuy(id)));
    this.cleanupFns.push(bus.on("marketUnlist", (id) => this.net?.sendUnlist(id)));
    this.cleanupFns.push(bus.on("bank", (delta) => this.net?.sendBank(delta)));
    this.cleanupFns.push(bus.on("spin", () => this.net?.sendSpin()));
    this.cleanupFns.push(bus.on("questClaim", (id) => this.net?.sendQuestClaim(id)));
    this.cleanupFns.push(bus.on("questReroll", () => this.net?.sendQuestReroll()));
    this.cleanupFns.push(bus.on("donate", (amt) => this.net?.sendDonate(amt)));
    this.cleanupFns.push(
      bus.on("placeProp", (kind) => {
        this.propPlaceKind = kind as PropKey;
        useGame.getState().pushLog("Choose a spot on your claim.", "#e7c873");
        useGame.getState().setOpenShop(null);
      }),
    );
    this.cleanupFns.push(
      bus.on("challenge", (c) => this.net?.sendChallenge(c.target, c.wager)),
    );
    this.cleanupFns.push(
      bus.on("pitJoin", (wager) => this.net?.sendPitJoin(wager)),
    );
    this.cleanupFns.push(
      bus.on("pitLeave", () => this.net?.sendPitLeave()),
    );
    this.cleanupFns.push(
      bus.on("walletLink", (link) => {
        if (link) void this.startWalletLink();
        else this.net?.sendUnlinkWallet();
      }),
    );
    // client-trusted gold/item events ride to the server ledgers (no-op offline)
    this.cleanupFns.push(
      bus.on("goldDelta", (d) => this.net?.sendGoldDelta(d.amount, d.reason)),
    );
    this.cleanupFns.push(
      bus.on("itemDelta", (d) => this.net?.sendItemDelta(d.item, d.qty, d.reason)),
    );
    this.cleanupFns.push(bus.on("cook", (c) => this.net?.sendCook(c.qty)));
    this.cleanupFns.push(bus.on("sell", (s) => this.net?.sendSell(s.item, s.qty)));
    this.cleanupFns.push(bus.on("craft", (c) => this.net?.sendCraft(c.id)));
    this.cleanupFns.push(bus.on("spinBurn", () => this.startBurn("spin")));
    this.cleanupFns.push(bus.on("cleanseBurn", () => this.startBurn("cleanse")));
    this.cleanupFns.push(bus.on("auraBurn", (key) => this.startBurn("aura", { key })));
    this.cleanupFns.push(bus.on("obeliskBurn", () => this.startBurn("obelisk")));
    this.cleanupFns.push(bus.on("reinforceBurn", () => this.startBurn("reinforce")));
    this.cleanupFns.push(
      bus.on("prestigeBurn", (key) => {
        const entry = PRESTIGE_CATALOG[key];
        if (entry) this.startBurn(entry.action, { key });
      }),
    );
    this.cleanupFns.push(
      bus.on("avatarPreview", (pv) => {
        this.avatarPreview = pv ? { kind: pv.kind as AvatarKind, a: pv.a, b: pv.b } : null;
      }),
    );
    this.cleanupFns.push(bus.on("driftSpinBurn", () => this.startBurn("driftSpin")));
    this.cleanupFns.push(bus.on("cacheBurn", () => this.startBurn("cache")));
    this.cleanupFns.push(
      bus.on("guildFound", (g) => this.startBurn("guildFound", { name: g.name, tag: g.tag })),
    );
    this.cleanupFns.push(bus.on("guildJoin", (id) => this.net?.sendGuildJoin(id)));
    this.cleanupFns.push(bus.on("guildLeave", () => this.net?.sendGuildLeave()));
    this.cleanupFns.push(
      bus.on("guildTerritory", (region) => this.startBurn("guildTerritory", { region })),
    );
    this.cleanupFns.push(bus.on("guildUpkeep", () => this.startBurn("guildUpkeep")));
    this.cleanupFns.push(bus.on("exInfo", () => this.net?.sendExInfo()));
    this.cleanupFns.push(
      bus.on("exBuy", (gold) => {
        const store = useGame.getState();
        if (!this.net || !store.wallet) {
          store.pushLog("The Exchange needs a linked wallet in the shared world.", "#6f6781");
          return;
        }
        this.pendingExGold = gold;
        this.net.sendExBuyQuote(gold);
      }),
    );
    this.cleanupFns.push(bus.on("exSell", (gold) => this.net?.sendExSell(gold)));
    this.cleanupFns.push(bus.on("relicList", (r) => this.net?.sendRelicList(r.key, r.price)));
    this.cleanupFns.push(bus.on("relicUnlist", (id) => this.net?.sendRelicUnlist(id)));
    this.cleanupFns.push(
      bus.on("relicBuy", (id) => {
        const store = useGame.getState();
        if (!this.net || !store.wallet) {
          store.pushLog("Relics trade wallet to wallet. Link one first.", "#6f6781");
          return;
        }
        this.pendingRelicId = id;
        this.net.sendRelicQuote(id);
      }),
    );
    this.cleanupFns.push(
      bus.on("duelAccept", () => {
        const store = useGame.getState();
        const ch = store.duelChallenge;
        if (!ch) return;
        store.setDuelChallenge(null);
        if (store.gold < ch.wager) {
          store.pushLog(`You can't cover the ${ch.wager}g wager.`, "#6f6781");
          return;
        }
        this.net?.sendAcceptDuel(ch.from, ch.wager);
      }),
    );
    if (this.tutorial) this.tutorial.start();
    else void this.connect(); // the Threshold never joins the shared world
  }

  // ---- Phase 5: Solana wallet link (devnet) -------------------------------------
  // Browser wallet (Phantom/Solflare/Backpack) signs a server nonce; the server
  // verifies and binds wallet ↔ guest token. No chain calls yet — just identity.

  /** wallet provider + address held between nonce request and signature */
  private pendingWallet: { provider: WalletProvider; address: string } | null = null;

  /** the injected browser wallet, if any */
  private detectWallet(): WalletProvider | undefined {
    const w = window as unknown as Record<string, WalletProvider | { solana?: WalletProvider } | undefined>;
    return (
      (w.phantom as { solana?: WalletProvider } | undefined)?.solana ??
      (w.solana as WalletProvider | undefined) ??
      (w.solflare as WalletProvider | undefined) ??
      (w.backpack as WalletProvider | undefined)
    );
  }

  private async startWalletLink() {
    const store = useGame.getState();
    if (!this.net) {
      store.pushLog("Wallets link in the shared world. Start the server first.", "#6f6781");
      return;
    }
    const provider = this.detectWallet();
    if (!provider?.connect || !provider.signMessage) {
      store.pushLog("No Solana wallet found. Install Phantom, then retry.", "#6f6781");
      return;
    }
    try {
      const resp = await provider.connect();
      const address =
        resp?.publicKey?.toString?.() ?? provider.publicKey?.toString?.() ?? "";
      if (!address) {
        store.pushLog("The wallet gave no address. Strange winds.", "#6f6781");
        return;
      }
      this.pendingWallet = { provider, address };
      this.net.requestWalletNonce();
    } catch {
      store.pushLog("The wallet declined. No link was made.", "#6f6781");
    }
  }

  private async signWalletNonce(nonce: string) {
    const store = useGame.getState();
    const pending = this.pendingWallet;
    this.pendingWallet = null;
    if (!pending || !this.net) return;
    try {
      const message = new TextEncoder().encode(
        walletLinkMessage(pending.address, nonce),
      );
      const result = await pending.provider.signMessage!(message, "utf8");
      const sig: Uint8Array = result.signature ?? (result as unknown as Uint8Array);
      const hex = Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
      this.net.sendLinkWallet(pending.address, hex);
    } catch {
      store.pushLog("Signing was declined. No link was made.", "#6f6781");
    }
  }

  // ---- Phase 5: token burns (devnet) ----------------------------------------------
  // quote → wallet countersigns the server-built burn tx → action message
  // carries the tx signature → server verifies the burn on-chain.

  private pendingBurn: {
    action: string; x?: number; y?: number; key?: string;
    name?: string; tag?: string; region?: string;
  } | null = null;
  /** an Exchange buy awaiting its quote (gold amount) */
  private pendingExGold = 0;
  /** a relic purchase awaiting its quote (listing id) */
  private pendingRelicId = 0;
  /** the Dyeworks glass: a premium-avatar try-on (your own draw only, never
   *  synced; cleared on interior exit / dialogue close) */
  avatarPreview: { kind: AvatarKind; a: string; b: string } | null = null;

  private startBurn(
    action: "spin" | "claim" | "aura" | "cleanse" | "obelisk" | "reinforce"
      | "prestigeDye" | "prestigeAura" | "prestigeTitle" | "prestigeAvatar"
      | "driftSpin" | "cache" | "guildFound" | "guildTerritory" | "guildUpkeep",
    extra: { x?: number; y?: number; key?: string; name?: string; tag?: string; region?: string } = {},
  ) {
    const store = useGame.getState();
    if (!this.net || !store.wallet) {
      store.pushLog("Burn rites need a linked wallet in the shared world.", "#6f6781");
      return;
    }
    this.pendingBurn = { action, ...extra };
    this.net.sendBurnQuote(action);
  }

  /** countersign + submit any server-built partial-signed tx (Exchange buys,
   *  relic purchases — same wallet rail the burns ride) */
  private async signAndSubmit(txB64: string, onSig: (sig: string) => void) {
    const store = useGame.getState();
    const provider = this.detectWallet();
    if (!provider?.signAndSendTransaction) {
      store.pushLog("No Solana wallet found to sign the trade.", "#6f6781");
      return;
    }
    try {
      await provider.connect?.();
      const raw = Uint8Array.from(atob(txB64), (c) => c.charCodeAt(0));
      const tx = Transaction.from(raw);
      const { signature } = await provider.signAndSendTransaction(tx);
      if (!signature) throw new Error("no signature");
      onSig(signature);
    } catch {
      store.pushLog(
        "The trade was declined or failed. Nothing was taken. (Is your wallet on the right network?)",
        "#6f6781",
      );
    }
  }

  private async signBurnQuote(txB64: string) {
    const store = useGame.getState();
    const pending = this.pendingBurn;
    this.pendingBurn = null;
    if (!pending || !this.net) return;
    const provider = this.detectWallet();
    if (!provider?.signAndSendTransaction) {
      store.pushLog("No Solana wallet found to sign the burn.", "#6f6781");
      return;
    }
    try {
      await provider.connect?.();
      const raw = Uint8Array.from(atob(txB64), (c) => c.charCodeAt(0));
      const tx = Transaction.from(raw);
      const { signature } = await provider.signAndSendTransaction(tx);
      if (!signature) throw new Error("no signature");
      store.pushLog("The DRIFTS burn. Awaiting the chain's word…", "#d8b4fe");
      switch (pending.action) {
        case "spin":    this.net.sendSpin(signature); break;
        case "cleanse": this.net.sendDonate(0, signature); break;
        case "aura":    this.net.sendBuyAura(pending.key ?? "", signature); break;
        case "claim":   this.net.sendClaim(pending.x ?? 0, pending.y ?? 0, signature); break;
        case "obelisk": this.net.sendObeliskBurn(signature); break;
        case "reinforce": this.net.sendReinforce(signature); break;
        case "prestigeDye":
        case "prestigeAura":
        case "prestigeTitle":
        case "prestigeAvatar":
          this.net.sendPrestige(pending.key ?? "", signature); break;
        case "driftSpin": this.net.sendDriftSpin(signature); break;
        case "cache": this.net.sendCache(signature); break;
        case "guildFound":
          this.net.sendGuildFound(pending.name ?? "", pending.tag ?? "", signature); break;
        case "guildTerritory":
          this.net.sendGuildTerritory(pending.region ?? "", signature); break;
        case "guildUpkeep": this.net.sendGuildUpkeep(signature); break;
      }
    } catch {
      store.pushLog(
        "The burn was declined or failed. Nothing was taken. (Is your wallet on the right network?)",
        "#6f6781",
      );
    }
  }

  // ---- marketplace (both ledgers live on the server now) -----------------------

  private marketList(m: { item: string; qty: number; price: number }) {
    const store = useGame.getState();
    if (!this.net) {
      store.pushLog("The market needs the shared world (server offline).", "#6f6781");
      return;
    }
    // the server ledger escrows the goods; this check is just fast feedback
    if (store.inventory[m.item as never] < m.qty) {
      store.pushLog("You don't carry that much.", "#6f6781");
      return;
    }
    this.net.sendList(m.item, m.qty, m.price);
  }

  private marketBuy(id: number) {
    const store = useGame.getState();
    const ls = store.listings.find((l) => l.id === id);
    if (!this.net || !ls) return;
    // the server ledger pays; this check is just fast feedback
    if (store.gold < ls.price) {
      store.pushLog(`That costs ${ls.price}g. You carry ${store.gold}g.`, "#6f6781");
      return;
    }
    this.net.sendBuy(id);
  }

  private toggleClaimMode() {
    const store = useGame.getState();
    if (!this.net) {
      store.pushLog("Land can only be staked in the shared world (server offline).", "#6f6781");
      return;
    }
    const burning = !!(store.wallet && store.holder); // holders stake with burns
    if (!store.claimMode && !burning && store.gold < CLAIM_COST) {
      store.pushLog(`Staking a claim costs ${CLAIM_COST}g. You carry ${store.gold}g.`, "#6f6781");
      return;
    }
    store.setClaimMode(!store.claimMode);
    if (useGame.getState().claimMode) {
      store.pushLog(
        burning
          ? `Choose your ground. Staking burns ${BURN_COSTS.claim.toLocaleString()} DRIFTS (Holder rite).`
          : "Choose your ground. Click to stake a 3×3 claim.",
        "#e7c873",
      );
    }
  }

  // ---- chat & emotes -----------------------------------------------------------

  private static EMOTES: Record<string, string> = {
    wave: "waves", sit: "sits down", point: "points", dance: "dances",
  };

  private handleChatInput(raw: string) {
    initAudio();
    let text = raw.trim().slice(0, 120);
    if (!text) return;
    let kind: "say" | "emote" = "say";
    if (text.startsWith("/")) {
      const verb = Game.EMOTES[text.slice(1).split(" ")[0].toLowerCase()];
      if (!verb) {
        useGame.getState().pushLog(`Unknown emote. Try: /wave /sit /point /dance`, "#6f6781");
        return;
      }
      kind = "emote";
      text = verb;
    }
    if (this.net) {
      this.net.sendChat(text, kind);
      return; // bubble + log arrive via the broadcast (everyone incl. us)
    }
    this.showChat(this.player, useGame.getState().cosmetics.name, text, kind === "emote");
  }

  private showChat(p: Player, name: string, text: string, emote: boolean) {
    p.bubble = { text, t0: performance.now(), emote };
    const store = useGame.getState();
    if (emote) store.pushLog(`${name} ${text}.`, "#d8b4fe");
    else store.pushLog(`${name}: ${text}`, "#d8cfe0");
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.net?.leave();
    this.net = null;
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }

  // ---- multiplayer ------------------------------------------------------------

  /** Try to join the shared world; on failure the local sim keeps running. */
  private async connect() {
    const url = process.env.NEXT_PUBLIC_GAME_SERVER ?? "ws://localhost:2567";
    // the gate proof (wallet + signed nonce from the door) rides along so
    // GATE_TOKENS servers can verify ownership, not just the claimed address
    const proof = getGateProof();
    const address = getGateWallet();
    const net = await NetClient.connect(
      url, 2500, getDeviceToken(), address,
      proof && proof.address === address ? proof : null,
    );
    if (!net) {
      useGame.getState().pushLog("No shared world found. Wandering offline.", "#6f6781");
      return;
    }
    if (!this.running) {
      net.leave();
      return;
    }
    this.net = net;
    this.gatherVis = null;
    this.pendingNode = null;
    this.pendingMob = null;

    // adopt the server's world (map + nodes); local drift sim goes dormant
    this.applyNetWorld();

    // ambient beasts + the den pack are SHARED now (schema puppets); the local
    // manager only hosts event mobs (raiders, colossus) while online
    this.combat = new CombatManager();
    this.wireCombat();
    this.netMobs.clear();
    this.den.packIds = [];

    const self = net.self();
    if (self) {
      this.player.px = self.x;
      this.player.py = self.y;
      this.player.setPath([]);
      const iso = gridToIso(self.x, self.y);
      this.camera.snapTo(iso.x, iso.y);
    }

    const store = useGame.getState();
    store.setSeason(net.season);
    store.setDriftPct(net.driftPct);
    store.setPlayersOnline(net.playerCount());
    this.sentIdentity = "";
    this.pushIdentity(net);

    net.onMessage<{ kind: ResourceKind; qty?: number; rich?: boolean; depleted: boolean }>(
      "loot",
      (m) => applyGatherLoot(m.kind, m.depleted, m.qty, m.rich),
    );
    // the server ledgers speak: adopt the authoritative balances
    net.onMessage<{ gold: number }>("goldSync", (m) =>
      useGame.getState().setGold(m.gold),
    );
    net.onMessage<{ inv: Record<string, number> }>("invSync", (m) =>
      useGame.getState().setInventory(m.inv as never),
    );
    net.onMessage<{ day: number; quests: { id: string; progress: number; claimed: boolean }[] }>(
      "questSync",
      (m) => useGame.getState().setQuests(m.quests),
    );
    net.onMessage<{ id: string; xp: { skill: SkillKey; xp: number } }>(
      "questClaimed",
      (m) => {
        const store = useGame.getState();
        // gold already arrived via goldSync; board state via questSync. Apply
        // the XP (still client-side) and the flavor line.
        const { leveledTo } = store.addXp(m.xp.skill, m.xp.xp);
        play("coin");
        store.pushLog(`Quest complete. +${m.xp.xp} ${SKILL_META[m.xp.skill].label} XP`, "#e7c873");
        if (leveledTo) store.pushLog(`${SKILL_META[m.xp.skill].label} is now level ${leveledTo}!`, "#e7c873");
      },
    );

    // ---- shared mobs: the server retaliates and confirms kills ----
    net.onMessage<{ id: number; dmg: number }>("mobHit", (m) => {
      const store = useGame.getState();
      const dmg = Math.max(1, Math.round(m.dmg) - damageReduction());
      const remaining = store.damage(dmg);
      play("hurt");
      this.combat.onSelfHit?.(dmg);
      store.pushLog(`The Drift Beast hits you for ${dmg}.`, "#dc2626");
      if (remaining <= 0) this.combat.killPlayer(this.player);
    });
    net.onMessage<{
      id: number; kind: string; level: number; xp?: number;
      gold?: number; shards?: number; hide?: number;
    }>("mobKill", (m) => {
      const store = useGame.getState();
      store.questEvent({ type: "kill" });
      store.bumpKills();
      const { leveledTo } = store.addXp("combat", m.xp ?? 14 + m.level * 6);
      play("kill");
      // all loot already landed on the ledgers (goldSync/invSync carry it)
      if (m.gold) store.bumpStat("goldEarned", m.gold);
      if (m.kind === "colossus") {
        store.pushLog("THE COLOSSUS CRUMBLES. Loot: 5 Drift Shards + 50g.", "#e7c873");
      } else if (m.kind === "raider") {
        store.pushLog(`The raider falls. You loot ${m.gold}g from the body.`, "#e7c873");
      } else {
        store.pushLog(
          `The Drift Beast dissolves. Loot: Drift Shard${m.hide ? " + Beast Hide" : ""}.`,
          "#a855f7",
        );
      }
      if (leveledTo) store.pushLog(`Combat is now level ${leveledTo}!`, "#e7c873");
    });
    net.onMessage<{ x: number; y: number }>("colossus", (m) => {
      play("boss");
      this.banner = { name: "A COLOSSUS RISES", t0: performance.now() };
      this.shakeUntil = performance.now() + 600;
      this.shakeMag = 5;
      this.spawnFloater(m.x, m.y - 1.5, "THE COLOSSUS AWAKENS", "#a855f7");
      useGame
        .getState()
        .pushLog("The ground shudders. A COLOSSUS rises from the corruption…", "#a855f7");
    });
    net.onMessage<{ nodeId: number; totalMs: number }>("gatherStart", (m) => {
      this.gatherVis = { nodeId: m.nodeId, start: performance.now(), total: m.totalMs };
    });
    net.onMessage<{ kind: string }>("relocate", (m) =>
      useGame.getState().pushLog(`A ${m.kind} re-forms somewhere in the Drift…`, "#7c6f93"),
    );
    net.onMessage<{ id: string; name: string; text: string; kind: string }>(
      "chat",
      (m) => {
        const target =
          m.id === net.sessionId ? this.player : this.remotes.get(m.id);
        if (target) this.showChat(target, m.name, m.text, m.kind === "emote");
        if (m.id !== net.sessionId) play("chat");
      },
    );
    net.onMessage<{ x: number; y: number }>("driftfall", (m) =>
      this.announceDriftfall(m.x, m.y),
    );

    // ---- Caravans (server-authoritative wagon; raiders are local mobs) ----
    net.onMessage<{ run: number; gateX: number; gateY: number; waves: number }>(
      "caravanDepart",
      () => {
        this.banner = { name: "A CARAVAN ROLLS OUT", t0: performance.now() };
        useGame.getState().pushLog(
          "A caravan rolls out of the Waystation. Escort it for a cut of the pay.",
          "#e7c873",
        );
      },
    );
    net.onMessage<{
      run: number; x: number; y: number;
      wave: number; waves: number; count: number; level: number;
    }>("ambush", (m) => {
      // raiders are shared mobs now — the schema brings them; we just rattle
      this.banner = { name: "RAIDERS TAKE THE CARAVAN", t0: performance.now() };
      this.shakeUntil = performance.now() + 200;
      this.shakeMag = 3;
      useGame.getState().pushLog(
        `RAIDERS! Wave ${m.wave}/${m.waves} falls on the caravan. ${m.count} kills break it.`,
        "#dc2626",
      );
    });
    net.onMessage<{ run: number; wave: number; waves: number }>("waveCleared", (m) => {
      useGame.getState().pushLog(
        m.wave >= m.waves
          ? "The last raiders break. The wagon makes for the gate."
          : "The raiders break. The wagon rolls on.",
        "#e7c873",
      );
    });
    net.onMessage<{ run: number }>("caravanLost", () => {
      this.banner = { name: "THE CARAVAN IS LOST", t0: performance.now() };
      useGame.getState().pushLog(
        "The caravan is torn apart. The Drift keeps its goods.",
        "#dc2626",
      );
    });
    net.onMessage<{ run: number; pool: number; payouts: { name: string; kills: number; gold: number }[] }>(
      "caravanArrived",
      (m) => {
        this.banner = { name: "THE CARAVAN MAKES THE GATE", t0: performance.now() };
        useGame.getState().pushLog(
          m.payouts.length
            ? `The caravan reaches the gate. ${m.pool}g split among its escorts.`
            : "The caravan reaches the gate unescorted. No one collects.",
          "#e7c873",
        );
      },
    );
    net.onMessage<{ run: number; gold: number; kills: number }>("caravanPayout", (m) => {
      if (m.gold <= 0) return;
      const store = useGame.getState();
      store.bumpStat("goldEarned", m.gold); // ledger already paid; track the title stat
      play("coin");
      store.pushLog(
        `Caravan pay lands in your purse: ${m.gold}g for ${m.kills} raider${m.kills === 1 ? "" : "s"}.`,
        "#e7c873",
      );
    });
    // ---- wallet link (devnet) ----
    net.onMessage<{ nonce: string }>("walletNonce", (m) => {
      void this.signWalletNonce(m.nonce);
    });
    net.onMessage<{
      ok: boolean; address?: string | null; reason?: string;
      tokenBalance?: number; holder?: boolean; mint?: string | null;
    }>("walletResult", (m) => {
      const store = useGame.getState();
      if (!m.ok) {
        store.pushLog(m.reason ?? "The wallet link failed.", "#6f6781");
        return;
      }
      store.setWallet(m.address ?? null);
      store.setTokenStatus(m.tokenBalance ?? 0, m.holder ?? false);
      store.pushLog(
        m.address
          ? `Wallet bound: ${m.address.slice(0, 4)}…${m.address.slice(-4)}. Your wanderer is yours.`
          : "Wallet unbound. You walk as a guest again.",
        "#e7c873",
      );
      if (m.address && m.mint) {
        store.pushLog(
          m.holder
            ? `The token knows you. Holder confirmed (${m.tokenBalance} held).`
            : "No DRIFTS in this wallet yet. The gate stays shut.",
          m.holder ? "#d8b4fe" : "#6f6781",
        );
      }
    });
    // a burn just spent DRIFTS — adopt the server's fresh balance so the
    // in-realm HUD chip + holder-tier perks track it without a profile refetch
    net.onMessage<{ tokenBalance: number; holder: boolean }>("tokenSync", (m) =>
      useGame.getState().setTokenStatus(m.tokenBalance, m.holder),
    );

    // ---- THE LONG NIGHT + realm reset ----
    net.onMessage<{ durationMs: number; need: number; level: number }>("longNight", (m) => {
      const store = useGame.getState();
      play("boss");
      this.banner = { name: "THE LONG NIGHT FALLS", t0: performance.now() };
      this.shakeUntil = performance.now() + 600;
      this.shakeMag = 5;
      // the horde is made of shared mobs now — the schema brings them
      store.pushLog(
        `THE LONG NIGHT FALLS. Hold the Waystation: ${m.need} raiders must die before the dark wins.`,
        "#dc2626",
      );
    });
    net.onMessage<{ survived: boolean; driftPct: number }>("nightEnd", (m) => {
      const store = useGame.getState();
      if (m.survived) {
        this.banner = { name: "DAWN BREAKS", t0: performance.now() };
        store.pushLog(
          "DAWN. The horde breaks and the corruption burns back. The realm holds.",
          "#e7c873",
        );
        store.setDriftPct(m.driftPct);
        setTimeout(() => this.applyNetTiles(), 600);
      } else {
        store.pushLog("The dark takes the Waystation…", "#dc2626");
      }
    });
    net.onMessage<{ gold: number }>("nightReward", (m) => {
      const store = useGame.getState();
      store.bumpStat("goldEarned", m.gold); // ledger already paid
      play("levelup");
      store.pushLog(`You stood through the Long Night. ${m.gold}g for the dawn.`, "#e7c873");
    });
    net.onMessage<{ season: number }>("realmReset", (m) => {
      const store = useGame.getState();
      play("death");
      this.banner = { name: "THE DRIFT TAKES THE REALM", t0: performance.now() };
      store.pushLog(
        "THE DRIFT TAKES THE REALM. All claims fall. A new land rises from the ash…",
        "#a855f7",
      );
      this.tomb = null;
      this.propPlaceKind = null;
      store.setClaimMode(false);
      store.setSeason(m.season);
      store.setDriftPct(0);
      store.setMyClaims(0);
      this.myClaimIds.clear();
      // adopt the new world once the fresh schema patch lands
      setTimeout(() => {
        this.applyNetWorld();
        this.combat = new CombatManager();
        this.wireCombat();
        this.netMobs.clear(); // fresh schema beasts repopulate next frame
        this.den.packIds = [];
        this.lostTomb = null;
        const self = this.net?.self();
        if (self) {
          this.player.px = self.x;
          this.player.py = self.y;
          this.player.setPath([]);
          const iso = gridToIso(self.x, self.y);
          this.camera.snapTo(iso.x, iso.y);
        }
      }, 700);
    });

    // ---- token burns (devnet) ----
    net.onMessage<{ ok: boolean; action: string; amount?: number; tx?: string; reason?: string }>(
      "burnQuote",
      (m) => {
        if (!m.ok || !m.tx) {
          this.pendingBurn = null;
          useGame.getState().pushLog(m.reason ?? "The rite refused you.", "#6f6781");
          return;
        }
        void this.signBurnQuote(m.tx);
      },
    );
    net.onMessage<{ ok: boolean; action: string; reason?: string; pot?: number }>(
      "burnResult",
      (m) => {
        const store = useGame.getState();
        if (!m.ok) {
          store.pushLog(m.reason ?? "The burn was rejected.", "#dc2626");
          return;
        }
        if (m.action === "cleanse") {
          store.pushLog(`The Pale Flame drinks the burn: +${m.pot}g to the pot.`, "#efe9f4");
        }
        if (m.action === "obelisk") {
          store.rerollQuests();
          store.pushLog("THE ASH ACCEPTS. The day's tasks are rewritten.", "#d8b4fe");
        }
      },
    );
    net.onMessage<{ ok: boolean; key?: string; reason?: string }>("auraResult", (m) => {
      const store = useGame.getState();
      if (!m.ok || !m.key) {
        store.pushLog(m.reason ?? "The aura burn failed.", "#dc2626");
        return;
      }
      store.grantCosmetic("aura", m.key);
      store.setCosmetics({ aura: m.key as AuraKey });
      store.pushLog("The Dyeworks takes your burned DRIFTS. The aura clings to you.", "#d8b4fe");
    });

    // Drift-touched cosmetics (burn-only): the server's word grants ownership
    net.onMessage<{ ok: boolean; key?: string; kind?: string; reason?: string }>(
      "prestigeResult",
      (m) => {
        const store = useGame.getState();
        if (!m.ok || !m.key) {
          store.pushLog(m.reason ?? "The rite failed. Nothing was taken.", "#dc2626");
          return;
        }
        const entry = PRESTIGE_CATALOG[m.key];
        if (m.kind === "dye") {
          store.grantCosmetic("dye", m.key);
          store.setCosmetics({ dye: m.key as DyeKey });
          store.pushLog("The vat drinks your DRIFTS. The cloth comes out wrong, and beautiful.", "#d8b4fe");
        } else if (m.kind === "aura") {
          store.grantCosmetic("aura", m.key);
          store.setCosmetics({ aura: m.key as AuraKey });
          store.pushLog("The burned DRIFTS settle around you and stay.", "#d8b4fe");
        } else if (m.kind === "title") {
          store.grantCosmetic("title", entry?.label ?? m.key);
          store.pushLog(`The realm will know you as ${entry?.label ?? m.key}.`, "#d8b4fe");
        } else if (m.kind === "avatar") {
          store.grantCosmetic("avatar", m.key);
          // wear it with whatever the glass was showing (or the defaults)
          const pv = this.avatarPreview;
          store.setCosmetics({
            avatar: m.key as AvatarKind,
            avA: pv?.kind === m.key ? pv.a : "",
            avB: pv?.kind === m.key ? pv.b : "",
          });
          this.avatarPreview = null;
          store.pushLog(`The glass empties. ${entry?.label ?? m.key} walks out wearing you.`, "#d8b4fe");
        }
        play("coin");
      },
    );

    // claim reinforcement: the schema sync carries the integrity; this is the word
    net.onMessage<{ ok: boolean; x?: number; y?: number; integrity?: number; reason?: string }>(
      "reinforceResult",
      (m) => {
        const store = useGame.getState();
        if (!m.ok) {
          store.pushLog(m.reason ?? "The warding would not take.", "#dc2626");
          return;
        }
        store.pushLog(
          `The burned DRIFTS seep into the boundary stones. Your warding stands at ${m.integrity}%.`,
          "#d8b4fe",
        );
      },
    );
    net.onMessage<{ x: number; y: number }>("claimReinforced", (m) => {
      this.wardFx = { gx: m.x, gy: m.y, t0: performance.now() };
    });

    // the Founder window: first burn inside it marks the wanderer forever
    net.onMessage("founder", () => {
      const store = useGame.getState();
      store.grantCosmetic("title", "Founder");
      store.grantCosmetic("aura", "ashen_crown");
      store.pushLog(
        "You burned when the realm was young. The Ashen Crown is yours, Founder.",
        "#e7c873",
      );
    });

    // server-stored progress: apply it, or seed the server with local progress
    net.onMessage<{
      snapshot: SaveData | null;
      myClaims?: number[];
      myListings?: number[];
      escrowGold?: number;
      gold?: number;
      inv?: Record<string, number>;
      banked?: number;
      wallet?: string | null;
      tokenBalance?: number;
      holder?: boolean;
      founder?: boolean;
      prestige?: string[];
    }>("profile", (m) => {
      const store = useGame.getState();
      const sworn = takeDoorName(); // the door outranks the stored snapshot
      if (m.snapshot) {
        applySnapshot(m.snapshot);
        this.sentIdentity = ""; // re-push identity from the restored cosmetics
        store.pushLog("Your story continues where it left off.", "#a99fb8");
      } else {
        net.sendSave(buildSnapshot());
      }
      if (sworn) store.setCosmetics({ name: sworn });
      // the ledgers outrank whatever the snapshot remembered
      if (typeof m.gold === "number") store.setGold(m.gold);
      if (m.inv) store.setInventory(m.inv as never);
      this.myClaimIds = new Set(m.myClaims ?? []);
      store.setMyClaims(this.myClaimIds.size);
      this.myListingIds = new Set(m.myListings ?? []);
      if (typeof m.banked === "number") store.setBanked(m.banked);
      store.setWallet(m.wallet ?? null);
      store.setTokenStatus(m.tokenBalance ?? 0, m.holder ?? false);
      if (m.founder) {
        // idempotent: the server flag re-grants on every device
        store.grantCosmetic("title", "Founder");
        store.grantCosmetic("aura", "ashen_crown");
      }
      // server-authoritative Drift-touched ownership (so a returning owner on a
      // fresh device knows what they've burned for, without re-burning)
      for (const key of m.prestige ?? []) {
        const entry = PRESTIGE_CATALOG[key];
        if (!entry) continue;
        if (entry.kind === "title") store.grantCosmetic("title", entry.label);
        else store.grantCosmetic(entry.kind, key); // "dye" | "aura"
      }
      if (m.escrowGold && m.escrowGold > 0) {
        store.bumpStat("goldEarned", m.escrowGold); // ledger already paid
        play("coin");
        store.pushLog(
          `Your market stall earned ${m.escrowGold}g while you wandered.`,
          "#e7c873",
        );
      }
    });
    net.requestProfile();

    // ---- marketplace ----
    net.onMessage<{ ok: boolean; id?: number; reason?: string; item?: string; qty?: number }>(
      "listResult",
      (m) => {
        const store = useGame.getState();
        if (m.ok && m.id != null) {
          this.myListingIds.add(m.id);
          store.pushLog("Your offer is on the market.", "#e7c873");
        } else {
          // the ledger only escrows goods for listings that stand
          store.pushLog(`Listing refused: ${m.reason ?? "the market balks"}.`, "#dc2626");
        }
      },
    );
    net.onMessage<{ ok: boolean; item?: string; qty?: number }>("unlistResult", (m) => {
      const store = useGame.getState();
      if (m.ok && m.item && m.qty) {
        // the ledger already returned the goods (invSync carries them)
        store.pushLog("Offer withdrawn. Goods returned to your satchel.", "#a99fb8");
      }
    });
    net.onMessage<{ ok: boolean; item?: string; qty?: number; price?: number; reason?: string }>(
      "buyResult",
      (m) => {
        const store = useGame.getState();
        if (m.ok && m.item && m.qty) {
          // goods arrive via invSync; the ledger already holds them
          play("coin");
          store.pushLog(`Bought ${m.qty}× for ${m.price}g.`, "#e7c873");
        } else {
          // the ledger never paid, so there is nothing to give back
          store.pushLog(`Purchase failed: ${m.reason ?? "offer gone"}.`, "#dc2626");
        }
      },
    );
    net.onMessage<{ item: string; qty: number; gold: number; buyer: string }>("sold", (m) => {
      const store = useGame.getState();
      store.bumpStat("goldEarned", m.gold); // ledger already paid
      play("coin");
      store.pushLog(`${m.buyer} bought your ${m.qty}× listing. +${m.gold}g.`, "#e7c873");
    });

    // ---- the Waystation ----
    net.onMessage<{ ok: boolean; banked: number; delta?: number; fee?: number; reason?: string }>(
      "bankResult",
      (m) => {
        const store = useGame.getState();
        if (m.ok) {
          store.setBanked(m.banked);
          if (m.delta && m.delta < 0) {
            // the ledger already received the net amount (goldSync carries it)
            const gross = -m.delta;
            store.pushLog(`Withdrew ${gross}g (${m.fee ?? 0}g handling fee).`, "#e7c873");
          } else if (m.delta && m.delta > 0) {
            store.pushLog(`${m.delta}g locked safely in the Vault.`, "#a99fb8");
          }
          play("coin");
        } else {
          store.pushLog(`The Vault refuses: ${m.reason ?? "?"}.`, "#dc2626");
        }
      },
    );
    net.onMessage<{ ok: boolean; gold?: number; shards?: number; label?: string; seg?: number; reason?: string }>(
      "spinResult",
      (m) => {
        const store = useGame.getState();
        if (!m.ok) {
          store.pushLog(m.reason ?? "The Wheel refuses you.", "#6f6781");
          return;
        }
        const gold = m.gold ?? 0;
        if (gold > 0) store.bumpStat("goldEarned", gold); // ledgers already paid
        // shards land via invSync; nothing to add locally
        play(gold >= 500 ? "levelup" : gold > 0 || (m.shards ?? 0) > 0 ? "coin" : "ui");
        store.pushLog(`The Wheel: ${m.label}`, gold >= 500 ? "#fcd34d" : "#d8cfe0");
        // the popup wheel spins and lands on the house's roll
        store.setWheelSpin({
          kind: "gold",
          seg: m.seg ?? 0,
          prizes: [{ label: m.label ?? "", shards: m.shards }],
        });
      },
    );

    // the Drift Wheel (and Caches): cosmetics ride the result; shards via invSync
    net.onMessage<{
      ok: boolean;
      prizes?: { kind: string; key?: string; shards?: number; dup?: boolean; label: string; seg: number }[];
      pity?: number; cache?: boolean; reason?: string;
    }>("driftSpinResult", (m) => {
      const store = useGame.getState();
      if (!m.ok || !m.prizes) {
        store.pushLog(m.reason ?? "The Drift Wheel refuses you.", "#6f6781");
        return;
      }
      for (const p of m.prizes) {
        if (p.dup || !p.key) continue;
        if (p.kind === "dye" || p.kind === "eye" || p.kind === "aura" || p.kind === "pet") {
          store.grantCosmetic(p.kind, p.key);
        } else if (p.kind === "prestigeAura") {
          store.grantCosmetic("aura", p.key);
        } else if (p.kind === "title") {
          store.grantCosmetic("title", p.key);
        }
      }
      const rare = m.prizes.some((p) => p.kind === "prestigeAura" && !p.dup);
      play(rare ? "levelup" : "coin");
      store.setWheelSpin({ kind: "drift", seg: m.prizes[0].seg, prizes: m.prizes, pity: m.pity, cache: m.cache });
      for (const p of m.prizes) {
        store.pushLog(
          `The Drift Wheel: ${p.label}${p.dup ? ` (again — ${p.shards} shards instead)` : ""}`,
          p.kind === "prestigeAura" ? "#d8b4fe" : "#d8cfe0",
        );
      }
    });

    // guilds: results + banner news
    net.onMessage<{
      ok: boolean; id?: number; name?: string; tag?: string; left?: boolean;
      region?: string; until?: number; reason?: string;
    }>("guildResult", (m) => {
      const store = useGame.getState();
      if (!m.ok) {
        store.pushLog(m.reason ?? "The guild charter refuses.", "#dc2626");
        return;
      }
      if (m.left) store.pushLog("You fold your colors and walk alone.", "#a99fb8");
      else if (m.region) store.pushLog(`Your banner stands over ${m.region}.`, "#e7c873");
      else if (m.name) store.pushLog(`You march under ${m.name} [${m.tag}].`, "#e7c873");
      play("ui");
    });
    net.onMessage<{ tag: string; region: string; fallen?: boolean }>("guildBanner", (m) => {
      const store = useGame.getState();
      store.pushLog(
        m.fallen
          ? `The [${m.tag}] banner over ${m.region} falls to the Drift.`
          : `[${m.tag}] raises its banner over ${m.region}.`,
        m.fallen ? "#a99fb8" : "#d8b4fe",
      );
    });

    // the Exchange: info, quotes (sign + submit), results
    net.onMessage<import("@/game/state/store").ExchangeInfo>("exInfo", (m) => {
      useGame.getState().setExchange(m);
    });
    net.onMessage<{ ok: boolean; dir?: string; gold?: number; cost?: number; tx?: string; reason?: string }>(
      "exQuote",
      (m) => {
        const store = useGame.getState();
        if (!m.ok || !m.tx) {
          store.pushLog(m.reason ?? "The merchant shakes his head.", "#6f6781");
          return;
        }
        void this.signAndSubmit(m.tx, (sig) => {
          this.net?.sendExBuy(this.pendingExGold, sig);
          store.pushLog("The DRIFTS cross the counter. Awaiting the chain's word…", "#d8b4fe");
        });
      },
    );
    net.onMessage<{ ok: boolean; dir?: string; gold?: number; drifts?: number; cost?: number; reason?: string; pending?: boolean }>(
      "exResult",
      (m) => {
        const store = useGame.getState();
        if (!m.ok) {
          store.pushLog(m.reason ?? "The trade fell through. Nothing moved.", "#dc2626");
          return;
        }
        if (m.pending) {
          // the payout was submitted but the chain has not confirmed it; the
          // gold is already spent, so do NOT sound the coin or claim it landed
          store.pushLog(
            `The merchant sends ${m.drifts?.toLocaleString()} DRIFTS your way, but the Drift is slow to answer. Watch your wallet.`,
            "#d8b4fe",
          );
          this.net?.sendExInfo();
          return;
        }
        play("coin");
        store.pushLog(
          m.dir === "buy"
            ? `The merchant counts out ${m.gold}g for your ${m.cost?.toLocaleString()} DRIFTS.`
            : `${m.drifts?.toLocaleString()} DRIFTS land in your wallet for ${m.gold}g.`,
          "#e7c873",
        );
        this.net?.sendExInfo(); // refresh the counter display
      },
    );

    // the relic market: quotes (sign + submit) + settlements
    net.onMessage<{ ok: boolean; id?: number; price?: number; key?: string; tx?: string; reason?: string }>(
      "relicQuote",
      (m) => {
        const store = useGame.getState();
        if (!m.ok || !m.tx) {
          store.pushLog(m.reason ?? "That relic slips away.", "#6f6781");
          return;
        }
        void this.signAndSubmit(m.tx, (sig) => {
          this.net?.sendRelicBuy(this.pendingRelicId, sig);
          store.pushLog("The relic price crosses wallets. Awaiting the chain's word…", "#d8b4fe");
        });
      },
    );
    net.onMessage<{
      ok: boolean; listed?: boolean; unlisted?: boolean; bought?: boolean;
      id?: number; key?: string; kind?: string; price?: number; reason?: string;
    }>("relicResult", (m) => {
      const store = useGame.getState();
      if (!m.ok) {
        store.pushLog(m.reason ?? "The relic market balks.", "#dc2626");
        return;
      }
      if (m.listed) store.pushLog("Your relic stands on the stall.", "#e7c873");
      if (m.unlisted) store.pushLog("Relic withdrawn from the stall.", "#a99fb8");
      if (m.bought && m.key) {
        const entry = PRESTIGE_CATALOG[m.key];
        if (entry?.kind === "dye") {
          store.grantCosmetic("dye", m.key);
          store.setCosmetics({ dye: m.key as DyeKey });
        } else {
          store.grantCosmetic("aura", m.key);
          store.setCosmetics({ aura: m.key as AuraKey });
        }
        play("coin");
        store.pushLog(`The relic is yours: ${entry?.label ?? m.key}.`, "#d8b4fe");
      }
    });
    net.onMessage<{ key: string; price: number; net: number }>("relicSold", (m) => {
      const store = useGame.getState();
      const entry = PRESTIGE_CATALOG[m.key];
      // it left your hands: stop wearing (and owning) what you sold
      const cos = store.cosmetics;
      if (cos.aura === m.key) store.setCosmetics({ aura: "" });
      if (cos.dye === m.key) store.setCosmetics({ dye: "stone" });
      store.revokeCosmetic(entry?.kind === "dye" ? "dye" : "aura", m.key);
      play("coin");
      store.pushLog(
        `Your ${entry?.label ?? m.key} sold for ${m.price.toLocaleString()} DRIFTS (${m.net.toLocaleString()} after the tithe).`,
        "#e7c873",
      );
    });
    net.onMessage<{ ok: boolean; amount?: number; reason?: string }>("donateResult", (m) => {
      const store = useGame.getState();
      if (!m.ok || !m.amount) {
        store.pushLog(m.reason ?? "The Flame takes nothing from an empty purse.", "#6f6781");
        return;
      }
      store.bumpStat("donated", m.amount);
      store.pushLog(`You feed ${m.amount}g to the Pale Flame.`, "#efe9f4");
    });
    net.onMessage<{ count: number; driftPct: number }>("cleansing", (m) => {
      const store = useGame.getState();
      store.setDriftPct(m.driftPct);
      this.banner = { name: "THE PALE FLAME BURNS", t0: performance.now() };
      play("levelup");
      store.pushLog(
        `The Shrine fires. ${m.count} corrupted tiles burn clean.`,
        "#efe9f4",
      );
      this.applyNetTiles();
    });
    net.onMessage<{ ok: boolean; kind?: string; reason?: string }>("propResult", (m) => {
      const store = useGame.getState();
      if (m.ok) {
        play("craft");
        store.pushLog("Your furnishing stands.", "#e7c873");
      } else {
        // the ledger only pays when the furnishing stands — nothing to refund
        store.pushLog(`Can't place it: ${m.reason ?? "?"}.`, "#dc2626");
      }
    });

    // ---- the Pit ----
    net.onMessage<{ reason?: string }>("duelRefused", (m) => {
      useGame.getState().pushLog(`The Pit turns you away: ${m.reason ?? "?"}.`, "#6f6781");
    });
    net.onMessage<{ from: string; name: string; wager: number }>("challenged", (m) => {
      useGame.getState().setDuelChallenge(m);
      play("boss");
      useGame
        .getState()
        .pushLog(`${m.name} challenges you to the Pit (${m.wager}g wager)!`, "#dc2626");
    });
    net.onMessage<{ a: string; b: string; nameA: string; nameB: string; wager: number }>(
      "duelStart",
      (m) => {
        const store = useGame.getState();
        const meId = net.sessionId;
        this.activeDuel = { a: m.a, b: m.b }; // the ring crowd gathers for everyone
        if (m.a === meId || m.b === meId) {
          // the server ledger already staked both wagers (goldSync carries it)
          this.duelOpp = m.a === meId ? m.b : m.a;
          store.setDuel({
            oppName: m.a === meId ? m.nameB : m.nameA,
            myHp: 100,
            oppHp: 100,
            wager: m.wager,
          });
          useGame.getState().setOpenShop(null); // the Pit panel yields to the ring
          this.banner = { name: "THE ARENA TAKES YOU", t0: performance.now() };
        }
        play("boss");
        store.pushLog(`${m.nameA} and ${m.nameB} enter the Pit (${m.wager}g pot).`, "#dc2626");
      },
    );
    net.onMessage<{ a: string; b: string; hpA: number; hpB: number }>("duelHp", (m) => {
      const store = useGame.getState();
      const meId = net.sessionId;
      if (m.a !== meId && m.b !== meId) return;
      const d = store.duel;
      if (!d) return;
      store.setDuel({
        ...d,
        myHp: m.a === meId ? m.hpA : m.hpB,
        oppHp: m.a === meId ? m.hpB : m.hpA,
      });
    });
    net.onMessage<{ a: string; b: string; winner: string | null; pot: number; winnerName: string | null }>(
      "duelEnd",
      (m) => {
        const store = useGame.getState();
        const meId = net.sessionId;
        if (m.a === meId || m.b === meId) {
          if (m.winner === meId) {
            store.bumpStat("goldEarned", m.pot); // ledger already paid
            play("levelup");
            this.banner = { name: "VICTORY", t0: performance.now() };
            this.victoryAt = performance.now(); // the plate floats over the sand
            store.pushLog(`You win the duel. ${m.pot}g pot.`, "#e7c873");
          } else if (m.winner === null) {
            store.pushLog("The duel ends in a draw. Stakes returned.", "#a99fb8");
          } else {
            play("death");
            this.banner = { name: "DEFEATED", t0: performance.now() };
            store.pushLog("You are beaten. The Pit remembers.", "#dc2626");
          }
          store.setDuel(null);
          this.duelOpp = null;
        } else if (m.winnerName) {
          store.pushLog(`${m.winnerName} wins the duel (${m.pot}g).`, "#a99fb8");
        }
        this.activeDuel = null; // the crowd disperses, the realm returns
      },
    );
    // the arena queue: someone waits in the ring (or it just emptied)
    net.onMessage<{ name: string; wager: number; sessionId: string } | null>(
      "pitQueue",
      (m) => {
        const store = useGame.getState();
        if (!m) return store.setPitQueue(null);
        const mine = m.sessionId === net.sessionId;
        store.setPitQueue({ name: m.name, wager: m.wager, mine });
        if (!mine) {
          store.pushLog(`${m.name} waits in the Pit's ring (${m.wager}g stake).`, "#dc2626");
        }
      },
    );

    // ---- land claims ----
    net.onMessage<{ ok: boolean; reason?: string; id?: number }>("claimResult", (m) => {
      const store = useGame.getState();
      if (m.ok && m.id != null) {
        this.myClaimIds.add(m.id);
        store.setMyClaims(this.myClaimIds.size);
        play("reclaim");
        store.pushLog("You stake your claim. This ground is yours, for now.", "#e7c873");
      } else {
        // the ledger only pays for claims that stand — nothing to refund
        store.pushLog(`Claim refused: ${m.reason ?? "the Drift resists"}.`, "#dc2626");
      }
    });
    net.onMessage<{ x: number; y: number; name: string }>("claimPlaced", (m) =>
      useGame.getState().pushLog(`${m.name} stakes a claim.`, "#a99fb8"),
    );
    net.onMessage<{ id: number; x: number; y: number; name: string }>("claimFallen", (m) => {
      const store = useGame.getState();
      if (this.myClaimIds.delete(m.id)) {
        store.setMyClaims(this.myClaimIds.size);
        play("death");
        this.banner = { name: "Your claim has fallen", t0: performance.now() };
        store.pushLog("Your claim's warding breaks. The Drift swallows your land.", "#dc2626");
      } else {
        store.pushLog(`${m.name}'s claim falls to the Drift…`, "#a855f7");
      }
      this.applyNetTiles();
    });
    net.onMessage<{ season: number; driftPct: number }>("season", (m) => {
      const s = useGame.getState();
      s.setSeason(m.season);
      s.setDriftPct(m.driftPct);
      this.banner = { name: "THE DRIFT DEEPENS", t0: performance.now() };
      s.pushLog("The Drift deepens. A new season corrupts the land.", "#a855f7");
      this.applyNetTiles();
    });
    net.onDrop(() => {
      if (this.net !== net || !this.running) return;
      this.net = null;
      this.remotes.clear();
      this.gatherVis = null;
      const s = useGame.getState();
      s.setPlayersOnline(1);
      s.setOnline(false);
      s.setClaimMode(false);
      s.pushLog("Connection to the shared Drift lost. Wandering offline.", "#dc2626");
    });

    store.setOnline(true);
    store.pushLog("You step into the shared Drift.", "#a855f7");
  }

  private applyNetWorld() {
    const net = this.net!;
    if (net.w !== this.world.w || net.h !== this.world.h) {
      this.world = new World(net.w, net.h);
    }
    this.applyNetTiles();
    this.world.clearNodes();
    net.forEachNode((n) =>
      this.world.syncNetNode({
        id: n.id,
        kind: n.kind as ResourceKind,
        gx: n.gx,
        gy: n.gy,
        amount: n.amount,
        alive: n.alive,
      }),
    );
  }

  private applyNetTiles() {
    if (!this.net) return;
    const codes = this.net.tileCodes();
    for (let i = 0; i < codes.length && i < this.world.tiles.length; i++) {
      this.world.tiles[i] = codeToTile(codes[i]);
    }
  }

  // ---- world events --------------------------------------------------------------

  private announceDriftfall(gx: number, gy: number) {
    this.driftfallFx = { gx, gy, t0: performance.now() };
    this.banner = { name: "Driftfall", t0: performance.now() };
    play("driftfall");
    const store = useGame.getState();
    store.bumpStat("driftfalls");
    store.pushLog("DRIFTFALL! A shard crashes down. Rich nodes, briefly.", "#d8b4fe");
  }

  /** corruption thresholds wake the Colossus at the corruption front */
  private watchBoss() {
    if (this.net) return; // online the server wakes the shared Colossus
    if (this.bossThresholds.length === 0) return;
    const pct = useGame.getState().driftPct;
    if (pct < this.bossThresholds[0] || this.combat.bossAlive()) return;
    // find a corrupt tile to anchor the spawn
    let cell: { x: number; y: number } | null = null;
    for (let i = 0; i < this.world.tiles.length; i++) {
      if (this.world.tiles[i] === "corrupt" && Math.random() < 0.05) {
        cell = { x: i % this.world.w, y: (i / this.world.w) | 0 };
        break;
      }
    }
    if (!cell) return;
    const boss = this.combat.spawnBoss(this.world, cell);
    if (!boss) return;
    this.bossThresholds.shift();
    play("boss");
    this.banner = { name: "A COLOSSUS RISES", t0: performance.now() };
    this.shakeUntil = performance.now() + 600;
    this.shakeMag = 5;
    this.spawnFloater(boss.px, boss.py - 1.5, "THE COLOSSUS AWAKENS", "#a855f7");
    useGame
      .getState()
      .pushLog("The ground shudders. A COLOSSUS rises from the corruption…", "#a855f7");
  }

  /** juice + respawn hooks (re-run whenever a fresh CombatManager is created) */
  private wireCombat() {
    // escorts report raider kills so the server can resolve the wave
    // shared beasts: swings + engagement ride to the server sim
    this.combat.onNetAttack = (mob, dmg) => {
      if (mob.netId != null) this.net?.sendAttack(mob.netId, dmg);
    };
    this.combat.onEngage = (mob) => {
      if (mob.netId != null) this.net?.sendEngage(mob.netId);
    };
    this.combat.onPlayerHit = (mob, dmg, crit) => {
      this.spawnFloater(
        mob.px, mob.py,
        crit ? `CRIT ${dmg}` : `${dmg}`,
        crit ? "#fcd34d" : "#e7c873",
      );
      this.spawnSparks(mob.px, mob.py, crit ? "#fcd34d" : "#d8b4fe", crit ? 12 : 7);
      if (crit) {
        this.shakeUntil = performance.now() + 120;
        this.shakeMag = 3;
      }
    };
    this.combat.onSelfHit = (dmg) => {
      this.lastHurtT0 = performance.now();
      this.spawnFloater(this.player.px, this.player.py, `-${dmg}`, "#ef4444");
      this.spawnSparks(this.player.px, this.player.py, "#dc2626", 5);
      this.shakeUntil = performance.now() + 200;
      this.shakeMag = Math.min(7, 2 + dmg * 0.5);
    };
    // drop half your gold where you fell — reclaim it within 5 minutes
    this.combat.onDeath = (x, y) => {
      const store = useGame.getState();
      const drop = Math.floor(store.gold / 2);
      if (drop <= 0) return;
      store.spendGold(drop, "death");
      this.tomb = { x: Math.round(x), y: Math.round(y), gold: drop, t0: performance.now() };
      store.pushLog(
        `Your tombstone holds ${drop}g. Reclaim it before it dissolves (5 min).`,
        "#a99fb8",
      );
    };
    this.combat.onRespawn = () => {
      this.shakeUntil = performance.now() + 380;
      this.shakeMag = 9;
      this.net?.sendRespawn();
    };
  }

  private spawnFloater(gx: number, gy: number, txt: string, color: string) {
    this.floaters.push({ gx, gy, txt, color, t0: performance.now() });
  }

  private spawnSparks(gx: number, gy: number, color: string, n: number) {
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.8 + Math.random() * 1.6;
      this.sparkParts.push({
        gx, gy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.2,
        t0, color,
      });
    }
  }

  /** detects level-ups from any source (gathering, combat, quests) */
  private watchLevelUps() {
    const s = useGame.getState();
    const levels = [
      s.skills.woodcutting.level,
      s.skills.mining.level,
      s.skills.fishing.level,
      s.skills.combat.level,
    ];
    if (this.lastLevels) {
      for (let i = 0; i < 4; i++) {
        if (levels[i] > this.lastLevels[i]) {
          this.levelFlashT0 = performance.now();
          this.spawnFloater(this.player.px, this.player.py - 0.6, "LEVEL UP", "#e7c873");
          this.spawnSparks(this.player.px, this.player.py, "#e7c873", 10);
          play("levelup");
          break;
        }
      }
    }
    this.lastLevels = levels;
  }

  /** push name/dye/eye/title/aura/pet to the server whenever they change */
  private pushIdentity(net: NetClient) {
    const s = useGame.getState();
    const id = {
      name: s.cosmetics.name,
      dye: s.cosmetics.dye,
      eye: s.cosmetics.eye,
      title: currentTitle(s),
      aura: s.cosmetics.aura,
      pet: s.cosmetics.pet,
      avatar: s.cosmetics.avatar,
      avA: s.cosmetics.avA,
      avB: s.cosmetics.avB,
    };
    const sig = `${id.name}|${id.dye}|${id.eye}|${id.title}|${id.aura}|${id.pet}|${id.avatar}|${id.avA}|${id.avB}`;
    if (sig !== this.sentIdentity) {
      this.sentIdentity = sig;
      net.sendIdentity(id);
    }
  }

  // ---- events ---------------------------------------------------------------

  private bindEvents() {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.camera.zoomBy(e.deltaY, e.offsetX, e.offsetY);
    };
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      this.handleClick(e.offsetX, e.offsetY);
    };
    const onMove = (e: MouseEvent) => {
      const cell = this.cellUnderCursor(e.offsetX, e.offsetY);
      this.hover = cell && this.world.inBounds(cell.x, cell.y) ? cell : null;
    };
    const onKey = (e: KeyboardEvent) => {
      // ignore hotkeys while typing in the chat input (or any form field)
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key >= "1" && e.key <= "6") useGame.getState().setHotbar(parseInt(e.key, 10));
    };
    const onResize = () => this.resize();

    this.canvas.addEventListener("wheel", onWheel, { passive: false });
    this.canvas.addEventListener("mousedown", onDown);
    this.canvas.addEventListener("mousemove", onMove);
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    this.cleanupFns.push(
      () => this.canvas.removeEventListener("wheel", onWheel),
      () => this.canvas.removeEventListener("mousedown", onDown),
      () => this.canvas.removeEventListener("mousemove", onMove),
      () => window.removeEventListener("keydown", onKey),
      () => window.removeEventListener("resize", onResize),
    );

    // ?demo: a READ-ONLY coordinate bridge for the trailer capture script.
    // Playwright reads positions here and drives REAL canvas clicks through
    // the normal input path; nothing in the sim behaves differently.
    if (typeof location !== "undefined" && new URLSearchParams(location.search).has("demo")) {
      (window as unknown as Record<string, unknown>).__demo = {
        toScreen: (gx: number, gy: number) => {
          const iso = gridToIso(gx, gy);
          return this.camera.worldToScreen(iso.x, iso.y);
        },
        player: () => ({ ...this.player.cell, action: this.player.action }),
        nodes: () =>
          this.world.nodes
            .filter((n) => n.amount > 0 && n.regrowIn <= 0)
            .map((n) => ({ kind: n.kind, x: n.gx, y: n.gy })),
        mobs: () =>
          this.combat.mobs
            .filter((m) => m.hp > 0)
            .map((m) => ({ x: m.cell.x, y: m.cell.y, hp: m.hp, level: m.level })),
        // plain ground only — keeps scripted walk clicks off building doors
        walkable: (gx: number, gy: number) =>
          this.world.inBounds(gx, gy) &&
          this.world.isWalkable(gx, gy) &&
          !buildingAt(gx, gy),
        // duel triggers for the trailer capture (ride the REAL bus → net rails;
        // only the HUD click is bypassed — the server validates as always)
        others: () =>
          [...this.remotes.entries()].map(([id, r]) => ({ id, name: r.name || "", x: r.px, y: r.py })),
        challenge: (target: string, wager: number) => bus.emit("challenge", { target, wager }),
        acceptDuel: () => bus.emit("duelAccept", true),
        duel: () => useGame.getState().duel,
      };
    }
  }

  private cellUnderCursor(sx: number, sy: number) {
    const world = this.camera.screenToWorld(sx, sy);
    const g = isoToGrid(world.x, world.y);
    return { x: Math.round(g.gx), y: Math.round(g.gy) };
  }

  private handleClick(sx: number, sy: number) {
    initAudio(); // browsers unlock audio on the first user gesture
    const cell = this.cellUnderCursor(sx, sy);
    if (this.interior) {
      this.handleInteriorClick(cell);
      return;
    }
    if (!this.world.inBounds(cell.x, cell.y)) return;
    this.clickMarker = { x: cell.x, y: cell.y, t: performance.now() };

    // town buildings open their shop (walk over first if we're far)
    const building = buildingAt(cell.x, cell.y);
    if (building && this.handleBuildingClick(building)) return;

    // a lost tombstone in the Drowned Field gives up its gold when close
    if (this.tryReclaimLostTomb(cell)) return;

    if (this.net) {
      this.handleClickOnline(cell);
      return;
    }

    // attack a Drift Beast if one was clicked
    const mob = this.combat.mobAtCell(cell);
    if (mob) {
      this.pendingNode = null;
      const from = this.player.cell;
      if (chebyshev(from, mob.cell) <= 1) {
        this.player.setPath([]);
        this.player.cancelGather();
        this.combat.startEngage(this.player, mob);
        this.pendingMob = null;
        return;
      }
      const adj = adjacentWalkable(this.world, from, mob.cell);
      if (adj) {
        const path = findPath(this.world, from, adj);
        if (path) {
          this.combat.disengage(this.player);
          this.player.setPath(path);
          this.pendingMob = mob;
          this.pendingNode = null;
        }
      }
      return;
    }

    const node = this.world.getNode(cell.x, cell.y);
    if (node && node.regrowIn <= 0 && node.amount > 0) {
      // walk to a tile adjacent to the node, then gather
      this.combat.disengage(this.player);
      this.pendingMob = null;
      const from = this.player.cell;
      if (chebyshev(from, { x: node.gx, y: node.gy }) === 1) {
        this.player.setPath([]);
        startGathering(this.world, this.player, this.drift, node);
        this.pendingNode = null;
        return;
      }
      const adj = adjacentWalkable(this.world, from, { x: node.gx, y: node.gy });
      if (!adj) {
        useGame.getState().pushLog("You can't reach that.", "#dc2626");
        return;
      }
      const path = findPath(this.world, from, adj);
      if (path) {
        this.player.setPath(path);
        this.pendingNode = node;
      }
      return;
    }

    // plain move
    if (this.world.isWalkable(cell.x, cell.y)) {
      const path = findPath(this.world, this.player.cell, cell);
      if (path) {
        this.combat.disengage(this.player);
        this.player.setPath(path);
        this.pendingNode = null;
        this.pendingMob = null;
      }
    }
  }

  /** click on a town building: open if close, otherwise walk to its door */
  private handleBuildingClick(b: TownBuilding): boolean {
    if (b.key === "pit" && useGame.getState().claimMode) return false;
    // a sealed duelist clicks the sand to MOVE, not to open the Pit panel
    if (b.key === "pit" && this.duelOpp) return false;
    const dist = Math.max(Math.abs(this.player.cell.x - b.x), Math.abs(this.player.cell.y - b.y));
    if (dist <= b.r + 2) {
      this.enterInterior(b.key);
      return true;
    }
    // walk to the nearest walkable cell at the building's skirt
    const adj = adjacentWalkable(
      this.world,
      this.player.cell,
      { x: b.x, y: b.y + b.r }, // approach the south face
    );
    if (!adj) return true;
    this.pendingShop = b;
    this.pendingNode = null;
    this.pendingMob = null;
    if (this.net) {
      this.net.sendMove(adj.x, adj.y);
    } else {
      const path = findPath(this.world, this.player.cell, adj);
      if (path) this.player.setPath(path);
    }
    return true;
  }

  /** Online: clicks become server intents. Mobs are still local (Phase 3). */
  private handleClickOnline(cell: Cell) {
    const net = this.net!;

    // furnishing placement (already paid at the shop; refunded on rejection)
    if (this.propPlaceKind) {
      const kind = this.propPlaceKind;
      this.propPlaceKind = null;
      net.sendPlaceProp(kind, cell.x, cell.y);
      return;
    }

    // claim mode: this click stakes. Holders burn tokens; guests pay from
    // the server ledger (debited only when the claim stands).
    const store = useGame.getState();
    if (store.claimMode) {
      store.setClaimMode(false);
      if (store.wallet && store.holder) {
        void this.startBurn("claim", { x: cell.x, y: cell.y });
        return;
      }
      if (store.gold < CLAIM_COST) {
        store.pushLog(`Staking a claim costs ${CLAIM_COST}g.`, "#6f6781");
        return;
      }
      net.sendClaim(cell.x, cell.y);
      return;
    }

    const mob = this.combat.mobAtCell(cell);
    if (mob) {
      this.pendingNode = null;
      if (chebyshev(this.player.cell, mob.cell) <= 1) {
        this.combat.startEngage(this.player, mob);
        this.pendingMob = null;
        return;
      }
      const adj = adjacentWalkable(this.world, this.player.cell, mob.cell);
      if (adj) {
        this.combat.disengage(this.player);
        net.sendMove(adj.x, adj.y);
        this.pendingMob = mob;
      }
      return;
    }

    const node = this.world.getNode(cell.x, cell.y);
    if (node && node.regrowIn <= 0 && node.amount > 0) {
      this.combat.disengage(this.player);
      this.pendingMob = null;
      net.sendGather(node.id, gatherSpeedMultiplier());
      return;
    }

    if (this.world.isWalkable(cell.x, cell.y)) {
      this.combat.disengage(this.player);
      this.pendingMob = null;
      net.sendMove(cell.x, cell.y);
    }
  }

  // ---- loop -----------------------------------------------------------------

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number) {
    // inside a building: local room sim only; the world (and our server
    // position) waits at the door until we step back out
    if (this.interior) {
      this.updateInterior(dt);
      return;
    }
    if (this.net) {
      this.updateOnline(dt);
    } else {
      this.player.update(dt);
      // the Threshold's corruption is scripted; the real Drift stays out
      if (!this.tutorial) this.drift.update(this.world, dt);
    }
    this.combat.update(dt, this.world, this.player);
    this.tutorial?.update();

    // arrival -> begin gather (offline only; the server runs gathers online)
    if (
      !this.net &&
      this.pendingNode &&
      this.player.action === "idle" &&
      this.player.path.length === 0
    ) {
      const node = this.pendingNode;
      this.pendingNode = null;
      if (
        node.amount > 0 &&
        node.regrowIn <= 0 &&
        chebyshev(this.player.cell, { x: node.gx, y: node.gy }) === 1
      ) {
        startGathering(this.world, this.player, this.drift, node);
      }
    }

    // arrival -> open the shop we were walking toward
    if (
      this.pendingShop &&
      this.player.action !== "walk" &&
      this.player.path.length === 0
    ) {
      const b = this.pendingShop;
      const dist = Math.max(Math.abs(this.player.cell.x - b.x), Math.abs(this.player.cell.y - b.y));
      if (dist <= b.r + 2) {
        this.enterInterior(b.key);
        this.pendingShop = null;
      } else if (this.player.action === "idle") {
        this.pendingShop = null; // couldn't get there
      }
    }

    // arrival -> begin combat
    if (
      this.pendingMob &&
      this.player.action !== "walk" &&
      this.player.path.length === 0
    ) {
      const mob = this.pendingMob;
      this.pendingMob = null;
      if (mob.state !== "dead" && chebyshev(this.player.cell, mob.cell) <= 1) {
        this.combat.startEngage(this.player, mob);
      }
    }

    this.watchLevelUps();
    if (!this.tutorial) {
      this.watchBoss();
      this.updateWildQuadrants();
    }
    this.updateWorldFeel(dt);

    // minimap snapshot ~2×/sec
    this.minimapTimer += dt;
    if (this.minimapTimer >= 0.5) {
      this.minimapTimer = 0;
      this.pushMinimap();
    }

    // sealed in the arena: the camera holds the ring, not the wanderer
    const iso = this.duelOpp
      ? gridToIso(ARENA.x, ARENA.y)
      : gridToIso(this.player.px, this.player.py);
    this.camera.follow(iso.x, iso.y);
    this.camera.update(dt);
  }

  /** corruption hazard, tombstone reclaim, region banners, weather, footsteps */
  private updateWorldFeel(dt: number) {
    const now = performance.now();
    const store = useGame.getState();
    const cell = this.player.cell;

    // --- corrupted ground burns (wards resist it) ---
    this.corruptTickT += dt;
    if (this.corruptTickT >= 1.5) {
      this.corruptTickT = 0;
      if (
        this.world.inBounds(cell.x, cell.y) &&
        this.world.tile(cell.x, cell.y) === "corrupt"
      ) {
        const dmg = Math.max(1, 3 - damageReduction());
        const remaining = store.damage(dmg);
        this.lastHurtT0 = now;
        this.spawnFloater(this.player.px, this.player.py, `-${dmg}`, "#a855f7");
        play("hurt");
        if (!this.corruptWarned) {
          this.corruptWarned = true;
          store.pushLog("The Drift gnaws at your flesh. Corrupted ground is death. Move!", "#a855f7");
        }
        if (remaining <= 0) this.combat.killPlayer(this.player);
      }
    }

    // --- tombstone: expiry + reclaim ---
    if (this.tomb) {
      if (now - this.tomb.t0 > 300_000) {
        store.pushLog("Your lost gold dissolves into the Drift…", "#6f6781");
        this.tomb = null;
      } else if (chebyshev(cell, this.tomb) <= 1) {
        store.addGold(this.tomb.gold, "tomb");
        play("reclaim");
        this.spawnFloater(this.player.px, this.player.py, `+${this.tomb.gold}g`, "#e7c873");
        store.pushLog(`You reclaim ${this.tomb.gold}g from your grave.`, "#e7c873");
        this.tomb = null;
      }
    }

    // --- named regions ---
    if (this.world.inBounds(cell.x, cell.y)) {
      const r = this.regionAt(cell.x, cell.y);
      if (r !== this.region) {
        this.region = r;
        this.banner = { name: r, t0: now };
        store.pushLog(`You enter ${r}.`, "#a99fb8");
      }
    }

    // --- ash-storms ---
    if (!this.storm && now >= this.nextStormAt) {
      this.storm = { until: now + 45_000 };
      this.nextStormAt = now + 300_000 + Math.random() * 240_000;
      this.banner = { name: "ASH-STORM", t0: now };
      store.pushLog("An ash-storm rolls in from the wastes.", "#a99fb8");
    } else if (this.storm && now > this.storm.until) {
      this.storm = null;
      store.pushLog("The ash thins. The storm passes.", "#6f6781");
    }

    // --- footstep dust ---
    if (this.player.action === "walk") {
      this.stepAcc += dt;
      if (this.stepAcc >= 0.3) {
        this.stepAcc = 0;
        for (let i = 0; i < 2; i++) {
          this.sparkParts.push({
            gx: this.player.px + (Math.random() - 0.5) * 0.2,
            gy: this.player.py + 0.6 + (Math.random() - 0.5) * 0.2, // at the feet

            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.3 - Math.random() * 0.3,
            t0: now,
            color: "rgba(122,96,72,0.7)",
          });
        }
      }
    }
  }

  private regionAt(x: number, y: number): string {
    return sharedRegionAt(this.world.w, this.world.h, x, y);
  }

  private pushMinimap() {
    const store = useGame.getState();
    const players: { x: number; y: number; self: boolean }[] = [
      { x: this.player.px, y: this.player.py, self: true },
    ];
    for (const r of this.remotes.values()) players.push({ x: r.px, y: r.py, self: false });
    store.setMinimap({
      w: this.world.w,
      h: this.world.h,
      tiles: this.world.tiles.map(tileToCode),
      nodes: this.world.nodes
        .filter((n) => n.regrowIn <= 0)
        .map((n) => ({ x: n.gx, y: n.gy })),
      players,
      mobs: this.combat.mobs
        .filter((m) => m.state !== "dead")
        .map((m) => ({ x: m.px, y: m.py, boss: m.kind === "colossus" })),
      tomb: this.tomb ? { x: this.tomb.x, y: this.tomb.y } : null,
      claims: (() => {
        const out: { x: number; y: number; mine: boolean }[] = [];
        this.net?.forEachClaim((c) =>
          out.push({ x: c.x, y: c.y, mine: this.myClaimIds.has(c.id) }),
        );
        return out;
      })(),
    });

    // shrine progress for the HUD
    if (this.net) {
      const cur = store.shrine;
      if (cur.pot !== this.net.shrinePot || cur.goal !== this.net.shrineGoal) {
        store.setShrine({ pot: this.net.shrinePot, goal: this.net.shrineGoal });
      }
    }

    // market listings for the HUD
    if (this.net) {
      const ls: import("@/game/state/store").MarketListing[] = [];
      this.net.forEachListing((l) =>
        ls.push({
          id: l.id,
          item: l.item as never,
          qty: l.qty,
          price: l.price,
          sellerName: l.sellerName,
          mine: this.myListingIds.has(l.id),
        }),
      );
      store.setListings(ls);
    }

    // who's here (for the roster panel + Pit challenges)
    const roster = [
      {
        id: this.net?.sessionId ?? "self",
        name: store.cosmetics.name,
        title: currentTitle(store),
        self: true,
        guildTag: store.myGuildTag,
      },
      ...[...this.remotes.entries()].map(([id, r]) => ({
        id,
        name: r.name || "Wanderer",
        title: r.title,
        self: false,
        guildTag: r.guildTag,
      })),
    ];
    store.setRoster(roster);

    // guilds + relic stalls for the HUD (cheap mirrors of small schema maps)
    if (this.net) {
      const gs: import("@/game/state/store").GuildInfo[] = [];
      this.net.forEachGuild((g) =>
        gs.push({
          id: g.id, name: g.name, tag: g.tag, members: g.members,
          region: g.region, regionSecsLeft: g.regionSecsLeft,
        }),
      );
      store.setGuilds(gs);
      const rs: import("@/game/state/store").RelicInfo[] = [];
      this.net.forEachRelic((r) =>
        rs.push({ id: r.id, key: r.key, price: r.price, sellerName: r.sellerName }),
      );
      store.setRelics(rs);
      const meTag = this.net.self()?.guildTag ?? "";
      if (meTag !== store.myGuildTag) store.setMyGuildTag(meTag);
    }
  }

  /** Online: mirror server state into local entities (smoothed). */
  private updateOnline(dt: number) {
    const net = this.net!;
    const k = Math.min(1, dt * 12); // exponential smoothing toward server pos
    const now = performance.now();

    // ---- self -------------------------------------------------------------
    const self = net.self();
    if (self) {
      const dx = self.x - this.player.px;
      const dy = self.y - this.player.py;
      this.player.px += dx * k;
      this.player.py += dy * k;

      // local combat overrides the synced action while engaged
      const engaged = this.player.action === "attack" && this.combat.target;
      if (!engaged) {
        if (self.action === "gather") {
          this.player.action = "gather";
          if (self.tx >= 0) {
            this.player.updateIsoFacing(
              self.tx - this.player.px,
              self.ty - this.player.py,
            );
          }
          // drive swing frames + progress arc from the server's timer
          const vis = this.gatherVis;
          this.player.gatherTotal = vis ? vis.total : 1000;
          this.player.gatherMs = vis
            ? (now - vis.start) % vis.total
            : now % 1000;
          this.player.bob += dt * 6;
        } else if (self.action === "walk") {
          this.player.action = "walk";
          this.player.updateIsoFacing(dx, dy);
          this.player.bob += dt * 10;
        } else {
          this.player.action = "idle";
          this.player.bob = 0;
        }
      }
      if (self.action !== "gather") this.gatherVis = null;
    }

    // ---- duel: auto-swing while adjacent to your opponent --------------------
    if (this.duelOpp && useGame.getState().duel) {
      const opp = this.remotes.get(this.duelOpp);
      const now2 = performance.now();
      if (opp) {
        const dist = Math.hypot(opp.px - this.player.px, opp.py - this.player.py);
        if (dist <= 1.8) {
          this.player.action = "attack";
          this.player.updateIsoFacing(opp.px - this.player.px, opp.py - this.player.py);
        }
        if (dist <= 1.6 && now2 - this.duelLastSwing > 1100) {
          this.duelLastSwing = now2;
          const crit = Math.random() < 0.12;
          const dmg = Math.floor((6 + Math.random() * 6 + weaponBonus()) * (crit ? 2 : 1));
          net.sendDuelHit(dmg);
          play(crit ? "crit" : "hit");
          this.spawnFloater(opp.px, opp.py, crit ? `CRIT ${dmg}` : `${dmg}`, crit ? "#fcd34d" : "#e7c873");
          this.spawnSparks(opp.px, opp.py, "#dc2626", crit ? 10 : 6);
        }
      }
    }

    this.pushIdentity(net);

    // ---- periodic progress push (server persists it) -------------------------
    this.netSaveT += dt;
    if (this.netSaveT >= 8) {
      this.netSaveT = 0;
      net.sendSave(buildSnapshot());
    }

    // ---- other wanderers ----------------------------------------------------
    const store = useGame.getState();
    const seen = new Set<string>();
    net.forEachPlayer((p) => {
      if (p.id === net.sessionId) return;
      seen.add(p.id);
      let r = this.remotes.get(p.id);
      if (!r) {
        r = new Player(p.x, p.y);
        this.remotes.set(p.id, r);
        store.pushLog(`${p.name || "A wanderer"} enters the Drift.`, "#7c6f93");
      }
      r.name = p.name;
      r.dye = p.dye;
      r.eye = p.eye;
      r.title = p.title;
      r.aura = p.aura;
      r.pet = p.pet;
      r.avatar = p.avatar ?? "";
      r.avA = p.avA ?? "";
      r.avB = p.avB ?? "";
      r.guildTag = p.guildTag ?? "";
      const dx = p.x - r.px;
      const dy = p.y - r.py;
      r.px += dx * k;
      r.py += dy * k;
      if (p.action === "gather") {
        r.action = "gather";
        r.gatherTotal = 1000;
        r.gatherMs = now % 1000; // cosmetic swing loop
        if (p.tx >= 0) r.updateIsoFacing(p.tx - r.px, p.ty - r.py);
        r.bob += dt * 6;
      } else if (p.action === "walk" || Math.hypot(dx, dy) > 0.05) {
        r.action = "walk";
        r.updateIsoFacing(dx, dy);
        r.bob += dt * 10;
      } else {
        r.action = "idle";
        r.bob = 0;
      }
    });
    for (const id of [...this.remotes.keys()]) {
      if (!seen.has(id)) {
        this.remotes.delete(id);
        store.pushLog("A wanderer fades from sight.", "#7c6f93");
      }
    }

    // ---- shared beasts: mirror schema mobs into local puppets -----------------
    const seenMobs = new Set<number>();
    net.forEachMob((m) => {
      seenMobs.add(m.id);
      let pup = this.netMobs.get(m.id);
      if (!pup) {
        pup = new Mob(this.combat.allocId(), m.x, m.y, m.level, m.kind as never);
        pup.netId = m.id;
        pup.persistDeath = true; // life and death belong to the schema
        this.netMobs.set(m.id, pup);
        this.combat.mobs.push(pup);
      }
      pup.level = m.level;
      pup.maxHp = m.maxHp;
      pup.hp = m.hp;
      const mdx = m.x - pup.px;
      const mdy = m.y - pup.py;
      pup.px += mdx * k;
      pup.py += mdy * k;
      // the server says whether the beast is stepping (guessing it from the
      // lerp residue flickered walk/idle between patches); facing still comes
      // from the visible drift toward the synced position
      pup.moving = !!m.moving;
      if (pup.state !== "dead" && pup.moving && Math.hypot(mdx, mdy) > 0.01) {
        pup.facing = mdx >= 0 ? 1 : -1;
        pup.updateIsoFacing(mdx, mdy);
      }
      if (m.state === "dead") {
        if (pup.state !== "dead") {
          pup.state = "dead";
          pup.deathT = 0;
        }
      } else if (pup.state === "dead") {
        // respawned on the server — snap to the fresh spot
        pup.state = "wander";
        pup.px = m.x;
        pup.py = m.y;
      } else {
        pup.state = this.combat.isEngaged(pup) ? "engaged" : (m.state as never);
      }
    });
    for (const [id, pup] of [...this.netMobs]) {
      if (!seenMobs.has(id)) {
        this.netMobs.delete(id);
        this.combat.mobs = this.combat.mobs.filter((m) => m !== pup);
      }
    }

    const count = net.playerCount();
    if (store.playersOnline !== count) store.setPlayersOnline(count);

    // ---- the Long Night (schema-synced; HUD banner reads the store) ----------
    const night = net.night;
    const sn = store.night;
    if (night.active) {
      if (!sn || sn.kills !== night.kills || sn.endsIn !== night.endsIn || sn.need !== night.need) {
        store.setNight({ kills: night.kills, need: night.need, endsIn: night.endsIn });
      }
    } else if (sn) {
      store.setNight(null);
    }

    // ---- nodes (authoritative mirror) ---------------------------------------
    net.forEachNode((n) =>
      this.world.syncNetNode({
        id: n.id,
        kind: n.kind as ResourceKind,
        gx: n.gx,
        gy: n.gy,
        amount: n.amount,
        alive: n.alive,
      }),
    );
    for (const node of this.world.nodes) node.phase += dt;
  }

  // ---- building interiors (client-local scenes behind each town door) ----------

  private interior: {
    spec: InteriorSpec;
    nav: ReturnType<typeof interiorNav>;
    /** overworld position to restore on exit */
    outX: number;
    outY: number;
    /** what to do when the current walk finishes */
    pending: "shop" | "exit" | null;
    /** vein index to start mining on arrival (the Mine) */
    pendingVein: number | null;
    /** keeper speech bubble (door reactions + idle small talk) */
    bubble: { text: string; until: number } | null;
    nextTalkAt: number;
    /** live vein state: charges deplete per strike, regrow on a timer */
    veins: { x: number; y: number; charges: number; regrowAt: number }[];
  } | null = null;

  // Economy pass: 2 charges × 7 veins on a 4-min regrow lands the camp at
  // ~1,900-2,900g/hr by mining level — a rotation stop, not the realm's mint.
  private static readonly VEIN_CHARGES = 2;
  private static readonly VEIN_REGROW_MS = 240_000;

  private enterInterior(key: BuildingKey) {
    if (key === "huskden") {
      this.denInteract();
      return;
    }
    const spec = interiorFor(key);
    if (!spec) {
      // shrine + pit + obelisk are open-air: their panels/dialogues open directly
      useGame.getState().setOpenShop(key);
      play("ui");
      return;
    }
    this.combat.disengage(this.player);
    this.pendingNode = null;
    this.pendingMob = null;
    this.pendingShop = null;
    this.gatherVis = null;
    this.interior = {
      spec,
      nav: interiorNav(spec),
      outX: this.player.px,
      outY: this.player.py,
      pending: null,
      pendingVein: null,
      bubble: null,
      nextTalkAt: performance.now() + 9_000 + Math.random() * 6_000,
      veins: (spec.veins ?? []).map((v) => ({
        x: v.x, y: v.y, charges: Game.VEIN_CHARGES, regrowAt: 0,
      })),
    };
    // the keeper notices you come in
    const talkLines = KEEPER_TALK[spec.key];
    if (spec.keeper && talkLines) {
      this.interior.bubble = {
        text: pickLine(talkLines.enter),
        until: performance.now() + 4_200,
      };
    }
    this.player.px = spec.door.x;
    this.player.py = spec.door.y;
    this.player.setPath([]);
    this.player.action = "idle";
    this.player.updateIsoFacing(0, -1); // face into the room
    const iso = gridToIso(spec.door.x, spec.door.y);
    this.camera.snapTo(iso.x, iso.y);
    play("ui");
    useGame.getState().pushLog(`You step into ${spec.title}.`, "#a99fb8");
  }

  private exitInterior() {
    if (!this.interior) return;
    const { outX, outY } = this.interior;
    this.interior = null;
    this.avatarPreview = null; // the glass keeps nothing
    useGame.getState().setOpenShop(null);
    this.player.px = outX;
    this.player.py = outY;
    this.player.setPath([]);
    this.player.action = "idle";
    const iso = gridToIso(outX, outY);
    this.camera.snapTo(iso.x, iso.y);
    play("ui");
  }

  private updateInterior(dt: number) {
    const room = this.interior!;
    this.player.update(dt);
    const iso = gridToIso(this.player.px, this.player.py);
    this.camera.follow(iso.x, iso.y);
    this.camera.update(dt);

    // keeper chatter: expire the current line, mutter a new one now and then
    const now = performance.now();
    if (room.bubble && now > room.bubble.until) room.bubble = null;
    const talkLines = KEEPER_TALK[room.spec.key];
    if (
      room.spec.keeper && talkLines && !room.bubble &&
      now >= room.nextTalkAt &&
      useGame.getState().openShop !== room.spec.key // not while you're talking
    ) {
      room.bubble = { text: pickLine(talkLines.idle), until: now + 4_500 };
      room.nextTalkAt = now + 10_000 + Math.random() * 8_000;
    }

    // spent veins glitter again after a while
    for (const v of room.veins) {
      if (v.charges <= 0 && v.regrowAt > 0 && now >= v.regrowAt) {
        v.charges = Game.VEIN_CHARGES;
        v.regrowAt = 0;
      }
    }

    if (this.player.action === "idle" && this.player.path.length === 0) {
      const cell = this.player.cell;
      // standing on the doormat always leads out
      if (cell.x === room.spec.door.x && cell.y === room.spec.door.y && room.pending === "exit") {
        room.pending = null;
        this.exitInterior();
        return;
      }
      if (room.pending === "shop") {
        room.pending = null;
        const talk = room.spec.counter ?? room.spec.keeper;
        if (talk && chebyshev(cell, talk) <= 1) {
          useGame.getState().setOpenShop(room.spec.key);
          play("ui");
        }
      }
      if (room.pendingVein !== null) {
        const i = room.pendingVein;
        room.pendingVein = null;
        const v = room.veins[i];
        if (v && v.charges > 0 && chebyshev(cell, v) <= 1) this.startVeinMining(i);
      }
    }
  }

  // ---- the Mine: swing at a gold vein until it gives out ------------------------

  private startVeinMining(i: number) {
    const room = this.interior;
    const v = room?.veins[i];
    if (!room || !v || v.charges <= 0) return;
    this.player.updateIsoFacing(v.x - this.player.px, v.y - this.player.py);
    this.player.facing = v.x >= this.player.px ? 1 : -1;
    this.player.action = "gather";
    this.player.gatherMs = 0;
    this.player.gatherTotal = 1800 * gatherSpeedMultiplier();
    this.player.onGatherDone = () => this.onVeinStrike(i);
  }

  private onVeinStrike(i: number) {
    const room = this.interior;
    const v = room?.veins[i];
    if (!room || !v || v.charges <= 0) return;
    const store = useGame.getState();
    v.charges -= 1;
    const gold = 3 + Math.floor(store.skills.mining.level / 2) + Math.floor(Math.random() * 3);
    store.addGold(gold, "vein");
    const { leveledTo } = store.addXp("mining", 6);
    play("mine");
    this.spawnFloater(v.x, v.y, `+${gold}g`, "#e7c873");
    if (leveledTo) store.pushLog(`Mining is now level ${leveledTo}!`, "#e7c873");
    if (v.charges > 0) {
      // keep swinging while the seam holds
      if (chebyshev(this.player.cell, v) <= 1) this.startVeinMining(i);
    } else {
      v.regrowAt = performance.now() + Game.VEIN_REGROW_MS;
      store.pushLog("The vein is spent. Give it time; gold grows back in the dark.", "#a99fb8");
    }
  }

  private handleInteriorClick(cell: Cell) {
    const room = this.interior!;
    const { spec, nav } = room;
    this.clickMarker = { x: cell.x, y: cell.y, t: performance.now() };

    // a gold vein: walk up and start swinging
    const veinIdx = room.veins.findIndex((v) => v.x === cell.x && v.y === cell.y);
    if (veinIdx >= 0) {
      const v = room.veins[veinIdx];
      if (v.charges <= 0) {
        useGame.getState().pushLog("Bare rock. The seam needs time.", "#6f6781");
        return;
      }
      if (chebyshev(this.player.cell, v) <= 1) {
        this.startVeinMining(veinIdx);
        return;
      }
      const adj = this.interiorAdjacent(v);
      if (adj) {
        const path = findPath(nav as unknown as World, this.player.cell, adj);
        if (path) {
          this.player.setPath(path);
          room.pendingVein = veinIdx;
          room.pending = null;
        }
      }
      return;
    }

    // the counter (or the keeper) is the business end: walk up and talk
    const talk = spec.counter ?? spec.keeper;
    const clickedTalk =
      (spec.counter && cell.x === spec.counter.x && cell.y === spec.counter.y) ||
      (spec.keeper && cell.x === spec.keeper.x && cell.y === spec.keeper.y);
    if (clickedTalk && talk) {
      if (chebyshev(this.player.cell, talk) <= 1) {
        useGame.getState().setOpenShop(spec.key);
        play("ui");
        return;
      }
      const adj = this.interiorAdjacent(talk);
      if (adj) {
        const path = findPath(nav as unknown as World, this.player.cell, adj);
        if (path) {
          this.player.setPath(path);
          room.pending = "shop";
        }
      }
      return;
    }

    // the door (or anywhere beyond the room) leads back outside
    const isDoor = cell.x === spec.door.x && cell.y === spec.door.y;
    if (isDoor || !nav.inBounds(cell.x, cell.y)) {
      if (this.player.cell.x === spec.door.x && this.player.cell.y === spec.door.y) {
        this.exitInterior();
        return;
      }
      const path = findPath(nav as unknown as World, this.player.cell, spec.door);
      if (path) {
        this.player.setPath(path);
        room.pending = "exit";
      }
      return;
    }

    // plain stroll
    if (nav.isWalkable(cell.x, cell.y)) {
      const path = findPath(nav as unknown as World, this.player.cell, cell);
      if (path) {
        this.player.setPath(path);
        room.pending = null;
      }
    }
  }

  /** nearest walkable cell adjacent to an interior target */
  private interiorAdjacent(target: Cell): Cell | null {
    const nav = this.interior!.nav;
    let best: Cell | null = null;
    let bestD = Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = target.x + dx;
        const y = target.y + dy;
        if (!nav.isWalkable(x, y)) continue;
        const d = Math.hypot(x - this.player.px, y - this.player.py);
        if (d < bestD) {
          bestD = d;
          best = { x, y };
        }
      }
    }
    return best;
  }

  private drawInterior(ctx: CanvasRenderingContext2D) {
    const { spec } = this.interior!;
    const z = this.camera.zoom;

    // back walls first (the floor laps over their base)
    this.drawInteriorWalls(ctx, spec);

    // floor
    for (let y = 0; y < spec.h; y++) {
      for (let x = 0; x < spec.w; x++) {
        const s = this.tileScreen(x, y);
        spriteCache.drawFloor(ctx, spec.floor, (x * 7 + y * 13) % 3, s.x, s.y, z);
      }
    }

    // doormat glow (the way out)
    const ds = this.tileScreen(spec.door.x, spec.door.y);
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 400) * 0.15;
    ctx.strokeStyle = "#e7c873";
    ctx.lineWidth = Math.max(1, 1.5 * z);
    ctx.beginPath();
    ctx.moveTo(ds.x, ds.y - 14 * z);
    ctx.lineTo(ds.x + 28 * z, ds.y);
    ctx.lineTo(ds.x, ds.y + 14 * z);
    ctx.lineTo(ds.x - 28 * z, ds.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // rugs lie flat under everything
    for (const f of spec.fixtures) {
      if (f.kind !== "rug") continue;
      const s = this.tileScreen(f.x, f.y);
      spriteCache.drawFixture(ctx, "rug", f.accent ?? spec.accent, s.x, s.y, z);
    }

    // depth-sorted: fixtures + keeper + you
    const draws: { d: number; fn: () => void }[] = [];
    for (const f of spec.fixtures) {
      if (f.kind === "rug") continue;
      draws.push({
        d: f.x + f.y,
        fn: () => {
          const s = this.tileScreen(f.x, f.y);
          spriteCache.drawFixture(ctx, f.kind, f.accent ?? spec.accent, s.x, s.y, z);
        },
      });
    }
    // gold veins (the Mine): rich or spent
    for (const v of this.interior!.veins) {
      draws.push({
        d: v.x + v.y,
        fn: () => {
          const s = this.tileScreen(v.x, v.y);
          spriteCache.drawFixture(
            ctx, v.charges > 0 ? "goldVein" : "goldVeinEmpty", spec.accent, s.x, s.y, z,
          );
        },
      });
    }
    if (spec.keeper) {
      const keeper = spec.keeper;
      draws.push({
        d: keeper.x + keeper.y,
        fn: () => {
          const s = this.tileScreen(keeper.x, keeper.y);
          const frame = Math.floor(performance.now() / 700) % 2;
          spriteCache.drawChar(
            ctx, "s", false, "idle", frame, s.x, s.y, z,
            undefined,
            { dye: (spec.keeperDye ?? "stone") as DyeKey, eye: "ember" },
          );
        },
      });
    }
    draws.push({
      d: this.player.px + this.player.py,
      fn: () => this.drawWandererEntity(ctx, this.player, true),
    });
    draws.sort((a, b) => a.d - b.d).forEach((d) => d.fn());

    // keeper speech bubble (door reactions + small talk)
    const bubble = this.interior!.bubble;
    if (bubble && spec.keeper) {
      const ks = this.tileScreen(spec.keeper.x, spec.keeper.y);
      const bx = ks.x;
      const by = ks.y - 50 * z;
      ctx.font = `${8 * z}px ui-sans-serif`;
      const tw = ctx.measureText(bubble.text).width;
      const pad = 5 * z;
      const fade = Math.min(1, (bubble.until - performance.now()) / 400);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, fade));
      ctx.fillStyle = "rgba(10,8,16,0.88)";
      ctx.strokeStyle = "rgba(169,159,184,0.55)";
      ctx.lineWidth = Math.max(1, z);
      ctx.beginPath();
      ctx.rect(bx - tw / 2 - pad, by - 11 * z, tw + pad * 2, 15 * z);
      ctx.fill();
      ctx.stroke();
      // little tail toward the keeper
      ctx.beginPath();
      ctx.moveTo(bx - 3 * z, by + 4 * z);
      ctx.lineTo(bx, by + 8 * z);
      ctx.lineTo(bx + 3 * z, by + 4 * z);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e7e1ee";
      ctx.textAlign = "center";
      ctx.fillText(bubble.text, bx, by);
      ctx.textAlign = "left";
      ctx.restore();
    }

    // floaters (mining gold pops) ride the same screen-space pipeline
    this.drawJuice(ctx);

    // room title floats over the back wall
    const top = this.tileScreen(Math.floor(spec.w / 2), 0);
    ctx.textAlign = "center";
    ctx.font = `${8 * z}px ui-sans-serif`;
    ctx.fillStyle = "rgba(216,207,224,0.6)";
    ctx.fillText(spec.title, top.x, top.y - 52 * z);
    ctx.font = `${6.5 * z}px ui-sans-serif`;
    ctx.fillStyle = "rgba(167,159,184,0.45)";
    ctx.fillText(
      spec.veins?.length
        ? "swing at the glittering veins · the lit doorway leads out"
        : "walk to the counter to trade · the lit doorway leads out",
      top.x, top.y - 42 * z,
    );
    ctx.textAlign = "left";
  }

  /** DS wall2 segments: skewed parallelogram faces tiled per back-edge tile.
   *  ne segments anchor at each row-0 tile's NORTH corner; nw segments at each
   *  column-0 tile's WEST corner; a corner wedge caps the junction. */
  private drawInteriorWalls(ctx: CanvasRenderingContext2D, spec: InteriorSpec) {
    const z = this.camera.zoom;
    const mat = spec.cave ? "cave" : spec.floor === "stone" ? "block" : "timber";
    // back-left face (column x=0, moonlit): window mid-wall (cave: gold seam)
    for (let y = 0; y < spec.h; y++) {
      const s = this.tileScreen(0, y);
      const variant =
        y === Math.floor(spec.h / 2) ? (spec.cave ? "seam" : "window") : "plain";
      spriteCache.drawWall2(ctx, "nw", mat, variant, spec.accent, s.x - 32 * z, s.y, z);
    }
    // back-right face (row y=0, shadowed): banner mid-wall (cave: lantern)
    for (let x = 0; x < spec.w; x++) {
      const s = this.tileScreen(x, 0);
      const variant =
        x === Math.floor(spec.w / 2) ? (spec.cave ? "lantern" : "banner") : "plain";
      spriteCache.drawWall2(ctx, "ne", mat, variant, spec.accent, s.x, s.y - 16 * z, z);
    }
    // the junction wedge at the room's north corner
    const n = this.tileScreen(0, 0);
    spriteCache.drawWall2Corner(ctx, mat, n.x, n.y - 16 * z, z);
  }

  // ---- the wild quadrants: Husk Den + the Drowned Field -------------------------

  /** Husk Den (Ashen Flats): clear the elite pack, crack the war-chest */
  private den = { packIds: [] as number[], looted: false, respawnAt: 0 };
  /** Drowned Field (Hollowmere Reach): lore graves + a wandering lost tombstone */
  private static readonly DROWNED_FIELD: Cell[] = [
    { x: 13, y: 34 }, { x: 15, y: 35 }, { x: 17, y: 34 },
    { x: 14, y: 36 }, { x: 16, y: 37 }, { x: 12, y: 36 },
  ];
  private lostTomb: { x: number; y: number; gold: number } | null = null;
  private nextLostTombAt = performance.now() + 120_000 + Math.random() * 180_000;

  private spawnDenPack() {
    if (this.net) return; // online the server owns the pack (schema puppets)
    const den = WILD_STRUCTURES.find((w) => w.key === "huskden");
    if (!den) return;
    this.combat.removePack(this.den.packIds);
    this.den.packIds = this.combat.spawnPackAt(this.world, den.x, den.y, 5, 5);
    this.den.looted = false;
    this.den.respawnAt = 0;
  }

  private denPackAlive(): boolean {
    if (this.net) {
      // shared pack: any living puppet husk holding the den's ground
      const den = WILD_STRUCTURES.find((w) => w.key === "huskden");
      if (!den) return false;
      return this.combat.mobs.some(
        (m) =>
          m.netId != null &&
          m.state !== "dead" &&
          Math.max(Math.abs(m.px - den.x), Math.abs(m.py - den.y)) <= 6,
      );
    }
    return this.combat.mobs.some(
      (m) => this.den.packIds.includes(m.id) && m.state !== "dead",
    );
  }

  private denInteract() {
    const store = useGame.getState();
    if (this.denPackAlive()) {
      store.pushLog("The den seethes with husks. Clear them first.", "#a855f7");
      return;
    }
    if (this.den.looted) {
      store.pushLog("The war-chest sits empty. Something stirs below…", "#6f6781");
      return;
    }
    this.den.looted = true;
    this.den.respawnAt = performance.now() + 15 * 60_000;
    const gold = 60 + Math.floor(Math.random() * 41);
    store.addGold(gold, "chest");
    store.addItem("driftshard", 2, "chest");
    play("coin");
    store.pushLog(`You crack the den's war-chest: ${gold}g and 2 Drift Shards.`, "#e7c873");
  }

  /** den re-seeds + lost tombstones surface, on their own clocks */
  private updateWildQuadrants() {
    const now = performance.now();
    if (this.den.looted && this.den.respawnAt > 0 && now >= this.den.respawnAt) {
      if (this.net) {
        // server reseeds the pack itself; just re-arm the (client-local) chest
        this.den.looted = false;
        this.den.respawnAt = 0;
      } else {
        this.spawnDenPack();
      }
      useGame.getState().pushLog("The Husk Den stirs again in the Flats.", "#a855f7");
    }
    if (!this.lostTomb && now >= this.nextLostTombAt) {
      const field = Game.DROWNED_FIELD;
      const base = field[(Math.random() * field.length) | 0];
      const x = base.x + ((Math.random() * 3) | 0) - 1;
      const y = base.y + ((Math.random() * 3) | 0) - 1;
      if (this.world.isWalkable(x, y)) {
        this.lostTomb = { x, y, gold: 30 + Math.floor(Math.random() * 51) };
        useGame.getState().pushLog(
          "A lost tombstone surfaces in the Drowned Field…",
          "#a99fb8",
        );
      }
      this.nextLostTombAt = now + 360_000 + Math.random() * 240_000;
    }
  }

  private tryReclaimLostTomb(cell: Cell): boolean {
    const t = this.lostTomb;
    if (!t || cell.x !== t.x || cell.y !== t.y) return false;
    if (chebyshev(this.player.cell, t) <= 1) {
      const store = useGame.getState();
      store.addGold(t.gold, "losttomb");
      play("reclaim");
      store.pushLog(`The lost tombstone gives up ${t.gold}g. Rest now.`, "#e7c873");
      this.lostTomb = null;
    } else {
      useGame.getState().pushLog("Old bones. Step closer.", "#6f6781");
    }
    return true;
  }

  // ---- rendering ------------------------------------------------------------

  private resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.camera.setViewport(w, h);
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    // screen shake on heavy hits
    if (performance.now() < this.shakeUntil) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeMag,
        (Math.random() - 0.5) * this.shakeMag,
      );
    }
    ctx.clearRect(-12, -12, this.camera.viewW + 24, this.camera.viewH + 24);

    // background vignette
    const g = ctx.createRadialGradient(
      this.camera.viewW / 2,
      this.camera.viewH / 2,
      80,
      this.camera.viewW / 2,
      this.camera.viewH / 2,
      Math.max(this.camera.viewW, this.camera.viewH),
    );
    g.addColorStop(0, "#0d0a16");
    g.addColorStop(1, "#06040b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.camera.viewW, this.camera.viewH);

    if (this.interior) {
      this.drawInterior(ctx);
      ctx.restore();
      return;
    }

    this.drawGround(ctx);
    this.drawClaims(ctx);
    this.drawClickMarker(ctx);
    this.drawEntities(ctx);
    this.drawJuice(ctx);
    this.drawAtmosphere(ctx);
    this.drawAmbientFx(ctx);

    ctx.restore();
  }

  // damage floaters, hit sparks and the level-up burst
  private drawJuice(ctx: CanvasRenderingContext2D) {
    const z = this.camera.zoom;
    const now = performance.now();

    // hit sparks: tiny pixels with gravity, ~450ms
    this.sparkParts = this.sparkParts.filter((p) => now - p.t0 < 450);
    for (const p of this.sparkParts) {
      const t = (now - p.t0) / 1000;
      const iso = gridToIso(p.gx + p.vx * t, p.gy + p.vy * t + 2.2 * t * t);
      const s = this.camera.worldToScreen(iso.x, iso.y);
      ctx.globalAlpha = 1 - t / 0.45;
      ctx.fillStyle = p.color;
      ctx.fillRect(s.x, s.y - 18 * z, 2 * z, 2 * z);
    }
    ctx.globalAlpha = 1;

    // damage floaters: rise and fade, ~900ms
    this.floaters = this.floaters.filter((f) => now - f.t0 < 900);
    for (const f of this.floaters) {
      const t = (now - f.t0) / 900;
      const iso = gridToIso(f.gx, f.gy);
      const s = this.camera.worldToScreen(iso.x, iso.y);
      ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      ctx.font = `700 ${11 * z}px ui-sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(10,8,16,0.8)";
      ctx.fillText(f.txt, s.x + 1, s.y - (30 + t * 22) * z + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.txt, s.x, s.y - (30 + t * 22) * z);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";

    // driftfall: violet beam + ring at the crash site, ~2.5s
    if (this.driftfallFx && now - this.driftfallFx.t0 < 2500) {
      const t = (now - this.driftfallFx.t0) / 2500;
      const iso = gridToIso(this.driftfallFx.gx, this.driftfallFx.gy);
      const s = this.camera.worldToScreen(iso.x, iso.y);
      ctx.save();
      const beamA = t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75;
      const bg = ctx.createLinearGradient(0, s.y - 240 * z, 0, s.y);
      bg.addColorStop(0, "rgba(216,180,254,0)");
      bg.addColorStop(1, `rgba(168,85,247,${0.5 * beamA})`);
      ctx.fillStyle = bg;
      ctx.fillRect(s.x - 10 * z, s.y - 240 * z, 20 * z, 240 * z);
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2 * z;
      const rr = (4 + t * 50) * z;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rr, rr * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (this.driftfallFx && now - this.driftfallFx.t0 >= 2500) {
      this.driftfallFx = null;
    }

    // claim reinforcement: a gold warding ring closing in over the 3×3, ~1.8s
    if (this.wardFx && now - this.wardFx.t0 < 1800) {
      const t = (now - this.wardFx.t0) / 1800;
      const iso = gridToIso(this.wardFx.gx, this.wardFx.gy);
      const s = this.camera.worldToScreen(iso.x, iso.y);
      ctx.save();
      ctx.globalAlpha = 0.9 * (1 - t);
      ctx.strokeStyle = "#e7c873";
      ctx.lineWidth = 2 * z;
      const rr = (60 - t * 38) * z; // closes inward: the warding takes hold
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rr, rr * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.5 * (1 - t);
      ctx.strokeStyle = "#f6e0a6";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rr * 0.7, rr * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (this.wardFx && now - this.wardFx.t0 >= 1800) {
      this.wardFx = null;
    }

    // level-up: expanding gold ring + light pillar, ~750ms
    if (this.levelFlashT0 && now - this.levelFlashT0 < 750) {
      const t = (now - this.levelFlashT0) / 750;
      const iso = gridToIso(this.player.px, this.player.py);
      const s = this.camera.worldToScreen(iso.x, iso.y);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = "#e7c873";
      ctx.lineWidth = 2 * z;
      const r = (6 + t * 34) * z;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      // pillar of light
      const pg = ctx.createLinearGradient(0, s.y - 80 * z, 0, s.y);
      pg.addColorStop(0, "rgba(231,200,115,0)");
      pg.addColorStop(1, `rgba(231,200,115,${0.35 * (1 - t)})`);
      ctx.fillStyle = pg;
      ctx.fillRect(s.x - 8 * z, s.y - 80 * z, 16 * z, 80 * z);
      ctx.restore();
    }
  }

  // Corruption light pools, a moonlight radius around the wanderer, and a soft
  // foreground vignette. Drawn over entities so corrupted ground tints anything
  // standing in it.
  private drawAtmosphere(ctx: CanvasRenderingContext2D) {
    const z = this.camera.zoom;
    const now = performance.now();

    // slow day/night breath (8-min cycle); deep night leans cold blue
    const night = 0.5 - 0.5 * Math.cos(((now / 480_000) % 1) * Math.PI * 2);

    // pulsing additive glow on corrupt ground — fiercer in the dark
    const pulse = (0.55 + Math.sin(now / 900) * 0.2) * (1 + night * 0.5);
    for (const gpos of this.corruptGlows) {
      spriteCache.drawGlow(ctx, gpos.sx, gpos.sy, z, pulse);
    }

    ctx.fillStyle = `rgba(10, 12, 34, ${0.16 * night})`;
    ctx.fillRect(0, 0, this.camera.viewW, this.camera.viewH);

    // red pulse at the screen edges when recently hurt
    if (now - this.lastHurtT0 < 600) {
      const t = (now - this.lastHurtT0) / 600;
      const cw2 = this.camera.viewW, ch2 = this.camera.viewH;
      const hg = ctx.createRadialGradient(
        cw2 / 2, ch2 / 2, Math.min(cw2, ch2) * 0.35,
        cw2 / 2, ch2 / 2, Math.max(cw2, ch2) * 0.7,
      );
      hg.addColorStop(0, "rgba(220,38,38,0)");
      hg.addColorStop(1, `rgba(220,38,38,${0.35 * (1 - t)})`);
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, cw2, ch2);
    }

    // ash-storm: gray veil over everything
    if (this.storm) {
      ctx.fillStyle = "rgba(23,19,32,0.16)";
      ctx.fillRect(0, 0, this.camera.viewW, this.camera.viewH);
    }

    // region / event banner — fades in, holds, fades out (~3s)
    if (this.banner && now - this.banner.t0 < 3000) {
      const t = (now - this.banner.t0) / 3000;
      const a = t < 0.15 ? t / 0.15 : t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = "center";
      ctx.font = `700 22px ui-sans-serif`;
      const bx = this.camera.viewW / 2;
      ctx.fillStyle = "rgba(10,8,16,0.85)";
      ctx.fillText(this.banner.name.toUpperCase(), bx + 2, 92);
      ctx.fillStyle = this.banner.name === "ASH-STORM" ? "#a99fb8" : "#e7c873";
      ctx.fillText(this.banner.name.toUpperCase(), bx, 90);
      ctx.restore();
      ctx.textAlign = "left";
    } else if (this.banner) {
      this.banner = null;
    }

    // moonlight: the world dims away from the wanderer
    const p = this.tileScreen(this.player.px, this.player.py);
    const r0 = 170 * z;
    const r1 = Math.max(this.camera.viewW, this.camera.viewH) * 0.85;
    const veil = ctx.createRadialGradient(p.x, p.y - 14 * z, r0, p.x, p.y - 14 * z, r1);
    veil.addColorStop(0, "rgba(6,4,11,0)");
    veil.addColorStop(0.6, "rgba(6,4,11,0.22)");
    veil.addColorStop(1, "rgba(6,4,11,0.5)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, this.camera.viewW, this.camera.viewH);

    // foreground vignette — frames the scene without crushing the HUD corners
    const cw = this.camera.viewW, ch = this.camera.viewH;
    const vig = ctx.createRadialGradient(
      cw / 2, ch / 2, Math.min(cw, ch) * 0.45,
      cw / 2, ch / 2, Math.max(cw, ch) * 0.75,
    );
    vig.addColorStop(0, "rgba(10,8,16,0)");
    vig.addColorStop(1, "rgba(10,8,16,0.32)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, cw, ch);
  }

  // Ambient drift motes + ash drifting across the viewport. Screen-space and
  // camera-independent (mirrors the DS world preview) — cheap atmosphere that
  // makes the Drift feel alive. Denser as corruption deepens.
  private drawAmbientFx(ctx: CanvasRenderingContext2D) {
    const W = this.camera.viewW;
    const H = this.camera.viewH;
    const t = performance.now() / 1000;
    const drift = useGame.getState().driftPct;
    // 22 → 44 with corruption; an ash-storm triples the density
    let count = 22 + Math.round((drift / 100) * 22);
    if (this.storm) count *= 3;

    ctx.save();
    for (let i = 0; i < count; i++) {
      const isMote = i % 4 === 0;
      const speed = (0.3 + (i % 3) * 0.2) * (this.storm ? 2.5 : 1);
      const mx = (i * 97 + t * speed * 18) % W;
      const my = (i * 53 + Math.sin(t * 0.6 + i) * 18 + t * 9) % H;
      const x = W - mx;
      const y = my;
      if (isMote) {
        // purple drift mote with a faint glow
        ctx.fillStyle = "rgba(168,85,247,0.8)";
        ctx.fillRect(x, y, 2, 2);
        ctx.fillStyle = "rgba(216,180,254,0.35)";
        ctx.fillRect(x, y - 1, 1, 1);
      } else {
        ctx.fillStyle = "rgba(216,207,224,0.22)";
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.restore();
  }

  private tileScreen(gx: number, gy: number) {
    const iso = gridToIso(gx, gy);
    return this.camera.worldToScreen(iso.x, iso.y);
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    const z   = this.camera.zoom;
    const hw  = (TILE_W / 2) * z;
    const hh  = (TILE_H / 2) * z;
    const now = performance.now();
    // animation frame indices
    const waterF   = Math.floor(now / 250) % 4;
    const corruptF = Math.floor(now / 500) % 6;

    const tileAt = (gx: number, gy: number): TileType | null =>
      this.world.inBounds(gx, gy) ? (this.world.tile(gx, gy) as TileType) : null;

    // doodads + corruption glows render after every tile (painter's order)
    const doodads: { kind: DoodadKind; v: number; sx: number; sy: number }[] = [];
    this.corruptGlows.length = 0;

    for (let y = 0; y < this.world.h; y++) {
      for (let x = 0; x < this.world.w; x++) {
        const s = this.tileScreen(x, y);
        if (
          s.x < -hw * 2 || s.x > this.camera.viewW + hw * 2 ||
          s.y < -hh * 2 || s.y > this.camera.viewH + hh * 4
        ) continue;

        const t = this.world.tile(x, y) as TileType;
        const frame = t === 'water' ? waterF : t === 'corrupt' ? corruptF : 0;

        // neighbour-aware looks: hard outline only at type boundaries; dither
        // grass↔dirt along south edges; foam where water meets land
        const nw = tileAt(x - 1, y), nn = tileAt(x, y - 1);
        const se = tileAt(x + 1, y), ss = tileAt(x, y + 1);
        const edge = nw !== t || nn !== t;
        let blendInto: TileType | null = null;
        if (t === 'grass' || t === 'dirt') {
          const o = t === 'grass' ? 'dirt' : 'grass';
          if (se === o || ss === o) blendInto = o;
        }
        const shore =
          t === 'water' &&
          [nw, nn, se, ss].some((n) => n !== null && n !== 'water');

        spriteCache.drawTile(ctx, t, s.x, s.y, z, frame, {
          variant: (hash2(x, y, 5) * 3) | 0,
          edge,
          blendInto,
          shore,
        });

        if (t === 'corrupt') this.corruptGlows.push({ sx: s.x, sy: s.y });

        // deterministic clutter — same cell always grows the same tuft.
        // the wild quadrants grow their own kinds (DS wilds pack): bone
        // spikes + dead trees ring the Husk Den, reeds crowd the mire
        const nearDen  = Math.max(Math.abs(x - 8), Math.abs(y - 8)) <= 8;
        const nearMire =
          Math.max(Math.abs(x - 5), Math.abs(y - 24)) <= 8 ||
          Math.max(Math.abs(x - 7), Math.abs(y - 34)) <= 6; // the Hollowmere
        // the Threshold grows NO decorative clutter: the only tree/rock/pool
        // on screen must be the real lesson nodes (the den's clutter zone
        // would otherwise blanket this tiny map with fake dead trees)
        if (!this.tutorial && t !== 'water' && !this.world.getNode(x, y) && !buildingAt(x, y)) {
          const h = hash2(x, y, 91);
          let kind: DoodadKind | null = null;
          if (t === 'corrupt') {
            if (h < 0.10) kind = 'crystal';
          } else if ([nw, nn, se, ss].includes('corrupt') && h < 0.08) {
            kind = 'crystal'; // corruption seeps ahead of itself
          } else if (nearDen) {
            if (h < 0.05) kind = 'bone_spike';
            else if (h < 0.075) kind = 'dead_tree';
            else if (h < 0.09) kind = 'bones';
          } else if (nearMire && (t === 'grass' || t === 'dirt')) {
            if (h < 0.11) kind = 'reed_clump';
            else if (h < 0.125) kind = 'dead_tree';
          } else if (t === 'grass') {
            if (h < 0.05) kind = 'tuft';
            else if (h < 0.062) kind = 'pebbles';
            else if (h < 0.07) kind = 'bones';
          } else if (t === 'dirt') {
            if (h < 0.05) kind = 'pebbles';
            else if (h < 0.062) kind = 'masonry';
          } else if (t === 'stone') {
            if (h < 0.06) kind = 'masonry';
          }
          if (kind) {
            doodads.push({
              kind,
              v: (hash2(x, y, 92) * 2) | 0,
              sx: s.x + (hash2(x, y, 93) - 0.5) * 14 * z,
              sy: s.y + (hash2(x, y, 94) - 0.5) * 6 * z,
            });
          }
        }
        // bog bubbles swell on the mire's water (2-frame, slow and staggered)
        if (t === 'water' && nearMire && hash2(x, y, 95) < 0.2) {
          doodads.push({
            kind: 'mire_bubble',
            v: (Math.floor(now / 700) + ((hash2(x, y, 96) * 2) | 0)) % 2,
            sx: s.x + (hash2(x, y, 93) - 0.5) * 14 * z,
            sy: s.y + (hash2(x, y, 94) - 0.5) * 6 * z,
          });
        }

        // hover highlight (drawn over the tile, using diamond path)
        if (this.hover && this.hover.x === x && this.hover.y === y) {
          this.diamond(ctx, s.x, s.y, hw, hh, "rgba(231,200,115,0.18)");
          ctx.strokeStyle = "rgba(231,200,115,0.7)";
          ctx.lineWidth   = 1.5;
          this.diamondPath(ctx, s.x, s.y, hw, hh);
          ctx.stroke();
        }
      }
    }

    for (const d of doodads) spriteCache.drawDoodad(ctx, d.kind, d.v, d.sx, d.sy, z);
  }

  /** stroke the iso outline of a 3×3 plot centered on (cx, cy) */
  private plotPath(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const z = this.camera.zoom;
    const hw = (TILE_W / 2) * z;
    const hh = (TILE_H / 2) * z;
    const n = this.tileScreen(cx - 1, cy - 1);
    const e = this.tileScreen(cx + 1, cy - 1);
    const s = this.tileScreen(cx + 1, cy + 1);
    const w = this.tileScreen(cx - 1, cy + 1);
    ctx.beginPath();
    ctx.moveTo(n.x, n.y - hh);
    ctx.lineTo(e.x + hw, e.y);
    ctx.lineTo(s.x, s.y + hh);
    ctx.lineTo(w.x - hw, w.y);
    ctx.closePath();
  }

  /** land claim borders + the staking preview */
  private drawClaims(ctx: CanvasRenderingContext2D) {
    const z = this.camera.zoom;
    const now = performance.now();

    if (this.net) {
      this.net.forEachClaim((c) => {
        const mine = this.myClaimIds.has(c.id);
        const failing = c.integrity <= 30;
        ctx.save();
        if (failing) ctx.globalAlpha = 0.6 + Math.sin(now / 250) * 0.35;
        ctx.strokeStyle = failing ? "#dc2626" : mine ? "#e7c873" : "#7c6f93";
        ctx.lineWidth = Math.max(1.5, 2 * z);
        ctx.setLineDash(mine ? [] : [6 * z, 4 * z]);
        this.plotPath(ctx, c.x, c.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // owner tag + integrity at the north corner
        const n = this.tileScreen(c.x - 1, c.y - 1);
        ctx.textAlign = "center";
        ctx.font = `${7.5 * z}px ui-sans-serif`;
        ctx.fillStyle = mine ? "rgba(231,200,115,0.85)" : "rgba(216,207,224,0.55)";
        ctx.fillText(
          `${c.ownerName}${mine ? ` · ${Math.max(0, Math.round(c.integrity))}%` : ""}`,
          n.x,
          n.y - (TILE_H / 2 + 6) * z,
        );
        ctx.textAlign = "left";
        ctx.restore();
      });
    }

    // staking preview under the cursor
    if (useGame.getState().claimMode && this.hover) {
      const { x, y } = this.hover;
      let valid = true;
      for (let dy = -1; dy <= 1 && valid; dy++) {
        for (let dx = -1; dx <= 1 && valid; dx++) {
          if (!this.world.inBounds(x + dx, y + dy)) valid = false;
          else {
            const t = this.world.tile(x + dx, y + dy);
            if (t === "water" || t === "corrupt") valid = false;
          }
        }
      }
      this.net?.forEachClaim((c) => {
        if (Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) < 3) valid = false;
      });
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = valid ? "#4d7c4d" : "#dc2626";
      ctx.lineWidth = 2.5 * z;
      this.plotPath(ctx, x, y);
      ctx.stroke();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = valid ? "#4d7c4d" : "#dc2626";
      this.plotPath(ctx, x, y);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawClickMarker(ctx: CanvasRenderingContext2D) {
    if (!this.clickMarker) return;
    const age = performance.now() - this.clickMarker.t;
    if (age > 500) {
      this.clickMarker = null;
      return;
    }
    const s = this.tileScreen(this.clickMarker.x, this.clickMarker.y);
    const k = age / 500;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = "#e7c873";
    ctx.lineWidth = 2;
    const r = (8 + k * 14) * this.camera.zoom;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, r, r * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawEntities(ctx: CanvasRenderingContext2D) {
    // depth-sort nodes + player by (gx+gy) then y
    type Draw = { depth: number; fn: () => void };
    const draws: Draw[] = [];

    // the Threshold's set pieces (Gatewarden, beacon, the gate)
    this.tutorial?.pushDraws(draws, ctx, (gx, gy) => this.tileScreen(gx, gy), this.camera.zoom);

    for (const node of this.world.nodes) {
      if (node.regrowIn > 0) continue; // depleted = invisible until it re-forms
      const depth = node.gx + node.gy;
      draws.push({ depth, fn: () => this.drawNode(ctx, node) });
    }
    for (const b of ALL_STRUCTURES) {
      if (this.tutorial) break; // the Threshold has no structures of the realm
      // pit floor draws under everything; houses depth-sort on their south edge
      const depth = b.key === "pit" ? -1000 : b.x + b.y + b.r;
      draws.push({
        depth,
        fn: () => {
          const s = this.tileScreen(b.x, b.y + (b.key === "pit" ? 0 : b.r));
          // shrine flame 4fps · den eyes blink 2fps · obelisk runes pulse 4fps
          const frame =
            b.key === "shrine"  ? Math.floor(performance.now() / 250) % 3 :
            b.key === "huskden" ? Math.floor(performance.now() / 500) % 2 :
            b.key === "obelisk" ? Math.floor(performance.now() / 250) % 3 : 0;
          // east-side houses mirror so their features lean toward town center
          const mirror =
            b.key !== "pit" && b.key !== "shrine" && b.x > TOWN_CENTER.x;
          spriteCache.drawBuilding(ctx, b.key, s.x, s.y, this.camera.zoom, frame, mirror);
          // label floats above the building (sprite top is height-16 above the anchor)
          if (b.key !== "pit") {
            const z = this.camera.zoom;
            const top = s.y - (spriteCache.buildingHeight(b.key) - 8) * z;
            ctx.textAlign = "center";
            ctx.font = `600 ${9 * z}px ui-sans-serif`;
            ctx.lineJoin = "round";
            ctx.strokeStyle = "rgba(10,8,16,0.9)";
            ctx.lineWidth = 3 * z;
            ctx.strokeText(b.label, s.x, top);
            ctx.fillStyle = "#e7e1ee";
            ctx.fillText(b.label, s.x, top);
            ctx.textAlign = "left";
          }
        },
      });
    }
    // the caravan wagon (server-synced; only exists in the shared world)
    const caravan = this.net?.caravan;
    if (caravan && (caravan.phase === "rolling" || caravan.phase === "ambushed")) {
      const cv = caravan;
      draws.push({
        depth: cv.x + cv.y,
        fn: () => {
          const s = this.tileScreen(cv.x, cv.y);
          const z = this.camera.zoom;
          const frame = cv.phase === "rolling" ? Math.floor(performance.now() / 220) % 2 : 0;
          spriteCache.drawWagon(ctx, s.x, s.y, z, frame);
          // hp bar over the wagon once it has taken damage
          if (cv.hp < cv.maxHp) {
            const w = 36 * z;
            const pct = Math.max(0, cv.hp / Math.max(1, cv.maxHp));
            ctx.fillStyle = "rgba(10,8,16,0.7)";
            ctx.fillRect(s.x - w / 2, s.y - 48 * z, w, 4 * z);
            ctx.fillStyle = pct > 0.4 ? "#4d7c4d" : "#dc2626";
            ctx.fillRect(s.x - w / 2, s.y - 48 * z, w * pct, 4 * z);
          }
          ctx.textAlign = "center";
          ctx.font = `${7 * z}px ui-sans-serif`;
          ctx.fillStyle = cv.phase === "ambushed" ? "rgba(220,38,38,0.85)" : "rgba(216,207,224,0.5)";
          ctx.fillText(cv.phase === "ambushed" ? "AMBUSHED" : "Caravan", s.x, s.y - 52 * z);
          ctx.textAlign = "left";
        },
      });
    }

    // the Drowned Field: sunken lore graves + sometimes a lost tombstone
    for (const grave of this.tutorial ? [] : Game.DROWNED_FIELD) {
      draws.push({
        depth: grave.x + grave.y,
        fn: () => {
          const s = this.tileScreen(grave.x, grave.y);
          ctx.save();
          ctx.globalAlpha = 0.75;
          spriteCache.drawLostTomb(ctx, true, s.x, s.y, this.camera.zoom);
          ctx.restore();
        },
      });
    }
    if (this.lostTomb) {
      const t = this.lostTomb;
      draws.push({
        depth: t.x + t.y,
        fn: () => {
          const s = this.tileScreen(t.x, t.y);
          const z = this.camera.zoom;
          // the rich slab carries its own gold glint; shimmer marks it apart
          spriteCache.drawLostTomb(ctx, false, s.x, s.y, z);
          ctx.save();
          ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 300) * 0.25;
          ctx.fillStyle = "#e7c873";
          ctx.fillRect(s.x - 1.5 * z, s.y - 22 * z, 3 * z, 3 * z);
          ctx.restore();
        },
      });
    }

    for (const mob of this.combat.mobs) {
      // freshly dead beasts play their crumble animation before vanishing
      if (mob.state === "dead" && mob.deathT > 1.2) continue;
      draws.push({ depth: mob.px + mob.py, fn: () => this.drawMob(ctx, mob) });
    }
    for (const r of this.remotes.values()) {
      draws.push({
        depth: r.px + r.py,
        fn: () => this.drawWandererEntity(ctx, r, false),
      });
    }
    // while a duel runs, the Pit DRESSES: blood-sand floor, the ring palisade,
    // corner torches, old blood, and hooded watchers (decor, everyone sees it)
    if (this.activeDuel) {
      const z = this.camera.zoom;
      // blood-sand floor over the ring cells (under everything that stands)
      for (let ax = ARENA.x - ARENA.r; ax <= ARENA.x + ARENA.r; ax++) {
        for (let ay = ARENA.y - ARENA.r; ay <= ARENA.y + ARENA.r; ay++) {
          const v: "a" | "b" | "c" | "blood" =
            ax === ARENA.x && ay === ARENA.y ? "blood"
            : (["a", "b", "c"] as const)[(ax * 7 + ay * 13) % 3];
          const seed = v === "blood" ? 22 : 1 + ((ax * 7 + ay * 13) % 3) * 7;
          const fx = ax, fy = ay;
          draws.push({
            depth: -900 + (fx + fy) * 0.001,
            fn: () => {
              const s = this.tileScreen(fx, fy);
              spriteCache.drawArenaFloor(ctx, v, seed, s.x, s.y, z);
            },
          });
        }
      }
      // old blood on the sand
      for (const b of ARENA_BLOOD) {
        draws.push({
          depth: -890,
          fn: () => {
            const s = this.tileScreen(b.x, b.y);
            spriteCache.drawBloodFx(ctx, b.v, s.x, s.y, z);
          },
        });
      }
      // the palisade: nw face down the west edge (gate at its middle), ne face
      // along the north edge — same seam math as the interior W2 walls
      for (let ay = ARENA.y - ARENA.r; ay <= ARENA.y + ARENA.r; ay++) {
        const fy = ay;
        const isGate = ay === ARENA.y;
        draws.push({
          depth: (ARENA.x - ARENA.r) + fy - 0.5,
          fn: () => {
            const s = this.tileScreen(ARENA.x - ARENA.r, fy);
            if (isGate) spriteCache.drawArenaGate(ctx, "nw", s.x - 32 * z, s.y, z);
            else spriteCache.drawArenaRing(ctx, "nw", fy % 2 ? "b" : "a", s.x - 32 * z, s.y, z);
          },
        });
      }
      for (let ax = ARENA.x - ARENA.r; ax <= ARENA.x + ARENA.r; ax++) {
        const fx = ax;
        draws.push({
          depth: fx + (ARENA.y - ARENA.r) - 0.5,
          fn: () => {
            const s = this.tileScreen(fx, ARENA.y - ARENA.r);
            spriteCache.drawArenaRing(ctx, "ne", fx % 2 ? "b" : "a", s.x, s.y - 16 * z, z);
          },
        });
      }
      // corner torches (4fps flame)
      for (const t of ARENA_TORCHES) {
        draws.push({
          depth: t.x + t.y,
          fn: () => {
            const s = this.tileScreen(t.x, t.y);
            spriteCache.drawArenaTorch(ctx, Math.floor(performance.now() / 250) % 3, s.x, s.y, z);
          },
        });
      }
      // the watchers: each breathes on their own clock; one cheers in turn
      ARENA_CROWD.forEach((c, i) => {
        draws.push({
          depth: c.x + c.y,
          fn: () => {
            const s = this.tileScreen(c.x, c.y);
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, 9 * z, 4.5 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            const t = performance.now() + i * 530;
            const cheer = Math.floor(t / 2400) % ARENA_CROWD.length === i;
            spriteCache.drawArenaWatcher(
              ctx, c.v, cheer ? "cheer" : "idle", Math.floor(t / 500) % 2, s.x, s.y, z,
            );
          },
        });
      });
    }
    if (this.tomb) {
      const t = this.tomb;
      draws.push({
        depth: t.x + t.y,
        fn: () => {
          const s = this.tileScreen(t.x, t.y);
          spriteCache.drawTombstone(ctx, s.x, s.y, this.camera.zoom);
        },
      });
    }
    // claim furnishings (campfires flicker)
    this.net?.forEachProp((p) => {
      draws.push({
        depth: p.x + p.y,
        fn: () => {
          const s = this.tileScreen(p.x, p.y);
          const frame = Math.floor(performance.now() / 350) % 2;
          spriteCache.drawProp(ctx, p.kind, frame, s.x, s.y, this.camera.zoom);
        },
      });
    });
    // guild territory banners: one per held region, the tag on the plate
    this.net?.forEachGuild((g) => {
      if (!g.region || g.regionSecsLeft <= 0) return;
      const cell = REGION_BANNER_CELLS[g.region];
      if (!cell) return;
      draws.push({
        depth: cell.x + cell.y,
        fn: () => {
          const s = this.tileScreen(cell.x, cell.y);
          const z = this.camera.zoom;
          const frame = Math.floor(performance.now() / 333) % 3;
          spriteCache.drawGuildBanner(ctx, frame, s.x, s.y, z);
          // the tag, written on the banner's blank plate (rotated upright)
          ctx.save();
          ctx.translate(s.x + 1 * z, s.y - 52 * z);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = "center";
          ctx.font = `700 ${7 * z}px ui-sans-serif`;
          ctx.fillStyle = "#3b1162";
          ctx.fillText(g.tag, 0, 2 * z);
          ctx.restore();
        },
      });
    });
    // pets trail their wanderers
    const petFor = (p: Player, isSelf: boolean) => {
      const key = isSelf ? useGame.getState().cosmetics.pet : p.pet;
      if (!key) return;
      if (Number.isNaN(p.petX)) {
        p.petX = p.px - 0.7;
        p.petY = p.py + 0.35;
      }
      p.petX += (p.px - 0.7 - p.petX) * 0.06;
      p.petY += (p.py + 0.35 - p.petY) * 0.06;
      draws.push({
        depth: p.petX + p.petY,
        fn: () => {
          const s = this.tileScreen(p.petX, p.petY);
          spriteCache.drawPet(
            ctx, key, Math.floor(performance.now() / 350) % 2,
            s.x, s.y, this.camera.zoom,
          );
        },
      });
    };
    petFor(this.player, true);
    for (const r of this.remotes.values()) petFor(r, false);
    const pd = this.player.px + this.player.py;
    draws.push({
      depth: pd + 0.01,
      fn: () => this.drawWandererEntity(ctx, this.player, true),
    });

    draws.sort((a, b) => a.depth - b.depth);
    for (const d of draws) d.fn();

    // THE ARENA VEIL: for a sealed duelist the realm falls away — only the
    // torch-ringed sand remains, floating in the Drift's void. (Floaters,
    // banners and the HUD draw after this, so the fight reads through it.)
    if (this.duelOpp) {
      const c = this.tileScreen(ARENA.x, ARENA.y);
      // the light reaches one tile past the crowd line, so the watchers and
      // any ringside wanderers stand IN the torchlight, not behind it
      const rim = this.tileScreen(ARENA.x + ARENA.r + 2, ARENA.y + ARENA.r + 2);
      const rIn = Math.hypot(rim.x - c.x, rim.y - c.y);
      const g = ctx.createRadialGradient(c.x, c.y, rIn, c.x, c.y, rIn * 2.1);
      g.addColorStop(0, "rgba(10, 8, 16, 0)");
      g.addColorStop(0.45, "rgba(10, 8, 16, 0.88)");
      g.addColorStop(1, "rgba(5, 4, 8, 0.99)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      // a faint violet breath at the void's edge — the Drift watches too
      const pulse = 0.05 + 0.03 * Math.sin(performance.now() / 900);
      const g2 = ctx.createRadialGradient(c.x, c.y, rIn * 1.1, c.x, c.y, rIn * 1.6);
      g2.addColorStop(0, "rgba(168, 85, 247, 0)");
      g2.addColorStop(1, `rgba(168, 85, 247, ${pulse})`);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // the victory plate floats over the sand for a breath after a won duel
    const sinceWin = performance.now() - this.victoryAt;
    if (this.victoryAt > 0 && sinceWin < 2600) {
      const c = this.tileScreen(ARENA.x, ARENA.y);
      const z = this.camera.zoom;
      ctx.save();
      ctx.globalAlpha = sinceWin > 2100 ? 1 - (sinceWin - 2100) / 500 : 1;
      const rise = Math.min(1, sinceWin / 400) * 10 * z;
      spriteCache.drawVictoryPlate(
        ctx, Math.floor(performance.now() / 333) % 2,
        c.x, c.y - 70 * z - rise, z,
      );
      ctx.restore();
    }
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: ResourceNode) {
    const s        = this.tileScreen(node.gx, node.gy);
    const z        = this.camera.zoom;
    const depleted = node.amount <= 0;
    const fishF    = Math.floor(performance.now() / 300) % 4;

    spriteCache.drawNode(ctx, node.kind as 'tree' | 'rock' | 'fish', depleted, s.x, s.y, z, fishF);

    // hover: charge pips so you can size up a node before committing
    // (Driftgin lets you see them everywhere)
    if (
      !depleted &&
      ((this.hover && this.hover.x === node.gx && this.hover.y === node.gy) ||
        useGame.getState().buffs.sight > Date.now())
    ) {
      const top = node.kind === "tree" ? 58 : node.kind === "rock" ? 33 : 16;
      const pw = 5 * z;
      const total = node.maxAmount;
      const x0 = s.x - (total * pw) / 2;
      for (let i = 0; i < total; i++) {
        ctx.fillStyle = i < node.amount ? "#e7c873" : "rgba(216,207,224,0.18)";
        ctx.fillRect(x0 + i * pw, s.y - top * z, pw - 1.5, 3 * z);
      }
    }

    // gather progress arc (offline: local timer; online: server-run timer)
    const gatheringThis =
      this.player.action === "gather" &&
      (this.player.targetNode === node || this.gatherVis?.nodeId === node.id);
    if (gatheringThis && this.player.gatherTotal > 0) {
      const p = this.player.gatherMs / this.player.gatherTotal;
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 4 * z;
      ctx.beginPath();
      ctx.arc(s.x, s.y - 28 * z, 10 * z, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#e7c873";
      ctx.lineWidth = 3 * z;
      ctx.beginPath();
      ctx.arc(s.x, s.y - 28 * z, 10 * z, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawWandererEntity(
    ctx: CanvasRenderingContext2D,
    p: Player,
    isSelf: boolean,
  ) {
    const iso = gridToIso(p.px, p.py);
    const s   = this.camera.worldToScreen(iso.x, iso.y);
    const z   = this.camera.zoom;

    // ellipse shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 10 * z, 5 * z, 0, 0, Math.PI * 2);
    ctx.fill();

    // resolve anim + frame — combat reuses the swing cycle on the attack timer
    const action = p.action;
    const anim   = action === 'gather' || action === 'attack' ? 'swing'
                 : action === 'walk'   ? 'walk'
                 : 'idle';
    let frame: number;
    if (anim === 'walk')  frame = Math.floor((p.bob / (Math.PI * 2)) * 6) & 0xff;
    else if (action === 'attack') frame = Math.floor(performance.now() / 275) % 4;
    else if (anim === 'swing') frame = p.gatherTotal > 0
      ? Math.floor((p.gatherMs / p.gatherTotal) * 4)
      : 0;
    else                  frame = Math.floor(performance.now() / 500) % 2;

    // forged gear renders on your own wanderer (remotes don't sync gear yet);
    // cosmetics render on everyone
    let equip: EquipVisual | undefined;
    let look: LookVisual | undefined;
    let name: string;
    let title: string;
    const state = useGame.getState();
    if (isSelf) {
      const eq = state.equipment;
      if (eq.weapon || eq.tool || eq.ward) {
        equip = {
          weapon: eq.weapon?.tier,
          tool: eq.tool?.tier,
          ward: eq.ward?.tier,
          held: action === 'attack' ? 'weapon' : action === 'gather' ? 'tool' : null,
        };
      }
      look = {
        dye: state.cosmetics.dye, eye: state.cosmetics.eye,
        avatar: state.cosmetics.avatar, avA: state.cosmetics.avA, avB: state.cosmetics.avB,
      };
      // the Dyeworks glass: a try-on overrides your own body only, locally
      if (this.avatarPreview) {
        look.avatar = this.avatarPreview.kind as AvatarKind;
        look.avA = this.avatarPreview.a;
        look.avB = this.avatarPreview.b;
      }
      name = state.cosmetics.name;
      title = currentTitle(state);
      if (state.myGuildTag) name = `[${state.myGuildTag}] ${name}`;
    } else {
      look = {
        dye: p.dye as DyeKey, eye: p.eye as EyeKey,
        avatar: p.avatar as never, avA: p.avA, avB: p.avB,
      };
      name = p.name || "Wanderer";
      title = p.title;
      if (p.guildTag) name = `[${p.guildTag}] ${name}`;
    }

    spriteCache.drawChar(ctx, p.isoFacing, p.isoMirror, anim, frame, s.x, s.y, z, equip, look);

    // aura: prestige keys draw the baked DS sprite; legacy keys orbit motes
    const auraKey = (isSelf ? state.cosmetics.aura : p.aura) as AuraKey | "";
    if (auraKey && PRESTIGE_AURAS[auraKey as PrestigeAuraKey]) {
      const spec = PRESTIGE_AURAS[auraKey as PrestigeAuraKey];
      const frame = Math.floor((performance.now() / 1000) * spec.fps) % spec.frames;
      spriteCache.drawPrestigeAura(ctx, auraKey as PrestigeAuraKey, frame, s.x, s.y, z);
    } else if (auraKey && AURA_CATALOG[auraKey]) {
      const col = AURA_CATALOG[auraKey].color;
      const t = performance.now() / 700;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = col;
      for (let i = 0; i < 3; i++) {
        const a = t + (i * Math.PI * 2) / 3;
        ctx.fillRect(
          s.x + Math.cos(a) * 14 * z,
          s.y - 18 * z + Math.sin(a) * 7 * z,
          2 * z, 2 * z,
        );
      }
      ctx.globalAlpha = 1;
    }

    // name + earned title; your own tag is dimmer. Void shadow keeps both
    // readable on bright ground; the title line clears the name's descenders.
    ctx.textAlign = "center";
    ctx.font = `${8 * z}px ui-sans-serif`;
    ctx.fillStyle = "rgba(10,8,16,0.75)";
    ctx.fillText(name, s.x + 1, s.y - 46 * z + 1);
    ctx.fillStyle = isSelf ? "rgba(216,207,224,0.7)" : "rgba(216,207,224,0.9)";
    ctx.fillText(name, s.x, s.y - 46 * z);
    if (title) {
      ctx.font = `${6.5 * z}px ui-sans-serif`;
      ctx.fillStyle = "rgba(10,8,16,0.75)";
      ctx.fillText(title, s.x + 1, s.y - 37 * z + 1);
      ctx.fillStyle = isSelf ? "rgba(168,85,247,0.75)" : "rgba(216,180,254,0.8)";
      ctx.fillText(title, s.x, s.y - 37 * z);
    }

    // chat / emote bubble
    if (p.bubble && performance.now() - p.bubble.t0 < 4500) {
      const b = p.bubble;
      const lines = wrapText(b.emote ? `~ ${b.text} ~` : b.text, 26);
      const fs = 9 * z;
      ctx.font = `${fs}px ui-sans-serif`;
      const wMax = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const pad = 4 * z;
      const lh = fs + 2 * z;
      const bh = lines.length * lh + pad * 2;
      const bw = wMax + pad * 2;
      const by = s.y - 54 * z - bh;
      ctx.fillStyle = "rgba(23,19,32,0.92)";
      ctx.fillRect(s.x - bw / 2, by, bw, bh);
      ctx.strokeStyle = "rgba(216,207,224,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x - bw / 2, by, bw, bh);
      ctx.fillStyle = b.emote ? "#d8b4fe" : "#d8cfe0";
      lines.forEach((l, i) =>
        ctx.fillText(l, s.x, by + pad + (i + 1) * lh - 3 * z),
      );
    } else if (p.bubble) {
      p.bubble = null;
    }
    ctx.textAlign = "left";
  }

  private drawMob(ctx: CanvasRenderingContext2D, mob: Mob) {
    const iso = gridToIso(mob.px, mob.py);
    const s = this.camera.worldToScreen(iso.x, iso.y);
    const z = this.camera.zoom;
    const now = performance.now();
    const kind: BeastKind = mob.kind;

    // death animation (no shadow/bars — the beast is crumbling into motes)
    if (mob.state === "dead") {
      const n = spriteCache.beastFrames(kind, "death");
      const frame = Math.min(n - 1, Math.floor(mob.deathT / 0.3));
      spriteCache.drawBeast(
        ctx, kind, mob.isoFacing, mob.isoMirror, "death", frame, s.x, s.y, z,
      );
      return;
    }

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 9 * z, 4.5 * z, 0, 0, Math.PI * 2);
    ctx.fill();

    const anim: BeastAnim = this.combat.isEngaged(mob)
      ? "attack"
      : mob.moving
        ? "move"
        : "idle";
    const rate = anim === "attack" ? 220 : anim === "move" ? 160 : 500;
    const frame = Math.floor(now / rate + mob.id); // id offsets desync the pack
    spriteCache.drawBeast(
      ctx, kind, mob.isoFacing, mob.isoMirror, anim, frame, s.x, s.y, z,
      mob.hurtFlash > 0,
    );

    // HP bar + level tag above the cell (sprites keep the top rows clear)
    const top = s.y - (spriteCache.beastHeight(kind) + 1) * z;
    if (mob.hp < mob.maxHp || this.combat.isEngaged(mob)) {
      const w = 24 * z;
      const p = mob.hp / mob.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(s.x - w / 2, top, w, 4 * z);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(s.x - w / 2, top, w * p, 4 * z);
    }
    ctx.fillStyle = "rgba(216,207,224,0.6)";
    ctx.font = `${8 * z}px ui-sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`Lv ${mob.level}`, s.x, top - 2 * z);
    ctx.textAlign = "left";
  }

  private diamond(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    hw: number,
    hh: number,
    fill: string,
  ) {
    this.diamondPath(ctx, cx, cy, hw, hh);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  private diamondPath(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    hw: number,
    hh: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
  }
}

/** greedy word wrap for chat bubbles */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && cur.length + w.length + 1 > maxChars) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? `${cur} ${w}` : w;
    }
    if (lines.length === 3) break; // cap bubble height
  }
  if (cur && lines.length < 3) lines.push(cur);
  return lines;
}

function chebyshev(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
