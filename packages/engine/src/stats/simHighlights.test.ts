import { describe, expect, it } from "vitest";
import { roundRobin } from "../roundRobin";
import type { SimMatch } from "../season/types";
import { type Timeline, type TimelineStory, simHighlights } from "./simHighlights";

let n = 0;
const match = (comp: string, stage: string, round: string, a: string, b: string, result: "A" | "B" | "D", ratingA = 80, ratingB = 80) =>
  ({ id: `${comp}-${round}-${n++}`, comp, stage, round, slot: 1, idolA: a, idolB: b, games: [], scoreA: result === "A" ? 3 : 1, scoreB: result === "B" ? 3 : 1, result, ratingA, ratingB, formA: "", formB: "" }) as SimMatch;
const kinds = (t: Timeline) => t.points.flatMap((p) => p.stories.map((s) => s.kind));
const find = <K extends TimelineStory["kind"]>(t: Timeline, kind: K) => t.points.flatMap((p) => p.stories).filter((s): s is Extract<TimelineStory, { kind: K }> => s.kind === kind);

// An 8-idol D1 league (14 matchdays). b is strongest until MD3, then a wins everything and takes over; g collapses after MD6;
// h is rated 95 but loses everything.
const RATING: Record<string, number> = { a: 85, b: 84, c: 83, d: 82, e: 81, f: 80, g: 79, h: 95 };
const power = (id: string, day: number) => ({ a: day < 4 ? 1 : 10, b: day < 4 ? 9 : 2, c: 6, d: 5, e: 4, f: 3, g: day < 7 ? 7.5 : 0.5, h: 0 } as Record<string, number>)[id]!;
function league(comp = "D1A"): SimMatch[] {
  return roundRobin(Object.keys(RATING), { double: true }).flatMap((day, i) => day.map(([x, y]) =>
    match(comp, "LG", `MD${String(i + 1).padStart(2, "0")}`, x, y, power(x, i + 1) >= power(y, i + 1) ? "A" : "B", RATING[x], RATING[y])));
}

