import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { countMatches } from "./countMatches";
import { addIdols, listIdols } from "./idols";
import { saveMatches } from "./saveMatches";
import { type Db, openDb } from "./openDb";
import { idols, ratingHistory, seasons } from "./schema";
import { createDraftSeason, currentSeason, leagueRosters, listCompetitions, replaceInRoster, resetSeason, saveCompetition, setLeagueRosters, updateSeason } from "./seasons";

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

describe("season settings in the database", () => {
  it("renames, stores config, replaces rosters while draft, and keeps branding per competition", async () => {
    const { added } = await addIdols(db, ["A", "B", "C"].map((name) => ({ name, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })));
    await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "x", leagues: { D1A: [added[0]!], D1B: [added[1]!] } });
    await updateSeason(db, "S01", { name: "Musim Satu", config: { off: ["NUG"] } });
    expect(await currentSeason(db)).toMatchObject({ name: "Musim Satu", config: { off: ["NUG"] } });

    await setLeagueRosters(db, "S01", { D1A: [added[2]!, added[0]!] });
    expect(await leagueRosters(db, "S01")).toEqual({ D1A: [added[2], added[0]], D1B: [added[1]] });

    await saveCompetition(db, "S01", "UZC", "Unzure", { color: "brand-rose" });
    await saveCompetition(db, "S01", "UZC", "Unzure Cup", { color: "brand-sky", logoId: null });
    expect(await listCompetitions(db, "S01")).toEqual([{ code: "UZC", name: "Unzure Cup", branding: { color: "brand-sky", logoId: null } }]);

    await updateSeason(db, "S01", { config: { off: [] } });
    await db.update(seasons).set({ status: "live" });
    await expect(setLeagueRosters(db, "S01", { D1A: [] })).rejects.toThrow("Roster hanya bisa diubah saat season masih draft");
  });
});

describe("Reset Season", () => {
  it("removes what the season played and gives idols their starting rating back", async () => {
    const { added: [a, b] } = await addIdols(db, ["A", "B"].map((name) => ({ name, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })));
    await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "x", leagues: { D1A: [a!, b!] } });
    await db.update(seasons).set({ status: "live" });
    await saveMatches(db, "S01", [{ id: "S01-D1A-LG-MD01-M01", comp: "D1A", stage: "LG", round: "MD01", idolA: a!, idolB: b!, games: ["A", "A", "A"],
      scoreA: 3, scoreB: 0, result: "A", ratingA: 70, ratingB: 70, formA: "Steady", formB: "Steady" }]);
    await db.insert(ratingHistory).values([{ idolId: a!, seasonId: "S01", old: 70, new: 73, source: "test" }, { idolId: a!, seasonId: "S01", old: 73, new: 75, source: "test" }]);
    await db.update(idols).set({ rating: 75 }).where(eq(idols.id, a!));

    await resetSeason(db, "S01");
    expect(await currentSeason(db)).toMatchObject({ status: "draft" });
    expect(await countMatches(db)).toBe(0);
    expect((await listIdols(db)).find((i) => i.id === a)!.rating).toBe(70);
    expect(await leagueRosters(db, "S01")).toEqual({ D1A: [a, b] }); // same rosters
  });
});
