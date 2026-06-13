// Fresh, combat-forward gameplay clip for social (NOT the trailer tour).
// Zoom in → hunt + kill beasts (strike FX, floaters) → a quick chop → done.
// Records to public/gameplay/clip.webm. Prereqs: dev :3000 + server :2567.
//   node scripts/capture-clip.mjs
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL = "http://localhost:3000/play?demo=1";
const OUT_DIR = fileURLToPath(new globalThis.URL("../public/gameplay/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today, gold: 1240, driftSeason: 3, quests: [], tutorialDone: true,
  cosmetics: { name: "Kahl", dye: "ember", eye: "blood", aura: "", pet: "" },
  inventory: { wood: 8, stone: 6, fish: 2, cooked_fish: 4, driftshard: 9, hide: 7 },
  kills: 31,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.getByText("Step into the Drift").click({ timeout: 90_000 });
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });

const t0 = Date.now();
const mark = (l) => console.log(`MARK ${((Date.now() - t0) / 1000).toFixed(1)} ${l}`);
const demo = {
  toScreen: (x, y) => page.evaluate(([gx, gy]) => window.__demo.toScreen(gx, gy), [x, y]),
  player: () => page.evaluate(() => window.__demo.player()),
  nodes: () => page.evaluate(() => window.__demo.nodes()),
  mobs: () => page.evaluate(() => window.__demo.mobs()),
};
const clickCell = async (x, y) => {
  const s = await demo.toScreen(x, y);
  if (s.x < 20 || s.y < 60 || s.x > 1900 || s.y > 1020) return false;
  await page.mouse.click(s.x, s.y);
  return true;
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (list, p) => [...list].sort((a, b) => dist(a, p) - dist(b, p))[0];
const waitArrive = async (x, y, ms = 6000) => {
  const end = Date.now() + ms;
  for (;;) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= 1) return true;
    if (Date.now() > end) return false;
    await page.waitForTimeout(280);
  }
};
const walkTo = async (tx, ty, hops = 10) => {
  for (let i = 0; i < hops; i++) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty)) <= 1) return true;
    const nx = Math.round(p.x + Math.max(-4, Math.min(4, tx - p.x)));
    const ny = Math.round(p.y + Math.max(-4, Math.min(4, ty - p.y)));
    if (await clickCell(nx, ny)) await waitArrive(nx, ny, 4500);
    else await page.waitForTimeout(500);
  }
  return false;
};

// settle + a close, punchy zoom
await page.waitForTimeout(2800);
mark("zoom");
await page.mouse.move(960, 540);
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(120); }
await page.waitForTimeout(800);

// hunt: chase down and kill up to 3 beasts, re-reading positions as they move
mark("hunt");
let killed = 0;
for (let tries = 0; tries < 28 && killed < 3; tries++) {
  const mobs = await demo.mobs();
  if (mobs.length === 0) { await page.waitForTimeout(600); continue; }
  const p = await demo.player();
  const m = nearest(mobs, p);
  if (dist(m, p) > 4) { await walkTo(m.x, m.y, 3); continue; }
  const before = mobs.length;
  await clickCell(m.x, m.y);          // engage + swing (strike FX + floaters)
  await page.waitForTimeout(2000);
  const after = await demo.mobs();
  if (after.length < before) { killed++; mark(`kill ${killed}`); await page.waitForTimeout(1800); }
}

// a quick chop to show gathering loot floaters
mark("chop");
{
  const p = await demo.player();
  const tree = nearest((await demo.nodes()).filter((n) => n.kind === "tree"), p);
  if (tree) { await walkTo(tree.x, tree.y - 2, 6); await clickCell(tree.x, tree.y); await page.waitForTimeout(6000); }
}
mark("end");

await page.waitForTimeout(400);
const video = page.video();
await ctx.close();
const dest = `${OUT_DIR}clip.webm`;
renameSync(await video.path(), dest);
console.log(`SAVED ${dest}`);
await browser.close();
