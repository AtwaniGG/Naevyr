---
name: driftlands-design
description: Use this skill to generate well-branded interfaces and assets for DriftLands — a dark-fantasy isometric play-to-earn pixel-art MMO — for production or throwaway prototypes/mocks. Contains the pixel-art design guidelines, palette ramps, type, fonts, the pixel icon set, and HUD UI-kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill first — it is the full pixel-art design guide and
manifest (logo, art direction, master palette, tileset/node/character/FX specs, the HUD/UI
system, and handoff). Then explore the other files as needed.

**Core rule:** everything is **true pixel art** — hard edges, no anti-aliasing, dithering not
blur, corner notches not rounded corners, stepped animation. The Drift's glowing purple is the
signature accent; use it sparingly.

- **Tokens:** link `styles.css` (it `@import`s `tokens/`). Use the `drift.*` base colours and
  material ramps; never invent new hues. Effects live in `tokens/effects.css`
  (`--clip-notch`, bevels, stepped `--glow-corrupt-*`, dither).
- **Components:** load `_ds_bundle.js`, read `window.DriftLandsDesignSystem_3de3e2.<Name>`
  (`Panel`, `Button`, `Badge`, `SeasonBadge`, `Slot`, `Hotbar`, `XPBar`, `ActivityLog`,
  `Icon`). Each component dir has a `.prompt.md` with usage.
- **Icons:** use the `Icon` pixel set (`<Icon name="axe" size={32} />`). Don't substitute
  smooth icon-library glyphs — author new icons on the 16×16 grid instead.
- **World art:** for sprites you can't draw inline, use the generation prompts in `readme.md`
  §9 (transparent bg, no anti-aliasing, limited palette, iso 2:1, exact px).

If creating visual artifacts (slides, mocks, throwaway prototypes), copy the assets/icons out
and produce static HTML for the user to view. If working on production code, copy assets and
apply the rules here to design natively with the brand. If the user invokes this skill without
guidance, ask what they want to build, ask a few focused questions, and act as an expert
DriftLands designer who outputs HTML artifacts **or** production code as needed.
