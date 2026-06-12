// Original dark-fantasy score for the Naevyr trailer, synthesized from scratch
// (no samples, no licensing) — same spirit as the game's procedural WebAudio.
// Scored to the cut list in src/Trailer.tsx: low D drones + octave-shadowed
// Dm pads, war-taiko drums, a tolling funeral bell, a low lute arp, and a
// full scene-synced SFX pass (axe chops, blade clangs, the wheel's ratchet,
// coin pings, banner cloth, the gate's stone rumble, aura shimmers, whoosh
// transitions) with impacts/risers on the wordmark, combat, the Drift wash,
// the relic land, the gate and the PLAY NOW card.
// Writes a 16-bit stereo WAV; the runner encodes it to public/music.mp3.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SR = 44100;
const DUR = 43.5; // seconds (trailer is 42s; tail rings out)
const N = Math.floor(SR * DUR);
const L = new Float64Array(N);
const R = new Float64Array(N);

const TAU = Math.PI * 2;
const sin = (ph) => Math.sin(ph);
// pitch helpers (equal temperament from A4=440)
const note = (semisFromA4) => 440 * Math.pow(2, semisFromA4 / 12);
const N_ = {
  D1: note(-29), D2: note(-17), A2: note(-12), Bb2: note(-11), C3: note(-9),
  D3: note(-7), Eb3: note(-6), E3: note(-5), F3: note(-4), G3: note(-2),
  A3: note(0), Bb3: note(1), C4: note(3), D4: note(5), F4: note(8), A4: note(12),
};

const env = (t, t0, atk, hold, rel) => {
  const x = t - t0;
  if (x < 0 || x > atk + hold + rel) return 0;
  if (x < atk) return x / atk;
  if (x < atk + hold) return 1;
  return 1 - (x - atk - hold) / rel;
};
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// add a stereo-spread voice over [t0,t1]: detuned saw-ish pad through a soft
// harmonic rolloff (warm, not buzzy), with attack/release shaping
function pad(freq, t0, t1, gain, pan = 0, atk = 0.8, rel = 1.2) {
  const i0 = Math.max(0, (t0 * SR) | 0);
  const i1 = Math.min(N, (t1 * SR) | 0);
  const det = freq * 0.004; // ~7 cents
  const gl = gain * (0.5 - pan / 2);
  const gr = gain * (0.5 + pan / 2);
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const e = clamp01(Math.min((t - t0) / atk, (t1 - t) / rel, 1));
    if (e <= 0) continue;
    let s = 0;
    // 6 harmonics, 1/h amplitude rolloff = mellow saw
    for (let h = 1; h <= 6; h++) s += sin(TAU * freq * h * t) / (h * h * 0.6 + h);
    let s2 = 0;
    for (let h = 1; h <= 6; h++) s2 += sin(TAU * (freq + det) * h * t) / (h * h * 0.6 + h);
    const v = (s + s2) * 0.5 * e;
    L[i] += v * gl;
    R[i] += v * gr;
  }
}

// low sine sub drone with a slow breathing LFO
function drone(freq, t0, t1, gain) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, (t1 * SR) | 0);
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const e = clamp01(Math.min((t - t0) / 2.5, (t1 - t) / 3, 1));
    const lfo = 0.8 + 0.2 * sin(TAU * 0.12 * t);
    const v = (sin(TAU * freq * t) + 0.4 * sin(TAU * freq * 2 * t)) * e * lfo * gain;
    L[i] += v; R[i] += v;
  }
}

// eerie bell/mote: fast-decay sine with a shimmer partial, panned
function bell(freq, t0, gain, pan = 0, dec = 1.6) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + dec) * SR) | 0);
  const gl = gain * (0.5 - pan / 2), gr = gain * (0.5 + pan / 2);
  for (let i = i0; i < i1; i++) {
    const t = i / SR, x = t - t0;
    const e = Math.exp(-x * 3.2);
    const v = (sin(TAU * freq * t) + 0.5 * sin(TAU * freq * 2.01 * t) + 0.25 * sin(TAU * freq * 3.0 * t)) * e;
    L[i] += v * gl; R[i] += v * gr;
  }
}

