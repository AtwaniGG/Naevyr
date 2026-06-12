// Original dark-fantasy score for the Naevyr trailer, synthesized from scratch
// (no samples, no licensing) — same spirit as the game's procedural WebAudio.
// Scored to the cut list in src/Trailer.tsx: a drone bed, D-minor pads, eerie
// bell motes, a heartbeat pulse under the gameplay, and impacts/risers on the
// wordmark, combat, the Drift wash, the gate and the PLAY NOW card.
// Writes a 16-bit stereo WAV; the runner encodes it to public/music.mp3.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SR = 44100;
const DUR = 58.0; // seconds (trailer is ~57.5s; tail rings out)
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

// ── arrangement (seconds map to the cut list) ───────────────────────────────
// bed: a constant low D drone all the way through
drone(N_.D1, 0, DUR, 0.22);
drone(N_.D2, 1.5, DUR, 0.12);

// chord pads — Dm progression (i · VI · III · VII), one bar ≈ 5s
const chords = [
  { t: 0.0, e: 6.2, n: [N_.D3, N_.F3, N_.A3], g: 0.10 },          // cold open · sparse Dm
  { t: 6.0, e: 11.4, n: [N_.D3, N_.F3, N_.A3, N_.D4], g: 0.14 }, // Dm
  { t: 11.2, e: 16.4, n: [N_.Bb2, N_.D3, N_.F3], g: 0.14 },      // Bb
  { t: 16.2, e: 21.8, n: [N_.F3, N_.A3, N_.C4], g: 0.15 },       // F  (combat)
  { t: 21.6, e: 26.4, n: [N_.C3, N_.E3, N_.G3], g: 0.15 },       // C  (keeper)
  { t: 26.2, e: 31.4, n: [N_.Bb2, N_.D3, N_.Eb3], g: 0.13 },     // Bb add-b2 dread (drift wash)
  // the economy section (Drift Wheel · guilds · exchange): a rising i-VI-VII-V build
  { t: 31.2, e: 36.4, n: [N_.D3, N_.F3, N_.A3, N_.D4], g: 0.16 },// Dm (the wheel)
  { t: 36.2, e: 40.8, n: [N_.Bb2, N_.D3, N_.G3], g: 0.16 },      // Gm-ish (guilds)
  { t: 40.6, e: 45.4, n: [N_.C3, N_.E3, N_.G3, N_.C4], g: 0.17 },// C build (exchange)
  { t: 45.2, e: 50.0, n: [N_.D3, N_.F3, N_.A3], g: 0.16 },       // Dm resolve (auras)
  { t: 49.8, e: 54.0, n: [N_.D3, N_.A3, N_.D4, N_.F4], g: 0.18 },// open Dm (gate)
  { t: 53.6, e: 58.0, n: [N_.D2, N_.D3, N_.A3, N_.D4], g: 0.19 },// final swell (CTA)
];
for (const c of chords) c.n.forEach((f, i) => pad(f, c.t, c.e, c.g, (i % 2 ? 0.35 : -0.35)));

// heartbeat pulse under the gameplay + economy run (~6s–45s), every 0.86s
for (let t = 6.2; t < 45; t += 0.86) pulse(t, 0.5 + 0.2 * ((t - 6) / 39));

// eerie bell motes drifting across the bed
const motes = [
  [1.2, N_.A4, -0.5], [3.4, N_.F4, 0.4], [8.0, N_.D4, 0.5], [13.0, N_.A4, -0.4],
  [18.5, N_.C4, 0.3], [23.5, N_.G3, -0.5], [28.0, N_.Eb3, 0.4], [33.0, N_.A4, -0.3],
  [38.0, N_.G3, 0.5], [42.0, N_.C4, -0.4], [46.5, N_.F4, 0.5], [51.0, N_.D4, 0],
];
for (const [t, f, p] of motes) bell(f, t, 0.16, p);

// impacts + risers at the cut hits
impact(2.5, 0.5);              // wordmark pop
riser(16.2, 1.6, 0.22); impact(16.2, 0.42);   // combat
riser(26.2, 1.8, 0.20);       // into the Drift wash
riser(33.9, 1.3, 0.20); impact(33.9, 0.42);   // the Drift Wheel lands on a relic
horn(N_.D2, 49.6, 53.6, 0.5); // war-horn swell into the gate
riser(53.6, 1.4, 0.24); impact(53.6, 0.6);    // PLAY NOW

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
