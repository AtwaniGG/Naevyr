// Procedural WebAudio for Driftlands — no audio files, everything synthesized
// to match the pixel aesthetic. Lazy: the AudioContext starts on the first
// user gesture (browsers require it), ambient bed starts with it.

export type SfxName =
  | "chop" | "mine" | "splash"        // gathering
  | "hit" | "hurt" | "kill" | "death" // combat
  | "levelup" | "coin" | "craft" | "eat" | "ui"
  | "boss" | "driftfall" | "chat";    // world events

const PREF_KEY = "driftlands-sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambientNodes: AudioNode[] = [];
let padTimer: ReturnType<typeof setTimeout> | null = null;

export function audioEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) !== "off";
}

export function setAudioEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREF_KEY, on ? "on" : "off");
  if (master) {
    master.gain.setTargetAtTime(on ? 1 : 0, ctx!.currentTime, 0.05);
  }
  if (on && !ctx) initAudio();
}

/** call from any user gesture; idempotent */
export function initAudio() {
  if (typeof window === "undefined" || ctx) return;
  try {
    ctx = new AudioContext();
  } catch {
    return;
  }
  master = ctx.createGain();
  master.gain.value = audioEnabled() ? 1 : 0;
  master.connect(ctx.destination);
  void ctx.resume();
  startAmbient();
}

// ─── tiny synth helpers ────────────────────────────────────────────────────────

function env(g: GainNode, t0: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function tone(
  type: OscillatorType, f0: number, f1: number,
  dur: number, peak: number, delay = 0,
) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  env(g, t0, peak, 0.005, dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noiseBurst(dur: number, filterFreq: number, peak: number, delay = 0) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filterFreq;
  const g = ctx.createGain();
  env(g, t0, peak, 0.003, dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

// ─── SFX ───────────────────────────────────────────────────────────────────────

export function play(name: SfxName) {
  if (!ctx || !master || !audioEnabled()) return;
  switch (name) {
    case "chop":
      noiseBurst(0.08, 1200, 0.25);
      tone("sine", 140, 70, 0.09, 0.3);
      break;
    case "mine":
      tone("square", 900, 500, 0.05, 0.12);
      noiseBurst(0.05, 3000, 0.15);
      tone("sine", 110, 60, 0.08, 0.25, 0.01);
      break;
    case "splash":
      noiseBurst(0.18, 900, 0.2);
      tone("sine", 320, 110, 0.16, 0.1, 0.02);
      break;
    case "hit":
      tone("square", 220, 110, 0.07, 0.18);
      noiseBurst(0.04, 2500, 0.1);
      break;
    case "hurt":
      tone("sawtooth", 130, 55, 0.14, 0.22);
      break;
    case "kill":
      tone("square", 330, 70, 0.22, 0.16);
      tone("sine", 880, 1760, 0.3, 0.05, 0.08); // mote shimmer
      tone("sine", 1320, 2640, 0.25, 0.04, 0.12);
      break;
    case "death":
      tone("sawtooth", 220, 30, 0.7, 0.25);
      noiseBurst(0.5, 500, 0.15, 0.1);
      break;
    case "levelup":
      // rising minor-pentatonic arpeggio
      [220, 261.6, 329.6, 440].forEach((f, i) =>
        tone("triangle", f, f, 0.18, 0.16, i * 0.09),
      );
      tone("sine", 880, 880, 0.4, 0.06, 0.36);
      break;
    case "coin":
      tone("square", 988, 988, 0.06, 0.12);
      tone("square", 1319, 1319, 0.14, 0.12, 0.06);
      break;
    case "craft":
      tone("square", 1400, 900, 0.08, 0.1);
      tone("sine", 90, 50, 0.12, 0.3, 0.02); // anvil thump
      noiseBurst(0.06, 4000, 0.08, 0.02);
      break;
    case "eat":
      tone("sine", 300, 220, 0.06, 0.14);
      tone("sine", 260, 180, 0.06, 0.12, 0.08);
      break;
    case "ui":
      tone("square", 660, 660, 0.03, 0.06);
      break;
    case "boss":
      // low war-horn: two detuned saws swelling, then a rumble
      tone("sawtooth", 65, 62, 1.4, 0.2);
      tone("sawtooth", 49, 47, 1.4, 0.18, 0.05);
      noiseBurst(0.8, 220, 0.12, 0.5);
      break;
    case "driftfall":
      // falling whistle → impact thump → mote shimmer
      tone("sine", 1200, 180, 0.5, 0.1);
      tone("sine", 80, 35, 0.3, 0.35, 0.5);
      noiseBurst(0.25, 600, 0.2, 0.5);
      tone("sine", 990, 1980, 0.4, 0.05, 0.7);
      break;
    case "chat":
      tone("triangle", 520, 520, 0.04, 0.08);
      break;
  }
}

// ─── ambient bed: low drone + sparse generative pad ───────────────────────────

function startAmbient() {
  if (!ctx || !master) return;

  const bed = ctx.createGain();
  bed.gain.value = 0.05;
  bed.connect(master);

  // two detuned sines breathe against each other
  for (const f of [55, 55.7]) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    o.connect(g).connect(bed);
    o.start();
    ambientNodes.push(o);
  }
  // slow swell LFO on the bed
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.02;
  lfo.connect(lfoG).connect(bed.gain);
  lfo.start();
  ambientNodes.push(lfo);

  // sparse eerie pad notes, minor pentatonic, every 5-11s
  const PENTA = [110, 130.8, 146.8, 164.8, 196];
  const padNote = () => {
    if (!ctx || !master || !audioEnabled()) {
      padTimer = setTimeout(padNote, 6000);
      return;
    }
    const f = PENTA[(Math.random() * PENTA.length) | 0] * (Math.random() < 0.3 ? 2 : 1);
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.04, t0 + 1.6);
    g.gain.linearRampToValueAtTime(0, t0 + 4);
    o.connect(g).connect(master!);
    o.start(t0);
    o.stop(t0 + 4.2);
    padTimer = setTimeout(padNote, 5000 + Math.random() * 6000);
  };
  padTimer = setTimeout(padNote, 3000);
}

export function destroyAudio() {
  if (padTimer) clearTimeout(padTimer);
  padTimer = null;
  ambientNodes.forEach((n) => {
    try { (n as OscillatorNode).stop(); } catch { /* already stopped */ }
  });
  ambientNodes = [];
  ctx?.close().catch(() => {});
  ctx = null;
  master = null;
}
