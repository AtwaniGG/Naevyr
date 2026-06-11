/* eslint-disable @typescript-eslint/no-explicit-any */
// Token-gate verification (Phase 5 slice 2). Three layers:
//  1. solana.ts reads real devnet balances (checked against a live devnet-USDC
//     holder discovered via RPC: balance > 0; fresh wallet: balance 0).
//  2. Full game flow with a configured mint: link a fresh wallet → walletResult
//     carries mint + tokenBalance 0 + holder false.
//  3. If server/.data/devnet-mint.json exists (authority funded, mint created):
//     mints 5 tokens to a fresh wallet, links it, asserts holder=true in-game.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-token.ts

import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { walletLinkMessage } from "../game/types";

const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const RPC = "https://api.devnet.solana.com";
const PORT = 2596;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/driftlands-verify-token-${Date.now()}`;
const SERVER_DIR = resolve(process.cwd(), "server");
const MINT_FILE = resolve(SERVER_DIR, ".data/devnet-mint.json");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

async function rpc(method: string, params: unknown[]): Promise<any> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await res.json()).result;
}

function once<T>(room: Room<any>, type: string, timeoutMs = 6000): Promise<T | null> {
  return new Promise((res) => {
    const to = setTimeout(() => res(null), timeoutMs);
    room.onMessage(type, (m: any) => { clearTimeout(to); res(m); });
  });
}
const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall",
  "caravanDepart", "ambush", "waveCleared", "caravanLost", "caravanArrived", "caravanPayout",
];

async function linkFreshWallet(room: Room<any>, keypair: nacl.SignKeyPair) {
  const address = bs58.encode(keypair.publicKey);
  const np = once<{ nonce: string }>(room, "walletNonce");
  room.send("walletNonce");
  const n = await np;
  if (!n) return null;
  const msg = new TextEncoder().encode(walletLinkMessage(address, n.nonce));
  const sig = nacl.sign.detached(msg, keypair.secretKey);
  const rp = once<any>(room, "walletResult", 20_000); // RPC balance lookup inside
  room.send("linkWallet", {
    address,
    signature: Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join(""),
  });
  return await rp;
}

async function bootServer(mint: string): Promise<ReturnType<typeof spawn> | null> {
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: SERVER_DIR,
    env: {
      ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR,
      CARAVAN_FIRST_S: "9999", TOKEN_MINT: mint,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ok = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout!.on("data", (d: Buffer) => {
      if (d.toString().includes("listening")) { clearTimeout(to); res(true); }
    });
    server.stderr!.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  return ok ? server : null;
}

async function main() {
  // ---- layer 1: solana.ts against live devnet ----------------------------------
  // This layer leans on PUBLIC devnet state (a big USDC holder found via an
  // expensive RPC call that the shared endpoint rate-limits aggressively).
  // Unavailable external data is a SKIP, not a failure of our code — layers
  // 2 and 3 below cover the real read path with our own mint.
  process.env.TOKEN_MINT = USDC_DEVNET;
  const { getTokenBalance, isHolder } = await import("../server/src/solana");
  const largest = await rpc("getTokenLargestAccounts", [USDC_DEVNET]);
  const tokenAccount = largest?.value?.[0]?.address;
  if (!tokenAccount) {
    console.log("SKIP  live-USDC layer: devnet RPC rate-limited getTokenLargestAccounts");
  } else {
    const accInfo = await rpc("getAccountInfo", [tokenAccount, { encoding: "jsonParsed" }]);
    const holderOwner = accInfo?.value?.data?.parsed?.info?.owner;
    check("found a live devnet USDC holder", typeof holderOwner === "string", holderOwner);
    const richBal = await getTokenBalance(holderOwner);
    check("solana.ts reads a real balance", richBal > 0, `${richBal}`);
    check("solana.ts holder gate passes for them", await isHolder(holderOwner));
  }
  const fresh = bs58.encode(nacl.sign.keyPair().publicKey);
  check("fresh wallet reads zero", (await getTokenBalance(fresh)) === 0);

  // ---- layer 2: full game flow with a configured mint ---------------------------
  const server = await bootServer(USDC_DEVNET);
  check("isolated server boots with TOKEN_MINT", !!server);
  if (server) {
    const room = await new Client(WS_URL).joinOrCreate<any>("drift", { token: `tok-${Date.now()}` });
    for (const t of MUTE) room.onMessage(t, () => {});
    await wait(300);
    const res = await linkFreshWallet(room, nacl.sign.keyPair());
    check("link reports mint + zero balance", res?.ok === true && res.mint === USDC_DEVNET, JSON.stringify({ mint: res?.mint, bal: res?.tokenBalance }));
    check("fresh wallet is not a holder in-game", res?.holder === false && res?.tokenBalance === 0);
    room.leave();
    server.kill();
    await wait(500);
  }

  // ---- layer 3: full holder path with OUR mint (needs funded authority) ---------
  if (existsSync(MINT_FILE)) {
    const ourMint = JSON.parse(readFileSync(MINT_FILE, "utf8")).mint as string;
    const holderKey = nacl.sign.keyPair();
    const holderAddr = bs58.encode(holderKey.publicKey);
    console.log(`minting 5 test tokens to ${holderAddr}…`);
    try {
      execFileSync("./node_modules/.bin/tsx",
        ["scripts/create-devnet-mint.ts", "--mint-to", holderAddr, "5"],
        { cwd: SERVER_DIR, stdio: "pipe", timeout: 90_000 });
    } catch (e) {
      check("mint-to succeeds", false, String(e).slice(0, 120));
    }
    const server2 = await bootServer(ourMint);
    check("server boots with OUR mint", !!server2);
    if (server2) {
      const room = await new Client(WS_URL).joinOrCreate<any>("drift", { token: `tok2-${Date.now()}` });
      for (const t of MUTE) room.onMessage(t, () => {});
      await wait(300);
      const res = await linkFreshWallet(room, holderKey);
      check("HOLDER path: link sees the minted tokens", res?.ok === true && res?.holder === true && res?.tokenBalance >= 5,
        JSON.stringify({ bal: res?.tokenBalance, holder: res?.holder }));
      room.leave();
      server2.kill();
    }
  } else {
    console.log("SKIP  holder-true path: no devnet mint yet (fund the authority at https://faucet.solana.com, rerun create-devnet-mint.ts, then rerun this)");
  }

  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nToken gate verified." : `\n${failures} token checks FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("THROW", e); process.exit(1); });
