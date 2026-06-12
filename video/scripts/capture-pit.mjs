// Targeted capture: a REAL wagered Pit duel between two driven clients, with
// three avatar-clad extras (premium models, really burned-for) watching ringside.
// Saves public/gameplay/pit.webm (the challenger's POV records).
// Needs npm run dev (3000) + npm run server (2567) running, AND a prior
//   ./server/node_modules/.bin/tsx scripts/prep-avatar-extras.ts
// run (writes /tmp/naevyr-extras.json with the granted tokens).
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL = "http://localhost:3000/play?demo=1";
const OUT_DIR = fileURLToPath(new globalThis.URL("../public/gameplay/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const mkSave = (name, dye, eye, aura) => ({
  day: today, gold: 800, driftSeason: 2, quests: [], tutorialDone: true,
  cosmetics: { name, dye, eye, aura, pet: "" },
  inventory: { wood: 6, stone: 4, fish: 2, cooked_fish: 2, driftshard: 3, hide: 2 },
  kills: 20,
});

const browser = await chromium.launch();

// A — the challenger; this context RECORDS
const ctxA = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } },
});
// B — the opponent; no recording
const ctxB = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

const boot = async (ctx, save, deviceToken = null) => {
  const page = await ctx.newPage();
  await page.addInitScript(([s, tok]) => {
    localStorage.setItem("driftlands-save-v1", JSON.stringify(s));
    if (tok) localStorage.setItem("driftlands-device", tok);
  }, [save, deviceToken]);
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.getByText("Step into the Drift").click({ timeout: 90_000 });
  await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });
  return page;
};

const A = await boot(ctxA, mkSave("Vey", "void", "ember", "goldhalo"));
const B = await boot(ctxB, mkSave("Korr", "blood", "gold", "emberwake"));

// the avatar-clad extras (their tokens already OWN the avatars — see prep)
const EXTRAS_FILE = "/tmp/naevyr-extras.json";
// mid-edge cells at radius 3, in the torchlight between the DS watchers
const RINGSIDE = [{ x: 23, y: 32 }, { x: 17, y: 32 }, { x: 20, y: 35 }];
const extras = [];
if (existsSync(EXTRAS_FILE)) {
  const list = JSON.parse(readFileSync(EXTRAS_FILE, "utf8"));
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const save = {
      ...mkSave(e.name, "stone", "drift", ""),
      cosmetics: { name: e.name, dye: "stone", eye: "drift", aura: "", pet: "", avatar: e.avatar, avA: e.avA, avB: e.avB },
    };
    const page = await boot(ctx, save, e.token);
    extras.push({ page, ctx, seat: RINGSIDE[i % RINGSIDE.length], name: e.name });
  }
  console.log(`booted ${extras.length} avatar extras`);
} else {
  console.warn("no /tmp/naevyr-extras.json — run scripts/prep-avatar-extras.ts first (capturing without extras)");
}

const t0 = Date.now();
const mark = (label) => console.log(`MARK ${((Date.now() - t0) / 1000).toFixed(1)} ${label}`);

const demo = (page) => ({
  toScreen: (x, y) => page.evaluate(([gx, gy]) => window.__demo.toScreen(gx, gy), [x, y]),
  player: () => page.evaluate(() => window.__demo.player()),
  others: () => page.evaluate(() => window.__demo.others()),
  duel: () => page.evaluate(() => window.__demo.duel()),
  challenge: (id, wager) =>
    page.evaluate(([t, w]) => window.__demo.challenge(t, w), [id, wager]),
  accept: () => page.evaluate(() => window.__demo.acceptDuel()),
  click: async (x, y) => {
    const s = await page.evaluate(([gx, gy]) => window.__demo.toScreen(gx, gy), [x, y]);
    if (s.x < 20 || s.y < 60 || s.x > 1900 || s.y > 1020) return false;
    await page.mouse.click(s.x, s.y);
    return true;
  },
});
const dA = demo(A), dB = demo(B);

/** hop a page's wanderer toward a cell on plain ground (4-tile hops) */
const walkTo = async (page, tx, ty, hops = 12) => {
  const d = demo(page);
  for (let i = 0; i < hops; i++) {
    const p = await d.player();
    if (Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty)) <= 1) return true;
    const nx = Math.round(p.x + Math.max(-4, Math.min(4, tx - p.x)));
    const ny = Math.round(p.y + Math.max(-4, Math.min(4, ty - p.y)));
    if (await page.evaluate(([gx, gy]) => window.__demo.walkable(gx, gy), [nx, ny])) {
      await d.click(nx, ny);
    }
    await page.waitForTimeout(1400);
  }
  return false;
};

// the extras take their ringside seats while the fighters get ready
const seatWalks = extras.map((e) =>
  walkTo(e.page, e.seat.x, e.seat.y).then((ok) =>
    console.log(`${e.name} ${ok ? "seated at" : "still short of"} (${e.seat.x},${e.seat.y})`)),
);

// settle + zoom A's camera in HARD (the Pit sits near the map's south edge —
// a wide shot lets the void past the world border into frame)
await A.waitForTimeout(3000);
await A.mouse.move(960, 560);
for (let i = 0; i < 12; i++) {
  await A.mouse.wheel(0, -240);
  await A.waitForTimeout(140);
}

// A waits until it can see KORR specifically (other wanderers may be online)
let bId = null;
for (let i = 0; i < 30 && !bId; i++) {
  const others = await dA.others();
  bId = others.find((o) => o.name === "Korr")?.id ?? null;
  if (!bId) await A.waitForTimeout(500);
}
if (!bId) throw new Error("A never saw Korr in the shared world");
mark(`found opponent ${bId}`);

// let the crowd finish settling before the steel comes out
await Promise.race([Promise.all(seatWalks), A.waitForTimeout(25_000)]);
mark("crowd seated");

// the challenge crosses, B accepts; the server seats both fighters in the Pit
await dA.challenge(bId, 100);
await B.waitForTimeout(1200); // the challenged prompt lands
await dB.accept();
mark("duel accepted (TO THE PIT)");
await A.waitForTimeout(1800); // teleport + banner

// close to melee at the pit's south rim: clicking INSIDE the footprint opens
// the Pit panel (building click), so aim just outside it (y=35) where it's a
// plain move — the fighters end up adjacent and the auto-swing takes over
await dA.click(19, 35);
await dB.click(20, 35);
mark("closing");

// fight to the end: auto-swing handles the blows; re-nudge if anyone drifts
let result = "timeout";
for (let i = 0; i < 60; i++) {
  const duel = await dA.duel();
  if (!duel) { result = "ended"; mark("duel over"); break; }
  if (i % 8 === 7) { await dA.click(19, 35); await dB.click(20, 35); }
  await A.waitForTimeout(700);
}
await A.waitForTimeout(3500); // victory banner + pot floaters on camera

mark("end");
const video = A.video();
await ctxA.close();
await ctxB.close();
for (const e of extras) await e.ctx.close();
const path = await video.path();
renameSync(path, `${OUT_DIR}pit.webm`);
console.log(`SAVED ${OUT_DIR}pit.webm result=${result}`);
await browser.close();
