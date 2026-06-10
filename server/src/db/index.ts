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
  shrine,
} from "./schema";

export type { PlayerRow, ClaimRow, ListingRow, PropRow } from "./schema";

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
    const dataDir = fileURLToPath(new URL("../../.data/driftlands", import.meta.url));
    mkdirSync(dirname(dataDir), { recursive: true });
    db = drizzlePglite(new PGlite(dataDir));
    console.log("DB: embedded pglite (server/.data/driftlands)");
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
    INSERT INTO shrine (id, pot) VALUES (1, 0) ON CONFLICT (id) DO NOTHING
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

// ---- the Shrine ------------------------------------------------------------------

export async function loadShrinePot(): Promise<number> {
  const rows = await db.select().from(shrine).where(eq(shrine.id, 1));
  return rows[0]?.pot ?? 0;
}

export async function setShrinePot(pot: number) {
  await db.update(shrine).set({ pot }).where(eq(shrine.id, 1));
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
