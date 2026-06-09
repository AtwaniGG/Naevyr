import { RESOURCE_META, ResourceNode, SKILL_META } from "@/game/types";
import { Player } from "@/game/entities/player";
import { World } from "@/game/world/tilemap";
import { Drift } from "@/game/world/drift";
import { useGame } from "@/game/state/store";
import { gatherSpeedMultiplier } from "@/game/systems/crafting";

// Gathering loop: when the player reaches a node, repeatedly perform the timed
// action — each success yields an item + XP and consumes a charge. When the
// node is exhausted it is handed to the Drift to relocate elsewhere.

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
    const store = useGame.getState();
    store.addItem(meta.item, 1);
    store.questEvent({ type: "gather", item: meta.item });
    const { leveledTo } = store.addXp(meta.skill, meta.xp);
    node.amount -= 1;

    store.pushLog(
      `+1 ${itemName(meta.item)}`,
      SKILL_META[meta.skill].color,
    );
    if (leveledTo) {
      store.pushLog(
        `${SKILL_META[meta.skill].label} is now level ${leveledTo}!`,
        "#e7c873",
      );
    }

    if (node.amount <= 0) {
      store.pushLog("The node crumbles into the Drift…", "#a855f7");
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
