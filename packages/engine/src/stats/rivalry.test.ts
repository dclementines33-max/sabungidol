import { describe, expect, it } from "vitest";
import { officialRivalries, rivalryOf } from "./rivalry";

const line = (winsA: number, draws: number, winsB: number) => ({ meetings: winsA + draws + winsB, winsA, winsB, draws });

describe("official rivalries", () => {
  it("tiers by meetings and how close the series is", () => {
    expect(rivalryOf("a", "b", line(5, 1, 5))?.tier).toBe("eternal");
    expect(rivalryOf("a", "b", line(4, 0, 3))?.tier).toBe("feud");
    expect(rivalryOf("a", "b", line(2, 0, 2))?.tier).toBe("rising");
    expect(rivalryOf("a", "b", line(5, 0, 0))?.tier).toBe("nemesis");
    expect(rivalryOf("a", "b", line(2, 0, 1))).toBeNull(); // 3 meetings: too few
    expect(rivalryOf("a", "b", line(3, 0, 1))).toBeNull(); // 4 meetings, lopsided but not yet a nemesis
  });

  it("the name is fixed for the pair, whichever side asks; the leader is named", () => {
    const x = rivalryOf("a", "b", line(5, 1, 4))!;
    const y = rivalryOf("b", "a", line(4, 1, 5))!;
    expect(x.name).toBe(y.name);
    expect(x.leader).toBe("a");
    expect(y.leader).toBe("a");
    expect(rivalryOf("a", "b", line(2, 0, 2))!.leader).toBeNull();
  });

  it("lists every pair that qualifies: the bigger tier first, then the hottest", () => {
    const list = officialRivalries({
      "a|b": { meetings: 12, winsLo: 6, winsHi: 5, draws: 1 },
      "a|c": { meetings: 4, winsLo: 2, winsHi: 2, draws: 0 },
      "b|c": { meetings: 3, winsLo: 1, winsHi: 2, draws: 0 },
      "c|d": { meetings: 6, winsLo: 4, winsHi: 2, draws: 0 }, // a feud, cooler than a level 5-meeting rising rivalry
      "d|e": { meetings: 5, winsLo: 2, winsHi: 2, draws: 1 },
    });
    expect(list.map((r) => `${r.a}|${r.b}:${r.tier}`)).toEqual(["a|b:eternal", "c|d:feud", "d|e:rising", "a|c:rising"]);
  });
});
