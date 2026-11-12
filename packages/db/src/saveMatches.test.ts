import { runSeason } from "@sabung/engine";
import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { testSeason } from "../../engine/src/season/testRoster";
import { createSeason } from "./createSeason";
import { gamesFromMask } from "./gamesMask";
import { type Db, openDb } from "./openDb";
import { saveMatches } from "./saveMatches";
import { groups, idols, matches } from "./schema";

const input = testSeason();
const season = runSeason(input);
let db: Db;

// One batch per round, as the live app writes one matchday at a time.
const batches = new Map<string, typeof season.matches>();
for (const m of season.matches) {
  const key = `${m.stage === "LG" ? "" : m.comp}-${m.round}`;
  batches.set(key, [...(batches.get(key) ?? []), m]);
}

beforeAll(async () => {
  db = await openDb();
  await db.insert(idols).values(input.idols.map((i) => ({ id: i.id, name: i.id, groupId: null, rating: i.rating })));
  await createSeason(db, { id: "S01", number: 1, name: "Season 1", seed: input.seed });
});

describe("saving a season (PRD §12, §13)", () => {
  it("writes all 5,590 matches in round batches", async () => {
    let inserted = 0;
    for (const batch of batches.values()) inserted += (await saveMatches(db, "S01", batch)).inserted;
    expect(inserted).toBe(5590);
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(matches);
    expect(n).toBe(5590);
  });

  it("counts per competition in SQL match the engine", async () => {
    const rows = await db.select({ comp: matches.comp, n: sql<number>`count(*)::int` }).from(matches).groupBy(matches.comp);
    for (const { comp, n } of rows) expect(n).toBe(season.matches.filter((m) => m.comp === comp).length);
  });

  it("guardrail §14.4: saving the same matches twice adds no rows", async () => {
    const again = await saveMatches(db, "S01", season.matches);
    expect(again).toEqual({ inserted: 0, skipped: 5590 });
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(matches);
    expect(n).toBe(5590);
  });

  it("game order survives the round trip", async () => {
    const original = season.matches.find((m) => m.games.length === 7)!;
    const [row] = await db.select().from(matches).where(sql`${matches.id} = ${original.id}`);
    expect(gamesFromMask(row.games, row.scoreA + row.scoreB)).toEqual(original.games);
    expect(row).toMatchObject({ idolA: original.idolA, result: original.result, method: "sim", formA: original.formA });
  });

  it("refuses a duplicate idol: same name in the same group, or two soloists", async () => {
    await db.insert(idols).values({ id: "x1", name: "Mina", groupId: null, rating: 70 });
    await expect(db.insert(idols).values({ id: "x2", name: "MINA", groupId: null, rating: 70 })).rejects.toThrow();
    await db.insert(groups).values([{ id: "g1", name: "Twice" }, { id: "g2", name: "Other" }]);
    await db.insert(idols).values({ id: "x3", name: "Mina", groupId: "g1", rating: 70 });
    await expect(db.insert(idols).values({ id: "x4", name: "mina", groupId: "g1", rating: 70 })).rejects.toThrow();
    await db.insert(idols).values({ id: "x5", name: "Mina", groupId: "g2", rating: 70 }); // same name, other group = allowed
  });
});
