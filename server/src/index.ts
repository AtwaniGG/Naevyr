import "./env"; // first: solana.ts reads SOLANA_RPC at module scope
import { createServer } from "node:http";
import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Encoder } from "@colyseus/schema";
import { DriftRoom } from "./rooms/DriftRoom";
import { initDb, leaderboards, burnTotals, burnTotalsFor, savePushSub, deletePushSub, countPushSubs } from "./db";
import { gateTokens, getTokenBalance, tokenMint } from "./solana";
import { issueGateNonce, verifyGateProof } from "./gate";
import { initPush, pushPublicKey, notifyToken } from "./push";
import type { IncomingMessage } from "node:http";

/** read + JSON-parse a request body (bounded); resolves null on bad/oversized */
function readJson(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 100_000) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { resolve(null); } });
    req.on("error", () => resolve(null));
  });
}

// initial full state (1600-tile map + nodes + players) outgrows the 8KB default
Encoder.BUFFER_SIZE = 64 * 1024;
// deploy marker: gate auto-link is sim-authoritative (getProfile no longer races
// the DB write) + mobile WS ping tolerance (8s x 5) — force Railway to rebuild
// from main (client-only commits get skipped; this server work MUST ship)
// BUILD: bump on any server change that MUST reach prod; curl /version to confirm
const BUILD = "2026-06-15-season-start-now";

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
    // ownership proof: any connected wallet gets a nonce to sign, even on an
    // OPEN gate — signing once at the door auto-links the wallet on join (no
    // separate in-game link). A warded gate additionally requires the balance.
    // A stored proof can be re-checked here so the landing knows whether the
    // wallet must sign again (e.g. after a server restart rotates the secret).
    ...(address ? { nonce: issueGateNonce(address) } : {}),
    ...(address && nonce && sig
      ? { proofOk: verifyGateProof(address, nonce, sig) }
      : {}),
  };
}

async function main() {
  await initDb();
  const pushOn = initPush();
  console.log(pushOn ? "push: web-push armed (VAPID configured)" : "push: disabled (no VAPID)");
  const http = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
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
      void leaderboards()
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
    // the public scarcity counter: lifetime burned/treasury DRIFTS by sink.
    // ?address=<wallet> scopes the totals to that linked wallet's own burns.
    if (url.pathname === "/stats") {
      const address = (url.searchParams.get("address") ?? "").trim();
      const wantWallet = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      void (wantWallet ? burnTotalsFor(address) : burnTotals())
        .then((totals) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(totals));
        })
        .catch(() => {
          res.writeHead(500);
          res.end();
        });
      return;
    }
    // a deploy-verification handle: curl /version to confirm WHICH server build
    // is live (Railway has silently skipped rebuilds before). Bump BUILD on a
    // change that must reach prod.
    if (url.pathname === "/version") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ build: BUILD }));
      return;
    }
    // ---- web-push (Phase 2B) ---------------------------------------------------
    // the VAPID public key the client needs to subscribe ("" = push disabled)
    if (url.pathname === "/push/key") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ key: pushPublicKey() }));
      return;
    }
    // store a browser push subscription, owned by a device token
    if (url.pathname === "/push/subscribe" && req.method === "POST") {
      void readJson(req).then(async (b) => {
        const token = typeof b?.token === "string" ? b.token : "";
        const sub = b?.sub as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;
        if (!token || !sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) { res.writeHead(400); res.end(); return; }
        await savePushSub(token, typeof b?.wallet === "string" ? b.wallet : null,
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, count: await countPushSubs(token) }));
      }).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
    // drop a subscription (client opt-out or a stale endpoint)
    if (url.pathname === "/push/unsubscribe" && req.method === "POST") {
      void readJson(req).then(async (b) => {
        const endpoint = typeof b?.endpoint === "string" ? b.endpoint : "";
        if (!endpoint) { res.writeHead(400); res.end(); return; }
        await deletePushSub(endpoint);
        const count = typeof b?.token === "string" ? await countPushSubs(b.token) : 0;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, count }));
      }).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
    // env-gated test trigger (PUSH_TEST=1) — used ONLY by the verify harness to
    // exercise the real send path; never exposed in production.
    if (url.pathname === "/push/test" && process.env.PUSH_TEST === "1") {
      void readJson(req).then(async (b) => {
        const token = (typeof b?.token === "string" ? b.token : url.searchParams.get("token")) ?? "";
        const sent = token ? await notifyToken(token, { title: "Naevyr", body: "A nudge from the Drift.", tag: "test" }) : 0;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ sent }));
      }).catch(() => { res.writeHead(500); res.end(); });
      return;
    }
    res.writeHead(404);
    res.end();
  });
  // Mobile wallets (Phantom's in-app browser, etc.) background the page — and
  // throttle its WS timers — the moment the player switches over to sign a tx.
  // The default ping (3s × 2 retries ≈ 6s) terminates them mid-signature, which
  // dumped players to "wandering offline". Tolerate ~40s of silence so a sign +
  // app-switch round-trip survives; genuine drops are caught by the client's
  // auto-reconnect.
  const server = new Server({
    transport: new WebSocketTransport({ server: http, pingInterval: 8000, pingMaxRetries: 5 }),
  });
  server.define("drift", DriftRoom);
  await server.listen(port);
  console.log(`Naevyr server listening on ws://localhost:${port}`);
  const gate = gateTokens();
  console.log(gate > 0
    ? `Entry gate: ${gate} tokens (mint ${tokenMint()})`
    : "Entry gate: open (set GATE_TOKENS to lock the door)");
}

main().catch((e) => {
  console.error("server failed to start:", e);
  process.exit(1);
});
