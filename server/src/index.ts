import "./env"; // first: solana.ts reads SOLANA_RPC at module scope
import { createServer } from "node:http";
import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Encoder } from "@colyseus/schema";
import { DriftRoom } from "./rooms/DriftRoom";
import { initDb, leaderboards } from "./db";
import { gateTokens, getTokenBalance, tokenMint } from "./solana";
import { issueGateNonce, verifyGateProof } from "./gate";

// initial full state (1600-tile map + nodes + players) outgrows the 8KB default
Encoder.BUFFER_SIZE = 64 * 1024;

const port = Number(process.env.PORT ?? 2567);

// The entry gate, as HTTP: the landing page asks BEFORE joining whether the
// door is token-locked and whether a wallet clears it. The same rule is
// enforced authoritatively in DriftRoom.onAuth.
async function handleGate(address: string | null, nonce: string | null, sig: string | null) {
  const gate = gateTokens();
  // balance reads whenever a mint is configured (the landing's nav chip wants
  // it even on an ungated server); the gate itself only bites when set
  const balance = address && tokenMint() ? await getTokenBalance(address) : null;
  let online = 0;
  try {
    const rooms = await matchMaker.query({ name: "drift" });
    online = rooms.reduce((n, r) => n + r.clients, 0);
  } catch {
    // matchmaker not ready yet — zero is honest enough
  }
  return {
    gate,
    mint: tokenMint() || null,
    balance,
    ok: gate === 0 || (balance ?? 0) >= gate,
    online,
    // ownership proof: a warded door hands the wallet a nonce to sign; a
    // stored proof can be re-checked here so the landing knows whether the
    // wallet must sign again (e.g. after a server restart rotates the secret)
    ...(gate > 0 && address ? { nonce: issueGateNonce(address) } : {}),
    ...(gate > 0 && address && nonce && sig
      ? { proofOk: verifyGateProof(address, nonce, sig) }
      : {}),
  };
}

async function main() {
  await initDb();
  const http = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/gate") {
      void handleGate(
        url.searchParams.get("address"),
        url.searchParams.get("nonce"),
        url.searchParams.get("sig"),
      )
        .then((body) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        })
        .catch(() => {
          res.writeHead(500);
          res.end();
        });
      return;
    }
    if (url.pathname === "/leaderboard") {
      void leaderboards(10)
        .then((boards) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(boards));
        })
        .catch(() => {
          res.writeHead(500);
          res.end();
        });
      return;
    }
    res.writeHead(404);
    res.end();
  });
  const server = new Server({ transport: new WebSocketTransport({ server: http }) });
  server.define("drift", DriftRoom);
  await server.listen(port);
  console.log(`Driftlands server listening on ws://localhost:${port}`);
  const gate = gateTokens();
  console.log(gate > 0
    ? `Entry gate: ${gate} tokens (mint ${tokenMint()})`
    : "Entry gate: open (set GATE_TOKENS to lock the door)");
}

main().catch((e) => {
  console.error("server failed to start:", e);
  process.exit(1);
});
