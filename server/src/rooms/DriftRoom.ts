import { Room, Client } from "colyseus";
import { randomBytes } from "node:crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  loadOrCreatePlayer,
  savePlayer,
  loadClaims,
  insertClaim,
  deleteClaim,
  setClaimIntegrity,
  loadListings,
  insertListing,
  deleteListing,
  addEscrow,
  takeEscrow,
  setBankGold,
  setWalletAddress,
  findPlayerByWallet,
  loadShrinePot,
  setShrinePot,
  loadRealm,
  saveRealm,
  loadProps,
  insertProp,
  deletePropsForClaim,
  setGold as persistGold,
  setInv as persistInv,
  setQuests as persistQuests,
  PlayerRow,
} from "../db";
import {
  getTokenBalance, tokenMint, buildBurnTx, verifyBurn, gateTokens, burnSplit,
  buildExchangeBuyTx, payFromEscrow, buildRelicTx, verifyTxLegs,
  escrowAta, escrowAddress, escrowKeypair, escrowBalance, walletAta,
} from "../solana";
import { verifyGateProof } from "../gate";
import {
  tryInsertBurn, deleteBurn, setFounder, setPrestige, setWheelPity,
  loadGuilds, insertGuild, setGuildRegion, setPlayerGuild, guildMemberCounts,
  loadRelics, insertRelic, deleteRelic,
  exchangeToday, exchangeRecord, GuildRow,
} from "../db";
import { World, buildingAt, townProtected, TOWN_CENTER, WILD_STRUCTURES, TOWN_BUILDINGS } from "@/game/world/tilemap";
import { Drift } from "@/game/world/drift";
import { findPath, adjacentWalkable } from "@/game/world/pathfinding";
import {
  RESOURCE_META, INVENTORY_ORDER, Cell, ResourceNode, walletLinkMessage,
  CLAIM_COST, SPIN_COST, PROP_CATALOG, PropKey, ItemKey, RECIPES,
  ITEM_META, BURN_COSTS as SHARED_BURN_COSTS, holderPerks, REINFORCE_INTEGRITY,
  PRESTIGE_CATALOG, AVATAR_CHANNELS, AvatarKind,
  DRIFT_WHEEL, DRIFT_WHEEL_PITY, WHEEL_TITLE, DriftWheelSeg, GOLD_WHEEL,
  GUILD, EXCHANGE, RELIC_MARKET,
  QUEST_POOL, rollDailyQuestIds, type QuestEvent,
} from "@/game/types";
import { regionAt } from "@/game/world/tilemap";
import {
  DriftRoomState,
  PlayerState,
  NodeState,
  ClaimState,
  ListingState,
  PropState,
  MobState,
  GuildState,
  RelicState,
  tileToCode,
} from "./schema";

// The authoritative world. The server owns the map, the Drift, resource nodes
// and player movement. Clients send intents ("move", "gather"); the server
// pathfinds, walks players at a fixed tick and resolves gather timers. Loot,
// XP and inventory are applied client-side from "loot" events until Phase 4
// brings server persistence.

const TICK_MS = 50; // 20 Hz
const PLAYER_SPEED = 3.2; // tiles/sec — mirrors client Player.speed
// claim/listing caps + vault fee + rich-strike odds live in types.ts now:
// holderPerks(balance) scales them by the linked wallet's DRIFTS (HOLDER_TIERS).
const CLAIM_EROSION = 5; // integrity lost per season
const CLAIM_SIEGE_EROSION = 15; // …when corruption is at the fence
const VALID_ITEMS = new Set<string>(INVENTORY_ORDER);

// Drift-touched (burn-only) keys, DERIVED from the shared catalog so the
// identity-sync whitelist, the Drift Wheel grant pool and the Dyeworks panel
// can never disagree on what exists. In the whitelists for legit owners, but
// the identity sync additionally requires the player to OWN them
// (sim.prestige), so they can't be spoofed for free.
const PRESTIGE_AURA_KEYS = new Set(
  Object.entries(PRESTIGE_CATALOG).filter(([, e]) => e.kind === "aura").map(([k]) => k));
const PRESTIGE_DYE_KEYS = new Set(
  Object.entries(PRESTIGE_CATALOG).filter(([, e]) => e.kind === "dye").map(([k]) => k));
// mirror of the client's cosmetic catalogs (whitelists)
const DYE_KEYS = ["stone", "ember", "moss", "blood", "gold", "bone", "water", "void",
  ...PRESTIGE_DYE_KEYS];
const EYE_KEYS = ["drift", "ember", "blood", "gold", "water"];
const AURA_KEYS = ["", "driftmote", "emberwake", "goldhalo", ...PRESTIGE_AURA_KEYS];
const PET_KEYS = ["", "wisp", "crow", "emberling"];
const PROP_KEYS = ["campfire", "banner", "driftlamp", "statue"];

// the Pit's arena ring: duels are sealed inside it (move clamp + client veil)
const PIT = (() => {
  const b = TOWN_BUILDINGS.find((s) => s.key === "pit")!;
  return { x: b.x, y: b.y, r: b.r };
})();

// ---- Phase 6: the Founder window -----------------------------------------------
// Any verified burn while now < FOUNDER_UNTIL stamps the one-time Founder mark
// (title + Ashen Crown, granted client-side off the profile/founder messages).
// Unset = feature off, so dev and the verify suites run unchanged.
const FOUNDER_UNTIL = Date.parse(process.env.FOUNDER_UNTIL ?? "") || 0;

// ---- Phase 7: the Exchange sell side opens LATE --------------------------------
// At launch the escrow pool is empty (no buyers yet), so SELLING gold for DRIFTS
// stays closed until `EXCHANGE_SELL_FROM` (set it to ~launch + a few days). The
// BUY side is always open from launch and fills the pool. Unset/0 = no gate, so
// dev and the verify suite (which set ESCROW_KEYPAIR) keep both sides open.
const EXCHANGE_SELL_FROM = Date.parse(process.env.EXCHANGE_SELL_FROM ?? "") || 0;
const sellSideOpen = () => Date.now() >= EXCHANGE_SELL_FROM;

// ---- Caravans: a wagon runs the Waystation → map-edge gate gauntlet ----------
// Env overrides exist so the verify script can compress the timeline.
const CARAVAN_FIRST_S  = Number(process.env.CARAVAN_FIRST_S ?? 90);   // boot → first run
const CARAVAN_PERIOD_S = Number(process.env.CARAVAN_PERIOD_S ?? 360); // between runs
const CARAVAN_SPEED    = Number(process.env.CARAVAN_SPEED ?? 1.1);    // tiles/sec
const CARAVAN_HP       = 100;
const CARAVAN_GNAW_DPS = Number(process.env.CARAVAN_GNAW ?? 3); // hp/s while swarmed
const CARAVAN_BASE_POOL = 120; // gold pool at 0% corruption; +3g per corruption point
const CARAVAN_MIN_ROUTE = 18;  // tiles; gates closer than this don't count

// ---- Phase 5: token burn costs -------------------------------------------------
// Holders can pay these rites with on-chain burns instead of gold. The table
// lives in types.ts (shared) so the HUD/codex display the same numbers we burn.
const BURN_COSTS: Record<string, number> = SHARED_BURN_COSTS;
const CLEANSE_BURN_POT = 150; // gold-equivalent added to the pot per cleanse burn

// ---- THE LONG NIGHT: terminal-corruption endgame ------------------------------
// At LONG_NIGHT_PCT the realm makes its stand at the Waystation: a kill quota
// shared across everyone online, on a timer. Hold it → dawn burns corruption
// back to DAWN_TARGET_PCT + rewards. Fail (or hit the failsafe) → realm reset.
// Env overrides exist so the verify script can compress the timeline.
const SEASON_MS            = Number(process.env.SEASON_MS ?? 45_000);
const LONG_NIGHT_PCT       = Number(process.env.LONG_NIGHT_PCT ?? 90);
const LONG_NIGHT_MS        = Number(process.env.LONG_NIGHT_MS ?? 180_000);
const LONG_NIGHT_BASE_KILLS = Number(process.env.LONG_NIGHT_KILLS ?? 15);
const LONG_NIGHT_REWARD    = 250;  // gold per surviving defender
const DAWN_TARGET_PCT      = 35;   // corruption left after a survived night
const RESET_FAILSAFE_PCT   = 97;   // theoretical max is ~92 (town/claims/water immune)

// ---- Phase 6: the gold ledger ------------------------------------------------
// The server holds the authoritative pocket balance. Client-trusted income
// (mobs/veins/chests are still per-client sims) arrives as "goldDelta" intents
// and is clamped per reason: a cap per event plus a rolling per-minute budget.
// Real validation of these events lands with server-side mobs.
// ("mob" gold left this table: every overworld mob pays its loot on the server
// ledger now. "sell" left too: vendor sales are a validated `sell` intent.)
const GOLD_DELTA_CAPS: Record<string, { event: number; perMin: number }> = {
  vein:     { event: 25,  perMin: 350 },   // strike = 3 + lvl/2 + rand(3); 14-strike burst
  chest:    { event: 110, perMin: 120 },   // den war-chest 60-100, 15min reseed
  losttomb: { event: 90,  perMin: 100 },   // lost tombstones 30-80, one per 6-10min
  quest:    { event: 70,  perMin: 250 },   // daily rewards top out at 60
};

// Items ride the same rail (the inventory ledger). Positive client-trusted
// reasons are capped; negatives floor at zero. Cooking/crafting/market moves
// and gather loot are validated or granted server-side instead.
// ("mob" items left this table: shared-mob loot is server-granted.)
const ITEM_DELTA_CAPS: Record<string, { event: number; perMin: number; items: string[] }> = {
  chest: { event: 2, perMin: 6, items: ["driftshard"] }, // den chest, 15min reseed
};
// (rich-strike odds: holderPerks(balance).richStrikeP — the house still rolls)

// ---- Phase 6: shared ambient mobs ---------------------------------------------
// Ambient Drift Beasts (husk/stalker) + the Husk Den elite pack live on the
// server: same wander-and-retaliate behavior the client sim used, but hp,
// deaths and loot are authoritative. Raiders/colossus stay per-client for now.
const MOB_AMBIENT_COUNT = Number(process.env.MOB_COUNT ?? 8);
const DEN_RESEED_MS = Number(process.env.DEN_RESEED_S ?? 900) * 1000;
const DEN_PACK_SIZE = 5;
const DEN_PACK_LEVEL = 5;
const MOB_ATTACK_MS = 1500;       // retaliation cadence (mirrors the old client sim)
const ATTACK_RATE_MS = 900;       // server-side swing cap (client swings at 1100ms)
const ATTACK_MAX_DMG = 50;        // generous clamp; real rolls come with server gear
const ENGAGE_TIMEOUT_MS = 6000;   // no swings for this long → the beast loses interest
/** corruption thresholds that wake a Colossus (env override for tests) */
const BOSS_PCTS = (process.env.BOSS_PCTS ?? "10,25,40,60,80")
  .split(",").map(Number).filter((n) => Number.isFinite(n));

type MobKind = "husk" | "stalker" | "raider" | "colossus";

/** a server-side Drift Beast: wanders its territory, retaliates when struck */
class ServerMob {
  id: number;
  kind: MobKind;
  level: number;
  px: number;
  py: number;
  spawnX: number;
  spawnY: number;
  hp: number;
  maxHp: number;
  damage: number;
  state: "wander" | "engaged" | "dead" = "wander";
  /** true while actually stepping toward a wander target (drives the client
   *  walk anim; synced — guessing it from lerp residue made puppets flicker) */
  moving = false;
  /** den elites stay dead until the den re-seeds */
  persistDeath = false;
  /** which event owns this mob (its deaths feed that event's quota) */
  eventTag: "ambush" | "night" | null = null;
  /** dead raiders/colossi leave the schema once their death anim has played */
  pruneAt = 0;
  /** combat XP the kill pays (client applies it from mobKill) */
  xp: number;
  /** sessionId of the wanderer this beast is trading blows with */
  engagedBy: string | null = null;
  lastEngagedAt = 0;
  retaliateIn = MOB_ATTACK_MS;
  respawnIn = 0;
  speed = 1.4;
  private tx: number;
  private ty: number;
  private idle = 0;
  private wanderRadius = 4;

  constructor(id: number, gx: number, gy: number, level: number, kind?: MobKind) {
    this.id = id;
    this.px = this.tx = this.spawnX = gx;
    this.py = this.ty = this.spawnY = gy;
    this.level = level;
    this.kind = kind ?? (level >= 3 ? "stalker" : "husk");
    this.maxHp = this.hp = 14 + level * 4;
    this.damage = 2 + level;
    this.xp = 14 + level * 6;
  }

  get cell(): Cell {
    return { x: Math.round(this.px), y: Math.round(this.py) };
  }

  die() {
    this.state = "dead";
    this.engagedBy = null;
    if (this.kind === "raider" || this.kind === "colossus") {
      // event mobs stay slain; the corpse leaves once the death anim plays out
      this.respawnIn = Number.POSITIVE_INFINITY;
      this.pruneAt = Date.now() + 2500;
    } else {
      this.respawnIn = this.persistDeath
        ? Number.POSITIVE_INFINITY
        : 6000 + Math.random() * 4000;
    }
  }

  update(dt: number, world: World) {
    if (this.state === "dead") {
      this.moving = false;
      this.respawnIn -= dt * 1000;
      if (this.respawnIn <= 0) {
        this.px = this.tx = this.spawnX;
        this.py = this.ty = this.spawnY;
        this.hp = this.maxHp;
        this.state = "wander";
        this.idle = 0;
      }
      return;
    }
    if (this.state === "engaged") { this.moving = false; return; } // hold ground while trading blows

    const dx = this.tx - this.px;
    const dy = this.ty - this.py;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.1) {
      this.moving = false;
      this.idle -= dt;
      if (this.idle <= 0) this.pickTarget(world);
    } else {
      const step = this.speed * dt;
      this.moving = true;
      this.px += (dx / dist) * Math.min(step, dist);
      this.py += (dy / dist) * Math.min(step, dist);
    }
  }

  private pickTarget(world: World) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * this.wanderRadius;
      const x = Math.round(this.spawnX + Math.cos(a) * r);
      const y = Math.round(this.spawnY + Math.sin(a) * r);
      if (world.isWalkable(x, y)) {
        this.tx = x;
        this.ty = y;
        this.idle = 1 + Math.random() * 2;
        return;
      }
    }
    this.idle = 1;
  }
}

// the Wheel (server-rolled; the spin price is debited from the ledger).
// The table lives in types.ts now — the HUD's spin animation and the docs
// render the same segments the house actually rolls.
const WHEEL = GOLD_WHEEL;

interface Duel {
  a: string; // sessionIds
  b: string;
  wager: number;
  hpA: number;
  hpB: number;
  until: number;
  lastHitA: number;
  lastHitB: number;
}

interface PlayerSim {
  client: Client;
  px: number;
  py: number;
  path: Cell[];
  action: "idle" | "walk" | "gather";
  // gather state
  gatherNode: ResourceNode | null;
  gatherMs: number;
  gatherTotal: number;
  speedMult: number;
  /** node we're walking toward before gathering */
  pendingNode: ResourceNode | null;
  /** guest identity (db row key) */
  token: string;
  lastSaveAt: number;
  /** server-side swing cap for shared-mob attacks */
  lastMobAttackAt?: number;
  /** stored progress, served on request (client asks once handlers are wired) */
  profileSnapshot: unknown;
  /** Phase 6: authoritative pocket gold (write-through to the players row) */
  gold: number;
  /**
   * false until the ledger has a real value: a brand-new row waits for the
   * client's first snapshot push (offline progress seeds the ledger once,
   * same trust model as the snapshot itself). Any ledger mutation pins it.
   */
  goldSeeded: boolean;
  /** Phase 6: authoritative item counts (write-through to players.inv) */
  inv: Record<ItemKey, number>;
  /** same seed-once rule as goldSeeded, for the inventory ledger */
  invSeeded: boolean;
  /** rolling per-minute budgets for client-trusted gold/item delta reasons */
  deltaWindow: Map<string, { start: number; sum: number }>;
  /** Phase 6 hardening: per-message-type rate windows (see allow()) */
  rates: Map<string, { n: number; resetAt: number }>;
  /**
   * combat level from the last snapshot — bounds the per-swing damage the
   * client may report against mobs (cross-checked trust, not proof; real
   * rolls come with server XP)
   */
  combatLevel: number;
  /** last known DRIFTS balance of the linked wallet (drives holder-tier perks;
   *  refreshed on link and on every profile fetch, 0 for guests/unlinked) */
  tokenBalance: number;
  /** Drift-touched cosmetics this player has BURNED for (server-authoritative;
   *  the identity sync only accepts prestige keys present here) */
  prestige: Set<string>;
  /** Drift Wheel spins since the last rare (pity forces one at the cap) */
  wheelPity: number;
  /** guild membership (null = guildless) */
  guildId: number | null;
  /** Phase 6: authoritative daily quest board (write-through to players.quests) */
  quests: { day: number; list: { id: string; progress: number; claimed: boolean }[] };
  lastSpinAt?: number;
  /** one-shot challenge for the wallet-link signature (Phase 5) */
  walletNonce?: string;
  walletNonceAt?: number;
}

