import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { addIdols, listIdols } from "./idols";
import { openDb } from "./openDb";
import { applyRatings } from "./ratings";
import { resetStatistics } from "./resetStatistics";
import { saveMatches } from "./saveMatches";
import { startSeason } from "./seasonPlay";
import { createDraftSeason, currentSeason, leagueRosters } from "./seasons";
import { idols, matches, ratingHistory, seasons } from "./schema";

describe("statistics reset", () => {
  it("keeps idols with their ratings and the league rosters as Season 1 draft; everything played goes", async () => {
    const db = await openDb();
    const ids = (await addIdols(db, Array.from({ length: 240 }, (_, i) => ({ name: `I${i}`, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })))).added;
    const leagues = Object.fromEntries([...D1_LEAGUES, ...D2_LEAGUES].map((c, l) => [c, ids.slice(l * 20, l * 20 + 20)]));
    await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "s", leagues });
    await createDraftSeason(db, { id: "S02", number: 2, name: "Season 2", seed: "t", leagues, config: { opener: [["a", "b"]] } });
    await startSeason(db, "S02", ids.slice(0, 20));
    await saveMatches(db, "S02", [{ id: "S02-D1A-LG-MD01-M01", comp: "D1A", stage: "LG", round: "MD01", idolA: ids[0]!, idolB: ids[1]!, games: ["A", "A", "A"], scoreA: 3, scoreB: 0, result: "A", ratingA: 70, ratingB: 70, formA: "Steady", formB: "Steady" }]);
    await applyRatings(db, [{ idolId: ids[3]!, new: 88, reason: "t" }], "manager");

    await resetStatistics(db);
    const season = await currentSeason(db);
    expect([season?.id, season?.number, season?.status, (season?.config as { opener?: unknown }).opener]).toEqual(["S01", 1, "draft", undefined]);
    expect((await db.select().from(seasons)).length).toBe(1);
    expect((await db.select().from(matches)).length).toBe(0);
    expect((await db.select().from(ratingHistory)).length).toBe(0);
    expect(await leagueRosters(db, "S01")).toEqual(leagues);
    expect((await db.select({ r: idols.rating }).from(idols).where(eq(idols.id, ids[3]!)))[0]!.r).toBe(88);
    expect((await listIdols(db)).length).toBe(240);
  });
});
