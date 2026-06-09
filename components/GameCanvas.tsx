"use client";

import { useEffect, useRef } from "react";
import { Game } from "@/game/engine/game";
import { initPersistence } from "@/game/state/persistence";

export default function GameCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    initPersistence();
    const game = new Game(canvas);
    game.start();
    return () => game.destroy();
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full cursor-pointer"
    />
  );
}
