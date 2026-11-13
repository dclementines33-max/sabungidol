import { expect, it } from "vitest";
import { listEventsByCode, logEvent } from "./eventLog";
import { listGroups, setGroupLogo } from "./groups";
import { addIdols, listIdols, setIdolPhoto } from "./idols";
import { openDb } from "./openDb";
import { insertPhoto, setPhotoFocal } from "./photos";

it("a photo's focal point reaches the idol list (clamped), a group keeps its logo, events read back by code", async () => {
  const db = await openDb();
  const { added } = await addIdols(db, [{ name: "Wonyoung", groupName: "IVE", rating: 90, seed: null, nationality: null, birthday: null }]);
  await insertPhoto(db, { id: "p1", sizes: {}, bytes: 1 });
  await setIdolPhoto(db, added[0]!, "p1");
  expect((await listIdols(db))[0]).toMatchObject({ focalX: 0.5, focalY: 0.5 });
  await setPhotoFocal(db, "p1", 0.2, 1.4);
  expect((await listIdols(db))[0]).toMatchObject({ focalX: 0.2, focalY: 1 });

  const [group] = await listGroups(db);
  await setGroupLogo(db, group!.id, "logo1");
  expect((await listGroups(db))[0]!.logoId).toBe("logo1");

  await logEvent(db, { level: "info", code: "PREDICTION", message: "a", context: { matchId: "m1", pick: "x" } });
  await logEvent(db, { level: "info", code: "OTHER", message: "b" });
  expect((await listEventsByCode(db, "PREDICTION")).map((e) => e.message)).toEqual(["a"]);
});
