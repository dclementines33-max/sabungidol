import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { seasonDrama } from "./seasonDrama";

const m = (comp: string, md: number, a: string, b: string, result: "A" | "B" | "D") =>
  ({ id: `${comp}-${md}-${a}`, comp, stage: "LG", round: `MD${String(md).padStart(2, "0")}`, slot: 1, idolA: a, idolB: b, games: [], scoreA: result === "A" ? 3 : 1, scoreB: result === "B" ? 3 : 1, result, ratingA: 0, ratingB: 0, formA: "", formB: "" }) as SimMatch;

describe("seasonDrama", () => {
  // "late" loses to f until matchday 30 (last place), then beats f every time (24 points); a–e only draw (~15 each).
  const five = ["a", "b", "c", "d", "e"];
  const list: SimMatch[] = [];
  for (let md = 1; md <= 38; md++) {
    list.push(m("D2A", md, "late", "f", md <= 30 ? "B" : "A"));
    list.push(m("D2A", md, five[md % 5]!, five[(md + 1) % 5]!, "D"));
  }

  it("finds a D2 idol who climbed into the top 3 after matchday 30 — only from finished leagues", () => {
    const late = seasonDrama(list, null).filter((s) => s.kind === "late-promotion");
    expect(late).toMatchObject([{ idol: "late", league: "D2A" }]);
    expect(late.every((s) => s.kind === "late-promotion" && s.from > 5 && s.to <= 3)).toBe(true);
    expect(seasonDrama(list.filter((x) => x.round !== "MD38"), null)).toEqual([]);
  });

  it("a league points record only when an earlier season set one, and only when beaten", () => {
    const best = seasonDrama(list, 0)[0];
    expect(best).toMatchObject({ kind: "points-record", league: "D2A", previous: 0 });
    expect(seasonDrama(list, 999).some((s) => s.kind === "points-record")).toBe(false);
    expect(seasonDrama(list, null).some((s) => s.kind === "points-record")).toBe(false);
  });
});
