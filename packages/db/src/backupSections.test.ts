// Every backup section into a fresh device and into one with play data, both modes (Update 4: "Data dasar" restored
// a live Season 6 on a new device; Replace of idols / roster / season failed on foreign keys or foreign idol ids).
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { type BackupSection, readBackupTables } from "./backupRead";
import { type ImportMode, importBackup } from "./backupWrite";
import { addIdols, listIdols } from "./idols";
import { type Db, openDb } from "./openDb";
import { saveMatches } from "./saveMatches";
import { startSeason } from "./seasonPlay";
import { createDraftSeason, currentSeason, leagueRosters } from "./seasons";
import { idols, matches, seasons } from "./schema";

// Same idol names on every device, but each device makes its own ids (as real installs do).
async function device(played: boolean, number = 1) {
  const db = await openDb();
  const ids = (await addIdols(db, Array.from({ length: 240 }, (_, i) => ({ name: `I${i}`, groupName: i % 2 ? "G" : null, rating: 70, seed: null, nationality: null, birthday: null })))).added;
  const leagues = Object.fromEntries([...D1_LEAGUES, ...D2_LEAGUES].map((c, l) => [c, ids.slice(l * 20, l * 20 + 20)]));
  const id = `S${String(number).padStart(2, "0")}`;
  await createDraftSeason(db, { id, number, name: `Season ${number}`, seed: "s", leagues, config: { opener: [["x", "y"]], off: [] } });
  if (played) {
    await startSeason(db, id, ids.slice(0, 20));
    await saveMatches(db, id, [{ id: `${id}-D1A-LG-MD01-M01`, comp: "D1A", stage: "LG", round: "MD01", idolA: ids[0]!, idolB: ids[1]!, games: ["A", "A", "A"], scoreA: 3, scoreB: 0, result: "A", ratingA: 70, ratingB: 70, formA: "Steady", formB: "Steady" }]);
  }
  return db;
}
const source = async () => {
  const db = await device(true, 6);
  await db.update(idols).set({ rating: 91 }).where(eq(idols.name, "I5"));
  return db;
};
const restore = async (from: Db, section: BackupSection, target: Db, mode: ImportMode) =>
  importBackup(target, JSON.parse(JSON.stringify(await readBackupTables(from, section, "S06"))), mode, false);
const summary = async (db: Db) => {
  const s = await currentSeason(db);
  return { season: s?.number, status: s?.status, seasons: (await db.select().from(seasons)).length, matches: (await db.select().from(matches)).length };
};

describe("backup sections", () => {
  it("Data dasar gives a new device Season 1 draft with the league rosters, never the live season", async () => {
    const from = await source();
    for (const mode of ["merge", "replace"] as const) {
      const db = await device(false);
      await restore(from, "base", db, mode);
      expect(await summary(db)).toEqual({ season: 1, status: "draft", seasons: 1, matches: 0 });
      const rosters = await leagueRosters(db, "S01");
      expect(Object.keys(rosters)).not.toContain("IDL");
      expect(Object.values(rosters).every((r) => r.length === 20)).toBe(true);
      expect(((await currentSeason(db))!.config as { opener?: unknown }).opener).toBeUndefined();
    }
  });

  it("Data dasar: Replace starts a played device over from Season 1 with the backup's ratings; Merge leaves it alone", async () => {
    const from = await source();
    const replaced = await device(true);
    await restore(from, "base", replaced, "replace");
    expect(await summary(replaced)).toEqual({ season: 1, status: "draft", seasons: 1, matches: 0 });
    expect((await listIdols(replaced)).find((i) => i.name === "I5")!.rating).toBe(91);
    const merged = await device(true);
    const result = await restore(from, "base", merged, "merge");
    expect(await summary(merged)).toEqual({ season: 1, status: "live", seasons: 1, matches: 1 });
    expect(result.conflicts.some((c) => c.includes("is already live"))).toBe(true);
  });

  it("Idol Replace updates idols matched by name + group and deletes nobody, even with matches played", async () => {
    const db = await device(true);
    await restore(await source(), "idols", db, "replace");
    expect((await listIdols(db)).find((i) => i.name === "I5")!.rating).toBe(91);
    expect(await summary(db)).toEqual({ season: 1, status: "live", seasons: 1, matches: 1 });
  });

  it("Roster goes into a draft season and is refused for a running one", async () => {
    const from = await source();
    const draft = await device(false);
    expect((await restore(from, "roster", draft, "replace")).conflicts).toEqual([]);
    expect(await summary(draft)).toEqual({ season: 1, status: "draft", seasons: 1, matches: 0 });
    const live = await device(true);
    expect((await restore(from, "roster", live, "replace")).conflicts[0]).toMatch(/is already live/);
  });

  it("Season and Full put played seasons in with this device's idol ids, without leaving an empty draft beside them", async () => {
    const from = await source();
    for (const section of ["season", "full"] as const) for (const mode of ["merge", "replace"] as const) {
      const db = await device(false);
      await restore(from, section, db, mode);
      expect(await summary(db)).toEqual({ season: 6, status: "live", seasons: 1, matches: 1 });
      const [m] = await db.select().from(matches);
      const names = new Map((await listIdols(db)).map((i) => [i.id, i.name]));
      expect([names.get(m!.idolA), names.get(m!.idolB)]).toEqual(["I0", "I1"]);
    }
  });
}, 600_000);
