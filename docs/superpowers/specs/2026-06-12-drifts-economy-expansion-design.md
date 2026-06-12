# DRIFTS economy expansion — design spec (numbers are canonical)

Date: 2026-06-12 · Status: APPROVED, building now.
Scope: Drift Wheel + Drift Caches (gacha cosmetics) · wheel spin ANIMATION ·
Guild territory (recurring social sink) · gold↔DRIFTS Exchange · P2P prestige
marketplace · whitepaper rewrite with exact numbers · Claude Design prompt.

**The anchor:** the live economy already implies **100 DRIFTS ≈ 1 gold**
(Wheel: 5,000◆ burn vs 50g spin; Claim: 25,000◆ vs 250g). Every new number
below derives from that anchor. ◆ = DRIFTS.

---

## 1. The Drift Wheel (gacha cosmetics) + Drift Caches

A SECOND wheel at the Wheel of the Drift keeper, paid only in DRIFTS burns
(50/50 split applies like every sink). Pays cosmetics/items, **never DRIFTS**
(no faucet, no gambling-for-money optics).

- **Cost:** `driftSpin` = **5,000◆** per spin.
- **Drift Cache:** `cache` = **12,000◆** = 3 spins bundled (20% off 15k).
- **Prize table** (`DRIFT_WHEEL` in types.ts — shared so docs render from it):

| p | prize | duplicate converts to |
|---|---|---|
| 30% | 2 Drift Shards | — |
| 22% | random cloak dye (gold catalog) | 3 shards |
| 15% | random eye glow | 3 shards |
| 12% | 6 Drift Shards | — |
| 10% | random legacy aura (driftmote/emberwake/goldhalo) | 6 shards |
| 6% | random pet (wisp/crow/emberling) | 6 shards |
| 4% | title "Wheelturned" (once) | 10 shards |
| 1% | **random Drift-touched prestige aura** (grants server-side prestige ownership) | 15 shards |

- **Pity:** `players.wheel_pity` counts spins since the last aura-or-better
  (10%/6%/4%/1% tiers). At **12** dry spins the next spin is FORCED to roll
  within the aura-or-better band (re-normalized odds 10/6/4/1 → 47.6/28.6/19/4.8%).
  Pity resets on any aura-or-better hit.
- Long-run EV ≈ 4-5 shards/spin (~60-75g) per 5,000◆ (~50g) once cosmetics
  dedupe — a sink with cosmetic upside, not a faucet.
- Server-rolled; prizes land on the ledger (`invSync`) / cosmetic grants ride
  `driftSpinResult {prize, key?, pity}`. Cache = 3 independent rolls, one
  result message (`cacheResult {prizes:[…]}`), pity shared across rolls.

## 2. Wheel spin ANIMATION (gold + DRIFTS wheels)

HUD overlay (`WheelOverlay` component): on any spin the server result arrives
immediately but is HELD; a popup wheel (procedural canvas/CSS — DS palette,
segments labeled) spins ~3.2s with ease-out deceleration, lands on the actual
result segment, flashes, then the prize line + log. Skippable on click.
Gold wheel segments = the 6 WHEEL outcomes; Drift Wheel = the 8 tiers.

## 3. Guilds + territory (recurring structural sink)

New tables `guilds` / membership jsonb. V1 has NO contest mechanics (expiry
only); siege/war is phase 2.

- **Found a guild:** requires linked wallet holding ≥ **25,000◆** (between
  Keeper and Warden) AND a **50,000◆ burn** (`guildFound`). Name ≤ 20 chars,
  tag ≤ 4 (sanitized, unique). Founder = sole officer (V1).
