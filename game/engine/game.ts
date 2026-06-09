import { Camera } from "@/game/render/camera";
import { gridToIso, TILE_H, TILE_W, isoToGrid } from "@/game/render/iso";
import { World } from "@/game/world/tilemap";
import { Player } from "@/game/entities/player";
import { Drift } from "@/game/world/drift";
import { findPath, adjacentWalkable } from "@/game/world/pathfinding";
import { startGathering } from "@/game/systems/gathering";
import { ResourceNode } from "@/game/types";
import { useGame } from "@/game/state/store";
import { CombatManager } from "@/game/systems/combat";
import { Mob } from "@/game/entities/mob";

const TILE_COLORS: Record<string, [string, string]> = {
  // [top face, side/edge tint]
  grass: ["#243827", "#1a2a1c"],
  dirt: ["#3a2f24", "#2a221a"],
  stone: ["#2f2f3a", "#23232c"],
  water: ["#15303f", "#0e2230"],
  corrupt: ["#3a1d4a", "#27123a"],
};

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

  private cleanupFns: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.world = new World(40, 40);
    this.player = new Player(20, 20);
    const iso = gridToIso(this.player.px, this.player.py);
    this.camera.snapTo(iso.x, iso.y);

    this.combat.spawn(this.world, 8);

    this.drift.onRelocate = (kind) =>
      useGame.getState().pushLog(`A ${kind} re-forms somewhere in the Drift…`, "#7c6f93");
    this.drift.onSeason = () => {
      useGame.getState().bumpSeason();
      useGame.getState().pushLog("The Drift deepens. A new season corrupts the land.", "#a855f7");
    };

    this.bindEvents();
    this.resize();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    useGame.getState().pushLog("You awaken in the Driftlands.", "#d8cfe0");
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
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
    const cell = this.cellUnderCursor(sx, sy);
    if (!this.world.inBounds(cell.x, cell.y)) return;
    this.clickMarker = { x: cell.x, y: cell.y, t: performance.now() };

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
    this.player.update(dt);
    this.drift.update(this.world, dt);
    this.combat.update(dt, this.world, this.player);

    // arrival -> begin gather
    if (
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

    const iso = gridToIso(this.player.px, this.player.py);
    this.camera.follow(iso.x, iso.y);
    this.camera.update(dt);
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
    ctx.clearRect(0, 0, this.camera.viewW, this.camera.viewH);

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

    ctx.restore();
  }

  private tileScreen(gx: number, gy: number) {
    const iso = gridToIso(gx, gy);
    return this.camera.worldToScreen(iso.x, iso.y);
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    const z = this.camera.zoom;
    const hw = (TILE_W / 2) * z;
    const hh = (TILE_H / 2) * z;
    const now = performance.now();

    for (let y = 0; y < this.world.h; y++) {
      for (let x = 0; x < this.world.w; x++) {
        const s = this.tileScreen(x, y);
        // viewport cull
        if (
          s.x < -hw * 2 ||
          s.x > this.camera.viewW + hw * 2 ||
          s.y < -hh * 2 ||
          s.y > this.camera.viewH + hh * 4
        )
          continue;

        const t = this.world.tile(x, y);
        const [top] = TILE_COLORS[t];
        this.diamond(ctx, s.x, s.y, hw, hh, top);

        if (t === "corrupt") {
          const pulse = 0.35 + 0.25 * Math.sin(now / 400 + (x + y));
          ctx.save();
          ctx.globalAlpha = pulse;
          this.diamond(ctx, s.x, s.y, hw * 0.7, hh * 0.7, "#a855f7");
          ctx.restore();
        }
        if (t === "water") {
          const shimmer = 0.15 + 0.1 * Math.sin(now / 600 + (x - y));
          ctx.save();
          ctx.globalAlpha = shimmer;
          this.diamond(ctx, s.x, s.y - 2 * z, hw * 0.8, hh * 0.8, "#3b6f86");
          ctx.restore();
        }

        // grid line
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 1;
        this.diamondPath(ctx, s.x, s.y, hw, hh);
        ctx.stroke();

        // hover highlight
        if (this.hover && this.hover.x === x && this.hover.y === y) {
          this.diamond(ctx, s.x, s.y, hw, hh, "rgba(231,200,115,0.18)");
          ctx.strokeStyle = "rgba(231,200,115,0.7)";
          ctx.lineWidth = 1.5;
          this.diamondPath(ctx, s.x, s.y, hw, hh);
          ctx.stroke();
        }
      }
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

    for (const node of this.world.nodes) {
      if (node.regrowIn > 0) continue; // depleted = invisible until it re-forms
      const depth = node.gx + node.gy;
      draws.push({ depth, fn: () => this.drawNode(ctx, node) });
    }
    for (const mob of this.combat.mobs) {
      if (mob.state === "dead") continue;
      draws.push({ depth: mob.px + mob.py, fn: () => this.drawMob(ctx, mob) });
    }
    const pd = this.player.px + this.player.py;
    draws.push({ depth: pd + 0.01, fn: () => this.drawPlayer(ctx) });

    draws.sort((a, b) => a.depth - b.depth);
    for (const d of draws) d.fn();
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: ResourceNode) {
    const s = this.tileScreen(node.gx, node.gy);
    const z = this.camera.zoom;
    const sway = Math.sin(node.phase * 1.5) * 1.5 * z;
    const depleted = node.amount / node.maxAmount;

    if (node.kind === "tree") {
      // trunk
      ctx.fillStyle = "#2c2018";
      ctx.fillRect(s.x - 3 * z, s.y - 18 * z, 6 * z, 20 * z);
      // canopy (dark, drift-tinged)
      const layers = ["#1c3322", "#24402a", "#2e5034"];
      for (let i = 0; i < layers.length; i++) {
        ctx.fillStyle = layers[i];
        ctx.beginPath();
        const cy = s.y - (20 + i * 10) * z;
        const r = (20 - i * 4) * z * (0.85 + 0.15 * depleted);
        ctx.moveTo(s.x + sway, cy - r);
        ctx.lineTo(s.x + sway + r, cy + r * 0.7);
        ctx.lineTo(s.x + sway - r, cy + r * 0.7);
        ctx.closePath();
        ctx.fill();
      }
    } else if (node.kind === "rock") {
      ctx.fillStyle = "#3a3a46";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 20 * z * depleted - 4 * z);
      ctx.lineTo(s.x + 16 * z, s.y - 2 * z);
      ctx.lineTo(s.x + 8 * z, s.y + 6 * z);
      ctx.lineTo(s.x - 10 * z, s.y + 5 * z);
      ctx.lineTo(s.x - 15 * z, s.y - 4 * z);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#52525f";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 20 * z * depleted - 4 * z);
      ctx.lineTo(s.x + 16 * z, s.y - 2 * z);
      ctx.lineTo(s.x + 2 * z, s.y - 2 * z);
      ctx.closePath();
      ctx.fill();
    } else {
      // fishing spot: ripples
      ctx.strokeStyle = "rgba(95,176,201,0.7)";
      ctx.lineWidth = 2 * z;
      for (let i = 0; i < 3; i++) {
        const rr = ((node.phase * 18 + i * 10) % 30) * z;
        ctx.globalAlpha = 1 - rr / (30 * z);
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, rr + 4 * z, (rr + 4 * z) * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // gather progress ring if player is working this node
    if (this.player.action === "gather" && this.player.targetNode === node) {
      const p = this.player.gatherMs / this.player.gatherTotal;
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 4 * z;
      ctx.beginPath();
      ctx.arc(s.x, s.y - 4 * z, 14 * z, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#e7c873";
      ctx.beginPath();
      ctx.arc(s.x, s.y - 4 * z, 14 * z, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const iso = gridToIso(this.player.px, this.player.py);
    const s = this.camera.worldToScreen(iso.x, iso.y);
    const z = this.camera.zoom;
    const bob = (this.player.action === "walk" ? Math.abs(Math.sin(this.player.bob)) : 0) * 3 * z;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 10 * z, 5 * z, 0, 0, Math.PI * 2);
    ctx.fill();

    const f = this.player.facing;
    const cy = s.y - bob;

    // cloak body
    ctx.fillStyle = "#2a2438";
    ctx.beginPath();
    ctx.moveTo(s.x, cy - 30 * z);
    ctx.lineTo(s.x + 11 * z, cy - 2 * z);
    ctx.lineTo(s.x - 11 * z, cy - 2 * z);
    ctx.closePath();
    ctx.fill();
    // drift trim
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(s.x - 2 * z, cy - 22 * z, 4 * z, 16 * z);
    // hood
    ctx.fillStyle = "#1c1726";
    ctx.beginPath();
    ctx.arc(s.x + f * 1 * z, cy - 30 * z, 7 * z, 0, Math.PI * 2);
    ctx.fill();
    // face glow
    ctx.fillStyle = "rgba(168,85,247,0.9)";
    ctx.beginPath();
    ctx.arc(s.x + f * 2 * z, cy - 30 * z, 2 * z, 0, Math.PI * 2);
    ctx.fill();

    // gather "swing" arm hint
    if (this.player.action === "gather") {
      const swing = Math.sin(this.player.gatherMs / 90) * 0.5;
      ctx.strokeStyle = "#6b5d7e";
      ctx.lineWidth = 3 * z;
      ctx.beginPath();
      ctx.moveTo(s.x + f * 6 * z, cy - 18 * z);
      ctx.lineTo(s.x + f * (12 + swing * 6) * z, cy - (24 + swing * 8) * z);
      ctx.stroke();
    }
  }

  private drawMob(ctx: CanvasRenderingContext2D, mob: Mob) {
    const iso = gridToIso(mob.px, mob.py);
    const s = this.camera.worldToScreen(iso.x, iso.y);
    const z = this.camera.zoom;
    const bob = Math.abs(Math.sin(mob.bob)) * 2 * z;
    const cy = s.y - bob;
    const flash = mob.hurtFlash > 0;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 9 * z, 4.5 * z, 0, 0, Math.PI * 2);
    ctx.fill();

    // hunched corrupted body
    ctx.fillStyle = flash ? "#dc2626" : "#1b1426";
    ctx.beginPath();
    ctx.moveTo(s.x, cy - 22 * z);
    ctx.lineTo(s.x + 12 * z, cy - 2 * z);
    ctx.lineTo(s.x - 12 * z, cy - 2 * z);
    ctx.closePath();
    ctx.fill();
    // jagged corruption spines
    ctx.strokeStyle = flash ? "#fff" : "#a855f7";
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.moveTo(s.x - 6 * z, cy - 12 * z);
    ctx.lineTo(s.x - 9 * z, cy - 20 * z);
    ctx.moveTo(s.x + 6 * z, cy - 12 * z);
    ctx.lineTo(s.x + 9 * z, cy - 20 * z);
    ctx.stroke();
    // glowing eyes
    ctx.fillStyle = "#c98bff";
    const ex = mob.facing * 3 * z;
    ctx.beginPath();
    ctx.arc(s.x - 3 * z + ex, cy - 16 * z, 1.6 * z, 0, Math.PI * 2);
    ctx.arc(s.x + 3 * z + ex, cy - 16 * z, 1.6 * z, 0, Math.PI * 2);
    ctx.fill();

    // HP bar when hurt or engaged
    if (mob.hp < mob.maxHp || this.combat.isEngaged(mob)) {
      const w = 24 * z;
      const p = mob.hp / mob.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(s.x - w / 2, cy - 30 * z, w, 4 * z);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(s.x - w / 2, cy - 30 * z, w * p, 4 * z);
    }
    // level tag
    ctx.fillStyle = "rgba(216,207,224,0.6)";
    ctx.font = `${8 * z}px ui-sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`Lv ${mob.level}`, s.x, cy - 33 * z);
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
