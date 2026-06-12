// Targeted capture: find a Drift Beast and kill it on camera. Saves
// public/gameplay/combat.webm. Same real-clicks approach as capture.mjs.
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL = "http://localhost:3000/play?demo=1";
const OUT_DIR = fileURLToPath(new globalThis.URL("../public/gameplay/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today, gold: 640, driftSeason: 2, quests: [], tutorialDone: true,
  cosmetics: { name: "Vey", dye: "void", eye: "ember", aura: "", pet: "" },
  inventory: { wood: 12, stone: 8, fish: 3, cooked_fish: 2, driftshard: 5, hide: 4 },
  kills: 12,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
await page.addInitScript((s) => {
  localStorage.setItem("driftlands-save-v1", JSON.stringify(s));
}, save);
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.getByText("Step into the Drift").click({ timeout: 90_000 });
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });

const t0 = Date.now();
const mark = (label) => console.log(`MARK ${((Date.now() - t0) / 1000).toFixed(1)} ${label}`);
const demo = {
  toScreen: (x, y) => page.evaluate(([gx, gy]) => window.__demo.toScreen(gx, gy), [x, y]),
  player: () => page.evaluate(() => window.__demo.player()),
  mobs: () => page.evaluate(() => window.__demo.mobs()),
  walkable: (x, y) => page.evaluate(([gx, gy]) => window.__demo.walkable(gx, gy), [x, y]),
};
const clickCell = async (x, y) => {
  const s = await demo.toScreen(x, y);
  if (s.x < 20 || s.y < 60 || s.x > 1900 || s.y > 1020) return false;
  await page.mouse.click(s.x, s.y);
  return true;
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (list, p) => [...list].sort((a, b) => dist(a, p) - dist(b, p))[0];

/** hop toward a target on plain walkable ground only */
const walkTo = async (tx, ty, hops = 10) => {
  for (let i = 0; i < hops; i++) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty)) <= 2) return true;
    let nx = Math.round(p.x + Math.max(-4, Math.min(4, tx - p.x)));
    let ny = Math.round(p.y + Math.max(-4, Math.min(4, ty - p.y)));
    // nudge off buildings/water
    let ok = await demo.walkable(nx, ny);
    for (let n = 1; !ok && n <= 3; n++) {
      for (const [dx, dy] of [[n, 0], [-n, 0], [0, n], [0, -n]]) {
        if (await demo.walkable(nx + dx, ny + dy)) { nx += dx; ny += dy; ok = true; break; }
      }
    }
    if (!ok) { await page.waitForTimeout(400); continue; }
    if (await clickCell(nx, ny)) {
      const end = Date.now() + 5000;
      while (Date.now() < end) {
        const q = await demo.player();
        if (Math.max(Math.abs(q.x - nx), Math.abs(q.y - ny)) <= 1) break;
        await page.waitForTimeout(250);
      }
    } else await page.waitForTimeout(400);
  }
  return false;
};

await page.waitForTimeout(3000);
await page.mouse.move(960, 560);
for (let i = 0; i < 7; i++) {
  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(140);
}
await page.waitForTimeout(800);

mark("hunt");
let killed = false;
for (let tries = 0; tries < 20 && !killed; tries++) {
  const mobs = await demo.mobs();
  if (mobs.length === 0) { await page.waitForTimeout(1500); continue; }
  const p = await demo.player();
  const m = nearest(mobs, p);
  if (dist(m, p) > 6) { await walkTo(m.x, m.y, 3); continue; }
  mark(`engage hp=${m.hp}`);
  await clickCell(m.x, m.y);
  await page.waitForTimeout(2400);
  const after = await demo.mobs();
  if (after.length < mobs.length) {
    mark("kill");
    killed = true;
    await page.waitForTimeout(3000); // death anim + loot on the ledger
  }
}
mark("end");

await page.waitForTimeout(500);
const video = page.video();
await ctx.close();
const path = await video.path();
renameSync(path, `${OUT_DIR}combat.webm`);
console.log(`SAVED ${OUT_DIR}combat.webm killed=${killed}`);
await browser.close();
