// Wiki reads in the Worker (PRD §8): career stats are computed once per change of the saved matches and
// sliced per page here, so a page receives only what it shows (not 30,000 head-to-head pairs).
import { type Db, type MatchFilter, countMatches, countMatchesWhere, listAchievements, listPlacements, listRatingHistory, listSeasons, queryMatches } from "@sabung/db";
import { type PairRecord, allTimeRecords, rankRecords } from "@sabung/engine";
import { careerStats, updateCareerCache } from "./careerWorker";

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

// Girl Group Stats: every title an idol holds per competition key (only lines with a title).
export const titlesByComp = async (db: Db) => (await wikiStats(db)).rows.filter((r) => r.comp !== "ALL" && r.titles > 0).map((r) => ({ idolId: r.idolId, comp: r.comp, titles: r.titles }));

export const seasonList = async (db: Db) => (await listSeasons(db)).map((s) => ({ id: s.id, number: s.number, name: s.name, status: s.status }));

// Head to Head (PRD §8): the pair's record from A's side, both idols' Combined lines, and the 10 pairs met most often.
export async function headToHead(db: Db, a?: string, b?: string) {
  const stats = await wikiStats(db);
  const top = Object.entries(stats.pairs).sort((x, y) => y[1].meetings - x[1].meetings || x[0].localeCompare(y[0])).slice(0, 10)
    .map(([key, p]) => ({ a: key.split("|")[0]!, b: key.split("|")[1]!, meetings: p.meetings, winsA: p.winsLo, winsB: p.winsHi, draws: p.draws }));
  const line = (id?: string) => stats.rows.find((r) => r.idolId === id && r.comp === "ALL") ?? null;
  const pair = a && b ? rivalsOf(stats.pairs, a, Number.POSITIVE_INFINITY).find((r) => r.opponent === b) ?? null : null;
  // Update 2 tale of the tape: games won in their direct matches, and each idol's last five results (newest first).
  const direct = a && b ? (await queryMatches(db, { idolId: a, vsId: b }, { limit: 100_000 })).rows : [];
  const games = direct.reduce(([x, y], m) => (m.idolA === a ? [x + m.scoreA, y + m.scoreB] : [x + m.scoreB, y + m.scoreA]), [0, 0]);
  const form = async (id?: string) => (id ? (await queryMatches(db, { idolId: id }, { limit: 5, newest: true })).rows
    .map((m) => (m.result === "D" ? "D" : (m.result === "A") === (m.idolA === id) ? "W" : "L")) : []);
  return { top, pair, lineA: line(a), lineB: line(b), games, formA: await form(a), formB: await form(b) };
}

// Hall of Champions (PRD §8): every title per season with its runner-up and the final's score (cups only;
// leagues have no final). Finals are few, so they are read whole.
export async function champions(db: Db) {
  const number = await seasonNumbers(db);
  const placements = await listPlacements(db);
  const finals = (await queryMatches(db, { stage: "FN" }, { limit: 100_000, newest: false })).rows;
  return placements.filter((p) => p.finalRank === 1).map((p) => {
    const runnerUp = placements.find((r) => r.seasonId === p.seasonId && r.comp === p.comp && r.finalRank === 2)?.idolId ?? null;
    const third = placements.find((r) => r.seasonId === p.seasonId && r.comp === p.comp && r.finalRank === 3)?.idolId ?? null;
    const code = p.comp.startsWith("MBK") ? "MBK" : p.comp.split("-")[0];
    const final = finals.filter((m) => m.seasonId === p.seasonId && m.comp === code && [m.idolA, m.idolB].includes(p.idolId) && (!runnerUp || [m.idolA, m.idolB].includes(runnerUp))).at(-1);
    const score = final ? (final.idolA === p.idolId ? `${final.scoreA}–${final.scoreB}` : `${final.scoreB}–${final.scoreA}`) : null;
    return { season: number.get(p.seasonId) ?? 0, key: p.comp, champion: p.idolId, runnerUp, third, score };
  }).sort((a, b) => b.season - a.season || a.key.localeCompare(b.key));
}

// All-time Records (PRD §8, §7.3): every category ranked (competition ranking, fixed before any name search),
// plus the biggest upsets and the most head-to-head meetings, ranked the same way.
export async function records(db: Db, minMatches: number) {
  const stats = await wikiStats(db);
  const upsets = rankRecords(stats.upsets.map((u) => ({ idolId: u.matchId, value: u.gap, matches: 0 })), "total")
    .map((e) => ({ ...e, ...stats.upsets.find((u) => u.matchId === e.idolId)! }));
  const meetings = rankRecords(Object.entries(stats.pairs).map(([key, p]) => ({ idolId: key, value: p.meetings, matches: 0 })), "total").slice(0, 100);
  const sotsRaw = await idolOfSeason(db);
  const sots = rankRecords(sotsRaw.map((r) => ({ idolId: r.idolId, value: r.value, matches: 0 })), "total")
    .map((e) => ({ ...e, seasons: sotsRaw.find((r) => r.idolId === e.idolId)!.seasons }));
  return { categories: allTimeRecords(stats.rows, { minMatches }), upsets, meetings, idolOfSeason: sots };
}

// Idol of the Season: who finished #1 of the Season Honours podium most often, with the seasons. The per-season #1 is kept in the career cache.
export async function idolOfSeason(db: Db) {
  const wins = new Map<string, number[]>();
  for (const [number, idolId] of Object.entries((await updateCareerCache(db)).tops)) wins.set(idolId, [...(wins.get(idolId) ?? []), Number(number)]);
  return [...wins].map(([idolId, ns]) => ({ idolId, value: ns.length, seasons: ns.sort((a, b) => a - b) }));
}
