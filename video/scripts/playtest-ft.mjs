// Clean ONLINE DOM round-trip: walk to the wayHub (no tp — tp is offline-only when
// the server is authoritative), open the real WaystationPanel, do a gold fast-travel.
// Also drives the Forge enchant dock (no movement). Proves the HUD->bus->net->server
// path in the actual running app.
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
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
const page = await ctx.newPage();
await page.addInitScript((s) => localStorage.setItem("driftlands-save-v1", JSON.stringify(s)), save);
await page.goto("http://localhost:3000/play?demo=1&hud=1", { waitUntil: "domcontentloaded" });
const tc = async (n, ms = 30000) => { try { await page.getByText(n, { exact: false }).first().click({ timeout: ms }); return true; } catch { return false; } };
await tc("Enter the Realm");
try { await page.locator("input.drift-well").first().fill("Vey", { timeout: 6000 }); } catch {}
await tc("Step into the Drift");
await page.waitForFunction(() => "__demo" in window, null, { timeout: 45000 });
await page.waitForTimeout(5000); // connect + first profile + gold seed
const player = () => page.evaluate(() => window.__demo.player());
const screen = (x, y) => page.evaluate(([a, b]) => window.__demo.toScreen(a, b), [x, y]);
const body = () => page.evaluate(() => document.body.innerText);

console.log("online:", !(await body()).includes("Wandering offline"), "| spawn:", JSON.stringify(await player()));

// ---- FORGE enchant (HUD dock, no movement) ----
try {
  await tc("Forge", 5000); await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}ft-forge.png` });
  const hasReinforce = (await body()).includes("rune-anvil");
  // the weapon's enchant button shows the cost (100g at ench 0)
  let enchanted = false;
  try {
    await page.getByRole("button", { name: "100g" }).first().click({ timeout: 3000 });
    await page.waitForTimeout(800);
    enchanted = /reinforce your/i.test(await body());
  } catch {}
  console.log(`[forge] reinforce section present=${hasReinforce}, enchant fired=${enchanted}`);
  await page.keyboard.press("Escape");
} catch (e) { console.log("[forge] ERR", e.message); }

// ---- FAST-TRAVEL: walk to the wayHub (40,46) then jump for gold ----
try {
  const hub = { x: 40, y: 46 };
  // click the hub repeatedly to walk + open (pendingShop walks then opens on arrival)
  let opened = false;
  for (let i = 0; i < 10 && !opened; i++) {
    const s = await screen(hub.x, hub.y);
    await page.mouse.click(s.x, s.y);
    await page.waitForTimeout(1500);
    opened = (await body()).includes("Drift Roads");
  }
  await page.screenshot({ path: `${OUT}ft-waystation.png` });
  const before = await player();
  let jumped = 0, jumpLog = false;
  if (opened) {
    // the first 60g button is the wayHub itself (jump-to-self is refused) —
    // click a DIFFERENT waygate's button
    await page.getByRole("button", { name: "60g" }).nth(1).click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const after = await player();
    jumped = Math.hypot(after.x - before.x, after.y - before.y);
    jumpLog = /Drift Roads carry you/i.test(await body());
  }
  await page.screenshot({ path: `${OUT}ft-after.png` });
  console.log(`[fast-travel] panel opened=${opened}, jumped ${jumped.toFixed(1)} tiles, log=${jumpLog}`);
} catch (e) { console.log("[fast-travel] ERR", e.message); }

await browser.close();
console.log("DONE");
