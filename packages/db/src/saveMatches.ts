// Writes one batch of played matches (one matchday or round) in a single transaction (PRD §13).
// A match that is already saved is skipped, never overwritten: two submits = one row (§14.4).
import type { CompetitionCode, StageCode } from "@sabung/shared";
import { gamesToMask } from "./gamesMask";
import type { Db } from "./openDb";
import { matches } from "./schema";

export type PlayedMatch = {
  id: string; comp: CompetitionCode; stage: StageCode; round: string;
  idolA: string; idolB: string; games: ("A" | "B")[]; scoreA: number; scoreB: number; result: "A" | "B" | "D";
  ratingA: number; ratingB: number; formA: string; formB: string;
  arenas?: string[] | null; // where it was played (shared drawArenas); missing = no arena
};

const CHUNK = 500; // rows per INSERT, well under Postgres' parameter limit

export async function saveMatches(db: Db, seasonId: string, batch: PlayedMatch[], method: "sim" | "manual" | "wheel" | "marble" = "sim") {
  const rows = batch.map((m) => ({
    id: m.id, seasonId, comp: m.comp, stage: m.stage, round: m.round, idolA: m.idolA, idolB: m.idolB,
    games: gamesToMask(m.games), scoreA: m.scoreA, scoreB: m.scoreB, result: m.result, method,
    ratingA: m.ratingA, ratingB: m.ratingB, formA: m.formA, formB: m.formB, arenas: m.arenas ?? null,
  }));
  const inserted = await db.transaction(async (tx) => {
    let count = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const added = await tx.insert(matches).values(rows.slice(i, i + CHUNK)).onConflictDoNothing().returning({ id: matches.id });
      count += added.length;
    }
    return count;
  });
  return { inserted, skipped: rows.length - inserted };
}
