"use client";

import Link from "next/link";
import LandingShell, { PageFrame } from "@/components/LandingShell";
import { Button } from "@/components/ds";

const CARD: React.CSSProperties = {
  background: "rgba(124, 58, 237, 0.05)",
  border: "1px solid rgba(124, 58, 237, 0.18)",
  padding: "16px 18px",
};
const H: React.CSSProperties = {
  font: "700 13px/1 var(--font-ui)", color: "var(--drift-gold)", marginBottom: 8,
};
const T: React.CSSProperties = {
  font: "400 12.5px/1.7 var(--font-ui)", color: "var(--text-secondary)",
};

const STEPS: { title: string; text: string }[] = [
  {
    title: "1 · MOVE & GATHER",
    text: "Click ground to walk. Click trees, rocks and fishing pools to gather; Woodcutting, Mining and Fishing level on their own. One swing in ten is a rich strike and pays double. Cook fish with the Cook button in your satchel; eat to heal.",
  },
  {
    title: "2 · FORGE & FIGHT",
    text: "The Forge turns wood, stone, shards and hide into blades, tools and wards; gear auto-equips and renders on your wanderer. Click a Drift Beast to trade blows; walk away to break off. Beasts drop shards and hide, raiders drop coin, the Colossus drops both.",
  },
  {
    title: "3 · THE WAYSTATION",
    text: "Vault your gold before risking the wilds (your tombstone only takes what you carry). Spin the Wheel, buy dyes and drinks from the keepers, wager duels in the Pit, feed the Shrine to burn corruption back, swing at the Mine's gold veins.",
  },
  {
    title: "4 · STAKE YOUR GROUND",
    text: "A 3×3 claim costs 250g and resists the Drift; relocated resource nodes prefer claimed land. Every season grinds its warding down, faster under siege. Furnish it, defend it, re-stake it when it falls.",
  },
  {
    title: "5 · RIDE WITH THE CARAVANS",
    text: "Every few minutes a wagon rolls for a map-edge gate and raiders take it on the road. Kill the wave before the wagon dies; see it through and the pay pool splits by your kills, live or held for your return.",
  },
  {
    title: "6 · SURVIVE THE LONG NIGHT",
    text: "At 90% corruption the horde falls on the Waystation: a shared kill quota on a three-minute clock. Hold and dawn burns the corruption back and pays every defender 250g. Fail and the realm resets; your vault, cosmetics and wallet persist.",
  },
  {
    title: "7 · THE DRIFTS RITES (HOLDERS)",
    text: "Holders burn DRIFTS instead of gold for certain rites: 5k a spin, 25k a claim, 15k an aura, 10k a cleansing, 5k to rewrite the day's quests. Burns are destroyed on-chain and verified by the realm. The server pays all fees; you need zero SOL. Holding more deepens your standing: at 10k held you are a Keeper (4 claims, 8 stalls, lighter vault fees, luckier strikes), at 100k a Warden, at 1M a Drift Lord (6 claims, 12 stalls, no vault fee, the richest strikes, the heaviest caravan share). The whitepaper carries the full table.",
  },
];

export default function HowToPlayPage() {
  return (
    <LandingShell>
      <PageFrame kicker="The Drift" title="How to Play">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map((s) => (
            <div key={s.title} style={CARD}>
              <div style={H}>{s.title}</div>
              <div style={T}>{s.text}</div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
            <Link href="/"><Button variant="gold" size="md">Play Now</Button></Link>
            <Link href="/docs" style={{ font: "500 12px var(--font-ui)", color: "var(--text-secondary)" }}>
              or read the full whitepaper →
            </Link>
          </div>
        </div>
      </PageFrame>
    </LandingShell>
  );
}
