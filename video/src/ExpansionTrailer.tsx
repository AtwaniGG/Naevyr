// The Naevyr FRONTIER EXPANSION launch trailer — built in the same mold as the
// original launch (Trailer.tsx / "NaevyrLaunch"): cold open → wordmark → REAL
// gameplay footage (public/gameplay/frontier-raw.webm) → the new-content
// showcases (drawn live from the game's SpriteCache, reused from FrontierClip)
// → the gate → PLAY NOW, all over the launch music bed. 1920×1080 @ 30fps.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { Motes, Line, Scene, GameplayScene, Wordmark, Gate, EndCard } from "./Trailer";
import {
  HorrorsScene, WarlordsScene, RiftScene, MoonScene, LifeScene, FRONTIER_SCENES,
} from "./FrontierClip";
import { PAL } from "./scenes";

export const FPS = 30;

// scene cut list (frames). G* are REAL gameplay footage; the rest are the void-
// backdrop launch shell + the live-drawn frontier showcases.
const S1 = 60;   // cold open
const S2 = 80;   // wordmark reveal
const G1 = 100;  // gameplay · trek the doubled frontier
const G2 = 95;   // gameplay · the Blood Moon over the wilds
const S6 = 85;   // the gate
const S7 = 100;  // end card
const PAD = 8;   // hold/fade headroom on the showcase beats (matches FrontierClip)
const { BEASTS, BOSSES, RIFT, MOON, LIFE } = FRONTIER_SCENES;

const CUTS = [
  S1, S2, G1,
  BEASTS + PAD, BOSSES + PAD, RIFT + PAD,
  G2, MOON + PAD, LIFE + PAD,
  S6, S7,
];
export const EXPANSION_FRAMES = CUTS.reduce((a, b) => a + b, 0);
const at = (i: number) => CUTS.slice(0, i).reduce((a, b) => a + b, 0);

// ── S1 · cold open (frontier-specific copy) ──────────────────────────────────
const ColdOpen: React.FC = () => (
  <Scene noFadeIn>
    <Motes count={26} seed={5} drift={0.7} />
    <Line at={8} size={58}>Past the last waystation,</Line>
    <Line at={28} size={40} color={PAL.BONE_DIM} y="56%">
      the world turns feral.
    </Line>
  </Scene>
);

export const ExpansionTrailer: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.VOID }}>
    {/* launch music bed (42s); full volume, fades out under the CTA */}
    <Audio
      src={staticFile("music.mp3")}
      volume={(f) =>
        interpolate(f, [0, 14, EXPANSION_FRAMES - 45, EXPANSION_FRAMES], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />

    <Sequence durationInFrames={S1}>
      <ColdOpen />
    </Sequence>
    <Sequence from={at(1)} durationInFrames={S2}>
      <Wordmark tagline="The frontier is open." />
    </Sequence>
    <Sequence from={at(2)} durationInFrames={G1}>
      <GameplayScene
        src="gameplay/frontier-raw.webm"
        fromSec={92}
        caption="A wider, hungrier map."
        sub="Frontier camps, drift roads, and worse."
        zoom={1.3}
        origin="50% 45%"
      />
    </Sequence>
    <Sequence from={at(3)} durationInFrames={BEASTS + PAD}>
      <HorrorsScene />
    </Sequence>
    <Sequence from={at(4)} durationInFrames={BOSSES + PAD}>
      <WarlordsScene />
    </Sequence>
    <Sequence from={at(5)} durationInFrames={RIFT + PAD}>
      <RiftScene />
    </Sequence>
    <Sequence from={at(6)} durationInFrames={G2}>
      <GameplayScene
        src="gameplay/frontier-raw.webm"
        fromSec={150}
        caption="Then the Blood Moon rises."
        sub="and the whole frontier wakes hungry."
        zoom={1.25}
        origin="50% 45%"
      />
    </Sequence>
    <Sequence from={at(7)} durationInFrames={MOON + PAD}>
      <MoonScene />
    </Sequence>
    <Sequence from={at(8)} durationInFrames={LIFE + PAD}>
      <LifeScene />
    </Sequence>
    <Sequence from={at(9)} durationInFrames={S6}>
      <Gate />
    </Sequence>
    <Sequence from={at(10)} durationInFrames={S7}>
      <EndCard sub="Naevyr · the frontier expansion · DRIFTS is utility, not an investment" />
    </Sequence>
  </AbsoluteFill>
);
