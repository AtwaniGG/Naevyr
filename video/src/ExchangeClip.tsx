// Standalone ~16s social clip: THE EXCHANGE — trade gold for DRIFTS.
// 1920×1080 @ 30fps. The Exchange needs a wallet + on-chain transfers, so (like
// the launch trailer's E3 beat) it CANNOT be captured as live gameplay — every
// visual here is the game's own procedural art: drawExchangeCounter (the Vault
// scales), the DRIFTS emblem coin, the locked palette. "Loud social" captions
// (Impact, heavy void stroke) burned in, paced sparse so a voiceover can ride
// over them. A VOICEOVER SLOT is wired below (commented) — record the script in
// docs/exchange-vo.md, drop the mp3 at public/vo/exchange-vo.mp3, uncomment.
import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PixelSprite, type Grid } from "./PixelSprite";
import { drawExchangeCounter } from "../../game/render/sprites";

export const FPS = 30;
export const EXCHANGE_FRAMES = 480; // 16.0s — matches the pvp/wheel social clips

// locked palette (mirror of the game + caption-clip.py)
const VOID = "#0a0810";
const BONE = "#efe9f4";
const BONE_DIM = "#a99fb8";
const GOLD = "#e7c873";
const DRIFT = "#a855f7";
const DRIFT_HI = "#d8b4fe";
const BLOOD = "#e0533d";

const IMPACT = "ImpactLocal";
const NARROW = "NarrowLocal";

// deterministic hash (mirror of the game's hash2) for particle layouts
function hash2(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

/** drifting violet motes (the Drift is always in the air) */
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

/** a single gold coin — a pixel ◆ in the gold ramp with a void edge */
const GoldDiamond: React.FC<{ size: number; style?: React.CSSProperties }> = ({
  size,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      transform: "rotate(45deg)",
      background: `linear-gradient(135deg, #f6e3a4 0%, ${GOLD} 45%, #b9923f 100%)`,
      border: `${Math.max(2, size * 0.08)}px solid ${VOID}`,
      boxShadow: `0 0 ${size * 0.5}px rgba(231,200,115,0.5)`,
      ...style,
    }}
  />
);

