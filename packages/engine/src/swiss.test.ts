import { describe, expect, it } from "vitest";
import { matchRng } from "./rng";
import { runSwiss } from "./swiss";
import { swissPairings } from "./swissPairing";

const seeds = Array.from({ length: 16 }, (_, i) => `seed${i + 1}`);

describe("Swiss pairing (PRD §5.6)", () => {
  it("round 1 is pot order: seed 1 v 16, 2 v 15 ...", () => {
    const { pairs, fallback } = swissPairings(seeds, [], matchRng("s", "r1"));
    expect(pairs[0]).toEqual(["seed1", "seed16"]);
    expect(pairs[7]).toEqual(["seed8", "seed9"]);
    expect(fallback).toBe(false);
  });

  it("later rounds pair equal records only", () => {
    const history = seeds.slice(0, 8).map((a, i) => ({ a, b: seeds[15 - i], winner: i % 2 === 0 ? a : seeds[15 - i] }));
    const wins = new Set(history.map((m) => m.winner));
    const { pairs } = swissPairings(seeds, history, matchRng("s", "r2"));
    for (const [a, b] of pairs) expect(wins.has(a)).toBe(wins.has(b));
  });

  it("falls back to the nearest record (and says so) when equal records cannot be paired", () => {
    // Records after two rounds: a 2–0, b 1–1, c 1–1, d 0–2. a and d have nobody with their record.
    const history = [
      { a: "a", b: "c", winner: "a" }, { a: "b", b: "d", winner: "b" },
      { a: "a", b: "b", winner: "a" }, { a: "c", b: "d", winner: "c" },
    ];
    const { pairs, fallback } = swissPairings(["a", "b", "c", "d"], history, matchRng("s", "y"));
    expect(fallback).toBe(true);
    expect(pairs.map((p) => [...p].sort().join("|")).sort()).toEqual(["a|d", "b|c"]);
  });

  it("throws when every pairing would be a rematch", () => {
    const history = [{ a: "a", b: "b", winner: "a" }];
    expect(() => swissPairings(["a", "b"], history, matchRng("s", "z"))).toThrow();
  });
});

describe("Swiss group of 16 (PRD §4, acceptance §5.10)", () => {
  it("10,000 random groups: never a rematch, 33 matches, and 2 / 3 / 3 idols finish 3–0 / 3–1 / 3–2", () => {
    let fallbacks = 0;
    for (let sim = 0; sim < 10_000; sim++) {
      const rng = matchRng("swiss", `sim${sim}`);
      const result = runSwiss(seeds, rng, () => (rng.next() < 0.5 ? "A" : "B"));
      const played = result.rounds.flat().map(([a, b]) => [a, b].sort().join("|"));
      expect(new Set(played).size).toBe(played.length);
      expect(played.length).toBe(33);
      const count = (w: number, l: number) => [...result.records.values()].filter((r) => r.wins === w && r.losses === l).length;
      expect([count(3, 0), count(3, 1), count(3, 2)]).toEqual([2, 3, 3]);
      fallbacks += result.fallbackRounds.length;
    }
    expect(fallbacks).toBeLessThan(100); // fallback is rare; the solver normally keeps records equal
  });
});
