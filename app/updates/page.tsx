"use client";

import LandingShell, { PageFrame } from "@/components/LandingShell";

// The chronicle: every era of the realm, newest first.
// Cleared for launch — entries return as the realm grows.

const UPDATES: { tag: string; title: string; text: string }[] = [
  {
    tag: "The Drift",
    title: "The seasons lengthen, the changer tightens",
    text:
      "The Drift loses its hunger. A season now turns every thirty minutes, a " +
      "slower creep than the realm has known, and the green holds far longer " +
      "between reckonings. At the Vault, the changer grows shrewd: gold sells for " +
      "fewer DRIFTS than before, a guard set on the escrow pool against any who " +
      "would drain it on a single turn. The merchant still buys eager and sells dear.",
  },
  {
    tag: "The Coin",
    title: "DRIFTS is live on Solana",
    text:
      "The coin has left the test sands. DRIFTS now trades on Solana mainnet, " +
      "fair-launched on pump.fun, supply fixed at one billion with the mint sealed " +
      "so no more can ever be made. The door asks 1,000 DRIFTS to enter the realm. " +
      "Contract: ArTtDETxYH7X98XhuUEoLb6fKXGUkjgipG66wXnepump.",
  },
  {
    tag: "The Exchange",
    title: "Gold trades for DRIFTS at the Vault",
    text:
      "The Vault keeper now changes coin both ways. Buy gold with DRIFTS, or sell " +
      "gold back for DRIFTS out of the realm's escrow pool. Payouts come only from " +
      "what buyers paid in, never minted, never a house faucet. The pool is seeded " +
      "and both sides are open. When it runs dry the merchant's purse goes light " +
      "until buyers return. While the realm is young the keeper changes no more " +
      "than 100 gold a day from each wallet, a guard to keep the pool from " +
      "running dry. The limit widens as the coffers deepen.",
  },
  {
    tag: "The Pit",
    title: "Wager DRIFTS on the sand",
    text:
      "The arena takes coin or DRIFTS now. Stake at least 20,000 DRIFTS, meet a " +
      "challenger in the ring, and the victor walks away with nine tenths of the " +
      "pot. The house keeps a tithe. Both stakes are held on-chain until one of " +
      "you falls. A draw returns them whole, and a stake left unanswered comes back to you.",
  },
];

export default function UpdatesPage() {
  return (
    <LandingShell>
      <PageFrame kicker="The Chronicle" title="Updates">
        {UPDATES.length === 0 ? (
          <div
            style={{
              background: "rgba(124, 58, 237, 0.05)",
              border: "1px solid rgba(124, 58, 237, 0.18)",
              padding: "40px 18px",
              textAlign: "center",
              font: "400 13px/1.7 var(--font-ui)",
              color: "var(--text-secondary)",
            }}
          >
            The chronicle begins. Its first entries are yet to be written.
          </div>
        ) : (
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
        )}
      </PageFrame>
    </LandingShell>
  );
}
