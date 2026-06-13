# Pit DRIFTS Wagers — Design

**Date:** 2026-06-13
**Status:** Built + verified (verify-pit-drifts 18/18 on real devnet; verify-town gold duels still 22/22). Not committed.

## Goal

Let players wager **DRIFTS** (the on-chain currency) in the Pit arena, alongside
the existing gold wagers. Minimum stake **20,000 DRIFTS**. The house keeps **10%
of the total pot**; the winner takes the remaining 90%. Example: two fighters
stake 20,000 each (40,000 pot) → winner receives **36,000**, **4,000** is
retained by the house.

## Why escrow custody (not a ledger debit/credit)

Gold wagers are an internal ledger move (`debit`/`credit`) — instant, no chain.
DRIFTS are real on-chain tokens and the realm **never mints** (no house faucet —
CLAUDE.md rule). So a winnable DRIFTS pot requires **escrow custody**: each
fighter transfers their stake into the escrow wallet on-chain *before* the fight,
and the winner is paid out of escrow afterward. This reuses the Exchange's
existing rails:

- **Deposit leg:** `buildExchangeBuyTx(wallet, amount)` already builds a
  `transfer(amount DRIFTS → escrowAta)` tx. Verified with `verifyTxLegs`.
- **Payout leg:** `payFromEscrow(wallet, amount)` — the server-signed outbound
  hot-wallet rail. **This must be armed** (`ESCROW_KEYPAIR` env set). The
  AUTHORITY keypair pays SOL fees; escrow only signs the token transfer.

Each duel is **self-funding**: 40k in → 36k out + 4k retained. Escrow needs no
DRIFTS pre-funding.

## Config (`game/types.ts`)

```ts
export const DUEL_DRIFTS = {
  min: 20_000,      // minimum stake, DRIFTS
  max: 1_000_000,   // bound exposure per duel
  feePct: 0.10,     // house cut of the TOTAL pot (winner gets 90%)
} as const;
```

## Scope

- **Arena queue path only** (`pitJoin`). The direct player-to-player `challenge`
  path stays **gold-only** for now (it would need two simultaneous async
  signatures — a possible follow-up). The queue is naturally sequential: the
  poster is already staked, only the joiner stakes to start the fight.
- Gold wagers are unchanged on both paths.

## Flow

```
Poster:  pick DRIFTS + wager (>=20k) → duelStakeQuote → server builds deposit tx
         → wallet signs/submits → duelStake{wager,sig} → server verifies the
           transfer leg on-chain → poster is STAKED, posted to the DRIFTS queue
Joiner:  steps up at that stake → same deposit round-trip → verified
         → BOTH staked → startDuel(currency:"drifts")
Fight:   unchanged real-time combat (server-rolled duelHit)
Settle (endDuel):
  win  → payout = floor(pot * 0.90); payFromEscrow(winnerWallet, payout)
         the 10% stays in escrow (the house cut)
  draw → refund each fighter their full wager from escrow (NO cut)
  forfeit / flee / disconnect mid-duel → counts as a WIN for the other fighter
```

### Refund obligations (poster staked but never matched)

All via `payFromEscrow` (full stake, no fee), guarded idempotent:
- poster calls `pitLeave`
- poster disconnects (`onLeave`)
- the open DRIFTS queue times out (~5 min) while unmatched

## Server changes (`server/src/rooms/DriftRoom.ts`)

- `Duel` interface gains `currency: "gold" | "drifts"`.
- `pitQueue` entry gains `currency` and (for DRIFTS) is only created **after** a
  verified deposit; it carries the deposit `sig` and a `settled` flag.
- New messages:
  - `duelStakeQuote { wager }` → validate min/max, wallet linked, balance ≥
    wager; build deposit tx via `buildExchangeBuyTx`; reply `duelStakeQuote
    { ok, tx, wager }`.
  - `duelStake { wager, sig }` → per-token single-flight lock; insert-first
    replay via `tryInsertBurn(sig, token, "duelStake")`; `verifyTxLegs` transfer
    leg into `escrowAta`, amount ≥ wager, owner = fighter wallet. On success:
    decrement `sim.tokenBalance`, `syncToken`; then either **post** the queue
    (if no staked opponent waiting) or **start the duel** against the waiting
    staked poster.
- `pitJoin` keeps the **gold** path exactly as today; DRIFTS goes through the
  stake round-trip above.
- `startDuel(a, b, wager, currency)`:
  - gold: unchanged (`debit` both up front).
  - drifts: stakes are already in escrow; just seal the ring.
- `endDuel`:
  - gold: unchanged.
  - drifts: compute payout/ refunds via `payFromEscrow`, guard with `settled`.
    Read winner wallet via `loadOrCreatePlayer(token)`. On payout success,
    increment the recipient's `sim.tokenBalance` + `syncToken`.
- `onLeave` / `pitLeave` / queue-timeout: refund an unmatched DRIFTS stake once.
- `duelStart` / `duelEnd` broadcasts gain `currency` so the HUD labels `◆` vs `g`.

### Safety

- Replay: burns table, action `"duelStake"` (insert-first, delete on verify
  failure to free a retry).
- Single-flight: a per-token lock set (mirror `exTrading`) around deposit verify.
- Payout idempotency: `settled` flag on the duel / queue-stake record; `endDuel`
  already removes the duel from the array.
- Balance sync: decrement on deposit, increment on payout/refund, `syncToken`
  each time (mirrors `consumeBurn`).
- **Known caveat:** in-flight stakes are tracked **in memory**. A server restart
  while DRIFTS sit in escrow (staked-unmatched or mid-duel) needs off-chain
  reconciliation from the recorded sigs — same risk class as the Exchange's
  indeterminate-payout path. Acceptable on devnet.

## Client changes

- **`game/state/bus.ts`:** `pitJoin` carries `{ wager, currency }` (or a new
  `duelStakeIntent` event); add the stake round-trip plumbing.
- **`game/net/client.ts`:** `sendPitJoin` gains currency; add
  `sendDuelStakeQuote(wager)` and `sendDuelStake(wager, sig)`.
- **`game/engine/game.ts`:** on `duelStakeQuote` reply → `signAndSubmit(tx)` →
  `sendDuelStake(wager, sig)` (mirrors the `exBuyQuote`/`exBuy` handler). Label
  duel HUD by `currency`.
- **Pit HUD panel:** a Gold | DRIFTS toggle; DRIFTS mode shows the 20k minimum,
  the "10% to the house" note, and requires a linked wallet with sufficient
  balance.

## Verification

New self-hosted `server/scripts/verify-pit-drifts.ts` (own server port, real
devnet, `ESCROW_KEYPAIR` + `AUTHORITY_KEYPAIR` set, a funded devnet mint):

1. Two wallets each hold ≥ 20k DRIFTS, both linked.
2. Both stake 20k → fight to a decision → assert winner's wallet received
   **36,000** (pot×0.9) and escrow retained **4,000**.
3. Draw/timeout case → assert each fighter refunded their **20,000**.
4. Unmatched-leave case → poster stakes, leaves → assert the **20,000** refund.
5. Anti-replay: re-sending a spent `duelStake` sig is refused.

Also re-run `verify-town.ts` (gold duels must still pass) + both typechecks +
build.

## What the user must do

Set `ESCROW_KEYPAIR` (JSON secret-key array) on the server (local for verify,
Railway for prod) and redeploy. No DRIFTS pre-funding needed.
