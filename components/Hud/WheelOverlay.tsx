"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/game/state/store";
import { DRIFT_WHEEL_PITY } from "@/game/types";
import {
  drawGoldWheelFace, drawDarkWheelFace, wheelSegmentAngles,
  drawCacheSealed, drawCacheOpening, drawCacheBurst,
} from "@/game/render/sprites";
import { Panel, Button } from "@/components/ds";

// The Wheel, as theater: the server's roll is HELD while the DS wheel face
// (ported from _gen/wheelfaces.js, pointerless variant) spins ~3.2s and
// decelerates onto the winning segment under a fixed gold pointer. Click to
// skip. Drift Caches crack open a chest over the result.

const VOID = "#0a0810";
const SPIN_MS = 3200;
const TURNS = 5;

// server prize index → DS segment label (segment order is canonical art)
const GOLD_SEG_BY_IDX = ["house", "coin_poor", "coin_mid", "coin_rich", "drift_shard", "jackpot"];
const DARK_SEG_BY_IDX = ["common_a", "drift_a", "common_b", "drift_b", "common_c", "drift_c", "common_d", "relic"];

type Grid = { w: number; h: number; d: ({ c: string; a?: number } | null)[] };

function paintGrid(canvas: HTMLCanvasElement, g: Grid) {
  canvas.width = g.w;
  canvas.height = g.h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(g.w, g.h);
  for (let i = 0; i < g.d.length; i++) {
    const v = g.d[i];
    if (!v) continue;
    const n = parseInt(v.c.slice(1), 16);
    img.data[i * 4] = (n >> 16) & 255;
    img.data[i * 4 + 1] = (n >> 8) & 255;
    img.data[i * 4 + 2] = n & 255;
    img.data[i * 4 + 3] = Math.round((v.a ?? 1) * 255);
  }
  ctx.putImageData(img, 0, 0);
}

/** a pixel grid on a canvas (crisp, scaled by CSS) */
function GridCanvas({ grid, size, style }: { grid: Grid; size: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) paintGrid(ref.current, grid); }, [grid]);
  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, imageRendering: "pixelated", ...style }}
    />
  );
}

export default function WheelOverlay() {
  const spin = useGame((s) => s.wheelSpin);
  const setWheelSpin = useGame((s) => s.setWheelSpin);
  const [phase, setPhase] = useState<"spinning" | "landed">("spinning");
  const [rotation, setRotation] = useState(0);
  const [tick, setTick] = useState(0); // drives the 2fps shimmer + cache anim
  const raf = useRef(0);
  const t0 = useRef(0);
  const target = useRef(0);

  const kind = spin?.kind ?? "gold";
  // both shimmer frames of the DS face, pointerless (the pointer stays fixed)
  const faces = useMemo(
    () => [0, 1].map((f) =>
      (kind === "gold" ? drawGoldWheelFace(f, true) : drawDarkWheelFace(f, true)).g as unknown as Grid),
    [kind],
  );
  const cacheArt = useMemo(() => ({
    sealed: drawCacheSealed() as unknown as Grid,
    opening: [drawCacheOpening(0), drawCacheOpening(1)] as unknown as Grid[],
    burst: [drawCacheBurst(0), drawCacheBurst(1)] as unknown as Grid[],
  }), []);

  useEffect(() => {
    if (!spin) return;
    setPhase("spinning");
    // land the FIXED pointer (top, 0°) on the winning segment's center
    const labels = spin.kind === "gold" ? GOLD_SEG_BY_IDX : DARK_SEG_BY_IDX;
    const segs = wheelSegmentAngles(spin.kind === "gold" ? "gold" : "dark");
    const seg = segs.find((s) => s.label === labels[spin.seg]) ?? segs[0];
    const center = seg.start + seg.sweep / 2;
    target.current = TURNS * 360 + (360 - center);
    t0.current = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - t0.current) / SPIN_MS);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out: a real wheel's decay
      setRotation(eased * target.current);
      setTick(Math.floor((performance.now() - t0.current) / 500));
      if (t < 1) raf.current = requestAnimationFrame(step);
      else setPhase("landed");
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin]);

  // keep the shimmer/cache animating after landing
  useEffect(() => {
    if (!spin || phase !== "landed") return;
    const iv = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(iv);
  }, [spin, phase]);

  if (!spin) return null;
  const skip = () => {
    if (phase === "spinning") {
      cancelAnimationFrame(raf.current);
      setRotation(target.current);
      setPhase("landed");
    }
  };
  const face = faces[tick % 2];
  const isCache = !!spin.cache;
  const cacheGrid = phase === "spinning"
    ? cacheArt.sealed
    : tick % 4 < 2
      ? cacheArt.opening[1]
      : cacheArt.burst[tick % 2];

  return (
    <div
      className="pointer-events-auto"
      onClick={skip}
      style={{
        position: "absolute", inset: 0, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(10,8,16,0.72)",
      }}
    >
      <Panel
        kicker="The Waystation"
        title={spin.kind === "gold" ? "Wheel of the Drift" : isCache ? "A Drift Cache" : "The Drift Wheel"}
        style={{ width: 380, textAlign: "center" }}
      >
        <div style={{ position: "relative", width: 312, height: 312, margin: "4px auto 8px" }}>
          {/* the fixed pointer (the face art rotates beneath it) */}
          <div
            style={{
              position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0, zIndex: 2,
              borderLeft: "11px solid transparent",
              borderRight: "11px solid transparent",
              borderTop: "18px solid #e7c873",
              filter: `drop-shadow(0 2px 0 ${VOID})`,
            }}
          />
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              width: 312, height: 312,
              filter: phase === "landed" ? "drop-shadow(0 0 20px rgba(231,200,115,0.5))" : undefined,
            }}
          >
            <GridCanvas grid={face} size={312} />
          </div>
          {isCache && (
            <div style={{ position: "absolute", bottom: -6, right: -14, zIndex: 3 }}>
              <GridCanvas grid={cacheGrid} size={96} />
            </div>
          )}
        </div>

        {phase === "landed" ? (
          <>
            {spin.prizes.map((p, i) => (
              <div
                key={i}
                style={{
                  font: "600 13px/1.5 var(--font-ui)",
                  color: p.kind === "prestigeAura" && !p.dup ? "#d8b4fe" : "var(--text-primary)",
                  marginBottom: 2,
                }}
              >
                {p.label}
                {p.dup ? ` · again — ${p.shards} shards instead` : ""}
              </div>
            ))}
            {spin.kind === "drift" && typeof spin.pity === "number" && (
              <div style={{ font: "400 10.5px/1.4 var(--font-ui)", color: "var(--text-muted)", marginTop: 4 }}>
                {spin.pity === 0
                  ? "The wheel remembers nothing. A fresh count."
                  : `${DRIFT_WHEEL_PITY - spin.pity} dry spins until the wheel owes you a rarity.`}
              </div>
            )}
            <Button
              variant="gold"
              size="md"
              onClick={() => setWheelSpin(null)}
              style={{ marginTop: 10, minWidth: 160 }}
              autoFocus
            >
              Take it
            </Button>
          </>
        ) : (
          <div style={{ font: "italic 400 12px/1.4 var(--font-ui)", color: "var(--text-secondary)" }}>
            Round she goes… (click to skip)
          </div>
        )}
      </Panel>
    </div>
  );
}
