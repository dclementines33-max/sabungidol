// Wiki reads in the Worker (PRD §8): career stats are computed once per change of the saved matches and
// sliced per page here, so a page receives only what it shows (not 30,000 head-to-head pairs).
import { type Db, type MatchFilter, countMatches, countMatchesWhere, listAchievements, listPlacements, listRatingHistory, listSeasons, queryMatches } from "@sabung/db";
import { type PairRecord, allTimeRecords } from "@sabung/engine";
import { careerStats } from "./careerWorker";

type Stats = Awaited<ReturnType<typeof careerStats>>;
let memo: { key: string; stats: Promise<Stats> } | undefined;

// Matches are append-only and season status moves forward, so (match count, statuses) says when to recompute.
export async function wikiStats(db: Db): Promise<Stats> {
  const key = `${await countMatches(db)}|${(await listSeasons(db)).map((s) => s.status).join()}`;
  if (memo?.key !== key) memo = { key, stats: careerStats(db) };
  return memo.stats;
}

const seasonNumbers = async (db: Db) => new Map((await listSeasons(db)).map((s) => [s.id, s.number]));

// One idol's record against every opponent, most meetings first.
export function rivalsOf(pairs: Record<string, PairRecord>, id: string, limit = 10) {
  return Object.entries(pairs).flatMap(([key, p]) => {
    const [lo, hi] = key.split("|") as [string, string];
    if (lo !== id && hi !== id) return [];
    const mine = lo === id;
    return [{ opponent: mine ? hi : lo, meetings: p.meetings, wins: mine ? p.winsLo : p.winsHi, draws: p.draws, losses: mine ? p.winsHi : p.winsLo }];
  }).sort((a, b) => b.meetings - a.meetings || a.opponent.localeCompare(b.opponent)).slice(0, limit);
}

export async function idolProfile(db: Db, id: string) {
  const stats = await wikiStats(db);
  const number = await seasonNumbers(db);
  const rows = stats.rows.filter((r) => r.idolId === id);
  const records = allTimeRecords(stats.rows).flatMap((c) => c.entries.filter((e) => e.idolId === id && e.rank <= 10).map((e) => ({ id: c.id, label: c.label, kind: c.kind, ...e })));
  return {
    rows,
    placements: (await listPlacements(db)).filter((p) => p.idolId === id).map((p) => ({ ...p, season: number.get(p.seasonId) ?? 0 })).sort((a, b) => a.season - b.season || a.comp.localeCompare(b.comp)),
    badges: (await listAchievements(db)).filter((a) => a.idolId === id).map((a) => ({ badge: a.badge, season: number.get(a.seasonId) ?? 0 })).sort((a, b) => a.season - b.season),
    ratingHistory: (await listRatingHistory(db, id)).map((h) => ({ old: h.old, new: h.new, season: h.seasonId ? number.get(h.seasonId) ?? null : null, at: h.at.toISOString() })).reverse(),
    rivals: rivalsOf(stats.pairs, id),
    records,
  };
}

// A page of matches; the count only with the first page (the next pages reuse it).
export async function matchPage(db: Db, filter: MatchFilter, opts: { after?: string; limit?: number; newest?: boolean }) {
  const page = await queryMatches(db, filter, opts);
  return { ...page, total: opts.after ? null : await countMatchesWhere(db, filter) };
}

// Career Stats (PRD §8): every idol's row for one competition key ("ALL" = Combined).
export const careerTable = async (db: Db, comp: string) => (await wikiStats(db)).rows.filter((r) => r.comp === comp);