// heartbeat pulse: a soft low thump
function pulse(t0, gain) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 0.5) * SR) | 0);
  for (let i = i0; i < i1; i++) {
    const t = i / SR, x = t - t0;
    const f = 60 - x * 40; // quick downward chirp = a thud
    const e = Math.exp(-x * 9);
    const v = sin(TAU * f * x) * e * gain;
    L[i] += v; R[i] += v;
  }
}

// cinematic impact: sub boom (down-swept sine) + a short noise crack
function impact(t0, gain) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 2.2) * SR) | 0);
  let ph = 0;
  for (let i = i0; i < i1; i++) {
    const t = i / SR, x = t - t0;
    const f = 120 * Math.exp(-x * 2.2) + 32;
    ph += (TAU * f) / SR;
    const boom = sin(ph) * Math.exp(-x * 1.6);
    const crack = (Math.random() * 2 - 1) * Math.exp(-x * 22) * 0.5;
    const v = (boom + crack) * gain;
    L[i] += v; R[i] += v;
  }
}

// noise riser sweeping up into a hit at tHit
function riser(tHit, len, gain) {
  const t0 = tHit - len;
  const i0 = Math.max(0, (t0 * SR) | 0), i1 = Math.min(N, (tHit * SR) | 0);
  let lp = 0;
  for (let i = i0; i < i1; i++) {
    const x = (i / SR - t0) / len; // 0..1
    const n = Math.random() * 2 - 1;
    lp += (n - lp) * (0.02 + 0.25 * x); // opening lowpass = brightening sweep
    const v = lp * x * x * gain;
    L[i] += v * 0.8; R[i] += v;
  }
}

// war-horn swell: a low brass-ish tone that crescendos
function horn(freq, t0, t1, gain) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, (t1 * SR) | 0);
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const e = clamp01(Math.min((t - t0) / ((t1 - t0) * 0.7), (t1 - t) / 0.6, 1));
    let s = 0;
    for (let h = 1; h <= 5; h++) s += sin(TAU * freq * h * t) * (1 / h) * (1 + 0.3 * sin(TAU * 5 * t));
    const v = s * 0.2 * e * gain;
    L[i] += v; R[i] += v;
  }
}

// plucked arp note: dark lute-ish hit with a fast decay (the motion line)
function pluck(freq, t0, gain, pan = 0) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 0.45) * SR) | 0);
  const gl = gain * (0.5 - pan / 2), gr = gain * (0.5 + pan / 2);
  for (let i = i0; i < i1; i++) {
    const t = i / SR, x = t - t0;
    const e = Math.exp(-x * 9);
    const v = (sin(TAU * freq * t) + 0.4 * sin(TAU * freq * 2 * t)) * e;
    L[i] += v * gl; R[i] += v * gr;
  }
}

// taiko boom: a deep skin hit — low down-swept thump + a short skin-noise slap
function taiko(t0, gain) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 0.9) * SR) | 0);
  let ph = 0;
  for (let i = i0; i < i1; i++) {
    const x = i / SR - t0;
    const f = 82 * Math.exp(-x * 5) + 38;
    ph += (TAU * f) / SR;
    const skin = (Math.random() * 2 - 1) * Math.exp(-x * 60) * 0.35;
    const v = (sin(ph) * Math.exp(-x * 4.5) + skin) * gain;
    L[i] += v; R[i] += v;
  }
}

// church-bell toll: inharmonic partials, long decay — the dread motif
function toll(freq, t0, gain, pan = 0) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 3.5) * SR) | 0);
  const gl = gain * (0.5 - pan / 2), gr = gain * (0.5 + pan / 2);
  const partials = [[1, 1], [2.76, 0.55], [5.4, 0.25], [8.93, 0.12]];
  for (let i = i0; i < i1; i++) {
    const t = i / SR, x = t - t0;
    let v = 0;
    for (const [r, a] of partials) v += sin(TAU * freq * r * t) * a * Math.exp(-x * (0.9 + r * 0.35));
    L[i] += v * gl; R[i] += v * gr;
  }
}

