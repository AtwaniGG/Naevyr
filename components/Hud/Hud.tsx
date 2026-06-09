"use client";

import { useState } from "react";
import { useGame, xpForLevel } from "@/game/state/store";
import {
  EquipSlot,
  INVENTORY_ORDER,
  ITEM_META,
  ItemKey,
  RECIPES,
  SKILL_META,
  SkillKey,
} from "@/game/types";
import { cookAllFish, eat } from "@/game/systems/cooking";
import { canCraft, craft } from "@/game/systems/crafting";

const HOTBAR: { slot: number; icon: string; label: string; locked?: boolean }[] = [
  { slot: 1, icon: "🪓", label: "Axe" },
  { slot: 2, icon: "⛏️", label: "Pick" },
  { slot: 3, icon: "🎣", label: "Rod" },
  { slot: 4, icon: "⚔️", label: "Blade" },
  { slot: 5, icon: "🛡️", label: "Ward", locked: true },
  { slot: 6, icon: "🜂", label: "Sigil", locked: true },
];

export default function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <TopBar />
      <QuestBoard />
      <SkillPanel />
      <ActivityLog />
      <Inventory />
      <Vitals />
      <Hotbar />
      <Forge />
      <Controls />
    </div>
  );
}

function Forge() {
  const [open, setOpen] = useState(false);
  const inventory = useGame((s) => s.inventory);
  const skills = useGame((s) => s.skills);
  const equipment = useGame((s) => s.equipment);
  // subscribing to inventory/skills/equipment keeps canCraft() results fresh
  void inventory;
  void skills;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "pointer-events-auto panel absolute right-4 top-1/2 -translate-y-1/2 rounded-md px-3 py-2 text-sm font-semibold transition",
          open ? "text-drift-corrupt shadow-glow" : "text-drift-bone/80 hover:text-drift-corrupt",
        ].join(" ")}
      >
        ⚒ Forge
      </button>

      {open && (
        <div className="pointer-events-auto panel absolute right-4 top-1/2 w-80 -translate-y-1/2 translate-x-[-3.5rem] rounded-md p-3 sm:translate-x-[-4.5rem]">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-sm font-bold tracking-widest text-drift-bone">
              THE FORGE
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-drift-bone/50 hover:text-drift-bone"
            >
              ✕
            </button>
          </div>

          {/* equipped */}
          <div className="mb-3 flex gap-2">
            {(["weapon", "tool", "ward"] as EquipSlot[]).map((slot) => {
              const item = equipment[slot];
              return (
                <div
                  key={slot}
                  className="flex flex-1 flex-col items-center rounded bg-black/40 px-1 py-1.5"
                  title={item ? `${item.label} — ${item.flavor}` : `No ${slot}`}
                >
                  <span className="text-lg leading-none">{item ? item.icon : "·"}</span>
                  <span className="mt-0.5 text-[8px] uppercase tracking-wider text-drift-bone/40">
                    {slot}
                  </span>
                  <span className="text-[9px] text-drift-gold">
                    {item ? item.flavor : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* recipes */}
          <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
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
                  title={check.ok ? `Craft ${r.result.label}` : check.reason}
                  className={[
                    "rounded bg-black/30 px-2 py-1.5 text-left transition",
                    check.ok
                      ? "ring-1 ring-drift-gold/50 hover:bg-drift-gold/10"
                      : "opacity-45",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-drift-bone">
                      {r.result.icon} {r.result.label}
                    </span>
                    <span className="text-drift-gold">{r.result.flavor}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-drift-bone/50">
                    {costStr}
                    {r.reqCombat ? ` · Combat ${r.reqCombat}+` : ""}
                  </div>
                  {!check.ok && (
                    <div className="text-[10px] text-drift-blood/80">{check.reason}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function Vitals() {
  const { hp, maxHp } = useGame((s) => s.vitals);
  const pct = Math.max(0, Math.min(1, hp / maxHp));
  const low = pct < 0.34;
  return (
    <div className="absolute bottom-24 left-1/2 w-56 -translate-x-1/2">
      <div className="panel rounded-md px-3 py-1.5">
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest">
          <span className={low ? "text-drift-blood corrupt-pulse" : "text-drift-bone/70"}>
            ❤ Vitality
          </span>
          <span className="text-drift-bone/80">
            {hp} / {maxHp}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-black/60">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{
              width: `${pct * 100}%`,
              background: low
                ? "linear-gradient(90deg,#7f1d1d,#dc2626)"
                : "linear-gradient(90deg,#dc2626,#f59e0b)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const season = useGame((s) => s.driftSeason);
  const gold = useGame((s) => s.gold);
  return (
    <div className="absolute left-4 top-4 flex items-center gap-3">
      <div className="panel rounded-md px-4 py-2">
        <div className="font-display text-xl font-bold tracking-[0.25em] text-drift-bone">
          DRIFT<span className="text-drift-corrupt">LANDS</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-drift-corrupt corrupt-pulse">
          Season {season} · the Drift deepens
        </div>
      </div>
      <div className="panel rounded-md px-3 py-2 text-sm font-bold text-drift-gold">
        🪙 {gold}
      </div>
    </div>
  );
}

function QuestBoard() {
  const quests = useGame((s) => s.quests);
  const claimQuest = useGame((s) => s.claimQuest);
  return (
    <div className="pointer-events-auto absolute left-4 top-24 w-64">
      <div className="panel rounded-md p-2.5">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-drift-bone/70">
          📜 Daily Quests
        </div>
        <div className="flex flex-col gap-1.5">
          {quests.map((q) => {
            const done = q.progress >= q.def.target;
            const pct = Math.min(1, q.progress / q.def.target);
            return (
              <div
                key={q.def.id}
                className={[
                  "rounded bg-black/30 px-2 py-1.5",
                  q.claimed ? "opacity-40" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-drift-bone">
                    {q.def.icon} {q.def.label}
                  </span>
                  <span className="text-[10px] text-drift-bone/60">
                    {q.progress}/{q.def.target}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-drift-corruptDim to-drift-corrupt transition-[width] duration-300"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-drift-gold">
                    +{q.def.goldReward}g · +{q.def.xpReward.xp}xp
                  </span>
                  {q.claimed ? (
                    <span className="text-[10px] uppercase text-drift-bone/50">claimed</span>
                  ) : done ? (
                    <button
                      onClick={() => claimQuest(q.def.id)}
                      className="rounded bg-drift-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-drift-gold ring-1 ring-drift-gold/60 hover:bg-drift-gold/30"
                    >
                      Claim
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Trader() {
  const [open, setOpen] = useState(false);
  const inv = useGame((s) => s.inventory);
  const sellItem = useGame((s) => s.sellItem);
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "panel rounded-md px-3 py-1 text-xs font-semibold transition",
          open ? "text-drift-gold shadow-glow" : "text-drift-bone/80 hover:text-drift-gold",
        ].join(" ")}
      >
        🪙 Trade
      </button>
      {open && (
        <div className="panel absolute bottom-12 left-0 w-60 rounded-md p-2.5">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-drift-bone/70">
            Wandering Trader
          </div>
          <div className="flex flex-col gap-1">
            {INVENTORY_ORDER.map((key) => {
              const meta = ITEM_META[key];
              const count = inv[key];
              return (
                <button
                  key={key}
                  disabled={count <= 0}
                  onClick={() => sellItem(key, count, meta.sellValue)}
                  className={[
                    "flex items-center justify-between rounded bg-black/30 px-2 py-1 text-xs transition",
                    count > 0
                      ? "hover:bg-drift-gold/10 hover:ring-1 hover:ring-drift-gold/40"
                      : "opacity-35",
                  ].join(" ")}
                >
                  <span className="text-drift-bone">
                    {meta.icon} {meta.label} × {count}
                  </span>
                  <span className="text-drift-gold">
                    sell all · {count * meta.sellValue}g
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function SkillPanel() {
  const skills = useGame((s) => s.skills);
  return (
    <div className="absolute right-4 top-4 flex w-56 flex-col gap-2">
      {(Object.keys(SKILL_META) as SkillKey[]).map((key) => {
        const st = skills[key];
        const meta = SKILL_META[key];
        const floor = xpForLevel(st.level);
        const next = xpForLevel(st.level + 1);
        const pct = Math.max(0, Math.min(1, (st.xp - floor) / (next - floor)));
        return (
          <div key={key} className="panel rounded-md px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-drift-bone/70">
                Lv <span className="text-drift-gold">{st.level}</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${pct * 100}%`,
                  background: `linear-gradient(90deg, ${meta.color}, #e7c873)`,
                }}
              />
            </div>
            <div className="mt-0.5 text-right text-[10px] text-drift-bone/40">
              {st.xp} / {next} xp
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityLog() {
  const log = useGame((s) => s.log);
  const recent = log.slice(-6);
  return (
    <div className="absolute bottom-40 left-4 flex w-72 flex-col gap-0.5">
      {recent.map((l) => (
        <div
          key={l.id}
          className="rounded bg-black/40 px-2 py-0.5 text-xs backdrop-blur-sm"
          style={{ color: l.color || "#d8cfe0" }}
        >
          {l.text}
        </div>
      ))}
    </div>
  );
}

function Inventory() {
  const inv = useGame((s) => s.inventory);
  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-1.5">
      <div className="panel flex gap-1.5 rounded-md px-2.5 py-2">
        {INVENTORY_ORDER.map((key) => {
          const meta = ITEM_META[key];
          const count = inv[key];
          const edible = !!meta.heal && count > 0;
          return (
            <button
              key={key}
              disabled={!edible}
              onClick={() => edible && eat(key)}
              title={
                meta.heal
                  ? `${meta.label} — click to eat (+${meta.heal} HP)`
                  : meta.label
              }
              className={[
                "flex w-14 flex-col items-center rounded bg-black/30 px-1 py-1 transition",
                count > 0 ? "opacity-100" : "opacity-30",
                edible ? "ring-1 ring-drift-moss/60 hover:bg-drift-moss/20" : "",
              ].join(" ")}
            >
              <span className="text-lg leading-none">{meta.icon}</span>
              <span className="mt-0.5 text-sm font-bold text-drift-gold">{count}</span>
              <span className="w-full truncate text-center text-[8px] text-drift-bone/50">
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>
      <CampActions />
    </div>
  );
}

function CampActions() {
  const rawFish = useGame((s) => s.inventory.fish);
  return (
    <div className="relative flex gap-2">
      <button
        onClick={() => cookAllFish()}
        disabled={rawFish <= 0}
        className={[
          "panel rounded-md px-3 py-1 text-xs font-semibold transition",
          rawFish > 0
            ? "text-drift-ember hover:shadow-glow"
            : "cursor-not-allowed text-drift-bone/30",
        ].join(" ")}
      >
        🔥 Cook fish{rawFish > 0 ? ` (${rawFish})` : ""}
      </button>
      <Trader />
    </div>
  );
}

function Hotbar() {
  const hotbar = useGame((s) => s.hotbar);
  const setHotbar = useGame((s) => s.setHotbar);
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
      {HOTBAR.map((h) => {
        const active = hotbar === h.slot;
        return (
          <button
            key={h.slot}
            onClick={() => !h.locked && setHotbar(h.slot)}
            className={[
              "panel relative flex h-14 w-14 flex-col items-center justify-center rounded-md transition",
              active ? "ring-2 ring-drift-gold shadow-glow" : "opacity-90 hover:opacity-100",
              h.locked ? "grayscale" : "",
            ].join(" ")}
          >
            <span className="text-xl leading-none">{h.icon}</span>
            <span className="absolute right-1 top-0.5 text-[9px] text-drift-bone/50">
              {h.slot}
            </span>
            {h.locked && (
              <span className="absolute bottom-0.5 text-[8px] uppercase text-drift-bone/40">
                soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Controls() {
  return (
    <div className="absolute bottom-4 right-4 panel hidden rounded-md px-3 py-2 text-[10px] leading-relaxed text-drift-bone/60 sm:block">
      <div>
        <span className="text-drift-gold">Click</span> to move
      </div>
      <div>
        <span className="text-drift-gold">Click a node</span> to gather
      </div>
      <div>
        <span className="text-drift-blood">Click a beast</span> to fight
      </div>
      <div>
        <span className="text-drift-gold">Cook</span> raw fish, then <span className="text-drift-moss">click food</span> to heal
      </div>
      <div>
        <span className="text-drift-gold">Scroll</span> to zoom · <span className="text-drift-gold">1–6</span> tools
      </div>
    </div>
  );
}
