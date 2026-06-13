// Re-synthesizes the in-realm ambient bed (game/audio/sound.ts startAmbient) to
// an audio file so the social clip can carry the same music you hear in the
// realm: a 55Hz detuned drone with a slow swell LFO + sparse minor-pentatonic
// triangle pad notes. Writes public/realm-ambient.wav.
//   node scripts/render-realm-ambient.mjs [seconds]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SECONDS = Number(process.argv[2] ?? 24);
const SR = 44100;
const N = Math.floor(SECONDS * SR);
const OUT = fileURLToPath(new URL("../public/realm-ambient.wav", import.meta.url));

const tri = (p) => 4 * Math.abs((p % 1) - 0.5) - 1; // -1..1 triangle from phase
const PENTA = [110, 130.8, 146.8, 164.8, 196];

// schedule pad notes exactly like padNote(): first at +3s, then every 5-11s
const pads = [];
let t = 3.0;
while (t < SECONDS + 4) {
  const f = PENTA[(Math.random() * PENTA.length) | 0] * (Math.random() < 0.3 ? 2 : 1);
  pads.push({ t0: t, f });
  t += 5 + Math.random() * 6;
}

const buf = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const tt = i / SR;
  // drone: two detuned sines (×0.5 each) through the swelling bed gain
  const bedGain = 0.05 + 0.02 * Math.sin(2 * Math.PI * 0.05 * tt); // LFO starts at 0
  const drone = (0.5 * Math.sin(2 * Math.PI * 55 * tt) +
                 0.5 * Math.sin(2 * Math.PI * 55.7 * tt)) * bedGain;
  // pads: triangle, env 0->0.04 over 1.6s then ->0 by +4s
  let pad = 0;
  for (const p of pads) {
    const dt = tt - p.t0;
    if (dt < 0 || dt > 4.2) continue;
    let env;
    if (dt < 1.6) env = 0.04 * (dt / 1.6);
    else if (dt < 4.0) env = 0.04 * (1 - (dt - 1.6) / 2.4);
    else env = 0;
    pad += tri(p.f * dt) * env;
  }
  buf[i] = drone + pad;
}

// 16-bit stereo WAV (duplicate mono → L/R)
const bytes = 44 + N * 2 * 2;
const out = Buffer.alloc(bytes);
out.write("RIFF", 0); out.writeUInt32LE(bytes - 8, 4); out.write("WAVE", 8);
out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write("data", 36); out.writeUInt32LE(N * 4, 40);
let o = 44;
for (let i = 0; i < N; i++) {
  const s = Math.max(-1, Math.min(1, buf[i]));
  const v = (s * 32767) | 0;
  out.writeInt16LE(v, o); out.writeInt16LE(v, o + 2); o += 4;
}
writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${SECONDS}s, ${pads.length} pad notes)`);
