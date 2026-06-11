"use client";

import { useEffect, useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import Hud from "@/components/Hud/Hud";
import Landing from "@/components/Landing";
import LandingShell from "@/components/LandingShell";
import { getTutorialDone } from "@/game/state/persistence";
import { useGame } from "@/game/state/store";

// /play: the door, then the realm. The gate flow (wallet check, naming) runs
// first; a fresh wanderer then walks THE THRESHOLD (the client-local tutorial
// world) before the engine joins the shared realm. The viewport locks while
// the engine runs (no page scroll or text selection).

type Mode = "door" | "tutorial" | "game";

export default function PlayPage() {
  const [mode, setMode] = useState<Mode>("door");
  const tutorialDone = useGame((s) => s.tutorialDone);

  // the Threshold completes (or is skipped) → remount the engine into the realm
  useEffect(() => {
    if (mode === "tutorial" && tutorialDone) setMode("game");
  }, [mode, tutorialDone]);

  useEffect(() => {
    if (mode === "door") return;
    document.body.classList.add("app-locked");
    return () => document.body.classList.remove("app-locked");
  }, [mode]);

  if (mode !== "door") {
    return (
      <main className="relative h-screen w-screen overflow-hidden bg-drift-void">
        <GameCanvas key={mode} tutorial={mode === "tutorial"} />
        <Hud />
      </main>
    );
  }

  return (
    <LandingShell hero>
      <Landing onEnter={() => setMode(getTutorialDone() ? "game" : "tutorial")} />
    </LandingShell>
  );
}
