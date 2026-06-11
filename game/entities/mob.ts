import { World } from "@/game/world/tilemap";
import { isoFacingFromDelta } from "@/game/entities/player";
import { BeastKind, IsoFacing } from "@/game/render/sprites";

// Drift Beasts: corrupted creatures that wander their territory. They don't
// hunt the player — they only retaliate while engaged (handled by the combat
// system) — so the player can always disengage by walking away.

export type MobState = "wander" | "engaged" | "dead";

export class Mob {
  id: number;
  px: number;
  py: number;
  spawnX: number;
  spawnY: number;
  hp: number;
  maxHp: number;
  level: number;
  damage: number;
  xpReward: number;

  state: MobState = "wander";
  /** which beast sprite this mob renders with */
  kind: BeastKind;
  facing = 1;
  isoFacing: IsoFacing = "s";
  isoMirror = false;
  /** true while actually drifting toward a wander target (drives walk anim) */
  moving = false;
  /** seconds since death — drives the death animation */
  deathT = 0;
  speed = 1.4;
  /** den-pack elites don't respawn on their own; the den re-seeds them */
  persistDeath = false;
  bob = 0;
  phase = Math.random() * Math.PI * 2;
  hurtFlash = 0;

  private tx: number;
  private ty: number;
  private idle = 0;
  private wanderRadius = 4;
  respawnIn = 0;

  constructor(id: number, gx: number, gy: number, level = 1, kind?: BeastKind) {
    this.id = id;
    this.px = this.tx = this.spawnX = gx;
    this.py = this.ty = this.spawnY = gy;
    this.level = level;
    this.kind = kind ?? (level >= 3 ? "stalker" : "husk");
    this.maxHp = 14 + level * 4;
    this.hp = this.maxHp;
    this.damage = 2 + level;
    this.xpReward = 14 + level * 6;
  }

  get cell() {
    return { x: Math.round(this.px), y: Math.round(this.py) };
  }

  hit(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    this.hurtFlash = 180;
    if (this.hp <= 0) this.die();
  }

  private die() {
    this.state = "dead";
    this.deathT = 0;
    // a slain Colossus stays slain; raiders die with their ambush; beasts respawn
    this.respawnIn =
      this.kind === "colossus" || this.kind === "raider" || this.persistDeath
        ? Number.POSITIVE_INFINITY
        : 6000 + Math.random() * 4000;
  }

  updateIsoFacing(dx: number, dy: number) {
    const r = isoFacingFromDelta(dx, dy);
    if (!r) return;
    this.isoFacing = r.f;
    this.isoMirror = r.m;
  }

  respawn() {
    this.px = this.tx = this.spawnX;
    this.py = this.ty = this.spawnY;
    this.hp = this.maxHp;
    this.state = "wander";
    this.idle = 0;
  }

  update(dt: number, world: World) {
    if (this.hurtFlash > 0) this.hurtFlash -= dt * 1000;
    this.phase += dt;

    if (this.state === "dead") {
      this.deathT += dt;
      this.respawnIn -= dt * 1000;
      if (this.respawnIn <= 0) this.respawn();
      return;
    }

    if (this.state === "engaged") {
      // hold position; facing handled by combat system
      this.moving = false;
      this.bob += dt * 4;
      return;
    }

    // wander: drift toward a random nearby target
    const dx = this.tx - this.px;
    const dy = this.ty - this.py;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.1) {
      this.moving = false;
      this.idle -= dt;
      if (this.idle <= 0) this.pickTarget(world);
    } else {
      const step = this.speed * dt;
      this.facing = dx >= 0 ? 1 : -1;
      this.moving = true;
      this.updateIsoFacing(dx, dy);
      this.px += (dx / dist) * Math.min(step, dist);
      this.py += (dy / dist) * Math.min(step, dist);
      this.bob += dt * 6;
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
