import { describe, expect, it } from "vitest";
import { DAY_MS, STORY_MS, broadcastFrames } from "./broadcast";

const lg = (md: number) => ({ stage: "LG", round: `MD${String(md).padStart(2, "0")}` });

describe("broadcastFrames", () => {
  it("one frame per matchday from the first story; a story holds longer; the finale comes last", () => {
    const f = broadcastFrames([lg(3), lg(5)], true, 6);
    expect(f.map((x) => [x.day, x.at])).toEqual([[3, 0], [4, 0], [5, 1], [6, 1], [6, 2]]);
    expect(f.map((x) => x.ms)).toEqual([STORY_MS, DAY_MS, STORY_MS, DAY_MS, STORY_MS]);
  });
  it("playoff points after the league follow on the last matchday", () => {
    const f = broadcastFrames([lg(37), { stage: "UB", round: "QF" }], false, 38);
    expect(f.map((x) => [x.day, x.at])).toEqual([[37, 0], [38, 0], [38, 1]]);
  });
  it("no league story: just the final standings with each point", () => {
    expect(broadcastFrames([{ stage: "UB", round: "SF" }], true, 38).map((x) => [x.day, x.at])).toEqual([[38, 0], [38, 1]]);
  });
});
