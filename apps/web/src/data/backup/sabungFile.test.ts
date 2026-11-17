import { strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { readSabung, writeSabung } from "./sabungFile";

const tables = { idols: [{ id: "a", name: "Mina", rating: 92 }, { id: "b", name: "Yuna", rating: 84 }], groups: [] };
const photos = { "p1/256.webp": new Uint8Array([1, 2, 3]) };

describe(".sabung file", () => {
  it("round-trips tables and photos, with a manifest of rows and checksums", async () => {
    const { bytes, manifest } = await writeSabung("idols", tables, photos, 2, new Date("2026-11-13T00:00:00Z"));
    expect(manifest).toMatchObject({ section: "idols", schemaVersion: 2, photos: 1, tables: { idols: { rows: 2 }, groups: { rows: 0 } } });
    const read = await readSabung(bytes, 2);
    expect(read.tables).toEqual(tables);
    expect(read.photos).toEqual(photos);
    expect((await writeSabung("idols", tables, photos, 2, new Date("2026-11-13T00:00:00Z"))).bytes).toEqual(bytes); // same data, same file
  });

  it("refuses a newer backup, a tampered table and a file that is not a backup", async () => {
    const { bytes } = await writeSabung("idols", tables, {}, 3);
    await expect(readSabung(bytes, 2)).rejects.toThrow("a newer app version");
    const files = unzipSync((await writeSabung("idols", tables, {}, 2)).bytes);
    files["data/idols.ndjson"] = strToU8('{"id":"a","name":"Mina","rating":99}\n{"id":"b","name":"Yuna","rating":84}');
    await expect(readSabung(zipSync(files), 2)).rejects.toThrow("Backup damaged: idols");
    await expect(readSabung(strToU8("hello"), 2)).rejects.toThrow("a .sabung backup (not a valid ZIP)");
    for (const manifest of ["{not json", '{"app":"sabung-idol","schemaVersion":1,"format":1}']) {
      await expect(readSabung(zipSync({ ...files, "manifest.json": strToU8(manifest) }), 2)).rejects.toThrow("isn't a Sabung Idol backup");
    }
  });

  it("reads an older backup (schema upgrades run in order)", async () => {
    const { bytes } = await writeSabung("idols", tables, {}, 1);
    expect((await readSabung(bytes, 2)).tables).toEqual(tables);
  });

  it("clamps idol fields: rating to 1–100, name trimmed to 60 chars", async () => {
    const bad = { idols: [{ id: "x", name: "  " + "A".repeat(70), rating: 150 }, { id: "y", name: "B", rating: 0 }], groups: [] };
    const { bytes } = await writeSabung("idols", bad, {}, 1);
    const { tables: t } = await readSabung(bytes, 1);
    expect(t.idols![0]).toMatchObject({ name: "A".repeat(60), rating: 100 });
    expect(t.idols![1]).toMatchObject({ rating: 1 });
  });
});
