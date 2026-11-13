// Final predictions (PRD §16): before a final the user picks a winner; each pick is an event (code PREDICTION, the
// latest pick per match counts) and is scored against the final once it is played — the Commissioner's accuracy.
import { type Db, listEventsByCode, logEvent, queryMatches } from "@sabung/db";

export const PREDICTION = "PREDICTION";

export async function predict(db: Db, matchId: string, pick: string) {
  await logEvent(db, { level: "info", code: PREDICTION, message: `Tebakan final ${matchId}`, context: { matchId, pick } });
}

export async function predictions(db: Db) {
  const picks: Record<string, string> = {};
  for (const e of await listEventsByCode(db, PREDICTION)) {
    const c = e.context as { matchId?: string; pick?: string } | null;
    if (c?.matchId && c.pick) picks[c.matchId] = c.pick; // oldest first, so the latest pick wins
  }
  const finals = (await queryMatches(db, { stage: "FN" }, { limit: 100_000, newest: false })).rows.filter((m) => picks[m.id]);
  const scored = finals.map((m) => {
    const winner = m.result === "A" ? m.idolA : m.result === "B" ? m.idolB : null;
    return { matchId: m.id, pick: picks[m.id]!, winner, hit: winner === picks[m.id] };
  });
  return { picks, scored, hits: scored.filter((s) => s.hit).length, total: scored.length };
}
