import { createSeason, idols, openDb, saveMatches } from "@sabung/db";
import { expect, it } from "vitest";
import { arenaRead } from "./arenaWorker";

const m = (n: number, a: string, b: string, games: ("A" | "B")[], arenas: string[] | null) => {
  const sa = games.filter((g) => g === "A").length, sb = games.length - sa;
  return { id: `S01-D1A-LG-MD0${n}-M01`, comp: "D1A" as const, stage: "LG" as const, round: `MD0${n}`, idolA: a, idolB: b, games, scoreA: sa, scoreB: sb,
    result: (sa > sb ? "A" : sb > sa ? "B" : "D") as "A" | "B" | "D", ratingA: 90, ratingB: 80, formA: "Steady", formB: "Steady", arenas };
};

it("reads arena stats: overview, an idol per arena, a pair per arena; matches without arenas are left out", async () => {
  const db = await openDb();
  await db.insert(idols).values([{ id: "x", name: "X", rating: 90 }, { id: "y", name: "Y", rating: 80 }, { id: "z", name: "Z", rating: 70 }]);
  await createSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "s" });
  await saveMatches(db, "S01", [m(1, "x", "y", ["A", "A", "A"], ["jeju"]), m(2, "y", "x", ["A", "A", "A"], ["jeju"]), m(3, "x", "z", ["A", "A", "A"], ["sky"]), m(4, "x", "z", ["A", "A", "A"], null)]);
  const overview = await arenaRead(db, "overview", []) as { matches: number; usage: Record<string, number> };
  expect(overview.matches).toBe(3);
  expect(overview.usage).toEqual({ jeju: 2, sky: 1 });
  expect(await arenaRead(db, "idol", ["x"])).toEqual([{ arena: "jeju", w: 1, d: 0, l: 1 }, { arena: "sky", w: 1, d: 0, l: 0 }]);
  expect(await arenaRead(db, "pair", ["x", "z"])).toEqual([{ arena: "sky", w: 1, d: 0, l: 0 }]);
}, 60_000);
