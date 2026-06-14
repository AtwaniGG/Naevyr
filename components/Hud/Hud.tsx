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
  BURN_COSTS,
  PRESTIGE_CATALOG,
  AVATAR_CHANNELS,
  AVATAR_KINDS,
  AvatarKind,
  RELIC_MARKET,
  GUILD,
  burnAmt,
  DUEL_DRIFTS,
  holderPerks,
  INVENTORY_ORDER,
  ITEM_META,
  ItemKey,
  RECIPES,
  SKILL_META,
  SkillKey,
  seasonName,
  BP_CHALLENGE_POOL,
} from "@/game/types";
import { cookAllFish, eat } from "@/game/systems/cooking";
import { canCraft, craft } from "@/game/systems/crafting";
import { audioEnabled, setAudioEnabled, initAudio } from "@/game/audio/sound";
import { bus } from "@/game/state/bus";
import WheelOverlay from "@/components/Hud/WheelOverlay";
import { KEEPER_TALK, pickLine } from "@/game/world/keeperTalk";
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
  // ?demo hides the DOM HUD for clean trailer capture (canvas labels stay).
  // Read once on mount so SSR and first client render agree.
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    if (typeof location !== "undefined" && new URLSearchParams(location.search).has("demo")) {
      setDemo(true);
    }
  }, []);
  // ?demo hides the HUD for clean canvas capture, but the Wheel overlay IS the
  // scene when a spin rolls and the Duel overlay (HP bars + pot) IS the scene in
  // a Pit duel — keep both visible (each self-hides when idle).
  if (demo) return <><WheelOverlay /><DuelOverlay /></>;
  return (
    <div className="pointer-events-none absolute inset-0 select-none" style={{ zIndex: 10 }}>
      <div className="drift-scrim" />
      <TopLeft />
      <SkillsPanel />
      <HotbarDock />
      <RightColumn />
      <NightBanner />
      <ZoomTip />
      <TutorialBanner />
      <KeeperDialogue />
      <ShopModal />
      <DuelOverlay />
      <ChallengePrompt />
      <WheelOverlay />
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
  if (KEEPERS[openShop]) return null; // keeper-run shops are conversations now
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

// ─── keeper conversations ─────────────────────────────────────────────────────
// Inside a shop you talk to its keeper: a short greeting, clickable choices,
// and a spoken reply. No modal in your face; the shop IS the character.

const KEEPERS: Record<string, { name: string; swatch: string; leave: string }> = {
  dyeworks:  { name: "Maela the Dyer",     swatch: "#a855f7", leave: "Nothing today" },
  vault:     { name: "Coffer-Warden Bram", swatch: "#b8943f", leave: "Just looking" },
  wheel:     { name: "Sallow Jack",        swatch: "#991b1b", leave: "Walk away" },
  lantern:   { name: "Innkeep Odda",       swatch: "#b45309", leave: "Nothing today" },
  furnisher: { name: "Carver Hesk",        swatch: "#4d7c4d", leave: "Another time" },
  menagerie: { name: "Keeper Vey",         swatch: "#2c5775", leave: "Just looking" },
  mine:      { name: "Overseer Dunn",      swatch: "#4a4360", leave: "To work" },
  mirehut:   { name: "The Mirewife",       swatch: "#4d7c4d", leave: "Wade out" },
  obelisk:   { name: "The Ash Obelisk",    swatch: "#a855f7", leave: "Step back" },
};

interface TalkOpt {
  label: string;
  sub?: string;
  right?: React.ReactNode;
  swatch?: string;
  onClick: () => void;
}

/** the DRIFTS coin emblem, inline at text size */
const DriftsMark = () => <span className="drifts-mark" aria-label="DRIFTS" />;

/** locked-ramp swatch colors for the avatar channel pickers */
const RAMP_SWATCH: Record<string, string> = {
  grass: "#7fae5e", dirt: "#7a6048", stone: "#4a4360", water: "#4a7fa0",
  drift: "#a855f7", ember: "#f59e0b", gold: "#e7c873", blood: "#dc2626", bone: "#d8cfe0",
};

function KeeperDialogue() {
  const openShop = useGame((st) => st.openShop);
  const setOpenShop = useGame((st) => st.setOpenShop);
  const s = useGame();
  const [menu, setMenu] = useState("root");
  const [say, setSay] = useState<string | null>(null);
  const [greet, setGreet] = useState("");
  // the Dyeworks glass: the avatar being tried on (engine draws it on you)
  const [pv, setPv] = useState<{ kind: AvatarKind; a: string; b: string } | null>(null);
  const preview = (p: { kind: AvatarKind; a: string; b: string } | null) => {
    setPv(p);
    bus.emit("avatarPreview", p);
  };
  useEffect(() => {
    setMenu("root");
    setSay(null);
    setPv(null);
    bus.emit("avatarPreview", null); // walking away empties the glass
    if (openShop && KEEPER_TALK[openShop]) setGreet(pickLine(KEEPER_TALK[openShop].greet));
  }, [openShop]);
  if (!openShop || !KEEPERS[openShop]) return null;

  const keeper = KEEPERS[openShop];
  const close = () => setOpenShop(null);
  const respond = (line: string) => setSay(line);
  const back = (label = "Something else") => ({
    label,
    onClick: () => { setMenu("root"); setSay(null); },
  });

  const opts: TalkOpt[] = [];
  let info: string | null = null;

  if (openShop === "lantern") {
    (Object.entries(DRINK_CATALOG) as [DrinkKey, (typeof DRINK_CATALOG)[DrinkKey]][]).forEach(([k, d]) => {
      const active = s.buffs[d.buff] > Date.now();
      opts.push({
        label: d.label, sub: d.desc, right: active ? "refill" : `${d.price}g`,
        onClick: () => respond(s.drink(k) ? "Drink deep. The dark waits outside." : `Coin first. ${d.price}g.`),
      });
    });
  } else if (openShop === "dyeworks") {
    if (menu === "root") {
      opts.push({ label: "Cloak dyes", sub: `${DYE_PRICE}g each`, onClick: () => setMenu("dyes") });
      opts.push({ label: "Eye glow", sub: `${EYE_PRICE}g each`, onClick: () => setMenu("eyes") });
      opts.push({ label: "Auras", sub: "the costly kind of beautiful", onClick: () => setMenu("auras") });
      opts.push({
        label: "The glass", swatch: "#a855f7",
        sub: "other bodies · try them on before the burn",
        onClick: () => setMenu("avatars"),
      });
      if (s.wallet && s.holder) {
        opts.push({
          label: "Drift-touched", swatch: "#a855f7",
          sub: "burned into being · DRIFTS only, never gold",
          onClick: () => setMenu("prestige"),
        });
      }
    } else if (menu === "avatars") {
      AVATAR_KINDS.forEach((k) => {
        const entry = PRESTIGE_CATALOG[k];
        const owned = s.ownedAvatars.includes(k);
        const worn = s.cosmetics.avatar === k;
        opts.push({
          label: entry.label, swatch: "#a855f7", sub: entry.desc,
          right: worn ? "worn" : owned ? "wear"
            : <>{burnAmt(BURN_COSTS.prestigeAvatar)} <DriftsMark /></>,
          onClick: () => {
            // step to the glass: show it on you while you decide
            preview({
              kind: k,
              a: worn ? s.cosmetics.avA : "",
              b: worn ? s.cosmetics.avB : "",
            });
            setMenu(`avatar:${k}`);
            setSay("The glass shows what the Drift could make of you.");
          },
        });
      });
      if (s.cosmetics.avatar) {
        opts.push({
          label: "Your own face again",
          onClick: () => {
            s.setCosmetics({ avatar: "", avA: "", avB: "" });
            preview(null);
            respond("The glass lets you go.");
          },
        });
      }
      opts.push(back());
    } else if (menu.startsWith("avatar:")) {
      const k = menu.slice(7) as AvatarKind;
      const entry = PRESTIGE_CATALOG[k];
      const owned = s.ownedAvatars.includes(k);
      const worn = s.cosmetics.avatar === k;
      const chans = Object.entries(AVATAR_CHANNELS[k]);
      const cur = pv?.kind === k ? pv : { kind: k, a: "", b: "" };
      info = entry?.desc ?? null;
      chans.forEach(([chan, options], ci) => {
        const sel = (ci === 0 ? cur.a : cur.b) || options[0];
        opts.push({
          label: chan, swatch: RAMP_SWATCH[sel], right: sel,
          sub: "tap to turn the dye",
          onClick: () => {
            const next = options[(options.indexOf(sel) + 1) % options.length];
            const p = { ...cur, [ci === 0 ? "a" : "b"]: next };
            preview(p);
            if (worn) s.setCosmetics(ci === 0 ? { avA: next } : { avB: next });
          },
        });
      });
      if (worn) {
        opts.push({
          label: "Take it off",
          onClick: () => {
            s.setCosmetics({ avatar: "", avA: "", avB: "" });
            preview(null);
            setMenu("avatars");
            respond("The glass lets you go.");
          },
        });
      } else if (owned) {
        opts.push({
          label: "Wear it",
          onClick: () => {
            s.setCosmetics({ avatar: k, avA: cur.a, avB: cur.b });
            preview(null);
            respond("It walks out wearing you.");
          },
        });
      } else if (s.wallet && s.holder) {
        opts.push({
          label: `Become ${entry.label}`,
          right: <>{burnAmt(BURN_COSTS.prestigeAvatar)} <DriftsMark /></>,
          onClick: () => {
            bus.emit("prestigeBurn", k);
            respond("The chain takes its due. Hold still.");
          },
        });
      } else {
        opts.push({
          label: `Become ${entry.label}`,
          right: <>{burnAmt(BURN_COSTS.prestigeAvatar)} <DriftsMark /></>,
          onClick: () => respond("The glass trades in burned DRIFTS only. Link a wallet that holds them."),
        });
      }
      opts.push({
        label: "Step away from the glass",
        onClick: () => { preview(null); setMenu("avatars"); setSay(null); },
      });
    } else if (menu === "prestige") {
      Object.entries(PRESTIGE_CATALOG).forEach(([k, entry]) => {
        if (entry.kind === "avatar") return; // the glass has its own menu
        const owned =
          entry.kind === "dye" ? s.ownedDyes.includes(k as never) :
          entry.kind === "aura" ? s.ownedAuras.includes(k as never) :
          s.ownedTitles.includes(entry.label);
        // season-exclusive relics are never SOLD here — but an owner (e.g. from
        // the battle pass) can still equip the one they hold.
        if (entry.passOnly && !owned) return;
        const worn =
          entry.kind === "dye" ? s.cosmetics.dye === k :
          entry.kind === "aura" ? s.cosmetics.aura === k : false;
        const swatch =
          entry.kind === "dye" ? "#a855f7" :
          entry.kind === "aura" ? AURA_CATALOG[k as keyof typeof AURA_CATALOG]?.color : keeper.swatch;
        opts.push({
          label: entry.label, swatch, sub: entry.desc,
          right: worn ? "worn" : owned ? (entry.kind === "title" ? "yours" : "wear")
            : <>{burnAmt(BURN_COSTS[entry.action])} <DriftsMark /></>,
          onClick: () => {
            if (worn) return;
            if (owned) {
              if (entry.kind === "dye") { s.setCosmetics({ dye: k as never }); respond("It suits you."); }
              else if (entry.kind === "aura") { s.setCosmetics({ aura: k as never }); respond("It clings to you."); }
              else respond("The realm already knows that name.");
              return;
            }
            bus.emit("prestigeBurn", k);
            respond("The chain takes its due. Hold still.");
          },
        });
      });
      opts.push(back());
    } else if (menu === "dyes") {
      Object.entries(DYE_SWATCH).forEach(([k, c]) => {
        const owned = s.ownedDyes.includes(k as never);
        const worn = s.cosmetics.dye === k;
        opts.push({
          label: k, swatch: c, right: worn ? "worn" : owned ? "wear" : `${DYE_PRICE}g`,
          onClick: () => {
            if (worn) return;
            if (owned) { s.setCosmetics({ dye: k as never }); respond("It suits you."); return; }
            if (!s.spendGold(DYE_PRICE, "shop")) return respond(`Coin first. ${DYE_PRICE}g.`);
            s.grantCosmetic("dye", k);
            s.setCosmetics({ dye: k as never });
            respond("The Dyeworks remembers your taste.");
          },
        });
      });
      opts.push(back());
    } else if (menu === "eyes") {
      Object.entries(EYE_SWATCH).forEach(([k, c]) => {
        const owned = s.ownedEyes.includes(k as never);
        const worn = s.cosmetics.eye === k;
        opts.push({
          label: k, swatch: c, right: worn ? "worn" : owned ? "wear" : `${EYE_PRICE}g`,
          onClick: () => {
            if (worn) return;
            if (owned) { s.setCosmetics({ eye: k as never }); respond("It suits you."); return; }
            if (!s.spendGold(EYE_PRICE, "shop")) return respond(`Coin first. ${EYE_PRICE}g.`);
            s.grantCosmetic("eye", k);
            s.setCosmetics({ eye: k as never });
            respond("Careful who you stare at.");
          },
        });
      });
      opts.push(back());
    } else {
      Object.entries(AURA_CATALOG).forEach(([k, meta]) => {
        if (meta.driftsOnly) return; // Drift-touched live in their own menu
        const owned = s.ownedAuras.includes(k as never);
        const worn = s.cosmetics.aura === k;
        const canBurn = !owned && !!s.wallet && s.holder;
        opts.push({
          label: meta.label, swatch: meta.color,
          right: worn ? "doff" : owned ? "don" : canBurn
            ? <>{meta.price}g · {burnAmt(BURN_COSTS.aura)} <DriftsMark /></>
            : `${meta.price}g`,
          onClick: () => {
            if (worn) { s.setCosmetics({ aura: "" }); respond("Dimmed, then."); return; }
            if (owned) { s.setCosmetics({ aura: k as never }); respond("It clings to you."); return; }
            if (canBurn) { bus.emit("auraBurn", k); respond("The chain takes its due. Hold still."); return; }
            if (!s.spendGold(meta.price, "shop")) return respond(`Coin first. ${meta.price}g.`);
            s.grantCosmetic("aura", k);
            s.setCosmetics({ aura: k as never });
            respond("The Dyeworks remembers your taste.");
          },
        });
      });
      opts.push(back());
    }
  } else if (openShop === "vault") {
    if (!s.online) {
      info = "The Vault only opens in the shared world.";
    } else {
      info = `In the vault ${s.banked}g · carried ${s.gold}g · withdrawals pay 2%`;
      const dep = (a: number) => {
        const amt = Math.min(a, s.gold);
        if (amt <= 0) return respond("Your purse is empty.");
        // the server ledger moves the gold; bankResult/goldSync report back
        bus.emit("bank", amt);
        respond(`${amt}g under lock and warding.`);
      };
      const wd = (a: number) => {
        const amt = Math.min(a, s.banked);
        if (amt <= 0) return respond("Nothing of yours sleeps here.");
        bus.emit("bank", -amt);
        respond("Mind the handling fee.");
      };
      if (menu === "exchange") {
        const ex = s.exchange;
        if (!ex) {
          info = "The merchant counts his purse…";
          opts.push(back());
        } else if (!ex.buyOpen && !ex.sellOpen) {
          info = "The Exchange counter is closed. The merchant has not yet arrived.";
          opts.push(back());
        } else {
          info = `Pool ${Math.floor(ex.pool).toLocaleString()} DRIFTS · buy ${ex.buyRate}/g · sell ${ex.sellRate}/g · today: bought ${ex.boughtToday}/${ex.buyCap}g, sold ${ex.soldToday}/${ex.sellCap}g`;
          const buy = (g: number) => {
            if (!s.wallet) return respond("Link a wallet first.");
            bus.emit("exBuy", g);
            respond("Sign the transfer and the gold is yours.");
          };
          const sell = (g: number) => {
            const amt = Math.min(g, s.gold, ex.sellCap - ex.soldToday);
            if (amt < ex.minTrade) return respond(`Trades start at ${ex.minTrade}g.`);
            bus.emit("exSell", amt);
            respond("The merchant weighs your coin…");
          };
          if (ex.buyOpen) {
            opts.push({ label: "Buy 100g", right: <>{(100 * ex.buyRate).toLocaleString()} <DriftsMark /></>, onClick: () => buy(100) });
            opts.push({ label: "Buy 500g", right: <>{(500 * ex.buyRate).toLocaleString()} <DriftsMark /></>, onClick: () => buy(500) });
          }
          if (ex.sellOpen) {
            opts.push({ label: "Sell 100g", right: <>{(100 * ex.sellRate).toLocaleString()} <DriftsMark /></>, onClick: () => sell(100) });
            opts.push({
              label: "Sell to today's cap",
              right: `${Math.max(0, Math.min(s.gold, ex.sellCap - ex.soldToday))}g`,
              onClick: () => sell(ex.sellCap - ex.soldToday),
            });
          } else {
            const when = ex.sellOpensAt
              ? new Date(ex.sellOpensAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : null;
            opts.push({
              label: "Sell gold for DRIFTS", sub: when ? `the merchant buys gold from ${when}` : "the counter isn't buying gold yet",
              right: "soon",
              onClick: () => respond(
                when
                  ? `"I'll buy gold once the realm has settled. Come back ${when}."`
                  : `"The purse isn't open to buying yet, wanderer."`,
              ),
            });
          }
          opts.push(back());
        }
      } else {
        opts.push({ label: "Deposit 100g", onClick: () => dep(100) });
        opts.push({ label: "Deposit everything", right: `${s.gold}g`, onClick: () => dep(s.gold) });
        opts.push({ label: "Withdraw 100g", onClick: () => wd(100) });
        opts.push({ label: "Withdraw everything", right: `${s.banked}g`, onClick: () => wd(s.banked) });
        opts.push({
          label: "The Exchange", swatch: "#e7c873",
          sub: "gold for DRIFTS, DRIFTS for gold · daily caps by standing",
          onClick: () => { bus.emit("exInfo", true); setMenu("exchange"); },
        });
      }
    }
  } else if (openShop === "wheel") {
    if (!s.online) {
      info = "The Wheel only spins in the shared world.";
    } else {
      info = `Gold, shards, or nothing. Jackpot 500g. Results land in your log.`;
      opts.push({
        label: `Spin the wheel`, right: `${SPIN_COST}g`,
        onClick: () => {
          // the server ledger pays; this check is just fast feedback
          if (s.gold < SPIN_COST) return respond(`A spin costs ${SPIN_COST}g.`);
          bus.emit("spin", true);
          respond("Round she goes…");
        },
      });
      if (s.wallet && s.holder) {
        opts.push({
          label: "Spin on a burn", sub: "DRIFTS burned, gone for good",
          right: <>{burnAmt(BURN_COSTS.spin)} <DriftsMark /></>,
          onClick: () => { bus.emit("spinBurn", true); respond("The chain takes its due…"); },
        });
        opts.push({
          label: "Spin the DRIFT WHEEL", swatch: "#a855f7",
          sub: "cosmetics, shards, a 1% Drift-touched relic",
          right: <>{burnAmt(BURN_COSTS.driftSpin)} <DriftsMark /></>,
          onClick: () => { bus.emit("driftSpinBurn", true); respond("The dark wheel wakes…"); },
        });
        opts.push({
          label: "Buy a Drift Cache", swatch: "#d8b4fe",
          sub: "three Drift Wheel spins, bundled (20% off)",
          right: <>{burnAmt(BURN_COSTS.cache)} <DriftsMark /></>,
          onClick: () => { bus.emit("cacheBurn", true); respond("Three turns of the dark wheel…"); },
        });
      }
    }
  } else if (openShop === "furnisher") {
    if (!s.online) {
      info = "The Furnisher only trades in the shared world.";
    } else {
      (Object.keys(PROP_CATALOG) as PropKey[]).forEach((k) => {
        opts.push({
          label: PROP_CATALOG[k].label, right: `${PROP_CATALOG[k].price}g`,
          onClick: () => {
            if (s.myClaims === 0) return respond("Furnishings need a claim to stand on. Stake land first.");
            // the server ledger pays when the furnishing stands
            if (s.gold < PROP_CATALOG[k].price) return respond(`Coin first. ${PROP_CATALOG[k].price}g.`);
            bus.emit("placeProp", k);
          },
        });
      });
    }
  } else if (openShop === "menagerie") {
    (Object.keys(PET_CATALOG) as PetKey[]).forEach((k) => {
      const owned = s.ownedPets.includes(k);
      const active = s.cosmetics.pet === k;
      opts.push({
        label: PET_CATALOG[k].label, sub: owned ? PET_CATALOG[k].flavor : undefined,
        right: active ? "dismiss" : owned ? "summon" : `${PET_CATALOG[k].price}g`,
        onClick: () => {
          if (active) { s.setCosmetics({ pet: "" }); respond("It will sulk, you know."); return; }
          if (owned) { s.setCosmetics({ pet: k }); respond("It remembers you."); return; }
          if (!s.spendGold(PET_CATALOG[k].price, "shop")) return respond(`Coin first. ${PET_CATALOG[k].price}g.`);
          s.grantCosmetic("pet", k);
          s.setCosmetics({ pet: k });
          respond("It follows you now. It chose you, really.");
        },
      });
    });
  }
  else if (openShop === "mirehut") {
    // brews cost coin AND materials; stronger + longer than tavern drinks
    const brews: {
      label: string; sub: string; gold: number;
      item: ItemKey; qty: number; buff: "gather" | "damage" | "sight"; ms: number;
    }[] = [
      { label: "Deepwine", sub: "+25% gather speed, 15 min", gold: 60, item: "hide", qty: 2, buff: "gather", ms: 15 * 60_000 },
      { label: "Marrowbrew", sub: "+damage, 15 min", gold: 80, item: "driftshard", qty: 1, buff: "damage", ms: 15 * 60_000 },
      { label: "Witchsight", sub: "see node charges, 20 min", gold: 50, item: "hide", qty: 1, buff: "sight", ms: 20 * 60_000 },
    ];
    for (const b of brews) {
      opts.push({
        label: b.label, sub: b.sub,
        right: `${b.gold}g + ${b.qty} ${ITEM_META[b.item].label}`,
        onClick: () => {
          if (s.inventory[b.item] < b.qty) return respond(`The brew wants ${b.qty} ${ITEM_META[b.item].label}. Bring it.`);
          if (!s.spendGold(b.gold, "shop")) return respond(`Coin first. ${b.gold}g.`);
          s.removeItem(b.item, b.qty, "brew");
          s.applyBuff(b.buff, b.ms);
          respond("Drink it all. Don't ask what's in it.");
        },
      });
    }
    opts.push({
      label: "Read the Drift", sub: "where will the corruption press?",
      onClick: () => {
        const snap = s.minimap;
        if (!snap) return respond("The waters are clouded. Come back.");
        let sx = 0, sy = 0, n = 0;
        for (let y = 0; y < snap.h; y++) for (let x = 0; x < snap.w; x++) {
          if (snap.tiles[y * snap.w + x] === 4) { sx += x; sy += y; n++; }
        }
        if (n === 0) return respond("The land breathes easy. For now.");
        const dx = sx / n - snap.w / 2;
        const dy = sy / n - snap.h / 2;
        const dir =
          Math.abs(dx) > Math.abs(dy) * 2 ? (dx > 0 ? "east" : "west") :
          Math.abs(dy) > Math.abs(dx) * 2 ? (dy > 0 ? "south" : "north") :
          `${dy > 0 ? "south" : "north"}-${dx > 0 ? "east" : "west"}`;
        respond(`The mere shows me ash on the ${dir} wind. Ward your ground there.`);
      },
    });
  } else if (openShop === "obelisk") {
    opts.push({
      label: "Rewrite the day's tasks", sub: "a fresh set of dailies", right: "75g",
      onClick: () => {
        if (s.online) {
          bus.emit("questReroll", true); // server debits 75g + rerolls + syncs
          respond("THE ASH ACCEPTS. THE DAY IS REWRITTEN.");
          return;
        }
        if (!s.spendGold(75, "shop")) return respond("THE ASH TAKES COIN. 75.");
        s.rerollQuests();
        respond("THE ASH ACCEPTS. THE DAY IS REWRITTEN.");
      },
    });
    if (s.wallet && s.holder) {
      opts.push({
        label: "Rewrite on a burn", sub: "DRIFTS burned, gone for good",
        right: <>{burnAmt(BURN_COSTS.obelisk)} <DriftsMark /></>,
        onClick: () => { bus.emit("obeliskBurn", true); respond("THE CHAIN CARRIES IT TO US…"); },
      });
    }
    opts.push({
      label: "Blessing of Ash", sub: "+gather speed, 10 min", right: "60g",
      onClick: () => {
        if (!s.spendGold(60, "shop")) return respond("THE ASH TAKES COIN. 60.");
        s.applyBuff("gather", 10 * 60_000);
        respond("WORK, LITTLE WANDERER. THE ASH WATCHES.");
      },
    });
  }
  // the mine overseer has nothing to sell; just the word and the work

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        bottom: 92, zIndex: 30, width: 470,
        // the glass draws the tried-on body on your centered sprite — slide the
        // panel left of center (clear of the Skills panel) so it isn't blocked
        ...(pv
          ? {
              left: "calc(var(--hud-edge) + 228px)",
              transform: "scale(var(--hud-scale))",
              transformOrigin: "bottom left",
            }
          : {
              left: "50%",
              transform: "translateX(-50%) scale(var(--hud-scale))",
              transformOrigin: "bottom center",
            }),
      }}
    >
      <Panel
        kicker="The Waystation"
        title={keeper.name}
        accessory={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, background: keeper.swatch, boxShadow: "var(--bevel-slot)" }} />
            <Button size="sm" variant="ghost" onClick={close}>✕</Button>
          </span>
        }
      >
        <div style={{ font: "italic 400 12.5px/1.5 var(--font-ui)", color: "var(--text-primary)", marginBottom: info ? 4 : 10 }}>
          “{say ?? greet}”
        </div>
        {info && (
          <div style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)", marginBottom: 8 }}>
            {info}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "38vh", overflowY: "auto" }}>
          {opts.map((o, i) => (
            <button
              key={`${menu}-${i}-${o.label}`}
              onClick={o.onClick}
              className="drift-well"
              style={{
                display: "flex", alignItems: "center", gap: 8, border: 0,
                padding: "7px 10px", cursor: "pointer", textAlign: "left",
              }}
            >
              {o.swatch && <span style={{ width: 12, height: 12, background: o.swatch, boxShadow: "var(--bevel-slot)", flexShrink: 0 }} />}
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "600 12px/1.2 var(--font-ui)", color: "var(--text-primary)" }}>{o.label}</span>
                {o.sub && <span style={{ font: "400 9.5px/1.3 var(--font-ui)", color: "var(--text-muted)" }}>{o.sub}</span>}
              </span>
              {o.right && (
                <span className="drift-num" style={{ fontSize: 11, color: "var(--drift-gold)", flexShrink: 0 }}>{o.right}</span>
              )}
            </button>
          ))}
          <button
            onClick={close}
            className="drift-well"
            style={{ border: 0, padding: "7px 10px", cursor: "pointer", textAlign: "center", font: "600 11px/1 var(--font-ui)", color: "var(--text-secondary)" }}
          >
            {keeper.leave}
          </button>
        </div>
      </Panel>
    </div>
  );
}

