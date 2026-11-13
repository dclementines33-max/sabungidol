import { expect, it } from "vitest";
import { rivalryLabel } from "./rivalryLabel";

it("names a pair only after enough meetings, from the first idol's side", () => {
  expect(rivalryLabel(2, 0, 1)).toBeNull(); // 3 meetings: too few
  expect(rivalryLabel(4, 0, 1)).toBe("Mangsa favorit");
  expect(rivalryLabel(1, 0, 4)).toBe("Momok");
  expect(rivalryLabel(4, 1, 4)).toBe("Rivalitas abadi");
  expect(rivalryLabel(6, 0, 3)).toBe("Rival lama");
  expect(rivalryLabel(3, 0, 2)).toBeNull();
});
