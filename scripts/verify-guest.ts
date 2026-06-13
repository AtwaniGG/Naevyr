/* eslint-disable @typescript-eslint/no-explicit-any */
// Demo lane verification: the GUEST WORLD. SELF-HOSTED (port 2590) with
// GATE_TOKENS=2 so the door is LOCKED. Proves:
//   - a guest join (guest:true) BYPASSES the gate; the same bare join (no flag,
//     no wallet) is REJECTED — so the flag, not a hole, is the bypass.
//   - the guest is flagged in shared state (PlayerState.guest).
//   - play works for guests: move drives the sim, chat draws no refusal, and
//     client-trusted income (goldDelta) lands on the ledger (goldSync).
//   - every economy / ownership / on-chain handler is REFUSED with `denied`
//     (claim, spin, linkWallet) and leaves the world untouched (no claim).
// No mint or chain needed (guests never read balances).
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-guest.ts

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { rmSync } from "node:fs";
import { Client } from "colyseus.js";

const PORT = 2590;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/naevyr-verify-guest-${Date.now()}`;
const SERVER_DIR = resolve(process.cwd(), "server");
const GATE = 2;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const token = () => `guest-${Date.now()}-${Math.random()}`;

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

async function tryJoin(options: Record<string, unknown>): Promise<"joined" | "rejected"> {
  try {
    const room = await new Client(WS_URL).joinOrCreate<any>("drift", options);
    await wait(300);
    await room.leave();
    return "joined";
  } catch {
    return "rejected";
  }
}

async function main() {
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: SERVER_DIR,
    env: {
      ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR,
      CARAVAN_FIRST_S: "9999", GATE_TOKENS: String(GATE),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout!.on("data", (d: Buffer) => {
      if (d.toString().includes("listening")) { clearTimeout(to); res(true); }
    });
    server.stderr!.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  check("gated server boots", ready);
  if (!ready) { server.kill(); process.exit(1); }

  try {
    // ---- the gate bypass -----------------------------------------------------
    check("guest join bypasses a locked gate",
      (await tryJoin({ token: token(), guest: true })) === "joined");
    check("the SAME join without the guest flag is rejected",
      (await tryJoin({ token: token() })) === "rejected");

    // ---- a guest session: play works, economy is refused ---------------------
    const room = await new Client(WS_URL).joinOrCreate<any>("drift", {
      token: token(), guest: true,
    });
    const denied: string[] = [];
    let goldSynced = false;
    room.onMessage("denied", (m: any) => denied.push(String(m?.feature ?? "")));
    room.onMessage("goldSync", () => { goldSynced = true; });
    // let the full initial state land
    await wait(800);

    const self = () => room.state.players.get(room.sessionId);
    check("the guest appears in shared state", !!self());
    check("the guest is flagged as a guest in state", self()?.guest === true);

    const claimsBefore = room.state.claims?.size ?? 0;

    // play: a move intent should drive the server walk sim
    const start = self();
    const sx = Math.round(start?.x ?? 0);
    const sy = Math.round(start?.y ?? 0);
    let moved = false;
    for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [3, 0]]) {
      room.send("move", { x: sx + dx, y: sy + dy });
      for (let i = 0; i < 20; i++) {
        await wait(100);
        const p = self();
        if (p && (Math.round(p.x) !== sx || Math.round(p.y) !== sy || p.action === "walk")) {
          moved = true; break;
        }
      }
      if (moved) break;
    }
    check("guest move drives the sim", moved);

    // play: chat is allowed (no refusal)
    room.send("chat", { text: "hello from the drift", kind: "say" });
    await wait(300);

    // play: client-trusted income lands on the ledger
    room.send("goldDelta", { amount: 50, reason: "quest" });
    await wait(500);
    check("guest income reaches the ledger (goldSync)", goldSynced);

    // ---- restricted handlers are refused -------------------------------------
    room.send("claim", { x: sx, y: sy });
    room.send("spin", {});
    room.send("linkWallet", {});
    await wait(700);

    check("claim is refused for a guest", denied.includes("claim"), `denied=${denied.join(",")}`);
    check("spin is refused for a guest", denied.includes("spin"));
    check("linkWallet is refused for a guest", denied.includes("linkWallet"));
    check("no land was claimed by the guest",
      (room.state.claims?.size ?? 0) === claimsBefore,
      `claims ${claimsBefore} → ${room.state.claims?.size ?? 0}`);
    check("chat drew no refusal", !denied.includes("chat"));

    await room.leave();
  } catch (e) {
    console.error("THROW", e);
    failures++;
  }

  server.kill();
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nGuest lane verified." : `\n${failures} guest checks FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("THROW", e); process.exit(1); });
