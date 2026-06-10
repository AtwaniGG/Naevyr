import { Camera } from "@/game/render/camera";
import { gridToIso, TILE_H, TILE_W, isoToGrid } from "@/game/render/iso";
import { World } from "@/game/world/tilemap";
import { Player } from "@/game/entities/player";
import { Drift } from "@/game/world/drift";
import { findPath, adjacentWalkable } from "@/game/world/pathfinding";
import { startGathering, applyGatherLoot } from "@/game/systems/gathering";
import { gatherSpeedMultiplier } from "@/game/systems/crafting";
import { Cell, ResourceKind, ResourceNode, codeToTile } from "@/game/types";
import { useGame } from "@/game/state/store";
import { CombatManager } from "@/game/systems/combat";
import { Mob } from "@/game/entities/mob";
import { NetClient } from "@/game/net/client";
import {
  spriteCache, hash2,
  TileType, BeastKind, BeastAnim, DoodadKind, EquipVisual, LookVisual,
  DyeKey, EyeKey,
} from "@/game/render/sprites";
import { currentTitle } from "@/game/state/store";
import { initAudio, play } from "@/game/audio/sound";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera = new Camera();
  world: World;
  player: Player;
  drift = new Drift();
  combat = new CombatManager();

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

  private cleanupFns: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.world = new World(40, 40);
    this.player = new Player(20, 20);
    const iso = gridToIso(this.player.px, this.player.py);
    this.camera.snapTo(iso.x, iso.y);

    spriteCache.init();

    this.combat.spawn(this.world, 8);
    this.wireCombat();

    this.drift.onRelocate = (kind) =>
      useGame.getState().pushLog(`A ${kind} re-forms somewhere in the Drift…`, "#7c6f93");
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
    useGame.getState().pushLog("You awaken in the Driftlands.", "#d8cfe0");
    void this.connect();
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
    const net = await NetClient.connect(url, 2500);
    if (!net) {
      useGame.getState().pushLog("No shared world found — wandering offline.", "#6f6781");
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

    // fresh local mobs for the adopted map (combat stays client-side this phase)
    this.combat = new CombatManager();
    this.combat.spawn(this.world, 8);
    this.wireCombat();

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

    net.onMessage<{ kind: ResourceKind; depleted: boolean }>("loot", (m) =>
      applyGatherLoot(m.kind, m.depleted),
    );
    net.onMessage<{ nodeId: number; totalMs: number }>("gatherStart", (m) => {
      this.gatherVis = { nodeId: m.nodeId, start: performance.now(), total: m.totalMs };
    });
    net.onMessage<{ kind: string }>("relocate", (m) =>
      useGame.getState().pushLog(`A ${m.kind} re-forms somewhere in the Drift…`, "#7c6f93"),
    );
    net.onMessage<{ season: number; driftPct: number }>("season", (m) => {
      const s = useGame.getState();
      s.setSeason(m.season);
      s.setDriftPct(m.driftPct);
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
      s.pushLog("Connection to the shared Drift lost — wandering offline.", "#dc2626");
    });

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

  /** juice + respawn hooks (re-run whenever a fresh CombatManager is created) */
  private wireCombat() {
    this.combat.onPlayerHit = (mob, dmg) => {
      this.spawnFloater(mob.px, mob.py, `${dmg}`, "#e7c873");
      this.spawnSparks(mob.px, mob.py, "#d8b4fe", 7);
    };
    this.combat.onSelfHit = (dmg) => {
      this.spawnFloater(this.player.px, this.player.py, `-${dmg}`, "#ef4444");
      this.spawnSparks(this.player.px, this.player.py, "#dc2626", 5);
      this.shakeUntil = performance.now() + 200;
      this.shakeMag = Math.min(7, 2 + dmg * 0.5);
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

  /** push name/dye/eye/title to the server whenever they change */
  private pushIdentity(net: NetClient) {
    const s = useGame.getState();
    const id = {
      name: s.cosmetics.name,
      dye: s.cosmetics.dye,
      eye: s.cosmetics.eye,
      title: currentTitle(s),
    };
    const sig = `${id.name}|${id.dye}|${id.eye}|${id.title}`;
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
  }

  private cellUnderCursor(sx: number, sy: number) {
    const world = this.camera.screenToWorld(sx, sy);
    const g = isoToGrid(world.x, world.y);
    return { x: Math.round(g.gx), y: Math.round(g.gy) };
  }

  private handleClick(sx: number, sy: number) {
    initAudio(); // browsers unlock audio on the first user gesture
    const cell = this.cellUnderCursor(sx, sy);
    if (!this.world.inBounds(cell.x, cell.y)) return;
    this.clickMarker = { x: cell.x, y: cell.y, t: performance.now() };

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

  /** Online: clicks become server intents. Mobs are still local (Phase 3). */
  private handleClickOnline(cell: Cell) {
    const net = this.net!;

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
    if (this.net) {
      this.updateOnline(dt);
    } else {
      this.player.update(dt);
      this.drift.update(this.world, dt);
    }
    this.combat.update(dt, this.world, this.player);

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

    const iso = gridToIso(this.player.px, this.player.py);
    this.camera.follow(iso.x, iso.y);
    this.camera.update(dt);
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

    this.pushIdentity(net);

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
    const count = net.playerCount();
    if (store.playersOnline !== count) store.setPlayersOnline(count);

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

    this.drawGround(ctx);
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

    // pulsing additive glow on corrupt ground
    const pulse = 0.55 + Math.sin(now / 900) * 0.2;
    for (const gpos of this.corruptGlows) {
      spriteCache.drawGlow(ctx, gpos.sx, gpos.sy, z, pulse);
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
    const count = 22 + Math.round((drift / 100) * 22); // 22 → 44 with corruption

    ctx.save();
    for (let i = 0; i < count; i++) {
      const isMote = i % 4 === 0;
      const speed = 0.3 + (i % 3) * 0.2;
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

        // deterministic clutter — same cell always grows the same tuft
        if (t !== 'water' && !this.world.getNode(x, y)) {
          const h = hash2(x, y, 91);
          let kind: DoodadKind | null = null;
          if (t === 'corrupt') {
            if (h < 0.10) kind = 'crystal';
          } else if ([nw, nn, se, ss].includes('corrupt') && h < 0.08) {
            kind = 'crystal'; // corruption seeps ahead of itself
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

    for (const node of this.world.nodes) {
      if (node.regrowIn > 0) continue; // depleted = invisible until it re-forms
      const depth = node.gx + node.gy;
      draws.push({ depth, fn: () => this.drawNode(ctx, node) });
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
    const pd = this.player.px + this.player.py;
    draws.push({
      depth: pd + 0.01,
      fn: () => this.drawWandererEntity(ctx, this.player, true),
    });

    draws.sort((a, b) => a.depth - b.depth);
    for (const d of draws) d.fn();
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: ResourceNode) {
    const s        = this.tileScreen(node.gx, node.gy);
    const z        = this.camera.zoom;
    const depleted = node.amount <= 0;
    const fishF    = Math.floor(performance.now() / 300) % 4;

    spriteCache.drawNode(ctx, node.kind as 'tree' | 'rock' | 'fish', depleted, s.x, s.y, z, fishF);

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
      look = { dye: state.cosmetics.dye, eye: state.cosmetics.eye };
      name = state.cosmetics.name;
      title = currentTitle(state);
    } else {
      look = { dye: p.dye as DyeKey, eye: p.eye as EyeKey };
      name = p.name || "Wanderer";
      title = p.title;
    }

    spriteCache.drawChar(ctx, p.isoFacing, p.isoMirror, anim, frame, s.x, s.y, z, equip, look);

    // name + earned title; your own tag is dimmer
    ctx.textAlign = "center";
    ctx.fillStyle = isSelf ? "rgba(216,207,224,0.4)" : "rgba(216,207,224,0.8)";
    ctx.font = `${8 * z}px ui-sans-serif`;
    ctx.fillText(name, s.x, s.y - 46 * z);
    if (title) {
      ctx.fillStyle = isSelf ? "rgba(168,85,247,0.4)" : "rgba(216,180,254,0.6)";
      ctx.font = `${6.5 * z}px ui-sans-serif`;
      ctx.fillText(title, s.x, s.y - 40 * z);
    }
    ctx.textAlign = "left";
  }

  private drawMob(ctx: CanvasRenderingContext2D, mob: Mob) {
    const iso = gridToIso(mob.px, mob.py);
    const s = this.camera.worldToScreen(iso.x, iso.y);
    const z = this.camera.zoom;
    const now = performance.now();
    const kind: BeastKind = mob.level >= 3 ? "stalker" : "husk";

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

function chebyshev(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
