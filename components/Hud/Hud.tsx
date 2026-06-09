"use client";

import { useState } from "react";
import { useGame, xpForLevel, QuestState } from "@/game/state/store";
import {
  EquipSlot,
  INVENTORY_ORDER,
  ITEM_META,
  ItemKey,
  RECIPES,
  SKILL_META,
  SkillKey,
  seasonName,
} from "@/game/types";
import { cookAllFish, eat } from "@/game/systems/cooking";
import { canCraft, craft } from "@/game/systems/crafting";
import {
  ActivityLog,
  Badge,
  Button,
  Hotbar,
  Icon,
  IconName,
  Panel,
  SeasonBadge,
  Slot,
  XPBar,
} from "@/components/ds";

// pixel-icon mapping for items / skills / recipes (no emoji — design rule)
const ITEM_ICON: Record<ItemKey, IconName> = {
  wood: "log",
  stone: "ore",
  fish: "fish",
  cooked_fish: "fish",
  driftshard: "drift",
  hide: "bag",
};

const SKILL_ICON: Record<SkillKey, IconName> = {
  woodcutting: "axe",
  mining: "pickaxe",
  fishing: "rod",
  combat: "sword",
};

const RECIPE_ICON: Record<string, IconName> = {
  bone_blade: "sword",
  shard_saber: "sword",
  keen_tools: "axe",
  shardtooth_tools: "pickaxe",
  hide_ward: "ward",
  drift_sigil: "sigil",
};

const QUEST_ICON: Record<string, IconName> = {
  chop_wood: "axe",
  mine_stone: "pickaxe",
  catch_fish: "rod",
  slay_beasts: "sword",
  cook_fish: "bolt",
};

const HOTBAR_TOOLS: { slot: number; icon: IconName; name: string; locked?: boolean }[] = [
  { slot: 1, icon: "axe", name: "Axe" },
  { slot: 2, icon: "pickaxe", name: "Pickaxe" },
  { slot: 3, icon: "rod", name: "Rod" },
  { slot: 4, icon: "sword", name: "Sword" },
  { slot: 5, icon: "ward", name: "Ward", locked: true },
  { slot: 6, icon: "sigil", name: "Sigil", locked: true },
];

export default function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none" style={{ zIndex: 10 }}>
      <div className="drift-scrim" />
      <TopLeft />
      <Satchel />
      <SkillsPanel />
      <ActivityPanel />
      <HotbarDock />
      <ForgeDock />
    </div>
  );
}

// ---- top-left: wordmark + season + vitals + quests --------------------------

function TopLeft() {
  const season = useGame((s) => s.driftSeason);
  const driftPct = useGame((s) => s.driftPct);
  return (
    <div
      className="absolute flex flex-col items-start"
      style={{ top: "var(--hud-edge)", left: "var(--hud-edge)", gap: 10 }}
    >
      <div
        className="drift-wordmark drift-wordmark-bleed drift-hud-text"
        style={{ fontSize: "var(--text-xl)", lineHeight: 1, textShadow: "none" }}
      >
        DRIFTLANDS
      </div>
      <SeasonBadge season={season} name={seasonName(season)} driftPct={driftPct} />
      <Vitals />
      <QuestBoard />
    </div>
  );
}

function Vitals() {
  const { hp, maxHp } = useGame((s) => s.vitals);
  const gold = useGame((s) => s.gold);
  const hearts = 5;
  const filled = Math.ceil((hp / maxHp) * hearts);
  return (
    <Panel padded={false} corners={false} className="pointer-events-auto" style={{ padding: "8px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", gap: 3 }} title={`Vitality ${hp} / ${maxHp}`}>
          {Array.from({ length: hearts }, (_, i) => (
            <Icon key={i} name="heart" size={16} style={{ opacity: i < filled ? 1 : 0.18 }} />
          ))}
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} title="Gold">
          <Icon name="coin" size={16} glow />
          <span
            className="drift-num drift-hud-text"
            style={{ fontWeight: 700, fontSize: 15, color: "var(--drift-gold)" }}
          >
            {gold.toLocaleString()}
          </span>
        </span>
      </div>
    </Panel>
  );
}

