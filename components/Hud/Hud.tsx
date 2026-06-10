"use client";

import { useEffect, useRef, useState } from "react";
import { useGame, xpForLevel, currentTitle, QuestState } from "@/game/state/store";
import {
  AURA_CATALOG,
  CLAIM_COST,
  CLAIM_MAX,
  DRINK_CATALOG,
  DYE_PRICE,
  DrinkKey,
  EYE_PRICE,
  EquipSlot,
  PET_CATALOG,
  PROP_CATALOG,
  PetKey,
  PropKey,
  SPIN_COST,
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
import { audioEnabled, setAudioEnabled, initAudio } from "@/game/audio/sound";
import { bus } from "@/game/state/bus";
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
      <SkillsPanel />
      <HotbarDock />
      <RightColumn />
      <ShopModal />
      <DuelOverlay />
      <ChallengePrompt />
    </div>
  );
}

// ─── the Waystation: shop panels ──────────────────────────────────────────────

const SHOP_TITLES: Record<string, { kicker: string; title: string }> = {
  dyeworks:  { kicker: "The Waystation", title: "The Dyeworks" },
  vault:     { kicker: "The Waystation", title: "The Vault" },
  wheel:     { kicker: "The Waystation", title: "Wheel of the Drift" },
  lantern:   { kicker: "The Waystation", title: "The Last Lantern" },
  furnisher: { kicker: "The Waystation", title: "The Furnisher" },
  menagerie: { kicker: "The Waystation", title: "The Menagerie" },
  shrine:    { kicker: "The Waystation", title: "Shrine of the Pale Flame" },
  pit:       { kicker: "The Waystation", title: "The Pit" },
};

function ShopModal() {
  const openShop = useGame((s) => s.openShop);
  const setOpenShop = useGame((s) => s.setOpenShop);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenShop(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpenShop]);
  if (!openShop) return null;
  const meta = SHOP_TITLES[openShop];
  if (!meta) return null;
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%) scale(var(--hud-scale))", zIndex: 30 }}
    >
      <Panel
        kicker={meta.kicker}
        title={meta.title}
        accessory={<Button size="sm" variant="ghost" onClick={() => setOpenShop(null)}>✕</Button>}
        style={{ width: 340, maxHeight: "70vh", overflowY: "auto" }}
      >
        {openShop === "dyeworks" && <DyeworksPanel />}
        {openShop === "vault" && <VaultPanel />}
        {openShop === "wheel" && <WheelPanel />}
        {openShop === "lantern" && <LanternPanel />}
        {openShop === "furnisher" && <FurnisherPanel />}
        {openShop === "menagerie" && <MenageriePanel />}
        {openShop === "shrine" && <ShrinePanel />}
        {openShop === "pit" && <PitPanel />}
      </Panel>
    </div>
  );
}

function shopRow(
  label: string,
  sub: string,
  right: React.ReactNode,
  swatch?: string,
  key?: string,
) {
  return (
    <div key={key ?? label} className="drift-well" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", marginBottom: 5 }}>
      {swatch && <span style={{ width: 14, height: 14, background: swatch, boxShadow: "var(--bevel-slot)" }} />}
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", font: "600 12px/1.2 var(--font-ui)", color: "var(--text-primary)" }}>{label}</span>
        <span style={{ font: "400 9.5px/1.3 var(--font-ui)", color: "var(--text-muted)" }}>{sub}</span>
      </span>
      {right}
    </div>
  );
}

