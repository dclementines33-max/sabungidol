// FASE 4 GATE (PRD §15): on 20 synthetic seasons, the stats cache built season by season equals
// "Rebuild Stats" from zero — career stats and placements alike.
import { type Db, archiveSeason, createDraftSeason, groups, idols, listAchievements, listPlacements, openDb, readCache, saveMatches } from "@sabung/db";
import { syntheticSeasons } from "@sabung/engine";
import { describe, expect, it } from "vitest";
import { seasonArchive } from "./archiveWorker";
import { careerStats, rebuildStats, updateCareerCache } from "./careerWorker";
import { overview } from "./overviewWorker";
import { storyOf } from "./storyWorker";
import { careerTable, champions, headToHead, idolProfile, matchPage, records } from "./wikiWorker";

const SEASONS = 20;

async function addSeason(db: Db, s: ReturnType<typeof syntheticSeasons> extends Generator<infer T> ? T : never) {
  const id = `S${String(s.input.season).padStart(2, "0")}`;
  await createDraftSeason(db, { id, number: s.input.season, name: `Season ${s.input.season}`, seed: s.input.seed, leagues: { ...s.input.leagues, IDL: s.input.theIdols } });
  await archiveSeason(db, id);
  await saveMatches(db, id, s.result.matches);
}

describe("Fase 4 gate: Rebuild Stats = cache", () => {
  it(`${SEASONS} synthetic seasons: cache built season by season is identical to a rebuild from zero`, async () => {
    const db = await openDb();
    let first = true;
    for (const s of syntheticSeasons(SEASONS, "gate")) {
      if (first) {
        const groupIds = [...new Set(s.input.idols.map((i) => i.groupId).filter((g): g is string => !!g))];
        await db.insert(groups).values(groupIds.map((id) => ({ id, name: id })));
        await db.insert(idols).values(s.input.idols.map((i) => ({ id: i.id, name: i.id, groupId: i.groupId, rating: i.rating })));
        first = false;
      }
      await addSeason(db, s);
      expect((await updateCareerCache(db)).seasons).toHaveLength(s.input.season); // every season replays complete
    }
    const cached = await readCache(db, "career");
    const placementsBefore = await listPlacements(db);
    const badgesBefore = await listAchievements(db);
    const rowsBefore = await careerStats(db);

    expect(await rebuildStats(db)).toBe(SEASONS);
    expect(await readCache(db, "career")).toEqual(cached);
    const sort = (rows: { seasonId: string; comp: string; idolId: string }[]) => [...rows].sort((a, b) => `${a.seasonId}${a.comp}${a.idolId}`.localeCompare(`${b.seasonId}${b.comp}${b.idolId}`));
    expect(sort(await listPlacements(db))).toEqual(sort(placementsBefore));
    expect(await careerStats(db)).toEqual(rowsBefore);
    const byKey = (rows: { seasonId: string; badge: string; idolId: string }[]) => rows.map((r) => `${r.seasonId}|${r.badge}|${r.idolId}`).sort();
    expect(byKey(await listAchievements(db))).toEqual(byKey(badgesBefore));
    expect(badgesBefore.filter((b) => b.badge === "idol-of-season")).toHaveLength(SEASONS);
    expect(placementsBefore.length).toBeGreaterThan(SEASONS * 600);

    // Pages stay fast on this data: every wiki read, timed (the first one also loads the stats once).
    const idol = rowsBefore.rows[0]!.idolId;
    const reads: [string, () => Promise<unknown>][] = [
      ["career stats (first, loads the cache)", () => careerTable(db, "ALL")], ["idol profile", () => idolProfile(db, idol)],
      ["head to head", () => headToHead(db, idol, rowsBefore.rows[1]!.idolId)], ["hall of champions", () => champions(db)],
      ["all-time records", () => records(db, 50)], ["match database page", () => matchPage(db, {}, {})],
      ["match database, one idol", () => matchPage(db, { idolId: idol }, {})], ["season archive", () => seasonArchive(db, "S20")],
      ["season story", () => storyOf(db, "S20")], ["home/dashboard", () => overview(db)],
    ];
    const times: Record<string, number> = {};
    for (const [name, read] of reads) {
      const t = performance.now();
      await read();
      times[name] = Math.round(performance.now() - t);
    }
    console.log("wiki reads on 20 seasons (ms):", times);
    expect(Math.max(...Object.values(times))).toBeLessThan(3000);
  }, 600_000);
});
