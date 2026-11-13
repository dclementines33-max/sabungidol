import { describe, expect, it } from "vitest";
import { addIdols } from "./idols";
import { countMatchesWhere, queryMatches } from "./matchQuery";
import { openDb } from "./openDb";
import { saveMatches } from "./saveMatches";
import { createDraftSeason } from "./seasons";

const match = (n: number, a: string, b: string, result: "A" | "B" | "D") => ({ id: `S01-D1A-LG-MD0${n}-M01`, comp: "D1A" as const, stage: "LG" as const, round: `MD0${n}`, idolA: a, idolB: b,
  games: ["A", "B", "A"] as ("A" | "B")[], scoreA: 2, scoreB: 1, result, ratingA: 70, ratingB: 70, formA: "Steady", formB: "Steady" });

describe("matches for the wiki", () => {
  it("filters by idol, opponent and result, and pages with a cursor", async () => {
    const db = await openDb();
    const [a, b, c] = (await addIdols(db, ["A", "B", "C"].map((name) => ({ name, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })))).added as [string, string, string];
    await createDraftSeason(db, { id: "S01", number: 1, name: "S1", seed: "s", leagues: {} });
    await saveMatches(db, "S01", [match(1, a, b, "A"), match(2, b, a, "A"), match(3, a, c, "D"), match(4, c, b, "B")]);
    expect(await countMatchesWhere(db, { idolId: a })).toBe(3);
    expect(await countMatchesWhere(db, { idolId: a, vsId: b })).toBe(2);
    expect((await queryMatches(db, { idolId: a, result: "W" })).rows.map((m) => m.round)).toEqual(["MD01"]);
    expect((await queryMatches(db, { idolId: b, result: "W" })).rows.map((m) => m.round)).toEqual(["MD04", "MD02"]);
    const first = await queryMatches(db, {}, { limit: 3 });
    expect(first.rows.map((m) => m.round)).toEqual(["MD04", "MD03", "MD02"]);
    const second = await queryMatches(db, {}, { limit: 3, after: first.next! });
    expect([second.rows.map((m) => m.round), second.next]).toEqual([["MD01"], null]);
  });
});
