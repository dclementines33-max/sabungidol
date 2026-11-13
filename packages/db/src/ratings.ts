// Rating changes (PRD §6): every change goes into rating_history with its source and reason, all in
// one transaction. Rows whose rating does not change are skipped.
import { desc, eq, inArray } from "drizzle-orm";
import type { Db } from "./openDb";
import { idols, ratingHistory } from "./schema";

export type RatingChange = { idolId: string; new: number; reason?: string };

export async function applyRatings(db: Db, changes: RatingChange[], source: string, seasonId: string | null = null) {
  if (changes.length === 0) return { changed: 0 };
  return db.transaction(async (tx) => {
    const current = new Map((await tx.select({ id: idols.id, rating: idols.rating }).from(idols).where(inArray(idols.id, changes.map((c) => c.idolId)))).map((r) => [r.id, r.rating]));
    let changed = 0;
    for (const c of changes) {
      const old = current.get(c.idolId);
      const value = Math.max(1, Math.min(100, Math.round(c.new)));
      if (old === undefined || old === value) continue;
      await tx.update(idols).set({ rating: value }).where(eq(idols.id, c.idolId));
      await tx.insert(ratingHistory).values({ idolId: c.idolId, seasonId, old, new: value, source, reason: c.reason ?? null });
      changed++;
    }
    return { changed };
  });
}

export async function listRatingHistory(db: Db, idolId: string) {
  return db.select().from(ratingHistory).where(eq(ratingHistory.idolId, idolId)).orderBy(desc(ratingHistory.at), desc(ratingHistory.id));
}
