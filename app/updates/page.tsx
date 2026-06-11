"use client";

import LandingShell, { PageFrame } from "@/components/LandingShell";

// The chronicle: every era of the realm, newest first.

const UPDATES: { tag: string; title: string; text: string }[] = [
  {
    tag: "Phase 6 · current",
    title: "The Hardening — Ledgers, Shared Beasts & the Warded Door",
    text: "Gold and items moved onto server-held ledgers with seed-once migration; snapshots can no longer mint. Every overworld beast became shared and server-ruled — husks, stalkers, the den pack, caravan raiders, the night horde, and the Colossus as a true world boss — with kill quotas counting real deaths and loot landing straight on the ledgers. The DRIFTS entry gate went up (hold the posted amount to pass), and this landing site rose with it. Big-text banners now announce caravans, ambushes, the Colossus, the Long Night, dawn, and the realm's fall.",
  },
  {
    tag: "Phase 5",
    title: "The Chain — Wallets, the Token & Burn Rites",
    text: "Solana wallets bind to wanderers by signed message. DRIFTS went live with holder gates, and burn rites followed: burn-paid Wheel spins, claim stakes, Dyeworks auras, Shrine cleansings and Obelisk rerolls — every burn server-built, fee-paid by the realm, verified on-chain, and spendable exactly once.",
  },
  {
    tag: "Phase 4+",
    title: "The Waystation, the Wilds & the Long Night",
    text: "The town rose: nine keeper-run structures with walkable interiors and counter conversations. Land claims with eroding wardings, the player market with offline escrow, server-authoritative caravan escorts, the Mine's gold veins. The wild quadrants grew the Husk Den, the Ash Obelisk, the Mirewife's Hut and the Drowned Field. And at terminal corruption, the Long Night began deciding the realm's fate — dawn or a full realm reset.",
  },
  {
    tag: "Phase 4",
    title: "Persistence — Guests, Claims & the Market",
    text: "Guest accounts with browser-held keys and Postgres persistence. Progress snapshots, reconnect-safe positions, land claims that the Drift besieges season by season, and a marketplace where offline sellers get paid through escrow.",
  },
  {
    tag: "Phase 3",
    title: "The Shared Drift",
    text: "One realm for all wanderers: authoritative movement and gathering, chat and emotes, the roster, the minimap, names and cosmetics synced across every client. The Drift itself became server-ruled — one corruption, one season clock, one world.",
  },
  {
    tag: "Phases 0-2",
    title: "The First Wandering",
    text: "The core loop took shape: an isometric realm rendered pixel by pixel in code, gathering and skills, crafting and cooking, combat against the Drift's beasts, gold, daily quests, day and night, and a corruption that would not stop spreading.",
  },
];

export default function UpdatesPage() {
  return (
    <LandingShell>
      <PageFrame kicker="The Chronicle" title="Updates">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {UPDATES.map((u) => (
            <div
              key={u.title}
              style={{
                background: "rgba(124, 58, 237, 0.05)",
                border: "1px solid rgba(124, 58, 237, 0.18)",
                padding: "16px 18px",
              }}
            >
              <div style={{ font: "700 10.5px/1 var(--font-ui)", color: "#a855f7", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>
                {u.tag}
              </div>
              <div style={{ font: "700 14px/1.3 var(--font-ui)", color: "var(--text-primary)", marginBottom: 7 }}>
                {u.title}
              </div>
              <div style={{ font: "400 12.5px/1.7 var(--font-ui)", color: "var(--text-secondary)" }}>
                {u.text}
              </div>
            </div>
          ))}
        </div>
      </PageFrame>
    </LandingShell>
  );
}
