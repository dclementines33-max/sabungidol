// Season Honours detail in the Worker: what each honoured idol (top 3, Unzure champion) did — record, games, longest
// run, titles, every final place and the rating change. Places come from the season's own replay, so they show as soon
// as the season is complete (saved placements only exist once the career stats fold the season). The news is a
// separate query (Season Story), so this answers fast.
import { type Db, listSeasonRatingChanges, listSeasons } from "@sabung/db";
import { runSeason, seasonPlacements } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";
import { seasonRecord } from "./podiumDetail";

export async function podiumOf(db: Db, seasonId: string, ids: string[]) {
  const season = (await listSeasons(db)).find((s) => s.id === seasonId);
  if (!season) return [];
  const input = await seasonInput(db, season);
  const result = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const leagues = { ...input.leagues, ...(input.theIdols ? { IDL: input.theIdols } : {}) } as Record<string, string[]>;
  const places = result.done ? seasonPlacements(result.matches, result.titles, leagues, (id) => rating.get(id) ?? 0) : [];
  const changes = await listSeasonRatingChanges(db, seasonId);
  return ids.map((id) => ({
    id, record: seasonRecord(result.matches, id),
    titles: Object.entries(result.titles).filter(([, t]) => t?.champion === id).map(([key]) => key).sort(),
    places: places.filter((p) => p.idolId === id).map((p) => ({ comp: p.comp, rank: p.finalRank })).sort((a, b) => a.rank - b.rank || a.comp.localeCompare(b.comp)),
    rating: changes.find((c) => c.idolId === id) ?? null,
    startRating: rating.get(id) ?? null,
  }));
}
