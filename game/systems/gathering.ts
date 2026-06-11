import { RESOURCE_META, ResourceKind, ResourceNode, SKILL_META } from "@/game/types";
import { Player } from "@/game/entities/player";
import { World } from "@/game/world/tilemap";
import { Drift } from "@/game/world/drift";
import { useGame } from "@/game/state/store";
import { gatherSpeedMultiplier } from "@/game/systems/crafting";
import { play } from "@/game/audio/sound";

const GATHER_SFX = { tree: "chop", rock: "mine", fish: "splash" } as const;

// Gathering loop: when the player reaches a node, repeatedly perform the timed
// action — each success yields an item + XP and consumes a charge. When the
// node is exhausted it is handed to the Drift to relocate elsewhere.
// Online, the server runs the timers and sends "loot" events; only
// applyGatherLoot runs locally (inventory/XP stay client-side until Phase 4).

/**
 * Apply one successful gather swing to local state (item, XP, quest, log).
 * Online the server rolls rich strikes and grants the ledger; the message
 * carries qty/rich. Offline (no args) the local sim rolls its own.
 */
export function applyGatherLoot(
  kind: ResourceKind,
  depleted: boolean,
  qtyIn?: number,
  richIn?: boolean,
) {
  const meta = RESOURCE_META[kind];
  const store = useGame.getState();
  // server-granted loot is already on the ledger (invSync carries the count);
  // only the offline sim adds the item itself
  const ledgered = qtyIn != null;
  // rich strike: 10% chance the swing yields double
  const rich = richIn ?? Math.random() < 0.1;
  const qty = qtyIn ?? (rich ? 2 : 1);
  play(rich ? "rich" : GATHER_SFX[kind]);
  if (!ledgered) store.addItem(meta.item, qty);
  store.bumpStat("gathered", qty);
  store.questEvent({ type: "gather", item: meta.item });
  const { leveledTo } = store.addXp(meta.skill, rich ? meta.xp * 2 : meta.xp);
  store.pushLog(
    rich ? `RICH STRIKE! +${qty} ${itemName(meta.item)}!` : `+1 ${itemName(meta.item)}`,
    rich ? "#fcd34d" : SKILL_META[meta.skill].color,
  );
  if (leveledTo) {
    store.pushLog(
      `${SKILL_META[meta.skill].label} is now level ${leveledTo}!`,
      "#e7c873",
    );
  }
  if (depleted) {
    store.pushLog("The node crumbles into the Drift…", "#a855f7");
  }
}

export function startGathering(
  world: World,
  player: Player,
  drift: Drift,
  node: ResourceNode,
) {
  const meta = RESOURCE_META[node.kind];

  const tick = () => {
    // node may have been depleted/relocated between swings
    if (node.amount <= 0 || node.regrowIn > 0) {
      player.cancelGather();
      return;
    }
    node.amount -= 1;
    applyGatherLoot(node.kind, node.amount <= 0);

    if (node.amount <= 0) {
      drift.depleteNode(world, node.gx, node.gy);
      player.cancelGather();
      return;
    }
    // keep swinging
    player.beginGather(node, meta.actionMs * gatherSpeedMultiplier(), tick);
  };

  player.beginGather(node, meta.actionMs * gatherSpeedMultiplier(), tick);
}

function itemName(item: string) {
  return item.charAt(0).toUpperCase() + item.slice(1);
}
