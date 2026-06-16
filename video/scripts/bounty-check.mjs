// Visual check for the frontier bounty board (cluster A): enters offline, ports
// to a waystation, screenshots the board art, then clicks it to open the panel.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = "http://localhost:3000/play?demo=1&hud=1";
const OUT = "/tmp/bounty-shots/";
mkdirSync(OUT, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today, gold: 1200, tutorialDone: true, quests: [],
  cosmetics: { name: "Vey", dye: "void", eye: "ember" },
  skills: { woodcutting: { xp: 9000, level: 18 }, mining: { xp: 9000, level: 18 }, fishing: { xp: 6000, level: 14 }, combat: { xp: 40000, level: 24 } },
  inventory: { wood: 10, stone: 8, fish: 4, cooked_fish: 2, driftshard: 5, hide: 3 }, kills: 20,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);

await page.goto(URL, { waitUntil: "domcontentloaded" });
const tryClick = async (name, ms = 8000) => { try { await page.getByText(name, { exact: false }).first().click({ timeout: ms }); return true; } catch { return false; } };
await tryClick("Enter the Realm", 30000) || await tryClick("Wander offline", 30000);
await tryClick("Wander offline", 4000);
try { await page.locator("input.drift-well").first().fill("Vey", { timeout: 6000 }); } catch { /* saved-name */ }
await tryClick("Step into the Drift", 30000);
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45000 });
await page.waitForTimeout(2500);

// Palewater Rest on the 80×80 map ≈ (53, 28)
const BX = 53, BY = 28;
await page.evaluate(([x, y]) => window.__demo.tp(x + 2, y + 1), [BX, BY]); // stand just off the board
await page.waitForTimeout(800);
await page.mouse.move(800, 520);
for (let i = 0; i < 7; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(90); }
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}01-board-in-world.png` });
console.log("shot 1: board in world");

// click the board cell (rest-stop center) to open the panel
const s = await page.evaluate(([x, y]) => window.__demo.toScreen(x, y), [BX, BY]);
console.log("board screen:", JSON.stringify(s));
await page.mouse.click(s.x, s.y);
await page.waitForTimeout(1600);
// it may need to walk; click again once arrived
await page.mouse.click(s.x, s.y);
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}02-panel-open.png` });
const hasPanel = await page.evaluate(() => document.body.innerText.includes("Bounty Board"));
console.log("panel text 'Bounty Board' present:", hasPanel);
const bodyHas = await page.evaluate(() => ["Cull", "Harvest", "Quarry", "Land", "Hunt"].filter((t) => document.body.innerText.includes(t)));
console.log("offered verbs visible:", JSON.stringify(bodyHas));

await browser.close();
console.log("DONE — shots in", OUT);