function DyeworksPanel() {
  const s = useGame();
  const buy = (kind: "dye" | "eye" | "aura", key: string, price: number) => {
    if (!s.spendGold(price)) return;
    s.grantCosmetic(kind, key);
    s.pushLog("The Dyeworks remembers your taste.", "#d8b4fe");
  };
  return (
    <>
      <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>Cloak dyes · {DYE_PRICE}g</label>
      {Object.entries(DYE_SWATCH).map(([k, c]) => {
        const owned = s.ownedDyes.includes(k as never);
        const worn = s.cosmetics.dye === k;
        return shopRow(k, owned ? "owned" : `${DYE_PRICE}g`, (
          <Button size="sm" variant={worn ? "primary" : "ghost"}
            onClick={() => owned ? s.setCosmetics({ dye: k as never }) : buy("dye", k, DYE_PRICE)}>
            {worn ? "Worn" : owned ? "Wear" : "Buy"}
          </Button>
        ), c);
      })}
      <label className="drift-label" style={{ fontSize: 9, display: "block", margin: "8px 0 4px" }}>Eye glow · {EYE_PRICE}g</label>
      {Object.entries(EYE_SWATCH).map(([k, c]) => {
        const owned = s.ownedEyes.includes(k as never);
        const worn = s.cosmetics.eye === k;
        return shopRow(k, owned ? "owned" : `${EYE_PRICE}g`, (
          <Button size="sm" variant={worn ? "primary" : "ghost"}
            onClick={() => owned ? s.setCosmetics({ eye: k as never }) : buy("eye", k, EYE_PRICE)}>
            {worn ? "Worn" : owned ? "Wear" : "Buy"}
          </Button>
        ), c);
      })}
      <label className="drift-label" style={{ fontSize: 9, display: "block", margin: "8px 0 4px" }}>Auras</label>
      {Object.entries(AURA_CATALOG).map(([k, meta]) => {
        const owned = s.ownedAuras.includes(k as never);
        const worn = s.cosmetics.aura === k;
        return shopRow(meta.label, owned ? "owned" : `${meta.price}g`, (
          <Button size="sm" variant={worn ? "primary" : "ghost"}
            onClick={() => owned
              ? s.setCosmetics({ aura: worn ? "" : (k as never) })
              : buy("aura", k, meta.price)}>
            {worn ? "Doff" : owned ? "Don" : "Buy"}
          </Button>
        ), meta.color);
      })}
    </>
  );
}

function VaultPanel() {
  const s = useGame();
  const [amt, setAmt] = useState(100);
  if (!s.online) return <OfflineNote what="The Vault" />;
  const deposit = () => {
    const a = Math.min(amt, s.gold);
    if (a <= 0) return;
    s.spendGold(a);
    bus.emit("bank", a);
  };
  const withdraw = () => {
    const a = Math.min(amt, s.banked);
    if (a <= 0) return;
    bus.emit("bank", -a);
  };
  return (
    <>
      <div style={{ font: "400 11px/1.5 var(--font-ui)", color: "var(--text-secondary)", marginBottom: 8 }}>
        Banked gold never drops at your tombstone. Withdrawals pay a 2% handling fee.
      </div>
      {shopRow("In the vault", "safe from the Drift and your own mistakes",
        <b style={{ color: "var(--text-value)", font: "700 14px/1 var(--font-num, monospace)" }}>{s.banked}g</b>)}
      {shopRow("Carried", "drops half at death",
        <b style={{ color: "var(--text-value)", font: "700 14px/1 var(--font-num, monospace)" }}>{s.gold}g</b>)}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input type="number" min={1} value={amt}
          onChange={(e) => setAmt(Math.max(1, Number(e.target.value) | 0))}
          className="drift-well"
          style={{ width: 80, border: 0, outline: "none", padding: "6px 8px", font: "400 12px/1 var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)" }} />
        <Button size="sm" variant="primary" onClick={deposit}>Deposit</Button>
        <Button size="sm" variant="ghost" onClick={withdraw}>Withdraw</Button>
      </div>
    </>
  );
}

function WheelPanel() {
  const s = useGame();
  if (!s.online) return <OfflineNote what="The Wheel" />;
  const spin = () => {
    if (!s.spendGold(SPIN_COST)) {
      s.pushLog(`A spin costs ${SPIN_COST}g.`, "#6f6781");
      return;
    }
    bus.emit("spin", true);
  };
  return (
    <>
      <div style={{ font: "400 11px/1.5 var(--font-ui)", color: "var(--text-secondary)", marginBottom: 8 }}>
        {SPIN_COST}g a spin. Gold, shards, or nothing. The Drift decides.
        Jackpot: <b style={{ color: "var(--drift-gold)" }}>500g</b>.
      </div>
      <Button variant="primary" size="md" onClick={spin} iconLeft={<Icon name="coin" size={16} glow />}>
        Spin · {SPIN_COST}g
      </Button>
      <div style={{ font: "400 9.5px/1.4 var(--font-ui)", color: "var(--text-muted)", marginTop: 8 }}>
        Results land in your activity log. The house always keeps a sliver.
      </div>
    </>
  );
}

function LanternPanel() {
  const s = useGame();
  const now = Date.now();
  return (
    <>
      <div style={{ font: "400 11px/1.5 var(--font-ui)", color: "var(--text-secondary)", marginBottom: 8 }}>
        Warm light, bad stools, good drink. Effects last 5 minutes.
      </div>
      {(Object.entries(DRINK_CATALOG) as [DrinkKey, (typeof DRINK_CATALOG)[DrinkKey]][]).map(([k, d]) => {
        const active = s.buffs[d.buff] > now;
        return shopRow(d.label, d.desc, (
          <Button size="sm" variant={active ? "primary" : "ghost"} onClick={() => s.drink(k)}>
            {active ? "Refill" : `${d.price}g`}
          </Button>
        ));
      })}
    </>
  );
}

