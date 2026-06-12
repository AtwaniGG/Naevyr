# Naevyr rename + DRIFTS demand sinks — design spec

Date: 2026-06-12
Status: APPROVED, queued for execution on the user's "go" signal. Do NOT start
any of this before the user says "go".

This batch ships with the **beta launch / deploy** window. All token work is
devnet DRIFTS (mainnet only on explicit go-ahead, unchanged).

---

## 0. Trigger / preconditions

- The user will say **"go"**. On "go", execute everything below autonomously,
  verify per CLAUDE.md workflow rules, and report what's verified vs. caveats.
- First step on "go": extract the art zip. NOTE: it arrived (2026-06-12) as
  `public/assets/Naevyr Design System.zip.zip` (double `.zip`). Extract per the
  CLAUDE.md art workflow:
  `rm -rf public/assets/design-system.nosync && unzip -o
  "public/assets/Naevyr Design System.zip.zip" -d
  public/assets/design-system.nosync`.
- CONFIRMED contents (inspected pre-go): 4 prestige auras present
  (`assets/auras/ashen_crown|corruption_halo|ember_cinder|bonewisp` + JSON +
  `_gen/auras.js` generator with `drawAshenCrown/CorruptionHalo/EmberCinder/
  Bonewisp`, frames 8/6/6/8) and the renamed wordmark/landing set
  (`assets/landing/wordmark_plate.svg`, `assets/brand/logo-*`).
