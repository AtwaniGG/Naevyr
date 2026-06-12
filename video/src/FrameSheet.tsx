// Animates the DS SVG frame sheets (frames laid out horizontally) by cropping
// — the same trick the landing page plays with CSS steps().
import React from "react";
import { Img, staticFile } from "remotion";

export const FrameSheet: React.FC<{
  src: string;        // file under public/, e.g. "assets/gate_door.svg"
  frameW: number;     // one frame's width in sprite px
  frameH: number;
  frames: number;     // frames in the sheet
  frame: number;      // which frame to show
  scale: number;
  style?: React.CSSProperties;
}> = ({ src, frameW, frameH, frames, frame, scale, style }) => {
  const f = ((frame % frames) + frames) % frames;
  return (
    <div
      style={{
        width: frameW * scale,
        height: frameH * scale,
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: -f * frameW * scale,
          top: 0,
          width: frameW * frames * scale,
          height: frameH * scale,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
};