// ── trailer SFX (all synthesized, scene-synced) ─────────────────────────────
// axe chop: a wood knock + a burst of lowpassed noise
function chop(t0, gain) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 0.22) * SR) | 0);
  let lp = 0;
  for (let i = i0; i < i1; i++) {
    const x = i / SR - t0;
    const n = Math.random() * 2 - 1;
    lp += (n - lp) * 0.18;
    const knock = sin(TAU * (170 - x * 300) * x) * Math.exp(-x * 30);
    const v = (knock + lp * Math.exp(-x * 35) * 0.8) * gain;
    L[i] += v; R[i] += v;
  }
}

// blade clang: inharmonic metal partials + a bright crack
function clang(t0, gain, base = 320) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 0.5) * SR) | 0);
  const partials = [[1, 1], [1.51, 0.7], [2.67, 0.45], [3.43, 0.3], [4.79, 0.18]];
  for (let i = i0; i < i1; i++) {
    const t = i / SR, x = t - t0;
    let v = 0;
    for (const [r, a] of partials) v += sin(TAU * base * r * t) * a * Math.exp(-x * (8 + r * 4));
    v += (Math.random() * 2 - 1) * Math.exp(-x * 70) * 0.5;
    L[i] += v * gain * 0.55; R[i] += v * gain * 0.45;
  }
}

// coin ping: two bright partials, slight detune per coin
function coin(t0, gain, det = 1) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 0.35) * SR) | 0);
  for (let i = i0; i < i1; i++) {
    const t = i / SR, x = t - t0;
    const v = (sin(TAU * 1720 * det * t) + 0.5 * sin(TAU * 2580 * det * t)) * Math.exp(-x * 14);
    L[i] += v * gain * 0.4; R[i] += v * gain * 0.6;
  }
}

// ratchet tick (the wheel): a dry click + a tiny ping
function tick(t0, gain) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + 0.06) * SR) | 0);
  for (let i = i0; i < i1; i++) {
    const x = i / SR - t0;
    const v = ((Math.random() * 2 - 1) * Math.exp(-x * 160) + sin(TAU * 900 * x) * Math.exp(-x * 80) * 0.6) * gain;
    L[i] += v; R[i] += v;
  }
}

// whoosh: bandpassed noise sweeping up, panned across the field (scene cuts)
function whoosh(t0, gain, panDir = 1) {
  const len = 0.55;
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, ((t0 + len) * SR) | 0);
  let lp = 0;
  for (let i = i0; i < i1; i++) {
    const x = (i / SR - t0) / len;
    const n = Math.random() * 2 - 1;
    lp += (n - lp) * (0.04 + 0.3 * x);
    const e = Math.sin(Math.PI * x);
    const pan = (x * 2 - 1) * panDir;
    const v = lp * e * gain;
    L[i] += v * (0.5 - pan / 2); R[i] += v * (0.5 + pan / 2);
  }
}

// stone rumble (the gate): brown noise + a slow sub wobble
function rumble(t0, t1, gain) {
  const i0 = (t0 * SR) | 0, i1 = Math.min(N, (t1 * SR) | 0);
  let br = 0;
  for (let i = i0; i < i1; i++) {
    const t = i / SR;
    const e = clamp01(Math.min((t - t0) / 0.4, (t1 - t) / 0.6, 1));
    br += (Math.random() * 2 - 1) * 0.02; br *= 0.998; // brown-ish
    const v = (br * 6 + sin(TAU * 36 * t) * 0.4 * (0.7 + 0.3 * sin(TAU * 2.1 * t))) * e * gain;
    L[i] += v; R[i] += v;
  }
}

// ── arrangement (seconds map to the 42s cut list) ────────────────────────────
// scene starts: wordmark 2.0 · town 4.67 · gather 7.83 · combat 11.0 ·
// THE PIT 14.5 · keeper 17.5 · wash 20.17 · wheel 23.5 · guilds 26.83 ·
// exchange 29.67 · auras 32.5 · gate 35.83 · CTA 38.67 · end 42.0
// bed: low D drones all the way — deeper stack than before, the dark floor
drone(N_.D1, 0, DUR, 0.22);
drone(N_.D2, 1.5, DUR, 0.12);