function FurnisherPanel() {
  const s = useGame();
  if (!s.online) return <OfflineNote what="The Furnisher" />;
  const buy = (k: PropKey) => {
    const price = PROP_CATALOG[k].price;
    if (s.myClaims === 0) {
      s.pushLog("Furnishings need a claim to stand on. Stake land first.", "#6f6781");
      return;
    }
    if (!s.spendGold(price)) return;
    bus.emit("placeProp", k);
  };
  return (
    <>
      <div style={{ font: "400 11px/1.5 var(--font-ui)", color: "var(--text-secondary)", marginBottom: 8 }}>
        Goods for the landed. Buy, then click a tile on your own claim to place.
        If the claim falls, the furniture falls with it.
      </div>
      {(Object.keys(PROP_CATALOG) as PropKey[]).map((k) =>
        shopRow(PROP_CATALOG[k].label, `${PROP_CATALOG[k].price}g`, (
          <Button size="sm" variant="ghost" onClick={() => buy(k)}>Buy & place</Button>
        )),
      )}
    </>
  );
}

function MenageriePanel() {
  const s = useGame();
  const buy = (k: PetKey) => {
    if (!s.spendGold(PET_CATALOG[k].price)) return;
    s.grantCosmetic("pet", k);
    s.pushLog("It follows you now. It chose you, really.", "#d8b4fe");
  };
  return (
    <>
      {(Object.keys(PET_CATALOG) as PetKey[]).map((k) => {
        const owned = s.ownedPets.includes(k);
        const active = s.cosmetics.pet === k;
        return shopRow(PET_CATALOG[k].label, owned ? PET_CATALOG[k].flavor : `${PET_CATALOG[k].price}g`, (
          <Button size="sm" variant={active ? "primary" : "ghost"}
            onClick={() => owned
              ? s.setCosmetics({ pet: active ? "" : k })
              : buy(k)}>
            {active ? "Dismiss" : owned ? "Summon" : "Buy"}
          </Button>
        ));
      })}
    </>
  );
}

