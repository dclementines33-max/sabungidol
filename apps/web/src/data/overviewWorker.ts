// Home and Dashboard reads in the Worker (PRD §8): the live season's state, reigning champions, the biggest
// upset of this season, On This Day (the same matchday in earlier seasons), all-time leaders, facts, totals, last backup.
import { type Db, countMatches, currentSeason, listGroups, listIdols, listSeasons, queryMatches } from "@sabung/db";
import { allTimeTop, awardCounts, homeFacts, homeLeaders } from "./homeFacts";
import { lastBackupAt } from "./backup/backupWorker";
import { seasonOverview } from "./seasonRunner";
import { awardHistory, champions, wikiStats } from "./wikiWorker";

// A live season at 100% progress counts as done even before archiving.
export function countSeasonsDone(archived: number, progress: number, activeCount: number): number {
  return archived + (progress >= 1 && activeCount > 0 ? 1 : 0);
}

export async function overview(db: Db) {
  const season = (await currentSeason(db))!;
  const live = season.status === "live" ? await seasonOverview(db) : null;
  const stats = await wikiStats(db);
  const titles = await champions(db);
  const awards = awardCounts(await awardHistory(db));
  const top = allTimeTop(stats.rows);
  const next = live?.pending[0] ?? null;
  const earlier = next?.stage === "LG" ? (await queryMatches(db, { round: next.round, stage: "LG" }, { limit: 5000 })).rows.filter((m) => m.seasonId !== season.id) : [];
  const gap = (m: (typeof earlier)[number]) => (m.result === "A" ? m.ratingB - m.ratingA : m.result === "B" ? m.ratingA - m.ratingB : -99);
  const active = live?.competitions.filter((c) => c.status !== "off" && c.status !== "none") ?? [];
  const progress = active.length ? active.filter((c) => c.status === "finished").length / active.length : 0;
  return {
    season: { name: season.name, number: season.number, status: season.status },
    competitions: live?.competitions ?? [],
    progress,
    played: live?.played ?? 0,
    lastUnzure: titles.find((t) => t.key === "UZC") ?? null,
    upset: stats.upsets.find((u) => u.season === season.number) ?? null,
    onThisDay: earlier.sort((x, y) => gap(y) - gap(x) || x.id.localeCompare(y.id)).slice(0, 6),
    allTimeTop: top,
    allTimeTopAwards: top ? awards.get(top.idolId) ?? 0 : 0,
    leaders: homeLeaders(stats.rows, awards),
    facts: homeFacts(stats.rows, stats.pairs, stats.upsets),
    totals: { idols: (await listIdols(db)).length, groups: (await listGroups(db)).length, seasonsDone: countSeasonsDone((await listSeasons(db)).filter((s) => s.status === "archived").length, progress, active.length) },
    matches: await countMatches(db),
    lastBackup: await lastBackupAt(db),
  };
}
