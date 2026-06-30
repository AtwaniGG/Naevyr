// Login-streak rewards (pure, so they can be unit-checked without a live room).
// The streak COUNTER (last-day / increment / reset) lives in DriftRoom.onJoin;
// this module owns only the gold a given streak day pays.

/** milestone bonuses: gold ON TOP of the daily reward, paid once when an
 *  unbroken streak lands exactly on the day. The client pops the matching wax
 *  seal (milestone_seal_7 / _30) on these days. */
export const STREAK_MILESTONES: Record<number, number> = { 7: 200, 30: 750 };

/** the gold + milestone for landing on `streak` (only credited to a SEEDED
 *  ledger — a brand-new account records the streak now, earns from day 2). */
export function streakReward(streak: number): { reward: number; milestone: number } {
  const base = Math.min(40 + streak * 15, 250); // day 1 = 55g … capped at 250g
  const bonus = STREAK_MILESTONES[streak] ?? 0;
  return { reward: base + bonus, milestone: bonus > 0 ? streak : 0 };
}
