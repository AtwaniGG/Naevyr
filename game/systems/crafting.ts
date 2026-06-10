import { ITEM_META, ItemKey, Recipe } from "@/game/types";
import { useGame } from "@/game/state/store";
import { play } from "@/game/audio/sound";

// Crafting: spend gathered materials to forge equipment. Equipment is
// slot-based (weapon/tool/ward); crafting auto-equips if the new piece is a
// higher tier than what's worn.

export type CraftCheck =
  | { ok: true }
  | { ok: false; reason: string };

export function canCraft(recipe: Recipe): CraftCheck {
  const { inventory, skills, equipment } = useGame.getState();
  const worn = equipment[recipe.result.slot];
  if (worn && worn.tier >= recipe.result.tier) {
    return { ok: false, reason: "Already equipped (same tier or better)" };
  }
  if (recipe.reqCombat && skills.combat.level < recipe.reqCombat) {
    return { ok: false, reason: `Requires Combat level ${recipe.reqCombat}` };
  }
  for (const [item, qty] of Object.entries(recipe.cost)) {
    if (inventory[item as ItemKey] < (qty ?? 0)) {
      return { ok: false, reason: `Needs ${qty}× ${ITEM_META[item as ItemKey].label}` };
    }
  }
  return { ok: true };
}

export function craft(recipe: Recipe): boolean {
  const check = canCraft(recipe);
  const store = useGame.getState();
  if (!check.ok) {
    store.pushLog(`Can't craft: ${check.reason}.`, "#9aa0b0");
    return false;
  }
  for (const [item, qty] of Object.entries(recipe.cost)) {
    store.removeItem(item as ItemKey, qty ?? 0);
  }
  store.equip(recipe.result);
  play("craft");
  store.pushLog(
    `Forged ${recipe.result.label} (${recipe.result.flavor}).`,
    "#e7c873",
  );
  return true;
}

// ---- equipment effects (read by combat & gathering) -------------------------

export function weaponBonus(): number {
  const s = useGame.getState();
  const boneale = s.buffs.damage > Date.now() ? 1 : 0;
  return (s.equipment.weapon?.power ?? 0) + boneale;
}

/** multiplier applied to gather action time (lower = faster) */
export function gatherSpeedMultiplier(): number {
  const s = useGame.getState();
  const pct = s.equipment.tool?.power ?? 0;
  const emberwine = s.buffs.gather > Date.now() ? 0.85 : 1;
  return (1 / (1 + pct / 100)) * emberwine;
}

export function damageReduction(): number {
  return useGame.getState().equipment.ward?.power ?? 0;
}
