// Tests for the new seasonNews kinds (2026-11-17): revenge, domination, de-revenge, heated-rivalry.
import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { seasonNews } from "./seasonNews";
import { newsScore } from "./newsScore";

const m = (id: string, over: Partial<SimMatch>): SimMatch =>
  ({ id, comp: "D1A", stage: "LG", round: "MD01", slot: 1, idolA: "a", idolB: "b", games: [], scoreA: 2, scoreB: 0, result: "A", ratingA: 85, ratingB: 85, formA: "", formB: "", ...over }) as SimMatch;

// 20-idol league so MD38 exists; most idols play each other but we only need a few specific pairs.
const IDOLS = Array.from({ length: 20 }, (_, i) => String.fromCharCode(97 + i)); // a–t

// Build a minimal finished league: all matches between IDOLS at MD01+MD20, plus a final MD38 between "s"/"t".
// Using "s"/"t" for the MD38 marker gives them 3 meetings (skipped by revenge/dom code), keeping a–r pairs clean.
function leagueMatches(overrides: SimMatch[]): SimMatch[] {
  const base: SimMatch[] = IDOLS.flatMap((x, i) =>
    IDOLS.slice(i + 1).flatMap((y) => [
      m(`${x}${y}-1`, { idolA: x, idolB: y, round: "MD01", result: "A" }), // x wins leg 1
      m(`${x}${y}-2`, { idolA: y, idolB: x, round: "MD20", result: "B" }), // x wins leg 2 (idolB=x wins when result="B")
    ])
  );
  // MD38 marker so finished-league check passes. s-t already have 2 matches so they get a 3rd → skipped.
  base.push(m("finish", { idolA: "s", idolB: "t", round: "MD38", result: "A" }));
  // Apply overrides: replace base matches whose id matches an override's id.
  const ids = new Set(overrides.map((x) => x.id));
  return [...base.filter((x) => !ids.has(x.id)), ...overrides];
}

describe("seasonNews – revenge and domination", () => {
  it("revenge: idol loses leg 1 then wins leg 2", () => {
    // b beats a in leg 1, a beats b in leg 2.
    const matches = leagueMatches([
      m("ab-1", { idolA: "a", idolB: "b", round: "MD01", result: "B" }), // b wins leg 1
      m("ab-2", { idolA: "b", idolB: "a", round: "MD20", result: "B" }), // a (idolB) wins leg 2
    ]);
    const stories = seasonNews(matches, {}, new Map());
    expect(stories).toContainEqual({ kind: "revenge", idol: "a", foe: "b", comp: "D1A" });
    expect(stories).not.toContainEqual(expect.objectContaining({ kind: "domination", idol: "a", foe: "b" }));
  });

  it("domination: idol wins both legs", () => {
    // a beats b in both legs (base default: x wins both legs for every pair).
    const matches = leagueMatches([]);
    const stories = seasonNews(matches, {}, new Map());
    expect(stories).toContainEqual({ kind: "domination", idol: "a", foe: "b", comp: "D1A" });
    expect(stories).not.toContainEqual(expect.objectContaining({ kind: "revenge", idol: "a", foe: "b" }));
  });

  it("newsScore: revenge > domination", () => {
    expect(newsScore({ kind: "revenge", idol: "a", foe: "b", comp: "D1A" })).toBeGreaterThan(
      newsScore({ kind: "domination", idol: "a", foe: "b", comp: "D1A" })
    );
  });
});

describe("seasonNews – de-revenge", () => {
  it("idol loses to foe in earlier bracket round then beats them in a later round", () => {
    const matches = [
      m("r1", { comp: "UZC", stage: "KO", round: "QF", idolA: "a", idolB: "b", result: "B" }), // b beats a in QF
      m("r2", { comp: "UZC", stage: "KO", round: "SF", idolA: "c", idolB: "b", result: "A" }), // c beats b
      m("r3", { comp: "UZC", stage: "KO", round: "GF", idolA: "a", idolB: "b", result: "A" }), // a beats b in GF (via LB)
    ];
    const stories = seasonNews(matches, {}, new Map());
    expect(stories).toContainEqual({ kind: "de-revenge", idol: "a", foe: "b", comp: "UZC" });
  });

  it("no de-revenge when same idol wins both meetings", () => {
    const matches = [
      m("r1", { comp: "UZC", stage: "KO", round: "QF", idolA: "a", idolB: "b", result: "A" }),
      m("r2", { comp: "UZC", stage: "KO", round: "GF", idolA: "a", idolB: "b", result: "A" }),
    ];
    expect(seasonNews(matches, {}, new Map())).not.toContainEqual(expect.objectContaining({ kind: "de-revenge" }));
  });
});

describe("seasonNews – heated-rivalry", () => {
  it("two top-tier idols meeting in multiple top-tier comps qualify", () => {
    // UZC prestige 1.0 (≥0.8), IDL prestige 0.9 (≥0.8). Both idols rated ≥90.
    const matches = [
      m("u1", { comp: "UZC", stage: "KO", round: "QF", idolA: "a", idolB: "b", ratingA: 92, ratingB: 91, result: "A" }),
      m("u2", { comp: "UZC", stage: "KO", round: "SF", idolA: "b", idolB: "c", ratingA: 91, ratingB: 88, result: "A" }), // unrelated
      m("i1", { comp: "IDL", stage: "LG", round: "MD05", idolA: "b", idolB: "a", ratingA: 91, ratingB: 92, result: "A" }),
      m("i2", { comp: "IDL", stage: "LG", round: "MD20", idolA: "a", idolB: "b", ratingA: 92, ratingB: 91, result: "B" }),
    ];
    const stories = seasonNews(matches, {}, new Map());
    const hr = stories.find((s) => s.kind === "heated-rivalry" && (s as { a: string }).a === "a");
    expect(hr).toMatchObject({ kind: "heated-rivalry", meetings: 3, winsA: 1, winsB: 2 });
  });

  it("low-prestige comp excluded", () => {
    // D2 prestige 0.25 < 0.8: should not count.
    const matches = Array.from({ length: 3 }, (_, i) =>
      m(`d${i}`, { comp: "D2A", stage: "LG", round: `MD0${i + 1}`, idolA: "a", idolB: "b", ratingA: 92, ratingB: 91, result: "A" })
    );
    expect(seasonNews(matches, {}, new Map())).not.toContainEqual(expect.objectContaining({ kind: "heated-rivalry" }));
  });

  it("low-rated idol excluded", () => {
    const matches = Array.from({ length: 3 }, (_, i) =>
      m(`u${i}`, { comp: "UZC", stage: "KO", round: `R${i}`, idolA: "a", idolB: "b", ratingA: 92, ratingB: 85, result: "A" })
    );
    expect(seasonNews(matches, {}, new Map())).not.toContainEqual(expect.objectContaining({ kind: "heated-rivalry" }));
  });

  it("newsScore grows with meetings, capped at 85", () => {
    const base = { kind: "heated-rivalry" as const, a: "a", b: "b", winsA: 2, winsB: 1 };
    expect(newsScore({ ...base, meetings: 3 })).toBe(65);
    expect(newsScore({ ...base, meetings: 5 })).toBe(85);
    expect(newsScore({ ...base, meetings: 10 })).toBe(85); // capped
  });
});
