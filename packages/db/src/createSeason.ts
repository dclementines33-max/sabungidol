// Adds a season row (PRD §12.1).
import type { Db } from "./openDb";
import { seasons } from "./schema";

export async function createSeason(db: Db, season: { id: string; number: number; name: string; seed: string; config?: unknown }) {
  await db.insert(seasons).values({ ...season, status: "live" });
}
