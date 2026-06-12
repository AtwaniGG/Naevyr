/* eslint-disable @typescript-eslint/no-explicit-any */
// Burn verification (Phase 5 final slice + the Phase 6 fee-split rail). Boots
// an isolated server with OUR devnet mint AND a fresh treasury wallet, then
// runs REAL on-chain burns through the full game protocol:
//   mint test tokens → link wallet → burnQuote → countersign + submit to
//   devnet → spin with burnSig → win roll; replay rejected; cleanse burn
//   feeds the shrine pot; bogus signature rejected; reinforce shores up an
//   eroded claim; a Drift-touched (prestige) aura grants; the first burn
//   inside FOUNDER_UNTIL stamps the Founder mark; every sink splits 50/50
//   burn/treasury (verified against the treasury's on-chain balance + /stats).
// Needs server/.data/devnet-mint.json (create-devnet-mint.ts) + funded authority.
// Run from repo root:  ./server/node_modules/.bin/tsx scripts/verify-burns.ts

import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Room } from "colyseus.js";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { walletLinkMessage, BURN_COSTS } from "../game/types";

const RPC = "https://api.devnet.solana.com";
const PORT = 2595;
const WS_URL = `ws://localhost:${PORT}`;
const DATA_DIR = `/tmp/naevyr-verify-burns-${Date.now()}`;
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
  "goldSync", "invSync", "donateResult",
  "claimResult", "claimPlaced", "claimReinforced", "reinforceResult", "prestigeResult",
];

const TILE = ["grass", "dirt", "stone", "water", "corrupt"];

/** the first stakeable 3×3 plot (grass/dirt, clear of claims) */
function findPlot(state: any): { x: number; y: number } | null {
  const w = state.w, h = state.h;
  const tile = (x: number, y: number) => TILE[state.tiles[y * w + x]];
  outer: for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = tile(x + dx, y + dy);
          if (t === "water" || t === "corrupt") continue outer;
        }
      let clash = false;
      state.claims.forEach((c: any) => {
        if (Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) < 3) clash = true;
      });
      if (!clash) return { x, y };
    }
  }
  return null;
}

