// The Naevyr launch trailer. 1920×1080 @ 30fps, 42s, fourteen scenes.
// All art is the game's own: SVG exports from the design system (hero vista,
// gate, logos) + live procedural sprites (the wanderer, the prestige auras)
// imported straight from game/render/sprites.ts.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/PixelifySans";
import { PixelSprite, type Grid } from "./PixelSprite";
import { FrameSheet } from "./FrameSheet";
import {
  drawWanderer,
  PRESTIGE_AURAS,
  type PrestigeAuraKey,
  drawDarkWheelFace,
  wheelSegmentAngles,
  drawCacheBurst,
  drawGuildBanner,
  drawExchangeCounter,
} from "../../game/render/sprites";

const { fontFamily } = loadFont();

export const FPS = 30;

// scene cut list (frames). The G* scenes are REAL gameplay footage captured
// from the live game by scripts/capture*.mjs (see MARK timestamps there).
const S1 = 60;   // cold open
const S2 = 80;   // wordmark reveal
const G1 = 95;   // gameplay · town walk
const G2 = 95;   // gameplay · gathering
const G3 = 105;  // gameplay · combat
const PVP = 90;  // gameplay · a wagered Pit duel (two real clients)
const G4 = 80;   // gameplay · keeper interior
const G5 = 100;  // gameplay · vista + the Drift wash
const E1 = 100;  // economy · the Drift Wheel spins onto a relic
const E2 = 85;   // economy · raise a guild banner
const E3 = 85;   // economy · the Exchange (gold ↔ DRIFTS)
const S5 = 100;  // prestige auras · burn DRIFTS
const S6 = 85;   // the gate · hold to enter
const S7 = 100;  // end card · PLAY NOW
const CUTS = [S1, S2, G1, G2, G3, PVP, G4, G5, E1, E2, E3, S5, S6, S7];
export const TRAILER_FRAMES = CUTS.reduce((a, b) => a + b, 0); // 1260 = 42s

// the locked palette
const VOID = "#0a0810";
const BONE = "#efe9f4";
const BONE_DIM = "#a99fb8";
const GOLD = "#e7c873";
const DRIFT = "#a855f7";
const DRIFT_HI = "#d8b4fe";

// deterministic hash (mirror of the game's hash2) for particle layouts
function hash2(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

/** drifting violet motes, thicker when `density` rises */
const Motes: React.FC<{ count?: number; seed?: number; drift?: number }> = ({
  count = 40,
  seed = 1,
  drift = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const rx = hash2(i, 7, seed);
        const ry = hash2(i, 13, seed);
        const rs = hash2(i, 29, seed);
        const speed = 0.15 + rs * 0.45;
        const x = ((rx * width + frame * speed * drift) % (width + 40)) - 20;
        const y = ry * height + Math.sin((frame + i * 31) / 45) * 14;
        const big = rs > 0.82;
        const a = 0.25 + 0.55 * Math.abs(Math.sin((frame + i * 17) / 38));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: big ? 6 : 4,
              height: big ? 6 : 4,
              background: big ? DRIFT_HI : DRIFT,
              opacity: a,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** laconic title line that fades up from the dark */
const Line: React.FC<{
  at: number;          // frame (within scene) it begins
  children: React.ReactNode;
  size?: number;
  color?: string;
  y?: number | string; // top position
  out?: number;        // frame it starts leaving (optional)
}> = ({ at, children, size = 64, color = BONE, y = "44%", out }) => {
  const frame = useCurrentFrame();
  let opacity = interpolate(frame, [at, at + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (out != null) {
    opacity *= interpolate(frame, [out, out + 14], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  const rise = interpolate(frame, [at, at + 18], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color,
        opacity,
        transform: `translateY(${rise}px)`,
        textShadow: `0 4px 24px ${VOID}, 0 0 42px rgba(168,85,247,0.25)`,
      }}
    >
      {children}
    </div>
  );
};

/** per-scene fade shell (12f in / 12f out) on the void backdrop */
const Scene: React.FC<{ children: React.ReactNode; noFadeIn?: boolean }> = ({
  children,
  noFadeIn,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity =
    (noFadeIn
      ? 1
      : interpolate(frame, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })) *
    interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return (
    <AbsoluteFill style={{ background: VOID, opacity }}>{children}</AbsoluteFill>
  );
};

// ── S1 · cold open ───────────────────────────────────────────────────────────
const ColdOpen: React.FC = () => (
  <Scene noFadeIn>
    <Motes count={26} seed={3} drift={0.7} />
    <Line at={8} size={58}>
      A realm is being eaten.
    </Line>
    <Line at={28} size={40} color={BONE_DIM} y="56%">
      Season by season. Tile by tile.
    </Line>
  </Scene>
);

// ── S2 · wordmark ────────────────────────────────────────────────────────────
const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, mass: 0.9 } });
  const glow = 0.5 + 0.5 * Math.sin(frame / 9);
  return (
    <Scene>
      <Motes count={50} seed={9} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            transform: `scale(${0.7 + 0.3 * pop})`,
            filter: `drop-shadow(0 0 ${24 + glow * 26}px rgba(168,85,247,0.55))`,
          }}
        >
          {/* the SVG canvas is 512 wide but the art ends at ~343 — shift right
              so the ART (not the canvas) sits centered */}
          <Img
            src={staticFile("assets/logo-horizontal.svg")}
            style={{
              width: 1040,
              imageRendering: "pixelated",
              transform: "translateX(173px)",
            }}
          />
        </div>
      </AbsoluteFill>
      <Line at={40} size={34} color={BONE_DIM} y="66%">
        A dark-fantasy MMO at the edge of the Drift.
      </Line>
    </Scene>
  );
};

