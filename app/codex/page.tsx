"use client";

import { useState } from "react";
import LandingShell, { PageFrame } from "@/components/LandingShell";
import { useViewport } from "@/game/state/viewport";
import {
  INVENTORY_ORDER, ITEM_META, RECIPES, DRINK_CATALOG, AURA_CATALOG,
  PET_CATALOG, PROP_CATALOG, DYE_PRICE, EYE_PRICE, SPIN_COST, CLAIM_COST,
  BURN_COSTS, burnAmt, PRESTIGE_CATALOG, AVATAR_KINDS, AVATAR_CHANNELS,
  type ItemKey, type DrinkKey, type AuraKey, type PetKey, type PropKey,
} from "@/game/types";
import { TOWN_BUILDINGS, WILD_STRUCTURES } from "@/game/world/tilemap";

// The bestiary and ledger of the realm — generated from the same catalogs the
// game itself plays by, so it can never drift out of date.

type Tab = "items" | "recipes" | "beasts" | "structures" | "wares" | "rites";
const TABS: { key: Tab; label: string }[] = [
  { key: "items", label: "Items" },
  { key: "recipes", label: "Recipes" },
  { key: "beasts", label: "Beasts" },
  { key: "structures", label: "Structures" },
  { key: "wares", label: "Keepers' Wares" },
  { key: "rites", label: "Costs & Rites" },
];


