import { Room, Client } from "colyseus";
import { World } from "@/game/world/tilemap";
import { Drift } from "@/game/world/drift";
import { findPath, adjacentWalkable } from "@/game/world/pathfinding";
import { RESOURCE_META, Cell, ResourceNode } from "@/game/types";
import {
  DriftRoomState,
  PlayerState,
  NodeState,
  tileToCode,
} from "./schema";

// The authoritative world. The server owns the map, the Drift, resource nodes
// and player movement. Clients send intents ("move", "gather"); the server
// pathfinds, walks players at a fixed tick and resolves gather timers. Loot,
// XP and inventory are applied client-side from "loot" events until Phase 4
// brings server persistence.

const TICK_MS = 50; // 20 Hz
const PLAYER_SPEED = 3.2; // tiles/sec — mirrors client Player.speed

// mirror of the client's DYES / EYE_GLOWS keys (cosmetic whitelist)
const DYE_KEYS = ["stone", "ember", "moss", "blood", "gold", "bone", "water", "void"];
const EYE_KEYS = ["drift", "ember", "blood", "gold", "water"];

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
}

export class DriftRoom extends Room<DriftRoomState> {
  maxClients = 32;

  private world!: World;
  private drift!: Drift;
  private sims = new Map<string, PlayerSim>();

  onCreate() {
    this.setState(new DriftRoomState());
    this.world = new World(40, 40);
    this.drift = new Drift();

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
    this.drift.onSeason = () => {
      this.state.season += 1;
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

    // cosmetic identity: trusted but sanitized (length caps + key whitelists)
    this.onMessage(
      "identity",
      (client, msg: { name?: string; dye?: string; eye?: string; title?: string }) => {
        const ps = this.state.players.get(client.sessionId);
        if (!ps || !msg) return;
        if (typeof msg.name === "string") {
          const clean = msg.name.trim().slice(0, 16);
          if (clean) ps.name = clean;
        }
        if (typeof msg.dye === "string" && DYE_KEYS.includes(msg.dye)) ps.dye = msg.dye;
        if (typeof msg.eye === "string" && EYE_KEYS.includes(msg.eye)) ps.eye = msg.eye;
        if (typeof msg.title === "string") ps.title = msg.title.trim().slice(0, 24);
      },
    );

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

  onJoin(client: Client) {
    const spawn = this.findSpawn();
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
    };
    this.sims.set(client.sessionId, sim);

    const ps = new PlayerState();
    ps.id = client.sessionId;
    ps.x = spawn.x;
    ps.y = spawn.y;
    this.state.players.set(client.sessionId, ps);
  }

  onLeave(client: Client) {
    this.sims.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }

  // ---- simulation ------------------------------------------------------------

  private tick(dt: number) {
    this.drift.update(this.world, dt);
    this.syncNodes();

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

  // ---- schema sync helpers -----------------------------------------------------

  private syncNodes() {
    for (const node of this.world.nodes) {
      const ns = this.state.nodes.get(String(node.id));
      if (!ns) continue;
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
