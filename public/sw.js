// Naevyr service worker — PUSH NOTIFICATIONS ONLY.
// Deliberately does NOT intercept fetch / cache anything: a caching SW could
// serve a stale JS chunk (the repo's known iCloud/.next corruption class), so
// this worker only wakes for push + notification clicks.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || "Naevyr";
  const body = data.body || "The Drift stirs.";
  const url = data.url || "/play";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: data.tag,
      renotify: !!data.tag,
      icon: "/assets/design-system.nosync/assets/appicon/app_icon_192.svg",
      badge: "/assets/design-system.nosync/assets/appicon/notif_badge.svg",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/play";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // focus an existing Naevyr tab if one is open, else open the game
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
