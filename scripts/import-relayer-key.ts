// Converts your relayer wallet's exported private key into the file format the
// server needs (a 64-byte array), and tells you which wallet it is so you know
// where to send the SOL.
//
// The secret is read from STDIN — it never appears in a command, your shell
// history, or anywhere online. Run it like this (the `read -s` hides typing):
//
//   read -rs SECRET && printf '%s' "$SECRET" | \
//     ./server/node_modules/.bin/tsx scripts/import-relayer-key.ts
//
// then paste the private key you exported from Phantom and press enter.
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { readFileSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const raw = readFileSync(0, "utf8").trim(); // fd 0 = stdin
if (!raw) { console.error("✗ no key received on stdin"); process.exit(1); }

let secret: Uint8Array;
try {
  secret = raw.startsWith("[") ? Uint8Array.from(JSON.parse(raw)) : bs58.decode(raw);
} catch {
  console.error("✗ couldn't read that key (expected base58 — Phantom's export — or a [..] array)");
  process.exit(1);
}

let kp: Keypair;
try {
  kp = secret.length === 64 ? Keypair.fromSecretKey(secret)
     : secret.length === 32 ? Keypair.fromSeed(secret)
     : (() => { throw new Error("bad length"); })();
} catch {
  console.error(`✗ that key is ${secret.length} bytes — not a Solana private key`);
  process.exit(1);
}

const dir = join(homedir(), "naevyr-keys");
mkdirSync(dir, { recursive: true });
const f = join(dir, "relayer.json");
writeFileSync(f, JSON.stringify(Array.from(kp.secretKey)));
chmodSync(f, 0o600);
console.log(`✓ wrote ${f} (the launch script reads it from here)`);
console.log(`\n  RELAYER WALLET: ${kp.publicKey.toBase58()}`);
console.log(`  → send ~1-2 SOL to THIS address (it's the one you just exported).`);
