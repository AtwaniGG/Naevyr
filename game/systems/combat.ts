import { Mob } from "@/game/entities/mob";
import { Player } from "@/game/entities/player";
import { World } from "@/game/world/tilemap";
import { useGame, MAX_HP } from "@/game/state/store";
import { weaponBonus, damageReduction } from "@/game/systems/crafting";
import { play } from "@/game/audio/sound";

// Combat system: owns the Drift Beasts, runs an auto-attack exchange while the
// player is engaged and adjacent, and handles loot, XP, death and respawns.

const PLAYER_ATTACK_MS = 1100;
const MOB_ATTACK_MS = 1500;
const SPAWN_CELL = { x: 20, y: 20 };

function cheby(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export class CombatManager {
  mobs: Mob[] = [];
  /** set by the engine in online mode — tells the server we respawned */
  onRespawn: (() => void) | null = null;
  /** juice hooks (floaters, sparks, shake) wired by the engine */
  onPlayerHit: ((mob: Mob, dmg: number) => void) | null = null;
  onSelfHit: ((dmg: number) => void) | null = null;
  private nextId = 1;

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
    for (const m of this.mobs) m.update(dt, world);

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

    // mob retaliates
    this.mobTimer -= dt * 1000;
    if (this.mobTimer <= 0) {
      this.mobTimer += MOB_ATTACK_MS;
      this.mobAttack(player, mob);
    }
  }

  private playerAttack(mob: Mob) {
    const store = useGame.getState();
    const lvl = store.skills.combat.level;
    const dmg =
      3 + Math.floor(lvl / 2) + weaponBonus() + Math.floor(Math.random() * 4);
    mob.hit(dmg);
    play("hit");
    this.onPlayerHit?.(mob, dmg);
    store.addXp("combat", 4);
    store.pushLog(`You strike the Drift Beast for ${dmg}.`, "#e7c873");
    if (mob.state === "dead") this.onKill(mob);
  }

  private onKill(mob: Mob) {
    const store = useGame.getState();
    store.questEvent({ type: "kill" });
    store.bumpKills();
    store.addItem("driftshard", 1);
    let loot = "Drift Shard";
    if (Math.random() < 0.5) {
      store.addItem("hide", 1);
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
    store.pushLog("The Drift takes you… you wake at the spawn.", "#dc2626");
    store.setHp(MAX_HP);
    player.px = SPAWN_CELL.x;
    player.py = SPAWN_CELL.y;
    player.path = [];
    player.action = "idle";
    this.disengage(player);
    this.onRespawn?.();
  }
}
