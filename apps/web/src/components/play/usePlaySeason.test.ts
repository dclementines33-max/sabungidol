import { describe, expect, it } from "vitest";
import { withNames } from "./usePlaySeason";

describe("withNames", () => {
  it("swaps idol ids in engine notices for names, leaving unknown ids", () => {
    const names: Record<string, string> = { "01JABCDEFGHJKMNPQRSTVWXYZ0": "Mina" };
    expect(withNames("Daesang Cup: 01JABCDEFGHJKMNPQRSTVWXYZ0 juara di kedua sisi; 01JZZZZZZZZZZZZZZZZZZZZZZZ", (id) => names[id]))
      .toBe("Daesang Cup: Mina juara di kedua sisi; 01JZZZZZZZZZZZZZZZZZZZZZZZ");
  });
});
