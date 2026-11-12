import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { addIdols, setActive } from "./idols";
import { checkIntegrity, removeOrphanMatches } from "./integrity";
import { type Db, openDb } from "./openDb";
import { saveMatches } from "./saveMatches";
import { deleteMatches, listSeasonMatches, startSeason } from "./seasonPlay";
import { createDraftSeason, currentSeason, leagueRosters } from "./seasons";

let db: Db;
let ids: string[];
const match = (id: string, a: string, b: string) => ({ id, comp: "D1A" as const, stage: "LG" as const, round: "MD01", idolA: a, idolB: b,
  games: ["A", "B", "A", "B"] as ("A" | "B")[], scoreA: 2, scoreB: 2, result: "D" as const, ratingA: 70, ratingB: 70, formA: "Steady", formB: "Steady" });

beforeEach(async () => {
  db = await openDb();
  ids = (await addIdols(db, Array.from({ length: 240 }, (_, i) => ({ name: `I${i}`, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })))).added;
  const leagues = Object.fromEntries([...D1_LEAGUES, ...D2_LEAGUES].map((c, l) => [c, ids.slice(l * 20, l * 20 + 20)]));
  await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "s", leagues });
});

describe("playing a season in the database", () => {
  it("starts only with complete leagues and nobody inactive, saying why not", async () => {
    await setActive(db, [ids[0]!], false);
    expect(await startSeason(db, "S01", ids.slice(0, 20))).toEqual({ ok: false, problems: ["D1A berisi idol nonaktif: I0"] });
    expect((await checkIntegrity(db)).map((i) => i.code)).toEqual(["E-INT-002", "W-INT-004"]);
    await setActive(db, [ids[0]!], true);
    expect(await startSeason(db, "S01", ids.slice(0, 20))).toEqual({ ok: true });
    expect((await currentSeason(db))!.status).toBe("live");
    expect((await leagueRosters(db, "S01")).IDL).toEqual(ids.slice(0, 20)); // The Idols fixed at the start
  });

  it("reads matches back in the engine's shape, deletes stale ones, and finds orphan league matches", async () => {
    await saveMatches(db, "S01", [match("S01-D1A-LG-MD01-M01", ids[0]!, ids[1]!), match("S01-D1A-LG-MD01-M02", ids[0]!, ids[30]!)]);
    const [m] = await listSeasonMatches(db, "S01");
    expect(m).toMatchObject({ id: "S01-D1A-LG-MD01-M01", slot: 1, games: ["A", "B", "A", "B"], result: "D" });
    const orphan = (await checkIntegrity(db)).find((i) => i.code === "E-INT-003");
    expect(orphan).toMatchObject({ count: 1, fix: "remove-orphan-matches" }); // ids[30] plays in D1B
    await removeOrphanMatches(db);
    expect((await listSeasonMatches(db, "S01")).map((x) => x.id)).toEqual(["S01-D1A-LG-MD01-M01"]);
    await deleteMatches(db, "S01", ["S01-D1A-LG-MD01-M01"]);
    expect(await listSeasonMatches(db, "S01")).toEqual([]);
  });
});
