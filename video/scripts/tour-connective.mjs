// Connective-tissue visual tour: drives the REAL game (offline) via the ?demo
// bridge, teleports to every new feature, and screenshots it. No server needed.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = "http://localhost:3000/play?demo=1";
const OUT = "/tmp/conn-shots";
mkdirSync(OUT, { recursive: true });

const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today, gold: 9999, driftSeason: 2, quests: [], tutorialDone: true,
  ownsMount: true,
  cosmetics: { name: "Tester", avatar: "", dye: "gold", eye: "drift", aura: "", pet: "" },
  skills: { woodcutting: { xp: 9000, level: 18 }, mining: { xp: 9000, level: 18 }, fishing: { xp: 6000, level: 14 }, combat: { xp: 40000, level: 24 } },
  inventory: { wood: 10, stone: 10, fish: 5 }, kills: 10,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);

await page.goto(URL, { waitUntil: "domcontentloaded" });
// the door: Realm lane → gate check fails (no server on 2567) → offline → name
await page.getByRole("button", { name: "Enter the Realm" }).click({ timeout: 90_000 });
await page.getByRole("button", { name: "Wander offline" }).click({ timeout: 30_000 });
const nameInput = page.locator("input.drift-well");
try { await nameInput.fill("Tester", { timeout: 6_000 }); } catch { /* welcome-back: no input */ }
await page.getByText("Step into the Drift").click({ timeout: 30_000 });
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });
await page.waitForTimeout(2500);

const demo = {
  tp: (x, y) => page.evaluate(([x, y]) => window.__demo.tp(x, y), [x, y]),
  mount: (on) => page.evaluate((on) => window.__demo.mount(on), on),
  mounted: () => page.evaluate(() => window.__demo.mounted()),
  online: () => page.evaluate(() => window.__demo.online()),
  player: () => page.evaluate(() => window.__demo.player()),
  toScreen: (x, y) => page.evaluate(([x, y]) => window.__demo.toScreen(x, y), [x, y]),
};
console.log("online?", await demo.online(), "(want false)");

// zoom in for decor detail
await page.mouse.move(800, 520);
for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -260); await page.waitForTimeout(80); }
await page.waitForTimeout(400);

const shot = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("shot", name); };

// stand 2-3 tiles SE of a feature so the player doesn't occlude it
const visit = async (name, x, y, mountOn = false) => {
  await demo.mount(mountOn);
  await demo.tp(x + 2, y + 3);
  await shot(name);
};

// roads radiate from the Waystation hub (40,46); trunk + spokes
await visit("01-roads-hub", 40, 46);
await visit("02-stable", 45, 50);
// rest stops
await visit("03-rest-palewater", 53, 28);
await visit("04-rest-ashfall", 25, 28);
await visit("05-rest-mirewatch", 30, 53);
await visit("06-rest-bonefield", 55, 53);
// resource camps
await visit("07-camp-logging", 28, 22);
await visit("08-camp-quarry", 50, 40);
await visit("09-camp-fishing", 53, 22);
// landmarks (ruins)
await visit("10-waystone", 45, 21);
await visit("11-broken-arch", 24, 37);
await visit("12-drift-monolith", 37, 50);
await visit("13-fallen-statue", 50, 37);
await visit("14-battlefield", 19, 46);

// steed: mount near the hub road and walk a few directions to catch facings
await demo.tp(40, 44);
await demo.mount(true);
await page.waitForTimeout(400);
console.log("mounted?", await demo.mounted(), "(want true)");
await shot("15-steed-idle");
// walk SE then NE to catch two facings while mounted (real clicks)
const click = async (gx, gy) => { const s = await demo.toScreen(gx, gy); await page.mouse.click(s.x, s.y); };
await click(44, 48); await page.waitForTimeout(450); await shot("16-steed-walk-se");
await demo.tp(40, 44); await page.waitForTimeout(150); await click(44, 40); await page.waitForTimeout(450); await shot("17-steed-walk-ne");
await demo.tp(40, 44); await page.waitForTimeout(150); await click(36, 40); await page.waitForTimeout(450); await shot("18-steed-walk-nw");
// dismount, confirm flag clears
await demo.mount(false); await page.waitForTimeout(300);
console.log("after dismount mounted?", await demo.mounted(), "(want false)");
await shot("19-dismounted");

await browser.close();
console.log("DONE -> " + OUT);