function ShrinePanel() {
  const s = useGame();
  if (!s.online) return <OfflineNote what="The Shrine" />;
  const donate = (amount: number) => {
    const a = Math.min(amount, s.gold);
    if (a <= 0) return;
    s.spendGold(a);
    s.bumpStat("donated", a);
    bus.emit("donate", a);
    s.pushLog(`You feed ${a}g to the Pale Flame.`, "#efe9f4");
  };
  const pct = Math.min(100, Math.round((s.shrine.pot / Math.max(1, s.shrine.goal)) * 100));
  return (
    <>
      <div style={{ font: "400 11px/1.5 var(--font-ui)", color: "var(--text-secondary)", marginBottom: 8 }}>
        When the pot fills, the Pale Flame fires and burns the corruption nearest
        the Waystation clean. Every coin counts toward everyone's survival.
      </div>
      <div className="drift-well" style={{ padding: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", font: "600 11px/1 var(--font-ui)", color: "var(--text-primary)", marginBottom: 5 }}>
          <span>Communal pot</span>
          <span style={{ color: "var(--text-value)" }}>{Math.round(s.shrine.pot)} / {Math.round(s.shrine.goal)}g</span>
        </div>
        <div style={{ height: 8, background: "var(--void-60)" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #a99fb8, #efe9f4)" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[25, 100, 500].map((a) => (
          <Button key={a} size="sm" variant="ghost" onClick={() => donate(a)}>+{a}g</Button>
        ))}
      </div>
      <div style={{ font: "400 9.5px/1.4 var(--font-ui)", color: "var(--text-muted)", marginTop: 8 }}>
        Donate 500g lifetime to earn the title <b style={{ color: "var(--drift-corrupt)" }}>Flamekeeper</b>.
      </div>
    </>
  );
}

function PitPanel() {
  const s = useGame();
  const [wager, setWager] = useState(50);
  if (!s.online) return <OfflineNote what="The Pit" />;
  const others = s.roster.filter((r) => !r.self);
  return (
    <>
      <div style={{ font: "400 11px/1.5 var(--font-ui)", color: "var(--text-secondary)", marginBottom: 8 }}>
        Honorable violence. Both fighters stake the wager; the winner takes the pot.
        No tombstones, no grudges. (Some grudges.)
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span className="drift-label" style={{ fontSize: 9 }}>Wager</span>
        <input type="number" min={0} max={5000} value={wager}
          onChange={(e) => setWager(Math.max(0, Math.min(5000, Number(e.target.value) | 0)))}
          className="drift-well"
          style={{ width: 70, border: 0, outline: "none", padding: "5px 7px", font: "400 12px/1 var(--font-ui)", color: "var(--drift-gold)", background: "var(--surface-well)" }} />
        <span style={{ font: "400 9.5px/1 var(--font-ui)", color: "var(--text-muted)" }}>gold each</span>
      </div>
      {others.length === 0 && (
        <div style={{ font: "400 11px/1.4 var(--font-ui)", color: "var(--text-muted)" }}>
          No one else walks the Drift right now. The sand waits.
        </div>
      )}
      {others.map((r) =>
        shopRow(r.name, r.title, (
          <Button size="sm" variant="ghost"
            style={s.gold < wager ? { opacity: 0.45 } : undefined}
            onClick={() => {
              if (s.gold < wager) return;
              bus.emit("challenge", { target: r.id, wager });
              s.pushLog(`You challenge ${r.name} (${wager}g).`, "#dc2626");
            }}>
            Challenge
          </Button>
        ), undefined, r.id),
      )}
    </>
  );
}

function OfflineNote({ what }: { what: string }) {
  return (
    <div style={{ font: "400 11px/1.5 var(--font-ui)", color: "var(--text-muted)" }}>
      {what} only opens in the shared world. Start the game server and rejoin.
    </div>
  );
}

// ─── duel overlay + challenge prompt + buff chips ─────────────────────────────

function DuelOverlay() {
  const duel = useGame((s) => s.duel);
  const name = useGame((s) => s.cosmetics.name);
  if (!duel) return null;
  const bar = (label: string, hp: number, color: string) => (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", font: "600 10px/1 var(--font-ui)", color: "var(--text-primary)", marginBottom: 3 }}>
        <span>{label}</span><span>{Math.max(0, hp)}</span>
      </div>
      <div style={{ height: 7, background: "var(--void-60)" }}>
        <div style={{ height: "100%", width: `${Math.max(0, hp)}%`, background: color }} />
      </div>
    </div>
  );
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ top: 70, left: "50%", transform: "translateX(-50%) scale(var(--hud-scale))", transformOrigin: "top center", zIndex: 25, width: 380 }}
    >
      <Panel padded={false} corners={false} style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {bar(name, duel.myHp, "#4d7c4d")}
          <span className="drift-label" style={{ fontSize: 10, color: "var(--drift-blood)" }}>VS</span>
          {bar(duel.oppName, duel.oppHp, "#dc2626")}
        </div>
        <div style={{ font: "400 9px/1.4 var(--font-ui)", color: "var(--text-muted)", marginTop: 5, textAlign: "center" }}>
          Stand beside your opponent. Your wanderer swings on its own. Pot: {duel.wager * 2}g
        </div>
      </Panel>
    </div>
  );
}

function ChallengePrompt() {
  const ch = useGame((s) => s.duelChallenge);
  const setCh = useGame((s) => s.setDuelChallenge);
  if (!ch) return null;
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ top: "32%", left: "50%", transform: "translate(-50%, -50%) scale(var(--hud-scale))", zIndex: 35 }}
    >
      <Panel kicker="The Pit" title="A challenge!" style={{ width: 280 }}>
        <div style={{ font: "400 12px/1.5 var(--font-ui)", color: "var(--text-primary)", marginBottom: 10 }}>
          <b>{ch.name}</b> wants your blood on the sand.
          Wager: <b style={{ color: "var(--drift-gold)" }}>{ch.wager}g</b> each.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="primary" size="md" onClick={() => bus.emit("duelAccept", true)}>
            Fight
          </Button>
          <Button variant="ghost" size="md" onClick={() => setCh(null)}>
            Decline
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function BuffChips() {
  const buffs = useGame((s) => s.buffs);
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const now = Date.now();
  const chips: { label: string; left: number }[] = [];
  if (buffs.gather > now) chips.push({ label: "Emberwine", left: buffs.gather - now });
  if (buffs.damage > now) chips.push({ label: "Boneale", left: buffs.damage - now });
  if (buffs.sight > now) chips.push({ label: "Driftgin", left: buffs.sight - now });
  if (chips.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {chips.map((c) => (
        <span key={c.label} className="drift-well" style={{ padding: "3px 7px", font: "600 9px/1 var(--font-ui)", color: "var(--drift-ember)" }}>
          {c.label} {Math.ceil(c.left / 1000)}s
        </span>
      ))}
    </div>
  );
}

