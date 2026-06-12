// THE THRESHOLD — the first-login tutorial pocket world.
// A client-local lesson that runs BEFORE the server join (same trick as the
// interiors: the offline sim IS the engine). A handcrafted 14×8 map, a hooded
// Gatewarden, six sworn lessons, and the Drift visibly eating the path behind
// the wanderer until the exit gate opens. Completing (or skipping) sets
// store.tutorialDone; /play watches the flag and remounts into the realm.

import { World } from "@/game/world/tilemap";
import { Player } from "@/game/entities/player";
import { CombatManager } from "@/game/systems/combat";
import { useGame } from "@/game/state/store";
import { spriteCache } from "@/game/render/sprites";
import { play } from "@/game/audio/sound";

// the lesson ground, all coordinates fixed
export const THRESHOLD = {
  w: 14,
  h: 8,
  spawn: { x: 1, y: 4 },
  beacon: { x: 3, y: 4 },
  tree: { x: 4, y: 2 },
  rock: { x: 5, y: 6 },
  // the pool sits NW-of-center, clear of the tall gate's screen footprint
  pond: [
    { x: 6, y: 1 }, { x: 7, y: 1 },
    { x: 6, y: 2 }, { x: 7, y: 2 },
  ],
  fish: { x: 7, y: 3 },
  huskAround: { x: 9, y: 4 },
  warden: { x: 12, y: 6 },
  gate: { x: 12, y: 4 }, // pulled off the east edge so the sprite base sits on the map
  gateApproach: { x: 11, y: 4 }, // the tile the player walks to (beacon goes here, not under the gate)
};

/** worn flagstone accents (x, y, variant) scattered on the path + gate court */
const TUTORIAL_ACCENTS: [number, number, number][] = [
  [2, 4, 0], [5, 4, 1], [8, 4, 0], [10, 4, 1],
  [11, 3, 0], [12, 5, 1], [11, 5, 0],
];

/** carve the Threshold out of a fresh (generated) world */
export function buildThreshold(world: World) {
  world.clearNodes();
  for (let y = 0; y < world.h; y++) {
    for (let x = 0; x < world.w; x++) world.setTile(x, y, "grass");
  }
  for (let x = 0; x < world.w; x++) world.setTile(x, 4, "dirt"); // the lesson path
  // packed-earth court under the gate: the gate's pale-stone foundation slab
  // reads best on dirt, and the court frames the exit
  for (let dy = -1; dy <= 2; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = THRESHOLD.gate.x + dx;
      const y = THRESHOLD.gate.y + dy;
      if (world.inBounds(x, y)) world.setTile(x, y, "dirt");
    }
  }
  for (const p of THRESHOLD.pond) world.setTile(p.x, p.y, "water");
  world.addNode("tree", THRESHOLD.tree.x, THRESHOLD.tree.y);
  world.addNode("rock", THRESHOLD.rock.x, THRESHOLD.rock.y);
  world.addNode("fish", THRESHOLD.fish.x, THRESHOLD.fish.y);
}

interface Step {
  objective: string;
  warden: string;
  /** a plain one-line explanation of WHY this matters (basic, no lore) */
  explain?: string;
  onEnter?: (d: TutorialDirector) => void;
  done: (d: TutorialDirector) => boolean;
  /** the cell a guiding beacon hovers over for this step (null = no world target) */
  target?: (d: TutorialDirector) => { x: number; y: number } | null;
}

const at = (px: number, py: number, c: { x: number; y: number }, r = 0) =>
  Math.max(Math.abs(Math.round(px) - c.x), Math.abs(Math.round(py) - c.y)) <= r;