function Rows({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>;
}
function Section({ title }: { title: string }) {
  return (
    <div style={{ font: "700 11px/1 var(--font-ui)", color: "#a855f7", letterSpacing: "0.12em", textTransform: "uppercase", margin: "22px 14px 8px" }}>
      {title}
    </div>
  );
}

const BEASTS = [
  { name: "Husk", lvl: "1-2", hp: "18-22", note: "Shambling remnants. Wander their ground; only retaliate while engaged. Drop a drift shard, sometimes a hide." },
  { name: "Stalker", lvl: "3+", hp: "26+", note: "Quicker, meaner, further from town. Same loot, more teeth." },
  { name: "Den Elite", lvl: "5", hp: "34", note: "Five hold the Husk Den's war-chest. Stay dead until the den re-seeds, a quarter hour after the last falls." },
  { name: "Raider", lvl: "2-6", hp: "22-38", note: "Come with caravan ambushes and the Long Night. Drop 5-10g from the body. Their deaths are the quota." },
  { name: "Colossus", lvl: "6", hp: "140", note: "A walking ruin, one per corruption threshold, shared by the realm. Pays 50g, five shards, and 120 combat XP." },
];

export default function IndexPage() {
  const [tab, setTab] = useState<Tab>("items");
  const isPhone = useViewport().isPhone;
  // phone: the name/desc/value columns won't fit a 170px+ flex row, so the row
  // stacks into a readable card instead of squishing the description to a sliver
  const ROW: React.CSSProperties = isPhone
    ? { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, padding: "10px 14px" }
    : { display: "flex", alignItems: "baseline", gap: 12, padding: "9px 14px" };
  const NAME: React.CSSProperties = { font: "600 13px/1.3 var(--font-ui)", color: "var(--text-primary)", width: isPhone ? "auto" : 170, flexShrink: 0 };
  const DESC: React.CSSProperties = { flex: isPhone ? undefined : 1, font: "400 12px/1.6 var(--font-ui)", color: "var(--text-secondary)" };
  const VAL: React.CSSProperties = { font: "600 12.5px/1 var(--font-num)", color: "var(--drift-gold)", flexShrink: 0 };
  const odd = (i: number): React.CSSProperties => ({
    background: i % 2 ? "transparent" : "rgba(124, 58, 237, 0.05)",
  });

  return (
    <LandingShell>
      <PageFrame kicker="The Bestiary" title="Index" wide>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                border: "1px solid rgba(124, 58, 237, 0.25)", cursor: "pointer",
                background: tab === t.key ? "rgba(231, 200, 115, 0.10)" : "rgba(124, 58, 237, 0.05)",
                padding: "8px 14px", font: "600 12px/1 var(--font-ui)",
                color: tab === t.key ? "var(--drift-gold)" : "var(--text-secondary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ border: "1px solid rgba(124, 58, 237, 0.18)", paddingBottom: 12 }}>
          {tab === "items" && (
            <Rows>
              <Section title="What the realm yields" />
              {INVENTORY_ORDER.map((k: ItemKey, i) => (
                <div key={k} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{ITEM_META[k].label}</span>
                  <span style={DESC}>
                    {k === "wood" && "Felled from drift-touched trees. The Forge's bread."}
                    {k === "stone" && "Mined from pale outcrops. Tools and wards want it."}
                    {k === "fish" && "Raw hollowfish. A promise, not a meal."}
                    {k === "cooked_fish" && `Cooked over the embers. Restores ${ITEM_META[k].heal} vitality.`}
                    {k === "driftshard" && "Crystallized corruption off a beast's corpse. The good gear wants it."}
                    {k === "hide" && "Beast hide, half the time. Wards and brews."}
                  </span>
                  <span style={VAL}>sells {ITEM_META[k].sellValue}g</span>
                </div>
              ))}
            </Rows>
          )}

          {tab === "recipes" && (
            <Rows>
              <Section title="The Forge's book" />
              {RECIPES.map((r, i) => (
                <div key={r.result.id} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{r.result.label}</span>
                  <span style={DESC}>
                    {r.result.flavor}
                    {r.reqCombat ? ` · needs Combat ${r.reqCombat}` : ""}
                  </span>
                  <span style={VAL}>
                    {Object.entries(r.cost).map(([item, qty]) => `${qty} ${ITEM_META[item as ItemKey].label}`).join(" · ")}
                  </span>
                </div>
              ))}
            </Rows>
          )}

          {tab === "beasts" && (
            <Rows>
              <Section title="What walks the Drift" />
              {BEASTS.map((b, i) => (
                <div key={b.name} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{b.name}</span>
                  <span style={DESC}>{b.note}</span>
                  <span style={VAL}>lv {b.lvl} · {b.hp} hp</span>
                </div>
              ))}
            </Rows>
          )}

          {tab === "structures" && (
            <Rows>
              <Section title="The Waystation" />
              {TOWN_BUILDINGS.map((b, i) => (
                <div key={b.key} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{b.label}</span>
                  <span style={DESC}>stands at {b.x}, {b.y} · Wanderer's Rest</span>
                </div>
              ))}
              <Section title="The Wilds" />
              {WILD_STRUCTURES.map((b, i) => (
                <div key={b.key} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{b.label}</span>
                  <span style={DESC}>
                    stands at {b.x}, {b.y} · unprotected ground; the Drift besieges it
                  </span>
                </div>
              ))}
            </Rows>
          )}

          {tab === "wares" && (
            <Rows>
              <Section title="The Last Lantern · drinks" />
              {(Object.keys(DRINK_CATALOG) as DrinkKey[]).map((k, i) => (
                <div key={k} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{DRINK_CATALOG[k].label}</span>
                  <span style={DESC}>{DRINK_CATALOG[k].desc}</span>
                  <span style={VAL}>{DRINK_CATALOG[k].price}g</span>
                </div>
              ))}
              <Section title="The Dyeworks" />
              <div style={{ ...ROW, ...odd(0) }}>
                <span style={NAME}>Cloak dyes</span>
                <span style={DESC}>Eight ramps of the locked palette.</span>
                <span style={VAL}>{DYE_PRICE}g each</span>
              </div>
              <div style={{ ...ROW, ...odd(1) }}>
                <span style={NAME}>Eye glows</span>
                <span style={DESC}>Five colors of stare.</span>
                <span style={VAL}>{EYE_PRICE}g each</span>
              </div>
              {(Object.keys(AURA_CATALOG) as AuraKey[]).map((k, i) => (
                <div key={k} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{AURA_CATALOG[k].label}</span>
                  <span style={DESC}>
                    {AURA_CATALOG[k].driftsOnly
                      ? "Drift-touched. Burned into being, never bought with gold."
                      : "An aura. The costly kind of beautiful."}
                  </span>
                  <span style={VAL}>
                    {AURA_CATALOG[k].driftsOnly
                      ? <>{burnAmt(BURN_COSTS.prestigeAura)} ◆ only</>
                      : <>{AURA_CATALOG[k].price}g · or {burnAmt(BURN_COSTS.aura)} ◆</>}
                  </span>
                </div>
              ))}
              <Section title="The Dyeworks glass · premium avatars" />
              {AVATAR_KINDS.map((k, i) => (
                <div key={k} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{PRESTIGE_CATALOG[k].label}</span>
                  <span style={DESC}>
                    {PRESTIGE_CATALOG[k].desc}. Two dye channels (
                    {Object.keys(AVATAR_CHANNELS[k]).join(" · ")}). Tried on at
                    the glass before the burn. Bound to the buyer.
                  </span>
                  <span style={VAL}>{burnAmt(BURN_COSTS.prestigeAvatar)} ◆ only</span>
                </div>
              ))}
              <Section title="The Menagerie · followers" />
              {(Object.keys(PET_CATALOG) as PetKey[]).map((k, i) => (
                <div key={k} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{PET_CATALOG[k].label}</span>
                  <span style={DESC}>{PET_CATALOG[k].flavor}</span>
                  <span style={VAL}>{PET_CATALOG[k].price}g</span>
                </div>
              ))}
              <Section title="The Furnisher · claim furnishings" />
              {(Object.keys(PROP_CATALOG) as PropKey[]).map((k, i) => (
                <div key={k} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{PROP_CATALOG[k].label}</span>
                  <span style={DESC}>Stands only on your own claim.</span>
                  <span style={VAL}>{PROP_CATALOG[k].price}g</span>
                </div>
              ))}
            </Rows>
          )}

          {tab === "rites" && (
            <Rows>
              <Section title="What things cost" />
              {[
                ["A Wheel spin", "Gold, shards or nothing. Jackpot 500g.", `${SPIN_COST}g · or ${burnAmt(BURN_COSTS.spin)} ◆`],
                ["A land claim", "3×3, resists the Drift, erodes each season.", `${CLAIM_COST}g · or ${burnAmt(BURN_COSTS.claim)} ◆`],
                ["A Shrine cleansing (burn)", "Feeds the communal pot 150g-worth at once.", `${burnAmt(BURN_COSTS.cleanse)} ◆`],
                ["Rewriting the day's quests", "The Ash Obelisk takes coin or smoke.", `75g · or ${burnAmt(BURN_COSTS.obelisk)} ◆`],
                ["Blessing of Ash", "+gather speed, 10 minutes.", "60g"],
                ["Vault withdrawal", "The handling fee on the way out.", "2%"],
                ["Duel wagers", "The Pit holds the pot. Winner takes both stakes.", "0-5000g"],
              ].map(([n, d, v], i) => (
                <div key={n} style={{ ...ROW, ...odd(i) }}>
                  <span style={NAME}>{n}</span>
                  <span style={DESC}>{d}</span>
                  <span style={VAL}>{v}</span>
                </div>
              ))}
              <div style={{ ...ROW }}>
                <span style={{ font: "400 11px/1.6 var(--font-ui)", color: "var(--text-muted)" }}>
                  <span className="drifts-mark" aria-label="DRIFTS" /> / ◆ = DRIFTS, the realm's coin, burned on-chain. Burn rites are for holders; gold paths always exist where both are listed.
                </span>
              </div>
            </Rows>
          )}
        </div>
      </PageFrame>
    </LandingShell>
  );
}
