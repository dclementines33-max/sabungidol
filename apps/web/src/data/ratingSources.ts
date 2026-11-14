// Rating Manager sources that need played seasons (PRD §6.4, §6.5), computed in the Worker. They only
// propose new ratings; the Rating Manager draft is saved by the user.
import { type Db, type SeasonRow, listSeasons } from "@sabung/db";
import { promotionPlan, runSeason, seasonProgression } from "@sabung/engine";
import { careerTargets } from "./careerTargets";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

export type Proposal = { idolId: string; new: number; reason: string };

// Progression rows of every finished season, newest first.
async function finishedSeasons(db: Db) {
  const out: { season: SeasonRow; rows: ReturnType<typeof seasonProgression> }[] = [];
  for (const season of await listSeasons(db)) {
    if (season.status !== "live" && season.status !== "archived") continue;
    const input = await seasonInput(db, season);
    const result = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
    if (!result.done) continue;
    const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
    const plan = promotionPlan(result.matches, input.leagues, (id) => rating.get(id) ?? 0);
    const leagues = { ...input.leagues, ...(input.theIdols ? { IDL: input.theIdols } : {}) };
    out.push({ season, rows: seasonProgression(result.matches, result.titles, leagues, plan) });
  }
  return out;
}

// §6.4: Season Progression of the last finished season, from the ratings it was played with
// (running it again gives the same ratings).
export async function lastSeasonProgression(db: Db): Promise<{ season: string | null; proposals: Proposal[] }> {
  const [last] = await finishedSeasons(db);
  if (!last) return { season: null, proposals: [] };
  return { season: last.season.name, proposals: last.rows.map((r) => ({ idolId: r.idolId, new: r.new, reason: `Progression ${last.season.name}: ${r.reason}` })) };
}

// §6.5: all-time score (newest season weight 1.0, 15% less per season back) → rank → careerTargets curve (2026-11-15:
// modest, only the top 2–3% at 90+; was an even 45–98 spread).
export async function careerSync(db: Db, current: Record<string, number>, mode: "replace" | "blend"): Promise<Proposal[]> {
  const total = new Map<string, number>();
  (await finishedSeasons(db)).forEach(({ rows }, age) => {
    for (const r of rows) total.set(r.idolId, (total.get(r.idolId) ?? 0) + r.score * 0.85 ** age);
  });
  return [...careerTargets(total)].map(([idolId, target]) => {
    const value = mode === "blend" ? (target + (current[idolId] ?? target)) / 2 : target;
    return { idolId, new: Math.round(value), reason: `Sync Career Stats (${mode === "blend" ? "Blend 50/50" : "Replace"})` };
  });
}