/**
 * The ENTIRE right edge is one flex column (satchel → rail/minimap → activity).
 * Flex items stack; they cannot overlap each other or the minimap, ever.
 * The column itself is scaled by --hud-scale, with its height pre-divided so
 * the scaled result still spans the full viewport.
 */
function RightColumn() {
  return (
    <div
      className="absolute flex flex-col items-end"
      style={{
        top: "var(--hud-edge)",
        right: "var(--hud-edge)",
        height: "calc((100dvh - 2 * var(--hud-edge)) / var(--hud-scale))",
        transform: "scale(var(--hud-scale))",
        transformOrigin: "top right",
        justifyContent: "space-between",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      <Satchel />
      <RightRail />
      <ActivityPanel />
    </div>
  );
}

/** middle of the right column: dock buttons + minimap */
function RightRail() {
  return (
    <div
      className="pointer-events-auto"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
        minHeight: 0,
      }}
    >
      <ForgeDock />
      <MarketDock />
      <IdentityDock />
      <StakeButton />
      <MinimapPanel />
    </div>
  );
}

// ---- right rail: player marketplace ---------------------------------------------

function MarketDock() {
  const [open, setOpen] = useState(false);
  const online = useGame((s) => s.online);
  const listings = useGame((s) => s.listings);
  const inventory = useGame((s) => s.inventory);
  const gold = useGame((s) => s.gold);
  const [sellItem, setSellItem] = useState<ItemKey>("wood");
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(10);

  const carried = INVENTORY_ORDER.filter((k) => inventory[k] > 0);
  const mine = listings.filter((l) => l.mine);
  const offers = listings.filter((l) => !l.mine);

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Button
          variant={open ? "primary" : "ghost"}
          size="md"
          onClick={() => setOpen((o) => !o)}
          iconLeft={<Icon name="coin" size={16} glow={open} />}
        >
          Market
        </Button>

        {open && (
          <Panel kicker="The Exchange" title="Market" style={{ width: 312 }}>
            {!online && (
              <div style={{ font: "400 11px/1.4 var(--font-ui)", color: "var(--text-muted)" }}>
                The market opens when you're in the shared world.
              </div>
            )}
            {online && (
              <>
                {/* offers from other wanderers */}
                <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
                  Offers
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 150, overflowY: "auto", marginBottom: 10 }}>
                  {offers.length === 0 && (
                    <span style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)" }}>
                      No offers. The stalls stand empty.
                    </span>
                  )}
                  {offers.map((l) => (
                    <div key={l.id} className="drift-well" style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px" }}>
                      <Icon name={ITEM_ICON[l.item]} size={16} />
                      <span style={{ font: "600 11px/1 var(--font-ui)", color: "var(--text-primary)" }}>
                        {l.qty}× {ITEM_META[l.item].label}
                      </span>
                      <span style={{ flex: 1, font: "400 9px/1 var(--font-ui)", color: "var(--text-muted)", textAlign: "right" }}>
                        {l.sellerName}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => bus.emit("marketBuy", l.id)}
                        style={gold < l.price ? { opacity: 0.45 } : undefined}
                      >
                        {l.price}g
                      </Button>
                    </div>
                  ))}
                </div>

                {/* your stall */}
                <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
                  Your stall ({mine.length}/6)
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  {mine.length === 0 && (
                    <span style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)" }}>
                      Nothing listed.
                    </span>
                  )}
                  {mine.map((l) => (
                    <div key={l.id} className="drift-well" style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px" }}>
                      <Icon name={ITEM_ICON[l.item]} size={16} />
                      <span style={{ flex: 1, font: "600 11px/1 var(--font-ui)", color: "var(--text-primary)" }}>
                        {l.qty}× · {l.price}g
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => bus.emit("marketUnlist", l.id)}>
                        Withdraw
                      </Button>
                    </div>
                  ))}
                </div>

                {/* list something */}
                <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
                  Sell
                </label>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <select
                    value={sellItem}
                    onChange={(e) => setSellItem(e.target.value as ItemKey)}
                    className="drift-well"
                    style={{ flex: 1, border: 0, outline: "none", padding: "5px 6px", font: "400 11px/1 var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)" }}
                  >
                    {(carried.length ? carried : INVENTORY_ORDER).map((k) => (
                      <option key={k} value={k}>
                        {ITEM_META[k].label} ({inventory[k]})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number" min={1} max={inventory[sellItem] || 1} value={sellQty}
                    onChange={(e) => setSellQty(Math.max(1, Number(e.target.value) | 0))}
                    className="drift-well"
                    style={{ width: 44, border: 0, outline: "none", padding: "5px 6px", font: "400 11px/1 var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)" }}
                    title="Quantity"
                  />
                  <input
                    type="number" min={1} value={sellPrice}
                    onChange={(e) => setSellPrice(Math.max(1, Number(e.target.value) | 0))}
                    className="drift-well"
                    style={{ width: 56, border: 0, outline: "none", padding: "5px 6px", font: "400 11px/1 var(--font-ui)", color: "var(--drift-gold)", background: "var(--surface-well)" }}
                    title="Total price (gold)"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => bus.emit("marketList", { item: sellItem, qty: sellQty, price: sellPrice })}
                    style={inventory[sellItem] < sellQty || mine.length >= 6 ? { opacity: 0.45 } : undefined}
                  >
                    List
                  </Button>
                </div>
              </>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

/** stake a 3×3 land claim (online only; gold cost, eroded by seasons) */
function StakeButton() {
  const online = useGame((s) => s.online);
  const claimMode = useGame((s) => s.claimMode);
  const myClaims = useGame((s) => s.myClaims);
  const gold = useGame((s) => s.gold);
  const blocked = !online || myClaims >= CLAIM_MAX || (!claimMode && gold < CLAIM_COST);
  return (
    <Button
      variant={claimMode ? "primary" : "ghost"}
      size="md"
      onClick={() => bus.emit("stake", true)}
      iconLeft={<Icon name="sigil" size={16} glow={claimMode} />}
      style={blocked && !claimMode ? { opacity: 0.55 } : undefined}
      title={
        !online
          ? "Join the shared world to stake land"
          : myClaims >= CLAIM_MAX
            ? `You hold the maximum of ${CLAIM_MAX} claims`
            : `Stake a 3×3 claim for ${CLAIM_COST}g. Claimed land repels corruption and draws nodes`
      }
    >
      {claimMode ? "Choose ground…" : `Stake · ${myClaims}/${CLAIM_MAX}`}
    </Button>
  );
}

// ---- right-middle (below Forge): wanderer identity ------------------------------

const DYE_SWATCH: Record<string, string> = {
  stone: "#4a4360", ember: "#b45309", moss: "#4d7c4d", blood: "#991b1b",
  gold: "#b8943f", bone: "#a99fb8", water: "#2c5775", void: "#211c30",
};
const EYE_SWATCH: Record<string, string> = {
  drift: "#a855f7", ember: "#f59e0b", blood: "#dc2626", gold: "#e7c873", water: "#4a7fa0",
};

function IdentityDock() {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(true);
  useEffect(() => setSound(audioEnabled()), []);
  const cosmetics = useGame((s) => s.cosmetics);
  const setCosmetics = useGame((s) => s.setCosmetics);
  const skills = useGame((s) => s.skills);
  const kills = useGame((s) => s.kills);
  const stats = useGame((s) => s.stats);
  const ownedDyes = useGame((s) => s.ownedDyes);
  const ownedEyes = useGame((s) => s.ownedEyes);
  const title = currentTitle({ skills, kills, stats });

  const swatchBtn = (
    color: string,
    selected: boolean,
    onClick: () => void,
    label: string,
  ) => (
    <button
      key={label}
      onClick={onClick}
      title={label}
      style={{
        width: 22,
        height: 22,
        background: color,
        border: 0,
        cursor: "pointer",
        boxShadow: selected
          ? "0 0 0 2px var(--drift-gold), var(--bevel-slot)"
          : "var(--bevel-slot)",
      }}
    />
  );

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Button
          variant={open ? "primary" : "ghost"}
          size="md"
          onClick={() => setOpen((o) => !o)}
          iconLeft={<Icon name="heart" size={16} glow={open} />}
        >
          You
        </Button>

        {open && (
          <Panel kicker="The Wanderer" title="Identity" style={{ width: 296 }}>
            {/* name */}
            <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
              Name
            </label>
            <input
              value={cosmetics.name}
              maxLength={16}
              onChange={(e) => setCosmetics({ name: e.target.value })}
              className="drift-well"
              style={{
                width: "100%", border: 0, outline: "none", padding: "7px 9px",
                font: "600 13px/1 var(--font-ui)", color: "var(--text-primary)",
                background: "var(--surface-well)", marginBottom: 8,
              }}
            />
            {/* earned title */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
              <span className="drift-label" style={{ fontSize: 9 }}>Title</span>
              <span style={{ font: "600 12px/1 var(--font-ui)", color: "var(--drift-corrupt)" }}>
                {title}
              </span>
              <span style={{ font: "400 9px/1 var(--font-ui)", color: "var(--text-muted)" }}>
                · earned through deeds
              </span>
            </div>
            {/* cloak dye (owned only — the Dyeworks sells more) */}
            <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
              Cloak dye <span style={{ color: "var(--text-muted)" }}>· more at the Dyeworks</span>
            </label>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {Object.entries(DYE_SWATCH)
                .filter(([k]) => ownedDyes.includes(k as never))
                .map(([k, c]) =>
                  swatchBtn(c, cosmetics.dye === k, () => setCosmetics({ dye: k as never }), k),
                )}
            </div>
            {/* eye glow */}
            <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
              Eye glow
            </label>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {Object.entries(EYE_SWATCH)
                .filter(([k]) => ownedEyes.includes(k as never))
                .map(([k, c]) =>
                  swatchBtn(c, cosmetics.eye === k, () => setCosmetics({ eye: k as never }), k),
                )}
            </div>
            {/* lifetime deeds */}
            <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
              Deeds
            </label>
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 10px",
                font: "400 10px/1.4 var(--font-ui)", color: "var(--text-secondary)",
                marginBottom: 10,
              }}
            >
              <span>Beasts slain <b style={{ color: "var(--text-value)" }}>{kills}</b></span>
              <span>Deaths <b style={{ color: "var(--text-value)" }}>{stats.deaths}</b></span>
              <span>Gathered <b style={{ color: "var(--text-value)" }}>{stats.gathered}</b></span>
              <span>Crits <b style={{ color: "var(--text-value)" }}>{stats.crits}</b></span>
              <span>Gold earned <b style={{ color: "var(--text-value)" }}>{stats.goldEarned}</b></span>
              <span>Driftfalls <b style={{ color: "var(--text-value)" }}>{stats.driftfalls}</b></span>
            </div>
            {/* sound */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="drift-label" style={{ fontSize: 9 }}>Sound</span>
              <Button
                variant={sound ? "primary" : "ghost"}
                size="sm"
                onClick={() => {
                  const next = !sound;
                  setSound(next);
                  setAudioEnabled(next);
                  if (next) initAudio();
                }}
              >
                {sound ? "On" : "Muted"}
              </Button>
            </div>
          </Panel>
        )}
      </div>
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
      style={{ top: "var(--hud-edge)", left: "var(--hud-edge)", gap: 10, transform: "scale(var(--hud-scale))", transformOrigin: "top left" }}
    >
      <div
        className="drift-wordmark drift-wordmark-bleed drift-hud-text"
        style={{ fontSize: "var(--text-xl)", lineHeight: 1, textShadow: "none" }}
      >
        DRIFTLANDS
      </div>
      <SeasonBadge season={season} name={seasonName(season)} driftPct={driftPct} />
      <OnlineBadge />
      <Vitals />
      <BuffChips />
      <QuestBoard />
    </div>
  );
}

/** other wanderers sharing the world — hidden when alone/offline */
function OnlineBadge() {
  const n = useGame((s) => s.playersOnline);
  const roster = useGame((s) => s.roster);
  if (n <= 1) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div
        className="drift-hud-text"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--text-secondary)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            background: "var(--status-success)",
            boxShadow: "0 0 4px var(--status-success)",
          }}
        />
        {n} wanderers in the Drift
      </div>
      {roster.slice(0, 8).map((r, i) => (
        <div
          key={i}
          className="drift-hud-text"
          style={{ fontSize: 10, paddingLeft: 12, color: r.self ? "var(--text-muted)" : "var(--text-secondary)" }}
        >
          {r.name}
          {r.self ? " (you)" : ""}
          {r.title && (
            <span style={{ color: "var(--drift-corrupt)", marginLeft: 5 }}>{r.title}</span>
          )}
        </div>
      ))}
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
    <div className="pointer-events-auto" style={{ position: "relative", flexShrink: 0 }}>
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
                    ? `${meta.label} · eat to restore ${meta.heal} vitality`
                    : `${meta.label} · sells for ${meta.sellValue}g`
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
        <Panel
          kicker="Wandering Trader"
          title="Sell"
          // pops out left of the satchel so the right column never grows taller
          style={{ width: 232, position: "absolute", right: "100%", top: 0, marginRight: 8 }}
        >
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
      style={{ bottom: "var(--hud-edge)", left: "var(--hud-edge)", transform: "scale(var(--hud-scale))", transformOrigin: "bottom left" }}
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
    <div className="pointer-events-auto" style={{ flexShrink: 0 }}>
      <Panel kicker="Realm" title="Activity" style={{ width: 264 }}>
        <ActivityLog entries={entries} max={6} />
        <ChatRow />
      </Panel>
    </div>
  );
}