function QuestBoard() {
  const quests = useGame((s) => s.quests);
  const claimQuest = useGame((s) => s.claimQuest);
  return (
    <Panel kicker="Dailies" title="Quest Board" className="pointer-events-auto" style={{ width: 248 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {quests.map((q: QuestState) => {
          const done = q.progress >= q.def.target;
          const pct = Math.min(100, (q.progress / q.def.target) * 100);
          return (
            <div key={q.def.id} style={{ opacity: q.claimed ? 0.4 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name={QUEST_ICON[q.def.id] ?? "drift"} size={16} />
                <span
                  style={{
                    flex: 1,
                    font: "400 12px/1.3 var(--font-ui)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {q.def.label}
                </span>
                <span className="drift-num" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {q.progress}/{q.def.target}
                </span>
              </div>
              <div
                className="drift-well"
                style={{ position: "relative", height: 6, marginTop: 5, overflow: "hidden" }}
              >
                <span
                  style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`,
                    background: "var(--grad-xp)",
                    transition: "width var(--dur-slow) steps(8)",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <span className="drift-num" style={{ fontSize: 10, color: "var(--drift-gold)" }}>
                  +{q.def.goldReward}g · +{q.def.xpReward.xp} XP
                </span>
                {q.claimed ? (
                  <span className="drift-label" style={{ fontSize: 9, color: "var(--text-muted)" }}>
                    Claimed
                  </span>
                ) : done ? (
                  <Button size="sm" variant="gold" onClick={() => claimQuest(q.def.id)}>
                    Claim
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---- top-right: satchel ------------------------------------------------------

function Satchel() {
  const inv = useGame((s) => s.inventory);
  const sellItem = useGame((s) => s.sellItem);
  const rawFish = inv.fish;
  const [trading, setTrading] = useState(false);
  const carried = INVENTORY_ORDER.reduce((n, k) => n + inv[k], 0);

  return (
    <div
      className="absolute pointer-events-auto"
      style={{ top: "var(--hud-edge)", right: "var(--hud-edge)" }}
    >
      <Panel
        kicker="Satchel"
        title="Inventory"
        accessory={<Badge tone="neutral">{carried} carried</Badge>}
        style={{ width: 232 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--slot-gap)" }}>
          {INVENTORY_ORDER.map((key) => {
            const meta = ITEM_META[key];
            const count = inv[key];
            const edible = !!meta.heal && count > 0;
            return (
              <Slot
                key={key}
                size={62}
                icon={
                  <Icon
                    name={ITEM_ICON[key]}
                    size={32}
                    glow={key === "driftshard"}
                    style={
                      key === "cooked_fish"
                        ? { filter: "drop-shadow(0 0 1px #f59e0b) sepia(0.4) saturate(1.4) hue-rotate(-28deg)" }
                        : undefined
                    }
                  />
                }
                count={count > 0 ? count : null}
                rarity={key === "driftshard" ? "epic" : edible ? "uncommon" : null}
                disabled={count <= 0}
                style={{ opacity: count > 0 ? 1 : 0.4 }}
                title={
                  meta.heal
                    ? `${meta.label} — eat to restore ${meta.heal} vitality`
                    : `${meta.label} — sells for ${meta.sellValue}g`
                }
                onClick={() => edible && eat(key)}
              />
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <Button
            size="sm"
            variant="ghost"
            disabled={rawFish <= 0}
            onClick={() => cookAllFish()}
            iconLeft={<Icon name="bolt" size={12} />}
          >
            Cook{rawFish > 0 ? ` x${rawFish}` : ""}
          </Button>
          <Button
            size="sm"
            variant={trading ? "gold" : "ghost"}
            onClick={() => setTrading((t) => !t)}
            iconLeft={<Icon name="coin" size={12} />}
          >
            Trade
          </Button>
        </div>
      </Panel>

      {trading && (
        <Panel kicker="Wandering Trader" title="Sell" style={{ width: 232, marginTop: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {INVENTORY_ORDER.map((key) => {
              const meta = ITEM_META[key];
              const count = inv[key];
              return (
                <button
                  key={key}
                  disabled={count <= 0}
                  onClick={() => sellItem(key, count, meta.sellValue)}
                  className="drift-well"
                  style={{
                    display: "flex", alignItems: "center", gap: 8, border: 0,
                    padding: "5px 8px", cursor: count > 0 ? "pointer" : "default",
                    opacity: count > 0 ? 1 : 0.35,
                  }}
                  title={count > 0 ? `Sell all ${meta.label}` : meta.label}
                >
                  <Icon name={ITEM_ICON[key]} size={16} />
                  <span style={{ flex: 1, textAlign: "left", font: "400 12px/1 var(--font-ui)", color: "var(--text-secondary)" }}>
                    {meta.label} <span className="drift-num">x{count}</span>
                  </span>
                  <span className="drift-num" style={{ fontSize: 11, color: "var(--drift-gold)" }}>
                    {count * meta.sellValue}g
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}

// ---- bottom-left: skills -----------------------------------------------------

function SkillsPanel() {
  const skills = useGame((s) => s.skills);
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ bottom: "var(--hud-edge)", left: "var(--hud-edge)" }}
    >
      <Panel kicker="Skills" title="Gathering & War" style={{ width: 264 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {(Object.keys(SKILL_META) as SkillKey[]).map((key) => {
            const st = skills[key];
            const meta = SKILL_META[key];
            const floor = xpForLevel(st.level);
            const next = xpForLevel(st.level + 1);
            return (
              <XPBar
                key={key}
                skill={meta.label}
                level={st.level}
                value={st.xp - floor}
                max={next - floor}
                color={meta.color}
                icon={<Icon name={SKILL_ICON[key]} size={16} />}
              />
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ---- bottom-right: activity --------------------------------------------------

function ActivityPanel() {
  const log = useGame((s) => s.log);
  const entries = [...log].reverse();
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ bottom: "var(--hud-edge)", right: "var(--hud-edge)" }}
    >
      <Panel kicker="Realm" title="Activity" style={{ width: 264 }}>
        <ActivityLog entries={entries} max={7} />
      </Panel>
    </div>
  );
}

// ---- bottom-center: hotbar ----------------------------------------------------

function HotbarDock() {
  const hotbar = useGame((s) => s.hotbar);
  const setHotbar = useGame((s) => s.setHotbar);
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ bottom: "var(--hud-edge)", left: "50%", transform: "translateX(-50%)" }}
    >
      <Hotbar
        selected={hotbar - 1}
        onSelect={(i) => !HOTBAR_TOOLS[i].locked && setHotbar(i + 1)}
        slots={HOTBAR_TOOLS.map((t) => ({
          icon: <Icon name={t.icon} size={32} style={t.locked ? { opacity: 0.5, filter: "grayscale(0.8)" } : undefined} />,
          name: t.locked ? `${t.name} — sealed for now` : t.name,
          disabled: t.locked,
        }))}
      />
    </div>
  );
}

// ---- right-middle: the Forge ---------------------------------------------------

function ForgeDock() {
  const [open, setOpen] = useState(false);
  const inventory = useGame((s) => s.inventory);
  const skills = useGame((s) => s.skills);
  const equipment = useGame((s) => s.equipment);
  // subscribing keeps canCraft() fresh as materials/levels change
  void inventory;
  void skills;

  return (
    <div
      className="absolute pointer-events-auto"
      style={{ right: "var(--hud-edge)", top: "50%", transform: "translateY(-50%)" }}
    >
      <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Button
          variant={open ? "primary" : "ghost"}
          size="md"
          onClick={() => setOpen((o) => !o)}
          iconLeft={<Icon name="sigil" size={16} glow={open} />}
        >
          Forge
        </Button>

        {open && (
          <Panel kicker="The Forge" title="Smithing" style={{ width: 296 }}>
            {/* equipped */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["weapon", "tool", "ward"] as EquipSlot[]).map((slot) => {
                const item = equipment[slot];
                return (
                  <div
                    key={slot}
                    className="drift-well"
                    style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 2, padding: "6px 4px",
                    }}
                    title={item ? `${item.label} — ${item.flavor}` : `No ${slot} equipped`}
                  >
                    {item ? (
                      <Icon name={RECIPE_ICON[item.id] ?? "sword"} size={20} />
                    ) : (
                      <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>·</span>
                    )}
                    <span className="drift-label" style={{ fontSize: 8 }}>{slot}</span>
                    <span className="drift-num" style={{ fontSize: 9, color: "var(--drift-gold)" }}>
                      {item ? item.flavor : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* recipes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto", paddingRight: 2 }}>
              {RECIPES.map((r) => {
                const check = canCraft(r);
                const costStr = Object.entries(r.cost)
                  .map(([k, q]) => `${q} ${ITEM_META[k as ItemKey].label}`)
                  .join(" · ");
                return (
                  <button
                    key={r.result.id}
                    disabled={!check.ok}
                    onClick={() => craft(r)}
                    className="drift-well"
                    title={check.ok ? `Forge ${r.result.label}` : check.reason}
                    style={{
                      display: "block", width: "100%", textAlign: "left", border: 0,
                      padding: "7px 9px", cursor: check.ok ? "pointer" : "default",
                      opacity: check.ok ? 1 : 0.45,
                      boxShadow: check.ok ? "var(--bevel-slot), inset 0 0 0 1px var(--gold-lo)" : undefined,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Icon name={RECIPE_ICON[r.result.id] ?? "sword"} size={16} />
                      <span style={{ flex: 1, font: "600 12px/1 var(--font-ui)", color: "var(--text-primary)" }}>
                        {r.result.label}
                      </span>
                      <span className="drift-num" style={{ fontSize: 10, color: "var(--drift-gold)" }}>
                        {r.result.flavor}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, font: "400 10px/1.3 var(--font-ui)", color: "var(--text-muted)" }}>
                      {costStr}
                      {r.reqCombat ? ` · Combat ${r.reqCombat}+` : ""}
                    </div>
                    {!check.ok && (
                      <div style={{ marginTop: 2, font: "400 10px/1.2 var(--font-ui)", color: "var(--blood-hi)" }}>
                        {check.reason}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
