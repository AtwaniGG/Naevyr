import {
  boolean,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// One row per player. Guest identity = device token (browser-held secret);
// wallet_address stays NULL until Phase 5 links Solana wallets — at which
// point the wallet becomes the primary identity and the token a fallback.

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  /** browser-held guest secret (uuid), unique per device */
  token: text("token").notNull().unique(),
  /** Solana wallet, linked in Phase 5 */
  walletAddress: text("wallet_address").unique(),

  // cosmetics (also live in the snapshot; kept as columns for queries/rosters)
  name: text("name").notNull().default("Wanderer"),
  dye: text("dye").notNull().default("stone"),
  eye: text("eye").notNull().default("drift"),

  /** full progress blob: inventory, skills, vitals, equipment, gold, quests… */
  snapshot: jsonb("snapshot"),

  /** market proceeds earned while offline, delivered on next join */
  escrowGold: real("escrow_gold").notNull().default(0),
  /** gold stored in the Vault (safe from tombstones) */
  bankGold: real("bank_gold").notNull().default(0),
  /**
   * Phase 6: authoritative pocket gold (the server ledger). NULL = ledger not
   * seeded yet — first join migrates the old snapshot's gold into it.
   */
  gold: real("gold"),
  /** Phase 6: authoritative item counts (same seed-once rules as gold) */
  inv: jsonb("inv"),
  /** burned DRIFTS during the beta window — one-time Founder cosmetics */
  founder: boolean("founder").notNull().default(false),

  // where the wanderer last stood
  lastX: real("last_x"),
  lastY: real("last_y"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlayerRow = typeof players.$inferSelect;

// 3×3 land claims. Claimed ground resists the Drift; each season erodes
// integrity (faster under corruption siege) until the claim falls — the
// structural re-claim loop the Phase 5 token burns hook into.
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  /** owner's device token (wallet later) */
  token: text("token").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  integrity: real("integrity").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClaimRow = typeof claims.$inferSelect;

// Player marketplace. Items are escrowed client-side at listing time; gold
// moves on purchase — straight to the seller when online, else into
// players.escrow_gold for delivery on next join.
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  sellerName: text("seller_name").notNull().default("Wanderer"),
  item: text("item").notNull(),
  qty: real("qty").notNull(),
  price: real("price").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ListingRow = typeof listings.$inferSelect;

// Claim furniture from the Furnisher; cascade-deleted when the claim falls.
export const props = pgTable("props", {
  id: serial("id").primaryKey(),
  claimId: real("claim_id").notNull(),
  token: text("token").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  kind: text("kind").notNull(),
});

export type PropRow = typeof props.$inferSelect;

// Phase 5: consumed burn-tx signatures (replay protection for token burns).
// Phase 6: burned/treasury record the fee split per sink, so the public
// counter ("N DRIFTS burned forever") reads straight off this table.
export const burns = pgTable("burns", {
  sig: text("sig").primaryKey(),
  token: text("token").notNull(),
  action: text("action").notNull(),
  burned: real("burned").notNull().default(0),
  treasury: real("treasury").notNull().default(0),
});

// The Shrine of the Pale Flame: one communal pot (single row, id=1).
export const shrine = pgTable("shrine", {
  id: serial("id").primaryKey(),
  pot: real("pot").notNull().default(0),
});
