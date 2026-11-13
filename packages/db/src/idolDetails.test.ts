import { expect, it } from "vitest";
import { addIdols, listIdols, updateIdolDetails } from "./idols";
import { openDb } from "./openDb";

it("overwrites birthday, nationality and role by name + group, leaves the rating, lists unknown idols, previews without writing", async () => {
  const db = await openDb();
  await addIdols(db, [{ name: "Wonyoung", groupName: "IVE", rating: 90, seed: null, nationality: "JP", birthday: null }]);
  const rows = [
    { name: "wonyoung", group: "ive", birthday: "2004-08-31", nationality: "KR", role: "Center, Lead Vocalist" },
    { name: "Nobody", group: "IVE", birthday: "2000-01-01" },
  ];
  expect(await updateIdolDetails(db, rows, true)).toEqual({ updated: 1, unknown: ["Nobody (IVE)"] });
  expect((await listIdols(db))[0]).toMatchObject({ nationality: "JP", birthday: null, role: null }); // the preview wrote nothing
  await updateIdolDetails(db, rows, false);
  expect((await listIdols(db))[0]).toMatchObject({ rating: 90, nationality: "KR", birthday: "2004-08-31", role: "Center, Lead Vocalist" });
  await expect(updateIdolDetails(db, [{ name: "Wonyoung", group: "IVE", nationality: "Korea" }], true)).rejects.toThrow();
});
