import { describe, expect, it } from "vitest";
import { bestStored, fitWithin, sizesToMake } from "./photoSizes";

describe("photo sizes (PRD §10.3)", () => {
  it("fits inside the box keeping the shape, and never enlarges", () => {
    expect(fitWithin(2000, 2500, 256)).toEqual({ w: 205, h: 256 });
    expect(fitWithin(256, 220, 1024)).toEqual({ w: 256, h: 220 });
  });

  it("makes only the copies that are smaller than the original", () => {
    expect(sizesToMake(4000, 5000)).toEqual([64, 256, 1024]);
    expect(sizesToMake(256, 220)).toEqual([64]); // the default data's photos: the original is the 256 copy
    expect(sizesToMake(48, 60)).toEqual([]);
  });

  it("shows the smallest stored file that is big enough, else the biggest there is", () => {
    const seedPhoto = { orig: { w: 256, h: 220 }, "64": { w: 64, h: 55 } };
    expect(bestStored(seedPhoto, 64)).toBe("64");
    expect(bestStored(seedPhoto, 256)).toBe("orig");
    expect(bestStored(seedPhoto, 1024)).toBe("orig"); // no larger photo exists yet
    const big = { orig: { w: 3000, h: 3750 }, "64": { w: 51, h: 64 }, "256": { w: 205, h: 256 }, "1024": { w: 819, h: 1024 } };
    expect(bestStored(big, 1024)).toBe("1024");
  });
});
