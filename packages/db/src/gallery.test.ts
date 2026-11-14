import { describe, expect, it } from "vitest";
import { readBackupTables } from "./backupRead";
import { importBackup } from "./backupWrite";
import { setGallery } from "./gallery";
import { addIdols, listIdols } from "./idols";
import { unusedPhotoIds } from "./integrity";
import { openDb } from "./openDb";
import { forgetPhotos, insertPhoto } from "./photos";

const idol = (name: string) => ({ name, groupName: "IVE", rating: 80, seed: null, nationality: null, birthday: null });
const photo = (id: string) => ({ id, sizes: { orig: { w: 10, h: 10 } }, bytes: 1 });

describe("idol gallery", () => {
  it("is replaced as a whole, kept by the integrity check and dropped with a missing photo", async () => {
    const db = await openDb();
    const { added: [id] } = await addIdols(db, [idol("Liz")]);
    for (const p of ["g1", "g2", "g3", "x"]) await insertPhoto(db, photo(p));
    expect((await listIdols(db))[0]!.gallery).toEqual([]);
    expect(await setGallery(db, id!, ["g1", "g2"])).toEqual([]);
    expect(await setGallery(db, id!, ["g2", "g3"])).toEqual(["g1"]); // what left, for the caller to delete
    expect(await unusedPhotoIds(db)).toEqual(["g1", "x"]);
    await forgetPhotos(db, ["g2"]);
    expect((await listIdols(db))[0]!.gallery).toEqual(["g3"]);
  });

  it("comes along when a backup is merged into a database that has the idol without a gallery", async () => {
    const [a, b] = await Promise.all([openDb(), openDb()]);
    const { added: [id] } = await addIdols(a, [idol("Rei")]);
    await insertPhoto(a, photo("g1"));
    await setGallery(a, id!, ["g1"]);
    await addIdols(b, [idol("Rei")]); // the same idol, made on another device
    await importBackup(b, JSON.parse(JSON.stringify(await readBackupTables(a, "idols"))), "merge", false);
    expect((await listIdols(b))[0]!.gallery).toEqual(["g1"]);
  });
});
