// Login for cloud backup (PRD §11): Better Auth, email + password only (user 2026-11-13; magic link and
// Google skipped). Sessions are cookies on the app's own domain, so no CORS.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "./db";
import * as schema from "./schema";

export function makeAuth(db: Db, { secret, baseURL }: { secret: string; baseURL: string }) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    basePath: "/api/auth",
    secret,
    baseURL,
  });
}

export type Auth = ReturnType<typeof makeAuth>;
