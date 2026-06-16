// Records REAL frontier gameplay for a Twitter clip: drives the actual game in
// headless Chromium (the ?demo bridge only reads coords / forwards real clicks),
// treks OUT from spawn into the deep frontier ring and fights the new expansion
// species — all under a (server-forced) Blood Moon. Records webm.
// Prereqs (the caller boots these):
//   game server on :2567 with BLOOD_MOON_FIRST_S small + long BLOOD_MOON_MS,
//   MOB_COUNT high, GATE_TOKENS=0; next dev on :3000; bots spawned for crowd.
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL = "http://localhost:3000/play?demo=1";
const OUT_DIR = fileURLToPath(new globalThis.URL("../public/gameplay/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today,
  gold: 4200,
  driftSeason: 4,
  quests: [],
  tutorialDone: true,
  // a premium body (byte-exact veilborn) + ember eyes read great under the moon
  cosmetics: { name: "Vey", avatar: "veilborn", dye: "void", eye: "ember", aura: "", pet: "wisp" },
  ownedAvatars: ["veilborn"],
  ownedPets: ["wisp"],
  // a seasoned wanderer: combat 24 → the server accepts hard swings (clamp 50)
  skills: {
    woodcutting: { xp: 9000, level: 18 },
    mining: { xp: 9000, level: 18 },
    fishing: { xp: 6000, level: 14 },
    combat: { xp: 40000, level: 24 },
  },
  inventory: { wood: 22, stone: 16, fish: 6, cooked_fish: 5, driftshard: 14, hide: 9 },
  kills: 64,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.addInitScript((s) => {
  localStorage.setItem("driftlands-save-v1", JSON.stringify(s));
}, save);

await page.goto(URL, { waitUntil: "domcontentloaded" });
try {
  // the door now forks: choose the full Realm (gate is open → name → enter).
  // (the Realm lane uses the driftlands-save-v1 key our save is injected into)
  await page.getByRole("button", { name: "Enter the Realm" }).click({ timeout: 90_000 });
  const nameInput = page.locator("input.drift-well");
  try { await nameInput.fill("Vey", { timeout: 8_000 }); } catch { /* saved-name path: no input */ }
  await page.getByText("Step into the Drift").click({ timeout: 30_000 });
} catch (e) {
  await page.screenshot({ path: `${OUT_DIR}door-debug.png` });
  console.log("door state:", (await page.textContent("body"))?.slice(0, 400));
  throw e;
}
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });

const t0 = Date.now();
const mark = (label) => console.log(`MARK ${((Date.now() - t0) / 1000).toFixed(1)} ${label}`);

const demo = {
  toScreen: (x, y) => page.evaluate(([gx, gy]) => window.__demo.toScreen(gx, gy), [x, y]),
  player: () => page.evaluate(() => window.__demo.player()),
  nodes: () => page.evaluate(() => window.__demo.nodes()),
  mobs: () => page.evaluate(() => window.__demo.mobs()),
};
const clickCell = async (x, y) => {
  const s = await demo.toScreen(x, y);
  if (s.x < 30 || s.y < 80 || s.x > 1890 || s.y > 1010) return false; // off-screen / under HUD
  await page.mouse.click(s.x, s.y);
  return true;
};
const waitArrive = async (x, y, ms = 5000) => {
  const end = Date.now() + ms;
  for (;;) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= 1) return true;
    if (Date.now() > end) return false;
    await page.waitForTimeout(280);
  }
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (list, p) => [...list].sort((a, b) => dist(a, p) - dist(b, p))[0];

/** one ~4-tile hop toward (tx,ty); returns when it likely arrives */
const hopToward = async (tx, ty) => {
  const p = await demo.player();
  const nx = Math.round(p.x + Math.max(-4, Math.min(4, tx - p.x)));
  const ny = Math.round(p.y + Math.max(-4, Math.min(4, ty - p.y)));
  if (await clickCell(nx, ny)) await waitArrive(nx, ny, 4500);
  else await page.waitForTimeout(500);
};
const walkTo = async (tx, ty, hops = 16) => {
  for (let i = 0; i < hops; i++) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty)) <= 1) return true;
    await hopToward(tx, ty);
  }
  return false;
};

// settle: connect, profile, first frames
await page.waitForTimeout(3500);

// WAIT for the Blood Moon to rise (server fires it ~30s after boot; we joined
// well before that, so the broadcast lands and the log records it → red sky)
mark("await-bloodmoon");
try {
  await page.waitForFunction(() => document.body.innerText.includes("BLOOD MOON"), null, { timeout: 50_000 });
  mark("bloodmoon-up");
} catch { console.log("WARN: blood-moon log not seen — proceeding anyway"); }
await page.waitForTimeout(2200); // let the red sky ease in (2s ramp)

mark("zoom-in");
await page.mouse.move(960, 560);
for (let i = 0; i < 9; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(120); }
await page.waitForTimeout(900);

const killNearby = async () => {
  // engage the nearest mob; click it until it dies or we time out
  let m = nearest(await demo.mobs(), await demo.player());
  if (!m) return false;
  for (let g = 0; g < 4 && dist(m, await demo.player()) > 4; g++) {
    await hopToward(m.x, m.y);
    m = nearest(await demo.mobs(), await demo.player());
    if (!m) return false;
  }
  const before = (await demo.mobs()).length;
  for (let swing = 0; swing < 7; swing++) {
    const cur = nearest(await demo.mobs(), await demo.player());
    if (!cur) break;
    if (dist(cur, await demo.player()) > 4) { await hopToward(cur.x, cur.y); continue; }
    await clickCell(cur.x, cur.y);
    await page.waitForTimeout(1600);
    if ((await demo.mobs()).length < before) return "kill";
  }
  return true;
};

// PHASE A — trek NW into the deep frontier ring (tier 2 ≈ ≥29 tiles out) where
// the new species breed. Pure travel so we actually get there (the world scrolls
// by under the red sky). Spawn is map-center (40,40).
mark("trek");
const FRONTIER = { x: 16, y: 16 };
await walkTo(FRONTIER.x, FRONTIER.y, 22);
mark("reached-frontier");

// PHASE B — fight the frontier species for ~30s
mark("fight");
let kills = 0;
const fightEnd = Date.now() + 30_000;
while (Date.now() < fightEnd) {
  const p = await demo.player();
  const mobs = await demo.mobs();
  if (mobs.some((m) => dist(m, p) <= 8)) {
    if (await killNearby() === "kill") kills++;
    await page.waitForTimeout(350);
  } else {
    // roam the ring to find more of the new species
    await walkTo(FRONTIER.x + ((Math.random() * 10) | 0) - 5, FRONTIER.y + ((Math.random() * 10) | 0) - 5, 3);
  }
}
mark(`fought (kills≈${kills})`);

// PHASE C — closing vista: pull back over the corrupted frontier under the moon
mark("vista");
await page.mouse.move(960, 560);
for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(140); }
{
  const p = await demo.player();
  await walkTo(Math.max(6, p.x - 4), Math.max(6, p.y - 3), 3);
  await page.waitForTimeout(3000);
}
mark("end");

await page.waitForTimeout(500);
const video = page.video();
await ctx.close();
const path = await video.path();
const dest = `${OUT_DIR}frontier-raw.webm`;
renameSync(path, dest);
console.log(`SAVED ${dest}`);
await browser.close();
