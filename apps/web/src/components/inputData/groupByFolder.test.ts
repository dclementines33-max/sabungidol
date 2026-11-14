import type { IdolRow } from "@sabung/db";
import { describe, expect, it } from "vitest";
import { groupByFolder } from "./GalleryImport";

const file = (path: string, type = "image/jpeg") => {
  const f = new File(["x"], path.split("/").pop()!, { type });
  Object.defineProperty(f, "webkitRelativePath", { value: path });
  return f;
};
const idol = (id: string, name: string, groupName: string | null) => ({ id, name, groupName }) as IdolRow;
const idols = [idol("liz", "Liz", "IVE"), idol("cw1", "Kim Chaewon", "LE SSERAFIM"), idol("cw2", "Kim Chaewon", "tripleS")];

describe("gallery folder import", () => {
  it("groups images by their folder, sorted, and matches the folder name to the idol", () => {
    const folders = groupByFolder([
      file("gallery/Liz IVE/02.jpg"), file("gallery/Liz IVE/01.jpg"), file("gallery/README.txt", "text/plain"),
      file("gallery/Kim Chaewon LE SSERAFIM/01.jpg"), file("gallery/Kim Chaewon/01.jpg"),
    ], idols);
    expect(folders.map((f) => [f.name, f.files.map((x) => x.name), f.idolId, f.sure])).toEqual([
      ["Liz IVE", ["01.jpg", "02.jpg"], "liz", true],
      ["Kim Chaewon LE SSERAFIM", ["01.jpg"], "cw1", true],
      ["Kim Chaewon", ["01.jpg"], "cw1", false], // a name in two groups: a suggestion, the user picks
    ]);
  });
});