async function main() {
  if (!existsSync(MINT_FILE)) {
    console.error("No devnet mint. Run create-devnet-mint.ts first.");
    process.exit(1);
  }
  const mint = JSON.parse(readFileSync(MINT_FILE, "utf8")).mint as string;

  // wallet under test: a raw keypair (zero SOL — the authority pays fees)
  const kp = Keypair.generate();
  const address = kp.publicKey.toBase58();
  console.log(`minting 100000 test tokens to ${address}…`);
  execFileSync("./node_modules/.bin/tsx",
    ["scripts/create-devnet-mint.ts", "--mint-to", address, "100000"],
    { cwd: SERVER_DIR, stdio: "pipe", timeout: 120_000 });

  // a fresh receive-only treasury arms the 50/50 fee split for this server
  const treasury = Keypair.generate();
  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: SERVER_DIR,
    env: {
      ...process.env, PORT: String(PORT), DRIFT_DATA_DIR: DATA_DIR,
      CARAVAN_FIRST_S: "9999", TOKEN_MINT: mint,
      TREASURY_ADDRESS: treasury.publicKey.toBase58(),
      SEASON_MS: "6000", // fast erosion so reinforce has something to mend
      FOUNDER_UNTIL: new Date(Date.now() + 3_600_000).toISOString(),
    },
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
    let founderSeen = false;
    room.onMessage("founder", () => { founderSeen = true; });
    // the live in-realm DRIFTS balance the server pushes after each burn
    let lastTokenSync: number | null = null;
    room.onMessage("tokenSync", (m: any) => { lastTokenSync = m.tokenBalance; });
    await wait(300);
    // Phase 6: claims pay from the server ledger — seed the purse via first save
    room.send("save", { snapshot: { gold: 1000, day: 0 } });
    await wait(400);

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

    // the burn must debit the live in-realm balance by exactly the spin cost
    await wait(500); // let tokenSync land
    check("burn debits the live in-realm DRIFTS balance (tokenSync)",
      lastTokenSync != null && lastTokenSync === (linked!.tokenBalance - BURN_COSTS.spin),
      `linked=${linked?.tokenBalance} → sync=${lastTokenSync} (spin cost ${BURN_COSTS.spin})`);

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
    check("cleanse burn accepted", cleanse?.ok === true,
      cleanse?.ok ? `+${cleanse.pot}g` : `reason: ${cleanse?.reason}`);
    check("shrine pot rose by the burn value", room.state.shrinePot >= potBefore + 150,
      `${potBefore} → ${room.state.shrinePot}`);

    // 4) garbage signature rejected fast
    await wait(2600);
    const br4 = on<any>("burnResult", 30_000);
    room.send("spin", { burnSig: bs58.encode(nacl.sign.keyPair().secretKey).slice(0, 64) });
    const junk = await br4;
    check("bogus signature rejected", junk?.ok === false, junk?.reason);

    // 5) reinforce: stake a claim, refuse at full warding, then mend erosion
    const plot = findPlot(room.state);
    check("found stakeable ground", !!plot, plot ? `${plot.x},${plot.y}` : "none");
    if (plot) {
      const cr = on<any>("claimResult", 8_000);
      room.send("claim", { x: plot.x, y: plot.y });
      const staked = await cr;
      check("claim staked (gold path)", staked?.ok === true, staked?.reason);

      const rrFull = on<any>("reinforceResult", 8_000);
      room.send("reinforce", { burnSig: "x" });
      const full = await rrFull;
      check("reinforce refused at full warding", full?.ok === false, full?.reason);

      // let the seasons grind the warding down (SEASON_MS=6000)
      await wait(14_000);
      let pre = 100;
      room.state.claims.forEach((c: any) => { pre = Math.min(pre, c.integrity); });
      check("the Drift eroded the claim", pre < 100, `integrity ${pre}`);

      const reinforceSig = await executeBurn("reinforce");
      check("reinforce burn submitted", !!reinforceSig, reinforceSig?.slice(0, 16));
      const rr = on<any>("reinforceResult", 60_000);
      room.send("reinforce", { burnSig: reinforceSig });
      const mended = await rr;
      check("reinforce mended the warding",
        mended?.ok === true && mended.integrity > pre && mended.integrity <= 100,
        `${pre} → ${mended?.integrity}`);
    }

    // 6) Drift-touched (prestige) aura: burn-only, granted by the server's word
    const prestigeSig = await executeBurn("prestigeAura");
    check("prestige burn submitted", !!prestigeSig, prestigeSig?.slice(0, 16));
    const pr = on<any>("prestigeResult", 60_000);
    room.send("prestige", { key: "corruption_halo", burnSig: prestigeSig });
    const prestige = await pr;
    check("prestige aura granted", prestige?.ok === true && prestige?.kind === "aura",
      prestige?.reason ?? prestige?.key);

    // 7) unknown prestige key refused before any burn is consumed
    const pr2 = on<any>("prestigeResult", 8_000);
    room.send("prestige", { key: "nope", burnSig: "x" });
    const unknown = await pr2;
    check("unknown prestige key refused", unknown?.ok === false, unknown?.reason);

    // 7b) the identity sync must ACCEPT the owned prestige aura…
    {
      room.send("identity", { aura: "corruption_halo" });
      await wait(500);
      const me = room.state.players.get(room.sessionId);
      check("owned prestige aura accepted on sync", me?.aura === "corruption_halo", `aura=${me?.aura}`);
    }
    // …and REJECT a prestige aura the player never burned for (anti-spoof)
    {
      room.send("identity", { aura: "bonewisp" }); // never purchased
      await wait(500);
      const me = room.state.players.get(room.sessionId);
      check("unowned prestige aura rejected on sync", me?.aura !== "bonewisp", `aura=${me?.aura}`);
    }

    // 8) the Founder window: the first verified burn marked the wanderer
    check("founder mark granted on first burn", founderSeen);
    const pp = on<any>("profile", 10_000);
    room.send("getProfile");
    const prof = await pp;
    check("founder persists on the profile", prof?.founder === true);
    check("profile carries prestige ownership",
      Array.isArray(prof?.prestige) && prof.prestige.includes("corruption_halo"),
      `prestige=${JSON.stringify(prof?.prestige)}`);

    // 9) the 50/50 split, on-chain: the treasury holds exactly half of every sink
    //    spin 5000 + cleanse 10000 + reinforce 10000 + prestigeAura 25000 = 50000 → 25000 each
    const expectTreasury = 25_000;
    let treasuryHeld = 0;
    try {
      const accs = await conn.getParsedTokenAccountsByOwner(treasury.publicKey, {
        mint: new PublicKey(mint),
      });
      for (const a of accs.value) treasuryHeld += a.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    } catch (e) {
      console.log(`      …treasury read failed: ${(e as Error).message}`);
    }
    check("treasury holds half of every sink", treasuryHeld === expectTreasury,
      `${treasuryHeld}/${expectTreasury}`);

    // 10) the public counter reads the same truth
    const stats = await (await fetch(`http://localhost:${PORT}/stats`)).json();
    check("/stats counts the burned half", stats.burned === expectTreasury, `burned=${stats.burned}`);
    check("/stats counts the treasury half", stats.treasury === expectTreasury, `treasury=${stats.treasury}`);
    check("/stats counts the rites", stats.count === 4, `count=${stats.count}`);

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
