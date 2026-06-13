"use client";

import LandingShell, { PageFrame } from "@/components/LandingShell";

// The chronicle: every era of the realm, newest first.
// Cleared for launch — entries return as the realm grows.

const UPDATES: { tag: string; title: string; text: string }[] = [
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
