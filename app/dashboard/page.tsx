"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LandingShell, { PageFrame } from "@/components/LandingShell";
import { Button, Icon, type IconName } from "@/components/ds";
import { useGate, shortAddr } from "@/components/gate";
import { currentTitle, type SkillState, type LifetimeStats } from "@/game/state/store";
import { INVENTORY_ORDER, ITEM_META, type ItemKey, type SkillKey, SKILL_META } from "@/game/types";

// Your story: the dashboard reads the same save the game plays from (the
// browser-held snapshot), plus the connected wallet's standing at the door.

interface Save {
  gold?: number;
  kills?: number;
  inventory?: Partial<Record<ItemKey, number>>;
  skills?: Partial<Record<SkillKey, SkillState>>;
  stats?: Partial<LifetimeStats>;
  cosmetics?: { name?: string; dye?: string; eye?: string; aura?: string; pet?: string };
  ownedDyes?: string[];
  ownedEyes?: string[];
  ownedAuras?: string[];
  ownedPets?: string[];
}

const ITEM_ICON: Record<ItemKey, IconName> = {
  wood: "log", stone: "ore", fish: "fish",
  cooked_fish: "fish", driftshard: "drift", hide: "bag",
};

const CARD: React.CSSProperties = {
  background: "rgba(124, 58, 237, 0.05)",
  border: "1px solid rgba(124, 58, 237, 0.18)",
  padding: "16px 18px",
};
const KICK: React.CSSProperties = {
  font: "700 10.5px/1 var(--font-ui)", color: "var(--text-muted)",
  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12,
};

export default function DashboardPage() {
  const { wallet, balance, info } = useGate();
  const [save, setSave] = useState<Save | null | "none">(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("driftlands-save-v1");
      setSave(raw ? (JSON.parse(raw) as Save) : "none");
    } catch {
      setSave("none");
    }
  }, []);

  if (save === null) return <LandingShell><PageFrame kicker="Your Story" title="Dashboard"><div /></PageFrame></LandingShell>;

  if (save === "none") {
    return (
      <LandingShell>
        <PageFrame kicker="Your Story" title="Dashboard">
          <div style={CARD}>
            <div style={{ font: "400 13px/1.7 var(--font-ui)", color: "var(--text-secondary)", marginBottom: 14 }}>
              No wanderer walks under this browser yet. Step through the gate
              and the realm will start keeping your story.
            </div>
            <Link href="/"><Button variant="gold" size="md">Play Now</Button></Link>
          </div>
        </PageFrame>
      </LandingShell>
    );
  }

  const skills = save.skills ?? {};
  const totalLevel = (Object.keys(SKILL_META) as SkillKey[])
    .reduce((n, k) => n + (skills[k]?.level ?? 1), 0);
  const title = currentTitle({
    skills: {
      woodcutting: skills.woodcutting ?? { xp: 0, level: 1 },
      mining: skills.mining ?? { xp: 0, level: 1 },
      fishing: skills.fishing ?? { xp: 0, level: 1 },
      combat: skills.combat ?? { xp: 0, level: 1 },
    },
    kills: save.kills ?? 0,
    stats: save.stats as LifetimeStats | undefined,
  });
  const name = save.cosmetics?.name ?? "Wanderer";
  const owned =
    (save.ownedDyes?.length ?? 0) + (save.ownedEyes?.length ?? 0) +
    (save.ownedAuras?.length ?? 0) + (save.ownedPets?.length ?? 0);

  return (
    <LandingShell>
      <PageFrame kicker="Your Story" title="Dashboard" wide>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {/* profile */}
          <div style={CARD}>
            <div style={KICK}>Profile</div>
            <div style={{ font: "700 20px/1 var(--font-ui)", color: "var(--text-primary)", marginBottom: 4 }}>{name}</div>
            <div style={{ font: "italic 400 12px/1 var(--font-ui)", color: "#a855f7", marginBottom: 14 }}>“{title}”</div>
            <div style={{ font: "400 12.5px/2 var(--font-ui)", color: "var(--text-secondary)" }}>
              Total level <span className="drift-num" style={{ color: "var(--drift-gold)" }}>{totalLevel}</span><br />
              Carried gold <span className="drift-num" style={{ color: "var(--drift-gold)" }}>{Math.round(save.gold ?? 0).toLocaleString()}g</span><br />
              Beasts felled <span className="drift-num" style={{ color: "var(--drift-gold)" }}>{save.kills ?? 0}</span><br />
              Cosmetics owned <span className="drift-num" style={{ color: "var(--drift-gold)" }}>{owned}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/"><Button variant="gold" size="md">Play Now</Button></Link>
            </div>
          </div>

          {/* skills */}
          <div style={CARD}>
            <div style={KICK}>Skills</div>
            {(Object.keys(SKILL_META) as SkillKey[]).map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                <span style={{ flex: 1, font: "600 12.5px/1 var(--font-ui)", color: "var(--text-secondary)" }}>
                  {SKILL_META[k].label}
                </span>
                <span className="drift-num" style={{ color: SKILL_META[k].color, fontSize: 13 }}>
                  Lv {skills[k]?.level ?? 1}
                </span>
              </div>
            ))}
            <div style={{ ...KICK, marginTop: 16 }}>The Door</div>
            <div style={{ font: "400 12.5px/1.9 var(--font-ui)", color: "var(--text-secondary)" }}>
              {wallet ? (
                <>Wallet {shortAddr(wallet)} · {balance !== null ? `${balance.toLocaleString()} ◆` : "balance unknown"}</>
              ) : (
                <>No wallet connected.</>
              )}
              {info && info.gate > 0 && <><br />Entry requires {info.gate.toLocaleString()} ◆.</>}
            </div>
          </div>

          {/* satchel */}
          <div style={CARD}>
            <div style={KICK}>Satchel</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {INVENTORY_ORDER.map((k) => {
                const n = save.inventory?.[k] ?? 0;
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, opacity: n > 0 ? 1 : 0.35 }}>
                    <Icon name={ITEM_ICON[k]} size={16} />
                    <span style={{ flex: 1, font: "500 12.5px/1 var(--font-ui)", color: "var(--text-secondary)" }}>
                      {ITEM_META[k].label}
                    </span>
                    <span className="drift-num" style={{ fontSize: 13, color: "var(--text-primary)" }}>
                      x{Math.round(n)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ font: "400 11px/1.6 var(--font-ui)", color: "var(--text-muted)", marginTop: 16 }}>
          This page reads your browser's save. Online, the realm's ledgers rule
          gold and goods; what you see in-game is what the server holds.
        </div>
      </PageFrame>
    </LandingShell>
  );
}
