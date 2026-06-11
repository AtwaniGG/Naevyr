// Devnet test SPL mint for Driftlands (Phase 5). DEVNET ONLY.
// - default run: ensures an authority keypair (server/.data/devnet-authority.json),
//   airdrops devnet SOL if needed, creates the mint once (6 decimals, recorded in
//   server/.data/devnet-mint.json) and prints the env lines to use.
// - `--mint-to <wallet> <amount>`: mints test tokens to any wallet (creates ATA).
// Run:  cd server && npx tsx scripts/create-devnet-mint.ts [--mint-to <addr> <amt>]

import "../src/env"; // server/.env.local may carry the keyed SOLANA_RPC
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  Connection, Keypair, LAMPORTS_PER_SOL, PublicKey,
} from "@solana/web3.js";
import {
  createMint, getOrCreateAssociatedTokenAccount, mintTo,
} from "@solana/spl-token";

const RPC = process.env.SOLANA_RPC ?? "https://api.devnet.solana.com";
const DECIMALS = 6;
const DATA = resolve(process.cwd(), ".data");
const AUTH_FILE = resolve(DATA, "devnet-authority.json");
const MINT_FILE = resolve(DATA, "devnet-mint.json");

function loadOrCreateAuthority(): Keypair {
  if (existsSync(AUTH_FILE)) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(AUTH_FILE, "utf8"))));
  }
  const kp = Keypair.generate();
  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  writeFileSync(AUTH_FILE, JSON.stringify(Array.from(kp.secretKey)));
  console.log(`authority created: ${kp.publicKey.toBase58()} (saved to .data/devnet-authority.json)`);
  return kp;
}

async function ensureFunded(conn: Connection, kp: Keypair) {
  const bal = await conn.getBalance(kp.publicKey);
  if (bal >= 0.2 * LAMPORTS_PER_SOL) return;
  console.log(`airdropping devnet SOL to ${kp.publicKey.toBase58()}…`);
  for (let i = 0; i < 3; i++) {
    try {
      const sig = await conn.requestAirdrop(kp.publicKey, LAMPORTS_PER_SOL);
      await conn.confirmTransaction(sig, "confirmed");
      console.log("airdrop confirmed");
      return;
    } catch (e) {
      console.log(`airdrop attempt ${i + 1} failed (${(e as Error).message}); retrying…`);
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
  throw new Error(
    `devnet airdrop rate-limited. Fund ${kp.publicKey.toBase58()} manually at https://faucet.solana.com and rerun.`,
  );
}

async function main() {
  const conn = new Connection(RPC, "confirmed");
  const authority = loadOrCreateAuthority();
  await ensureFunded(conn, authority);

  let mint: PublicKey;
  if (existsSync(MINT_FILE)) {
    mint = new PublicKey(JSON.parse(readFileSync(MINT_FILE, "utf8")).mint);
    console.log(`mint exists: ${mint.toBase58()}`);
  } else {
    mint = await createMint(conn, authority, authority.publicKey, null, DECIMALS);
    writeFileSync(MINT_FILE, JSON.stringify({ mint: mint.toBase58(), decimals: DECIMALS }));
    console.log(`mint created: ${mint.toBase58()} (${DECIMALS} decimals)`);
  }

  const args = process.argv.slice(2);
  const mintToIx = args.indexOf("--mint-to");
  if (mintToIx >= 0) {
    const dest = new PublicKey(args[mintToIx + 1]);
    const amount = Number(args[mintToIx + 2] ?? 1);
    const ata = await getOrCreateAssociatedTokenAccount(conn, authority, mint, dest);
    await mintTo(conn, authority, mint, ata.address, authority, BigInt(Math.round(amount * 10 ** DECIMALS)));
    console.log(`minted ${amount} tokens to ${dest.toBase58()}`);
  }

  console.log("\nenv to set:");
  console.log(`  TOKEN_MINT=${mint.toBase58()}                # server`);
  console.log(`  NEXT_PUBLIC_TOKEN_MINT=${mint.toBase58()}    # client`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