// chord pads — Dm, doubled an octave down for weight (the choir of the realm)
const chords = [
  { t: 0.0, e: 2.3, n: [N_.D3, N_.A3], g: 0.10 },                 // cold open · bare fifth
  { t: 2.0, e: 4.9, n: [N_.D3, N_.F3, N_.A3, N_.D4], g: 0.16 },  // Dm (wordmark)
  { t: 4.7, e: 7.9, n: [N_.D3, N_.F3, N_.A3], g: 0.15 },         // Dm (town)
  { t: 7.8, e: 11.1, n: [N_.Bb2, N_.D3, N_.F3], g: 0.15 },       // Bb (gathering)
  { t: 11.0, e: 14.6, n: [N_.F3, N_.A3, N_.C4], g: 0.17 },       // F  (combat)
  { t: 14.5, e: 17.6, n: [N_.Bb2, N_.D3, N_.G3], g: 0.18 },      // Gm (the Pit — blood money)
  { t: 17.5, e: 20.3, n: [N_.C3, N_.E3, N_.G3], g: 0.16 },       // C  (keeper)
  { t: 20.1, e: 23.6, n: [N_.Bb2, N_.D3, N_.Eb3], g: 0.15 },     // Bb add-b2 dread (wash)
  { t: 23.5, e: 26.9, n: [N_.D3, N_.F3, N_.A3, N_.D4], g: 0.17 },// Dm (the wheel)
  { t: 26.8, e: 29.8, n: [N_.Bb2, N_.D3, N_.G3], g: 0.17 },      // Gm-ish (guilds)
  { t: 29.6, e: 32.6, n: [N_.C3, N_.E3, N_.G3, N_.C4], g: 0.18 },// C build (exchange)
  { t: 32.5, e: 35.9, n: [N_.D3, N_.F3, N_.A3], g: 0.17 },       // Dm resolve (auras)
  { t: 35.8, e: 38.8, n: [N_.D3, N_.A3, N_.D4, N_.F4], g: 0.19 },// open Dm (gate)
  { t: 38.6, e: 43.5, n: [N_.D2, N_.D3, N_.A3, N_.D4], g: 0.20 },// final swell (CTA)
];
for (const c of chords) {
  c.n.forEach((f, i) => pad(f, c.t, c.e, c.g, (i % 2 ? 0.35 : -0.35)));
  pad(c.n[0] / 2, c.t, c.e, c.g * 0.5, 0, 1.2, 1.4); // the octave-down shadow
}

// THE DRUMS — war taiko, not a club kick: BOOM . . boom-BOOM . . (bar = 1.72s)
const BAR = 1.72;
for (let bar = 4.7; bar < 38.6; bar += BAR) {
  const build = 0.7 + 0.3 * ((bar - 4.7) / 34);
  taiko(bar, 0.85 * build);
  taiko(bar + BAR * 0.625, 0.45 * build);
  taiko(bar + BAR * 0.75, 0.7 * build);
}

// the toll — a low bell on D every other bar, the realm's funeral clock
for (let t = 6.4; t < 36; t += BAR * 2) toll(N_.D3, t, 0.16, ((t / BAR) % 2) ? 0.3 : -0.3);

// the arp: a low D-minor lute line, eighth-notes, darker and quieter than before
const BEAT = 0.43;
const ARP = [N_.D3, N_.A3, N_.F3, N_.A3, N_.D3, N_.F3, N_.Bb3, N_.A3];
let ai = 0;
for (let t = 4.7; t < 38.6; t += BEAT / 2) {
  // the arp rests during the dread wash so the creep can breathe
  if (t > 20.1 && t < 23.5) { ai++; continue; }
  pluck(ARP[ai % ARP.length], t, 0.10 + 0.05 * ((t - 4.7) / 34), ai % 2 ? 0.4 : -0.4);
  ai++;
}

