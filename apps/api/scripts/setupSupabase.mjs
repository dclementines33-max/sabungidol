// One-time (and after every new migration): bring the Supabase database up to date and make sure the
// private "backups" bucket exists. Reads apps/api/.dev.vars (never committed).
//   pnpm --filter @sabung/api setup
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const vars = Object.fromEntries(readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split(/\r?\n/)
  .map((line) => line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
for (const key of ["SUPABASE_DB_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) if (!vars[key]) throw new Error(`${key} is missing in apps/api/.dev.vars`);

const client = postgres(vars.SUPABASE_DB_URL, { prepare: false, max: 1 });
await migrate(drizzle(client), { migrationsFolder: new URL("../migrations", import.meta.url).pathname.replace(/^\/(\w:)/, "$1") });
await client.end();
console.log("Database: migrations applied");

const headers = { authorization: `Bearer ${vars.SUPABASE_SERVICE_ROLE_KEY}`, apikey: vars.SUPABASE_SERVICE_ROLE_KEY, "content-type": "application/json" };
const res = await fetch(`${vars.SUPABASE_URL}/storage/v1/bucket`, { method: "POST", headers, body: JSON.stringify({ id: "backups", name: "backups", public: false }) });
const text = await res.text();
if (!res.ok && !/already exists|Duplicate/i.test(text)) throw new Error(`Bucket: ${res.status} ${text}`);
console.log(res.ok ? "Storage: bucket 'backups' created (private)" : "Storage: bucket 'backups' already exists");
