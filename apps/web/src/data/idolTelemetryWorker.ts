// One idol's telemetry across every season (2026-11-17): per season and per competition, her share of games won against
// what her rating expected (engine seasonTelemetry, no minimum), and — once the season is complete — her achievement in
// each competition (0–100 place value) against what the rating model expected for her rating (placeExpectations).
// Every played season is replayed from its saved matches; nothing is played.
import { type Db, listSeasons } from "@sabung/db";
import { placeExpectations, runSeason, seasonPlacements, seasonTelemetry } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

const pick = (rows: ReturnType<typeof seasonTelemetry>, id: string) => rows.find((r) => r.idolId === id);

export async function idolTelemetry(db: Db, id: string) {
  const out = [];
  for (const season of (await listSeasons(db)).filter((s) => s.status !== "draft").sort((a, b) => a.number - b.number)) {
    const input = await seasonInput(db, season);
    const result = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
    const mine = result.matches.filter((m) => m.idolA === id || m.idolB === id);
    const scale = input.tuning?.scale ?? 40;
    const overall = pick(seasonTelemetry(mine, scale, 1), id);
    if (!overall) continue;
    const comps = [...new Set(mine.map((m) => m.comp))].sort().map((comp) => ({ comp, ...pick(seasonTelemetry(mine.filter((m) => m.comp === comp), scale, 1), id)! }));
    const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
    const leagues = { ...input.leagues, ...(input.theIdols ? { IDL: input.theIdols } : {}) } as Record<string, string[]>;
    const r = (x: string) => rating.get(x) ?? 0;
    const places = result.done ? placeExpectations(result.matches, seasonPlacements(result.matches, result.titles, leagues, r), leagues, r).filter((p) => p.id === id).map((p) => ({ ...p, expected: Math.max(0, Math.min(100, p.expected)) })) : []; // the straight-line fit can run past 0–100
    out.push({ season: season.number, name: season.name, overall, comps, places });
  }
  return out;
}
