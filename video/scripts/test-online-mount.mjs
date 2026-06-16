// ONLINE integration: buy a steed at the Stable keeper against a real server,
// ride it, confirm ownership + mounted sync + the steed renders.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = "/tmp/conn-shots"; mkdirSync(OUT, { recursive: true });
const today = Math.floor(Date.now() / 86_400_000);
// ownsMount FALSE — we BUY it through the keeper this run
const save = { day: today, gold: 9999, driftSeason: 2, quests: [], tutorialDone: true,
  cosmetics: { name: "Rider", avatar: "", dye: "gold", eye: "ember", aura: "", pet: "" },
  skills: { woodcutting: { xp: 9000, level: 18 }, mining: { xp: 9000, level: 18 }, fishing: { xp: 6000, level: 14 }, combat: { xp: 40000, level: 24 } },
  inventory: { wood: 10, stone: 10, fish: 5 }, kills: 10 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);
await page.goto("http://localhost:3000/play?demo=1&hud=1", { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "Enter the Realm" }).click({ timeout: 90_000 });
// server is up + gate 0 → straight to naming (no offline, no wallet)
try { await page.locator("input.drift-well").fill("Rider", { timeout: 8_000 }); } catch {}
await page.getByText("Step into the Drift").click({ timeout: 30_000 });
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });
await page.waitForTimeout(4000); // connect + profile + first-save seeds the ledger

const ev = (fn) => page.evaluate(fn);
console.log("online?", await ev(() => window.__demo.online()), "(want true)");
console.log("gold(before):", await ev(() => window.__demo.gold()));
console.log("ownsMount(before):", await ev(() => window.__demo.ownsMount()), "(want false)");

// WALK to the Stable (45,50) and click it like a real player → keeper opens
const toScreenC = (x, y) => page.evaluate(([x, y]) => window.__demo.toScreen(x, y), [x, y]);
const playerC = () => page.evaluate(() => window.__demo.player());
const clickCell = async (x, y) => { const s = await toScreenC(x, y); await page.mouse.click(s.x, s.y); };
const waitArrive = async (x, y, ms = 5000) => { const end = Date.now() + ms; for (;;) { const p = await playerC(); if (Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= 1) return true; if (Date.now() > end) return false; await page.waitForTimeout(280); } };
for (let i = 0; i < 14; i++) { const p = await playerC(); if (Math.max(Math.abs(p.x - 45), Math.abs(p.y - 50)) <= 2) break; const nx = Math.round(p.x + Math.max(-4, Math.min(4, 45 - p.x))); const ny = Math.round(p.y + Math.max(-4, Math.min(4, 50 - p.y))); await clickCell(nx, ny); await waitArrive(nx, ny, 4500); }
console.log("at", await playerC(), "(near stable 45,50)");
await clickCell(45, 50); // click the Stable → walk to door + open keeper
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/on-01-keeper.png` });
// click "Buy a steed"
await page.getByText(/Buy a steed/).click({ timeout: 8_000 });
await page.waitForTimeout(1500); // server buyMount → mountResult + goldSync
console.log("gold(after buy):", await ev(() => window.__demo.gold()), "(want 6999)");
console.log("ownsMount(after buy):", await ev(() => window.__demo.ownsMount()), "(want true)");
await page.screenshot({ path: `${OUT}/on-02-after-buy.png` });

// the dialogue now offers "Saddle up" — click it (closes dialogue + mounts)
try { await page.getByText(/Saddle up/).click({ timeout: 6_000 }); } catch (e) { console.log("no saddle-up btn:", e.message); }
await page.waitForTimeout(1200);
console.log("mounted(after saddle):", await ev(() => window.__demo.mounted()), "(want true)");
// confirm the SERVER schema agrees (the synced self.mounted drives this)
await ev(() => window.__demo.zoom(2.6));
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/on-03-mounted-online.png` });

// ride: click a few cells, time the travel to confirm the speed bonus is live
const toScreen = (x, y) => page.evaluate(([x, y]) => window.__demo.toScreen(x, y), [x, y]);
const player = () => page.evaluate(() => window.__demo.player());
const p0 = await player();
const tgt = { x: p0.x, y: p0.y - 8 };
const s = await toScreen(tgt.x, tgt.y);
const t0 = Date.now();
await page.mouse.click(s.x, s.y);
let arrived = false;
for (let i = 0; i < 20; i++) { await page.waitForTimeout(250); const p = await player(); if (Math.abs(p.y - tgt.y) <= 1 && Math.abs(p.x - tgt.x) <= 1) { arrived = true; break; } }
console.log(`mounted travel 8 tiles: ${arrived ? ((Date.now() - t0) / 1000).toFixed(2) + "s" : "did-not-arrive"}`);
await page.screenshot({ path: `${OUT}/on-04-riding.png` });

await browser.close();
console.log("DONE");
