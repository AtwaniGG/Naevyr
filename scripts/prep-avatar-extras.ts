// Trailer prep: grant three "extra" wanderers their premium avatars via REAL
// prestige burns on the LIVE local server (avatars are server-authoritative,
// so the capture bots must actually own them). Stable device tokens make this
// idempotent: a re-run skips any extra whose avatar already sticks.
// Needs: npm run server (2567) running + the local devnet mint.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/prep-avatar-extras.ts
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import { Connection, Keypair, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import { walletLinkMessage } from "../game/types";

const RPC = "https://api.devnet.solana.com";
const WS_URL = process.env.GAME_SERVER ?? "ws://localhost:2567";
const SERVER_DIR = resolve(process.cwd(), "server");
const MINT_FILE = resolve(SERVER_DIR, ".data/devnet-mint.json");
const OUT = "/tmp/naevyr-extras.json";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EXTRAS = [
  { kind: "ashbound",   name: "Sorrel", avA: "ember", avB: "stone" },
  { kind: "bonecaller", name: "Maeryn", avA: "drift", avB: "bone" },
  { kind: "veilborn",   name: "Oswick", avA: "stone", avB: "drift" },
] as const;

const MUTE = [
  "loot", "gatherStart", "relocate", "season", "chat", "driftfall", "profile",
  "spinResult", "burnResult", "burnQuote", "walletNonce", "walletResult",
  "goldSync", "invSync", "prestigeResult", "founder", "pitQueue",
];

async function grant(extra: (typeof EXTRAS)[number]): Promise<boolean> {
  const token = `trailer-extra-${extra.kind}`;
  const room: Room<any> = await new Client(WS_URL).joinOrCreate("drift", { token });
  const handlers = new Map<string, ((m: any) => void)[]>();
  for (const t of MUTE) room.onMessage(t, (m: any) => (handlers.get(t) ?? []).forEach((h) => h(m)));
  const on = <T,>(type: string, timeoutMs = 45_000): Promise<T | null> =>
    new Promise((res) => {
      const to = setTimeout(() => res(null), timeoutMs);
      handlers.set(type, [(m) => { clearTimeout(to); handlers.delete(type); res(m); }]);
    });
  await wait(400);

  // already granted on a previous run? try wearing it
  room.send("identity", { name: extra.name, dye: "stone", eye: "drift", title: "", aura: "", pet: "", avatar: extra.kind, avA: extra.avA, avB: extra.avB });
  await wait(700);
  const ps = room.state.players.get(room.sessionId);
  if (ps?.avatar === extra.kind) {
    console.log(`${extra.name} already owns ${extra.kind} (skipping burn)`);
    await room.leave();
    return true;
  }

  // mint a fresh wallet enough DRIFTS for the 30k avatar burn
  const kp = Keypair.generate();
  const address = kp.publicKey.toBase58();
  console.log(`${extra.name}: minting 35000 to ${address.slice(0, 8)}…`);
  execFileSync("./node_modules/.bin/tsx",
    ["scripts/create-devnet-mint.ts", "--mint-to", address, "35000"],
    { cwd: SERVER_DIR, stdio: "pipe", timeout: 120_000 });

  // link the wallet (sign-message)
  const np = on<{ nonce: string }>("walletNonce", 8000);
  room.send("walletNonce");
  const n = await np;
  if (!n) { console.error(`${extra.name}: no nonce`); await room.leave(); return false; }
  const msg = new TextEncoder().encode(walletLinkMessage(address, n.nonce));
  const sig = nacl.sign.detached(msg, kp.secretKey);
  const lr = on<any>("walletResult", 30_000);
  room.send("linkWallet", { address, signature: Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("") });
  const linked = await lr;
  if (!linked?.ok) { console.error(`${extra.name}: link failed`, linked?.reason); await room.leave(); return false; }

  // burn for the avatar: quote → countersign → submit → prestige
  const conn = new Connection(RPC, "confirmed");
  const qp = on<any>("burnQuote", 30_000);
  room.send("burnQuote", { action: "prestigeAvatar" });
  const q = await qp;
  if (!q?.ok || !q.tx) { console.error(`${extra.name}: no quote`, q?.reason); await room.leave(); return false; }
  const tx = Transaction.from(Buffer.from(q.tx, "base64"));
  tx.partialSign(kp);
  const burnSig = await conn.sendRawTransaction(tx.serialize());
  console.log(`${extra.name}: burn submitted ${burnSig.slice(0, 12)}…`);
  const pr = on<any>("prestigeResult", 90_000);
  room.send("prestige", { key: extra.kind, burnSig });
  const p = await pr;
  if (!p?.ok) { console.error(`${extra.name}: prestige refused`, p?.reason); await room.leave(); return false; }

  // wear it (proves the grant landed)
  room.send("identity", { name: extra.name, dye: "stone", eye: "drift", title: "", aura: "", pet: "", avatar: extra.kind, avA: extra.avA, avB: extra.avB });
  await wait(700);
  const ok = room.state.players.get(room.sessionId)?.avatar === extra.kind;
  console.log(`${extra.name}: ${ok ? "WEARS" : "FAILED to wear"} ${extra.kind}`);
  await room.leave();
  return ok;
}

async function main() {
  if (!existsSync(MINT_FILE)) {
    console.error("No devnet mint. Run create-devnet-mint.ts first.");
    process.exit(1);
  }
  let granted = 0;
  for (const e of EXTRAS) {
    if (await grant(e)) granted++;
    await wait(500);
  }
  writeFileSync(OUT, JSON.stringify(EXTRAS.map((e) => ({
    token: `trailer-extra-${e.kind}`, name: e.name, avatar: e.kind, avA: e.avA, avB: e.avB,
  })), null, 2));
  console.log(`\n${granted}/${EXTRAS.length} extras own their avatars · wrote ${OUT}`);
  process.exit(granted === EXTRAS.length ? 0 : 1);
}

main().catch((e) => { console.error("prep crashed:", e); process.exit(1); });
