"use client";

import { useEffect, useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import Hud from "@/components/Hud/Hud";
import Landing from "@/components/Landing";
import LandingShell from "@/components/LandingShell";

// /play: the door, then the realm. The gate flow (wallet check, naming) runs
// first; once through, the engine mounts and the viewport locks (no page
// scroll or text selection while the game runs).

export default function PlayPage() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!entered) return;
    document.body.classList.add("app-locked");
    return () => document.body.classList.remove("app-locked");
  }, [entered]);

  if (entered) {
    return (
      <main className="relative h-screen w-screen overflow-hidden bg-drift-void">
        <GameCanvas />
        <Hud />
      </main>
    );
  }

  return (
    <LandingShell hero>
      <Landing onEnter={() => setEntered(true)} />
    </LandingShell>
  );
}
