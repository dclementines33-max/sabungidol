// Cloud tables (PRD §12.4) in Supabase Postgres: Better Auth's four tables (as getAuthTables lists them
// for email + password) and one row per cloud backup. The .sabung file itself is in Supabase Storage.
import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const stamps = { createdAt: timestamp().notNull().defaultNow(), updatedAt: timestamp().notNull().defaultNow() };

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  ...stamps,
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp().notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  ...stamps,
}, (t) => [index().on(t.userId)]);

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  ...stamps,
}, (t) => [index().on(t.userId)]);

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  ...stamps,
}, (t) => [index().on(t.identifier)]);

export const cloudBackup = pgTable("cloud_backup", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text().notNull(), // the .sabung file name, e.g. sabung-idol-2026-11-13.sabung
  size: integer().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
}, (t) => [index().on(t.userId)]);
