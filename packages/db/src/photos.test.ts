import { describe, expect, it } from "vitest";
import { type Db, openDb } from "./openDb";
import { deletePhoto, getPhoto, insertPhoto } from "./photos";

describe("photo records (PRD §12.1)", () => {
  it("stores sizes and bytes, with a centred focal point unless given", async () => {
    const db: Db = await openDb();
    await insertPhoto(db, { id: "p1", sizes: { orig: { w: 256, h: 220 }, "64": { w: 64, h: 55 } }, bytes: 6300 });
    expect(await getPhoto(db, "p1")).toEqual({ id: "p1", sizes: { orig: { w: 256, h: 220 }, "64": { w: 64, h: 55 } }, bytes: 6300, focalX: 0.5, focalY: 0.5 });
    await insertPhoto(db, { id: "p2", sizes: { orig: { w: 10, h: 10 } }, bytes: 1, focalX: 0.3, focalY: 0.2 });
    expect(await getPhoto(db, "p2")).toMatchObject({ focalX: 0.3, focalY: 0.2 });
    await deletePhoto(db, "p1");
    expect(await getPhoto(db, "p1")).toBeUndefined();
  });
});