describe("simulation timeline", () => {
  it("shows only the competitions just played (The Idols after a league phase: no D1/D2 items)", () => {
    const d1 = league("D1A");
    const idl = league("IDL");
    const timelines = simHighlights({ matches: d1, titles: {} }, { matches: [...d1, ...idl], titles: {} });
    expect(timelines.map((t) => t.track)).toEqual(["IDL"]);
    expect(timelines[0]!.points.every((p) => p.comp === "IDL")).toBe(true);
    expect(kinds(timelines[0]!)).not.toContain("zone"); // The Idols has no promotion or relegation
  });

  it("a league: the takeover, the long lead, a collapse into the drop zone, a star outside the top 6, then the finale", () => {
    const [t] = simHighlights({ matches: [], titles: {} }, { matches: league(), titles: {} });
    expect(find(t!, "new-leader").at(-1)).toMatchObject({ idol: "a" });
    expect(find(t!, "upset").filter((u) => u.loser === "h")).toHaveLength(1); // h loses every week: one story, not fourteen
    expect(find(t!, "leader-run")[0]).toMatchObject({ idol: "a" });
    expect(find(t!, "zone").some((z) => z.idol === "g" && z.zone === "relegation" && z.entered)).toBe(true);
    expect(find(t!, "top-miss")).toMatchObject([{ idol: "h", rank: 8, rating: 95 }]);
    expect(t!.points.every((p) => /^MD\d\d$/.test(p.round))).toBe(true); // every point is a labelled matchday
    expect(t!.finale).toMatchObject({ champions: [{ title: "D1A", idol: "a" }], promoted: [] });
    expect(t!.finale!.relegated).toContain("h");
  });

  it("the finale leads with each decided competition's biggest title story, only when the title is new", () => {
    const titles = { D1A: { champion: "a", runnerUp: "b" } };
    const [t] = simHighlights({ matches: [], titles: {} }, { matches: league(), titles });
    expect(t!.finale!.news).toEqual([expect.objectContaining({ kind: "favourite-flop", idol: "h", title: "D1A", rank: 8 })]);
    const [season] = simHighlights({ matches: [], titles: {} }, { matches: [...league(), ...league("D1B")], titles: { ...titles, D1B: { champion: "a", runnerUp: "b" } } }, { season: true });
    expect(season!.finale!.news!.map((s) => s.title).sort()).toEqual(["D1A", "D1B"]);
    const played = league();
    expect(simHighlights({ matches: played.slice(0, -2), titles }, { matches: played, titles })[0]?.finale?.news).toEqual([]);
  });

  it("a quiet play has no timeline at all (no filler)", () => {
    const quiet = [match("D2A", "LG", "MD01", "x", "y", "A"), match("D2A", "LG", "MD01", "z", "w", "B")];
    expect(simHighlights({ matches: [], titles: {} }, { matches: quiet, titles: {} })).toEqual([]);
  });

  it("the Unzure road: a star out of the Swiss, a decider survived, who went through, a star out of the groups, a late escape", () => {
    const sw = [
      match("SWS", "SW", "A-R1", "s", "x1", "B", 95, 70), match("SWS", "SW", "A-R1", "t", "x2", "A", 92, 70), match("SWS", "SW", "A-R1", "q", "x3", "A", 80, 70),
      match("SWS", "SW", "A-R2", "s", "x4", "B", 95, 70), match("SWS", "SW", "A-R2", "t", "x5", "B", 92, 70), match("SWS", "SW", "A-R2", "q", "x6", "A", 80, 70),
      match("SWS", "SW", "A-R3", "s", "x7", "B", 95, 70), match("SWS", "SW", "A-R3", "t", "x8", "A", 92, 70), match("SWS", "SW", "A-R3", "q", "x9", "A", 80, 70),
      match("SWS", "SW", "A-R4", "t", "x10", "B", 92, 70), match("SWS", "SW", "A-R5", "t", "x11", "A", 92, 70),
    ];
    // Group A: X (95) ends third; Y was third after MD2 and goes through on MD3.
    const gs = [
      match("UZC", "GS", "A-MD1", "X", "Y", "A", 95, 80), match("UZC", "GS", "A-MD1", "Z", "W", "A", 85, 70),
      match("UZC", "GS", "A-MD2", "X", "Z", "B", 95, 85), match("UZC", "GS", "A-MD2", "Y", "W", "D", 80, 70),
      match("UZC", "GS", "A-MD3", "X", "W", "B", 95, 70), match("UZC", "GS", "A-MD3", "Y", "Z", "A", 80, 85),
    ];
    const [t] = simHighlights({ matches: [], titles: {} }, { matches: [...sw, ...gs], titles: {} });
    expect(t!.track).toBe("UZC");
    expect(find(t!, "failed").map((f) => [f.idol, f.stage])).toEqual([["s", "swiss"], ["X", "groups"]]);
    expect(find(t!, "escape")).toEqual(expect.arrayContaining([{ kind: "escape", idol: "t", comp: "SWS", how: "decider" }, { kind: "escape", idol: "Y", comp: "UZC", how: "last-matchday" }]));
    expect(find(t!, "qualified")[0]!.idols).toContain("q");
  });

  it("a knockout: a giant-killer's run, the final and the champion's path", () => {
    const ko = [match("INK", "KO", "QF", "c", "p", "A", 80, 92), match("INK", "KO", "SF", "c", "r", "A", 80, 90), match("INK", "KO", "F", "c", "u", "A", 80, 84)];
    const [t] = simHighlights({ matches: [], titles: {} }, { matches: ko, titles: { INK: { champion: "c", runnerUp: "u" } } });
    expect(kinds(t!)).toEqual(expect.arrayContaining(["shock-exit", "giant-killer", "final"]));
    expect(t!.points.map((p) => p.round)).toEqual(["QF", "SF", "F"]);
    expect(t!.finale!.path.map((s) => [s.round, s.opponent, s.won])).toEqual([["QF", "p", true], ["SF", "r", true], ["F", "u", true]]);
  });

  it("the whole season: one timeline with the big moments, stars who never reached the Unzure Cup, and all champions", () => {
    const d1 = league();
    const ko = [match("INK", "KO", "F", "c", "u", "A", 80, 84), match("BSA", "KO", "QF", "x", "y", "A", 70, 95)];
    const timelines = simHighlights({ matches: [], titles: {} }, { matches: [...d1, ...ko], titles: { INK: { champion: "c", runnerUp: "u" } }, draws: { pots: [["a", "b"]] } }, { season: true });
    expect(timelines).toHaveLength(1);
    expect(timelines[0]!.track).toBeNull();
    expect(find(timelines[0]!, "failed").map((f) => [f.idol, f.stage])).toEqual([["h", "unzure"]]);
    expect(kinds(timelines[0]!)).not.toContain("new-leader"); // routine league news stays in the league's own timeline
    expect(kinds(timelines[0]!)).not.toContain("shock-exit"); // an upset cup's upsets are routine
    expect(timelines[0]!.finale!.champions.map((c) => c.title)).toEqual(["D1A", "INK"]);
  });

  it("a heated-rivalry match is told when the favourite slips (a draw or the lower-rated idol wins), not when she wins", () => {
    const games = [match("D1B", "LG", "MD01", "a", "b", "A", 80, 90), match("D1B", "LG", "MD02", "a", "b", "A", 90, 80)];
    const [t] = simHighlights({ matches: [], titles: {} }, { matches: games, titles: {} }, { rivals: new Set(["a|b"]) });
    expect(find(t!, "rivalry-result")).toMatchObject([{ winner: "a", loser: "b", draw: false }]);
    expect(t!.points.map((p) => p.round)).toEqual(["MD01"]);
  });
});
