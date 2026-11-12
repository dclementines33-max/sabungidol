// Replay (Fase 3 step 1): a season played in pieces, with saved results reused, is the same season;
// manual results flow into what follows; Settings (BoN, competitions off) are honoured.
import { readSeasonConfig } from "@sabung/shared";
import { describe, expect, it } from "vitest";
import { runSeason } from "./runSeason";
import { testSeason } from "./testRoster";
import type { SimMatch } from "./types";

const input = testSeason();
const whole = runSeason(input);
const key = (m: SimMatch) => `${m.id}:${m.idolA}-${m.idolB}:${m.games.join("")}`;

describe("season replay", () => {
  it("played in pieces of 2,000 new matches, it ends as the same season", () => {
    let saved: SimMatch[] = [];
    let steps = 0;
    for (;;) {
      let budget = 2000;
      const step = runSeason({ ...input, saved, target: () => budget-- > 0 });
      saved = step.matches;
      steps++;
      if (step.done) {
        expect(step.matches.map(key)).toEqual(whole.matches.map(key));
        expect(step.titles).toEqual(whole.titles);
        expect(step.pending).toEqual([]);
        break;
      }
      expect(step.pending.length).toBeGreaterThan(0); // something is waiting
    }
    expect(steps).toBeGreaterThan(2);
  });

  it("leagues can be played in any order; the cups wait for every league to finish", () => {
    const d1a = runSeason({ ...input, target: (m) => m.comp === "D1A" });
    expect(new Set(d1a.matches.map((m) => m.comp))).toEqual(new Set(["D1A"]));
    expect(d1a.matches).toHaveLength(380);
    expect(d1a.done).toBe(false);
    expect(d1a.pending.some((m) => m.comp === "D2F")).toBe(true);
    expect(d1a.pending.every((m) => m.stage === "LG")).toBe(true); // no cup started
  });

  it("a manual result changes what follows, and saved matches that no longer happen are stale", () => {
    const firstKo = whole.matches.findIndex((m) => m.comp === "NUG" && m.stage === "KO");
    const original = whole.matches[firstKo]!;
    const flipped: SimMatch = { ...original, games: original.games.map((g) => (g === "A" ? "B" : "A")), scoreA: original.scoreB, scoreB: original.scoreA, result: original.result === "A" ? "B" : "A" };
    const winner = flipped.result === "A" ? flipped.idolA : flipped.idolB;
    const before = whole.matches.slice(0, firstKo).filter((m) => m.comp !== "NUG" || m.stage !== "KO");
    const replay = runSeason({ ...input, saved: [...before, flipped] });
    expect(replay.matches.find((m) => m.id === original.id)!.result).toBe(flipped.result); // kept as entered
    expect(replay.matches.some((m) => m.comp === "NUG" && m.id !== original.id && (m.idolA === winner || m.idolB === winner))).toBe(true);

    const withOldFuture = runSeason({ ...input, saved: whole.matches.map((m) => (m.id === original.id ? flipped : m)) });
    expect(withOldFuture.stale.length).toBeGreaterThan(0);
    expect(withOldFuture.done).toBe(true);
  });

  it("honours Settings: a competition switched off is not played, BoN comes from the config", () => {
    const config = readSeasonConfig({ off: ["NUG"], bestOf: { "D1:LG": 5 } });
    const season = runSeason({ ...input, config });
    expect(season.done).toBe(true);
    expect(season.matches.some((m) => m.comp === "NUG")).toBe(false);
    expect(season.titles.NUG).toBeUndefined();
    const d1 = season.matches.filter((m) => m.comp.startsWith("D1") && m.stage === "LG");
    expect(d1.every((m) => m.result !== "D" && Math.max(m.scoreA, m.scoreB) === 3)).toBe(true); // Bo5: first to 3, no draws
  });
});
