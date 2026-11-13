import { classifyMatch } from "@sabung/shared";
import { describe, expect, it } from "vitest";
import { computeStandings } from "../standings";
import { openerPairs } from "./gala";
import { runSeason } from "./runSeason";
import { testSeason } from "./testRoster";

const input = testSeason();
const started = performance.now();
const season = runSeason(input);
const seconds = (performance.now() - started) / 1000;

const count = (prefix: string) => season.matches.filter((m) => m.comp.startsWith(prefix)).length;

describe("headless season (PRD §4)", () => {
  it("finishes well under 10 seconds", () => {
    expect(seconds).toBeLessThan(10);
  });

  it("plays the PRD number of matches per competition", () => {
    expect({
      D1: count("D1"), D2: count("D2"), IDL: count("IDL"), SWS: count("SWS"), LCQ: count("LCQ"), UZC: count("UZC"),
      INK: count("INK"), NUG: count("NUG"), BS: count("BS"), DSG: count("DSG"), MBK: count("MBK"),
    }).toEqual({ D1: 2280, D2: 2280, IDL: 380 + 16, SWS: 132, LCQ: 30, UZC: 96 + 32, INK: 8, NUG: 239, BS: 90, DSG: 0, MBK: 0 }); // Daesang + Music Bank open the NEXT season
    expect(season.matches.length).toBe(5583);
  });

  it("every match id is unique and reads back to its own competition and stage", () => {
    expect(new Set(season.matches.map((m) => m.id)).size).toBe(season.matches.length);
    for (const m of season.matches) expect(classifyMatch(m.id)).toMatchObject({ comp: m.comp, stage: m.stage, round: m.round, slot: m.slot });
  });

  it("guardrail §14.4: each idol plays exactly 38 matches in its own league", () => {
    for (const [code, ids] of Object.entries(input.leagues)) {
      for (const id of ids) {
        const played = season.matches.filter((m) => m.comp === code && (m.idolA === id || m.idolB === id)).length;
        expect(played).toBe(38);
      }
    }
  });

  it("Unzure Cup has 64 different idols and only Bo4 can draw", () => {
    const uzc = season.matches.filter((m) => m.comp === "UZC" && m.stage === "GS");
    expect(new Set(uzc.flatMap((m) => [m.idolA, m.idolB])).size).toBe(64);
    for (const m of season.matches) if (m.result === "D") expect(["LG", "GS"]).toContain(m.stage);
  });

  it("every title has a champion different from the runner-up", () => {
    expect(Object.keys(season.titles).length).toBe(12 + 1 + 4 + 6); // leagues + IDL, UZC/NUG/INK/IDL-PO, B-Side ×6 (no opener in season 1)
    for (const t of Object.values(season.titles)) expect(t!.champion).not.toBe(t!.runnerUp);
  });

  it("is deterministic: same input, same season", () => {
    expect(runSeason(testSeason())).toEqual(season);
  });

  it("golden: a fixed seed always gives this season (an unintended engine change shows up here)", () => {
    const checksum = season.matches.reduce((h, m) => (Math.imul(h ^ (m.scoreA * 8 + m.scoreB), 16777619) >>> 0), 2166136261);
    expect({ checksum, titles: season.titles, notices: season.notices }).toMatchSnapshot();
  });
});

describe("Unzure Cup qualification (PRD §4, guardrail §14.4)", () => {
  const rankOf = new Map<string, number>();
  for (const code of ["D1A", "D1B", "D1C", "D1D", "D1E", "D1F"] as const) {
    const lg = season.matches.filter((m) => m.comp === code);
    computeStandings(input.leagues[code].map((id) => ({ id, startRating: input.idols.find((i) => i.id === id)!.rating })), lg)
      .forEach((row) => rankOf.set(row.idolId, row.rank));
  }
  const idolsIn = (comp: string, stage?: string) =>
    new Set(season.matches.filter((m) => m.comp === comp && (!stage || m.stage === stage)).flatMap((m) => [m.idolA, m.idolB]));

  it("Swiss holds 64 idols ranked 7–17, never a direct qualifier (ranks 1–6)", () => {
    const swiss = [...idolsIn("SWS")];
    expect(swiss.length).toBe(64);
    expect(swiss.every((id) => rankOf.get(id)! >= 7 && rankOf.get(id)! <= 17)).toBe(true);
  });

  it("Unzure groups = 36 direct + 20 from Swiss + 8 from LCQ", () => {
    const groups = idolsIn("UZC", "GS");
    const swiss = idolsIn("SWS");
    const lcq = idolsIn("LCQ");
    const direct = [...groups].filter((id) => !swiss.has(id));
    expect(direct.length).toBe(36);
    expect(direct.every((id) => rankOf.get(id)! <= 6)).toBe(true);
    expect([...groups].filter((id) => swiss.has(id) && !lcq.has(id)).length).toBe(20);
    expect([...groups].filter((id) => lcq.has(id)).length).toBe(8);
    expect(lcq.size).toBe(12);
  });
});

describe("opener (user 2026-11-13: Daesang + Music Bank open the next season)", () => {
  it("pairs last season's champions, plays them first, and keeps a pending opener from holding up the leagues", () => {
    const first = runSeason(testSeason("opener", 1));
    const notices: string[] = [];
    const opener = openerPairs(first.titles, [], notices);
    expect(opener.DSG?.[0]).toBe(first.titles.IDL!.champion);
    expect(Object.keys(opener.MBK ?? {})).toEqual(["D1A", "D1B", "D1C", "D1D", "D1E", "D1F"]);
    const input = { ...testSeason("opener", 2), config: { off: [], bestOf: {}, tuning: { scale: 40, sigma: 4 }, opener } };
    const second = runSeason(input);
    expect(second.matches.slice(0, 7).map((m) => m.comp)).toEqual(["DSG", "MBK", "MBK", "MBK", "MBK", "MBK", "MBK"]);
    expect(second.titles.DSG).toBeTruthy();
    const held = runSeason({ ...input, target: (m) => m.comp !== "DSG" });
    expect(held.pending.map((m) => m.comp)).toEqual(["DSG"]);
    expect(held.titles.UZC).toBeTruthy(); // the cups still ran
    expect(held.done).toBe(false);
  });
});
