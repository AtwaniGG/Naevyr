// Proof + location check for the new interactive content: enters offline, ports
// to each new POI and screenshots it.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = "http://localhost:3000/play?demo=1&hud=1";
const OUT = "/tmp/new-content/";
mkdirSync(OUT, { recursive: true });
const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today, gold: 1500, tutorialDone: true, quests: [],
  cosmetics: { name: "Vey", dye: "void", eye: "ember" },
  skills: { woodcutting: { xp: 9000, level: 18 }, mining: { xp: 9000, level: 18 }, fishing: { xp: 6000, level: 14 }, combat: { xp: 40000, level: 24 } },
  inventory: { wood: 20, stone: 16, fish: 8, cooked_fish: 4, driftshard: 9, hide: 6 }, kills: 30,
  equipment: { weapon: { id: "bone_blade", label: "Bone Blade", slot: "weapon", icon: "🗡️", tier: 1, power: 3, flavor: "+3 damage" } },
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);
await page.goto(URL, { waitUntil: "domcontentloaded" });
const tryClick = async (n, ms = 8000) => { try { await page.getByText(n, { exact: false }).first().click({ timeout: ms }); return true; } catch { return false; } };
await tryClick("Enter the Realm", 30000) || await tryClick("Wander offline", 30000);
await tryClick("Wander offline", 4000);
try { await page.locator("input.drift-well").first().fill("Vey", { timeout: 6000 }); } catch {}
await tryClick("Step into the Drift", 30000);
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45000 });
await page.waitForTimeout(2500);

const shot = async (gx, gy, name, zoomIn = 8) => {
  await page.evaluate(([x, y]) => window.__demo.tp(x, y), [gx, gy]);
  await page.waitForTimeout(700);
  await page.mouse.move(750, 480);
  for (let i = 0; i < zoomIn; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(70); }
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}${name}.png` });
  for (let i = 0; i < zoomIn; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(40); } // reset zoom
  console.log("shot:", name, "@", gx, gy);
};

// quarry camp (camp_anvil station) ~ (50,40); fishing camp (cookfire) ~ (53,22)
await shot(50, 40, "camp-quarry-anvil");
await shot(53, 22, "camp-fishing-cookfire");
// a salvageable wreck (wagon_wreck) ~ (24,30) — drift-gold glint marks it
await shot(24, 30, "wreck-salvage-glint");
// the Frontier Outpost (60,60) — supply_post + quartermaster_stall decor
await shot(60, 60, "outpost-garrison");

await browser.close();
console.log("DONE — shots in", OUT);