function ShrinePanel() {
  const s = useGame();
  if (!s.online) return <OfflineNote what="The Shrine" />;
  const donate = (amount: number) => {
    const a = Math.min(amount, s.gold);
    if (a <= 0) return;
    // the server ledger pays; donateResult logs it and tallies the stat
    bus.emit("donate", a);
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
        {!!s.wallet && s.holder && (
          <Button size="sm" variant="ghost" onClick={() => bus.emit("cleanseBurn", true)}
            title={`Burn ${BURN_COSTS.cleanse.toLocaleString()} DRIFTS on-chain; the Flame counts it as 150g`}>
            Burn {burnAmt(BURN_COSTS.cleanse)} <DriftsMark />
          </Button>
        )}
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
  const [dWager, setDWager] = useState<number>(DUEL_DRIFTS.min);
  const [mode, setMode] = useState<"gold" | "drifts">("gold");
  if (!s.online) return <OfflineNote what="The Pit" />;
  const others = s.roster.filter((r) => !r.self);
  const q = s.pitQueue;
  const qDrifts = q?.currency === "drifts";
  const qUnit = qDrifts ? "◆" : "g";
  const qShort = (n: number) => n.toLocaleString();
  // can I cover an open stake? (gold from the purse, DRIFTS from the linked wallet)
  const canMeet = q ? (qDrifts ? !!s.wallet && s.tokenBalance >= q.wager : s.gold >= q.wager) : false;
  return (
    <>
      <div style={{ font: "400 11px/1.5 var(--font-ui)", color: "var(--text-secondary)", marginBottom: 8 }}>
        Honorable violence. Both fighters stake the wager; the winner takes the pot.
        The arena seals until one of you falls. No tombstones, no grudges. (Some grudges.)
      </div>
      {/* the ring: post an open stake, or meet the one already waiting */}
      {q && !q.mine ? (
        <div style={{ marginBottom: 10 }}>
          <div style={{ font: "400 11px/1.4 var(--font-ui)", color: "var(--drift-corrupt)", marginBottom: 6 }}>
            {q.name} waits in the ring. The stake is {qShort(q.wager)}{qUnit}.
          </div>
          <Button size="sm" variant="primary"
            style={!canMeet ? { opacity: 0.45 } : undefined}
            onClick={() => {
              if (!canMeet) return;
              bus.emit(qDrifts ? "pitJoinDrifts" : "pitJoin", q.wager);
            }}>
            Meet them in the ring · {qShort(q.wager)}{qUnit}
          </Button>
          {qDrifts && !s.wallet && (
            <div style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)", marginTop: 4 }}>
              Link a wallet in the You panel to meet a DRIFTS stake.
            </div>
          )}
        </div>
      ) : q && q.mine ? (
        <div style={{ marginBottom: 10 }}>
          <div style={{ font: "400 11px/1.4 var(--font-ui)", color: "var(--drift-gold)", marginBottom: 6 }}>
            You wait in the ring ({qShort(q.wager)}{qUnit} staked). The sand is patient.
            {qDrifts && " Your DRIFTS return if no one comes."}
          </div>
          <Button size="sm" variant="ghost" onClick={() => bus.emit("pitLeave", true)}>
            Step out of the ring
          </Button>
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          {/* currency toggle: gold rides the ledger, DRIFTS ride on-chain escrow */}
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {(["gold", "drifts"] as const).map((c) => (
              <Button key={c} size="sm" variant={mode === c ? "primary" : "ghost"}
                onClick={() => setMode(c)}>
                {c === "gold" ? "Gold" : "DRIFTS"}
              </Button>
            ))}
          </div>
          {mode === "gold" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span className="drift-label" style={{ fontSize: 9 }}>Wager</span>
                <input type="number" min={0} max={5000} value={wager}
                  onChange={(e) => setWager(Math.max(0, Math.min(5000, Number(e.target.value) | 0)))}
                  className="drift-well"
                  style={{ width: 70, border: 0, outline: "none", padding: "5px 7px", font: "400 12px/1 var(--font-ui)", color: "var(--drift-gold)", background: "var(--surface-well)" }} />
                <span style={{ font: "400 9.5px/1 var(--font-ui)", color: "var(--text-muted)" }}>gold each</span>
              </div>
              <Button size="sm" variant="primary"
                style={s.gold < wager ? { opacity: 0.45 } : undefined}
                onClick={() => {
                  if (s.gold < wager) return;
                  bus.emit("pitJoin", wager);
                  s.pushLog(`You step into the ring (${wager}g staked).`, "#dc2626");
                }}>
                Step into the ring
              </Button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span className="drift-label" style={{ fontSize: 9 }}>Wager</span>
                <input type="number" min={DUEL_DRIFTS.min} max={DUEL_DRIFTS.max} step={1000} value={dWager}
                  onChange={(e) => setDWager(Math.max(DUEL_DRIFTS.min, Math.min(DUEL_DRIFTS.max, Number(e.target.value) | 0)))}
                  className="drift-well"
                  style={{ width: 96, border: 0, outline: "none", padding: "5px 7px", font: "400 12px/1 var(--font-ui)", color: "#d8b4fe", background: "var(--surface-well)" }} />
                <span style={{ font: "400 9.5px/1 var(--font-ui)", color: "var(--text-muted)" }}>DRIFTS each</span>
              </div>
              <div style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)", marginBottom: 8 }}>
                Min {DUEL_DRIFTS.min.toLocaleString()}◆. The house keeps {DUEL_DRIFTS.feePct * 100}% of the pot; the winner takes the rest. Stakes are held on-chain.
              </div>
              <Button size="sm" variant="primary"
                style={!s.wallet || s.tokenBalance < dWager ? { opacity: 0.45 } : undefined}
                onClick={() => {
                  if (!s.wallet || s.tokenBalance < dWager) return;
                  bus.emit("pitJoinDrifts", dWager);
                }}>
                Stake into the ring
              </Button>
              {!s.wallet && (
                <div style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)", marginTop: 4 }}>
                  Link a wallet in the You panel to wager DRIFTS.
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* or call someone out by name (the old way still stands) */}
      {others.length === 0 ? (
        <div style={{ font: "400 11px/1.4 var(--font-ui)", color: "var(--text-muted)" }}>
          No one else walks the Drift right now. The sand waits.
        </div>
      ) : (
        <div className="drift-label" style={{ fontSize: 9, margin: "6px 0 4px" }}>Or call someone out</div>
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

/** THE LONG NIGHT: top-center defense banner (kills + countdown) */
/** the Threshold: objective banner + a way out for those who know the realm */
function TutorialBanner() {
  const objective = useGame((s) => s.tutorialObjective);
  const setTutorialDone = useGame((s) => s.setTutorialDone);
  const setTutorialObjective = useGame((s) => s.setTutorialObjective);
  if (!objective) return null;
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ bottom: 96, left: "50%", transform: "translateX(-50%) scale(var(--hud-scale))", transformOrigin: "bottom center", zIndex: 24 }}
    >
      <Panel padded={false} corners={false} style={{ padding: "8px 16px", boxShadow: "0 0 0 1px var(--drift-gold), var(--shadow-pixel)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="drift-label" style={{ fontSize: 11, color: "var(--drift-gold)", letterSpacing: 2 }}>
            THE THRESHOLD
          </div>
          <div style={{ font: "600 12px/1.4 var(--font-ui)", color: "var(--text-primary)" }}>
            {objective}
          </div>
          <button
            onClick={() => {
              setTutorialObjective(null);
              setTutorialDone(true);
            }}
            style={{
              marginTop: 4, background: "none", border: 0, cursor: "pointer",
              font: "400 10px/1 var(--font-ui)", color: "var(--text-muted)",
              textDecoration: "underline", textUnderlineOffset: 2,
            }}
          >
            I know the Drift · skip the lessons
          </button>
        </div>
      </Panel>
    </div>
  );
}

/** a subtle top-center control hint; click to dismiss, hidden during the Long
 *  Night so it never collides with that banner */
function ZoomTip() {
  const night = useGame((s) => s.night);
  const [show, setShow] = useState(true);
  if (!show || night) return null;
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ top: 14, left: "50%", transform: "translateX(-50%) scale(var(--hud-scale))", transformOrigin: "top center", zIndex: 23, cursor: "pointer" }}
      onClick={() => setShow(false)}
      title="Dismiss"
    >
      <Panel padded={false} corners={false} style={{ padding: "5px 12px", opacity: 0.8 }}>
        <div className="drift-label" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5 }}>
          Scroll to zoom the realm
        </div>
      </Panel>
    </div>
  );
}