// ── G* · real gameplay beats ─────────────────────────────────────────────────
// Footage: public/gameplay/*.webm — the live game, captured via real clicks.
const GameplayScene: React.FC<{
  src: string;
  fromSec: number;
  caption: string;
  sub?: string;
  driftWash?: boolean; // G6: the corruption creeps over the closing shot
  /** extra crop-in (1.04 default); pair with origin to push map-edge void out of frame */
  zoom?: number;
  origin?: string;
}> = ({ src, fromSec, caption, sub, driftWash, zoom = 1.04, origin = "center" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const creep = interpolate(frame, [10, durationInFrames], [-30, 115], {
    extrapolateRight: "clamp",
  });
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <OffthreadVideo
          src={staticFile(src)}
          startFrom={Math.round(fromSec * FPS)}
          playbackRate={1.5}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`, // ≥1.04 hides window-edge artifacts
            transformOrigin: origin,
          }}
        />
      </AbsoluteFill>
      {driftWash && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(100deg, rgba(107,33,168,0.85) ${creep - 26}%, rgba(168,85,247,0.45) ${creep - 8}%, transparent ${creep + 6}%)`,
            mixBlendMode: "hard-light",
          }}
        />
      )}
      {driftWash && <Motes count={60} seed={21} drift={2.2} />}
      {/* gentle letterbox so captions sit on dark ground */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,8,16,0.45) 0%, transparent 16%, transparent 70%, rgba(10,8,16,0.85) 100%)",
        }}
      />
      <Line at={10} size={54} y="80%">
        {caption}
      </Line>
      {sub ? (
        <Line at={34} size={30} color={BONE_DIM} y="89%">
          {sub}
        </Line>
      ) : null}
    </Scene>
  );
};

// ── S5 · prestige auras (live procedural sprites) ───────────────────────────
const AURA_ORDER: { key: PrestigeAuraKey; label: string }[] = [
  { key: "ashen_crown", label: "the Ashen Crown" },
  { key: "corruption_halo", label: "the Corruption Halo" },
  { key: "ember_cinder", label: "the Ember Cinder" },
  { key: "bonewisp", label: "the Bonewisp" },
];
const CHAR_SCALE = 11;

const Auras: React.FC = () => {
  const frame = useCurrentFrame();
  const per = 24; // frames each aura holds the stage (4 auras inside S5)
  const idx = Math.min(Math.floor(frame / per), AURA_ORDER.length - 1);
  const { key, label } = AURA_ORDER[idx];
  const spec = PRESTIGE_AURAS[key];
  const auraFrame = Math.floor((frame / FPS) * spec.fps) % spec.frames;
  const charFrame = Math.floor((frame / FPS) * 3) % 2; // idle 2f
  // full prestige fit: Driftweave cloak (the burn-only dye) + forged gear
  const charGrid = drawWanderer(
    "s",
    "idle",
    charFrame,
    { weapon: 2, ward: 2, held: "weapon" },
    { dye: "drift", eye: "ember" },
  ) as unknown as Grid;
  const auraGrid = spec.fn(auraFrame) as unknown as Grid;
  // align aura anchor (32,56) to the wanderer cell anchor (16,39)
  const ax = (16 - 32) * CHAR_SCALE;
  const ay = (39 - 56) * CHAR_SCALE;
  return (
    <Scene>
      <Motes count={30} seed={idx + 40} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 32 * CHAR_SCALE, height: 40 * CHAR_SCALE }}>
          <PixelSprite
            grid={auraGrid}
            scale={CHAR_SCALE}
            style={{ position: "absolute", left: ax, top: ay }}
          />
          <PixelSprite grid={charGrid} scale={CHAR_SCALE} style={{ position: "absolute" }} />
        </div>
      </AbsoluteFill>
      <Line at={8} size={46} y="14%">
        Burn <span style={{ color: GOLD }}>DRIFTS</span>. Wear the proof.
      </Line>
      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontSize: 38,
          color: DRIFT_HI,
          letterSpacing: "0.08em",
          textShadow: `0 3px 18px ${VOID}`,
        }}
      >
        {label}
      </div>
    </Scene>
  );
};

