// Deterministic headless render of "Naevyr Mobile Announce.html" -> a clean,
// perfectly-looping 1920x1080 MP4. The DS announce (animations.jsx +
// naevyr_scenes.jsx) is a React timeline where every frame is a pure function
// of `t`; we drive a controllable requestAnimationFrame clock so each captured
// frame lands on an exact timeline second, then encode with ffmpeg.
//
// Usage: node scripts/render-announce.mjs [srcDir] [fps]
//   srcDir defaults to the extracted announce in /tmp/naevyr-announce
//   fps    defaults to 30
import { chromium } from "playwright";
import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = process.argv[2] || "/tmp/naevyr-announce";
const FPS = Number(process.argv[3] || 30);
const DURATION = 6;            // matches the <Stage duration={6}>
const W = 1920, H = 1080;
const FRAMES = Math.round(DURATION * FPS);   // [0, duration) -> seamless loop
const HTML = "Naevyr Mobile Announce.html";

const OUT_DIR = fileURLToPath(new URL("../out/", import.meta.url));
const FRAME_DIR = "/tmp/naevyr-frames";
const MP4 = join(OUT_DIR, "naevyr-mobile-announce.mp4");
const GIF = join(OUT_DIR, "naevyr-mobile-announce.gif");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".jsx": "application/javascript; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

// ── tiny static server over the extracted announce folder ──────────────────
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p === "/") p = "/" + HTML;
    const file = normalize(join(SRC, p));
    if (!file.startsWith(SRC)) { res.writeHead(403).end(); return; }
    const buf = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const URL_ = `http://localhost:${PORT}/${encodeURIComponent(HTML)}?clean`;
console.log(`serving ${SRC} -> ${URL_}`);

await rm(FRAME_DIR, { recursive: true, force: true });
await mkdir(FRAME_DIR, { recursive: true });
await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

// Install a controllable rAF clock + clear any persisted playhead BEFORE any
// page script runs. Only the Stage uses window.requestAnimationFrame (React 18
// schedules via MessageChannel), so this fully owns the animation clock.
await page.addInitScript(() => {
  try { localStorage.removeItem("naevyr-announce:t"); } catch {}
  let q = [];
  let id = 1;
  window.requestAnimationFrame = (cb) => { const i = id++; q.push({ i, cb }); return i; };
  window.cancelAnimationFrame = (i) => { q = q.filter((x) => x.i !== i); };
  window.__flushRaf = (ts) => { const cur = q; q = []; cur.forEach((x) => x.cb(ts)); };
});

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(URL_, { waitUntil: "load" });

// Wait for Babel to compile + the scene to mount.
await page.waitForFunction(() => !!window.NaevyrAnnounce && !!document.getElementById("anim-root"), { timeout: 30000 });

// Force the 1920x1080 canvas to sit unscaled at the viewport origin (the Stage
// otherwise auto-scales to fit and reserves space for the now-hidden scrubber).
await page.addStyleTag({
  content: `
    html,body{margin:0!important;background:#0a0810!important;}
    #root>div{display:block!important;background:#0a0810!important;}
    #root>div>div:first-child{display:block!important;overflow:visible!important;}
    #root>div>div:first-child>div{transform:none!important;box-shadow:none!important;position:fixed!important;left:0!important;top:0!important;margin:0!important;}
  `,
});

// Fonts + the big hero_vista SVG must be decoded before we start stepping.
await page.evaluate(() => document.fonts.ready).catch(() => {});
await page.waitForFunction(() => Array.from(document.images).every((im) => im.complete && im.naturalWidth > 0), { timeout: 30000 });
await page.waitForTimeout(300);

const clip = { x: 0, y: 0, width: W, height: H };
const pad = (n) => String(n).padStart(4, "0");

// Prime the clock (first flush sets the dt baseline; time stays 0), then step.
await page.evaluate(() => window.__flushRaf(0));
await settle();
for (let f = 0; f < FRAMES; f++) {
  if (f > 0) {
    const ts = (f * 1000) / FPS;   // exact timeline second f/FPS
    await page.evaluate((t) => window.__flushRaf(t), ts);
    await settle();
  }
  await page.screenshot({ path: join(FRAME_DIR, `f${pad(f)}.png`), clip });
  if (f % 30 === 0) process.stdout.write(`\rframe ${f + 1}/${FRAMES}`);
}
process.stdout.write(`\rframe ${FRAMES}/${FRAMES}\n`);

// Let React commit the setTime before each screenshot. React's MessageChannel
// task runs before our setTimeout, so two macrotask hops are ample.
async function settle() {
  await page.evaluate(() => new Promise((r) => setTimeout(() => setTimeout(r, 0), 0)));
}

if (errors.length) console.warn("page errors:\n" + errors.slice(0, 8).join("\n"));

await browser.close();
server.close();

// ── encode ─────────────────────────────────────────────────────────────────
console.log("encoding mp4…");
const ff = (args) => {
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + args.join(" "));
};
ff(["-y", "-framerate", String(FPS), "-i", join(FRAME_DIR, "f%04d.png"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", MP4]);
console.log("wrote " + MP4);

console.log("encoding gif (downscaled 960w)…");
ff(["-y", "-i", MP4, "-vf",
    "fps=24,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
    GIF]);
console.log("wrote " + GIF);

if (existsSync(MP4)) {
  const sz = spawnSync("du", ["-h", MP4, GIF], { encoding: "utf8" });
  console.log(sz.stdout);
}
