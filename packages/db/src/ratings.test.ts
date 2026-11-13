import { describe, expect, it } from "vitest";
import { addIdols, listIdols } from "./idols";
import { openDb } from "./openDb";
import { applyRatings, listRatingHistory, listSeasonRatingChanges } from "./ratings";
import { createDraftSeason } from "./seasons";

describe("rating changes (PRD §6)", () => {
  it("changes ratings in one go, logs old/new/source, clamps 1–100 and skips no-ops", async () => {
    const db = await openDb();
    const { added } = await addIdols(db, [{ name: "Mina", groupName: null, rating: 70, seed: null, nationality: null, birthday: null }]);
    const id = added[0]!;
    expect(await applyRatings(db, [{ idolId: id, new: 104, reason: "test" }], "manual")).toEqual({ changed: 1 });
    expect((await listIdols(db))[0]!.rating).toBe(100);
    expect(await applyRatings(db, [{ idolId: id, new: 100 }], "manual")).toEqual({ changed: 0 });
    expect((await listRatingHistory(db, id)).map((h) => [h.old, h.new, h.source, h.reason])).toEqual([[70, 100, "manual", "test"]]);
  });

  it("lists one season's changes, biggest first", async () => {
    const db = await openDb();
    const [a, b] = (await addIdols(db, ["A", "B"].map((name) => ({ name, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })))).added as [string, string];
    await createDraftSeason(db, { id: "S01", number: 1, name: "S1", seed: "s", leagues: {} });
    await applyRatings(db, [{ idolId: a, new: 72 }, { idolId: b, new: 65 }], "progression", "S01");
    await applyRatings(db, [{ idolId: a, new: 90 }], "manual");
    expect(await listSeasonRatingChanges(db, "S01")).toEqual([{ idolId: b, old: 70, new: 65, source: "progression" }, { idolId: a, old: 70, new: 72, source: "progression" }]);
  });
});