// eerie bell motes drifting across the bed
const motes = [
  [1.0, N_.A4, -0.5], [3.2, N_.F4, 0.4], [9.0, N_.D4, 0.5],
  [18.2, N_.C4, 0.3], [21.5, N_.Eb3, 0.4], [28.0, N_.G3, -0.5],
  [33.5, N_.A4, -0.3], [37.0, N_.D4, 0],
];
for (const [t, f, p] of motes) bell(f, t, 0.16, p);

// ── the SFX pass (synced to what is ON SCREEN) ──────────────────────────────
// scene-cut whooshes into each gameplay/economy beat
for (const [t, dir] of [[4.67, 1], [7.83, -1], [14.5, 1], [17.5, -1], [26.83, -1], [29.67, 1], [32.5, -1]]) {
  whoosh(t - 0.18, 0.16, dir);
}
// gathering: three axe chops landing in the clip
chop(8.4, 0.5); chop(9.3, 0.45); chop(10.2, 0.5);
// combat: a beast growl of low brass dissonance, then blade clangs
horn(N_.Eb3, 11.0, 12.2, 0.22); // the dissonant snarl under the engage
clang(11.9, 0.4); clang(12.7, 0.34, 360); clang(13.6, 0.42, 290);
// THE PIT: dueling steel — faster trades than the beast fight, then the pot
clang(15.0, 0.42, 410); clang(15.6, 0.36, 300); clang(16.2, 0.44, 460); clang(16.8, 0.38, 340);
coin(17.15, 0.3); coin(17.35, 0.26, 1.08); // the wager crosses
// keeper interior: the shop bell
bell(N_.A4, 17.8, 0.22, 0.2, 1.2);
// the Drift wash: the toll lands INSIDE the dread
toll(N_.D3 / 2, 20.4, 0.22, 0);
// the wheel: a decelerating ratchet into the relic land
{
  let t = 23.55, dt = 0.07;
  while (t < 25.4) { tick(t, 0.3); t += dt; dt *= 1.18; }
  clang(25.5, 0.45, 430); // the pointer lands
  bell(880, 25.62, 0.2, 0.3, 1.4); // relic shimmer
}
// guilds: the banner unfurls (cloth whoosh) + a short horn stab
whoosh(27.0, 0.22, 1); horn(N_.D3, 27.1, 28.0, 0.3);
// the Exchange: coins crossing the counter
coin(30.0, 0.3); coin(30.4, 0.26, 1.06); coin(30.8, 0.3, 0.94);
// auras: a shimmer as each one takes the stage (per=24f = 0.8s)
bell(880, 32.55, 0.18, -0.3, 1.2); bell(987, 33.35, 0.18, 0.3, 1.2);
bell(880, 34.15, 0.18, -0.3, 1.2); bell(1174, 34.95, 0.2, 0, 1.4);
// the gate: stone grinding open under the horn
rumble(35.9, 38.0, 0.5);

// impacts + risers at the cut hits
impact(2.1, 0.5);              // wordmark pop
riser(11.0, 1.4, 0.22); impact(11.0, 0.42);   // combat
impact(14.5, 0.38);            // into the Pit
riser(20.1, 1.6, 0.20);       // into the Drift wash
riser(25.5, 1.2, 0.20); impact(25.5, 0.42);   // the Drift Wheel lands on a relic
horn(N_.D2, 34.8, 38.6, 0.5); // war-horn swell into the gate
riser(38.6, 1.3, 0.24); impact(38.6, 0.6);    // PLAY NOW
toll(N_.D3, 39.2, 0.2, 0);    // one last toll under the CTA


// ── master: soft-clip + fade in/out, write WAV ──────────────────────────────
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = peak > 0 ? 0.85 / peak : 1;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(t / 1.2, (DUR - t) / 2.5, 1);
  const sc = (v) => Math.tanh(v * norm * 1.1) * fade; // tanh glues the peaks
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, (sc(L[i]) * 32767) | 0)), 44 + i * 4);
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, (sc(R[i]) * 32767) | 0)), 44 + i * 4 + 2);
}
const out = fileURLToPath(new URL("../public/music.wav", import.meta.url));
writeFileSync(out, buf);
console.log(`wrote ${out} (${DUR}s, peak ${peak.toFixed(2)} → norm ${norm.toFixed(3)})`);
