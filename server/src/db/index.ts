import { drizzle as drizzlePglite, PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, NodePgDatabase } from "drizzle-orm/node-postgres";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { eq, sql } from "drizzle-orm";
import {
  players, PlayerRow,
  claims, ClaimRow,
  listings, ListingRow,
  props, PropRow,
  shrine, realm, burns,
  guilds, GuildRow,
  relics, RelicRow,
  exchangeLog,
} from "./schema";

export type { PlayerRow, ClaimRow, ListingRow, PropRow, GuildRow, RelicRow } from "./schema";

// DATABASE_URL set (Neon/any Postgres) → node-postgres pool.
// Otherwise → PGlite, an embedded Postgres persisted to server/.data.
// Identical SQL + Drizzle API either way, so prod is a config change.

export type Db = PgliteDatabase | NodePgDatabase;

let db: Db;

export async function initDb(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    db = drizzlePg(new Pool({ connectionString: process.env.DATABASE_URL }));
    console.log("DB: postgres via DATABASE_URL");
  } else {
    // DRIFT_DATA_DIR lets verify scripts boot an isolated throwaway instance.
    // The default dir is *.nosync: the repo lives on the iCloud Desktop and
    // bird DELETES files out of plain dirs (it ate base/5 of the old cluster).
    const dataDir = process.env.DRIFT_DATA_DIR ??
      fileURLToPath(new URL("../../.data/driftlands.nosync", import.meta.url));
    mkdirSync(dirname(dataDir), { recursive: true });
    db = drizzlePglite(new PGlite(dataDir));
    console.log(`DB: embedded pglite (${dataDir})`);
  }

  // single-table bootstrap — swap for drizzle-kit migrations when tables multiply
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS players (
      id serial PRIMARY KEY,
      token text NOT NULL UNIQUE,
      wallet_address text UNIQUE,
      name text NOT NULL DEFAULT 'Wanderer',
      dye text NOT NULL DEFAULT 'stone',
      eye text NOT NULL DEFAULT 'drift',
      snapshot jsonb,
      last_x real,
      last_y real,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS escrow_gold real NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS bank_gold real NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS gold real
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS inv jsonb
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS founder boolean NOT NULL DEFAULT false
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS prestige jsonb NOT NULL DEFAULT '[]'::jsonb
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS wheel_pity real NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS quests jsonb
  `);
  await db.execute(sql`
    ALTER TABLE players ADD COLUMN IF NOT EXISTS guild_id real
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS guilds (
      id serial PRIMARY KEY,
      name text NOT NULL UNIQUE,
      tag text NOT NULL UNIQUE,
      founder_token text NOT NULL,
      region text NOT NULL DEFAULT '',
      region_until real NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS relics (
      id serial PRIMARY KEY,
      seller_token text NOT NULL,
      seller_wallet text NOT NULL,
      seller_name text NOT NULL DEFAULT 'Wanderer',
      key text NOT NULL,
      price real NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS exchange_log (
      id serial PRIMARY KEY,
      token text NOT NULL,
      day text NOT NULL,
      gold_bought real NOT NULL DEFAULT 0,
      gold_sold real NOT NULL DEFAULT 0,
      last_sig text,
      UNIQUE (token, day)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS props (
      id serial PRIMARY KEY,
      claim_id real NOT NULL,
      token text NOT NULL,
      x real NOT NULL,
      y real NOT NULL,
      kind text NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS shrine (
      id serial PRIMARY KEY,
      pot real NOT NULL DEFAULT 0
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS burns (
      sig text PRIMARY KEY,
      token text NOT NULL,
      action text NOT NULL
    )
  `);
  await db.execute(sql`
    ALTER TABLE burns ADD COLUMN IF NOT EXISTS burned real NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE burns ADD COLUMN IF NOT EXISTS treasury real NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    INSERT INTO shrine (id, pot) VALUES (1, 0) ON CONFLICT (id) DO NOTHING
  `);
  // the living world: corruption + season survive an empty realm AND a restart
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS realm (
      id serial PRIMARY KEY,
      season real NOT NULL DEFAULT 1,
      drift_pct real NOT NULL DEFAULT 0,
      corrupt jsonb NOT NULL DEFAULT '[]'::jsonb
    )
  `);
  await db.execute(sql`
    INSERT INTO realm (id, season, drift_pct, corrupt) VALUES (1, 1, 0, '[]'::jsonb) ON CONFLICT (id) DO NOTHING
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS listings (
      id serial PRIMARY KEY,
      token text NOT NULL,
      seller_name text NOT NULL DEFAULT 'Wanderer',
      item text NOT NULL,
      qty real NOT NULL,
      price real NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS claims (
      id serial PRIMARY KEY,
      token text NOT NULL,
      x real NOT NULL,
      y real NOT NULL,
      integrity real NOT NULL DEFAULT 100,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  return db;
}

/** fetch-or-create the player for a device token */
export async function loadOrCreatePlayer(token: string): Promise<PlayerRow> {
  const found = await db.select().from(players).where(eq(players.token, token));
  if (found.length > 0) return found[0];
  const created = await db.insert(players).values({ token }).returning();
  return created[0];
}

export interface SavePatch {
  name?: string;
  dye?: string;
  eye?: string;
  snapshot?: unknown;
  lastX?: number;
  lastY?: number;
}

export async function savePlayer(token: string, patch: SavePatch) {
  await db
    .update(players)
    .set({ ...patch, updatedAt: new Date() } as never)
    .where(eq(players.token, token));
}

// ---- Phase 5: wallet linking --------------------------------------------------------

/** bind a Solana wallet to a guest token (verified upstream); null unlinks */
export async function setWalletAddress(token: string, address: string | null) {
  await db
    .update(players)
    .set({ walletAddress: address, updatedAt: new Date() })
    .where(eq(players.token, token));
}

/** the player row already holding this wallet, if any (wallets are unique) */
export async function findPlayerByWallet(address: string): Promise<PlayerRow | null> {
  const found = await db.select().from(players).where(eq(players.walletAddress, address));
  return found[0] ?? null;
}

// ---- Phase 5: burn replay protection --------------------------------------------

/** claim a burn signature exactly once; false = already spent */
export async function tryInsertBurn(
  sig: string,
  token: string,
  action: string,
  burned = 0,
  treasury = 0,
): Promise<boolean> {
  const inserted = await db
    .insert(burns)
    .values({ sig, token, action, burned, treasury })
    .onConflictDoNothing()
    .returning();
  return inserted.length > 0;
}

/** lifetime fee-split totals + per-sink counts (the public scarcity counter).
 *  SQL aggregates (not a full-table read) + a short cache: the landing nav
 *  hits this on every page mount, so it must stay cheap as `burns` grows. */
interface BurnTotals { burned: number; treasury: number; count: number; bySink: Record<string, number>; }
let burnTotalsCache: { at: number; data: BurnTotals } | null = null;
const BURN_TOTALS_TTL_MS = 15_000;

export async function burnTotals(): Promise<BurnTotals> {
  if (burnTotalsCache && Date.now() - burnTotalsCache.at < BURN_TOTALS_TTL_MS) {
    return burnTotalsCache.data;
  }
  const grouped = await db
    .select({
      action: burns.action,
      burned: sql<number>`coalesce(sum(${burns.burned}), 0)`,
      treasury: sql<number>`coalesce(sum(${burns.treasury}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(burns)
    .groupBy(burns.action);
  const out: BurnTotals = { burned: 0, treasury: 0, count: 0, bySink: {} };
  for (const r of grouped) {
    out.burned += Number(r.burned);
    out.treasury += Number(r.treasury);
    out.count += Number(r.count);
    out.bySink[r.action] = Number(r.count);
  }
  burnTotalsCache = { at: Date.now(), data: out };
  return out;
}

/** lifetime burn totals for ONE linked wallet (burns are keyed by device
 *  token; the players row carries the wallet link) */
export async function burnTotalsFor(address: string): Promise<BurnTotals> {
  const grouped = await db
    .select({
      action: burns.action,
      burned: sql<number>`coalesce(sum(${burns.burned}), 0)`,
      treasury: sql<number>`coalesce(sum(${burns.treasury}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(burns)
    .innerJoin(players, eq(burns.token, players.token))
    .where(eq(players.walletAddress, address))
    .groupBy(burns.action);
  const out: BurnTotals = { burned: 0, treasury: 0, count: 0, bySink: {} };
  for (const r of grouped) {
    out.burned += Number(r.burned);
    out.treasury += Number(r.treasury);
    out.count += Number(r.count);
    out.bySink[r.action] = Number(r.count);
  }
  return out;
}

/** release a signature whose on-chain verification failed (allows retry) */
export async function deleteBurn(sig: string) {
  await db.delete(burns).where(eq(burns.sig, sig));
}

/** stamp the one-time Founder mark (burned DRIFTS inside the beta window) */
export async function setFounder(token: string) {
  await db.update(players).set({ founder: true }).where(eq(players.token, token));
}

/** record server-authoritative ownership of a Drift-touched (burned) cosmetic */
export async function setPrestige(token: string, owned: string[]) {
  await db.update(players).set({ prestige: owned }).where(eq(players.token, token));
}

/** persist the Drift Wheel pity counter */
export async function setWheelPity(token: string, pity: number) {
  await db.update(players).set({ wheelPity: pity }).where(eq(players.token, token));
}

// ---- guilds --------------------------------------------------------------------

export async function loadGuilds(): Promise<GuildRow[]> {
  return db.select().from(guilds);
}

export async function insertGuild(
  name: string, tag: string, founderToken: string,
): Promise<GuildRow | null> {
  try {
    const rows = await db.insert(guilds).values({ name, tag, founderToken }).returning();
    return rows[0] ?? null;
  } catch {
    return null; // unique violation: name or tag taken
  }
}

export async function setGuildRegion(id: number, region: string, until: number) {
  await db.update(guilds).set({ region, regionUntil: until }).where(eq(guilds.id, id));
}

export async function setPlayerGuild(token: string, guildId: number | null) {
  await db.update(players).set({ guildId }).where(eq(players.token, token));
}

// ---- the relic market (P2P prestige cosmetics) ----------------------------------

export async function loadRelics(): Promise<RelicRow[]> {
  return db.select().from(relics);
}

export async function insertRelic(
  sellerToken: string, sellerWallet: string, sellerName: string, key: string, price: number,
): Promise<RelicRow> {
  const rows = await db
    .insert(relics)
    .values({ sellerToken, sellerWallet, sellerName, key, price })
    .returning();
  return rows[0];
}

export async function deleteRelic(id: number) {
  await db.delete(relics).where(eq(relics.id, id));
}

// ---- the Exchange: daily-cap accounting ------------------------------------------

const utcDay = () => new Date().toISOString().slice(0, 10);

/** today's bought/sold gold for a wallet's token */
export async function exchangeToday(token: string): Promise<{ bought: number; sold: number }> {
  const rows = await db
    .select()
    .from(exchangeLog)
    .where(sql`${exchangeLog.token} = ${token} AND ${exchangeLog.day} = ${utcDay()}`);
  const r = rows[0];
  return { bought: r?.goldBought ?? 0, sold: r?.goldSold ?? 0 };
}

/** add to today's tallies (upsert); sig recorded for sell payouts */
export async function exchangeRecord(
  token: string, boughtDelta: number, soldDelta: number, sig?: string,
) {
  await db.execute(sql`
    INSERT INTO exchange_log (token, day, gold_bought, gold_sold, last_sig)
    VALUES (${token}, ${utcDay()}, ${boughtDelta}, ${soldDelta}, ${sig ?? null})
    ON CONFLICT (token, day) DO UPDATE SET
      gold_bought = exchange_log.gold_bought + ${boughtDelta},
      gold_sold = exchange_log.gold_sold + ${soldDelta},
      last_sig = COALESCE(${sig ?? null}, exchange_log.last_sig)
  `);
}

// ---- land claims -----------------------------------------------------------------

export async function loadClaims(): Promise<ClaimRow[]> {
  return db.select().from(claims);
}

export async function insertClaim(token: string, x: number, y: number): Promise<ClaimRow> {
  const rows = await db.insert(claims).values({ token, x, y }).returning();
  return rows[0];
}

export async function deleteClaim(id: number) {
  await db.delete(claims).where(eq(claims.id, id));
}

export async function setClaimIntegrity(id: number, integrity: number) {
  await db.update(claims).set({ integrity }).where(eq(claims.id, id));
}

// ---- marketplace -----------------------------------------------------------------

export async function loadListings(): Promise<ListingRow[]> {
  return db.select().from(listings);
}

export async function insertListing(
  token: string,
  sellerName: string,
  item: string,
  qty: number,
  price: number,
): Promise<ListingRow> {
  const rows = await db
    .insert(listings)
    .values({ token, sellerName, item, qty, price })
    .returning();
  return rows[0];
}

export async function deleteListing(id: number) {
  await db.delete(listings).where(eq(listings.id, id));
}

/** credit a seller who is offline; delivered + zeroed on next join */
export async function addEscrow(token: string, amount: number) {
  await db
    .update(players)
    .set({ escrowGold: sql`${players.escrowGold} + ${amount}` })
    .where(eq(players.token, token));
}

// ---- the Vault -------------------------------------------------------------------

export async function setBankGold(token: string, amount: number) {
  await db.update(players).set({ bankGold: amount }).where(eq(players.token, token));
}

// ---- Phase 6: the pocket-gold ledger ----------------------------------------------

/** write-through persist of the authoritative pocket balance */
export async function setGold(token: string, amount: number) {
  await db.update(players).set({ gold: amount }).where(eq(players.token, token));
}

/** write-through persist of the authoritative item counts */
export async function setInv(token: string, inv: Record<string, number>) {
  await db.update(players).set({ inv }).where(eq(players.token, token));
}

/** write-through persist of the authoritative daily quest board */
export async function setQuests(
  token: string,
  quests: { day: number; list: { id: string; progress: number; claimed: boolean }[] },
) {
  await db.update(players).set({ quests }).where(eq(players.token, token));
}

// ---- the Shrine ------------------------------------------------------------------

export async function loadShrinePot(): Promise<number> {
  const rows = await db.select().from(shrine).where(eq(shrine.id, 1));
  return rows[0]?.pot ?? 0;
}

export async function setShrinePot(pot: number) {
  await db.update(shrine).set({ pot }).where(eq(shrine.id, 1));
}

// ---- the living world: corruption + season persistence ---------------------------

export interface RealmState { season: number; driftPct: number; corrupt: number[] }

export async function loadRealm(): Promise<RealmState | null> {
  const rows = await db.select().from(realm).where(eq(realm.id, 1));
  const r = rows[0];
  if (!r) return null;
  return {
    season: r.season ?? 1,
    driftPct: r.driftPct ?? 0,
    corrupt: Array.isArray(r.corrupt) ? r.corrupt : [],
  };
}

export async function saveRealm(state: RealmState) {
  await db.update(realm)
    .set({ season: state.season, driftPct: state.driftPct, corrupt: state.corrupt })
    .where(eq(realm.id, 1));
}

// ---- claim props -----------------------------------------------------------------

export async function loadProps(): Promise<PropRow[]> {
  return db.select().from(props);
}

export async function insertProp(
  claimId: number,
  token: string,
  x: number,
  y: number,
  kind: string,
): Promise<PropRow> {
  const rows = await db.insert(props).values({ claimId, token, x, y, kind }).returning();
  return rows[0];
}

export async function deleteProp(id: number) {
  await db.delete(props).where(eq(props.id, id));
}

export async function deletePropsForClaim(claimId: number) {
  await db.delete(props).where(eq(props.claimId, claimId));
}

// ---- the leaderboards --------------------------------------------------------------

export interface BoardRow { name: string; value: number }
export interface Leaderboards { gold: BoardRow[]; kills: BoardRow[]; levels: BoardRow[] }

/** landing-page boards: gold from the ledgers, kills/levels from snapshots */
export async function leaderboards(limit = 10): Promise<Leaderboards> {
  const rows = await db
    .select({
      name: players.name,
      gold: players.gold,
      bank: players.bankGold,
      snapshot: players.snapshot,
    })
    .from(players);
  const top = (vals: BoardRow[]) =>
    vals.filter((v) => v.value > 0).sort((a, b) => b.value - a.value).slice(0, limit);
  const snap = (r: (typeof rows)[number]) =>
    (r.snapshot ?? {}) as { kills?: number; skills?: Record<string, { level?: number }> };
  return {
    gold: top(rows.map((r) => ({ name: r.name, value: Math.round((r.gold ?? 0) + r.bank) }))),
    kills: top(rows.map((r) => ({ name: r.name, value: Math.round(Number(snap(r).kills ?? 0)) }))),
    levels: top(rows.map((r) => ({
      name: r.name,
      value: Object.values(snap(r).skills ?? {}).reduce(
        (n, s) => n + Math.max(0, Math.round(Number(s?.level ?? 0))), 0),
    }))),
  };
}

/** read accumulated escrow and zero it (single-process server → no race) */
export async function takeEscrow(token: string): Promise<number> {
  const rows = await db
    .select({ escrow: players.escrowGold })
    .from(players)
    .where(eq(players.token, token));
  const amount = rows[0]?.escrow ?? 0;
  if (amount > 0) {
    await db.update(players).set({ escrowGold: 0 }).where(eq(players.token, token));
  }
  return amount;
}

/** member headcount per guild (boot-time seed for the live counters) */
export async function guildMemberCounts(): Promise<Map<number, number>> {
  const rows = await db
    .select({ guildId: players.guildId, n: sql<number>`count(*)` })
    .from(players)
    .where(sql`${players.guildId} IS NOT NULL`)
    .groupBy(players.guildId);
  const out = new Map<number, number>();
  for (const r of rows) if (r.guildId != null) out.set(Number(r.guildId), Number(r.n));
  return out;
}
