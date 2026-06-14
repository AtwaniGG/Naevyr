# Naevyr Roadmap · Claude Code handoff

A single self-contained artifact: `Naevyr Roadmap.html`. Open it in a browser to
preview. Everything is inline (no build step, no external files except Google Fonts).
This doc tells Claude Code how to lift it into a Next.js client component.

## What it is
An interactive roadmap: a winding trail the visitor walks *into* "the Drift."
Near milestones are bright and gold; far ones dim, purple, and half-swallowed.
Scroll / drag / wheel / arrow keys move along it; clicking a waystation reveals its
detail card. Desktop = horizontal journey, mobile = vertical descent.

## The only data you edit for content
All copy lives in one array near the top of the `<script>`:

```js
const MILES = [ { n, title, status, near, tag, lede, items[], foot }, ... ];
```

- `near: true` flips a milestone to the gold treatment (currently only milestone I).
- Visual "corruption" of far nodes is automatic via `clarity(i) = max(0.42, 1 - i*0.155)`.

## The pieces to port
The logic is plain DOM, no framework. Keep these functions intact; they are the artifact:

- `buildNodes()` / `buildRail()` — generate markup from `MILES`. In React, replace with JSX `.map`.
- `layout()` — positions nodes and picks horizontal vs. vertical based on `window.innerWidth <= 760`.
- `drawLine()` + `smoothPath()` — build the Drift SVG path (Catmull-Rom). Pure geometry, lift as-is.
- `onScroll()` — derives `progress` (0..1) and drives fog, dither, parallax, active node, rail.
- `drawParticles()` / `loop()` — canvas drift field; density ramps with `progress`.
- `ridgePath()` — parallax ridge silhouettes.

## Next.js client component steps
1. Create `app/roadmap/RoadmapClient.tsx` with `'use client'` at the top.
2. Move `MILES` out to `lib/roadmap-data.ts` (typed).
3. Render the nodes/rail with JSX instead of `buildNodes()`/`buildRail()`. Keep the
   class names and DOM shape so the CSS still applies.
4. Move the `<style>` block to a CSS module or `globals.css`. The `:root` custom
   properties are the design tokens (palette + font stacks) — keep them.
5. Put `layout`, `drawLine`, `onScroll`, `drawParticles`, `ridgePath` inside a single
   `useEffect(() => { ... ; return cleanup; }, [])`. Wire listeners there and remove
   them in the cleanup (scroll, wheel, pointer, resize, visibilitychange).
6. Use refs for `trail`, `track`, `#line`, `#particles`, `#fog`, `#dither`, the ridges,
   and the meter, instead of `getElementById`.
7. Respect `prefers-reduced-motion` exactly as the artifact does (`reduced` flag gates
   the rAF loop, line flow, and the pulse).

## Fonts
Loaded from Google Fonts in `<head>`: Silkscreen (UI + brandmark), Space Mono (body),
Jacquard 12 (one decorative endcap glyph only). In Next.js prefer `next/font/google`
for Silkscreen + Space Mono; Jacquard is optional (used for one ❖ glyph).

## Design tokens (from `:root`)
```
void #0a0810 · corruption #a855f7 / #7c3aed · faint fill rgba(124,58,237,0.05)
border rgba(124,58,237,0.18) · gold #e7c873
text #d8cfe0 · secondary #a99fb8 · muted #6f6781
```

## Voice rules (keep when adding copy)
Dark-fantasy laconic. No em dashes (use periods, commas, or "·"). No emoji; pixel/SVG
iconography only. Status reads in-world ("Nearly here", "Planned", "Forming", "Tuning",
"Always"), never "Q3".

## Performance notes
- Particle count is capped (~140) and only "awake" particles inside the drift band draw.
- Canvas is viewport-sized (not track-sized) and uses crisp `fillRect`, no blur.
- Scroll handler is rAF-throttled. Loop pauses on `visibilitychange` when hidden.
