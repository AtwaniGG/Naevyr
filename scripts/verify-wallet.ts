/* eslint-disable @typescript-eslint/no-explicit-any */
// Wallet-link verification (Phase 5 slice 1): boots its own server (port 2597,
// throwaway PGlite dir) and exercises the sign-message flow with a real
// ed25519 keypair: nonce → sign → link, persistence across reconnect, bad
// signature rejected, wallet-conflict rejected, unlink works.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-wallet.ts

import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { walletLinkMessage } from "../game/types";

const PORT = 2597;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/driftlands-verify-wallet-${Date.now()}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

function once<T>(room: Room<any>, type: string, timeoutMs = 5000): Promise<T | null> {
  return new Promise((resolve) => {
    const to = setTimeout(() => resolve(null), timeoutMs);
    room.onMessage(type, (m: any) => { clearTimeout(to); resolve(m); });
  });
}

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall",
  "caravanDepart", "ambush", "waveCleared", "caravanLost", "caravanArrived", "caravanPayout",
];
function mute(room: Room<any>) {
  for (const t of MUTE) room.onMessage(t, () => {});
}

async function join(token: string): Promise<Room<any>> {
  const room = await new Client(WS_URL).joinOrCreate<any>("drift", { token });
  mute(room);
  await wait(300);
  return room;
}

const sigHex = (sig: Uint8Array) =>
  Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");

async function linkWith(room: Room<any>, keypair: nacl.SignKeyPair, tamper = false) {
  const address = bs58.encode(keypair.publicKey);
  const noncePromise = once<{ nonce: string }>(room, "walletNonce");
  room.send("walletNonce");
  const n = await noncePromise;
  if (!n) return { ok: false, reason: "no nonce" };
  const msg = new TextEncoder().encode(
    walletLinkMessage(address, tamper ? n.nonce + "00" : n.nonce),
  );
  const signature = nacl.sign.detached(msg, keypair.secretKey);
  const resultPromise = once<{ ok: boolean; address?: string | null; reason?: string }>(room, "walletResult");
  room.send("linkWallet", { address, signature: sigHex(signature) });
  return (await resultPromise) ?? { ok: false, reason: "no reply" };
}

async function profileWallet(room: Room<any>): Promise<string | null | undefined> {
  const p = once<{ wallet?: string | null }>(room, "profile");
  room.send("getProfile");
  return (await p)?.wallet;
}

async function main() {
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"),
    env: { ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR, CARAVAN_FIRST_S: "9999" },
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
  check("isolated server boots", ready);
  if (!ready) return finish(server, 1);

  try {
    const tokenA = `wallet-a-${Date.now()}`;
    const keyA = nacl.sign.keyPair();
    const addrA = bs58.encode(keyA.publicKey);

    // happy path
    let a = await join(tokenA);
    const linked = await linkWith(a, keyA);
    check("valid signature links the wallet", linked.ok === true && linked.address === addrA,
      linked.reason ?? linked.address ?? "");

    // persists across reconnect
    a.leave();
    await wait(400);
    a = await join(tokenA);
    const persisted = await profileWallet(a);
    check("wallet survives reconnect", persisted === addrA, String(persisted));

    // tampered message → rejected, wallet unchanged
    const bad = await linkWith(a, keyA, true);
    check("tampered signature rejected", bad.ok === false, bad.reason ?? "");

    // a different wanderer cannot claim the same wallet
    const b = await join(`wallet-b-${Date.now()}`);
    const conflict = await linkWith(b, keyA);
    check("wallet conflict rejected", conflict.ok === false, conflict.reason ?? "");
    b.leave();

    // unlink
    const unlinkPromise = once<{ ok: boolean; address?: string | null }>(a, "walletResult");
    a.send("unlinkWallet");
    const unlinked = await unlinkPromise;
    check("unlink works", unlinked?.ok === true && unlinked.address === null);
    a.leave();
    await wait(400);
    const a2 = await join(tokenA);
    check("unlink persisted", (await profileWallet(a2)) === null);
    a2.leave();
  } catch (e) {
    console.error("THROW", e);
    failures++;
  }
  finish(server, failures === 0 ? 0 : 1);
}

function finish(server: ReturnType<typeof spawn>, code: number) {
  server.kill();
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nWallet link verified end-to-end." : `\n${failures} wallet checks FAILED.`);
  process.exit(code);
}

main();