export class DriftRoom extends Room<DriftRoomState> {
  maxClients = 32;
  // the realm is a persistent living world: it must NOT dispose when the last
  // wanderer leaves, or the Drift's accumulated corruption resets on the next
  // join. The corruption + season also persist to the DB (restored in onCreate)
  // so a server restart doesn't wipe it either.
  autoDispose = false;

  private world!: World;
  private drift!: Drift;
  private sims = new Map<string, PlayerSim>();
  /** claim id → owner token (ownership lives server-side only) */
  private claimOwner = new Map<number, string>();
  /** listing id → seller token */
  private listingOwner = new Map<number, string>();
  /** prop id → owner token */
  private propOwner = new Map<number, string>();
  private duels: Duel[] = [];
  /** one open arena challenge: the wanderer waiting in the ring + their stake */
  private pitQueue: { sessionId: string; wager: number; name: string } | null = null;
  /** guild id → row mirror (region/until/founder live server-side only) */
  private guildRows = new Map<number, GuildRow>();
  /** guild id → member headcount */
  private guildCounts = new Map<number, number>();
  /** relic id → seller token + wallet (settlement targets) */
  private relicOwner = new Map<number, { token: string; wallet: string; key: string; price: number }>();
  /** relic ids mid-settlement — claimed synchronously before the verify await
   *  so two concurrent buyers (distinct sigs) cannot settle the same relic */
  private relicSettling = new Set<number>();
  /** tokens with an Exchange trade in flight — a per-TOKEN single-flight (NOT
   *  per-session: two tabs of one wallet must not split the daily cap/escrow) */
  private exTrading = new Set<string>();
  // caravan run state (route + contributions live server-side only)
  private caravanPath: Cell[] = [];
  private caravanTotal = 0;
  private caravanThresholds: number[] = [];
  private caravanContrib = new Map<string, { name: string; kills: number; weight: number }>();

  /** Long Night bookkeeping (server-side only) */
  private nightUntil = 0;
  private nightDone = false;

  /** gold recorded into a tombstone at death, reclaimable once (token → g) */
  private tombGold = new Map<string, number>();

  /** shared ambient beasts + the den pack (server-side sim) */
  private mobSims: ServerMob[] = [];
  private nextMobId = 1;
  private denIds: number[] = [];
  /** when the last den elite fell (0 = pack alive); reseeds after DEN_RESEED_MS */
  private denClearedAt = 0;
  /** corruption marks that still owe the realm a Colossus */
  private bossThresholds = [...BOSS_PCTS];

