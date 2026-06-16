// In-game integration test: drives the REAL online client (server on :2567) through
// the new frontier features, capturing screenshots + activity-log evidence.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = "/tmp/playtest/"; mkdirSync(OUT, { recursive: true });
const today = Math.floor(Date.now() / 86_400_000);
const save = {
  day: today, gold: 20000, tutorialDone: true, quests: [], kills: 40,
  cosmetics: { name: "Vey", dye: "void", eye: "ember" },
  skills: { woodcutting: { xp: 9000, level: 18 }, mining: { xp: 9000, level: 18 }, fishing: { xp: 6000, level: 14 }, combat: { xp: 40000, level: 24 } },
  inventory: { wood: 30, stone: 30, fish: 20, cooked_fish: 10, hide: 20, driftshard: 20 },
  equipment: { weapon: { id: "bone_blade", label: "Bone Blade", slot: "weapon", icon: "🗡️", tier: 1, power: 3, flavor: "+3 damage" } },
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);
await page.goto("http://localhost:3000/play?demo=1&hud=1", { waitUntil: "domcontentloaded" });
const tc = async (n, ms = 30000) => { try { await page.getByText(n, { exact: false }).first().click({ timeout: ms }); return true; } catch { return false; } };
await tc("Enter the Realm");
try { await page.locator("input.drift-well").first().fill("Vey", { timeout: 6000 }); } catch {}
await tc("Step into the Drift");
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45000 });
await page.waitForTimeout(4000); // connect + first profile

const tp = (x, y) => page.evaluate(([a, b]) => window.__demo.tp(a, b), [x, y]);
const screen = (x, y) => page.evaluate(([a, b]) => window.__demo.toScreen(a, b), [x, y]);
const mobs = () => page.evaluate(() => window.__demo.mobs());
const body = () => page.evaluate(() => document.body.innerText);
const zoomIn = async (n) => { await page.mouse.move(750, 480); for (let i = 0; i < n; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(70); } };
const zoomOut = async (n) => { for (let i = 0; i < n; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(50); } };
const clickCell = async (x, y) => { const s = await screen(x, y); await page.mouse.click(s.x, s.y); };
const log = (m) => console.log(m);

let online = false;
try { online = !(await body()).includes("Wandering offline"); } catch {}
log(`[online] connected to shared world: ${online}`);

// 1. SUNKEN LAIR (8,66) + mobs
try {
  await tp(8, 66); await page.waitForTimeout(800); await zoomIn(6); await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}1-sunken-lair.png` });
  const near = (await mobs()).filter((m) => Math.hypot(m.x - 8, m.y - 66) <= 14);
  log(`[lair] mobs within 14 of the lair: ${near.length} — ${near.map((m) => `${m.kind || "?"}L${m.level}`).slice(0, 8).join(",")}`);
  await zoomOut(6);
} catch (e) { log(`[lair] ERR ${e}`); }

// 2. BOUNTY BOARD (Palewater Rest 53,28)
try {
  await tp(53, 28); await page.waitForTimeout(800); await zoomIn(5); await page.waitForTimeout(400);
  await clickCell(53, 28); await page.waitForTimeout(1500);
  const opened = (await body()).includes("Bounty Board");
  await page.screenshot({ path: `${OUT}2-bounty-board.png` });
  await tc("Take", 4000); // take the first offered contract
  await page.waitForTimeout(1200);
  const taken = (await body()).includes("Taken") || (await body()).includes("contracts here");
  log(`[bounty] panel opened=${opened}, contract taken/listed=${taken}`);
  await page.keyboard.press("Escape"); await zoomOut(5);
} catch (e) { log(`[bounty] ERR ${e}`); }

// 3. SALVAGE (wagon_wreck 24,30)
try {
  await tp(24, 30); await page.waitForTimeout(800); await zoomIn(6); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}3-salvage-glint.png` });
  await clickCell(24, 30); await page.waitForTimeout(2200);
  const dug = /pick through the wreck/i.test(await body());
  log(`[salvage] dig log present=${dug}`);
  await zoomOut(6);
} catch (e) { log(`[salvage] ERR ${e}`); }

// 4. CAMP CRAFTING (quarry camp 50,40 → anvil opens Forge)
try {
  await tp(50, 40); await page.waitForTimeout(800); await zoomIn(5); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}4-camp-station.png` });
  await clickCell(50, 40); await page.waitForTimeout(1500);
  const camp = /camp's tools|cook|embers/i.test(await body());
  log(`[camp] station interaction log present=${camp}`);
  await page.keyboard.press("Escape"); await zoomOut(5);
} catch (e) { log(`[camp] ERR ${e}`); }

// 5. FAST-TRAVEL (wayHub 40,46 → gold jump)
try {
  await tp(40, 46); await page.waitForTimeout(800);
  await clickCell(40, 46); await page.waitForTimeout(1500);
  const panel = (await body()).includes("Drift Roads");
  await page.screenshot({ path: `${OUT}5-waystation-panel.png` });
  const before = await page.evaluate(() => window.__demo.player());
  await tc("60g", 4000); // gold jump
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => window.__demo.player());
  const moved = Math.hypot(after.x - before.x, after.y - before.y);
  log(`[fasttravel] panel=${panel}, jumped ${moved.toFixed(1)} tiles, log=${/Drift Roads carry you/i.test(await body())}`);
} catch (e) { log(`[fasttravel] ERR ${e}`); }

// 6. FORGE ENCHANT (HUD dock)
try {
  await tc("Forge", 5000); await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}6-forge.png` });
  const hasReinforce = (await body()).includes("Reinforce");
  await tc("Reinforce", 3000); // header is text; the button shows a cost — click the gold button
  // click the first enchant cost button if present
  await page.waitForTimeout(800);
  const enchanted = /reinforce your/i.test(await body());
  log(`[forge] reinforce section=${hasReinforce}, enchant log=${enchanted}`);
  await page.keyboard.press("Escape");
} catch (e) { log(`[forge] ERR ${e}`); }

// 7. OUTPOST (60,60 → Quartermaster supply contract)
try {
  await tp(60, 60); await page.waitForTimeout(800); await zoomIn(4); await page.waitForTimeout(400);
  await clickCell(60, 60); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}7-outpost.png` });
  const quartermaster = /standing|Supply contracts|Quartermaster/i.test(await body());
  await tc("Supply contracts", 3000); await page.waitForTimeout(800);
  await tc("Deliver", 3000); await page.waitForTimeout(1200);
  const delivered = /Supplies delivered|Logged|standing/i.test(await body());
  log(`[outpost] dialogue=${quartermaster}, deliver attempted log=${delivered}`);
  await page.screenshot({ path: `${OUT}7b-outpost-after.png` });
  await page.keyboard.press("Escape"); await zoomOut(4);
} catch (e) { log(`[outpost] ERR ${e}`); }

log(`[pageerrors] ${errs.length ? errs.slice(0, 5).join(" | ") : "none"}`);
await browser.close();
log("DONE — shots in " + OUT);
