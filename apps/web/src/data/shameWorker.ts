// Worker reads for the Hall of Shame and a girl group's matchups (2026-11-18), sliced from the cached career stats.
import { type Db, listIdols } from "@sabung/db";
import { groupMatchups } from "./groupMatchups";
import { hallOfShame } from "./hallOfShame";
import { wikiStats } from "./wikiWorker";

export async function hallOfShameOf(db: Db, minMatches: number) {
  const stats = await wikiStats(db);
  return hallOfShame(stats.rows, stats.pairs, stats.upsets, new Map((await listIdols(db)).map((i) => [i.id, i.rating])), minMatches);
}

export async function groupMatchupsOf(db: Db, groupId: string) {
  return groupMatchups((await wikiStats(db)).pairs, new Map((await listIdols(db)).map((i) => [i.id, i.groupId])), groupId);
}
