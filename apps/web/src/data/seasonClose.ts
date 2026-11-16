// Closing the season (PRD §4, §6.3): archive guard, Rating Progression (preview → save, optional),
// promotion/relegation preview and "Start New Season" (a new draft season N+1). Runs in the Worker.
import { type Db, applyRatings, archiveSeason, createDraftSeason, currentSeason, listAchievements, listSeasonMatches } from "@sabung/db";
import { boardTargets, openerPairs, promotionPlan, runSeason, seasonProgression } from "@sabung/engine";
import { readSeasonConfig, ulid } from "@sabung/shared";
import { updateCareerCache } from "./careerWorker";
import { seasonInput, seasonOverview } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

async function closeState(db: Db) {
  const overview = await seasonOverview(db);
  const blockers = overview.competitions.filter((c) => c.status !== "off" && c.status !== "none" && c.status !== "finished").map((c) => c.name);
  const input = await seasonInput(db);
  const result = runSeason({ ...input, saved: await seasonMatches(db, input.seasonId), target: () => false });
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const plan = promotionPlan(result.matches, input.leagues, (id) => rating.get(id) ?? 0);
  return { input, result, plan, blockers, rating };
}

export async function closePreview(db: Db) {
  const { input, result, plan, blockers, rating } = await closeState(db);
  if (blockers.length) return { blockers, progression: [], promoted: [], relegated: [], badges: [], targets: [] };
  const leagues = { ...input.leagues, ...(input.theIdols ? { IDL: input.theIdols } : {}) };
  const progression = seasonProgression(result.matches, result.titles, leagues, plan)
    .map((r) => ({ ...r, current: rating.get(r.idolId) ?? r.old }))
    .filter((r) => r.current !== r.new)
    .sort((a, b) => b.new - b.current - (a.new - a.current));
  await updateCareerCache(db); // the finished season gets its placements and badges (§7.2, §7.4)
  const badges = (await listAchievements(db)).filter((b) => b.seasonId === input.seasonId).map((b) => ({ idolId: b.idolId, badge: b.badge }));
  return { blockers, progression, promoted: plan.promoted, relegated: plan.relegated, badges, targets: boardTargets(result.matches) };
}

export async function saveProgression(db: Db) {
  const { blockers, progression } = await closePreview(db);
  if (blockers.length) throw new Error(`Not finished yet: ${blockers.join(", ")}`);
  const season = await currentSeason(db);
  return applyRatings(db, progression.map((r) => ({ idolId: r.idolId, new: r.new, reason: r.reason })), "progression", season!.id);
}

// The caller takes a snapshot first (worker.ts). The new season opens with Daesang + Music Bank between
// this season's champions (config.opener).
export async function startNewSeason(db: Db): Promise<{ ok: true; name: string; notices: string[] } | { ok: false; blockers: string[] }> {
  const { input, result, plan, blockers } = await closeState(db);
  if (blockers.length) return { ok: false, blockers };
  const old = (await currentSeason(db))!;
  const notices: string[] = [];
  const number = old.number + 1;
  const name = `Season ${number}`;
  await createDraftSeason(db, { id: `S${String(number).padStart(2, "0")}`, number, name, seed: ulid(), leagues: plan.leagues, config: { ...readSeasonConfig(old.config), opener: openerPairs(result.titles, readSeasonConfig(old.config).off, notices) } });
  await archiveSeason(db, input.seasonId);
  return { ok: true, name, notices };
}