  async onCreate() {
    this.setState(new DriftRoomState());
    this.world = new World(40, 40);
    this.drift = new Drift(SEASON_MS);

    // persisted land claims
    for (const row of await loadClaims()) {
      const owner = await loadOrCreatePlayer(row.token);
      this.addClaim(row.id, row.token, row.x, row.y, row.integrity, owner.name);
    }
    this.wireDrift();

    // restore the living world: re-apply the Drift's accumulated corruption +
    // season. Fully defensive — any failure falls back to a fresh realm rather
    // than blocking boot. Terrain is deterministic (fixed seed), so a saved
    // corrupt index maps to the same land tile.
    try {
      const saved = await loadRealm();
      if (saved && saved.corrupt.length > 0) {
        for (const i of saved.corrupt) {
          if (i >= 0 && i < this.world.tiles.length && this.world.tiles[i] !== "water") {
            this.world.tiles[i] = "corrupt";
          }
        }
        this.state.season = Math.max(1, Math.round(saved.season));
        this.state.driftPct = this.corruptionPct();
      }
    } catch (e) {
      console.error("realm restore failed, starting fresh:", (e as Error).message);
    }

    // persisted marketplace listings
    for (const row of await loadListings()) {
      this.addListing(row.id, row.token, row.sellerName, row.item, row.qty, row.price);
    }

    // persisted claim props
    for (const row of await loadProps()) {
      const ps = new PropState();
      ps.id = row.id;
      ps.x = row.x;
      ps.y = row.y;
      ps.kind = row.kind;
      this.state.props.set(String(row.id), ps);
      this.propOwner.set(row.id, row.token);
    }

    // persisted guilds + their territory banners
    this.guildCounts = await guildMemberCounts();
    for (const row of await loadGuilds()) {
      this.guildRows.set(row.id, row);
      this.syncGuildState(row.id);
    }
    // banner clock: count down held regions; a lapsed banner falls
    this.clock.setInterval(() => {
      const now = Date.now();
      for (const row of this.guildRows.values()) {
        if (!row.region) continue;
        if (row.regionUntil <= now) {
          const fallen = row.region;
          row.region = "";
          row.regionUntil = 0;
          void setGuildRegion(row.id, "", 0).catch(() => {});
          this.broadcast("guildBanner", { tag: row.tag, region: fallen, fallen: true });
        }
        this.syncGuildState(row.id);
      }
    }, 1000);

    // persisted relic listings (P2P Drift-touched market)
    for (const row of await loadRelics()) {
      this.addRelic(row.id, row.sellerToken, row.sellerWallet, row.sellerName, row.key, row.price);
    }

    // first caravan rolls a little after boot
    this.state.caravan.departIn = CARAVAN_FIRST_S;

    // the shared beasts wake with the realm
    this.spawnAmbientMobs();
    this.spawnDenPack();

    // the Shrine's communal pot
    this.state.shrinePot = await loadShrinePot();
    this.state.shrineGoal = this.shrineGoal();

    // mirror static world into schema
    this.state.w = this.world.w;
    this.state.h = this.world.h;
    for (const t of this.world.tiles) this.state.tiles.push(tileToCode(t));
    for (const node of this.world.nodes) {
      const ns = new NodeState();
      ns.id = node.id;
      ns.kind = node.kind;
      ns.gx = node.gx;
      ns.gy = node.gy;
      ns.amount = node.amount;
      ns.alive = true;
      this.state.nodes.set(String(node.id), ns);
    }

    this.onMessage("move", (client, msg: { x: number; y: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim || typeof msg?.x !== "number" || typeof msg?.y !== "number") return;
      if (!this.allow(sim, "move", 12, 1000)) return;
      const goal = { x: Math.round(msg.x), y: Math.round(msg.y) };
      if (!this.world.inBounds(goal.x, goal.y)) return;
      // a duelist is SEALED in the arena: the realm beyond the ring is gone
      // until one of them falls (the client renders the void to match)
      if (this.inDuel(client.sessionId)) {
        goal.x = Math.max(PIT.x - PIT.r, Math.min(PIT.x + PIT.r, goal.x));
        goal.y = Math.max(PIT.y - PIT.r, Math.min(PIT.y + PIT.r, goal.y));
      }
      const path = findPath(this.world, this.cellOf(sim), goal);
      if (path) {
        this.cancelGather(sim);
        sim.pendingNode = null;
        sim.path = path;
        sim.action = path.length ? "walk" : "idle";
      }
    });

    this.onMessage(
      "gather",
      (client, msg: { nodeId: number; speedMult?: number }) => {
        const sim = this.sims.get(client.sessionId);
        const node = this.world.nodes.find((n) => n.id === msg?.nodeId);
        if (!sim || !node || node.regrowIn > 0 || node.amount <= 0) return;
        if (!this.allow(sim, "gather", 6, 1000)) return;
        sim.speedMult = clamp(msg.speedMult ?? 1, 0.4, 1.5);
        const from = this.cellOf(sim);
        if (chebyshev(from, { x: node.gx, y: node.gy }) === 1) {
          this.startGather(sim, node);
          return;
        }
        const adj = adjacentWalkable(this.world, from, { x: node.gx, y: node.gy });
        if (!adj) return;
        const path = findPath(this.world, from, adj);
        if (path) {
          this.cancelGather(sim);
          sim.path = path;
          sim.action = path.length ? "walk" : "idle";
          sim.pendingNode = node;
        }
      },
    );

    // chat + emotes: relay with the sender's display name attached
    this.onMessage("chat", (client, msg: { text?: string; kind?: string }) => {
      const ps = this.state.players.get(client.sessionId);
      if (!ps || typeof msg?.text !== "string") return;
      const simC = this.sims.get(client.sessionId);
      if (!simC || !this.allow(simC, "chat", 4, 3000)) return;
      const text = msg.text.trim().slice(0, 120);
      if (!text) return;
      const kind = msg.kind === "emote" ? "emote" : "say";
      this.broadcast("chat", { id: client.sessionId, name: ps.name, text, kind });
    });

    // cosmetic identity: trusted but sanitized (length caps + key whitelists)
    this.onMessage(
      "identity",
      (client, msg: {
        name?: string; dye?: string; eye?: string; title?: string;
        aura?: string; pet?: string; avatar?: string; avA?: string; avB?: string;
      }) => {
        const ps = this.state.players.get(client.sessionId);
        if (!ps || !msg) return;
        const simI = this.sims.get(client.sessionId);
        if (!simI || !this.allow(simI, "identity", 6, 5000)) return;
        if (typeof msg.name === "string") {
          const clean = msg.name.trim().slice(0, 16);
          if (clean) ps.name = clean;
        }
        // Drift-touched keys are accepted only if the player owns them (burned
        // for them); otherwise the prestige cosmetic would be free to fake.
        if (typeof msg.dye === "string" && DYE_KEYS.includes(msg.dye) &&
            (!PRESTIGE_DYE_KEYS.has(msg.dye) || simI.prestige.has(msg.dye))) ps.dye = msg.dye;
        if (typeof msg.eye === "string" && EYE_KEYS.includes(msg.eye)) ps.eye = msg.eye;
        if (typeof msg.title === "string") ps.title = msg.title.trim().slice(0, 24);
        if (typeof msg.aura === "string" && AURA_KEYS.includes(msg.aura) &&
            (!PRESTIGE_AURA_KEYS.has(msg.aura) || simI.prestige.has(msg.aura))) ps.aura = msg.aura;
        if (typeof msg.pet === "string" && PET_KEYS.includes(msg.pet)) ps.pet = msg.pet;
        // premium avatars: "" reverts to the wanderer; a kind is accepted only
        // from its owner (burned for it). Channel options must name a real
        // ramp choice for that kind ("" = the default).
        if (typeof msg.avatar === "string") {
          if (msg.avatar === "") { ps.avatar = ""; ps.avA = ""; ps.avB = ""; }
          else if (AVATAR_CHANNELS[msg.avatar as AvatarKind] && simI.prestige.has(msg.avatar)) {
            ps.avatar = msg.avatar;
          }
        }
        if (ps.avatar) {
          const [aOpts, bOpts] = Object.values(AVATAR_CHANNELS[ps.avatar as AvatarKind]);
          if (typeof msg.avA === "string" && (msg.avA === "" || aOpts.includes(msg.avA))) ps.avA = msg.avA;
          if (typeof msg.avB === "string" && (msg.avB === "" || bOpts.includes(msg.avB))) ps.avB = msg.avB;
        }
      },
    );

    // ---- the Vault: pocket ↔ bank moves, both sides on the server ledger -------
    this.onMessage("bank", async (client, msg: { delta?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "bank", 5, 2000)) return;
      const delta = Math.floor(Number(msg?.delta ?? 0));
      if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 1_000_000) return;
      const row = await loadOrCreatePlayer(sim.token);
      if (delta > 0) {
        // deposit: pocket → box
        if (!this.debit(sim, delta)) {
          return client.send("bankResult", {
            ok: false, banked: row.bankGold, reason: "Your purse is lighter than that",
          });
        }
        const next = row.bankGold + delta;
        await setBankGold(sim.token, next).catch(() => {});
        client.send("bankResult", { ok: true, banked: next, delta });
      } else {
        // withdraw: box → pocket, less the handling fee
        const gross = -delta;
        if (row.bankGold < gross) {
          return client.send("bankResult", {
            ok: false, banked: row.bankGold, reason: "Not that much in your box",
          });
        }
        const fee = Math.ceil(gross * holderPerks(sim.tokenBalance).vaultFee);
        const next = row.bankGold - gross;
        await setBankGold(sim.token, next).catch(() => {});
        this.credit(sim, gross - fee);
        client.send("bankResult", { ok: true, banked: next, delta, fee });
      }
    });

    // ---- the Wheel: server-rolled spin (ledger pays 50g, OR a token burn) -------
    this.onMessage("spin", async (client, msg: { burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      const now = Date.now();
      if (now - (sim.lastSpinAt ?? 0) < 2500) return;
      sim.lastSpinAt = now;
      if (msg?.burnSig) {
        const err = await this.consumeBurn(sim, String(msg.burnSig), "spin");
        if (err) return client.send("burnResult", { ok: false, action: "spin", reason: err });
      } else if (!this.debit(sim, SPIN_COST)) {
        return client.send("spinResult", { ok: false, reason: `A spin costs ${SPIN_COST}g.` });
      }
      let roll = Math.random();
      let prize = WHEEL[0];
      let segIndex = 0;
      for (let i = 0; i < WHEEL.length; i++) {
        if (roll < WHEEL[i].p) { prize = WHEEL[i]; segIndex = i; break; }
        roll -= WHEEL[i].p;
      }
      if (prize.gold > 0) this.credit(sim, prize.gold);
      if (prize.shards > 0) this.creditItem(sim, "driftshard", prize.shards);
      client.send("spinResult", {
        ok: true, gold: prize.gold, shards: prize.shards, label: prize.label,
        seg: segIndex, // which segment the HUD's wheel animation lands on
      });
    });

    // ---- the Shrine: communal donations toward a cleansing (ledger or burn) -----
    this.onMessage("donate", async (client, msg: { amount?: number; burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "donate", 4, 2000)) return;
      let amount = Math.floor(Number(msg?.amount ?? 0));
      if (msg?.burnSig) {
        const err = await this.consumeBurn(sim, String(msg.burnSig), "cleanse");
        if (err) return client.send("burnResult", { ok: false, action: "cleanse", reason: err });
        amount = CLEANSE_BURN_POT;
        client.send("burnResult", { ok: true, action: "cleanse", pot: amount });
      } else {
        if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) return;
        amount = Math.min(amount, Math.floor(sim.gold));
        if (amount <= 0) {
          return client.send("donateResult", { ok: false, reason: "Your purse is empty." });
        }
        this.debit(sim, amount);
        client.send("donateResult", { ok: true, amount });
      }
      this.state.shrinePot += amount;
      if (this.state.shrinePot >= this.state.shrineGoal) {
        this.cleanse();
      }
      await setShrinePot(this.state.shrinePot).catch(() => {});
    });

    // ---- the Furnisher: place a prop on your own claim --------------------------
    this.onMessage(
      "placeProp",
      async (client, msg: { kind?: string; x?: number; y?: number }) => {
        const sim = this.sims.get(client.sessionId);
        const fail = (reason: string) =>
          client.send("propResult", { ok: false, reason, kind: msg?.kind });
        if (!sim) return;
        if (!this.allow(sim, "placeProp", 4, 2000)) return;
        const kind = String(msg?.kind ?? "");
        const x = Math.round(Number(msg?.x));
        const y = Math.round(Number(msg?.y));
        if (!PROP_KEYS.includes(kind)) return fail("Unknown furnishing");
        if (!this.world.inBounds(x, y)) return fail("Out of bounds");
        const claim = this.claimAt(x, y);
        if (!claim || this.claimOwner.get(claim.id) !== sim.token) {
          return fail("Furnishings only stand on your own claim");
        }
        if (this.world.getNode(x, y)) return fail("A node grows there");
        for (const p of this.state.props.values()) {
          if (p.x === x && p.y === y) return fail("Something already stands there");
        }
        const price = PROP_CATALOG[kind as PropKey]?.price ?? 0;
        if (!this.debit(sim, price)) return fail(`That costs ${price}g`);
        const row = await insertProp(claim.id, sim.token, x, y, kind);
        const ps2 = new PropState();
        ps2.id = row.id;
        ps2.x = x;
        ps2.y = y;
        ps2.kind = kind;
        this.state.props.set(String(row.id), ps2);
        this.propOwner.set(row.id, sim.token);
        client.send("propResult", { ok: true, kind });
      },
    );

    // ---- the Pit: wagered duels ---------------------------------------------------
    this.onMessage("challenge", (client, msg: { target?: string; wager?: number }) => {
      const sim = this.sims.get(client.sessionId);
      const me = this.state.players.get(client.sessionId);
      const target = this.sims.get(String(msg?.target ?? ""));
      const wager = Math.max(0, Math.min(5000, Math.floor(Number(msg?.wager ?? 0))));
      if (!sim || !me || !target || target === sim) return;
      if (!this.allow(sim, "challenge", 3, 5000)) return;
      if (this.inDuel(client.sessionId) || this.inDuel(target.client.sessionId)) return;
      target.client.send("challenged", {
        from: client.sessionId,
        name: me.name,
        wager,
      });
    });

    this.onMessage("acceptDuel", (client, msg: { from?: string; wager?: number }) => {
      const a = this.sims.get(String(msg?.from ?? "")); // challenger
      const b = this.sims.get(client.sessionId);        // acceptor
      const wager = Math.max(0, Math.min(5000, Math.floor(Number(msg?.wager ?? 0))));
      if (!a || !b || this.inDuel(a.client.sessionId) || this.inDuel(b.client.sessionId)) return;
      if (!this.allow(b, "acceptDuel", 3, 5000)) return;
      this.startDuel(a, b, wager);
    });

    // ---- the arena queue: click the Pit, post a stake, the next wanderer who
    //      steps up meets you in the ring ----------------------------------------
    this.onMessage("pitJoin", (client, msg: { wager?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "pitJoin", 4, 10_000)) return;
      if (this.inDuel(client.sessionId)) return;
      const wager = Math.max(0, Math.min(5000, Math.floor(Number(msg?.wager ?? 0))));
      const q = this.pitQueue;
      if (!q || q.sessionId === client.sessionId || !this.sims.get(q.sessionId)) {
        // post (or repost) the open challenge at this stake
        if (sim.gold < wager) {
          client.send("duelRefused", { reason: "Your purse can't cover the wager" });
          return;
        }
        const name = this.state.players.get(client.sessionId)?.name ?? "Wanderer";
        this.pitQueue = { sessionId: client.sessionId, wager, name };
        this.broadcast("pitQueue", { name, wager, sessionId: client.sessionId });
        return;
      }
      // someone already waits: meet them at THEIR stake
      const a = this.sims.get(q.sessionId)!;
      this.pitQueue = null;
      this.broadcast("pitQueue", null);
      this.startDuel(a, sim, q.wager);
    });

    this.onMessage("pitLeave", (client) => {
      if (this.pitQueue?.sessionId !== client.sessionId) return;
      this.pitQueue = null;
      this.broadcast("pitQueue", null);
    });

    this.onMessage("duelHit", (client) => {
      const duel = this.duels.find(
        (d) => d.a === client.sessionId || d.b === client.sessionId,
      );
      if (!duel) return;
      const now = Date.now();
      const isA = duel.a === client.sessionId;
      const last = isA ? duel.lastHitA : duel.lastHitB;
      if (now - last < 900) return; // server-side swing speed cap
      // the house rolls Pit damage now: 6-12, 12% crit doubles (max 24).
      // wagered gold can't ride on a client-reported number.
      const crit = Math.random() < 0.12;
      const dmg = Math.floor((6 + Math.random() * 7) * (crit ? 2 : 1));
      if (isA) {
        duel.lastHitA = now;
        duel.hpB -= dmg;
      } else {
        duel.lastHitB = now;
        duel.hpA -= dmg;
      }
      this.broadcast("duelHp", { a: duel.a, b: duel.b, hpA: duel.hpA, hpB: duel.hpB });
      if (duel.hpA <= 0 || duel.hpB <= 0) {
        this.endDuel(duel, duel.hpA <= 0 ? duel.b : duel.a);
      }
    });

    // ---- Phase 5: wallet linking (devnet) -----------------------------------------
    // Two-step: client asks for a nonce, wallet signs the canonical message,
    // server verifies the ed25519 signature and binds wallet ↔ guest token.
    this.onMessage("walletNonce", (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "walletNonce", 6, 10_000)) return;
      sim.walletNonce = randomBytes(16).toString("hex");
      sim.walletNonceAt = Date.now();
      client.send("walletNonce", { nonce: sim.walletNonce });
    });

    this.onMessage(
      "linkWallet",
      async (client, msg: { address?: string; signature?: string }) => {
        const sim = this.sims.get(client.sessionId);
        const fail = (reason: string) =>
          client.send("walletResult", { ok: false, reason });
        if (!sim) return;
        if (!this.allow(sim, "linkWallet", 5, 10_000)) return;
        const nonce = sim.walletNonce;
        sim.walletNonce = undefined; // one-shot
        if (!nonce || Date.now() - (sim.walletNonceAt ?? 0) > 5 * 60_000) {
          return fail("The link offer expired. Try again.");
        }
        const address = String(msg?.address ?? "");
        const sigHex = String(msg?.signature ?? "");
        let pubkey: Uint8Array;
        try {
          pubkey = bs58.decode(address);
        } catch {
          return fail("That is not a Solana address.");
        }
        if (pubkey.length !== 32 || !/^[0-9a-f]{128}$/i.test(sigHex)) {
          return fail("Malformed signature.");
        }
        const message = new TextEncoder().encode(walletLinkMessage(address, nonce));
        const signature = Uint8Array.from(Buffer.from(sigHex, "hex"));
        if (!nacl.sign.detached.verify(message, signature, pubkey)) {
          return fail("Signature does not match the wallet.");
        }
        const existing = await findPlayerByWallet(address).catch(() => null);
        if (existing && existing.token !== sim.token) {
          return fail("That wallet already belongs to another wanderer.");
        }
        await setWalletAddress(sim.token, address).catch(() => {});
        const tokenBalance = await getTokenBalance(address);
        sim.tokenBalance = tokenBalance; // holder-tier perks follow the link
        client.send("walletResult", {
          ok: true,
          address,
          tokenBalance,
          holder: tokenBalance >= 1,
          mint: tokenMint() || null,
        });
      },
    );

    // ---- Phase 5: token burns ---------------------------------------------------
    // Quote: server builds + fee-pays a partial-signed burn tx for the wallet
    // to countersign. The follow-up action message carries the tx signature.
    this.onMessage("burnQuote", async (client, msg: { action?: string }) => {
      const sim = this.sims.get(client.sessionId);
      const action = String(msg?.action ?? "");
      const fail = (reason: string) =>
        client.send("burnQuote", { ok: false, action, reason });
      if (!sim) return;
      if (!this.allow(sim, "burnQuote", 4, 10_000)) return;
      const cost = BURN_COSTS[action];
      if (!cost) return fail("Unknown rite");
      const row = await loadOrCreatePlayer(sim.token);
      if (!row.walletAddress) return fail("Link a wallet first");
      const built = await buildBurnTx(row.walletAddress, cost);
      if (!built.ok) return fail(built.reason);
      client.send("burnQuote", { ok: true, action, amount: cost, tx: built.tx });
    });

    // a Dyeworks aura bought with a burn (gold purchases stay client-side)
    this.onMessage(
      "buyAura",
      async (client, msg: { key?: string; burnSig?: string }) => {
        const sim = this.sims.get(client.sessionId);
        if (!sim) return;
        if (!this.allow(sim, "buyAura", 4, 10_000)) return;
        const key = String(msg?.key ?? "");
        if (!AURA_KEYS.includes(key) || key === "") {
          return client.send("auraResult", { ok: false, reason: "Unknown aura" });
        }
        const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "aura");
        if (err) return client.send("auraResult", { ok: false, reason: err });
        client.send("auraResult", { ok: true, key });
      },
    );

    // the Ash Obelisk: a verified burn rewrites the day's quests (client state)
    this.onMessage("obeliskBurn", async (client, msg: { burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "obeliskBurn", 4, 10_000)) return;
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "obelisk");
      if (!err) this.rerollQuestsFor(sim);
      client.send("burnResult", err
        ? { ok: false, action: "obelisk", reason: err }
        : { ok: true, action: "obelisk" });
    });

    // Phase 6: Drift-touched cosmetics — DRIFTS burns only, never gold. The
    // catalog (and each entry's burn action) is shared via types.ts.
    this.onMessage("prestige", async (client, msg: { key?: string; burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "prestige", 4, 10_000)) return;
      const key = String(msg?.key ?? "");
      const entry = PRESTIGE_CATALOG[key];
      if (!entry) {
        return client.send("prestigeResult", { ok: false, reason: "Unknown rite" });
      }
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), entry.action);
      if (err) return client.send("prestigeResult", { ok: false, reason: err });
      // server-authoritative ownership: now the identity sync will accept this
      // prestige key from this player (and reject it from everyone else)
      sim.prestige.add(key);
      void setPrestige(sim.token, [...sim.prestige]).catch(() => {});
      client.send("prestigeResult", { ok: true, key, kind: entry.kind });
    });

    // Phase 6: reinforce — a verified burn shores up your WEAKEST claim
    // (+REINFORCE_INTEGRITY, capped at 100: a delay bought again and again,
    // never immunity — the Drift always comes back).
    this.onMessage("reinforce", async (client, msg: { burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "reinforce", 4, 10_000)) return;
      const fail = (reason: string) =>
        client.send("reinforceResult", { ok: false, reason });
      // your weakest claim that still has room to mend
      const weakestReinforceable = (): ClaimState | null => {
        let w: ClaimState | null = null;
        for (const cs of this.state.claims.values()) {
          if (this.claimOwner.get(cs.id) !== sim.token) continue;
          if (cs.integrity >= 100) continue;
          if (!w || cs.integrity < w.integrity) w = cs;
        }
        return w;
      };
      // pre-check BEFORE burning: don't take a burn we can't apply
      if (!weakestReinforceable()) {
        const ownsAny = [...this.state.claims.values()].some(
          (cs) => this.claimOwner.get(cs.id) === sim.token,
        );
        return fail(ownsAny ? "Your wardings already stand whole" : "You hold no claims to reinforce");
      }
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "reinforce");
      if (err) return fail(err);
      // re-select AFTER the on-chain wait: a season may have eroded or felled a
      // claim while the burn confirmed — mend whatever is weakest NOW
      const weakest = weakestReinforceable();
      if (!weakest) return fail("The land fell before the warding could take.");
      weakest.integrity = Math.min(100, weakest.integrity + REINFORCE_INTEGRITY);
      void setClaimIntegrity(weakest.id, weakest.integrity).catch(() => {});
      client.send("reinforceResult", {
        ok: true, id: weakest.id, x: weakest.x, y: weakest.y, integrity: weakest.integrity,
      });
      this.broadcast("claimReinforced", { x: weakest.x, y: weakest.y });
    });

    // ---- the Drift Wheel: gacha cosmetics, DRIFTS burns only -------------------
    this.onMessage("driftSpin", async (client, msg: { burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "driftSpin", 4, 10_000)) return;
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "driftSpin");
      if (err) return client.send("driftSpinResult", { ok: false, reason: err });
      const prize = this.rollDriftWheel(sim);
      void setWheelPity(sim.token, sim.wheelPity).catch(() => {});
      client.send("driftSpinResult", { ok: true, prizes: [prize], pity: sim.wheelPity });
    });

    // a Drift Cache = 3 spins bundled (20% off), one shared pity counter
    this.onMessage("cache", async (client, msg: { burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "cache", 3, 10_000)) return;
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "cache");
      if (err) return client.send("driftSpinResult", { ok: false, reason: err });
      const prizes = [this.rollDriftWheel(sim), this.rollDriftWheel(sim), this.rollDriftWheel(sim)];
      void setWheelPity(sim.token, sim.wheelPity).catch(() => {});
      client.send("driftSpinResult", { ok: true, prizes, pity: sim.wheelPity, cache: true });
    });

    // ---- guilds: found / join / leave / territory / upkeep ---------------------
    this.onMessage("guildFound", async (client, msg: { name?: string; tag?: string; burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "guildFound", 2, 30_000)) return;
      const fail = (reason: string) => client.send("guildResult", { ok: false, reason });
      if (sim.guildId) return fail("You already march under a banner");
      const name = String(msg?.name ?? "").trim().replace(/[^\w\s'-]/g, "").slice(0, GUILD.nameMax);
      const tag = String(msg?.tag ?? "").trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, GUILD.tagMax);
      if (name.length < 3) return fail("A guild needs a name (3+ letters)");
      if (tag.length < 2) return fail("A guild needs a tag (2-4 letters)");
      if (sim.tokenBalance < GUILD.foundHold) {
        return fail(`Founding takes a wallet holding ${GUILD.foundHold.toLocaleString()} DRIFTS`);
      }
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "guildFound");
      if (err) return fail(err);
      const row = await insertGuild(name, tag, sim.token);
      if (!row) return fail("That name or tag is already carried");
      this.guildRows.set(row.id, row);
      this.guildCounts.set(row.id, 1);
      sim.guildId = row.id;
      void setPlayerGuild(sim.token, row.id).catch(() => {});
      const ps = this.state.players.get(client.sessionId);
      if (ps) ps.guildTag = tag;
      this.syncGuildState(row.id);
      client.send("guildResult", { ok: true, id: row.id, name, tag });
      this.broadcast("chat", { name: "the realm", text: `${name} [${tag}] raises its banner.` }, { except: client });
    });

    this.onMessage("guildJoin", (client, msg: { id?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "guildJoin", 4, 10_000)) return;
      const fail = (reason: string) => client.send("guildResult", { ok: false, reason });
      if (sim.guildId) return fail("You already march under a banner");
      const row = this.guildRows.get(Math.round(Number(msg?.id ?? 0)));
      if (!row) return fail("No such guild");
      const count = this.guildCounts.get(row.id) ?? 0;
      if (count >= GUILD.maxMembers) return fail("That guild's roster is full");
      sim.guildId = row.id;
      this.guildCounts.set(row.id, count + 1);
      void setPlayerGuild(sim.token, row.id).catch(() => {});
      const ps = this.state.players.get(client.sessionId);
      if (ps) ps.guildTag = row.tag;
      this.syncGuildState(row.id);
      client.send("guildResult", { ok: true, id: row.id, name: row.name, tag: row.tag });
    });

    this.onMessage("guildLeave", (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "guildLeave", 4, 10_000)) return;
      const fail = (reason: string) => client.send("guildResult", { ok: false, reason });
      if (!sim.guildId) return fail("You march under no banner");
      const row = this.guildRows.get(sim.guildId);
      if (row?.founderToken === sim.token) return fail("The founder cannot abandon the banner");
      this.guildCounts.set(sim.guildId, Math.max(0, (this.guildCounts.get(sim.guildId) ?? 1) - 1));
      this.syncGuildState(sim.guildId);
      sim.guildId = null;
      void setPlayerGuild(sim.token, null).catch(() => {});
      const ps = this.state.players.get(client.sessionId);
      if (ps) ps.guildTag = "";
      client.send("guildResult", { ok: true, left: true });
    });

    this.onMessage("guildTerritory", async (client, msg: { region?: string; burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "guildTerritory", 3, 10_000)) return;
      const fail = (reason: string) => client.send("guildResult", { ok: false, reason });
      const row = sim.guildId ? this.guildRows.get(sim.guildId) : null;
      if (!row) return fail("You march under no banner");
      if (row.founderToken !== sim.token) return fail("Only the founder plants the banner");
      const region = String(msg?.region ?? "");
      if (!(GUILD.regions as readonly string[]).includes(region)) return fail("That ground takes no banner");
      const holder = this.regionHolder(region);
      if (holder && holder.id !== row.id) return fail(`${holder.name} already holds ${region}`);
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "guildTerritory");
      if (err) return fail(err);
      row.region = region;
      row.regionUntil = Date.now() + GUILD.territoryMs;
      void setGuildRegion(row.id, region, row.regionUntil).catch(() => {});
      this.syncGuildState(row.id);
      client.send("guildResult", { ok: true, region, until: row.regionUntil });
      this.broadcast("guildBanner", { tag: row.tag, region });
    });

    this.onMessage("guildUpkeep", async (client, msg: { burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "guildUpkeep", 3, 10_000)) return;
      const fail = (reason: string) => client.send("guildResult", { ok: false, reason });
      const row = sim.guildId ? this.guildRows.get(sim.guildId) : null;
      if (!row) return fail("You march under no banner");
      if (!row.region || row.regionUntil <= Date.now()) {
        return fail("The banner has fallen; it must be staked anew");
      }
      const err = await this.consumeBurn(sim, String(msg?.burnSig ?? ""), "guildUpkeep");
      if (err) return fail(err);
      row.regionUntil = Math.min(row.regionUntil + GUILD.territoryMs, Date.now() + GUILD.territoryMaxMs);
      void setGuildRegion(row.id, row.region, row.regionUntil).catch(() => {});
      this.syncGuildState(row.id);
      client.send("guildResult", { ok: true, region: row.region, until: row.regionUntil });
    });

    // ---- the Exchange: gold ↔ DRIFTS at the Vault -------------------------------
    this.onMessage("exInfo", async (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "exInfo", 4, 10_000)) return;
      const today = await exchangeToday(sim.token).catch(() => ({ bought: 0, sold: 0 }));
      const tier = holderPerks(sim.tokenBalance).key;
      client.send("exInfo", {
        buyRate: EXCHANGE.buyRate,
        sellRate: EXCHANGE.sellRate,
        minTrade: EXCHANGE.minTrade,
        pool: await escrowBalance(),
        buyOpen: !!escrowAddress(),
        sellOpen: !!escrowKeypair() && sellSideOpen(),
        sellOpensAt: EXCHANGE_SELL_FROM, // 0 = no gate; else ms epoch
        boughtToday: today.bought,
        soldToday: today.sold,
        buyCap: EXCHANGE.buyCapPerDay,
        sellCap: EXCHANGE.sellCapPerDay[tier] ?? EXCHANGE.sellCapPerDay[""],
      });
    });

    // buy gold with DRIFTS: quote builds the transfer INTO the escrow pool
    this.onMessage("exBuyQuote", async (client, msg: { gold?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "exBuyQuote", 4, 10_000)) return;
      const fail = (reason: string) => client.send("exQuote", { ok: false, reason });
      const gold = Math.round(Number(msg?.gold ?? 0));
      if (!Number.isFinite(gold) || gold < EXCHANGE.minTrade) return fail(`Trades start at ${EXCHANGE.minTrade}g`);
      const today = await exchangeToday(sim.token).catch(() => ({ bought: 0, sold: 0 }));
      if (today.bought + gold > EXCHANGE.buyCapPerDay) {
        return fail(`The counter sells you ${EXCHANGE.buyCapPerDay}g a day at most`);
      }
      const row = await loadOrCreatePlayer(sim.token);
      if (!row.walletAddress) return fail("Link a wallet first");
      const cost = gold * EXCHANGE.buyRate;
      const built = await buildExchangeBuyTx(row.walletAddress, cost);
      if (!built.ok) return fail(built.reason);
      client.send("exQuote", { ok: true, dir: "buy", gold, cost, tx: built.tx });
    });

    this.onMessage("exBuy", async (client, msg: { gold?: number; sig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "exBuy", 4, 10_000)) return;
      const fail = (reason: string) => client.send("exResult", { ok: false, dir: "buy", reason });
      const gold = Math.round(Number(msg?.gold ?? 0));
      const sig = String(msg?.sig ?? "");
      if (!Number.isFinite(gold) || gold < EXCHANGE.minTrade) return fail("Bad trade");
      if (!/^[1-9A-HJ-NP-Za-km-z]{86,90}$/.test(sig)) return fail("Malformed signature");
      // per-TOKEN single-flight so concurrent buys cannot each read a stale
      // bought-today and inject gold past the daily cap
      if (this.exTrading.has(sim.token)) return fail("The merchant is still counting your last trade");
      this.exTrading.add(sim.token);
      try {
        const today = await exchangeToday(sim.token).catch(() => ({ bought: 0, sold: 0 }));
        if (today.bought + gold > EXCHANGE.buyCapPerDay) return fail("Past the day's cap");
        const row = await loadOrCreatePlayer(sim.token);
        if (!row.walletAddress) return fail("No wallet linked");
        // insert-first replay protection (the burns table is the sig ledger)
        if (!(await tryInsertBurn(sig, sim.token, "exBuy"))) return fail("That payment was already spent");
        const cost = gold * EXCHANGE.buyRate;
        const v = await verifyTxLegs(sig, [
          { type: "transfer", from: row.walletAddress, destAta: escrowAta(), min: cost },
        ]);
        if (!v.ok) {
          await deleteBurn(sig).catch(() => {});
          return fail(v.reason ?? "The payment could not be verified");
        }
        this.credit(sim, gold);
        // AWAIT before releasing the lock so the next buy sees this one's tally
        await exchangeRecord(sim.token, gold, 0).catch(() => {});
        client.send("exResult", { ok: true, dir: "buy", gold, cost });
      } finally {
        this.exTrading.delete(sim.token);
      }
    });

    // sell gold for DRIFTS: the ONLY outbound rail — pool-funded, capped, ordered
    this.onMessage("exSell", async (client, msg: { gold?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "exSell", 2, 30_000)) return;
      const fail = (reason: string) => client.send("exResult", { ok: false, dir: "sell", reason });
      // claim the per-TOKEN lock BEFORE any await so two sessions of one wallet
      // cannot both read a stale daily cap / drain the pool concurrently
      if (this.exTrading.has(sim.token)) return fail("The merchant is still counting your last trade");
      if (!sellSideOpen()) {
        return fail("The merchant isn't buying gold yet — the counter opens once the realm has settled");
      }
      const gold = Math.round(Number(msg?.gold ?? 0));
      if (!Number.isFinite(gold) || gold < EXCHANGE.minTrade) return fail(`Trades start at ${EXCHANGE.minTrade}g`);
      this.exTrading.add(sim.token);
      try {
        const row = await loadOrCreatePlayer(sim.token);
        if (!row.walletAddress) return fail("Link a wallet first");
        const tier = holderPerks(sim.tokenBalance).key;
        const cap = EXCHANGE.sellCapPerDay[tier] ?? EXCHANGE.sellCapPerDay[""];
        const today = await exchangeToday(sim.token).catch(() => ({ bought: 0, sold: 0 }));
        if (today.sold + gold > cap) {
          return fail(`Your standing sells ${cap}g a day at most (${cap - today.sold}g left)`);
        }
        const payout = gold * EXCHANGE.sellRate;
        if ((await escrowBalance()) < payout) return fail("The merchant's purse is light");
        // debit FIRST (the gold ledger is authoritative)
        if (!this.debit(sim, gold)) return fail(`You carry less than ${gold}g`);
        const paid = await payFromEscrow(row.walletAddress, payout);
        if (paid.ok) {
          // AWAIT the cap write before releasing the lock so the next sell of
          // this token reads a correct sold-today (no read-then-write race)
          await exchangeRecord(sim.token, 0, gold, paid.sig).catch(() => {});
          client.send("exResult", { ok: true, dir: "sell", gold, drifts: payout, sig: paid.sig });
        } else if (paid.refundable) {
          // nothing was paid out (no broadcast, or landed-and-reverted): refund
          this.credit(sim, gold);
          return fail(paid.reason);
        } else {
          // INDETERMINATE: the DRIFTS may already be leaving escrow. Do NOT
          // refund (that double-pays). Hold the gold spent, record the sale +
          // sig against the cap so a retry cannot drain more, and tell the
          // player to check their wallet (reconcile the sig off-chain later).
          await exchangeRecord(sim.token, 0, gold, paid.sig).catch(() => {});
          client.send("exResult", { ok: true, dir: "sell", gold, drifts: payout, sig: paid.sig, pending: true });
        }
      } finally {
        this.exTrading.delete(sim.token);
      }
    });

    // ---- the relic market: P2P Drift-touched cosmetics --------------------------
    this.onMessage("relicList", async (client, msg: { key?: string; price?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "relicList", 4, 10_000)) return;
      const fail = (reason: string) => client.send("relicResult", { ok: false, reason });
      const key = String(msg?.key ?? "");
      const price = Math.round(Number(msg?.price ?? 0));
      const entry = PRESTIGE_CATALOG[key];
      // titles AND avatars are soul-bound (avatars would need live-strip +
      // re-validation of the worn body on both sides — revisit after review)
      if (!entry || entry.kind === "title" || entry.kind === "avatar") return fail("That cannot be traded");
      if (!sim.prestige.has(key)) return fail("You do not own that relic");
      if (price < RELIC_MARKET.minPrice || price > RELIC_MARKET.maxPrice) {
        return fail(`Relics trade between ${RELIC_MARKET.minPrice.toLocaleString()} and ${RELIC_MARKET.maxPrice.toLocaleString()} DRIFTS`);
      }
      const mine = [...this.relicOwner.values()].filter((r) => r.token === sim.token);
      if (mine.length >= RELIC_MARKET.maxListings) return fail(`You may list ${RELIC_MARKET.maxListings} relics at once`);
      if (mine.some((r) => r.key === key)) return fail("That relic is already on the stall");
      const row = await loadOrCreatePlayer(sim.token);
      if (!row.walletAddress) return fail("Link a wallet first (the buyer pays it directly)");
      const ps = this.state.players.get(client.sessionId);
      const rec = await insertRelic(sim.token, row.walletAddress, ps?.name ?? "Wanderer", key, price);
      this.addRelic(rec.id, sim.token, row.walletAddress, ps?.name ?? "Wanderer", key, price);
      client.send("relicResult", { ok: true, listed: true, id: rec.id, key, price });
    });

    this.onMessage("relicUnlist", (client, msg: { id?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "relicUnlist", 4, 10_000)) return;
      const id = Math.round(Number(msg?.id ?? 0));
      if (this.relicSettling.has(id)) return; // a buy is settling it — can't pull
      const rec = this.relicOwner.get(id);
      if (!rec || rec.token !== sim.token) return;
      this.relicOwner.delete(id);
      this.state.relics.delete(String(id));
      void deleteRelic(id).catch(() => {});
      client.send("relicResult", { ok: true, unlisted: true, id });
    });

    this.onMessage("relicQuote", async (client, msg: { id?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "relicQuote", 4, 10_000)) return;
      const fail = (reason: string) => client.send("relicQuote", { ok: false, reason });
      const id = Math.round(Number(msg?.id ?? 0));
      const rec = this.relicOwner.get(id);
      if (!rec) return fail("That relic is gone");
      if (rec.token === sim.token) return fail("It is already yours");
      if (sim.prestige.has(rec.key)) return fail("You already wear its like");
      const row = await loadOrCreatePlayer(sim.token);
      if (!row.walletAddress) return fail("Link a wallet first");
      const built = await buildRelicTx(row.walletAddress, rec.wallet, rec.price, RELIC_MARKET.feePct);
      if (!built.ok) return fail(built.reason);
      client.send("relicQuote", { ok: true, id, price: rec.price, key: rec.key, tx: built.tx });
    });

    this.onMessage("relicBuy", async (client, msg: { id?: number; sig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "relicBuy", 3, 10_000)) return;
      const fail = (reason: string) => client.send("relicResult", { ok: false, reason });
      const id = Math.round(Number(msg?.id ?? 0));
      const sig = String(msg?.sig ?? "");
      const rec = this.relicOwner.get(id);
      if (!rec) return fail("That relic is gone");
      if (!/^[1-9A-HJ-NP-Za-km-z]{86,90}$/.test(sig)) return fail("Malformed signature");
      // claim the listing BEFORE any await: a second concurrent buy (distinct
      // sig) must not read the same rec and settle the relic twice
      if (this.relicSettling.has(id)) return fail("That relic is mid-sale");
      this.relicSettling.add(id);
      try {
        const row = await loadOrCreatePlayer(sim.token);
        if (!row.walletAddress) return fail("No wallet linked");
        const fee = Math.ceil(rec.price * RELIC_MARKET.feePct);
        // the fee leg burns forever — recorded on the public counter
        if (!(await tryInsertBurn(sig, sim.token, "relic", fee, 0))) return fail("That payment was already spent");
        const v = await verifyTxLegs(sig, [
          { type: "transfer", from: row.walletAddress, destAta: walletAta(rec.wallet), min: rec.price - fee },
          { type: "burn", from: row.walletAddress, min: fee },
        ]);
        if (!v.ok) {
          await deleteBurn(sig).catch(() => {});
          return fail(v.reason ?? "The payment could not be verified");
        }
        // settle: pull the listing and strip the seller's LIVE prestige
        // SYNCHRONOUSLY (no await between the two) so the seller cannot re-list
        // the key in the gap. The buyer's grant happens here too.
        this.relicOwner.delete(id);
        this.state.relics.delete(String(id));
        void deleteRelic(id).catch(() => {});
        sim.prestige.add(rec.key);
        void setPrestige(sim.token, [...sim.prestige]).catch(() => {});
        let liveSeller: PlayerSim | null = null;
        for (const [sid, other] of this.sims) {
          if (other.token !== rec.token) continue;
          other.prestige.delete(rec.key);
          liveSeller = other;
          const ops = this.state.players.get(sid);
          if (ops?.aura === rec.key) ops.aura = "";
          if (ops?.dye === rec.key) ops.dye = "stone";
          const sellerClient = this.clients.find((c) => c.sessionId === sid);
          sellerClient?.send("relicSold", { key: rec.key, price: rec.price, net: rec.price - fee });
          break;
        }
        // persist the seller's loss. Online → their live set is authoritative
        // (already stripped above), so write that; offline → read-modify-write
        // the row. Avoids the stale-snapshot lost-update on a concurrent grant.
        if (liveSeller) {
          void setPrestige(rec.token, [...liveSeller.prestige]).catch(() => {});
        } else {
          const sellerRow = await loadOrCreatePlayer(rec.token);
          const sellerOwned = new Set(Array.isArray(sellerRow.prestige) ? sellerRow.prestige : []);
          sellerOwned.delete(rec.key);
          void setPrestige(rec.token, [...sellerOwned]).catch(() => {});
        }
        client.send("relicResult", { ok: true, bought: true, key: rec.key, kind: PRESTIGE_CATALOG[rec.key]?.kind });
      } finally {
        this.relicSettling.delete(id);
      }
    });

    this.onMessage("unlinkWallet", async (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "unlinkWallet", 3, 10_000)) return;
      await setWalletAddress(sim.token, null).catch(() => {});
      sim.tokenBalance = 0; // tier perks leave with the wallet
      client.send("walletResult", { ok: true, address: null });
    });

    // (the "raiderKill" intent is gone — raiders are shared mobs now, and the
    //  attack handler counts their REAL deaths into the event quotas)

    // stored progress, sent when the client says it's ready to receive it
    this.onMessage("getProfile", async (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "getProfile", 4, 10_000)) return;
      const myClaims = [...this.claimOwner]
        .filter(([, t]) => t === sim.token)
        .map(([id]) => id);
      const myListings = [...this.listingOwner]
        .filter(([, t]) => t === sim.token)
        .map(([id]) => id);
      const escrowGold = await takeEscrow(sim.token).catch(() => 0);
      if (escrowGold > 0) this.credit(sim, escrowGold);
      const row = await loadOrCreatePlayer(sim.token);
      const tokenBalance = row.walletAddress
        ? await getTokenBalance(row.walletAddress)
        : 0;
      sim.tokenBalance = tokenBalance; // holder-tier perks track the wallet
      client.send("profile", {
        snapshot: sim.profileSnapshot,
        myClaims,
        myListings,
        escrowGold,
        // an unseeded ledger stays quiet: the client's local gold/items stand
        // until its first snapshot push seeds the ledgers
        ...(sim.goldSeeded ? { gold: Math.round(sim.gold) } : {}),
        ...(sim.invSeeded ? { inv: sim.inv } : {}),
        banked: row.bankGold,
        wallet: row.walletAddress ?? null,
        tokenBalance,
        holder: tokenBalance >= 1,
        mint: tokenMint() || null,
        founder: row.founder,
        prestige: [...sim.prestige], // server-authoritative Drift-touched ownership
      });
    });

    // ---- marketplace ----------------------------------------------------------

    // list an item (the client already escrowed it out of its inventory)
    this.onMessage(
      "list",
      async (client, msg: { item?: string; qty?: number; price?: number }) => {
        const sim = this.sims.get(client.sessionId);
        const ps = this.state.players.get(client.sessionId);
        const fail = (reason: string) =>
          client.send("listResult", { ok: false, reason, item: msg?.item, qty: msg?.qty });
        if (!sim) return;
        if (!this.allow(sim, "list", 6, 5000)) return;
        const item = String(msg?.item ?? "");
        const qty = Math.floor(Number(msg?.qty ?? 0));
        const price = Math.floor(Number(msg?.price ?? 0));
        if (!VALID_ITEMS.has(item)) return fail("Unknown item");
        if (qty < 1 || qty > 999) return fail("Bad quantity");
        if (price < 1 || price > 100_000) return fail("Bad price");
        const owned = [...this.listingOwner.values()].filter((t) => t === sim.token).length;
        const stallCap = holderPerks(sim.tokenBalance).marketSlots;
        if (owned >= stallCap) {
          return fail(`Your stall is full (${stallCap} listings)`);
        }
        // the goods leave the inventory ledger and live in the listing
        if (!this.debitItems(sim, [[item as ItemKey, qty]])) {
          return fail("You don't carry that much");
        }
        const name = ps?.name ?? "Wanderer";
        const row = await insertListing(sim.token, name, item, qty, price);
        this.addListing(row.id, sim.token, name, item, qty, price);
        client.send("listResult", { ok: true, id: row.id, item, qty });
      },
    );

    // cancel your own listing → items return to your satchel
    this.onMessage("unlist", async (client, msg: { id?: number }) => {
      const sim = this.sims.get(client.sessionId);
      const ls = this.state.listings.get(String(msg?.id));
      if (!sim || !ls) return;
      if (!this.allow(sim, "unlist", 6, 5000)) return;
      if (this.listingOwner.get(ls.id) !== sim.token) return;
      this.state.listings.delete(String(ls.id));
      this.listingOwner.delete(ls.id);
      await deleteListing(ls.id).catch(() => {});
      this.creditItem(sim, ls.item as ItemKey, ls.qty); // goods back to the ledger
      client.send("unlistResult", { ok: true, item: ls.item, qty: ls.qty });
    });

    // buy a listing (the ledger pays; the seller's ledger or escrow collects)
    this.onMessage("buy", async (client, msg: { id?: number }) => {
      const sim = this.sims.get(client.sessionId);
      const ls = this.state.listings.get(String(msg?.id));
      const fail = (reason: string) =>
        client.send("buyResult", { ok: false, reason });
      if (!sim) return;
      if (!this.allow(sim, "buy", 6, 3000)) return;
      if (!ls) return fail("That offer is gone");
      const sellerToken = this.listingOwner.get(ls.id);
      if (sellerToken === sim.token) return fail("That's your own stall");
      if (!this.debit(sim, ls.price)) return fail(`That costs ${ls.price}g. Your purse is light`);

      this.state.listings.delete(String(ls.id));
      this.listingOwner.delete(ls.id);
      await deleteListing(ls.id).catch(() => {});
      this.creditItem(sim, ls.item as ItemKey, ls.qty); // goods to the buyer's ledger
      client.send("buyResult", { ok: true, item: ls.item, qty: ls.qty, price: ls.price });

      // pay the seller: straight into their ledger when online, escrow otherwise
      const sellerSim = [...this.sims.values()].find((s) => s.token === sellerToken);
      if (sellerSim) {
        this.credit(sellerSim, ls.price);
        sellerSim.client.send("sold", {
          item: ls.item,
          qty: ls.qty,
          gold: ls.price,
          buyer: this.state.players.get(client.sessionId)?.name ?? "a wanderer",
        });
      } else if (sellerToken) {
        await addEscrow(sellerToken, ls.price).catch(() => {});
      }
    });

    // stake a 3×3 land claim (the ledger pays, OR a verified token burn)
    this.onMessage("claim", async (client, msg: { x?: number; y?: number; burnSig?: string }) => {
      const sim = this.sims.get(client.sessionId);
      const ps = this.state.players.get(client.sessionId);
      const fail = (reason: string) =>
        client.send("claimResult", { ok: false, reason });
      if (!sim || typeof msg?.x !== "number" || typeof msg?.y !== "number") return;
      if (!this.allow(sim, "claim", 6, 3000)) return;
      const x = Math.round(msg.x);
      const y = Math.round(msg.y);

      if (Math.hypot(x - TOWN_CENTER.x, y - TOWN_CENTER.y) < 11) {
        return fail("The Waystation's ground belongs to everyone");
      }
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!this.world.inBounds(x + dx, y + dy)) return fail("Too close to the world's edge");
          if (buildingAt(x + dx, y + dy)) return fail("There's a building in the way");
          const t = this.world.tile(x + dx, y + dy);
          if (t === "water") return fail("You can't stake water");
          if (t === "corrupt") return fail("The Drift already holds this ground");
        }
      }
      for (const cs of this.state.claims.values()) {
        if (Math.max(Math.abs(cs.x - x), Math.abs(cs.y - y)) < 3) {
          return fail("Overlaps an existing claim");
        }
      }
      const owned = [...this.claimOwner.values()].filter((t) => t === sim.token).length;
      const claimCap = holderPerks(sim.tokenBalance).claimSlots;
      if (owned >= claimCap) {
        return fail(`You already hold ${claimCap} claims`);
      }
      if (msg?.burnSig) {
        const err = await this.consumeBurn(sim, String(msg.burnSig), "claim");
        if (err) return fail(err);
      } else if (!this.debit(sim, CLAIM_COST)) {
        return fail(`Staking a claim costs ${CLAIM_COST}g`);
      }

      const row = await insertClaim(sim.token, x, y);
      this.addClaim(row.id, sim.token, x, y, 100, ps?.name ?? "Wanderer");
      client.send("claimResult", { ok: true, id: row.id, x, y });
      this.broadcast(
        "claimPlaced",
        { x, y, name: ps?.name ?? "Wanderer" },
        { except: client },
      );
    });

    // periodic progress push from the client (throttled; trusted until Phase 6)
    this.onMessage("save", (client, msg: { snapshot?: unknown }) => {
      const sim = this.sims.get(client.sessionId);
      const ps = this.state.players.get(client.sessionId);
      if (!sim || !msg?.snapshot) return;
      const now = Date.now();
      if (now - sim.lastSaveAt < 4000) return; // rate limit
      sim.lastSaveAt = now;
      // first contact: the snapshot's gold/items seed the ledgers exactly once
      if (!sim.goldSeeded) {
        const g = Number((msg.snapshot as { gold?: unknown })?.gold ?? 0);
        sim.gold = Number.isFinite(g) ? Math.max(0, Math.round(g)) : 0;
        sim.goldSeeded = true;
        void persistGold(sim.token, sim.gold).catch(() => {});
        this.syncGold(sim);
      }
      if (!sim.invSeeded) {
        sim.inv = sanitizeInv((msg.snapshot as { inventory?: unknown })?.inventory);
        sim.invSeeded = true;
        void persistInv(sim.token, sim.inv).catch(() => {});
        this.syncInv(sim);
      }
      sim.combatLevel = snapCombatLevel(msg.snapshot);
      void savePlayer(sim.token, {
        snapshot: msg.snapshot,
        lastX: sim.px,
        lastY: sim.py,
        ...(ps ? { name: ps.name, dye: ps.dye, eye: ps.eye } : {}),
      }).catch(() => {});
    });

    // ---- Phase 6: client-trusted gold events → the ledger, clamped per reason ----
    this.onMessage("goldDelta", (client, msg: { amount?: number; reason?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "goldDelta", 30, 1000)) return;
      const amount = Math.trunc(Number(msg?.amount ?? 0));
      const reason = String(msg?.reason ?? "");
      if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1_000_000) return;

      // spends can't mint gold — apply, clamped at an empty purse
      if (amount < 0) {
        if (reason === "death") {
          // half the purse drops into a tombstone; remember what fell
          const drop = Math.min(-amount, Math.floor(sim.gold));
          this.tombGold.set(sim.token, drop);
          if (drop > 0) this.credit(sim, -drop);
        } else {
          this.credit(sim, amount);
        }
        return;
      }

      // tombstone reclaim pays back only what the death actually recorded
      if (reason === "tomb") {
        const held = this.tombGold.get(sim.token) ?? 0;
        const take = Math.min(amount, held);
        this.tombGold.set(sim.token, held - take);
        if (take > 0) this.credit(sim, take);
        return;
      }

      const cap = GOLD_DELTA_CAPS[reason];
      if (!cap) return;
      const now = Date.now();
      let win = sim.deltaWindow.get(reason);
      if (!win || now - win.start > 60_000) {
        win = { start: now, sum: 0 };
        sim.deltaWindow.set(reason, win);
      }
      const granted = Math.min(amount, cap.event, cap.perMin - win.sum);
      if (granted <= 0) return;
      win.sum += granted;
      this.credit(sim, granted);
    });

    // ---- client-trusted item events → the inventory ledger, clamped per reason ----
    this.onMessage("itemDelta", (client, msg: { item?: string; qty?: number; reason?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "itemDelta", 30, 1000)) return;
      const item = String(msg?.item ?? "") as ItemKey;
      const qty = Math.trunc(Number(msg?.qty ?? 0));
      const reason = String(msg?.reason ?? "");
      if (!VALID_ITEMS.has(item)) return;
      if (!Number.isFinite(qty) || qty === 0 || Math.abs(qty) > 100_000) return;

      // spends can't mint — apply, clamped at an empty satchel
      if (qty < 0) {
        this.creditItem(sim, item, qty);
        return;
      }

      const cap = ITEM_DELTA_CAPS[reason];
      if (!cap || !cap.items.includes(item)) return;
      const now = Date.now();
      const key = `item:${reason}:${item}`;
      let win = sim.deltaWindow.get(key);
      if (!win || now - win.start > 60_000) {
        win = { start: now, sum: 0 };
        sim.deltaWindow.set(key, win);
      }
      const granted = Math.min(qty, cap.event, cap.perMin - win.sum);
      if (granted <= 0) return;
      win.sum += granted;
      this.creditItem(sim, item, granted);
    });

    // ---- cooking: fish → cooked fish, only as many as the ledger holds -----------
    this.onMessage("cook", (client, msg: { qty?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "cook", 4, 2000)) return;
      const qty = Math.trunc(Number(msg?.qty ?? 0));
      if (!Number.isFinite(qty) || qty <= 0 || qty > 999) return;
      const n = Math.min(qty, sim.inv.fish ?? 0);
      if (n <= 0) return;
      sim.inv.fish -= n;
      sim.inv.cooked_fish = (sim.inv.cooked_fish ?? 0) + n;
      sim.invSeeded = true;
      void persistInv(sim.token, sim.inv).catch(() => {});
      this.syncInv(sim);
      this.advanceQuests(sim, { type: "cook", qty: n });
    });

    // ---- claim a completed daily quest: gold rides the ledger, XP stays client-side
    this.onMessage("claimQuest", (client, msg: { id?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "claimQuest", 8, 2000)) return;
      if (this.ensureFreshQuests(sim)) this.syncQuests(sim);
      const id = String(msg?.id ?? "");
      const q = sim.quests.list.find((x) => x.id === id);
      if (!q || q.claimed) return; // unknown or replay → ignore
      const def = QUEST_POOL.find((d) => d.id === id);
      if (!def || q.progress < def.target) return; // early-claim → refused
      q.claimed = true;
      this.credit(sim, def.goldReward); // gold ledger + goldSync
      void persistQuests(sim.token, sim.quests).catch(() => {});
      client.send("questClaimed", { id, xp: def.xpReward }); // client applies XP
      this.syncQuests(sim);
    });

    // ---- Obelisk: rewrite the day's tasks for 75g (the burn path is obeliskBurn)
    this.onMessage("questReroll", (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "questReroll", 4, 5000)) return;
      if (!this.debit(sim, 75)) return; // purse too light → no change
      this.rerollQuestsFor(sim);
    });

    // ---- vendor sales: goods leave the ledger, gold arrives at house prices -------
    this.onMessage("sell", (client, msg: { item?: string; qty?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "sell", 8, 2000)) return;
      const item = String(msg?.item ?? "") as ItemKey;
      if (!VALID_ITEMS.has(item)) return;
      const qty = Math.trunc(Number(msg?.qty ?? 0));
      if (!Number.isFinite(qty) || qty <= 0 || qty > 999) return;
      const n = Math.min(qty, sim.inv[item] ?? 0);
      if (n <= 0) return;
      sim.inv[item] = (sim.inv[item] ?? 0) - n;
      sim.invSeeded = true;
      void persistInv(sim.token, sim.inv).catch(() => {});
      this.syncInv(sim);
      this.credit(sim, n * ITEM_META[item].sellValue);
    });

    // ---- the Forge: a recipe's materials leave the ledger (gear stays client-side)
    this.onMessage("craft", (client, msg: { id?: string }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "craft", 5, 2000)) return;
      const recipe = RECIPES.find((r) => r.result.id === String(msg?.id ?? ""));
      if (!recipe) return;
      this.debitItems(
        sim,
        Object.entries(recipe.cost) as [ItemKey, number][],
      );
    });

    // ---- shared mobs: engage freezes the beast, attack trades the blows ---------
    this.onMessage("engage", (client, msg: { id?: number }) => {
      const sim = this.sims.get(client.sessionId);
      const mob = this.mobSims.find((m) => m.id === Number(msg?.id));
      if (!sim || !mob || mob.state === "dead") return;
      if (!this.allow(sim, "engage", 8, 1000)) return;
      if (chebyshev(this.cellOf(sim), mob.cell) > 1) return;
      mob.engagedBy = client.sessionId;
      mob.lastEngagedAt = Date.now();
      mob.state = "engaged";
      mob.retaliateIn = MOB_ATTACK_MS;
    });

    this.onMessage("attack", (client, msg: { id?: number; dmg?: number }) => {
      const sim = this.sims.get(client.sessionId);
      const mob = this.mobSims.find((m) => m.id === Number(msg?.id));
      if (!sim || !mob || mob.state === "dead") return;
      const now = Date.now();
      if (now - (sim.lastMobAttackAt ?? 0) < ATTACK_RATE_MS) return; // swing cap
      if (chebyshev(this.cellOf(sim), mob.cell) > 1) return;
      sim.lastMobAttackAt = now;
      // clamp to the best swing the player's last-saved combat level could
      // legitimately roll: crit × (3 + lvl/2 + weapon 7 + rand 3) ≈ 26 + lvl
      const maxDmg = Math.min(ATTACK_MAX_DMG, 26 + sim.combatLevel);
      const dmg = Math.max(1, Math.min(maxDmg, Math.floor(Number(msg?.dmg ?? 0))));
      mob.engagedBy = client.sessionId;
      mob.lastEngagedAt = now;
      if (mob.state !== "engaged") {
        mob.state = "engaged";
        mob.retaliateIn = MOB_ATTACK_MS;
      }
      mob.hp = Math.max(0, mob.hp - dmg);
      if (mob.hp > 0) return;

      // it falls: loot lands on the killer's ledgers, the kill on their log
      mob.die();
      const loot = { gold: 0, shards: 0, hide: 0 };
      if (mob.kind === "raider") {
        loot.gold = 5 + ((Math.random() * 6) | 0);
      } else if (mob.kind === "colossus") {
        loot.gold = 50;
        loot.shards = 5;
      } else {
        loot.shards = 1;
        loot.hide = Math.random() < 0.5 ? 1 : 0;
      }
      if (loot.gold) this.credit(sim, loot.gold);
      if (loot.shards) this.creditItem(sim, "driftshard", loot.shards);
      if (loot.hide) this.creditItem(sim, "hide", loot.hide);
      client.send("mobKill", {
        id: mob.id, kind: mob.kind, level: mob.level, xp: mob.xp, ...loot,
      });
      // any overworld mob death advances the kill quest (matches the current
      // client behavior where any mob death fired the kill event)
      this.advanceQuests(sim, { type: "kill" });

      // real deaths feed the event quotas (no more trusted kill intents)
      if (mob.eventTag === "night" && this.state.nightActive) {
        this.state.nightKills += 1;
      } else if (mob.eventTag === "ambush") {
        const c = this.state.caravan;
        if (c.phase !== "ambushed") return;
        c.waveKills += 1;
        const entry = this.caravanContrib.get(sim.token) ?? {
          name: this.state.players.get(client.sessionId)?.name ?? "Wanderer",
          kills: 0,
          weight: 1,
        };
        entry.kills += 1;
        // holder tiers weigh each kill heavier in the pro-rata split; a
        // standing guild banner adds its own weight on top
        entry.weight = holderPerks(sim.tokenBalance).caravanWeight +
          (this.guildBannerStands(sim) ? GUILD.caravanWeightBonus : 0);
        this.caravanContrib.set(sim.token, entry);
        if (c.waveKills >= c.waveNeed) {
          c.phase = "rolling";
          this.clearEventMobs("ambush");
          this.broadcast("waveCleared", { run: c.run, wave: c.wave, waves: c.waves });
        }
      }
    });

    // client died in (client-local) combat — pull them back to spawn
    this.onMessage("respawn", (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      if (!this.allow(sim, "respawn", 4, 5000)) return;
      const spawn = this.findSpawn();
      sim.px = spawn.x;
      sim.py = spawn.y;
      sim.path = [];
      sim.pendingNode = null;
      this.cancelGather(sim);
      sim.action = "idle";
    });

    this.setSimulationInterval(() => this.tick(TICK_MS / 1000), TICK_MS);
  }

  /** guest auth: a browser-held token is the identity; rows are auto-created.
   *  With GATE_TOKENS set, the door demands a wallet holding enough of the
   *  game token AND a signature over gateMessage proving the join actually
   *  owns that wallet (nonce issued by /gate; verified in src/gate.ts). */
  async onAuth(
    client: Client,
    options: { token?: string; address?: string; gateNonce?: string; gateSig?: string },
  ) {
    const token = typeof options?.token === "string" ? options.token.trim() : "";
    if (token.length < 8 || token.length > 64) return false;
    const gate = gateTokens();
    let gateAddress = "";
    if (gate > 0) {
      const address = typeof options?.address === "string" ? options.address.trim() : "";
      const nonce = typeof options?.gateNonce === "string" ? options.gateNonce : "";
      const sig = typeof options?.gateSig === "string" ? options.gateSig : "";
      if (!address || !nonce || !sig) return false;
      if (!verifyGateProof(address, nonce, sig)) return false;
      if ((await getTokenBalance(address)) < gate) return false;
      // the gate proof IS a wallet-ownership signature (same ed25519 rail as the
      // in-game link) — carry the proven address through so onJoin can auto-link it
      gateAddress = address;
    }
    const row = await loadOrCreatePlayer(token);
    return gateAddress ? Object.assign(row, { gateAddress }) : row;
  }

  onJoin(client: Client) {
    const row = client.auth as PlayerRow;

    // wake where you last stood, if that ground still carries you
    let spawn = this.findSpawn();
    if (
      row.lastX != null &&
      row.lastY != null &&
      this.world.isWalkable(Math.round(row.lastX), Math.round(row.lastY))
    ) {
      spawn = { x: Math.round(row.lastX), y: Math.round(row.lastY) };
    }

    // the ledger: NULL column = first join since Phase 6 — migrate snapshot gold.
    // A row with neither stays unseeded until the client's first snapshot push.
    const snapGold = Number((row.snapshot as { gold?: unknown } | null)?.gold ?? 0);
    const gold = row.gold ?? (Number.isFinite(snapGold) ? Math.max(0, Math.round(snapGold)) : 0);
    const goldSeeded = row.gold != null || row.snapshot != null;
    const inv = sanitizeInv(
      row.inv ?? (row.snapshot as { inventory?: unknown } | null)?.inventory,
    );
    const invSeeded = row.inv != null || row.snapshot != null;

    const sim: PlayerSim = {
      client,
      px: spawn.x,
      py: spawn.y,
      path: [],
      action: "idle",
      gatherNode: null,
      gatherMs: 0,
      gatherTotal: 0,
      speedMult: 1,
      pendingNode: null,
      token: row.token,
      lastSaveAt: 0,
      profileSnapshot: row.snapshot ?? null,
      gold,
      goldSeeded,
      inv,
      invSeeded,
      deltaWindow: new Map(),
      rates: new Map(),
      combatLevel: snapCombatLevel(row.snapshot),
      tokenBalance: 0, // refreshed by getProfile/linkWallet (chain reads are async)
      prestige: new Set(Array.isArray(row.prestige) ? row.prestige : []),
      wheelPity: Math.max(0, Math.round(row.wheelPity ?? 0)),
      guildId: row.guildId != null ? Math.round(row.guildId) : null,
      quests: sanitizeQuests(row.quests),
    };
    this.sims.set(client.sessionId, sim);
    if (row.gold == null && goldSeeded) void persistGold(row.token, gold).catch(() => {});
    if (row.inv == null && invSeeded) void persistInv(row.token, inv).catch(() => {});

    const ps = new PlayerState();
    ps.id = client.sessionId;
    ps.x = spawn.x;
    ps.y = spawn.y;
    ps.name = row.name;
    ps.dye = row.dye;
    ps.eye = row.eye;
    if (sim.guildId) ps.guildTag = this.guildRows.get(sim.guildId)?.tag ?? "";
    this.state.players.set(client.sessionId, ps);

    this.syncQuests(sim);

    // a player who cleared the entry gate already proved wallet ownership at the
    // door — bind it now so they're a linked holder without signing again
    const gateAddress = (row as PlayerRow & { gateAddress?: string }).gateAddress;
    if (gateAddress) {
      void this.autoLinkGateWallet(sim, gateAddress, row.walletAddress ?? null);
    }
  }

  async onLeave(client: Client) {
    // fleeing a duel forfeits it
    const duel = this.duels.find(
      (d) => d.a === client.sessionId || d.b === client.sessionId,
    );
    if (duel) {
      this.endDuel(duel, duel.a === client.sessionId ? duel.b : duel.a);
    }
    // an open arena challenge leaves with its poster
    if (this.pitQueue?.sessionId === client.sessionId) {
      this.pitQueue = null;
      this.broadcast("pitQueue", null);
    }
    const sim = this.sims.get(client.sessionId);
    const ps = this.state.players.get(client.sessionId);
    this.sims.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
    if (sim) {
      await savePlayer(sim.token, {
        lastX: sim.px,
        lastY: sim.py,
        ...(ps ? { name: ps.name, dye: ps.dye, eye: ps.eye } : {}),
      }).catch(() => {});
    }
  }

  // ---- simulation ------------------------------------------------------------

  private tick(dt: number) {
    this.drift.update(this.world, dt);
    this.syncNodes();
    this.stepCaravan(dt);
    this.stepNight();
    this.stepMobs(dt);

    // duel timeouts → draw, both refunded client-side
    const now = Date.now();
    for (const duel of [...this.duels]) {
      if (now > duel.until) this.endDuel(duel, null);
    }

    for (const [id, sim] of this.sims) {
      this.stepSim(sim, dt);
      const ps = this.state.players.get(id);
      if (!ps) continue;
      ps.x = sim.px;
      ps.y = sim.py;
      ps.action = sim.action;
      ps.tx = sim.gatherNode ? sim.gatherNode.gx : -1;
      ps.ty = sim.gatherNode ? sim.gatherNode.gy : -1;
    }
  }

  private stepSim(sim: PlayerSim, dt: number) {
    if (sim.action === "walk" && sim.path.length) {
      const next = sim.path[0];
      const dx = next.x - sim.px;
      const dy = next.y - sim.py;
      const dist = Math.hypot(dx, dy);
      const step = PLAYER_SPEED * dt;
      if (dist <= step) {
        sim.px = next.x;
        sim.py = next.y;
        sim.path.shift();
        if (!sim.path.length) sim.action = "idle";
      } else {
        sim.px += (dx / dist) * step;
        sim.py += (dy / dist) * step;
      }
    }

    // arrival at a node we were sent to gather
    if (sim.pendingNode && sim.action === "idle" && sim.path.length === 0) {
      const node = sim.pendingNode;
      sim.pendingNode = null;
      if (
        node.amount > 0 &&
        node.regrowIn <= 0 &&
        chebyshev(this.cellOf(sim), { x: node.gx, y: node.gy }) === 1
      ) {
        this.startGather(sim, node);
      }
    }

    if (sim.action === "gather" && sim.gatherNode) {
      const node = sim.gatherNode;
      // node may have been depleted or relocated by someone else mid-swing
      if (node.amount <= 0 || node.regrowIn > 0) {
        this.cancelGather(sim);
        return;
      }
      sim.gatherMs += dt * 1000;
      if (sim.gatherMs >= sim.gatherTotal) {
        node.amount -= 1;
        const depleted = node.amount <= 0;
        // the house rolls rich strikes now; loot lands on the inventory ledger.
        // Guild territory: gathering inside your guild's held region adds odds.
        const rich = Math.random() <
          holderPerks(sim.tokenBalance).richStrikeP +
          (this.inGuildRegion(sim) ? GUILD.richStrikeBonus : 0);
        const qty = rich ? 2 : 1;
        this.creditItem(sim, RESOURCE_META[node.kind].item, qty);
        this.advanceQuests(sim, { type: "gather", item: RESOURCE_META[node.kind].item });
        sim.client.send("loot", { kind: node.kind, qty, rich, depleted });
        if (depleted) {
          this.drift.depleteNode(this.world, node.gx, node.gy);
          this.cancelGather(sim);
        } else {
          sim.gatherMs = 0; // keep swinging
        }
      }
    }
  }

  private startGather(sim: PlayerSim, node: ResourceNode) {
    sim.action = "gather";
    sim.gatherNode = node;
    sim.gatherMs = 0;
    sim.gatherTotal = RESOURCE_META[node.kind].actionMs * sim.speedMult;
    sim.client.send("gatherStart", { nodeId: node.id, totalMs: sim.gatherTotal });
  }

  private cancelGather(sim: PlayerSim) {
    if (sim.action === "gather") sim.action = "idle";
    sim.gatherNode = null;
    sim.gatherMs = 0;
  }

  private addListing(
    id: number,
    token: string,
    sellerName: string,
    item: string,
    qty: number,
    price: number,
  ) {
    const ls = new ListingState();
    ls.id = id;
    ls.item = item;
    ls.qty = qty;
    ls.price = price;
    ls.sellerName = sellerName;
    this.state.listings.set(String(id), ls);
    this.listingOwner.set(id, token);
  }

  // ---- duels --------------------------------------------------------------------

  private inDuel(sessionId: string): boolean {
    return this.duels.some((d) => d.a === sessionId || d.b === sessionId);
  }

  /** stake both wagers and seal two fighters into the arena ring */
  private startDuel(a: PlayerSim, b: PlayerSim, wager: number) {
    // both stakes leave the ledgers up front; the pot pays out at the end
    if (wager > 0) {
      if (a.gold < wager || b.gold < wager) {
        const light = a.gold < wager ? a : b;
        for (const s of [a, b]) {
          s.client.send("duelRefused", {
            reason: light === s ? "Your purse can't cover the wager" : "Their purse can't cover the wager",
          });
        }
        return;
      }
      this.debit(a, wager);
      this.debit(b, wager);
    }
    // both fighters step into the ring, facing each other across the sand
    a.px = PIT.x - 1; a.py = PIT.y; a.path = []; a.action = "idle";
    b.px = PIT.x + 1; b.py = PIT.y; b.path = []; b.action = "idle";
    this.cancelGather(a);
    this.cancelGather(b);
    this.duels.push({
      a: a.client.sessionId,
      b: b.client.sessionId,
      wager,
      hpA: 100,
      hpB: 100,
      until: Date.now() + 90_000,
      lastHitA: 0,
      lastHitB: 0,
    });
    const nameA = this.state.players.get(a.client.sessionId)?.name ?? "?";
    const nameB = this.state.players.get(b.client.sessionId)?.name ?? "?";
    this.broadcast("duelStart", {
      a: a.client.sessionId, b: b.client.sessionId,
      nameA, nameB, wager,
    });
  }

  /** winner=null → draw (timeout) */
  private endDuel(duel: Duel, winner: string | null) {
    this.duels = this.duels.filter((d) => d !== duel);
    // settle the pot from the ledgers: winner takes all, a draw returns stakes
    if (duel.wager > 0) {
      if (winner) {
        const w = this.sims.get(winner);
        if (w) this.credit(w, duel.wager * 2);
      } else {
        for (const id of [duel.a, duel.b]) {
          const s = this.sims.get(id);
          if (s) this.credit(s, duel.wager);
        }
      }
    }
    // both fighters return to the spawn steps
    for (const id of [duel.a, duel.b]) {
      const sim = this.sims.get(id);
      if (sim) {
        const spawn = this.findSpawn();
        sim.px = spawn.x;
        sim.py = spawn.y;
        sim.path = [];
        sim.action = "idle";
      }
    }
    this.broadcast("duelEnd", {
      a: duel.a,
      b: duel.b,
      winner,
      pot: duel.wager * 2,
      winnerName: winner ? this.state.players.get(winner)?.name ?? "?" : null,
    });
  }

  // ---- the Drift wiring (re-applied after a realm reset) ---------------------------

  private wireDrift() {
    this.drift.isProtected = (x, y) =>
      townProtected(x, y) || this.claimAt(x, y) !== null;
    this.drift.preferRelocationCell = () => this.randomClaimFreeCell();
    this.drift.onRelocate = (kind) => this.broadcast("relocate", { kind });
    this.drift.onDriftfall = (cell) =>
      this.broadcast("driftfall", { x: cell.x, y: cell.y });
    this.drift.onSeason = () => {
      this.state.season += 1;
      this.erodeClaims();
      this.syncTiles();
      const pct = this.corruptionPct();
      this.state.driftPct = pct;
      this.broadcast("season", { season: this.state.season, driftPct: pct });
      this.persistRealm(); // the accumulated corruption survives empty + restart
      // a cleansed realm may face the Long Night again
      if (pct < 50) this.nightDone = false;
      if (pct >= RESET_FAILSAFE_PCT) return void this.realmReset();
      if (pct >= LONG_NIGHT_PCT && !this.nightDone && !this.state.nightActive) {
        this.startLongNight();
      }
    };
  }

  // ---- THE LONG NIGHT ----------------------------------------------------------------

  private startLongNight() {
    const defenders = Math.max(1, this.sims.size);
    this.state.nightActive = true;
    this.state.nightKills = 0;
    this.state.nightNeed = LONG_NIGHT_BASE_KILLS + (defenders - 1) * 8;
    this.nightUntil = Date.now() + LONG_NIGHT_MS;
    this.state.nightEndsIn = Math.round(LONG_NIGHT_MS / 1000);
    const level = 3 + Math.floor(this.corruptionPct() / 25);
    // the horde closes on the Waystation from three sides (shared mobs)
    const per = Math.ceil((this.state.nightNeed * 1.3) / 3);
    const { x, y } = TOWN_CENTER;
    this.spawnEventRaiders(x - 6, y, per, level, "night");
    this.spawnEventRaiders(x + 6, y, per, level, "night");
    this.spawnEventRaiders(x, y + 7, per, level, "night");
    this.broadcast("longNight", {
      durationMs: LONG_NIGHT_MS,
      need: this.state.nightNeed,
      level,
    });
  }

  private stepNight() {
    if (!this.state.nightActive) return;
    const leftS = Math.max(0, Math.round((this.nightUntil - Date.now()) / 1000));
    if (leftS !== this.state.nightEndsIn) this.state.nightEndsIn = leftS;
    if (leftS > 0) return;

    const survived = this.state.nightKills >= this.state.nightNeed;
    this.state.nightActive = false;
    this.clearEventMobs("night");
    if (survived) {
      this.nightDone = true;
      this.dawnCleanse();
      this.broadcast("nightEnd", { survived: true, driftPct: this.state.driftPct });
      for (const sim of this.sims.values()) {
        this.credit(sim, LONG_NIGHT_REWARD);
        sim.client.send("nightReward", { gold: LONG_NIGHT_REWARD });
      }
    } else {
      this.broadcast("nightEnd", { survived: false, driftPct: this.state.driftPct });
      void this.realmReset();
    }
  }

  /** dawn burns outward from the Waystation until the realm breathes again */
  private dawnCleanse() {
    const corrupt: { x: number; y: number; d: number }[] = [];
    let land = 0;
    for (let y = 0; y < this.world.h; y++) {
      for (let x = 0; x < this.world.w; x++) {
        const t = this.world.tile(x, y);
        if (t === "water") continue;
        land++;
        if (t === "corrupt") {
          corrupt.push({ x, y, d: Math.hypot(x - TOWN_CENTER.x, y - TOWN_CENTER.y) });
        }
      }
    }
    corrupt.sort((a, b) => a.d - b.d);
    let remaining = corrupt.length;
    for (const c of corrupt) {
      if ((remaining / Math.max(1, land)) * 100 <= DAWN_TARGET_PCT) break;
      this.world.setTile(c.x, c.y, "grass");
      remaining--;
    }
    this.syncTiles();
    this.state.driftPct = this.corruptionPct();
    this.persistRealm(); // dawn rolled the corruption back — save the cleansed world
  }

  /** the Drift takes the realm: fresh world, season 1; banked/cosmetic/wallet persist */
  private async realmReset() {
    this.state.nightActive = false;
    // claims and their furnishings fall with the old realm
    for (const [key, cs] of [...this.state.claims.entries()]) {
      this.state.claims.delete(key);
      this.claimOwner.delete(cs.id);
      void deleteClaim(cs.id).catch(() => {});
      void deletePropsForClaim(cs.id).catch(() => {});
    }
    for (const key of [...this.state.props.keys()]) this.state.props.delete(key);
    this.propOwner.clear();

    // a fresh realm under a fresh Drift
    this.world = new World(40, 40);
    this.drift = new Drift(SEASON_MS);
    this.wireDrift();
    this.state.season = 1;
    this.state.driftPct = 0;
    this.nightDone = false;
    this.syncTiles();
    this.state.nodes.clear();
    for (const node of this.world.nodes) {
      const ns = new NodeState();
      ns.id = node.id;
      ns.kind = node.kind;
      ns.gx = node.gx;
      ns.gy = node.gy;
      ns.amount = node.amount;
      ns.alive = true;
      this.state.nodes.set(String(node.id), ns);
    }
    this.resetCaravan();
    this.resetMobs();

    // everyone wakes at the spawn of the new realm
    for (const sim of this.sims.values()) {
      const spawn = this.findSpawn();
      sim.px = spawn.x;
      sim.py = spawn.y;
      sim.path = [];
      sim.pendingNode = null;
      this.cancelGather(sim);
      sim.action = "idle";
    }
    this.broadcast("realmReset", { season: this.state.season });
    this.persistRealm(); // the fresh (uncorrupted) realm is the new saved truth
  }

  // ---- Phase 6 hardening: the rate limiter -----------------------------------------

  /**
   * Per-session token bucket: at most `n` messages of `key` per `windowMs`.
   * Budgets are generous for honest clients and verify suites; a flood gets
   * silently dropped (no response — spammers don't deserve feedback).
   */
  private allow(sim: PlayerSim, key: string, n: number, windowMs: number): boolean {
    const now = Date.now();
    let r = sim.rates.get(key);
    if (!r || now > r.resetAt) {
      r = { n: 0, resetAt: now + windowMs };
      sim.rates.set(key, r);
    }
    if (r.n >= n) return false;
    r.n += 1;
    return true;
  }

  // ---- Phase 6: the gold ledger ----------------------------------------------------

  /** push the authoritative balance to its owner (display copy adopts it) */
  private syncGold(sim: PlayerSim) {
    sim.client.send("goldSync", { gold: Math.round(sim.gold) });
  }

  /** mutate the ledger, persist write-through, and sync the owner's display */
  private credit(sim: PlayerSim, amount: number) {
    sim.gold = Math.max(0, sim.gold + amount);
    sim.goldSeeded = true; // a live ledger never gets re-seeded by a snapshot
    void persistGold(sim.token, sim.gold).catch(() => {});
    this.syncGold(sim);
  }

  /** spend from the ledger; false (and no sync) when the purse is too light */
  private debit(sim: PlayerSim, amount: number): boolean {
    if (amount > 0 && sim.gold < amount) return false;
    this.credit(sim, -amount);
    return true;
  }

  // ---- the inventory ledger ---------------------------------------------------

  /** push the authoritative item counts to their owner */
  private syncInv(sim: PlayerSim) {
    sim.client.send("invSync", { inv: sim.inv });
  }

  /** mutate one item count (clamped at 0), persist, and sync the owner */
  private creditItem(sim: PlayerSim, item: ItemKey, qty: number) {
    sim.inv[item] = Math.max(0, (sim.inv[item] ?? 0) + qty);
    sim.invSeeded = true;
    void persistInv(sim.token, sim.inv).catch(() => {});
    this.syncInv(sim);
  }

  /** take items off the ledger; false (and no change) if any are missing */
  private debitItems(sim: PlayerSim, costs: [ItemKey, number][]): boolean {
    for (const [item, qty] of costs) {
      if ((sim.inv[item] ?? 0) < qty) return false;
    }
    for (const [item, qty] of costs) {
      sim.inv[item] = (sim.inv[item] ?? 0) - qty;
    }
    sim.invSeeded = true;
    void persistInv(sim.token, sim.inv).catch(() => {});
    this.syncInv(sim);
    return true;
  }

  // ---- the quest ledger -------------------------------------------------------

  /** push the authoritative quest board to its owner */
  private syncQuests(sim: PlayerSim) {
    sim.client.send("questSync", { day: sim.quests.day, quests: sim.quests.list });
  }

  /** re-roll the board for the current day if the stored one is stale; returns
   *  true if it changed (caller may want to sync) */
  private ensureFreshQuests(sim: PlayerSim): boolean {
    const day = serverDay();
    if (sim.quests.day === day) return false;
    sim.quests = freshQuestBoard(day);
    void persistQuests(sim.token, sim.quests).catch(() => {});
    return true;
  }

  /** feed a server-adjudicated event through the shared matchers; sync on change */
  private advanceQuests(sim: PlayerSim, e: QuestEvent) {
    if (this.ensureFreshQuests(sim)) this.syncQuests(sim);
    let changed = false;
    for (const q of sim.quests.list) {
      if (q.claimed) continue;
      const def = QUEST_POOL.find((d) => d.id === q.id);
      if (!def || q.progress >= def.target) continue;
      const inc = def.matches(e);
      if (inc > 0) {
        q.progress = Math.min(def.target, q.progress + inc);
        changed = true;
      }
    }
    if (changed) {
      void persistQuests(sim.token, sim.quests).catch(() => {});
      this.syncQuests(sim);
    }
  }

  /** Bind the gate-proven wallet to this player's row without a second signature.
   *  The entry gate already verified an ed25519 proof of ownership over `address`
   *  (the same rail as the in-game link), so this is cryptographically equivalent
   *  to linking. Respects a deliberate in-game link to a DIFFERENT wallet and the
   *  global wallet-uniqueness rule (never hijacks a wallet another token owns). */
  private async autoLinkGateWallet(sim: PlayerSim, gateAddress: string, currentWallet: string | null) {
    // already linked to a different wallet on purpose — leave it alone
    if (currentWallet && currentWallet !== gateAddress) return;
    if (!currentWallet) {
      // binding fresh: make sure no other wanderer already owns this wallet
      const existing = await findPlayerByWallet(gateAddress).catch(() => null);
      if (existing && existing.token !== sim.token) return;
      await setWalletAddress(sim.token, gateAddress).catch(() => {});
    }
    const tokenBalance = await getTokenBalance(gateAddress);
    sim.tokenBalance = tokenBalance; // holder-tier perks follow the link
    sim.client.send("walletResult", {
      ok: true,
      address: gateAddress,
      tokenBalance,
      holder: tokenBalance >= 1,
      mint: tokenMint() || null,
    });
  }

  /** replace the board with a fresh roll (Obelisk reroll); progress reset */
  private rerollQuestsFor(sim: PlayerSim) {
    // a reroll should actually change the board, so roll off a random seed
    // rather than the deterministic day index
    const day = serverDay();
    sim.quests = {
      day,
      list: rollDailyQuestIds((Math.random() * 2147483648) | 0).map((id) => ({
        id, progress: 0, claimed: false,
      })),
    };
    void persistQuests(sim.token, sim.quests).catch(() => {});
    this.syncQuests(sim);
  }

  // ---- Phase 5: burns ------------------------------------------------------------

  /** validate + spend a burn signature exactly once; null = ok, else reason */
  private async consumeBurn(
    sim: PlayerSim,
    burnSig: string,
    action: string,
  ): Promise<string | null> {
    // a Solana tx signature is 64 bytes → 86-88 base58 chars
    if (!/^[1-9A-HJ-NP-Za-km-z]{86,90}$/.test(burnSig)) return "Malformed burn signature";
    const row = await loadOrCreatePlayer(sim.token);
    if (!row.walletAddress) return "No wallet linked";
    // an action missing from BURN_COSTS is a wiring bug — refuse rather than
    // silently price it at a near-free default
    const cost = BURN_COSTS[action];
    if (cost === undefined) return "That rite is not priced";
    const split = burnSplit(cost); // 50/50 with TREASURY_ADDRESS set, else 100% burn
    // insert-first so a signature can never be spent twice, even concurrently
    if (!(await tryInsertBurn(burnSig, sim.token, action, split.burn, split.treasury))) {
      return "That burn was already spent";
    }
    const v = await verifyBurn(burnSig, row.walletAddress, cost);
    if (!v.ok) {
      await deleteBurn(burnSig).catch(() => {}); // free it for a retry
      return v.reason ?? "The burn could not be verified";
    }
    void this.markFounder(sim, row);
    // the wallet just spent `cost` DRIFTS on-chain. Reflect it in the live
    // in-realm balance (and holder-tier perks) immediately — re-reading the
    // chain here would return the 60s-cached pre-burn number.
    sim.tokenBalance = Math.max(0, sim.tokenBalance - cost);
    this.syncToken(sim);
    return null;
  }

  /** push the live DRIFTS balance + holder flag to the wallet's owner */
  private syncToken(sim: PlayerSim) {
    sim.client.send("tokenSync", {
      tokenBalance: sim.tokenBalance,
      holder: sim.tokenBalance >= 1,
    });
  }

  /** one Drift Wheel roll: server-rolled prize, duplicates pay shards, pity
   *  forces a rare at DRIFT_WHEEL_PITY dry spins. Shards land on the ledger;
   *  cosmetic grants ride the result message (the client applies them — gold
   *  cosmetics are client-trusted; prestige ownership is recorded HERE). */
  private rollDriftWheel(sim: PlayerSim): {
    kind: DriftWheelSeg["kind"]; key?: string; shards?: number; dup?: boolean;
    label: string; rare?: boolean; seg: number;
  } {
    const forced = sim.wheelPity >= DRIFT_WHEEL_PITY;
    const pool = forced ? DRIFT_WHEEL.filter((s) => s.rare) : DRIFT_WHEEL;
    const total = pool.reduce((a, s) => a + s.p, 0);
    let r = Math.random() * total;
    let seg = pool[pool.length - 1];
    for (const s of pool) { r -= s.p; if (r <= 0) { seg = s; break; } }
    sim.wheelPity = seg.rare ? 0 : sim.wheelPity + 1;
    const segIndex = DRIFT_WHEEL.indexOf(seg); // where the HUD wheel lands

    const grantShards = (n: number) => this.creditItem(sim, "driftshard", n);
    if (seg.kind === "shards") {
      grantShards(seg.amount ?? 1);
      return { kind: seg.kind, shards: seg.amount, label: seg.label, seg: segIndex };
    }

    // what the player already owns (gold cosmetics live in the snapshot)
    const snap = (sim.profileSnapshot ?? {}) as {
      ownedDyes?: string[]; ownedEyes?: string[]; ownedAuras?: string[]; ownedPets?: string[];
    };
    const POOLS: Record<string, { all: string[]; owned: Set<string> }> = {
      dye: { all: ["ember", "moss", "blood", "gold", "bone", "water", "void"],
             owned: new Set(["stone", ...(snap.ownedDyes ?? [])]) },
      eye: { all: ["ember", "blood", "gold", "water"],
             owned: new Set(["drift", ...(snap.ownedEyes ?? [])]) },
      aura: { all: ["driftmote", "emberwake", "goldhalo"],
              owned: new Set(snap.ownedAuras ?? []) },
      pet: { all: ["wisp", "crow", "emberling"],
             owned: new Set(snap.ownedPets ?? []) },
    };

    if (seg.kind === "title") {
      if (sim.prestige.has("wheelturned")) {
        grantShards(seg.dupShards ?? 1);
        return { kind: seg.kind, dup: true, shards: seg.dupShards, label: seg.label, rare: true, seg: segIndex };
      }
      sim.prestige.add("wheelturned"); // tracking only: titles are soul-bound
      void setPrestige(sim.token, [...sim.prestige]).catch(() => {});
      return { kind: seg.kind, key: WHEEL_TITLE, label: seg.label, rare: true, seg: segIndex };
    }

    if (seg.kind === "prestigeAura") {
      const open = [...PRESTIGE_AURA_KEYS].filter((k) => !sim.prestige.has(k));
      if (open.length === 0) {
        grantShards(seg.dupShards ?? 1);
        return { kind: seg.kind, dup: true, shards: seg.dupShards, label: seg.label, rare: true, seg: segIndex };
      }
      const key = open[(Math.random() * open.length) | 0];
      sim.prestige.add(key); // server-authoritative: the identity sync accepts it now
      void setPrestige(sim.token, [...sim.prestige]).catch(() => {});
      return { kind: seg.kind, key, label: seg.label, rare: true, seg: segIndex };
    }

    const p = POOLS[seg.kind];
    const open = p.all.filter((k) => !p.owned.has(k));
    if (open.length === 0) {
      grantShards(seg.dupShards ?? 1);
      return { kind: seg.kind, dup: true, shards: seg.dupShards, label: seg.label, rare: seg.rare, seg: segIndex };
    }
    const key = open[(Math.random() * open.length) | 0];
    return { kind: seg.kind, key, label: seg.label, rare: seg.rare, seg: segIndex };
  }

  /** Founder window: the FIRST verified burn before FOUNDER_UNTIL marks the
   *  player for the one-time beta cosmetics; never grantable again after. */
  private async markFounder(sim: PlayerSim, row: PlayerRow) {
    if (!FOUNDER_UNTIL || Date.now() >= FOUNDER_UNTIL || row.founder) return;
    await setFounder(sim.token).catch(() => {});
    // the Founder's Ashen Crown is a prestige aura — grant ownership so the
    // identity sync accepts it from them
    if (!sim.prestige.has("ashen_crown")) {
      sim.prestige.add("ashen_crown");
      void setPrestige(sim.token, [...sim.prestige]).catch(() => {});
    }
    for (const c of this.clients) {
      if (this.sims.get(c.sessionId) === sim) { c.send("founder", {}); break; }
    }
  }

  // ---- shared mobs ------------------------------------------------------------------

  private spawnAmbientMobs() {
    let placed = 0;
    let guard = 0;
    while (placed < MOB_AMBIENT_COUNT && guard++ < 2000) {
      const x = (Math.random() * this.world.w) | 0;
      const y = (Math.random() * this.world.h) | 0;
      if (!this.world.isWalkable(x, y)) continue;
      if (Math.max(Math.abs(x - TOWN_CENTER.x), Math.abs(y - TOWN_CENTER.y)) < 6) continue;
      const level = 1 + ((Math.random() * 3) | 0);
      this.mobSims.push(new ServerMob(this.nextMobId++, x, y, level));
      placed++;
    }
  }

  /** the Husk Den's elite pack: holds its ground, stays dead until the reseed */
  private spawnDenPack() {
    const den = WILD_STRUCTURES.find((s) => s.key === "huskden");
    if (!den) return;
    this.mobSims = this.mobSims.filter((m) => !this.denIds.includes(m.id));
    for (const id of this.denIds) this.state.mobs.delete(String(id));
    this.denIds = [];
    this.denClearedAt = 0;
    let guard = 0;
    while (this.denIds.length < DEN_PACK_SIZE && guard++ < 300) {
      const dx = ((Math.random() * 9) | 0) - 4;
      const dy = ((Math.random() * 9) | 0) - 4;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
      const cx = den.x + dx;
      const cy = den.y + dy;
      if (!this.world.isWalkable(cx, cy)) continue;
      const elite = new ServerMob(this.nextMobId++, cx, cy, DEN_PACK_LEVEL, "husk");
      elite.persistDeath = true;
      this.mobSims.push(elite);
      this.denIds.push(elite.id);
    }
  }

  /** all shared beasts fall with the old realm; fresh ones rise with the new */
  private resetMobs() {
    this.mobSims = [];
    this.denIds = [];
    this.denClearedAt = 0;
    this.bossThresholds = [...BOSS_PCTS];
    this.state.mobs.clear();
    this.spawnAmbientMobs();
    this.spawnDenPack();
  }

  /** raider pack for an event (caravan ambush / Long Night), around a point */
  private spawnEventRaiders(
    x: number,
    y: number,
    count: number,
    level: number,
    tag: "ambush" | "night",
  ) {
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < 400) {
      const dx = ((Math.random() * 9) | 0) - 4;
      const dy = ((Math.random() * 9) | 0) - 4;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
      const cx = x + dx;
      const cy = y + dy;
      if (!this.world.isWalkable(cx, cy)) continue;
      const raider = new ServerMob(this.nextMobId++, cx, cy, level, "raider");
      raider.eventTag = tag;
      this.mobSims.push(raider);
      placed++;
    }
  }

  /** an event ends: its surviving raiders crumble (clients see the death anim) */
  private clearEventMobs(tag: "ambush" | "night") {
    for (const mob of this.mobSims) {
      if (mob.eventTag === tag && mob.state !== "dead") mob.die();
    }
  }

  /** corruption thresholds wake a shared Colossus at the corruption front */
  private watchBoss() {
    if (this.bossThresholds.length === 0) return;
    if (this.state.driftPct < this.bossThresholds[0]) return;
    if (this.mobSims.some((m) => m.kind === "colossus" && m.state !== "dead")) return;
    // anchor on a corrupt tile; a clean map (env-forced threshold) falls back
    // to any walkable ground away from town
    let cell: Cell | null = null;
    for (let i = 0; i < this.world.tiles.length; i++) {
      if (this.world.tiles[i] === "corrupt" && Math.random() < 0.05) {
        cell = { x: i % this.world.w, y: (i / this.world.w) | 0 };
        break;
      }
    }
    for (let guard = 0; !cell && guard < 200; guard++) {
      const x = (Math.random() * this.world.w) | 0;
      const y = (Math.random() * this.world.h) | 0;
      if (this.world.isWalkable(x, y) &&
          Math.max(Math.abs(x - TOWN_CENTER.x), Math.abs(y - TOWN_CENTER.y)) >= 10) {
        cell = { x, y };
      }
    }
    if (!cell) return;
    // nudge onto walkable ground (corrupt tiles are walkable, but be safe)
    if (!this.world.isWalkable(cell.x, cell.y)) {
      outer: for (let r = 1; r < 6; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (this.world.isWalkable(cell.x + dx, cell.y + dy)) {
              cell = { x: cell.x + dx, y: cell.y + dy };
              break outer;
            }
          }
        }
      }
    }
    if (!this.world.isWalkable(cell.x, cell.y)) return;
    this.bossThresholds.shift();
    const boss = new ServerMob(this.nextMobId++, cell.x, cell.y, 6, "colossus");
    boss.maxHp = boss.hp = 140;
    boss.damage = 7;
    boss.xp = 120;
    boss.speed = 0.45; // a walking ruin does not hurry
    this.mobSims.push(boss);
    this.broadcast("colossus", { x: cell.x, y: cell.y });
  }

  private stepMobs(dt: number) {
    const now = Date.now();
    for (const mob of this.mobSims) {
      // engagement upkeep: the engager must stay adjacent and keep swinging
      if (mob.state === "engaged") {
        const sim = mob.engagedBy ? this.sims.get(mob.engagedBy) : null;
        if (
          !sim ||
          now - mob.lastEngagedAt > ENGAGE_TIMEOUT_MS ||
          chebyshev(this.cellOf(sim), mob.cell) > 1
        ) {
          mob.engagedBy = null;
          mob.state = "wander";
        } else {
          mob.retaliateIn -= dt * 1000;
          if (mob.retaliateIn <= 0) {
            mob.retaliateIn += MOB_ATTACK_MS;
            // raw damage; the client applies its ward reduction (gear is
            // client-trusted until server equipment lands)
            sim.client.send("mobHit", {
              id: mob.id,
              dmg: mob.damage + ((Math.random() * 3) | 0),
            });
          }
        }
      }
      mob.update(dt, this.world);
    }

    // the den re-seeds a while after the last elite falls
    if (this.denIds.length) {
      const alive = this.mobSims.some(
        (m) => this.denIds.includes(m.id) && m.state !== "dead",
      );
      if (!alive && this.denClearedAt === 0) this.denClearedAt = now;
      if (!alive && now - this.denClearedAt > DEN_RESEED_MS) this.spawnDenPack();
    }

    // fallen raiders/colossi leave the realm once their death anim has played
    const pruned = this.mobSims.filter((m) => m.pruneAt > 0 && now > m.pruneAt);
    if (pruned.length) {
      this.mobSims = this.mobSims.filter((m) => !pruned.includes(m));
      for (const m of pruned) this.state.mobs.delete(String(m.id));
    }

    this.watchBoss();
    this.syncMobs();
  }

  private syncMobs() {
    for (const mob of this.mobSims) {
      let ms = this.state.mobs.get(String(mob.id));
      if (!ms) {
        ms = new MobState();
        ms.id = mob.id;
        ms.kind = mob.kind;
        this.state.mobs.set(String(mob.id), ms);
      }
      if (ms.level !== mob.level) ms.level = mob.level;
      if (ms.x !== mob.px) ms.x = mob.px;
      if (ms.y !== mob.py) ms.y = mob.py;
      if (ms.hp !== mob.hp) ms.hp = mob.hp;
      if (ms.maxHp !== mob.maxHp) ms.maxHp = mob.maxHp;
      if (ms.state !== mob.state) ms.state = mob.state;
      if (ms.moving !== mob.moving) ms.moving = mob.moving;
    }
  }

  // ---- Caravans ---------------------------------------------------------------------

  private stepCaravan(dt: number) {
    const c = this.state.caravan;

    if (c.phase === "idle") {
      c.departIn = Math.max(0, c.departIn - dt);
      if (c.departIn <= 0) this.departCaravan();
      return;
    }

    if (c.phase === "ambushed") {
      // raiders gnaw at the wagon until the escorts clear the wave
      c.hp = Math.max(0, c.hp - CARAVAN_GNAW_DPS * dt);
      if (c.hp <= 0) {
        this.broadcast("caravanLost", { run: c.run, x: c.x, y: c.y });
        this.resetCaravan();
      }
      return;
    }

    // rolling: walk the route at wagon pace
    if (!this.caravanPath.length) return void this.arriveCaravan();
    const next = this.caravanPath[0];
    const dx = next.x - c.x;
    const dy = next.y - c.y;
    const dist = Math.hypot(dx, dy);
    const step = CARAVAN_SPEED * dt;
    if (dist <= step) {
      c.x = next.x;
      c.y = next.y;
      this.caravanPath.shift();
      if (!this.caravanPath.length) return void this.arriveCaravan();
    } else {
      c.x += (dx / dist) * step;
      c.y += (dy / dist) * step;
    }
    // raider ambushes trigger at fixed route-progress marks
    const progress = 1 - this.caravanPath.length / Math.max(1, this.caravanTotal);
    if (this.caravanThresholds.length && progress >= this.caravanThresholds[0]) {
      this.caravanThresholds.shift();
      this.startAmbush();
    }
  }

  private departCaravan() {
    const c = this.state.caravan;
    const origin = this.findSpawn();
    const gate = this.findGate(origin);
    if (!gate) {
      // no routable gate (heavy corruption); try again shortly
      c.departIn = 60;
      return;
    }
    const tier = Math.floor(this.corruptionPct() / 20); // 0..5 risk tier
    c.run += 1;
    c.phase = "rolling";
    c.x = origin.x;
    c.y = origin.y;
    c.maxHp = CARAVAN_HP;
    c.hp = CARAVAN_HP;
    c.gateX = gate.cell.x;
    c.gateY = gate.cell.y;
    c.wave = 0;
    c.waves = Math.min(4, 2 + tier);
    c.waveKills = 0;
    c.waveNeed = 0;
    this.caravanTotal = gate.path.length;
    this.caravanPath = gate.path;
    this.caravanContrib.clear();
    // waves spaced evenly along the route
    this.caravanThresholds = Array.from(
      { length: c.waves },
      (_, i) => (i + 1) / (c.waves + 1),
    );
    this.broadcast("caravanDepart", {
      run: c.run, gateX: c.gateX, gateY: c.gateY, waves: c.waves,
    });
  }

  /** a walkable map-edge cell with a real route from the origin */
  private findGate(origin: Cell): { cell: Cell; path: Cell[] } | null {
    for (let i = 0; i < 60; i++) {
      const side = (Math.random() * 4) | 0;
      const cell: Cell =
        side === 0 ? { x: 0, y: (Math.random() * this.world.h) | 0 } :
        side === 1 ? { x: this.world.w - 1, y: (Math.random() * this.world.h) | 0 } :
        side === 2 ? { x: (Math.random() * this.world.w) | 0, y: 0 } :
                     { x: (Math.random() * this.world.w) | 0, y: this.world.h - 1 };
      if (!this.world.isWalkable(cell.x, cell.y)) continue;
      const path = findPath(this.world, origin, cell);
      if (path && path.length >= CARAVAN_MIN_ROUTE) return { cell, path };
    }
    return null;
  }

  private startAmbush() {
    const c = this.state.caravan;
    const tier = Math.floor(this.corruptionPct() / 20);
    c.phase = "ambushed";
    c.wave += 1;
    c.waveKills = 0;
    c.waveNeed = 3 + (c.wave - 1) * 2 + tier;
    // the raiders are real now: exactly waveNeed shared mobs around the wagon
    this.spawnEventRaiders(Math.round(c.x), Math.round(c.y), c.waveNeed, 2 + tier, "ambush");
    this.broadcast("ambush", {
      run: c.run,
      x: Math.round(c.x),
      y: Math.round(c.y),
      wave: c.wave,
      waves: c.waves,
      count: c.waveNeed,
      level: 2 + tier,
    });
  }

  /** the wagon reaches the gate: split the pool pro-rata by kills */
  private async arriveCaravan() {
    const c = this.state.caravan;
    const pool = Math.round(CARAVAN_BASE_POOL + this.corruptionPct() * 3);
    // shares are kill-weighted by holder tier (zero inflation: weights split
    // the same pool, they don't grow it)
    const totalShare = [...this.caravanContrib.values()]
      .reduce((n, e) => n + e.kills * e.weight, 0);
    const payouts: { name: string; kills: number; gold: number }[] = [];
    for (const [token, e] of this.caravanContrib) {
      const gold = totalShare > 0
        ? Math.max(10, Math.round(((e.kills * e.weight) / totalShare) * pool))
        : 0;
      payouts.push({ name: e.name, kills: e.kills, gold });
      // online escorts get paid into the ledger; offline ones through escrow
      const sim = [...this.sims.values()].find((s) => s.token === token);
      if (sim) {
        if (gold > 0) this.credit(sim, gold);
        sim.client.send("caravanPayout", { run: c.run, gold, kills: e.kills });
      } else if (gold > 0) await addEscrow(token, gold).catch(() => {});
    }
    this.broadcast("caravanArrived", { run: c.run, pool, payouts });
    this.resetCaravan();
  }

  private resetCaravan() {
    this.clearEventMobs("ambush");
    const c = this.state.caravan;
    c.phase = "idle";
    c.departIn = CARAVAN_PERIOD_S;
    c.hp = 0;
    c.maxHp = 0;
    c.wave = 0;
    c.waves = 0;
    c.waveKills = 0;
    c.waveNeed = 0;
    c.gateX = -1;
    c.gateY = -1;
    this.caravanPath = [];
    this.caravanTotal = 0;
    this.caravanThresholds = [];
    this.caravanContrib.clear();
  }

  // ---- the Shrine -----------------------------------------------------------------

  private shrineGoal(): number {
    return Math.max(400, 400 + this.corruptionPct() * 30);
  }

  /** the Pale Flame fires: purge the corrupt tiles nearest the shrine */
  private cleanse() {
    const shrineXY = { x: 17, y: 13 };
    const corrupt: { x: number; y: number; d: number }[] = [];
    for (let y = 0; y < this.world.h; y++) {
      for (let x = 0; x < this.world.w; x++) {
        if (this.world.tile(x, y) === "corrupt") {
          corrupt.push({ x, y, d: Math.hypot(x - shrineXY.x, y - shrineXY.y) });
        }
      }
    }
    corrupt.sort((p, q) => p.d - q.d);
    const count = Math.min(corrupt.length, 20 + Math.round(this.corruptionPct()));
    for (let i = 0; i < count; i++) {
      this.world.setTile(corrupt[i].x, corrupt[i].y, "grass");
    }
    this.state.shrinePot = Math.max(0, this.state.shrinePot - this.state.shrineGoal);
    this.state.shrineGoal = this.shrineGoal();
    this.syncTiles();
    this.state.driftPct = this.corruptionPct();
    this.broadcast("cleansing", { count, driftPct: this.state.driftPct });
  }

  // ---- land claims ----------------------------------------------------------------

  private addClaim(
    id: number,
    token: string,
    x: number,
    y: number,
    integrity: number,
    ownerName: string,
  ) {
    const cs = new ClaimState();
    cs.id = id;
    cs.x = x;
    cs.y = y;
    cs.integrity = integrity;
    cs.ownerName = ownerName;
    this.state.claims.set(String(id), cs);
    this.claimOwner.set(id, token);
  }

  /** mirror a guild row into the synced schema map */
  private syncGuildState(id: number) {
    const row = this.guildRows.get(id);
    if (!row) { this.state.guilds.delete(String(id)); return; }
    let gs = this.state.guilds.get(String(id));
    if (!gs) {
      gs = new GuildState();
      gs.id = id;
      this.state.guilds.set(String(id), gs);
    }
    gs.name = row.name;
    gs.tag = row.tag;
    gs.members = this.guildCounts.get(id) ?? 0;
    gs.region = row.region;
    gs.regionSecsLeft = row.region ? Math.max(0, Math.round((row.regionUntil - Date.now()) / 1000)) : 0;
  }

  /** the guild whose banner currently stands over a region (if any) */
  private regionHolder(region: string): GuildRow | null {
    const now = Date.now();
    for (const row of this.guildRows.values()) {
      if (row.region === region && row.regionUntil > now) return row;
    }
    return null;
  }

  /** guild-territory perk check: is this sim inside its guild's held region? */
  private inGuildRegion(sim: PlayerSim): boolean {
    if (!sim.guildId) return false;
    const row = this.guildRows.get(sim.guildId);
    if (!row?.region || row.regionUntil <= Date.now()) return false;
    return regionAt(this.world.w, this.world.h, Math.round(sim.px), Math.round(sim.py)) === row.region;
  }

  /** does this sim's guild hold ANY standing banner? (caravan weight perk) */
  private guildBannerStands(sim: PlayerSim): boolean {
    if (!sim.guildId) return false;
    const row = this.guildRows.get(sim.guildId);
    return !!row?.region && row.regionUntil > Date.now();
  }

  private addRelic(id: number, token: string, wallet: string, sellerName: string, key: string, price: number) {
    const rs = new RelicState();
    rs.id = id;
    rs.key = key;
    rs.price = price;
    rs.sellerName = sellerName;
    this.state.relics.set(String(id), rs);
    this.relicOwner.set(id, { token, wallet, key, price });
  }

  private claimAt(x: number, y: number): ClaimState | null {
    for (const cs of this.state.claims.values()) {
      if (Math.abs(cs.x - x) <= 1 && Math.abs(cs.y - y) <= 1) return cs;
    }
    return null;
  }

  /** a free grass/dirt cell inside a random claim, for node relocation bias */
  private randomClaimFreeCell(): Cell | null {
    const all = [...this.state.claims.values()];
    if (all.length === 0) return null;
    const cs = all[(Math.random() * all.length) | 0];
    const free: Cell[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cs.x + dx;
        const y = cs.y + dy;
        if (!this.world.inBounds(x, y)) continue;
        const t = this.world.tile(x, y);
        if ((t === "grass" || t === "dirt") && !this.world.getNode(x, y)) {
          free.push({ x, y });
        }
      }
    }
    return free.length ? free[(Math.random() * free.length) | 0] : null;
  }

  /** seasons grind claims down; corruption at the fence grinds faster */
  private erodeClaims() {
    for (const [key, cs] of [...this.state.claims.entries()]) {
      const siege = this.claimBesieged(cs);
      cs.integrity -= siege ? CLAIM_SIEGE_EROSION : CLAIM_EROSION;
      if (cs.integrity > 0) {
        void setClaimIntegrity(cs.id, cs.integrity).catch(() => {});
        continue;
      }
      // the warding breaks — the land falls to the Drift at once
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = cs.x + dx;
          const y = cs.y + dy;
          if (!this.world.inBounds(x, y)) continue;
          const t = this.world.tile(x, y);
          if (t === "grass" || t === "dirt") this.world.setTile(x, y, "corrupt");
        }
      }
      this.state.claims.delete(key);
      this.claimOwner.delete(cs.id);
      void deleteClaim(cs.id).catch(() => {});
      // its furnishings fall with it
      for (const [pkey, prop] of [...this.state.props.entries()]) {
        if (Math.abs(prop.x - cs.x) <= 1 && Math.abs(prop.y - cs.y) <= 1) {
          this.state.props.delete(pkey);
          this.propOwner.delete(prop.id);
        }
      }
      void deletePropsForClaim(cs.id).catch(() => {});
      this.broadcast("claimFallen", { id: cs.id, x: cs.x, y: cs.y, name: cs.ownerName });
    }
  }

  /** corruption orthogonally touching the claim's outer ring */
  private claimBesieged(cs: ClaimState): boolean {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== 2) continue;
        const x = cs.x + dx;
        const y = cs.y + dy;
        if (this.world.inBounds(x, y) && this.world.tile(x, y) === "corrupt") return true;
      }
    }
    return false;
  }

  // ---- schema sync helpers -----------------------------------------------------

  private syncNodes() {
    for (const node of this.world.nodes) {
      let ns = this.state.nodes.get(String(node.id));
      if (!ns) {
        // driftfall spawns new nodes mid-game — mirror them into the schema
        ns = new NodeState();
        ns.id = node.id;
        ns.kind = node.kind;
        this.state.nodes.set(String(node.id), ns);
      }
      const alive = node.regrowIn <= 0 && node.amount > 0;
      if (ns.gx !== node.gx) ns.gx = node.gx;
      if (ns.gy !== node.gy) ns.gy = node.gy;
      if (ns.amount !== node.amount) ns.amount = node.amount;
      if (ns.alive !== alive) ns.alive = alive;
    }
  }

  private syncTiles() {
    for (let i = 0; i < this.world.tiles.length; i++) {
      const code = tileToCode(this.world.tiles[i]);
      if (this.state.tiles[i] !== code) this.state.tiles[i] = code;
    }
  }

  private corruptionPct(): number {
    let corrupt = 0;
    let land = 0;
    for (const t of this.world.tiles) {
      if (t === "water") continue;
      land++;
      if (t === "corrupt") corrupt++;
    }
    return land > 0 ? Math.round((corrupt / land) * 100) : 0;
  }

  /** persist the living world (corrupt tile indices + season) so it survives an
   *  empty room and a server restart. Fire-and-forget; failures never block. */
  private persistRealm() {
    const corrupt: number[] = [];
    for (let i = 0; i < this.world.tiles.length; i++) {
      if (this.world.tiles[i] === "corrupt") corrupt.push(i);
    }
    void saveRealm({
      season: this.state.season,
      driftPct: this.state.driftPct,
      corrupt,
    }).catch(() => {});
  }

  // ---- misc --------------------------------------------------------------------

  private cellOf(sim: PlayerSim): Cell {
    return { x: Math.round(sim.px), y: Math.round(sim.py) };
  }

  /** walkable cell near the map centre, fanning outward so players don't stack */
  private findSpawn(): Cell {
    const cx = Math.floor(this.world.w / 2);
    const cy = Math.floor(this.world.h / 2);
    for (let r = 0; r < 8; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = cx + dx;
          const y = cy + dy;
          if (this.world.isWalkable(x, y) && !this.spawnTaken(x, y)) {
            return { x, y };
          }
        }
      }
    }
    return { x: cx, y: cy };
  }

  private spawnTaken(x: number, y: number): boolean {
    for (const sim of this.sims.values()) {
      if (Math.round(sim.px) === x && Math.round(sim.py) === y) return true;
    }
    return false;
  }
}

