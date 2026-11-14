import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { readBackupTables } from "./backupRead";
import { importBackup } from "./backupWrite";
import { addIdols, listIdols } from "./idols";
import { type Db, openDb } from "./openDb";
import { saveMatches } from "./saveMatches";
import { idols, ratingHistory, seasons } from "./schema";
import { createDraftSeason, leagueRosters } from "./seasons";

const idol = (name: string, groupName: string | null, rating = 70) => ({ name, groupName, rating, seed: null, nationality: null, birthday: null });
const asFile = (tables: unknown) => JSON.parse(JSON.stringify(tables)); // what a .sabung file keeps
let a: Db;
let b: Db;

beforeEach(async () => {
  [a, b] = await Promise.all([openDb(), openDb()]);
  const { added: [x, y] } = await addIdols(a, [idol("Mina", "Aurora", 92), idol("Yuna", "Aurora", 84)]);
  await createDraftSeason(a, { id: "S01", number: 1, name: "Season 1", seed: "s", leagues: { D1A: [x!, y!] } });
  await a.update(seasons).set({ status: "live" });
  await saveMatches(a, "S01", [{ id: "S01-D1A-LG-MD01-M01", comp: "D1A", stage: "LG", round: "MD01", idolA: x!, idolB: y!, games: ["A", "B", "A", "A"],
    scoreA: 3, scoreB: 1, result: "A", ratingA: 92, ratingB: 84, formA: "Steady", formB: "Steady" }]);
  await a.insert(ratingHistory).values({ idolId: x!, seasonId: "S01", old: 90, new: 92, source: "test" });
});

describe("backup (PRD §12.3)", () => {
  it("a full backup restored with Replace elsewhere gives back exactly the same data", async () => {
    await addIdols(b, [idol("Someone", null)]); // B's own data is replaced
    const full = asFile(await readBackupTables(a, "full"));
    const preview = await importBackup(b, full, "replace", true);
    expect(preview).toMatchObject({ added: 8, replaced: 1 }); // group, 2 idols, season, 2 entries, match, rating change
    expect(await listIdols(b)).toHaveLength(1); // the preview changed nothing
    await importBackup(b, full, "replace", false);
    expect(asFile(await readBackupTables(b, "full"))).toEqual(full);
  });

  it("Merge matches idols by name + group, keeps what exists, adds what is new, skips an existing played season", async () => {
    const { added: [mina] } = await addIdols(b, [idol("mina", "AURORA", 80)]); // same idol, another id and rating
    await createDraftSeason(b, { id: "S01", number: 1, name: "Season 1", seed: "t", leagues: {} });
    await b.update(seasons).set({ status: "live" });
    await saveMatches(b, "S01", [{ id: "S01-D1A-LG-MD01-M09", comp: "D1A", stage: "LG", round: "MD01", idolA: mina!, idolB: mina!, games: ["A", "A", "A"],
      scoreA: 3, scoreB: 0, result: "A", ratingA: 80, ratingB: 80, formA: "Steady", formB: "Steady" }]);
    const result = await importBackup(b, asFile(await readBackupTables(a, "full")), "merge", false);
    expect(result.conflicts).toEqual(["Mina (Aurora): rating here 80, in the backup 92 — keeping 80", "Season 1 already exists — skipped (use Replace to overwrite)"]);
    expect((await listIdols(b)).map((i) => `${i.name}:${i.rating}`)).toEqual(["mina:80", "Yuna:84"]);
    expect(await leagueRosters(b, "S01")).toEqual({}); // the skipped season's rows were not added
  });

  it("Merge lets an unplayed draft (a new device's Season 1) make way for the backup's played season", async () => {
    await createDraftSeason(b, { id: "S01", number: 1, name: "Season 1", seed: "t", leagues: {} });
    await importBackup(b, asFile(await readBackupTables(a, "full")), "merge", false);
    expect(await readBackupTables(b, "full").then((t) => t.matches?.length)).toBe(1);
  });

  it("a roster section finds this install's idols through their names", async () => {
    const { added: [m, y] } = await addIdols(b, [idol("Mina", "Aurora"), idol("Yuna", "Aurora")]);
    await importBackup(b, asFile(await readBackupTables(a, "roster")), "merge", false);
    expect(await leagueRosters(b, "S01")).toEqual({ D1A: [m, y] });
  });

  it("the base section (Update 3) holds idols, groups, ratings and one season's rosters, but no match; Merge restores it", async () => {
    const base = asFile(await readBackupTables(a, "base", "S01"));
    expect(Object.keys(base).sort()).toEqual(["competitions", "entries", "groups", "idol_keys", "idols", "photos", "seasons"]);
    await importBackup(b, base, "merge", false);
    expect((await listIdols(b)).map((i) => `${i.name}:${i.rating}`)).toEqual(["Mina:92", "Yuna:84"]);
    expect(Object.values(await leagueRosters(b, "S01"))[0]).toHaveLength(2);
    expect(await readBackupTables(b, "full").then((t) => t.matches)).toEqual([]);
  });

  it("the Rating section applies ratings by name + group and reports unknown idols", async () => {
    await addIdols(b, [idol("Mina", "Aurora", 70)]);
    const result = await importBackup(b, asFile(await readBackupTables(a, "rating")), "merge", false);
    expect(result.conflicts).toEqual(["Mina: rating 70 → 92"]);
    expect(result.unknown).toEqual(["Yuna (Aurora)"]);
    expect((await b.select().from(idols).where(eq(idols.name, "Mina")))[0]!.rating).toBe(92);
  });
});
