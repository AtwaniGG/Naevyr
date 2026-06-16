import { Mob } from "@/game/entities/mob";
import { Player } from "@/game/entities/player";
import { World, TOWN_CENTER } from "@/game/world/tilemap";
import { useGame, MAX_HP } from "@/game/state/store";
import { weaponBonus, damageReduction } from "@/game/systems/crafting";
import { play } from "@/game/audio/sound";

// Combat system: owns the Drift Beasts, runs an auto-attack exchange while the
// player is engaged and adjacent, and handles loot, XP, death and respawns.

const PLAYER_ATTACK_MS = 1100;
const MOB_ATTACK_MS = 1500;
const SPAWN_CELL = { x: TOWN_CENTER.x, y: TOWN_CENTER.y };

function cheby(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export class CombatManager {
  mobs: Mob[] = [];
  /** set by the engine in online mode — tells the server we respawned */
  onRespawn: (() => void) | null = null;
  /** juice hooks (floaters, sparks, shake) wired by the engine */
  onPlayerHit: ((mob: Mob, dmg: number, crit: boolean) => void) | null = null;
  onSelfHit: ((dmg: number) => void) | null = null;
  /** fires with the death position BEFORE the respawn teleport (tombstones) */
  onDeath: ((x: number, y: number) => void) | null = null;
  /** caravan escort hook: fires when a raider dies (engine reports to server) */
  onRaiderKill: (() => void) | null = null;
  /** shared-mob hooks (engine forwards to the server when online) */
  onNetAttack: ((mob: Mob, dmg: number) => void) | null = null;
  onEngage: ((mob: Mob) => void) | null = null;
  private nextId = 1;

  /** local id for a schema puppet (keeps the id space collision-free) */
  allocId(): number {
    return this.nextId++;
  }

  private engaged: Mob | null = null;
  private playerTimer = 0;
  private mobTimer = 0;

  spawn(world: World, count: number) {
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < 2000) {
      const x = (Math.random() * world.w) | 0;
      const y = (Math.random() * world.h) | 0;
      if (!world.isWalkable(x, y)) continue;
      if (cheby({ x, y }, SPAWN_CELL) < 6) continue; // keep the spawn area safe
      const level = 1 + ((Math.random() * 3) | 0);
      this.mobs.push(new Mob(this.nextId++, x, y, level));
      placed++;
    }
  }

  /** a den pack: elite beasts that hold ground and stay dead once cleared */
  spawnPackAt(world: World, x: number, y: number, count: number, level: number): number[] {
    const ids: number[] = [];
    let guard = 0;
    while (ids.length < count && guard++ < 300) {
      const dx = ((Math.random() * 9) | 0) - 4;
      const dy = ((Math.random() * 9) | 0) - 4;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
      const cx = x + dx;
      const cy = y + dy;
      if (!world.isWalkable(cx, cy)) continue;
      const elite = new Mob(this.nextId++, cx, cy, level, "husk");
      elite.persistDeath = true;
      this.mobs.push(elite);
      ids.push(elite.id);
    }
    return ids;
  }

  /** remove a previous pack entirely (corpses included) before re-seeding */
  removePack(ids: number[]) {
    this.mobs = this.mobs.filter((m) => !ids.includes(m.id));
  }

  /** Raider ambush wave around the caravan wagon (per-client, like all mobs) */
  spawnRaiders(world: World, x: number, y: number, count: number, level: number): number {
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < 400) {
      const dx = ((Math.random() * 9) | 0) - 4;
      const dy = ((Math.random() * 9) | 0) - 4;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue; // not on the wagon
      const cx = x + dx;
      const cy = y + dy;
      if (!world.isWalkable(cx, cy)) continue;
      const raider = new Mob(this.nextId++, cx, cy, level, "raider");
      this.mobs.push(raider);
      placed++;
    }
    return placed;
  }

  /** the wave breaks: surviving raiders crumble (wagon rolls on / run ends) */
  clearRaiders() {
    for (const m of this.mobs) {
      if (m.kind === "raider" && m.state !== "dead") {
        m.hit(m.hp); // plays the death crumble
        if (this.engaged === m) this.engaged = null;
      }
    }
  }

  /** spawn the Drift Colossus near a given cell (corruption-front world boss) */
  spawnBoss(world: World, near: { x: number; y: number }): Mob | null {
    let cell: { x: number; y: number } | null = null;
    for (let r = 0; r < 6 && !cell; r++) {
      for (let dy = -r; dy <= r && !cell; dy++) {
        for (let dx = -r; dx <= r && !cell; dx++) {
          if (world.isWalkable(near.x + dx, near.y + dy)) {
            cell = { x: near.x + dx, y: near.y + dy };
          }
        }
      }
    }
    if (!cell) return null;
    const boss = new Mob(this.nextId++, cell.x, cell.y, 6, "colossus");
    boss.maxHp = boss.hp = 140;
    boss.damage = 7;
    boss.xpReward = 120;
    boss.speed = 0.45; // a walking ruin does not hurry
    this.mobs.push(boss);
    return boss;
  }

  /** is a Colossus currently alive in the world? */
  bossAlive(): boolean {
    return this.mobs.some((m) => m.kind === "colossus" && m.state !== "dead");
  }

  /** living mob at (or very near) a clicked cell, for targeting */
  mobAtCell(cell: { x: number; y: number }): Mob | null {
    let best: Mob | null = null;
    let bestD = 0.8;
    for (const m of this.mobs) {
      if (m.state === "dead") continue;
      const d = Math.hypot(m.px - cell.x, m.py - cell.y);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    return best;
  }

  isEngaged(mob: Mob) {
    return this.engaged === mob;
  }

  get target() {
    return this.engaged;
  }

  startEngage(player: Player, mob: Mob) {
    if (mob.state === "dead") return;
    this.engaged = mob;
    mob.state = "engaged";
    if (mob.netId != null) this.onEngage?.(mob); // freeze it server-side too
    this.playerTimer = PLAYER_ATTACK_MS * 0.4; // small wind-up
    this.mobTimer = MOB_ATTACK_MS;
    player.action = "attack";
    player.facing = mob.px >= player.px ? 1 : -1;
    player.updateIsoFacing(mob.px - player.px, mob.py - player.py);
    mob.facing = player.px >= mob.px ? 1 : -1;
    mob.updateIsoFacing(player.px - mob.px, player.py - mob.py);
  }

  disengage(player?: Player) {
    if (this.engaged && this.engaged.state === "engaged") {
      this.engaged.state = "wander";
    }
    this.engaged = null;
    if (player && player.action === "attack") player.action = "idle";
  }

  update(dt: number, world: World, player: Player) {
    for (const m of this.mobs) {
      if (m.netId != null) m.updatePuppet(dt); // server drives the real sim
      else m.update(dt, world);
    }
    // crumbled raiders don't respawn — prune once the death anim finishes
    this.mobs = this.mobs.filter(
      (m) => !(m.kind === "raider" && m.state === "dead" && m.deathT > 1.5),
    );

    const mob = this.engaged;
    if (!mob) return;

    // broke contact (player walked away) or mob died -> drop engagement
    if (mob.state === "dead") {
      this.disengage(player);
      return;
    }
    if (cheby(player.cell, mob.cell) > 1) {
      this.disengage(player);
      return;
    }

    player.facing = mob.px >= player.px ? 1 : -1;
    player.updateIsoFacing(mob.px - player.px, mob.py - player.py);
    mob.facing = player.px >= mob.px ? 1 : -1;
    mob.updateIsoFacing(player.px - mob.px, player.py - mob.py);

    // player swings
    this.playerTimer -= dt * 1000;
    if (this.playerTimer <= 0) {
      this.playerTimer += PLAYER_ATTACK_MS;
      this.playerAttack(mob);
      if (mob.hp <= 0) {
        this.disengage(player);
        return;
      }
    }

    // mob retaliates (shared beasts retaliate from the server via "mobHit")
    this.mobTimer -= dt * 1000;
    if (this.mobTimer <= 0) {
      this.mobTimer += MOB_ATTACK_MS;
      if (mob.netId == null) this.mobAttack(player, mob);
    }
  }

  private playerAttack(mob: Mob) {
    const store = useGame.getState();
    const lvl = store.skills.combat.level;
    const base =
      3 + Math.floor(lvl / 2) + weaponBonus() + Math.floor(Math.random() * 4);
    const crit = Math.random() < 0.12;
    const dmg = crit ? base * 2 : base;
    if (mob.netId != null) {
      // shared beast: the server applies the damage; we just send + show juice
      mob.hurtFlash = 180;
      play(crit ? "crit" : "hit");
      this.onPlayerHit?.(mob, dmg, crit);
      if (crit) store.bumpStat("crits");
      store.addXp("combat", crit ? 6 : 4);
      store.pushLog(
        crit
          ? `CRITICAL! You strike the Drift Beast for ${dmg}!`
          : `You strike the Drift Beast for ${dmg}.`,
        crit ? "#fcd34d" : "#e7c873",
      );
      this.onNetAttack?.(mob, dmg);
      return; // death (and loot) arrive from the server
    }
    mob.hit(dmg);
    play(crit ? "crit" : "hit");
    this.onPlayerHit?.(mob, dmg, crit);
    if (crit) store.bumpStat("crits");
    store.addXp("combat", crit ? 6 : 4);
    store.pushLog(
      crit
        ? `CRITICAL! You strike the Drift Beast for ${dmg}!`
        : `You strike the Drift Beast for ${dmg}.`,
      crit ? "#fcd34d" : "#e7c873",
    );
    if (mob.state === "dead") this.onKill(mob);
  }

  private onKill(mob: Mob) {
    const store = useGame.getState();
    store.questEvent({ type: "kill" });
    store.bumpKills();

    if (mob.kind === "colossus") {
      store.addItem("driftshard", 5, "mob");
      store.addGold(50, "mob");
      const { leveledTo } = store.addXp("combat", mob.xpReward);
      play("kill");
      store.pushLog(
        "THE COLOSSUS CRUMBLES. Loot: 5 Drift Shards + 50g.",
        "#e7c873",
      );
      if (leveledTo) store.pushLog(`Combat is now level ${leveledTo}!`, "#e7c873");
      return;
    }

    if (mob.kind === "raider") {
      const gold = 5 + Math.floor(Math.random() * 6);
      store.addGold(gold, "mob");
      const { leveledTo } = store.addXp("combat", mob.xpReward);
      play("kill");
      store.pushLog(`The raider falls. You loot ${gold}g from the body.`, "#e7c873");
      if (leveledTo) store.pushLog(`Combat is now level ${leveledTo}!`, "#e7c873");
      this.onRaiderKill?.();
      return;
    }

    store.addItem("driftshard", 1, "mob");
    let loot = "Drift Shard";
    if (Math.random() < 0.5) {
      store.addItem("hide", 1, "mob");
      loot += " + Beast Hide";
    }
    const { leveledTo } = store.addXp("combat", mob.xpReward);
    play("kill");
    store.pushLog(`The Drift Beast dissolves. Loot: ${loot}.`, "#a855f7");
    if (leveledTo) store.pushLog(`Combat is now level ${leveledTo}!`, "#e7c873");
  }

  private mobAttack(player: Player, mob: Mob) {
    const store = useGame.getState();
    const raw = mob.damage + Math.floor(Math.random() * 3);
    const dmg = Math.max(1, raw - damageReduction());
    const remaining = store.damage(dmg);
    play("hurt");
    this.onSelfHit?.(dmg);
    store.pushLog(`The Drift Beast hits you for ${dmg}.`, "#dc2626");
    if (remaining <= 0) this.onPlayerDeath(player);
  }

  private onPlayerDeath(player: Player) {
    const store = useGame.getState();
    play("death");
    store.bumpStat("deaths");
    this.onDeath?.(player.px, player.py);
    store.pushLog("The Drift takes you… you wake at the spawn.", "#dc2626");
    store.setHp(MAX_HP);
    player.px = SPAWN_CELL.x;
    player.py = SPAWN_CELL.y;
    player.path = [];
    player.action = "idle";
    this.disengage(player);
    this.onRespawn?.();
  }

  /** death from non-combat causes (corruption) — same flow, public entry */
  killPlayer(player: Player) {
    this.onPlayerDeath(player);
  }
}
