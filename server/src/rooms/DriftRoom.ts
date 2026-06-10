import { Room, Client } from "colyseus";
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
  loadShrinePot,
  setShrinePot,
  loadProps,
  insertProp,
  deletePropsForClaim,
  PlayerRow,
} from "../db";
import { World, buildingAt, townProtected, TOWN_CENTER } from "@/game/world/tilemap";
import { Drift } from "@/game/world/drift";
import { findPath, adjacentWalkable } from "@/game/world/pathfinding";
import { RESOURCE_META, INVENTORY_ORDER, Cell, ResourceNode } from "@/game/types";
import {
  DriftRoomState,
  PlayerState,
  NodeState,
  ClaimState,
  ListingState,
  PropState,
  tileToCode,
} from "./schema";

// The authoritative world. The server owns the map, the Drift, resource nodes
// and player movement. Clients send intents ("move", "gather"); the server
// pathfinds, walks players at a fixed tick and resolves gather timers. Loot,
// XP and inventory are applied client-side from "loot" events until Phase 4
// brings server persistence.

const TICK_MS = 50; // 20 Hz
const PLAYER_SPEED = 3.2; // tiles/sec — mirrors client Player.speed
const MAX_CLAIMS_PER_PLAYER = 3;
const CLAIM_EROSION = 5; // integrity lost per season
const CLAIM_SIEGE_EROSION = 15; // …when corruption is at the fence
const MAX_LISTINGS_PER_PLAYER = 6;
const VALID_ITEMS = new Set<string>(INVENTORY_ORDER);

// mirror of the client's cosmetic catalogs (whitelists)
const DYE_KEYS = ["stone", "ember", "moss", "blood", "gold", "bone", "water", "void"];
const EYE_KEYS = ["drift", "ember", "blood", "gold", "water"];
const AURA_KEYS = ["", "driftmote", "emberwake", "goldhalo"];
const PET_KEYS = ["", "wisp", "crow", "emberling"];
const PROP_KEYS = ["campfire", "banner", "driftlamp", "statue"];

// the Wheel (server-rolled; client pays 50g up front)
const WHEEL: { p: number; gold: number; shards: number; label: string }[] = [
  { p: 0.40, gold: 0,   shards: 0, label: "The Drift takes your coin." },
  { p: 0.25, gold: 25,  shards: 0, label: "A modest return — 25g." },
  { p: 0.15, gold: 75,  shards: 0, label: "The wheel favors you — 75g!" },
  { p: 0.10, gold: 150, shards: 0, label: "A fine spin — 150g!" },
  { p: 0.08, gold: 0,   shards: 2, label: "Two Drift Shards tumble out!" },
  { p: 0.02, gold: 500, shards: 0, label: "JACKPOT — 500 GOLD!" },
];

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
  /** stored progress, served on request (client asks once handlers are wired) */
  profileSnapshot: unknown;
  lastSpinAt?: number;
}

export class DriftRoom extends Room<DriftRoomState> {
  maxClients = 32;

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

  async onCreate() {
    this.setState(new DriftRoomState());
    this.world = new World(40, 40);
    this.drift = new Drift();

    // persisted land claims
    for (const row of await loadClaims()) {
      const owner = await loadOrCreatePlayer(row.token);
      this.addClaim(row.id, row.token, row.x, row.y, row.integrity, owner.name);
    }
    this.drift.isProtected = (x, y) =>
      townProtected(x, y) || this.claimAt(x, y) !== null;
    this.drift.preferRelocationCell = () => this.randomClaimFreeCell();

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

    this.drift.onRelocate = (kind) => this.broadcast("relocate", { kind });
    this.drift.onDriftfall = (cell) =>
      this.broadcast("driftfall", { x: cell.x, y: cell.y });
    this.drift.onSeason = () => {
      this.state.season += 1;
      this.erodeClaims();
      this.syncTiles();
      this.state.driftPct = this.corruptionPct();
      this.broadcast("season", {
        season: this.state.season,
        driftPct: this.state.driftPct,
      });
    };

    this.onMessage("move", (client, msg: { x: number; y: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim || typeof msg?.x !== "number" || typeof msg?.y !== "number") return;
      const goal = { x: Math.round(msg.x), y: Math.round(msg.y) };
      if (!this.world.inBounds(goal.x, goal.y)) return;
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
        aura?: string; pet?: string;
      }) => {
        const ps = this.state.players.get(client.sessionId);
        if (!ps || !msg) return;
        if (typeof msg.name === "string") {
          const clean = msg.name.trim().slice(0, 16);
          if (clean) ps.name = clean;
        }
        if (typeof msg.dye === "string" && DYE_KEYS.includes(msg.dye)) ps.dye = msg.dye;
        if (typeof msg.eye === "string" && EYE_KEYS.includes(msg.eye)) ps.eye = msg.eye;
        if (typeof msg.title === "string") ps.title = msg.title.trim().slice(0, 24);
        if (typeof msg.aura === "string" && AURA_KEYS.includes(msg.aura)) ps.aura = msg.aura;
        if (typeof msg.pet === "string" && PET_KEYS.includes(msg.pet)) ps.pet = msg.pet;
      },
    );

