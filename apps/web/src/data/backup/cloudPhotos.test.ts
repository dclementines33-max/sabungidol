import { expect, it } from "vitest";
import { type PhotoSizes, bestStored } from "../photoSizes";
import { cloudFile, withoutOriginals } from "./cloudPhotos";
import { readSabung, writeSabung } from "./sabungFile";

const big: PhotoSizes = { orig: { w: 4000, h: 5000, type: "image/jpeg" }, "64": { w: 51, h: 64 }, "256": { w: 205, h: 256 }, "1024": { w: 819, h: 1024 } };
const small: PhotoSizes = { orig: { w: 640, h: 800, type: "image/png" }, "64": { w: 51, h: 64 }, "256": { w: 205, h: 256 } };
const bytes = (n: number) => new Uint8Array(n);
const files = { "big/orig": bytes(9), "big/64": bytes(1), "big/256": bytes(2), "big/1024": bytes(3), "small/orig": bytes(4), "small/64": bytes(1), "small/256": bytes(2) };
const rows = [{ id: "big", sizes: big, bytes: 15 }, { id: "small", sizes: small, bytes: 7 }];

it("a cloud backup leaves out a big photo's original (record and file), keeps a small photo's, and every size still finds a file", async () => {
  const lean = withoutOriginals(rows, files);
  expect(Object.keys(lean.files).sort()).toEqual(["big/1024", "big/256", "big/64", "small/256", "small/64", "small/orig"]);
  expect(Object.keys(lean.photos[0]!.sizes as PhotoSizes)).not.toContain("orig");
  expect(lean.photos[1]!.sizes).toBe(small);
  expect(rows[0]!.sizes).toHaveProperty("orig"); // the device's own records are not touched

  // Restored on another device: whatever size a screen asks for is a file the backup carried.
  const { bytes: zip } = await writeSabung("idols", { photos: lean.photos }, lean.files, 5);
  const back = await readSabung(zip, 5);
  for (const row of back.tables.photos!) {
    for (const wanted of [64, 256, 1024, 4000]) expect(back.photos[`${row.id as string}/${bestStored(row.sizes as PhotoSizes, wanted)}`]).toBeDefined();
  }
});

it("cloud sync sends at most the 1024 copy: the original only when it is the photo's biggest file", () => {
  expect(cloudFile(big)).toBe("1024");
  expect(cloudFile(small)).toBe("orig");
});
