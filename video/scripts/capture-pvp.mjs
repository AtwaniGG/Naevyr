// Records a PvP Pit duel for social: two wanderers meet in the ring, wager gold,
// trade blows (server-rolled), one walks out with the pot. Records BOTH fighters
// and keeps the WINNER's footage (the "one comes out with everything" shot).
//   node scripts/capture-pvp.mjs   (prereqs: dev :3000 + server :2567)
import { chromium } from "playwright";
import { mkdirSync, renameSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const URL = "http://localhost:3000/play?demo=1";
const OUT = fileURLToPath(new globalThis.URL("../public/gameplay/", import.meta.url));
const DA = `${OUT}pvpA/`, DB = `${OUT}pvpB/`;
mkdirSync(DA, { recursive: true }); mkdirSync(DB, { recursive: true });
const today = Math.floor(Date.now() / 86_400_000);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const WAGER = 250;

const save = (name, dye, eye) => ({
  day: today, gold: 1000, driftSeason: 3, quests: [], tutorialDone: true,
  cosmetics: { name, dye, eye, aura: "", pet: "" },
  inventory: { wood: 4, stone: 4, fish: 2, cooked_fish: 2, driftshard: 6, hide: 5 }, kills: 20,
});

const browser = await chromium.launch();
async function makePlayer(dir, s) {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
    recordVideo: { dir, size: { width: 1920, height: 1080 } },
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.addInitScript((v) => localStorage.setItem("driftlands-save-v1", JSON.stringify(v)), s);
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.getByText("Step into the Drift").click({ timeout: 90_000 });
  await page.waitForFunction(() => "__demo" in window, null, { timeout: 45_000 });
  return { ctx, page };
}
const player = (p) => p.evaluate(() => window.__demo.player());
const toScreen = (p, x, y) => p.evaluate(([gx, gy]) => window.__demo.toScreen(gx, gy), [x, y]);
async function clickCell(p, x, y) {
  const sc = await toScreen(p, x, y);
  if (sc.x < 20 || sc.y < 60 || sc.x > 1900 || sc.y > 1020) return false;
  await p.mouse.click(sc.x, sc.y); return true;
}
async function walkTo(p, tx, ty, hops = 12) {
  for (let i = 0; i < hops; i++) {
    const q = await player(p);
    if (Math.max(Math.abs(q.x - tx), Math.abs(q.y - ty)) <= 1) return;
    const nx = Math.round(q.x + Math.max(-4, Math.min(4, tx - q.x)));
    const ny = Math.round(q.y + Math.max(-4, Math.min(4, ty - q.y)));
    if (await clickCell(p, nx, ny)) {
      const end = Date.now() + 4500;
      for (;;) { const r = await player(p); if (Math.max(Math.abs(r.x - nx), Math.abs(r.y - ny)) <= 1 || Date.now() > end) break; await wait(260); }
    } else await wait(500);
  }
}

const A = await makePlayer(DA, save("Kahl", "ember", "blood"));
const B = await makePlayer(DB, save("Vey", "void", "ember"));
await wait(2800);
// WIDE zoom for reliable navigation (the Pit stays on-screen from spawn)
const zoomIn = async (page, ticks) => { await page.mouse.move(960, 540); for (let i = 0; i < ticks; i++) { await page.mouse.wheel(0, -240); await wait(110); } };
for (const { page } of [A, B]) await zoomIn(page, 4);

// walk both to the Pit ring (20,32 & 21,32) — SEQUENTIALLY so neither stalls;
// this is the on-camera approach and runs >8s so the gold ledger is seeded
const t0 = Date.now();
console.log("walking to the Pit…");
await walkTo(A.page, 20, 32, 14);
await walkTo(B.page, 21, 32, 14);
const pA = await player(A.page), pB = await player(B.page);
console.log(`ATPIT Kahl@${pA.x},${pA.y} Vey@${pB.x},${pB.y}`);
// now zoom IN to frame the ring for the duel
for (const { page } of [A, B]) await zoomIn(page, 4);
while (Date.now() - t0 < 9000) await wait(500); // ledger seed safety
await wait(600);

// A challenges the wanderer named Vey; B accepts
console.log("challenge…");
{
  const pa = await player(A.page), pb = await player(B.page);
  const oa = await A.page.evaluate(() => window.__demo.others().map((o) => `${o.name}@${o.x},${o.y}`));
  const ob = await B.page.evaluate(() => window.__demo.others().map((o) => `${o.name}@${o.x},${o.y}`));
  console.log(`DEBUG A@${pa.x},${pa.y} sees [${oa}] | B@${pb.x},${pb.y} sees [${ob}]`);
}
const targetId = await A.page.evaluate(() => {
  const v = window.__demo.others().find((o) => o.name === "Vey") ?? window.__demo.others()[0];
  return v ? v.id : null;
});
if (!targetId) { console.log("FAIL: A can't see B"); }
await A.page.evaluate(([id, w]) => window.__demo.challenge(id, w), [targetId, WAGER]);
await wait(1200);
await B.page.evaluate(() => window.__demo.acceptDuel());
await wait(1800); // duelStart + the arena veil

// drive BOTH onto adjacent ring cells, then STOP clicking — re-issuing walk
// intents every tick kept interrupting the engine's stand-and-swing auto-attack
// (so both fighters looked AFK). Once each is in place, leave them be: the
// auto-swing (dist<=1.6) then animates BOTH (attack poses + damage floaters).
console.log("into the ring…");
const AT = { ax: 20, ay: 32, bx: 21, by: 32 };
for (let i = 0; i < 30; i++) {
  const pa = await player(A.page), pb = await player(B.page);
  // only nudge a fighter that hasn't reached its cell yet
  if (Math.max(Math.abs(pa.x - AT.ax), Math.abs(pa.y - AT.ay)) > 0) await clickCell(A.page, AT.ax, AT.ay);
  if (Math.max(Math.abs(pb.x - AT.bx), Math.abs(pb.y - AT.by)) > 0) await clickCell(B.page, AT.bx, AT.by);
  const live = await A.page.evaluate(() => !!window.__demo.duel());
  if (!live) { console.log(`resolved after ${i} ticks`); break; }
  await wait(700);
}
await wait(2800); // hold the VICTORY plate

const goldA = await A.page.evaluate(() => window.__demo.gold());
const goldB = await B.page.evaluate(() => window.__demo.gold());
const kahlWon = goldA > goldB;
console.log(`gold: Kahl=${goldA} Vey=${goldB} → KAHL ${kahlWon ? "WON" : "LOST"}`);

// always record KAHL (the fighter who walks to the Pit cleanly); we want a
// VICTORY from this POV, so re-run if Kahl lost
const winVid = A.page.video();
await A.ctx.close(); await B.ctx.close();
renameSync(await winVid.path(), `${OUT}pvp.webm`);
try { rmSync(DA, { recursive: true, force: true }); rmSync(DB, { recursive: true, force: true }); } catch { /* */ }
void existsSync;
console.log(`SAVED ${OUT}pvp.webm (winner: ${winner === "A" ? "Kahl" : "Vey"})`);
await browser.close();
