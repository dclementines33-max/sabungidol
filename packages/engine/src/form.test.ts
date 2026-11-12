import { describe, expect, it } from "vitest";
import { getForm } from "./form";

describe("form (PRD §5.2)", () => {
  it("uses the last 5 matches", () => {
    expect(getForm(["W", "W", "W", "W", "W"])).toEqual({ name: "On Fire", modifier: 3 });
    expect(getForm(["L", "W", "W", "W", "W", "D"])).toEqual({ name: "Hot Streak", modifier: 2 }); // last 5 = 4.5
    expect(getForm(["W", "W", "W", "L", "L"])).toEqual({ name: "Confident", modifier: 1 });
    expect(getForm(["W", "W", "D", "L", "L"])).toEqual({ name: "Steady", modifier: 0 });
    expect(getForm(["W", "D", "L", "L", "L"])).toEqual({ name: "Cold Slump", modifier: -2 });
  });

  it("is Steady until an idol has played 5 matches (user decision)", () => {
    expect(getForm([])).toEqual({ name: "Steady", modifier: 0 });
    expect(getForm(["L", "L", "L", "L"])).toEqual({ name: "Steady", modifier: 0 });
  });
});
