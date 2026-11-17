// The matches that have arenas (2026-11-18), in the shape the engine's arena stats read: all, one season's, or one
// idol's. Matches played before arenas existed (arenas null) are left out.
import { and, eq, isNotNull, or } from "drizzle-orm";
import type { ArenaRow } from "@sabung/engine";
import { gamesFromMask } from "./gamesMask";
import type { Db } from "./openDb";
import { matches } from "./schema";

export async function listArenaMatches(db: Db, scope: { seasonId?: string; idolId?: string } = {}): Promise<(ArenaRow & { id: string })[]> {
  const rows = await db.select().from(matches).where(and(
    isNotNull(matches.arenas),
    scope.seasonId ? eq(matches.seasonId, scope.seasonId) : undefined,
    scope.idolId ? or(eq(matches.idolA, scope.idolId), eq(matches.idolB, scope.idolId)) : undefined,
  ));
  return rows.map((r) => ({
    id: r.id, seasonId: r.seasonId, idolA: r.idolA, idolB: r.idolB, result: r.result as "A" | "B" | "D",
    games: gamesFromMask(r.games, r.scoreA + r.scoreB), arenas: r.arenas!, ratingA: r.ratingA, ratingB: r.ratingB,
  }));
}