/** chat input — Enter anywhere focuses it; Esc blurs; /wave etc. emote */
function ChatRow() {
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "Enter" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = () => {
    const t = text.trim();
    if (t) bus.emit("chat", t);
    setText("");
    ref.current?.blur();
  };

  return (
    <div style={{ marginTop: 8 }}>
      <input
        ref={ref}
        value={text}
        maxLength={120}
        placeholder="Say something… (Enter)"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
          if (e.key === "Escape") ref.current?.blur();
        }}
        className="drift-well"
        style={{
          width: "100%", border: 0, outline: "none", padding: "6px 8px",
          font: "400 11px/1 var(--font-ui)", color: "var(--text-primary)",
          background: "var(--surface-well)",
        }}
      />
      <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
        {(["wave", "sit", "point", "dance"] as const).map((e) => (
          <button
            key={e}
            onClick={() => bus.emit("emote", e)}
            className="drift-well"
            style={{
              border: 0, cursor: "pointer", padding: "3px 7px",
              font: "600 9px/1 var(--font-ui)", color: "var(--text-secondary)",
            }}
          >
            /{e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- right side: minimap ---------------------------------------------------------

const MINI_TILE_COLORS = ["#2c4a2e", "#3c2d1f", "#262138", "#1d4258", "#6b21a8"];

function MinimapPanel() {
  const snap = useGame((s) => s.minimap);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !snap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const px = cv.width / snap.w;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < snap.h; y++) {
      for (let x = 0; x < snap.w; x++) {
        ctx.fillStyle = MINI_TILE_COLORS[snap.tiles[y * snap.w + x]] ?? MINI_TILE_COLORS[0];
        ctx.fillRect(x * px, y * px, px + 0.5, px + 0.5);
      }
    }
    ctx.fillStyle = "#e7c873";
    for (const n of snap.nodes) ctx.fillRect(n.x * px - 1, n.y * px - 1, 2, 2);
    for (const m of snap.mobs) {
      ctx.fillStyle = m.boss ? "#f59e0b" : "#dc2626";
      const r = m.boss ? 2.5 : 1.5;
      ctx.fillRect(m.x * px - r, m.y * px - r, r * 2, r * 2);
    }
    for (const c of snap.claims ?? []) {
      ctx.strokeStyle = c.mine ? "#e7c873" : "#7c6f93";
      ctx.lineWidth = 1;
      ctx.strokeRect((c.x - 1.5) * px, (c.y - 1.5) * px, 3 * px, 3 * px);
    }
    if (snap.tomb) {
      ctx.fillStyle = "#efe9f4";
      ctx.fillRect(snap.tomb.x * px - 1, snap.tomb.y * px - 2.5, 2, 5);
      ctx.fillRect(snap.tomb.x * px - 2.5, snap.tomb.y * px - 1, 5, 2);
    }
    for (const p of snap.players) {
      ctx.fillStyle = p.self ? "#efe9f4" : "#a855f7";
      ctx.fillRect(p.x * px - 2, p.y * px - 2, 4, 4);
    }
  }, [snap]);

  if (!snap) return null;
  return (
    <Panel padded={false} corners={false} style={{ padding: 6 }} title={undefined}>
      <canvas
        ref={ref}
        width={144}
        height={144}
        style={{ display: "block", width: 144, height: 144, imageRendering: "pixelated" }}
      />
    </Panel>
  );
}

// ---- bottom-center: hotbar ----------------------------------------------------

function HotbarDock() {
  const hotbar = useGame((s) => s.hotbar);
  const setHotbar = useGame((s) => s.setHotbar);
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ bottom: "var(--hud-edge)", left: "50%", transform: "translateX(-50%) scale(var(--hud-scale))", transformOrigin: "bottom center" }}
    >
      <Hotbar
        selected={hotbar - 1}
        onSelect={(i) => !HOTBAR_TOOLS[i].locked && setHotbar(i + 1)}
        slots={HOTBAR_TOOLS.map((t) => ({
          icon: <Icon name={t.icon} size={32} style={t.locked ? { opacity: 0.5, filter: "grayscale(0.8)" } : undefined} />,
          name: t.locked ? `${t.name} · sealed for now` : t.name,
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
    <div>
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
                    title={item ? `${item.label} · ${item.flavor}` : `No ${slot} equipped`}
                  >
                    {item ? (
                      <Icon name={RECIPE_ICON[item.id] ?? "sword"} size={20} />
                    ) : (
                      <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>·</span>
                    )}
                    <span className="drift-label" style={{ fontSize: 8 }}>{slot}</span>
                    <span className="drift-num" style={{ fontSize: 9, color: "var(--drift-gold)" }}>
                      {item ? item.flavor : "·"}
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
