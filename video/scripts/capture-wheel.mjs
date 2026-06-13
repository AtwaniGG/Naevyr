// Captures a COMPLETE Wheel of the Drift spin (the overlay's 3.2s ease-out +
// landing) for the social clip — ends well after it lands, never mid-spin.
//   node scripts/capture-wheel.mjs   (prereqs: dev :3000 + server :2567)
import { chromium } from "playwright";
import { mkdirSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL = "http://localhost:3000/play?demo=1";
const OUT_DIR = fileURLToPath(new globalThis.URL("../public/gameplay/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today, gold: 5000, driftSeason: 3, quests: [], tutorialDone: true,
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
const toScreen = (x, y) => page.evaluate(([gx, gy]) => window.__demo.toScreen(gx, gy), [x, y]);
const player = () => page.evaluate(() => window.__demo.player());
const clickCell = async (x, y) => {
  const s = await toScreen(x, y);
  if (s.x < 20 || s.y < 60 || s.x > 1900 || s.y > 1020) return false;
  await page.mouse.click(s.x, s.y);
  return true;
};
const walkTo = async (tx, ty, hops = 8) => {
  for (let i = 0; i < hops; i++) {
    const p = await player();
    if (Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty)) <= 1) return;
    const nx = Math.round(p.x + Math.max(-4, Math.min(4, tx - p.x)));
    const ny = Math.round(p.y + Math.max(-4, Math.min(4, ty - p.y)));
    if (await clickCell(nx, ny)) {
      const end = Date.now() + 4000;
      for (;;) { const q = await player(); if (Math.max(Math.abs(q.x - nx), Math.abs(q.y - ny)) <= 1 || Date.now() > end) break; await page.waitForTimeout(260); }
    } else await page.waitForTimeout(500);
  }
};

await page.waitForTimeout(2800);
mark("zoom");
await page.mouse.move(960, 540);
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(120); }
await page.waitForTimeout(700);

// approach the Wheel of the Drift (13,29) for an establishing shot of the tent
mark("approach");
await walkTo(15, 27, 9);
await page.waitForTimeout(1200);

// the gold LEDGER seeds from the client's first 8s snapshot push; make sure
// we're past it before the spin (debits 50g) or the server rejects it
await page.waitForTimeout(4000);

// step INSIDE the Wheel of the Drift — the spin happens at the keeper's wheel,
// not out in the open
mark("enter");
await page.evaluate(() => window.__demo.enter("wheel"));
await page.waitForTimeout(2200); // the room + keeper settle on screen

// spin → the WheelOverlay turns over the interior backdrop, lands, holds
mark("spin");
await page.evaluate(() => window.__demo.spin());
await page.waitForTimeout(6500); // 3.2s spin + landing + a beat so we never cut mid-spin
mark("spin-done");
await page.waitForTimeout(800);
mark("end");

await page.waitForTimeout(400);
const video = page.video();
await ctx.close();
const dest = `${OUT_DIR}wheel.webm`;
renameSync(await video.path(), dest);
console.log(`SAVED ${dest}`);
await browser.close();
