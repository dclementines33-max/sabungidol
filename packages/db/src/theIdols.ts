// "Sync rating" for The Idols (Update 4): its roster is fixed at season start, but until its first match is
// played it may be re-picked from the ratings as they are now (user decision). After that it is refused.
import { and, eq, like, sql } from "drizzle-orm";
import type { Db } from "./openDb";
import { entries, matches } from "./schema";
import { leagueRosters } from "./seasons";

export async function theIdolsPlayed(db: Db, seasonId: string): Promise<boolean> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(matches).where(and(eq(matches.seasonId, seasonId), like(matches.comp, "IDL%")));
  return (row?.n ?? 0) > 0;
}

// Who would come in and go out if The Idols became `picked` (the 20 by rating now).
export async function theIdolsChanges(db: Db, seasonId: string, picked: string[]) {
  const now = (await leagueRosters(db, seasonId)).IDL ?? [];
  return { in: picked.filter((id) => !now.includes(id)), out: now.filter((id) => !picked.includes(id)), played: await theIdolsPlayed(db, seasonId) };
}

export async function replaceTheIdols(db: Db, seasonId: string, picked: string[]): Promise<{ ok: boolean; reason?: string }> {
  if (picked.length !== 20) return { ok: false, reason: `The Idols butuh 20 idol aktif, ada ${picked.length}` };
  if (await theIdolsPlayed(db, seasonId)) return { ok: false, reason: "Match The Idols sudah dimainkan, roster tidak bisa diubah lagi" };
  await db.transaction(async (tx) => {
    await tx.delete(entries).where(and(eq(entries.seasonId, seasonId), eq(entries.comp, "IDL"), eq(entries.stage, "LG")));
    await tx.insert(entries).values(picked.map((idolId, i) => ({ seasonId, comp: "IDL", stage: "LG", idolId, slot: i + 1, source: "rating" })));
  });
  return { ok: true };
}
