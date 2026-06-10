import { ITEM_META, ItemKey } from "@/game/types";
import { useGame } from "@/game/state/store";
import { play } from "@/game/audio/sound";

// Cooking & eating: closes the loop between fishing and combat. Raw Hollowfish
// cook into food at a campfire (free for now); eating food restores HP.

export function cookAllFish() {
  const store = useGame.getState();
  const raw = store.inventory.fish;
  if (raw <= 0) {
    store.pushLog("You have no raw fish to cook.", "#9aa0b0");
    return;
  }
  store.removeItem("fish", raw);
  store.addItem("cooked_fish", raw);
  store.questEvent({ type: "cook", qty: raw });
  play("craft");
  store.addXp("fishing", raw * 5);
  store.pushLog(`You cook ${raw} Hollowfish over the embers.`, "#e9a86b");
}

export function eat(item: ItemKey) {
  const store = useGame.getState();
  const meta = ITEM_META[item];
  if (!meta.heal) return;
  if (store.inventory[item] <= 0) return;
  const { hp, maxHp } = store.vitals;
  if (hp >= maxHp) {
    store.pushLog("You're already at full health.", "#9aa0b0");
    return;
  }
  store.removeItem(item, 1);
  play("eat");
  store.heal(meta.heal);
  store.pushLog(`You eat ${meta.label}. +${meta.heal} HP.`, "#4d7c4d");
}
