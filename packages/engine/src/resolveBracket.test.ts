import { describe, expect, it } from "vitest";
import { resolveBracket, runBracket } from "./bracket";
import { inkigayoTemplate } from "./doubleElimination";
import { knockoutTemplate } from "./knockout";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `s${i + 1}`);

describe("resolveBracket", () => {
  it("before any match: round 1 is filled, later rounds wait", () => {
    const cells = resolveBracket(knockoutTemplate([16]), ids(16), new Map());
    expect(cells[0]).toMatchObject({ round: "R1", a: "s1", b: "s2" });
    expect(cells.find((c) => c.round === "QF")).toMatchObject({ a: undefined, b: undefined, winner: undefined });
  });

  it("a played match sends its winner on, with the score", () => {
    const cells = resolveBracket(knockoutTemplate([16]), ids(16), new Map([["KO-R1-1", { winner: "s2", score: "2–1" }]]));
    expect(cells[0]).toMatchObject({ winner: "s2", score: "2–1" });
    expect(cells.find((c) => c.key === "KO-QF-1")).toMatchObject({ a: "s2", b: undefined });
  });

  it("losers drop into the lower bracket, and a full run matches runBracket", () => {
    const template = inkigayoTemplate();
    const run = runBracket(template, ids(6), () => "A");
    const cells = resolveBracket(template, ids(6), new Map(run.map((r) => [r.key, { winner: r.winner }])));
    for (const r of run) expect(cells.find((c) => c.key === r.key)).toMatchObject({ a: r.a, b: r.b, winner: r.winner });
  });
});
