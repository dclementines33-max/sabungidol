import { describe, expect, it } from "vitest";
import { boardTargets } from "./boardTargets";
import type { SimMatch } from "./types";

// A double round robin of 20 idols: i0 rated highest … i19 lowest. finish(id) = the power that decides results.
function league(comp: string, power: (id: string) => number, legs = 2): SimMatch[] {
  const ids = Array.from({ length: 20 }, (_, i) => `i${i}`);
  return ids.flatMap((a, i) => ids.slice(i + 1).flatMap((b) => Array.from({ length: legs }, (_, leg) => {
    const [x, y] = leg ? [b, a] : [a, b];
    return { id: `${comp}-${x}-${y}`, comp, stage: "LG", round: "MD01", slot: 1, idolA: x, idolB: y, games: [], scoreA: 0, scoreB: 0,
      result: power(x) > power(y) ? "A" : "B", ratingA: 90 - Number(x.slice(1)), ratingB: 90 - Number(y.slice(1)), formA: "", formB: "" } as SimMatch;
  })));
}
const of = (list: ReturnType<typeof boardTargets>, id: string) => list.find((t) => t.idolId === id)!;

describe("board targets", () => {
  it("D1: targets from the rating rank, graded on the final table", () => {
    // Results follow the ratings, except i3 (top-4 target) drops to 8th and i12 (survive) finishes 2nd.
    const power = (id: string) => ({ i3: 93.5, i12: 99.5 } as Record<string, number>)[id] ?? 100 - Number(id.slice(1));
    const t = boardTargets(league("D1A", power));
    expect(of(t, "i0")).toMatchObject({ kind: "title", place: 1, rank: 1, grade: "met" });
    expect(of(t, "i3")).toMatchObject({ kind: "top-4", rank: 8, grade: "missed" }); // still in the top half
    expect(of(t, "i12")).toMatchObject({ kind: "survive", place: 17, rank: 2, grade: "exceeded" });
    expect(of(t, "i19")).toMatchObject({ kind: "survive", rank: 20, grade: "failed" }); // relegated
    expect(t.filter((x) => x.kind === "top-half")).toHaveLength(6); // ranks 5–10
  });

  it("D2: title, promotion, top half, off the bottom 5; no grade before the league ends", () => {
    const t = boardTargets(league("D2B", (id) => 100 - Number(id.slice(1))));
    expect(of(t, "i1")).toMatchObject({ kind: "promotion", place: 3, grade: "met" });
    expect(of(t, "i15")).toMatchObject({ kind: "avoid-bottom", place: 15, rank: 16, grade: "failed" });
    const half = boardTargets(league("D2B", () => 1, 1));
    expect(of(half, "i0")).toMatchObject({ kind: "title", rank: null, grade: null });
  });
});