const STEPS: Step[] = [
  {
    objective: "Walk to the gold arrow (click the ground beneath it)",
    warden: "So the door let another one through. Follow the mark; the realm only respects motion.",
    explain: "Click any ground tile to walk there. The minimap (top right) shows where you stand.",
    target: () => THRESHOLD.beacon,
    done: (d) => at(d.player.px, d.player.py, THRESHOLD.beacon, 1),
  },
  {
    objective: "Chop the marked tree for Driftwood (click it)",
    warden: "Everything you will ever build starts as something you took. The tree first.",
    explain: "Gathering raises your skills. Higher skill means faster swings and richer hauls.",
    target: () => THRESHOLD.tree,
    onEnter: (d) => (d.base.wood = useGame.getState().inventory.wood),
    done: (d) => useGame.getState().inventory.wood > d.base.wood,
  },
  {
    objective: "Mine the marked stone (click it)",
    warden: "Stone next. The Drift eats wood faster.",
    explain: "Wood and stone feed the Forge: gear, tools and props all start as materials.",
    target: () => THRESHOLD.rock,
    onEnter: (d) => (d.base.stone = useGame.getState().inventory.stone),
    done: (d) => useGame.getState().inventory.stone > d.base.stone,
  },
  {
    objective: "Catch a Hollowfish at the marked pool (click it)",
    warden: "The pool is older than the realm. What you pull out of it is food, mostly.",
    explain: "Hollowfish are the realm's catch: cooked, they restore your hearts; spare ones sell for gold at the market. Fishing is a skill too, and it grows like the others.",
    target: () => THRESHOLD.fish,
    onEnter: (d) => (d.base.fish = useGame.getState().inventory.fish),
    done: (d) => useGame.getState().inventory.fish > d.base.fish,
  },
  {
    objective: "Open the Satchel (top right) and press COOK",
    warden: "Raw Hollowfish is a mistake you make once. The Satchel knows fire.",
    explain: "Cooked fish heals when you eat it from the Satchel. Raw fish does nothing.",
    onEnter: (d) => (d.base.cooked = useGame.getState().inventory.cooked_fish),
    done: (d) => useGame.getState().inventory.cooked_fish > d.base.cooked,
  },
  {
    objective: "A husk crawls from the Drift. Put it down (click it)",
    warden: "Behind you. A husk: what the Drift leaves of the ones who stopped moving.",
    explain: "Husks are wanderers the Drift hollowed out. Click one to fight it; each kill pays gold and combat experience, and some drop hide or drift shards for the Forge. The purple ground is the Drift itself: it spreads every season, and standing on it hurts.",
    target: (d) => {
      const husk = d.combat.mobs.find((m) => m.state !== "dead");
      return husk ? { x: Math.round(husk.px), y: Math.round(husk.py) } : THRESHOLD.huskAround;
    },
    onEnter: (d) => {
      d.base.kills = useGame.getState().kills;
      d.combat.spawnPackAt(d.world, THRESHOLD.huskAround.x, THRESHOLD.huskAround.y, 1, 1);
      play("kill");
    },
    done: (d) => useGame.getState().kills > d.base.kills,
  },
  {
    objective: "Another husk rises. Put that one down too",
    warden: "They rarely come alone. Again, wanderer; the second swing should feel easier than the first.",
    explain: "Your combat skill grew with that kill. Higher combat means harder swings; the Forge's blades and wards stack on top of it.",
    target: (d) => {
      const husk = d.combat.mobs.find((m) => m.state !== "dead");
      return husk ? { x: Math.round(husk.px), y: Math.round(husk.py) } : THRESHOLD.huskAround;
    },
    onEnter: (d) => {
      d.base.kills = useGame.getState().kills;
      d.combat.spawnPackAt(d.world, THRESHOLD.huskAround.x, THRESHOLD.huskAround.y, 1, 1);
      play("kill");
    },
    done: (d) => useGame.getState().kills > d.base.kills,
  },
  {
    objective: "The Threshold opens. Step through the gate",
    warden: "That is the whole of it: take, make, fight, and never stand still. Go. The realm is louder than I am.",
    target: () => THRESHOLD.gateApproach,
    onEnter: (d) => {
      d.gateOpen = true;
      // a basic briefing on what waits beyond, before the realm gets loud
      const s = useGame.getState();
      s.pushLog("Beyond the gate stands the Waystation: shops, a vault for your gold, a wheel, a shrine.", "#d8cfe0");
      s.pushLog("Gold is the realm's coin. Gathering, beasts and caravans pay it; gear, claims and drinks take it.", "#d8cfe0");
      s.pushLog("DRIFTS is the realm's token. Holding it sets your standing; burning it works the rites.", "#d8cfe0");
      s.pushLog("You will not wander alone. Others share the realm: trade with them, or duel them in the Pit.", "#d8cfe0");
      s.pushLog("The Drift eats the map season by season. Outlast it. That is the game.", "#a855f7");
    },
    done: (d) => at(d.player.px, d.player.py, THRESHOLD.gate, 1),
  },
];

export class TutorialDirector {
  world: World;
  player: Player;
  combat: CombatManager;
  gateOpen = false;
  /** per-step baselines (counts before the lesson started) */
  base = { wood: 0, stone: 0, fish: 0, cooked: 0, kills: 0 };
  private step = -1;
  private finished = false;
  private driftCols = 0; // columns the scripted Drift has eaten, from the west

  constructor(world: World, player: Player, combat: CombatManager) {
    this.world = world;
    this.player = player;
    this.combat = combat;
  }

  start() {
    const s = useGame.getState();
    s.pushLog("The Threshold. A sliver of realm between the door and the Drift.", "#d8cfe0");
    this.advance();
  }

