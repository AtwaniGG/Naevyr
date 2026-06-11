/* eslint-disable @typescript-eslint/no-explicit-any */
// Phase 6 verification: the token ENTRY GATE (Kintara-style door). SELF-HOSTED
// (port 2591) with our devnet mint and GATE_TOKENS=2:
//   /gate endpoint reports the lock + issues nonces; wallet-less, broke-wallet
//   and UNPROVEN (no/bad signature) joins are REJECTED at onAuth; a wallet
//   minted 2 real devnet tokens that signs its gate nonce passes and joins.
// Needs server/.data/devnet-mint.json (funded authority).
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-gate.ts

import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "colyseus.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { gateMessage } from "../game/types";

const PORT = 2591;
const WS_URL = `ws://localhost:${PORT}`;
const HTTP_URL = `http://localhost:${PORT}`;
const DATA_DIR = `/tmp/driftlands-verify-gate-${Date.now()}`;
const SERVER_DIR = resolve(process.cwd(), "server");
const MINT_FILE = resolve(SERVER_DIR, ".data/devnet-mint.json");
const GATE = 2;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  if (!existsSync(MINT_FILE)) {
    console.error("No devnet mint (server/.data/devnet-mint.json). Run create-devnet-mint.ts first.");
    process.exit(1);
  }
  const mint = JSON.parse(readFileSync(MINT_FILE, "utf8")).mint as string;

  // a fresh wallet, funded with exactly the gate amount of REAL devnet tokens
  const holderKey = nacl.sign.keyPair();
  const holderAddr = bs58.encode(holderKey.publicKey);
  console.log(`minting ${GATE} test tokens to ${holderAddr}…`);
  try {
    execFileSync("./node_modules/.bin/tsx",
      ["scripts/create-devnet-mint.ts", "--mint-to", holderAddr, String(GATE)],
      { cwd: SERVER_DIR, stdio: "pipe", timeout: 90_000 });
  } catch (e) {
    check("mint-to succeeds", false, String(e).slice(0, 120));
    process.exit(1);
  }

  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: SERVER_DIR,
    env: {
      ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR,
      CARAVAN_FIRST_S: "9999", TOKEN_MINT: mint, GATE_TOKENS: String(GATE),
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
    // ---- the /gate endpoint -----------------------------------------------------
    const closed = await (await fetch(`${HTTP_URL}/gate`)).json();
    check("/gate reports the lock", closed.gate === GATE && closed.ok === false && closed.mint === mint,
      JSON.stringify(closed));

    const brokeKey = nacl.sign.keyPair();
    const broke = bs58.encode(brokeKey.publicKey);
    const denied = await (await fetch(`${HTTP_URL}/gate?address=${broke}`)).json();
    check("/gate denies a broke wallet", denied.ok === false && denied.balance === 0,
      `balance=${denied.balance}`);

    const allowed = await (await fetch(`${HTTP_URL}/gate?address=${holderAddr}`)).json();
    check("/gate clears the funded wallet", allowed.ok === true && allowed.balance >= GATE,
      `balance=${allowed.balance}`);
    check("/gate issues a signing nonce", typeof allowed.nonce === "string" && allowed.nonce.length > 8);

    // ---- the ownership proof --------------------------------------------------------
    const sign = (key: nacl.SignKeyPair, addr: string, nonce: string) =>
      Buffer.from(
        nacl.sign.detached(new TextEncoder().encode(gateMessage(addr, nonce)), key.secretKey),
      ).toString("hex");
    const holderSig = sign(holderKey, holderAddr, allowed.nonce);

    const re = await (await fetch(
      `${HTTP_URL}/gate?address=${holderAddr}&nonce=${encodeURIComponent(allowed.nonce)}&sig=${holderSig}`,
    )).json();
    check("/gate verifies a stored proof (proofOk)", re.proofOk === true);
    const tampered = await (await fetch(
      `${HTTP_URL}/gate?address=${holderAddr}&nonce=${encodeURIComponent(allowed.nonce)}&sig=${"0".repeat(128)}`,
    )).json();
    check("/gate refuses a forged proof", tampered.proofOk === false);

    // ---- onAuth enforcement -------------------------------------------------------
    const token = () => `gate-${Date.now()}-${Math.random()}`;
    check("join without a wallet rejected",
      (await tryJoin({ token: token() })) === "rejected");
    check("join with a bare address (no proof) rejected",
      (await tryJoin({ token: token(), address: holderAddr })) === "rejected");
    check("join with a forged signature rejected",
      (await tryJoin({
        token: token(), address: holderAddr,
        gateNonce: allowed.nonce, gateSig: "0".repeat(128),
      })) === "rejected");
    // a signature from the WRONG key over the right message
    const intruder = nacl.sign.keyPair();
    check("join with another wallet's signature rejected",
      (await tryJoin({
        token: token(), address: holderAddr,
        gateNonce: allowed.nonce, gateSig: sign(intruder, holderAddr, allowed.nonce),
      })) === "rejected");
    // a PROVEN but broke wallet still fails the balance check
    const brokeInfo = await (await fetch(`${HTTP_URL}/gate?address=${broke}`)).json();
    check("join with a broke wallet (proven) rejected",
      (await tryJoin({
        token: token(), address: broke,
        gateNonce: brokeInfo.nonce, gateSig: sign(brokeKey, broke, brokeInfo.nonce),
      })) === "rejected");
    check("join with the funded, proven wallet accepted",
      (await tryJoin({
        token: token(), address: holderAddr,
        gateNonce: allowed.nonce, gateSig: holderSig,
      })) === "joined");
  } catch (e) {
    console.error("THROW", e);
    failures++;
  }

  server.kill();
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nEntry gate verified." : `\n${failures} gate checks FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("THROW", e); process.exit(1); });
