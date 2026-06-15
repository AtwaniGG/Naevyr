"use client";

import { useEffect, useState } from "react";
import LandingShell, { PageFrame } from "@/components/LandingShell";
import { httpBase } from "@/components/gate";

// The Gilded: realm-wide standings straight from the server's ledgers.

interface BoardRow { name: string; value: number }
interface Boards { gold: BoardRow[]; kills: BoardRow[]; levels: BoardRow[]; streak: BoardRow[] }

const CATS: { key: keyof Boards; label: string; unit: string; blurb: string }[] = [
  { key: "gold", label: "Wealth", unit: "g", blurb: "Total holdings, purse and vault together." },
  { key: "kills", label: "Kills", unit: "", blurb: "Lifetime Drift Beasts felled." },
  { key: "levels", label: "Total Level", unit: "", blurb: "Woodcutting + Mining + Fishing + Combat." },
  { key: "streak", label: "Streak", unit: " days", blurb: "Longest unbroken daily-login streak." },
];

export default function LeaderboardPage() {
  const [boards, setBoards] = useState<Boards | null | "offline">(null);
  const [cat, setCat] = useState<keyof Boards>("gold");

  useEffect(() => {
    fetch(`${httpBase()}/leaderboard`, { signal: AbortSignal.timeout(4000) })
      .then((r) => r.json())
      .then((b: Boards) => setBoards(b))
      .catch(() => setBoards("offline"));
  }, []);

  const active = CATS.find((c) => c.key === cat)!;
  const rows = boards && boards !== "offline" ? boards[cat] : null;

  return (
    <LandingShell>
      <PageFrame kicker="The Gilded" title="Leaderboard" wide>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* ---- categories ---- */}
          <div
            style={{
              width: 200, flexShrink: 0,
              background: "rgba(124, 58, 237, 0.05)",
              border: "1px solid rgba(124, 58, 237, 0.18)",
              padding: "12px 8px",
            }}
          >
            {CATS.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  background: cat === c.key ? "rgba(231, 200, 115, 0.10)" : "transparent",
                  border: 0, cursor: "pointer", padding: "9px 12px",
                  font: "600 13px/1 var(--font-ui)",
                  color: cat === c.key ? "var(--drift-gold)" : "var(--text-secondary)",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* ---- the board ---- */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ font: "400 12px/1.6 var(--font-ui)", color: "var(--text-muted)", marginBottom: 14 }}>
              {active.blurb}
            </div>
            {boards === null && (
              <div style={{ font: "italic 400 13px var(--font-ui)", color: "var(--text-secondary)" }}>
                The scribes are counting…
              </div>
            )}
            {boards === "offline" && (
              <div style={{ font: "italic 400 13px var(--font-ui)", color: "var(--text-secondary)" }}>
                No shared world answers. The standings wait for the realm.
              </div>
            )}
            {rows && rows.length === 0 && (
              <div style={{ font: "italic 400 13px var(--font-ui)", color: "var(--text-secondary)" }}>
                No fortunes yet. The Drift waits.
              </div>
            )}
            {rows && rows.length > 0 && (
              <div>
                <div style={{ display: "flex", padding: "0 14px 8px", font: "700 10.5px/1 var(--font-ui)", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                  <span style={{ width: 56 }}>RANK</span>
                  <span style={{ flex: 1 }}>WANDERER</span>
                  <span>{active.label.toUpperCase()}</span>
                </div>
                {rows.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", padding: "11px 14px",
                      background: i % 2 ? "transparent" : "rgba(124, 58, 237, 0.05)",
                      borderLeft: i < 3 ? "2px solid var(--drift-gold)" : "2px solid transparent",
                    }}
                  >
                    <span className="drift-num" style={{ width: 56, color: i < 3 ? "var(--drift-gold)" : "var(--text-muted)", fontSize: 13 }}>
                      #{i + 1}
                    </span>
                    <span style={{ flex: 1, font: "600 13px/1 var(--font-ui)", color: "var(--text-primary)" }}>
                      {r.name}
                    </span>
                    <span className="drift-num" style={{ color: "var(--drift-gold)", fontSize: 13 }}>
                      {r.value.toLocaleString()}{active.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageFrame>
    </LandingShell>
  );
}