- **Members:** join free via open list (V1), cap **20**. One guild per player.
- **Territory:** the 4 wild regions are claimable (Palewater, The Ashen
  Flats, Hollowmere Reach, The Bonefields — never Wanderer's Rest). One
  region per guild, one guild per region.
  - **Stake:** founder burns **25,000◆** (`guildTerritory`) → guild holds the
    region for **48h**.
  - **Upkeep:** **10,000◆** burn (`guildUpkeep`) extends the hold by **48h**
    each time (stackable to max 7 days ahead). Lapse → banner falls, region
    opens. Structural recurring burn ≈ **5,000◆/day per active guild**.
  - **Perks while held** (server-enforced): members gain **+2% rich-strike**
    inside their region and **+0.1 caravan weight**; the region banner shows
    "<Region> · held by <TAG>". Schema-synced (`GuildState` map: name, tag,
    region, expiresAt, members count).
- Membership/identity: `players.guild_id`; PlayerState gains `guildTag` so
  the roster + nameplates show it.

## 4. The Exchange (gold ↔ DRIFTS, at the Vault keeper)

Two-sided, fixed-rate ±10% spread around the 100◆/g anchor. Payouts ONLY from
the escrow pool — never minted. Items still sell for gold only.

- **Buy gold:** pay **110◆ per 1g**. On-chain: wallet transfers DRIFTS to the
  ESCROW ATA (verified exactly like the burn rail's transfer leg — insert-first
  replay protection in `burns` table, action `exBuy`). Gold credited on the
  server ledger. Daily buy cap **2,000g/wallet** (anti gold-inflation).
- **Sell gold:** receive **90◆ per 1g**. Flow: daily-cap check → pool check →
  **debit gold ledger first** → server signs `transferChecked` escrow→player
  (escrow keypair = fee payer) → confirm on-chain → record payout row with tx
  sig (idempotent). Transfer failure → gold refunded.
- **Daily SELL caps by holder tier** (UTC day, per wallet):
  | tier | cap (gold/day) | max DRIFTS out/day |
  |---|---|---|
  | base holder | 200g | 18,000◆ |
  | Keeper (10k) | 500g | 45,000◆ |
  | Warden (100k) | 1,500g | 135,000◆ |
  | Drift Lord (1M) | 5,000g | 450,000◆ |
- **The spread** (20◆ per round-tripped gold) accrues to the pool — it is the
  sustainability buffer, not revenue. Pool empty → "the merchant's purse is
  light." Pool balance = live RPC read of the escrow ATA (60s cache).
- **Env:** `ESCROW_KEYPAIR` (JSON secret-key array, managed secret) arms BOTH
  directions; `ESCROW_ADDRESS` (pubkey only) arms buy-gold only; neither set =
  Exchange dormant (keeper says the counter is closed). Devnet first, like
  everything.
- New table `exchange_log` (token, day, goldBought, goldSold) for caps;
  `payouts` recorded in it with tx sigs.

## 5. P2P marketplace (Drift-touched relics only)

Player-to-player trading of **prestige cosmetics ONLY** (server-authoritative
`players.prestige` — gold cosmetics stay untradable because their ownership is
client-trusted). Titles are soul-bound (not tradable). Dyes/auras tradable.

- **List:** owner lists a prestige key for P ◆ (min **1,000◆**, max 10M).
  Listing locks it (can't list twice; unlist anytime). Table `relics`
  (id, seller token, seller wallet, key, price).
- **Buy:** server builds a partial-signed tx: `transferChecked(P × 95% →
  seller ATA)` + `burnChecked(P × 5%)` (the market's tithe burns — same 50/50
  treasury split applies to the burned 5% when treasury is set... NO — keep
  V1 simple: the 5% fee is a pure BURN). Buyer countersigns + submits; server
  verifies BOTH legs on-chain (replay-protected, action `relic`), then moves
  the key: seller's prestige set −, buyer's prestige set +, both persisted +
  live sims updated. Seller gets `relicSold`, buyer `relicResult`.
- Equipping stays gated by the identity-sync ownership check (already built).
- Fee math: a 25,000◆ aura resold at 30,000◆ → seller nets 28,500◆, 1,500◆
  burned forever.

## 6. Whitepaper rewrite (after build)

Tokenomics chapter gets: the 100◆/g anchor stated explicitly, the full sink
table (now 13 sinks) generated from BURN_COSTS, the Drift Wheel prize table
generated from DRIFT_WHEEL, guild costs/upkeep math, the Exchange rates,
spread, tier-cap table, pool rule ("payouts only from what buyers paid in"),
P2P fee math with the worked example, pity system, EV statements for both
wheels, and the flywheel updated (sinks → 50% burn + 50% treasury; exchange
spread → pool; P2P fee → burn). Numbers from shared catalogs wherever
renderable.

## 7. New BURN_COSTS entries (canonical)

```
driftSpin:       5_000   // one Drift Wheel spin
cache:          12_000   // Drift Cache = 3 spins
guildFound:     50_000   // found a guild (also requires holding ≥25k)
guildTerritory: 25_000   // stake a region banner (48h)
guildUpkeep:    10_000   // extend the banner 48h
```
Exchange + P2P are transfers (escrow/seller), not BURN_COSTS entries; their
rates live in `EXCHANGE` / `RELIC_MARKET` consts in types.ts.

## Build order
types → db → solana (escrow/p2p tx) → server handlers → client (animation,
panels) → verify-economy.ts (self-hosted, real devnet) → whitepaper → design
prompt. All existing suites must stay green.
