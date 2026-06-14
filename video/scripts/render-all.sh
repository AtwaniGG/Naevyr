#!/bin/bash
# Render every social clip to out/. Run from video/.
set -e
cd "$(dirname "$0")/.."

render() { # <compositionId> <outfile>
  echo "▶ rendering $1 -> out/$2"
  npx remotion render "$1" "out/$2" --log=error 2>&1 | tail -2
}

render WheelClip        naevyr-wheel.mp4
render CosmeticsClip     naevyr-cosmetics.mp4
render BattlePassClip    naevyr-battlepass.mp4
render Building-Dyeworks naevyr-dyeworks.mp4
render Building-Vault    naevyr-vault.mp4
render Building-Lantern  naevyr-lantern.mp4
render Building-Furnisher naevyr-furnisher.mp4
render Building-Menagerie naevyr-menagerie.mp4
render Building-Mine     naevyr-mine.mp4
render Building-Mirewife naevyr-mirewife.mp4
echo "✅ all clips rendered"
