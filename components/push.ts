// Client-side web-push opt-in (Phase 2B). Registers the push-only service
// worker, subscribes via the browser PushManager using the server's VAPID key,
// and registers/removes the subscription with the game server. All best-effort:
// a browser without push support, a denied permission, or an offline server
// just leaves notifications off.

import { httpBase } from "./gate";
import { getDeviceToken } from "@/game/state/persistence";

export type PushState = "unsupported" | "denied" | "idle" | "subscribed";

export function pushSupported(): boolean {
  return typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window &&
    "Notification" in window;
}

/** VAPID keys travel as base64url; PushManager wants the raw bytes. Allocate
 *  over an explicit ArrayBuffer so the type satisfies BufferSource. */
function urlB64ToBuffer(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  return existing ?? navigator.serviceWorker.register("/sw.js");
}

/** current opt-in state without prompting (for the toggle's initial render) */
export async function currentPushState(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return sub ? "subscribed" : "idle";
  } catch {
    return "idle";
  }
}

/** prompt + subscribe + tell the server. Resolves the resulting state. */
export async function enablePush(wallet?: string | null): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "idle";

  const { key } = await fetch(`${httpBase()}/push/key`, { signal: AbortSignal.timeout(6000) }).then((r) => r.json());
  if (!key) return "idle"; // push disabled server-side (no VAPID)

  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToBuffer(key) }));

  const res = await fetch(`${httpBase()}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: getDeviceToken(), wallet: wallet ?? null, sub: sub.toJSON() }),
    signal: AbortSignal.timeout(6000),
  });
  return res.ok ? "subscribed" : "idle";
}

/** unsubscribe locally + drop the server record */
export async function disablePush(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await fetch(`${httpBase()}/push/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: getDeviceToken(), endpoint: sub.endpoint }),
        signal: AbortSignal.timeout(6000),
      }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
  } catch {
    // best-effort
  }
  return Notification.permission === "denied" ? "denied" : "idle";
}
