import { expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { foldSeason } from "./careerStats";

const m = (comp: string, stage: string, a: string, b: string, result: "A" | "B") =>
  ({ id: `${comp}-${a}-${b}`, comp, stage, round: "R1", slot: 1, idolA: a, idolB: b, games: [], scoreA: result === "A" ? 2 : 0, scoreB: result === "B" ? 2 : 0, result, ratingA: 70, ratingB: 70, formA: "", formB: "" }) as SimMatch;

it("Swiss: 3 wins = through, 3 losses = out; LCQ: through when the idol plays the Unzure groups", () => {
  const swiss = [1, 2, 3].map((i) => m("SWS", "SW", "x", `o${i}`, "A")).concat([1, 2, 3].map((i) => m("SWS", "SW", `p${i}`, "y", "A")));
  const lcqOnly = [m("LCQ", "LQ", "p", "q", "A")];
  const before = foldSeason({}, 1, [...swiss, ...lcqOnly], []);
  expect(before["x|SWS"]).toMatchObject({ groupAdvance: 1, groupExit: 0 });
  expect(before["y|SWS"]).toMatchObject({ groupAdvance: 0, groupExit: 1 });
  expect(before["x|ALL"]?.groupAdvance).toBe(0); // only the competition's own line
  expect(before["p|LCQ"]?.groupExit).toBe(0); // no Unzure groups yet: nobody counted out
  const after = foldSeason({}, 1, [...lcqOnly, m("UZC", "GS", "p", "z", "B")], []);
  expect(after["p|LCQ"]).toMatchObject({ groupAdvance: 1, groupExit: 0 });
  expect(after["q|LCQ"]).toMatchObject({ groupAdvance: 0, groupExit: 1 });
});
