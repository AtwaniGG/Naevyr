"use client";

import { useEffect, useRef } from "react";
import { Game } from "@/game/engine/game";
import { initPersistence, setGuestMode } from "@/game/state/persistence";

export default function GameCanvas({
  tutorial = false,
  guest = false,
}: {
  tutorial?: boolean;
  guest?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // bind the guest/Realm save + device keys BEFORE persistence loads or the
    // engine reads the device token — GameCanvas is the authoritative set-point
    setGuestMode(guest);
    initPersistence();
    const game = new Game(canvas, { tutorial, guest });
    game.start();
    return () => game.destroy();
  }, [tutorial, guest]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full cursor-pointer"
    />
  );
}
