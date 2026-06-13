// Viewport awareness: one source of truth for "are we on a phone, is it
// portrait, is this a touch device". Used by the engine (input binding,
// default zoom — via the non-React `viewport` singleton) AND by the HUD
// (which renders MobileHud instead of the desktop tree — via `useViewport`).
//
// Desktop is the default and is NEVER affected: isPhone only flips true on a
// coarse pointer AND a narrow viewport, so a small desktop window stays on the
// desktop HUD.

import { useSyncExternalStore } from "react";

export interface Viewport {
  /** coarse pointer (finger) — true on phones/tablets, false on mouse */
  isTouch: boolean;
  /** narrow viewport AND touch — the trigger for the mobile HUD shell */
  isPhone: boolean;
  /** taller than wide */
  isPortrait: boolean;
}

const PHONE_MAX = 768; // px; below this (and touch) we treat as a phone

function read(): Viewport {
  if (typeof window === "undefined") {
    return { isTouch: false, isPhone: false, isPortrait: true };
  }
  const isTouch =
    window.matchMedia?.("(pointer: coarse)").matches ??
    "ontouchstart" in window;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    isTouch,
    isPhone: isTouch && w <= PHONE_MAX,
    isPortrait: h >= w,
  };
}

/** non-React singleton the engine reads each frame / on input. */
export const viewport: Viewport = read();

const listeners = new Set<() => void>();
let snapshot: Viewport = viewport;

function recompute() {
  const next = read();
  Object.assign(viewport, next); // keep the singleton identity stable
  if (
    next.isTouch !== snapshot.isTouch ||
    next.isPhone !== snapshot.isPhone ||
    next.isPortrait !== snapshot.isPortrait
  ) {
    snapshot = next;
    listeners.forEach((l) => l());
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("resize", recompute);
  window.addEventListener("orientationchange", recompute);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnap: Viewport = { isTouch: false, isPhone: false, isPortrait: true };

/** React hook: re-renders when phone/portrait/touch state changes. */
export function useViewport(): Viewport {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnap,
  );
}
