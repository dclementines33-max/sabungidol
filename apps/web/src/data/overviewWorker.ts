// Home and Dashboard reads in the Worker (PRD §8): the live season's state, reigning champions, the biggest
// upset of this season, On This Day (the same matchday in earlier seasons), idols On Fire, last backup.
import { type Db, countMatches, currentSeason, queryMatches } from "@sabung/db";
import { lastBackupAt } from "./backup/backupWorker";
import { seasonOverview } from "./seasonRunner";
import { champions, wikiStats } from "./wikiWorker";

export async function overview(db: Db) {
  const season = (await currentSeason(db))!;
  const live = season.status === "live" ? await seasonOverview(db) : null;
  const stats = await wikiStats(db);
  const titles = await champions(db);
  const latest = Math.max(0, ...titles.map((t) => t.season));
  const next = live?.pending[0] ?? null;
  const earlier = next?.stage === "LG" ? (await queryMatches(db, { round: next.round, stage: "LG" }, { limit: 5000 })).rows.filter((m) => m.seasonId !== season.id) : [];
  const gap = (m: (typeof earlier)[number]) => (m.result === "A" ? m.ratingB - m.ratingA : m.result === "B" ? m.ratingA - m.ratingB : -99);
  const active = live?.competitions.filter((c) => c.status !== "off") ?? [];
  return {
    season: { name: season.name, number: season.number, status: season.status },
    competitions: live?.competitions ?? [],
    progress: active.length ? active.filter((c) => c.status === "finished").length / active.length : 0,
    played: live?.played ?? 0,
    next: next && { id: next.id, a: next.idolA, b: next.idolB, comp: next.comp, round: next.round },
    reigning: titles.filter((t) => t.season === latest),
    lastUnzure: titles.find((t) => t.key === "UZC") ?? null,
    upset: stats.upsets.find((u) => u.season === season.number) ?? null,
    onThisDay: earlier.sort((x, y) => gap(y) - gap(x) || x.id.localeCompare(y.id)).slice(0, 6),
    onFire: stats.rows.filter((r) => r.comp === "ALL" && r.winStreak >= 5).sort((a, b) => b.winStreak - a.winStreak || a.idolId.localeCompare(b.idolId)).slice(0, 6).map((r) => ({ idolId: r.idolId, streak: r.winStreak })),
    matches: await countMatches(db),
    lastBackup: await lastBackupAt(db),
  };
}
