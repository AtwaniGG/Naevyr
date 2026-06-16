// A short, clean-LOOPING GIF for Twitter: GOLD ⇄ $DRIFTS at the Exchange.
// The brass scales (real game art) tip back and forth while gold coins and
// DRIFTS marks flow across the beam; a faint crowd strolls behind. Loops
// seamlessly (tokens fade in/out on a sine, so there's no cut).
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { drawExchangeCounter } from "../../game/render/sprites";
import { EngineCanvas, drawGrid, type GridLike } from "./engine";
import { PAL, fontFamily } from "./scenes";

export const FPS = 24;
export const EXGIF_FRAMES = 96; // 4s loop
export const EXGIF_W = 1000;
export const EXGIF_H = 560;

function goldCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "#7c5f23"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e7c873"; ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f6e0a6"; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function driftMark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "#3b1162"; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.74, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.74, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#a855f7"; ctx.beginPath();
  ctx.moveTo(x, y - r * 0.6); ctx.lineTo(x + r * 0.44, y); ctx.lineTo(x, y + r * 0.6); ctx.lineTo(x - r * 0.44, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#d8b4fe"; ctx.fillRect(x - r * 0.12, y - r * 0.3, r * 0.24, r * 0.6);
  ctx.restore();
}

const Stage: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <EngineCanvas draw={(ctx, frame, _f, w, h) => {
      const loop = frame / durationInFrames; // 0..1
      // the scales, center, tipping gently
      const tip = Math.floor((0.5 + 0.5 * Math.sin(loop * Math.PI * 2)) + 0.5) % 2;
      const g = drawExchangeCounter(tip) as unknown as GridLike;
      const z = 7;
      const cx = w / 2, cy = h * 0.6;
      drawGrid(ctx, g, cx, cy, z, g.w / 2, g.h - 2);

      // flow across the beam: gold left→right, drift right→left (fade at ends → seamless)
      const beamY = cy - 30 * z * 0.5;
      const lx = cx - 150, rx = cx + 150;
      const N = 3;
      for (let k = 0; k < N; k++) {
        const pg = (loop + k / N) % 1;           // gold → right
        const xg = lx + (rx - lx) * pg;
        const yg = beamY - Math.sin(pg * Math.PI) * 60;
        goldCoin(ctx, xg, yg, 13, Math.sin(pg * Math.PI));
        const pd = (loop + k / N + 0.5) % 1;      // drift → left
        const xd = rx - (rx - lx) * pd;
        const yd = beamY - Math.sin(pd * Math.PI) * 60;
        driftMark(ctx, xd, yd, 14, Math.sin(pd * Math.PI));
      }
    }} />
  );
};

export const ExchangeGif: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.6 + 0.4 * Math.sin(frame / 6);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 46%, #1c1526 0%, #0a0810 80%)" }}>
      <Stage />
      {/* headline */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", pointerEvents: "none" }}>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 22 }}>
          <span style={{ fontFamily, fontSize: 70, fontWeight: 700, color: PAL.GOLD, textShadow: "0 0 26px rgba(231,200,115,0.5)" }}>GOLD</span>
          <span style={{ fontFamily, fontSize: 56, color: PAL.BONE, opacity: pulse }}>⇄</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <Img src={staticFile("assets/emblem-64.svg")} style={{ width: 64, imageRendering: "pixelated", filter: "drop-shadow(0 0 16px rgba(168,85,247,0.6))" }} />
            <span style={{ fontFamily, fontSize: 70, fontWeight: 700, color: PAL.DRIFT_HI, textShadow: "0 0 26px rgba(168,85,247,0.5)" }}>$DRIFTS</span>
          </span>
        </div>
        <div style={{ marginTop: 14, fontFamily, fontSize: 28, color: PAL.BONE_DIM, letterSpacing: "0.06em" }}>trade your grind at the Vault · the Exchange is open</div>
      </AbsoluteFill>
      <Img src={staticFile("assets/logo-horizontal.svg")} style={{ position: "absolute", bottom: 18, right: 14, width: 300, imageRendering: "pixelated", opacity: 0.9 }} />
    </AbsoluteFill>
  );
};