  private advance() {
    this.step++;
    if (this.step >= STEPS.length) return this.finish();
    const st = STEPS[this.step];
    st.onEnter?.(this);
    const s = useGame.getState();
    s.setTutorialObjective(st.objective);
    s.pushLog(`Gatewarden: ${st.warden}`, "#e7c873");
    if (st.explain) s.pushLog(st.explain, "#9b93ad");
    // the Drift takes another column of the path behind you, lesson by lesson
    if (this.step >= 2) this.eatColumn();
  }

  private eatColumn() {
    const x = this.driftCols++;
    if (x >= THRESHOLD.beacon.x) return; // the lesson ground stays standing
    for (let y = 0; y < this.world.h; y++) {
      if (this.world.tile(x, y) !== "water") this.world.setTile(x, y, "corrupt");
    }
    useGame.getState().pushLog("Behind you, the Drift takes the ground you came from.", "#a855f7");
  }

  update() {
    if (this.finished || this.step < 0 || this.step >= STEPS.length) return;
    if (STEPS[this.step].done(this)) {
      play("coin");
      this.advance();
    }
  }

  private finish() {
    this.finished = true;
    const s = useGame.getState();
    s.setTutorialObjective(null);
    s.addGold(50);
    s.pushLog("The Gatewarden presses 50g into your hand. The gate takes you.", "#e7c873");
    s.setTutorialDone(true); // /play watches this and mounts the realm
  }

  /** scene extras: the Gatewarden, the beacon, the gate, the Drift wall (all DS Threshold set) */
  pushDraws(
    draws: { depth: number; fn: () => void }[],
    ctx: CanvasRenderingContext2D,
    tileScreen: (gx: number, gy: number) => { x: number; y: number },
    zoom: number,
  ) {
    const z = zoom;

    // pale flagstone accents worn into the lesson path + the gate court
    for (const [ax, ay, v] of TUTORIAL_ACCENTS) {
      draws.push({
        depth: ax + ay - 0.7, // ground overlay: under anything standing on the tile
        fn: () => {
          const s = tileScreen(ax, ay);
          spriteCache.drawThresholdTile(ctx, v, s.x, s.y, z);
        },
      });
    }

    // the Threshold gate (sealed runes smolder; open pours Drift light)
    const g = THRESHOLD.gate;
    draws.push({
      depth: g.x + g.y,
      fn: () => {
        const s = tileScreen(g.x, g.y);
        const frame = Math.floor(performance.now() / 250) % 3; // 4fps rune pulse
        spriteCache.drawThresholdGate(ctx, this.gateOpen, frame, s.x, s.y, z);
      },
    });

    // the Drift wall: a boiling front standing on the last column the Drift took
    if (this.driftCols > 0) {
      const fx = this.driftCols - 1;
      for (let fy = 0; fy < this.world.h; fy++) {
        draws.push({
          depth: fx + fy + 0.4, // in front of its corrupt tile, behind everything east
          fn: () => {
            const s = tileScreen(fx, fy);
            const frame = Math.floor(performance.now() / 167) % 3; // 6fps boil
            spriteCache.drawDriftWall(ctx, frame, s.x, s.y, z);
          },
        });
      }
    }

    // the Gatewarden: hooded, gold-eyed, staff chained with a drift mote
    const w = THRESHOLD.warden;
    draws.push({
      depth: w.x + w.y,
      fn: () => {
        const s = tileScreen(w.x, w.y);
        const frame = Math.floor(performance.now() / 500) % 2;
        spriteCache.drawGatewarden(ctx, "s", frame, s.x, s.y, z);
        ctx.textAlign = "center";
        ctx.font = `${8 * z}px ui-sans-serif`;
        ctx.fillStyle = "rgba(10,8,16,0.75)";
        ctx.fillText("the Gatewarden", s.x + 1, s.y - 46 * z + 1);
        ctx.fillStyle = "rgba(231,200,115,0.9)";
        ctx.fillText("the Gatewarden", s.x, s.y - 46 * z);
      },
    });

    // the objective beacon over the CURRENT target: rune-scribed tile + rising
    // gold light (under whatever stands on the tile) + a bobbing arrow on top
    const tgt = this.step >= 0 && this.step < STEPS.length
      ? STEPS[this.step].target?.(this)
      : null;
    if (tgt) {
      draws.push({
        depth: tgt.x + tgt.y - 0.5, // the marked tree/rock/pool stays readable
        fn: () => {
          const s = tileScreen(tgt.x, tgt.y);
          const frame = Math.floor(performance.now() / 333) % 3; // 3fps pulse
          spriteCache.drawBeacon(ctx, frame, s.x, s.y, z);
        },
      });
      draws.push({
        depth: 9999, // the arrow always finds the eye
        fn: () => {
          const s = tileScreen(tgt.x, tgt.y);
          const frame = Math.floor(performance.now() / 333) % 2;
          spriteCache.drawArrowPip(ctx, frame, s.x, s.y - 52 * z, z);
        },
      });
    }
  }
}