    // ---- the Vault: banked gold (delta > 0 deposit, < 0 withdraw) -------------
    this.onMessage("bank", async (client, msg: { delta?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      const delta = Math.floor(Number(msg?.delta ?? 0));
      if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 1_000_000) return;
      const row = await loadOrCreatePlayer(sim.token);
      const next = row.bankGold + delta;
      if (next < 0) {
        return client.send("bankResult", { ok: false, banked: row.bankGold, reason: "Not that much in your box" });
      }
      await setBankGold(sim.token, next).catch(() => {});
      client.send("bankResult", { ok: true, banked: next, delta });
    });

    // ---- the Wheel: server-rolled spin (client paid 50g already) ---------------
    this.onMessage("spin", (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      const now = Date.now();
      if (now - (sim.lastSpinAt ?? 0) < 2500) return;
      sim.lastSpinAt = now;
      let roll = Math.random();
      let prize = WHEEL[0];
      for (const seg of WHEEL) {
        if (roll < seg.p) { prize = seg; break; }
        roll -= seg.p;
      }
      client.send("spinResult", { gold: prize.gold, shards: prize.shards, label: prize.label });
    });

    // ---- the Shrine: communal donations toward a cleansing ---------------------
    this.onMessage("donate", async (client, msg: { amount?: number }) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      const amount = Math.floor(Number(msg?.amount ?? 0));
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) return;
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
      // both fighters step into the Pit
      a.px = 18; a.py = 28; a.path = []; a.action = "idle";
      b.px = 22; b.py = 28; b.path = []; b.action = "idle";
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
    });

    this.onMessage("duelHit", (client, msg: { dmg?: number }) => {
      const duel = this.duels.find(
        (d) => d.a === client.sessionId || d.b === client.sessionId,
      );
      if (!duel) return;
      const now = Date.now();
      const isA = duel.a === client.sessionId;
      const last = isA ? duel.lastHitA : duel.lastHitB;
      if (now - last < 900) return; // server-side swing speed cap
      const dmg = Math.max(1, Math.min(25, Math.floor(Number(msg?.dmg ?? 0))));
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

    // stored progress, sent when the client says it's ready to receive it
    this.onMessage("getProfile", async (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
      const myClaims = [...this.claimOwner]
        .filter(([, t]) => t === sim.token)
        .map(([id]) => id);
      const myListings = [...this.listingOwner]
        .filter(([, t]) => t === sim.token)
        .map(([id]) => id);
      const escrowGold = await takeEscrow(sim.token).catch(() => 0);
      const row = await loadOrCreatePlayer(sim.token);
      client.send("profile", {
        snapshot: sim.profileSnapshot,
        myClaims,
        myListings,
        escrowGold,
        banked: row.bankGold,
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
        const item = String(msg?.item ?? "");
        const qty = Math.floor(Number(msg?.qty ?? 0));
        const price = Math.floor(Number(msg?.price ?? 0));
        if (!VALID_ITEMS.has(item)) return fail("Unknown item");
        if (qty < 1 || qty > 999) return fail("Bad quantity");
        if (price < 1 || price > 100_000) return fail("Bad price");
        const owned = [...this.listingOwner.values()].filter((t) => t === sim.token).length;
        if (owned >= MAX_LISTINGS_PER_PLAYER) {
          return fail(`Your stall is full (${MAX_LISTINGS_PER_PLAYER} listings)`);
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
      if (this.listingOwner.get(ls.id) !== sim.token) return;
      this.state.listings.delete(String(ls.id));
      this.listingOwner.delete(ls.id);
      await deleteListing(ls.id).catch(() => {});
      client.send("unlistResult", { ok: true, item: ls.item, qty: ls.qty });
    });

    // buy a listing (buyer already deducted gold client-side; refunded on fail)
    this.onMessage("buy", async (client, msg: { id?: number }) => {
      const sim = this.sims.get(client.sessionId);
      const ls = this.state.listings.get(String(msg?.id));
      const fail = (reason: string) =>
        client.send("buyResult", { ok: false, reason });
      if (!sim) return;
      if (!ls) return fail("That offer is gone");
      const sellerToken = this.listingOwner.get(ls.id);
      if (sellerToken === sim.token) return fail("That's your own stall");

      this.state.listings.delete(String(ls.id));
      this.listingOwner.delete(ls.id);
      await deleteListing(ls.id).catch(() => {});
      client.send("buyResult", { ok: true, item: ls.item, qty: ls.qty, price: ls.price });

      // pay the seller: live message when online, escrow otherwise
      const sellerSim = [...this.sims.values()].find((s) => s.token === sellerToken);
      if (sellerSim) {
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

    // stake a 3×3 land claim (gold is deducted client-side; trusted until Phase 6)
    this.onMessage("claim", async (client, msg: { x?: number; y?: number }) => {
      const sim = this.sims.get(client.sessionId);
      const ps = this.state.players.get(client.sessionId);
      const fail = (reason: string) =>
        client.send("claimResult", { ok: false, reason });
      if (!sim || typeof msg?.x !== "number" || typeof msg?.y !== "number") return;
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
      if (owned >= MAX_CLAIMS_PER_PLAYER) {
        return fail(`You already hold ${MAX_CLAIMS_PER_PLAYER} claims`);
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
      void savePlayer(sim.token, {
        snapshot: msg.snapshot,
        lastX: sim.px,
        lastY: sim.py,
        ...(ps ? { name: ps.name, dye: ps.dye, eye: ps.eye } : {}),
      }).catch(() => {});
    });

    // client died in (client-local) combat — pull them back to spawn
    this.onMessage("respawn", (client) => {
      const sim = this.sims.get(client.sessionId);
      if (!sim) return;
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

  /** guest auth: a browser-held token is the identity; rows are auto-created */
  async onAuth(client: Client, options: { token?: string }) {
    const token = typeof options?.token === "string" ? options.token.trim() : "";
    if (token.length < 8 || token.length > 64) return false;
    return await loadOrCreatePlayer(token);
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
    };
    this.sims.set(client.sessionId, sim);

    const ps = new PlayerState();
    ps.id = client.sessionId;
    ps.x = spawn.x;
    ps.y = spawn.y;
    ps.name = row.name;
    ps.dye = row.dye;
    ps.eye = row.eye;
    this.state.players.set(client.sessionId, ps);

  }

  async onLeave(client: Client) {
    // fleeing a duel forfeits it
    const duel = this.duels.find(
      (d) => d.a === client.sessionId || d.b === client.sessionId,
    );
    if (duel) {
      this.endDuel(duel, duel.a === client.sessionId ? duel.b : duel.a);
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
        sim.client.send("loot", { kind: node.kind, depleted });
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

  /** winner=null → draw (timeout) */
  private endDuel(duel: Duel, winner: string | null) {
    this.duels = this.duels.filter((d) => d !== duel);
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

  // ---- the Shrine -----------------------------------------------------------------

  private shrineGoal(): number {
    return Math.max(400, 400 + this.corruptionPct() * 30);
  }

  /** the Pale Flame fires: purge the corrupt tiles nearest the shrine */
  private cleanse() {
    const shrineXY = { x: 20, y: 13 };
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

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : 1));
}
