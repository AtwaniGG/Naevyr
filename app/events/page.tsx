"use client";

import LandingShell, { PageFrame } from "@/components/LandingShell";

// The reckonings: everything the realm throws at its wanderers, and when.

const EVENTS: { name: string; cadence: string; text: string }[] = [
  {
    name: "Caravans",
    cadence: "every ~6 minutes",
    text: "A wagon rolls from the Waystation toward a map-edge gate. Raider waves take it on the road and gnaw the wagon down while they swarm. Clear every wave and see it through the gate: the pay pool (richer in deeper corruption) splits pro-rata by kills among the escorts, paid live or held for your return.",
  },
  {
    name: "Driftfall",
    cadence: "when the Drift wills it",
    text: "A falling star of corruption. Where it lands, new resource nodes are born from the wound. Watch the sky and the activity log; the fresh nodes go to whoever walks there first.",
  },
  {
    name: "The Colossus",
    cadence: "at 10 / 25 / 40 / 60 / 80% corruption",
    text: "A 140-hp walking ruin rises at the corruption front, shared by the whole realm. It does not hurry and it does not stop hurting. Felling it pays 50g and five drift shards, and the realm a moment's quiet.",
  },
  {
    name: "Ash-storms",
    cadence: "passing squalls",
    text: "The ash rolls over the realm and dims everything under it. Cosmetic, ominous, and excellent cover for bad decisions.",
  },
  {
    name: "The Long Night",
    cadence: "at 90% corruption",
    text: "The realm's last stand. The horde falls on the Waystation from three sides under a shared kill quota and a three-minute clock. Hold the line: dawn burns the corruption back to 35% and pays every defender 250g. Fail: the realm resets — fresh world, fresh Drift, all claims and furnishings gone. Vaults, cosmetics and wallets persist.",
  },
  {
    name: "The Shrine Cleansing",
    cadence: "whenever the pot fills",
    text: "Communal, not scheduled: every coin donated to the Pale Flame counts toward the pot. When it fills, the corruption nearest town burns clean. Holders can feed the pot with a 10k DRIFTS burn worth 150g.",
  },
];

export default function EventsPage() {
  return (
    <LandingShell>
      <PageFrame kicker="The Reckonings" title="Events">
        <div style={{ font: "400 12.5px/1.7 var(--font-ui)", color: "var(--text-muted)", marginBottom: 16 }}>
          Nothing here is on a calendar. The realm runs its own clocks; these
          are the things it does with them.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {EVENTS.map((e) => (
            <div
              key={e.name}
              style={{
                background: "rgba(124, 58, 237, 0.05)",
                border: "1px solid rgba(124, 58, 237, 0.18)",
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 7 }}>
                <span style={{ font: "700 14px/1 var(--font-ui)", color: "var(--text-primary)" }}>{e.name}</span>
                <span style={{ font: "600 11px/1 var(--font-ui)", color: "var(--drift-gold)" }}>{e.cadence}</span>
              </div>
              <div style={{ font: "400 12.5px/1.7 var(--font-ui)", color: "var(--text-secondary)" }}>
                {e.text}
              </div>
            </div>
          ))}
        </div>
      </PageFrame>
    </LandingShell>
  );
}
