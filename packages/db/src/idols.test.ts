import { beforeEach, describe, expect, it } from "vitest";
import { createSeason } from "./createSeason";
import { listGroups } from "./groups";
import { addIdols, deleteIdol, listIdols, setActive, setIdolPhoto, updateIdol } from "./idols";
import { insertPhoto } from "./photos";
import { type Db, openDb } from "./openDb";
import { saveMatches } from "./saveMatches";
import { createDraftSeason } from "./seasons";

let db: Db;
beforeEach(async () => {
  db = await openDb();
});

const idol = (name: string, groupName: string | null, rating = 70) => ({ name, groupName, rating, seed: null, nationality: null, birthday: null });

describe("idols and groups (PRD §3, §8)", () => {
  it("adds a batch, creating each group once, soloists without one", async () => {
    const result = await addIdols(db, [idol("Jang Wonyoung", "IVE", 92), idol("An Yujin", "ive"), idol("Yuna", null)]);
    expect(result.added).toHaveLength(3);
    expect(result.refused).toEqual([]);
    expect((await listGroups(db)).map((g) => g.name)).toEqual(["IVE"]);
    const rows = await listIdols(db);
    expect(rows.map((r) => [r.name, r.groupName])).toEqual([["An Yujin", "IVE"], ["Jang Wonyoung", "IVE"], ["Yuna", null]]);
    expect(rows.every((r) => r.active && /^[0-9A-Z]{26}$/.test(r.id))).toBe(true);
  });

  it("refuses exact duplicates, in the database and inside the batch, and reports them", async () => {
    await addIdols(db, [idol("Mina", "TWICE")]);
    const result = await addIdols(db, [idol("MINA", "twice"), idol("Mina", "Aurora"), idol("Karina", "aespa"), idol("karina", "AESPA")]);
    expect(result.added).toHaveLength(2); // Mina (Aurora) is a different idol; the second Karina is a copy
    expect(result.refused.map((r) => r.name)).toEqual(["MINA", "karina"]);
    expect(await listIdols(db)).toHaveLength(3);
  });

  it("refuses invalid data instead of saving it", async () => {
    await expect(addIdols(db, [idol("", null)])).rejects.toThrow();
    await expect(addIdols(db, [idol("A", null, 150)])).rejects.toThrow();
    expect(await listIdols(db)).toEqual([]);
  });

  it("changes an idol, but not into a duplicate", async () => {
    const { added: [mina, sana] } = await addIdols(db, [idol("Mina", "TWICE"), idol("Sana", "TWICE")]);
    expect(await updateIdol(db, sana, idol("Sana", "TWICE", 88))).toEqual({ ok: true });
    expect((await listIdols(db)).find((r) => r.id === sana)?.rating).toBe(88);
    expect(await updateIdol(db, sana, idol("mina", "TWICE"))).toEqual({ ok: false, reason: "Duplikat persis: Mina (TWICE) sudah ada" });
    expect(await updateIdol(db, mina, idol("Mina", "TWICE", 75))).toEqual({ ok: true }); // unchanged name is not a duplicate of itself
  });

  it("activates and deactivates", async () => {
    const { added } = await addIdols(db, [idol("A", null), idol("B", null)]);
    await setActive(db, added, false);
    expect((await listIdols(db)).map((r) => r.active)).toEqual([false, false]);
  });

  it("deletes an idol without matches; one with matches is kept (history)", async () => {
    const { added: [a, b, c] } = await addIdols(db, [idol("A", null), idol("B", null), idol("C", null)]);
    await createSeason(db, { id: "S01", number: 1, name: "S1", seed: "x" });
    await saveMatches(db, "S01", [{
      id: "S01-D1A-LG-MD01-M01", comp: "D1A", stage: "LG", round: "MD01", idolA: a, idolB: b, games: ["A", "A", "A"],
      scoreA: 3, scoreB: 0, result: "A", ratingA: 70, ratingB: 70, formA: "Steady", formB: "Steady",
    }]);
    expect(await deleteIdol(db, a)).toEqual({ deleted: false, matches: 1 });
    expect(await deleteIdol(db, c)).toEqual({ deleted: true, matches: 0 });
    expect((await listIdols(db)).map((r) => r.name)).toEqual(["A", "B"]);
  });

  it("refuses to delete an idol in a league roster, and says where", async () => {
    const { added: [a, b] } = await addIdols(db, [idol("A", null), idol("B", null)]);
    await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "x", leagues: { D1A: [a!] } });
    expect(await deleteIdol(db, a!)).toEqual({ deleted: false, matches: 0, roster: "D1A Season 1" });
    expect(await deleteIdol(db, b!)).toEqual({ deleted: true, matches: 0 });
  });

  it("sets a photo and hands back the old one", async () => {
    const { added: [a] } = await addIdols(db, [idol("A", null)]);
    for (const id of ["p1", "p2"]) await insertPhoto(db, { id, sizes: {}, bytes: 1 });
    expect(await setIdolPhoto(db, a!, "p1")).toBeNull();
    expect(await setIdolPhoto(db, a!, "p2")).toBe("p1");
    expect((await listIdols(db))[0]!.photoId).toBe("p2");
  });
});

describe("adding idols inside a larger transaction", () => {
  it("is all or nothing with the caller's other writes", async () => {
    const { insertPhoto } = await import("./photos");
    await expect(db.transaction(async (tx) => {
      await insertPhoto(tx, { id: "p1", sizes: { orig: { w: 1, h: 1 } }, bytes: 1 });
      await addIdols(tx, [{ ...idol("A", "G"), photoId: "p1" }]);
      throw new Error("tab closed halfway");
    })).rejects.toThrow("tab closed halfway");
    expect(await listIdols(db)).toEqual([]); // nothing half-written
    await db.transaction(async (tx) => {
      await insertPhoto(tx, { id: "p1", sizes: { orig: { w: 1, h: 1 } }, bytes: 1 });
      await addIdols(tx, [{ ...idol("A", "G"), photoId: "p1" }]);
    });
    expect((await listIdols(db)).map((r) => [r.name, r.photoId])).toEqual([["A", "p1"]]);
  });
});
