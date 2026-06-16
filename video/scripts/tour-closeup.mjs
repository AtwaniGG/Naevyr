// Focused close-ups: the steed (all 5 facings) + a road junction, high zoom.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = "/tmp/conn-shots"; mkdirSync(OUT, { recursive: true });
const today = Math.floor(Date.now() / 86_400_000);
const save = { day: today, gold: 9999, driftSeason: 2, quests: [], tutorialDone: true, ownsMount: true,
  cosmetics: { name: "Tester", avatar: "", dye: "gold", eye: "drift", aura: "", pet: "" },
  skills: { woodcutting: { xp: 9000, level: 18 }, mining: { xp: 9000, level: 18 }, fishing: { xp: 6000, level: 14 }, combat: { xp: 40000, level: 24 } }, inventory: { wood: 10, stone: 10, fish: 5 }, kills: 10 };

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

const ev = (fn, ...a) => page.evaluate(fn, a);
const tp = (x, y) => page.evaluate(([x, y]) => window.__demo.tp(x, y), [x, y]);
const zoom = (z) => page.evaluate((z) => window.__demo.zoom(z), z);
const mount = (on) => page.evaluate((on) => window.__demo.mount(on), on);
const face = (dx, dy) => page.evaluate(([dx, dy]) => window.__demo.face(dx, dy), [dx, dy]);
const shot = async (n) => { await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log("shot", n); };

await zoom(3.2);
// an open patch away from buildings (NE grass), mount, face each direction
await tp(50, 30); await mount(true); await page.waitForTimeout(400);
const FACES = [["s", 0, 1], ["se", 1, 1], ["e", 1, 0], ["ne", 1, -1], ["n", 0, -1], ["sw", -1, 1], ["nw", -1, -1]];
for (const [name, dx, dy] of FACES) { await face(dx, dy); await shot(`cu-steed-${name}`); }
await mount(false); await shot("cu-onfoot");

// a road junction close-up (the hub at 40,46)
await zoom(2.6); await tp(40, 47); await shot("cu-road-hub");
await zoom(3.4); await tp(46, 46); await shot("cu-road-detail");
await browser.close();
console.log("DONE");
