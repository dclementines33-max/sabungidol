import { describe, expect, it } from "vitest";
import { matchPhotos } from "./matchPhotos";

const idols = [
  { id: "won", name: "Jang Wonyoung", groupName: "IVE" },
  { id: "yuna-itzy", name: "Yuna", groupName: "ITZY" },
  { id: "yuna-other", name: "Yuna", groupName: "Other" },
  { id: "iu", name: "IU", groupName: null },
  { id: "chae", name: "Kim Chaewon", groupName: "LE SSERAFIM" },
];
const file = (name: string) => new File([""], name);
const match = (name: string) => matchPhotos([file(name)], idols)[0]!;

describe("photo file → idol (fuzzy, PRD §8)", () => {
  it("is sure about an exact name, ignoring case, spaces, dashes and the extension", () => {
    expect(match("jang-wonyoung.webp")).toMatchObject({ idolId: "won", sure: true });
    expect(match("IU.JPG")).toMatchObject({ idolId: "iu", sure: true });
  });

  it("tells two idols with one name apart by the group in the file name", () => {
    expect(match("yuna_itzy.png")).toMatchObject({ idolId: "yuna-itzy", sure: true });
    expect(match("Other Yuna.png")).toMatchObject({ idolId: "yuna-other", sure: true });
    expect(match("yuna.png").sure).toBe(false); // which Yuna? the user picks
  });

  it("only suggests for a near miss, and gives up on something unlike any idol", () => {
    expect(match("kim chaewn.jpg")).toMatchObject({ idolId: "chae", sure: false });
    expect(match("IMG_20240101_123456.jpg")).toMatchObject({ idolId: null, sure: false });
  });
});
