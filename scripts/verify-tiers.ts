/* eslint-disable @typescript-eslint/no-explicit-any */
// Holder-tier verification: boots its own server (port 2593, throwaway PGlite
// dir, real devnet mint), mints 15,000 DRIFTS to a fresh keypair (Keeper tier),
// links it, and proves the perks actually fire server-side:
//   - unlinked: vault fee 2% (base), stall cap 6
//   - linked Keeper: vault fee 1%, stall cap 8
// Needs server/.data/devnet-mint.json + a funded authority (and ideally a keyed
// SOLANA_RPC in server/.env.local — the public devnet RPC throttles).
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-tiers.ts

import { spawn, execFileSync } from "node:child_process";
import { readFileSync, rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { walletLinkMessage, HOLDER_TIERS, BASE_PERKS } from "../game/types";

const PORT = 2593;
const WS_URL = `ws://localhost:${PORT}`;
const SERVER_DIR = resolve(process.cwd(), "server");
const DATA_DIR = `/tmp/driftlands-verify-tiers-${Date.now()}`;
const MINT_FILE = resolve(SERVER_DIR, ".data/devnet-mint.json");
const KEEPER = HOLDER_TIERS.find((t) => t.key === "keeper")!;
const MINT_AMT = KEEPER.min + 5000; // comfortably Keeper, well short of Warden
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

function once<T>(room: Room<any>, type: string, timeoutMs = 8000): Promise<T | null> {
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve(null), timeoutMs);
    room.onMessage(type, (m: any) => { clearTimeout(to); resolve(m); });
  });
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "goldSync",
  "invSync", "caravanDepart", "ambush", "waveCleared", "caravanLost",
  "caravanArrived", "caravanPayout", "claimPlaced", "claimFallen",
];
function mute(room: Room<any>) {
  for (const t of MUTE) room.onMessage(t, () => {});
}

const sigHex = (sig: Uint8Array) =>
  Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");

async function bankFee(room: Room<any>, amount: number): Promise<number | null> {
  // deposit, then withdraw the same amount; the result carries the fee taken
  let r = once<any>(room, "bankResult");
  room.send("bank", { delta: amount });
  if (!(await r)?.ok) return null;
  await wait(300);
  r = once<any>(room, "bankResult");
  room.send("bank", { delta: -amount });
  const out = await r;
  return out?.ok ? Number(out.fee) : null;
}

async function main() {
  if (!existsSync(MINT_FILE)) {
    console.error("no devnet mint recorded — run server/scripts/create-devnet-mint.ts first");
    process.exit(1);
  }
  const mint = JSON.parse(readFileSync(MINT_FILE, "utf8")).mint as string;

  // the wallet under test: a raw keypair holding a Keeper-tier balance
  const kp = nacl.sign.keyPair();
  const address = bs58.encode(kp.publicKey);
  console.log(`minting ${MINT_AMT} test DRIFTS to ${address}…`);
  execFileSync("./node_modules/.bin/tsx",
    ["scripts/create-devnet-mint.ts", "--mint-to", address, String(MINT_AMT)],
    { cwd: SERVER_DIR, stdio: "pipe", timeout: 120_000 });

  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: SERVER_DIR,
    env: { ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR, CARAVAN_FIRST_S: "9999", TOKEN_MINT: mint },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout.on("data", (d: Buffer) => {
      if (d.toString().includes("listening")) { clearTimeout(to); res(true); }
    });
    server.stderr.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  check("isolated server boots with mint", ready);
  if (!ready) return finish(server, 1);

  try {
    const room = await new Client(WS_URL).joinOrCreate<any>("drift", {
      token: `tiers-${Date.now()}`,
    });
    mute(room);
    await wait(300);

    // seed the purse and a stack of goods (first save seeds the ledgers once)
    room.send("save", { snapshot: { gold: 5000, inventory: { wood: 50 }, day: 0 } });
    await wait(500);

    // ---- baseline (no wallet): base perks rule -----------------------------------
    const baseFee = await bankFee(room, 1000);
    check(`unlinked vault fee is base (${BASE_PERKS.vaultFee * 100}%)`,
      baseFee === Math.ceil(1000 * BASE_PERKS.vaultFee), `fee=${baseFee}`);

    // fill the base stall cap, then confirm the next listing is refused
    for (let i = 0; i < BASE_PERKS.marketSlots; i++) {
      const r = once<any>(room, "listResult");
      room.send("list", { item: "wood", qty: 1, price: 10 });
      const out = await r;
      if (!out?.ok) { check("base-cap listings accepted", false, `refused at ${i + 1}: ${out?.reason}`); break; }
      await wait(150);
    }
    await wait(5200); // the list rate window (6/5s) — drops are silent
    let r = once<any>(room, "listResult");
    room.send("list", { item: "wood", qty: 1, price: 10 });
    let out = await r;
    check(`unlinked stall cap is base (${BASE_PERKS.marketSlots})`,
      out !== null && out.ok === false,
      out === null ? "rate-dropped (no reply)" : out.reason ?? "listing was accepted");

    // ---- link the Keeper wallet ----------------------------------------------------
    const noncePromise = once<{ nonce: string }>(room, "walletNonce");
    room.send("walletNonce");
    const n = await noncePromise;
    check("nonce issued", !!n);
    const msg = new TextEncoder().encode(walletLinkMessage(address, n!.nonce));
    const signature = nacl.sign.detached(msg, kp.secretKey);
    const linkPromise = once<any>(room, "walletResult", 15_000);
    room.send("linkWallet", { address, signature: sigHex(signature) });
    const linked = await linkPromise;
    check("wallet links as a Keeper-tier holder",
      linked?.ok === true && Number(linked.tokenBalance) >= KEEPER.min,
      `balance=${linked?.tokenBalance}`);

    // ---- Keeper perks fire -----------------------------------------------------------
    const keeperFee = await bankFee(room, 1000);
    check(`Keeper vault fee drops to ${KEEPER.vaultFee * 100}%`,
      keeperFee === Math.ceil(1000 * KEEPER.vaultFee), `fee=${keeperFee}`);

    // the stall widens: listings beyond the base cap are accepted up to the tier cap
    await wait(5200); // clear the list rate window again
    let accepted = 0;
    for (let i = BASE_PERKS.marketSlots; i < KEEPER.marketSlots; i++) {
      r = once<any>(room, "listResult");
      room.send("list", { item: "wood", qty: 1, price: 10 });
      out = await r;
      if (out?.ok) accepted++;
      await wait(150);
    }
    check(`Keeper stall widens to ${KEEPER.marketSlots}`,
      accepted === KEEPER.marketSlots - BASE_PERKS.marketSlots, `extra accepted=${accepted}`);

    r = once<any>(room, "listResult");
    room.send("list", { item: "wood", qty: 1, price: 10 });
    out = await r;
    check("the tier cap still holds", out?.ok === false, out?.reason ?? "accepted past cap");

    room.leave();
  } catch (e) {
    console.error("THROW", e);
    failures++;
  }
  finish(server, failures === 0 ? 0 : 1);
}

function finish(server: ReturnType<typeof spawn>, code: number) {
  server.kill();
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nHolder tiers verified end-to-end." : `\n${failures} tier checks FAILED.`);
  process.exit(code);
}

main();
