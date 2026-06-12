"use client";

import Link from "next/link";
import LandingShell from "@/components/LandingShell";
import { Button } from "@/components/ds";
import { useGate } from "@/components/gate";

// The front gate of the site: hero art, the wordmark, and PLAY. The door
// itself (wallet check, naming, the game) lives on /play.

export default function Home() {
  const { info } = useGate();

  return (
    <LandingShell hero>
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100vh - 54px)" }}
      >
        <div className="flex flex-col items-center" style={{ gap: 16, maxWidth: 620, padding: 24, textAlign: "center" }}>
          <div className="relative flex items-center justify-center" style={{ width: 640, maxWidth: "92vw", height: 192 }}>
            <div className="landing-plate absolute" style={{ maxWidth: "100%", backgroundPosition: "center" }} />
            <div className="drift-wordmark drift-wordmark-bleed relative" style={{ fontSize: 58, lineHeight: 1, letterSpacing: "0.04em" }}>
              NAEVYR
            </div>
          </div>
          <div style={{ font: "400 15px/1.6 var(--font-ui)", color: "var(--text-secondary)", maxWidth: 480, textShadow: "0 1px 8px #0a0810" }}>
            An isometric MMO at the edge of a creeping corruption. Gather, forge
            and stake your ground before the Drift takes the realm.
          </div>

          <Link href="/play">
            <Button size="lg" variant="gold" style={{ minWidth: 230, fontSize: 18 }}>
              Play Now
            </Button>
          </Link>
          <div style={{ font: "400 11px/1.6 var(--font-ui)", color: "var(--text-muted)", textShadow: "0 1px 6px #0a0810" }}>
            {info ? `${info.online} wanderer${info.online === 1 ? "" : "s"} in the Drift` : " "}
            {info && info.gate > 0 && (
              <div>The door is warded: {info.gate.toLocaleString()} DRIFTS to enter.</div>
            )}
          </div>

          <div style={{ font: "400 10px/1.5 var(--font-ui)", color: "var(--text-muted)", marginTop: 4 }}>
            Beta · DRIFTS is game utility, not an investment
          </div>
        </div>
      </div>
    </LandingShell>
  );
}
