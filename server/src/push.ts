// Web-push notifications (Phase 2B): deliver "come back" nudges to a player's
// browser even when their tab is closed. The browser push service holds the
// subscription; we POST an encrypted payload to it and the service worker
// (public/sw.js) shows the notification.
//
// VAPID keys identify this application server to the push services. Resolution
// mirrors solana.ts feePayer(): env first (prod), then a gitignored local file
// (server/.data/vapid.json), generated once on first boot if absent. The PUBLIC
// key is safe to ship to clients; the PRIVATE key never leaves the server.

import webpush from "web-push";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { getPushSubs, getAllPushSubs, deletePushSub, type PushSubRow } from "./db";

let publicKey = "";
let configured = false;

/** load VAPID keys (env → local file → generate), configure web-push once */
export function initPush(): boolean {
  if (configured) return true;
  let pub = process.env.VAPID_PUBLIC ?? "";
  let priv = process.env.VAPID_PRIVATE ?? "";
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@naevyr.app";

  if (!pub || !priv) {
    // local/dev fallback: a gitignored keypair in server/.data, generated once
    const f = fileURLToPath(new URL("../.data/vapid.json", import.meta.url));
    try {
      if (existsSync(f)) {
        const j = JSON.parse(readFileSync(f, "utf8"));
        pub = j.publicKey; priv = j.privateKey;
      } else {
        const keys = webpush.generateVAPIDKeys();
        pub = keys.publicKey; priv = keys.privateKey;
        mkdirSync(dirname(f), { recursive: true });
        writeFileSync(f, JSON.stringify(keys, null, 2));
        console.log("push: generated a new VAPID keypair → server/.data/vapid.json");
      }
    } catch (e) {
      console.error("push: VAPID key setup failed, notifications disabled:", (e as Error).message);
      return false;
    }
  }

  try {
    webpush.setVapidDetails(subject, pub, priv);
    publicKey = pub;
    configured = true;
    return true;
  } catch (e) {
    console.error("push: setVapidDetails failed, notifications disabled:", (e as Error).message);
    return false;
  }
}

/** the VAPID public key clients need to subscribe (empty if push is disabled) */
export function pushPublicKey(): string {
  return publicKey;
}

export interface PushPayload {
  title: string;
  body: string;
  /** deep-link path opened on click (default "/play") */
  url?: string;
  /** dedupe tag so repeats replace rather than stack */
  tag?: string;
}

/** send one payload to one stored subscription; prune it if the service says
 *  it's gone (404/410). Never throws — a dead endpoint must not break a tick. */
async function sendOne(row: PushSubRow, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify(payload),
      { TTL: 3600 },
    );
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) await deletePushSub(row.endpoint).catch(() => {});
    else console.warn(`push: send failed (${code ?? "?"}):`, (e as Error).message);
    return false;
  }
}

/** notify every device a token owns (the per-player rail: sold, claim siege) */
export async function notifyToken(token: string, payload: PushPayload): Promise<number> {
  if (!configured) return 0;
  const subs = await getPushSubs(token).catch(() => [] as PushSubRow[]);
  const results = await Promise.all(subs.map((s) => sendOne(s, payload)));
  return results.filter(Boolean).length;
}

/** notify every subscription in the realm (rare realm events: the Long Night) */
export async function notifyAll(payload: PushPayload): Promise<number> {
  if (!configured) return 0;
  const subs = await getAllPushSubs().catch(() => [] as PushSubRow[]);
  const results = await Promise.all(subs.map((s) => sendOne(s, payload)));
  return results.filter(Boolean).length;
}
