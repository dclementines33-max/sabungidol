// Stats storage (PRD §7.2, §12): a finished season's placements, and the stats cache (always rebuildable
// from matches; backups leave it out).
import { eq } from "drizzle-orm";
import type { Db } from "./openDb";
import { achievements, placements, statsCache } from "./schema";

export type PlacementRow = { comp: string; idolId: string; finalRank: number; stageReached: string };

export async function replacePlacements(db: Db, seasonId: string, rows: PlacementRow[]) {
  await db.transaction(async (tx) => {
    await tx.delete(placements).where(eq(placements.seasonId, seasonId));
    for (let i = 0; i < rows.length; i += 500) {
      await tx.insert(placements).values(rows.slice(i, i + 500).map((r) => ({ seasonId, comp: r.comp, idolId: r.idolId, finalRank: r.finalRank, stageReached: r.stageReached })));
    }
  });
}

export async function listPlacements(db: Db, seasonId?: string) {
  return db.select().from(placements).where(seasonId ? eq(placements.seasonId, seasonId) : undefined);
}

export async function readCache<T>(db: Db, key: string): Promise<T | undefined> {
  const [row] = await db.select().from(statsCache).where(eq(statsCache.key, key));
  return row?.payload as T | undefined;
}

export async function writeCache(db: Db, key: string, scope: string, payload: unknown, rev: number) {
  await db.insert(statsCache).values({ key, scope, payload, builtFromRev: rev })
    .onConflictDoUpdate({ target: statsCache.key, set: { scope, payload, builtFromRev: rev } });
}

// Badges of one finished season (PRD §7.4), replaced as a whole (a rebuild gives the same rows).
export async function replaceAchievements(db: Db, seasonId: string, rows: { idolId: string; badge: string }[]) {
  await db.transaction(async (tx) => {
    await tx.delete(achievements).where(eq(achievements.seasonId, seasonId));
    if (rows.length) await tx.insert(achievements).values(rows.map((r) => ({ idolId: r.idolId, badge: r.badge, seasonId })));
  });
}

export async function listAchievements(db: Db) {
  return db.select().from(achievements);
}
