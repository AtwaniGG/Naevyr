/* eslint-disable @typescript-eslint/no-explicit-any */
// Burn verification (Phase 5 final slice). Boots an isolated server with OUR
// devnet mint, then runs REAL on-chain burns through the full game protocol:
//   mint test tokens → link wallet → burnQuote → countersign + submit to
//   devnet → spin with burnSig → win roll; replay rejected; cleanse burn
//   feeds the shrine pot; bogus signature rejected.
// Needs server/.data/devnet-mint.json (create-devnet-mint.ts) + funded authority.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-burns.ts

import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import { Connection, Keypair, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { walletLinkMessage } from "../game/types";

const RPC = "https://api.devnet.solana.com";
const PORT = 2595;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/driftlands-verify-burns-${Date.now()}`;
const SERVER_DIR = resolve(process.cwd(), "server");
const MINT_FILE = resolve(SERVER_DIR, ".data/devnet-mint.json");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

function once<T>(room: Room<any>, type: string, timeoutMs = 45_000): Promise<T | null> {
  return new Promise((res) => {
    const to = setTimeout(() => res(null), timeoutMs);
    room.onMessage(type, (m: any) => { clearTimeout(to); res(m); });
  });
}
const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "caravanDepart", "ambush", "waveCleared", "caravanLost", "caravanArrived", "caravanPayout",
  "spinResult", "burnResult", "burnQuote", "walletNonce", "walletResult", "cleansing",
];

async function main() {
  if (!existsSync(MINT_FILE)) {
    console.error("No devnet mint. Run create-devnet-mint.ts first.");
    process.exit(1);
  }
  const mint = JSON.parse(readFileSync(MINT_FILE, "utf8")).mint as string;

  // wallet under test: a raw keypair (zero SOL — the authority pays fees)
  const kp = Keypair.generate();
  const address = kp.publicKey.toBase58();
  console.log(`minting 12 test tokens to ${address}…`);
  execFileSync("./node_modules/.bin/tsx",
    ["scripts/create-devnet-mint.ts", "--mint-to", address, "12"],
    { cwd: SERVER_DIR, stdio: "pipe", timeout: 120_000 });

  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: SERVER_DIR,
    env: { ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR, CARAVAN_FIRST_S: "9999", TOKEN_MINT: mint },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout.on("data", (d: Buffer) => { if (d.toString().includes("listening")) { clearTimeout(to); res(true); } });
    server.stderr.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  check("isolated server boots with mint", ready);
  if (!ready) return finish(server, 1);

  try {
    const room = await new Client(WS_URL).joinOrCreate<any>("drift", { token: `burns-${Date.now()}` });
    const handlers = new Map<string, ((m: any) => void)[]>();
    for (const t of MUTE) room.onMessage(t, (m: any) => (handlers.get(t) ?? []).forEach((h) => h(m)));
    const on = <T,>(type: string, timeoutMs = 45_000): Promise<T | null> =>
      new Promise((res) => {
        const to = setTimeout(() => res(null), timeoutMs);
        handlers.set(type, [(m) => { clearTimeout(to); handlers.delete(type); res(m); }]);
      });
    await wait(300);

    // link the wallet (sign-message flow with the same keypair)
    const np = on<{ nonce: string }>("walletNonce", 6000);
    room.send("walletNonce");
    const n = await np;
    const msg = new TextEncoder().encode(walletLinkMessage(address, n!.nonce));
    const sig = nacl.sign.detached(msg, kp.secretKey);
    const lr = on<any>("walletResult", 30_000);
    room.send("linkWallet", { address, signature: Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("") });
    const linked = await lr;
    check("wallet linked as holder", linked?.ok === true && linked?.holder === true, `bal=${linked?.tokenBalance}`);

    const conn = new Connection(RPC, "confirmed");
    // quote → countersign → submit → returns the tx signature
    async function executeBurn(action: string): Promise<string | null> {
      const qp = on<any>("burnQuote", 30_000);
      room.send("burnQuote", { action });
      const q = await qp;
      if (!q?.ok || !q.tx) { console.log(`      …no quote: ${q?.reason}`); return null; }
      const tx = Transaction.from(Buffer.from(q.tx, "base64"));
      tx.partialSign(kp);
      return await conn.sendRawTransaction(tx.serialize());
    }

    // 1) burn-paid Wheel spin
    const spinSig = await executeBurn("spin");
    check("burn tx submitted to devnet", !!spinSig, spinSig?.slice(0, 16));
    const sr = on<any>("spinResult", 60_000);
    const br = on<any>("burnResult", 60_000);
    room.send("spin", { burnSig: spinSig });
    const spinOut = await Promise.race([sr, br]);
    check("burn-paid spin resolves", !!spinOut && typeof spinOut.label === "string",
      spinOut?.label ?? spinOut?.reason);

    // 2) replay: the same signature must be refused
    await wait(2600); // spin rate limit
    const br2 = on<any>("burnResult", 30_000);
    room.send("spin", { burnSig: spinSig });
    const replay = await br2;
    check("replayed burn rejected", replay?.ok === false, replay?.reason);

    // 3) cleanse burn feeds the shrine pot
    const potBefore = room.state.shrinePot as number;
    const cleanseSig = await executeBurn("cleanse");
    const br3 = on<any>("burnResult", 60_000);
    room.send("donate", { burnSig: cleanseSig });
    const cleanse = await br3;
    await wait(400);
    check("cleanse burn accepted", cleanse?.ok === true, `+${cleanse?.pot}g`);
    check("shrine pot rose by the burn value", room.state.shrinePot >= potBefore + 150,
      `${potBefore} → ${room.state.shrinePot}`);

    // 4) garbage signature rejected fast
    await wait(2600);
    const br4 = on<any>("burnResult", 30_000);
    room.send("spin", { burnSig: bs58.encode(nacl.sign.keyPair().secretKey).slice(0, 64) });
    const junk = await br4;
    check("bogus signature rejected", junk?.ok === false, junk?.reason);

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
  console.log(failures === 0 ? "\nOn-chain burns verified end-to-end." : `\n${failures} burn checks FAILED.`);
  process.exit(code);
}

main();