/** loud-social caption: Impact/Narrow, heavy void outline (paint-order), fades */
const Caption: React.FC<{
  text: React.ReactNode;
  font?: string;
  size?: number;
  color?: string;
  y?: number; // fraction of height (vertical center of the line)
  at: number;
  out: number;
  fade?: number; // frames
  box?: boolean;
}> = ({ text, font = IMPACT, size = 96, color = BONE, y = 0.78, at, out, fade = 12, box }) => {
  const frame = useCurrentFrame();
  const a =
    interpolate(frame, [at, at + fade], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [out - fade, out], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  if (a <= 0) return null;
  const rise = interpolate(frame, [at, at + fade], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stroke = Math.max(4, size * 0.06);
  return (
    <div
      style={{
        position: "absolute",
        top: `${y * 100}%`,
        left: 0,
        right: 0,
        textAlign: "center",
        transform: `translateY(${rise - size * 0.5}px)`,
        opacity: a,
      }}
    >
      <span
        style={{
          fontFamily: font,
          fontSize: size,
          fontWeight: font === IMPACT ? 400 : 700,
          letterSpacing: font === IMPACT ? "0.01em" : "0.06em",
          color,
          WebkitTextStroke: `${stroke}px ${VOID}`,
          paintOrder: "stroke fill",
          textTransform: "uppercase",
          textShadow: `0 ${size * 0.05}px ${size * 0.05}px rgba(10,8,16,0.7)`,
          ...(box
            ? {
                background: "rgba(10,8,16,0.78)",
                padding: "10px 38px",
                boxShadow: `6px 6px 0 0 ${VOID}`,
              }
            : {}),
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ── the falling-gold "grind" intro (0 → ~3.7s) ───────────────────────────────
const GoldRain: React.FC<{ count?: number }> = ({ count = 20 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: count }, (_, i) => {
        const rx = hash2(i, 3, 88);
        const rt = hash2(i, 9, 88);
        const rsz = hash2(i, 21, 88);
        const period = 150 + Math.floor(rt * 60);
        const t = ((frame + rt * period) % period) / period;
        const x = 0.1 * width + rx * 0.8 * width;
        const y = -60 + t * (height * 0.72 + 60);
        const sz = 22 + rsz * 22;
        const a = interpolate(t, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
        return (
          <div
            key={i}
            style={{ position: "absolute", left: x, top: y, opacity: a }}
          >
            <GoldDiamond size={sz} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── the scales + the trade (gold flows in, DRIFTS rise) ──────────────────────
const Scales: React.FC<{ tradeStart: number }> = ({ tradeStart }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const SCALE = 12; // 48×48 → 576
  const W = 48 * SCALE;
  const cx = width / 2;
  const cy = height * 0.36;
  // scales fade up, then a gentle living tip; payoff glow ramps after the trade
  const tip = Math.floor(frame / 18) % 2; // 0/1 → the sprite's two tip frames
  const grid = drawExchangeCounter(tip) as unknown as Grid;
  const glow = interpolate(frame, [tradeStart + 70, tradeStart + 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tradeT = frame - tradeStart;

  // pan anchors in sprite space (drawExchangeCounter): left=gold ~ (11,22), right=DRIFTS ~ (37,22)
  const leftPan = { x: cx + (11 - 24) * SCALE, y: cy + (22 - 24) * SCALE };
  const rightPan = { x: cx + (37 - 24) * SCALE, y: cy + (22 - 24) * SCALE };

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* gold streaming UP from lower-left into the gold pan during the trade */}
      {tradeT > 0 &&
        Array.from({ length: 14 }, (_, i) => {
          const delay = i * 7;
          const dur = 46;
          const t = ((tradeT - delay) % (dur + 40)) / dur;
          if (tradeT - delay < 0 || t > 1) return null;
          const sx = leftPan.x - 360 + hash2(i, 2, 5) * 80;
          const sy = leftPan.y + 360 + hash2(i, 8, 5) * 80;
          const x = sx + (leftPan.x - sx) * t;
          const y = sy + (leftPan.y - sy) * t - Math.sin(t * Math.PI) * 90;
          const a = interpolate(t, [0, 0.12, 0.8, 1], [0, 1, 1, 0]);
          return (
            <div key={`g${i}`} style={{ position: "absolute", left: x, top: y, opacity: a }}>
              <GoldDiamond size={30} />
            </div>
          );
        })}

      {/* the scales */}
      <div
        style={{
          position: "absolute",
          left: cx - W / 2,
          top: cy - (24 * SCALE) / 2 - 18 * SCALE * 0 - 4 * SCALE,
          filter: glow > 0 ? `drop-shadow(0 0 ${glow * 40}px rgba(216,180,254,${0.7 * glow}))` : undefined,
        }}
      >
        <PixelSprite grid={grid} scale={SCALE} />
      </div>

      {/* DRIFTS coins rising from the right pan (the payout) */}
      {tradeT > 24 &&
        Array.from({ length: 11 }, (_, i) => {
          const delay = i * 9;
          const dur = 58;
          const t = ((tradeT - 24 - delay) % (dur + 36)) / dur;
          if (tradeT - 24 - delay < 0 || t > 1) return null;
          const x = rightPan.x + (hash2(i, 5, 6) - 0.5) * 120;
          const y = rightPan.y - t * 300;
          const a = interpolate(t, [0, 0.15, 0.7, 1], [0, 1, 1, 0]);
          const sz = 46 + hash2(i, 11, 6) * 18;
          return (
            <Img
              key={`d${i}`}
              src={staticFile("assets/emblem-64.svg")}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: sz,
                height: sz,
                opacity: a,
                imageRendering: "pixelated",
                filter: `drop-shadow(0 0 14px rgba(168,85,247,0.7))`,
              }}
            />
          );
        })}
    </AbsoluteFill>
  );
};

// ── CTA end card ─────────────────────────────────────────────────────────────
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 10, fps, config: { damping: 13 } });
  const pulse = 0.6 + 0.4 * Math.sin(frame / 7);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 56 }}>
      <Img
        src={staticFile("assets/logo-stacked.svg")}
        style={{ width: 420, imageRendering: "pixelated", transform: `scale(${Math.max(0, pop)})` }}
      />
      <div
        style={{
          fontFamily: IMPACT,
          fontSize: 54,
          color: VOID,
          background: GOLD,
          padding: "18px 64px",
          letterSpacing: "0.12em",
          transform: `scale(${Math.max(0, pop)})`,
          boxShadow: `0 0 ${24 + pulse * 28}px rgba(231,200,115,0.55), 6px 6px 0 0 rgba(10,8,16,0.9)`,
        }}
      >
        PLAY FREE
      </div>
    </AbsoluteFill>
  );
};

export const ExchangeClip: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      new FontFace(IMPACT, `url(${staticFile("fonts/Impact.ttf")})`).load(),
      new FontFace(NARROW, `url(${staticFile("fonts/ArialNarrowBold.ttf")})`).load(),
    ])
      .then((fonts) => {
        fonts.forEach((f) => (document as unknown as { fonts: FontFaceSet }).fonts.add(f));
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

  const TRADE_START = 235;
  const SCALES_IN = 96;
  const CTA_AT = 416;

  // global fades: scene → CTA
  const sceneOut = interpolate(frame, [CTA_AT - 14, CTA_AT], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scalesA =
    interpolate(frame, [SCALES_IN, SCALES_IN + 16], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * sceneOut;
  const rainA = interpolate(frame, [0, 14, 105, 130], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: VOID }}>
      {/* ── VOICEOVER SLOT ───────────────────────────────────────────────────
          Record docs/exchange-vo.md in ElevenLabs, save the mp3 to
          public/vo/exchange-vo.mp3, then uncomment:
        <Audio src={staticFile("vo/exchange-vo.mp3")} />
          (or mux it onto the rendered mp4 with ffmpeg — see docs/exchange-vo.md)
      ─────────────────────────────────────────────────────────────────────── */}

      <AbsoluteFill style={{ opacity: sceneOut }}>
        <Motes count={34} seed={71} drift={0.8} />
      </AbsoluteFill>

      {/* B1 · the grind */}
      <AbsoluteFill style={{ opacity: rainA }}>
        <GoldRain count={22} />
      </AbsoluteFill>

      {/* B2–B4 · the scales + the trade */}
      <AbsoluteFill style={{ opacity: scalesA }}>
        <Scales tradeStart={TRADE_START} />
      </AbsoluteFill>

      {/* gentle letterbox so captions sit on dark ground */}
      <AbsoluteFill
        style={{
          opacity: sceneOut,
          background:
            "linear-gradient(180deg, rgba(10,8,16,0.55) 0%, transparent 18%, transparent 64%, rgba(10,8,16,0.9) 100%)",
        }}
      />

      {/* ── loud captions (absolute-frame beats, like caption-clip.py) ─────── */}
      {/* B1 hook */}
      <Caption text="A play-to-earn MMO" font={NARROW} size={48} color={DRIFT_HI} y={0.6} at={10} out={104} />
      <Caption text="Earn gold in the Drift" size={104} color={GOLD} y={0.72} at={16} out={104} />
      {/* B2 the vault */}
      <Caption text="Bring it to the Vault" size={92} color={BONE} y={0.85} at={122} out={232} />
      <Caption text="the scales are open" font={NARROW} size={44} color={BONE_DIM} y={0.93} at={140} out={232} />
      {/* B3 the trade — two-colour centrepiece at the top, scales hold centre */}
      <Caption
        text={
          <>
            <span style={{ color: GOLD }}>GOLD</span>
            <span style={{ color: BONE_DIM }}>{"  →  "}</span>
            <span style={{ color: DRIFT_HI }}>DRIFTS</span>
          </>
        }
        size={118}
        y={0.13}
        at={242}
        out={356}
      />
      <Caption text="real · on Solana" font={NARROW} size={46} color={BONE_DIM} y={0.85} at={252} out={356} />
      {/* B4 payoff */}
      <Caption text="The grind becomes the coin" size={84} color={GOLD} y={0.85} at={362} out={412} />

      {/* B5 · CTA */}
      {frame >= CTA_AT && (
        <Sequence from={CTA_AT}>
          <AbsoluteFill style={{ background: VOID }}>
            <Motes count={22} seed={99} drift={0.6} />
            <EndCard />
            <div
              style={{
                position: "absolute",
                bottom: 64,
                left: 0,
                right: 0,
                textAlign: "center",
                fontFamily: NARROW,
                fontSize: 38,
                fontWeight: 700,
                color: BONE_DIM,
                letterSpacing: "0.08em",
              }}
            >
              NAEVYR · play free · drifts live on Solana
            </div>
          </AbsoluteFill>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
