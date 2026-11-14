import { expect, it } from "vitest";
import { addGroup, listGroups } from "./groups";
import { openDb } from "./openDb";

it("adds a group once (case-insensitive) and refuses an empty name", async () => {
  const db = await openDb();
  const id = await addGroup(db, " KISS OF LIFE ");
  expect(await addGroup(db, "kiss of life")).toBe(id);
  expect((await listGroups(db)).map((g) => g.name)).toEqual(["KISS OF LIFE"]);
  await expect(addGroup(db, "  ")).rejects.toThrow("Group name is empty");
});
