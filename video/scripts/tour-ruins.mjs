import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = "/tmp/conn-shots"; mkdirSync(OUT, { recursive: true });
const today = Math.floor(Date.now() / 86_400_000);
const save = { day: today, gold: 9999, driftSeason: 2, quests: [], tutorialDone: true, ownsMount: true,
  cosmetics: { name: "Tester", avatar: "", dye: "gold", eye: "drift", aura: "", pet: "" },
  skills: { woodcutting: { xp: 9000, level: 18 }, mining: { xp: 9000, level: 18 }, fishing: { xp: 6000, level: 14 }, combat: { xp: 40000, level: 24 } },
  inventory: { wood: 10, stone: 10, fish: 5 }, kills: 10 };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);
await page.goto("http://localhost:3000/play?demo=1", { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "Enter the Realm" }).click({ timeout: 90_000 });
await page.getByRole("button", { name: "Wander offline" }).click({ timeout: 30_000 });
try { await page.locator("input.drift-well").fill("Tester", { timeout: 6_000 }); } catch {}
await page.getByText("Step into the Drift").click({ timeout: 30_000 });
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });
await page.waitForTimeout(2500);
const tp = (x, y) => page.evaluate(([x, y]) => window.__demo.tp(x, y), [x, y]);
const zoom = (z) => page.evaluate((z) => window.__demo.zoom(z), z);
const shot = async (n) => { await page.waitForTimeout(550); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log("shot", n); };
await zoom(2.4);
const places = [
  ["z-waystone", 45, 21], ["z-broken-arch", 24, 37], ["z-monolith", 37, 50],
  ["z-statue", 50, 37], ["z-battlefield", 19, 46],
  ["z-camp-logging", 28, 22], ["z-camp-quarry", 50, 40], ["z-camp-fishing", 53, 22],
  ["z-rest-palewater", 53, 28], ["z-rest-mirewatch", 30, 53],
];
for (const [n, x, y] of places) { await tp(x + 2, y + 4); await shot(n); }
await browser.close();
console.log("DONE");
