# Naevyr — Frontier World Expansion (40×40 → 80×80)

Two drop-in art packs, one tree. Extract over `design-system.nosync/` — subfolders and `_gen/`
merge into the existing Naevyr packs. Everything is RAMP-only, 1px `#0a0810` void outline
(drift-corruption FX un-outlined), dither-not-blur, iso 64×32, bottom-center anchors. Each asset
ships a `_gen/<name>.js` generator + `.svg` export(s) + `.json` metadata.

## Pack 1 — Structures  (see `frontier-readme.md`)
`waystation/` fast-travel monolith (+ HUD pip) · `camps/` Drowned Ruins · Barrow-Crypt ·
Ashen Warcamp · `crypt/` dungeon floor + 5 fixtures · `outpost/` palisade gate · trading post ·
watchtower · `frontier/` ash/corruption ground accents + drift-crystal / ash-dune / scorched-stump.

## Pack 2 — Creatures & Events  (see `creatures-readme.md`)
`mobs/` Bogwretch · Barrow Wight (+ Bone Husk) · Ash Brute · Drift Wisp (+shadow) + bog-spit /
drift-bolt / ash-shockwave FX · `beasts/` mini-bosses Drowned King · Barrow Lord · Ash Warlord
(+ portraits) · `avatars/` Driftwarden (5th avatar, 2 channels, portrait + option strips) ·
`npcs/` Quartermaster · Scout · Hermit (+ portraits) · `events/` Drift Rift · rift mote ·
Blood Moon · blood-aura ring · blood-sky gradient.

## Layout
```
_gen/        generators for both packs (eval after the base pixlib/tiles/beasts/… libs)
waystation/ camps/ crypt/ outpost/ frontier/      ← structures
mobs/ beasts/ avatars/ npcs/ events/              ← creatures & events
frontier-preview.html   creatures-preview.html    ← @dsCard preview boards
frontier-readme.md      creatures-readme.md        ← per-pack manifests + accent→ramp maps
```
Rig/dimensional conventions and the full accent-hex → ramp maps are in the two per-pack readmes.