function chebyshev(a: Cell, b: Cell) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/** combat level out of an untrusted snapshot blob (1..60, default 1) */
function snapCombatLevel(snapshot: unknown): number {
  const lvl = Number(
    (snapshot as { skills?: { combat?: { level?: unknown } } } | null)
      ?.skills?.combat?.level ?? 1,
  );
  return Number.isFinite(lvl) ? Math.min(60, Math.max(1, Math.round(lvl))) : 1;
}

/** coerce an untrusted blob into clean item counts (known keys, ints ≥ 0) */
function sanitizeInv(raw: unknown): Record<ItemKey, number> {
  const src = (raw ?? {}) as Record<string, unknown>;
  const out = {} as Record<ItemKey, number>;
  for (const k of INVENTORY_ORDER) {
    const v = Number(src[k] ?? 0);
    out[k] = Number.isFinite(v) ? Math.min(999_999, Math.max(0, Math.round(v))) : 0;
  }
  return out;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : 1));
}

/** UTC day index — identical expression to the client's today() */
function serverDay(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** a fresh board for a given day: the deterministic 3, all unstarted */
function freshQuestBoard(day: number) {
  return {
    day,
    list: rollDailyQuestIds(day).map((id) => ({ id, progress: 0, claimed: false })),
  };
}

/** load a stored quest board, re-rolling if absent or for a stale UTC day */
function sanitizeQuests(raw: unknown): { day: number; list: { id: string; progress: number; claimed: boolean }[] } {
  const day = serverDay();
  const r = raw as { day?: unknown; list?: unknown } | null | undefined;
  if (!r || r.day !== day || !Array.isArray(r.list)) return freshQuestBoard(day);
  const valid = new Set(QUEST_POOL.map((q) => q.id));
  const list = (r.list as unknown[])
    .map((q) => q as { id?: unknown; progress?: unknown; claimed?: unknown } | null)
    .filter((q): q is { id: unknown; progress?: unknown; claimed?: unknown } => !!q && valid.has(String(q.id)))
    .map((q) => ({
      id: String(q.id),
      progress: Math.max(0, Math.trunc(Number(q.progress) || 0)),
      claimed: Boolean(q.claimed),
    }));
  return list.length ? { day, list } : freshQuestBoard(day);
}
