import { describe, expect, it } from "vitest";
import { STEP, crowd, isUpset, landing, seriesChance, spinMs, SPIN_MS, TENSE_MS, tension } from "./wheelMath";

describe("wheel rules", () => {
  it("is fair: below 0.5 is A, the pointer stops inside one of the winner's segments", () => {
    for (let i = 0; i < 1000; i++) {
      const r = i / 1000;
      const { winner, angle } = landing(r);
      expect(winner).toBe(r < 0.5 ? "A" : "B");
      expect(Math.floor(angle / STEP) % 2).toBe(winner === "A" ? 0 : 1);
    }
  });

  it("live series chance from the current score, every game 50:50", () => {
    expect(seriesChance(3, [])).toEqual({ A: 0.5, B: 0.5, D: 0 });
    expect(seriesChance(3, ["A"]).A).toBe(0.75);
    expect(seriesChance(5, ["A", "A"]).A).toBe(0.875);
    expect(seriesChance(4, ["A", "B", "A"])).toEqual({ A: 0.5, B: 0, D: 0.5 }); // Bo4 can end 2–2
    expect(seriesChance(3, ["A", "A"]).A).toBe(1);
  });

  it("tension: match point and the deciding game get a longer spin", () => {
    expect(tension(5, ["A", "A"])).toBe("match point");
    expect(tension(5, ["A", "A", "B", "B"])).toBe("decider");
    expect(tension(3, ["A"])).toBe("match point");
    expect(tension(3, ["A", "B"])).toBe("decider");
    expect(tension(5, ["A"])).toBeNull();
    expect(spinMs(5, [])).toBe(SPIN_MS);
    expect(spinMs(5, ["A", "A", "B", "B"])).toBe(TENSE_MS);
  });

  it("the crowd rises when it is close and the underdog leads; upsets need a 10-point gap", () => {
    expect(crowd(5, ["A", "B"], 80, 90)).toBeGreaterThan(crowd(5, ["A", "A"], 90, 80));
    expect(crowd(5, ["A"], 70, 90)).toBeGreaterThan(crowd(5, ["A"], 90, 70));
    expect(isUpset("A", 78, 90)).toBe(true);
    expect(isUpset("A", 85, 90)).toBe(false);
    expect(isUpset("D", 70, 90)).toBe(false);
  });
});
