// Captures ONE clean montage run hitting every core activity, for the social
// clip: chop a tree, fish, mine gold (the Mine), kill a beast, spin the Wheel.
// Records public/gameplay/activities.webm and prints MARK <sec> <beat> +
// OFFSET so the montage can cut tight windows around each beat.
// Prereqs: dev :3000 and a server on :2567 (an isolated one is fine).
//   node scripts/capture-activities.mjs
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL = "http://localhost:3000/play?demo=1";
const OUT_DIR = fileURLToPath(new globalThis.URL("../public/gameplay/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today, gold: 1450, driftSeason: 3, quests: [], tutorialDone: true,
  cosmetics: { name: "Kahl", dye: "ember", eye: "blood", aura: "", pet: "" },
  inventory: { wood: 6, stone: 5, fish: 2, cooked_fish: 3, driftshard: 9, hide: 6 },
  // high skills → fast gather timing so each beat is punchy ({xp,level} per SkillKey)
  skills: {
    woodcutting: { xp: 0, level: 12 }, mining: { xp: 0, level: 12 },
    fishing: { xp: 0, level: 12 }, combat: { xp: 0, level: 14 },
  },
  kills: 28,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);

const pageOpen = Date.now();
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.getByText("Step into the Drift").click({ timeout: 90_000 });
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });

const t0 = Date.now();
console.log(`OFFSET ${((t0 - pageOpen) / 1000).toFixed(1)}`); // page-open → demo-ready
const mark = (l) => console.log(`MARK ${((Date.now() - t0) / 1000).toFixed(1)} ${l}`);
const ev = (fn) => page.evaluate(fn);
const demo = {
  toScreen: (x, y) => page.evaluate(([gx, gy]) => window.__demo.toScreen(gx, gy), [x, y]),
  player: () => ev(() => window.__demo.player()),
  nodes: () => ev(() => window.__demo.nodes()),
  mobs: () => ev(() => window.__demo.mobs()),
  gold: () => ev(() => window.__demo.gold()),
  enter: (k) => ev((kk) => window.__demo.enter(kk), k),
  exit: () => ev(() => window.__demo.exit()),
  spin: () => ev(() => window.__demo.spin()),
  mine: () => ev(() => window.__demo.mine()),
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (list, p) => [...list].sort((a, b) => dist(a, p) - dist(b, p))[0];
const clickCell = async (x, y) => {
  const s = await demo.toScreen(x, y);
  if (s.x < 20 || s.y < 60 || s.x > 1900 || s.y > 1020) return false;
  await page.mouse.click(s.x, s.y);
  return true;
};
const waitArrive = async (x, y, ms = 5000) => {
  const end = Date.now() + ms;
  for (;;) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= 1) return true;
    if (Date.now() > end) return false;
    await page.waitForTimeout(260);
  }
};
const walkTo = async (tx, ty, hops = 10) => {
  for (let i = 0; i < hops; i++) {
    const p = await demo.player();
    if (Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty)) <= 1) return true;
    const nx = Math.round(p.x + Math.max(-4, Math.min(4, tx - p.x)));
    const ny = Math.round(p.y + Math.max(-4, Math.min(4, ty - p.y)));
    if (await clickCell(nx, ny)) await waitArrive(nx, ny, 4500);
    else await page.waitForTimeout(400);
  }
  return false;
};

// settle + a close, punchy zoom
await page.waitForTimeout(2600);
await page.mouse.move(960, 540);
for (let i = 0; i < 7; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(110); }
await page.waitForTimeout(600);

// ---- 1) CHOP A TREE ----
{
  const p = await demo.player();
  const tree = nearest((await demo.nodes()).filter((n) => n.kind === "tree"), p);
  if (tree) {
    await walkTo(tree.x, tree.y - 2, 7);
    mark("chop");
    await clickCell(tree.x, tree.y);
    await page.waitForTimeout(5200); // a few swings + wood floaters
  } else console.log("WARN no tree node");
}

// ---- 2) FISH ----
{
  const p = await demo.player();
  const fish = nearest((await demo.nodes()).filter((n) => n.kind === "fish"), p);
  if (fish) {
    await walkTo(fish.x, fish.y - 1, 10);
    mark("fish");
    await clickCell(fish.x, fish.y);
    await page.waitForTimeout(5200);
  } else console.log("WARN no fish node");
}

// ---- 3) MINE GOLD (the Mine interior) ----
{
  await demo.enter("mine");
  await page.waitForTimeout(1400);
  const before = await demo.gold();
  mark("mine");
  await demo.mine();              // walk to a vein + start swinging (real gold)
  await page.waitForTimeout(6000); // several strikes + gold floaters
  const mined = (await demo.gold()) > before;
  if (!mined) console.log("WARN mining produced no gold delta");
  await demo.exit();
  await page.waitForTimeout(900);
}

// ---- 4) KILL A BEAST ----
{
  let killed = false;
  for (let tries = 0; tries < 22 && !killed; tries++) {
    const mobs = await demo.mobs();
    if (mobs.length === 0) { await page.waitForTimeout(600); continue; }
    const p = await demo.player();
    const m = nearest(mobs, p);
    if (dist(m, p) > 4) { await walkTo(m.x, m.y, 3); continue; }
    if (tries === 0 || !killed) mark("kill");
    const before = mobs.length;
    await clickCell(m.x, m.y);
    await page.waitForTimeout(2000);
    if ((await demo.mobs()).length < before) { killed = true; await page.waitForTimeout(1600); }
  }
  if (!killed) console.log("WARN no kill");
}

// ---- 5) SPIN THE WHEEL ----
{
  await demo.enter("wheel");
  await page.waitForTimeout(1400);
  mark("spin");
  await demo.spin();
  await page.waitForTimeout(5200); // 3.2s wheel anim + the result card
  await demo.exit();
}
mark("end");

await page.waitForTimeout(400);
const video = page.video();
await ctx.close();
const dest = `${OUT_DIR}activities.webm`;
renameSync(await video.path(), dest);
console.log(`SAVED ${dest}`);
await browser.close();
