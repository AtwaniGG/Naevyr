/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "colyseus.js";
import { WILD_STRUCTURES } from "../game/world/tilemap";
const URL = process.env.GAME_SERVER ?? "ws://localhost:2598";
async function main() {
  const room = await new Client(URL).joinOrCreate<any>("drift", { token: `lair-${Date.now()}` });
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "mobKill", "mobHit", "questSync", "bountySync", "repSync"]) room.onMessage(t, () => {});
  await new Promise((r) => setTimeout(r, 1800));
  const lair = WILD_STRUCTURES.find((b: any) => b.key === "mirelair");
  console.log("mirelair structure:", lair ? `@${lair.x},${lair.y}` : "MISSING");
  let near = 0, boss = 0; const kinds: string[] = [];
  room.state.mobs.forEach((m: any) => {
    if (lair && Math.hypot(m.x - lair.x, m.y - lair.y) <= 12) { near++; kinds.push(`${m.kind}(L${m.level})`); if (m.kind === "drownedking") boss++; }
  });
  console.log(`mobs near the Sunken Lair: ${near} — ${kinds.join(", ")}`);
  const ok = boss >= 1 && near >= 4;
  console.log(ok ? "PASS: lair camp + drowned king spawned" : "FAIL: lair not populated");
  await room.leave();
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
