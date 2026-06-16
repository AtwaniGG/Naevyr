import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
mkdirSync("/tmp/docs/", { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await ctx.newPage();
// roadmap
await page.goto("http://localhost:3000/roadmap", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/docs/roadmap.png" });
// docs: contents sidebar + jump to the frontier chapter
await page.goto("http://localhost:3000/docs", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/docs/docs-top.png" });
const hasFrontier = await page.evaluate(() => document.body.innerText.includes("The Frontier") && document.body.innerText.includes("Streaks & Boards"));
const hasBounty = await page.evaluate(() => document.body.innerText.includes("Bounty boards") && document.body.innerText.includes("Swift Steed"));
console.log("docs has new sections:", hasFrontier, "| frontier body content:", hasBounty);
try { await page.locator("#frontier").scrollIntoViewIfNeeded({ timeout: 4000 }); await page.waitForTimeout(500); await page.screenshot({ path: "/tmp/docs/docs-frontier.png" }); } catch(e){ console.log("scroll:", e.message); }
await b.close(); console.log("done");
