# The Exchange clip — voiceover

The clip `out/naevyr-exchange.mp4` (16.0s, 1920×1080 @ 30fps) renders **silent**,
with a voiceover slot already wired. Record the script below in ElevenLabs, then
add it one of two ways.

## The script (~16s, dark-fantasy laconic)

Voice direction: low, measured, a touch ominous. Let the "…" breathe. Say
**DRIFTS** as a word ("drifts"), and **Solana** plainly. No rush — the lines are
timed to land on the caption beats.

| time | line | lands on |
|------|------|----------|
| 0.0 – 3.5s | "Every coin you tear from the Drift… is finally worth something." | gold rain · EARN GOLD IN THE DRIFT |
| 3.5 – 7.7s | "Carry your gold to the Vault. The scales are open." | the scales · BRING IT TO THE VAULT |
| 7.7 – 12.0s | "Trade it for DRIFTS. Real, on Solana." | the trade · GOLD → DRIFTS |
| 12.0 – 13.7s | "The grind becomes the coin." | payoff glow |
| 13.7 – 16.0s | "Naevyr. Play free." | end card · PLAY FREE |

Plain text for the ElevenLabs box:

> Every coin you tear from the Drift… is finally worth something.
> Carry your gold to the Vault. The scales are open.
> Trade it for DRIFTS. Real, on Solana.
> The grind becomes the coin.
> Naevyr. Play free.

Alt hooks if the first line runs long: "Your gold was never just gold." /
"You earned it. Now it's worth something."

## Adding the VO

Save the ElevenLabs file as `video/public/vo/exchange-vo.mp3`, then EITHER:

**A. Re-render with the audio baked in** (cleanest)
1. In `src/ExchangeClip.tsx`, uncomment the `<Audio src={staticFile("vo/exchange-vo.mp3")} />` line in the VOICEOVER SLOT block.
2. `cd video && npx remotion render ExchangeClip out/naevyr-exchange.mp4`

**B. Mux onto the existing silent mp4** (no re-render — mirrors the pvp flow)
```bash
cd video
ffmpeg -y -i out/naevyr-exchange.mp4 -i public/vo/exchange-vo.mp3 \
  -c:v copy -c:a aac -shortest out/naevyr-exchange.mp4.tmp.mp4 \
  && mv out/naevyr-exchange.mp4.tmp.mp4 out/naevyr-exchange.mp4
```

Optional: a quiet music bed under the VO (uses the trailer score):
```bash
cd video
ffmpeg -y -i out/naevyr-exchange.mp4 -i public/vo/exchange-vo.mp3 -i public/music.mp3 \
  -filter_complex "[2:a]volume=0.22,atrim=0:16[bed];[1:a][bed]amix=inputs=2:duration=first:dropout_transition=0[a]" \
  -map 0:v -map "[a]" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest \
  out/naevyr-exchange-vo.mp4
```

## Re-timing

Caption beats and the trade timing live at the top of `src/ExchangeClip.tsx`
(`TRADE_START`, `SCALES_IN`, `CTA_AT`, and each `<Caption at=… out=…>` in frames
@30fps). Change a number, re-render. If you re-time, re-cut the VO table above to match.
