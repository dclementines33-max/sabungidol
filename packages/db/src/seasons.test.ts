import { beforeEach, describe, expect, it } from "vitest";
import { addIdols } from "./idols";
import { type Db, openDb } from "./openDb";
import { createDraftSeason, currentSeason, leagueRosters, replaceInRoster } from "./seasons";

let db: Db;
beforeEach(async () => {
  db = await openDb();
});

describe("draft season and league rosters (PRD §12.1)", () => {
  it("saves the season as a draft with each league's roster in order", async () => {
    const { added } = await addIdols(db, Array.from({ length: 4 }, (_, i) => ({ name: `I${i}`, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })));
    expect(await currentSeason(db)).toBeUndefined();
    await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "abc", leagues: { D1A: [added[1], added[0]], D2A: [added[2], added[3]] } });
    expect(await currentSeason(db)).toMatchObject({ id: "S01", number: 1, name: "Season 1", status: "draft", seed: "abc" });
    expect(await leagueRosters(db, "S01")).toEqual({ D1A: [added[1], added[0]], D2A: [added[2], added[3]] });
  });

  it("an unknown idol in a roster rolls the whole season back", async () => {
    await expect(createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "abc", leagues: { D1A: ["nobody"] } })).rejects.toThrow();
    expect(await currentSeason(db)).toBeUndefined();
  });
});

describe("replacing an idol in a roster", () => {
  it("keeps the place, and refuses a newcomer who already has one", async () => {
    const { added: [a, b, c] } = await addIdols(db, ["A", "B", "C"].map((name) => ({ name, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })));
    await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "x", leagues: { D1A: [a!, b!] } });
    await replaceInRoster(db, "S01", a!, c!);
    expect(await leagueRosters(db, "S01")).toEqual({ D1A: [c, b] });
    await expect(replaceInRoster(db, "S01", c!, b!)).rejects.toThrow("Pengganti sudah ada di roster D1A");
  });
});
