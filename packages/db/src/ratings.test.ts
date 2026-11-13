import { describe, expect, it } from "vitest";
import { addIdols, listIdols } from "./idols";
import { openDb } from "./openDb";
import { applyRatings, listRatingHistory } from "./ratings";

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
});
