// Records REAL gameplay for the trailer: drives the actual game in headless
// Chromium with real canvas clicks (the ?demo bridge only reads coordinates),
// records the session as webm, and prints MARK timestamps for the edit.
// Prereqs: game server on :2567 and next dev on :3000 (the runner boots both).
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL = "http://localhost:3000/play?demo=1";
// fileURLToPath, not .pathname — the repo path contains a space (CLAUDE.md)
const OUT_DIR = fileURLToPath(new globalThis.URL("../public/gameplay/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today,
  gold: 640,
  driftSeason: 2,
  quests: [],
  tutorialDone: true,
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
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.addInitScript((s) => {
  localStorage.setItem("driftlands-save-v1", JSON.stringify(s));
}, save);

await page.goto(URL, { waitUntil: "domcontentloaded" });
try {
  await page.getByText("Step into the Drift").click({ timeout: 90_000 });
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
  if (s.x < 20 || s.y < 60 || s.x > 1900 || s.y > 1020) return false; // off-screen / under HUD
  await page.mouse.click(s.x, s.y);
  return true;
};
const waitArrive = async (x, y, ms = 12_000) => {
  const end = Date.now() + ms;
  for (;;) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= 1) return true;
    if (Date.now() > end) return false;
    await page.waitForTimeout(300);
  }
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (list, p) => [...list].sort((a, b) => dist(a, p) - dist(b, p))[0];

/** walk long distances in ~4-tile hops so every click stays on-screen */
const walkTo = async (tx, ty, hops = 14) => {
  for (let i = 0; i < hops; i++) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty)) <= 1) return true;
    const nx = Math.round(p.x + Math.max(-4, Math.min(4, tx - p.x)));
    const ny = Math.round(p.y + Math.max(-4, Math.min(4, ty - p.y)));
    if (await clickCell(nx, ny)) await waitArrive(nx, ny, 5000);
    else await page.waitForTimeout(600);
  }
  return false;
};

// settle: connect, profile, first frames
await page.waitForTimeout(3000);

mark("zoom");
await page.mouse.move(960, 560);
for (let i = 0; i < 7; i++) {
  await page.mouse.wheel(0, -240); // negative = zoom IN (×1.1 per tick → ~1.95)
  await page.waitForTimeout(140);
}
await page.waitForTimeout(1000);

mark("townwalk");
for (const [x, y] of [[17, 16], [14, 22], [21, 25]]) await walkTo(x, y, 6);

mark("gather-tree");
{
  const p = await demo.player();
  const tree = nearest((await demo.nodes()).filter((n) => n.kind === "tree"), p);
  if (tree) {
    await walkTo(tree.x, tree.y - 3, 8); // get it on screen
    await clickCell(tree.x, tree.y);
    await page.waitForTimeout(9000); // a few chops (loot floaters)
  }
}

mark("gather-rock");
{
  const p = await demo.player();
  const rock = nearest((await demo.nodes()).filter((n) => n.kind === "rock"), p);
  if (rock) {
    await walkTo(rock.x, rock.y - 3, 8);
    await clickCell(rock.x, rock.y);
    await page.waitForTimeout(8000);
  }
}

mark("combat");
for (let tries = 0; tries < 12; tries++) {
  const mobs = await demo.mobs();
  if (mobs.length === 0) break;
  const p = await demo.player();
  const m = nearest(mobs, p);
  if (dist(m, p) > 5) {
    await walkTo(m.x, m.y, 3); // close the gap, then re-read its position
    continue;
  }
  await clickCell(m.x, m.y);
  await page.waitForTimeout(2200);
  const after = await demo.mobs();
  if (after.length < mobs.length) {
    await page.waitForTimeout(2500); // death anim + loot
    break;
  }
}

mark("vista");
{
  // pull back for a closing landscape shot
  await page.mouse.move(960, 560);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(140);
  }
  const p = await demo.player();
  const tx = p.x < 20 ? p.x + 7 : p.x - 7;
  const ty = p.y < 20 ? p.y + 5 : p.y - 5;
  await walkTo(tx, ty, 4);
  await page.waitForTimeout(2500);
}
mark("end");

await page.waitForTimeout(500);
const video = page.video();
await ctx.close();
const path = await video.path();
const dest = `${OUT_DIR}gameplay.webm`;
renameSync(path, dest);
console.log(`SAVED ${dest}`);
await browser.close();
