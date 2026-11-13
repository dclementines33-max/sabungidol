// The database the API uses: Supabase Postgres in the Worker (postgres.js), PGlite in tests.
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
