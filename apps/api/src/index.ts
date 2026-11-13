// The Cloudflare Worker (PRD §11): /api/* is the cloud backup API; everything else is the built web
// app (static assets, with the SPA shell for every route).
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { handle } from "./app";
import { makeAuth } from "./auth";
import { supabaseFiles } from "./files";
import * as schema from "./schema";

type Env = {
  ASSETS: Fetcher;
  SUPABASE_DB_URL: string; // the pooler connection string (transaction mode, port 6543)
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BETTER_AUTH_SECRET: string;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const client = postgres(env.SUPABASE_DB_URL, { prepare: false, max: 1 }); // one per request: Workers cannot share sockets
    try {
      const db = drizzle(client, { schema, casing: "snake_case" });
      const auth = makeAuth(db, { secret: env.BETTER_AUTH_SECRET, baseURL: new URL(request.url).origin });
      return await handle(request, { db, auth, files: supabaseFiles(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) });
    } finally {
      ctx.waitUntil(client.end());
    }
  },
};
