/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 3 verification: two headless clients join the shared world, see each
// other, watch each other move, share node state, and observe leave events.
// Run with the server up:  npx tsx scripts/verify-multiplayer.ts

import { Client, Room } from "colyseus.js";
import { MAP_W, MAP_H } from "@/game/world/tilemap";

const URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function muteMessages(room: Room<any>) {
  for (const t of ["loot", "gatherStart", "relocate", "season", "chat", "driftfall", "goldSync", "invSync"]) {
    room.onMessage(t, () => {});
  }
}

async function main() {
  const a = await new Client(URL).joinOrCreate<any>("drift", { token: `verify-a-${Date.now()}` });
  const b = await new Client(URL).joinOrCreate<any>("drift", { token: `verify-b-${Date.now()}` });
  a.onMessage("profile", () => {});
  b.onMessage("profile", () => {});
  muteMessages(b);
  await wait(600); // let initial patches land

  check("both clients in the same room", a.roomId === b.roomId);
  // Ambient Echoes (server-spawned fake wanderers) may share the realm. They
  // carry echo=true; the headcount that matters is the REAL (non-echo) players.
  const realPlayers = (room: Room<any>) => {
    let n = 0;
    (room.state.players as Map<string, any>).forEach((p) => { if (!p.echo) n++; });
    return n;
  };
  check("A sees 2 real players", realPlayers(a) === 2, `real=${realPlayers(a)}`);
  check("B sees 2 real players", realPlayers(b) === 2, `real=${realPlayers(b)}`);
  // the two real clients are NOT flagged as Echoes; any Echo present is flagged
  check(
    "real clients carry echo=false",
    !a.state.players.get(a.sessionId)?.echo && !a.state.players.get(b.sessionId)?.echo,
  );
  {
    let echoesWellFormed = true;
    (a.state.players as Map<string, any>).forEach((p) => {
      if (p.echo && (!String(p.id).startsWith("echo:") || !p.name)) echoesWellFormed = false;
    });
    check("any Echoes present are well-formed (echo:id + name)", echoesWellFormed);
  }
  check(
    `map synced (${MAP_W}×${MAP_H})`,
    a.state.w === MAP_W && a.state.h === MAP_H && a.state.tiles.length === MAP_W * MAP_H,
  );
  check("nodes synced", a.state.nodes.size > 0, `nodes=${a.state.nodes.size}`);

  // ---- movement: B moves, A should see it -------------------------------------
  const bStart = snapshot(b.state.players.get(b.sessionId));
  const targets = [
    { x: bStart.x + 4, y: bStart.y },
    { x: bStart.x, y: bStart.y + 4 },
    { x: bStart.x - 4, y: bStart.y },
    { x: bStart.x, y: bStart.y - 4 },
  ];
  for (const t of targets) b.send("move", t); // last valid intent wins
  await wait(2000);
  const bSeenByA = snapshot(a.state.players.get(b.sessionId));
  const moved = Math.hypot(bSeenByA.x - bStart.x, bSeenByA.y - bStart.y);
  check("A sees B move", moved > 1, `displacement=${moved.toFixed(2)} tiles`);

  // ---- gathering: A gathers, gets loot, B sees the node tick down --------------
  const aPos = snapshot(a.state.players.get(a.sessionId));
  let target: any = null;
  let bestD = Infinity;
  a.state.nodes.forEach((n: any) => {
    if (!n.alive) return;
    const d = Math.hypot(n.gx - aPos.x, n.gy - aPos.y);
    if (d < bestD) {
      bestD = d;
      target = n;
    }
  });
  check("found a live node to gather", !!target, target ? `${target.kind} @ ${target.gx},${target.gy} (${bestD.toFixed(1)} tiles)` : "");

  if (target) {
    const beforeAmount = target.amount;
    let lootKind = "";
    let gatherStarted = false;
    const loot = new Promise<void>((resolve) => {
      a.onMessage("loot", (m: any) => {
        lootKind = m.kind;
        resolve();
      });
    });
    a.onMessage("gatherStart", () => {
      gatherStarted = true;
    });
    a.onMessage("relocate", () => {});
    a.onMessage("season", () => {});

    a.send("gather", { nodeId: target.id, speedMult: 1 });
    const lootOk = await Promise.race([
      loot.then(() => true),
      wait(20_000).then(() => false),
    ]);
    check("A walked to node and got loot", lootOk, lootOk ? `kind=${lootKind}` : "timed out");
    check("server announced gatherStart", gatherStarted);
    await wait(300);
    const bNode = b.state.nodes.get(String(target.id));
    check(
      "B sees the node's charges drop",
      bNode.amount < beforeAmount,
      `${beforeAmount} → ${bNode.amount}`,
    );
  }

  // ---- identity: B renames + dyes, A sees it ------------------------------------
  b.send("identity", { name: "Testovia", dye: "ember", eye: "blood", title: "Stonebreaker" });
  await wait(400);
  const bIdent = a.state.players.get(b.sessionId);
  check(
    "A sees B's cosmetics",
    bIdent.name === "Testovia" && bIdent.dye === "ember" && bIdent.eye === "blood" && bIdent.title === "Stonebreaker",
    `name=${bIdent.name} dye=${bIdent.dye} eye=${bIdent.eye} title=${bIdent.title}`,
  );
  b.send("identity", { name: "x".repeat(99), dye: "neon-pink", eye: "laser" });
  await wait(400);
  check(
    "server sanitizes bad identity",
    a.state.players.get(b.sessionId).name.length <= 16 &&
      a.state.players.get(b.sessionId).dye === "ember",
    `name len=${a.state.players.get(b.sessionId).name.length} dye=${a.state.players.get(b.sessionId).dye}`,
  );

  // ---- premium avatars: unowned kinds are rejected, "" reverts cleanly ----------
  b.send("identity", { avatar: "ashbound", avA: "gold", avB: "blood" });
  await wait(400);
  check(
    "unowned avatar is rejected (prestige-gated)",
    a.state.players.get(b.sessionId).avatar === "",
    `avatar=${a.state.players.get(b.sessionId).avatar}`,
  );
  b.send("identity", { avatar: "" }); // a non-owner clearing stays clear
  await wait(300);
  check(
    "avatar clear is accepted",
    a.state.players.get(b.sessionId).avatar === "" &&
      a.state.players.get(b.sessionId).avA === "",
    `avatar=${a.state.players.get(b.sessionId).avatar}`,
  );

  // ---- chat: B speaks, A hears it with B's name attached -------------------------
  b.send("identity", { name: "Testovia" }); // restore after the sanitize test
  await wait(300);
  const heard = new Promise<{ name: string; text: string; kind: string }>((resolve) => {
    a.onMessage("chat", (m: any) => resolve(m));
  });
  a.onMessage("driftfall", () => {});
  b.send("chat", { text: "the Drift provides", kind: "say" });
  const chatMsg = await Promise.race([
    heard,
    wait(3000).then(() => null),
  ]);
  check(
    "A hears B's chat",
    chatMsg !== null && chatMsg.text === "the Drift provides" && chatMsg.name === "Testovia",
    chatMsg ? `${chatMsg.name}: ${chatMsg.text}` : "timed out",
  );

  // ---- leave: B departs, A's roster shrinks ------------------------------------
  await b.leave();
  await wait(600);
  check(
    "A sees B leave",
    realPlayers(a) === 1,
    `real=${realPlayers(a)}`,
  );

  await a.leave();
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

function snapshot(p: any) {
  return { x: p?.x ?? -1, y: p?.y ?? -1 };
}

main().catch((e) => {
  console.error("verify-multiplayer crashed:", e);
  process.exit(1);
});