function NightBanner() {
  const night = useGame((s) => s.night);
  if (!night) return null;
  const mm = Math.floor(night.endsIn / 60);
  const ss = String(night.endsIn % 60).padStart(2, "0");
  const held = night.kills >= night.need;
  return (
    <div
      className="absolute pointer-events-none"
      style={{ top: 14, left: "50%", transform: "translateX(-50%) scale(var(--hud-scale))", transformOrigin: "top center", zIndex: 24 }}
    >
      <Panel padded={false} corners={false} style={{ padding: "8px 16px", boxShadow: "0 0 0 1px var(--drift-blood), var(--shadow-pixel)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="drift-label" style={{ fontSize: 11, color: "var(--drift-blood)", letterSpacing: 2 }}>
            THE LONG NIGHT
          </div>
          <div style={{ font: "600 12px/1.4 var(--font-ui)", color: held ? "var(--drift-gold)" : "var(--text-primary)" }}>
            {held ? "The line holds. Survive until dawn" : "Hold the Waystation"}
            {" · "}
            <span className="drift-num">{night.kills}/{night.need}</span>
            {" raiders · "}
            <span className="drift-num">{mm}:{ss}</span>
          </div>
        </div>
      </Panel>
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
          Stand beside your opponent. Your wanderer swings on its own. Pot: {(duel.currency === "drifts" ? Math.floor(duel.wager * 2 * (1 - DUEL_DRIFTS.feePct)) : duel.wager * 2).toLocaleString()}{duel.currency === "drifts" ? "◆" : "g"}
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

/** middle of the right column: dock buttons + minimap.
 *  flexShrink 0 — the rail must NEVER be compressed by the column, or its
 *  contents paint under later siblings (the Activity-covers-Forge bug). */
// ---- right rail: the seasonal battle pass (the Drift Ledger) -------------------

function fmtEndsIn(ms: number): string {
  if (ms <= 0) return "ending";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function PassRewardChip({ reward }: { reward?: { kind: string; amount?: number; label?: string } }) {
  if (!reward) return <span style={{ font: "400 9px/1 var(--font-ui)", color: "var(--text-muted)" }}>·</span>;
  if (reward.kind === "gold")
    return <span style={{ font: "600 10px/1 var(--font-num)", color: "var(--drift-gold)" }}>{reward.amount}g</span>;
  if (reward.kind === "shards")
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        <Icon name="drift" size={12} />
        <span style={{ font: "600 10px/1 var(--font-num)", color: "var(--text-primary)" }}>{reward.amount}</span>
      </span>
    );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <Icon name="pass" size={12} />
      <span style={{ font: "600 9px/1.1 var(--font-ui)", color: "var(--drift-corrupt)" }}>{reward.label}</span>
    </span>
  );
}

function PassDock() {
  const open = useGame((s) => s.openDock) === "pass";
  const setOpenDock = useGame((s) => s.setOpenDock);
  const setOpen = (next: boolean) => setOpenDock(next ? "pass" : null);
  const online = useGame((s) => s.online);
  const bp = useGame((s) => s.battlePass);
  const wallet = useGame((s) => s.wallet);
  const holder = useGame((s) => s.holder);

  const earned = bp ? bp.tier : 0;
  const xpInTier = bp ? bp.xp % 1000 : 0;

  return (
    <div style={{ position: "relative" }}>
      <Button
        variant={open ? "primary" : "ghost"}
        size="md"
        onClick={() => setOpen(!open)}
        iconLeft={<Icon name="pass" size={16} glow={open} />}
      >
        Pass
      </Button>
      <DockPopout open={open}>
        <Panel
          kicker={bp ? `Season ${bp.season} · ${bp.name}` : "The Drift Ledger"}
          title="Drift Ledger"
          style={{ width: 340 }}
        >
          {(!online || !bp) && (
            <div style={{ font: "400 11px/1.4 var(--font-ui)", color: "var(--text-muted)" }}>
              The season's ledger opens when you're in the shared world.
            </div>
          )}
          {online && bp && (
            <>
              {/* season header: tier + countdown */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ font: "700 13px/1 var(--font-display)", color: "var(--text-primary)" }}>
                  Tier {earned}<span style={{ color: "var(--text-muted)", fontWeight: 400 }}> / {bp.maxTier}</span>
                </span>
                <span style={{ font: "400 10px/1 var(--font-ui)", color: "var(--text-muted)" }}>
                  ends in {fmtEndsIn(bp.endsIn)}
                </span>
              </div>
              <XPBar skill="Season XP" level={earned} value={xpInTier} max={1000} color="var(--drift-corrupt)" />

              {/* premium unlock — or the owned badge once it's been bought */}
              {bp.premium ? (
                <div
                  style={{
                    marginTop: 8, padding: "6px 10px", textAlign: "center",
                    border: "1px solid var(--drift-gold)", background: "rgba(231, 200, 115, 0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    font: "700 11px/1 var(--font-ui)", color: "var(--drift-gold)", letterSpacing: "0.04em",
                  }}
                >
                  <Icon name="pass" size={14} /> PREMIUM UNLOCKED
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {wallet && holder ? (
                    <Button size="sm" variant="gold" style={{ width: "100%" }}
                      onClick={() => bus.emit("passBuyBurn", true)}>
                      Unlock Premium · {burnAmt(BURN_COSTS.battlePass)} <DriftsMark />
                    </Button>
                  ) : (
                    <div style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)", textAlign: "center" }}>
                      Premium opens with {burnAmt(BURN_COSTS.battlePass)} <DriftsMark /> burned. Link a wallet that holds them.
                    </div>
                  )}
                </div>
              )}

              {/* weekly challenges */}
              <label className="drift-label" style={{ fontSize: 9, display: "block", margin: "10px 0 4px" }}>
                This week's trials
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                {bp.challenges.map((c) => {
                  const def = BP_CHALLENGE_POOL.find((d) => d.id === c.id);
                  if (!def) return null;
                  const pct = Math.min(100, Math.round((c.progress / def.target) * 100));
                  return (
                    <div key={c.id} className="drift-well" style={{ padding: "4px 8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ font: "600 10px/1.2 var(--font-ui)", color: c.claimed ? "var(--drift-corrupt)" : "var(--text-primary)" }}>
                          {def.label}
                        </span>
                        <span style={{ font: "400 9px/1 var(--font-num)", color: "var(--text-muted)" }}>
                          {c.claimed ? `+${def.passXp} XP` : `${c.progress}/${def.target}`}
                        </span>
                      </div>
                      <div style={{ height: 4, marginTop: 3, background: "var(--surface-well)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--drift-corrupt)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* the tier track */}
              <label className="drift-label" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Free</span>
                <span style={{ color: bp.premium ? "var(--drift-gold)" : "var(--text-muted)" }}>Premium</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 240, overflowY: "auto" }}>
                {bp.tiers.map((t, i) => {
                  const tier = i + 1;
                  const reached = tier <= earned;
                  const freeClaimable = reached && !!t.free && !bp.claimedFree.includes(tier);
                  const premClaimable = reached && bp.premium && !!t.premium && !bp.claimedPremium.includes(tier);
                  const freeClaimed = bp.claimedFree.includes(tier);
                  const premClaimed = bp.claimedPremium.includes(tier);
                  return (
                    <div key={tier} className="drift-well"
                      style={{ display: "grid", gridTemplateColumns: "26px 1fr 1fr", alignItems: "center", gap: 6, padding: "4px 7px", opacity: reached ? 1 : 0.5 }}>
                      <span style={{ font: "700 10px/1 var(--font-num)", color: reached ? "var(--drift-corrupt)" : "var(--text-muted)" }}>
                        {tier}
                      </span>
                      {/* free track */}
                      <button
                        disabled={!freeClaimable}
                        onClick={() => freeClaimable && bus.emit("passClaim", { tier, track: "free" })}
                        style={{
                          display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
                          cursor: freeClaimable ? "pointer" : "default", padding: 0,
                          opacity: freeClaimed ? 0.4 : 1,
                          textDecoration: freeClaimable ? "underline" : "none",
                        }}
                      >
                        <PassRewardChip reward={t.free} />
                        {freeClaimed && <span style={{ font: "400 8px/1 var(--font-ui)", color: "var(--text-muted)" }}>✓</span>}
                      </button>
                      {/* premium track */}
                      <button
                        disabled={!premClaimable}
                        onClick={() => premClaimable && bus.emit("passClaim", { tier, track: "premium" })}
                        style={{
                          display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
                          cursor: premClaimable ? "pointer" : "default", padding: 0,
                          opacity: !bp.premium ? 0.5 : premClaimed ? 0.4 : 1,
                          textDecoration: premClaimable ? "underline" : "none",
                        }}
                      >
                        <PassRewardChip reward={t.premium} />
                        {premClaimed && <span style={{ font: "400 8px/1 var(--font-ui)", color: "var(--text-muted)" }}>✓</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Panel>
      </DockPopout>
    </div>
  );
}

function RightRail() {
  return (
    <div
      className="pointer-events-auto"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <ForgeDock />
      <MarketDock />
      <PassDock />
      <IdentityDock />
      <StakeButton />
      <ReinforceButton />
      <MinimapPanel />
    </div>
  );
}

/**
 * Dock pop-out wrapper: the open panel is an absolutely-positioned overlay
 * anchored left of its button. It occupies ZERO space in the right column, so
 * opening it can never change the column layout or hide other controls.
 * Tall content scrolls inside the overlay instead of growing past the screen.
 */
function DockPopout({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: "100%",
        top: 0,
        marginRight: 8,
        zIndex: 20,
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  );
}

// ---- right rail: player marketplace ---------------------------------------------

function MarketDock() {
  const open = useGame((s) => s.openDock) === "market";
  const setOpenDock = useGame((s) => s.setOpenDock);
  const setOpen = (next: boolean) => setOpenDock(next ? "market" : null);
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
    <div style={{ position: "relative" }}>
      <Button
        variant={open ? "primary" : "ghost"}
        size="md"
        onClick={() => setOpen(!open)}
        iconLeft={<Icon name="coin" size={16} glow={open} />}
      >
        Market
      </Button>
      <DockPopout open={open}>
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
                    // minWidth 0 lets flex shrink the select below its text's
                    // min-content width; without it the row overflows and the
                    // popout clips the price input + List button
                    style={{ flex: 1, minWidth: 0, border: 0, outline: "none", padding: "5px 6px", font: "400 11px/1 var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)" }}
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
                <RelicStall />
              </>
            )}
          </Panel>
      </DockPopout>
    </div>
  );
}

/** the relic stall: P2P Drift-touched cosmetics, priced in DRIFTS, the fee
 *  burned. Only server-authoritative prestige cosmetics trade here. */
function RelicStall() {
  const relics = useGame((s) => s.relics);
  const wallet = useGame((s) => s.wallet);
  const ownedDyes = useGame((s) => s.ownedDyes);
  const ownedAuras = useGame((s) => s.ownedAuras);
  const myName = useGame((s) => s.cosmetics.name);
  const [listKey, setListKey] = useState("");
  const [listPrice, setListPrice] = useState<number>(RELIC_MARKET.minPrice);

  // what I can put on the stall: owned cosmetics that are prestige + tradable
  const listable = Object.entries(PRESTIGE_CATALOG)
    .filter(([k, e]) =>
      e.kind !== "title" &&
      (e.kind === "dye" ? ownedDyes.includes(k as never) : ownedAuras.includes(k as never)) &&
      !relics.some((r) => r.key === k && r.sellerName === myName),
    )
    .map(([k, e]) => ({ key: k, label: e.label }));

  return (
    <>
      <label className="drift-label" style={{ fontSize: 9, display: "block", margin: "12px 0 4px" }}>
        Relic stall <span style={{ color: "var(--text-muted)" }}>· Drift-touched only · 5% burns</span>
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 110, overflowY: "auto", marginBottom: 8 }}>
        {relics.length === 0 && (
          <span style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)" }}>
            No relics on the stall.
          </span>
        )}
        {relics.map((r) => {
          const mine = r.sellerName === myName;
          return (
            <div key={r.id} className="drift-well" style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px" }}>
              <span style={{ font: "600 11px/1 var(--font-ui)", color: "#d8b4fe" }}>
                {PRESTIGE_CATALOG[r.key]?.label ?? r.key}
              </span>
              <span style={{ flex: 1, font: "400 9px/1 var(--font-ui)", color: "var(--text-muted)", textAlign: "right" }}>
                {r.sellerName}
              </span>
              <span className="drift-num" style={{ font: "600 10px/1 var(--font-ui)", color: "var(--drift-gold)" }}>
                {r.price.toLocaleString()} <DriftsMark />
              </span>
              {mine ? (
                <Button size="sm" variant="ghost" onClick={() => bus.emit("relicUnlist", r.id)}>Pull</Button>
              ) : (
                <Button
                  size="sm" variant="gold"
                  onClick={() => bus.emit("relicBuy", r.id)}
                  style={!wallet ? { opacity: 0.45 } : undefined}
                  title={wallet ? undefined : "Link a wallet first"}
                >
                  Buy
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {listable.length > 0 && wallet && (
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <select
            className="drift-well"
            value={listKey}
            onChange={(e) => setListKey(e.target.value)}
            style={{ flex: 1, border: 0, padding: "6px", font: "400 10px var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)" }}
          >
            <option value="">List a relic…</option>
            {listable.map((l) => (
              <option key={l.key} value={l.key}>{l.label}</option>
            ))}
          </select>
          <input
            className="drift-well"
            type="number"
            min={RELIC_MARKET.minPrice}
            value={listPrice}
            onChange={(e) => setListPrice(Math.max(RELIC_MARKET.minPrice, Math.round(Number(e.target.value) || 0)))}
            style={{ width: 84, border: 0, padding: "6px", font: "400 10px var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)" }}
            title="Price in DRIFTS"
          />
          <Button
            size="sm" variant="primary"
            onClick={() => listKey && bus.emit("relicList", { key: listKey, price: listPrice })}
            style={!listKey ? { opacity: 0.45 } : undefined}
          >
            List
          </Button>
        </div>
      )}
    </>
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

/** burn DRIFTS to shore up your weakest claim (+25 integrity, capped at 100) */
function ReinforceButton() {
  const online = useGame((s) => s.online);
  const myClaims = useGame((s) => s.myClaims);
  const wallet = useGame((s) => s.wallet);
  const holder = useGame((s) => s.holder);
  if (!online || !wallet || !holder || myClaims === 0) return null;
  return (
    <Button
      variant="ghost"
      size="md"
      onClick={() => bus.emit("reinforceBurn", true)}
      iconLeft={<Icon name="sigil" size={16} />}
      title={`Burn ${burnAmt(BURN_COSTS.reinforce)} DRIFTS to shore up your weakest claim against the Drift (+25 warding, to 100)`}
    >
      Reinforce · {burnAmt(BURN_COSTS.reinforce)} <DriftsMark />
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
  const open = useGame((s) => s.openDock) === "you";
  const setOpenDock = useGame((s) => s.setOpenDock);
  const setOpen = (next: boolean) => setOpenDock(next ? "you" : null);
  const [sound, setSound] = useState(true);
  useEffect(() => setSound(audioEnabled()), []);
  const cosmetics = useGame((s) => s.cosmetics);
  const setCosmetics = useGame((s) => s.setCosmetics);
  const skills = useGame((s) => s.skills);
  const kills = useGame((s) => s.kills);
  const stats = useGame((s) => s.stats);
  const ownedDyes = useGame((s) => s.ownedDyes);
  const ownedEyes = useGame((s) => s.ownedEyes);
  const ownedAvatars = useGame((s) => s.ownedAvatars);
  const ownedTitles = useGame((s) => s.ownedTitles);
  const title = currentTitle({ skills, kills, stats, ownedTitles });

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
    <div style={{ position: "relative" }}>
      <Button
        variant={open ? "primary" : "ghost"}
        size="md"
        onClick={() => setOpen(!open)}
        iconLeft={<Icon name="heart" size={16} glow={open} />}
      >
        You
      </Button>
      <DockPopout open={open}>
        <Panel kicker="The Wanderer" title="Identity" style={{ width: 296 }}>
            {/* name: sworn at the door, fixed while inside the realm */}
            <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
              Name <span style={{ color: "var(--text-muted)" }}>· sworn at the door</span>
            </label>
            <div
              className="drift-well"
              title="Leave the realm to take a new name"
              style={{
                width: "100%", padding: "7px 9px", boxSizing: "border-box",
                font: "600 13px/1 var(--font-ui)", color: "var(--text-primary)",
                background: "var(--surface-well)", marginBottom: 8,
              }}
            >
              {cosmetics.name || "Wanderer"}
            </div>
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
            {/* premium avatars (burn-bought at the Dyeworks glass) */}
            {ownedAvatars.length > 0 && (
              <>
                <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
                  Skin <span style={{ color: "var(--text-muted)" }}>· from the Dyeworks glass</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                  <Button
                    size="sm"
                    variant={cosmetics.avatar === "" ? "primary" : "ghost"}
                    onClick={() => setCosmetics({ avatar: "", avA: "", avB: "" })}
                  >
                    Wanderer
                  </Button>
                  {ownedAvatars.map((k) => (
                    <Button
                      key={k}
                      size="sm"
                      variant={cosmetics.avatar === k ? "primary" : "ghost"}
                      onClick={() => setCosmetics({ avatar: k, avA: "", avB: "" })}
                    >
                      {PRESTIGE_CATALOG[k]?.label ?? k}
                    </Button>
                  ))}
                </div>
                {cosmetics.avatar && (
                  <div style={{ marginBottom: 10 }}>
                    {Object.entries(AVATAR_CHANNELS[cosmetics.avatar]).map(([chan, options], ci) => (
                      <div key={chan} style={{ marginBottom: 4 }}>
                        <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 3 }}>
                          {chan}
                        </label>
                        <div style={{ display: "flex", gap: 5 }}>
                          {options.map((opt) =>
                            swatchBtn(
                              RAMP_SWATCH[opt] ?? "#a855f7",
                              ((ci === 0 ? cosmetics.avA : cosmetics.avB) || options[0]) === opt,
                              () => setCosmetics(ci === 0 ? { avA: opt } : { avB: opt }),
                              `${chan} · ${opt}`,
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
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
            {/* Solana wallet (devnet) */}
            <label className="drift-label" style={{ fontSize: 9, display: "block", marginBottom: 4 }}>
              Wallet <span style={{ color: "var(--text-muted)" }}>· beta</span>
            </label>
            <WalletRow />
            {/* guilds: found / join / territory (the recurring social sink) */}
            <label className="drift-label" style={{ fontSize: 9, display: "block", margin: "10px 0 4px" }}>
              Guild
            </label>
            <GuildSection />
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
      </DockPopout>
    </div>
  );
}

/** link/unlink a Solana wallet (devnet only; signature flow runs in the engine) */
/** found / join / run a guild. Founding burns DRIFTS and requires a holding;
 *  territory + upkeep are the recurring sink. Region perks are server-side. */
function GuildSection() {
  const online = useGame((s) => s.online);
  const wallet = useGame((s) => s.wallet);
  const tokenBalance = useGame((s) => s.tokenBalance);
  const guilds = useGame((s) => s.guilds);
  const myTag = useGame((s) => s.myGuildTag);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [region, setRegion] = useState<string>(GUILD.regions[0]);

  if (!online) {
    return (
      <div style={{ font: "400 10px/1.4 var(--font-ui)", color: "var(--text-muted)", marginBottom: 8 }}>
        Banners only rise in the shared world.
      </div>
    );
  }

  const mine = guilds.find((g) => g.tag === myTag);
  if (mine) {
    const held = mine.region && mine.regionSecsLeft > 0;
    const hrs = Math.floor(mine.regionSecsLeft / 3600);
    const mins = Math.floor((mine.regionSecsLeft % 3600) / 60);
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ font: "600 12px/1.4 var(--font-ui)", color: "var(--text-primary)" }}>
          {mine.name} <span style={{ color: "#d8b4fe" }}>[{mine.tag}]</span>
          <span style={{ font: "400 10px var(--font-ui)", color: "var(--text-muted)" }}> · {mine.members}/{GUILD.maxMembers}</span>
        </div>
        <div style={{ font: "400 10px/1.5 var(--font-ui)", color: held ? "var(--drift-gold)" : "var(--text-muted)", margin: "2px 0 6px" }}>
          {held ? `Banner over ${mine.region} · ${hrs}h ${mins}m left` : "No banner stands."}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {!held && (
            <>
              <select
                className="drift-well"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{ flex: 1, border: 0, padding: "5px", font: "400 10px var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)" }}
              >
                {GUILD.regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <Button size="sm" variant="gold" onClick={() => bus.emit("guildTerritory", region)}
                title={`Burn ${burnAmt(BURN_COSTS.guildTerritory)} DRIFTS to stake the banner for 48h (founder only)`}>
                Stake · {burnAmt(BURN_COSTS.guildTerritory)} <DriftsMark />
              </Button>
            </>
          )}
          {held && (
            <Button size="sm" variant="gold" onClick={() => bus.emit("guildUpkeep", true)}
              title={`Burn ${burnAmt(BURN_COSTS.guildUpkeep)} DRIFTS to extend the banner 48h (any member)`}>
              Feed the banner · {burnAmt(BURN_COSTS.guildUpkeep)} <DriftsMark />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => bus.emit("guildLeave", true)} title="The founder cannot leave">
            Leave
          </Button>
        </div>
      </div>
    );
  }

  const canFound = !!wallet && tokenBalance >= GUILD.foundHold;
  return (
    <div style={{ marginBottom: 8 }}>
      {guilds.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 90, overflowY: "auto", marginBottom: 6 }}>
          {guilds.map((g) => (
            <div key={g.id} className="drift-well" style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 7px" }}>
              <span style={{ font: "600 10.5px/1 var(--font-ui)", color: "var(--text-primary)" }}>
                {g.name} [{g.tag}]
              </span>
              <span style={{ flex: 1, font: "400 9px/1 var(--font-ui)", color: "var(--text-muted)", textAlign: "right" }}>
                {g.members}/{GUILD.maxMembers}{g.region && g.regionSecsLeft > 0 ? ` · ${g.region}` : ""}
              </span>
              <Button size="sm" variant="ghost" onClick={() => bus.emit("guildJoin", g.id)}
                style={g.members >= GUILD.maxMembers ? { opacity: 0.45 } : undefined}>
                Join
              </Button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 5, marginBottom: 4 }}>
        <input
          className="drift-well" placeholder="Guild name" value={name} maxLength={GUILD.nameMax}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, border: 0, outline: "none", padding: "6px", font: "400 10px var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)" }}
        />
        <input
          className="drift-well" placeholder="TAG" value={tag} maxLength={GUILD.tagMax}
          onChange={(e) => setTag(e.target.value.toUpperCase())}
          style={{ width: 52, border: 0, outline: "none", padding: "6px", font: "600 10px var(--font-ui)", color: "var(--text-primary)", background: "var(--surface-well)", textAlign: "center" }}
        />
      </div>
      <Button
        size="sm" variant="gold"
        onClick={() => name.trim().length >= 3 && tag.trim().length >= 2 && bus.emit("guildFound", { name: name.trim(), tag: tag.trim() })}
        style={!canFound || name.trim().length < 3 || tag.trim().length < 2 ? { opacity: 0.45 } : undefined}
        title={canFound
          ? `Burn ${burnAmt(BURN_COSTS.guildFound)} DRIFTS to found (requires holding ${GUILD.foundHold.toLocaleString()})`
          : `Founding requires a linked wallet holding ${GUILD.foundHold.toLocaleString()} DRIFTS`}
      >
        Found a guild · {burnAmt(BURN_COSTS.guildFound)} <DriftsMark />
      </Button>
    </div>
  );
}

function WalletRow() {
  const wallet = useGame((s) => s.wallet);
  const online = useGame((s) => s.online);
  const holder = useGame((s) => s.holder);
  const tokenBalance = useGame((s) => s.tokenBalance);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      {wallet ? (
        <>
          <span
            className="drift-num"
            style={{ font: "600 11px/1 var(--font-ui)", color: "var(--drift-gold)" }}
            title={wallet}
          >
            {wallet.slice(0, 4)}…{wallet.slice(-4)}
          </span>
          {holder ? (
            <Badge tone="gold">
              {holderPerks(tokenBalance).label || "Holder"} ·{" "}
              {tokenBalance >= 1000 ? `${Math.floor(tokenBalance / 1000)}k` : Math.floor(tokenBalance)}
            </Badge>
          ) : (
            <span style={{ font: "400 9px/1 var(--font-ui)", color: "var(--text-muted)" }}>no DRIFTS</span>
          )}
          <Button size="sm" variant="ghost" onClick={() => bus.emit("walletLink", false)}>
            Unlink
          </Button>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => bus.emit("walletLink", true)}
            style={!online ? { opacity: 0.5 } : undefined}
            title={online ? "Sign a message to bind this wanderer to your wallet" : "Join the shared world first"}
          >
            Link wallet
          </Button>
          <span style={{ font: "400 9px/1.3 var(--font-ui)", color: "var(--text-muted)" }}>
            Phantom / Solflare
          </span>
        </>
      )}
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
      <a
        href="/"
        title="Leave the realm · back to the landing"
        className="drift-wordmark drift-wordmark-bleed drift-hud-text pointer-events-auto"
        style={{ fontSize: "var(--text-xl)", lineHeight: 1, textShadow: "none", textDecoration: "none", cursor: "pointer" }}
      >
        NAEVYR
      </a>
      <a
        href="/"
        className="drift-hud-text pointer-events-auto"
        title="Your progress is kept; the realm waits"
        style={{
          font: "600 9px/1 var(--font-ui)", color: "var(--text-muted)",
          textDecoration: "none", letterSpacing: "0.1em", marginTop: -4,
        }}
      >
        ← LEAVE THE REALM
      </a>
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
  const tokenBalance = useGame((s) => s.tokenBalance);
  const wallet = useGame((s) => s.wallet);
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
        {wallet != null && (
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15 }}
            title="DRIFTS held by your linked wallet"
          >
            <DriftsMark />
            <span
              className="drift-num drift-hud-text"
              style={{ fontWeight: 700, fontSize: 15, color: "var(--drift-corrupt)" }}
            >
              {tokenBalance.toLocaleString()}
            </span>
          </span>
        )}
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
  const trading = useGame((s) => s.openDock) === "trade";
  const setOpenDock = useGame((s) => s.setOpenDock);
  const setTrading = (next: boolean) => setOpenDock(next ? "trade" : null);
  const satchelOpen = useGame((s) => s.satchelOpen);
  const setSatchelOpen = useGame((s) => s.setSatchelOpen);
  const carried = INVENTORY_ORDER.reduce((n, k) => n + inv[k], 0);

  // collapsed: a slim button holds the spot; the Activity log takes the room
  if (!satchelOpen) {
    return (
      <div className="pointer-events-auto" style={{ flexShrink: 0 }}>
        <Button
          variant="ghost"
          size="md"
          onClick={() => setSatchelOpen(true)}
          iconLeft={<Icon name="bag" size={16} />}
        >
          Satchel · {carried}
        </Button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto" style={{ position: "relative", flexShrink: 0 }}>
      <Panel
        kicker="Satchel"
        title="Inventory"
        accessory={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Badge tone="neutral">{carried} carried</Badge>
            <Button
              size="sm"
              variant="ghost"
              title="Stow the satchel"
              onClick={() => {
                if (trading) setOpenDock(null); // the trader leaves with the bag
                setSatchelOpen(false);
              }}
              iconLeft={<Icon name="x" size={12} />}
            />
          </span>
        }
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
            onClick={() => setTrading(!trading)}
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
  // The column's ONE flexible item: it GROWS into whatever the column has left
  // (all of it when the satchel is stowed) and, when the screen is short, the
  // log shrinks and scrolls internally while the chat input stays pinned.
  return (
    <div
      className="pointer-events-auto"
      style={{
        flexGrow: 1,
        flexShrink: 1,
        minHeight: 170,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Panel
        kicker="Realm"
        title="Activity"
        fill
        style={{ width: 264, flex: 1, minHeight: 0 }}
      >
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <ActivityLog entries={entries} max={16} />
        </div>
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
  const open = useGame((s) => s.openDock) === "forge";
  const setOpenDock = useGame((s) => s.setOpenDock);
  const setOpen = (next: boolean) => setOpenDock(next ? "forge" : null);
  const inventory = useGame((s) => s.inventory);
  const skills = useGame((s) => s.skills);
  const equipment = useGame((s) => s.equipment);
  // subscribing keeps canCraft() fresh as materials/levels change
  void inventory;
  void skills;

  return (
    <div style={{ position: "relative" }}>
      <Button
        variant={open ? "primary" : "ghost"}
        size="md"
        onClick={() => setOpen(!open)}
        iconLeft={<Icon name="sigil" size={16} glow={open} />}
      >
        Forge
      </Button>
      <DockPopout open={open}>
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
      </DockPopout>
    </div>
  );
}
