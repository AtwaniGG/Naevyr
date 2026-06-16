import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
mkdirSync("/tmp/new-content/", { recursive: true });
const save = { day: Math.floor(Date.now() / 86400000), gold: 1500, tutorialDone: true, quests: [], cosmetics: { name: "Vey", dye: "void", eye: "ember" }, skills: { woodcutting: { xp: 9000, level: 18 }, mining: { xp: 9000, level: 18 }, fishing: { xp: 6000, level: 14 }, combat: { xp: 40000, level: 24 } }, inventory: { driftshard: 5 }, kills: 30 };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1500, height: 950 } });
const page = await ctx.newPage();
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);
await page.goto("http://localhost:3000/play?demo=1", { waitUntil: "domcontentloaded" });
const tc = async (n, ms = 8000) => { try { await page.getByText(n, { exact: false }).first().click({ timeout: ms }); return true; } catch { return false; } };
await tc("Enter the Realm", 30000) || await tc("Wander offline", 30000); await tc("Wander offline", 4000);
try { await page.locator("input.drift-well").first().fill("Vey", { timeout: 6000 }); } catch {}
await tc("Step into the Drift", 30000);
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45000 });
await page.waitForTimeout(2500);
await page.evaluate(() => window.__demo.tp(8, 66));
await page.waitForTimeout(700);
await page.mouse.move(750, 480);
for (let i = 0; i < 7; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(70); }
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/new-content/sw-sunken-lair.png" });
await b.close();
console.log("shot done");
