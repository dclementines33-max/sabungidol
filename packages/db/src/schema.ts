// Database tables (PRD §12.1). Same schema for the browser (PGlite) and the cloud (Postgres).
// Photos live in OPFS; records only hold a photo id (guardrail §14.4).
import { sql } from "drizzle-orm";
import {
  boolean, date, index, integer, jsonb, pgTable, primaryKey, real, smallint, text, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";

// Cloud sync (2026-11-16): updatedAt is stamped on every update (last write wins); syncKey is frozen at the first sync
// (lower(name)|lower(group), so devices from the same seed agree); a photo's hash is the SHA-256 of its original.
const updatedAt = () => timestamp({ mode: "string", withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date().toISOString());

export const groups = pgTable("groups", {
  id: text().primaryKey(),
  name: text().notNull(),
  logoId: text(),
  syncKey: text(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("groups_name").on(sql`lower(${t.name})`)]); // "IVE" and "ive" are one group

export const idols = pgTable("idols", {
  id: text().primaryKey(),
  name: text().notNull(),
  groupId: text().references(() => groups.id), // null = Soloist
  seed: smallint(),
  nationality: text(), // ISO-3166
  birthday: date(),
  role: text(), // position in the group, e.g. "Leader, Main Vocalist" (Update 3)
  photoId: text(),
  gallery: jsonb().$type<string[]>().notNull().default([]), // extra photo ids shown beside the MatchModal (gallery feature)
  rating: smallint().notNull(),
  active: boolean().notNull().default(true),
  syncKey: text(),
  updatedAt: updatedAt(),
}, (t) => [
  // Same name in the same group (or both soloists) is a duplicate.
  uniqueIndex("idols_name_group").on(sql`lower(${t.name})`, sql`coalesce(${t.groupId}, '')`),
]);

export const photos = pgTable("photos", {
  id: text().primaryKey(),
  focalX: real(),
  focalY: real(),
  sizes: jsonb(),
  bytes: integer(),
  hash: text(),
  updatedAt: updatedAt(),
});

export const seasons = pgTable("seasons", {
  id: text().primaryKey(),
  number: integer().notNull().unique(),
  name: text().notNull(),
  seed: text().notNull(),
  status: text().notNull(), // draft / live / completed / archived
  config: jsonb(),
});

export const competitions = pgTable("competitions", {
  seasonId: text().notNull().references(() => seasons.id),
  code: text().notNull(),
  name: text().notNull(),
  branding: jsonb(),
  updatedAt: updatedAt(),
}, (t) => [primaryKey({ columns: [t.seasonId, t.code] })]);

export const entries = pgTable("entries", {
  seasonId: text().notNull().references(() => seasons.id),
  comp: text().notNull(),
  stage: text().notNull(),
  idolId: text().notNull().references(() => idols.id),
  slot: integer(),
  seedRank: integer(),
  source: text(),
}, (t) => [primaryKey({ columns: [t.seasonId, t.comp, t.stage, t.idolId] })]);

// Append-only. The deterministic id as primary key stops a double submit (guardrail §14.4).
export const matches = pgTable("matches", {
  id: text().primaryKey(),
  seasonId: text().notNull().references(() => seasons.id),
  comp: text().notNull(),
  stage: text().notNull(),
  round: text().notNull(),
  idolA: text().notNull().references(() => idols.id),
  idolB: text().notNull().references(() => idols.id),
  games: smallint().notNull(), // bitmask, see gamesMask.ts
  scoreA: smallint().notNull(),
  scoreB: smallint().notNull(),
  result: text().notNull(), // A / B / D
  method: text().notNull(), // sim / manual / wheel / marble
  arenas: text().array(), // 2026-11-18: arena ids (one; a grand final one per game); null = played before arenas existed
  ratingA: smallint().notNull(),
  ratingB: smallint().notNull(),
  formA: text().notNull(),
  formB: text().notNull(),
  playedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("matches_season_comp_stage").on(t.seasonId, t.comp, t.stage),
  index("matches_idol_a").on(t.idolA),
  index("matches_idol_b").on(t.idolB),
]);

export const placements = pgTable("placements", {
  seasonId: text().notNull().references(() => seasons.id),
  comp: text().notNull(),
  idolId: text().notNull().references(() => idols.id),
  finalRank: integer().notNull(),
  stageReached: text(),
}, (t) => [primaryKey({ columns: [t.seasonId, t.comp, t.idolId] }), index("placements_idol").on(t.idolId)]);

export const ratingHistory = pgTable("rating_history", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  idolId: text().notNull().references(() => idols.id),
  seasonId: text().references(() => seasons.id),
  old: smallint().notNull(),
  new: smallint().notNull(),
  source: text().notNull(),
  reason: text(),
  at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  idolId: text().notNull().references(() => idols.id),
  badge: text().notNull(),
  seasonId: text().notNull().references(() => seasons.id),
  evidenceMatchId: text().references(() => matches.id),
}, (t) => [primaryKey({ columns: [t.idolId, t.badge, t.seasonId] })]);

// Can be deleted and rebuilt at any time.
export const statsCache = pgTable("stats_cache", {
  key: text().primaryKey(),
  scope: text().notNull(),
  payload: jsonb().notNull(),
  builtFromRev: integer().notNull(),
});

export const eventLog = pgTable("event_log", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  level: text().notNull(), // info / success / warning / blocker / error
  code: text(),
  message: text().notNull(),
  context: jsonb(),
  at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