// ── E1 · the Drift Wheel (spins onto the 1% relic) ──────────────────────────
const DriftWheelScene: React.FC = () => {
  const frame = useCurrentFrame();
  const SPIN_F = 60; // ~2s of spin (the reveal needs the scene's last third)
  const relic = wheelSegmentAngles("dark").find((s) => s.label === "relic")!;
  const center = relic.start + relic.sweep / 2;
  const targetRot = 5 * 360 + (360 - center); // bring the relic wedge to the top pointer
  const t = Math.min(1, frame / SPIN_F);
  const rot = (1 - Math.pow(1 - t, 3)) * targetRot; // cubic ease-out
  const landed = frame >= SPIN_F;
  const shimmer = Math.floor(frame / 15) % 2;
  const face = drawDarkWheelFace(shimmer, true).g as unknown as Grid;
  const SCALE = 1.6;
  const D = 240 * SCALE;
  return (
    <Scene>
      <Motes count={28} seed={50} />
      <Line at={6} size={48} y="11%">
        Burn for the <span style={{ color: GOLD }}>Drift Wheel</span>.
      </Line>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: D, height: D }}>
          <div
            style={{
              position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0, zIndex: 3,
              borderLeft: "15px solid transparent", borderRight: "15px solid transparent",
              borderTop: "24px solid #e7c873", filter: `drop-shadow(0 2px 0 ${VOID})`,
            }}
          />
          <div
            style={{
              transform: `rotate(${rot}deg)`, width: D, height: D,
              filter: landed ? "drop-shadow(0 0 34px rgba(216,180,254,0.75))" : undefined,
            }}
          >
            <PixelSprite grid={face} scale={SCALE} />
          </div>
        </div>
      </AbsoluteFill>
      {landed && (
        <Line at={SPIN_F + 2} size={40} color={DRIFT_HI} y="80%">
          One spin in a hundred, a relic.
        </Line>
      )}
    </Scene>
  );
};

// ── E2 · guilds & territory ──────────────────────────────────────────────────
const GuildScene: React.FC = () => {
  const frame = useCurrentFrame();
  const banner = drawGuildBanner(Math.floor(frame / 10) % 3) as unknown as Grid;
  const SCALE = 5; // 48×96 → 240×480
  return (
    <Scene>
      <Motes count={22} seed={61} />
      <Line at={6} size={48} y="12%">
        Raise a <span style={{ color: GOLD }}>banner</span>.
      </Line>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <PixelSprite grid={banner} scale={SCALE} />
          {/* the guild tag, on the banner's blank plate (plate center ≈ 25,43) */}
          <div
            style={{
              position: "absolute", left: 25 * SCALE, top: 43 * SCALE,
              transform: "translate(-50%, -50%)",
              fontFamily, fontWeight: 700, fontSize: 30, letterSpacing: "0.04em",
              color: "#3b1162",
            }}
          >
            ASH
          </div>
        </div>
      </AbsoluteFill>
      <Line at={40} size={34} color={DRIFT_HI} y="82%">
        Hold the wilds. Feed it, or lose it.
      </Line>
    </Scene>
  );
};

// ── E3 · the Exchange ────────────────────────────────────────────────────────
const ExchangeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scales = drawExchangeCounter(Math.floor(frame / 20) % 2) as unknown as Grid;
  const SCALE = 7; // 48×48 → 336
  return (
    <Scene>
      <Motes count={20} seed={71} drift={0.7} />
      <Line at={6} size={46} y="13%">
        Trade <span style={{ color: GOLD }}>gold</span> and <span style={{ color: DRIFT_HI }}>DRIFTS</span>.
      </Line>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <PixelSprite grid={scales} scale={SCALE} />
      </AbsoluteFill>
      <Line at={40} size={36} color={BONE_DIM} y="80%">
        The grind becomes the coin.
      </Line>
    </Scene>
  );
};

