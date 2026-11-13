import { createSeason, idols, openDb, saveMatches } from "@sabung/db";
import { runSeason, testSeason } from "@sabung/engine";
import { expect, it } from "vitest";
import { seasonMatches } from "./seasonMatches";

it("reads a season once and reads again after a save", async () => {
  const db = await openDb();
  const input = testSeason();
  await db.insert(idols).values(input.idols.map((i) => ({ id: i.id, name: i.id, groupId: null, rating: i.rating })));
  await createSeason(db, { id: "S01", number: 1, name: "Season 1", seed: input.seed });
  expect(await seasonMatches(db, "S01")).toEqual([]);
  const first = await seasonMatches(db, "S01");
  expect(await seasonMatches(db, "S01")).toBe(first); // same copy while nothing changed
  await saveMatches(db, "S01", runSeason(input).matches.slice(0, 10));
  const after = await seasonMatches(db, "S01");
  expect(after).not.toBe(first);
  expect(after).toHaveLength(10);
}, 60_000);