- TWO CLEANUPS during the sweep: (a) the package still has RESIDUAL
  "Driftlands"/"DriftLands" strings in `readme.md` and `_ds_manifest.json` —
  scrub them. (b) VERIFY by eye that `wordmark_plate.svg` and `logo-*.svg`
  actually render "NAEVYR" (pixel rects, can't grep) before wiring them into
  the landing.

---

## 1. Brand rename sweep (Driftlands -> Naevyr)

Scope = ~30 files, ~75 occurrences (measured 2026-06-12).

DO rename (tiers 1 & 2 — visible brand, safe):
- All copy/comments/UI strings, README, CLAUDE.md, docs/whitepaper, landing
  wordmark text, `package.json` name (`driftlands-server` etc.),
  design-system folder/zip references.
- Casing-preserving: `DriftLands` -> `Naevyr`, `Driftlands` -> `Naevyr`,
  `driftlands` -> `naevyr`.

DO NOT rename (tier 3 — runtime risk; keep as `driftlands-`):
- localStorage keys: `driftlands-save-v*`, `driftlands-gate-wallet`,
  `driftlands-gate-proof`, `driftlands-device`, `driftlands-sound`, and any
  other `driftlands-*` storage keys. Renaming wipes existing local saves /
  cleared-gate wallets / settings. Leave them; migrate later with a
  fallback-read if ever wanted.
- The `server/.data/driftlands.nosync/` PGlite data dir (renaming orphans the
  local cluster).

NEVER rename (different concepts):
- **DRIFTS** — the currency. Stays.
- **"the Drift"** — the corruption mechanic. Stays.
- The DRIFTS coin emblem / `.drifts-mark` art. Stays.

Verify after: `npx tsc --noEmit` (client) + `cd server && npx tsc --noEmit -p
tsconfig.json` + `npm run build` (stop dev first). Spot-check landing + docs
render.

---

## 2. DRIFTS — 50/50 fee-split rail (revenue spine)

Today every burn is 100% destroyed. Change to **50% burn / 50% treasury** on
ALL DRIFTS sinks.

- Treasury = new env var `TREASURY_ADDRESS`, a Solana wallet the user owns.
  **RECEIVE-ONLY**: it only receives DRIFTS, never signs/sends, so NO managed
  secret / keypair on the server. Low-risk, doesn't block beta.
- **UNSET FALLBACK (decided 2026-06-12):** when `TREASURY_ADDRESS` is unset,
  every sink stays **100% burn** (today's exact behavior) — no transfer leg,
  `consumeBurn` verifies a single burn. Setting the env var flips the rail to
  50/50 with zero logic redeploy. This keeps build + all verify suites green
  without a treasury wallet. User will provide the address later.
- Extend the burn tx builder in `server/src/solana.ts`: instead of a single
  `burnChecked(amount)`, emit `burnChecked(ceil(amount/2))` +
  `transfer(floor(amount/2) -> treasury ATA)`. Round burn UP, treasury DOWN so
  the player never under-pays the burn check.
- Extend `consumeBurn` verification: confirm BOTH legs on-chain (correct burn
  amount to the mint AND correct transfer to the treasury ATA), keeping the
  existing insert-first replay protection.
- All existing sinks (wheel spin, claim, buyAura, shrine cleanse donate,
  obelisk) share the rail -> they flip to 50/50 automatically. Verify each via
  the relevant verify-*.ts (burns, town, claims, etc.).
- Regulatory framing: treasury = "protocol fee funding development," NEVER
  "revenue shared with holders." Keep all user-facing copy in that voice.

Future (NOT this batch): treasury funds manual buyback-and-burn + the planned
gold<->DRIFTS Exchange. The flywheel is sinks -> treasury -> buyback-and-burn.

---

## 3. DRIFTS — Reinforce claim vs. the Drift (new sink)

- New burn rail on the existing protocol (`burnQuote` -> wallet signs ->
  `consumeBurn` (now 50/50) -> apply server-side).
- Effect: at a claimed tile the player owns, burning ~**2 DRIFTS** pushes the
  claim's erosion clock back by one erosion cycle (delay, NOT permanent
  immunity — land stays contestable). Cap stacking so it can't be made
  permanent.
- `claimSync` the new timer to everyone. Cost in `BURN_COSTS`.
- Art: in-engine ward-glow / shield shimmer over reinforced tiles
  (hand-built one-off in style; no Design dependency).
- Verify: extend `verify-claims.ts` (reinforce extends erosion, 50/50 split
  observed, cap respected, persists).

---

## 4. DRIFTS — Hold-only cosmetics & titles (new sinks)

- New catalog entries flagged `driftsOnly` (obtainable ONLY by burning DRIFTS,
  never gold):
  - Cloak dyes / eye glows = code RAMP color values (no art).
  - Titles = text only (e.g. "Ashgilded", "Drift-Marked"). No art.
  - Prestige auras = the Design-delivered set (see §5). Engine-ported.
- Surfaced at the **Dyeworks keeper** under a "Drift-touched" section that only
  shows for holders. Owned/persisted/synced like existing cosmetics so others
  see the flex.
- Costs in `BURN_COSTS`, tiered (e.g. 3 dye / 5 aura / 8 title) for a whale
  spend ladder. All on the 50/50 rail.
- Verify: extend `verify-burns.ts` / town suite (driftsOnly items gate on
  holder, burn 50/50, cosmetic persists + syncs).

### DEFERRED: gold<->DRIFTS Exchange (post-deploy, NOT this batch)

Decided 2026-06-12: defer the full Exchange until after deploy (proper secret
management). The insight to carry into that batch — it has TWO directions with
very different risk:
- **Direction A — spend DRIFTS -> get gold:** incoming DRIFTS only, verified
  on-chain like burns. NO new secret; could ride the 50/50 rail. Safe.
- **Direction B — sell gold -> receive DRIFTS (cash-out):** the demand driver,
  but requires the server to SEND DRIFTS from an escrow wallet = a HOT SIGNING
  KEYPAIR (managed secret) on the server. Payouts only from buyer-funded escrow
  (never a house faucet), daily caps by holdings, fixed rate not an order book.
  This is why the whole Exchange waits for post-deploy secret management.

---

## 4a. Public burn + treasury counter

- Live scarcity stat on the **landing** and in the **docs/whitepaper**:
  "N DRIFTS burned forever" and "M DRIFTS to the keep (treasury)".
- Read from the existing `burns` table aggregate (same server plumbing as
  `/leaderboard`). Add a `GET /stats` (or extend `/leaderboard`) returning
  `{ burnedTotal, treasuryTotal, sinkCounts }`. While `TREASURY_ADDRESS` is
  unset, `treasuryTotal` = 0 and burned = full amounts (matches the 100%-burn
  fallback in §2).
- Surfaced via `LandingShell` (a stat chip) and the whitepaper's tokenomics
  chapter (live numbers, not hardcoded). Dark-fantasy voice ("burned to ash").

## 4b. Limited "Founder" beta cosmetic (FOMO buy-pressure)

- A one-time prestige title + aura granted ONLY to players who burn DRIFTS
  during the beta window; never obtainable after the window closes.
- Window controlled by env `FOUNDER_UNTIL` (unix ms or ISO; unset = feature
  off so suites stay clean). Server stamps a `founder` flag on the player row
  the first time a burn confirms while `now < FOUNDER_UNTIL`.
- Reuses the `driftsOnly` cosmetic rail (§4) for the title/aura; the Founder
  aura is one of the prestige auras from Design (pick one, e.g. Ashen Crown) or
  a recolor reserved for founders. Owned/persisted/synced like other cosmetics.
- Verify: extend verify-burns (a burn inside the window sets `founder`; outside
  the window does not; flag persists across reconnect).

## 4c. Whitepaper / tokenomics rewrite (THOROUGH, EXACT — not a summary)

The `/docs` whitepaper tokenomics chapter(s) must be REWRITTEN in full, not
patched. Requirements (user-specified 2026-06-12): **thorough, exact, with
numbers and formulas.** Where a table can be generated from a shared catalog
(as the holder-tier table already is from `HOLDER_TIERS`), generate it so it
can't go stale. The rewrite MUST include, with exact values:

1. **Token identity & supply** — name DRIFTS, devnet now / pump.fun mainnet on
   go-ahead, `NEXT_PUBLIC_TOKEN_MINT`. State the supply model exactly (pull the
   real figure when the mint is set; do not invent — mark TODO if unknown at
   write time, but everything else must be exact).
2. **The 50/50 fee-split rail — with formula.** For a sink of cost `c` DRIFTS:
   `burned = ceil(c/2)`, `treasury = floor(c/2)`. State the unset-treasury
   fallback (`treasury=0`, `burned=c`). Worked examples for each sink cost.
3. **Full sink table — exact DRIFTS costs:**
   - Wheel spin: 1 DRIFTS
   - Land claim: 5 DRIFTS (auto for holders in claim mode)
   - Dyeworks aura (`buyAura`): 3 DRIFTS
   - Shrine cleanse donation: 2 DRIFTS (also +150g to the pot)
   - Obelisk (quest reroll / blessing): 1 DRIFTS
   - Reinforce claim (NEW, §3): 2 DRIFTS per erosion cycle delayed
   - Hold-only cosmetics (NEW, §4): dye 3 / aura 5 / title 8 DRIFTS
   For each: show burned vs treasury under the 50/50 split.
   (Source of truth = `BURN_COSTS`; render the table from it if feasible.)
4. **Entry gate** — exact threshold: hold >= `GATE_TOKENS` (prod 1000) to play;
   signature-proven; dev/suites GATE_TOKENS=0.
5. **Holder tiers — exact thresholds & every perk** (from `HOLDER_TIERS`/
   `holderPerks`): Keeper 10,000 / Warden 100,000 / Drift Lord 1,000,000.
   Perks with exact numbers: claim slots 3->4/5/6; market stalls 6->8/10/12;
   vault fee 2%->1%/0.5%/0%; rich-strike odds 10%->12%/15%/20%; caravan payout
   weight x1/x1.1/x1.25/x1.5 (weighted split of the SAME pool — zero inflation;
   state that explicitly). Render from the catalog.
6. **Demand drivers & the flywheel — stated mechanically:** sinks consume
   DRIFTS -> 50% burned (deflation) + 50% to treasury -> treasury funds
   buyback-and-burn + the future gold<->DRIFTS Exchange. Make the loop explicit;
   no promises of price/returns.
7. **Wheel EV / house-edge math** (it is a SINK): ~42.5g gold + ~0.16 shards
   per 50g spin, house edge ~10-15% (show the WHEEL odds math from DriftRoom).
8. **Burn/treasury transparency** — reference the live counter (§4a).
9. **Regulatory framing — exact and prominent:** utility + sink + governance,
   NOT an investment, no guaranteed returns, "market price can fall to zero,"
   treasury = "protocol fee funding development," never "revenue shared with
   holders." Keep the existing launch-day disclaimer copy, expanded.

Style: dark-fantasy laconic, no em dashes, "DRIFTS" everywhere (never "token"/
"coin"). Numbers and formulas exact; if a value is genuinely unknown at write
time (e.g. mainnet supply), mark it an explicit TODO rather than guessing.

---

## 5. Art from Design (in the zip)

Single zip ("Naevyr Design System.zip") covers:

a. **Wordmark name-swap** — `logo-horizontal`, `logo-stacked`,
   `wordmark_plate` (320x96, 2f) + `-mono` variants, "NAEVYR" replacing
   "Driftlands", same palette/dims/specs. Plus an everywhere-replace of the
   name throughout the package (`_gen` filenames/strings, readme, tokens,
   preview HTML, JSON, layer names). DRIFTS coin emblem UNTOUCHED. Wordmark is
   DOM art (SVG exports + CSS steps()), not an engine port.

b. **3-4 prestige auras** — orbiting-mote effects around the 32x40
   bottom-center wanderer, ~64x64 canvas with anchor offset, RAMP ramps
   (drift/ember/gold/bone/blood/ash), animated 4-8f loops, frame-by-frame
   export with per-frame x offsets. Concepts: Ashen Crown, Corruption Halo,
   Ember Cinder, Bonewisp. Generators in `_gen/`, exports in `assets/auras/`,
   JSON metadata (dims, anchor offset, frame count, fps, ramp). Port to TS in
   `game/render/sprites.ts` through the existing `drawChar` aura baking path;
   register, extend `smoke-sprites.ts`, byte-diff vs exports.

---

## Execution order on "go" (rearranged 2026-06-12: brand rename LAST)

1. Check/extract the art zip.
2. Port the prestige auras (engine, §5b) -> smoke-sprites + byte-diff. (Early
   because the hold-only cosmetics in step 5 consume them. The NAEVYR wordmark
   wiring waits for step 7.)
3. 50/50 rail (§2) -> verify-burns + affected suites.
4. Reinforce-claim sink (§3) -> verify-claims.
5. Hold-only cosmetics/titles (§4) -> verify-burns/town.
6. Burn/treasury counter (§4a) + Founder beta cosmetic (§4b) -> verify-burns.
7. Brand rename sweep (§1) + wire the NAEVYR wordmark into the landing (§5a)
   + whitepaper/tokenomics rewrite (§4c — thorough, exact, formulas; it
   documents the new sinks from steps 3-6, so it must come after them).
8. Full typecheck both sides + build. Report verified vs. caveats.

Accepted constraints unchanged: token stays devnet; treasury receive-only;
storage keys/data dir keep the `driftlands-` prefix.
