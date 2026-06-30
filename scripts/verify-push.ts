/* eslint-disable @typescript-eslint/no-explicit-any */
// Web-push verification (Phase 2B): boots its OWN server (port 2585) with a
// VAPID keypair injected via env + PUSH_TEST=1 (the env-gated test trigger),
// then exercises the REAL send path end-to-end:
//   /push/key → subscribe (stored, counted) → /push/test actually encrypts and
//   POSTs to a mock push service → unsubscribe (count drops) → bad input 400.
// The mock stands in for the browser push service (we can't decrypt without a
// real browser, but receiving the encrypted POST proves the rail works).
// Run:  ./server/node_modules/.bin/tsx scripts/verify-push.ts

import { spawn, execSync } from "node:child_process";
import { rmSync, readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "node:https";
import { createECDH, randomBytes } from "node:crypto";

const PORT = 2585;
const MOCK_PORT = 2584;
const BASE = `http://localhost:${PORT}`;
const STAMP = Date.now();
const DATA_DIR = `/tmp/naevyr-verify-push-${STAMP}`;
const CERT_DIR = `/tmp/naevyr-verify-push-cert-${STAMP}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

/** a P-256 keypair, base64url-encoded like web-push expects (pub 65B, priv 32B) */
function p256() {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  let priv = ecdh.getPrivateKey();
  if (priv.length < 32) priv = Buffer.concat([Buffer.alloc(32 - priv.length), priv]);
  return { public: ecdh.getPublicKey().toString("base64url"), private: priv.toString("base64url") };
}
/** a browser-style subscription keypair (p256dh + auth) */
function subKeys() {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return { p256dh: ecdh.getPublicKey().toString("base64url"), auth: randomBytes(16).toString("base64url") };
}

async function main() {
  const vapid = p256();

  // web-push always delivers over HTTPS (real push services are TLS), so the
  // mock push service needs a cert. Self-sign one; the server trusts it via
  // NODE_TLS_REJECT_UNAUTHORIZED=0 (test-only).
  mkdirSync(CERT_DIR, { recursive: true });
  execSync(
    `openssl req -x509 -newkey rsa:2048 -nodes -keyout ${CERT_DIR}/key.pem -out ${CERT_DIR}/cert.pem -days 1 -subj "/CN=localhost"`,
    { stdio: "ignore" },
  );
  let delivered = 0;
  const mock = createServer(
    { key: readFileSync(`${CERT_DIR}/key.pem`), cert: readFileSync(`${CERT_DIR}/cert.pem`) },
    (req, res) => {
      if (req.method === "POST") delivered++;
      req.on("data", () => {});
      req.on("end", () => { res.writeHead(201); res.end(); });
    },
  );
  await new Promise<void>((r) => mock.listen(MOCK_PORT, r));

  const server = spawn("./node_modules/.bin/tsx", ["src/index.ts"], {
    cwd: resolve(process.cwd(), "server"),
    env: {
      ...process.env,
      PORT: String(PORT),
      DRIFT_DATA_DIR: DATA_DIR,
      VAPID_PUBLIC: vapid.public,
      VAPID_PRIVATE: vapid.private,
      VAPID_SUBJECT: "mailto:verify@naevyr.app",
      PUSH_TEST: "1",
      ECHO_OFF: "1",
      CARAVAN_FIRST_S: "9999",
      NODE_TLS_REJECT_UNAUTHORIZED: "0", // trust the mock's self-signed cert (test only)
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = await new Promise<boolean>((res) => {
    const to = setTimeout(() => res(false), 30_000);
    server.stdout.on("data", (d: Buffer) => { if (d.toString().includes("listening")) { clearTimeout(to); res(true); } });
    server.stderr.on("data", (d: Buffer) => process.stderr.write(`[server] ${d}`));
    server.on("exit", () => res(false));
  });
  check("isolated server boots", ready);
  if (!ready) return finish(server, mock, 1);

  const post = (path: string, body: unknown) =>
    fetch(`${BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  try {
    // 1. the VAPID public key is served, and matches what we configured
    const key = await fetch(`${BASE}/push/key`).then((r) => r.json());
    check("/push/key serves the configured VAPID key", key.key === vapid.public, `len=${(key.key ?? "").length}`);

    // 2. subscribe stores the subscription under the token
    const token = `push-${Date.now()}`;
    const ep1 = `https://localhost:${MOCK_PORT}/ep1`;
    const r1 = await post("/push/subscribe", { token, sub: { endpoint: ep1, keys: subKeys() } }).then((r) => r.json());
    check("subscribe stores the subscription", r1.ok === true && r1.count === 1, `count=${r1.count}`);

    // 3. the test trigger ACTUALLY encrypts + POSTs to the (mock) push service
    const before = delivered;
    const t = await post("/push/test", { token }).then((r) => r.json());
    await wait(500); // let the delivery POST land
    check("test trigger reports one send", t.sent === 1, `sent=${t.sent}`);
    check("push delivered to the (mock) push service", delivered === before + 1, `delivered ${before}→${delivered}`);

    // 4. a second device for the same token → count rises
    const ep2 = `https://localhost:${MOCK_PORT}/ep2`;
    const r2 = await post("/push/subscribe", { token, sub: { endpoint: ep2, keys: subKeys() } }).then((r) => r.json());
    check("a second device adds to the same token", r2.count === 2, `count=${r2.count}`);

    // 5. malformed subscription is rejected (no keys)
    const bad = await post("/push/subscribe", { token, sub: { endpoint: "http://x/y" } });
    check("malformed subscription is rejected (400)", bad.status === 400, `status=${bad.status}`);

    // 6. unsubscribe drops just that endpoint
    const u = await post("/push/unsubscribe", { token, endpoint: ep1 }).then((r) => r.json());
    check("unsubscribe removes one endpoint", u.ok === true && u.count === 1, `count=${u.count}`);
  } catch (e) {
    check("no exceptions during the run", false, (e as Error).message);
  }
  finish(server, mock, failures === 0 ? 0 : 1);
}

function finish(server: ReturnType<typeof spawn>, mock: ReturnType<typeof createServer>, code: number) {
  server.kill();
  mock.close();
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
  try { rmSync(CERT_DIR, { recursive: true, force: true }); } catch {}
  console.log(failures === 0 ? "\nWeb-push verified end-to-end." : `\n${failures} push checks FAILED.`);
  process.exit(code);
}

main();