// ── S6 · the gate ────────────────────────────────────────────────────────────
const Gate: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.5 + 0.5 * Math.sin(frame / 8);
  return (
    <Scene>
      <Motes count={36} seed={77} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            filter: `drop-shadow(0 0 ${20 + glow * 30}px rgba(168,85,247,0.6))`,
          }}
        >
          <FrameSheet
            src="assets/gate_door.svg"
            frameW={96}
            frameH={128}
            frames={3}
            frame={Math.floor(frame / 8)}
            scale={5.6}
          />
        </div>
      </AbsoluteFill>
      <Line at={20} size={52} y="12%">
        <Img
          src={staticFile("assets/emblem-64.svg")}
          style={{
            width: 52,
            height: 52,
            verticalAlign: "-8px",
            marginRight: 22,
            imageRendering: "pixelated",
          }}
        />
        Hold to enter. Burn to act.
      </Line>
      <Line at={56} size={34} color={BONE_DIM} y="84%">
        Half of every burn is gone forever.
      </Line>
    </Scene>
  );
};

// ── S7 · end card ────────────────────────────────────────────────────────────
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 14, fps, config: { damping: 13 } });
  const pulse = 0.6 + 0.4 * Math.sin(frame / 7);
  return (
    <Scene>
      <Motes count={24} seed={99} drift={0.6} />
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", gap: 64 }}
      >
        <Img
          src={staticFile("assets/logo-stacked.svg")}
          style={{ width: 460, imageRendering: "pixelated" }}
        />
        <div
          style={{
            transform: `scale(${Math.max(0, pop)})`,
            fontFamily,
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: VOID,
            background: GOLD,
            padding: "22px 74px",
            boxShadow: `0 0 ${26 + pulse * 30}px rgba(231,200,115,0.55), 6px 6px 0 0 rgba(10,8,16,0.9)`,
          }}
        >
          PLAY NOW
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 44,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontSize: 22,
          color: BONE_DIM,
          opacity: 0.8,
          letterSpacing: "0.08em",
        }}
      >
        Naevyr · beta · DRIFTS is utility, not an investment
      </div>
    </Scene>
  );
};

// ── assembly ─────────────────────────────────────────────────────────────────
const at = (i: number) => CUTS.slice(0, i).reduce((a, b) => a + b, 0);

export const Trailer: React.FC = () => (
  <AbsoluteFill style={{ background: VOID }}>
    {/* original score, synthesized in scripts/score.mjs (license-free).
        Fades out over the last 2s under the CTA. */}
    <Audio
      src={staticFile("music.mp3")}
      volume={(f) =>
        interpolate(f, [TRAILER_FRAMES - 60, TRAILER_FRAMES], [0.9, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
    <Sequence durationInFrames={S1}>
      <ColdOpen />
    </Sequence>
    <Sequence from={at(1)} durationInFrames={S2}>
      <Wordmark />
    </Sequence>
    <Sequence from={at(2)} durationInFrames={G1}>
      <GameplayScene
        src="gameplay/gameplay.webm"
        fromSec={9}
        caption="Wander a shared realm."
      />
    </Sequence>
    <Sequence from={at(3)} durationInFrames={G2}>
      <GameplayScene
        src="gameplay/gameplay.webm"
        fromSec={15.5}
        caption="Gather. Cook. Forge."
      />
    </Sequence>
    <Sequence from={at(4)} durationInFrames={G3}>
      <GameplayScene
        src="gameplay/combat.webm"
        fromSec={10.5}
        caption="Fight what the Drift sends."
      />
    </Sequence>
    <Sequence from={at(5)} durationInFrames={PVP}>
      <GameplayScene
        src="gameplay/pit.webm"
        fromSec={38}
        caption="Settle it in the Pit."
        sub="Wagered duels in a sealed ring. Winner takes the pot."
        zoom={1.3}
        origin="50% 45%"
      />
    </Sequence>
    <Sequence from={at(6)} durationInFrames={G4}>
      <GameplayScene
        src="gameplay/gameplay.webm"
        fromSec={90}
        caption="Trade with the keepers."
      />
    </Sequence>
    <Sequence from={at(7)} durationInFrames={G5}>
      <GameplayScene
        src="gameplay/gameplay.webm"
        fromSec={104}
        caption="The map will not hold still."
        sub="The Drift takes everything unheld."
        driftWash
      />
    </Sequence>
    <Sequence from={at(8)} durationInFrames={E1}>
      <DriftWheelScene />
    </Sequence>
    <Sequence from={at(9)} durationInFrames={E2}>
      <GuildScene />
    </Sequence>
    <Sequence from={at(10)} durationInFrames={E3}>
      <ExchangeScene />
    </Sequence>
    <Sequence from={at(11)} durationInFrames={S5}>
      <Auras />
    </Sequence>
    <Sequence from={at(12)} durationInFrames={S6}>
      <Gate />
    </Sequence>
    <Sequence from={at(13)} durationInFrames={S7}>
      <EndCard />
    </Sequence>
    {/* drop a music bed here when you have one:
        <Audio src={staticFile("music.mp3")} volume={0.8} /> */}
  </AbsoluteFill>
);
