// How many matches are saved (Dashboard, storage panel, checks).
import { sql } from "drizzle-orm";
import type { Db } from "./openDb";
import { matches } from "./schema";

export async function countMatches(db: Db): Promise<number> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(matches);
  return n;
}
