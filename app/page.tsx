import GameCanvas from "@/components/GameCanvas";
import Hud from "@/components/Hud/Hud";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-drift-void">
      <GameCanvas />
      <Hud />
    </main>
  );
}
