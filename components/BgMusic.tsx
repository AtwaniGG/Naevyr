"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Looping realm score for the landing site. Lives in the root layout so it
// survives client-side navigations between landing pages (no restart on every
// route change). Auto-pauses inside /play — the engine owns its own WebAudio
// in there. Kept deliberately quiet (0.3); browsers block autoplay-with-sound,
// so it stays silent until the wanderer asks for it via the corner toggle, and
// the choice is remembered.

const KEY = "naevyr-music";
const VOLUME = 0.078; // very quiet · the realm hums, it does not shout (was 0.156, -50%)

export default function BgMusic() {
  const path = usePathname();
  const inGame = path?.startsWith("/play") ?? false;
  const ref = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);

  // restore the saved preference once mounted (localStorage is client-only)
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "on") setOn(true);
    } catch {
      /* private mode · ignore */
    }
  }, []);

  // drive the element: play while ON and out of the game, pause otherwise
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = VOLUME;
    if (on && !inGame) {
      void a.play().catch(() => {
        /* autoplay blocked until a gesture · the toggle click counts */
      });
    } else {
      a.pause();
    }
  }, [on, inGame]);

  if (inGame) return null;

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <audio ref={ref} src="/audio/naevyr-bg.mp3" loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        aria-label={on ? "Silence the realm" : "Hear the realm"}
        title={on ? "Silence the realm" : "Hear the realm"}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 60,
          width: 40,
          height: 40,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          cursor: "pointer",
          color: on ? "var(--drift-gold, #e7c873)" : "var(--text-secondary, #9a8fb0)",
          background: "rgba(10, 8, 16, 0.86)",
          border: "1px solid rgba(124, 58, 237, 0.45)",
          borderRadius: 999,
          backdropFilter: "blur(3px)",
          lineHeight: 0,
        }}
      >
        <SpeakerGlyph on={on} />
      </button>
    </>
  );
}

// crisp pixel-style speaker (sound waves when on, a slash when off)
export function SpeakerGlyph({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M2 6h3l4-3v12l-4-3H2z" fill="currentColor" />
      {on ? (
        <>
          <path d="M11 6h1v6h-1z" fill="currentColor" />
          <path d="M13 4h1v10h-1z" fill="currentColor" opacity="0.75" />
          <path d="M15 2h1v14h-1z" fill="currentColor" opacity="0.5" />
        </>
      ) : (
        <path d="M11 5l5 8M16 5l-5 8" stroke="currentColor" strokeWidth="1.4" fill="none" />
      )}
    </svg>
  );
}
